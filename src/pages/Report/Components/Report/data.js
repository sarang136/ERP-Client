// A Pine Labs terminal payment is saved as mode CARD or UPI with bank account
// "pinelabs".
export const isPinelabs = (payment) =>
  String(payment?.bankAccount || "").trim().toLowerCase() === "pinelabs";

// The payment mode to SHOW for one payment row in the reports (table and CSV).
// Pine Labs payments read "Pinelabs" instead of the mode, and show no card
// number / transaction id. Everything else shows its mode as stored
// (receipts/deposits use `paymentMode`, OPD invoice receipts use `type`).
export const paymentModeLabel = (payment) =>
  isPinelabs(payment) ? "Pinelabs" : payment?.paymentMode || payment?.type || "";

export const ALL_TRANSACTIONS = "ALL_TRANSACTIONS";
export const ADVANCE_PAYMENT = "ADVANCE_PAYMENT";
export const DEPOSIT = "DEPOSIT";
export const INVOICE = "INVOICE";
export const DUE_AMOUNT = "DUE_AMOUNT";
export const OPD_BILL = "OPD_BILL";
export const ALL_REFERRELS = "ALL_REFERRELS";
export const ADDMISSION_DATE = "ADDMISSION_DATE";
export const DISCHARGE_DATE = "DISCAHRGE_DATE";
export const ADMIT_PATIENT = "ADMIT_PATIENT";
export const DISCHARGE_PATIENT = "DISCHARGE_PATIENT";
export const INTERN = "INTERN";
export const ONLINE_OPD = "ONLINE_OPD";

export const payments = [
  { label: "All Transactions", value: ALL_TRANSACTIONS },
  { label: "IPD Payment", value: ADVANCE_PAYMENT },
  { label: "IPD Deposit", value: DEPOSIT },
  { label: "IPD Invoice", value: INVOICE },
  { label: "IPD Due Amount", value: DUE_AMOUNT },
  { label: "OPD Bills", value: OPD_BILL },
  { label: "Interns", value: INTERN },
  { label: "Online OPD", value: ONLINE_OPD },
];

export const calendar = ["Daily", "Monthly", "Pre Doctor", "Pre Procedure"];

export const allTransactionHeaders = [
  { label: "Date", key: "date" },
  { label: "Updated At", key: "updatedAt" },
  { label: "Patient/Intern", key: "name" },
  { label: "UID", key: "uid" },
  { label: "Type", key: "type" },
  { label: "Bill", key: "bill" },
  { label: "Center", key: "center.title" },
  { label: "Invoice Number", key: "invoiceNumber" },
  { label: "Invoiced Amount (₹Dr)", key: "invoice.payable" },
  { label: "Refund Amount (₹Dr)", key: "invoice.refund" },
  { label: "Payment Modes", key: "paymentModes" },
  { label: "Paid Amount (₹Cr)", key: "advancePayment.totalAmount" },
];

export const allTransactionHeadersAddmissionDischargeDate = [
  { label: "Date", key: "date" },
  { label: "Updated At", key: "updatedAt" },
  { label: "Patient/Intern", key: "name" },
  { label: "UID", key: "uid" },
  { label: "Type", key: "type" },
  { label: "Bill", key: "bill" },
  { label: "Center", key: "center.title" },
  { label: "Date of Admission", key: "dateOfAddmission" },
  { label: "Invoice Number", key: "invoiceNumber" },
  { label: "Invoiced Amount (₹Dr)", key: "invoice.payable" },
  { label: "Payment Modes", key: "paymentModes" },
  { label: "Paid Amount (₹Cr)", key: "advancePayment.totalAmount" },
];

export const dueAmountHeaders = [
  { label: "Patient/Intern", key: "name" },
  { label: "Center", key: "patient.center.title" },
  { label: "UID", key: "uid" },
  { label: "Date of Admission", key: "dateOfAddmission" },
  // { label: "Date of Discharge", key: "dateOfDischarge" },
  { label: "Total Invoiced Amount (₹Dr)", key: "totalPayable" },
  { label: "Total Paid Amount (₹Cr)", key: "totalAdvancePayment" },
  { label: "Total Due Amount", key: "dueAmount" },
];

// const dueAmountHeadersDiagnosis = [
//   { label: "Patient Name", key: "patient.name"
// { label: "Type", key: "type" }, },
// { label: "Center", key: "center.title" }
//   { label: "Date of Addmission", key: "dateOfAddmission" },
//   { label: "Date of Discharge", key: "dateOfDischarge" },
//   { label: "Diagnosis", key: "dischargeSummary.diagnosis" },
//   { label: "Total Invoiced Amount (₹Dr)", key: "invoice.payable" },
//   { label: "Total Paid Amount (₹Cr)", key: "advancePayment.totalAmount" },
//   { label: "Total Due Amount", key: "dueAmount" },
// ];

export const advancePaymentHeaders = [
  { label: "Date", key: "date" },
  { label: "Updated At", key: "updatedAt" },
  { label: "Patient/Intern", key: "name" },
  { label: "UID", key: "uid" },
  { label: "Type", key: "type" },
  { label: "Bill", key: "bill" },
  { label: "Center", key: "center.title" },
  { label: "Invoice Number", key: "invoiceNumber" },
  { label: "Refund Amount (₹Dr)", key: "invoice.refund" },
  { label: "Payment Modes", key: "paymentModes" },
  { label: "Paid Amount (₹Cr)", key: "advancePayment.totalAmount" },
];

export const advancePaymentHeadersAddmissionDischargeDate = [
  { label: "Date", key: "date" },
  { label: "Updated At", key: "updatedAt" },
  { label: "Patient/Intern", key: "name" },
  { label: "UID", key: "uid" },
  { label: "Type", key: "type" },
  { label: "Bill", key: "bill" },
  { label: "Center", key: "center.title" },
  { label: "Date of Admission", key: "dateOfAddmission" },
  // { label: "Date of Discharge", key: "dateOfDischarge" },
  { label: "Invoice Number", key: "invoiceNumber" },
  { label: "Payment Modes", key: "paymentModes" },
  { label: "Paid Amount (₹Cr)", key: "advancePayment.totalAmount" },
];

// IPD Deposit — the IPD Payment columns, with the deposit's own amount.
export const depositHeaders = [
  { label: "Date", key: "date" },
  { label: "Updated At", key: "updatedAt" },
  { label: "Patient/Intern", key: "name" },
  { label: "UID", key: "uid" },
  { label: "Type", key: "type" },
  { label: "Bill", key: "bill" },
  { label: "Center", key: "center.title" },
  { label: "Invoice Number", key: "invoiceNumber" },
  { label: "Payment Modes", key: "paymentModes" },
  { label: "Paid Amount (₹Cr)", key: "deposit.totalAmount" },
];

export const depositHeadersAddmissionDischargeDate = [
  { label: "Date", key: "date" },
  { label: "Updated At", key: "updatedAt" },
  { label: "Patient/Intern", key: "name" },
  { label: "UID", key: "uid" },
  { label: "Type", key: "type" },
  { label: "Bill", key: "bill" },
  { label: "Center", key: "center.title" },
  { label: "Date of Admission", key: "dateOfAddmission" },
  { label: "Invoice Number", key: "invoiceNumber" },
  { label: "Payment Modes", key: "paymentModes" },
  { label: "Paid Amount (₹Cr)", key: "deposit.totalAmount" },
];

export const payableAmountHeaders = [
  { label: "Date", key: "date" },
  { label: "Updated At", key: "updatedAt" },
  { label: "Patient/Intern", key: "name" },
  { label: "UID", key: "uid" },
  { label: "Type", key: "type" },
  { label: "Bill", key: "bill" },
  { label: "Center", key: "center.title" },
  { label: "Invoice Number", key: "invoiceNumber" },
  { label: "Invoiced Amount (₹Dr)", key: "invoice.payable" },
];

export const payableAmountHeadersAddmissionDischargeDate = [
  { label: "Date", key: "date" },
  { label: "Updated At", key: "updatedAt" },
  { label: "Patient/Intern", key: "name" },
  { label: "UID", key: "uid" },
  { label: "Type", key: "type" },
  { label: "Bill", key: "bill" },
  { label: "Center", key: "center.title" },
  { label: "Date of Admission", key: "dateOfAddmission" },
  // { label: "Date of Discharge", key: "dateOfDischarge" },
  { label: "Invoice Number", key: "invoiceNumber" },
  { label: "Invoiced Amount (₹Dr)", key: "invoice.payable" },
];

export const opdBillHeaders = [
  { label: "Date", key: "date" },
  { label: "Updated At", key: "updatedAt" },
  { label: "Patient/Intern", key: "name" },
  { label: "UID", key: "uid" },
  { label: "Type", key: "type" },
  { label: "Bill", key: "bill" },
  { label: "Center", key: "center.title" },
  { label: "Invoice Number", key: "invoiceNumber" },
  { label: "Invoiced Amount (₹Dr)", key: "invoice.payable" },
];
