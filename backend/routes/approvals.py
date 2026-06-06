from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
from bson import ObjectId
from models.quotation import get_quotation_collection
from models.rfq import get_rfq_collection
from models.purchase_order import get_po_collection, get_next_po_number

approvals_bp = Blueprint("approvals", __name__)


@approvals_bp.route("/approvals/approve/<quotation_id>", methods=["POST"])
def approve_quotation(quotation_id):
    """Approve a quotation and auto-create a Purchase Order."""
    quotations = get_quotation_collection()

    try:
        obj_id = ObjectId(quotation_id)
    except Exception:
        return jsonify({"error": "Invalid quotation ID"}), 400

    quotation = quotations.find_one({"_id": obj_id})
    if not quotation:
        return jsonify({"error": "Quotation not found"}), 404

    if quotation["status"] != "pending":
        return jsonify({"error": f"Quotation is already '{quotation['status']}'"}), 400

    # Update quotation status to accepted
    quotations.update_one(
        {"_id": obj_id},
        {"$set": {"status": "accepted", "updated_at": datetime.now(timezone.utc)}},
    )

    # Fetch the RFQ to get items
    rfqs = get_rfq_collection()
    rfq = rfqs.find_one({"_id": ObjectId(quotation["rfqId"])})

    items = rfq["items"] if rfq else []

    # Auto-create Purchase Order
    po_collection = get_po_collection()
    po_number = get_next_po_number()

    po = {
        "rfqId": quotation["rfqId"],
        "quotationId": str(quotation["_id"]),
        "vendorId": quotation["vendorId"],
        "poNumber": po_number,
        "items": items,
        "totalAmount": quotation["price"],
        "status": "created",
        "created_at": datetime.now(timezone.utc),
    }

    po_result = po_collection.insert_one(po)

    # Update RFQ status to awarded
    if rfq:
        rfqs.update_one(
            {"_id": ObjectId(quotation["rfqId"])},
            {"$set": {"status": "awarded", "updated_at": datetime.now(timezone.utc)}},
        )

    _log_activity(
        "Quotation approved & PO created",
        f"Quotation: {quotation_id}, PO: {po_number}, Vendor: {quotation['vendorId']}",
    )

    return jsonify({
        "message": "Quotation approved and Purchase Order created",
        "poId": str(po_result.inserted_id),
        "poNumber": po_number,
    }), 201


@approvals_bp.route("/approvals/reject/<quotation_id>", methods=["POST"])
def reject_quotation(quotation_id):
    """Reject a quotation."""
    quotations = get_quotation_collection()

    try:
        obj_id = ObjectId(quotation_id)
    except Exception:
        return jsonify({"error": "Invalid quotation ID"}), 400

    quotation = quotations.find_one({"_id": obj_id})
    if not quotation:
        return jsonify({"error": "Quotation not found"}), 404

    if quotation["status"] != "pending":
        return jsonify({"error": f"Quotation is already '{quotation['status']}'"}), 400

    # Update quotation status to rejected
    quotations.update_one(
        {"_id": obj_id},
        {"$set": {"status": "rejected", "updated_at": datetime.now(timezone.utc)}},
    )

    _log_activity("Quotation rejected", f"Quotation: {quotation_id}")

    return jsonify({"message": "Quotation rejected"}), 200


def _log_activity(action, details):
    """Log approval-related activities."""
    from pymongo import MongoClient
    from config import MONGO_URI, DB_NAME

    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    db["logs"].insert_one({
        "action": action,
        "details": details,
        "timestamp": datetime.now(timezone.utc),
    })
