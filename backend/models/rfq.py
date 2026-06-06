from pymongo import MongoClient
from config import MONGO_URI, DB_NAME

client = MongoClient(MONGO_URI)
db = client[DB_NAME]


def get_rfq_collection():
    """Return the rfqs collection.

    Schema:
    {
        title: str,
        items: [ { product: str, qty: int } ],
        deadline: str,              # ISO date string
        assignedVendors: [str],     # list of vendor ObjectId strings
        status: str,                # "open" | "closed" | "awarded"
        createdBy: str,             # user ObjectId string
        created_at: datetime
    }
    """
    return db["rfqs"]
