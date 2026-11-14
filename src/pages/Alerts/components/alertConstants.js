export const SEVERITY_COLOR = {
  LOW: "secondary",
  MEDIUM: "info",
  HIGH: "warning",
  CRITICAL: "danger",
};

export const SEVERITY_HEX = {
  LOW: "#6c757d",
  MEDIUM: "#0dcaf0",
  HIGH: "#ffc107",
  CRITICAL: "#dc3545",
};

export const PHASE_META = {
  IMMEDIATE: { label: "Immediate", icon: "bx bx-bolt-circle", color: "info" },
  DELAYED:   { label: "Delayed",   icon: "bx bx-time-five",   color: "warning" },
};

export const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

// What produced an alert. Absent on every alert written before the field
// existed, which means SOP_RULE — see alertUtils.isRuleSourced.
export const ALERT_SOURCE_META = {
  SOP_RULE: { label: "SOP Rule", color: "light", icon: "bx bx-list-check" },
  BASELINE_INVESTIGATION: {
    label: "Baseline Package",
    color: "primary",
    icon: "bx bx-test-tube",
  },
};

// The Resolution filter the page opens on (and "Clear all filters" returns to):
// the inbox is a to-do list, so it starts with what still needs resolving.
export const DEFAULT_RESOLVED_STATE = "unresolved";

// One table column per job role: the people in that role who see the alert
// (worked out by the server — services/sop/alertRecipients.js). Keys are
// User.role values; Center Manager is the MANAGER role.
export const RECIPIENT_ROLES = [
  { key: "DOCTOR", label: "Doctor" },
  { key: "PSYCHOLOGIST", label: "Psychologist" },
  { key: "MSW", label: "MSW" },
  { key: "RMO", label: "RMO" },
  { key: "NURSE", label: "Nurse" },
  { key: "MANAGER", label: "Center Manager" },
];

// Shown under a name that is there for a reason other than the alert being
// routed to their whole role.
export const RECIPIENT_VIA_NOTE = {
  PATIENT_DOCTOR: "Patient's doctor",
  PATIENT_PSYCHOLOGIST: "Patient's psychologist",
  PICKED: "Picked by name",
};
