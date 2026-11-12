// Therapy Lectures pages render from server data: the month view and a series.
//
//   CI=true npx craco test --watchAll=false src/pages/TherapyLectures/__tests__/TherapyLecturePages.test.js

import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SeriesList from "../pages/SeriesList";
import SeriesDetail from "../pages/SeriesDetail";
import * as api from "../../../helpers/backend_helper";

jest.mock("../../../helpers/backend_helper", () => ({
  getLectureSeriesList: jest.fn(),
  getLectureSeries: jest.fn(),
  getLectureProgramme: jest.fn(),
  getLectureHostOptions: jest.fn(),
}));
jest.mock("../../../Components/Hooks/useAuthError", () => ({ useAuthError: () => () => false }));
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

beforeEach(() => {
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

test("month view: every series running in the month (one started in October), and a slot to start one on the 16th", async () => {
  render(
    <MemoryRouter initialEntries={["/therapy-lectures?month=2026-11&centre=c1"]}>
      <Routes>
        <Route path="/therapy-lectures" element={<SeriesList />} />
      </Routes>
    </MemoryRouter>,
  );
  expect(await screen.findByText("7 patients")).toBeInTheDocument(); // loaded (the empty slots show first)
  const cards = screen.getAllByTestId("series-card");
  expect(cards.map((c) => within(c).getByRole("heading", { level: 5 }).textContent)).toEqual(["16 Oct – 29 Nov 2026", "1 Nov – 15 Dec 2026"]);
  expect(cards[1]).toHaveTextContent("Day 12 of 45");
  expect(screen.getByText("11 / 45 sessions done")).toBeInTheDocument();
  expect(screen.getByText("16 Nov – 30 Dec 2026")).toBeInTheDocument(); // empty slot
  expect(screen.getByRole("button", { name: /Create series/ })).toBeInTheDocument();
  expect(api.getLectureSeriesList).toHaveBeenCalledWith({ month: "2026-11", center: "c1" });
});

test("series page: 45 days with activity, hosts and status; patients with attendance and actions", async () => {
  render(
    <MemoryRouter initialEntries={["/therapy-lectures/s1"]}>
      <Routes>
        <Route path="/therapy-lectures/:seriesId" element={<SeriesDetail />} />
      </Routes>
    </MemoryRouter>,
  );
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
