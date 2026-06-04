import uuid

from django.db import models
from customers.models import Tenant


class Document(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name="documents"
    )

    filename = models.CharField(
        max_length=255
    )

    file = models.FileField(
        upload_to="documents/"
    )

    uploaded_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    is_processed = models.BooleanField(
        default=False
    )

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"{self.filename}"