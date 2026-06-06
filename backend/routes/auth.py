from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
import bcrypt
import jwt
from config import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRY_HOURS
from models.user import get_user_collection
from datetime import timedelta

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    """Register a new user with hashed password."""
    data = request.get_json()

    required = ["name", "email", "password", "role"]
    for field in required:
        if field not in data:
            return jsonify({"error": f"'{field}' is required"}), 400

    valid_roles = ["admin", "officer", "vendor", "manager"]
    if data["role"] not in valid_roles:
        return jsonify({"error": f"Role must be one of {valid_roles}"}), 400

    users = get_user_collection()

    # Check if user already exists
    if users.find_one({"email": data["email"]}):
        return jsonify({"error": "Email already registered"}), 409

    # Hash password
    hashed = bcrypt.hashpw(data["password"].encode("utf-8"), bcrypt.gensalt())

    user = {
        "name": data["name"],
        "email": data["email"],
        "password": hashed.decode("utf-8"),
        "role": data["role"],
        "created_at": datetime.now(timezone.utc),
    }

    result = users.insert_one(user)

    # Log activity
    _log_activity("User registered", f"{data['name']} ({data['role']})")

    return jsonify({
        "message": "User registered successfully",
        "userId": str(result.inserted_id),
    }), 201


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

    # Verify password
    if not bcrypt.checkpw(data["password"].encode("utf-8"), user["password"].encode("utf-8")):
        return jsonify({"error": "Invalid email or password"}), 401

    # Generate JWT
    payload = {
        "userId": str(user["_id"]),
        "email": user["email"],
        "role": user["role"],
        "name": user["name"],
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
    }

    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    _log_activity("User login", f"{user['name']} ({user['role']})")

    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
        },
    }), 200


def _log_activity(action, details):
    """Helper to log auth activities."""
    from pymongo import MongoClient
    from config import MONGO_URI, DB_NAME

    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    db["logs"].insert_one({
        "action": action,
        "details": details,
        "timestamp": datetime.now(timezone.utc),
    })
