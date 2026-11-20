import React from "react";
import { getLedgers } from "../../../../helpers/backend_helper";
export { tableCustomStyles } from "../Accounting/ledgerUi";

export const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const errText = (error, fallback) => error?.response?.data?.message || error?.message || fallback;

export const dateText = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");
export const dateInput = (d) => (d ? String(d).slice(0, 10) : "");
export const todayInput = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${String(d.getDate()).padStart(2, "0")}`;
};

export const TYPE_LABELS = {
  tax_invoice: "Tax invoice",
  proforma: "Proforma",
  advance: "Advance",
};

export const INVOICE_TYPES = [
  { value: "tax_invoice", label: "Tax invoice", hint: "Issued against an approved PO" },
  { value: "proforma", label: "Proforma", hint: "Estimate before goods or services" },
  { value: "advance", label: "Advance", hint: "Pre-payment against a PO" },
];

// The tabs of the list, in order
export const STAGE_TABS = [
  { key: "", label: "All" },
  { key: "open", label: "Open" },
  { key: "awaiting_approval", label: "Awaiting approval" },
  { key: "approved", label: "Approved" },
  { key: "ready_to_request", label: "Ready to request" },
  { key: "in_payment", label: "In payment" },
  { key: "paid", label: "Paid" },
  { key: "rejected", label: "Rejected" },
];

const STAGE_STYLE = {
  open: { label: "Open", cls: "bg-secondary-subtle text-secondary" },
  awaiting_approval: { label: "Awaiting approval", cls: "bg-warning-subtle text-warning" },
  approved: { label: "Approved", cls: "bg-success-subtle text-success" }, // an approved proforma: an estimate, never paid
  ready_to_request: { label: "Ready to request", cls: "bg-success-subtle text-success" },
  in_payment: { label: "In payment", cls: "bg-info-subtle text-info" },
  paid: { label: "Paid", cls: "bg-success-subtle text-success" },
  rejected: { label: "Rejected", cls: "bg-danger-subtle text-danger" },
};

export const StagePill = ({ stage }) => {
  const s = STAGE_STYLE[stage] || STAGE_STYLE.open;
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
};

export const fileSize = (bytes) => {
  const n = Number(bytes) || 0;
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(n / 1024))} KB`;
};

// A request id makes a double click post the bill only once
export const newRequestId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `vi-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const supplierName = (v) => v?.tradeName || v?.legalName || "—";

// Every active posting ledger, page by page (the server gives at most 200 at a time)
export const fetchPostingLedgers = async () => {
  const all = [];
  for (let page = 1; page <= 20; page++) {
    const res = await getLedgers({ kind: "posting", status: "active", limit: 200, page });
    const rows = res?.data || [];
    all.push(...rows);
    if (rows.length < 200) break;
  }
  return all;
};
