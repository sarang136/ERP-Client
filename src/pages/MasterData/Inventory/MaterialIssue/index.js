import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { Button, Input, Modal, ModalBody, Label, Row, Col } from "reactstrap";
import { toast } from "react-toastify";
import {
  getMaterialIssues,
  createMaterialIssue,
  // getStockBalances,
  getStorageLocations,
  getLocationStock,
} from "../../../../helpers/backend_helper";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { useReferenceList } from "../../../../Components/Hooks/useReferenceData";
import { usePermissions } from "../../../../Components/Hooks/useRoles.js";
import "../../UnitOfMeasurement/uom.scss";

const dateFmt = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "—");

const emptyLine = () => ({
  itemName: "",
  quantity: 1,
  uomId: "",
  unitCost: "",
  remarks: "",
});

const ISSUE_TYPES = [
  { value: "production", label: "Production" },
  { value: "project", label: "Project" },
  { value: "maintenance", label: "Maintenance" },
  { value: "department", label: "Department" },
  { value: "employee", label: "Employee" },
];

const PRIORITIES = ["low", "medium", "high", "urgent"];

const MaterialIssue = () => {
  const handleAuthError = useAuthError();
  const token = JSON.parse(localStorage.getItem("micrologin"))?.token;
  const { hasPermission } = usePermissions(token);
  const canCreate = hasPermission("MASTERDATA", "MATERIAL_ISSUE", "WRITE");

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const { items: centers } = useReferenceList("centers");
  const { items: departments } = useReferenceList("departments");
  const { items: uoms } = useReferenceList("uoms");
  const [stockOptions, setStockOptions] = useState([]);
  const [locations, setLocations] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [issueType, setIssueType] = useState("department");
  const [centerId, setCenterId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [projectRef, setProjectRef] = useState("");
  const [costCenterRef, setCostCenterRef] = useState("");
  const [priority, setPriority] = useState("medium");
  const [purpose, setPurpose] = useState("");
  const [remarks, setRemarks] = useState("");
  const [storageLocationId, setStorageLocationId] = useState("");
  const [lines, setLines] = useState([emptyLine()]);
  const [submitting, setSubmitting] = useState(false);

  const [detailModal, setDetailModal] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getMaterialIssues()
      .then((res) => {
        if (!cancelled) setIssues(res?.data || []);
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
    setIssueType("department");
    setCenterId("");
    setDepartmentId("");
    setProjectRef("");
    setCostCenterRef("");
    setPriority("medium");
    setPurpose("");
    setRemarks("");
    setStorageLocationId("");
    setLines([emptyLine()]);
    setStockOptions([]);
    setLocations([]);
    setModalOpen(true);
  };

  const handleCenterChange = (id) => {
    setCenterId(id);
    setStorageLocationId("");
    setStockOptions([]);
    setLines([emptyLine()]);
    if (!id) {
      setLocations([]);
      return;
    }
    getStorageLocations({ centerId: id, status: "active" })
      .then((res) => setLocations(res?.data || []))
      .catch(() => setLocations([]));
  };

  const handleLocationChange = (locationId) => {
    setStorageLocationId(locationId);
    setLines([emptyLine()]);
    if (!locationId) {
      setStockOptions([]);
      return;
    }
    getLocationStock()
      .then((res) => {
        const atThisLocation = (res?.data || []).filter(
          (r) => r.location?._id === locationId,
        );
        setStockOptions(
          atThisLocation.map((r) => ({
            _id: locationId + r.itemName,
            itemName: r.itemName,
            quantity: r.quantity,
          })),
        );
      })
      .catch(() => setStockOptions([]));
  };

  const updateLine = (idx, field, value) => {
    setLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)),
    );
  };
  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (idx) =>
    setLines((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!centerId || !storageLocationId) {
      return toast.error("Select Site and Storage Location");
    }
    if (issueType === "department" && !departmentId) {
      return toast.error("Select the Department this material is issued to");
    }
    const invalid = lines.find(
      (l) => !l.itemName.trim() || Number(l.quantity) <= 0,
    );
    if (invalid)
      return toast.error("Fill in Item and a valid Quantity for every line");

    setSubmitting(true);
    try {
      await createMaterialIssue({
        issueType,
        centerId,
        departmentId: departmentId || undefined,
        projectRef,
        costCenterRef,
        priority,
        purpose,
        remarks,
        storageLocationId,
        lineItems: lines.map((l) => ({
          itemName: l.itemName,
          quantity: Number(l.quantity),
          uomId: l.uomId || undefined,
          unitCost: l.unitCost !== "" ? Number(l.unitCost) : undefined,
          remarks: l.remarks,
        })),
      });
      toast.success("Material issue created successfully");
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

  const columns = [
    {
      name: "Issue #",
      selector: (row) => row.issueNumber,
      sortable: true,
      width: "150px",
    },
    {
      name: "Type",
      width: "110px",
      cell: (row) => (
        <span className="uom-cell-muted text-capitalize">{row.issueType}</span>
      ),
    },
    {
      name: "Site",
      cell: (row) => (
        <span className="uom-cell-muted">{row.centerId?.title || "—"}</span>
      ),
    },
    {
      name: "Department",
      cell: (row) => (
        <span className="uom-cell-muted">{row.departmentId?.name || "—"}</span>
      ),
    },
    {
      name: "Priority",
      width: "100px",
      cell: (row) => (
        <span
          className={`uom-status-pill ${row.priority === "urgent" || row.priority === "high" ? "status-blacklisted" : "status-active"}`}
        >
          <span className="dot"></span> {row.priority}
        </span>
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
          <h4>Material Issues</h4>
          <p>
            Stock given out for production, projects, maintenance, or department
            use
          </p>
        </div>
      </div>

      <div className="d-flex justify-content-end mb-3">
        {canCreate && (
          <Button color="primary" onClick={openModal}>
            <i className="bx bx-plus me-1"></i> Create
          </Button>
        )}
      </div>

      <div className="uom-table-card">
        <DataTable
          columns={columns}
          data={issues}
          progressPending={loading}
          pagination
          highlightOnHover
          noDataComponent={
            <div className="uom-empty-state">No material issues yet</div>
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
          <h5 className="mb-1">Create Material Issue</h5>
          <p className="text-muted small mb-3">
            Fill in the details to create a new material issue request
          </p>

          <h6 className="fw-semibold mb-3">Issue Details</h6>
          <Row>
            <Col md={6} className="mb-3">
              <Label>
                Issue Type <span className="text-danger">*</span>
              </Label>
              <Input
                type="select"
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
              >
                {ISSUE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Input>
            </Col>
            <Col md={6} className="mb-3">
              <Label>
                Priority <span className="text-danger">*</span>
              </Label>
              <Input
                type="select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p[0].toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </Input>
            </Col>
          </Row>

          <Row>
            <Col md={6} className="mb-3">
              <Label>
                Site <span className="text-danger">*</span>
              </Label>
              <Input
                type="select"
                value={centerId}
                onChange={(e) => handleCenterChange(e.target.value)}
              >
                <option value="">Select Site</option>
                {centers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </Input>
            </Col>
            <Col md={6} className="mb-3">
              <Label>
                Department{" "}
                {issueType === "department" && (
                  <span className="text-danger">*</span>
                )}
              </Label>
              <Input
                type="select"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </Input>
            </Col>
          </Row>

          <Row>
            <Col md={6} className="mb-3">
              <Label>Project (optional)</Label>
              <Input
                value={projectRef}
                onChange={(e) => setProjectRef(e.target.value)}
              />
            </Col>
            <Col md={6} className="mb-3">
              <Label>Cost Center (optional)</Label>
              <Input
                value={costCenterRef}
                onChange={(e) => setCostCenterRef(e.target.value)}
              />
            </Col>
          </Row>

          <Label>
            Storage Location <span className="text-danger">*</span>
          </Label>
          <Input
            type="select"
            className="mb-3"
            value={storageLocationId}
            disabled={!centerId}
            onChange={(e) => handleLocationChange(e.target.value)}
          >
            <option value="">
              {!centerId ? "Select site first" : "Select location"}
            </option>
            {locations.map((l) => (
              <option key={l._id} value={l._id}>
                {l.name} ({l.code})
              </option>
            ))}
          </Input>

          <Label>Purpose</Label>
          <Input
            className="mb-3"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          />

          <Label>Remarks</Label>
          <Input
            type="textarea"
            rows={2}
            className="mb-4"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />

          <h6 className="fw-semibold mb-3">Items</h6>
          {lines.map((l, idx) => {
            const stockRow = stockOptions.find(
              (s) => s.itemName === l.itemName,
            );
            const availableQty = stockRow?.quantity ?? 0;
            return (
              <div key={idx} className="uom-table-card p-3 mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <div className="fw-semibold small">Item #{idx + 1}</div>
                  <Button
                    size="sm"
                    color="light"
                    disabled={lines.length === 1}
                    onClick={() => removeLine(idx)}
                  >
                    <i className="bx bx-trash text-danger"></i>
                  </Button>
                </div>
                <Row>
                  <Col md={5} className="mb-2">
                    <Label className="small">
                      Item <span className="text-danger">*</span>
                    </Label>
                    <Input
                      type="select"
                      value={l.itemName}
                      disabled={!storageLocationId}
                      onChange={(e) =>
                        updateLine(idx, "itemName", e.target.value)
                      }
                    >
                      <option value="">
                        {!storageLocationId
                          ? "Select location first"
                          : "Select item"}
                      </option>
                      {stockOptions.map((s) => (
                        <option key={s._id} value={s.itemName}>
                          {s.itemName} (Available: {s.quantity})
                        </option>
                      ))}
                    </Input>
                  </Col>
                  <Col md={2} className="mb-2">
                    <Label className="small">
                      Quantity <span className="text-danger">*</span>
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      max={availableQty || undefined}
                      value={l.quantity}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) =>
                        updateLine(idx, "quantity", e.target.value)
                      }
                    />
                  </Col>
                  <Col md={2} className="mb-2">
                    <Label className="small">UOM</Label>
                    <Input
                      type="select"
                      value={l.uomId}
                      onChange={(e) => updateLine(idx, "uomId", e.target.value)}
                    >
                      <option value="">Select</option>
                      {uoms.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.name} ({u.symbol})
                        </option>
                      ))}
                    </Input>
                  </Col>
                  <Col md={3} className="mb-2">
                    <Label className="small">Unit Cost</Label>
                    <Input
                      type="number"
                      min={0}
                      value={l.unitCost}
                      onChange={(e) =>
                        updateLine(idx, "unitCost", e.target.value)
                      }
                    />
                  </Col>
                </Row>
                <Label className="small">Remarks</Label>
                <Input
                  value={l.remarks}
                  onChange={(e) => updateLine(idx, "remarks", e.target.value)}
                />
              </div>
            );
          })}

          <div className="mb-4">
            <Button color="light" size="sm" onClick={addLine}>
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
            <Button color="danger" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Saving..." : "Create Issue"}
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
              <h5 className="mb-1">{detailModal.issueNumber}</h5>
              <p className="text-muted small mb-3">
                {detailModal.issueType} · {detailModal.centerId?.title} ·{" "}
                {detailModal.departmentId?.name || "No department"} · Priority:{" "}
                {detailModal.priority}
              </p>
              <div style={{ overflowX: "auto" }}>
                <table className="table mb-0">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>UOM</th>
                      <th>Unit Cost</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailModal.lineItems.map((li, idx) => (
                      <tr key={idx}>
                        <td>{li.itemName}</td>
                        <td>{li.quantity}</td>
                        <td>{li.uomId?.symbol || "—"}</td>
                        <td>{li.unitCost || "—"}</td>
                        <td className="small text-muted">
                          {li.remarks || "—"}
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

export default MaterialIssue;
