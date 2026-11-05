import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { Button, Input, Modal, ModalBody, Label } from "reactstrap";
import { toast } from "react-toastify";
import {
  getBudgets,
  deleteBudget,
  submitBudget,
  approveBudget,
  rejectBudget,
  getBudgetUsage,
  adjustBudgetAmount,
} from "../../../../helpers/backend_helper";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { usePermissions } from "../../../../Components/Hooks/useRoles.js";
import "../../UnitOfMeasurement/uom.scss";

const tableCustomStyles = {
  headRow: {
    style: {
      backgroundColor: "#fff",
      borderBottom: "1px solid #edeff3",
      minHeight: "44px",
    },
  },
  headCells: {
    style: { fontSize: "13px", fontWeight: 600, color: "#475569", paddingLeft: "10px", paddingRight: "10px" },
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

const StatusPill = ({ status }) => {
  const cls =
    status === "approved"
      ? "status-active"
      : status === "rejected"
        ? "status-blacklisted"
        : status === "submitted"
          ? "status-draft"
          : "status-inactive";
  return (
    <span className={`uom-status-pill ${cls}`}>
      <span className="dot"></span>{" "}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const dateFmt = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "—");

const PO_STATUS = {
  draft: { label: "Draft", color: "#b54708" },
  approved: { label: "Approved", color: "#067647" },
  cancelled: { label: "Cancelled", color: "#b42318" },
  short_closed: { label: "Short closed", color: "#475467" },
};

// green while there is room, amber when it is getting tight, red when nearly gone
const usageColor = (percent) => (percent >= 90 ? "#d92d20" : percent >= 70 ? "#f79009" : "#12b76a");

const availableOf = (b) => (b.status === "approved" ? (b.approvedAmount || 0) - (b.consumedAmount || 0) : null);

const AmountCard = ({ label, value, sub, color }) => (
  <div className="uom-table-card p-3" style={{ flex: 1, minWidth: 150 }}>
    <div className="text-muted small">{label}</div>
    <div className="fs-5 fw-bold" style={color ? { color } : undefined}>
      {value}
    </div>
    {sub && <div className="text-muted small">{sub}</div>}
  </div>
);

const BudgetList = ({ onAdd, onEdit }) => {
  const handleAuthError = useAuthError();
  const token = JSON.parse(localStorage.getItem("micrologin"))?.token;
  const { hasPermission } = usePermissions(token);
  const canCreate = hasPermission("MASTERDATA", "BUDGET", "WRITE");
  const canEdit = hasPermission("MASTERDATA", "BUDGET", "WRITE");
  const canApprove = hasPermission("MASTERDATA", "BUDGET", "WRITE");
  const canDelete = hasPermission("MASTERDATA", "BUDGET", "WRITE");

  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [refreshFlag, setRefreshFlag] = useState(0);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [approveTarget, setApproveTarget] = useState(null);
  const [approvedAmountInput, setApprovedAmountInput] = useState("");
  const [approving, setApproving] = useState(false);

  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReasonInput, setRejectReasonInput] = useState("");
  const [rejecting, setRejecting] = useState(false);

  // eye icon: full picture of one budget
  const [overviewTarget, setOverviewTarget] = useState(null);
  const [usage, setUsage] = useState(null);
  const [usageLoading, setUsageLoading] = useState(false);

  // adjust the approved amount of an approved budget
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchBudgets = async () => {
      setLoading(true);
      try {
        const params = { search };
        if (filter !== "all") params.status = filter;
        const res = await getBudgets(params);
        if (cancelled) return;
        setBudgets(res?.data || []);
      } catch (error) {
        if (cancelled) return;
        if (!handleAuthError(error)) {
          toast.error(
            error?.response?.data?.message ||
              error?.message ||
              "Couldn't load budgets.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchBudgets();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filter, refreshFlag]);

  const loadUsage = (id) => {
    setUsageLoading(true);
    getBudgetUsage(id)
      .then((res) => setUsage(res?.data || null))
      .catch((error) => {
        if (!handleAuthError(error)) {
          toast.error(error?.response?.data?.message || error?.message || "Couldn't load budget details.");
        }
      })
      .finally(() => setUsageLoading(false));
  };

  const openOverview = (row) => {
    setOverviewTarget(row);
    setUsage(null);
    loadUsage(row._id);
  };

  const openAdjust = (row) => {
    setAdjustTarget(row);
    setAdjustAmount(String(row.approvedAmount || ""));
    setAdjustReason("");
  };

  const confirmAdjust = async () => {
    if (!adjustTarget) return;
    const amount = Number(adjustAmount);
    const used = adjustTarget.consumedAmount || 0;
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid approved amount");
      return;
    }
    if (amount === adjustTarget.approvedAmount) {
      toast.error("Approved amount is unchanged");
      return;
    }
    if (amount < used) {
      toast.error(`Approved amount cannot be lower than what is already used (${money(used)})`);
      return;
    }
    if (!adjustReason.trim()) {
      toast.error("Please give a reason");
      return;
    }
    setAdjusting(true);
    try {
      await adjustBudgetAmount(adjustTarget._id, { approvedAmount: amount, reason: adjustReason.trim() });
      toast.success("Approved amount updated");
      const id = adjustTarget._id;
      setAdjustTarget(null);
      setRefreshFlag((f) => f + 1);
      if (overviewTarget && overviewTarget._id === id) loadUsage(id);
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(error?.response?.data?.message || error?.message || "Couldn't update the amount.");
      }
    } finally {
      setAdjusting(false);
    }
  };

  const totalBudgeted = budgets.reduce(
    (sum, b) => sum + (b.requestedAmount || 0),
    0,
  );
  const approvedBudgets = budgets.filter((b) => b.status === "approved");
  const totalApproved = approvedBudgets.reduce((sum, b) => sum + (b.approvedAmount || 0), 0);
  const totalUsed = approvedBudgets.reduce((sum, b) => sum + (b.consumedAmount || 0), 0);

  const handleSubmitForReview = async (id) => {
    try {
      await submitBudget(id);
      toast.success("Budget submitted for review");
      setRefreshFlag((f) => f + 1);
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Couldn't submit budget.",
        );
      }
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteBudget(deleteTarget._id);
      toast.success("Budget deleted successfully");
      setDeleteTarget(null);
      setRefreshFlag((f) => f + 1);
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Couldn't delete budget.",
        );
      }
    } finally {
      setDeleting(false);
    }
  };

  const openApprove = (row) => {
    setApproveTarget(row);
    setApprovedAmountInput(String(row.requestedAmount || ""));
  };

  const confirmApprove = async () => {
    if (!approveTarget) return;
    setApproving(true);
    try {
      await approveBudget(approveTarget._id, Number(approvedAmountInput) || 0);
      toast.success("Budget approved successfully");
      setApproveTarget(null);
      setRefreshFlag((f) => f + 1);
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Couldn't approve budget.",
        );
      }
    } finally {
      setApproving(false);
    }
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReasonInput.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    setRejecting(true);
    try {
      await rejectBudget(rejectTarget._id, rejectReasonInput.trim());
      toast.success("Budget rejected");
      setRejectTarget(null);
      setRejectReasonInput("");
      setRefreshFlag((f) => f + 1);
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Couldn't reject budget.",
        );
      }
    } finally {
      setRejecting(false);
    }
  };

  const columns = [
    {
      name: "Fiscal Year",
      selector: (row) => row.fiscalYear,
      sortable: true,
      width: "115px",
    },
    {
      name: "Scope",
      minWidth: "150px",
      cell: (row) => (
        <span className="uom-cell-muted">
          {row.budgetType === "global" ? (
            "Global"
          ) : (
            <>
              <span className="fw-semibold">{row.centerId?.title || "All centers"}</span>
              <br />
              {row.departmentId?.name || "—"}
            </>
          )}
        </span>
      ),
    },
    {
      name: "Budget Head",
      hide: "lg",
      cell: (row) => (
        <span className="uom-cell-muted">
          {row.departmentBudgetHeadId?.name || "—"}
        </span>
      ),
    },
    {
      name: "Requested",
      width: "120px",
      cell: (row) => (
        <span className="uom-cell-primary">{money(row.requestedAmount)}</span>
      ),
    },
    {
      name: "Approved",
      width: "125px",
      cell: (row) =>
        row.status === "approved" ? (
          <span className="uom-status-pill status-active">
            {money(row.approvedAmount)}
          </span>
        ) : (
          <span className="uom-cell-muted">—</span>
        ),
    },
    {
      name: "Used",
      width: "110px",
      cell: (row) =>
        row.status === "approved" ? (
          <span className="uom-cell-primary">{money(row.consumedAmount)}</span>
        ) : (
          <span className="uom-cell-muted">—</span>
        ),
    },
    {
      name: "Available",
      width: "120px",
      cell: (row) => {
        const available = availableOf(row);
        if (available === null) return <span className="uom-cell-muted">—</span>;
        const percent = row.approvedAmount > 0 ? Math.round(((row.consumedAmount || 0) / row.approvedAmount) * 100) : 0;
        return (
          <span className="fw-semibold" style={{ color: usageColor(percent) }}>
            {money(available)}
          </span>
        );
      },
    },
    {
      name: "Status",
      width: "115px",
      cell: (row) => <StatusPill status={row.status} />,
    },
    {
      name: "Actions",
      width: "230px",
      cell: (row) => (
        <div className="d-flex gap-2 flex-wrap justify-content-start">
          <Button size="sm" color="light" title="View details" onClick={() => openOverview(row)}>
            <i className="bx bx-show"></i>
          </Button>
          {row.status === "draft" && canEdit && (
            <Button size="sm" color="light" title="Edit" onClick={() => onEdit(row)}>
              <i className="bx bx-edit-alt"></i>
            </Button>
          )}
          {row.status === "approved" && canEdit && (
            <Button size="sm" color="light" title="Adjust approved amount" onClick={() => openAdjust(row)}>
              <i className="bx bx-edit-alt"></i>
            </Button>
          )}
          {row.status === "draft" && canEdit && (
            <Button
              size="sm"
              color="primary"
              onClick={() => handleSubmitForReview(row._id)}
            >
              Submit
            </Button>
          )}
          {row.status === "submitted" && canApprove && (
            <>
              <Button
                size="sm"
                color="success"
                onClick={() => openApprove(row)}
              >
                Approve
              </Button>
              <Button
                size="sm"
                color="danger"
                outline
                onClick={() => setRejectTarget(row)}
              >
                Reject
              </Button>
            </>
          )}
          {canDelete && (
            <Button
              size="sm"
              color="light"
              onClick={() => setDeleteTarget(row)}
            >
              <i className="bx bx-trash text-danger"></i>
            </Button>
          )}
        </div>
      ),
    },
  ];

  const ub = usage?.budget;

  return (
    <div>
      <div className="d-flex gap-3 flex-wrap mb-3">
        <div className="uom-table-card p-3" style={{ flex: 1, minWidth: 200 }}>
          <div className="text-muted small">Total Budgeted</div>
          <div className="fs-4 fw-bold">{money(totalBudgeted)}</div>
          <div className="text-muted small">
            Requested across listed budgets
          </div>
        </div>
        <div className="uom-table-card p-3" style={{ flex: 1, minWidth: 200 }}>
          <div className="text-muted small">Total Approved</div>
          <div className="fs-4 fw-bold">{money(totalApproved)}</div>
          <div className="text-muted small">Sanctioned to date</div>
        </div>
        <div className="uom-table-card p-3" style={{ flex: 1, minWidth: 200 }}>
          <div className="text-muted small">Total Used</div>
          <div className="fs-4 fw-bold">{money(totalUsed)}</div>
          <div className="text-muted small">
            {money(totalApproved - totalUsed)} still available
          </div>
        </div>
      </div>

      <div className="im-filter-pills-row mb-3">
        {[
          { key: "all", label: "All" },
          { key: "draft", label: "Draft" },
          { key: "submitted", label: "Submitted" },
          { key: "approved", label: "Approved" },
          { key: "rejected", label: "Rejected" },
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            className={`im-filter-pill ${filter === f.key ? "active" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="uom-search-wrap mb-0">
          <i className="bx bx-search"></i>
          <Input
            placeholder="Search by fiscal year, center..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {canCreate && (
          <Button color="primary" onClick={onAdd}>
            <i className="bx bx-plus me-1"></i> Create Budget
          </Button>
        )}
      </div>

      <div className="uom-table-card">
        <DataTable
          columns={columns}
          data={budgets}
          customStyles={tableCustomStyles}
          progressPending={loading}
          pagination
          highlightOnHover
          noDataComponent={
            <div className="uom-empty-state">
              <p className="uom-empty-title">No budgets found</p>
              <p className="uom-empty-sub">
                Try adjusting your search, or create your first budget.
              </p>
            </div>
          }
        />
      </div>

      {/* Overview: everything about one budget */}
      <Modal isOpen={!!overviewTarget} toggle={() => setOverviewTarget(null)} centered size="lg">
        <ModalBody className="p-4">
          {usageLoading || !ub ? (
            <div className="text-muted py-4 text-center">Loading budget details...</div>
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h5 className="mb-1">
                    {ub.fiscalYear} ·{" "}
                    {ub.budgetType === "global"
                      ? "Global"
                      : `${ub.centerName ? `${ub.centerName} · ` : ""}${ub.departmentName || "Department"}`}
                  </h5>
                  <div className="text-muted small">
                    Budget head: {ub.budgetHead || "—"} · Created {dateFmt(ub.createdAt)}
                  </div>
                </div>
                <StatusPill status={ub.status} />
              </div>

              <div className="d-flex gap-3 flex-wrap mb-3">
                <AmountCard label="Requested" value={money(ub.requestedAmount)} />
                <AmountCard
                  label="Approved"
                  value={ub.status === "approved" ? money(ub.approvedAmount) : "—"}
                  sub={
                    ub.status === "approved" ? (
                      <>
                        by {ub.approvedBy || "—"}, {dateFmt(ub.approvedAt)}
                        {ub.approvedAmount !== ub.requestedAmount && (
                          <div
                            style={{
                              color: ub.approvedAmount > ub.requestedAmount ? "#067647" : "#b54708",
                              fontWeight: 600,
                            }}
                          >
                            {ub.approvedAmount > ub.requestedAmount ? "+" : "-"}
                            {money(Math.abs(ub.approvedAmount - ub.requestedAmount))}{" "}
                            {ub.approvedAmount > ub.requestedAmount ? "above" : "below"} request
                          </div>
                        )}
                      </>
                    ) : undefined
                  }
                />
                <AmountCard label="Used" value={ub.status === "approved" ? money(ub.consumedAmount) : "—"} />
                <AmountCard
                  label="Available"
                  value={ub.status === "approved" ? money(ub.availableAmount) : "—"}
                  color={ub.status === "approved" ? usageColor(usage.summary.usedPercent) : undefined}
                />
              </div>

              {ub.status === "approved" && (
                <div className="mb-4">
                  <div className="d-flex justify-content-between small mb-1">
                    <span className="text-muted">Budget used</span>
                    <span className="fw-semibold">{usage.summary.usedPercent}%</span>
                  </div>
                  <div style={{ height: 8, background: "#eef0f4", borderRadius: 999, overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${Math.min(usage.summary.usedPercent, 100)}%`,
                        height: "100%",
                        background: usageColor(usage.summary.usedPercent),
                      }}
                    />
                  </div>
                </div>
              )}

              {usage.amountHistory?.length > 0 && (
                <div className="mb-4">
                  <div className="fw-semibold mb-2">Approved amount history</div>
                  {usage.amountHistory.map((h, i) => (
                    <div key={i} className="small mb-1">
                      <span className="text-muted">
                        {dateFmt(h.at)} · {h.by || "—"}:
                      </span>{" "}
                      {h.type === "approved"
                        ? `Approved ${money(h.to)}`
                        : `${h.to > h.from ? "Increased" : "Reduced"} ${money(h.from)} to ${money(h.to)}`}
                      {h.reason && <span className="text-muted"> · {h.reason}</span>}
                    </div>
                  ))}
                </div>
              )}

              {ub.status === "rejected" && ub.rejectionReason && (
                <div className="mb-3 p-2 small" style={{ background: "#fef3f2", borderRadius: 6, color: "#b42318" }}>
                  Rejected: {ub.rejectionReason}
                </div>
              )}
              {ub.remarks && <div className="text-muted small mb-3">Remarks: {ub.remarks}</div>}

              <div className="fw-semibold mb-2">Purchase orders using this budget</div>
              {usage.pos.length === 0 ? (
                <div className="text-muted small mb-3">No purchase order has been raised against this budget yet.</div>
              ) : (
                <div className="uom-table-card mb-2" style={{ overflowX: "auto" }}>
                  <table className="table table-sm mb-0">
                    <thead>
                      <tr>
                        <th>PO</th>
                        <th>Vendor</th>
                        <th>Status</th>
                        <th className="text-end">PO amount</th>
                        <th className="text-end">Released</th>
                        <th className="text-end">Used</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usage.pos.map((po) => {
                        const st = PO_STATUS[po.status] || PO_STATUS.draft;
                        return (
                          <tr key={po._id}>
                            <td className="fw-semibold">{po.poNumber}</td>
                            <td>{po.vendorName}</td>
                            <td style={{ color: st.color, fontWeight: 600 }}>{st.label}</td>
                            <td className="text-end">{money(po.netPayable)}</td>
                            <td className="text-end text-muted">{po.releasedAmount > 0 ? money(po.releasedAmount) : "—"}</td>
                            <td className="text-end fw-semibold">{money(po.netUsed)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {usage.pos.length > 0 && (
                <div
                  className="small mb-4"
                  style={{ color: usage.summary.reconciled ? "#067647" : "#b42318" }}
                >
                  {usage.summary.reconciled
                    ? `Purchase orders add up to ${money(usage.summary.usedFromPOs)}, which matches the budget's used amount.`
                    : `Purchase orders add up to ${money(usage.summary.usedFromPOs)}, but the budget shows ${money(ub.consumedAmount)} used. These should match, please check.`}
                  {usage.pos.some((p) => p.status === "draft") && (
                    <span className="text-muted"> Draft POs hold no money until they are approved.</span>
                  )}
                </div>
              )}

              {usage.prsWaiting.length > 0 && (
                <>
                  <div className="fw-semibold mb-1">Approved PRs still waiting for a PO</div>
                  <div className="text-muted small mb-2">
                    This money is not reserved yet. It is only taken from the budget when the PO is approved.
                  </div>
                  <div className="uom-table-card mb-2" style={{ overflowX: "auto" }}>
                    <table className="table table-sm mb-0">
                      <thead>
                        <tr>
                          <th>PR</th>
                          <th>Title</th>
                          <th className="text-end">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usage.prsWaiting.map((pr) => (
                          <tr key={pr._id}>
                            <td className="fw-semibold">{pr.prNumber}</td>
                            <td>{pr.prTitle}</td>
                            <td className="text-end">{money(pr.netPayable)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="small text-muted mb-3">
                    Could still be needed: {money(usage.summary.prsWaitingAmount)}
                  </div>
                </>
              )}

              <div className="d-flex justify-content-end gap-2 mt-3">
                {ub.status === "approved" && canEdit && (
                  <Button
                    color="light"
                    onClick={() => openAdjust({ _id: ub._id, approvedAmount: ub.approvedAmount, consumedAmount: ub.consumedAmount })}
                  >
                    <i className="bx bx-edit-alt me-1"></i> Adjust approved amount
                  </Button>
                )}
                <Button color="primary" onClick={() => setOverviewTarget(null)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </ModalBody>
      </Modal>

      {/* Adjust approved amount */}
      <Modal isOpen={!!adjustTarget} toggle={() => setAdjustTarget(null)} centered>
        <ModalBody className="p-4">
          <h5 className="mb-1">Adjust approved amount</h5>
          <p className="text-muted small mb-3">
            Currently approved {money(adjustTarget?.approvedAmount)}, already used {money(adjustTarget?.consumedAmount)}.
            The new amount cannot be lower than what is used.
          </p>
          <Label>
            New approved amount <span className="text-danger">*</span>
          </Label>
          <Input
            type="number"
            min={0}
            value={adjustAmount}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setAdjustAmount(e.target.value)}
          />
          {Number(adjustAmount) > 0 && adjustTarget && (
            <div className="small text-muted mt-1">
              Available after this change: {money(Number(adjustAmount) - (adjustTarget.consumedAmount || 0))}
            </div>
          )}
          <Label className="mt-3">
            Reason <span className="text-danger">*</span>
          </Label>
          <Input
            type="textarea"
            rows={2}
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
            placeholder="e.g. Extra funds sanctioned for new ward equipment"
          />
          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button color="light" onClick={() => setAdjustTarget(null)} disabled={adjusting}>
              Cancel
            </Button>
            <Button color="primary" onClick={confirmAdjust} disabled={adjusting}>
              {adjusting ? "Saving..." : "Save amount"}
            </Button>
          </div>
        </ModalBody>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        isOpen={!!deleteTarget}
        toggle={() => setDeleteTarget(null)}
        centered
      >
        <ModalBody className="p-4">
          <h5 className="mb-2">Delete this budget?</h5>
          <p className="text-muted mb-4">
            {deleteTarget && <strong>{deleteTarget.fiscalYear}</strong>} will be
            permanently deleted.
            {deleteTarget?.status === "approved" && (
              <span className="d-block text-danger mt-2">
                ⚠️ This budget is already approved and may be linked to active
                PRs/POs. Deleting it can affect procurement records.
              </span>
            )}
          </p>
          <div className="d-flex justify-content-end gap-2">
            <Button
              color="light"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button color="danger" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </ModalBody>
      </Modal>

      {/* Approve modal */}
      <Modal
        isOpen={!!approveTarget}
        toggle={() => setApproveTarget(null)}
        centered
      >
        <ModalBody className="p-4">
          <h5 className="mb-3">Approve Budget</h5>
          <p className="text-muted mb-2">
            Requested: <strong>{money(approveTarget?.requestedAmount)}</strong>
          </p>
          <Label>Approved Amount</Label>
          <Input
            type="number"
            min={0}
            value={approvedAmountInput}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setApprovedAmountInput(e.target.value)}
          />
          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button
              color="light"
              onClick={() => setApproveTarget(null)}
              disabled={approving}
            >
              Cancel
            </Button>
            <Button
              color="success"
              onClick={confirmApprove}
              disabled={approving}
            >
              {approving ? "Approving..." : "Approve"}
            </Button>
          </div>
        </ModalBody>
      </Modal>

      {/* Reject modal */}
      <Modal
        isOpen={!!rejectTarget}
        toggle={() => setRejectTarget(null)}
        centered
      >
        <ModalBody className="p-4">
          <h5 className="mb-3">Reject Budget</h5>
          <Label>Reason for rejection</Label>
          <Input
            type="textarea"
            rows={3}
            value={rejectReasonInput}
            onChange={(e) => setRejectReasonInput(e.target.value)}
            placeholder="Explain why this budget is being rejected"
          />
          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button
              color="light"
              onClick={() => setRejectTarget(null)}
              disabled={rejecting}
            >
              Cancel
            </Button>
            <Button color="danger" onClick={confirmReject} disabled={rejecting}>
              {rejecting ? "Rejecting..." : "Reject"}
            </Button>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
};

export default BudgetList;