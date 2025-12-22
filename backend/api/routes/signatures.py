"""
Signature routes for FastAPI.

Provides secure signature capture and storage with encryption.
"""

from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from django.contrib.auth.models import User
from django.utils import timezone
from asgiref.sync import sync_to_async

from core.models import Order
from api.routes.auth import get_current_active_user, get_staff_user
from api.services.crypto import (
    encrypt_signature,
    decrypt_signature,
    encode_base64_to_bytes,
    bytes_to_base64_data_url,
)

router = APIRouter()


class SignatureSubmit(BaseModel):
    """Schema for signature submission."""
    signature_data: str  # Base64 encoded PNG data URL


class SignatureTokenResponse(BaseModel):
    """Response with signature URL token."""
    signature_url: str
    expires_at: datetime


class PublicOrderResponse(BaseModel):
    """Limited order info for public signature page."""
    id: UUID
    reference: str
    operator_title: Optional[str] = None
    operator_name: str
    operator_address: str
    operator_address_number: Optional[str] = None
    operator_postal_code: str
    operator_locality: str
    client_title: Optional[str] = None
    client_name: str
    client_address: str
    client_address_number: Optional[str] = None
    client_postal_code: str
    client_locality: str
    service_type: str
    passengers_adult: int
    passengers_child: int
    aller_date: Optional[str] = None
    aller_time: Optional[str] = None
    aller_departure: Optional[str] = None
    aller_destination: Optional[str] = None
    aller_price: Optional[float] = None
    retour_date: Optional[str] = None
    retour_time: Optional[str] = None
    retour_departure: Optional[str] = None
    retour_destination: Optional[str] = None
    retour_price: Optional[float] = None
    has_signature: bool = False


@sync_to_async
def _get_order_by_id(order_id: UUID) -> Optional[Order]:
    """Get order by ID."""
    try:
        return Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        return None


@sync_to_async
def _get_order_by_token(token: UUID) -> Optional[Order]:
    """Get order by signature token (validates expiration)."""
    try:
        order = Order.objects.get(signature_token=token)
        # Check if token is expired
        if order.signature_token_expires and order.signature_token_expires < timezone.now():
            return None
        return order
    except Order.DoesNotExist:
        return None


@sync_to_async
def _generate_signature_token(order: Order, hours_valid: int = 24) -> Order:
    """Generate a new signature token for the order."""
    import uuid
    order.signature_token = uuid.uuid4()
    order.signature_token_expires = timezone.now() + timedelta(hours=hours_valid)
    order.save(update_fields=['signature_token', 'signature_token_expires'])
    return order


@sync_to_async
def _save_client_signature(order: Order, encrypted_data: bytes) -> Order:
    """Save encrypted client signature."""
    order.client_signature = encrypted_data
    order.client_signature_date = timezone.now()
    # Invalidate the token after use
    order.signature_token_expires = timezone.now()
    order.save(update_fields=['client_signature', 'client_signature_date', 'signature_token_expires'])
    return order


def order_to_public_response(order: Order) -> PublicOrderResponse:
    """Convert Order to public response (limited info for signature page)."""
    return PublicOrderResponse(
        id=order.id,
        reference=order.reference,
        operator_title=order.operator_title,
        operator_name=order.operator_name,
        operator_address=order.operator_address,
        operator_address_number=order.operator_address_number,
        operator_postal_code=order.operator_postal_code,
        operator_locality=order.operator_locality,
        client_title=order.client_title,
        client_name=order.client_name,
        client_address=order.client_address,
        client_address_number=order.client_address_number,
        client_postal_code=order.client_postal_code,
        client_locality=order.client_locality,
        service_type=order.service_type,
        passengers_adult=order.passengers_adult,
        passengers_child=order.passengers_child,
        aller_date=str(order.aller_date) if order.aller_date else None,
        aller_time=str(order.aller_time) if order.aller_time else None,
        aller_departure=order.aller_departure,
        aller_destination=order.aller_destination,
        aller_price=float(order.aller_price) if order.aller_price else None,
        retour_date=str(order.retour_date) if order.retour_date else None,
        retour_time=str(order.retour_time) if order.retour_time else None,
        retour_departure=order.retour_departure,
        retour_destination=order.retour_destination,
        retour_price=float(order.retour_price) if order.retour_price else None,
        has_signature=order.client_signature is not None,
    )


# ==================== AUTHENTICATED ROUTES ====================

@router.post("/{order_id}/generate-link", response_model=SignatureTokenResponse)
async def generate_signature_link(
    order_id: UUID,
    hours_valid: int = 24,
    current_user: User = Depends(get_staff_user),
):
    """
    Generate a secure signature link for the client.
    Requires staff privileges.

    This creates a time-limited token that allows the client to
    access the signature page without logging in.
    """
    order = await _get_order_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order = await _generate_signature_token(order, hours_valid)

    return SignatureTokenResponse(
        signature_url=f"/sign/{order.signature_token}",
        expires_at=order.signature_token_expires,
    )


@router.get("/{order_id}/status")
async def get_signature_status(
    order_id: UUID,
    current_user: User = Depends(get_current_active_user),
):
    """Get signature status for an order."""
    order = await _get_order_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return {
        "has_client_signature": order.client_signature is not None,
        "client_signature_date": order.client_signature_date,
        "has_operator_signature": order.operator_signature is not None,
    }


# ==================== PUBLIC ROUTES (Token-based) ====================

@router.get("/public/{token}", response_model=PublicOrderResponse)
async def get_order_for_signature(token: UUID):
    """
    Get order details for signature page (public, token-based access).

    The token must be valid and not expired.
    """
    order = await _get_order_by_token(token)
    if not order:
        raise HTTPException(
            status_code=404,
            detail="Lien invalide ou expiré. Veuillez demander un nouveau lien."
        )

    return order_to_public_response(order)


@router.post("/public/{token}", status_code=status.HTTP_201_CREATED)
async def submit_signature(token: UUID, data: SignatureSubmit):
    """
    Submit client signature (public, token-based access).

    The signature data is encrypted before storage.
    The token is invalidated after use.
    """
    order = await _get_order_by_token(token)
    if not order:
        raise HTTPException(
            status_code=404,
            detail="Lien invalide ou expiré. Veuillez demander un nouveau lien."
        )

    # Already signed?
    if order.client_signature:
        raise HTTPException(
            status_code=400,
            detail="Ce bon de commande a déjà été signé."
        )

    try:
        # Convert base64 to bytes
        raw_signature = encode_base64_to_bytes(data.signature_data)

        # Encrypt the signature
        encrypted_signature = encrypt_signature(raw_signature)

        # Save encrypted signature
        await _save_client_signature(order, encrypted_signature)

        return {"message": "Signature enregistrée avec succès"}

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Erreur lors de l'enregistrement de la signature"
        )
