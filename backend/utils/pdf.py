"""
PDF generation utility using ReportLab.
Generates professional invoice PDFs.
"""

import io
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT


def generate_invoice_pdf(invoice_data):
    """Generate a professional invoice PDF and return the bytes.

    Args:
        invoice_data: dict with keys:
            - invoiceNumber: str
            - poNumber: str (optional)
            - vendorName: str (optional)
            - vendorEmail: str (optional)
            - items: list of { product, qty } (optional)
            - subtotal: float
            - tax: float
            - taxRate: float
            - total: float
            - status: str
            - created_at: str (optional)

    Returns:
        bytes: PDF file content.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=20 * mm, bottomMargin=20 * mm)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "InvoiceTitle",
        parent=styles["Title"],
        fontSize=24,
        textColor=colors.HexColor("#1a1a2e"),
        spaceAfter=6 * mm,
    )
    header_style = ParagraphStyle(
        "HeaderInfo",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.HexColor("#555555"),
    )
    section_style = ParagraphStyle(
        "SectionHeader",
        parent=styles["Heading2"],
        fontSize=13,
        textColor=colors.HexColor("#16213e"),
        spaceBefore=8 * mm,
        spaceAfter=3 * mm,
    )

    elements = []

    # ─── Title ────────────────────────────────────────────────────────────
    elements.append(Paragraph("VendorBridge", title_style))
    elements.append(Paragraph("Procurement & Vendor Management ERP", header_style))
    elements.append(Spacer(1, 6 * mm))

    # ─── Invoice Info ─────────────────────────────────────────────────────
    inv_number = invoice_data.get("invoiceNumber", "N/A")
    po_number = invoice_data.get("poNumber", "N/A")
    vendor_name = invoice_data.get("vendorName", "N/A")
    vendor_email = invoice_data.get("vendorEmail", "N/A")
    created_at = invoice_data.get("created_at", "N/A")
    status = invoice_data.get("status", "N/A").upper()

    info_data = [
        ["Invoice Number:", inv_number, "PO Number:", po_number],
        ["Vendor:", vendor_name, "Email:", vendor_email],
        ["Date:", str(created_at)[:10], "Status:", status],
    ]

    info_table = Table(info_data, colWidths=[80, 150, 80, 150])
    info_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#333333")),
        ("TEXTCOLOR", (2, 0), (2, -1), colors.HexColor("#333333")),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(info_table)

    # ─── Items Table ──────────────────────────────────────────────────────
    items = invoice_data.get("items", [])
    if items:
        elements.append(Paragraph("Line Items", section_style))

        table_data = [["#", "Product", "Quantity"]]
        for i, item in enumerate(items, 1):
            table_data.append([str(i), item.get("product", ""), str(item.get("qty", ""))])

        items_table = Table(table_data, colWidths=[30, 300, 80])
        items_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#16213e")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("ALIGN", (1, 1), (1, -1), "LEFT"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f5f5f5")]),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
        ]))
        elements.append(items_table)

    # ─── Totals ───────────────────────────────────────────────────────────
    elements.append(Paragraph("Summary", section_style))

    subtotal = invoice_data.get("subtotal", 0)
    tax = invoice_data.get("tax", 0)
    tax_rate = invoice_data.get("taxRate", 18)
    total = invoice_data.get("total", 0)

    totals_data = [
        ["Subtotal:", f"Rs. {subtotal:,.2f}"],
        [f"Tax ({tax_rate}%):", f"Rs. {tax:,.2f}"],
        ["Total:", f"Rs. {total:,.2f}"],
    ]

    totals_table = Table(totals_data, colWidths=[340, 120])
    totals_table.setStyle(TableStyle([
        ("ALIGN", (0, 0), (0, -1), "RIGHT"),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 11),
        ("FONTSIZE", (0, -1), (-1, -1), 13),
        ("TEXTCOLOR", (0, -1), (-1, -1), colors.HexColor("#16213e")),
        ("LINEABOVE", (0, -1), (-1, -1), 1, colors.HexColor("#16213e")),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(totals_table)

    # ─── Footer ───────────────────────────────────────────────────────────
    elements.append(Spacer(1, 15 * mm))
    footer_style = ParagraphStyle(
        "Footer",
        parent=styles["Normal"],
        fontSize=8,
        textColor=colors.HexColor("#999999"),
        alignment=TA_CENTER,
    )
    elements.append(Paragraph("Generated by VendorBridge ERP | This is a computer-generated document", footer_style))

    # Build PDF
    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()

    return pdf_bytes
