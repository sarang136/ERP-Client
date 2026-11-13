import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Alert, Badge, Button, Card, CardBody, Input, Label, Nav, NavItem, NavLink, Spinner, Table } from "reactstrap";
import {
  deleteLectureSeries,
  getLectureProgramme,
  getLectureSeries,
  removeLectureMember,
} from "../../../helpers/backend_helper";
import { useAuthError } from "../../../Components/Hooks/useAuthError";
import ConfirmationModal from "../../../Components/Common/ConfirmationModal";
import SessionModal from "../components/SessionModal";
import HostsModal from "../components/HostsModal";
import AddPatientModal from "../components/AddPatientModal";
import MoveModal from "../components/MoveModal";
import ProgressModal from "../components/ProgressModal";
import { useLecturePermissions } from "../permissions";
import {
  LEAVE_TEXT,
  activityText,
  errorMessage,
  formatDate,
  formatDay,
  hostNames,
  seriesHalfTag,
  seriesStatus,
  wasMemberOn,
} from "../helpers";

let programmeCache = null;

const SeriesDetail = () => {
  const { seriesId } = useParams();
  const navigate = useNavigate();
  const handleAuthError = useAuthError();
  // The role's level (WRITE / DELETE) on top of being a host of this series.
  const { canWrite, canDelete } = useLecturePermissions();

  const [data, setData] = useState(null);
  const [programme, setProgramme] = useState(programmeCache);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState("sessions");
  const [showPast, setShowPast] = useState(false);

  const [sessionId, setSessionId] = useState(null);
  const [hostsOpen, setHostsOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [moveFor, setMoveFor] = useState(null);
  const [progressFor, setProgressFor] = useState(null);
  const [removeFor, setRemoveFor] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    async ({ quiet = false } = {}) => {
      if (!quiet) setLoading(true);
      try {
        const [res, prog] = await Promise.all([
          getLectureSeries(seriesId),
          programmeCache ? Promise.resolve({ data: programmeCache }) : getLectureProgramme(),
        ]);
        programmeCache = prog?.data || programmeCache;
        setProgramme(programmeCache);
        setData(res?.data || null);
        setLoadError("");
      } catch (err) {
        if (!handleAuthError(err)) setLoadError(errorMessage(err, "Could not load this series"));
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seriesId],
  );

  useEffect(() => {
    load();
  }, [load]);

  // Session changes come back from the server; patch them in without a reload.
  const replaceSession = (s) =>
    setData((d) => (d ? { ...d, sessions: d.sessions.map((x) => (x._id === s._id ? { ...x, ...s } : x)) } : d));

  const members = useMemo(() => data?.members || [], [data]);
  const activeMembers = members.filter((m) => m.active);
  const shownMembers = showPast ? members : activeMembers;
  const session = data?.sessions.find((s) => s._id === sessionId) || null;

  if (loading && !data) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner color="primary" />
      </div>
    );
  }
  if (loadError && !data) {
    return (
      <Card>
        <CardBody className="text-center py-5">
          <p className="text-danger mb-3">{loadError}</p>
          <Button color="light" onClick={() => navigate("/therapy-lectures")}>Back to lecture series</Button>
        </CardBody>
      </Card>
    );
  }
  if (!data) return null;

  const { series, isAdmin, today } = data;
  const isHost = data.canManage; // a host or the creator of this series (or an admin)
  const canManage = isHost && canWrite; // edit hosts, add and move patients, session hosts
  const canRemove = isHost && canDelete; // delete the series, remove patients
  const status = seriesStatus(series);
  const canEditSessions = !series.locked || isAdmin;
  const totalDays = programme?.seriesDays || 45;
  const plannedActivity = (day) => programme?.activities?.find((a) => a.day === day) || null;
  // Back to the month list: this month while the series runs, else the month it started.
  const backTo = `/therapy-lectures?month=${series.day ? today.slice(0, 7) : series.startKey.slice(0, 7)}&centre=${series.centerId || series.center?._id}`;

  const removeMember = async () => {
    setBusy(true);
    try {
      const res = await removeLectureMember(removeFor._id);
      toast.success(res?.message || "Removed");
      setRemoveFor(null);
      load({ quiet: true });
    } catch (err) {
      if (!handleAuthError(err)) toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const deleteSeries = async () => {
    setDeleting(true);
    try {
      await deleteLectureSeries(series._id);
      toast.success("Series deleted");
      navigate(backTo);
    } catch (err) {
      if (!handleAuthError(err)) toast.error(errorMessage(err));
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  const nothingRecorded = data.sessions.every((s) => !s.done && !s.attendance?.length && !s.evidence?.length);

  return (
    <>
      <Link to={backTo} className="small">
        <i className="bx bx-arrow-back me-1" />Lecture series
      </Link>

      <Card className="mt-2 mb-3">
        <CardBody>
          <div className="d-flex flex-wrap justify-content-between gap-3">
            <div>
              <div className="text-muted small text-uppercase fw-semibold">
                {series.center?.title || "Centre"} · {seriesHalfTag(series.startKey)} · {totalDays}-day series
              </div>
              <h4 className="mb-1">
                {series.label} <Badge color={status.color} className="fs-12 align-middle">{status.text}</Badge>
              </h4>
              <div className="text-muted small">{programme?.name || "45-Day De-addiction Lecture Programme"}</div>
            </div>
            <div className="text-md-end">
              <div className="small text-muted">Hosts</div>
              <div className="fw-medium text-capitalize">{hostNames(series.hosts) || "—"}</div>
              {(canManage || (canRemove && nothingRecorded)) && (
                <div className="mt-2 d-flex gap-2 justify-content-md-end">
                  {canManage && (
                    <Button size="sm" color="light" className="border" onClick={() => setHostsOpen(true)} disabled={series.locked && !isAdmin}>
                      <i className="bx bx-edit me-1" />Edit hosts
                    </Button>
                  )}
                  {canRemove && nothingRecorded && (
                    <Button size="sm" color="danger" outline onClick={() => setConfirmDelete(true)}>
                      <i className="bx bx-trash me-1" />Delete
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {series.locked && (
        <Alert color="secondary" className="py-2">
          This series has closed. {isAdmin ? "As an admin you can still change it." : "Only an admin can change it now."}
        </Alert>
      )}
      {!series.locked && series.ended && (
        <Alert color="warning" className="py-2">
          This series has ended. Hosts can still mark its sessions for {programme?.editGraceDays ?? 2} days.
        </Alert>
      )}
      {!canWrite ? (
        <Alert color="light" className="py-2 border">
          You have view-only access to Therapy Lectures.
        </Alert>
      ) : (
        !isHost && (
          <Alert color="light" className="py-2 border">
            You're viewing this series. Only its hosts can change it.
          </Alert>
        )
      )}

      <Nav tabs className="nav-tabs-custom mb-3">
        <NavItem>
          <NavLink href="#" className={tab === "sessions" ? "active" : ""} onClick={(e) => {
            e.preventDefault();
            setTab("sessions");
          }}>
            Sessions <Badge color="light" className="text-body ms-1">{data.sessions.filter((s) => s.done).length}/{data.sessions.length}</Badge>
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink href="#" className={tab === "patients" ? "active" : ""} onClick={(e) => {
            e.preventDefault();
            setTab("patients");
          }}>
            Patients <Badge color="light" className="text-body ms-1">{activeMembers.length}</Badge>
          </NavLink>
        </NavItem>
      </Nav>

      {tab === "sessions" && (
        <Card>
          <div className="table-responsive">
            <Table className="table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 70 }}>Day</th>
                  <th>Date</th>
                  <th>Activity</th>
                  <th>Hosts</th>
                  <th className="text-center">Attendance</th>
                  <th className="text-center">Photos</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.sessions.map((s) => {
                  const inSeries = members.filter((m) => wasMemberOn(m, s.dateKey)).length;
                  return (
                    <tr key={s._id} role="button" onClick={() => setSessionId(s._id)} className={s.dateKey === today ? "table-active" : ""}>
                      <td className="fw-medium text-nowrap">Day {s.seriesDay}</td>
                      <td className="text-nowrap">
                        {formatDay(s.dateKey)}
                        {s.dateKey === today && <Badge color="primary" className="ms-2">Today</Badge>}
                      </td>
                      <td>
                        {s.done ? (
                          <>
                            <div className="fw-medium">{activityText(s.activity)}</div>
                            <small className="text-muted">{s.activity?.week} · {s.activity?.weekTheme}</small>
                          </>
                        ) : (
                          <span className="text-muted small" title="Planned: activity for this day">
                            {plannedActivity(s.seriesDay)?.topic || "—"}
                          </span>
                        )}
                      </td>
                      <td className="small text-capitalize">
                        {s.hosts?.length ? hostNames(s.hosts) : <span className="text-muted">Series hosts</span>}
                      </td>
                      <td className="text-center small text-nowrap">
                        {s.presentCount || s.absentCount ? (
                          <>
                            <span className="text-success fw-medium">{s.presentCount} present</span>
                            {" · "}
                            <span className="text-danger">{s.absentCount} absent</span>
                            {inSeries > s.presentCount + s.absentCount && (
                              <div className="text-muted">{inSeries - s.presentCount - s.absentCount} not marked</div>
                            )}
                          </>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="text-center small">{s.evidence?.length || <span className="text-muted">—</span>}</td>
                      <td className="text-end text-nowrap">
                        {s.done ? (
                          <Badge color="success-subtle" className="text-success">Done</Badge>
                        ) : s.isFuture ? (
                          <Badge color="light" className="text-muted">Upcoming</Badge>
                        ) : (
                          <Badge color="warning-subtle" className="text-warning">Not done</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </Card>
      )}

      {tab === "patients" && (
        <Card>
          <CardBody className="d-flex flex-wrap justify-content-between align-items-center gap-2 py-2 border-bottom">
            <div className="form-check form-switch mb-0">
              <Input type="checkbox" className="form-check-input" id="tl-show-past" checked={showPast} onChange={(e) => setShowPast(e.target.checked)} />
              <Label for="tl-show-past" className="form-check-label small">Show patients who left</Label>
            </div>
            {canManage && !series.ended && (
              <Button size="sm" color="primary" onClick={() => setAddOpen(true)}>
                <i className="bx bx-user-plus me-1" />Add patient
              </Button>
            )}
          </CardBody>
          <div className="table-responsive">
            <Table className="align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Patient</th>
                  <th>In series</th>
                  <th>Attendance</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {shownMembers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-4">
                      No patients in this series yet.
                    </td>
                  </tr>
                )}
                {shownMembers.map((m) => (
                  <tr key={m._id} className={m.active ? "" : "text-muted"}>
                    <td>
                      <div className="fw-medium text-capitalize">{m.patient?.name || "—"}</div>
                      <small className="text-muted">{m.patient?.uid}</small>
                    </td>
                    <td className="small text-nowrap">
                      {formatDate(m.joinedKey)}
                      {m.leftKey ? ` – ${formatDate(m.leftKey)}` : m.completed ? ` – ${formatDate(series.endKey)}` : " onwards"}
                      {m.movedFrom && <div className="text-muted">from {m.movedFrom}</div>}
                    </td>
                    <td className="small text-nowrap">
                      {m.attendance?.held ? (
                        <>
                          <span className="text-success fw-medium">{m.attendance.present} present</span>
                          {" · "}
                          <span className="text-danger">{m.attendance.absent} absent</span>
                          <div className="text-muted">of {m.attendance.held} session{m.attendance.held === 1 ? "" : "s"} held</div>
                        </>
                      ) : (
                        <span className="text-muted">No sessions yet</span>
                      )}
                    </td>
                    <td className="small">
                      {m.completed ? (
                        <Badge color="info-subtle" className="text-info">Completed</Badge>
                      ) : m.active ? (
                        m.patient?.isAdmit === false ? (
                          <Badge color="warning-subtle" className="text-warning">Not admitted</Badge>
                        ) : (
                          <Badge color="success-subtle" className="text-success">In series</Badge>
                        )
                      ) : (
                        <Badge color="light" className="text-muted">
                          {LEAVE_TEXT[m.leftReason] || "Left"}
                          {m.movedTo ? ` to ${m.movedTo}` : ""}
                        </Badge>
                      )}
                    </td>
                    <td className="text-end text-nowrap">
                      <Button size="sm" color="link" className="p-0 me-3" onClick={() => setProgressFor(m.patient)}>
                        Progress
                      </Button>
                      {canManage && m.active && !m.completed && (
                        <Button size="sm" color="link" className="p-0 me-3" onClick={() => setMoveFor(m)}>Move</Button>
                      )}
                      {canRemove && m.active && !m.completed && (
                        <Button size="sm" color="link" className="p-0 text-danger" onClick={() => setRemoveFor(m)}>Remove</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card>
      )}

      <SessionModal
        isOpen={Boolean(session)}
        toggle={() => setSessionId(null)}
        session={session}
        series={series}
        members={members}
        programme={programme}
        today={today}
        canManage={canManage}
        canEdit={canWrite && Boolean(session?.canRun) && canEditSessions && !session?.isFuture}
        canDeletePhotos={canDelete}
        viewOnly={!canWrite}
        suggestedActivity={session ? Math.min(Math.max(session.seriesDay, 1), totalDays) : 1}
        onSessionChange={replaceSession}
      />
      <HostsModal
        isOpen={hostsOpen}
        toggle={() => setHostsOpen(false)}
        series={series}
        onSaved={() => {
          setHostsOpen(false);
          load({ quiet: true });
        }}
      />
      <AddPatientModal
        isOpen={addOpen}
        toggle={() => setAddOpen(false)}
        series={series}
        today={today}
        onAdded={() => load({ quiet: true })}
      />
      <MoveModal
        isOpen={Boolean(moveFor)}
        toggle={() => setMoveFor(null)}
        member={moveFor}
        series={series}
        onMoved={() => {
          setMoveFor(null);
          load({ quiet: true });
        }}
      />
      <ProgressModal isOpen={Boolean(progressFor)} toggle={() => setProgressFor(null)} patient={progressFor} />
      <ConfirmationModal
        isOpen={Boolean(removeFor)}
        toggle={() => setRemoveFor(null)}
        title="Remove patient"
        message={`Take ${removeFor?.patient?.name || "this patient"} out of this series? Their attendance so far is kept.`}
        confirmText={busy ? <Spinner size="sm" /> : "Remove"}
        confirmDisabled={busy}
        onConfirm={removeMember}
      />
      <ConfirmationModal
        isOpen={confirmDelete}
        toggle={() => setConfirmDelete(false)}
        title="Delete series"
        message={`Delete the ${series.label} series? Patients in it are taken out. This can't be undone.`}
        confirmText={deleting ? <Spinner size="sm" /> : "Delete series"}
        confirmDisabled={deleting}
        onConfirm={deleteSeries}
      />
    </>
  );
};

export default SeriesDetail;
