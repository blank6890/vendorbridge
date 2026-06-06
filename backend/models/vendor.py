from pymongo import MongoClient
from config import MONGO_URI, DB_NAME

client = MongoClient(MONGO_URI)
db = client[DB_NAME]


def get_vendor_collection():
    """Return the vendors collection.

    Schema:
    {
        name: str,
        email: str,
        phone: str,
        category: str,
        gst: str,
        status: str,          # "active" | "inactive"
        rating: float,
        created_at: datetime
    }
    """
    return db["vendors"]
