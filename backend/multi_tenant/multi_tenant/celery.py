import os

from celery import Celery

from kombu import Queue


os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "multi_tenant.settings"
)

app = Celery("multi_tenant")

app.config_from_object(
    "django.conf:settings",
    namespace="CELERY"
)

app.conf.task_queues = (

    Queue("default"),

    Queue("emails"),
)

app.autodiscover_tasks()