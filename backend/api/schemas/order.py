"""
Pydantic schemas for Order model.
"""

from datetime import date, time, datetime
from decimal import Decimal
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, field_validator
from enum import Enum


class ServiceType(str, Enum):
    ALLER = "aller"
    RETOUR = "retour"
    ALLER_RETOUR = "aller_retour"


class TitleType(str, Enum):
    MADAME = "Madame"
    MONSIEUR = "Monsieur"
    SOCIETE = "Société"


class OrderStatus(str, Enum):
    DRAFT = "draft"
    GENERATED = "generated"
    SENT = "sent"
    ARCHIVED = "archived"


class OrderBase(BaseModel):
    """Base schema for Order."""

    # Reservation
    reservation_date: date
    reservation_number: Optional[str] = ""

    # Operator
    operator_title: TitleType = TitleType.SOCIETE
    operator_name: str = Field(..., min_length=1, max_length=200)
    operator_address: str = Field(..., min_length=1, max_length=300)
    operator_address_number: Optional[str] = ""
    operator_postal_code: str = Field(..., pattern=r"^\d{4,5}$")
    operator_locality: str = Field(..., min_length=1, max_length=100)
    operator_bce_number: Optional[str] = ""
    operator_authorization_number: Optional[str] = ""
    operator_authorization_date: Optional[date] = None

    # Client
    client_title: TitleType = TitleType.MONSIEUR
    client_name: str = Field(..., min_length=1, max_length=200)
    client_address: str = Field(..., min_length=1, max_length=300)
    client_address_number: Optional[str] = ""
    client_postal_code: str = Field(..., pattern=r"^\d{4,5}$")
    client_locality: str = Field(..., min_length=1, max_length=100)
    client_phone: Optional[str] = ""
    client_gsm: Optional[str] = ""

    # Passengers
    passengers_adult: int = Field(default=1, ge=0)
    passengers_child: int = Field(default=0, ge=0)

    # Service
    service_type: ServiceType = ServiceType.ALLER

    # Trip - Aller
    aller_date: Optional[date] = None
    aller_time: Optional[time] = None
    aller_departure: Optional[str] = ""
    aller_destination: Optional[str] = ""
    aller_price: Optional[Decimal] = None

    # Trip - Retour
    retour_date: Optional[date] = None
    retour_time: Optional[time] = None
    retour_departure: Optional[str] = ""
    retour_destination: Optional[str] = ""
    retour_price: Optional[Decimal] = None


class OrderCreate(OrderBase):
    """Schema for creating an order."""

    template_version: str = "Annex9_v2013"

    @field_validator("service_type")
    @classmethod
    def validate_trip_fields(cls, v, info):
        return v


class OrderUpdate(BaseModel):
    """Schema for updating an order."""

    reservation_date: Optional[date] = None
    reservation_number: Optional[str] = None

    operator_title: Optional[TitleType] = None
    operator_name: Optional[str] = None
    operator_address: Optional[str] = None
    operator_address_number: Optional[str] = None
    operator_postal_code: Optional[str] = None
    operator_locality: Optional[str] = None
    operator_bce_number: Optional[str] = None
    operator_authorization_number: Optional[str] = None
    operator_authorization_date: Optional[date] = None

    client_title: Optional[TitleType] = None
    client_name: Optional[str] = None
    client_address: Optional[str] = None
    client_address_number: Optional[str] = None
    client_postal_code: Optional[str] = None
    client_locality: Optional[str] = None
    client_phone: Optional[str] = None
    client_gsm: Optional[str] = None

    passengers_adult: Optional[int] = None
    passengers_child: Optional[int] = None

    service_type: Optional[ServiceType] = None
    status: Optional[OrderStatus] = None

    aller_date: Optional[date] = None
    aller_time: Optional[time] = None
    aller_departure: Optional[str] = None
    aller_destination: Optional[str] = None
    aller_price: Optional[Decimal] = None

    retour_date: Optional[date] = None
    retour_time: Optional[time] = None
    retour_departure: Optional[str] = None
    retour_destination: Optional[str] = None
    retour_price: Optional[Decimal] = None


class OrderResponse(OrderBase):
    """Schema for order response."""

    id: UUID
    reference: str
    template_version: str
    status: OrderStatus
    language: str
    pdf_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OrderListResponse(BaseModel):
    """Schema for paginated order list response."""

    items: List[OrderResponse]
    total: int
    page: int
    page_size: int
    pages: int


class OrderFilters(BaseModel):
    """Schema for order filtering."""

    search: Optional[str] = None
    status: Optional[OrderStatus] = None
    service_type: Optional[ServiceType] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
