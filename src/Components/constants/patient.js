const FORMS_VIEW = "FORMS";
const CHARTING_VIEW = "CHARTING";
const BILLING_VIEW = "BILLING";
const TIMELINE_VIEW = "TIMELINE";
const BELONGINGS_VIEW = "BELONGINGS";
const OPD_VIEW = "OPD";
export const ADMISSION_SUMMARY = "ADMISSION_SUMMARY";
export const BIO_DATA = "BIO_DATA";
//Charts
const PRESCRIPTION = "PRESCRIPTION";
const VITAL_SIGN = "VITAL_SIGN";
const CLINICAL_NOTE = "CLINICAL_NOTE";
const COUNSELLING_NOTE = "COUNSELLING_NOTE";
const LAB_REPORT = "LAB_REPORT";
export const PSYCHO_DIAGNOSTIC_FORM = "PSYCHO_DIAGNOSTIC_FORM";
const PROCEDURE = "PROCEDURE";
const RELATIVE_VISIT = "RELATIVE_VISIT";
const OUTPASS = "OUTPASS";
const DISCHARGE_SUMMARY = "DISCHARGE_SUMMARY";
const EXPIRY_SUMMARY = "EXPIRY_SUMMARY";
const DETAIL_ADMISSION = "DETAIL_ADMISSION";
const MENTAL_EXAMINATION = "MENTAL_EXAMINATION";
const MENTAL_EXAMINATION_V2 = "MENTAL_EXAMINATION_V2";
const ROUND_NOTE = "ROUND_NOTE";
const INPUT_OUTPUT = "INPUT_OUTPUT";
const NURSE_SOS_PROCEDURE = "NURSE_SOS_PROCEDURE";
const INJURY_MARKS = "INJURY_MARKS";
const ECT_SESSION = "ECT_SESSION";
const ADMISSION_TYPE = "ADMISSION_TYPE";
const MEDICINE_GIVEN = "MEDICINE_GIVEN";
export const ELDERLY_FUNCTIONAL_CHECKLIST = "ELDERLY_FUNCTIONAL_CHECKLIST";
//Chart Bill Types
const OPD = "OPD";
const IPD = "IPD";
const CLINIC_TEST = "CLINICTEST";
const CURRENT_MEDICINES = "CURRENT_MEDICINES";
export const GENERAL = "GENERAL";
export const NOTES = "NOTES";
//Admit Discharge
const ADMIT_PATIENT = "ADMIT_PATIENT";
const DISCHARGE_PATIENT = "DISCHARGE_PATIENT";
const EDIT_ADMISSION = "EDIT_ADMISSION";

//Bills
const ADVANCE_PAYMENT = "ADVANCE_PAYMENT";
const INVOICE = "INVOICE";
const DEPOSIT = "DEPOSIT";
export const DRAFT_INVOICE = "DRAFT_INVOICE";
const REFUND = "REFUND";
export const WRITE_OFF = "WRITE_OFF";
//Advance payment
const CASH = "CASH";
const CARD = "CARD";
const CHEQUE = "CHEQUE";
const BANK = "BANK";
//OPD Receipt
const UPI = "UPI";
//Genders
// const MALE = "MALE";
// const FEMALE = "FEMALE";
// const OTHERS = "OTHERS";

//Intern

const INTERN = "INTERN";

const records = [
  {
    name: "Doctors Prescription",
    category: PRESCRIPTION,
  },
  {
    name: "Vital Signs",
    category: VITAL_SIGN,
  },
  {
    name: "Input - Output",
    category: INPUT_OUTPUT,
  },
  {
    name: "Nurse Procedure",
    category: NURSE_SOS_PROCEDURE,
  },
  {
    name: "Patient Injury Marks",
    category: INJURY_MARKS,
  },
  // {
  //   name: "Clinical Notes v2",
  //   category: CLINICAL_NOTE,
  // },
  {
    name: "Clinical Notes",
    category: MENTAL_EXAMINATION,
  },
  {
    name: "Counselling Notes",
    category: COUNSELLING_NOTE,
  },
  {
    name: "Lab Reports",
    category: LAB_REPORT,
  },
  {
    name: "Pyscho Diagnostic Report",
    category: PSYCHO_DIAGNOSTIC_FORM,
  },
  {
    name: "Relative Visit",
    category: RELATIVE_VISIT,
  },
  {
    name: "Outpass",
    category: OUTPASS,
  },
  {
    name: "Discharge Summary",
    category: DISCHARGE_SUMMARY,
  },
  {
    name: "Expiry Summary",
    category: EXPIRY_SUMMARY,
  },
  {
    name: "Detail History",
    category: DETAIL_ADMISSION,
  },
  {
    name: "Round Notes",
    category: ROUND_NOTE,
  },
  {
    name: "ECT Session",
    category: ECT_SESSION,
  },
  // {
  //   name: "Admission Type",
  //   category: ADMISSION_TYPE,
  // },
  {
    name: "Medicine Given",
    category: MEDICINE_GIVEN,
  },
  {
    name: "Elderly Functional and Daily Living Checklist",
    category: ELDERLY_FUNCTIONAL_CHECKLIST,
  },
];

// ── Admission Type chart ───────────────────────────────────────────────────
// Option values match the ones the Admission Form flow already persists onto
// addmission.addmissionfromRaw, so the two records stay comparable. They were
// hardcoded in Admissionform.modal.js before this; these are now the source.
const INDEPENDENT_ADMISSION = "INDEPENDENT_ADMISSION";
const SUPPORTIVE_ADMISSION = "SUPPORTIVE_ADMISSION";
const EMERGENCY_ADMISSION = "EMERGENCY_ADMISSION";

// Field descriptor for the Admission Type chart, shared by the form
// (ChartForm/AdmissionType) and the read-only display (Charts/AdmissionType).
// `showIf` is honoured by Components/Common/RenderFields — it hides a field when
// the referenced value doesn't match, which is what drives the cascade.
const admissionTypeFields = [
  {
    name: "admissionType",
    label: "Admission Type",
    type: "select",
    required: true,
    options: [
      { label: "Independent Admission", value: INDEPENDENT_ADMISSION },
      { label: "Supportive Admission", value: SUPPORTIVE_ADMISSION },
      { label: "Emergency Admission", value: EMERGENCY_ADMISSION },
    ],
  },
  {
    name: "adultationType",
    label: "Adultation Type",
    type: "select",
    required: true,
    showIf: { field: "admissionType", value: INDEPENDENT_ADMISSION },
    options: [
      { label: "Adult (18+)", value: "ADULT" },
      { label: "Minor (below 18)", value: "MINOR" },
    ],
  },
  {
    name: "supportType",
    label: "Support Type",
    type: "select",
    required: true,
    showIf: { field: "admissionType", value: SUPPORTIVE_ADMISSION },
    options: [
      { label: "Upto 30 days", value: "UPTO30DAYS" },
      { label: "Beyond 30 days Upto 90 days", value: "BEYOND30DAYS" },
    ],
  },
  {
    name: "emergencyType",
    label: "Emergency Type",
    type: "select",
    required: true,
    showIf: { field: "admissionType", value: EMERGENCY_ADMISSION },
    // Value === label here, matching what the admission form already stores.
    options: [
      "Risk to self",
      "Risk to others",
      "Agitation",
      "Psychosis",
      "Substance",
      "Inability to care",
    ].map((v) => ({ label: v, value: v })),
  },
  {
    name: "emergencyRestraint",
    label: "Restraint Used",
    type: "select",
    required: true,
    showIf: { field: "admissionType", value: EMERGENCY_ADMISSION },
    options: [
      { label: "Yes", value: "Yes" },
      { label: "No", value: "No" },
    ],
  },
];

// Which fields belong to which branch — used by the form to clear the fields
// that no longer apply when the admission type changes, and by the display to
// show only the relevant ones.
const admissionTypeBranchFields = {
  [INDEPENDENT_ADMISSION]: ["adultationType"],
  [SUPPORTIVE_ADMISSION]: ["supportType"],
  [EMERGENCY_ADMISSION]: ["emergencyType", "emergencyRestraint"],
};

// Section/field descriptors for the ECT Session chart. Single source of truth
// shared by the form (ChartForm/EctSession) and the read-only display
// (Charts/EctSession). Field types: text | date | time | select | radio |
// textarea | checkbox (multi-select array).
const ectSessionSections = [
  {
    key: "sessionDetails",
    title: "Patient Identification & Session Details",
    fields: [
      { name: "date", label: "Date", type: "date" },
      { name: "timeOfProcedure", label: "Time of Procedure", type: "time" },
      { name: "uhid", label: "UHID / IPD No.", type: "text" },
      { name: "ward", label: "Ward / Unit", type: "text" },
      { name: "patientName", label: "Patient Name", type: "text" },
      { name: "age", label: "Age", type: "text", unit: "yrs" },
      {
        name: "sex",
        label: "Gender",
        type: "select",
        options: ["Male", "Female", "Other"],
      },
      { name: "diagnosis", label: "Diagnosis (ICD-10)", type: "text" },
      {
        name: "consultantPsychiatrist",
        label: "Consultant Psychiatrist",
        type: "text",
      },
      { name: "anaesthetist", label: "Anaesthetist", type: "text" },
      { name: "sessionNo", label: "ECT Session No.", type: "text" },
      {
        name: "totalSessions",
        label: "Total Sessions in Course",
        type: "text",
      },
      { name: "courseStartedOn", label: "Course Started On", type: "date" },
      { name: "indication", label: "Indication for ECT", type: "text" },
    ],
  },
  {
    key: "preProcedureChecklist",
    title: "Pre-Procedure Checklist",
    fields: [
      {
        name: "consentVerified",
        label: "Informed Consent Verified",
        type: "radio",
        options: ["Yes", "No"],
      },
      {
        name: "consentType",
        label: "Consent Type",
        type: "radio",
        options: ["Self", "Nominated Representative", "Legal Guardian"],
      },
      {
        name: "npoStatus",
        label: "NPO Status Confirmed",
        type: "radio",
        options: ["Yes", "No"],
      },
      {
        name: "npoDuration",
        label: "NPO Duration",
        type: "text",
        unit: "hours",
      },
      {
        name: "checklistCompleted",
        label: "Pre-ECT Checklist Completed",
        type: "radio",
        options: ["Yes", "No"],
      },
      {
        name: "ivAccess",
        label: "IV Access Secured",
        type: "radio",
        options: ["Yes", "No"],
      },
    ],
  },
  {
    key: "preEctVitals",
    title: "Pre-ECT Vitals",
    fields: [
      { name: "bp", label: "Blood Pressure", type: "text", unit: "mmHg" },
      { name: "pulseRate", label: "Pulse Rate", type: "text", unit: "bpm" },
      { name: "spo2", label: "SpO2", type: "text", unit: "%" },
      { name: "temperature", label: "Temperature", type: "text", unit: "°F" },
      { name: "bloodSugar", label: "Blood Sugar", type: "text", unit: "mg/dL" },
      { name: "weight", label: "Weight", type: "text", unit: "kg" },
    ],
  },
  {
    key: "anaesthesia",
    title: "Anaesthesia & Premedication",
    fields: [
      {
        name: "glycopyrrolate",
        label: "Glycopyrrolate",
        type: "text",
        unit: "mg IV",
      },
      { name: "midazolam", label: "Midazolam", type: "text", unit: "mg IV" },
      {
        name: "inductionAgent",
        label: "Induction Agent",
        type: "radio",
        options: ["Propofol", "Thiopentone", "Etomidate", "Ketamine"],
      },
      {
        name: "inductionDose",
        label: "Induction Dose",
        type: "text",
        unit: "mg IV",
      },
      {
        name: "succinylcholine",
        label: "Succinylcholine",
        type: "text",
        unit: "mg IV",
      },
      {
        name: "oxygen",
        label: "Oxygen",
        type: "radio",
        options: ["Pre-oxygenated", "Bag-mask ventilated"],
      },
      { name: "otherDrugs", label: "Other Drugs / Adjuncts", type: "text" },
    ],
  },
  {
    key: "ectParameters",
    title: "ECT Stimulus Parameters",
    fields: [
      {
        name: "electrodePlacement",
        label: "Electrode Placement",
        type: "radio",
        options: [
          "Bitemporal (BT)",
          "Bifrontal (BF)",
          "Right Unilateral (RUL)",
          "Left Unilateral (LUL)",
        ],
      },
      { name: "machine", label: "Machine / Device", type: "text" },
      { name: "impedance", label: "Impedance", type: "text", unit: "Ω" },
      { name: "pulseWidth", label: "Pulse Width", type: "text", unit: "ms" },
      { name: "frequency", label: "Frequency", type: "text", unit: "Hz" },
      { name: "current", label: "Current", type: "text", unit: "mA" },
      {
        name: "trainDuration",
        label: "Train Duration",
        type: "text",
        unit: "sec",
      },
      {
        name: "stimulusCharge",
        label: "Stimulus Charge",
        type: "text",
        unit: "mC",
      },
      { name: "energy", label: "Energy", type: "text", unit: "%" },
      {
        name: "numberOfStimulations",
        label: "Number of Stimulations",
        type: "text",
      },
      {
        name: "restimulationDone",
        label: "Restimulation Done",
        type: "radio",
        options: ["Yes", "No"],
      },
    ],
  },
  {
    key: "seizureMonitoring",
    title: "Seizure Monitoring",
    fields: [
      {
        name: "motorSeizureDuration",
        label: "Motor Seizure Duration",
        type: "text",
        unit: "sec",
      },
      {
        name: "eegSeizureDuration",
        label: "EEG Seizure Duration",
        type: "text",
        unit: "sec",
      },
      {
        name: "cuffMethodUsed",
        label: "Cuff Method Used",
        type: "radio",
        options: ["Yes", "No"],
      },
      {
        name: "seizureQuality",
        label: "Seizure Quality",
        type: "radio",
        options: ["Adequate", "Poor", "Prolonged", "Missed"],
      },
      {
        name: "eegPattern",
        label: "EEG Pattern",
        type: "radio",
        options: [
          "Generalized tonic-clonic",
          "Polyspike & wave",
          "Abrupt termination",
          "Not recorded",
        ],
      },
    ],
  },
  {
    key: "recovery",
    title: "Recovery",
    fields: [
      {
        name: "timeToEyeOpening",
        label: "Time to Eye Opening",
        type: "text",
        unit: "min",
      },
      {
        name: "timeToFullOrientation",
        label: "Time to Full Orientation",
        type: "text",
        unit: "min",
      },
      {
        name: "orientationRegained",
        label: "Orientation Regained",
        type: "radio",
        options: ["Yes", "Partial", "No"],
      },
      { name: "transferredToWard", label: "Transferred to Ward", type: "time" },
      { name: "postEctBp", label: "Post-ECT BP", type: "text", unit: "mmHg" },
      {
        name: "postEctPulse",
        label: "Post-ECT Pulse",
        type: "text",
        unit: "bpm",
      },
      { name: "postEctSpo2", label: "Post-ECT SpO2", type: "text", unit: "%" },
      { name: "postEctGcs", label: "Post-ECT GCS", type: "text", unit: "/ 15" },
    ],
  },
  {
    key: "complications",
    title: "Complications",
    fields: [
      {
        name: "complications",
        label: "Complications Observed",
        type: "checkbox",
        options: [
          "Prolonged seizure",
          "Missed seizure",
          "Bradycardia",
          "Tachycardia",
          "Hypertension",
          "Hypotension",
          "Arrhythmia",
          "Laryngospasm",
          "Aspiration",
          "Agitation / Confusion",
          "Headache",
          "Nausea / Vomiting",
          "Muscle pain",
          "Jaw pain",
          "Apnoea",
        ],
      },
      { name: "complicationsOther", label: "Other Complication", type: "text" },
      {
        name: "management",
        label: "Management Given for Complications",
        type: "textarea",
      },
    ],
  },
  {
    key: "clinicalAssessment",
    title: "Clinical Assessment & Plan",
    fields: [
      {
        name: "responseToPreviousEct",
        label: "Response to Previous ECT",
        type: "radio",
        options: [
          "Good response",
          "Partial response",
          "No response",
          "First session",
        ],
      },
      {
        name: "cgiS",
        label: "Current CGI-S Score",
        type: "select",
        options: [
          "1 - Normal",
          "2 - Borderline",
          "3 - Mildly ill",
          "4 - Moderately ill",
          "5 - Markedly ill",
          "6 - Severely ill",
          "7 - Extremely ill",
        ],
      },
      {
        name: "cognitiveSideEffects",
        label: "Cognitive Side-Effects Noted",
        type: "radio",
        options: ["None", "Mild amnesia", "Moderate amnesia", "Confusion"],
      },
      {
        name: "procedureSummary",
        label: "Today's Procedure Summary",
        type: "textarea",
      },
      {
        name: "planForNext",
        label: "Plan for Next ECT",
        type: "radio",
        options: [
          "Continue same parameters",
          "Increase energy",
          "Decrease energy",
          "Hold - Review",
          "Course complete",
        ],
      },
      {
        name: "nextEctDate",
        label: "Next ECT Date (if scheduled)",
        type: "text",
      },
      {
        name: "interval",
        label: "Interval",
        type: "radio",
        options: ["Alternate day", "3x/week", "Weekly"],
      },
      {
        name: "remarks",
        label: "Remarks / Additional Notes",
        type: "textarea",
      },
    ],
  },
  {
    key: "authentication",
    title: "Authentication",
    fields: [
      {
        name: "psychiatristName",
        label: "Consultant Psychiatrist",
        type: "text",
      },
      { name: "anaesthetistName", label: "Anaesthetist", type: "text" },
      { name: "nurseName", label: "ECT Nurse / Technician", type: "text" },
    ],
  },
];

const Forms = [
  // Group 1 — MHRB Related Forms
  {
    name: "Capacity Assessment Form",
    category: "CAPACITY ASSESSMENT FORM",
  },
  {
    name: "MHRB Admission",
    category: "ADMISSION FORM",
  },
  {
    name: "MHRB Discharge Form",
    category: "DISCHARGE FORM",
  },
  {
    name: "MHRB Email Upload",
    category: "MHRB EMAIL FORM",
  },
  // Group 2 — standalone (no section header in the dropdown)
  {
    name: "Admission and Consent Form",
    category: "CONSENT FORM",
  },
  {
    name: "Undertaking Discharge Form",
    category: "UNDERTAKING DISCHARGE FORM",
  },
  {
    name: "Emergency Admission Form",
    category: "EMERGENCY ADMISSION FORM",
  },
  {
    name: "Emergency Discharge Form",
    category: "EMERGENCY DISCHARGE FORM",
  },
  {
    name: "ECT Consent Form",
    category: "ECT CONSENT FORM",
  },
  {
    name: "Do Not Resuscitate Form",
    category: "DNR FORM",
  },
];
const testRecord = [
  { name: "CGI-S" },
  { name: "C-SSRS" },
  { name: "AUDIT" },
  { name: "CIWA-AR" },
  { name: "YMRS" },
  { name: "MPQ-9" },
  { name: "MMSE" },
  { name: "Y-BOCS" },
  { name: "ACDS" },
  { name: "HAM-A" },
  { name: "HAM-D" },
  { name: "PANSS" },
  { name: "Morse Fall Scale" },
  { name: "Ramsay Sedation Scale" },
  { name: "GCS" },
  { name: "COWS" },
  { name: "AUDIT" },
  { name: "CIWA-B" },
];

const prescriptionFormFields = [
  {
    label: "Dr Notes",
    name: "drNotes",
    type: "textarea",
    rows: 5,
  },
  {
    label: "Diagnosis ICD Code 1",
    name: "icdCode",
    type: "async-select",
  },
  {
    label: "Notes",
    name: "notes",
    type: "textarea",
  },
  {
    label: "Diagnosis",
    name: "diagnosis",
    type: "textarea",
  },
  // {
  //   label: "Diagnosis 2",
  //   name: "diagnosis2",
  //   type: "textarea",
  // },

  {
    label: "Investigation Plan",
    name: "investigationPlan",
    type: "textarea",
  },
  {
    label: "Complaints",
    name: "complaints",
    type: "textarea",
  },
  {
    label: "Observation",
    name: "observation",
    type: "textarea",
    rows: 5,
  },
];

const vitalSignFields = [
  {
    label: "Weight",
    name: "weight",
    type: "text",
  },
  {
    label: "Blood Pressure (mm Hg)",
    fields: [
      {
        label: "Systolic",
        name: "systolic",
        type: "text",
      },
      {
        label: "Diastolic",
        name: "diastolic",
        type: "text",
      },
    ],
  },
  {
    label: "Pulse",
    name: "pulse",
    type: "text",
  },
  {
    label: "Temprature (°F)",
    name: "temprature",
    type: "text",
  },
  {
    label: "Respiration Rate (Breaths/min)",
    name: "respirationRate",
    type: "text",
  },
  {
    label: "CNS",
    name: "cns",
    type: "text",
    xs: 6,
    md: 3,
  },
  {
    label: "CVS",
    name: "cvs",
    type: "text",
    xs: 6,
    md: 3,
  },
  {
    label: "RS",
    name: "rs",
    type: "text",
    xs: 6,
    md: 3,
  },
  {
    label: "PA",
    name: "pa",
    type: "text",
    xs: 6,
    md: 3,
  },
  {
    label: "SpO2 (%)",
    name: "spo2",
    type: "text",
  },
  {
    label: "BSL (mg/dL)",
    name: "bloodSugar",
    type: "text",
  },
];

// Columns for each row of the Input - Output chart
const inputOutputColumns = [
  {
    label: "Intake",
    name: "intake",
  },
  {
    label: "Output",
    name: "output",
  },
  {
    label: "IV Fluid",
    name: "ivFluid",
  },
  {
    label: "Remark",
    name: "remark",
  },
];

// Activity types for the Nurse - SOS Procedure chart
const nurseSosActivityTypes = [
  "BSL",
  "ceftriaxone 1 gm iv",
  "Dressing",
  "ect preparation pre/post/nursing",
  "ECG",
  "foley's catheter insertion",
  "Injection",
  "iv cannula (intracath)",
  "iv injection",
  "IV Fluids",
  "Medicine",
  "Mouth wash procedure",
  "nebulization",
  "ns infusion",
  "oxygen administration",
  "rl infusion",
  "rt feeding",
  "ryle's tube (rt) insertion",
  "Suction procedure",
  "Urine Drug Tests",
  "urinary catheter care",
  "X-Ray",
  "Other",
];

const clinicalNoteFields = [
  {
    label: "Complaints",
    name: "complaints",
    type: "textarea",
  },
  {
    label: "Observations",
    name: "observations",
    type: "textarea",
  },
  {
    label: "Diagnosis",
    name: "diagnosis",
    type: "textarea",
  },
  {
    label: "Notes",
    name: "notes",
    type: "textarea",
  },
];

const mentalExaminationFields = [
  { label: "Appearance & Behavior", name: "", type: "header" },
  {
    label: "Grooming",
    name: "grooming",
    type: "radio",
    options: ["good", "fair", "poor"],
  },
  {
    label: "Eye Contact",
    name: "eyeContact",
    type: "radio",
    options: ["normal", "avoidant", "excessive"],
  },
  {
    label: "Psychomotor Activity",
    name: "psychomotorActivity",
    type: "radio",
    options: ["normal", "retarded", "agitated"],
  },

  { label: "Speech", type: "header" },
  {
    label: "Rate",
    name: "rate",
    type: "radio",
    options: ["normal", "slow", "pressured"],
  },
  {
    label: "Volume",
    name: "volume",
    type: "radio",
    options: ["normal", "low", "loud"],
  },

  { label: "Mood", type: "header" },
  {
    label: "Affect",
    name: "affect",
    type: "radio",
    options: ["euthymic", "depressed", "irritable", "elated"],
  },
  {
    label: "Affect Notes",
    name: "affectNotes",
    type: "text",
  },
  {
    label: "Mood",
    name: "subjective",
    type: "text",
  },
  { label: "Thought", type: "header" },
  {
    label: "Delusions",
    name: "delusions",
    type: "radio",
    options: ["none", "present"],
  },
  {
    label: "Content",
    name: "content",
    type: "text",
  },
  {
    label: "If Delusion Present, Specify",
    name: "delusionNotes",
    type: "text",
    showIf: {
      field: "delusions",
      value: "present",
    },
  },

  { label: "Perception", type: "header" },
  {
    label: "Perception",
    name: "perception",
    type: "radio",
    options: ["normal", "hallucination", "illusion"],
    labelHidden: true,
  },

  { label: "Cognition", type: "header" },
  {
    label: "Orientation",
    name: "orientation",
    type: "radio",
    options: ["time", "place", "person"],
  },

  {
    label: "Memory",
    name: "memory",
    type: "radio",
    options: ["intact", "impaired"],
  },

  { label: "Insight", type: "header" },
  {
    label: "Grade",
    name: "grade",
    type: "select",
    options: ["I", "II", "III", "IV", "V", "VI"],
  },

  { label: "Judgment", type: "header" },
  {
    label: "Judgment",
    name: "judgment",
    type: "radio",
    options: ["intact", "impaired"],
    labelHidden: true,
  },

  { label: "Remarks / Impression", type: "header" },
  {
    label: "Remarks",
    name: "remarks",
    type: "text",
    labelHidden: true,
  },
];

const mentalExaminationV2Fields = [
  { label: "Cheif Complaints", type: "header" },
  {
    label: "Cheif Complaint",
    name: "chiefComplaints",
    type: "textarea",
    labelHidden: true,
  },

  { label: "Appearance & Behavior", type: "header" },
  {
    label: "Grooming",
    name: "grooming",
    type: "radio",
    options: ["good", "fair", "poor"],
  },
  {
    label: "General Appearance",
    name: "generalAppearance",
    type: "radio",
    options: [
      { label: "Kempt", value: "kempt" },
      { label: "Unkempt and untidy", value: "unkempt_and_untidy" },
      { label: "Overtly made up", value: "overtly_made_up" },
      { label: "Fair", value: "fair" },
      { label: "Poor", value: "poor" },
    ],
  },
  {
    label: "In Touch With Surroundings",
    name: "surroundingTouch",
    type: "radio",
    options: ["present", "partial", "absent"],
  },
  {
    label: "Eye Contact",
    name: "eyeContact",
    type: "radio",
    options: ["normal", "avoidant", "excessive"],
  },
  {
    label: "Psychomotor Activity",
    name: "psychomotorActivity",
    type: "radio",
    options: [
      { label: "Normal", value: "normal" },
      { label: "Retarded", value: "retarded" },
      { label: "Hyperactive", value: "hyperactive" },
      { label: "Agitated", value: "agitated" },
      { label: "Mannerisms", value: "mannerisms" },
      { label: "Restless", value: "restless" },
      { label: "Grimace", value: "grimace" },
      { label: "Hallucinatory Behaviour", value: "hallucinatory_behaviour" },
      { label: "Silly Smiling", value: "silly_smiling" },
      { label: "Aggressive", value: "aggressive" },
    ],
  },

  { label: "Speech", type: "header" },
  {
    label: "Rate",
    name: "rate",
    type: "radio",
    options: ["normal", "slow", "pressured"],
  },
  {
    label: "Tone",
    name: "tone",
    type: "radio",
    options: ["increased", "decreased", "normal"],
  },
  {
    label: "Volume",
    name: "volume",
    type: "radio",
    options: ["normal/audible", "low/soft", "loud"],
  },
  {
    label: "Reaction Time",
    name: "reactionTime",
    type: "radio",
    options: [
      { label: "Increased Reaction Time", value: "increased" },
      { label: "Decreased Reaction Time", value: "decreased" },
      { label: "Normal", value: "normal" },
    ],
  },
  {
    label: "Productivity",
    name: "productivity",
    type: "radio",
    options: [
      { label: "Increased Productivity", value: "increased" },
      { label: "Decreased Productivity", value: "decreased" },
      { label: "Normal", value: "normal" },
    ],
  },
  {
    label: "Speed",
    name: "speed",
    type: "radio",
    options: [
      { label: "Slow", value: "slow" },
      { label: "Rapid", value: "rapid" },
      { label: "Pressure Of Speech", value: "pressure_of_speech" },
      { label: "Normal", value: "normal" },
    ],
  },
  {
    label: "Relevance",
    name: "relevance",
    type: "radio",
    options: ["relevant", "irrelevant"],
  },
  {
    label: "Coherence",
    name: "coherence",
    type: "radio",
    options: ["coherent", "incoherent"],
  },
  {
    label: "Goal Direction",
    name: "goalDirection",
    type: "radio",
    options: [
      { label: "Goal Directed", value: "goal_directed" },
      { label: "Non Goal Directed", value: "non_goal_directed" },
    ],
  },

  { label: "Mood", type: "header" },
  // {
  //   label: "Objective Mood",
  //   name: "objective",
  //   type: "textarea",
  // },
  {
    label: "Subjective Mood",
    name: "subjective",
    type: "textarea",
  },
  // {
  //   label: "Lability",
  //   name: "lability",
  //   type: "radio",
  //   options: ["present", "absent"],
  // },
  // {
  //   label: "Appropriateness",
  //   name: "appropriateness1",
  //   type: "text",
  // },

  { label: "Affect", type: "header" },
  // {
  //   label: "Affect",
  //   name: "affect",
  //   type: "radio",
  //   options: ["euthymic", "depressed", "irritable", "elated"],
  // },
  {
    label: "Quality",
    name: "quality",
    type: "radio",
    options: [
      "dysphoric",
      "anxious",
      "irritable",
      "depressed",
      "elevated",
      "euphoric",
      "elated",
      "exalted",
      "ecstatic",
      "euthymic",
    ],
  },
  {
    label: "Intensity of Affect",
    name: "intensity",
    type: "radio",
    options: ["shallow", "blunted", "flat", "normal"],
  },
  {
    label: "Mobility of Affect",
    name: "mobility",
    type: "radio",
    options: ["constricted", "fixed", "labile", "normal"],
  },
  {
    label: "Range",
    name: "range",
    type: "radio",
    options: ["full", "constricted"],
  },
  {
    label: "Reactivity",
    name: "reactivity",
    type: "radio",
    options: ["present", "absent"],
  },
  {
    label: "Communicability",
    name: "communicability",
    type: "radio",
    options: ["present", "absent"],
  },
  {
    label: "Diurnal Variation of Affect",
    name: "diurnalVariation",
    type: "radio",
    options: [
      { label: "Worse in Morning", value: "worse_in_morning" },
      { label: "Worse in Evening", value: "worse_in_evening" },
      { label: "None", value: "none" },
    ],
  },
  {
    label: "Appropriateness",
    name: "appropriateness2",
    type: "text",
  },
  {
    label: "Affect Notes",
    name: "affectNotes",
    type: "textarea",
  },

  { label: "Thought", type: "header" },

  {
    label: "Delusions",
    name: "delusions",
    type: "radio",
    options: ["none", "present"],
  },
  {
    label: "Thought Content",
    name: "content",
    type: "textarea",
  },
  {
    label: "Thought Process",
    name: "process",
    type: "textarea",
  },
  {
    label: "If Delusion Present, Specify",
    name: "delusionNotes",
    type: "textarea",
    showIf: {
      field: "delusions",
      value: "present",
    },
  },

  { label: "Perception", type: "header" },
  {
    label: "Perception",
    name: "perception",
    type: "radio",
    options: ["normal", "hallucination", "illusion"],
    labelHidden: true,
  },
  {
    label: "Perception Notes",
    name: "perceptionNotes",
    type: "textarea",
    labelHidden: true,
  },

  { label: "Cognition", type: "header" },
  {
    label: "Orientation",
    name: "orientation",
    type: "checkbox",
    options: ["time", "place", "person"],
  },
  {
    label: "Attention",
    name: "attention",
    type: "radio",
    options: [
      { label: "Easily Distractible", value: "easily_distractible" },
      { label: "Attention Maintained", value: "attention_maintained" },
      { label: "Disturbance in Attention", value: "disturbance_in_attention" },
    ],
  },
  {
    label: "Concentration",
    name: "concentration",
    type: "radio",
    options: [
      {
        label: "Able to Concentrate and Focus",
        value: "able_to_concentrate_and_focus",
      },
      {
        label: "Unable to Concentrate and Focus",
        value: "unable_to_concentrate_and_focus",
      },
    ],
  },
  {
    label: "Memory",
    name: "memory",
    type: "radio",
    options: ["intact", "partial", "impaired"],
  },

  { label: "Insight", type: "header" },
  {
    label: "Grade",
    name: "grade",
    type: "select2",
    options: [
      {
        label: "Grade 1 - Complete Denial of Illness",
        value: "grade_1-_complete_denial_of_illness",
      },
      {
        label: "Grade 2 - Slight Awareness But Still Denying",
        value: "grade_2-_slight_awareness_byt_still_denying",
      },
      {
        label:
          "Grade 3 - Awareness of Being Sick, But Blaming External Factors",
        value: "grade_3-_awareness_of_being_sick_but_blaming_external_factors",
      },
      {
        label:
          "Grade 4 - Aware Something Is Wrong And Self Is Involved, But Feels Helpless And Attributes It To Unknown/Organic Factors.",
        value:
          "grade_4-_aware_something_is_wrong_and_self_is_involved,_but_feels_helpless_and_attributes_it_to_unknown/organic_factors",
      },
      {
        label:
          "Grade 5 - Understands They're Contributing To the Issue But Has No Clue How To Fix It.",
        value:
          "grade_5-_understands_they're_contributing_to_the_issue_but_has_no_clue_how_to_fix_it",
      },
      {
        label:
          "Grade 6 - Fully Aware Of The Problem, Accepts Responsibility, And Is Willing To Take Help And Make Changes.",
        value:
          "grade_6-_fully_aware_of_the_problem,_accepts_responsibility,_and_willing_to_help_and_make_changes",
      },
    ],
    labelHidden: true,
  },

  { label: "Judgment", type: "header" },
  {
    label: "Judgment",
    name: "judgment",
    type: "radio",
    options: ["intact", "partial", "impaired"],
    labelHidden: true,
  },

  { label: "Remarks / Impression", type: "header" },
  {
    label: "Remarks",
    name: "remarks",
    type: "textarea",
    labelHidden: true,
  },

  { label: "Observation", type: "header" },
  {
    label: "Observation",
    name: "observation",
    type: "textarea",
    labelHidden: true,
  },
];

const elderlyFunctionalChecklistFields = [
  { label: "Information", type: "header" },
  // {
  //   label: "Resident Name / ID",
  //   name: "residentNameId",
  //   type: "text",
  //   required: true,
  // },
  // {
  //   label: "Date / Time",
  //   name: "checklistDateTime",
  //   type: "date",
  //   required: true,
  // },
  {
    label: "Information Source",
    name: "informationSource",
    type: "radio",
    required: true,
    options: [
      { label: "Direct observation", value: "direct_observation" },
      { label: "Resident", value: "resident" },
      { label: "Caregiver or nursing staff", value: "caregiver_or_nursing_staff" },
      { label: "Family", value: "family" },
      { label: "Other", value: "other" },
    ],
  },
  {
    label: "If Other, please specify",
    name: "informationSourceOther",
    type: "text",
    required: true,
    showIf: { field: "informationSource", value: "other" },
  },

  { label: "Section A. Functional Assessment", type: "header" },
  {
    label: "Supervision Required",
    name: "supervisionRequired",
    type: "radio",
    required: true,
    options: [
      { label: "None", value: "none" },
      { label: "Intermittent", value: "intermittent" },
      { label: "Continuous", value: "continuous" },
      { label: "Not known", value: "not_known" },
    ],
  },
  {
    label: "Standing Ability",
    name: "standingAbility",
    type: "radio",
    required: true,
    options: [
      { label: "Independent", value: "independent" },
      { label: "Support required", value: "support_required" },
      { label: "Unable", value: "unable" },
      { label: "Not known", value: "not_known" },
    ],
  },
  {
    label: "Walking / Mobility",
    name: "walkingMobility",
    type: "radio",
    required: true,
    options: [
      { label: "Independent", value: "independent" },
      { label: "Assistance required", value: "assistance_required" },
      { label: "Unable", value: "unable" },
      { label: "Not known", value: "not_known" },
    ],
  },
  {
    label: "Walking Aid Used",
    name: "walkingAidUsed",
    type: "radio",
    required: true,
    options: [
      { label: "No", value: "no" },
      { label: "Yes", value: "yes" },
      { label: "Not known", value: "not_known" },
    ],
  },
  {
    label: "Personal Hygiene",
    name: "personalHygiene",
    type: "radio",
    required: true,
    options: [
      { label: "Independent", value: "independent" },
      { label: "Needs assistance", value: "needs_assistance" },
      { label: "Dependent", value: "dependent" },
      { label: "Not known", value: "not_known" },
    ],
  },
  {
    label: "Self-Care Ability",
    name: "selfCareAbility",
    type: "radio",
    required: true,
    options: [
      { label: "Independent", value: "independent" },
      { label: "Partially dependent", value: "partially_dependent" },
      { label: "Fully dependent", value: "fully_dependent" },
      { label: "Not known", value: "not_known" },
    ],
  },
  {
    label: "Level of Assistance Required",
    name: "levelOfAssistanceRequired",
    type: "radio",
    required: true,
    options: [
      { label: "None", value: "none" },
      { label: "Minimal", value: "minimal" },
      { label: "Moderate", value: "moderate" },
      { label: "Maximum", value: "maximum" },
      { label: "Total", value: "total" },
      { label: "Not known", value: "not_known" },
    ],
  },

  { label: "Section B. Daily Living Assessment", type: "header" },
  {
    label: "Food Intake",
    name: "foodIntake",
    type: "radio",
    required: true,
    options: [
      { label: "Usual/Adequate", value: "usual_adequate" },
      { label: "Reduced", value: "reduced" },
      { label: "Poor", value: "poor" },
      { label: "Not known", value: "not_known" },
    ],
  },
  {
    label: "Fluid Intake",
    name: "fluidIntake",
    type: "radio",
    required: true,
    options: [
      { label: "Usual/Adequate", value: "usual_adequate" },
      { label: "Reduced", value: "reduced" },
      { label: "Poor", value: "poor" },
      { label: "Not known", value: "not_known" },
    ],
  },
  {
    label: "Feeding Assistance Required",
    name: "feedingAssistanceRequired",
    type: "radio",
    required: true,
    options: [
      { label: "No", value: "no" },
      { label: "Yes", value: "yes" },
      { label: "Not known", value: "not_known" },
    ],
  },
  {
    label: "Urine Pattern as Reported",
    name: "urinePatternAsReported",
    type: "radio",
    required: true,
    options: [
      { label: "Usual", value: "usual" },
      { label: "Change reported", value: "change_reported" },
      { label: "Not known", value: "not_known" },
    ],
  },
  {
    label: "Bowel Pattern as Reported",
    name: "bowelPatternAsReported",
    type: "radio",
    required: true,
    options: [
      { label: "Usual", value: "usual" },
      { label: "Change reported", value: "change_reported" },
      { label: "Not known", value: "not_known" },
    ],
  },
  {
    label: "Urine Control",
    name: "urineControl",
    type: "radio",
    required: true,
    options: [
      { label: "No accidents reported", value: "no_accidents_reported" },
      { label: "Accidents reported", value: "accidents_reported" },
      { label: "Not known", value: "not_known" },
    ],
  },
  {
    label: "Bowel Control",
    name: "bowelControl",
    type: "radio",
    required: true,
    options: [
      { label: "No accidents reported", value: "no_accidents_reported" },
      { label: "Accidents reported", value: "accidents_reported" },
      { label: "Not known", value: "not_known" },
    ],
  },
  {
    label: "Catheter Status per Nursing Staff",
    name: "catheterStatus",
    type: "radio",
    required: true,
    options: [
      { label: "Absent", value: "absent" },
      { label: "Present", value: "present" },
      { label: "Not known", value: "not_known" },
    ],
  },
  {
    label: "Skin Concerns Noticed or Reported",
    name: "skinConcerns",
    type: "checkboxWithText",
    required: true,
    options: [
      { label: "None", value: "none" },
      { label: "Redness", value: "redness" },
      { label: "Wound-sore", value: "wound_sore" },
      { label: "Not known", value: "not_known" },
    ],
  },
  {
    label: "Skin Concern Location / Details",
    name: "skinConcernDetails",
    type: "text",
    requiredIf: { field: "skinConcerns", includesAny: ["redness", "wound_sore"] },
  },

  { label: "Section C. Everyday Observations", type: "header" },
  {
    label: "Sleep as Reported",
    name: "sleepAsReported",
    type: "radio",
    required: true,
    options: [
      { label: "Usual", value: "usual" },
      { label: "Interrupted", value: "interrupted" },
      { label: "Less than usual", value: "less_than_usual" },
      { label: "Not known", value: "not_known" },
    ],
  },
  {
    label: "Activity Participation",
    name: "activityParticipation",
    type: "radio",
    required: true,
    options: [
      { label: "Joins independently", value: "joins_independently" },
      { label: "Needs encouragement", value: "needs_encouragement" },
      { label: "Does not join", value: "does_not_join" },
      {
        label: "No activity offered / not observed",
        value: "no_activity_offered_not_observed",
      },
    ],
  },
  {
    label: "Expressing Needs",
    name: "expressingNeeds",
    type: "radio",
    required: true,
    options: [
      { label: "Clearly", value: "clearly" },
      { label: "With prompting/gestures", value: "with_prompting_gestures" },
      { label: "Needs help", value: "needs_help" },
      { label: "Not observed", value: "not_observed" },
    ],
  },
  {
    label: "Fall Since Last Review",
    name: "fallSinceLastReview",
    type: "radio",
    required: true,
    options: [
      { label: "No", value: "no" },
      { label: "Yes", value: "yes" },
      { label: "Not known", value: "not_known" },
    ],
  },
  {
    label: "Fall Date",
    name: "fallDate",
    type: "date",
    required: true,
    showIf: { field: "fallSinceLastReview", value: "yes" },
  },
  {
    label: "Care Needs / Changes Noted",
    name: "careNeedsChangesNoted",
    type: "textarea",
    required: true,
    fullWidth: true,
  },
  {
    label: "Concern Shared With",
    name: "concernSharedWith",
    type: "radio",
    required: true,
    options: [
      { label: "Nurse", value: "nurse" },
      { label: "Doctor", value: "doctor" },
      { label: "Care team", value: "care_team" },
      { label: "Not required", value: "not_required" },
    ],
  },
  {
    label: "Name / Date / Time, if Shared",
    name: "sharedNameDateTime",
    type: "text",
    requiredIf: { field: "concernSharedWith", notEquals: "not_required" },
  },
];

const counsellingNoteFields = [
  {
    label: "Objective of the session",
    name: "objective",
    type: "textarea",
  },
  {
    label: "Short term goals",
    name: "shortTermGoals",
    type: "textarea",
  },
  {
    label: "Long term goals",
    name: "longTermGoals",
    type: "textarea",
  },
  {
    label: "Notes",
    name: "notes",
    type: "textarea",
  },
  {
    label: "Homework/Task assigned",
    name: "homework",
    type: "textarea",
  },
  {
    label: "Review of previous task",
    name: "reviewPreviousTask",
    type: "textarea",
  },
  {
    label: "Conclusion",
    name: "conclusion",
    type: "textarea",
  },
  {
    label: "Goal for next session",
    name: "nextEndGoal",
    type: "textarea",
  },
  {
    label: "Next session date",
    name: "nextSessionDate",
    type: "date",
  },
];

const relativeVisitFields = [
  {
    label: "NAK info",
    name: "nakInfo",
    type: "textarea",
  },
  ...clinicalNoteFields,
];

const outpassFields = [
  {
    label: "From Date",
    name: "fromDate",
    type: "date",
  },
  {
    label: "To Date",
    name: "toDate",
    type: "date",
  },
  {
    label: "Note",
    name: "note",
    type: "textarea",
  },
];

const dischargeSummaryFields = [
  {
    label: "Diagnosis",
    name: "diagnosis",
    type: "textarea",
    xs: 12,
    md: 6,
  },
  {
    label: "Presenting Symptoms",
    name: "presentingSymptoms",
    type: "textarea",
    xs: 12,
    md: 6,
  },
  {
    label: "Mse at admission",
    name: "mseAddmission",
    fields: [
      {
        label: "Appearance and Behavior",
        name: "appearance",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "ECC / Rapport",
        name: "ecc",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "Speech",
        name: "speech",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "Mood",
        name: "mood",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "Affect",
        name: "affect",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "Thoughts",
        name: "thoughts",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "Perception",
        name: "perception",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "Memory",
        name: "memory",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "Abstract Thinking",
        name: "abstractThinking",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "Social Judgment",
        name: "socialJudgment",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "Insight",
        name: "insight",
        type: "text",
        xs: 6,
        md: 3,
      },
    ],
  },
  {
    label: "Past History",
    name: "pastHistory",
    type: "textarea",
    xs: 12,
    md: 4,
  },
  {
    label: "Medical History",
    name: "medicalHistory",
    type: "textarea",
    xs: 12,
    md: 4,
  },
  {
    label: "Family History",
    name: "familyHistory",
    type: "textarea",
    xs: 12,
    md: 4,
  },
  {
    label: "Personal History",
    name: "personalHistory",
    fields: [
      {
        label: "Smoking",
        name: "smoking",
        type: "text",
        xs: 6,
        md: 4,
      },
      {
        label: "Chewing Tobacco",
        name: "chewingTobacco",
        type: "text",
        xs: 6,
        md: 4,
      },
      {
        label: "Alcohol",
        name: "alcohol",
        type: "text",
        xs: 6,
        md: 4,
      },
    ],
  },
  {
    label: "Physical Examination",
    name: "physicalExamination",
    fields: [
      {
        label: "Temprature",
        name: "temprature",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "Pulse",
        name: "pulse",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "B.P",
        name: "bp",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "CVS",
        name: "cvs",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "RS",
        name: "rs",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "Abdomen",
        name: "abdomen",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "CNS",
        name: "cns",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "Others",
        name: "others",
        type: "text",
        xs: 6,
        md: 3,
      },
    ],
  },
  {
    label: "Investigation (all reports attached with Discharge Card)",
    name: "investigation",
    type: "textarea",
    xs: 12,
    md: 6,
  },
  {
    label: "DISCUSSION / WARD MANAGMENT",
    name: "discussion",
    type: "textarea",
    xs: 12,
    md: 6,
  },
  {
    label: "Refernces",
    name: "refernces",
    type: "text",
    xs: 12,
    md: 6,
  },
  {
    label: "Modified ECT's / Ketamine / Other Treatment",
    name: "modifiedTreatment",
    type: "text",
    xs: 12,
    md: 6,
  },
  {
    label: "LA / Deport Administered",
    name: "deportAdministered",
    type: "textarea",
    xs: 12,
    md: 6,
  },
  {
    label: "PATIENT CONDITION / STATUS AT THE TIME OF DISCHARGE",
    name: "patientStatus",
    type: "textarea",
    xs: 12,
    md: 6,
  },
  {
    label: "Mse at discharge",
    name: "mseDischarge",
    fields: [
      {
        label: "Appearance and Behavior",
        name: "appearance",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "ECC / Rapport",
        name: "ecc",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "Speech",
        name: "speech",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "Mood",
        name: "mood",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "Affect",
        name: "affect",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "Thoughts",
        name: "thoughts",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "Perception",
        name: "perception",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "Memory",
        name: "memory",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "Abstract Thinking",
        name: "abstractThinking",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "Social Judgment",
        name: "socialJudgment",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "Insight",
        name: "insight",
        type: "text",
        xs: 6,
        md: 3,
      },
    ],
  },
  {
    label: "Follow up",
    name: "followUp",
    type: "textarea",
    xs: 12,
    md: 6,
  },
  {
    label: "Note",
    name: "note",
    type: "textarea",
    xs: 12,
    md: 6,
  },
  {
    label: "Consultant Name",
    name: "consultantName",
    type: "text",
    xs: 12,
    md: 6,
  },
  {
    label: "MO/SMO/CMO/Consultant",
    name: "consultantSignature",
    type: "text",
    xs: 12,
    md: 6,
  },
  {
    label: "Consultant Psychologist",
    name: "consultantPsychologist",
    type: "text",
    xs: 12,
    md: 6,
  },
  {
    label: "Discharge Summary Prepared By",
    name: "summaryPreparedBy",
    type: "text",
    xs: 12,
    md: 6,
  },
  {
    label: "Type of Discharge",
    name: "dischargeType",
    type: "text",
    xs: 12,
    md: 6,
  },
  {
    label: "Discharge Routine",
    name: "dischargeRoutine",
    type: "text",
    xs: 12,
    md: 6,
  },
  {
    label: "Date of discharge",
    name: "dischargeDate",
    type: "date",
    xs: 12,
    md: 6,
  },
];

const expirySummaryFields = [
  {
    label: "Cause of Death",
    name: "expiryCause",
    type: "textarea",
    xs: 12,
    md: 6,
    required: true,
  },
  {
    label: "Date and Time of Expiry",
    name: "expiryDateTime",
    type: "datetime-local",
    xs: 12,
    md: 6,
    required: true,
  },
  {
    label: "Diagnosis",
    name: "diagnosis",
    type: "textarea",
    xs: 12,
    md: 6,
  },
  {
    label: "Presenting Symptoms",
    name: "presentingSymptoms",
    type: "textarea",
    xs: 12,
    md: 6,
  },
  {
    label: "Mse at admission",
    name: "mseAddmission",
    fields: [
      {
        label: "Appearance and Behavior",
        name: "appearance",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "ECC / Rapport",
        name: "ecc",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "Speech",
        name: "speech",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "Mood",
        name: "mood",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "Affect",
        name: "affect",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "Thoughts",
        name: "thoughts",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "Perception",
        name: "perception",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "Memory",
        name: "memory",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "Abstract Thinking",
        name: "abstractThinking",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "Social Judgment",
        name: "socialJudgment",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "Insight",
        name: "insight",
        type: "text",
        xs: 6,
        md: 3,
      },
    ],
  },
  {
    label: "Past History",
    name: "pastHistory",
    type: "textarea",
    xs: 12,
    md: 4,
  },
  {
    label: "Medical History",
    name: "medicalHistory",
    type: "textarea",
    xs: 12,
    md: 4,
  },
  {
    label: "Family History",
    name: "familyHistory",
    type: "textarea",
    xs: 12,
    md: 4,
  },
  {
    label: "Personal History",
    name: "personalHistory",
    fields: [
      {
        label: "Smoking",
        name: "smoking",
        type: "text",
        xs: 6,
        md: 4,
      },
      {
        label: "Chewing Tobacco",
        name: "chewingTobacco",
        type: "text",
        xs: 6,
        md: 4,
      },
      {
        label: "Alcohol",
        name: "alcohol",
        type: "text",
        xs: 6,
        md: 4,
      },
    ],
  },
  {
    label: "Physical Examination",
    name: "physicalExamination",
    fields: [
      {
        label: "Temprature",
        name: "temprature",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "Pulse",
        name: "pulse",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "B.P",
        name: "bp",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "CVS",
        name: "cvs",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "RS",
        name: "rs",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "Abdomen",
        name: "abdomen",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "CNS",
        name: "cns",
        type: "text",
        xs: 6,
        md: 3,
      },
      {
        label: "Others",
        name: "others",
        type: "text",
        xs: 6,
        md: 3,
      },
    ],
  },
  {
    label: "Investigation",
    name: "investigation",
    type: "textarea",
    xs: 12,
    md: 6,
  },
  {
    label: "DISCUSSION / WARD MANAGMENT",
    name: "discussion",
    type: "textarea",
    xs: 12,
    md: 6,
  },
  {
    label: "Refernces",
    name: "refernces",
    type: "text",
    xs: 12,
    md: 6,
  },
  {
    label: "Modified ECT's / Ketamine / Other Treatment",
    name: "modifiedTreatment",
    type: "text",
    xs: 12,
    md: 6,
  },
  {
    label: "LA / Deport Administered",
    name: "deportAdministered",
    type: "textarea",
    xs: 12,
    md: 6,
  },
  {
    label: "Note",
    name: "note",
    type: "textarea",
    xs: 12,
    md: 6,
  },
  {
    label: "Consultant Name",
    name: "consultantName",
    type: "text",
    xs: 12,
    md: 6,
  },
  {
    label: "MO/SMO/CMO/Consultant",
    name: "consultantSignature",
    type: "text",
    xs: 12,
    md: 6,
  },
  {
    label: "Consultant Psychologist",
    name: "consultantPsychologist",
    type: "text",
    xs: 12,
    md: 6,
  },
  {
    label: "Expiry Summary Prepared By",
    name: "summaryPreparedBy",
    type: "text",
    xs: 12,
    md: 6,
  },
];

let addPatientFields = [
  {
    label: "Name",
    name: "name",
    type: "text",
    required: true,
  },
  {
    label: "Gender",
    name: "gender",
    type: "radio",
    options: ["MALE", "FEMALE", "OTHERS"],
    required: true,
  },
  {
    label: "Date of Birth",
    name: "dateOfBirth",
    type: "date",
    required: true,
    max: (() => {
      const d = new Date();
      d.setFullYear(d.getFullYear() - 2);
      return d.toISOString().split("T")[0];
    })(),
  },
  {
    label: "Marital Status",
    name: "maritalstatus",
    type: "radio",
    options: ["MARRIED", "UNMARRID", "SEPRATED", "DIVORCED", "WIDOWED"],
  },
  {
    label: "Religion",
    name: "religion",
    type: "select",
    useReactSelect: true,
    options: [
      { value: "HINDU", label: "Hindu" },
      { value: "MUSLIM", label: "Muslim" },
      { value: "CHRISTIAN", label: "Christian" },
      { value: "SIKH", label: "Sikh" },
      { value: "BUDDHIST", label: "Buddhist" },
      { value: "JAIN", label: "Jain" },
      { value: "ZOROASTRIAN", label: "Zoroastrian / Parsi" },
      { value: "JEWISH", label: "Jewish" },
      { value: "OTHERS", label: "Others" },
    ],
  },
  {
    label: "Socio Economic Status",
    name: "socioeconomicstatus",
    type: "select",
    useReactSelect: true,
    options: [
      { value: "L", label: "L — Lower" },
      { value: "M", label: "M — Middle" },
      { value: "U", label: "U — Upper" },
    ],
  },
  {
    label: "Address",
    name: "address",
    type: "textarea",
    required: true,
  },
  {
    label: "Area Type",
    name: "areatype",
    type: "radio",
    options: ["RURAL", "CITY"],
  },
  {
    label: "Phone Number",
    name: "phoneNumber",
    type: "number",
    required: true,
  },
  {
    label: "Email",
    name: "email",
    type: "email",
  },
  {
    label: "Age",
    name: "age",
    type: "text",
  },
  // {
  //   label: "Provisional Diagnosis",
  //   name: "provisionalDiagnosis",
  //   type: "text",
  // },
  // {
  //   label: "Doctor",
  //   name: "doctor",
  //   type: "select",
  // },
  // {
  //   label: "Psychologist",
  //   name: "psychologist",
  //   type: "select",
  // },
  {
    label: "Education / Qualification",
    name: "education",
    type: "select",
    useReactSelect: true,
    options: [
      { value: "Illiterate", label: "Illiterate" },
      { value: "Primary", label: "Primary" },
      { value: "Middle School", label: "Middle School" },
      { value: "Secondary / SSC", label: "Secondary / SSC" },
      { value: "Higher Secondary / HSC", label: "Higher Secondary / HSC" },
      { value: "Diploma / ITI", label: "Diploma / ITI" },
      { value: "Graduate", label: "Graduate" },
      { value: "Post-Graduate", label: "Post-Graduate" },
      { value: "Professional", label: "Professional" },
      { value: "Doctorate", label: "Doctorate" },
      { value: "Other", label: "Other" },
    ],
  },
  {
    label: "Occupation",
    name: "occupation",
    type: "select",
    useReactSelect: true,
    options: [
      { value: "Unemployed", label: "Unemployed" },
      { value: "Student", label: "Student" },
      { value: "Homemaker", label: "Homemaker" },
      { value: "Retired", label: "Retired" },
      { value: "Self-Employed / Business", label: "Self-Employed / Business" },
      { value: "Private Sector Employee", label: "Private Sector Employee" },
      { value: "Government Employee", label: "Government Employee" },
      { value: "Skilled Labour", label: "Skilled Labour" },
      {
        value: "Unskilled / Daily Wage Labour",
        label: "Unskilled / Daily Wage Labour",
      },
      { value: "Agriculture / Farmer", label: "Agriculture / Farmer" },
      { value: "Professional", label: "Professional" },
      { value: "Armed Forces / Police", label: "Armed Forces / Police" },
      { value: "Other", label: "Other" },
    ],
  },
  {
    label: "Occupation Detail",
    name: "occupationDetail",
    type: "text",
  },
  {
    label: "Languages Known",
    name: "languagesKnown",
    type: "select",
    useReactSelect: true,
    isMulti: true,
    options: [
      { value: "Hindi", label: "Hindi" },
      { value: "English", label: "English" },
      { value: "Marathi", label: "Marathi" },
      { value: "Gujarati", label: "Gujarati" },
      { value: "Punjabi", label: "Punjabi" },
      { value: "Bengali", label: "Bengali" },
      { value: "Tamil", label: "Tamil" },
      { value: "Telugu", label: "Telugu" },
      { value: "Kannada", label: "Kannada" },
      { value: "Malayalam", label: "Malayalam" },
      { value: "Odia", label: "Odia" },
      { value: "Urdu", label: "Urdu" },
      { value: "Konkani", label: "Konkani" },
      { value: "Other", label: "Other" },
    ],
  },
];

const patientGuradianFields = [
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
  //   label: "Date Of Addmission",
  //   name: "dateOfAddmission",
  //   type: "date",
  // },
  // {
  //   label: "Referred By",
  //   name: "referredBy",
  //   type: "text",
  //   required: true,
  // },
  // {
  //   label: "IPD File Number",
  //   name: "ipdFileNumber",
  //   type: "text",
  //   required: false,
  // },
];

//PATIENT TYPES
const ALL_PATIENTS = "ALL_PATIENTS";
const ADMIT_PATIENTS = "ADMIT_PATIENTS";
const DISCHARGE_PATIENTS = "DISCHARGE_PATIENTS";
const OPD_PATIENTS = "OPD_PATIENTS";
export const MY_PATIENTS = "MY_PATIENTS";

// Role `value` from Settings → User Roles. A Visiting Consultant sees only the
// My Patients tab on the patient page and has no top-bar patient search.
export const VISITING_CONSULTANT_ROLE = "VISITING_CONSULTANT";

// Gender sub-filter shown under the sidebar tabs. Icon-only to match the tab row
// above it, with the label surfaced as a tooltip.
//
// There is no explicit "All" option: clicking the active icon clears it back to
// no filter (gender = null), which axios then omits from the request entirely, so
// an unfiltered list is byte-identical to what it was before this filter existed.
//
// Values match the Gender radio options on the patient form (MALE / FEMALE /
// OTHERS). OTHERS and blank-gender records are deliberately only reachable with
// the filter cleared.
export const PATIENT_GENDER_FILTERS = [
  {
    key: "MALE",
    label: "Male",
    icon: "ri-men-line",
    iconActive: "ri-men-fill",
  },
  {
    key: "FEMALE",
    label: "Female",
    icon: "ri-women-line",
    iconActive: "ri-women-fill",
  },
];

//PATIENT LOG
const CREATED = "CREATED";
const ADMITTED = "ADMITTED";
const DISCHARGED = "DISCHARGED";
const DELETED = "DELETED";
const RESTORED = "RESTORED";
const SWITCHED_CENTER = "SWITCHED_CENTER";

const timelineFilters = [
  // {
  //   label: "All",
  //   name: "ALL",
  // },
  {
    label: "Basic",
    name: "PATIENT",
  },
  {
    label: "Status",
    name: "PATIENT_STATUS",
  },
  {
    label: "Chart",
    name: "PATIENT_CHART",
  },
  {
    label: "Bill",
    name: "PATIENT_BILL",
  },
  {
    label: "Clinical_test",
    name: "PATIENT_CLINICAL_TEST",
  },
  // Appointment logs. Every appointment controller (add, addwebsite, edit,
  // cancel, deletePermanently, editPatientAppointment) writes its log with
  // `relation: BOOKING`, but the patient timeline endpoint matches on
  // `relation: { $in: filter }` — so without an entry here the client never
  // asks for them and they were silently dropped from the timeline.
  {
    label: "Appointment",
    name: "BOOKING",
  },
];

const InternTimelineFilter = [
  {
    label: "Basic",
    name: "INTERN",
  },
  {
    label: "Intern",
    name: "UPDATED_INTERN_FORM",
  },
  {
    label: "delete_Intern",
    name: "DELETE_INTERN",
  },
  {
    label: "InternReceipt",
    name: "INTERN_RECEIPT",
  },
];

const categoryUnitOptions = {
  "2d echo charges": [{ label: "Nos", value: "nos" }],
  "ac charges": [
    { label: "Days", value: "days" },
    { label: "Month", value: "month" },
  ],
  "airbed charges": [{ label: "Nos", value: "nos" }],
  "ambulance charges": [{ label: "Nos", value: "nos" }],
  "attendant/care taker charges": [
    { label: "Days", value: "days" },
    { label: "Month", value: "month" },
  ],
  "bio medical waste charges": [{ label: "Nos", value: "nos" }],
  "bsl charges": [{ label: "Nos", value: "nos" }],
  "ct scan": [{ label: "Nos", value: "nos" }],
  "diaper charges": [
    { label: "Nos", value: "nos" },
    { label: "Pkt", value: "pkt" },
  ],
  "medical consumables": [{ label: "Nos", value: "nos" }],
  "discharge medicines": [
    { label: "Nos", value: "nos" },
    { label: "Strips", value: "strips" },
  ],
  "doctor consultation charges": [{ label: "Nos", value: "nos" }],
  "doppler charges": [{ label: "Nos", value: "nos" }],
  "dressing charges": [{ label: "Nos", value: "nos" }],
  "drug test": [{ label: "Nos", value: "nos" }],
  "ecg charges": [{ label: "Nos", value: "nos" }],
  "ect charges": [{ label: "Nos", value: "nos" }],
  "emergency charges": [{ label: "Nos", value: "nos" }],
  "emergency hospital charges": [{ label: "Nos", value: "nos" }],
  enema: [{ label: "Nos", value: "nos" }],
  "extra food charges": [{ label: "Nos", value: "nos" }],
  "hospital charges": [{ label: "Nos", value: "nos" }],
  injectables: [{ label: "Nos", value: "nos" }],
  "mrd charges": [{ label: "Nos", value: "nos" }],
  "mri charges": [{ label: "Nos", value: "nos" }],
  "nebulisation charges": [{ label: "Nos", value: "nos" }],
  "nursing charges": [
    { label: "Days", value: "days" },
    { label: "Month", value: "month" },
  ],
  "opd consultation charges": [{ label: "Nos", value: "nos" }],
  "other charges": [{ label: "Nos", value: "nos" }],
  medicines: [
    { label: "Nos", value: "nos" },
    { label: "Strips", value: "strips" },
  ],
  "physiotherapy charges": [{ label: "Nos", value: "nos" }],
  "procedure charges": [{ label: "Nos", value: "nos" }],
  "psychological counselling": [{ label: "Nos", value: "nos" }],
  "psychological test": [{ label: "Nos", value: "nos" }],
  refund: [{ label: "Nos", value: "nos" }],
  "registration charges": [{ label: "Nos", value: "nos" }],
  "room charges": [
    { label: "Days", value: "days" },
    { label: "Month", value: "month" },
  ],
  "sleep study charges": [{ label: "Nos", value: "nos" }],
  "travel expenses": [{ label: "Nos", value: "nos" }],
  "upt charges": [{ label: "Nos", value: "nos" }],
  "usg charges": [{ label: "Nos", value: "nos" }],
  "x-ray charges": [{ label: "Nos", value: "nos" }],
  "lab charges": [{ label: "Nos", value: "nos" }],
  "music therapy": [{ label: "Nos", value: "nos" }],
  // Default options for any uncategorized items
  default: [
    { label: "Nos", value: "nos" },
    { label: "Days", value: "days" },
    { label: "Month", value: "month" },
    { label: "Pkt", value: "pkt" },
    { label: "Strips", value: "strips" },
  ],
};

const belongingsData = [
  {
    category: "Clothing",
    belongings: "Clothes (General)",
    allowed_with_patient: "Yes",
    associated_risk: "Low",
    searchIndex: "clothing clothes (general) yes low",
  },
  {
    category: "Clothing",
    belongings: "Socks",
    allowed_with_patient: "Yes",
    associated_risk: "Low",
    searchIndex: "clothing socks yes low",
  },
  {
    category: "Clothing",
    belongings: "Undergarments",
    allowed_with_patient: "Yes",
    associated_risk: "Low",
    searchIndex: "clothing undergarments yes low",
  },
  {
    category: "Clothing",
    belongings: "Slip-on Shoes",
    allowed_with_patient: "Yes",
    associated_risk: "Low",
    searchIndex: "clothing slip-on shoes yes low",
  },
  {
    category: "Clothing",
    belongings: "Sneakers / Sports Shoes",
    allowed_with_patient: "Yes",
    associated_risk: "Low",
    searchIndex: "clothing sneakers / sports shoes yes low",
  },
  {
    category: "Clothing",
    belongings: "Slippers (No Laces)",
    allowed_with_patient: "Yes",
    associated_risk: "Low",
    searchIndex: "clothing slippers (no laces) yes low",
  },
  {
    category: "Clothing",
    belongings: "Towel",
    allowed_with_patient: "Yes",
    associated_risk: "Low",
    searchIndex: "clothing towel yes low",
  },
  {
    category: "Clothing",
    belongings: "Belt (Leather/Fabric/Metal)",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "clothing belt (leather/fabric/metal) no high",
  },
  {
    category: "Clothing",
    belongings: "Dupatta",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "clothing dupatta no high",
  },
  {
    category: "Clothing",
    belongings: "Scarves/Stoles",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "clothing scarves/stoles no high",
  },
  {
    category: "Clothing",
    belongings: "Saree (High Risk Ward)",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "clothing saree (high risk ward) no high",
  },
  {
    category: "Clothing",
    belongings: "Long Shawls",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "clothing long shawls no high",
  },
  {
    category: "Clothing",
    belongings: "Drawstrings (Hoodies/Pyjamas)",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "clothing drawstrings (hoodies/pyjamas) no high",
  },
  {
    category: "Clothing",
    belongings: "Shoe Laces",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "clothing shoe laces no high",
  },
  {
    category: "Clothing",
    belongings: "Yoga Strap / Exercise Bands",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "clothing yoga strap / exercise bands no high",
  },
  {
    category: "Clothing",
    belongings: "Ropes / Strings / Cords",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "clothing ropes / strings / cords no high",
  },
  {
    category: "Electronics",
    belongings: "Mobile Phone",
    allowed_with_patient: "Conditional",
    associated_risk: "Moderate",
    searchIndex: "electronics mobile phone conditional moderate",
  },
  {
    category: "Electronics",
    belongings: "Chargers",
    allowed_with_patient: "Supervised Charging",
    associated_risk: "Moderate",
    searchIndex: "electronics chargers supervised charging moderate",
  },
  {
    category: "Electronics",
    belongings: "Charging Cable",
    allowed_with_patient: "Nursing Custody",
    associated_risk: "High",
    searchIndex: "electronics charging cable nursing custody high",
  },
  {
    category: "Electronics",
    belongings: "Electrical Wires",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "electronics electrical wires no high",
  },
  {
    category: "Electronics",
    belongings: "Earphone Wire",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "electronics earphone wire no high",
  },
  {
    category: "Electronics",
    belongings: "Extension Cable",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "electronics extension cable no high",
  },
  {
    category: "Electronics",
    belongings: "Iron Box",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "electronics iron box no high",
  },
  {
    category: "Electronics",
    belongings: "Power Bank",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "electronics power bank no high",
  },
  {
    category: "Electronics",
    belongings: "Aerosol Sprays",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "electronics aerosol sprays no high",
  },
  {
    category: "Restricted",
    belongings: "Scissors",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "restricted scissors no high",
  },
  {
    category: "Restricted",
    belongings: "Razors/Shaving Blade",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "restricted razors/shaving blade no high",
  },
  {
    category: "Restricted",
    belongings: "Nail Cutter",
    allowed_with_patient: "Supervised",
    associated_risk: "Moderate",
    searchIndex: "restricted nail cutter supervised moderate",
  },
  {
    category: "Restricted",
    belongings: "Nail Filer",
    allowed_with_patient: "Supervised",
    associated_risk: "Moderate",
    searchIndex: "restricted nail filer supervised moderate",
  },
  {
    category: "Restricted",
    belongings: "Safety Pins",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "restricted safety pins no high",
  },
  {
    category: "Restricted",
    belongings: "Sewing Needles",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "restricted sewing needles no high",
  },
  {
    category: "Restricted",
    belongings: "Knitting Needles",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "restricted knitting needles no high",
  },
  {
    category: "Restricted",
    belongings: "Knives (Any Size)",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "restricted knives (any size) no high",
  },
  {
    category: "Restricted",
    belongings: "Pencil Sharpeners",
    allowed_with_patient: "Nursing Custody",
    associated_risk: "Moderate",
    searchIndex: "restricted pencil sharpeners nursing custody moderate",
  },
  {
    category: "Restricted",
    belongings: "Compass / Divider",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "restricted compass / divider no high",
  },
  {
    category: "Restricted",
    belongings: "Metal Ruler",
    allowed_with_patient: "No",
    associated_risk: "Moderate",
    searchIndex: "restricted metal ruler no moderate",
  },
  {
    category: "Medication",
    belongings: "Personal Medicines",
    allowed_with_patient: "Pharmacy/Nursing Custody",
    associated_risk: "High",
    searchIndex: "medication personal medicines pharmacy/nursing custody high",
  },
  {
    category: "Medication",
    belongings: "Psychiatric Medication",
    allowed_with_patient: "Pharmacy Custody",
    associated_risk: "High",
    searchIndex: "medication psychiatric medication pharmacy custody high",
  },
  {
    category: "Medication",
    belongings: "Alcohol Syrups",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "medication alcohol syrups no high",
  },
  {
    category: "Medication",
    belongings: "Inhalers",
    allowed_with_patient: "Nursing Custody",
    associated_risk: "Moderate",
    searchIndex: "medication inhalers nursing custody moderate",
  },
  {
    category: "Medication",
    belongings: "Nicotine Patch",
    allowed_with_patient: "Conditional (Prescription Only)",
    associated_risk: "Moderate",
    searchIndex:
      "medication nicotine patch conditional (prescription only) moderate",
  },
  {
    category: "Chemicals",
    belongings: "Mosquito Repellent Liquid",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "chemicals mosquito repellent liquid no high",
  },
  {
    category: "Chemicals",
    belongings: "Phenyl Bottle",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "chemicals phenyl bottle no high",
  },
  {
    category: "Chemicals",
    belongings: "Hand Sanitizer",
    allowed_with_patient: "Supervised Only",
    associated_risk: "Moderate",
    searchIndex: "chemicals hand sanitizer supervised only moderate",
  },
  {
    category: "Chemicals",
    belongings: "Solvents/Glue/Whitener",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "chemicals solvents/glue/whitener no high",
  },
  {
    category: "Toiletries",
    belongings: "Toothbrush",
    allowed_with_patient: "Yes",
    associated_risk: "Low",
    searchIndex: "toiletries toothbrush yes low",
  },
  {
    category: "Toiletries",
    belongings: "Toothpaste",
    allowed_with_patient: "Yes",
    associated_risk: "Low",
    searchIndex: "toiletries toothpaste yes low",
  },
  {
    category: "Toiletries",
    belongings: "Shampoo",
    allowed_with_patient: "Yes",
    associated_risk: "Low",
    searchIndex: "toiletries shampoo yes low",
  },
  {
    category: "Toiletries",
    belongings: "Soap",
    allowed_with_patient: "Yes",
    associated_risk: "Low",
    searchIndex: "toiletries soap yes low",
  },
  {
    category: "Toiletries",
    belongings: "Conditioner",
    allowed_with_patient: "Yes",
    associated_risk: "Low",
    searchIndex: "toiletries conditioner yes low",
  },
  {
    category: "Toiletries",
    belongings: "Comb (Plastic Only)",
    allowed_with_patient: "Yes",
    associated_risk: "Low",
    searchIndex: "toiletries comb (plastic only) yes low",
  },
  {
    category: "Toiletries",
    belongings: "Feminine Hygiene Products",
    allowed_with_patient: "Yes",
    associated_risk: "Low",
    searchIndex: "toiletries feminine hygiene products yes low",
  },
  {
    category: "Cosmetics",
    belongings: "Nail Polish",
    allowed_with_patient: "No",
    associated_risk: "Moderate",
    searchIndex: "cosmetics nail polish no moderate",
  },
  {
    category: "Cosmetics",
    belongings: "Nail Polish Remover",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "cosmetics nail polish remover no high",
  },
  {
    category: "Cosmetics",
    belongings: "Perfume Glass Bottle",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "cosmetics perfume glass bottle no high",
  },
  {
    category: "Cosmetics",
    belongings: "Deodorant Spray",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "cosmetics deodorant spray no high",
  },
  {
    category: "Restricted",
    belongings: "Ceramic Crockery",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "restricted ceramic crockery no high",
  },
  {
    category: "Restricted",
    belongings: "Glass Crockery",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "restricted glass crockery no high",
  },
  {
    category: "Restricted",
    belongings: "Mirrors (Glass)",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "restricted mirrors (glass) no high",
  },
  {
    category: "Restricted",
    belongings: "Glass Photo Frames",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "restricted glass photo frames no high",
  },
  {
    category: "Addiction Risk",
    belongings: "Matchboxes",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "addiction risk matchboxes no high",
  },
  {
    category: "Addiction Risk",
    belongings: "Lighters",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "addiction risk lighters no high",
  },
  {
    category: "Addiction Risk",
    belongings: "Cigarettes",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "addiction risk cigarettes no high",
  },
  {
    category: "Addiction Risk",
    belongings: "Tobacco Products",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "addiction risk tobacco products no high",
  },
  {
    category: "Addiction Risk",
    belongings: "Vape / E Cigarette",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "addiction risk vape / e cigarette no high",
  },
  {
    category: "Addiction Risk",
    belongings: "Alcohol (Any Form)",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "addiction risk alcohol (any form) no high",
  },
  {
    category: "Tools",
    belongings: "Screwdrivers",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "tools screwdrivers no high",
  },
  {
    category: "Tools",
    belongings: "Hammer",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "tools hammer no high",
  },
  {
    category: "Tools",
    belongings: "Dumbbells",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "tools dumbbells no high",
  },
  {
    category: "Tools",
    belongings: "Umbrella (Metal Tip)",
    allowed_with_patient: "No",
    associated_risk: "Moderate",
    searchIndex: "tools umbrella (metal tip) no moderate",
  },
  {
    category: "Documents",
    belongings: "Books",
    allowed_with_patient: "Yes",
    associated_risk: "Low",
    searchIndex: "documents books yes low",
  },
  {
    category: "Documents",
    belongings: "Notebook / Journal",
    allowed_with_patient: "Yes (No Metal Binding)",
    associated_risk: "Low",
    searchIndex: "documents notebook / journal yes (no metal binding) low",
  },
  {
    category: "Documents",
    belongings: "Papers",
    allowed_with_patient: "Yes",
    associated_risk: "Low",
    searchIndex: "documents papers yes low",
  },
  {
    category: "Elder Care",
    belongings: "Hearing Aid",
    allowed_with_patient: "Yes",
    associated_risk: "Low",
    searchIndex: "elder care hearing aid yes low",
  },
  {
    category: "Elder Care",
    belongings: "Eyeglasses",
    allowed_with_patient: "Yes",
    associated_risk: "Low",
    searchIndex: "elder care eyeglasses yes low",
  },
  {
    category: "Elder Care",
    belongings: "Prescribed Medication",
    allowed_with_patient: "Nursing Administered",
    associated_risk: "Moderate",
    searchIndex:
      "elder care prescribed medication nursing administered moderate",
  },
  {
    category: "Food Storage",
    belongings: "Plastic Bottle (Oil etc.)",
    allowed_with_patient: "Yes",
    associated_risk: "Low",
    searchIndex: "food storage plastic bottle (oil etc.) yes low",
  },
  {
    category: "Food",
    belongings: "Alcohol Containing Food",
    allowed_with_patient: "No",
    associated_risk: "High",
    searchIndex: "food alcohol containing food no high",
  },
  {
    category: "Other",
    belongings: "",
    allowed_with_patient: "To be assessed case by case",
    associated_risk: "TBD",
    searchIndex: "other  to be assessed case by case tbd",
  },
];

export {
  //PATIENT STATUS
  ADMIT_PATIENT,
  DISCHARGE_PATIENT,
  EDIT_ADMISSION,
  //PATIENT VIEWS
  FORMS_VIEW,
  CHARTING_VIEW,
  BILLING_VIEW,
  TIMELINE_VIEW,
  OPD_VIEW,
  BELONGINGS_VIEW,
  //INVOICE CATEGORIES
  categoryUnitOptions,
  //PATIENT CHARTS
  PRESCRIPTION,
  VITAL_SIGN,
  CLINICAL_NOTE,
  COUNSELLING_NOTE,
  LAB_REPORT,
  PROCEDURE,
  RELATIVE_VISIT,
  OUTPASS,
  DISCHARGE_SUMMARY,
  EXPIRY_SUMMARY,
  DETAIL_ADMISSION,
  MENTAL_EXAMINATION,
  MENTAL_EXAMINATION_V2,
  ROUND_NOTE,
  INPUT_OUTPUT,
  NURSE_SOS_PROCEDURE,
  INJURY_MARKS,
  ECT_SESSION,
  ADMISSION_TYPE,
  MEDICINE_GIVEN,
  //PATIENT BILLS
  INVOICE,
  ADVANCE_PAYMENT,
  DEPOSIT,
  REFUND,
  //PATIENT CHECKUP TYPES
  OPD,
  IPD,
  CLINIC_TEST,
  CURRENT_MEDICINES,
  //PATIENT ADVANCE PAYMENT OPTIONS
  CASH,
  CARD,
  CHEQUE,
  BANK,
  UPI,
  //PATIENT CHARTS
  records,
  //Test Record
  testRecord,
  //PATIENT CHARTS FORMS FIELDS
  prescriptionFormFields,
  vitalSignFields,
  inputOutputColumns,
  nurseSosActivityTypes,
  clinicalNoteFields,
  mentalExaminationFields,
  mentalExaminationV2Fields,
  elderlyFunctionalChecklistFields,
  counsellingNoteFields,
  relativeVisitFields,
  outpassFields,
  dischargeSummaryFields,
  expirySummaryFields,
  ectSessionSections,
  admissionTypeFields,
  admissionTypeBranchFields,
  INDEPENDENT_ADMISSION,
  SUPPORTIVE_ADMISSION,
  EMERGENCY_ADMISSION,
  //PATIENT FIELDS
  addPatientFields,
  patientGuradianFields,
  //PATIENT TYPES
  ALL_PATIENTS,
  ADMIT_PATIENTS,
  DISCHARGE_PATIENTS,
  OPD_PATIENTS,
  //PATIENT LOG
  CREATED,
  ADMITTED,
  DISCHARGED,
  DELETED,
  RESTORED,
  SWITCHED_CENTER,
  //TIMELINE FILTER
  timelineFilters,
  INTERN,
  InternTimelineFilter,
  Forms,
  belongingsData,
};

export const NATIONALITIES = [
  "Afghan",
  "Albanian",
  "Algerian",
  "American",
  "Andorran",
  "Angolan",
  "Antiguans",
  "Argentinean",
  "Armenian",
  "Australian",
  "Austrian",
  "Azerbaijani",
  "Bahamian",
  "Bahraini",
  "Bangladeshi",
  "Barbadian",
  "Barbudans",
  "Batswana",
  "Belarusian",
  "Belgian",
  "Belizean",
  "Beninese",
  "Bhutanese",
  "Bolivian",
  "Bosnian",
  "Brazilian",
  "British",
  "Bruneian",
  "Bulgarian",
  "Burkinabe",
  "Burmese",
  "Burundian",
  "Cambodian",
  "Cameroonian",
  "Canadian",
  "Cape Verdean",
  "Central African",
  "Chadian",
  "Chilean",
  "Chinese",
  "Colombian",
  "Comoran",
  "Congolese",
  "Costa Rican",
  "Croatian",
  "Cuban",
  "Cypriot",
  "Czech",
  "Danish",
  "Djibouti",
  "Dominican",
  "Dutch",
  "East Timorese",
  "Ecuadorean",
  "Egyptian",
  "Emirian",
  "Equatorial Guinean",
  "Eritrean",
  "Estonian",
  "Ethiopian",
  "Fijian",
  "Filipino",
  "Finnish",
  "French",
  "Gabonese",
  "Gambian",
  "Georgian",
  "German",
  "Ghanaian",
  "Greek",
  "Grenadian",
  "Guatemalan",
  "Guinea-Bissauan",
  "Guinean",
  "Guyanese",
  "Haitian",
  "Herzegovinian",
  "Honduran",
  "Hungarian",
  "I-Kiribati",
  "Icelander",
  "Indian",
  "Indonesian",
  "Iranian",
  "Iraqi",
  "Irish",
  "Israeli",
  "Italian",
  "Ivorian",
  "Jamaican",
  "Japanese",
  "Jordanian",
  "Kazakhstani",
  "Kenyan",
  "Kittitian",
  "Kuwaiti",
  "Kyrgyz",
  "Laotian",
  "Latvian",
  "Lebanese",
  "Liberian",
  "Libyan",
  "Liechtensteiner",
  "Lithuanian",
  "Luxembourger",
  "Macedonian",
  "Malagasy",
  "Malawian",
  "Malaysian",
  "Maldivian",
  "Malian",
  "Maltese",
  "Marshallese",
  "Mauritanian",
  "Mauritian",
  "Mexican",
  "Micronesian",
  "Moldovan",
  "Monacan",
  "Mongolian",
  "Moroccan",
  "Mosotho",
  "Motswana",
  "Mozambican",
  "Namibian",
  "Nauruan",
  "Nepalese",
  "New Zealander",
  "Nicaraguan",
  "Nigerian",
  "Nigerien",
  "North Korean",
  "Northern Irish",
  "Norwegian",
  "Omani",
  "Pakistani",
  "Palauan",
  "Panamanian",
  "Papua New Guinean",
  "Paraguayan",
  "Peruvian",
  "Polish",
  "Portuguese",
  "Qatari",
  "Romanian",
  "Russian",
  "Rwandan",
  "Saint Lucian",
  "Salvadoran",
  "Samoan",
  "San Marinese",
  "Sao Tomean",
  "Saudi",
  "Scottish",
  "Senegalese",
  "Serbian",
  "Seychellois",
  "Sierra Leonean",
  "Singaporean",
  "Slovakian",
  "Slovenian",
  "Solomon Islander",
  "Somali",
  "South African",
  "South Korean",
  "Spanish",
  "Sri Lankan",
  "Sudanese",
  "Surinamer",
  "Swazi",
  "Swedish",
  "Swiss",
  "Syrian",
  "Taiwanese",
  "Tajik",
  "Tanzanian",
  "Thai",
  "Togolese",
  "Tongan",
  "Trinidadian or Tobagonian",
  "Tunisian",
  "Turkish",
  "Tuvaluan",
  "Ugandan",
  "Ukrainian",
  "Uruguayan",
  "Uzbekistani",
  "Venezuelan",
  "Vietnamese",
  "Welsh",
  "Yemenite",
  "Zambian",
  "Zimbabwean",
].map((n) => ({ value: n, label: n }));
