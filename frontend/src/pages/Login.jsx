import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Building2,
  Mail,
  Lock,
  User,
  ShieldCheck,
  Briefcase,
  CheckCircle2,
  Truck,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Phone,
  Globe,
  X,
  KeyRound,
  Send,
} from "lucide-react";

/**
 * VendorBridge — Login / Signup
 * ------------------------------------------------------------------
 * Changes from v1:
 *   • Shake animation on wrong credentials (CSS keyframe via inline style tag)
 *   • First Name / Last Name split into 2-column grid
 *   • Phone number field added to signup
 *   • Country searchable-select added to signup
 *   • Forgot password → full modal: enter email → "sent" confirmation step
 *
 * Expected AuthContext API (../context/AuthContext):
 *   const { login, signup } = useAuth();
 *   login({ email, password })                          -> resolves to user { id, name, email, role, status }
 *   signup({ firstName, lastName, email, phone,
 *            password, role, country })                 -> resolves to user
 *
 * Signup rules (handled by backend / AuthContext, mirrored in copy here):
 *   • First registered user  -> role = Admin,  status = Active
 *   • Vendor / Manager / Officer -> status = Pending (needs Admin approval)
 */

/* ─── shake keyframe injected once ─── */
const SHAKE_STYLE = `
@keyframes vb-shake {
  0%,100% { transform: translateX(0); }
  15%      { transform: translateX(-7px); }
  30%      { transform: translateX(7px); }
  45%      { transform: translateX(-5px); }
  60%      { transform: translateX(5px); }
  75%      { transform: translateX(-3px); }
  90%      { transform: translateX(3px); }
}
.vb-shake { animation: vb-shake 0.45s ease-in-out; }
`;

/* ─── countries list (searchable) ─── */
const COUNTRIES = [
  "India","United States","United Kingdom","Canada","Australia","Germany",
  "France","UAE","Singapore","Japan","China","Brazil","South Africa",
  "Saudi Arabia","Indonesia","Malaysia","Philippines","Bangladesh","Pakistan",
  "Sri Lanka","Nepal","Kenya","Nigeria","Ghana","Egypt","Mexico","Argentina",
  "Other",
];

const SIGNUP_ROLES = [
  { value: "Procurement Officer", label: "Procurement Officer", icon: Briefcase,    hint: "Create RFQs, compare quotes, raise POs" },
  { value: "Manager",             label: "Manager / Approver",  icon: CheckCircle2, hint: "Approve or reject procurement requests" },
  { value: "Vendor",              label: "Vendor",              icon: Truck,        hint: "Submit quotations, track RFQ status" },
  { value: "Company Admin",       label: "Company Admin",       icon: ShieldCheck,  hint: "Manage users; requires document verification (3 working days)" },
];

const DEMO_ACCOUNTS = [
  { role: "Admin",               icon: ShieldCheck,  email: "admin@vendorbridge.com" },
  { role: "Procurement Officer", icon: Briefcase,    email: "officer@vendorbridge.com" },
  { role: "Manager",             icon: CheckCircle2, email: "manager@vendorbridge.com" },
  { role: "Vendor",              icon: Truck,        email: "vendor@vendorbridge.com" },
];

/* ══════════════════════════════════════════════════════════════════ */
export default function Login() {
  const navigate = useNavigate();
  const auth = useAuth?.() || {};
  const { login, signup } = auth;

  const formRef = useRef(null);

  const [mode, setMode]         = useState("signin"); // 'signin' | 'signup'
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [banner, setBanner]     = useState(null);     // { type, msg }
  const [errors, setErrors]     = useState({});
  const [shake, setShake]       = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName:  "",
    email:     "",
    phone:     "",
    password:  "",
    confirm:   "",
    role:      "Procurement Officer",
    country:   "India",
  });

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));

  /* ── trigger shake then clear class so it can re-fire ── */
  const triggerShake = () => {
    setShake(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setShake(true)));
    setTimeout(() => setShake(false), 500);
  };

  const validate = () => {
    const err = {};
    if (mode === "signup") {
      if (form.firstName.trim().length < 2) err.firstName = "Enter your first name";
      if (form.lastName.trim().length < 1)  err.lastName  = "Enter your last name";
      if (!/^\+?[\d\s\-()]{7,15}$/.test(form.phone)) err.phone = "Enter a valid phone number";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) err.email = "Enter a valid email";
    if (form.password.length < 6) err.password = "Minimum 6 characters";
    if (mode === "signup" && form.password !== form.confirm) err.confirm = "Passwords do not match";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setBanner(null);
    if (!validate()) return;
    setLoading(true);
    try {
      if (mode === "signin") {
        const u = await login?.({ email: form.email, password: form.password });
        if (u?.status === "Pending") {
          setBanner({ type: "warn", msg: "Your account is pending Admin approval." });
        } else {
          navigate("/dashboard");
        }
      } else {
        const u = await signup?.({
          firstName: form.firstName,
          lastName:  form.lastName,
          email:     form.email,
          phone:     form.phone,
          password:  form.password,
          role:      form.role,
          country:   form.country,
        });
        if (u?.role === "Admin" || u?.status === "Active") {
          navigate("/dashboard");
        } else {
          const pendingMsg =
            form.role === "Company Admin" || form.role === "Vendor"
              ? "Registration received. We will email you requesting verification documents. Approval takes up to 3 working days."
              : "Account created. A Company Admin must approve your access before you can sign in.";
          setBanner({
            type: "success",
            msg: pendingMsg,
          });
          setMode("signin");
        }
      }
    } catch (err) {
      /* wrong credentials → shake the form */
      triggerShake();
      setBanner({ type: "error", msg: err?.message || "Invalid email or password." });
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (acc) => {
    setLoading(true);
    setBanner(null);
    try {
      await login?.({ email: acc.email, password: "password123" });
      navigate("/dashboard");
    } catch (err) {
      setBanner({ type: "error", msg: err?.message || "Demo login failed." });
    } finally {
      setLoading(false);
    }
  };

  const inputBase =
    "w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:ring-2 focus:ring-emerald-500/30";

  return (
    <>
      {/* inject shake keyframe once */}
      <style>{SHAKE_STYLE}</style>

      <div className="min-h-screen w-full bg-slate-50 lg:grid lg:grid-cols-[1.05fr_1fr]">

        {/* ── Brand panel ─────────────────────────────────── */}
        <aside className="relative hidden overflow-hidden bg-[#07261d] lg:flex lg:flex-col lg:justify-between lg:p-12 lg:text-emerald-50">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.18]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(16,185,129,.45), transparent 45%), radial-gradient(circle at 85% 75%, rgba(5,150,105,.4), transparent 40%)",
            }}
          />
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

          <div className="relative flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-500 text-[#07261d] shadow-lg shadow-emerald-900/40">
              <Building2 className="h-6 w-6" strokeWidth={2.4} />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight text-white">VendorBridge</p>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">Procurement ERP</p>
            </div>
          </div>

          <div className="relative max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400/80">Procure smarter</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-white">
              One platform for vendors, RFQs, approvals & invoices.
            </h1>
            <p className="mt-5 text-sm leading-relaxed text-emerald-100/70">
              Structured workflows from sourcing to settlement — competitive bidding, role-based approvals,
              and full audit trails in a single procurement console.
            </p>
          </div>

          <div className="relative grid grid-cols-3 gap-3 text-center">
            {[
              ["RFQ", "to PO in minutes"],
              ["Role-based", "secure access"],
              ["Full", "audit logs"],
            ].map(([a, b]) => (
              <div key={a} className="rounded-xl border border-white/10 bg-white/5 px-3 py-4 backdrop-blur">
                <p className="text-base font-semibold text-emerald-300">{a}</p>
                <p className="mt-1 text-[11px] leading-tight text-emerald-100/60">{b}</p>
              </div>
            ))}
          </div>
        </aside>

        {/* ── Form panel ──────────────────────────────────── */}
        <main className="flex min-h-screen items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-2 duration-500">

            {/* mobile logo */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-white">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="text-lg font-semibold tracking-tight text-slate-900">VendorBridge</span>
            </div>

            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              {mode === "signin"
                ? "Sign in to your procurement workspace."
                : "Register to request access. An Admin approves new accounts."}
            </p>

            {/* segmented control */}
            <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
              {["signin", "signup"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMode(m); setErrors({}); setBanner(null); }}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    mode === m ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {m === "signin" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>

            {banner && (
              <div
                className={`mt-5 rounded-lg border px-4 py-3 text-sm ${
                  banner.type === "error"
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : banner.type === "warn"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {banner.msg}
              </div>
            )}

            {/* ── form wrapper — shake applied here ── */}
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className={`mt-6 space-y-4 ${shake ? "vb-shake" : ""}`}
            >
              {mode === "signup" && (
                <>
                  {/* First Name / Last Name — 2-col grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="First name" error={errors.firstName} icon={User}>
                      <input
                        className={`${inputBase} pl-10 ${errors.firstName ? "border-rose-300" : "border-slate-300 focus:border-emerald-500"}`}
                        placeholder="Jane"
                        value={form.firstName}
                        onChange={set("firstName")}
                      />
                    </Field>
                    <Field label="Last name" error={errors.lastName}>
                      <input
                        className={`${inputBase} ${errors.lastName ? "border-rose-300" : "border-slate-300 focus:border-emerald-500"}`}
                        placeholder="Cooper"
                        value={form.lastName}
                        onChange={set("lastName")}
                      />
                    </Field>
                  </div>

                  {/* Phone + Country — 2-col grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Phone number" error={errors.phone} icon={Phone}>
                      <input
                        type="tel"
                        className={`${inputBase} pl-10 ${errors.phone ? "border-rose-300" : "border-slate-300 focus:border-emerald-500"}`}
                        placeholder="+91 98765 43210"
                        value={form.phone}
                        onChange={set("phone")}
                      />
                    </Field>
                    <Field label="Country" icon={Globe}>
                      <select
                        className={`${inputBase} pl-10 pr-3 ${errors.country ? "border-rose-300" : "border-slate-300 focus:border-emerald-500"}`}
                        value={form.country}
                        onChange={set("country")}
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </>
              )}

              <Field label="Email" error={errors.email} icon={Mail}>
                <input
                  type="email"
                  className={`${inputBase} pl-10 ${errors.email ? "border-rose-300" : "border-slate-300 focus:border-emerald-500"}`}
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={set("email")}
                />
              </Field>

              <Field label="Password" error={errors.password} icon={Lock}>
                <input
                  type={showPw ? "text" : "password"}
                  className={`${inputBase} pl-10 pr-10 ${errors.password ? "border-rose-300" : "border-slate-300 focus:border-emerald-500"}`}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={set("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </Field>

              {mode === "signup" && (
                <>
                  <Field label="Confirm password" error={errors.confirm} icon={Lock}>
                    <input
                      type={showPw ? "text" : "password"}
                      className={`${inputBase} pl-10 ${errors.confirm ? "border-rose-300" : "border-slate-300 focus:border-emerald-500"}`}
                      placeholder="••••••••"
                      value={form.confirm}
                      onChange={set("confirm")}
                    />
                  </Field>

                  {/* Role selector */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">I am registering as</label>
                    <div className="grid gap-2">
                      {SIGNUP_ROLES.map((r) => {
                        const Icon = r.icon;
                        const active = form.role === r.value;
                        return (
                          <button
                            type="button"
                            key={r.value}
                            onClick={() => set("role")(r.value)}
                            className={`flex items-center gap-3 rounded-lg border px-3.5 py-3 text-left transition ${
                              active
                                ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500/30"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                          >
                            <span className={`grid h-9 w-9 place-items-center rounded-lg ${active ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-slate-900">{r.label}</span>
                              <span className="block truncate text-xs text-slate-500">{r.hint}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      Officers and Managers await Company Admin approval. Vendors and Company Admins require document verification within 3 working days.
                    </p>
                  </div>
                </>
              )}

              {mode === "signin" && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setForgotOpen(true)}
                    className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {mode === "signin" ? "Sign in" : "Create account"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            {/* Demo logins */}
            <div className="mt-8">
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Quick demo access</span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((acc) => {
                  const Icon = acc.icon;
                  return (
                    <button
                      key={acc.role}
                      type="button"
                      onClick={() => quickLogin(acc)}
                      disabled={loading}
                      className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left text-xs font-medium text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50/50 disabled:opacity-60"
                    >
                      <Icon className="h-4 w-4 text-emerald-600" />
                      {acc.role}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ── Forgot Password Modal ───────────────────────── */}
      {forgotOpen && (
        <ForgotPasswordModal onClose={() => setForgotOpen(false)} />
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Forgot Password Modal
   Step 1: enter email → Step 2: sent confirmation
   ══════════════════════════════════════════════════════════════════ */
function ForgotPasswordModal({ onClose }) {
  const [email, setEmail]     = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  const submit = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    setLoading(true);
    /* Replace setTimeout with real API call: await api.sendPasswordReset(email) */
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-sm animate-in fade-in zoom-in-95 overflow-hidden rounded-2xl bg-white shadow-2xl duration-200">

        {/* header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <KeyRound className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Reset password</h3>
              <p className="text-xs text-slate-500">We'll email you a reset link</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5">
          {!sent ? (
            /* ── Step 1: email input ── */
            <>
              <p className="mb-4 text-sm text-slate-600">
                Enter the email address linked to your account and we'll send you a link to reset your password.
              </p>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="you@company.com"
                  className={`w-full rounded-lg border bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
                    error ? "border-rose-300" : "border-slate-300 focus:border-emerald-500"
                  }`}
                />
              </div>
              {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}

              <div className="mt-5 flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submit}
                  disabled={loading}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Send className="h-4 w-4" />}
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </div>
            </>
          ) : (
            /* ── Step 2: sent confirmation ── */
            <div className="flex flex-col items-center py-4 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-7 w-7" />
              </span>
              <h4 className="mt-4 text-base font-semibold text-slate-900">Check your inbox</h4>
              <p className="mt-2 text-sm text-slate-500">
                We've sent a password reset link to{" "}
                <span className="font-medium text-slate-700">{email}</span>.
                It expires in 30 minutes.
              </p>
              <p className="mt-3 text-xs text-slate-400">
                Didn't receive it? Check spam or{" "}
                <button
                  onClick={() => setSent(false)}
                  className="font-medium text-emerald-700 hover:text-emerald-800"
                >
                  try another email
                </button>
                .
              </p>
              <button
                onClick={onClose}
                className="mt-5 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Shared field wrapper
   ══════════════════════════════════════════════════════════════════ */
function Field({ label, error, icon: Icon, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        )}
        {children}
      </div>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
