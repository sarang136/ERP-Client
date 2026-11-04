import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, CardBody, Col, Input, Row } from "reactstrap";
import {
  generatePlan,
  getPlanInputs,
  getRagInventory,
  getPlans,
  regeneratePlan,
  searchSignals,
  searchWebsite,
} from "../../helpers/marketingAgentApi";
import {
  CitySelect,
  Empty,
  FilterSelect,
  Loading,
  PANE,
  PageHeader,
  errorText,
  formatDate,
  labelOf,
  nextMonday,
  useAction,
  useAgentAccess,
  useDefaultCity,
  useJob,
  weekStartOf,
} from "./common";
import { PlanInputsModal, PlanRagView, SentimentBadge } from "./InputsEditors";

const SOURCES = [
  ["signals", "Reviews and searches"],
  ["website", "Our website"],
];

const KIND_LABEL = {
  search_query: "Google searches (Search Console)",
  review: "Reviews",
  call: "Call summaries (anonymised)",
  enquiry: "Enquiry notes (anonymised)",
  social_comment: "Social comments",
  competitor_post: "Competitor posts",
  note: "Notes",
};
const SOURCE_LABEL = {
  gsc: "Search Console",
  gbp: "Google",
  ozonetel: "Ozonetel calls",
  erp: "ERP",
  hubspot: "Website forms",
  justdial: "Justdial",
  practo: "Practo",
  manual: "Added by hand",
};
const ERP_LABEL = {
  lead: "Leads",
  call: "Calls",
  feedback: "Feedback calls",
  assessment: "Assessments (OPD)",
  admission: "Admissions",
};
const num = (n) => Number(n || 0).toLocaleString("en-IN");

const RagInventory = () => {
  const [data, setData] = useState(null);
  const [problem, setProblem] = useState("");

  useEffect(() => {
    getRagInventory()
      .then(setData)
      .catch((e) => setProblem(errorText(e)));
  }, []);

  return (
    <Card className="mb-3">
      <CardBody>
        <h6>What's in the RAG</h6>
        {problem ? (
          <div className="text-danger">{problem}</div>
        ) : !data ? (
          <Loading />
        ) : (
          <div style={{ fontSize: 13 }}>
            <table className="table table-sm mb-2">
              <thead>
                <tr>
                  <th>Data</th>
                  <th className="text-end">Items</th>
                  <th className="text-end">Searchable</th>
                  <th>Newest</th>
                </tr>
              </thead>
              <tbody>
                {data.signals.map((s) => (
                  <tr key={`${s.kind}-${s.source}`}>
                    <td>
                      {KIND_LABEL[s.kind] || s.kind}
                      <span className="text-muted">
                        {" "}
                        · {SOURCE_LABEL[s.source] || s.source}
                      </span>
                    </td>
                    <td className="text-end">{num(s.total)}</td>
                    <td className="text-end">{num(s.searchable)}</td>
                    <td>{s.newest ? formatDate(s.newest) : "-"}</td>
                  </tr>
                ))}
                <tr>
                  <td>Website pieces</td>
                  <td className="text-end">{num(data.website_pieces)}</td>
                  <td className="text-end">{num(data.website_searchable)}</td>
                  <td>{num(data.website_pages)} pages</td>
                </tr>
                <tr>
                  <td>Clinical facts</td>
                  <td className="text-end">{num(data.facts_active)}</td>
                  <td className="text-end">{num(data.facts_searchable)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
            <div className="text-muted mb-1">
              "Searchable" means it has an embedding, so the planner can find
              it. Website pieces stay unsearchable until you approve them.
            </div>
            <div className="mb-1">
              <strong>By city:</strong>{" "}
              {Object.entries(data.signals_by_city)
                .map(([city, n]) => `${labelOf(city)} ${num(n)}`)
                .join(" · ")}
            </div>
            {Object.keys(data.erp_events).length > 0 && (
              <div className="mb-1">
                <strong>ERP counts (digest, funnel, plan score):</strong>{" "}
                {Object.entries(data.erp_events)
                  .map(([k, n]) => `${ERP_LABEL[k] || k} ${num(n)}`)
                  .join(" · ")}
              </div>
            )}
            <div className="text-muted">
              Database size: {data.database_mb} MB of 512 MB
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

const SearchRag = ({ city }) => {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("signals");
  const [hits, setHits] = useState(null);
  const [problem, setProblem] = useState("");
  const { act, busy } = useAction();

  const search = async () => {
    setProblem("");
    setHits(null);
    try {
      const body = { query: query.trim(), city: city || null, k: 15 };
      const found = await act("search", () =>
        source === "signals" ? searchSignals(body) : searchWebsite(body),
      );
      if (found) setHits(found);
    } catch (e) {
      setProblem(errorText(e));
    }
  };

  return (
    <Card>
      <CardBody>
        <h6>Search the RAG</h6>
        <p className="text-muted" style={{ fontSize: 13 }}>
          Finds stored pieces by meaning, the same way the planner and writer
          do. Higher match means closer.
        </p>
        <div className="d-flex flex-wrap gap-2">
          <Input
            bsSize="sm"
            placeholder="e.g. families worried about alcohol withdrawal"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && query.trim().length > 1 && search()
            }
            style={{ flex: 1, minWidth: 220 }}
          />
          <FilterSelect value={source} onChange={setSource} options={SOURCES} />
          <Button
            size="sm"
            color="primary"
            disabled={query.trim().length < 2 || !!busy}
            onClick={search}
          >
            {busy ? "Searching…" : "Search"}
          </Button>
        </div>
        {problem && <div className="text-danger mt-2">{problem}</div>}
        {hits &&
          (hits.length === 0 ? (
            <Empty>
              Nothing found
              {source === "website" &&
                ". Website pieces need “Also prepare for AI search” in Brand Brain → Website"}
              .
            </Empty>
          ) : (
            <div className="mt-2" style={{ fontSize: 13 }}>
              {hits.map((h) =>
                source === "signals" ? (
                  <div key={h.signal.id} className="border-bottom py-2">
                    <Badge color="light" className="text-dark me-2">
                      {labelOf(h.signal.kind)}
                      {h.signal.rating ? ` · ${h.signal.rating}★` : ""}
                    </Badge>
                    <SentimentBadge sentiment={h.signal.sentiment} />{" "}
                    <span className="text-muted text-capitalize me-2">
                      {h.signal.city}
                    </span>
                    <span className="text-muted">
                      match {h.score.toFixed(2)}
                    </span>
                    <div>{h.signal.text}</div>
                  </div>
                ) : (
                  <div
                    key={`${h.page_id}-${h.heading}`}
                    className="border-bottom py-2"
                  >
                    <a href={h.url} target="_blank" rel="noreferrer">
                      {h.title}
                    </a>{" "}
                    <span className="text-muted">
                      · {h.heading} · match {h.score.toFixed(2)}
                    </span>
                    <div>{h.text.slice(0, 400)}</div>
                  </div>
                ),
              )}
            </div>
          ))}
      </CardBody>
    </Card>
  );
};

const RagOutput = () => {
  const [city, setCity] = useDefaultCity();
  const [week, setWeek] = useState(nextMonday);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [existing, setExisting] = useState(null);
  const { run, running } = useJob();
  const { can } = useAgentAccess();
  const closeEditor = useCallback(() => setEditing(null), []);

  const load = useCallback(() => {
    if (!city) return;
    setLoading(true);
    setError("");
    getPlanInputs({ city, week_start: week || null })
      .then((d) => {
        setData(d);
        return getPlans({ city, week_start: d.week_start, limit: 1 }).then(
          (page) => setExisting(page.items[0] || null),
        );
      })
      .catch((e) => {
        setData(null);
        setError(errorText(e));
      })
      .finally(() => setLoading(false));
  }, [city, week]);

  useEffect(load, [load]);

  const send = async ({ city: _city, week_start: _week, ...body }) => {
    const mode = editing;
    setEditing(null);
    const job = await run(
      () =>
        existing
          ? regeneratePlan(existing.id, { mode, ...body })
          : generatePlan({
              city: data.city,
              week_start: data.week_start,
              ...body,
            }),
      {
        successText: existing
          ? "Plan updated: approve it again in Weekly Plans"
          : "Plan drafted: approve it in Weekly Plans",
      },
    );
    if (job?.status === "succeeded") load();
  };

  const asPlan = useMemo(
    () =>
      data && {
        inputs: data.inputs,
        formats: data.rules.allowed_formats,
        channels: data.rules.allowed_channels,
      },
    [data],
  );

  return (
    <div className="p-3">
      <PageHeader
        title="RAG output"
        subtitle="What the agent finds in reviews, searches and our website before anything is sent to Gemini."
      >
        <CitySelect value={city} onChange={setCity} style={{ width: 160 }} />
        <span className="text-muted" style={{ fontSize: 13 }}>
          Week of
        </span>
        <Input
          type="date"
          bsSize="sm"
          value={week}
          onChange={(e) => setWeek(weekStartOf(e.target.value))}
          style={{ width: 150 }}
        />
        <Button
          size="sm"
          color="secondary"
          outline
          onClick={load}
          disabled={loading}
        >
          Refresh
        </Button>
        {can("PLANS") && !existing && (
          <Button
            size="sm"
            color="primary"
            disabled={!data || running}
            onClick={() => setEditing("new")}
          >
            {running ? "Drafting…" : "Edit and draft plan"}
          </Button>
        )}
        {can("PLANS") && existing && (
          <>
            <Button
              size="sm"
              color="primary"
              disabled={running}
              onClick={() => setEditing("regenerate")}
            >
              {running ? "Working…" : "Edit and regenerate plan"}
            </Button>
            <Button
              size="sm"
              color="primary"
              outline
              disabled={running}
              onClick={() => setEditing("more")}
            >
              Generate more
            </Button>
          </>
        )}
      </PageHeader>
      <Row className="g-3">
        <Col lg={7} style={PANE}>
          <Card>
            <CardBody>
              {loading ? (
                <Loading />
              ) : error ? (
                <div className="text-danger">{error}</div>
              ) : data ? (
                <>
                  <h6 className="text-capitalize">
                    {data.city} · week of {formatDate(data.week_start)}
                  </h6>
                  {existing && (
                    <div
                      className="alert alert-warning py-2"
                      style={{ fontSize: 13 }}
                    >
                      This week already has a plan ({existing.status}). Sending
                      this output regenerates it or adds ideas, and the plan
                      goes back to Draft for approval.
                    </div>
                  )}
                  <PlanRagView
                    plan={asPlan}
                    intro="This is what the planner would read for this city and week. Nothing has been sent to Gemini."
                  />
                </>
              ) : (
                <Empty>Pick a city.</Empty>
              )}
            </CardBody>
          </Card>
        </Col>
        <Col lg={5} style={PANE}>
          <RagInventory />
          <SearchRag city={city} />
        </Col>
      </Row>
      {editing && data && (
        <PlanInputsModal
          city={data.city}
          weekStart={data.week_start}
          plan={asPlan}
          mode={editing}
          onClose={closeEditor}
          onSend={send}
        />
      )}
    </div>
  );
};

export default RagOutput;
