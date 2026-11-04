import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Button,
  Row,
  Col,
  Label,
  Input,
  Spinner,
  TabContent,
  TabPane,
} from "reactstrap";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import AsyncSelect from "react-select/async";
import { toast } from "react-toastify";
import debounce from "lodash.debounce";
import PhoneInputWithCountrySelect, {
  isValidPhoneNumber,
} from "react-phone-number-input";
import PropTypes from "prop-types";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_blue.css";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { useFormDraft } from "../../../../hooks/useFormDraft";
import {
  createDepartment,
  editEmployee,
  getAllUsers,
  getCompanies,
  getDepartments,
  getEmployeeDocsConfiguration,
  getEmployeeDocumentsByEmployeeId,
  getEmployeeId,
  getPositions,
  postEmployee,
  updateEmployeeByKey,
  uploadFile,
} from "../../../../helpers/backend_helper";
import PreviewFile from "../../../../Components/Common/PreviewFile";
import {
  // addDesignation,
  fetchDesignations,
} from "../../../../store/features/HR/hrSlice";
import {
  accountOptions,
  employeeGenderOptions,
  employeeGroupOptions,
  employmentOptions,
  payrollOptions,
  statusOptions,
  employmentStatus,
  newEmploymentOptions,
  presentUnitOptions,
  paymentTypeOptions,
  isSimplifiedFinanceType,
  isConsultantFinanceType,
  isPfApplicable,
  categoryOptions,
  salutationOptions,
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
import { normalizeDateForInput } from "../../../../utils/time";
import { downloadFile } from "../../../../Components/Common/downloadFile";
import { format } from "date-fns";
import { getFilePreviewMeta } from "../../../../utils/isPreviewable";
import { FILE_PREVIEW_CUTOFF } from "../../../../Components/constants/HR";
import DeleteFileConfirmModal from "../../../Authentication/Components/DeleteFileConfirmModal";

const minutesToHHMM = (mins) => {
  const total = Math.max(0, Math.round(Number(mins) || 0));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

// Categories that are never on PF: picking one sets PF Available to NO and
// stops the form asking for a UAN.
const NON_PF_CATEGORIES = ["CONSULTANT", "FORM11"];

const CONSULTANT_DEFAULT_TDS_RATE = 10;

const RELAXED_EMPLOYEE_FORM_USERS = [
  "67a4983f102397b0c939f937",
  "68f8f38cbfb5c1f785102465",
  "696e176dea1a23b429717267",
  "6874c5a2788d8c2bb3c8e724",
  "6a1fc53e9375ba0ce835157d",
  "689041f59f5a062f9f0581c1"
];

// Tab restructuring is UI-only: these arrays only decide (a) tab labels/order
// and (b) which fields to check when the user clicks "Next" on a tab. They do
// not affect the Yup validationSchema, which stays exactly as before.
const FORM_TABS = [
  { key: "personal", label: "Personal Details", shortLabel: "Personal" },
  {
    key: "employment",
    label: "Employment / Professional",
    shortLabel: "Employment",
  },
  {
    key: "statutory",
    label: "Statutory / Compliance",
    shortLabel: "Statutory",
  },
  { key: "bank", label: "Bank Details", shortLabel: "Bank" },
  { key: "documents", label: "Documents", shortLabel: "Documents" },
  { key: "finance", label: "Finance / Payroll", shortLabel: "Finance" },
];

const TAB_FIELDS = {
  personal: [
    "name",
    "salutation",
    "state",
    "gender",
    "dateOfBirth",
    "father",
    "mobile",
    "officialEmail",
    "email",
  ],
  employment: [
    "eCode",
    "designation",
    "employmentType",
    "newEmploymentType",
    "minimumWorkHours",
    "minimumPresentDays",
    "minimumPresentUnit",
    "employmentStatus",
    "category",
    "position",
    "department",
    "firstLocation",
    "transferredFrom",
    "currentLocation",
    "payrollType",
    "joinningDate",
    "exitDate",
    "status",
    "biometricId",
    "users",
  ],
  statutory: [
    "pfApplicable",
    "uanNo",
    "pfNo",
    "esicIpCode",
    "adharNo",
    "adharOld",
    "pan",
    "panOld",
  ],
  bank: ["bankName", "accountNo", "accountName", "IFSCCode"],
  documents: ["offerLetterOld"],
  finance: [
    "annualCTC",
    "annualInsurance",
    "TDSRate",
    "annualInHandSalary",
    "paymentType",
    "employeeGroups",
    "account",
    "minimumWages",
    "isIncrement",
    "incrementIssued",
    "incrementApplicable",
    "incrementLetterOld",
    "shortWages",
    "grossSalary",
    "basicAmount",
    "basicPercentage",
    "HRAAmount",
    "HRAPercentage",
    "SPLAllowance",
    "conveyanceAllowance",
    "statutoryBonus",
    "insurance",
    "variable",
    "reimbursement",
    "debitStatementNarration",
  ],
};

const isRelaxedEmployeeFormUser = () => {
  try {
    const userId = JSON.parse(localStorage.getItem("micrologin"))?.user?._id;
    return !!userId && RELAXED_EMPLOYEE_FORM_USERS.includes(String(userId));
  } catch {
    return false;
  }
};

const getMaxDOB = () => {
  const maxDOB = new Date();
  maxDOB.setFullYear(maxDOB.getFullYear() - 18);
  return maxDOB;
};

const relaxedOverrides = {
  eCode: Yup.string().notRequired(),
  department: Yup.string().notRequired(),
  employmentType: Yup.string().notRequired(),
  firstLocation: Yup.string().notRequired(),
  designation: Yup.string().notRequired(),
  company: Yup.string().notRequired(),
  payrollType: Yup.string().notRequired(),
  gender: Yup.string().notRequired(),
  pfApplicable: Yup.boolean().notRequired(),
  father: Yup.string().notRequired(),
  state: Yup.string().notRequired(),
  bankName: Yup.string().notRequired(),
  accountNo: Yup.string().notRequired(),
  IFSCCode: Yup.string().notRequired(),
  accountName: Yup.string().notRequired(),
  adharNo: Yup.string().notRequired(),
  pan: Yup.string().notRequired(),
  uanNo: Yup.string().notRequired(),
  panOld: Yup.string().nullable().notRequired(),
  adharOld: Yup.string().nullable().notRequired(),
  offerLetterOld: Yup.string().nullable().notRequired(),
  position: Yup.string()
    .transform((value) => {
      if (typeof value === "object" && value?._id) return value._id;
      return value;
    })
    .notRequired(),
  // Format still checked when a value is entered, presence is not.
  dateOfBirth: Yup.string()
    .notRequired()
    .matches(/^\d{4}-\d{2}-\d{2}$/, {
      message: "Invalid date format (YYYY-MM-DD)",
      excludeEmptyString: true,
    })
    .test(
      "dob-18-plus",
      "Employee must be at least 18 years old",
      (value) => !value || new Date(value) <= getMaxDOB(),
    ),
  mobile: Yup.string()
    .notRequired()
    .test("is-valid-phone", "Invalid phone number", (value) =>
      value ? isValidPhoneNumber(value) : true,
    ),
  // The finance block (employee group, payment type, CTC / in-hand, gross and
  // the salary breakup) is NOT listed here — payroll depends on it, so those
  // fields stay mandatory for everyone.
  minimumWorkHours: Yup.number()
    .min(0, "Must be at least 0")
    .max(24 * 60, "Cannot exceed 24 hours")
    .notRequired(),
  minimumPresentDays: Yup.number().min(0, "Must be at least 0").notRequired(),
  minimumPresentUnit: Yup.string()
    .oneOf(["WEEK", "MONTH", "SESSION"], "Select a valid unit")
    .notRequired(),
};

const validationSchema = (mode, isEdit, relaxed = false) => {
  const schema = baseValidationSchema(mode, isEdit);
  return relaxed ? schema.shape(relaxedOverrides) : schema;
};

const baseValidationSchema = (mode, isEdit) => {
  const isUltraSimplifiedFinance = (employmentType, company) =>
    isSimplifiedFinanceType(employmentType) ||
    ULTRA_SIMPLIFIED_FINANCE_COMPANY_IDS.includes(company);

  return Yup.object({
    name: Yup.string().required("Employee name is required"),
    eCode: isEdit
      ? Yup.string().notRequired()
      : mode === "NEW_JOINING"
        ? Yup.string().notRequired()
        : Yup.string().required("Employee code is required"),
    department: Yup.string().required("Department is required"),
    employmentType: Yup.string().required("Employemnt is required"),
    firstLocation: Yup.string().required("First location is required"),
    currentLocation: Yup.string().required("Current location is required"),
    designation: Yup.string().required("Designation is required"),
    company: Yup.string().required("Company is required"),
    payrollType: Yup.string().required("Payroll type is required"),
    joinningDate: Yup.string()
      .required("Date of joining is required")
      .matches(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
      .test(
        "not-in-future",
        "Joining date cannot be in the future",
        (value) => {
          if (!value) return false;
          const today = format(new Date(), "yyyy-MM-dd");
          return value <= today;
        },
      ),
    gender: Yup.string().required("Gender is required"),
    pfApplicable: Yup.boolean().required("Pf Applicable is required"),
    father: Yup.string().required("Father's name is required"),
    dateOfBirth: Yup.string()
      .required("Date of birth is required")
      .matches(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
      .test(
        "dob-18-plus",
        "Employee must be at least 18 years old",
        (value) => {
          if (!value) return false;
          return new Date(value) <= getMaxDOB();
        },
      ),
    exitDate: Yup.string()
      .nullable()
      .test(
        "exit-after-joining",
        "Exit date must be after joining date",
        function (value) {
          const { joinningDate } = this.parent;
          if (!value || !joinningDate) return true;
          return new Date(value) >= new Date(joinningDate);
        },
      ),
    mobile: Yup.string()
      .required("Mobile number is required")
      .test("is-valid-phone", "Invalid phone number", function (value) {
        return isValidPhoneNumber(value || "");
      }),
    email: Yup.string().trim().email("Invalid email").notRequired(),
    status:
      mode === "NEW_JOINING"
        ? Yup.string().oneOf(["NEW_JOINING"])
        : Yup.string()
            .oneOf(["ACTIVE", "FNF_CLOSED", "RESIGNED"])
            .required("Status is required"),
    state: Yup.string().required("State is required"),
    bankName: Yup.string().required("Bank name is required"),
    accountNo: Yup.string().required("Bank account number is required"),
    IFSCCode: Yup.string().required("IFSC code is required"),
    accountName: Yup.string().required("Account holder's name is required"),
    // "Non Aadhaar" employees have no PAN/Aadhaar on record, so neither the
    // numbers nor their uploads are demanded.
    adharNo: Yup.string().when("category", {
      is: "NON_AADHAAR",
      then: (s) => s.notRequired(),
      otherwise: (s) => s.required("Aadhaar number is required"),
    }),
    pan: Yup.string().when("category", {
      is: "NON_AADHAAR",
      then: (s) => s.notRequired(),
      otherwise: (s) => s.required("PAN number is required"),
    }),
    biometricId: Yup.string().trim(),
    panOld: Yup.string()
      .nullable()
      .when("category", {
        is: "NON_AADHAAR",
        then: (s) => s.notRequired(),
        otherwise: (s) =>
          s.test("pan-uploaded", "PAN file is required", (value) => !!value),
      }),
    adharOld: Yup.string().when("category", {
      is: "NON_AADHAAR",
      then: (s) => s.notRequired(),
      otherwise: (s) => s.required("Aadhaar file is required"),
    }),
    offerLetterOld: Yup.string().required("Offer letter is required"),
    employeeGroups: Yup.string().when(["employmentType", "company"], {
      is: (v, company) => isUltraSimplifiedFinance(v, company),
      then: (s) => s.notRequired(),
      otherwise: (s) => s.required("Employee Group is required"),
    }),
    account: Yup.string().notRequired(),
    minimumWages: Yup.number().min(0).notRequired(),
    // Simplified finance fields (only required for the simplified employee types)
    paymentType: Yup.string().when(["employmentType", "company"], {
      is: (v, company) =>
        isSimplifiedFinanceType(v) &&
        !ULTRA_SIMPLIFIED_FINANCE_COMPANY_IDS.includes(company),
      then: (s) => s.required("Payment Type is required"),
      otherwise: (s) => s.notRequired(),
    }),
    annualInHandSalary: Yup.number()
      .min(0)
      .when(["employmentType", "company"], {
        is: (v, company) => isUltraSimplifiedFinance(v, company),
        then: (s) =>
          s
            .moreThan(0, "In Hand Salary must be greater than 0")
            .required("In Hand Salary is required")
            .test(
              "inhand-not-above-ctc",
              "In Hand Salary cannot be greater than Annual CTC",
              function (value) {
                const { annualCTC } = this.parent;
                if (value == null || annualCTC == null || annualCTC === "")
                  return true;
                return Number(value) <= Number(annualCTC);
              },
            ),
        otherwise: (s) => s.notRequired(),
      }),
    annualCTC: Yup.number()
      .min(0)
      .when(["employmentType", "company"], {
        is: (v, company) => isUltraSimplifiedFinance(v, company),
        then: (s) =>
          s
            .moreThan(0, "Annual CTC must be greater than 0")
            .required("Annual CTC is required"),
        otherwise: (s) => s.notRequired(),
      }),
    annualInsurance: Yup.number().min(0).notRequired(),
    grossSalary: Yup.number()
      .min(0)
      .when(["employmentType", "company"], {
        is: (v, company) => isUltraSimplifiedFinance(v, company),
        then: (s) => s.notRequired(),
        otherwise: (s) =>
          s
            .required("Gross Salary is required")
            .test(
              "gross-breakup-exact-match",
              "Basic + HRA + SPL + Conveyance + Statutory Bonus must be equal to Gross Salary",
              function (gross) {
                const {
                  basicAmount = 0,
                  HRAAmount = 0,
                  SPLAllowance = 0,
                  conveyanceAllowance = 0,
                  statutoryBonus = 0,
                } = this.parent;

                const breakupTotal =
                  Number(basicAmount) +
                  Number(HRAAmount) +
                  Number(SPLAllowance) +
                  Number(conveyanceAllowance) +
                  Number(statutoryBonus);

                if (gross === undefined || gross === null) return true;

                return Number(gross) === breakupTotal;
              },
            ),
      }),
    basicAmount: Yup.number()
      .min(0)
      .when(["employmentType", "company"], {
        is: (v, company) => isUltraSimplifiedFinance(v, company),
        then: (s) => s.notRequired(),
        otherwise: (s) => s.required("Basic Amount is required"),
      }),
    basicPercentage: Yup.number().min(0).max(100).notRequired(),
    HRAAmount: Yup.number()
      .min(0)
      .when(["employmentType", "company"], {
        is: (v, company) => isUltraSimplifiedFinance(v, company),
        then: (s) => s.notRequired(),
        otherwise: (s) => s.required("HRA is required"),
      }),
    HRAPercentage: Yup.number().min(0).max(100).notRequired(),
    statutoryBonus: Yup.number()
      .min(0)
      .when(["employmentType", "company"], {
        is: (v, company) => isUltraSimplifiedFinance(v, company),
        then: (s) => s.notRequired(),
        otherwise: (s) => s.required("Statutory Bonus is required"),
      }),
    insurance: Yup.number().min(0).notRequired(),
    variable: Yup.number().min(0).notRequired(),
    reimbursement: Yup.number().min(0).notRequired(),
    TDSRate: Yup.number()
      .min(0)
      .max(100)
      .when("employmentType", {
        is: (v) => isConsultantFinanceType(v),
        then: (s) => s.required("TDS Rate is required"),
        otherwise: (s) => s.notRequired(),
      }),
    pfAmount: Yup.number().min(0).notRequired(),
    SPLAllowance: Yup.number()
      .min(0)
      .when(["employmentType", "company"], {
        is: (v, company) => isUltraSimplifiedFinance(v, company),
        then: (s) => s.notRequired(),
        otherwise: (s) => s.required("SPL Allowance is required"),
      }),
    conveyanceAllowance: Yup.number()
      .min(0)
      .when(["employmentType", "company"], {
        is: (v, company) => isUltraSimplifiedFinance(v, company),
        then: (s) => s.notRequired(),
        otherwise: (s) => s.required("Conveyance Allowance is required"),
      }),
    debitStatementNarration: Yup.string().notRequired(),
    ESICSalary: Yup.number().min(0).notRequired(),
    LWFEmployee: Yup.number().min(0).notRequired(),
    LWFEmployer: Yup.number().min(0).notRequired(),
    uanNo: Yup.string().when(["pfApplicable", "category"], {
      is: (pfApplicable, category) =>
        pfApplicable === true && !NON_PF_CATEGORIES.includes(category),
      then: (schema) => schema.required("UAN No is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
    // pfNo: Yup.string().when("pfApplicable", {
    //   is: true,
    //   then: (schema) => schema.required("PF No is required"),
    //   otherwise: (schema) => schema.notRequired(),
    // }),
    // newEmploymentType: Yup.string().required("Employment type is required"),
    // employmentStatus: Yup.string().required("Employment status is required"),
    minimumWorkHours: Yup.number()
      .min(0, "Must be at least 0")
      .max(24 * 60, "Cannot exceed 24 hours")
      .when("newEmploymentType", {
        is: "PART_TIME",
        then: (schema) =>
          schema.required("Minimum work hours is required for part-time"),
        otherwise: (schema) => schema.notRequired(),
      }),
    minimumPresentDays: Yup.number()
      .min(0, "Must be at least 0")
      .when("minimumPresentUnit", {
        is: "WEEK",
        then: (schema) => schema.max(7, "Cannot exceed 7 days per week"),
        otherwise: (schema) =>
          schema.max(31, "Cannot exceed 31 days per month"),
      })
      .when(["newEmploymentType", "minimumPresentUnit"], {
        // Days aren't captured for "Per Session" — hours per session are used instead.
        is: (type, unit) => type === "PART_TIME" && unit !== "SESSION",
        then: (schema) =>
          schema.required("Minimum present days is required for part-time"),
        otherwise: (schema) => schema.notRequired(),
      }),
    minimumPresentUnit: Yup.string()
      .oneOf(["WEEK", "MONTH", "SESSION", "SESSIONS"], "Select a valid unit")
      .when("newEmploymentType", {
        is: "PART_TIME",
        then: (schema) =>
          schema.required("Please select week, month or session"),
        otherwise: (schema) => schema.notRequired(),
      }),
    position: Yup.string()
      .transform((value) => {
        if (typeof value === "object" && value?._id) return value._id;
        return value;
      })
      .required("Position is required"),
    incrementIssued: Yup.string().when("isIncrement", {
      is: "YES",
      then: (s) => s.required("Increment issued date is required"),
      otherwise: (s) => s.notRequired(),
    }),
    incrementApplicable: Yup.string().when("isIncrement", {
      is: "YES",
      then: (s) => s.required("Increment applicable date is required"),
      otherwise: (s) => s.notRequired(),
    }),
  });
};

const getInitialValues = (initialData, mode) => ({
  name: initialData?.name || "",
  salutation: initialData?.salutation || "",
  eCode: mode === "NEW_JOINING" ? "" : initialData?.eCode || "",

  department: initialData?.department?._id || "",
  designation: initialData?.designation?._id || "",
  company: initialData?.company?._id || "",

  firstLocation: initialData?.firstLocation?._id || "",
  transferredFrom: initialData?.transferredFrom?._id || "",
  currentLocation: initialData?.currentLocation?._id || "",

  employmentType: initialData?.employmentType || "",
  payrollType: initialData?.payrollType || "",
  state: initialData?.state || "",

  joinningDate: normalizeDateForInput(initialData?.joinningDate) || "",
  exitDate: normalizeDateForInput(initialData?.exitDate) || "",
  dateOfBirth: normalizeDateForInput(initialData?.dateOfBirth) || "",

  status: initialData?.status ?? (mode === "NEW_JOINING" ? "NEW_JOINING" : ""),

  gender: initialData?.gender || "",

  bankName: initialData?.bankDetails?.bankName || "",
  accountNo: initialData?.bankDetails?.accountNo || "",
  IFSCCode: initialData?.bankDetails?.IFSCCode || "",
  accountName: initialData?.bankDetails?.accountName || "",

  pfApplicable: initialData?.pfApplicable ?? null,
  pfNo: initialData?.pfNo || "",
  uanNo: initialData?.uanNo || "",
  esicIpCode: initialData?.esicIpCode || "",

  adharNo: initialData?.adhar?.number || "",
  pan: initialData?.pan?.number || "",

  panOld: initialData?.pan?.url || "",
  adharOld: initialData?.adhar?.url || "",
  offerLetterOld: initialData?.offerLetter || "",

  father: initialData?.father || "",
  mobile: initialData?.mobile || "",
  officialEmail: initialData?.officialEmail || "",
  email: initialData?.email?.trim() || "",

  // monthlyCTC: initialData?.monthlyCTC || 0,
  biometricId: initialData?.biometricId || "",
  category: initialData?.category || "",

  panFile: null,
  adharFile: null,
  offerLetterFile: null,

  employeeGroups: initialData?.financeDetails?.employeeGroups || "",
  account: initialData?.financeDetails?.account || "",

  minimumWages: initialData?.financeDetails?.minimumWages || 0,
  shortWages: initialData?.financeDetails?.shortWages || 0,
  grossSalary: annualBreakupGross(initialData?.financeDetails),

  basicPercentage: initialData?.financeDetails?.basicPercentage || 0,
  basicAmount: annualFieldValue(initialData?.financeDetails, "basicAmount"),
  HRAAmount: annualFieldValue(initialData?.financeDetails, "HRAAmount"),
  HRAPercentage: initialData?.financeDetails?.HRAPercentage || 0,
  SPLAllowance: annualFieldValue(initialData?.financeDetails, "SPLAllowance"),
  conveyanceAllowance: annualFieldValue(
    initialData?.financeDetails,
    "conveyanceAllowance",
  ),
  statutoryBonus: annualFieldValue(
    initialData?.financeDetails,
    "statutoryBonus",
  ),

  insurance: annualFieldValue(initialData?.financeDetails, "insurance"),
  variable:
    initialData?.financeDetails?.annual?.variable ??
    initialData?.financeDetails?.variable ??
    0,
  reimbursement:
    initialData?.financeDetails?.annual?.reimbursement ??
    initialData?.financeDetails?.reimbursement ??
    0,
  ESICSalary: initialData?.financeDetails?.ESICSalary || 0,
  ESICEmployee: initialData?.financeDetails?.ESICEmployee || 0,
  ESICEmployer: initialData?.financeDetails?.ESICEmployer || 0,
  LWFEmployee: annualFieldValue(initialData?.financeDetails, "LWFEmployee"),
  LWFEmployer: annualFieldValue(initialData?.financeDetails, "LWFEmployer"),

  PFEmployee: initialData?.financeDetails?.PFEmployee || 0,
  PFEmployer: initialData?.financeDetails?.PFEmployer || 0,
  PFAmount: initialData?.financeDetails?.PFAmount || 0,

  PT: initialData?.financeDetails?.PT || 0,
  TDSRate: initialData?.financeDetails?.TDSRate || 0,

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

  debitStatementNarration:
    initialData?.financeDetails?.debitStatementNarration || "",

  users: initialData?.users
    ? initialData.users.map((u) => ({
        value: u._id,
        label: `${u.name} (${u.email})`,
      }))
    : [],
  employmentStatus: initialData?.employmentStatus || "",
  newEmploymentType: initialData?.newEmploymentType || "",
  minimumWorkHours:
    initialData?.minimumWorkHours != null ? initialData.minimumWorkHours : "",
  minimumPresentDays:
    initialData?.minimumPresentDays != null
      ? initialData.minimumPresentDays
      : "",
  minimumPresentUnit: initialData?.minimumPresentUnit || "",
  position:
    initialData?.position?._id?.toString() ||
    initialData?.position?.toString() ||
    "",
  incrementLetterOld: initialData?.financeDetails?.incrementLetter || "",
  incrementLetterFile: null,
  incrementIssued: initialData?.financeDetails?.incrementIssued
    ? format(new Date(initialData.financeDetails.incrementIssued), "yyyy-MM-dd")
    : "",
  isIncrement:
    initialData?.financeDetails?.incrementIssued &&
    initialData?.financeDetails?.incrementApplicable
      ? "YES"
      : "NO",
  incrementApplicable: initialData?.financeDetails?.incrementApplicable
    ? format(
        new Date(initialData.financeDetails.incrementApplicable),
        "yyyy-MM-dd",
      )
    : "",
  positionDocuments: initialData?.positionDocuments || {},
});

const EmployeeForm = ({
  initialData,
  onSuccess,
  view,
  onCancel,
  mode,
  hasCreatePermission,
}) => {
  const dispatch = useDispatch();
  const { centerAccess, userCenters } = useSelector((state) => state.User);
  const { designations: designationOptions, designationLoading } = useSelector(
    (state) => state.HR,
  );
  const handleAuthError = useAuthError();
  const microUser = localStorage.getItem("micrologin");
  const token = microUser ? JSON.parse(microUser).token : null;
  const isEdit = !!initialData?._id;
  const relaxedValidation = useMemo(() => isRelaxedEmployeeFormUser(), []);
  // Tabbed Add Employee wizard applies to Master + New Joining (Add & Edit)
  // only; Exit/Transfer keep the original single-page layout untouched.
  const tabsEnabled = mode === "MASTER" || mode === "NEW_JOINING";
  const [activeTab, setActiveTab] = useState(FORM_TABS[0].key);
  const [eCodeLoader, setECodeLoader] = useState(false);
  const [linking, setLinking] = useState(false);
  // const [creatingDesignation, setCreatingDesignation] = useState(false);

  const [previewFile, setPreviewFile] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);
  // const [department, setDepartment] = useState("");
  const [positionOptions, setPositionOptions] = useState([]);
  const [, setManual] = useState({
    SPLAllowance: false,
  });
  const [uploading, setUploading] = useState({
    panFile: false,
    adharFile: false,
    offerLetterFile: false,
    incrementLetterFile: false,
  });

  const [uploadedAt, setUploadedAt] = useState({
    panOld: null,
    adharOld: null,
    offerLetterOld: null,
    incrementLetterOld: null,
  });
  const [docConfigForPosition, setDocConfigForPosition] = useState([]);
  const [employeeUploads, setEmployeeUploads] = useState([]);
  const [positionDocsLoading, setPositionDocsLoading] = useState(false);
  const [positionDocFiles, setPositionDocFiles] = useState({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDeleteFile, setSelectedDeleteFile] = useState(null);

  const positionDocFileRefs = useRef({});
  const panFileRef = useRef(null);
  const adharFileRef = useRef(null);
  const offerLetterRef = useRef(null);
  const incrementLetterRef = useRef(null);
  const positionCorrectedRef = useRef(false);

  const positionDocFields = useMemo(() => {
    const uploadsByDocId = new Map(employeeUploads.map((u) => [u.document, u]));
    const configDocIds = new Set(docConfigForPosition.map((d) => d.document));

    const currentFields = docConfigForPosition.map((doc) => ({
      document: doc.document,
      docName: doc.docName,
      markMandatory: doc.markMandatory,
      legacy: false,
      files: uploadsByDocId.get(doc.document)?.files || [],
    }));

    const legacyFields = employeeUploads
      .filter((u) => !configDocIds.has(u.document))
      .map((u) => ({
        document: u.document,
        docName: u.docName,
        markMandatory: false,
        legacy: true,
        files: u.files || [],
      }));

    return [...currentFields, ...legacyFields];
  }, [docConfigForPosition, employeeUploads]);

  const centerOptions = userCenters
    ?.filter((c) => centerAccess.includes(c._id))
    .map((c) => ({
      value: c._id,
      label: c.title,
      title: c.title,
      address: c.address,
    }))
    .sort((a, b) => (a.label || "").localeCompare(b.label || ""));

  const sortedDesignationOptions = useMemo(
    () =>
      [...designationOptions].sort((a, b) =>
        (a.label || "").localeCompare(b.label || ""),
      ),
    [designationOptions],
  );

  const sortedDepartmentOptions = useMemo(
    () =>
      [...departmentOptions].sort((a, b) =>
        (a.label || "").localeCompare(b.label || ""),
      ),
    [departmentOptions],
  );

  useEffect(() => {
    const loadDesignations = async () => {
      try {
        dispatch(
          fetchDesignations({ status: ["PENDING", "APPROVED"], version: 2 }),
        ).unwrap();
      } catch (error) {
        if (!handleAuthError(error)) {
          toast.error("Something went wrong while getting the designations");
        }
      }
    };

    loadDesignations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const form = useFormik({
    enableReinitialize: true,
    validateOnMount: true,
    initialValues: getInitialValues(initialData, mode),
    validationSchema: validationSchema(mode, isEdit, relaxedValidation),
    onSubmit: async (values) => {
      touchFileFields();
      const errors = await form.validateForm();

      // Document uploads are mandatory-field checks of their own, so the
      // relaxed users skip them the same way they skip the Yup requirements.
      if (!relaxedValidation) {
        if (errors.panOld || errors.adharOld || errors.offerLetterOld) {
          toast.error("Please upload all required documents");
          return;
        }
        const missingMandatoryDocs = validatePositionDocuments();
        if (missingMandatoryDocs.length > 0) {
          toast.error(
            `Please upload required document(s): ${missingMandatoryDocs.join(", ")}`,
          );
          return;
        }
      }

      try {
        if (mode === "NEW_JOINING") {
          values.status = "NEW_JOINING";
        } else {
          values.status = values.status?.trim();
        }

        const formData = new FormData();

        Object.entries(values).forEach(([key, value]) => {
          if (key === "eCode" && mode === "NEW_JOINING") return;
          if (key === "users") return;
          if (key === "positionDocuments") return;
          if (value === undefined || value === null) return;
          formData.append(key, value);
        });

        if (
          values.newEmploymentType === "PART_TIME" &&
          values.minimumWorkHours
        ) {
          formData.set(
            "minimumWorkHours",
            Math.round(Number(values.minimumWorkHours)),
          );
        } else {
          formData.delete("minimumWorkHours");
        }

        if (
          values.newEmploymentType === "PART_TIME" &&
          values.minimumPresentUnit
        ) {
          formData.set("minimumPresentUnit", values.minimumPresentUnit);
          // "Per Session" captures only hours (minimumWorkHours), never a day count.
          if (
            values.minimumPresentUnit !== "SESSION" &&
            values.minimumPresentDays !== ""
          ) {
            formData.set(
              "minimumPresentDays",
              Number(values.minimumPresentDays),
            );
          } else {
            formData.delete("minimumPresentDays");
          }
        } else {
          formData.delete("minimumPresentDays");
          formData.delete("minimumPresentUnit");
        }
        Object.entries(positionDocFiles).forEach(([documentId, files]) => {
          files.forEach((file) => {
            formData.append("positionDocFiles", file);
            formData.append("positionDocumentIds", documentId);
          });
        });
        // Amount fields above are yearly; the server splits them into monthly.
        formData.append("salaryUnit", "ANNUAL");
        let panUrl = values.panOld;
        let adharUrl = values.adharOld;
        let offerLetterUrl = values.offerLetterOld;

        if (panUrl) formData.append("panUrl", panUrl);
        if (adharUrl) formData.append("adharUrl", adharUrl);
        if (offerLetterUrl) formData.append("offerLetterUrl", offerLetterUrl);

        formData.delete("PFEmployee");
        formData.delete("PFEmployer");
        formData.delete("PFAmount");
        formData.delete("PT");
        formData.delete("PTAnnual");
        formData.delete("shortWages");
        formData.delete("PFSalary");
        formData.delete("PFAmount");
        formData.delete("TDSAmount");
        formData.delete("deductions");
        formData.delete("ESICEmployee");
        formData.delete("ESICEmployer");
        formData.delete("inHandSalary");
        formData.delete("gratuity");
        formData.delete("totalCostToCompany");
        formData.delete("panOld");
        formData.delete("offerLetterOld");
        formData.delete("adharOld");
        formData.delete("basicPercentage");
        formData.delete("HRAPercentage");
        formData.delete("incrementLetterOld");
        formData.delete("incrementLetterFile");
        formData.delete("isIncrement");
        formData.delete("incrementIssued");
        formData.delete("incrementApplicable");
        if (values.isIncrement === "YES") {
          if (values.incrementLetterOld)
            formData.set("incrementLetter", values.incrementLetterOld);
          if (values.incrementIssued)
            formData.set("incrementIssued", values.incrementIssued);
          if (values.incrementApplicable)
            formData.set("incrementApplicable", values.incrementApplicable);
        } else if (
          initialData?.financeDetails?.incrementIssued ||
          initialData?.financeDetails?.incrementApplicable
        ) {
          formData.set("incrementIssued", "");
          formData.set("incrementApplicable", "");
          formData.set("incrementLetter", "");
        }

        // Client-only mirror fields — never sent to the server as-is.
        formData.delete("annualInHandSalary");
        formData.delete("annualCTC");
        formData.delete("annualInsurance");
        formData.delete("paymentType");

        const isSimplified =
          isSimplifiedFinanceType(values.employmentType) ||
          ULTRA_SIMPLIFIED_FINANCE_COMPANY_IDS.includes(values.company);
        formData.set("financeMode", isSimplified ? "SIMPLIFIED" : "FULL");

        if (isSimplified) {
          // Send the three yearly figures; the server splits them into monthly.
          // Ultra-simplified-finance companies never deduct insurance — In
          // Hand always equals CTC.
          formData.set("inHandSalary", values.annualInHandSalary || 0);
          formData.set("totalCostToCompany", values.annualCTC || 0);
          formData.set(
            "insurance",
            ultraSimplifiedFinance ? 0 : values.annualInsurance || 0,
          );
          formData.set("paymentType", values.paymentType || "MONTHLY");
          // Drop the full-breakup fields the simplified flow doesn't use.
          [
            "employeeGroups",
            "account",
            "grossSalary",
            "basicAmount",
            "HRAAmount",
            "SPLAllowance",
            "conveyanceAllowance",
            "statutoryBonus",
            "minimumWages",
            "ESICSalary",
            "LWFEmployee",
            "LWFEmployer",
            "TDSRate",
            "variable",
            "reimbursement",
            "debitStatementNarration",
          ].forEach((key) => formData.delete(key));
          // Consultants carry a TDS rate — re-add it after the cleanup above so
          // the server can deduct it from CTC to derive the stored In Hand
          // Salary. Ultra-simplified-finance companies never deduct TDS,
          // regardless of employmentType.
          if (consultant && !ultraSimplifiedFinance) {
            formData.set("TDSRate", values.TDSRate || 0);
          }
        }

        if (initialData?._id) {
          formData.delete("eCode");
          await editEmployee(initialData._id, formData);
          toast.success("Employee updated successfully");
        } else {
          await postEmployee(formData);
          toast.success("Employee added successfully");
          clearDraft();
        }

        if (view === "PAGE") {
          form.resetForm({
            values: {
              ...form.initialValues,
              firstLocation: "",
              transferredFrom: "",
              currentLocation: "",
            },
          });
        } else {
          onSuccess?.();
        }
      } catch (error) {
        if (!handleAuthError(error)) {
          toast.error(error?.message || "Failed to save employee");
        }
      }
    },
  });

  const {
    values,
    errors,
    isSubmitting,
    handleChange,
    setFieldValue,
    setValues,
    setTouched,
    setFieldTouched,
    validateForm,
    touched,
    isValid,
  } = form;

  const draftKey = `employeeFormDraft_${mode}`;
  const draftEnabled = !isEdit && (mode === "MASTER" || mode === "NEW_JOINING");
  const { savedDraft, clearDraft } = useFormDraft(draftKey, values, {
    enabled: draftEnabled,
    exclude: ["eCode", "adharOld", "panOld", "offerLetterOld", "incrementLetterOld"],
  });

  const draftAppliedRef = useRef(false);
  const draftECodePendingRef = useRef(false);
  useEffect(() => {
    if (draftEnabled && savedDraft && !draftAppliedRef.current) {
      draftAppliedRef.current = true;
      setValues({ ...values, ...savedDraft }, false);
      if (!initialData?._id && mode !== "NEW_JOINING" && savedDraft.company) {
        draftECodePendingRef.current = true;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftEnabled, savedDraft]);

  useEffect(() => {
    if (draftECodePendingRef.current && companyOptions.length && values.company) {
      draftECodePendingRef.current = false;
      generateEmployeeId(
        companyOptions.find((opt) => opt.value === values.company)?.ecodePrefix,
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyOptions, values.company]);

  // Contractual / consultant / intern / apprentice / consultant-session use the
  // simplified finance section (In Hand Salary, Annual CTC, Payment Type) and
  // skip the full salary breakup + payroll computation.
  const simplified = isSimplifiedFinanceType(values.employmentType);
  // PER_SESSION amounts are flat per-session rates — not yearly — so we drop the
  // "(Yearly)" label and the monthly (÷12) preview for them.
  const perSession = simplified && values.paymentType === "PER_SESSION";
  // Consultants enter a TDS rate; TDS is deducted from CTC and In Hand becomes
  // CTC − TDS (auto-computed, read-only).
  const consultant = isConsultantFinanceType(values.employmentType);
  // Some companies use an even smaller finance section: just Annual CTC +
  // In Hand (In Hand = CTC, no TDS/insurance/payment type).
  const ultraSimplifiedFinance = ULTRA_SIMPLIFIED_FINANCE_COMPANY_IDS.includes(
    values.company,
  );

  const isNonAadhaar = values.category === "NON_AADHAAR";
  const consultantTdsAmount = Math.round(
    ((Number(values.annualCTC) || 0) * (Number(values.TDSRate) || 0)) / 100,
  );

  useEffect(() => {
    if (consultant && !Number(values.TDSRate)) {
      setFieldValue("TDSRate", CONSULTANT_DEFAULT_TDS_RATE, false);
    }
  }, [consultant, values.TDSRate]); // eslint-disable-line react-hooks/exhaustive-deps

  // In Hand is always derived, never typed: CTC − TDS − Insurance. TDS only
  // applies to consultants (consultantTdsAmount is 0 for every other simplified
  // type), so this single formula covers both cases.
  useEffect(() => {
    const insurance = ultraSimplifiedFinance
      ? 0
      : Number(values.annualInsurance) || 0;
    const inHand = Math.max(
      0,
      (Number(values.annualCTC) || 0) -
        (ultraSimplifiedFinance ? 0 : consultantTdsAmount) -
        insurance,
    );
    if (Number(values.annualInHandSalary) !== inHand) {
      setFieldValue("annualInHandSalary", inHand, false);
    }
  }, [ultraSimplifiedFinance, consultantTdsAmount, values.annualCTC, values.annualInsurance]); // eslint-disable-line react-hooks/exhaustive-deps

  const touchFileFields = () => {
    setTouched(
      {
        ...form.touched,
        panOld: true,
        adharOld: true,
        offerLetterOld: true,
      },
      false,
    );
  };

  const activeTabIndex = FORM_TABS.findIndex((tab) => tab.key === activeTab);

  // Does this tab have a currently-visible validation error? Uses the same
  // touched+errors check errorText() already uses per field, just scanning a
  // whole tab's field list instead of one field.
  const tabHasErrors = (tabKey) =>
    (TAB_FIELDS[tabKey] || []).some((field) => touched[field] && errors[field]);

  // "Next" only checks the fields that belong to the tab being left — it does
  // not run/change the overall Yup validationSchema, just reads its result.
  const handleNextTab = async () => {
    const fieldsToCheck = TAB_FIELDS[activeTab] || [];
    const formErrors = await validateForm();
    const touchedUpdates = {};
    fieldsToCheck.forEach((field) => {
      touchedUpdates[field] = true;
    });
    setTouched({ ...touched, ...touchedUpdates }, false);

    const hasBlockingErrors = fieldsToCheck.some((field) => formErrors[field]);
    if (hasBlockingErrors) return;

    if (activeTabIndex < FORM_TABS.length - 1) {
      setActiveTab(FORM_TABS[activeTabIndex + 1].key);
    }
  };

  const handlePrevTab = () => {
    if (activeTabIndex > 0) {
      setActiveTab(FORM_TABS[activeTabIndex - 1].key);
    }
  };

  const handleFileUpload = async ({ file, path, urlField, fileField }) => {
    if (!file) return;

    try {
      setUploading((prev) => ({ ...prev, [fileField]: true }));

      const fd = new FormData();
      fd.append("file", file);
      fd.append("uploadPath", path);

      const res = await uploadFile(fd);

      setFieldValue(urlField, res.url, false);

      setFieldTouched(urlField, true, false);

      setUploadedAt((prev) => ({
        ...prev,
        [urlField]: new Date().toISOString(),
      }));

      form.setErrors((prev) => ({
        ...prev,
        [urlField]: undefined,
      }));

      toast.success("File uploaded successfully");
    } catch (err) {
      if (!handleAuthError(err)) {
        toast.error("File upload failed");
      }
    } finally {
      setUploading((prev) => ({ ...prev, [fileField]: false }));
    }
  };

  const handlePositionDocSelect = (documentId, file) => {
    if (!file) return;
    setPositionDocFiles((prev) => ({
      ...prev,
      [documentId]: [...(prev[documentId] || []), file],
    }));
  };

  const handlePositionDocRemove = (documentId, index) => {
    setPositionDocFiles((prev) => ({
      ...prev,
      [documentId]: (prev[documentId] || []).filter((_, i) => i !== index),
    }));
  };

  const validatePositionDocuments = () => {
    const missing = positionDocFields.filter((doc) => {
      if (!doc.markMandatory) return false;
      const hasNewFile = (positionDocFiles[doc.document] || []).length > 0;
      const hasExistingFile = (doc.files || []).length > 0;
      return !hasNewFile && !hasExistingFile;
    });
    return missing.map((d) => d.docName);
  };

  const getDocumentDate = (urlField) =>
    uploadedAt[urlField] || initialData?.updatedAt;

  const handleFilePreview = (file, urlField) => {
    if (!file?.url) return;

    const meta = getFilePreviewMeta(
      file,
      getDocumentDate(urlField),
      FILE_PREVIEW_CUTOFF,
    );

    if (meta.action === "preview") {
      setPreviewFile(file);
      setPreviewOpen(true);
    } else {
      downloadFile(file);
    }
  };

  const getFileActionLabel = (file, urlField) => {
    if (!file?.url) return "Download";

    const meta = getFilePreviewMeta(
      file,
      getDocumentDate(urlField),
      FILE_PREVIEW_CUTOFF,
    );

    return meta.action === "preview" ? "Preview" : "Download";
  };

  const errorText = (field) => {
    if (isEdit) {
      return errors[field] ? (
        <div className="text-danger small">{errors[field]}</div>
      ) : null;
    }

    return touched[field] && errors[field] ? (
      <div className="text-danger small">{errors[field]}</div>
    ) : null;
  };

  const monthlyView = annualToMonthly(values);
  const monthlyHint = (field) => (
    <div className="text-muted small mt-1">
      Monthly ≈ ₹{(monthlyView[field] || 0).toLocaleString("en-IN")}
    </div>
  );

  const yearlyValue = (field) => Math.round(Number(values[field]) || 0) * 12;
  const monthlyHintFrom = (field) => (
    <div className="text-muted small mt-1">
      Monthly ≈ ₹
      {Math.round(Number(values[field]) || 0).toLocaleString("en-IN")}
    </div>
  );

  // Professional Tax uses flat state-wise slabs, so the yearly total is monthly
  // PT × 12 for every state — calculatePayroll supplies this via PTAnnual.
  const ptMonthly = Math.round(Number(values.PT) || 0);
  const ptYearly =
    values.PTAnnual !== undefined
      ? Math.round(Number(values.PTAnnual) || 0)
      : ptMonthly * 12;

  // annual deductions swap the monthly PT × 12 for the exact PT annual.
  // These start as the naive rollups; the LWF correction below (once lwfState is
  // resolved) swaps the monthly-LWF × 12 for the true yearly LWF.
  let deductionsYearly =
    (Math.round(Number(values.deductions) || 0) - ptMonthly) * 12 + ptYearly;

  let ctcYearly =
    yearlyValue("totalCostToCompany") +
    Number(values.variable || 0) +
    Number(values.reimbursement || 0);

  let inHandYearly = yearlyValue("inHandSalary");

  const missingMandatoryDocs = validatePositionDocuments();
  // const handleCreateDesignation = async (inputValue) => {
  //   if (mode === "NEW_JOINING" && !hasCreatePermission) {
  //     toast.error("You don't have permission to create designation");
  //     return;
  //   }

  //   try {
  //     setCreatingDesignation(true);
  //     const response = await dispatch(
  //       addDesignation({
  //         name: inputValue,
  //         status: mode === "NEW_JOINING" ? "PENDING" : "APPROVED",
  //       }),
  //     ).unwrap();
  //     form.setFieldValue("designation", response.data.value);
  //     form.setFieldTouched("designation", true, false);
  //     toast.success("designation created successfully");
  //   } catch (error) {
  //     if (!handleAuthError(error)) {
  //       toast.error("something went wrong while creating new designation");
  //     }
  //   } finally {
  //     setCreatingDesignation(false);
  //   }
  // };

  const generateEmployeeId = async (prefix) => {
    setECodeLoader(true);
    try {
      const response = await getEmployeeId(prefix ? { prefix } : {});
      form.setFieldValue("eCode", response.payload.value);
    } catch (error) {
      if (!handleAuthError) {
        toast.error("Failed to generate employee id");
      }
    } finally {
      setECodeLoader(false);
    }
  };

  useEffect(() => {
    if (!initialData?._id && mode !== "NEW_JOINING" && values.company) {
      generateEmployeeId(
        companyOptions.find((opt) => opt.value === values.company)?.ecodePrefix,
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, mode]);

  useEffect(() => {
    if (isEdit) {
      setTouched(
        {
          panOld: true,
          adharOld: true,
          offerLetterOld: true,
        },
        false,
      );
    }
  }, [isEdit, setTouched]);

  const fetchDepartment = async () => {
    try {
      const response = await getDepartments();
      setDepartmentOptions(
        (response?.data || []).map((dept) => ({
          label: dept.department,
          value: dept._id,
        })),
      );
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error("Failed to fetch department");
      }
    }
  };

  useEffect(() => {
    fetchDepartment();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCompany = async () => {
    try {
      const response = await getCompanies({ includeInactive: false });
      setCompanyOptions(
        (response?.data || []).map((c) => ({
          label: c.name,
          value: c._id,
          ecodePrefix: c.ecodePrefix,
        })),
      );
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error("Failed to fetch company");
      }
    }
  };

  useEffect(() => {
    fetchCompany();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isEdit && initialData?.department && departmentOptions.length) {
      const matched = departmentOptions.find(
        (opt) => opt.label === initialData.department,
      );

      if (matched) {
        form.setFieldValue("department", matched.value);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentOptions, isEdit, initialData]);

  const handleLinkUsers = async () => {
    if (!initialData?._id) return;
    setLinking(true);
    try {
      const payload = {
        id: initialData._id,
        updates: {
          users: values.users ? values.users.map((u) => u.value) : [],
        },
      };
      await updateEmployeeByKey(payload);
      toast.success("Users linked successfully");
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(error?.message || "Failed to link users");
      }
    } finally {
      setLinking(false);
    }
  };

  const handleCreateDepartment = async (dept) => {
    try {
      const data = { department: dept };
      const response = await createDepartment(data);
      const createdDept = response.data;

      const newOption = {
        label: createdDept.department,
        value: createdDept._id,
      };

      setDepartmentOptions((prev) => [...prev, newOption]);

      form.setFieldValue("department", createdDept._id);

      toast.success("Department created successfully");
    } catch (error) {
      toast.error("Failed to create department");
    } finally {
      fetchDepartment();
    }
  };

  const debouncedFetchUsers = useMemo(
    () =>
      debounce((inputValue, resolve) => {
        if (!inputValue || !token) {
          resolve([]);
          return;
        }
        getAllUsers({
          search: inputValue,
          limit: 10,
          token,
          centerAccess,
        })
          .then((response) => {
            resolve(
              (response?.data?.data || []).map((user) => ({
                value: user._id,
                label: `${user.name} (${user.email})`,
              })),
            );
          })
          .catch((error) => {
            resolve([]);
          });
      }, 500),
    [token, centerAccess],
  );

  const loadUserOptions = (inputValue) => {
    return new Promise((resolve) => {
      debouncedFetchUsers(inputValue, resolve);
    });
  };

  const payrollInitializedRef = useRef(false);

  useEffect(() => {
    if (simplified) return;
    const selectedCenter = centerOptions?.find(
      (o) => o.value === (values.firstLocation || values.currentLocation),
    );
    // values holds YEARLY amounts; calculatePayroll is monthly, so feed it the
    // monthly equivalents (the derived fields it returns are therefore monthly).
    const payroll = calculatePayroll({
      ...values,
      ...annualToMonthly(values),
      pfApplicable: isPfApplicable(values),
      currentLocation: selectedCenter
        ? { title: selectedCenter.title, address: selectedCenter.address }
        : null,
    });

    const isFirstRunInEdit = isEdit && !payrollInitializedRef.current;
    payrollInitializedRef.current = true;

    Object.entries(payroll).forEach(([key, value]) => {
      if (isFirstRunInEdit && values[key]) return;
      if (values[key] !== value) {
        setFieldValue(key, value, false);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    values.grossSalary,
    values.basicAmount,
    values.HRAAmount,
    values.newEmploymentType,
    values.category,
    values.gender,
    values.joinningDate,
    values.ESICSalary,
    values.ESICEmployee,
    values.LWFEmployee,
    values.TDSRate,
    values.insurance,
    values.variable,
    values.reimbursement,
    values.minimumWages,
    values.currentLocation,
    values.firstLocation,
    values.LWFEmployer,
    simplified,
  ]);

  useEffect(() => {
    if (simplified) return;
    const total =
      Number(values.basicAmount || 0) +
      Number(values.HRAAmount || 0) +
      Number(values.SPLAllowance || 0) +
      Number(values.conveyanceAllowance || 0) +
      Number(values.statutoryBonus || 0);
    if (Number(values.grossSalary || 0) !== total) {
      setFieldValue("grossSalary", total, true);
    }
  }, [
    values.basicAmount,
    values.HRAAmount,
    values.SPLAllowance,
    values.conveyanceAllowance,
    values.statutoryBonus,
    values.grossSalary,
    setFieldValue,
    simplified,
  ]);

  // LWF is derived from the work-location's state + monthly wage base, never
  // entered by hand. The stored yearly figure is the TRUE annual (sum of the
  // applicable months), not a monthly amount × 12 — most states only charge LWF
  // in one or two months.
  const lwfState = useMemo(() => {
    const selectedCenter = centerOptions?.find(
      (o) => o.value === (values.firstLocation || values.currentLocation),
    );
    return resolveLWFState(
      selectedCenter
        ? { title: selectedCenter.title, address: selectedCenter.address }
        : null,
    );
  }, [centerOptions, values.currentLocation, values.firstLocation]);

  // LWF is charged only in specific months, so its true yearly total is NOT the
  // monthly charge × 12. Mirror the server's applyAnnualLWF so the yearly In-Hand
  // / Deductions / CTC boxes match the persisted `annual` block (lumpy-LWF states
  // like Tamil Nadu / Maharashtra / Gujarat / Karnataka).
  {
    const lwfMonthlyGross = annualToMonthly(values).grossSalary;
    const lwfMonthly = lwfPerMonth(lwfState, lwfMonthlyGross);
    const lwfYearly = lwfAnnual(lwfState, lwfMonthlyGross);
    const annualRollup = {
      deductions: deductionsYearly,
      inHandSalary: inHandYearly,
      totalCostToCompany: ctcYearly,
    };
    applyAnnualLWF(annualRollup, lwfMonthly, lwfYearly);
    deductionsYearly = annualRollup.deductions;
    ctcYearly = annualRollup.totalCostToCompany;
    inHandYearly = annualRollup.inHandSalary;
  }

  useEffect(() => {
    if (simplified) return;
    const monthlyGross = annualToMonthly(values).grossSalary;
    const annual = lwfAnnual(lwfState, monthlyGross);

    if (Number(values.LWFEmployee) !== annual.employee)
      setFieldValue("LWFEmployee", annual.employee, false);
    if (Number(values.LWFEmployer) !== annual.employer)
      setFieldValue("LWFEmployer", annual.employer, false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    lwfState,
    values.basicAmount,
    values.HRAAmount,
    values.SPLAllowance,
    values.conveyanceAllowance,
    values.statutoryBonus,
    simplified,
    setFieldValue,
  ]);

  const selectedEmploymentOption =
    employmentOptions.find(
      (opt) => opt.value === values.employmentType?.trim().toUpperCase(),
    ) ||
    (values.employmentType
      ? {
          label: values.employmentType,
          value: values.employmentType?.trim().toUpperCase(),
        }
      : null);

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const res = await getPositions();
        const rawData = res?.data || [];

        const mapped = rawData.flatMap((p) =>
          (p.positions || [])
            .filter((pos) => !pos.deleted && pos.version === 2)
            .map((pos) => ({
              label: pos.name,
              value: pos._id.toString(),
              outerDocId: p._id.toString(),
              department: p.department?.department,
              departmentId: p.department?._id,
            })),
        );

        mapped.sort((a, b) =>
          a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
        );

        setPositionOptions(mapped);

        if (
          isEdit &&
          initialData?.position?.name &&
          !positionCorrectedRef.current
        ) {
          const matched = mapped.find(
            (opt) => opt.label === initialData.position.name,
          );
          if (matched) {
            positionCorrectedRef.current = true;
            setFieldValue("position", matched.value);
            if (matched.departmentId) {
              setFieldValue("department", matched.departmentId);
            }
          }
        }

        const deptsMapped = rawData
          .filter((p) => p.department?._id)
          .map((p) => ({
            label: p.department?.department,
            value: p.department?._id,
          }));

        setDepartmentOptions((prev) => {
          const existingValues = new Set(prev.map((o) => o.value));
          const newOnes = deptsMapped.filter(
            (d) => !existingValues.has(d.value),
          );
          return [...prev, ...newOnes];
        });
      } catch (error) {
        if (!handleAuthError(error)) {
          toast.error("Failed to fetch positions");
        }
      }
    };

    fetchPositions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchDocConfigForPosition = async () => {
      if (!values.position) {
        setDocConfigForPosition([]);
        return;
      }
      setPositionDocsLoading(true);
      try {
        const res = await getEmployeeDocsConfiguration(values.position);
        setDocConfigForPosition(res?.data || []);
      } catch (error) {
        if (!handleAuthError(error)) {
          toast.error("Failed to fetch required documents for this position");
        }
      } finally {
        setPositionDocsLoading(false);
      }
    };

    fetchDocConfigForPosition();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.position]);

  const fetchEmployeeUploads = async () => {
    if (!isEdit || !initialData?._id) {
      setEmployeeUploads([]);
      return;
    }
    try {
      const res = await getEmployeeDocumentsByEmployeeId(initialData._id);
      setEmployeeUploads(res?.data || []);
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error("Failed to fetch existing documents");
      }
    }
  };

  useEffect(() => {
    fetchEmployeeUploads();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, initialData?._id]);

  const openDeleteExistingFile = (documentId, file) => {
    setSelectedDeleteFile({
      documentId,
      fileId: file._id,
      fileName: file.fileName,
    });
    setDeleteModalOpen(true);
  };

  const handleExistingFileDeleteSuccess = () => {
    fetchEmployeeUploads();
  };
  return (
    <>
      <div>
        {!tabsEnabled ? (
        <>
        <Row className="g-3 mx-2">
          {/* EMPLOYEE CODE */}
          {mode !== "NEW_JOINING" && (
            <Col md={6}>
              <Label htmlFor="eCode">ECode</Label>

              <div className="position-relative">
                <Input
                  name="eCode"
                  id="eCode"
                  disabled
                  value={values.eCode}
                  onChange={handleChange}
                  invalid={touched.eCode && errors.eCode}
                  style={{ paddingRight: eCodeLoader ? "2.5rem" : undefined }}
                />

                {eCodeLoader && (
                  <Spinner
                    size="sm"
                    color="primary"
                    className="position-absolute"
                    style={{
                      right: "10px",
                      top: "35%",
                    }}
                  />
                )}
              </div>

              {errorText("eCode")}
            </Col>
          )}
          <Col md={6}>
            <Label htmlFor="name">
              Employee Name <span className="text-danger">*</span>
            </Label>
            <Input
              name="name"
              id="name"
              value={values.name}
              onChange={handleChange}
              invalid={touched.name && errors.name}
              onBlur={() => setFieldTouched("name", true)}
            />
            {errorText("name")}
          </Col>

          {/* DEPARTMENT
          <Col md={6}>
            <Label htmlFor="department">
              Department <span className="text-danger">*</span>
            </Label>
            <CreatableSelect
              inputId="department"
              placeholder="Auto-filled from position"
              isClearable
              isSearchable
              isDisabled={!!values.position}
              options={departmentOptions}
              value={
                departmentOptions.find(
                  (opt) => opt.value === values.department,
                ) || null
              }
              onChange={(option) => {
                form.setFieldValue("department", option ? option.value : "");
              }}
              onBlur={() => setFieldTouched("department", true)}
              onCreateOption={(inputValue) => {
                handleCreateDepartment(inputValue);
              }}
            />
            {errorText("department")}
          </Col> */}

          {/* DESIGNATION */}
          <Col md={6}>
            <Label htmlFor="designation">
              Designation <span className="text-danger">*</span>
            </Label>
            <Select
              inputId="designation"
              placeholder="Select designation"
              isClearable
              isDisabled={
                designationLoading
                // ||
                // (mode === "NEW_JOINING" && !hasCreatePermission)
              }
              isLoading={
                designationLoading
                // || creatingDesignation
              }
              options={sortedDesignationOptions}
              value={
                designationOptions.find(
                  (opt) => opt.value === values.designation,
                ) || null
              }
              onChange={(option) =>
                form.setFieldValue("designation", option ? option.value : "")
              }
              onBlur={() => setFieldTouched("designation", true)}
              // onCreateOption={handleCreateDesignation}
            />

            {errorText("designation")}
          </Col>

          {/* COMPANY */}
          <Col md={6}>
            <Label htmlFor="company">
              Company <span className="text-danger">*</span>
            </Label>
            <Select
              inputId="company"
              placeholder="Select company"
              isClearable
              options={companyOptions}
              value={
                companyOptions.find((opt) => opt.value === values.company) ||
                null
              }
              onChange={(option) => {
                form.setFieldValue("company", option ? option.value : "");
                if (!initialData?._id && mode !== "NEW_JOINING") {
                  if (option) {
                    generateEmployeeId(option.ecodePrefix);
                  } else {
                    form.setFieldValue("eCode", "");
                  }
                }
              }}
              onBlur={() => setFieldTouched("company", true)}
            />
            {errorText("company")}
          </Col>
          {/* EMPLOYEE TYPE */}
          <Col md={6}>
            <Label htmlFor="employmentType">
              Employee Type <span className="text-danger">*</span>
            </Label>

            <Select
              inputId="employmentType"
              placeholder="Select Employee Type"
              options={employmentOptions}
              value={selectedEmploymentOption}
              onChange={(opt) =>
                form.setFieldValue("employmentType", opt ? opt.value : "")
              }
              onBlur={() => setFieldTouched("employmentType", true)}
              isDisabled={
                isEdit &&
                initialData?.employmentType?.trim().toUpperCase() === "VENDOR"
              }
            />

            {errorText("employmentType")}
          </Col>
          {/* EMPLOYEMENT TYPE */}
          <Col md={6}>
            <Label htmlFor="newEmploymentType">
              Employment Type
              {/* <span className="text-danger">*</span> */}
            </Label>
            <Select
              inputId="newEmploymentType"
              placeholder="Select Employement Type"
              options={newEmploymentOptions}
              value={
                newEmploymentOptions.find(
                  (opt) => opt.value === values.newEmploymentType,
                ) || null
              }
              onChange={(opt) =>
                form.setFieldValue("newEmploymentType", opt ? opt.value : "")
              }
              onBlur={() => setFieldTouched("newEmploymentType", true)}
              isClearable
            />
            {errorText("newEmploymentType")}
          </Col>
          {/* MINIMUM WORK HOURS — visible only for Part Time */}
          {values.newEmploymentType === "PART_TIME" && (
            <Col md={6}>
              <Label htmlFor="minimumWorkHours">
                Minimum Work Hours
                {values.minimumPresentUnit === "SESSION" &&
                  " (per session)"}{" "}
                <span className="text-danger">*</span>
              </Label>
              {(() => {
                const isEmpty =
                  values.minimumWorkHours === "" ||
                  values.minimumWorkHours == null;
                const totalMinutes = isEmpty
                  ? 0
                  : Number(values.minimumWorkHours);
                const hoursPart = Math.floor(totalMinutes / 60);
                const minutesPart = totalMinutes % 60;
                const invalid =
                  touched.minimumWorkHours && !!errors.minimumWorkHours;
                return (
                  <div
                    className="d-flex align-items-center"
                    style={{ gap: "8px" }}
                  >
                    <Input
                      id="minimumWorkHours"
                      type="number"
                      min={0}
                      max={24}
                      step={1}
                      value={isEmpty ? "" : hoursPart}
                      onChange={(e) => {
                        const h =
                          e.target.value === ""
                            ? 0
                            : parseInt(e.target.value, 10) || 0;
                        setFieldValue("minimumWorkHours", h * 60 + minutesPart);
                      }}
                      onBlur={() => setFieldTouched("minimumWorkHours", true)}
                      placeholder="HH"
                      invalid={invalid}
                      style={{ width: "80px" }}
                    />
                    <span className="fw-bold">:</span>
                    <Input
                      id="minimumWorkMinutes"
                      type="number"
                      min={0}
                      max={59}
                      step={1}
                      value={isEmpty ? "" : minutesPart}
                      onChange={(e) => {
                        let m =
                          e.target.value === ""
                            ? 0
                            : parseInt(e.target.value, 10) || 0;
                        if (m > 59) m = 59;
                        if (m < 0) m = 0;
                        setFieldValue("minimumWorkHours", hoursPart * 60 + m);
                      }}
                      onBlur={() => setFieldTouched("minimumWorkHours", true)}
                      placeholder="MM"
                      invalid={invalid}
                      style={{ width: "80px" }}
                    />
                    <span className="text-muted small">hours : minutes</span>
                  </div>
                );
              })()}
              {values.minimumWorkHours !== "" &&
                values.minimumWorkHours != null && (
                  <div className="text-muted small mt-1">
                    = {minutesToHHMM(values.minimumWorkHours)} hours (
                    {Math.round(Number(values.minimumWorkHours))} minutes)
                  </div>
                )}
              {errorText("minimumWorkHours")}
            </Col>
          )}
          {/* MINIMUM PRESENT DAYS — visible only for Part Time */}
          {values.newEmploymentType === "PART_TIME" && (
            <Col md={6}>
              <Label htmlFor="minimumPresentDays">
                {values.minimumPresentUnit === "SESSIONS"
                  ? "Number of Sessions"
                  : "Minimum Presence"}
                {values.minimumPresentUnit !== "SESSION" && (
                  <span className="text-danger"> *</span>
                )}
              </Label>
              <div className="d-flex" style={{ gap: "8px" }}>
                {values.minimumPresentUnit !== "SESSION" && (
                  <div style={{ flex: 1 }}>
                    <Input
                      id="minimumPresentDays"
                      type="number"
                      name="minimumPresentDays"
                      min={0}
                      max={values.minimumPresentUnit === "WEEK" ? 7 : 31}
                      value={values.minimumPresentDays}
                      onChange={handleChange}
                      onBlur={() => setFieldTouched("minimumPresentDays", true)}
                      placeholder={
                        values.minimumPresentUnit === "SESSIONS"
                          ? "Enter number of sessions"
                          : "Enter number of days"
                      }
                      invalid={
                        touched.minimumPresentDays &&
                        !!errors.minimumPresentDays
                      }
                    />
                  </div>
                )}
                <div
                  style={{
                    width:
                      values.minimumPresentUnit === "SESSION"
                        ? "100%"
                        : "160px",
                  }}
                >
                  <Select
                    inputId="minimumPresentUnit"
                    placeholder="Select unit"
                    options={presentUnitOptions}
                    value={
                      presentUnitOptions.find(
                        (opt) => opt.value === values.minimumPresentUnit,
                      ) || null
                    }
                    onChange={(opt) =>
                      form.setFieldValue(
                        "minimumPresentUnit",
                        opt ? opt.value : "",
                      )
                    }
                    onBlur={() => setFieldTouched("minimumPresentUnit", true)}
                    isClearable
                  />
                </div>
              </div>
              {values.minimumPresentUnit === "SESSION" ? (
                <div className="text-muted small mt-1">
                  Requirement is measured per session — set the hours in Minimum
                  Work Hours above.
                </div>
              ) : values.minimumPresentUnit === "SESSIONS" ? (
                values.minimumPresentDays !== "" && (
                  <div className="text-muted small mt-1">
                    = {values.minimumPresentDays} session
                    {Number(values.minimumPresentDays) === 1 ? "" : "s"} per
                    month
                  </div>
                )
              ) : (
                values.minimumPresentDays !== "" &&
                values.minimumPresentUnit && (
                  <div className="text-muted small mt-1">
                    = {values.minimumPresentDays} day
                    {Number(values.minimumPresentDays) === 1
                      ? ""
                      : "s"} per{" "}
                    {values.minimumPresentUnit === "WEEK" ? "week" : "month"}
                  </div>
                )
              )}
              {errorText("minimumPresentDays")}
              {errorText("minimumPresentUnit")}
            </Col>
          )}
          {/* EMPLOYMENT STATUS */}
          <Col md={6}>
            <Label htmlFor="employmentStatus">
              Employment Status
              {/* <span className="text-danger">*</span> */}
            </Label>
            <Select
              inputId="employmentStatus"
              placeholder="Select Employment Status"
              options={employmentStatus}
              value={
                employmentStatus.find(
                  (opt) => opt.value === values.employmentStatus,
                ) || null
              }
              onChange={(opt) =>
                form.setFieldValue("employmentStatus", opt ? opt.value : "")
              }
              onBlur={() => setFieldTouched("employmentStatus", true)}
              isClearable
            />
            {errorText("employmentStatus")}
          </Col>
          {/* CATEGORY */}
          <Col md={6}>
            <Label htmlFor="category">Category</Label>
            <Select
              inputId="category"
              placeholder="Select Category"
              options={categoryOptions}
              value={
                categoryOptions.find((opt) => opt.value === values.category) ||
                null
              }
              onChange={(opt) => {
                const category = opt ? opt.value : "";
                form.setFieldValue("category", category);
                // Consultant / Form 11 are never on PF — pick "NO" for the user.
                if (NON_PF_CATEGORIES.includes(category)) {
                  form.setFieldValue("pfApplicable", false);
                }
              }}
              onBlur={() => setFieldTouched("category", true)}
              isClearable
            />
            {errorText("category")}
          </Col>
          {/* POSITION */}
          <Col md={6}>
            <Label htmlFor="position">
              Position <span className="text-danger">*</span>
            </Label>
            <Select
              inputId="position"
              placeholder="Select Position"
              options={positionOptions}
              value={
                positionOptions.find(
                  (opt) =>
                    opt.value?.toString() === values.position?.toString(),
                ) ||
                (!positionCorrectedRef.current
                  ? positionOptions.find(
                      (opt) => opt.label === initialData?.position?.name,
                    )
                  : null) ||
                null
              }
              onChange={(opt) => {
                form.setFieldValue("position", opt ? opt.value : "");
                if (opt?.departmentId) {
                  form.setFieldValue("department", opt.departmentId);
                  form.setFieldTouched("department", true, false);
                } else {
                  form.setFieldValue("department", "");
                }
              }}
              onBlur={() => setFieldTouched("position", true)}
              isClearable
            />
            {errorText("position")}
          </Col>
          {/* DEPARTMENT */}
          <Col md={6}>
            <Label htmlFor="department">
              Department <span className="text-danger">*</span>
            </Label>
            <CreatableSelect
              inputId="department"
              placeholder="Select Position"
              isClearable
              isSearchable
              isDisabled={true}
              options={sortedDepartmentOptions}
              value={
                departmentOptions.find(
                  (opt) => opt.value === values.department,
                ) || null
              }
              onChange={(option) => {
                form.setFieldValue("department", option ? option.value : "");
              }}
              onBlur={() => setFieldTouched("department", true)}
              onCreateOption={(inputValue) => {
                handleCreateDepartment(inputValue);
              }}
            />
            {errorText("department")}
          </Col>
          {/* FIRST LOCATION */}
          <Col md={6}>
            <Label htmlFor="firstLocation">
              First Location <span className="text-danger">*</span>
            </Label>
            <Select
              inputId="firstLocation"
              options={centerOptions}
              value={
                values.firstLocation
                  ? centerOptions.find((o) => o.value === values.firstLocation)
                  : null
              }
              onChange={(opt) => setFieldValue("firstLocation", opt.value)}
              onBlur={() => setFieldTouched("firstLocation", true)}
            />
            {errorText("firstLocation")}
          </Col>
          {/* TRANSFERRED FROM */}
          {mode !== "NEW_JOINING" && (
            <Col md={6}>
              <Label htmlFor="transferredFrom">Transferred From</Label>
              <Select
                inputId="transferredFrom"
                options={centerOptions}
                value={
                  values.transferredFrom
                    ? centerOptions.find(
                        (o) => o.value === values.transferredFrom,
                      )
                    : null
                }
                onChange={(opt) => setFieldValue("transferredFrom", opt.value)}
              />
            </Col>
          )}
          {/* CURRENT LOCATION */}
          <Col md={6}>
            <Label htmlFor="currentLocation">
              Current Location <span className="text-danger">*</span>
            </Label>
            <Select
              inputId="currentLocation"
              options={centerOptions}
              value={
                values.currentLocation
                  ? centerOptions.find(
                      (o) => o.value === values.currentLocation,
                    )
                  : null
              }
              onChange={(opt) => setFieldValue("currentLocation", opt.value)}
              onBlur={() => setFieldTouched("currentLocation", true)}
            />
            {errorText("currentLocation")}
          </Col>
          {/* STATE */}
          <Col md={6}>
            <Label htmlFor="state">
              State <span className="text-danger">*</span>
            </Label>

            <Input
              name="state"
              id="state"
              value={values.state}
              onChange={handleChange}
              invalid={touched.state && errors.state}
              onBlur={() => setFieldTouched("state", true)}
            />

            {errorText("state")}
          </Col>
          {/* PAYROLL */}
          <Col md={6}>
            <Label htmlFor="payroll">
              Payroll <span className="text-danger">*</span>
            </Label>
            <Select
              inputId="payroll"
              options={payrollOptions}
              value={
                payrollOptions.find(
                  (opt) => opt.value === values.payrollType,
                ) || null
              }
              onChange={(opt) => setFieldValue("payrollType", opt.value)}
              onBlur={() => setFieldTouched("payrollType", true)}
            />
            {errorText("payrollType")}
          </Col>
          {/* DATE OF JOINING */}
          <Col md={6}>
            <Label htmlFor="joinningDate">
              Date of Joining <span className="text-danger">*</span>
            </Label>
            <Flatpickr
              className={`form-control ${touched.joinningDate && errors.joinningDate ? "is-invalid" : ""}`}
              id="joinningDate"
              name="joinningDate"
              value={values.joinningDate}
              onChange={([date]) => {
                setFieldValue(
                  "joinningDate",
                  date ? format(date, "yyyy-MM-dd") : "",
                );
              }}
              options={{
                dateFormat: "Y-m-d",
                maxDate: "today",
              }}
            />
            {errorText("joinningDate")}
          </Col>
          {/* EXIT DATE */}
          <Col md={6}>
            <Label htmlFor="exitDate">Last Working Day</Label>
            <Flatpickr
              className={`form-control ${touched.exitDate && errors.exitDate ? "is-invalid" : ""}`}
              id="exitDate"
              name="exitDate"
              value={values.exitDate}
              onChange={([date]) => {
                setFieldValue(
                  "exitDate",
                  date ? format(date, "yyyy-MM-dd") : "",
                );
              }}
              options={{
                dateFormat: "Y-m-d",
              }}
            />
          </Col>
          {/* STATUS */}
          {mode !== "NEW_JOINING" && (
            <Col md={6}>
              <Label htmlFor="status">
                Status <span className="text-danger">*</span>
              </Label>
              <Select
                inputId="status"
                options={statusOptions}
                value={
                  statusOptions.find((opt) => opt.value === values.status) ||
                  null
                }
                onChange={(opt) => setFieldValue("status", opt.value)}
                isDisabled={isEdit && initialData?.status === "FNF_CLOSED"}
                onBlur={() => setFieldTouched("status", true)}
              />
              {errorText("status")}
            </Col>
          )}
          {/* GENDER */}
          <Col md={6}>
            <Label htmlFor="gender">
              Gender <span className="text-danger">*</span>
            </Label>
            <Select
              inputId="gender"
              options={employeeGenderOptions}
              value={
                employeeGenderOptions.find(
                  (opt) => opt.value === values.gender,
                ) || null
              }
              onChange={(opt) => setFieldValue("gender", opt.value)}
              onBlur={() => setFieldTouched("gender", true)}
            />
            {errorText("gender")}
          </Col>
          {/* DOB */}
          <Col md={6}>
            <Label htmlFor="dob">
              Date of Birth <span className="text-danger">*</span>
            </Label>
            <Flatpickr
              className={`form-control ${touched.dateOfBirth && errors.dateOfBirth ? "is-invalid" : ""}`}
              id="dob"
              name="dateOfBirth"
              value={values.dateOfBirth}
              onChange={async ([date]) => {
                await setFieldValue(
                  "dateOfBirth",
                  date ? format(date, "yyyy-MM-dd") : "",
                );
                await setFieldTouched("dateOfBirth", true, false);
                await validateForm();
              }}
              options={{
                dateFormat: "Y-m-d",
                maxDate: "today",
              }}
            />
            {errorText("dateOfBirth")}
          </Col>
          {/* BANK NAME */}
          <Col md={6}>
            <Label htmlFor="bankName">
              Bank Name <span className="text-danger">*</span>
            </Label>
            <Input
              id="bankName"
              name="bankName"
              value={values.bankName}
              onChange={handleChange}
              invalid={touched.bankName && errors.bankName}
              onBlur={() => setFieldTouched("bankName", true)}
            />
            {errorText("bankName")}
          </Col>
          {/* BANK ACCOUNT */}
          <Col md={6}>
            <Label htmlFor="accountNo">
              Bank Account No <span className="text-danger">*</span>
            </Label>
            <Input
              id="accountNo"
              name="accountNo"
              value={values.accountNo}
              onChange={handleChange}
              invalid={touched.accountNo && errors.accountNo}
              onBlur={() => setFieldTouched("accountNo", true)}
            />
            {errorText("accountNo")}
          </Col>
          {/* BENIFICIARY NAME */}
          <Col md={6}>
            <Label htmlFor="accountHolderName">
              Account Holder's Name <span className="text-danger">*</span>
            </Label>
            <Input
              id="accountHolderName"
              name="accountName"
              value={values.accountName}
              onChange={handleChange}
              invalid={touched.accountName && errors.accountName}
              onBlur={() => setFieldTouched("accountName", true)}
            />
            {errorText("accountName")}
          </Col>
          {/* IFSC */}
          <Col md={6}>
            <Label htmlFor="IFSCCode">
              IFSC Code <span className="text-danger">*</span>
            </Label>
            <Input
              id="IFSCCode"
              name="IFSCCode"
              value={values.IFSCCode}
              onChange={handleChange}
              invalid={touched.IFSCCode && errors.IFSCCode}
              onBlur={() => setFieldTouched("IFSCCode", true)}
            />
            {errorText("IFSCCode")}
          </Col>
          {/* PF APPLICABLE */}
          <Col md={6}>
            <Label htmlFor="pfApplicable">
              PF Available <span className="text-danger">*</span>
            </Label>
            <Select
              inputId="pfApplicable"
              options={[
                { value: true, label: "YES" },
                { value: false, label: "NO" },
              ]}
              value={
                values.pfApplicable === true
                  ? { value: true, label: "YES" }
                  : values.pfApplicable === false
                    ? { value: false, label: "NO" }
                    : null
              }
              onChange={(opt) => setFieldValue("pfApplicable", opt.value)}
              onBlur={() => setFieldTouched("pfApplicable", true)}
              isDisabled={NON_PF_CATEGORIES.includes(values.category)}
            />
            {errorText("pfApplicable")}
          </Col>
          {/* UAN NO */}
          <Col md={6}>
            <Label htmlFor="uanNo">
              UAN No{" "}
              {values.pfApplicable === true && (
                <span className="text-danger">*</span>
              )}
            </Label>
            <Input
              id="uanNo"
              name="uanNo"
              value={values.uanNo}
              onChange={handleChange}
              invalid={touched.uanNo && !!errors.uanNo}
              onBlur={() => setFieldTouched("uanNo", true)}
            />
            {errorText("uanNo")}
          </Col>
          {/* PF NO */}
          <Col md={6}>
            <Label htmlFor="pfNo">PF No</Label>
            <Input
              id="pfNo"
              name="pfNo"
              value={values.pfNo}
              onChange={handleChange}
              // invalid={touched.pfNo && !!errors.pfNo}
              onBlur={() => setFieldTouched("pfNo", true)}
            />
            {/* {errorText("pfNo")} */}
          </Col>
          {/* ESIC */}
          <Col md={6}>
            <Label htmlFor="esicIpCode">ESIC IP Code</Label>
            <Input
              id="esicIpCode"
              name="esicIpCode"
              value={values.esicIpCode}
              onChange={handleChange}
            />
          </Col>
          {/* AADHAAR NO*/}
          <Col md={6}>
            <Label htmlFor="adharNo">
              Aadhaar No{" "}
              {!isNonAadhaar && <span className="text-danger">*</span>}
            </Label>
            <Input
              id="adharNo"
              name="adharNo"
              value={values.adharNo}
              onChange={handleChange}
              invalid={touched.adharNo && errors.adharNo}
              onBlur={() => setFieldTouched("adharNo", true)}
            />
            {errorText("adharNo")}
          </Col>
          {/* ADHAAR FILE */}
          <Col md={6}>
            <Label>
              Aadhaar File{" "}
              {!isNonAadhaar && <span className="text-danger">*</span>}
            </Label>

            <input
              type="file"
              hidden
              ref={adharFileRef}
              accept="image/*,application/pdf"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;

                await handleFileUpload({
                  file,
                  path: "EMPLOYEE_ADHAR",
                  urlField: "adharOld",
                  fileField: "adharFile",
                });
              }}
            />

            {values.adharOld ? (
              <div className="d-flex gap-2 mt-2">
                <Button
                  size="sm"
                  color="info"
                  onClick={() =>
                    handleFilePreview(
                      {
                        url: values.adharOld,
                        originalName: "Aadhaar",
                      },
                      "adharOld",
                    )
                  }
                  disabled={uploading.adharFile}
                >
                  {getFileActionLabel(
                    {
                      url: values.adharOld,
                      originalName: "Aadhaar",
                    },
                    "adharOld",
                  )}
                </Button>

                <Button
                  size="sm"
                  onClick={() => adharFileRef.current.click()}
                  disabled={uploading.adharFile}
                >
                  {uploading.adharFile ? (
                    <>
                      <Spinner size="sm" className="me-1" /> Uploading
                    </>
                  ) : (
                    "Upload new file"
                  )}
                </Button>
              </div>
            ) : (
              <div className="d-block">
                <Button
                  size="sm"
                  onClick={() => adharFileRef.current.click()}
                  disabled={uploading.adharFile}
                >
                  {uploading.adharFile ? (
                    <>
                      <Spinner size="sm" className="me-1" /> Uploading
                    </>
                  ) : (
                    "Upload file"
                  )}
                </Button>
              </div>
            )}

            {errorText("adharOld")}
          </Col>
          {/* PAN NO*/}
          <Col md={6}>
            <Label htmlFor="pan">
              PAN No{!isNonAadhaar && <span className="text-danger">*</span>}
            </Label>

            <Input
              id="pan"
              name="pan"
              value={values.pan}
              onChange={(e) => {
                setFieldValue("pan", e.target.value.toUpperCase());
              }}
              invalid={touched.pan && errors.pan}
              onBlur={() => setFieldTouched("pan", true)}
            />
            {errorText("pan")}
          </Col>
          {/* PAN FILE */}
          <Col md={6}>
            <Label>
              PAN File{" "}
              {!isNonAadhaar && <span className="text-danger">*</span>}
            </Label>

            <input
              type="file"
              hidden
              ref={panFileRef}
              accept="image/*,application/pdf"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";

                await handleFileUpload({
                  file,
                  path: "EMPLOYEE_PAN",
                  urlField: "panOld",
                  fileField: "panFile",
                });
              }}
            />

            {values.panOld ? (
              <div className="d-flex gap-2 mt-2">
                <Button
                  size="sm"
                  color="info"
                  onClick={() =>
                    handleFilePreview(
                      {
                        url: values.panOld,
                        originalName: "Pan",
                      },
                      "panOld",
                    )
                  }
                  disabled={uploading.panFile}
                >
                  {getFileActionLabel(
                    {
                      url: values.panOld,
                      originalName: "Pan",
                    },
                    "panOld",
                  )}
                </Button>

                <Button
                  size="sm"
                  onClick={() => panFileRef.current.click()}
                  disabled={uploading.panFile}
                >
                  {uploading.panFile ? (
                    <>
                      <Spinner size="sm" className="me-1" /> Uploading
                    </>
                  ) : (
                    "Upload New file"
                  )}
                </Button>
              </div>
            ) : (
              <div className="d-block">
                <Button
                  size="sm"
                  onClick={() => panFileRef.current.click()}
                  disabled={uploading.panFile}
                >
                  {uploading.panFile ? (
                    <>
                      <Spinner size="sm" className="me-1" /> Uploading
                    </>
                  ) : (
                    "Upload file"
                  )}
                </Button>
              </div>
            )}

            {errorText("panOld")}
          </Col>
          {/* OFFER LETTER FILE */}
          <Col md={6}>
            <Label>
              Offer Letter <span className="text-danger">*</span>
            </Label>

            <input
              type="file"
              hidden
              ref={offerLetterRef}
              accept="image/*,application/pdf"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;

                await handleFileUpload({
                  file,
                  path: "EMPLOYEE_OFFER_LETTER",
                  urlField: "offerLetterOld",
                  fileField: "offerLetterFile",
                });
              }}
            />

            {values.offerLetterOld ? (
              <div className="d-flex gap-2 mt-2">
                <Button
                  size="sm"
                  color="info"
                  onClick={() =>
                    handleFilePreview(
                      {
                        url: values.offerLetterOld,
                        originalName: "Offerletter",
                      },
                      "offerLetterOld",
                    )
                  }
                  disabled={uploading.offerLetterFile}
                >
                  {getFileActionLabel(
                    {
                      url: values.offerLetterOld,
                      originalName: "Offerletter",
                    },
                    "offerLetterOld",
                  )}
                </Button>

                <Button
                  size="sm"
                  onClick={() => offerLetterRef.current.click()}
                  disabled={uploading.offerLetterFile}
                >
                  {uploading.offerLetterFile ? (
                    <>
                      <Spinner size="sm" className="me-1" /> Uploading
                    </>
                  ) : (
                    "Upload New file"
                  )}
                </Button>
              </div>
            ) : (
              <div className="d-block">
                <Button
                  size="sm"
                  onClick={() => offerLetterRef.current.click()}
                  disabled={uploading.offerLetterFile}
                >
                  {uploading.offerLetterFile ? (
                    <>
                      <Spinner size="sm" className="me-1" /> Uploading
                    </>
                  ) : (
                    "Upload file"
                  )}
                </Button>
              </div>
            )}

            {errorText("offerLetterOld")}
          </Col>
          {/* FATHER NAME */}
          <Col md={6}>
            <Label htmlFor="father">
              Father's Name <span className="text-danger">*</span>
            </Label>
            <Input
              id="father"
              name="father"
              value={values.father}
              onChange={handleChange}
              invalid={touched.father && errors.father}
              onBlur={() => setFieldTouched("father", true)}
            />
            {errorText("father")}
          </Col>
          {/* MOBILE */}
          <Col md={6}>
            <Label htmlFor="mobile">
              Mobile No <span className="text-danger">*</span>
            </Label>

            <PhoneInputWithCountrySelect
              name="mobile"
              id="mobile"
              min="10"
              value={values.mobile}
              onChange={(value) =>
                handleChange({
                  target: {
                    name: "mobile",
                    value: value,
                  },
                })
              }
              limitMaxLength={true}
              defaultCountry="IN"
              className="w-100"
              style={{
                width: "100%",
                height: "42px",
                padding: "0.5rem 0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.375rem",
                fontSize: "1rem",
              }}
              onBlur={() => setFieldTouched("mobile", true)}
            />

            {errorText("mobile")}
          </Col>
          {/* OFFICIAL EMAIL */}
          <Col md={6}>
            <Label htmlFor="officialEmail">Official Email</Label>
            <Input
              id="officialEmail"
              type="email"
              name="officialEmail"
              value={values.officialEmail}
              onChange={handleChange}
            />
          </Col>
          {/* EMAIL */}
          <Col md={6}>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              name="email"
              value={values.email}
              onChange={handleChange}
            />
          </Col>
          {/* MONTHLY CTC — input removed; kept for reference
          <Col md={6}>
            <Label htmlFor="monthlyCTC">Monthly CTC</Label>
            <Input
              id="monthlyCTC"
              type="number"
              name="monthlyCTC"
              value={values.monthlyCTC}
              onChange={handleChange}
            />
          </Col>
          */}
          {/* BIOMETRIC ID */}
          <Col md={6}>
            <Label htmlFor="biometricId">Biometric ID</Label>
            <Input
              id="biometricId"
              type="number"
              name="biometricId"
              value={values.biometricId}
              onChange={handleChange}
            />
          </Col>
          {/* LINK USERS */}
          {mode !== "NEW_JOINING" && (
            <Col md={12}>
              <Label htmlFor="users">Link With Associated Users</Label>
              <div className="d-flex flex-column flex-md-row gap-2 align-items-stretch">
                <div className="flex-grow-1">
                  <AsyncSelect
                    inputId="users"
                    isMulti
                    defaultOptions
                    loadOptions={loadUserOptions}
                    placeholder="Search and select users..."
                    value={values.users}
                    onChange={(selectedOptions) =>
                      setFieldValue("users", selectedOptions || [])
                    }
                  />
                </div>
                <div className="d-flex align-items-stretch">
                  <Button
                    color="primary"
                    className="text-white w-100 w-md-auto"
                    onClick={handleLinkUsers}
                    disabled={linking}
                  >
                    {linking ? <Spinner size="sm" /> : "Link"}
                  </Button>
                </div>
              </div>
            </Col>
          )}
        </Row>

        <Col xs={12} className="mt-4">
          <h5 className="fw-semibold mb-1">Other Documents</h5>
          <hr className="mt-0" />
          {missingMandatoryDocs.length > 0 && (
            <p className="text-danger small mb-2">
              Please upload: {missingMandatoryDocs.join(", ")}
            </p>
          )}
        </Col>

        <Row className="g-3 mx-2">
          {positionDocFields.length > 0 ? (
            positionDocsLoading ? (
              <Col xs={12}>
                <Spinner size="sm" className="me-2" /> Loading required
                documents...
              </Col>
            ) : (
              positionDocFields.map((doc) => {
                const files = positionDocFiles[doc.document] || [];
                const existingFiles = doc.files || [];
                const isSatisfied = existingFiles.length > 0;

                return (
                  <Col md={6} key={doc.document}>
                    <Label
                      className="d-block text-truncate"
                      style={{ maxWidth: "100%" }}
                      title={doc.docName}
                    >
                      {doc.docName}
                      {doc.markMandatory && !isSatisfied && (
                        <span className="text-danger ms-1">*</span>
                      )}
                    </Label>

                    {doc.legacy && (
                      <p className="text-muted small mb-2">
                        <i className="ri-information-line me-1" />
                        Retained from a previous position assignment.
                      </p>
                    )}

                    {existingFiles.length > 0 && (
                      <div className="d-flex flex-column gap-2 mb-2">
                        {existingFiles.map((file, index) => (
                          <div
                            key={file._id || index}
                            className="d-flex align-items-center justify-content-between border rounded px-2 py-1"
                          >
                            <span
                              className="text-truncate small"
                              style={{ maxWidth: 180 }}
                            >
                              {file.fileName}
                            </span>
                            <div className="d-flex gap-1">
                              <Button
                                size="sm"
                                color="info"
                                onClick={() =>
                                  handleFilePreview(
                                    {
                                      url: file.fileUrl,
                                      originalName: file.fileName,
                                    },
                                    `positionDoc.${doc.document}.${file._id || index}`,
                                  )
                                }
                              >
                                {getFileActionLabel(
                                  {
                                    url: file.fileUrl,
                                    originalName: file.fileName,
                                  },
                                  `positionDoc.${doc.document}.${file._id || index}`,
                                )}
                              </Button>
                              {!doc.legacy && (
                                <Button
                                  size="sm"
                                  color="outline-danger"
                                  onClick={() =>
                                    openDeleteExistingFile(doc.document, file)
                                  }
                                >
                                  <i className="ri-close-line" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {!doc.legacy && (
                      <>
                        <input
                          type="file"
                          hidden
                          ref={(el) =>
                            (positionDocFileRefs.current[doc.document] = el)
                          }
                          accept="image/*,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            e.target.value = "";
                            if (!file) return;
                            handlePositionDocSelect(doc.document, file);
                          }}
                        />

                        {files.length > 0 && (
                          <div className="d-flex flex-column gap-2 mb-2">
                            {files.map((file, index) => (
                              <div
                                key={index}
                                className="d-flex align-items-center justify-content-between border rounded px-2 py-1"
                              >
                                <span
                                  className="text-truncate small"
                                  style={{ maxWidth: 220 }}
                                >
                                  {file.name}
                                </span>
                                <Button
                                  size="sm"
                                  color="outline-danger"
                                  onClick={() =>
                                    handlePositionDocRemove(doc.document, index)
                                  }
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        <Button
                          size="sm"
                          onClick={() =>
                            positionDocFileRefs.current[doc.document]?.click()
                          }
                        >
                          {files.length > 0 || existingFiles.length > 0
                            ? "Upload Another File"
                            : "Upload File"}
                        </Button>
                      </>
                    )}
                  </Col>
                );
              })
            )
          ) : (
            <Col xs={12}>
              <p className="text-muted small mb-0">
                {isEdit
                  ? "No additional documents configured for this position."
                  : "Save the employee first, then required documents can be uploaded."}
              </p>
            </Col>
          )}
        </Row>

        <Col xs={12} className="mt-4">
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
                  type="number"
                  name="annualCTC"
                  min={0}
                  value={values.annualCTC}
                  onChange={handleChange}
                  onBlur={() => setFieldTouched("annualCTC", true)}
                  invalid={touched.annualCTC && !!errors.annualCTC}
                />
                {errorText("annualCTC")}
                <div className="text-muted small mt-1">
                  Monthly ≈ ₹
                  {Math.round(
                    (Number(values.annualCTC) || 0) / 12,
                  ).toLocaleString("en-IN")}
                </div>
              </Col>

              {/* IN HAND SALARY (= CTC, auto) */}
              <Col md={6}>
                <Label htmlFor="annualInHandSalary">
                  In Hand Salary (Yearly){" "}
                  <span className="text-danger">*</span>
                </Label>
                <Input
                  id="annualInHandSalary"
                  type="number"
                  name="annualInHandSalary"
                  min={0}
                  value={values.annualInHandSalary}
                  disabled
                  onChange={handleChange}
                  onBlur={() => setFieldTouched("annualInHandSalary", true)}
                  invalid={
                    touched.annualInHandSalary && !!errors.annualInHandSalary
                  }
                />
                {errorText("annualInHandSalary")}
                <div className="text-muted small mt-1">
                  Monthly ≈ ₹
                  {Math.round(
                    (Number(values.annualInHandSalary) || 0) / 12,
                  ).toLocaleString("en-IN")}
                </div>
                <div className="text-muted small">
                  Auto-calculated as Annual CTC.
                </div>
              </Col>

              {/* IS IT AN INCREMENT? — only when editing an existing employee */}
              {mode === "MASTER" && isEdit && (
                <Col md={6}>
                  <Label htmlFor="isIncrement">Is it an increment?</Label>
                  <Select
                    inputId="isIncrement"
                    options={[
                      { label: "No", value: "NO" },
                      { label: "Yes", value: "YES" },
                    ]}
                    value={{
                      label: values.isIncrement === "YES" ? "Yes" : "No",
                      value: values.isIncrement,
                    }}
                    onChange={(opt) =>
                      setFieldValue("isIncrement", opt ? opt.value : "NO")
                    }
                  />
                </Col>
              )}

              {mode === "MASTER" && isEdit && values.isIncrement === "YES" && (
                <Col md={6}>
                  <Label htmlFor="incrementIssued">
                    Increment Issued Date <span className="text-danger">*</span>
                  </Label>
                  <Flatpickr
                    className={`form-control ${errors.incrementIssued ? "is-invalid" : ""}`}
                    id="incrementIssued"
                    name="incrementIssued"
                    value={values.incrementIssued}
                    onChange={([date]) => {
                      setFieldValue(
                        "incrementIssued",
                        date ? format(date, "yyyy-MM-dd") : "",
                      );
                    }}
                    options={{ dateFormat: "Y-m-d" }}
                  />
                  {errorText("incrementIssued")}
                </Col>
              )}

              {/* INCREMENT APPLICABLE DATE */}
              {mode === "MASTER" && isEdit && values.isIncrement === "YES" && (
                <Col md={6}>
                  <Label htmlFor="incrementApplicable">
                    Increment Applicable Date{" "}
                    <span className="text-danger">*</span>
                  </Label>
                  <Flatpickr
                    className={`form-control ${errors.incrementApplicable ? "is-invalid" : ""}`}
                    id="incrementApplicable"
                    name="incrementApplicable"
                    value={values.incrementApplicable}
                    onChange={([date]) => {
                      setFieldValue(
                        "incrementApplicable",
                        date ? format(date, "yyyy-MM-dd") : "",
                      );
                    }}
                    options={{ dateFormat: "Y-m-d" }}
                  />
                  {errorText("incrementApplicable")}
                </Col>
              )}

              {/* INCREMENT LETTER FILE */}
              {mode === "MASTER" && isEdit && values.isIncrement === "YES" && (
                <Col md={6}>
                  <Label>Increment Letter</Label>

                  <input
                    type="file"
                    hidden
                    ref={incrementLetterRef}
                    accept="image/*,application/pdf"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (!file) return;
                      await handleFileUpload({
                        file,
                        path: "EMPLOYEE_INCREMENT_LETTER",
                        urlField: "incrementLetterOld",
                        fileField: "incrementLetterFile",
                      });
                    }}
                  />

                  {values.incrementLetterOld ? (
                    <div className="d-flex gap-2 mt-2">
                      <Button
                        size="sm"
                        color="info"
                        onClick={() =>
                          handleFilePreview(
                            {
                              url: values.incrementLetterOld,
                              originalName: "IncrementLetter",
                            },
                            "incrementLetterOld",
                          )
                        }
                        disabled={uploading.incrementLetterFile}
                      >
                        {getFileActionLabel(
                          {
                            url: values.incrementLetterOld,
                            originalName: "IncrementLetter",
                          },
                          "incrementLetterOld",
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => incrementLetterRef.current.click()}
                        disabled={uploading.incrementLetterFile}
                      >
                        {uploading.incrementLetterFile ? (
                          <>
                            <Spinner size="sm" className="me-1" /> Uploading
                          </>
                        ) : (
                          "Upload New File"
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="d-block">
                      <Button
                        size="sm"
                        onClick={() => incrementLetterRef.current.click()}
                        disabled={uploading.incrementLetterFile}
                      >
                        {uploading.incrementLetterFile ? (
                          <>
                            <Spinner size="sm" className="me-1" /> Uploading
                          </>
                        ) : (
                          "Upload File"
                        )}
                      </Button>
                    </div>
                  )}
                </Col>
              )}
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
                  type="number"
                  name="annualCTC"
                  min={0}
                  value={values.annualCTC}
                  onChange={handleChange}
                  onBlur={() => setFieldTouched("annualCTC", true)}
                  invalid={touched.annualCTC && !!errors.annualCTC}
                />
                {errorText("annualCTC")}
                {!perSession && (
                  <div className="text-muted small mt-1">
                    Monthly ≈ ₹
                    {Math.round(
                      (Number(values.annualCTC) || 0) / 12,
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
                  type="number"
                  name="annualInsurance"
                  min={0}
                  value={values.annualInsurance}
                  onChange={handleChange}
                  onBlur={() => setFieldTouched("annualInsurance", true)}
                  invalid={touched.annualInsurance && !!errors.annualInsurance}
                />
                {errorText("annualInsurance")}
                {!perSession && (
                  <div className="text-muted small mt-1">
                    Monthly ≈ ₹
                    {Math.round(
                      (Number(values.annualInsurance) || 0) / 12,
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
                    type="number"
                    name="TDSRate"
                    min={0}
                    max={100}
                    value={values.TDSRate}
                    disabled
                    onChange={handleChange}
                    onBlur={() => setFieldTouched("TDSRate", true)}
                    invalid={touched.TDSRate && !!errors.TDSRate}
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
                          "en-IN",
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
                  type="number"
                  name="annualInHandSalary"
                  min={0}
                  value={values.annualInHandSalary}
                  disabled
                  onChange={handleChange}
                  onBlur={() => setFieldTouched("annualInHandSalary", true)}
                  invalid={
                    touched.annualInHandSalary && !!errors.annualInHandSalary
                  }
                />
                {errorText("annualInHandSalary")}
                {!perSession && (
                  <div className="text-muted small mt-1">
                    Monthly ≈ ₹
                    {Math.round(
                      (Number(values.annualInHandSalary) || 0) / 12,
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
                      (opt) => opt.value === values.paymentType,
                    ) || null
                  }
                  onChange={(opt) =>
                    setFieldValue("paymentType", opt ? opt.value : "")
                  }
                  onBlur={() => setFieldTouched("paymentType", true)}
                />
                {errorText("paymentType")}
              </Col>
            </>
          )}

          {!ultraSimplifiedFinance && !simplified && (
            <>
              {/* EMPLOYEE GROUPS */}
              <Col md={6}>
                <Label htmlFor="employeeGroups">
                  Employee Group <span className="text-danger">*</span>
                </Label>
                <Select
                  inputId="employeeGroups"
                  options={employeeGroupOptions}
                  value={
                    employeeGroupOptions.find(
                      (opt) => opt.value === values.employeeGroups,
                    ) || null
                  }
                  onChange={(opt) =>
                    setFieldValue("employeeGroups", opt ? opt.value : "")
                  }
                  onBlur={() => setFieldTouched("employeeGroups", true)}
                />
                {errorText("employeeGroups")}
              </Col>

              {/* ACCOUNT */}
              <Col md={6}>
                <Label htmlFor="account">Account</Label>
                <Select
                  inputId="account"
                  options={accountOptions}
                  value={
                    accountOptions.find(
                      (opt) => opt.value === values.account,
                    ) || null
                  }
                  onChange={(opt) =>
                    setFieldValue("account", opt ? opt.value : "")
                  }
                  onBlur={() => setFieldTouched("account", true)}
                />
                {errorText("account")}
              </Col>

              {/* MINIMUM WAGES */}
              <Col md={6}>
                <Label htmlFor="minimumWages">Minimum Wages (Monthly)</Label>
                <Input
                  id="minimumWages"
                  type="number"
                  name="minimumWages"
                  value={values.minimumWages}
                  onChange={handleChange}
                />
              </Col>

              {/* IS IT AN INCREMENT? — only when editing an existing employee */}
              {mode === "MASTER" && isEdit && (
                <Col md={6}>
                  <Label htmlFor="isIncrement">Is it an increment?</Label>
                  <Select
                    inputId="isIncrement"
                    options={[
                      { label: "No", value: "NO" },
                      { label: "Yes", value: "YES" },
                    ]}
                    value={{
                      label: values.isIncrement === "YES" ? "Yes" : "No",
                      value: values.isIncrement,
                    }}
                    onChange={(opt) =>
                      setFieldValue("isIncrement", opt ? opt.value : "NO")
                    }
                  />
                </Col>
              )}

              {mode === "MASTER" && isEdit && values.isIncrement === "YES" && (
                <Col md={6}>
                  <Label htmlFor="incrementIssued">
                    Increment Issued Date <span className="text-danger">*</span>
                  </Label>
                  <Flatpickr
                    className={`form-control ${errors.incrementIssued ? "is-invalid" : ""}`}
                    id="incrementIssued"
                    name="incrementIssued"
                    value={values.incrementIssued}
                    onChange={([date]) => {
                      setFieldValue(
                        "incrementIssued",
                        date ? format(date, "yyyy-MM-dd") : "",
                      );
                    }}
                    options={{ dateFormat: "Y-m-d" }}
                  />
                  {errorText("incrementIssued")}
                </Col>
              )}

              {/* INCREMENT APPLICABLE DATE */}
              {mode === "MASTER" && isEdit && values.isIncrement === "YES" && (
                <Col md={6}>
                  <Label htmlFor="incrementApplicable">
                    Increment Applicable Date{" "}
                    <span className="text-danger">*</span>
                  </Label>
                  <Flatpickr
                    className={`form-control ${errors.incrementApplicable ? "is-invalid" : ""}`}
                    id="incrementApplicable"
                    name="incrementApplicable"
                    value={values.incrementApplicable}
                    onChange={([date]) => {
                      setFieldValue(
                        "incrementApplicable",
                        date ? format(date, "yyyy-MM-dd") : "",
                      );
                    }}
                    options={{ dateFormat: "Y-m-d" }}
                  />
                  {errorText("incrementApplicable")}
                </Col>
              )}

              {/* INCREMENT LETTER FILE */}
              {mode === "MASTER" && isEdit && values.isIncrement === "YES" && (
                <Col md={6}>
                  <Label>Increment Letter</Label>

                  <input
                    type="file"
                    hidden
                    ref={incrementLetterRef}
                    accept="image/*,application/pdf"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (!file) return;
                      await handleFileUpload({
                        file,
                        path: "EMPLOYEE_INCREMENT_LETTER",
                        urlField: "incrementLetterOld",
                        fileField: "incrementLetterFile",
                      });
                    }}
                  />

                  {values.incrementLetterOld ? (
                    <div className="d-flex gap-2 mt-2">
                      <Button
                        size="sm"
                        color="info"
                        onClick={() =>
                          handleFilePreview(
                            {
                              url: values.incrementLetterOld,
                              originalName: "IncrementLetter",
                            },
                            "incrementLetterOld",
                          )
                        }
                        disabled={uploading.incrementLetterFile}
                      >
                        {getFileActionLabel(
                          {
                            url: values.incrementLetterOld,
                            originalName: "IncrementLetter",
                          },
                          "incrementLetterOld",
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => incrementLetterRef.current.click()}
                        disabled={uploading.incrementLetterFile}
                      >
                        {uploading.incrementLetterFile ? (
                          <>
                            <Spinner size="sm" className="me-1" /> Uploading
                          </>
                        ) : (
                          "Upload New File"
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="d-block">
                      <Button
                        size="sm"
                        onClick={() => incrementLetterRef.current.click()}
                        disabled={uploading.incrementLetterFile}
                      >
                        {uploading.incrementLetterFile ? (
                          <>
                            <Spinner size="sm" className="me-1" /> Uploading
                          </>
                        ) : (
                          "Upload File"
                        )}
                      </Button>
                    </div>
                  )}
                </Col>
              )}

              {/* Short WAGES */}
              <Col md={6}>
                <Label htmlFor="shortWages">Short Wages (Monthly)</Label>
                <Input
                  disabled
                  id="shortWages"
                  type="number"
                  name="shortWages"
                  value={values.shortWages}
                />
              </Col>

              {/* GROSS SALARY */}
              <Col md={6}>
                <Label htmlFor="grossSalary">
                  Gross Salary (Yearly) <span className="text-danger">*</span>
                </Label>
                <Input
                  disabled
                  id="grossSalary"
                  type="number"
                  name="grossSalary"
                  value={values.grossSalary}
                />
                {errorText("grossSalary")}
                {monthlyHint("grossSalary")}
              </Col>

              {/* BASIC AMOUNT */}
              <Col md={6}>
                <Label htmlFor="basicAmount">
                  Basic Amount (Yearly) <span className="text-danger">*</span>
                </Label>
                <Input
                  id="basicAmount"
                  type="number"
                  name="basicAmount"
                  value={values.basicAmount}
                  onChange={handleChange}
                />
                {errorText("basicAmount")}
                {monthlyHint("basicAmount")}
              </Col>

              {/* BASIC PERCENTAGE */}
              <Col md={6}>
                <Label htmlFor="basicPercentage">Basic Percentage</Label>
                <Input
                  disabled
                  id="basicPercentage"
                  type="number"
                  name="basicPercentage"
                  value={values.basicPercentage}
                  onChange={handleChange}
                />
                {errorText("basicPercentage")}
              </Col>

              {/* HRA */}
              <Col md={6}>
                <Label htmlFor="HRA">
                  HRA (Yearly) <span className="text-danger">*</span>
                </Label>
                <Input
                  id="HRA"
                  type="number"
                  name="HRAAmount"
                  value={values.HRAAmount}
                  onChange={handleChange}
                />
                {monthlyHint("HRAAmount")}
              </Col>

              {/* HRA PERCENTAGE */}
              <Col md={6}>
                <Label htmlFor="HRAPercentage">HRA Percentage</Label>
                <Input
                  disabled
                  id="HRAPercentage"
                  type="number"
                  name="HRAPercentage"
                  value={values.HRAPercentage}
                  onChange={handleChange}
                />
                {errorText("HRAPercentage")}
              </Col>

              {/* SPECIAL ALLOWANCE */}
              <Col md={6}>
                <Label htmlFor="SPLAllowance">
                  SPL Allowance (Yearly) <span className="text-danger">*</span>
                </Label>
                <Input
                  name="SPLAllowance"
                  type="number"
                  value={values.SPLAllowance}
                  onChange={(e) => {
                    setManual((prev) => ({
                      ...prev,
                      SPLAllowance: true,
                    }));
                    handleChange(e);
                  }}
                />
                {monthlyHint("SPLAllowance")}
              </Col>

              {/* CONVEYANCE ALLOWANCE */}
              <Col md={6}>
                <Label htmlFor="conveyanceAllowance">
                  Conveyance Allowance (Yearly){" "}
                  <span className="text-danger">*</span>
                </Label>
                <Input
                  id="conveyanceAllowance"
                  type="number"
                  name="conveyanceAllowance"
                  value={values.conveyanceAllowance}
                  onChange={handleChange}
                />
                {monthlyHint("conveyanceAllowance")}
              </Col>

              {/* STATUTORY BONUS */}
              <Col md={6}>
                <Label htmlFor="statutoryBonus">
                  Statutory Bonus (Yearly){" "}
                  <span className="text-danger">*</span>
                </Label>
                <Input
                  id="statutoryBonus"
                  type="number"
                  name="statutoryBonus"
                  value={values.statutoryBonus}
                  onChange={handleChange}
                />
                {monthlyHint("statutoryBonus")}
              </Col>

              {/* INSURANCE */}
              <Col md={6}>
                <Label htmlFor="insurance">Insurance (Yearly)</Label>
                <Input
                  id="insurance"
                  type="number"
                  name="insurance"
                  value={values.insurance}
                  onChange={handleChange}
                />
                {monthlyHint("insurance")}
              </Col>

              {/* VARIABLE */}
              <Col md={6}>
                <Label htmlFor="variable">Variable (Yearly)</Label>
                <Input
                  id="variable"
                  type="number"
                  name="variable"
                  value={values.variable}
                  onChange={handleChange}
                />
                <div className="text-muted small mt-1">Added to yearly CTC</div>
              </Col>

              {/* REIMBURSEMENT */}
              <Col md={6}>
                <Label htmlFor="reimbursement">Reimbursement (Yearly)</Label>
                <Input
                  id="reimbursement"
                  type="number"
                  name="reimbursement"
                  value={values.reimbursement}
                  onChange={handleChange}
                />
                <div className="text-muted small mt-1">Added to yearly CTC</div>
              </Col>

              {/* LWF EMPLOYEE — auto-calculated from state */}
              <Col md={6}>
                <Label htmlFor="LWFEmployee">LWF Employee (Yearly)</Label>
                <Input
                  id="LWFEmployee"
                  type="number"
                  name="LWFEmployee"
                  value={values.LWFEmployee}
                  readOnly
                  disabled
                />
                {lwfScheduleText(lwfState) ? (
                  <div className="text-muted small mt-1">
                    Charged {lwfScheduleText(lwfState)}
                  </div>
                ) : (
                  <div className="text-muted small mt-1">
                    No LWF for this state
                  </div>
                )}
              </Col>

              {/* LWF EMPLOYER — auto-calculated from state */}
              <Col md={6}>
                <Label htmlFor="LWFEmployer">LWF Employer (Yearly)</Label>
                <Input
                  id="LWFEmployer"
                  type="number"
                  name="LWFEmployer"
                  value={values.LWFEmployer}
                  readOnly
                  disabled
                />
                {lwfScheduleText(lwfState) ? (
                  <div className="text-muted small mt-1">
                    Charged {lwfScheduleText(lwfState)}
                  </div>
                ) : (
                  <div className="text-muted small mt-1">
                    No LWF for this state
                  </div>
                )}
              </Col>

              {/* ESIC SALARY */}
              <Col md={6}>
                <Label htmlFor="ESICSalary">ESIC Salary (Yearly)</Label>
                <Input
                  disabled
                  id="ESICSalary"
                  type="number"
                  name="ESICSalary"
                  value={yearlyValue("ESICSalary")}
                />
                {monthlyHintFrom("ESICSalary")}
              </Col>

              {/* ESIC EMPLOYEE */}
              <Col md={6}>
                <Label htmlFor="ESICEmployee">ESIC Employee (Yearly)</Label>
                <Input
                  disabled
                  id="ESICEmployee"
                  type="number"
                  name="ESICEmployee"
                  value={yearlyValue("ESICEmployee")}
                />
                {monthlyHintFrom("ESICEmployee")}
              </Col>

              {/* ESIC EMPLOYER */}
              <Col md={6}>
                <Label htmlFor="ESICEmployer">ESIC Employer (Yearly)</Label>
                <Input
                  disabled
                  id="ESICEmployer"
                  type="number"
                  name="ESICEmployer"
                  value={yearlyValue("ESICEmployer")}
                />
                {monthlyHintFrom("ESICEmployer")}
              </Col>

              {/* TDS RATE */}
              <Col md={6}>
                <Label htmlFor="TDSRate">TDS Rate</Label>
                <Input
                  id="TDSRate"
                  type="number"
                  name="TDSRate"
                  value={values.TDSRate}
                  onChange={handleChange}
                />
              </Col>

              {/* PT */}
              <Col md={6}>
                <Label htmlFor="PT">PT (Yearly)</Label>
                <Input disabled id="PT" type="number" value={ptYearly} />
                <div className="text-muted small mt-1">
                  Monthly ≈ ₹{ptMonthly.toLocaleString("en-IN")}
                </div>
              </Col>

              {/* IN HAND SALARY */}
              <Col md={6}>
                <Label htmlFor="inHandSalary">In Hand Salary (Yearly)</Label>
                <Input
                  disabled
                  id="inHandSalary"
                  type="number"
                  name="inHandSalary"
                  value={inHandYearly}
                />
                {monthlyHintFrom("inHandSalary")}
              </Col>

              {/* PF AMOUNT */}
              <Col md={6}>
                <Label htmlFor="PFAmount">PF Amount (Yearly)</Label>
                <Input
                  disabled
                  id="PFAmount"
                  type="number"
                  name="PFAmount"
                  value={yearlyValue("PFAmount")}
                />
                {monthlyHintFrom("PFAmount")}
              </Col>

              {/* PF EMPLOYEE */}
              <Col md={6}>
                <Label htmlFor="PFEmployee">
                  PF Employee Contribution (Yearly)
                </Label>
                <Input
                  disabled
                  id="PFEmployee"
                  type="number"
                  name="PFEmployee"
                  value={yearlyValue("PFEmployee")}
                />
                {monthlyHintFrom("PFEmployee")}
              </Col>

              {/* PF EMPLOYER */}
              <Col md={6}>
                <Label htmlFor="PFEmployer">
                  PF Employer Contribution (Yearly)
                </Label>
                <Input
                  disabled
                  id="PFEmployer"
                  type="number"
                  name="PFEmployer"
                  value={yearlyValue("PFEmployer")}
                />
                {monthlyHintFrom("PFEmployer")}
              </Col>

              {/* TOTAL DEDUCTIONS */}
              <Col md={6}>
                <Label htmlFor="deductions">Total Deductions (Yearly)</Label>
                <Input
                  disabled
                  id="deductions"
                  type="number"
                  name="deductions"
                  value={deductionsYearly}
                />
                {monthlyHintFrom("deductions")}
              </Col>

              {/* DUPLICATE - WRONG VALUE (no LWF correction)
              <Col md={6}>
                <Label htmlFor="inHandSalary">In Hand Salary (Yearly)</Label>
                <Input
                  disabled
                  id="inHandSalary"
                  type="number"
                  name="inHandSalary"
                  value={yearlyValue("inHandSalary")}
                />
                {monthlyHintFrom("inHandSalary")}
              </Col>
              */}

              {/* GRATUITY */}
              <Col md={6}>
                <Label htmlFor="gratuity">Gratuity (Yearly)</Label>
                <Input
                  disabled
                  id="gratuity"
                  type="number"
                  name="gratuity"
                  value={yearlyValue("gratuity")}
                />
                {monthlyHintFrom("gratuity")}
              </Col>

              {/* TOTAL COST TO COMPANY */}
              <Col md={6}>
                <Label htmlFor="totalCostToCompany">
                  Total Cost To Company (Yearly)
                </Label>
                <Input
                  disabled
                  id="totalCostToCompany"
                  type="number"
                  name="totalCostToCompany"
                  value={ctcYearly}
                />
                {monthlyHintFrom("totalCostToCompany")}
              </Col>

              {/* DEBIT STATEMENT NARRATION */}
              <Col md={6}>
                <Label htmlFor="debitStatementNarration">
                  Debit Statement Narration
                </Label>

                <Input
                  id="debitStatementNarration"
                  name="debitStatementNarration"
                  value={values.debitStatementNarration}
                  onChange={(e) =>
                    handleChange({
                      target: {
                        name: "debitStatementNarration",
                        value: e.target.value.toUpperCase(),
                      },
                    })
                  }
                  onBlur={() =>
                    setFieldTouched("debitStatementNarration", true)
                  }
                  invalid={
                    touched.debitStatementNarration &&
                    !!errors.debitStatementNarration
                  }
                />
                {errorText("debitStatementNarration")}
              </Col>
            </>
          )}
        </Row>

        <div className="d-flex gap-2 justify-content-end my-4 mx-3">
          {view === "MODAL" && (
            <Button
              color="secondary"
              className="text-white"
              onClick={onCancel}
              disabled={form.isSubmitting}
            >
              Cancel
            </Button>
          )}
          {(mode !== "NEW_JOINING" ||
            view !== "PAGE" ||
            hasCreatePermission) && (
            <Button
              color="primary"
              className="text-white"
              onClick={form.handleSubmit}
              disabled={
                isSubmitting ||
                !isValid ||
                (isEdit && !initialData?._id) ||
                missingMandatoryDocs.length > 0
              }
            >
              {isSubmitting ? (
                <Spinner size="sm" />
              ) : initialData ? (
                "Update Employee"
              ) : (
                "Save Employee"
              )}
            </Button>
          )}
        </div>
        </>
        ) : (
        <>

          <div className="mx-2">
            <h6 className="fw-semibold mb-2">
              {FORM_TABS[activeTabIndex]?.label}
            </h6>
            <div className="arrow-buttons d-flex gap-3 flex-wrap mb-3">
              {FORM_TABS.map((tab, idx) => (
                <Button
                  key={tab.key}
                  outline={activeTab !== tab.key}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.shortLabel}
                  {tabHasErrors(tab.key) && (
                    <span
                      className="ms-1 text-danger"
                      title="This step has validation errors"
                    >
                      &#9679;
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>

          <TabContent
            activeTab={activeTab}
            style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: "4px" }}
          >
              <TabPane tabId="personal">
        <Row className="g-3 mx-2">
          <Col md={6}>
            <Label htmlFor="name">
              Employee Name <span className="text-danger">*</span>
            </Label>
            <Input
              name="name"
              id="name"
              value={values.name}
              onChange={handleChange}
              invalid={touched.name && errors.name}
              onBlur={() => setFieldTouched("name", true)}
            />
            {errorText("name")}
          </Col>
          <Col md={6}>
            <Label htmlFor="salutation">Salutation</Label>
            <Select
              inputId="salutation"
              placeholder="Select Salutation"
              options={salutationOptions}
              value={
                salutationOptions.find(
                  (opt) => opt.value === values.salutation,
                ) || null
              }
              onChange={(opt) =>
                form.setFieldValue("salutation", opt ? opt.value : "")
              }
              onBlur={() => setFieldTouched("salutation", true)}
              isClearable
            />
            {errorText("salutation")}
          </Col>
          {/* STATE */}
          <Col md={6}>
            <Label htmlFor="state">
              State <span className="text-danger">*</span>
            </Label>

            <Input
              name="state"
              id="state"
              value={values.state}
              onChange={handleChange}
              invalid={touched.state && errors.state}
              onBlur={() => setFieldTouched("state", true)}
            />

            {errorText("state")}
          </Col>
          {/* GENDER */}
          <Col md={6}>
            <Label htmlFor="gender">
              Gender <span className="text-danger">*</span>
            </Label>
            <Select
              inputId="gender"
              options={employeeGenderOptions}
              value={
                employeeGenderOptions.find(
                  (opt) => opt.value === values.gender,
                ) || null
              }
              onChange={(opt) => setFieldValue("gender", opt.value)}
              onBlur={() => setFieldTouched("gender", true)}
            />
            {errorText("gender")}
          </Col>
          {/* DOB */}
          <Col md={6}>
            <Label htmlFor="dob">
              Date of Birth <span className="text-danger">*</span>
            </Label>
            <Flatpickr
              className={`form-control ${touched.dateOfBirth && errors.dateOfBirth ? "is-invalid" : ""}`}
              id="dob"
              name="dateOfBirth"
              value={values.dateOfBirth}
              onChange={async ([date]) => {
                await setFieldValue(
                  "dateOfBirth",
                  date ? format(date, "yyyy-MM-dd") : "",
                );
                await setFieldTouched("dateOfBirth", true, false);
                await validateForm();
              }}
              options={{
                dateFormat: "Y-m-d",
                maxDate: "today",
              }}
            />
            {errorText("dateOfBirth")}
          </Col>
          {/* FATHER NAME */}
          <Col md={6}>
            <Label htmlFor="father">
              Father's Name <span className="text-danger">*</span>
            </Label>
            <Input
              id="father"
              name="father"
              value={values.father}
              onChange={handleChange}
              invalid={touched.father && errors.father}
              onBlur={() => setFieldTouched("father", true)}
            />
            {errorText("father")}
          </Col>
          {/* MOBILE */}
          <Col md={6}>
            <Label htmlFor="mobile">
              Mobile No <span className="text-danger">*</span>
            </Label>

            <PhoneInputWithCountrySelect
              name="mobile"
              id="mobile"
              min="10"
              value={values.mobile}
              onChange={(value) =>
                handleChange({
                  target: {
                    name: "mobile",
                    value: value,
                  },
                })
              }
              limitMaxLength={true}
              defaultCountry="IN"
              className="w-100"
              style={{
                width: "100%",
                height: "42px",
                padding: "0.5rem 0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.375rem",
                fontSize: "1rem",
              }}
              onBlur={() => setFieldTouched("mobile", true)}
            />

            {errorText("mobile")}
          </Col>
          {/* OFFICIAL EMAIL */}
          <Col md={6}>
            <Label htmlFor="officialEmail">Official Email</Label>
            <Input
              id="officialEmail"
              type="email"
              name="officialEmail"
              value={values.officialEmail}
              onChange={handleChange}
            />
          </Col>
          {/* EMAIL */}
          <Col md={6}>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              name="email"
              value={values.email}
              onChange={handleChange}
            />
          </Col>
          {/* MONTHLY CTC — input removed; kept for reference
          <Col md={6}>
            <Label htmlFor="monthlyCTC">Monthly CTC</Label>
            <Input
              id="monthlyCTC"
              type="number"
              name="monthlyCTC"
              value={values.monthlyCTC}
              onChange={handleChange}
            />
          </Col>
          */}
        </Row>
              </TabPane>
              <TabPane tabId="employment">
        <Row className="g-3 mx-2">
          {/* EMPLOYEE CODE */}
          {mode !== "NEW_JOINING" && (
            <Col md={6}>
              <Label htmlFor="eCode">ECode</Label>

              <div className="position-relative">
                <Input
                  name="eCode"
                  id="eCode"
                  disabled
                  value={values.eCode}
                  onChange={handleChange}
                  invalid={touched.eCode && errors.eCode}
                  style={{ paddingRight: eCodeLoader ? "2.5rem" : undefined }}
                />

                {eCodeLoader && (
                  <Spinner
                    size="sm"
                    color="primary"
                    className="position-absolute"
                    style={{
                      right: "10px",
                      top: "35%",
                    }}
                  />
                )}
              </div>

              {errorText("eCode")}
            </Col>
          )}
          {/* DEPARTMENT
          <Col md={6}>
            <Label htmlFor="department">
              Department <span className="text-danger">*</span>
            </Label>
            <CreatableSelect
              inputId="department"
              placeholder="Auto-filled from position"
              isClearable
              isSearchable
              isDisabled={!!values.position}
              options={departmentOptions}
              value={
                departmentOptions.find(
                  (opt) => opt.value === values.department,
                ) || null
              }
              onChange={(option) => {
                form.setFieldValue("department", option ? option.value : "");
              }}
              onBlur={() => setFieldTouched("department", true)}
              onCreateOption={(inputValue) => {
                handleCreateDepartment(inputValue);
              }}
            />
            {errorText("department")}
          </Col> */}
          {/* DESIGNATION */}
          <Col md={6}>
            <Label htmlFor="designation">
              Designation <span className="text-danger">*</span>
            </Label>
            <Select
              inputId="designation"
              placeholder="Select designation"
              isClearable
              isDisabled={
                designationLoading
                // ||
                // (mode === "NEW_JOINING" && !hasCreatePermission)
              }
              isLoading={
                designationLoading
                // || creatingDesignation
              }
              options={sortedDesignationOptions}
              value={
                designationOptions.find(
                  (opt) => opt.value === values.designation,
                ) || null
              }
              onChange={(option) =>
                form.setFieldValue("designation", option ? option.value : "")
              }
              onBlur={() => setFieldTouched("designation", true)}
              // onCreateOption={handleCreateDesignation}
            />

            {errorText("designation")}
          </Col>

          {/* COMPANY */}
          <Col md={6}>
            <Label htmlFor="company">
              Company <span className="text-danger">*</span>
            </Label>
            <Select
              inputId="company"
              placeholder="Select company"
              isClearable
              options={companyOptions}
              value={
                companyOptions.find((opt) => opt.value === values.company) ||
                null
              }
              onChange={(option) => {
                form.setFieldValue("company", option ? option.value : "");
                if (!initialData?._id && mode !== "NEW_JOINING") {
                  if (option) {
                    generateEmployeeId(option.ecodePrefix);
                  } else {
                    form.setFieldValue("eCode", "");
                  }
                }
              }}
              onBlur={() => setFieldTouched("company", true)}
            />
            {errorText("company")}
          </Col>
          {/* EMPLOYEE TYPE */}
          <Col md={6}>
            <Label htmlFor="employmentType">
              Employee Type <span className="text-danger">*</span>
            </Label>

            <Select
              inputId="employmentType"
              placeholder="Select Employee Type"
              options={employmentOptions}
              value={selectedEmploymentOption}
              onChange={(opt) =>
                form.setFieldValue("employmentType", opt ? opt.value : "")
              }
              onBlur={() => setFieldTouched("employmentType", true)}
              isDisabled={
                isEdit &&
                initialData?.employmentType?.trim().toUpperCase() === "VENDOR"
              }
            />

            {errorText("employmentType")}
          </Col>
          {/* EMPLOYEMENT TYPE */}
          <Col md={6}>
            <Label htmlFor="newEmploymentType">
              Employment Type
              {/* <span className="text-danger">*</span> */}
            </Label>
            <Select
              inputId="newEmploymentType"
              placeholder="Select Employement Type"
              options={newEmploymentOptions}
              value={
                newEmploymentOptions.find(
                  (opt) => opt.value === values.newEmploymentType,
                ) || null
              }
              onChange={(opt) =>
                form.setFieldValue("newEmploymentType", opt ? opt.value : "")
              }
              onBlur={() => setFieldTouched("newEmploymentType", true)}
              isClearable
            />
            {errorText("newEmploymentType")}
          </Col>
          {/* MINIMUM WORK HOURS — visible only for Part Time */}
          {values.newEmploymentType === "PART_TIME" && (
            <Col md={6}>
              <Label htmlFor="minimumWorkHours">
                Minimum Work Hours
                {values.minimumPresentUnit === "SESSION" &&
                  " (per session)"}{" "}
                <span className="text-danger">*</span>
              </Label>
              {(() => {
                const isEmpty =
                  values.minimumWorkHours === "" ||
                  values.minimumWorkHours == null;
                const totalMinutes = isEmpty
                  ? 0
                  : Number(values.minimumWorkHours);
                const hoursPart = Math.floor(totalMinutes / 60);
                const minutesPart = totalMinutes % 60;
                const invalid =
                  touched.minimumWorkHours && !!errors.minimumWorkHours;
                return (
                  <div
                    className="d-flex align-items-center"
                    style={{ gap: "8px" }}
                  >
                    <Input
                      id="minimumWorkHours"
                      type="number"
                      min={0}
                      max={24}
                      step={1}
                      value={isEmpty ? "" : hoursPart}
                      onChange={(e) => {
                        const h =
                          e.target.value === ""
                            ? 0
                            : parseInt(e.target.value, 10) || 0;
                        setFieldValue("minimumWorkHours", h * 60 + minutesPart);
                      }}
                      onBlur={() => setFieldTouched("minimumWorkHours", true)}
                      placeholder="HH"
                      invalid={invalid}
                      style={{ width: "80px" }}
                    />
                    <span className="fw-bold">:</span>
                    <Input
                      id="minimumWorkMinutes"
                      type="number"
                      min={0}
                      max={59}
                      step={1}
                      value={isEmpty ? "" : minutesPart}
                      onChange={(e) => {
                        let m =
                          e.target.value === ""
                            ? 0
                            : parseInt(e.target.value, 10) || 0;
                        if (m > 59) m = 59;
                        if (m < 0) m = 0;
                        setFieldValue("minimumWorkHours", hoursPart * 60 + m);
                      }}
                      onBlur={() => setFieldTouched("minimumWorkHours", true)}
                      placeholder="MM"
                      invalid={invalid}
                      style={{ width: "80px" }}
                    />
                    <span className="text-muted small">hours : minutes</span>
                  </div>
                );
              })()}
              {values.minimumWorkHours !== "" &&
                values.minimumWorkHours != null && (
                  <div className="text-muted small mt-1">
                    = {minutesToHHMM(values.minimumWorkHours)} hours (
                    {Math.round(Number(values.minimumWorkHours))} minutes)
                  </div>
                )}
              {errorText("minimumWorkHours")}
            </Col>
          )}
          {/* MINIMUM PRESENT DAYS — visible only for Part Time */}
          {values.newEmploymentType === "PART_TIME" && (
            <Col md={6}>
              <Label htmlFor="minimumPresentDays">
                {values.minimumPresentUnit === "SESSIONS"
                  ? "Number of Sessions"
                  : "Minimum Presence"}
                {values.minimumPresentUnit !== "SESSION" && (
                  <span className="text-danger"> *</span>
                )}
              </Label>
              <div className="d-flex" style={{ gap: "8px" }}>
                {values.minimumPresentUnit !== "SESSION" && (
                  <div style={{ flex: 1 }}>
                    <Input
                      id="minimumPresentDays"
                      type="number"
                      name="minimumPresentDays"
                      min={0}
                      max={values.minimumPresentUnit === "WEEK" ? 7 : 31}
                      value={values.minimumPresentDays}
                      onChange={handleChange}
                      onBlur={() => setFieldTouched("minimumPresentDays", true)}
                      placeholder={
                        values.minimumPresentUnit === "SESSIONS"
                          ? "Enter number of sessions"
                          : "Enter number of days"
                      }
                      invalid={
                        touched.minimumPresentDays &&
                        !!errors.minimumPresentDays
                      }
                    />
                  </div>
                )}
                <div
                  style={{
                    width:
                      values.minimumPresentUnit === "SESSION"
                        ? "100%"
                        : "160px",
                  }}
                >
                  <Select
                    inputId="minimumPresentUnit"
                    placeholder="Select unit"
                    options={presentUnitOptions}
                    value={
                      presentUnitOptions.find(
                        (opt) => opt.value === values.minimumPresentUnit,
                      ) || null
                    }
                    onChange={(opt) =>
                      form.setFieldValue(
                        "minimumPresentUnit",
                        opt ? opt.value : "",
                      )
                    }
                    onBlur={() => setFieldTouched("minimumPresentUnit", true)}
                    isClearable
                  />
                </div>
              </div>
              {values.minimumPresentUnit === "SESSION" ? (
                <div className="text-muted small mt-1">
                  Requirement is measured per session — set the hours in Minimum
                  Work Hours above.
                </div>
              ) : values.minimumPresentUnit === "SESSIONS" ? (
                values.minimumPresentDays !== "" && (
                  <div className="text-muted small mt-1">
                    = {values.minimumPresentDays} session
                    {Number(values.minimumPresentDays) === 1 ? "" : "s"} per
                    month
                  </div>
                )
              ) : (
                values.minimumPresentDays !== "" &&
                values.minimumPresentUnit && (
                  <div className="text-muted small mt-1">
                    = {values.minimumPresentDays} day
                    {Number(values.minimumPresentDays) === 1
                      ? ""
                      : "s"} per{" "}
                    {values.minimumPresentUnit === "WEEK" ? "week" : "month"}
                  </div>
                )
              )}
              {errorText("minimumPresentDays")}
              {errorText("minimumPresentUnit")}
            </Col>
          )}
          {/* EMPLOYMENT STATUS */}
          <Col md={6}>
            <Label htmlFor="employmentStatus">
              Employment Status
              {/* <span className="text-danger">*</span> */}
            </Label>
            <Select
              inputId="employmentStatus"
              placeholder="Select Employment Status"
              options={employmentStatus}
              value={
                employmentStatus.find(
                  (opt) => opt.value === values.employmentStatus,
                ) || null
              }
              onChange={(opt) =>
                form.setFieldValue("employmentStatus", opt ? opt.value : "")
              }
              onBlur={() => setFieldTouched("employmentStatus", true)}
              isClearable
            />
            {errorText("employmentStatus")}
          </Col>
          {/* CATEGORY */}
          <Col md={6}>
            <Label htmlFor="category">Category</Label>
            <Select
              inputId="category"
              placeholder="Select Category"
              options={categoryOptions}
              value={
                categoryOptions.find((opt) => opt.value === values.category) ||
                null
              }
              onChange={(opt) => {
                const category = opt ? opt.value : "";
                form.setFieldValue("category", category);
                // Consultant / Form 11 are never on PF — pick "NO" for the user.
                if (NON_PF_CATEGORIES.includes(category)) {
                  form.setFieldValue("pfApplicable", false);
                }
              }}
              onBlur={() => setFieldTouched("category", true)}
              isClearable
            />
            {errorText("category")}
          </Col>
          {/* POSITION */}
          <Col md={6}>
            <Label htmlFor="position">
              Position <span className="text-danger">*</span>
            </Label>
            <Select
              inputId="position"
              placeholder="Select Position"
              options={positionOptions}
              value={
                positionOptions.find(
                  (opt) =>
                    opt.value?.toString() === values.position?.toString(),
                ) ||
                (!positionCorrectedRef.current
                  ? positionOptions.find(
                      (opt) => opt.label === initialData?.position?.name,
                    )
                  : null) ||
                null
              }
              onChange={(opt) => {
                form.setFieldValue("position", opt ? opt.value : "");
                if (opt?.departmentId) {
                  form.setFieldValue("department", opt.departmentId);
                  form.setFieldTouched("department", true, false);
                } else {
                  form.setFieldValue("department", "");
                }
              }}
              onBlur={() => setFieldTouched("position", true)}
              isClearable
            />
            {errorText("position")}
          </Col>
          {/* DEPARTMENT */}
          <Col md={6}>
            <Label htmlFor="department">
              Department <span className="text-danger">*</span>
            </Label>
            <CreatableSelect
              inputId="department"
              placeholder="Select Position"
              isClearable
              isSearchable
              isDisabled={true}
              options={sortedDepartmentOptions}
              value={
                departmentOptions.find(
                  (opt) => opt.value === values.department,
                ) || null
              }
              onChange={(option) => {
                form.setFieldValue("department", option ? option.value : "");
              }}
              onBlur={() => setFieldTouched("department", true)}
              onCreateOption={(inputValue) => {
                handleCreateDepartment(inputValue);
              }}
            />
            {errorText("department")}
          </Col>
          {/* FIRST LOCATION */}
          <Col md={6}>
            <Label htmlFor="firstLocation">
              First Location <span className="text-danger">*</span>
            </Label>
            <Select
              inputId="firstLocation"
              options={centerOptions}
              value={
                values.firstLocation
                  ? centerOptions.find((o) => o.value === values.firstLocation)
                  : null
              }
              onChange={(opt) => setFieldValue("firstLocation", opt.value)}
              onBlur={() => setFieldTouched("firstLocation", true)}
            />
            {errorText("firstLocation")}
          </Col>
          {/* TRANSFERRED FROM */}
          {mode !== "NEW_JOINING" && (
            <Col md={6}>
              <Label htmlFor="transferredFrom">Transferred From</Label>
              <Select
                inputId="transferredFrom"
                options={centerOptions}
                value={
                  values.transferredFrom
                    ? centerOptions.find(
                        (o) => o.value === values.transferredFrom,
                      )
                    : null
                }
                onChange={(opt) => setFieldValue("transferredFrom", opt.value)}
              />
            </Col>
          )}
          {/* CURRENT LOCATION */}
          <Col md={6}>
            <Label htmlFor="currentLocation">
              Current Location <span className="text-danger">*</span>
            </Label>
            <Select
              inputId="currentLocation"
              options={centerOptions}
              value={
                values.currentLocation
                  ? centerOptions.find(
                      (o) => o.value === values.currentLocation,
                    )
                  : null
              }
              onChange={(opt) => setFieldValue("currentLocation", opt.value)}
              onBlur={() => setFieldTouched("currentLocation", true)}
            />
            {errorText("currentLocation")}
          </Col>
          {/* PAYROLL */}
          <Col md={6}>
            <Label htmlFor="payroll">
              Payroll <span className="text-danger">*</span>
            </Label>
            <Select
              inputId="payroll"
              options={payrollOptions}
              value={
                payrollOptions.find(
                  (opt) => opt.value === values.payrollType,
                ) || null
              }
              onChange={(opt) => setFieldValue("payrollType", opt.value)}
              onBlur={() => setFieldTouched("payrollType", true)}
            />
            {errorText("payrollType")}
          </Col>
          {/* DATE OF JOINING */}
          <Col md={6}>
            <Label htmlFor="joinningDate">
              Date of Joining <span className="text-danger">*</span>
            </Label>
            <Flatpickr
              className={`form-control ${touched.joinningDate && errors.joinningDate ? "is-invalid" : ""}`}
              id="joinningDate"
              name="joinningDate"
              value={values.joinningDate}
              onChange={([date]) => {
                setFieldValue(
                  "joinningDate",
                  date ? format(date, "yyyy-MM-dd") : "",
                );
              }}
              options={{
                dateFormat: "Y-m-d",
                maxDate: "today",
              }}
            />
            {errorText("joinningDate")}
          </Col>
          {/* EXIT DATE */}
          <Col md={6}>
            <Label htmlFor="exitDate">Last Working Day</Label>
            <Flatpickr
              className={`form-control ${touched.exitDate && errors.exitDate ? "is-invalid" : ""}`}
              id="exitDate"
              name="exitDate"
              value={values.exitDate}
              onChange={([date]) => {
                setFieldValue(
                  "exitDate",
                  date ? format(date, "yyyy-MM-dd") : "",
                );
              }}
              options={{
                dateFormat: "Y-m-d",
              }}
            />
          </Col>
          {/* STATUS */}
          {mode !== "NEW_JOINING" && (
            <Col md={6}>
              <Label htmlFor="status">
                Status <span className="text-danger">*</span>
              </Label>
              <Select
                inputId="status"
                options={statusOptions}
                value={
                  statusOptions.find((opt) => opt.value === values.status) ||
                  null
                }
                onChange={(opt) => setFieldValue("status", opt.value)}
                isDisabled={isEdit && initialData?.status === "FNF_CLOSED"}
                onBlur={() => setFieldTouched("status", true)}
              />
              {errorText("status")}
            </Col>
          )}
          {/* BIOMETRIC ID */}
          {mode !== "NEW_JOINING" && (
            <Col md={6}>
              <Label htmlFor="biometricId">Biometric ID</Label>
              <Input
                id="biometricId"
                type="number"
                name="biometricId"
                value={values.biometricId}
                onChange={handleChange}
              />
            </Col>
          )}
          {/* LINK USERS */}
          {mode !== "NEW_JOINING" && (
            <Col md={12}>
              <Label htmlFor="users">Link With Associated Users</Label>
              <div className="d-flex flex-column flex-md-row gap-2 align-items-stretch">
                <div className="flex-grow-1">
                  <AsyncSelect
                    inputId="users"
                    isMulti
                    defaultOptions
                    loadOptions={loadUserOptions}
                    placeholder="Search and select users..."
                    value={values.users}
                    onChange={(selectedOptions) =>
                      setFieldValue("users", selectedOptions || [])
                    }
                  />
                </div>
                <div className="d-flex align-items-stretch">
                  <Button
                    color="primary"
                    className="text-white w-100 w-md-auto"
                    onClick={handleLinkUsers}
                    disabled={linking}
                  >
                    {linking ? <Spinner size="sm" /> : "Link"}
                  </Button>
                </div>
              </div>
            </Col>
          )}
        </Row>
              </TabPane>
              <TabPane tabId="statutory">
        <Row className="g-3 mx-2">
          {/* PF APPLICABLE */}
          <Col md={6}>
            <Label htmlFor="pfApplicable">
              PF Available <span className="text-danger">*</span>
            </Label>
            <Select
              inputId="pfApplicable"
              options={[
                { value: true, label: "YES" },
                { value: false, label: "NO" },
              ]}
              value={
                values.pfApplicable === true
                  ? { value: true, label: "YES" }
                  : values.pfApplicable === false
                    ? { value: false, label: "NO" }
                    : null
              }
              onChange={(opt) => setFieldValue("pfApplicable", opt.value)}
              onBlur={() => setFieldTouched("pfApplicable", true)}
              isDisabled={NON_PF_CATEGORIES.includes(values.category)}
            />
            {errorText("pfApplicable")}
          </Col>
          {/* UAN NO */}
          <Col md={6}>
            <Label htmlFor="uanNo">
              UAN No{" "}
              {values.pfApplicable === true && (
                <span className="text-danger">*</span>
              )}
            </Label>
            <Input
              id="uanNo"
              name="uanNo"
              value={values.uanNo}
              onChange={handleChange}
              invalid={touched.uanNo && !!errors.uanNo}
              onBlur={() => setFieldTouched("uanNo", true)}
            />
            {errorText("uanNo")}
          </Col>
          {/* PF NO */}
          <Col md={6}>
            <Label htmlFor="pfNo">PF No</Label>
            <Input
              id="pfNo"
              name="pfNo"
              value={values.pfNo}
              onChange={handleChange}
              // invalid={touched.pfNo && !!errors.pfNo}
              onBlur={() => setFieldTouched("pfNo", true)}
            />
            {/* {errorText("pfNo")} */}
          </Col>
          {/* ESIC */}
          <Col md={6}>
            <Label htmlFor="esicIpCode">ESIC IP Code</Label>
            <Input
              id="esicIpCode"
              name="esicIpCode"
              value={values.esicIpCode}
              onChange={handleChange}
            />
          </Col>
          {/* AADHAAR NO*/}
          <Col md={6}>
            <Label htmlFor="adharNo">
              Aadhaar No{" "}
              {!isNonAadhaar && <span className="text-danger">*</span>}
            </Label>
            <Input
              id="adharNo"
              name="adharNo"
              value={values.adharNo}
              onChange={handleChange}
              invalid={touched.adharNo && errors.adharNo}
              onBlur={() => setFieldTouched("adharNo", true)}
            />
            {errorText("adharNo")}
          </Col>
          {/* ADHAAR FILE */}
          <Col md={6}>
            <Label>
              Aadhaar File{" "}
              {!isNonAadhaar && <span className="text-danger">*</span>}
            </Label>

            <input
              type="file"
              hidden
              ref={adharFileRef}
              accept="image/*,application/pdf"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;

                await handleFileUpload({
                  file,
                  path: "EMPLOYEE_ADHAR",
                  urlField: "adharOld",
                  fileField: "adharFile",
                });
              }}
            />

            {values.adharOld ? (
              <div className="d-flex gap-2 mt-2">
                <Button
                  size="sm"
                  color="info"
                  onClick={() =>
                    handleFilePreview(
                      {
                        url: values.adharOld,
                        originalName: "Aadhaar",
                      },
                      "adharOld",
                    )
                  }
                  disabled={uploading.adharFile}
                >
                  {getFileActionLabel(
                    {
                      url: values.adharOld,
                      originalName: "Aadhaar",
                    },
                    "adharOld",
                  )}
                </Button>

                <Button
                  size="sm"
                  onClick={() => adharFileRef.current.click()}
                  disabled={uploading.adharFile}
                >
                  {uploading.adharFile ? (
                    <>
                      <Spinner size="sm" className="me-1" /> Uploading
                    </>
                  ) : (
                    "Upload new file"
                  )}
                </Button>
              </div>
            ) : (
              <div className="d-block">
                <Button
                  size="sm"
                  onClick={() => adharFileRef.current.click()}
                  disabled={uploading.adharFile}
                >
                  {uploading.adharFile ? (
                    <>
                      <Spinner size="sm" className="me-1" /> Uploading
                    </>
                  ) : (
                    "Upload file"
                  )}
                </Button>
              </div>
            )}

            {errorText("adharOld")}
          </Col>
          {/* PAN NO*/}
          <Col md={6}>
            <Label htmlFor="pan">
              PAN No{!isNonAadhaar && <span className="text-danger">*</span>}
            </Label>

            <Input
              id="pan"
              name="pan"
              value={values.pan}
              onChange={(e) => {
                setFieldValue("pan", e.target.value.toUpperCase());
              }}
              invalid={touched.pan && errors.pan}
              onBlur={() => setFieldTouched("pan", true)}
            />
            {errorText("pan")}
          </Col>
          {/* PAN FILE */}
          <Col md={6}>
            <Label>
              PAN File{" "}
              {!isNonAadhaar && <span className="text-danger">*</span>}
            </Label>

            <input
              type="file"
              hidden
              ref={panFileRef}
              accept="image/*,application/pdf"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";

                await handleFileUpload({
                  file,
                  path: "EMPLOYEE_PAN",
                  urlField: "panOld",
                  fileField: "panFile",
                });
              }}
            />

            {values.panOld ? (
              <div className="d-flex gap-2 mt-2">
                <Button
                  size="sm"
                  color="info"
                  onClick={() =>
                    handleFilePreview(
                      {
                        url: values.panOld,
                        originalName: "Pan",
                      },
                      "panOld",
                    )
                  }
                  disabled={uploading.panFile}
                >
                  {getFileActionLabel(
                    {
                      url: values.panOld,
                      originalName: "Pan",
                    },
                    "panOld",
                  )}
                </Button>

                <Button
                  size="sm"
                  onClick={() => panFileRef.current.click()}
                  disabled={uploading.panFile}
                >
                  {uploading.panFile ? (
                    <>
                      <Spinner size="sm" className="me-1" /> Uploading
                    </>
                  ) : (
                    "Upload New file"
                  )}
                </Button>
              </div>
            ) : (
              <div className="d-block">
                <Button
                  size="sm"
                  onClick={() => panFileRef.current.click()}
                  disabled={uploading.panFile}
                >
                  {uploading.panFile ? (
                    <>
                      <Spinner size="sm" className="me-1" /> Uploading
                    </>
                  ) : (
                    "Upload file"
                  )}
                </Button>
              </div>
            )}

            {errorText("panOld")}
          </Col>
        </Row>
              </TabPane>
              <TabPane tabId="bank">
        <Row className="g-3 mx-2">
          {/* BANK NAME */}
          <Col md={6}>
            <Label htmlFor="bankName">
              Bank Name <span className="text-danger">*</span>
            </Label>
            <Input
              id="bankName"
              name="bankName"
              value={values.bankName}
              onChange={handleChange}
              invalid={touched.bankName && errors.bankName}
              onBlur={() => setFieldTouched("bankName", true)}
            />
            {errorText("bankName")}
          </Col>
          {/* BANK ACCOUNT */}
          <Col md={6}>
            <Label htmlFor="accountNo">
              Bank Account No <span className="text-danger">*</span>
            </Label>
            <Input
              id="accountNo"
              name="accountNo"
              value={values.accountNo}
              onChange={handleChange}
              invalid={touched.accountNo && errors.accountNo}
              onBlur={() => setFieldTouched("accountNo", true)}
            />
            {errorText("accountNo")}
          </Col>
          {/* BENIFICIARY NAME */}
          <Col md={6}>
            <Label htmlFor="accountHolderName">
              Account Holder's Name <span className="text-danger">*</span>
            </Label>
            <Input
              id="accountHolderName"
              name="accountName"
              value={values.accountName}
              onChange={handleChange}
              invalid={touched.accountName && errors.accountName}
              onBlur={() => setFieldTouched("accountName", true)}
            />
            {errorText("accountName")}
          </Col>
          {/* IFSC */}
          <Col md={6}>
            <Label htmlFor="IFSCCode">
              IFSC Code <span className="text-danger">*</span>
            </Label>
            <Input
              id="IFSCCode"
              name="IFSCCode"
              value={values.IFSCCode}
              onChange={handleChange}
              invalid={touched.IFSCCode && errors.IFSCCode}
              onBlur={() => setFieldTouched("IFSCCode", true)}
            />
            {errorText("IFSCCode")}
          </Col>
        </Row>
              </TabPane>
              <TabPane tabId="documents">
        <Row className="g-3 mx-2">
          {/* OFFER LETTER FILE */}
          <Col md={6}>
            <Label>
              Offer Letter <span className="text-danger">*</span>
            </Label>

            <input
              type="file"
              hidden
              ref={offerLetterRef}
              accept="image/*,application/pdf"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;

                await handleFileUpload({
                  file,
                  path: "EMPLOYEE_OFFER_LETTER",
                  urlField: "offerLetterOld",
                  fileField: "offerLetterFile",
                });
              }}
            />

            {values.offerLetterOld ? (
              <div className="d-flex gap-2 mt-2">
                <Button
                  size="sm"
                  color="info"
                  onClick={() =>
                    handleFilePreview(
                      {
                        url: values.offerLetterOld,
                        originalName: "Offerletter",
                      },
                      "offerLetterOld",
                    )
                  }
                  disabled={uploading.offerLetterFile}
                >
                  {getFileActionLabel(
                    {
                      url: values.offerLetterOld,
                      originalName: "Offerletter",
                    },
                    "offerLetterOld",
                  )}
                </Button>

                <Button
                  size="sm"
                  onClick={() => offerLetterRef.current.click()}
                  disabled={uploading.offerLetterFile}
                >
                  {uploading.offerLetterFile ? (
                    <>
                      <Spinner size="sm" className="me-1" /> Uploading
                    </>
                  ) : (
                    "Upload New file"
                  )}
                </Button>
              </div>
            ) : (
              <div className="d-block">
                <Button
                  size="sm"
                  onClick={() => offerLetterRef.current.click()}
                  disabled={uploading.offerLetterFile}
                >
                  {uploading.offerLetterFile ? (
                    <>
                      <Spinner size="sm" className="me-1" /> Uploading
                    </>
                  ) : (
                    "Upload file"
                  )}
                </Button>
              </div>
            )}

            {errorText("offerLetterOld")}
          </Col>
        </Row>

        <Col xs={12} className="mt-4">
          <h5 className="fw-semibold mb-1">Other Documents</h5>
          <hr className="mt-0" />
          {missingMandatoryDocs.length > 0 && (
            <p className="text-danger small mb-2">
              Please upload: {missingMandatoryDocs.join(", ")}
            </p>
          )}
        </Col>

        <Row className="g-3 mx-2">
          {positionDocFields.length > 0 ? (
            positionDocsLoading ? (
              <Col xs={12}>
                <Spinner size="sm" className="me-2" /> Loading required
                documents...
              </Col>
            ) : (
              positionDocFields.map((doc) => {
                const files = positionDocFiles[doc.document] || [];
                const existingFiles = doc.files || [];
                const isSatisfied = existingFiles.length > 0;

                return (
                  <Col md={6} key={doc.document}>
                    <Label
                      className="d-block text-truncate"
                      style={{ maxWidth: "100%" }}
                      title={doc.docName}
                    >
                      {doc.docName}
                      {doc.markMandatory && !isSatisfied && (
                        <span className="text-danger ms-1">*</span>
                      )}
                    </Label>

                    {doc.legacy && (
                      <p className="text-muted small mb-2">
                        <i className="ri-information-line me-1" />
                        Retained from a previous position assignment.
                      </p>
                    )}

                    {existingFiles.length > 0 && (
                      <div className="d-flex flex-column gap-2 mb-2">
                        {existingFiles.map((file, index) => (
                          <div
                            key={file._id || index}
                            className="d-flex align-items-center justify-content-between border rounded px-2 py-1"
                          >
                            <span
                              className="text-truncate small"
                              style={{ maxWidth: 180 }}
                            >
                              {file.fileName}
                            </span>
                            <div className="d-flex gap-1">
                              <Button
                                size="sm"
                                color="info"
                                onClick={() =>
                                  handleFilePreview(
                                    {
                                      url: file.fileUrl,
                                      originalName: file.fileName,
                                    },
                                    `positionDoc.${doc.document}.${file._id || index}`,
                                  )
                                }
                              >
                                {getFileActionLabel(
                                  {
                                    url: file.fileUrl,
                                    originalName: file.fileName,
                                  },
                                  `positionDoc.${doc.document}.${file._id || index}`,
                                )}
                              </Button>
                              {!doc.legacy && (
                                <Button
                                  size="sm"
                                  color="outline-danger"
                                  onClick={() =>
                                    openDeleteExistingFile(doc.document, file)
                                  }
                                >
                                  <i className="ri-close-line" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {!doc.legacy && (
                      <>
                        <input
                          type="file"
                          hidden
                          ref={(el) =>
                            (positionDocFileRefs.current[doc.document] = el)
                          }
                          accept="image/*,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            e.target.value = "";
                            if (!file) return;
                            handlePositionDocSelect(doc.document, file);
                          }}
                        />

                        {files.length > 0 && (
                          <div className="d-flex flex-column gap-2 mb-2">
                            {files.map((file, index) => (
                              <div
                                key={index}
                                className="d-flex align-items-center justify-content-between border rounded px-2 py-1"
                              >
                                <span
                                  className="text-truncate small"
                                  style={{ maxWidth: 220 }}
                                >
                                  {file.name}
                                </span>
                                <Button
                                  size="sm"
                                  color="outline-danger"
                                  onClick={() =>
                                    handlePositionDocRemove(doc.document, index)
                                  }
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        <Button
                          size="sm"
                          onClick={() =>
                            positionDocFileRefs.current[doc.document]?.click()
                          }
                        >
                          {files.length > 0 || existingFiles.length > 0
                            ? "Upload Another File"
                            : "Upload File"}
                        </Button>
                      </>
                    )}
                  </Col>
                );
              })
            )
          ) : (
            <Col xs={12}>
              <p className="text-muted small mb-0">
                {isEdit
                  ? "No additional documents configured for this position."
                  : "Save the employee first, then required documents can be uploaded."}
              </p>
            </Col>
          )}
        </Row>
              </TabPane>
              <TabPane tabId="finance">        <Col xs={12} className="mt-4">
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
                  type="number"
                  name="annualCTC"
                  min={0}
                  value={values.annualCTC}
                  onChange={handleChange}
                  onBlur={() => setFieldTouched("annualCTC", true)}
                  invalid={touched.annualCTC && !!errors.annualCTC}
                />
                {errorText("annualCTC")}
                <div className="text-muted small mt-1">
                  Monthly ≈ ₹
                  {Math.round(
                    (Number(values.annualCTC) || 0) / 12,
                  ).toLocaleString("en-IN")}
                </div>
              </Col>

              {/* IN HAND SALARY (= CTC, auto) */}
              <Col md={6}>
                <Label htmlFor="annualInHandSalary">
                  In Hand Salary (Yearly){" "}
                  <span className="text-danger">*</span>
                </Label>
                <Input
                  id="annualInHandSalary"
                  type="number"
                  name="annualInHandSalary"
                  min={0}
                  value={values.annualInHandSalary}
                  disabled
                  onChange={handleChange}
                  onBlur={() => setFieldTouched("annualInHandSalary", true)}
                  invalid={
                    touched.annualInHandSalary && !!errors.annualInHandSalary
                  }
                />
                {errorText("annualInHandSalary")}
                <div className="text-muted small mt-1">
                  Monthly ≈ ₹
                  {Math.round(
                    (Number(values.annualInHandSalary) || 0) / 12,
                  ).toLocaleString("en-IN")}
                </div>
                <div className="text-muted small">
                  Auto-calculated as Annual CTC.
                </div>
              </Col>

              {/* IS IT AN INCREMENT? — only when editing an existing employee */}
              {mode === "MASTER" && isEdit && (
                <Col md={6}>
                  <Label htmlFor="isIncrement">Is it an increment?</Label>
                  <Select
                    inputId="isIncrement"
                    options={[
                      { label: "No", value: "NO" },
                      { label: "Yes", value: "YES" },
                    ]}
                    value={{
                      label: values.isIncrement === "YES" ? "Yes" : "No",
                      value: values.isIncrement,
                    }}
                    onChange={(opt) =>
                      setFieldValue("isIncrement", opt ? opt.value : "NO")
                    }
                  />
                </Col>
              )}

              {mode === "MASTER" && isEdit && values.isIncrement === "YES" && (
                <Col md={6}>
                  <Label htmlFor="incrementIssued">
                    Increment Issued Date <span className="text-danger">*</span>
                  </Label>
                  <Flatpickr
                    className={`form-control ${errors.incrementIssued ? "is-invalid" : ""}`}
                    id="incrementIssued"
                    name="incrementIssued"
                    value={values.incrementIssued}
                    onChange={([date]) => {
                      setFieldValue(
                        "incrementIssued",
                        date ? format(date, "yyyy-MM-dd") : "",
                      );
                    }}
                    options={{ dateFormat: "Y-m-d" }}
                  />
                  {errorText("incrementIssued")}
                </Col>
              )}

              {/* INCREMENT APPLICABLE DATE */}
              {mode === "MASTER" && isEdit && values.isIncrement === "YES" && (
                <Col md={6}>
                  <Label htmlFor="incrementApplicable">
                    Increment Applicable Date{" "}
                    <span className="text-danger">*</span>
                  </Label>
                  <Flatpickr
                    className={`form-control ${errors.incrementApplicable ? "is-invalid" : ""}`}
                    id="incrementApplicable"
                    name="incrementApplicable"
                    value={values.incrementApplicable}
                    onChange={([date]) => {
                      setFieldValue(
                        "incrementApplicable",
                        date ? format(date, "yyyy-MM-dd") : "",
                      );
                    }}
                    options={{ dateFormat: "Y-m-d" }}
                  />
                  {errorText("incrementApplicable")}
                </Col>
              )}

              {/* INCREMENT LETTER FILE */}
              {mode === "MASTER" && isEdit && values.isIncrement === "YES" && (
                <Col md={6}>
                  <Label>Increment Letter</Label>

                  <input
                    type="file"
                    hidden
                    ref={incrementLetterRef}
                    accept="image/*,application/pdf"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (!file) return;
                      await handleFileUpload({
                        file,
                        path: "EMPLOYEE_INCREMENT_LETTER",
                        urlField: "incrementLetterOld",
                        fileField: "incrementLetterFile",
                      });
                    }}
                  />

                  {values.incrementLetterOld ? (
                    <div className="d-flex gap-2 mt-2">
                      <Button
                        size="sm"
                        color="info"
                        onClick={() =>
                          handleFilePreview(
                            {
                              url: values.incrementLetterOld,
                              originalName: "IncrementLetter",
                            },
                            "incrementLetterOld",
                          )
                        }
                        disabled={uploading.incrementLetterFile}
                      >
                        {getFileActionLabel(
                          {
                            url: values.incrementLetterOld,
                            originalName: "IncrementLetter",
                          },
                          "incrementLetterOld",
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => incrementLetterRef.current.click()}
                        disabled={uploading.incrementLetterFile}
                      >
                        {uploading.incrementLetterFile ? (
                          <>
                            <Spinner size="sm" className="me-1" /> Uploading
                          </>
                        ) : (
                          "Upload New File"
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="d-block">
                      <Button
                        size="sm"
                        onClick={() => incrementLetterRef.current.click()}
                        disabled={uploading.incrementLetterFile}
                      >
                        {uploading.incrementLetterFile ? (
                          <>
                            <Spinner size="sm" className="me-1" /> Uploading
                          </>
                        ) : (
                          "Upload File"
                        )}
                      </Button>
                    </div>
                  )}
                </Col>
              )}
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
                  type="number"
                  name="annualCTC"
                  min={0}
                  value={values.annualCTC}
                  onChange={handleChange}
                  onBlur={() => setFieldTouched("annualCTC", true)}
                  invalid={touched.annualCTC && !!errors.annualCTC}
                />
                {errorText("annualCTC")}
                {!perSession && (
                  <div className="text-muted small mt-1">
                    Monthly ≈ ₹
                    {Math.round(
                      (Number(values.annualCTC) || 0) / 12,
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
                  type="number"
                  name="annualInsurance"
                  min={0}
                  value={values.annualInsurance}
                  onChange={handleChange}
                  onBlur={() => setFieldTouched("annualInsurance", true)}
                  invalid={touched.annualInsurance && !!errors.annualInsurance}
                />
                {errorText("annualInsurance")}
                {!perSession && (
                  <div className="text-muted small mt-1">
                    Monthly ≈ ₹
                    {Math.round(
                      (Number(values.annualInsurance) || 0) / 12,
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
                    type="number"
                    name="TDSRate"
                    min={0}
                    max={100}
                    value={values.TDSRate}
                    disabled
                    onChange={handleChange}
                    onBlur={() => setFieldTouched("TDSRate", true)}
                    invalid={touched.TDSRate && !!errors.TDSRate}
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
                          "en-IN",
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
                  type="number"
                  name="annualInHandSalary"
                  min={0}
                  value={values.annualInHandSalary}
                  disabled
                  onChange={handleChange}
                  onBlur={() => setFieldTouched("annualInHandSalary", true)}
                  invalid={
                    touched.annualInHandSalary && !!errors.annualInHandSalary
                  }
                />
                {errorText("annualInHandSalary")}
                {!perSession && (
                  <div className="text-muted small mt-1">
                    Monthly ≈ ₹
                    {Math.round(
                      (Number(values.annualInHandSalary) || 0) / 12,
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
                      (opt) => opt.value === values.paymentType,
                    ) || null
                  }
                  onChange={(opt) =>
                    setFieldValue("paymentType", opt ? opt.value : "")
                  }
                  onBlur={() => setFieldTouched("paymentType", true)}
                />
                {errorText("paymentType")}
              </Col>
            </>
          )}

          {!ultraSimplifiedFinance && !simplified && (
            <>
              {/* EMPLOYEE GROUPS */}
              <Col md={6}>
                <Label htmlFor="employeeGroups">
                  Employee Group <span className="text-danger">*</span>
                </Label>
                <Select
                  inputId="employeeGroups"
                  options={employeeGroupOptions}
                  value={
                    employeeGroupOptions.find(
                      (opt) => opt.value === values.employeeGroups,
                    ) || null
                  }
                  onChange={(opt) =>
                    setFieldValue("employeeGroups", opt ? opt.value : "")
                  }
                  onBlur={() => setFieldTouched("employeeGroups", true)}
                />
                {errorText("employeeGroups")}
              </Col>

              {/* ACCOUNT */}
              <Col md={6}>
                <Label htmlFor="account">Account</Label>
                <Select
                  inputId="account"
                  options={accountOptions}
                  value={
                    accountOptions.find(
                      (opt) => opt.value === values.account,
                    ) || null
                  }
                  onChange={(opt) =>
                    setFieldValue("account", opt ? opt.value : "")
                  }
                  onBlur={() => setFieldTouched("account", true)}
                />
                {errorText("account")}
              </Col>

              {/* MINIMUM WAGES */}
              <Col md={6}>
                <Label htmlFor="minimumWages">Minimum Wages (Monthly)</Label>
                <Input
                  id="minimumWages"
                  type="number"
                  name="minimumWages"
                  value={values.minimumWages}
                  onChange={handleChange}
                />
              </Col>

              {/* IS IT AN INCREMENT? — only when editing an existing employee */}
              {mode === "MASTER" && isEdit && (
                <Col md={6}>
                  <Label htmlFor="isIncrement">Is it an increment?</Label>
                  <Select
                    inputId="isIncrement"
                    options={[
                      { label: "No", value: "NO" },
                      { label: "Yes", value: "YES" },
                    ]}
                    value={{
                      label: values.isIncrement === "YES" ? "Yes" : "No",
                      value: values.isIncrement,
                    }}
                    onChange={(opt) =>
                      setFieldValue("isIncrement", opt ? opt.value : "NO")
                    }
                  />
                </Col>
              )}

              {mode === "MASTER" && isEdit && values.isIncrement === "YES" && (
                <Col md={6}>
                  <Label htmlFor="incrementIssued">
                    Increment Issued Date <span className="text-danger">*</span>
                  </Label>
                  <Flatpickr
                    className={`form-control ${errors.incrementIssued ? "is-invalid" : ""}`}
                    id="incrementIssued"
                    name="incrementIssued"
                    value={values.incrementIssued}
                    onChange={([date]) => {
                      setFieldValue(
                        "incrementIssued",
                        date ? format(date, "yyyy-MM-dd") : "",
                      );
                    }}
                    options={{ dateFormat: "Y-m-d" }}
                  />
                  {errorText("incrementIssued")}
                </Col>
              )}

              {/* INCREMENT APPLICABLE DATE */}
              {mode === "MASTER" && isEdit && values.isIncrement === "YES" && (
                <Col md={6}>
                  <Label htmlFor="incrementApplicable">
                    Increment Applicable Date{" "}
                    <span className="text-danger">*</span>
                  </Label>
                  <Flatpickr
                    className={`form-control ${errors.incrementApplicable ? "is-invalid" : ""}`}
                    id="incrementApplicable"
                    name="incrementApplicable"
                    value={values.incrementApplicable}
                    onChange={([date]) => {
                      setFieldValue(
                        "incrementApplicable",
                        date ? format(date, "yyyy-MM-dd") : "",
                      );
                    }}
                    options={{ dateFormat: "Y-m-d" }}
                  />
                  {errorText("incrementApplicable")}
                </Col>
              )}

              {/* INCREMENT LETTER FILE */}
              {mode === "MASTER" && isEdit && values.isIncrement === "YES" && (
                <Col md={6}>
                  <Label>Increment Letter</Label>

                  <input
                    type="file"
                    hidden
                    ref={incrementLetterRef}
                    accept="image/*,application/pdf"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (!file) return;
                      await handleFileUpload({
                        file,
                        path: "EMPLOYEE_INCREMENT_LETTER",
                        urlField: "incrementLetterOld",
                        fileField: "incrementLetterFile",
                      });
                    }}
                  />

                  {values.incrementLetterOld ? (
                    <div className="d-flex gap-2 mt-2">
                      <Button
                        size="sm"
                        color="info"
                        onClick={() =>
                          handleFilePreview(
                            {
                              url: values.incrementLetterOld,
                              originalName: "IncrementLetter",
                            },
                            "incrementLetterOld",
                          )
                        }
                        disabled={uploading.incrementLetterFile}
                      >
                        {getFileActionLabel(
                          {
                            url: values.incrementLetterOld,
                            originalName: "IncrementLetter",
                          },
                          "incrementLetterOld",
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => incrementLetterRef.current.click()}
                        disabled={uploading.incrementLetterFile}
                      >
                        {uploading.incrementLetterFile ? (
                          <>
                            <Spinner size="sm" className="me-1" /> Uploading
                          </>
                        ) : (
                          "Upload New File"
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="d-block">
                      <Button
                        size="sm"
                        onClick={() => incrementLetterRef.current.click()}
                        disabled={uploading.incrementLetterFile}
                      >
                        {uploading.incrementLetterFile ? (
                          <>
                            <Spinner size="sm" className="me-1" /> Uploading
                          </>
                        ) : (
                          "Upload File"
                        )}
                      </Button>
                    </div>
                  )}
                </Col>
              )}

              {/* Short WAGES */}
              <Col md={6}>
                <Label htmlFor="shortWages">Short Wages (Monthly)</Label>
                <Input
                  disabled
                  id="shortWages"
                  type="number"
                  name="shortWages"
                  value={values.shortWages}
                />
              </Col>

              {/* GROSS SALARY */}
              <Col md={6}>
                <Label htmlFor="grossSalary">
                  Gross Salary (Yearly) <span className="text-danger">*</span>
                </Label>
                <Input
                  disabled
                  id="grossSalary"
                  type="number"
                  name="grossSalary"
                  value={values.grossSalary}
                />
                {errorText("grossSalary")}
                {monthlyHint("grossSalary")}
              </Col>

              {/* BASIC AMOUNT */}
              <Col md={6}>
                <Label htmlFor="basicAmount">
                  Basic Amount (Yearly) <span className="text-danger">*</span>
                </Label>
                <Input
                  id="basicAmount"
                  type="number"
                  name="basicAmount"
                  value={values.basicAmount}
                  onChange={handleChange}
                />
                {errorText("basicAmount")}
                {monthlyHint("basicAmount")}
              </Col>

              {/* BASIC PERCENTAGE */}
              <Col md={6}>
                <Label htmlFor="basicPercentage">Basic Percentage</Label>
                <Input
                  disabled
                  id="basicPercentage"
                  type="number"
                  name="basicPercentage"
                  value={values.basicPercentage}
                  onChange={handleChange}
                />
                {errorText("basicPercentage")}
              </Col>

              {/* HRA */}
              <Col md={6}>
                <Label htmlFor="HRA">
                  HRA (Yearly) <span className="text-danger">*</span>
                </Label>
                <Input
                  id="HRA"
                  type="number"
                  name="HRAAmount"
                  value={values.HRAAmount}
                  onChange={handleChange}
                />
                {monthlyHint("HRAAmount")}
              </Col>

              {/* HRA PERCENTAGE */}
              <Col md={6}>
                <Label htmlFor="HRAPercentage">HRA Percentage</Label>
                <Input
                  disabled
                  id="HRAPercentage"
                  type="number"
                  name="HRAPercentage"
                  value={values.HRAPercentage}
                  onChange={handleChange}
                />
                {errorText("HRAPercentage")}
              </Col>

              {/* SPECIAL ALLOWANCE */}
              <Col md={6}>
                <Label htmlFor="SPLAllowance">
                  SPL Allowance (Yearly) <span className="text-danger">*</span>
                </Label>
                <Input
                  name="SPLAllowance"
                  type="number"
                  value={values.SPLAllowance}
                  onChange={(e) => {
                    setManual((prev) => ({
                      ...prev,
                      SPLAllowance: true,
                    }));
                    handleChange(e);
                  }}
                />
                {monthlyHint("SPLAllowance")}
              </Col>

              {/* CONVEYANCE ALLOWANCE */}
              <Col md={6}>
                <Label htmlFor="conveyanceAllowance">
                  Conveyance Allowance (Yearly){" "}
                  <span className="text-danger">*</span>
                </Label>
                <Input
                  id="conveyanceAllowance"
                  type="number"
                  name="conveyanceAllowance"
                  value={values.conveyanceAllowance}
                  onChange={handleChange}
                />
                {monthlyHint("conveyanceAllowance")}
              </Col>

              {/* STATUTORY BONUS */}
              <Col md={6}>
                <Label htmlFor="statutoryBonus">
                  Statutory Bonus (Yearly){" "}
                  <span className="text-danger">*</span>
                </Label>
                <Input
                  id="statutoryBonus"
                  type="number"
                  name="statutoryBonus"
                  value={values.statutoryBonus}
                  onChange={handleChange}
                />
                {monthlyHint("statutoryBonus")}
              </Col>

              {/* INSURANCE */}
              <Col md={6}>
                <Label htmlFor="insurance">Insurance (Yearly)</Label>
                <Input
                  id="insurance"
                  type="number"
                  name="insurance"
                  value={values.insurance}
                  onChange={handleChange}
                />
                {monthlyHint("insurance")}
              </Col>

              {/* VARIABLE */}
              <Col md={6}>
                <Label htmlFor="variable">Variable (Yearly)</Label>
                <Input
                  id="variable"
                  type="number"
                  name="variable"
                  value={values.variable}
                  onChange={handleChange}
                />
                <div className="text-muted small mt-1">Added to yearly CTC</div>
              </Col>

              {/* REIMBURSEMENT */}
              <Col md={6}>
                <Label htmlFor="reimbursement">Reimbursement (Yearly)</Label>
                <Input
                  id="reimbursement"
                  type="number"
                  name="reimbursement"
                  value={values.reimbursement}
                  onChange={handleChange}
                />
                <div className="text-muted small mt-1">Added to yearly CTC</div>
              </Col>

              {/* LWF EMPLOYEE — auto-calculated from state */}
              <Col md={6}>
                <Label htmlFor="LWFEmployee">LWF Employee (Yearly)</Label>
                <Input
                  id="LWFEmployee"
                  type="number"
                  name="LWFEmployee"
                  value={values.LWFEmployee}
                  readOnly
                  disabled
                />
                {lwfScheduleText(lwfState) ? (
                  <div className="text-muted small mt-1">
                    Charged {lwfScheduleText(lwfState)}
                  </div>
                ) : (
                  <div className="text-muted small mt-1">
                    No LWF for this state
                  </div>
                )}
              </Col>

              {/* LWF EMPLOYER — auto-calculated from state */}
              <Col md={6}>
                <Label htmlFor="LWFEmployer">LWF Employer (Yearly)</Label>
                <Input
                  id="LWFEmployer"
                  type="number"
                  name="LWFEmployer"
                  value={values.LWFEmployer}
                  readOnly
                  disabled
                />
                {lwfScheduleText(lwfState) ? (
                  <div className="text-muted small mt-1">
                    Charged {lwfScheduleText(lwfState)}
                  </div>
                ) : (
                  <div className="text-muted small mt-1">
                    No LWF for this state
                  </div>
                )}
              </Col>

              {/* ESIC SALARY */}
              <Col md={6}>
                <Label htmlFor="ESICSalary">ESIC Salary (Yearly)</Label>
                <Input
                  disabled
                  id="ESICSalary"
                  type="number"
                  name="ESICSalary"
                  value={yearlyValue("ESICSalary")}
                />
                {monthlyHintFrom("ESICSalary")}
              </Col>

              {/* ESIC EMPLOYEE */}
              <Col md={6}>
                <Label htmlFor="ESICEmployee">ESIC Employee (Yearly)</Label>
                <Input
                  disabled
                  id="ESICEmployee"
                  type="number"
                  name="ESICEmployee"
                  value={yearlyValue("ESICEmployee")}
                />
                {monthlyHintFrom("ESICEmployee")}
              </Col>

              {/* ESIC EMPLOYER */}
              <Col md={6}>
                <Label htmlFor="ESICEmployer">ESIC Employer (Yearly)</Label>
                <Input
                  disabled
                  id="ESICEmployer"
                  type="number"
                  name="ESICEmployer"
                  value={yearlyValue("ESICEmployer")}
                />
                {monthlyHintFrom("ESICEmployer")}
              </Col>

              {/* TDS RATE */}
              <Col md={6}>
                <Label htmlFor="TDSRate">TDS Rate</Label>
                <Input
                  id="TDSRate"
                  type="number"
                  name="TDSRate"
                  value={values.TDSRate}
                  onChange={handleChange}
                />
              </Col>

              {/* PT */}
              <Col md={6}>
                <Label htmlFor="PT">PT (Yearly)</Label>
                <Input disabled id="PT" type="number" value={ptYearly} />
                <div className="text-muted small mt-1">
                  Monthly ≈ ₹{ptMonthly.toLocaleString("en-IN")}
                </div>
              </Col>

              {/* IN HAND SALARY */}
              <Col md={6}>
                <Label htmlFor="inHandSalary">In Hand Salary (Yearly)</Label>
                <Input
                  disabled
                  id="inHandSalary"
                  type="number"
                  name="inHandSalary"
                  value={inHandYearly}
                />
                {monthlyHintFrom("inHandSalary")}
              </Col>

              {/* PF AMOUNT */}
              <Col md={6}>
                <Label htmlFor="PFAmount">PF Amount (Yearly)</Label>
                <Input
                  disabled
                  id="PFAmount"
                  type="number"
                  name="PFAmount"
                  value={yearlyValue("PFAmount")}
                />
                {monthlyHintFrom("PFAmount")}
              </Col>

              {/* PF EMPLOYEE */}
              <Col md={6}>
                <Label htmlFor="PFEmployee">
                  PF Employee Contribution (Yearly)
                </Label>
                <Input
                  disabled
                  id="PFEmployee"
                  type="number"
                  name="PFEmployee"
                  value={yearlyValue("PFEmployee")}
                />
                {monthlyHintFrom("PFEmployee")}
              </Col>

              {/* PF EMPLOYER */}
              <Col md={6}>
                <Label htmlFor="PFEmployer">
                  PF Employer Contribution (Yearly)
                </Label>
                <Input
                  disabled
                  id="PFEmployer"
                  type="number"
                  name="PFEmployer"
                  value={yearlyValue("PFEmployer")}
                />
                {monthlyHintFrom("PFEmployer")}
              </Col>

              {/* TOTAL DEDUCTIONS */}
              <Col md={6}>
                <Label htmlFor="deductions">Total Deductions (Yearly)</Label>
                <Input
                  disabled
                  id="deductions"
                  type="number"
                  name="deductions"
                  value={deductionsYearly}
                />
                {monthlyHintFrom("deductions")}
              </Col>

              {/* DUPLICATE - WRONG VALUE (no LWF correction)
              <Col md={6}>
                <Label htmlFor="inHandSalary">In Hand Salary (Yearly)</Label>
                <Input
                  disabled
                  id="inHandSalary"
                  type="number"
                  name="inHandSalary"
                  value={yearlyValue("inHandSalary")}
                />
                {monthlyHintFrom("inHandSalary")}
              </Col>
              */}

              {/* GRATUITY */}
              <Col md={6}>
                <Label htmlFor="gratuity">Gratuity (Yearly)</Label>
                <Input
                  disabled
                  id="gratuity"
                  type="number"
                  name="gratuity"
                  value={yearlyValue("gratuity")}
                />
                {monthlyHintFrom("gratuity")}
              </Col>

              {/* TOTAL COST TO COMPANY */}
              <Col md={6}>
                <Label htmlFor="totalCostToCompany">
                  Total Cost To Company (Yearly)
                </Label>
                <Input
                  disabled
                  id="totalCostToCompany"
                  type="number"
                  name="totalCostToCompany"
                  value={ctcYearly}
                />
                {monthlyHintFrom("totalCostToCompany")}
              </Col>

              {/* DEBIT STATEMENT NARRATION */}
              <Col md={6}>
                <Label htmlFor="debitStatementNarration">
                  Debit Statement Narration
                </Label>

                <Input
                  id="debitStatementNarration"
                  name="debitStatementNarration"
                  value={values.debitStatementNarration}
                  onChange={(e) =>
                    handleChange({
                      target: {
                        name: "debitStatementNarration",
                        value: e.target.value.toUpperCase(),
                      },
                    })
                  }
                  onBlur={() =>
                    setFieldTouched("debitStatementNarration", true)
                  }
                  invalid={
                    touched.debitStatementNarration &&
                    !!errors.debitStatementNarration
                  }
                />
                {errorText("debitStatementNarration")}
              </Col>
            </>
          )}
        </Row>
              </TabPane>
          </TabContent>

          <div className="d-flex gap-2 justify-content-between my-3 mx-3">
            <div>
              {activeTabIndex > 0 && (
                <Button
                  color="secondary"
                  className="text-white"
                  onClick={handlePrevTab}
                >
                  Previous
                </Button>
              )}
            </div>
            <div className="d-flex gap-2">
              {view === "MODAL" && (
                <Button
                  color="secondary"
                  className="text-white"
                  onClick={onCancel}
                  disabled={form.isSubmitting}
                >
                  Cancel
                </Button>
              )}
              {activeTabIndex < FORM_TABS.length - 1 && (
                <Button color="primary" className="text-white" onClick={handleNextTab}>
                  Next
                </Button>
              )}
              {activeTabIndex === FORM_TABS.length - 1 &&
                (mode !== "NEW_JOINING" || view !== "PAGE" || hasCreatePermission) && (
                <Button
                  color="primary"
                  className="text-white"
                  onClick={form.handleSubmit}
                  disabled={
                    isSubmitting ||
                    !isValid ||
                    (isEdit && !initialData?._id) ||
                    missingMandatoryDocs.length > 0
                  }
                >
                  {isSubmitting ? (
                    <Spinner size="sm" />
                  ) : initialData ? (
                    "Update Employee"
                  ) : (
                    "Save Employee"
                  )}
                </Button>
              )}
            </div>
          </div>

        </>
        )}
      </div>
      <PreviewFile
        file={previewFile}
        isOpen={previewOpen}
        toggle={() => setPreviewOpen(false)}
      />
      <DeleteFileConfirmModal
        isOpen={deleteModalOpen}
        toggle={() => setDeleteModalOpen((prev) => !prev)}
        documentId={selectedDeleteFile?.documentId}
        fileId={selectedDeleteFile?.fileId}
        fileName={selectedDeleteFile?.fileName}
        onSuccess={handleExistingFileDeleteSuccess}
        employeeId={initialData?._id}
      />
    </>
  );
};

EmployeeForm.propTypes = {
  initialData: PropTypes.object,
  onSuccess: PropTypes.func,
  onCancel: PropTypes.func,
  view: PropTypes.oneOf(["MODAL", "PAGE"]),
  mode: PropTypes.string,
  hasCreatePermission: PropTypes.bool,
};

export default EmployeeForm;
