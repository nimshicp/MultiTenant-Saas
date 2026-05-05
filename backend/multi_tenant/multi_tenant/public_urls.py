from django.urls import include, path

urlpatterns = [
    path("api/platform/", include("platform_admin.urls")),
    path("api/", include("customers.urls")),
]
