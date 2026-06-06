from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
from bson import ObjectId
from models.invoice import get_invoice_collection, get_next_invoice_number
from models.purchase_order import get_po_collection

invoices_bp = Blueprint("invoices", __name__)


def _serialize_invoice(inv):
    """Convert MongoDB invoice document to JSON-safe dict."""
    inv["_id"] = str(inv["_id"])
    return inv


@invoices_bp.route("/invoices", methods=["GET"])
def list_invoices():
    """List all invoices with optional filters."""
    invoice_collection = get_invoice_collection()
    status = request.args.get("status")
    po_id = request.args.get("poId")

    query = {}
    if status:
        query["status"] = status
    if po_id:
        query["poId"] = po_id

    result = list(invoice_collection.find(query))
    return jsonify([_serialize_invoice(inv) for inv in result]), 200


@invoices_bp.route("/invoices", methods=["POST"])
def generate_invoice():
    """Generate an invoice from a Purchase Order."""
    data = request.get_json()

    if "poId" not in data:
        return jsonify({"error": "'poId' is required"}), 400

    # Fetch the PO to calculate totals
    po_collection = get_po_collection()
    try:
        po = po_collection.find_one({"_id": ObjectId(data["poId"])})
    except Exception:
        return jsonify({"error": "Invalid PO ID"}), 400

    if not po:
        return jsonify({"error": "Purchase order not found"}), 404

    # Calculate tax (default 18% GST if not provided)
    tax_rate = float(data.get("taxRate", 18)) / 100
    subtotal = po["totalAmount"]
    tax_amount = round(subtotal * tax_rate, 2)
    total = round(subtotal + tax_amount, 2)

    invoice_collection = get_invoice_collection()
    invoice_number = get_next_invoice_number()

    invoice = {
        "poId": data["poId"],
        "invoiceNumber": invoice_number,
        "subtotal": subtotal,
        "tax": tax_amount,
        "taxRate": tax_rate * 100,
        "total": total,
        "status": "unpaid",
        "created_at": datetime.now(timezone.utc),
    }

    result = invoice_collection.insert_one(invoice)

    _log_activity(
        "Invoice generated",
        f"Invoice: {invoice_number}, PO: {po['poNumber']}, Total: {total}",
    )

    return jsonify({
        "message": "Invoice generated successfully",
        "invoiceId": str(result.inserted_id),
        "invoiceNumber": invoice_number,
        "total": total,
    }), 201


@invoices_bp.route("/invoices/<invoice_id>", methods=["PUT"])
def update_invoice(invoice_id):
    """Update invoice status (e.g., mark as paid)."""
    data = request.get_json()
    invoice_collection = get_invoice_collection()

    try:
        obj_id = ObjectId(invoice_id)
    except Exception:
        return jsonify({"error": "Invalid invoice ID"}), 400

    existing = invoice_collection.find_one({"_id": obj_id})
    if not existing:
        return jsonify({"error": "Invoice not found"}), 404

    update_fields = {}
    if "status" in data:
        update_fields["status"] = data["status"]

    if not update_fields:
        return jsonify({"error": "No fields to update"}), 400

    update_fields["updated_at"] = datetime.now(timezone.utc)
    invoice_collection.update_one({"_id": obj_id}, {"$set": update_fields})

    _log_activity("Invoice updated", f"Invoice: {existing['invoiceNumber']} (ID: {invoice_id})")

    return jsonify({"message": "Invoice updated successfully"}), 200


def _log_activity(action, details):
    """Log invoice-related activities."""
    from pymongo import MongoClient
    from config import MONGO_URI, DB_NAME

    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    db["logs"].insert_one({
        "action": action,
        "details": details,
        "timestamp": datetime.now(timezone.utc),
    })
