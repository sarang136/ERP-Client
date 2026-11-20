import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { Button, Input } from "reactstrap";
import { toast } from "react-toastify";
import { getVendorPayments, getVendorPaymentSummary } from "../../../../helpers/backend_helper";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { usePermissions } from "../../../../Components/Hooks/useRoles.js";
import { useReferenceList } from "../../../../Components/Hooks/useReferenceData";
import VendorPaymentView from "./VendorPaymentView";
import RaisePaymentModal from "./RaisePaymentModal";
import { PAY_TABS, PayPill, money, errText, dateText, supplierName, tableCustomStyles } from "./vpUi";
import "../../UnitOfMeasurement/uom.scss";
import "../../shared/itemMasterForms.scss";

const Tile = ({ label, amount, note, tone, onClick }) => (
  <div className="p-3 flex-fill" style={{ minWidth: 190, cursor: onClick ? "pointer" : "default", borderRight: "1px solid #edeff3" }} onClick={onClick}>
    <div className="text-muted small text-uppercase" style={{ letterSpacing: 0.4 }}>{label}</div>
    <div className={`fs-4 fw-semibold ${tone || ""}`}>{money(amount)}</div>
    <div className="text-muted small">{note}</div>
  </div>
);

const VendorPaymentList = () => {
  const handleAuthError = useAuthError();
  const token = JSON.parse(localStorage.getItem("micrologin"))?.token;
  const { hasPermission } = usePermissions(token);
  const canWrite = hasPermission("MASTERDATA", "VENDOR_PAYMENT", "WRITE");
  const { items: vendors } = useReferenceList("vendorsAll");
  const { items: departments } = useReferenceList("departments");

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [people, setPeople] = useState({});
  const [loading, setLoading] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(0);

  const [tab, setTab] = useState("open");
  const [search, setSearch] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [requestedBy, setRequestedBy] = useState("");
  const [approvedBy, setApprovedBy] = useState("");
  const [due, setDue] = useState("");

  const [viewId, setViewId] = useState(null);
  const [raising, setRaising] = useState(false);

  const refresh = () => setRefreshFlag((f) => f + 1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getVendorPayments({
      tab,
      search,
      ...(vendorId ? { vendorId } : {}),
      ...(departmentId ? { departmentId } : {}),
      ...(requestedBy ? { requestedBy } : {}),
      ...(approvedBy ? { approvedBy } : {}),
      ...(due ? { due } : {}),
    })
      .then((res) => {
        if (cancelled) return;
        const data = res?.data || [];
        setRows(data);
        setPeople((prev) => {
          const next = { ...prev };
          data.forEach((r) => [r.requestedBy, r.approvedBy].forEach((p) => p?._id && (next[p._id] = p.name)));
          return next;
        });
      })
      .catch((e) => !cancelled && !handleAuthError(e) && toast.error(errText(e, "Couldn't load payments.")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, search, vendorId, departmentId, requestedBy, approvedBy, due, refreshFlag]);

  useEffect(() => {
    getVendorPaymentSummary().then((res) => setSummary(res?.data || null)).catch(() => setSummary(null));
  }, [refreshFlag]);

  const counts = summary?.tabCounts || {};
  const anyFilter = search || vendorId || departmentId || requestedBy || approvedBy || due;
  const clear = () => { setSearch(""); setVendorId(""); setDepartmentId(""); setRequestedBy(""); setApprovedBy(""); setDue(""); };

  const columns = [
    {
      name: "Payment",
      minWidth: "190px",
      cell: (r) => (
        <div>
          <div className="uom-cell-primary">{r.paymentNumber}</div>
          <div className="text-muted small">{r.invoiceNumber}{r.centralPaymentNo ? ` · Central Payment ${r.centralPaymentNo}` : ""}</div>
        </div>
      ),
    },
    { name: "Vendor", minWidth: "190px", grow: 2, cell: (r) => <div><div className="uom-cell-primary">{supplierName(r.vendorId)}</div><div className="text-muted small">{r.departmentId?.name || ""}</div></div> },
    { name: "Invoice due", width: "120px", cell: (r) => <span className="uom-cell-muted">{dateText(r.dueDate)}</span> },
    { name: "Net payable", width: "130px", right: true, cell: (r) => <span className="uom-cell-primary">{money(r.netPayable)}</span> },
    { name: "Stage", width: "140px", cell: (r) => <PayPill status={r.status} /> },
    { name: "Paid", width: "150px", cell: (r) => (r.status === "paid" ? <div><div className="small">{dateText(r.paidDate)}</div><div className="text-muted small">{r.utr}</div></div> : <span className="text-muted">—</span>) },
    {
      name: "Actions",
      width: "90px",
      right: true,
      cell: (r) => (
        <div className="d-flex gap-2 justify-content-end">
          <Button size="sm" color="light" title="View" onClick={() => setViewId(r._id)}><i className="bx bx-show"></i></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="uom-page">
      <div className="uom-list-header">
        <div>
          <h4>Vendor Payments {summary && <span className="badge bg-light text-muted fs-6 align-middle">{counts.open || 0} open</span>}</h4>
          <p>Raise a payment request from an approved bill. It goes to Central Payment, where it is approved and paid.</p>
        </div>
        {canWrite && (
          <div className="d-flex gap-2 flex-wrap">
            <Button color="primary" onClick={() => setRaising(true)}><i className="bx bx-plus me-1"></i>New payment request</Button>
          </div>
        )}
      </div>

      <div className="uom-table-card mb-3">
        <div className="d-flex flex-wrap">
          <Tile label="Needs approval" amount={summary?.needsApproval.amount} tone="text-warning" note={summary?.needsApproval.count ? `${summary.needsApproval.count} waiting in Central Payment` : "nothing waiting for approval"} onClick={() => setTab("needs_approval")} />
          <Tile label="Approved, not paid" amount={summary?.readyToPay.amount} note={summary?.readyToPay.count ? `${summary.readyToPay.count} approved, waiting to be paid` : "nothing approved and unpaid"} onClick={() => setTab("ready_to_pay")} />
          <Tile label="Overdue" amount={summary?.overdue.amount} tone={summary?.overdue.count ? "text-danger" : ""} note={summary?.overdue.count ? `${summary.overdue.count} past due date` : "nothing past its due date"} onClick={() => setDue("overdue")} />
          <Tile label="Paid" amount={summary?.paid.amount} tone="text-success" note={summary?.paid.count ? `${summary.paid.count} payments made` : "no payments made yet"} onClick={() => setTab("paid")} />
        </div>
      </div>

      <div className="im-filter-pills-row mb-2">
        {PAY_TABS.map((t) => (
          <button key={t.key} type="button" className={`im-filter-pill ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
            {t.label} <span className="ms-1 text-muted">{counts[t.key] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="d-flex gap-2 flex-wrap mb-3">
        <div className="uom-search-wrap mb-0">
          <i className="bx bx-search"></i>
          <Input placeholder="Search payment, invoice, UTR" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Input type="select" style={{ maxWidth: 190 }} value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
          <option value="">All vendors</option>
          {vendors.map((v) => <option key={v._id} value={v._id}>{supplierName(v)}</option>)}
        </Input>
        <Input type="select" style={{ maxWidth: 170 }} value={requestedBy} onChange={(e) => setRequestedBy(e.target.value)}>
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
        <Input type="select" style={{ maxWidth: 160 }} value={due} onChange={(e) => setDue(e.target.value)}>
          <option value="">Any due date</option>
          <option value="overdue">Overdue</option>
          <option value="week">Due in 7 days</option>
        </Input>
        {anyFilter && <Button color="light" onClick={clear}>Clear filters</Button>}
      </div>

      <div className="uom-table-card">
        <DataTable
          columns={columns}
          data={rows}
          customStyles={tableCustomStyles}
          progressPending={loading}
          pagination
          highlightOnHover
          noDataComponent={
            <div className="uom-empty-state">
              <p className="uom-empty-title">{anyFilter ? "No payments match these filters" : "No payment requests here"}</p>
              <p className="uom-empty-sub">Payment requests are raised from approved vendor invoices.</p>
              {canWrite && !anyFilter && <Button color="light" onClick={() => setRaising(true)}>Invoices ready to request</Button>}
            </div>
          }
        />
      </div>

      {viewId && <VendorPaymentView paymentId={viewId} canWrite={canWrite} onClose={() => setViewId(null)} onChanged={refresh} />}
      {raising && <RaisePaymentModal onClose={() => setRaising(false)} onRaised={() => { setRaising(false); refresh(); }} />}
    </div>
  );
};

export default VendorPaymentList;
