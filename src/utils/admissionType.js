import {
  ADMISSION_TYPE,
  INDEPENDENT_ADMISSION,
  admissionTypeFields,
} from "../Components/constants/patient";

/**
 * The admission type in force right now, read from the admission's own timeline
 * (`addmission.admissionTypeHistory`).
 *
 * That timeline is the single source of truth: the server writes it from BOTH
 * user actions — submitting an Admission Form and saving an Admission Type chart
 * — so reading it is the only way the panel reflects a type recorded through the
 * form, which creates no chart at all. Deriving it here rather than reading the
 * server's `currentAdmissionType` virtual is deliberate: the patient slice
 * patches this array in place after a chart save, and a virtual computed at
 * fetch time would go stale the moment it does.
 *
 * `excludeChartId` drops the period belonging to the chart currently being
 * edited — showing that chart as its own "current" would be circular.
 *
 * Returns { data, date, source } | null, where `data` carries the same field
 * shape the display helpers below expect.
 */
export const getCurrentAdmissionType = (addmission, excludeChartId = null) => {
  const history = addmission?.admissionTypeHistory;
  if (!Array.isArray(history) || history.length === 0) return null;

  const pool = excludeChartId
    ? history.filter((e) => String(e?.chart) !== String(excludeChartId))
    : history;
  if (pool.length === 0) return null;

  // The most recently RECORDED entry wins — not the one with the latest clinical
  // date, and not whichever happens to be flagged open.
  //
  // Ordering by clinical date was a real bug: a manually-entered type is stamped
  // with the admission date, so on an admission dated later than the records
  // added after it, that entry stayed "current" and masked every chart and form
  // that followed. Sorting here as well as server-side means the display is
  // right even for rows written before that was fixed.
  //
  // `recordedAt` is absent on older entries — fall back to assignedAt for those.
  const recordedTime = (e) =>
    new Date(e?.recordedAt ?? e?.assignedAt ?? 0).getTime();
  const current = [...pool].sort(
    (a, b) => recordedTime(a) - recordedTime(b),
  )[pool.length - 1];
  if (!current?.admissionType) return null;

  return {
    data: current,
    date: current.assignedAt || null,
    source: current.source || null,
  };
};

// Where a recorded type came from, for the "current type" panel — worth showing
// because a form-recorded type has no chart to open, so without this a user
// can't tell why there is nothing to click.
export const ADMISSION_TYPE_SOURCE_LABEL = {
  ADMISSION_FORM: "from Admission Form",
  ADMISSION_TYPE_CHART: "from Admission Type chart",
  BACKFILL: "from earlier records",
  // Typed straight onto the admission because no chart or form ever existed.
  MANUAL_ENTRY: "entered manually",
};

/**
 * The Admission Type chart to display for an admission: the most recent one by
 * chart date.
 *
 * Unlike Detail Admission there is no validation gate — chart.model.js sets
 * needsValidation = false for every type outside DETAIL_ADMISSION /
 * EXPIRY_SUMMARY / DISCHARGE_SUMMARY, so these charts are never doctor-validated.
 *
 * The server already returns charts sorted date-descending, but the array is
 * mutated client-side by the add/update reducers, so pick the newest explicitly.
 */
export const getLatestAdmissionTypeChart = (charts = []) => {
  const admissionTypes = (charts || []).filter(
    (c) => c?.chart === ADMISSION_TYPE && c?.admissionType,
  );
  if (admissionTypes.length === 0) return null;

  return admissionTypes.reduce((a, b) => {
    const ad = new Date(a.date || a.createdAt || 0);
    const bd = new Date(b.date || b.createdAt || 0);
    return bd >= ad ? b : a;
  });
};

// Stored value -> human label, using the same descriptor the form renders from.
export const admissionTypeLabel = (fieldName, value) => {
  const field = admissionTypeFields.find((f) => f.name === fieldName);
  const option = (field?.options || []).find((opt) => opt.value === value);
  return option?.label || value;
};

/**
 * The descriptor entries worth showing for a saved record: those with a value,
 * and those whose `showIf` matches — so an emergency admission shows its reason
 * and restraint while an independent one shows only the adultation type.
 *
 * Shared by the chart display, both print renderers and the header summary card.
 */
export const getVisibleAdmissionTypeRows = (data) => {
  if (!data) return [];

  return admissionTypeFields.filter((field) => {
    if (!data[field.name]) return false;
    if (field.showIf && data[field.showIf.field] !== field.showIf.value) {
      return false;
    }
    return true;
  });
};

// The sub-answers below the admission type itself, already labelled. "Yes"/"No"
// alone is meaningless for restraint, so that one keeps its label as a prefix.
export const getAdmissionTypeDetailParts = (data) =>
  getVisibleAdmissionTypeRows(data)
    .filter((field) => field.name !== "admissionType")
    .map((field) => {
      const label = admissionTypeLabel(field.name, data[field.name]);
      return field.name === "emergencyRestraint"
        ? `${field.label}: ${label}`
        : label;
    });

/**
 * The admission type's name as the patient header and the ADMISSION TYPE card
 * show it. "Independent Admission" is left out (owner decision, 2026-11-16): an
 * independent admission reads by its adult/minor answer alone, "Minor (below
 * 18)". Supportive and Emergency keep their name, because their details ("Upto
 * 30 days", "Risk to self") mean nothing without it. An older independent
 * record with no adult/minor answer still shows the name, so the line is never
 * empty.
 *
 * Only these two summaries use it; the chart, the chart form, the clear-type
 * modal and the prints still show the full name.
 */
export const admissionTypeSummaryLabel = (data) => {
  if (!data?.admissionType) return "";
  if (
    data.admissionType === INDEPENDENT_ADMISSION &&
    getAdmissionTypeDetailParts(data).length > 0
  ) {
    return "";
  }
  return admissionTypeLabel("admissionType", data.admissionType);
};
