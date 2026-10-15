from rest_framework.permissions import BasePermission


class IsOrderAdmin(BasePermission):
    message = "Order management requires an admin account."

    def has_permission(self, request, view):
        return bool(
            getattr(request.user, "is_authenticated", False)
            and getattr(request.user, "is_admin", False)
        )
