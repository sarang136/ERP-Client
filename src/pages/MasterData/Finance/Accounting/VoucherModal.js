import React, { useState, useEffect } from "react";
import { Button, Input, Modal, ModalBody, Label } from "reactstrap";
import { toast } from "react-toastify";
import { getGlVoucherById, reverseGlVoucher } from "../../../../helpers/backend_helper";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { money, dateFmt, VOUCHER_TYPE_LABELS, errText } from "./ledgerUi";
import "../../UnitOfMeasurement/uom.scss";

// One voucher with its debit and credit lines. A posted voucher can be reversed (never edited or deleted).
const VoucherModal = ({ voucherId, canReverse, onClose, onChanged }) => {
  const handleAuthError = useAuthError();
  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reversing, setReversing] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!voucherId) {
      setVoucher(null);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setReversing(false);
    setReason("");
    getGlVoucherById(voucherId)
      .then((res) => !cancelled && setVoucher(res?.data || null))
      .catch((error) => {
        if (!cancelled) {
          onClose();
          if (!handleAuthError(error)) toast.error(errText(error, "Couldn't load the voucher."));
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voucherId]);

  const confirmReverse = async () => {
    if (busy) return;
    if (reason.trim().length < 3) return toast.error("Give a reason for the reversal");
    setBusy(true);
    try {
      const res = await reverseGlVoucher(voucherId, { reason: reason.trim() });
      toast.success(res?.message || "Voucher reversed");
      onChanged && onChanged();
      onClose();
    } catch (error) {
      if (!handleAuthError(error)) toast.error(errText(error, "Couldn't reverse the voucher"));
    } finally {
      setBusy(false);
    }
  };

  const entries = voucher?.entries || [];
  const totalDr = entries.reduce((s, e) => s + (e.debit || 0), 0);
  const totalCr = entries.reduce((s, e) => s + (e.credit || 0), 0);
  const canDoReverse = canReverse && voucher && voucher.status === "posted" && !voucher.reversalOf;

  return (
    <Modal isOpen={!!voucherId} toggle={() => !busy && onClose()} centered size="lg">
      <ModalBody className="p-4">
        {loading || !voucher ? (
          <div className="text-muted py-4 text-center">Loading voucher...</div>
        ) : (
          <>
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h5 className="mb-1">
                  <span className="uom-symbol-badge me-2">{voucher.voucherNumber}</span>
                  {VOUCHER_TYPE_LABELS[voucher.voucherType] || voucher.voucherType}
                </h5>
                <div className="text-muted small">
                  Posting date {dateFmt(voucher.postingDate)} · by {voucher.createdBy?.name || "—"}
                </div>
              </div>
              <span className={`uom-status-pill status-${voucher.status === "posted" ? "active" : "inactive"}`}>
                <span className="dot"></span> {voucher.reversalOf ? "Reversal" : voucher.status === "posted" ? "Posted" : "Reversed"}
              </span>
            </div>
            {voucher.narration && <div className="mb-3">{voucher.narration}</div>}

            <table className="table table-sm">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>#</th>
                  <th>Account</th>
                  <th className="text-end" style={{ width: 130 }}>
                    Debit
                  </th>
                  <th className="text-end" style={{ width: 130 }}>
                    Credit
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e._id}>
                    <td>{e.lineNo}</td>
                    <td>
                      <span className="uom-symbol-badge me-2">{e.ledgerCode}</span>
                      {e.ledgerName}
                      {e.narration && <div className="text-muted small">{e.narration}</div>}
                    </td>
                    <td className="text-end">{e.debit > 0 ? money(e.debit) : ""}</td>
                    <td className="text-end">{e.credit > 0 ? money(e.credit) : ""}</td>
                  </tr>
                ))}
                <tr className="fw-bold">
                  <td></td>
                  <td className="text-end">Total</td>
                  <td className="text-end">{money(totalDr)}</td>
                  <td className="text-end">{money(totalCr)}</td>
                </tr>
              </tbody>
            </table>

            {voucher.reversalOf && <div className="small text-muted">This reverses {voucher.reversalOf.voucherNumber}.</div>}
            {voucher.status === "reversed" && (
              <div className="small text-muted">
                Reversed by {voucher.reversedBy?.voucherNumber || "a reversal voucher"}. Reason: {voucher.reversalReason}
              </div>
            )}

            {reversing && (
              <div className="mt-3">
                <Label>
                  Reason for the reversal <span className="text-danger">*</span>
                </Label>
                <Input type="textarea" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Posted to the wrong account" />
                <div className="text-muted small mt-1">The original entries stay as they are. An opposite voucher is posted today.</div>
              </div>
            )}

            <div className="d-flex justify-content-end gap-2 mt-3">
              {reversing ? (
                <>
                  <Button color="light" onClick={() => setReversing(false)} disabled={busy}>
                    Back
                  </Button>
                  <Button color="danger" onClick={confirmReverse} disabled={busy}>
                    {busy ? "Reversing..." : "Confirm reversal"}
                  </Button>
                </>
              ) : (
                <>
                  {canDoReverse && (
                    <Button color="danger" outline onClick={() => setReversing(true)}>
                      Reverse voucher
                    </Button>
                  )}
                  <Button color="light" onClick={onClose}>
                    Close
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </ModalBody>
    </Modal>
  );
};

export default VoucherModal;
