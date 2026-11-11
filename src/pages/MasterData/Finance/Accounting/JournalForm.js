import React, { useState, useEffect, useRef } from "react";
import { Row, Col, Label, Input, Button } from "reactstrap";
import { toast } from "react-toastify";
import { getLedgers, createJournalVoucher } from "../../../../helpers/backend_helper";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { money, newRequestId, errText } from "./ledgerUi";
import "../../UnitOfMeasurement/uom.scss";

const todayIso = () => new Date().toISOString().slice(0, 10);
const emptyLine = () => ({ ledgerId: "", debit: "", credit: "", narration: "" });
const paise = (v) => Math.round((Number(v) || 0) * 100);

// A journal voucher: a date, what it is for, and lines of debit and credit that must add up equal.
const JournalForm = ({ onSaved, onCancel }) => {
  const handleAuthError = useAuthError();
  const requestId = useRef(newRequestId()); // one per form, so a double click posts one voucher

  const [ledgers, setLedgers] = useState([]);
  const [postingDate, setPostingDate] = useState(todayIso());
  const [narration, setNarration] = useState("");
  const [lines, setLines] = useState([emptyLine(), emptyLine()]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Only ledgers that can be posted to: not group accounts, and active
    getLedgers({ postingType: "detail", status: "active", limit: 200 })
      .then((res) => setLedgers(res?.data || []))
      .catch(() => {});
  }, []);

  const setLine = (idx, patch) => setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (idx) => setLines((prev) => (prev.length > 2 ? prev.filter((_, i) => i !== idx) : prev));

  const totalDr = lines.reduce((s, l) => s + paise(l.debit), 0);
  const totalCr = lines.reduce((s, l) => s + paise(l.credit), 0);
  const balanced = totalDr === totalCr && totalDr > 0;
  const diff = (totalDr - totalCr) / 100;

  const submit = async (e) => {
    e?.preventDefault();
    if (saving) return;
    if (!postingDate) return toast.error("Choose the posting date");
    if (narration.trim().length < 3) return toast.error("Write what this entry is for (narration)");
    for (let i = 0; i < lines.length; i += 1) {
      const l = lines[i];
      if (!l.ledgerId) return toast.error(`Line ${i + 1}: choose the ledger`);
      const d = paise(l.debit);
      const c = paise(l.credit);
      if ((d > 0) === (c > 0)) return toast.error(`Line ${i + 1}: enter either a debit or a credit amount`);
    }
    if (!balanced) return toast.error("Debit and credit must be equal");

    setSaving(true);
    try {
      const res = await createJournalVoucher({
        postingDate,
        narration: narration.trim(),
        requestId: requestId.current,
        lines: lines.map((l) => ({
          ledgerId: l.ledgerId,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
          ...(l.narration.trim() ? { narration: l.narration.trim() } : {}),
        })),
      });
      toast.success(res?.message || "Journal voucher posted");
      onSaved();
    } catch (error) {
      if (!handleAuthError(error)) toast.error(errText(error, "Something went wrong"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="uom-form-page">
      <h4 className="uom-form-title">New Journal Voucher</h4>
      <p className="text-muted mb-4">
        Move an amount from one account to another. Every line is either a debit or a credit, and the two sides must add up the same. Once posted it cannot be edited, only reversed.
      </p>

      <div className="uom-form-panel">
        <form onSubmit={submit}>
          <Row>
            <Col md={3} className="mb-3">
              <Label>
                Posting Date <span className="text-danger">*</span>
              </Label>
              <Input type="date" value={postingDate} max={todayIso()} onChange={(e) => setPostingDate(e.target.value)} />
            </Col>
            <Col md={9} className="mb-3">
              <Label>
                Narration <span className="text-danger">*</span>
              </Label>
              <Input value={narration} onChange={(e) => setNarration(e.target.value)} placeholder="What is this entry for? e.g. Opening balance of HDFC Bank" />
            </Col>
          </Row>

          <h6 className="uom-form-section-title mt-2">Lines</h6>
          <div className="uom-table-card mb-3" style={{ overflowX: "auto" }}>
            <table className="table mb-0 uom-line-inputs" style={{ minWidth: 860 }}>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th style={{ minWidth: 300 }}>Account (ledger)</th>
                  <th style={{ width: 150 }}>Debit</th>
                  <th style={{ width: 150 }}>Credit</th>
                  <th style={{ minWidth: 180 }}>Line note (optional)</th>
                  <th style={{ width: 50 }}></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, idx) => (
                  <tr key={idx}>
                    <td className="align-middle">{idx + 1}</td>
                    <td>
                      <Input type="select" bsSize="sm" value={l.ledgerId} onChange={(e) => setLine(idx, { ledgerId: e.target.value })}>
                        <option value="">Select ledger</option>
                        {ledgers.map((x) => (
                          <option key={x._id} value={x._id}>
                            {x.ledgerCode} · {x.name}
                          </option>
                        ))}
                      </Input>
                    </td>
                    <td>
                      <Input
                        type="number"
                        bsSize="sm"
                        min={0}
                        step="0.01"
                        value={l.debit}
                        placeholder="0.00"
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => setLine(idx, { debit: e.target.value, ...(e.target.value ? { credit: "" } : {}) })}
                      />
                    </td>
                    <td>
                      <Input
                        type="number"
                        bsSize="sm"
                        min={0}
                        step="0.01"
                        value={l.credit}
                        placeholder="0.00"
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => setLine(idx, { credit: e.target.value, ...(e.target.value ? { debit: "" } : {}) })}
                      />
                    </td>
                    <td>
                      <Input bsSize="sm" value={l.narration} onChange={(e) => setLine(idx, { narration: e.target.value })} />
                    </td>
                    <td className="align-middle">
                      <Button size="sm" color="light" type="button" disabled={lines.length <= 2} onClick={() => removeLine(idx)}>
                        <i className="bx bx-trash text-danger"></i>
                      </Button>
                    </td>
                  </tr>
                ))}
                <tr className="fw-bold">
                  <td></td>
                  <td className="text-end">Total</td>
                  <td>₹{money(totalDr / 100)}</td>
                  <td>₹{money(totalCr / 100)}</td>
                  <td colSpan={2}>
                    {balanced ? (
                      <span className="text-success">
                        <i className="bx bx-check-circle me-1"></i>Balanced
                      </span>
                    ) : (
                      <span className="text-danger">
                        <i className="bx bx-error-circle me-1"></i>
                        {totalDr === 0 && totalCr === 0 ? "Enter the amounts" : `Difference ₹${money(Math.abs(diff))} (${diff > 0 ? "debit is more" : "credit is more"})`}
                      </span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <Button type="button" color="light" size="sm" className="mb-4" onClick={addLine}>
            <i className="bx bx-plus me-1"></i> Add line
          </Button>

          <div className="uom-form-footer d-flex justify-content-end gap-2">
            <Button type="button" color="light" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" color="primary" disabled={saving || !balanced}>
              {saving ? "Posting..." : "Post Voucher"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JournalForm;
