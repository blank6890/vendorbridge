"""
Seed script for VendorBridge.
Creates one user per role (admin, officer, vendor, manager) for testing.

Usage:
    python seed.py

All seed users use the password: password123
"""

from pymongo import MongoClient
from datetime import datetime, timezone
import bcrypt
from config import MONGO_URI, DB_NAME

client = MongoClient(MONGO_URI)
db = client[DB_NAME]


def hash_password(password):
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


SEED_USERS = [
    {
        "name": "Alice Admin",
        "email": "admin@vendorbridge.com",
        "password": hash_password("password123"),
        "role": "admin",
        "status": "approved",
        "created_at": datetime.now(timezone.utc),
    },
    {
        "name": "Oscar Officer",
        "email": "officer@vendorbridge.com",
        "password": hash_password("password123"),
        "role": "officer",
        "status": "approved",
        "created_at": datetime.now(timezone.utc),
    },
    {
        "name": "Victor Vendor",
        "email": "vendor@vendorbridge.com",
        "password": hash_password("password123"),
        "role": "vendor",
        "status": "approved",
        "created_at": datetime.now(timezone.utc),
    },
    {
        "name": "Mike Manager",
        "email": "manager@vendorbridge.com",
        "password": hash_password("password123"),
        "role": "manager",
        "status": "approved",
        "created_at": datetime.now(timezone.utc),
    },
]

SEED_VENDORS = [
    {
        "name": "TechSupply Co.",
        "email": "contact@techsupply.com",
        "phone": "+91-9876543210",
        "category": "Electronics",
        "gst": "29ABCDE1234F1Z5",
        "status": "active",
        "rating": 4.5,
        "created_at": datetime.now(timezone.utc),
    },
    {
        "name": "OfficeMax India",
        "email": "sales@officemax.in",
        "phone": "+91-9123456789",
        "category": "Office Supplies",
        "gst": "27FGHIJ5678K2L6",
        "status": "active",
        "rating": 4.0,
        "created_at": datetime.now(timezone.utc),
    },
    {
        "name": "BuildRight Materials",
        "email": "info@buildright.com",
        "phone": "+91-9988776655",
        "category": "Construction",
        "gst": "24MNOPQ9012R3S7",
        "status": "active",
        "rating": 3.8,
        "created_at": datetime.now(timezone.utc),
    },
]


def seed():
    """Run the seed script."""
    print("[*] Seeding VendorBridge database...")
    print(f"    Database: {DB_NAME}")
    print(f"    MongoDB:  {MONGO_URI}")
    print()

    # --- Seed Users ---
    users_collection = db["users"]
    users_collection.create_index("email", unique=True)

    print("[+] Seeding users...")
    for user in SEED_USERS:
        existing = users_collection.find_one({"email": user["email"]})
        if existing:
            print(f"    [SKIP] {user['name']} ({user['role']}) - already exists")
        else:
            users_collection.insert_one(user)
            print(f"    [OK]   {user['name']} ({user['role']}) - created")

    print()

    # --- Seed Vendors ---
    vendors_collection = db["vendors"]

    print("[+] Seeding vendors...")
    for vendor in SEED_VENDORS:
        existing = vendors_collection.find_one({"email": vendor["email"]})
        if existing:
            print(f"    [SKIP] {vendor['name']} - already exists")
        else:
            vendors_collection.insert_one(vendor)
            print(f"    [OK]   {vendor['name']} ({vendor['category']}) - created")

    print()
    print("=" * 50)
    print("[DONE] Seeding complete!")
    print()
    print("Test credentials (all use password: password123):")
    print("  Admin:   admin@vendorbridge.com")
    print("  Officer: officer@vendorbridge.com")
    print("  Vendor:  vendor@vendorbridge.com")
    print("  Manager: manager@vendorbridge.com")
    print("=" * 50)


if __name__ == "__main__":
    seed()
