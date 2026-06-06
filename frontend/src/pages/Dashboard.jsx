import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FileText, CheckCircle2, ClipboardList, ReceiptText, TrendingUp, Users, UserCheck, UserX,
  Plus, ArrowUpRight, Truck, ShieldCheck, Clock, PackageCheck, BarChart3,
} from "lucide-react";

/**
 * VendorBridge — Dashboard (Screen 3)
 * Role-aware (Admin / Procurement Officer / Manager / Vendor).
 * Tailwind cannot compile dynamic class names, so colour variants use the static TONE map.
 */

const TONE = {
  emerald: { soft: "bg-emerald-50 text-emerald-600", bar: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700" },
  sky: { soft: "bg-sky-50 text-sky-600", bar: "bg-sky-500", pill: "bg-sky-50 text-sky-700" },
  amber: { soft: "bg-amber-50 text-amber-600", bar: "bg-amber-500", pill: "bg-amber-50 text-amber-700" },
  violet: { soft: "bg-violet-50 text-violet-600", bar: "bg-violet-500", pill: "bg-violet-50 text-violet-700" },
  rose: { soft: "bg-rose-50 text-rose-600", bar: "bg-rose-500", pill: "bg-rose-50 text-rose-700" },
  slate: { soft: "bg-slate-100 text-slate-600", bar: "bg-slate-500", pill: "bg-slate-100 text-slate-700" },
};

const seedPendingUsers = [
  { id: "u1", name: "Rahul Mehta", email: "rahul@steelworks.in", role: "Vendor" },
  { id: "u2", name: "Aisha Khan", email: "aisha@vendorbridge.io", role: "Manager" },
  { id: "u3", name: "Daniel Cruz", email: "daniel@vendorbridge.io", role: "Procurement Officer" },
];

const recentActivity = [
  { icon: CheckCircle2, tone: "emerald", text: "RFQ-2026-014 approved by S. Iyer", time: "12m ago" },
  { icon: ClipboardList, tone: "sky", text: "New quotation from Vertex Materials", time: "1h ago" },
  { icon: ReceiptText, tone: "amber", text: "Invoice INV-2026-031 marked Paid", time: "3h ago" },
  { icon: FileText, tone: "violet", text: "RFQ-2026-016 created", time: "5h ago" },
];

// Derived from mock spend data — single source so bars reflect "real" numbers.
const spendData = [
  { label: "Raw Materials", value: 1820000, tone: "emerald" },
  { label: "IT Services", value: 1210000, tone: "sky" },
  { label: "Logistics", value: 880000, tone: "violet" },
  { label: "Office Supplies", value: 410000, tone: "amber" },
];

export default function Dashboard() {
  const { user } = useAuth?.() || {};
  const role = user?.role || "Procurement Officer";
  const navigate = useNavigate();
  const [pending, setPending] = useState(seedPendingUsers);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  }, []);

  const decide = (id) => setPending((p) => p.filter((u) => u.id !== id));
  const maxSpend = Math.max(...spendData.map((s) => s.value));

  const statsByRole = {
    Admin: [
      { label: "Total Users", value: "48", icon: Users, trend: "+6 this month", tone: "emerald" },
      { label: "Pending Approvals", value: String(pending.length), icon: Clock, trend: "Awaiting review", tone: "amber" },
      { label: "Active Vendors", value: "23", icon: Truck, trend: "2 onboarding", tone: "sky" },
      { label: "Total Spend (YTD)", value: "₹4.82Cr", icon: TrendingUp, trend: "+12.4%", tone: "violet" },
    ],
    "Procurement Officer": [
      { label: "Active RFQs", value: "7", icon: FileText, trend: "2 closing soon", tone: "emerald" },
      { label: "Quotations Received", value: "19", icon: ClipboardList, trend: "+5 today", tone: "sky" },
      { label: "Awaiting Approval", value: "3", icon: Clock, trend: "Submitted to Manager", tone: "amber" },
      { label: "POs Generated", value: "11", icon: PackageCheck, trend: "This month", tone: "violet" },
    ],
    Manager: [
      { label: "Pending Requests", value: "5", icon: Clock, trend: "Needs your review", tone: "amber" },
      { label: "Approved (30d)", value: "28", icon: CheckCircle2, trend: "+9 vs prev", tone: "emerald" },
      { label: "Rejected (30d)", value: "4", icon: UserX, trend: "Budget / pricing", tone: "rose" },
      { label: "Avg. Decision Time", value: "6.2h", icon: TrendingUp, trend: "-1.4h", tone: "sky" },
    ],
    Vendor: [
      { label: "Assigned RFQs", value: "4", icon: FileText, trend: "1 closing today", tone: "emerald" },
      { label: "Quotations Sent", value: "9", icon: ClipboardList, trend: "2 editable", tone: "sky" },
      { label: "Purchase Orders", value: "3", icon: PackageCheck, trend: "1 in transit", tone: "violet" },
      { label: "Invoices", value: "2", icon: ReceiptText, trend: "1 awaiting payment", tone: "amber" },
    ],
  };

  const actionsByRole = {
    Admin: [
      { label: "Manage Vendors", to: "/vendors", icon: Truck },
      { label: "Reports", to: "/reports", icon: BarChart3, primary: true },
      { label: "Activity Logs", to: "/activity-logs", icon: ClipboardList },
    ],
    "Procurement Officer": [
      { label: "Create RFQ", to: "/rfq", icon: Plus, primary: true },
      { label: "Compare Quotes", to: "/quotations", icon: ClipboardList },
      { label: "Generate PO", to: "/purchase-orders", icon: PackageCheck },
    ],
    Manager: [
      { label: "Review Approvals", to: "/approvals", icon: CheckCircle2, primary: true },
      { label: "Reports", to: "/reports", icon: BarChart3 },
      { label: "Activity Logs", to: "/activity-logs", icon: ClipboardList },
    ],
    Vendor: [
      { label: "View My RFQs", to: "/rfq", icon: FileText, primary: true },
      { label: "Submit Quotation", to: "/quotations", icon: ClipboardList },
      { label: "My Purchase Orders", to: "/purchase-orders", icon: PackageCheck },
    ],
  };

  const stats = statsByRole[role] || statsByRole["Procurement Officer"];
  const actions = actionsByRole[role] || actionsByRole["Procurement Officer"];

  const activeRfqs = [
    { rfq: "RFQ-2026-016", item: "Industrial Bearings — 500 units", due: "Closes in 2 days", tone: "amber" },
    { rfq: "RFQ-2026-015", item: "Network Switches — 24 units", due: "Closes in 5 days", tone: "emerald" },
    { rfq: "RFQ-2026-014", item: "Steel Sheets — 12 tons", due: "Closing today", tone: "rose" },
  ];

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 p-6 lg:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">{role} Workspace</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{greeting}, {user?.name?.split(" ")[0] || "there"}.</h1>
          <p className="mt-1 text-sm text-slate-500">Here's what's happening across procurement today.</p>
        </div>
        <nav aria-label="Quick actions" className="flex flex-wrap gap-2">
          {actions.map((a) => {
            const Icon = a.icon;
            return (
              <button key={a.label} onClick={() => navigate(a.to)}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition ${a.primary ? "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>
                <Icon className="h-4 w-4" /> {a.label}
              </button>
            );
          })}
        </nav>
      </header>

      <section aria-label="Key metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => <StatCard key={s.label} {...s} delay={i * 60} />)}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {role === "Admin" && (
            <Card>
              <CardHead title="User Access Requests" subtitle="Approve or reject new account registrations" badge={`${pending.length} pending`} />
              <div className="divide-y divide-slate-100">
                {pending.length === 0 && <EmptyRow text="No pending requests. You're all caught up." />}
                {pending.map((u) => (
                  <div key={u.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600" aria-hidden="true">
                      {u.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{u.name}</p>
                      <p className="truncate text-xs text-slate-500">{u.email}</p>
                    </div>
                    <RolePill role={u.role} />
                    <div className="flex gap-2">
                      <button onClick={() => decide(u.id)} aria-label={`Approve ${u.name}`} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700">
                        <UserCheck className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button onClick={() => decide(u.id)} aria-label={`Reject ${u.name}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                        <UserX className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {role === "Manager" && (
            <Card>
              <CardHead title="Procurement Requests" subtitle="Selected quotations awaiting your decision" badge="5 pending" />
              <div className="divide-y divide-slate-100">
                {[["RFQ-2026-014", "Vertex Materials", "₹2,40,000", "Today"], ["RFQ-2026-013", "Acme Industrial", "₹86,500", "Yesterday"], ["RFQ-2026-011", "LogiPro Freight", "₹1,12,000", "2 days ago"]].map(([rfq, vendor, amt, when]) => (
                  <button key={rfq} onClick={() => navigate("/approvals")} className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-50 text-amber-600" aria-hidden="true"><Clock className="h-5 w-5" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900">{rfq} · {vendor}</p>
                      <p className="text-xs text-slate-500">Submitted {when}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{amt}</span>
                    <ArrowUpRight className="h-4 w-4 text-slate-300" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </Card>
          )}

          {(role === "Procurement Officer" || role === "Vendor") && (
            <Card>
              <CardHead title={role === "Vendor" ? "Active RFQs Assigned to You" : "Active RFQs"} subtitle={role === "Vendor" ? "Respond before the deadline" : "RFQs currently open for bidding"} action={{ label: role === "Vendor" ? "Quote" : "Open", to: role === "Vendor" ? "/quotations" : "/rfq" }} navigate={navigate} />
              <div className="divide-y divide-slate-100">
                {activeRfqs.map(({ rfq, item, due, tone }) => (
                  <button key={rfq} onClick={() => navigate(role === "Vendor" ? "/quotations" : "/rfq")} className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-emerald-600" aria-hidden="true"><FileText className="h-5 w-5" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900">{rfq}</p>
                      <p className="truncate text-xs text-slate-500">{item}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${TONE[tone].pill}`}>{due}</span>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHead title="Recent Activity" subtitle="Across your workspace" />
            <ol className="relative space-y-5 px-5 py-5">
              <span className="absolute left-[31px] top-7 bottom-7 w-px bg-slate-100" aria-hidden="true" />
              {recentActivity.map((a, i) => {
                const Icon = a.icon;
                return (
                  <li key={i} className="relative flex gap-3">
                    <span className={`z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full ring-4 ring-white ${TONE[a.tone].soft}`} aria-hidden="true"><Icon className="h-3.5 w-3.5" /></span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="text-sm text-slate-700">{a.text}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{a.time}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
            <div className="border-t border-slate-100 px-5 py-3">
              <button onClick={() => navigate("/activity-logs")} className="text-sm font-medium text-emerald-700 hover:text-emerald-800">View all activity →</button>
            </div>
          </Card>

          {role !== "Vendor" && (
            <Card>
              <CardHead title="Spend by Category" subtitle="This quarter" />
              <div className="space-y-4 px-5 py-5">
                {spendData.map(({ label, value, tone }) => {
                  const pct = Math.round((value / maxSpend) * 100);
                  return (
                    <div key={label}>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-600">{label}</span>
                        <span className="text-slate-400">₹{(value / 100000).toFixed(1)}L</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${label}: ${pct}% of top category`}>
                        <div className={`h-full rounded-full transition-all duration-700 ease-out ${TONE[tone].bar}`} style={{ width: mounted ? `${pct}%` : "0%" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-slate-100 px-5 py-3">
                <button onClick={() => navigate("/reports")} className="text-sm font-medium text-emerald-700 hover:text-emerald-800">Open full reports →</button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, trend, tone = "emerald", delay = 0 }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md" style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}>
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${TONE[tone].soft}`} aria-hidden="true"><Icon className="h-5 w-5" /></span>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-xs text-slate-400">{trend}</p>
    </div>
  );
}

function Card({ children }) {
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">{children}</section>;
}

function CardHead({ title, subtitle, badge, action, navigate }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</p>}
      </div>
      {badge && <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">{badge}</span>}
      {action && <button onClick={() => navigate?.(action.to)} className="shrink-0 text-sm font-medium text-emerald-700 hover:text-emerald-800">{action.label} →</button>}
    </div>
  );
}

function EmptyRow({ text }) {
  return <p className="px-5 py-10 text-center text-sm text-slate-400">{text}</p>;
}

function RolePill({ role }) {
  const map = { Vendor: "bg-violet-50 text-violet-700", Manager: "bg-sky-50 text-sky-700", "Procurement Officer": "bg-emerald-50 text-emerald-700", Admin: "bg-slate-100 text-slate-700" };
  const Icon = role === "Vendor" ? Truck : role === "Manager" ? CheckCircle2 : role === "Admin" ? ShieldCheck : ClipboardList;
  return <span className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium sm:inline-flex ${map[role] || "bg-slate-100 text-slate-700"}`}><Icon className="h-3.5 w-3.5" aria-hidden="true" /> {role}</span>;
}
