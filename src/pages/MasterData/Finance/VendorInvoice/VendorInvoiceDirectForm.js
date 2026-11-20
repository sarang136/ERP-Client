import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, Input, Label, Row, Col, FormText } from "reactstrap";
import Select from "react-select";
import { toast } from "react-toastify";
import {
  getPOs,
  getPoBillingSummary,
  createDirectVendorInvoice,
  updateDirectVendorInvoice,
} from "../../../../helpers/backend_helper";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { useReferenceList } from "../../../../Components/Hooks/useReferenceData";
import { INVOICE_TYPES, TYPE_LABELS, fetchPostingLedgers, money, errText, dateInput, todayInput, fileSize, newRequestId, supplierName } from "./viUi";
import "../../UnitOfMeasurement/uom.scss";

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const paise = (v) => Math.round(num(v) * 100);

const Step = ({ no, title, hint, children }) => (
  <div className="uom-table-card p-4 mb-3">
    <div className="d-flex align-items-start gap-3 mb-3">
      <span className="badge rounded-pill bg-dark" style={{ minWidth: 26 }}>{no}</span>
      <div>
        <h6 className="mb-0">{title}</h6>
        {hint && <div className="text-muted small">{hint}</div>}
      </div>
    </div>
    {children}
  </div>
);

// editing = a draft or rejected bill that is being changed (null for a new bill)
const VendorInvoiceDirectForm = ({ editing, onSaved, onCancel }) => {
  const handleAuthError = useAuthError();
  const { items: vendors } = useReferenceList("vendors");
  const { items: departments } = useReferenceList("departments");
  const requestId = useRef(newRequestId());

  const [pos, setPos] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [saving, setSaving] = useState(false);

  const [type, setType] = useState(editing?.invoiceType || "tax_invoice");
  const [withoutPo, setWithoutPo] = useState(editing ? !editing.poId && editing.invoiceType === "tax_invoice" : false);
  const [poId, setPoId] = useState(editing?.poId?._id || "");
  const [vendorId, setVendorId] = useState(editing?.vendorId?._id || "");
  const [buyerGstin, setBuyerGstin] = useState(editing?.buyerGstin || "");
  const [invoiceNo, setInvoiceNo] = useState(editing?.vendorInvoiceNumber || "");
  const [invoiceDate, setInvoiceDate] = useState(dateInput(editing?.vendorInvoiceDate));
  const [dueDate, setDueDate] = useState(dateInput(editing?.dueDate));
  const [taxable, setTaxable] = useState(editing ? String(editing.subtotal ?? "") : "");
  const [tax, setTax] = useState(editing ? String(editing.taxAmount ?? "") : "");
  const [taxTouched, setTaxTouched] = useState(!!editing); // once the person keys or picks a tax, the PO rate no longer overwrites it
  const [poInfo, setPoInfo] = useState(null); // what the chosen PO has been billed so far
  const [purpose, setPurpose] = useState(editing?.purpose || "");
  const [departmentId, setDepartmentId] = useState(editing?.departmentId?._id || "");
  const [remarks, setRemarks] = useState(editing?.remarks || "");
  const [lines, setLines] = useState(
    (editing?.allocations || []).map((a) => ({ ledgerId: a.ledgerId?._id || a.ledgerId, amount: String(a.amount), note: a.note || "" })),
  );
  const [supplierFile, setSupplierFile] = useState(null);
  const [supportFiles, setSupportFiles] = useState([]);
  const [removeDocs, setRemoveDocs] = useState([]);

  useEffect(() => {
    getPOs({ status: "approved" })
      .then((res) => setPos(res?.data || []))
      .catch((e) => !handleAuthError(e) && toast.error(errText(e, "Couldn't load purchase orders.")));
    fetchPostingLedgers()
      .then((rows) => setLedgers(rows))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const needsPo = type === "advance" || (type === "tax_invoice" && !withoutPo);
  const total = Math.round((num(taxable) + num(tax)) * 100) / 100;
  const allocated = lines.reduce((s, l) => s + paise(l.amount), 0) / 100;

  const poOptions = useMemo(() => {
    const list = pos.map((p) => ({ value: p._id, label: `${p.poNumber} · ${p.poTitle || "—"} · ${supplierName(p.vendorId)}`, vendorId: p.vendorId?._id, vendorName: supplierName(p.vendorId), po: p }));
    if (editing?.poId?._id && !list.some((o) => o.value === editing.poId._id)) {
      list.unshift({ value: editing.poId._id, label: editing.poId.poNumber, vendorId: editing.vendorId?._id, vendorName: supplierName(editing.vendorId) });
    }
    return list;
  }, [pos, editing]);
  const vendorOptions = useMemo(() => vendors.map((v) => ({ value: v._id, label: `${supplierName(v)}${v.vendorCode ? ` (${v.vendorCode})` : ""}` })), [vendors]);
  const departmentOptions = useMemo(() => departments.map((d) => ({ value: d._id, label: d.name })), [departments]);
  const ledgerOptions = useMemo(() => ledgers.map((l) => ({ value: l._id, label: `${l.ledgerCode} · ${l.name}` })), [ledgers]);

  const chosenPo = poOptions.find((o) => o.value === poId) || null;
  const supplierLabel = needsPo ? chosenPo?.vendorName : vendorOptions.find((o) => o.value === vendorId)?.label;

  // Choosing a PO shows what it has been billed so far and fills what it already says: the taxable amount is
  // what is left to bill, the tax follows the PO's own rate, and the purpose and department fill only when empty.
  const loadPo = async (id, prefill) => {
    if (!id) return setPoInfo(null);
    try {
      const res = await getPoBillingSummary(id, editing?._id);
      const info = res?.data;
      if (!info) return;
      setPoInfo(info);
      if (!prefill) return;
      setTaxTouched(false);
      const left = info.leftToBill > 0 ? info.leftToBill : 0;
      setTaxable(left ? String(left) : "");
      setTax(left ? (Math.round(left * info.taxPercent) / 100).toFixed(2) : "0.00");
      if (!departmentId && info.departmentId) setDepartmentId(info.departmentId);
      if (!purpose.trim() && info.poTitle) setPurpose(info.poTitle.slice(0, 200));
    } catch (e) {
      if (!handleAuthError(e)) toast.error(errText(e, "Couldn't load the purchase order's billing."));
    }
  };

  useEffect(() => {
    if (editing?.poId?._id) loadPo(editing.poId._id, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeTaxable = (v) => {
    setTaxable(v);
    if (poInfo && !taxTouched && type !== "proforma") setTax(num(v) > 0 ? (Math.round(num(v) * poInfo.taxPercent) / 100).toFixed(2) : "");
  };

  const changeType = (t) => {
    setType(t);
    setPoInfo(null);
    setPoId("");
    setVendorId("");
    if (t !== "tax_invoice") setWithoutPo(false);
  };

  const setLine = (i, patch) => setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const allocateFull = () => setLines([{ ledgerId: "", amount: total ? String(total) : "", note: "" }]);
  const addLine = () => setLines((ls) => [...ls, { ledgerId: "", amount: "", note: "" }]);

  const checklist = [
    [needsPo ? "Purchase order chosen" : "Supplier chosen", needsPo ? !!poId : !!vendorId],
    ["Invoice number entered", !!invoiceNo.trim()],
    ["Invoice date entered", !!invoiceDate],
    ["Taxable amount entered", num(taxable) > 0],
    ["Purpose entered", purpose.trim().length >= 2],
    ["Department chosen", !!departmentId],
  ];
  const left = checklist.filter(([, done]) => !done).length;

  const validate = () => {
    if (left) return `${left} thing${left > 1 ? "s" : ""} left: ${checklist.filter(([, d]) => !d).map(([t]) => t.replace(/ (chosen|entered)$/, "")).join(", ")}`;
    if (invoiceDate > todayInput()) return "The supplier invoice date cannot be in the future";
    if (dueDate && dueDate < invoiceDate) return "The due date must be on or after the supplier invoice date";
    if (lines.length) {
      if (lines.some((l) => !l.ledgerId)) return "Choose a ledger on every allocation line";
      if (lines.some((l) => !(num(l.amount) > 0))) return "Enter an amount above 0 on every allocation line";
      if (paise(allocated) !== paise(total)) return `The allocation (${money(allocated)}) must equal the bill total (${money(total)})`;
    }
    return "";
  };

  const save = async (submit) => {
    if (saving) return;
    const problem = validate();
    if (problem) return toast.error(problem);
    if (submit && !supplierFile && !editing?.supplierInvoiceFile?.url) return toast.error("Attach the supplier's invoice before submitting. You can save as a draft without it");
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("invoiceType", type);
      fd.append("withoutPo", String(type === "tax_invoice" && withoutPo));
      if (needsPo) fd.append("poId", poId);
      else fd.append("vendorId", vendorId);
      fd.append("vendorInvoiceNumber", invoiceNo.trim());
      fd.append("vendorInvoiceDate", invoiceDate);
      if (dueDate) fd.append("dueDate", dueDate);
      fd.append("taxableAmount", String(num(taxable)));
      fd.append("taxAmount", String(num(tax)));
      fd.append("purpose", purpose.trim());
      fd.append("departmentId", departmentId);
      if (buyerGstin.trim()) fd.append("buyerGstin", buyerGstin.trim());
      if (remarks.trim()) fd.append("remarks", remarks.trim());
      fd.append("allocations", JSON.stringify(lines.map((l) => ({ ledgerId: l.ledgerId, amount: num(l.amount), note: l.note }))));
      fd.append("submit", String(!!submit));
      if (editing) fd.append("removeDocs", JSON.stringify(removeDocs));
      else fd.append("requestId", requestId.current);
      if (supplierFile) fd.append("supplierInvoice", supplierFile);
      supportFiles.forEach((f) => fd.append("supportingDocs", f));

      const res = editing ? await updateDirectVendorInvoice(editing._id, fd) : await createDirectVendorInvoice(fd);
      toast.success(res?.message || "Saved");
      (res?.warnings || []).forEach((w) => toast.warning(w, { autoClose: 9000 }));
      onSaved();
    } catch (error) {
      if (!handleAuthError(error)) toast.error(errText(error, "Couldn't save the bill."));
    } finally {
      setSaving(false);
    }
  };

  const keptDocs = (editing?.supportingDocs || []).filter((d) => !removeDocs.includes(d.path));
  const docRoom = 10 - keptDocs.length - supportFiles.length;

  return (
    <div className="uom-page">
      <div className="uom-list-header">
        <div>
          <h4>{editing ? `Edit bill ${editing.invoiceRecordNumber}` : "New vendor invoice"}</h4>
          <p>Book a supplier bill and route it for approval</p>
        </div>
        <Button color="light" onClick={onCancel} disabled={saving}>Cancel</Button>
      </div>

      {editing?.approval?.status === "rejected" && editing.approval.rejectReason && (
        <div className="alert alert-danger py-2">
          <strong>Sent back:</strong> {editing.approval.rejectReason}
        </div>
      )}

      <Row>
        <Col lg={8}>
          <Step no="1" title="Invoice type" hint="Pick what the supplier sent. It decides what the bill is matched against.">
            <div className="d-flex gap-2 flex-wrap">
              {INVOICE_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  disabled={!!editing}
                  className={`btn text-start ${type === t.value ? "btn-dark" : "btn-light"}`}
                  style={{ minWidth: 200 }}
                  onClick={() => changeType(t.value)}
                >
                  <div className="fw-semibold">{t.label}</div>
                  <div className="small" style={{ opacity: 0.75 }}>{t.hint}</div>
                </button>
              ))}
            </div>
            {editing && <FormText>The type of a saved bill cannot be changed. Raise a new bill instead.</FormText>}
          </Step>

          <Step
            no="2"
            title="Supplier"
            hint={type === "advance" ? "Pick the purchase order this advance is paid against." : needsPo ? "Match the bill to the purchase order it charges against." : "Who sent the bill."}
          >
            {type === "tax_invoice" && (
              <div className="form-check form-switch mb-3">
                <Input type="switch" id="without-po" checked={withoutPo} onChange={(e) => { setWithoutPo(e.target.checked); setPoId(""); setVendorId(""); }} />
                <Label for="without-po" className="form-check-label">
                  Raise without a PO <span className="text-muted small">(ad-hoc charges, retainers, reimbursements)</span>
                </Label>
              </div>
            )}
            {needsPo ? (
              <>
                <Label>Purchase order <span className="text-danger">*</span></Label>
                <Select
                  options={poOptions}
                  value={chosenPo}
                  onChange={(o) => { setPoId(o?.value || ""); setVendorId(o?.vendorId || ""); loadPo(o?.value, true); }}
                  placeholder="Search by PO number, title or supplier"
                  isClearable
                />
                <FormText>{type === "advance" ? "The advance counts against this PO's balance. " : ""}Choosing a PO fills in the supplier, what is left to bill, the tax at the PO's rate, the purpose and the department. Change them to match the supplier's invoice.</FormText>
                {chosenPo && (
                  <div className="mt-2"><span className="text-muted small">Supplier: </span><strong>{chosenPo.vendorName}</strong></div>
                )}
                {poInfo && (
                  <div className="border rounded p-3 mt-3 bg-light">
                    <div className="fw-semibold mb-2">{poInfo.poNumber} <span className="text-muted small">· figures before tax</span></div>
                    <Row className="g-2 small">
                      <Col xs={6} md={4}><div className="text-muted">PO value</div><div className="fw-semibold">{money(poInfo.poValue)}</div></Col>
                      <Col xs={6} md={4}><div className="text-muted">Paid</div><div className="fw-semibold">{money(poInfo.paid)}</div></Col>
                      <Col xs={6} md={4}><div className="text-muted">Approved, not paid</div><div className="fw-semibold">{money(poInfo.approvedNotPaid)}</div></Col>
                      <Col xs={6} md={4}><div className="text-muted">In approval</div><div className="fw-semibold">{money(poInfo.inApproval)}</div></Col>
                      <Col xs={6} md={4}><div className="text-muted">Left to bill</div><div className="fw-semibold text-success">{money(poInfo.leftToBill)}</div></Col>
                      <Col xs={6} md={4}>
                        <div className="text-muted">Left after this bill</div>
                        <div className={`fw-semibold ${num(taxable) > poInfo.leftToBill + 0.5 ? "text-danger" : ""}`}>{money(Math.max(0, poInfo.leftToBill - num(taxable)))}</div>
                      </Col>
                    </Row>
                    <div className="text-muted small mt-2">PO total {money(poInfo.poTotal)} incl. {money(poInfo.poTax)} tax ({poInfo.taxPercent}%). Tax and advance bills count; proformas do not.</div>
                    {num(taxable) > poInfo.leftToBill + 0.5 && <div className="text-danger small mt-1">This bill is more than what is left on the PO. It can still be sent, but the approver will see it.</div>}
                  </div>
                )}
              </>
            ) : (
              <>
                <Label>Supplier <span className="text-danger">*</span></Label>
                <Select
                  options={vendorOptions}
                  value={vendorOptions.find((o) => o.value === vendorId) || null}
                  onChange={(o) => setVendorId(o?.value || "")}
                  placeholder="Search suppliers"
                  isClearable
                />
                <FormText>Only approved suppliers can be billed.</FormText>
              </>
            )}
            <div className="mt-3">
              <Label>Buyer</Label>
              <Input value="Jagruti Rehab Centre Private Limited" disabled readOnly />
              <FormText>Every bill is addressed to the company. This cannot be changed.</FormText>
            </div>
            <div className="mt-3">
              <Label>Buyer GSTIN <span className="text-muted small">(optional)</span></Label>
              <Input value={buyerGstin} onChange={(e) => setBuyerGstin(e.target.value.toUpperCase())} maxLength={20} placeholder="Our GSTIN as written on the bill" />
            </div>
          </Step>

          <Step no="3" title="Bill details" hint="Key these exactly as they appear on the supplier's invoice.">
            <Row className="g-3">
              <Col md={6}>
                <Label>Invoice number <span className="text-danger">*</span></Label>
                <Input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} placeholder="e.g. INV-2026-0142" maxLength={60} />
              </Col>
              <Col md={3}>
                <Label>Supplier invoice date <span className="text-danger">*</span></Label>
                <Input type="date" value={invoiceDate} max={todayInput()} onChange={(e) => setInvoiceDate(e.target.value)} />
              </Col>
              <Col md={3}>
                <Label>Due date <span className="text-muted small">(optional)</span></Label>
                <Input type="date" value={dueDate} min={invoiceDate || undefined} onChange={(e) => setDueDate(e.target.value)} />
              </Col>
              <Col md={4}>
                <Label>Currency</Label>
                <Input value="Indian Rupee (INR)" disabled readOnly />
              </Col>
              <Col md={4}>
                <Label>Taxable amount <span className="text-danger">*</span></Label>
                <Input type="number" min="0" step="0.01" value={taxable} onChange={(e) => changeTaxable(e.target.value)} placeholder="0.00" />
                <FormText>Before tax.</FormText>
              </Col>
              <Col md={4}>
                <Label>Tax <span className="text-muted small">(optional)</span></Label>
                <Input type="number" min="0" step="0.01" value={tax} onChange={(e) => { setTaxTouched(true); setTax(e.target.value); }} placeholder="0.00" />
                <div className="d-flex gap-1 flex-wrap mt-1">
                  {[0, 5, 12, 18, 28].map((r) => (
                    <button key={r} type="button" className="btn btn-sm btn-light py-0 px-2" disabled={!(num(taxable) > 0)} onClick={() => { setTaxTouched(true); setTax((Math.round(num(taxable) * r) / 100).toFixed(2)); }}>
                      {r}%
                    </button>
                  ))}
                </div>
                <FormText className={num(tax) > num(taxable) && num(taxable) > 0 ? "text-danger" : ""}>
                  {num(tax) > num(taxable) && num(taxable) > 0 ? "The tax is more than the taxable amount. Check it against the bill." : "GST or other tax on top. Tap a rate to fill it from the taxable amount, or key what the bill says."}
                </FormText>
              </Col>
              <Col md={6}>
                <Label>Purpose <span className="text-danger">*</span></Label>
                <Input value={purpose} onChange={(e) => setPurpose(e.target.value)} maxLength={200} placeholder="What the bill is for" />
                <FormText>Shown to approvers and on the payment advice.</FormText>
              </Col>
              <Col md={6}>
                <Label>Department <span className="text-danger">*</span></Label>
                <Select
                  options={departmentOptions}
                  value={departmentOptions.find((o) => o.value === departmentId) || null}
                  onChange={(o) => setDepartmentId(o?.value || "")}
                  placeholder="Choose a department"
                />
              </Col>
              <Col xs={12}>
                <Label>Remarks <span className="text-muted small">(optional)</span></Label>
                <Input type="textarea" rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} maxLength={500} placeholder="e.g. Partial delivery. Balance due next week" />
                <FormText>Shown to approvers on the invoice page.</FormText>
              </Col>
            </Row>
          </Step>

          <Step no="4" title="Accounting" hint="Optional. Say which ledgers the bill belongs to now, or leave it for the approver. Nothing is posted to the books yet.">
            {lines.length === 0 ? (
              <div>
                <div className="text-muted mb-2">Not allocated yet. {total > 0 ? "" : "Enter the taxable amount first to allocate the full bill in one go."}</div>
                <div className="d-flex gap-2">
                  <Button size="sm" color="light" disabled={!(total > 0)} onClick={allocateFull}>Allocate full amount</Button>
                  <Button size="sm" color="light" onClick={() => setLines([{ ledgerId: "", amount: "", note: "" }, { ledgerId: "", amount: "", note: "" }])}>Split across ledgers</Button>
                </div>
              </div>
            ) : (
              <>
                {lines.map((l, i) => (
                  <Row key={i} className="g-2 mb-2 align-items-center">
                    <Col md={5}>
                      <Select
                        options={ledgerOptions}
                        value={ledgerOptions.find((o) => o.value === l.ledgerId) || null}
                        onChange={(o) => setLine(i, { ledgerId: o?.value || "" })}
                        placeholder="Choose a ledger"
                      />
                    </Col>
                    <Col md={3}>
                      <Input type="number" min="0" step="0.01" value={l.amount} onChange={(e) => setLine(i, { amount: e.target.value })} placeholder="Amount" />
                    </Col>
                    <Col md={3}>
                      <Input value={l.note} onChange={(e) => setLine(i, { note: e.target.value })} placeholder="Note (optional)" maxLength={200} />
                    </Col>
                    <Col md={1} className="text-end">
                      <Button size="sm" color="light" title="Remove" onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))}>
                        <i className="bx bx-trash text-danger"></i>
                      </Button>
                    </Col>
                  </Row>
                ))}
                <div className="d-flex justify-content-between align-items-center mt-2">
                  <Button size="sm" color="light" onClick={addLine}><i className="bx bx-plus me-1"></i>Add a line</Button>
                  <span className={paise(allocated) === paise(total) ? "text-success" : "text-danger"}>
                    Allocated {money(allocated)} of {money(total)}
                    {paise(allocated) !== paise(total) && ` (${money(Math.abs(total - allocated))} ${total > allocated ? "left" : "over"})`}
                  </span>
                </div>
              </>
            )}
          </Step>

          <Step no="5" title="Documents" hint="Up to 10 supporting files, 5 MB each. The supplier's invoice up to 10 MB.">
            <Label>Supplier invoice <span className="text-danger">*</span> <span className="text-muted small">(needed to submit; a draft can be saved without it)</span></Label>
            {editing?.supplierInvoiceFile?.url && !supplierFile && (
              <div className="mb-2 small">
                Saved copy: <a href={editing.supplierInvoiceFile.url} target="_blank" rel="noreferrer">{editing.supplierInvoiceFile.originalName || "open"}</a>. Choose a file below to replace it.
              </div>
            )}
            <Input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif" onChange={(e) => setSupplierFile(e.target.files?.[0] || null)} />
            <FormText>PDF, JPG, PNG, WEBP or HEIC, up to 10 MB.</FormText>

            <Label className="mt-3">Supporting documents <span className="text-muted small">(optional)</span></Label>
            {keptDocs.map((d) => (
              <div key={d.path} className="d-flex justify-content-between align-items-center border rounded px-2 py-1 mb-1">
                <a href={d.url} target="_blank" rel="noreferrer">{d.originalName || "document"}</a>
                <Button size="sm" color="light" onClick={() => setRemoveDocs((r) => [...r, d.path])}><i className="bx bx-x"></i></Button>
              </div>
            ))}
            {supportFiles.map((f, i) => (
              <div key={`${f.name}-${i}`} className="d-flex justify-content-between align-items-center border rounded px-2 py-1 mb-1">
                <span>{f.name} <span className="text-muted small">({fileSize(f.size)})</span></span>
                <Button size="sm" color="light" onClick={() => setSupportFiles((fs) => fs.filter((_, idx) => idx !== i))}><i className="bx bx-x"></i></Button>
              </div>
            ))}
            {docRoom > 0 ? (
              <Input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                value=""
                onChange={(e) => {
                  const picked = Array.from(e.target.files || []);
                  const tooBig = picked.find((f) => f.size > 5 * 1024 * 1024);
                  if (tooBig) return toast.error(`"${tooBig.name}" is larger than 5 MB`);
                  if (picked.length > docRoom) toast.error(`Only ${docRoom} more file${docRoom > 1 ? "s" : ""} can be added`);
                  setSupportFiles((fs) => [...fs, ...picked.slice(0, docRoom)]);
                }}
              />
            ) : (
              <FormText>The limit of 10 files is reached.</FormText>
            )}
          </Step>
        </Col>

        <Col lg={4}>
          <div className="uom-table-card p-4" style={{ position: "sticky", top: 16 }}>
            <h6 className="mb-3">Bill summary</h6>
            <div className="d-flex justify-content-between mb-1"><span className="text-muted">Taxable amount</span><span>{money(num(taxable))}</span></div>
            <div className="d-flex justify-content-between mb-1"><span className="text-muted">Tax</span><span>{money(num(tax))}</span></div>
            <div className="d-flex justify-content-between fw-bold border-top pt-2 mt-2"><span>Payable total</span><span>{money(total)}</span></div>
            <div className="mt-2 small text-muted">Type: {TYPE_LABELS[type]}{supplierLabel ? ` · ${supplierLabel}` : ""}</div>
            <ul className="list-unstyled mt-3 mb-3 small">
              {checklist.map(([text, done]) => (
                <li key={text} className={done ? "text-success" : "text-muted"}>
                  <i className={`bx ${done ? "bx-check-circle" : "bx-circle"} me-1`}></i>{text}
                </li>
              ))}
            </ul>
            <div className="d-grid gap-2">
              <Button color="primary" disabled={saving} onClick={() => save(true)}>
                {saving ? "Saving..." : left ? `Submit for approval (${left} left)` : "Submit for approval"}
              </Button>
              <Button color="light" disabled={saving} onClick={() => save(false)}>Save as draft</Button>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default VendorInvoiceDirectForm;
