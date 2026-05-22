# projects/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
import logging
from botocore.config import Config

from .models import Project, Task, TaskComment, TaskChecklistItem, TaskEvidence
from .serializers import (
    ProjectSerializer,
    TaskSerializer,
    TaskCommentSerializer,
    TaskChecklistItemSerializer,
    TaskEvidenceSerializer,
)
import boto3
import uuid

from django.conf import settings

from django.shortcuts import get_object_or_404

logger = logging.getLogger(__name__)


def get_user_role(user):
    try:
        role = user.employee_profile.role
        return role
    except Exception as e:
        if user.is_superuser or user.is_staff:
            return "ADMIN"
        return None


class ProjectListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = get_user_role(request.user)
        user = request.user

        if role == "PROJECT_MANAGER":
            queryset = Project.objects.filter(project_manager=user)
        elif role == "EMPLOYEE" or role == "VIEWER":
            queryset = Project.objects.filter(team_members=user)
        else:
            queryset = Project.objects.all()

        serializer = ProjectSerializer(
            queryset, many=True, context={"request": request}
        )
        return Response(serializer.data)


class ProjectCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        role = get_user_role(request.user)
        if role not in ("ADMIN", "SUPERADMIN"):
            return Response(
                {"detail": "Only admins can create projects."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ProjectSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        project = serializer.save()
        return Response(
            ProjectSerializer(project, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class ProjectDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id):
        role = get_user_role(request.user)
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response(
                {"detail": "Project not found."}, status=status.HTTP_404_NOT_FOUND
            )

        # Access control
        if role == "PROJECT_MANAGER" and project.project_manager != request.user:
            return Response(
                {"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN
            )
        if (
            role in ("EMPLOYEE", "VIEWER")
            and not project.team_members.filter(id=request.user.id).exists()
        ):
            return Response(
                {"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN
            )

        serializer = ProjectSerializer(project, context={"request": request})
        return Response(serializer.data)

    def patch(self, request, project_id):
        role = get_user_role(request.user)
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response(
                {"detail": "Project not found."}, status=status.HTTP_404_NOT_FOUND
            )

        # Allow Admins OR the assigned Project Manager to update
        is_admin = role in ("ADMIN", "SUPERADMIN")
        is_assigned_pm = (
            role == "PROJECT_MANAGER" and project.project_manager == request.user
        )

        if not (is_admin or is_assigned_pm):
            return Response(
                {
                    "detail": "Permission denied. Only admins or the assigned project manager can update this project."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ProjectSerializer(
            project, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        project = serializer.save()
        return Response(ProjectSerializer(project, context={"request": request}).data)

    def delete(self, request, project_id):
        role = get_user_role(request.user)
        if role not in ("ADMIN", "SUPERADMIN"):
            return Response(
                {"detail": "Only admins can delete projects."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            project = Project.objects.get(id=project_id)
            project.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Project.DoesNotExist:
            return Response(
                {"detail": "Project not found."}, status=status.HTTP_404_NOT_FOUND
            )


class TaskListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id):
        role = get_user_role(request.user)
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response(
                {"detail": "Project not found."}, status=status.HTTP_404_NOT_FOUND
            )

        if role in ("EMPLOYEE", "VIEWER"):
            tasks = project.tasks.filter(assigned_to=request.user)
        else:
            tasks = project.tasks.all()

        serializer = TaskSerializer(tasks, many=True, context={"request": request})
        return Response(serializer.data)


class TaskCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, project_id):
        role = get_user_role(request.user)
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response(
                {"detail": "Project not found."}, status=status.HTTP_404_NOT_FOUND
            )

        # PM can create tasks if assigned to project, Admins can always
        is_pm = role == "PROJECT_MANAGER" and project.project_manager == request.user
        is_admin = role in ("ADMIN", "SUPERADMIN")

        if not (is_pm or is_admin):
            return Response(
                {"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN
            )

        # Ensure assigned_to is in team_members
        assigned_to_id = request.data.get("assigned_to")
        if assigned_to_id:
            if not project.team_members.filter(id=assigned_to_id).exists():
                return Response(
                    {"detail": "Assigned user is not a member of this project team."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        data = {**request.data, "project": str(project_id)}
        serializer = TaskSerializer(data=data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        task = serializer.save()
        return Response(
            TaskSerializer(task, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class TaskUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, task_id):
        role = get_user_role(request.user)
        try:
            task = Task.objects.get(id=task_id)
        except Task.DoesNotExist:
            return Response(
                {"detail": "Task not found."}, status=status.HTTP_404_NOT_FOUND
            )

        if role == "EMPLOYEE":
            # Employees can only update their own tasks' status, progress, and notes
            if task.assigned_to != request.user:
                return Response(
                    {"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN
                )

            allowed_fields = ["status", "progress_percentage", "notes"]
            data = {k: v for k, v in request.data.items() if k in allowed_fields}
            serializer = TaskSerializer(
                task, data=data, partial=True, context={"request": request}
            )
        else:
            # Admins and PMs can update everything
            serializer = TaskSerializer(
                task, data=request.data, partial=True, context={"request": request}
            )

        serializer.is_valid(raise_exception=True)
        task = serializer.save()
        return Response(TaskSerializer(task, context={"request": request}).data)


class TaskDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, task_id):
        role = get_user_role(request.user)
        try:
            task = Task.objects.get(id=task_id)
        except Task.DoesNotExist:
            return Response(
                {"detail": "Task not found."}, status=status.HTTP_404_NOT_FOUND
            )

        project = task.project
        is_pm = role == "PROJECT_MANAGER" and project.project_manager == request.user
        is_admin = role in ("ADMIN", "SUPERADMIN")

        if not (is_pm or is_admin):
            return Response(
                {"detail": "Only managers or admins can delete tasks."},
                status=status.HTTP_403_FORBIDDEN,
            )

        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TaskCommentCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, task_id):
        try:
            task = Task.objects.get(id=task_id)
        except Task.DoesNotExist:
            return Response(
                {"detail": "Task not found."}, status=status.HTTP_404_NOT_FOUND
            )

        # Check if user is part of the project team
        project = task.project
        if not (
            project.team_members.filter(id=request.user.id).exists()
            or project.project_manager == request.user
            or get_user_role(request.user) in ("ADMIN", "SUPERADMIN")
        ):
            return Response(
                {"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN
            )

        data = {**request.data, "task": task.id}
        serializer = TaskCommentSerializer(data=data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        comment = serializer.save()
        return Response(
            TaskCommentSerializer(comment).data, status=status.HTTP_201_CREATED
        )


class TaskChecklistItemView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, task_id):
        try:
            task = Task.objects.get(id=task_id)
        except Task.DoesNotExist:
            return Response(
                {"detail": "Task not found."}, status=status.HTTP_404_NOT_FOUND
            )

        # Security check: only assigned user or PM/Admin
        project = task.project
        is_assigned = task.assigned_to == request.user
        is_pm = project.project_manager == request.user
        is_admin = get_user_role(request.user) in ("ADMIN", "SUPERADMIN")

        if not (is_assigned or is_pm or is_admin):
            return Response(
                {"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN
            )

        data = {**request.data, "task": task.id}
        serializer = TaskChecklistItemSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        item = serializer.save()
        return Response(
            TaskChecklistItemSerializer(item).data, status=status.HTTP_201_CREATED
        )


class ChecklistItemDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, item_id):
        try:
            item = TaskChecklistItem.objects.get(id=item_id)
        except TaskChecklistItem.DoesNotExist:
            return Response(
                {"detail": "Item not found."}, status=status.HTTP_404_NOT_FOUND
            )

        # Check permissions via the parent task
        task = item.task
        project = task.project
        if not (
            task.assigned_to == request.user
            or project.project_manager == request.user
            or get_user_role(request.user) in ("ADMIN", "SUPERADMIN")
        ):
            return Response(
                {"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN
            )

        serializer = TaskChecklistItemSerializer(item, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, item_id):
        try:
            item = TaskChecklistItem.objects.get(id=item_id)
            item.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except TaskChecklistItem.DoesNotExist:
            return Response(
                {"detail": "Item not found."}, status=status.HTTP_404_NOT_FOUND
            )


class MyTasksView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Return all tasks assigned to the current user
        tasks = Task.objects.filter(assigned_to=request.user)
        serializer = TaskSerializer(tasks, many=True, context={"request": request})
        return Response(serializer.data)


class GenerateTaskEvidenceUploadUrlView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, task_id):

        file_name = request.data.get("file_name")

        content_type = request.data.get("content_type")

        s3 = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION_NAME,
            config=Config(signature_version="s3v4", s3={"addressing_style": "virtual"}),
        )
        unique_key = f"task-evidence/" f"{uuid.uuid4()}-{file_name}"

        upload_url = s3.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": settings.AWS_STORAGE_BUCKET_NAME,
                "Key": unique_key,
                "ContentType": content_type,
            },
            ExpiresIn=3600,
        )

        file_url = (
            f"https://"
            f"{settings.AWS_STORAGE_BUCKET_NAME}.s3."
            f"{settings.AWS_REGION_NAME}.amazonaws.com/"
            f"{unique_key}"
        )

        return Response({"upload_url": upload_url, "file_key": unique_key})


class SaveTaskEvidenceView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, task_id):

        task = get_object_or_404(Task, id=task_id)

        evidence = TaskEvidence.objects.create(
            task=task,
            uploaded_by=request.user,
            file_key=request.data["file_key"],
            file_name=request.data["file_name"],
        )

        serializer = TaskEvidenceSerializer(evidence)

        return Response(serializer.data)


class TaskEvidenceListView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, task_id):

        task = get_object_or_404(Task, id=task_id)

        evidences = task.evidences.all().order_by("-uploaded_at")

        serializer = TaskEvidenceSerializer(evidences, many=True)

        return Response(serializer.data)

class GenerateEvidenceViewUrl(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, evidence_id):

        evidence = get_object_or_404(
            TaskEvidence,
            id=evidence_id
        )

        s3 = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION_NAME,
            config=Config(
                signature_version="s3v4",
                s3={
                    "addressing_style": "virtual"
                }
            ),
        )

        view_url = s3.generate_presigned_url(

            ClientMethod="get_object",

            Params={
                "Bucket": settings.AWS_STORAGE_BUCKET_NAME,
                "Key": evidence.file_key,
            },

            ExpiresIn=60
        )

        return Response({
            "view_url": view_url
        })