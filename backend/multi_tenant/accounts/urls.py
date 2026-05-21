from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Authentication
    # path('register/', views.RegistrationAPIView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    
    # Token
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    
    # Profile
    path('profile/', views.UserProfileAPIView.as_view(), name='profile'),
    
    # MFA
    path('mfa/setup/', views.SetUpMFAAPIView.as_view(), name='mfa-setup'),
    path('mfa/verify-setup/', views.VerifyMFASetupAPIView.as_view(), name='mfa-verify-setup'),
    path('mfa/verify-login/', views.VerifyMFALoginAPIView.as_view(), name='mfa-verify-login'),
]