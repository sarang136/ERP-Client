import React, { useRef, useState } from "react";
import {
  Row,
  Col,
  Label,
  Input,
  Button,
  Spinner,
} from "reactstrap";
import Select from "react-select";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  medicineTypes2,
  baseUnits,
  purchaseUnits,
  medicineForms,
  medicineCategories,
  storageTypes,
  scheduleTypes
} from "../../../../../Components/constants/medicine";
import { checkDuplicateMedicineRequisition } from "../../../../../helpers/backend_helper";
import { normalizeLabel } from "../../../../../Components/constants/medicine";
import { normalizeUnderscores } from "../../../../../utils/normalizeUnderscore";

function useDebounce(callback, delay) {
  const timer = useRef(null);
  function debouncedFn(...args) {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }
  return debouncedFn;
}

const stepCircle = (active) => ({
    width: 28,
    height: 28,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0,
    background: active ? "var(--bs-primary)" : "#e9ecef",
    color: active ? "#fff" : "#adb5bd",
});

const MedicineRequisitionForm = ({ initialData, onSubmit, loading, isEdit, showBack = true, canSubmit = true }) => {
  const navigate = useNavigate();
  const [duplicateError, setDuplicateError] = useState("");

  // Requester's values win; where they are empty, the AI suggestion pre-fills the field.
  const aiSuggested = initialData?.aiSuggestions || {};
  const pickProposed = (key) => initialData?.proposedMedicine?.[key] || aiSuggested[key] || "";


  const user = useSelector((state) => state.User);
  const centerList = useSelector((state) => state.Center.data);
  const requisingCenterOptions = (centerList || [])
    .filter((c) => user?.centerAccess?.includes(c._id))
    .map((c) => ({ value: c._id, label: c.title }));

  // Duplicate = same name + strength + unit/base unit, in the master or a pending requisition.
  const checkDuplicate = async (name, strength, baseUnit) => {
    if (!name || !baseUnit) {
      setDuplicateError("");
      return;
    }
    try {
      const response = await checkDuplicateMedicineRequisition({
        name,
        strength,
        baseUnit,
        id: initialData?._id,
      });
      if (response.exists) {
        setDuplicateError(response.message);
      } else {
        setDuplicateError("");
      }
    } catch (err) {
    }
  };

  const debouncedCheck = useDebounce(checkDuplicate, 500);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      requestingCenter: initialData?.requestingCenter?._id || requisingCenterOptions[0]?.value || "",
      medicineName: initialData?.proposedMedicine?.name || "",
      genericName: pickProposed("genericName"),
      form: pickProposed("form"),
      baseUnit: pickProposed("baseUnit"),
      purchaseUnit: pickProposed("purchaseUnit"),
      baseQuantity:
        initialData?.proposedMedicine?.conversion?.baseQuantity ||
        aiSuggested.conversion?.baseQuantity || "",
      purchaseQuantity:
        initialData?.proposedMedicine?.conversion?.purchaseQuantity ||
        aiSuggested.conversion?.purchaseQuantity || "",
      category: pickProposed("category"),
      storageType: pickProposed("storageType"),
      scheduleType: pickProposed("scheduleType"),
      type: pickProposed("type"),
      strength: initialData?.proposedMedicine?.strength || "",
      instruction: initialData?.proposedMedicine?.instruction || "",
      composition: pickProposed("composition"),
      unitPrice: initialData?.proposedMedicine?.unitPrice || "",
      isControlledDrug: initialData?.proposedMedicine?.isControlledDrug || false,
      justification: initialData?.justification || "",
    },
    validationSchema: Yup.object({
      requestingCenter: Yup.string().required("Requesting Center is required"),
      medicineName: Yup.string().required("Medicine Name is required").max(100),
      genericName: Yup.string().required("Generic Name is required"),
      form: Yup.string().required("Medicine Form is required"),
      baseUnit: Yup.string().required("Base Unit is required"),
      purchaseUnit: Yup.string().required("Purchase Unit is required"),
      baseQuantity: Yup.number().positive("Must be positive").required("Base Quantity is required"),
      purchaseQuantity: Yup.number().positive("Must be positive").required("Purchase Quantity is required"),
      category: Yup.string().required("Category is required"),
      storageType: Yup.string().required("Storage Type is required"),
      scheduleType: Yup.string().required("Schedule Type is required"),
      type: Yup.string().required("Medicine Type is required"),
      strength: Yup.string().optional(),
      instruction: Yup.string().optional(),
      composition: Yup.string().optional(),
      unitPrice: Yup.number().positive("Must be positive").optional(),
      isControlledDrug: Yup.boolean().optional(),
      justification: Yup.string().required("Justification is required").min(10),
    }),
    onSubmit: (values) => {
      const payload = {
        requestingCenter: values.requestingCenter,
        proposedMedicine: {
          name: values.medicineName,
          genericName: values.genericName,
          form: values.form,
          baseUnit: values.baseUnit,
          purchaseUnit: values.purchaseUnit,
          conversion: {
            baseQuantity: Number(values.baseQuantity) || 1,
            purchaseQuantity: Number(values.purchaseQuantity) || 1,
          },
          category: values.category,
          storageType: values.storageType,
          scheduleType: values.scheduleType,
          type: values.type,
          strength: values.strength,
          instruction: values.instruction,
          composition: values.composition,
          unitPrice: Number(values.unitPrice) || undefined,
          isControlledDrug: values.isControlledDrug,
        },
        justification: values.justification,
      };

      onSubmit(payload);
    },
  });

  const { values, errors, touched, handleChange, handleBlur, setFieldValue } = formik;

  // A field keeps the AI tag only while its value is still the AI suggestion.
  // Once the user changes it, the tag goes away.
  const isAiField = (field) => !!aiSuggested[field] && values[field] === aiSuggested[field];
  // Conversion is nested on the suggestion (aiSuggested.conversion.{purchaseQuantity,baseQuantity})
  // but flat on the form, so it needs its own check instead of isAiField.
  const isAiConversion =
    !!aiSuggested.conversion?.purchaseQuantity &&
    !!aiSuggested.conversion?.baseQuantity &&
    Number(values.purchaseQuantity) === aiSuggested.conversion.purchaseQuantity &&
    Number(values.baseQuantity) === aiSuggested.conversion.baseQuantity;
  const aiBadge = (isAi) =>
    isAi ? (
      <span
        title="Suggested by AI (Gemini). Verify before approving."
        style={{
          marginLeft: 6,
          fontSize: 10,
          fontWeight: 600,
          color: "#1d4ed8",
          background: "#eff6ff",
          border: "1px solid #bfdbfe",
          borderRadius: 4,
          padding: "1px 6px",
          verticalAlign: "middle",
        }}
      >
        Suggested by AI
      </span>
    ) : null;
  const aiTag = (field) => aiBadge(isAiField(field));

  const errorText = (field) => {
    return touched[field] && errors[field] ? (
      <div className="text-danger small mt-1">{errors[field]}</div>
    ) : null;
  };

  const stepsDone = {
    centers: !!values.requestingCenter,
    medicine: !!values.medicineName && !!values.type,
    justification: !!values.justification && values.justification.length >= 10
  };

  return (
    <div className="px-3">
        {/* Header - Back Button */}
        {showBack && (
            <button
                type="button"
                className="btn btn-link p-0 text-muted mb-2"
                style={{ fontSize: 13, textDecoration: "none" }}
                onClick={() => navigate("/pharmacy/requisition/medicine-requisition")}
            >
                <i className="bx bx-chevron-left" /> Back to Requisitions
            </button>
        )}

        {/* Page Heading + Step Pills */}
        <div className="d-flex align-items-start justify-content-between mb-4">
            <div>
                <h5 className="mb-1 fw-semibold">
                    {isEdit ? "Edit Medicine Requisition" : "New Medicine Requisition"}
                </h5>
                <p className="text-muted mb-0" style={{ fontSize: 13 }}>
                    {isEdit ? (
                        <>
                            <span className="fw-medium text-primary me-2">{initialData?.requisitionNumber}</span>
                            Update details for this medicine proposal
                        </>
                    ) : (
                        "Propose a new medicine to be added to the Master medicine"
                    )}
                </p>
            </div>

            <div className="d-none d-md-flex align-items-center gap-2">
                {[
                    { n: 1, label: "Info", done: stepsDone.centers },
                    { n: 2, label: "Medicine", done: stepsDone.medicine },
                    { n: 3, label: "Justify", done: stepsDone.justification },
                ].map((s, i, arr) => (
                    <React.Fragment key={s.n}>
                        <div className="d-flex align-items-center gap-1">
                            <div style={stepCircle(s.done)}>
                                {s.done
                                    ? <i className="bx bx-check" style={{ fontSize: 14 }} />
                                    : s.n}
                            </div>
                            <span
                                style={{ fontSize: 12, fontWeight: 600 }}
                                className={s.done ? "text-primary" : "text-muted"}
                            >
                                {s.label}
                            </span>
                        </div>
                        {i < arr.length - 1 && (
                            <div style={{
                                width: 20, height: 2, borderRadius: 2,
                                background: s.done ? "var(--bs-primary)" : "#dee2e6",
                            }} />
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>

        <form onSubmit={formik.handleSubmit}>
            <Row className="g-3">
                {/* Requesting Center */}
                <Col md={12}>
                    <Label className="fs-13 text-muted mb-1">
                        Requesting Center <span className="text-danger">*</span>
                    </Label>
                    <Select
                        name="requestingCenter"
                        placeholder="Select Center"
                        options={requisingCenterOptions}
                        onChange={(selected) => setFieldValue("requestingCenter", selected ? selected.value : "")}
                        value={requisingCenterOptions.find((opt) => opt.value === values.requestingCenter) || null}
                        classNamePrefix="react-select"
                        isDisabled={isEdit || requisingCenterOptions.length <= 1}
                    />
                    {errorText("requestingCenter")}
                </Col>

                {/* Medicine Name & Generic */}
                <Col md={6}>
                    <Label htmlFor="medicineName" className="fs-13 text-muted mb-1">
                        Medicine Name <span className="text-danger">*</span>
                    </Label>
                    <Input
                        id="medicineName"
                        name="medicineName"
                        value={values.medicineName}
                        onChange={(e) => {
                            handleChange(e);
                            debouncedCheck(e.target.value, values.strength, values.baseUnit);
                        }}
                        onBlur={handleBlur}
                        invalid={touched.medicineName && !!errors.medicineName}
                    />
                    {errorText("medicineName")}
                    {duplicateError && (
                        <div className="text-danger mt-1 small">{duplicateError}</div>
                    )}
                </Col>
                <Col md={6}>
                    <Label htmlFor="genericName" className="fs-13 text-muted mb-1">
                        Generic Name <span className="text-danger">*</span>
                        {aiTag("genericName")}
                    </Label>
                    <Input
                        id="genericName"
                        name="genericName"
                        value={values.genericName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        invalid={touched.genericName && !!errors.genericName}
                    />
                    {errorText("genericName")}
                </Col>

                {/* Form, Base Unit, Purchase Unit */}
                {[
                    { label: "Form", name: "form", options: medicineForms, placeholder: "Choose Form", required: true },
                    { label: "Base Unit", name: "baseUnit", options: baseUnits, placeholder: "Choose B. Unit", required: true },
                    { label: "Purchase Unit", name: "purchaseUnit", options: purchaseUnits, placeholder: "Choose P. Unit", required: true },
                ].map(({ label, name, options, placeholder, required }) => (
                    <Col key={name} md={4}>
                        <Label className="fs-13 text-muted mb-1">
                            {label} {required && <span className="text-danger">*</span>}
                            {aiTag(name)}
                        </Label>
                        <Select
                            name={name}
                            placeholder={placeholder}
                            options={(options || []).map((item) => ({ value: item, label: normalizeLabel(item) }))}
                            onChange={(selected) => {
                                const next = selected ? selected.value : "";
                                setFieldValue(name, next);
                                if (name === "baseUnit") debouncedCheck(values.medicineName, values.strength, next);
                            }}
                            onBlur={() => handleBlur({ target: { name } })}
                            value={values[name] ? { value: values[name], label: normalizeLabel(values[name]) } : null}
                            classNamePrefix="react-select"
                        />
                        {errorText(name)}
                    </Col>
                ))}

                {/* Conversion */}
                <Col md={12}>
                    <Label className="fs-13 text-muted mb-1">
                        Conversion <span className="text-danger">*</span>
                        {aiBadge(isAiConversion)}
                    </Label>
                    {isAiConversion && (
                        <div className="small mb-1" style={{ color: "#6b7280" }}>
                            This is AI's best guess at the typical pack size — please confirm it against the actual pack.
                        </div>
                    )}
                    <div className="d-flex align-items-start flex-column">
                        <div className="d-flex align-items-center gap-2">
                            <Input
                                name="purchaseQuantity"
                                value={values.purchaseQuantity}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                type="number"
                                placeholder="Qty"
                                style={{ width: "80px", flexShrink: 0 }}
                                invalid={touched.purchaseQuantity && !!errors.purchaseQuantity}
                            />
                            <span className="badge bg-light text-dark border fs-12" style={{ whiteSpace: "nowrap" }}>
                                {normalizeUnderscores(values.purchaseUnit) || "PURCHASE UNIT"}
                            </span>
                            <span className="fw-bold text-muted">=</span>
                            <Input
                                name="baseQuantity"
                                value={values.baseQuantity}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                type="number"
                                placeholder="Qty"
                                style={{ width: "80px", flexShrink: 0 }}
                                invalid={touched.baseQuantity && !!errors.baseQuantity}
                            />
                            <span className="badge bg-light text-dark border fs-12" style={{ whiteSpace: "nowrap" }}>
                                {normalizeUnderscores(values.baseUnit) || "BASE UNIT"}
                            </span>
                        </div>
                        {(touched.purchaseQuantity && errors.purchaseQuantity) || (touched.baseQuantity && errors.baseQuantity) ? (
                            <div className="text-danger small mt-1">
                                {errors.purchaseQuantity || errors.baseQuantity}
                            </div>
                        ) : null}
                    </div>
                </Col>

                {/* Category, Storage, Schedule */}
                {[
                    { label: "Category", name: "category", options: medicineCategories, placeholder: "Choose Category", required: true },
                    { label: "Storage Type", name: "storageType", options: storageTypes, placeholder: "Choose Storage Type", required: true },
                    { label: "Schedule Type", name: "scheduleType", options: scheduleTypes, placeholder: "Choose Schedule Type", required: true },
                ].map(({ label, name, options, placeholder, required }) => (
                    <Col key={name} md={4}>
                        <Label className="fs-13 text-muted mb-1">
                            {label} {required && <span className="text-danger">*</span>}
                            {aiTag(name)}
                        </Label>
                        <Select
                            name={name}
                            placeholder={placeholder}
                            options={(options || []).map((item) => ({ value: item, label: normalizeLabel(item) }))}
                            onChange={(selected) => setFieldValue(name, selected ? selected.value : "")}
                            onBlur={() => handleBlur({ target: { name } })}
                            value={values[name] ? { value: values[name], label: normalizeLabel(values[name]) } : null}
                            classNamePrefix="react-select"
                        />
                        {errorText(name)}
                    </Col>
                ))}

                {/* Type, Strength, Price */}
                <Col md={4}>
                    <Label className="fs-13 text-muted mb-1">
                        Type <span className="text-danger">*</span>
                        {aiTag("type")}
                    </Label>
                    <Select
                        name="type"
                        placeholder="Choose Type"
                        options={(medicineTypes2 || []).map((item) => ({ value: item, label: normalizeLabel(item) }))}
                        onChange={(selected) => setFieldValue("type", selected ? selected.value : "")}
                        value={values.type ? { value: values.type, label: normalizeLabel(values.type) } : null}
                        classNamePrefix="react-select"
                    />
                    {errorText("type")}
                </Col>
                <Col md={4}>
                    <Label htmlFor="strength" className="fs-13 text-muted mb-1">Strength</Label>
                    <Input
                        id="strength"
                        name="strength"
                        value={values.strength}
                        onChange={(e) => {
                            handleChange(e);
                            debouncedCheck(values.medicineName, e.target.value, values.baseUnit);
                        }}
                    />
                </Col>
                <Col md={4}>
                    <Label className="fs-13 text-muted mb-1">Controlled Drug</Label>
                    <Select
                        name="isControlledDrug"
                        placeholder="Controlled Drug?"
                        options={[
                            { value: true, label: "Yes" },
                            { value: false, label: "No" },
                        ]}
                        onChange={(selected) => setFieldValue("isControlledDrug", selected ? selected.value : false)}
                        value={
                            values.isControlledDrug
                                ? { value: true, label: "Yes" }
                                : { value: false, label: "No" }
                        }
                        classNamePrefix="react-select"
                    />
                </Col>
                {/* <Col md={4}>
                    <Label htmlFor="unitPrice" className="fs-13 text-muted mb-1">Estimated Unit Price (₹)</Label>
                    <Input id="unitPrice" name="unitPrice" type="number" value={values.unitPrice} onChange={handleChange} />
                </Col> */}

                {/* Composition & Instruction */}
                <Col md={6}>
                    <Label htmlFor="composition" className="fs-13 text-muted mb-1">Composition{aiTag("composition")}</Label>
                    <Input id="composition" name="composition" type="textarea" rows={3} value={values.composition} onChange={handleChange} />
                </Col>
                {/* <Col md={6}>
                    <Label htmlFor="instruction" className="fs-13 text-muted mb-1">Instructions</Label>
                    <Input id="instruction" name="instruction" type="textarea" rows={3} value={values.instruction} onChange={handleChange} />
                </Col> */}

                {/* Justification */}
                <Col md={12}>
                    <Label htmlFor="justification" className="fs-13 text-muted mb-1">
                        Justification <span className="text-danger">*</span>
                    </Label>
                    <Input
                        id="justification"
                        name="justification"
                        type="textarea"
                        rows={3}
                        placeholder="Why is this medicine needed in the inventory?"
                        value={values.justification}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        invalid={touched.justification && !!errors.justification}
                    />
                    {errorText("justification")}
                </Col>

                {/* Submit Section */}
                {canSubmit && (
                    <Col md={12} className="text-end mt-4">
                        <Button
                            color="primary"
                            type="submit"
                            disabled={loading || !!duplicateError}
                            className="px-5 text-white"
                        >
                            {loading ? <Spinner size="sm" /> : isEdit ? "Update Requisition" : "Submit Requisition"}
                        </Button>
                    </Col>
                )}
            </Row>
        </form>
    </div>
  );
};

export default MedicineRequisitionForm;
