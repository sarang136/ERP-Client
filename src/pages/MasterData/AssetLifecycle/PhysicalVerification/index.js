import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { Button, Input, Modal, ModalBody, Label, Row, Col } from "reactstrap";
import { toast } from "react-toastify";
import {
  getPhysicalVerifications,
  createPhysicalVerification,
  reviewPhysicalVerification,
  uploadPhysicalVerificationImage,
  getVerificationJobs,
  getFixedAssets,
} from "../../../../helpers/backend_helper";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { usePermissions } from "../../../../Components/Hooks/useRoles.js";
import { errText, useBusy } from "../shared/assetUi";
import "../../UnitOfMeasurement/uom.scss";

const dateFmt = (d) => (d ? new Date(d).toLocaleString("en-IN") : "—");

const CONDITIONS = [
  { value: "good", label: "Good" },
  { value: "needs_repair", label: "Needs Repair" },
  { value: "damaged", label: "Damaged" },
  { value: "missing", label: "Missing" },
];

const STATUS_META = {
  pending: { label: "Pending", cls: "status-draft" },
  approved: { label: "Approved", cls: "status-active" },
  rejected: { label: "Rejected", cls: "status-blacklisted" },
};

const StatusPill = ({ status }) => {
  const s = STATUS_META[status] || STATUS_META.pending;
  return (
    <span className={`uom-status-pill ${s.cls}`}>
      <span className="dot"></span> {s.label}
    </span>
  );
};

const PhysicalVerification = () => {
  const handleAuthError = useAuthError();
  const token = JSON.parse(localStorage.getItem("micrologin"))?.token;
  const { hasPermission } = usePermissions(token);
  const canCreate = hasPermission(
    "MASTERDATA",
    "PHYSICAL_VERIFICATION",
    "WRITE",
  );
  const canReview = hasPermission(
    "MASTERDATA",
    "PHYSICAL_VERIFICATION",
    "WRITE",
  );

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [jobs, setJobs] = useState([]);
  const [assets, setAssets] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [jobId, setJobId] = useState("");
  const [assetId, setAssetId] = useState("");
  const [locationMatch, setLocationMatch] = useState("true");
  const [condition, setCondition] = useState("good");
  const [roomNo, setRoomNo] = useState("");
  const [floorNo, setFloorNo] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [designation, setDesignation] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submitting, runSubmit] = useBusy();

  const [createdRecordId, setCreatedRecordId] = useState(null);
  const [assetImageFile, setAssetImageFile] = useState(null);
  const [tagImageFile, setTagImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [assetImageCount, setAssetImageCount] = useState(0);
  const [tagUploaded, setTagUploaded] = useState(false);
  const [assetKey, setAssetKey] = useState(0);
  const [tagKey, setTagKey] = useState(0);

  const [detailModal, setDetailModal] = useState(null);
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    getVerificationJobs({ status: "active" })
      .then((res) => setJobs(res?.data || []))
      .catch(() => {});
    getFixedAssets({ status: "active" })
      .then((res) => setAssets(res?.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getPhysicalVerifications({})
      .then((res) => {
        if (!cancelled) setRecords(res?.data || []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshFlag]);

  const openModal = () => {
    setJobId("");
    setAssetId("");
    setLocationMatch("true");
    setCondition("good");
    setRoomNo("");
    setFloorNo("");
    setEmployeeName("");
    setDesignation("");
    setSerialNumber("");
    setRemarks("");
    setCreatedRecordId(null);
    setAssetImageCount(0);
    setTagUploaded(false);
    setAssetImageFile(null);
    setTagImageFile(null);
    setModalOpen(true);
  };

  const selectedAsset = assets.find((a) => a._id === assetId);

  const handleSubmit = () =>
    runSubmit(async () => {
      if (!jobId || !assetId) return toast.error("Select a Job and an Asset");
      try {
        const res = await createPhysicalVerification({
          jobId,
          assetId,
          locationMatch: locationMatch === "true",
          condition,
          roomNo,
          floorNo,
          employeeName,
          designation,
          serialNumber,
          remarks,
        });
        toast.success("Register check recorded. Now add photos (optional)");
        setCreatedRecordId(res?.data?._id);
      } catch (error) {
        if (!handleAuthError(error)) toast.error(errText(error));
      }
    });

  const uploadImage = async (file, imageType) => {
    if (!file || !createdRecordId) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await uploadPhysicalVerificationImage(
        createdRecordId,
        imageType,
        formData,
      );
      toast.success(`${imageType === "tag" ? "Tag" : "Asset"} image uploaded`);
      if (imageType === "tag") {
        setTagImageFile(null);
        setTagUploaded(true);
        setTagKey((k) => k + 1);
      } else {
        setAssetImageFile(null);
        setAssetImageCount((n) => n + 1);
        setAssetKey((k) => k + 1);
      }
    } catch (error) {
      if (!handleAuthError(error)) toast.error(errText(error, "Upload failed"));
    } finally {
      setUploadingImage(false);
    }
  };

  const finishAndClose = () => {
    setModalOpen(false);
    setRefreshFlag((f) => f + 1);
  };

  const handleReview = async (record, status) => {
    setReviewing(true);
    try {
      await reviewPhysicalVerification(record._id, { status });
      toast.success(`Register check ${status}`);
      setDetailModal(null);
      setRefreshFlag((f) => f + 1);
    } catch (error) {
      if (!handleAuthError(error)) toast.error(errText(error, "Couldn't update."));
    } finally {
      setReviewing(false);
    }
  };

  const columns = [
    {
      name: "PV Code",
      selector: (row) => row.verificationNumber,
      sortable: true,
      width: "150px",
    },
    {
      name: "Asset",
      cell: (row) => (
        <span className="uom-cell-primary">
          {row.assetId?.assetName || "—"}
        </span>
      ),
    },
    {
      name: "Job",
      cell: (row) => (
        <span className="uom-cell-muted">{row.jobId?.jobCode || "—"}</span>
      ),
    },
    {
      name: "Location Match",
      width: "130px",
      cell: (row) => (
        <span
          className={`uom-status-pill ${row.locationMatch ? "status-active" : "status-blacklisted"}`}
        >
          <span className="dot"></span>{" "}
          {row.locationMatch ? "Match" : "Mismatch"}
        </span>
      ),
    },
    {
      name: "Condition",
      width: "120px",
      cell: (row) => (
        <span className="text-capitalize small">
          {row.condition?.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      name: "Status",
      width: "110px",
      cell: (row) => <StatusPill status={row.status} />,
    },
    {
      name: "Date",
      cell: (row) => (
        <span className="uom-cell-muted small">{dateFmt(row.verifiedAt)}</span>
      ),
    },
    {
      name: "",
      right: true,
      width: "90px",
      cell: (row) => (
        <Button size="sm" color="light" onClick={() => setDetailModal(row)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="uom-page">
      <div className="uom-list-header">
        <div>
          <h4>Register Check</h4>
          <p>Manage and track register checks</p>
        </div>
      </div>

      <div className="d-flex justify-content-end mb-3">
        {canCreate && (
          <Button color="primary" onClick={openModal}>
            <i className="bx bx-plus me-1"></i> Record Register Check
          </Button>
        )}
      </div>

      <div className="uom-table-card">
        <DataTable
          columns={columns}
          data={records}
          progressPending={loading}
          pagination
          highlightOnHover
          noDataComponent={
            <div className="uom-empty-state">No register checks yet</div>
          }
        />
      </div>

      <Modal
        isOpen={modalOpen}
        toggle={() =>
          createdRecordId ? finishAndClose() : setModalOpen(false)
        }
        centered
        size="lg"
      >
        <ModalBody className="p-4">
          <h5 className="mb-3">Record Register Check</h5>

          {!createdRecordId ? (
            <>
              <Row>
                <Col md={6} className="mb-3">
                  <Label>
                    Verification Job <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="select"
                    value={jobId}
                    onChange={(e) => setJobId(e.target.value)}
                  >
                    <option value="">Select an active job</option>
                    {jobs.map((j) => (
                      <option key={j._id} value={j._id}>
                        {j.jobCode} — {j.jobName}
                      </option>
                    ))}
                  </Input>
                </Col>
                <Col md={6} className="mb-3">
                  <Label>
                    Asset <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="select"
                    value={assetId}
                    onChange={(e) => setAssetId(e.target.value)}
                  >
                    <option value="">Select asset</option>
                    {assets.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.assetName} ({a.assetTag})
                      </option>
                    ))}
                  </Input>
                </Col>
              </Row>
              {selectedAsset && (
                <div className="uom-table-card p-3 mb-3">
                  <div className="text-muted small mb-1">
                    Expected Location (per register)
                  </div>
                  <div className="fw-semibold">
                    {selectedAsset.centerId?.title || "Not set"}
                  </div>
                </div>
              )}

              <Label>
                Is the asset at its expected location?{" "}
                <span className="text-danger">*</span>
              </Label>
              <div className="d-flex gap-2 mb-3">
                <Button
                  color={locationMatch === "true" ? "success" : "light"}
                  onClick={() => setLocationMatch("true")}
                >
                  <i className="bx bx-check me-1"></i> Yes, Match
                </Button>
                <Button
                  color={locationMatch === "false" ? "danger" : "light"}
                  onClick={() => setLocationMatch("false")}
                >
                  <i className="bx bx-x me-1"></i> No, Mismatch
                </Button>
              </div>

              <Label>
                Condition <span className="text-danger">*</span>
              </Label>
              <Input
                type="select"
                className="mb-3"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
              >
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Input>

              <h6 className="fw-semibold mb-3">
                Additional Details (optional)
              </h6>
              <Row>
                <Col md={6} className="mb-3">
                  <Label className="small">Room No.</Label>
                  <Input
                    value={roomNo}
                    onChange={(e) => setRoomNo(e.target.value)}
                  />
                </Col>
                <Col md={6} className="mb-3">
                  <Label className="small">Floor No.</Label>
                  <Input
                    value={floorNo}
                    onChange={(e) => setFloorNo(e.target.value)}
                  />
                </Col>
              </Row>
              <Row>
                <Col md={6} className="mb-3">
                  <Label className="small">Employee Name</Label>
                  <Input
                    value={employeeName}
                    onChange={(e) => setEmployeeName(e.target.value)}
                  />
                </Col>
                <Col md={6} className="mb-3">
                  <Label className="small">Designation</Label>
                  <Input
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                  />
                </Col>
              </Row>
              <Label className="small">Serial Number</Label>
              <Input
                className="mb-3"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
              />

              <Label>Remarks</Label>
              <Input
                type="textarea"
                rows={2}
                className="mb-4"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />

              <div className="d-flex justify-content-end gap-2">
                <Button
                  color="light"
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Save & Continue"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div
                className="uom-table-card p-3 mb-3"
                style={{ background: "#f0fdf4" }}
              >
                <i className="bx bx-check-circle text-success me-1"></i>{" "}
                Register check saved. Add photos below (optional), then finish.
              </div>

              <Label>
                Asset Image{" "}
                <span className="text-muted small">({assetImageCount} of 5 uploaded)</span>
              </Label>
              <div className="d-flex gap-2 mb-4">
                <Input
                  key={`a${assetKey}`}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAssetImageFile(e.target.files[0])}
                />
                <Button
                  color="light"
                  disabled={!assetImageFile || uploadingImage || assetImageCount >= 5}
                  onClick={() => uploadImage(assetImageFile, "asset")}
                >
                  Upload
                </Button>
              </div>

              <Label>
                Tag Image{" "}
                {tagUploaded && <span className="text-muted small">(uploaded; a new upload replaces it)</span>}
              </Label>
              <div className="d-flex gap-2 mb-4">
                <Input
                  key={`t${tagKey}`}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setTagImageFile(e.target.files[0])}
                />
                <Button
                  color="light"
                  disabled={!tagImageFile || uploadingImage}
                  onClick={() => uploadImage(tagImageFile, "tag")}
                >
                  Upload
                </Button>
              </div>

              <div className="d-flex justify-content-end">
                <Button color="primary" onClick={finishAndClose}>
                  Done
                </Button>
              </div>
            </>
          )}
        </ModalBody>
      </Modal>

      <Modal
        isOpen={!!detailModal}
        toggle={() => setDetailModal(null)}
        centered
        size="lg"
      >
        <ModalBody className="p-4">
          {detailModal && (
            <>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h5 className="mb-1">{detailModal.verificationNumber}</h5>
                  <StatusPill status={detailModal.status} />
                </div>
              </div>

              <Row className="mb-3">
                <Col md={6}>
                  <div className="text-muted small">Asset</div>
                  <div className="fw-semibold">
                    {detailModal.assetId?.assetName}
                  </div>
                </Col>
                <Col md={6}>
                  <div className="text-muted small">Job</div>
                  <div className="fw-semibold">
                    {detailModal.jobId?.jobCode}
                  </div>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <div className="text-muted small">Room / Floor</div>
                  <div>
                    {detailModal.roomNo || "—"} / {detailModal.floorNo || "—"}
                  </div>
                </Col>
                <Col md={6}>
                  <div className="text-muted small">Employee</div>
                  <div>
                    {detailModal.employeeName || "—"}{" "}
                    {detailModal.designation
                      ? `(${detailModal.designation})`
                      : ""}
                  </div>
                </Col>
              </Row>

              {(detailModal.assetImages?.length > 0 ||
                detailModal.tagImage) && (
                <div className="d-flex gap-2 flex-wrap mb-3">
                  {detailModal.assetImages?.map((img, i) => (
                    <img
                      key={i}
                      src={img.url}
                      alt="asset"
                      style={{
                        width: 90,
                        height: 90,
                        objectFit: "cover",
                        borderRadius: 8,
                      }}
                    />
                  ))}
                  {detailModal.tagImage && (
                    <img
                      src={detailModal.tagImage.url}
                      alt="tag"
                      style={{
                        width: 90,
                        height: 90,
                        objectFit: "cover",
                        borderRadius: 8,
                        border: "2px solid #6366f1",
                      }}
                    />
                  )}
                </div>
              )}

              <div className="mb-3">
                <div className="text-muted small">Remarks</div>
                <div>{detailModal.remarks || "—"}</div>
              </div>

              {canReview && detailModal.status === "pending" && (
                <div className="d-flex gap-2 mt-4">
                  <Button
                    color="success"
                    disabled={reviewing}
                    onClick={() => handleReview(detailModal, "approved")}
                  >
                    Approve
                  </Button>
                  <Button
                    color="danger"
                    outline
                    disabled={reviewing}
                    onClick={() => handleReview(detailModal, "rejected")}
                  >
                    Reject
                  </Button>
                </div>
              )}

              <div className="d-flex justify-content-end mt-3">
                <Button color="light" onClick={() => setDetailModal(null)}>
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

export default PhysicalVerification;
