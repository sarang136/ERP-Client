import {
  sopCategoryLabel,
  BASELINE_LAB_CATEGORY,
} from "../../../Components/constants/sopConstants";

export const timeAgo = (date) => {
  if (!date) return "";
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
};

export const dateLabel = (date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "Unknown";
  const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  if (dayStart === todayStart) return "Today";
  if (dayStart === todayStart - 86400000) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

// An alert with no `source` predates the field and is rule-sourced.
export const isRuleSourced = (a) => !a?.source || a.source === "SOP_RULE";

/**
 * What to show in the alert's "Source" column.
 *
 * The "(deleted rule)" fallback survives, but only for alerts that genuinely
 * ARE rule-sourced and lost their rule. A baseline-package alert never had one,
 * so showing "(deleted rule)" for it would be factually wrong — nothing was
 * deleted. The server already falls `rule.ruleName` back to `sourceLabel`; this
 * covers the case where it didn't.
 */
export const alertSourceLabel = (a) =>
  a?.rule?.ruleName || a?.sourceLabel || (isRuleSourced(a) ? "(deleted rule)" : "—");

/**
 * The alert's category label. A rule-sourced alert takes its rule's category;
 * a Baseline Package alert has no rule and is always Baseline Lab — the same
 * rule the server's category filter applies, so the column always agrees with
 * the filter. "" when the rule has no category yet.
 */
export const alertCategoryLabel = (a) =>
  sopCategoryLabel(
    isRuleSourced(a) ? a?.rule?.category : BASELINE_LAB_CATEGORY.value,
  );

/* ── Resolution notes ──────────────────────────────────────────────────────
 * Resolving an alert requires a note; it is stored as a normal notes[] entry
 * tagged kind "RESOLUTION" rather than on `resolution`, so there is one copy of
 * the text and it appears in the notes column without extra merge logic.
 *
 * ⚠️ Notes written before `kind` existed carry no value at all, so "is this an
 * ordinary note?" is asked as `!== "RESOLUTION"`. Testing `=== "NOTE"` would
 * misclassify every historical note.
 */
export const isResolutionNote = (n) => n?.kind === "RESOLUTION";

// The resolution note for an alert, or null. Alerts resolved before this
// feature have none — callers must handle that.
export const resolutionNote = (a) =>
  (a?.notes || []).find(isResolutionNote) || null;

/* ── Compliance (licence) alerts ───────────────────────────────────────────
 * Raised by a Compliance SOP rule when a centre licence nears its Valid till
 * date. They have no patient: `compliance` is the licence record, `center` its
 * centre, and `complianceInfo` a snapshot taken when the alert fired.
 */
export const isComplianceAlert = (a) => !!a?.compliance;

// Where a licence alert links to: the centre's page in the Compliance module.
export const complianceCentrePath = (a) =>
  a?.center?._id ? `/compliance/centres/${a.center._id}` : "/compliance/register";

// "15 Dec 2026"
export const fmtLicenceDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      })
    : "—";

// Days left as of NOW (the snapshot's daysLeft is as of when it fired), in IST
// calendar days. "30 days left" / "expires today" / "expired 3 days ago".
export const licenceDaysLeftText = (validTill, now = new Date()) => {
  if (!validTill) return "";
  const istDay = (d) => {
    const [y, m, day] = new Date(d)
      .toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
      .split("-")
      .map(Number);
    return Date.UTC(y, m - 1, day);
  };
  const n = Math.round((istDay(validTill) - istDay(now)) / 86400000);
  const days = (k) => `${k} day${k === 1 ? "" : "s"}`;
  if (n > 0) return `${days(n)} left`;
  if (n === 0) return "expires today";
  return `expired ${days(-n)} ago`;
};
