import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Row, Col, Label, Input, FormFeedback, Button } from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import {
  createPO,
  getClosedRFQs,
  getBudgets,
  getItemMasters,
  getContracts,
} from "../../../../helpers/backend_helper";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { useReferenceList } from "../../../../Components/Hooks/useReferenceData";
import "../../UnitOfMeasurement/uom.scss";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const budgetAvailable = (b) =>
  b ? (b.approvedAmount || 0) - (b.consumedAmount || 0) : 0;

const emptyLineItem = () => ({
  itemName: "",
  description: "",
  quantity: 1,
  uomId: "",
  unitPrice: 0,
  taxPercent: 0,
});

const PO_TYPES = [
  {
    key: "pr_based",
    label: "PR-Based",
    sub: "From an approved PR and a closed RFQ",
  },
  { key: "direct", label: "Direct", sub: "Urgent. Skips the PR and RFQ" },
  {
    key: "contract_based",
    label: "Contract-Based",
    sub: "Against a vendor contract",
  },
];

const SectionTitle = ({ icon, children, hint }) => (
  <h6 className="uom-form-section-title">
    <span className="uom-section-icon">
      <i className={`bx ${icon}`}></i>
    </span>
    {children}
    {hint && <span className="uom-section-hint">{hint}</span>}
  </h6>
);

const POForm = ({ onSaved, onCancel }) => {
  const handleAuthError = useAuthError();
  const [closedRFQs, setClosedRFQs] = useState([]);

  const { items: vendors } = useReferenceList("vendors");
  const { items: departments } = useReferenceList("departments");
  const { items: uoms } = useReferenceList("uoms");
  const { items: centers } = useReferenceList("centers");
  const { items: paymentTerms } = useReferenceList("paymentTerms");
  const [budgets, setBudgets] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [selectedRFQ, setSelectedRFQ] = useState(null);
  const [itemSearchState, setItemSearchState] = useState({});
  const itemSearchTimers = useRef({});
  const itemInputRefs = useRef({});

  useEffect(() => {
    getClosedRFQs({})
      .then((res) => setClosedRFQs(res?.data || []))
      .catch(() => {});
    getContracts({ status: "active" })
      .then((res) => setContracts(res?.data || []))
      .catch(() => {});
  }, []);

  const validation = useFormik({
    initialValues: {
      poType: "pr_based",
      poTitle: "",
      startDate: "",
      endDate: "",
      currency: "INR",
      rfqId: "",
      vendorId: "",
      contractId: "",
      projectRef: "",
      justification: "",
      budgetId: "",
      departmentId: "",
      paymentTermId: "",
      deliverySiteId: "",
      billingSiteId: "",
      expectedDeliveryDate: "",
      criticality: "medium",
      remarks: "",
      lineItems: [emptyLineItem()],
    },
    validationSchema: Yup.object({
      poType: Yup.string().required(),
      vendorId: Yup.string().required("Vendor is required"),
      rfqId: Yup.string().when("poType", {
        is: "pr_based",
        then: (schema) => schema.required("Select a closed RFQ"),
      }),
      contractId: Yup.string().when("poType", {
        is: "contract_based",
        then: (schema) => schema.required("Please select a contract"),
      }),
      budgetId: Yup.string().when("poType", {
        is: (val) => val !== "pr_based",
        then: (schema) => schema.required("Budget is required"),
      }),
      deliverySiteId: Yup.string().required("Delivery site is required"),
      billingSiteId: Yup.string().required("Bill To is required"),
      paymentTermId: Yup.string().required("Payment term is required"),
      expectedDeliveryDate: Yup.string().required(
        "Expected delivery date is required",
      ),
      justification: Yup.string().when("poType", {
        is: "direct",
        then: (schema) =>
          schema
            .min(10, "Minimum 10 characters required")
            .required("Justification is required"),
      }),
      lineItems: Yup.array().when("poType", {
        is: (val) => val !== "pr_based",
        then: (schema) =>
          schema.min(1, "Add at least one line item").of(
            Yup.object({
              itemName: Yup.string().trim().required("Item name is required"),
              quantity: Yup.number().moreThan(0).required(),
              unitPrice: Yup.number().min(0).required(),
            }),
          ),
      }),
    }),
    onSubmit: async (values, { setTouched }) => {
      const errors = await validation.validateForm();
      if (Object.keys(errors).length > 0) {
        setTouched({
          poType: true,
          vendorId: true,
          rfqId: true,
          contractId: true,
          budgetId: true,
          justification: true,
          lineItems: true,
          deliverySiteId: true,
          billingSiteId: true,
          paymentTermId: true,
          expectedDeliveryDate: true,
        });
        toast.error("Please fill in all required fields");
        return;
      }

      if (
        values.poType !== "pr_based" &&
        selectedBudget &&
        netPayable > budgetAvailable(selectedBudget)
      ) {
        toast.error(
          `This PO (${money(netPayable)}) exceeds the available budget (${money(budgetAvailable(selectedBudget))}). Please reduce the amount or select a different budget.`,
        );
        return;
      }
      const payload = { ...values };
      if (values.poType === "pr_based") {
        delete payload.lineItems;
        delete payload.contractRef;
        delete payload.justification;
        delete payload.budgetId;
        delete payload.departmentId;
      } else {
        delete payload.rfqId;
        payload.lineItems = values.lineItems.map((li) => ({
          ...li,
          quantity: Number(li.quantity) || 0,
          unitPrice: Number(li.unitPrice) || 0,
          taxPercent: Number(li.taxPercent) || 0,
        }));
        if (values.poType !== "direct") delete payload.justification;
      }

      if (!payload.paymentTermId) delete payload.paymentTermId;
      if (!payload.billingSiteId) delete payload.billingSiteId;
      if (!payload.expectedDeliveryDate) delete payload.expectedDeliveryDate;
      if (!payload.startDate) delete payload.startDate;
      if (!payload.endDate) delete payload.endDate;
      if (!payload.projectRef) delete payload.projectRef;
      if (!payload.contractId) delete payload.contractId;

      try {
        await createPO(payload);
        toast.success("Purchase order created as draft");
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
  const t = validation.touched;
  const e = validation.errors;
  const isPR = v.poType === "pr_based";

  useEffect(() => {
    if (!v.departmentId) {
      setBudgets([]);
      return;
    }
    getBudgets({ departmentId: v.departmentId, status: "approved" })
      .then((res) => setBudgets(res?.data || []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v.departmentId]);

  useEffect(() => {
    if (!v.rfqId) {
      setSelectedRFQ(null);
      validation.setFieldValue("vendorId", "");
      return;
    }
    const rfq = closedRFQs.find((r) => r._id === v.rfqId);
    setSelectedRFQ(rfq || null);
    // Vendor RFQ close hote waqt final ho chuka tha, isliye apne aap bhar do
    validation.setFieldValue(
      "vendorId",
      rfq?.selectedVendorId?._id || rfq?.selectedVendorId || "",
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v.rfqId]);

  const quotedVendorsForRFQ = (selectedRFQ?.vendorQuotes || []).filter(
    (vq) => vq.quotedAt,
  );
  const vendorQuote = quotedVendorsForRFQ.find(
    (vq) => (vq.vendorId?._id || vq.vendorId) === v.vendorId,
  );

  // PO type badalne pe us type ke fields fresh shuru hote hain
  const changePoType = (key) => {
    if (key === v.poType) return;
    validation.setValues({
      ...v,
      poType: key,
      rfqId: "",
      vendorId: "",
      contractId: "",
      departmentId: "",
      budgetId: "",
      justification: "",
    });
  };

  const addLineItem = () =>
    validation.setFieldValue("lineItems", [...v.lineItems, emptyLineItem()]);
  const removeLineItem = (idx) => {
    if (v.lineItems.length === 1) return;
    validation.setFieldValue(
      "lineItems",
      v.lineItems.filter((_, i) => i !== idx),
    );
    // baaki rows ka search box sahi row pe rahe
    setItemSearchState((prev) => {
      const next = {};
      Object.keys(prev).forEach((k) => {
        const n = Number(k);
        if (n === idx) return;
        next[n > idx ? n - 1 : n] = prev[k];
      });
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
        .then((res) => setItemSearchFor(idx, { options: res?.data || [] }))
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
              itemName: item.itemName || "",
              description: item.longDescription || item.itemName || "",
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
      acc.subtotal += base;
      acc.tax += base * ((Number(li.taxPercent) || 0) / 100);
      return acc;
    },
    { subtotal: 0, tax: 0 },
  );
  const netPayable = calc.subtotal + calc.tax;
  const selectedBudget = budgets.find((b) => b._id === v.budgetId);
  const overBudget =
    selectedBudget && netPayable > budgetAvailable(selectedBudget);

  // Kis row mein item naam khaali hai (red border dikhane ke liye)
  const lineError = (idx) =>
    t.lineItems && Array.isArray(e.lineItems) && e.lineItems[idx]?.itemName;

  return (
    <div className="uom-form-page">
      <div className="uom-form-header">
        <h4 className="uom-form-title">Create Purchase Order</h4>
        <p className="uom-form-subtitle">
          Fill in the details. The PO is saved as a draft until it is approved.
        </p>
      </div>

      <div className="uom-form-panel">
        <form onSubmit={validation.handleSubmit}>
          {/* ---------- PO type ---------- */}
          <div className="uom-form-section">
            <SectionTitle icon="bx-category">PO Type</SectionTitle>
            <div className="uom-choice-grid">
              {PO_TYPES.map((opt) => (
                <button
                  type="button"
                  key={opt.key}
                  className={`uom-choice-card ${v.poType === opt.key ? "is-active" : ""}`}
                  onClick={() => changePoType(opt.key)}
                >
                  <span className="uom-choice-radio"></span>
                  <span>
                    <div className="uom-choice-title">{opt.label}</div>
                    <div className="uom-choice-sub">{opt.sub}</div>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ---------- Vendor ---------- */}
          <div className="uom-form-section">
            <SectionTitle icon="bx-store">
              {isPR ? "RFQ and Vendor" : "Vendor"}
            </SectionTitle>

            {isPR ? (
              <>
                <Row>
                  <Col md={6} className="mb-3">
                    <Label>
                      Closed RFQ <span className="text-danger">*</span>
                    </Label>
                    <Input
                      type="select"
                      value={v.rfqId}
                      onChange={(ev) =>
                        validation.setFieldValue("rfqId", ev.target.value)
                      }
                      invalid={t.rfqId && !!e.rfqId}
                    >
                      <option value="">Select closed RFQ</option>
                      {closedRFQs.map((r) => (
                        <option key={r._id} value={r._id}>
                          {r.rfqNumber} — {r.prId?.prTitle}
                        </option>
                      ))}
                    </Input>
                    <FormFeedback>{e.rfqId}</FormFeedback>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Label>
                      Vendor <span className="text-danger">*</span>
                    </Label>
                    <Input
                      type="select"
                      value={v.vendorId}
                      disabled={!v.rfqId || !!selectedRFQ?.selectedVendorId}
                      onChange={(ev) =>
                        validation.setFieldValue("vendorId", ev.target.value)
                      }
                      invalid={t.vendorId && !!e.vendorId}
                    >
                      <option value="">
                        {v.rfqId ? "Select vendor" : "Select an RFQ first"}
                      </option>
                      {quotedVendorsForRFQ.map((vq) => (
                        <option
                          key={vq.vendorId._id || vq.vendorId}
                          value={vq.vendorId._id || vq.vendorId}
                        >
                          {vq.vendorId?.tradeName || vq.vendorId?.legalName} —{" "}
                          {money(vq.totalAmount)}
                        </option>
                      ))}
                    </Input>
                    <FormFeedback>{e.vendorId}</FormFeedback>
                    {selectedRFQ?.selectedVendorId && (
                      <div className="text-muted small mt-1">
                        <i className="bx bx-check-circle text-success me-1"></i>
                        Chosen when the RFQ was closed.
                      </div>
                    )}
                  </Col>
                </Row>

                {selectedRFQ && vendorQuote && (
                  <div className="mt-1">
                    <Label>Items from the quote</Label>
                    <div
                      className="uom-table-card"
                      style={{ overflowX: "auto" }}
                    >
                      <table className="table uom-line-table">
                        <thead>
                          <tr>
                            <th>Item</th>
                            <th style={{ width: 80 }}>Qty</th>
                            <th style={{ width: 120 }}>Rate</th>
                            <th style={{ width: 80 }}>Tax</th>
                            <th style={{ width: 130 }} className="text-end">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {vendorQuote.lineItemQuotes.map((li, idx) => (
                            <tr key={idx}>
                              <td className="fw-semibold">{li.itemName}</td>
                              <td>{li.quantity}</td>
                              <td>{money(li.unitPrice)}</td>
                              <td>{li.taxPercent}%</td>
                              <td className="fw-semibold text-end">
                                {money(li.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="uom-totals mt-3">
                      <div
                        className="uom-totals-total"
                        style={{
                          borderTop: "none",
                          marginTop: 0,
                          paddingTop: 0,
                        }}
                      >
                        <span>Quote Total</span>
                        <span>{money(vendorQuote.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <Row>
                  {v.poType === "contract_based" && (
                    <Col md={6} className="mb-3">
                      <Label>
                        Contract <span className="text-danger">*</span>
                      </Label>
                      <Input
                        type="select"
                        value={v.contractId}
                        onChange={(ev) => {
                          const contractId = ev.target.value;
                          validation.setFieldValue("contractId", contractId);
                          const c = contracts.find(
                            (ct) => ct._id === contractId,
                          );
                          if (c?.vendorId)
                            validation.setFieldValue(
                              "vendorId",
                              c.vendorId._id || c.vendorId,
                            );
                          if (c?.departmentId)
                            validation.setFieldValue(
                              "departmentId",
                              c.departmentId._id || c.departmentId,
                            );
                          if (c?.budgetId)
                            validation.setFieldValue(
                              "budgetId",
                              c.budgetId._id || c.budgetId,
                            );
                        }}
                        invalid={t.contractId && !!e.contractId}
                      >
                        <option value="">Select contract</option>
                        {contracts.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.contractId} — {c.title}
                          </option>
                        ))}
                      </Input>
                      <FormFeedback>{e.contractId}</FormFeedback>
                    </Col>
                  )}
                  <Col md={6} className="mb-3">
                    <Label>
                      Vendor <span className="text-danger">*</span>
                    </Label>
                    <Input
                      type="select"
                      value={v.vendorId}
                      onChange={(ev) =>
                        validation.setFieldValue("vendorId", ev.target.value)
                      }
                      invalid={t.vendorId && !!e.vendorId}
                    >
                      <option value="">Select vendor</option>
                      {vendors.map((vd) => (
                        <option key={vd._id} value={vd._id}>
                          {vd.tradeName || vd.legalName}
                        </option>
                      ))}
                    </Input>
                    <FormFeedback>{e.vendorId}</FormFeedback>
                  </Col>
                </Row>
                {v.poType === "direct" && (
                  <Row>
                    <Col md={12} className="mb-1">
                      <Label>
                        Justification <span className="text-danger">*</span>
                      </Label>
                      <Input
                        type="textarea"
                        rows={2}
                        placeholder="Why is this a direct order? (at least 10 characters)"
                        value={v.justification}
                        onChange={(ev) =>
                          validation.setFieldValue(
                            "justification",
                            ev.target.value,
                          )
                        }
                        invalid={t.justification && !!e.justification}
                      />
                      <FormFeedback>{e.justification}</FormFeedback>
                    </Col>
                  </Row>
                )}
              </>
            )}
          </div>

          {/* ---------- Department and budget ---------- */}
          <div className="uom-form-section">
            <SectionTitle icon="bx-wallet">Department and Budget</SectionTitle>
            {isPR ? (
              <div className="uom-form-note">
                <i className="bx bx-info-circle"></i>
                The department and the budget come from the PR.
              </div>
            ) : (
              <Row>
                <Col md={6} className="mb-3">
                  <Label>Department</Label>
                  <Input
                    type="select"
                    value={v.departmentId}
                    onChange={(ev) => {
                      validation.setFieldValue("departmentId", ev.target.value);
                      validation.setFieldValue("budgetId", "");
                    }}
                  >
                    <option value="">Select department</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name}
                      </option>
                    ))}
                  </Input>
                </Col>
                <Col md={6} className="mb-3">
                  <Label>
                    Budget <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="select"
                    value={v.budgetId}
                    disabled={!v.departmentId}
                    onChange={(ev) =>
                      validation.setFieldValue("budgetId", ev.target.value)
                    }
                    invalid={t.budgetId && !!e.budgetId}
                  >
                    <option value="">
                      {v.departmentId
                        ? "Select budget"
                        : "Select a department first"}
                    </option>
                    {budgets.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.fiscalYear}: {money(budgetAvailable(b))} available of{" "}
                        {money(b.approvedAmount)}
                        {b.budgetType === "global" ? " (Global)" : ""}
                      </option>
                    ))}
                  </Input>
                  <FormFeedback>{e.budgetId}</FormFeedback>
                </Col>
              </Row>
            )}
          </div>

          {/* ---------- Delivery and payment ---------- */}
          <div className="uom-form-section">
            <SectionTitle icon="bx-package">Delivery and Payment</SectionTitle>
            <Row>
              <Col md={6} className="mb-3">
                <Label>
                  Expected Delivery <span className="text-danger">*</span>
                </Label>
                <Input
                  type="date"
                  value={v.expectedDeliveryDate}
                  invalid={t.expectedDeliveryDate && !!e.expectedDeliveryDate}
                  onChange={(ev) =>
                    validation.setFieldValue(
                      "expectedDeliveryDate",
                      ev.target.value,
                    )
                  }
                />
                <FormFeedback>{e.expectedDeliveryDate}</FormFeedback>
              </Col>
              <Col md={6} className="mb-3">
                <Label>
                  Delivery Site <span className="text-danger">*</span>
                </Label>
                <Input
                  type="select"
                  value={v.deliverySiteId}
                  onChange={(ev) =>
                    validation.setFieldValue("deliverySiteId", ev.target.value)
                  }
                  invalid={t.deliverySiteId && !!e.deliverySiteId}
                >
                  <option value="">Select site</option>
                  {centers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title}
                    </option>
                  ))}
                </Input>
                <FormFeedback>{e.deliverySiteId}</FormFeedback>
              </Col>
              <Col md={6} className="mb-3">
                <Label>
                  Payment Terms <span className="text-danger">*</span>
                </Label>
                <Input
                  type="select"
                  name="paymentTermId"
                  value={v.paymentTermId}
                  onChange={(ev) =>
                    validation.setFieldValue("paymentTermId", ev.target.value)
                  }
                  onBlur={validation.handleBlur}
                  invalid={!!(validation.touched.paymentTermId && e.paymentTermId)}
                >
                  <option value="">Select terms</option>
                  {paymentTerms.map((pt) => (
                    <option key={pt._id} value={pt._id}>
                      {pt.description || pt.code}
                    </option>
                  ))}
                </Input>
                <FormFeedback>{e.paymentTermId}</FormFeedback>
              </Col>
              <Col md={6} className="mb-3">
                <Label>
                  Bill To <span className="text-danger">*</span>
                </Label>
                <Input
                  type="select"
                  value={v.billingSiteId}
                  onChange={(ev) =>
                    validation.setFieldValue("billingSiteId", ev.target.value)
                  }
                  invalid={t.billingSiteId && !!e.billingSiteId}
                >
                  <option value="">Select billing site</option>
                  {centers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title}
                    </option>
                  ))}
                </Input>
                <FormFeedback>{e.billingSiteId}</FormFeedback>
              </Col>
            </Row>
          </div>

          {/* ---------- Items (Direct and Contract-Based) ---------- */}
          {!isPR && (
            <div className="uom-form-section">
              <SectionTitle
                icon="bx-list-ul"
                hint={`${v.lineItems.length} line${v.lineItems.length === 1 ? "" : "s"}`}
              >
                Items <span className="text-danger">*</span>
              </SectionTitle>

              <div
                className="uom-table-card mb-3"
                style={{ overflowX: "auto" }}
              >
                <table
                  className="table uom-line-table uom-line-inputs"
                  style={{ minWidth: 960 }}
                >
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th style={{ width: 110 }}>Qty</th>
                      <th style={{ width: 130 }}>UOM</th>
                      <th style={{ width: 150 }}>Rate</th>
                      <th style={{ width: 110 }}>Tax</th>
                      <th style={{ width: 150 }} className="text-end">
                        Amount
                      </th>
                      <th style={{ width: 56 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {v.lineItems.map((li, idx) => {
                      const base =
                        (Number(li.quantity) || 0) *
                        (Number(li.unitPrice) || 0);
                      const tax = base * ((Number(li.taxPercent) || 0) / 100);
                      const searchInfo = itemSearchState[idx] || {
                        search: li.itemName || "",
                        options: [],
                        showDropdown: false,
                      };
                      return (
                        <tr key={idx}>
                          <td style={{ minWidth: 240 }}>
                            <Input
                              innerRef={(el) =>
                                (itemInputRefs.current[idx] = el)
                              }
                              placeholder="Search item code or name..."
                              value={searchInfo.search}
                              invalid={!!lineError(idx)}
                              onFocus={() =>
                                setItemSearchFor(idx, { showDropdown: true })
                              }
                              onChange={(ev) =>
                                searchItemsForLine(idx, ev.target.value)
                              }
                              onBlur={() =>
                                setTimeout(
                                  () =>
                                    setItemSearchFor(idx, {
                                      showDropdown: false,
                                    }),
                                  150,
                                )
                              }
                            />
                            {searchInfo.showDropdown &&
                              searchInfo.options.length > 0 &&
                              itemInputRefs.current[idx] &&
                              createPortal(
                                <div
                                  className="uom-item-dropdown"
                                  style={{
                                    position: "fixed",
                                    zIndex: 9999,
                                    width: 340,
                                    maxHeight: 240,
                                    overflowY: "auto",
                                    top:
                                      itemInputRefs.current[
                                        idx
                                      ].getBoundingClientRect().bottom + 4,
                                    left: itemInputRefs.current[
                                      idx
                                    ].getBoundingClientRect().left,
                                  }}
                                >
                                  {searchInfo.options.map((opt) => (
                                    <div
                                      key={opt._id}
                                      className="uom-item-option"
                                      onMouseDown={() =>
                                        selectItemForLine(idx, opt)
                                      }
                                    >
                                      <span className="uom-symbol-badge">
                                        {opt.itemCode}
                                      </span>
                                      <span className="text-truncate">
                                        {opt.itemName}
                                      </span>
                                    </div>
                                  ))}
                                </div>,
                                document.body,
                              )}
                          </td>
                          <td>
                            <Input
                              type="number"
                              min={0}
                              value={li.quantity}
                              onFocus={(ev) => ev.target.select()}
                              onChange={(ev) =>
                                updateLineItem(idx, "quantity", ev.target.value)
                              }
                            />
                          </td>
                          <td>
                            <Input
                              type="select"
                              value={li.uomId}
                              onChange={(ev) =>
                                updateLineItem(idx, "uomId", ev.target.value)
                              }
                            >
                              <option value="">None</option>
                              {uoms.map((u) => (
                                <option key={u._id} value={u._id}>
                                  {u.symbol || u.name}
                                </option>
                              ))}
                            </Input>
                          </td>
                          <td>
                            <Input
                              type="number"
                              min={0}
                              value={li.unitPrice}
                              onFocus={(ev) => ev.target.select()}
                              onChange={(ev) =>
                                updateLineItem(
                                  idx,
                                  "unitPrice",
                                  ev.target.value,
                                )
                              }
                            />
                          </td>
                          <td>
                            <Input
                              type="select"
                              value={li.taxPercent}
                              onChange={(ev) =>
                                updateLineItem(
                                  idx,
                                  "taxPercent",
                                  ev.target.value,
                                )
                              }
                            >
                              <option value={0}>0%</option>
                              <option value={5}>5%</option>
                              <option value={12}>12%</option>
                              <option value={18}>18%</option>
                              <option value={28}>28%</option>
                            </Input>
                          </td>
                          <td className="fw-semibold text-end">
                            {money(base + tax)}
                          </td>
                          <td className="text-end">
                            <button
                              type="button"
                              className="uom-icon-btn is-danger"
                              title="Remove line"
                              disabled={v.lineItems.length === 1}
                              style={
                                v.lineItems.length === 1
                                  ? { opacity: 0.4, cursor: "not-allowed" }
                                  : undefined
                              }
                              onClick={() => removeLineItem(idx)}
                            >
                              <i className="bx bx-trash"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {t.lineItems && typeof e.lineItems === "string" && (
                <div className="text-danger small mb-2">{e.lineItems}</div>
              )}

              <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                <Button
                  type="button"
                  color="light"
                  className="border"
                  onClick={addLineItem}
                >
                  <i className="bx bx-plus me-1"></i> Add line
                </Button>

                {/* totals */}
                <div className="uom-totals flex-grow-1">
                  <div className="uom-totals-row">
                    <span>Subtotal</span>
                    <span>{money(calc.subtotal)}</span>
                  </div>
                  <div className="uom-totals-row">
                    <span>Tax</span>
                    <span>{money(calc.tax)}</span>
                  </div>
                  <div className="uom-totals-total">
                    <span>Net Payable</span>
                    <span>{money(netPayable)}</span>
                  </div>
                  {selectedBudget && (
                    <>
                      <div className="uom-totals-divider"></div>
                      <div className="uom-totals-row">
                        <span>Budget available</span>
                        <span>{money(budgetAvailable(selectedBudget))}</span>
                      </div>
                      <div
                        className={`d-flex justify-content-between fw-semibold ${overBudget ? "text-danger" : "text-success"}`}
                        style={{ fontSize: 13.5 }}
                      >
                        <span>Left after this PO</span>
                        <span>
                          {money(budgetAvailable(selectedBudget) - netPayable)}
                        </span>
                      </div>
                      {overBudget && (
                        <div className="text-danger small mt-2">
                          <i className="bx bx-error-circle me-1"></i>
                          More than the budget has left. Reduce the amount or
                          choose another budget.
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ---------- Other details (optional) ---------- */}
          <div className="uom-form-section">
            <SectionTitle icon="bx-detail" hint="Optional">
              Other Details
            </SectionTitle>
            <Row>
              <Col md={6} className="mb-3">
                <Label>PO Title</Label>
                <Input
                  value={v.poTitle}
                  onChange={(ev) =>
                    validation.setFieldValue("poTitle", ev.target.value)
                  }
                />
              </Col>
              <Col md={6} className="mb-3">
                <Label>Project Reference</Label>
                <Input
                  value={v.projectRef}
                  onChange={(ev) =>
                    validation.setFieldValue("projectRef", ev.target.value)
                  }
                />
              </Col>
              <Col md={4} className="mb-3">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={v.startDate}
                  onChange={(ev) =>
                    validation.setFieldValue("startDate", ev.target.value)
                  }
                />
              </Col>
              <Col md={4} className="mb-3">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={v.endDate}
                  onChange={(ev) =>
                    validation.setFieldValue("endDate", ev.target.value)
                  }
                />
              </Col>
              <Col md={4} className="mb-3">
                <Label>Criticality</Label>
                <Input
                  type="select"
                  value={v.criticality}
                  onChange={(ev) =>
                    validation.setFieldValue("criticality", ev.target.value)
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </Input>
              </Col>
              <Col md={12} className="mb-1">
                <Label>Remarks</Label>
                <Input
                  type="textarea"
                  rows={2}
                  value={v.remarks}
                  onChange={(ev) =>
                    validation.setFieldValue("remarks", ev.target.value)
                  }
                />
              </Col>
            </Row>
          </div>

          {/* ---------- Sticky footer — buttons hamesha dikhte hain ---------- */}
          <div className="uom-form-footer is-sticky">
            <div
              className={`uom-footer-summary ${overBudget ? "is-over" : ""}`}
            >
              {!isPR && (
                <>
                  Net Payable<strong>{money(netPayable)}</strong>
                </>
              )}
            </div>
            <div className="d-flex gap-2">
              <Button
                type="button"
                color="light"
                className="border"
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                color="primary"
                disabled={validation.isSubmitting}
              >
                {validation.isSubmitting
                  ? "Creating..."
                  : "Create Purchase Order"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default POForm;
