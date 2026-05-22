import os

os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "multi_tenant.settings"
)

from django.core.asgi import get_asgi_application

django_asgi_app = get_asgi_application()

from channels.routing import (
    ProtocolTypeRouter,
    URLRouter,
)

import chat.routing

from chat.middleware import JwtAuthMiddleware


application = ProtocolTypeRouter({

    "http": django_asgi_app,

    "websocket": JwtAuthMiddleware(

        URLRouter(
            chat.routing.websocket_urlpatterns
        )
    ),
})