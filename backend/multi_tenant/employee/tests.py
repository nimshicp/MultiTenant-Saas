from contextlib import nullcontext
from types import SimpleNamespace
from unittest.mock import Mock, patch

import pytest
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from employee.models import Employee, Invitation, Role
from employee.serializers import AcceptInvitationSerializer, InviteEmployeeSerializer
from employee.views import (
    AcceptInvitationAPIView,
    EmployeeListView,
    EmployeeManagementView,
    InvitationDetailAPIView,
    InviteEmployeeAPIView,
)


pytestmark = pytest.mark.django_db


def test_invite_employee_serializer_lowercases_email():
    serializer = InviteEmployeeSerializer(
        data={
            "full_name": "Jane Doe",
            "email": "JANE@EXAMPLE.COM",
            "role": Role.EMPLOYEE,
        }
    )

    assert serializer.is_valid(), serializer.errors
    assert serializer.validated_data["email"] == "jane@example.com"


def test_invite_employee_serializer_rejects_existing_user_email(user):
    serializer = InviteEmployeeSerializer(
        data={
            "full_name": "Jane Doe",
            "email": user.email,
            "role": Role.EMPLOYEE,
        }
    )

    assert not serializer.is_valid()
    assert "already exists" in str(serializer.errors).lower()


def test_invite_employee_serializer_blocks_superadmin_for_non_superadmin_user(user):
    request = SimpleNamespace(
        user=SimpleNamespace(employee_profile=SimpleNamespace(role=Role.ADMIN))
    )
    serializer = InviteEmployeeSerializer(
        data={
            "full_name": "Jane Doe",
            "email": "jane@example.com",
            "role": Role.SUPERADMIN,
        },
        context={"request": request},
    )

    assert not serializer.is_valid()
    assert "permission" in str(serializer.errors).lower()


def test_accept_invitation_serializer_rejects_mismatched_passwords():
    serializer = AcceptInvitationSerializer(
        data={
            "password": "StrongPass123!",
            "confirm_password": "DifferentPass123!",
        }
    )

    assert not serializer.is_valid()
    assert "do not match" in str(serializer.errors).lower()


def test_accept_invitation_serializer_accepts_valid_password():
    serializer = AcceptInvitationSerializer(
        data={
            "password": "StrongPass123!",
            "confirm_password": "StrongPass123!",
        }
    )

    assert serializer.is_valid(), serializer.errors


def test_invite_employee_view_rejects_non_admin_user(user):
    user._state.fields_cache["employee_profile"] = SimpleNamespace(role=Role.EMPLOYEE)

    request = APIRequestFactory().post(
        "/employee/invite/",
        {
            "full_name": "Jane Doe",
            "email": "jane@example.com",
            "role": Role.EMPLOYEE,
        },
        format="json",
    )
    force_authenticate(request, user=user)

    response = InviteEmployeeAPIView.as_view()(request)

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.data["detail"] == "Permission denied."


def test_invite_employee_view_sends_invitation_for_admin(user):
    user._state.fields_cache["employee_profile"] = SimpleNamespace(role=Role.ADMIN)
    request = APIRequestFactory().post(
        "/employee/invite/",
        {
            "full_name": "Jane Doe",
            "email": "jane@example.com",
            "role": Role.EMPLOYEE,
        },
        format="json",
    )
    request.tenant = SimpleNamespace(name="Acme", schema_name="tenant_acme")
    force_authenticate(request, user=user)

    invitation = SimpleNamespace(
        full_name="Jane Doe",
        email="jane@example.com",
        token="token-123",
        get_role_display=Mock(return_value="Employee"),
    )

    with patch("employee.views.Invitation.objects.filter") as filter_mock, patch(
        "employee.views.Invitation.objects.create", return_value=invitation
    ) as create_mock, patch("employee.views.send_mail") as send_mail_mock:
        filter_mock.return_value.exists.return_value = False
        response = InviteEmployeeAPIView.as_view()(request)

    assert response.status_code == status.HTTP_201_CREATED
    assert create_mock.called
    assert send_mail_mock.called


def test_employee_list_view_returns_serialized_rows(user):
    employee_user = SimpleNamespace(
        id="user-id",
        email="employee@example.com",
        profile=SimpleNamespace(full_name="Employee One"),
    )
    employee = SimpleNamespace(
        user=employee_user,
        id="employee-id",
        role=Role.EMPLOYEE,
        department="Engineering",
        job_title="Developer",
        is_active_employee=True,
        is_blocked=False,
        date_joined=None,
    )

    request = APIRequestFactory().get("/employee/list/")
    force_authenticate(request, user=user)

    with patch("employee.views.Employee.objects.all", return_value=[employee]):
        response = EmployeeListView.as_view()(request)

    assert response.status_code == status.HTTP_200_OK
    assert response.data[0]["email"] == "employee@example.com"
    assert response.data[0]["name"] == "Employee One"


def test_employee_management_view_blocks_employee_and_updates_user_state(user):
    user._state.fields_cache["employee_profile"] = SimpleNamespace(role=Role.ADMIN)

    target_user = SimpleNamespace(
        profile=SimpleNamespace(full_name="Target User", save=Mock()),
        is_active=True,
        save=Mock(),
    )
    employee = SimpleNamespace(
        id="employee-id",
        user=target_user,
        role=Role.EMPLOYEE,
        department="Engineering",
        job_title="Developer",
        is_blocked=False,
        is_active_employee=True,
        save=Mock(),
        delete=Mock(),
    )

    request = APIRequestFactory().patch(
        "/employee/manage/employee-id/",
        {"is_blocked": True},
        format="json",
    )
    force_authenticate(request, user=user)

    with patch("employee.views.Employee.objects.get", return_value=employee):
        response = EmployeeManagementView.as_view()(request, employee_id="employee-id")

    assert response.status_code == status.HTTP_200_OK
    assert response.data["message"] == "Employee updated successfully."
    assert employee.is_blocked is True
    assert target_user.is_active is False
    target_user.save.assert_called_once()
    employee.save.assert_called_once()


def test_employee_management_view_updates_name_and_metadata(user):
    user._state.fields_cache["employee_profile"] = SimpleNamespace(role=Role.ADMIN)

    profile = SimpleNamespace(full_name="Old Name", save=Mock())
    target_user = SimpleNamespace(profile=profile, save=Mock(), is_active=True)
    employee = SimpleNamespace(
        id="employee-id",
        user=target_user,
        role=Role.EMPLOYEE,
        department="Engineering",
        job_title="Developer",
        is_blocked=False,
        is_active_employee=True,
        save=Mock(),
        delete=Mock(),
    )

    request = APIRequestFactory().patch(
        "/employee/manage/employee-id/",
        {
            "full_name": "New Name",
            "role": Role.PROJECT_MANAGER,
            "department": "Product",
            "job_title": "Lead",
            "is_active": False,
        },
        format="json",
    )
    force_authenticate(request, user=user)

    with patch("employee.views.Employee.objects.get", return_value=employee):
        response = EmployeeManagementView.as_view()(request, employee_id="employee-id")

    assert response.status_code == status.HTTP_200_OK
    assert profile.full_name == "New Name"
    assert employee.role == Role.PROJECT_MANAGER
    assert employee.department == "Product"
    assert employee.job_title == "Lead"
    assert employee.is_active_employee is False
    profile.save.assert_called_once()
    employee.save.assert_called_once()


def test_employee_management_view_returns_404_for_missing_employee(user):
    user._state.fields_cache["employee_profile"] = SimpleNamespace(role=Role.ADMIN)
    request = APIRequestFactory().patch(
        "/employee/manage/missing/",
        {"role": Role.EMPLOYEE},
        format="json",
    )
    force_authenticate(request, user=user)

    with patch("employee.views.Employee.objects.get", side_effect=Employee.DoesNotExist):
        response = EmployeeManagementView.as_view()(request, employee_id="missing")

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.data["detail"] == "Employee not found."


def test_invitation_detail_view_rejects_invalid_token():
    request = APIRequestFactory().get("/employee/accept-invitation/token/")
    with patch(
        "employee.views.Invitation.objects.get",
        side_effect=Invitation.DoesNotExist,
    ):
        response = InvitationDetailAPIView.as_view()(
            request, token="11111111-1111-1111-1111-111111111111"
        )

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.data["detail"] == "Invalid token."


def test_invitation_detail_view_rejects_expired_invitation():
    invitation = SimpleNamespace(is_valid=False)
    request = APIRequestFactory().get("/employee/accept-invitation/token/")

    with patch("employee.views.Invitation.objects.get", return_value=invitation):
        response = InvitationDetailAPIView.as_view()(request, token="token")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data["detail"] == "Expired."


def test_invitation_detail_view_returns_data_for_valid_invitation():
    invitation = SimpleNamespace(is_valid=True)
    request = APIRequestFactory().get("/employee/accept-invitation/token/")

    with patch("employee.views.Invitation.objects.get", return_value=invitation), patch(
        "employee.views.InvitationDetailSerializer",
        return_value=SimpleNamespace(data={"full_name": "Jane Doe"}),
    ):
        response = InvitationDetailAPIView.as_view()(request, token="token")

    assert response.status_code == status.HTTP_200_OK
    assert response.data["full_name"] == "Jane Doe"


def test_accept_invitation_view_rejects_expired_invitation():
    invitation = SimpleNamespace(is_valid=False)
    request = APIRequestFactory().post(
        "/employee/accept-invitation/token/complete/",
        {"password": "StrongPass123!", "confirm_password": "StrongPass123!"},
        format="json",
    )

    with patch("employee.views.Invitation.objects.get", return_value=invitation):
        response = AcceptInvitationAPIView.as_view()(request, token="token")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data["detail"] == "Expired."


def test_accept_invitation_view_creates_account():
    invitation = SimpleNamespace(
        is_valid=True,
        email="jane@example.com",
        full_name="Jane Doe",
        tenant=SimpleNamespace(schema_name="tenant_acme"),
        role=Role.EMPLOYEE,
        department="Engineering",
        job_title="Developer",
        invited_by=None,
        save=Mock(),
        is_accepted=False,
        accepted_employee=None,
    )
    request = APIRequestFactory().post(
        "/employee/accept-invitation/token/complete/",
        {"password": "StrongPass123!", "confirm_password": "StrongPass123!"},
        format="json",
    )

    fake_user = SimpleNamespace()
    fake_employee = SimpleNamespace()

    with patch("employee.views.Invitation.objects.get", return_value=invitation), patch(
        "employee.views.User.objects.create_user", return_value=fake_user
    ), patch("employee.views.UserProfile.objects.create", return_value=SimpleNamespace()), patch(
        "employee.views.Employee.objects.create", return_value=fake_employee
    ), patch(
        "employee.views.schema_context", return_value=nullcontext()
    ):
        response = AcceptInvitationAPIView.as_view()(request, token="token")

    assert response.status_code == status.HTTP_201_CREATED
    assert response.data["message"] == "Account created."
    assert invitation.is_accepted is True
    invitation.save.assert_called_once()
