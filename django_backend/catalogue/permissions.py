from users.permissions import IsAuthorizedAdmin


class IsCatalogueAdmin(IsAuthorizedAdmin):
    message = "Catalogue changes require the authorized, verified admin account."
