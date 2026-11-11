import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { Button, Input, Modal, ModalBody } from "reactstrap";
import { toast } from "react-toastify";
import {
  getLedgers,
  getLedgerById,
  getLedgerTypes,
  getLedgerSubTypes,
  updateLedgerStatus,
} from "../../../../helpers/backend_helper";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { usePermissions } from "../../../../Components/Hooks/useRoles.js";
import { tableCustomStyles, StatusPill, BALANCE_LABELS, CONTROL_TYPES, sideShort, errText } from "./ledgerUi";
import "../../UnitOfMeasurement/uom.scss";

const Detail = ({ label, value }) => (
  <div className="mb-2">
    <div className="text-muted small">{label}</div>
    <div className="fw-semibold">{value || "—"}</div>
  </div>
);

const LedgerList = ({ onAdd, onEdit }) => {
  const handleAuthError = useAuthError();
  const token = JSON.parse(localStorage.getItem("micrologin"))?.token;
  const { hasPermission } = usePermissions(token);
  const canEdit = hasPermission("MASTERDATA", "LEDGER", "WRITE");

  const [types, setTypes] = useState([]);
  const [subTypes, setSubTypes] = useState([]);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [subTypeFilter, setSubTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [busyId, setBusyId] = useState("");
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    getLedgerTypes({}).then((res) => setTypes(res?.data || [])).catch(() => {});
    getLedgerSubTypes({}).then((res) => setSubTypes(res?.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getLedgers({
      page,
      limit: perPage,
      search,
      ...(typeFilter ? { ledgerTypeId: typeFilter } : {}),
      ...(subTypeFilter ? { ledgerSubTypeId: subTypeFilter } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
    })
      .then((res) => {
        if (cancelled) return;
        setRows(res?.data || []);
        setTotal(res?.pagination?.total || 0);
      })
      .catch((error) => {
        if (!cancelled && !handleAuthError(error)) toast.error(errText(error, "Couldn't load ledgers."));
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, search, typeFilter, subTypeFilter, statusFilter, refreshFlag]);

  const openView = async (row) => {
    setViewing({ ...row, loading: true });
    try {
      const res = await getLedgerById(row._id);
      setViewing(res?.data || row);
    } catch (error) {
      setViewing(null);
      if (!handleAuthError(error)) toast.error(errText(error, "Couldn't load the ledger."));
    }
  };

  const toggleStatus = async (row) => {
    if (busyId) return;
    setBusyId(row._id);
    try {
      await updateLedgerStatus(row._id, row.status === "active" ? "inactive" : "active");
      toast.success("Status updated successfully");
      setRefreshFlag((f) => f + 1);
    } catch (error) {
      if (!handleAuthError(error)) toast.error(errText(error, "Couldn't change the status"));
    } finally {
      setBusyId("");
    }
  };

  const filterSubTypes = typeFilter ? subTypes.filter((s) => (s.ledgerTypeId?._id || s.ledgerTypeId) === typeFilter) : subTypes;

  const columns = [
    { name: "Code", width: "140px", sortable: false, cell: (row) => <span className="uom-symbol-badge">{row.ledgerCode}</span> },
    {
      name: "Ledger Name",
      grow: 2,
      minWidth: "220px",
      cell: (row) => (
        <span className="uom-cell-primary">
          <i className={`bx ${row.postingType === "group" ? "bx-folder" : "bx-file"} me-1 text-muted`}></i>
          {row.name}
        </span>
      ),
    },
    {
      name: "Type · Sub Type",
      minWidth: "200px",
      cell: (row) => (
        <span className="uom-cell-muted">
          {row.ledgerTypeId?.name || "—"} · {row.ledgerSubTypeId?.name || "—"}
        </span>
      ),
    },
    {
      name: "Parent",
      minWidth: "170px",
      hide: "lg",
      cell: (row) => (
        <span className="uom-cell-muted">{row.parentLedgerId ? `${row.parentLedgerId.ledgerCode} · ${row.parentLedgerId.name}` : "—"}</span>
      ),
    },
    {
      name: "Kind",
      width: "170px",
      cell: (row) => (
        <span className="uom-cell-muted">
          {row.postingType === "group" ? "Group" : "Posting"}
          {row.isControlAccount ? " · Control" : ""}
          {row.isContraAccount ? " · Contra" : ""}
        </span>
      ),
    },
    { name: "Balance", width: "90px", cell: (row) => <span className="uom-cell-muted">{sideShort(row.normalBalanceType)}</span> },
    { name: "Status", width: "120px", cell: (row) => <StatusPill status={row.status} /> },
    {
      name: "Actions",
      width: "200px",
      right: true,
      cell: (row) => (
        <div className="d-flex gap-2">
          <Button size="sm" color="light" title="View" onClick={() => openView(row)}>
            <i className="bx bx-show"></i>
          </Button>
          {canEdit && (
            <>
              <Button size="sm" color="light" title="Edit" onClick={() => onEdit(row)}>
                <i className="bx bx-edit-alt"></i>
              </Button>
              <Button size="sm" color="light" disabled={busyId === row._id} onClick={() => toggleStatus(row)}>
                {row.status === "active" ? "Deactivate" : "Activate"}
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const controlLabel = (v) => CONTROL_TYPES.find((c) => c.value === v)?.label || v;

  return (
    <div className="uom-page">
      <div className="uom-list-header">
        <div>
          <h4>Ledgers</h4>
          <p>Every account in the chart of accounts. A ledger is never deleted, it is made inactive</p>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div className="d-flex gap-2 flex-wrap">
          <div className="uom-search-wrap mb-0">
            <i className="bx bx-search"></i>
            <Input
              placeholder="Search by code or name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Input
            type="select"
            style={{ maxWidth: 190 }}
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setSubTypeFilter("");
              setPage(1);
            }}
          >
            <option value="">All types</option>
            {types.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </Input>
          <Input
            type="select"
            style={{ maxWidth: 210 }}
            value={subTypeFilter}
            onChange={(e) => {
              setSubTypeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All sub types</option>
            {filterSubTypes.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </Input>
          <Input
            type="select"
            style={{ maxWidth: 150 }}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </Input>
        </div>
        {canEdit && (
          <Button color="primary" onClick={onAdd}>
            <i className="bx bx-plus me-1"></i> Add Ledger
          </Button>
        )}
      </div>

      <div className="uom-table-card" style={{ overflowX: "auto" }}>
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
              <p className="uom-empty-title">No ledgers found</p>
              <p className="uom-empty-sub">Try adjusting the filters, or add the first ledger.</p>
            </div>
          }
        />
      </div>

      <Modal isOpen={!!viewing} toggle={() => setViewing(null)} centered size="lg">
        <ModalBody className="p-4">
          {viewing?.loading ? (
            <div className="text-muted py-4 text-center">Loading...</div>
          ) : (
            viewing && (
              <>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h5 className="mb-1">
                      <span className="uom-symbol-badge me-2">{viewing.ledgerCode}</span>
                      {viewing.name}
                    </h5>
                    <div className="text-muted small">
                      {viewing.ledgerTypeId?.name} · {viewing.ledgerSubTypeId?.name}
                      {viewing.parentLedgerId ? ` · under ${viewing.parentLedgerId.ledgerCode} ${viewing.parentLedgerId.name}` : ""}
                    </div>
                  </div>
                  <StatusPill status={viewing.status} />
                </div>
                <div className="row">
                  <div className="col-md-4">
                    <Detail label="Kind" value={viewing.postingType === "group" ? "Group account (no direct posting)" : "Posting ledger"} />
                    <Detail label="Normal balance" value={BALANCE_LABELS[viewing.normalBalanceType]} />
                    <Detail label="Currency" value={viewing.currencyCode} />
                  </div>
                  <div className="col-md-4">
                    <Detail label="Control account" value={viewing.isControlAccount ? `Yes · ${controlLabel(viewing.controlAccountType)}` : "No"} />
                    <Detail label="Contra account" value={viewing.isContraAccount ? "Yes" : "No"} />
                    <Detail label="Sub-ledgers / ledgers under it" value={String(viewing.childCount ?? 0)} />
                  </div>
                  <div className="col-md-4">
                    <Detail label="Financial statement" value={viewing.financialStatementGroup} />
                    <Detail
                      label="Opening balance"
                      value={
                        viewing.postingType === "group"
                          ? "—"
                          : `₹${Number(viewing.openingBalance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })} ${sideShort(viewing.openingBalanceType)}`
                      }
                    />
                    <Detail label="Linked vendor" value={viewing.vendor ? `${viewing.vendor.vendorCode || ""} ${viewing.vendor.tradeName || viewing.vendor.legalName || ""}`.trim() : ""} />
                  </div>
                </div>
                {viewing.notes && <Detail label="Notes" value={viewing.notes} />}
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

export default LedgerList;
