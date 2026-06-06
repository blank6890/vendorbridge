from db import get_db


def get_po_collection():
    """Return the purchase_orders collection."""
    return get_db()["purchase_orders"]


def get_next_po_number():
    """Generate the next sequential PO number like PO-001, PO-002, etc."""
    collection = get_po_collection()
    count = collection.count_documents({})
    return f"PO-{str(count + 1).zfill(3)}"
