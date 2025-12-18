"""
Operator configuration routes for FastAPI.
"""

from fastapi import APIRouter, Depends
from django.contrib.auth.models import User
from asgiref.sync import sync_to_async

from core.models import OperatorConfig
from api.schemas import (
    OperatorConfigBase,
    OperatorConfigUpdate,
    OperatorConfigResponse,
)
from api.routes.auth import get_current_active_user

router = APIRouter()


def operator_to_response(operator: OperatorConfig) -> OperatorConfigResponse:
    """Convert Django OperatorConfig model to Pydantic response."""
    return OperatorConfigResponse(
        title=operator.title or "Société",
        name=operator.name,
        address=operator.address,
        address_number=operator.address_number or "",
        postal_code=operator.postal_code,
        locality=operator.locality,
        bce_number=operator.bce_number or "",
        authorization_number=operator.authorization_number or "",
        authorization_date=operator.authorization_date,
        updated_at=operator.updated_at,
        is_configured=bool(operator.name),  # True if name is set
    )


@sync_to_async
def _get_operator_config() -> OperatorConfig:
    """Get the singleton operator config instance."""
    return OperatorConfig.get_instance()


@sync_to_async
def _update_operator_config(data: dict) -> OperatorConfig:
    """Update the operator config."""
    operator = OperatorConfig.get_instance()
    for field, value in data.items():
        if hasattr(operator, field) and value is not None:
            setattr(operator, field, value)
    operator.save()
    return operator


@router.get("/", response_model=OperatorConfigResponse)
async def get_operator_config(
    current_user: User = Depends(get_current_active_user),
):
    """Get the current operator configuration."""
    operator = await _get_operator_config()
    return operator_to_response(operator)


@router.put("/", response_model=OperatorConfigResponse)
async def update_operator_config(
    config_data: OperatorConfigBase,
    current_user: User = Depends(get_current_active_user),
):
    """Update the operator configuration (full update)."""
    operator = await _update_operator_config(config_data.model_dump())
    return operator_to_response(operator)


@router.patch("/", response_model=OperatorConfigResponse)
async def partial_update_operator_config(
    config_data: OperatorConfigUpdate,
    current_user: User = Depends(get_current_active_user),
):
    """Partially update the operator configuration."""
    update_data = config_data.model_dump(exclude_unset=True)
    operator = await _update_operator_config(update_data)
    return operator_to_response(operator)
