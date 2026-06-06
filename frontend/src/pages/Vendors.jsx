import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Search, Plus, Truck, Star, Pencil, ShieldAlert, X, Building2, MoreVertical,
  Ban, CheckCircle2, PauseCircle, AlertTriangle,
} from "lucide-react";

/**
 * VendorBridge — Vendor Management (Screen 4)
 * Admin: full CRUD + status control. Officer/Manager: read-only. Vendors: no access.
 */

const CATEGORIES = ["Raw Materials", "IT Services", "Logistics", "Office Supplies", "Machinery"];
const STATUSES = ["Active", "Onboarding", "Suspended", "Blacklisted"];
const STATUS_STYLE = {
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Onboarding: "bg-amber-50 text-amber-700 ring-amber-600/20",
  Suspended: "bg-slate-100 text-slate-600 ring-slate-500/20",
  Blacklisted: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

const SEED = [
  { id: "V-001", name: "Acme Industrial Co.", category: "Raw Materials", gst: "27AABCA1234F1Z5", contact: "Suresh Nair", email: "suresh@acme.io", phone: "+91 98200 11223", status: "Active", rating: 4.6 },
  { id: "V-002", name: "Vertex Materials", category: "Raw Materials", gst: "29AAFCV5678K1Z2", contact: "Lena Park", email: "lena@vertex.com", phone: "+91 99100 44556", status: "Active", rating: 4.8 },
  { id: "V-003", name: "TechSource Systems", category: "IT Services", gst: "07AAGCT9012L1Z9", contact: "Mohit Verma", email: "mohit@techsource.io", phone: "+91 98765 33221", status: "Active", rating: 4.2 },
  { id: "V-004", name: "LogiPro Freight", category: "Logistics", gst: "24AALCL3456M1Z7", contact: "Diego Alvarez", email: "diego@logipro.com", phone: "+91 90040 77889", status: "Onboarding", rating: 0 },
  { id: "V-005", name: "PaperPlus Supplies", category: "Office Supplies", gst: "33AAMCP7890N1Z4", contact: "Fatima Sheikh", email: "fatima@paperplus.in", phone: "+91 96540 12309", status: "Suspended", rating: 3.4 },
  { id: "V-006", name: "Forge Machinery Ltd.", category: "Machinery", gst: "19AANCF2345P1Z1", contact: "Ravi Iyer", email: "ravi@forge.co", phone: "+91 93210 65478", status: "Blacklisted", rating: 2.1 },
];

const EMPTY = { name: "", category: CATEGORIES[0], gst: "", contact: "", email: "", phone: "", status: "Onboarding" };
const iconBtn = "grid h-9 w-9 min-h-[40px] min-w-[40px] place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700";

export default function Vendors() {
  const { user } = useAuth?.() || {};
  const role = user?.role || "Procurement Officer";
  const canEdit = role === "Admin";

  const [vendors, setVendors] = useState(SEED);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [status, setStatus] = useState("All");
  const [modal, setModal] = useState(null);
  const [menuFor, setMenuFor] = useState(null);
  const [confirmBL, setConfirmBL] = useState(null);
  const menuRef = useRef(null);

  // Close the action menu on any outside click / touch.
  useEffect(() => {
    if (!menuFor) return;
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuFor(null); };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => { document.removeEventListener("mousedown", handler); document.removeEventListener("touchstart", handler); };
  }, [menuFor]);

  const filtered = useMemo(() => vendors.filter((v) => {
    const text = `${v.name} ${v.contact} ${v.gst} ${v.email}`.toLowerCase();
    return text.includes(q.toLowerCase()) && (cat === "All" || v.category === cat) && (status === "All" || v.status === status);
  }), [vendors, q, cat, status]);

  if (role === "Vendor") return <AccessDenied />;

  const saveVendor = (data) => {
    if (data.id) setVendors((vs) => vs.map((v) => (v.id === data.id ? { ...v, ...data } : v)));
    else {
      const id = `V-${String(vendors.length + 1).padStart(3, "0")}`;
      setVendors((vs) => [{ ...data, id, rating: 0 }, ...vs]);
    }
    setModal(null);
  };
  const setVendorStatus = (id, s) => { setVendors((vs) => vs.map((v) => (v.id === id ? { ...v, status: s } : v))); setMenuFor(null); setConfirmBL(null); };

  const hasFilters = q || cat !== "All" || status !== "All";

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 p-6 lg:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Vendor Directory</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Vendors</h1>
          <p className="mt-1 text-sm text-slate-500">{canEdit ? "Single source of truth for verified suppliers." : "Browse verified suppliers for RFQ assignment."}</p>
        </div>
        {canEdit && (
          <button onClick={() => setModal("new")} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700">
            <Plus className="h-4 w-4" /> Add Vendor
          </button>
        )}
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search vendors" placeholder="Search by name, GST, contact…" className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
        </div>
        <Select value={cat} onChange={setCat} options={["All", ...CATEGORIES]} label="Category" />
        <Select value={status} onChange={setStatus} options={["All", ...STATUSES]} label="Status" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">List of vendors with category, tax ID, contact, rating and status</caption>
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th scope="col" className="px-5 py-3">Vendor</th>
                <th scope="col" className="px-5 py-3">Category</th>
                <th scope="col" className="px-5 py-3">GST / Tax ID</th>
                <th scope="col" className="px-5 py-3">Contact</th>
                <th scope="col" className="px-5 py-3">Rating</th>
                <th scope="col" className="px-5 py-3">Status</th>
                {canEdit && <th scope="col" className="px-5 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((v) => (
                <tr key={v.id} className="transition hover:bg-slate-50/70">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700" aria-hidden="true"><Building2 className="h-4 w-4" /></div>
                      <div className="min-w-0"><p className="truncate font-medium text-slate-900">{v.name}</p><p className="text-xs text-slate-400">{v.id}</p></div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{v.category}</td>
                  <td className="px-5 py-4 font-mono text-xs text-slate-500">{v.gst}</td>
                  <td className="px-5 py-4"><p className="text-slate-700">{v.contact}</p><p className="text-xs text-slate-400">{v.email}</p></td>
                  <td className="px-5 py-4">{v.rating > 0 ? <span className="inline-flex items-center gap-1 text-slate-700"><Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" /> {v.rating.toFixed(1)}</span> : <span className="text-xs text-slate-400">No ratings</span>}</td>
                  <td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${STATUS_STYLE[v.status]}`}>{v.status}</span></td>
                  {canEdit && (
                    <td className="relative px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button onClick={() => setModal(v)} className={iconBtn} aria-label={`Edit ${v.name}`}><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => setMenuFor(menuFor === v.id ? null : v.id)} className={iconBtn} aria-label={`Change status for ${v.name}`} aria-haspopup="true" aria-expanded={menuFor === v.id}><MoreVertical className="h-4 w-4" /></button>
                      </div>
                      {menuFor === v.id && (
                        <div ref={menuRef} role="menu" className="absolute right-5 top-14 z-20 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                          <MenuItem icon={CheckCircle2} label="Mark Active" onClick={() => setVendorStatus(v.id, "Active")} />
                          <MenuItem icon={PauseCircle} label="Suspend" onClick={() => setVendorStatus(v.id, "Suspended")} />
                          <MenuItem icon={Ban} label="Blacklist" danger onClick={() => { setMenuFor(null); setConfirmBL(v); }} />
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={canEdit ? 7 : 6} className="px-5 py-16 text-center">
                    <div className="mx-auto max-w-sm">
                      <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-slate-400" aria-hidden="true"><Truck className="h-6 w-6" /></div>
                      <p className="mt-3 text-sm font-medium text-slate-700">{hasFilters ? "No vendors match your filters" : "No vendors yet"}</p>
                      <p className="mt-1 text-sm text-slate-400">{hasFilters ? "Try clearing search or filters." : canEdit ? "Add a vendor to get started." : "Vendors will appear here once added."}</p>
                      {hasFilters ? (
                        <button onClick={() => { setQ(""); setCat("All"); setStatus("All"); }} className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Clear filters</button>
                      ) : canEdit ? (
                        <button onClick={() => setModal("new")} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"><Plus className="h-4 w-4" /> Add vendor</button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-slate-400">{filtered.length} of {vendors.length} vendors</p>

      {modal && <VendorModal initial={modal === "new" ? EMPTY : modal} onClose={() => setModal(null)} onSave={saveVendor} />}
      {confirmBL && (
        <ConfirmDialog
          title="Blacklist vendor?"
          icon={AlertTriangle}
          body={<>This will block <span className="font-medium text-slate-900">{confirmBL.name}</span> from receiving new RFQs and purchase orders. You can reactivate them later.</>}
          confirmLabel="Blacklist"
          onCancel={() => setConfirmBL(null)}
          onConfirm={() => setVendorStatus(confirmBL.id, "Blacklisted")}
        />
      )}
    </div>
  );
}

function Select({ value, onChange, options, label }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={`Filter by ${label}`} className="appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-3 pr-9 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30">
        {options.map((o) => <option key={o} value={o}>{o === "All" ? `All ${label}s` : o}</option>)}
      </select>
      <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick, danger }) {
  return <button role="menuitem" onClick={onClick} className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm transition hover:bg-slate-50 ${danger ? "text-rose-600" : "text-slate-700"}`}><Icon className="h-4 w-4" aria-hidden="true" /> {label}</button>;
}

function VendorModal({ initial, onClose, onSave }) {
  const [f, setF] = useState(initial);
  const [err, setErr] = useState({});
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const submit = () => {
    const e = {};
    if (f.name.trim().length < 2) e.name = "Required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = "Valid email required";
    if (f.gst.trim().length < 4) e.gst = "Required";
    setErr(e);
    if (Object.keys(e).length === 0) onSave(f);
  };
  const input = "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30";

  return (
    <Modal onClose={onClose} labelId="vendor-modal-title" wide>
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <h2 id="vendor-modal-title" className="text-base font-semibold text-slate-900">{initial.id ? "Edit Vendor" : "Add Vendor"}</h2>
        <button onClick={onClose} className={iconBtn} aria-label="Close dialog"><X className="h-4 w-4" /></button>
      </div>
      <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2">
        <FormRow label="Company name" error={err.name} className="sm:col-span-2"><input className={input} value={f.name} onChange={set("name")} placeholder="Acme Industrial Co." aria-invalid={!!err.name} /></FormRow>
        <FormRow label="Category"><select className={input} value={f.category} onChange={set("category")}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></FormRow>
        <FormRow label="Status"><select className={input} value={f.status} onChange={set("status")}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></FormRow>
        <FormRow label="GST / Tax ID" error={err.gst}><input className={input} value={f.gst} onChange={set("gst")} placeholder="27AABCA1234F1Z5" aria-invalid={!!err.gst} /></FormRow>
        <FormRow label="Contact person"><input className={input} value={f.contact} onChange={set("contact")} placeholder="Full name" /></FormRow>
        <FormRow label="Email" error={err.email}><input className={input} value={f.email} onChange={set("email")} placeholder="contact@vendor.com" aria-invalid={!!err.email} /></FormRow>
        <FormRow label="Phone"><input className={input} value={f.phone} onChange={set("phone")} placeholder="+91 …" /></FormRow>
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
        <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
        <button onClick={submit} className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">{initial.id ? "Save changes" : "Add vendor"}</button>
      </div>
    </Modal>
  );
}

function FormRow({ label, error, className = "", children }) {
  return <div className={className}><label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>{children}{error && <p role="alert" className="mt-1 text-xs text-rose-600">{error}</p>}</div>;
}

function ConfirmDialog({ title, body, confirmLabel, onConfirm, onCancel, icon: Icon = AlertTriangle }) {
  return (
    <Modal onClose={onCancel} labelId="confirm-title">
      <div className="px-6 py-6">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600" aria-hidden="true"><Icon className="h-5 w-5" /></span>
          <div>
            <h2 id="confirm-title" className="text-base font-semibold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{body}</p>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
        <button onClick={onCancel} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
        <button onClick={onConfirm} className="rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700">{confirmLabel}</button>
      </div>
    </Modal>
  );
}

/* Accessible modal: role=dialog, Escape to close, focus trap, autofocus. */
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
      <div ref={ref} className={`relative z-10 w-full ${wide ? "max-w-2xl" : "max-w-md"} animate-in fade-in zoom-in-95 overflow-hidden rounded-2xl bg-white shadow-2xl duration-200`}>{children}</div>
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center p-8 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-600" aria-hidden="true"><ShieldAlert className="h-7 w-7" /></div>
      <h1 className="mt-5 text-lg font-semibold text-slate-900">Access restricted</h1>
      <p className="mt-2 text-sm text-slate-500">The vendor directory is available to Admin, Procurement Officers and Managers. Vendors can view their assigned RFQs and purchase orders instead.</p>
    </div>
  );
}
