import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { Button, Input, Modal, ModalBody, Label, Row, Col } from "reactstrap";
import { toast } from "react-toastify";
import {
  getLedgerTypes,
  getLedgerSubTypes,
  createLedgerSubType,
  updateLedgerSubType,
  updateLedgerSubTypeStatus,
} from "../../../../helpers/backend_helper";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { usePermissions } from "../../../../Components/Hooks/useRoles.js";
import Basic404 from "../../../AuthenticationInner/Errors/Basic404";
import { tableCustomStyles, StatusPill, errText } from "./ledgerUi";
import "../../UnitOfMeasurement/uom.scss";

const EMPTY = { ledgerTypeId: "", name: "", description: "", seriesStart: "", seriesEnd: "" };

const LedgerSubTypes = () => {
  const handleAuthError = useAuthError();
  const token = JSON.parse(localStorage.getItem("micrologin"))?.token;
  const { hasPermission } = usePermissions(token);
  const canView = hasPermission("MASTERDATA", "LEDGER_TYPE", "READ");
  const canEdit = hasPermission("MASTERDATA", "LEDGER_TYPE", "WRITE");

  const [types, setTypes] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [refreshFlag, setRefreshFlag] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    getLedgerTypes({})
      .then((res) => setTypes(res?.data || []))
      .catch(() => {});
  }, [refreshFlag]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getLedgerSubTypes({ search, ...(typeFilter ? { ledgerTypeId: typeFilter } : {}) })
      .then((res) => !cancelled && setRows(res?.data || []))
      .catch((error) => {
        if (!cancelled && !handleAuthError(error)) toast.error(errText(error, "Couldn't load ledger sub types."));
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, typeFilter, refreshFlag]);

  if (!canView) return <Basic404 />;

  const openForm = (row = null) => {
    setEditing(row);
    setForm(
      row
        ? {
            ledgerTypeId: row.ledgerTypeId?._id || row.ledgerTypeId,
            name: row.name,
            description: row.description || "",
            seriesStart: String(row.seriesStart),
            seriesEnd: String(row.seriesEnd),
          }
        : { ...EMPTY, ledgerTypeId: typeFilter },
    );
    setModalOpen(true);
  };

  const seriesLocked = !!editing && editing.ledgerCount > 0;
  const selectedType = types.find((t) => t._id === form.ledgerTypeId);

  const save = async () => {
    if (saving) return;
    if (!form.ledgerTypeId) return toast.error("Choose the ledger type");
    if (!form.name.trim()) return toast.error("Name is required");
    const start = Number(form.seriesStart);
    const end = Number(form.seriesEnd);
    if (!Number.isInteger(start) || !Number.isInteger(end)) return toast.error("Enter the series start and end as whole numbers");
    if (start % 100 !== 0) return toast.error("Series start must be a multiple of 100 (for example 1100)");
    if (start >= end) return toast.error("Series end must be greater than series start");

    setSaving(true);
    try {
      if (editing) {
        await updateLedgerSubType(editing._id, {
          name: form.name.trim(),
          description: form.description.trim(),
          ...(seriesLocked ? {} : { seriesStart: start, seriesEnd: end }),
        });
        toast.success("Ledger sub type updated successfully");
      } else {
        await createLedgerSubType({
          ledgerTypeId: form.ledgerTypeId,
          name: form.name.trim(),
          description: form.description.trim(),
          seriesStart: start,
          seriesEnd: end,
        });
        toast.success("Ledger sub type created successfully");
      }
      setModalOpen(false);
      setRefreshFlag((f) => f + 1);
    } catch (error) {
      if (!handleAuthError(error)) toast.error(errText(error, "Something went wrong"));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (row) => {
    if (busyId) return;
    setBusyId(row._id);
    try {
      await updateLedgerSubTypeStatus(row._id, row.status === "active" ? "inactive" : "active");
      toast.success("Status updated successfully");
      setRefreshFlag((f) => f + 1);
    } catch (error) {
      if (!handleAuthError(error)) toast.error(errText(error, "Couldn't change the status"));
    } finally {
      setBusyId("");
    }
  };

  const columns = [
    { name: "Ledger Type", width: "170px", cell: (row) => <span className="uom-cell-muted">{row.ledgerTypeId?.name || "—"}</span> },
    { name: "Sub Type", selector: (row) => row.name, sortable: true, cell: (row) => <span className="uom-cell-primary">{row.name}</span> },
    { name: "Series", width: "170px", cell: (row) => <span className="uom-symbol-badge">{row.seriesStart} – {row.seriesEnd}</span> },
    { name: "Ledgers", width: "100px", cell: (row) => <span className="uom-cell-muted">{row.ledgerCount}</span> },
    { name: "Status", width: "120px", cell: (row) => <StatusPill status={row.status} /> },
    {
      name: "Actions",
      width: "180px",
      right: true,
      cell: (row) =>
        canEdit && (
          <div className="d-flex gap-2">
            <Button size="sm" color="light" title="Edit" onClick={() => openForm(row)}>
              <i className="bx bx-edit-alt"></i>
            </Button>
            <Button size="sm" color="light" disabled={busyId === row._id} onClick={() => toggleStatus(row)}>
              {row.status === "active" ? "Deactivate" : "Activate"}
            </Button>
          </div>
        ),
    },
  ];

  return (
    <div className="uom-page">
      <div className="uom-list-header">
        <div>
          <h4>Ledger Sub Types</h4>
          <p>The second level of the chart of accounts, such as Current Assets under Assets (also called account groups)</p>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div className="d-flex gap-2 flex-wrap">
          <div className="uom-search-wrap mb-0">
            <i className="bx bx-search"></i>
            <Input placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Input type="select" style={{ maxWidth: 220 }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All ledger types</option>
            {types.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </Input>
        </div>
        {canEdit && (
          <Button color="primary" onClick={() => openForm()}>
            <i className="bx bx-plus me-1"></i> Add Sub Type
          </Button>
        )}
      </div>

      <div className="uom-table-card">
        <DataTable
          columns={columns}
          data={rows}
          customStyles={tableCustomStyles}
          progressPending={loading}
          pagination
          highlightOnHover
          noDataComponent={
            <div className="uom-empty-state">
              <p className="uom-empty-title">No ledger sub types yet</p>
              <p className="uom-empty-sub">Create the ledger types first, then add the sub types under them.</p>
            </div>
          }
        />
      </div>

      <Modal isOpen={modalOpen} toggle={() => !saving && setModalOpen(false)} centered>
        <ModalBody className="p-4">
          <h5 className="mb-3">{editing ? "Edit Ledger Sub Type" : "Add Ledger Sub Type"}</h5>
          <Label>
            Ledger Type <span className="text-danger">*</span>
          </Label>
          <Input type="select" className="mb-3" value={form.ledgerTypeId} disabled={!!editing} onChange={(e) => setForm({ ...form, ledgerTypeId: e.target.value })}>
            <option value="">Select ledger type</option>
            {types.filter((t) => t.status === "active" || t._id === form.ledgerTypeId).map((t) => (
              <option key={t._id} value={t._id}>
                {t.name} ({t.seriesStart}–{t.seriesEnd})
              </option>
            ))}
          </Input>
          <Label>
            Name <span className="text-danger">*</span>
          </Label>
          <Input className="mb-3" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Current Assets" />
          <Row>
            <Col md={6} className="mb-1">
              <Label>
                Series Start <span className="text-danger">*</span>
              </Label>
              <Input type="number" min={1} step={100} value={form.seriesStart} disabled={seriesLocked} onChange={(e) => setForm({ ...form, seriesStart: e.target.value })} placeholder="1100" />
            </Col>
            <Col md={6} className="mb-1">
              <Label>
                Series End <span className="text-danger">*</span>
              </Label>
              <Input type="number" min={1} value={form.seriesEnd} disabled={seriesLocked} onChange={(e) => setForm({ ...form, seriesEnd: e.target.value })} placeholder="1199" />
            </Col>
          </Row>
          <div className="text-muted small mb-3">
            {seriesLocked
              ? "The series cannot be changed because ledgers already exist under this sub type."
              : `Start on a hundred (1100, 1200...). Ledger numbers are built from it, so the first two digits of 1100 (11) become the start of every ledger number here.${
                  selectedType ? ` It must stay inside ${selectedType.name} (${selectedType.seriesStart}–${selectedType.seriesEnd}).` : ""
                }`}
          </div>
          <Label>Description</Label>
          <Input type="textarea" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button color="light" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button color="primary" onClick={save} disabled={saving}>
              {saving ? "Saving..." : editing ? "Save changes" : "Create"}
            </Button>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
};

export default LedgerSubTypes;
