import React from "react";

// Shared by the chart of accounts screens (Ledger Types, Sub Types, Ledgers, Chart of Accounts)

export const tableCustomStyles = {
  headRow: { style: { backgroundColor: "#fff", borderBottom: "1px solid #edeff3", minHeight: "44px" } },
  headCells: { style: { fontSize: "13px", fontWeight: 600, color: "#475569" } },
  rows: {
    style: {
      minHeight: "56px",
      fontSize: "14px",
      color: "#101828",
      "&:not(:last-of-type)": { borderBottomColor: "#edeff3" },
    },
    highlightOnHoverStyle: { backgroundColor: "#fafbfc", borderBottomColor: "#edeff3", outline: "none" },
  },
  pagination: { style: { borderTopColor: "#edeff3", fontSize: "13px", color: "#667085" } },
};

export const STATUS_LABELS = { active: "Active", inactive: "Inactive", archived: "Archived" };

export const StatusPill = ({ status }) => (
  <span className={`uom-status-pill status-${status === "active" ? "active" : "inactive"}`}>
    <span className="dot"></span> {STATUS_LABELS[status] || status}
  </span>
);

// The side of the balance, as it is written in the accounts (DR / CR)
export const BALANCE_LABELS = { debit: "Debit (DR)", credit: "Credit (CR)", per_ledger: "Set on each ledger", not_set: "Not set" };
export const sideShort = (v) => (v === "debit" ? "DR" : v === "credit" ? "CR" : "—");

export const CONTROL_TYPES = [
  { value: "vendor", label: "Vendors (payables)" },
  { value: "customer", label: "Customers (receivables)" },
  { value: "bank", label: "Bank accounts" },
  { value: "employee", label: "Employees" },
  { value: "other", label: "Other" },
];

export const errText = (error, fallback) => error?.response?.data?.message || error?.message || fallback;

export const money = (n) => Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const dateFmt = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { timeZone: "UTC" }) : "—");

export const VOUCHER_TYPE_LABELS = {
  MANUAL_JOURNAL: "Journal Voucher",
  GRN: "Goods Receipt",
  GRN_RETURN: "GRN Return",
  VENDOR_INVOICE: "Vendor Invoice",
  VENDOR_DEBIT_NOTE: "Vendor Debit Note",
  VENDOR_PAYMENT: "Vendor Payment",
  PAYMENT: "Payment",
  CWIP: "CWIP",
  ASSET_CAPITALIZATION: "Asset Capitalization",
  MATERIAL_ISSUE: "Material Issue",
  MATERIAL_RETURN: "Material Return",
  STOCK_ADJUSTMENT: "Stock Adjustment",
};

export const newRequestId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
