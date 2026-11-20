import React, { useCallback, useEffect, useState } from "react";
import { Button } from "reactstrap";
import { toast } from "react-toastify";
import { getVendorPaymentSchedule, saveVendorPaymentSchedule } from "../../../../helpers/backend_helper";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { usePermissions } from "../../../../Components/Hooks/useRoles.js";
import Basic404 from "../../../AuthenticationInner/Errors/Basic404";
import { upcomingRuns } from "./scheduleUtil";
import { money, errText } from "../VendorInvoice/viUi";
import "../../UnitOfMeasurement/uom.scss";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const longDate = (d) => new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
const MAX_DAYS = 3;

const PaymentSchedule = () => {
  const handleAuthError = useAuthError();
  const token = JSON.parse(localStorage.getItem("micrologin"))?.token;
  const { hasPermission } = usePermissions(token);
  const canView = hasPermission("MASTERDATA", "PAYMENT_SCHEDULE", "READ");
  const canWrite = hasPermission("MASTERDATA", "PAYMENT_SCHEDULE", "WRITE");

  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(null); // { schedule, runs }
  const [editing, setEditing] = useState(false);
  const [frequency, setFrequency] = useState("monthly");
  const [days, setDays] = useState([]);
  const [basis, setBasis] = useState("invoice_added");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    getVendorPaymentSchedule()
      .then((res) => setSaved(res?.data || { schedule: null, runs: [] }))
      .catch((e) => !handleAuthError(e) && toast.error(errText(e, "Couldn't load the schedule.")))
      .finally(() => setLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!canView) return <Basic404 />;

  const startEdit = () => {
    const s = saved?.schedule;
    setFrequency(s?.frequency || "monthly");
    setDays(s?.days || []);
    setBasis(s?.basis || "invoice_added");
    setEditing(true);
  };

  const pickDay = (d) => setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : cur.length >= MAX_DAYS ? cur : [...cur, d]));
  const switchFrequency = (f) => {
    if (f !== frequency) setDays([]);
    setFrequency(f);
  };

  const save = async () => {
    if (saving) return;
    if (!days.length) return toast.error("Pick at least one run day");
    setSaving(true);
    try {
      const res = await saveVendorPaymentSchedule({ frequency, days, basis });
      toast.success(res?.message || "Schedule saved");
      setEditing(false);
      load();
    } catch (e) {
      if (!handleAuthError(e)) toast.error(errText(e, "Couldn't save the schedule."));
    } finally {
      setSaving(false);
    }
  };

  const basisText = (b) => (b === "invoice_added" ? "when an invoice is added" : "when an invoice is approved");
  const preview = days.length ? upcomingRuns({ frequency, days, basis }, 3) : [];
  const s = saved?.schedule;

  return (
    <div className="uom-page">
      <div className="uom-list-header">
        <div>
          <h4>Payment schedule</h4>
          <p>When vendor bills fall due for payment runs</p>
        </div>
        {canWrite && s && !editing && <Button color="light" onClick={startEdit}><i className="bx bx-edit-alt me-1"></i>Edit schedule</Button>}
      </div>

      <div className="uom-table-card p-4" style={{ maxWidth: 980 }}>
        <h6 className="mb-0">Payment runs</h6>
        <div className="text-muted small mb-3">{editing ? "Pick the days you pay vendors. Every invoice is given the next run as its due date." : "The days you pay vendors. Every invoice is given the next run as its due date."}</div>

        {!loaded ? (
          <div className="text-muted py-4">Loading...</div>
        ) : !editing && !s ? (
          <div className="text-center py-5 border rounded" style={{ borderStyle: "dashed" }}>
            <div className="fw-semibold">No payment schedule yet</div>
            <div className="text-muted small mx-auto mb-3" style={{ maxWidth: 520 }}>
              Until one is set, invoices that are saved without a due date get no due date lined up with a payment run, and the bank batch has nothing to be built from.
            </div>
            {canWrite ? <Button color="dark" onClick={startEdit}>Set up schedule</Button> : <div className="text-muted small">Ask someone with write access to set it up.</div>}
          </div>
        ) : editing ? (
          <div className="row">
            <div className="col-lg-8">
              <div className="mb-3">
                <div className="fw-semibold mb-1">How often</div>
                <div className="btn-group">
                  {["monthly", "weekly"].map((f) => (
                    <Button key={f} color={frequency === f ? "dark" : "light"} onClick={() => switchFrequency(f)}>{f === "monthly" ? "Monthly" : "Weekly"}</Button>
                  ))}
                </div>
              </div>
              <div className="mb-1 d-flex justify-content-between">
                <span className="fw-semibold">{frequency === "monthly" ? "Run on these dates" : "Run on these days"}</span>
                <span className="text-muted small">{days.length} of {MAX_DAYS} picked</span>
              </div>
              <div className="d-flex flex-wrap gap-2 mb-1">
                {(frequency === "monthly" ? Array.from({ length: 31 }, (_, i) => i + 1) : [1, 2, 3, 4, 5, 6, 0]).map((d) => {
                  const on = days.includes(d);
                  const locked = !on && days.length >= MAX_DAYS;
                  return (
                    <button key={d} type="button" disabled={locked} onClick={() => pickDay(d)}
                      className={`btn ${on ? "btn-dark" : "btn-outline-secondary"}`} style={{ minWidth: frequency === "monthly" ? 46 : 64, opacity: locked ? 0.4 : 1 }}>
                      {frequency === "monthly" ? d : WEEKDAYS[d]}
                    </button>
                  );
                })}
              </div>
              <div className="text-muted small mb-3">Pick up to {MAX_DAYS}.{frequency === "monthly" ? " A date a short month does not have (like 31 in February) falls on the last day of that month." : ""}</div>

              <div className="fw-semibold mb-1">Count the due date from</div>
              <div className="d-flex gap-2 flex-wrap">
                {[
                  ["invoice_added", "When the invoice is added", "An invoice joins the first run on or after the day it is recorded."],
                  ["invoice_approved", "When the invoice is approved", "An invoice joins the first run on or after the day it is approved, so bills waiting on approval never take a run slot."],
                ].map(([key, title, text]) => (
                  <button key={key} type="button" onClick={() => setBasis(key)} className={`btn text-start ${basis === key ? "border-dark" : "border"}`} style={{ flex: "1 1 260px", borderWidth: basis === key ? 2 : 1 }}>
                    <div className="fw-semibold">{title}</div>
                    <div className="text-muted small">{text}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="col-lg-4 mt-3 mt-lg-0">
              <div className="rounded p-3 bg-light">
                <div className="text-muted small text-uppercase">Preview</div>
                <div className="fw-semibold">{frequency === "monthly" ? "Monthly" : "Weekly"}</div>
                <div className="text-muted small mb-2">counted from {basisText(basis)}</div>
                <div className="text-muted small text-uppercase">Next {MAX_DAYS} runs</div>
                {preview.length ? preview.map((d) => <div key={+d}>{longDate(d)}</div>) : <div className="text-muted small">Pick a day to see when the next runs fall.</div>}
              </div>
            </div>
            <div className="col-12 d-flex justify-content-between align-items-center border-top mt-4 pt-3">
              <span className="text-muted small">{days.length ? "It applies to bills from now on. Bills that already have a due date keep it." : "Pick at least one run day to save."}</span>
              <div className="d-flex gap-2">
                <Button color="light" disabled={saving} onClick={() => setEditing(false)}>Cancel</Button>
                <Button color="dark" disabled={saving || !days.length} onClick={save}>{saving ? "Saving..." : "Save schedule"}</Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="border rounded p-3 mb-3 bg-light">
              <div className="fw-semibold">{s.text}</div>
              <div className="text-muted small">Due date counted from {basisText(s.basis)}.</div>
            </div>
            <div className="fw-semibold mb-2">Next runs and what falls due by each</div>
            <div className="table-responsive">
              <table className="table table-sm align-middle">
                <thead><tr><th>Run</th><th>Bills due</th><th className="text-end">Amount to pay</th></tr></thead>
                <tbody>
                  {saved.runs.map((r, i) => (
                    <tr key={+new Date(r.date)}>
                      <td>{longDate(r.date)}{i === 0 && <span className="text-muted small ms-2">(includes anything already overdue)</span>}</td>
                      <td>{r.count}</td>
                      <td className="text-end">{money(r.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-muted small">Bills saved without a due date are given the next run. A due date typed on a bill is never overwritten.</div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSchedule;
