import React, { useState, useEffect, useRef } from "react";
import { Form, Row, Col, Input, Button, FormFeedback, Spinner } from "reactstrap";
import PropTypes from "prop-types";
import Select from "react-select";

// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";

//redux
import { useDispatch } from "react-redux";
import { addMedicine, fetchMedicines } from "../../../store/actions";
import {
  medicineTypes2,
  medicineForms,
  baseUnits,
  purchaseUnits,
  medicineCategories,
  storageTypes,
  scheduleTypes,
  normalizeLabel,
} from "../../../Components/constants/medicine";
import { duplicateMedicineValidator } from "../../../store/features/medicine/medicineSlice";
import { normalizeUnderscores } from "../../../utils/normalizeUnderscore";

function useDebounce(callback, delay) {
  const timer = useRef(null);
  function debouncedFn(...args) {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }
  return debouncedFn;
}

const createEmptyMedicine = () => ({
  name: "",
  brandName: "",
  genericName: "",
  form: "",
  baseUnit: "",
  purchaseUnit: "",
  category: "",
  storageType: "",
  scheduleType: "",
  type: "",
  strength: "",
  unit: "",
  instruction: "",
  composition: "",
  quantity: "",
  unitPrice: "",
  purchaseQuantity: "",
  baseQuantity: "",
  isControlledDrug: false,
});

const MedicinesForm = ({ toggle, currentPage = 1, itemsPerPage = 10, searchItem = "" }) => {
  const dispatch = useDispatch();
  const [medicines, setMedicines] = useState([]);
  const [errors, setErrors] = useState({});
  const [hasErrors, setHasErrors] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setHasErrors(Object.keys(errors).length > 0);
  }, [errors]);

  // Duplicate = same name + strength + unit/base unit already in the master.
  const checkDuplicate = async (idx, name, strength, baseUnit) => {
    if (!name || !baseUnit) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[idx];
        return copy;
      });
      return;
    }

    try {
      const response = await dispatch(
        duplicateMedicineValidator({ name, strength, baseUnit })
      ).unwrap();

      if (response.exists) {
        setErrors((prev) => ({
          ...prev,
          [idx]: response.message,
        }));
      } else {
        setErrors((prev) => {
          const copy = { ...prev };
          delete copy[idx];
          return copy;
        });
      }
    } catch (err) {
    }
  };

  const debouncedCheck = useDebounce(checkDuplicate, 500);

  const addMedicines = () => {
    setMedicines([...medicines, createEmptyMedicine()]);
  };

  const handleChange = (e) => {
    const medList = [...medicines];
    const prop = e.target.name;
    const value = e.target.value;
    const idx = parseInt(e.target.id, 10);

    medList[idx][prop] = value;
    if (prop === "baseUnit") {
      medList[idx].unit = value;
    }
    setMedicines(medList);

    if (prop === "name" || prop === "strength" || prop === "baseUnit") {
      const { name, strength, baseUnit } = medList[idx];
      debouncedCheck(idx, name, strength, baseUnit);
    }
  };

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: { medicines },
    validationSchema: Yup.object({
      medicines: Yup.array()
        .of(
          Yup.object({
            name: Yup.string().trim().required("Name is required"),
            genericName: Yup.string().trim().required("Generic Name is required"),
            form: Yup.string().required("Form is required"),
            baseUnit: Yup.string().required("Base Unit is required"),
            purchaseUnit: Yup.string().required("Purchase Unit is required"),
            baseQuantity: Yup.number().positive("Must be positive").required("Base Qty required"),
            purchaseQuantity: Yup.number().positive("Must be positive").required("Purchase Qty required"),
            category: Yup.string().required("Category is required"),
            storageType: Yup.string().required("Storage Type is required"),
            scheduleType: Yup.string().required("Schedule Type is required"),
            type: Yup.string().trim().required("Type is required"),
          })
        )
        .min(1, "At least one medicine is required"),
    }),
    onSubmit: async (values) => {
      if (hasErrors) {
        alert("Fix duplicate strengths before submitting");
        return;
      }

      const payload = values.medicines.map(
        ({ purchaseQuantity, baseQuantity, ...rest }) => ({
          ...rest,
          conversion: {
            purchaseQuantity: Number(purchaseQuantity) || 0,
            baseQuantity: Number(baseQuantity) || 0,
          },
        })
      );

      setIsSaving(true);
      try {
        await dispatch(addMedicine(payload)).unwrap();
      } catch (error) {
        // Keep the modal open so the entered values are not lost on save failure.
        setIsSaving(false);
        return;
      }
      setIsSaving(false);
      setMedicines([]);
      validation.resetForm();
      toggle();
      dispatch(
        fetchMedicines({
          page: currentPage,
          limit: itemsPerPage,
          search: searchItem,
        })
      );
    },
  });

  const medicineFieldError = (idx, field) => {
    const rowErrors = validation.errors.medicines?.[idx];
    return typeof rowErrors === "object" ? rowErrors?.[field] : undefined;
  };

  const showFieldError = (idx, field) =>
    Boolean(validation.submitCount > 0 && medicineFieldError(idx, field));

  const removeMedicine = (idx) => {
    const medList = [...medicines];
    medList.splice(idx, 1);
    setMedicines(medList);
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[idx];
      return copy;
    });
  };

  return (
    <Form
      onSubmit={(e) => {
        e.preventDefault();
        if (isSaving) return false;
        validation.handleSubmit();
        return false;
      }}
      className="needs-validation"
    >
      <fieldset disabled={isSaving} className="border-0 p-0 m-0">
        <Row className="ps-3 pe-3">


          {(medicines || []).map((medicine, idx) => (
            <React.Fragment key={idx}>
              <Col xs={12} className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-semibold">Medicine #{idx + 1}</span>
                <Button size="sm" onClick={() => removeMedicine(idx)} color="danger">
                  <i className="ri-delete-bin-6-line fs-14 text-white"></i>
                </Button>
              </Col>

              {/* Row 1 */}
              <Col md={4} className="mb-3">
                <label className="fs-12 text-muted mb-1">
                  Name<span className="text-danger ms-1">*</span>
                </label>
                <Input
                  required
                  bsSize="sm"
                  id={idx}
                  onChange={handleChange}
                  name="name"
                  value={medicine.name}
                  type="text"
                  placeholder="Medicine Name"
                  invalid={showFieldError(idx, "name")}
                />
                {showFieldError(idx, "name") && (
                  <FormFeedback className="d-block">
                    {medicineFieldError(idx, "name")}
                  </FormFeedback>
                )}
              </Col>
              {/* <Col md={4} className="mb-3">
                <label className="fs-12 text-muted mb-1">Brand Name</label>
                <Input bsSize="sm" id={idx} onChange={handleChange} name="brandName" value={medicine.brandName} type="text" placeholder="Brand Name" />
              </Col> */}
              <Col md={4} className="mb-3">
                <label className="fs-12 text-muted mb-1">
                  Generic Name<span className="text-danger ms-1">*</span>
                </label>
                <Input
                  bsSize="sm"
                  id={idx}
                  onChange={handleChange}
                  onBlur={validation.handleBlur}
                  name="genericName"
                  value={medicine.genericName}
                  type="text"
                  placeholder="Generic Name"
                  invalid={showFieldError(idx, "genericName")}
                />
                {showFieldError(idx, "genericName") && (
                  <FormFeedback className="d-block">
                    {medicineFieldError(idx, "genericName")}
                  </FormFeedback>
                )}
              </Col>

              {/* Row 2 */}
              {[
                { label: "Form", name: "form", options: medicineForms, placeholder: "Choose Form", required: true },
                { label: "Base Unit", name: "baseUnit", options: baseUnits, placeholder: "Choose B. Unit", required: true },
                { label: "Purchase Unit", name: "purchaseUnit", options: purchaseUnits, placeholder: "Choose P. Unit", required: true },
              ].map(({ label, name, options, placeholder, required }) => (
                <Col key={name} md={4} className="mb-3">
                  <label className="fs-12 text-muted mb-1">
                    {label}{required && <span className="text-danger ms-1">*</span>}
                  </label>
                  <Select
                    name={name}
                    placeholder={placeholder}
                    options={(options || []).map((item) => ({ value: item, label: normalizeLabel(item) }))}
                    onChange={(selected) => handleChange({ target: { name, value: selected ? selected.value : "", id: idx.toString() } })}
                    onBlur={() => validation.handleBlur({ target: { name: `medicines[${idx}].${name}` } })}
                    value={medicine[name] ? { value: medicine[name], label: normalizeLabel(medicine[name]) } : null}
                    classNamePrefix="react-select"
                    isDisabled={isSaving}
                  />
                  {showFieldError(idx, name) && (
                    <div className="text-danger small mt-1">
                      {medicineFieldError(idx, name)}
                    </div>
                  )}
                </Col>
              ))}

              {/* Conversion  */}
              <Col md={12} className="mb-3">
                <label className="fs-12 text-muted mb-1">
                  Conversion<span className="text-danger ms-1">*</span>
                </label>
                <div className="d-flex align-items-start flex-column">
                    <div className="d-flex align-items-center gap-2">
                    <Input
                        bsSize="sm"
                        id={idx}
                        onChange={handleChange}
                        onBlur={validation.handleBlur}
                        name="baseQuantity"
                        value={medicine.baseQuantity}
                        type="number"
                        placeholder="Qty"
                        style={{ width: "80px", flexShrink: 0 }}
                        invalid={showFieldError(idx, "baseQuantity")}
                    />
                    <span className="badge bg-light text-dark border fs-12" style={{ whiteSpace: "nowrap" }}>
                        {normalizeUnderscores(medicine.baseUnit) || "BASE UNIT"}
                    </span>
                    <span className="fw-bold text-muted">=</span>
                    <Input
                        bsSize="sm"
                        id={idx}
                        onChange={handleChange}
                        onBlur={validation.handleBlur}
                        name="purchaseQuantity"
                        value={medicine.purchaseQuantity}
                        type="number"
                        placeholder="Qty"
                        style={{ width: "80px", flexShrink: 0 }}
                        invalid={showFieldError(idx, "purchaseQuantity")}
                    />
                    <span className="badge bg-light text-dark border fs-12" style={{ whiteSpace: "nowrap" }}>
                        {normalizeUnderscores(medicine.purchaseUnit) || "PURCHASE UNIT"}
                    </span>
                    </div>
                    {showFieldError(idx, "baseQuantity") || showFieldError(idx, "purchaseQuantity") ? (
                        <div className="text-danger small mt-1">
                            {medicineFieldError(idx, "baseQuantity") || medicineFieldError(idx, "purchaseQuantity")}
                        </div>
                    ) : null}
                </div>
              </Col>

              {/* Row 3 */}
              {[
                { label: "Category", name: "category", options: medicineCategories, placeholder: "Choose Category", required: true },
                { label: "Storage Type", name: "storageType", options: storageTypes, placeholder: "Choose Storage Type", required: true },
                { label: "Schedule Type", name: "scheduleType", options: scheduleTypes, placeholder: "Choose Schedule Type", required: true },
              ].map(({ label, name, options, placeholder, required }) => (
                <Col key={name} md={4} className="mb-3">
                  <label className="fs-12 text-muted mb-1">
                    {label}{required && <span className="text-danger ms-1">*</span>}
                  </label>
                  <Select
                    name={name}
                    placeholder={placeholder}
                    options={(options || []).map((item) => ({ value: item, label: normalizeLabel(item) }))}
                    onChange={(selected) => handleChange({ target: { name, value: selected ? selected.value : "", id: idx.toString() } })}
                    onBlur={() => validation.handleBlur({ target: { name: `medicines[${idx}].${name}` } })}
                    value={medicine[name] ? { value: medicine[name], label: normalizeLabel(medicine[name]) } : null}
                    classNamePrefix="react-select"
                    isDisabled={isSaving}
                  />
                  {showFieldError(idx, name) && (
                    <div className="text-danger small mt-1">
                      {medicineFieldError(idx, name)}
                    </div>
                  )}
                </Col>
              ))}

              {/* Row 4 */}
              <Col md={4} className="mb-3">
                <label className="fs-12 text-muted mb-1">
                  Type<span className="text-danger ms-1">*</span>
                </label>
                <Select
                  name="type"
                  placeholder="Choose Type"
                  options={(medicineTypes2 || []).map((item) => ({ value: item, label: normalizeLabel(item) }))}
                  onChange={(selected) => handleChange({ target: { name: "type", value: selected ? selected.value : "", id: idx.toString() } })}
                  value={medicine.type ? { value: medicine.type, label: normalizeLabel(medicine.type) } : null}
                  classNamePrefix="react-select"
                  isDisabled={isSaving}
                />
                {showFieldError(idx, "type") && (
                  <div className="text-danger mt-1" style={{ fontSize: "0.875em" }}>
                    {medicineFieldError(idx, "type")}
                  </div>
                )}
              </Col>
              <Col md={4} className="mb-3">
                <label className="fs-12 text-muted mb-1">Strength</label>
                <Input
                  bsSize="sm"
                  id={idx}
                  onChange={handleChange}
                  name="strength"
                  value={medicine.strength}
                  type="text"
                  placeholder="Strength"
                  invalid={!!errors[idx]}
                />
                {errors[idx] && <FormFeedback className="d-block">{errors[idx]}</FormFeedback>}
              </Col>
              {/* <Col md={4} className="mb-3">
                <label className="fs-12 text-muted mb-1">Unit</label>
                <Select
                  name="unit"
                  placeholder="Choose Unit"
                  options={(medicineUnits || []).map((item) => ({ value: item, label: normalizeLabel(item) }))}
                  onChange={(selected) => handleChange({ target: { name: "unit", value: selected ? selected.value : "", id: idx.toString() } })}
                  value={medicine.unit ? { value: medicine.unit, label: medicine.unit } : null}
                  classNamePrefix="react-select"
                  isDisabled={isSaving}
                />
              </Col> */}

              {/* Row 5 */}
              {/* <Col md={4} className="mb-3">
                <label className="fs-12 text-muted mb-1">Instruction</label>
                <Input bsSize="sm" id={idx} onChange={handleChange} name="instruction" value={medicine.instruction} type="textarea" placeholder="Instruction" rows="2" />
              </Col> */}
              <Col md={4} className="mb-3">
                <label className="fs-12 text-muted mb-1">Composition</label>
                <Input bsSize="sm" id={idx} onChange={handleChange} name="composition" value={medicine.composition} type="textarea" placeholder="Composition" rows="2" />
              </Col>
              {/* <Col md={4} className="mb-3">
                <label className="fs-12 text-muted mb-1">Quantity</label>
                <Input bsSize="sm" id={idx} onChange={handleChange} name="quantity" value={medicine.quantity} type="number" placeholder="Quantity" />
              </Col> */}

              {/* Row 6 */}
              {/* <Col md={4} className="mb-3">
                <label className="fs-12 text-muted mb-1">Unit Price</label>
                <Input bsSize="sm" id={idx} onChange={handleChange} name="unitPrice" value={medicine.unitPrice} type="number" placeholder="Unit Price" />
              </Col> */}
              <Col md={4} className="mb-3">
                <label className="fs-12 text-muted mb-1">Controlled Drug</label>
                <Select
                  name="isControlledDrug"
                  placeholder="Controlled Drug?"
                  options={[
                    { value: true, label: "Yes" },
                    { value: false, label: "No" },
                  ]}
                  onChange={(selected) => handleChange({ target: { name: "isControlledDrug", value: selected ? selected.value : false, id: idx.toString() } })}
                  value={
                    medicine.isControlledDrug
                      ? { value: true, label: "Yes" }
                      : { value: false, label: "No" }
                  }
                  classNamePrefix="react-select"
                  isDisabled={isSaving}
                />
              </Col>
              <Col xs={12}><hr className="mt-2 text-muted" /></Col>
            </React.Fragment>
          ))}

          <Col xs={12} className="mb-3">
            {validation.submitCount > 0 && typeof validation.errors.medicines === "string" ? (
              <FormFeedback type="invalid" className="d-block">
                {validation.errors.medicines}
              </FormFeedback>
            ) : null}
          </Col>
          <Col>
            <div className="d-flex justify-content-between">
              <Button
                size="sm"
                type="button"
                color="secondary"
                outline
                onClick={addMedicines}
                disabled={isSaving}
              >
                Add
              </Button>
              <Button
                size="sm"
                type="submit"
                color="primary"
                outline
                disabled={isSaving || hasErrors || medicines.length === 0}
              >
                {isSaving ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </Col>
        </Row>
      </fieldset>
    </Form>
  );
};

MedicinesForm.propTypes = {
  toggle: PropTypes.func.isRequired,
};

export default MedicinesForm;
