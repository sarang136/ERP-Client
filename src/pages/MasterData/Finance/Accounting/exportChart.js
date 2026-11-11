import * as XLSX from "xlsx";

// Excel export of the chart of accounts in the same three-sheet layout the HiSYNC chart of accounts
// export uses (Ledger Types, Ledger Sub Types, Ledgers), so the file can go either way.

const DR_CR = (v) => (v === "debit" ? "DR" : v === "credit" ? "CR" : "");
const YN = (b) => (b ? "Y" : "N");

export const exportChart = ({ types, subTypes, ledgers }) => {
  const typeName = Object.fromEntries(types.map((t) => [String(t._id), t.name]));
  const subTypeName = Object.fromEntries(subTypes.map((s) => [String(s._id), s.name]));
  const codeOf = Object.fromEntries(ledgers.map((l) => [String(l._id), l.ledgerCode]));

  const typeRows = types.map((t) => ({
    name: t.name,
    normal_balance_type: DR_CR(t.normalBalance),
    description: t.description || "",
    series_start: t.seriesStart,
    series_end: t.seriesEnd,
  }));
  const subTypeRows = subTypes.map((s) => ({
    ledger_type: typeName[String(s.ledgerTypeId)] || "",
    name: s.name,
    description: s.description || "",
    series_start: s.seriesStart,
    series_end: s.seriesEnd,
  }));
  const ledgerRows = ledgers.map((l) => ({
    ledger_code: l.ledgerCode,
    ledger_name: l.name,
    sub_type: subTypeName[String(l.ledgerSubTypeId)] || "",
    ledger_type: typeName[String(l.ledgerTypeId)] || "",
    parent_ledger_code: l.parentLedgerId ? codeOf[String(l.parentLedgerId)] || "" : "",
    balance_type: DR_CR(l.normalBalanceType),
    financial_statement: l.financialStatementGroup || "",
    is_group_account: YN(l.postingType === "group"),
    is_active: YN(l.status === "active"),
    opening_balance: l.postingType === "group" ? 0 : l.openingBalance || 0,
    currency: l.currencyCode || "INR",
    description: l.notes || "",
  }));

  const wb = XLSX.utils.book_new();
  [
    ["Ledger Types", typeRows],
    ["Ledger Sub Types", subTypeRows],
    ["Ledgers", ledgerRows],
  ].forEach(([name, rows]) => {
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = Object.keys(rows[0] || {}).map((k) => ({ wch: Math.max(14, k.length + 2) }));
    XLSX.utils.book_append_sheet(wb, ws, name);
  });
  XLSX.writeFile(wb, `chart-of-accounts-${new Date().toISOString().slice(0, 10)}.xlsx`);
  return ledgerRows.length;
};
