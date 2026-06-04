import requests

from django.conf import settings
from django.core.files.base import ContentFile
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from employee.models import Role

from .models import Document


def _is_admin(user):
    return hasattr(user, "employee_profile") and user.employee_profile.role == Role.ADMIN


class DocumentListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_admin(request.user):
            return Response(
                {"detail": "Forbidden"},
                status=status.HTTP_403_FORBIDDEN,
            )

        documents = Document.objects.filter(
            tenant=request.tenant
        ).order_by("-uploaded_at")

        return Response(
            {
                "documents": [
                    {
                        "document_id": str(document.id),
                        "filename": document.filename,
                        "uploaded_at": document.uploaded_at.isoformat(),
                        "is_processed": document.is_processed,
                    }
                    for document in documents
                ]
            }
        )

    def post(self, request):
        if not _is_admin(request.user):
            return Response(
                {"detail": "Forbidden"},
                status=status.HTTP_403_FORBIDDEN,
            )

        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            return Response(
                {"detail": "file is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        schema_name = request.tenant.schema_name
        file_bytes = uploaded_file.read()

        document = Document.objects.create(
            tenant=request.tenant,
            filename=uploaded_file.name,
            file=ContentFile(file_bytes, name=uploaded_file.name),
            is_processed=False,
        )

        try:
            response = requests.post(
                f"{settings.AI_SERVICE_URL}/upload-document",
                files={
                    "file": (
                        uploaded_file.name,
                        file_bytes,
                        uploaded_file.content_type or "application/pdf",
                    )
                },
                data={
                    "schema_name": schema_name,
                    "document_id": str(document.id),
                },
                timeout=120,
            )
            response.raise_for_status()

            document.is_processed = True
            document.save(update_fields=["is_processed", "updated_at"])

            payload = response.json()
            return Response(
                {
                    "document_id": str(document.id),
                    "filename": document.filename,
                    "uploaded_at": document.uploaded_at.isoformat(),
                    "is_processed": document.is_processed,
                    "chunks_count": payload.get("chunks_count", 0),
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as exc:
            
            print("=" * 50)
            print("UPLOAD ERROR")
            print(repr(exc))
            print("=" * 50)


            document.is_processed = False
            document.save(update_fields=["is_processed", "updated_at"])
            return Response(
                {
                    "document_id": str(document.id),
                    "filename": document.filename,
                    "uploaded_at": document.uploaded_at.isoformat(),
                    "is_processed": document.is_processed,
                    "chunks_count": 0,
                    "detail": (
                        "File was saved, but indexing is not complete yet."
                    ),
                    "error": str(exc),
                },
                status=status.HTTP_202_ACCEPTED,
            )


class DocumentDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, document_id):
        if not _is_admin(request.user):
            return Response(
                {"detail": "Forbidden"},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            document = Document.objects.get(
                tenant=request.tenant,
                id=document_id,
            )
        except Document.DoesNotExist:
            return Response(
                {"detail": "Document not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        ai_cleanup_error = None
        try:
            response = requests.delete(
                f"{settings.AI_SERVICE_URL}/documents/{document_id}",
                params={
                    "schema_name": request.tenant.schema_name,
                },
                timeout=60,
            )
            response.raise_for_status()
        except Exception as exc:
            ai_cleanup_error = str(exc)

        document.delete()

        payload = {
            "document_id": document_id,
            "deleted": True,
        }

        if ai_cleanup_error:
            payload["warning"] = (
                "Document was removed from history, but AI cleanup failed."
            )
            payload["ai_error"] = ai_cleanup_error

        return Response(payload, status=status.HTTP_200_OK)
