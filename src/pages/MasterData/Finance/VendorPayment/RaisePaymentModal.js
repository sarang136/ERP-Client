import React, { useEffect, useMemo, useState } from "react";
import { Button, Input, Label, Modal, ModalBody, Row, Col, FormText } from "reactstrap";
import { toast } from "react-toastify";
import { getPayableInvoices, createVendorPayment } from "../../../../helpers/backend_helper";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { useReferenceList } from "../../../../Components/Hooks/useReferenceData";
import { categoryOptions } from "../../../../Components/constants/centralPayment";
import { money, errText, dateText, supplierName, newRequestId } from "./vpUi";
import { TYPE_LABELS } from "../VendorInvoice/viUi";

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// "Invoices ready to request": pick an approved bill, say how much to pay now, raise the request.
// Raising it puts the payment into Central Payment, where it is approved and paid.
const RaisePaymentModal = ({ onClose, onRaised, startInvoiceId }) => {
  const handleAuthError = useAuthError();
  const { items: centers } = useReferenceList("centers");
  const [invoices, setInvoices] = useState(null);
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState(null);
  const [amount, setAmount] = useState("");
  const [tds, setTds] = useState("");
  const [tdsTouched, setTdsTouched] = useState(false); // once the person types a TDS, it is not recalculated
  const [centerId, setCenterId] = useState("");
  const [category, setCategory] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [requestId] = useState(() => newRequestId());

  useEffect(() => {
    getPayableInvoices()
      .then((res) => {
        const rows = res?.data || [];
        setInvoices(rows);
        const start = startInvoiceId && rows.find((r) => r._id === startInvoiceId);
        if (start) choose(start);
      })
      .catch((e) => {
        onClose();
        if (!handleAuthError(e)) toast.error(errText(e, "Couldn't load the invoices."));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // TDS from the vendor's record: its rate on the taxable part of what is paid (not on the GST), to the paisa
  const suggestTds = (inv, gross) => {
    if (!inv?.tds || !(gross > 0)) return "";
    return String(Math.round((gross * 100 * inv.tds.taxableShare * inv.tds.rate) / 100) / 100);
  };

  const choose = (inv) => {
    setPicked(inv);
    setAmount(String(inv.balanceToRequest));
    setTdsTouched(false);
    setTds(suggestTds(inv, inv.balanceToRequest));
    setDueDate(inv.dueDate ? String(inv.dueDate).slice(0, 10) : "");
  };

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (invoices || []).filter((i) => !q || [i.vendorInvoiceNumber, i.invoiceRecordNumber, supplierName(i.vendorId), i.poId?.poNumber, i.purpose].some((x) => String(x || "").toLowerCase().includes(q)));
  }, [invoices, search]);

  const gross = num(amount);
  const net = Math.round((gross - num(tds)) * 100) / 100;
  const bank = picked?.vendorId?.bankDetails;
  const noBank = picked && (!bank?.accountNo || !bank?.ifsc);

  const submit = async () => {
    if (saving) return;
    if (!(gross > 0)) return toast.error("Enter the amount to pay");
    if (gross > picked.balanceToRequest + 0.001) return toast.error(`Only ${money(picked.balanceToRequest)} of this bill is left to ask for`);
    if (net < 0) return toast.error("The TDS cannot be more than the payment amount");
    if (!centerId) return toast.error("Choose the centre");
    if (!category) return toast.error("Choose the category");
    setSaving(true);
    try {
      const res = await createVendorPayment({
        invoiceId: picked._id,
        amount: gross,
        tdsAmount: num(tds),
        centerId,
        category,
        ...(dueDate ? { dueDate } : {}),
        ...(remarks.trim() ? { remarks: remarks.trim() } : {}),
        requestId,
      });
      toast.success(res?.message || "Payment request raised");
      (res?.warnings || []).forEach((w) => toast.warning(w, { autoClose: 9000 }));
      onRaised();
    } catch (e) {
      if (!handleAuthError(e)) toast.error(errText(e, "Couldn't raise the request."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen toggle={onClose} centered size="lg" scrollable>
      <ModalBody className="p-4">
        <h5 className="mb-1">{picked ? "Raise a payment request" : "Invoices ready to request"}</h5>
        <div className="text-muted small mb-3">Raising a request sends the payment to Central Payment, where it is approved and paid.</div>

        {!picked ? (
          <>
            <Input className="mb-3" placeholder="Search invoice, vendor, PO or purpose" value={search} onChange={(e) => setSearch(e.target.value)} />
            {invoices === null ? (
              <div className="text-muted text-center py-4">Loading...</div>
            ) : shown.length === 0 ? (
              <div className="text-muted text-center py-4">{invoices.length ? "No invoice matches your search." : "Every approved bill already has a payment request."}</div>
            ) : (
              <div className="table-responsive" style={{ maxHeight: 380 }}>
                <table className="table table-sm align-middle">
                  <thead><tr><th>Invoice</th><th>Vendor</th><th>Due</th><th className="text-end">Left to ask for</th><th></th></tr></thead>
                  <tbody>
                    {shown.map((i) => (
                      <tr key={i._id}>
                        <td>
                          <div>{i.vendorInvoiceNumber}</div>
                          <div className="text-muted small">{i.invoiceRecordNumber} · {TYPE_LABELS[i.invoiceType] || "Tax invoice"}</div>
                        </td>
                        <td>{supplierName(i.vendorId)}</td>
                        <td>{dateText(i.dueDate)}</td>
                        <td className="text-end">{money(i.balanceToRequest)}</td>
                        <td className="text-end"><Button size="sm" color="primary" onClick={() => choose(i)}>Pay</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="d-flex justify-content-end mt-3"><Button color="light" onClick={onClose}>Close</Button></div>
          </>
        ) : (
          <>
            <div className="border rounded p-3 mb-3 bg-light">
              <div className="fw-semibold">{supplierName(picked.vendorId)}</div>
              <div className="text-muted small">{picked.vendorInvoiceNumber} · {picked.invoiceRecordNumber} · bill total {money(picked.totalAmount)} · left to ask for {money(picked.balanceToRequest)}</div>
            </div>
            {picked.tds && !picked.tds.hasPan && <div className="alert alert-warning py-2">This vendor has TDS but no PAN on record. Check the rate: it may need to be higher.</div>}
            {noBank && <div className="alert alert-warning py-2">This vendor has no complete bank details. Add them in the vendor record before the payment goes to the bank.</div>}
            <Row className="g-3">
              <Col md={4}>
                <Label>Amount to pay now <span className="text-danger">*</span></Label>
                <Input
                  type="number" min="0" step="0.01" value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (!tdsTouched) setTds(suggestTds(picked, num(e.target.value)));
                  }}
                />
                <FormText>Up to {money(picked.balanceToRequest)}. Pay part now and the rest later if you want.</FormText>
              </Col>
              <Col md={4}>
                <Label>TDS <span className="text-muted small">(optional)</span></Label>
                <Input type="number" min="0" step="0.01" value={tds} onChange={(e) => { setTdsTouched(true); setTds(e.target.value); }} placeholder="0.00" />
                {picked.tds ? (
                  <FormText>
                    From the vendor record: {picked.tds.section ? `${picked.tds.section} ` : ""}@ {picked.tds.rate}% on the taxable part. You can change it.
                    {tdsTouched && (
                      <button type="button" className="btn btn-link p-0 ms-1 align-baseline small" onClick={() => { setTdsTouched(false); setTds(suggestTds(picked, gross)); }}>Reset</button>
                    )}
                  </FormText>
                ) : (
                  <FormText>No TDS is set on this vendor.</FormText>
                )}
              </Col>
              <Col md={4}>
                <Label>Net payable to the vendor</Label>
                <div className="fs-5 fw-semibold pt-1">{money(net)}</div>
              </Col>
              <Col md={6}>
                <Label>Centre <span className="text-danger">*</span></Label>
                <Input type="select" value={centerId} onChange={(e) => setCenterId(e.target.value)}>
                  <option value="">Choose the centre</option>
                  {centers.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
                </Input>
              </Col>
              <Col md={6}>
                <Label>Category <span className="text-danger">*</span></Label>
                <Input type="select" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">Choose the category</option>
                  {categoryOptions.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </Input>
                {/* <FormText>The same list Central Payment uses. It decides the expense ledger in Tally. It can still be corrected in Central Payment.</FormText> */}
              </Col>
              <Col md={6}>
                <Label>Due date <span className="text-muted small">(optional)</span></Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </Col>
              <Col md={6}>
                <Label>Remarks <span className="text-muted small">(optional, goes to Central Payment as the description)</span></Label>
                <Input value={remarks} maxLength={20} onChange={(e) => setRemarks(e.target.value)} />
              </Col>
            </Row>
            <div className="d-flex justify-content-between mt-4">
              <Button color="light" onClick={() => setPicked(null)} disabled={saving}>Back</Button>
              <div className="d-flex gap-2">
                <Button color="light" onClick={onClose} disabled={saving}>Cancel</Button>
                <Button color="primary" onClick={submit} disabled={saving}>{saving ? "Raising..." : "Raise payment request"}</Button>
              </div>
            </div>
          </>
        )}
      </ModalBody>
    </Modal>
  );
};

export default RaisePaymentModal;
