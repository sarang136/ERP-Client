// Therapy Lectures screens: the session window (one form, one Save: session
// held, hosts, every patient's attendance and photos, all required) and adding
// a patient who is already in another series.
//
//   CI=true npx craco test --watchAll=false src/pages/TherapyLectures/__tests__/TherapyLectures.test.js

import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import SessionModal from "../components/SessionModal";
import AddPatientModal from "../components/AddPatientModal";
import {
  activityText,
  activityWeekText,
  halfLongText,
  halfRange,
  seriesDayOn,
  seriesEndKey,
  seriesHalf,
  seriesHalfTag,
  seriesLabel,
  seriesStatus,
  wasMemberOn,
} from "../helpers";
import * as api from "../../../helpers/backend_helper";

jest.mock("../../../helpers/backend_helper", () => ({
  getLectureHostOptions: jest.fn(),
  updateLectureSessionHosts: jest.fn(),
  saveLectureSession: jest.fn(),
  getLectureEligiblePatients: jest.fn(),
  addLectureMember: jest.fn(),
}));
jest.mock("../../../Components/Hooks/useAuthError", () => ({ useAuthError: () => () => false }));
// The host picker: shows the ids picked, and can clear them or pick h2.
jest.mock("../components/HostSelect", () => ({ value, onChange }) => (
  <div data-testid="host-select">
    <span>{(value || []).join(",") || "none"}</span>
    <button type="button" onClick={() => onChange([])}>clear hosts</button>
    <button type="button" onClick={() => onChange(["h2"])}>pick h2</button>
  </div>
));

const PROGRAMME = {
  days: 42,
  maxPhotos: 10,
  activities: [
    { day: 3, week: "Week 1", weekday: "Wednesday", title: "CBT 1", topic: "The CBT Model of Addiction" },
    { day: 4, week: "Week 1", weekday: "Thursday", title: "Mindfulness 1", topic: "Autopilot and Recovery" },
  ],
};
const SERIES = { _id: "s1", label: "1 Nov – 12 Dec 2026", centerId: "c1", hosts: [{ _id: "h1", name: "asha" }], startKey: "2026-11-01", endKey: "2026-12-12", locked: false };
const member = (id, name, extra) => ({ _id: `m-${id}`, patient: { _id: id, name, uid: `JRC${id}` }, ...extra });
const MEMBERS = [
  member("p1", "ajay", { active: true, joinedKey: "2026-11-01" }),
  member("p2", "bhavna", { active: true, joinedKey: "2026-11-11" }), // joined after the 10th
  member("p3", "chetan", { active: false, joinedKey: "2026-11-01", leftKey: "2026-11-09" }), // left before
  member("p4", "dinesh", { active: false, joinedKey: "2026-11-02", leftKey: "2026-11-10", leftReason: "MOVED" }), // left that day
];
const UPDATED = "2026-11-10T09:00:00.000Z";
const baseSession = { _id: "x1", dateKey: "2026-11-10", seriesDay: 4, hosts: [], done: false, attendance: [], evidence: [], canRun: true, isFuture: false, updatedAt: UPDATED };
const PHOTO = { _id: "e1", url: "u", uploadedBy: { name: "asha" } };
const doneSession = {
  ...baseSession,
  done: true,
  activityDay: 3,
  activity: PROGRAMME.activities[0],
  hosts: [{ _id: "h1", name: "asha" }],
  attendance: [{ patient: "p1", status: "PRESENT" }, { patient: "p4", status: "ABSENT" }],
  evidence: [PHOTO],
};

const openSession = (session, props = {}) =>
  render(
    <SessionModal
      isOpen
      toggle={() => {}}
      session={session}
      series={SERIES}
      members={MEMBERS}
      programme={PROGRAMME}
      canManage
      canEdit
      suggestedActivity={4}
      onSessionChange={() => {}}
      {...props}
    />,
  );

const addPhoto = (name = "ok.png") => {
  const file = new File(["x"], name, { type: "image/png" });
  fireEvent.change(screen.getByTestId("photo-input"), { target: { files: [file] } });
  return file;
};
const field = (id) => screen.getByTestId(`session-${id}`);

// CRA resets mock implementations before each test, so they are set here.
beforeEach(() => {
  api.getLectureHostOptions.mockResolvedValue({ data: [] });
  api.saveLectureSession.mockResolvedValue({ data: null, message: "Day 4 saved: Mindfulness 1" });
  api.updateLectureSessionHosts.mockResolvedValue({ data: null, message: "ok" });
  api.getLectureEligiblePatients.mockResolvedValue({ data: [] });
  api.addLectureMember.mockResolvedValue({ message: "Patient moved to this series" });
});

test("helpers: 42-day series from any day; 1st–15th is the month's 1st half, 16th on the 2nd", () => {
  expect(seriesEndKey("2026-10-01")).toBe("2026-11-11");
  expect(seriesLabel("2026-10-16")).toBe("16 Oct – 26 Nov 2026");
  expect(seriesLabel("2026-12-16")).toBe("16 Dec 2026 – 26 Jan 2027");
  expect(seriesLabel("2026-11-25")).toBe("25 Nov 2026 – 5 Jan 2027");
  expect(seriesLabel("2026-11-01", "2026-12-15")).toBe("1 Nov – 15 Dec 2026"); // a 45-day series from before
  expect(["2026-11-01", "2026-11-15", "2026-11-16", "2026-11-25"].map(seriesHalf)).toEqual([1, 1, 2, 2]);
  expect(seriesHalfTag("2026-11-25")).toBe("Nov · 2nd half");
  expect(halfRange("2027-02", 2)).toEqual({ fromKey: "2027-02-16", toKey: "2027-02-28" });
  expect(halfLongText("2026-11", 1)).toBe("1st half of November (1–15 Nov)");
  expect(seriesDayOn("2026-10-01", "2026-10-20")).toBe(20);
  expect(seriesStatus({ started: true, day: 12 }).text).toBe("Day 12 of 42");
  expect(seriesStatus({ started: true, day: 12, days: 45 }).text).toBe("Day 12 of 45");
  expect(seriesStatus({ ended: true, locked: true }).text).toBe("Closed");
  expect(wasMemberOn(MEMBERS[3], "2026-11-10")).toBe(true);
  expect(wasMemberOn(MEMBERS[3], "2026-11-11")).toBe(false);
});

test("helpers: session names, and the old list's names on sessions saved before", () => {
  expect(activityText(PROGRAMME.activities[1])).toBe("Mindfulness 1 · Autopilot and Recovery");
  expect(activityWeekText(PROGRAMME.activities[1])).toBe("Week 1 · Thursday");
  const old = { day: 11, week: "Week 2", weekTheme: "Awareness, Triggers and Early Coping", sessionNo: "4", topic: "Cognitive Awareness I" };
  expect(activityText(old)).toBe("Activity 11 · Cognitive Awareness I");
  expect(activityWeekText(old)).toBe("Week 2 · Awareness, Triggers and Early Coping");
  expect(activityText(null)).toBe("");
});

test("one form with every field required and a single Save", () => {
  openSession(baseSession);
  for (const id of ["activity", "hosts", "attendance", "photos"]) expect(field(id)).toHaveTextContent("*");
  expect(screen.getAllByRole("button", { name: /^Save/ })).toHaveLength(1);
  // The session is pre-picked from the day (day 4 → session 4) and the hosts from the series.
  expect(within(field("activity")).getByText("Thursday · Mindfulness 1 · Autopilot and Recovery")).toBeInTheDocument();
  expect(screen.getByText("Suggested for day 4 of the series.")).toBeInTheDocument();
  expect(within(field("hosts")).getByText("h1")).toBeInTheDocument();
  // Only patients in the series that day.
  const rows = screen.getAllByTestId("attendance-row");
  expect(rows.map((r) => r.textContent)).toEqual([expect.stringMatching(/^ajay/), expect.stringMatching(/^dinesh/)]);
});

test("Save with fields missing says what's missing and sends nothing", () => {
  openSession(baseSession);
  fireEvent.click(screen.getAllByRole("button", { name: "Present" })[0]); // ajay only
  fireEvent.click(screen.getByRole("button", { name: "clear hosts" }));
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  expect(within(field("hosts")).getByRole("alert")).toHaveTextContent("Pick at least one host.");
  expect(within(field("attendance")).getByRole("alert")).toHaveTextContent("Mark every patient present or absent (1 not marked).");
  expect(within(field("photos")).getByRole("alert")).toHaveTextContent("Add at least one photo of the session.");
  expect(within(field("activity")).queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.getByText("3 required fields missing")).toBeInTheDocument();
  expect(api.saveLectureSession).not.toHaveBeenCalled();
});

test("filled in: one Save sends the session, hosts, everyone's attendance and the photos, then closes", async () => {
  const toggle = jest.fn();
  const onSessionChange = jest.fn();
  api.saveLectureSession.mockResolvedValue({ data: { _id: "x1", done: true }, message: "Day 4 saved: Mindfulness 1" });
  openSession(baseSession, { toggle, onSessionChange });
  fireEvent.click(screen.getByRole("button", { name: "All present" }));
  const photo = addPhoto();
  expect(screen.getByText("1 of 10 photos")).toBeInTheDocument();
  expect(api.saveLectureSession).not.toHaveBeenCalled(); // nothing uploads before Save
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() =>
    expect(api.saveLectureSession).toHaveBeenCalledWith("x1", {
      activityDay: 4,
      hosts: ["h1"],
      attendance: [
        { patient: "p1", status: "PRESENT" },
        { patient: "p4", status: "PRESENT" },
      ],
      removePhotos: [],
      updatedAt: UPDATED,
      photos: [photo],
    }),
  );
  expect(onSessionChange).toHaveBeenCalledWith({ _id: "x1", done: true });
  expect(toggle).toHaveBeenCalled();
});

test("a saved session opens filled in; Save changes is off until something changes", async () => {
  openSession(doneSession);
  expect(within(field("activity")).getByText("Wednesday · CBT 1 · The CBT Model of Addiction")).toBeInTheDocument();
  const save = screen.getByRole("button", { name: "Save changes" });
  expect(save).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "pick h2" }));
  expect(save).toBeEnabled();
  fireEvent.click(save);
  await waitFor(() =>
    expect(api.saveLectureSession).toHaveBeenCalledWith("x1", expect.objectContaining({ activityDay: 3, hosts: ["h2"], photos: [] })),
  );
});

test("a session saved on the old 45-activity list asks for a session from the new list", () => {
  const old = { day: 44, week: "Transition Phase", weekTheme: "Preparing for discharge", sessionNo: "T2", topic: "Discharge Planning" };
  openSession({ ...doneSession, activityDay: 44, activity: old });
  expect(screen.getByText(/Saved earlier as Activity 44 · Discharge Planning, from the old 45-activity list/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  expect(within(field("activity")).getByRole("alert")).toHaveTextContent("Pick the session that was held.");
  expect(api.saveLectureSession).not.toHaveBeenCalled();
});

test("only the series' hosts change who hosted; a day's own host sees the names", () => {
  openSession({ ...doneSession, hosts: [{ _id: "h3", name: "meera" }] }, { canManage: false });
  expect(screen.queryByTestId("host-select")).not.toBeInTheDocument();
  expect(field("hosts")).toHaveTextContent("meera");
  expect(field("hosts")).toHaveTextContent("Only the series' hosts can change who hosts.");
});

test("someone who isn't a host of the session sees it read-only", () => {
  openSession({ ...doneSession, canRun: false }, { canEdit: false, canManage: false });
  expect(screen.getByText("Only this session's hosts can fill it in.")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /^Save/ })).not.toBeInTheDocument();
  expect(field("activity")).toHaveTextContent("CBT 1 · The CBT Model of Addiction");
  expect(field("activity")).toHaveTextContent("Week 1 · Wednesday");
  expect(screen.getByText("Absent")).toBeInTheDocument();
  expect(screen.queryByText("Add photos")).not.toBeInTheDocument();
});

test("view-only role: says so, nothing to save", () => {
  openSession(baseSession, { canEdit: false, viewOnly: true });
  expect(screen.getByText("You have view-only access to Therapy Lectures.")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /^Save/ })).not.toBeInTheDocument();
});

test("photos: removing a saved one needs the DELETE level, happens on Save, and one photo must stay", async () => {
  const { unmount } = openSession(doneSession);
  expect(screen.getByText("Add photos")).toBeInTheDocument();
  expect(screen.queryByLabelText("Remove photo")).not.toBeInTheDocument();
  unmount();

  openSession(doneSession, { canDeletePhotos: true });
  fireEvent.click(screen.getByLabelText("Remove photo"));
  expect(screen.getByText("0 of 10 photos")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  expect(within(field("photos")).getByRole("alert")).toHaveTextContent("Add at least one photo of the session.");
  expect(api.saveLectureSession).not.toHaveBeenCalled();

  const photo = addPhoto("new.png");
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() =>
    expect(api.saveLectureSession).toHaveBeenCalledWith("x1", expect.objectContaining({ removePhotos: ["e1"], photos: [photo] })),
  );
});

test("photos: files over 5 MB and non-photos are skipped; a new one can be taken out before saving", () => {
  openSession(doneSession);
  const big = new File(["x"], "big.jpg", { type: "image/jpeg" });
  Object.defineProperty(big, "size", { value: 6 * 1024 * 1024 });
  const ok = new File(["x"], "ok.png", { type: "image/png" });
  const pdf = new File(["x"], "doc.pdf", { type: "application/pdf" });
  fireEvent.change(screen.getByTestId("photo-input"), { target: { files: [big, ok, pdf] } });
  expect(screen.getByText("2 of 10 photos")).toBeInTheDocument();
  expect(screen.getAllByText("New")).toHaveLength(1);
  fireEvent.click(screen.getByLabelText("Remove new photo"));
  expect(screen.getByText("1 of 10 photos")).toBeInTheDocument();
  expect(api.saveLectureSession).not.toHaveBeenCalled();
});

test("no patients in the series that day: attendance has nothing to mark", async () => {
  openSession(baseSession, { members: [] });
  expect(field("attendance")).toHaveTextContent("No patients were in this series on this day.");
  expect(field("attendance")).not.toHaveTextContent("*");
  addPhoto();
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(api.saveLectureSession).toHaveBeenCalledWith("x1", expect.objectContaining({ attendance: [] })));
});

test("before the day: only who will host it, with its own Save", async () => {
  openSession({ ...baseSession, isFuture: true });
  expect(screen.getByText("This session hasn't happened yet. It can be filled in on the day.")).toBeInTheDocument();
  expect(screen.queryByTestId("session-attendance")).not.toBeInTheDocument();
  expect(screen.queryByTestId("session-photos")).not.toBeInTheDocument();
  const save = screen.getByRole("button", { name: "Save" });
  expect(save).toBeDisabled(); // still the series' hosts
  fireEvent.click(screen.getByRole("button", { name: "pick h2" }));
  fireEvent.click(save);
  await waitFor(() => expect(api.updateLectureSessionHosts).toHaveBeenCalledWith("x1", ["h2"]));
  expect(api.saveLectureSession).not.toHaveBeenCalled();
});

test("add patient: one in another running series is moved here", async () => {
  api.getLectureEligiblePatients.mockResolvedValueOnce({
    data: [{ _id: "p9", name: "farid", uid: "JRC9", admissionKey: "2026-10-20", current: { label: "16 Oct – 29 Nov 2026", ended: false, day: 26 } }],
  });
  render(<AddPatientModal isOpen toggle={() => {}} series={SERIES} today="2026-11-10" onAdded={() => {}} />);
  fireEvent.click(await screen.findByText("farid"));
  expect(screen.getByText(/Adding moves them here/)).toBeInTheDocument();
  expect(screen.getByText(/on its day 26/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Move here" }));
  await waitFor(() => expect(api.addLectureMember).toHaveBeenCalledWith("s1", { patient: "p9", move: true }));
});

test("add patient: one whose series has ended is simply added, no programme day to enter", async () => {
  api.getLectureEligiblePatients.mockResolvedValueOnce({
    data: [{ _id: "p8", name: "gita", uid: "JRC8", admissionKey: "2026-08-01", current: { label: "16 Aug – 29 Sept 2026", ended: true, day: null } }],
  });
  render(<AddPatientModal isOpen toggle={() => {}} series={SERIES} today="2026-11-10" onAdded={() => {}} />);
  expect(await screen.findByText("Completed 16 Aug – 29 Sept 2026")).toBeInTheDocument();
  fireEvent.click(screen.getByText("gita"));
  expect(screen.queryByLabelText(/Programme day/)).not.toBeInTheDocument();
  expect(screen.getByLabelText("In the series from")).toHaveValue("2026-11-10");
  fireEvent.click(screen.getByRole("button", { name: "Add patient" }));
  await waitFor(() => expect(api.addLectureMember).toHaveBeenCalledWith("s1", { patient: "p8", move: false }));
});
