import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function formatCurrency(amount) {
  const value = Number(amount ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusVariant(status = "") {
  const normalized = status.toLowerCase();
  if (normalized === "paid" || normalized === "active") return "active";
  if (normalized === "pending") return "pending";
  if (normalized === "rejected" || normalized === "overdue") return "rejected";
  return "closed";
}

export default function PrintInvoice({ invoice, className }) {
  if (!invoice) return null;

  const lineItems = invoice.lineItems ?? invoice.items ?? [];
  const subtotal = invoice.subtotal ?? lineItems.reduce((sum, item) => sum + (item.total ?? 0), 0);
  const taxAmount = invoice.taxAmount ?? invoice.gstAmount ?? 0;
  const grandTotal = invoice.grandTotal ?? invoice.total ?? subtotal + taxAmount;

  return (
    <div className={cn("print-invoice mx-auto max-w-3xl bg-white p-8 text-slate-900", className)}>
      <header className="mb-8 flex items-start justify-between border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-vb-primary text-sm font-bold text-white">
              VB
            </div>
            <div>
              <p className="text-lg font-medium">VendorBridge</p>
              <p className="text-sm text-slate-500">Procurement Platform</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-medium tracking-wide text-vb-primary">INVOICE</p>
          <Badge variant={statusVariant(invoice.status)} className="mt-2">
            {invoice.status ?? "Pending"}
          </Badge>
        </div>
      </header>

      <section className="mb-8 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            Invoice Details
          </p>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Invoice No.</dt>
              <dd className="font-medium">{invoice.invoiceNumber ?? invoice._id}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Date</dt>
              <dd>{formatDate(invoice.createdAt ?? invoice.date)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Due Date</dt>
              <dd>{formatDate(invoice.dueDate)}</dd>
            </div>
            {invoice.poNumber ? (
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">PO Number</dt>
                <dd>{invoice.poNumber}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Bill To</p>
          <div className="text-sm">
            <p className="font-medium">{invoice.vendorName ?? invoice.billTo?.name}</p>
            <p className="text-slate-600">{invoice.vendorAddress ?? invoice.billTo?.address}</p>
            {invoice.gstNumber ? (
              <p className="mt-1 text-slate-600">GST: {invoice.gstNumber}</p>
            ) : null}
            {invoice.vendorEmail ? (
              <p className="text-slate-600">{invoice.vendorEmail}</p>
            ) : null}
          </div>
        </div>
      </section>

      <table className="mb-8 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left">
            <th className="px-3 py-2 font-medium">Item</th>
            <th className="px-3 py-2 font-medium">Qty</th>
            <th className="px-3 py-2 font-medium">Unit Price</th>
            <th className="px-3 py-2 font-medium">Tax %</th>
            <th className="px-3 py-2 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((item, index) => (
            <tr key={item._id ?? index} className="border-b border-slate-100">
              <td className="px-3 py-2">{item.name ?? item.description}</td>
              <td className="px-3 py-2">{item.quantity ?? item.qty}</td>
              <td className="px-3 py-2">{formatCurrency(item.unitPrice ?? item.price)}</td>
              <td className="px-3 py-2">{item.taxPercent ?? item.tax ?? 0}%</td>
              <td className="px-3 py-2 text-right">{formatCurrency(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="mb-8 flex justify-end">
        <dl className="w-full max-w-xs space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Subtotal</dt>
            <dd>{formatCurrency(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">GST</dt>
            <dd>{formatCurrency(taxAmount)}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-medium">
            <dt>Grand Total</dt>
            <dd className="text-vb-primary">{formatCurrency(grandTotal)}</dd>
          </div>
        </dl>
      </section>

      <footer className="border-t border-slate-200 pt-6 text-sm text-slate-500">
        <p className="font-medium text-slate-700">Thank you for your business.</p>
        <p className="mt-1">
          Payment terms: {invoice.paymentTerms ?? "Net 30 days from invoice date."}
        </p>
        <p className="mt-1">support@vendorbridge.com · +91 98765 43210</p>
      </footer>
    </div>
  );
}

export function printInvoiceElement() {
  window.print();
}
