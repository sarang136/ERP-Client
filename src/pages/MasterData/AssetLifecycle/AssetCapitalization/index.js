import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { Button, Input, Label } from "reactstrap";
import { toast } from "react-toastify";
import {
  getAssetCapitalizations,
  getReadyCWIPs,
  createAssetCapitalization,
} from "../../../../helpers/backend_helper";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { usePermissions } from "../../../../Components/Hooks/useRoles.js";
import { errText } from "../shared/assetUi";
import "../../UnitOfMeasurement/uom.scss";

const dateFmt = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "—");
const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const AssetCapitalization = () => {
  const handleAuthError = useAuthError();
  const token = JSON.parse(localStorage.getItem("micrologin"))?.token;
  const { hasPermission } = usePermissions(token);
  const canCreate = hasPermission("MASTERDATA", "ASSET_CAPITALIZATION", "WRITE");

  const [view, setView] = useState("list");
  const [records, setRecords] = useState([]);
  const [readyCwips, setReadyCwips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [loadError, setLoadError] = useState("");

  const [selectedCwip, setSelectedCwip] = useState(null);
  const [usefulLifeYears, setUsefulLifeYears] = useState(5);
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (view !== "list") return;
    let cancelled = false;
    setLoading(true);
    setLoadError("");
    getAssetCapitalizations()
      .then((res) => {
        if (!cancelled) setRecords(res?.data || []);
      })
      .catch((error) => {
        if (cancelled) return;
        if (!handleAuthError(error)) setLoadError(errText(error, "Couldn't load capitalizations."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, refreshFlag]);

  const openSelectCwip = () => {
    setLoading(true);
    setLoadError("");
    getReadyCWIPs()
      .then((res) => setReadyCwips(res?.data || []))
      .catch((error) => {
        setReadyCwips([]);
        if (!handleAuthError(error)) setLoadError(errText(error, "Couldn't load CWIP records."));
      })
      .finally(() => setLoading(false));
    setView("select-cwip");
  };

  const selectCwip = (cwip) => {
    setSelectedCwip(cwip);
    setUsefulLifeYears(5);
    setRemarks("");
    setView("form");
  };

  const annualDepreciation = selectedCwip
    ? Math.round((selectedCwip.totalCost / (Number(usefulLifeYears) || 1)) * 100) / 100
    : 0;

  const handleSubmit = async () => {
    if (!Number.isInteger(Number(usefulLifeYears)) || Number(usefulLifeYears) < 1) {
      return toast.error("Useful life must be a whole number of years, at least 1");
    }
    setSubmitting(true);
    try {
      await createAssetCapitalization({
        cwipId: selectedCwip._id,
        usefulLifeYears: Number(usefulLifeYears),
        remarks,
      });
      toast.success("Asset capitalized successfully — added to Fixed Assets Register");
      setView("list");
      setSelectedCwip(null);
      setRefreshFlag((f) => f + 1);
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(error?.response?.data?.message || error?.message || "Something went wrong");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { name: "Capitalization #", selector: (row) => row.capitalizationNumber, sortable: true, width: "170px" },
    { name: "Asset Tag", width: "200px", selector: (row) => (row.fixedAssetId?.assetTag ? `${row.fixedAssetId.assetTag}${(row.fixedAssetIds || []).length > 1 ? ` +${row.fixedAssetIds.length - 1} more` : ""}` : "—") },
    { name: "Item", selector: (row) => row.itemName, wrap: true },
    {
      name: "Total Cost",
      cell: (row) => <span className="uom-cell-primary">{money(row.totalCost)}</span>,
    },
    { name: "Useful Life", width: "110px", cell: (row) => `${row.usefulLifeYears} yrs` },
    {
      name: "Annual Depreciation",
      width: "160px",
      cell: (row) => <span className="text-danger">{money(row.annualDepreciation)}/yr</span>,
    },
    {
      name: "Site",
      cell: (row) => <span className="uom-cell-muted">{row.centerId?.title || "—"}</span>,
    },
    {
      name: "Date",
      cell: (row) => <span className="uom-cell-muted">{dateFmt(row.capitalizationDate)}</span>,
    },
  ];

  if (view === "select-cwip") {
    return (
      <div className="uom-page">
        <div className="uom-list-header">
          <div>
            <h4>Select CWIP Record</h4>
            <p>Choose a CWIP whose installation is complete and ready to capitalize</p>
          </div>
          <Button color="light" onClick={() => setView("list")}>
            <i className="bx bx-arrow-back me-1"></i> Back
          </Button>
        </div>

        {loading && <div className="text-muted p-3">Loading...</div>}

        {loadError && (
          <div
            className="p-3 mb-3 d-flex align-items-center justify-content-between"
            style={{ background: "#fef3f2", border: "1px solid #fecdca", borderRadius: 10 }}
          >
            <span className="text-danger">{loadError}</span>
            <Button size="sm" color="light" onClick={openSelectCwip}>
              Try again
            </Button>
          </div>
        )}

        {!loading && !loadError && readyCwips.length === 0 && (
          <div className="uom-empty-state">
            <p className="uom-empty-title">Nothing ready</p>
            <p className="uom-empty-sub">
              Mark a CWIP's installation complete first (in Capital Work in Progress).
            </p>
          </div>
        )}

        <div className="d-flex flex-column gap-2">
          {readyCwips.map((cwip) => (
            <div
              key={cwip._id}
              className="uom-table-card p-3"
              style={{ cursor: "pointer" }}
              onClick={() => selectCwip(cwip)}
            >
              <div className="d-flex justify-content-between">
                <div>
                  <div className="fw-semibold">{cwip.cwipNumber}</div>
                  <div className="text-muted small">
                    {cwip.itemName} · Qty {cwip.quantity} · {cwip.centerId?.title || "—"}
                  </div>
                </div>
                <div className="fw-semibold">{money(cwip.totalCost)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (view === "form" && selectedCwip) {
    return (
      <div className="uom-form-page">
        <div className="d-flex justify-content-between align-items-start mb-1">
          <h4 className="uom-form-title mb-0">Capitalize Asset</h4>
          <Button color="primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving..." : "Capitalize"}
          </Button>
        </div>
        <p className="text-muted mb-4">
          From CWIP: <strong>{selectedCwip.cwipNumber}</strong>
        </p>

        <div className="uom-form-panel">
          <div className="uom-table-card p-3 mb-3">
            <div className="fw-semibold">{selectedCwip.itemName}</div>
            <div className="text-muted small">
              Qty {selectedCwip.quantity} · Total Cost {money(selectedCwip.totalCost)}
            </div>
          </div>

          <Label>
            Useful Life (Years) <span className="text-danger">*</span>
          </Label>
          <Input
            type="number"
            min={1}
            step={1}
            className="mb-3"
            value={usefulLifeYears}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setUsefulLifeYears(e.target.value)}
          />

          <div className="uom-table-card p-3 mb-3" style={{ maxWidth: 320 }}>
            <div className="text-muted small mb-1">Annual Depreciation (Straight Line)</div>
            <div className="fs-4 fw-bold text-danger">{money(annualDepreciation)} / year</div>
          </div>

          <Label>Remarks</Label>
          <Input type="textarea" rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} />

          <div className="uom-form-footer d-flex justify-content-end gap-2 mt-3">
            <Button color="light" onClick={() => setView("list")} disabled={submitting}>
              Cancel
            </Button>
            <Button color="primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Saving..." : "Capitalize"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="uom-page">
      <div className="uom-list-header">
        <div>
          <h4>Asset Capitalization</h4>
          <p>Converts completed CWIP into a formal capitalized asset</p>
        </div>
      </div>

      <div className="d-flex justify-content-end mb-3">
        {canCreate && (
          <Button color="primary" onClick={openSelectCwip}>
            <i className="bx bx-plus me-1"></i> Capitalize Asset
          </Button>
        )}
      </div>

      {loadError && (
        <div
          className="p-3 mb-3 d-flex align-items-center justify-content-between"
          style={{ background: "#fef3f2", border: "1px solid #fecdca", borderRadius: 10 }}
        >
          <span className="text-danger">{loadError}</span>
          <Button size="sm" color="light" onClick={() => setRefreshFlag((n) => n + 1)}>
            Try again
          </Button>
        </div>
      )}

      <div className="uom-table-card">
        <DataTable
          columns={columns}
          data={records}
          progressPending={loading}
          pagination
          highlightOnHover
          noDataComponent={<div className="uom-empty-state">No capitalized assets yet</div>}
        />
      </div>
    </div>
  );
};

export default AssetCapitalization;