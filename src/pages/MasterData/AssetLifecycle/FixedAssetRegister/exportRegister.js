import * as XLSX from "xlsx";

// Excel export for the Fixed Assets Register. It exports exactly what the screen is showing now
// (the search and filters are applied). An empty cost or date is left blank, never written as 0.

const dmy = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "");
const money = (n) => (typeof n === "number" && Number.isFinite(n) ? n : "");

// "All assets": one row per asset
export const registerRows = (assets, statusLabel) =>
  (assets || []).map((a) => ({
    "Asset Number": a.assetTag || "",
    "Asset Name": a.assetName || "",
    Category: a.category || "",
    "Serial / Identifier": a.serialNumber || "",
    Tag: a.tag?.tagCode || "",
    Site: a.centerId?.title || "",
    Status: statusLabel(a),
    "Assigned To": a.assignedTo?.name || "",
    "Employee Code": a.assignedTo?.eCode || "",
    "Assigned Since": dmy(a.assignedAt),
    "Purchase Cost": money(a.purchaseCost),
    "Purchase Date": dmy(a.purchaseDate),
    "Added On": dmy(a.createdAt),
    Remarks: a.remarks || "",
  }));

// "Who has what": one row per asset, with the employee in front
export const whoHasWhatRows = (groups, statusLabel) =>
  (groups || []).flatMap((g) =>
    g.items.map((a) => ({
      Employee: g.emp?.name || "",
      "Employee Code": g.emp?.eCode || "",
      "Assets Held": g.items.length,
      "Asset Number": a.assetTag || "",
      "Asset Name": a.assetName || "",
      Category: a.category || "",
      "Serial / Identifier": a.serialNumber || "",
      Tag: a.tag?.tagCode || "",
      "Assigned Since": dmy(a.assignedAt),
      Status: statusLabel(a),
    })),
  );

// Makes the .xlsx and downloads it. Column widths follow the longest value.
export const downloadExcel = (rows, sheetName, fileName) => {
  const sheet = XLSX.utils.json_to_sheet(rows);
  const headers = Object.keys(rows[0] || {});
  sheet["!cols"] = headers.map((h) => ({
    wch: Math.min(42, Math.max(h.length, ...rows.map((r) => String(r[h] ?? "").length)) + 2),
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, String(sheetName).slice(0, 31));
  XLSX.writeFile(wb, fileName);
};
