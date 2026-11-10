/**
 * Professional Registration section of the user form (compliance T32, phase 1).
 *
 * Shown when the selected job role's setting (Setting → User Roles) is
 * Optional or Required, or when the user already has registrations. A person
 * can hold several registrations, e.g. a doctor registered in two states.
 *
 * The values live in the parent form's Formik state under
 * `professionalRegistrations`; the whole list is sent on save and the Login
 * Service replaces the stored list with it.
 */

import React from "react";
import PropTypes from "prop-types";
import * as Yup from "yup";
import { getIn } from "formik";
import { format } from "date-fns";
import { useMediaQuery } from "../../Components/Hooks/useMediaQuery";
import {
  CERTIFICATE_MAX_BYTES,
  CERTIFICATE_TYPES,
  COUNCILS,
  COUNCILS_BY_PROFESSION,
  INDIAN_STATES,
  MAX_REGISTRATIONS,
  PROFESSION_LABELS,
  PROFESSION_OPTIONS,
  REGISTRATION_REQUIREMENT,
  REGISTRATION_TYPE_OPTIONS,
} from "../../Components/constants/professionalRegistration";

const isStateCouncil = (council) => Boolean(COUNCILS[council]?.state);
const dateOnly = (value) => (value ? String(value).slice(0, 10) : "");

// A council is only preselected when the profession has just one.
const councilFor = (profession) => {
  const councils = COUNCILS_BY_PROFESSION[profession] || [];
  return councils.length === 1 ? councils[0] : "";
};

let nextClientKey = 0;

export const emptyRegistration = (profession = "") => ({
  clientKey: `new-${(nextClientKey += 1)}`, // React key until it has an _id
  profession,
  council: councilFor(profession),
  state: "",
  registrationNumber: "",
  registrationType: "",
  qualification: "",
  issueDate: "",
  validUntil: "",
  noExpiry: false,
  hprId: "",
  certificate: null, // the stored file
  certificateFile: null, // a newly chosen File
});

/** A stored registration (from the Login Service) as form values. */
export const toRegistrationFormValue = (reg) => ({
  _id: reg._id,
  profession: reg.profession || "",
  council: reg.council || "",
  state: reg.state || "",
  registrationNumber: reg.registrationNumber || "",
  registrationType: reg.registrationType || "",
  qualification: reg.qualification || "",
  issueDate: dateOnly(reg.issueDate),
  validUntil: dateOnly(reg.validUntil),
  noExpiry: Boolean(reg.noExpiry),
  hprId: reg.hprId || "",
  certificate: reg.certificate || null,
  certificateFile: null,
});

/**
 * The JSON to send, and the files to append as `registrationCertificates`.
 * A registration with a new file points at it by index.
 */
export const registrationsPayload = (list = []) => {
  const files = [];
  const registrations = list.map(
    // eslint-disable-next-line no-unused-vars
    ({ clientKey, certificate, certificateFile, ...registration }) => {
      if (!certificateFile) return registration;
      files.push(certificateFile);
      return { ...registration, certificateUpload: files.length - 1 };
    },
  );
  return { registrations, files };
};

export const registrationSchema = Yup.object({
  profession: Yup.string().required("Select the profession"),
  council: Yup.string()
    .required("Select the council")
    .test("council-fits", "Select the council", function (council) {
      return (COUNCILS_BY_PROFESSION[this.parent.profession] || []).includes(
        council,
      );
    }),
  state: Yup.string()
    .nullable()
    .test("state", "Select the state", function (state) {
      return !isStateCouncil(this.parent.council) || INDIAN_STATES.includes(state);
    }),
  registrationNumber: Yup.string()
    .trim()
    .required("Enter the registration number")
    .max(50, "Too long"),
  registrationType: Yup.string().required("Select the registration type"),
  qualification: Yup.string()
    .trim()
    .required("Enter the qualification")
    .max(200, "Too long"),
  issueDate: Yup.string()
    .required("Enter the issue date")
    .test(
      "not-future",
      "Can't be in the future",
      (date) => !date || date <= format(new Date(), "yyyy-MM-dd"),
    ),
  noExpiry: Yup.boolean(),
  validUntil: Yup.string()
    .nullable()
    .test("valid-until", function (date) {
      const { noExpiry, issueDate } = this.parent;
      if (noExpiry) return true;
      if (!date) {
        return this.createError({
          message: 'Enter the date, or tick "No expiry"',
        });
      }
      if (issueDate && date <= issueDate) {
        return this.createError({ message: "Must be after the issue date" });
      }
      return true;
    }),
  hprId: Yup.string().nullable().max(50, "Too long"),
  certificateFile: Yup.mixed()
    .nullable()
    .test("certificate", function (file) {
      if (!file) {
        return this.parent.certificate?.url
          ? true
          : this.createError({ message: "Attach the registration certificate" });
      }
      if (!CERTIFICATE_TYPES.includes(file.type)) {
        return this.createError({ message: "PDF or image (JPG, PNG, WEBP) only" });
      }
      if (file.size > CERTIFICATE_MAX_BYTES) {
        return this.createError({ message: "Must be 10 MB or smaller" });
      }
      return true;
    }),
});

/** Why the list doesn't satisfy the role, or null. */
export const missingRequiredRegistration = (jobRole, list = []) => {
  if (jobRole?.registration !== REGISTRATION_REQUIREMENT.REQUIRED) return null;
  if (list.some((r) => r.profession === jobRole.profession)) return null;
  return `The ${jobRole.name} role needs a ${
    PROFESSION_LABELS[jobRole.profession] || "professional"
  } registration`;
};

const labelStyle = { fontSize: "15px", fontWeight: "500", color: "#374151" };
const errorStyle = { color: "#ef4444", fontSize: "13px", margin: 0 };
const fieldStyle = (invalid) => ({
  padding: "10px",
  border: `1px solid ${invalid ? "#ef4444" : "#d1d5db"}`,
  borderRadius: "6px",
  fontSize: "15px",
  outline: "none",
  width: "100%",
  backgroundColor: "#ffffff",
});
const buttonStyle = (color) => ({
  padding: "8px 16px",
  backgroundColor: color,
  color: "#ffffff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
});

const Field = ({ label, optional, error, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
    <label style={labelStyle}>
      {label}
      {optional && <span style={{ color: "#6b7280" }}> (optional)</span>}
    </label>
    {children}
    {error && <p style={errorStyle}>{error}</p>}
  </div>
);

Field.propTypes = {
  label: PropTypes.string.isRequired,
  optional: PropTypes.bool,
  error: PropTypes.string,
  children: PropTypes.node,
};

const ProfessionalRegistrations = ({ validation, jobRole }) => {
  const isMobile = useMediaQuery("(max-width: 640px)");
  const list = validation.values.professionalRegistrations || [];
  const requirement =
    jobRole?.registration || REGISTRATION_REQUIREMENT.NOT_NEEDED;
  // A string here is the role-level error; per-registration errors are an array.
  const listError =
    typeof validation.errors.professionalRegistrations === "string"
      ? validation.errors.professionalRegistrations
      : null;

  const path = (i, field) => `professionalRegistrations[${i}].${field}`;
  const errorOf = (i, field) =>
    (getIn(validation.touched, path(i, field)) &&
      getIn(validation.errors, path(i, field))) ||
    undefined;

  const setList = (next) =>
    validation.setFieldValue("professionalRegistrations", next);
  const update = (i, patch) =>
    setList(list.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const textInput = (i, field, placeholder) => (
    <input
      type="text"
      name={path(i, field)}
      placeholder={placeholder}
      style={fieldStyle(errorOf(i, field))}
      value={list[i][field] || ""}
      onChange={validation.handleChange}
      onBlur={validation.handleBlur}
    />
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <h5 style={{ margin: 0, fontSize: "17px", color: "#111827" }}>
          Professional Registration
        </h5>
        <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#6b7280" }}>
          {requirement === REGISTRATION_REQUIREMENT.REQUIRED
            ? `Required for the ${jobRole.name} role: add at least one ${
                PROFESSION_LABELS[jobRole.profession] || ""
              } registration.`
            : requirement === REGISTRATION_REQUIREMENT.OPTIONAL
              ? `Optional for the ${jobRole.name} role.`
              : "This role doesn't need a registration. Remove these if they no longer apply."}
        </p>
      </div>

      {list.map((reg, i) => {
        const councils = COUNCILS_BY_PROFESSION[reg.profession] || [];
        return (
          <div
            key={reg._id || reg.clientKey}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "16px",
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: "16px",
            }}
          >
            <div
              style={{
                gridColumn: "1 / -1",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <strong style={{ color: "#374151" }}>Registration {i + 1}</strong>
              <button
                type="button"
                style={buttonStyle("#ef4444")}
                onClick={() => setList(list.filter((_, idx) => idx !== i))}
              >
                Remove
              </button>
            </div>

            <Field label="Profession" error={errorOf(i, "profession")}>
              <select
                name={path(i, "profession")}
                style={fieldStyle(errorOf(i, "profession"))}
                value={reg.profession}
                onBlur={validation.handleBlur}
                onChange={(e) =>
                  update(i, {
                    profession: e.target.value,
                    council: councilFor(e.target.value),
                    state: "",
                  })
                }
              >
                <option value="">Select profession</option>
                {PROFESSION_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Council" error={errorOf(i, "council")}>
              <select
                name={path(i, "council")}
                style={fieldStyle(errorOf(i, "council"))}
                value={reg.council}
                disabled={!reg.profession}
                onBlur={validation.handleBlur}
                onChange={(e) =>
                  update(i, {
                    council: e.target.value,
                    state: isStateCouncil(e.target.value) ? reg.state : "",
                  })
                }
              >
                <option value="">Select council</option>
                {councils.map((code) => (
                  <option key={code} value={code}>
                    {COUNCILS[code].label}
                  </option>
                ))}
              </select>
            </Field>

            {isStateCouncil(reg.council) && (
              <Field label="State" error={errorOf(i, "state")}>
                <select
                  name={path(i, "state")}
                  style={fieldStyle(errorOf(i, "state"))}
                  value={reg.state}
                  onChange={validation.handleChange}
                  onBlur={validation.handleBlur}
                >
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <Field
              label="Registration number"
              error={errorOf(i, "registrationNumber")}
            >
              {textInput(i, "registrationNumber", "e.g. MMC/2015/12345")}
            </Field>

            <Field
              label="Registration type"
              error={errorOf(i, "registrationType")}
            >
              <select
                name={path(i, "registrationType")}
                style={fieldStyle(errorOf(i, "registrationType"))}
                value={reg.registrationType}
                onChange={validation.handleChange}
                onBlur={validation.handleBlur}
              >
                <option value="">Select type</option>
                {REGISTRATION_TYPE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Qualification" error={errorOf(i, "qualification")}>
              {textInput(i, "qualification", "e.g. MBBS, MD Psychiatry")}
            </Field>

            <Field label="Issue date" error={errorOf(i, "issueDate")}>
              <input
                type="date"
                name={path(i, "issueDate")}
                style={fieldStyle(errorOf(i, "issueDate"))}
                value={reg.issueDate}
                max={format(new Date(), "yyyy-MM-dd")}
                onChange={validation.handleChange}
                onBlur={validation.handleBlur}
              />
            </Field>

            <Field label="Valid until" error={errorOf(i, "validUntil")}>
              <input
                type="date"
                name={path(i, "validUntil")}
                style={fieldStyle(errorOf(i, "validUntil"))}
                value={reg.validUntil}
                disabled={reg.noExpiry}
                min={reg.issueDate || undefined}
                onChange={validation.handleChange}
                onBlur={validation.handleBlur}
              />
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "14px",
                  color: "#374151",
                }}
              >
                <input
                  type="checkbox"
                  checked={reg.noExpiry}
                  onChange={(e) =>
                    update(i, {
                      noExpiry: e.target.checked,
                      validUntil: e.target.checked ? "" : reg.validUntil,
                    })
                  }
                />
                No expiry
              </label>
            </Field>

            <Field label="Certificate" error={errorOf(i, "certificateFile")}>
              <input
                type="file"
                accept={CERTIFICATE_TYPES.join(",")}
                style={fieldStyle(errorOf(i, "certificateFile"))}
                onChange={(e) => {
                  validation.setFieldTouched(
                    path(i, "certificateFile"),
                    true,
                    false,
                  );
                  update(i, { certificateFile: e.target.files?.[0] || null });
                }}
              />
              <small style={{ color: "#6b7280" }}>
                {reg.certificate?.url && !reg.certificateFile ? (
                  <>
                    <a
                      href={reg.certificate.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View current certificate
                    </a>{" "}
                    — choose a file only to replace it.
                  </>
                ) : (
                  "PDF or image, up to 10 MB."
                )}
              </small>
            </Field>

            <Field label="HPR ID (ABDM)" optional error={errorOf(i, "hprId")}>
              {textInput(i, "hprId", "Healthcare Professionals Registry ID")}
            </Field>
          </div>
        );
      })}

      {listError && <p style={errorStyle}>{listError}</p>}

      {list.length < MAX_REGISTRATIONS && (
        <button
          type="button"
          style={{ ...buttonStyle("#3b82f6"), alignSelf: "flex-start" }}
          onClick={() =>
            setList([...list, emptyRegistration(jobRole?.profession || "")])
          }
        >
          Add registration
        </button>
      )}
    </div>
  );
};

ProfessionalRegistrations.propTypes = {
  validation: PropTypes.object.isRequired,
  jobRole: PropTypes.shape({
    name: PropTypes.string,
    registration: PropTypes.string,
    profession: PropTypes.string,
  }),
};

export default ProfessionalRegistrations;
