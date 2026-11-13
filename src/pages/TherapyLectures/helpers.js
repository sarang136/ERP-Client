// Shared helpers for the Therapy Lectures pages. Dates are India calendar days
// written "YYYY-MM-DD", as the server sends them.

const IST_OFFSET_MS = 330 * 60 * 1000;

export const todayKey = () => new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10);
export const currentMonth = () => todayKey().slice(0, 7);

export const shiftMonth = (month, n) => {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
};

export const monthLabel = (month) =>
  new Date(`${month}-01T00:00:00Z`).toLocaleString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

/** A series runs 45 days from the day it starts (any day); day N suggests activity N. */
export const SERIES_DAYS = 45;
/** Started on the 1st–15th it is its month's first half, on the 16th or later the second (one per half). */
export const SECOND_HALF_FROM_DAY = 16;
export const HALVES = [1, 2];

const DAY_MS = 24 * 60 * 60 * 1000;
export const addDays = (key, n) => new Date(Date.parse(`${key}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);
export const daysBetween = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY_MS);

/** Day N of the series on `dateKey` (1 on its first day). */
export const seriesDayOn = (startKey, dateKey) => daysBetween(startKey, dateKey) + 1;

export const seriesEndKey = (startKey) => addDays(startKey, SERIES_DAYS - 1);

const fmt = (key, opts) => new Date(`${key}T00:00:00Z`).toLocaleDateString("en-GB", { ...opts, timeZone: "UTC" });

/** "2026-11" → "2026-11-30" */
export const monthEndKey = (month) => {
  const [y, m] = month.split("-").map(Number);
  return `${month}-${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, "0")}`;
};

/** 1 or 2: the half of its month a series starting on `startKey` belongs to. */
export const seriesHalf = (startKey) => (Number(startKey.slice(8)) >= SECOND_HALF_FROM_DAY ? 2 : 1);

/** First and last day of a month's half: ("2026-11", 2) → { fromKey: "2026-11-16", toKey: "2026-11-30" }. */
export const halfRange = (month, half) =>
  half === 2
    ? { fromKey: `${month}-${SECOND_HALF_FROM_DAY}`, toKey: monthEndKey(month) }
    : { fromKey: `${month}-01`, toKey: `${month}-${String(SECOND_HALF_FROM_DAY - 1).padStart(2, "0")}` };

/** "Nov · 2nd half" */
export const halfTag = (month, half) => `${fmt(`${month}-01`, { month: "short" })} · ${half === 2 ? "2nd" : "1st"} half`;

/** "Nov · 2nd half" for the series starting on `startKey`. */
export const seriesHalfTag = (startKey) => halfTag(startKey.slice(0, 7), seriesHalf(startKey));

/** "16–30 Nov" */
export const halfDaysText = (month, half) => {
  const { fromKey, toKey } = halfRange(month, half);
  return `${Number(fromKey.slice(8))}–${fmt(toKey, { day: "numeric", month: "short" })}`;
};

/** "2nd half of November (16–30 Nov)" */
export const halfLongText = (month, half) =>
  `${half === 2 ? "2nd" : "1st"} half of ${fmt(`${month}-01`, { month: "long" })} (${halfDaysText(month, half)})`;

/** "1 Oct – 14 Nov 2026" (both years shown when it crosses one) */
export const seriesLabel = (startKey, endKey = seriesEndKey(startKey)) =>
  startKey.slice(0, 4) === endKey.slice(0, 4)
    ? `${fmt(startKey, { day: "numeric", month: "short" })} – ${fmt(endKey, { day: "numeric", month: "short", year: "numeric" })}`
    : `${fmt(startKey, { day: "numeric", month: "short", year: "numeric" })} – ${fmt(endKey, { day: "numeric", month: "short", year: "numeric" })}`;

/** "Thu 12 Nov" */
export const formatDay = (key) =>
  key
    ? new Date(`${key}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })
    : "";

/** "12 Nov 2026" */
export const formatDate = (key) =>
  key
    ? new Date(`${key}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
    : "";

export const errorMessage = (err, fallback = "Something went wrong. Please try again") =>
  err?.message || err?.data?.message || fallback;

/** Upcoming / Day N of 45 / Ended / Closed, with a badge colour. */
export const seriesStatus = (s) => {
  if (s.locked) return { text: "Closed", color: "secondary" };
  if (s.ended) return { text: "Ended", color: "warning" };
  if (s.started) return { text: s.day ? `Day ${s.day} of ${SERIES_DAYS}` : "Running", color: "success" };
  return { text: "Upcoming", color: "info" };
};

/** Was this membership in its series on `dateKey`? (mirrors the server rule) */
export const wasMemberOn = (m, dateKey) =>
  Boolean(m) && m.joinedKey <= dateKey && (m.active || (m.leftKey != null && m.leftKey >= dateKey));

export const LEAVE_TEXT = {
  MOVED: "Moved",
  DISCHARGED: "Discharged",
  REMOVED: "Removed",
  SERIES_DELETED: "Series deleted",
  COMPLETED: "Completed",
};

/** "Activity 11 · Cognitive Awareness I" */
export const activityText = (a) => (a ? `Activity ${a.day} · ${a.topic}` : "");

export const hostNames = (hosts) => (hosts || []).map((h) => h?.name).filter(Boolean).join(", ");
