import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  Badge,
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Progress,
  Spinner,
} from "reactstrap";
import { getActiveJob, getJob } from "../../helpers/marketingAgentApi";
import { formatDateTime, notifyError } from "./common";

const POLL_MS = 2000;
const person = (actor) =>
  String(actor || "")
    .split(":")
    .pop();

const elapsed = (from, to) => {
  if (!from) return "";
  const seconds = Math.max(
    0,
    Math.round(((to ? new Date(to) : new Date()) - new Date(from)) / 1000),
  );
  return seconds < 60
    ? `${seconds}s`
    : `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, "0")}s`;
};

const ItemRow = ({ item }) => {
  const icon = {
    waiting: (
      <i className="bx bx-time-five text-muted" style={{ fontSize: 20 }} />
    ),
    running: <Spinner size="sm" color="primary" />,
    done: (
      <i
        className="bx bxs-check-circle text-success"
        style={{ fontSize: 20 }}
      />
    ),
    failed: (
      <i className="bx bxs-x-circle text-danger" style={{ fontSize: 20 }} />
    ),
  }[item.status];
  return (
    <div
      className="d-flex gap-3 align-items-start py-2 px-2 rounded"
      style={{
        fontSize: 13,
        background: item.status === "running" ? "#eef4ff" : undefined,
      }}
    >
      <div style={{ width: 22, textAlign: "center", paddingTop: 1 }}>
        {icon}
      </div>
      <div className="flex-grow-1" style={{ minWidth: 0 }}>
        <div className="fw-semibold text-truncate">{item.label}</div>
        <div className="text-muted">{item.detail}</div>
        {item.status === "running" && item.step && (
          <div className="text-primary mt-1">{item.step}…</div>
        )}
        {item.status === "done" && item.outcome && (
          <div className="text-success mt-1">{item.outcome}</div>
        )}
        {item.status === "failed" && (
          <div className="text-danger mt-1">{item.error}</div>
        )}
      </div>
      <div className="text-muted text-nowrap" style={{ fontSize: 12 }}>
        {item.status === "waiting"
          ? "waiting"
          : elapsed(item.started_at, item.finished_at)}
      </div>
    </div>
  );
};

export const useActiveJob = (key, every = 5000) => {
  const [job, setJob] = useState(null);
  useEffect(() => {
    setJob(null);
    if (!key) return undefined;
    let alive = true;
    let timer;
    const look = async () => {
      try {
        const found = await getActiveJob(key);
        if (alive) setJob(found || null);
      } catch {
        if (!alive) return;
      }
      if (alive) timer = setTimeout(look, every);
    };
    look();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [key, every]);
  return job;
};

export const JobProgress = ({
  jobId,
  title,
  isOpen,
  onClose,
  onFinished,
  unit = "posts",
  emptyText = "Every post in this week is already written.",
  doneLabel = "Review the posts",
}) => {
  const [job, setJob] = useState(null);

  useEffect(() => {
    if (!jobId) return undefined;
    let alive = true;
    let timer;
    const load = async () => {
      try {
        const next = await getJob(jobId);
        if (!alive) return;
        setJob(next);
        if (["queued", "running"].includes(next.status)) {
          timer = setTimeout(load, POLL_MS);
        } else if (onFinished) {
          onFinished(next);
        }
      } catch {
        if (alive) timer = setTimeout(load, POLL_MS * 2);
      }
    };
    load();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [jobId, onFinished]);

  const progress = job?.progress;
  const running = job && ["queued", "running"].includes(job.status);
  const total = progress?.total || 0;
  const done = progress?.done || 0;
  const pct = total ? Math.round((100 * done) / total) : running ? 5 : 100;

  return (
    <Modal isOpen={isOpen} toggle={onClose} size="lg" centered scrollable>
      <ModalHeader toggle={onClose}>
        {running ? (
          <Spinner size="sm" color="primary" className="me-2" />
        ) : job?.status === "succeeded" ? (
          <i className="bx bxs-check-circle text-success me-1" />
        ) : (
          <i className="bx bxs-error-circle text-danger me-1" />
        )}
        {title}
      </ModalHeader>
      <ModalBody>
        {!job ? (
          <div className="d-flex gap-2 align-items-center text-muted">
            <Spinner size="sm" /> Loading progress…
          </div>
        ) : (
          <>
            <div className="text-muted mb-2" style={{ fontSize: 13 }}>
              Started by <strong>{person(job.actor)}</strong> at{" "}
              {formatDateTime(job.started_at || job.created_at)} ·{" "}
              {elapsed(job.started_at || job.created_at, job.finished_at)}
              {running &&
                " · it keeps running if you close this window, and everyone opening this week sees the same progress."}
            </div>
            <div
              className="d-flex justify-content-between mb-1"
              style={{ fontSize: 13 }}
            >
              <span className="fw-semibold">
                {running
                  ? progress?.current
                    ? `Now: ${progress.current}`
                    : "Getting ready…"
                  : job.status === "succeeded"
                    ? "Finished"
                    : "Stopped"}
              </span>
              <span>
                {done} of {total} {unit}
                {progress?.failed ? (
                  <Badge color="danger" pill className="ms-2">
                    {progress.failed} failed
                  </Badge>
                ) : null}
              </span>
            </div>
            <Progress
              value={pct}
              animated={!!running}
              color={progress?.failed ? "warning" : "success"}
              style={{ height: 10 }}
              className="mb-3"
            />
            {job.status === "failed" && (
              <div className="alert alert-danger py-2" style={{ fontSize: 13 }}>
                {job.error}
              </div>
            )}
            {(progress?.items || []).map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
            {progress && !progress.items.length && (
              <div className="text-muted" style={{ fontSize: 13 }}>
                {emptyText}
              </div>
            )}
          </>
        )}
      </ModalBody>
      <ModalFooter>
        <Button
          color={running ? "secondary" : "primary"}
          outline={!!running}
          onClick={onClose}
        >
          {running ? "Hide (keeps running)" : doneLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export const useTrackedJob = (key, { onFinished } = {}) => {
  const active = useActiveJob(key);
  const [job, setJob] = useState(null);
  const [open, setOpen] = useState(false);
  const finishedRef = useRef(onFinished);
  finishedRef.current = onFinished;
  const finished = useCallback((done) => finishedRef.current?.(done), []);

  const show = useCallback((id, title) => {
    setJob({ id, title });
    setOpen(true);
  }, []);

  const start = useCallback(
    async (begin, title) => {
      try {
        const started = await begin();
        show(started.id, title);
        return started;
      } catch (e) {
        if (e.status === 409 && e.details?.job_id) {
          show(e.details.job_id, title);
          toast.info(
            `${person(e.details.actor) || "Someone"} already started this: showing its progress`,
          );
        } else {
          notifyError(e);
        }
        return null;
      }
    },
    [show],
  );

  const modal = (props) =>
    job ? (
      <JobProgress
        jobId={job.id}
        title={job.title}
        isOpen={open}
        onClose={() => setOpen(false)}
        onFinished={finished}
        unit="steps"
        emptyText="Getting ready…"
        doneLabel="Done"
        {...props}
      />
    ) : null;

  return {
    active,
    start,
    show,
    modal,
    who: active ? person(active.actor) : null,
  };
};

export default JobProgress;
