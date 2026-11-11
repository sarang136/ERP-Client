import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { Button, Input, Modal, ModalBody, Label, Row, Col } from "reactstrap";
import { toast } from "react-toastify";
import {
  getInventoryTransfers,
  createInventoryTransfer,
  dispatchInventoryTransfer,
  acknowledgeInventoryTransfer,
  resolveInventoryTransferDifference,
  cancelInventoryTransfer,
  getStorageLocations,
  getLocationStock,
} from "../../../../helpers/backend_helper";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { useReferenceList } from "../../../../Components/Hooks/useReferenceData";
import { usePermissions } from "../../../../Components/Hooks/useRoles.js";
import "../../UnitOfMeasurement/uom.scss";

const dateFmt = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "—");
const dateTimeFmt = (d) => (d ? new Date(d).toLocaleString("en-IN") : "—");

const newRequestId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const TRANSFER_STATUS_META = {
  created: { label: "Created", bg: "#fffaeb", color: "#b54708" },
  in_transit: { label: "In transit", bg: "#eff8ff", color: "#175cd3" },
  received: { label: "Received", bg: "#ecfdf3", color: "#067647" },
  received_with_difference: { label: "Received with difference", bg: "#fef3f2", color: "#b42318" },
  cancelled: { label: "Cancelled", bg: "#f2f4f7", color: "#475467" },
  completed: { label: "Completed", bg: "#ecfdf3", color: "#067647" },
};

const TransferStatusPill = ({ status }) => {
  const s = TRANSFER_STATUS_META[status] || TRANSFER_STATUS_META.completed;
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {s.label}
    </span>
  );
};

const openDiff = (li) => (li.dispatchedQty || 0) - (li.receivedQty || 0) - (li.resolvedQty || 0);

const InventoryTransfer = () => {
  const handleAuthError = useAuthError();
  const token = JSON.parse(localStorage.getItem("micrologin"))?.token;
  const { hasPermission } = usePermissions(token);
  const canCreate = hasPermission("MASTERDATA", "INVENTORY_TRANSFER", "WRITE");

  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const { items: centers } = useReferenceList("centers");

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [fromCenterId, setFromCenterId] = useState("");
  const [fromLocationId, setFromLocationId] = useState("");
  const [fromLocations, setFromLocations] = useState([]);
  const [toCenterId, setToCenterId] = useState("");
  const [expectedDispatch, setExpectedDispatch] = useState("");
  const [remarks, setRemarks] = useState("");
  const [lines, setLines] = useState([{ itemName: "", quantity: 1 }]);
  const [availableStock, setAvailableStock] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  // "two_step" = Created -> In transit -> Received. "instant" = the old behaviour, stock moves on save.
  const [flow, setFlow] = useState("two_step");
  const [requestId, setRequestId] = useState("");

  // Dispatch / receive / cancel / resolve
  const [busyId, setBusyId] = useState("");
  const [detail, setDetail] = useState(null);
  const [receiveFor, setReceiveFor] = useState(null);
  const [receiveLines, setReceiveLines] = useState([]);
  const [receiveReason, setReceiveReason] = useState("");
  const [resolveFor, setResolveFor] = useState(null);
  const [resolveItem, setResolveItem] = useState("");
  const [resolveQty, setResolveQty] = useState("");
  const [resolveAction, setResolveAction] = useState("return_to_source");
  const [resolveReason, setResolveReason] = useState("");
  const [cancelFor, setCancelFor] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getInventoryTransfers()
      .then((res) => {
        if (!cancelled) setTransfers(res?.data || []);
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
    setTitle("");
    setFromCenterId("");
    setFromLocationId("");
    setFromLocations([]);
    setToCenterId("");
    setExpectedDispatch("");
    setRemarks("");
    setLines([{ itemName: "", quantity: 1 }]);
    setAvailableStock([]);
    setFlow("two_step");
    setRequestId(newRequestId());
    setModalOpen(true);
  };

  const handleFromCenterChange = (centerId) => {
    setFromCenterId(centerId);
    setFromLocationId("");
    setLines([{ itemName: "", quantity: 1 }]);
    setAvailableStock([]);
    if (!centerId) {
      setFromLocations([]);
      return;
    }
    getStorageLocations({ centerId, status: "active" })
      .then((res) => setFromLocations(res?.data || []))
      .catch(() => {});
  };

  const handleFromLocationChange = (locationId) => {
    setFromLocationId(locationId);
    setLines([{ itemName: "", quantity: 1 }]);
    if (!locationId) {
      setAvailableStock([]);
      return;
    }
    getLocationStock()
      .then((res) => {
        const atThisLocation = (res?.data || []).filter(
          (r) => r.location?._id === locationId,
        );
        setAvailableStock(
          atThisLocation.map((r) => ({
            _id: r.location._id + r.itemName,
            itemName: r.itemName,
            quantity: r.quantity,
          })),
        );
      })
      .catch(() => setAvailableStock([]));
  };

  const updateLine = (idx, field, value) => {
    setLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)),
    );
  };
  const addLine = () =>
    setLines((prev) => [...prev, { itemName: "", quantity: 1 }]);
  const removeLine = (idx) =>
    setLines((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!fromCenterId || !toCenterId || !fromLocationId)
      return toast.error("Select both centers and source location");
    if (fromCenterId === toCenterId)
      return toast.error("From and To center must differ");
    if (lines.some((l) => !l.itemName.trim() || Number(l.quantity) <= 0)) {
      return toast.error("Fill in all line items with valid quantity");
    }

    setSubmitting(true);
    try {
      await createInventoryTransfer({
        title,
        fromCenterId,
        fromLocationId: fromLocationId || undefined,
        toCenterId,
        expectedDispatch: expectedDispatch || undefined,
        remarks,
        flow,
        requestId,
        lineItems: lines.map((l) => ({
          itemName: l.itemName,
          quantity: Number(l.quantity),
        })),
      });
      toast.success(
        flow === "two_step"
          ? "Transfer created. Dispatch it to move the stock"
          : "Inventory transfer completed successfully",
      );
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

  const showError = (error, fallback) => {
    if (!handleAuthError(error)) {
      toast.error(error?.response?.data?.message || error?.message || fallback);
    }
  };

  const handleDispatch = async (row) => {
    if (busyId) return;
    setBusyId(row._id);
    try {
      await dispatchInventoryTransfer(row._id);
      toast.success("Transfer dispatched. The stock is now in transit");
      setRefreshFlag((f) => f + 1);
    } catch (error) {
      showError(error, "Couldn't dispatch the transfer");
      setRefreshFlag((f) => f + 1);
    } finally {
      setBusyId("");
    }
  };

  const openReceive = (row) => {
    setReceiveFor(row);
    setReceiveLines(
      (row.lineItems || []).map((li) => ({
        itemName: li.itemName,
        dispatchedQty: li.dispatchedQty,
        receivedQty: li.dispatchedQty,
      })),
    );
    setReceiveReason("");
  };

  const confirmReceive = async () => {
    if (!receiveFor || busyId) return;
    const bad = receiveLines.find(
      (l) => l.receivedQty === "" || Number(l.receivedQty) < 0 || Number(l.receivedQty) > l.dispatchedQty,
    );
    if (bad) return toast.error(`Received qty for "${bad.itemName}" must be between 0 and ${bad.dispatchedQty}`);
    const short = receiveLines.some((l) => Number(l.receivedQty) < l.dispatchedQty);
    if (short && !receiveReason.trim()) return toast.error("Give a reason for the shortfall");
    setBusyId(receiveFor._id);
    try {
      await acknowledgeInventoryTransfer(receiveFor._id, {
        reason: receiveReason.trim(),
        lines: receiveLines.map((l) => ({ itemName: l.itemName, receivedQty: Number(l.receivedQty) })),
      });
      toast.success(short ? "Received with a difference. Resolve it to close the exception" : "Transfer received");
      setReceiveFor(null);
      setRefreshFlag((f) => f + 1);
    } catch (error) {
      showError(error, "Couldn't receive the transfer");
      setRefreshFlag((f) => f + 1);
    } finally {
      setBusyId("");
    }
  };

  const openResolve = (row) => {
    const first = (row.lineItems || []).find((li) => openDiff(li) > 0);
    setResolveFor(row);
    setResolveItem(first?.itemName || "");
    setResolveQty(first ? String(openDiff(first)) : "");
    setResolveAction("return_to_source");
    setResolveReason("");
  };

  const confirmResolve = async () => {
    if (!resolveFor || busyId) return;
    const line = (resolveFor.lineItems || []).find((li) => li.itemName === resolveItem);
    const open = line ? openDiff(line) : 0;
    if (!line || Number(resolveQty) <= 0 || Number(resolveQty) > open) {
      return toast.error(`Enter a quantity between 1 and ${open}`);
    }
    if (!resolveReason.trim()) return toast.error("A reason is required");
    setBusyId(resolveFor._id);
    try {
      await resolveInventoryTransferDifference(resolveFor._id, {
        itemName: resolveItem,
        quantity: Number(resolveQty),
        action: resolveAction,
        reason: resolveReason.trim(),
      });
      toast.success("Difference resolved");
      setResolveFor(null);
      setRefreshFlag((f) => f + 1);
    } catch (error) {
      showError(error, "Couldn't resolve the difference");
      setRefreshFlag((f) => f + 1);
    } finally {
      setBusyId("");
    }
  };

  const confirmCancel = async () => {
    if (!cancelFor || busyId) return;
    setBusyId(cancelFor._id);
    try {
      await cancelInventoryTransfer(cancelFor._id, { reason: cancelReason.trim() });
      toast.success("Transfer cancelled");
      setCancelFor(null);
      setRefreshFlag((f) => f + 1);
    } catch (error) {
      showError(error, "Couldn't cancel the transfer");
      setRefreshFlag((f) => f + 1);
    } finally {
      setBusyId("");
    }
  };

  const columns = [
    {
      name: "Transfer #",
      selector: (row) => row.transferNumber,
      sortable: true,
      width: "160px",
    },
    {
      name: "From",
      cell: (row) => (
        <span className="uom-cell-muted">{row.fromCenterId?.title || "—"}</span>
      ),
    },
    {
      name: "To",
      cell: (row) => (
        <span className="uom-cell-muted">{row.toCenterId?.title || "—"}</span>
      ),
    },
    {
      name: "Items",
      width: "90px",
      cell: (row) => (
        <span className="uom-cell-muted">{row.lineItems?.length || 0}</span>
      ),
    },
    {
      name: "Status",
      width: "200px",
      cell: (row) => (
        <div>
          <TransferStatusPill status={row.status} />
          {row.flow === "two_step" && (
            <div className="text-muted" style={{ fontSize: 11 }}>
              Two-step
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
      width: "300px",
      right: true,
      cell: (row) => (
        <div className="d-flex gap-2 flex-wrap justify-content-end py-1">
          <Button size="sm" color="light" title="View" onClick={() => setDetail(row)}>
            <i className="bx bx-show"></i>
          </Button>
          {canCreate && row.status === "created" && (
            <>
              <Button size="sm" color="primary" disabled={!!busyId} onClick={() => handleDispatch(row)}>
                {busyId === row._id ? "Dispatching..." : "Dispatch"}
              </Button>
              <Button
                size="sm"
                color="danger"
                outline
                disabled={!!busyId}
                onClick={() => {
                  setCancelFor(row);
                  setCancelReason("");
                }}
              >
                Cancel
              </Button>
            </>
          )}
          {canCreate && row.status === "in_transit" && (
            <Button size="sm" color="success" disabled={!!busyId} onClick={() => openReceive(row)}>
              Receive
            </Button>
          )}
          {canCreate && row.status === "received_with_difference" && (
            <Button size="sm" color="warning" disabled={!!busyId} onClick={() => openResolve(row)}>
              Resolve difference
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
          <h4>Inventory Transfer</h4>
          <p>Move stock between warehouses / branches</p>
        </div>
      </div>

      <div className="d-flex justify-content-end mb-3">
        {canCreate && (
          <Button color="primary" onClick={openModal}>
            <i className="bx bx-plus me-1"></i> New Transfer
          </Button>
        )}
      </div>

      <div className="uom-table-card">
        <DataTable
          columns={columns}
          data={transfers}
          progressPending={loading}
          pagination
          highlightOnHover
          noDataComponent={
            <div className="uom-empty-state">No transfers yet</div>
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
          <h5 className="mb-3">New Inventory Transfer</h5>
          <div className="mb-3">
            <Label className="d-block">How should the stock move?</Label>
            <div className="d-flex gap-2 flex-wrap">
              {[
                {
                  key: "two_step",
                  title: "Two-step (recommended)",
                  sub: "Create, then Dispatch from the source site, then the destination Receives. Stock is in transit in between.",
                },
                {
                  key: "instant",
                  title: "Instant",
                  sub: "Stock moves from the source to the destination as soon as you save.",
                },
              ].map((o) => (
                <div
                  key={o.key}
                  onClick={() => setFlow(o.key)}
                  style={{
                    flex: "1 1 260px",
                    cursor: "pointer",
                    border: `1px solid ${flow === o.key ? "#2563eb" : "#e4e7ec"}`,
                    background: flow === o.key ? "#f5f9ff" : "#fff",
                    borderRadius: 8,
                    padding: 10,
                  }}
                >
                  <input type="radio" readOnly checked={flow === o.key} className="me-2" />
                  <span className="fw-semibold small">{o.title}</span>
                  <div className="text-muted" style={{ fontSize: 11.5 }}>
                    {o.sub}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Label>Transfer Title</Label>
          <Input
            className="mb-3"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Row>
            <Col md={6} className="mb-3">
              <Label>
                Source Site <span className="text-danger">*</span>
              </Label>
              <Input
                type="select"
                value={fromCenterId}
                onChange={(e) => handleFromCenterChange(e.target.value)}
              >
                <option value="">Select center</option>
                {centers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </Input>
            </Col>
            <Col md={6} className="mb-3">
              <Label>
                Destination Site <span className="text-danger">*</span>
              </Label>
              <Input
                type="select"
                value={toCenterId}
                onChange={(e) => setToCenterId(e.target.value)}
              >
                <option value="">Select center</option>
                {centers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </Input>
            </Col>
          </Row>
          <Label>
            Source Storage Location <span className="text-danger">*</span>
          </Label>
          <Input
            type="select"
            className="mb-3"
            value={fromLocationId}
            disabled={!fromCenterId}
            onChange={(e) => handleFromLocationChange(e.target.value)}
          >
            <option value="">
              {!fromCenterId ? "Select source site first" : "Select location"}
            </option>
            {fromLocations.map((l) => (
              <option key={l._id} value={l._id}>
                {l.name} ({l.code})
              </option>
            ))}
          </Input>
          <Label className="small">
            Item <span className="text-danger">*</span>
          </Label>
          {!fromLocationId && (
            <div className="text-muted small mb-2">
              Please select a source location first
            </div>
          )}
          {lines.map((l, idx) => {
            const stockRow = availableStock.find(
              (s) => s.itemName === l.itemName,
            );
            const availableQty = stockRow?.quantity ?? 0;
            return (
              <Row key={idx} className="mb-2">
                <Col md={5}>
                  <Input
                    type="select"
                    value={l.itemName}
                    disabled={!fromLocationId}
                    onChange={(e) =>
                      updateLine(idx, "itemName", e.target.value)
                    }
                  >
                    <option value="">Select item</option>
                    {availableStock.map((s) => (
                      <option key={s._id} value={s.itemName}>
                        {s.itemName} (Available: {s.quantity})
                      </option>
                    ))}
                  </Input>
                </Col>
                <Col md={2}>
                  <Input value={l.itemName ? availableQty : "N/A"} disabled />
                </Col>
                <Col md={3}>
                  <Input
                    type="number"
                    min={1}
                    max={availableQty || undefined}
                    placeholder="Qty to transfer"
                    value={l.quantity}
                    onChange={(e) =>
                      updateLine(idx, "quantity", e.target.value)
                    }
                  />
                </Col>
                <Col md={2}>
                  <Button
                    color="light"
                    disabled={lines.length === 1}
                    onClick={() => removeLine(idx)}
                  >
                    <i className="bx bx-trash text-danger"></i>
                  </Button>
                </Col>
              </Row>
            );
          })}
          <div className="mb-3">
            <Button color="light" size="sm" onClick={addLine}>
              <i className="bx bx-plus me-1"></i> Add line
            </Button>
          </div>
          <Label>Expected Dispatch</Label>
          <Input
            type="date"
            className="mb-3"
            value={expectedDispatch}
            onChange={(e) => setExpectedDispatch(e.target.value)}
          />
          <Label>Remarks</Label>
          <Input
            type="textarea"
            rows={2}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
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
              {submitting ? "Saving..." : flow === "two_step" ? "Create transfer" : "Transfer"}
            </Button>
          </div>
        </ModalBody>
      </Modal>

      {/* Details */}
      <Modal isOpen={!!detail} toggle={() => setDetail(null)} centered size="lg">
        <ModalBody className="p-4">
          {detail && (
            <>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <h5 className="mb-1">{detail.transferNumber}</h5>
                  <div className="text-muted small">
                    {detail.fromCenterId?.title || "—"} → {detail.toCenterId?.title || "—"}
                    {detail.fromLocationId?.name ? ` · from ${detail.fromLocationId.name}` : ""}
                  </div>
                </div>
                <TransferStatusPill status={detail.status} />
              </div>
              <table className="table table-sm mt-3">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="text-end">Ordered</th>
                    {detail.flow === "two_step" && (
                      <>
                        <th className="text-end">Dispatched</th>
                        <th className="text-end">Received</th>
                        <th className="text-end">Open difference</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {(detail.lineItems || []).map((li) => (
                    <tr key={li.itemName}>
                      <td>{li.itemName}</td>
                      <td className="text-end">{li.quantity}</td>
                      {detail.flow === "two_step" && (
                        <>
                          <td className="text-end">{li.dispatchedQty || "—"}</td>
                          <td className="text-end">{detail.status === "created" || detail.status === "in_transit" || detail.status === "cancelled" ? "—" : li.receivedQty}</td>
                          <td className="text-end">
                            {detail.status === "received_with_difference" || openDiff(li) > 0 ? (
                              <span className={openDiff(li) > 0 ? "text-danger fw-semibold" : ""}>{Math.max(openDiff(li), 0)}</span>
                            ) : (
                              "—"
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="small text-muted">
                <div>Created by {detail.createdBy?.name || "-"} on {dateTimeFmt(detail.createdAt)}</div>
                {detail.dispatchedAt && <div>Dispatched by {detail.dispatchedBy?.name || "-"} on {dateTimeFmt(detail.dispatchedAt)}</div>}
                {detail.receivedAt && <div>Received by {detail.receivedBy?.name || "-"} on {dateTimeFmt(detail.receivedAt)}</div>}
                {detail.differenceReason && <div>Shortfall reason: {detail.differenceReason}</div>}
                {detail.status === "cancelled" && (
                  <div>Cancelled on {dateTimeFmt(detail.cancelledAt)}{detail.cancelReason ? `: ${detail.cancelReason}` : ""}</div>
                )}
              </div>
              {(detail.resolutions || []).length > 0 && (
                <div className="mt-3">
                  <div className="fw-semibold small mb-1">Difference resolutions</div>
                  {detail.resolutions.map((r) => (
                    <div key={r._id} className="small text-muted">
                      {r.quantity} x {r.itemName} —{" "}
                      {r.action === "return_to_source" ? "returned to source" : "written off"} by {r.resolvedBy?.name || "-"} ({r.reason})
                    </div>
                  ))}
                </div>
              )}
              <div className="d-flex justify-content-end mt-3">
                <Button color="light" onClick={() => setDetail(null)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </ModalBody>
      </Modal>

      {/* Receive */}
      <Modal isOpen={!!receiveFor} toggle={() => !busyId && setReceiveFor(null)} centered size="lg">
        <ModalBody className="p-4">
          {receiveFor && (
            <>
              <h5 className="mb-1">Receive {receiveFor.transferNumber}</h5>
              <p className="text-muted small mb-3">
                From {receiveFor.fromCenterId?.title || "—"} to {receiveFor.toCenterId?.title || "—"}. Enter what actually arrived. If less than was dispatched, the
                difference stays open until it is resolved.
              </p>
              {receiveLines.map((l, idx) => (
                <Row key={l.itemName} className="mb-2 align-items-center">
                  <Col md={6}>
                    <div className="fw-semibold">{l.itemName}</div>
                    <div className="text-muted small">Dispatched: {l.dispatchedQty}</div>
                  </Col>
                  <Col md={6}>
                    <Input
                      type="number"
                      min={0}
                      max={l.dispatchedQty}
                      value={l.receivedQty}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) =>
                        setReceiveLines((prev) => prev.map((x, i) => (i === idx ? { ...x, receivedQty: e.target.value } : x)))
                      }
                    />
                  </Col>
                </Row>
              ))}
              {receiveLines.some((l) => Number(l.receivedQty) < l.dispatchedQty) && (
                <div className="mt-3">
                  <Label>
                    Reason for the shortfall <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="textarea"
                    rows={2}
                    value={receiveReason}
                    onChange={(e) => setReceiveReason(e.target.value)}
                    placeholder="e.g. 1 unit damaged in transit"
                  />
                </div>
              )}
              <div className="d-flex justify-content-end gap-2 mt-4">
                <Button color="light" onClick={() => setReceiveFor(null)} disabled={!!busyId}>
                  Cancel
                </Button>
                <Button color="success" onClick={confirmReceive} disabled={!!busyId}>
                  {busyId ? "Saving..." : "Confirm receipt"}
                </Button>
              </div>
            </>
          )}
        </ModalBody>
      </Modal>

      {/* Resolve a difference */}
      <Modal isOpen={!!resolveFor} toggle={() => !busyId && setResolveFor(null)} centered>
        <ModalBody className="p-4">
          {resolveFor && (
            <>
              <h5 className="mb-1">Resolve difference</h5>
              <p className="text-muted small mb-3">{resolveFor.transferNumber}. Nothing is dropped: return it to the source site, or write it off with a reason.</p>
              <Label>Item</Label>
              <Input
                type="select"
                className="mb-3"
                value={resolveItem}
                onChange={(e) => {
                  setResolveItem(e.target.value);
                  const line = resolveFor.lineItems.find((li) => li.itemName === e.target.value);
                  setResolveQty(line ? String(openDiff(line)) : "");
                }}
              >
                {resolveFor.lineItems
                  .filter((li) => openDiff(li) > 0)
                  .map((li) => (
                    <option key={li.itemName} value={li.itemName}>
                      {li.itemName} (open: {openDiff(li)})
                    </option>
                  ))}
              </Input>
              <Label>Quantity</Label>
              <Input type="number" min={1} className="mb-3" value={resolveQty} onChange={(e) => setResolveQty(e.target.value)} />
              <Label>What happens to it?</Label>
              <div className="mb-3">
                <div>
                  <input
                    type="radio"
                    className="me-2"
                    checked={resolveAction === "return_to_source"}
                    onChange={() => setResolveAction("return_to_source")}
                  />
                  Return to source ({resolveFor.fromCenterId?.title || "source site"}): adds it back to stock there
                </div>
                <div>
                  <input type="radio" className="me-2" checked={resolveAction === "write_off"} onChange={() => setResolveAction("write_off")} />
                  Write off: records the loss with a Stock Adjustment entry
                </div>
              </div>
              <Label>
                Reason <span className="text-danger">*</span>
              </Label>
              <Input type="textarea" rows={2} value={resolveReason} onChange={(e) => setResolveReason(e.target.value)} />
              <div className="d-flex justify-content-end gap-2 mt-4">
                <Button color="light" onClick={() => setResolveFor(null)} disabled={!!busyId}>
                  Cancel
                </Button>
                <Button color="primary" onClick={confirmResolve} disabled={!!busyId}>
                  {busyId ? "Saving..." : "Resolve"}
                </Button>
              </div>
            </>
          )}
        </ModalBody>
      </Modal>

      {/* Cancel (only while Created) */}
      <Modal isOpen={!!cancelFor} toggle={() => !busyId && setCancelFor(null)} centered>
        <ModalBody className="p-4">
          <h5 className="mb-1">Cancel {cancelFor?.transferNumber}?</h5>
          <p className="text-muted small mb-3">No stock has moved, so nothing needs to be returned. Once dispatched a transfer can no longer be cancelled.</p>
          <Label>Reason (optional)</Label>
          <Input type="textarea" rows={2} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button color="light" onClick={() => setCancelFor(null)} disabled={!!busyId}>
              Keep it
            </Button>
            <Button color="danger" onClick={confirmCancel} disabled={!!busyId}>
              {busyId ? "Cancelling..." : "Cancel transfer"}
            </Button>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
};

export default InventoryTransfer;
