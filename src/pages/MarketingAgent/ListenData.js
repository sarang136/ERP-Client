import React, { useCallback, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  Col,
  Nav,
  NavItem,
  NavLink,
  Row,
  Table,
} from "reactstrap";
import { getErpReport, getWebReport } from "../../helpers/marketingAgentApi";
import {
  DateRange,
  Empty,
  FilterSelect,
  Loading,
  PageHeader,
  Pager,
  SearchBox,
  formatDate,
  labelOf,
  useCities,
  usePagedList,
} from "./common";

const num = (n) => Number(n || 0).toLocaleString("en-IN");

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const WEB_SORTS = [
  ["sessions", "Most visits"],
  ["key_events", "Most call clicks"],
  ["engaged_sessions", "Most engaged visits"],
];

const CONDITIONS = [
  "addiction",
  "psychiatric",
  "dual_diagnosis",
  "elder_care",
  "developmental",
  "multiple",
  "alcohol",
  "drugs",
];

const sourceLabel = (s) =>
  String(s || "unknown")
    .replace(/^hubspot:/, "")
    .replace(/_\d{6,}$/, "")
    .replace(/_/g, " ");

const yesNo = (v) =>
  v ? (
    <Badge color="success">Yes</Badge>
  ) : (
    <span className="text-muted">No</span>
  );

const CityFilter = ({ value, onChange }) => {
  const cities = useCities();
  const options = [
    ...cities.map((c) => [c.slug, c.name]),
    ["unassigned", "No city"],
  ];
  return (
    <FilterSelect
      value={value}
      onChange={onChange}
      options={options}
      allLabel="All cities"
    />
  );
};

// Keep the selected value in the list even when the current breakdown no longer shows it.
const optionsFrom = (counts, selected, label = labelOf) => {
  const keys = (counts || []).map((c) => c.key).filter(Boolean);
  if (selected && !keys.includes(selected)) keys.unshift(selected);
  return keys.map((k) => [k, label(k)]);
};

const Breakdown = ({ title, counts, onPick, label = labelOf, unit }) => {
  const rows = (counts || []).slice(0, 8);
  const top = Math.max(1, ...rows.map((c) => c.n ?? c.sessions ?? 0));
  return (
    <Card className="h-100">
      <CardBody className="py-2" style={{ fontSize: 13 }}>
        <h6 className="mb-2">{title}</h6>
        {!rows.length && <div className="text-muted">Nothing yet.</div>}
        {rows.map((c) => {
          const value = c.n ?? c.sessions ?? 0;
          return (
            <div
              key={String(c.key)}
              className="mb-1"
              role={onPick && c.key ? "button" : undefined}
              onClick={() => onPick && c.key && onPick(c.key)}
              title={onPick && c.key ? "Filter by this" : undefined}
            >
              <div className="d-flex justify-content-between gap-2">
                <span className="text-truncate">
                  {c.key ? label(c.key) : "Not filled"}
                </span>
                <span className="text-nowrap">
                  {num(value)}
                  {unit}
                  {c.key_events != null && (
                    <span className="text-muted">
                      {" "}
                      · {num(c.key_events)} calls
                    </span>
                  )}
                </span>
              </div>
              <div
                style={{
                  height: 4,
                  borderRadius: 2,
                  background: "var(--bs-primary, #556ee6)",
                  opacity: 0.6,
                  width: `${Math.max(2, (100 * value) / top)}%`,
                }}
              />
            </div>
          );
        })}
      </CardBody>
    </Card>
  );
};

const useReport = (getter) => {
  const [report, setReport] = useState(null);
  const fetcher = useCallback(
    async (params) => {
      const result = await getter(params);
      setReport(result);
      return result.rows;
    },
    [getter],
  );
  return [report, fetcher];
};

const Website = () => {
  const [city, setCity] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("sessions");
  const [since, setSince] = useState(daysAgo(30));
  const [until, setUntil] = useState("");
  const [report, fetcher] = useReport(getWebReport);
  const list = usePagedList(fetcher, { city, q, sort, since, until }, 20);

  return (
    <>
      <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
        <CityFilter value={city} onChange={setCity} />
        <SearchBox onSearch={setQ} placeholder="Page address contains…" />
        <FilterSelect value={sort} onChange={setSort} options={WEB_SORTS} />
        <DateRange
          since={since}
          until={until}
          onSince={setSince}
          onUntil={setUntil}
        />
      </div>
      {report && (
        <Row className="g-3 mb-3">
          <Col md={4}>
            <Card className="h-100">
              <CardBody>
                <div className="text-muted" style={{ fontSize: 13 }}>
                  Website visits (GA4, jagrutirehab.org)
                </div>
                <h3 className="mb-0">{num(report.sessions)}</h3>
                <div className="text-muted" style={{ fontSize: 13 }}>
                  {num(report.key_events)} call clicks ·{" "}
                  {num(report.rows.total)} landing pages
                </div>
              </CardBody>
            </Card>
          </Col>
          <Col md={8}>
            <Breakdown
              title="By city (click to filter)"
              counts={report.by_city}
              onPick={setCity}
              label={(k) => (k === "unassigned" ? "No city" : labelOf(k))}
              unit=" visits"
            />
          </Col>
        </Row>
      )}
      <Card>
        <CardBody>
          {list.loading && !list.items.length ? (
            <Loading />
          ) : !list.items.length ? (
            <Empty>No website data for these filters.</Empty>
          ) : (
            <Table size="sm" responsive hover className="mb-0">
              <thead>
                <tr>
                  <th>Landing page</th>
                  <th>City</th>
                  <th className="text-end">Visits</th>
                  <th className="text-end">Engaged</th>
                  <th className="text-end">Call clicks</th>
                  <th className="text-end">Days</th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((r) => (
                  <tr key={`${r.page}-${r.city}`}>
                    <td style={{ maxWidth: 420 }} className="text-truncate">
                      <a
                        href={`https://www.jagrutirehab.org${r.page.startsWith("/") ? r.page : ""}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {r.page}
                      </a>
                    </td>
                    <td>
                      {r.city === "unassigned" ? (
                        <span className="text-muted">No city</span>
                      ) : (
                        labelOf(r.city)
                      )}
                    </td>
                    <td className="text-end">{num(r.sessions)}</td>
                    <td className="text-end">{num(r.engaged_sessions)}</td>
                    <td className="text-end">{num(r.key_events)}</td>
                    <td className="text-end">{r.days}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          <Pager list={list} />
        </CardBody>
      </Card>
    </>
  );
};

const ERP_TABS = {
  lead: {
    what: "leads",
    note: "HubSpot contacts and ERP leads. Names, phone numbers and e-mails are never read.",
    filters: ["source", "condition", "status", "reason", "quality"],
    columns: [
      ["Source", (r) => sourceLabel(r.source)],
      ["Condition", (r) => (r.condition ? labelOf(r.condition) : "-")],
      ["Status", (r) => r.detail.status || "-"],
      ["Quality", (r) => r.detail.quality || "-"],
      ["Care", (r) => r.detail.care || "-"],
      ["Why not admitted", (r) => r.detail.not_admitted_reason || "-"],
      ["Admitted", (r) => yesNo(r.detail.admitted)],
    ],
    breakdowns: [
      ["by_source", "Source", "source", sourceLabel],
      ["by_status", "Status", "status"],
      ["by_reason", "Why not admitted", "reason"],
      ["by_condition", "Condition", "condition"],
    ],
  },
  call: {
    what: "calls",
    note: "Ozonetel calls. The anonymised AI summaries are under Signals (source: Calls).",
    filters: ["source", "status"],
    columns: [
      ["Line", (r) => sourceLabel(r.source)],
      ["Status", (r) => r.detail.status || "-"],
      ["Disposition", (r) => r.detail.disposition || "-"],
    ],
    breakdowns: [
      ["by_source", "Line", "source", sourceLabel],
      ["by_status", "Status", "status"],
    ],
  },
  assessment: {
    what: "assessments",
    note: "Appointments booked in the ERP (OPD assessments).",
    filters: ["source"],
    columns: [
      ["Type", (r) => labelOf(r.source)],
      ["Category", (r) => r.detail.category || "-"],
      ["Cancelled", (r) => yesNo(r.detail.cancelled)],
    ],
    breakdowns: [["by_source", "Type", "source"]],
  },
  admission: {
    what: "admissions",
    note: "Admissions in the ERP, with the patient's referral source.",
    filters: ["source", "condition"],
    columns: [
      ["Referral source", (r) => labelOf(r.source)],
      ["Condition", (r) => (r.condition ? labelOf(r.condition) : "-")],
      ["Discharged", (r) => yesNo(r.detail.discharged)],
    ],
    breakdowns: [
      ["by_source", "Referral source", "source"],
      ["by_condition", "Condition", "condition"],
    ],
  },
};

const FILTER_LABEL = {
  source: "All sources",
  condition: "All conditions",
  status: "All statuses",
  reason: "All reasons",
  quality: "All qualities",
};

const ErpTab = ({ kind }) => {
  const config = ERP_TABS[kind];
  const [city, setCity] = useState("");
  const [since, setSince] = useState("");
  const [until, setUntil] = useState("");
  const [picked, setPicked] = useState({});
  const [report, fetcher] = useReport(getErpReport);
  const filters = useMemo(
    () => ({ kind, city, since, until, ...picked }),
    [kind, city, since, until, picked],
  );
  const list = usePagedList(fetcher, filters, 20);
  const pick = (name) => (value) =>
    setPicked((p) => ({ ...p, [name]: value || undefined }));

  const counts = {
    source: report?.by_source,
    condition: report?.by_condition?.length
      ? report.by_condition
      : CONDITIONS.map((key) => ({ key })),
    status: report?.by_status,
    reason: report?.by_reason,
    quality: report?.by_quality,
  };

  return (
    <>
      <div className="d-flex flex-wrap gap-2 align-items-center mb-2">
        <CityFilter value={city} onChange={setCity} />
        {config.filters.map((name) => (
          <FilterSelect
            key={name}
            value={picked[name] || ""}
            onChange={pick(name)}
            options={optionsFrom(
              counts[name],
              picked[name],
              name === "source" ? sourceLabel : (k) => labelOf(k),
            )}
            allLabel={FILTER_LABEL[name]}
            style={{ maxWidth: 220 }}
          />
        ))}
        <DateRange
          since={since}
          until={until}
          onSince={setSince}
          onUntil={setUntil}
        />
      </div>
      <p className="text-muted mb-3" style={{ fontSize: 13 }}>
        {config.note}
      </p>
      {report && (
        <Row className="g-3 mb-3">
          <Col md={3}>
            <Card className="h-100">
              <CardBody>
                <div className="text-muted" style={{ fontSize: 13 }}>
                  {labelOf(config.what)}
                </div>
                <h3 className="mb-0">{num(report.rows.total)}</h3>
                {report.newest && (
                  <div className="text-muted" style={{ fontSize: 13 }}>
                    Newest: {formatDate(report.newest)}
                  </div>
                )}
                {kind === "lead" && (
                  <div className="text-muted" style={{ fontSize: 13 }}>
                    {num(report.admitted)} admitted
                    {report.rows.total > 0 &&
                      ` (${((100 * report.admitted) / report.rows.total).toFixed(1)}%)`}
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
          <Col md={3}>
            <Breakdown
              title="By city"
              counts={report.by_city}
              onPick={setCity}
              label={(k) => (k === "unassigned" ? "No city" : labelOf(k))}
            />
          </Col>
          {config.breakdowns.map(([field, title, name, label]) => (
            <Col md={3} key={field}>
              <Breakdown
                title={title}
                counts={report[field]}
                onPick={pick(name)}
                label={label}
              />
            </Col>
          ))}
        </Row>
      )}
      <Card>
        <CardBody>
          {list.loading && !list.items.length ? (
            <Loading />
          ) : !list.items.length ? (
            <Empty>
              No {config.what} for these filters.
              {report?.newest && (since || until) && (
                <div className="mt-2">
                  The newest is from {formatDate(report.newest)}.{" "}
                  <Button
                    size="sm"
                    color="primary"
                    outline
                    onClick={() => {
                      setSince("");
                      setUntil("");
                    }}
                  >
                    Show all dates
                  </Button>
                </div>
              )}
            </Empty>
          ) : (
            <Table size="sm" responsive hover className="mb-0">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>City</th>
                  {config.columns.map(([title]) => (
                    <th key={title}>{title}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.items.map((r) => (
                  <tr key={r.id}>
                    <td className="text-nowrap">{formatDate(r.day)}</td>
                    <td>
                      {r.city === "unassigned" ? (
                        <span className="text-muted">No city</span>
                      ) : (
                        labelOf(r.city)
                      )}
                    </td>
                    {config.columns.map(([title, cell]) => (
                      <td key={title}>{cell(r)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          <Pager list={list} />
        </CardBody>
      </Card>
    </>
  );
};

const TABS = [
  { id: "web", label: "Website (GA4)", element: <Website /> },
  { id: "lead", label: "Leads", element: <ErpTab kind="lead" /> },
  { id: "call", label: "Calls", element: <ErpTab kind="call" /> },
  {
    id: "assessment",
    label: "Assessments",
    element: <ErpTab kind="assessment" />,
  },
  {
    id: "admission",
    label: "Admissions",
    element: <ErpTab kind="admission" />,
  },
];

const ListenData = () => {
  const [tab, setTab] = useState("web");
  return (
    <div className="p-3">
      <PageHeader
        title="Listen data"
        subtitle="What the listen agent pulls from GA4, HubSpot, Ozonetel and the ERP. Updated every 6 hours."
      />
      <Nav tabs className="mb-3">
        {TABS.map((t) => (
          <NavItem key={t.id}>
            <NavLink
              href="#"
              active={tab === t.id}
              onClick={(e) => {
                e.preventDefault();
                setTab(t.id);
              }}
            >
              {t.label}
            </NavLink>
          </NavItem>
        ))}
      </Nav>
      {TABS.find((t) => t.id === tab)?.element}
    </div>
  );
};

export default ListenData;
