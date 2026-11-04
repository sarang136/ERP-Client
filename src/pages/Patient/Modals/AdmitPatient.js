import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  Button,
  Col,
  Form,
  FormFeedback,
  Input,
  Label,
  Row,
  Spinner,
} from "reactstrap";
import Select from "react-select";
import { isValidPhoneNumber } from "react-phone-number-input";
import PhoneInputWithCountrySelect from "react-phone-number-input";
import "react-phone-number-input/style.css";

import * as Yup from "yup";
import {
  isEnteredIdentifier,
  isMaskedIdentifier,
} from "../../../helpers/maskedIdentifier";
import { useFormik } from "formik";
import Flatpicker from "react-flatpickr";
import "flatpickr/dist/themes/material_green.css";

import CustomModal from "../../../Components/Common/Modal";
import { connect, useDispatch } from "react-redux";
import {
  admitIpdPatient,
  admitDischargePatient,
  editAdmission,
  fetchDoctors,
  fetchReferrals,
} from "../../../store/actions";
import {
  ADMIT_PATIENT,
  EDIT_ADMISSION,
} from "../../../Components/constants/patient";
import FormField from "../../../Components/Common/FormField";
import Divider from "../../../Components/Common/Divider";
import { format } from "date-fns";
import axios from "axios";
import { toast } from "react-toastify";
import { getICDCodes } from "../../../helpers/backend_helper";
import ReferralSourceFields from "../../../Components/Patient/ReferralSourceFields";
import {
  REFERRAL_SOURCE_KEYS,
  REFERRAL_SOURCE_OPTIONS,
  REFERRAL_SOURCES_REQUIRING_REF,
} from "../../../Components/constants/referralSources";

// "NA" on Nurse / RMO / MSW / Visiting Consultant: nobody assigned. The server stores the field as null
// (and closes the previous person's assignment on an edit).
const STAFF_NA = "NA";
const STAFF_NA_OPTION = { _id: STAFF_NA, name: "NA" };

// Ahmedabad is closed to new admissions — they must go to Ahmedabad-2 instead.
// Matched on the exact trimmed title rather than an _id so the block holds in
// staging/dev where the ids differ, and compared with === (not includes) so
// "Ahmedabad-2" itself is never caught by its own block rule.
const BLOCKED_CENTER_TITLE = "Ahmedabad";
const BLOCKED_CENTER_ALTERNATIVE = "Ahmedabad-2";

const isBlockedCenterTitle = (title) =>
  String(title ?? "")
    .trim()
    .toLowerCase() === BLOCKED_CENTER_TITLE.toLowerCase();

const AdmitPatient = ({
  isOpen,
  data,
  patient,
  centers,
  doctors,
  counsellors,
  nurses,
  rmos,
  msws,
  visitingConsultants,
  chartAdmissions,
  doctorLoading,
  referrals,
  referralsLoading,
}) => {
  const dispatch = useDispatch();
  // Nurse, RMO, MSW and Visiting Consultant ride on the chart's admissions. "Edit Admission" is also
  // opened from Billing, whose admission rows don't carry them, so fall back to
  // the chart's copy of the same admission rather than showing them blank.
  const chartAdmission = data?._id
    ? (chartAdmissions || []).find((a) => a._id === data._id)
    : null;
  const assignedNurse = data?.nurse || chartAdmission?.nurse;
  const assignedRmo = data?.rmo || chartAdmission?.rmo;
  const assignedMsw = data?.msw || chartAdmission?.msw;
  const assignedVisitingConsultant =
    data?.visitingConsultant || chartAdmission?.visitingConsultant;
  const [step, setStep] = useState(1);
  const [isOtherReferral, setIsOtherReferral] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [icdOptions, setIcdOptions] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const toggle = () =>
    dispatch(admitDischargePatient({ data: null, isOpen: "" }));

  const dateOfBirth = patient?.dateOfBirth
    ? format(new Date(patient.dateOfBirth), "yyyy-MM-dd")
    : "";

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      admissionId: data?._id || "",
      patientId: patient?._id || "",
      name: patient ? patient.name : "",
      phoneNumber: patient ? patient.phoneNumber : "",
      email: patient ? patient.email : "",
      dateOfBirth,
      gender: patient ? patient.gender : "",
      aadhaarCardNumber: patient ? patient.aadhaarCardNumber : "",
      passportNumber: patient ? patient.passportNumber || "" : "",
      address: patient ? patient.address : "",
      nationality: patient ? patient.nationality || "Indian" : "Indian",
      //guardian
      guardianName: patient ? patient.guardianName : "",
      guardianRelation: patient ? patient.guardianRelation : "",
      guardianPhoneNumber: patient ? patient.guardianPhoneNumber : "",
      referredBy: patient
        ? patient.referredBy?.source
          ? ""
          : patient.referredBy?.doctorName || patient.referredBy
        : "",
      referralPhoneNumber: patient?.referredBy?.mobileNumber || "",
      referralType: patient?.referredBy?.speciality || "",
      referralSource: patient?.referredBy?.source || "",
      referralRefId:
        patient?.referredBy?.employee ||
        patient?.referredBy?.referringPatient ||
        "",
      referralName: patient?.referredBy?.name || "",
      ipdFileNumber: patient ? patient.ipdFileNumber : "",

      //admission
      center: data ? data.center?._id : "",
      addmissionDate: data ? new Date(data.addmissionDate) : "",
      ...(data?.dischargeDate && {
        dischargeDate: data ? new Date(data.dischargeDate) : "",
      }),
      psychologist: data ? data.psychologist?._id : "",
      doctor: data ? data.doctor?._id : "",
      // Optional. Nobody assigned (including admissions that predate these
      // fields) shows as "NA"; the server stores that as null.
      nurse: assignedNurse?._id || STAFF_NA,
      rmo: assignedRmo?._id || STAFF_NA,
      msw: assignedMsw?._id || STAFF_NA,
      visitingConsultant: assignedVisitingConsultant?._id || STAFF_NA,
      provisional_diagnosis: [],
      Ipdnum: data ? data.Ipdnum : "",
      ward: data ? data.ward || "" : "",
      bed: data ? data.bed || "" : "",
    },
    validationSchema: Yup.object({
      //patient
      // aadhaarCardNumber: Yup.string()
      //   .nullable()
      //   .notRequired()
      //   .matches(
      //     /^$|^[0-9]{12}$/,
      //     "Aadhaar Card Number must be exactly 12 digits"
      //   ),
      // aadhaarCard: Yup.string().required("Please select Aadhaar Card"),
      name: Yup.string().required("Please select Name"),
      phoneNumber: Yup.string()
        .required("Please select Phone Number")
        .test("is-valid-phone", "Invalid phone number", function (value) {
          return isValidPhoneNumber(value || "");
        }),
      email: Yup.string()
        .email("Please enter a valid email")
        .nullable()
        .notRequired(),
      dateOfBirth: Yup.string().required("Please select Date of birth"),
      gender: Yup.string().required("Please select Gender"),
      aadhaarCardNumber: Yup.string()
        .nullable()
        .notRequired()
        .when("nationality", {
          is: "Indian",
          then: (schema) =>
            schema
              .required("Aadhaar Card Number is required")
              // The mask the server returns for an existing number satisfies
              // "required" but is not twelve digits, so only check the format
              // when the value was actually typed.
              .test(
                "aadhaar-format",
                "Aadhaar Card Number must be exactly 12 digits",
                (value) =>
                  !isEnteredIdentifier(value) ||
                  /^[0-9]{12}$/.test(value.trim()),
              ),
        }),
      passportNumber: Yup.string()
        .nullable()
        .notRequired()
        .when("nationality", {
          is: "Foreigner",
          then: (schema) =>
            schema.required("Passport Number is required for foreign nationals"),
        }),
      address: Yup.string().required("Please select Address"),
      nationality: Yup.string().required("Please select Nationality"),
      guardianName: Yup.string().required("Please select Guardian Name"),
      guardianRelation: Yup.string().required(
        "Please select Guardian Relation",
      ),
      guardianPhoneNumber: Yup.string()
        .required("Please select Guardian Phone Number")
        .test(
          "is-valid-guardian-phone",
          "Invalid phone number",
          function (value) {
            return isValidPhoneNumber(value || "");
          },
        ),
      referredBy: Yup.string().when("referralSource", {
        is: (v) => !!v,
        then: (schema) => schema.notRequired(),
        otherwise: (schema) => schema.required("Please select Referred By"),
      }),
      referralRefId: Yup.string().when("referralSource", {
        is: (v) => REFERRAL_SOURCES_REQUIRING_REF.includes(v),
        then: (schema) => schema.required("Please select a value"),
        otherwise: (schema) => schema.nullable().notRequired(),
      }),
      referralPhoneNumber: Yup.string()
        .nullable()
        .notRequired()
        .test(
          "is-valid-referral-phone",
          "Invalid phone number",
          function (value) {
            if (!value) return true;
            return isValidPhoneNumber(value);
          },
        ),
      // ipdFileNumber: Yup.string().required("Please select Ipd File Number"),
      //admission
      addmissionDate: Yup.date().required("Please select addmission date"),
      center: Yup.string().required("Please select center"),
      psychologist: Yup.string().required("Please select Psychologist"),
      doctor: Yup.string().required("Please select Doctor"),
      provisional_diagnosis: Yup.array()
        .min(1, "Please select at least one Provisional Diagnosis")
        .required("Please select Provisional Diagnosis"),
      Ipdnum: Yup.string().required("Please Wait for Ipd file number"),
    }),
    onSubmit: async (values) => {
      try {
        setSubmitting(true);
        if (data) {
          await dispatch(editAdmission(values)).unwrap();
        } else {
          await dispatch(admitIpdPatient(values)).unwrap();
        }
        validation.resetForm();
        toggle();
      } catch {
        // Error alert already shown by the thunk — modal stays open
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    setStep(1);
    referralInitialized.current = false;
  }, [isOpen]);

  useEffect(() => {
    dispatch(fetchReferrals());
  }, [dispatch]);

  const referralInitialized = useRef(false);
  useEffect(() => {
    // Patient saved with a non-doctor referral source — pre-select it
    if (patient?.referredBy?.source) {
      setSelectedReferral(
        REFERRAL_SOURCE_OPTIONS.find(
          (o) => o.value === patient.referredBy.source,
        ) || null,
      );
      setIsOtherReferral(false);
      return;
    }

    // Only run once when patient and referrals are both available
    if (!patient?.referredBy || !referrals?.length) return;
    if (referralInitialized.current) return;
    referralInitialized.current = true;

    const doctorName =
      typeof patient.referredBy === "string"
        ? patient.referredBy
        : patient.referredBy?.doctorName || "";
    const speciality = patient.referredBy?.speciality || "";

    // Check if speciality matches a static option (priority check)
    const STATIC_OPTIONS = [
      { value: "psychiatrist", label: "Psychiatrist" },
      { value: "doctor", label: "Doctor" },
      { value: "online", label: "Online" },
      { value: "other", label: "Other" },
    ];
    const staticMatch = STATIC_OPTIONS.find((opt) => opt.value === speciality);

    const referralMatch = referrals.find(
      (ref) =>
        ref._id === patient.referredBy.id || ref.doctorName === doctorName,
    );

    if (referralMatch) {
      // Approved DB referral — just select it from the list
      setSelectedReferral({
        value: referralMatch._id,
        label: referralMatch.doctorName,
      });
      setIsOtherReferral(false);
      validation.setFieldValue("referredBy", referralMatch._id);
      validation.setFieldValue("referralType", "");
    } else if (staticMatch) {
      // Saved via a static option — pre-select it and show name + phone
      setSelectedReferral(staticMatch);
      setIsOtherReferral(true);
      validation.setFieldValue("referredBy", doctorName);
      validation.setFieldValue(
        "referralPhoneNumber",
        patient.referredBy?.mobileNumber || "",
      );
      validation.setFieldValue("referralType", staticMatch.value);
    } else {
      // Check if it matches an existing referral from the DB
      const referralMatch = referrals.find(
        (ref) =>
          ref._id === patient.referredBy.id || ref.doctorName === doctorName,
      );

      if (referralMatch) {
        setSelectedReferral({
          value: referralMatch._id,
          label: referralMatch.doctorName,
        });
        setIsOtherReferral(false);
        validation.setFieldValue("referredBy", referralMatch._id);
      } else if (doctorName) {
        // Legacy data without speciality — treat as "Other"
        setSelectedReferral({ value: "other", label: "Other" });
        setIsOtherReferral(true);
        validation.setFieldValue("referredBy", doctorName);
        validation.setFieldValue("referralType", "other");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient, referrals]);

  const handleChange = (e, fieldType) => {
    if (fieldType === "file") {
      const name = e.target.name;
      const file = e.target.files[0];
      const event = {
        target: { name, value: { file, path: e.target.value } },
      };
      validation.handleChange(event);
    } else {
      validation.handleChange(e);
    }
  };

  useEffect(() => {
    if (validation.values.center)
      dispatch(fetchDoctors({ center: validation.values.center }));
  }, [dispatch, validation.values.center]);

  // True when the currently-selected centre is the blocked one. Resolved from
  // the centres list rather than the stored id so it survives an id change.
  const isBlockedCenterSelected = (centers || []).some(
    (c) =>
      String(c?._id) === String(validation.values.center) &&
      isBlockedCenterTitle(c?.title),
  );

  const createIpdfile = async (id) => {
    try {
      const { data } = await axios.post(
        "/patient/ipdfilenum",
        { Patientid: id }, // body data
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      if (data?.Ipdnum) {
        validation.setFieldValue("Ipdnum", data.Ipdnum);
        // toast.success(`IPD file number: ${data.data.Ipdnum}`);
      } else {
        toast.error("Failed to receive IPD number");
      }
      // toast.success("IPD file number generated successfully");
    } catch (error) {
      toast.error("Failed to get IPD file number");
    }
  };

  useEffect(() => {
    if (step === 2 && patient?._id && !validation.values.Ipdnum) {
      createIpdfile(patient._id);
    }
    return;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient, step]);

  const patientFields = [
    {
      label: "Name",
      name: "name",
      type: "text",
    },
    {
      label: "Phone Number",
      name: "phoneNumber",
      type: "number",
    },
    {
      label: "Email",
      name: "email",
      type: "email",
      required: false,
    },
    {
      label: "Date of Birth",
      name: "dateOfBirth",
      type: "date",
      required: true
    },
    {
      label: "Gender",
      name: "gender",
      type: "radio",
      options: ["MALE", "FEMALE", "OTHERS"],
    },
    {
      label: "Address",
      name: "address",
      type: "text",
      required: true
    },
  ];

  const patientGuardianFields = [
    {
      label: "Guardian Name",
      name: "guardianName",
      type: "text",
      required: true,
    },
    {
      label: "Relation",
      name: "guardianRelation",
      type: "text",
      required: true,
    },
    {
      label: "Phone Number",
      name: "guardianPhoneNumber",
      type: "phoneNumber",
      required: true,
    },
    // {
    //   label: "IPD File Number",
    //   name: "ipdFileNumber",
    //   type: "text",
    //   required: false,
    // },
  ];

  const loadIcds = async () => {
    try {
      const response = await getICDCodes();

      const formatted = response.map((item) => ({
        value: item._id,
        label: `${item.code} - ${item.text}`,
      }));

      setIcdOptions(formatted);
    } catch (error) {
    }
  };
  useEffect(() => {
    loadIcds();
  }, []);

  const admissionFields = [
    {
      label: "Provisional Diagnosis",
      name: "provisional_diagnosis",
      type: "select",
      options: icdOptions,
      isMulti: true,
      required: true,
    },
    {
      label: "Doctor",
      name: "doctor",
      type: "select",
      options: doctors,
    },
    {
      label: "Psychologist",
      name: "psychologist",
      type: "select",
      options: counsellors,
    },
    // Optional: may be left as NA, so `optional` keeps them out of the
    // required-field checks on submit. NA is always the last option.
    {
      label: "MSW",
      name: "msw",
      type: "select",
      options: [...(msws || []), STAFF_NA_OPTION],
      optional: true,
    },
    {
      label: "RMO",
      name: "rmo",
      type: "select",
      options: [...(rmos || []), STAFF_NA_OPTION],
      optional: true,
    },
    {
      label: "Nurse",
      name: "nurse",
      type: "select",
      options: [...(nurses || []), STAFF_NA_OPTION],
      optional: true,
    },
    {
      label: "Visiting Consultant",
      name: "visitingConsultant",
      type: "select",
      options: [...(visitingConsultants || []), STAFF_NA_OPTION],
      optional: true,
    },
  ];

  const renderStep1 = () => (
    <>
      <Row>
        <FormField
          fields={patientFields}
          validation={validation}
          doctorLoading={doctorLoading}
          handleChange={handleChange}
        />
        {/* Nationality & Identity Section */}
        <Col xs={12} lg={4}>
          <div className="mb-3">
            <Label className="form-label">
              Nationality <span className="text-danger">*</span>
            </Label>
            <div className="d-flex gap-2">
              {["Indian", "Foreigner"].map((opt) => (
                <div
                  key={opt}
                  onClick={() => {
                    validation.setFieldValue("nationality", opt);
                    if (opt === "Indian") {
                      validation.setFieldValue("passportNumber", "");
                    } else {
                      validation.setFieldValue("aadhaarCardNumber", "");
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: "0.5rem 0.75rem",
                    borderRadius: "0.5rem",
                    border: `2px solid ${validation.values.nationality === opt ? "#405189" : "#d1d5db"}`,
                    backgroundColor: validation.values.nationality === opt ? "#f0f3ff" : "#fff",
                    color: validation.values.nationality === opt ? "#405189" : "#6b7280",
                    fontWeight: validation.values.nationality === opt ? "600" : "400",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    userSelect: "none",
                    fontSize: "0.875rem",
                  }}
                >
                  {opt === "Indian" ? "🇮🇳 Indian" : "🌐 Foreigner"}
                </div>
              ))}
            </div>
            {validation.touched.nationality && validation.errors.nationality && (
              <div style={{ color: "#dc3545", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                {validation.errors.nationality}
              </div>
            )}
          </div>
        </Col>
        <Col xs={12} lg={4}>
          {validation.values.nationality === "Indian" ? (
            <div className="mb-3">
              <Label htmlFor="aadhaarCardNumber" className="form-label">
                Aadhaar Card Number <span className="text-danger">*</span>
              </Label>
              <Input
                type="text"
                name="aadhaarCardNumber"
                id="aadhaarCardNumber"
                placeholder="Enter 12-digit Aadhaar number"
                maxLength={12}
                onFocus={() => {
                  // The server only ever sends a mask. Clearing it on focus
                  // means typing replaces the number instead of appending to
                  // "XXXXXXXX3001". A blank is read as "no change".
                  if (isMaskedIdentifier(validation.values.aadhaarCardNumber))
                    validation.setFieldValue("aadhaarCardNumber", "");
                }}
                onChange={validation.handleChange}
                onBlur={validation.handleBlur}
                value={validation.values.aadhaarCardNumber || ""}
                invalid={validation.touched.aadhaarCardNumber && validation.errors.aadhaarCardNumber ? true : false}
                className="form-control"
              />
              {validation.touched.aadhaarCardNumber && validation.errors.aadhaarCardNumber && (
                <FormFeedback type="invalid">
                  {validation.errors.aadhaarCardNumber}
                </FormFeedback>
              )}
              {isMaskedIdentifier(validation.values.aadhaarCardNumber) && (
                <small className="text-muted d-block mt-1">
                  Showing the last 4 digits only. Click the field and type a new
                  number to replace it, or leave it as-is to keep the saved one.
                </small>
              )}
            </div>
          ) : validation.values.nationality === "Foreigner" ? (
            <div className="mb-3">
              <Label htmlFor="passportNumber" className="form-label">
                International Passport Number <span className="text-danger">*</span>
              </Label>
              <Input
                type="text"
                name="passportNumber"
                id="passportNumber"
                placeholder="Enter passport number"
                onFocus={() => {
                  // The server only ever sends a mask. Clearing it on focus
                  // means typing replaces the number instead of appending to
                  // "XXXXXXXX3001". A blank is read as "no change".
                  if (isMaskedIdentifier(validation.values.passportNumber))
                    validation.setFieldValue("passportNumber", "");
                }}
                onChange={validation.handleChange}
                onBlur={validation.handleBlur}
                value={validation.values.passportNumber || ""}
                invalid={validation.touched.passportNumber && validation.errors.passportNumber ? true : false}
                className="form-control"
              />
              {validation.touched.passportNumber && validation.errors.passportNumber && (
                <FormFeedback type="invalid">
                  {validation.errors.passportNumber}
                </FormFeedback>
              )}
              {isMaskedIdentifier(validation.values.passportNumber) && (
                <small className="text-muted d-block mt-1">
                  Showing the last 4 digits only. Click the field and type a new
                  number to replace it, or leave it as-is to keep the saved one.
                </small>
              )}
              <div
                style={{
                  marginTop: "0.5rem",
                  padding: "0.5rem 0.75rem",
                  backgroundColor: "#fff3cd",
                  border: "1px solid #ffc107",
                  borderRadius: "0.375rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.8125rem",
                  color: "#856404",
                }}
              >
                <i className="ri-information-line" style={{ fontSize: "1rem", flexShrink: 0 }} />
                <span>Inform FRR office</span>
              </div>
            </div>
          ) : null}
        </Col>
        <Col xs={12}>
          <div className="d-flex gap-3 align-items-center">
            <h6 className="display-6 fs-4">Guardian</h6>
            <Divider />
          </div>
        </Col>
        {(patientGuardianFields || []).map((f, idx) => (
          <Col key={f.name + idx} xs={12} lg={4}>
            <div className="mb-3">
              <Label htmlFor={f.name} className="form-label">
                {f.label}
                {f.required && <span className="text-danger">*</span>}
              </Label>
              {f.type === "phoneNumber" ? (
                <PhoneInputWithCountrySelect
                  placeholder="Enter phone number"
                  name={f.name}
                  value={validation.values[f.name]}
                  onChange={(value) =>
                    validation.setFieldValue(f.name, value || "")
                  }
                  onBlur={() => validation.setFieldTouched(f.name, true)}
                  defaultCountry="IN"
                  limitMaxLength={true}
                  style={{
                    width: "100%",
                    height: "42px",
                    padding: "0.5rem 0.75rem",
                    border: `1px solid ${validation.touched[f.name] && validation.errors[f.name]
                      ? "#dc3545"
                      : "#ced4da"
                      }`,
                    borderRadius: "0.375rem",
                    fontSize: "1rem",
                  }}
                />
              ) : (
                <Input
                  type={f.type}
                  name={f.name}
                  onChange={validation.handleChange}
                  onBlur={validation.handleBlur}
                  value={validation.values[f.name] || ""}
                  invalid={
                    validation.touched[f.name] && validation.errors[f.name]
                      ? true
                      : false
                  }
                  className="form-control"
                  placeholder=""
                  id={f.name}
                />
              )}
              {validation.touched[f.name] && validation.errors[f.name] ? (
                <FormFeedback type="invalid" className="d-block">
                  <div>{validation.errors[f.name]}</div>
                </FormFeedback>
              ) : null}
            </div>
          </Col>
        ))}
        <Col xs={12} lg={4}>
          <div className="mb-3">
            <Label htmlFor="referredBy" className="form-label">
              Referred By <span className="text-danger">*</span>
            </Label>

            <Select
              value={selectedReferral}
              onChange={(option) => {
                setSelectedReferral(option);
                const staticValues = [
                  "other",
                  "doctor",
                  "psychiatrist",
                  "online",
                ];
                const isSource =
                  option && REFERRAL_SOURCE_KEYS.includes(option.value);
                // One setValues call: back-to-back setFieldValue calls each
                // validate against stale values, leaving old errors behind.
                const updates = {
                  referralSource: isSource ? option.value : "",
                  referralRefId: "",
                  referralName: "",
                  referredBy: "",
                  referralPhoneNumber: "",
                  referralType: "",
                };
                if (isSource) {
                  setIsOtherReferral(false);
                } else if (option && staticValues.includes(option.value)) {
                  setIsOtherReferral(true);
                  updates.referralType = option.value;
                } else {
                  setIsOtherReferral(false);
                  updates.referredBy = option?.value || "";
                }
                validation.setValues({ ...validation.values, ...updates });
              }}
              onBlur={() => validation.setFieldTouched("referredBy", true)}
              options={[
                ...(referrals || []).map((ref) => ({
                  value: ref._id,
                  label: ref.doctorName,
                })),
                { value: "psychiatrist", label: "Psychiatrist" },
                { value: "doctor", label: "Doctor" },
                { value: "online", label: "Online" },
                ...REFERRAL_SOURCE_OPTIONS,
                { value: "other", label: "Other" },
              ]}
              placeholder="Select or search for a referral doctor"
              menuPlacement="auto"
              maxMenuHeight={200}
              isClearable
              isLoading={referralsLoading}
              styles={{
                control: (provided, state) => ({
                  ...provided,
                  borderColor:
                    validation.touched.referredBy &&
                      validation.errors.referredBy
                      ? "#dc3545"
                      : "#ced4da",
                  boxShadow: state.isFocused
                    ? validation.touched.referredBy &&
                      validation.errors.referredBy
                      ? "0 0 0 0.2rem rgba(220, 53, 69, 0.25)"
                      : "0 0 0 0.2rem rgba(13, 110, 253, 0.25)"
                    : "none",
                  "&:hover": {
                    borderColor:
                      validation.touched.referredBy &&
                        validation.errors.referredBy
                        ? "#dc3545"
                        : "#86b7fe",
                  },
                }),
                menu: (provided) => ({
                  ...provided,
                  zIndex: 9999,
                }),
              }}
            />

            <ReferralSourceFields
              source={validation.values.referralSource}
              refId={validation.values.referralRefId}
              name={validation.values.referralName}
              onRefChange={(id, label) =>
                validation.setValues({
                  ...validation.values,
                  referralRefId: id,
                  referralName: label,
                })
              }
              onNameChange={(value) =>
                validation.setFieldValue("referralName", value)
              }
              error={
                validation.touched.referralRefId || validation.submitCount > 0
                  ? validation.errors.referralRefId
                  : undefined
              }
            />

            {isOtherReferral && (
              <>
                <Input
                  name="referredBy"
                  className="form-control mt-2"
                  placeholder="Enter doctor name"
                  type="text"
                  onChange={validation.handleChange}
                  onBlur={validation.handleBlur}
                  value={validation.values.referredBy || ""}
                  invalid={
                    validation.touched.referredBy &&
                    validation.errors.referredBy
                  }
                />
                <div className="mt-2">
                  <PhoneInputWithCountrySelect
                    placeholder="Referral phone number (optional)"
                    name="referralPhoneNumber"
                    value={validation.values.referralPhoneNumber}
                    onChange={(value) =>
                      validation.setFieldValue(
                        "referralPhoneNumber",
                        value || "",
                      )
                    }
                    onBlur={() =>
                      validation.setFieldTouched("referralPhoneNumber", true)
                    }
                    defaultCountry="IN"
                    limitMaxLength={true}
                    style={{
                      width: "100%",
                      height: "42px",
                      padding: "0.5rem 0.75rem",
                      border: `1px solid ${validation.touched.referralPhoneNumber &&
                        validation.errors.referralPhoneNumber
                        ? "#dc3545"
                        : "#ced4da"
                        }`,
                      borderRadius: "0.375rem",
                      fontSize: "1rem",
                    }}
                  />
                  {validation.touched.referralPhoneNumber &&
                    validation.errors.referralPhoneNumber && (
                      <div
                        style={{
                          color: "#dc3545",
                          fontSize: "0.875rem",
                          marginTop: "0.25rem",
                        }}
                      >
                        {validation.errors.referralPhoneNumber}
                      </div>
                    )}
                </div>
              </>
            )}

            {validation.touched.referredBy && validation.errors.referredBy && (
              <FormFeedback type="invalid" className="d-block">
                {validation.errors.referredBy}
              </FormFeedback>
            )}
          </div>
        </Col>
      </Row>
      <div className="d-flex justify-content-end mt-3">
        <Button
          onClick={() => {
            // Get all required fields from step 1 (excluding email)
            const step1Fields = [
              ...patientFields.filter((f) => f.name !== "email"),
              ...patientGuardianFields.filter(
                (f) => f.name !== "ipdFileNumber",
              ),
            ].map((f) => f.name);

            // Also touch nationality (custom Select field)
            validation.setFieldTouched("nationality", true);

            // Touch all fields to trigger validation
            step1Fields.forEach((field) => {
              validation.setFieldTouched(field, true);
            });

            // Check if there are any validation errors
            const step1Errors = step1Fields.filter(
              (field) => validation.errors[field],
            );

            // Check nationality error separately
            const nationalityMissing = !validation.values.nationality;

            // Check if any required fields are empty (excluding email)
            const emptyFields = step1Fields.filter(
              (field) =>
                !validation.values[field] ||
                validation.values[field].toString().trim() === "",
            );

            // Referred By (and its mandatory sub-dropdown) lives on step 1
            validation.setFieldTouched("referredBy", true);
            validation.setFieldTouched("referralRefId", true);
            const referralInvalid =
              !!validation.errors.referredBy ||
              !!validation.errors.referralRefId;

            if (
              step1Errors.length > 0 ||
              emptyFields.length > 0 ||
              nationalityMissing ||
              referralInvalid
            ) {
              return; // Don't proceed to next step
            }

            // If validation passes, proceed to step 2
            setStep(2);
          }}
          color="success"
          size="sm"
          type="button"
        >
          Next
        </Button>
      </div>
    </>
  );

  const renderStep2 = () => (
    <>
      <Row>
        <Col xs={12} md={6}>
          <div className="mb-3">
            <Label htmlFor="Ipdnum" className="form-label">
              IPD file num.
            </Label>
            <Input
              name="Ipdnum"
              value={validation.values.Ipdnum || ""}
              disabled
              onChange={(e) => {
                validation.handleChange(e);
              }}
              className="form-control shadow-none bg-light"
            />
            {validation.touched.Ipdnum && validation.errors.Ipdnum ? (
              <FormFeedback className="d-block" type="invalid">
                {validation.errors.Ipdnum}
              </FormFeedback>
            ) : null}
          </div>
        </Col>
        <Col xs={12} md={6}>
          <div className="mb-3">
            <Label className="form-label">
              Center <span className="text-danger">*</span>
            </Label>
            <Input
              type="select"
              name="center"
              onChange={validation.handleChange}
              onBlur={validation.handleBlur}
              value={validation.values.center || ""}
              disabled={data?.center}
              invalid={
                validation.touched.center && validation.errors.center
                  ? true
                  : false
              }
            >
              <option value="" disabled hidden>
                Choose here
              </option>
              {(centers || []).map((option, idx) => (
                <option key={idx} value={option._id}>
                  {option.title}
                </option>
              ))}
            </Input>
            {validation.touched.center && validation.errors.center ? (
              <FormFeedback>{validation.errors.center}</FormFeedback>
            ) : null}
            {/* Rendered outside FormFeedback because the select is not
                `invalid` here — Formik's own validation passes, this is a
                separate business rule. FormFeedback only shows when the
                sibling input carries .is-invalid. */}
            {isBlockedCenterSelected ? (
              <div className="text-danger small mt-1">
                {`Cannot admit to ${BLOCKED_CENTER_TITLE}. Please admit to ${BLOCKED_CENTER_ALTERNATIVE} instead.`}
              </div>
            ) : null}
          </div>
        </Col>
        <Col xs={12} md={6}>
          <div className="mb-3">
            <Label htmlFor="addmissionDate" className="form-label">
              Addmission Date
            </Label>
            <Flatpicker
              name="addmissionDate"
              value={validation.values.addmissionDate || ""}
              onChange={([e]) => {
                const now = new Date();
                e.setHours(
                  now.getHours(),
                  now.getMinutes(),
                  now.getSeconds(),
                  now.getMilliseconds(),
                );
                const event = { target: { name: "addmissionDate", value: e } };
                validation.handleChange(event);
              }}
              options={{
                dateFormat: "d M, Y h:i K",
                enableTime: true,
                time_24hr: false,
              }}
              className="form-control shadow-none bg-light"
            />
            {validation.touched.addmissionDate &&
              validation.errors.addmissionDate ? (
              <FormFeedback className="d-block" type="invalid">
                {validation.errors.addmissionDate}
              </FormFeedback>
            ) : null}
          </div>
        </Col>
        {data?.dischargeDate && (
          <Col xs={12} md={6}>
            <div className="mb-3">
              <Label htmlFor="dischargeDate" className="form-label">
                Discharge Date
              </Label>
              <Flatpicker
                name="dischargeDate"
                value={validation.values.dischargeDate || ""}
                onChange={([e]) => {
                  const now = new Date();
                  e.setHours(
                    now.getHours(),
                    now.getMinutes(),
                    now.getSeconds(),
                    now.getMilliseconds(),
                  );
                  const event = { target: { name: "dischargeDate", value: e } };
                  validation.handleChange(event);
                }}
                options={{
                  dateFormat: "d M, Y",
                }}
                className="form-control shadow-none bg-light"
              />
              {validation.touched.dischargeDate &&
                validation.errors.dischargeDate ? (
                <FormFeedback className="d-block" type="invalid">
                  {validation.errors.dischargeDate}
                </FormFeedback>
              ) : null}
            </div>
          </Col>
        )}

        <Col xs={12} md={6}>
          <div className="mb-3">
            <Label htmlFor="ward" className="form-label">
              Floor / Ward / Room
            </Label>
            <Input
              name="ward"
              id="ward"
              onChange={validation.handleChange}
              onBlur={validation.handleBlur}
              value={validation.values.ward || ""}
              className="form-control"
            />
          </div>
        </Col>
        <Col xs={12} md={6}>
          <div className="mb-3">
            <Label htmlFor="bed" className="form-label">
              Bed
            </Label>
            <Input
              name="bed"
              id="bed"
              onChange={validation.handleChange}
              onBlur={validation.handleBlur}
              value={validation.values.bed || ""}
              className="form-control"
            />
          </div>
        </Col>

        <FormField
          fields={admissionFields}
          validation={validation}
          doctorLoading={doctorLoading}
          handleChange={handleChange}
        />
      </Row>
      <div className="d-flex justify-content-between mt-3">
        <Button
          size="sm"
          color="secondary"
          disabled={submitting}
          onClick={() => setStep(1)}
        >
          Back
        </Button>
        <Button
          size="sm"
          type="submit"
          disabled={submitting || isBlockedCenterSelected}
          onClick={(e) => {
            e.preventDefault();

            // First validate step 1 fields
            const step1Fields = [
              ...patientFields.filter((f) => f.name !== "email"),
              ...patientGuardianFields.filter(
                (f) => f.name !== "ipdFileNumber",
              ),
            ].map((f) => f.name);

            // Touch nationality (custom Select, tracked separately)
            validation.setFieldTouched("nationality", true);

            // Touch all step 1 fields
            step1Fields.forEach((field) => {
              validation.setFieldTouched(field, true);
            });

            // Check step 1 validation
            const step1Errors = step1Fields.filter(
              (field) => validation.errors[field],
            );
            const step1EmptyFields = step1Fields.filter(
              (field) =>
                !validation.values[field] ||
                validation.values[field].toString().trim() === "",
            );
            const nationalityMissing = !validation.values.nationality;

            // Then validate step 2 fields
            const step2Fields = [
              "center",
              "addmissionDate",
              ...admissionFields.filter((f) => !f.optional).map((f) => f.name),
            ];

            // Touch all step 2 fields
            step2Fields.forEach((field) => {
              validation.setFieldTouched(field, true);
            });

            // Check step 2 validation
            const step2Errors = step2Fields.filter(
              (field) => validation.errors[field],
            );
            const step2EmptyFields = step2Fields.filter(
              (field) =>
                !validation.values[field] ||
                validation.values[field].toString().trim() === "",
            );

            // Referred By lives on step 1 — send the user back to it
            validation.setFieldTouched("referredBy", true);
            validation.setFieldTouched("referralRefId", true);
            if (
              validation.errors.referredBy ||
              validation.errors.referralRefId
            ) {
              setStep(1);
              return;
            }

            // If there are any errors or empty fields, don't submit
            if (
              step1Errors.length > 0 ||
              step1EmptyFields.length > 0 ||
              nationalityMissing ||
              step2Errors.length > 0 ||
              step2EmptyFields.length > 0
            ) {
              return;
            }

            // If all validation passes, submit the form
            validation.handleSubmit();
          }}
        >
          {submitting ? <Spinner size="sm" /> : "Save"}
        </Button>
      </div>
    </>
  );

  return (
    <CustomModal
      isOpen={isOpen === ADMIT_PATIENT || isOpen === EDIT_ADMISSION}
      title="Admit Patient"
      toggle={toggle}
      size="lg"
    >
      {/* Step Navigation Buttons */}
      <div className="d-flex justify-content-center gap-3 mb-4">
        <Button
          className={step === 1 ? "text-white" : ""}
          color={step === 1 ? "primary" : "light"}
          onClick={() => setStep(1)}
          active={step === 1}
        >
          Patient Info
        </Button>
        <Button
          className={step === 2 ? "text-white" : ""}
          color={step === 2 ? "primary" : "light"}
          onClick={() => {
            if (step === 1) {
              // Get all required fields from step 1
              const step1Fields = [
                ...patientFields.filter((f) => f.name !== "email"),
                ...patientGuardianFields.filter(
                  (f) => f.name !== "ipdFileNumber",
                ),
              ].map((f) => f.name);

              // Touch nationality (custom Select, tracked separately)
              validation.setFieldTouched("nationality", true);

              // Touch all fields to trigger validation
              step1Fields.forEach((field) => {
                validation.setFieldTouched(field, true);
              });

              // Check if there are any validation errors
              const step1Errors = step1Fields.filter(
                (field) => validation.errors[field],
              );

              const nationalityMissing = !validation.values.nationality;

              // Check if any required fields are empty
              const emptyFields = step1Fields.filter(
                (field) =>
                  !validation.values[field] ||
                  validation.values[field].toString().trim() === "",
              );

              if (
                step1Errors.length > 0 ||
                emptyFields.length > 0 ||
                nationalityMissing
              ) {
                return; // Don't proceed to step 2
              }
            }
            setStep(2);
          }}
          active={step === 2}
          disabled={
            step === 1 &&
            (() => {
              // Check if step 1 is incomplete (excluding email)
              const step1Fields = [
                ...patientFields.filter((f) => f.name !== "email"),
                ...patientGuardianFields.filter(
                  (f) => f.name !== "ipdFileNumber",
                ),
              ].map((f) => f.name);

              const hasErrors = step1Fields.some(
                (field) => validation.errors[field],
              );
              const hasEmptyFields = step1Fields.some(
                (field) =>
                  !validation.values[field] ||
                  validation.values[field].toString().trim() === "",
              );
              const nationalityMissing = !validation.values.nationality;

              return hasErrors || hasEmptyFields || nationalityMissing;
            })()
          }
        >
          Admission Info
        </Button>
      </div>

      <Form
        onSubmit={(e) => {
          e.preventDefault();
          // Also guarded here, not just on the button: pressing Enter in any
          // field submits the form directly and would otherwise bypass the
          // disabled submit button.
          if (isBlockedCenterSelected) return;
          validation.handleSubmit();
        }}
        className="needs-validation"
        action="#"
      >
        {step === 1 ? renderStep1() : renderStep2()}
      </Form>
    </CustomModal>
  );
};

AdmitPatient.propTypes = {
  isOpen: PropTypes.string,
  patient: PropTypes.object,
};

const mapStateToProps = (state) => ({
  isOpen: state.Patient.admitDischargePatient?.isOpen,
  data: state.Patient.admitDischargePatient?.data,
  patient: state.Patient.patient,
  centers: state.Center.data,
  doctorLoading: state.User.doctorLoading,
  doctors: state.User.doctor,
  counsellors: state.User.counsellors,
  nurses: state.User.nurses,
  rmos: state.User.rmos,
  msws: state.User.msws,
  visitingConsultants: state.User.visitingConsultants,
  chartAdmissions: state.Chart.data,
  referrals: state.Referral.data,
  referralsLoading: state.Referral.loading,
});

export default connect(mapStateToProps)(AdmitPatient);
