# projects/urls.py

from django.urls import path
from . import views

urlpatterns = [
    # Project endpoints
    path("", views.ProjectListView.as_view(), name="project-list"),
    path("create/", views.ProjectCreateView.as_view(), name="project-create"),
    path(
        "<uuid:project_id>/", views.ProjectDetailView.as_view(), name="project-detail"
    ),
    # Task endpoints
    path("my-tasks/", views.MyTasksView.as_view(), name="my-tasks"),
    path("<uuid:project_id>/tasks/", views.TaskListView.as_view(), name="task-list"),
    path(
        "<uuid:project_id>/tasks/create/",
        views.TaskCreateView.as_view(),
        name="task-create",
    ),
    # Single task operations
    path(
        "tasks/<uuid:task_id>/update/",
        views.TaskUpdateView.as_view(),
        name="task-update",
    ),
    path(
        "tasks/<uuid:task_id>/delete/",
        views.TaskDeleteView.as_view(),
        name="task-delete",
    ),
    path(
        "tasks/<uuid:task_id>/comment/",
        views.TaskCommentCreateView.as_view(),
        name="task-comment",
    ),
    # Checklist operations
    path(
        "tasks/<uuid:task_id>/checklist/",
        views.TaskChecklistItemView.as_view(),
        name="task-checklist",
    ),
    path(
        "checklist/<uuid:item_id>/",
        views.ChecklistItemDetailView.as_view(),
        name="checklist-item-detail",
    ),
    path(
        "tasks/<uuid:task_id>/upload-url/",
        views.GenerateTaskEvidenceUploadUrlView.as_view(),
    ),
    path("tasks/<uuid:task_id>/evidence/", views.SaveTaskEvidenceView.as_view()),
    path("tasks/<uuid:task_id>/evidence/list/", views.TaskEvidenceListView.as_view()),
    path(
        "tasks/evidence/<int:evidence_id>/view-url/",
        views.GenerateEvidenceViewUrl.as_view(),
    ),
]
