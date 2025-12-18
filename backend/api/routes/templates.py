"""
Template routes for FastAPI.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from django.contrib.auth.models import User

from core.models import Template
from api.schemas import TemplateResponse
from api.routes.auth import get_current_active_user

router = APIRouter()


@router.get("/", response_model=List[TemplateResponse])
async def list_templates(
    active_only: bool = True,
    current_user: User = Depends(get_current_active_user),
):
    """List all templates."""
    queryset = Template.objects.all()
    if active_only:
        queryset = queryset.filter(is_active=True)

    return [
        TemplateResponse(
            version=t.version,
            name=t.name,
            description=t.description,
            layout_spec=t.layout_spec,
            is_active=t.is_active,
            created_at=t.created_at,
            updated_at=t.updated_at,
        )
        for t in queryset
    ]


@router.get("/{version}", response_model=TemplateResponse)
async def get_template(
    version: str,
    current_user: User = Depends(get_current_active_user),
):
    """Get a template by version."""
    try:
        template = Template.objects.get(version=version)
    except Template.DoesNotExist:
        raise HTTPException(status_code=404, detail="Template not found")

    return TemplateResponse(
        version=template.version,
        name=template.name,
        description=template.description,
        layout_spec=template.layout_spec,
        is_active=template.is_active,
        created_at=template.created_at,
        updated_at=template.updated_at,
    )
