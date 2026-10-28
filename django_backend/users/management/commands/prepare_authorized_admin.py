from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from users.authorization import (
    AUTHORIZED_ADMIN_EMAIL,
    VERIFICATION_TOKEN_TTL,
    issue_verification_token,
    verification_url,
)
from users.models import User


class Command(BaseCommand):
    help = "Prepare the existing authorized admin account without creating or resetting an account."

    def add_arguments(self, parser):
        parser.add_argument("--email", default=AUTHORIZED_ADMIN_EMAIL)
        parser.add_argument("--base-url", default="http://127.0.0.1:8000")

    def handle(self, *args, **options):
        email = options["email"].strip().lower()
        if email != AUTHORIZED_ADMIN_EMAIL:
            raise CommandError(f"Only {AUTHORIZED_ADMIN_EMAIL} is permitted as the authorized admin email.")

        user = User.objects.filter(email__iexact=AUTHORIZED_ADMIN_EMAIL).first()
        if user is None:
            raise CommandError(
                "No existing account was found. Create the account through the normal registration flow first; "
                "this command never creates users or sets passwords."
            )

        if not user.is_admin:
            user.is_admin = True
            user.save(update_fields=["is_admin", "updated_at"])
            self.stdout.write(self.style.SUCCESS(f"Existing account {user.email} is now marked as the admin candidate."))
        else:
            self.stdout.write(f"Existing account {user.email} is already marked as the admin candidate.")

        if not user.email_verified:
            self.stdout.write("Email verification is still required before admin APIs become available.")
            if settings.DEBUG:
                token = issue_verification_token(user)
                local_url = verification_url(token, options["base_url"])
                self.stdout.write(self.style.SUCCESS("Local verification URL (copy or open it):"))
                self.stdout.write(local_url)
                self.stdout.write(
                    f"Expires at: {user.email_verification_expires_at.isoformat()} "
                    f"({int(VERIFICATION_TOKEN_TTL.total_seconds() // 60)} minutes after generation)."
                )
            else:
                self.stdout.write("A verification link was not printed because DEBUG=False.")
        else:
            self.stdout.write(self.style.SUCCESS("The existing admin email is already verified."))
