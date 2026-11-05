import React, { useState, useEffect, useMemo } from "react";
import DataTable from "react-data-table-component";
import { Button, Input, Label, Modal, ModalBody } from "reactstrap";
import { toast } from "react-toastify";
import {
  getPOs,
  approvePO,
  cancelPO,
  shortClosePO,
} from "../../../../helpers/backend_helper";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { usePermissions } from "../../../../Components/Hooks/useRoles.js";
import "../../UnitOfMeasurement/uom.scss";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const tableCustomStyles = {
  headRow: {
    style: {
      backgroundColor: "#fff",
      borderBottom: "1px solid #edeff3",
      minHeight: "44px",
    },
  },
  headCells: {
    style: {
      fontSize: "13px",
      fontWeight: 600,
      color: "#475569",
      paddingLeft: "10px",
      paddingRight: "10px",
    },
  },
  cells: { style: { paddingLeft: "10px", paddingRight: "10px" } },
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
  pagination: {
    style: { borderTopColor: "#edeff3", fontSize: "13px", color: "#667085" },
  },
};

const PO_STATUS_META = {
  draft: { label: "Draft", bg: "#fffaeb", color: "#b54708" },
  approved: { label: "Approved", bg: "#ecfdf3", color: "#067647" },
  cancelled: { label: "Cancelled", bg: "#fef3f2", color: "#b42318" },
  short_closed: { label: "Short closed", bg: "#f2f4f7", color: "#475467" },
};

const StatusPill = ({ status }) => {
  const s = PO_STATUS_META[status] || PO_STATUS_META.draft;
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

const PO_TYPE_LABELS = {
  pr_based: "PR-Based",
  direct: "Direct",
  contract_based: "Contract-Based",
};

const DELIVERY_META = {
  not_started: { label: "Not started", bg: "#f2f4f7", color: "#475467" },
  partial: { label: "Partially received", bg: "#fffaeb", color: "#b54708" },
  completed: { label: "Completed", bg: "#ecfdf3", color: "#067647" },
  delayed: { label: "Delayed", bg: "#fef3f2", color: "#b42318" },
  short_closed: { label: "Closed early", bg: "#f2f4f7", color: "#475467" },
  cancelled: { label: "Cancelled", bg: "#fef3f2", color: "#b42318" },
};

const DeliveryCell = ({ delivery }) => {
  if (!delivery) return <span className="uom-cell-muted">—</span>;
  const meta =
    DELIVERY_META[delivery.deliveryStatus] || DELIVERY_META.not_started;
  return (
    <div className="py-1">
      <span
        style={{
          background: meta.bg,
          color: meta.color,
          padding: "3px 10px",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        {meta.label}
      </span>
      <div className="small text-muted mt-1">
        {delivery.receivedQty} / {delivery.orderedQty} received
        {delivery.deliveryStatus === "delayed" && (
          <span className="text-danger"> · {delivery.daysOverdue}d late</span>
        )}
      </div>
    </div>
  );
};

// Nothing received yet -> the PO is cancelled; something received -> it is short closed
const closeModeFor = (row) =>
  (row.delivery?.receivedQty || 0) > 0 ? "short_close" : "cancel";

const POList = ({ onAdd, onOpen }) => {
  const handleAuthError = useAuthError();
  const token = JSON.parse(localStorage.getItem("micrologin"))?.token;
  const { hasPermission } = usePermissions(token);
  const canCreate = hasPermission("MASTERDATA", "PO", "WRITE");
  const canApprove = hasPermission("MASTERDATA", "PO", "DELETE");
  const canClose = canApprove;

  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [refreshFlag, setRefreshFlag] = useState(0);

  const [closeTarget, setCloseTarget] = useState(null);
  const [closeReason, setCloseReason] = useState("");
  const [closing, setClosing] = useState(false);

  const shown = useMemo(() => {
    const clean = (s) =>
      String(s ?? "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
    const q = clean(search);
    if (!q) return pos;
    return pos.filter((r) =>
      [
        r.poNumber,
        r.poTitle,
        r.vendorId?.tradeName,
        r.vendorId?.legalName,
        r.deliverySiteId?.title,
        r.status,
        PO_TYPE_LABELS[r.poType],
      ].some((v) => clean(v).includes(q)),
    );
  }, [pos, search]);

  useEffect(() => {
    let cancelled = false;
    const fetchPOs = async () => {
      setLoading(true);
      try {
        const res = await getPOs({});
        if (cancelled) return;
        setPos(res?.data || []);
      } catch (error) {
        if (cancelled) return;
        if (!handleAuthError(error)) {
          toast.error(
            error?.response?.data?.message ||
              error?.message ||
              "Couldn't load POs.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchPOs();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshFlag]);

  const handleApprove = async (id) => {
    try {
      await approvePO(id);
      toast.success("PO approved successfully");
      setRefreshFlag((f) => f + 1);
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Couldn't approve PO.",
        );
      }
    }
  };

  const openClose = (row) => {
    setCloseTarget(row);
    setCloseReason("");
  };

  const confirmClose = async () => {
    if (!closeReason.trim()) {
      toast.error("Please write the reason");
      return;
    }
    const mode = closeModeFor(closeTarget);
    setClosing(true);
    try {
      if (mode === "cancel") {
        await cancelPO(closeTarget._id, { reason: closeReason.trim() });
        toast.success("PO cancelled, budget released");
      } else {
        await shortClosePO(closeTarget._id, { reason: closeReason.trim() });
        toast.success("PO short closed, budget released");
      }
      setCloseTarget(null);
      setRefreshFlag((f) => f + 1);
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Couldn't close PO.",
        );
      }
    } finally {
      setClosing(false);
    }
  };

  const columns = [
    {
      name: "PO Number",
      selector: (row) => row.poNumber,
      sortable: true,
      minWidth: "200px",
      cell: (row) => (
        <div style={{ lineHeight: 1.3, padding: "4px 0" }}>
          <div
            style={{ whiteSpace: "nowrap", fontWeight: 600 }}
            title={row.poNumber}
          >
            {row.poNumber}
          </div>
          {row.deliverySiteId?.title && (
            <div
              className="uom-cell-muted"
              style={{ fontSize: 12 }}
              title={row.deliverySiteId.title}
            >
              <i className="bx bx-buildings me-1"></i>
              {row.deliverySiteId.title}
            </div>
          )}
        </div>
      ),
    },
    {
      name: "Type",
      width: "115px",
      cell: (row) => (
        <span className="uom-cell-muted">{PO_TYPE_LABELS[row.poType]}</span>
      ),
    },
    {
      name: "Vendor",
      cell: (row) => (
        <span className="uom-cell-muted">
          {row.vendorId?.tradeName || row.vendorId?.legalName || "—"}
        </span>
      ),
    },
    {
      name: "Department",
      minWidth: "150px",
      cell: (row) => (
        <span className="uom-cell-muted">{row.departmentId?.name || "—"}</span>
      ),
    },
    {
      name: "Net Payable",
      cell: (row) => (
        <span className="uom-cell-primary">{money(row.netPayable)}</span>
      ),
    },
    {
      name: "Status",
      width: "115px",
      cell: (row) => <StatusPill status={row.status} />,
    },
    {
      name: "Delivery",
      width: "175px",
      cell: (row) => <DeliveryCell delivery={row.delivery} />,
    },
    {
      name: "Actions",
      width: "165px",
      right: true,
      cell: (row) => (
        <div className="d-flex gap-2 align-items-center">
          <Button size="sm" color="light" onClick={() => onOpen(row)}>
            <i className="bx bx-show"></i>
          </Button>
          {row.status === "draft" && canApprove && (
            <Button
              size="sm"
              color="success"
              onClick={() => handleApprove(row._id)}
            >
              Approve
            </Button>
          )}
          {row.status === "approved" &&
            canClose &&
            row.delivery?.deliveryStatus !== "completed" && (
              <Button
                size="sm"
                color="danger"
                outline
                onClick={() => openClose(row)}
              >
                {closeModeFor(row) === "cancel" ? "Cancel PO" : "Short close"}
              </Button>
            )}
        </div>
      ),
    },
  ];

  const mode = closeTarget ? closeModeFor(closeTarget) : "cancel";

  return (
    <div className="uom-page">
      <div className="uom-list-header">
        <div>
          <h4>Purchase Orders</h4>
          <p>
            Official orders issued to vendors — PR-based, direct, or
            contract-based
          </p>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="uom-search-wrap mb-0">
          <i className="bx bx-search"></i>
          <Input
            placeholder="Search PO number, vendor, title or status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {canCreate && (
          <Button color="primary" onClick={onAdd}>
            <i className="bx bx-plus me-1"></i> Create PO
          </Button>
        )}
      </div>

      <div className="uom-table-card">
        <DataTable
          columns={columns}
          data={shown}
          customStyles={tableCustomStyles}
          progressPending={loading}
          pagination
          paginationPerPage={25}
          paginationRowsPerPageOptions={[10, 25, 50, 100]}
          highlightOnHover
          noDataComponent={
            <div className="uom-empty-state">
              <p className="uom-empty-title">No purchase orders found</p>
              <p className="uom-empty-sub">
                Create a PO from a closed RFQ, or directly.
              </p>
            </div>
          }
        />
      </div>

      <Modal
        isOpen={!!closeTarget}
        toggle={() => setCloseTarget(null)}
        centered
      >
        <ModalBody className="p-4">
          <h5 className="mb-1">
            {mode === "cancel" ? "Cancel" : "Short close"}{" "}
            {closeTarget?.poNumber}
          </h5>
          <p className="text-muted small mb-3">
            {mode === "cancel"
              ? `No goods have been received. The whole PO (${money(closeTarget?.netPayable)}) will be cancelled and its budget released.`
              : `${closeTarget?.delivery?.receivedQty || 0} of ${closeTarget?.delivery?.orderedQty || 0} received. The PO will be closed and only the budget for the unreceived quantity will be released.`}
          </p>
          <Label>
            Reason <span className="text-danger">*</span>
          </Label>
          <Input
            type="textarea"
            rows={3}
            value={closeReason}
            onChange={(e) => setCloseReason(e.target.value)}
            placeholder="e.g. Vendor cannot supply the remaining items, wrong vendor selected"
          />
          <div className="text-danger small mt-2">This cannot be undone.</div>
          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button
              color="light"
              onClick={() => setCloseTarget(null)}
              disabled={closing}
            >
              Back
            </Button>
            <Button color="danger" onClick={confirmClose} disabled={closing}>
              {closing
                ? "Saving..."
                : mode === "cancel"
                  ? "Cancel PO"
                  : "Short close PO"}
            </Button>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
};

export default POList;
