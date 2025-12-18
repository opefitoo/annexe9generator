"""
PDF Generator for Annex 9 - Bon de commande d'un service de taxis collectifs.

This module generates the Annex 9 form from scratch using ReportLab,
matching the official Walloon Government layout.
"""

from io import BytesIO
from datetime import date, time
from decimal import Decimal
from typing import Optional
import logging

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.utils import ImageReader
from reportlab.platypus import Paragraph
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from django.core.files.base import ContentFile

logger = logging.getLogger(__name__)


# Page dimensions
PAGE_WIDTH, PAGE_HEIGHT = A4  # 210mm x 297mm


def format_date(d: Optional[date]) -> str:
    """Format date as DD/MM/YYYY."""
    if d:
        return d.strftime("%d/%m/%Y")
    return ""


def format_time(t: Optional[time]) -> str:
    """Format time as HH:MM."""
    if t:
        return t.strftime("%H:%M")
    return ""


def format_price(p: Optional[Decimal]) -> str:
    """Format price with currency."""
    if p is not None:
        return f"{p:.2f} €"
    return ""


def draw_checkbox(c: canvas.Canvas, x: float, y: float, checked: bool = False, size: float = 3*mm):
    """Draw a checkbox (circle) with optional check mark."""
    c.circle(x + size/2, y + size/2, size/2, stroke=1, fill=0)
    if checked:
        c.circle(x + size/2, y + size/2, size/3, stroke=0, fill=1)


def draw_title_options(c: canvas.Canvas, x: float, y: float, selected_title: str, font_name: str = "Helvetica", font_size: int = 9):
    """
    Draw title options (Madame / Monsieur / Société) with strikethrough on non-selected options.

    Args:
        c: Canvas object
        x: Starting x position
        y: Y position
        selected_title: The selected title ('Madame', 'Monsieur', or 'Société')
        font_name: Font to use
        font_size: Font size
    """
    c.setFont(font_name, font_size)

    titles = ["Madame", "Monsieur", "Société"]
    separators = [" / ", " / ", ""]

    current_x = x
    for i, title in enumerate(titles):
        text_width = c.stringWidth(title, font_name, font_size)

        # Draw the title text
        c.drawString(current_x, y, title)

        # If not selected, draw strikethrough line
        if title != selected_title:
            # Draw line through middle of text
            line_y = y + font_size * 0.3  # Slightly above baseline
            c.line(current_x, line_y, current_x + text_width, line_y)

        current_x += text_width

        # Draw separator
        if separators[i]:
            sep_width = c.stringWidth(separators[i], font_name, font_size)
            c.drawString(current_x, y, separators[i])
            current_x += sep_width

    return current_x  # Return ending x position


def generate_annex9_pdf(order) -> BytesIO:
    """
    Generate the Annex 9 PDF document for a given order.

    Args:
        order: Order model instance

    Returns:
        BytesIO buffer containing the PDF
    """
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)

    # Set document metadata
    c.setTitle(f"Bon de commande - {order.reference}")
    c.setAuthor("Annex 9 Generator")
    c.setSubject("Bon de commande d'un service de taxis collectifs")
    c.setCreator("Annex 9 Generator v1.0")

    # Margins
    left_margin = 20 * mm
    right_margin = PAGE_WIDTH - 20 * mm
    top_margin = PAGE_HEIGHT - 15 * mm

    # Current Y position (starts from top)
    y = top_margin

    # ============== HEADER ==============
    # "Annexe 9" at top center (Note: Form shows "Annexe 5" but spec says Annex 9)
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(PAGE_WIDTH / 2, y, "Annexe 9")
    y -= 12

    # Legal reference text
    c.setFont("Helvetica", 8)
    legal_text = (
        "Annexe 9 de l'arrêté du Gouvernement wallon du 3 juin 2009 portant exécution du décret du 18 octobre 2007 relatif aux services de "
    )
    c.drawCentredString(PAGE_WIDTH / 2, y, legal_text)
    y -= 10
    c.drawCentredString(PAGE_WIDTH / 2, y, "taxis et aux services de location de voitures avec chauffeur")
    y -= 20

    # Title
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(PAGE_WIDTH / 2, y, "Bon de commande d'un service de taxis collectifs")
    y -= 25

    # ============== CACHET DE L'EXPLOITANT ==============
    c.setFont("Helvetica-Bold", 9)
    c.drawString(left_margin, y, "(CACHET DE L'EXPLOITANT)")
    y -= 35

    # ============== RESERVATION BOX ==============
    box_top = y + 5
    box_height = 20
    c.rect(left_margin, y - box_height + 5, right_margin - left_margin, box_height)

    c.setFont("Helvetica-Bold", 9)
    c.drawString(left_margin + 5, y - 5, "Date de réservation :")
    c.setFont("Helvetica", 9)
    c.drawString(left_margin + 55 * mm, y - 5, format_date(order.reservation_date))

    c.setFont("Helvetica-Bold", 9)
    c.drawString(PAGE_WIDTH / 2 + 10, y - 5, "N° de réservation :")
    c.setFont("Helvetica", 9)
    c.drawString(PAGE_WIDTH / 2 + 50 * mm, y - 5, order.reservation_number or order.reference)

    y -= 35

    # ============== EXPLOITANT SECTION ==============
    c.setFont("Helvetica-Bold", 10)
    c.setFillColorRGB(0, 0, 0)
    c.drawString(left_margin, y, "Exploitant:")
    c.line(left_margin, y - 2, left_margin + 25 * mm, y - 2)
    y -= 20

    # Operator fields
    c.setFont("Helvetica", 9)

    # Name with title options (strikethrough non-selected)
    c.drawString(left_margin, y, "Nom : ")
    title_x = left_margin + c.stringWidth("Nom : ", "Helvetica", 9)
    operator_title = getattr(order, 'operator_title', None) or 'Société'
    draw_title_options(c, title_x, y, operator_title)
    c.setFont("Helvetica", 9)
    name_x = left_margin + 55 * mm
    c.drawString(name_x, y, order.operator_name)
    c.line(name_x, y - 2, right_margin, y - 2)
    y -= 16

    # Address
    c.drawString(left_margin, y, "Adresse : domicile/siège social situé")
    addr_x = left_margin + 55 * mm
    c.drawString(addr_x, y, order.operator_address)
    c.line(addr_x, y - 2, right_margin - 30 * mm, y - 2)
    c.drawString(right_margin - 25 * mm, y, "n°")
    c.drawString(right_margin - 18 * mm, y, order.operator_address_number or "")
    c.line(right_margin - 18 * mm, y - 2, right_margin, y - 2)
    y -= 16

    # Postal code and locality
    c.drawString(left_margin + 15 * mm, y, "code postal :")
    c.drawString(left_margin + 40 * mm, y, order.operator_postal_code)
    c.line(left_margin + 40 * mm, y - 2, left_margin + 60 * mm, y - 2)
    c.drawString(left_margin + 65 * mm, y, "localité :")
    c.drawString(left_margin + 82 * mm, y, order.operator_locality)
    c.line(left_margin + 82 * mm, y - 2, right_margin, y - 2)
    y -= 16

    # BCE number
    c.drawString(left_margin, y, "inscrit(e) à la banque carrefour des entreprises sous le numéro")
    bce_x = left_margin + 95 * mm
    c.drawString(bce_x, y, order.operator_bce_number or "")
    c.line(bce_x, y - 2, right_margin, y - 2)
    y -= 16

    # Authorization
    c.drawString(left_margin, y, "exploitant un service de taxis collectifs en vertu d'une autorisation portant le n°")
    auth_x = left_margin + 115 * mm
    c.drawString(auth_x, y, order.operator_authorization_number or "")
    c.line(auth_x, y - 2, right_margin, y - 2)
    y -= 16

    c.drawString(left_margin, y, "délivrée par les services du Gouvernement wallon en date du")
    date_x = left_margin + 90 * mm
    c.drawString(date_x, y, format_date(order.operator_authorization_date))
    c.line(date_x, y - 2, right_margin, y - 2)
    y -= 28

    # ============== CLIENT SECTION ==============
    # Box around client section
    client_box_top = y + 8
    client_box_height = 85
    c.rect(left_margin, y - client_box_height + 8, right_margin - left_margin, client_box_height)

    c.setFont("Helvetica-Bold", 10)
    c.drawString(left_margin + 3, y, "Client :")
    c.line(left_margin + 3, y - 2, left_margin + 20 * mm, y - 2)
    y -= 20

    c.setFont("Helvetica", 9)

    # Client name with title options (strikethrough non-selected)
    c.drawString(left_margin + 3, y, "Nom : ")
    title_x = left_margin + 3 + c.stringWidth("Nom : ", "Helvetica", 9)
    client_title = getattr(order, 'client_title', None) or 'Monsieur'
    draw_title_options(c, title_x, y, client_title)
    c.setFont("Helvetica", 9)
    name_x = left_margin + 55 * mm
    c.drawString(name_x, y, order.client_name)
    c.line(name_x, y - 2, right_margin - 3, y - 2)
    y -= 16

    # Client address
    c.drawString(left_margin + 3, y, "Adresse : domicile / siège social situé")
    addr_x = left_margin + 58 * mm
    c.drawString(addr_x, y, order.client_address)
    c.line(addr_x, y - 2, right_margin - 30 * mm, y - 2)
    c.drawString(right_margin - 25 * mm, y, "n°")
    c.drawString(right_margin - 18 * mm, y, order.client_address_number or "")
    c.line(right_margin - 18 * mm, y - 2, right_margin - 3, y - 2)
    y -= 16

    # Postal code and locality
    c.drawString(left_margin + 15 * mm, y, "code postal :")
    c.drawString(left_margin + 40 * mm, y, order.client_postal_code)
    c.line(left_margin + 40 * mm, y - 2, left_margin + 60 * mm, y - 2)
    c.drawString(left_margin + 65 * mm, y, "localité :")
    c.drawString(left_margin + 82 * mm, y, order.client_locality)
    c.line(left_margin + 82 * mm, y - 2, right_margin - 3, y - 2)
    y -= 16

    # Phone numbers
    c.drawString(left_margin + 3, y, "Tél :")
    c.drawString(left_margin + 18 * mm, y, order.client_phone or "")
    c.line(left_margin + 18 * mm, y - 2, left_margin + 55 * mm, y - 2)
    c.drawString(left_margin + 60 * mm, y, "GSM :")
    c.drawString(left_margin + 75 * mm, y, order.client_gsm or "")
    c.line(left_margin + 75 * mm, y - 2, right_margin - 3, y - 2)
    y -= 16

    # Passengers
    c.drawString(left_margin + 3, y, "Nombre de passagers : adulte :")
    c.drawString(left_margin + 55 * mm, y, str(order.passengers_adult))
    c.line(left_margin + 55 * mm, y - 2, left_margin + 70 * mm, y - 2)
    c.drawString(left_margin + 75 * mm, y, "enfant(s) - 12 ans :")
    c.drawString(left_margin + 110 * mm, y, str(order.passengers_child))
    c.line(left_margin + 110 * mm, y - 2, right_margin - 3, y - 2)
    y -= 32

    # ============== SERVICE TYPE ==============
    c.setFont("Helvetica-Bold", 10)
    c.drawString(left_margin, y, "Service :")
    c.line(left_margin, y - 2, left_margin + 20 * mm, y - 2)

    c.setFont("Helvetica", 9)
    checkbox_y = y - 1

    # Aller checkbox
    aller_x = left_margin + 30 * mm
    draw_checkbox(c, aller_x, checkbox_y, checked=(order.service_type == "aller"))
    c.drawString(aller_x + 5 * mm, y, "Aller")

    # Retour checkbox
    retour_x = left_margin + 55 * mm
    draw_checkbox(c, retour_x, checkbox_y, checked=(order.service_type == "retour"))
    c.drawString(retour_x + 5 * mm, y, "Retour")

    # Aller/Retour checkbox
    ar_x = left_margin + 85 * mm
    draw_checkbox(c, ar_x, checkbox_y, checked=(order.service_type == "aller_retour"))
    c.drawString(ar_x + 5 * mm, y, "Aller/Retour")

    y -= 28

    # ============== TRIP DETAILS TABLE ==============
    # Table dimensions
    table_left = left_margin
    table_width = right_margin - left_margin
    col1_width = 45 * mm  # Labels column
    col2_width = (table_width - col1_width) / 2  # Aller column
    col3_width = col2_width  # Retour column
    row_height = 14

    # Table header
    c.setFillColorRGB(0.9, 0.9, 0.9)
    c.rect(table_left, y - row_height, table_width, row_height, fill=1)
    c.setFillColorRGB(0, 0, 0)

    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(table_left + col1_width + col2_width / 2, y - 10, "Aller")
    c.drawCentredString(table_left + col1_width + col2_width + col3_width / 2, y - 10, "Retour")

    # Draw header borders
    c.line(table_left, y, table_left + table_width, y)
    c.line(table_left, y - row_height, table_left + table_width, y - row_height)
    c.line(table_left, y, table_left, y - row_height)
    c.line(table_left + col1_width, y, table_left + col1_width, y - row_height)
    c.line(table_left + col1_width + col2_width, y, table_left + col1_width + col2_width, y - row_height)
    c.line(table_left + table_width, y, table_left + table_width, y - row_height)

    y -= row_height

    # Table rows
    rows = [
        ("Date :", format_date(order.aller_date), format_date(order.retour_date)),
        ("Heure", format_time(order.aller_time), format_time(order.retour_time)),
        ("Lieu de départ :", order.aller_departure or "", order.retour_departure or ""),
        ("Destination :", order.aller_destination or "", order.retour_destination or ""),
        ("Prix convenu par personne :", format_price(order.aller_price), format_price(order.retour_price)),
    ]

    c.setFont("Helvetica", 9)
    for label, aller_val, retour_val in rows:
        # Draw row
        c.drawString(table_left + 3, y - 10, label)
        c.drawCentredString(table_left + col1_width + col2_width / 2, y - 10, aller_val)
        c.drawCentredString(table_left + col1_width + col2_width + col3_width / 2, y - 10, retour_val)

        # Row borders
        c.line(table_left, y - row_height, table_left + table_width, y - row_height)
        c.line(table_left, y, table_left, y - row_height)
        c.line(table_left + col1_width, y, table_left + col1_width, y - row_height)
        c.line(table_left + col1_width + col2_width, y, table_left + col1_width + col2_width, y - row_height)
        c.line(table_left + table_width, y, table_left + table_width, y - row_height)

        y -= row_height

    y -= 20

    # ============== SIGNATURES ==============
    c.setFont("Helvetica", 9)

    # Signature box dimensions
    sig_box_width = 55 * mm
    sig_box_height = 25 * mm

    # Operator signature (left side)
    op_label_x = left_margin
    c.drawString(op_label_x, y, "Signature de l'exploitant :")
    # Operator signature box
    op_box_x = left_margin
    op_box_y = y - sig_box_height - 5
    c.rect(op_box_x, op_box_y, sig_box_width, sig_box_height)

    # Client signature (right side)
    client_label_x = PAGE_WIDTH / 2 + 10 * mm
    c.drawString(client_label_x, y, "Signature du client")
    y -= 10
    c.setFont("Helvetica", 7)
    c.drawString(client_label_x, y, "(au plus tard au moment de la prise en charge) :")

    # Client signature box
    client_box_x = PAGE_WIDTH / 2 + 10 * mm
    client_box_y = op_box_y  # Same Y as operator box
    c.rect(client_box_x, client_box_y, sig_box_width, sig_box_height)

    # Draw client signature image if exists
    if order.client_signature:
        try:
            from api.services.crypto import decrypt_signature

            # Decrypt the signature
            decrypted_data = decrypt_signature(bytes(order.client_signature))

            # Create image from decrypted bytes
            signature_image = ImageReader(BytesIO(decrypted_data))

            # Draw signature image inside the box with padding
            padding = 2 * mm
            sig_img_width = sig_box_width - (2 * padding)
            sig_img_height = sig_box_height - (2 * padding)
            sig_img_x = client_box_x + padding
            sig_img_y = client_box_y + padding

            c.drawImage(
                signature_image,
                sig_img_x,
                sig_img_y,
                width=sig_img_width,
                height=sig_img_height,
                preserveAspectRatio=True,
                mask='auto'
            )
        except Exception as e:
            logger.warning(f"Could not add client signature to PDF: {e}")

    y = op_box_y - 15  # Move below the signature boxes

    # ============== FOOTER - LEGAL TEXT ==============
    c.setFont("Helvetica", 7)
    footer_text_1 = "Vu pour être annexé à l'arrêté du Gouvernement wallon du 11 juillet 2013 modifiant l'arrêté du Gouvernement wallon"
    footer_text_2 = "du 3 juin 2009 portant exécution du décret du 18 octobre 2007 relatif aux services de taxis et aux services de location"
    footer_text_3 = "de voitures avec chauffeur"

    c.drawString(left_margin, y, footer_text_1)
    y -= 9
    c.drawString(left_margin, y, footer_text_2)
    y -= 9
    c.drawString(left_margin, y, footer_text_3)
    y -= 14

    c.drawString(left_margin, y, "Namur, le 11 juillet 2013.")
    y -= 14

    # Ministers
    c.setFont("Helvetica", 8)
    c.drawCentredString(left_margin + 40 * mm, y, "Le Ministre-Président,")
    c.drawCentredString(right_margin - 45 * mm, y, "Le Ministre de l'Environnement, de l'Aménagement")
    y -= 9
    c.drawCentredString(left_margin + 40 * mm, y, "R. DEMOTTE,")
    c.drawCentredString(right_margin - 45 * mm, y, "du Territoire et de la Mobilité,")
    y -= 9
    c.drawCentredString(right_margin - 45 * mm, y, "P. HENRY")

    # Save and return
    c.save()
    buffer.seek(0)
    return ContentFile(buffer.getvalue())
