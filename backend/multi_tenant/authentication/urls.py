from django.urls import path

from .views import (
LoginView,
LogoutView,
RefreshTokenView
)

urlpatterns = [

path(
    "login/",
    LoginView.as_view()
),

path(
    "logout/",
    LogoutView.as_view()
),

path(
    "refresh/",
    RefreshTokenView.as_view()
),


]
