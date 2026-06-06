import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  ReceiptText, Plus, X, Printer, Mail, Download, Search, CheckCircle2, Clock, Send, BadgeCheck,
} from "lucide-react";

/**
 * VendorBridge — Invoices (Screen 9)
 * Officer: generate invoices from POs, print/download (browser PDF), email, mark paid.
 * Vendor: view invoice status (read-only). Manager/Admin: view all.
 *
 * PDF: print-optimized layout + window.print() (browser "Save as PDF") — no extra dependency.
 * To use jsPDF, wire it in components/InvoicePDF.jsx instead.
 */

const STATUS_STYLE = { Draft: "bg-slate-100 text-slate-600", Sent: "bg-sky-50 text-sky-700", "Awaiting Payment": "bg-amber-50 text-amber-700", Paid: "bg-emerald-50 text-emerald-700" };
const TAX_RATE = 0.18;
const inr = (n) => "₹" + Number(n).toLocaleString("en-IN");
const lines = (rows) => rows.map(([desc, qty, rate]) => ({ desc, qty, rate, amount: qty * rate }));

const SEED = [
  { id: "INV-2026-031", po: "VB-2026-06-0001", vendor: "PaperPlus Supplies", email: "fatima@paperplus.in", date: "2026-06-03", due: "2026-06-18", status: "Paid", items: lines([["A4 copier paper 75gsm", 800, 320], ["Sticky notes pack", 120, 45]]) },
  { id: "INV-2026-032", po: "VB-2026-06-0002", vendor: "Acme Industrial Co.", email: "suresh@acme.io", date: "2026-06-05", due: "2026-06-20", status: "Awaiting Payment", items: lines([["CR steel sheet 1.2mm", 12, 6800]]) },
];

const PO_READY = [{ po: "VB-2026-06-0003", vendor: "Vertex Materials", email: "lena@vertex.com", items: lines([["Deep-groove bearing 6204", 500, 472]]) }];

export default function Invoices() {
  const { user } = useAuth?.() || {};
  const role = user?.role || "Procurement Officer";
  const isOfficer = role === "Procurement Officer";
  const isVendor = role === "Vendor";

  const [invoices, setInvoices] = useState(SEED);
  const [ready, setReady] = useState(PO_READY);
  const [q, setQ] = useState("");
  const [view, setView] = useState(null);
  const [emailFor, setEmailFor] = useState(null);
  const [genOpen, setGenOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const myVendor = "Acme Industrial Co.";

  const visible = useMemo(() => {
    let list = isVendor ? invoices.filter((i) => i.vendor === myVendor) : invoices;
    if (q) list = list.filter((i) => `${i.id} ${i.vendor} ${i.po}`.toLowerCase().includes(q.toLowerCase()));
    return list;
  }, [invoices, q, isVendor]);

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500); };
  const generate = (po) => {
    const seq = String(invoices.length + 33).padStart(3, "0");
    setInvoices((inv) => [{ id: `INV-2026-${seq}`, po: po.po, vendor: po.vendor, email: po.email, date: new Date().toISOString().slice(0, 10), due: addDays(15), status: "Draft", items: po.items }, ...inv]);
    setReady((r) => r.filter((x) => x.po !== po.po));
    setGenOpen(false);
    flash("Invoice generated as Draft.");
  };
  const sendEmail = (inv) => { setInvoices((list) => list.map((i) => (i.id === inv.id ? { ...i, status: i.status === "Paid" ? "Paid" : "Awaiting Payment" } : i))); setEmailFor(null); flash(`Invoice ${inv.id} emailed to ${inv.vendor}.`); };
  const markPaid = (inv) => { setInvoices((list) => list.map((i) => (i.id === inv.id ? { ...i, status: "Paid" } : i))); flash(`Invoice ${inv.id} marked as Paid.`); };

  const hasFilters = !!q;

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 p-6 lg:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Billing</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{isVendor ? "My Invoices" : "Invoices"}</h1>
          <p className="mt-1 text-sm text-slate-500">{isOfficer ? "Generate invoices from purchase orders, send and track payment." : isVendor ? "Invoice status for your orders." : "Monitor all invoices and payment status."}</p>
        </div>
        {isOfficer && (
          <button onClick={() => setGenOpen(true)} disabled={ready.length === 0} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
            <Plus className="h-4 w-4" /> Generate Invoice{ready.length > 0 && <span className="ml-1 rounded-full bg-white/20 px-1.5 text-xs">{ready.length}</span>}
          </button>
        )}
      </header>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search invoices" placeholder="Search invoices…" className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Invoices with vendor, dates, total and status</caption>
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th scope="col" className="px-5 py-3">Invoice</th><th scope="col" className="px-5 py-3">Vendor</th><th scope="col" className="px-5 py-3">Issued / Due</th><th scope="col" className="px-5 py-3 text-right">Total</th><th scope="col" className="px-5 py-3">Status</th><th scope="col" className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((inv) => {
                const total = inv.items.reduce((s, l) => s + l.amount, 0) * (1 + TAX_RATE);
                return (
                  <tr key={inv.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-4"><p className="font-mono text-sm font-medium text-slate-900">{inv.id}</p><p className="text-xs text-slate-400">{inv.po}</p></td>
                    <td className="px-5 py-4 text-slate-700">{inv.vendor}</td>
                    <td className="px-5 py-4 text-xs text-slate-500">{fmt(inv.date)}<br /><span className="text-slate-400">due {fmt(inv.due)}</span></td>
                    <td className="px-5 py-4 text-right font-semibold text-slate-900">{inr(total)}</td>
                    <td className="px-5 py-4"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[inv.status]}`}>{inv.status === "Paid" ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : <Clock className="h-3.5 w-3.5" aria-hidden="true" />}{inv.status}</span></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {isOfficer && inv.status === "Awaiting Payment" && (
                          <button onClick={() => markPaid(inv)} className="mr-1 inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50" aria-label={`Mark ${inv.id} as paid`}><BadgeCheck className="h-3.5 w-3.5" /> Mark paid</button>
                        )}
                        <button onClick={() => setView(inv)} className="grid h-9 w-9 min-h-[40px] min-w-[40px] place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={`View or download ${inv.id}`}><Download className="h-4 w-4" /></button>
                        {isOfficer && <button onClick={() => setEmailFor(inv)} className="grid h-9 w-9 min-h-[40px] min-w-[40px] place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={`Email ${inv.id}`}><Mail className="h-4 w-4" /></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {visible.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-16 text-center">
                  <div className="mx-auto max-w-sm"><div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-emerald-600" aria-hidden="true"><ReceiptText className="h-6 w-6" /></div>
                  <p className="mt-3 text-sm font-medium text-slate-700">{hasFilters ? "No invoices match your search" : "No invoices yet"}</p>
                  <p className="mt-1 text-sm text-slate-400">{isOfficer ? "Generate an invoice from a purchase order to get started." : "Invoices will appear here once issued."}</p></div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {view && <InvoiceView inv={view} onClose={() => setView(null)} />}
      {emailFor && <EmailModal inv={emailFor} onClose={() => setEmailFor(null)} onSend={() => sendEmail(emailFor)} />}
      {genOpen && <GenerateModal ready={ready} onClose={() => setGenOpen(false)} onGenerate={generate} />}
      <Toast>{toast}</Toast>
    </div>
  );
}

function InvoiceView({ inv, onClose }) {
  const sub = inv.items.reduce((s, l) => s + l.amount, 0);
  const tax = sub * TAX_RATE;
  return (
    <Modal onClose={onClose} labelId="inv-title" wide>
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 print:hidden">
        <h2 id="inv-title" className="text-base font-semibold text-slate-900">Invoice {inv.id}</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700" aria-label="Download or print invoice"><Printer className="h-4 w-4" /> Download / Print</button>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Close dialog"><X className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="max-h-[70vh] overflow-y-auto px-8 py-6">
        <div className="flex items-start justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">VendorBridge</p><p className="mt-1 text-xl font-semibold text-slate-900">Invoice</p></div>
          <div className="text-right text-sm"><p className="font-mono font-medium text-slate-900">{inv.id}</p><p className="text-slate-500">Issued {fmt(inv.date)}</p><p className="text-slate-500">Due {fmt(inv.due)}</p></div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
          <div><p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Billed to</p><p className="font-medium text-slate-900">{inv.vendor}</p><p className="text-slate-500">{inv.email}</p></div>
          <div className="text-right"><p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Reference</p><p className="text-slate-700">PO {inv.po}</p></div>
        </div>
        <table className="mt-6 w-full text-left text-sm">
          <thead><tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500"><th className="py-2">Description</th><th className="py-2 text-right">Qty</th><th className="py-2 text-right">Rate</th><th className="py-2 text-right">Amount</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{inv.items.map((l, i) => <tr key={i}><td className="py-2.5 text-slate-700">{l.desc}</td><td className="py-2.5 text-right text-slate-600">{l.qty}</td><td className="py-2.5 text-right text-slate-600">{inr(l.rate)}</td><td className="py-2.5 text-right font-medium text-slate-900">{inr(l.amount)}</td></tr>)}</tbody>
        </table>
        <div className="mt-4 ml-auto w-full max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between text-slate-500"><span>Subtotal</span><span className="text-slate-700">{inr(sub)}</span></div>
          <div className="flex justify-between text-slate-500"><span>Tax (18%)</span><span className="text-slate-700">{inr(tax)}</span></div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900"><span>Total due</span><span>{inr(sub + tax)}</span></div>
        </div>
        <p className="mt-8 border-t border-slate-100 pt-4 text-xs text-slate-400">Thank you for your business. Payment due within 15 days of issue.</p>
      </div>
    </Modal>
  );
}

function EmailModal({ inv, onClose, onSend }) {
  const total = inv.items.reduce((s, l) => s + l.amount, 0) * (1 + TAX_RATE);
  const [to, setTo] = useState(inv.email);
  const [subject, setSubject] = useState(`Invoice ${inv.id} from VendorBridge`);
  const [body, setBody] = useState(`Dear ${inv.vendor},\n\nPlease find attached invoice ${inv.id} for ${inr(total)} against PO ${inv.po}. Payment is due by ${fmt(inv.due)}.\n\nRegards,\nProcurement Team`);
  const input = "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30";
  return (
    <Modal onClose={onClose} labelId="email-title">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4"><h2 id="email-title" className="text-base font-semibold text-slate-900">Email invoice</h2><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Close dialog"><X className="h-4 w-4" /></button></div>
      <div className="space-y-3 px-6 py-5">
        <div><label htmlFor="em-to" className="mb-1.5 block text-sm font-medium text-slate-700">To</label><input id="em-to" className={input} value={to} onChange={(e) => setTo(e.target.value)} /></div>
        <div><label htmlFor="em-sub" className="mb-1.5 block text-sm font-medium text-slate-700">Subject</label><input id="em-sub" className={input} value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
        <div><label htmlFor="em-body" className="mb-1.5 block text-sm font-medium text-slate-700">Message</label><textarea id="em-body" rows={5} className={input} value={body} onChange={(e) => setBody(e.target.value)} /></div>
        <p className="flex items-center gap-1.5 text-xs text-slate-400"><ReceiptText className="h-3.5 w-3.5" aria-hidden="true" /> Invoice {inv.id}.pdf will be attached.</p>
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
        <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
        <button onClick={onSend} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"><Send className="h-4 w-4" /> Send invoice</button>
      </div>
    </Modal>
  );
}

function GenerateModal({ ready, onClose, onGenerate }) {
  return (
    <Modal onClose={onClose} labelId="gen-inv-title">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4"><div><h2 id="gen-inv-title" className="text-base font-semibold text-slate-900">Generate Invoice</h2><p className="text-xs text-slate-500">Purchase orders ready for invoicing.</p></div><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Close dialog"><X className="h-4 w-4" /></button></div>
      <div className="space-y-2 px-6 py-5">
        {ready.length === 0 && <p className="py-6 text-center text-sm text-slate-400">No POs awaiting invoices.</p>}
        {ready.map((po) => {
          const total = po.items.reduce((s, l) => s + l.amount, 0) * (1 + TAX_RATE);
          return (
            <div key={po.po} className="flex items-center justify-between rounded-lg border border-slate-200 p-3.5">
              <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-700" aria-hidden="true"><ReceiptText className="h-4 w-4" /></span><div><p className="text-sm font-medium text-slate-900">{po.vendor}</p><p className="text-xs text-slate-500">{po.po} · {inr(total)}</p></div></div>
              <button onClick={() => onGenerate(po)} className="rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-emerald-700" aria-label={`Generate invoice for ${po.vendor}`}>Generate</button>
            </div>
          );
        })}
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
      <div ref={ref} className={`relative z-10 w-full ${wide ? "max-w-2xl" : "max-w-md"} animate-in fade-in zoom-in-95 overflow-hidden rounded-2xl bg-white shadow-2xl duration-200`}>{children}</div>
    </div>
  );
}

function Toast({ children }) {
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed bottom-6 right-6 z-[60]">
      {children && <div className="pointer-events-auto flex max-w-sm items-start gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-lg animate-in slide-in-from-bottom-4"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" /><p className="text-sm text-slate-700">{children}</p></div>}
    </div>
  );
}

const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
