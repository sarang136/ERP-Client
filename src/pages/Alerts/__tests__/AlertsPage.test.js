// Alerts page (/alert): opens on every unresolved alert with no date range,
// the date range can be cleared back to "All dates", the Resolution column
// comes first (pinned by AlertsList.css), and the Doctor / Psychologist / MSW /
// RMO / Nurse / Center Manager columns list who in each role sees the alert.
//
//   CI=true npx craco test --watchAll=false src/pages/Alerts/__tests__/AlertsPage.test.js

import React from "react";
import "@testing-library/jest-dom";
import { act, fireEvent, render, renderHook, screen, within } from "@testing-library/react";
import { Provider } from "react-redux";
import { createStore } from "redux";
import { MemoryRouter } from "react-router-dom";
import * as api from "../../../helpers/backend_helper";
import { usePermissions } from "../../../Components/Hooks/useRoles";
import { useAlertsInbox, buildServerParams } from "../components/useAlertsInbox";
import AlertsFilters from "../components/AlertsFilters";
import AlertsList from "../components/AlertsList";

jest.mock("../../../helpers/backend_helper", () => ({
  getAllSopAlerts: jest.fn(),
  markSopAlertRead: jest.fn(),
  markAllSopAlertsRead: jest.fn(),
  resolveSopAlert: jest.fn(),
  addAlertNote: jest.fn(),
  getSearchPatients: jest.fn(),
  listSopRules: jest.fn(),
  sopGetRoles: jest.fn(),
}));
jest.mock("../../../Components/Hooks/useRoles", () => ({ usePermissions: jest.fn() }));
jest.mock("../../Report/Components/Doctor/components/CenterDropDown", () => () => null);
// A plain input stands in for the date picker.
jest.mock("react-flatpickr", () => (props) => (
  <input data-testid="date-range" placeholder={props.placeholder} readOnly value={props.value?.length ? "picked" : ""} />
));

const store = createStore(() => ({ User: { centerAccess: [] }, Center: { data: [], allCenters: [] } }));

// Requests stay pending: these tests look at what is asked for and how the
// page starts, not at the replies (and pending replies cause no late updates).
const pending = () => new Promise(() => {});

beforeEach(() => {
  api.getAllSopAlerts.mockImplementation(pending);
  api.listSopRules.mockImplementation(pending);
  api.sopGetRoles.mockImplementation(pending);
  usePermissions.mockReturnValue({ loading: false, hasPermission: () => false });
});

describe("Alerts inbox defaults", () => {
  test("opens on unresolved alerts with no date range", () => {
    const { result } = renderHook(() => useAlertsInbox());

    expect(result.current.serverFilters.dateFrom).toBeNull();
    expect(result.current.serverFilters.dateTo).toBeNull();
    expect(result.current.serverFilters.resolvedState).toBe("unresolved");

    const params = api.getAllSopAlerts.mock.calls[0][0];
    expect(params).toEqual({ page: 1, pageSize: 50, resolvedState: "unresolved" });
  });

  test("Clear all filters returns to the same defaults", () => {
    const { result } = renderHook(() => useAlertsInbox());
    act(() => {
      result.current.setServerFilter("resolvedState", "all");
      result.current.setServerFilter("dateFrom", "2026-11-01T00:00:00.000Z");
      result.current.setServerFilter("dateTo", "2026-11-02T00:00:00.000Z");
    });
    act(() => result.current.clearServerFilters());

    expect(result.current.serverFilters).toMatchObject({ dateFrom: null, dateTo: null, resolvedState: "unresolved" });
  });

  test("Resolution = All sends no resolution filter", () => {
    expect(buildServerParams({ resolvedState: "all" }, 1, 50)).toEqual({ page: 1, pageSize: 50 });
  });
});

describe("Alerts filter bar", () => {
  const renderFilters = (overrides = {}) => {
    const onServerFilterChange = jest.fn();
    const serverFilters = {
      patients: [], rules: [], categories: [], centers: [], roles: [],
      dateFrom: null, dateTo: null,
      readState: "all", phase: "all", resolvedState: "unresolved", resolvedBy: "all", source: "all",
      severity: [],
      ...overrides,
    };
    render(
      <Provider store={store}>
        <AlertsFilters
          total={0}
          serverFilters={serverFilters}
          onServerFilterChange={onServerFilterChange}
          onClearServerFilters={jest.fn()}
          onToggleSeverity={jest.fn()}
          onClearSeverity={jest.fn()}
        />
      </Provider>,
    );
    return { onServerFilterChange };
  };

  test("defaults: date is blank, Unresolved is selected, nothing to clear", () => {
    renderFilters();
    expect(screen.getByTestId("date-range")).toHaveValue("");
    expect(screen.getByTestId("date-range")).toHaveAttribute("placeholder", "All dates");
    expect(screen.queryByRole("button", { name: /all dates/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unresolved" })).toHaveClass("btn-primary");
    expect(screen.getByRole("button", { name: "Resolved" })).not.toHaveClass("btn-primary");
    expect(screen.queryByText(/clear all filters/i)).not.toBeInTheDocument();
  });

  test("a picked date range can be cleared back to all dates", () => {
    const { onServerFilterChange } = renderFilters({
      dateFrom: "2026-11-01T00:00:00.000Z",
      dateTo: "2026-11-02T00:00:00.000Z",
    });
    fireEvent.click(screen.getByRole("button", { name: /all dates/i }));
    expect(onServerFilterChange).toHaveBeenCalledWith("dateFrom", null);
    expect(onServerFilterChange).toHaveBeenCalledWith("dateTo", null);
  });

  test("Resolution = All counts as a filter to clear", () => {
    renderFilters({ resolvedState: "all" });
    expect(screen.getByText(/clear all filters/i)).toBeInTheDocument();
  });
});

describe("Alerts table", () => {
  const ROWS = [
    {
      _id: "a1", severity: "HIGH", message: "Open one", isRead: true, patient: { _id: "p1", name: "Ravi" },
      routing: { notifyRoles: ["NURSE", "ADMIN"], notifyAdmissionDoctor: true },
      recipients: {
        DOCTOR: [{ _id: "u1", name: "Dr Dev", via: "PATIENT_DOCTOR" }],
        PSYCHOLOGIST: [],
        MSW: [],
        RMO: [{ _id: "u2", name: "Ravi RMO", via: "PICKED" }],
        NURSE: [{ _id: "u3", name: "Asha", via: "ROLE" }, { _id: "u4", name: "Nina", via: "ROLE" }],
        MANAGER: [],
      },
    },
    {
      _id: "a2", severity: "LOW", message: "Closed one", isRead: true, patient: { _id: "p2", name: "Asha" },
      resolution: { resolved: true, resolvedByName: "Dr Rao", resolvedAt: "2026-11-10T10:00:00.000Z" },
    },
  ];

  const renderList = () => {
    const onResolve = jest.fn();
    render(
      <Provider store={store}>
        <MemoryRouter>
          <AlertsList
            alerts={ROWS}
            total={2}
            page={1}
            pageSize={50}
            loading={false}
            canResolve
            onSelect={jest.fn()}
            onResolve={onResolve}
            onAddNote={jest.fn()}
            onPageChange={jest.fn()}
            onPageSizeChange={jest.fn()}
          />
        </MemoryRouter>
      </Provider>,
    );
    return { onResolve };
  };

  // Body rows only (the header row has no cells), and each one's first cell.
  const firstCells = () =>
    screen
      .getAllByRole("row")
      .filter((r) => within(r).queryAllByRole("cell").length)
      .map((r) => within(r).getAllByRole("cell")[0]);

  test("Resolution is the first column, keyed for the pinning styles", () => {
    renderList();
    // AlertsList.css hangs the pinning off this wrapper class.
    // eslint-disable-next-line testing-library/no-node-access
    expect(screen.getByRole("table").closest(".sop-alerts-table")).toBeInTheDocument();
    const firstHead = screen.getAllByRole("columnheader")[0];
    expect(firstHead).toHaveAttribute("data-column-id", "resolution");
    expect(firstHead).toHaveTextContent("Resolution");
    expect(screen.queryByText("Action")).not.toBeInTheDocument();

    const [open, closed] = firstCells();
    expect(open).toHaveAttribute("data-column-id", "resolution");
    expect(closed).toHaveAttribute("data-column-id", "resolution");
    expect(within(open).getByRole("button", { name: /resolve/i })).toBeInTheDocument();
    expect(within(closed).getByText("Resolved")).toBeInTheDocument();
    expect(within(closed).getByText("Dr Rao")).toBeInTheDocument();
  });

  test("Resolve still opens the resolve step for that alert", () => {
    const { onResolve } = renderList();
    fireEvent.click(within(firstCells()[0]).getByRole("button", { name: /resolve/i }));
    expect(onResolve).toHaveBeenCalledWith(ROWS[0]);
  });
});

describe("Alerts table role columns", () => {
  const ROWS = [
    {
      _id: "a1", severity: "HIGH", message: "Open one", isRead: true, patient: { _id: "p1", name: "Ravi" },
      routing: { notifyRoles: ["NURSE", "ADMIN"], notifyAdmissionDoctor: true },
      recipients: {
        DOCTOR: [{ _id: "u1", name: "Dr Dev", via: "PATIENT_DOCTOR" }],
        PSYCHOLOGIST: [],
        MSW: [],
        RMO: [{ _id: "u2", name: "Ravi RMO", via: "PICKED" }],
        NURSE: [{ _id: "u3", name: "Asha", via: "ROLE" }, { _id: "u4", name: "Nina", via: "ROLE" }],
        MANAGER: [],
      },
    },
    // A row from before the server sent recipients (or a live-pushed one).
    { _id: "a2", severity: "LOW", message: "Older", isRead: true, patient: { _id: "p2", name: "Asha" } },
  ];

  const renderList = () =>
    render(
      <Provider store={store}>
        <MemoryRouter>
          <AlertsList
            alerts={ROWS}
            total={2}
            page={1}
            pageSize={50}
            loading={false}
            canResolve
            onSelect={jest.fn()}
            onResolve={jest.fn()}
            onAddNote={jest.fn()}
            onPageChange={jest.fn()}
            onPageSizeChange={jest.fn()}
          />
        </MemoryRouter>
      </Provider>,
    );

  const cellOf = (rowIndex, role) =>
    within(
      screen.getAllByRole("row").filter((r) => within(r).queryAllByRole("cell").length)[rowIndex],
    )
      .getAllByRole("cell")
      .find((c) => c.getAttribute("data-column-id") === `recipients-${role}`);

  test("six role columns come right after Routed To", () => {
    renderList();
    const heads = screen.getAllByRole("columnheader").map((h) => h.textContent);
    const at = heads.indexOf("Routed To");
    expect(heads.slice(at + 1, at + 7)).toEqual(["Doctor", "Psychologist", "MSW", "RMO", "Nurse", "Center Manager"]);
    expect(heads[at + 7]).toBe("Message");
  });

  test("each lists who in that role sees the alert, with the reason when it isn't the whole role", () => {
    renderList();
    const nurse = cellOf(0, "NURSE");
    expect(within(nurse).getByText("Asha")).toBeInTheDocument();
    expect(within(nurse).getByText("Nina")).toBeInTheDocument();
    expect(within(nurse).queryByText(/picked|patient's/i)).not.toBeInTheDocument();

    expect(within(cellOf(0, "DOCTOR")).getByText("Dr Dev")).toBeInTheDocument();
    expect(within(cellOf(0, "DOCTOR")).getByText("Patient's doctor")).toBeInTheDocument();
    expect(within(cellOf(0, "RMO")).getByText("Picked by name")).toBeInTheDocument();
    expect(cellOf(0, "MANAGER")).toHaveTextContent("—");
  });

  test("a row without recipients shows a dash in every role column", () => {
    renderList();
    for (const role of ["DOCTOR", "PSYCHOLOGIST", "MSW", "RMO", "NURSE", "MANAGER"]) {
      expect(cellOf(1, role)).toHaveTextContent("—");
    }
  });
});
