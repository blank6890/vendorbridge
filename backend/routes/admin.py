from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
from bson import ObjectId
from models.user import get_user_collection

admin_bp = Blueprint("admin", __name__)


def _serialize_user(user):
    """Convert MongoDB user document to JSON-safe dict (exclude password)."""
    user["_id"] = str(user["_id"])
    user.pop("password", None)
    if "created_at" in user and hasattr(user["created_at"], "isoformat"):
        user["created_at"] = user["created_at"].isoformat()
    if "updated_at" in user and hasattr(user["updated_at"], "isoformat"):
        user["updated_at"] = user["updated_at"].isoformat()
    return user


@admin_bp.route("/users", methods=["GET"])
def list_users():
    """List all users (admin only). Supports ?role= filter."""
    # Check admin role
    if not hasattr(request, "user") or request.user.get("role") != "admin":
        return jsonify({"error": "Admin access required"}), 403

    users = get_user_collection()
    role = request.args.get("role")
    status = request.args.get("status")

    query = {}
    if role:
        query["role"] = role
    if status:
        query["status"] = status

    result = list(users.find(query))
    return jsonify([_serialize_user(u) for u in result]), 200


@admin_bp.route("/users/<user_id>", methods=["PUT"])
def update_user(user_id):
    """Update user details (admin only)."""
    if not hasattr(request, "user") or request.user.get("role") != "admin":
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json()
    users = get_user_collection()

    try:
        obj_id = ObjectId(user_id)
    except Exception:
        return jsonify({"error": "Invalid user ID"}), 400

    existing = users.find_one({"_id": obj_id})
    if not existing:
        return jsonify({"error": "User not found"}), 404

    update_fields = {}
    for field in ["name", "email", "role"]:
        if field in data:
            update_fields[field] = data[field]

    if not update_fields:
        return jsonify({"error": "No fields to update"}), 400

    update_fields["updated_at"] = datetime.now(timezone.utc)
    users.update_one({"_id": obj_id}, {"$set": update_fields})

    _log_activity("User updated by admin", f"User: {existing['name']} (ID: {user_id})")

    return jsonify({"message": "User updated successfully"}), 200


@admin_bp.route("/users/<user_id>/disable", methods=["PUT"])
def disable_user(user_id):
    """Disable a user account (admin only)."""
    if not hasattr(request, "user") or request.user.get("role") != "admin":
        return jsonify({"error": "Admin access required"}), 403

    users = get_user_collection()

    try:
        obj_id = ObjectId(user_id)
    except Exception:
        return jsonify({"error": "Invalid user ID"}), 400

    existing = users.find_one({"_id": obj_id})
    if not existing:
        return jsonify({"error": "User not found"}), 404

    users.update_one(
        {"_id": obj_id},
        {"$set": {"status": "disabled", "updated_at": datetime.now(timezone.utc)}},
    )

    _log_activity("User disabled", f"User: {existing['name']} (ID: {user_id})")

    return jsonify({"message": f"User '{existing['name']}' has been disabled"}), 200


@admin_bp.route("/users/<user_id>/approve", methods=["PUT"])
def approve_user(user_id):
    """Approve a user account (admin only)."""
    if not hasattr(request, "user") or request.user.get("role") != "admin":
        return jsonify({"error": "Admin access required"}), 403

    users = get_user_collection()

    try:
        obj_id = ObjectId(user_id)
    except Exception:
        return jsonify({"error": "Invalid user ID"}), 400

    existing = users.find_one({"_id": obj_id})
    if not existing:
        return jsonify({"error": "User not found"}), 404

    users.update_one(
        {"_id": obj_id},
        {"$set": {"status": "approved", "updated_at": datetime.now(timezone.utc)}},
    )

    _log_activity("User approved", f"User: {existing['name']} (ID: {user_id})")

    return jsonify({"message": f"User '{existing['name']}' has been approved"}), 200


@admin_bp.route("/users/<user_id>/reject", methods=["PUT"])
def reject_user(user_id):
    """Reject a user account (admin only)."""
    if not hasattr(request, "user") or request.user.get("role") != "admin":
        return jsonify({"error": "Admin access required"}), 403

    users = get_user_collection()

    try:
        obj_id = ObjectId(user_id)
    except Exception:
        return jsonify({"error": "Invalid user ID"}), 400

    existing = users.find_one({"_id": obj_id})
    if not existing:
        return jsonify({"error": "User not found"}), 404

    users.update_one(
        {"_id": obj_id},
        {"$set": {"status": "rejected", "updated_at": datetime.now(timezone.utc)}},
    )

    _log_activity("User rejected", f"User: {existing['name']} (ID: {user_id})")

    return jsonify({"message": f"User '{existing['name']}' has been rejected"}), 200


def _log_activity(action, details):
    """Log admin activities."""
    from pymongo import MongoClient
    from config import MONGO_URI, DB_NAME

    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    db["logs"].insert_one({
        "action": action,
        "details": details,
        "timestamp": datetime.now(timezone.utc),
    })
