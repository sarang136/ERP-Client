import React, { useState } from "react";
import { Row, Col, Label, Input, Button } from "reactstrap";
import { toast } from "react-toastify";
import { createVendorInvoice } from "../../../../helpers/backend_helper";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import "../../UnitOfMeasurement/uom.scss";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const VendorInvoiceForm = ({ grn, onSaved, onCancel }) => {
  const handleAuthError = useAuthError();
  const [submitting, setSubmitting] = useState(false);

  const [vendorInvoiceNumber, setVendorInvoiceNumber] = useState("");
  const [vendorInvoiceDate, setVendorInvoiceDate] = useState("");
  const [remarks, setRemarks] = useState("");

  const [lines, setLines] = useState(
    grn.lineItems.map((li) => ({
      itemName: li.itemName,
      grnQty: li.receivedQty,
      invoicedQty: li.receivedQty,
      invoicedRate: 0,
      taxPercent: 0,
    })),
  );

  const updateLine = (idx, field, value) => {
    setLines((prev) => prev.map((li, i) => (i === idx ? { ...li, [field]: value } : li)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vendorInvoiceNumber.trim()) return toast.error("Vendor invoice number is required");
    if (!vendorInvoiceDate) return toast.error("Vendor invoice date is required");

    setSubmitting(true);
    try {
      const res = await createVendorInvoice({
        grnId: grn._id,
        vendorInvoiceNumber,
        vendorInvoiceDate,
        remarks,
        lineItems: lines.map((li) => ({
          itemName: li.itemName,
          invoicedQty: Number(li.invoicedQty),
          invoicedRate: Number(li.invoicedRate),
          taxPercent: Number(li.taxPercent),
        })),
      });
      const result = res?.data?.matchResult;
      if (result === "matched") {
        toast.success("Invoice matched successfully — ready to book");
      } else {
        toast.error("Discrepancy found — invoice recorded, review required");
      }
      onSaved();
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(error?.response?.data?.message || error?.message || "Something went wrong");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const calc = lines.reduce(
    (acc, li) => {
      const base = (Number(li.invoicedQty) || 0) * (Number(li.invoicedRate) || 0);
      const tax = base * ((Number(li.taxPercent) || 0) / 100);
      acc.subtotal += base;
      acc.tax += tax;
      return acc;
    },
    { subtotal: 0, tax: 0 },
  );

  return (
    <div className="uom-form-page">
      <div className="d-flex justify-content-between align-items-start mb-1">
        <h4 className="uom-form-title mb-0">Record Vendor Invoice</h4>
        <Button color="primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Saving..." : "Save & Match"}
        </Button>
      </div>
      <p className="text-muted mb-4">
        GRN: <strong>{grn.grnNumber}</strong> · PO: <strong>{grn.poId?.poNumber}</strong>
      </p>

      <div className="uom-form-panel">
        <form onSubmit={handleSubmit}>
          <h6 className="uom-form-section-title">Vendor Invoice Details</h6>
          <Row>
            <Col md={4} className="mb-4">
              <Label>Vendor</Label>
              <Input
                value={grn.poId?.vendorId?.tradeName || grn.poId?.vendorId?.legalName || "—"}
                disabled
              />
            </Col>
            <Col md={4} className="mb-4">
              <Label>
                Vendor Invoice Number <span className="text-danger">*</span>
              </Label>
              <Input
                value={vendorInvoiceNumber}
                onChange={(e) => setVendorInvoiceNumber(e.target.value)}
              />
            </Col>
            <Col md={4} className="mb-4">
              <Label>
                Vendor Invoice Date <span className="text-danger">*</span>
              </Label>
              <Input
                type="date"
                value={vendorInvoiceDate}
                onChange={(e) => setVendorInvoiceDate(e.target.value)}
              />
            </Col>
          </Row>

          <h6 className="uom-form-section-title mt-2">
            What the vendor billed — enter exactly as shown on their invoice
          </h6>
          <div className="uom-table-card mb-3" style={{ overflowX: "auto" }}>
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>Item</th>
                  <th style={{ width: 110 }}>GRN Qty</th>
                  <th style={{ width: 120 }}>Invoiced Qty</th>
                  <th style={{ width: 120 }}>Invoiced Rate</th>
                  <th style={{ width: 90 }}>Tax %</th>
                  <th style={{ width: 120 }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((li, idx) => {
                  const base = (Number(li.invoicedQty) || 0) * (Number(li.invoicedRate) || 0);
                  const tax = base * ((Number(li.taxPercent) || 0) / 100);
                  const qtyMismatch = Number(li.invoicedQty) !== li.grnQty;
                  return (
                    <tr key={idx}>
                      <td className="align-middle">{li.itemName}</td>
                      <td className="align-middle text-muted">{li.grnQty}</td>
                      <td>
                        <Input
                          bsSize="sm"
                          type="number"
                          min={0}
                          value={li.invoicedQty}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => updateLine(idx, "invoicedQty", e.target.value)}
                          invalid={qtyMismatch}
                        />
                        {qtyMismatch && (
                          <div className="text-danger small mt-1">Doesn't match GRN qty</div>
                        )}
                      </td>
                      <td>
                        <Input
                          bsSize="sm"
                          type="number"
                          min={0}
                          value={li.invoicedRate}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => updateLine(idx, "invoicedRate", e.target.value)}
                        />
                      </td>
                      <td>
                        <Input
                          bsSize="sm"
                          type="select"
                          value={li.taxPercent}
                          onChange={(e) => updateLine(idx, "taxPercent", e.target.value)}
                        >
                          <option value={0}>0%</option>
                          <option value={5}>5%</option>
                          <option value={12}>12%</option>
                          <option value={18}>18%</option>
                          <option value={28}>28%</option>
                        </Input>
                      </td>
                      <td className="align-middle fw-semibold">{money(base + tax)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="uom-table-card p-3 mb-4" style={{ maxWidth: 320, marginLeft: "auto" }}>
            <div className="d-flex justify-content-between mb-1">
              <span className="text-muted small">Subtotal</span>
              <span>{money(calc.subtotal)}</span>
            </div>
            <div className="d-flex justify-content-between mb-1">
              <span className="text-muted small">Tax</span>
              <span>{money(calc.tax)}</span>
            </div>
            <hr className="my-2" />
            <div className="d-flex justify-content-between fw-bold">
              <span>Total</span>
              <span>{money(calc.subtotal + calc.tax)}</span>
            </div>
          </div>

          <Row>
            <Col md={12} className="mb-4">
              <Label>Remarks</Label>
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
              {submitting ? "Saving..." : "Save & Match"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VendorInvoiceForm;