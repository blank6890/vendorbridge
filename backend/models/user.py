from pymongo import MongoClient
from config import MONGO_URI, DB_NAME

client = MongoClient(MONGO_URI)
db = client[DB_NAME]


def get_user_collection():
    """Return the users collection.

    Schema:
    {
        name: str,
        email: str,          # unique
        password: str,        # bcrypt hashed
        role: str,            # "admin" | "officer" | "vendor" | "manager"
        created_at: datetime
    }
    """
    collection = db["users"]
    collection.create_index("email", unique=True)
    return collection
