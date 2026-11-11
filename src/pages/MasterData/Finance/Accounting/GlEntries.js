import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { Button, Input } from "reactstrap";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { getGlVouchers, getLedgers } from "../../../../helpers/backend_helper";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { usePermissions } from "../../../../Components/Hooks/useRoles.js";
import Basic404 from "../../../AuthenticationInner/Errors/Basic404";
import JournalForm from "./JournalForm";
import TrialBalance from "./TrialBalance";
import VoucherModal from "./VoucherModal";
import { tableCustomStyles, money, dateFmt, VOUCHER_TYPE_LABELS, errText } from "./ledgerUi";
import "../../UnitOfMeasurement/uom.scss";

const TABS = [
  { key: "entries", label: "Entries Database", icon: "bx-list-ul" },
  { key: "trial", label: "Trial Balance", icon: "bx-bar-chart-alt-2" },
];

// The one GL page: the vouchers (each with its debit and credit lines), a trial balance tab, and
// "New Journal Voucher" for a manual entry. Entries are never edited or deleted: a mistake is reversed.
const GlEntries = () => {
  const handleAuthError = useAuthError();
  const token = JSON.parse(localStorage.getItem("micrologin"))?.token;
  const { hasPermission } = usePermissions(token);
  const canView = hasPermission("MASTERDATA", "GL_ENTRY", "READ");
  const canPost = hasPermission("MASTERDATA", "GL_ENTRY", "WRITE");

  const [tab, setTab] = useState("entries");
  const [view, setView] = useState("list");

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [voucherType, setVoucherType] = useState("");
  const [status, setStatus] = useState("");
  const [ledgerId, setLedgerId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [ledgers, setLedgers] = useState([]);
  const [viewId, setViewId] = useState("");
  const [exporting, setExporting] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(0);

  const filters = () => ({
    ...(search ? { search } : {}),
    ...(voucherType ? { voucherType } : {}),
    ...(status ? { status } : {}),
    ...(ledgerId ? { ledgerId } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  });

  useEffect(() => {
    getLedgers({ postingType: "detail", limit: 200 })
      .then((res) => setLedgers(res?.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (view !== "list" || tab !== "entries") return undefined;
    let cancelled = false;
    setLoading(true);
    getGlVouchers({ page, limit: perPage, ...filters() })
      .then((res) => {
        if (cancelled) return;
        setRows(res?.data || []);
        setTotal(res?.pagination?.total || 0);
      })
      .catch((error) => {
        if (!cancelled && !handleAuthError(error)) toast.error(errText(error, "Couldn't load the entries."));
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, tab, page, perPage, search, voucherType, status, ledgerId, from, to, refreshFlag]);

  if (!canView) return <Basic404 />;

  if (view === "form") {
    return (
      <JournalForm
        onSaved={() => {
          setView("list");
          setTab("entries");
          setRefreshFlag((f) => f + 1);
        }}
        onCancel={() => setView("list")}
      />
    );
  }

  const reset = (fn) => (e) => {
    fn(e.target.value);
    setPage(1);
  };

  // What is on the screen (same search and filters), up to 1000 vouchers
  const exportFile = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const all = [];
      let p = 1;
      let count = 0;
      do {
        const res = await getGlVouchers({ page: p, limit: 200, ...filters() });
        all.push(...(res?.data || []));
        count = res?.pagination?.total || 0;
        p += 1;
      } while (all.length < count && p <= 5);
      if (all.length === 0) return toast.error("Nothing to export");
      const data = all.map((v) => ({
        "Voucher Date": dateFmt(v.postingDate),
        "Voucher Number": v.voucherNumber,
        "Voucher Type": VOUCHER_TYPE_LABELS[v.voucherType] || v.voucherType,
        Amount: v.totalAmount,
        Remark: v.narration || "",
        Status: v.reversalOf ? "Reversal" : v.status === "posted" ? "Posted" : "Reversed",
        "Posted By": v.createdBy?.name || "",
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      ws["!cols"] = Object.keys(data[0]).map((k) => ({ wch: Math.max(14, k.length + 2) }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "GL Entries");
      XLSX.writeFile(wb, `gl-entries-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success(all.length < count ? `Exported the first ${all.length} of ${count}. Narrow the filters to get the rest` : `Exported ${all.length} vouchers`);
    } catch (error) {
      if (!handleAuthError(error)) toast.error(errText(error, "Couldn't export."));
    } finally {
      setExporting(false);
    }
  };

  const activeFilters = [voucherType, status, ledgerId, from, to].filter(Boolean).length;

  const columns = [
    { name: "Voucher Date", width: "130px", cell: (row) => <span className="uom-cell-muted">{dateFmt(row.postingDate)}</span> },
    {
      name: "Voucher Number",
      width: "210px",
      cell: (row) => (
        <button type="button" className="btn btn-link p-0" onClick={() => setViewId(row._id)}>
          {row.voucherNumber}
        </button>
      ),
    },
    { name: "Voucher Type", width: "170px", cell: (row) => <span className="uom-cell-muted">{VOUCHER_TYPE_LABELS[row.voucherType] || row.voucherType}</span> },
    { name: "Amount", width: "150px", right: true, cell: (row) => <span className="fw-semibold">₹{money(row.totalAmount)}</span> },
    { name: "Remark", grow: 2, minWidth: "240px", cell: (row) => <span className="uom-cell-primary">{row.narration || "—"}</span> },
    {
      name: "Status",
      width: "120px",
      cell: (row) => (
        <span className={`uom-status-pill status-${row.status === "posted" && !row.reversalOf ? "active" : "inactive"}`}>
          <span className="dot"></span> {row.reversalOf ? "Reversal" : row.status === "posted" ? "Posted" : "Reversed"}
        </span>
      ),
    },
    {
      name: "Action",
      width: "90px",
      right: true,
      cell: (row) => (
        <Button size="sm" color="light" title="View" onClick={() => setViewId(row._id)}>
          <i className="bx bx-show"></i>
        </Button>
      ),
    },
  ];

  return (
    <div className="uom-page">
      <div className="uom-list-header">
        <div>
          <h4>GL Entries</h4>
          <p>All general ledger entries. They are never edited or deleted: a mistake is corrected by a reversal</p>
        </div>
        <div className="d-flex gap-2">
          {tab === "entries" && (
            <Button color="light" onClick={exportFile} disabled={exporting}>
              <i className="bx bx-download me-1"></i> {exporting ? "Exporting..." : "Export"}
            </Button>
          )}
          {canPost && (
            <Button color="primary" onClick={() => setView("form")}>
              <i className="bx bx-plus me-1"></i> New Journal Voucher
            </Button>
          )}
        </div>
      </div>

      <div className="im-filter-pills-row mb-3">
        {TABS.map((t) => (
          <button key={t.key} type="button" className={`im-filter-pill ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
            <i className={`bx ${t.icon} me-1`}></i> {t.label}
          </button>
        ))}
      </div>

      {tab === "trial" ? (
        <TrialBalance embedded />
      ) : (
        <>
          <div className="d-flex gap-2 mb-2 flex-wrap align-items-center">
            <div className="uom-search-wrap mb-0" style={{ flex: "1 1 320px" }}>
              <i className="bx bx-search"></i>
              <Input placeholder="Search by voucher number or remark..." value={search} onChange={reset(setSearch)} />
            </div>
            <Button color="light" onClick={() => setShowFilters((s) => !s)}>
              <i className="bx bx-filter-alt me-1"></i> Filters{activeFilters > 0 ? ` (${activeFilters})` : ""}
            </Button>
          </div>

          {showFilters && (
            <div className="d-flex gap-2 flex-wrap mb-3 p-3 uom-table-card">
              <Input type="select" style={{ maxWidth: 190 }} value={voucherType} onChange={reset(setVoucherType)}>
                <option value="">All voucher types</option>
                {Object.entries(VOUCHER_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Input>
              <Input type="select" style={{ maxWidth: 150 }} value={status} onChange={reset(setStatus)}>
                <option value="">All status</option>
                <option value="posted">Posted</option>
                <option value="reversed">Reversed</option>
              </Input>
              <Input type="select" style={{ maxWidth: 280 }} value={ledgerId} onChange={reset(setLedgerId)}>
                <option value="">All accounts</option>
                {ledgers.map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.ledgerCode} · {l.name}
                  </option>
                ))}
              </Input>
              <Input type="date" style={{ maxWidth: 160 }} value={from} onChange={reset(setFrom)} title="From date" />
              <Input type="date" style={{ maxWidth: 160 }} value={to} onChange={reset(setTo)} title="To date" />
              {activeFilters > 0 && (
                <Button
                  color="link"
                  onClick={() => {
                    setVoucherType("");
                    setStatus("");
                    setLedgerId("");
                    setFrom("");
                    setTo("");
                    setPage(1);
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          )}

          <div className="uom-table-card mt-2" style={{ overflowX: "auto" }}>
            <DataTable
              columns={columns}
              data={rows}
              customStyles={tableCustomStyles}
              progressPending={loading}
              pagination
              paginationServer
              paginationTotalRows={total}
              paginationPerPage={perPage}
              paginationRowsPerPageOptions={[25, 50, 100]}
              onChangePage={(p) => setPage(p)}
              onChangeRowsPerPage={(n, p) => {
                setPerPage(n);
                setPage(p);
              }}
              highlightOnHover
              noDataComponent={
                <div className="uom-empty-state">
                  <p className="uom-empty-title">No records found</p>
                  <p className="uom-empty-sub">Try adjusting the filters, or post a journal voucher.</p>
                </div>
              }
            />
          </div>
        </>
      )}

      <VoucherModal voucherId={viewId} canReverse={canPost} onClose={() => setViewId("")} onChanged={() => setRefreshFlag((f) => f + 1)} />
    </div>
  );
};

export default GlEntries;
