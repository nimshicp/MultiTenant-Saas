from django.urls import path

from .views import (
    PlatformDashboardView,
    
)


urlpatterns = [
    
    path("dashboard/", PlatformDashboardView.as_view(), name="platform_dashboard"),
]
