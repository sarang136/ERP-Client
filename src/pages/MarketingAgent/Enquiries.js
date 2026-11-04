import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  Input,
} from "reactstrap";
import {
  acknowledgeCrisis,
  getCallQueue,
  recordOutcome,
} from "../../helpers/marketingAgentApi";
import {
  CitySelect,
  Empty,
  FilterSelect,
  Loading,
  PageHeader,
  Pager,
  ScoreBadge,
  SearchBox,
  formatDateTime,
  useAction,
  useAgentAccess,
  usePagedList,
} from "./common";

const OUTCOMES = [
  { status: "contacted", label: "Called", color: "success" },
  { status: "not_reachable", label: "Not reachable", color: "secondary" },
  { status: "assessment", label: "Assessment booked", color: "primary" },
  { status: "admitted", label: "Admitted", color: "info" },
  { status: "lost", label: "Not interested", color: "dark" },
];

const QueueRow = ({ item, onDone, canAct }) => {
  const { enquiry: e, waiting_minutes: waiting, overdue } = item;
  const q = e.qualification;
  const isCrisis = e.status === "crisis";
  const crisisOpen = isCrisis && e.crisis?.state !== "acknowledged";
  const [note, setNote] = useState("");
  const { act, busy } = useAction();

  const outcome = async (status) => {
    const done = await act(
      status,
      () => recordOutcome(e.id, { status, note: note || null }),
      "Saved",
    );
    if (done) onDone();
  };
  const acknowledge = async () => {
    const done = await act(
      "ack",
      () => acknowledgeCrisis(e.id),
      "Crisis acknowledged",
    );
    if (done) onDone();
  };

  return (
    <Card
      className="mb-2"
      style={{
        borderLeft: `4px solid ${isCrisis ? "#f06548" : q?.score === "hot" ? "#f7b84b" : "#e9ebec"}`,
      }}
    >
      <CardBody className="py-3">
        <div className="d-flex flex-wrap justify-content-between gap-2">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <ScoreBadge score={isCrisis ? "crisis" : q?.score || "unclear"} />
            <strong>{e.name || "Unknown name"}</strong>
            {e.phone && (
              <a href={`tel:${e.phone}`} className="fw-semibold">
                <i className="bx bx-phone-call me-1" />
                {e.phone}
              </a>
            )}
            <Badge color="light" className="text-dark text-capitalize">
              {e.source.replace(/_/g, " ")}
            </Badge>
            <Badge color="light" className="text-dark text-capitalize">
              {e.city}
            </Badge>
            {e.status === "not_reachable" && (
              <Badge color="secondary">Not reachable, try again</Badge>
            )}
          </div>
          <div
            className={overdue ? "text-danger fw-semibold" : "text-muted"}
            style={{ fontSize: 13 }}
          >
            <i className="bx bx-time-five me-1" />
            waiting {Math.round(waiting)} min · {formatDateTime(e.created_at)}
          </div>
        </div>

        {crisisOpen && (
          <Alert color="danger" className="mt-2 mb-2 py-2">
            <strong>Crisis.</strong> Call now. The safety message (112 and
            Tele-MANAS 14416) was shown to them.
            {e.crisis?.escalations > 0 &&
              ` Escalated ${e.crisis.escalations} time(s).`}
          </Alert>
        )}

        {q ? (
          <div className="mt-2" style={{ fontSize: 14 }}>
            <div>{q.summary}</div>
            <div className="text-muted fst-italic mt-1">
              Opening line: “{q.opener}”
            </div>
            <div className="text-muted mt-1" style={{ fontSize: 12 }}>
              {q.who_needs_help !== "unknown" && `For ${q.who_needs_help} · `}
              {q.concern.replace(/_/g, " ")} · urgency {q.urgency} · {q.reason}
            </div>
          </div>
        ) : (
          <div
            className="mt-2 text-muted"
            style={{ fontSize: 14, whiteSpace: "pre-wrap" }}
          >
            {e.message || "No message"}
          </div>
        )}

        {canAct && (
          <div className="d-flex flex-wrap gap-2 align-items-center mt-3">
            {crisisOpen && (
              <Button
                color="danger"
                size="sm"
                onClick={acknowledge}
                disabled={busy === "ack"}
              >
                I'm handling this crisis
              </Button>
            )}
            <Input
              bsSize="sm"
              placeholder="Note (optional)"
              value={note}
              onChange={(ev) => setNote(ev.target.value)}
              style={{ maxWidth: 260 }}
            />
            <ButtonGroup size="sm">
              {OUTCOMES.map((o) => (
                <Button
                  key={o.status}
                  color={o.color}
                  outline
                  onClick={() => outcome(o.status)}
                  disabled={!!busy}
                >
                  {o.label}
                </Button>
              ))}
            </ButtonGroup>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

const QUEUE_STATUS = [
  ["crisis", "Crisis"],
  ["queued", "Waiting"],
  ["not_reachable", "Not reachable"],
];
const SCORES = [
  ["hot", "Hot"],
  ["warm", "Warm"],
  ["cold", "Cold"],
  ["unclear", "Unscored"],
];

const Enquiries = () => {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [status, setStatus] = useState("");
  const [score, setScore] = useState("");
  const [crisisCount, setCrisisCount] = useState(0);
  const list = usePagedList(getCallQueue, { q, city, status, score });
  const { reload } = list;
  const { can } = useAgentAccess();

  const countCrises = useCallback(() => {
    getCallQueue({ status: "crisis", limit: 1 })
      .then((page) => setCrisisCount(page.total))
      .catch(() => setCrisisCount(0));
  }, []);

  const refresh = useCallback(() => {
    reload();
    countCrises();
  }, [reload, countCrises]);

  useEffect(() => {
    countCrises();
    const timer = setInterval(refresh, 30000);
    return () => clearInterval(timer);
  }, [refresh, countCrises]);

  const overdue = list.items.filter((i) => i.overdue).length;

  return (
    <div className="p-3">
      <PageHeader
        title="Enquiry call queue"
        subtitle="Crisis first, then Hot, Warm and Cold. Refreshes every 30 seconds."
      >
        <Button size="sm" color="light" onClick={refresh}>
          <i className="bx bx-refresh" /> Refresh
        </Button>
      </PageHeader>
      <div className="d-flex gap-2 flex-wrap mb-3">
        <SearchBox
          onSearch={setQ}
          placeholder="Search name, phone or message"
        />
        <CitySelect
          value={city}
          onChange={setCity}
          allowAll
          activeOnly={false}
          style={{ width: 160 }}
        />
        <FilterSelect
          value={status}
          onChange={setStatus}
          options={QUEUE_STATUS}
          allLabel="All waiting"
        />
        <FilterSelect
          value={score}
          onChange={setScore}
          options={SCORES}
          allLabel="All scores"
        />
      </div>
      {(crisisCount > 0 || overdue > 0) && (
        <Alert color={crisisCount ? "danger" : "warning"}>
          {crisisCount > 0 && `${crisisCount} crisis enquiry(ies) waiting. `}
          {overdue > 0 &&
            `${overdue} urgent enquiry(ies) on this page are past the call-back target.`}
        </Alert>
      )}
      {list.loading && list.items.length === 0 ? (
        <Loading />
      ) : list.total === 0 ? (
        <Empty>No one is waiting for a call.</Empty>
      ) : (
        list.items.map((item) => (
          <QueueRow
            key={item.enquiry.id}
            item={item}
            onDone={refresh}
            canAct={can("ENQUIRIES")}
          />
        ))
      )}
      <Pager list={list} />
    </div>
  );
};

export default Enquiries;
