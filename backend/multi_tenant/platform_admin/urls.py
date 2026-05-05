from django.urls import path

from .views import (
    CurrentPlatformAdminView,
    PlatformDashboardView,
    PlatformHomeView,
    PlatformLoginView,
    PlatformLogoutView,
    PlatformRefreshTokenView,
    PlatformTenantsView,
)


urlpatterns = [
    path("", PlatformHomeView.as_view(), name="platform_home"),
    path("login/", PlatformLoginView.as_view(), name="platform_login"),
    path("refresh/", PlatformRefreshTokenView.as_view(), name="platform_refresh"),
    path("logout/", PlatformLogoutView.as_view(), name="platform_logout"),
    path("me/", CurrentPlatformAdminView.as_view(), name="platform_me"),
    path("dashboard/", PlatformDashboardView.as_view(), name="platform_dashboard"),
]
