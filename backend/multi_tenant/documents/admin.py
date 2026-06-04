from django.contrib import admin
from .models import Document


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = (
        "filename",
        "tenant",
        "is_processed",
        "uploaded_at",
    )

    list_filter = (
        "tenant",
        "is_processed",
    )

    search_fields = (
        "filename",
    )