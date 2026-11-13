// Therapy Lectures screens: the session window (activity → attendance → photos)
// and adding a patient who is already in another series.
//
//   CI=true npx craco test --watchAll=false src/pages/TherapyLectures/__tests__/TherapyLectures.test.js

import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import SessionModal from "../components/SessionModal";
import AddPatientModal from "../components/AddPatientModal";
import {
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
  markLectureSessionDone: jest.fn(),
  undoLectureSessionDone: jest.fn(),
  saveLectureAttendance: jest.fn(),
  updateLectureSessionHosts: jest.fn(),
  uploadLectureEvidence: jest.fn(),
  deleteLectureEvidence: jest.fn(),
  getLectureEligiblePatients: jest.fn(),
  addLectureMember: jest.fn(),
}));
jest.mock("../../../Components/Hooks/useAuthError", () => ({ useAuthError: () => () => false }));

const PROGRAMME = {
  days: 45,
  maxPhotos: 10,
  activities: [
    { day: 3, week: "Week 1", weekTheme: "Orientation, Motivation and Stabilization", sessionNo: "3", topic: "Detox and Craving Support" },
    { day: 4, week: "Week 1", weekTheme: "Orientation, Motivation and Stabilization", sessionNo: "4", topic: "Motivational Interviewing I" },
  ],
};
const SERIES = { _id: "s1", label: "1 Nov – 15 Dec 2026", centerId: "c1", hosts: [{ _id: "h1", name: "asha" }], startKey: "2026-11-01", endKey: "2026-12-15", locked: false };
const member = (id, name, extra) => ({ _id: `m-${id}`, patient: { _id: id, name, uid: `JRC${id}` }, ...extra });
const MEMBERS = [
  member("p1", "ajay", { active: true, joinedKey: "2026-11-01" }),
  member("p2", "bhavna", { active: true, joinedKey: "2026-11-11" }), // joined after the 10th
  member("p3", "chetan", { active: false, joinedKey: "2026-11-01", leftKey: "2026-11-09" }), // left before
  member("p4", "dinesh", { active: false, joinedKey: "2026-11-02", leftKey: "2026-11-10", leftReason: "MOVED" }), // left that day
];
const baseSession = { _id: "x1", dateKey: "2026-11-10", seriesDay: 10, hosts: [], done: false, attendance: [], evidence: [], canRun: true, isFuture: false };

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

// CRA resets mock implementations before each test, so they are set here.
beforeEach(() => {
  api.getLectureHostOptions.mockResolvedValue({ data: [] });
  api.markLectureSessionDone.mockResolvedValue({ data: null, message: "ok" });
  api.saveLectureAttendance.mockResolvedValue({ data: null, message: "ok" });
  api.uploadLectureEvidence.mockResolvedValue({ data: null });
  api.getLectureEligiblePatients.mockResolvedValue({ data: [] });
  api.addLectureMember.mockResolvedValue({ message: "Patient moved to this series" });
});

test("helpers: 45-day series from any day; 1st–15th is the month's 1st half, 16th on the 2nd", () => {
  expect(seriesEndKey("2026-10-01")).toBe("2026-11-14");
  expect(seriesLabel("2026-10-16")).toBe("16 Oct – 29 Nov 2026");
  expect(seriesLabel("2026-12-16")).toBe("16 Dec 2026 – 29 Jan 2027");
  expect(seriesLabel("2026-11-25")).toBe("25 Nov 2026 – 8 Jan 2027");
  expect(["2026-11-01", "2026-11-15", "2026-11-16", "2026-11-25"].map(seriesHalf)).toEqual([1, 1, 2, 2]);
  expect(seriesHalfTag("2026-11-25")).toBe("Nov · 2nd half");
  expect(halfRange("2027-02", 2)).toEqual({ fromKey: "2027-02-16", toKey: "2027-02-28" });
  expect(halfLongText("2026-11", 1)).toBe("1st half of November (1–15 Nov)");
  expect(seriesDayOn("2026-10-01", "2026-10-20")).toBe(20);
  expect(seriesStatus({ started: true, day: 12 }).text).toBe("Day 12 of 45");
  expect(seriesStatus({ ended: true, locked: true }).text).toBe("Closed");
  expect(wasMemberOn(MEMBERS[3], "2026-11-10")).toBe(true);
  expect(wasMemberOn(MEMBERS[3], "2026-11-11")).toBe(false);
});

test("not done: attendance waits for the activity; Mark done sends the suggested activity", async () => {
  openSession(baseSession);
  expect(screen.getByText("Mark the activity done first.")).toBeInTheDocument();
  expect(screen.getByText("Activity 4 · Session 4 · Motivational Interviewing I")).toBeInTheDocument();
  expect(screen.getByText("Suggested: activity 4, for day 4 of the series.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Mark done" }));
  await waitFor(() => expect(api.markLectureSessionDone).toHaveBeenCalledWith("x1", 4));
});

test("done: only patients in the series that day are listed; All present + Save sends them", async () => {
  openSession({ ...baseSession, done: true, activityDay: 3, activity: PROGRAMME.activities[0] });
  const rows = screen.getAllByTestId("attendance-row");
  expect(rows.map((r) => r.textContent)).toEqual([expect.stringMatching(/^ajay/), expect.stringMatching(/^dinesh/)]);
  expect(screen.getByRole("button", { name: "Save attendance" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "All present" }));
  fireEvent.click(screen.getByRole("button", { name: "Save attendance" }));
  await waitFor(() =>
    expect(api.saveLectureAttendance).toHaveBeenCalledWith("x1", [
      { patient: "p1", status: "PRESENT" },
      { patient: "p4", status: "PRESENT" },
    ]),
  );
});

test("someone who isn't a host of the session sees it read-only", () => {
  openSession(
    { ...baseSession, done: true, activityDay: 3, activity: PROGRAMME.activities[0], canRun: false, attendance: [{ patient: "p1", status: "ABSENT" }] },
    { canEdit: false, canManage: false },
  );
  expect(screen.getByText("Only this session's hosts can mark it.")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Mark done|Change activity/ })).not.toBeInTheDocument();
  expect(screen.getByText("Absent")).toBeInTheDocument();
  expect(screen.getByTestId("photo-input")).toBeInTheDocument(); // hidden input exists, but no add button
  expect(screen.queryByText("Add photos")).not.toBeInTheDocument();
});

test("photos: removing one needs the DELETE level; adding needs only WRITE", () => {
  const withPhoto = { ...baseSession, done: true, activityDay: 3, evidence: [{ _id: "e1", url: "u", uploadedBy: { name: "asha" } }] };
  const { unmount } = openSession(withPhoto);
  expect(screen.getByText("Add photos")).toBeInTheDocument();
  expect(screen.queryByLabelText("Remove photo")).not.toBeInTheDocument();
  unmount();
  openSession(withPhoto, { canDeletePhotos: true });
  expect(screen.getByLabelText("Remove photo")).toBeInTheDocument();
});

test("view-only role: says so instead of the host message", () => {
  openSession(baseSession, { canEdit: false, viewOnly: true });
  expect(screen.getByText("You have view-only access to Therapy Lectures.")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Mark done" })).not.toBeInTheDocument();
});

test("photos: files over 5 MB are skipped, others uploaded one by one", async () => {
  openSession({ ...baseSession, done: true, activityDay: 3, activity: PROGRAMME.activities[0] });
  const big = new File(["x"], "big.jpg", { type: "image/jpeg" });
  Object.defineProperty(big, "size", { value: 6 * 1024 * 1024 });
  const ok = new File(["x"], "ok.png", { type: "image/png" });
  const pdf = new File(["x"], "doc.pdf", { type: "application/pdf" });
  fireEvent.change(screen.getByTestId("photo-input"), { target: { files: [big, ok, pdf] } });
  await waitFor(() => expect(api.uploadLectureEvidence).toHaveBeenCalledTimes(1));
  expect(api.uploadLectureEvidence).toHaveBeenCalledWith("x1", ok);
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
