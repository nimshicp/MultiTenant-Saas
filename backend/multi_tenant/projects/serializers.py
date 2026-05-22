# projects/serializers.py

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Project, Task, TaskComment,TaskChecklistItem,TaskEvidence

User = get_user_model()


# ==========================================================
# USER MINI SERIALIZER (for nested display)
# ==========================================================
class UserMiniSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'full_name']

    def get_full_name(self, obj):
        if hasattr(obj, 'profile'):
            return obj.profile.full_name
        return obj.email


# ==========================================================
# TASK COMMENT SERIALIZER
# ==========================================================
class TaskCommentSerializer(serializers.ModelSerializer):
    author_detail = UserMiniSerializer(source='author', read_only=True)

    class Meta:
        model = TaskComment
        fields = ['id', 'task', 'author', 'author_detail', 'content', 'created_at']
        read_only_fields = ['id', 'author', 'author_detail', 'created_at']

    def create(self, validated_data):
        request = self.context['request']
        return TaskComment.objects.create(author=request.user, **validated_data)


# ==========================================================
# PROJECT SERIALIZER
# ==========================================================
class ProjectSerializer(serializers.ModelSerializer):
    # Write fields
    project_manager = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=False,
        allow_null=True
    )
    team_members = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        many=True,
        required=False
    )

    # Read-only display fields
    project_manager_detail = UserMiniSerializer(source='project_manager', read_only=True)
    team_members_detail = UserMiniSerializer(source='team_members', many=True, read_only=True)
    created_by_detail = UserMiniSerializer(source='created_by', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    project_type_display = serializers.CharField(source='get_project_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    task_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'project_type', 'project_type_display',
            'priority', 'priority_display', 'status', 'status_display',
            'tech_stack', 'repository_url', 'client_name', 'budget',
            'start_date', 'deadline', 'actual_end_date', 'progress_percentage',
            'project_manager', 'team_members', 'project_manager_detail',
            'team_members_detail', 'created_by_detail', 'task_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_by_detail', 'project_manager_detail', 'team_members_detail', 'status_display', 'project_type_display', 'priority_display', 'task_count', 'created_at', 'updated_at']

    def get_task_count(self, obj):
        return obj.tasks.count()

    def validate(self, attrs):
        start_date = attrs.get('start_date')
        deadline = attrs.get('deadline')
        if start_date and deadline and deadline < start_date:
            raise serializers.ValidationError({'deadline': 'Deadline must be on or after the start date.'})
        return attrs

    def create(self, validated_data):
        team_members = validated_data.pop('team_members', [])
        request = self.context['request']
        project = Project.objects.create(created_by=request.user, **validated_data)
        project.team_members.set(team_members)
        return project

    def update(self, instance, validated_data):
        team_members = validated_data.pop('team_members', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if team_members is not None:
            instance.team_members.set(team_members)
        return instance


# ==========================================================
# TASK CHECKLIST ITEM SERIALIZER
# ==========================================================
class TaskChecklistItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskChecklistItem
        fields = ['id', 'task', 'content', 'is_completed', 'created_at']
        read_only_fields = ['id', 'created_at']


# ==========================================================
# TASK SERIALIZER
# ==========================================================
class TaskSerializer(serializers.ModelSerializer):
    assigned_to_detail = UserMiniSerializer(source='assigned_to', read_only=True)
    created_by_detail = UserMiniSerializer(source='created_by', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    task_type_display = serializers.CharField(source='get_task_type_display', read_only=True)
    comments = TaskCommentSerializer(many=True, read_only=True)
    checklist_items = TaskChecklistItemSerializer(many=True, read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'project', 'title', 'description', 'acceptance_criteria',
            'task_type', 'task_type_display', 'priority', 'priority_display',
            'status', 'status_display', 'progress_percentage', 'estimated_hours',
            'notes', 'branch_name', 'due_date', 'assigned_to', 'assigned_to_detail',
            'created_by_detail', 'comments', 'checklist_items', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_by_detail', 'assigned_to_detail', 'status_display', 'priority_display', 'task_type_display', 'comments', 'checklist_items', 'created_at', 'updated_at']

    def create(self, validated_data):
        request = self.context['request']
        task = Task.objects.create(created_by=request.user, **validated_data)
        return task

class TaskEvidenceSerializer(serializers.ModelSerializer):

        uploaded_by_name =serializers.SerializerMethodField()

        class Meta:

            model = TaskEvidence

            fields = [

            "id",

            "file_key",

            "file_name",

            "uploaded_at",

            "uploaded_by_name"
        ]

        def get_uploaded_by_name(self,obj):

            try:

                return (
                obj.uploaded_by
                .profile
                .full_name
                or obj.uploaded_by.email
            )

            except Exception:

                return obj.uploaded_by.email