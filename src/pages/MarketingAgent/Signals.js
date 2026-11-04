import React, { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  Col,
  Input,
  Row,
  Table,
} from "reactstrap";
import {
  acknowledgeAlert,
  askSignals,
  buildDigest,
  getAlerts,
  getLatestDigest,
  getTrends,
  listSignals,
  runListen,
  searchSignals,
} from "../../helpers/marketingAgentApi";
import {
  CitySelect,
  DateRange,
  Empty,
  FilterSelect,
  PageHeader,
  Pager,
  SearchBox,
  dayEnd,
  dayStart,
  formatDate,
  formatDateTime,
  notifyError,
  useAction,
  useAgentAccess,
  useDefaultCity,
  useJob,
  usePagedList,
} from "./common";

const SignalLine = ({ s, score }) => (
  <div className="border-bottom py-2" style={{ fontSize: 13 }}>
    <div className="d-flex gap-2 flex-wrap align-items-center">
      <Badge color="light" className="text-dark">
        {s.kind.replace(/_/g, " ")}
      </Badge>
      <Badge color="light" className="text-dark">
        {s.source}
      </Badge>
      {s.rating !== null && s.rating !== undefined && (
        <span>{"★".repeat(Math.round(s.rating))}</span>
      )}
      {s.sentiment && (
        <Badge
          color={
            s.sentiment === "negative"
              ? "danger"
              : s.sentiment === "positive"
                ? "success"
                : "secondary"
          }
        >
          {s.sentiment}
        </Badge>
      )}
      {score !== undefined && (
        <span className="text-muted">match {score.toFixed(2)}</span>
      )}
      <span className="text-muted ms-auto">{formatDate(s.observed_at)}</span>
    </div>
    <div className="mt-1">{s.text}</div>
    {s.summary && s.summary !== s.text && (
      <div className="text-muted">{s.summary}</div>
    )}
  </div>
);

const ALERT_STATUS = [
  ["open", "Open"],
  ["acknowledged", "Handled"],
];
const SOURCES = [
  ["gsc", "Search Console"],
  ["gbp", "Google reviews"],
  ["justdial", "Justdial"],
  ["practo", "Practo"],
  ["instagram", "Instagram"],
  ["facebook", "Facebook"],
  ["youtube", "YouTube"],
  ["competitor", "Competitor"],
  ["ozonetel", "Calls (ERP)"],
  ["erp", "ERP feedback"],
  ["hubspot", "Website forms"],
  ["manual", "Added by hand"],
];
const KINDS = [
  "search_query",
  "review",
  "call",
  "enquiry",
  "social_comment",
  "competitor_post",
  "note",
];
const FUNNEL = [
  ["lead", "leads"],
  ["call", "calls"],
  ["feedback", "feedback calls"],
  ["assessment", "assessments"],
  ["admission", "admissions"],
];
const SENTIMENTS = ["positive", "neutral", "negative", "mixed"];
const CONDITIONS = [
  "alcohol",
  "drugs",
  "psychiatric",
  "dual_diagnosis",
  "general",
];

const QUALITY = {
  good: { label: "Good (4–5★)", min_rating: 4, max_rating: 5 },
  average: { label: "Average (3★)", min_rating: 3, max_rating: 3.99 },
  bad: { label: "Bad (1–2★)", min_rating: 0, max_rating: 2.99 },
};
const QUALITY_OPTIONS = Object.entries(QUALITY).map(([k, v]) => [k, v.label]);

const Reviews = () => {
  const [city, setCity] = useState("");
  const [quality, setQuality] = useState("");
  const [sentiment, setSentiment] = useState("");
  const [q, setQ] = useState("");
  const [since, setSince] = useState("");
  const [until, setUntil] = useState("");
  const range = QUALITY[quality] || {};
  const list = usePagedList(listSignals, {
    kind: "review",
    city,
    q,
    sentiment,
    min_rating: range.min_rating,
    max_rating: range.max_rating,
    since: dayStart(since),
    until: dayEnd(until),
  });

  return (
    <Card>
      <CardBody>
        <h6>Google reviews</h6>
        <div className="d-flex flex-wrap gap-2 mb-2">
          <SearchBox onSearch={setQ} placeholder="Search reviews" />
          <FilterSelect
            value={quality}
            onChange={setQuality}
            options={QUALITY_OPTIONS}
            allLabel="Good, average and bad"
          />
          <CitySelect
            value={city}
            onChange={setCity}
            allowAll
            activeOnly={false}
            style={{ width: 150 }}
          />
          <FilterSelect
            value={sentiment}
            onChange={setSentiment}
            options={SENTIMENTS}
            allLabel="Any feeling"
          />
          <DateRange
            since={since}
            until={until}
            onSince={setSince}
            onUntil={setUntil}
            label="Written"
          />
        </div>
        {!list.loading && list.total === 0 ? (
          <Empty>No reviews match.</Empty>
        ) : (
          list.items.map((r) => (
            <div key={r.id}>
              <div
                className="text-capitalize text-muted"
                style={{ fontSize: 12 }}
              >
                {r.city.replace(/-/g, " ")}
                {r.url && (
                  <>
                    {" · "}
                    <a href={r.url} target="_blank" rel="noreferrer">
                      Open on Google
                    </a>
                  </>
                )}
              </div>
              <SignalLine s={r} />
            </div>
          ))
        )}
        <Pager list={list} />
      </CardBody>
    </Card>
  );
};

const AllSignals = () => {
  const [city, setCity] = useState("");
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("");
  const [source, setSource] = useState("");
  const [sentiment, setSentiment] = useState("");
  const [condition, setCondition] = useState("");
  const [since, setSince] = useState("");
  const [until, setUntil] = useState("");
  const list = usePagedList(listSignals, {
    city,
    q,
    kind,
    source,
    sentiment,
    condition,
    since: dayStart(since),
    until: dayEnd(until),
  });

  return (
    <Card>
      <CardBody>
        <h6>All signals</h6>
        <div className="d-flex flex-wrap gap-2 mb-2">
          <SearchBox onSearch={setQ} placeholder="Search text" />
          <CitySelect
            value={city}
            onChange={setCity}
            allowAll
            activeOnly={false}
            style={{ width: 150 }}
          />
          <FilterSelect
            value={kind}
            onChange={setKind}
            options={KINDS}
            allLabel="All kinds"
          />
          <FilterSelect
            value={source}
            onChange={setSource}
            options={SOURCES}
            allLabel="All sources"
          />
          <FilterSelect
            value={sentiment}
            onChange={setSentiment}
            options={SENTIMENTS}
            allLabel="Any feeling"
          />
          <FilterSelect
            value={condition}
            onChange={setCondition}
            options={CONDITIONS}
            allLabel="All conditions"
          />
          <DateRange
            since={since}
            until={until}
            onSince={setSince}
            onUntil={setUntil}
            label="Seen"
          />
        </div>
        {!list.loading && list.total === 0 ? (
          <Empty>No signals match.</Empty>
        ) : (
          list.items.map((sig) => <SignalLine key={sig.id} s={sig} />)
        )}
        <Pager list={list} />
      </CardBody>
    </Card>
  );
};

const Signals = () => {
  const [city, setCity] = useDefaultCity();
  const [digest, setDigest] = useState(null);
  const [trends, setTrends] = useState([]);
  const [alertStatus, setAlertStatus] = useState("open");
  const [alertSource, setAlertSource] = useState("");
  const [alertQ, setAlertQ] = useState("");
  const [alertCity, setAlertCity] = useState("");
  const alerts = usePagedList(getAlerts, {
    status: alertStatus,
    source: alertSource,
    q: alertQ,
    city: alertCity,
  });
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [hits, setHits] = useState(null);
  const [fetches, setFetches] = useState(0);
  const { act, busy } = useAction();
  const { run, running } = useJob();
  const { can } = useAgentAccess();
  const lead = can("SIGNALS");

  const load = useCallback(() => {
    getLatestDigest()
      .then(setDigest)
      .catch(() => setDigest(null));
    if (city) getTrends(city).then(setTrends).catch(notifyError);
  }, [city]);

  useEffect(load, [load]);

  const ask = async () => {
    setAnswer(null);
    const result = await act("ask", () =>
      askSignals({ query: question, city, k: 15 }),
    );
    if (result) setAnswer(result);
  };

  const search = async () => {
    const result = await act("search", () =>
      searchSignals({ query: question, city, k: 20 }),
    );
    if (result) setHits(result);
  };

  const cityDigest = digest?.cities?.find((c) => c.city === city);

  return (
    <div className="p-3">
      <PageHeader
        title="Signals"
        subtitle="What people search for and say in reviews, city by city."
      >
        <CitySelect value={city} onChange={setCity} style={{ width: 180 }} />
        {lead && (
          <>
            <Button
              size="sm"
              color="light"
              disabled={!!busy}
              onClick={async () =>
                (await act("digest", buildDigest, "Digest rebuilt")) && load()
              }
            >
              Rebuild digest
            </Button>
            <Button
              size="sm"
              color="primary"
              disabled={running}
              onClick={async () => {
                if (await run(runListen, { successText: "Signals updated" })) {
                  load();
                  alerts.reload();
                  setFetches((n) => n + 1);
                }
              }}
            >
              {running ? "Fetching…" : "Fetch new signals"}
            </Button>
          </>
        )}
      </PageHeader>

      <Card>
        <CardBody>
          <h6>Ask the signals</h6>
          <div className="d-flex gap-2 flex-wrap">
            <Input
              placeholder="e.g. What are families in Pune worried about this month?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && question.trim().length > 1 && ask()
              }
              style={{ flex: 1, minWidth: 260 }}
            />
            <Button
              color="primary"
              disabled={question.trim().length < 2 || !!busy}
              onClick={ask}
            >
              {busy === "ask" ? "Thinking…" : "Ask"}
            </Button>
            <Button
              color="light"
              disabled={question.trim().length < 2 || !!busy}
              onClick={search}
            >
              Search only
            </Button>
          </div>
          {answer && (
            <div className="mt-3">
              <div className="p-3 bg-light rounded">
                {answer.answer.answer}
                <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                  Confidence: {answer.answer.confidence} · based on{" "}
                  {answer.answer.cited_signal_ids.length} signal(s)
                </div>
              </div>
              {answer.signals
                .filter((h) =>
                  answer.answer.cited_signal_ids.includes(h.signal.id),
                )
                .map((h) => (
                  <SignalLine key={h.signal.id} s={h.signal} score={h.score} />
                ))}
            </div>
          )}
          {hits && !answer && (
            <div className="mt-3">
              {hits.length === 0 ? (
                <Empty>No matching signals.</Empty>
              ) : (
                hits.map((h) => (
                  <SignalLine key={h.signal.id} s={h.signal} score={h.score} />
                ))
              )}
            </div>
          )}
        </CardBody>
      </Card>

      <Row>
        <Col lg={6}>
          <Card>
            <CardBody>
              <h6>
                Today's digest{" "}
                {digest && (
                  <span className="text-muted">({formatDate(digest.day)})</span>
                )}
              </h6>
              {digest?.highlights?.length ? (
                <ul className="mb-2">
                  {digest.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              ) : (
                <Empty>
                  No digest yet. It is built every morning, or use Rebuild
                  digest.
                </Empty>
              )}
              {cityDigest && (
                <div className="text-muted" style={{ fontSize: 13 }}>
                  Reviews in the last day: {cityDigest.reviews.count} (average{" "}
                  {cityDigest.reviews.average_rating ?? "-"},{" "}
                  {cityDigest.reviews.negative} negative) · open alerts{" "}
                  {cityDigest.open_alerts}
                  {cityDigest.web && cityDigest.web.sessions > 0 && (
                    <div>
                      Website in the last day:{" "}
                      {Math.round(cityDigest.web.sessions)} visits
                      {cityDigest.web.sessions_usual != null &&
                        ` (usual ${Math.round(cityDigest.web.sessions_usual)})`}
                      , {Math.round(cityDigest.web.key_events)} enquiries
                    </div>
                  )}
                  {cityDigest.funnel &&
                    Object.keys(cityDigest.funnel).length > 0 && (
                      <div>
                        ERP in the last day:{" "}
                        {FUNNEL.filter(([step]) => cityDigest.funnel[step])
                          .map(
                            ([step, label]) =>
                              `${cityDigest.funnel[step]} ${label}`,
                          )
                          .join(", ")}
                      </div>
                    )}
                  {cityDigest.top_topics?.length > 0 && (
                    <div>
                      Topics this week: {cityDigest.top_topics.join(", ")}
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <h6>Rising searches</h6>
              {trends.length === 0 ? (
                <Empty>
                  Nothing rising. Search Console data appears after the first
                  fetch.
                </Empty>
              ) : (
                <Table size="sm" responsive style={{ fontSize: 13 }}>
                  <thead className="table-light">
                    <tr>
                      <th>Search</th>
                      <th>This week</th>
                      <th>Usual week</th>
                      <th>Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trends.map((t) => (
                      <tr key={t.id}>
                        <td>
                          {t.query}{" "}
                          {t.is_new && <Badge color="info">new</Badge>}
                        </td>
                        <td>{Math.round(t.current_impressions)}</td>
                        <td>{Math.round(t.baseline_impressions)}</td>
                        <td className="text-success">
                          +{Math.round(t.growth * 100)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </CardBody>
          </Card>
        </Col>
        <Col lg={6}>
          <Card>
            <CardBody>
              <div className="d-flex flex-wrap gap-2 align-items-center mb-2">
                <h6 className="mb-0 me-auto">Bad review alerts</h6>
                <SearchBox
                  onSearch={setAlertQ}
                  placeholder="Search review"
                  style={{ width: 150 }}
                />
                <CitySelect
                  value={alertCity}
                  onChange={setAlertCity}
                  allowAll
                  activeOnly={false}
                  style={{ width: 140 }}
                />
                <FilterSelect
                  value={alertStatus}
                  onChange={setAlertStatus}
                  options={ALERT_STATUS}
                  allLabel="All alerts"
                />
                <FilterSelect
                  value={alertSource}
                  onChange={setAlertSource}
                  options={SOURCES}
                  allLabel="All sources"
                />
              </div>
              {!alerts.loading && alerts.total === 0 ? (
                <Empty>No alerts match.</Empty>
              ) : (
                alerts.items.map((a) => (
                  <div
                    key={a.id}
                    className="border-bottom py-2"
                    style={{ fontSize: 13 }}
                  >
                    <div className="d-flex justify-content-between gap-2">
                      <span>
                        <Badge color="danger">{a.rating ?? "?"}★</Badge>{" "}
                        <span className="text-capitalize">{a.city}</span> ·{" "}
                        {a.source}
                        {a.severity && ` · ${a.severity}`}
                      </span>
                      <span className="text-muted">
                        {formatDateTime(a.created_at)}
                      </span>
                    </div>
                    <div className="mt-1">{a.summary || a.text}</div>
                    <div className="d-flex gap-2 mt-1">
                      {a.url && (
                        <a href={a.url} target="_blank" rel="noreferrer">
                          Open review
                        </a>
                      )}
                      {lead && a.status === "open" && (
                        <Button
                          size="sm"
                          color="link"
                          className="p-0"
                          disabled={busy === a.id}
                          onClick={async () =>
                            (await act(
                              a.id,
                              () => acknowledgeAlert(a.id),
                              "Marked as handled",
                            )) && alerts.reload()
                          }
                        >
                          Mark as handled
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
              <Pager list={alerts} />
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Reviews key={`reviews-${fetches}`} />
      <AllSignals key={fetches} />
    </div>
  );
};

export default Signals;
