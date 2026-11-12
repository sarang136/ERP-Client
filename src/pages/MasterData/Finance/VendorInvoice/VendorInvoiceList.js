import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { Button, Input, Modal, ModalBody, Label } from "reactstrap";
import { toast } from "react-toastify";
import {
  getVendorInvoices,
  bookVendorInvoice,
  holdVendorInvoice,
  markVendorInvoicePaid,
} from "../../../../helpers/backend_helper";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { usePermissions } from "../../../../Components/Hooks/useRoles.js";
import "../../UnitOfMeasurement/uom.scss";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

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

const MatchBadge = ({ result }) => (
  <span className={`uom-status-pill ${result === "matched" ? "status-active" : "status-blacklisted"}`}>
    <span className="dot"></span> {result === "matched" ? "Matched" : "Mismatch"}
  </span>
);

const StatusPill = ({ status }) => {
  const labelMap = {
    pending_review: "Pending Review",
    on_hold: "On Hold",
    booked: "Booked",
    paid: "Paid",
  };
  const clsMap = {
    pending_review: "status-draft",
    on_hold: "status-blacklisted",
    booked: "status-active",
    paid: "status-active",
  };
  return (
    <span className={`uom-status-pill ${clsMap[status]}`}>
      <span className="dot"></span> {labelMap[status]}
    </span>
  );
};

const VendorInvoiceList = ({ onAdd }) => {
  const handleAuthError = useAuthError();
  const token = JSON.parse(localStorage.getItem("micrologin"))?.token;
  const { hasPermission } = usePermissions(token);
  const canCreate = hasPermission("MASTERDATA", "VENDOR_INVOICE", "WRITE");
  const canProcess = hasPermission("MASTERDATA", "VENDOR_INVOICE", "WRITE");

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [refreshFlag, setRefreshFlag] = useState(0);

  const [holdTarget, setHoldTarget] = useState(null);
  const [holdReason, setHoldReason] = useState("");
  const [holding, setHolding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchInvoices = async () => {
      setLoading(true);
      try {
        const res = await getVendorInvoices({ search });
        if (cancelled) return;
        setInvoices(res?.data || []);
      } catch (error) {
        if (cancelled) return;
        if (!handleAuthError(error)) {
          toast.error(error?.response?.data?.message || error?.message || "Couldn't load invoices.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchInvoices();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, refreshFlag]);

  const handleBook = async (id) => {
    try {
      await bookVendorInvoice(id);
      toast.success("Invoice booked successfully");
      setRefreshFlag((f) => f + 1);
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(error?.response?.data?.message || error?.message || "Couldn't book invoice.");
      }
    }
  };

  const confirmHold = async () => {
    if (!holdReason.trim()) return toast.error("Please provide a reason");
    setHolding(true);
    try {
      await holdVendorInvoice(holdTarget._id, holdReason.trim());
      toast.success("Invoice put on hold");
      setHoldTarget(null);
      setHoldReason("");
      setRefreshFlag((f) => f + 1);
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(error?.response?.data?.message || error?.message || "Couldn't hold invoice.");
      }
    } finally {
      setHolding(false);
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      await markVendorInvoicePaid(id);
      toast.success("Payment recorded");
      setRefreshFlag((f) => f + 1);
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(error?.response?.data?.message || error?.message || "Couldn't update.");
      }
    }
  };

  const columns = [
    {
      name: "Invoice Ref",
      selector: (row) => row.invoiceRecordNumber,
      sortable: true,
      width: "150px",
    },
    {
      name: "Vendor Invoice #",
      cell: (row) => <span className="uom-cell-muted">{row.vendorInvoiceNumber}</span>,
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
      name: "Amount",
      cell: (row) => <span className="uom-cell-primary">{money(row.totalAmount)}</span>,
    },
    {
      name: "Match",
      width: "120px",
      cell: (row) => <MatchBadge result={row.matchResult} />,
    },
    {
      name: "Status",
      width: "140px",
      cell: (row) => <StatusPill status={row.status} />,
    },
    {
      name: "Actions",
      width: "200px",
      right: true,
      cell: (row) => (
        <div className="d-flex gap-2 flex-wrap justify-content-end">
          {row.status === "pending_review" && row.matchResult === "matched" && canProcess && (
            <Button size="sm" color="success" onClick={() => handleBook(row._id)}>
              Book
            </Button>
          )}
          {row.status === "pending_review" && canProcess && (
            <Button size="sm" color="danger" outline onClick={() => setHoldTarget(row)}>
              Hold
            </Button>
          )}
          {row.status === "booked" && canProcess && (
            <Button size="sm" color="primary" onClick={() => handleMarkPaid(row._id)}>
              Mark Paid
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="uom-page">
      <div className="uom-list-header">
        <div>
          <h4>Vendor Invoices</h4>
          <p>Three-way match (PO vs GRN vs Invoice) and invoice booking</p>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="uom-search-wrap mb-0">
          <i className="bx bx-search"></i>
          <Input
            placeholder="Search invoice ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {canCreate && (
          <Button color="primary" onClick={onAdd}>
            <i className="bx bx-plus me-1"></i> Record Invoice
          </Button>
        )}
      </div>

      <div className="uom-table-card">
        <DataTable
          columns={columns}
          data={invoices}
          customStyles={tableCustomStyles}
          progressPending={loading}
          pagination
          highlightOnHover
          noDataComponent={
            <div className="uom-empty-state">
              <p className="uom-empty-title">No vendor invoices found</p>
              <p className="uom-empty-sub">Record one from a Goods Receipt Note.</p>
            </div>
          }
        />
      </div>

      <Modal isOpen={!!holdTarget} toggle={() => setHoldTarget(null)} centered>
        <ModalBody className="p-4">
          <h5 className="mb-3">Hold this invoice</h5>
          <Label>Reason</Label>
          <Input
            type="textarea"
            rows={3}
            value={holdReason}
            onChange={(e) => setHoldReason(e.target.value)}
            placeholder="e.g. Quantity mismatch — awaiting vendor clarification"
          />
          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button color="light" onClick={() => setHoldTarget(null)} disabled={holding}>
              Cancel
            </Button>
            <Button color="danger" onClick={confirmHold} disabled={holding}>
              {holding ? "Saving..." : "Put on Hold"}
            </Button>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
};

export default VendorInvoiceList;