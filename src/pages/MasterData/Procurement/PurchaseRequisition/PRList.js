import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { Button, Input, Modal, ModalBody, Label } from "reactstrap";
import { toast } from "react-toastify";
import {
  getPRs,
  deletePR,
  submitPR,
  approvePR,
  rejectPR,
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
  pagination: {
    style: { borderTopColor: "#edeff3", fontSize: "13px", color: "#667085" },
  },
};

const StatusPill = ({ status }) => {
  const cls =
    status === "approved"
      ? "status-active"
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

const PRList = ({ onAdd, onEdit, onOpen }) => {
  const handleAuthError = useAuthError();
  const token = JSON.parse(localStorage.getItem("micrologin"))?.token;
  const { hasPermission } = usePermissions(token);
  const canCreate = hasPermission("MASTERDATA", "PR", "WRITE");
  const canEdit = hasPermission("MASTERDATA", "PR", "WRITE");
  const canApprove = hasPermission("MASTERDATA", "PR", "WRITE");
  const canDelete = hasPermission("MASTERDATA", "PR", "DELETE");

  const [prs, setPrs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [refreshFlag, setRefreshFlag] = useState(0);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReasonInput, setRejectReasonInput] = useState("");
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchPRs = async () => {
      setLoading(true);
      try {
        const params = { search };
        if (filter !== "all") params.status = filter;
        const res = await getPRs(params);
        if (cancelled) return;
        setPrs(res?.data || []);
      } catch (error) {
        if (cancelled) return;
        if (!handleAuthError(error)) {
          toast.error(
            error?.response?.data?.message ||
              error?.message ||
              "Couldn't load PRs.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchPRs();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filter, refreshFlag]);

  const handleSubmitForApproval = async (id) => {
    try {
      await submitPR(id);
      toast.success("PR submitted for approval");
      setRefreshFlag((f) => f + 1);
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Couldn't submit PR.",
        );
      }
    }
  };

  const handleApprove = async (id) => {
    try {
      await approvePR(id);
      toast.success("PR approved successfully");
      setRefreshFlag((f) => f + 1);
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Couldn't approve PR.",
        );
      }
    }
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReasonInput.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    setRejecting(true);
    try {
      await rejectPR(rejectTarget._id, rejectReasonInput.trim());
      toast.success("PR sent back for correction");
      setRejectTarget(null);
      setRejectReasonInput("");
      setRefreshFlag((f) => f + 1);
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Couldn't reject PR.",
        );
      }
    } finally {
      setRejecting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePR(deleteTarget._id);
      toast.success("PR deleted successfully");
      setDeleteTarget(null);
      setRefreshFlag((f) => f + 1);
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Couldn't delete PR.",
        );
      }
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      name: "PR Number",
      selector: (row) => row.prNumber,
      sortable: true,
      width: "150px",
    },
    {
      name: "Title",
      cell: (row) => <span className="uom-cell-primary">{row.prTitle}</span>,
    },
        {
      name: "Department",
      cell: (row) => (
        <span className="uom-cell-muted">{row.departmentId?.name || "—"}</span>
      ),
    },
    {
      name: "Delivery Site",
      cell: (row) => (
        <span className="uom-cell-muted">{row.deliverySiteId?.title || "—"}</span>
      ),
    },
    {
      name: "Net Payable",
      cell: (row) => (
        <span className="uom-cell-primary">{money(row.netPayable)}</span>
      ),
    },
    {
      name: "Requested By",
      cell: (row) => (
        <span className="uom-cell-muted">{row.requestedBy?.name || "—"}</span>
      ),
    },
    {
      name: "Status",
      width: "130px",
      cell: (row) => <StatusPill status={row.status} />,
    },
    {
      name: "Actions",
      width: "260px",
      right: true,
      cell: (row) => (
        <div className="d-flex gap-2 flex-wrap justify-content-end">
          <Button size="sm" color="light" title="View" onClick={() => onOpen(row)}>
            <i className="bx bx-show"></i>
          </Button>
          {row.status === "draft" && canEdit && (
            <Button size="sm" color="light" onClick={() => onEdit(row)}>
              <i className="bx bx-edit-alt"></i>
            </Button>
          )}
          {row.status === "draft" && canEdit && (
            <Button
              size="sm"
              color="primary"
              onClick={() => handleSubmitForApproval(row._id)}
            >
              Submit
            </Button>
          )}
          {row.status === "submitted" && canApprove && (
            <>
              <Button
                size="sm"
                color="success"
                onClick={() => handleApprove(row._id)}
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
          {row.status === "draft" && canDelete && (
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

  return (
    <div className="uom-page">
      <div className="uom-list-header">
        <div>
          <h4>Purchase Requisitions</h4>
          <p>Raise and track internal purchase requests</p>
        </div>
      </div>

      <div className="im-filter-pills-row mb-3">
        {[
          { key: "all", label: "All" },
          { key: "draft", label: "Draft" },
          { key: "submitted", label: "Submitted" },
          { key: "approved", label: "Approved" },
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
            placeholder="Search PR number or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {canCreate && (
          <Button color="primary" onClick={onAdd}>
            <i className="bx bx-plus me-1"></i> Create PR
          </Button>
        )}
      </div>

      <div className="uom-table-card">
        <DataTable
          columns={columns}
          data={prs}
          customStyles={tableCustomStyles}
          progressPending={loading}
          pagination
          highlightOnHover
          noDataComponent={
            <div className="uom-empty-state">
              <p className="uom-empty-title">No purchase requisitions found</p>
              <p className="uom-empty-sub">
                Try adjusting your search, or create your first PR.
              </p>
            </div>
          }
        />
      </div>

      <Modal
        isOpen={!!deleteTarget}
        toggle={() => setDeleteTarget(null)}
        centered
      >
        <ModalBody className="p-4">
          <h5 className="mb-2">Delete this PR?</h5>
          <p className="text-muted mb-4">
            {deleteTarget && <strong>{deleteTarget.prNumber}</strong>} will be
            permanently deleted.
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

      <Modal
        isOpen={!!rejectTarget}
        toggle={() => setRejectTarget(null)}
        centered
      >
        <ModalBody className="p-4">
          <h5 className="mb-3">Send back for correction</h5>
          <Label>Reason</Label>
          <Input
            type="textarea"
            rows={3}
            value={rejectReasonInput}
            onChange={(e) => setRejectReasonInput(e.target.value)}
            placeholder="Explain what needs to be corrected"
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
              {rejecting ? "Sending..." : "Send Back"}
            </Button>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
};

export default PRList;
