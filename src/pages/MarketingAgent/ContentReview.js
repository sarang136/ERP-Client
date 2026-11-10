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
  Table,
} from "reactstrap";
import {
  approveContent,
  editContent,
  generateContent,
  getActiveJob,
  rewriteWeek,
  getContentChecks,
  getContentList,
  getPlans,
  rejectContent,
  reviseContent,
} from "../../helpers/marketingAgentApi";
import {
  CHANNELS,
  CitySelect,
  Empty,
  FORMATS,
  FilterSelect,
  LANGUAGE_CHOICES,
  Loading,
  PageHeader,
  Pager,
  SearchBox,
  StateBadge,
  formatDateTime,
  notifyError,
  useAction,
  useAgentAccess,
  usePagedList,
  PANE,
} from "./common";
import JobProgress from "./JobProgress";
import RewriteWeek from "./RewriteWeek";
import {
  ButtonTools,
  ImageTools,
  PostPreview,
  VideoTools,
} from "./PostPreview";

const TABS = [
  { state: "awaiting_b", label: "Marketing lead" },
  { state: "awaiting_c", label: "Psychiatrist" },
  { state: "needs_person", label: "Needs a person" },
  { state: "approved", label: "Approved" },
  { state: "rejected", label: "Rejected" },
];

const TIERS = [
  ["A", "Tier A (no approval)"],
  ["B", "Tier B (marketing lead)"],
  ["C", "Tier C (psychiatrist)"],
];

const APPROVER = { awaiting_b: "CONTENT", awaiting_c: "CLINICAL_APPROVAL" };
const APPROVER_LABEL = {
  CONTENT: "Content Review",
  CLINICAL_APPROVAL: "Clinical Approval",
};

const Findings = ({ check }) => {
  if (!check) return null;
  return (
    <div className="mt-3">
      <h6 className="mb-2">
        Latest check (v{check.content_version}) ·{" "}
        {check.passed ? (
          <Badge color="success">passed</Badge>
        ) : (
          <Badge color="danger">blocked</Badge>
        )}{" "}
        · Tier {check.tier}
      </h6>
      {check.tier_reasons?.length > 0 && (
        <ul className="text-muted mb-2" style={{ fontSize: 13 }}>
          {check.tier_reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}
      {check.findings?.length > 0 ? (
        <Table
          size="sm"
          bordered
          responsive
          className="mb-0"
          style={{ fontSize: 13 }}
        >
          <thead className="table-light">
            <tr>
              <th>Rule</th>
              <th>By</th>
              <th>Severity</th>
              <th>Words</th>
              <th>Why / fix</th>
            </tr>
          </thead>
          <tbody>
            {check.findings.map((f, i) => (
              <tr key={`${f.rule_id}-${i}`}>
                <td className="fw-semibold">{f.rule_id}</td>
                <td>{f.source}</td>
                <td>
                  <Badge color={f.severity === "block" ? "danger" : "warning"}>
                    {f.severity}
                  </Badge>
                </td>
                <td>{f.quote}</td>
                <td>
                  {f.reason}
                  {f.suggestion && (
                    <div className="text-muted">{f.suggestion}</div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <div className="text-muted" style={{ fontSize: 13 }}>
          No problems found.
        </div>
      )}
    </div>
  );
};

const Detail = ({ item, onChanged }) => {
  const { can } = useAgentAccess();
  const [checks, setChecks] = useState([]);
  const [reason, setReason] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.body);
  const { act, busy } = useAction();

  useEffect(() => {
    setDraft(item.body);
    setEditing(false);
    setReason("");
    getContentChecks(item.id).then(setChecks).catch(notifyError);
  }, [item]);

  const approver = APPROVER[item.state];
  const canDecide = approver && can(approver);
  const canReview = can("CONTENT") || can("CLINICAL_APPROVAL");
  const b = item.body;

  const run = async (key, fn, text) => {
    const updated = await act(key, fn, text);
    if (updated) onChanged(updated);
  };

  return (
    <Card>
      <CardBody>
        <div className="d-flex flex-wrap justify-content-between gap-2">
          <div>
            <StateBadge state={item.state} />{" "}
            {item.tier && (
              <Badge color="light" className="text-dark">
                Tier {item.tier}
              </Badge>
            )}{" "}
            <Badge color="light" className="text-dark">
              {item.format.replace(/_/g, " ")} · {item.channel} ·{" "}
              {item.language}
            </Badge>
          </div>
          <span className="text-muted" style={{ fontSize: 12 }}>
            v{item.version} · {item.revisions} revision(s) ·{" "}
            {formatDateTime(item.updated_at)}
          </span>
        </div>

        {editing ? (
          <div className="mt-3">
            <Input
              className="mb-2"
              value={draft.headline}
              onChange={(e) => setDraft({ ...draft, headline: e.target.value })}
            />
            <Input
              type="textarea"
              rows={8}
              className="mb-2"
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            />
            <Input
              type="textarea"
              rows={4}
              className="mb-2"
              placeholder="Slides, one per line"
              value={(draft.slides || []).join("\n")}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  slides: e.target.value.split("\n").filter(Boolean),
                })
              }
            />
            <Input
              className="mb-2"
              value={draft.cta}
              onChange={(e) => setDraft({ ...draft, cta: e.target.value })}
            />
            <div className="d-flex gap-2">
              <Button
                color="primary"
                size="sm"
                disabled={busy === "edit"}
                onClick={() =>
                  run(
                    "edit",
                    () => editContent(item.id, draft),
                    "Saved and checked again",
                  )
                }
              >
                Save and re-check
              </Button>
              <Button color="light" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Row className="mt-3 g-3">
            <Col xl={7}>
              <PostPreview item={item} />
            </Col>
            <Col xl={5}>
              {item.format === "reel_script" && (
                <VideoTools
                  item={item}
                  onChanged={onChanged}
                  canEdit={can("CONTENT") && item.state !== "published"}
                />
              )}
              <ButtonTools
                item={item}
                onChanged={onChanged}
                canEdit={can("CONTENT") && item.state !== "published"}
              />
              <ImageTools
                item={item}
                onChanged={onChanged}
                canEdit={can("CONTENT") && item.state !== "published"}
              />
              <div className="mt-3" style={{ fontSize: 13 }}>
                <div className="fw-semibold">Headline</div>
                <div>{b.headline}</div>
              </div>
              {b.script && (
                <div className="mt-3" style={{ fontSize: 13 }}>
                  <div className="fw-semibold">Reel script</div>
                  <pre
                    className="p-2 bg-light mb-0"
                    style={{ whiteSpace: "pre-wrap", fontSize: 12 }}
                  >
                    {b.script}
                  </pre>
                </div>
              )}
              {b.claims?.length > 0 && (
                <div className="mt-3" style={{ fontSize: 13 }}>
                  <div className="fw-semibold">Clinical claims</div>
                  <ul className="mb-0">
                    {b.claims.map((c, i) => (
                      <li key={i}>
                        {c.text}{" "}
                        <Badge color={c.fact_id ? "success" : "danger"}>
                          {c.fact_id || "no fact"}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Col>
          </Row>
        )}

        <Findings check={checks[0]} />

        {!editing && canReview && (
          <div className="mt-3 border-top pt-3">
            <Input
              type="textarea"
              rows={2}
              placeholder="Reason or feedback for the writer"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="d-flex flex-wrap gap-2 mt-2">
              {canDecide && (
                <>
                  <Button
                    color="success"
                    size="sm"
                    disabled={!!busy}
                    onClick={() =>
                      run(
                        "approve",
                        () => approveContent(item.id, reason || null),
                        "Approved",
                      )
                    }
                  >
                    Approve
                  </Button>
                  <Button
                    color="danger"
                    size="sm"
                    disabled={!!busy || reason.trim().length < 3}
                    onClick={() =>
                      run(
                        "reject",
                        () => rejectContent(item.id, reason),
                        "Rejected",
                      )
                    }
                  >
                    Reject
                  </Button>
                </>
              )}
              {approver && !canDecide && (
                <span className="text-muted" style={{ fontSize: 13 }}>
                  Approving needs Write on "{APPROVER_LABEL[approver]}" in Roles
                  & Permissions.
                </span>
              )}
              {[
                "awaiting_b",
                "awaiting_c",
                "needs_person",
                "rejected",
              ].includes(item.state) && (
                <Button
                  color="primary"
                  outline
                  size="sm"
                  disabled={!!busy || reason.trim().length < 3}
                  onClick={() =>
                    run(
                      "revise",
                      () => reviseContent(item.id, reason),
                      "Revised and checked again",
                    )
                  }
                >
                  {busy === "revise" ? "Revising…" : "Ask the writer to revise"}
                </Button>
              )}
              {["needs_person", "rejected"].includes(item.state) && (
                <Button
                  color="secondary"
                  outline
                  size="sm"
                  onClick={() => setEditing(true)}
                >
                  Edit by hand
                </Button>
              )}
            </div>
            {reason.trim().length < 3 && (
              <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                Write a reason above to reject, or what to change to ask the
                writer to revise.
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

const ContentReview = () => {
  const [tab, setTab] = useState("awaiting_b");
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [channel, setChannel] = useState("");
  const [format, setFormat] = useState("");
  const [language, setLanguage] = useState("");
  const [tier, setTier] = useState("");
  const list = usePagedList(getContentList, {
    state: tab,
    q,
    city,
    channel,
    format,
    language,
    tier,
  });
  const [selectedId, setSelectedId] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [weekId, setWeekId] = useState("");
  const [writingJob, setWritingJob] = useState(null);
  const [showProgress, setShowProgress] = useState(false);
  const [starting, setStarting] = useState(false);
  const [rewriting, setRewriting] = useState(false);
  const { can } = useAgentAccess();
  const selected =
    list.items.find((i) => i.id === selectedId) || list.items[0] || null;

  useEffect(() => {
    getPlans({ status: "approved", limit: 50 })
      .then((page) => setWeeks(page.items))
      .catch(() => setWeeks([]));
  }, []);

  const selectedWeek = selected?.week_id;
  useEffect(() => {
    if (!weekId && selectedWeek && weeks.some((w) => w.id === selectedWeek)) {
      setWeekId(selectedWeek);
    }
  }, [weekId, selectedWeek, weeks]);

  useEffect(() => {
    setWritingJob(null);
    if (!weekId) return undefined;
    let alive = true;
    let timer;
    const look = async () => {
      try {
        const job = await getActiveJob(`content:week:${weekId}`);
        if (!alive) return;
        setWritingJob(
          (current) => job || (current?.week === weekId ? current : null),
        );
      } catch {
        if (!alive) return;
      }
      timer = setTimeout(look, 5000);
    };
    look();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [weekId]);

  const write = async (start = () => generateContent({ week_id: weekId })) => {
    setRewriting(false);
    setStarting(true);
    try {
      const job = await start();
      setWritingJob({ ...job, week: weekId });
      setShowProgress(true);
    } catch (e) {
      if (e.status === 409 && e.details?.job_id) {
        setWritingJob({
          id: e.details.job_id,
          actor: e.details.actor,
          week: weekId,
        });
        setShowProgress(true);
        toast.info(
          `${String(e.details.actor || "Someone")
            .split(":")
            .pop()} is already writing this week: showing its progress`,
        );
      } else {
        notifyError(e);
      }
    } finally {
      setStarting(false);
    }
  };

  const reload = list.reload;
  const finished = useCallback(
    (job) => {
      reload();
      if (job.status === "succeeded")
        toast.success("Content written and checked");
      else toast.error(job.error || "Writing stopped");
      setWritingJob((current) =>
        current
          ? { ...current, status: job.status, progress: job.progress }
          : current,
      );
    },
    [reload],
  );

  const busyWriting =
    writingJob && ["queued", "running", undefined].includes(writingJob.status);
  const weekName = (() => {
    const w = weeks.find((x) => x.id === weekId);
    return w
      ? `${w.city} · week of ${new Date(w.week_start).toLocaleDateString("en-IN")}`
      : "";
  })();

  const onChanged = (updated) => {
    setSelectedId(updated.state === tab ? updated.id : null);
    list.reload();
  };

  return (
    <div className="p-3">
      <PageHeader
        title="Content review"
        subtitle="Drafts are checked against the rules before anyone sees them."
      >
        {can("CONTENT") && (
          <>
            <Input
              type="select"
              bsSize="sm"
              value={weekId}
              onChange={(e) => setWeekId(e.target.value)}
              style={{ width: 220 }}
            >
              <option value="">Approved week…</option>
              {weeks.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.city} · week of{" "}
                  {new Date(w.week_start).toLocaleDateString("en-IN")}
                </option>
              ))}
            </Input>
            {busyWriting ? (
              <Button
                size="sm"
                color="warning"
                onClick={() => setShowProgress(true)}
              >
                <i className="bx bx-loader-alt bx-spin me-1" />
                Writing
                {writingJob.progress?.total
                  ? ` ${writingJob.progress.done} of ${writingJob.progress.total}`
                  : "…"}{" "}
                · see progress
              </Button>
            ) : (
              <Button
                size="sm"
                color="primary"
                disabled={!weekId || starting}
                onClick={() => write()}
              >
                {starting ? "Starting…" : "Write content for the week"}
              </Button>
            )}
            {!busyWriting && (
              <Button
                size="sm"
                color="warning"
                outline
                disabled={!weekId || starting}
                title={weekId ? "" : "Pick an approved week first"}
                onClick={() => setRewriting(true)}
              >
                <i className="bx bx-revision me-1" />
                Rewrite all posts
              </Button>
            )}
            {writingJob && !busyWriting && (
              <Button
                size="sm"
                color="secondary"
                outline
                onClick={() => setShowProgress(true)}
              >
                Last run
              </Button>
            )}
          </>
        )}
      </PageHeader>
      {busyWriting && writingJob.actor && (
        <div
          className="alert alert-warning py-2 d-flex align-items-center gap-2"
          style={{ fontSize: 13 }}
        >
          <i className="bx bx-loader-alt bx-spin" />
          <span>
            <strong>{String(writingJob.actor).split(":").pop()}</strong> is
            writing {weekName}. Nobody can start it again until it finishes.
          </span>
          <Button
            size="sm"
            color="warning"
            outline
            className="ms-auto"
            onClick={() => setShowProgress(true)}
          >
            See progress
          </Button>
        </div>
      )}
      <RewriteWeek
        weekId={weekId}
        weekName={weekName}
        isOpen={rewriting}
        onClose={() => setRewriting(false)}
        onStart={(body) => write(() => rewriteWeek(body))}
      />
      {writingJob?.id && (
        <JobProgress
          jobId={writingJob.id}
          title={`Writing content: ${weekName}`}
          isOpen={showProgress}
          onClose={() => setShowProgress(false)}
          onFinished={finished}
        />
      )}
      <Nav tabs className="mb-3">
        {TABS.map((t) => (
          <NavItem key={t.state}>
            <NavLink
              href="#"
              active={tab === t.state}
              onClick={(e) => {
                e.preventDefault();
                setTab(t.state);
                setSelectedId(null);
              }}
            >
              {t.label}
            </NavLink>
          </NavItem>
        ))}
      </Nav>
      <div className="d-flex gap-2 flex-wrap mb-3">
        <SearchBox onSearch={setQ} placeholder="Search topic or text" />
        <CitySelect
          value={city}
          onChange={setCity}
          allowAll
          activeOnly={false}
          style={{ width: 150 }}
        />
        <FilterSelect
          value={channel}
          onChange={setChannel}
          options={CHANNELS}
          allLabel="All channels"
        />
        <FilterSelect
          value={format}
          onChange={setFormat}
          options={FORMATS}
          allLabel="All formats"
        />
        <FilterSelect
          value={language}
          onChange={setLanguage}
          options={LANGUAGE_CHOICES}
          allLabel="All languages"
        />
        <FilterSelect
          value={tier}
          onChange={setTier}
          options={TIERS}
          allLabel="All tiers"
        />
      </div>
      {list.loading && list.items.length === 0 ? (
        <Loading />
      ) : list.total === 0 ? (
        <Empty>Nothing here.</Empty>
      ) : (
        <Row>
          <Col lg={4} style={PANE}>
            {list.items.map((i) => (
              <Card
                key={i.id}
                className="mb-2"
                style={{
                  cursor: "pointer",
                  border:
                    selected?.id === i.id ? "1px solid #3577f1" : undefined,
                }}
                onClick={() => setSelectedId(i.id)}
              >
                <CardBody className="py-2">
                  <div className="fw-semibold">{i.body.headline}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    {i.city} · {i.format.replace(/_/g, " ")} · {i.language} ·{" "}
                    {formatDateTime(i.updated_at)}
                  </div>
                </CardBody>
              </Card>
            ))}
            <Pager list={list} />
          </Col>
          <Col lg={8} style={PANE}>
            {selected && (
              <Detail key={selected.id} item={selected} onChanged={onChanged} />
            )}
          </Col>
        </Row>
      )}
    </div>
  );
};

export default ContentReview;
