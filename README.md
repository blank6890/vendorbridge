<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:020617,50:0F172A,100:2563EB&height=240&section=header&text=VendorBridge&fontSize=60&fontColor=60A5FA&animation=fadeIn&desc=Procurement%20%26%20Vendor%20Management%20ERP&descSize=22&descAlignY=75&descFontColor=94A3B8" />
</p>

<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com?size=22&duration=3000&color=60A5FA&center=true&vCenter=true&width=900&lines=Procurement+%26+Vendor+Management+ERP;RFQ+→+Quotation+→+Approval+→+PO+→+Invoice;Role-Based+Access+Control+(RBAC);Flask+%2B+React+%2B+MongoDB+Stack" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/FRONTEND-REACT+%2B+VITE-60A5FA?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/BACKEND-FLASK+%28PYTHON%29-0EA5E9?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/DATABASE-MONGODB-22C55E?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/AUTH-JWT-F59E0B?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/STYLING-TAILWIND+CSS-38BDF8?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/PDF-jsPDF-EF4444?style=for-the-badge"/>
</p>

---

## About

**VendorBridge** is a full-stack enterprise procurement ERP that digitizes the end-to-end procurement cycle — from vendor onboarding and RFQ creation through quotation comparison, manager approvals, purchase order generation, and invoice delivery. Built on a **React + Vite** frontend with a **Flask (Python)** backend and **MongoDB** database.

---

## Procurement Pipeline

```text
Vendor Onboarded (Admin Approved)
           ↓
Procurement Officer Creates RFQ
           ↓
Vendors Assigned → Submit Quotations
           ↓
Officer Compares Quotations → Selects Best
           ↓
Submitted for Manager Approval
           ↓
Manager Approves / Rejects
           ↓
Officer Generates Purchase Order
           ↓
Officer Generates Invoice → Sends to Vendor
           ↓
System Logs Activity → Updates Analytics
           ↓
Admin Monitors Everything
```

---

## User Roles & Access

| Role | Purpose | Key Permissions |
|---|---|---|
| **Admin** | System & user management | Approve users, manage vendors, view all records & logs |
| **Procurement Officer** | Run procurement cycle | Create RFQs, compare quotations, generate POs & invoices |
| **Manager** | Approval authority | Review & approve/reject procurement requests |
| **Vendor** | Supply quotations | View assigned RFQs, submit quotations, view own POs & invoices |

> The **first user to register** is automatically granted Admin status (Active). All subsequent users start as **Pending** until approved by Admin.

---

## Pages & Features

### 🔐 Login / Signup (`Login.jsx`)
- Email + password login and signup forms
- Role selector on signup (Admin / Officer / Manager / Vendor)
- JWT token stored in `localStorage` via `AuthContext`
- "Pending approval" message shown to unapproved users
- Field-level validation and loading states

### 📊 Dashboard (`Dashboard.jsx`)
- Role-filtered stat cards via `StatCard.jsx` (total vendors, active RFQs, pending approvals, recent POs, invoices, total spend)
- Pending items panel: user approvals (Admin), procurement requests (Manager), RFQs nearing deadline
- Quick actions: Create RFQ (Officer), Add Vendor (Admin/Officer), View Approvals (Manager), View My RFQs (Vendor)
- Recent activity feed from the last 5 log entries

### 🏪 Vendors (`Vendors.jsx`)
- Vendor table with name, category, status, GST/Tax ID, contact
- Search by name/category; filter by status (Active / Suspended / Blacklisted / Onboarding) and category
- Add/Edit vendor modal: name, email, phone, GST number, category, contact person, compliance document upload
- Full vendor profile view with RFQ + quotation history, reliability indicator
- Admin-only: disable / blacklist vendor

### 📄 RFQ (`RFQ.jsx`)
- RFQ list with title, deadline, status, and vendor count; search and filter (Open / Closed / Expired)
- Create RFQ form (Officer): title, line items with quantities, specifications, file attachments, deadline picker, multi-vendor assignment
- Vendor view: only their assigned RFQs, deadline countdown badge, locked after deadline

### 💬 Quotations (`Quotations.jsx`)
- Vendor quotation form: per-item pricing, delivery timeline, notes; editable before deadline, locked after
- Officer comparison table: side-by-side vendor grid, lowest price and earliest delivery highlighted, sort/filter, select preferred quotation, submit for approval
- Vendors cannot see each other's quotations

### ✅ Approvals (`Approvals.jsx`) — Manager Only
- Pending procurement requests list with selected quotation details, price summary, delivery timeline, and vendor info
- Approve (with confirmation) or Reject (with mandatory remark) actions
- Timestamped, attributed to approving user's ID
- Full approval history timeline with status badges

### 📦 Purchase Orders (`PurchaseOrders.jsx`)
- PO list: PO number, vendor, amount, status (Draft / Issued / Delivered), date
- Auto-generated from approved quotation data; PO number format: `VB-YYYY-MM-0001`
- GST/tax calculation with grand total auto-computed
- Issue PO to vendor; status updates (In Transit / Delivered)
- Vendors see only their own POs

### 🧾 Invoices (`Invoices.jsx`)
- Invoice list with number, vendor, amount, status (Generated / Sent / Paid), date
- Generate invoice from PO; tax + total auto-calculated
- PDF generation via `jsPDF` using `InvoicePDF.jsx` template
- Download, print, and email invoice directly to vendor
- Mark invoice status (Sent / Paid)

### 📋 Activity Logs (`ActivityLogs.jsx`) — Admin Only
- Immutable chronological timeline of all system actions
- Each entry: user ID, name, timestamp, module label (LOGIN, RFQ, PO_GENERATION, etc.), action description
- Filter by module/action type, date range, user; full-text search
- Covers: logins, RFQ operations, quotation submissions, approvals, PO and invoice events, document edits

---

## Tech Stack

### Frontend
| Technology | Role |
|---|---|
| React.js + Vite | UI framework and build tool |
| Tailwind CSS | Utility-first styling |
| shadcn/ui | Component library (`/components/ui/`) |
| jsPDF | Client-side PDF generation for invoices |
| React Context API | Auth state and role management |

### Backend
| Technology | Role |
|---|---|
| Flask (Python) | REST API server |
| PyMongo / MongoDB | Database and ODM |
| JWT | Authentication tokens |

### Project Structure

```
vendorbridge/
├── frontend/
│   └── src/
│       ├── components/       ← Navbar, Sidebar, StatCard, InvoicePDF, ProtectedRoute
│       ├── pages/            ← Login, Dashboard, Vendors, RFQ, Quotations,
│       │                        Approvals, PurchaseOrders, Invoices, ActivityLogs
│       ├── api/index.js      ← Centralised fetch calls to backend
│       ├── context/AuthContext.jsx
│       └── App.jsx           ← All routes
│
└── backend/
    ├── routes/               ← auth, vendors, rfq, quotations, approvals,
    │                            purchase_orders, invoices
    ├── models/               ← user, vendor, rfq, quotation, purchase_order, invoice
    ├── config.py             ← MongoDB URI, JWT secret
    └── app.py                ← Flask entry point
```

---

## Getting Started

### Prerequisites
- Node.js ≥ 18
- Python ≥ 3.10
- MongoDB (local or Atlas)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

> Configure `backend/config.py` with your MongoDB URI and JWT secret before running.

---

## Signup & First-Run Flow

```
1. Register the first account → Auto-promoted to Admin (Active)
2. Register Vendor / Manager / Officer accounts → Status: Pending
3. Admin logs in → Approves pending users
4. Approved users log in and begin procurement workflows
```

---

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:2563EB,50:0F172A,100:020617&height=120&section=footer"/>
</p>
