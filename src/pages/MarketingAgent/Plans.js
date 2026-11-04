import React, { useCallback, useEffect, useState } from "react";
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
  Table,
} from "reactstrap";
import {
  approveAdSuggestion,
  approvePlan,
  generateContent,
  generatePlan,
  getPlan,
  getPlanReadiness,
  getPlans,
  recalculateAdSuggestion,
  regeneratePlan,
  rejectAdSuggestion,
  rejectPlan,
  updateBrief,
} from "../../helpers/marketingAgentApi";
import {
  CitySelect,
  Empty,
  FORMAT_CHOICES,
  FilterSelect,
  LANGUAGE_CHOICES,
  Loading,
  PageHeader,
  Pager,
  StateBadge,
  formatDate,
  notifyError,
  useAction,
  useAgentAccess,
  useDefaultCity,
  useJob,
  usePagedList,
  PANE,
  nextMonday,
  weekStartOf,
} from "./common";
import {
  PlanInputsModal,
  PlanRagView,
  ScoreBreakdown,
  WriterInputsModal,
} from "./InputsEditors";

const CHANNEL_ICON = {
  instagram: ["bx bxl-instagram", "#d6249f", "Instagram"],
  facebook: ["bx bxl-facebook", "#1877f2", "Facebook"],
  youtube: ["bx bxl-youtube", "#ff0000", "YouTube"],
  linkedin: ["bx bxl-linkedin", "#0a66c2", "LinkedIn"],
  gbp: ["bx bxl-google", "#4285f4", "Google profile"],
  website: ["bx bx-globe", "#405189", "Website"],
};
const FORMAT_LABEL = Object.fromEntries(FORMAT_CHOICES);
const LANGUAGE_LABEL = Object.fromEntries(LANGUAGE_CHOICES);
const AUDIENCE_LABEL = { family: "For families", self: "For the person" };

const priorityOf = (score) =>
  score >= 0.4
    ? ["High", "success"]
    : score >= 0.28
      ? ["Medium", "warning"]
      : ["Low", "secondary"];

const weekRange = (weekStart) => {
  const start = new Date(`${String(weekStart).slice(0, 10)}T00:00:00`);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const day = (d, withMonth) =>
    d.toLocaleDateString("en-IN", {
      day: "numeric",
      ...(withMonth ? { month: "short" } : {}),
    });
  const sameMonth = start.getMonth() === end.getMonth();
  return `${day(start, !sameMonth)} – ${day(end, true)} ${end.getFullYear()}`;
};

const dayTitle = (value) =>
  new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString(
    "en-IN",
    { weekday: "long", day: "numeric", month: "short" },
  );

const countBy = (items, key) =>
  items.reduce((acc, item) => {
    acc[item[key]] = (acc[item[key]] || 0) + 1;
    return acc;
  }, {});

const Stat = ({ label, children }) => (
  <div
    className="border rounded px-3 py-2 bg-white"
    style={{ minWidth: 150, flex: "1 1 150px" }}
  >
    <div className="text-muted" style={{ fontSize: 12 }}>
      {label}
    </div>
    <div className="fw-semibold" style={{ fontSize: 14 }}>
      {children}
    </div>
  </div>
);

const NextStep = ({ plan, live, written }) => {
  if (plan.status === "draft")
    return (
      <div className="alert alert-warning mb-3" style={{ fontSize: 14 }}>
        <i className="bx bx-info-circle me-1" />
        <strong>Waiting for approval.</strong> Read the {live.length} post ideas
        below. Drop any you don&apos;t want, then approve or reject the plan at
        the bottom. Nothing is written until the plan is approved.
      </div>
    );
  if (plan.status === "approved")
    return (
      <div className="alert alert-success mb-3" style={{ fontSize: 14 }}>
        <i className="bx bx-check-circle me-1" />
        <strong>Approved</strong>
        {plan.decided_by && ` by ${plan.decided_by.split(":").pop()}`}
        {plan.decided_at && ` on ${formatDate(plan.decided_at)}`}.{" "}
        {written < live.length
          ? `Next: press Write on each post to create it (${written} of ${live.length} written).`
          : `All ${live.length} posts are written: review them in Content Review.`}
      </div>
    );
  return (
    <div className="alert alert-secondary mb-3" style={{ fontSize: 14 }}>
      <strong>Rejected.</strong> {plan.decision_reason} Use Regenerate to make a
      new version.
    </div>
  );
};

const PostCard = ({ brief: b, actions }) => {
  const [icon, color, channel] = CHANNEL_ICON[b.channel] || [
    "bx bx-news",
    "#878a99",
    b.channel,
  ];
  const [priority, priorityColor] = priorityOf(b.score);
  return (
    <Card
      className="mb-2 shadow-none border"
      style={{ opacity: b.status === "dropped" ? 0.5 : 1 }}
    >
      <CardBody className="py-3 d-flex gap-3 align-items-start">
        <div
          className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
          style={{ width: 40, height: 40, background: `${color}1a` }}
          title={channel}
        >
          <i className={icon} style={{ fontSize: 22, color }} />
        </div>
        <div className="flex-grow-1" style={{ minWidth: 0 }}>
          <div className="d-flex flex-wrap gap-1 mb-1" style={{ fontSize: 12 }}>
            <Badge color="primary" pill>
              {FORMAT_LABEL[b.format] || b.format}
            </Badge>
            <Badge color="light" pill className="text-dark">
              {channel}
            </Badge>
            <Badge color="light" pill className="text-dark">
              {AUDIENCE_LABEL[b.audience] || b.audience}
            </Badge>
            <Badge color="light" pill className="text-dark">
              {LANGUAGE_LABEL[b.language] || b.language}
            </Badge>
            {b.seasonal_event && (
              <Badge color="info" pill>
                {b.seasonal_event}
              </Badge>
            )}
          </div>
          <div className="fw-semibold" style={{ fontSize: 15 }}>
            {b.topic}
          </div>
          <div className="text-muted" style={{ fontSize: 13 }}>
            {b.angle}
          </div>
          <div className="mt-2" style={{ fontSize: 13 }}>
            <span className="fw-semibold">Why now: </span>
            {b.rationale}
          </div>
        </div>
        <div className="text-end flex-shrink-0" style={{ width: 170 }}>
          <div title={`Score ${b.score.toFixed(2)}`}>
            <Badge color={priorityColor} className="mb-1">
              {priority} priority
            </Badge>
          </div>
          <ScoreBreakdown parts={b.score_parts} />
          <div className="mt-2">
            <StateBadge state={b.status} />
          </div>
          {actions && <div className="mt-2">{actions}</div>}
        </div>
      </CardBody>
    </Card>
  );
};

const rupees = (n) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;

const PLATFORM = {
  meta: ["Meta boost", "primary"],
  google: ["Google search ad", "success"],
};

const AdBudgetView = ({ plan, onChanged }) => {
  const s = plan.ad_suggestion;
  const { act, busy } = useAction();
  const { can } = useAgentAccess();
  const decide = async (approve) => {
    const updated = await act(
      approve ? "approve-ads" : "reject-ads",
      () =>
        approve ? approveAdSuggestion(plan.id) : rejectAdSuggestion(plan.id),
      approve ? "Ad budget plan approved" : "Ad budget plan rejected",
    );
    if (updated) onChanged(updated);
  };
  const recalc = async () => {
    const updated = await act(
      "recalc-ads",
      () => recalculateAdSuggestion(plan.id),
      "Recalculated with the latest spend",
    );
    if (updated) onChanged(updated);
  };

  if (!s)
    return (
      <Empty>
        This plan was made before ad suggestions were added.
        {can("PLANS") && (
          <div className="mt-2">
            <Button size="sm" color="primary" outline onClick={recalc}>
              Suggest an ad budget
            </Button>
          </div>
        )}
      </Empty>
    );

  return (
    <div style={{ fontSize: 14 }}>
      <div className="d-flex flex-wrap gap-2 mb-3">
        <Stat label={`Monthly limit (${s.month})`}>
          {s.monthly_limit ? rupees(s.monthly_limit) : "Not set"}
        </Stat>
        <Stat label="Spent this month">{rupees(s.spent_this_month)}</Stat>
        <Stat label="Live campaigns per day">{rupees(s.committed_daily)}</Stat>
        <Stat label="Free for this week">{rupees(s.available_this_week)}</Stat>
        <Stat label="Suggested this week">{rupees(s.total)}</Stat>
      </div>
      {s.note && (
        <div className="alert alert-secondary py-2" style={{ fontSize: 13 }}>
          {s.note}
        </div>
      )}
      {s.items.length > 0 && (
        <Table size="sm" responsive style={{ fontSize: 13 }}>
          <thead className="table-light">
            <tr>
              <th>Where</th>
              <th>Topic</th>
              <th className="text-end">Per day</th>
              <th className="text-end">This week</th>
              <th>Why</th>
            </tr>
          </thead>
          <tbody>
            {s.items.map((i) => {
              const [label, color] = PLATFORM[i.platform] || [
                i.platform,
                "secondary",
              ];
              return (
                <tr key={`${i.platform}-${i.brief_id || i.topic}`}>
                  <td>
                    <Badge color={color}>{label}</Badge>
                    <div className="text-muted text-capitalize">
                      {i.channel.replace(/_/g, " ")}
                    </div>
                  </td>
                  <td className="fw-semibold">{i.topic}</td>
                  <td className="text-end">{rupees(i.daily_budget)}</td>
                  <td className="text-end fw-semibold">
                    {rupees(i.week_amount)}
                  </td>
                  <td className="text-muted">{i.reason}</td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
      <div className="text-muted mb-2" style={{ fontSize: 12 }}>
        Suggested from what is left of the city&apos;s monthly limit after this
        month&apos;s spend and live campaigns, so it can never go over the
        limit. Approving it does not spend anything: campaigns are still created
        and approved on the Ads page once the posts are published.
      </div>
      {s.status === "proposed" && s.items.length > 0 && can("ADS") && (
        <div className="d-flex gap-2">
          <Button
            color="success"
            disabled={!!busy}
            onClick={() => decide(true)}
          >
            Approve ad budget
          </Button>
          <Button
            color="danger"
            outline
            disabled={!!busy}
            onClick={() => decide(false)}
          >
            Reject
          </Button>
        </div>
      )}
      {s.status !== "proposed" && (
        <div
          className={`alert py-2 alert-${s.status === "approved" ? "success" : "secondary"}`}
        >
          {s.status === "approved" ? "Approved" : "Rejected"}
          {s.decided_by && ` by ${s.decided_by.split(":").pop()}`}
          {s.decided_at && ` on ${formatDate(s.decided_at)}`}.
        </div>
      )}
      {can("PLANS") && (
        <Button
          size="sm"
          color="primary"
          outline
          className="mt-2"
          disabled={!!busy}
          onClick={recalc}
        >
          <i className="bx bx-refresh me-1" />
          Recalculate with latest spend
        </Button>
      )}
    </div>
  );
};

const Readiness = ({ version }) => {
  const [data, setData] = useState(null);
  useEffect(() => {
    getPlanReadiness()
      .then(setData)
      .catch(() => setData(null));
  }, [version]);
  if (!data || !data.cities.length) return null;
  const missing = data.cities.filter((c) => !c.ready);
  return (
    <div
      className={`alert py-2 mb-3 alert-${missing.length ? "warning" : "success"}`}
      style={{ fontSize: 13 }}
    >
      <strong>Next week ({weekRange(data.week_start)}):</strong>{" "}
      {data.cities.map((c, i) => (
        <span key={c.city}>
          {i > 0 && " · "}
          {c.name}{" "}
          {c.ready ? (
            <i className="bx bx-check text-success" title={c.status} />
          ) : (
            <span className="text-danger">no plan yet</span>
          )}
        </span>
      ))}
      <span className="text-muted">
        {" "}
        · plans must be waiting for approval by Monday {data.ready_by} IST
      </span>
    </div>
  );
};

const PlanDetail = ({ planId, onDecided }) => {
  const [plan, setPlan] = useState(null);
  const [reason, setReason] = useState("");
  const [writing, setWriting] = useState(null);
  const [tab, setTab] = useState("ideas");
  const [remake, setRemake] = useState(null);
  const closeRemake = useCallback(() => setRemake(null), []);
  const { act, busy } = useAction();
  const { run, running } = useJob();
  const { can } = useAgentAccess();

  const load = useCallback(() => {
    getPlan(planId).then(setPlan).catch(notifyError);
  }, [planId]);

  useEffect(load, [load]);

  if (!plan) return <Loading />;
  const isDraft = plan.status === "draft";
  const lead = can("PLANS");
  const writer = plan.status === "approved" && can("CONTENT");
  const allowed = (format) =>
    !plan.formats?.length || plan.formats.includes(format);
  const live = plan.briefs.filter((b) => b.status !== "dropped");
  const written = live.filter((b) => b.status === "content_created").length;
  const formats = Object.entries(countBy(live, "format"));
  const audiences = countBy(live, "audience");
  const days = plan.briefs.reduce((acc, b) => {
    const key = String(b.scheduled_for).slice(0, 10);
    (acc[key] = acc[key] || []).push(b);
    return acc;
  }, {});

  const remakePlan = async ({ city: _city, week_start: _week, ...body }) => {
    const mode = remake;
    setRemake(null);
    const job = await run(() => regeneratePlan(plan.id, { mode, ...body }), {
      successText:
        mode === "more"
          ? "New post ideas added: approve the plan again"
          : "Plan regenerated: approve it again",
    });
    if (job?.status === "succeeded") {
      load();
      onDecided();
    }
  };

  const write = async (body) => {
    setWriting(null);
    const job = await run(() => generateContent(body), {
      successText: "Written and checked: see Content review",
    });
    if (job?.status === "succeeded") load();
  };

  const decide = async (approve) => {
    const updated = await act(
      approve ? "approve" : "reject",
      () =>
        approve
          ? approvePlan(plan.id, reason || null)
          : rejectPlan(plan.id, reason),
      approve ? "Plan approved" : "Plan rejected",
    );
    if (updated) {
      setPlan(updated);
      onDecided();
    }
  };

  const drop = async (brief) => {
    const updated = await act(
      brief.id,
      () => updateBrief(brief.id, { status: "dropped" }),
      "Post idea dropped",
    );
    if (updated) load();
  };

  const actionsFor = (b) => {
    if (isDraft && lead && b.status === "planned")
      return (
        <Button
          size="sm"
          color="danger"
          outline
          disabled={busy === b.id}
          onClick={() => drop(b)}
        >
          Drop
        </Button>
      );
    if (writer && b.status === "planned")
      return allowed(b.format) ? (
        <Button
          size="sm"
          color="primary"
          disabled={running}
          onClick={() => setWriting(b)}
        >
          {running ? "Writing…" : "Write"}
        </Button>
      ) : (
        <span className="text-muted" style={{ fontSize: 12 }}>
          Format switched off
        </span>
      );
    return null;
  };

  return (
    <Card>
      <CardBody>
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
          <div>
            <h4 className="mb-0 text-capitalize">{plan.city}</h4>
            <div className="text-muted">
              Week of {weekRange(plan.week_start)}
            </div>
          </div>
          <div className="d-flex gap-2 align-items-center">
            {lead && (
              <>
                <Button
                  size="sm"
                  color="primary"
                  outline
                  disabled={running}
                  onClick={() => setRemake("regenerate")}
                >
                  <i className="bx bx-refresh me-1" />
                  Regenerate
                </Button>
                <Button
                  size="sm"
                  color="primary"
                  outline
                  disabled={running}
                  onClick={() => setRemake("more")}
                >
                  <i className="bx bx-plus me-1" />
                  Generate more
                </Button>
              </>
            )}
            <StateBadge state={plan.status} />
          </div>
        </div>
        {running && (
          <div className="text-muted mb-2" style={{ fontSize: 13 }}>
            Working… (about a minute)
          </div>
        )}

        <NextStep plan={plan} live={live} written={written} />

        <div className="rounded p-3 mb-3" style={{ background: "#f3f6f9" }}>
          <div
            className="text-uppercase text-muted fw-semibold mb-1"
            style={{ fontSize: 11, letterSpacing: 0.5 }}
          >
            This week&apos;s focus
          </div>
          <div style={{ fontSize: 14 }}>{plan.summary}</div>
          <div className="d-flex flex-wrap gap-2 mt-3">
            <Stat label="Posts">{live.length}</Stat>
            <Stat label="Who they speak to">
              {audiences.family || 0} families · {audiences.self || 0} the
              person
            </Stat>
            <Stat label="Formats">
              {formats
                .map(([f, n]) => `${n} ${FORMAT_LABEL[f] || f}`)
                .join(", ") || "-"}
            </Stat>
            <Stat label="Written">
              {written} of {live.length}
            </Stat>
          </div>
          {plan.notes && (
            <div className="mt-2" style={{ fontSize: 13 }}>
              <span className="fw-semibold">Your notes: </span>
              {plan.notes}
            </div>
          )}
        </div>

        <Nav tabs className="mb-3">
          {[
            ["ideas", `Post ideas (${live.length})`],
            ["ads", "Ad budget"],
            ["rag", "Why these topics (RAG output used)"],
          ].map(([id, label]) => (
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
              </NavLink>
            </NavItem>
          ))}
        </Nav>
        {tab === "ads" ? (
          <AdBudgetView plan={plan} onChanged={setPlan} />
        ) : tab === "rag" ? (
          <>
            <PlanRagView plan={plan} />
            {lead && (
              <Button
                size="sm"
                color="primary"
                disabled={running}
                onClick={() => setRemake("regenerate")}
              >
                Edit and regenerate
              </Button>
            )}
          </>
        ) : (
          <>
            {plan.decision_reason && plan.status !== "rejected" && (
              <p style={{ fontSize: 13 }}>
                <strong>Decision note:</strong> {plan.decision_reason}
              </p>
            )}
            {Object.keys(days)
              .sort()
              .map((day) => (
                <div key={day} className="mb-3">
                  <div
                    className="fw-semibold text-uppercase text-muted mb-2"
                    style={{ fontSize: 12, letterSpacing: 0.5 }}
                  >
                    {dayTitle(day)}
                  </div>
                  {days[day].map((b) => (
                    <PostCard key={b.id} brief={b} actions={actionsFor(b)} />
                  ))}
                </div>
              ))}
            {plan.briefs.length === 0 && <Empty>No post ideas.</Empty>}
            {isDraft && lead && (
              <Card className="border border-warning shadow-none mt-3">
                <CardBody>
                  <h6 className="mb-1">Your decision</h6>
                  <div className="text-muted mb-2" style={{ fontSize: 13 }}>
                    Approve to let the team write these posts. To reject, say
                    why so the next version can fix it.
                  </div>
                  <Input
                    type="textarea"
                    rows={2}
                    placeholder="Note (needed to reject)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <div className="d-flex gap-2 mt-2">
                    <Button
                      color="success"
                      disabled={!!busy}
                      onClick={() => decide(true)}
                    >
                      Approve plan
                    </Button>
                    <Button
                      color="danger"
                      outline
                      disabled={!!busy || reason.trim().length < 3}
                      onClick={() => decide(false)}
                    >
                      Reject plan
                    </Button>
                  </div>
                </CardBody>
              </Card>
            )}
          </>
        )}
        {remake && (
          <PlanInputsModal
            city={plan.city}
            weekStart={plan.week_start}
            plan={plan}
            mode={remake}
            onClose={closeRemake}
            onSend={remakePlan}
          />
        )}
        {writing && (
          <WriterInputsModal
            brief={writing}
            onClose={() => setWriting(null)}
            onSend={write}
          />
        )}
      </CardBody>
    </Card>
  );
};

const PLAN_STATUS = ["draft", "approved", "rejected"];

const Plans = () => {
  const [city, setCity] = useDefaultCity();
  const [status, setStatus] = useState("");
  const [since, setSince] = useState("");
  const [until, setUntil] = useState("");
  const list = usePagedList(getPlans, { city, status, since, until });
  const [selectedId, setSelectedId] = useState(null);
  const [preparing, setPreparing] = useState(false);
  const [draftWeek, setDraftWeek] = useState(nextMonday);
  const { run, running } = useJob();
  const { can } = useAgentAccess();
  const selected = list.items.some((p) => p.id === selectedId)
    ? selectedId
    : list.items[0]?.id || null;

  const closeInputs = useCallback(() => setPreparing(false), []);

  const generate = async (body) => {
    setPreparing(false);
    const job = await run(() => generatePlan(body), {
      successText: "Plan drafted",
    });
    if (job?.status === "succeeded") {
      setSelectedId(job.result.week_id);
      list.reload();
    }
  };

  return (
    <div className="p-3">
      <PageHeader
        title="Weekly plans"
        subtitle="Each week the agent suggests posts for every city. The marketing lead approves the plan, then the posts get written."
      >
        <CitySelect value={city} onChange={setCity} style={{ width: 180 }} />
        {can("PLANS") && (
          <>
            <span className="text-muted" style={{ fontSize: 13 }}>
              Week of
            </span>
            <Input
              type="date"
              bsSize="sm"
              value={draftWeek}
              onChange={(e) => setDraftWeek(weekStartOf(e.target.value))}
              style={{ width: 150 }}
            />
            <Button
              size="sm"
              color="primary"
              disabled={!city || !draftWeek || running}
              onClick={() => setPreparing(true)}
            >
              {running
                ? "Planning… (about a minute)"
                : draftWeek === nextMonday()
                  ? `Draft next week's plan (${formatDate(draftWeek)})`
                  : `Draft plan for week of ${formatDate(draftWeek)}`}
            </Button>
          </>
        )}
      </PageHeader>
      <Readiness
        version={list.items.map((p) => `${p.id}:${p.status}`).join()}
      />
      {preparing && (
        <PlanInputsModal
          city={city}
          weekStart={draftWeek}
          onClose={closeInputs}
          onSend={generate}
        />
      )}
      <div className="d-flex gap-2 flex-wrap align-items-center mb-3">
        <FilterSelect
          value={status}
          onChange={setStatus}
          options={PLAN_STATUS}
          allLabel="All statuses"
        />
        <span className="text-muted" style={{ fontSize: 13 }}>
          Weeks from
        </span>
        <Input
          type="date"
          bsSize="sm"
          value={since}
          onChange={(e) => setSince(e.target.value)}
          style={{ width: 150 }}
        />
        <span className="text-muted" style={{ fontSize: 13 }}>
          to
        </span>
        <Input
          type="date"
          bsSize="sm"
          value={until}
          onChange={(e) => setUntil(e.target.value)}
          style={{ width: 150 }}
        />
      </div>
      {list.loading && list.items.length === 0 ? (
        <Loading />
      ) : list.total === 0 ? (
        <Empty>No plans match.</Empty>
      ) : (
        <Row>
          <Col lg={3} style={PANE}>
            <div
              className="text-uppercase text-muted fw-semibold mb-2"
              style={{ fontSize: 11, letterSpacing: 0.5 }}
            >
              Weeks
            </div>
            {list.items.map((p) => (
              <Card
                key={p.id}
                className="mb-2 shadow-none"
                style={{
                  cursor: "pointer",
                  border: "1px solid #e9ebec",
                  borderLeft:
                    selected === p.id
                      ? "4px solid #405189"
                      : "4px solid transparent",
                  background: selected === p.id ? "#f3f6f9" : undefined,
                }}
                onClick={() => setSelectedId(p.id)}
              >
                <CardBody className="py-2">
                  <div className="fw-semibold" style={{ fontSize: 13 }}>
                    {weekRange(p.week_start)}
                  </div>
                  <StateBadge state={p.status} />
                </CardBody>
              </Card>
            ))}
            <Pager list={list} />
          </Col>
          <Col lg={9} style={PANE}>
            {selected && (
              <PlanDetail
                key={selected}
                planId={selected}
                onDecided={list.reload}
              />
            )}
          </Col>
        </Row>
      )}
    </div>
  );
};

export default Plans;
