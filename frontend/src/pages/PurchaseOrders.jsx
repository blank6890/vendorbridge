import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  PackageCheck, Plus, X, Printer, Truck, CheckCircle2, Search, FileText, MapPin, CircleDot, Circle,
} from "lucide-react";

/**
 * VendorBridge — Purchase Orders (Screen 9)
 * Officer: generate POs from approved requests (VB-YYYY-MM-NNNN), advance status, print.
 * Vendor: view own POs (read-only). Manager/Admin: view all.
 */

const STATUS_STYLE = { Draft: "bg-slate-100 text-slate-600", Issued: "bg-sky-50 text-sky-700", "In Transit": "bg-amber-50 text-amber-700", Delivered: "bg-emerald-50 text-emerald-700" };
const STATUS_FLOW = ["Draft", "Issued", "In Transit", "Delivered"];
const TAX_RATE = 0.18;
const inr = (n) => "₹" + Number(n).toLocaleString("en-IN");
const makeLines = (rows) => rows.map(([desc, qty, rate]) => ({ desc, qty, rate, amount: qty * rate }));

const SEED = [
  { id: "VB-2026-06-0001", rfq: "RFQ-2026-012", vendor: "PaperPlus Supplies", vendorEmail: "fatima@paperplus.in", date: "2026-06-02", status: "Delivered", lines: makeLines([["A4 copier paper 75gsm (ream)", 800, 320], ["Sticky notes pack", 120, 45]]) },
  { id: "VB-2026-06-0002", rfq: "RFQ-2026-014", vendor: "Acme Industrial Co.", vendorEmail: "suresh@acme.io", date: "2026-06-05", status: "Issued", lines: makeLines([["CR steel sheet 1.2mm (ton)", 12, 6800]]) },
  { id: "VB-2026-06-0003", rfq: "RFQ-2026-016", vendor: "Vertex Materials", vendorEmail: "lena@vertex.com", date: "2026-06-05", status: "In Transit", lines: makeLines([["Deep-groove bearing 6204 (pcs)", 500, 472]]) },
];

const APPROVED_PENDING = [
  { rfq: "RFQ-2026-011", vendor: "LogiPro Freight", vendorEmail: "diego@logipro.com", lines: makeLines([["Freight & handling (monthly)", 1, 112000]]) },
];

export default function PurchaseOrders() {
  const { user } = useAuth?.() || {};
  const role = user?.role || "Procurement Officer";
  const isOfficer = role === "Procurement Officer";
  const isVendor = role === "Vendor";

  const [pos, setPos] = useState(SEED);
  const [pending, setPending] = useState(APPROVED_PENDING);
  const [q, setQ] = useState("");
  const [view, setView] = useState(null);
  const [genOpen, setGenOpen] = useState(false);
  const myVendor = "Acme Industrial Co.";

  const visible = useMemo(() => {
    let list = isVendor ? pos.filter((p) => p.vendor === myVendor) : pos;
    if (q) list = list.filter((p) => `${p.id} ${p.vendor} ${p.rfq}`.toLowerCase().includes(q.toLowerCase()));
    return list;
  }, [pos, q, isVendor]);

  const nextPoNumber = () => `VB-${new Date().toISOString().slice(0, 7)}-${String(pos.length + 1).padStart(4, "0")}`;
  const generatePO = (req) => {
    setPos((p) => [{ id: nextPoNumber(), rfq: req.rfq, vendor: req.vendor, vendorEmail: req.vendorEmail, date: new Date().toISOString().slice(0, 10), status: "Draft", lines: req.lines }, ...p]);
    setPending((p) => p.filter((x) => x.rfq !== req.rfq));
    setGenOpen(false);
  };
  const advance = (id) => setPos((p) => p.map((po) => (po.id === id ? { ...po, status: STATUS_FLOW[Math.min(STATUS_FLOW.indexOf(po.status) + 1, STATUS_FLOW.length - 1)] } : po)));

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 p-6 lg:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Purchase Orders</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{isVendor ? "My Purchase Orders" : "Purchase Orders"}</h1>
          <p className="mt-1 text-sm text-slate-500">{isOfficer ? "Generate POs from approved requests and track fulfillment." : isVendor ? "Orders issued to you. Track their delivery status." : "Monitor all issued purchase orders."}</p>
        </div>
        {isOfficer && (
          <button onClick={() => setGenOpen(true)} disabled={pending.length === 0} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
            <Plus className="h-4 w-4" /> Generate PO{pending.length > 0 && <span className="ml-1 rounded-full bg-white/20 px-1.5 text-xs">{pending.length}</span>}
          </button>
        )}
      </header>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search purchase orders" placeholder="Search PO number, vendor…" className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((po) => {
          const total = po.lines.reduce((s, l) => s + l.amount, 0) * (1 + TAX_RATE);
          const stepIndex = STATUS_FLOW.indexOf(po.status);
          return (
            <article key={po.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700" aria-hidden="true"><PackageCheck className="h-5 w-5" /></div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[po.status]}`}>{po.status}</span>
              </div>
              <p className="mt-4 font-mono text-xs text-slate-400">{po.id}</p>
              <h2 className="text-base font-semibold text-slate-900">{po.vendor}</h2>
              <p className="mt-0.5 text-sm text-slate-500">{po.rfq} · {fmt(po.date)}</p>

              <div className="mt-4 flex items-center justify-between" role="img" aria-label={`Status: ${po.status} (step ${stepIndex + 1} of ${STATUS_FLOW.length})`}>
                {STATUS_FLOW.map((s, i) => {
                  const done = stepIndex > i, current = stepIndex === i;
                  const Icon = done ? CheckCircle2 : current ? CircleDot : Circle;
                  return (
                    <div key={s} className="flex flex-1 items-center">
                      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${done || current ? "text-emerald-500" : "text-slate-300"}`}><Icon className="h-4 w-4" /></span>
                      {i < STATUS_FLOW.length - 1 && <span className={`h-0.5 flex-1 ${stepIndex > i ? "bg-emerald-500" : "bg-slate-200"}`} />}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-4">
                <div><p className="text-xs text-slate-400">Total (incl. 18% tax)</p><p className="text-lg font-semibold text-slate-900">{inr(total)}</p></div>
                <button onClick={() => setView(po)} className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800" aria-label={`View ${po.id}`}><FileText className="h-4 w-4" /> View</button>
              </div>

              {isOfficer && po.status !== "Delivered" && (
                <button onClick={() => advance(po.id)} className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"><Truck className="h-4 w-4" /> Advance to {STATUS_FLOW[stepIndex + 1]}</button>
              )}
            </article>
          );
        })}
        {visible.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-emerald-600" aria-hidden="true"><PackageCheck className="h-6 w-6" /></div>
            <p className="mt-3 text-sm font-medium text-slate-700">{q ? "No purchase orders match your search" : "No purchase orders yet"}</p>
            <p className="mt-1 text-sm text-slate-400">{isOfficer ? "Generate a PO from an approved procurement request to get started." : "Purchase orders will appear here once issued."}</p>
            {isOfficer && !q && pending.length > 0 && <button onClick={() => setGenOpen(true)} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"><Plus className="h-4 w-4" /> Generate PO</button>}
          </div>
        )}
      </div>

      {view && <PoDetail po={view} onClose={() => setView(null)} />}
      {genOpen && <GenerateModal pending={pending} onClose={() => setGenOpen(false)} onGenerate={generatePO} />}
    </div>
  );
}

function PoDetail({ po, onClose }) {
  const sub = po.lines.reduce((s, l) => s + l.amount, 0);
  const tax = sub * TAX_RATE;
  return (
    <Modal onClose={onClose} labelId="po-title" wide>
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 print:hidden">
        <h2 id="po-title" className="text-base font-semibold text-slate-900">Purchase Order</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" aria-label="Print purchase order"><Printer className="h-4 w-4" /> Print</button>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Close dialog"><X className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
        <div className="flex items-start justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">VendorBridge</p><p className="mt-1 text-lg font-semibold text-slate-900">Purchase Order</p><p className="font-mono text-sm text-slate-500">{po.id}</p></div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[po.status]}`}>{po.status}</span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
          <div className="rounded-lg bg-slate-50 p-3"><p className="mb-1 text-xs font-medium text-slate-400">Vendor</p><p className="font-medium text-slate-900">{po.vendor}</p><p className="text-xs text-slate-500">{po.vendorEmail}</p></div>
          <div className="rounded-lg bg-slate-50 p-3"><p className="mb-1 text-xs font-medium text-slate-400">Details</p><p className="text-slate-700">Ref: {po.rfq}</p><p className="inline-flex items-center gap-1 text-slate-700"><MapPin className="h-3.5 w-3.5" aria-hidden="true" /> Issued {fmt(po.date)}</p></div>
        </div>
        <table className="mt-5 w-full text-left text-sm">
          <thead><tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500"><th className="py-2">Description</th><th className="py-2 text-right">Qty</th><th className="py-2 text-right">Rate</th><th className="py-2 text-right">Amount</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{po.lines.map((l, i) => <tr key={i}><td className="py-2.5 text-slate-700">{l.desc}</td><td className="py-2.5 text-right text-slate-600">{l.qty}</td><td className="py-2.5 text-right text-slate-600">{inr(l.rate)}</td><td className="py-2.5 text-right font-medium text-slate-900">{inr(l.amount)}</td></tr>)}</tbody>
        </table>
        <div className="mt-4 ml-auto w-full max-w-xs space-y-1.5 text-sm">
          <Row label="Subtotal" value={inr(sub)} /><Row label="Tax (18%)" value={inr(tax)} />
          <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900"><span>Total</span><span>{inr(sub + tax)}</span></div>
        </div>
      </div>
    </Modal>
  );
}

function GenerateModal({ pending, onClose, onGenerate }) {
  return (
    <Modal onClose={onClose} labelId="gen-po-title">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div><h2 id="gen-po-title" className="text-base font-semibold text-slate-900">Generate Purchase Order</h2><p className="text-xs text-slate-500">Approved requests ready to convert into a PO.</p></div>
        <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Close dialog"><X className="h-4 w-4" /></button>
      </div>
      <div className="space-y-2 px-6 py-5">
        {pending.length === 0 && <p className="py-6 text-center text-sm text-slate-400">No approved requests pending PO generation.</p>}
        {pending.map((r) => {
          const total = r.lines.reduce((s, l) => s + l.amount, 0) * (1 + TAX_RATE);
          return (
            <div key={r.rfq} className="flex items-center justify-between rounded-lg border border-slate-200 p-3.5">
              <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-700" aria-hidden="true"><CheckCircle2 className="h-4 w-4" /></span><div><p className="text-sm font-medium text-slate-900">{r.vendor}</p><p className="text-xs text-slate-500">{r.rfq} · {inr(total)}</p></div></div>
              <button onClick={() => onGenerate(r)} className="rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-emerald-700" aria-label={`Generate PO for ${r.vendor}`}>Generate</button>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

function Row({ label, value }) { return <div className="flex items-center justify-between text-slate-500"><span>{label}</span><span className="text-slate-700">{value}</span></div>; }

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
      <div ref={ref} className={`relative z-10 w-full ${wide ? "max-w-2xl" : "max-w-lg"} animate-in fade-in zoom-in-95 overflow-hidden rounded-2xl bg-white shadow-2xl duration-200`}>{children}</div>
    </div>
  );
}

const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
