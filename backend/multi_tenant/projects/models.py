# projects/models.py

import uuid

from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


# ==========================================================
# PROJECT TYPE CHOICES
# ==========================================================
class ProjectType(models.TextChoices):
    WEB_APP = 'WEB_APP', 'Web Application'
    MOBILE_APP = 'MOBILE_APP', 'Mobile Application'
    API_BACKEND = 'API_BACKEND', 'API / Backend Service'
    DEVOPS = 'DEVOPS', 'DevOps / Infrastructure'
    DATA_ML = 'DATA_ML', 'Data / Machine Learning'
    QA_TESTING = 'QA_TESTING', 'QA / Testing'
    UI_UX = 'UI_UX', 'UI / UX Design'
    OTHER = 'OTHER', 'Other'


# ==========================================================
# PROJECT STATUS CHOICES
# ==========================================================
class ProjectStatus(models.TextChoices):
    PLANNING = 'PLANNING', 'Planning'
    IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
    ON_HOLD = 'ON_HOLD', 'On Hold'
    COMPLETED = 'COMPLETED', 'Completed'
    CANCELLED = 'CANCELLED', 'Cancelled'
    OVERDUE = 'OVERDUE', 'Overdue'


# ==========================================================
# PRIORITY CHOICES (shared between Project and Task)
# ==========================================================
class Priority(models.TextChoices):
    LOW = 'LOW', 'Low'
    MEDIUM = 'MEDIUM', 'Medium'
    HIGH = 'HIGH', 'High'
    CRITICAL = 'CRITICAL', 'Critical'


# ==========================================================
# PROJECT MODEL (Tenant-specific)
# ==========================================================
class Project(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Basic Information
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)

    # Classification
    project_type = models.CharField(
        max_length=30,
        choices=ProjectType.choices,
        default=ProjectType.WEB_APP
    )
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.MEDIUM
    )

    # Status
    status = models.CharField(
        max_length=20,
        choices=ProjectStatus.choices,
        default=ProjectStatus.PLANNING
    )

    # Tech Stack (e.g. "React, Django, PostgreSQL")
    tech_stack = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        help_text="Technologies used in this project."
    )

    # Repository URL
    repository_url = models.URLField(blank=True, null=True)
    client_name = models.CharField(max_length=255, blank=True, null=True)

    # Financials
    budget = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Project budget"
    )

    # Timeline
    start_date = models.DateField()
    deadline = models.DateField(null=True, blank=True)
    actual_end_date = models.DateField(null=True, blank=True)

    # Progress (0-100%)
    progress_percentage = models.PositiveSmallIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )

    # People
    project_manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_projects',
        help_text="The Project Manager assigned to lead this project."
    )

    team_members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='project_memberships',
        blank=True,
        help_text="Developers/Employees assigned to this project."
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_projects'
    )

    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Project'
        verbose_name_plural = 'Projects'

    def __str__(self):
        return f"{self.name} ({self.get_status_display()})"


# ==========================================================
# TASK TYPE CHOICES
# ==========================================================
class TaskType(models.TextChoices):
    FEATURE = 'FEATURE', 'Feature'
    BUG_FIX = 'BUG_FIX', 'Bug Fix'
    CODE_REVIEW = 'CODE_REVIEW', 'Code Review'
    TESTING = 'TESTING', 'Testing / QA'
    DEPLOYMENT = 'DEPLOYMENT', 'Deployment'
    DOCUMENTATION = 'DOCUMENTATION', 'Documentation'
    MEETING = 'MEETING', 'Meeting'
    RESEARCH = 'RESEARCH', 'Research / Spike'
    OTHER = 'OTHER', 'Other'


# ==========================================================
# TASK STATUS CHOICES
# ==========================================================
class TaskStatus(models.TextChoices):
    BACKLOG = 'BACKLOG', 'Backlog'
    TODO = 'TODO', 'To Do'
    IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
    IN_REVIEW = 'IN_REVIEW', 'In Review'
    DONE = 'DONE', 'Done'
    OVERDUE = 'OVERDUE', 'Overdue'


# ==========================================================
# TASK MODEL (Tenant-specific)
# ==========================================================
class Task(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Parent project
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='tasks'
    )

    # Task Details
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    acceptance_criteria = models.TextField(
        blank=True,
        null=True,
        help_text="Definition of done / acceptance criteria."
    )

    # Classification
    task_type = models.CharField(
        max_length=30,
        choices=TaskType.choices,
        default=TaskType.FEATURE
    )
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.MEDIUM
    )
    status = models.CharField(
        max_length=20,
        choices=TaskStatus.choices,
        default=TaskStatus.TODO
    )


# Escalation tracking
    is_escalated = models.BooleanField(
        default=False
    )
    # Progress & Effort
    progress_percentage = models.PositiveSmallIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    estimated_hours = models.DecimalField(
        max_digits=6,
        decimal_places=1,
        null=True,
        blank=True
    )
    notes = models.TextField(blank=True, null=True, help_text="Developer work notes.")

    # Git tracking
    branch_name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Git branch name for this task."
    )

    # Timeline
    due_date = models.DateField(null=True, blank=True)

    # Assignment
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tasks'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_tasks'
    )

    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-priority', 'due_date']
        verbose_name = 'Task'
        verbose_name_plural = 'Tasks'

    def __str__(self):
        return f"{self.title} [{self.get_status_display()}]"


# ==========================================================
# TASK COMMENT MODEL
# ==========================================================
class TaskComment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.author.email} on {self.task.title}"


class TaskChecklistItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='checklist_items')
    content = models.CharField(max_length=255)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.content} ({'Done' if self.is_completed else 'Pending'})"

class TaskEvidence(models.Model):

    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="evidences"
    )

    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )

    file_key = models.TextField()

    file_name = models.CharField(
        max_length=255
    )

    uploaded_at = models.DateTimeField(
        auto_now_add=True
    )