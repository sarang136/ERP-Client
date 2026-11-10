import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  Badge,
  Button,
  Card,
  CardBody,
  Col,
  Input,
  Nav,
  NavItem,
  NavLink,
  Row,
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
  labelOf,
  notifyError,
  useAction,
  useAgentAccess,
  useCities,
  useDefaultCity,
  usePagedList,
} from "./common";
import { useTrackedJob } from "./JobProgress";

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
const SOURCE_LABEL = Object.fromEntries(SOURCES);
const KINDS = [
  ["search_query", "Google search"],
  ["review", "Review"],
  ["call", "Call summary"],
  ["enquiry", "Enquiry"],
  ["social_comment", "Social comment"],
  ["competitor_post", "Competitor post"],
  ["note", "Note"],
];
const KIND_LABEL = Object.fromEntries(KINDS);
const KIND_ICON = {
  search_query: ["bx bx-search", "#405189"],
  review: ["bx bxs-star", "#f7b84b"],
  call: ["bx bx-phone-call", "#0ab39c"],
  enquiry: ["bx bx-envelope", "#299cdb"],
  social_comment: ["bx bx-message-rounded-dots", "#d6249f"],
  competitor_post: ["bx bx-buildings", "#878a99"],
  note: ["bx bx-note", "#878a99"],
};
const SENTIMENT = {
  positive: ["success", "Positive"],
  neutral: ["secondary", "Neutral"],
  mixed: ["warning", "Mixed"],
  negative: ["danger", "Negative"],
};
const SENTIMENTS = Object.entries(SENTIMENT).map(([k, [, label]]) => [
  k,
  label,
]);
const CONDITIONS = [
  "alcohol",
  "drugs",
  "psychiatric",
  "dual_diagnosis",
  "general",
];
const FUNNEL = [
  ["lead", "leads"],
  ["call", "calls"],
  ["assessment", "assessments"],
  ["admission", "admissions"],
];
const QUALITY = {
  good: { label: "Good (4–5★)", min_rating: 4, max_rating: 5 },
  average: { label: "Average (3★)", min_rating: 3, max_rating: 3.99 },
  bad: { label: "Bad (1–2★)", min_rating: 0, max_rating: 2.99 },
};
const QUALITY_OPTIONS = Object.entries(QUALITY).map(([k, v]) => [k, v.label]);

const cityName = (slug) =>
  slug === "unassigned" ? "No city" : labelOf(String(slug || ""));

const Stars = ({ rating }) => {
  if (rating === null || rating === undefined) return null;
  const n = Math.round(rating);
  const color = n <= 2 ? "#f06548" : n === 3 ? "#f7b84b" : "#0ab39c";
  return (
    <span style={{ color, letterSpacing: 1 }} title={`${rating} out of 5`}>
      {"★".repeat(n)}
      <span style={{ color: "#ced4da" }}>{"★".repeat(5 - n)}</span>
    </span>
  );
};

const SentimentBadge = ({ sentiment }) => {
  if (!sentiment) return null;
  const [color, label] = SENTIMENT[sentiment] || ["secondary", sentiment];
  return (
    <Badge color={color} pill>
      {label}
    </Badge>
  );
};

const SignalCard = ({ s, score, showCity = true }) => {
  const [icon, color] = KIND_ICON[s.kind] || ["bx bx-radio-circle", "#878a99"];
  return (
    <div className="d-flex gap-3 py-3 border-bottom" style={{ fontSize: 13 }}>
      <div
        className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
        style={{ width: 36, height: 36, background: `${color}1a` }}
      >
        <i className={icon} style={{ fontSize: 18, color }} />
      </div>
      <div className="flex-grow-1" style={{ minWidth: 0 }}>
        <div className="d-flex flex-wrap gap-2 align-items-center mb-1">
          <span className="fw-semibold">{KIND_LABEL[s.kind] || s.kind}</span>
          <span className="text-muted">
            {SOURCE_LABEL[s.source] || s.source}
          </span>
          <Stars rating={s.rating} />
          <SentimentBadge sentiment={s.sentiment} />
          {showCity && s.city && (
            <Badge color="light" pill className="text-dark">
              {cityName(s.city)}
            </Badge>
          )}
          {score !== undefined && (
            <span className="text-muted">match {Math.round(score * 100)}%</span>
          )}
          <span className="text-muted ms-auto text-nowrap">
            {formatDate(s.observed_at)}
          </span>
        </div>
        <div style={{ fontSize: 14 }}>{s.text}</div>
        {s.summary && s.summary !== s.text && (
          <div className="text-muted fst-italic mt-1">{s.summary}</div>
        )}
        {s.url && (
          <a
            href={s.url}
            target="_blank"
            rel="noreferrer"
            className="d-inline-block mt-1"
          >
            Open on Google
          </a>
        )}
      </div>
    </div>
  );
};

const Tile = ({ icon, color, label, value, sub, onClick }) => (
  <Card
    className="h-100 mb-0 shadow-none border"
    style={{ cursor: onClick ? "pointer" : "default" }}
    onClick={onClick}
  >
    <CardBody className="d-flex gap-3 align-items-center py-3">
      <div
        className="d-flex align-items-center justify-content-center rounded flex-shrink-0"
        style={{ width: 44, height: 44, background: `${color}1a` }}
      >
        <i className={icon} style={{ fontSize: 22, color }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div className="text-muted" style={{ fontSize: 12 }}>
          {label}
        </div>
        <div className="fw-semibold" style={{ fontSize: 20, lineHeight: 1.2 }}>
          {value}
        </div>
        {sub && (
          <div className="text-muted text-truncate" style={{ fontSize: 12 }}>
            {sub}
          </div>
        )}
      </div>
    </CardBody>
  </Card>
);

const TodayTiles = ({ cityDigest, onAlerts }) => {
  if (!cityDigest)
    return (
      <div className="alert alert-light border mb-3" style={{ fontSize: 13 }}>
        No numbers for this city yet. They appear after the morning digest, or
        press Rebuild digest.
      </div>
    );
  const r = cityDigest.reviews;
  const web = cityDigest.web;
  const funnel = cityDigest.funnel || {};
  return (
    <Row className="g-3 mb-3">
      <Col md={6} xl={3}>
        <Tile
          icon="bx bxs-star"
          color="#f7b84b"
          label="Reviews in the last day"
          value={r.count}
          sub={`average ${r.average_rating ?? "–"}★ · ${r.negative} negative`}
        />
      </Col>
      <Col md={6} xl={3}>
        <Tile
          icon="bx bx-error-circle"
          color={cityDigest.open_alerts ? "#f06548" : "#0ab39c"}
          label="Bad reviews waiting"
          value={cityDigest.open_alerts}
          sub={cityDigest.open_alerts ? "Click to see them" : "All handled"}
          onClick={onAlerts}
        />
      </Col>
      <Col md={6} xl={3}>
        <Tile
          icon="bx bx-globe"
          color="#299cdb"
          label="Website visits in the last day"
          value={web ? Math.round(web.sessions) : "–"}
          sub={
            web
              ? `usual ${web.sessions_usual != null ? Math.round(web.sessions_usual) : "–"} · ${Math.round(web.key_events)} call clicks`
              : "No GA4 data"
          }
        />
      </Col>
      <Col md={6} xl={3}>
        <Tile
          icon="bx bx-user-check"
          color="#405189"
          label="ERP in the last day"
          value={`${funnel.lead || 0} leads`}
          sub={
            FUNNEL.slice(1)
              .map(([k, label]) => `${funnel[k] || 0} ${label}`)
              .join(" · ") || "–"
          }
        />
      </Col>
    </Row>
  );
};

const AskCard = ({ city }) => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [hits, setHits] = useState(null);
  const { act, busy } = useAction();
  const cities = useCities();
  const name = cities.find((c) => c.slug === city)?.name || "this city";

  const ask = async () => {
    setAnswer(null);
    setHits(null);
    const result = await act("ask", () =>
      askSignals({ query: question, city, k: 15 }),
    );
    if (result) setAnswer(result);
  };
  const search = async () => {
    setAnswer(null);
    const result = await act("search", () =>
      searchSignals({ query: question, city, k: 20 }),
    );
    if (result) setHits(result);
  };
  const ready = question.trim().length > 1 && !busy;

  return (
    <Card className="h-100 mb-0">
      <CardBody>
        <h5 className="mb-1">
          <i className="bx bx-bulb me-1 text-warning" />
          Ask a question
        </h5>
        <p className="text-muted mb-2" style={{ fontSize: 13 }}>
          Gemini answers from the reviews, calls and searches for {name}, and
          shows what it based the answer on.
        </p>
        <Input
          type="textarea"
          rows={2}
          placeholder="e.g. What are families in Pune worried about this month?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && ready) {
              e.preventDefault();
              ask();
            }
          }}
        />
        <div className="d-flex gap-2 mt-2">
          <Button color="primary" disabled={!ready} onClick={ask}>
            {busy === "ask" ? "Thinking…" : "Ask"}
          </Button>
          <Button color="primary" outline disabled={!ready} onClick={search}>
            Just find matching ones
          </Button>
        </div>
        {answer && (
          <div className="mt-3">
            <div
              className="p-3 rounded"
              style={{ background: "#f3f6f9", fontSize: 14 }}
            >
              {answer.answer.answer}
              <div className="text-muted mt-2" style={{ fontSize: 12 }}>
                Confidence: {answer.answer.confidence} · based on{" "}
                {answer.answer.cited_signal_ids.length} signal(s) below
              </div>
            </div>
            {answer.signals
              .filter((h) =>
                answer.answer.cited_signal_ids.includes(h.signal.id),
              )
              .map((h) => (
                <SignalCard key={h.signal.id} s={h.signal} score={h.score} />
              ))}
          </div>
        )}
        {hits && (
          <div className="mt-3">
            {hits.length === 0 ? (
              <Empty>Nothing matches.</Empty>
            ) : (
              hits.map((h) => (
                <SignalCard key={h.signal.id} s={h.signal} score={h.score} />
              ))
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

const DigestCard = ({ digest, cityDigest }) => (
  <Card className="h-100 mb-0">
    <CardBody>
      <h5 className="mb-1">
        <i className="bx bx-news me-1 text-primary" />
        Today&apos;s digest
      </h5>
      <p className="text-muted mb-2" style={{ fontSize: 13 }}>
        {digest
          ? `Written by Gemini on ${formatDate(digest.day)} from the last day of signals, for all cities.`
          : "Built every morning at 7:00."}
      </p>
      {digest?.highlights?.length ? (
        <ul className="list-unstyled mb-0">
          {digest.highlights.map((h) => (
            <li key={h} className="d-flex gap-2 mb-2" style={{ fontSize: 14 }}>
              <i className="bx bx-check-circle text-success mt-1" />
              <span>{h}</span>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>No digest yet. Press Rebuild digest to make one now.</Empty>
      )}
      {cityDigest?.top_topics?.length > 0 && (
        <div className="mt-2">
          <span className="text-muted me-1" style={{ fontSize: 12 }}>
            Talked about this week:
          </span>
          {cityDigest.top_topics.map((t) => (
            <Badge key={t} color="primary" pill className="me-1 mb-1">
              {t}
            </Badge>
          ))}
        </div>
      )}
    </CardBody>
  </Card>
);

const Alerts = ({ list, filters, lead }) => {
  const { act, busy } = useAction();
  const { setQ, city, setCity, status, setStatus, source, setSource } = filters;
  return (
    <>
      <p className="text-muted" style={{ fontSize: 13 }}>
        Reviews of 2★ or less, or serious complaints, from every city. The city
        centre head is alerted within the hour. Mark each one handled once
        someone has responded.
      </p>
      <div className="d-flex flex-wrap gap-2 mb-2">
        <SearchBox onSearch={setQ} placeholder="Search alerts" />
        <CitySelect
          value={city}
          onChange={setCity}
          allowAll
          activeOnly={false}
          style={{ width: 150 }}
        />
        <FilterSelect
          value={status}
          onChange={setStatus}
          options={ALERT_STATUS}
          allLabel="Open and handled"
        />
        <FilterSelect
          value={source}
          onChange={setSource}
          options={SOURCES}
          allLabel="All sources"
        />
      </div>
      {!list.loading && list.total === 0 ? (
        <Empty>
          <i
            className="bx bx-happy-alt d-block mb-1"
            style={{ fontSize: 28 }}
          />
          No bad reviews waiting.
        </Empty>
      ) : (
        list.items.map((a) => (
          <Card
            key={a.id}
            className="mb-2 shadow-none"
            style={{
              border: "1px solid #e9ebec",
              borderLeft: `4px solid ${a.status === "open" ? "#f06548" : "#0ab39c"}`,
            }}
          >
            <CardBody className="py-2" style={{ fontSize: 13 }}>
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <Stars rating={a.rating} />
                <span className="fw-semibold">{cityName(a.city)}</span>
                <span className="text-muted">
                  {SOURCE_LABEL[a.source] || a.source}
                </span>
                {a.severity === "high" && <Badge color="danger">Serious</Badge>}
                {a.status !== "open" && <Badge color="success">Handled</Badge>}
                <span className="text-muted ms-auto">
                  {formatDateTime(a.created_at)}
                </span>
              </div>
              <div className="mt-1" style={{ fontSize: 14 }}>
                {a.summary || a.text}
              </div>
              <div className="d-flex gap-2 mt-2">
                {a.url && (
                  <Button
                    size="sm"
                    color="primary"
                    outline
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open review
                  </Button>
                )}
                {lead && a.status === "open" && (
                  <Button
                    size="sm"
                    color="success"
                    disabled={busy === a.id}
                    onClick={async () =>
                      (await act(
                        a.id,
                        () => acknowledgeAlert(a.id),
                        "Marked as handled",
                      )) && list.reload()
                    }
                  >
                    Mark as handled
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        ))
      )}
      <Pager list={list} />
    </>
  );
};

const Rising = ({ trends }) => {
  if (!trends.length)
    return (
      <Empty>
        Nothing is rising this week. Search Console data appears after the first
        fetch.
      </Empty>
    );
  const top = Math.max(...trends.map((t) => t.growth), 0.01);
  return (
    <>
      <p className="text-muted" style={{ fontSize: 13 }}>
        Google searches in this city that are clearly up on a usual week. These
        feed the weekly plan.
      </p>
      {trends.map((t) => (
        <div key={t.id} className="py-2 border-bottom" style={{ fontSize: 14 }}>
          <div className="d-flex gap-2 align-items-center">
            <i className="bx bx-trending-up text-success" />
            <span className="fw-semibold">{t.query}</span>
            {t.is_new && (
              <Badge color="info" pill>
                New this week
              </Badge>
            )}
            <span className="ms-auto fw-semibold text-success">
              +{Math.round(t.growth * 100)}%
            </span>
          </div>
          <div className="d-flex gap-2 align-items-center mt-1">
            <div
              className="flex-grow-1 rounded"
              style={{ height: 6, background: "#eef0f2" }}
            >
              <div
                className="rounded"
                style={{
                  height: 6,
                  width: `${Math.max(3, (100 * t.growth) / top)}%`,
                  background: "#0ab39c",
                }}
              />
            </div>
            <span
              className="text-muted text-nowrap"
              style={{ fontSize: 12, width: 190, textAlign: "right" }}
            >
              {Math.round(t.current_impressions)} this week · usual{" "}
              {Math.round(t.baseline_impressions)}
            </span>
          </div>
        </div>
      ))}
    </>
  );
};

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
    <>
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
        list.items.map((r) => <SignalCard key={r.id} s={r} />)
      )}
      <Pager list={list} />
    </>
  );
};

const Everything = () => {
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
    <>
      <p className="text-muted" style={{ fontSize: 13 }}>
        Every search, review, call summary and enquiry the agent has collected,
        newest first.
      </p>
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
        list.items.map((sig) => <SignalCard key={sig.id} s={sig} />)
      )}
      <Pager list={list} />
    </>
  );
};

const Signals = () => {
  const [city, setCity] = useDefaultCity();
  const [digest, setDigest] = useState(null);
  const [trends, setTrends] = useState([]);
  const [tab, setTab] = useState("alerts");
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
  const [fetches, setFetches] = useState(0);
  const { can } = useAgentAccess();
  const lead = can("SIGNALS");

  const load = useCallback(() => {
    getLatestDigest()
      .then(setDigest)
      .catch(() => setDigest(null));
    if (city) getTrends(city).then(setTrends).catch(notifyError);
  }, [city]);

  const listenJob = useTrackedJob("listen", {
    onFinished: (job) => {
      if (job.status === "succeeded") toast.success("Signals updated");
      else toast.error(job.error || "Fetching stopped");
      load();
      alerts.reload();
      setFetches((n) => n + 1);
    },
  });
  const digestJob = useTrackedJob("digest", {
    onFinished: (job) => {
      if (job.status === "succeeded") toast.success("Digest rebuilt");
      else toast.error(job.error || "The digest stopped");
      load();
    },
  });

  useEffect(load, [load]);

  const cityDigest = digest?.cities?.find((c) => c.city === city);
  const tabs = [
    ["alerts", "Needs attention", alertStatus === "open" ? alerts.total : null],
    ["rising", "Rising searches", trends.length],
    ["reviews", "Reviews", null],
    ["all", "Everything", null],
  ];

  return (
    <div className="p-3">
      <PageHeader
        title="Signals"
        subtitle="What people search for, say in reviews and ask on calls, city by city. Updated every 6 hours."
      >
        <CitySelect value={city} onChange={setCity} style={{ width: 180 }} />
        {lead && (
          <>
            {digestJob.active ? (
              <Button
                size="sm"
                color="warning"
                onClick={() =>
                  digestJob.show(digestJob.active.id, "Rebuilding the digest")
                }
              >
                <i className="bx bx-loader-alt bx-spin me-1" />
                {digestJob.who} is rebuilding the digest
              </Button>
            ) : (
              <Button
                size="sm"
                color="primary"
                outline
                onClick={() =>
                  digestJob.start(buildDigest, "Rebuilding the digest")
                }
              >
                <i className="bx bx-news me-1" />
                Rebuild digest
              </Button>
            )}
            {listenJob.active ? (
              <Button
                size="sm"
                color="warning"
                onClick={() =>
                  listenJob.show(listenJob.active.id, "Fetching new signals")
                }
              >
                <i className="bx bx-loader-alt bx-spin me-1" />
                {listenJob.who} is fetching · see progress
              </Button>
            ) : (
              <Button
                size="sm"
                color="primary"
                onClick={() =>
                  listenJob.start(runListen, "Fetching new signals")
                }
              >
                <i className="bx bx-download me-1" />
                Fetch new signals
              </Button>
            )}
          </>
        )}
      </PageHeader>

      {listenJob.modal()}
      {digestJob.modal()}
      <h6
        className="text-uppercase text-muted fw-semibold mb-2"
        style={{ fontSize: 11, letterSpacing: 0.5 }}
      >
        Today in {cityName(city)}
      </h6>
      <TodayTiles cityDigest={cityDigest} onAlerts={() => setTab("alerts")} />

      <Row className="g-3 mb-3">
        <Col lg={7}>
          <DigestCard digest={digest} cityDigest={cityDigest} />
        </Col>
        <Col lg={5}>
          <AskCard city={city} />
        </Col>
      </Row>

      <Card>
        <CardBody>
          <Nav tabs className="mb-3">
            {tabs.map(([id, label, count]) => (
              <NavItem key={id}>
                <NavLink
                  href="#"
                  active={tab === id}
                  onClick={(e) => {
                    e.preventDefault();
                    setTab(id);
                  }}
                >
                  {label}
                  {count > 0 && (
                    <Badge
                      color={id === "alerts" ? "danger" : "secondary"}
                      pill
                      className="ms-1"
                    >
                      {count}
                    </Badge>
                  )}
                </NavLink>
              </NavItem>
            ))}
          </Nav>
          {tab === "alerts" && (
            <Alerts
              list={alerts}
              lead={lead}
              filters={{
                setQ: setAlertQ,
                city: alertCity,
                setCity: setAlertCity,
                status: alertStatus,
                setStatus: setAlertStatus,
                source: alertSource,
                setSource: setAlertSource,
              }}
            />
          )}
          {tab === "rising" && <Rising trends={trends} />}
          {tab === "reviews" && <Reviews key={`reviews-${fetches}`} />}
          {tab === "all" && <Everything key={`all-${fetches}`} />}
        </CardBody>
      </Card>
    </div>
  );
};

export default Signals;
