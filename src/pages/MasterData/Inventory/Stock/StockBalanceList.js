import React, { useState, useEffect, useMemo } from "react";
import DataTable from "react-data-table-component";
import { Button, Input, Modal, ModalBody } from "reactstrap";
import { toast } from "react-toastify";
import {
  getStockBalances,
  getStockLedger,
  getInventoryTransfers,
} from "../../../../helpers/backend_helper";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { useReferenceList } from "../../../../Components/Hooks/useReferenceData";
import { exportInventory } from "./exportInventory";
import "../../UnitOfMeasurement/uom.scss";

const dateFmt = (d) => (d ? new Date(d).toLocaleString("en-IN") : "—");

const tableCustomStyles = {
  headRow: {
    style: {
      backgroundColor: "#fff",
      borderBottom: "1px solid #edeff3",
      minHeight: "48px",
    },
  },
  headCells: {
    style: {
      fontSize: "13px",
      fontWeight: 600,
      color: "#475569",
      textTransform: "uppercase",
      letterSpacing: "0.02em",
    },
  },
  rows: {
    style: {
      minHeight: "60px",
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
  pagination: {
    style: { borderTopColor: "#edeff3", fontSize: "13px", color: "#667085" },
  },
};

const SummaryCard = ({ label, value, sub, icon }) => (
  <div className="uom-table-card p-3 flex-fill">
    <div className="d-flex align-items-center gap-2 mb-1">
      <i className={`bx ${icon} text-primary fs-5`}></i>
      <span className="text-muted small">{label}</span>
    </div>
    <div className="fs-3 fw-bold">{value}</div>
    {sub && <div className="text-muted small">{sub}</div>}
  </div>
);

const TABS = [
  { key: "all", label: "All stock" },
  { key: "available", label: "Available" },
  { key: "created", label: "Created" },
  { key: "in_transit", label: "In transit" },
];

const STATUS_LABELS = {
  available: "Available",
  created: "Created",
  in_transit: "In transit",
  difference: "In transit (difference)",
};

const openDiff = (li) => (li.dispatchedQty || 0) - (li.receivedQty || 0) - (li.resolvedQty || 0);

const StockBalanceList = () => {
  const handleAuthError = useAuthError();

  const [balances, setBalances] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [siteId, setSiteId] = useState("");
  const { items: centers } = useReferenceList("centers");
  const [refreshFlag] = useState(0);

  const [ledgerModal, setLedgerModal] = useState(null);
  const [ledgerRows, setLedgerRows] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchBalances = async () => {
      setLoading(true);
      try {
        // Everything is fetched once; search, Site and the tabs work on it here so the counts always match the list
        const [res, transferRes] = await Promise.all([
          getStockBalances({}),
          getInventoryTransfers({}).catch(() => ({ data: [] })),
        ]);
        if (cancelled) return;
        setBalances(res?.data || []);
        setTransfers(transferRes?.data || []);
      } catch (error) {
        if (cancelled) return;
        if (!handleAuthError(error)) {
          toast.error(
            error?.response?.data?.message ||
              error?.message ||
              "Couldn't load stock.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchBalances();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshFlag]);

  const openLedger = async (row) => {
    setLedgerModal(row);
    setLedgerLoading(true);
    try {
      const res = await getStockLedger({
        itemName: row.itemName,
        centerId: row.centerId?._id || row.centerId,
      });
      setLedgerRows(res?.data || []);
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Couldn't load ledger.",
        );
      }
    } finally {
      setLedgerLoading(false);
    }
  };

  // One row per stock counter (Available) and one per transfer line (Created, In transit).
  // Created = nothing has left the source yet. In transit = dispatched, not yet received.
  // An open difference (received less than dispatched) stays in In transit until it is resolved.
  const allRows = useMemo(() => {
    const rows = balances.map((b) => ({
      key: `a-${b._id}`,
      kind: "available",
      balance: b,
      itemName: b.itemName,
      quantity: b.quantity,
      fromId: b.centerId?._id || b.centerId,
      fromTitle: b.centerId?.title || "",
      toId: "",
      toTitle: "",
      transferNumber: "",
      updatedAt: b.updatedAt,
    }));
    transfers.forEach((t) => {
      if (t.flow !== "two_step") return;
      (t.lineItems || []).forEach((li) => {
        let kind = "";
        let quantity = 0;
        if (t.status === "created") {
          kind = "created";
          quantity = li.quantity;
        } else if (t.status === "in_transit") {
          kind = "in_transit";
          quantity = li.dispatchedQty;
        } else if (t.status === "received_with_difference" && openDiff(li) > 0) {
          kind = "difference";
          quantity = openDiff(li);
        }
        if (!kind) return;
        rows.push({
          key: `t-${t._id}-${li.itemName}`,
          kind,
          itemName: li.itemName,
          quantity,
          fromId: t.fromCenterId?._id || t.fromCenterId,
          fromTitle: t.fromCenterId?.title || "",
          toId: t.toCenterId?._id || t.toCenterId,
          toTitle: t.toCenterId?.title || "",
          transferNumber: t.transferNumber,
          updatedAt: t.dispatchedAt || t.createdAt,
        });
      });
    });
    return rows.map((r) => ({ ...r, statusLabel: STATUS_LABELS[r.kind] }));
  }, [balances, transfers]);

  // Search (item name or transfer number) and the Site filter apply to every tab and every count
  const scopedRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allRows.filter((r) => {
      if (siteId && r.fromId !== siteId && r.toId !== siteId) return false;
      if (!q) return true;
      return (
        (r.itemName || "").toLowerCase().includes(q) ||
        (r.transferNumber || "").toLowerCase().includes(q)
      );
    });
  }, [allRows, search, siteId]);

  const inTab = (r, key) =>
    key === "all" ||
    (key === "available" && r.kind === "available") ||
    (key === "created" && r.kind === "created") ||
    (key === "in_transit" && (r.kind === "in_transit" || r.kind === "difference"));

  const counts = useMemo(
    () => Object.fromEntries(TABS.map((t) => [t.key, scopedRows.filter((r) => inTab(r, t.key)).length])),
    [scopedRows],
  );
  const shownRows = useMemo(() => scopedRows.filter((r) => inTab(r, tab)), [scopedRows, tab]);

  const handleExport = () => {
    if (shownRows.length === 0) {
      toast.error("Nothing to export");
      return;
    }
    const count = exportInventory(shownRows, TABS.find((t) => t.key === tab).label);
    toast.success(`Exported ${count} rows`);
  };

  // Summary stats derived from the Available counters in view
  const stats = useMemo(() => {
    const avail = scopedRows.filter((r) => r.kind === "available");
    return {
      items: new Set(avail.map((r) => r.itemName)).size,
      sites: new Set(avail.map((r) => r.fromId)).size,
      totalQty: avail.reduce((sum, r) => sum + (r.quantity || 0), 0),
      zeroCount: avail.filter((r) => r.quantity === 0).length,
    };
  }, [scopedRows]);

  const statusPill = (r) => {
    const style = {
      available: { bg: "#ecfdf3", color: "#067647" },
      created: { bg: "#fffaeb", color: "#b54708" },
      in_transit: { bg: "#eff8ff", color: "#175cd3" },
      difference: { bg: "#fef3f2", color: "#b42318" },
    }[r.kind];
    return (
      <span
        style={{
          background: style.bg,
          color: style.color,
          padding: "3px 10px",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        {r.statusLabel}
      </span>
    );
  };

  const columns = [
    {
      name: "Item",
      selector: (row) => row.itemName,
      sortable: true,
      grow: 2,
      cell: (row) => <span className="fw-semibold">{row.itemName}</span>,
    },
    {
      name: "Status",
      width: "190px",
      cell: (row) => statusPill(row),
    },
    {
      name: "Site",
      sortable: true,
      selector: (row) => row.fromTitle || "—",
      cell: (row) => (
        <span className="d-flex align-items-center gap-1 text-muted">
          <i className="bx bx-map-pin"></i>
          {row.fromTitle || "—"}
          {row.toTitle ? ` → ${row.toTitle}` : ""}
        </span>
      ),
    },
    {
      name: "Quantity",
      sortable: true,
      selector: (row) => row.quantity,
      right: true,
      cell: (row) => (
        <span
          className={`fw-bold fs-6 ${row.kind === "available" && row.quantity === 0 ? "text-danger" : "text-dark"}`}
        >
          {row.quantity}
        </span>
      ),
    },
    {
      name: "Transfer #",
      width: "160px",
      cell: (row) => <span className="uom-cell-muted">{row.transferNumber || "—"}</span>,
    },
    {
      name: "Last Updated",
      cell: (row) => (
        <span className="uom-cell-muted small">{dateFmt(row.updatedAt)}</span>
      ),
    },
    {
      name: "",
      width: "130px",
      right: true,
      cell: (row) =>
        row.kind === "available" ? (
          <Button size="sm" color="light" onClick={() => openLedger(row.balance)}>
            <i className="bx bx-history me-1"></i> History
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="uom-page">
      <div className="uom-list-header">
        <div>
          <h4>Inventory / Stock Management</h4>
          <p>
            A live view of how much of each item is held at every site, and what is on its way
          </p>
        </div>
      </div>

      <div
        className="mb-3 p-3"
        style={{ background: "#f8f9fb", borderRadius: 8, border: "1px solid #edeff3", fontSize: 13 }}
      >
        <strong>Where the value sits.</strong>{" "}
        <b>Available</b>: held at a site. <b>Created</b>: a transfer is planned but nothing has left the source site yet.{" "}
        <b>In transit</b>: dispatched and not yet received; it is held by neither site until the destination receives it.
      </div>

      {/* Summary strip */}
      <div className="d-flex gap-3 mb-4 flex-wrap">
        <SummaryCard
          icon="bx-package"
          label="Items Tracked"
          value={stats.items}
        />
        <SummaryCard
          icon="bx-buildings"
          label="Sites With Stock"
          value={stats.sites}
        />
        <SummaryCard
          icon="bx-cube"
          label="Total Units On Hand"
          value={stats.totalQty}
        />
        <SummaryCard
          icon="bx-error-circle"
          label="Out of Stock Lines"
          value={stats.zeroCount}
          sub={stats.zeroCount > 0 ? "Needs attention" : "All good"}
        />
      </div>

      <div className="im-filter-pills-row mb-3">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`im-filter-pill ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label} <span className="ms-1">({counts[t.key]})</span>
          </button>
        ))}
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div className="d-flex gap-2 flex-wrap align-items-center">
          <div className="uom-search-wrap mb-0" style={{ minWidth: 280 }}>
            <i className="bx bx-search"></i>
            <Input
              placeholder="Search item name or transfer number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Input
            type="select"
            style={{ maxWidth: 220 }}
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
          >
            <option value="">All sites</option>
            {centers.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </Input>
        </div>
        <Button color="light" onClick={handleExport} title="Download what is shown on this screen">
          <i className="bx bx-download me-1"></i> Export
        </Button>
      </div>

      <div className="uom-table-card">
        <DataTable
          columns={columns}
          data={shownRows}
          customStyles={tableCustomStyles}
          progressPending={loading}
          pagination
          highlightOnHover
          defaultSortFieldId={1}
          noDataComponent={
            <div className="uom-empty-state">
              <p className="uom-empty-title">Nothing to show</p>
              <p className="uom-empty-sub">
                Stock appears here once a Goods Receipt Note (GRN) is created.
                Transfers appear in Created and In transit.
              </p>
            </div>
          }
        />
      </div>

      {/* Movement History Modal */}
      <Modal
        isOpen={!!ledgerModal}
        toggle={() => setLedgerModal(null)}
        centered
        size="lg"
      >
        <ModalBody className="p-4">
          {ledgerModal && (
            <>
              <div className="d-flex justify-content-between align-items-start mb-1">
                <div>
                  <h5 className="mb-0">{ledgerModal.itemName}</h5>
                  <p className="text-muted small mb-0">
                    {ledgerModal.centerId?.title}
                  </p>
                </div>
                <span className="fs-4 fw-bold">{ledgerModal.quantity}</span>
              </div>
              <hr />
              <h6 className="fw-semibold mb-3">Movement History</h6>

              {ledgerLoading ? (
                <div className="text-muted py-3">Loading...</div>
              ) : ledgerRows.length === 0 ? (
                <div className="uom-empty-state">
                  <p className="uom-empty-sub mb-0">
                    No movements recorded yet.
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    overflowX: "auto",
                    maxHeight: 420,
                    overflowY: "auto",
                  }}
                >
                  <div className="d-flex flex-column gap-2">
                    {ledgerRows.map((row) => (
                      <div
                        key={row._id}
                        className="p-3"
                        style={{
                          background: "#fafbfc",
                          borderRadius: 10,
                          border: "1px solid #f1f3f5",
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div className="d-flex align-items-center gap-2">
                            <span
                              className={`uom-status-pill ${row.transactionType === "in" ? "status-active" : "status-blacklisted"}`}
                            >
                              <span className="dot"></span>
                              {row.transactionType === "in"
                                ? "Stock IN"
                                : "Stock OUT"}
                            </span>
                            <span
                              className="text-muted text-capitalize"
                              style={{
                                fontSize: 11,
                                background: "#eef0f4",
                                padding: "2px 8px",
                                borderRadius: 20,
                              }}
                            >
                              {row.referenceType?.replace("_", " ")}
                            </span>
                          </div>
                          <span
                            className={`fw-bold fs-6 ${row.transactionType === "in" ? "text-success" : "text-danger"}`}
                          >
                            {row.transactionType === "in" ? "+" : "-"}
                            {row.quantity}
                          </span>
                        </div>

                        <div className="d-flex justify-content-between align-items-center">
                          <div className="text-muted small">
                            <i className="bx bx-hash"></i> {row.referenceNumber}
                          </div>
                          <div className="text-muted small">
                            <i className="bx bx-time-five"></i>{" "}
                            {dateFmt(row.transactionDate)}
                          </div>
                        </div>

                        {row.remarks && (
                          <div
                            className="text-muted small mt-2 pt-2"
                            style={{ borderTop: "1px dashed #e5e7eb" }}
                          >
                            {row.remarks}
                          </div>
                        )}

                        <div className="text-end mt-2" style={{ fontSize: 12 }}>
                          <span className="text-muted">Balance after: </span>
                          <span className="fw-semibold">
                            {row.balanceAfter}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="d-flex justify-content-end mt-3">
                <Button color="light" onClick={() => setLedgerModal(null)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </ModalBody>
      </Modal>
    </div>
  );
};

export default StockBalanceList;
