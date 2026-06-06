import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  CheckCircle2,
  XCircle,
  Clock,
  X,
  ShieldAlert,
  Truck,
  FileText,
  CalendarDays,
  MessageSquare,
  ArrowRight,
} from "lucide-react";

/**
 * VendorBridge — Approval Workflow (aligned with spec)
 *
 * Two-stage flow:
 *   Vendor Submission
 *   → Procurement Officer Review (Forward or Reject at first level)
 *   → Manager Approval/Rejection (with mandatory reason)
 *   → Final Procurement Decision
 *
 * Officer : sees "Pending" queue; can Forward to Manager or Reject (reason required).
 * Manager : sees "Forwarded" queue; can Approve (creates PO) or Reject (reason required).
 * Admin   : read-only monitoring across all tabs.
 * Vendor  : no access.
 */

const STATUS_STYLE = {
  Pending:   "bg-amber-50 text-amber-700",
  Forwarded: "bg-blue-50 text-blue-700",
  Approved:  "bg-emerald-50 text-emerald-700",
  Rejected:  "bg-rose-50 text-rose-700",
};

const SEED = [
  {
    id: "PR-2026-031", rfq: "RFQ-2026-014", title: "Cold-Rolled Steel Sheets", vendor: "Acme Industrial Co.",
    amount: 86500, delivery: "2026-06-15", submittedBy: "D. Cruz", submittedOn: "2026-06-05",
    status: "Pending", reason: "",
    timeline: [{ label: "Submitted by Vendor", on: "2026-06-04 08:00" }],
  },
  {
    id: "PR-2026-030", rfq: "RFQ-2026-016", title: "Industrial Bearings", vendor: "Vertex Materials",
    amount: 236500, delivery: "2026-06-24", submittedBy: "D. Cruz", submittedOn: "2026-06-05",
    status: "Forwarded", reason: "",
    timeline: [
      { label: "Submitted by Vendor", on: "2026-06-04 09:00" },
      { label: "Forwarded to Manager by D. Cruz (Officer)", on: "2026-06-05 09:40" },
    ],
  },
  {
    id: "PR-2026-028", rfq: "RFQ-2026-012", title: "Office Stationery Bulk", vendor: "PaperPlus Supplies",
    amount: 41200, delivery: "2026-06-02", submittedBy: "A. Roy", submittedOn: "2026-05-29",
    status: "Approved", reason: "Within budget, vendor reliable.",
    timeline: [
      { label: "Submitted by Vendor", on: "2026-05-28 10:00" },
      { label: "Forwarded to Manager by A. Roy (Officer)", on: "2026-05-29 14:02" },
      { label: "Approved by S. Iyer (Manager)", on: "2026-05-29 16:30" },
    ],
  },
  {
    id: "PR-2026-027", rfq: "RFQ-2026-010", title: "Forklift Spare Parts", vendor: "Forge Machinery",
    amount: 178000, delivery: "2026-06-09", submittedBy: "A. Roy", submittedOn: "2026-05-27",
    status: "Rejected", reason: "Quote 18% above last cycle — renegotiate.",
    timeline: [
      { label: "Submitted by Vendor", on: "2026-05-26 11:00" },
      { label: "Forwarded to Manager by A. Roy (Officer)", on: "2026-05-27 11:15" },
      { label: "Rejected by S. Iyer (Manager) — reason recorded", on: "2026-05-27 18:05" },
    ],
  },
];

const inr = (n) => "₹" + n.toLocaleString("en-IN");
const fmt = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export default function Approvals() {
  const { user } = useAuth?.() || {};
  const role = user?.role || "Manager";

  const isOfficer = role === "Procurement Officer";
  const isManager = role === "Manager";

  const [requests, setRequests] = useState(SEED);
  const [modal, setModal] = useState(null); // { request, action }
  const [recent, setRecent] = useState(null); // id of recently acted-on card

  const TABS = isOfficer
    ? ["Pending", "Forwarded", "Approved", "Rejected"]
    : isManager
    ? ["Forwarded", "Approved", "Rejected"]
    : ["Pending", "Forwarded", "Approved", "Rejected"];

  const defaultTab = isManager ? "Forwarded" : "Pending";
  const [tab, setTab] = useState(defaultTab);

  const filtered = useMemo(() => requests.filter((r) => r.status === tab), [requests, tab]);
  const counts = useMemo(
    () => TABS.reduce((acc, t) => ({ ...acc, [t]: requests.filter((r) => r.status === t).length }), {}),
    [requests, TABS]
  );

  if (role === "Vendor") return <AccessDenied />;

  const apply = (id, newStatus, reason) => {
    const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
    const actorLabel = isOfficer
      ? `${user?.name || "Officer"} (Officer)`
      : `${user?.name || "Manager"} (Manager)`;
    const actionLabel =
      newStatus === "Forwarded"
        ? `Forwarded to Manager by ${actorLabel}`
        : newStatus === "Approved"
        ? `Approved by ${actorLabel}`
        : `Rejected by ${actorLabel}${reason ? " — reason recorded" : ""}`;

    setRequests((rs) =>
      rs.map((r) =>
        r.id === id
          ? { ...r, status: newStatus, reason, timeline: [...r.timeline, { label: actionLabel, on: stamp }] }
          : r
      )
    );
    setModal(null);
    setTab(newStatus);
    setRecent(id);
    setTimeout(() => setRecent(null), 1600);
  };

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-6 p-6 lg:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Approval Workflow</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Procurement Approvals</h1>
        <p className="mt-1 text-sm text-slate-500">
          {isOfficer
            ? "Review vendor submissions. Forward valid quotations to the Manager or reject invalid ones with a reason."
            : isManager
            ? "Review forwarded quotations. Approve or reject — a reason must be provided and recorded."
            : "Monitor procurement approvals across the organization."}
        </p>
      </header>

      {/* Flow explanation banner */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        <span className="font-medium text-slate-700">Approval flow:</span>
        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5">Vendor Submission</span>
        <ArrowRight className="h-3.5 w-3.5" />
        <span className={`rounded-full border px-2 py-0.5 ${isOfficer ? "border-amber-200 bg-amber-50 font-semibold text-amber-700" : "border-slate-200 bg-white"}`}>
          Officer Review
        </span>
        <ArrowRight className="h-3.5 w-3.5" />
        <span className={`rounded-full border px-2 py-0.5 ${isManager ? "border-blue-200 bg-blue-50 font-semibold text-blue-700" : "border-slate-200 bg-white"}`}>
          Manager Decision
        </span>
        <ArrowRight className="h-3.5 w-3.5" />
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-700">
          Final Procurement Decision
        </span>
      </div>

      {/* Tabs */}
      <div
        className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1"
        role="tablist"
        aria-label="Filter by status"
      >
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              tab === t ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {t}
            <span className={`rounded-full px-1.5 text-xs ${tab === t ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>
              {counts[t] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {filtered.map((r) => (
          <article
            key={r.id}
            className={`rounded-2xl border bg-white p-5 shadow-sm transition duration-500 ${
              recent === r.id
                ? "border-emerald-400 ring-2 ring-emerald-400/40"
                : "border-slate-200 hover:shadow-md"
            }`}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"
                  aria-hidden="true"
                >
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-slate-400">{r.id} · {r.rfq}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[r.status]}`}>
                      {r.status}
                    </span>
                  </div>
                  <h2 className="text-base font-semibold text-slate-900">{r.title}</h2>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Truck className="h-3.5 w-3.5" aria-hidden="true" /> {r.vendor}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" /> Delivery {fmt(r.delivery)}
                    </span>
                    <span>by {r.submittedBy}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 lg:justify-end">
                <div className="text-right">
                  <p className="text-lg font-semibold text-slate-900">{inr(r.amount)}</p>
                  <p className="text-xs text-slate-400">Quoted total</p>
                </div>

                {/* Officer actions: Forward or Reject (Pending only) */}
                {isOfficer && r.status === "Pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setModal({ request: r, action: "Forward" })}
                      aria-label={`Forward ${r.id} to Manager`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      <ArrowRight className="h-4 w-4" /> Forward
                    </button>
                    <button
                      onClick={() => setModal({ request: r, action: "Reject" })}
                      aria-label={`Reject ${r.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3.5 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </button>
                  </div>
                )}

                {/* Manager actions: Approve or Reject (Forwarded only) */}
                {isManager && r.status === "Forwarded" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setModal({ request: r, action: "Approve" })}
                      aria-label={`Approve ${r.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Approve
                    </button>
                    <button
                      onClick={() => setModal({ request: r, action: "Reject" })}
                      aria-label={`Reject ${r.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3.5 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Reason + timeline */}
            {(r.reason || r.timeline.length > 1) && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                {r.reason && (
                  <div className="mb-3 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                    <span>
                      <span className="font-medium text-slate-700">Reason: </span>
                      {r.reason}
                    </span>
                  </div>
                )}
                <ol className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-400">
                  {r.timeline.map((t, i) => (
                    <li key={i} className="inline-flex items-center gap-1.5">
                      <Clock className="h-3 w-3" aria-hidden="true" /> {t.label} · {t.on}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </article>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
            <div
              className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-slate-400"
              aria-hidden="true"
            >
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-700">No {tab.toLowerCase()} requests</p>
            <p className="mt-1 text-sm text-slate-400">
              {tab === "Pending"
                ? "New vendor submissions will appear here for your review."
                : tab === "Forwarded"
                ? "Requests forwarded by Officers will appear here."
                : `Requests you ${tab.toLowerCase()} will be listed here.`}
            </p>
          </div>
        )}
      </div>

      {modal && (
        <ActionModal
          request={modal.request}
          action={modal.action}
          onClose={() => setModal(null)}
          onConfirm={(reason) => {
            const statusMap = { Forward: "Forwarded", Approve: "Approved", Reject: "Rejected" };
            apply(modal.request.id, statusMap[modal.action], reason);
          }}
        />
      )}
    </div>
  );
}

function ActionModal({ request, action, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  const [err, setErr] = useState(false);
  const taRef = useRef(null);

  const isForward = action === "Forward";
  const isApprove = action === "Approve";
  const isReject  = action === "Reject";

  const confirm = () => {
    if (reason.trim().length < 3) {
      setErr(true);
      taRef.current?.focus();
      return;
    }
    onConfirm(reason.trim());
  };

  const colors = isForward
    ? { icon: "bg-blue-50 text-blue-600", btn: "bg-blue-600 hover:bg-blue-700" }
    : isApprove
    ? { icon: "bg-emerald-50 text-emerald-600", btn: "bg-emerald-600 hover:bg-emerald-700" }
    : { icon: "bg-rose-50 text-rose-600", btn: "bg-rose-600 hover:bg-rose-700" };

  const Icon = isForward ? ArrowRight : isApprove ? CheckCircle2 : XCircle;

  const labels = {
    Forward: {
      title: "Forward to Manager",
      note: "Record your first-level review assessment before forwarding.",
      placeholder: "e.g. Vendor compliant, pricing within range — forwarding for Manager review.",
    },
    Approve: {
      title: "Approve quotation",
      note: "Manager decision — confirm this is financially and operationally viable.",
      placeholder: "e.g. Within budget and operationally sound.",
    },
    Reject: {
      title: "Reject quotation",
      note: "A reason must be provided and recorded in the system.",
      placeholder: "e.g. Pricing too high — vendor should renegotiate.",
    },
  };

  return (
    <Modal onClose={onClose} labelId="action-modal-title">
      <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
        <span
          className={`grid h-10 w-10 place-items-center rounded-xl ${colors.icon}`}
          aria-hidden="true"
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <h2 id="action-modal-title" className="text-base font-semibold text-slate-900">
            {labels[action].title}
          </h2>
          <p className="text-xs text-slate-500">{request.id} · {request.vendor}</p>
        </div>
        <button
          onClick={onClose}
          className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-6 py-5">
        <div className="mb-4 grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-sm">
          <div>
            <p className="text-xs text-slate-400">Amount</p>
            <p className="font-semibold text-slate-900">{inr(request.amount)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Delivery</p>
            <p className="font-medium text-slate-700">{fmt(request.delivery)}</p>
          </div>
        </div>

        <p className="mb-3 text-xs text-slate-500">{labels[action].note}</p>

        <label htmlFor="action-reason" className="mb-1.5 block text-sm font-medium text-slate-700">
          Reason / Remark <span className="text-rose-500">*</span>
        </label>
        <textarea
          id="action-reason"
          ref={taRef}
          rows={3}
          value={reason}
          onChange={(e) => { setReason(e.target.value); setErr(false); }}
          aria-invalid={err}
          placeholder={labels[action].placeholder}
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
        {err && (
          <p role="alert" className="mt-1 text-xs text-rose-600">
            A reason is required and must be recorded per policy.
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
        <button
          onClick={onClose}
          className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          onClick={confirm}
          className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white ${colors.btn}`}
        >
          Confirm {action}
        </button>
      </div>
    </Modal>
  );
}

function Modal({ children, onClose, labelId }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    const getFocusable = () =>
      Array.from(
        el?.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])') || []
      ).filter((n) => !n.disabled);

    getFocusable()[0]?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") return onClose();
      if (e.key !== "Tab") return;
      const f = getFocusable();
      if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelId}
    >
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />
      <div
        ref={ref}
        className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 overflow-hidden rounded-2xl bg-white shadow-2xl duration-200"
      >
        {children}
      </div>
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center p-8 text-center">
      <div
        className="grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-600"
        aria-hidden="true"
      >
        <ShieldAlert className="h-7 w-7" />
      </div>
      <h1 className="mt-5 text-lg font-semibold text-slate-900">Access restricted</h1>
      <p className="mt-2 text-sm text-slate-500">
        Procurement approvals are handled by Procurement Officers and Managers. Vendors do not have
        access to this workflow.
      </p>
    </div>
  );
}
