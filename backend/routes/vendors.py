from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
from bson import ObjectId
from models.vendor import get_vendor_collection

vendors_bp = Blueprint("vendors", __name__)


def _serialize_vendor(vendor):
    """Convert MongoDB vendor document to JSON-safe dict."""
    vendor["_id"] = str(vendor["_id"])
    return vendor


@vendors_bp.route("/vendors", methods=["GET"])
def list_vendors():
    """List all vendors with optional category filter."""
    vendors = get_vendor_collection()
    category = request.args.get("category")
    status = request.args.get("status")

    query = {}
    if category:
        query["category"] = category
    if status:
        query["status"] = status

    result = list(vendors.find(query))
    return jsonify([_serialize_vendor(v) for v in result]), 200


@vendors_bp.route("/vendors", methods=["POST"])
def add_vendor():
    """Add a new vendor."""
    data = request.get_json()

    required = ["name", "email", "phone", "category", "gst"]
    for field in required:
        if field not in data:
            return jsonify({"error": f"'{field}' is required"}), 400

    vendors = get_vendor_collection()

    vendor = {
        "name": data["name"],
        "email": data["email"],
        "phone": data["phone"],
        "category": data["category"],
        "gst": data["gst"],
        "status": data.get("status", "active"),
        "rating": data.get("rating", 0),
        "created_at": datetime.now(timezone.utc),
    }

    result = vendors.insert_one(vendor)

    _log_activity("Vendor added", f"{data['name']} ({data['category']})")

    return jsonify({
        "message": "Vendor added successfully",
        "vendorId": str(result.inserted_id),
    }), 201


@vendors_bp.route("/vendors/<vendor_id>", methods=["PUT"])
def update_vendor(vendor_id):
    """Update an existing vendor."""
    data = request.get_json()
    vendors = get_vendor_collection()

    try:
        obj_id = ObjectId(vendor_id)
    except Exception:
        return jsonify({"error": "Invalid vendor ID"}), 400

    existing = vendors.find_one({"_id": obj_id})
    if not existing:
        return jsonify({"error": "Vendor not found"}), 404

    update_fields = {}
    for field in ["name", "email", "phone", "category", "gst", "status", "rating"]:
        if field in data:
            update_fields[field] = data[field]

    if not update_fields:
        return jsonify({"error": "No fields to update"}), 400

    update_fields["updated_at"] = datetime.now(timezone.utc)
    vendors.update_one({"_id": obj_id}, {"$set": update_fields})

    _log_activity("Vendor updated", f"{existing['name']} (ID: {vendor_id})")

    return jsonify({"message": "Vendor updated successfully"}), 200


@vendors_bp.route("/vendors/<vendor_id>", methods=["DELETE"])
def delete_vendor(vendor_id):
    """Delete a vendor."""
    vendors = get_vendor_collection()

    try:
        obj_id = ObjectId(vendor_id)
    except Exception:
        return jsonify({"error": "Invalid vendor ID"}), 400

    existing = vendors.find_one({"_id": obj_id})
    if not existing:
        return jsonify({"error": "Vendor not found"}), 404

    vendors.delete_one({"_id": obj_id})

    _log_activity("Vendor deleted", f"{existing['name']} (ID: {vendor_id})")

    return jsonify({"message": "Vendor deleted successfully"}), 200


def _log_activity(action, details):
    """Log vendor-related activities."""
    from pymongo import MongoClient
    from config import MONGO_URI, DB_NAME

    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    db["logs"].insert_one({
        "action": action,
        "details": details,
        "timestamp": datetime.now(timezone.utc),
    })
