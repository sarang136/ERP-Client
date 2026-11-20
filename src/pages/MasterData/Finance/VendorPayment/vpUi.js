import React from "react";
export { money, errText, dateText, dateInput, todayInput, supplierName, tableCustomStyles, newRequestId } from "../VendorInvoice/viUi";

export const PAY_TABS = [
  { key: "open", label: "Open" },
  { key: "needs_approval", label: "Needs approval" },
  { key: "ready_to_pay", label: "Approved" },
  { key: "paid", label: "Paid" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

const STATUS = {
  pending_approval: { label: "Needs approval", cls: "bg-warning-subtle text-warning" },
  approved: { label: "Approved, not paid", cls: "bg-info-subtle text-info" },
  failed: { label: "Failed", cls: "bg-danger-subtle text-danger" },
  paid: { label: "Paid", cls: "bg-success-subtle text-success" },
  rejected: { label: "Rejected", cls: "bg-danger-subtle text-danger" },
  cancelled: { label: "Cancelled", cls: "bg-secondary-subtle text-secondary" },
};

export const PayPill = ({ status }) => {
  const s = STATUS[status] || { label: status, cls: "bg-secondary-subtle text-secondary" };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
};
