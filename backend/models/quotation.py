from pymongo import MongoClient
from config import MONGO_URI, DB_NAME

client = MongoClient(MONGO_URI)
db = client[DB_NAME]


def get_quotation_collection():
    """Return the quotations collection.

    Schema:
    {
        rfqId: str,             # RFQ ObjectId string
        vendorId: str,          # vendor ObjectId string
        price: float,
        deliveryDays: int,
        notes: str,
        status: str,            # "pending" | "accepted" | "rejected"
        created_at: datetime
    }
    """
    return db["quotations"]
