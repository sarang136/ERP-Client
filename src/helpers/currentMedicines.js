import { PRESCRIPTION } from "../Components/constants/patient";

export const getDurationDays = (duration, unit) => {
  const d = Number(duration || 0);

  if (!Number.isFinite(d) || d <= 0) {
    return 0;
  }

  if (unit === "Year (s)") return d * 365;
  if (unit === "Month (s)") return d * 30;
  if (unit === "Week (s)") return d * 7;
  return d;
};

export const getMedicineEndDate = (startDate, medicine) => {
  const start = startDate ? new Date(startDate) : null;
  if (!start || Number.isNaN(start.getTime())) return null;

  const durationDays = getDurationDays(medicine?.duration, medicine?.unit);

  if (durationDays <= 0) return null;

  // The To date is the last dose day, so N days ends N-1 days after the start.
  const end = new Date(start);
  end.setDate(end.getDate() + durationDays - 1);
  return end;
};

export const getDaysBetween = (startDate, endDate) => {
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 1;
  }
  const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endMidnight = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  // Both the From and To day count, so the same day is 1 day.
  const diffDays = Math.round((endMidnight - startMidnight) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diffDays);
};

export const isMedicineCurrentlyRunning = (
  startDate,
  medicine,
  referenceDate = new Date(),
) => {
  // The To date is the last day the medicine is given, so it stays running
  // through the end of that day. A stored To date wins (that keeps
  // prescriptions saved under the old end-date rule as they were).
  const endDate = medicine?.endDate
    ? new Date(medicine.endDate)
    : getMedicineEndDate(startDate, medicine);
  if (!endDate || Number.isNaN(endDate.getTime())) return true; // no computable end date => treat as ongoing

  const lastMoment = new Date(endDate);
  lastMoment.setHours(23, 59, 59, 999);
  return referenceDate <= lastMoment;
};


export const drugIdentity = (drug) =>
  [drug?.name, drug?.strength, drug?.unit]
    .map((v) => String(v || "").toLowerCase().trim())
    .join("|");

const medicineKey = (medicine) => drugIdentity(medicine?.medicine);


export const buildCurrentMedicinesList = (charts, referenceDate = new Date()) => {
  const latestByKey = new Map();

  (charts || [])
    .filter((chart) => chart?.chart === PRESCRIPTION && chart?.prescription?.medicines?.length)
    .forEach((chart) => {
      const chartDate = chart.date || chart.createdAt;
      (chart.prescription.medicines || []).forEach((medicine) => {
        const key = medicineKey(medicine);
        if (!key) return;

        const existing = latestByKey.get(key);
        if (existing && new Date(existing.chartDate) >= new Date(chartDate)) {
          return;
        }

        latestByKey.set(key, {
          ...medicine,
          chartId: chart._id,
          chartAuthor: chart.author,
          chartDate,
          startDate: chartDate,
          endDate: medicine.endDate || getMedicineEndDate(chartDate, medicine),
        });
      });
    });

  return Array.from(latestByKey.values()).filter((entry) =>
    isMedicineCurrentlyRunning(entry.startDate, entry, referenceDate),
  );
};

// Normalizes a medicine's dosage periods: when it has `schedules` (2+
// periods), returns them as-is; otherwise wraps its own flat fields as a
// single-period list, so every consumer can iterate periods uniformly
// without special-casing legacy/single-period medicines.
export const getScheduleList = (medicine) => {
  if (medicine?.schedules?.length) return medicine.schedules;
  return [
    {
      startDate: medicine?.startDate,
      endDate: medicine?.endDate,
      duration: medicine?.duration,
      unit: medicine?.unit,
      dosageAndFrequency: medicine?.dosageAndFrequency,
      frequency: medicine?.frequency,
      frequencyType: medicine?.frequencyType,
      monthlyDate: medicine?.monthlyDate,
      intake: medicine?.intake,
      instructions: medicine?.instructions,
    },
  ];
};

// Overall From/To span across every period — falls back to the medicine's
// own flat dates for a legacy/single-period medicine.
export const getMedicineOverallRange = (medicine) => {
  const periods = getScheduleList(medicine);
  const starts = periods.map((p) => p.startDate).filter(Boolean);
  const ends = periods.map((p) => p.endDate).filter(Boolean);
  return {
    startDate: starts.length
      ? starts.reduce((min, d) => (new Date(d) < new Date(min) ? d : min))
      : null,
    endDate:
      ends.length === periods.length
        ? ends.reduce((max, d) => (new Date(d) > new Date(max) ? d : max))
        : null, // an open-ended period anywhere in the course keeps the whole thing open-ended
  };
};

// Validates that a medicine's periods are sequential and non-overlapping:
// sorted by startDate, every period but possibly the last needs an endDate,
// and each next period must start strictly after the previous one ends.
// Returns an error message, or null when valid. Mirrors the server-side
// check of the same name so the two can never disagree.
export const validateSchedulesSequential = (schedules) => {
  const list = Array.isArray(schedules) ? schedules : [];
  if (list.length < 2) return null;

  const sorted = [...list].sort(
    (a, b) => new Date(a.startDate) - new Date(b.startDate),
  );

  for (let i = 0; i < sorted.length; i += 1) {
    const period = sorted[i];
    const isLast = i === sorted.length - 1;
    if (!period.startDate) return `Period ${i + 1} is missing a From date.`;
    if (!isLast && !period.endDate) return `Period ${i + 1} is missing a To date.`;
    if (!isLast) {
      const next = sorted[i + 1];
      if (new Date(next.startDate) <= new Date(period.endDate)) {
        return `Period ${i + 2} must start after period ${i + 1} ends.`;
      }
    }
  }

  return null;
};

export const getCurrentUserId = () => {
  try {
    return JSON.parse(localStorage.getItem("micrologin"))?.user?._id || null;
  } catch {
    return null;
  }
};
