import * as XLSX from "xlsx";

// Excel export of exactly what the Inventory screen is showing now: the tab, the Site filter and the search are applied.

const dmy = (d) => (d ? new Date(d).toLocaleString("en-IN") : "");

export const inventoryExportRows = (rows) =>
  (rows || []).map((r) => ({
    Status: r.statusLabel,
    Item: r.itemName,
    Quantity: r.quantity,
    Site: r.fromTitle || "",
    "Destination Site": r.toTitle || "",
    "Transfer #": r.transferNumber || "",
    "Last Updated": dmy(r.updatedAt),
  }));

export const exportInventory = (rows, tabLabel) => {
  const data = inventoryExportRows(rows);
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = Object.keys(data[0] || {}).map((k) => ({ wch: Math.max(14, k.length + 2) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, tabLabel.slice(0, 30));
  XLSX.writeFile(wb, `inventory-${tabLabel.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  return data.length;
};
