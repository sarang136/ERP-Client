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

// One table column per job role (worked out by the server —
// services/sop/alertRecipients.js): Doctor … Nurse show the person assigned to
// the patient's admission in that role, whether or not the rule sends the alert
// to it (owner decision, 2026-11-17); Center Manager shows the employees whose
// HR position is "Centre Manager" at the alert's centre, else the centre's
// fallback manager, whatever the routing (owner decision, 2026-11-18). The
// Doctor … Nurse keys are User.role values; Center Manager keeps the key MANAGER.
export const RECIPIENT_ROLES = [
  { key: "DOCTOR", label: "Doctor" },
  { key: "PSYCHOLOGIST", label: "Psychologist" },
  { key: "MSW", label: "MSW" },
  { key: "RMO", label: "RMO" },
  { key: "NURSE", label: "Nurse" },
  { key: "MANAGER", label: "Center Manager" },
];

// Shown under a name in Center Manager when that person is the centre's
// fallback manager (set on the centre), because nobody at the centre holds the
// Centre Manager position. Everyone else carries no note: Doctor … Nurse are
// the assigned staff ("ASSIGNED"), Center Manager the position holders
// ("CENTRE_MANAGER").
export const RECIPIENT_VIA_NOTE = {
  FALLBACK: "Fallback",
};
