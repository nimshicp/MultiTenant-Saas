from django.urls import path

from .views import (
    CurrentPlatformAdminView,
    PlatformDashboardView,
    
    
)


urlpatterns = [
    path("me/", CurrentPlatformAdminView.as_view(), name="platform_me"),
    path("dashboard/", PlatformDashboardView.as_view(), name="platform_dashboard"),
]
