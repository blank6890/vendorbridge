import json
import os
import time
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from flask import Blueprint, jsonify, request

from config import JWT_ALGORITHM, JWT_EXPIRY_HOURS, JWT_SECRET
from models.user import get_user_collection

auth_bp = Blueprint("auth", __name__)

PUBLIC_REGISTRATION_ROLES = frozenset({"officer", "vendor", "manager"})
DEBUG_LOG_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "debug-5d99b0.log")

FRONTEND_ROLE_MAP = {
    "Procurement Officer": "officer",
    "Manager": "manager",
    "Vendor": "vendor",
    "Admin": "admin",
}


def _agent_log(hypothesis_id, location, message, data=None):
    # #region agent log
    try:
        with open(DEBUG_LOG_PATH, "a", encoding="utf-8") as log_file:
            log_file.write(
                json.dumps(
                    {
                        "sessionId": "5d99b0",
                        "hypothesisId": hypothesis_id,
                        "location": location,
                        "message": message,
                        "data": data or {},
                        "timestamp": int(time.time() * 1000),
                    }
                )
                + "\n"
            )
    except OSError:
        pass
    # #endregion


def _resolve_registration_role(data, users):
    """First user becomes admin; otherwise only non-admin roles with pending status."""
    if users.count_documents({}) == 0:
        _agent_log("REG", "auth.py:_resolve_registration_role", "first user -> admin", {})
        return "admin", "approved"

    requested = data.get("role", "vendor")
    if requested in FRONTEND_ROLE_MAP:
        requested = FRONTEND_ROLE_MAP[requested]

    if requested == "admin" or requested not in PUBLIC_REGISTRATION_ROLES:
        _agent_log(
            "REG",
            "auth.py:_resolve_registration_role",
            "admin self-registration blocked",
            {"requested": requested},
        )
        return None, None

    return requested, "pending"


@auth_bp.route("/register", methods=["POST"])
def register():
    """Register a new user. First user is admin; others require admin approval."""
    data = request.get_json() or {}

    if "name" not in data and "firstName" in data:
        data["name"] = f"{data.get('firstName', '').strip()} {data.get('lastName', '').strip()}".strip()

    required = ["name", "email", "password"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"'{field}' is required"}), 400

    users = get_user_collection()

    if users.find_one({"email": data["email"]}):
        return jsonify({"error": "Email already registered"}), 409

    role, status = _resolve_registration_role(data, users)
    if role is None:
        return jsonify({"error": "Cannot self-register as admin"}), 403

    hashed = bcrypt.hashpw(data["password"].encode("utf-8"), bcrypt.gensalt())

    user = {
        "name": data["name"],
        "email": data["email"],
        "password": hashed.decode("utf-8"),
        "role": role,
        "status": status,
        "created_at": datetime.now(timezone.utc),
    }

    if data.get("phone"):
        user["phone"] = data["phone"]
    if data.get("country"):
        user["country"] = data["country"]

    result = users.insert_one(user)
    _log_activity("User registered", f"{data['name']} ({role}, {status})")

    return jsonify(
        {
            "message": "User registered successfully",
            "userId": str(result.inserted_id),
            "role": role,
            "status": status,
        }
    ), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticate user and return JWT token."""
    data = request.get_json()

    if not data or "email" not in data or "password" not in data:
        return jsonify({"error": "Email and password are required"}), 400

    users = get_user_collection()
    user = users.find_one({"email": data["email"]})

    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    if not bcrypt.checkpw(data["password"].encode("utf-8"), user["password"].encode("utf-8")):
        return jsonify({"error": "Invalid email or password"}), 401

    status = user.get("status", "approved")
    if status == "disabled":
        return jsonify({"error": "Account is disabled"}), 403
    if status == "pending":
        return jsonify({"error": "Account pending admin approval"}), 403
    if status == "rejected":
        return jsonify({"error": "Account registration was rejected"}), 403

    payload = {
        "userId": str(user["_id"]),
        "email": user["email"],
        "role": user["role"],
        "name": user["name"],
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
    }

    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    _log_activity("User login", f"{user['name']} ({user['role']})")

    return jsonify(
        {
            "message": "Login successful",
            "token": token,
            "user": {
                "id": str(user["_id"]),
                "name": user["name"],
                "email": user["email"],
                "role": user["role"],
                "status": status,
            },
        }
    ), 200


def _log_activity(action, details):
    """Helper to log auth activities."""
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
