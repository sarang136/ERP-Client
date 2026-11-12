import React, { useState, useEffect, useMemo } from "react";
import { Button, Input, Modal, ModalBody } from "reactstrap";
import { toast } from "react-toastify";
import { getChartOfAccounts, getLedgerById } from "../../../../helpers/backend_helper";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { usePermissions } from "../../../../Components/Hooks/useRoles.js";
import Basic404 from "../../../AuthenticationInner/Errors/Basic404";
import { BALANCE_LABELS, CONTROL_TYPES, sideShort, errText } from "./ledgerUi";
import { exportChart } from "./exportChart";
import "../../UnitOfMeasurement/uom.scss";

const KIND = {
  type: { label: "TYPE", color: "#1d4ed8", icon: "bx-folder-open" },
  subtype: { label: "SUB TYPE", color: "#15803d", icon: "bx-folder-open" },
  group: { label: "PARENT LEDGER", color: "#7e22ce", icon: "bx-folder" },
  ledger: { label: "LEDGER", color: "#475467", icon: "bx-file" },
};

const Stat = ({ label, value }) => (
  <div style={{ padding: "6px 16px", borderLeft: "1px solid #edeff3", minWidth: 90 }}>
    <div className="text-muted" style={{ fontSize: 11, letterSpacing: "0.04em" }}>
      {label}
    </div>
    <div className="fs-5 fw-bold">{value}</div>
  </div>
);

const Detail = ({ label, value }) => (
  <div className="mb-2">
    <div className="text-muted small">{label}</div>
    <div className="fw-semibold">{value || "—"}</div>
  </div>
);

// Type -> Sub type -> Group -> Ledger, built from the flat lists the server sends
const buildTree = ({ types, subTypes, ledgers }) => {
  const kidsOf = {};
  ledgers.forEach((l) => {
    if (l.parentLedgerId) (kidsOf[String(l.parentLedgerId)] = kidsOf[String(l.parentLedgerId)] || []).push(l);
  });
  const ledgerNode = (l) => ({
    key: `l-${l._id}`,
    kind: l.postingType === "group" ? "group" : "ledger",
    code: l.ledgerCode,
    name: l.name,
    status: l.status,
    ledger: l,
    children: (kidsOf[String(l._id)] || []).map(ledgerNode),
  });
  return types.map((t) => ({
    key: `t-${t._id}`,
    kind: "type",
    code: `${t.seriesStart}–${t.seriesEnd}`,
    name: t.name,
    status: t.status,
    children: subTypes
      .filter((s) => String(s.ledgerTypeId) === String(t._id))
      .map((s) => ({
        key: `s-${s._id}`,
        kind: "subtype",
        code: `${s.seriesStart}–${s.seriesEnd}`,
        name: s.name,
        status: s.status,
        children: ledgers.filter((l) => String(l.ledgerSubTypeId) === String(s._id) && !l.parentLedgerId).map(ledgerNode),
      })),
  }));
};

// Keeps the nodes that match the search and the nodes above them
const filterTree = (nodes, q) =>
  nodes
    .map((n) => {
      const kids = filterTree(n.children, q);
      const hit = `${n.code} ${n.name}`.toLowerCase().includes(q);
      return hit || kids.length > 0 ? { ...n, children: hit ? n.children : kids } : null;
    })
    .filter(Boolean);

const collectKeys = (nodes, out = []) => {
  nodes.forEach((n) => {
    if (n.children.length > 0) out.push(n.key);
    collectKeys(n.children, out);
  });
  return out;
};

const ChartOfAccounts = () => {
  const handleAuthError = useAuthError();
  const token = JSON.parse(localStorage.getItem("micrologin"))?.token;
  const { hasPermission } = usePermissions(token);
  const canView = hasPermission("MASTERDATA", "LEDGER", "READ");

  const [chart, setChart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(() => new Set());
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getChartOfAccounts()
      .then((res) => {
        if (cancelled) return;
        const data = res?.data || null;
        setChart(data);
        // the types start open, so the first level is visible
        setOpen(new Set((data?.types || []).map((t) => `t-${t._id}`)));
      })
      .catch((error) => {
        if (!cancelled && !handleAuthError(error)) toast.error(errText(error, "Couldn't load the chart of accounts."));
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tree = useMemo(() => (chart ? buildTree(chart) : []), [chart]);
  const q = search.trim().toLowerCase();
  const shown = useMemo(() => (q ? filterTree(tree, q) : tree), [tree, q]);
  const searchOpen = useMemo(() => (q ? new Set(collectKeys(shown)) : null), [shown, q]);

  if (!canView) return <Basic404 />;

  const isOpen = (key) => (searchOpen ? searchOpen.has(key) : open.has(key));
  const toggle = (key) =>
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const openView = async (node) => {
    setViewing({ ...node.ledger, loading: true });
    try {
      const res = await getLedgerById(node.ledger._id);
      setViewing({ ...(res?.data || node.ledger), typeName: chart.types.find((t) => String(t._id) === String(node.ledger.ledgerTypeId))?.name, subTypeName: chart.subTypes.find((s) => String(s._id) === String(node.ledger.ledgerSubTypeId))?.name });
    } catch (error) {
      setViewing(null);
      if (!handleAuthError(error)) toast.error(errText(error, "Couldn't load the ledger."));
    }
  };

  const handleExport = () => {
    if (!chart || chart.ledgers.length === 0) return toast.error("Nothing to export");
    const count = exportChart(chart);
    toast.success(`Exported ${count} ledgers`);
  };

  const renderNode = (n, depth) => {
    const k = KIND[n.kind];
    const expandable = n.children.length > 0;
    return (
      <React.Fragment key={n.key}>
        <div
          className="d-flex align-items-center"
          style={{ padding: "8px 12px", borderBottom: "1px solid #f2f4f7", paddingLeft: 12 + depth * 22, background: n.kind === "type" ? "#f8fafc" : "#fff" }}
        >
          <span style={{ width: 22, cursor: expandable ? "pointer" : "default" }} onClick={() => expandable && toggle(n.key)}>
            {expandable && <i className={`bx ${isOpen(n.key) ? "bx-chevron-down" : "bx-chevron-right"}`}></i>}
          </span>
          <i className={`bx ${k.icon} me-2`} style={{ color: k.color }}></i>
          <span className="fw-semibold me-2" style={{ color: k.color, minWidth: 96 }}>
            {n.code}
          </span>
          <span className="flex-grow-1 text-truncate" style={{ color: n.kind === "ledger" ? "#101828" : k.color, fontWeight: n.kind === "ledger" ? 400 : 600 }}>
            {n.name}
            {n.ledger?.isControlAccount && <span className="ms-2 text-muted small">(control)</span>}
          </span>
          <span className="text-muted small me-3" style={{ minWidth: 30 }}>
            {n.ledger ? sideShort(n.ledger.normalBalanceType) : ""}
          </span>
          <span className="uom-symbol-badge me-3" style={{ fontSize: 10.5 }}>
            {k.label}
          </span>
          <span style={{ width: 70, textAlign: "right" }}>
            {n.ledger ? (
              <Button size="sm" color="link" className="p-0" onClick={() => openView(n)}>
                <i className="bx bx-show me-1"></i>View
              </Button>
            ) : null}
          </span>
          <span className="ms-2" title={n.status} style={{ width: 10, height: 10, borderRadius: 10, background: n.status === "active" ? "#12b76a" : "#98a2b3" }}></span>
        </div>
        {expandable && isOpen(n.key) && n.children.map((c) => renderNode(c, depth + 1))}
      </React.Fragment>
    );
  };

  const stats = chart?.stats;
  const controlLabel = (v) => CONTROL_TYPES.find((c) => c.value === v)?.label || v;

  return (
    <div className="uom-page">
      <div className="uom-list-header">
        <div>
          <h4>Chart of Accounts</h4>
          <p>Hierarchical view of ledgers, types and sub types</p>
        </div>
        {stats && (
          <div className="d-flex uom-table-card" style={{ padding: "4px 0" }}>
            <Stat label="TYPES" value={stats.types} />
            <Stat label="SUB-TYPES" value={stats.subTypes} />
            <Stat label="LEDGERS" value={stats.ledgers} />
            <Stat label="ACTIVE" value={stats.active} />
            <Stat label="GROUPS" value={stats.groups} />
            <Stat label="POSTING" value={stats.posting} />
          </div>
        )}
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div className="uom-search-wrap mb-0" style={{ minWidth: 320 }}>
          <i className="bx bx-search"></i>
          <Input placeholder="Search by code or name..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="d-flex gap-2">
          <Button color="light" title="Expand all" onClick={() => setOpen(new Set(collectKeys(tree)))}>
            <i className="bx bx-expand-vertical me-1"></i> Expand all
          </Button>
          <Button color="light" title="Collapse all" onClick={() => setOpen(new Set())}>
            <i className="bx bx-collapse-vertical me-1"></i> Collapse all
          </Button>
          <Button color="light" onClick={handleExport} title="Download in the same three-sheet layout as the HiSYNC export">
            <i className="bx bx-download me-1"></i> Export
          </Button>
        </div>
      </div>

      <div className="uom-table-card" style={{ overflow: "hidden" }}>
        <div className="d-flex text-muted small fw-semibold" style={{ padding: "10px 12px", borderBottom: "1px solid #edeff3" }}>
          <span style={{ width: 22 }}></span>
          <span style={{ minWidth: 118 }}>CODE</span>
          <span className="flex-grow-1">ACCOUNT NAME</span>
          <span style={{ minWidth: 190 }}>TYPE</span>
          <span style={{ width: 90 }}>STATUS</span>
        </div>
        {loading ? (
          <div className="text-muted p-4 text-center">Loading chart of accounts...</div>
        ) : shown.length === 0 ? (
          <div className="uom-empty-state">
            <p className="uom-empty-title">{q ? "Nothing matches your search" : "No accounts yet"}</p>
            <p className="uom-empty-sub">{q ? "Try a different code or name." : "Add the ledger types and sub types first, then the ledgers."}</p>
          </div>
        ) : (
          shown.map((n) => renderNode(n, 0))
        )}
      </div>

      <Modal isOpen={!!viewing} toggle={() => setViewing(null)} centered size="lg">
        <ModalBody className="p-4">
          {viewing?.loading ? (
            <div className="text-muted py-4 text-center">Loading...</div>
          ) : (
            viewing && (
              <>
                <h5 className="mb-1">
                  <span className="uom-symbol-badge me-2">{viewing.ledgerCode}</span>
                  {viewing.name}
                </h5>
                <div className="text-muted small mb-3">
                  {viewing.typeName} · {viewing.subTypeName}
                  {viewing.parentLedgerId?.name ? ` · under ${viewing.parentLedgerId.ledgerCode} ${viewing.parentLedgerId.name}` : ""}
                </div>
                <div className="row">
                  <div className="col-md-4">
                    <Detail label="Kind" value={viewing.postingType === "group" ? "Group account (no direct posting)" : "Posting ledger"} />
                    <Detail label="Normal balance" value={BALANCE_LABELS[viewing.normalBalanceType]} />
                    <Detail label="Status" value={viewing.status} />
                  </div>
                  <div className="col-md-4">
                    <Detail label="Control account" value={viewing.isControlAccount ? `Yes · ${controlLabel(viewing.controlAccountType)}` : "No"} />
                    <Detail label="Contra account" value={viewing.isContraAccount ? "Yes" : "No"} />
                    <Detail label="Ledgers under it" value={String(viewing.childCount ?? 0)} />
                  </div>
                  <div className="col-md-4">
                    <Detail label="Financial statement" value={viewing.financialStatementGroup} />
                    <Detail label="Currency" value={viewing.currencyCode} />
                    <Detail label="Linked vendor" value={viewing.vendor ? `${viewing.vendor.vendorCode || ""} ${viewing.vendor.tradeName || viewing.vendor.legalName || ""}`.trim() : ""} />
                  </div>
                </div>
                <div className="d-flex justify-content-end mt-3">
                  <Button color="light" onClick={() => setViewing(null)}>
                    Close
                  </Button>
                </div>
              </>
            )
          )}
        </ModalBody>
      </Modal>
    </div>
  );
};

export default ChartOfAccounts;
