import React, { useCallback, useEffect, useState } from "react";
import { Button, Card, CardBody, Col, Input, Row, Table } from "reactstrap";
import {
  getHooks,
  getMetrics,
  getReports,
  runLearn,
} from "../../helpers/marketingAgentApi";
import {
  CitySelect,
  Empty,
  FORMATS,
  FilterSelect,
  Loading,
  PageHeader,
  Pager,
  SearchBox,
  formatDate,
  money,
  notifyError,
  pct,
  useAgentAccess,
  useJob,
  usePagedList,
} from "./common";

const isoDay = (d) => d.toISOString().slice(0, 10);

const REPORT_KINDS = ["daily", "weekly", "monthly"];
const CONDITIONS = [
  "alcohol",
  "drugs",
  "psychiatric",
  "dual_diagnosis",
  "general",
];

const FunnelTable = ({ title, rows, showSpend = true }) => (
  <Card>
    <CardBody>
      <h6>{title}</h6>
      {rows.length === 0 ? (
        <Empty>No data for this period.</Empty>
      ) : (
        <Table size="sm" responsive style={{ fontSize: 13 }}>
          <thead className="table-light">
            <tr>
              <th />
              <th>Enquiries</th>
              <th>Qualified</th>
              <th>Assessments</th>
              <th>Admissions</th>
              <th>Enquiry → admission</th>
              {showSpend && <th>Spend</th>}
              {showSpend && <th>Cost / admission</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.key}>
                <td className="fw-semibold text-capitalize">
                  {m.key.replace(/[:/]/g, " · ")}
                </td>
                <td>{m.enquiries}</td>
                <td>{m.qualified}</td>
                <td>{m.assessments}</td>
                <td>{m.admissions}</td>
                <td>{pct(m.enquiry_to_admission)}</td>
                {showSpend && <td>{money(m.spend)}</td>}
                {showSpend && <td>{money(m.cost_per_admission)}</td>}
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </CardBody>
  </Card>
);

const Stat = ({ label, value, hint }) => (
  <Card className="mb-3">
    <CardBody className="py-3">
      <div className="text-muted" style={{ fontSize: 12 }}>
        {label}
      </div>
      <div className="fs-4 fw-semibold">{value}</div>
      {hint && (
        <div className="text-muted" style={{ fontSize: 12 }}>
          {hint}
        </div>
      )}
    </CardBody>
  </Card>
);

const Insights = () => {
  const today = new Date();
  const [start, setStart] = useState(
    isoDay(new Date(today.getTime() - 29 * 864e5)),
  );
  const [end, setEnd] = useState(isoDay(today));
  const [metrics, setMetrics] = useState(null);
  const [kind, setKind] = useState("");
  const reports = usePagedList(getReports, { kind });
  const [hookQ, setHookQ] = useState("");
  const [hookCity, setHookCity] = useState("");
  const [hookCondition, setHookCondition] = useState("");
  const [hookFormat, setHookFormat] = useState("");
  const hooks = usePagedList(getHooks, {
    q: hookQ,
    city: hookCity,
    condition: hookCondition,
    format: hookFormat,
  });
  const { run, running } = useJob();
  const { can } = useAgentAccess();

  const load = useCallback(() => {
    setMetrics(null);
    getMetrics({ start, end })
      .then(setMetrics)
      .catch((e) => {
        notifyError(e);
        setMetrics(false);
      });
  }, [start, end]);

  useEffect(load, [load]);

  const totals = (metrics?.by_city || []).reduce(
    (t, m) => ({
      enquiries: t.enquiries + m.enquiries,
      qualified: t.qualified + m.qualified,
      admissions: t.admissions + m.admissions,
      spend: t.spend + m.spend,
    }),
    { enquiries: 0, qualified: 0, admissions: 0, spend: 0 },
  );
  const r = metrics?.response;

  return (
    <div className="p-3">
      <PageHeader
        title="Insights"
        subtitle="Which posts, ads and channels led to admissions, and what each admission cost."
      >
        <Input
          type="date"
          bsSize="sm"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          style={{ width: 150 }}
        />
        <Input
          type="date"
          bsSize="sm"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          style={{ width: 150 }}
        />
        {can("INSIGHTS") && (
          <Button
            size="sm"
            color="primary"
            disabled={running}
            onClick={async () => {
              const job = await run(() => runLearn("weekly"), {
                successText: "Weekly report ready",
              });
              if (job) {
                load();
                reports.reload();
                hooks.reload();
              }
            }}
          >
            {running ? "Working…" : "Build weekly report now"}
          </Button>
        )}
      </PageHeader>

      {metrics === null ? (
        <Loading />
      ) : metrics === false ? (
        <Empty>Could not load the numbers.</Empty>
      ) : (
        <>
          <Row>
            <Col md={3}>
              <Stat
                label="Enquiries"
                value={totals.enquiries}
                hint={`${totals.qualified} qualified (Hot or Warm)`}
              />
            </Col>
            <Col md={3}>
              <Stat
                label="Admissions"
                value={totals.admissions}
                hint={
                  pct(
                    totals.enquiries
                      ? totals.admissions / totals.enquiries
                      : null,
                  ) + " of enquiries"
                }
              />
            </Col>
            <Col md={3}>
              <Stat
                label="Ad spend"
                value={money(totals.spend)}
                hint={`Cost per admission ${money(totals.admissions ? totals.spend / totals.admissions : null)}`}
              />
            </Col>
            <Col md={3}>
              <Stat
                label="Hot leads called on time"
                value={
                  r?.hot_within_target_rate === null
                    ? "-"
                    : pct(r.hot_within_target_rate)
                }
                hint={`${r?.hot_called_within_target || 0} of ${r?.hot_enquiries || 0} · median wait ${r?.median_minutes_to_first_call ?? "-"} min`}
              />
            </Col>
          </Row>
          {r?.crisis_total > 0 && (
            <Card className="mb-3 border-danger">
              <CardBody className="py-2">
                Crisis enquiries: {r.crisis_total} · acknowledged within the
                target: {r.crisis_acknowledged_in_time}
              </CardBody>
            </Card>
          )}
          <FunnelTable title="By city" rows={metrics.by_city} />
          <FunnelTable title="By channel" rows={metrics.by_channel} />
          <Row>
            <Col lg={6}>
              <FunnelTable
                title="By topic (condition / format)"
                rows={metrics.by_topic}
                showSpend={false}
              />
            </Col>
            <Col lg={6}>
              <FunnelTable title="By ad campaign" rows={metrics.by_campaign} />
            </Col>
          </Row>
          <Card>
            <CardBody>
              <h6>How accurate the Hot / Warm / Cold scores were</h6>
              {metrics.score_accuracy.length === 0 ? (
                <Empty>No scored enquiries in this period.</Empty>
              ) : (
                <Table size="sm" style={{ fontSize: 13 }}>
                  <thead className="table-light">
                    <tr>
                      <th>Score</th>
                      <th>Enquiries</th>
                      <th>Reached assessment</th>
                      <th>Admitted</th>
                      <th>Assessment rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.score_accuracy.map((a) => (
                      <tr key={a.score}>
                        <td className="text-uppercase fw-semibold">
                          {a.score}
                        </td>
                        <td>{a.enquiries}</td>
                        <td>{a.reached_assessment}</td>
                        <td>{a.admitted}</td>
                        <td>{pct(a.assessment_rate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </CardBody>
          </Card>
        </>
      )}

      <Row>
        <Col lg={7}>
          <Card>
            <CardBody>
              <div className="d-flex flex-wrap gap-2 align-items-center mb-2">
                <h6 className="mb-0 me-auto">Reports</h6>
                <FilterSelect
                  value={kind}
                  onChange={setKind}
                  options={REPORT_KINDS}
                  allLabel="All reports"
                />
              </div>
              {!reports.loading && reports.total === 0 ? (
                <Empty>The first weekly report is built on Friday.</Empty>
              ) : (
                reports.items.map((rep) => (
                  <div key={rep.id} className="border-bottom py-2">
                    <div className="fw-semibold text-capitalize">
                      {rep.kind} · {formatDate(rep.period_start)} to{" "}
                      {formatDate(rep.period_end)}
                    </div>
                    <ul className="mb-0" style={{ fontSize: 13 }}>
                      {rep.summary.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                    {rep.budget_change_ids.length > 0 && (
                      <div className="text-muted" style={{ fontSize: 12 }}>
                        {rep.budget_change_ids.length} budget change(s)
                        proposed: see Ads.
                      </div>
                    )}
                  </div>
                ))
              )}
              <Pager list={reports} />
            </CardBody>
          </Card>
        </Col>
        <Col lg={5}>
          <Card>
            <CardBody>
              <h6>Headlines that brought enquiries</h6>
              <div className="d-flex flex-wrap gap-2 mb-2">
                <SearchBox
                  onSearch={setHookQ}
                  placeholder="Search headline"
                  style={{ width: 160 }}
                />
                <CitySelect
                  value={hookCity}
                  onChange={setHookCity}
                  allowAll
                  activeOnly={false}
                  style={{ width: 130 }}
                />
                <FilterSelect
                  value={hookCondition}
                  onChange={setHookCondition}
                  options={CONDITIONS}
                  allLabel="All conditions"
                />
                <FilterSelect
                  value={hookFormat}
                  onChange={setHookFormat}
                  options={FORMATS}
                  allLabel="All formats"
                />
              </div>
              {!hooks.loading && hooks.total === 0 ? (
                <Empty>None yet.</Empty>
              ) : (
                <Table size="sm" style={{ fontSize: 13 }}>
                  <tbody>
                    {hooks.items.map((h) => (
                      <tr key={h.id}>
                        <td>
                          {h.text}
                          <div className="text-muted text-capitalize">
                            {h.city} · {h.condition} ·{" "}
                            {h.format.replace(/_/g, " ")}
                          </div>
                        </td>
                        <td
                          className="text-end"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          {h.enquiries} enq · {h.admissions} adm
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
              <Pager list={hooks} />
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Insights;
