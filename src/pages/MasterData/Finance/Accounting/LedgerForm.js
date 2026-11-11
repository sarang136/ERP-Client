import React, { useState, useEffect } from "react";
import { Row, Col, Label, Input, Button } from "reactstrap";
import { toast } from "react-toastify";
import {
  getLedgerTypes,
  getLedgerSubTypes,
  getLedgers,
  getNextLedgerCode,
  createLedger,
  updateLedger,
} from "../../../../helpers/backend_helper";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { CONTROL_TYPES, errText } from "./ledgerUi";
import "../../UnitOfMeasurement/uom.scss";

const idOf = (v) => v?._id || v || "";

const LedgerForm = ({ editingItem, onSaved, onCancel }) => {
  const handleAuthError = useAuthError();
  const editing = !!editingItem;

  const [types, setTypes] = useState([]);
  const [subTypes, setSubTypes] = useState([]);
  const [parents, setParents] = useState([]);
  const [nextCode, setNextCode] = useState("");
  const [saving, setSaving] = useState(false);

  const [f, setF] = useState({
    ledgerTypeId: idOf(editingItem?.ledgerTypeId),
    ledgerSubTypeId: idOf(editingItem?.ledgerSubTypeId),
    parentLedgerId: idOf(editingItem?.parentLedgerId),
    ledgerCodeMode: editingItem?.ledgerCodeMode || "auto",
    ledgerCode: editingItem?.ledgerCode || "",
    name: editingItem?.name || "",
    normalBalanceType: editingItem?.normalBalanceType && editingItem.normalBalanceType !== "not_set" ? editingItem.normalBalanceType : "",
    postingType: editingItem?.postingType || "detail",
    isControlAccount: !!editingItem?.isControlAccount,
    controlAccountType: editingItem?.controlAccountType || "",
    isContraAccount: !!editingItem?.isContraAccount,
    linkedAccountCode: editingItem?.linkedAccountCode || "",
    currencyCode: editingItem?.currencyCode || "INR",
    openingBalance: editingItem?.openingBalance ?? 0,
    openingBalanceType: editingItem?.openingBalanceType || "debit",
    financialStatementGroup: editingItem?.financialStatementGroup || "",
    cashFlowClassification: editingItem?.cashFlowClassification || "not_applicable",
    isBlockedForPosting: !!editingItem?.isBlockedForPosting,
    costCenter: editingItem?.costCenter || "",
    location: editingItem?.location || "",
    notes: editingItem?.notes || "",
  });
  const set = (patch) => setF((prev) => ({ ...prev, ...patch }));

  useEffect(() => {
    getLedgerTypes({ status: "active" }).then((res) => setTypes(res?.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!f.ledgerTypeId) {
      setSubTypes([]);
      return;
    }
    getLedgerSubTypes({ ledgerTypeId: f.ledgerTypeId, status: "active" })
      .then((res) => setSubTypes(res?.data || []))
      .catch(() => {});
  }, [f.ledgerTypeId]);

  // The group accounts of the chosen sub type: a ledger can be placed under one of them
  useEffect(() => {
    if (!f.ledgerSubTypeId) {
      setParents([]);
      return;
    }
    getLedgers({ ledgerSubTypeId: f.ledgerSubTypeId, postingType: "group", status: "active", limit: 200 })
      .then((res) => setParents(res?.data || []))
      .catch(() => {});
  }, [f.ledgerSubTypeId]);

  // What the next number would be (only a hint: the server decides when saving)
  useEffect(() => {
    if (editing || f.ledgerCodeMode !== "auto" || !f.ledgerSubTypeId) {
      setNextCode("");
      return;
    }
    getNextLedgerCode({ ledgerSubTypeId: f.ledgerSubTypeId, ...(f.parentLedgerId ? { parentLedgerId: f.parentLedgerId } : {}) })
      .then((res) => setNextCode(res?.data?.code || ""))
      .catch(() => setNextCode(""));
  }, [editing, f.ledgerCodeMode, f.ledgerSubTypeId, f.parentLedgerId]);

  const onTypeChange = (id) => {
    const t = types.find((x) => x._id === id);
    set({
      ledgerTypeId: id,
      ledgerSubTypeId: "",
      parentLedgerId: "",
      normalBalanceType: t && (t.normalBalance === "debit" || t.normalBalance === "credit") ? t.normalBalance : "",
    });
  };

  const isGroup = f.postingType === "group";

  const submit = async (e) => {
    e?.preventDefault();
    if (saving) return;
    if (!editing) {
      if (!f.ledgerTypeId) return toast.error("Choose the ledger type");
      if (!f.ledgerSubTypeId) return toast.error("Choose the ledger sub type");
      if (f.ledgerCodeMode === "manual" && !/^[0-9]{3,15}$/.test(f.ledgerCode)) return toast.error("Ledger code must be 3 to 15 digits");
    }
    if (!f.name.trim()) return toast.error("Ledger name is required");
    if (!f.normalBalanceType) return toast.error("Choose the normal balance (debit or credit)");
    if (f.isControlAccount && !f.controlAccountType) return toast.error("Choose the control account type");
    if (isGroup && Number(f.openingBalance) > 0) return toast.error("A group account cannot have an opening balance");

    const common = {
      name: f.name.trim(),
      normalBalanceType: f.normalBalanceType,
      isControlAccount: f.isControlAccount,
      controlAccountType: f.isControlAccount ? f.controlAccountType : "",
      isContraAccount: f.isContraAccount,
      linkedAccountCode: f.linkedAccountCode.trim(),
      currencyCode: f.currencyCode.trim().toUpperCase() || "INR",
      openingBalance: isGroup ? 0 : Number(f.openingBalance) || 0,
      openingBalanceType: f.openingBalanceType,
      financialStatementGroup: f.financialStatementGroup,
      cashFlowClassification: f.cashFlowClassification,
      isBlockedForPosting: f.isBlockedForPosting,
      costCenter: f.costCenter.trim(),
      location: f.location.trim(),
      notes: f.notes.trim(),
    };

    setSaving(true);
    try {
      if (editing) {
        await updateLedger(editingItem._id, common);
        toast.success("Ledger updated successfully");
      } else {
        await createLedger({
          ...common,
          ledgerSubTypeId: f.ledgerSubTypeId,
          parentLedgerId: f.parentLedgerId || undefined,
          postingType: f.postingType,
          ledgerCodeMode: f.ledgerCodeMode,
          ...(f.ledgerCodeMode === "manual" ? { ledgerCode: f.ledgerCode } : {}),
        });
        toast.success("Ledger created successfully");
      }
      onSaved();
    } catch (error) {
      if (!handleAuthError(error)) toast.error(errText(error, "Something went wrong"));
    } finally {
      setSaving(false);
    }
  };

  const Check = ({ checked, onChange, title, sub, disabled }) => (
    <div
      onClick={() => !disabled && onChange(!checked)}
      style={{ border: "1px solid #e4e7ec", borderRadius: 8, padding: 12, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1 }}
    >
      <input type="checkbox" className="me-2" checked={checked} readOnly disabled={disabled} />
      <span className="fw-semibold small">{title}</span>
      <div className="text-muted" style={{ fontSize: 11.5 }}>
        {sub}
      </div>
    </div>
  );

  return (
    <div className="uom-form-page">
      <h4 className="uom-form-title">{editing ? "Edit Ledger" : "Create Ledger"}</h4>
      <p className="text-muted mb-4">
        {editing
          ? "The code, type, sub type, parent and kind of a ledger cannot be changed once it is created"
          : "Create a new ledger with its accounting structure and controls"}
      </p>

      <div className="uom-form-panel">
        <form onSubmit={submit}>
          <h6 className="uom-form-section-title">Core Accounting Structure</h6>
          <Row>
            <Col md={4} className="mb-3">
              <Label>
                Ledger Type <span className="text-danger">*</span>
              </Label>
              <Input type="select" value={f.ledgerTypeId} disabled={editing} onChange={(e) => onTypeChange(e.target.value)}>
                <option value="">Select ledger type</option>
                {types.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
                {editing && !types.some((t) => t._id === f.ledgerTypeId) && <option value={f.ledgerTypeId}>{editingItem?.ledgerTypeId?.name}</option>}
              </Input>
            </Col>
            <Col md={4} className="mb-3">
              <Label>
                Ledger Sub Type <span className="text-danger">*</span>
              </Label>
              <Input
                type="select"
                value={f.ledgerSubTypeId}
                disabled={editing || !f.ledgerTypeId}
                onChange={(e) => set({ ledgerSubTypeId: e.target.value, parentLedgerId: "" })}
              >
                <option value="">{f.ledgerTypeId ? "Select sub type" : "Select ledger type first"}</option>
                {subTypes.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
                {editing && !subTypes.some((s) => s._id === f.ledgerSubTypeId) && <option value={f.ledgerSubTypeId}>{editingItem?.ledgerSubTypeId?.name}</option>}
              </Input>
            </Col>
            <Col md={4} className="mb-3">
              <Label>Parent Ledger (group)</Label>
              <Input type="select" value={f.parentLedgerId} disabled={editing || !f.ledgerSubTypeId} onChange={(e) => set({ parentLedgerId: e.target.value })}>
                <option value="">{f.ledgerSubTypeId ? "None (top level)" : "Select sub type first"}</option>
                {parents.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.ledgerCode} · {p.name}
                  </option>
                ))}
                {editing && f.parentLedgerId && !parents.some((p) => p._id === f.parentLedgerId) && (
                  <option value={f.parentLedgerId}>
                    {editingItem?.parentLedgerId?.ledgerCode} · {editingItem?.parentLedgerId?.name}
                  </option>
                )}
              </Input>
            </Col>
          </Row>

          <Row>
            <Col md={4} className="mb-3">
              <Label>
                Ledger Code <span className="text-danger">*</span>
              </Label>
              {editing ? (
                <Input value={f.ledgerCode} disabled />
              ) : (
                <>
                  <Input
                    value={f.ledgerCodeMode === "auto" ? nextCode : f.ledgerCode}
                    disabled={f.ledgerCodeMode === "auto"}
                    placeholder={f.ledgerCodeMode === "auto" ? "Next number appears when you choose a sub type" : "Enter the code (digits)"}
                    onChange={(e) => set({ ledgerCode: e.target.value.replace(/\D/g, "").slice(0, 15) })}
                  />
                  <div className="mt-1">
                    <label className="small me-3">
                      <input type="radio" className="me-1" checked={f.ledgerCodeMode === "auto"} onChange={() => set({ ledgerCodeMode: "auto" })} />
                      Auto-generate
                    </label>
                    <label className="small">
                      <input type="radio" className="me-1" checked={f.ledgerCodeMode === "manual"} onChange={() => set({ ledgerCodeMode: "manual" })} />
                      Enter manually
                    </label>
                  </div>
                </>
              )}
            </Col>
            <Col md={4} className="mb-3">
              <Label>
                Ledger Name <span className="text-danger">*</span>
              </Label>
              <Input value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="Enter ledger name" />
            </Col>
            <Col md={4} className="mb-3">
              <Label>
                Normal Balance <span className="text-danger">*</span>
              </Label>
              <Input type="select" value={f.normalBalanceType} onChange={(e) => set({ normalBalanceType: e.target.value })}>
                <option value="">Select</option>
                <option value="debit">Debit (DR)</option>
                <option value="credit">Credit (CR)</option>
              </Input>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Check
                checked={isGroup}
                disabled={editing}
                onChange={(v) => set({ postingType: v ? "group" : "detail", ...(v ? { openingBalance: 0 } : { isControlAccount: false, controlAccountType: "" }) })}
                title="Group account"
                sub="Summary node: no direct posting. Other ledgers sit under it"
              />
            </Col>
            <Col md={6}>
              <Check
                checked={!f.isBlockedForPosting}
                disabled={isGroup}
                onChange={(v) => set({ isBlockedForPosting: !v })}
                title="Allow direct posting"
                sub={isGroup ? "A group account cannot be posted to" : "Transactions can post to this ledger directly"}
              />
            </Col>
          </Row>

          <h6 className="uom-form-section-title mt-3">Control and Sub-Ledger Management</h6>
          <Row>
            <Col md={4} className="mb-3">
              <Check
                checked={f.isControlAccount}
                disabled={!isGroup}
                onChange={(v) => set({ isControlAccount: v, controlAccountType: v ? f.controlAccountType : "" })}
                title="Control account"
                sub={isGroup ? "Tracks its sub-ledgers (for example one per vendor)" : "Only a group account can be a control account"}
              />
            </Col>
            <Col md={4} className="mb-3">
              <Label>Control Account Type</Label>
              <Input type="select" value={f.controlAccountType} disabled={!f.isControlAccount} onChange={(e) => set({ controlAccountType: e.target.value })}>
                <option value="">Select</option>
                {CONTROL_TYPES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Input>
            </Col>
            <Col md={4} className="mb-3">
              <Check checked={f.isContraAccount} onChange={(v) => set({ isContraAccount: v })} title="Contra account" sub="Offsets another ledger's balance" />
            </Col>
            <Col md={4} className="mb-3">
              <Label>Linked Account Code</Label>
              <Input value={f.linkedAccountCode} onChange={(e) => set({ linkedAccountCode: e.target.value })} />
            </Col>
          </Row>

          <h6 className="uom-form-section-title mt-3">Currency and Opening Balance</h6>
          <Row>
            <Col md={3} className="mb-3">
              <Label>Currency</Label>
              <Input value={f.currencyCode} maxLength={3} onChange={(e) => set({ currencyCode: e.target.value.toUpperCase() })} />
            </Col>
            <Col md={3} className="mb-3">
              <Label>Opening Balance</Label>
              <Input type="number" min={0} value={f.openingBalance} disabled={isGroup} onFocus={(e) => e.target.select()} onChange={(e) => set({ openingBalance: e.target.value })} />
            </Col>
            <Col md={3} className="mb-3">
              <Label>Opening Balance Side</Label>
              <Input type="select" value={f.openingBalanceType} disabled={isGroup} onChange={(e) => set({ openingBalanceType: e.target.value })}>
                <option value="debit">Debit (DR)</option>
                <option value="credit">Credit (CR)</option>
              </Input>
            </Col>
          </Row>

          <h6 className="uom-form-section-title mt-3">Reporting and Other Details</h6>
          <Row>
            <Col md={4} className="mb-3">
              <Label>Financial Statement</Label>
              <Input type="select" value={f.financialStatementGroup} onChange={(e) => set({ financialStatementGroup: e.target.value })}>
                <option value="">Not set</option>
                <option value="Balance Sheet">Balance Sheet</option>
                <option value="Profit & Loss">Profit &amp; Loss</option>
              </Input>
            </Col>
            <Col md={4} className="mb-3">
              <Label>Cash Flow Classification</Label>
              <Input type="select" value={f.cashFlowClassification} onChange={(e) => set({ cashFlowClassification: e.target.value })}>
                <option value="not_applicable">Not applicable</option>
                <option value="operating">Operating</option>
                <option value="investing">Investing</option>
                <option value="financing">Financing</option>
              </Input>
            </Col>
            <Col md={2} className="mb-3">
              <Label>Cost Centre</Label>
              <Input value={f.costCenter} onChange={(e) => set({ costCenter: e.target.value })} />
            </Col>
            <Col md={2} className="mb-3">
              <Label>Location</Label>
              <Input value={f.location} onChange={(e) => set({ location: e.target.value })} />
            </Col>
            <Col md={12} className="mb-3">
              <Label>Notes</Label>
              <Input type="textarea" rows={2} value={f.notes} onChange={(e) => set({ notes: e.target.value })} />
            </Col>
          </Row>

          <div className="uom-form-footer d-flex justify-content-end gap-2 mt-4">
            <Button type="button" color="light" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" color="primary" disabled={saving}>
              {saving ? "Saving..." : editing ? "Save changes" : "Create Ledger"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LedgerForm;
