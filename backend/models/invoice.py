from pymongo import MongoClient
from config import MONGO_URI, DB_NAME

client = MongoClient(MONGO_URI)
db = client[DB_NAME]


def get_invoice_collection():
    """Return the invoices collection.

    Schema:
    {
        poId: str,              # purchase_order ObjectId string
        invoiceNumber: str,     # auto-generated: INV-001, INV-002, ...
        tax: float,
        total: float,
        status: str,            # "unpaid" | "paid"
        created_at: datetime
    }
    """
    return db["invoices"]


def get_next_invoice_number():
    """Generate the next sequential invoice number like INV-001, INV-002, etc."""
    collection = get_invoice_collection()
    count = collection.count_documents({})
    return f"INV-{str(count + 1).zfill(3)}"
