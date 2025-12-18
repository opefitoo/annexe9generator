"""
Pydantic schemas for Template model.
"""

from datetime import datetime
from typing import Dict, Any
from pydantic import BaseModel


class TemplateResponse(BaseModel):
    """Schema for template response."""

    version: str
    name: str
    description: str
    layout_spec: Dict[str, Any]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
