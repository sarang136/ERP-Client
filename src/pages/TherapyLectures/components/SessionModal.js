import React, { useEffect, useMemo, useRef, useState } from "react";
import Select from "react-select";
import { toast } from "react-toastify";
import { Badge, Button, ButtonGroup, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from "reactstrap";
import { saveLectureSession, updateLectureSessionHosts } from "../../../helpers/backend_helper";
import { useAuthError } from "../../../Components/Hooks/useAuthError";
import HostSelect from "./HostSelect";
import { activityText, activityWeekText, errorMessage, formatDay, hostNames, wasMemberOn } from "../helpers";

const MAX_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

const idOf = (v) => String(v?._id ?? v);

// The programme's sessions grouped by week: "Week 2" → "Tuesday · MET/MI 2 · Motivational Enhancement I – …".
const activityOptions = (activities) => {
  const groups = [];
  for (const a of activities || []) {
    let g = groups.find((x) => x.label === a.week);
    if (!g) groups.push((g = { label: a.week, options: [] }));
    g.options.push({ value: a.day, label: [a.weekday, a.title, a.topic].filter(Boolean).join(" · ") });
  }
  return groups;
};

const previewUrl = (file) => (typeof URL.createObjectURL === "function" ? URL.createObjectURL(file) : "");
const dropPreview = (url) => url && typeof URL.revokeObjectURL === "function" && URL.revokeObjectURL(url);

const Field = ({ title, required, hint, error, children, testId }) => (
  <div className="mb-4" data-testid={testId}>
    <div className="d-flex align-items-baseline gap-2 mb-2">
      <h6 className="mb-0">
        {title}
        {required && <span className="text-danger ms-1">*</span>}
      </h6>
      {hint && <small className="text-muted">{hint}</small>}
    </div>
    {children}
    {error && <div className="text-danger small mt-1" role="alert">{error}</div>}
  </div>
);

const Photo = ({ url, alt, title, faded, children }) => (
  <div className="position-relative" style={{ width: 110, height: 110, opacity: faded ? 0.35 : 1 }}>
    <a href={url || undefined} target="_blank" rel="noreferrer" title={title}>
      <img src={url} alt={alt} className="rounded border w-100 h-100" style={{ objectFit: "cover" }} />
    </a>
    {children}
  </div>
);

/**
 * One day of a series, as one form with one Save (owner decision, 2026-11-17).
 * Every field is required: the session held, the hosts, every patient who was
 * in the series that day marked present or absent, and at least one photo.
 * Saving marks the session done; it can be opened and saved again to correct
 * it. New photos and removed photos are only sent when Save is pressed.
 *
 * Before the day, the only field is who will host it (series' hosts only).
 */
const SessionModal = ({
  isOpen,
  toggle,
  session,
  series,
  members,
  programme,
  canManage, // a host of the series with WRITE: changes who hosts
  canEdit, // may fill in and save this session now
  canDeletePhotos = false, // the role's DELETE level: may remove a saved photo
  viewOnly = false, // the role has no WRITE: nothing here can be changed
  suggestedActivity,
  onSessionChange,
}) => {
  const handleAuthError = useAuthError();
  const fileInput = useRef(null);
  const [activityDay, setActivityDay] = useState(null);
  const [hosts, setHosts] = useState([]);
  const [marks, setMarks] = useState({});
  const [newPhotos, setNewPhotos] = useState([]); // [{ key, file, url }]
  const [removeIds, setRemoveIds] = useState([]); // saved photos to remove on Save
  const [tried, setTried] = useState(false); // Save was pressed: show what's missing
  const [saving, setSaving] = useState(false);

  const programmeDays = programme?.activities?.length || 0;
  // A session saved against the earlier 45-activity list has no title; its
  // number means another session now, so nothing is pre-picked for it.
  const savedOnOldList = Boolean(session?.done && session?.activity && !session.activity.title);

  const sessionKey = session?._id;
  useEffect(() => {
    if (!isOpen || !session) return;
    setActivityDay(
      session.done ? (savedOnOldList ? null : session.activityDay || null) : suggestedActivity || null,
    );
    setHosts((session.hosts?.length ? session.hosts : series?.hosts || []).map(idOf));
    setMarks(Object.fromEntries((session.attendance || []).map((a) => [idOf(a.patient), a.status])));
    setNewPhotos((list) => {
      list.forEach((p) => dropPreview(p.url));
      return [];
    });
    setRemoveIds([]);
    setTried(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, sessionKey]);

  // Previews are browser memory: freed when the window goes away.
  const previews = useRef([]);
  previews.current = newPhotos;
  useEffect(() => () => previews.current.forEach((p) => dropPreview(p.url)), []);

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
  const saved = session.evidence || [];
  const keptPhotos = saved.filter((p) => !removeIds.includes(idOf(p)));
  const photoCount = keptPhotos.length + newPhotos.length;
  const unmarked = roster.filter((m) => !marks[String(m.patient._id)]).length;
  const planOnly = session.isFuture; // before the day: only who will host it
  const hostsEditable = canManage && (planOnly ? !series.locked : canEdit);
  const formOpen = canEdit && !planOnly;
  const shownHosts = session.hosts?.length ? session.hosts : series.hosts;

  const problems = {
    activity: activityDay ? "" : "Pick the session that was held.",
    hosts: hosts.length ? "" : "Pick at least one host.",
    attendance: unmarked ? `Mark every patient present or absent (${unmarked} not marked).` : "",
    photos: photoCount < 1 ? "Add at least one photo of the session." : photoCount > maxPhotos ? `At most ${maxPhotos} photos.` : "",
  };
  const shownProblem = (key) => (tried ? problems[key] : "");
  const missing = Object.values(problems).filter(Boolean).length;

  const savedMarks = Object.fromEntries((session.attendance || []).map((a) => [idOf(a.patient), a.status]));
  const savedHosts = (session.hosts?.length ? session.hosts : series.hosts || []).map(idOf);
  const sameList = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
  const changed =
    !session.done ||
    activityDay !== session.activityDay ||
    !sameList(hosts, savedHosts) ||
    roster.some((m) => marks[String(m.patient._id)] !== savedMarks[String(m.patient._id)]) ||
    newPhotos.length > 0 ||
    removeIds.length > 0;
  const plannedHostsChanged = !sameList(hosts, (session.hosts?.length ? session.hosts : series.hosts || []).map(idOf));

  const fail = (err) => {
    if (!handleAuthError(err)) toast.error(errorMessage(err));
  };

  const save = async () => {
    setTried(true);
    if (missing) {
      toast.warn("Fill in every required field before saving");
      return;
    }
    setSaving(true);
    try {
      const res = await saveLectureSession(session._id, {
        activityDay,
        hosts,
        attendance: roster.map((m) => ({ patient: m.patient._id, status: marks[String(m.patient._id)] })),
        removePhotos: removeIds,
        updatedAt: session.updatedAt,
        photos: newPhotos.map((p) => p.file),
      });
      if (res?.data) onSessionChange(res.data);
      toast.success(res?.message || "Session saved");
      toggle();
    } catch (err) {
      fail(err);
    } finally {
      setSaving(false);
    }
  };

  const saveHosts = async () => {
    setTried(true);
    if (!hosts.length) return;
    setSaving(true);
    try {
      const res = await updateLectureSessionHosts(session._id, hosts);
      if (res?.data) onSessionChange(res.data);
      toast.success(res?.message || "Hosts saved");
      toggle();
    } catch (err) {
      fail(err);
    } finally {
      setSaving(false);
    }
  };

  const choosePhotos = (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";
    if (!picked.length) return;
    const room = maxPhotos - photoCount;
    const bad = picked.filter((f) => !PHOTO_TYPES.includes(f.type) || f.size > MAX_BYTES);
    if (bad.length) toast.warn(`${bad.length} file${bad.length > 1 ? "s" : ""} skipped: only jpg, png or webp up to 5 MB`);
    let files = picked.filter((f) => !bad.includes(f));
    if (files.length > room) {
      toast.warn(`Only ${room} more photo${room === 1 ? "" : "s"} can be added (limit ${maxPhotos})`);
      files = files.slice(0, room);
    }
    if (!files.length) return;
    setNewPhotos((list) => [
      ...list,
      ...files.map((file, i) => ({ key: `${Date.now()}-${i}-${file.name}`, file, url: previewUrl(file) })),
    ]);
  };

  const dropNewPhoto = (key) =>
    setNewPhotos((list) => {
      const p = list.find((x) => x.key === key);
      if (p) dropPreview(p.url);
      return list.filter((x) => x.key !== key);
    });

  const statusBadge = session.done ? (
    <Badge color="success">Done</Badge>
  ) : session.isFuture ? (
    <Badge color="light" className="text-muted">Upcoming</Badge>
  ) : (
    <Badge color="warning">Not done</Badge>
  );

  const hostsField = (
    <Field
      title={planOnly ? "Hosts for this day" : "Hosts"}
      required={hostsEditable}
      error={shownProblem("hosts")}
      testId="session-hosts"
      hint={hostsEditable ? `starts with the series' hosts (${hostNames(series.hosts)})` : undefined}
    >
      {hostsEditable ? (
        <HostSelect
          center={series.centerId || series.center?._id}
          value={hosts}
          onChange={setHosts}
          placeholder="Pick who hosted"
          inputId="session-hosts-input"
        />
      ) : (
        <>
          <span className="text-capitalize">{hostNames(shownHosts) || "—"}</span>
          {formOpen && <small className="text-muted d-block">Only the series' hosts can change who hosts.</small>}
        </>
      )}
    </Field>
  );

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="lg" scrollable centered>
      <ModalHeader toggle={toggle}>
        {session.seriesDay ? `Day ${session.seriesDay} · ` : ""}
        {formatDay(session.dateKey)} <span className="text-muted fw-normal">· {series.label}</span> {statusBadge}
      </ModalHeader>
      <ModalBody>
        {planOnly ? (
          <>
            <div className="alert alert-light border py-2">
              This session hasn't happened yet. It can be filled in on the day.
            </div>
            {hostsField}
          </>
        ) : (
          <>
            {!canEdit && (
              <div className="alert alert-light border py-2">
                {viewOnly
                  ? "You have view-only access to Therapy Lectures."
                  : session.canRun
                    ? "This series has closed, so this session can't be changed."
                    : "Only this session's hosts can fill it in."}
              </div>
            )}
            {formOpen && (
              <p className="text-muted small">
                Fill in every field marked <span className="text-danger">*</span>, then save.
              </p>
            )}

            <Field
              title="Session held"
              required={formOpen}
              error={shownProblem("activity")}
              testId="session-activity"
              hint={session.done && session.doneBy?.name ? `first saved by ${session.doneBy.name}` : undefined}
            >
              {formOpen ? (
                <>
                  <Select
                    aria-label="Session held"
                    options={options}
                    value={flatOptions.find((o) => o.value === activityDay) || null}
                    onChange={(o) => setActivityDay(o?.value || null)}
                    placeholder="Pick the session that was held"
                    classNamePrefix="select"
                    menuPortalTarget={document.body}
                    styles={{ menuPortal: (b) => ({ ...b, zIndex: 2000 }) }}
                  />
                  {!session.done && suggestedActivity && suggestedActivity === activityDay && (
                    <small className="text-muted">Suggested for day {session.seriesDay} of the series.</small>
                  )}
                  {savedOnOldList && (
                    <small className="text-muted d-block">
                      Saved earlier as {activityText(session.activity)}, from the old 45-activity list. Pick the session from the new list.
                    </small>
                  )}
                  {!session.done && !suggestedActivity && session.seriesDay > programmeDays && (
                    <small className="text-muted d-block">
                      The programme has {programmeDays} sessions; this series runs longer, so pick the one held.
                    </small>
                  )}
                </>
              ) : session.done ? (
                <div>
                  <div className="fw-medium">{activityText(session.activity)}</div>
                  <small className="text-muted">{activityWeekText(session.activity)}</small>
                </div>
              ) : (
                <span className="text-muted">Not filled in yet.</span>
              )}
            </Field>

            {hostsField}

            <Field
              title="Attendance"
              required={formOpen && roster.length > 0}
              error={shownProblem("attendance")}
              testId="session-attendance"
              hint={`${roster.length} patient${roster.length === 1 ? "" : "s"} in the series this day`}
            >
              {roster.length === 0 ? (
                <div className="text-muted small">No patients were in this series on this day.</div>
              ) : (
                <>
                  {formOpen && (
                    <div className="d-flex gap-2 mb-2">
                      <Button
                        size="sm"
                        color="light"
                        className="border"
                        onClick={() =>
                          setMarks((m) => ({ ...m, ...Object.fromEntries(roster.map((r) => [String(r.patient._id), "PRESENT"])) }))
                        }
                      >
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
                        <li
                          key={pid}
                          className={`list-group-item d-flex justify-content-between align-items-center py-2${tried && formOpen && !v ? " border-danger" : ""}`}
                          data-testid="attendance-row"
                        >
                          <div>
                            <span className="fw-medium text-capitalize">{m.patient.name}</span>
                            <small className="text-muted ms-2">{m.patient.uid}</small>
                          </div>
                          {formOpen ? (
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
                </>
              )}
            </Field>

            <Field
              title="Evidence"
              required={formOpen}
              error={shownProblem("photos")}
              testId="session-photos"
              hint={`${photoCount} of ${maxPhotos} photos`}
            >
              <div className="d-flex flex-wrap gap-2">
                {saved.map((p) => {
                  const removing = removeIds.includes(idOf(p));
                  return (
                    <Photo
                      key={p._id}
                      url={p.url}
                      alt={p.originalName || "Session photo"}
                      title={`Added by ${p.uploadedBy?.name || "a host"}`}
                      faded={removing}
                    >
                      {formOpen && canDeletePhotos && (
                        <button
                          type="button"
                          className={`btn btn-sm ${removing ? "btn-light border" : "btn-danger"} position-absolute top-0 end-0 m-1 px-1 py-0`}
                          aria-label={removing ? "Keep photo" : "Remove photo"}
                          title={removing ? "Keep this photo" : "Remove when saved"}
                          onClick={() =>
                            setRemoveIds((ids) => (removing ? ids.filter((x) => x !== idOf(p)) : [...ids, idOf(p)]))
                          }
                        >
                          <i className={`bx ${removing ? "bx-undo" : "bx-x"}`} />
                        </button>
                      )}
                    </Photo>
                  );
                })}
                {newPhotos.map((p) => (
                  <Photo key={p.key} url={p.url} alt={p.file.name} title={`${p.file.name} (not saved yet)`}>
                    <Badge color="info" className="position-absolute bottom-0 start-0 m-1">New</Badge>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 px-1 py-0"
                      aria-label="Remove new photo"
                      onClick={() => dropNewPhoto(p.key)}
                    >
                      <i className="bx bx-x" />
                    </button>
                  </Photo>
                ))}
                {formOpen && photoCount < maxPhotos && (
                  <button
                    type="button"
                    className={`btn btn-light border d-flex flex-column justify-content-center align-items-center${shownProblem("photos") ? " border-danger" : ""}`}
                    style={{ width: 110, height: 110 }}
                    disabled={saving}
                    onClick={() => fileInput.current?.click()}
                  >
                    <i className="bx bx-camera fs-3" />
                    <small>Add photos</small>
                  </button>
                )}
                {!formOpen && saved.length === 0 && <span className="text-muted small">No photos.</span>}
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
              {formOpen && <small className="text-muted d-block mt-1">jpg, png or webp, up to 5 MB each. Photos are uploaded when you save.</small>}
            </Field>
          </>
        )}
      </ModalBody>
      <ModalFooter>
        {formOpen && tried && missing > 0 && (
          <small className="text-danger me-auto">
            {missing} required field{missing === 1 ? "" : "s"} missing
          </small>
        )}
        <Button color="light" className="border" onClick={toggle} disabled={saving}>
          {formOpen || (planOnly && hostsEditable) ? "Cancel" : "Close"}
        </Button>
        {formOpen && (
          <Button color="primary" onClick={save} disabled={saving || !changed}>
            {saving ? (
              <>
                <Spinner size="sm" className="me-1" />
                {newPhotos.length ? "Uploading photos…" : "Saving…"}
              </>
            ) : session.done ? (
              "Save changes"
            ) : (
              "Save"
            )}
          </Button>
        )}
        {planOnly && hostsEditable && (
          <Button color="primary" onClick={saveHosts} disabled={saving || !plannedHostsChanged || (tried && !hosts.length)}>
            {saving ? <Spinner size="sm" /> : "Save"}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
};

export default SessionModal;
