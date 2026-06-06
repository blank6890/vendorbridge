from db import get_db


def get_quotation_collection():
    """Return the quotations collection."""
    return get_db()["quotations"]
