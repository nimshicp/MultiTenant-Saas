from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = 'django-insecure-replace-in-production'
DEBUG = True


ALLOWED_HOSTS = ['.localhost', '127.0.0.1', 'backend', '0.0.0.0']

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# Allow any tenant subdomain running on your React dev environment port
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^http://.*\.localhost:5173$",
    r"^http://localhost:5173$",
]

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://*.localhost:5173", # 🚀 FIX: Trust CSRF tokens coming from tenant subdomains
]



CORS_ALLOW_HEADERS = [
    "authorization",
    "content-type",
    "x-csrftoken",
]


CORS_ALLOW_CREDENTIALS = True

PUBLIC_SCHEMA_NAME = 'public'
PUBLIC_SCHEMA_URLCONF = 'multi_tenant.public_urls'
TENANT_URLCONF = 'multi_tenant.urls'

SHOW_PUBLIC_IF_NO_TENANT_FOUND = True


ROOT_URLCONF = 'multi_tenant.urls'





SHARED_APPS = [
    'django_tenants',
    'customers',
    'platform_admin',
    'accounts', 
    'billing',
    'django_celery_beat',
    'django.contrib.admin',  
    'django.contrib.contenttypes',
    'django.contrib.auth',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'rest_framework',

    'corsheaders',
    'channels',
    
]

TENANT_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.auth',
    'employee', 
    'projects',
    'chat',
    'meeting',
    'documents',
    
]

INSTALLED_APPS = SHARED_APPS + [
    app for app in TENANT_APPS
    if app not in SHARED_APPS
]

AUTH_USER_MODEL = 'accounts.User' 



TENANT_MODEL = "customers.Tenant"
TENANT_DOMAIN_MODEL = "customers.Domain"

DATABASE_ROUTERS = (
    'django_tenants.routers.TenantSyncRouter',
)



AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',  
]


REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

ASGI_APPLICATION = "multi_tenant.asgi.application"


SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),

    'AUTH_HEADER_TYPES': ['Bearer'],
    'AUTH_COOKIE': 'access', # Matches the 'response.set_cookie' key
    'AUTH_COOKIE_REFRESH': 'refresh', # Matches the 'response.set_cookie' key
    'AUTH_COOKIE_HTTP_ONLY': True,
    'AUTH_COOKIE_PATH': '/',
    'AUTH_COOKIE_SAMESITE': 'Lax',
}

 


MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',              
    'django_tenants.middleware.main.TenantMainMiddleware', 
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

WSGI_APPLICATION = 'multi_tenant.wsgi.application'




DATABASES = {
    'default': {
        'ENGINE': 'django_tenants.postgresql_backend',
        'NAME': os.getenv("DB_NAME", "multi_tenant_db"),
        'USER': os.getenv("DB_USER", "postgres"),
        'PASSWORD': os.getenv("DB_PASSWORD", ""),
        'HOST': os.getenv("DB_HOST", "postgres"),
        'PORT': os.getenv("DB_PORT", "5432"),     
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]



# settings.py

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'], 
        'APP_DIRS': True,  
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True


STATIC_URL = 'static/'


EMAIL_BACKEND = os.getenv(
    "EMAIL_BACKEND",
    "django.core.mail.backends.smtp.EmailBackend"
)

EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")

EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))

EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "True") == "True"

EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")

EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")

DEFAULT_FROM_EMAIL = os.getenv(
    "DEFAULT_FROM_EMAIL",
    EMAIL_HOST_USER
)


RAZORPAY_KEY_ID = os.getenv('RAZORPAY_KEY_ID')
RAZORPAY_KEY_SECRET = os.getenv('RAZORPAY_SECRET')

CELERY_BROKER_URL = os.getenv(
    "CELERY_BROKER_URL",
    "amqp://guest:guest@localhost:5672//"
)
CELERY_ACCEPT_CONTENT = ["json"]

CELERY_TASK_SERIALIZER = "json"

CELERY_RESULT_SERIALIZER = "json"

CELERY_TIMEZONE = "UTC"

CELERY_RESULT_BACKEND = "rpc://"


from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {

    # Task reminders
    "task-deadline-reminders": {
        "task": "projects.tasks.send_task_deadline_reminders",
        "schedule": crontab(hour=9, minute=0),
    },

    # Auto overdue task update
    "update-overdue-tasks": {
        "task": "projects.tasks.update_overdue_tasks",
        "schedule": crontab(hour=9, minute=0),
    },

    # Project manager reminders
    "project-deadline-reminders": {
        "task": "projects.tasks.send_project_deadline_reminders",
        "schedule": crontab(hour=9, minute=0),
    },

    # Auto overdue project update
    "update-overdue-projects": {
        "task": "projects.tasks.update_overdue_projects",
        "schedule": crontab(hour=9, minute=0),
    },

    # Admin alerts
    "admin-project-alerts": {
        "task": "projects.tasks.send_admin_project_alerts",
        "schedule": crontab(hour=9, minute=0),
    },
    
    # existing schedules

    "meeting-reminders": {
        "task": "meeting.tasks.send_meeting_reminders",
        "schedule": crontab(hour=9, minute=0),
    },

}





AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "")

AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")

AWS_STORAGE_BUCKET_NAME = os.getenv("AWS_STORAGE_BUCKET_NAME", "")

AWS_REGION_NAME = os.getenv(
    "AWS_REGION_NAME",
    os.getenv("AWS_S3_REGION_NAME", "ap-south-2")
)

AWS_S3_CUSTOM_DOMAIN = os.getenv(
    "AWS_S3_CUSTOM_DOMAIN",
    f"{AWS_STORAGE_BUCKET_NAME}.s3.{AWS_REGION_NAME}.amazonaws.com"
)

AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://ai-service:8000")


CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [
                (
                    os.getenv("REDIS_HOST", "127.0.0.1"),
                    int(os.getenv("REDIS_PORT", 6379))
                )
            ],
        },
    },
}
