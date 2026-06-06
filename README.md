<p align="center">
<svg width="800" height="200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#020617"/>
      <stop offset="100%" stop-color="#1E3A8A"/>
    </linearGradient>
  </defs>
  <rect width="800" height="200" rx="12" fill="url(#bg)"/>
  <path d="M0,150 C200,110 400,170 600,130 C700,110 750,140 800,125 L800,200 L0,200 Z" fill="#1E40AF" opacity="0.4"/>
  <path d="M0,165 C150,140 350,175 550,150 C680,135 740,158 800,145 L800,200 L0,200 Z" fill="#3B82F6" opacity="0.25"/>
  <text x="400" y="95" font-family="Segoe UI, Arial, sans-serif" font-size="52" font-weight="700" fill="#60A5FA" text-anchor="middle" letter-spacing="-1">VendorBridge</text>
  <text x="400" y="132" font-family="Segoe UI, Arial, sans-serif" font-size="17" fill="#94A3B8" text-anchor="middle" letter-spacing="3">PROCUREMENT &amp; VENDOR MANAGEMENT ERP</text>
</svg>
</p>

<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&size=18&duration=3000&color=60A5FA&center=true&vCenter=true&width=600&lines=RFQ+→+Quotation+→+Approval+→+PO+→+Invoice;Flask+%2B+React+%2B+MongoDB;Role-Based+Access+Control" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/FRONTEND-REACT+%2B+VITE-60A5FA?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/BACKEND-FLASK+PYTHON-0EA5E9?style=for-the-badge"/>
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
- JWT stored in `localStorage` via `AuthContext`
- "Pending approval" message for unapproved users

### 📊 Dashboard (`Dashboard.jsx`)
- Role-filtered stat cards: total vendors, active RFQs, pending approvals, recent POs, invoices, total spend
- Pending items panel and quick action buttons per role
- Recent activity feed (last 5 log entries)

### 🏪 Vendors (`Vendors.jsx`)
- Vendor table with search, filter by status and category
- Add/Edit modal: name, email, GST, category, contact, compliance document upload
- Vendor profile with RFQ history and reliability indicator
- Admin-only: disable / blacklist vendor

### 📄 RFQ (`RFQ.jsx`)
- Create RFQ: title, line items, quantities, specs, file attachments, deadline, multi-vendor assignment
- Vendor view: only assigned RFQs, deadline countdown, locked after deadline

### 💬 Quotations (`Quotations.jsx`)
- Vendor form: per-item pricing, delivery timeline, notes; editable before deadline
- Officer comparison table: side-by-side grid, lowest price and earliest delivery highlighted
- Vendors cannot see each other's quotations

### ✅ Approvals (`Approvals.jsx`) — Manager Only
- Pending requests with quotation details, price, delivery, vendor info
- Approve or Reject with mandatory remarks; timestamped and attributed

### 📦 Purchase Orders (`PurchaseOrders.jsx`)
- Auto-generated from approved quotation; PO format: `VB-YYYY-MM-0001`
- GST/tax calculation, grand total auto-computed
- Vendors see only their own POs

### 🧾 Invoices (`Invoices.jsx`)
- Generate invoice from PO; PDF via `jsPDF` + `InvoicePDF.jsx` template
- Download, print, and email to vendor; mark as Sent / Paid

### 📋 Activity Logs (`ActivityLogs.jsx`) — Admin Only
- Immutable timeline of all system actions with user, timestamp, module, and description
- Filter by module, date range, user; full-text search

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js + Vite, Tailwind CSS, shadcn/ui |
| PDF | jsPDF + InvoicePDF.jsx template |
| Auth | JWT via AuthContext |
| Backend | Flask (Python) |
| Database | MongoDB |

---

## Project Structure

```
vendorbridge/
├── frontend/src/
│   ├── components/     ← Navbar, Sidebar, StatCard, InvoicePDF, ProtectedRoute
│   ├── pages/          ← Login, Dashboard, Vendors, RFQ, Quotations,
│   │                      Approvals, PurchaseOrders, Invoices, ActivityLogs
│   ├── api/index.js    ← All fetch calls to backend
│   ├── context/AuthContext.jsx
│   └── App.jsx
│
└── backend/
    ├── routes/         ← auth, vendors, rfq, quotations, approvals, purchase_orders, invoices
    ├── models/         ← user, vendor, rfq, quotation, purchase_order, invoice
    ├── config.py       ← MongoDB URI, JWT secret
    └── app.py
```

---

## Getting Started

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
pip install -r requirements.txt
python app.py
```

> Set your MongoDB URI and JWT secret in `backend/config.py` before running.

---

## First-Run Flow

```
1. Register first account → Auto Admin (Active)
2. Register other roles  → Status: Pending
3. Admin approves users  → They can log in
4. Procurement workflow begins
```

---

<p align="center"><sub>Built with Flask · React · MongoDB</sub></p>
