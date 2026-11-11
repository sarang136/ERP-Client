import React, { useState, useEffect } from "react";
import { Button, Input, Label } from "reactstrap";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { getTrialBalance } from "../../../../helpers/backend_helper";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { usePermissions } from "../../../../Components/Hooks/useRoles.js";
import Basic404 from "../../../AuthenticationInner/Errors/Basic404";
import { money, errText } from "./ledgerUi";
import "../../UnitOfMeasurement/uom.scss";

const todayIso = () => new Date().toISOString().slice(0, 10);
const cell = (v) => (v > 0 ? money(v) : "");

// The check an accountant makes: every ledger's balance as on a date, and whether debits equal credits
const TrialBalance = ({ embedded = false }) => {
  const handleAuthError = useAuthError();
  const token = JSON.parse(localStorage.getItem("micrologin"))?.token;
  const { hasPermission } = usePermissions(token);
  const canView = hasPermission("MASTERDATA", "GL_ENTRY", "READ");

  const [asOn, setAsOn] = useState(todayIso());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getTrialBalance({ asOn })
      .then((res) => !cancelled && setData(res?.data || null))
      .catch((error) => {
        if (!cancelled && !handleAuthError(error)) toast.error(errText(error, "Couldn't load the trial balance."));
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asOn]);

  if (!canView) return <Basic404 />;

  const exportFile = () => {
    if (!data || data.rows.length === 0) return toast.error("Nothing to export");
    const rows = data.rows.map((r) => ({
      "Account Code": r.ledgerCode,
      "Account Name": r.name,
      "Sub Type": r.subType,
      "Opening Dr": r.openingDr || "",
      "Opening Cr": r.openingCr || "",
      Debit: r.debit || "",
      Credit: r.credit || "",
      "Closing Dr": r.closingDr || "",
      "Closing Cr": r.closingCr || "",
    }));
    rows.push({ "Account Name": "TOTAL", "Opening Dr": data.totals.openingDr, "Opening Cr": data.totals.openingCr, Debit: data.totals.debit, Credit: data.totals.credit, "Closing Dr": data.totals.closingDr, "Closing Cr": data.totals.closingCr });
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = Object.keys(rows[0]).map((k) => ({ wch: Math.max(14, k.length + 2) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Trial Balance");
    XLSX.writeFile(wb, `trial-balance-${data.asOn}.xlsx`);
  };

  const th = { fontSize: 12, textTransform: "uppercase", color: "#475569" };

  return (
    <div className={embedded ? "" : "uom-page"}>
      {embedded ? (
        <p className="text-muted small mb-3">Every ledger with its opening balance, the debits and credits posted, and what is left. The two closing totals must be equal.</p>
      ) : (
        <div className="uom-list-header">
          <div>
            <h4>Trial Balance</h4>
            <p>Every ledger with its opening balance, the debits and credits posted, and what is left. The two closing totals must be equal</p>
          </div>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-end mb-3 flex-wrap gap-2">
        <div>
          <Label className="small mb-1">As on</Label>
          <Input type="date" style={{ maxWidth: 180 }} value={asOn} max={todayIso()} onChange={(e) => e.target.value && setAsOn(e.target.value)} />
        </div>
        <Button color="light" onClick={exportFile}>
          <i className="bx bx-download me-1"></i> Export
        </Button>
      </div>

      {data && !loading && data.rows.length > 0 && (
        <div
          className="mb-3 p-3"
          style={{ borderRadius: 8, border: "1px solid", borderColor: data.balanced ? "#abefc6" : "#fecdca", background: data.balanced ? "#ecfdf3" : "#fef3f2", color: data.balanced ? "#067647" : "#b42318" }}
        >
          {data.balanced ? (
            <>
              <i className="bx bx-check-circle me-1"></i> Balanced: total debit and total credit are both ₹{money(data.totals.closingDr)}
            </>
          ) : (
            <>
              <i className="bx bx-error-circle me-1"></i> Not balanced: the difference is ₹{money(Math.abs(data.difference))} ({data.difference > 0 ? "debit is more" : "credit is more"}). Check the opening balances of the ledgers.
            </>
          )}
        </div>
      )}

      <div className="uom-table-card" style={{ overflowX: "auto" }}>
        {loading ? (
          <div className="text-muted p-4 text-center">Loading trial balance...</div>
        ) : !data || data.rows.length === 0 ? (
          <div className="uom-empty-state">
            <p className="uom-empty-title">Nothing to show yet</p>
            <p className="uom-empty-sub">A ledger appears here once it has an opening balance or an entry posted.</p>
          </div>
        ) : (
          <table className="table mb-0" style={{ minWidth: 1000 }}>
            <thead>
              <tr>
                <th style={th}>Code</th>
                <th style={th}>Account</th>
                <th style={th}>Sub Type</th>
                <th className="text-end" style={th}>Opening Dr</th>
                <th className="text-end" style={th}>Opening Cr</th>
                <th className="text-end" style={th}>Debit</th>
                <th className="text-end" style={th}>Credit</th>
                <th className="text-end" style={th}>Closing Dr</th>
                <th className="text-end" style={th}>Closing Cr</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.ledgerId}>
                  <td>
                    <span className="uom-symbol-badge">{r.ledgerCode}</span>
                  </td>
                  <td>{r.name}</td>
                  <td className="uom-cell-muted">{r.subType}</td>
                  <td className="text-end">{cell(r.openingDr)}</td>
                  <td className="text-end">{cell(r.openingCr)}</td>
                  <td className="text-end">{cell(r.debit)}</td>
                  <td className="text-end">{cell(r.credit)}</td>
                  <td className="text-end fw-semibold">{cell(r.closingDr)}</td>
                  <td className="text-end fw-semibold">{cell(r.closingCr)}</td>
                </tr>
              ))}
              <tr className="fw-bold" style={{ background: "#f8fafc" }}>
                <td></td>
                <td>TOTAL</td>
                <td></td>
                <td className="text-end">{money(data.totals.openingDr)}</td>
                <td className="text-end">{money(data.totals.openingCr)}</td>
                <td className="text-end">{money(data.totals.debit)}</td>
                <td className="text-end">{money(data.totals.credit)}</td>
                <td className="text-end">{money(data.totals.closingDr)}</td>
                <td className="text-end">{money(data.totals.closingCr)}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TrialBalance;
