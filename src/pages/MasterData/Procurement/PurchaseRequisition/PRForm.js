import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Row, Col, Label, Input, FormFeedback, Button } from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import {
  createPR,
  updatePR,
  addPRAttachment,
  removePRAttachment,
  getBudgets,
  getItemMasters,
} from "../../../../helpers/backend_helper";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { useReferenceList } from "../../../../Components/Hooks/useReferenceData";

import "../../UnitOfMeasurement/uom.scss";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

// What is still free in a budget: approved minus what approved POs have already used
const budgetAvailable = (b) =>
  b ? (b.approvedAmount || 0) - (b.consumedAmount || 0) : 0;

const emptyLineItem = () => ({
  itemId: "",
  itemCode: "",
  itemName: "",
  description: "",
  category: "",
  subCategory: "",
  hsnCode: "",
  quantity: 1,
  uomId: "",
  unitPrice: 0,
  taxPercent: 0,
  remarks: "",
});

function generatePreviewPrNumber() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `PR${yy}${mm}${dd}${hh}${min}`;
}

const PRForm = ({ editingItem, onSaved, onCancel }) => {
  const handleAuthError = useAuthError();
  const [previewPrNumber] = useState(generatePreviewPrNumber());
  const [budgets, setBudgets] = useState([]);
const { items: vendors } = useReferenceList("vendorsAll"); 
const { items: uoms } = useReferenceList("uomsAll"); 
  const { items: departments } = useReferenceList("departments");
  const { items: centers } = useReferenceList("centers");

  const [itemSearchState, setItemSearchState] = useState({});
  const itemSearchTimers = useRef({});
  const itemInputRefs = useRef({});

  // Attachments: files already on the PR (edit) and files chosen now, uploaded after the PR is saved
  const [savedFiles, setSavedFiles] = useState(editingItem?.attachments || []);
  const [newFiles, setNewFiles] = useState([]);
  const [removingId, setRemovingId] = useState("");
  const MAX_FILES = 10;
  const MAX_MB = 10;

  const pickFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";
    const room = MAX_FILES - savedFiles.length - newFiles.length;
    const ok = picked.filter((f) => {
      if (f.size > MAX_MB * 1024 * 1024) {
        toast.error(`${f.name} is larger than ${MAX_MB} MB`);
        return false;
      }
      return true;
    });
    if (ok.length > room) toast.error(`A PR can have at most ${MAX_FILES} attachments`);
    setNewFiles((cur) => [...cur, ...ok.slice(0, Math.max(room, 0))]);
  };

  const removeSaved = async (att) => {
    if (removingId) return;
    setRemovingId(att._id);
    try {
      const res = await removePRAttachment(editingItem._id, att._id);
      setSavedFiles(res?.data || savedFiles.filter((a) => a._id !== att._id));
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(error?.response?.data?.message || error?.message || "Couldn't remove the file");
      }
    } finally {
      setRemovingId("");
    }
  };


  const validation = useFormik({
    initialValues: {
      prTitle: editingItem?.prTitle || "",
      prDate: editingItem?.prDate
        ? editingItem.prDate.slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      prType: editingItem?.prType || "standard",
      departmentId:
        editingItem?.departmentId?._id || editingItem?.departmentId || "",
      budgetId: editingItem?.budgetId?._id || editingItem?.budgetId || "",
      preferredVendorId:
        editingItem?.preferredVendorId?._id ||
        editingItem?.preferredVendorId ||
        "",
      contractOrProjectRef: editingItem?.contractOrProjectRef || "",
      requiredByDate: editingItem?.requiredByDate
        ? editingItem.requiredByDate.slice(0, 10)
        : "",
      deliverySiteId:
        editingItem?.deliverySiteId?._id || editingItem?.deliverySiteId || "",
      urgencyLevel: editingItem?.urgencyLevel || "medium",
      remarks: editingItem?.remarks || "",
      lineItems:
        editingItem?.lineItems?.length > 0
          ? editingItem.lineItems.map((li) => ({
              itemId: li.itemId?._id || li.itemId || "",
              itemCode: li.itemCode || "",
              itemName: li.itemName || "",
              description: li.description || "",
              category: li.category || "",
              subCategory: li.subCategory || "",
              hsnCode: li.hsnCode || "",
              quantity: li.quantity ?? 1,
              uomId: li.uomId?._id || li.uomId || "",
              unitPrice: li.unitPrice ?? 0,
              taxPercent: li.taxPercent ?? 0,
              remarks: li.remarks || "",
            }))
          : [emptyLineItem()],
    },
    validationSchema: Yup.object({
      prTitle: Yup.string().trim().required("PR title is required"),
      departmentId: Yup.string().required("Department is required"),
      budgetId: Yup.string().required("Budget is required"),
      deliverySiteId: Yup.string().required("Delivery site is required"),
      lineItems: Yup.array()
        .min(1, "Add at least one line item")
        .of(
          Yup.object({
            itemName: Yup.string().trim().required("Item name is required"),
            quantity: Yup.number()
              .moreThan(0, "Must be greater than 0")
              .required(),
            unitPrice: Yup.number().min(0).required(),
          }),
        ),
    }),
    onSubmit: async (values, { setTouched }) => {
      const errors = await validation.validateForm();
      if (Object.keys(errors).length > 0) {
        setTouched({
          prTitle: true,
          departmentId: true,
          budgetId: true,
          deliverySiteId: true,
          lineItems: true,
        });
        toast.error("Please fill in all required fields");
        return;
      }
      if (selectedBudget && netPayable > budgetAvailable(selectedBudget)) {
        toast.error(
          `This PR (${money(netPayable)}) exceeds the available budget (${money(budgetAvailable(selectedBudget))}). Please reduce the amount or select a different budget.`,
        );
        return;
      }

      const payload = {
        ...values,
        lineItems: values.lineItems.map((li) => ({
          itemId: li.itemId || undefined,
          itemName: li.itemName,
          description: li.description,
          category: li.category,
          subCategory: li.subCategory,
          quantity: Number(li.quantity) || 0,
          uomId: li.uomId || undefined,
          unitPrice: Number(li.unitPrice) || 0,
          taxPercent: Number(li.taxPercent) || 0,
          remarks: li.remarks,
        })),
      };
      if (!payload.preferredVendorId) delete payload.preferredVendorId;
      if (!payload.requiredByDate) delete payload.requiredByDate;

      try {
        let prId = editingItem?._id;
        if (editingItem) {
          await updatePR(editingItem._id, payload);
          toast.success("PR updated successfully");
        } else {
          const res = await createPR(payload);
          prId = res?.data?._id || res?.data?.data?._id;
          toast.success("PR saved as draft");
        }
        // The PR is saved first; the files go up one by one. A failed file never loses the PR.
        const failed = [];
        for (const f of newFiles) {
          try {
            await addPRAttachment(prId, f);
          } catch (err) {
            failed.push(f.name);
          }
        }
        if (failed.length > 0) {
          toast.error(`PR saved, but these files were not attached: ${failed.join(", ")}. Open the PR and add them again.`);
        }
        onSaved();
      } catch (error) {
        if (!handleAuthError(error)) {
          toast.error(
            error?.response?.data?.message ||
              error?.message ||
              "Something went wrong",
          );
        }
      }
    },
  });

  const v = validation.values;

  useEffect(() => {
    if (!v.departmentId || !v.deliverySiteId) {
      setBudgets([]);
      return;
    }
    getBudgets({
      departmentId: v.departmentId,
      centerId: v.deliverySiteId,
      status: "approved",
    })
      .then((res) => setBudgets(res?.data || []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v.departmentId, v.deliverySiteId]);

  const addLineItem = () => {
    validation.setFieldValue("lineItems", [...v.lineItems, emptyLineItem()]);
  };
  const removeLineItem = (idx) => {
    if (v.lineItems.length === 1) return;
    validation.setFieldValue(
      "lineItems",
      v.lineItems.filter((_, i) => i !== idx),
    );
    setItemSearchState((prev) => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
  };
  const updateLineItem = (idx, field, value) => {
    validation.setFieldValue(
      "lineItems",
      v.lineItems.map((li, i) => (i === idx ? { ...li, [field]: value } : li)),
    );
  };

  const setItemSearchFor = (idx, patch) => {
    setItemSearchState((prev) => ({
      ...prev,
      [idx]: {
        search: "",
        options: [],
        showDropdown: false,
        ...prev[idx],
        ...patch,
      },
    }));
  };

  const searchItemsForLine = (idx, term) => {
    const shouldClearOptions = term.trim().length < 2;
    setItemSearchFor(idx, {
      search: term,
      showDropdown: true,
      ...(shouldClearOptions ? { options: [] } : {}),
    });

    if (itemSearchTimers.current[idx])
      clearTimeout(itemSearchTimers.current[idx]);
    if (shouldClearOptions) return;

    itemSearchTimers.current[idx] = setTimeout(() => {
      getItemMasters({ search: term, limit: 10 })
        .then((res) => {
          setItemSearchFor(idx, { options: res?.data || [] });
        })
        .catch(() => {});
    }, 300);
  };

  const selectItemForLine = (idx, item) => {
    validation.setFieldValue(
      "lineItems",
      v.lineItems.map((li, i) =>
        i === idx
          ? {
              ...li,
              itemId: item._id,
              itemCode: item.itemCode || "",
              itemName: item.itemName || "",
              description: item.longDescription || item.itemName || "",
              category: item.assetCategoryL1?.name || "",
              subCategory: item.assetCategoryL2?.name || "",
              hsnCode: item.hsnSacCode || "",
              uomId: item.uomId?._id || item.uomId || li.uomId,
              unitPrice: item.basePrice ?? li.unitPrice,
            }
          : li,
      ),
    );
    setItemSearchFor(idx, {
      search: `${item.itemCode} - ${item.itemName}`,
      options: [],
      showDropdown: false,
    });
  };

  const calc = v.lineItems.reduce(
    (acc, li) => {
      const base = (Number(li.quantity) || 0) * (Number(li.unitPrice) || 0);
      const tax = base * ((Number(li.taxPercent) || 0) / 100);
      acc.subtotal += base;
      acc.tax += tax;
      return acc;
    },
    { subtotal: 0, tax: 0 },
  );
  const netPayable = calc.subtotal + calc.tax;

  const selectedBudget = budgets.find((b) => b._id === v.budgetId);

  return (
    <div className="uom-form-page">
      <h4 className="uom-form-title">
        {editingItem
          ? "Edit Purchase Requisition"
          : "Create Purchase Requisition"}
      </h4>
      <p className="text-muted mb-4">
        Department → Budget → Line items → Submit for approval
      </p>

      <div className="uom-form-panel">
        <form onSubmit={validation.handleSubmit}>
          <h6 className="uom-form-section-title">PR Header</h6>
          <Row>
            <Col md={4} className="mb-4">
              <Label>PR Number</Label>
              <Input
                value={editingItem?.prNumber || previewPrNumber}
                disabled
                style={{ background: "#f8f9fb", color: "#667085" }}
              />
            </Col>
            <Col md={4} className="mb-4">
              <Label>
                PR Title <span className="text-danger">*</span>
              </Label>
              <Input
                name="prTitle"
                placeholder="e.g. 10 hospital beds required"
                value={v.prTitle}
                onChange={validation.handleChange}
                onBlur={validation.handleBlur}
                invalid={
                  validation.touched.prTitle && !!validation.errors.prTitle
                }
              />
              <FormFeedback>{validation.errors.prTitle}</FormFeedback>
            </Col>
            <Col md={4} className="mb-4">
              <Label>PR Date</Label>
              <Input
                type="date"
                name="prDate"
                value={v.prDate}
                onChange={validation.handleChange}
              />
            </Col>
            <Col md={4} className="mb-4">
              <Label>PR Type</Label>
              <Input
                type="select"
                value={v.prType}
                onChange={(e) =>
                  validation.setFieldValue("prType", e.target.value)
                }
              >
                <option value="standard">Standard</option>
                <option value="service">Service</option>
              </Input>
            </Col>
          </Row>

          <Row>
            <Col md={4} className="mb-4">
              <Label>
                Department <span className="text-danger">*</span>
              </Label>
              <Input
                type="select"
                value={v.departmentId}
                onChange={(e) => {
                  validation.setFieldValue("departmentId", e.target.value);
                  validation.setFieldValue("budgetId", "");
                }}
                onBlur={validation.handleBlur}
                invalid={
                  validation.touched.departmentId &&
                  !!validation.errors.departmentId
                }
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </Input>
              <FormFeedback>{validation.errors.departmentId}</FormFeedback>
            </Col>
            <Col md={4} className="mb-4">
              <Label>
                Budget (Cost Center) <span className="text-danger">*</span>
              </Label>
              <Input
                type="select"
                value={v.budgetId}
                disabled={!v.departmentId || !v.deliverySiteId}
                onChange={(e) =>
                  validation.setFieldValue("budgetId", e.target.value)
                }
                onBlur={validation.handleBlur}
                invalid={
                  validation.touched.budgetId && !!validation.errors.budgetId
                }
              >
                <option value="">
                  {v.departmentId && v.deliverySiteId
                    ? "Select Budget"
                    : "Select Delivery Site & Department First"}
                </option>
                {budgets.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.fiscalYear} — {money(budgetAvailable(b))} available of{" "}
                    {money(b.approvedAmount)}
                    {b.budgetType === "global" ? " (Global)" : " (Department)"}
                  </option>
                ))}
              </Input>
              <FormFeedback>{validation.errors.budgetId}</FormFeedback>
              {v.departmentId && v.deliverySiteId && budgets.length === 0 && (
                <div className="text-muted small mt-1">
                  No approved budgets found for this center and department.
                </div>
              )}
            </Col>
            <Col md={4} className="mb-4">
              <Label>Preferred Vendor (Optional)</Label>
              <Input
                type="select"
                value={v.preferredVendorId}
                onChange={(e) =>
                  validation.setFieldValue("preferredVendorId", e.target.value)
                }
              >
                <option value="">Select Vendor (Optional)</option>
                {vendors.map((vd) => (
                  <option key={vd._id} value={vd._id}>
                    {vd.tradeName || vd.legalName}
                  </option>
                ))}
              </Input>
            </Col>
          </Row>

          <h6 className="uom-form-section-title mt-2">Additional Details</h6>
          <Row>
            <Col md={3} className="mb-4">
              <Label>Contract / Project Ref</Label>
              <Input
                name="contractOrProjectRef"
                value={v.contractOrProjectRef}
                onChange={validation.handleChange}
              />
            </Col>
            <Col md={3} className="mb-4">
              <Label>Req. by Date</Label>
              <Input
                type="date"
                name="requiredByDate"
                value={v.requiredByDate}
                onChange={validation.handleChange}
              />
            </Col>
            <Col md={3} className="mb-4">
              <Label>
                Delivery Site <span className="text-danger">*</span>
              </Label>
              <Input
                type="select"
                value={v.deliverySiteId}
                onChange={(e) => {
                  validation.setFieldValue("deliverySiteId", e.target.value);
                  validation.setFieldValue("budgetId", "");
                }}
                onBlur={validation.handleBlur}
                invalid={
                  validation.touched.deliverySiteId &&
                  !!validation.errors.deliverySiteId
                }
              >
                <option value="">Select Delivery Site</option>
                {centers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </Input>
              <FormFeedback>{validation.errors.deliverySiteId}</FormFeedback>
            </Col>
            <Col md={3} className="mb-4">
              <Label>Urgency Level</Label>
              <Input
                type="select"
                value={v.urgencyLevel}
                onChange={(e) =>
                  validation.setFieldValue("urgencyLevel", e.target.value)
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Input>
            </Col>
          </Row>
          <Row>
            <Col md={12} className="mb-4">
              <Label>Remarks</Label>
              <Input
                type="textarea"
                rows={2}
                name="remarks"
                value={v.remarks}
                onChange={validation.handleChange}
              />
            </Col>
          </Row>
          <Row>
            <Col md={12} className="mb-4">
              <Label>
                Attachments{" "}
                <span className="text-muted small">
                  (PDF, image, Word, Excel or CSV, up to {MAX_MB} MB each, max {MAX_FILES})
                </span>
              </Label>
              <Input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.csv"
                onChange={pickFiles}
                disabled={validation.isSubmitting || savedFiles.length + newFiles.length >= MAX_FILES}
              />
              {(savedFiles.length > 0 || newFiles.length > 0) && (
                <ul className="list-unstyled mt-2 mb-0">
                  {savedFiles.map((a) => (
                    <li key={a._id} className="d-flex align-items-center gap-2 small">
                      <i className="bx bx-paperclip"></i>
                      <a href={a.url} target="_blank" rel="noreferrer">
                        {a.originalName}
                      </a>
                      <Button
                        type="button"
                        size="sm"
                        color="link"
                        className="text-danger p-0"
                        disabled={!!removingId}
                        onClick={() => removeSaved(a)}
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                  {newFiles.map((f, i) => (
                    <li key={`${f.name}-${i}`} className="d-flex align-items-center gap-2 small">
                      <i className="bx bx-paperclip"></i>
                      <span>{f.name}</span>
                      <span className="text-muted">(will be attached on save)</span>
                      <Button
                        type="button"
                        size="sm"
                        color="link"
                        className="text-danger p-0"
                        disabled={validation.isSubmitting}
                        onClick={() => setNewFiles((cur) => cur.filter((_, j) => j !== i))}
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </Col>
          </Row>

          <h6 className="uom-form-section-title mt-2">
            Line Items ({v.lineItems.length}){" "}
            <span className="text-danger">*</span>
          </h6>
          <div className="uom-table-card mb-3" style={{ overflowX: "auto" }}>
            <table className="table mb-0 uom-line-inputs" style={{ minWidth: 1300 }}>
              <thead>
                <tr>
                  <th style={{ minWidth: 220 }}>Item (Code / Name)</th>
                  <th style={{ minWidth: 130 }}>Description</th>
                  <th style={{ minWidth: 110 }}>Category</th>
                  <th style={{ minWidth: 110 }}>Sub-Category</th>
                  <th style={{ width: 110 }}>HSN</th>
                  <th style={{ width: 110 }}>Qty</th>
                  <th style={{ width: 120 }}>UOM</th>
                  <th style={{ width: 140 }}>Rate</th>
                  <th style={{ width: 110 }}>Tax %</th>
                  <th style={{ width: 140 }}>Amount</th>
                  <th style={{ width: 50 }}></th>
                </tr>
              </thead>
              <tbody>
                {v.lineItems.map((li, idx) => {
                  const base =
                    (Number(li.quantity) || 0) * (Number(li.unitPrice) || 0);
                  const tax = base * ((Number(li.taxPercent) || 0) / 100);
                  const amount = base + tax;
                  const searchInfo = itemSearchState[idx] || {
                    search: li.itemCode
                      ? `${li.itemCode} - ${li.itemName}`
                      : li.itemName || "",
                    options: [],
                    showDropdown: false,
                  };

                  return (
                    <tr key={idx}>
                      <td style={{ position: "relative" }}>
                        <Input
                          innerRef={(el) => (itemInputRefs.current[idx] = el)}
                          bsSize="sm"
                          placeholder="Search item code or name..."
                          value={searchInfo.search}
                          onFocus={() =>
                            setItemSearchFor(idx, { showDropdown: true })
                          }
                          onChange={(e) =>
                            searchItemsForLine(idx, e.target.value)
                          }
                          onBlur={() =>
                            setTimeout(
                              () =>
                                setItemSearchFor(idx, { showDropdown: false }),
                              150,
                            )
                          }
                        />
                        {searchInfo.showDropdown &&
                          searchInfo.options.length > 0 &&
                          itemInputRefs.current[idx] &&
                          createPortal(
                            <div
                              className="uom-table-card"
                              style={{
                                position: "fixed",
                                zIndex: 9999,
                                width: 300,
                                maxHeight: 220,
                                overflowY: "auto",
                                top:
                                  itemInputRefs.current[
                                    idx
                                  ].getBoundingClientRect().bottom + 2,
                                left: itemInputRefs.current[
                                  idx
                                ].getBoundingClientRect().left,
                              }}
                            >
                              {searchInfo.options.map((opt) => (
                                <div
                                  key={opt._id}
                                  style={{
                                    padding: "8px 12px",
                                    cursor: "pointer",
                                    fontSize: 13,
                                  }}
                                  onMouseDown={() =>
                                    selectItemForLine(idx, opt)
                                  }
                                >
                                  <span className="uom-symbol-badge">
                                    {opt.itemCode}
                                  </span>{" "}
                                  {opt.itemName}
                                </div>
                              ))}
                            </div>,
                            document.body,
                          )}
                      </td>
                      <td>
                        <Input
                          bsSize="sm"
                          placeholder="Description"
                          value={li.description}
                          onChange={(e) =>
                            updateLineItem(idx, "description", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <span
                          className="uom-cell-muted"
                          style={{ fontSize: 12 }}
                        >
                          {li.category || "—"}
                        </span>
                      </td>
                      <td>
                        <span
                          className="uom-cell-muted"
                          style={{ fontSize: 12 }}
                        >
                          {li.subCategory || "—"}
                        </span>
                      </td>
                      <td>
                        <span
                          className="uom-cell-muted"
                          style={{ fontSize: 12 }}
                        >
                          {li.hsnCode || "—"}
                        </span>
                      </td>
                      <td>
                        <Input
                          bsSize="sm"
                          type="number"
                          min={0}
                          value={li.quantity}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) =>
                            updateLineItem(idx, "quantity", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <Input
                          bsSize="sm"
                          type="select"
                          value={li.uomId}
                          onChange={(e) =>
                            updateLineItem(idx, "uomId", e.target.value)
                          }
                        >
                          <option value="">—</option>
                          {uoms.map((u) => (
                            <option key={u._id} value={u._id}>
                              {u.symbol || u.name}
                            </option>
                          ))}
                        </Input>
                      </td>
                      <td>
                        <Input
                          bsSize="sm"
                          type="number"
                          min={0}
                          value={li.unitPrice}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) =>
                            updateLineItem(idx, "unitPrice", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <Input
                          bsSize="sm"
                          type="select"
                          style={{ minWidth: 90 }}
                          value={li.taxPercent}
                          onChange={(e) =>
                            updateLineItem(idx, "taxPercent", e.target.value)
                          }
                        >
                          <option value={0}>0%</option>
                          <option value={5}>5%</option>
                          <option value={12}>12%</option>
                          <option value={18}>18%</option>
                          <option value={28}>28%</option>
                        </Input>
                      </td>
                      <td className="align-middle fw-semibold">
                        {money(amount)}
                      </td>
                      <td className="align-middle">
                        <Button
                          size="sm"
                          color="light"
                          disabled={v.lineItems.length === 1}
                          onClick={() => removeLineItem(idx)}
                        >
                          <i className="bx bx-trash text-danger"></i>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {validation.touched.lineItems &&
            typeof validation.errors.lineItems === "string" && (
              <div className="text-danger small mb-3">
                {validation.errors.lineItems}
              </div>
            )}

          <Button
            type="button"
            color="light"
            size="sm"
            className="mb-4"
            onClick={addLineItem}
          >
            <i className="bx bx-plus me-1"></i> Add line
          </Button>

          <div
            className="uom-table-card p-3 mb-4"
            style={{ maxWidth: 360, marginLeft: "auto" }}
          >
            <div className="d-flex justify-content-between mb-1">
              <span className="text-muted small">Subtotal</span>
              <span>{money(calc.subtotal)}</span>
            </div>
            <div className="d-flex justify-content-between mb-1">
              <span className="text-muted small">Tax</span>
              <span>{money(calc.tax)}</span>
            </div>
            <hr className="my-2" />
            <div className="d-flex justify-content-between fw-bold">
              <span>Net Payable</span>
              <span>{money(netPayable)}</span>
            </div>

            {selectedBudget && (
              <>
                <hr className="my-2" />
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted small">Budget Approved</span>
                  <span>{money(selectedBudget.approvedAmount)}</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted small">Already Used</span>
                  <span>{money(selectedBudget.consumedAmount)}</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted small">This PR</span>
                  <span>{money(netPayable)}</span>
                </div>
                <div
                  className={`d-flex justify-content-between fw-semibold ${
                    netPayable > budgetAvailable(selectedBudget)
                      ? "text-danger"
                      : "text-success"
                  }`}
                >
                  <span>Remaining after this PR</span>
                  <span>
                    {money(budgetAvailable(selectedBudget) - netPayable)}
                  </span>
                </div>
                {netPayable > budgetAvailable(selectedBudget) && (
                  <div
                    className="text-danger small mt-2 p-2"
                    style={{ background: "#fef3f2", borderRadius: 6 }}
                  >
                    <i className="bx bx-error-circle me-1"></i>
                    Exceeds available budget — additional approval required
                  </div>
                )}
              </>
            )}
          </div>

          <div className="uom-form-footer d-flex justify-content-end gap-2">
            <Button type="button" color="light" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              color="primary"
              disabled={validation.isSubmitting}
            >
              {validation.isSubmitting
                ? "Saving..."
                : editingItem
                  ? "Save changes"
                  : "Save & Submit"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PRForm;
