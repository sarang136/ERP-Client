import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { Button, Input } from "reactstrap";
import { toast } from "react-toastify";
import {
  getAssetCategories,
  deleteAssetCategory,
} from "../../../helpers/backend_helper.js";
import { exportCategories } from "./exportCategories.js";
import { useAuthError } from "../../../Components/Hooks/useAuthError.js";
import { usePermissions } from "../../../Components/Hooks/useRoles.js";
import "../UnitOfMeasurement/uom.scss";

const tableCustomStyles = {
  headRow: {
    style: { backgroundColor: "#fff", borderBottom: "1px solid #edeff3", minHeight: "44px" },
  },
  headCells: { style: { fontSize: "13px", fontWeight: 600, color: "#475569" } },
  rows: {
    style: {
      minHeight: "56px",
      fontSize: "14px",
      color: "#101828",
      "&:not(:last-of-type)": { borderBottomColor: "#edeff3" },
    },
    highlightOnHoverStyle: {
      backgroundColor: "#fafbfc",
      borderBottomColor: "#edeff3",
      outline: "none",
    },
  },
  pagination: { style: { borderTopColor: "#edeff3", fontSize: "13px", color: "#667085" } },
};

const StatusPill = ({ status }) => (
  <span className={`uom-status-pill status-${status}`}>
    <span className="dot"></span> {status === "active" ? "Active" : "Inactive"}
  </span>
);

// Ancestor column labels for each level, ordered L1 -> L(level-1)
const ANCESTOR_LABELS = {
  2: ["Main Category (L1)"],
  3: ["Main Category (L1)", "Asset Name (L2)"],
  4: ["Main Category (L1)", "Asset Name (L2)", "Brand (L3)"],
};

// What the "current" record's own name column should be called at each level
const CURRENT_LABELS = {
  1: "Main Category (L1)",
  2: "Asset Name (L2)",
  3: "Brand (L3)",
  4: "Model (L4)",
};

// What sits directly under a category of each level
// Walks up the populated parentCategoryId chain and returns names ordered L1 -> L(level-1)
const getAncestorChain = (row) => {
  const chain = [];
  let p = row.parentCategoryId;
  while (p) {
    chain.unshift(p.name || "—");
    p = p.parentCategoryId;
  }
  return chain;
};

const AssetCategoryList = ({ level, onAdd, onEdit }) => {
  const handleAuthError = useAuthError();
  const token = JSON.parse(localStorage.getItem("micrologin"))?.token;
  const { hasPermission } = usePermissions(token);
  const canCreate = hasPermission("MASTERDATA", "ASSET_CATEGORY", "WRITE");
  const canEdit = hasPermission("MASTERDATA", "ASSET_CATEGORY", "WRITE");
  const canDelete = hasPermission("MASTERDATA", "ASSET_CATEGORY", "DELETE");

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [exporting, setExporting] = useState(false);

  // The export has the whole tree (every level), whichever level page you are on.
  // It is fetched only when you click Export.
  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const res = await getAssetCategories({});
      const all = res?.data || [];
      if (all.length === 0) {
        toast.error("No categories to export");
        return;
      }
      const count = exportCategories(all);
      toast.success(`Exported ${count} rows`);
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(error?.response?.data?.message || error?.message || "Couldn't export categories.");
      }
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const res = await getAssetCategories({ level, search });
        if (cancelled) return;
        setCategories(res?.data || []);
      } catch (error) {
        if (cancelled) return;
        if (!handleAuthError(error)) {
          toast.error(error?.response?.data?.message || error?.message || "Couldn't load categories.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchCategories();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, search, refreshFlag]);

  const handleDelete = async (id) => {
    try {
      await deleteAssetCategory(id);
      toast.success("Category deleted successfully");
      setRefreshFlag((f) => f + 1);
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(error?.response?.data?.message || error?.message || "Couldn't delete category.");
      }
    }
  };

  const ancestorColumns = (ANCESTOR_LABELS[level] || []).map((label, idx) => ({
    name: label,
    cell: (row) => (
      <span className="uom-cell-muted">{getAncestorChain(row)[idx] || "—"}</span>
    ),
  }));

  const columns = [
    ...ancestorColumns,
    {
      name: CURRENT_LABELS[level] || "Name",
      selector: (row) => row.name,
      sortable: true,
      cell: (row) => <span className="uom-cell-primary">{row.name}</span>,
    },
    {
      name: "Code",
      cell: (row) => (row.code ? <span className="uom-symbol-badge">{row.code}</span> : <span className="uom-cell-muted">—</span>),
    },
    {
      name: "Countable",
      width: "120px",
      cell: (row) =>
        row.isCountable ? (
          <span className="uom-status-pill status-active">Yes</span>
        ) : (
          <span className="uom-cell-muted">No</span>
        ),
    },
    {
      name: "Useful Life",
      width: "120px",
      selector: (row) => (row.usefulLifeYears ? `${row.usefulLifeYears} yrs` : "—"),
    },
    {
      name: "Status",
      width: "120px",
      cell: (row) => <StatusPill status={row.status} />,
    },
    {
      name: "Actions",
      width: "120px",
      right: true,
      cell: (row) => (
        <div className="d-flex gap-2">
          {canEdit && (
            <Button size="sm" color="light" onClick={() => onEdit(row)}>
              <i className="bx bx-edit-alt"></i>
            </Button>
          )}
          {canDelete && (
            <Button size="sm" color="light" onClick={() => handleDelete(row._id)}>
              <i className="bx bx-trash text-danger"></i>
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="uom-search-wrap mb-0">
          <i className="bx bx-search"></i>
          <Input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="d-flex gap-2">
          <Button color="light" onClick={handleExport} disabled={exporting} title="Download the full category tree (all levels)">
            <i className="bx bx-download me-1"></i> {exporting ? "Exporting..." : "Export"}
          </Button>
          {canCreate && (
            <Button color="primary" onClick={onAdd}>
              <i className="bx bx-plus me-1"></i> Add Asset Category L{level}
            </Button>
          )}
        </div>
      </div>

      <div className="uom-table-card">
        <DataTable
          columns={columns}
          data={categories}
          customStyles={tableCustomStyles}
          progressPending={loading}
          pagination
          highlightOnHover
          noDataComponent={
            <div className="uom-empty-state">
              <p className="uom-empty-title">No categories found</p>
              <p className="uom-empty-sub">Try adjusting your search, or add your first category.</p>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default AssetCategoryList;