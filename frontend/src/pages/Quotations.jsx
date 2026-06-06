import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  ClipboardList, X, Star, TrendingDown, Truck, Award, Check, Send, Lock, Pencil, ArrowUpDown, CheckCircle2,
} from "lucide-react";

/**
 * VendorBridge — Quotations (Screens 6 & 7)
 * Vendor: submit / edit own quotation (locks after deadline).
 * Officer: compare bids, select best, submit for approval. Manager/Admin: read-only.
 */

const RFQS = [
  { id: "RFQ-2026-016", title: "Industrial Bearings", deadline: "2026-06-08", item: "Deep-groove bearing 6204 × 500" },
  { id: "RFQ-2026-015", title: "Network Switch Refresh", deadline: "2026-06-11", item: "48-port managed switch × 24" },
  { id: "RFQ-2026-014", title: "Cold-Rolled Steel Sheets", deadline: "2026-06-06", item: "CR steel sheet 1.2mm × 12t" },
];

const SEED_QUOTES = {
  "RFQ-2026-016": [
    { id: "Q1", vendor: "Acme Industrial Co.", price: 248000, delivery: "2026-06-20", rating: 4.6, notes: "Includes freight, 10% advance." },
    { id: "Q2", vendor: "Vertex Materials", price: 236500, delivery: "2026-06-24", rating: 4.8, notes: "Bulk discount applied." },
    { id: "Q3", vendor: "Forge Machinery", price: 259000, delivery: "2026-06-17", rating: 4.1, notes: "Express dispatch available." },
  ],
  "RFQ-2026-015": [
    { id: "Q4", vendor: "TechSource Systems", price: 412000, delivery: "2026-06-26", rating: 4.2, notes: "3-year warranty." },
    { id: "Q5", vendor: "NetGear Partners", price: 398000, delivery: "2026-07-02", rating: 4.0, notes: "Stock subject to confirmation." },
  ],
  "RFQ-2026-014": [],
};

const inr = (n) => "₹" + n.toLocaleString("en-IN");

export default function Quotations() {
  const { user } = useAuth?.() || {};
  const role = user?.role || "Procurement Officer";
  if (role === "Vendor") return <VendorView />;
  return <CompareView role={role} />;
}

/* ===================== OFFICER / MANAGER / ADMIN ===================== */
function CompareView({ role }) {
  const canSelect = role === "Procurement Officer";
  const [rfqId, setRfqId] = useState(RFQS[0].id);
  const [sort, setSort] = useState("price");
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState(null);

  const rfq = RFQS.find((r) => r.id === rfqId);
  const quotes = SEED_QUOTES[rfqId] || [];
  const lowest = quotes.length ? Math.min(...quotes.map((q) => q.price)) : null;
  const topRated = quotes.length ? Math.max(...quotes.map((q) => q.rating)) : null;
  const earliest = quotes.length ? quotes.reduce((a, b) => (new Date(a.delivery) < new Date(b.delivery) ? a : b), quotes[0]) : null;

  const sorted = useMemo(() => {
    const arr = [...quotes];
    if (sort === "price") arr.sort((a, b) => a.price - b.price);
    if (sort === "delivery") arr.sort((a, b) => new Date(a.delivery) - new Date(b.delivery));
    if (sort === "rating") arr.sort((a, b) => b.rating - a.rating);
    return arr;
  }, [quotes, sort]);

  const submit = () => {
    setSubmitted(true);
    setToast(`Quotation from ${quotes.find((q) => q.id === selected)?.vendor} submitted to Manager for approval.`);
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 p-6 lg:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Decision Intelligence</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Quotation Comparison</h1>
        <p className="mt-1 text-sm text-slate-500">{canSelect ? "Compare bids and select the most suitable vendor." : "Review collected bids for each RFQ."}</p>
      </header>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Select RFQ">
        {RFQS.map((r) => (
          <button key={r.id} role="tab" aria-selected={r.id === rfqId} onClick={() => { setRfqId(r.id); setSelected(null); setSubmitted(false); }} className={`rounded-lg border px-3.5 py-2 text-left text-sm transition ${r.id === rfqId ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
            <span className="block font-medium text-slate-900">{r.id}</span><span className="block text-xs text-slate-400">{r.title}</span>
          </button>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">{rfq?.title} <span className="text-slate-400">· {quotes.length} bids</span></h2>
            <p className="text-xs text-slate-500">{rfq?.item}</p>
          </div>
          {quotes.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <ArrowUpDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
              <label htmlFor="sort" className="sr-only">Sort bids</label>
              <select id="sort" value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-lg border border-slate-300 py-1.5 pl-2 pr-7 text-sm focus:border-emerald-500 focus:outline-none">
                <option value="price">Lowest price</option><option value="delivery">Earliest delivery</option><option value="rating">Top rated</option>
              </select>
            </div>
          )}
        </div>

        {quotes.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-slate-400" aria-hidden="true"><ClipboardList className="h-6 w-6" /></div>
            <p className="mt-3 text-sm font-medium text-slate-700">No bids received yet</p>
            <p className="mt-1 text-sm text-slate-400">No vendors have responded to this RFQ. Check back before the deadline of {fmt(rfq?.deadline)}.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Vendor bids for {rfq?.title}</caption>
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th scope="col" className="px-5 py-3">Vendor</th><th scope="col" className="px-5 py-3">Price</th><th scope="col" className="px-5 py-3">Delivery</th><th scope="col" className="px-5 py-3">Rating</th><th scope="col" className="px-5 py-3">Notes</th>{canSelect && <th scope="col" className="px-5 py-3 text-right">Select</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sorted.map((q) => {
                    const isLow = q.price === lowest, isFast = q.id === earliest?.id, isTop = q.rating === topRated, isSel = selected === q.id;
                    return (
                      <tr key={q.id} className={`transition ${isSel ? "bg-emerald-50/60" : "hover:bg-slate-50/70"}`}>
                        <td className="px-5 py-4 font-medium text-slate-900"><div className="flex items-center gap-2"><Truck className="h-4 w-4 text-slate-400" aria-hidden="true" /> {q.vendor}</div></td>
                        <td className="px-5 py-4"><span className="font-semibold text-slate-900">{inr(q.price)}</span>{isLow && <Badge tone="emerald" icon={TrendingDown}>Lowest</Badge>}</td>
                        <td className="px-5 py-4 text-slate-600">{fmt(q.delivery)}{isFast && <Badge tone="sky">Fastest</Badge>}</td>
                        <td className="px-5 py-4"><span className="inline-flex items-center gap-1 text-slate-700"><Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" /> {q.rating}</span>{isTop && <Badge tone="violet" icon={Award}>Best rated</Badge>}</td>
                        <td className="px-5 py-4 max-w-[220px] text-xs text-slate-500">{q.notes || "—"}</td>
                        {canSelect && (
                          <td className="px-5 py-4 text-right">
                            <button onClick={() => setSelected(q.id)} disabled={submitted} aria-label={`Select ${q.vendor}'s quote`} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${isSel ? "bg-emerald-600 text-white" : "border border-slate-200 text-slate-700 hover:bg-slate-50"}`}>{isSel ? <><Check className="h-3.5 w-3.5" /> Selected</> : "Select"}</button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {canSelect && (
              <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
                <p className="text-sm text-slate-500">{selected ? <>Selected <span className="font-medium text-slate-900">{quotes.find((q) => q.id === selected)?.vendor}</span></> : "Select a quotation to proceed."}</p>
                <button onClick={submit} disabled={!selected || submitted} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">{submitted ? <><CheckCircle2 className="h-4 w-4" /> Submitted</> : <><Send className="h-4 w-4" /> Submit for Approval</>}</button>
              </div>
            )}
          </>
        )}
      </section>

      <Toast>{toast}</Toast>
    </div>
  );
}

function Badge({ tone, icon: Icon, children }) {
  const map = { emerald: "bg-emerald-50 text-emerald-700", sky: "bg-sky-50 text-sky-700", violet: "bg-violet-50 text-violet-700" };
  return <span className={`ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${map[tone]}`}>{Icon && <Icon className="h-3 w-3" aria-hidden="true" />}{children}</span>;
}

/* ===================== VENDOR ===================== */
function VendorView() {
  const [quotes, setQuotes] = useState({
    "RFQ-2026-016": { price: 248000, delivery: "2026-06-20", notes: "Includes freight, 10% advance.", locked: false },
    "RFQ-2026-014": { price: 86500, delivery: "2026-06-15", notes: "", locked: true },
  });
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);

  const save = (id, data) => {
    setQuotes((q) => ({ ...q, [id]: { ...data, locked: false } }));
    setEditing(null);
    setToast("Quotation submitted. You can edit it until the deadline.");
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-6 p-6 lg:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Submit Quotation</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">My Quotations</h1>
        <p className="mt-1 text-sm text-slate-500">Respond to assigned RFQs. Quotations lock once the deadline passes.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {RFQS.map((rfq) => {
          const q = quotes[rfq.id]; const past = daysLeft(rfq.deadline) < 0; const locked = q?.locked || past;
          return (
            <article key={rfq.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700" aria-hidden="true"><ClipboardList className="h-5 w-5" /></div>
                {q ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"><Check className="h-3.5 w-3.5" /> Submitted</span> : <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">Awaiting your quote</span>}
              </div>
              <p className="mt-4 text-xs font-medium text-slate-400">{rfq.id}</p>
              <h2 className="text-base font-semibold text-slate-900">{rfq.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{rfq.item}</p>
              <p className="mt-1 text-xs text-slate-400">Deadline {fmt(rfq.deadline)} · {past ? "closed" : `${daysLeft(rfq.deadline)} days left`}</p>
              {q && (
                <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3 text-sm">
                  <div><p className="text-xs text-slate-400">Price</p><p className="font-semibold text-slate-900">{inr(q.price)}</p></div>
                  <div><p className="text-xs text-slate-400">Delivery</p><p className="font-medium text-slate-700">{fmt(q.delivery)}</p></div>
                  {q.notes && <div className="col-span-2"><p className="text-xs text-slate-400">Notes</p><p className="text-slate-600">{q.notes}</p></div>}
                </div>
              )}
              <div className="mt-4 flex-1" />
              <button onClick={() => !locked && setEditing(rfq)} disabled={locked} className={`mt-2 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${locked ? "cursor-not-allowed bg-slate-100 text-slate-400" : q ? "border border-slate-200 text-slate-700 hover:bg-slate-50" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}>{locked ? <><Lock className="h-4 w-4" /> Locked</> : q ? <><Pencil className="h-4 w-4" /> Edit quote</> : <><Send className="h-4 w-4" /> Submit quote</>}</button>
            </article>
          );
        })}
      </div>

      {editing && <QuoteModal rfq={editing} initial={quotes[editing.id]} onClose={() => setEditing(null)} onSave={save} />}
      <Toast>{toast}</Toast>
    </div>
  );
}

function QuoteModal({ rfq, initial, onClose, onSave }) {
  const [price, setPrice] = useState(initial?.price || "");
  const [delivery, setDelivery] = useState(initial?.delivery || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [err, setErr] = useState({});
  const submit = () => {
    const e = {};
    if (!price || Number(price) <= 0) e.price = "Enter a valid price";
    if (!delivery) e.delivery = "Pick a delivery date";
    setErr(e);
    if (Object.keys(e).length) return;
    onSave(rfq.id, { price: Number(price), delivery, notes });
  };
  const input = "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30";

  return (
    <Modal onClose={onClose} labelId="quote-title">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div><h2 id="quote-title" className="text-base font-semibold text-slate-900">Submit Quotation</h2><p className="text-xs text-slate-500">{rfq.id} · {rfq.title}</p></div>
        <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Close dialog"><X className="h-4 w-4" /></button>
      </div>
      <div className="space-y-4 px-6 py-5">
        <div>
          <label htmlFor="q-price" className="mb-1.5 block text-sm font-medium text-slate-700">Total price (₹)</label>
          <input id="q-price" type="number" min="1" step="1" inputMode="numeric" className={input} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" aria-invalid={!!err.price} />
          {err.price && <p role="alert" className="mt-1 text-xs text-rose-600">{err.price}</p>}
        </div>
        <div>
          <label htmlFor="q-delivery" className="mb-1.5 block text-sm font-medium text-slate-700">Estimated delivery date</label>
          <input id="q-delivery" type="date" className={input} value={delivery} onChange={(e) => setDelivery(e.target.value)} aria-invalid={!!err.delivery} />
          {err.delivery && <p role="alert" className="mt-1 text-xs text-rose-600">{err.delivery}</p>}
        </div>
        <div>
          <label htmlFor="q-notes" className="mb-1.5 block text-sm font-medium text-slate-700">Notes / comments</label>
          <textarea id="q-notes" rows={3} className={input} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Payment terms, warranty, freight…" />
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
        <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
        <button onClick={submit} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"><Award className="h-4 w-4" /> Submit</button>
      </div>
    </Modal>
  );
}

function Modal({ children, onClose, labelId }) {
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
      <div ref={ref} className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 overflow-hidden rounded-2xl bg-white shadow-2xl duration-200">{children}</div>
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

const fmt = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const daysLeft = (d) => Math.ceil((new Date(d).setHours(23, 59, 59) - Date.now()) / 86400000);
