const toSelectOptions = (arr) => arr.map((v) => ({ value: v, label: v }));

export const VALUELESS_OPERATORS = new Set(["EXISTS", "NOT_EXISTS"]);
export const TRIGGER_OPTIONS = toSelectOptions(["IMMEDIATE", "DELAYED"]);
export const SEVERITY_OPTIONS = toSelectOptions([
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);
export const ADMISSION_TYPE_OPTIONS = [
  { value: "IPD", label: "IPD" },
  { value: "OPD", label: "OPD" },
  { value: "BOTH", label: "Both" },
];
export const GENDER_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Both", label: "Both" },
];
export const TARGET_OPTIONS = [
  // value stays "Addmission" — the persisted model name has a legacy typo in the
  // DB; only the display label is corrected here.
  { value: "Addmission", label: "Admission" },
  ...toSelectOptions([
    "Patient",
    "VitalSign",
    "Prescription",
    "DetailAdmission",
    "ciwaTest",
    "ramsaySedationTest",
    "morseTest",
    "glasgowTest",
    "LabReport",
  ]),
  { value: "ClinicalNote", label: "Clinical Note" },
  { value: "MentalExamination", label: "Mental Status Examination" },
  { value: "CounsellingNote", label: "Counselling Note" },
  // Clinical-test family
  { value: "ybocTest", label: "Y-BOCS Test" },
  { value: "SSRSTest", label: "C-SSRS Test" },
  { value: "ymrsTest", label: "YMRS Test" },
  { value: "hamdTest", label: "HAM-D Test" },
  { value: "hamaTest", label: "HAM-A Test" },
  { value: "mpqTest", label: "MPQ Test" },
  { value: "acdsTest", label: "ACDS Test" },
  { value: "MMSETest", label: "MMSE Test" },
  { value: "panssTest", label: "PANSS Test" },
  { value: "clinicalTest", label: "Clinical Test" },
  { value: "rorTest", label: "Rorschach Test" },
  { value: "cowsTest", label: "COWS Test" },
  { value: "auditTest", label: "AUDIT Test" },
  { value: "cgisTest", label: "CGI-S Test" },
  { value: "ciwaBTest", label: "CIWA-B Test" },
  // Centre licence register — not a patient model. A rule that uses it uses
  // nothing else; it alerts N days before a licence's Valid till date.
  { value: "Compliance", label: "Compliance (centre licences)" },
];
export const OPERATOR_OPTIONS = [
  ...[
    "GREATER_THAN",
    "LESS_THAN",
    "GREATER_THAN_OR_EQUAL",
    "LESS_THAN_OR_EQUAL",
    "EQUALS",
    "NOT_EQUALS",
    "EXISTS",
    "NOT_EXISTS",
    "ARRAY_ANY_MATCHES",
  ].map((op) => ({ value: op, label: op.replace(/_/g, " ") })),
  // Relative-date operators (Date fields). Value is a number of days / hours;
  // passes when the field is older than that from now.
  { value: "OLDER_THAN_DAYS", label: "Older than (days)" },
  { value: "OLDER_THAN_HOURS", label: "Older than (hours)" },
  // Age band: value [from, to] hours, passes when from <= age < to — tiers with
  // an upper bound ("< 24 h", "24-72 h") that don't overlap.
  { value: "AGE_BETWEEN_HOURS", label: "Age between (hours)" },
  // Streak-based operator for discontinuation rules. Fires when the last N
  // assessments all score below the threshold.
  { value: "CONSECUTIVE_LOW", label: "Consecutive low (discontinue)" },
  // Trend operator. Splits the admission into successive periods counted from
  // the admission date and compares the first and last reading in each.
  { value: "CHANGE_OVER_PERIOD", label: "Changed over period (trend)" },
  // Compliance only: Valid till, N days before. The days are the condition's
  // `alertDaysBefore`, not its value.
  { value: "DAYS_BEFORE", label: "Days before (alert)" },
];

// --- Compliance (centre licence) rules ---------------------------------------
// Mirrors the server's src/constants/sopCompliance.js.

export const COMPLIANCE_MODEL = "Compliance";
export const DAYS_BEFORE_OPERATOR = "DAYS_BEFORE";
export const ALERT_DAYS_BEFORE_MAX = 365;

// Quick picks for the "Alert firing day(s)" input; any 0–365 can be typed.
export const alertDaysBeforeLabel = (n) =>
  Number(n) === 0 ? "On expiry day" : `${n} days before`;
export const ALERT_DAYS_BEFORE_OPTIONS = [90, 60, 30, 15, 7, 1, 0].map((n) => ({
  value: n,
  label: alertDaysBeforeLabel(n),
}));

// Placeholders a compliance block's alert template can use.
export const COMPLIANCE_TEMPLATE_HINT =
  "{centre} · {complianceType} · {licenceNumber} · {validTill} · {daysLeft}";

/** True when any condition (UI shape, model = option) is on Compliance. */
export const hasComplianceCondition = (conditions = []) =>
  conditions.some((c) => c?.model?.value === COMPLIANCE_MODEL);

// --- CHANGE_OVER_PERIOD side-car options -------------------------------------
// The threshold is always entered as a positive number; `direction` carries the
// sign and `comparator` is applied to the magnitude of the change.

export const CHANGE_DIRECTION_OPTIONS = [
  { value: "EITHER", label: "Changed" },
  { value: "GAIN", label: "Increased" },
  { value: "LOSS", label: "Decreased" },
];

export const CHANGE_COMPARATOR_OPTIONS = [
  { value: "GREATER_THAN_OR_EQUAL", label: "by at least (\u2265)" },
  { value: "GREATER_THAN", label: "by more than (>)" },
  { value: "LESS_THAN_OR_EQUAL", label: "by at most (\u2264)" },
  { value: "LESS_THAN", label: "by less than (<)" },
  { value: "BETWEEN", label: "by between" },
];

// ABSOLUTE compares the raw change (kg for weight); PERCENT compares it against
// the period's first reading.
export const CHANGE_UNIT_OPTIONS = [
  { value: "ABSOLUTE", label: "kg / units" },
  { value: "PERCENT", label: "%" },
];

// Period length unit. Mirrors PER_DAYS on the server ({ DAY:1, WEEK:7,
// MONTH:30 }) — keep the two in step.
export const CHANGE_PERIOD_UNIT_OPTIONS = [
  { value: "DAY", label: "day(s)" },
  { value: "WEEK", label: "week(s)" },
  { value: "MONTH", label: "month(s)" },
];

// Target conditions on these models are STATE checks: the 02:00 sweep reads the
// live admission / patient record and alerts while the condition holds — it
// never uses a Cycle / Deadline / Grace schedule or the discontinue gate, so the
// editor hides those and doesn't save them.
export const STATE_CHECK_MODELS = new Set(["Addmission", "Patient"]);
// State checks that alert once per admission rather than once a day.
export const ONCE_PER_ADMISSION_FIELDS = new Set([
  "patientCategory",
  "provisional_diagnosis",
]);
export const isStateCheckCondition = (c) =>
  c?.triggerType?.value === "DELAYED" && STATE_CHECK_MODELS.has(c?.model?.value);

// Operators whose value editor is a plain number (of days / hours) against a
// Date field, mapped to that unit.
export const RELATIVE_AGE_OPERATORS = new Map([
  ["OLDER_THAN_DAYS", "days"],
  ["OLDER_THAN_HOURS", "hours"],
]);

export const OPERATORS_BY_TYPE = {
  Number: [
    "GREATER_THAN",
    "LESS_THAN",
    "GREATER_THAN_OR_EQUAL",
    "LESS_THAN_OR_EQUAL",
    "EQUALS",
    "NOT_EQUALS",
    "CONSECUTIVE_LOW",
    "CHANGE_OVER_PERIOD",
  ],
  Date: [
    "GREATER_THAN",
    "LESS_THAN",
    "GREATER_THAN_OR_EQUAL",
    "LESS_THAN_OR_EQUAL",
    "EXISTS",
    "NOT_EXISTS",
    "OLDER_THAN_DAYS",
    "OLDER_THAN_HOURS",
    "AGE_BETWEEN_HOURS",
  ],
  Boolean: ["EQUALS", "NOT_EQUALS", "EXISTS", "NOT_EXISTS"],
  Array: ["EQUALS", "NOT_EQUALS", "EXISTS", "NOT_EXISTS"],
  String: ["EQUALS", "NOT_EQUALS", "EXISTS", "NOT_EXISTS"],
  // Synthetic type emitted by the server for the LabReport flagged-items
  // field. Only one operator is meaningful here and the value editor is a
  // bespoke "test name + severity threshold" pair handled in ConditionRow.
  FlaggedItemArray: ["ARRAY_ANY_MATCHES"],
  // Synthetic type for Addmission.patientCategory — a derived patient-group
  // filter (ADDICTION / PSYCHIATRY) the server resolves from the patient's ICD
  // codes. The value is a category id, so only equality applies; the dropdown
  // itself comes from the field's `options` metadata, not from here.
  PatientCategory: ["EQUALS", "NOT_EQUALS"],
  // Synthetic type for Addmission.admissionSupportType — the admission form's
  // supported-admission window (up to 30 days / beyond 30 days), resolved by the
  // server from the newest uploaded form. EXISTS/NOT_EXISTS are kept so a rule
  // can target admissions whose form type was never recorded. The dropdown comes
  // from the field's `options` metadata, not from here.
  AdmissionSupportType: ["EQUALS", "NOT_EQUALS", "EXISTS", "NOT_EXISTS"],
  // Synthetic type for Addmission.detailAdmissionPatientType — the Patient Type
  // on the admission's latest Detail Admission chart (Psychiatric / Addiction /
  // Geriatric), resolved by the server. A missing type counts as "not" any
  // type, so "NOT_EQUALS Geriatric" still lets an untyped admission through.
  // The dropdown comes from the field's `options` metadata, not from here.
  DetailAdmissionPatientType: ["EQUALS", "NOT_EQUALS"],
  // Synthetic types for the Compliance model. Valid till takes only "Days
  // before" (with the firing-day picker); type / category are dropdowns from
  // the field's `options` metadata.
  ComplianceExpiry: ["DAYS_BEFORE"],
  ComplianceRef: ["EQUALS", "NOT_EQUALS"],
};

// Field types that only mean something in Satisfying Criteria. ConditionRow
// hides them from target-block rows; the server refuses them there too.
export const CRITERIA_ONLY_FIELD_TYPES = new Set(["DetailAdmissionPatientType"]);

// …and the reverse: Valid till only means something in a target block (it is
// what fires the alert). MainBlock hides it; the server refuses it there too.
export const TARGET_ONLY_FIELD_TYPES = new Set(["ComplianceExpiry"]);

// Severity threshold dropdown for LabReport flagged-items conditions.
// "Very Low" intentionally omitted — the server's severityRank treats it as
// equivalent to "Very High" at evaluation time.
// LabReport flagged-items severity options. Plain values match that severity
// EXACTLY; the "… and above" values match that level and anything of higher
// concern (the server parses the " and above" suffix). Ordered so each range
// option sits right after its base for intuitive scanning.
export const SEVERITY_THRESHOLD_OPTIONS = [
  { value: "Normal", label: "Normal" },
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "Medium and above", label: "Medium and above" },
  { value: "High", label: "High" },
  { value: "High and above", label: "High and above" },
  { value: "Very High", label: "Very High" },
];

// Wildcard test sentinel for LabReport flagged-items conditions. Selecting it
// stores arrayMatch.keyValue = "*", which the server evaluates as "match ANY
// flagged test" — i.e. fire if any test meets the severity threshold. Must
// stay in sync with ANY_LAB_TEST in the server's labTestCatalogue.js.
export const ANY_LAB_TEST = "*";
export const ANY_LAB_TEST_OPTION = {
  value: ANY_LAB_TEST,
  label: "⚡ Any test (wildcard)",
};

export const BOOLEAN_OPTIONS = [
  { value: true, label: "True" },
  { value: false, label: "False" },
];

// Period drives how the cron expands a DELAYED condition into checkpoints:
//   - DEADLINE   : due at admission + `intervalHours`. Alerts once (repeat
//                  "ONCE") or every 24 h until done ("DAILY"); optionally also
//                  checked every 3 hours (checkEvery3Hours), not only at 2 AM.
//   - CONTINUOUS : every `intervalHours` from admission until discharge/now.
//   - DAYS       : on each listed day; if intervalHours is also set, sub-divide
//                  each day by that interval.
//   - FREQUENCY  : "N documents per period over a day-range" — a `bands` table
//                  (e.g. 2/week between admission day 5–30).
export const PERIOD_OPTIONS = [
  { value: "DEADLINE", label: "Deadline (N hours after admission)" },
  { value: "CONTINUOUS", label: "Continuous (every N hours)" },
  { value: "DAYS", label: "Days (specific days)" },
  { value: "FREQUENCY", label: "Frequency (N per period)" },
];

// FREQUENCY band period unit.
export const PER_OPTIONS = [
  { value: "DAY", label: "per day" },
  { value: "WEEK", label: "per week" },
  { value: "MONTH", label: "per month" },
];

// One row of a FREQUENCY schedule. `onwards` (toDay empty) means the band runs
// from `fromDay` until discharge.
export const emptyBand = () => ({
  fromDay: "",
  toDay: "",
  times: "",
  per: PER_OPTIONS[1], // per week
  onwards: false,
});

export const emptyConditionItem = () => ({
  model: null,
  field: "",
  operator: { value: "EXISTS", label: "EXISTS" },
  triggerType: TRIGGER_OPTIONS[0],
  deadlineHours: "",
  value: [],
  schedule: {
    period: PERIOD_OPTIONS[0], // "Days" default
    days: [], // e.g. [1, 3, 7] — day numbers since admission
    daysOnwards: false, // DAYS only: due every day after the max listed day
    intervalHours: "", // optional integer (every N hours)
    graceHours: 0, // tolerance window in hours
    bands: [], // FREQUENCY only: [{ fromDay, toDay, times, per, onwards }]
    repeat: "ONCE", // DEADLINE only: "ONCE" | "DAILY" (every 24 h until done)
    checkEvery3Hours: false, // DEADLINE only: also checked by the 3-hourly run
  },
  // Populated only when operator is ARRAY_ANY_MATCHES (today: LabReport
  // flagged-items conditions).
  arrayMatch: null,
  // Populated only when operator is CONSECUTIVE_LOW (discontinuation rules).
  // count = how many consecutive assessments must score below the threshold.
  consecutiveMatch: null,
  // Populated only when operator is CHANGE_OVER_PERIOD —
  // { direction, comparator, unit, periodUnit, periodCount }.
  changeMatch: null,
  // Populated only when operator is DAYS_BEFORE (Compliance Valid till) — the
  // alert firing days, e.g. [30] or [90, 30, 7]. 0 = on the expiry day.
  alertDaysBefore: [],
  // Optional discontinue-gate for DELAYED cadence ("missing assessment")
  // conditions — { count, criteria: [{ field, threshold }] }. Null = off.
  // When the last `count` assessments all score below the thresholds, the
  // missing-assessment reminder is suppressed.
  discontinueGate: null,
});

export const emptyRouting = () => ({
  selectedRoles: [],
  selectedUsers: [],
  notifyAdmissionDoctor: false,
  notifyAdmissionPsychologist: false,
});

export const emptyTargetBlock = () => ({
  id: Date.now() + Math.random(),
  name: "",
  alertTemplate: "",
  conditions: [emptyConditionItem()],
  // Per-block alert recipe — every block is a self-contained alert definition.
  severity: SEVERITY_OPTIONS[1],
  actionGuidance: "",
  referenceSection: "",
  ...emptyRouting(),
});

export const emptyForm = () => ({
  ruleName: "",
  protocol: "",
  category: "",
  isActive: true,
});

// SOP rule categories — organisational only (rules list + alerts filter); they
// never affect whether an alert fires. Mirrors SOP_CATEGORY_OPTIONS in the
// server's src/constants/sopCategories.js — values must match exactly.
export const SOP_CATEGORY_OPTIONS = [
  { value: "VITAL_SIGNS", label: "Vital Signs" },
  { value: "CLINICAL_TESTS", label: "Clinical Tests" },
  { value: "LAB_REPORTS", label: "Lab Reports" },
  { value: "ADMISSION_DOCUMENTATION", label: "Admission Documentation" },
  { value: "CLINICAL_DOCUMENTATION", label: "Clinical Documentation" },
  { value: "COMPLIANCE", label: "Compliance" },
  { value: "OTHER", label: "Other" },
];

// The fixed category of every Baseline Package alert. Shown read-only on the
// Baseline Package screen; NOT selectable on an SOP rule (the server refuses
// it there). Mirrors BASELINE_LAB_CATEGORY on the server.
export const BASELINE_LAB_CATEGORY = {
  value: "BASELINE_LAB",
  label: "Baseline Lab",
};

// Every category an alert can have — for the alerts filter and labels.
export const ALERT_CATEGORY_OPTIONS = [
  ...SOP_CATEGORY_OPTIONS,
  BASELINE_LAB_CATEGORY,
];

export const sopCategoryLabel = (value) =>
  ALERT_CATEGORY_OPTIONS.find((o) => o.value === value)?.label || "";
export const BLOOD_GROUP_OPTIONS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
].map((v) => ({ value: v, label: v }));

// ─── Suggested Medicines ──────────────────────────────────────────────────

export const MEDICINE_CATEGORY_OPTIONS = [
  { value: "WITHDRAWAL", label: "Withdrawal (CDZ, antiepileptics)" },
  { value: "GENERAL", label: "General (Thiamine, B-Plex, antacids)" },
  { value: "HEPATIC", label: "Hepatic (Udiliv, Rifagut, Lornit)" },
  { value: "MAINTENANCE", label: "Maintenance (Acamprosate, Topiramate)" },
  { value: "DISCHARGE", label: "Discharge prescription" },
  { value: "SOS", label: "SOS / PRN" },
  { value: "OTHER", label: "Other" },
];

export const MEDICINE_PRIORITY_OPTIONS = [
  { value: "ROUTINE", label: "Routine" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
  { value: "EMERGENCY", label: "Emergency" },
];

export const MEDICINE_INTAKE_OPTIONS = [
  { value: "Before food", label: "Before food" },
  { value: "After food", label: "After food" },
];

export const emptySuggestedMedicine = () => ({
  id: Date.now() + Math.random(), // local-only UI key
  medicine: null, // { value, label, snapshot? }
  medicineSnapshot: { name: "", type: "", strength: "", unit: "" },
  dosageAndFrequency: { morning: "", evening: "", night: "", unit: "tab" },
  applicableDays: [], // [] = throughout admission
  instructions: "",
  intake: MEDICINE_INTAKE_OPTIONS[1], // After food default
  priority: MEDICINE_PRIORITY_OPTIONS[0],
  category: MEDICINE_CATEGORY_OPTIONS[0],
  rationale: "",
});

// ─── Baseline Investigation Package ───────────────────────────────────────
// The admission-time lab package and its escalation ladder. Lives here rather
// than under pages/SopConfigs/ so the patient views can import the status
// metadata without reaching across the page tree.

export const BASELINE_STATUS = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  WAIVED: "WAIVED",
};

// Shared by the IPD control, the SOP overview strip and the config preview, so
// one status can't render three different ways.
//
// WAIVED reads as "Not Applicable" rather than "Waived": to a nurse the
// question is whether the package applies to this patient, not whether someone
// exercised a waiver.
export const BASELINE_STATUS_META = {
  PENDING: { label: "Pending", color: "warning", icon: "bx bx-time-five" },
  COMPLETED: {
    label: "Completed",
    color: "success",
    icon: "bx bx-check-circle",
  },
  WAIVED: {
    label: "Not Applicable",
    color: "secondary",
    icon: "bx bx-minus-circle",
  },
};

// Psychological Tests "Not Applicable" — mirrors the server's
// src/constants/psychologicalTests.js. The status values and reason CODES must
// match the server exactly; the server stores the code and rejects anything else.
export const PSYCH_TEST_STATUS = {
  APPLICABLE: "APPLICABLE",
  NOT_APPLICABLE: "NOT_APPLICABLE",
};

// The two reasons a clinician may choose, in the order shown. The server stores
// the `value`; the `label` is what the card displays afterwards.
export const PSYCH_TEST_NA_REASONS = [
  {
    value: "NOT_RELEVANT_TO_DIAGNOSIS",
    label: "The psychological tests are not relevant to the diagnosis.",
  },
  {
    value: "FAMILY_DECLINED",
    label:
      "The family has refused to pay the additional charges or has declined testing.",
  },
];

// Matches the server's cap on the free-text reason a Reopen requires.
export const PSYCH_TEST_REASON_MAX = 500;

// The 24/48/72/96h policy from the Governance SOP, used to seed a new ladder.
// The ladder is variable-length rather than fixed at four: the persisted shape
// is an array, the server validates it regardless, and "max alerts per
// admission" is DERIVED from ladder length — which the form shows live, so the
// relationship stays visible rather than hidden behind a fixed set of rows.
export const BASELINE_TIER_SEED = [
  { key: "T1", hours: 24, severity: "LOW" },
  { key: "T2", hours: 48, severity: "MEDIUM" },
  { key: "T3", hours: 72, severity: "HIGH" },
  { key: "T4", hours: 96, severity: "CRITICAL" },
];

export const BASELINE_TIER_KEYS = ["T1", "T2", "T3", "T4"];

// Starting point only — curate against the actual formulary before go-live.
// Note these are SUBSTRINGS matched against the prescribed name plus the drug
// master's genericName/composition. A brand like LITHOSUN is NOT matched by
// "LITHIUM" on name alone; it relies on the master carrying the generic.
export const BASELINE_DRUG_PATTERN_SUGGESTIONS = [
  "VALPRO",
  "DIVALPROEX",
  "LITHIUM",
  "CLOZAP",
];

export const emptyBaselineTier = (seed = {}) => ({
  id: Date.now() + Math.random(), // local-only UI key
  key: seed.key || "",
  hours: seed.hours ?? "",
  severity:
    SEVERITY_OPTIONS.find((o) => o.value === seed.severity) ||
    SEVERITY_OPTIONS[0],
  message: "",
  actionGuidance: "",
  referenceSection: seed.key || "",
  // Reused, NOT redeclared — this makes a tier's routing payload byte-identical
  // to a target block's, which is why RoutingCard needs no adaptation at all.
  ...emptyRouting(),
});

export const emptyBaselinePackageForm = () => ({
  name: "",
  description: "",
  centers: [],
  // Defaults to today. The server requires it and gates admissionDate on it —
  // it is the floor that stops a newly activated package firing against every
  // existing admission at once.
  effectiveFrom: new Date().toISOString().slice(0, 10),
  tests: [],
  escalationEnabled: true,
  drugPatterns: [],
  escalationNote: "",
  tiers: BASELINE_TIER_SEED.map(emptyBaselineTier),
});
