"""
FastAPI application for Annex 9 Generator API.
"""

import os
import django

# Initialize Django before importing models
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from django.conf import settings

from api.routes import orders, auth, pdf, templates, clients, operator, signatures

# Create FastAPI app
app = FastAPI(
    title="Annex 9 Generator API",
    description="API for generating Walloon taxi collectif order forms (Annex 9)",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
app.include_router(clients.router, prefix="/api/clients", tags=["Clients"])
app.include_router(operator.router, prefix="/api/operator", tags=["Operator Config"])
app.include_router(templates.router, prefix="/api/templates", tags=["Templates"])
app.include_router(pdf.router, prefix="/api/pdf", tags=["PDF Generation"])
app.include_router(signatures.router, prefix="/api/signatures", tags=["Signatures"])


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "annex9-generator"}
