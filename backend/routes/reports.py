from flask import Blueprint, make_response, request

from models.invoice import get_invoice_collection
from models.purchase_order import get_po_collection
from utils.csv_export import generate_csv
from utils.rbac import require_roles

reports_bp = Blueprint("reports", __name__)


@reports_bp.route("/export", strict_slashes=False, methods=["GET"])
@require_roles("officer", "manager")
def export_csv():
    """Export all POs and invoices as a CSV download."""
    export_type = request.args.get("type", "all")

    if export_type == "po":
        return _export_pos()
    if export_type == "invoice":
        return _export_invoices()
    return _export_all()


def _export_pos():
    po_collection = get_po_collection()
    pos = list(po_collection.find())

    for po in pos:
        po["_id"] = str(po["_id"])

    fields = ["_id", "poNumber", "rfqId", "vendorId", "totalAmount", "status", "created_at"]
    csv_data = generate_csv(pos, fields)

    response = make_response(csv_data)
    response.headers["Content-Type"] = "text/csv"
    response.headers["Content-Disposition"] = "attachment; filename=purchase_orders.csv"
    return response


def _export_invoices():
    invoice_collection = get_invoice_collection()
    invoices = list(invoice_collection.find())

    for inv in invoices:
        inv["_id"] = str(inv["_id"])

    fields = ["_id", "invoiceNumber", "poId", "subtotal", "tax", "taxRate", "total", "status", "created_at"]
    csv_data = generate_csv(invoices, fields)

    response = make_response(csv_data)
    response.headers["Content-Type"] = "text/csv"
    response.headers["Content-Disposition"] = "attachment; filename=invoices.csv"
    return response


def _export_all():
    po_collection = get_po_collection()
    invoice_collection = get_invoice_collection()

    pos = list(po_collection.find())
    invoices = list(invoice_collection.find())

    combined = []

    for po in pos:
        combined.append(
            {
                "type": "PurchaseOrder",
                "number": po.get("poNumber", ""),
                "referenceId": str(po["_id"]),
                "vendorId": po.get("vendorId", ""),
                "amount": po.get("totalAmount", 0),
                "tax": "",
                "total": po.get("totalAmount", 0),
                "status": po.get("status", ""),
                "created_at": po.get("created_at", ""),
            }
        )

    for inv in invoices:
        combined.append(
            {
                "type": "Invoice",
                "number": inv.get("invoiceNumber", ""),
                "referenceId": str(inv["_id"]),
                "vendorId": inv.get("poId", ""),
                "amount": inv.get("subtotal", 0),
                "tax": inv.get("tax", 0),
                "total": inv.get("total", 0),
                "status": inv.get("status", ""),
                "created_at": inv.get("created_at", ""),
            }
        )

    fields = ["type", "number", "referenceId", "vendorId", "amount", "tax", "total", "status", "created_at"]
    csv_data = generate_csv(combined, fields)

    response = make_response(csv_data)
    response.headers["Content-Type"] = "text/csv"
    response.headers["Content-Disposition"] = "attachment; filename=vendorbridge_export.csv"
    return response
