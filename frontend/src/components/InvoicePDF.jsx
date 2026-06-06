import jsPDF from "jspdf";

function formatCurrency(amount) {
  const value = Number(amount ?? 0);
  return `INR ${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Generates and downloads a PDF invoice using jsPDF.
 * Used from Invoices.jsx — not rendered on screen.
 */
export function downloadInvoicePDF(invoice) {
  if (!invoice) return;

  const doc = new jsPDF();
  const lineItems = invoice.lineItems ?? invoice.items ?? [];
  const subtotal = invoice.subtotal ?? lineItems.reduce((sum, item) => sum + (item.total ?? 0), 0);
  const taxAmount = invoice.taxAmount ?? invoice.gstAmount ?? 0;
  const grandTotal = invoice.grandTotal ?? invoice.total ?? subtotal + taxAmount;

  let y = 20;

  doc.setFontSize(18);
  doc.setTextColor(109, 90, 237);
  doc.text("VendorBridge", 14, y);

  doc.setFontSize(22);
  doc.setTextColor(30, 41, 59);
  doc.text("INVOICE", 150, y, { align: "right" });

  y += 12;
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text("Procurement Platform", 14, y);

  y += 16;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y, 196, y);

  y += 12;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.text(`Invoice No: ${invoice.invoiceNumber ?? invoice._id ?? "—"}`, 14, y);
  doc.text(`Date: ${formatDate(invoice.createdAt ?? invoice.date)}`, 14, y + 6);
  doc.text(`Due: ${formatDate(invoice.dueDate)}`, 14, y + 12);
  doc.text(`Status: ${invoice.status ?? "Pending"}`, 14, y + 18);

  y += 30;
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text("BILL TO", 14, y);
  y += 6;
  doc.setTextColor(30, 41, 59);
  doc.text(invoice.vendorName ?? invoice.billTo?.name ?? "—", 14, y);
  doc.text(invoice.vendorAddress ?? invoice.billTo?.address ?? "", 14, y + 5);
  if (invoice.gstNumber) doc.text(`GST: ${invoice.gstNumber}`, 14, y + 10);

  y += 24;
  doc.setFillColor(248, 250, 252);
  doc.rect(14, y - 5, 182, 8, "F");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text("Item", 16, y);
  doc.text("Qty", 90, y);
  doc.text("Unit Price", 110, y);
  doc.text("Tax %", 145, y);
  doc.text("Total", 175, y, { align: "right" });

  y += 8;
  doc.setTextColor(30, 41, 59);
  lineItems.forEach((item) => {
    doc.text(String(item.name ?? item.description ?? "—").slice(0, 30), 16, y);
    doc.text(String(item.quantity ?? item.qty ?? 0), 90, y);
    doc.text(formatCurrency(item.unitPrice ?? item.price), 110, y);
    doc.text(`${item.taxPercent ?? item.tax ?? 0}%`, 145, y);
    doc.text(formatCurrency(item.total), 175, y, { align: "right" });
    y += 7;
  });

  y += 6;
  doc.line(120, y, 196, y);
  y += 8;
  doc.text("Subtotal:", 130, y);
  doc.text(formatCurrency(subtotal), 196, y, { align: "right" });
  y += 6;
  doc.text("GST:", 130, y);
  doc.text(formatCurrency(taxAmount), 196, y, { align: "right" });
  y += 8;
  doc.setFontSize(11);
  doc.setTextColor(109, 90, 237);
  doc.text("Grand Total:", 130, y);
  doc.text(formatCurrency(grandTotal), 196, y, { align: "right" });

  y += 16;
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("Thank you for your business.", 14, y);
  doc.text(invoice.paymentTerms ?? "Payment terms: Net 30 days.", 14, y + 5);
  doc.text("support@vendorbridge.com", 14, y + 10);

  const filename = `invoice-${invoice.invoiceNumber ?? invoice._id ?? "export"}.pdf`;
  doc.save(filename);
}
