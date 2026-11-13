// New series: any start date; the 1st–15th counts as the month's 1st half, the 16th on as the 2nd.
//
//   CI=true npx craco test --watchAll=false src/pages/TherapyLectures/__tests__/CreateSeriesModal.test.js

import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CreateSeriesModal, { suggestedStart } from "../components/CreateSeriesModal";
import { currentMonth, halfLongText, seriesLabel, shiftMonth } from "../helpers";
import * as api from "../../../helpers/backend_helper";

jest.mock("../../../helpers/backend_helper", () => ({ createLectureSeries: jest.fn() }));
jest.mock("../../../Components/Hooks/useAuthError", () => ({ useAuthError: () => () => false }));
jest.mock("../components/HostSelect", () => (props) => (
  <button type="button" onClick={() => props.onChange(["h1"])}>
    pick host
  </button>
));

const NEXT = shiftMonth(currentMonth(), 1); // a month whose series haven't ended
const open = (initial) =>
  render(
    <CreateSeriesModal
      isOpen
      toggle={() => {}}
      centreOptions={[{ value: "c1", label: "Pune" }]}
      initial={initial}
      onCreated={() => {}}
    />,
  );

beforeEach(() => {
  api.createLectureSeries.mockResolvedValue({ data: { _id: "s9" }, message: "created" });
});

test("suggested start: today when it falls in the chosen half, else that half's first day", () => {
  expect(suggestedStart({ month: "2026-11", half: 1 }, "2026-11-13")).toBe("2026-11-13");
  expect(suggestedStart({ month: "2026-11", half: 2 }, "2026-11-13")).toBe("2026-11-16");
  expect(suggestedStart({ month: "2026-11", half: 2 }, "2026-11-25")).toBe("2026-11-25");
  expect(suggestedStart({ month: "2026-12" }, "2026-11-13")).toBe("2026-12-01");
  expect(suggestedStart({ month: "2026-11" }, "2026-11-13")).toBe("2026-11-13");
  expect(suggestedStart({}, "2026-11-13")).toBe("2026-11-13");
});

test("picking the 25th shows the 2nd half and the 45 days; the 3rd shows the 1st half", () => {
  open({ center: "c1", month: NEXT, half: 2 });
  const input = screen.getByLabelText("Start date");
  expect(input).toHaveValue(`${NEXT}-16`);

  fireEvent.change(input, { target: { value: `${NEXT}-25` } });
  const summary = screen.getByTestId("tl-start-summary");
  expect(summary).toHaveTextContent(`Counts as the ${halfLongText(NEXT, 2)}`);
  expect(summary).toHaveTextContent(`Runs ${seriesLabel(`${NEXT}-25`)} · 45 days`);

  fireEvent.change(input, { target: { value: `${NEXT}-03` } });
  expect(screen.getByTestId("tl-start-summary")).toHaveTextContent(`Counts as the ${halfLongText(NEXT, 1)}`);
});

test("creates the series with the date picked", async () => {
  open({ center: "c1", month: NEXT, half: 2 });
  fireEvent.change(screen.getByLabelText("Start date"), { target: { value: `${NEXT}-25` } });
  fireEvent.click(screen.getByRole("button", { name: "Create series" }));
  expect(screen.getByText("Pick at least one host")).toBeInTheDocument();
  expect(api.createLectureSeries).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "pick host" }));
  fireEvent.click(screen.getByRole("button", { name: "Create series" }));
  await waitFor(() =>
    expect(api.createLectureSeries).toHaveBeenCalledWith({ center: "c1", startKey: `${NEXT}-25`, hosts: ["h1"] }),
  );
});

test("a date whose 45 days are over is refused", () => {
  open({ center: "c1" });
  fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2020-01-01" } });
  expect(screen.getByText("This series has already ended.")).toBeInTheDocument();
  expect(screen.queryByTestId("tl-start-summary")).not.toBeInTheDocument();
});
