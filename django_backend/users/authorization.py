import hashlib
import hmac
import secrets
from datetime import timedelta
from urllib.parse import urlencode

from django.conf import settings
from django.core.mail import send_mail
from django.urls import reverse
from django.utils import timezone


AUTHORIZED_ADMIN_EMAIL = "virendabhani@gmail.com"
VERIFICATION_TOKEN_TTL = timedelta(minutes=30)


def is_authorized_admin(user):
    return bool(
        getattr(user, "is_authenticated", False)
        and getattr(user, "is_admin", False)
        and getattr(user, "email", "").strip().lower() == AUTHORIZED_ADMIN_EMAIL
        and getattr(user, "email_verified", False)
    )


def is_authorized_admin_candidate(user):
    return bool(
        getattr(user, "is_authenticated", False)
        and getattr(user, "email", "").strip().lower() == AUTHORIZED_ADMIN_EMAIL
        and getattr(user, "is_admin", False)
    )


def issue_verification_token(user):
    raw_token = secrets.token_urlsafe(32)
    user.email_verification_token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    user.email_verification_expires_at = timezone.now() + VERIFICATION_TOKEN_TTL
    user.save(update_fields=["email_verification_token_hash", "email_verification_expires_at", "updated_at"])
    return raw_token


def verification_path(token):
    return f"{reverse('verify-email')}?{urlencode({'token': token})}"


def verification_url(token, base_url):
    return f"{base_url.rstrip('/')}{verification_path(token)}"


def verify_token_hash(token):
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def send_verification_email(user, verification_url):
    return send_mail(
        subject="Verify your Knot & Bloom administrator email",
        message=(
            "Use this link to verify your Knot & Bloom administrator email. "
            f"The link expires in 30 minutes:\n\n{verification_url}"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )


def tokens_match(stored_hash, token):
    return bool(stored_hash and hmac.compare_digest(stored_hash, verify_token_hash(token)))
