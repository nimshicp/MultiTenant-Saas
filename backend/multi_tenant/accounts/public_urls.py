from rest_framework_simplejwt.views import TokenRefreshView

from django.urls import path

from . import views


urlpatterns = [
    path('register/', views.RegistrationAPIView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),

    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),

    path('password-reset/', views.RequestPasswordResetAPIView.as_view(), name='password-reset-request'),
    path('password-reset-confirm/<str:token>/', views.ConfirmPasswordResetAPIView.as_view(), name='password-reset-confirm'),

    # MFA
    path('mfa/setup/', views.SetUpMFAAPIView.as_view(), name='mfa-setup'),
    path('mfa/verify-setup/', views.VerifyMFASetupAPIView.as_view(), name='mfa-verify-setup'),
    path('mfa/verify-login/', views.VerifyMFALoginAPIView.as_view(), name='mfa-verify-login'),
]