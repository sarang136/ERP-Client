import React, { useEffect, useState, useRef } from "react";
import {
  Card,
  CardBody,
  Row,
  Col,
  Input,
  Nav,
  NavItem,
  NavLink,
  Button,
  Spinner,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Progress,
  ListGroup,
  ListGroupItem,
} from "reactstrap";
import { toast } from "react-toastify";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import Typeloader from "../../Components/Loader";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { usePermissions } from "../../../../Components/Hooks/useRoles";
import {
  fetchMedicineRequisitions,
  approveMedicineRequisition,
  rejectMedicineRequisition,
  removeMedicineRequisition,
} from "../../../../store/features/medicine/medicineSlice";
import {
  exportMedicineRequisitionExcel,
  bulkUploadMedicineRequisitions,
} from "../../../../helpers/backend_helper";
import DataTableComponent from "../../../../Components/Common/DataTable";
import { useMediaQuery } from "../../../../Components/Hooks/useMediaQuery";
import { getMedicineRequisitionColumns } from "../../Columns/Pharmacy/MedicineRequisitionColumns";
import Select from "react-select";
import RefreshButton from "../../../../Components/Common/RefreshButton";
import DeleteModal from "../../../../Components/Common/DeleteModal";
import DetailModal from "../../Components/MedicineRequisitionDetailModal";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

const MedicineRequisition = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const handleAuthError = useAuthError();
  const microUser = localStorage.getItem("micrologin");
  const token = microUser ? JSON.parse(microUser).token : null;
  const { hasPermission, loading: permissionLoader } = usePermissions(token);
  const isMobile = useMediaQuery("(max-width: 1000px)");

  const {
    loading,
    data: requisitions,
    totalCount,
  } = useSelector((state) => state.Medicine);
  const user = useSelector((state) => state.User);
  const centerList = useSelector((state) => state.Center.data);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [reviewMode, setReviewMode] = useState(null); // null | "approve" | "reject"
  const [reviewRemarks, setReviewRemarks] = useState("");

  const [detailModal, setDetailModal] = useState({ open: false, row: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, row: null });

  const [exporting, setExporting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [previewModal, setPreviewModal] = useState({ open: false, file: null, rows: [], headers: [] });
  const fileInputRef = useRef(null);

  const hasWritePermission = hasPermission("PHARMACY", "REQUISITION_MEDICINE_REQUISITION", "WRITE");
  const hasReadPermission = hasPermission("PHARMACY", "REQUISITION_MEDICINE_REQUISITION", "READ");
  const hasDeletePermission = hasPermission("PHARMACY", "REQUISITION_MEDICINE_REQUISITION", "DELETE");
  const hasRaisePermission = hasPermission("PHARMACY", "RAISE_MEDICINE_REQUISITION", "WRITE");

  const [selectedCenter, setSelectedCenter] = useState("ALL");
  const centerOptions = [
    ...(user?.centerAccess?.length > 1
      ? [
        {
          value: "ALL",
          label: "All Centers",
          isDisabled: false,
        },
      ]
      : []),
    ...(centerList
      ?.filter((c) => user?.centerAccess?.includes(c._id))
      ?.map((c) => ({
        value: c._id,
        label: c.title,
      })) || []),
  ];

  const selectedCenterOption =
    centerOptions.find((opt) => opt.value === selectedCenter) ||
    centerOptions[0];

  const loadRequisitions = async (page = currentPage, overrideStatus = null, limit = pageSize) => {
    const status = overrideStatus ?? statusFilter;
    if (status === "") return;

    try {
      const centers =
        selectedCenter === "ALL"
          ? user?.centerAccess
          : !user?.centerAccess?.length
            ? []
            : [selectedCenter];

      await dispatch(
        fetchMedicineRequisitions({
          page,
          limit,
          status: status,
          centers: centers,
          search: searchQuery || undefined,
        })
      ).unwrap();
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(error?.message || "Failed to load requisitions");
      }
    }
  };

  const reloadFromStart = () => {
    setCurrentPage(1);
    loadRequisitions(1);
  };

  useEffect(() => {
    if (selectedCenter !== "ALL" && !user?.centerAccess?.includes(selectedCenter)) {
      setSelectedCenter("ALL");
    }
  }, [user?.centerAccess, selectedCenter]);

  useEffect(() => {
    reloadFromStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, selectedCenter, user?.centerAccess?.join(",")]);

  const isFirstSearchRun = useRef(true);

  useEffect(() => {
    // The mount fetch is already done by the effect above; only debounce real search changes.
    if (isFirstSearchRun.current) {
      isFirstSearchRun.current = false;
      return;
    }
    const handler = setTimeout(() => {
      reloadFromStart();
    }, 500);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const toggleTab = (tab) => {
    if (statusFilter !== tab) {
      setStatusFilter(tab);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    loadRequisitions(page);
  };

  const handleLimitChange = (newLimit) => {
    setPageSize(newLimit);
    setCurrentPage(1);
    loadRequisitions(1, null, newLimit);
  };

  // Opens the detail modal straight into review mode (used by the table's Approve/Reject
  // buttons) - same modal the "view" eye icon opens, just starting past the read-only step.
  const openReviewModal = (row, mode) => {
    setDetailModal({ open: true, row });
    setReviewMode(mode);
    setReviewRemarks("");
  };

  const closeDetailModal = () => {
    setDetailModal({ open: false, row: null });
    setReviewMode(null);
    setReviewRemarks("");
  };

  const submitReview = async () => {
    const row = detailModal.row;
    if (!reviewMode || !row) return;

    if (reviewMode === "reject" && !reviewRemarks.trim()) {
      toast.error("Remarks are required for rejection");
      return;
    }

    try {
      const data = {
        remarks: reviewRemarks.trim(),
      };

      const action = reviewMode === "approve" ? approveMedicineRequisition : rejectMedicineRequisition;

      const result = await dispatch(action({ id: row._id, ...data })).unwrap();
      if (result) {
        closeDetailModal();
        loadRequisitions();
      }
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(error?.message || `Failed to ${reviewMode} requisition`);
      }
    }
  };

  const submitDelete = async () => {
    const { row } = deleteModal;
    if (!row) return;

    try {
      await dispatch(removeMedicineRequisition(row._id)).unwrap();
      setDeleteModal({ open: false, row: null });
      loadRequisitions();
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(error?.message || "Failed to delete requisition");
      }
    }
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const centers =
        selectedCenter === "ALL" ? user?.centerAccess : [selectedCenter];
      const response = await exportMedicineRequisitionExcel({
        centers: centers?.join(",") || undefined,
        search: searchQuery || undefined,
      });
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, `Pending_Medicine_Requisitions_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success("Exported pending requisitions to Excel");
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error("Failed to export Excel file");
      }
    } finally {
      setExporting(false);
    }
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file next time
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
      setPreviewModal({ open: true, file, rows, headers });
    } catch (error) {
      toast.error("Could not read the selected file — make sure it's a valid .xlsx export");
    }
  };

  const closePreviewModal = () => setPreviewModal({ open: false, file: null, rows: [], headers: [] });

  const handleConfirmUpload = async () => {
    const file = previewModal.file;
    if (!file) return;
    closePreviewModal();

    try {
      setUploading(true);
      const response = await bulkUploadMedicineRequisitions(file);
      const result = response;
      setUploadResult(result);
      const { created = 0, approved = 0, rejected = 0, updated = 0, noChange = 0, errors = [] } = result || {};
      if (errors.length > 0) {
        toast.warning(`${errors.length} row(s) failed — see details`);
      } else {
        toast.success(
          `Done: ${created} created, ${approved} approved, ${rejected} rejected, ${updated} updated, ${noChange} unchanged`
        );
      }
      reloadFromStart();
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(error?.response?.data?.message || "Failed to upload file");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadFailedRows = () => {
    const errors = uploadResult?.errors || [];
    if (errors.length === 0) return;
    const sheet = XLSX.utils.json_to_sheet(
      errors.map((err) => ({
        Row: err.row,
        "Requisition ID": err.requisitionNumber,
        Reason: err.message,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Failed Rows");
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `Failed_Medicine_Requisitions_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const columns = getMedicineRequisitionColumns({
    openDetail: (row) => {
      setDetailModal({ open: true, row });
      setReviewMode(null);
      setReviewRemarks("");
    },
    handleEdit: (row) => navigate(`/pharmacy/requisition/medicine-requisition/edit/${row._id}`),
    handleApprove: (row) => openReviewModal(row, "approve"),
    handleReject: (row) => openReviewModal(row, "reject"),
    handleDelete: (row) => setDeleteModal({ open: true, row }),
    hasWritePermission,
    hasDeletePermission,
    status: statusFilter,
  });

  if (permissionLoader) {
    return (
      <CardBody
        className="p-3 bg-white d-flex justify-content-center align-items-center"
        style={isMobile ? { width: "100%", minHeight: "60vh" } : { width: "78%", minHeight: "60vh" }}
      >
        <Spinner color="primary" />
      </CardBody>
    );
  }

  if (!hasReadPermission) navigate("/unauthorized")

  return (
    <React.Fragment>
      <CardBody
        className="p-3 bg-white"
        style={isMobile ? { width: "100%" } : { width: "78%" }}
      >
        <div className="d-flex flex-column h-100">
          <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3 mb-3">
            <div>
              <h5 className="mb-1 fw-semibold">
                Medicine Requisitions
              </h5>
              <p className="text-muted mb-0 fs-13">
                Manage and review new medicine proposals for the master medicine
              </p>
            </div>
            <div className="d-flex gap-2 flex-wrap justify-content-end">
              {hasWritePermission && (
                <>
                  <Button
                    color="secondary"
                    outline
                    onClick={handleExportExcel}
                    disabled={exporting}
                    className="d-flex align-items-center gap-1 justify-content-center"
                  >
                    {exporting ? <Spinner size="sm" /> : <i className="bx bx-export fs-5" />}
                    <span>{exporting ? "Exporting..." : "Export (Excel)"}</span>
                  </Button>
                  <Button
                    color="secondary"
                    outline
                    onClick={handleUploadClick}
                    disabled={uploading}
                    className="d-flex align-items-center gap-1 justify-content-center"
                  >
                    {uploading ? <Spinner size="sm" /> : <i className="bx bx-upload fs-5" />}
                    <span>{uploading ? "Uploading..." : "Upload Excel"}</span>
                  </Button>
                  <input
                    type="file"
                    accept=".xlsx"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileSelected}
                  />
                </>
              )}
              {hasRaisePermission && (
                <Button
                  color="primary"
                  onClick={() => navigate("/pharmacy/requisition/medicine-requisition/add")}
                  className="text-white d-flex align-items-center gap-1 justify-content-center"
                >
                  <i className="bx bx-plus fs-5" />
                  <span>New Requisition</span>
                </Button>
              )}
            </div>
          </div>

          {/* Status Tabs */}
          <Nav tabs className="flex-wrap mb-0" style={{ borderBottom: "1px solid #dee2e6" }}>
            {STATUS_OPTIONS.map((status) => {
              const isActive = statusFilter === status.value;
              return (
                <NavItem key={status.value}>
                  <NavLink
                    href="#"
                    active={isActive}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleTab(status.value);
                    }}
                    style={{
                      fontSize: 13,
                      fontWeight: isActive ? 700 : 500,
                      cursor: "pointer",
                      color: isActive ? "#212529" : "#0d6efd",
                      background: isActive ? "#fff" : "transparent",
                      border: isActive ? "1px solid #dee2e6" : "none",
                      borderBottom: isActive ? "1px solid #fff" : "none",
                      borderRadius: isActive ? "4px 4px 0 0" : 0,
                      padding: "6px 14px",
                      marginBottom: -1,
                      textDecoration: "none",
                    }}
                  >
                    {status.label}
                  </NavLink>
                </NavItem>
              );
            })}
          </Nav>

          {/* Filters */}
          <Card className="mb-3 shadow-sm border-0" style={{ borderRadius: "0 0 8px 8px" }}>
            <CardBody className="py-3">
              <Row className="g-2 align-items-center">
                <Col md={4} lg={3}>
                  <Select
                    classNamePrefix="react-select"
                    options={centerOptions}
                    value={selectedCenterOption}
                    onChange={(option) => {
                      setSelectedCenter(option?.value);
                    }}
                    placeholder="All Centers"
                  />
                </Col>
                <Col md={5} lg={4}>
                  <div className="position-relative">
                    <i
                      className="bx bx-search position-absolute text-muted"
                      style={{ top: "50%", left: 10, transform: "translateY(-50%)" }}
                    />
                    <Input
                      type="text"
                      placeholder="Search by ID or Medicine Name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ paddingLeft: 32 }}
                    />
                  </div>
                </Col>
                <Col md={3} lg={5} className="d-flex justify-content-end">
                  <RefreshButton
                    onRefresh={() => loadRequisitions()}
                    loading={loading}
                  />
                </Col>
              </Row>
            </CardBody>
          </Card>

          {/* Table */}
          <Card className="flex-grow-1 shadow-sm border-0 mb-0">
            <CardBody className="p-0 d-flex flex-column h-100">
              <div className="flex-grow-1 position-relative" style={{ minHeight: "500px" }}>
                <DataTableComponent
                  columns={columns}
                  data={requisitions || []}
                  loading={loading}
                  pagination={{ totalDocs: totalCount || 0 }}
                  limit={pageSize}
                  setLimit={handleLimitChange}
                  page={currentPage}
                  setPage={handlePageChange}
                />
              </div>
            </CardBody>
          </Card>
        </div>
      </CardBody>

      {/* Detail Modal - also handles Approve/Reject in place via reviewMode */}
      <DetailModal
        isOpen={detailModal.open}
        toggle={closeDetailModal}
        row={detailModal.row}
        hasWritePermission={hasWritePermission}
        reviewMode={reviewMode}
        onStartReview={(mode) => {
          setReviewMode(mode);
          setReviewRemarks("");
        }}
        onCancelReview={closeDetailModal}
        reviewRemarks={reviewRemarks}
        setReviewRemarks={setReviewRemarks}
        onSubmitReview={submitReview}
        reviewLoading={loading}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        show={deleteModal.open}
        onDeleteClick={submitDelete}
        onCloseClick={() => setDeleteModal({ open: false, row: null })}
        messsage={`Are you sure you want to delete Requisition ${deleteModal.row?.requisitionNumber}? This action cannot be undone.`}
        buttonMessage={loading ? "Deleting..." : "Yes, Delete It!"}
      />

      {/* Bulk Upload Preview Modal */}
      <Modal isOpen={previewModal.open} toggle={closePreviewModal} size="xl" centered>
        <ModalHeader toggle={closePreviewModal}>
          Preview — {previewModal.file?.name}
        </ModalHeader>
        <ModalBody>
          <h5>Data Preview (Top {Math.min(previewModal.rows.length, 10)} rows)</h5>
          <p className="text-muted mb-2" style={{ fontSize: 14 }}>
            {previewModal.rows.length} row(s) found in this file. Review a sample below, then
            confirm to process the full file.
          </p>
          <div className="table-responsive" style={{ maxHeight: 400, overflowY: "auto" }}>
            <table className="table table-bordered table-sm">
              <thead className="table-light">
                <tr>
                  {previewModal.headers.map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewModal.rows.slice(0, 10).map((row, idx) => (
                  <tr key={idx}>
                    {previewModal.headers.map((header) => (
                      <td key={header}>{String(row[header] ?? "")}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" outline onClick={closePreviewModal}>
            Cancel
          </Button>
          <Button color="primary" onClick={handleConfirmUpload} disabled={previewModal.rows.length === 0}>
            Confirm & Upload
          </Button>
        </ModalFooter>
      </Modal>

      {/* Bulk Upload Result Modal */}
      <Modal isOpen={!!uploadResult} toggle={() => setUploadResult(null)} size="lg" centered>
        <ModalHeader toggle={() => setUploadResult(null)}>Bulk Upload Results</ModalHeader>
        <ModalBody>
          <ListGroup flush className="text-start rounded-3 overflow-hidden border mb-3">
            <ListGroupItem className="d-flex justify-content-between align-items-center py-3 bg-white">
              <span className="fw-semibold text-muted">Total Rows</span>
              <span className="fw-bold text-primary fs-6">
                {(uploadResult?.approved ?? 0) +
                  (uploadResult?.rejected ?? 0) +
                  (uploadResult?.updated ?? 0) +
                  (uploadResult?.noChange ?? 0) +
                  (uploadResult?.errors?.length ?? 0) +
                  // Only the newly-created rows that were left pending (no Status set) -
                  // created rows that were also approved/rejected are already in those counts.
                  Math.max(0, (uploadResult?.created ?? 0) - (uploadResult?.createdAndReviewed ?? 0))}
              </span>
            </ListGroupItem>
            <ListGroupItem className="d-flex justify-content-between align-items-center py-3 bg-white">
              <span className="fw-semibold text-muted">
                New Requisitions Created
                <span className="d-block text-muted fw-normal" style={{ fontSize: 12 }}>
                  rows with a blank Requisition ID — also counted as Approved/Rejected/Updated above if a Status was set
                </span>
              </span>
              <span className="fw-bold text-primary fs-6">{uploadResult?.created ?? 0}</span>
            </ListGroupItem>
            <ListGroupItem className="d-flex justify-content-between align-items-center py-3 bg-white">
              <span className="fw-semibold text-muted">Approved</span>
              <span className="fw-bold text-success fs-6">{uploadResult?.approved ?? 0}</span>
            </ListGroupItem>
            <ListGroupItem className="d-flex justify-content-between align-items-center py-3 bg-white">
              <span className="fw-semibold text-muted">Rejected</span>
              <span className="fw-bold text-danger fs-6">{uploadResult?.rejected ?? 0}</span>
            </ListGroupItem>
            <ListGroupItem className="d-flex justify-content-between align-items-center py-3 bg-white">
              <span className="fw-semibold text-muted">Updated</span>
              <span className="fw-bold text-info fs-6">{uploadResult?.updated ?? 0}</span>
            </ListGroupItem>
            <ListGroupItem className="d-flex justify-content-between align-items-center py-3 bg-white">
              <span className="fw-semibold text-muted">Unchanged</span>
              <span className="fw-bold text-secondary fs-6">{uploadResult?.noChange ?? 0}</span>
            </ListGroupItem>
            <ListGroupItem className="d-flex justify-content-between align-items-center py-3 bg-white">
              <span className="fw-semibold text-muted">Failed</span>
              <span className="fw-bold text-warning fs-6">{uploadResult?.errors?.length ?? 0}</span>
            </ListGroupItem>
          </ListGroup>
          {uploadResult?.errors?.length > 0 && (
            <div className="p-3 bg-light rounded border mb-2">
              <p className="mb-2 text-muted" style={{ fontSize: 14 }}>
                {uploadResult.errors.length} row(s) could not be processed. Download the list,
                fix the issue, and re-upload.
              </p>
              <Button color="warning" outline size="sm" onClick={handleDownloadFailedRows}>
                <i className="bx bx-download me-1" />
                Download Failed Rows
              </Button>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setUploadResult(null)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>

      {/* Upload progress overlay */}
      {uploading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(5px)",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "2rem",
              borderRadius: "12px",
              maxWidth: "500px",
              width: "90%",
              textAlign: "center",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            }}
          >
            <div className="alert alert-warning text-center fw-bold">
              ⚠️ Upload in progress — please DO NOT refresh or close this page.
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: "1rem",
                marginTop: "1rem",
              }}
            >
              <Typeloader />
              <Progress value={100} animated striped style={{ width: "100%" }}>
                Processing...
              </Progress>
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export default MedicineRequisition;
