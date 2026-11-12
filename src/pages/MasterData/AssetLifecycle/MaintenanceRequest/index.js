import React, { useState, useEffect, useRef } from "react";
import DataTable from "react-data-table-component";
import { Button, Input, Modal, ModalBody, Label, Row, Col } from "reactstrap";
import { toast } from "react-toastify";
import {
  getMaintenanceRequests,
  createMaintenanceRequest,
  approveMaintenanceRequest,
  rejectMaintenanceRequest,
  getFixedAssets,
} from "../../../../helpers/backend_helper";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { useReferenceList } from "../../../../Components/Hooks/useReferenceData";
import { usePermissions } from "../../../../Components/Hooks/useRoles.js";
import { errText } from "../shared/assetUi";
import "../../UnitOfMeasurement/uom.scss";

const dateFmt = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "—");

const MAINTENANCE_TYPES = [
  { value: "corrective", label: "Corrective" },
  { value: "preventive", label: "Preventive" },
  { value: "inspection", label: "Inspection" },
  { value: "emergency", label: "Emergency" },
];
const NO_SITE = "none";
const PRIORITIES = ["low", "medium", "high", "critical"];

const emptyItem = () => ({
  assetId: "",
  serialNumber: "",
  priority: "medium",
  remarks: "",
});

const StatusPill = ({ status }) => {
  const map = {
    pending: { label: "Pending", cls: "status-draft" },
    approved: { label: "Approved", cls: "status-active" },
    rejected: { label: "Rejected", cls: "status-blacklisted" },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`uom-status-pill ${s.cls}`}>
      <span className="dot"></span> {s.label}
    </span>
  );
};

const MaintenanceRequest = () => {
  const handleAuthError = useAuthError();
  const token = JSON.parse(localStorage.getItem("micrologin"))?.token;
  const { hasPermission } = usePermissions(token);
  const canCreate = hasPermission("MASTERDATA", "MAINTENANCE_REQUEST", "WRITE");
  const canApprove = hasPermission(
    "MASTERDATA",
    "MAINTENANCE_REQUEST",
    "WRITE",
  );

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const { items: centers } = useReferenceList("centers");
  const [assets, setAssets] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [maintenanceType, setMaintenanceType] = useState("corrective");
  const [centerId, setCenterId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState([emptyItem()]);
  const [submitting, setSubmitting] = useState(false);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const assetReq = useRef(0);
  const [busyId, setBusyId] = useState(null);
  const [rejecting, setRejecting] = useState(false);
  const [detailModal, setDetailModal] = useState(null);

  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const handleCenterChange = (id) => {
    setCenterId(id);
    setItems([emptyItem()]);
    if (!id) {
      assetReq.current++;
      setAssets([]);
      setAssetsLoading(false);
      return;
    }
    const req = ++assetReq.current;
    setAssetsLoading(true);
    const noSite = id === NO_SITE;
    getFixedAssets(noSite ? {} : { centerId: id })
      .then((res) => {
        if (req !== assetReq.current) return;
        setAssets(
          (res?.data || []).filter(
            (a) =>
              a.status !== "written_off" &&
              !a.pendingWriteOff &&
              (noSite ? !a.centerId : true),
          ),
        );
      })
      .catch(() => {
        if (req === assetReq.current) setAssets([]);
      })
      .finally(() => {
        if (req === assetReq.current) setAssetsLoading(false);
      });
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getMaintenanceRequests({})
      .then((res) => {
        if (!cancelled) setRequests(res?.data || []);
      })
      .catch((error) => {
        if (!cancelled && !handleAuthError(error)) toast.error(errText(error));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshFlag]);

  const openModal = () => {
    setMaintenanceType("corrective");
    setCenterId("");
    setTitle("");
    setDescription("");
    setItems([emptyItem()]);
    setModalOpen(true);
  };

  const updateItem = (idx, field, value) => {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)),
    );
  };
  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (idx) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!centerId || !title.trim())
      return toast.error("Fill in Site and Title");
    const invalid = items.find((it) => !it.assetId);
    if (invalid) return toast.error("Select an asset for every item");
    if (centerId === NO_SITE)
      return toast.error("A maintenance request needs a site. Set the asset's site first");

    setSubmitting(true);
    try {
      await createMaintenanceRequest({
        maintenanceType,
        centerId,
        title,
        description,
        items,
      });
      toast.success("Maintenance request created successfully");
      setModalOpen(false);
      setRefreshFlag((f) => f + 1);
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(errText(error));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id) => {
    if (busyId) return;
    setBusyId(id);
    try {
      const res = await approveMaintenanceRequest(id);
      toast.success(res?.message || "Request approved — work orders created");
      setRefreshFlag((f) => f + 1);
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(errText(error, "Couldn't approve."));
      }
    } finally {
      setBusyId(null);
    }
  };

  const closeReject = () => {
    setRejectTarget(null);
    setRejectReason("");
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) return toast.error("Provide a rejection reason");
    if (rejecting) return;
    setRejecting(true);
    try {
      await rejectMaintenanceRequest(rejectTarget._id, {
        rejectionReason: rejectReason,
      });
      toast.success("Request rejected");
      setRejectTarget(null);
      setRejectReason("");
      setRefreshFlag((f) => f + 1);
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(errText(error, "Couldn't reject."));
      }
    } finally {
      setRejecting(false);
    }
  };

  const columns = [
    {
      name: "Request #",
      selector: (row) => row.requestNumber,
      sortable: true,
      width: "150px",
    },
    {
      name: "Title",
      cell: (row) => <span title={row.title}>{row.title}</span>,
      wrap: true,
    },
    {
      name: "Type",
      width: "110px",
      cell: (row) => (
        <span className="uom-cell-muted text-capitalize">
          {row.maintenanceType}
        </span>
      ),
    },
    {
      name: "Site",
      cell: (row) => (
        <span className="uom-cell-muted">{row.centerId?.title || "—"}</span>
      ),
    },
    {
      name: "Items",
      width: "70px",
      cell: (row) => (
        <span className="uom-cell-muted">{row.items?.length || 0}</span>
      ),
    },
    {
      name: "Status",
      width: "120px",
      cell: (row) => <StatusPill status={row.status} />,
    },
    {
      name: "Date",
      cell: (row) => (
        <span className="uom-cell-muted">{dateFmt(row.createdAt)}</span>
      ),
    },
    {
      name: "Actions",
      right: true,
      width: "260px",
      cell: (row) => (
        <div className="d-flex gap-2">
          <Button size="sm" color="light" onClick={() => setDetailModal(row)}>
            View
          </Button>
          {row.status === "pending" && canApprove && (
            <>
              <Button
                size="sm"
                color="success"
                disabled={!!busyId}
                onClick={() => handleApprove(row._id)}
              >
                {busyId === row._id ? "Approving..." : "Approve"}
              </Button>
              <Button
                size="sm"
                color="danger"
                outline
                disabled={!!busyId}
                onClick={() => {
                  setRejectReason("");
                  setRejectTarget(row);
                }}
              >
                Reject
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="uom-page">
      <div className="uom-list-header">
        <div>
          <h4>Maintenance Requests</h4>
          <p>
            Report an asset issue — approving creates one Work Order per asset
          </p>
        </div>
      </div>

      <div className="d-flex justify-content-end mb-3">
        {canCreate && (
          <Button color="primary" onClick={openModal}>
            <i className="bx bx-plus me-1"></i> New Request
          </Button>
        )}
      </div>

      <div className="uom-table-card">
        <DataTable
          columns={columns}
          data={requests}
          progressPending={loading}
          pagination
          highlightOnHover
          noDataComponent={
            <div className="uom-empty-state">No maintenance requests yet</div>
          }
        />
      </div>

      <Modal
        isOpen={modalOpen}
        toggle={() => !submitting && setModalOpen(false)}
        centered
        size="lg"
      >
        <ModalBody className="p-4">
          <h5 className="mb-3">New Maintenance Request</h5>
          <Row>
            <Col md={6} className="mb-3">
              <Label>
                Maintenance Type <span className="text-danger">*</span>
              </Label>
              <Input
                type="select"
                value={maintenanceType}
                onChange={(e) => setMaintenanceType(e.target.value)}
              >
                {MAINTENANCE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Input>
            </Col>
            <Col md={6} className="mb-3">
              <Label>
                Site <span className="text-danger">*</span>
              </Label>
              <Input
                type="select"
                value={centerId}
                onChange={(e) => handleCenterChange(e.target.value)}
              >
                <option value="">Select site</option>
                <option value={NO_SITE}>No site assigned</option>
                {centers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </Input>
            </Col>
          </Row>
          <Row>
            <Col md={12} className="mb-3">
              <Label>
                Title <span className="text-danger">*</span>
              </Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </Col>
          </Row>

          <Row>
            <Col md={12} className="mb-4">
              <Label>Description</Label>
              <Input
                type="textarea"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Col>
          </Row>
          <h6 className="fw-semibold mb-3">Asset Items</h6>
          {items.map((it, idx) => (
            <div key={idx} className="uom-table-card p-3 mb-3">
              <div className="d-flex justify-content-between mb-2">
                <div className="fw-semibold small">Item #{idx + 1}</div>
                <Button
                  size="sm"
                  color="light"
                  disabled={items.length === 1}
                  onClick={() => removeItem(idx)}
                >
                  <i className="bx bx-trash text-danger"></i>
                </Button>
              </div>
              <Row>
                <Col md={6} className="mb-2">
                  <Label className="small">
                    Asset <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="select"
                    value={it.assetId}
                    disabled={!centerId}
                    onChange={(e) => updateItem(idx, "assetId", e.target.value)}
                  >
                    <option value="">
                      {!centerId
                        ? "Select site first"
                        : assetsLoading
                          ? "Loading assets..."
                          : assets.length === 0
                            ? "No eligible assets at this site"
                            : "Select asset"}
                    </option>
                    {assets
                      .filter(
                        (a) =>
                          a._id === it.assetId ||
                          !items.some((o, i) => i !== idx && o.assetId === a._id),
                      )
                      .map((a) => (
                        <option key={a._id} value={a._id}>
                          {a.assetName} ({a.assetTag || a.serialNumber || "no tag"})
                        </option>
                      ))}
                  </Input>
                </Col>
                <Col md={3} className="mb-2">
                  <Label className="small">Serial Number</Label>
                  <Input
                    value={it.serialNumber}
                    onChange={(e) =>
                      updateItem(idx, "serialNumber", e.target.value)
                    }
                  />
                </Col>
                <Col md={3} className="mb-2">
                  <Label className="small">Priority</Label>
                  <Input
                    type="select"
                    value={it.priority}
                    onChange={(e) =>
                      updateItem(idx, "priority", e.target.value)
                    }
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p[0].toUpperCase() + p.slice(1)}
                      </option>
                    ))}
                  </Input>
                </Col>
              </Row>
              <Label className="small">Remarks</Label>
              <Input
                value={it.remarks}
                onChange={(e) => updateItem(idx, "remarks", e.target.value)}
              />
            </div>
          ))}
          <div className="mb-4">
            <Button color="light" size="sm" onClick={addItem}>
              <i className="bx bx-plus me-1"></i> Add Item
            </Button>
          </div>
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
              {submitting ? "Saving..." : "Create Request"}
            </Button>
          </div>
        </ModalBody>
      </Modal>

      <Modal
        isOpen={!!rejectTarget}
        toggle={() => !rejecting && closeReject()}
        centered
      >
        <ModalBody className="p-4">
          <h5 className="mb-3">Reject Request</h5>
          <Label>Reason</Label>
          <Input
            type="textarea"
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button color="light" onClick={closeReject} disabled={rejecting}>
              Cancel
            </Button>
            <Button color="danger" onClick={confirmReject} disabled={rejecting}>
              {rejecting ? "Rejecting..." : "Reject"}
            </Button>
          </div>
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
              <h5 className="mb-1">{detailModal.title}</h5>
              <p className="text-muted small mb-2 text-capitalize">
                {detailModal.requestNumber} · {detailModal.maintenanceType} ·{" "}
                {detailModal.centerId?.title || "—"} · {dateFmt(detailModal.createdAt)}
              </p>
              <div className="mb-3">
                <StatusPill status={detailModal.status} />
              </div>
              {detailModal.description && (
                <div className="mb-3" style={{ overflowWrap: "anywhere" }}>
                  <span className="text-muted small">Description: </span>
                  {detailModal.description}
                </div>
              )}
              {detailModal.status === "rejected" && (
                <div className="mb-3" style={{ overflowWrap: "anywhere" }}>
                  <span className="text-muted small">Rejection reason: </span>
                  {detailModal.rejectionReason || "—"}
                </div>
              )}
              <div style={{ overflowX: "auto" }}>
                <table className="table mb-0">
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Serial No.</th>
                      <th>Priority</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detailModal.items || []).map((it, idx) => (
                      <tr key={it._id || idx}>
                        <td>
                          {it.assetId?.assetName || "—"}
                          {it.assetId?.assetTag ? ` (${it.assetId.assetTag})` : ""}
                        </td>
                        <td className="small">{it.serialNumber || "—"}</td>
                        <td className="small text-capitalize">{it.priority || "—"}</td>
                        <td className="small" style={{ overflowWrap: "anywhere" }}>
                          {it.remarks || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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

export default MaintenanceRequest;
