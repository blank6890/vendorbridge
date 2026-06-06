import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Search, LogIn, Truck, FileText, ClipboardList, CheckCircle2, PackageCheck, ReceiptText, Bell, UserPlus, Activity,
} from "lucide-react";

/**
 * VendorBridge — Activity Logs (Screen 10)
 * Full audit trail, colour-coded by type, with module filters + search.
 * Role-scoped: Vendors see only events related to them; Admin sees everything.
 */

const TYPE = {
  auth: { label: "Auth", icon: LogIn, dot: "bg-slate-400", soft: "bg-slate-100 text-slate-600", bar: "bg-slate-400" },
  user: { label: "User", icon: UserPlus, dot: "bg-violet-500", soft: "bg-violet-50 text-violet-700", bar: "bg-violet-500" },
  vendor: { label: "Vendor", icon: Truck, dot: "bg-sky-500", soft: "bg-sky-50 text-sky-700", bar: "bg-sky-500" },
  rfq: { label: "RFQ", icon: FileText, dot: "bg-emerald-500", soft: "bg-emerald-50 text-emerald-700", bar: "bg-emerald-500" },
  quote: { label: "Quotation", icon: ClipboardList, dot: "bg-indigo-500", soft: "bg-indigo-50 text-indigo-700", bar: "bg-indigo-500" },
  approval: { label: "Approval", icon: CheckCircle2, dot: "bg-amber-500", soft: "bg-amber-50 text-amber-700", bar: "bg-amber-500" },
  po: { label: "Purchase Order", icon: PackageCheck, dot: "bg-teal-500", soft: "bg-teal-50 text-teal-700", bar: "bg-teal-500" },
  invoice: { label: "Invoice", icon: ReceiptText, dot: "bg-rose-500", soft: "bg-rose-50 text-rose-700", bar: "bg-rose-500" },
};

const MODULES = ["All", ...Object.keys(TYPE).map((k) => TYPE[k].label)];

const LOGS = [
  { id: 1, type: "approval", actor: "S. Iyer (Manager)", text: "Approved PR-2026-028 — PaperPlus Supplies", time: "12 min ago", vendorRef: null, roles: ["Admin", "Manager", "Procurement Officer"] },
  { id: 2, type: "quote", actor: "Vertex Materials", text: "Submitted quotation for RFQ-2026-016 (₹2,36,500)", time: "1 hr ago", vendorRef: "Vertex Materials", roles: ["Admin", "Procurement Officer"] },
  { id: 3, type: "invoice", actor: "D. Cruz (Officer)", text: "Invoice INV-2026-031 marked Paid", time: "3 hr ago", vendorRef: "PaperPlus Supplies", roles: ["Admin", "Manager", "Procurement Officer"] },
  { id: 4, type: "rfq", actor: "D. Cruz (Officer)", text: "Created RFQ-2026-016 — Industrial Bearings", time: "5 hr ago", vendorRef: null, roles: ["Admin", "Manager", "Procurement Officer", "Vendor"] },
  { id: 5, type: "po", actor: "D. Cruz (Officer)", text: "Generated PO VB-2026-06-0002 for Acme Industrial", time: "6 hr ago", vendorRef: "Acme Industrial Co.", roles: ["Admin", "Manager", "Procurement Officer", "Vendor"] },
  { id: 6, type: "vendor", actor: "Admin", text: "Onboarded new vendor LogiPro Freight", time: "Yesterday", vendorRef: null, roles: ["Admin", "Procurement Officer", "Manager"] },
  { id: 7, type: "user", actor: "Admin", text: "Approved Manager registration — Aisha Khan", time: "Yesterday", vendorRef: null, roles: ["Admin"] },
  { id: 8, type: "auth", actor: "Acme Industrial Co.", text: "Vendor signed in", time: "Yesterday", vendorRef: "Acme Industrial Co.", roles: ["Admin", "Vendor"] },
  { id: 9, type: "approval", actor: "S. Iyer (Manager)", text: "Rejected PR-2026-027 — Forge Machinery (pricing)", time: "2 days ago", vendorRef: null, roles: ["Admin", "Manager", "Procurement Officer"] },
  { id: 10, type: "quote", actor: "Acme Industrial Co.", text: "Submitted quotation for RFQ-2026-014 (₹86,500)", time: "2 days ago", vendorRef: "Acme Industrial Co.", roles: ["Admin", "Procurement Officer", "Vendor"] },
];

const NOTIFS = [
  { type: "approval", text: "2 procurement requests awaiting approval", time: "Now" },
  { type: "rfq", text: "RFQ-2026-014 closes today", time: "1 hr" },
  { type: "invoice", text: "Invoice INV-2026-032 due in 3 days", time: "Today" },
];

export default function ActivityLogs() {
  const { user } = useAuth?.() || {};
  const role = user?.role || "Admin";
  const myVendor = "Acme Industrial Co.";

  const [q, setQ] = useState("");
  const [mod, setMod] = useState("All");

  const scoped = useMemo(() => LOGS.filter((l) => {
    if (!l.roles.includes(role)) return false;
    if (role === "Vendor" && l.vendorRef && l.vendorRef !== myVendor) return false;
    return true;
  }), [role]);

  const filtered = useMemo(() => scoped.filter((l) => {
    const matchQ = `${l.actor} ${l.text}`.toLowerCase().includes(q.toLowerCase());
    const matchMod = mod === "All" || TYPE[l.type].label === mod;
    return matchQ && matchMod;
  }), [scoped, q, mod]);

  const typeCounts = Object.keys(TYPE).map((k) => ({ k, count: scoped.filter((l) => l.type === k).length })).filter((t) => t.count > 0);
  const maxCount = Math.max(1, ...typeCounts.map((t) => t.count));

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 p-6 lg:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Audit Trail</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Activity Logs</h1>
        <p className="mt-1 text-sm text-slate-500">{role === "Vendor" ? "A record of activity related to your account." : role === "Admin" ? "Complete system-wide audit trail." : "Activity across your procurement workflows."}</p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search activity" placeholder="Search activity…" className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
          </div>

          <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter by module">
            {MODULES.filter((m) => m === "All" || scoped.some((l) => TYPE[l.type].label === m)).map((m) => (
              <button key={m} onClick={() => setMod(m)} aria-pressed={mod === m} className={`min-h-[36px] rounded-full px-3.5 py-1.5 text-xs font-medium transition ${mod === m ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>{m}</button>
            ))}
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <h2 className="sr-only">Activity timeline</h2>
            <ol className="relative px-5 py-4">
              <span className="absolute left-[34px] top-8 bottom-8 w-px bg-slate-100" aria-hidden="true" />
              {filtered.map((l) => {
                const t = TYPE[l.type]; const Icon = t.icon;
                return (
                  <li key={l.id} className="relative flex gap-4 py-3">
                    <span className={`z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full ring-4 ring-white ${t.soft}`} aria-hidden="true"><Icon className="h-4 w-4" /></span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex items-start justify-between gap-3"><p className="text-sm text-slate-800">{l.text}</p><span className="shrink-0 text-xs text-slate-400">{l.time}</span></div>
                      <div className="mt-1 flex items-center gap-2"><span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${t.soft}`}>{t.label}</span><span className="text-xs text-slate-400">{l.actor}</span></div>
                    </div>
                  </li>
                );
              })}
              {filtered.length === 0 && <li className="py-12 text-center text-sm text-slate-400">No activity matches your filters.</li>}
            </ol>
          </section>
        </div>

        <div className="space-y-6">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4"><Bell className="h-4 w-4 text-emerald-600" aria-hidden="true" /><h2 className="text-sm font-semibold text-slate-900">Notifications</h2></div>
            <ul className="divide-y divide-slate-100">
              {NOTIFS.map((n, i) => {
                const t = TYPE[n.type];
                return <li key={i} className="flex items-start gap-3 px-5 py-3.5"><span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${t.dot}`} aria-hidden="true" /><div className="min-w-0 flex-1"><p className="text-sm text-slate-700">{n.text}</p><p className="mt-0.5 text-xs text-slate-400">{n.time}</p></div></li>;
              })}
            </ul>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4"><Activity className="h-4 w-4 text-emerald-600" aria-hidden="true" /><h2 className="text-sm font-semibold text-slate-900">Activity by type</h2></div>
            <div className="space-y-3 px-5 py-4">
              {typeCounts.map(({ k, count }) => {
                const t = TYPE[k]; const pct = Math.round((count / maxCount) * 100);
                return (
                  <div key={k}>
                    <div className="mb-1 flex items-center gap-2 text-sm"><span className={`h-2.5 w-2.5 rounded-full ${t.dot}`} aria-hidden="true" /><span className="flex-1 text-slate-600">{t.label}</span><span className="font-semibold text-slate-900">{count}</span></div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${t.label}: ${count} events`}><div className={`h-full rounded-full ${t.bar}`} style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
              {typeCounts.length === 0 && <p className="py-4 text-center text-sm text-slate-400">No activity recorded.</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
