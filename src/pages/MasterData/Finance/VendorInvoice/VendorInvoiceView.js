import React, { useEffect, useMemo, useState } from "react";
import { Button, Input, Modal, ModalBody, Label, Row, Col } from "reactstrap";
import Select from "react-select";
import { toast } from "react-toastify";
import {
  getVendorInvoiceById,
  approveVendorInvoice,
  rejectVendorInvoice,
  submitVendorInvoice,
} from "../../../../helpers/backend_helper";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { StagePill, TYPE_LABELS, fetchPostingLedgers, money, errText, dateText, fileSize, supplierName } from "./viUi";
import "../../UnitOfMeasurement/uom.scss";

const Fact = ({ label, value }) => (
  <div className="mb-2">
    <div className="text-muted small">{label}</div>
    <div className="fw-semibold">{value || "—"}</div>
  </div>
);

const paise = (v) => Math.round((Number(v) || 0) * 100);

// Shows one bill. A bill that is waiting for approval can be approved (with its ledger allocation) or sent back from here.
const VendorInvoiceView = ({ invoiceId, canWrite, onClose, onChanged, onEdit }) => {
  const handleAuthError = useAuthError();
  const [inv, setInv] = useState(null);
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [ledgers, setLedgers] = useState([]);
  const [lines, setLines] = useState([]);

  const load = () =>
    getVendorInvoiceById(invoiceId)
      .then((res) => setInv(res?.data || null))
      .catch((e) => {
        onClose();
        if (!handleAuthError(e)) toast.error(errText(e, "Couldn't load the bill."));
      });

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  const awaiting = inv?.stage === "awaiting_approval";
  const needsAllocation = awaiting && (inv?.allocations || []).length === 0;

  useEffect(() => {
    if (!needsAllocation) return;
    fetchPostingLedgers()
      .then((rows) => setLedgers(rows))
      .catch(() => {});
  }, [needsAllocation]);

  const ledgerOptions = useMemo(() => ledgers.map((l) => ({ value: l._id, label: `${l.ledgerCode} · ${l.name}` })), [ledgers]);
  const allocated = lines.reduce((s, l) => s + paise(l.amount), 0);

  const run = async (fn, okMessage) => {
    if (busy) return false;
    setBusy(true);
    try {
      const res = await fn();
      toast.success(res?.message || okMessage);
      onChanged();
      await load();
      return true;
    } catch (e) {
      if (!handleAuthError(e)) toast.error(errText(e, "That didn't work."));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const approve = () => {
    if (lines.length) {
      if (lines.some((l) => !l.ledgerId || !(Number(l.amount) > 0))) return toast.error("Choose a ledger and an amount on every allocation line, or remove the line");
      if (allocated !== paise(inv.totalAmount)) return toast.error(`The allocation (${money(allocated / 100)}) must equal the bill total (${money(inv.totalAmount)})`);
    }
    run(
      () => approveVendorInvoice(inv._id, lines.length ? { allocations: lines.map((l) => ({ ledgerId: l.ledgerId, amount: Number(l.amount) })) } : {}),
      "Bill approved",
    );
  };

  const reject = async () => {
    if (reason.trim().length < 3) return toast.error("Give a reason (at least 3 characters)");
    const done = await run(() => rejectVendorInvoice(inv._id, reason.trim()), "Bill sent back");
    if (done) {
      setRejecting(false);
      setReason("");
    }
  };

  const a = inv?.approval || {};
  const direct = inv?.source === "direct";
  const canEditBill = canWrite && direct && ["draft", "rejected"].includes(a.status);

  return (
    <Modal isOpen toggle={onClose} centered size="xl" scrollable>
      <ModalBody className="p-4">
        {!inv ? (
          <div className="text-muted py-5 text-center">Loading...</div>
        ) : (
          <>
            <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
              <div>
                <h5 className="mb-1">
                  <span className="uom-symbol-badge me-2">{inv.invoiceRecordNumber}</span>
                  {inv.vendorInvoiceNumber}
                </h5>
                <div className="text-muted small">
                  {TYPE_LABELS[inv.invoiceType] || "Tax invoice"} · {supplierName(inv.vendorId)}
                  {inv.poId?.poNumber ? ` · ${inv.poId.poNumber}` : direct ? " · no PO" : ""}
                </div>
              </div>
              <StagePill stage={inv.stage} />
            </div>

            {a.status === "rejected" && a.rejectReason && (
              <div className="alert alert-danger py-2">
                <strong>Sent back:</strong> {a.rejectReason}
                <span className="text-muted small"> ({a.rejectedBy?.name || "—"}, {dateText(a.rejectedAt)})</span>
              </div>
            )}

            <Row>
              <Col md={4}>
                <Fact label="Supplier invoice date" value={dateText(inv.vendorInvoiceDate)} />
                <Fact label="Due date" value={dateText(inv.dueDate)} />
                <Fact label="Payment term" value={inv.paymentTermId?.code ? `${inv.paymentTermId.code} · ${inv.paymentTermId.paymentType}${inv.paymentTermId.dueDays ? `, ${inv.paymentTermId.dueDays} days` : ""}` : ""} />
                <Fact label="Department" value={inv.departmentId?.name} />
                <Fact label="Purpose" value={inv.purpose} />
              </Col>
              <Col md={4}>
                <Fact label="Taxable amount" value={money(inv.subtotal)} />
                <Fact label="Tax" value={money(inv.taxAmount)} />
                <Fact label="Payable total" value={money(inv.totalAmount)} />
                <Fact label="Buyer" value={inv.buyerName || "Jagruti Rehab Centre Private Limited"} />
                <Fact label="Buyer GSTIN" value={inv.buyerGstin} />
              </Col>
              <Col md={4}>
                <Fact label="Raised by" value={`${inv.createdBy?.name || "—"} · ${dateText(inv.createdAt)}`} />
                {a.submittedAt && <Fact label="Sent for approval" value={`${a.submittedBy?.name || "—"} · ${dateText(a.submittedAt)}`} />}
                {a.approvedAt && <Fact label="Approved" value={`${a.approvedBy?.name || "—"} · ${dateText(a.approvedAt)}`} />}
                <Fact label="Remarks" value={inv.remarks} />
              </Col>
            </Row>

            {!direct && (inv.lineItems || []).length > 0 && (
              <>
                <h6 className="mt-3">Three-way match</h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead><tr><th>Item</th><th>GRN qty</th><th>Billed qty</th><th>PO rate</th><th>Billed rate</th><th>Amount</th></tr></thead>
                    <tbody>
                      {inv.lineItems.map((li) => (
                        <tr key={li._id}>
                          <td>{li.itemName}</td><td>{li.grnQty}</td>
                          <td className={li.qtyMatch ? "" : "text-danger"}>{li.invoicedQty}</td>
                          <td>{money(li.poRate)}</td>
                          <td className={li.rateMatch ? "" : "text-danger"}>{money(li.invoicedRate)}</td>
                          <td>{money(li.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <h6 className="mt-3">Accounting</h6>
            {(inv.allocations || []).length > 0 ? (
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead><tr><th>Ledger</th><th className="text-end">Amount</th><th>Note</th></tr></thead>
                  <tbody>
                    {inv.allocations.map((al, i) => (
                      <tr key={i}>
                        <td>{al.ledgerId ? `${al.ledgerId.ledgerCode} · ${al.ledgerId.name}` : "—"}</td>
                        <td className="text-end">{money(al.amount)}</td>
                        <td>{al.note || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : needsAllocation && canWrite ? (
              <div className="mb-2">
                <div className="text-muted small mb-2">Not allocated yet. You may say which ledgers this bill belongs to before approving (optional).</div>
                {lines.map((l, i) => (
                  <Row key={i} className="g-2 mb-2">
                    <Col md={7}>
                      <Select options={ledgerOptions} value={ledgerOptions.find((o) => o.value === l.ledgerId) || null} placeholder="Choose a ledger"
                        onChange={(o) => setLines((ls) => ls.map((x, idx) => (idx === i ? { ...x, ledgerId: o?.value || "" } : x)))} />
                    </Col>
                    <Col md={4}>
                      <Input type="number" min="0" step="0.01" value={l.amount} placeholder="Amount"
                        onChange={(e) => setLines((ls) => ls.map((x, idx) => (idx === i ? { ...x, amount: e.target.value } : x)))} />
                    </Col>
                    <Col md={1}><Button size="sm" color="light" onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))}><i className="bx bx-trash text-danger"></i></Button></Col>
                  </Row>
                ))}
                <div className="d-flex gap-2 align-items-center">
                  <Button size="sm" color="light" onClick={() => setLines([{ ledgerId: "", amount: String(inv.totalAmount) }])}>Allocate full amount</Button>
                  <Button size="sm" color="light" onClick={() => setLines((ls) => [...ls, { ledgerId: "", amount: "" }])}>Add a line</Button>
                  {lines.length > 0 && (
                    <span className={allocated === paise(inv.totalAmount) ? "text-success small" : "text-danger small"}>
                      Allocated {money(allocated / 100)} of {money(inv.totalAmount)}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-muted small">Not allocated.</div>
            )}

            <h6 className="mt-3">Documents</h6>
            {inv.supplierInvoiceFile?.url || (inv.supportingDocs || []).length ? (
              <ul className="list-unstyled small mb-0">
                {inv.supplierInvoiceFile?.url && (
                  <li><i className="bx bx-file me-1"></i><a href={inv.supplierInvoiceFile.url} target="_blank" rel="noreferrer">Supplier invoice · {inv.supplierInvoiceFile.originalName}</a> <span className="text-muted">({fileSize(inv.supplierInvoiceFile.size)})</span></li>
                )}
                {(inv.supportingDocs || []).map((d) => (
                  <li key={d.path}><i className="bx bx-paperclip me-1"></i><a href={d.url} target="_blank" rel="noreferrer">{d.originalName}</a> <span className="text-muted">({fileSize(d.size)})</span></li>
                ))}
              </ul>
            ) : (
              <div className="text-muted small">No documents attached.</div>
            )}

            {rejecting && (
              <div className="mt-3">
                <Label>Reason for sending it back</Label>
                <Input type="textarea" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Say what must be corrected" />
              </div>
            )}

            <div className="d-flex justify-content-end gap-2 mt-4 flex-wrap">
              <Button color="light" onClick={onClose} disabled={busy}>Close</Button>
              {canEditBill && <Button color="light" onClick={() => onEdit(inv)}>Edit</Button>}
              {canWrite && direct && ["draft", "rejected"].includes(a.status) && (
                <Button color="primary" disabled={busy} onClick={() => run(() => submitVendorInvoice(inv._id), "Bill sent for approval")}>Submit for approval</Button>
              )}
              {canWrite && awaiting && !rejecting && (
                <>
                  <Button color="danger" outline disabled={busy} onClick={() => setRejecting(true)}>Reject</Button>
                  <Button color="success" disabled={busy} onClick={approve}>{busy ? "Approving..." : "Approve"}</Button>
                </>
              )}
              {canWrite && awaiting && rejecting && (
                <>
                  <Button color="light" disabled={busy} onClick={() => { setRejecting(false); setReason(""); }}>Back</Button>
                  <Button color="danger" disabled={busy} onClick={reject}>{busy ? "Sending..." : "Send back"}</Button>
                </>
              )}
            </div>
          </>
        )}
      </ModalBody>
    </Modal>
  );
};

export default VendorInvoiceView;
