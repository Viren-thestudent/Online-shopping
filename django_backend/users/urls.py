from django.urls import path

from .views import (
    LoginView,
    LogoutView,
    ProfileView,
    RegisterView,
    RequestEmailVerificationView,
    VerifyEmailView,
)


urlpatterns = [
    path("register", RegisterView.as_view(), name="register"),
    path("login", LoginView.as_view(), name="login"),
    path("profile", ProfileView.as_view(), name="profile"),
    path("logout", LogoutView.as_view(), name="logout"),
    path("request-email-verification", RequestEmailVerificationView.as_view(), name="request-email-verification"),
    path("verify-email", VerifyEmailView.as_view(), name="verify-email"),
]
