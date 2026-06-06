import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Plus, FileText, CalendarDays, Paperclip, Trash2, X, Users, Clock, ChevronRight, Search, ArrowRight,
} from "lucide-react";

/**
 * VendorBridge — RFQ Creation & Tracking (Screen 5)
 * Officer: create RFQs (line items, attachments, vendor assignment).
 * Vendor: sees only RFQs assigned to them. Manager/Admin: read-only.
 */

const VENDOR_POOL = [
  { id: "V-001", name: "Acme Industrial Co.", category: "Raw Materials" },
  { id: "V-002", name: "Vertex Materials", category: "Raw Materials" },
  { id: "V-003", name: "TechSource Systems", category: "IT Services" },
  { id: "V-004", name: "LogiPro Freight", category: "Logistics" },
  { id: "V-005", name: "PaperPlus Supplies", category: "Office Supplies" },
];

const STATUS_STYLE = { Open: "bg-emerald-50 text-emerald-700", Closing: "bg-amber-50 text-amber-700", Closed: "bg-slate-100 text-slate-600", Awarded: "bg-sky-50 text-sky-700" };

const SEED = [
  { id: "RFQ-2026-016", title: "Industrial Bearings Procurement", status: "Open", deadline: "2026-06-08", quotes: 3, attachments: 2, vendors: ["V-001", "V-002"], items: [{ product: "Deep-groove ball bearing 6204", qty: 500, unit: "pcs", spec: "ABEC-5, sealed" }] },
  { id: "RFQ-2026-015", title: "Network Switch Refresh", status: "Open", deadline: "2026-06-11", quotes: 2, attachments: 1, vendors: ["V-003"], items: [{ product: "48-port managed switch", qty: 24, unit: "pcs", spec: "L3, 10G uplink" }] },
  { id: "RFQ-2026-014", title: "Cold-Rolled Steel Sheets", status: "Closing", deadline: "2026-06-06", quotes: 4, attachments: 3, vendors: ["V-001", "V-002"], items: [{ product: "CR steel sheet 1.2mm", qty: 12, unit: "tons", spec: "IS 513 CR2" }] },
  { id: "RFQ-2026-012", title: "Office Stationery Bulk", status: "Awarded", deadline: "2026-05-28", quotes: 5, attachments: 0, vendors: ["V-005"], items: [{ product: "A4 copier paper 75gsm", qty: 800, unit: "reams", spec: "Brightness >= 92" }] },
];

const blankItem = () => ({ product: "", qty: 1, unit: "pcs", spec: "" });

export default function RFQ() {
  const { user } = useAuth?.() || {};
  const role = user?.role || "Procurement Officer";
  const isOfficer = role === "Procurement Officer";
  const isVendor = role === "Vendor";
  const navigate = useNavigate();

  const [rfqs, setRfqs] = useState(SEED);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const myVendorId = "V-001";

  const visible = useMemo(() => {
    let list = isVendor ? rfqs.filter((r) => r.vendors.includes(myVendorId)) : rfqs;
    if (q) list = list.filter((r) => `${r.id} ${r.title}`.toLowerCase().includes(q.toLowerCase()));
    return list;
  }, [rfqs, q, isVendor]);

  const addRfq = (data) => {
    const num = String(rfqs.length + 13).padStart(3, "0");
    setRfqs((r) => [{ id: `RFQ-2026-0${num.slice(-2)}`, status: "Open", quotes: 0, ...data }, ...r]);
    setOpen(false);
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 p-6 lg:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Request for Quotation</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{isVendor ? "RFQs Assigned to You" : "RFQs"}</h1>
          <p className="mt-1 text-sm text-slate-500">{isOfficer ? "Create and broadcast structured requests to vendors." : isVendor ? "Respond before the deadline to stay in the bidding." : "Monitor all open and closed procurement requests."}</p>
        </div>
        {isOfficer && <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"><Plus className="h-4 w-4" /> Create RFQ</button>}
      </header>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search RFQs" placeholder="Search RFQs…" className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((r) => <RfqCard key={r.id} rfq={r} role={role} onAction={() => navigate("/quotations")} />)}
        {visible.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-emerald-600" aria-hidden="true"><FileText className="h-6 w-6" /></div>
            <p className="mt-3 text-sm font-medium text-slate-700">{q ? "No RFQs match your search" : isVendor ? "No RFQs assigned yet" : "No RFQs yet"}</p>
            <p className="mt-1 text-sm text-slate-400">{isOfficer ? "Broadcast your requirements to vendors to start receiving quotes." : isVendor ? "Assigned RFQs from procurement will appear here." : "RFQs created by officers will appear here."}</p>
            {isOfficer && !q && <button onClick={() => setOpen(true)} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"><Plus className="h-4 w-4" /> Create your first RFQ</button>}
          </div>
        )}
      </div>

      {open && <CreateRfqModal onClose={() => setOpen(false)} onSave={addRfq} />}
    </div>
  );
}

function RfqCard({ rfq, role, onAction }) {
  const isVendor = role === "Vendor";
  const days = daysUntil(rfq.deadline);
  return (
    <article className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700" aria-hidden="true"><FileText className="h-5 w-5" /></div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[rfq.status]}`}>{rfq.status}</span>
      </div>
      <p className="mt-4 text-xs font-medium text-slate-400">{rfq.id}</p>
      <h2 className="mt-0.5 text-base font-semibold text-slate-900">{rfq.title}</h2>
      <p className="mt-1 line-clamp-1 text-sm text-slate-500">{rfq.items[0]?.product} · {rfq.items[0]?.qty} {rfq.items[0]?.unit}</p>
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center">
        <Meta icon={CalendarDays} value={fmtDate(rfq.deadline)} label="Deadline" />
        <Meta icon={Users} value={rfq.vendors.length} label="Vendors" />
        <Meta icon={Paperclip} value={isVendor ? rfq.attachments : rfq.quotes} label={isVendor ? "Files" : "Quotes"} />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${days <= 1 ? "text-rose-600" : days <= 3 ? "text-amber-600" : "text-slate-400"}`}><Clock className="h-3.5 w-3.5" aria-hidden="true" />{days < 0 ? "Closed" : days === 0 ? "Closes today" : `${days} day${days > 1 ? "s" : ""} left`}</span>
        {isVendor ? (
          <button onClick={onAction} className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800" aria-label={`Submit quote for ${rfq.id}`}>Submit quote <ArrowRight className="h-3.5 w-3.5" /></button>
        ) : (
          <button onClick={onAction} className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900" aria-label={`View ${rfq.id}`}>View <ChevronRight className="h-4 w-4" /></button>
        )}
      </div>
    </article>
  );
}

function Meta({ icon: Icon, value, label }) {
  return <div><Icon className="mx-auto h-4 w-4 text-slate-400" aria-hidden="true" /><p className="mt-1 text-sm font-semibold text-slate-900">{value}</p><p className="text-[11px] text-slate-400">{label}</p></div>;
}

function CreateRfqModal({ onClose, onSave }) {
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [items, setItems] = useState([blankItem()]);
  const [vendors, setVendors] = useState([]);
  const [files, setFiles] = useState([]);
  const [err, setErr] = useState({});

  const setItem = (i, k, val) => setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, [k]: val } : it)));
  const addItem = () => setItems((a) => [...a, blankItem()]);
  const removeItem = (i) => setItems((a) => (a.length > 1 ? a.filter((_, idx) => idx !== i) : a));
  const toggleVendor = (id) => setVendors((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));

  const submit = () => {
    const e = {};
    if (title.trim().length < 3) e.title = "Enter an RFQ title";
    if (!deadline) e.deadline = "Pick a deadline";
    if (!items.some((it) => it.product.trim())) e.items = "Add at least one item";
    if (vendors.length === 0) e.vendors = "Assign at least one vendor";
    setErr(e);
    if (Object.keys(e).length) return;
    onSave({ title, deadline, items: items.filter((it) => it.product.trim()), vendors, attachments: files.length });
  };

  const input = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30";

  return (
    <Modal onClose={onClose} labelId="rfq-modal-title" wide>
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <h2 id="rfq-modal-title" className="text-base font-semibold text-slate-900">Create RFQ</h2>
        <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Close dialog"><X className="h-4 w-4" /></button>
      </div>

      <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label htmlFor="rfq-title" className="mb-1.5 block text-sm font-medium text-slate-700">RFQ title</label>
            <input id="rfq-title" className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Industrial Bearings Procurement" aria-invalid={!!err.title} />
            {err.title && <p role="alert" className="mt-1 text-xs text-rose-600">{err.title}</p>}
          </div>
          <div>
            <label htmlFor="rfq-deadline" className="mb-1.5 block text-sm font-medium text-slate-700">Deadline</label>
            <input id="rfq-deadline" type="date" className={input} value={deadline} onChange={(e) => setDeadline(e.target.value)} aria-invalid={!!err.deadline} />
            {err.deadline && <p role="alert" className="mt-1 text-xs text-rose-600">{err.deadline}</p>}
          </div>
        </div>

        <fieldset>
          <div className="mb-2 flex items-center justify-between">
            <legend className="text-sm font-medium text-slate-700">Items &amp; specifications</legend>
            <button type="button" onClick={addItem} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"><Plus className="h-3.5 w-3.5" /> Add item</button>
          </div>
          {/* column labels for clarity + a11y */}
          <div className="mb-1 hidden grid-cols-12 gap-2 px-2 text-[11px] font-medium uppercase tracking-wide text-slate-400 sm:grid">
            <span className="col-span-4">Product / service</span><span className="col-span-2">Qty</span><span className="col-span-2">Unit</span><span className="col-span-3">Spec / grade</span><span className="col-span-1" />
          </div>
          <div className="space-y-2">
            {items.map((it, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 rounded-lg border border-slate-200 p-2">
                <input className={`${input} col-span-12 sm:col-span-4`} placeholder="Product / service" aria-label={`Item ${i + 1} product`} value={it.product} onChange={(e) => setItem(i, "product", e.target.value)} />
                <input type="number" min="1" step="1" className={`${input} col-span-4 sm:col-span-2`} placeholder="Qty" aria-label={`Item ${i + 1} quantity`} value={it.qty} onChange={(e) => setItem(i, "qty", e.target.value)} />
                <select className={`${input} col-span-4 sm:col-span-2`} aria-label={`Item ${i + 1} unit`} value={it.unit} onChange={(e) => setItem(i, "unit", e.target.value)}>{["pcs", "units", "tons", "kg", "reams", "boxes", "hrs"].map((u) => <option key={u}>{u}</option>)}</select>
                <input className={`${input} col-span-3 sm:col-span-3`} placeholder="Spec / grade" aria-label={`Item ${i + 1} specification`} value={it.spec} onChange={(e) => setItem(i, "spec", e.target.value)} />
                <button type="button" onClick={() => removeItem(i)} className="col-span-1 grid min-h-[40px] place-items-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label={`Remove item ${i + 1}`}><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
          {err.items && <p role="alert" className="mt-1 text-xs text-rose-600">{err.items}</p>}
        </fieldset>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Attachments (blueprints / specs)</label>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500 hover:border-emerald-400 hover:bg-emerald-50/40">
            <Paperclip className="h-4 w-4" />{files.length ? `${files.length} file(s) selected` : "Click to upload files"}
            <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx" className="sr-only" aria-label="Upload attachments" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
          </label>
          <p className="mt-1 text-xs text-slate-400">Accepted: PDF, PNG, JPG, DOCX, XLSX</p>
        </div>

        <fieldset>
          <legend className="mb-2 block text-sm font-medium text-slate-700">Assign vendors</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {VENDOR_POOL.map((v) => {
              const active = vendors.includes(v.id);
              return (
                <button type="button" key={v.id} onClick={() => toggleVendor(v.id)} aria-pressed={active} className={`flex items-center justify-between rounded-lg border px-3.5 py-2.5 text-left text-sm transition ${active ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-slate-300"}`}>
                  <span><span className="block font-medium text-slate-900">{v.name}</span><span className="block text-xs text-slate-400">{v.category}</span></span>
                  <span className={`grid h-5 w-5 place-items-center rounded-md border ${active ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300"}`} aria-hidden="true">{active && <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.5L5 9l4.5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>}</span>
                </button>
              );
            })}
          </div>
          {err.vendors && <p role="alert" className="mt-1 text-xs text-rose-600">{err.vendors}</p>}
        </fieldset>
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
        <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
        <button onClick={submit} className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">Broadcast RFQ</button>
      </div>
    </Modal>
  );
}

function Modal({ children, onClose, labelId, wide }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    const getF = () => Array.from(el?.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])') || []).filter((n) => !n.disabled);
    getF()[0]?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") return onClose();
      if (e.key !== "Tab") return;
      const f = getF(); if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby={labelId}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <div ref={ref} className={`relative z-10 w-full ${wide ? "max-w-3xl" : "max-w-lg"} animate-in fade-in zoom-in-95 overflow-hidden rounded-2xl bg-white shadow-2xl duration-200`}>{children}</div>
    </div>
  );
}

function daysUntil(d) { return Math.ceil((new Date(d).setHours(23, 59, 59) - Date.now()) / 86400000); }
function fmtDate(d) { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }); }
