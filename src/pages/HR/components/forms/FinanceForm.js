import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Button, Row, Col, Label, Input, Spinner } from "reactstrap";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import { toast } from "react-toastify";
import PropTypes from "prop-types";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import {
  editFinance,
  changeSalary,
} from "../../../../helpers/backend_helper";
import { getExitEmployeesBySearch } from "../../../../store/features/HR/hrSlice";
import {
  accountOptions,
  employeeGroupOptions,
  paymentTypeOptions,
  isSimplifiedFinanceType,
  isConsultantFinanceType,
  isPfApplicable,
  ULTRA_SIMPLIFIED_FINANCE_COMPANY_IDS,
} from "../../../../Components/constants/HR";
import {
  calculatePayroll,
  resolveLWFState,
  lwfAnnual,
  lwfPerMonth,
  applyAnnualLWF,
  lwfScheduleText,
} from "../../../../utils/calculatePayroll";
import {
  annualToMonthly,
  annualFieldValue,
  annualBreakupGross,
} from "../../../../utils/salaryUnit";

const changeTypeOptions = [
  { value: "INCREMENT", label: "Increment" },
  { value: "PROMOTION", label: "Promotion" },
  { value: "CORRECTION", label: "Correction" },
  { value: "JOINING", label: "Joining" },
];

const salaryBreakupFields = [
  "basicAmount",
  "HRAAmount",
  "SPLAllowance",
  "conveyanceAllowance",
  "statutoryBonus",
];

const getNumericValue = (value) => Number(value || 0);

const getSalaryBreakupTotal = (values) =>
  salaryBreakupFields.reduce(
    (total, fieldName) => total + getNumericValue(values[fieldName]),
    0
  );

const buildNumberSchema = (label, { max } = {}) => {
  let schema = Yup.number()
    .transform((value, originalValue) =>
      originalValue === "" || originalValue === null ? 0 : value
    )
    .typeError(`${label} must be a valid number`)
    .min(0, `${label} must be 0 or more`);

  if (typeof max === "number") {
    schema = schema.max(max, `${label} cannot be more than ${max}`);
  }

  return schema.required(`${label} is required`);
};

const buildGrossBoundSchema = (label) =>
  buildNumberSchema(label)
    .test(
      "within-gross-salary",
      `${label} cannot be greater than Gross Salary`,
      function (value) {
        const grossSalary = getNumericValue(this.parent.grossSalary);
        const fieldValue = getNumericValue(value);

        if (!grossSalary || !fieldValue) return true;
        return fieldValue <= grossSalary;
      }
    )
    .test(
      "breakup-total-within-gross",
      "Salary breakup total cannot be greater than Gross Salary",
      function () {
        const grossSalary = getNumericValue(this.parent.grossSalary);
        const breakupTotal = getSalaryBreakupTotal(this.parent);

        if (!grossSalary || !breakupTotal) return true;
        return breakupTotal <= grossSalary;
      }
    );

const getFinanceInitialValues = (initialData) => ({
  employeeId: "",
  changeType: initialData?.changeType || "",
  note: initialData?.note || "",
  employeeGroups: initialData?.financeDetails?.employeeGroups || "",
  account: initialData?.financeDetails?.account || "",
  // Amount fields are entered/displayed YEARLY (read the persisted yearly
  // snapshot, falling back to monthly × 12 for records saved before yearly entry).
  grossSalary: annualBreakupGross(initialData?.financeDetails),
  basicAmount: annualFieldValue(initialData?.financeDetails, "basicAmount"),
  HRAAmount: annualFieldValue(initialData?.financeDetails, "HRAAmount"),
  SPLAllowance: annualFieldValue(initialData?.financeDetails, "SPLAllowance"),
  conveyanceAllowance: annualFieldValue(
    initialData?.financeDetails,
    "conveyanceAllowance"
  ),
  statutoryBonus: annualFieldValue(initialData?.financeDetails, "statutoryBonus"),
  // Minimum wages is a MONTHLY statutory floor (not converted).
  minimumWages: initialData?.financeDetails?.minimumWages || 0,
  ESICSalary: initialData?.financeDetails?.ESICSalary || 0,
  LWFEmployee: annualFieldValue(initialData?.financeDetails, "LWFEmployee"),
  LWFEmployer: annualFieldValue(initialData?.financeDetails, "LWFEmployer"),
  insurance: annualFieldValue(initialData?.financeDetails, "insurance"),
  // variable & reimbursement are pure yearly CTC add-ons — stored as-is, not split.
  variable: initialData?.financeDetails?.annual?.variable ?? initialData?.financeDetails?.variable ?? 0,
  reimbursement: initialData?.financeDetails?.annual?.reimbursement ?? initialData?.financeDetails?.reimbursement ?? 0,
  TDSRate: initialData?.financeDetails?.TDSRate || 0,
  debitStatementNarration:
    initialData?.financeDetails?.debitStatementNarration || "",
  basicPercentage: initialData?.financeDetails?.basicPercentage || 0,
  HRAPercentage: initialData?.financeDetails?.HRAPercentage || 0,
  shortWages: initialData?.financeDetails?.shortWages || 0,
  PFEmployee: initialData?.financeDetails?.PFEmployee || 0,
  PFEmployer: initialData?.financeDetails?.PFEmployer || 0,
  PFAmount: initialData?.financeDetails?.PFAmount || 0,
  PFSalary: initialData?.financeDetails?.PFSalary || 0,
  PT: initialData?.financeDetails?.PT || 0,
  ESICEmployee: initialData?.financeDetails?.ESICEmployee || 0,
  ESICEmployer: initialData?.financeDetails?.ESICEmployer || 0,
  inHandSalary: initialData?.financeDetails?.inHandSalary || 0,
  gratuity: initialData?.financeDetails?.gratuity || 0,
  totalCostToCompany: initialData?.financeDetails?.totalCostToCompany || 0,

  // Simplified finance (contractual/consultant/intern/apprentice/consultant-session)
  paymentType: initialData?.financeDetails?.paymentType || "MONTHLY",
  // PER_SESSION stores a flat rate (no annual snapshot) — read it verbatim;
  // otherwise read the yearly figure (annual snapshot, else monthly × 12).
  annualInHandSalary:
    initialData?.financeDetails?.paymentType === "PER_SESSION"
      ? initialData?.financeDetails?.inHandSalary || 0
      : annualFieldValue(initialData?.financeDetails, "inHandSalary"),
  annualCTC:
    initialData?.financeDetails?.paymentType === "PER_SESSION"
      ? initialData?.financeDetails?.totalCostToCompany || 0
      : annualFieldValue(initialData?.financeDetails, "totalCostToCompany"),
  annualInsurance:
    initialData?.financeDetails?.paymentType === "PER_SESSION"
      ? initialData?.financeDetails?.insurance || 0
      : annualFieldValue(initialData?.financeDetails, "insurance"),
});

const validationSchema = (isEdit, step, simplified, consultant, ultraSimplifiedFinance) => {
  if (step === 1 && !isEdit) {
    return Yup.object().shape({
      employeeId: Yup.string().required("Employee is required"),
      changeType: Yup.string().required("Salary change type is required"),
      note: Yup.string().optional(),
    });
  }

  if (simplified) {
    return Yup.object().shape({
      changeType: Yup.string().optional(),
      note: Yup.string().optional(),
      paymentType: ultraSimplifiedFinance
        ? Yup.string().notRequired()
        : Yup.string().required("Payment Type is required"),
      // Consultants carry a TDS rate; In Hand is derived (CTC − TDS). Ultra-
      // simplified-finance companies never deduct TDS, regardless of type.
      TDSRate:
        consultant && !ultraSimplifiedFinance
          ? buildNumberSchema("TDS Rate", { max: 100 })
          : Yup.number().notRequired(),
      annualInHandSalary: buildNumberSchema("In Hand Salary").test(
        "inhand-not-above-ctc",
        "In Hand Salary cannot be greater than Annual CTC",
        function (value) {
          const { annualCTC } = this.parent;
          if (value == null || annualCTC == null || annualCTC === "")
            return true;
          return Number(value) <= Number(annualCTC);
        }
      ),
      annualCTC: buildNumberSchema("Annual CTC"),
      annualInsurance: ultraSimplifiedFinance
        ? Yup.number().notRequired()
        : buildNumberSchema("Insurance"),
    });
  }

  return Yup.object().shape({
    changeType: Yup.string().optional(),
    note: Yup.string().optional(),
    employeeGroups: Yup.string().required("Employee Group is required"),
    account: Yup.string().notRequired(),
    minimumWages: buildNumberSchema("Minimum Wages"),
    grossSalary: Yup.number()
      .transform((value, originalValue) =>
        originalValue === "" || originalValue === null ? undefined : value
      )
      .typeError("Gross Salary must be a valid number")
      .min(0, "Gross Salary must be 0 or more")
      .required("Gross Salary is required")
      .test(
        "gross-breakup-exact-match",
        "Basic + HRA + SPL + Conveyance + Statutory Bonus must be exactly equal to Gross Salary",
        function (gross) {
          const breakupTotal = getSalaryBreakupTotal(this.parent);

          if (gross === undefined || gross === null) return true;
          return getNumericValue(gross) === breakupTotal;
        }
      ),
    basicAmount: buildGrossBoundSchema("Basic Amount"),
    HRAAmount: buildGrossBoundSchema("HRA"),
    SPLAllowance: buildGrossBoundSchema("SPL Allowance"),
    conveyanceAllowance: buildGrossBoundSchema("Conveyance Allowance"),
    statutoryBonus: buildGrossBoundSchema("Statutory Bonus"),
    insurance: buildNumberSchema("Insurance"),
    variable: buildNumberSchema("Variable"),
    reimbursement: buildNumberSchema("Reimbursement"),
    TDSRate: buildNumberSchema("TDS Rate", { max: 100 }),
    ESICSalary: buildNumberSchema("ESIC Salary"),
    LWFEmployee: buildNumberSchema("LWF Employee"),
    LWFEmployer: buildNumberSchema("LWF Employer"),
    debitStatementNarration: Yup.string().notRequired(),
  });
};

const FinanceForm = ({ initialData, onSuccess, onCancel, mode }) => {
  const dispatch = useDispatch();
  const handleAuthError = useAuthError();
  const { centerAccess } = useSelector((state) => state.User);

  const isEdit = mode === "EDIT";
  const [step, setStep] = useState(isEdit ? 2 : 1);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const employeeForType = isEdit ? initialData?.employee : selectedEmployee?.raw;
  const consultant = isConsultantFinanceType(employeeForType?.employmentType);
  const ultraSimplifiedFinance = ULTRA_SIMPLIFIED_FINANCE_COMPANY_IDS.includes(
    employeeForType?.company,
  );
  const simplified =
    isSimplifiedFinanceType(employeeForType?.employmentType) ||
    ultraSimplifiedFinance;

  const form = useFormik({
    enableReinitialize: true,
    validateOnMount: true,
    initialValues: getFinanceInitialValues(isEdit ? initialData : null),
    validationSchema: validationSchema(isEdit, step, simplified, consultant, ultraSimplifiedFinance),
    onSubmit: async (values) => {
      if (step === 1 && !isEdit) {
        setStep(2);
        return;
      }

      try {
        if (simplified) {
          const simplifiedPayload = {
            financeMode: "SIMPLIFIED",
            paymentType: values.paymentType || "MONTHLY",
            inHandSalary: Number(values.annualInHandSalary) || 0,
            totalCostToCompany: Number(values.annualCTC) || 0,
            // Ultra-simplified-finance companies never deduct insurance.
            insurance: ultraSimplifiedFinance
              ? 0
              : Number(values.annualInsurance) || 0,
            salaryUnit: "ANNUAL",
          };

          // Consultants carry a TDS rate — the server deducts it from CTC to
          // derive the stored In Hand Salary. Ultra-simplified-finance
          // companies never deduct TDS, regardless of employmentType.
          if (consultant && !ultraSimplifiedFinance) {
            simplifiedPayload.TDSRate = Number(values.TDSRate) || 0;
          }

          if (isEdit) {
            if (values.changeType) simplifiedPayload.changeType = values.changeType;
            if (values.note) simplifiedPayload.note = values.note;
            await editFinance(initialData._id, simplifiedPayload);
            toast.success("Finance details updated successfully");
          } else {
            simplifiedPayload.employeeId = values.employeeId;
            simplifiedPayload.changeType = values.changeType;
            if (values.note) simplifiedPayload.note = values.note;
            await changeSalary(simplifiedPayload);
            toast.success("Salary changed successfully");
          }

          onSuccess?.();
          return;
        }

        const payload = {
          financeMode: "FULL",
          employeeGroups: values.employeeGroups || "",
          account: values.account || "",
          grossSalary: Number(values.grossSalary),
          basicAmount: Number(values.basicAmount),
          HRAAmount: Number(values.HRAAmount),
          SPLAllowance: Number(values.SPLAllowance),
          conveyanceAllowance: Number(values.conveyanceAllowance),
          statutoryBonus: Number(values.statutoryBonus),
          minimumWages: Number(values.minimumWages),
          ESICSalary: Number(values.ESICSalary),
          LWFEmployee: Number(values.LWFEmployee),
          LWFEmployer: Number(values.LWFEmployer),
          insurance: Number(values.insurance),
          variable: Number(values.variable),
          reimbursement: Number(values.reimbursement),
          TDSRate: Number(values.TDSRate),
          debitStatementNarration: values.debitStatementNarration || "",
          // Amount fields above are yearly; the server splits them into monthly.
          salaryUnit: "ANNUAL",
        };

        if (isEdit) {
          if (values.changeType) payload.changeType = values.changeType;
          if (values.note) payload.note = values.note;
          await editFinance(initialData._id, payload);
          toast.success("Finance details updated successfully");
        } else {
          payload.employeeId = values.employeeId;
          payload.changeType = values.changeType;
          if (values.note) payload.note = values.note;
          await changeSalary(payload);
          toast.success("Salary changed successfully");
        }

        onSuccess?.();
      } catch (error) {
        if (!handleAuthError(error)) {
          toast.error(error?.message || "Failed to save finance details");
        }
      }
    },
  });

  const employeeData = useMemo(
    () => (isEdit ? initialData?.employee : selectedEmployee?.raw),
    [initialData, isEdit, selectedEmployee]
  );

  // PER_SESSION amounts are flat per-session rates — not yearly — so we drop the
  // "(Yearly)" label and the monthly (÷12) preview for them.
  const perSession = simplified && form.values.paymentType === "PER_SESSION";

  // Consultants: TDS is deducted from CTC and In Hand becomes CTC − TDS
  // (auto-computed, read-only).
  const consultantTdsAmount = Math.round(
    ((Number(form.values.annualCTC) || 0) *
      (Number(form.values.TDSRate) || 0)) /
      100
  );

  // In Hand is always derived, never typed: CTC − TDS − Insurance. TDS only
  // applies to consultants (consultantTdsAmount is 0 for every other simplified
  // type), so this single formula covers both cases.
  useEffect(() => {
    const insurance = ultraSimplifiedFinance
      ? 0
      : Number(form.values.annualInsurance) || 0;
    const inHand = Math.max(
      0,
      (Number(form.values.annualCTC) || 0) -
        (ultraSimplifiedFinance ? 0 : consultantTdsAmount) -
        insurance
    );
    if (Number(form.values.annualInHandSalary) !== inHand) {
      form.setFieldValue("annualInHandSalary", inHand, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ultraSimplifiedFinance, consultantTdsAmount, form.values.annualCTC, form.values.annualInsurance]);

  const payrollInitializedRef = useRef(false);

  useEffect(() => {
    if (simplified) return;
    const payroll = calculatePayroll({
      ...form.values,
      ...annualToMonthly(form.values),
      pfApplicable: isPfApplicable(employeeData),
      gender: employeeData?.gender || "",
      joinningDate: employeeData?.joinningDate || "",
      currentLocation:
        employeeData?.costCenter ||
        employeeData?.center ||
        employeeData?.currentLocation ||
        null,
    });

    const isFirstRunInEdit = isEdit && !payrollInitializedRef.current;
    payrollInitializedRef.current = true;

    Object.entries(payroll).forEach(([key, value]) => {
      if (isFirstRunInEdit && form.values[key]) return;
      if (form.values[key] !== value) {
        form.setFieldValue(key, value, false);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    employeeData,
    form,
    form.values.ESICSalary,
    form.values.HRAAmount,
    form.values.LWFEmployee,
    form.values.SPLAllowance,
    form.values.basicAmount,
    form.values.conveyanceAllowance,
    form.values.grossSalary,
    form.values.insurance,
    form.values.variable,
    form.values.reimbursement,
    form.values.minimumWages,
    form.values.TDSRate,
    simplified,
  ]);

  // Gross is the sum of the breakup components (read-only). Keep it in sync as
  // HR edits the components so it can never drift from the breakup total.
  useEffect(() => {
    if (simplified) return;
    const total = getSalaryBreakupTotal(form.values);
    if (getNumericValue(form.values.grossSalary) !== total) {
      form.setFieldValue("grossSalary", total, false);
    }
  }, [
    form,
    form.values.basicAmount,
    form.values.HRAAmount,
    form.values.SPLAllowance,
    form.values.conveyanceAllowance,
    form.values.statutoryBonus,
    simplified,
  ]);

  // LWF is derived from the employee's work-location state + monthly wage base,
  // never entered by hand. The yearly figure is the TRUE annual (sum of the
  // applicable months), not a monthly amount × 12.
  const lwfState = useMemo(
    () =>
      resolveLWFState(
        employeeData?.costCenter ||
          employeeData?.center ||
          employeeData?.currentLocation
      ),
    [employeeData]
  );

  useEffect(() => {
    if (simplified) return;
    const monthlyGross = annualToMonthly(form.values).grossSalary;
    const annual = lwfAnnual(lwfState, monthlyGross);

    if (Number(form.values.LWFEmployee) !== annual.employee)
      form.setFieldValue("LWFEmployee", annual.employee, false);
    if (Number(form.values.LWFEmployer) !== annual.employer)
      form.setFieldValue("LWFEmployer", annual.employer, false);
  }, [
    form,
    lwfState,
    form.values.basicAmount,
    form.values.HRAAmount,
    form.values.SPLAllowance,
    form.values.conveyanceAllowance,
    form.values.statutoryBonus,
    simplified,
  ]);

  const loadEmployeeOptions = (inputValue) => {
    if (!inputValue) return Promise.resolve([]);

    return dispatch(
      getExitEmployeesBySearch({
        query: inputValue,
        centers: centerAccess,
        view: "FINANCE",
      })
    )
      .unwrap()
      .then((response) =>
        (response?.data || []).map((emp) => ({
          value: emp._id,
          label: `${emp.name} (${emp.eCode || "N/A"})`,
          raw: emp,
        }))
      )
      .catch(() => []);
  };

  const selectedChangeTypeOption =
    changeTypeOptions.find((opt) => opt.value === form.values.changeType) || null;

  const errorText = (fieldName) => {
    if (form.touched[fieldName] && form.errors[fieldName]) {
      return <div className="text-danger small mt-1">{form.errors[fieldName]}</div>;
    }

    return null;
  };

  // Monthly equivalents of the yearly INPUT fields, shown under each amount field.
  const monthlyView = annualToMonthly(form.values);
  const monthlyHint = (fieldName) => (
    <div className="text-muted small mt-1">
      Monthly ≈ ₹{(monthlyView[fieldName] || 0).toLocaleString("en-IN")}
    </div>
  );

  // Calculated (disabled) fields hold MONTHLY values; show them yearly (× 12)
  // in the box with the monthly figure underneath, to match the input fields.
  const yearlyValue = (fieldName) =>
    Math.round(Number(form.values[fieldName]) || 0) * 12;
  const monthlyHintFrom = (fieldName) => (
    <div className="text-muted small mt-1">
      Monthly ≈ ₹{(Math.round(Number(form.values[fieldName]) || 0)).toLocaleString("en-IN")}
    </div>
  );

  // Professional Tax uses flat state-wise slabs, so the yearly total is monthly
  // PT × 12 for every state — calculatePayroll supplies this via PTAnnual.
  const ptMonthly = Math.round(Number(form.values.PT) || 0);
  const ptYearly = form.values.PTAnnual !== undefined
    ? Math.round(Number(form.values.PTAnnual) || 0)
    : ptMonthly * 12;

  // Mirror the server: annual deductions swap the monthly PT × 12 for the exact
  // PT annual.
  let deductionsYearly =
    (Math.round(Number(form.values.deductions) || 0) - ptMonthly) * 12 + ptYearly;

  let ctcYearly =
    yearlyValue("totalCostToCompany") +
    Number(form.values.variable || 0) +
    Number(form.values.reimbursement || 0);

  // LWF is charged only in specific months, so its true yearly total is NOT the
  // monthly charge × 12. Mirror the server's applyAnnualLWF so the yearly In-Hand
  // / Deductions / CTC boxes match the persisted `annual` block (lumpy-LWF states
  // like Tamil Nadu / Maharashtra / Gujarat / Karnataka).
  const lwfMonthlyGross = annualToMonthly(form.values).grossSalary;
  const lwfMonthly = lwfPerMonth(lwfState, lwfMonthlyGross);
  const lwfYearly = lwfAnnual(lwfState, lwfMonthlyGross);
  const annualRollup = {
    deductions: deductionsYearly,
    inHandSalary: yearlyValue("inHandSalary"),
    totalCostToCompany: ctcYearly,
  };
  applyAnnualLWF(annualRollup, lwfMonthly, lwfYearly);
  deductionsYearly = annualRollup.deductions;
  ctcYearly = annualRollup.totalCostToCompany;
  const inHandYearly = annualRollup.inHandSalary;

  const markGrossBreakupFieldsTouched = (changedFieldName) => {
    form.setFieldTouched("grossSalary", true, false);

    salaryBreakupFields.forEach((fieldName) => {
      if (
        fieldName === changedFieldName ||
        getNumericValue(form.values[fieldName]) > 0
      ) {
        form.setFieldTouched(fieldName, true, false);
      }
    });
  };

  const handleNumericFieldChange = (event) => {
    const { name, value } = event.target;

    form.setFieldValue(name, value);
    form.setFieldTouched(name, true, false);

    if (salaryBreakupFields.includes(name) || name === "grossSalary") {
      markGrossBreakupFieldsTouched(name);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const submitDisabled =
    form.isSubmitting || !form.isValid || (isEdit && !initialData?._id);

  if (step === 1 && !isEdit) {
    return (
      <div>
        <Row className="g-3 mx-2">
          <Col md={12}>
            <Label htmlFor="employeeSearch">
              Search Employee <span className="text-danger">*</span>
            </Label>
            <AsyncSelect
              inputId="employeeSearch"
              placeholder="Search by name or eCode..."
              loadOptions={loadEmployeeOptions}
              defaultOptions
              value={selectedEmployee}
              onChange={(opt) => {
                setSelectedEmployee(opt);
                form.setFieldValue("employeeId", opt ? opt.value : "");
              }}
              onBlur={() => form.setFieldTouched("employeeId", true)}
              isClearable
            />
            {errorText("employeeId")}
          </Col>

          {selectedEmployee && (
            <Col md={12}>
              <div className="p-3 border rounded bg-light">
                <Row className="g-2">
                  <Col md={4}>
                    <strong>Name:</strong> {selectedEmployee.raw?.name || "-"}
                  </Col>
                  <Col md={4}>
                    <strong>ECode:</strong> {selectedEmployee.raw?.eCode || "-"}
                  </Col>
                  <Col md={4}>
                    <strong>Current Location:</strong>{" "}
                    {selectedEmployee.raw?.currentLocation || "-"}
                  </Col>
                  <Col md={4}>
                    <strong>Cost Center:</strong>{" "}
                    {selectedEmployee.raw?.costCenter?.title || "-"}
                  </Col>
                  <Col md={4}>
                    <strong>PF Applicable:</strong>{" "}
                    {selectedEmployee.raw?.pfApplicable ? "Yes" : "No"}
                  </Col>
                  <Col md={4}>
                    <strong>Gender:</strong>{" "}
                    {selectedEmployee.raw?.gender || "-"}
                  </Col>
                  <Col md={4}>
                    <strong>Joining Date:</strong>{" "}
                    {selectedEmployee.raw?.joinningDate
                      ? new Date(
                          selectedEmployee.raw.joinningDate
                        ).toLocaleDateString("en-IN")
                      : "-"}
                  </Col>
                </Row>
              </div>
            </Col>
          )}

          <Col md={12}>
            <Label htmlFor="changeType">
              Salary Change Type <span className="text-danger">*</span>
            </Label>
            <Select
              inputId="changeType"
              options={changeTypeOptions}
              value={selectedChangeTypeOption}
              onChange={(opt) =>
                form.setFieldValue("changeType", opt ? opt.value : "")
              }
              onBlur={() => form.setFieldTouched("changeType", true)}
              placeholder="Select change type..."
              isClearable
            />
            {errorText("changeType")}
          </Col>

          <Col md={12}>
            <Label htmlFor="note">Note</Label>
            <textarea
              id="note"
              name="note"
              className="form-control"
              rows={3}
              value={form.values.note}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              placeholder="Optional note..."
            />
          </Col>
        </Row>

        <div className="d-flex gap-2 justify-content-end my-4 mx-3">
          <Button color="secondary" className="text-white" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            color="primary"
            className="text-white"
            onClick={form.handleSubmit}
            disabled={form.isSubmitting || !form.isValid}
          >
            Next
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {!isEdit && (
        <div className="mx-3 mb-3 p-3 border rounded bg-light">
          <Row className="g-2">
            <Col md={4}>
              <strong>Employee:</strong> {selectedEmployee?.label}
            </Col>
            <Col md={4}>
              <strong>Current Location:</strong>{" "}
              {selectedEmployee?.raw?.currentLocation || "-"}
            </Col>
            <Col md={4}>
              <strong>Cost Center:</strong>{" "}
              {selectedEmployee?.raw?.costCenter?.title || "-"}
            </Col>
            <Col md={4}>
              <strong>PF Applicable:</strong>{" "}
              {selectedEmployee?.raw?.pfApplicable ? "Yes" : "No"}
            </Col>
            <Col md={4}>
              <strong>Gender:</strong> {selectedEmployee?.raw?.gender || "-"}
            </Col>
            <Col md={4}>
              <strong>Joining Date:</strong>{" "}
              {selectedEmployee?.raw?.joinningDate
                ? new Date(selectedEmployee.raw.joinningDate).toLocaleDateString(
                    "en-IN"
                  )
                : "-"}
            </Col>
            <Col md={4}>
              <strong>Change Type:</strong> {selectedChangeTypeOption?.label}
            </Col>
            {form.values.note && (
              <Col md={4}>
                <strong>Note:</strong> {form.values.note}
              </Col>
            )}
          </Row>
        </div>
      )}

      {isEdit && (
        <>
          <div className="mx-3 mb-3 p-3 border rounded bg-light">
            <Row className="g-2">
              <Col md={4}>
                <strong>Employee:</strong>{" "}
                {initialData?.employee?.name || "-"} (
                {initialData?.employee?.eCode || "-"})
              </Col>
              <Col md={4}>
                <strong>Department:</strong>{" "}
                {initialData?.employee?.department || "-"}
              </Col>
              <Col md={4}>
                <strong>Current Location:</strong>{" "}
                {initialData?.employee?.center?.title || "-"}
              </Col>
              <Col md={4}>
                <strong>Cost Center:</strong>{" "}
                {initialData?.employee?.costCenter?.title || "-"}
              </Col>
              <Col md={4}>
                <strong>PF Applicable:</strong>{" "}
                {initialData?.employee?.pfApplicable ? "Yes" : "No"}
              </Col>
              <Col md={4}>
                <strong>Gender:</strong> {initialData?.employee?.gender || "-"}
              </Col>
              <Col md={4}>
                <strong>Joining Date:</strong>{" "}
                {initialData?.employee?.joinningDate
                  ? new Date(
                      initialData.employee.joinningDate
                    ).toLocaleDateString("en-IN")
                  : "-"}
              </Col>
            </Row>
          </div>

          <Row className="g-3 mx-2 mb-3">
            <Col md={12}>
              <Label htmlFor="editChangeType">Change Type</Label>
              <Select
                inputId="editChangeType"
                options={changeTypeOptions}
                value={selectedChangeTypeOption}
                onChange={(opt) =>
                  form.setFieldValue("changeType", opt ? opt.value : "")
                }
                placeholder="Select change type (optional)..."
                isClearable
                isDisabled
              />
            </Col>
            <Col md={12}>
              <Label htmlFor="editNote">Note</Label>
              <textarea
                id="editNote"
                name="note"
                className="form-control"
                rows={3}
                value={form.values.note}
                onChange={form.handleChange}
                placeholder="Optional note..."
              />
            </Col>
          </Row>
        </>
      )}

      <Col xs={12} className="mt-2 mx-3">
        <h5 className="fw-semibold mb-1">Finance Details</h5>
        <hr className="mt-0" />
      </Col>

      <Row className="g-3 mx-2">
        {ultraSimplifiedFinance && (
          <>
            {/* ANNUAL CTC */}
            <Col md={6}>
              <Label htmlFor="annualCTC">
                Annual CTC <span className="text-danger">*</span>
              </Label>
              <Input
                id="annualCTC"
                name="annualCTC"
                type="number"
                min={0}
                value={form.values.annualCTC}
                onChange={handleNumericFieldChange}
                onBlur={form.handleBlur}
                invalid={form.touched.annualCTC && !!form.errors.annualCTC}
              />
              {errorText("annualCTC")}
              <div className="text-muted small mt-1">
                Monthly ≈ ₹
                {Math.round(
                  (Number(form.values.annualCTC) || 0) / 12,
                ).toLocaleString("en-IN")}
              </div>
            </Col>

            {/* IN HAND SALARY (= CTC, auto) */}
            <Col md={6}>
              <Label htmlFor="annualInHandSalary">
                In Hand Salary (Yearly) <span className="text-danger">*</span>
              </Label>
              <Input
                id="annualInHandSalary"
                name="annualInHandSalary"
                type="number"
                min={0}
                value={form.values.annualInHandSalary}
                disabled
                onChange={handleNumericFieldChange}
                onBlur={form.handleBlur}
                invalid={
                  form.touched.annualInHandSalary &&
                  !!form.errors.annualInHandSalary
                }
              />
              {errorText("annualInHandSalary")}
              <div className="text-muted small mt-1">
                Monthly ≈ ₹
                {Math.round(
                  (Number(form.values.annualInHandSalary) || 0) / 12,
                ).toLocaleString("en-IN")}
              </div>
              <div className="text-muted small">
                Auto-calculated as Annual CTC.
              </div>
            </Col>
          </>
        )}

        {!ultraSimplifiedFinance && simplified && (
          <>
            {/* ANNUAL CTC */}
            <Col md={6}>
              <Label htmlFor="annualCTC">
                {perSession ? "CTC (Per Session)" : "Annual CTC"}{" "}
                <span className="text-danger">*</span>
              </Label>
              <Input
                id="annualCTC"
                name="annualCTC"
                type="number"
                min={0}
                value={form.values.annualCTC}
                onChange={handleNumericFieldChange}
                onBlur={form.handleBlur}
                invalid={form.touched.annualCTC && !!form.errors.annualCTC}
              />
              {errorText("annualCTC")}
              {!perSession && (
                <div className="text-muted small mt-1">
                  Monthly ≈ ₹
                  {Math.round(
                    (Number(form.values.annualCTC) || 0) / 12,
                  ).toLocaleString("en-IN")}
                </div>
              )}
            </Col>

            {/* INSURANCE — all non-FTE types */}
            <Col md={6}>
              <Label htmlFor="annualInsurance">
                Insurance {perSession ? "(Per Session)" : "(Yearly)"}
              </Label>
              <Input
                id="annualInsurance"
                name="annualInsurance"
                type="number"
                min={0}
                value={form.values.annualInsurance}
                onChange={handleNumericFieldChange}
                onBlur={form.handleBlur}
                invalid={
                  form.touched.annualInsurance && !!form.errors.annualInsurance
                }
              />
              {errorText("annualInsurance")}
              {!perSession && (
                <div className="text-muted small mt-1">
                  Monthly ≈ ₹
                  {Math.round(
                    (Number(form.values.annualInsurance) || 0) / 12,
                  ).toLocaleString("en-IN")}
                </div>
              )}
            </Col>

            {/* TDS RATE — consultants only */}
            {consultant && (
              <Col md={6}>
                <Label htmlFor="TDSRate">
                  TDS Rate (%) <span className="text-danger">*</span>
                </Label>
                <Input
                  id="TDSRate"
                  name="TDSRate"
                  type="number"
                  min={0}
                  max={100}
                  value={form.values.TDSRate}
                  onChange={handleNumericFieldChange}
                  onBlur={form.handleBlur}
                  invalid={form.touched.TDSRate && !!form.errors.TDSRate}
                />
                {errorText("TDSRate")}
                <div className="text-muted small mt-1">
                  TDS {perSession ? "(Per Session)" : "(Yearly)"} ≈ ₹
                  {consultantTdsAmount.toLocaleString("en-IN")}
                  {!perSession && (
                    <>
                      {" "}
                      · Monthly ≈ ₹
                      {Math.round(consultantTdsAmount / 12).toLocaleString(
                        "en-IN"
                      )}
                    </>
                  )}
                </div>
              </Col>
            )}

            {/* IN HAND SALARY (Yearly entry, monthly preview) */}
            <Col md={6}>
              <Label htmlFor="annualInHandSalary">
                In Hand Salary {perSession ? "(Per Session)" : "(Yearly)"}{" "}
                <span className="text-danger">*</span>
              </Label>
              <Input
                id="annualInHandSalary"
                name="annualInHandSalary"
                type="number"
                min={0}
                value={form.values.annualInHandSalary}
                disabled
                onChange={handleNumericFieldChange}
                onBlur={form.handleBlur}
                invalid={
                  form.touched.annualInHandSalary &&
                  !!form.errors.annualInHandSalary
                }
              />
              {errorText("annualInHandSalary")}
            {!perSession && (
                <div className="text-muted small mt-1">
                  Monthly ≈ ₹
                  {Math.round(
                    (Number(form.values.annualInHandSalary) || 0) / 12,
                  ).toLocaleString("en-IN")}
                </div>
              )}
              <div className="text-muted small">
                Auto-calculated as Annual CTC{consultant ? " − TDS" : ""} −
                Insurance.
              </div>
            </Col>

            {/* PAYMENT TYPE */}
            <Col md={6}>
              <Label htmlFor="paymentType">
                Payment Type <span className="text-danger">*</span>
              </Label>
              <Select
                inputId="paymentType"
                options={paymentTypeOptions}
                value={
                  paymentTypeOptions.find(
                    (opt) => opt.value === form.values.paymentType,
                  ) || null
                }
                onChange={(opt) =>
                  form.setFieldValue("paymentType", opt ? opt.value : "")
                }
                onBlur={() => form.setFieldTouched("paymentType", true)}
              />
              {errorText("paymentType")}
            </Col>
          </>
        )}

        {!simplified && (
          <>
        <Col md={6}>
          <Label htmlFor="employeeGroups">Employee Group <span className="text-danger">*</span></Label>
          <Select
            inputId="employeeGroups"
            options={employeeGroupOptions}
            value={
              employeeGroupOptions.find(
                (opt) => opt.value === form.values.employeeGroups
              ) || null
            }
            onChange={(opt) =>
              form.setFieldValue("employeeGroups", opt ? opt.value : "")
            }
            onBlur={() => form.setFieldTouched("employeeGroups", true)}
          />
          {errorText("employeeGroups")}
        </Col>

        <Col md={6}>
          <Label htmlFor="account">Account</Label>
          <Select
            inputId="account"
            options={accountOptions}
            value={
              accountOptions.find((opt) => opt.value === form.values.account) ||
              null
            }
            onChange={(opt) =>
              form.setFieldValue("account", opt ? opt.value : "")
            }
            onBlur={() => form.setFieldTouched("account", true)}
          />
          {errorText("account")}
        </Col>

        <Col md={6}>
          <Label htmlFor="minimumWages">Minimum Wages (Monthly)</Label>
          <Input
            id="minimumWages"
            name="minimumWages"
            type="number"
            value={form.values.minimumWages}
            onChange={handleNumericFieldChange}
            onBlur={form.handleBlur}
            invalid={form.touched.minimumWages && !!form.errors.minimumWages}
          />
          {errorText("minimumWages")}
        </Col>

        <Col md={6}>
          <Label htmlFor="shortWages">Short Wages (Monthly)</Label>
          <Input
            disabled
            id="shortWages"
            name="shortWages"
            type="number"
            value={form.values.shortWages}
          />
        </Col>

        <Col md={6}>
          <Label htmlFor="grossSalary">Gross Salary (Yearly) <span className="text-danger">*</span></Label>
          <Input
            disabled
            id="grossSalary"
            name="grossSalary"
            type="number"
            value={form.values.grossSalary}
          />
          {errorText("grossSalary")}
          {monthlyHint("grossSalary")}
        </Col>

        <Col md={6}>
          <Label htmlFor="basicAmount">Basic Amount (Yearly) <span className="text-danger">*</span></Label>
          <Input
            id="basicAmount"
            name="basicAmount"
            type="number"
            value={form.values.basicAmount}
            onChange={handleNumericFieldChange}
            onBlur={form.handleBlur}
            invalid={form.touched.basicAmount && !!form.errors.basicAmount}
          />
          {errorText("basicAmount")}
          {monthlyHint("basicAmount")}
        </Col>

        <Col md={6}>
          <Label htmlFor="basicPercentage">Basic Percentage</Label>
          <Input
            disabled
            id="basicPercentage"
            name="basicPercentage"
            type="number"
            value={form.values.basicPercentage}
          />
        </Col>

        <Col md={6}>
          <Label htmlFor="HRAAmount">HRA (Yearly) <span className="text-danger">*</span></Label>
          <Input
            id="HRAAmount"
            name="HRAAmount"
            type="number"
            value={form.values.HRAAmount}
            onChange={handleNumericFieldChange}
            onBlur={form.handleBlur}
            invalid={form.touched.HRAAmount && !!form.errors.HRAAmount}
          />
          {errorText("HRAAmount")}
          {monthlyHint("HRAAmount")}
        </Col>

        <Col md={6}>
          <Label htmlFor="HRAPercentage">HRA Percentage</Label>
          <Input
            disabled
            id="HRAPercentage"
            name="HRAPercentage"
            type="number"
            value={form.values.HRAPercentage}
          />
        </Col>

        <Col md={6}>
          <Label htmlFor="SPLAllowance">SPL Allowance (Yearly) <span className="text-danger">*</span></Label>
          <Input
            id="SPLAllowance"
            name="SPLAllowance"
            type="number"
            value={form.values.SPLAllowance}
            onChange={handleNumericFieldChange}
            onBlur={form.handleBlur}
            invalid={form.touched.SPLAllowance && !!form.errors.SPLAllowance}
          />
          {errorText("SPLAllowance")}
          {monthlyHint("SPLAllowance")}
        </Col>

        <Col md={6}>
          <Label htmlFor="conveyanceAllowance">Conveyance Allowance (Yearly) <span className="text-danger">*</span></Label>
          <Input
            id="conveyanceAllowance"
            name="conveyanceAllowance"
            type="number"
            value={form.values.conveyanceAllowance}
            onChange={handleNumericFieldChange}
            onBlur={form.handleBlur}
            invalid={
              form.touched.conveyanceAllowance &&
              !!form.errors.conveyanceAllowance
            }
          />
          {errorText("conveyanceAllowance")}
          {monthlyHint("conveyanceAllowance")}
        </Col>

        <Col md={6}>
          <Label htmlFor="statutoryBonus">Statutory Bonus (Yearly) <span className="text-danger">*</span></Label>
          <Input
            id="statutoryBonus"
            name="statutoryBonus"
            type="number"
            value={form.values.statutoryBonus}
            onChange={handleNumericFieldChange}
            onBlur={form.handleBlur}
            invalid={form.touched.statutoryBonus && !!form.errors.statutoryBonus}
          />
          {errorText("statutoryBonus")}
          {monthlyHint("statutoryBonus")}
        </Col>

        <Col md={6}>
          <Label htmlFor="insurance">Insurance (Yearly)</Label>
          <Input
            id="insurance"
            name="insurance"
            type="number"
            value={form.values.insurance}
            onChange={handleNumericFieldChange}
            onBlur={form.handleBlur}
            invalid={form.touched.insurance && !!form.errors.insurance}
          />
          {errorText("insurance")}
          {monthlyHint("insurance")}
        </Col>

        <Col md={6}>
          <Label htmlFor="variable">Variable (Yearly)</Label>
          <Input
            id="variable"
            name="variable"
            type="number"
            value={form.values.variable}
            onChange={handleNumericFieldChange}
            onBlur={form.handleBlur}
            invalid={form.touched.variable && !!form.errors.variable}
          />
          {errorText("variable")}
          <div className="text-muted small mt-1">Added to yearly CTC</div>
        </Col>

        <Col md={6}>
          <Label htmlFor="reimbursement">Reimbursement (Yearly)</Label>
          <Input
            id="reimbursement"
            name="reimbursement"
            type="number"
            value={form.values.reimbursement}
            onChange={handleNumericFieldChange}
            onBlur={form.handleBlur}
            invalid={form.touched.reimbursement && !!form.errors.reimbursement}
          />
          {errorText("reimbursement")}
          <div className="text-muted small mt-1">Added to yearly CTC</div>
        </Col>

        <Col md={6}>
          <Label htmlFor="LWFEmployee">LWF Employee (Yearly)</Label>
          <Input
            id="LWFEmployee"
            name="LWFEmployee"
            type="number"
            value={form.values.LWFEmployee}
            readOnly
            disabled
          />
          <div className="text-muted small mt-1">
            {lwfScheduleText(lwfState)
              ? `Charged ${lwfScheduleText(lwfState)}`
              : "No LWF for this state"}
          </div>
        </Col>

        <Col md={6}>
          <Label htmlFor="LWFEmployer">LWF Employer (Yearly)</Label>
          <Input
            id="LWFEmployer"
            name="LWFEmployer"
            type="number"
            value={form.values.LWFEmployer}
            readOnly
            disabled
          />
          <div className="text-muted small mt-1">
            {lwfScheduleText(lwfState)
              ? `Charged ${lwfScheduleText(lwfState)}`
              : "No LWF for this state"}
          </div>
        </Col>

        <Col md={6}>
          <Label htmlFor="ESICSalary">ESIC Salary (Yearly)</Label>
          <Input
            disabled
            id="ESICSalary"
            name="ESICSalary"
            type="number"
            value={yearlyValue("ESICSalary")}
          />
          {monthlyHintFrom("ESICSalary")}
        </Col>

        <Col md={6}>
          <Label htmlFor="ESICEmployee">ESIC Employee (Yearly)</Label>
          <Input
            disabled
            id="ESICEmployee"
            type="number"
            value={yearlyValue("ESICEmployee")}
          />
          {monthlyHintFrom("ESICEmployee")}
        </Col>

        <Col md={6}>
          <Label htmlFor="ESICEmployer">ESIC Employer (Yearly)</Label>
          <Input
            disabled
            id="ESICEmployer"
            type="number"
            value={yearlyValue("ESICEmployer")}
          />
          {monthlyHintFrom("ESICEmployer")}
        </Col>

        <Col md={6}>
          <Label htmlFor="TDSRate">TDS Rate</Label>
          <Input
            id="TDSRate"
            name="TDSRate"
            type="number"
            value={form.values.TDSRate}
            onChange={handleNumericFieldChange}
            onBlur={form.handleBlur}
            invalid={form.touched.TDSRate && !!form.errors.TDSRate}
          />
          {errorText("TDSRate")}
        </Col>

        <Col md={6}>
          <Label htmlFor="PT">PT (Yearly)</Label>
          <Input disabled id="PT" type="number" value={ptYearly} />
          <div className="text-muted small mt-1">
            Monthly ≈ ₹{ptMonthly.toLocaleString("en-IN")}
          </div>
        </Col>

        <Col md={6}>
          <Label htmlFor="PFAmount">PF Amount (Yearly)</Label>
          <Input disabled id="PFAmount" type="number" value={yearlyValue("PFAmount")} />
          {monthlyHintFrom("PFAmount")}
        </Col>

        <Col md={6}>
          <Label htmlFor="PFEmployee">PF Employee Contribution (Yearly)</Label>
          <Input
            disabled
            id="PFEmployee"
            type="number"
            value={yearlyValue("PFEmployee")}
          />
          {monthlyHintFrom("PFEmployee")}
        </Col>

        <Col md={6}>
          <Label htmlFor="PFEmployer">PF Employer Contribution (Yearly)</Label>
          <Input
            disabled
            id="PFEmployer"
            type="number"
            value={yearlyValue("PFEmployer")}
          />
          {monthlyHintFrom("PFEmployer")}
        </Col>

        <Col md={6}>
          <Label htmlFor="deductions">Total Deductions (Yearly)</Label>
          <Input
            disabled
            id="deductions"
            type="number"
            value={deductionsYearly}
          />
          {monthlyHintFrom("deductions")}
        </Col>

        <Col md={6}>
          <Label htmlFor="inHandSalary">In Hand Salary (Yearly)</Label>
          <Input
            disabled
            id="inHandSalary"
            type="number"
            value={inHandYearly}
          />
          {monthlyHintFrom("inHandSalary")}
        </Col>

        <Col md={6}>
          <Label htmlFor="gratuity">Gratuity (Yearly)</Label>
          <Input
            disabled
            id="gratuity"
            type="number"
            value={yearlyValue("gratuity")}
          />
          {monthlyHintFrom("gratuity")}
        </Col>

        <Col md={6}>
          <Label htmlFor="totalCostToCompany">Total Cost To Company (Yearly)</Label>
          <Input
            disabled
            id="totalCostToCompany"
            type="number"
            value={ctcYearly}
          />
          {monthlyHintFrom("totalCostToCompany")}
        </Col>

        <Col md={6}>
          <Label htmlFor="debitStatementNarration">
            Debit Statement Narration
          </Label>
          <Input
            id="debitStatementNarration"
            name="debitStatementNarration"
            value={form.values.debitStatementNarration}
            onChange={(e) =>
              form.setFieldValue(
                "debitStatementNarration",
                e.target.value.toUpperCase()
              )
            }
            onBlur={form.handleBlur}
            invalid={form.touched.debitStatementNarration && !!form.errors.debitStatementNarration}
          />
          {errorText("debitStatementNarration")}
        </Col>
          </>
        )}
      </Row>

      <div className="d-flex gap-2 justify-content-end my-4 mx-3">
        {!isEdit && (
          <Button color="secondary" className="text-white" onClick={handleBack}>
            Back
          </Button>
        )}
        <Button
          color="secondary"
          className="text-white"
          onClick={onCancel}
          disabled={form.isSubmitting}
        >
          Cancel
        </Button>
        <Button
          color="primary"
          className="text-white"
          onClick={form.handleSubmit}
          disabled={submitDisabled}
        >
          {form.isSubmitting ? (
            <Spinner size="sm" />
          ) : isEdit ? (
            "Update Finance"
          ) : (
            "Save Salary"
          )}
        </Button>
      </div>
    </div>
  );
};

FinanceForm.propTypes = {
  initialData: PropTypes.object,
  onSuccess: PropTypes.func,
  onCancel: PropTypes.func,
  mode: PropTypes.oneOf(["EDIT", "CHANGE"]),
};

export default FinanceForm;
