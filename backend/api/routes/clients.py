"""
Client routes for FastAPI.
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from django.contrib.auth.models import User
from django.db.models import Q
from asgiref.sync import sync_to_async

from core.models import Client
from api.schemas import (
    ClientCreate,
    ClientUpdate,
    ClientResponse,
    ClientListResponse,
    ClientSearchResponse,
)
from api.routes.auth import get_current_active_user

router = APIRouter()


def client_to_response(client: Client) -> ClientResponse:
    """Convert Django Client model to Pydantic response."""
    return ClientResponse(
        id=client.id,
        title=client.title or "Monsieur",
        name=client.name,
        address=client.address,
        address_number=client.address_number or "",
        postal_code=client.postal_code,
        locality=client.locality,
        phone=client.phone or "",
        gsm=client.gsm or "",
        created_at=client.created_at,
        updated_at=client.updated_at,
    )


@sync_to_async
def _search_clients_sync(query: str, limit: int = 10) -> list:
    """Search clients by name, address, or phone."""
    if not query or len(query) < 2:
        return []

    queryset = Client.objects.filter(
        Q(name__icontains=query)
        | Q(address__icontains=query)
        | Q(locality__icontains=query)
        | Q(phone__icontains=query)
        | Q(gsm__icontains=query)
    )[:limit]

    return list(queryset)


@sync_to_async
def _list_clients_sync(page: int, page_size: int) -> tuple:
    """List all clients with pagination."""
    queryset = Client.objects.all()
    total = queryset.count()
    offset = (page - 1) * page_size
    clients = list(queryset[offset:offset + page_size])
    return clients, total


@sync_to_async
def _get_client_by_id(client_id: UUID) -> Optional[Client]:
    try:
        return Client.objects.get(id=client_id)
    except Client.DoesNotExist:
        return None


@sync_to_async
def _create_client_sync(client_data: dict) -> Client:
    """Create a new client."""
    client = Client(**client_data)
    client.save()
    return client


@sync_to_async
def _update_client_sync(client_id: UUID, update_data: dict) -> Optional[Client]:
    """Update an existing client."""
    try:
        client = Client.objects.get(id=client_id)
    except Client.DoesNotExist:
        return None

    for field, value in update_data.items():
        if hasattr(client, field) and value is not None:
            setattr(client, field, value)

    client.save()
    return client


@sync_to_async
def _delete_client_sync(client_id: UUID) -> bool:
    """Delete a client."""
    try:
        client = Client.objects.get(id=client_id)
        client.delete()
        return True
    except Client.DoesNotExist:
        return False


@sync_to_async
def _find_or_create_client_sync(client_data: dict) -> tuple:
    """Find existing client by name and locality, or create new one."""
    # Try to find existing client
    existing = Client.objects.filter(
        name__iexact=client_data.get('name', ''),
        locality__iexact=client_data.get('locality', '')
    ).first()

    if existing:
        # Update existing client with new data
        for field, value in client_data.items():
            if hasattr(existing, field) and value:
                setattr(existing, field, value)
        existing.save()
        return existing, False  # False = not created
    else:
        # Create new client
        client = Client(**client_data)
        client.save()
        return client, True  # True = created


@router.get("/search", response_model=ClientSearchResponse)
async def search_clients(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(default=10, ge=1, le=50),
    current_user: User = Depends(get_current_active_user),
):
    """Search clients by name, address, locality, or phone."""
    clients = await _search_clients_sync(q, limit)
    return ClientSearchResponse(
        items=[client_to_response(c) for c in clients]
    )


@router.get("/", response_model=ClientListResponse)
async def list_clients(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
):
    """List all clients with pagination."""
    clients, total = await _list_clients_sync(page, page_size)
    return ClientListResponse(
        items=[client_to_response(c) for c in clients],
        total=total,
    )


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: UUID,
    current_user: User = Depends(get_current_active_user),
):
    """Get a single client by ID."""
    client = await _get_client_by_id(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client_to_response(client)


@router.post("/", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(
    client_data: ClientCreate,
    current_user: User = Depends(get_current_active_user),
):
    """Create a new client."""
    client = await _create_client_sync(client_data.model_dump())
    return client_to_response(client)


@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: UUID,
    client_data: ClientUpdate,
    current_user: User = Depends(get_current_active_user),
):
    """Update an existing client."""
    update_data = client_data.model_dump(exclude_unset=True)
    client = await _update_client_sync(client_id, update_data)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client_to_response(client)


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: UUID,
    current_user: User = Depends(get_current_active_user),
):
    """Delete a client."""
    success = await _delete_client_sync(client_id)
    if not success:
        raise HTTPException(status_code=404, detail="Client not found")
    return None


@router.post("/find-or-create", response_model=ClientResponse)
async def find_or_create_client(
    client_data: ClientCreate,
    current_user: User = Depends(get_current_active_user),
):
    """Find existing client or create new one."""
    client, created = await _find_or_create_client_sync(client_data.model_dump())
    return client_to_response(client)
