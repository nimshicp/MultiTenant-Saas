from rest_framework.views import APIView
from rest_framework.response import Response
from accounts.permissions import IsSuperAdmin
from accounts.serializers import UserSerializer
from customers.models import Client

class PlatformDashboardView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        tenants = Client.objects.all()
        return Response({
            "platform_admin": UserSerializer(request.user).data,
            "stats": {
                "total_tenants": tenants.count(),
                "active": tenants.filter(is_active=True).count()
            }
        })