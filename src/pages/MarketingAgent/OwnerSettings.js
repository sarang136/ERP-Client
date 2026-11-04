import React, { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  Col,
  FormGroup,
  Input,
  Label,
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
  CitySelect,
  Empty,
  Loading,
  PageHeader,
  Pager,
  formatDateTime,
  notifyError,
  useAction,
  useAgentAccess,
  useCities,
  useDefaultCity,
  usePagedList,
} from "./common";

const lines = (text) =>
  text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

const thisMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const PERSON_ONLY =
  "Only a signed-in person with Brand (write) access can change this. Every change is recorded below.";

const Section = ({ title, hint, children }) => (
  <Card className="mb-3">
    <CardBody>
      <h5 className="mb-1">{title}</h5>
      {hint && (
        <p className="text-muted mb-3" style={{ fontSize: 13 }}>
          {hint}
        </p>
      )}
      {children}
    </CardBody>
  </Card>
);

const ApprovalRulesCard = ({ canEdit }) => {
  const [data, setData] = useState(null);
  const [rules, setRules] = useState(null);
  const { act, busy } = useAction();

  useEffect(() => {
    getOwnerSettings()
      .then((s) => {
        setData(s);
        setRules(s.approval_rules);
      })
      .catch(notifyError);
  }, []);

  if (!rules) return <Loading />;
  const set = (key, value) => setRules((r) => ({ ...r, [key]: value }));
  const save = () =>
    act(
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

  return (
    <Section
      title="Approval rules"
      hint="Who has to say yes before the agent goes ahead."
    >
      <Table size="sm" className="mb-4" style={{ fontSize: 13 }}>
        <thead className="table-light">
          <tr>
            <th>What</th>
            <th style={{ width: 200 }}>Who approves</th>
          </tr>
        </thead>
        <tbody>
          {data.fixed_rules.map((r) => (
            <tr key={r.rule}>
              <td>{r.rule}</td>
              <td>
                <Badge color="primary">{r.who}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Row className="g-3">
        <Col md={4}>
          <FormGroup>
            <Label>Weekly plans must be ready by (Monday, IST)</Label>
            <Input
              type="time"
              disabled={!canEdit}
              value={rules.plan_ready_by}
              onChange={(e) => set("plan_ready_by", e.target.value)}
            />
            <div className="text-muted mt-1" style={{ fontSize: 12 }}>
              If a city has no plan waiting by then, the marketing lead is
              alerted.
            </div>
          </FormGroup>
        </Col>
        <Col md={8}>
          <FormGroup>
            <Label>Send "plan not ready" alerts to (webhook)</Label>
            <Input
              type="url"
              placeholder="https://… (empty: the general alert webhook)"
              disabled={!canEdit}
              value={rules.marketing_lead_webhook_url || ""}
              onChange={(e) =>
                set("marketing_lead_webhook_url", e.target.value)
              }
            />
          </FormGroup>
        </Col>
        <Col md={12}>
          <div className="form-check form-switch mb-2">
            <Input
              type="checkbox"
              className="form-check-input"
              id="auto-ads"
              disabled={!canEdit}
              checked={rules.ads_auto_adjust_enabled}
              onChange={(e) => set("ads_auto_adjust_enabled", e.target.checked)}
            />
            <label className="form-check-label" htmlFor="auto-ads">
              Let the agent change the daily budget of live campaigns on its
              own, by at most{" "}
              <Input
                type="number"
                bsSize="sm"
                min={0}
                max={100}
                disabled={!canEdit || !rules.ads_auto_adjust_enabled}
                value={rules.ads_max_auto_change_pct}
                onChange={(e) => set("ads_max_auto_change_pct", e.target.value)}
                style={{ width: 70, display: "inline-block" }}
              />{" "}
              %. Bigger changes always wait for a person. It can never go over
              the monthly limit.
            </label>
          </div>
        </Col>
      </Row>
      {canEdit && (
        <Button color="primary" disabled={!!busy} onClick={save}>
          Save rules
        </Button>
      )}
      {rules.updated_by && (
        <div className="text-muted mt-2" style={{ fontSize: 12 }}>
          Last changed by {rules.updated_by.split(":").pop()} on{" "}
          {formatDateTime(rules.updated_at)}
        </div>
      )}
    </Section>
  );
};

const VoiceCard = ({ canEdit }) => {
  const [form, setForm] = useState(null);
  const { act, busy } = useAction();

  useEffect(() => {
    getVoiceGuide()
      .then((g) =>
        setForm({
          tone: g.tone,
          doText: (g.do || []).join("\n"),
          dontText: (g.dont || []).join("\n"),
          updated_by: g.updated_by,
          updated_at: g.updated_at,
        }),
      )
      .catch(notifyError);
  }, []);

  if (!form) return <Loading />;
  return (
    <Section
      title="Brand voice"
      hint="How every plan and post should sound. The planner and the writer both follow it."
    >
      <FormGroup>
        <Label>Tone</Label>
        <Input
          type="textarea"
          rows={2}
          disabled={!canEdit}
          value={form.tone}
          onChange={(e) => setForm({ ...form, tone: e.target.value })}
        />
      </FormGroup>
      <Row>
        <Col md={6}>
          <FormGroup>
            <Label>Always (one per line)</Label>
            <Input
              type="textarea"
              rows={5}
              disabled={!canEdit}
              value={form.doText}
              onChange={(e) => setForm({ ...form, doText: e.target.value })}
            />
          </FormGroup>
        </Col>
        <Col md={6}>
          <FormGroup>
            <Label>Never (one per line)</Label>
            <Input
              type="textarea"
              rows={5}
              disabled={!canEdit}
              value={form.dontText}
              onChange={(e) => setForm({ ...form, dontText: e.target.value })}
            />
          </FormGroup>
        </Col>
      </Row>
      {canEdit && (
        <Button
          color="primary"
          disabled={!!busy || !form.tone.trim()}
          onClick={() =>
            act(
              "voice",
              () =>
                setVoiceGuide({
                  tone: form.tone.trim(),
                  do: lines(form.doText),
                  dont: lines(form.dontText),
                }),
              "Brand voice saved",
            )
          }
        >
          Save brand voice
        </Button>
      )}
    </Section>
  );
};

const OffLimitsCard = ({ canEdit }) => {
  const [city, setCity] = useDefaultCity();
  const [book, setBook] = useState(null);
  const [text, setText] = useState("");
  const { act, busy } = useAction();

  useEffect(() => {
    if (!city) return;
    setBook(null);
    getPlaybook(city)
      .then((b) => {
        setBook(b);
        setText(b.off_limits_topics.join("\n"));
      })
      .catch(notifyError);
  }, [city]);

  return (
    <Section
      title="Off-limits topics"
      hint="Topics the agent must never plan or write about in a city. Plans skip them and the content check blocks any post that mentions one."
    >
      <div className="mb-2" style={{ maxWidth: 220 }}>
        <CitySelect value={city} onChange={setCity} activeOnly={false} />
      </div>
      {!book ? (
        <Loading />
      ) : (
        <>
          <Input
            type="textarea"
            rows={4}
            disabled={!canEdit}
            placeholder="One topic per line, e.g. rapid detox"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {canEdit && (
            <Button
              className="mt-2"
              color="primary"
              disabled={!!busy}
              onClick={() =>
                act(
                  "off",
                  () =>
                    setPlaybook(city, {
                      city,
                      languages: book.languages,
                      formats: book.formats,
                      channels: book.channels,
                      notes: book.notes,
                      off_limits_topics: lines(text),
                    }),
                  "Off-limits topics saved",
                )
              }
            >
              Save for this city
            </Button>
          )}
        </>
      )}
    </Section>
  );
};

const BudgetRow = ({ city, month, budget, canEdit, onSaved }) => {
  const [monthly, setMonthly] = useState(budget?.monthly_limit ?? "");
  const [daily, setDaily] = useState(budget?.daily_limit ?? "");
  const { act, busy } = useAction();
  const changed =
    String(monthly) !== String(budget?.monthly_limit ?? "") ||
    String(daily) !== String(budget?.daily_limit ?? "");
  return (
    <tr>
      <td className="align-middle">{city.name}</td>
      <td>
        <Input
          type="number"
          bsSize="sm"
          min={1}
          disabled={!canEdit}
          value={monthly}
          onChange={(e) => setMonthly(e.target.value)}
        />
      </td>
      <td>
        <Input
          type="number"
          bsSize="sm"
          min={1}
          disabled={!canEdit}
          value={daily}
          onChange={(e) => setDaily(e.target.value)}
        />
      </td>
      <td className="align-middle text-muted" style={{ fontSize: 12 }}>
        {budget ? `set by ${budget.set_by.split(":").pop()}` : "not set"}
      </td>
      {canEdit && (
        <td>
          <Button
            size="sm"
            color="primary"
            outline
            disabled={!!busy || !changed || !monthly || !daily}
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

const BudgetCard = ({ canEdit }) => {
  const cities = useCities().filter((c) => c.active);
  const [month, setMonth] = useState(thisMonth);
  const [budgets, setBudgets] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    setBudgets(null);
    getBudgets({ month, limit: 200 })
      .then((page) =>
        setBudgets(Object.fromEntries(page.items.map((b) => [b.city, b]))),
      )
      .catch(notifyError);
  }, [month, version]);

  return (
    <Section
      title="Monthly ad limit per city"
      hint="The most the agent may suggest or spend on ads in a city each month and each day. Ad suggestions in weekly plans always stay inside these limits. Saving needs Ads (write) access."
    >
      <div className="d-flex gap-2 align-items-center mb-2">
        <Label className="mb-0">Month</Label>
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
        <Table size="sm" style={{ fontSize: 13 }}>
          <thead className="table-light">
            <tr>
              <th>City</th>
              <th>Monthly limit (₹)</th>
              <th>Daily limit (₹)</th>
              <th />
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
                onSaved={() => setVersion((v) => v + 1)}
              />
            ))}
          </tbody>
        </Table>
      )}
    </Section>
  );
};

const ENTITY_LABEL = {
  voice_guide: "Brand voice",
  playbook: "City playbook",
  ad_budget: "Ad limit",
  approval_rules: "Approval rules",
};

const show = (v) =>
  v === null || v === undefined || v === ""
    ? "–"
    : Array.isArray(v)
      ? v.join(", ") || "–"
      : String(v);

const History = () => {
  const list = usePagedList(getOwnerHistory, {}, 10);
  return (
    <Section
      title="Change history"
      hint="Every change to these settings: who made it, when, and what changed."
    >
      {list.loading && !list.items.length ? (
        <Loading />
      ) : !list.items.length ? (
        <Empty>No changes yet.</Empty>
      ) : (
        <Table size="sm" style={{ fontSize: 13 }}>
          <thead className="table-light">
            <tr>
              <th style={{ width: 150 }}>When</th>
              <th style={{ width: 140 }}>Who</th>
              <th style={{ width: 170 }}>What</th>
              <th>Changes</th>
            </tr>
          </thead>
          <tbody>
            {list.items.map((e) => {
              const changes = Object.entries(e.data?.changes || {});
              return (
                <tr key={e.id}>
                  <td>{formatDateTime(e.at)}</td>
                  <td>{e.actor.split(":").pop()}</td>
                  <td>
                    {ENTITY_LABEL[e.entity] || e.entity}
                    {e.entity === "playbook" && (
                      <span className="text-muted text-capitalize">
                        {" "}
                        · {e.entity_id}
                      </span>
                    )}
                    {e.entity === "ad_budget" && e.data?.city && (
                      <span className="text-muted text-capitalize">
                        {" "}
                        · {e.data.city} {e.data.month}
                      </span>
                    )}
                  </td>
                  <td>
                    {changes.length === 0 && (
                      <span className="text-muted">Saved, nothing changed</span>
                    )}
                    {changes.map(([field, c]) => (
                      <div key={field}>
                        <span className="fw-semibold">
                          {field.replace(/_/g, " ")}:
                        </span>{" "}
                        <span className="text-danger">{show(c.from)}</span> →{" "}
                        <span className="text-success">{show(c.to)}</span>
                      </div>
                    ))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
      <Pager list={list} />
    </Section>
  );
};

const OwnerSettings = () => {
  const { can } = useAgentAccess();
  const canEdit = can("BRAND");
  const canBudget = can("ADS");
  const [key, setKey] = useState(0);
  const refresh = useCallback(() => setKey((k) => k + 1), []);

  return (
    <div className="p-3">
      <PageHeader
        title="Owner settings"
        subtitle="Set by the marketing lead. The agent follows these and never changes them itself."
      >
        <Button size="sm" color="primary" outline onClick={refresh}>
          <i className="bx bx-refresh me-1" />
          Refresh
        </Button>
      </PageHeader>
      <div className="alert alert-info py-2" style={{ fontSize: 13 }}>
        <i className="bx bx-lock-alt me-1" />
        {PERSON_ONLY}
      </div>
      <div key={key}>
        <ApprovalRulesCard canEdit={canEdit} />
        <VoiceCard canEdit={canEdit} />
        <OffLimitsCard canEdit={canEdit} />
        <BudgetCard canEdit={canBudget} />
        <History />
      </div>
    </div>
  );
};

export default OwnerSettings;
