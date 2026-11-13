import React, { useEffect, useMemo, useRef, useState } from "react";
import Select from "react-select";
import { toast } from "react-toastify";
import { Badge, Button, ButtonGroup, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from "reactstrap";
import {
  deleteLectureEvidence,
  markLectureSessionDone,
  saveLectureAttendance,
  undoLectureSessionDone,
  updateLectureSessionHosts,
  uploadLectureEvidence,
} from "../../../helpers/backend_helper";
import { useAuthError } from "../../../Components/Hooks/useAuthError";
import ConfirmationModal from "../../../Components/Common/ConfirmationModal";
import HostSelect from "./HostSelect";
import { activityText, errorMessage, formatDay, hostNames, wasMemberOn } from "../helpers";

const MAX_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

const activityOptions = (activities) => {
  const groups = [];
  for (const a of activities || []) {
    const label = `${a.week} · ${a.weekTheme}`;
    let g = groups.find((x) => x.label === label);
    if (!g) groups.push((g = { label, options: [] }));
    const tag = a.sessionNo === "Review" ? "Review" : /^T/.test(a.sessionNo) ? a.sessionNo : `Session ${a.sessionNo}`;
    g.options.push({ value: a.day, label: `Activity ${a.day} · ${tag} · ${a.topic}` });
  }
  return groups;
};

const Section = ({ n, title, hint, children }) => (
  <div className="mb-4">
    <div className="d-flex align-items-baseline gap-2 mb-2">
      <span className="badge rounded-pill bg-primary-subtle text-primary">{n}</span>
      <h6 className="mb-0">{title}</h6>
      {hint && <small className="text-muted">{hint}</small>}
    </div>
    {children}
  </div>
);

/**
 * One day of a series: 1. the activity done, 2. attendance (after the activity
 * is marked done), 3. photo evidence, and the session's own hosts.
 */
const SessionModal = ({
  isOpen,
  toggle,
  session,
  series,
  members,
  programme,
  canManage,
  canEdit,
  canDeletePhotos = false, // the role's DELETE level, on top of canEdit
  viewOnly = false, // the role has no WRITE: nothing here can be changed
  suggestedActivity,
  onSessionChange,
}) => {
  const handleAuthError = useAuthError();
  const fileInput = useRef(null);
  const [activityDay, setActivityDay] = useState(null);
  const [marks, setMarks] = useState({});
  const [busy, setBusy] = useState("");
  const [upload, setUpload] = useState(null); // { done, total }
  const [photoToDelete, setPhotoToDelete] = useState(null);
  const [hosts, setHosts] = useState([]);

  const sessionKey = session?._id;
  useEffect(() => {
    if (!isOpen || !session) return;
    setActivityDay(session.activityDay || suggestedActivity || 1);
    setMarks(Object.fromEntries((session.attendance || []).map((a) => [String(a.patient?._id || a.patient), a.status])));
    setHosts((session.hosts || []).map((h) => h?._id || h));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, sessionKey]);

  // Patients who were in the series on this day (one row each).
  const roster = useMemo(() => {
    if (!session) return [];
    const seen = new Set();
    return members
      .filter((m) => wasMemberOn(m, session.dateKey) && m.patient)
      .filter((m) => (seen.has(String(m.patient._id)) ? false : seen.add(String(m.patient._id))))
      .sort((a, b) => (a.patient.name || "").localeCompare(b.patient.name || ""));
  }, [members, session]);

  const options = useMemo(() => activityOptions(programme?.activities), [programme]);
  const flatOptions = options.flatMap((g) => g.options);

  if (!session) return null;

  const maxPhotos = programme?.maxPhotos || 10;
  const photos = session.evidence || [];
  const saved = Object.fromEntries((session.attendance || []).map((a) => [String(a.patient?._id || a.patient), a.status]));
  const dirty = roster.some((m) => marks[String(m.patient._id)] && marks[String(m.patient._id)] !== saved[String(m.patient._id)]);
  const unmarked = roster.filter((m) => !marks[String(m.patient._id)]).length;

  const run = async (name, fn, okMessage) => {
    setBusy(name);
    try {
      const res = await fn();
      if (res?.data) onSessionChange(res.data);
      toast.success(okMessage || res?.message || "Saved");
      return res;
    } catch (err) {
      if (!handleAuthError(err)) toast.error(errorMessage(err));
      return null;
    } finally {
      setBusy("");
    }
  };

  const markDone = () => run("done", () => markLectureSessionDone(session._id, activityDay));
  const undoDone = () => run("undo", () => undoLectureSessionDone(session._id));
  const saveAttendance = () => {
    const entries = roster
      .map((m) => ({ patient: m.patient._id, status: marks[String(m.patient._id)] }))
      .filter((e) => e.status);
    if (!entries.length) return toast.info("Mark at least one patient present or absent");
    return run("attendance", () => saveLectureAttendance(session._id, entries));
  };
  const saveHosts = () => run("hosts", () => updateLectureSessionHosts(session._id, hosts));

  const choosePhotos = async (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";
    if (!picked.length) return;
    const room = maxPhotos - photos.length;
    const bad = picked.filter((f) => !PHOTO_TYPES.includes(f.type) || f.size > MAX_BYTES);
    if (bad.length) toast.warn(`${bad.length} file${bad.length > 1 ? "s" : ""} skipped: only jpg, png or webp up to 5 MB`);
    let files = picked.filter((f) => !bad.includes(f));
    if (files.length > room) {
      toast.warn(`Only ${room} more photo${room === 1 ? "" : "s"} can be added (limit ${maxPhotos})`);
      files = files.slice(0, room);
    }
    if (!files.length) return;
    setUpload({ done: 0, total: files.length });
    let added = 0;
    for (const f of files) {
      try {
        const res = await uploadLectureEvidence(session._id, f);
        if (res?.data) onSessionChange(res.data);
        added += 1;
      } catch (err) {
        if (handleAuthError(err)) break;
        toast.error(`${f.name}: ${errorMessage(err)}`);
      }
      setUpload((u) => (u ? { ...u, done: u.done + 1 } : u));
    }
    setUpload(null);
    if (added) toast.success(`${added} photo${added > 1 ? "s" : ""} added`);
  };

  const deletePhoto = async () => {
    const p = photoToDelete;
    setPhotoToDelete(null);
    await run("photo", () => deleteLectureEvidence(session._id, p._id), "Photo removed");
  };

  const statusBadge = session.done ? (
    <Badge color="success">Done</Badge>
  ) : session.isFuture ? (
    <Badge color="light" className="text-muted">Upcoming</Badge>
  ) : (
    <Badge color="warning">Not done</Badge>
  );

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="lg" scrollable centered>
      <ModalHeader toggle={toggle}>
        {session.seriesDay ? `Day ${session.seriesDay} · ` : ""}
        {formatDay(session.dateKey)} <span className="text-muted fw-normal">· {series.label}</span> {statusBadge}
      </ModalHeader>
      <ModalBody>
        {session.isFuture && (
          <div className="alert alert-light border py-2">This session hasn't happened yet. It can be marked on the day.</div>
        )}
        {!canEdit && !session.isFuture && (
          <div className="alert alert-light border py-2">
            {viewOnly
              ? "You have view-only access to Therapy Lectures."
              : session.canRun
                ? "This series has closed, so this session can't be changed."
                : "Only this session's hosts can mark it."}
          </div>
        )}

        <Section n={1} title="Activity" hint={session.done ? `marked by ${session.doneBy?.name || "a host"}` : "which of the 45 was done"}>
          {canEdit ? (
            <div className="d-flex flex-wrap gap-2 align-items-start">
              <div className="flex-grow-1" style={{ minWidth: 280 }}>
                <Select
                  aria-label="Activity"
                  options={options}
                  value={flatOptions.find((o) => o.value === activityDay) || null}
                  onChange={(o) => setActivityDay(o?.value || null)}
                  classNamePrefix="select"
                  menuPortalTarget={document.body}
                  styles={{ menuPortal: (b) => ({ ...b, zIndex: 2000 }) }}
                />
                {!session.done && suggestedActivity === activityDay && (
                  <small className="text-muted">Suggested: activity {suggestedActivity}, for day {suggestedActivity} of the series.</small>
                )}
              </div>
              <Button
                color="success"
                disabled={!activityDay || busy === "done" || (session.done && session.activityDay === activityDay)}
                onClick={markDone}
              >
                {busy === "done" ? <Spinner size="sm" /> : session.done ? "Change activity" : "Mark done"}
              </Button>
              {session.done && !session.attendance?.length && (
                <Button color="link" className="text-muted" disabled={busy === "undo"} onClick={undoDone}>
                  Mark not done
                </Button>
              )}
            </div>
          ) : session.done ? (
            <div>
              <div className="fw-medium">{activityText(session.activity)}</div>
              <small className="text-muted">{session.activity?.week} · {session.activity?.weekTheme}</small>
            </div>
          ) : (
            <span className="text-muted">Not marked yet.</span>
          )}
        </Section>

        <Section
          n={2}
          title="Attendance"
          hint={session.done ? `${roster.length} patient${roster.length === 1 ? "" : "s"} in the series this day` : "after the activity is marked done"}
        >
          {!session.done ? (
            <div className="text-muted small">Mark the activity done first.</div>
          ) : roster.length === 0 ? (
            <div className="text-muted small">No patients were in this series on this day.</div>
          ) : (
            <>
              {canEdit && (
                <div className="d-flex gap-2 mb-2">
                  <Button size="sm" color="light" className="border" onClick={() => setMarks((m) => ({ ...m, ...Object.fromEntries(roster.map((r) => [String(r.patient._id), "PRESENT"])) }))}>
                    All present
                  </Button>
                  {unmarked > 0 && <small className="text-muted align-self-center">{unmarked} not marked</small>}
                </div>
              )}
              <ul className="list-group">
                {roster.map((m) => {
                  const pid = String(m.patient._id);
                  const v = marks[pid];
                  return (
                    <li key={pid} className="list-group-item d-flex justify-content-between align-items-center py-2" data-testid="attendance-row">
                      <div>
                        <span className="fw-medium text-capitalize">{m.patient.name}</span>
                        <small className="text-muted ms-2">{m.patient.uid}</small>
                      </div>
                      {canEdit ? (
                        <ButtonGroup size="sm">
                          <Button color="success" outline={v !== "PRESENT"} onClick={() => setMarks((x) => ({ ...x, [pid]: "PRESENT" }))}>
                            Present
                          </Button>
                          <Button color="danger" outline={v !== "ABSENT"} onClick={() => setMarks((x) => ({ ...x, [pid]: "ABSENT" }))}>
                            Absent
                          </Button>
                        </ButtonGroup>
                      ) : v ? (
                        <Badge color={v === "PRESENT" ? "success" : "danger"}>{v === "PRESENT" ? "Present" : "Absent"}</Badge>
                      ) : (
                        <span className="text-muted small">Not marked</span>
                      )}
                    </li>
                  );
                })}
              </ul>
              {canEdit && (
                <div className="text-end mt-2">
                  <Button color="primary" disabled={!dirty || busy === "attendance"} onClick={saveAttendance}>
                    {busy === "attendance" ? <Spinner size="sm" /> : "Save attendance"}
                  </Button>
                </div>
              )}
            </>
          )}
        </Section>

        <Section n={3} title="Evidence" hint={`${photos.length} of ${maxPhotos} photos`}>
          <div className="d-flex flex-wrap gap-2">
            {photos.map((p) => (
              <div key={p._id} className="position-relative" style={{ width: 110, height: 110 }}>
                <a href={p.url} target="_blank" rel="noreferrer" title={`Added by ${p.uploadedBy?.name || "a host"}`}>
                  <img src={p.url} alt={p.originalName || "Session photo"} className="rounded border w-100 h-100" style={{ objectFit: "cover" }} />
                </a>
                {canEdit && canDeletePhotos && (
                  <button
                    type="button"
                    className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 px-1 py-0"
                    aria-label="Remove photo"
                    onClick={() => setPhotoToDelete(p)}
                  >
                    <i className="bx bx-x" />
                  </button>
                )}
              </div>
            ))}
            {canEdit && photos.length < maxPhotos && (
              <button
                type="button"
                className="btn btn-light border d-flex flex-column justify-content-center align-items-center"
                style={{ width: 110, height: 110 }}
                disabled={Boolean(upload)}
                onClick={() => fileInput.current?.click()}
              >
                {upload ? (
                  <>
                    <Spinner size="sm" />
                    <small className="mt-1">{upload.done} / {upload.total}</small>
                  </>
                ) : (
                  <>
                    <i className="bx bx-camera fs-3" />
                    <small>Add photos</small>
                  </>
                )}
              </button>
            )}
            {!canEdit && photos.length === 0 && <span className="text-muted small">No photos.</span>}
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            hidden
            onChange={choosePhotos}
            data-testid="photo-input"
          />
          {canEdit && <small className="text-muted d-block mt-1">jpg, png or webp, up to 5 MB each.</small>}
        </Section>

        <Section n={4} title="Hosts for this day">
          {canManage && !series.locked ? (
            <div className="d-flex flex-wrap gap-2 align-items-start">
              <div className="flex-grow-1" style={{ minWidth: 280 }}>
                <HostSelect center={series.centerId || series.center?._id} value={hosts} onChange={setHosts} placeholder="Same as the series' hosts" />
                <small className="text-muted">Leave empty to use the series' hosts ({hostNames(series.hosts)}).</small>
              </div>
              <Button color="light" className="border" disabled={busy === "hosts"} onClick={saveHosts}>
                {busy === "hosts" ? <Spinner size="sm" /> : "Save hosts"}
              </Button>
            </div>
          ) : (
            <span className="text-capitalize">{session.hosts?.length ? hostNames(session.hosts) : `Series hosts (${hostNames(series.hosts)})`}</span>
          )}
        </Section>
      </ModalBody>
      <ModalFooter>
        <Button color="light" className="border" onClick={toggle}>Close</Button>
      </ModalFooter>

      <ConfirmationModal
        isOpen={Boolean(photoToDelete)}
        toggle={() => setPhotoToDelete(null)}
        title="Remove photo"
        message="Remove this photo from the session?"
        confirmText="Remove"
        onConfirm={deletePhoto}
      />
    </Modal>
  );
};

export default SessionModal;
