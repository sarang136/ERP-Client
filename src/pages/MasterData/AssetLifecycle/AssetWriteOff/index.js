import React, { useState, useEffect, useRef } from "react";
import DataTable from "react-data-table-component";
import { Button, Input, Modal, ModalBody, Label, Row, Col } from "reactstrap";
import { toast } from "react-toastify";
import {
  getAssetWriteOffRequests,
  createAssetWriteOffRequest,
  approveAssetWriteOffRequest,
  rejectAssetWriteOffRequest,
  getFixedAssets,
} from "../../../../helpers/backend_helper";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { useReferenceList } from "../../../../Components/Hooks/useReferenceData";
import { usePermissions } from "../../../../Components/Hooks/useRoles.js";
import { errText } from "../shared/assetUi";
import useConfirm from "../shared/useConfirm";
import "../../UnitOfMeasurement/uom.scss";

const dateFmt = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "—");
const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const NO_SITE = "none";

const emptyItem = () => ({
  assetId: "",
  disposalType: "write_off",
  reason: "",
  estValue: 0,
  buyerName: "",
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

const AssetWriteOffRequest = () => {
  const handleAuthError = useAuthError();
  const [confirm, confirmDialog] = useConfirm();
  const token = JSON.parse(localStorage.getItem("micrologin"))?.token;
  const { hasPermission } = usePermissions(token);
  const canCreate = hasPermission("MASTERDATA", "ASSET_WRITEOFF", "WRITE");
  const canApprove = hasPermission("MASTERDATA", "ASSET_WRITEOFF", "WRITE");

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const { items: centers } = useReferenceList("centers");
  const [assets, setAssets] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [centerId, setCenterId] = useState("");
  const [items, setItems] = useState([emptyItem()]);
  const [submitting, setSubmitting] = useState(false);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const assetReq = useRef(0);
  const [busyId, setBusyId] = useState(null);
  const [rejecting, setRejecting] = useState(false);
  const [detailModal, setDetailModal] = useState(null);

  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAssetWriteOffRequests({})
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
    setTitle("");
    setDescription("");
    setCenterId("");
    setItems([emptyItem()]);
    setAssets([]);
    setModalOpen(true);
  };

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
        // An asset with an employee, or already on a pending request, cannot be picked
        setAssets(
          (res?.data || []).filter(
            (a) =>
              a.status !== "written_off" &&
              !a.assignedTo &&
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

  const updateItem = (idx, field, value) => {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)),
    );
  };
  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (idx) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  const totalEstValue = items.reduce(
    (sum, it) => sum + (Number(it.estValue) || 0),
    0,
  );

  const handleSubmit = async () => {
    if (!centerId || !title.trim())
      return toast.error("Fill in Site and Title");
    const invalid = items.find((it) => !it.assetId || !it.reason.trim());
    if (invalid)
      return toast.error("Select an asset and enter a reason for every item");
    const invalidSale = items.find(
      (it) => it.disposalType === "sale" && !it.buyerName.trim(),
    );
    if (invalidSale)
      return toast.error("Enter Buyer Name for items marked as Sale");

    if (items.some((it) => Number(it.estValue) < 0))
      return toast.error("Est. Value cannot be negative");

    setSubmitting(true);
    try {
      await createAssetWriteOffRequest({
        title,
        description,
        centerId: centerId === NO_SITE ? undefined : centerId,
        items: items.map((it) => ({
          assetId: it.assetId,
          disposalType: it.disposalType,
          reason: it.reason,
          estValue: Number(it.estValue) || 0,
          buyerName: it.disposalType === "sale" ? it.buyerName : undefined,
        })),
      });
      toast.success("Write-off request created successfully");
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
    const ok = await confirm({
      title: "Approve write-off",
      message: "The assets in this request will be written off or sold. This cannot be undone.",
      confirmText: "Approve",
      danger: true,
    });
    if (!ok) return;
    setBusyId(id);
    try {
      const res = await approveAssetWriteOffRequest(id);
      toast.success(res?.message || "Request approved");
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
      await rejectAssetWriteOffRequest(rejectTarget._id, {
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
      name: "Scrap ID",
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
      name: "Site",
      cell: (row) => (
        <span className="uom-cell-muted">{row.centerId?.title || "—"}</span>
      ),
    },
    {
      name: "Items",
      width: "80px",
      cell: (row) => (
        <span className="uom-cell-muted">{row.items?.length || 0}</span>
      ),
    },
    {
      name: "Est. Value",
      cell: (row) => (
        <span className="uom-cell-primary">
          {money(row.items?.reduce((s, it) => s + (it.estValue || 0), 0))}
        </span>
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
          <h4>Asset Write-off / Scrap Requests</h4>
          <p>
            Submit a request to write off, scrap, or sell capitalized assets
          </p>
        </div>
      </div>

      <div className="d-flex justify-content-end mb-3">
        {canCreate && (
          <Button color="primary" onClick={openModal}>
            <i className="bx bx-plus me-1"></i> Create Write-off Request
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
            <div className="uom-empty-state">No write-off requests yet</div>
          }
        />
      </div>

      {confirmDialog}
      <Modal
        isOpen={modalOpen}
        toggle={() => !submitting && setModalOpen(false)}
        centered
        size="lg"
      >
        <ModalBody className="p-4">
          <h5 className="mb-1">Create Write-off Request</h5>
          <p className="text-muted small mb-3">
            Submit a request to write off or scrap a capitalized asset
          </p>

          <h6 className="fw-semibold mb-3">Basic Details</h6>
          <Row>
            <Col md={6} className="mb-3">
              <Label>
                Scrap Title <span className="text-danger">*</span>
              </Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </Col>
            <Col md={6} className="mb-3">
              <Label>
                Source Site <span className="text-danger">*</span>
              </Label>
              <Input
                type="select"
                value={centerId}
                onChange={(e) => handleCenterChange(e.target.value)}
              >
                <option value="">Select source site</option>
                <option value={NO_SITE}>No site assigned</option>
                {centers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </Input>
            </Col>
          </Row>

          <Label>Scrap Description</Label>
          <Input
            type="textarea"
            rows={2}
            className="mb-4"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe why these assets are being written off..."
          />

          <h6 className="fw-semibold mb-3">Write-off Items</h6>
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
                    Item <span className="text-danger">*</span>
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
                  {" "}
                  <Label className="small">
                    Disposal Type <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="select"
                    value={it.disposalType}
                    onChange={(e) =>
                      updateItem(idx, "disposalType", e.target.value)
                    }
                  >
                    <option value="write_off">Write-off / Scrap</option>
                    <option value="sale">Sale</option>
                  </Input>
                </Col>
                <Col md={3} className="mb-2">
                  <Label className="small">Est. Value</Label>
                  <Input
                    type="number"
                    min={0}
                    value={it.estValue}
                    onChange={(e) =>
                      updateItem(idx, "estValue", e.target.value)
                    }
                  />
                </Col>
              </Row>
              <Row>
                <Col md={it.disposalType === "sale" ? 6 : 12} className="mb-2">
                  <Label className="small">
                    Write-off Reason <span className="text-danger">*</span>
                  </Label>
                  <Input
                    value={it.reason}
                    onChange={(e) => updateItem(idx, "reason", e.target.value)}
                  />
                </Col>
                {it.disposalType === "sale" && (
                  <Col md={6} className="mb-2">
                    <Label className="small">
                      Buyer Name <span className="text-danger">*</span>
                    </Label>
                    <Input
                      value={it.buyerName}
                      onChange={(e) =>
                        updateItem(idx, "buyerName", e.target.value)
                      }
                    />
                  </Col>
                )}
              </Row>
            </div>
          ))}

          <div className="mb-3">
            <Button color="light" size="sm" onClick={addItem}>
              <i className="bx bx-plus me-1"></i> Add another item
            </Button>
          </div>

          <div
            className="uom-table-card p-3 mb-4"
            style={{ maxWidth: 320, marginLeft: "auto" }}
          >
            <div className="d-flex justify-content-between">
              <span className="text-muted small">Total estimated value</span>
              <span className="fw-bold">{money(totalEstValue)}</span>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <Button
              color="light"
              onClick={() => setModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button color="danger" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Saving..." : "Submit Request"}
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
              <p className="text-muted small mb-2">
                {detailModal.requestNumber} · {detailModal.centerId?.title || "—"} ·{" "}
                {dateFmt(detailModal.createdAt)}
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
                      <th>Type</th>
                      <th>Reason</th>
                      <th>Buyer</th>
                      <th>Est. Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detailModal.items || []).map((it, idx) => (
                      <tr key={it._id || idx}>
                        <td>
                          {it.assetId?.assetName || "—"}
                          {it.assetId?.assetTag ? ` (${it.assetId.assetTag})` : ""}
                        </td>
                        <td className="small">
                          {it.disposalType === "sale" ? "Sale" : "Write-off / Scrap"}
                        </td>
                        <td className="small" style={{ overflowWrap: "anywhere" }}>
                          {it.reason || "—"}
                        </td>
                        <td className="small">{it.buyerName || "—"}</td>
                        <td className="small">{money(it.estValue)}</td>
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

export default AssetWriteOffRequest;
