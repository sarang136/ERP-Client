// Patient page → Therapy Lectures tab: shown with READ on the THERAPY_LECTURES
// role module; lists the patient's series and attendance.
//
//   CI=true npx craco test --watchAll=false src/pages/Patient/Views/__tests__/TherapyLectures.test.js

import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { Provider } from "react-redux";
import { createStore } from "redux";
import { MemoryRouter } from "react-router-dom";
import Views from "../index";
import TherapyLectures from "../TherapyLectures";
import * as api from "../../../../helpers/backend_helper";
import { usePermissions } from "../../../../Components/Hooks/useRoles";

jest.mock("../../../../helpers/backend_helper", () => ({ getLecturePatientProgress: jest.fn() }));
jest.mock("../../../../Components/Hooks/useAuthError", () => ({ useAuthError: () => () => false }));
jest.mock("../../../../Components/Hooks/useRoles", () => ({ usePermissions: jest.fn() }));
// The other tabs and panels aren't under test here.
jest.mock("../Charting", () => () => <div>charting tab</div>);
jest.mock("../Billing", () => () => null);
jest.mock("../Timeline", () => () => null);
jest.mock("../Belongings", () => () => null);
jest.mock("../AdmissionForms/AdmissionForms", () => () => null);
jest.mock("../Components/SopPanel", () => () => null);
jest.mock("../Components/SpecialRequirementsSummary", () => () => null);
jest.mock("../Components/AdmissionTypeSummary", () => () => null);
// Clinical-test screens (they load jsPDF, which jsdom can't run).
jest.mock("../Components/CiwaQuestion", () => () => null);
jest.mock("../Components/SsrsQuestion", () => () => null);
jest.mock("../Components/YMSCQuestion", () => () => null);
jest.mock("../Components/MPQ9Question", () => () => null);
jest.mock("../Components/MMSEQuestion", () => () => null);
jest.mock("../Components/YBOCSQuestion", () => () => null);
jest.mock("../Components/ACDSQuestion", () => () => null);
jest.mock("../Components/HAMAQuestion", () => () => null);
jest.mock("../Components/HAMDQuestion", () => () => null);
jest.mock("../Components/PANSSQuestion", () => () => null);
jest.mock("../Components/Ramsayquestion", () => () => null);
jest.mock("../Components/Gcsquestion", () => () => null);
jest.mock("../Components/Morsefallquestion", () => () => null);
jest.mock("../Components/CGISQuestion", () => () => null);
jest.mock("../Components/COWSQuestion", () => () => null);
jest.mock("../Components/AUDITQuestion", () => () => null);
jest.mock("../Components/CIWABQuestion", () => () => null);

const PATIENT = { _id: "p1", name: "ravi", center: "c1" };
const PROGRESS = {
  patient: { _id: "p1", name: "ravi", uid: "JRC7", isAdmit: true },
  currentSeries: { _id: "s2", label: "25 Nov 2026 – 8 Jan 2027", halfLabel: "second half of November 2026", startKey: "2026-11-25", day: 6 },
  attendedActivities: 2,
  presentCount: 3,
  absentCount: 1,
  activities: [
    { day: 1, week: "Week 1", weekTheme: "Orientation, Motivation and Stabilization", topic: "Orientation and Group Norms", records: [{ dateKey: "2026-11-25", status: "PRESENT", series: "25 Nov 2026 – 8 Jan 2027" }] },
    { day: 2, week: "Week 1", weekTheme: "Orientation, Motivation and Stabilization", topic: "Psychoeducation I: Understanding Addiction", records: [] },
  ],
  history: [
    { _id: "m1", seriesId: "s1", series: "3 Oct – 16 Nov 2026", halfLabel: "first half of October 2026", joinedKey: "2026-10-03", leftKey: "2026-10-20", leftReason: "MOVED", active: false, present: 1, absent: 1 },
    { _id: "m2", seriesId: "s2", series: "25 Nov 2026 – 8 Jan 2027", halfLabel: "second half of November 2026", joinedKey: "2026-11-25", leftKey: null, leftReason: null, active: true, present: 2, absent: 0 },
  ],
};

const storeWith = (pages) =>
  createStore(() => ({
    Patient: { patient: PATIENT },
    ClinicalTest: { testName: "", isTestPageOpen: false },
    User: { user: { pageAccess: { pages } } },
  }));

const renderIn = (ui, pages = []) =>
  render(
    <Provider store={storeWith(pages)}>
      <MemoryRouter>{ui}</MemoryRouter>
    </Provider>,
  );

const PATIENT_PAGE = { name: "Patient", subAccess: [{ name: "Charting" }, { name: "Timeline" }] };

let lectureRole = "READ"; // the THERAPY_LECTURES level; null = not in the role

beforeEach(() => {
  lectureRole = "READ";
  usePermissions.mockImplementation(() => ({
    loading: false,
    hasPermission: (module, sub, type) => module === "THERAPY_LECTURES" && lectureRole != null && type === "READ",
  }));
  api.getLecturePatientProgress.mockResolvedValue({ data: PROGRESS });
});

test("the tab shows for users with the THERAPY_LECTURES role, and opens the patient's record", async () => {
  renderIn(<Views />, [PATIENT_PAGE]);
  expect(screen.getByText("charting tab")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Therapy Lectures" }));
  expect(await screen.findByTestId("patient-therapy-lectures")).toBeInTheDocument();
  expect(api.getLecturePatientProgress).toHaveBeenCalledWith("p1");
  expect(await screen.findByText("Day 6 of 45", { exact: false })).toBeInTheDocument();
});

test("no tab without the THERAPY_LECTURES role, even with the Therapy Lectures page", () => {
  lectureRole = null;
  renderIn(<Views />, [PATIENT_PAGE, { name: "Therapy Lectures" }]);
  expect(screen.queryByRole("button", { name: "Therapy Lectures" })).not.toBeInTheDocument();
  expect(api.getLecturePatientProgress).not.toHaveBeenCalled();
});

test("tab: series now and before, with half, status and attendance; links to the series", async () => {
  renderIn(<TherapyLectures />);
  const current = await screen.findByTestId("lecture-current");
  expect(within(current).getByRole("link", { name: "25 Nov 2026 – 8 Jan 2027" })).toHaveAttribute("href", "/therapy-lectures/s2");
  expect(current).toHaveTextContent("Day 6 of 45");
  expect(screen.getAllByText("2nd half · November 2026")[0]).toBeInTheDocument();
  expect(screen.getByText("2 of 2")).toBeInTheDocument(); // activities attended
  const rows = screen.getAllByTestId("lecture-history-row");
  expect(rows).toHaveLength(2);
  expect(rows[0]).toHaveTextContent("3 Oct – 16 Nov 2026");
  expect(rows[0]).toHaveTextContent("1st half · October 2026");
  expect(rows[0]).toHaveTextContent("Moved");
  expect(rows[0]).toHaveTextContent("1 present · 1 absent");
  expect(rows[1]).toHaveTextContent("In it now");

  // Activities stay folded until opened.
  expect(screen.queryByTestId("lecture-activities")).not.toBeInTheDocument();
  const toggle = screen.getByRole("button", { name: /Activities · 2 of 2 attended/ });
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  fireEvent.click(toggle);
  expect(screen.getByTestId("lecture-activities")).toBeInTheDocument();
  expect(screen.getByText("Present · Wed 25 Nov")).toBeInTheDocument();
  fireEvent.click(toggle);
  expect(screen.queryByTestId("lecture-activities")).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Open Therapy Lectures/ })).toHaveAttribute("href", "/therapy-lectures?centre=c1");
});

test("tab: a patient never in a series", async () => {
  api.getLecturePatientProgress.mockResolvedValue({ data: { ...PROGRESS, currentSeries: null, history: [], presentCount: 0, absentCount: 0 } });
  renderIn(<TherapyLectures />);
  expect(await screen.findByText(/hasn't been in a lecture series yet/)).toBeInTheDocument();
  expect(screen.queryByTestId("lecture-history-row")).not.toBeInTheDocument();
});
