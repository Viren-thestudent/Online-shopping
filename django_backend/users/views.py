from django.db import IntegrityError, OperationalError
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


def error_response(message: str, response_status: int = status.HTTP_400_BAD_REQUEST) -> Response:
    return Response({"success": False, "message": message}, status=response_status)


def success_response(message: str, response_status: int = status.HTTP_200_OK, **data) -> Response:
    return Response({"success": True, "message": message, **data}, status=response_status)


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
            user={"name": user.name, "email": user.email, "is_admin": user.is_admin},
        )


class ProfileView(APIView):
    authentication_classes = [ORMJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return success_response(
            "Profile fetched successfully",
            user={
                "name": request.user.name,
                "email": request.user.email,
                "is_admin": request.user.is_admin,
            },
        )


class LogoutView(APIView):
    authentication_classes = [ORMJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return success_response("Logout successful")
