import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { Button, Input, Modal, ModalBody, Label, Row, Col } from "reactstrap";
import { toast } from "react-toastify";
import {
  getCycleCounts,
  createCycleCount,
  reconcileCycleCount,
  getStockBalances,
} from "../../../../helpers/backend_helper";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { useReferenceList } from "../../../../Components/Hooks/useReferenceData";
import { usePermissions } from "../../../../Components/Hooks/useRoles.js";
import "../../UnitOfMeasurement/uom.scss";

const dateFmt = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "—");

const StatusPill = ({ status }) => (
  <span
    className={`uom-status-pill ${status === "reconciled" ? "status-active" : "status-inactive"}`}
  >
    <span className="dot"></span>{" "}
    {status === "reconciled" ? "Reconciled" : "Draft"}
  </span>
);

const CycleCount = () => {
  const handleAuthError = useAuthError();
  const token = JSON.parse(localStorage.getItem("micrologin"))?.token;
  const { hasPermission } = usePermissions(token);
  const canCreate = hasPermission("MASTERDATA", "CYCLE_COUNT", "WRITE");
  const canReconcile = hasPermission("MASTERDATA", "CYCLE_COUNT", "WRITE");

  const [counts, setCounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const { items: centers } = useReferenceList("centers");

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [countMethod, setCountMethod] = useState("full");
  const [scheduledDate, setScheduledDate] = useState("");
  const [centerId, setCenterId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [lines, setLines] = useState([
    { itemName: "", systemQty: 0, countedQty: 0 },
  ]);
  const [stockOptions, setStockOptions] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [detailModal, setDetailModal] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getCycleCounts()
      .then((res) => {
        if (!cancelled) setCounts(res?.data || []);
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
    setCountMethod("full");
    setScheduledDate("");
    setCenterId("");
    setRemarks("");
    setLines([{ itemName: "", systemQty: 0, countedQty: 0 }]);
    setStockOptions([]);
    setModalOpen(true);
  };

  const handleCenterChange = (id) => {
    setCenterId(id);
    setLines([{ itemName: "", systemQty: 0, countedQty: 0 }]);
    if (!id) {
      setStockOptions([]);
      return;
    }
    getStockBalances({ centerId: id })
      .then((res) => setStockOptions(res?.data || []))
      .catch(() => setStockOptions([]));
  };

  const updateLine = (idx, field, value) => {
    setLines((prev) =>
      prev.map((l, i) => {
        if (i !== idx) return l;
        if (field === "itemName") {
          const stock = stockOptions.find((s) => s.itemName === value);
          return { ...l, itemName: value, systemQty: stock?.quantity || 0 };
        }
        return { ...l, [field]: value };
      }),
    );
  };
  const addLine = () =>
    setLines((prev) => [
      ...prev,
      { itemName: "", systemQty: 0, countedQty: 0 },
    ]);
  const removeLine = (idx) =>
    setLines((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!centerId) return toast.error("Select a center");
    if (lines.some((l) => !l.itemName.trim()))
      return toast.error("Fill in all item names");

    setSubmitting(true);
    try {
      await createCycleCount({
        title,
        countMethod,
        scheduledDate: scheduledDate || undefined,
        centerId,
        remarks,
        lineItems: lines.map((l) => ({
          itemName: l.itemName,
          countedQty: Number(l.countedQty),
        })),
      });
      toast.success("Cycle count recorded successfully");
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

  const handleReconcile = async (id) => {
    try {
      await reconcileCycleCount(id);
      toast.success("Cycle count reconciled — stock adjusted");
      setDetailModal(null);
      setRefreshFlag((f) => f + 1);
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Couldn't reconcile.",
        );
      }
    }
  };

  const columns = [
    {
      name: "Cycle Count #",
      selector: (row) => row.cycleCountNumber,
      sortable: true,
      width: "160px",
    },
    {
      name: "Center",
      cell: (row) => (
        <span className="uom-cell-muted">{row.centerId?.title || "—"}</span>
      ),
    },
    {
      name: "Items",
      width: "80px",
      cell: (row) => (
        <span className="uom-cell-muted">{row.lineItems?.length || 0}</span>
      ),
    },
    {
      name: "Status",
      width: "130px",
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
          <h4>Cycle Counts</h4>
          <p>Periodic physical stock verification</p>
        </div>
      </div>

      <div className="d-flex justify-content-end mb-3">
        {canCreate && (
          <Button color="primary" onClick={openModal}>
            <i className="bx bx-plus me-1"></i> New Cycle Count
          </Button>
        )}
      </div>

      <div className="uom-table-card">
        <DataTable
          columns={columns}
          data={counts}
          progressPending={loading}
          pagination
          highlightOnHover
          noDataComponent={
            <div className="uom-empty-state">No cycle counts yet</div>
          }
        />
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={modalOpen}
        toggle={() => setModalOpen(false)}
        centered
        size="lg"
      >
        <ModalBody className="p-4">
          <h5 className="mb-3">Count Information</h5>
          <Label>Title</Label>
          <Input
            className="mb-3"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Row>
            <Col md={6} className="mb-3">
              <Label>Count Method</Label>
              <Input
                type="select"
                value={countMethod}
                onChange={(e) => setCountMethod(e.target.value)}
              >
                <option value="full">Full Count</option>
                <option value="blind">Blind Count</option>
                <option value="sample">Sample Count</option>
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
                {centers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </Input>
            </Col>
          </Row>

          <Label>Scheduled Date</Label>
          <Input
            type="date"
            className="mb-3"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
          />

          <Label className="small">
            Item <span className="text-danger">*</span>
          </Label>
          {lines.map((l, idx) => (
            <Row key={idx} className="mb-2 align-items-center">
              <Col md={5}>
                <Input
                  type="select"
                  value={l.itemName}
                  disabled={!centerId}
                  onChange={(e) => updateLine(idx, "itemName", e.target.value)}
                >
                  <option value="">
                    {!centerId ? "Select site first" : "Select item"}
                  </option>
                  {stockOptions.map((s) => (
                    <option key={s._id} value={s.itemName}>
                      {s.itemName}
                    </option>
                  ))}
                </Input>
              </Col>
              <Col md={2}>
                <Input value={l.itemName ? l.systemQty : "—"} disabled />
              </Col>
              <Col md={3}>
                <Input
                  type="number"
                  min={0}
                  placeholder="Counted qty *"
                  value={l.countedQty}
                  onChange={(e) =>
                    updateLine(idx, "countedQty", e.target.value)
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
          ))}
          <div className="mb-3">
            <Button color="light" size="sm" onClick={addLine}>
              <i className="bx bx-plus me-1"></i> Add Item
            </Button>
          </div>

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
              {submitting ? "Saving..." : "Save Count"}
            </Button>
          </div>
        </ModalBody>
      </Modal>

      {/* Detail / Reconcile Modal */}
      <Modal
        isOpen={!!detailModal}
        toggle={() => setDetailModal(null)}
        centered
        size="lg"
      >
        <ModalBody className="p-4">
          {detailModal && (
            <>
              <h5 className="mb-3">
                {detailModal.cycleCountNumber} —{" "}
                <StatusPill status={detailModal.status} />
              </h5>
              <div style={{ overflowX: "auto" }}>
                <table className="table mb-0">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>System Qty</th>
                      <th>Counted Qty</th>
                      <th>Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailModal.lineItems.map((li, idx) => (
                      <tr key={idx}>
                        <td>{li.itemName}</td>
                        <td>{li.systemQty}</td>
                        <td>{li.countedQty}</td>
                        <td
                          className={
                            li.variance !== 0
                              ? "text-danger fw-semibold"
                              : "text-success"
                          }
                        >
                          {li.variance > 0 ? `+${li.variance}` : li.variance}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-4">
                <Button color="light" onClick={() => setDetailModal(null)}>
                  Close
                </Button>
                {detailModal.status === "draft" && canReconcile && (
                  <Button
                    color="success"
                    onClick={() => handleReconcile(detailModal._id)}
                  >
                    Reconcile (Apply Adjustments)
                  </Button>
                )}
              </div>
            </>
          )}
        </ModalBody>
      </Modal>
    </div>
  );
};

export default CycleCount;
