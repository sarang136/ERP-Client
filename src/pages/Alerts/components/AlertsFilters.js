import { useEffect, useState } from "react";
import Flatpickr from "react-flatpickr";
import AsyncSelect from "react-select/async";
import Select from "react-select";
import "flatpickr/dist/themes/material_blue.css";
import { Button, ButtonGroup, Row, Col } from "reactstrap";
import { useDispatch, useSelector } from "react-redux";
import { usePermissions } from "../../../Components/Hooks/useRoles";
import { fetchAllCenters } from "../../../store/features/center/centerSlice";
import {
  DEFAULT_RESOLVED_STATE,
  SEVERITIES,
  SEVERITY_COLOR,
} from "./alertConstants";
import { endOfDay, startOfDay } from "date-fns";
import {
  getSearchPatients,
  listSopRules,
  sopGetRoles,
} from "../../../helpers/backend_helper";
import CenterDropdown from "../../Report/Components/Doctor/components/CenterDropDown";
import { ALERT_CATEGORY_OPTIONS } from "../../../Components/constants/sopConstants";

const READ_STATES = [
  { k: "all", label: "All" },
  { k: "unread", label: "Unread" },
  { k: "read", label: "Read" },
];

const PHASE_STATES = [
  { k: "all", label: "All" },
  { k: "IMMEDIATE", label: "Immediate" },
  { k: "DELAYED", label: "Delayed" },
];

// Who closed the alert. "System" = the daily sweep that resolves alerts once the
// patient's stay is over (discharged / admission deleted).
const RESOLVED_BY_STATES = [
  { k: "all", label: "All" },
  { k: "staff", label: "Staff" },
  { k: "system", label: "System" },
];

const RESOLVED_STATES = [
  { k: "all", label: "All" },
  { k: "unresolved", label: "Unresolved" },
  { k: "resolved", label: "Resolved" },
];

// What produced the alert. This is the ONLY way to isolate baseline-package
// alerts: they carry no `rule`, so the SOP-name dropdown above can never reach
// them.
const SOURCE_STATES = [
  { k: "all", label: "All" },
  { k: "SOP_RULE", label: "SOP Rules" },
  { k: "BASELINE_INVESTIGATION", label: "Baseline Package" },
];

const AlertsFilters = ({
  total,
  serverFilters,
  onServerFilterChange,
  onClearServerFilters,
  onToggleSeverity,
  onClearSeverity,
}) => {
  const dispatch = useDispatch();
  const centerAccess = useSelector((s) => s.User?.centerAccess);
  const allCenters = useSelector((s) => s.Center?.data);
  const everyCenter = useSelector((s) => s.Center?.allCenters);

  // ALERT → ALL_CENTRES: the server returns alerts from every center, so the
  // Center filter (pre-selected below) must offer every center too — otherwise
  // it would narrow the inbox back to the user's own centers.
  const microUser = localStorage.getItem("micrologin");
  const token = microUser ? JSON.parse(microUser).token : null;
  const { loading: permissionLoading, hasPermission } = usePermissions(token);
  const allCentresScope = hasPermission("ALERT", "ALL_CENTRES", "READ");

  useEffect(() => {
    if (allCentresScope && !everyCenter?.length) dispatch(fetchAllCenters());
  }, [allCentresScope, everyCenter?.length, dispatch]);

  // Routed-role options: the same role list the SOP rule's routing picker uses,
  // so every role an alert can be routed to is selectable.
  const [roleOptions, setRoleOptions] = useState([]);
  useEffect(() => {
    let alive = true;
    sopGetRoles()
      .then((res) => {
        const list = (Array.isArray(res) && res) || res?.data || [];
        if (alive)
          setRoleOptions(
            list.map((r) => ({ value: r.name, label: r.name })),
          );
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Center options scoped to the user's center access — same source the
  // Finance report uses. centerAccess may be a list of ids or of objects.
  // Empty until the role has loaded, so the pre-selection below runs once,
  // with the right set.
  const accessIds = (centerAccess || []).map((c) => c?._id || c);
  const centerOptions = (
    permissionLoading
      ? []
      : allCentresScope
        ? everyCenter || []
        : (allCenters || []).filter((c) => accessIds.includes(c._id))
  ).map((c) => ({ _id: c._id, title: c.title }));

  // Pre-select all centers on initial load so alerts aren't filtered to none.
  useEffect(() => {
    if (
      centerOptions.length > 0 &&
      (!serverFilters.centers || serverFilters.centers.length === 0)
    ) {
      onServerFilterChange(
        "centers",
        centerOptions.map((c) => c._id),
      );
    }
    // Only run when centerOptions first become available
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerOptions.length]);

  const hasAnyServerFilter =
    serverFilters.patients?.length > 0 ||
    serverFilters.rules?.length > 0 ||
    serverFilters.categories?.length > 0 ||
    serverFilters.centers?.length > 0 ||
    serverFilters.roles?.length > 0 ||
    !!serverFilters.dateFrom ||
    !!serverFilters.dateTo ||
    serverFilters.readState !== "all" ||
    serverFilters.phase !== "all" ||
    serverFilters.resolvedState !== DEFAULT_RESOLVED_STATE ||
    (serverFilters.resolvedBy || "all") !== "all" ||
    serverFilters.source !== "all" ||
    serverFilters.severity?.length > 0;

  // ── Loaders for the AsyncSelect dropdowns ──

  // Patients: searches by name; respects center access scope. Empty input
  // returns no options (mirrors the existing patient search pattern).
  const loadPatientOptions = async (input) => {
    if (!input || input.trim().length < 1) return [];
    try {
      const res = await getSearchPatients({
        name: input,
        centerAccess: allCentresScope
          ? centerOptions.map((c) => c._id)
          : centerAccess?.map?.((c) => c._id) || centerAccess,
      });
      const list = res?.data || res?.payload || res || [];
      return list.map((p) => ({
        value: p._id,
        label: `${p.name}${p.id?.value ? ` (UID ${p.id.value})` : p.patientId ? ` (${p.patientId})` : ""}`,
      }));
    } catch (err) {
      return [];
    }
  };

  // SOP rules: searches by ruleName + protocol via the existing listSopRules
  // endpoint (regex match on ruleName). Empty input returns first page so the
  // user gets a starter set on first focus.
  const loadRuleOptions = async (input) => {
    try {
      const res = await listSopRules({ search: input || undefined });
      const list = res?.data || res?.payload || [];
      return list.map((r) => ({
        value: r._id,
        label: r.protocol ? `${r.ruleName} — ${r.protocol}` : r.ruleName,
      }));
    } catch (err) {
      return [];
    }
  };

  const handleDateChange = (dates) => {
    const dateFrom = dates?.[0];
    const dateTo = dates?.[1];
    if (!dateFrom || !dateTo) return;
    onServerFilterChange("dateFrom", startOfDay(dateFrom).toISOString());
    onServerFilterChange("dateTo", endOfDay(dateTo).toISOString());
  };

  // Back to all dates (the default).
  const clearDates = () => {
    onServerFilterChange("dateFrom", null);
    onServerFilterChange("dateTo", null);
  };

  const flatpickrValue = serverFilters.dateFrom
    ? [
      new Date(serverFilters.dateFrom),
      serverFilters.dateTo
        ? new Date(serverFilters.dateTo)
        : new Date(serverFilters.dateFrom),
    ]
    : [];

  return (
    <div className="mb-3 p-2 bg-light rounded">
      {/* Row 1 — Patient + SOP Category + SOP Rule multi-selects + dates */}
      <Row className="g-2 mb-2 align-items-end">
        <Col md={3}>
          <small className="text-muted d-block mb-1">
            <i className="bx bx-user-circle me-1" />
            Patient
          </small>
          <AsyncSelect
            isMulti
            cacheOptions
            defaultOptions={false}
            loadOptions={loadPatientOptions}
            value={serverFilters.patients || []}
            onChange={(v) => onServerFilterChange("patients", v || [])}
            placeholder="Type patient name or uid..."
            noOptionsMessage={({ inputValue }) =>
              inputValue ? "No patients found" : "Type to search..."
            }
          />
        </Col>
        <Col md={3}>
          <small className="text-muted d-block mb-1">
            <i className="bx bx-category me-1" />
            SOP Category
          </small>
          {/* Matches by the alert's rule, so older alerts filter too.
              Baseline Package alerts are the Baseline Lab category. */}
          <Select
            isMulti
            options={ALERT_CATEGORY_OPTIONS}
            value={ALERT_CATEGORY_OPTIONS.filter((o) =>
              (serverFilters.categories || []).includes(o.value),
            )}
            onChange={(v) =>
              onServerFilterChange(
                "categories",
                (v || []).map((o) => o.value),
              )
            }
            placeholder="All categories"
          />
        </Col>
        <Col md={3}>
          <small className="text-muted d-block mb-1">
            <i className="bx bx-list-check me-1" />
            SOP Rule (name or protocol)
          </small>
          <AsyncSelect
            isMulti
            cacheOptions
            defaultOptions
            loadOptions={loadRuleOptions}
            value={serverFilters.rules || []}
            onChange={(v) => onServerFilterChange("rules", v || [])}
            placeholder="Type rule name or protocol..."
          />
        </Col>
        <Col md={3}>
          <small className="text-muted d-flex align-items-center mb-1">
            Date range
            {serverFilters.dateFrom && (
              <Button
                color="link"
                size="sm"
                className="p-0 ms-auto"
                style={{ fontSize: "inherit" }}
                onClick={clearDates}
              >
                <i className="bx bx-x me-1" />
                All dates
              </Button>
            )}
          </small>
          <Flatpickr
            key={serverFilters.dateFrom + "-" + serverFilters.dateTo}
            className="form-control form-control-sm"
            placeholder="All dates"
            options={{ mode: "range", dateFormat: "Y-m-d" }}
            value={flatpickrValue}
            onChange={handleDateChange}
          />
        </Col>
      </Row>

      {/* Row 2 — Center + Read state + Phase + Severity + Clear */}
      <div className="d-flex flex-wrap gap-3 align-items-center">
        <CenterDropdown
          options={centerOptions}
          value={serverFilters.centers || []}
          onChange={(ids) => onServerFilterChange("centers", ids)}
          className=""
        />

        {/* Alerts routed to ANY of the picked roles. Narrows what the user
            can already see; it never shows alerts outside their access. */}
        <div style={{ minWidth: 240 }}>
          <Select
            isMulti
            options={roleOptions}
            value={roleOptions.filter((o) =>
              (serverFilters.roles || []).includes(o.value),
            )}
            onChange={(v) =>
              onServerFilterChange(
                "roles",
                (v || []).map((o) => o.value),
              )
            }
            placeholder="All routed roles"
          />
        </div>

        <ButtonGroup size="sm">
          {READ_STATES.map(({ k, label }) => (
            <Button
              key={k}
              color={serverFilters.readState === k ? "primary" : "secondary"}
              outline={serverFilters.readState !== k}
              onClick={() => onServerFilterChange("readState", k)}
            >
              {label}
            </Button>
          ))}
        </ButtonGroup>

        <div className="d-flex gap-1 align-items-center">
          <small className="text-muted me-1">Phase:</small>
          {PHASE_STATES.map(({ k, label }) => (
            <Button
              key={k}
              color={serverFilters.phase === k ? "primary" : "secondary"}
              outline={serverFilters.phase !== k}
              size="sm"
              onClick={() => onServerFilterChange("phase", k)}
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="d-flex gap-1 align-items-center">
          <small className="text-muted me-1">Source:</small>
          {SOURCE_STATES.map(({ k, label }) => (
            <Button
              key={k}
              color={serverFilters.source === k ? "primary" : "secondary"}
              outline={serverFilters.source !== k}
              size="sm"
              onClick={() => onServerFilterChange("source", k)}
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="d-flex gap-1 align-items-center">
          <small className="text-muted me-1">Resolution:</small>
          {RESOLVED_STATES.map(({ k, label }) => (
            <Button
              key={k}
              color={serverFilters.resolvedState === k ? "primary" : "secondary"}
              outline={serverFilters.resolvedState !== k}
              size="sm"
              onClick={() => onServerFilterChange("resolvedState", k)}
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="d-flex gap-1 align-items-center">
          <small className="text-muted me-1">Resolved by:</small>
          {RESOLVED_BY_STATES.map(({ k, label }) => (
            <Button
              key={k}
              color={serverFilters.resolvedBy === k ? "primary" : "secondary"}
              outline={serverFilters.resolvedBy !== k}
              size="sm"
              onClick={() => onServerFilterChange("resolvedBy", k)}
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="d-flex gap-1 align-items-center">
          <small className="text-muted me-1">Severity:</small>
          {SEVERITIES.map((sev) => {
            const active = serverFilters.severity?.includes(sev);
            return (
              <Button
                key={sev}
                color={active ? SEVERITY_COLOR[sev] : "secondary"}
                outline={!active}
                size="sm"
                onClick={() => onToggleSeverity(sev)}
              >
                {sev}
              </Button>
            );
          })}
          {serverFilters.severity?.length > 0 && (
            <Button color="link" size="sm" onClick={onClearSeverity}>
              Clear
            </Button>
          )}
        </div>

        <div className="ms-auto d-flex gap-2 align-items-center">
          <small className="text-muted">
            {total} alert{total === 1 ? "" : "s"}
          </small>
          {hasAnyServerFilter && (
            <Button
              color="link"
              size="sm"
              onClick={onClearServerFilters}
              className="p-0"
            >
              <i className="bx bx-x-circle me-1" />
              Clear all filters
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertsFilters;
