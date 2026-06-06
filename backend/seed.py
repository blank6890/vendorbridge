"""
Seed script for VendorBridge.

Creates demo users, vendors, RFQs, quotations, purchase orders, invoices, and
activity logs so the procurement workflow can be demonstrated end to end.

Usage:
    python seed.py

Demo credentials:
    admin / password
    officer / password
    manager / password
    vendor / password

Email logins also work, for example admin@vendorbridge.com / password.
"""

from datetime import datetime, timedelta, timezone

import bcrypt

from config import DB_NAME
from db import check_database_connection, get_db

DEMO_PASSWORD = "password"
TAX_RATE = 18

db_ok, db_message = check_database_connection()
if not db_ok:
    raise SystemExit(f"Cannot seed database: {db_message}")

db = get_db()


def now():
    return datetime.now(timezone.utc)


def date_after(days):
    return (now() + timedelta(days=days)).date().isoformat()


def hash_password(password):
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def upsert_document(collection, query, document, label):
    existing = collection.find_one(query)
    if existing:
        update = {**document, "updated_at": now()}
        collection.update_one({"_id": existing["_id"]}, {"$set": update})
        print(f"    [UPDATE] {label}")
        return existing["_id"]

    insert = {**document, "created_at": now()}
    result = collection.insert_one(insert)
    print(f"    [CREATE] {label}")
    return result.inserted_id


SEED_USERS = [
    {
        "alias": "admin",
        "name": "Alice Admin",
        "email": "admin@vendorbridge.com",
        "role": "admin",
        "status": "approved",
        "phone": "+91 98765 00001",
        "country": "India",
        "company": "VendorBridge Demo Co.",
    },
    {
        "alias": "officer",
        "name": "Oscar Officer",
        "email": "officer@vendorbridge.com",
        "role": "officer",
        "status": "approved",
        "phone": "+91 98765 00002",
        "country": "India",
        "company": "VendorBridge Demo Co.",
    },
    {
        "alias": "manager",
        "name": "Mike Manager",
        "email": "manager@vendorbridge.com",
        "role": "manager",
        "status": "approved",
        "phone": "+91 98765 00003",
        "country": "India",
        "company": "VendorBridge Demo Co.",
    },
    {
        "alias": "vendor",
        "name": "Suresh Nair",
        "email": "vendor@vendorbridge.com",
        "role": "vendor",
        "status": "approved",
        "phone": "+91 98200 11223",
        "country": "India",
        "company": "Acme Industrial Co.",
    },
]

SEED_VENDORS = [
    {
        "key": "acme",
        "name": "Acme Industrial Co.",
        "category": "Raw Materials",
        "gst": "27AABCA1234F1Z5",
        "contact": "Suresh Nair",
        "email": "suresh@acme.io",
        "phone": "+91 98200 11223",
        "status": "active",
        "rating": 4.6,
        "address": "Mumbai, Maharashtra",
        "paymentTerms": "Net 15",
    },
    {
        "key": "vertex",
        "name": "Vertex Materials",
        "category": "Raw Materials",
        "gst": "29AAFCV5678K1Z2",
        "contact": "Lena Park",
        "email": "lena@vertex.com",
        "phone": "+91 99100 44556",
        "status": "active",
        "rating": 4.8,
        "address": "Bengaluru, Karnataka",
        "paymentTerms": "Net 30",
    },
    {
        "key": "techsource",
        "name": "TechSource Systems",
        "category": "IT Services",
        "gst": "07AAGCT9012L1Z9",
        "contact": "Mohit Verma",
        "email": "mohit@techsource.io",
        "phone": "+91 98765 33221",
        "status": "active",
        "rating": 4.2,
        "address": "New Delhi",
        "paymentTerms": "Net 30",
    },
    {
        "key": "logipro",
        "name": "LogiPro Freight",
        "category": "Logistics",
        "gst": "24AALCL3456M1Z7",
        "contact": "Diego Alvarez",
        "email": "diego@logipro.com",
        "phone": "+91 90040 77889",
        "status": "onboarding",
        "rating": 0,
        "address": "Ahmedabad, Gujarat",
        "paymentTerms": "Net 15",
    },
    {
        "key": "paperplus",
        "name": "PaperPlus Supplies",
        "category": "Office Supplies",
        "gst": "33AAMCP7890N1Z4",
        "contact": "Fatima Sheikh",
        "email": "fatima@paperplus.in",
        "phone": "+91 96540 12309",
        "status": "suspended",
        "rating": 3.4,
        "address": "Chennai, Tamil Nadu",
        "paymentTerms": "Net 7",
    },
    {
        "key": "forge",
        "name": "Forge Machinery Ltd.",
        "category": "Machinery",
        "gst": "19AANCF2345P1Z1",
        "contact": "Ravi Iyer",
        "email": "ravi@forge.co",
        "phone": "+91 93210 65478",
        "status": "blacklisted",
        "rating": 2.1,
        "address": "Kolkata, West Bengal",
        "paymentTerms": "Advance",
    },
]


def seed_users():
    users = db["users"]
    users.create_index("email", unique=True)

    print("[+] Seeding users...")
    user_ids = {}
    for user in SEED_USERS:
        document = {
            "name": user["name"],
            "email": user["email"],
            "password": hash_password(DEMO_PASSWORD),
            "role": user["role"],
            "status": user["status"],
            "phone": user["phone"],
            "country": user["country"],
            "company": user["company"],
        }
        user_ids[user["alias"]] = upsert_document(
            users,
            {"email": user["email"]},
            document,
            f"{user['name']} ({user['role']})",
        )
    return user_ids


def seed_vendors():
    vendors = db["vendors"]
    vendors.create_index("email")

    print("[+] Seeding vendors...")
    vendor_ids = {}
    for vendor in SEED_VENDORS:
        document = {k: v for k, v in vendor.items() if k != "key"}
        vendor_ids[vendor["key"]] = upsert_document(
            vendors,
            {"email": vendor["email"]},
            document,
            f"{vendor['name']} ({vendor['category']})",
        )
    return vendor_ids


def seed_rfqs(user_ids, vendor_ids):
    rfqs = db["rfqs"]
    print("[+] Seeding RFQs...")

    data = [
        {
            "key": "bearings",
            "title": "Industrial Bearings Procurement",
            "items": [
                {
                    "product": "Deep-groove ball bearing 6204",
                    "qty": 500,
                    "unit": "pcs",
                    "spec": "ABEC-5, sealed",
                }
            ],
            "deadline": date_after(7),
            "assignedVendors": [
                str(vendor_ids["acme"]),
                str(vendor_ids["vertex"]),
                str(vendor_ids["forge"]),
            ],
            "status": "open",
        },
        {
            "key": "network-switch",
            "title": "Network Switch Refresh",
            "items": [
                {
                    "product": "48-port managed switch",
                    "qty": 24,
                    "unit": "pcs",
                    "spec": "L3, 10G uplink, 3-year warranty",
                }
            ],
            "deadline": date_after(10),
            "assignedVendors": [str(vendor_ids["techsource"])],
            "status": "open",
        },
        {
            "key": "steel-sheets",
            "title": "Cold-Rolled Steel Sheets",
            "items": [
                {
                    "product": "CR steel sheet 1.2mm",
                    "qty": 12,
                    "unit": "tons",
                    "spec": "IS 513 CR2",
                }
            ],
            "deadline": date_after(1),
            "assignedVendors": [str(vendor_ids["acme"]), str(vendor_ids["vertex"])],
            "status": "awarded",
        },
        {
            "key": "stationery",
            "title": "Office Stationery Bulk",
            "items": [
                {
                    "product": "A4 copier paper 75gsm",
                    "qty": 800,
                    "unit": "reams",
                    "spec": "Brightness >= 92",
                },
                {
                    "product": "Sticky notes pack",
                    "qty": 120,
                    "unit": "packs",
                    "spec": "Assorted colors",
                },
            ],
            "deadline": date_after(-5),
            "assignedVendors": [str(vendor_ids["paperplus"])],
            "status": "awarded",
        },
    ]

    rfq_ids = {}
    for rfq in data:
        document = {k: v for k, v in rfq.items() if k != "key"}
        document["seedKey"] = rfq["key"]
        document["createdBy"] = str(user_ids["officer"])
        rfq_ids[rfq["key"]] = upsert_document(
            rfqs,
            {"seedKey": rfq["key"]},
            document,
            f"{rfq['title']} ({rfq['status']})",
        )
    return rfq_ids


def seed_quotations(user_ids, vendor_ids, rfq_ids):
    quotations = db["quotations"]
    print("[+] Seeding quotations...")

    data = [
        {
            "key": "bearings-acme",
            "rfqId": str(rfq_ids["bearings"]),
            "vendorId": str(vendor_ids["acme"]),
            "price": 248000,
            "deliveryDays": 14,
            "notes": "Includes freight, 10% advance.",
            "status": "pending",
        },
        {
            "key": "bearings-vertex",
            "rfqId": str(rfq_ids["bearings"]),
            "vendorId": str(vendor_ids["vertex"]),
            "price": 236500,
            "deliveryDays": 18,
            "notes": "Bulk discount applied; ready for manager review.",
            "status": "forwarded",
            "forwardedBy": str(user_ids["officer"]),
            "forwardedReason": "Lowest landed cost with acceptable lead time.",
            "forwardedAt": now() - timedelta(hours=3),
        },
        {
            "key": "bearings-forge",
            "rfqId": str(rfq_ids["bearings"]),
            "vendorId": str(vendor_ids["forge"]),
            "price": 259000,
            "deliveryDays": 11,
            "notes": "Express dispatch available.",
            "status": "rejected",
            "rejectedBy": str(user_ids["officer"]),
            "rejection_reason": "Vendor is blacklisted for this category.",
            "rejectedAt": now() - timedelta(hours=4),
        },
        {
            "key": "network-techsource",
            "rfqId": str(rfq_ids["network-switch"]),
            "vendorId": str(vendor_ids["techsource"]),
            "price": 412000,
            "deliveryDays": 21,
            "notes": "Includes installation support and 3-year warranty.",
            "status": "pending",
        },
        {
            "key": "steel-acme",
            "rfqId": str(rfq_ids["steel-sheets"]),
            "vendorId": str(vendor_ids["acme"]),
            "price": 81600,
            "deliveryDays": 9,
            "notes": "Approved supplier with fastest stock confirmation.",
            "status": "accepted",
            "forwardedBy": str(user_ids["officer"]),
            "forwardedReason": "Meets spec and delivery window.",
            "forwardedAt": now() - timedelta(days=1, hours=5),
            "approvedBy": str(user_ids["manager"]),
            "approvalReason": "Within budget and operationally viable.",
            "approvedAt": now() - timedelta(days=1, hours=2),
        },
        {
            "key": "stationery-paperplus",
            "rfqId": str(rfq_ids["stationery"]),
            "vendorId": str(vendor_ids["paperplus"]),
            "price": 261400,
            "deliveryDays": 6,
            "notes": "Delivered for back-office replenishment.",
            "status": "accepted",
            "forwardedBy": str(user_ids["officer"]),
            "forwardedReason": "Only complete bid received before deadline.",
            "forwardedAt": now() - timedelta(days=7),
            "approvedBy": str(user_ids["manager"]),
            "approvalReason": "Approved for urgent monthly replenishment.",
            "approvedAt": now() - timedelta(days=6),
        },
    ]

    quotation_ids = {}
    for quote in data:
        document = {k: v for k, v in quote.items() if k != "key"}
        document["seedKey"] = quote["key"]
        quotation_ids[quote["key"]] = upsert_document(
            quotations,
            {"seedKey": quote["key"]},
            document,
            f"{quote['key']} ({quote['status']})",
        )
    return quotation_ids


def seed_purchase_orders(vendor_ids, rfq_ids, quotation_ids):
    purchase_orders = db["purchase_orders"]
    print("[+] Seeding purchase orders...")

    data = [
        {
            "key": "po-steel-acme",
            "rfqId": str(rfq_ids["steel-sheets"]),
            "quotationId": str(quotation_ids["steel-acme"]),
            "vendorId": str(vendor_ids["acme"]),
            "poNumber": "PO-001",
            "items": [
                {
                    "product": "CR steel sheet 1.2mm",
                    "qty": 12,
                    "unit": "tons",
                    "spec": "IS 513 CR2",
                }
            ],
            "totalAmount": 81600,
            "status": "issued",
        },
        {
            "key": "po-stationery-paperplus",
            "rfqId": str(rfq_ids["stationery"]),
            "quotationId": str(quotation_ids["stationery-paperplus"]),
            "vendorId": str(vendor_ids["paperplus"]),
            "poNumber": "PO-002",
            "items": [
                {
                    "product": "A4 copier paper 75gsm",
                    "qty": 800,
                    "unit": "reams",
                    "spec": "Brightness >= 92",
                },
                {
                    "product": "Sticky notes pack",
                    "qty": 120,
                    "unit": "packs",
                    "spec": "Assorted colors",
                },
            ],
            "totalAmount": 261400,
            "status": "delivered",
        },
    ]

    po_ids = {}
    for po in data:
        document = {k: v for k, v in po.items() if k != "key"}
        document["seedKey"] = po["key"]
        po_ids[po["key"]] = upsert_document(
            purchase_orders,
            {"seedKey": po["key"]},
            document,
            f"{po['poNumber']} ({po['status']})",
        )
    return po_ids


def seed_invoices(po_ids):
    invoices = db["invoices"]
    print("[+] Seeding invoices...")

    data = [
        {
            "key": "invoice-steel-acme",
            "poId": str(po_ids["po-steel-acme"]),
            "invoiceNumber": "INV-001",
            "subtotal": 81600,
            "status": "unpaid",
        },
        {
            "key": "invoice-stationery-paperplus",
            "poId": str(po_ids["po-stationery-paperplus"]),
            "invoiceNumber": "INV-002",
            "subtotal": 261400,
            "status": "paid",
        },
    ]

    for invoice in data:
        tax = round(invoice["subtotal"] * (TAX_RATE / 100), 2)
        document = {
            "seedKey": invoice["key"],
            "poId": invoice["poId"],
            "invoiceNumber": invoice["invoiceNumber"],
            "subtotal": invoice["subtotal"],
            "tax": tax,
            "taxRate": TAX_RATE,
            "total": round(invoice["subtotal"] + tax, 2),
            "status": invoice["status"],
        }
        upsert_document(
            invoices,
            {"seedKey": invoice["key"]},
            document,
            f"{invoice['invoiceNumber']} ({invoice['status']})",
        )


def seed_logs():
    logs = db["logs"]
    print("[+] Seeding activity logs...")

    data = [
        {
            "key": "log-rfq",
            "action": "RFQ created",
            "details": "Industrial Bearings Procurement assigned to three vendors",
        },
        {
            "key": "log-forward",
            "action": "Quotation forwarded to Manager by Officer",
            "details": "Vertex Materials bid forwarded for final approval",
        },
        {
            "key": "log-po",
            "action": "PO issued",
            "details": "PO-001 issued to Acme Industrial Co.",
        },
        {
            "key": "log-invoice",
            "action": "Invoice generated",
            "details": "INV-001 generated from PO-001",
        },
    ]

    for log in data:
        document = {
            "seedKey": log["key"],
            "action": log["action"],
            "details": log["details"],
            "timestamp": now(),
        }
        upsert_document(logs, {"seedKey": log["key"]}, document, log["action"])


def seed():
    print("[*] Seeding VendorBridge database...")
    print(f"    Database: {DB_NAME}")
    print(f"    MongoDB:  connected to {DB_NAME}")
    print()

    user_ids = seed_users()
    print()

    vendor_ids = seed_vendors()
    print()

    rfq_ids = seed_rfqs(user_ids, vendor_ids)
    print()

    quotation_ids = seed_quotations(user_ids, vendor_ids, rfq_ids)
    print()

    po_ids = seed_purchase_orders(vendor_ids, rfq_ids, quotation_ids)
    print()

    seed_invoices(po_ids)
    print()

    seed_logs()

    print()
    print("=" * 58)
    print("[DONE] Seeding complete!")
    print()
    print("Demo credentials (all use password: password):")
    print("  Admin:   admin   or admin@vendorbridge.com")
    print("  Officer: officer or officer@vendorbridge.com")
    print("  Manager: manager or manager@vendorbridge.com")
    print("  Vendor:  vendor  or vendor@vendorbridge.com")
    print("=" * 58)


if __name__ == "__main__":
    seed()
