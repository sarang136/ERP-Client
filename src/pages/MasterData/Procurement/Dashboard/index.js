import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { Button, Input, Label, Modal, ModalBody } from "reactstrap";
import { toast } from "react-toastify";
import {
  getProcurementDashboard,
  setPODelayReason,
} from "../../../../helpers/backend_helper";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { usePermissions } from "../../../../Components/Hooks/useRoles.js";
import "../../UnitOfMeasurement/uom.scss";
import { useReferenceList } from "../../../../Components/Hooks/useReferenceData";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const dateFmt = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "—");

const STATUS_META = {
  not_started: { label: "Not started", bg: "#f2f4f7", color: "#475467" },
  partial: { label: "Partially received", bg: "#fffaeb", color: "#b54708" },
  completed: { label: "Completed", bg: "#ecfdf3", color: "#067647" },
  delayed: { label: "Delayed", bg: "#fef3f2", color: "#b42318" },
  short_closed: { label: "Short closed", bg: "#f2f4f7", color: "#475467" },
  cancelled: { label: "Cancelled", bg: "#fef3f2", color: "#b42318" },
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "delayed", label: "Delayed" },
  { key: "partial", label: "Partial" },
  { key: "not_started", label: "Not started" },
  { key: "completed", label: "Completed" },
  { key: "closed", label: "Closed" },
];

const StatusBadge = ({ status }) => {
  const s = STATUS_META[status] || STATUS_META.not_started;
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {s.label}
    </span>
  );
};

const StatCard = ({ label, value, sub }) => (
  <div className="uom-table-card p-3" style={{ flex: 1, minWidth: 170 }}>
    <div className="text-muted small">{label}</div>
    <div className="fs-4 fw-bold">{value}</div>
    {sub && <div className="text-muted small">{sub}</div>}
  </div>
);

const ProcurementDashboard = () => {
  const handleAuthError = useAuthError();
  const token = JSON.parse(localStorage.getItem("micrologin"))?.token;
  const { hasPermission } = usePermissions(token);
  const canEdit = hasPermission("MASTERDATA", "PO", "WRITE");

  const [rows, setRows] = useState([]);
  const [closedRows, setClosedRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [centerRows, setCenterRows] = useState([]);
  const [centerId, setCenterId] = useState("");
  const { items: centers } = useReferenceList("centers");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [refreshFlag, setRefreshFlag] = useState(0);

  const [reasonTarget, setReasonTarget] = useState(null);
  const [reasonText, setReasonText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getProcurementDashboard({ centerId: centerId || undefined })
      .then((res) => {
        if (cancelled) return;
        setRows(res?.data?.rows || []);
        setClosedRows(res?.data?.closedRows || []);
        setSummary(res?.data?.summary || null);
        setCenterRows(res?.data?.centers || []);
      })
      .catch((error) => {
        if (cancelled) return;
        if (!handleAuthError(error)) {
          toast.error(
            error?.response?.data?.message ||
              error?.message ||
              "Couldn't load dashboard.",
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
  }, [refreshFlag, centerId]);

  const openReason = (row) => {
    setReasonTarget(row);
    setReasonText(row.delayReason || "");
  };

  const saveReason = async () => {
    if (!reasonText.trim()) {
      toast.error("Please write the reason for the delay");
      return;
    }
    setSaving(true);
    try {
      await setPODelayReason(reasonTarget._id, {
        delayReason: reasonText.trim(),
      });
      toast.success("Delay reason saved");
      setReasonTarget(null);
      setRefreshFlag((f) => f + 1);
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Couldn't save reason",
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const isClosedView = filter === "closed";
  const visibleRows = isClosedView
    ? closedRows
    : filter === "all"
      ? rows
      : rows.filter((r) => r.deliveryStatus === filter);

  const countFor = (key) => {
    if (key === "closed") return closedRows.length;
    if (key === "all") return rows.length;
    return rows.filter((r) => r.deliveryStatus === key).length;
  };

  const columns = [
    {
      name: "PO #",
      selector: (row) => row.poNumber,
      sortable: true,
      minWidth: "200px",
      cell: (row) => (
        <span
          style={{ whiteSpace: "nowrap", fontWeight: 600 }}
          title={row.poNumber}
        >
          {row.poNumber}
        </span>
      ),
    },
    {
      name: "Center",
      minWidth: "140px",
      wrap: true,
      cell: (row) => <span className="uom-cell-muted">{row.centerName || "—"}</span>,
    },
    {
      name: "Vendor",
      minWidth: "170px",
      wrap: true,
      cell: (row) => <span className="uom-cell-primary">{row.vendorName}</span>,
    },
    {
      name: "Expected Delivery",
      width: "150px",
      cell: (row) => (
        <span className="uom-cell-muted">
          {dateFmt(row.expectedDeliveryDate)}
        </span>
      ),
    },
    { name: "Ordered", selector: (row) => row.orderedQty, width: "95px" },
    { name: "Received", selector: (row) => row.receivedQty, width: "100px" },
    {
      name: isClosedView ? "Not received" : "Pending",
      width: "120px",
      cell: (row) => <span>{row.pendingQty}</span>,
    },
    {
      name: "Status",
      width: "190px",
      cell: (row) => (
        <div>
          <StatusBadge status={row.deliveryStatus} />
          {row.deliveryStatus === "delayed" && (
            <div className="small text-danger mt-1">
              {row.daysOverdue} day{row.daysOverdue === 1 ? "" : "s"} late
            </div>
          )}
        </div>
      ),
    },
    {
      name: isClosedView ? "Closed" : "Delay Reason",
      minWidth: "260px",
      cell: (row) => {
        if (isClosedView) {
          return (
            <div className="py-1">
              <div className="small">{row.closeReason || "—"}</div>
              <div className="small text-muted mt-1">
                Closed {dateFmt(row.closedAt)} · {money(row.releasedAmount)}{" "}
                budget released
              </div>
            </div>
          );
        }
        if (row.deliveryStatus !== "delayed")
          return <span className="uom-cell-muted">—</span>;
        return (
          <div className="py-1">
            {row.delayReason ? (
              <div className="small">{row.delayReason}</div>
            ) : (
              <div className="small text-danger">Reason not recorded</div>
            )}
            {canEdit && (
              <Button
                size="sm"
                color="light"
                className="mt-1"
                onClick={() => openReason(row)}
              >
                {row.delayReason ? "Edit reason" : "Add reason"}
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="uom-page">
      <div className="uom-list-header">
        <div>
          <h4>Procurement Dashboard</h4>
          <p>
            Ordered vs received vs pending for every approved purchase order
          </p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <Input
            type="select"
            style={{ width: 200 }}
            value={centerId}
            onChange={(e) => setCenterId(e.target.value)}
            aria-label="Center"
          >
            <option value="">All centers</option>
            {centers.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </Input>
          <Button color="light" onClick={() => setRefreshFlag((f) => f + 1)}>
            <i className="bx bx-refresh me-1"></i> Refresh
          </Button>
        </div>
      </div>

      {summary && (
        <div className="d-flex gap-3 flex-wrap mb-3">
          <StatCard
            label="Approved POs"
            value={summary.totalPOs}
            sub={money(summary.totalValue)}
          />
          <StatCard label="Ordered Qty" value={summary.orderedQty} />
          <StatCard label="Received Qty" value={summary.receivedQty} />
          <StatCard label="Pending Qty" value={summary.pendingQty} />
          <StatCard
            label="Delayed POs"
            value={summary.delayedCount}
            sub="Past expected date"
          />
          {filter === "closed" && (
            <StatCard
              label="Closed POs"
              value={summary.closedCount}
              sub={`${money(summary.releasedTotal)} budget released`}
            />
          )}
        </div>
      )}

      {centerRows.length > 0 && (
        <div className="uom-table-card mb-3" style={{ overflowX: "auto" }}>
          <div className="px-3 pt-3 fw-semibold">Center-wise</div>
          <table className="table table-sm align-middle mb-0">
            <thead>
              <tr>
                <th className="ps-3">Center</th>
                <th className="text-end">Approved POs</th>
                <th className="text-end">PO value</th>
                <th className="text-end">Ordered</th>
                <th className="text-end">Received</th>
                <th className="text-end">Pending</th>
                <th className="text-end">Delayed</th>
                <th className="text-end pe-3">Closed</th>
              </tr>
            </thead>
            <tbody>
              {centerRows.map((c) => (
                <tr
                  key={c.centerId || "none"}
                  style={{
                    cursor: c.centerId ? "pointer" : "default",
                    background: c.centerId && c.centerId === centerId ? "#eef2ff" : undefined,
                  }}
                  onClick={() =>
                    c.centerId && setCenterId(c.centerId === centerId ? "" : c.centerId)
                  }
                >
                  <td className="ps-3 fw-semibold">{c.centerName}</td>
                  <td className="text-end">{c.totalPOs}</td>
                  <td className="text-end">{money(c.totalValue)}</td>
                  <td className="text-end">{c.orderedQty}</td>
                  <td className="text-end">{c.receivedQty}</td>
                  <td className="text-end">{c.pendingQty}</td>
                  <td className={`text-end ${c.delayedCount ? "text-danger fw-semibold" : ""}`}>
                    {c.delayedCount}
                  </td>
                  <td className="text-end pe-3">{c.closedCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-muted small px-3 pb-2">
            Click a center to see only its purchase orders.
          </div>
        </div>
      )}

      <div className="d-flex gap-2 flex-wrap mb-3">
        {FILTERS.map((f) => (
          <Button
            key={f.key}
            size="sm"
            color={filter === f.key ? "dark" : "light"}
            onClick={() => setFilter(f.key)}
          >
            {f.label} ({countFor(f.key)})
          </Button>
        ))}
      </div>

      {isClosedView && (
        <div className="text-muted small mb-2">
          Short-closed and cancelled POs. They are not counted in the totals
          above.
        </div>
      )}

      <div className="uom-table-card" style={{ overflowX: "auto" }}>
        <DataTable
          columns={columns}
          data={visibleRows}
          progressPending={loading}
          pagination
          paginationPerPage={25}
          paginationRowsPerPageOptions={[10, 25, 50, 100]}
          highlightOnHover
          noDataComponent={
            <div className="uom-empty-state">
              <p className="uom-empty-title">
                {isClosedView
                  ? "No closed purchase orders"
                  : "No purchase orders found"}
              </p>
              <p className="uom-empty-sub">
                {isClosedView
                  ? "Short-closed and cancelled POs will show up here."
                  : "Approved purchase orders will show up here."}
              </p>
            </div>
          }
        />
      </div>

      <Modal
        isOpen={!!reasonTarget}
        toggle={() => setReasonTarget(null)}
        centered
      >
        <ModalBody className="p-4">
          <h5 className="mb-1">Delay reason — {reasonTarget?.poNumber}</h5>
          <p className="text-muted small mb-3">
            {reasonTarget &&
              `${reasonTarget.daysOverdue} day${reasonTarget.daysOverdue === 1 ? "" : "s"} past the expected delivery date. Why is it delayed?`}
          </p>
          <Label>Reason</Label>
          <Input
            type="textarea"
            rows={3}
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
            placeholder="e.g. Vendor stock shortage, transport strike, quality rejection"
          />
          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button
              color="light"
              onClick={() => setReasonTarget(null)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button color="primary" onClick={saveReason} disabled={saving}>
              {saving ? "Saving..." : "Save reason"}
            </Button>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
};

export default ProcurementDashboard;
