from flask import Flask, request, jsonify
from flask_cors import CORS
from functools import wraps
import jwt
from config import JWT_SECRET, JWT_ALGORITHM

# Import blueprints
from routes.auth import auth_bp
from routes.vendors import vendors_bp
from routes.rfq import rfq_bp
from routes.quotations import quotations_bp
from routes.approvals import approvals_bp
from routes.purchase_orders import purchase_orders_bp
from routes.invoices import invoices_bp

app = Flask(__name__)

# CORS — allow React dev server on localhost:5173
CORS(app, origins=[
    "http://localhost:5173",
    "https://https://vendorbridge-410c.onrender.com"
])

# ─── JWT Middleware ───────────────────────────────────────────────────────────

# Routes that do NOT require authentication
PUBLIC_ROUTES = [
    "/",
    "/api/auth/login",
    "/api/auth/register"
]


@app.before_request
def jwt_middleware():
    """Verify JWT token on all routes except public ones."""
    if request.method == "OPTIONS":
        return None  # Allow CORS preflight

    if request.path in PUBLIC_ROUTES:
        return None

    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return jsonify({"error": "Authorization header is missing"}), 401

    parts = auth_header.split()
    if len(parts) != 2 or parts[0] != "Bearer":
        return jsonify({"error": "Invalid authorization format. Use 'Bearer <token>'"}), 401

    token = parts[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        request.user = payload  # Attach user info to request
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401

    return None


# ─── Logs Route ───────────────────────────────────────────────────────────────

@app.route("/logs", methods=["GET"])
def get_logs():
    """Return all activity logs, most recent first."""
    from pymongo import MongoClient
    from config import MONGO_URI, DB_NAME

    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]

    logs = list(db["logs"].find().sort("timestamp", -1))
    for log in logs:
        log["_id"] = str(log["_id"])
        if "timestamp" in log:
            log["timestamp"] = log["timestamp"].isoformat()

    return jsonify(logs), 200


# ─── Health Check ─────────────────────────────────────────────────────────────

@app.route("/", methods=["GET"])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "running",
        "app": "VendorBridge API",
        "version": "1.0.0",
    }), 200


# ─── Register Blueprints ─────────────────────────────────────────────────────

app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(vendors_bp, url_prefix="/api/vendors")
app.register_blueprint(rfq_bp, url_prefix="/api/rfq")
app.register_blueprint(quotations_bp, url_prefix="/api/quotations")
app.register_blueprint(approvals_bp, url_prefix="/api/approvals")
app.register_blueprint(purchase_orders_bp, url_prefix="/api/purchase-orders")
app.register_blueprint(invoices_bp, url_prefix="/api/invoices")

# ─── Error Handlers ──────────────────────────────────────────────────────────

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Route not found"}), 404


@app.errorhandler(500)
def internal_error(e):
    return jsonify({"error": "Internal server error"}), 500


# ─── Run ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 50)
    print("  VendorBridge API Server")
    print("  Running on http://localhost:5000")
    print("=" * 50)
    app.run(debug=True, port=5000)
