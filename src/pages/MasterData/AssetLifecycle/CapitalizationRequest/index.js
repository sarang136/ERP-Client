import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { Button, Input, Modal, ModalBody, Label, Row, Col } from "reactstrap";
import { toast } from "react-toastify";
import {
  getCapitalizationRequests,
  createCapitalizationRequest,
  approveCapitalizationRequest,
  rejectCapitalizationRequest,
  getGRNs,
} from "../../../../helpers/backend_helper";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { usePermissions } from "../../../../Components/Hooks/useRoles.js";
import { useReferenceList } from "../../../../Components/Hooks/useReferenceData";
import CategoryLevelSelect, { EMPTY_CATEGORY } from "../shared/CategoryLevelSelect";
import { errText } from "../shared/assetUi";
import "../../UnitOfMeasurement/uom.scss";

const dateFmt = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "—");
const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

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

const CapitalizationRequest = () => {
  const handleAuthError = useAuthError();
  const token = JSON.parse(localStorage.getItem("micrologin"))?.token;
  const { hasPermission } = usePermissions(token);
  const canCreate = hasPermission(
    "MASTERDATA",
    "CAPITALIZATION_REQUEST",
    "WRITE",
  );
  const canApprove = hasPermission(
    "MASTERDATA",
    "CAPITALIZATION_REQUEST",
    "WRITE",
  );

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [grns, setGrns] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [siteId, setSiteId] = useState("");
  const { items: centers } = useReferenceList("centers");

  const [modalOpen, setModalOpen] = useState(false);
  const [grnId, setGrnId] = useState("");
  const [grnItems, setGrnItems] = useState([]);
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState("");
  const [costFromPo, setCostFromPo] = useState(null);
  const [category, setCategory] = useState(EMPTY_CATEGORY);
  const [justification, setJustification] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    getGRNs({})
      .then((res) => setGrns(res?.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError("");
    getCapitalizationRequests({})
      .then((res) => {
        if (!cancelled) setRequests(res?.data || []);
      })
      .catch((error) => {
        if (cancelled) return;
        if (!handleAuthError(error)) setLoadError(errText(error, "Couldn't load requests."));
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
    setGrnId("");
    setGrnItems([]);
    setItemName("");
    setQuantity(1);
    setUnitCost("");
    setCategory(EMPTY_CATEGORY);
    setJustification("");
    setSiteId("");
    setModalOpen(true);
  };

  const selectedGrn = grns.find((g) => g._id === grnId);
  const grnSiteId =
    selectedGrn?.poId?.deliverySiteId?._id || selectedGrn?.poId?.deliverySiteId || "";
  const receivedMax = grnItems.find((li) => li.itemName === itemName)?.receivedQty;

  const handleGrnChange = (id) => {
    setGrnId(id);
    setItemName("");
    setQuantity(1);
    setUnitCost("");
    setCostFromPo(null);
    setSiteId("");
    const grn = grns.find((g) => g._id === id);
    setGrnItems(grn?.lineItems || []);
  };

  const handleItemChange = (name) => {
    setItemName(name);
    const line = grnItems.find((li) => li.itemName === name);
    if (line) setQuantity(line.receivedQty);
    // the rate comes from the same item on the PO (before tax); it can still be changed
    const poLine = (selectedGrn?.poId?.lineItems || []).find((li) => li.itemName === name);
    setUnitCost(poLine?.unitPrice > 0 ? String(poLine.unitPrice) : "");
    setCostFromPo(poLine?.unitPrice > 0 ? poLine : null);
  };

  const handleSubmit = async () => {
    if (!grnId) return toast.error("Select a GRN");
    if (!itemName.trim()) return toast.error("Select an item");
    if (!category.categoryL1) return toast.error("Choose the category");
    const qtyNum = Number(quantity);
    if (!Number.isInteger(qtyNum) || qtyNum < 1)
      return toast.error("Quantity must be a whole number, at least 1");
    if (receivedMax != null && qtyNum > receivedMax)
      return toast.error(`Quantity cannot be more than the received quantity (${receivedMax})`);
    if (!grnSiteId && !siteId) return toast.error("Select a site");
    if (!unitCost || Number(unitCost) <= 0)
      return toast.error("Enter a valid unit cost");
    if (!justification.trim() || justification.trim().length < 10) {
      return toast.error("Justification must be at least 10 characters");
    }

    setSubmitting(true);
    try {
      const res = await createCapitalizationRequest({
        grnId,
        itemName,
        quantity: Number(quantity),
        unitCost: Number(unitCost),
        categoryL1: category.categoryL1,
        justification,
        centerId: grnSiteId || siteId,
      });
      toast.success("Capitalization request created successfully");
      // e.g. the item could not be checked in the Item Master: the request is made, but the user is told
      (res?.warnings || []).forEach((w) => toast.warn(w, { autoClose: 9000 }));
      setModalOpen(false);
      setRefreshFlag((f) => f + 1);
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Something went wrong",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id) => {
    if (busyId) return;
    setBusyId(id);
    try {
      await approveCapitalizationRequest(id);
      toast.success("Request approved — ready to move into CWIP");
      setRefreshFlag((f) => f + 1);
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Couldn't approve.",
        );
      }
    } finally {
      setBusyId("");
    }
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) return toast.error("Provide a rejection reason");
    if (rejecting) return;
    setRejecting(true);
    try {
      await rejectCapitalizationRequest(rejectTarget._id, {
        rejectionReason: rejectReason,
      });
      toast.success("Request rejected");
      setRejectTarget(null);
      setRejectReason("");
      setRefreshFlag((f) => f + 1);
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Couldn't reject.",
        );
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
    { name: "Item", selector: (row) => row.itemName, wrap: true },
    { name: "Qty", width: "70px", selector: (row) => row.quantity },
    {
      name: "Total Cost",
      cell: (row) => (
        <span className="uom-cell-primary">{money(row.totalCost)}</span>
      ),
    },
    {
      name: "Site",
      cell: (row) => (
        <span className="uom-cell-muted">{row.centerId?.title || "—"}</span>
      ),
    },
    {
      name: "Status",
      width: "120px",
      cell: (row) => (
        <div>
          <StatusPill status={row.status} />
          {row.status === "rejected" && row.rejectionReason && (
            <div
              className="text-muted"
              style={{ fontSize: 11, marginTop: 2, wordBreak: "break-word" }}
              title={row.rejectionReason}
            >
              {row.rejectionReason}
            </div>
          )}
        </div>
      ),
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
      width: "180px",
      cell: (row) =>
        row.status === "pending" &&
        canApprove && (
          <div className="d-flex gap-2">
            <Button
              size="sm"
              color="success"
              disabled={busyId === row._id}
              onClick={() => handleApprove(row._id)}
            >
              Approve
            </Button>
            <Button
              size="sm"
              color="danger"
              outline
              disabled={busyId === row._id}
              onClick={() => {
                setRejectReason("");
                setRejectTarget(row);
              }}
            >
              Reject
            </Button>
          </div>
        ),
    },
  ];

  return (
    <div className="uom-page">
      <div className="uom-list-header">
        <div>
          <h4>Capitalization Requests</h4>
          <p>Decide whether a received item qualifies as a capital asset</p>
        </div>
      </div>

      <div className="d-flex justify-content-end mb-3">
        {canCreate && (
          <Button color="primary" onClick={openModal}>
            <i className="bx bx-plus me-1"></i> New Request
          </Button>
        )}
      </div>

      {loadError && (
        <div
          className="p-3 mb-3 d-flex align-items-center justify-content-between"
          style={{ background: "#fef3f2", border: "1px solid #fecdca", borderRadius: 10 }}
        >
          <span className="text-danger">{loadError}</span>
          <Button size="sm" color="light" onClick={() => setRefreshFlag((n) => n + 1)}>
            Try again
          </Button>
        </div>
      )}

      <div className="uom-table-card">
        <DataTable
          columns={columns}
          data={requests}
          progressPending={loading}
          pagination
          highlightOnHover
          noDataComponent={
            <div className="uom-empty-state">
              No capitalization requests yet
            </div>
          }
        />
      </div>

      <Modal
        isOpen={modalOpen}
        toggle={() => setModalOpen(false)}
        centered
        size="lg"
      >
        <ModalBody className="p-4">
          <h5 className="mb-3">New Capitalization Request</h5>

          <Label>
            GRN <span className="text-danger">*</span>
          </Label>
          <Input
            type="select"
            className="mb-3"
            value={grnId}
            onChange={(e) => handleGrnChange(e.target.value)}
          >
            <option value="">Select GRN</option>
            {grns.map((g) => (
              <option key={g._id} value={g._id}>
                {g.grnNumber} — {g.poId?.poNumber}
              </option>
            ))}
          </Input>

          <Row>
            <Col md={6} className="mb-3">
              <Label>
                Item Name <span className="text-danger">*</span>
              </Label>
              <Input
                type="select"
                value={itemName}
                disabled={!grnId}
                onChange={(e) => handleItemChange(e.target.value)}
              >
                <option value="">
                  {!grnId ? "Select GRN first" : "Select item"}
                </option>
                {grnItems.map((li) => (
                  <option key={li.itemName} value={li.itemName}>
                    {li.itemName} (Received: {li.receivedQty})
                  </option>
                ))}
              </Input>
            </Col>

          </Row>

          <CategoryLevelSelect
            value={category}
            onChange={setCategory}
            required
            md={6}
            levels={1}
            levelLabels={["Category (Level 1)"]}
          />

          {grnId && !grnSiteId && (
            <div className="mb-3">
              <Label>
                Site <span className="text-danger">*</span>
              </Label>
              <Input type="select" value={siteId} onChange={(e) => setSiteId(e.target.value)}>
                <option value="">Select site (this GRN has no delivery site)</option>
                {centers.map((c) => (
                  <option key={c._id} value={c._id}>{c.title}</option>
                ))}
              </Input>
            </div>
          )}

          <Row>
            <Col md={4} className="mb-3">
              <Label>Quantity</Label>
              <Input
                type="number"
                min={1}
                max={receivedMax || undefined}
                step={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </Col>
            <Col md={4} className="mb-3">
              <Label>
                Unit Cost <span className="text-danger">*</span>
              </Label>
              <Input
                type="number"
                min={0}
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
              />
              {costFromPo && (
                <div className="text-muted small mt-1">
                  Taken from the PO rate{costFromPo.taxPercent > 0 ? ` (before ${costFromPo.taxPercent}% tax)` : ""}. You can change it.
                </div>
              )}
            </Col>
            <Col md={4} className="mb-3">
              <Label>Total Cost</Label>
              <Input
                value={money(Number(quantity) * Number(unitCost || 0))}
                disabled
              />
            </Col>
          </Row>

          <Label>
            Justification (min 10 characters){" "}
            <span className="text-danger">*</span>
          </Label>
          <Input
            type="textarea"
            rows={3}
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="e.g. Cost exceeds ₹25,000 threshold and expected useful life is 5+ years"
          />

          <div className="d-flex justify-content-end gap-2 mt-4">
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
        toggle={() => setRejectTarget(null)}
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
            <Button color="light" onClick={() => setRejectTarget(null)}>
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

export default CapitalizationRequest;
