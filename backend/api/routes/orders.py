"""
Order routes for FastAPI.
"""

from typing import Optional, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from django.contrib.auth.models import User
from django.db.models import Q
from asgiref.sync import sync_to_async

from core.models import Order, Template, OrderAuditLog
from api.schemas import (
    OrderCreate,
    OrderUpdate,
    OrderResponse,
    OrderListResponse,
    OrderStatus,
    ServiceType,
)
from api.routes.auth import get_current_active_user, get_staff_user

router = APIRouter()


def order_to_response(order: Order) -> OrderResponse:
    """Convert Django Order model to Pydantic response."""
    return OrderResponse(
        id=order.id,
        reference=order.reference,
        template_version=order.template_version_id,
        status=OrderStatus(order.status),
        language=order.language,
        reservation_date=order.reservation_date,
        reservation_number=order.reservation_number or "",
        operator_name=order.operator_name,
        operator_address=order.operator_address,
        operator_address_number=order.operator_address_number or "",
        operator_postal_code=order.operator_postal_code,
        operator_locality=order.operator_locality,
        operator_bce_number=order.operator_bce_number or "",
        operator_authorization_number=order.operator_authorization_number or "",
        operator_authorization_date=order.operator_authorization_date,
        client_name=order.client_name,
        client_address=order.client_address,
        client_address_number=order.client_address_number or "",
        client_postal_code=order.client_postal_code,
        client_locality=order.client_locality,
        client_phone=order.client_phone or "",
        client_gsm=order.client_gsm or "",
        passengers_adult=order.passengers_adult,
        passengers_child=order.passengers_child,
        service_type=ServiceType(order.service_type),
        aller_date=order.aller_date,
        aller_time=order.aller_time,
        aller_departure=order.aller_departure or "",
        aller_destination=order.aller_destination or "",
        aller_price=order.aller_price,
        retour_date=order.retour_date,
        retour_time=order.retour_time,
        retour_departure=order.retour_departure or "",
        retour_destination=order.retour_destination or "",
        retour_price=order.retour_price,
        pdf_url=order.pdf_file.url if order.pdf_file else None,
        created_at=order.created_at,
        updated_at=order.updated_at,
    )


@sync_to_async
def _list_orders_sync(
    search: Optional[str],
    status_filter: Optional[str],
    service_type_filter: Optional[str],
    date_from: Optional[str],
    date_to: Optional[str],
    page: int,
    page_size: int,
) -> tuple:
    """Synchronous order listing logic."""
    queryset = Order.objects.all()

    if search:
        queryset = queryset.filter(
            Q(reference__icontains=search)
            | Q(client_name__icontains=search)
            | Q(operator_name__icontains=search)
        )

    if status_filter:
        queryset = queryset.filter(status=status_filter)

    if service_type_filter:
        queryset = queryset.filter(service_type=service_type_filter)

    if date_from:
        queryset = queryset.filter(reservation_date__gte=date_from)

    if date_to:
        queryset = queryset.filter(reservation_date__lte=date_to)

    total = queryset.count()
    pages = (total + page_size - 1) // page_size if total > 0 else 0
    offset = (page - 1) * page_size
    orders = list(queryset[offset : offset + page_size])

    return orders, total, pages


@router.get("/", response_model=OrderListResponse)
async def list_orders(
    search: Optional[str] = None,
    status: Optional[OrderStatus] = None,
    service_type: Optional[ServiceType] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
):
    """List orders with optional filtering and pagination."""
    orders, total, pages = await _list_orders_sync(
        search,
        status.value if status else None,
        service_type.value if service_type else None,
        date_from,
        date_to,
        page,
        page_size,
    )

    return OrderListResponse(
        items=[order_to_response(o) for o in orders],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@sync_to_async
def _get_order_by_id(order_id: UUID) -> Optional[Order]:
    try:
        return Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        return None


@sync_to_async
def _get_order_by_reference(reference: str) -> Optional[Order]:
    try:
        return Order.objects.get(reference=reference)
    except Order.DoesNotExist:
        return None


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: UUID,
    current_user: User = Depends(get_current_active_user),
):
    """Get a single order by ID."""
    order = await _get_order_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order_to_response(order)


@router.get("/reference/{reference}", response_model=OrderResponse)
async def get_order_by_reference(
    reference: str,
    current_user: User = Depends(get_current_active_user),
):
    """Get a single order by reference number."""
    order = await _get_order_by_reference(reference)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order_to_response(order)


@sync_to_async
def _create_order_sync(order_data: dict, user: User) -> Order:
    """Synchronous order creation logic."""
    template_version = order_data.pop("template_version", "Annex9_v2013")
    try:
        template = Template.objects.get(version=template_version)
    except Template.DoesNotExist:
        raise ValueError("Template not found")

    order = Order(
        template_version=template,
        created_by=user,
        **order_data,
    )
    order.save()

    OrderAuditLog.objects.create(
        order=order,
        action="created",
        user=user,
        details={"source": "api"},
    )

    return order


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_staff_user),
):
    """Create a new order. Requires staff privileges."""
    try:
        order = await _create_order_sync(order_data.model_dump(), current_user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return order_to_response(order)


# Fields that invalidate client signature when changed
SIGNATURE_INVALIDATING_FIELDS = {
    'service_type',
    'passengers_adult',
    'passengers_child',
    'aller_date',
    'aller_time',
    'aller_departure',
    'aller_destination',
    'aller_price',
    'retour_date',
    'retour_time',
    'retour_departure',
    'retour_destination',
    'retour_price',
}


@sync_to_async
def _update_order_sync(order_id: UUID, update_data: dict, user: User) -> Optional[Order]:
    """Synchronous order update logic."""
    try:
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        return None

    changed_fields = []
    for field, value in update_data.items():
        if hasattr(order, field) and getattr(order, field) != value:
            setattr(order, field, value)
            changed_fields.append(field)

    # Invalidate signature if service details changed
    if changed_fields and order.client_signature:
        if any(field in SIGNATURE_INVALIDATING_FIELDS for field in changed_fields):
            order.client_signature = None
            order.client_signature_date = None
            changed_fields.append('signature_invalidated')

    if changed_fields:
        order.save()
        OrderAuditLog.objects.create(
            order=order,
            action="updated",
            user=user,
            details={"changed_fields": changed_fields},
        )

    return order


@router.put("/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: UUID,
    order_data: OrderUpdate,
    current_user: User = Depends(get_staff_user),
):
    """Update an existing order. Requires staff privileges."""
    update_data = order_data.model_dump(exclude_unset=True)
    order = await _update_order_sync(order_id, update_data, current_user)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order_to_response(order)


@sync_to_async
def _delete_order_sync(order_id: UUID, user: User) -> bool:
    """Synchronous order deletion logic."""
    try:
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        return False

    OrderAuditLog.objects.create(
        order=order,
        action="deleted",
        user=user,
        details={"reference": order.reference},
    )
    order.delete()
    return True


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(
    order_id: UUID,
    current_user: User = Depends(get_staff_user),
):
    """Delete an order. Requires staff privileges."""
    success = await _delete_order_sync(order_id, current_user)
    if not success:
        raise HTTPException(status_code=404, detail="Order not found")
    return None


@sync_to_async
def _archive_order_sync(order_id: UUID, user: User) -> Optional[Order]:
    """Synchronous order archiving logic."""
    try:
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        return None

    order.status = Order.Status.ARCHIVED
    order.save()

    OrderAuditLog.objects.create(
        order=order,
        action="archived",
        user=user,
    )

    return order


@router.post("/{order_id}/archive", response_model=OrderResponse)
async def archive_order(
    order_id: UUID,
    current_user: User = Depends(get_staff_user),
):
    """Archive an order. Requires staff privileges."""
    order = await _archive_order_sync(order_id, current_user)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order_to_response(order)
