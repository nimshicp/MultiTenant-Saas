from datetime import date
from itertools import count
from types import SimpleNamespace
from unittest.mock import Mock, patch

import pytest
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from projects.models import Project, Task, TaskChecklistItem, TaskEvidence
from projects.serializers import ProjectSerializer
from projects.views import (
    ChecklistItemDetailView,
    GenerateEvidenceViewUrl,
    GenerateTaskEvidenceUploadUrlView,
    MyTasksView,
    ProjectCreateView,
    ProjectDetailView,
    ProjectListView,
    SaveTaskEvidenceView,
    TaskChecklistItemView,
    TaskCommentCreateView,
    TaskCreateView,
    TaskDeleteView,
    TaskEvidenceListView,
    TaskUpdateView,
    get_user_role,
)


_user_counter = count(1)


def make_user(role=None, superuser=False):
    idx = next(_user_counter)
    user = SimpleNamespace(
        id=f"user-{idx}",
        email=f"user-{idx}@example.com",
        is_authenticated=True,
        is_superuser=superuser,
        is_staff=superuser,
    )
    if role is not None:
        user.employee_profile = SimpleNamespace(role=role)
    return user


def make_request(method, path, data=None, user=None):
    factory = APIRequestFactory()
    request = getattr(factory, method.lower())(path, data or {}, format="json")
    if user is not None:
        force_authenticate(request, user=user)
    return request


def project_serializer_response(data=None):
    serializer = SimpleNamespace(
        is_valid=Mock(return_value=True),
        save=Mock(return_value=SimpleNamespace(id="project-id", **(data or {}))),
        data=data or {"name": "Alpha"},
    )
    return serializer


def task_serializer_response(data=None):
    serializer = SimpleNamespace(
        is_valid=Mock(return_value=True),
        save=Mock(return_value=SimpleNamespace(id="task-id", **(data or {}))),
        data=data or {"title": "Task 1"},
    )
    return serializer


def evidence_serializer_response(data=None):
    return SimpleNamespace(data=data or {"file_name": "evidence.png"})


def checklist_serializer_response(data=None):
    return SimpleNamespace(
        is_valid=Mock(return_value=True),
        save=Mock(return_value=SimpleNamespace(id="item-id", **(data or {}))),
        data=data or {"content": "First item"},
    )


def fake_project(**kwargs):
    defaults = {
        "id": "project-id",
        "name": "Project",
        "project_manager": None,
        "team_members": SimpleNamespace(filter=Mock(return_value=SimpleNamespace(exists=Mock(return_value=False))), set=Mock()),
        "tasks": SimpleNamespace(filter=Mock(return_value=[]), all=Mock(return_value=[])),
    }
    defaults.update(kwargs)
    return SimpleNamespace(**defaults)


def fake_task(**kwargs):
    defaults = {
        "id": "task-id",
        "project": fake_project(),
        "assigned_to": None,
        "evidences": SimpleNamespace(all=Mock(return_value=SimpleNamespace(order_by=Mock(return_value=[])))),
    }
    defaults.update(kwargs)
    return SimpleNamespace(**defaults)


pytestmark = pytest.mark.usefixtures("user")


def test_project_serializer_rejects_deadline_before_start_date():
    serializer = ProjectSerializer()

    with pytest.raises(Exception):
        # Direct validation keeps us off the database-backed PK fields.
        serializer.validate(
            {
                "start_date": date(2026, 6, 10),
                "deadline": date(2026, 6, 5),
            }
        )


def test_project_serializer_create_uses_request_user_and_team_members():
    request_user = make_user(superuser=True)
    request = SimpleNamespace(user=request_user)
    serializer = ProjectSerializer(context={"request": request})
    fake = fake_project()

    with patch("projects.serializers.Project.objects.create", return_value=fake) as create_mock:
        project = serializer.create(
            {
                "name": "Alpha",
                "start_date": date(2026, 6, 10),
                "team_members": [SimpleNamespace(id="member-id")],
            }
        )

    assert project is fake
    create_mock.assert_called_once()
    assert create_mock.call_args.kwargs["created_by"] == request_user
    fake.team_members.set.assert_called_once()


def test_get_user_role_falls_back_to_admin_for_superuser():
    user = make_user(superuser=True)

    assert get_user_role(user) == "ADMIN"


def test_get_user_role_returns_none_for_plain_user():
    user = make_user()

    assert get_user_role(user) is None


def test_project_create_view_rejects_non_admin_user():
    user = make_user(role="EMPLOYEE")
    request = make_request("post", "/projects/create/", {"name": "Alpha", "start_date": "2026-06-10"}, user=user)

    response = ProjectCreateView.as_view()(request)

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.data["detail"] == "Only admins can create projects."


def test_project_create_view_allows_admin():
    user = make_user(superuser=True)
    request = make_request("post", "/projects/create/", {"name": "Alpha", "start_date": "2026-06-10"}, user=user)
    serializer = project_serializer_response({"name": "Alpha"})

    with patch("projects.views.ProjectSerializer", return_value=serializer):
        response = ProjectCreateView.as_view()(request)

    assert response.status_code == status.HTTP_201_CREATED
    assert response.data["name"] == "Alpha"


def test_project_list_view_filters_by_project_manager():
    pm = make_user(role="PROJECT_MANAGER")
    project = fake_project(id="pm-project")
    serializer = SimpleNamespace(data=[{"id": "pm-project"}])

    with patch("projects.views.Project.objects.filter", return_value=[project]) as filter_mock, patch(
        "projects.views.ProjectSerializer", return_value=serializer
    ):
        request = make_request("get", "/projects/", user=pm)
        response = ProjectListView.as_view()(request)

    assert response.status_code == status.HTTP_200_OK
    assert response.data[0]["id"] == "pm-project"
    assert filter_mock.called


def test_project_list_view_filters_by_team_member():
    member = make_user(role="EMPLOYEE")
    project = fake_project(id="member-project")
    serializer = SimpleNamespace(data=[{"id": "member-project"}])

    with patch("projects.views.Project.objects.filter", return_value=[project]) as filter_mock, patch(
        "projects.views.ProjectSerializer", return_value=serializer
    ):
        request = make_request("get", "/projects/", user=member)
        response = ProjectListView.as_view()(request)

    assert response.status_code == status.HTTP_200_OK
    assert response.data[0]["id"] == "member-project"
    assert filter_mock.called


def test_project_detail_view_returns_404_for_missing_project():
    user = make_user(superuser=True)
    request = make_request("get", "/projects/missing/", user=user)

    with patch("projects.views.Project.objects.get", side_effect=Project.DoesNotExist):
        response = ProjectDetailView.as_view()(request, project_id="11111111-1111-1111-1111-111111111111")

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.data["detail"] == "Project not found."


def test_project_detail_view_denies_wrong_project_manager():
    pm = make_user(role="PROJECT_MANAGER")
    project = fake_project(project_manager=make_user(role="PROJECT_MANAGER"))
    request = make_request("get", f"/projects/{project.id}/", user=pm)

    with patch("projects.views.Project.objects.get", return_value=project):
        response = ProjectDetailView.as_view()(request, project_id=project.id)

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.data["detail"] == "Access denied."


def test_project_detail_view_denies_non_member_employee():
    employee = make_user(role="EMPLOYEE")
    project = fake_project(
        team_members=SimpleNamespace(filter=Mock(return_value=SimpleNamespace(exists=Mock(return_value=False))))
    )
    request = make_request("get", f"/projects/{project.id}/", user=employee)

    with patch("projects.views.Project.objects.get", return_value=project):
        response = ProjectDetailView.as_view()(request, project_id=project.id)

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.data["detail"] == "Access denied."


def test_project_detail_patch_allows_admin():
    admin = make_user(superuser=True)
    project = fake_project(description="Old")
    request = make_request("patch", f"/projects/{project.id}/", {"description": "Updated"}, user=admin)
    serializer = project_serializer_response({"description": "Updated"})

    with patch("projects.views.Project.objects.get", return_value=project), patch(
        "projects.views.ProjectSerializer", return_value=serializer
    ):
        response = ProjectDetailView.as_view()(request, project_id=project.id)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["description"] == "Updated"


def test_project_detail_delete_rejects_non_admin():
    employee = make_user(role="EMPLOYEE")
    project = fake_project()
    request = make_request("delete", f"/projects/{project.id}/", user=employee)

    response = ProjectDetailView.as_view()(request, project_id=project.id)

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.data["detail"] == "Only admins can delete projects."


def test_task_create_rejects_assigned_user_not_on_team():
    admin = make_user(superuser=True)
    assigned_user = SimpleNamespace(id="assigned-id")
    project = fake_project(
        team_members=SimpleNamespace(filter=Mock(return_value=SimpleNamespace(exists=Mock(return_value=False)))),
    )
    request = make_request(
        "post",
        f"/projects/{project.id}/tasks/create/",
        {"title": "Task 1", "assigned_to": "assigned-id"},
        user=admin,
    )

    with patch("projects.views.Project.objects.get", return_value=project):
        response = TaskCreateView.as_view()(request, project_id=project.id)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "not a member" in response.data["detail"].lower()


def test_task_create_allows_admin_with_team_member():
    admin = make_user(superuser=True)
    assigned_user = SimpleNamespace(id="assigned-id")
    project = fake_project(
        team_members=SimpleNamespace(filter=Mock(return_value=SimpleNamespace(exists=Mock(return_value=True)))),
    )
    request = make_request(
        "post",
        f"/projects/{project.id}/tasks/create/",
        {"title": "Task 1", "assigned_to": "assigned-id"},
        user=admin,
    )
    serializer = task_serializer_response({"title": "Task 1"})

    with patch("projects.views.Project.objects.get", return_value=project), patch(
        "projects.views.TaskSerializer", return_value=serializer
    ):
        response = TaskCreateView.as_view()(request, project_id=project.id)

    assert response.status_code == status.HTTP_201_CREATED
    assert response.data["title"] == "Task 1"


def test_task_update_employee_cannot_edit_other_task():
    employee = make_user(role="EMPLOYEE")
    project = fake_project()
    task = fake_task(project=project, assigned_to=make_user(role="EMPLOYEE"))
    request = make_request("patch", f"/projects/tasks/{task.id}/update/", {"status": "DONE"}, user=employee)

    with patch("projects.views.Task.objects.get", return_value=task):
        response = TaskUpdateView.as_view()(request, task_id=task.id)

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.data["detail"] == "Access denied."


def test_task_update_employee_only_updates_allowed_fields():
    employee = make_user(role="EMPLOYEE")
    task = fake_task(project=fake_project(), assigned_to=employee)
    request = make_request(
        "patch",
        f"/projects/tasks/{task.id}/update/",
        {"status": "DONE", "progress_percentage": 80, "notes": "Updated", "title": "Ignored"},
        user=employee,
    )
    serializer = task_serializer_response({"status": "DONE", "progress_percentage": 80, "notes": "Updated"})

    with patch("projects.views.Task.objects.get", return_value=task), patch(
        "projects.views.TaskSerializer", return_value=serializer
    ):
        response = TaskUpdateView.as_view()(request, task_id=task.id)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["status"] == "DONE"


def test_task_delete_rejects_non_manager_or_admin():
    employee = make_user(role="EMPLOYEE")
    task = fake_task(project=fake_project())
    request = make_request("delete", f"/projects/tasks/{task.id}/delete/", user=employee)

    with patch("projects.views.Task.objects.get", return_value=task):
        response = TaskDeleteView.as_view()(request, task_id=task.id)

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert "only managers or admins" in response.data["detail"].lower()


def test_task_comment_rejects_non_team_member():
    outsider = make_user(role="EMPLOYEE")
    task = fake_task(project=fake_project())
    request = make_request("post", f"/projects/tasks/{task.id}/comment/", {"content": "Hi"}, user=outsider)

    with patch("projects.views.Task.objects.get", return_value=task):
        response = TaskCommentCreateView.as_view()(request, task_id=task.id)

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.data["detail"] == "Permission denied."


def test_task_comment_allows_team_member():
    member = make_user(role="EMPLOYEE")
    project = fake_project(
        team_members=SimpleNamespace(filter=Mock(return_value=SimpleNamespace(exists=Mock(return_value=True))))
    )
    task = fake_task(project=project)
    request = make_request("post", f"/projects/tasks/{task.id}/comment/", {"content": "Hi"}, user=member)
    serializer = SimpleNamespace(is_valid=Mock(return_value=True), save=Mock(return_value=SimpleNamespace(data="comment")), data={"content": "Hi"})

    with patch("projects.views.Task.objects.get", return_value=task), patch(
        "projects.views.TaskCommentSerializer", return_value=serializer
    ):
        response = TaskCommentCreateView.as_view()(request, task_id=task.id)

    assert response.status_code == status.HTTP_201_CREATED
    assert response.data["content"] == "Hi"


def test_task_checklist_rejects_non_assigned_user():
    outsider = make_user(role="EMPLOYEE")
    task = fake_task(project=fake_project(), assigned_to=make_user(role="EMPLOYEE"))
    request = make_request("post", f"/projects/tasks/{task.id}/checklist/", {"content": "First item"}, user=outsider)

    with patch("projects.views.Task.objects.get", return_value=task):
        response = TaskChecklistItemView.as_view()(request, task_id=task.id)

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.data["detail"] == "Permission denied."


def test_task_checklist_allows_assigned_user():
    assigned = make_user(role="EMPLOYEE")
    task = fake_task(project=fake_project(), assigned_to=assigned)
    request = make_request("post", f"/projects/tasks/{task.id}/checklist/", {"content": "First item"}, user=assigned)
    serializer = checklist_serializer_response({"content": "First item"})

    with patch("projects.views.Task.objects.get", return_value=task), patch(
        "projects.views.TaskChecklistItemSerializer", return_value=serializer
    ):
        response = TaskChecklistItemView.as_view()(request, task_id=task.id)

    assert response.status_code == status.HTTP_201_CREATED
    assert response.data["content"] == "First item"


def test_checklist_item_detail_returns_404_for_missing_item():
    user = make_user(superuser=True)
    request = make_request("patch", "/projects/checklist/missing/", {"is_completed": True}, user=user)

    with patch("projects.views.TaskChecklistItem.objects.get", side_effect=TaskChecklistItem.DoesNotExist):
        response = ChecklistItemDetailView.as_view()(request, item_id="11111111-1111-1111-1111-111111111111")

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.data["detail"] == "Item not found."


def test_my_tasks_returns_assigned_tasks():
    user = make_user(role="EMPLOYEE")
    task = fake_task(id="task-1", assigned_to=user)
    request = make_request("get", "/projects/my-tasks/", user=user)
    serializer = SimpleNamespace(data=[{"id": "task-1"}])

    with patch("projects.views.Task.objects.filter", return_value=[task]), patch(
        "projects.views.TaskSerializer", return_value=serializer
    ):
        response = MyTasksView.as_view()(request)

    assert response.status_code == status.HTTP_200_OK
    assert response.data[0]["id"] == "task-1"


def test_generate_task_evidence_upload_url_returns_url():
    admin = make_user(superuser=True)
    task = fake_task()
    request = make_request(
        "post",
        f"/projects/tasks/{task.id}/upload-url/",
        {"file_name": "evidence.png", "content_type": "image/png"},
        user=admin,
    )
    fake_s3 = Mock()
    fake_s3.generate_presigned_url.return_value = "https://example.com/upload"

    with patch("projects.views.boto3.client", return_value=fake_s3):
        response = GenerateTaskEvidenceUploadUrlView.as_view()(request, task_id=task.id)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["upload_url"] == "https://example.com/upload"
    assert response.data["file_key"].startswith("task-evidence/")


def test_save_task_evidence_creates_record_and_returns_serializer_data():
    user = make_user(superuser=True)
    task = fake_task()
    request = make_request(
        "post",
        f"/projects/tasks/{task.id}/evidence/",
        {"file_key": "task-evidence/key", "file_name": "evidence.png"},
        user=user,
    )

    with patch("projects.views.get_object_or_404", return_value=task), patch(
        "projects.views.TaskEvidence.objects.create",
        return_value=SimpleNamespace(),
    ) as create_mock, patch(
        "projects.views.TaskEvidenceSerializer",
        return_value=evidence_serializer_response({"file_name": "evidence.png"}),
    ):
        response = SaveTaskEvidenceView.as_view()(request, task_id=task.id)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["file_name"] == "evidence.png"
    create_mock.assert_called_once()


def test_task_evidence_list_returns_uploaded_items():
    user = make_user(superuser=True)
    task = fake_task()
    request = make_request("get", f"/projects/tasks/{task.id}/evidence/list/", user=user)

    with patch("projects.views.get_object_or_404", return_value=task), patch(
        "projects.views.TaskEvidenceSerializer",
        return_value=evidence_serializer_response([{"file_name": "a.png"}]),
    ):
        response = TaskEvidenceListView.as_view()(request, task_id=task.id)

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 1


def test_generate_evidence_view_url_returns_url():
    user = make_user(superuser=True)
    evidence = SimpleNamespace(id="evidence-id", file_key="task-evidence/a")
    request = make_request("get", f"/projects/tasks/evidence/{evidence.id}/view-url/", user=user)
    fake_s3 = Mock()
    fake_s3.generate_presigned_url.return_value = "https://example.com/view"

    with patch("projects.views.get_object_or_404", return_value=evidence), patch(
        "projects.views.boto3.client", return_value=fake_s3
    ):
        response = GenerateEvidenceViewUrl.as_view()(request, evidence_id=evidence.id)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["view_url"] == "https://example.com/view"
