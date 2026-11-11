import * as XLSX from "xlsx";

// Excel export of the whole asset category tree, one row per path:
// Main Category (L1) > Asset Name (L2) > Brand (L3) > Model (L4).
// A category that has nothing under it still gets its own row, so nothing is missing from the file.

const LEVEL_LABELS = {
  1: "Main Category (L1)",
  2: "Asset Name (L2)",
  3: "Brand (L3)",
  4: "Model (L4)",
};

export const buildChildrenMap = (all) => {
  const map = {};
  (all || []).forEach((c) => {
    const parentId = c.parentCategoryId?._id || c.parentCategoryId;
    if (!parentId) return;
    (map[parentId] = map[parentId] || []).push(c);
  });
  Object.values(map).forEach((list) =>
    list.sort((a, b) => (a.name || "").localeCompare(b.name || "")),
  );
  return map;
};

export const categoryRows = (all) => {
  const childrenOf = buildChildrenMap(all);
  const roots = (all || [])
    .filter((c) => c.level === 1)
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  const rows = [];
  const walk = (node, path) => {
    const nextPath = [...path, node];
    const kids = childrenOf[node._id] || [];
    if (kids.length === 0) {
      const row = {};
      for (let lvl = 1; lvl <= 4; lvl += 1) {
        const n = nextPath[lvl - 1];
        row[LEVEL_LABELS[lvl]] = n?.name || "";
        row[`L${lvl} Code`] = n?.code || "";
      }
      const leaf = nextPath[nextPath.length - 1];
      row["Deepest Level"] = `L${leaf.level}`;
      row["Countable"] = leaf.isCountable ? "Yes" : "No";
      row["Useful Life (yrs)"] = leaf.usefulLifeYears || "";
      row.Status = leaf.status === "active" ? "Active" : "Inactive";
      rows.push(row);
      return;
    }
    kids.forEach((k) => walk(k, nextPath));
  };
  roots.forEach((r) => walk(r, []));
  return rows;
};

export const exportCategories = (all) => {
  const rows = categoryRows(all);
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = Object.keys(rows[0] || {}).map((k) => ({ wch: Math.max(14, k.length + 2) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Asset Categories");
  XLSX.writeFile(wb, `asset-categories-${new Date().toISOString().slice(0, 10)}.xlsx`);
  return rows.length;
};
