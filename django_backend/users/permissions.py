from rest_framework.permissions import BasePermission

from .authorization import is_authorized_admin


class IsAuthorizedAdmin(BasePermission):
    message = "Administrator access requires the authorized, verified admin account."

    def has_permission(self, request, view):
        return is_authorized_admin(request.user)
