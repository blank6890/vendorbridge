from db import get_db


def get_quotation_collection():
    """Return the quotations collection.

    Schema:
    {
        rfqId: str,              # RFQ ObjectId string
        vendorId: str,           # vendor ObjectId string
        price: float,
        deliveryDays: int,
        notes: str,
        status: str,             # "pending" | "forwarded" | "accepted" | "rejected"
                                 # "pending"   = submitted by vendor, awaiting Officer review
                                 # "forwarded" = Officer passed to Manager for final decision
                                 # "accepted"  = Manager approved; PO auto-created
                                 # "rejected"  = rejected by Officer or Manager
        forwardedBy: str,        # userId of the Officer who forwarded
        forwardedReason: str,    # Officer's first-level review remark
        forwardedAt: datetime,
        approvedBy: str,         # userId of the Manager who approved
        approvalReason: str,     # Manager's approval remark (required)
        approvedAt: datetime,
        rejectedBy: str,         # userId who rejected
        rejection_reason: str,   # mandatory when status == "rejected"
        rejectedAt: datetime,
        created_at: datetime
    }
    """
    return get_db()["quotations"]