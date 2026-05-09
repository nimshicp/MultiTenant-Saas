from django.urls import include, path

urlpatterns = [
    path("api/auth/", include("authentication.urls")),
    path("api/platform/", include("platform_admin.urls")),
    path("api/", include("customers.urls")),
]
