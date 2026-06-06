import pytest
import pyotp

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import PasswordResetToken


User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        email="user@example.com",
        password="StrongPass123!",
    )


@pytest.fixture
def mfa_user(db):
    user = User.objects.create_user(
        email="mfa@example.com",
        password="StrongPass123!",
    )
    user.mfa_secret = pyotp.random_base32()
    user.is_mfa_enabled = True
    user.save(update_fields=["mfa_secret", "is_mfa_enabled"])
    return user


@pytest.fixture
def valid_reset_token(db, user):
    return PasswordResetToken.objects.create(
        user=user,
        expires_at=timezone.now() + timedelta(hours=1),
    )
