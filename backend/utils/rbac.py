import json
import os
import time
from functools import wraps

from flask import jsonify, request

VALID_ROLES = frozenset({"admin", "officer", "vendor", "manager"})
DEBUG_LOG_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "debug-5d99b0.log")


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


def require_roles(*roles):
    """Restrict a route to specific roles. Admins always pass."""
    allowed = frozenset(roles)

    def decorator(view_func):
        @wraps(view_func)
        def wrapped(*args, **kwargs):
            if not hasattr(request, "user"):
                _agent_log("RBAC", "rbac.py:wrapped", "missing request.user", {"path": request.path})
                return jsonify({"error": "Unauthorized"}), 401

            role = request.user.get("role")
            if role == "admin" or role in allowed:
                _agent_log(
                    "RBAC",
                    "rbac.py:wrapped",
                    "access granted",
                    {"path": request.path, "role": role, "allowed": list(allowed)},
                )
                return view_func(*args, **kwargs)

            _agent_log(
                "RBAC",
                "rbac.py:wrapped",
                "access denied",
                {"path": request.path, "role": role, "allowed": list(allowed)},
            )
            return jsonify({"error": "Forbidden"}), 403

        return wrapped

    return decorator
