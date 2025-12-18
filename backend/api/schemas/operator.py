"""
Pydantic schemas for OperatorConfig model.
"""

from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field
from enum import Enum


class TitleType(str, Enum):
    MADAME = "Madame"
    MONSIEUR = "Monsieur"
    SOCIETE = "Société"


class OperatorConfigBase(BaseModel):
    """Base schema for OperatorConfig."""
    title: TitleType = TitleType.SOCIETE
    name: str = Field(..., min_length=1, max_length=200)
    address: str = Field(..., min_length=1, max_length=300)
    address_number: Optional[str] = ""
    postal_code: str = Field(..., pattern=r"^\d{4,5}$")
    locality: str = Field(..., min_length=1, max_length=100)
    bce_number: Optional[str] = ""
    authorization_number: Optional[str] = ""
    authorization_date: Optional[date] = None


class OperatorConfigUpdate(BaseModel):
    """Schema for updating operator config."""
    title: Optional[TitleType] = None
    name: Optional[str] = None
    address: Optional[str] = None
    address_number: Optional[str] = None
    postal_code: Optional[str] = None
    locality: Optional[str] = None
    bce_number: Optional[str] = None
    authorization_number: Optional[str] = None
    authorization_date: Optional[date] = None


class OperatorConfigResponse(BaseModel):
    """Schema for operator config response."""
    title: TitleType
    name: str
    address: str
    address_number: str
    postal_code: str
    locality: str
    bce_number: str
    authorization_number: str
    authorization_date: Optional[date]
    updated_at: datetime
    is_configured: bool = False  # True if operator has been configured

    class Config:
        from_attributes = True
