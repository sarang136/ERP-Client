// Staff Professional Registry (compliance T32), phase 1.
//
// A job role (Setting → User Roles) says whether its users record a
// professional registration and for which profession; the user form then shows
// the Professional Registration section. The same vocabulary is repeated in
// ERP-Server (roles) and the Login Service (saving) — keep the three in step.

export const REGISTRATION_REQUIREMENT = Object.freeze({
  NOT_NEEDED: "NOT_NEEDED",
  OPTIONAL: "OPTIONAL",
  REQUIRED: "REQUIRED",
});

export const REGISTRATION_REQUIREMENT_OPTIONS = [
  { value: REGISTRATION_REQUIREMENT.NOT_NEEDED, label: "Not needed" },
  { value: REGISTRATION_REQUIREMENT.OPTIONAL, label: "Optional" },
  { value: REGISTRATION_REQUIREMENT.REQUIRED, label: "Required" },
];

export const PROFESSION_LABELS = {
  DOCTOR: "Doctor",
  NURSE: "Nurse",
  CLINICAL_PSYCHOLOGIST: "Clinical Psychologist",
  SOCIAL_WORKER: "Social Worker",
  COUNSELLOR: "Counsellor",
  PHYSIOTHERAPIST: "Physiotherapist",
  PHARMACIST: "Pharmacist",
};

export const PROFESSION_OPTIONS = Object.entries(PROFESSION_LABELS).map(
  ([value, label]) => ({ value, label }),
);

// `state: true` → a state council, so the registration must name the state.
export const COUNCILS = {
  STATE_MEDICAL_COUNCIL: { label: "State Medical Council", state: true },
  NMC: { label: "National Medical Commission", state: false },
  STATE_NURSING_COUNCIL: { label: "State Nursing Council", state: true },
  NNMC: { label: "National Nursing and Midwifery Commission", state: false },
  RCI: { label: "Rehabilitation Council of India", state: false },
  STATE_ALLIED_HEALTH_COUNCIL: {
    label: "State Allied and Healthcare Council",
    state: true,
  },
  NCAHP: {
    label: "National Commission for Allied and Healthcare Professions",
    state: false,
  },
  STATE_PHYSIOTHERAPY_COUNCIL: {
    label: "State Physiotherapy Council",
    state: true,
  },
  STATE_PHARMACY_COUNCIL: { label: "State Pharmacy Council", state: true },
};

export const COUNCILS_BY_PROFESSION = {
  DOCTOR: ["STATE_MEDICAL_COUNCIL", "NMC"],
  NURSE: ["STATE_NURSING_COUNCIL", "NNMC"],
  CLINICAL_PSYCHOLOGIST: ["RCI"],
  SOCIAL_WORKER: ["STATE_ALLIED_HEALTH_COUNCIL", "NCAHP"],
  COUNSELLOR: ["RCI", "STATE_ALLIED_HEALTH_COUNCIL", "NCAHP"],
  PHYSIOTHERAPIST: [
    "STATE_PHYSIOTHERAPY_COUNCIL",
    "STATE_ALLIED_HEALTH_COUNCIL",
    "NCAHP",
  ],
  PHARMACIST: ["STATE_PHARMACY_COUNCIL"],
};

export const REGISTRATION_TYPE_OPTIONS = [
  { value: "PERMANENT", label: "Permanent" },
  { value: "PROVISIONAL", label: "Provisional" },
  { value: "TEMPORARY", label: "Temporary" },
];

export const INDIAN_STATES = [
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

export const MAX_REGISTRATIONS = 10;
export const CERTIFICATE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];
export const CERTIFICATE_MAX_BYTES = 10 * 1024 * 1024;
