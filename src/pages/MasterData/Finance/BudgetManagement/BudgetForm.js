import React, { useEffect, useState } from "react";
import { Row, Col, Label, Input, FormFeedback, Button } from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import {
  createBudget,
  updateBudget,
  getUserLookup,
} from "../../../../helpers/backend_helper";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { useReferenceList } from "../../../../Components/Hooks/useReferenceData";
import "../../UnitOfMeasurement/uom.scss";

function getCurrentFiscalYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  // Fiscal year starts in April — if before April, we're still in the previous FY
  const startYear = month >= 4 ? year : year - 1;
  return `FY-${startYear}-${startYear + 1}`;
}

const CURRENT_FISCAL_YEAR = getCurrentFiscalYear();

const BudgetForm = ({ editingItem, onSaved, onCancel }) => {
  const handleAuthError = useAuthError();
  const { items: departments } = useReferenceList("departments");
  const { items: centers } = useReferenceList("centers");
  const [userSearch, setUserSearch] = useState("");
  const [userOptions, setUserOptions] = useState([]);
  const [selectedUserLabel, setSelectedUserLabel] = useState(
    editingItem?.departmentBudgetHeadId?.name || "",
  );
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  useEffect(() => {
    if (userSearch.trim().length < 2) {
      setUserOptions([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      getUserLookup({ search: userSearch })
        .then((res) => {
          if (!cancelled) setUserOptions(res?.data || []);
        })
        .catch(() => {});
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [userSearch]);

  const validation = useFormik({
    initialValues: {
      budgetType: editingItem?.budgetType || "department",
      fiscalYear: editingItem?.fiscalYear || CURRENT_FISCAL_YEAR,
      centerId: editingItem?.centerId?._id || editingItem?.centerId || "",
      departmentId:
        editingItem?.departmentId?._id || editingItem?.departmentId || "",
      departmentBudgetHeadId:
        editingItem?.departmentBudgetHeadId?._id ||
        editingItem?.departmentBudgetHeadId ||
        "",
      currency: editingItem?.currency || "INR",
      requestedAmount: editingItem?.requestedAmount ?? "",
      remarks: editingItem?.remarks || "",
    },
    validationSchema: Yup.object({
      budgetType: Yup.string().required(),
      fiscalYear: Yup.string().trim().required("Fiscal year is required"),
      centerId: Yup.string().when("budgetType", {
        is: "department",
        then: (schema) => schema.required("Center is required"),
      }),
      departmentId: Yup.string().when("budgetType", {
        is: "department",
        then: (schema) => schema.required("Department is required"),
      }),
      departmentBudgetHeadId: Yup.string().required("Budget head is required"),
      requestedAmount: Yup.number()
        .typeError("Enter a valid amount")
        .moreThan(0, "Must be greater than zero")
        .required("Requested amount is required"),
    }),
    onSubmit: async (values, { setTouched }) => {
      const errors = await validation.validateForm();
      if (Object.keys(errors).length > 0) {
        setTouched({
          fiscalYear: true,
          centerId: true,
          departmentId: true,
          departmentBudgetHeadId: true,
          requestedAmount: true,
        });
        toast.error("Please fill in all required fields");
        return;
      }
      const payload = {
        ...values,
        requestedAmount: Number(values.requestedAmount),
      };
      if (payload.budgetType === "global") {
        delete payload.departmentId;
        delete payload.centerId;
      }

      try {
        if (editingItem) {
          await updateBudget(editingItem._id, payload);
          toast.success("Budget updated successfully");
        } else {
          await createBudget(payload);
          toast.success("Budget saved as draft");
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

  const selectUser = (user) => {
    validation.setFieldValue("departmentBudgetHeadId", user._id);
    setSelectedUserLabel(user.name);
    setShowUserDropdown(false);
    setUserSearch("");
  };

  return (
    <div className="uom-form-page">
      <h4 className="uom-form-title">
        {editingItem ? "Edit Budget" : "Create Budget"}
      </h4>
      <p className="text-muted mb-4">
        Establish departmental or global budget allocations for operations
      </p>

      <div className="uom-form-panel">
        <form onSubmit={validation.handleSubmit}>
          <h6 className="uom-form-section-title">Budget Type</h6>
          <p className="uom-form-section-sub">
            Choose whether this budget is tied to one department or shared
            across operations.
          </p>
          <Row className="mb-4">
            <Col md={6}>
              <div
                className={`im-checkbox-row ${v.budgetType === "department" ? "border-primary" : ""}`}
                style={{
                  border: "1px solid #e4e7ec",
                  borderRadius: 8,
                  padding: 12,
                  cursor: "pointer",
                }}
                onClick={() =>
                  validation.setFieldValue("budgetType", "department")
                }
              >
                <input
                  type="radio"
                  checked={v.budgetType === "department"}
                  readOnly
                />
                <div>
                  <div className="fw-semibold small">Department Budget</div>
                  <div className="text-muted" style={{ fontSize: 11.5 }}>
    Allocated to one department of one center. Available in PR and PO
                    for that center's department only.
                  </div>
                </div>
              </div>
            </Col>
            <Col md={6}>
              <div
                className={`im-checkbox-row ${v.budgetType === "global" ? "border-primary" : ""}`}
                style={{
                  border: "1px solid #e4e7ec",
                  borderRadius: 8,
                  padding: 12,
                  cursor: "pointer",
                }}
                onClick={() => validation.setFieldValue("budgetType", "global")}
              >
                <input
                  type="radio"
                  checked={v.budgetType === "global"}
                  readOnly
                />
                <div>
                  <div className="fw-semibold small">Global Budget</div>
                  <div className="text-muted" style={{ fontSize: 11.5 }}>
                    Organization-wide pool usable in procurement and operations
                    by any department once approved.
                  </div>
                </div>
              </div>
            </Col>
          </Row>

          <h6 className="uom-form-section-title mt-2">Primary Information</h6>
          <p className="uom-form-section-sub">
            Fiscal period and organizational assignment.
          </p>
          <Row>
            <Col md={4} className="mb-4">
              <Label>
                Fiscal Year <span className="text-danger">*</span>
              </Label>
              <Input
                type="select"
                value={v.fiscalYear}
                onChange={(e) =>
                  validation.setFieldValue("fiscalYear", e.target.value)
                }
                onBlur={validation.handleBlur}
                invalid={
                  validation.touched.fiscalYear &&
                  !!validation.errors.fiscalYear
                }
              >
                <option value="">Select Fiscal Year</option>
                <option value={CURRENT_FISCAL_YEAR}>
                  {CURRENT_FISCAL_YEAR}
                </option>
              </Input>
              <FormFeedback>{validation.errors.fiscalYear}</FormFeedback>
            </Col>

            {v.budgetType === "department" && (
              <Col md={4} className="mb-4">
                <Label>
                  Center <span className="text-danger">*</span>
                </Label>
                <Input
                  type="select"
                  value={v.centerId}
                  onChange={(e) =>
                    validation.setFieldValue("centerId", e.target.value)
                  }
                  onBlur={validation.handleBlur}
                  invalid={
                    validation.touched.centerId && !!validation.errors.centerId
                  }
                >
                  <option value="">Select Center</option>
                  {centers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title}
                    </option>
                  ))}
                </Input>
                <FormFeedback>{validation.errors.centerId}</FormFeedback>
              </Col>
            )}

            {v.budgetType === "department" && (
              <Col md={4} className="mb-4">
                <Label>
                  Department <span className="text-danger">*</span>
                </Label>
                <Input
                  type="select"
                  value={v.departmentId}
                  onChange={(e) =>
                    validation.setFieldValue("departmentId", e.target.value)
                  }
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
            )}

            <Col md={4} className="mb-4" style={{ position: "relative" }}>
              <Label>
                Department Budget Head <span className="text-danger">*</span>
              </Label>
              <Input
                placeholder="Search user by name..."
                value={showUserDropdown ? userSearch : selectedUserLabel}
                onFocus={() => {
                  setShowUserDropdown(true);
                  setUserSearch("");
                }}
                onChange={(e) => setUserSearch(e.target.value)}
                onBlur={() => setTimeout(() => setShowUserDropdown(false), 150)}
                invalid={
                  validation.touched.departmentBudgetHeadId &&
                  !!validation.errors.departmentBudgetHeadId
                }
              />
              <FormFeedback>
                {validation.errors.departmentBudgetHeadId}
              </FormFeedback>
              {showUserDropdown && userOptions.length > 0 && (
                <div
                  className="uom-table-card"
                  style={{
                    position: "absolute",
                    zIndex: 20,
                    width: "100%",
                    maxHeight: 200,
                    overflowY: "auto",
                    marginTop: 2,
                  }}
                >
                  {userOptions.map((u) => (
                    <div
                      key={u._id}
                      style={{ padding: "8px 12px", cursor: "pointer" }}
                      className="uom-cell-primary"
                      onMouseDown={() => selectUser(u)}
                    >
                      {u.name}{" "}
                      <span className="uom-cell-muted" style={{ fontSize: 12 }}>
                        ({u.email})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Col>
          </Row>

          <h6 className="uom-form-section-title mt-2">Financial Details</h6>
          <p className="uom-form-section-sub">
            Currency and budget amounts for this fiscal period.
          </p>
          <Row>
            <Col md={4} className="mb-4">
              <Label>Currency</Label>
              <Input
                type="select"
                value={v.currency}
                onChange={(e) =>
                  validation.setFieldValue("currency", e.target.value)
                }
              >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </Input>
            </Col>
            <Col md={4} className="mb-4">
              <Label>
                Requested Amount <span className="text-danger">*</span>
              </Label>
              <Input
                type="number"
                min={0}
                value={v.requestedAmount}
                onFocus={(e) => e.target.select()}
                onChange={(e) =>
                  validation.setFieldValue("requestedAmount", e.target.value)
                }
                invalid={
                  validation.touched.requestedAmount &&
                  !!validation.errors.requestedAmount
                }
              />
              <FormFeedback>{validation.errors.requestedAmount}</FormFeedback>
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

          <div
            className="uom-empty-state"
            style={{ background: "#f8f9fb", padding: 12, borderRadius: 8 }}
          >
            <p className="text-muted mb-0" style={{ fontSize: 13 }}>
              Saved as Draft. Submit for review after creation; an approver can
              sanction the budget before it appears in procurement.
            </p>
          </div>

          <div className="uom-form-footer d-flex justify-content-end gap-2 mt-4">
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
                  : "Create Budget"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BudgetForm;
