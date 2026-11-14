import React from "react";
import { Document, Page, StyleSheet, Text, View, Svg, Path } from "@react-pdf/renderer";
import { normalizeUnderscores } from "./normalizeUnderscore";
import { ULTRA_SIMPLIFIED_FINANCE_COMPANY_IDS } from "../Components/constants/HR";

// react-pdf's <Image> can't rasterize SVG, so the Jagruti logo is drawn with
// native <Svg>/<Path>. Fills are inlined here since react-pdf ignores the
// SVG's <style> class definitions.
const JagrutiLogo = (props) => (
  <Svg viewBox="0 0 45.97 17.14" {...props}>
    <Path fill="#1c4586" fillRule="evenodd" d="M13,7.74a7.51,7.51,0,0,0-4.84,2.44A7.49,7.49,0,0,0,3.31,7.74c2.29,1.64,3.85,4.72,4.83,8.92C9.13,12.46,10.68,9.38,13,7.74Z" />
    <Path fill="#1c4586" fillRule="evenodd" d="M8.14,6.33A1.34,1.34,0,1,1,6.81,7.67,1.33,1.33,0,0,1,8.14,6.33Z" />
    <Path fill="#fbba00" fillRule="evenodd" d="M16.07,4.9c-2.29,1.52-2.42.1-4.23,1.37a5.2,5.2,0,0,1,.62,1c1.2-1.2,2.84-.23,3.61-2.41ZM2.62,4l2.25,1.5a4.72,4.72,0,0,0-.66.68Zm-2.4.38c2.45,1.22,1.3,2.05,3.29,3a5.19,5.19,0,0,1,.6-1C2.47,5.9,2.49,4,.22,4.41ZM3.67,1.15C5.19,3.44,3.77,3.58,5,5.39a5.16,5.16,0,0,1,1-.61C4.87,3.57,5.85,1.93,3.67,1.15ZM5.93,2,7.14,4.43l-.27.09a3.74,3.74,0,0,0-.57.17l-.08,0L5.93,2ZM8.28.06c.18,2.75-1.12,2.16-.92,4.36.21,0,.42,0,.64,0a5.12,5.12,0,0,1,.56,0C8.12,2.76,9.78,1.82,8.28.06ZM9.81,1.88,9.65,4.6l-.94-.21,1.1-2.51Zm3-.45c-1.21,2.47-2,1.31-3,3.31a5.19,5.19,0,0,1,1.05.6c.44-1.65,2.34-1.63,1.92-3.91Zm.41,2.31L11.73,6,11,5.35l2.2-1.61Z" />
    <Path fill="#1c4586" d="M16.8,13.26a2.35,2.35,0,0,1-1.68-.61l.56-1.05a1.44,1.44,0,0,0,1,.41.9.9,0,0,0,.69-.27A1,1,0,0,0,17.6,11V8h1.3v3a2.66,2.66,0,0,1-.17,1,1.66,1.66,0,0,1-.47.69,2,2,0,0,1-.66.38,2.58,2.58,0,0,1-.8.12Zm7.32-.08H22.78l-.29-.94H20.85l-.31.94H19.2L21.08,8h1.21Zm-2.95-2.07h1l-.49-1.53Zm5.74,2.15a2.68,2.68,0,0,1-2-.75,2.55,2.55,0,0,1-.76-1.9A2.55,2.55,0,0,1,25,8.69a2.77,2.77,0,0,1,2-.75,3.28,3.28,0,0,1,1.13.2,2.68,2.68,0,0,1,.9.55l-.83,1a1.76,1.76,0,0,0-1.21-.47,1.35,1.35,0,0,0-1.42,1.4,1.41,1.41,0,0,0,.39,1,1.33,1.33,0,0,0,1,.42,2,2,0,0,0,.64-.11,1.62,1.62,0,0,0,.52-.3v-.45H26.93V10h2.34v2.23a3.29,3.29,0,0,1-2.36,1Zm7.39-.08H32.81l-.91-1.71h-.51v1.71h-1.3V8h2.14a1.87,1.87,0,0,1,1.41.49,1.64,1.64,0,0,1,.48,1.22,1.73,1.73,0,0,1-.24.9,1.54,1.54,0,0,1-.7.63l1.12,1.91Zm-2.08-4h-.83v1.11h.78a.52.52,0,0,0,.55-.27.6.6,0,0,0,0-.58A.48.48,0,0,0,32.22,9.22Zm2.7,2V8h1.31v3.13a.82.82,0,0,0,.22.63A.77.77,0,0,0,37,12a.78.78,0,0,0,.59-.22.85.85,0,0,0,.22-.63V8h1.32v3.15a2.38,2.38,0,0,1-.18,1,1.59,1.59,0,0,1-.49.66,2,2,0,0,1-.67.35,2.56,2.56,0,0,1-.79.12,2.45,2.45,0,0,1-.78-.12,2,2,0,0,1-.68-.35,1.59,1.59,0,0,1-.49-.66,2.35,2.35,0,0,1-.18-1Zm6.23,2V9.28H39.72V8h4.17V9.28H42.46v3.9Zm3.34,0V8H45.8v5.15Z" />
    <Path fill="#666" d="M16.23,16.44H16l-.41-.64h-.22v.64h-.22V14.85h.54A.5.5,0,0,1,16,15a.44.44,0,0,1,.13.33.47.47,0,0,1-.37.46Zm-.57-1.38h-.33v.53h.29a.36.36,0,0,0,.24-.07.28.28,0,0,0,.08-.2.25.25,0,0,0-.07-.19.29.29,0,0,0-.21-.08Zm2,1.38h-1V14.85h1v.21h-.77v.47h.71v.21h-.71v.5h.77v.21Zm.74,0h-.22V14.85h.22v.67h.8v-.67h.21v1.59h-.21v-.71h-.8Zm2.84,0H21L20.88,16h-.61l-.16.41h-.24l.65-1.59h.11Zm-.47-.61-.23-.6-.23.6Zm1.75-.26a.4.4,0,0,1,.22.15.5.5,0,0,1,.08.27.44.44,0,0,1-.13.32.48.48,0,0,1-.36.13H21.7V14.85h.63a.42.42,0,0,1,.32.12.38.38,0,0,1,.12.28.36.36,0,0,1-.06.2A.28.28,0,0,1,22.55,15.57Zm-.25-.52h-.39v.44h.38a.29.29,0,0,0,.19-.06.26.26,0,0,0,.07-.17.18.18,0,0,0-.07-.15.28.28,0,0,0-.18-.06Zm-.39,1.19h.41a.29.29,0,0,0,.22-.08.25.25,0,0,0,.09-.19.25.25,0,0,0-.09-.2.32.32,0,0,0-.23-.08h-.4v.55Zm1.44.2V14.85h.21v1.59Zm1.89,0H24.17V14.85h.21v1.38h.86v.21Zm.43,0V14.85h.21v1.59Zm1.11,0V15.06h-.47v-.21h1.16v.21H27v1.38Zm2.2,0h-.23L28.58,16H28l-.16.41h-.24l.65-1.59h.11Zm-.47-.61-.23-.6-.23.6Zm1,.61V15.06h-.47v-.21h1.16v.21h-.47v1.38Zm1.12,0V14.85h.21v1.59Zm.71-.78a.84.84,0,0,1,.83-.84.77.77,0,0,1,.58.25.78.78,0,0,1,.24.58.8.8,0,0,1-.24.58.82.82,0,0,1-.59.24.82.82,0,0,1-.82-.81Zm1.43,0a.59.59,0,0,0-.18-.44.56.56,0,0,0-.42-.18.58.58,0,0,0-.43.18.65.65,0,0,0,0,.88.58.58,0,0,0,.43.17.57.57,0,0,0,.42-.17.6.6,0,0,0,.18-.44Zm1.79.34V14.85h.21v1.59h-.11l-1-1.13v1.13h-.21V14.85h.1Zm2.59.48a.82.82,0,0,1-.58-.23.79.79,0,0,1-.24-.59.75.75,0,0,1,.25-.59.78.78,0,0,1,.58-.24.77.77,0,0,1,.4.1.71.71,0,0,1,.29.25l-.16.13a.64.64,0,0,0-1-.1.64.64,0,0,0-.17.45.62.62,0,0,0,.17.44.61.61,0,0,0,.43.17.73.73,0,0,0,.3-.07.91.91,0,0,0,.24-.2l.15.13a.75.75,0,0,1-.3.25.86.86,0,0,1-.39.09Zm2.15,0h-1V14.85h1v.2h-.78v.48h.72v.21h-.72v.5h.78v.2ZM40.94,16V14.85h.21v1.59H41l-.95-1.13v1.13h-.22V14.85H40Zm1.11.45V15.06h-.47v-.21h1.16v.21h-.47v1.38Zm2.12,0h-1V14.85h1v.2h-.78v.48h.72v.21h-.72v.5h.78v.2Zm1.63,0h-.26l-.42-.64H44.9v.64h-.21V14.85h.54a.5.5,0,0,1,.37.14.47.47,0,0,1-.24.79Zm-.57-1.39H44.9v.54h.29a.36.36,0,0,0,.24-.07.28.28,0,0,0,.08-.2.29.29,0,0,0-.07-.19.29.29,0,0,0-.21-.08Z" />
  </Svg>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    padding: 10,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#000",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  sheet: { width: "96%" },

  // ── Header ──
  outerBox: { border: "2 solid #000", marginBottom: 6 },
  logoWrap: {
    height: 42,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingLeft: 10,
    paddingTop: 2,
    paddingBottom: 2,
  },
  logoImage: { width: 95, height: 34, objectFit: "contain" },
  titleBar:  { backgroundColor: "#3f5f9f", paddingVertical: 6 },
  subTitle:  { paddingVertical: 8 },

  // ── Info grid ──
  infoBox: { border: "2 solid #000", marginBottom: 6 },
  infoRow: { flexDirection: "row", height: 20, borderBottom: "1 solid #000" },
  cellLabel: {
    width: "20%", borderRight: "1 solid #000",
    paddingHorizontal: 4, paddingVertical: 4, justifyContent: "center",
  },
  cellValue: {
    width: "30%", borderRight: "1 solid #000",
    paddingHorizontal: 4, paddingVertical: 4, justifyContent: "center",
  },
  cellLabelRight: {
    width: "20%", borderRight: "1 solid #000",
    paddingHorizontal: 4, paddingVertical: 4, justifyContent: "center",
  },
  cellValueRight: {
    width: "30%",
    paddingHorizontal: 4, paddingVertical: 4, justifyContent: "center",
  },

  // ── Earnings / Deductions ──
  sectionWrap: { flexDirection: "row", border: "2 solid #000" },
  half:        { width: "50%", borderRight: "1 solid #000" },
  halfLast:    { width: "50%" },

  sectionTitleCell: {
    paddingVertical: 4, borderBottom: "1.5 solid #000", alignItems: "center",
  },
  tableHeader: { flexDirection: "row", borderBottom: "1.5 solid #000", height: 20 },
  thParticulars: {
    width: "63%", borderRight: "1 solid #000",
    paddingHorizontal: 3, paddingVertical: 4, alignItems: "center",
  },
  thAmount: {
    width: "37%",
    paddingHorizontal: 3, paddingVertical: 4, alignItems: "flex-end",
  },
  row: { flexDirection: "row", height: 18, borderBottom: "1 solid #000" },
  tdParticulars: {
    width: "63%", borderRight: "1 solid #000",
    paddingHorizontal: 5, paddingVertical: 3, justifyContent: "center",
  },
  tdAmount: {
    width: "37%", paddingHorizontal: 5, paddingVertical: 3,
    justifyContent: "center", alignItems: "flex-end",
  },
  totalRow: {
    flexDirection: "row", height: 22,
    borderTop: "1.5 solid #000", backgroundColor: "#f0f4ff",
  },
  totalLabelCell: {
    width: "63%", borderRight: "1 solid #000",
    paddingHorizontal: 3, paddingVertical: 4, alignItems: "center",
  },
  totalValueCell: {
    width: "37%", paddingHorizontal: 5, paddingVertical: 4, alignItems: "flex-end",
  },

  // ── PF Breakup ──
  pfBox: { border: "2 solid #000", marginTop: 6 },
  pfTitleCell: { paddingVertical: 4, borderBottom: "1 solid #000", alignItems: "center" },
  pfRow: { flexDirection: "row", height: 20 },
  pfHeaderRow: { flexDirection: "row", height: 20, borderBottom: "1 solid #000" },
  pfCell: {
    width: "33.33%", borderRight: "1 solid #000",
    justifyContent: "center", alignItems: "center",
  },
  pfCellLast: { width: "33.34%", justifyContent: "center", alignItems: "center" },

  // ── Footer ──
  footerBox: {
    borderLeft: "2 solid #000",
    borderRight: "2 solid #000",
    borderBottom: "2 solid #000",
    paddingTop: 6,
    paddingBottom: 6,
  },
  footerRow:       { flexDirection: "row", minHeight: 18, marginBottom: 3 },
  footerLabelCell: { width: "28%", paddingLeft: 20, justifyContent: "center" },
  footerValueCell: { width: "72%", paddingRight: 8,  justifyContent: "center" },

  // ── Text ──
  tBold:     { fontFamily: "Helvetica-Bold" },
  tNormal:   { fontWeight: 400 },
  tSmall:    { fontSize: 9 },
  tSection:  { fontSize: 10, fontFamily: "Helvetica-Bold" },
  tTitle:    { fontSize: 13,  fontFamily: "Helvetica-Bold", color: "#fff", textAlign: "center" },
  tSubTitle: { fontSize: 10.5, fontFamily: "Helvetica-Bold", textAlign: "center" },
  tHeader:   { fontFamily: "Helvetica-Bold", fontSize: 9, textAlign: "center" },
  tHeaderR:  { fontFamily: "Helvetica-Bold", fontSize: 9, textAlign: "right" },
  tTotal:    { fontFamily: "Helvetica-Bold", fontSize: 9.5 },
  tRight:    { textAlign: "right" },
  tItalic:   { fontFamily: "Helvetica-Oblique" },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

// String display: null/undefined/empty → "--"
const dv = (value) =>
  value !== undefined && value !== null && value !== "" ? String(value) : "--";

// Format number as Indian locale; returns null for missing/non-finite values
const fmt = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString("en-IN") : null;
};

// Data rows: null/undefined → "--"; 0 → "Rs. 0"; number → "Rs. X"
const dm = (value) => {
  const f = fmt(value);
  if (f === null) return "--";
  return `Rs. ${f}`;
};

// Totals / Net Pay: always show "Rs. X" including 0
const dmTotal = (value) => {
  const f = fmt(value);
  return f !== null ? `Rs. ${f}` : "Rs. 0";
};

const num = (v) => Number(v) || 0;

const withAdjustment = (base, adjustment) =>
  num(adjustment) > 0 ? num(base) + num(adjustment) : base;

const monthYearLabel = (row) =>
  row?.month && row?.year ? `${row.month} ${row.year}` : "--";

const numberToWordsIndian = (num) => {
  const n = Number(num);
  if (!Number.isFinite(n) || n === 0) return "Zero Only";

  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen",
    "Eighteen", "Nineteen",
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const twoDigits = (x) =>
    x < 20 ? a[x] : `${b[Math.floor(x / 10)]}${x % 10 ? ` ${a[x % 10]}` : ""}`;
  const threeDigits = (x) => {
    let s = "";
    if (Math.floor(x / 100)) s += `${a[Math.floor(x / 100)]} Hundred `;
    if (x % 100)              s += twoDigits(x % 100);
    return s.trim();
  };

  let n2          = Math.floor(n);
  const crore     = Math.floor(n2 / 10000000); n2 %= 10000000;
  const lakh      = Math.floor(n2 / 100000);   n2 %= 100000;
  const thou      = Math.floor(n2 / 1000);     n2 %= 1000;

  const parts = [];
  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh)  parts.push(`${threeDigits(lakh)} Lakh`);
  if (thou)  parts.push(`${threeDigits(thou)} Thousand`);
  if (n2)    parts.push(threeDigits(n2));

  return `${parts.join(" ")} Only`;
};

// ─── Table Row ────────────────────────────────────────────────────────────────

const TRow = ({ label, value }) => (
  <View style={styles.row} wrap={false}>
    <View style={styles.tdParticulars}>
      <Text style={styles.tSmall}>{label}</Text>
    </View>
    <View style={styles.tdAmount}>
      <Text style={[styles.tSmall, styles.tRight]}>{label === "" ? "" : dm(value)}</Text>
    </View>
  </View>
);

// ─── PayslipPdf ───────────────────────────────────────────────────────────────

// ─── Shared pieces (used by all payslip formats) ─────────────────────────────

const PayslipHeader = ({ row }) => (
  <View style={styles.outerBox}>
    <View style={styles.logoWrap}>
      <JagrutiLogo style={styles.logoImage} />
    </View>
    <View style={styles.titleBar}>
      <Text style={styles.tTitle}>
        {row?.center?.title || "Jagruti Rehab Centre"}
      </Text>
    </View>
    <View style={styles.subTitle}>
      <Text style={styles.tSubTitle}>
        Payslip for the month of {monthYearLabel(row)}
      </Text>
    </View>
  </View>
);

const PayslipInfo = ({ row }) => {
const infoRows = [
  [
    "Employee Name",              row?.employeeName,
    "Date of Joining",            row?.joiningDate,
  ],
  [
    "Employee Code",              row?.employeeCode,
    "LOP Days",                   row?.lopDays             ?? "--",
  ],
  [
    "Designation",                normalizeUnderscores(row?.designation),
    "Working Days Attended",      row?.workingDaysAttended ?? "--",
  ],
  [
    "Department",                 row?.department,
    "Payable Days",               row?.payableDays         ?? "--",
  ],
  [
    "Position",                   row?.position?.toUpperCase(),
    "PF Number",                  row?.pfNumber,
  ],
  [
    "PAN",                        row?.pan,
    "UAN No.",                    row?.uanNo,
  ],
  [
    "Beneficiary Account Number", row?.accountNumber,
    "",                           "",
  ],
];

  return (
      <View style={styles.infoBox}>
        {infoRows.map((item, idx) => (
          <View
            key={idx}
            style={[
              styles.infoRow,
              idx === infoRows.length - 1 ? { borderBottom: 0 } : null,
            ]}
            wrap={false}
          >
            <View style={styles.cellLabel}>
              <Text style={styles.tBold}>{dv(item[0])}</Text>
            </View>
            <View style={styles.cellValue}>
              <Text style={styles.tNormal}>{dv(item[1])}</Text>
            </View>
            <View style={styles.cellLabelRight}>
              <Text style={styles.tBold}>{item[2] ? dv(item[2]) : ""}</Text>
            </View>
            <View style={styles.cellValueRight}>
              <Text style={styles.tNormal}>{item[2] ? dv(item[3]) : ""}</Text>
            </View>
          </View>
        ))}
      </View>
  );
};

const PayslipFooter = ({
  netLabel = "Net Pay (E-D)",
  wordsLabel = "Amount in Words",
  noteLabel = "Note :",
  wordsPrefix = "",
  netPay,
}) => (
  <View style={styles.footerBox}>
    <View style={styles.footerRow} wrap={false}>
      <View style={styles.footerLabelCell}>
        <Text style={[styles.tSmall, styles.tBold]}>{netLabel}</Text>
      </View>
      <View style={styles.footerValueCell}>
        <Text style={[styles.tSmall, styles.tBold]}>{dmTotal(netPay)}</Text>
      </View>
    </View>

    <View style={styles.footerRow} wrap={false}>
      <View style={styles.footerLabelCell}>
        <Text style={[styles.tSmall, styles.tBold]}>{wordsLabel}</Text>
      </View>
      <View style={styles.footerValueCell}>
        <Text style={styles.tSmall}>{wordsPrefix}{numberToWordsIndian(netPay)}</Text>
      </View>
    </View>

    <View style={styles.footerRow} wrap={false}>
      <View style={styles.footerLabelCell}>
        <Text style={[styles.tSmall, styles.tBold]}>{noteLabel}</Text>
      </View>
      <View style={styles.footerValueCell}>
        <Text style={[styles.tSmall, styles.tItalic]}>
          This payslip is computer generated, hence no signature is required.
        </Text>
      </View>
    </View>
  </View>
);


const StandardPayslip = ({ row }) => {
  const adjustments = row?.adjustments || {};

  // ── Earnings ──────────────────────────────────────────────────────────────
  // All fields are now top-level on `row` (flattened by backend).
  // null  → field absent in DB  → dm() shows "--"
  // 0     → field present, zero → dm() shows "Rs. 0"
  const earningsRows = [
    { label: "Basic Salary Earned",         value: row?.basicAmount         ?? null },
    { label: "House Rent Allowance Earned", value: row?.HRAAmount           ?? null },
    { label: "Conveyance Allow Earned",     value: row?.conveyanceAllowance ?? null },
    { label: "SPL Allowance Earned",        value: row?.SPLAllowance        ?? null },
    { label: "Statutory Bonus Earned",      value: row?.statutoryBonus      ?? null },
    { label: "Incentive",                   value: row?.incentives          ?? null },
    { label: "Leave Encashment",            value: row?.leaveEncashment     ?? null },
    { label: "Notice Pay out",              value: row?.noticePay           ?? null },
    { label: "Gratuity",                    value: null           ?? null },
    { label: "Other Variable",              value: row?.otherVariable1      ?? null },
    ...[
      { label: "Arrear", value: adjustments.arrear },
      { label: "Reimbursement", value: adjustments.reimbursement },
      { label: "Variable Pay", value: adjustments.variablePay },
      { label: "Other Earnings", value: adjustments.otherEarnings },
      { label: "EL Encashment", value: adjustments.elEncashment },
    ].filter((r) => num(r.value) > 0),
  ];

  // ── Deductions ────────────────────────────────────────────────────────────
  // All keys are now camelCase from the new backend response format.
  const deductionRows = [
    { label: "PF Employee",    value: row?.pfEmployee     ?? null },
    // { label: "PF Employer", value: row?.pfEmployer     ?? null }, // PF Employer hidden from payslip
    { label: "Voluntary PF",   value: withAdjustment(row?.voluntaryPF ?? null, adjustments.voluntaryPF) },
    { label: "PF Arrear",      value: withAdjustment(row?.PFArrears ?? null, adjustments.pfArrear) },
    { label: "Member ESIC",    value: row?.esicEmployee   ?? null },
    { label: "LWF",            value: row?.LWFEmployee    ?? null },
    { label: "PT",             value: row?.PT             ?? null },
    { label: "PT Arrear",      value: withAdjustment(row?.PTArrears ?? null, adjustments.ptArrear) },
    { label: "Salary Advance", value: row?.advanceSalary  ?? null },
    { label: "TDS",            value: row?.TDSAmount      ?? null },
    { label: "Insurance",      value: row?.insurance      ?? null },
    { label: "Other Deductions", value: withAdjustment(row?.otherDeductions ?? null, adjustments.otherDeduction) },
  ];

  const rowCount = Math.max(earningsRows.length, deductionRows.length);
  const padRows = (rows) => [
    ...rows,
    ...Array.from({ length: rowCount - rows.length }, () => ({ label: "", value: undefined })),
  ];

  // ── Totals ─────────────────────────────────────────────────────────────────
  const totalE = Number(row?.grossSalary) || 0;
  const totalD = Number(row?.totalDeductions) || 0;

  // Prefer stored inHandSalary (top-level); fall back to computed
  const netPay =
    row?.inHandSalary != null && Number.isFinite(Number(row.inHandSalary))
      ? Number(row.inHandSalary)
      : totalE - totalD;

  // ── PF Breakup ────────────────────────────────────────────────────────────
  const hasPF = row?.pfApplicable === true;
  const pfEmployeeVal = Number(row?.pfEmployee) || 0;
  const pfEmployerVal = Number(row?.pfEmployer) || 0;
  const totalPF = pfEmployeeVal + pfEmployerVal;

  return (
    <Document>
      <Page size="A4" orientation="portrait" style={styles.page}>
        <View style={styles.sheet}>

          <PayslipHeader row={row} />

          <PayslipInfo row={row} />

          {/* ── Earnings & Deductions side by side ─────────────────────── */}
          <View style={styles.sectionWrap}>

            {/* Left — Earnings */}
            <View style={styles.half}>
              <View style={styles.sectionTitleCell}>
                <Text style={styles.tSection}>Earnings</Text>
              </View>
              <View style={styles.tableHeader} wrap={false}>
                <View style={styles.thParticulars}>
                  <Text style={styles.tHeader}>Particulars</Text>
                </View>
                <View style={styles.thAmount}>
                  <Text style={styles.tHeaderR}>Amount</Text>
                </View>
              </View>
              {padRows(earningsRows).map((r, i) => (
                <TRow key={i} label={r.label} value={r.value} />
              ))}
              <View style={styles.totalRow} wrap={false}>
                <View style={styles.totalLabelCell}>
                  <Text style={styles.tTotal}>Total (E)</Text>
                </View>
                <View style={styles.totalValueCell}>
                  <Text style={[styles.tTotal, styles.tRight]}>{dmTotal(totalE)}</Text>
                </View>
              </View>
            </View>

            {/* Right — Deductions */}
            <View style={styles.halfLast}>
              <View style={styles.sectionTitleCell}>
                <Text style={styles.tSection}>Deductions</Text>
              </View>
              <View style={styles.tableHeader} wrap={false}>
                <View style={styles.thParticulars}>
                  <Text style={styles.tHeader}>Particulars</Text>
                </View>
                <View style={styles.thAmount}>
                  <Text style={styles.tHeaderR}>Amount</Text>
                </View>
              </View>
              {padRows(deductionRows).map((r, i) => (
                <TRow key={i} label={r.label} value={r.value} />
              ))}
              <View style={styles.totalRow} wrap={false}>
                <View style={styles.totalLabelCell}>
                  <Text style={styles.tTotal}>Total (D)</Text>
                </View>
                <View style={styles.totalValueCell}>
                  <Text style={[styles.tTotal, styles.tRight]}>{dmTotal(totalD)}</Text>
                </View>
              </View>
            </View>
          </View>

          <PayslipFooter netPay={netPay} />

          {/* ── PF Breakup ─────────────────────────────────────────────── */}
          {hasPF && (
            <View style={styles.pfBox}>
              <View style={styles.pfTitleCell}>
                <Text style={styles.tSection}>Provident Fund (PF) Breakup</Text>
              </View>
              <View style={styles.pfHeaderRow} wrap={false}>
                <View style={styles.pfCell}>
                  <Text style={styles.tHeader}>PF Employee</Text>
                </View>
                <View style={styles.pfCell}>
                  <Text style={styles.tHeader}>PF Employer</Text>
                </View>
                <View style={styles.pfCellLast}>
                  <Text style={styles.tHeader}>Total PF</Text>
                </View>
              </View>
              <View style={styles.pfRow} wrap={false}>
                <View style={styles.pfCell}>
                  <Text style={styles.tSmall}>{dm(pfEmployeeVal)}</Text>
                </View>
                <View style={styles.pfCell}>
                  <Text style={styles.tSmall}>{dm(pfEmployerVal)}</Text>
                </View>
                <View style={styles.pfCellLast}>
                  <Text style={[styles.tSmall, styles.tBold]}>{dm(totalPF)}</Text>
                </View>
              </View>
            </View>
          )}

        </View>
      </Page>
    </Document>
  );
};


// ─── Consultant / Intern formats ──────────────────────────────────────────────

const TableHalf = ({ title, rows, totalLabel, total, last }) => (
  <View style={last ? styles.halfLast : styles.half}>
    <View style={styles.sectionTitleCell}>
      <Text style={styles.tSection}>{title}</Text>
    </View>
    <View style={styles.tableHeader} wrap={false}>
      <View style={styles.thParticulars}>
        <Text style={styles.tHeader}>Particulars</Text>
      </View>
      <View style={styles.thAmount}>
        <Text style={styles.tHeaderR}>Amount</Text>
      </View>
    </View>
    {rows.map((r, i) => (
      <TRow key={i} label={r.label} value={r.value} />
    ))}
    <View style={styles.totalRow} wrap={false}>
      <View style={styles.totalLabelCell}>
        <Text style={styles.tTotal}>{totalLabel}</Text>
      </View>
      <View style={styles.totalValueCell}>
        <Text style={[styles.tTotal, styles.tRight]}>{dmTotal(total)}</Text>
      </View>
    </View>
  </View>
);

const SimplifiedPayslip = ({ row, cfg }) => {
  const adjustments = row?.adjustments || {};
  const incentives = num(row?.incentives);
  const arrear = num(adjustments.arrear);
  const reimbursement = num(adjustments.reimbursement);
  const variablePay = num(adjustments.variablePay);
  const otherEarnings = num(adjustments.otherEarnings);
  const elEncashment = num(adjustments.elEncashment);
  const gross = num(row?.grossSalary);
  const totalD = num(row?.totalDeductions);
  const netPay =
    row?.inHandSalary != null && Number.isFinite(Number(row.inHandSalary))
      ? Number(row.inHandSalary)
      : gross - totalD;

  const derivedFee = Math.max(
    gross - incentives - arrear - reimbursement - variablePay - otherEarnings - elEncashment,
    0
  );


  const fee =
    num(row?.baseCompensation) > 0
      ? num(row.baseCompensation)
      : cfg.useStoredFee && num(row?.consultantFee) > 0
        ? num(row.consultantFee)
        : derivedFee;

  const earningsRows = [
    { label: cfg.feeLabel, value: fee },
    { label: cfg.incentiveLabel, value: incentives },
    { label: "Reimbursement (if any)", value: reimbursement },
    { label: cfg.arrearLabel, value: arrear },
    ...(variablePay > 0 ? [{ label: "Variable Pay", value: variablePay }] : []),
    ...(otherEarnings > 0 ? [{ label: "Other Earnings", value: otherEarnings }] : []),
    ...(elEncashment > 0 ? [{ label: "EL Encashment", value: elEncashment }] : []),
  ];

  const deductionValues = {
    TDSAmount: num(row?.TDSAmount),
    advanceSalary: num(row?.advanceSalary),
    PTArrears: num(row?.PTArrears) + num(adjustments.ptArrear),
    PFArrears: num(row?.PFArrears) + num(adjustments.pfArrear),
    voluntaryPF: num(row?.voluntaryPF) + num(adjustments.voluntaryPF),
    otherDeductions: num(row?.otherDeductions) + num(adjustments.otherDeduction),
    insurance: num(row?.insurance),
  };
  const deductionRows = cfg.deductionFields.map(([label, key]) => ({
    label,
    value: deductionValues[key],
  }));

  const rowCount = Math.max(earningsRows.length, deductionRows.length) + 1;
  const pad = (rows) => [
    ...rows,
    ...Array.from({ length: rowCount - rows.length }, () => ({ label: "", value: undefined })),
  ];

  return (
    <Document>
      <Page size="A4" orientation="portrait" style={styles.page}>
        <View style={styles.sheet}>
          <PayslipHeader row={row} />
          <PayslipInfo row={row} />

          <View style={styles.sectionWrap}>
            <TableHalf
              title="Earnings"
              rows={pad(earningsRows)}
              totalLabel={cfg.earningsTotalLabel}
              total={gross}
            />
            <TableHalf
              title="Deductions"
              rows={pad(deductionRows)}
              totalLabel="Total Deductions"
              total={totalD}
              last
            />
          </View>

          <PayslipFooter
            netLabel={cfg.netLabel}
            wordsLabel="Amount in Words:"
            noteLabel="Note:"
            wordsPrefix="Rupees "
            netPay={netPay}
          />
        </View>
      </Page>
    </Document>
  );
};

const CONSULTANT_CFG = {
  feeLabel: "Consultant / Professional Fee",
  incentiveLabel: "Incentive",
  arrearLabel: "Arrear (if any)",
  earningsTotalLabel: "Gross Payment",
  useStoredFee: true,
  deductionFields: [
    ["TDS", "TDSAmount"],
    ["Advance Recovery", "advanceSalary"],
    ["PT Arrear", "PTArrears"],
    ["PF Arrear", "PFArrears"],
    ["Voluntary PF", "voluntaryPF"],
    ["Insurance", "insurance"],
    ["Other Recovery", "otherDeductions"],
  ],
  netLabel: "Net Amount Payable:",
};

const INTERN_CFG = {
  feeLabel: "Monthly Compensation",
  incentiveLabel: "Incentives",
  arrearLabel: "Arrears (if any)",
  earningsTotalLabel: "Total Earnings",
  useStoredFee: false,
  deductionFields: [
    ["Advance Recovery", "advanceSalary"],
    ["PT Arrear", "PTArrears"],
    ["PF Arrear", "PFArrears"],
    ["Voluntary PF", "voluntaryPF"],
    ["Insurance", "insurance"],
    ["Other Recoveries", "otherDeductions"],
  ],
  netLabel: "Net Stipend Payable:",
};

const ConsultantPayslip = ({ row }) => <SimplifiedPayslip row={row} cfg={CONSULTANT_CFG} />;
const InternPayslip = ({ row }) => <SimplifiedPayslip row={row} cfg={INTERN_CFG} />;

// ─── Format selection by employment type ─────────────────────────────────────

const PayslipPdf = ({ row }) => {
  // ultraSimplifiedFinance companies (e.g. Sareyaan) force every employee's
  // finance onto the simplified CTC + In Hand model regardless of
  // employmentType, so their payslip always uses the Intern-style simplified
  // layout too — the FULL_TIME/full-breakup layout would just render zeros.
  if (ULTRA_SIMPLIFIED_FINANCE_COMPANY_IDS.includes(row?.company)) {
    return <InternPayslip row={row} />;
  }

  switch ((row?.employmentType || "").trim().toUpperCase()) {
    case "CONSULTANT":
      return <ConsultantPayslip row={row} />;
    case "INTERN":
      return <InternPayslip row={row} />;
    default:
      // FULL_TIME, CONSULTANT_SESSION, CONTRACTUAL, etc. keep the existing layout
      return <StandardPayslip row={row} />;
  }
};

export default PayslipPdf;
