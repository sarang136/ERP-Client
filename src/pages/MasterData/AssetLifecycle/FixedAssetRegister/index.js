import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { Button, Input, Modal, ModalBody } from "reactstrap";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import {
  getFixedAssets,
  getFixedAsset,
  updateFixedAsset,
  createFixedAsset,
  createAssetWriteOffRequest,
  assignFixedAsset,
  returnFixedAsset,
  searchEmployeesForAsset,
  getAssetCategories,
} from "../../../../helpers/backend_helper";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { usePermissions } from "../../../../Components/Hooks/useRoles.js";
import { useReferenceList } from "../../../../Components/Hooks/useReferenceData";
import { useDebounce } from "../../../../Components/Hooks/useDebounce";
import CategoryLevelSelect, {
  EMPTY_CATEGORY,
} from "../shared/CategoryLevelSelect";
import {
  DASH,
  categoryPath,
  moneyOrDash,
  errText,
  useBusy,
} from "../shared/assetUi";
import { registerRows, whoHasWhatRows, downloadExcel } from "./exportRegister";
import "../../UnitOfMeasurement/uom.scss";

const dateFmt = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "—");

const SOURCE_LABEL = {
  manual: "Manual",
  verification: "Verification",
  capitalization: "Capitalization",
  import: "Import",
};
const idOf = (v) => (v && typeof v === "object" ? v._id : v || "");

const STATUS_META = {
  active: {
    label: "Active",
    cls: "status-active",
    icon: "bx-check-circle",
    color: "#12b76a",
  },
  under_maintenance: {
    label: "Under Maintenance",
    cls: "status-draft",
    icon: "bx-wrench",
    color: "#f79009",
  },
  written_off: {
    label: "Written Off",
    cls: "status-blacklisted",
    icon: "bx-x-circle",
    color: "#f04438",
  },
};

const Field = ({ label, value }) => (
  <div className="col-sm-6">
    <div className="text-muted" style={{ fontSize: 12 }}>
      {label}
    </div>
    <div
      className="fw-semibold"
      style={{ fontSize: 14, wordBreak: "break-word" }}
    >
      {value}
    </div>
  </div>
);

const StatusPill = ({ status }) => {
  const s = STATUS_META[status] || STATUS_META.active;
  return (
    <span className={`uom-status-pill ${s.cls}`}>
      <span className="dot"></span> {s.label}
    </span>
  );
};

const FixedAssetRegister = () => {
  const handleAuthError = useAuthError();
  const token = JSON.parse(localStorage.getItem("micrologin"))?.token;
  const { hasPermission } = usePermissions(token);
  const canEdit = hasPermission("MASTERDATA", "FIXED_ASSET", "WRITE");

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [assignFilter, setAssignFilter] = useState("ALL"); // ALL | assigned | in_stock

  // More filters (done by the server)
  const EMPTY_FILTERS = { centerId: "", categoryL1: "", status: "", fromDate: "", toDate: "" };
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const debouncedFilters = useDebounce(filters, 400);
  const debouncedSearch = useDebounce(search, 400);
  const [loadError, setLoadError] = useState("");
  const { items: centers } = useReferenceList("centers");
  const [level1, setLevel1] = useState([]);

  // The list can be shown as one row per asset, or grouped by employee ("who has what")
  const [viewMode, setViewMode] = useState("list"); // list | byEmployee
  const [groupSearch, setGroupSearch] = useState("");
  const [minAssets, setMinAssets] = useState(""); // "who has what": only employees holding at least this many
  const [groupSort, setGroupSort] = useState("most"); // most | name
  const [expandedEmps, setExpandedEmps] = useState(() => new Set()); // employees whose full list is open
  const toggleEmp = (id) =>
    setExpandedEmps((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // "Held by": pick an employee to see everything that is assigned to them
  const [holder, setHolder] = useState(null); // { _id, name, eCode }
  const [holderQuery, setHolderQuery] = useState("");
  const [holderResults, setHolderResults] = useState([]);
  const [holderOpen, setHolderOpen] = useState(false);
  const [holderSearching, setHolderSearching] = useState(false);
  useEffect(() => {
    const q = holderQuery.trim();
    if (q.length < 2) {
      setHolderResults([]);
      setHolderSearching(false);
      return undefined;
    }
    setHolderSearching(true);
    const t = setTimeout(() => {
      searchEmployeesForAsset(q)
        .then((res) => setHolderResults(res?.data || []))
        .catch(() => setHolderResults([]))
        .finally(() => setHolderSearching(false));
    }, 350);
    return () => clearTimeout(t);
  }, [holderQuery]);
  const pickHolder = (emp) => {
    setHolder({ _id: emp._id, name: emp.name, eCode: emp.eCode });
    setHolderQuery("");
    setHolderResults([]);
    setHolderOpen(false);
  };

  const filtersOn =
    Object.values(filters).some(Boolean) ||
    !!minAssets ||
    !!groupSearch.trim() ||
    assignFilter !== "ALL" ||
    !!holder;
  const setFilter = (key) => (e) =>
    setFilters((f) => ({ ...f, [key]: e.target.value }));

  // Edit identifiers, cost and depreciation of an existing asset
  const [editForm, setEditForm] = useState(null);
  const [editCategory, setEditCategory] = useState(EMPTY_CATEGORY);
  const [savingEdit, runSaveEdit] = useBusy();

  // Extra fields on the Add Asset form
  const [addCategory, setAddCategory] = useState(EMPTY_CATEGORY);
  const [addSettings, setAddSettings] = useState({
    isComplete: false,
    canAssign: true,
    identifierLabel: "",
  });

  const [detailModal, setDetailModal] = useState(null);
  const [detailTab, setDetailTab] = useState("overview");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Add asset
  const EMPTY_FORM = {
    centerId: "",
    assetName: "",
    category: "",
    serialNumber: "",
    remarks: "",
  };
  const [disposeFor, setDisposeFor] = useState(null); // the asset being discarded / sold
  const [disposeForm, setDisposeForm] = useState({
    disposalType: "write_off",
    reason: "",
    estValue: "",
    buyerName: "",
    centerId: "",
  });
  const [needSite, setNeedSite] = useState(false); // shown only when the server cannot find the asset's site
  const [disposing, runDispose] = useBusy();
  const [addModal, setAddModal] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [saving, runCreate] = useBusy();

  // Assign / return
  const [empQuery, setEmpQuery] = useState("");
  const [empResults, setEmpResults] = useState([]);
  const [assignRemarks, setAssignRemarks] = useState("");
  const [returnCondition, setReturnCondition] = useState("good");
  const [returnRemarks, setReturnRemarks] = useState("");
  const [assigning, setAssigning] = useState(false);
  const assignLock = React.useRef(false); // checked at once, so a very fast double click sends one request

  useEffect(() => {
    if (empQuery.trim().length < 2) {
      setEmpResults([]);
      return undefined;
    }
    const t = setTimeout(() => {
      searchEmployeesForAsset(empQuery.trim())
        .then((res) => setEmpResults(res?.data || []))
        .catch(() => setEmpResults([]));
    }, 400);
    return () => clearTimeout(t);
  }, [empQuery]);

  const fail = (error, fallback) => {
    if (!handleAuthError(error)) {
      toast.error(error?.response?.data?.message || error?.message || fallback);
    }
  };

  const openDetail = (row) => {
    setEmpQuery("");
    setEmpResults([]);
    setAssignRemarks("");
    setReturnCondition("good");
    setReturnRemarks("");
    setDetailTab("overview");
    setDetailModal(row);
    // The list does not carry the assignment history, so load the full record
    getFixedAsset(row._id)
      .then((res) => {
        if (res?.data)
          setDetailModal((cur) => (cur?._id === res.data._id ? res.data : cur));
      })
      .catch(() => {});
  };

  const handleCreate = () =>
    runCreate(async () => {
      const f = addForm;
      if (!addCategory.categoryL1 || !f.assetName.trim() || !f.centerId) {
        toast.error("Category, asset name and site are required");
        return;
      }
      if (!addSettings.isComplete) {
        toast.error("Choose the category down to the last level");
        return;
      }
      const levels = {};
      ["categoryL1", "categoryL2", "categoryL3", "categoryL4"].forEach((k) => {
        if (addCategory[k]) levels[k] = addCategory[k];
      });
      try {
        await createFixedAsset({
          assetName: f.assetName.trim(),
          serialNumber: f.serialNumber.trim(),
          centerId: f.centerId,
          remarks: f.remarks.trim(),
          ...levels,
        });
        toast.success("Asset added");
        setAddModal(false);
        setAddForm(EMPTY_FORM);
        setAddCategory(EMPTY_CATEGORY);
        setRefreshFlag((n) => n + 1);
      } catch (error) {
        fail(error, "Couldn't add asset.");
      }
    });

  const openDispose = (asset) => {
    setDisposeForm({
      disposalType: "write_off",
      reason: "",
      estValue: "",
      buyerName: "",
      centerId: idOf(asset.centerId),
    });
    setNeedSite(false);
    setDisposeFor(asset);
  };

  const handleDispose = () =>
    runDispose(async () => {
      const f = disposeForm;
      if (!f.reason.trim()) return toast.error("Write the reason");
      if (f.disposalType === "sale" && !f.buyerName.trim())
        return toast.error("Enter the buyer name for a sale");
      try {
        const res = await createAssetWriteOffRequest({
          title: `${f.disposalType === "sale" ? "Sale" : "Write-off"}: ${disposeFor.assetName}`,
          centerId: f.centerId || undefined,
          items: [
            {
              assetId: disposeFor._id,
              disposalType: f.disposalType,
              reason: f.reason.trim(),
              estValue: Number(f.estValue) || 0,
              buyerName:
                f.disposalType === "sale" ? f.buyerName.trim() : undefined,
            },
          ],
        });
        toast.success(
          `Request ${res?.data?.requestNumber || ""} raised. It needs approval on the Asset Write-Off page`,
        );
        const id = disposeFor._id;
        setDisposeFor(null);
        setRefreshFlag((n) => n + 1);
        const full = await getFixedAsset(id).catch(() => null);
        if (full?.data) setDetailModal(full.data);
      } catch (error) {
        if (/no site/i.test(error?.response?.data?.message || ""))
          setNeedSite(true);
        fail(error, "Couldn't raise the request.");
      }
    });

  const handleAssign = async (asset, employee) => {
    if (assignLock.current) return;
    assignLock.current = true;
    setAssigning(true);
    try {
      await assignFixedAsset(asset._id, {
        employeeId: employee._id,
        remarks: assignRemarks,
      });
      toast.success(`Assigned to ${employee.name}`);
      setDetailModal(null);
      setRefreshFlag((n) => n + 1);
    } catch (error) {
      fail(error, "Couldn't assign.");
    } finally {
      assignLock.current = false;
      setAssigning(false);
    }
  };

  const handleReturn = async (asset) => {
    if (assignLock.current) return;
    assignLock.current = true;
    setAssigning(true);
    try {
      const res = await returnFixedAsset(asset._id, {
        condition: returnCondition,
        remarks: returnRemarks,
      });
      // the server says if a write-off request was raised (damaged or lost)
      toast.success(res?.message || "Asset received back");
      setDetailModal(null);
      setRefreshFlag((n) => n + 1);
    } catch (error) {
      fail(error, "Couldn't mark as returned.");
    } finally {
      assignLock.current = false;
      setAssigning(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError("");
    const df = debouncedFilters;
    getFixedAssets({
      search: debouncedSearch,
      centerId: df.centerId || undefined,
      categoryL1: df.categoryL1 || undefined,
      fromDate: df.fromDate || undefined,
      toDate: df.toDate || undefined,
      assignedTo: holder?._id || undefined,
      // a chosen employee already means "assigned", and must not be widened to "anyone assigned"
      assignment: viewMode === "byEmployee" && !holder ? "assigned" : undefined,
      // "Active" and "Under maintenance" are asset statuses, "Retired" and "Sold" are how it ended
      status: ["active", "under_maintenance"].includes(df.status)
        ? df.status
        : undefined,
      lifecycleStatus: ["retired", "sold"].includes(df.status)
        ? df.status
        : undefined,
    })
      .then((res) => {
        if (!cancelled) setAssets(res?.data || []);
      })
      .catch((error) => {
        if (cancelled) return;
        if (!handleAuthError(error)) {
          setLoadError(errText(error, "Couldn't load assets."));
          toast.error(
            error?.response?.data?.message ||
              error?.message ||
              "Couldn't load assets.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, refreshFlag, debouncedFilters, holder?._id, viewMode]);

  useEffect(() => {
    getAssetCategories({ level: 1, status: "active" })
      .then((res) => setLevel1(res?.data || []))
      .catch(() => {});
  }, []);

  // Fill the edit section whenever another asset (or a fresh copy of it) is opened
  useEffect(() => {
    if (!detailModal) {
      setEditForm(null);
      return;
    }
    const d = detailModal;
    setEditForm({
      assetName: d.assetName || "",
      serialNumber: d.serialNumber || "",
      remarks: d.remarks || "",
      centerId: idOf(d.centerId),
      assetCode: d.assetCode || "",
      epcCode: d.epcCode || "",
      barcode: d.barcode || "",
      purchaseCost: d.purchaseCost ?? "",
      purchaseDate: d.purchaseDate
        ? new Date(d.purchaseDate).toISOString().slice(0, 10)
        : "",
      accumulatedDepreciation: d.accumulatedDepreciation ?? "",
      currentYearDepreciation: d.currentYearDepreciation ?? "",
    });
    setEditCategory({
      categoryL1: idOf(d.categoryL1),
      categoryL2: idOf(d.categoryL2),
      categoryL3: idOf(d.categoryL3),
      categoryL4: idOf(d.categoryL4),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailModal?._id]);

  const handleSaveEdit = (d) =>
    runSaveEdit(async () => {
      const f = editForm;
      const body = {};
      if (!f.assetName.trim()) return toast.error("Asset name cannot be empty");
      if (f.assetName.trim() !== (d.assetName || ""))
        body.assetName = f.assetName.trim();
      if (f.serialNumber.trim() !== (d.serialNumber || ""))
        body.serialNumber = f.serialNumber.trim();
      if (f.remarks.trim() !== (d.remarks || ""))
        body.remarks = f.remarks.trim();
      if (f.centerId && f.centerId !== idOf(d.centerId))
        body.centerId = f.centerId;
      ["assetCode", "epcCode", "barcode"].forEach((k) => {
        if (f[k].trim() !== (d[k] || "")) body[k] = f[k].trim(); // "" clears it
      });
      ["accumulatedDepreciation", "currentYearDepreciation"].forEach((k) => {
        const before = d[k] ?? "";
        if (String(f[k]) !== String(before))
          body[k] = f[k] === "" ? "" : Number(f[k]);
      });
      if (
        f.purchaseCost !== "" &&
        String(f.purchaseCost) !== String(d.purchaseCost ?? "")
      )
        body.purchaseCost = Number(f.purchaseCost);
      const dateBefore = d.purchaseDate
        ? new Date(d.purchaseDate).toISOString().slice(0, 10)
        : "";
      if (f.purchaseDate && f.purchaseDate !== dateBefore)
        body.purchaseDate = f.purchaseDate;
      const levels = ["categoryL1", "categoryL2", "categoryL3", "categoryL4"];
      if (levels.some((k) => (editCategory[k] || "") !== idOf(d[k]))) {
        levels.forEach((k) => {
          body[k] = editCategory[k] || "";
        });
      }
      if (Object.keys(body).length === 0)
        return toast.info("Nothing was changed");
      try {
        const res = await updateFixedAsset(d._id, body);
        toast.success(res?.message || "Asset updated");
        const full = await getFixedAsset(d._id).catch(() => null);
        if (full?.data) setDetailModal(full.data);
        setRefreshFlag((n) => n + 1);
      } catch (error) {
        fail(error, "Couldn't save the changes.");
      }
    });

  const handleStatusChange = async (asset, newStatus) => {
    if (asset.status === newStatus) return;
    setUpdatingStatus(true);
    try {
      const res = await updateFixedAsset(asset._id, { status: newStatus });
      toast.success("Asset status updated");
      // The update response has no populated employee / history, so reload the full record
      const full = await getFixedAsset(asset._id).catch(() => null);
      setDetailModal(
        full?.data || res?.data || { ...asset, status: newStatus },
      );
      setRefreshFlag((f) => f + 1);
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Couldn't update.",
        );
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Grouped by employee: one card per employee with everything they hold
  const groups = (() => {
    const map = new Map();
    assets
      .filter((a) => a.assignedTo)
      .forEach((a) => {
        const id = a.assignedTo._id;
        if (!map.has(id)) map.set(id, { emp: a.assignedTo, items: [] });
        map.get(id).items.push(a);
      });
    const q = groupSearch.trim().toLowerCase();
    return [...map.values()]
      .filter(
        (g) =>
          !q ||
          String(g.emp.name || "").toLowerCase().includes(q) ||
          String(g.emp.eCode || "").toLowerCase().includes(q),
      )
      .filter((g) => !minAssets || g.items.length >= Number(minAssets))
      .sort((x, y) =>
        groupSort === "name"
          ? String(x.emp.name || "").localeCompare(String(y.emp.name || ""))
          : y.items.length - x.items.length ||
            String(x.emp.name || "").localeCompare(String(y.emp.name || "")),
      );
  })();

  const visible = assets.filter(
    (a) =>
      assignFilter === "ALL" ||
      (assignFilter === "assigned"
        ? !!a.assignedTo
        : !a.assignedTo && a.status === "active"),
  );
  const stats = [
    { label: "Matching assets", value: assets.length },
    {
      label: "In stock",
      value: assets.filter((a) => !a.assignedTo && a.status === "active")
        .length,
    },
    { label: "Assigned", value: assets.filter((a) => a.assignedTo).length },
    {
      label: "Under maintenance",
      value: assets.filter((a) => a.status === "under_maintenance").length,
    },
  ];

  // Export what is on the screen to Excel (the search and the filters are applied)
  const statusText = (a) =>
    a.lifecycleStatus === "sold" ? "Sold" : STATUS_META[a.status]?.label || a.status || "";
  const handleExport = () => {
    const byEmployee = viewMode === "byEmployee";
    const rows = byEmployee
      ? whoHasWhatRows(groups, statusText)
      : registerRows(visible, statusText);
    if (rows.length === 0) {
      toast.info("Nothing to export. Change the search or the filters and try again");
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    try {
      downloadExcel(
        rows,
        byEmployee ? "Who has what" : "Fixed assets",
        `${byEmployee ? "who-has-what" : "fixed-assets-register"}${
          filters.fromDate || filters.toDate
            ? `_${filters.fromDate || "start"}_to_${filters.toDate || "today"}`
            : ""
        }_${today}.xlsx`,
      );
      toast.success(`Exported ${rows.length} row${rows.length === 1 ? "" : "s"} to Excel`);
    } catch {
      toast.error("The Excel file could not be made. Please try again");
    }
  };

  const columns = [
    {
      name: "Asset",
      sortable: true,
      sortFunction: (x, y) => x.assetName.localeCompare(y.assetName),
      minWidth: "260px",
      cell: (row) => {
        return (
          <div className="py-2">
            <div style={{ minWidth: 0 }}>
              <div className="fw-semibold text-truncate" title={row.assetName}>
                {row.assetName}
              </div>
              <div
                className="text-muted"
                style={{ fontSize: 12, fontFamily: "monospace" }}
              >
                {row.assetTag}
                {row.serialNumber ? ` · ${row.serialNumber}` : ""}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      name: "Category",
      sortable: true,
      selector: (row) => row.category,
      width: "150px",
      cell: (row) => (
        <span
          title={row.category}
          style={{
            background: "#f5f6fa",
            color: "#495057",
            fontSize: 12,
            fontWeight: 600,
            padding: "3px 10px",
            borderRadius: 999,
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {row.category}
        </span>
      ),
    },
    {
      name: "Assigned To",
      minWidth: "210px",
      cell: (row) =>
        row.assignedTo ? (
          <div>
            <div style={{ lineHeight: 1.2 }}>
              <div className="fw-semibold" style={{ fontSize: 13 }}>
                {row.assignedTo.name}
              </div>
              <div className="text-muted" style={{ fontSize: 11 }}>
                {row.assignedTo.eCode} · since {dateFmt(row.assignedAt)}
              </div>
            </div>
          </div>
        ) : (
          <span className="text-muted" style={{ fontSize: 13 }}>
            In stock
          </span>
        ),
    },
    {
      name: "Site",
      selector: (row) => row.centerId?.title || "",
      sortable: true,
      cell: (row) => (
        <span className="uom-cell-muted">{row.centerId?.title || "—"}</span>
      ),
    },
    {
      name: "Status",
      width: "175px",
      cell: (row) => (
        <div>
          <StatusPill status={row.status} />
          {row.pendingWriteOff && (
            <div className="text-muted" style={{ fontSize: 11, marginTop: 2 }}>
              Write-off pending
            </div>
          )}
        </div>
      ),
    },
    {
      name: "",
      width: "90px",
      right: true,
      cell: (row) => (
        <Button size="sm" color="light" onClick={() => openDetail(row)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="uom-page">
      <div className="uom-list-header">
        <div>
          <h4>Fixed Assets Register</h4>
          <p>
            Permanent record of every capitalized asset — cost, location, and
            status
          </p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <Button
            color="light"
            className="border"
            onClick={handleExport}
            disabled={loading}
            title="Download what is on the screen as an Excel file"
          >
            <i className="bx bx-download me-1"></i> Export
          </Button>
          {canEdit && (
            <Button color="primary" onClick={() => setAddModal(true)}>
              Add Asset
            </Button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div
        className="d-grid gap-3 mb-4"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}
      >
        {stats.map((st) => (
          <div
            key={st.label}
            className="p-3"
            style={{
              border: "1px solid #eef0f3",
              borderRadius: 12,
              background: "#fff",
            }}
          >
            <div>
              <div className="fs-4 fw-bold" style={{ lineHeight: 1.1 }}>
                {st.value}
              </div>
              <div className="text-muted" style={{ fontSize: 12 }}>
                {st.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* How to look at the register */}
      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        {[
          ["list", "All assets"],
          ["byEmployee", "Who has what"],
        ].map(([key, text]) => {
          const on = viewMode === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setViewMode(key);
                if (key === "byEmployee") {
                  // these only make sense in the full asset list
                  setHolder(null);
                  setHolderQuery("");
                  setAssignFilter("ALL");
                  setFilters((f) => (["retired", "sold"].includes(f.status) ? { ...f, status: "" } : f));
                }
              }}
              style={{
                border: `1px solid ${on ? "#4f46e5" : "#e5e7eb"}`,
                background: on ? "#eef2ff" : "#fff",
                color: on ? "#4f46e5" : "#495057",
                borderRadius: 999,
                padding: "6px 16px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {text}
            </button>
          );
        })}
      </div>

      {/* Filters: the ones used most */}
      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <div className="uom-search-wrap" style={{ maxWidth: 280 }}>
          <i className="bx bx-search"></i>
          <Input
            placeholder={
              viewMode === "byEmployee"
                ? "Which asset? Name, tag or serial..."
                : "Search name, tag or serial..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {viewMode === "byEmployee" && (
          <div className="uom-search-wrap" style={{ maxWidth: 260 }}>
            <i className="bx bx-search"></i>
            <Input
              placeholder="Find employee by name or code..."
              value={groupSearch}
              onChange={(e) => setGroupSearch(e.target.value)}
            />
          </div>
        )}
        <Input
          type="select"
          style={{ width: 170 }}
          value={filters.centerId}
          onChange={setFilter("centerId")}
        >
          <option value="">All sites</option>
          {centers.map((c) => (
            <option key={c._id} value={c._id}>
              {c.title}
            </option>
          ))}
        </Input>
        <Input
          type="select"
          style={{ width: 170 }}
          value={filters.categoryL1}
          onChange={setFilter("categoryL1")}
        >
          <option value="">All categories</option>
          {level1.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </Input>
        <div
          className="d-flex align-items-center flex-nowrap gap-1"
          style={{ flexShrink: 0 }}
        >
          <span
            className="text-muted text-nowrap"
            style={{ fontSize: 12 }}
            title="Filters on the purchase date. If an asset has no purchase date, the date it was added to the register is used."
          >
            Purchased / added
          </span>
          <Input
            type="date"
            bsSize="md"
            style={{ width: 140, minWidth: 140, padding: "0.375rem 0.4rem" }}
            value={filters.fromDate}
            max={filters.toDate || undefined}
            onChange={setFilter("fromDate")}
            aria-label="Purchase date from"
          />
          <span className="text-muted text-nowrap" style={{ fontSize: 12 }}>
            to
          </span>
          <Input
            type="date"
            bsSize="md"
            style={{ width: 140, minWidth: 140, padding: "0.375rem 0.4rem" }}
            value={filters.toDate}
            min={filters.fromDate || undefined}
            onChange={setFilter("toDate")}
            aria-label="Purchase date to"
          />
        </div>
        {viewMode === "list" && (
        <div style={{ position: "relative", width: 230 }}>
          {holder ? (
            <div
              className="d-flex align-items-center justify-content-between px-2"
              style={{
                height: 38,
                border: "1px solid #c7d2fe",
                background: "#eef2ff",
                borderRadius: 6,
              }}
            >
              <span className="text-truncate" style={{ fontSize: 13 }}>
                Held by: <b>{holder.name}</b>
                {holder.eCode ? ` (${holder.eCode})` : ""}
              </span>
              <button
                type="button"
                aria-label="Remove employee filter"
                onClick={() => setHolder(null)}
                style={{
                  border: "none",
                  background: "none",
                  fontSize: 20,
                  lineHeight: 1,
                  color: "#4f46e5",
                }}
              >
                ×
              </button>
            </div>
          ) : (
            <>
              <Input
                placeholder="Held by employee..."
                value={holderQuery}
                onChange={(e) => {
                  setHolderQuery(e.target.value);
                  setHolderOpen(true);
                }}
                onFocus={() => setHolderOpen(true)}
                onBlur={() => setTimeout(() => setHolderOpen(false), 150)}
              />
              {holderOpen && holderQuery.trim().length >= 2 && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    zIndex: 20,
                    background: "#fff",
                    border: "1px solid #eee",
                    borderRadius: 6,
                    maxHeight: 220,
                    overflowY: "auto",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                >
                  {holderSearching ? (
                    <div className="p-2 text-muted small">Searching...</div>
                  ) : holderResults.length === 0 ? (
                    <div className="p-2 text-muted small">No employee found</div>
                  ) : (
                    holderResults.map((emp) => (
                      <div
                        key={emp._id}
                        className="px-2 py-2"
                        style={{ cursor: "pointer", fontSize: 13 }}
                        onMouseDown={() => pickHolder(emp)}
                      >
                        {emp.name}{" "}
                        <span className="text-muted">{emp.eCode}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
        )}
        {viewMode === "list" && (
        <Input
          type="select"
          style={{ width: 150 }}
          value={assignFilter}
          onChange={(e) => setAssignFilter(e.target.value)}
        >
          <option value="ALL">Assigned or not</option>
          <option value="assigned">Assigned</option>
          <option value="in_stock">In stock</option>
        </Input>
        )}
        <Input
          type="select"
          style={{ width: 160 }}
          value={filters.status}
          onChange={setFilter("status")}
        >
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="under_maintenance">Under maintenance</option>
          {viewMode === "list" && (
            <>
              <option value="retired">Discarded</option>
              <option value="sold">Sold</option>
            </>
          )}
        </Input>
        {viewMode === "byEmployee" && (
          <>
            <Input
              type="select"
              style={{ width: 170 }}
              value={minAssets}
              onChange={(e) => setMinAssets(e.target.value)}
              aria-label="How many they hold"
            >
              <option value="">Any number held</option>
              <option value="2">2 or more</option>
              <option value="3">3 or more</option>
              <option value="5">5 or more</option>
            </Input>
            <Input
              type="select"
              style={{ width: 180 }}
              value={groupSort}
              onChange={(e) => setGroupSort(e.target.value)}
              aria-label="Order"
            >
              <option value="most">Most assets first</option>
              <option value="name">Name A to Z</option>
            </Input>
          </>
        )}
        {filtersOn && (
          <Button
            color="light"
            onClick={() => {
              setFilters(EMPTY_FILTERS);
              setAssignFilter("ALL");
              setHolder(null);
              setHolderQuery("");
              setMinAssets("");
              setGroupSearch("");
              setGroupSort("most");
            }}
          >
            Clear
          </Button>
        )}
      </div>

      {holder && !loading && (
        <div className="mb-3 text-muted" style={{ fontSize: 14 }}>
          {assets.length === 0
            ? `Nothing is assigned to ${holder.name} right now.`
            : `${holder.name}${holder.eCode ? ` (${holder.eCode})` : ""} holds ${assets.length} asset${assets.length === 1 ? "" : "s"}.`}
        </div>
      )}

      {loadError && (
        <div
          className="p-3 mb-3 d-flex align-items-center justify-content-between"
          style={{
            background: "#fef3f2",
            border: "1px solid #fecdca",
            borderRadius: 10,
          }}
        >
          <span className="text-danger">{loadError}</span>
          <Button
            size="sm"
            color="light"
            onClick={() => setRefreshFlag((n) => n + 1)}
          >
            Try again
          </Button>
        </div>
      )}

      {!loading && viewMode === "list" && (
        <div className="text-muted mb-2" style={{ fontSize: 13 }}>
          Showing {visible.length} of {assets.length} asset
          {assets.length === 1 ? "" : "s"}. Click a row to open it.
        </div>
      )}
      {viewMode === "byEmployee" ? (
        <div>
          {loading ? (
            <div className="uom-table-card p-4 text-center text-muted">Loading...</div>
          ) : groups.length === 0 ? (
            <div className="uom-table-card">
              <div className="uom-empty-state">
                <p className="uom-empty-title">
                  {groupSearch.trim() ? "No employee matches this search" : "Nothing is assigned to anyone right now"}
                </p>
                <p className="uom-empty-sub">
                  {groupSearch.trim()
                    ? "Try another name or code."
                    : "When an asset is given to an employee, it will show here under their name."}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="text-muted mb-2" style={{ fontSize: 13 }}>
                {groups.length} employee{groups.length === 1 ? "" : "s"} holding{" "}
                {groups.reduce((n, g) => n + g.items.length, 0)} asset
                {groups.reduce((n, g) => n + g.items.length, 0) === 1 ? "" : "s"}.
              </div>
              <div className="uom-table-card" style={{ overflowX: "auto" }}>
                <table className="table mb-0" style={{ minWidth: 680 }}>
                  <thead>
                    <tr style={{ background: "#f3f4f8" }}>
                      <th style={{ width: 240, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.4, color: "#475467" }}>Employee</th>
                      <th className="text-center" style={{ width: 90, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.4, color: "#475467" }}>Assets</th>
                      <th style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 0.4, color: "#475467" }}>What they hold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((g) => {
                      const open = expandedEmps.has(g.emp._id);
                      const shown = open ? g.items : g.items.slice(0, 6);
                      return (
                        <tr key={g.emp._id}>
                          <td style={{ verticalAlign: "top", paddingTop: 14 }}>
                            <div className="fw-semibold" style={{ color: "#3730a3" }}>{g.emp.name}</div>
                            <div className="text-muted" style={{ fontSize: 12 }}>{g.emp.eCode}</div>
                          </td>
                          <td className="text-center" style={{ verticalAlign: "top", paddingTop: 12 }}>
                            <span
                              style={{ display: "inline-block", minWidth: 34, background: "#eef2ff", color: "#4f46e5", fontWeight: 700, fontSize: 16, padding: "2px 10px", borderRadius: 999 }}
                            >
                              {g.items.length}
                            </span>
                          </td>
                          <td style={{ verticalAlign: "top" }}>
                            <div className="d-flex flex-wrap gap-2 align-items-center">
                              {shown.map((a) => (
                                <button
                                  type="button"
                                  key={a._id}
                                  onClick={() => openDetail(a)}
                                  title={`${a.assetName} · ${a.assetTag}${a.category ? ` · ${a.category}` : ""} · since ${dateFmt(a.assignedAt)}`}
                                  style={{ border: "1px solid #e5e7eb", background: "#fff", borderRadius: 8, padding: "4px 10px", fontSize: 13.5, textAlign: "left", cursor: "pointer" }}
                                >
                                  <span className="fw-semibold">{a.assetName}</span>{" "}
                                  <span className="text-muted" style={{ fontSize: 11.5, fontFamily: "monospace" }}>{a.assetTag}</span>
                                  {a.status === "under_maintenance" && (
                                    <span style={{ color: "#f79009", fontSize: 11.5 }}> · repair</span>
                                  )}
                                </button>
                              ))}
                              {g.items.length > 6 && (
                                <button
                                  type="button"
                                  className="btn btn-link btn-sm p-0"
                                  onClick={() => toggleEmp(g.emp._id)}
                                >
                                  {open ? "Show less" : `+${g.items.length - 6} more`}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      ) : (
      <div className="uom-table-card">
        <DataTable
          columns={columns}
          data={visible}
          progressPending={loading}
          pagination
          paginationPerPage={25}
          paginationRowsPerPageOptions={[10, 25, 50, 100]}
          highlightOnHover
          pointerOnHover
          onRowClicked={openDetail}
          customStyles={{
            headCells: {
              style: {
                backgroundColor: "#f8f9fa",
                fontWeight: 600,
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: 0.3,
                color: "#6c757d",
              },
            },
            rows: { style: { minHeight: 62 } },
          }}
          noDataComponent={
            <div className="uom-empty-state">
              <p className="uom-empty-title">
                {assets.length === 0
                  ? "No assets registered yet"
                  : "No assets match these filters"}
              </p>
              <p className="uom-empty-sub">
                {assets.length === 0
                  ? "Add an asset (laptop, phone, SIM...) or capitalize one from Asset Capitalization."
                  : "Try a different category or clear the search."}
              </p>
            </div>
          }
        />
      </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={!!detailModal}
        toggle={() => setDetailModal(null)}
        centered
        size="lg"
      >
        <ModalBody className="p-0">
          {detailModal &&
            (() => {
              const d = detailModal;
              const sectionTitle = {
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: 0.3,
                color: "#6c757d",
              };
              const history = [...(d.assignmentHistory || [])].reverse();
              const idLabel = d.identifierLabel || "Serial / identifier";
              return (
                <>
                  {/* Header */}
                  <div
                    className="d-flex align-items-center gap-3 p-4"
                    style={{ borderBottom: "1px solid #f1f3f5" }}
                  >
                    <div className="flex-grow-1">
                      <h5 className="mb-1" style={{ wordBreak: "break-word" }}>
                        {d.assetName}
                      </h5>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span
                          className="text-muted"
                          style={{
                            fontFamily: "monospace",
                            fontSize: 13,
                            background: "#f5f6fa",
                            padding: "2px 8px",
                            borderRadius: 6,
                          }}
                        >
                          {d.assetTag}
                        </span>
                        <StatusPill status={d.status} />
                      </div>
                    </div>
                    {d.purchaseCost !== null && d.purchaseCost !== undefined && d.purchaseCost !== "" && (
                      <div className="text-end">
                        <div className="text-muted" style={{ fontSize: 12 }}>
                          Purchase Cost
                        </div>
                        <div className="fs-4 fw-bold text-primary">
                          {moneyOrDash(d.purchaseCost)}
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      className="btn-close ms-2"
                      aria-label="Close"
                      onClick={() => setDetailModal(null)}
                    />
                  </div>

                  <div className="p-4">
                    {/* Tabs */}
                    <div
                      className="d-flex gap-1 mb-4"
                      style={{ borderBottom: "1px solid #e5e7eb" }}
                    >
                      {[
                        ["overview", "Overview"],
                        ...(canEdit ? [["actions", "Actions"]] : []),
                        ["history", `History (${history.length})`],
                        ["more", "More details"],
                      ].map(([key, text]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setDetailTab(key)}
                          style={{
                            background: "none",
                            border: "none",
                            padding: "8px 14px",
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: "pointer",
                            color: detailTab === key ? "#4f46e5" : "#6c757d",
                            borderBottom: `2px solid ${detailTab === key ? "#4f46e5" : "transparent"}`,
                            marginBottom: -1,
                          }}
                        >
                          {text}
                        </button>
                      ))}
                    </div>

                    {detailTab === "overview" && (
                      <>
                        {/* Who has it */}
                        <div
                          className="p-3 mb-4"
                          style={{
                            borderRadius: 10,
                            border: `1px solid ${d.assignedTo ? "#c7d2fe" : "#d1fadf"}`,
                            background: d.assignedTo ? "#eef2ff" : "#ecfdf3",
                          }}
                        >
                          <div>
                            <div
                              className="text-muted"
                              style={{ fontSize: 12 }}
                            >
                              Currently with
                            </div>
                            <div className="fw-semibold">
                              {d.assignedTo
                                ? `${d.assignedTo.name} (${d.assignedTo.eCode})`
                                : "In stock, not assigned to anyone"}
                            </div>
                            {d.assignedTo && (
                              <div
                                className="text-muted"
                                style={{ fontSize: 12 }}
                              >
                                Since {dateFmt(d.assignedAt)}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="row g-3">
                          <Field label="Category" value={d.category} />
                          <Field
                            label="Site"
                            value={d.centerId?.title || "—"}
                          />
                          <Field
                            label={idLabel}
                            value={d.serialNumber || "—"}
                          />
                          <Field
                            label="Purchase Date"
                            value={dateFmt(d.purchaseDate)}
                          />
                          <div className="col-12">
                            <Field label="Remarks" value={d.remarks || "—"} />
                          </div>
                        </div>
                        {d.disposal && d.status === "written_off" && (
                          <div
                            className="p-3 mt-4"
                            style={{
                              border: "1px solid #e5e7eb",
                              borderRadius: 10,
                              background: "#fafbfc",
                            }}
                          >
                            <div style={sectionTitle} className="mb-1">
                              {d.disposal.type === "sale"
                                ? "SOLD"
                                : "DISCARDED (WRITTEN OFF)"}
                            </div>
                            <div style={{ fontSize: 13 }}>
                              {d.disposal.reason}
                              {d.disposal.type === "sale" && (
                                <>
                                  <br />
                                  Buyer: {d.disposal.buyerName || DASH}
                                  {d.disposal.value
                                    ? ` · ${moneyOrDash(d.disposal.value)}`
                                    : ""}
                                </>
                              )}
                              <br />
                              <span className="text-muted">
                                {dateFmt(d.disposal.at)} · request{" "}
                                {d.disposal.requestNumber || DASH}
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {detailTab === "actions" && canEdit && (
                      <>
                        {/* Assign / return */}
                        {canEdit &&
                          d.status !== "written_off" && (
                            <div className="mb-4">
                              <div style={sectionTitle} className="mb-2">
                                {d.assignedTo
                                  ? "TAKE BACK FROM EMPLOYEE"
                                  : "ASSIGN TO EMPLOYEE"}
                              </div>
                              <div
                                className="p-3"
                                style={{
                                  border: "1px solid #e5e7eb",
                                  borderRadius: 10,
                                }}
                              >
                                {d.assignedTo ? (
                                  <div className="row g-2 align-items-end">
                                    <div className="col-md-4">
                                      <label
                                        className="mb-1 text-muted"
                                        style={{ fontSize: 12 }}
                                      >
                                        Condition
                                      </label>
                                      <Input
                                        type="select"
                                        value={returnCondition}
                                        onChange={(e) =>
                                          setReturnCondition(e.target.value)
                                        }
                                      >
                                        <option value="good">Good</option>
                                        <option value="needs_repair">
                                          Needs repair (goes to maintenance)
                                        </option>
                                        <option value="damaged">
                                          Damaged, not usable (write-off)
                                        </option>
                                        <option value="lost">
                                          Lost (write-off)
                                        </option>
                                      </Input>
                                    </div>
                                    <div className="col-md-5">
                                      <label
                                        className="mb-1 text-muted"
                                        style={{ fontSize: 12 }}
                                      >
                                        Remarks
                                      </label>
                                      <Input
                                        placeholder="Optional"
                                        value={returnRemarks}
                                        onChange={(e) =>
                                          setReturnRemarks(e.target.value)
                                        }
                                      />
                                    </div>
                                    <div className="col-md-3">
                                      <Button
                                        color="success"
                                        className="w-100"
                                        disabled={assigning}
                                        onClick={() => handleReturn(d)}
                                      >
                                        Receive
                                      </Button>
                                    </div>
                                  </div>
                                ) : d.pendingWriteOff ? (
                                  <span
                                    className="text-muted"
                                    style={{ fontSize: 13 }}
                                  >
                                    Waiting for write-off approval (
                                    {d.pendingWriteOff}). It cannot be given to
                                    anyone meanwhile.
                                  </span>
                                ) : !d.canAssign ? (
                                  <span
                                    className="text-muted"
                                    style={{ fontSize: 13 }}
                                  >
                                    This asset cannot be given to an employee,
                                    because its Level 4 category is not set as
                                    an employee asset ({d.category}). To allow
                                    it, open Asset Category (Level 4), edit that
                                    category and tick "Can be given to an employee".
                                  </span>
                                ) : d.status === "active" ? (
                                  <>
                                    <div className="row g-2">
                                      <div className="col-md-7">
                                        <div className="input-group">
                                          <Input
                                            placeholder="Search employee by name or code..."
                                            value={empQuery}
                                            onChange={(e) =>
                                              setEmpQuery(e.target.value)
                                            }
                                          />
                                        </div>
                                      </div>
                                      <div className="col-md-5">
                                        <Input
                                          placeholder="Remarks (optional)"
                                          value={assignRemarks}
                                          onChange={(e) =>
                                            setAssignRemarks(e.target.value)
                                          }
                                        />
                                      </div>
                                    </div>
                                    {empQuery.trim().length >= 2 &&
                                      empResults.length === 0 && (
                                        <div
                                          className="text-muted mt-2"
                                          style={{ fontSize: 13 }}
                                        >
                                          No employee found
                                        </div>
                                      )}
                                    {empResults.length > 0 && (
                                      <div
                                        className="mt-2"
                                        style={{
                                          maxHeight: 170,
                                          overflowY: "auto",
                                          border: "1px solid #f1f3f5",
                                          borderRadius: 8,
                                        }}
                                      >
                                        {empResults.map((emp) => (
                                          <div
                                            key={emp._id}
                                            className="d-flex justify-content-between align-items-center px-3 py-2"
                                            style={{
                                              borderBottom: "1px solid #f8f9fa",
                                            }}
                                          >
                                            <div>
                                              <span
                                                className="fw-semibold"
                                                style={{ fontSize: 13 }}
                                              >
                                                {emp.name}
                                              </span>
                                              <span
                                                className="text-muted ms-2"
                                                style={{ fontSize: 12 }}
                                              >
                                                {emp.eCode}
                                              </span>
                                              {["RESIGNED", "FNF_CLOSED"].includes(
                                                emp.status,
                                              ) && (
                                                <span
                                                  className="ms-2"
                                                  style={{
                                                    fontSize: 11,
                                                    color: "#b42318",
                                                    background: "#fdeceb",
                                                    borderRadius: 6,
                                                    padding: "1px 6px",
                                                  }}
                                                >
                                                  Left the company
                                                </span>
                                              )}
                                            </div>
                                            <Button
                                              size="sm"
                                              color="primary"
                                              disabled={
                                                assigning ||
                                                ["RESIGNED", "FNF_CLOSED"].includes(
                                                  emp.status,
                                                )
                                              }
                                              onClick={() =>
                                                handleAssign(d, emp)
                                              }
                                            >
                                              Assign
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <span
                                    className="text-muted"
                                    style={{ fontSize: 13 }}
                                  >
                                    Only an active asset can be assigned.
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                        {canEdit &&
                          d.status !== "written_off" &&
                          !d.assignedTo && (
                            <div
                              className="p-3 mb-4"
                              style={{
                                border: "1px solid #e5e7eb",
                                borderRadius: 10,
                              }}
                            >
                              <div style={sectionTitle} className="mb-1">
                                NOT USABLE ANY MORE?
                              </div>
                              {d.pendingWriteOff ? (
                                <div
                                  className="text-muted"
                                  style={{ fontSize: 13 }}
                                >
                                  Request {d.pendingWriteOff} is waiting for
                                  approval.{" "}
                                  <Link to="/vendor-management/asset-writeoff">
                                    Open Asset Write-Off
                                  </Link>
                                </div>
                              ) : (
                                <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
                                  <div
                                    className="text-muted"
                                    style={{ fontSize: 13 }}
                                  >
                                    Damaged, old or not needed? Discard it or
                                    sell it. It goes for approval, and nothing
                                    is deleted.
                                  </div>
                                  <Button
                                    size="sm"
                                    color="danger"
                                    outline
                                    onClick={() => openDispose(d)}
                                  >
                                    Discard or sell
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        {d.status !== "written_off" && (
                          <>
                            <div style={sectionTitle} className="mb-2">
                              CHANGE STATUS
                            </div>
                            <div className="d-flex gap-2 flex-wrap">
                              {Object.entries(STATUS_META)
                                .filter(([key]) => key !== "written_off")
                                .map(([key, meta]) => (
                                  <Button
                                    key={key}
                                    size="sm"
                                    outline={d.status !== key}
                                    style={
                                      d.status === key
                                        ? {
                                            backgroundColor: meta.color,
                                            borderColor: meta.color,
                                            color: "#fff",
                                          }
                                        : {
                                            borderColor: meta.color,
                                            color: meta.color,
                                          }
                                    }
                                    disabled={
                                      updatingStatus || d.status === key
                                    }
                                    onClick={() => handleStatusChange(d, key)}
                                  >
                                    {meta.label}
                                  </Button>
                                ))}
                            </div>
                          </>
                        )}
                      </>
                    )}

                    {detailTab === "history" && (
                      <>
                        {/* History */}
                        {history.length === 0 ? (
                          <div className="text-muted" style={{ fontSize: 13 }}>
                            This asset has not been given to anyone yet.
                          </div>
                        ) : (
                          <div
                            className="mb-4"
                            style={{
                              borderLeft: "2px solid #e5e7eb",
                              marginLeft: 6,
                            }}
                          >
                            {history.map((h) => (
                              <div
                                key={h._id}
                                className="ps-3 pb-3 position-relative"
                              >
                                <span
                                  style={{
                                    position: "absolute",
                                    left: -6,
                                    top: 4,
                                    width: 10,
                                    height: 10,
                                    borderRadius: "50%",
                                    background: h.returnedAt
                                      ? "#12b76a"
                                      : "#4f46e5",
                                  }}
                                />
                                <div
                                  className="fw-semibold"
                                  style={{ fontSize: 13 }}
                                >
                                  {h.employeeId?.name || "Employee"}{" "}
                                  <span className="text-muted fw-normal">
                                    {h.employeeId?.eCode}
                                  </span>
                                </div>
                                <div
                                  className="text-muted"
                                  style={{ fontSize: 12 }}
                                >
                                  Given {dateFmt(h.assignedAt)}
                                  {h.returnedAt
                                    ? ` · Returned ${dateFmt(h.returnedAt)} (${String(h.returnCondition || "good").replace("_", " ")})`
                                    : " · Still with employee"}
                                </div>
                                {h.remarks && (
                                  <div
                                    className="text-muted"
                                    style={{ fontSize: 12 }}
                                  >
                                    {h.remarks}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    {detailTab === "more" && (
                      <>
                        <div className="row g-3 mb-4">
                          <Field label="Tag" value={d.tag?.tagCode || DASH} />
                          {d.source && d.source !== "manual" && (
                            <Field
                              label="Where it came from"
                              value={SOURCE_LABEL[d.source] || DASH}
                            />
                          )}
                          <div className="col-12">
                            <Field
                              label="Category (levels)"
                              value={categoryPath(d)}
                            />
                          </div>
                          {d.storageLocationId && (
                            <Field
                              label="Location"
                              value={`${d.storageLocationId?.name || ""} (${d.storageLocationId?.code || ""})`}
                            />
                          )}
                        </div>
                        {/* Edit numbers, cost and depreciation */}
                        {canEdit && d.status !== "written_off" && editForm && (
                          <div className="mb-4">
                            <div style={sectionTitle} className="mb-2">
                              EDIT DETAILS
                            </div>
                            <div
                              className="p-3"
                              style={{
                                border: "1px solid #e5e7eb",
                                borderRadius: 10,
                              }}
                            >
                              <div className="row g-2 mb-2">
                                <div className="col-md-4">
                                  <label
                                    className="mb-1 text-muted"
                                    style={{ fontSize: 12 }}
                                  >
                                    Asset name
                                  </label>
                                  <Input
                                    value={editForm.assetName}
                                    onChange={(e) =>
                                      setEditForm((f) => ({
                                        ...f,
                                        assetName: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div className="col-md-4">
                                  <label
                                    className="mb-1 text-muted"
                                    style={{ fontSize: 12 }}
                                  >
                                    {d.identifierLabel || "Serial / identifier"}
                                  </label>
                                  <Input
                                    value={editForm.serialNumber}
                                    onChange={(e) =>
                                      setEditForm((f) => ({
                                        ...f,
                                        serialNumber: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div className="col-md-4">
                                  <label
                                    className="mb-1 text-muted"
                                    style={{ fontSize: 12 }}
                                  >
                                    Site
                                  </label>
                                  <Input
                                    type="select"
                                    value={editForm.centerId}
                                    onChange={(e) =>
                                      setEditForm((f) => ({
                                        ...f,
                                        centerId: e.target.value,
                                      }))
                                    }
                                  >
                                    <option value="">
                                      {idOf(d.centerId)
                                        ? "Keep current site"
                                        : "Select site"}
                                    </option>
                                    {centers.map((c) => (
                                      <option key={c._id} value={c._id}>
                                        {c.title}
                                      </option>
                                    ))}
                                  </Input>
                                </div>
                                <div className="col-12">
                                  <label
                                    className="mb-1 text-muted"
                                    style={{ fontSize: 12 }}
                                  >
                                    Remarks
                                  </label>
                                  <Input
                                    type="textarea"
                                    rows={2}
                                    value={editForm.remarks}
                                    onChange={(e) =>
                                      setEditForm((f) => ({
                                        ...f,
                                        remarks: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                {[
                                  ["purchaseCost", "Cost", "number"],
                                  ["purchaseDate", "Purchase date", "date"],
                                ].map(([key, label, type]) => (
                                  <div className="col-md-4" key={key}>
                                    <label
                                      className="mb-1 text-muted"
                                      style={{ fontSize: 12 }}
                                    >
                                      {label}
                                    </label>
                                    <Input
                                      type={type}
                                      min={type === "number" ? 0 : undefined}
                                      value={editForm[key]}
                                      onChange={(e) =>
                                        setEditForm((f) => ({
                                          ...f,
                                          [key]: e.target.value,
                                        }))
                                      }
                                    />
                                  </div>
                                ))}
                              </div>
                              <div className="text-muted small mb-2">
                                Cost and purchase date are optional. If you do
                                not know them, leave them empty (an empty cost
                                is never saved as 0).
                              </div>
                              <CategoryLevelSelect
                                value={editCategory}
                                onChange={setEditCategory}
                                levels={4}
                                md={6}
                                disabled={savingEdit}
                              />
                              <div className="d-flex justify-content-end">
                                <Button
                                  color="primary"
                                  disabled={savingEdit}
                                  onClick={() => handleSaveEdit(d)}
                                >
                                  {savingEdit ? "Saving..." : "Save changes"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div
                    className="d-flex justify-content-end px-4 py-3"
                    style={{
                      background: "#fafbfc",
                      borderTop: "1px solid #f1f3f5",
                    }}
                  >
                    <Button color="light" onClick={() => setDetailModal(null)}>
                      Close
                    </Button>
                  </div>
                </>
              );
            })()}
        </ModalBody>
      </Modal>
      <Modal isOpen={!!disposeFor} toggle={() => setDisposeFor(null)} centered>
        <ModalBody className="p-4">
          {disposeFor && (
            <>
              <h5 className="mb-1">Discard or sell</h5>
              <div className="text-muted mb-3" style={{ fontSize: 13 }}>
                {disposeFor.assetName} ({disposeFor.assetTag}). A request is
                raised and an approver confirms it.
              </div>
              <div className="d-flex gap-2 mb-3">
                {[
                  ["write_off", "Discard (write-off)"],
                  ["sale", "Sell"],
                ].map(([val, text]) => (
                  <Button
                    key={val}
                    color={
                      disposeForm.disposalType === val ? "primary" : "light"
                    }
                    onClick={() =>
                      setDisposeForm((f) => ({ ...f, disposalType: val }))
                    }
                  >
                    {text}
                  </Button>
                ))}
              </div>
              {needSite && (
                <div className="mb-2">
                  <label
                    className="mb-1"
                    style={{ fontSize: 12, fontWeight: 600 }}
                  >
                    Site * (this asset has no site yet)
                  </label>
                  <Input
                    type="select"
                    value={disposeForm.centerId}
                    onChange={(e) =>
                      setDisposeForm((f) => ({
                        ...f,
                        centerId: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select site</option>
                    {centers.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.title}
                      </option>
                    ))}
                  </Input>
                </div>
              )}
              <div className="mb-2">
                <label
                  className="mb-1"
                  style={{ fontSize: 12, fontWeight: 600 }}
                >
                  Reason *
                </label>
                <Input
                  type="textarea"
                  rows={2}
                  placeholder="e.g. Uniform torn, SIM card damaged, laptop too old"
                  value={disposeForm.reason}
                  onChange={(e) =>
                    setDisposeForm((f) => ({ ...f, reason: e.target.value }))
                  }
                />
              </div>
              <div className="row g-2">
                <div
                  className={
                    disposeForm.disposalType === "sale" ? "col-6" : "col-12"
                  }
                >
                  <label
                    className="mb-1"
                    style={{ fontSize: 12, fontWeight: 600 }}
                  >
                    {disposeForm.disposalType === "sale"
                      ? "Sale value"
                      : "Scrap value (if any)"}
                  </label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={disposeForm.estValue}
                    onChange={(e) =>
                      setDisposeForm((f) => ({
                        ...f,
                        estValue: e.target.value,
                      }))
                    }
                  />
                </div>
                {disposeForm.disposalType === "sale" && (
                  <div className="col-6">
                    <label
                      className="mb-1"
                      style={{ fontSize: 12, fontWeight: 600 }}
                    >
                      Buyer name *
                    </label>
                    <Input
                      value={disposeForm.buyerName}
                      onChange={(e) =>
                        setDisposeForm((f) => ({
                          ...f,
                          buyerName: e.target.value,
                        }))
                      }
                    />
                  </div>
                )}
              </div>
              <div className="d-flex justify-content-end gap-2 mt-4">
                <Button color="light" onClick={() => setDisposeFor(null)}>
                  Cancel
                </Button>
                <Button
                  color="danger"
                  disabled={disposing}
                  onClick={handleDispose}
                >
                  {disposing ? "Raising..." : "Raise request"}
                </Button>
              </div>
            </>
          )}
        </ModalBody>
      </Modal>
      <Modal
        isOpen={addModal}
        toggle={() => setAddModal(false)}
        centered
        size="lg"
      >
        <ModalBody className="p-0">
          {(() => {
            const label = { fontSize: 12, fontWeight: 600, color: "#495057" };
            const set = (key) => (e) =>
              setAddForm((f) => ({ ...f, [key]: e.target.value }));
            return (
              <>
                {/* Header */}
                <div
                  className="d-flex align-items-center gap-3 p-4"
                  style={{ borderBottom: "1px solid #f1f3f5" }}
                >
                  <div className="flex-grow-1">
                    <h5 className="mb-0">Add Asset</h5>
                    {/* <div className="text-muted" style={{ fontSize: 13 }}>
                      Types are managed in Asset Category master. Cost and other numbers can be added later from More details
                    </div> */}
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={() => setAddModal(false)}
                  />
                </div>

                <div className="p-4">
                  <CategoryLevelSelect
                    value={addCategory}
                    onChange={setAddCategory}
                    onSettings={setAddSettings}
                    required
                    levels={4}
                    md={6}
                    disabled={saving}
                  />
                  {addCategory.categoryL1 && !addSettings.isComplete && (
                    <div className="small mb-3" style={{ color: "#b54708" }}>
                      This category has more levels below it. Choose the next level too.
                    </div>
                  )}

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="mb-1" style={label}>
                        Asset name <span className="text-danger">*</span>
                      </label>
                      <Input
                        placeholder="e.g. Dell Latitude 5420"
                        value={addForm.assetName}
                        onChange={set("assetName")}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="mb-1" style={label}>
                        {addSettings.identifierLabel || "Serial / identifier"}
                      </label>
                      <Input
                        placeholder="Optional"
                        value={addForm.serialNumber}
                        onChange={set("serialNumber")}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="mb-1" style={label}>
                        Site <span className="text-danger">*</span>
                      </label>
                      <Input
                        type="select"
                        value={addForm.centerId}
                        onChange={set("centerId")}
                      >
                        <option value="">Select site</option>
                        {centers.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.title}
                          </option>
                        ))}
                      </Input>
                    </div>
                    <div className="col-md-6">
                      <label className="mb-1" style={label}>
                        Remarks
                      </label>
                      <Input
                        placeholder="Optional"
                        value={addForm.remarks}
                        onChange={set("remarks")}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div
                  className="d-flex justify-content-end gap-2 px-4 py-3"
                  style={{
                    background: "#fafbfc",
                    borderTop: "1px solid #f1f3f5",
                  }}
                >
                  <Button color="light" onClick={() => setAddModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    color="primary"
                    disabled={saving}
                    onClick={handleCreate}
                  >
                    {saving ? "Saving..." : "Add Asset"}
                  </Button>
                </div>
              </>
            );
          })()}
        </ModalBody>
      </Modal>
    </div>
  );
};

export default FixedAssetRegister;
