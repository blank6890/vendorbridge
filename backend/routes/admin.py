from datetime import datetime, timezone

from bson import ObjectId
from flask import Blueprint, jsonify, request

from models.user import get_user_collection
from utils.rbac import require_roles

admin_bp = Blueprint("admin", __name__)


def _serialize_user(user):
    user["_id"] = str(user["_id"])
    user.pop("password", None)
    if "created_at" in user and hasattr(user["created_at"], "isoformat"):
        user["created_at"] = user["created_at"].isoformat()
    if "updated_at" in user and hasattr(user["updated_at"], "isoformat"):
        user["updated_at"] = user["updated_at"].isoformat()
    return user


@admin_bp.route("/users", strict_slashes=False, methods=["GET"])
@require_roles("admin")
def list_users():
    """List all users (admin only). Supports ?role= filter."""
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


@admin_bp.route("/users/<user_id>", strict_slashes=False, methods=["PUT"])
@require_roles("admin")
def update_user(user_id):
    """Update user details (admin only)."""
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
            if field == "role" and data[field] not in {"admin", "officer", "vendor", "manager"}:
                return jsonify({"error": "Invalid role"}), 400
            update_fields[field] = data[field]

    if not update_fields:
        return jsonify({"error": "No fields to update"}), 400

    update_fields["updated_at"] = datetime.now(timezone.utc)
    users.update_one({"_id": obj_id}, {"$set": update_fields})
    _log_activity("User updated by admin", f"User: {existing['name']} (ID: {user_id})")

    return jsonify({"message": "User updated successfully"}), 200


@admin_bp.route("/users/<user_id>/disable", strict_slashes=False, methods=["PUT"])
@require_roles("admin")
def disable_user(user_id):
    """Disable a user account (admin only)."""
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


@admin_bp.route("/users/<user_id>/approve", strict_slashes=False, methods=["PUT"])
@require_roles("admin")
def approve_user(user_id):
    """Approve a user account (admin only)."""
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


@admin_bp.route("/users/<user_id>/reject", strict_slashes=False, methods=["PUT"])
@require_roles("admin")
def reject_user(user_id):
    """Reject a user account (admin only)."""
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
