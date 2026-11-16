// "Independent Admission" is not shown in the patient header or the ADMISSION
// TYPE card (owner decision, 2026-11-16): an independent admission reads
// "Minor (below 18)" / "Adult (18+)" alone. Other types keep their name.
import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { createStore } from "redux";
import AdmissionTypeSummary from "../Components/AdmissionTypeSummary";
import {
  admissionTypeSummaryLabel,
  getAdmissionTypeDetailParts,
} from "../../../../utils/admissionType";

const entry = (fields) => ({
  ...fields,
  assignedAt: "2026-11-10T00:00:00.000Z",
  recordedAt: "2026-11-10T00:00:00.000Z",
});

// The patient header builds its "Admission Type:" line exactly like this
// (PatientTopbar.js).
const headerLine = (data) =>
  [admissionTypeSummaryLabel(data), ...getAdmissionTypeDetailParts(data)]
    .filter(Boolean)
    .join(" · ");

describe("admission type name in the header and card", () => {
  test("independent: no type name, just adult / minor", () => {
    expect(
      headerLine({ admissionType: "INDEPENDENT_ADMISSION", adultationType: "MINOR" }),
    ).toBe("Minor (below 18)");
    expect(
      headerLine({ admissionType: "INDEPENDENT_ADMISSION", adultationType: "ADULT" }),
    ).toBe("Adult (18+)");
  });

  test("independent with no adult / minor saved (older records) keeps the name", () => {
    expect(headerLine({ admissionType: "INDEPENDENT_ADMISSION" })).toBe(
      "Independent Admission",
    );
  });

  test("supportive and emergency keep their name", () => {
    expect(
      headerLine({ admissionType: "SUPPORTIVE_ADMISSION", supportType: "UPTO30DAYS" }),
    ).toBe("Supportive Admission · Upto 30 days");
    expect(
      headerLine({ admissionType: "EMERGENCY_ADMISSION", emergencyType: "Risk to self" }),
    ).toBe("Emergency Admission · Risk to self");
  });

  test("nothing recorded: empty", () => {
    expect(admissionTypeSummaryLabel(null)).toBe("");
    expect(admissionTypeSummaryLabel({})).toBe("");
  });
});

const renderCard = (history, extra = {}) =>
  render(
    <Provider
      store={createStore(() => ({
        Patient: {
          patient: {
            isAdmit: true,
            addmission: { _id: "a1", admissionTypeHistory: history, ...extra },
          },
        },
      }))}
    >
      <AdmissionTypeSummary />
    </Provider>,
  );

describe("ADMISSION TYPE card", () => {
  test("independent minor: one line, Minor (below 18), not greyed", () => {
    renderCard([
      entry({ admissionType: "INDEPENDENT_ADMISSION", adultationType: "MINOR" }),
    ]);
    expect(screen.getByText("ADMISSION TYPE")).toBeInTheDocument();
    expect(screen.queryByText("Independent Admission")).not.toBeInTheDocument();
    expect(screen.getByText("Minor (below 18)")).not.toHaveClass("text-muted");
  });

  test("supportive: name, then the detail in grey", () => {
    renderCard([
      entry({ admissionType: "SUPPORTIVE_ADMISSION", supportType: "BEYOND30DAYS" }),
    ]);
    expect(screen.getByText("Supportive Admission")).toBeInTheDocument();
    expect(screen.getByText("Beyond 30 days Upto 90 days")).toHaveClass(
      "text-muted",
    );
  });

  test("independent with no adult / minor saved still shows the name", () => {
    renderCard([entry({ admissionType: "INDEPENDENT_ADMISSION" })]);
    expect(screen.getByText("Independent Admission")).toBeInTheDocument();
  });

  test("geriatric still shows in place of the type", () => {
    renderCard(
      [entry({ admissionType: "INDEPENDENT_ADMISSION", adultationType: "MINOR" })],
      { patientAdmissionType: "geriatric" },
    );
    expect(screen.getByText("Geriatric")).toBeInTheDocument();
    expect(screen.queryByText("Minor (below 18)")).not.toBeInTheDocument();
  });

  test("no type recorded: no card", () => {
    renderCard([]);
    expect(screen.queryByText("ADMISSION TYPE")).not.toBeInTheDocument();
  });
});
