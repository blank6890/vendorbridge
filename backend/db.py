import json
import os
import time

from pymongo import MongoClient
from pymongo.errors import PyMongoError, ServerSelectionTimeoutError

from config import DB_NAME, MONGO_URI

DEBUG_LOG_PATH = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "debug-5d99b0.log")
)

_client = MongoClient(
    MONGO_URI,
    serverSelectionTimeoutMS=5000,
    connectTimeoutMS=5000,
)
_db = _client[DB_NAME]
_indexes_ready = False


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


def get_db():
    return _db


def ensure_indexes():
    global _indexes_ready
    if _indexes_ready:
        return
    get_db()["users"].create_index("email", unique=True)
    _indexes_ready = True


def check_database_connection():
    """Ping MongoDB and return (ok, message)."""
    try:
        _client.admin.command("ping")
        _agent_log(
            "DB",
            "db.py:check_database_connection",
            "ping ok",
            {"db": DB_NAME, "uri_host": MONGO_URI.split("@")[-1].split("/")[0][:80]},
        )
        return True, "connected"
    except ServerSelectionTimeoutError:
        _agent_log(
            "DB",
            "db.py:check_database_connection",
            "server selection timeout",
            {"db": DB_NAME},
        )
        return False, (
            "Cannot reach MongoDB. Set MONGO_URI to your Atlas connection string "
            "and allow network access (0.0.0.0/0) in Atlas."
        )
    except PyMongoError as exc:
        _agent_log(
            "DB",
            "db.py:check_database_connection",
            "mongo error",
            {"error": str(exc)[:200]},
        )
        return False, f"Database error: {exc}"


def mongo_error_response(exc):
    """Build a JSON-safe 503 response for MongoDB failures."""
    if isinstance(exc, ServerSelectionTimeoutError):
        message = (
            "Database unavailable. Verify MONGO_URI on Render points to your Atlas "
            "cluster and Atlas Network Access allows Render (0.0.0.0/0)."
        )
    else:
        message = "Database error. Check server logs and MONGO_URI configuration."

    _agent_log("DB", "db.py:mongo_error_response", "request failed", {"error": str(exc)[:200]})
    return {"error": message}, 503
