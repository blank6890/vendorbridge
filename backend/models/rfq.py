from db import get_db


def get_rfq_collection():
    """Return the rfqs collection."""
    return get_db()["rfqs"]
