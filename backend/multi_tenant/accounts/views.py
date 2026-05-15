import pyotp

import datetime
from django_tenants.utils import schema_context

from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import InvalidToken

from django.contrib.auth import get_user_model

from accounts.serializers import RegistrationSerializer

from .serializers import LoginSerializer

User = get_user_model()


class RegistrationAPIView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = RegistrationSerializer(data=request.data)

        if not serializer.is_valid():
            print(f"DEBUG: Registration Serializer Errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = serializer.save()
        except Exception as e:
            print(f"DEBUG: Registration Save Error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        refresh = RefreshToken.for_user(user)

        # Rest of the success response...
        return Response(
            {
                "message": "Registration completed!",
                "data": {
                    "user": user.profile.full_name,
                    "tenant": (
                        user.profile.tenant.name if user.profile.tenant else "System"
                    ),
                    "subdomain": (
                        user.profile.tenant.schema_name.replace("tenant_", "")
                        if user.profile.tenant
                        else "admin"
                    ),
                    "plan": user.profile.tenant.currentsubscription.plan,
                },
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
            },
            status=status.HTTP_201_CREATED,
        )


class SetUpMFAAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if not user.mfa_secret:
            user.generate_mfa_secret()

        otp_uri = user.get_totp_uri()

        return Response({"otp_uri": otp_uri, "mfa_enabled": user.is_mfa_enabled})


class VerifyMFASetupAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        code = request.data.get("code").replace(" ", "")

        if not code:
            return Response(
                {"error": "Code required"}, status=status.HTTP_400_BAD_REQUEST
            )

        totp = pyotp.TOTP(user.mfa_secret)

        if totp.verify(code, valid_window=1):

            user.is_mfa_enabled = True

            user.save()

            return Response({"message": "MFA enabled successfully"})

        return Response({"error": "Invalid code"}, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})

        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data.get("user")

        # MFA FLOW

        # MFA FLOW (safe check)

        if getattr(user, "is_mfa_enabled", False):
            return Response(
                {
                    "message": "Secondary authentication required",
                    "mfa_required": True,
                    "email": user.email,
                },
                status=status.HTTP_202_ACCEPTED,
            )

        # NORMAL FLOW

        # Safely get role by switching to the correct tenant schema
        user_role = "SUPERADMIN"  # default for platform admins (no profile/tenant)
        if hasattr(user, 'profile') and user.profile.tenant:
            schema = user.profile.tenant.schema_name
            with schema_context(schema):
                try:
                    user_role = user.employee_profile.role
                except Exception:
                    user_role = "ADMIN"  # company owner fallback

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "message": "Successfully logged in!",
                "data": {
                    "user": user.profile.full_name if hasattr(user, 'profile') else user.email,
                    "role": user_role,
                    "tenant": (
                        user.profile.tenant.name if hasattr(user, 'profile') and user.profile.tenant else "System"
                    ),
                    "subdomain": (
                        user.profile.tenant.schema_name.replace("tenant_", "")
                        if hasattr(user, 'profile') and user.profile.tenant
                        else "admin"
                    ),
                    "plan": user.profile.tenant.currentsubscription.plan if hasattr(user, 'profile') and user.profile.tenant and hasattr(user.profile.tenant, 'currentsubscription') else None,
                },
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
            }
        )


class VerifyMFALoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        code = request.data.get("code", "").replace(" ", "")

        try:
            user = User.objects.get(email__iexact=email)

            totp = pyotp.TOTP(user.mfa_secret)

            if totp.verify(code, valid_window=2):
                # Safely get role by switching to the correct tenant schema
                user_role = "SUPERADMIN"
                if hasattr(user, 'profile') and user.profile.tenant:
                    schema = user.profile.tenant.schema_name
                    with schema_context(schema):
                        try:
                            user_role = user.employee_profile.role
                        except Exception:
                            user_role = "ADMIN"

                refresh = RefreshToken.for_user(user)

                return Response(
                    {
                        "message": "Successfully logged in!",
                        "data": {
                            "user": user.profile.full_name if hasattr(user, 'profile') else user.email,
                            "role": user_role,
                            "tenant": (
                                user.profile.tenant.name if hasattr(user, 'profile') and user.profile.tenant else "System"
                            ),
                            "subdomain": (
                                user.profile.tenant.schema_name.replace("tenant_", "")
                                if hasattr(user, 'profile') and user.profile.tenant
                                else "admin"
                            ),
                            "plan": user.profile.tenant.currentsubscription.plan if hasattr(user, 'profile') and user.profile.tenant and hasattr(user.profile.tenant, 'currentsubscription') else None,
                        },
                        "tokens": {
                            "refresh": str(refresh),
                            "access": str(refresh.access_token),
                        },
                    }
                )
            else:
                return Response(
                    {"error": "Invalid security code"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, status=status.HTTP_400_BAD_REQUEST
            )


class UserProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user  # Set by the JWTAuthentication class
        tenant = request.tenant  # Set by the django-tenants middleware

        return Response(
            {
                "identity": {"email": user.email, "full_name": user.profile.full_name},
                "other": {
                    "role": user.employee_profile.role if hasattr(user, 'employee_profile') else None,
                    "created_at": user.created_at,
                    "is_mfa_enabled": getattr(user, "is_mfa_enabled", False),
                },
                "tenant": {"name": tenant.name},
            }
        )


""" class CookieTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get('refresh')

        if refresh_token:
            request.data['refresh'] = refresh_token

        try:
            response = super().post(request, *args, **kwargs)
            
            if response.status_code == 200:
                new_access_token = response.data.get('access')
                
                response.set_cookie(
                    key='access',
                    value=new_access_token,
                    domain='.localhost',
                    httponly=False,
                    samesite='Lax'
                )
            return response

        except InvalidToken:
            return Response({"error": "Master session expired"}, status=status.HTTP_401_UNAUTHORIZED) """

from django.utils import timezone
from .models import PasswordResetToken
from django.core.mail import send_mail
from django.conf import settings

class RequestPasswordResetAPIView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"detail": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # For security, don't reveal if user exists. Just say "If email exists, link sent."
            return Response({"message": "If an account with this email exists, a password reset link has been sent."}, status=status.HTTP_200_OK)

        # Create token valid for 1 hour
        token = PasswordResetToken.objects.create(
            user=user,
            expires_at=timezone.now() + datetime.timedelta(hours=1)
        )

        # Build reset URL
        # In multi-tenant, we might want to reset from the specific subdomain or global admin
        # For now, let's assume the user starts from where they requested
        origin = request.headers.get('origin', 'http://localhost:5173')
        reset_url = f"{origin}/reset-password/{token.token}"

        send_mail(
            subject="Reset Your Password - BuildFlow",
            message=f"Hello,\n\nYou requested a password reset. Click the link below to set a new password:\n\n{reset_url}\n\nIf you did not request this, please ignore this email.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )

        return Response({"message": "Password reset link sent successfully."}, status=status.HTTP_200_OK)


class ConfirmPasswordResetAPIView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request, token):
        new_password = request.data.get('password')
        confirm_password = request.data.get('confirm_password')

        if not new_password or new_password != confirm_password:
            return Response({"detail": "Passwords must match and not be empty."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            reset_token = PasswordResetToken.objects.get(token=token)
        except PasswordResetToken.DoesNotExist:
            return Response({"detail": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)

        if not reset_token.is_valid:
            return Response({"detail": "Token is invalid or expired."}, status=status.HTTP_400_BAD_REQUEST)

        # Update password
        user = reset_token.user
        user.set_password(new_password)
        user.is_active = True # If they were blocked, reset password can potentially reactivate? 
        # Actually, if admin blocked them, maybe they shouldn't reset?
        # But usually forgot password is for forgotten passwords.
        user.save()

        # Mark token as used
        reset_token.is_used = True
        reset_token.save()

        return Response({"message": "Password has been reset successfully."}, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # If using blacklisting, you would blacklist the refresh token here
            # For now, we just return a success response as the frontend handles clearing tokens
            return Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
