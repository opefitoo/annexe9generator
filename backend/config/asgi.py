"""
ASGI config for Annex 9 Generator project.
Combines Django and FastAPI applications.
"""

import os
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

# Initialize Django first
django_asgi_app = get_asgi_application()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.routing import Mount
from django.conf import settings

from api.main import app as fastapi_app


# Create combined ASGI application
async def application(scope, receive, send):
    if scope["type"] == "http":
        path = scope.get("path", "")
        # Route /api/* requests to FastAPI
        if path.startswith("/api"):
            await fastapi_app(scope, receive, send)
        else:
            # Route everything else to Django
            await django_asgi_app(scope, receive, send)
    else:
        await django_asgi_app(scope, receive, send)
