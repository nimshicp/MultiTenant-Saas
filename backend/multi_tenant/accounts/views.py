from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.conf import settings

from .serializers import (
    LoginSerializer,
    CreateProjectManagerSerializer,
    UserSerializer,
)


class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = authenticate(
            email=serializer.validated_data['email'],
            password=serializer.validated_data['password']
        )
        
        if not user:
            return Response({'error': 'Invalid credentials'}, status=401)
        
        if not user.is_active:
            return Response({'error': 'Account disabled'}, status=401)
        
        refresh = RefreshToken.for_user(user)
        
        response = Response({
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        })
        
        response.set_cookie(
            key='refresh_token',
            value=str(refresh),
            httponly=True,
            secure=settings.COOKIE_SECURE,
            samesite='Lax',
            max_age=settings.REFRESH_TOKEN_LIFETIME,
            path='/api/token/refresh/'
        )
        
        return response


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        response = Response({'message': 'Logged out successfully'})
        response.delete_cookie('refresh_token', path='/api/token/refresh/')
        return response


class RefreshTokenView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token')
        
        if not refresh_token:
            return Response({'error': 'Refresh token not found'}, status=401)
        
        try:
            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)
            return Response({'access': access_token})
        except Exception:
            return Response({'error': 'Invalid refresh token'}, status=401)


class CreateProjectManagerView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        if request.user.role != 'company_admin':
            return Response(
                {'error': 'Only company admins can create project managers'},
                status=403
            )
        
        serializer = CreateProjectManagerSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        email_sent = self._send_welcome_email(user, request.data.get('password'))
        
        return Response({
            'success': True,
            'message': f'Project manager {user.name} created successfully',
            'user': UserSerializer(user).data,
            'email_sent': email_sent
        }, status=201)
    

    def _send_welcome_email(self, user, plain_password):
        try:
            tenant_name = self.request.tenant.name if hasattr(self.request, 'tenant') else "Company"

            subject = f"Welcome to {tenant_name}"

            message = f"""
Hello {user.name},

Your account has been created successfully.

Login Details:
Email: {user.email}
Password: {plain_password}

Login URL:
http://{self.request.get_host()}/api/auth/login/

Thank you!
"""

            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False
            )

            return True

        except Exception as e:
            print("EMAIL ERROR:", str(e))
            return False


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response(UserSerializer(request.user).data)
