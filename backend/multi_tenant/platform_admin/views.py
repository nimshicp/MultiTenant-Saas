from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from customers.models import Client

from .serializers import PlatformUserSerializer

class CurrentPlatformAdminView(APIView):


    permission_classes = [IsAuthenticated]

    def get(self, request):

        return Response(
            PlatformUserSerializer(request.user).data
        )


class PlatformDashboardView(APIView):


    permission_classes = [IsAuthenticated]

    def get(self, request):

        tenants = Client.objects.all()

        return Response({

            "platform_admin":
                PlatformUserSerializer(request.user).data,

            "tenant_stats": {

                "total_tenants":
                    tenants.count(),

                "active_tenants":
                    tenants.filter(is_active=True).count(),

                "inactive_tenants":
                    tenants.filter(is_active=False).count(),
            }
        })

