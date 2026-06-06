from db import get_db


def get_vendor_collection():
    """Return the vendors collection."""
    return get_db()["vendors"]
