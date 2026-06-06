from db import get_db


def get_invoice_collection():
    """Return the invoices collection."""
    return get_db()["invoices"]


def get_next_invoice_number():
    """Generate the next sequential invoice number like INV-001, INV-002, etc."""
    collection = get_invoice_collection()
    count = collection.count_documents({})
    return f"INV-{str(count + 1).zfill(3)}"
