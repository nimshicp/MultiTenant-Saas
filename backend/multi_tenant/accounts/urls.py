from django.urls import path
from .views import (
    LoginView,
    LogoutView,
    RefreshTokenView,
    CreateProjectManagerView,
    CurrentUserView,
    
)

urlpatterns = [
    
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', RefreshTokenView.as_view(), name='token-refresh'),
    
    path('me/', CurrentUserView.as_view(), name='current-user'),
    
    # Admin actions
    path('create-project-manager/', CreateProjectManagerView.as_view(), name='create-pm'),
]