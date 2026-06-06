from datetime import datetime, timezone

from bson import ObjectId
from flask import Blueprint, jsonify, request

from models.purchase_order import get_next_po_number, get_po_collection
from models.quotation import get_quotation_collection
from models.rfq import get_rfq_collection
from utils.rbac import require_roles

approvals_bp = Blueprint("approvals", __name__)


# ---------------------------------------------------------------------------
# Officer step: forward quotation to Manager OR reject at first level
# ---------------------------------------------------------------------------

@approvals_bp.route("/forward/<quotation_id>", strict_slashes=False, methods=["POST"])
@require_roles("officer")
def forward_quotation(quotation_id):
    """Procurement Officer performs first-level validation and forwards the
    quotation to the Manager for final approval/rejection.

    Per hei.txt approval flow:
        Vendor Submission → Procurement Officer Review → Manager Approval/Rejection
    """
    data = request.get_json() or {}
    reason = (data.get("reason") or "").strip()
    if not reason:
        return jsonify({"error": "A reason/remark is required when forwarding"}), 400

    quotations = get_quotation_collection()

    try:
        obj_id = ObjectId(quotation_id)
    except Exception:
        return jsonify({"error": "Invalid quotation ID"}), 400

    quotation = quotations.find_one({"_id": obj_id})
    if not quotation:
        return jsonify({"error": "Quotation not found"}), 404

    if quotation["status"] != "pending":
        return jsonify({"error": f"Quotation is already '{quotation['status']}' and cannot be forwarded"}), 400

    forwarded_by = request.user.get("userId", "unknown")
    quotations.update_one(
        {"_id": obj_id},
        {
            "$set": {
                "status": "forwarded",
                "forwardedBy": forwarded_by,
                "forwardedReason": reason,
                "forwardedAt": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )
    _log_activity(
        "Quotation forwarded to Manager by Officer",
        f"Quotation: {quotation_id}, Officer: {forwarded_by}, Reason: {reason}",
    )

    return jsonify({"message": "Quotation forwarded to Manager for approval"}), 200


@approvals_bp.route("/reject-officer/<quotation_id>", strict_slashes=False, methods=["POST"])
@require_roles("officer")
def officer_reject_quotation(quotation_id):
    """Procurement Officer rejects an invalid vendor submission at first-level review.
    A reason must be provided per hei.txt.
    """
    data = request.get_json() or {}
    reason = (data.get("reason") or "").strip()
    if not reason:
        return jsonify({"error": "A rejection reason is required"}), 400

    quotations = get_quotation_collection()

    try:
        obj_id = ObjectId(quotation_id)
    except Exception:
        return jsonify({"error": "Invalid quotation ID"}), 400

    quotation = quotations.find_one({"_id": obj_id})
    if not quotation:
        return jsonify({"error": "Quotation not found"}), 404

    if quotation["status"] != "pending":
        return jsonify({"error": f"Quotation is already '{quotation['status']}'"}), 400

    rejected_by = request.user.get("userId", "unknown")
    quotations.update_one(
        {"_id": obj_id},
        {
            "$set": {
                "status": "rejected",
                "rejection_reason": reason,
                "rejectedBy": rejected_by,
                "rejectedAt": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )
    _log_activity(
        "Quotation rejected by Procurement Officer",
        f"Quotation: {quotation_id}, Officer: {rejected_by}, Reason: {reason}",
    )

    return jsonify({"message": "Quotation rejected", "reason": reason}), 200


# ---------------------------------------------------------------------------
# Manager step: approve or reject a forwarded quotation
# ---------------------------------------------------------------------------

@approvals_bp.route("/approve/<quotation_id>", strict_slashes=False, methods=["POST"])
@require_roles("manager")
def approve_quotation(quotation_id):
    """Manager approves a quotation forwarded by the Procurement Officer,
    then auto-creates a Purchase Order.

    Per hei.txt: Manager evaluates financial and operational viability.
    Manager can only act on quotations already forwarded by an Officer.
    """
    data = request.get_json() or {}
    reason = (data.get("reason") or "").strip()
    if not reason:
        return jsonify({"error": "A reason/remark is required for the approval decision"}), 400

    quotations = get_quotation_collection()

    try:
        obj_id = ObjectId(quotation_id)
    except Exception:
        return jsonify({"error": "Invalid quotation ID"}), 400

    quotation = quotations.find_one({"_id": obj_id})
    if not quotation:
        return jsonify({"error": "Quotation not found"}), 404

    if quotation["status"] == "pending":
        return jsonify(
            {"error": "Quotation has not been reviewed and forwarded by a Procurement Officer yet"}
        ), 400

    if quotation["status"] != "forwarded":
        return jsonify({"error": f"Quotation is already '{quotation['status']}'"}), 400

    approved_by = request.user.get("userId", "unknown")
    quotations.update_one(
        {"_id": obj_id},
        {
            "$set": {
                "status": "accepted",
                "approvalReason": reason,
                "approvedBy": approved_by,
                "approvedAt": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )

    rfqs = get_rfq_collection()
    rfq = rfqs.find_one({"_id": ObjectId(quotation["rfqId"])})
    items = rfq["items"] if rfq else []

    po_collection = get_po_collection()
    po_number = get_next_po_number()

    po = {
        "rfqId": quotation["rfqId"],
        "quotationId": str(quotation["_id"]),
        "vendorId": quotation["vendorId"],
        "poNumber": po_number,
        "items": items,
        "totalAmount": quotation["price"],
        "status": "created",
        "created_at": datetime.now(timezone.utc),
    }

    po_result = po_collection.insert_one(po)

    if rfq:
        rfqs.update_one(
            {"_id": ObjectId(quotation["rfqId"])},
            {"$set": {"status": "awarded", "updated_at": datetime.now(timezone.utc)}},
        )

    _log_activity(
        "Quotation approved by Manager & PO created",
        f"Quotation: {quotation_id}, PO: {po_number}, Vendor: {quotation['vendorId']}, Manager: {approved_by}, Reason: {reason}",
    )

    return jsonify(
        {
            "message": "Quotation approved and Purchase Order created",
            "poId": str(po_result.inserted_id),
            "poNumber": po_number,
        }
    ), 201


@approvals_bp.route("/reject/<quotation_id>", strict_slashes=False, methods=["POST"])
@require_roles("manager")
def reject_quotation(quotation_id):
    """Manager rejects a quotation. A valid reason must be provided and recorded.

    Per hei.txt: 'If a request is rejected, a valid reason must be provided and
    recorded in the system.'
    """
    data = request.get_json() or {}
    reason = (data.get("reason") or "").strip()
    if not reason:
        return jsonify({"error": "A rejection reason is required and must be recorded in the system"}), 400

    quotations = get_quotation_collection()

    try:
        obj_id = ObjectId(quotation_id)
    except Exception:
        return jsonify({"error": "Invalid quotation ID"}), 400

    quotation = quotations.find_one({"_id": obj_id})
    if not quotation:
        return jsonify({"error": "Quotation not found"}), 404

    if quotation["status"] not in ("pending", "forwarded"):
        return jsonify({"error": f"Quotation is already '{quotation['status']}'"}), 400

    rejected_by = request.user.get("userId", "unknown")
    quotations.update_one(
        {"_id": obj_id},
        {
            "$set": {
                "status": "rejected",
                "rejection_reason": reason,
                "rejectedBy": rejected_by,
                "rejectedAt": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )

    _log_activity(
        "Quotation rejected by Manager",
        f"Quotation: {quotation_id}, Manager: {rejected_by}, Reason: {reason}",
    )
    return jsonify({"message": "Quotation rejected", "reason": reason}), 200


def _log_activity(action, details):
    from pymongo import MongoClient

    from config import DB_NAME, MONGO_URI

    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    db["logs"].insert_one(
        {
            "action": action,
            "details": details,
            "timestamp": datetime.now(timezone.utc),
        }
    )