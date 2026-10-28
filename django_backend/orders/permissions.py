from users.permissions import IsAuthorizedAdmin


class IsOrderAdmin(IsAuthorizedAdmin):
    message = "Order management requires the authorized, verified admin account."
