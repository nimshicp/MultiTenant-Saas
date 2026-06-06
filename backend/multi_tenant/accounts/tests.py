from datetime import timedelta
from types import SimpleNamespace
from unittest.mock import patch

import pyotp
import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from accounts.models import PasswordResetToken
from accounts.serializers import LoginSerializer, UserSerializer
from accounts.views import (
    ConfirmPasswordResetAPIView,
    RegistrationAPIView,
    RequestPasswordResetAPIView,
    SetUpMFAAPIView,
    UserProfileAPIView,
    VerifyMFALoginAPIView,
    VerifyMFASetupAPIView,
)


pytestmark = pytest.mark.django_db


def test_user_serializer_accepts_matching_passwords():
    serializer = UserSerializer(
        data={
            "email": "new@example.com",
            "password": "StrongPass123!",
            "confirm_password": "StrongPass123!",
        }
    )

    assert serializer.is_valid(), serializer.errors


def test_user_serializer_rejects_mismatched_passwords():
    serializer = UserSerializer(
        data={
            "email": "new@example.com",
            "password": "StrongPass123!",
            "confirm_password": "DifferentPass123!",
        }
    )

    assert not serializer.is_valid()
    assert "non_field_errors" in serializer.errors


def test_registration_view_rejects_invalid_payload(api_client):
    response = api_client.post("/auth/register/", {}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST



def test_login_serializer_rejects_missing_password():
    serializer = LoginSerializer(data={"email": "user@example.com"})

    assert not serializer.is_valid()
    assert "password" in serializer.errors


def test_login_serializer_rejects_invalid_credentials(user):
    serializer = LoginSerializer(
        data={
            "email": user.email,
            "password": "WrongPassword123!",
        }
    )

    assert not serializer.is_valid()
    assert "Invalid email or password." in str(serializer.errors)


def test_login_view_returns_tokens_for_valid_user(api_client, user):
    response = api_client.post(
        "/auth/login/",
        {
            "email": user.email,
            "password": "StrongPass123!",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    assert "tokens" in response.data
    assert response.data["data"]["user"] == user.email
    assert response.data["data"]["role"] == "SUPERADMIN"


def test_login_view_returns_mfa_required_for_enabled_user(api_client, mfa_user):
    response = api_client.post(
        "/auth/login/",
        {
            "email": mfa_user.email,
            "password": "StrongPass123!",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_202_ACCEPTED
    assert response.data["mfa_required"] is True
    assert response.data["email"] == mfa_user.email


def test_verify_mfa_login_returns_tokens_for_valid_code(api_client, mfa_user):
    code = pyotp.TOTP(mfa_user.mfa_secret).now()

    response = api_client.post(
        "/auth/mfa/verify-login/",
        {
            "email": mfa_user.email,
            "code": code,
        },
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    assert "tokens" in response.data
    assert response.data["data"]["user"] == mfa_user.email


def test_password_reset_request_returns_generic_response_for_unknown_email(api_client):
    response = api_client.post(
        "/auth/password-reset/",
        {"email": "unknown@example.com"},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    assert "password reset link has been sent" in response.data["message"].lower()


def test_password_reset_request_rejects_missing_email(api_client):
    response = api_client.post("/auth/password-reset/", {}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data["detail"] == "Email is required."


def test_password_reset_request_creates_token_for_existing_user(api_client, user):
    with patch("accounts.views.send_mail") as send_mail_mock:
        response = api_client.post(
            "/auth/password-reset/",
            {"email": user.email},
            format="json",
        )

    assert response.status_code == status.HTTP_200_OK
    assert send_mail_mock.called
    assert PasswordResetToken.objects.filter(user=user).count() == 1


def test_confirm_password_reset_updates_password(api_client, valid_reset_token, user):
    response = api_client.post(
        f"/auth/password-reset-confirm/{valid_reset_token.token}/",
        {
            "password": "NewStrongPass123!",
            "confirm_password": "NewStrongPass123!",
        },
        format="json",
    )

    user.refresh_from_db()
    valid_reset_token.refresh_from_db()

    assert response.status_code == status.HTTP_200_OK
    assert user.check_password("NewStrongPass123!")
    assert valid_reset_token.is_used is True


def test_confirm_password_reset_rejects_mismatched_passwords(api_client, valid_reset_token):
    response = api_client.post(
        f"/auth/password-reset-confirm/{valid_reset_token.token}/",
        {
            "password": "NewStrongPass123!",
            "confirm_password": "DifferentPass123!",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "must match" in response.data["detail"].lower()


def test_confirm_password_reset_rejects_invalid_token(api_client):
    response = api_client.post(
        "/auth/password-reset-confirm/not-a-token/",
        {
            "password": "NewStrongPass123!",
            "confirm_password": "NewStrongPass123!",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "invalid or expired token" in response.data["detail"].lower()


def test_confirm_password_reset_rejects_expired_token(api_client, user):
    expired_token = PasswordResetToken.objects.create(
        user=user,
        expires_at=timezone.now() - timedelta(hours=1),
    )

    response = api_client.post(
        f"/auth/password-reset-confirm/{expired_token.token}/",
        {
            "password": "NewStrongPass123!",
            "confirm_password": "NewStrongPass123!",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "invalid or expired" in response.data["detail"].lower()


def test_setup_mfa_generates_secret_for_user_without_secret(user):
    factory = APIRequestFactory()
    request = factory.get("/auth/mfa/setup/")
    force_authenticate(request, user=user)

    response = SetUpMFAAPIView.as_view()(request)

    user.refresh_from_db()
    assert response.status_code == status.HTTP_200_OK
    assert response.data["mfa_enabled"] is False
    assert user.mfa_secret


def test_verify_mfa_setup_accepts_valid_code(user):
    user.mfa_secret = pyotp.random_base32()
    user.save(update_fields=["mfa_secret"])
    code = pyotp.TOTP(user.mfa_secret).now()

    factory = APIRequestFactory()
    request = factory.post("/auth/mfa/verify-setup/", {"code": code}, format="json")
    force_authenticate(request, user=user)

    response = VerifyMFASetupAPIView.as_view()(request)

    user.refresh_from_db()
    assert response.status_code == status.HTTP_200_OK
    assert user.is_mfa_enabled is True


def test_verify_mfa_setup_rejects_invalid_code(user):
    user.mfa_secret = pyotp.random_base32()
    user.save(update_fields=["mfa_secret"])

    factory = APIRequestFactory()
    request = factory.post(
        "/auth/mfa/verify-setup/",
        {"code": "000000"},
        format="json",
    )
    force_authenticate(request, user=user)

    response = VerifyMFASetupAPIView.as_view()(request)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "invalid code" in response.data["error"].lower()


def test_verify_mfa_login_rejects_unknown_user():
    response = APIRequestFactory().post(
        "/auth/mfa/verify-login/",
        {"email": "missing@example.com", "code": "123456"},
        format="json",
    )

    result = VerifyMFALoginAPIView.as_view()(response)

    assert result.status_code == status.HTTP_400_BAD_REQUEST
    assert result.data["error"] == "User not found"


def test_verify_mfa_login_rejects_invalid_code(mfa_user):
    response = APIRequestFactory().post(
        "/auth/mfa/verify-login/",
        {"email": mfa_user.email, "code": "123456"},
        format="json",
    )

    result = VerifyMFALoginAPIView.as_view()(response)

    assert result.status_code == status.HTTP_401_UNAUTHORIZED
    assert result.data["error"] == "Invalid security code"


def test_user_profile_view_returns_profile_data(user):
    user._state.fields_cache["profile"] = SimpleNamespace(full_name="John Doe")
    user._state.fields_cache["employee_profile"] = SimpleNamespace(role="EMPLOYEE")

    factory = APIRequestFactory()
    request = factory.get("/auth/profile/")
    request.tenant = SimpleNamespace(name="Acme")
    force_authenticate(request, user=user)

    response = UserProfileAPIView.as_view()(request)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["identity"]["full_name"] == "John Doe"
    assert response.data["other"]["role"] == "EMPLOYEE"
    assert response.data["tenant"]["name"] == "Acme"
