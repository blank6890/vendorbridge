from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
from bson import ObjectId
from models.quotation import get_quotation_collection

quotations_bp = Blueprint("quotations", __name__)


def _serialize_quotation(q):
    """Convert MongoDB quotation document to JSON-safe dict."""
    q["_id"] = str(q["_id"])
    return q


@quotations_bp.route("/quotations", methods=["GET"])
def list_quotations():
    """List all quotations with optional filters."""
    quotations = get_quotation_collection()
    rfq_id = request.args.get("rfqId")
    vendor_id = request.args.get("vendorId")
    status = request.args.get("status")

    query = {}
    if rfq_id:
        query["rfqId"] = rfq_id
    if vendor_id:
        query["vendorId"] = vendor_id
    if status:
        query["status"] = status

    result = list(quotations.find(query))
    return jsonify([_serialize_quotation(q) for q in result]), 200


@quotations_bp.route("/quotations", methods=["POST"])
def submit_quotation():
    """Submit a new quotation for an RFQ."""
    data = request.get_json()

    required = ["rfqId", "vendorId", "price", "deliveryDays"]
    for field in required:
        if field not in data:
            return jsonify({"error": f"'{field}' is required"}), 400

    quotations = get_quotation_collection()

    quotation = {
        "rfqId": data["rfqId"],
        "vendorId": data["vendorId"],
        "price": float(data["price"]),
        "deliveryDays": int(data["deliveryDays"]),
        "notes": data.get("notes", ""),
        "status": "pending",
        "created_at": datetime.now(timezone.utc),
    }

    result = quotations.insert_one(quotation)

    _log_activity("Quotation submitted", f"RFQ: {data['rfqId']}, Vendor: {data['vendorId']}, Price: {data['price']}")

    return jsonify({
        "message": "Quotation submitted successfully",
        "quotationId": str(result.inserted_id),
    }), 201


@quotations_bp.route("/quotations/<quotation_id>", methods=["PUT"])
def update_quotation(quotation_id):
    """Update quotation details or status."""
    data = request.get_json()
    quotations = get_quotation_collection()

    try:
        obj_id = ObjectId(quotation_id)
    except Exception:
        return jsonify({"error": "Invalid quotation ID"}), 400

    existing = quotations.find_one({"_id": obj_id})
    if not existing:
        return jsonify({"error": "Quotation not found"}), 404

    update_fields = {}
    for field in ["price", "deliveryDays", "notes", "status"]:
        if field in data:
            update_fields[field] = data[field]

    if not update_fields:
        return jsonify({"error": "No fields to update"}), 400

    update_fields["updated_at"] = datetime.now(timezone.utc)
    quotations.update_one({"_id": obj_id}, {"$set": update_fields})

    _log_activity("Quotation updated", f"Quotation ID: {quotation_id}")

    return jsonify({"message": "Quotation updated successfully"}), 200


def _log_activity(action, details):
    """Log quotation-related activities."""
    from pymongo import MongoClient
    from config import MONGO_URI, DB_NAME

    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    db["logs"].insert_one({
        "action": action,
        "details": details,
        "timestamp": datetime.now(timezone.utc),
    })
