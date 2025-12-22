"""
PDF generation routes for FastAPI.
"""

from typing import Optional
from uuid import UUID
from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from django.contrib.auth.models import User
from django.conf import settings
from django.utils import timezone
from jose import JWTError, jwt
from asgiref.sync import sync_to_async

from core.models import Order, OrderAuditLog
from api.routes.auth import get_current_active_user, get_staff_user, get_user_by_username
from api.services.pdf_generator import generate_annex9_pdf

router = APIRouter()


async def get_user_from_token_param(token: Optional[str] = Query(None)) -> User:
    """Get user from token passed as query parameter (for PDF preview/download in browser)."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    user = await get_user_by_username(username)
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    return user


@sync_to_async
def _get_order(order_id: UUID) -> Optional[Order]:
    try:
        return Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        return None


@sync_to_async
def _save_pdf_and_log(order: Order, pdf_buffer: BytesIO, user: User, filename: str) -> str:
    """Save PDF to order and create audit log."""
    order.pdf_file.save(filename, pdf_buffer, save=False)
    order.pdf_generated_at = timezone.now()
    order.status = Order.Status.GENERATED
    order.save()

    OrderAuditLog.objects.create(
        order=order,
        action="pdf_generated",
        user=user,
        details={"filename": filename},
    )
    return order.pdf_file.url


@sync_to_async
def _save_pdf(order: Order, pdf_buffer: BytesIO, filename: str) -> None:
    """Save PDF to order without audit log."""
    order.pdf_file.save(filename, pdf_buffer, save=False)
    order.pdf_generated_at = timezone.now()
    if order.status == Order.Status.DRAFT:
        order.status = Order.Status.GENERATED
    order.save()


@sync_to_async
def _read_pdf_content(order: Order) -> bytes:
    """Read PDF content from order."""
    content = order.pdf_file.read()
    order.pdf_file.seek(0)
    return content


@sync_to_async
def _get_pdf_filename(order: Order) -> str:
    """Get PDF filename from order."""
    return order.pdf_file.name.split("/")[-1]


@router.post("/{order_id}/generate")
async def generate_pdf(
    order_id: UUID,
    current_user: User = Depends(get_staff_user),
):
    """Generate PDF for an order and save it. Requires staff privileges."""
    order = await _get_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Generate PDF
    pdf_buffer = generate_annex9_pdf(order)

    # Save to order and create audit log
    filename = f"annex9_order_{order.reference}_{timezone.now().strftime('%Y%m%d')}.pdf"
    url = await _save_pdf_and_log(order, pdf_buffer, current_user, filename)

    return {
        "message": "PDF generated successfully",
        "filename": filename,
        "url": url,
    }


@router.get("/{order_id}/download")
async def download_pdf(
    order_id: UUID,
    regenerate: bool = False,
    token: Optional[str] = Query(None),
    current_user: User = Depends(get_user_from_token_param),
):
    """Download PDF for an order (generate if needed)."""
    order = await _get_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Generate if no PDF exists or regenerate requested
    if not order.pdf_file or regenerate:
        pdf_buffer = generate_annex9_pdf(order)
        filename = f"annex9_order_{order.reference}_{timezone.now().strftime('%Y%m%d')}.pdf"
        await _save_pdf(order, pdf_buffer, filename)

    # Return streaming response
    pdf_content = await _read_pdf_content(order)
    pdf_filename = await _get_pdf_filename(order)

    return StreamingResponse(
        BytesIO(pdf_content),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{pdf_filename}"'
        },
    )


@router.get("/{order_id}/preview")
async def preview_pdf(
    order_id: UUID,
    token: Optional[str] = Query(None),
    current_user: User = Depends(get_user_from_token_param),
):
    """Preview PDF in browser (inline display)."""
    order = await _get_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Generate fresh preview
    pdf_buffer = generate_annex9_pdf(order)

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "inline"},
    )
