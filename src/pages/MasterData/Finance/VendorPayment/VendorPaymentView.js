import React, { useEffect, useState } from "react";
import { Button, Input, Modal, ModalBody, Row, Col } from "reactstrap";
import { toast } from "react-toastify";
import { getVendorPaymentById, cancelVendorPayment } from "../../../../helpers/backend_helper";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { PayPill, money, errText, dateText, supplierName } from "./vpUi";

const Fact = ({ label, value }) => (
  <div className="mb-2">
    <div className="text-muted small">{label}</div>
    <div className="fw-semibold">{value || "—"}</div>
  </div>
);

// One step of the approval that happens in Central Payment
const Step = ({ label, state, note }) => {
  const cls = state === "APPROVED" ? "bg-success-subtle text-success" : state === "REJECTED" ? "bg-danger-subtle text-danger" : "bg-warning-subtle text-warning";
  const text = state === "APPROVED" ? "Approved" : state === "REJECTED" ? "Rejected" : "Waiting";
  return (
    <div className="d-flex align-items-start gap-2 mb-2">
      <span className={`badge ${cls}`} style={{ minWidth: 76 }}>{text}</span>
      <div>
        <div className="fw-semibold">{label}</div>
        {note && <div className="text-muted small">{note}</div>}
      </div>
    </div>
  );
};

// One payment request. It is approved and paid in Central Payment; this page shows where it stands there.
const VendorPaymentView = ({ paymentId, canWrite, onClose, onChanged }) => {
  const handleAuthError = useAuthError();
  const [pay, setPay] = useState(null);
  const [busy, setBusy] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");

  const load = () =>
    getVendorPaymentById(paymentId)
      .then((res) => setPay(res?.data || null))
      .catch((e) => {
        onClose();
        if (!handleAuthError(e)) toast.error(errText(e, "Couldn't load the payment."));
      });

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId]);

  const cancel = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await cancelVendorPayment(pay._id, reason.trim());
      toast.success(res?.message || "Cancelled");
      onChanged();
      setCancelling(false);
      await load();
    } catch (e) {
      if (!handleAuthError(e)) toast.error(errText(e, "That didn't work."));
    } finally {
      setBusy(false);
    }
  };

  const s = pay?.status;
  const cp = pay?.centralPaymentId && typeof pay.centralPaymentId === "object" ? pay.centralPaymentId : null;
  const bank = pay?.vendorId?.bankDetails;
  const legacyOpen = pay && !pay.centralPaymentId && ["pending_approval", "approved", "failed"].includes(s); // raised before Central Payment was linked

  return (
    <Modal isOpen toggle={onClose} centered size="lg" scrollable>
      <ModalBody className="p-4">
        {!pay ? (
          <div className="text-muted py-5 text-center">Loading...</div>
        ) : (
          <>
            <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
              <div>
                <h5 className="mb-1"><span className="uom-symbol-badge me-2">{pay.paymentNumber}</span>{money(pay.netPayable)}</h5>
                <div className="text-muted small">{supplierName(pay.vendorId)} · for {pay.invoiceNumber} ({pay.invoiceRecordNumber})</div>
              </div>
              <PayPill status={s} />
            </div>

            {s === "rejected" && pay.rejectReason && <div className="alert alert-danger py-2"><strong>Rejected in Central Payment:</strong> {pay.rejectReason}. The amount is free on the bill again, so you can raise a new request.</div>}
            {s === "cancelled" && pay.rejectReason && <div className="alert alert-secondary py-2"><strong>Cancelled:</strong> {pay.rejectReason}</div>}
            {legacyOpen && <div className="alert alert-warning py-2">This request was raised before payments went through Central Payment, so it is not in Central Payment. Cancel it and raise it again.</div>}

            <Row>
              <Col md={4}>
                <Fact label="Payment amount (settles the bill)" value={money(pay.amount)} />
                <Fact label="TDS" value={money(pay.tdsAmount)} />
                <Fact label="Net payable" value={money(pay.netPayable)} />
              </Col>
              <Col md={4}>
                <Fact label="Due date" value={dateText(pay.dueDate)} />
                <Fact label="Centre" value={pay.centerId?.title} />
                <Fact label="Category" value={pay.category ? pay.category.replace(/_/g, " ") : ""} />
                <Fact label="Raised by" value={`${pay.requestedBy?.name || "—"} · ${dateText(pay.createdAt)}`} />
              </Col>
              <Col md={4}>
                <Fact label="Pay to" value={bank?.accountHolderName || supplierName(pay.vendorId)} />
                <Fact label="Account / IFSC" value={bank?.accountNo ? `${bank.accountNo} · ${bank.ifsc || "—"}` : "No bank details"} />
                {s === "paid" && <Fact label="UTR / transaction id" value={pay.utr} />}
                {s === "paid" && <Fact label="Paid on" value={dateText(pay.paidDate)} />}
              </Col>
            </Row>

            {pay.centralPaymentNo && (
              <div className="border rounded p-3 mt-2">
                <div className="fw-semibold mb-2">In Central Payment · No. {pay.centralPaymentNo}</div>
                {cp ? (
                  <>
                    <Step label="Manager approval" state={cp.approvalStatus} note={cp.approvalRemarks} />
                    <Step label="Accounting approval" state={cp.accountingApprovalStatus} note={cp.accountingApprovalRemarks} />
                    <Step label="Finance approval" state={cp.financeApprovalStatus} note={cp.financeApprovalRemarks} />
                    <Step label="Payment" state={cp.currentPaymentStatus === "COMPLETED" ? "APPROVED" : cp.currentPaymentStatus === "REJECTED" ? "REJECTED" : "PENDING"} note={cp.currentPaymentStatus === "COMPLETED" ? "Paid" : "Processed and paid by the finance team in Central Payment"} />
                  </>
                ) : (
                  <div className="text-muted small">This entry could not be found in Central Payment.</div>
                )}
              </div>
            )}

            {pay.invoiceId && (
              <div className="text-muted small mt-2">
                Bill total {money(pay.invoiceId.totalAmount)} · paid so far {money((pay.invoiceId.paidPaise || 0) / 100)} · asked for in all {money((pay.invoiceId.requestedPaise || 0) / 100)}
              </div>
            )}

            {cancelling && (
              <div className="mt-3 border rounded p-3">
                <div className="fw-semibold mb-2">Reason for cancelling (optional)</div>
                <Input type="textarea" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />
              </div>
            )}

            <div className="d-flex justify-content-end gap-2 mt-4 flex-wrap">
              <Button color="light" onClick={onClose} disabled={busy}>Close</Button>
              {canWrite && legacyOpen && !cancelling && <Button color="danger" outline onClick={() => setCancelling(true)}>Cancel request</Button>}
              {canWrite && legacyOpen && cancelling && (
                <>
                  <Button color="light" disabled={busy} onClick={() => { setCancelling(false); setReason(""); }}>Back</Button>
                  <Button color="danger" disabled={busy} onClick={cancel}>{busy ? "Saving..." : "Confirm"}</Button>
                </>
              )}
            </div>
          </>
        )}
      </ModalBody>
    </Modal>
  );
};

export default VendorPaymentView;
