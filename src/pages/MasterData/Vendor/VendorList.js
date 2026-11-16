import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { Button, Input, Modal, ModalBody } from "reactstrap";
import { toast } from "react-toastify";
import {
  getVendors,
  updateVendorStatus,
  deleteVendor,
  updateVendorApprovalStatus,
} from "../../../helpers/backend_helper";
import { useAuthError } from "../../../Components/Hooks/useAuthError";
import { useDispatch } from "react-redux";
import { invalidateReferenceList } from "../../../store/features/reference/referenceSlice";
import { usePermissions } from "../../../Components/Hooks/useRoles.js";
import "./vendor.scss";

const tableCustomStyles = {
  table: { style: { backgroundColor: "transparent" } },
  headRow: {
    style: {
      backgroundColor: "#ffffff",
      borderBottom: "1px solid #eceff3",
      minHeight: "44px",
    },
  },
  headCells: {
    style: {
      fontSize: "12.5px",
      fontWeight: 600,
      color: "#6b7280",
      whiteSpace: "nowrap",
    },
  },
  rows: {
    style: {
      minHeight: "66px",
      fontSize: "14px",
      "&:not(:last-of-type)": { borderBottomColor: "#f1f3f6" },
    },
    highlightOnHoverStyle: {
      backgroundColor: "#fafbfc",
      borderBottomColor: "#f1f3f6",
      outline: "none",
    },
  },
  pagination: {
    style: {
      borderTop: "1px solid #eceff3",
      fontSize: "13px",
      color: "#6b7280",
      flexWrap: "wrap",
    },
  },
};

const VendorList = ({ onAdd, onEdit }) => {
  const handleAuthError = useAuthError();
  const dispatch = useDispatch();
  const token = JSON.parse(localStorage.getItem("micrologin"))?.token;
  const { hasPermission } = usePermissions(token);
  const canCreate = hasPermission("MASTERDATA", "VENDOR", "WRITE");
  const canEdit = hasPermission("MASTERDATA", "VENDOR", "WRITE");
  const canChangeStatus = hasPermission("MASTERDATA", "VENDOR", "WRITE");
  // Deleting a vendor needs the Delete level, not just Write
  const canDelete = hasPermission("MASTERDATA", "VENDOR", "DELETE");
  // Approving is its own permission (Vendor Approval), so the person who makes a vendor need not be
  // the one who approves it. Submitting for approval stays with Vendor WRITE.
  const canApprove = hasPermission("MASTERDATA", "VENDOR_APPROVAL", "WRITE");

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [totalRows, setTotalRows] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [overviewVendor, setOverviewVendor] = useState(null);
  const [showAccountNo, setShowAccountNo] = useState(false);

  // Typing rukne ke 400ms baad hi search hoga
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);


  useEffect(() => {
    let cancelled = false;
    const fetchVendors = async () => {
      setLoading(true);
      try {
        const res = await getVendors({
          page,
          limit: perPage,
          search: debouncedSearch,
          ...(categoryFilter ? { vendorCategory: categoryFilter } : {}),
          ...(statusFilter ? { approvalStatus: statusFilter } : {}),
        });
        if (cancelled) return;
        setVendors(res?.data || []);
        setTotalRows(res?.pagination?.total || 0);
      } catch (error) {
        if (cancelled) return;
        if (!handleAuthError(error)) {
          toast.error(
            error?.response?.data?.message ||
              error?.message ||
              "Couldn't load vendors. Please try again.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchVendors();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, debouncedSearch, categoryFilter, statusFilter, refreshFlag]);


  // Draft/Incomplete/Rejected → Submit, Pending → Approve (aur activate bhi)
  const handleQuickAction = async (row) => {
    if (row.approvalStatus === "pending" ? !canApprove : !canChangeStatus) return;
    try {
      if (
        row.approvalStatus === "incomplete" ||
        row.approvalStatus === "rejected"
      ) {
        await updateVendorApprovalStatus(row._id, "pending");
        toast.success("Vendor submitted for approval");
      } else if (row.approvalStatus === "pending") {
        await updateVendorApprovalStatus(row._id, "approved");
        await updateVendorStatus(row._id, "active");
        toast.success("Vendor approved and activated");
      }
      dispatch(invalidateReferenceList("vendors"));
      setRefreshFlag((f) => f + 1);
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Couldn't update vendor",
        );
      }
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !canDelete) return;
    setDeleting(true);
    try {
      await deleteVendor(deleteTarget._id);
      dispatch(invalidateReferenceList("vendors"));
      toast.success("Vendor deleted successfully");
      setDeleteTarget(null);
      setRefreshFlag((f) => f + 1);
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Couldn't delete vendor. Please try again.",
        );
      }
    } finally {
      setDeleting(false);
    }
  };

  const primaryGstin = (row) =>
    row?.gstRegistrations?.find((g) => g.isPrimary)?.gstin ||
    row?.gstRegistrations?.[0]?.gstin ||
    "";

  const getStatusPill = (row) => {
    if (row.approvalStatus === "approved") {
      return <span className="vendor-status-text is-active">Active</span>;
    }
    if (row.approvalStatus === "pending") {
      return <span className="vendor-status-text is-pending">Pending</span>;
    }
    return <span className="vendor-status-text is-draft">Draft</span>;
  };

  // Page pe koi Draft/Pending vendor hai tabhi Submit/Approve button aayega
  const hasQuickAction = vendors.some((v) =>
    v.approvalStatus === "pending"
      ? canApprove
      : v.approvalStatus !== "approved" && canChangeStatus,
  );
  const actionsWidth = hasQuickAction ? "230px" : "150px";

  const columns = [
    {
      name: "Vendor",
      selector: (row) => row.legalName || row.tradeName,
      sortable: true,
      grow: 2,
      minWidth: "230px",
      cell: (row) => (
        <div className="vendor-stack-cell">
          <span
            className="vendor-cell-name"
            title={row.legalName || row.tradeName || ""}
          >
            {row.legalName || row.tradeName || "—"}
          </span>
          <span className="vendor-cell-code vendor-stack-sub">
            {row.vendorCode || "—"}
          </span>
        </div>
      ),
    },
    {
      name: "Type",
      selector: (row) => row.vendorCategory,
      sortable: true,
      width: "170px",
      cell: (row) =>
        row.vendorCategory === "central_payment" ? (
          <span className="vendor-cell-text">Central Payment</span>
        ) : (
          <div className="vendor-stack-cell">
            <span className="vendor-cell-text">PO Required</span>
            {row.vendorType && (
              <span className="vendor-cell-muted vendor-stack-sub text-capitalize">
                {row.vendorType.replace(/_/g, " ")}
              </span>
            )}
          </div>
        ),
    },
    {
      name: "Raised By",
      minWidth: "200px",
      hide: 1200,
      cell: (row) =>
        row.requestedBy || row.postedFrom === "CENTRAL_PAYMENT" ? (
          <div className="vendor-stack-cell">
            <span className="vendor-cell-text vendor-ellipsis" title={row.requestedBy?.name || ""}>
              {row.requestedBy?.name || "Unknown user"}
            </span>
            <span className="vendor-cell-muted vendor-stack-sub vendor-ellipsis" title={row.requestedFromCenter?.title || ""}>
              {row.requestedFromCenter?.title || "Center not recorded"}
            </span>
          </div>
        ) : (
          <span className="vendor-cell-muted">—</span>
        ),
    },
    {
      name: "PAN",
      selector: (row) => row.pan,
      sortable: true,
      width: "140px",
      hide: 1100,
      cell: (row) => <span className="vendor-cell-code">{row.pan || "—"}</span>,
    },
    {
      name: "GSTIN",
      width: "180px",
      hide: 1450,
      cell: (row) => (
        <span className="vendor-cell-code">{primaryGstin(row) || "—"}</span>
      ),
    },
    {
      name: "Status",
      width: "120px",
      cell: (row) => getStatusPill(row),
    },
    {
      name: "Actions",
      minWidth: actionsWidth,
      maxWidth: actionsWidth,
      right: true,
      cell: (row) => (
        <div className="vendor-row-actions align-items-center">
          {row.approvalStatus !== "approved" &&
            (row.approvalStatus === "pending" ? canApprove : canChangeStatus) && (
              <Button
                size="sm"
                outline
                color={row.approvalStatus === "pending" ? "success" : "primary"}
                onClick={() => handleQuickAction(row)}
              >
                {row.approvalStatus === "pending" ? "Approve" : "Submit"}
              </Button>
            )}
          <button
            type="button"
            className="vendor-icon-btn"
            title="Overview"
            onClick={() => {
              setShowAccountNo(false);
              setOverviewVendor(row);
            }}
          >
            <i className="bx bx-show"></i>
          </button>
          {canEdit && (
            <button
              type="button"
              className="vendor-icon-btn"
              title="Edit"
              onClick={() => onEdit(row._id)}
            >
              <i className="bx bx-edit-alt"></i>
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              className="vendor-icon-btn is-danger"
              title="Delete"
              onClick={() => setDeleteTarget(row)}
            >
              <i className="bx bx-trash"></i>
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="vendor-page">
      {/* Title + subtitle */}
      <div className="vendor-list-header">
        <div>
          <h4>Vendors</h4>
          <p>
            Manage onboarding, legal records, and status for every supplier.
          </p>
        </div>
      </div>

      {/* Search + Add button same row mein */}
      <div className="vendor-toolbar">
        <div className="vendor-search-wrap">
          <i className="bx bx-search"></i>
          <Input
            placeholder="Search by name, code, PAN, GSTIN"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="vendor-filter-group">
          <Input
            type="select"
            aria-label="Filter by vendor type"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All vendor types</option>
            <option value="po_required">PO Required Vendor</option>
            <option value="central_payment">Central Payment Vendor</option>
          </Input>
          <Input
            type="select"
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="approved">Active</option>
            <option value="pending">Pending</option>
            <option value="draft">Draft</option>
          </Input>
          {(categoryFilter || statusFilter) && (
            <Button
              color="light"
              onClick={() => {
                setCategoryFilter("");
                setStatusFilter("");
                setPage(1);
              }}
            >
              Clear
            </Button>
          )}
        </div>
        {canCreate && (
          <Button color="primary" onClick={onAdd}>
            <i className="bx bx-plus me-1"></i> Add Vendor
          </Button>
        )}
      </div>

      <div className="vendor-result-count">
        {loading ? "Loading…" : `${totalRows} vendor${totalRows === 1 ? "" : "s"}`}
        {(categoryFilter || statusFilter || debouncedSearch) && " found"}
      </div>

      <div className="vendor-table-card">
        <DataTable
          columns={columns}
          data={vendors}
          customStyles={tableCustomStyles}
          progressPending={loading}
          progressComponent={
            <div className="w-100 p-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="vendor-skeleton mb-2"
                  style={{ height: 44 }}
                />
              ))}
            </div>
          }
          pagination
          paginationServer
          paginationTotalRows={totalRows}
          paginationRowsPerPageOptions={[10, 25, 50]}
          onChangePage={(p) => setPage(p)}
          onChangeRowsPerPage={(newPerPage) => {
            setPerPage(newPerPage);
            setPage(1);
          }}
          highlightOnHover
          responsive
          noDataComponent={
            search || categoryFilter || statusFilter ? (
              <div className="vendor-empty-state">
                <i className="bx bx-search-alt"></i>
                <p className="mb-1 fw-semibold text-dark">
                  {search ? `No vendors match "${search}"` : "No vendors match these filters"}
                </p>
                <p className="mb-0 small text-muted">
                  Try a different name, code, PAN or GSTIN, or clear the filters.
                </p>
              </div>
            ) : (
              <div className="vendor-empty-state">
                <i className="bx bx-store"></i>
                <p className="mb-1 fw-semibold text-dark">No vendors yet</p>
                <p className="mb-0 small text-muted">
                  Click "Add Vendor" to onboard your first supplier.
                </p>
              </div>
            )
          }
        />
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteTarget}
        toggle={() => setDeleteTarget(null)}
        centered
      >
        <ModalBody className="p-4">
          <h5 className="mb-2">Delete this vendor?</h5>
          <p className="text-muted mb-4">
            {deleteTarget && (
              <>
                <strong>
                  {deleteTarget.legalName || deleteTarget.tradeName}
                </strong>{" "}
                {deleteTarget.vendorCode && `(${deleteTarget.vendorCode})`}
              </>
            )}{" "}
            will be permanently deleted. This cannot be undone.
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

      {/* Overview modal */}
      <Modal
        isOpen={!!overviewVendor}
        toggle={() => setOverviewVendor(null)}
        centered
        size="xl"
      >
        <ModalBody className="p-0">
          {overviewVendor && (
            <div className="vendor-overview">
              <button
                type="button"
                className="vendor-overview-close"
                onClick={() => setOverviewVendor(null)}
              >
                <i className="bx bx-x"></i>
              </button>

              <div className="vendor-overview-grid">
                {/* ---------- Left: hero card ---------- */}
                <div className="vendor-overview-hero">
                  <div className="vendor-overview-hero-banner">
                    <span className="vendor-overview-code-badge">
                      {overviewVendor.vendorCode || "—"}
                    </span>
                  </div>
                  <div className="vendor-overview-hero-body">
                    <div className="vendor-overview-avatar">
                      {(() => {
                        const name = (
                          overviewVendor.legalName ||
                          overviewVendor.tradeName ||
                          "?"
                        ).trim();
                        const initials = name
                          .split(/\s+/)
                          .filter(Boolean)
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase();
                        return initials || "?";
                      })()}
                    </div>
                    <h5 className="vendor-overview-name">
                      {overviewVendor.legalName || overviewVendor.tradeName}
                    </h5>

                    <div className="d-flex gap-2 flex-wrap justify-content-center mb-3">
                      <span className="vendor-overview-chip">
                        {overviewVendor.vendorCategory === "central_payment"
                          ? "Central Payment"
                          : (overviewVendor.vendorType || "—").replace(/_/g, " ")}
                      </span>
                      <span
                        className={`vendor-status-pill status-${overviewVendor.status}`}
                      >
                        {overviewVendor.status}
                      </span>
                    </div>

                    <div className="vendor-overview-hero-row">
                      <i className="bx bx-hash"></i>
                      <div>
                        <div className="vendor-overview-hero-label">PAN</div>
                        <div className="vendor-overview-hero-value">
                          {overviewVendor.pan || "—"}
                        </div>
                      </div>
                    </div>

                    {overviewVendor.vendorCategory !== "central_payment" && (
                      <>
                        <div className="vendor-overview-hero-row">
                          <i className="bx bx-phone"></i>
                          <span>{overviewVendor.primaryContact?.phone || "—"}</span>
                        </div>
                        <div className="vendor-overview-hero-row">
                          <i className="bx bx-envelope"></i>
                          <span className="text-truncate">
                            {overviewVendor.primaryContact?.email || "—"}
                          </span>
                        </div>
                      </>
                    )}

                    <div className="vendor-overview-hero-dates">
                      <div>
                        <i className="bx bx-calendar-plus"></i> Created{" "}
                        {overviewVendor.createdAt
                          ? new Date(
                              overviewVendor.createdAt,
                            ).toLocaleDateString()
                          : "—"}
                      </div>
                      <div>
                        <i className="bx bx-calendar-edit"></i> Updated{" "}
                        {overviewVendor.updatedAt
                          ? new Date(
                              overviewVendor.updatedAt,
                            ).toLocaleDateString()
                          : "—"}
                      </div>
                    </div>

                    <Button
                      color="light"
                      className="w-100 mt-3"
                      onClick={() => setOverviewVendor(null)}
                    >
                      <i className="bx bx-arrow-back me-1"></i> Close
                    </Button>
                  </div>
                </div>

                {/* ---------- Right: sectioned cards ---------- */}
                {overviewVendor.vendorCategory === "central_payment" ? (
                  <div className="vendor-overview-cards">
                    <div className="vendor-overview-card">
                      <div className="vendor-overview-card-title">
                        <i className="bx bx-wallet"></i> Central Payment Vendor
                      </div>
                      <div className="vendor-overview-card-grid">
                        <div>
                          <div className="vendor-overview-label">Vendor Name</div>
                          <div className="vendor-overview-value">
                            {overviewVendor.tradeName || "—"}
                          </div>
                        </div>
                        <div>
                          <div className="vendor-overview-label">Bank IFSC Code</div>
                          <div className="vendor-overview-value">
                            {overviewVendor.bankDetails?.ifsc || "—"}
                          </div>
                        </div>
                        <div>
                          <div className="vendor-overview-label">Account Holder Name</div>
                          <div className="vendor-overview-value">
                            {overviewVendor.bankDetails?.accountHolderName || "—"}
                          </div>
                        </div>
                        <div>
                          <div className="vendor-overview-label">Account No.</div>
                          <div className="d-flex align-items-center gap-2">
                            <span className="vendor-overview-hero-value">
                              {overviewVendor.bankDetails?.accountNo
                                ? showAccountNo
                                  ? overviewVendor.bankDetails.accountNo
                                  : `••••${overviewVendor.bankDetails.accountNo.slice(-4)}`
                                : "—"}
                            </span>
                            {overviewVendor.bankDetails?.accountNo && (
                              <button
                                type="button"
                                className="vendor-overview-show-btn"
                                onClick={() => setShowAccountNo((v) => !v)}
                              >
                                {showAccountNo ? "Hide" : "Show"}
                              </button>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="vendor-overview-label">PAN Card No.</div>
                          <div className="vendor-overview-value">
                            {overviewVendor.pan || "—"}
                          </div>
                        </div>
                        <div>
                          <div className="vendor-overview-label">PAN Card Upload</div>
                          {(() => {
                            const panDoc = overviewVendor.documents?.find((d) => d.docType === "pan_card");
                            return panDoc ? (
                              <a
                                href={panDoc.url}
                                target="_blank"
                                rel="noreferrer"
                                className="vendor-overview-doc-link"
                              >
                                <i className="bx bx-show"></i> Preview
                              </a>
                            ) : (
                              <span className="vendor-overview-doc-empty">Not uploaded</span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    <div className="vendor-overview-card">
                      <div className="vendor-overview-card-title">
                        <i className="bx bx-user-voice"></i> Request
                      </div>
                      <div className="vendor-overview-card-grid">
                        <div>
                          <div className="vendor-overview-label">Raised By</div>
                          <div className="vendor-overview-value">
                            {overviewVendor.requestedBy?.name || "—"}
                          </div>
                        </div>
                        <div>
                          <div className="vendor-overview-label">Center</div>
                          <div className="vendor-overview-value">
                            {overviewVendor.requestedFromCenter?.title || "—"}
                          </div>
                        </div>
                        <div>
                          <div className="vendor-overview-label">Raised On</div>
                          <div className="vendor-overview-value">
                            {overviewVendor.createdAt
                              ? new Date(overviewVendor.createdAt).toLocaleDateString()
                              : "—"}
                          </div>
                        </div>
                        <div>
                          <div className="vendor-overview-label">Raised From</div>
                          <div className="vendor-overview-value">
                            {overviewVendor.postedFrom === "CENTRAL_PAYMENT"
                              ? "Central Payment"
                              : "Vendor Management"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                <div className="vendor-overview-cards">
                  <div className="vendor-overview-card">
                    <div className="vendor-overview-card-title">
                      <i className="bx bx-user"></i> Identity & Compliance
                    </div>
                    <div className="vendor-overview-card-grid">
                      <div>
                        <div className="vendor-overview-label">Legal Name</div>
                        <div className="vendor-overview-value">
                          {overviewVendor.legalName || "—"}
                        </div>
                      </div>
                      <div>
                        <div className="vendor-overview-label">
                          Alias / Trade Name
                        </div>
                        <div className="vendor-overview-value">
                          {overviewVendor.alias ||
                            overviewVendor.tradeName ||
                            "—"}
                        </div>
                      </div>
                      <div>
                        <div className="vendor-overview-label">Vendor Type</div>
                        <span className="vendor-overview-chip">
                          {(overviewVendor.vendorType || "—").replace(
                            /_/g,
                            " ",
                          )}
                        </span>
                      </div>
                      <div>
                        <div className="vendor-overview-label">
                          MSME Registered
                        </div>
                        <span
                          className={`vendor-overview-flag ${overviewVendor.msmeRegistered ? "is-yes" : "is-no"}`}
                        >
                          {overviewVendor.msmeRegistered ? "Yes" : "No"}
                        </span>
                      </div>
                      <div>
                        <div className="vendor-overview-label">MSME No.</div>
                        <div className="vendor-overview-value">
                          {overviewVendor.udyamNumber || "—"}
                        </div>
                      </div>
                      <div className="vendor-overview-span-2">
                        <div className="vendor-overview-label">
                          Contact Person
                        </div>
                        <div className="vendor-overview-value">
                          {overviewVendor.primaryContact?.name || "—"}
                        </div>
                        <div className="vendor-overview-subline">
                          <i className="bx bx-phone"></i>{" "}
                          {overviewVendor.primaryContact?.phone || "—"}
                        </div>
                        <div className="vendor-overview-subline">
                          <i className="bx bx-envelope"></i>{" "}
                          {overviewVendor.primaryContact?.email || "—"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="vendor-overview-card">
                    <div className="vendor-overview-card-title">
                      <i className="bx bx-file-blank"></i> Tax & Legal
                      Identifiers
                    </div>
                    <div className="vendor-overview-card-grid">
                      <div>
                        <div className="vendor-overview-label">PAN</div>
                        <div className="vendor-overview-value">
                          {overviewVendor.pan || "—"}
                        </div>
                      </div>
                      <div>
                        <div className="vendor-overview-label">GSTIN</div>
                        <div className="vendor-overview-value">
                          {primaryGstin(overviewVendor) || "—"}
                        </div>
                      </div>
                      <div>
                        <div className="vendor-overview-label">CIN</div>
                        <div className="vendor-overview-value">
                          {overviewVendor.cin || "—"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="vendor-overview-card">
                    <div className="vendor-overview-card-title">
                      <i className="bx bx-buildings"></i> GST Information
                    </div>
                    {overviewVendor.gstRegistrations?.length > 0 ? (
                      overviewVendor.gstRegistrations.map((g) => (
                        <div
                          key={g._id}
                          className="vendor-overview-card-grid mb-2"
                        >
                          <div>
                            <div className="vendor-overview-label">
                              Registration Type
                            </div>
                            <div className="vendor-overview-value text-capitalize">
                              {g.registrationType || "—"}
                            </div>
                          </div>
                          <div>
                            <div className="vendor-overview-label">
                              Tax Type
                            </div>
                            <div className="vendor-overview-value text-uppercase">
                              {g.taxType || "—"}
                            </div>
                          </div>
                          <div>
                            <div className="vendor-overview-label">
                              Reverse Charge
                            </div>
                            <span
                              className={`vendor-overview-flag ${g.reverseChargeApplicable ? "is-yes" : "is-no"}`}
                            >
                              {g.reverseChargeApplicable ? "Yes" : "No"}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted small mb-0">
                        No GST registrations on file.
                      </p>
                    )}
                  </div>

                  <div className="vendor-overview-card">
                    <div className="vendor-overview-card-title">
                      <i className="bx bx-calculator"></i> TDS Information
                    </div>
                    <div className="vendor-overview-card-grid">
                      <div>
                        <div className="vendor-overview-label">
                          TDS Applicable
                        </div>
                        <span
                          className={`vendor-overview-flag ${overviewVendor.tdsApplicable ? "is-yes" : "is-no"}`}
                        >
                          {overviewVendor.tdsApplicable ? "Yes" : "No"}
                        </span>
                      </div>
                      {overviewVendor.tdsApplicable && (
                        <>
                          <div>
                            <div className="vendor-overview-label">
                              TDS Section
                            </div>
                            <div className="vendor-overview-value">
                              {overviewVendor.tdsSection || "—"}
                            </div>
                          </div>
                          <div>
                            <div className="vendor-overview-label">
                              TDS Rate
                            </div>
                            <div className="vendor-overview-value">
                              {overviewVendor.tdsRate ?? "—"}%
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="vendor-overview-card vendor-overview-span-full">
                    <div className="vendor-overview-card-title">
                      <i className="bx bx-map"></i> Address Details
                    </div>
                    <div className="row g-4">
                      <div className="col-md-6">
                        <div className="vendor-overview-label mb-2">
                          Registered Address
                        </div>
                        <div className="vendor-overview-address">
                          <div className="vendor-overview-value">
                            {overviewVendor.registeredAddress?.line1 || "—"}
                          </div>
                          {overviewVendor.registeredAddress?.line2 && (
                            <div className="vendor-overview-value">
                              {overviewVendor.registeredAddress.line2}
                            </div>
                          )}
                          <div className="vendor-overview-subline">
                            {[
                              overviewVendor.registeredAddress?.city,
                              overviewVendor.registeredAddress?.state,
                              overviewVendor.registeredAddress?.pincode,
                            ]
                              .filter(Boolean)
                              .join(", ") || "—"}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="vendor-overview-label mb-2">
                          Billing Address
                        </div>
                        <div className="vendor-overview-address">
                          <div className="vendor-overview-value">
                            {overviewVendor.billingAddress?.line1 || "—"}
                          </div>
                          {overviewVendor.billingAddress?.line2 && (
                            <div className="vendor-overview-value">
                              {overviewVendor.billingAddress.line2}
                            </div>
                          )}
                          <div className="vendor-overview-subline">
                            {[
                              overviewVendor.billingAddress?.city,
                              overviewVendor.billingAddress?.state,
                              overviewVendor.billingAddress?.pincode,
                            ]
                              .filter(Boolean)
                              .join(", ") || "—"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="vendor-overview-card">
                    <div className="vendor-overview-card-title">
                      <i className="bx bx-wallet"></i> Bank & Payments
                    </div>
                    <div className="vendor-overview-card-grid">
                      <div>
                        <div className="vendor-overview-label">Bank Name</div>
                        <div className="vendor-overview-value">
                          {overviewVendor.bankDetails?.bankName || "—"}
                        </div>
                      </div>
                      <div>
                        <div className="vendor-overview-label">
                          Account Number
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <span className="vendor-overview-hero-value">
                            {overviewVendor.bankDetails?.accountNo
                              ? showAccountNo
                                ? overviewVendor.bankDetails.accountNo
                                : `••••${overviewVendor.bankDetails.accountNo.slice(-4)}`
                              : "—"}
                          </span>
                          {overviewVendor.bankDetails?.accountNo && (
                            <button
                              type="button"
                              className="vendor-overview-show-btn"
                              onClick={() => setShowAccountNo((s) => !s)}
                            >
                              {showAccountNo ? "Hide" : "Show"}
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="vendor-overview-label">IFSC Code</div>
                        <div className="vendor-overview-value">
                          {overviewVendor.bankDetails?.ifsc || "—"}
                        </div>
                      </div>
                      <div>
                        <div className="vendor-overview-label">UPI ID</div>
                        <div className="vendor-overview-value">
                          {overviewVendor.bankDetails?.upiId || "—"}
                        </div>
                      </div>
                      <div>
                        <div className="vendor-overview-label">
                          Payment Terms
                        </div>
                        <div className="vendor-overview-value text-capitalize">
                          {(overviewVendor.paymentTerms || "—").replace(
                            /_/g,
                            " ",
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="vendor-overview-card">
                    <div className="vendor-overview-card-title">
                      <i className="bx bx-folder"></i> Documents
                    </div>
                    <div className="vendor-overview-doc-list">
                      {[
                        ["gst_certificate", "GST Certificate"],
                        ["pan_card", "PAN Card Copy"],
                        ["msme_certificate", "MSME Certificate"],
                        ["cancelled_cheque", "Cancelled Cheque"],
                        ["agreement_copy", "Agreement Copy"],
                        ["coi", "Certificate of Incorporation"],
                        ["moa", "Memorandum of Association"],
                        ["aoa", "Articles of Association"],
                      ].map(([type, label]) => {
                        const doc = overviewVendor.documents?.find(
                          (d) => d.docType === type,
                        );
                        return (
                          <div key={type} className="vendor-overview-doc-row">
                            <i className="bx bx-file"></i>
                            <div className="flex-grow-1">
                              <div className="vendor-overview-doc-name">
                                {label}
                              </div>
                              {doc ? (
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="vendor-overview-doc-link"
                                >
                                  <i className="bx bx-show"></i> Preview
                                </a>
                              ) : (
                                <span className="vendor-overview-doc-empty">
                                  Not uploaded
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                )}
              </div>
            </div>
          )}
        </ModalBody>
      </Modal>
    </div>
  );
};

export default VendorList;
