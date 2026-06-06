from datetime import datetime, timezone

from bson import ObjectId
from flask import Blueprint, jsonify, request

from models.purchase_order import get_next_po_number, get_po_collection
from utils.rbac import require_roles

purchase_orders_bp = Blueprint("purchase_orders", __name__)


def _serialize_po(po):
    po["_id"] = str(po["_id"])
    return po


@purchase_orders_bp.route("/", strict_slashes=False, methods=["GET"])
@require_roles("officer", "manager", "vendor")
def list_purchase_orders():
    """List all purchase orders with optional filters."""
    po_collection = get_po_collection()
    status = request.args.get("status")
    vendor_id = request.args.get("vendorId")

    query = {}
    if status:
        query["status"] = status
    if vendor_id:
        query["vendorId"] = vendor_id

    result = list(po_collection.find(query))
    return jsonify([_serialize_po(po) for po in result]), 200


@purchase_orders_bp.route("/", strict_slashes=False, methods=["POST"])
@require_roles("officer")
def create_purchase_order():
    """Manually create a purchase order."""
    data = request.get_json()

    required = ["rfqId", "quotationId", "vendorId", "items", "totalAmount"]
    for field in required:
        if field not in data:
            return jsonify({"error": f"'{field}' is required"}), 400

    po_collection = get_po_collection()
    po_number = get_next_po_number()

    po = {
        "rfqId": data["rfqId"],
        "quotationId": data["quotationId"],
        "vendorId": data["vendorId"],
        "poNumber": po_number,
        "items": data["items"],
        "totalAmount": float(data["totalAmount"]),
        "status": data.get("status", "created"),
        "created_at": datetime.now(timezone.utc),
    }

    result = po_collection.insert_one(po)
    _log_activity("PO created manually", f"PO: {po_number}, Vendor: {data['vendorId']}")

    return jsonify(
        {
            "message": "Purchase order created successfully",
            "poId": str(result.inserted_id),
            "poNumber": po_number,
        }
    ), 201


@purchase_orders_bp.route("/<po_id>", strict_slashes=False, methods=["PUT"])
@require_roles("officer")
def update_purchase_order(po_id):
    """Update a purchase order status."""
    data = request.get_json()
    po_collection = get_po_collection()

    try:
        obj_id = ObjectId(po_id)
    except Exception:
        return jsonify({"error": "Invalid PO ID"}), 400

    existing = po_collection.find_one({"_id": obj_id})
    if not existing:
        return jsonify({"error": "Purchase order not found"}), 404

    update_fields = {}
    for field in ["status", "items", "totalAmount"]:
        if field in data:
            update_fields[field] = data[field]

    if not update_fields:
        return jsonify({"error": "No fields to update"}), 400

    update_fields["updated_at"] = datetime.now(timezone.utc)
    po_collection.update_one({"_id": obj_id}, {"$set": update_fields})
    _log_activity("PO updated", f"PO: {existing['poNumber']} (ID: {po_id})")

    return jsonify({"message": "Purchase order updated successfully"}), 200


def _log_activity(action, details):
    from pymongo import MongoClient

    from config import DB_NAME, MONGO_URI

    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    db["logs"].insert_one(
        {
            "action": action,
            "details": details,
            "timestamp": datetime.now(timezone.utc),
        }
    )
