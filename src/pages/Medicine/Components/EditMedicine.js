import React, { useRef, useState } from "react";
import { Col, Button, Input, FormFeedback, Form, Row } from "reactstrap";
import Select from "react-select";
import PropTypes from "prop-types";

//redux
import { useDispatch } from "react-redux";
import { updateMedicine as updMedicine } from "../../../store/actions";

// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";
import {
  medicineTypes,
  medicineForms,
  baseUnits,
  purchaseUnits,
  medicineCategories,
  storageTypes,
  scheduleTypes,
  normalizeLabel,
} from "../../../Components/constants/medicine";
import { duplicateMedicineValidator } from "../../../store/features/medicine/medicineSlice";
import { toast } from "react-toastify";
import { normalizeUnderscores } from "../../../utils/normalizeUnderscore";

function useDebounce(callback, delay) {
  const timer = useRef(null);
  return (...args) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      callback(...args);
    }, delay);
  };
}

const EditMedicine = ({ updateMedicine, setUpdateMedicine }) => {
  const dispatch = useDispatch();
  const data = updateMedicine?.formData;

  const [dupError, setDupError] = useState("");

  // Duplicate = same name + strength + unit/base unit already in the master (excluding this one).
  const checkDuplicate = async (name, strength, baseUnit) => {
    if (!name || !baseUnit) {
      setDupError("");
      return;
    }

    try {
      const response = await dispatch(duplicateMedicineValidator({ name, strength, baseUnit, id: data?._id })).unwrap();

      if (response.exists) {
        setDupError(response.message);
      } else {
        setDupError("");
      }
    } catch (err) {
    }
  };

  const debouncedCheck = useDebounce(checkDuplicate, 500);

  const validation = useFormik({
    // enableReinitialize : use this flag when initial values needs to be changed
    enableReinitialize: true,

    initialValues: {
      id: data?._id || "",
      name: data?.name || "",
      brandName: data?.brandName || "",
      genericName: data?.genericName || "",
      form: data?.form || "",
      baseUnit: data?.baseUnit || "",
      purchaseUnit: data?.purchaseUnit || "",
      category: data?.category || "",
      storageType: data?.storageType || "",
      scheduleType: data?.scheduleType || "",
      type: data?.type || "",
      strength: data?.strength || "",
      unit: data?.unit || "",
      instruction: data?.instruction || "",
      composition: data?.composition || "",
      quantity: data?.quantity || "",
      unitPrice: data?.unitPrice || "",
      purchaseQuantity: data?.conversion?.purchaseQuantity ?? "",
      baseQuantity: data?.conversion?.baseQuantity ?? "",
      isControlledDrug: data?.isControlledDrug || false,
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Please Enter Medicine Name"),
    }),
    onSubmit: (values) => {
      if (dupError) {
        toast.error("Fix duplicate medicine before saving");
        return;
      }

      const { purchaseQuantity, baseQuantity, ...rest } = values;
      dispatch(updMedicine({
        ...rest,
        conversion: {
          purchaseQuantity: Number(purchaseQuantity) || 0,
          baseQuantity: Number(baseQuantity) || 0,
        },
      }));
      setUpdateMedicine({
        isForm: false,
        formIndex: undefined,
        formData: undefined,
      });
      validation.resetForm();
    },
  });

  const selectField = (label, name, options, placeholder) => (
    <Col md={4} className="mb-3">
      <label className="fs-12 text-muted mb-1">{label}</label>
      <Select
        name={name}
        placeholder={placeholder}
        options={(options || []).map((item) => ({ value: item, label: normalizeLabel(item) }))}
        onChange={(selected) => validation.setFieldValue(name, selected ? selected.value : "")}
        onBlur={() => validation.setFieldTouched(name, true)}
        value={validation.values[name] ? { value: validation.values[name], label: normalizeLabel(validation.values[name]) } : null}
        classNamePrefix="react-select"
      />
    </Col>
  );

  return (
    <React.Fragment>
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          validation.handleSubmit();
          return false;
        }}
        className="needs-validation"
        action="#"
      >
        <Row>
          {/* Row 1 */}
          <Col md={4} className="mb-3">
            <label className="fs-12 text-muted mb-1">Name*</label>
            <Input
              onChange={(e) => {
                validation.handleChange(e);
                debouncedCheck(e.target.value, validation.values.strength, validation.values.baseUnit);
              }}
              name="name"
              onBlur={validation.handleBlur}
              value={validation.values.name || ""}
              bsSize="sm"
              placeholder="Name"
            />
            {validation.touched.name && validation.errors.name && (
              <FormFeedback type="invalid" className="d-block">{validation.errors.name}</FormFeedback>
            )}
          </Col>
          {/* <Col md={4} className="mb-3">
            <label className="fs-12 text-muted mb-1">Brand Name</label>
            <Input onChange={validation.handleChange} name="brandName" onBlur={validation.handleBlur} value={validation.values.brandName || ""} bsSize="sm" placeholder="Brand Name" />
          </Col> */}
          <Col md={4} className="mb-3">
            <label className="fs-12 text-muted mb-1">Generic Name</label>
            <Input onChange={validation.handleChange} name="genericName" onBlur={validation.handleBlur} value={validation.values.genericName || ""} bsSize="sm" placeholder="Generic Name" />
          </Col>

          {/* Row 2 */}
          {selectField("Form", "form", medicineForms, "Choose Form")}
          <Col md={4} className="mb-3">
            <label className="fs-12 text-muted mb-1">Base Unit</label>
            <Select
              name="baseUnit"
              placeholder="Choose B. Unit"
              options={(baseUnits || []).map((item) => ({ value: item, label: normalizeLabel(item) }))}
              onChange={(selected) => {
                const val = selected ? selected.value : "";
                validation.setFieldValue("baseUnit", val);
                validation.setFieldValue("unit", val);
                debouncedCheck(validation.values.name, validation.values.strength, val);
              }}
              onBlur={() => validation.setFieldTouched("baseUnit", true)}
              value={validation.values.baseUnit ? { value: validation.values.baseUnit, label: normalizeLabel(validation.values.baseUnit) } : null}
              classNamePrefix="react-select"
            />
          </Col>
          {selectField("Purchase Unit", "purchaseUnit", purchaseUnits, "Choose P. Unit")}

          {/* Conversion  */}
          <Col md={12} className="mb-3">
            <label className="fs-12 text-muted mb-1">Conversion</label>
            <div className="d-flex align-items-center gap-2">
              <Input
                onChange={validation.handleChange}
                name="baseQuantity"
                onBlur={validation.handleBlur}
                value={validation.values.baseQuantity ?? ""}
                bsSize="sm"
                placeholder="Qty"
                type="number"
                style={{ width: "80px", flexShrink: 0 }}
              />
              <span className="badge bg-light text-dark border fs-12" style={{ whiteSpace: "nowrap" }}>
                {normalizeUnderscores(validation.values.baseUnit) || "BASE UNIT"}
              </span>
              <span className="fw-bold text-muted">=</span>
              <Input
                onChange={validation.handleChange}
                name="purchaseQuantity"
                onBlur={validation.handleBlur}
                value={validation.values.purchaseQuantity ?? ""}
                bsSize="sm"
                placeholder="Qty"
                type="number"
                style={{ width: "80px", flexShrink: 0 }}
              />
              <span className="badge bg-light text-dark border fs-12" style={{ whiteSpace: "nowrap" }}>
                {normalizeUnderscores(validation.values.purchaseUnit) || "PURCHASE UNIT"}
              </span>
            </div>
          </Col>

          {/* Row 3 */}
          {selectField("Category", "category", medicineCategories, "Choose Category")}
          {selectField("Storage Type", "storageType", storageTypes, "Choose Type")}
          {selectField("Schedule Type", "scheduleType", scheduleTypes, "Choose Schedule Type")}

          {/* Row 4 */}
          {selectField("Type*", "type", medicineTypes, "Choose Type")}
          <Col md={4} className="mb-3">
            <label className="fs-12 text-muted mb-1">Strength</label>
            <Input
              onChange={(e) => {
                validation.handleChange(e);
                debouncedCheck(validation.values.name, e.target.value, validation.values.baseUnit);
              }}
              name="strength"
              onBlur={validation.handleBlur}
              value={validation.values.strength || ""}
              bsSize="sm"
              placeholder="Strength"
              invalid={!!dupError}
            />
            {dupError && <FormFeedback className="d-block">{dupError}</FormFeedback>}
          </Col>
          {/* {selectField("Unit", "unit", medicineUnits, "Choose Unit")} */}

          {/* Row 5 */}
          {/* <Col md={4} className="mb-3">
            <label className="fs-12 text-muted mb-1">Instruction</label>
            <Input onChange={validation.handleChange} name="instruction" onBlur={validation.handleBlur} value={validation.values.instruction || ""} type="textarea" rows="2" bsSize="sm" placeholder="Instruction" />
          </Col> */}
          <Col md={4} className="mb-3">
            <label className="fs-12 text-muted mb-1">Composition</label>
            <Input onChange={validation.handleChange} name="composition" onBlur={validation.handleBlur} value={validation.values.composition || ""} type="textarea" rows="2" bsSize="sm" placeholder="Composition" />
          </Col>
          {/* <Col md={4} className="mb-3">
            <label className="fs-12 text-muted mb-1">Quantity</label>
            <Input onChange={validation.handleChange} name="quantity" onBlur={validation.handleBlur} value={validation.values.quantity || ""} bsSize="sm" placeholder="Quantity" type="number" />
          </Col> */}

          {/* Row 6 */}
          {/* <Col md={4} className="mb-3">
            <label className="fs-12 text-muted mb-1">Unit Price</label>
            <Input onChange={validation.handleChange} name="unitPrice" onBlur={validation.handleBlur} value={validation.values.unitPrice || ""} bsSize="sm" placeholder="Unit Price" type="number" />
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
              onChange={(selected) => validation.setFieldValue("isControlledDrug", selected ? selected.value : false)}
              onBlur={() => validation.setFieldTouched("isControlledDrug", true)}
              value={
                validation.values.isControlledDrug
                  ? { value: true, label: "Yes" }
                  : { value: false, label: "No" }
              }
              classNamePrefix="react-select"
            />
          </Col>
          {/* Actions */}
          <Col md={12} className="d-flex justify-content-end gap-2 mt-2">
            <Button
              type="button"
              size="sm"
              color="danger"
              outline
              onClick={() => setUpdateMedicine({ isForm: false, formIndex: undefined, formData: undefined })}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" color="success" disabled={!!dupError}>
              Save Changes
            </Button>
          </Col>
        </Row>
      </Form>
    </React.Fragment>
  );
};

EditMedicine.propTypes = {
  updateMedicine: PropTypes.object,
  setUpdateMedicine: PropTypes.func,
};

export default EditMedicine;
