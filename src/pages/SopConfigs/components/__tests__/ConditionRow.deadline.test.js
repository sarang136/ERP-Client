// The Deadline cycle's options: alert once or every day until done, and the
// 3-hourly check — e.g. "Prescription not created 2 h after admission".
//
//   CI=true npx craco test --watchAll=false src/pages/SopConfigs/components/__tests__/ConditionRow.deadline.test.js

import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import ConditionRow from "../ConditionRow";
import { PERIOD_OPTIONS } from "../../../../Components/constants/sopConstants";

jest.mock("../../../../helpers/backend_helper", () => ({
  getICDCodes: jest.fn(() => Promise.resolve({ data: [] })),
  sopGetLabTests: jest.fn(() => Promise.resolve({ tests: [], panels: [] })),
}));

const FIELDS = { Prescription: [{ value: "FIELD_EXISTS", label: "Record Exists ?", type: "FIELD_EXISTS" }] };
const DEADLINE = PERIOD_OPTIONS.find((o) => o.value === "DEADLINE");
const DAYS = PERIOD_OPTIONS.find((o) => o.value === "DAYS");
const schedule = (extra) => ({ period: DEADLINE, days: [], daysOnwards: false, intervalHours: "2", graceHours: 0, bands: [], repeat: "ONCE", checkEvery3Hours: false, ...extra });

const row = (sched, onChange = () => {}) =>
  render(
    <ConditionRow
      condition={{
        model: { value: "Prescription", label: "Prescription" },
        field: "FIELD_EXISTS",
        operator: { value: "EXISTS", label: "EXISTS" },
        triggerType: { value: "DELAYED", label: "DELAYED" },
        value: [],
        schedule: sched,
      }}
      idx={0}
      onChange={onChange}
      onRemove={() => {}}
      isDisabled={false}
      isOnly={false}
      modelFieldsCache={FIELDS}
      onModelChange={() => {}}
    />,
  );

test("Deadline: 'Alert once' by default, with the 3-hourly box off", () => {
  row(schedule());
  expect(screen.getByText("Deadline (h)")).toBeInTheDocument();
  expect(screen.getByLabelText("Alert once")).toBeChecked();
  expect(screen.getByLabelText("Alert every day until done")).not.toBeChecked();
  expect(screen.getByLabelText("Check every 3 hours (not only at 2 AM)")).not.toBeChecked();
  expect(screen.getByText(/Alerts once if nothing has been recorded since admission/)).toBeInTheDocument();
});

test("choosing 'every day' and the 3-hourly check updates the schedule", () => {
  const onChange = jest.fn();
  row(schedule(), onChange);
  fireEvent.click(screen.getByLabelText("Alert every day until done"));
  expect(onChange).toHaveBeenLastCalledWith(0, "schedule", expect.objectContaining({ repeat: "DAILY", intervalHours: "2" }));
  fireEvent.click(screen.getByLabelText("Check every 3 hours (not only at 2 AM)"));
  expect(onChange).toHaveBeenLastCalledWith(0, "schedule", expect.objectContaining({ checkEvery3Hours: true }));
});

test("a saved 'every day' rule shows as such", () => {
  row(schedule({ repeat: "DAILY", checkEvery3Hours: true }));
  expect(screen.getByLabelText("Alert every day until done")).toBeChecked();
  expect(screen.getByLabelText("Check every 3 hours (not only at 2 AM)")).toBeChecked();
  expect(screen.getByText(/then every 24 hours until something is recorded/)).toBeInTheDocument();
});

test("other cycles don't show the Deadline options", () => {
  row(schedule({ period: DAYS, days: [1] }));
  expect(screen.queryByText("After the deadline")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Check every 3 hours (not only at 2 AM)")).not.toBeInTheDocument();
});
