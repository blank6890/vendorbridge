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
    "Company Admin": "admin",
    "Admin": "admin",
}

DEMO_LOGIN_ALIASES = {
    "admin": "admin@vendorbridge.com",
    "officer": "officer@vendorbridge.com",
    "manager": "manager@vendorbridge.com",
    "vendor": "vendor@vendorbridge.com",
}
DEMO_ACCOUNT_EMAILS = frozenset(DEMO_LOGIN_ALIASES.values())
DEMO_PASSWORD = "password"
LEGACY_DEMO_PASSWORD = "password123"


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
    """First user becomes admin (approved).
    Subsequent admin/Company Admin registrations go pending for email verification.
    Officers and Managers go pending for Company Admin approval.
    Vendors go pending for platform verification.
    """
    requested = data.get("role", "vendor")
    if requested in FRONTEND_ROLE_MAP:
        requested = FRONTEND_ROLE_MAP[requested]

    # First user on the platform becomes admin immediately
    if users.count_documents({}) == 0:
        _agent_log("REG", "auth.py:_resolve_registration_role", "first user -> admin", {})
        return "admin", "approved"

    if requested == "admin":
        # Subsequent Company Admin registrations require email verification
        _agent_log(
            "REG",
            "auth.py:_resolve_registration_role",
            "company admin registration -> pending email verification",
            {},
        )
        return "admin", "pending"

    if requested not in PUBLIC_REGISTRATION_ROLES:
        return None, None

    # Officers and Managers: pending Company Admin approval
    # Vendors: pending platform verification
    return requested, "pending"


def _resolve_login_email(identifier):
    identifier = (identifier or "").strip().lower()
    return DEMO_LOGIN_ALIASES.get(identifier, identifier)


def _password_matches(user, password, users):
    password_hash = user.get("password", "")
    if bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8")):
        return True

    email = (user.get("email") or "").lower()
    is_legacy_demo = (
        email in DEMO_ACCOUNT_EMAILS
        and password == DEMO_PASSWORD
        and bcrypt.checkpw(LEGACY_DEMO_PASSWORD.encode("utf-8"), password_hash.encode("utf-8"))
    )
    if not is_legacy_demo:
        return False

    upgraded_hash = bcrypt.hashpw(DEMO_PASSWORD.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    users.update_one({"_id": user["_id"]}, {"$set": {"password": upgraded_hash}})
    _agent_log("AUTH", "auth.py:_password_matches", "legacy demo password migrated", {"email": email})
    return True


@auth_bp.route("/register", methods=["POST"])
def register():
    """Register a new user.
    - First user: auto-approved admin.
    - Company Admin: pending email/document verification (3 working days).
    - Officer / Manager: pending Company Admin approval.
    - Vendor: pending platform verification (3 working days).
    """
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
        return jsonify({"error": "Invalid role"}), 403

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
    if data.get("company"):
        user["company"] = data["company"]

    result = users.insert_one(user)

    # Descriptive pending message per role
    pending_messages = {
        "admin": (
            "Registration received. We will send an email requesting documents to verify "
            "you are an authorized company representative. Verification takes up to 3 working days."
        ),
        "vendor": (
            "Registration received. We will send an email requesting business documents for "
            "platform verification. This takes up to 3 working days."
        ),
        "officer": "Registration received. Awaiting Company Admin approval.",
        "manager": "Registration received. Awaiting Company Admin approval.",
    }

    message = "User registered successfully"
    if status == "pending":
        message = pending_messages.get(role, "Registration received. Awaiting approval.")

    _log_activity("User registered", f"{data['name']} ({role}, {status})")

    return jsonify(
        {
            "message": message,
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
        return jsonify({"error": "Email/username and password are required"}), 400

    users = get_user_collection()
    login_email = _resolve_login_email(data["email"])
    user = users.find_one({"email": login_email})

    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    if not _password_matches(user, data["password"], users):
        return jsonify({"error": "Invalid email or password"}), 401

    status = user.get("status", "approved")
    if status == "disabled":
        return jsonify({"error": "Account is disabled"}), 403
    if status == "pending":
        role = user.get("role", "")
        if role == "admin":
            return jsonify({"error": "Account pending verification. Check your email for document requirements."}), 403
        elif role == "vendor":
            return jsonify({"error": "Account pending platform verification. Check your email for document requirements."}), 403
        else:
            return jsonify({"error": "Account pending Company Admin approval"}), 403
    if status == "rejected":
        reason = user.get("rejection_reason", "")
        msg = "Account registration was rejected"
        if reason:
            msg += f": {reason}"
        return jsonify({"error": msg}), 403

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
