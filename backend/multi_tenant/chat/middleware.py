from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware

from django.contrib.auth import get_user_model
from django.db import connection

from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from customers.models import Tenant


User = get_user_model()


@database_sync_to_async
def get_user(user_id):
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return None


@database_sync_to_async
def set_tenant_schema(host):

    hostname = host.split(":")[0]

    subdomain = hostname.split(".")[0]

    if subdomain in ["localhost", "127", "www"]:
        connection.set_schema_to_public()
        return

    try:
        tenant = Tenant.objects.get(schema_name=f"tenant_{subdomain}")

        connection.set_schema(tenant.schema_name)

        print("ACTIVE SCHEMA:", tenant.schema_name)

    except Tenant.DoesNotExist:

        connection.set_schema_to_public()

        print("TENANT NOT FOUND -> USING PUBLIC")


class JwtAuthMiddleware(BaseMiddleware):

    async def __call__(self, scope, receive, send):

        host = dict(scope["headers"]).get(
            b"host",
            b""
        ).decode()

        await set_tenant_schema(host)

        try:

            query_string = scope["query_string"].decode()

            query_params = parse_qs(query_string)

            token = query_params.get("token", [None])[0]

            if token:

                access_token = AccessToken(token)

                user_id = access_token["user_id"]

                user = await get_user(user_id)

                if user:

                    scope["user"] = user

                    print("AUTH USER:", user)

        except (InvalidToken, TokenError, Exception) as e:

            print("JWT AUTH ERROR:", str(e))

        return await super().__call__(
            scope,
            receive,
            send
        )