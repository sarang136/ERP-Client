// Therapy Lectures pages render from server data: the month view and a series,
// through the page itself (index.js), with the role's THERAPY_LECTURES level.
//
//   CI=true npx craco test --watchAll=false src/pages/TherapyLectures/__tests__/TherapyLecturePages.test.js

import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import TherapyLectures from "../index";
import * as api from "../../../helpers/backend_helper";
import { usePermissions } from "../../../Components/Hooks/useRoles";

jest.mock("../../../helpers/backend_helper", () => ({
  getLectureSeriesList: jest.fn(),
  getLectureSeries: jest.fn(),
  getLectureProgramme: jest.fn(),
  getLectureHostOptions: jest.fn(),
}));
jest.mock("../../../Components/Hooks/useAuthError", () => ({ useAuthError: () => () => false }));
jest.mock("../../../Components/Hooks/useRoles", () => ({ usePermissions: jest.fn() }));
jest.mock("../../../Components/Hooks/useCenterOptions", () => ({
  useCenterOptions: () => [
    { value: "ALL", label: "All Centers" },
    { value: "c1", label: "Pune" },
    { value: "c2", label: "Nashik" },
  ],
}));

const hosts = [{ _id: "h1", name: "asha" }];
const seriesRow = { _id: "s1", center: { _id: "c1", title: "Pune" }, startKey: "2026-11-01", endKey: "2026-12-15", label: "1 Nov – 15 Dec 2026", hosts, patientCount: 7, sessionCount: 45, doneCount: 11, started: true, ended: false, locked: false, day: 12 };
const octRow = { ...seriesRow, _id: "s0", startKey: "2026-10-16", endKey: "2026-11-29", label: "16 Oct – 29 Nov 2026", patientCount: 4, doneCount: 26, day: 27 };

// The user's role level on THERAPY_LECTURES for the test (null = not in the role).
let roleLevel = "DELETE";
const RANK = { NONE: 0, READ: 1, WRITE: 2, DELETE: 3 };

const renderAt = (url) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/therapy-lectures/*" element={<TherapyLectures />} />
        <Route path="/unauthorized" element={<div>unauthorized page</div>} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  roleLevel = "DELETE";
  usePermissions.mockImplementation(() => ({
    loading: false,
    roles: { level: roleLevel },
    hasPermission: (module, sub, type) => module === "THERAPY_LECTURES" && roleLevel != null && RANK[roleLevel] >= RANK[type],
  }));
  api.getLectureSeriesList.mockResolvedValue({ data: [seriesRow, octRow] });
  api.getLectureHostOptions.mockResolvedValue({ data: [] });
  api.getLectureProgramme.mockResolvedValue({
    data: {
      name: "45-Day De-addiction Lecture Programme",
      days: 45,
      seriesDays: 45,
      maxPhotos: 10,
      editGraceDays: 2,
      activities: [{ day: 12, week: "Week 2", weekTheme: "Awareness, Triggers and Early Coping", sessionNo: "4", topic: "Craving Management I" }],
    },
  });
  api.getLectureSeries.mockResolvedValue({
    data: {
      series: { ...seriesRow, centerId: "c1", startKey: "2026-11-01", endKey: "2026-11-15", createdBy: { name: "asha" } },
      today: "2026-11-12",
      canManage: true,
      isAdmin: false,
      sessions: [
        { _id: "x1", dateKey: "2026-11-11", seriesDay: 11, hosts: [], done: true, activityDay: 11, activity: { day: 11, week: "Week 2", weekTheme: "Awareness, Triggers and Early Coping", topic: "Cognitive Awareness I" }, attendance: [{ patient: "p1", status: "PRESENT" }], evidence: [{ _id: "e1", url: "u" }], presentCount: 1, absentCount: 0, canRun: true, isFuture: false },
        { _id: "x2", dateKey: "2026-11-12", seriesDay: 12, hosts: [{ _id: "h2", name: "ravi" }], done: false, attendance: [], evidence: [], presentCount: 0, absentCount: 0, canRun: true, isFuture: false },
        { _id: "x3", dateKey: "2026-11-13", seriesDay: 13, hosts: [], done: false, attendance: [], evidence: [], presentCount: 0, absentCount: 0, canRun: true, isFuture: true },
      ],
      members: [
        { _id: "m1", patient: { _id: "p1", name: "ajay", uid: "JRC1", isAdmit: true }, active: true, joinedKey: "2026-11-01", attendance: { held: 11, present: 10, absent: 1 } },
        { _id: "m2", patient: { _id: "p2", name: "bhavna", uid: "JRC2", isAdmit: true }, active: false, joinedKey: "2026-11-01", leftKey: "2026-11-05", leftReason: "MOVED", movedTo: "16 Nov – 30 Dec 2026", attendance: { held: 4, present: 4, absent: 0 } },
      ],
    },
  });
});

test("month view: every series running in the month (one started in October), and an empty 2nd-half slot", async () => {
  renderAt("/therapy-lectures?month=2026-11&centre=c1");
  expect(await screen.findByText("7 patients")).toBeInTheDocument(); // loaded (the empty slots show first)
  const cards = screen.getAllByTestId("series-card");
  expect(cards.map((c) => within(c).getByRole("heading", { level: 5 }).textContent)).toEqual(["16 Oct – 29 Nov 2026", "1 Nov – 15 Dec 2026"]);
  expect(cards.map((c) => within(c).getByTestId("series-half").textContent)).toEqual(["Oct · 2nd half", "Nov · 1st half"]);
  expect(cards[1]).toHaveTextContent("Day 12 of 45");
  expect(screen.getByText("11 / 45 sessions done")).toBeInTheDocument();
  const empty = screen.getAllByTestId("empty-slot");
  expect(empty).toHaveLength(1); // November's 1st half is taken by the 1 Nov series
  expect(empty[0]).toHaveTextContent("Nov · 2nd half");
  expect(empty[0]).toHaveTextContent("Start on any day, 16–30 Nov");
  expect(within(empty[0]).getByRole("button", { name: /Create series/ })).toBeInTheDocument();
  expect(api.getLectureSeriesList).toHaveBeenCalledWith({ month: "2026-11", center: "c1" });
});

test("month view: a series started on the 25th fills the 2nd-half slot", async () => {
  const late = { ...seriesRow, _id: "s2", startKey: "2026-11-25", endKey: "2027-01-08", label: "25 Nov 2026 – 8 Jan 2027", started: false, day: null };
  api.getLectureSeriesList.mockResolvedValue({ data: [late] });
  renderAt("/therapy-lectures?month=2026-11&centre=c1");
  const card = await screen.findByTestId("series-card");
  expect(within(card).getByTestId("series-half")).toHaveTextContent("Nov · 2nd half");
  const empty = screen.getAllByTestId("empty-slot");
  expect(empty).toHaveLength(1);
  expect(empty[0]).toHaveTextContent("Nov · 1st half");
  expect(empty[0]).toHaveTextContent("1–15 Nov");
});

test("series page: 45 days with activity, hosts and status; patients with attendance and actions", async () => {
  renderAt("/therapy-lectures/s1");
  expect(await screen.findByText("Activity 11 · Cognitive Awareness I")).toBeInTheDocument();
  expect(screen.getByText("Day 11")).toBeInTheDocument();
  expect(screen.getByText("Craving Management I")).toBeInTheDocument(); // today's planned activity, not done yet
  expect(screen.getByText("Today")).toBeInTheDocument();
  expect(screen.getByText("ravi")).toBeInTheDocument();
  expect(screen.getByText("Upcoming")).toBeInTheDocument();
  expect(screen.getByText("Not done")).toBeInTheDocument();

  fireEvent.click(screen.getByText(/^Patients/));
  expect(screen.getByText("10 present")).toBeInTheDocument();
  expect(screen.getByText("of 11 sessions held")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Change day" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Move" })).toBeInTheDocument();
  expect(screen.queryByText("bhavna")).not.toBeInTheDocument();
  fireEvent.click(screen.getByLabelText("Show patients who left"));
  expect(screen.getByText("bhavna")).toBeInTheDocument();
  expect(screen.getByText("Moved to 16 Nov – 30 Dec 2026")).toBeInTheDocument();
});

// ── Role permission ────────────────────────────────────────────────────────

test("no THERAPY_LECTURES role: sent to the unauthorized page", () => {
  roleLevel = null;
  renderAt("/therapy-lectures?month=2026-11&centre=c1");
  expect(screen.getByText("unauthorized page")).toBeInTheDocument();
  expect(api.getLectureSeriesList).not.toHaveBeenCalled();
});

test("while the role loads: a spinner, nothing fetched", () => {
  usePermissions.mockImplementation(() => ({ loading: true, roles: null, hasPermission: () => false }));
  renderAt("/therapy-lectures?month=2026-11&centre=c1");
  expect(screen.queryByText("unauthorized page")).not.toBeInTheDocument();
  expect(api.getLectureSeriesList).not.toHaveBeenCalled();
});

test("READ: the month view without New series or Create series", async () => {
  roleLevel = "READ";
  renderAt("/therapy-lectures?month=2026-11&centre=c1");
  expect(await screen.findByText("7 patients")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /New series/ })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Create series/ })).not.toBeInTheDocument();
  expect(screen.getByTestId("empty-slot")).toHaveTextContent("No series yet");
});

test("READ: the series page is view-only — no hosts, add, move, remove or delete", async () => {
  roleLevel = "READ";
  renderAt("/therapy-lectures/s1");
  expect(await screen.findByText("You have view-only access to Therapy Lectures.")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Edit hosts/ })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Delete/ })).not.toBeInTheDocument();
  fireEvent.click(screen.getByText(/^Patients/));
  expect(screen.queryByRole("button", { name: /Add patient/ })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Move" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Progress" })).toBeInTheDocument(); // viewing stays
});

test("WRITE: creates and changes, but can't remove a patient or delete the series", async () => {
  roleLevel = "WRITE";
  renderAt("/therapy-lectures/s1");
  expect(await screen.findByRole("button", { name: /Edit hosts/ })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Delete/ })).not.toBeInTheDocument();
  expect(screen.queryByText("You have view-only access to Therapy Lectures.")).not.toBeInTheDocument();
  fireEvent.click(screen.getByText(/^Patients/));
  expect(screen.getByRole("button", { name: /Add patient/ })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Move" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
});

test("DELETE: Remove appears; Delete too while nothing is recorded in the series", async () => {
  const view = renderAt("/therapy-lectures/s1");
  fireEvent.click(await screen.findByText(/^Patients/));
  expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Delete/ })).not.toBeInTheDocument(); // a session is marked
  view.unmount();

  const fresh = (await api.getLectureSeries()).data;
  api.getLectureSeries.mockResolvedValue({
    data: { ...fresh, sessions: fresh.sessions.map((x) => ({ ...x, done: false, attendance: [], evidence: [] })) },
  });
  renderAt("/therapy-lectures/s1");
  expect(await screen.findByRole("button", { name: /Delete/ })).toBeInTheDocument();
});
