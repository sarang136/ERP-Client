import React, { useEffect, useState } from "react";
import { Label, Input, Button, Modal, ModalBody } from "reactstrap";
import { toast } from "react-toastify";
import {
  getRFQById,
  recordVendorQuote,
  closeRFQ,
} from "../../../../helpers/backend_helper";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { usePermissions } from "../../../../Components/Hooks/useRoles.js";
import "../../UnitOfMeasurement/uom.scss";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const vendorName = (vq) => vq?.vendorId?.tradeName || vq?.vendorId?.legalName || "—";

const RFQDetail = ({ rfqId, onBack }) => {
  const handleAuthError = useAuthError();
  const token = JSON.parse(localStorage.getItem("micrologin"))?.token;
  const { hasPermission } = usePermissions(token);
  const canEdit = hasPermission("MASTERDATA", "RFQ", "WRITE");

  const [rfq, setRfq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshFlag, setRefreshFlag] = useState(0);

  const [quoteModalFor, setQuoteModalFor] = useState(null);
  const [draftLines, setDraftLines] = useState([]);
  const [draftRemarks, setDraftRemarks] = useState("");
  const [draftFile, setDraftFile] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [saving, setSaving] = useState(false);

  // Final vendor choice. Follows the lowest quote until the user picks one manually.
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [manualPick, setManualPick] = useState(false);
  const [selectionReason, setSelectionReason] = useState("");

  const [closing, setClosing] = useState(false);

  useEffect(() => {
    setLoading(true);
    getRFQById(rfqId)
      .then((res) => setRfq(res?.data || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [rfqId, refreshFlag]);

  useEffect(() => {
    if (!rfq || rfq.status !== "draft") return;
    const quoted = rfq.vendorQuotes.filter((vq) => vq.quotedAt);
    if (quoted.length === 0) {
      setSelectedVendorId("");
      return;
    }
    const lowest = quoted.reduce((a, b) => (b.totalAmount < a.totalAmount ? b : a));
    const stillValid = quoted.some((vq) => vq.vendorId?._id === selectedVendorId);
    if (manualPick && stillValid) return;
    setSelectedVendorId(lowest.vendorId?._id || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfq]);

  const openQuoteModal = (vendorQuote) => {
    setQuoteModalFor(vendorQuote);
    setDraftLines(
      vendorQuote.lineItemQuotes.length > 0
        ? vendorQuote.lineItemQuotes.map((li) => ({ ...li }))
        : rfq.lineItems.map((li) => ({
            itemName: li.itemName,
            quantity: li.quantity,
            unitPrice: 0,
            taxPercent: 0,
          })),
    );
    setDraftRemarks(vendorQuote.remarks || "");
    setDraftFile(null);
  };

  const updateDraftLine = (idx, field, value) => {
    setDraftLines((prev) => prev.map((li, i) => (i === idx ? { ...li, [field]: value } : li)));
  };

  const saveQuote = async () => {
    if (!draftFile && !quoteModalFor.attachment?.url) {
      toast.error("Vendor quotation attachment is required");
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append(
        "lineItemQuotes",
        JSON.stringify(
          draftLines.map((li) => ({
            ...li,
            quantity: Number(li.quantity) || 0,
            unitPrice: Number(li.unitPrice) || 0,
            taxPercent: Number(li.taxPercent) || 0,
          })),
        ),
      );
      formData.append("remarks", draftRemarks);
      if (draftFile) formData.append("attachment", draftFile);
      await recordVendorQuote(rfq._id, quoteModalFor._id, formData);
      toast.success("Vendor quote recorded");
      setQuoteModalFor(null);
      setRefreshFlag((f) => f + 1);
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(error?.response?.data?.message || error?.message || "Couldn't save quote");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading || !rfq) {
    return <div className="p-4 text-muted">Loading RFQ...</div>;
  }

  const quotedVendors = rfq.vendorQuotes.filter((vq) => vq.quotedAt);
  const lowestAmount =
    quotedVendors.length > 0 ? Math.min(...quotedVendors.map((vq) => vq.totalAmount)) : null;

  const selectedQuote = quotedVendors.find((vq) => vq.vendorId?._id === selectedVendorId);
  const isOverride = !!selectedQuote && selectedQuote.totalAmount !== lowestAmount;

  const finalizedQuote = rfq.vendorQuotes.find((vq) => vq.vendorId?._id === rfq.selectedVendorId);

  const handleClose = async () => {
    if (!selectedVendorId) {
      toast.error("Record at least one vendor quote and select the final vendor");
      return;
    }
    if (isOverride && !selectionReason.trim()) {
      toast.error("Please give a reason for not choosing the lowest quote");
      return;
    }
    setClosing(true);
    try {
      await closeRFQ(rfq._id, {
        selectedVendorId,
        selectionReason: selectionReason.trim(),
      });
      toast.success("RFQ closed");
      setRefreshFlag((f) => f + 1);
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(error?.response?.data?.message || error?.message || "Couldn't close RFQ");
      }
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="uom-page">
      <div className="uom-list-header">
        <div>
          <h4>{rfq.rfqNumber}</h4>
          <p>
            Reference: {rfq.prId?.prNumber} — {rfq.prId?.prTitle}
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button color="light" onClick={onBack}>
            <i className="bx bx-arrow-back me-1"></i> Back
          </Button>
          {canEdit && rfq.status === "draft" && (
            <Button
              color="dark"
              onClick={handleClose}
              disabled={closing || quotedVendors.length === 0}
            >
              {closing ? "Closing..." : "Close RFQ"}
            </Button>
          )}
        </div>
      </div>

      <div className="uom-table-card p-3 mb-4">
        <div className="fw-semibold small mb-2">Items Requested</div>
        {rfq.lineItems.map((li, idx) => (
          <div key={idx} className="d-flex justify-content-between small text-muted mb-1">
            <span>{li.itemName}</span>
            <span>Qty: {li.quantity}</span>
          </div>
        ))}
      </div>

      <h6 className="uom-form-section-title">Vendor Quotes — Comparative Statement</h6>
      <p className="text-muted small mb-3">
        Contact each vendor manually (phone/WhatsApp/email), then record their quote here.
        {rfq.status === "draft" && " The lowest quote is selected by default. You can pick another vendor, but you will need to give a reason."}
      </p>

      <div className="uom-table-card mb-4" style={{ overflowX: "auto" }}>
        <table className="table mb-0">
          <thead>
            <tr>
              <th style={{ width: 90 }}>Final</th>
              <th>Vendor</th>
              <th>Status</th>
              <th>Total Quote</th>
              <th>Quotation</th>
              <th>Remarks</th>
              <th style={{ width: 140 }}></th>
            </tr>
          </thead>
          <tbody>
            {rfq.vendorQuotes.map((vq) => {
              const isLowest = vq.quotedAt && vq.totalAmount === lowestAmount;
              const isFinalized = rfq.status === "closed" && vq.vendorId?._id === rfq.selectedVendorId;
              return (
                <tr key={vq._id} style={isLowest ? { background: "#ecfdf3" } : undefined}>
                  <td className="align-middle">
                    {rfq.status === "draft" && vq.quotedAt ? (
                      <Input
                        type="radio"
                        name="finalVendor"
                        checked={selectedVendorId === vq.vendorId?._id}
                        disabled={!canEdit}
                        onChange={() => {
                          setSelectedVendorId(vq.vendorId?._id);
                          setManualPick(true);
                        }}
                      />
                    ) : isFinalized ? (
                      <span className="uom-status-pill status-active">Selected</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="align-middle">{vendorName(vq)}</td>
                  <td className="align-middle">
                    {vq.quotedAt ? (
                      <span className="uom-status-pill status-active">Received</span>
                    ) : (
                      <span className="uom-status-pill status-inactive">Pending</span>
                    )}
                  </td>
                  <td className="align-middle fw-semibold">
                    {vq.quotedAt ? (
                      <>
                        {money(vq.totalAmount)}
                        {isLowest && (
                          <span className="uom-status-pill status-active ms-2">Lowest</span>
                        )}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="align-middle small">
                    {vq.attachment?.url ? (
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className="text-truncate"
                          style={{ maxWidth: 160 }}
                          title={vq.attachment.originalName}
                        >
                          <i className="bx bx-paperclip me-1"></i>
                          {vq.attachment.originalName || "Quotation"}
                        </span>
                        <Button
                          size="sm"
                          color="light"
                          title="Preview"
                          onClick={() => setPreviewFile(vq.attachment)}
                        >
                          <i className="bx bx-show"></i>
                        </Button>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="align-middle small text-muted">{vq.remarks || "—"}</td>
                  <td className="align-middle">
                    {canEdit && rfq.status === "draft" && (
                      <Button size="sm" color="light" onClick={() => openQuoteModal(vq)}>
                        {vq.quotedAt ? "Edit Quote" : "Record Quote"}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {canEdit && rfq.status === "draft" && quotedVendors.length > 0 && (
        <div className="uom-table-card p-3 mb-4">
          <div className="fw-semibold small mb-1">Final vendor for this RFQ</div>
          <div>
            {vendorName(selectedQuote)} — <strong>{money(selectedQuote?.totalAmount)}</strong>
            {!isOverride && (
              <span className="uom-status-pill status-active ms-2">Lowest</span>
            )}
          </div>
          {isOverride && (
            <div className="mt-3">
              <Label>
                Reason for not choosing the lowest quote <span className="text-danger">*</span>
              </Label>
              <Input
                type="textarea"
                rows={2}
                value={selectionReason}
                onChange={(e) => setSelectionReason(e.target.value)}
                placeholder="e.g. Better warranty, faster delivery, past experience"
              />
            </div>
          )}
          <div className="text-muted small mt-2">
            The Purchase Order will be created for this vendor only.
          </div>
        </div>
      )}

      {rfq.status === "closed" && finalizedQuote && (
        <div className="uom-table-card p-3 mb-4">
          <div className="fw-semibold small mb-1">Final vendor</div>
          <div>
            {vendorName(finalizedQuote)} — <strong>{money(finalizedQuote.totalAmount)}</strong>
          </div>
          {rfq.selectionReason && (
            <div className="text-muted small mt-2">
              Reason for not choosing the lowest quote: {rfq.selectionReason}
            </div>
          )}
        </div>
      )}

      <Modal isOpen={!!quoteModalFor} toggle={() => setQuoteModalFor(null)} centered size="lg">
        <ModalBody className="p-4">
          <h5 className="mb-1">Record Quote — {vendorName(quoteModalFor)}</h5>
          <p className="text-muted small mb-3">
            Enter the rate this vendor gave you over phone/WhatsApp/email.
          </p>

          <div className="uom-table-card mb-3" style={{ overflowX: "auto" }}>
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>Item</th>
                  <th style={{ width: 90 }}>Qty</th>
                  <th style={{ width: 130 }}>Rate</th>
                  <th style={{ width: 90 }}>Tax %</th>
                </tr>
              </thead>
              <tbody>
                {draftLines.map((li, idx) => (
                  <tr key={idx}>
                    <td className="align-middle">{li.itemName}</td>
                    <td>
                      <Input
                        bsSize="sm"
                        type="number"
                        min={0}
                        value={li.quantity}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => updateDraftLine(idx, "quantity", e.target.value)}
                      />
                    </td>
                    <td>
                      <Input
                        bsSize="sm"
                        type="number"
                        min={0}
                        value={li.unitPrice}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => updateDraftLine(idx, "unitPrice", e.target.value)}
                      />
                    </td>
                    <td>
                      <Input
                        bsSize="sm"
                        type="select"
                        value={li.taxPercent}
                        onChange={(e) => updateDraftLine(idx, "taxPercent", e.target.value)}
                      >
                        <option value={0}>0%</option>
                        <option value={5}>5%</option>
                        <option value={12}>12%</option>
                        <option value={18}>18%</option>
                        <option value={28}>28%</option>
                      </Input>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Label>
            Vendor Quotation <span className="text-danger">*</span>
          </Label>
          <Input
            type="file"
            accept=".pdf,image/*"
            className="mb-1"
            onChange={(e) => setDraftFile(e.target.files?.[0] || null)}
          />
          <div className="text-muted small mb-3">
            {quoteModalFor?.attachment?.url && !draftFile ? (
              <>
                Current file attached. Choose a file only to replace it.
              </>
            ) : (
              "Attach the quotation received from the vendor (PDF or image)"
            )}
          </div>

          <Label>Remarks</Label>
          <Input
            type="textarea"
            rows={2}
            value={draftRemarks}
            onChange={(e) => setDraftRemarks(e.target.value)}
            placeholder="e.g. Delivery in 5 days, warranty included"
          />

          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button color="light" onClick={() => setQuoteModalFor(null)} disabled={saving}>
              Cancel
            </Button>
            <Button color="primary" onClick={saveQuote} disabled={saving}>
              {saving ? "Saving..." : "Save Quote"}
            </Button>
          </div>
        </ModalBody>
      </Modal>

      <Modal isOpen={!!previewFile} toggle={() => setPreviewFile(null)} centered size="xl">
        <ModalBody className="p-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="fw-semibold text-truncate" style={{ maxWidth: "70%" }}>
              {previewFile?.originalName || "Quotation"}
            </div>
            <div className="d-flex gap-2">
              <a
                className="btn btn-light btn-sm"
                href={previewFile?.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="bx bx-link-external me-1"></i> Open in new tab
              </a>
              <Button size="sm" color="light" onClick={() => setPreviewFile(null)}>
                Close
              </Button>
            </div>
          </div>
          {previewFile &&
            (/\.(png|jpe?g|gif|webp)$/i.test(previewFile.originalName || previewFile.url) ? (
              <img
                src={previewFile.url}
                alt="Quotation"
                style={{ maxWidth: "100%", maxHeight: "75vh", display: "block", margin: "0 auto" }}
              />
            ) : (
              <iframe
                title="Quotation preview"
                src={previewFile.url}
                style={{ width: "100%", height: "75vh", border: 0 }}
              />
            ))}
        </ModalBody>
      </Modal>
    </div>
  );
};

export default RFQDetail;