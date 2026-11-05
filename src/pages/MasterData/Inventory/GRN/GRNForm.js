import React, { useState } from "react";
import { Row, Col, Label, Input, Button } from "reactstrap";
import { toast } from "react-toastify";
import { createGRN } from "../../../../helpers/backend_helper";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import "../../UnitOfMeasurement/uom.scss";

const GRNForm = ({ di, onSaved, onCancel }) => {
  const handleAuthError = useAuthError();
  const [submitting, setSubmitting] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [file, setFile] = useState(null);

  const [lines, setLines] = useState(
    di.lines.map((li) => ({
      itemName: li.itemName,
      orderedQty: li.orderedQty,
      alreadyReceived: li.receivedQty,
      toReceive: li.toReceive,
      receivedQty: li.toReceive,
      remarks: "",
    })),
  );

  const updateLine = (idx, field, value) => {
    setLines((prev) =>
      prev.map((li, i) => (i === idx ? { ...li, [field]: value } : li)),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const invalidLine = lines.find((li) => Number(li.receivedQty) < 0);
    if (invalidLine) return toast.error("Received quantity cannot be negative");

    if (!file) return toast.error("GRN attachment is required");

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("poId", di._id);
      formData.append("remarks", remarks);
      formData.append(
        "lineItems",
        JSON.stringify(
          lines.map((li) => ({
            itemName: li.itemName,
            orderedQty: li.orderedQty,
            receivedQty: Number(li.receivedQty),
            remarks: li.remarks,
          })),
        ),
      );
      formData.append("attachment", file);
      await createGRN(formData);
      toast.success("Goods Receipt Note created successfully");
      onSaved();
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

  return (
    <div className="uom-form-page">
      <div className="d-flex justify-content-between align-items-start mb-1">
        <h4 className="uom-form-title mb-0">Create Goods Receipt Note</h4>
        <Button color="primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Saving..." : "Save GRN"}
        </Button>
      </div>
      <p className="text-muted mb-4">
        PO: <strong>{di.poNumber}</strong> · Vendor:{" "}
        <strong>{di.vendorId?.tradeName || di.vendorId?.legalName}</strong>
      </p>

      <div className="uom-form-panel">
        <form onSubmit={handleSubmit}>
          <h6 className="uom-form-section-title">Verify Received Quantities</h6>
          <p className="text-muted small mb-3">
            Confirm what physically arrived — this may differ from what was
            intimated.
          </p>

          {lines.map((li, idx) => (
            <div key={idx} className="uom-table-card p-3 mb-3">
              <div className="fw-semibold mb-1">{li.itemName}</div>
              <div className="text-muted small mb-3">
                Ordered: {li.orderedQty} · Already Received:{" "}
                {li.alreadyReceived} · To Receive: {li.toReceive}
              </div>
              <Row>
                <Col md={4} className="mb-2">
                  <Label className="small">
                    Received Qty <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={li.toReceive}
                    value={li.receivedQty}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) =>
                      updateLine(idx, "receivedQty", e.target.value)
                    }
                  />
                  {Number(li.receivedQty) > li.toReceive && (
                    <div className="text-danger small mt-1">
                      <i className="bx bx-error-circle me-1"></i>
                      Cannot exceed {li.toReceive}
                    </div>
                  )}
                </Col>
                <Col md={8} className="mb-2">
                  <Label className="small">Remarks</Label>
                  <Input
                    value={li.remarks}
                    placeholder="e.g. 1 unit damaged in transit"
                    onChange={(e) => updateLine(idx, "remarks", e.target.value)}
                  />
                </Col>
              </Row>
            </div>
          ))}

          <Row>
            <Col md={6} className="mb-4">
              <Label>
                Attachment (Challan / Receipt copy){" "}
                <span className="text-danger">*</span>
              </Label>
              <Input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <div className="text-muted small mt-1">PDF or image</div>
            </Col>
          </Row>

          <Row>
            <Col md={12} className="mb-4">
              <Label>Overall Remarks</Label>
              <Input
                type="textarea"
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </Col>
          </Row>

          <div className="uom-form-footer d-flex justify-content-end gap-2">
            <Button type="button" color="light" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" color="primary" disabled={submitting}>
              {submitting ? "Saving..." : "Save GRN"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GRNForm;
