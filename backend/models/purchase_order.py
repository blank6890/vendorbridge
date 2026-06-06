from pymongo import MongoClient
from config import MONGO_URI, DB_NAME

client = MongoClient(MONGO_URI)
db = client[DB_NAME]


def get_po_collection():
    """Return the purchase_orders collection.

    Schema:
    {
        rfqId: str,
        quotationId: str,
        vendorId: str,
        poNumber: str,          # auto-generated: PO-001, PO-002, ...
        items: [ { product: str, qty: int } ],
        totalAmount: float,
        status: str,            # "created" | "delivered" | "cancelled"
        created_at: datetime
    }
    """
    return db["purchase_orders"]


def get_next_po_number():
    """Generate the next sequential PO number like PO-001, PO-002, etc."""
    collection = get_po_collection()
    count = collection.count_documents({})
    return f"PO-{str(count + 1).zfill(3)}"
