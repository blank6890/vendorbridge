from db import ensure_indexes, get_db


def get_user_collection():
    """Return the users collection."""
    ensure_indexes()
    return get_db()["users"]
