from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
from bson import ObjectId
from models.rfq import get_rfq_collection

rfq_bp = Blueprint("rfq", __name__)


def _serialize_rfq(rfq):
    """Convert MongoDB RFQ document to JSON-safe dict."""
    rfq["_id"] = str(rfq["_id"])
    return rfq


@rfq_bp.route("/rfq", methods=["GET"])
def list_rfqs():
    """List all RFQs with optional status filter."""
    rfqs = get_rfq_collection()
    status = request.args.get("status")

    query = {}
    if status:
        query["status"] = status

    result = list(rfqs.find(query))
    return jsonify([_serialize_rfq(r) for r in result]), 200


@rfq_bp.route("/rfq", methods=["POST"])
def create_rfq():
    """Create a new Request for Quotation."""
    data = request.get_json()

    required = ["title", "items", "deadline"]
    for field in required:
        if field not in data:
            return jsonify({"error": f"'{field}' is required"}), 400

    # Validate items structure
    if not isinstance(data["items"], list) or len(data["items"]) == 0:
        return jsonify({"error": "'items' must be a non-empty array"}), 400

    for item in data["items"]:
        if "product" not in item or "qty" not in item:
            return jsonify({"error": "Each item must have 'product' and 'qty'"}), 400

    rfqs = get_rfq_collection()

    # Get createdBy from JWT payload (set by middleware)
    created_by = request.user.get("userId", "unknown") if hasattr(request, "user") else "unknown"

    rfq = {
        "title": data["title"],
        "items": data["items"],
        "deadline": data["deadline"],
        "assignedVendors": data.get("assignedVendors", []),
        "status": data.get("status", "open"),
        "createdBy": created_by,
        "created_at": datetime.now(timezone.utc),
    }

    result = rfqs.insert_one(rfq)

    _log_activity("RFQ created", f"{data['title']} (ID: {result.inserted_id})")

    return jsonify({
        "message": "RFQ created successfully",
        "rfqId": str(result.inserted_id),
    }), 201


@rfq_bp.route("/rfq/<rfq_id>", methods=["GET"])
def get_rfq(rfq_id):
    """Get a single RFQ by ID."""
    rfqs = get_rfq_collection()

    try:
        obj_id = ObjectId(rfq_id)
    except Exception:
        return jsonify({"error": "Invalid RFQ ID"}), 400

    rfq = rfqs.find_one({"_id": obj_id})
    if not rfq:
        return jsonify({"error": "RFQ not found"}), 404

    return jsonify(_serialize_rfq(rfq)), 200


@rfq_bp.route("/rfq/<rfq_id>", methods=["PUT"])
def update_rfq(rfq_id):
    """Update an existing RFQ."""
    data = request.get_json()
    rfqs = get_rfq_collection()

    try:
        obj_id = ObjectId(rfq_id)
    except Exception:
        return jsonify({"error": "Invalid RFQ ID"}), 400

    existing = rfqs.find_one({"_id": obj_id})
    if not existing:
        return jsonify({"error": "RFQ not found"}), 404

    update_fields = {}
    for field in ["title", "items", "deadline", "assignedVendors", "status"]:
        if field in data:
            update_fields[field] = data[field]

    if not update_fields:
        return jsonify({"error": "No fields to update"}), 400

    update_fields["updated_at"] = datetime.now(timezone.utc)
    rfqs.update_one({"_id": obj_id}, {"$set": update_fields})

    _log_activity("RFQ updated", f"{existing['title']} (ID: {rfq_id})")

    return jsonify({"message": "RFQ updated successfully"}), 200


def _log_activity(action, details):
    """Log RFQ-related activities."""
    from pymongo import MongoClient
    from config import MONGO_URI, DB_NAME

    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    db["logs"].insert_one({
        "action": action,
        "details": details,
        "timestamp": datetime.now(timezone.utc),
    })
