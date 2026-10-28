from django.conf import settings
from django.db import IntegrityError, OperationalError, transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.tokens import AccessToken

from .models import User
from .serializers import LoginSerializer, RegisterSerializer
from .authorization import (
    AUTHORIZED_ADMIN_EMAIL,
    is_authorized_admin,
    is_authorized_admin_candidate,
    issue_verification_token,
    send_verification_email,
    tokens_match,
    verification_path,
)


def error_response(message: str, response_status: int = status.HTTP_400_BAD_REQUEST) -> Response:
    return Response({"success": False, "message": message}, status=response_status)


def success_response(message: str, response_status: int = status.HTTP_200_OK, **data) -> Response:
    return Response({"success": True, "message": message, **data}, status=response_status)


def account_access_payload(user: User) -> dict:
    return {
        "name": user.name,
        "email": user.email,
        "is_admin": user.is_admin,
        "is_email_verified": user.email_verified,
        "can_request_admin_verification": is_authorized_admin_candidate(user),
        "can_access_admin": is_authorized_admin(user),
    }


class ORMJWTAuthentication(JWTAuthentication):
    """Validate Simple JWT tokens and load users from PostgreSQL via Django ORM."""

    def get_user(self, validated_token):
        user_id = validated_token.get(api_settings.USER_ID_CLAIM)
        if not user_id:
            raise AuthenticationFailed("Invalid token", code="token_not_valid")

        try:
            user = User.objects.get(pk=str(user_id))
        except User.DoesNotExist:
            raise AuthenticationFailed("User not found", code="user_not_found")
        except OperationalError:
            raise AuthenticationFailed("Unable to verify user", code="user_not_found")

        if not user.is_active:
            raise AuthenticationFailed("User is inactive", code="user_inactive")

        return user


def create_access_token(user: User) -> str:
    token = AccessToken()
    token[api_settings.USER_ID_CLAIM] = str(user.id)
    return str(token)


class RegisterView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        try:
            is_valid = serializer.is_valid()
        except OperationalError:
            return error_response("Unable to connect to database", status.HTTP_503_SERVICE_UNAVAILABLE)

        if not is_valid:
            email_errors = serializer.errors.get("email", [])
            if any(getattr(error, "code", None) == "unique" for error in email_errors):
                return error_response("Email already registered", status.HTTP_409_CONFLICT)
            return error_response(next(iter(serializer.errors.values()))[0])

        data = serializer.validated_data
        try:
            user = User(
                name=data["name"].strip(),
                email=data["email"],
            )
            user.set_password(data["password"])
            user.save()
        except IntegrityError:
            return error_response("Email already registered", status.HTTP_409_CONFLICT)
        except OperationalError:
            return error_response("Unable to connect to database", status.HTTP_503_SERVICE_UNAVAILABLE)

        return success_response("Registration successful", status.HTTP_201_CREATED, user_id=user.id)


class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(next(iter(serializer.errors.values()))[0])

        data = serializer.validated_data
        try:
            user = User.objects.filter(email__iexact=data["email"]).first()
        except OperationalError:
            return error_response("Unable to connect to database", status.HTTP_503_SERVICE_UNAVAILABLE)

        if user is None or not user.check_password(data["password"]):
            return error_response("Invalid email or password", status.HTTP_401_UNAUTHORIZED)

        return success_response(
            "Login successful",
            token=create_access_token(user),
            user=account_access_payload(user),
        )


class ProfileView(APIView):
    authentication_classes = [ORMJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return success_response(
            "Profile fetched successfully",
            user=account_access_payload(request.user),
        )


class LogoutView(APIView):
    authentication_classes = [ORMJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return success_response("Logout successful")


class RequestEmailVerificationView(APIView):
    authentication_classes = [ORMJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not is_authorized_admin_candidate(request.user):
            return error_response("Only the existing authorized admin account can request administrator verification.", status.HTTP_403_FORBIDDEN)
        if request.user.email_verified:
            return success_response("Administrator email is already verified.")

        token = issue_verification_token(request.user)
        verification_url = request.build_absolute_uri(verification_path(token))
        using_console_backend = settings.EMAIL_BACKEND.endswith("console.EmailBackend")

        try:
            if not using_console_backend:
                send_verification_email(request.user, verification_url)
        except Exception:
            return error_response("Email delivery is not configured or is temporarily unavailable.", status.HTTP_503_SERVICE_UNAVAILABLE)

        if using_console_backend:
            if not settings.DEBUG:
                return error_response("Email delivery is not configured.", status.HTTP_503_SERVICE_UNAVAILABLE)
            return success_response(
                "Development verification link generated; no email was sent.",
                development_verification_url=verification_url,
            )
        return success_response("Verification email sent.")


class VerifyEmailView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def _verify(self, token):
        if not token or len(token) > 200:
            return error_response("This verification link is invalid or expired.")

        with transaction.atomic():
            candidate = User.objects.select_for_update().filter(
                email_verification_token_hash__isnull=False,
            ).filter(
                email__iexact=AUTHORIZED_ADMIN_EMAIL,
            ).first()
            if (
                candidate is None
                or not candidate.is_admin
                or candidate.email_verified
                or not tokens_match(candidate.email_verification_token_hash, token)
                or candidate.email_verification_expires_at is None
                or candidate.email_verification_expires_at <= timezone.now()
            ):
                return error_response("This verification link is invalid or expired.")

            candidate.email_verified = True
            candidate.email_verification_token_hash = None
            candidate.email_verification_expires_at = None
            candidate.save(update_fields=["email_verified", "email_verification_token_hash", "email_verification_expires_at", "updated_at"])

        return success_response("Administrator email verified successfully.")

    def post(self, request):
        return self._verify(str(request.data.get("token", "")).strip())

    def get(self, request):
        return self._verify(str(request.query_params.get("token", "")).strip())
