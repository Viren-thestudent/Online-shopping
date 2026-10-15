from uuid import uuid4

from django.contrib.auth.hashers import check_password, make_password
from django.db import models


def generate_user_id():
    """Keep the existing compact string identifier shape used by JWTs."""
    return uuid4().hex


class User(models.Model):
    """Application user stored in PostgreSQL through Django's ORM."""

    id = models.CharField(primary_key=True, max_length=32, default=generate_user_id, editable=False)
    name = models.CharField(max_length=120)
    email = models.EmailField(unique=True, db_index=True)
    password = models.CharField(max_length=128)
    is_admin = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    @property
    def is_authenticated(self):
        return True

    @property
    def is_active(self):
        return True

    def set_password(self, raw_password):
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self.password)

    def __str__(self):
        return self.email
