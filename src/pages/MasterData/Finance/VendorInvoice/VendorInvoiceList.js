import React, { useState, useEffect, useMemo } from "react";
import DataTable from "react-data-table-component";
import { Button, Input, Modal, ModalBody, Label } from "reactstrap";
import { toast } from "react-toastify";
import {
  getVendorInvoices,
  getVendorInvoiceSummary,
  bookVendorInvoice,
  holdVendorInvoice,
  markVendorInvoicePaid,
  submitVendorInvoice,
} from "../../../../helpers/backend_helper";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { usePermissions } from "../../../../Components/Hooks/useRoles.js";
import { useReferenceList } from "../../../../Components/Hooks/useReferenceData";
import VendorInvoiceView from "./VendorInvoiceView";
import RaisePaymentModal from "../VendorPayment/RaisePaymentModal";
import { StagePill, STAGE_TABS, TYPE_LABELS, money, errText, dateText, supplierName, tableCustomStyles } from "./viUi";
import "../../UnitOfMeasurement/uom.scss";
import "../../shared/itemMasterForms.scss";

const PERIODS = [
  { key: "month", label: "This month" },
  { key: "quarter", label: "This quarter" },
  { key: "fy", label: "This FY" },
  { key: "all", label: "All time" },
];

const Tile = ({ label, amount, note, tone, onClick, active }) => (
  <div
    className="p-3 flex-fill"
    style={{ minWidth: 170, cursor: onClick ? "pointer" : "default", background: active ? "#f3f4f6" : "transparent", borderRight: "1px solid #edeff3" }}
    onClick={onClick}
  >
    <div className="text-muted small text-uppercase" style={{ letterSpacing: 0.4 }}>{label}</div>
    <div className={`fs-4 fw-semibold ${tone || ""}`}>{money(amount)}</div>
    <div className="text-muted small">{note}</div>
  </div>
);

const periodText = (s) => {
  if (!s?.period?.from) return "Bills of all time";
  const to = new Date(s.period.to);
  to.setDate(to.getDate() - 1);
  return `Bills dated ${dateText(s.period.from)} to ${dateText(to)}`;
};

const VendorInvoiceList = ({ onAdd, onEdit }) => {
  const handleAuthError = useAuthError();
  const token = JSON.parse(localStorage.getItem("micrologin"))?.token;
  const { hasPermission } = usePermissions(token);
  const canWrite = hasPermission("MASTERDATA", "VENDOR_INVOICE", "WRITE");
  const canPay = hasPermission("MASTERDATA", "VENDOR_PAYMENT", "WRITE");
  const { items: vendors } = useReferenceList("vendorsAll");
  const { items: departments } = useReferenceList("departments");

  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [people, setPeople] = useState({}); // id -> name, for the "Submitted by" and "Approved by" filters
  const [loading, setLoading] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [period, setPeriod] = useState("fy");

  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [invoiceType, setInvoiceType] = useState("");
  const [submittedBy, setSubmittedBy] = useState("");
  const [approvedBy, setApprovedBy] = useState("");
  const [due, setDue] = useState("");

  const [viewId, setViewId] = useState(null);
  const [payFor, setPayFor] = useState(null); // an invoice id: raise a payment request for it
  const [holdTarget, setHoldTarget] = useState(null);
  const [holdReason, setHoldReason] = useState("");
  const [holding, setHolding] = useState(false);

  const refresh = () => setRefreshFlag((f) => f + 1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getVendorInvoices({
      search,
      ...(stage ? { stage } : {}),
      ...(vendorId ? { vendorId } : {}),
      ...(departmentId ? { departmentId } : {}),
      ...(invoiceType ? { invoiceType } : {}),
      ...(submittedBy ? { submittedBy } : {}),
      ...(approvedBy ? { approvedBy } : {}),
      ...(due ? { due } : {}),
    })
      .then((res) => {
        if (cancelled) return;
        const rows = res?.data || [];
        setInvoices(rows);
        setPeople((prev) => {
          const next = { ...prev };
          rows.forEach((r) => {
            [r.approval?.submittedBy, r.approval?.approvedBy].forEach((p) => p?._id && (next[p._id] = p.name));
          });
          return next;
        });
      })
      .catch((e) => !cancelled && !handleAuthError(e) && toast.error(errText(e, "Couldn't load invoices.")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, stage, vendorId, departmentId, invoiceType, submittedBy, approvedBy, due, refreshFlag]);

  useEffect(() => {
    getVendorInvoiceSummary({ period })
      .then((res) => setSummary(res?.data || null))
      .catch((e) => !handleAuthError(e) && setSummary(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, refreshFlag]);

  const act = async (fn, okMessage) => {
    try {
      const res = await fn();
      toast.success(res?.message || okMessage);
      refresh();
    } catch (e) {
      if (!handleAuthError(e)) toast.error(errText(e, "That didn't work."));
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
      refresh();
    } catch (e) {
      if (!handleAuthError(e)) toast.error(errText(e, "Couldn't hold invoice."));
    } finally {
      setHolding(false);
    }
  };

  const counts = summary?.stageCounts || {};
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);
  const vendorOptions = useMemo(() => vendors.map((v) => ({ id: v._id, name: supplierName(v) })), [vendors]);
  const clearFilters = () => {
    setSearch(""); setStage(""); setVendorId(""); setDepartmentId(""); setInvoiceType(""); setSubmittedBy(""); setApprovedBy(""); setDue("");
  };
  const anyFilter = search || stage || vendorId || departmentId || invoiceType || submittedBy || approvedBy || due;

  const columns = [
    {
      name: "Invoice",
      minWidth: "190px",
      cell: (row) => (
        <div>
          <div className="uom-cell-primary">{row.vendorInvoiceNumber}</div>
          <div className="text-muted small">{row.invoiceRecordNumber} · {TYPE_LABELS[row.invoiceType] || "Tax invoice"}</div>
        </div>
      ),
    },
    {
      name: "Vendor",
      minWidth: "200px",
      grow: 2,
      cell: (row) => (
        <div>
          <div className="uom-cell-primary">{supplierName(row.vendorId)}</div>
          <div className="text-muted small">{row.poId?.poNumber || (row.source === "direct" ? "No PO" : "—")}{row.departmentId?.name ? ` · ${row.departmentId.name}` : ""}</div>
        </div>
      ),
    },
    { name: "Due", width: "120px", cell: (row) => <span className="uom-cell-muted">{dateText(row.dueDate)}</span> },
    { name: "Amount", width: "130px", right: true, cell: (row) => <span className="uom-cell-primary">{money(row.totalAmount)}</span> },
    { name: "Stage", width: "160px", cell: (row) => <StagePill stage={row.stage} /> },
    {
      name: "Actions",
      width: "300px",
      right: true,
      cell: (row) => {
        const direct = row.source === "direct";
        const a = row.approval?.status;
        return (
          <div className="d-flex gap-2 flex-wrap justify-content-end">
            <Button size="sm" color="light" title="View" onClick={() => setViewId(row._id)}><i className="bx bx-show"></i></Button>
            {canWrite && direct && ["draft", "rejected"].includes(a) && (
              <Button size="sm" color="light" title="Edit" onClick={() => onEdit(row)}><i className="bx bx-edit-alt"></i></Button>
            )}
            {canWrite && direct && a === "draft" && (
              <Button size="sm" color="primary" onClick={() => act(() => submitVendorInvoice(row._id), "Bill sent for approval")}>Submit</Button>
            )}
            {canWrite && direct && a === "submitted" && (
              <Button size="sm" color="success" onClick={() => setViewId(row._id)}>Review</Button>
            )}
            {/* the older GRN-match invoices keep their own buttons */}
            {canWrite && !direct && row.status === "pending_review" && row.matchResult === "matched" && (
              <Button size="sm" color="success" onClick={() => act(() => bookVendorInvoice(row._id), "Invoice booked successfully")}>Book</Button>
            )}
            {canWrite && !direct && row.status === "pending_review" && (
              <Button size="sm" color="danger" outline onClick={() => setHoldTarget(row)}>Hold</Button>
            )}
            {canPay && row.status === "booked" && row.invoiceType !== "proforma" && ["ready_to_request", "in_payment"].includes(row.stage) && (
              <Button size="sm" color="primary" onClick={() => setPayFor(row._id)}>Request payment</Button>
            )}
            {/* a bill from the older GRN flow can still be marked paid by hand; a direct bill is paid through Vendor Payments */}
            {canWrite && !direct && row.status === "booked" && !(row.requestedPaise > 0) && (
              <Button size="sm" color="light" onClick={() => act(() => markVendorInvoicePaid(row._id), "Payment recorded")}>Mark Paid</Button>
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
          <h4>Vendor Invoices</h4>
          <p>Book supplier bills, route them for approval and raise payment requests.</p>
        </div>
        {canWrite && (
          <div className="d-flex gap-2">
            <Button color="primary" onClick={onAdd}><i className="bx bx-plus me-1"></i> New invoice</Button>
          </div>
        )}
      </div>

      {/* ---- Money with vendors ---- */}
      <div className="uom-table-card mb-3">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 p-3 border-bottom">
          <div>
            <div className="fw-semibold">Money with vendors</div>
            <div className="text-muted small">{summary ? periodText(summary) : "Loading..."}</div>
          </div>
          <div className="im-filter-pills-row mb-0">
            {PERIODS.map((p) => (
              <button key={p.key} type="button" className={`im-filter-pill ${period === p.key ? "active" : ""}`} onClick={() => setPeriod(p.key)}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="d-flex flex-wrap">
          <Tile label="Total billed" amount={summary?.billed.amount} note={`${summary?.billed.count || 0} approved bills`} />
          <Tile label="Paid" amount={summary?.paid.amount} tone="text-success" note={summary?.paid.count ? `${summary.paid.count} bills paid` : "nothing paid yet"} />
          <Tile label="Outstanding" amount={summary?.outstanding.amount} note={summary?.outstanding.count ? `${summary.outstanding.count} bills owed to vendors` : "nothing owed to vendors"} />
          <Tile label="In approval" amount={summary?.inApproval.amount} tone="text-warning" note={summary?.inApproval.count ? `${summary.inApproval.count} waiting for approval` : "nothing waiting for approval"} onClick={() => setStage("awaiting_approval")} />
        </div>
        <div className="px-3 py-2 bg-light text-muted small border-top border-bottom">
          WHERE THE OUTSTANDING SITS · Ready to request = Outstanding · Overdue and due this week are parts of it
        </div>
        <div className="d-flex flex-wrap">
          <Tile label="Overdue" amount={summary?.overdue.amount} tone={summary?.overdue.count ? "text-danger" : ""} note={summary?.overdue.count ? `${summary.overdue.count} past due date` : "nothing past its due date"} onClick={() => setDue("overdue")} active={due === "overdue"} />
          <Tile label="Due in 7 days" amount={summary?.dueIn7Days.amount} note={summary?.dueIn7Days.count ? `${summary.dueIn7Days.count} due this week` : "nothing due this week"} onClick={() => setDue("week")} active={due === "week"} />
          <Tile label="In payment" amount={summary?.inPayment.amount} note={summary?.inPayment.count ? `${summary.inPayment.count} payment requests open` : "no payment requests open"} onClick={() => setStage("in_payment")} />
          <Tile label="Ready to request" amount={summary?.readyToRequest.amount} note={summary?.readyToRequest.count ? `${summary.readyToRequest.count} approved bills` : "nothing approved and unpaid"} onClick={() => setStage("ready_to_request")} />
          <Tile label="Advance awaiting bill" amount={summary?.advanceAwaitingBill.amount} note={summary?.advanceAwaitingBill.count ? `${summary.advanceAwaitingBill.count} paid advances` : "no paid advance"} />
        </div>
      </div>

      {/* ---- Tabs ---- */}
      <div className="im-filter-pills-row mb-2">
        {STAGE_TABS.map((t) => (
          <button key={t.key || "all"} type="button" className={`im-filter-pill ${stage === t.key ? "active" : ""}`} onClick={() => setStage(t.key)}>
            {t.label} <span className="ms-1 text-muted">{t.key ? counts[t.key] ?? 0 : totalCount}</span>
          </button>
        ))}
      </div>

      {/* ---- Filters ---- */}
      <div className="d-flex gap-2 flex-wrap mb-3">
        <div className="uom-search-wrap mb-0">
          <i className="bx bx-search"></i>
          <Input placeholder="Search invoice, PO, purpose" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Input type="select" style={{ maxWidth: 190 }} value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
          <option value="">All vendors</option>
          {vendorOptions.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </Input>
        <Input type="select" style={{ maxWidth: 170 }} value={submittedBy} onChange={(e) => setSubmittedBy(e.target.value)}>
          <option value="">Submitted by</option>
          {Object.entries(people).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </Input>
        <Input type="select" style={{ maxWidth: 170 }} value={approvedBy} onChange={(e) => setApprovedBy(e.target.value)}>
          <option value="">Approved by</option>
          {Object.entries(people).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </Input>
        <Input type="select" style={{ maxWidth: 190 }} value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
          <option value="">All departments</option>
          {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
        </Input>
        <Input type="select" style={{ maxWidth: 150 }} value={invoiceType} onChange={(e) => setInvoiceType(e.target.value)}>
          <option value="">All types</option>
          {Object.entries(TYPE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </Input>
        <Input type="select" style={{ maxWidth: 160 }} value={due} onChange={(e) => setDue(e.target.value)}>
          <option value="">Any due date</option>
          <option value="overdue">Overdue</option>
          <option value="week">Due in 7 days</option>
        </Input>
        {anyFilter && <Button color="light" onClick={clearFilters}>Clear filters</Button>}
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
              <p className="uom-empty-title">{anyFilter ? "No invoices match these filters" : "No vendor invoices yet"}</p>
              <p className="uom-empty-sub">{anyFilter ? "Clear the filters to see everything." : "Add the first supplier bill."}</p>
            </div>
          }
        />
      </div>

      {payFor && <RaisePaymentModal startInvoiceId={payFor} onClose={() => setPayFor(null)} onRaised={() => { setPayFor(null); refresh(); }} />}

      {viewId && (
        <VendorInvoiceView
          invoiceId={viewId}
          canWrite={canWrite}
          onClose={() => setViewId(null)}
          onChanged={refresh}
          onEdit={(inv) => { setViewId(null); onEdit(inv); }}
        />
      )}

      <Modal isOpen={!!holdTarget} toggle={() => setHoldTarget(null)} centered>
        <ModalBody className="p-4">
          <h5 className="mb-3">Hold this invoice</h5>
          <Label>Reason</Label>
          <Input type="textarea" rows={3} value={holdReason} onChange={(e) => setHoldReason(e.target.value)} placeholder="e.g. Quantity mismatch, awaiting vendor clarification" />
          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button color="light" onClick={() => setHoldTarget(null)} disabled={holding}>Cancel</Button>
            <Button color="danger" onClick={confirmHold} disabled={holding}>{holding ? "Saving..." : "Put on Hold"}</Button>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
};

export default VendorInvoiceList;
