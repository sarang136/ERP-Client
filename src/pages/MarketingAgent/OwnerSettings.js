import React, { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  Col,
  FormGroup,
  Input,
  InputGroup,
  InputGroupText,
  Label,
  Nav,
  NavItem,
  NavLink,
  Row,
  Table,
} from "reactstrap";
import {
  getBudgets,
  getOwnerHistory,
  getOwnerSettings,
  getPlaybook,
  getVoiceGuide,
  setApprovalRules,
  setBudget,
  setPlaybook,
  setVoiceGuide,
} from "../../helpers/marketingAgentApi";
import {
  Empty,
  Loading,
  PageHeader,
  Pager,
  formatDateTime,
  notifyError,
  useAction,
  useAgentAccess,
  useCities,
  usePagedList,
} from "./common";

const thisMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const person = (actor) =>
  String(actor || "")
    .split(":")
    .pop();

const WHO_ICON = {
  "Marketing lead": ["bx bx-user-voice", "#405189"],
  Psychiatrist: ["bx bx-plus-medical", "#f06548"],
  "A person with Ads access": ["bx bx-wallet", "#0ab39c"],
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
        <div className="fw-semibold" style={{ fontSize: 16, lineHeight: 1.3 }}>
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

const TagEditor = ({ values, onChange, disabled, placeholder, color }) => {
  const [text, setText] = useState("");
  const add = () => {
    const value = text.trim();
    if (value && !values.includes(value)) onChange([...values, value]);
    setText("");
  };
  return (
    <div>
      <div className="d-flex flex-wrap gap-2 mb-2">
        {values.length === 0 && (
          <span className="text-muted" style={{ fontSize: 13 }}>
            Nothing yet.
          </span>
        )}
        {values.map((v) => (
          <span
            key={v}
            className="d-inline-flex align-items-center gap-1 rounded-pill px-3 py-1"
            style={{ background: `${color}1a`, color, fontSize: 13 }}
          >
            {v}
            {!disabled && (
              <i
                className="bx bx-x"
                role="button"
                aria-label={`Remove ${v}`}
                style={{ cursor: "pointer", fontSize: 16 }}
                onClick={() => onChange(values.filter((x) => x !== v))}
              />
            )}
          </span>
        ))}
      </div>
      {!disabled && (
        <InputGroup size="sm" style={{ maxWidth: 520 }}>
          <Input
            placeholder={placeholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
          />
          <Button color="primary" outline onClick={add} disabled={!text.trim()}>
            Add
          </Button>
        </InputGroup>
      )}
    </div>
  );
};

const SaveBar = ({ canEdit, busy, onSave, label, note }) =>
  canEdit ? (
    <div className="d-flex align-items-center gap-3 mt-4 pt-3 border-top">
      <Button color="primary" disabled={busy} onClick={onSave}>
        <i className="bx bx-save me-1" />
        {label}
      </Button>
      {note && (
        <span className="text-muted" style={{ fontSize: 12 }}>
          {note}
        </span>
      )}
    </div>
  ) : (
    <div className="text-muted mt-3" style={{ fontSize: 13 }}>
      <i className="bx bx-lock-alt me-1" />
      You can see these but only the marketing lead can change them.
    </div>
  );

const ApprovalRules = ({ settings, canEdit, onSaved }) => {
  const [rules, setRules] = useState(settings.approval_rules);
  const { act, busy } = useAction();
  const set = (key, value) => setRules((r) => ({ ...r, [key]: value }));
  const save = async () => {
    const saved = await act(
      "rules",
      () =>
        setApprovalRules({
          ads_auto_adjust_enabled: rules.ads_auto_adjust_enabled,
          ads_max_auto_change_pct: Number(rules.ads_max_auto_change_pct),
          plan_ready_by: rules.plan_ready_by,
          marketing_lead_webhook_url:
            (rules.marketing_lead_webhook_url || "").trim() || null,
        }),
      "Approval rules saved",
    );
    if (saved) onSaved();
  };

  return (
    <>
      <h6 className="mb-2">Who says yes before the agent goes ahead</h6>
      <Row className="g-2 mb-4">
        {settings.fixed_rules.map((r) => {
          const [icon, color] = WHO_ICON[r.who] || ["bx bx-user", "#878a99"];
          return (
            <Col md={6} key={r.rule}>
              <div className="d-flex gap-3 align-items-start border rounded p-3 h-100">
                <i className={icon} style={{ fontSize: 22, color }} />
                <div style={{ fontSize: 13 }}>
                  <div>{r.rule}</div>
                  <Badge pill className="mt-1" style={{ background: color }}>
                    {r.who}
                  </Badge>
                </div>
              </div>
            </Col>
          );
        })}
      </Row>
      <div className="text-muted mb-4" style={{ fontSize: 12 }}>
        These come from clinical and company policy, so they can&apos;t be
        switched off here.
      </div>

      <h6 className="mb-3">Rules you can set</h6>
      <div className="border rounded p-3 mb-3">
        <div className="d-flex flex-wrap gap-3 align-items-center">
          <i
            className="bx bx-calendar-check text-primary"
            style={{ fontSize: 22 }}
          />
          <div className="flex-grow-1" style={{ minWidth: 240 }}>
            <div className="fw-semibold">Weekly plans must be ready by</div>
            <div className="text-muted" style={{ fontSize: 12 }}>
              Every Monday (IST). If a city has no plan waiting by then, the
              marketing lead is alerted.
            </div>
          </div>
          <Input
            type="time"
            disabled={!canEdit}
            value={rules.plan_ready_by}
            onChange={(e) => set("plan_ready_by", e.target.value)}
            style={{ width: 140 }}
          />
        </div>
      </div>
      <div className="border rounded p-3 mb-3">
        <div className="d-flex flex-wrap gap-3 align-items-center">
          <i className="bx bx-bell text-warning" style={{ fontSize: 22 }} />
          <div className="flex-grow-1" style={{ minWidth: 240 }}>
            <div className="fw-semibold">
              Send &quot;plan not ready&quot; alerts to
            </div>
            <div className="text-muted" style={{ fontSize: 12 }}>
              A webhook (Slack, Teams, Google Chat…). Leave empty to use the
              general alert webhook.
            </div>
          </div>
          <Input
            type="url"
            placeholder="https://…"
            disabled={!canEdit}
            value={rules.marketing_lead_webhook_url || ""}
            onChange={(e) => set("marketing_lead_webhook_url", e.target.value)}
            style={{ width: 360, maxWidth: "100%" }}
          />
        </div>
      </div>
      <div className="border rounded p-3">
        <div className="d-flex flex-wrap gap-3 align-items-center">
          <i
            className="bx bx-slider-alt text-success"
            style={{ fontSize: 22 }}
          />
          <div className="flex-grow-1" style={{ minWidth: 240 }}>
            <div className="fw-semibold">
              Agent may change live ad budgets on its own
            </div>
            <div className="text-muted" style={{ fontSize: 12 }}>
              Small daily-budget changes only. Bigger changes always wait for a
              person, and nothing can go over the monthly limit.
            </div>
          </div>
          <div className="form-check form-switch mb-0">
            <Input
              type="checkbox"
              className="form-check-input"
              id="auto-ads"
              disabled={!canEdit}
              checked={rules.ads_auto_adjust_enabled}
              onChange={(e) => set("ads_auto_adjust_enabled", e.target.checked)}
            />
            <label className="form-check-label" htmlFor="auto-ads">
              {rules.ads_auto_adjust_enabled ? "On" : "Off"}
            </label>
          </div>
          <InputGroup size="sm" style={{ width: 150 }}>
            <InputGroupText>up to</InputGroupText>
            <Input
              type="number"
              min={0}
              max={100}
              disabled={!canEdit || !rules.ads_auto_adjust_enabled}
              value={rules.ads_max_auto_change_pct}
              onChange={(e) => set("ads_max_auto_change_pct", e.target.value)}
            />
            <InputGroupText>%</InputGroupText>
          </InputGroup>
        </div>
      </div>
      <SaveBar
        canEdit={canEdit}
        busy={!!busy}
        onSave={save}
        label="Save rules"
        note={
          rules.updated_by &&
          `Last changed by ${person(rules.updated_by)} on ${formatDateTime(rules.updated_at)}`
        }
      />
    </>
  );
};

const BrandVoice = ({ canEdit, onSaved }) => {
  const [guide, setGuide] = useState(null);
  const { act, busy } = useAction();

  useEffect(() => {
    getVoiceGuide().then(setGuide).catch(notifyError);
  }, []);

  if (!guide) return <Loading />;
  const save = async () => {
    const saved = await act(
      "voice",
      () =>
        setVoiceGuide({
          tone: guide.tone.trim(),
          do: guide.do || [],
          dont: guide.dont || [],
        }),
      "Brand voice saved",
    );
    if (saved) onSaved();
  };
  return (
    <>
      <p className="text-muted" style={{ fontSize: 13 }}>
        How every plan and post should sound. Gemini follows this when it plans
        the week and when it writes each post.
      </p>
      <FormGroup>
        <Label className="fw-semibold">Our tone in one or two sentences</Label>
        <Input
          type="textarea"
          rows={2}
          disabled={!canEdit}
          value={guide.tone}
          onChange={(e) => setGuide({ ...guide, tone: e.target.value })}
        />
      </FormGroup>
      <Row className="g-3">
        <Col md={6}>
          <div className="border rounded p-3 h-100">
            <div className="fw-semibold text-success mb-2">
              <i className="bx bx-check-circle me-1" />
              Always
            </div>
            <TagEditor
              values={guide.do || []}
              onChange={(v) => setGuide({ ...guide, do: v })}
              disabled={!canEdit}
              placeholder="e.g. Use person-first language"
              color="#0ab39c"
            />
          </div>
        </Col>
        <Col md={6}>
          <div className="border rounded p-3 h-100">
            <div className="fw-semibold text-danger mb-2">
              <i className="bx bx-block me-1" />
              Never
            </div>
            <TagEditor
              values={guide.dont || []}
              onChange={(v) => setGuide({ ...guide, dont: v })}
              disabled={!canEdit}
              placeholder="e.g. Promise a cure"
              color="#f06548"
            />
          </div>
        </Col>
      </Row>
      <SaveBar
        canEdit={canEdit}
        busy={!!busy || !guide.tone.trim()}
        onSave={save}
        label="Save brand voice"
        note={
          guide.updated_by &&
          `Last changed by ${person(guide.updated_by)} on ${formatDateTime(guide.updated_at)}`
        }
      />
    </>
  );
};

const OffLimits = ({ canEdit, books, onSaved }) => {
  const cities = useCities();
  const [city, setCity] = useState(null);
  const [topics, setTopics] = useState([]);
  const { act, busy } = useAction();
  const selected = city || cities.find((c) => c.active)?.slug || "";
  const book = books[selected];

  useEffect(() => {
    if (book) setTopics(book.off_limits_topics);
  }, [book]);

  const save = async () => {
    const saved = await act(
      "off",
      () =>
        setPlaybook(selected, {
          city: selected,
          languages: book.languages,
          formats: book.formats,
          channels: book.channels,
          notes: book.notes,
          off_limits_topics: topics,
        }),
      "Off-limits topics saved",
    );
    if (saved) onSaved();
  };

  return (
    <>
      <p className="text-muted" style={{ fontSize: 13 }}>
        Topics the agent must never plan or write about in a city. The planner
        skips them, and the content check blocks any post that mentions one.
      </p>
      <Row className="g-3">
        <Col md={4}>
          <div className="list-group">
            {cities.map((c) => {
              const count = books[c.slug]?.off_limits_topics.length;
              return (
                <button
                  type="button"
                  key={c.slug}
                  className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${selected === c.slug ? "active" : ""}`}
                  onClick={() => setCity(c.slug)}
                >
                  <span>
                    {c.name}
                    {!c.active && (
                      <span
                        className="ms-1"
                        style={{ fontSize: 11, opacity: 0.7 }}
                      >
                        (off)
                      </span>
                    )}
                  </span>
                  {count !== undefined && (
                    <Badge
                      color={count ? "danger" : "light"}
                      pill
                      className={count ? "" : "text-dark"}
                    >
                      {count}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </Col>
        <Col md={8}>
          {!book ? (
            <Loading />
          ) : (
            <div className="border rounded p-3">
              <div className="fw-semibold mb-2">
                Never mention in {cities.find((c) => c.slug === selected)?.name}
              </div>
              <TagEditor
                values={topics}
                onChange={setTopics}
                disabled={!canEdit}
                placeholder="e.g. rapid detox"
                color="#f06548"
              />
              <SaveBar
                canEdit={canEdit}
                busy={!!busy}
                onSave={save}
                label="Save for this city"
              />
            </div>
          )}
        </Col>
      </Row>
    </>
  );
};

const BudgetRow = ({ city, month, budget, canEdit, onSaved }) => {
  const [monthly, setMonthly] = useState(budget?.monthly_limit ?? "");
  const [daily, setDaily] = useState(budget?.daily_limit ?? "");
  const { act, busy } = useAction();
  const changed =
    String(monthly) !== String(budget?.monthly_limit ?? "") ||
    String(daily) !== String(budget?.daily_limit ?? "");
  const bad = monthly && daily && Number(daily) > Number(monthly);
  return (
    <tr>
      <td className="align-middle fw-semibold">{city.name}</td>
      <td style={{ width: 200 }}>
        <InputGroup size="sm">
          <InputGroupText>₹</InputGroupText>
          <Input
            type="number"
            min={1}
            disabled={!canEdit}
            value={monthly}
            onChange={(e) => setMonthly(e.target.value)}
          />
        </InputGroup>
      </td>
      <td style={{ width: 180 }}>
        <InputGroup size="sm">
          <InputGroupText>₹</InputGroupText>
          <Input
            type="number"
            min={1}
            disabled={!canEdit}
            invalid={!!bad}
            value={daily}
            onChange={(e) => setDaily(e.target.value)}
          />
        </InputGroup>
      </td>
      <td className="align-middle" style={{ fontSize: 12 }}>
        {budget ? (
          <Badge color="success" pill>
            Set by {person(budget.set_by)}
          </Badge>
        ) : (
          <Badge color="warning" pill className="text-dark">
            Not set: no ads suggested
          </Badge>
        )}
      </td>
      {canEdit && (
        <td className="align-middle text-end">
          <Button
            size="sm"
            color="primary"
            disabled={!!busy || !changed || !monthly || !daily || !!bad}
            onClick={async () => {
              const saved = await act(
                city.slug,
                () =>
                  setBudget({
                    city: city.slug,
                    month,
                    monthly_limit: Number(monthly),
                    daily_limit: Number(daily),
                  }),
                `${city.name} limit saved`,
              );
              if (saved) onSaved();
            }}
          >
            Save
          </Button>
        </td>
      )}
    </tr>
  );
};

const AdLimits = ({ canEdit, month, setMonth, budgets, onSaved }) => {
  const cities = useCities().filter((c) => c.active);
  return (
    <>
      <p className="text-muted" style={{ fontSize: 13 }}>
        The most that may be spent on ads in each city, per month and per day.
        Weekly plans suggest ad money only inside these limits, and live
        campaigns pause when they reach them.
        {!canEdit && " Saving needs Ads (write) access."}
      </p>
      <div className="d-flex gap-2 align-items-center mb-3">
        <Label className="mb-0 fw-semibold">Month</Label>
        <Input
          type="month"
          bsSize="sm"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          style={{ width: 170 }}
        />
      </div>
      {!budgets ? (
        <Loading />
      ) : (
        <Table responsive className="align-middle" style={{ fontSize: 13 }}>
          <thead className="table-light">
            <tr>
              <th>City</th>
              <th>Per month</th>
              <th>Per day</th>
              <th>Status</th>
              {canEdit && <th />}
            </tr>
          </thead>
          <tbody>
            {cities.map((city) => (
              <BudgetRow
                key={`${city.slug}-${month}-${budgets[city.slug]?.id || "new"}`}
                city={city}
                month={month}
                budget={budgets[city.slug]}
                canEdit={canEdit}
                onSaved={onSaved}
              />
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
};

const ENTITY = {
  voice_guide: ["Brand voice", "bx bx-microphone", "#405189"],
  playbook: ["City playbook", "bx bx-map", "#299cdb"],
  ad_budget: ["Ad limit", "bx bx-wallet", "#0ab39c"],
  approval_rules: ["Approval rules", "bx bx-check-shield", "#f7b84b"],
};
const show = (v) =>
  v === null || v === undefined || v === ""
    ? "–"
    : Array.isArray(v)
      ? v.join(", ") || "–"
      : String(v);

const History = () => {
  const list = usePagedList(getOwnerHistory, {}, 10);
  if (list.loading && !list.items.length) return <Loading />;
  if (!list.items.length) return <Empty>No changes yet.</Empty>;
  return (
    <>
      <p className="text-muted" style={{ fontSize: 13 }}>
        Every change to these settings: who made it, when, and what it was
        before and after.
      </p>
      {list.items.map((e) => {
        const [label, icon, color] = ENTITY[e.entity] || [
          e.entity,
          "bx bx-edit",
          "#878a99",
        ];
        const changes = Object.entries(e.data?.changes || {});
        return (
          <div key={e.id} className="d-flex gap-3 pb-3">
            <div
              className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
              style={{ width: 36, height: 36, background: `${color}1a` }}
            >
              <i className={icon} style={{ fontSize: 18, color }} />
            </div>
            <div
              className="flex-grow-1 border-bottom pb-3"
              style={{ fontSize: 13 }}
            >
              <div>
                <span className="fw-semibold">{person(e.actor)}</span> changed{" "}
                <span className="fw-semibold">{label}</span>
                {e.entity === "playbook" && (
                  <span className="text-capitalize"> for {e.entity_id}</span>
                )}
                {e.entity === "ad_budget" && e.data?.city && (
                  <span className="text-capitalize">
                    {" "}
                    for {e.data.city}, {e.data.month}
                  </span>
                )}
                <span className="text-muted"> · {formatDateTime(e.at)}</span>
              </div>
              {changes.length === 0 && (
                <div className="text-muted">Saved, nothing changed.</div>
              )}
              {changes.map(([field, c]) => (
                <div key={field} className="mt-1">
                  <span className="text-muted text-capitalize">
                    {field.replace(/_/g, " ")}:
                  </span>{" "}
                  <span
                    className="px-1 rounded"
                    style={{
                      background: "#fde8e4",
                      textDecoration: "line-through",
                    }}
                  >
                    {show(c.from)}
                  </span>{" "}
                  →{" "}
                  <span
                    className="px-1 rounded"
                    style={{ background: "#daf4f0" }}
                  >
                    {show(c.to)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      <Pager list={list} />
    </>
  );
};

const OwnerSettings = () => {
  const { can } = useAgentAccess();
  const canEdit = can("BRAND");
  const canBudget = can("ADS");
  const cities = useCities();
  const [tab, setTab] = useState("rules");
  const [settings, setSettings] = useState(null);
  const [books, setBooks] = useState({});
  const [month, setMonth] = useState(thisMonth);
  const [budgets, setBudgets] = useState(null);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    getOwnerSettings().then(setSettings).catch(notifyError);
  }, [version]);

  useEffect(() => {
    setBudgets(null);
    getBudgets({ month, limit: 200 })
      .then((page) =>
        setBudgets(Object.fromEntries(page.items.map((b) => [b.city, b]))),
      )
      .catch(notifyError);
  }, [month, version]);

  const slugs = cities.map((c) => c.slug).join();
  useEffect(() => {
    if (!slugs) return;
    Promise.all(slugs.split(",").map((s) => getPlaybook(s).catch(() => null)))
      .then((list) =>
        setBooks(
          Object.fromEntries(list.filter(Boolean).map((b) => [b.city, b])),
        ),
      )
      .catch(notifyError);
  }, [slugs, version]);

  const rules = settings?.approval_rules;
  const active = cities.filter((c) => c.active);
  const limited = budgets ? active.filter((c) => budgets[c.slug]).length : null;
  const offTotal = Object.values(books).reduce(
    (n, b) => n + b.off_limits_topics.length,
    0,
  );
  const tabs = [
    ["rules", "Approval rules", "bx bx-check-shield"],
    ["voice", "Brand voice", "bx bx-microphone"],
    ["off", "Off-limits topics", "bx bx-block"],
    ["limits", "Ad limits", "bx bx-wallet"],
    ["history", "Change history", "bx bx-history"],
  ];

  return (
    <div className="p-3">
      <PageHeader
        title="Owner settings"
        subtitle="The rules the marketing lead sets. The agent follows them and never changes them itself."
      />
      <div
        className="alert alert-info py-2 d-flex gap-2 align-items-center"
        style={{ fontSize: 13 }}
      >
        <i className="bx bx-lock-alt" style={{ fontSize: 18 }} />
        <span>
          Only a signed-in person can change these (Brand write, and Ads write
          for ad limits). Every change is recorded in Change history.
        </span>
      </div>

      {!rules ? (
        <Loading />
      ) : (
        <Row className="g-3 mb-3">
          <Col md={6} xl={3}>
            <Tile
              icon="bx bx-calendar-check"
              color="#405189"
              label="Plans ready by"
              value={`Monday ${rules.plan_ready_by}`}
              sub={
                rules.marketing_lead_webhook_url
                  ? "Alerts go to the marketing lead"
                  : "No alert webhook set"
              }
              onClick={() => setTab("rules")}
            />
          </Col>
          <Col md={6} xl={3}>
            <Tile
              icon="bx bx-slider-alt"
              color={rules.ads_auto_adjust_enabled ? "#0ab39c" : "#878a99"}
              label="Automatic ad budget changes"
              value={
                rules.ads_auto_adjust_enabled
                  ? `On, up to ${rules.ads_max_auto_change_pct}%`
                  : "Off"
              }
              sub="Bigger changes wait for a person"
              onClick={() => setTab("rules")}
            />
          </Col>
          <Col md={6} xl={3}>
            <Tile
              icon="bx bx-wallet"
              color={limited === active.length ? "#0ab39c" : "#f7b84b"}
              label={`Ad limits for ${month}`}
              value={
                limited === null ? "…" : `${limited} of ${active.length} cities`
              }
              sub={
                limited === active.length
                  ? "Every active city has a limit"
                  : "Cities without a limit get no ad suggestions"
              }
              onClick={() => setTab("limits")}
            />
          </Col>
          <Col md={6} xl={3}>
            <Tile
              icon="bx bx-block"
              color="#f06548"
              label="Off-limits topics"
              value={`${offTotal} across ${Object.keys(books).length} cities`}
              sub="Blocked in plans and posts"
              onClick={() => setTab("off")}
            />
          </Col>
        </Row>
      )}

      <Card>
        <CardBody>
          <Nav tabs className="mb-3">
            {tabs.map(([id, label, icon]) => (
              <NavItem key={id}>
                <NavLink
                  href="#"
                  active={tab === id}
                  onClick={(e) => {
                    e.preventDefault();
                    setTab(id);
                  }}
                >
                  <i className={`${icon} me-1`} />
                  {label}
                </NavLink>
              </NavItem>
            ))}
          </Nav>
          {tab === "rules" &&
            (settings ? (
              <ApprovalRules
                key={version}
                settings={settings}
                canEdit={canEdit}
                onSaved={refresh}
              />
            ) : (
              <Loading />
            ))}
          {tab === "voice" && (
            <BrandVoice canEdit={canEdit} onSaved={refresh} />
          )}
          {tab === "off" && (
            <OffLimits canEdit={canEdit} books={books} onSaved={refresh} />
          )}
          {tab === "limits" && (
            <AdLimits
              canEdit={canBudget}
              month={month}
              setMonth={setMonth}
              budgets={budgets}
              onSaved={refresh}
            />
          )}
          {tab === "history" && <History key={version} />}
        </CardBody>
      </Card>
    </div>
  );
};

export default OwnerSettings;
