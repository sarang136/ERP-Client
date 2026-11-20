// Same code as ERP-Server/src/services/finance/paymentSchedule.service.js, so the preview here shows the dates the server will use.
// Payment runs. A run (and every due date made from it) is a calendar day stored as UTC midnight of that day, like a
// date typed into a date box ("2026-11-20" is 2026-11-20T00:00:00Z). So it reads the same on any server and in any
// browser. "Today" is the day in India (the company's day), whatever timezone the server runs in.

// The calendar day in India for a moment in time, as a Date at UTC midnight of that day
export const indiaDay = (moment = new Date()) => {
  const text = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(moment)); // 2026-11-18
  const [y, m, d] = text.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

const addDays = (date, n) => {
  const x = new Date(date);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
};

// The first run on or after `from`
export const nextRun = (schedule, from = new Date()) => {
  if (!schedule || !schedule.days?.length) return null;
  const start = indiaDay(from);
  if (schedule.frequency === "weekly") {
    for (let i = 0; i < 7; i++) {
      const d = addDays(start, i);
      if (schedule.days.includes(d.getUTCDay())) return d;
    }
    return null;
  }
  // monthly: look at this month and the next two (a run is always within a month)
  for (let add = 0; add < 3; add++) {
    const first = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + add, 1));
    const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
    const candidates = [...new Set(schedule.days.map((d) => Math.min(d, last)))].sort((a, b) => a - b);
    for (const c of candidates) {
      const d = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), c));
      if (d >= start) return d;
    }
  }
  return null;
};

// The next `count` runs from `from`, oldest first
export const upcomingRuns = (schedule, count = 3, from = new Date()) => {
  const runs = [];
  let cursor = indiaDay(from);
  for (let i = 0; i < count; i++) {
    const r = nextRun(schedule, cursor);
    if (!r) break;
    runs.push(r);
    cursor = addDays(r, 1);
  }
  return runs;
};

// The due date a bill gets, or null when the schedule does not give one at this moment.
//   moment: "added" (the bill was just saved) or "approved" (it was just approved)
export const dueDateFor = (schedule, moment, from = new Date()) => {
  if (!schedule) return null;
  const wanted = moment === "added" ? "invoice_added" : "invoice_approved";
  return schedule.basis === wanted ? nextRun(schedule, from) : null;
};
