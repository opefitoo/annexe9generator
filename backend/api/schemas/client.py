"""
Pydantic schemas for Client model.
"""

from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field
from enum import Enum


class TitleType(str, Enum):
    MADAME = "Madame"
    MONSIEUR = "Monsieur"
    SOCIETE = "Société"


class ClientBase(BaseModel):
    """Base schema for Client."""
    title: TitleType = TitleType.MONSIEUR
    name: str = Field(..., min_length=1, max_length=200)
    address: str = Field(..., min_length=1, max_length=300)
    address_number: Optional[str] = ""
    postal_code: str = Field(..., pattern=r"^\d{4,5}$")
    locality: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = ""
    gsm: Optional[str] = ""


class ClientCreate(ClientBase):
    """Schema for creating a client."""
    pass


class ClientUpdate(BaseModel):
    """Schema for updating a client."""
    title: Optional[TitleType] = None
    name: Optional[str] = None
    address: Optional[str] = None
    address_number: Optional[str] = None
    postal_code: Optional[str] = None
    locality: Optional[str] = None
    phone: Optional[str] = None
    gsm: Optional[str] = None


class ClientResponse(ClientBase):
    """Schema for client response."""
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ClientListResponse(BaseModel):
    """Schema for paginated client list response."""
    items: List[ClientResponse]
    total: int


class ClientSearchResponse(BaseModel):
    """Schema for client search results."""
    items: List[ClientResponse]
