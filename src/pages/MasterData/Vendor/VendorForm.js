import React, { useState, useEffect, useRef, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import {
  createVendor,
  updateVendor,
  getVendorById,
  uploadVendorDocument,
} from "../../../helpers/backend_helper";
import { Row, Col, Label, Input, FormFeedback, Button } from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useAuthError } from "../../../Components/Hooks/useAuthError";
import { useReferenceList } from "../../../Components/Hooks/useReferenceData";
import { useDispatch } from "react-redux";
import { invalidateReferenceList } from "../../../store/features/reference/referenceSlice";
import { usePermissions } from "../../../Components/Hooks/useRoles.js";
import "./vendor.scss";

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const ENTITY_TYPES = [
  { value: "company", label: "Company" },
  { value: "proprietor", label: "Proprietor" },
  { value: "llp", label: "LLP" },
  { value: "huf", label: "HUF (Hindu Undivided Family)" },
  { value: "partnership", label: "Partnership" },
  { value: "individual", label: "Individual" },
  { value: "aop", label: "Association of Persons (AOP)" },
  { value: "trust", label: "Trust" },
  { value: "boi", label: "Body of Individuals (BOI)" },
  { value: "local_authority", label: "Local Authority" },
  {
    value: "artificial_juridical_person",
    label: "Artificial Juridical Person",
  },
  { value: "government", label: "Government" },
];

const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

const COUNTRIES = [
  "India",
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Congo",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Czech Republic",
  "Denmark",
  "Egypt",
  "Finland",
  "France",
  "Germany",
  "Greece",
  "Hong Kong",
  "Hungary",
  "Iceland",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Japan",
  "Kenya",
  "Malaysia",
  "Mexico",
  "Netherlands",
  "New Zealand",
  "Nigeria",
  "Norway",
  "Pakistan",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Russia",
  "Saudi Arabia",
  "Singapore",
  "South Africa",
  "South Korea",
  "Spain",
  "Sweden",
  "Switzerland",
  "Thailand",
  "Turkey",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Vietnam",
  "Zimbabwe",
];

const getDocTypes = (hasGstin, hasPan) => [
  {
    key: "gst_certificate",
    label: "GST Certificate",
    required: hasGstin,
    accept: "PDF, JPG, PNG",
  },
  {
    key: "pan_card",
    label: "PAN Card Copy",
    required: hasPan,
    accept: "PDF, JPG, PNG",
  },
  {
    key: "msme_certificate",
    label: "MSME Certificate",
    required: false,
    accept: "PDF, JPG, PNG",
  },
  {
    key: "cancelled_cheque",
    label: "Cancelled Cheque",
    required: true,
    accept: "PDF, JPG, PNG",
  },
  {
    key: "agreement_copy",
    label: "Agreement Copy",
    required: false,
    accept: "PDF only",
  },
  {
    key: "lower_tds_certificate",
    label: "Lower TDS Certificate",
    required: false,
    accept: "PDF, JPG, PNG",
  },
  {
    key: "sez_certificate",
    label: "SEZ Certificate",
    required: false,
    accept: "PDF, JPG, PNG",
  },
  {
    key: "coi",
    label: "Certificate of Incorporation (COI)",
    required: false,
    accept: "PDF, JPG, PNG",
  },
  {
    key: "moa",
    label: "Memorandum of Association (MOA)",
    required: false,
    accept: "PDF, JPG, PNG",
  },
  {
    key: "aoa",
    label: "Articles of Association (AOA)",
    required: false,
    accept: "PDF, JPG, PNG",
  },
];

const SECTION_ICONS = {
  identity: "bx bx-user",
  tax: "bx bx-file-blank",
  tds: "bx bx-calculator",
  contact: "bx bx-map-pin",
  bank: "bx bx-wallet",
  documents: "bx bx-file",
};

const VENDOR_CATEGORIES = [
  {
    value: "po_required",
    label: "PO Required Vendor",
    sub: "Full vendor record. Available when raising a Purchase Order.",
  },
  {
    value: "central_payment",
    label: "Central Payment Vendor",
    sub: "Only for Central Payment. Not shown when raising a PO.",
  },
];

const emptyInitialValues = {
  vendorCategory: "po_required",
  vendorType: "",
  tradeName: "",
  legalName: "",
  alias: "",
  supplyType: "",
  msmeRegistered: false,
  udyamNumber: "",
  autoCreateLedger: true,
  pan: "",
  cin: "",
  gstRegistrations: [],
  tdsApplicable: false,
  tdsSection: "",
  tdsRate: "",
  primaryContact: { name: "", phone: "", email: "", website: "" },
  registeredAddress: {
    line1: "",
    line2: "",
    pincode: "",
    city: "",
    country: "India",
    state: "",
  },
  billingAddress: {
    sameAsRegistered: true,
    line1: "",
    line2: "",
    pincode: "",
    city: "",
    country: "India",
    state: "",
  },
  bankDetails: {
    accountHolderName: "",
    accountNo: "",
    ifsc: "",
    bankName: "",
    branchName: "",
    accountType: "",
    upiId: "",
  },
  paymentTermId: "",
  preferredPaymentMode: "",
};

const validationSchema = Yup.object({
  tradeName: Yup.string().required("Trade name is required"),
  vendorType: Yup.string().required("Vendor type is required"),
  supplyType: Yup.string().required("Supply type is required"),
  cin: Yup.string().when("vendorType", {
    is: "company",
    then: (schema) => schema.required("CIN is required for Company vendors"),
  }),
  udyamNumber: Yup.string().when("msmeRegistered", {
    is: true,
    then: (schema) =>
      schema.required("Udyam number is required when MSME registered"),
  }),
  pan: Yup.string()
    .required("PAN is required")
    .matches(PAN_REGEX, "Enter a valid PAN, e.g. ABCDE1234F"),
  gstRegistrations: Yup.array().of(
    Yup.object({
      gstin: Yup.string()
        .required("GSTIN is required")
        .matches(GSTIN_REGEX, "Enter a valid GSTIN, e.g. 22AAAAA0000A1Z5"),
      registrationType: Yup.string().required(
        "GST registration type is required",
      ),
    }),
  ),
  tdsRate: Yup.number()
    .transform((v, o) => (o === "" ? undefined : v))
    .min(0, "TDS rate can't be negative")
    .max(100, "TDS rate can't exceed 100%")
    .nullable(),
  primaryContact: Yup.object({
    name: Yup.string().required("Contact person is required"),
    phone: Yup.string().required("Phone is required"),
    email: Yup.string()
      .email("Enter a valid email address")
      .required("Email is required"),
  }),
  registeredAddress: Yup.object({
    line1: Yup.string().required("Address line 1 is required"),
    pincode: Yup.string().required("Pincode is required"),
    city: Yup.string().required("City is required"),
    state: Yup.string().required("State is required"),
  }),
  billingAddress: Yup.object({
    line1: Yup.string().when("sameAsRegistered", {
      is: false,
      then: (schema) => schema.required("Address line 1 is required"),
    }),
    pincode: Yup.string().when("sameAsRegistered", {
      is: false,
      then: (schema) => schema.required("Pincode is required"),
    }),
    city: Yup.string().when("sameAsRegistered", {
      is: false,
      then: (schema) => schema.required("City is required"),
    }),
    state: Yup.string().when("sameAsRegistered", {
      is: false,
      then: (schema) => schema.required("State is required"),
    }),
  }),
  bankDetails: Yup.object({
    accountNo: Yup.string().required("Account number is required"),
    ifsc: Yup.string().required("IFSC code is required"),
    bankName: Yup.string().required("Bank name is required"),
  }),
});

// Central Payment vendors: payment details only, every field mandatory.
const centralPaymentSchema = Yup.object({
  tradeName: Yup.string().trim().required("Vendor Name is required"),
  pan: Yup.string()
    .required("PAN Card No. is required")
    .matches(PAN_REGEX, "Enter a valid PAN, e.g. ABCDE1234F"),
  bankDetails: Yup.object({
    ifsc: Yup.string()
      .required("Bank IFSC Code is required")
      .matches(IFSC_REGEX, "Enter a valid IFSC, e.g. SBIN0001234"),
    accountHolderName: Yup.string()
      .trim()
      .required("Account Holder Name is required"),
    accountNo: Yup.string().trim().required("Account No. is required"),
  }),
});

const formValidationSchema = Yup.lazy((values) =>
  values?.vendorCategory === "central_payment"
    ? centralPaymentSchema
    : validationSchema,
);

const buildTouchedFromErrors = (errors) => {
  if (Array.isArray(errors))
    return errors.map((e) => buildTouchedFromErrors(e));
  if (errors && typeof errors === "object") {
    const result = {};
    Object.keys(errors).forEach((key) => {
      result[key] = buildTouchedFromErrors(errors[key]);
    });
    return result;
  }
  return true;
};
const ADDRESS_FIELD_LABELS = {
  line1: "Address line 1",
  pincode: "Pincode",
  city: "City",
  state: "State",
};

// Turns Formik's nested error object into a plain list of human-readable field names
const collectMissingFields = (errors) => {
  const labels = [];

  if (errors.vendorType) labels.push("Vendor type");
  if (errors.tradeName) labels.push("Trade name");
  if (errors.supplyType) labels.push("Supply type");
  if (errors.udyamNumber) labels.push("Udyam number");
  if (errors.cin) labels.push("CIN");
  if (Array.isArray(errors.gstRegistrations)) {
    errors.gstRegistrations.forEach((regErr, idx) => {
      if (!regErr) return;
      if (regErr.gstin) labels.push(`GSTIN (Registration ${idx + 1})`);
      if (regErr.registrationType)
        labels.push(`GST registration type (Registration ${idx + 1})`);
    });
  } else if (typeof errors.gstRegistrations === "string") {
    labels.push("GST registration");
  }

  if (errors.primaryContact?.name) labels.push("Contact person");
  if (errors.primaryContact?.phone) labels.push("Phone");
  if (errors.primaryContact?.email) labels.push("Email");

  Object.entries(errors.registeredAddress || {}).forEach(([key]) => {
    if (ADDRESS_FIELD_LABELS[key])
      labels.push(`Registered Address – ${ADDRESS_FIELD_LABELS[key]}`);
  });

  Object.entries(errors.billingAddress || {}).forEach(([key]) => {
    if (ADDRESS_FIELD_LABELS[key])
      labels.push(`Billing Address – ${ADDRESS_FIELD_LABELS[key]}`);
  });

  if (errors.bankDetails?.accountHolderName) labels.push("Account holder name");
  if (errors.bankDetails?.accountNo) labels.push("Account number");
  if (errors.bankDetails?.ifsc) labels.push("IFSC code");
  if (errors.bankDetails?.bankName) labels.push("Bank name");

  return labels;
};

const SECTION_FIELD_MAP = {
  vendorType: "identity",
  tradeName: "identity",
  supplyType: "identity",
  udyamNumber: "identity",
  pan: "tax",
  cin: "tax",
  gstRegistrations: "tax",
  tdsSection: "tds",
  tdsRate: "tds",
  primaryContact: "contact",
  registeredAddress: "contact",
  billingAddress: "contact",
  bankDetails: "bank",
  paymentTerms: "bank",
  preferredPaymentMode: "bank",
};

const DocDropzone = ({
  docKey,
  label,
  required,
  accept,
  file,
  existingDoc,
  onSelect,
  onRemove,
}) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    accept: accept.includes("PDF only")
      ? { "application/pdf": [".pdf"] }
      : undefined,
    onDrop: (accepted) => {
      if (accepted[0]) onSelect(docKey, accepted[0]);
    },
  });

  const hasNewFile = !!file;
  const hasExistingDoc = !hasNewFile && !!existingDoc;

  let boxContent;

  if (hasNewFile) {
    boxContent = (
      <div className="d-flex align-items-center justify-content-center gap-2 flex-wrap text-center">
        <i className="bx bx-file" style={{ fontSize: 20 }}></i>
        <span className="small text-dark">{file.name}</span>
        <span
          className="vendor-status-pill"
          style={{
            background: "var(--v-warning-light)",
            color: "var(--v-warning)",
          }}
        >
          New — will upload on save
        </span>
        <Button
          size="sm"
          color="danger"
          outline
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(docKey);
          }}
        >
          <i className="bx bx-x"></i>
        </Button>
      </div>
    );
  } else if (hasExistingDoc) {
    boxContent = (
      <div className="d-flex align-items-center justify-content-center gap-2 flex-wrap text-center">
        <i
          className="bx bx-check-circle text-success"
          style={{ fontSize: 20 }}
        ></i>
        <a
          href={existingDoc.url}
          target="_blank"
          rel="noopener noreferrer"
          className="small text-success fw-semibold"
          onClick={(e) => e.stopPropagation()}
        >
          {existingDoc.originalName || "View uploaded file"}
        </a>
        <span className="text-muted small">(click box to replace)</span>
      </div>
    );
  } else {
    boxContent = (
      <div>
        <i
          className="bx bx-cloud-upload d-block mb-1"
          style={{ fontSize: 22 }}
        ></i>
        <span className="d-block">Click to upload or drag and drop</span>
        <span className="d-block" style={{ fontSize: 11 }}>
          {accept} — max 10 MB
        </span>
      </div>
    );
  }

  return (
    <div className="mb-3">
      <Label className="small mb-1">
        {label}
        {required ? (
          <>
            {" "}
            <span className="text-danger">*</span>
          </>
        ) : null}
      </Label>
      <div
        {...getRootProps()}
        className="vendor-repeat-empty"
        style={{
          cursor: "pointer",
          padding: "16px",
          borderColor: isDragActive
            ? "var(--v-primary)"
            : hasExistingDoc
              ? "var(--v-success)"
              : undefined,
          background: hasExistingDoc ? "var(--v-success-light)" : undefined,
        }}
      >
        <input {...getInputProps()} />
        {boxContent}
      </div>
    </div>
  );
};

const VendorForm = ({ vendorId, onSaved, onCancel }) => {
  const handleAuthError = useAuthError();
  const dispatch = useDispatch();
  const token = JSON.parse(localStorage.getItem("micrologin"))?.token;
  const { hasPermission } = usePermissions(token);
  const canCreate = hasPermission("MASTERDATA", "VENDOR", "WRITE");
  const canEdit = hasPermission("MASTERDATA", "VENDOR", "WRITE");
  const canUploadDocs = hasPermission("MASTERDATA", "VENDOR", "WRITE");
  const canSubmit = vendorId ? canEdit : canCreate;
  const [initialValues, setInitialValues] = useState(emptyInitialValues);
  const [documentFiles, setDocumentFiles] = useState({});
  const [loading, setLoading] = useState(!!vendorId);
  const [activeSection, setActiveSection] = useState("identity");

  const sectionRefs = {
    identity: useRef(null),
    tax: useRef(null),
    tds: useRef(null),
    contact: useRef(null),
    bank: useRef(null),
    documents: useRef(null),
  };

  useEffect(() => {
    if (!vendorId) return;
    const fetchVendor = async () => {
      try {
        const res = await getVendorById(vendorId);
        setInitialValues({
          ...emptyInitialValues,
          ...res?.data,
          vendorCategory: res?.data?.vendorCategory || "po_required",
          bankDetails: {
            ...emptyInitialValues.bankDetails,
            ...res?.data?.bankDetails,
          },
        });
      } catch (error) {
        if (!handleAuthError(error)) {
          toast.error(
            error?.response?.data?.message ||
              error?.message ||
              "Couldn't load this vendor. Please try again.",
          );
        }
      } finally {
        setLoading(false);
      }
    };
    fetchVendor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId]);
  const { items: paymentTermOptions } = useReferenceList("paymentTerms");

  const [, setApprovalStatus] = useState(
    initialValues?.approvalStatus || "incomplete",
  );
  useEffect(() => {
    if (initialValues?.approvalStatus) {
      setApprovalStatus(initialValues.approvalStatus);
    }
  }, [initialValues]);


  const validation = useFormik({
    enableReinitialize: true,
    initialValues,
    validationSchema: formValidationSchema,
    onSubmit: async (values) => {
      try {
        const isCentral = values.vendorCategory === "central_payment";
        const gstEntries = (values.gstRegistrations || []).map((g, idx) => ({
          index: idx + 1,
          gstin: (g.gstin || "").trim().toUpperCase(),
        }));

        const invalidEntry = gstEntries.find(
          (entry) => entry.gstin && !GSTIN_REGEX.test(entry.gstin),
        );
        if (invalidEntry) {
          toast.error(
            `GST Registration ${invalidEntry.index}: "${invalidEntry.gstin}" doesn't look like a valid GSTIN. It should be 15 characters, e.g. 22AAAAA0000A1Z5.`,
          );
          return;
        }

        const filledGstins = gstEntries.filter((entry) => entry.gstin);
        const duplicateEntry = filledGstins.find(
          (entry, i) =>
            filledGstins.findIndex((other) => other.gstin === entry.gstin) !==
            i,
        );
        if (duplicateEntry) {
          toast.error(
            `GST Registration ${duplicateEntry.index} has the same GSTIN as another registration. Each GST registration needs its own unique GSTIN.`,
          );
          return;
        }

        if (isCentral && canUploadDocs) {
          const hasPanCard =
            !!documentFiles["pan_card"] ||
            (values.documents || []).some((d) => d.docType === "pan_card");
          if (!hasPanCard) {
            toast.error("PAN Card upload is required — please upload it before saving.");
            return;
          }
        }

        if (canUploadDocs && !isCentral) {
          const hasCancelledCheque =
            !!documentFiles["cancelled_cheque"] ||
            (values.documents || []).some(
              (d) => d.docType === "cancelled_cheque",
            );
          if (!hasCancelledCheque) {
            toast.error(
              "Cancelled Cheque is required — please upload it before saving.",
            );
            return;
          }

          const hasGstin = (values.gstRegistrations || []).some(
            (g) => !!g.gstin,
          );
          if (hasGstin) {
            const hasGstCertificate =
              !!documentFiles["gst_certificate"] ||
              (values.documents || []).some(
                (d) => d.docType === "gst_certificate",
              );
            if (!hasGstCertificate) {
              toast.error(
                "GST Certificate is required since a GSTIN has been added.",
              );
              return;
            }
          }

          if (values.pan) {
            const hasPanCard =
              !!documentFiles["pan_card"] ||
              (values.documents || []).some((d) => d.docType === "pan_card");
            if (!hasPanCard) {
              toast.error(
                "PAN Card Copy is required since PAN has been added.",
              );
              return;
            }
          }
        }

        const payload = { ...values };
        delete payload._id;
        delete payload.__v;
        delete payload.vendorCode;
        delete payload.status;
        delete payload.createdAt;
        delete payload.updatedAt;
        delete payload.documents;
        delete payload.ledgerId;
        if (!payload.udyamNumber) delete payload.udyamNumber;
        if (!payload.cin) delete payload.cin;
        if (payload.tdsRate === "") delete payload.tdsRate;
        if (!payload.paymentTermId) delete payload.paymentTermId;
        if (!payload.preferredPaymentMode) delete payload.preferredPaymentMode;
        if (!payload.bankDetails.accountType)
          delete payload.bankDetails.accountType;
        payload.gstRegistrations = (payload.gstRegistrations || []).map(
          ({ _id, taxType, ...rest }) => ({
            ...rest,
            ...(taxType ? { taxType } : {}),
          }),
        );
        if (payload.billingAddress?.sameAsRegistered) {
          payload.billingAddress = {
            ...payload.registeredAddress,
            sameAsRegistered: true,
          };
        }
        let savedVendorId = vendorId;

        const body = isCentral
          ? {
              vendorCategory: "central_payment",
              tradeName: values.tradeName,
              pan: values.pan,
              bankDetails: {
                accountHolderName: values.bankDetails.accountHolderName,
                accountNo: values.bankDetails.accountNo,
                ifsc: values.bankDetails.ifsc,
              },
            }
          : { ...payload, vendorCategory: "po_required" };

        if (vendorId) {
          await updateVendor(vendorId, body);
        } else {
          const res = await createVendor(body);
          savedVendorId = res?.data?._id;
        }
        dispatch(invalidateReferenceList("vendors"));
        const docKeys = Object.keys(documentFiles);
        if (savedVendorId && docKeys.length > 0) {
          for (const docType of docKeys) {
            const file = documentFiles[docType];
            if (!file) continue;
            const formData = new FormData();
            formData.append("file", file);
            formData.append("docType", docType);
            try {
              await uploadVendorDocument(savedVendorId, formData);
            } catch (docErr) {
              toast.warn(`Failed to upload ${docType.replace(/_/g, " ")}`);
            }
          }
        }

        toast.success(
          vendorId
            ? "Vendor updated successfully"
            : "Vendor created successfully",
        );
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
  const isCentral = v.vendorCategory === "central_payment";

  const addGst = () =>
    validation.setFieldValue("gstRegistrations", [
      ...v.gstRegistrations,
      {
        gstin: "",
        registrationType: "",
        taxType: "",
        placeOfBusinessAddress: "",
        reverseChargeApplicable: false,
        isPrimary: v.gstRegistrations.length === 0,
      },
    ]);
  const removeGst = (idx) =>
    validation.setFieldValue(
      "gstRegistrations",
      v.gstRegistrations.filter((_, i) => i !== idx),
    );
  const updateGst = (idx, field, value) =>
    validation.setFieldValue(
      "gstRegistrations",
      v.gstRegistrations.map((g, i) =>
        i === idx ? { ...g, [field]: value } : g,
      ),
    );
  const setPrimaryGst = (idx) =>
    validation.setFieldValue(
      "gstRegistrations",
      v.gstRegistrations.map((g, i) => ({ ...g, isPrimary: i === idx })),
    );

  const toggleSameAsRegistered = (checked) => {
    if (checked) {
      validation.setFieldValue("billingAddress", {
        ...v.registeredAddress,
        sameAsRegistered: true,
      });
    } else {
      validation.setFieldValue("billingAddress", {
        sameAsRegistered: false,
        line1: "",
        line2: "",
        pincode: "",
        city: "",
        country: "India",
        state: "",
      });
    }
  };

  const sections = useMemo(
    () =>
      isCentral
        ? [
            {
              key: "identity",
              number: 1,
              title: "Central Payment Vendor",
              sub: "Vendor name, bank and PAN details",
              checks: [
                !!v.tradeName,
                !!v.bankDetails?.ifsc && IFSC_REGEX.test(v.bankDetails.ifsc),
                !!v.bankDetails?.accountHolderName,
                !!v.bankDetails?.accountNo,
                !!v.pan && PAN_REGEX.test(v.pan),
                ...(canUploadDocs
                  ? [
                      !!documentFiles["pan_card"] ||
                        (v.documents || []).some((d) => d.docType === "pan_card"),
                    ]
                  : []),
              ],
            },
          ]
        : [
      {
        key: "identity",
        number: 1,
        title: "Identity",
        sub: "Legal name, trade name, and vendor classification",
        checks: [!!v.vendorType, !!v.tradeName, !!v.supplyType],
      },
      {
        key: "tax",
        number: 2,
        title: "Tax & Legal Identifiers",
        sub: "PAN, CIN, GSTIN and GST classification",
        checks: [
          !!v.pan && PAN_REGEX.test(v.pan),
          ...(v.gstRegistrations.length > 0
            ? [
                v.gstRegistrations.every(
                  (g) =>
                    !!g.gstin &&
                    GSTIN_REGEX.test(g.gstin) &&
                    !!g.registrationType,
                ),
              ]
            : []),
          ...(v.vendorType === "company" ? [!!v.cin] : []),
        ],
      },
      {
        key: "tds",
        number: 3,
        title: "TDS Information",
        sub: "Optional — deduction at source",
        checks: v.tdsApplicable
          ? [
              !!v.tdsSection,
              v.tdsRate !== "" && v.tdsRate !== null && v.tdsRate !== undefined,
            ]
          : [],
      },
      {
        key: "contact",
        number: 4,
        title: "Contact & Address",
        sub: "Primary contact and addresses",
        checks: [
          !!v.primaryContact.name,
          !!v.primaryContact.phone,
          !!v.primaryContact.email,
          !!v.registeredAddress.line1,
          !!v.registeredAddress.pincode,
          !!v.registeredAddress.city,
          !!v.registeredAddress.state,
          ...(v.billingAddress.sameAsRegistered
            ? []
            : [
                !!v.billingAddress.line1,
                !!v.billingAddress.pincode,
                !!v.billingAddress.city,
                !!v.billingAddress.state,
              ]),
        ],
      },
      {
        key: "bank",
        number: 5,
        title: "Bank & Payments",
        sub: "Account, IFSC and payment terms",
        checks: [
          !!v.bankDetails.accountNo,
          !!v.bankDetails.ifsc,
          !!v.bankDetails.bankName,
        ],
      },
      ...(canUploadDocs
        ? [
            (() => {
              const hasGstin = (v.gstRegistrations || []).some(
                (g) => !!g.gstin,
              );
              const hasDoc = (key) =>
                !!documentFiles[key] ||
                (v.documents || []).some((d) => d.docType === key);

              return {
                key: "documents",
                number: 6,
                title: "Documents",
                sub: hasGstin
                  ? "Cancelled Cheque, GST Certificate and PAN Card required"
                  : "Cancelled Cheque required",
                checks: [
                  hasDoc("cancelled_cheque"),
                  ...(hasGstin
                    ? [hasDoc("gst_certificate"), hasDoc("pan_card")]
                    : []),
                ],
              };
            })(),
          ]
        : []),
    ],
    [v, canUploadDocs, documentFiles, isCentral],
  );

  const overall = useMemo(() => {
    let done = 0,
      total = 0;
    sections.forEach((s) => {
      total += s.checks.length;
      done += s.checks.filter(Boolean).length;
    });
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  }, [sections]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const key = Object.keys(sectionRefs).find(
            (k) => sectionRefs[k].current === visible.target,
          );
          if (key) setActiveSection(key);
        }
      },
      {
        root: null,
        rootMargin: "-80px 0px -60% 0px",
        threshold: [0.1, 0.3, 0.6],
      },
    );
    Object.values(sectionRefs).forEach(
      (ref) => ref.current && observer.observe(ref.current),
    );
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToSection = (key) => {
    sectionRefs[key]?.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setActiveSection(key);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const errors = await validation.validateForm();
    const errorKeys = Object.keys(errors);

    if (errorKeys.length > 0) {
      validation.setTouched(buildTouchedFromErrors(errors), false);
      const missingLabels = collectMissingFields(errors);
      const shown = missingLabels.slice(0, 5);
      const remaining = missingLabels.length - shown.length;
      toast.error(
        missingLabels.length > 0
          ? `Please fill in: ${shown.join(", ")}${
              remaining > 0 ? `, and ${remaining} more` : ""
            }.`
          : "Some required fields are missing. Please check the highlighted fields.",
      );
      const firstSectionKey = SECTION_FIELD_MAP[errorKeys[0]];
      if (firstSectionKey) scrollToSection(firstSectionKey);
      return;
    }

    validation.handleSubmit(e);
  };

  if (loading) {
    return (
      <div className="text-center py-5 text-muted">
        <i className="bx bx-loader-alt bx-spin fs-2 d-block mb-2"></i>
        Loading vendor…
      </div>
    );
  }

  return (
    <div className="vendor-page">
      <div className="d-flex justify-content-between align-items-center mb-4 vendor-form-header">
        <div>
          <h4 className="mb-1">{vendorId ? "Edit vendor" : "Add vendor"}</h4>
          <p className="text-muted mb-0 small">
            {vendorId
              ? "Update this vendor's master record."
              : "Add a new supplier to your vendor master."}
          </p>
        </div>
        <Button color="light" onClick={onCancel}>
          <i className="bx bx-x me-1"></i> Cancel
        </Button>
      </div>

      <form onSubmit={handleFormSubmit}>
        <div className="vendor-form-layout">
          {/* ---------- Left nav ---------- */}
          <div className="vendor-nav-col">
            <div
              className="vendor-nav-list"
              role="tablist"
              aria-label="Vendor form sections"
            >
              {sections.map((s) => {
                const done = s.checks.filter(Boolean).length;
                const complete =
                  s.checks.length > 0 && done === s.checks.length;
                return (
                  <div
                    key={s.key}
                    role="button"
                    tabIndex={0}
                    className={
                      "vendor-nav-item " +
                      (activeSection === s.key ? "is-active " : "") +
                      (complete ? "is-complete" : "")
                    }
                    onClick={() => scrollToSection(s.key)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && scrollToSection(s.key)
                    }
                  >
                    <div className="vendor-nav-number">
                      {complete ? <i className="bx bx-check"></i> : s.number}
                    </div>
                    <div>
                      <div className="vendor-nav-title">{s.title}</div>
                      <div className="vendor-nav-sub">
                        {s.checks.length > 0
                          ? `${done} of ${s.checks.length} required`
                          : s.sub}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="vendor-completion-card">
              <div className="d-flex justify-content-between align-items-center">
                <span className="small fw-semibold">Overall completion</span>
                <span className="small fw-semibold">{overall.pct}%</span>
              </div>
              <div className="vendor-completion-bar">
                <div
                  className="vendor-completion-fill"
                  style={{ width: `${overall.pct}%` }}
                ></div>
              </div>
              <p className="small text-muted mb-0">
                Based on required fields only — optional fields can stay empty.
              </p>
            </div>
          </div>

          {/* ---------- Sections ---------- */}
          <div className="vendor-sections-col">
            {/* Vendor Type */}
            <div className="vendor-section-card">
              <div className="vendor-section-body">
                <Label>
                  Vendor Type <span className="text-danger">*</span>
                </Label>
                <Row>
                  {VENDOR_CATEGORIES.map((c) => (
                    <Col md={6} key={c.value} className="mb-2">
                      <label
                        className="d-flex gap-2 p-3 border rounded"
                        style={{
                          cursor: vendorId ? "not-allowed" : "pointer",
                          opacity: vendorId && v.vendorCategory !== c.value ? 0.5 : 1,
                          borderColor:
                            v.vendorCategory === c.value ? "var(--v-primary)" : undefined,
                        }}
                      >
                        <Input
                          type="radio"
                          name="vendorCategory"
                          value={c.value}
                          checked={v.vendorCategory === c.value}
                          disabled={!!vendorId}
                          onChange={() => {
                            validation.setFieldValue("vendorCategory", c.value);
                            setDocumentFiles({});
                          }}
                        />
                        <span>
                          <span className="d-block fw-semibold">{c.label}</span>
                          <span className="d-block small text-muted">{c.sub}</span>
                        </span>
                      </label>
                    </Col>
                  ))}
                </Row>
                {vendorId && (
                  <div className="small text-muted">
                    Vendor Type can't be changed after the vendor is created.
                  </div>
                )}
              </div>
            </div>

            {isCentral && (
              <div className="vendor-section-card" ref={sectionRefs.identity}>
                <div className="vendor-section-header">
                  <div className="vendor-section-number">1</div>
                  <div>
                    <p className="vendor-section-title">Central Payment Vendor</p>
                    <p className="vendor-section-sub">
                      Vendor name, bank and PAN details
                    </p>
                  </div>
                </div>
                <div className="vendor-section-body">
                  <Row>
                    <Col md={6} className="mb-3">
                      <Label>
                        Vendor Name <span className="text-danger">*</span>
                      </Label>
                      <Input
                        name="tradeName"
                        value={v.tradeName}
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        invalid={validation.touched.tradeName && !!validation.errors.tradeName}
                      />
                      <FormFeedback>{validation.errors.tradeName}</FormFeedback>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Label>
                        Bank IFSC Code <span className="text-danger">*</span>
                      </Label>
                      <Input
                        name="bankDetails.ifsc"
                        value={v.bankDetails.ifsc}
                        onChange={(e) =>
                          validation.setFieldValue(
                            "bankDetails.ifsc",
                            e.target.value.toUpperCase(),
                          )
                        }
                        onBlur={validation.handleBlur}
                        invalid={validation.touched.bankDetails?.ifsc && !!validation.errors.bankDetails?.ifsc}
                      />
                      <FormFeedback>{validation.errors.bankDetails?.ifsc}</FormFeedback>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Label>
                        Account Holder Name <span className="text-danger">*</span>
                      </Label>
                      <Input
                        name="bankDetails.accountHolderName"
                        value={v.bankDetails.accountHolderName}
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        invalid={
                          validation.touched.bankDetails?.accountHolderName &&
                          !!validation.errors.bankDetails?.accountHolderName
                        }
                      />
                      <FormFeedback>
                        {validation.errors.bankDetails?.accountHolderName}
                      </FormFeedback>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Label>
                        Account No. <span className="text-danger">*</span>
                      </Label>
                      <Input
                        name="bankDetails.accountNo"
                        value={v.bankDetails.accountNo}
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        invalid={validation.touched.bankDetails?.accountNo && !!validation.errors.bankDetails?.accountNo}
                      />
                      <FormFeedback>{validation.errors.bankDetails?.accountNo}</FormFeedback>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Label>
                        PAN Card No. <span className="text-danger">*</span>
                      </Label>
                      <Input
                        name="pan"
                        value={v.pan}
                        onChange={(e) =>
                          validation.setFieldValue("pan", e.target.value.toUpperCase())
                        }
                        onBlur={validation.handleBlur}
                        invalid={validation.touched.pan && !!validation.errors.pan}
                      />
                      <FormFeedback>{validation.errors.pan}</FormFeedback>
                    </Col>
                    {canUploadDocs && (
                      <Col md={6}>
                        <DocDropzone
                          docKey="pan_card"
                          label="PAN Card Upload"
                          required
                          accept="PDF, JPG, PNG"
                          file={documentFiles["pan_card"]}
                          existingDoc={(v.documents || []).find(
                            (d) => d.docType === "pan_card",
                          )}
                          onSelect={(key, file) =>
                            setDocumentFiles((prev) => ({ ...prev, [key]: file }))
                          }
                          onRemove={(key) =>
                            setDocumentFiles((prev) => {
                              const next = { ...prev };
                              delete next[key];
                              return next;
                            })
                          }
                        />
                      </Col>
                    )}
                  </Row>
                </div>
              </div>
            )}

            {!isCentral && (
              <>
            {/* 1. Identity */}
            <div className="vendor-section-card" ref={sectionRefs.identity}>
              <div className="vendor-section-header">
                <div className="vendor-section-number">1</div>
                <div>
                  <div className="vendor-section-title-row">
                    <p className="vendor-section-title">Identity</p>
                    <i className={`${SECTION_ICONS.identity} text-muted`}></i>
                  </div>
                  <p className="vendor-section-sub">
                    Legal name, trade name, and vendor classification
                  </p>
                </div>
              </div>
              <div className="vendor-section-body">
                <Row>
                  <Col md={6} className="mb-3">
                    <Label>
                      Vendor type <span className="text-danger">*</span>
                    </Label>
                    <Input
                      type="select"
                      name="vendorType"
                      value={v.vendorType}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      invalid={
                        validation.touched.vendorType &&
                        !!validation.errors.vendorType
                      }
                    >
                      <option value="">Select vendor type</option>
                      {ENTITY_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </Input>
                    <FormFeedback>{validation.errors.vendorType}</FormFeedback>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Label>
                      Trade name <span className="text-danger">*</span>
                    </Label>{" "}
                    {/* <small className="vendor-hint-text">
                      Auto-fetched from GST verification, or enter manually
                    </small> */}
                    <Input
                      name="tradeName"
                      value={v.tradeName}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      invalid={
                        validation.touched.tradeName &&
                        !!validation.errors.tradeName
                      }
                    />
                    <FormFeedback>{validation.errors.tradeName}</FormFeedback>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Label>Legal name</Label>
                    {/* <small className="vendor-hint-text">
                      Auto-fetched from GST verification, or enter manually
                    </small> */}
                    <Input
                      name="legalName"
                      value={v.legalName}
                      onChange={validation.handleChange}
                    />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Label>Alias</Label>
                    <small className="vendor-hint-text">
                      Optional short name shown on invoices
                    </small>
                    <Input
                      name="alias"
                      value={v.alias}
                      onChange={validation.handleChange}
                      placeholder="e.g. Acme Systems"
                    />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Label>
                      Supply type <span className="text-danger">*</span>
                    </Label>{" "}
                    <Input
                      type="select"
                      name="supplyType"
                      value={v.supplyType}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      invalid={
                        validation.touched.supplyType &&
                        !!validation.errors.supplyType
                      }
                    >
                      <option value="">Select supply type</option>
                      <option value="goods">Goods</option>
                      <option value="service_supply">Service Supply</option>
                      <option value="both">Both (Goods & Service)</option>
                    </Input>
                    <FormFeedback>{validation.errors.supplyType}</FormFeedback>
                  </Col>
                </Row>
                <div className="vendor-toggle-grid mt-2">
                  <div className="vendor-toggle-cell">
                    <Label className="d-block mb-2">MSME registration</Label>
                    <label
                      htmlFor="msmeRegistered"
                      className={
                        "vendor-option-card" +
                        (v.msmeRegistered ? " is-checked" : "")
                      }
                    >
                      <Input
                        type="checkbox"
                        id="msmeRegistered"
                        name="msmeRegistered"
                        checked={v.msmeRegistered}
                        onChange={validation.handleChange}
                        className="form-check-input mt-1"
                      />
                      <div>
                        <p className="vendor-option-title">MSME registered</p>
                        <p className="vendor-option-sub">
                          Enable to record the Udyam / MSME number
                        </p>
                        {v.msmeRegistered && (
                          <Input
                            name="udyamNumber"
                            value={v.udyamNumber}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            onClick={(e) => e.stopPropagation()}
                            invalid={
                              validation.touched.udyamNumber &&
                              !!validation.errors.udyamNumber
                            }
                            placeholder="Udyam number"
                            className="mt-2"
                            bsSize="sm"
                          />
                        )}
                        <FormFeedback>
                          {validation.errors.udyamNumber}
                        </FormFeedback>
                      </div>
                    </label>
                  </div>
                  <div className="vendor-toggle-cell">
                    <Label className="d-block mb-2">Accounting ledger</Label>
                    <label
                      htmlFor="autoCreateLedger"
                      className={
                        "vendor-option-card" +
                        (v.autoCreateLedger ? " is-checked" : "")
                      }
                    >
                      <Input
                        type="checkbox"
                        id="autoCreateLedger"
                        name="autoCreateLedger"
                        checked={v.autoCreateLedger}
                        onChange={validation.handleChange}
                        className="form-check-input mt-1"
                      />
                      <div>
                        <p className="vendor-option-title">
                          Auto-create accounting ledger
                        </p>
                        <p className="vendor-option-sub">
                          Creates a ledger account for this vendor
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Tax & Legal Identifiers */}
            <div className="vendor-section-card" ref={sectionRefs.tax}>
              <div className="vendor-section-header">
                <div className="vendor-section-number">2</div>
                <div>
                  <div className="vendor-section-title-row">
                    <p className="vendor-section-title">
                      Tax & Legal Identifiers
                    </p>
                    <i className={`${SECTION_ICONS.tax} text-muted`}></i>
                  </div>
                  <p className="vendor-section-sub">
                    PAN, CIN, GSTIN and GST classification
                  </p>
                </div>
              </div>
              <div className="vendor-section-body">
                <Row>
                  <Col md={6} className="mb-3">
                    <Label>
                      PAN <span className="text-danger">*</span>
                    </Label>
                    <Input
                      name="pan"
                      className="text-uppercase"
                      value={v.pan}
                      onChange={(e) =>
                        validation.setFieldValue(
                          "pan",
                          e.target.value.toUpperCase(),
                        )
                      }
                      onBlur={validation.handleBlur}
                      invalid={
                        validation.touched.pan && !!validation.errors.pan
                      }
                      placeholder="ABCDE1234F"
                    />
                    <FormFeedback>{validation.errors.pan}</FormFeedback>
                  </Col>
                  {v.vendorType === "company" && (
                    <Col md={6} className="mb-3">
                      <Label>
                        CIN number <span className="text-danger">*</span>
                      </Label>
                      <Input
                        name="cin"
                        className="text-uppercase"
                        value={v.cin}
                        onChange={(e) =>
                          validation.setFieldValue(
                            "cin",
                            e.target.value.toUpperCase(),
                          )
                        }
                        placeholder="U12345MH2020PTC123456"
                      />
                    </Col>
                  )}
                </Row>

                <div className="d-flex justify-content-between align-items-center mb-3 mt-2 flex-wrap gap-2">
                  <Label className="mb-0 fw-semibold d-block">
                    <i className="bx bx-buildings me-1"></i> GST registrations (
                    {v.gstRegistrations.length})
                  </Label>
                  <Button
                    size="sm"
                    color="primary"
                    outline
                    type="button"
                    onClick={addGst}
                  >
                    <i className="bx bx-plus"></i> Add registration
                  </Button>
                </div>

                {v.gstRegistrations.length === 0 && (
                  <div className="vendor-repeat-empty">
                    <i
                      className="bx bx-buildings d-block mb-2"
                      style={{ fontSize: 22 }}
                    ></i>
                    No GST registrations added yet.
                  </div>
                )}

                {v.gstRegistrations.map((g, idx) => {
                  const trimmedGstin = (g.gstin || "").trim().toUpperCase();
                  const isDuplicateGstin =
                    !!trimmedGstin &&
                    v.gstRegistrations.filter(
                      (other) =>
                        (other.gstin || "").trim().toUpperCase() ===
                        trimmedGstin,
                    ).length > 1;
                  const isInvalidFormat =
                    !!trimmedGstin && !GSTIN_REGEX.test(trimmedGstin);
                  const gstinRequiredError =
                    validation.touched.gstRegistrations?.[idx]?.gstin &&
                    validation.errors.gstRegistrations?.[idx]?.gstin;

                  return (
                    <div key={idx} className="vendor-repeat-row">
                      <div className="d-flex justify-content-between mb-3">
                        <span className="vendor-repeat-row-title">
                          Registration {idx + 1}
                        </span>
                        {g.isPrimary && (
                          <span className="vendor-primary-badge">
                            <i className="bx bxs-star"></i> Primary
                          </span>
                        )}
                      </div>
                      <Row>
                        <Col md={12} className="mb-2">
                          <Label className="small mb-1">
                            GSTIN / UIN <span className="text-danger">*</span>
                          </Label>
                          <Input
                            className="text-uppercase"
                            placeholder="22AAAAA0000A1Z5"
                            value={g.gstin}
                            invalid={
                              isDuplicateGstin ||
                              isInvalidFormat ||
                              !!gstinRequiredError
                            }
                            onChange={(e) =>
                              updateGst(
                                idx,
                                "gstin",
                                e.target.value.toUpperCase(),
                              )
                            }
                            onBlur={() =>
                              validation.setFieldTouched(
                                `gstRegistrations[${idx}].gstin`,
                                true,
                              )
                            }
                          />
                          {gstinRequiredError && !trimmedGstin && (
                            <FormFeedback>GSTIN is required.</FormFeedback>
                          )}
                          {isInvalidFormat && (
                            <FormFeedback>
                              This doesn't look like a valid GSTIN. It should be
                              15 characters, e.g. 22AAAAA0000A1Z5.
                            </FormFeedback>
                          )}
                          {!isInvalidFormat && isDuplicateGstin && (
                            <FormFeedback>
                              Another registration already uses this GSTIN —
                              each one needs to be unique.
                            </FormFeedback>
                          )}
                        </Col>
                        <Col md={6} className="mb-2">
                          <Label className="small mb-1">
                            GST registration type{" "}
                            <span className="text-danger">*</span>
                          </Label>
                          <Input
                            type="select"
                            value={g.registrationType || ""}
                            onChange={(e) => {
                              updateGst(
                                idx,
                                "registrationType",
                                e.target.value,
                              );
                              validation.setFieldTouched(
                                `gstRegistrations[${idx}].registrationType`,
                                true,
                                false,
                              );
                            }}
                            invalid={
                              !!validation.touched.gstRegistrations?.[idx]
                                ?.registrationType &&
                              !!validation.errors.gstRegistrations?.[idx]
                                ?.registrationType
                            }
                          >
                            <option value="">Select type</option>
                            <option value="regular">Regular</option>
                            <option value="composition">Composition</option>
                            <option value="sez">SEZ</option>
                            <option value="unregistered">Unregistered</option>
                          </Input>
                          <FormFeedback>
                            {
                              validation.errors.gstRegistrations?.[idx]
                                ?.registrationType
                            }
                          </FormFeedback>
                        </Col>
                        <Col md={6} className="mb-2">
                          <Label className="small mb-1">GST tax type</Label>
                          <Input
                            type="select"
                            value={g.taxType || ""}
                            onChange={(e) =>
                              updateGst(idx, "taxType", e.target.value)
                            }
                          >
                            <option value="">Select tax type</option>
                            <option value="igst">IGST</option>
                            <option value="cgst_sgst">CGST + SGST</option>
                            <option value="ugst">UGST</option>
                            <option value="exempt">Exempt</option>
                          </Input>
                        </Col>
                        <Col md={12} className="mb-2">
                          <Label className="small mb-1">
                            Place of business address
                          </Label>
                          <Input
                            placeholder="Full address as per GST certificate"
                            value={g.placeOfBusinessAddress || ""}
                            onChange={(e) =>
                              updateGst(
                                idx,
                                "placeOfBusinessAddress",
                                e.target.value,
                              )
                            }
                          />
                        </Col>
                        <Col
                          md={7}
                          className="form-check d-flex align-items-center mb-2"
                        >
                          <Input
                            type="checkbox"
                            checked={g.reverseChargeApplicable}
                            onChange={(e) =>
                              updateGst(
                                idx,
                                "reverseChargeApplicable",
                                e.target.checked,
                              )
                            }
                            className="form-check-input"
                            id={`rc-${idx}`}
                          />
                          <Label
                            check
                            htmlFor={`rc-${idx}`}
                            className="ms-1 small mb-0"
                          >
                            Reverse charge — recipient pays GST directly
                          </Label>
                        </Col>
                        <Col
                          md={2}
                          className="form-check d-flex align-items-center mb-2"
                        >
                          <Input
                            type="checkbox"
                            checked={g.isPrimary}
                            onChange={() => setPrimaryGst(idx)}
                            className="form-check-input"
                            id={`gst-primary-${idx}`}
                          />
                          <Label
                            check
                            htmlFor={`gst-primary-${idx}`}
                            className="ms-1 small mb-0"
                          >
                            Primary
                          </Label>
                        </Col>
                        <Col md={3} className="text-end mb-2">
                          <Button
                            size="sm"
                            color="danger"
                            outline
                            type="button"
                            aria-label={`Remove GST registration ${idx + 1}`}
                            onClick={() => removeGst(idx)}
                          >
                            <i className="bx bx-trash me-1"></i> Remove
                          </Button>
                        </Col>
                      </Row>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. TDS Information */}
            <div className="vendor-section-card" ref={sectionRefs.tds}>
              <div className="vendor-section-header">
                <div className="vendor-section-number">3</div>
                <div>
                  <div className="vendor-section-title-row">
                    <p className="vendor-section-title">TDS Information</p>
                    <i className={`${SECTION_ICONS.tds} text-muted`}></i>
                    <span className="text-muted fw-normal small ms-1">
                      (Optional)
                    </span>
                  </div>
                  <p className="vendor-section-sub">
                    Tax deducted at source configuration
                  </p>
                </div>
              </div>
              <div className="vendor-section-body">
                <label
                  htmlFor="tdsApplicable"
                  className={
                    "vendor-option-card mb-3" +
                    (v.tdsApplicable ? " is-checked" : "")
                  }
                >
                  <Input
                    type="checkbox"
                    id="tdsApplicable"
                    name="tdsApplicable"
                    checked={v.tdsApplicable}
                    onChange={validation.handleChange}
                    className="form-check-input mt-1"
                  />
                  <div>
                    <p className="vendor-option-title">TDS is applicable</p>
                    <p className="vendor-option-sub">
                      Enable to configure section and deduction rate
                    </p>
                  </div>
                </label>
                {v.tdsApplicable && (
                  <Row>
                    <Col md={6} className="mb-3">
                      <Label>TDS section</Label>
                      <Input
                        name="tdsSection"
                        value={v.tdsSection}
                        onChange={validation.handleChange}
                        placeholder="e.g. 194C"
                      />
                    </Col>
                    <Col md={6} className="mb-3">
                      <Label>TDS rate (%)</Label>
                      <Input
                        type="number"
                        name="tdsRate"
                        value={v.tdsRate}
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        invalid={
                          validation.touched.tdsRate &&
                          !!validation.errors.tdsRate
                        }
                        placeholder="e.g. 2"
                      />
                      <FormFeedback>{validation.errors.tdsRate}</FormFeedback>
                    </Col>
                  </Row>
                )}
              </div>
            </div>

            {/* 4. Contact & Address */}
            <div className="vendor-section-card" ref={sectionRefs.contact}>
              <div className="vendor-section-header">
                <div className="vendor-section-number">4</div>
                <div>
                  <div className="vendor-section-title-row">
                    <p className="vendor-section-title">Contact & Address</p>
                    <i className={`${SECTION_ICONS.contact} text-muted`}></i>
                  </div>
                  <p className="vendor-section-sub">
                    Primary contact and addresses
                  </p>
                </div>
              </div>
              <div className="vendor-section-body">
                <p className="vendor-repeat-row-title mb-3">Primary contact</p>
                <Row className="mb-4">
                  <Col md={3} className="mb-2">
                    <Label className="small mb-1">
                      Contact person <span className="text-danger">*</span>
                    </Label>{" "}
                    <Input
                      value={v.primaryContact.name}
                      onChange={(e) =>
                        validation.setFieldValue(
                          "primaryContact.name",
                          e.target.value,
                        )
                      }
                      onBlur={validation.handleBlur}
                      name="primaryContact.name"
                      invalid={
                        !!validation.touched.primaryContact?.name &&
                        !!validation.errors.primaryContact?.name
                      }
                    />
                    <FormFeedback>
                      {validation.errors.primaryContact?.name}
                    </FormFeedback>
                  </Col>
                  <Col md={3} className="mb-2">
                    <Label className="small mb-1">
                      Phone <span className="text-danger">*</span>
                    </Label>{" "}
                    <Input
                      value={v.primaryContact.phone}
                      onChange={(e) =>
                        validation.setFieldValue(
                          "primaryContact.phone",
                          e.target.value,
                        )
                      }
                      onBlur={validation.handleBlur}
                      name="primaryContact.phone"
                      invalid={
                        !!validation.touched.primaryContact?.phone &&
                        !!validation.errors.primaryContact?.phone
                      }
                    />
                    <FormFeedback>
                      {validation.errors.primaryContact?.phone}
                    </FormFeedback>
                  </Col>
                  <Col md={3} className="mb-2">
                    <Label className="small mb-1">
                      Email <span className="text-danger">*</span>
                    </Label>{" "}
                    <Input
                      type="email"
                      value={v.primaryContact.email}
                      onChange={(e) =>
                        validation.setFieldValue(
                          "primaryContact.email",
                          e.target.value,
                        )
                      }
                      onBlur={validation.handleBlur}
                      name="primaryContact.email"
                      invalid={
                        !!validation.touched.primaryContact?.email &&
                        !!validation.errors.primaryContact?.email
                      }
                    />
                    <FormFeedback>
                      {validation.errors.primaryContact?.email}
                    </FormFeedback>
                  </Col>
                  <Col md={3} className="mb-2">
                    <Label className="small mb-1">Website</Label>
                    <Input
                      placeholder="https://"
                      value={v.primaryContact.website}
                      onChange={(e) =>
                        validation.setFieldValue(
                          "primaryContact.website",
                          e.target.value,
                        )
                      }
                    />
                  </Col>
                </Row>

                <p className="vendor-repeat-row-title mb-3">
                  Registered address
                </p>
                <Row className="mb-4">
                  <Col md={8} className="mb-2">
                    <Label className="small mb-1">
                      Address line 1 <span className="text-danger">*</span>
                    </Label>
                    <Input
                      value={v.registeredAddress.line1}
                      onChange={(e) =>
                        validation.setFieldValue(
                          "registeredAddress.line1",
                          e.target.value,
                        )
                      }
                    />
                  </Col>
                  <Col md={4} className="mb-2">
                    <Label className="small mb-1">Address line 2</Label>
                    <Input
                      value={v.registeredAddress.line2}
                      onChange={(e) =>
                        validation.setFieldValue(
                          "registeredAddress.line2",
                          e.target.value,
                        )
                      }
                    />
                  </Col>
                  <Col md={3} className="mb-2">
                    <Label className="small mb-1">
                      Pincode <span className="text-danger">*</span>
                    </Label>
                    <Input
                      value={v.registeredAddress.pincode}
                      onChange={(e) =>
                        validation.setFieldValue(
                          "registeredAddress.pincode",
                          e.target.value,
                        )
                      }
                    />
                  </Col>
                  <Col md={3} className="mb-2">
                    <Label className="small mb-1">
                      City <span className="text-danger">*</span>
                    </Label>
                    <Input
                      value={v.registeredAddress.city}
                      onChange={(e) =>
                        validation.setFieldValue(
                          "registeredAddress.city",
                          e.target.value,
                        )
                      }
                    />
                  </Col>
                  <Col md={3} className="mb-2">
                    <Label className="small mb-1">
                      Country <span className="text-danger">*</span>
                    </Label>
                    <Input
                      type="select"
                      value={v.registeredAddress.country}
                      onChange={(e) =>
                        validation.setFieldValue(
                          "registeredAddress.country",
                          e.target.value,
                        )
                      }
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Input>
                  </Col>
                  <Col md={3} className="mb-2">
                    <Label className="small mb-1">
                      State <span className="text-danger">*</span>
                    </Label>
                    {v.registeredAddress.country === "India" ? (
                      <Input
                        type="select"
                        value={v.registeredAddress.state}
                        onChange={(e) =>
                          validation.setFieldValue(
                            "registeredAddress.state",
                            e.target.value,
                          )
                        }
                      >
                        <option value="">Select state</option>
                        {INDIAN_STATES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </Input>
                    ) : (
                      <Input
                        value={v.registeredAddress.state}
                        onChange={(e) =>
                          validation.setFieldValue(
                            "registeredAddress.state",
                            e.target.value,
                          )
                        }
                        placeholder="State / province"
                      />
                    )}
                  </Col>
                </Row>

                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                  <p className="vendor-repeat-row-title mb-0">
                    Billing address
                  </p>
                  <label
                    htmlFor="sameAsRegistered"
                    className="form-check d-flex align-items-center mb-0"
                    style={{ cursor: "pointer" }}
                  >
                    <Input
                      type="checkbox"
                      id="sameAsRegistered"
                      checked={v.billingAddress.sameAsRegistered}
                      onChange={(e) => toggleSameAsRegistered(e.target.checked)}
                      className="form-check-input"
                    />
                    <span className="ms-1 small">
                      Same as registered address
                    </span>
                  </label>
                </div>

                {!v.billingAddress.sameAsRegistered && (
                  <Row>
                    <Col md={8} className="mb-2">
                      <Label className="small mb-1">
                        Address line 1 <span className="text-danger">*</span>
                      </Label>
                      <Input
                        value={v.billingAddress.line1}
                        onChange={(e) =>
                          validation.setFieldValue(
                            "billingAddress.line1",
                            e.target.value,
                          )
                        }
                        onBlur={validation.handleBlur}
                        name="billingAddress.line1"
                        invalid={
                          !!validation.touched.billingAddress?.line1 &&
                          !!validation.errors.billingAddress?.line1
                        }
                      />
                      <FormFeedback>
                        {validation.errors.billingAddress?.line1}
                      </FormFeedback>
                    </Col>
                    <Col md={4} className="mb-2">
                      <Label className="small mb-1">Address line 2</Label>
                      <Input
                        value={v.billingAddress.line2}
                        onChange={(e) =>
                          validation.setFieldValue(
                            "billingAddress.line2",
                            e.target.value,
                          )
                        }
                      />
                    </Col>
                    <Col md={3} className="mb-2">
                      <Label className="small mb-1">
                        Pincode <span className="text-danger">*</span>
                      </Label>
                      <Input
                        value={v.billingAddress.pincode}
                        onChange={(e) =>
                          validation.setFieldValue(
                            "billingAddress.pincode",
                            e.target.value,
                          )
                        }
                        onBlur={validation.handleBlur}
                        name="billingAddress.pincode"
                        invalid={
                          !!validation.touched.billingAddress?.pincode &&
                          !!validation.errors.billingAddress?.pincode
                        }
                      />
                      <FormFeedback>
                        {validation.errors.billingAddress?.pincode}
                      </FormFeedback>
                    </Col>
                    <Col md={3} className="mb-2">
                      <Label className="small mb-1">
                        City <span className="text-danger">*</span>
                      </Label>
                      <Input
                        value={v.billingAddress.city}
                        onChange={(e) =>
                          validation.setFieldValue(
                            "billingAddress.city",
                            e.target.value,
                          )
                        }
                        onBlur={validation.handleBlur}
                        name="billingAddress.city"
                        invalid={
                          !!validation.touched.billingAddress?.city &&
                          !!validation.errors.billingAddress?.city
                        }
                      />
                      <FormFeedback>
                        {validation.errors.billingAddress?.city}
                      </FormFeedback>
                    </Col>
                    <Col md={3} className="mb-2">
                      <Label className="small mb-1">
                        Country <span className="text-danger">*</span>
                      </Label>
                      <Input
                        type="select"
                        value={v.billingAddress.country}
                        onChange={(e) =>
                          validation.setFieldValue(
                            "billingAddress.country",
                            e.target.value,
                          )
                        }
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </Input>
                    </Col>
                    <Col md={3} className="mb-2">
                      <Label className="small mb-1">
                        State <span className="text-danger">*</span>
                      </Label>
                      {v.billingAddress.country === "India" ? (
                        <Input
                          type="select"
                          value={v.billingAddress.state}
                          onChange={(e) =>
                            validation.setFieldValue(
                              "billingAddress.state",
                              e.target.value,
                            )
                          }
                          onBlur={validation.handleBlur}
                          name="billingAddress.state"
                          invalid={
                            !!validation.touched.billingAddress?.state &&
                            !!validation.errors.billingAddress?.state
                          }
                        >
                          <option value="">Select state</option>
                          {INDIAN_STATES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </Input>
                      ) : (
                        <Input
                          value={v.billingAddress.state}
                          onChange={(e) =>
                            validation.setFieldValue(
                              "billingAddress.state",
                              e.target.value,
                            )
                          }
                          onBlur={validation.handleBlur}
                          name="billingAddress.state"
                          invalid={
                            !!validation.touched.billingAddress?.state &&
                            !!validation.errors.billingAddress?.state
                          }
                        />
                      )}
                      <FormFeedback>
                        {validation.errors.billingAddress?.state}
                      </FormFeedback>
                    </Col>
                  </Row>
                )}
              </div>
            </div>

            {/* 5. Bank & Payments */}
            <div className="vendor-section-card" ref={sectionRefs.bank}>
              <div className="vendor-section-header">
                <div className="vendor-section-number">5</div>
                <div>
                  <div className="vendor-section-title-row">
                    <p className="vendor-section-title">Bank & Payments</p>
                    <i className={`${SECTION_ICONS.bank} text-muted`}></i>
                  </div>
                  <p className="vendor-section-sub">
                    Account, IFSC and payment terms
                  </p>
                </div>
              </div>
              <div className="vendor-section-body">
                <Row>
                  <Col md={6} className="mb-3">
                    <Label>
                      Account number <span className="text-danger">*</span>
                    </Label>
                    <Input
                      value={v.bankDetails.accountNo}
                      onChange={(e) =>
                        validation.setFieldValue(
                          "bankDetails.accountNo",
                          e.target.value,
                        )
                      }
                      onBlur={validation.handleBlur}
                      name="bankDetails.accountNo"
                      invalid={
                        !!validation.touched.bankDetails?.accountNo &&
                        !!validation.errors.bankDetails?.accountNo
                      }
                    />
                    <FormFeedback>
                      {validation.errors.bankDetails?.accountNo}
                    </FormFeedback>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Label>
                      IFSC code <span className="text-danger">*</span>
                    </Label>
                    <Input
                      className="text-uppercase"
                      value={v.bankDetails.ifsc}
                      onChange={(e) =>
                        validation.setFieldValue(
                          "bankDetails.ifsc",
                          e.target.value.toUpperCase(),
                        )
                      }
                      onBlur={validation.handleBlur}
                      name="bankDetails.ifsc"
                      invalid={
                        !!validation.touched.bankDetails?.ifsc &&
                        !!validation.errors.bankDetails?.ifsc
                      }
                      placeholder="e.g. HDFC0001234"
                    />
                    <FormFeedback>
                      {validation.errors.bankDetails?.ifsc}
                    </FormFeedback>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Label>
                      Bank name <span className="text-danger">*</span>
                    </Label>
                    <Input
                      value={v.bankDetails.bankName}
                      onChange={(e) =>
                        validation.setFieldValue(
                          "bankDetails.bankName",
                          e.target.value,
                        )
                      }
                      onBlur={validation.handleBlur}
                      name="bankDetails.bankName"
                      invalid={
                        !!validation.touched.bankDetails?.bankName &&
                        !!validation.errors.bankDetails?.bankName
                      }
                    />
                    <FormFeedback>
                      {validation.errors.bankDetails?.bankName}
                    </FormFeedback>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Label>Account type</Label>
                    <Input
                      type="select"
                      value={v.bankDetails.accountType || ""}
                      onChange={(e) =>
                        validation.setFieldValue(
                          "bankDetails.accountType",
                          e.target.value,
                        )
                      }
                    >
                      <option value="">Select account type</option>
                      <option value="savings">Savings</option>
                      <option value="current">Current</option>
                    </Input>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Label>UPI ID</Label>
                    <small className="vendor-hint-text">
                      Optional, for faster low-value settlements
                    </small>
                    <Input
                      placeholder="vendor@okhdfcbank"
                      value={v.bankDetails.upiId}
                      onChange={(e) =>
                        validation.setFieldValue(
                          "bankDetails.upiId",
                          e.target.value,
                        )
                      }
                    />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Label>Payment terms</Label>
                    <Input
                      type="select"
                      name="paymentTermId"
                      value={v.paymentTermId}
                      onChange={validation.handleChange}
                    >
                      <option value="">Select terms</option>
                      {paymentTermOptions.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.code} ({p.dueDays} day{p.dueDays === 1 ? "" : "s"})
                        </option>
                      ))}
                    </Input>
                  </Col>
                </Row>
              </div>
            </div>

            {/* 6. Documents */}
            {canUploadDocs && (
              <div className="vendor-section-card" ref={sectionRefs.documents}>
                <div className="vendor-section-header">
                  <div className="vendor-section-number">6</div>
                  <div>
                    <div className="vendor-section-title-row">
                      <p className="vendor-section-title">Documents</p>
                      <i
                        className={`${SECTION_ICONS.documents} text-muted`}
                      ></i>
                      <span className="text-muted fw-normal small ms-1">
                        (Cancelled Cheque required)
                      </span>
                    </div>
                    <p className="vendor-section-sub">KYB supporting files</p>
                  </div>
                </div>
                <div className="vendor-section-body">
                  <p className="text-muted small mb-3">
                    Select files below — they'll upload automatically once you
                    save this vendor.
                  </p>
                  {(() => {
                    const hasGstin = (v.gstRegistrations || []).some(
                      (g) => !!g.gstin,
                    );
                    const hasPan = !!v.pan;
                    const DOC_TYPES = getDocTypes(hasGstin, hasPan);
                    return (
                      <Row>
                        {DOC_TYPES.map((doc) => (
                          <Col md={6} key={doc.key}>
                            <DocDropzone
                              docKey={doc.key}
                              label={doc.label}
                              required={doc.required}
                              accept={doc.accept}
                              file={documentFiles[doc.key]}
                              existingDoc={(v.documents || []).find(
                                (d) => d.docType === doc.key,
                              )}
                              onSelect={(key, file) =>
                                setDocumentFiles((prev) => ({
                                  ...prev,
                                  [key]: file,
                                }))
                              }
                              onRemove={(key) =>
                                setDocumentFiles((prev) => {
                                  const next = { ...prev };
                                  delete next[key];
                                  return next;
                                })
                              }
                            />
                          </Col>
                        ))}
                      </Row>
                    );
                  })()}
                </div>
              </div>
            )}
              </>
            )}
          </div>
        </div>

        {/* {vendorId && canChangeStatus && (
          <div
            className="vendor-approval-workflow"
            style={{ gridTemplateColumns: "1fr" }}
          >
            <div className="vendor-approval-col">
              <h6 className="vendor-approval-title">
                <i className="bx bx-shield-quarter me-1"></i> Verification
              </h6>
              <p className="vendor-approval-sub">
                Confirm this vendor's details have been reviewed and are
                correct.
              </p>

              <span
                className={`vendor-status-pill ${
                  approvalStatus === "approved"
                    ? "status-active"
                    : "status-inactive"
                }`}
              >
                {approvalStatus === "approved" ? "Verified" : "Unverified"}
              </span>

              <div className="mt-3">
                {approvalStatus !== "approved" ? (
                  <Button
                    color="dark"
                    size="sm"
                    disabled={
                      submittingApproval || overall.done < overall.total
                    }
                    onClick={async () => {
                      setSubmittingApproval(true);
                      try {
                        await updateVendorApprovalStatus(vendorId, "approved");
                        dispatch(invalidateReferenceList("vendors"));
                        setApprovalStatus("approved");
                        toast.success("Vendor marked as verified");
                      } catch (error) {
                        if (!handleAuthError(error))
                          toast.error("Couldn't update");
                      } finally {
                        setSubmittingApproval(false);
                      }
                    }}
                  >
                    {submittingApproval ? "Saving..." : "Mark as Verified"}
                  </Button>
                ) : (
                  <Button
                    color="light"
                    size="sm"
                    disabled={submittingApproval}
                    onClick={async () => {
                      setSubmittingApproval(true);
                      try {
                        await updateVendorApprovalStatus(
                          vendorId,
                          "incomplete",
                        );
                        dispatch(invalidateReferenceList("vendors"));
                        setApprovalStatus("incomplete");
                        toast.success("Vendor marked as unverified");
                      } catch (error) {
                        if (!handleAuthError(error))
                          toast.error("Couldn't update");
                      } finally {
                        setSubmittingApproval(false);
                      }
                    }}
                  >
                    {submittingApproval ? "Saving..." : "Mark as Unverified"}
                  </Button>
                )}
              </div>

              {approvalStatus !== "approved" &&
                overall.done < overall.total && (
                  <div className="vendor-approval-hint">
                    Complete all required fields before marking as verified.
                  </div>
                )}
            </div>
          </div>
        )} */}

        <div className="vendor-form-footer">
          <div>
            <div className="vendor-footer-status-title">
              <i className="bx bx-save me-1"></i>{" "}
              {vendorId ? "Editing vendor" : "Draft in progress"}
            </div>
            <div className="vendor-footer-status-sub">
              {overall.done} of {overall.total} required fields complete
            </div>
          </div>
          <div className="vendor-footer-actions">
            <Button type="button" color="light" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              color="dark"
              disabled={validation.isSubmitting || !canSubmit}
            >
              {validation.isSubmitting ? (
                <>
                  <i className="bx bx-loader-alt bx-spin me-1"></i> Saving…
                </>
              ) : (
                <>
                  <i className="bx bx-save me-1"></i>{" "}
                  {vendorId ? "Save changes" : "Create vendor"}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default VendorForm;
