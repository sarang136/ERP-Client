// How the rule editor shows Admission / Patient state checks — the blocks of the
// "Emergency Admission Type Change" and signed-form SOPs — and conditions it
// doesn't recognise.
//
//   npx craco test --watchAll=false src/pages/SopConfigs/components/__tests__/ConditionRow.stateCheck.test.js

import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import ConditionRow from "../ConditionRow";
import {
  PERIOD_OPTIONS,
  isStateCheckCondition,
} from "../../../../Components/constants/sopConstants";

jest.mock("../../../../helpers/backend_helper", () => ({
  getICDCodes: jest.fn(() => Promise.resolve({ data: [] })),
  sopGetLabTests: jest.fn(() => Promise.resolve({ tests: [], panels: [] })),
}));

// Field lists as GET /sop/fields/:model returns them, after SOPForm maps them.
const FIELDS = {
  Addmission: [
    { value: "addmissionDate", label: "Addmission Date", type: "Date" },
    { value: "consentformURL", label: "Signed Consent Form (consentformURL)", type: "Array" },
    {
      value: "admissionTypeCurrent",
      label: "Admission Type (current)",
      type: "String",
      enumValues: [
        { value: "INDEPENDENT_ADMISSION", label: "Independent Admission" },
        { value: "SUPPORTIVE_ADMISSION", label: "Supportive Admission" },
        { value: "EMERGENCY_ADMISSION", label: "Emergency Admission" },
      ],
    },
    { value: "admissionTypeSince", label: "Admission Type Since (when the current type started)", type: "Date" },
    { value: "patientCategory", label: "Patient Category", type: "PatientCategory", enumValues: [] },
  ],
  VitalSign: [{ value: "FIELD_EXISTS", label: "Record Exists ?", type: "FIELD_EXISTS" }],
};

const ADMISSION = { value: "Addmission", label: "Admission" };
const DELAYED = { value: "DELAYED", label: "DELAYED" };
const IMMEDIATE = { value: "IMMEDIATE", label: "IMMEDIATE" };
// What SOPForm hydrates a saved condition with no schedule to: the default
// "Deadline" cycle — the box the screenshots showed.
const DEFAULT_SCHEDULE = { period: PERIOD_OPTIONS[0], days: [], daysOnwards: false, intervalHours: "", graceHours: 0, bands: [] };

const row = (condition, props = {}) =>
  render(
    <ConditionRow
      condition={{ schedule: DEFAULT_SCHEDULE, value: [], ...condition }}
      idx={0}
      onChange={() => {}}
      onRemove={() => {}}
      isDisabled={false}
      isOnly={false}
      modelFieldsCache={FIELDS}
      onModelChange={() => {}}
      {...props}
    />,
  );

const NOTE_DAILY = /Checked every day at 2:00 AM — alerts once a day while this is true/;

describe("Emergency Admission Type Change — target blocks", () => {
  test.each([
    ["Mild", ["0", "24"]],
    ["Moderate", ["24", "72"]],
  ])("%s block: field, 'Age between (hours)' with from/to, the daily note, no Cycle box", (_, value) => {
    row({
      model: ADMISSION,
      field: "admissionTypeSince",
      operator: { value: "AGE_BETWEEN_HOURS", label: "Age between (hours)" },
      triggerType: DELAYED,
      value,
    });
    expect(screen.getByText("Admission Type Since (when the current type started)")).toBeInTheDocument();
    expect(screen.getByText("Age between (hours)")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("from h")).toHaveValue(Number(value[0]));
    expect(screen.getByPlaceholderText("to h")).toHaveValue(Number(value[1]));
    expect(screen.getByText(NOTE_DAILY)).toBeInTheDocument();
    expect(screen.queryByText("Cycle")).not.toBeInTheDocument();
    expect(screen.queryByText("Deadline (N hours after admission)")).not.toBeInTheDocument();
    expect(screen.queryByText(/Suppress this reminder/)).not.toBeInTheDocument();
    expect(screen.queryByText(/not recognised/)).not.toBeInTheDocument();
  });

  test("High block: 'Older than (hours)' 72", () => {
    row({
      model: ADMISSION,
      field: "admissionTypeSince",
      operator: { value: "OLDER_THAN_HOURS", label: "Older than (hours)" },
      triggerType: DELAYED,
      value: ["72"],
    });
    expect(screen.getByText("Older than (hours)")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("hours (e.g. 24)")).toHaveValue(72);
    expect(screen.getByText(NOTE_DAILY)).toBeInTheDocument();
    expect(screen.queryByText("Cycle")).not.toBeInTheDocument();
  });
});

describe("Satisfying Criteria", () => {
  test("Admission Type (current) shows a dropdown with Emergency Admission", () => {
    row(
      {
        model: ADMISSION,
        field: "admissionTypeCurrent",
        operator: { value: "EQUALS", label: "EQUALS" },
        triggerType: IMMEDIATE,
        value: ["EMERGENCY_ADMISSION"],
      },
      { isCriteria: true, disableTrigger: true },
    );
    expect(screen.getByText("Admission Type (current)")).toBeInTheDocument();
    expect(screen.getByText("Emergency Admission")).toBeInTheDocument();
    expect(screen.queryByText(NOTE_DAILY)).not.toBeInTheDocument();
  });
});

describe("other state checks and cadence rules", () => {
  test("signed consent form block: daily note, no Cycle box", () => {
    row({ model: ADMISSION, field: "consentformURL", operator: { value: "NOT_EXISTS", label: "NOT EXISTS" }, triggerType: DELAYED });
    expect(screen.getByText(NOTE_DAILY)).toBeInTheDocument();
    expect(screen.queryByText("Cycle")).not.toBeInTheDocument();
  });

  test("diagnosis field: 'once per admission' note", () => {
    row({ model: ADMISSION, field: "patientCategory", operator: { value: "EQUALS", label: "EQUALS" }, triggerType: DELAYED, value: ["ADDICTION"] });
    expect(screen.getByText(/alerts once per admission when this is true/)).toBeInTheDocument();
  });

  test("a cadence reminder (Vital Signs) still has its Cycle box", () => {
    row({ model: { value: "VitalSign", label: "Vital Sign" }, field: "FIELD_EXISTS", operator: { value: "EXISTS", label: "EXISTS" }, triggerType: DELAYED });
    expect(screen.getByText("Cycle")).toBeInTheDocument();
    expect(screen.getByText(/Suppress this reminder/)).toBeInTheDocument();
    expect(screen.queryByText(NOTE_DAILY)).not.toBeInTheDocument();
  });

  test("isStateCheckCondition: DELAYED Admission / Patient only", () => {
    expect(isStateCheckCondition({ model: ADMISSION, triggerType: DELAYED })).toBe(true);
    expect(isStateCheckCondition({ model: { value: "Patient" }, triggerType: DELAYED })).toBe(true);
    expect(isStateCheckCondition({ model: ADMISSION, triggerType: IMMEDIATE })).toBe(false);
    expect(isStateCheckCondition({ model: { value: "VitalSign" }, triggerType: DELAYED })).toBe(false);
  });
});

describe("conditions this app version doesn't recognise", () => {
  test("unknown operator: shown by name with a warning, not swapped for EXISTS", () => {
    row({
      model: ADMISSION,
      field: "admissionTypeSince",
      operator: { value: "SOME_NEW_OP", label: "SOME_NEW_OP (not recognised)", unknown: true },
      triggerType: DELAYED,
    });
    expect(screen.getByText("SOME_NEW_OP (not recognised)")).toBeInTheDocument();
    expect(screen.getByText(/which this version of the app doesn't recognise/)).toBeInTheDocument();
    expect(screen.queryByText("EXISTS")).not.toBeInTheDocument();
  });

  test("unknown field: shown by name with a warning instead of 'Select field'", () => {
    row({
      model: ADMISSION,
      field: "someNewField",
      operator: { value: "EQUALS", label: "EQUALS" },
      triggerType: IMMEDIATE,
      value: ["x"],
    });
    expect(screen.getByText("someNewField (not recognised)")).toBeInTheDocument();
    expect(screen.getByText(/which this version of the app doesn't recognise/)).toBeInTheDocument();
    expect(screen.queryByText("Select field")).not.toBeInTheDocument();
  });
});
