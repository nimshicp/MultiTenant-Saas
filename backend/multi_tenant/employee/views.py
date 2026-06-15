# employee/views.py

from datetime import timedelta
from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from django_tenants.utils import schema_context
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status

from accounts.models import UserProfile
from .models import Invitation, Employee, Role
from .serializers import (
    InviteEmployeeSerializer,
    AcceptInvitationSerializer,
    InvitationDetailSerializer,
)

User = get_user_model()

class InviteEmployeeAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not hasattr(request.user, 'employee_profile') or request.user.employee_profile.role not in [Role.ADMIN, Role.SUPERADMIN]:
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        serializer = InviteEmployeeSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        invitation = Invitation.objects.create(
            tenant=request.tenant,
            invited_by=request.user,
            expires_at=timezone.now() + timedelta(days=7),
            **serializer.validated_data
        )

        subdomain = request.tenant.schema_name.replace('tenant_', '')
        frontend_url = f"https://multi-tenant-saas-plum.vercel.app/accept-invitation/{invitation.token}"

        send_mail(
            subject=f"Invitation to join {request.tenant.name}",
            message=f"Hello {invitation.full_name},\n\nYou have been invited to join {request.tenant.name} as {invitation.get_role_display()}.\n\n{frontend_url}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[invitation.email],
            fail_silently=False,
        )

        return Response({"message": "Invitation sent successfully."}, status=status.HTTP_201_CREATED)

class EmployeeListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        employees = Employee.objects.all()
        data = []
        for emp in employees:
            data.append({
                "id": str(emp.user.id),
                "employee_id": str(emp.id),
                "name": emp.user.profile.full_name if hasattr(emp.user, 'profile') else emp.user.email,
                "email": emp.user.email,
                "role": emp.role,
                "department": emp.department,
                "job_title": emp.job_title,
                "is_active": emp.is_active_employee,
                "is_blocked": emp.is_blocked,
                "date_joined": emp.date_joined,
            })
        return Response(data)

class EmployeeManagementView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, employee_id):
        if not hasattr(request.user, 'employee_profile') or request.user.employee_profile.role not in [Role.ADMIN, Role.SUPERADMIN]:
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        try:
            employee = Employee.objects.get(id=employee_id)
        except Employee.DoesNotExist:
            return Response({"detail": "Employee not found."}, status=status.HTTP_404_NOT_FOUND)

        data = request.data
        if 'full_name' in data:
            profile = employee.user.profile
            profile.full_name = data['full_name']
            profile.save()
            
        if 'role' in data: employee.role = data['role']
        if 'department' in data: employee.department = data['department']
        if 'job_title' in data: employee.job_title = data['job_title']
        if 'is_blocked' in data: 
            employee.is_blocked = data['is_blocked']
            # Synchronize with core User account
            user_to_update = employee.user
            user_to_update.is_active = not employee.is_blocked
            user_to_update.save()

        if 'is_active' in data: 
            employee.is_active_employee = data['is_active']
            
        employee.save()
        return Response({"message": "Employee updated successfully."})

    def delete(self, request, employee_id):
        if not hasattr(request.user, 'employee_profile') or request.user.employee_profile.role not in [Role.ADMIN, Role.SUPERADMIN]:
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        try:
            employee = Employee.objects.get(id=employee_id)
            employee.delete()
            return Response({"message": "Employee deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
        except Employee.DoesNotExist:
            return Response({"detail": "Employee not found."}, status=status.HTTP_404_NOT_FOUND)

class InvitationDetailAPIView(APIView):
    permission_classes = [AllowAny]
    def get(self, request, token):
        try:
            invitation = Invitation.objects.get(token=token)
            if not invitation.is_valid:
                return Response({"detail": "Expired."}, status=status.HTTP_400_BAD_REQUEST)
            return Response(InvitationDetailSerializer(invitation).data)
        except Invitation.DoesNotExist:
            return Response({"detail": "Invalid token."}, status=status.HTTP_404_NOT_FOUND)

class AcceptInvitationAPIView(APIView):
    permission_classes = [AllowAny]
    def post(self, request, token):
        try:
            invitation = Invitation.objects.get(token=token)
            if not invitation.is_valid:
                return Response({"detail": "Expired."}, status=status.HTTP_400_BAD_REQUEST)
            
            serializer = AcceptInvitationSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            with transaction.atomic():
                user = User.objects.create_user(email=invitation.email, password=serializer.validated_data['password'])
                UserProfile.objects.create(user=user, full_name=invitation.full_name, tenant=invitation.tenant)
                
                with schema_context(invitation.tenant.schema_name):
                    employee = Employee.objects.create(
                        user=user, tenant=invitation.tenant, role=invitation.role,
                        department=invitation.department, job_title=invitation.job_title,
                        invited_by=invitation.invited_by, invitation=invitation
                    )
                invitation.is_accepted = True
                invitation.accepted_employee = employee
                invitation.save()

            return Response({"message": "Account created."}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)