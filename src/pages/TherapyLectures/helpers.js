// Shared helpers for the Therapy Lectures pages. Dates are India calendar days
// written "YYYY-MM-DD", as the server sends them.

export const PAGE_NAME = "Therapy Lectures";

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

/** A series runs 45 days from the 1st or the 16th of a month; day N suggests activity N. */
export const SERIES_DAYS = 45;
export const START_DAYS = ["01", "16"];

const DAY_MS = 24 * 60 * 60 * 1000;
export const addDays = (key, n) => new Date(Date.parse(`${key}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);
export const daysBetween = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY_MS);

/** Day N of the series on `dateKey` (1 on its first day). */
export const seriesDayOn = (startKey, dateKey) => daysBetween(startKey, dateKey) + 1;

export const seriesEndKey = (startKey) => addDays(startKey, SERIES_DAYS - 1);

const fmt = (key, opts) => new Date(`${key}T00:00:00Z`).toLocaleDateString("en-GB", { ...opts, timeZone: "UTC" });

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
