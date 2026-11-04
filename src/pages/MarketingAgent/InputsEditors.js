import React, { useEffect, useRef, useState } from "react";
import {
  Badge,
  Button,
  FormGroup,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Table,
} from "reactstrap";
import {
  getPlanInputs,
  getWriterInputs,
  previewPlanPrompt,
  previewWriterPrompt,
} from "../../helpers/marketingAgentApi";
import {
  CHANNELS,
  ChoiceChecks,
  Empty,
  FORMAT_CHOICES,
  Loading,
  formatDate,
  labelOf,
  notifyError,
} from "./common";

const lines = (text) =>
  text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

const Section = ({ title, hint, count, children }) => (
  <div className="mb-4">
    <h6 className="mb-1">
      {title}{" "}
      {count !== undefined && (
        <Badge color="light" className="text-dark">
          {count}
        </Badge>
      )}
    </h6>
    {hint && (
      <div className="text-muted mb-2" style={{ fontSize: 12 }}>
        {hint}
      </div>
    )}
    {children}
  </div>
);

const SENTIMENT_STYLE = {
  negative: ["danger", "Negative"],
  mixed: ["warning", "Mixed"],
  neutral: ["secondary", "Neutral"],
  positive: ["success", "Positive"],
};

export const SentimentBadge = ({ sentiment }) => {
  if (!sentiment) return null;
  const [color, label] = SENTIMENT_STYLE[sentiment] || ["secondary", sentiment];
  return (
    <Badge color={color} className="ms-1" title="Sentiment tagged by Gemini">
      {label}
    </Badge>
  );
};

const SignalBadges = ({ signal: s }) => (
  <span className="text-nowrap me-2">
    <Badge color="light" className="text-dark">
      {labelOf(s.kind)}
      {s.rating ? ` · ${s.rating}★` : ""}
    </Badge>
    <SentimentBadge sentiment={s.sentiment} />
  </span>
);

const SENTIMENT_ORDER = ["positive", "neutral", "mixed", "negative"];
const SENTIMENT_COLOR = {
  positive: "#0ab39c",
  neutral: "#878a99",
  mixed: "#f7b84b",
  negative: "#f06548",
};

const SentimentOverview = ({ summary }) => {
  const counts = summary?.counts || {};
  const total = SENTIMENT_ORDER.reduce((n, k) => n + (counts[k] || 0), 0);
  if (!total)
    return (
      <Empty>
        No calls or reviews with sentiment for this city in the last{" "}
        {summary?.days || 90} days.
      </Empty>
    );
  return (
    <div style={{ fontSize: 13 }}>
      <div
        className="d-flex rounded overflow-hidden mb-2"
        style={{ height: 14 }}
        title={`${total} calls and reviews`}
      >
        {SENTIMENT_ORDER.filter((k) => counts[k]).map((k) => (
          <div
            key={k}
            style={{
              width: `${(100 * counts[k]) / total}%`,
              background: SENTIMENT_COLOR[k],
            }}
          />
        ))}
      </div>
      <div className="d-flex flex-wrap gap-3 mb-2">
        {SENTIMENT_ORDER.map((k) => (
          <span key={k}>
            <span
              className="d-inline-block rounded-circle me-1"
              style={{ width: 9, height: 9, background: SENTIMENT_COLOR[k] }}
            />
            {labelOf(k)} <strong>{counts[k] || 0}</strong>{" "}
            <span className="text-muted">
              ({Math.round((100 * (counts[k] || 0)) / total)}%)
            </span>
          </span>
        ))}
      </div>
      {summary.negative_topics?.length > 0 && (
        <div>
          <span className="text-muted me-1">
            Unhappy calls and reviews were about:
          </span>
          {summary.negative_topics.map((x) => (
            <Badge
              key={x.topic}
              color="danger"
              className="me-1 mb-1 bg-danger-subtle text-danger"
            >
              {x.topic} · {x.n}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

const SENTIMENT_HINT =
  "Gemini tags every call summary and review as positive, neutral, mixed or negative when it comes in. Negative themes become family-worry topics below.";

const SCORE_PARTS = [
  ["demand", "searches"],
  ["momentum", "rising"],
  ["season", "season"],
  ["conversion", "converts to admission"],
  ["capacity", "beds free"],
  ["concern", "family worry"],
];

export const ScoreBreakdown = ({ parts }) =>
  parts ? (
    <div className="text-muted" style={{ fontSize: 11, lineHeight: 1.4 }}>
      {SCORE_PARTS.filter(([key]) => parts[key] > 0)
        .map(([key, label]) => `${label} ${Math.round(parts[key] * 100)}%`)
        .join(" · ")}
    </div>
  ) : null;

const TOPIC_KIND = {
  search: ["primary", "Search"],
  season: ["info", "Season"],
  concern: ["warning", "Family worry"],
};

const RankedTopics = ({ topics, onRemove }) =>
  topics.length === 0 ? (
    <Empty>No ranked topics. Plans made before ranking was added.</Empty>
  ) : (
    <Table size="sm" style={{ fontSize: 13 }}>
      <tbody>
        {topics.map((r, i) => {
          const [color, label] = TOPIC_KIND[r.kind] || ["secondary", r.kind];
          return (
            <tr key={r.id}>
              <td className="text-muted">{r.id}</td>
              <td>
                <Badge color={color} className="me-2">
                  {label}
                </Badge>
                <span className="fw-semibold">{r.topic}</span>
                {r.negative > 0 && (
                  <Badge color="danger" className="ms-2">
                    Negative · {r.negative}
                  </Badge>
                )}
                {r.condition && (
                  <span className="text-muted"> · {labelOf(r.condition)}</span>
                )}
                <div className="text-muted" style={{ fontSize: 12 }}>
                  {r.evidence}
                </div>
                <ScoreBreakdown parts={r.parts} />
              </td>
              <td className="text-end fw-semibold">{r.score.toFixed(2)}</td>
              {onRemove && (
                <td>
                  <RemoveButton onClick={() => onRemove(i)} />
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </Table>
  );

const RANKED_HINT =
  "Scored before Gemini writes anything: search demand, rising searches, seasonal events, family worries (calls, reviews and why leads did not admit), lead-to-admission rate and beds free. Gemini builds most briefs on the top topics. Remove any you don't want.";

const RemoveButton = ({ onClick }) => (
  <Button
    size="sm"
    color="link"
    className="text-danger p-0"
    title="Leave this out"
    onClick={onClick}
  >
    ✕
  </Button>
);

const without = (list, index) => list.filter((_, i) => i !== index);

const draftKey = (city, week, mode) => `ma-plan-edits:${city}:${week}:${mode}`;

const readDraft = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

const writeDraft = (key, value) => {
  try {
    if (value) localStorage.setItem(key, JSON.stringify(value));
    else localStorage.removeItem(key);
  } catch (e) {
    return undefined;
  }
  return undefined;
};

const MODE_TITLE = {
  new: "Planning inputs",
  regenerate: "Regenerate the plan",
  more: "Generate more post ideas",
};

export const PlanInputsModal = ({
  city,
  weekStart,
  plan,
  mode = "new",
  onClose,
  onSend,
}) => {
  const [count, setCount] = useState(3);
  const [fresh, setFresh] = useState(null);
  const [data, setData] = useState(null);
  const [inputs, setInputs] = useState(null);
  const [notes, setNotes] = useState("");
  const [json, setJson] = useState(null);
  const [jsonError, setJsonError] = useState("");
  const [formats, setFormats] = useState([]);
  const [channels, setChannels] = useState([]);
  const [baseline, setBaseline] = useState(null);
  const [restored, setRestored] = useState(false);
  const close = useRef(onClose);
  close.current = onClose;
  const fromSavedPlan = Boolean(plan?.id && plan?.inputs);
  const key = data && draftKey(data.city, data.week_start, mode);

  const apply = (state) => {
    setInputs(state.inputs);
    setNotes(state.notes);
    setFormats(state.formats);
    setChannels(state.channels);
    setCount(state.count);
  };

  useEffect(() => {
    getPlanInputs({ city, week_start: weekStart || null })
      .then((d) => {
        const base = {
          inputs: plan?.inputs || d.inputs,
          notes: plan?.notes || "",
          formats: plan?.formats?.length
            ? plan.formats
            : d.rules.allowed_formats,
          channels: plan?.channels?.length
            ? plan.channels
            : d.rules.allowed_channels,
          count: 3,
        };
        const saved = readDraft(draftKey(d.city, d.week_start, mode));
        setData(d);
        setFresh(d.inputs);
        setBaseline(base);
        setRestored(Boolean(saved));
        apply(saved || base);
      })
      .catch((e) => {
        notifyError(e);
        close.current();
      });
  }, [city, weekStart, plan, mode]);

  useEffect(() => {
    if (!key || !baseline || !inputs) return;
    const current = { inputs, notes, formats, channels, count };
    const changed = JSON.stringify(current) !== JSON.stringify(baseline);
    writeDraft(key, changed ? current : null);
  }, [key, baseline, inputs, notes, formats, channels, count]);

  const discard = () => {
    writeDraft(key, null);
    setRestored(false);
    apply(baseline);
  };

  const set = (key, value) => setInputs((cur) => ({ ...cur, [key]: value }));

  const setSignal = (condition, index, patch) =>
    set("signals_by_condition", {
      ...inputs.signals_by_condition,
      [condition]: inputs.signals_by_condition[condition].map((s, i) =>
        i === index ? { ...s, ...patch } : s,
      ),
    });

  const removeSignal = (condition, index) =>
    set("signals_by_condition", {
      ...inputs.signals_by_condition,
      [condition]: without(inputs.signals_by_condition[condition], index),
    });

  const applyJson = () => {
    try {
      setInputs(JSON.parse(json));
      setJson(null);
      setJsonError("");
    } catch (e) {
      setJsonError(`Not valid JSON: ${e.message}`);
    }
  };

  const signalCount = inputs
    ? Object.values(inputs.signals_by_condition).reduce(
        (n, items) => n + items.length,
        0,
      )
    : 0;

  return (
    <Modal isOpen toggle={onClose} size="xl" scrollable>
      <ModalHeader toggle={onClose}>
        {MODE_TITLE[mode]}{" "}
        {data && (
          <span className="text-muted text-capitalize" style={{ fontSize: 14 }}>
            · {data.city} · week of {formatDate(data.week_start)}
          </span>
        )}
      </ModalHeader>
      <ModalBody>
        {!inputs ? (
          <Loading />
        ) : json !== null ? (
          <>
            <p className="text-muted" style={{ fontSize: 13 }}>
              Everything the planner will read, as JSON. Edit it and apply.
            </p>
            <Input
              type="textarea"
              rows={24}
              value={json}
              onChange={(e) => setJson(e.target.value)}
              style={{ fontFamily: "monospace", fontSize: 12 }}
            />
            {jsonError && <div className="text-danger mt-1">{jsonError}</div>}
          </>
        ) : (
          <>
            <p className="text-muted" style={{ fontSize: 13 }}>
              {fromSavedPlan
                ? "This is the RAG output this plan was made from. "
                : "This is what the agent found (the RAG output). "}
              Remove anything that should not shape the week, edit text, add
              notes, then send it to Gemini.
              {mode !== "new" &&
                " The plan goes back to Draft and needs approval again; post ideas that already have content are kept."}
            </p>
            {restored && (
              <div
                className="alert alert-info py-2 d-flex align-items-center gap-2"
                style={{ fontSize: 13 }}
              >
                Restored your unsent edits.
                <Button
                  size="sm"
                  color="secondary"
                  outline
                  className="ms-auto"
                  onClick={discard}
                >
                  Discard my edits
                </Button>
              </div>
            )}
            <p className="text-muted" style={{ fontSize: 12 }}>
              Edits are kept in this browser until you send them, even if you
              close this window.
            </p>
            {fromSavedPlan && fresh && inputs !== fresh && (
              <Button
                size="sm"
                color="secondary"
                outline
                className="mb-3"
                onClick={() => setInputs(fresh)}
              >
                Fetch fresh RAG output instead
              </Button>
            )}
            {mode === "more" && (
              <FormGroup className="d-flex align-items-center gap-2">
                <Label className="mb-0">How many new post ideas</Label>
                <Input
                  type="number"
                  bsSize="sm"
                  min={1}
                  max={20}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  style={{ width: 80 }}
                />
              </FormGroup>
            )}

            <Section
              title={`How people feel (last ${inputs.sentiment?.days || 90} days)`}
              hint={SENTIMENT_HINT}
            >
              <SentimentOverview summary={inputs.sentiment} />
            </Section>

            <Section
              title="Ranked topics"
              hint={RANKED_HINT}
              count={(inputs.ranked_topics || []).length}
            >
              <RankedTopics
                topics={inputs.ranked_topics || []}
                onRemove={(i) =>
                  set("ranked_topics", without(inputs.ranked_topics, i))
                }
              />
            </Section>

            <Section
              title="What people said and searched, by condition"
              hint="Found by meaning-based search over reviews and Google searches from the last 60 days."
              count={signalCount}
            >
              {signalCount === 0 && <Empty>Nothing found.</Empty>}
              {Object.entries(inputs.signals_by_condition).map(
                ([condition, items]) =>
                  items.length > 0 && (
                    <div key={condition} className="mb-2">
                      <div className="fw-semibold" style={{ fontSize: 13 }}>
                        {labelOf(condition)}
                      </div>
                      {items.map((s, i) => (
                        <div
                          key={s.id || i}
                          className="d-flex gap-2 align-items-start border-bottom py-1"
                        >
                          <div className="mt-1">
                            <SignalBadges signal={s} />
                          </div>
                          <Input
                            type="textarea"
                            bsSize="sm"
                            rows={Math.min(4, Math.ceil(s.text.length / 110))}
                            value={s.text}
                            onChange={(e) =>
                              setSignal(condition, i, { text: e.target.value })
                            }
                          />
                          <RemoveButton
                            onClick={() => removeSignal(condition, i)}
                          />
                        </div>
                      ))}
                    </div>
                  ),
              )}
            </Section>

            <Section
              title="Rising Google searches"
              count={inputs.rising_searches.length}
            >
              <Table size="sm" style={{ fontSize: 13 }}>
                <tbody>
                  {inputs.rising_searches.map((r, i) => (
                    <tr key={`${r.query}-${i}`}>
                      <td>{r.query}</td>
                      <td className="text-muted">
                        {Math.round(r.this_week)} this week vs{" "}
                        {Math.round(r.usual_week)}
                      </td>
                      <td className="text-end">
                        <RemoveButton
                          onClick={() =>
                            set(
                              "rising_searches",
                              without(inputs.rising_searches, i),
                            )
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Section>

            <Section
              title="Top Google searches (28 days)"
              count={inputs.top_searches_28d.length}
            >
              <Table size="sm" style={{ fontSize: 13 }}>
                <tbody>
                  {inputs.top_searches_28d.map((q, i) => (
                    <tr key={`${q.query}-${i}`}>
                      <td>{q.query}</td>
                      <td className="text-muted">
                        {Math.round(q.impressions || 0)} impressions
                      </td>
                      <td className="text-end">
                        <RemoveButton
                          onClick={() =>
                            set(
                              "top_searches_28d",
                              without(inputs.top_searches_28d, i),
                            )
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Section>

            <Section
              title="Our website pages"
              hint="Posts can point people to these pages."
              count={inputs.our_website_pages.length}
            >
              {inputs.our_website_pages.map((p, i) => (
                <div
                  key={p.url}
                  className="d-flex justify-content-between border-bottom py-1"
                  style={{ fontSize: 13 }}
                >
                  <a href={p.url} target="_blank" rel="noreferrer">
                    {p.title || p.url}
                  </a>
                  <RemoveButton
                    onClick={() =>
                      set(
                        "our_website_pages",
                        without(inputs.our_website_pages, i),
                      )
                    }
                  />
                </div>
              ))}
            </Section>

            <Section
              title="Festivals and seasons"
              count={inputs.seasonal_events.length}
            >
              {inputs.seasonal_events.map((e, i) => (
                <Badge key={e.name} color="info" className="me-2 mb-1">
                  {e.name}{" "}
                  <span
                    role="button"
                    title="Leave this out"
                    onClick={() =>
                      set("seasonal_events", without(inputs.seasonal_events, i))
                    }
                  >
                    ✕
                  </span>
                </Badge>
              ))}
            </Section>

            <Section
              title="Headlines that brought enquiries"
              hint="One per line. Add your own ideas too."
            >
              <Input
                type="textarea"
                rows={4}
                value={inputs.headlines_that_brought_enquiries.join("\n")}
                onChange={(e) =>
                  set("headlines_that_brought_enquiries", lines(e.target.value))
                }
              />
            </Section>

            <Section
              title="What to make this week"
              hint="Pre-filled from the city playbook. Changes here apply to this week only."
            >
              <ChoiceChecks
                id="week-formats"
                options={FORMAT_CHOICES}
                value={formats}
                onChange={setFormats}
              />
              <div className="mt-2" />
              <ChoiceChecks
                id="week-channels"
                options={CHANNELS}
                value={channels}
                onChange={setChannels}
              />
              <div className="text-muted mt-2" style={{ fontSize: 12 }}>
                {data.rules.briefs_needed} posts · languages{" "}
                {data.rules.allowed_languages.join(", ")}
                {data.rules.off_limits_topics.length > 0 &&
                  ` · never about ${data.rules.off_limits_topics.join(", ")}`}
              </div>
            </Section>

            <FormGroup>
              <Label>Your notes for the planner</Label>
              <Input
                type="textarea"
                rows={3}
                placeholder="e.g. Focus on families of people who drink. No festival posts this week."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </FormGroup>
          </>
        )}
      </ModalBody>
      <ModalFooter>
        {inputs &&
          (json === null ? (
            <Button
              size="sm"
              color="secondary"
              outline
              className="me-auto"
              onClick={() => setJson(JSON.stringify(inputs, null, 2))}
            >
              Edit everything as JSON
            </Button>
          ) : (
            <Button
              size="sm"
              color="secondary"
              outline
              className="me-auto"
              onClick={applyJson}
            >
              Apply JSON
            </Button>
          ))}
        <PromptPreviewButton
          disabled={!inputs || json !== null}
          load={() =>
            previewPlanPrompt({
              city: data.city,
              week_start: data.week_start,
              inputs,
              notes: notes.trim() || null,
              formats,
              channels,
              mode,
              ...(mode === "more" ? { count } : {}),
            })
          }
        />
        <Button size="sm" color="secondary" outline onClick={onClose}>
          Cancel
        </Button>
        <Button
          size="sm"
          color="primary"
          disabled={
            !inputs ||
            json !== null ||
            !formats.length ||
            !channels.length ||
            (mode === "more" && !(count >= 1 && count <= 20))
          }
          onClick={() => {
            writeDraft(key, null);
            onSend({
              city: data.city,
              week_start: data.week_start,
              inputs,
              notes: notes.trim() || null,
              formats,
              channels,
              ...(mode === "more" ? { count } : {}),
            });
          }}
        >
          Send to Gemini
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export const WriterInputsModal = ({ brief, onClose, onSend }) => {
  const [inputs, setInputs] = useState(null);
  const [skipped, setSkipped] = useState(new Set());
  const [notes, setNotes] = useState("");
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    getWriterInputs({ brief_id: brief.id })
      .then(setInputs)
      .catch((e) => {
        notifyError(e);
        close.current();
      });
  }, [brief.id]);

  const toggle = (id) =>
    setSkipped((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const setWebsite = (index, text) =>
    setInputs((cur) => ({
      ...cur,
      website: cur.website.map((w, i) => (i === index ? { ...w, text } : w)),
    }));

  return (
    <Modal isOpen toggle={onClose} size="lg" scrollable>
      <ModalHeader toggle={onClose}>Writing inputs · {brief.topic}</ModalHeader>
      <ModalBody>
        {!inputs ? (
          <Loading />
        ) : (
          <>
            <p className="text-muted" style={{ fontSize: 13 }}>
              {labelOf(brief.format)} for {brief.channel} in {brief.language}
              {" · "}
              {brief.angle}
            </p>

            <Section
              title="Approved clinical facts"
              hint="Medical statements may only come from these. Untick to leave a fact out; the wording can only be changed by a psychiatrist in Brand Brain."
              count={inputs.facts.length - skipped.size}
            >
              {inputs.facts.length === 0 && (
                <Empty>
                  No matching facts: the post will make no medical claims.
                </Empty>
              )}
              {inputs.facts.map((f) => (
                <FormGroup check key={f.id} style={{ fontSize: 13 }}>
                  <Input
                    type="checkbox"
                    id={`fact-${f.id}`}
                    checked={!skipped.has(f.id)}
                    onChange={() => toggle(f.id)}
                  />
                  <Label check for={`fact-${f.id}`}>
                    <strong>{f.id}</strong> {f.text}
                  </Label>
                </FormGroup>
              ))}
            </Section>

            <Section
              title="From our website"
              hint="Centre details the writer may use. Edit or remove."
              count={inputs.website.length}
            >
              {inputs.website.length === 0 && <Empty>Nothing found.</Empty>}
              {inputs.website.map((w, i) => (
                <div key={`${w.url}-${i}`} className="mb-2">
                  <div
                    className="d-flex justify-content-between"
                    style={{ fontSize: 12 }}
                  >
                    <a href={w.url} target="_blank" rel="noreferrer">
                      {w.title} · {w.heading}
                    </a>
                    <RemoveButton
                      onClick={() =>
                        setInputs((cur) => ({
                          ...cur,
                          website: without(cur.website, i),
                        }))
                      }
                    />
                  </div>
                  <Input
                    type="textarea"
                    bsSize="sm"
                    rows={4}
                    value={w.text}
                    onChange={(e) => setWebsite(i, e.target.value)}
                  />
                </div>
              ))}
            </Section>

            <Section
              title="Headlines that brought enquiries"
              hint="For inspiration only. One per line."
            >
              <Input
                type="textarea"
                rows={3}
                value={inputs.hooks.join("\n")}
                onChange={(e) =>
                  setInputs((cur) => ({ ...cur, hooks: lines(e.target.value) }))
                }
              />
            </Section>

            <FormGroup>
              <Label>Your notes for the writer</Label>
              <Input
                type="textarea"
                rows={3}
                placeholder="e.g. Keep it under 80 words. Mention that families can visit on Sundays."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </FormGroup>
          </>
        )}
      </ModalBody>
      <ModalFooter>
        <PromptPreviewButton
          disabled={!inputs}
          load={() =>
            previewWriterPrompt({
              brief_id: brief.id,
              inputs: {
                ...inputs,
                facts: inputs.facts.filter((f) => !skipped.has(f.id)),
              },
              notes: notes.trim() || null,
            })
          }
        />
        <Button size="sm" color="secondary" outline onClick={onClose}>
          Cancel
        </Button>
        <Button
          size="sm"
          color="primary"
          disabled={!inputs}
          onClick={() =>
            onSend({
              brief_id: brief.id,
              inputs: {
                ...inputs,
                facts: inputs.facts.filter((f) => !skipped.has(f.id)),
              },
              notes: notes.trim() || null,
            })
          }
        >
          Send to Gemini
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export const PlanRagView = ({
  plan,
  intro = "Exactly what Gemini received when this plan was last made.",
}) => {
  const inputs = plan.inputs;
  if (!inputs) {
    return (
      <Empty>
        This plan was made before inputs were saved. Regenerate it to keep a
        copy of the RAG output.
      </Empty>
    );
  }
  const signals = Object.entries(inputs.signals_by_condition).filter(
    ([, items]) => items.length,
  );
  return (
    <div style={{ fontSize: 13 }}>
      <p className="text-muted">{intro}</p>
      {plan.notes && (
        <Section title="Your notes">
          <div style={{ whiteSpace: "pre-wrap" }}>{plan.notes}</div>
        </Section>
      )}
      {inputs.sentiment && (
        <Section title={`How people feel (last ${inputs.sentiment.days} days)`}>
          <SentimentOverview summary={inputs.sentiment} />
        </Section>
      )}
      <Section
        title="Ranked topics"
        count={(inputs.ranked_topics || []).length}
      >
        <RankedTopics topics={inputs.ranked_topics || []} />
      </Section>
      <Section title="Formats and channels">
        {(plan.formats || []).map(labelOf).join(", ") || "-"} ·{" "}
        {(plan.channels || []).join(", ") || "-"}
      </Section>
      <Section
        title="What people said and searched, by condition"
        count={signals.reduce((n, [, items]) => n + items.length, 0)}
      >
        {signals.length === 0 && <Empty>Nothing.</Empty>}
        {signals.map(([condition, items]) => (
          <div key={condition} className="mb-2">
            <div className="fw-semibold">{labelOf(condition)}</div>
            {items.map((s, i) => (
              <div key={s.id || i} className="border-bottom py-1">
                <SignalBadges signal={s} />
                {s.text}
              </div>
            ))}
          </div>
        ))}
      </Section>
      <Section
        title="Rising Google searches"
        count={inputs.rising_searches.length}
      >
        {inputs.rising_searches.map((r) => (
          <div key={r.query}>
            {r.query}{" "}
            <span className="text-muted">
              {Math.round(r.this_week)} vs {Math.round(r.usual_week)}
            </span>
          </div>
        ))}
      </Section>
      <Section
        title="Top Google searches (28 days)"
        count={inputs.top_searches_28d.length}
      >
        {inputs.top_searches_28d.map((q) => (
          <div key={q.query}>
            {q.query}{" "}
            <span className="text-muted">
              {Math.round(q.impressions || 0)} impressions
            </span>
          </div>
        ))}
      </Section>
      <Section
        title="Our website pages"
        count={inputs.our_website_pages.length}
      >
        {inputs.our_website_pages.map((p) => (
          <div key={p.url}>
            <a href={p.url} target="_blank" rel="noreferrer">
              {p.title || p.url}
            </a>
          </div>
        ))}
      </Section>
      <Section
        title="Festivals and seasons"
        count={inputs.seasonal_events.length}
      >
        {inputs.seasonal_events.map((e) => e.name).join(", ") || "-"}
      </Section>
      <Section
        title="Headlines that brought enquiries"
        count={inputs.headlines_that_brought_enquiries.length}
      >
        {inputs.headlines_that_brought_enquiries.map((h) => (
          <div key={h}>{h}</div>
        ))}
      </Section>
    </div>
  );
};

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="sm"
      color="secondary"
      outline
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "Copied" : "Copy"}
    </Button>
  );
};

export const PromptPreviewButton = ({ load, disabled }) => {
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  const open = async () => {
    setBusy(true);
    try {
      setPreview(await load());
    } catch (e) {
      notifyError(e);
    } finally {
      setBusy(false);
    }
  };

  const block = {
    whiteSpace: "pre-wrap",
    fontSize: 12,
    maxHeight: 360,
    overflowY: "auto",
    background: "#f8f9fa",
    padding: 10,
    borderRadius: 6,
  };

  return (
    <>
      <Button
        size="sm"
        color="secondary"
        outline
        disabled={disabled || busy}
        onClick={open}
      >
        {busy ? "Building…" : "Show full prompt"}
      </Button>
      {preview && (
        <Modal isOpen toggle={() => setPreview(null)} size="xl" scrollable>
          <ModalHeader toggle={() => setPreview(null)}>
            Full prompt (nothing has been sent)
          </ModalHeader>
          <ModalBody>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <h6 className="mb-0">Instructions (system prompt)</h6>
              <CopyButton text={preview.system} />
            </div>
            <div className="text-muted mb-1" style={{ fontSize: 12 }}>
              Edit these in Brand Brain → Prompts.
            </div>
            <pre style={block}>{preview.system}</pre>
            <div className="d-flex justify-content-between align-items-center mb-1 mt-3">
              <h6 className="mb-0">Data and request</h6>
              <CopyButton text={preview.prompt} />
            </div>
            <div className="text-muted mb-1" style={{ fontSize: 12 }}>
              Built from the inputs and notes in the editor.
            </div>
            <pre style={block}>{preview.prompt}</pre>
          </ModalBody>
        </Modal>
      )}
    </>
  );
};
