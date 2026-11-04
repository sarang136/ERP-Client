/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { usePermissions } from "../../../Components/Hooks/useRoles.js";
import * as agentApi from "../../../helpers/marketingAgentApi";
import MarketingAgent from "..";

jest.mock("react-toastify", () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));
jest.mock("../../../helpers/marketingAgentApi");
jest.mock("../../../Components/Hooks/useRoles.js", () => ({
  usePermissions: jest.fn(),
}));
jest.mock("../../AuthenticationInner/Errors/Basic404", () => () => (
  <div>Not found page</div>
));

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/marketing-agent/*" element={<MarketingAgent />} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  agentApi.getCities.mockResolvedValue({
    items: [{ slug: "pune", name: "Pune", active: true }],
    total: 1,
  });
  agentApi.getCallQueue.mockResolvedValue({ items: [], total: 0 });
});

test("only screens granted in Roles & Permissions are shown", async () => {
  usePermissions.mockReturnValue({
    loading: false,
    hasPermission: (module, sub) =>
      module === "MARKETING_AGENT" && sub === "ENQUIRIES",
  });
  renderAt("/marketing-agent/plans");

  expect(await screen.findByText("Enquiry call queue")).toBeInTheDocument();
  expect(screen.getAllByText("Call Queue").length).toBeGreaterThan(0);
  expect(screen.queryByText("Weekly Plans")).not.toBeInTheDocument();
  expect(screen.queryByText("Brand Brain")).not.toBeInTheDocument();
});

test("no AI agent permissions shows the not found page", () => {
  usePermissions.mockReturnValue({
    loading: false,
    hasPermission: () => false,
  });
  renderAt("/marketing-agent");
  expect(screen.getByText("Not found page")).toBeInTheDocument();
});
