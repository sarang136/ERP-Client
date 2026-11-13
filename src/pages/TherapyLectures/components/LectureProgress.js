import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Button, Table } from "reactstrap";
import { getLecturePatientProgress } from "../../../helpers/backend_helper";
import { useAuthError } from "../../../Components/Hooks/useAuthError";
import { LEAVE_TEXT, SERIES_DAYS, errorMessage, formatDate, formatDay } from "../helpers";

/**
 * Loads a patient's lecture progress (GET /therapy-lectures/patients/:id/progress).
 * Returns { data, loading, error }; nothing is fetched while `enabled` is false.
 */
export const usePatientLectureProgress = (patientId, enabled = true) => {
  const handleAuthError = useAuthError();
  const [state, setState] = useState({ data: null, loading: false, error: "" });

  useEffect(() => {
    if (!enabled || !patientId) return undefined;
    let live = true;
    setState({ data: null, loading: true, error: "" });
    getLecturePatientProgress(patientId)
      .then((res) => live && setState({ data: res?.data || null, loading: false, error: "" }))
      .catch((err) => {
        if (!live) return;
        setState({ data: null, loading: false, error: handleAuthError(err) ? "" : errorMessage(err) });
      });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, enabled]);

  return state;
};

const seriesName = (h, linkSeries) =>
  linkSeries && h.seriesId ? <Link to={`/therapy-lectures/${h.seriesId}`}>{h.series}</Link> : h.series;

const halfShort = (halfLabel) => (halfLabel ? halfLabel.replace(/^(first|second) half of /, (m, w) => `${w === "second" ? "2nd" : "1st"} half · `) : "—");

/**
 * A patient's lecture record: the series they're in now, their attendance, every
 * series they've been in, and the 45 activities with their attendance at each.
 * Shown in the series page's Progress window and on the patient page's tab.
 * `linkSeries` turns series names into links to the series page. The
 * activities list starts collapsed; the series data shows first.
 */
const LectureProgress = ({ data, linkSeries = false }) => {
  const [showActivities, setShowActivities] = useState(false);
  const current = data.currentSeries;
  let lastWeek = null;
  return (
    <>
      <div className="d-flex flex-wrap gap-4 mb-3">
        <div>
          <div className="small text-muted">Now in</div>
          <div className="fw-semibold" data-testid="lecture-current">
            {current ? (
              <>
                {linkSeries && current._id ? <Link to={`/therapy-lectures/${current._id}`}>{current.label}</Link> : current.label}
                {current.day ? <span className="text-muted fw-normal"> · Day {current.day} of {SERIES_DAYS}</span> : null}
                {!current.day && current.startKey ? (
                  <span className="text-muted fw-normal"> · starts {formatDate(current.startKey)}</span>
                ) : null}
              </>
            ) : (
              "Not in a series"
            )}
          </div>
          {current?.halfLabel && <div className="small text-muted">{halfShort(current.halfLabel)}</div>}
        </div>
        <div>
          <div className="small text-muted">Activities attended</div>
          <div className="fw-semibold">{data.attendedActivities} of {data.activities.length}</div>
        </div>
        <div>
          <div className="small text-muted">Sessions</div>
          <div className="fw-semibold">
            <span className="text-success">{data.presentCount} present</span> · <span className="text-danger">{data.absentCount} absent</span>
          </div>
        </div>
      </div>

      {data.history.length > 0 && (
        <>
          <h6 className="text-muted text-uppercase small fw-semibold mb-2">Series</h6>
          <Table size="sm" className="align-middle mb-4" responsive>
            <thead className="table-light">
              <tr>
                <th>Series</th>
                <th>Half</th>
                <th>In it</th>
                <th>Status</th>
                <th>Attendance</th>
              </tr>
            </thead>
            <tbody>
              {data.history.map((h) => (
                <tr key={h._id} data-testid="lecture-history-row">
                  <td>{seriesName(h, linkSeries)}</td>
                  <td className="small">{halfShort(h.halfLabel)}</td>
                  <td className="small">
                    {formatDate(h.joinedKey)} – {h.leftKey ? formatDate(h.leftKey) : "now"}
                  </td>
                  <td>
                    {h.active ? (
                      <Badge color="success">In it now</Badge>
                    ) : (
                      <Badge color={h.leftReason === "COMPLETED" ? "primary" : "secondary"}>
                        {LEAVE_TEXT[h.leftReason] || h.leftReason || "Left"}
                      </Badge>
                    )}
                  </td>
                  <td className="small">
                    {h.present != null ? (
                      <>
                        <span className="text-success">{h.present} present</span> · <span className="text-danger">{h.absent} absent</span>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}

      <Button
        color="link"
        className="p-0 mb-2 text-muted text-uppercase small fw-semibold text-decoration-none"
        aria-expanded={showActivities}
        onClick={() => setShowActivities((v) => !v)}
      >
        <i className={`bx ${showActivities ? "bx-chevron-down" : "bx-chevron-right"} me-1`} />
        Activities · {data.attendedActivities} of {data.activities.length} attended
      </Button>
      {showActivities && (
        <Table size="sm" className="align-middle mb-0" data-testid="lecture-activities">
          <thead className="table-light">
            <tr>
              <th style={{ width: 60 }}>No.</th>
              <th>Activity</th>
              <th>Attendance</th>
            </tr>
          </thead>
          <tbody>
            {data.activities.map((a) => {
              const header = a.week !== lastWeek;
              lastWeek = a.week;
              return (
                <React.Fragment key={a.day}>
                  {header && (
                    <tr className="table-light">
                      <td colSpan={3} className="small fw-semibold text-muted">{a.week} · {a.weekTheme}</td>
                    </tr>
                  )}
                  <tr>
                    <td>{a.day}</td>
                    <td>{a.topic}</td>
                    <td>
                      {a.records.length === 0 ? (
                        <span className="text-muted small">—</span>
                      ) : (
                        a.records.map((r, i) => (
                          <Badge key={i} color={r.status === "PRESENT" ? "success" : "danger"} className="me-1" title={r.series}>
                            {r.status === "PRESENT" ? "Present" : "Absent"} · {formatDay(r.dateKey)}
                          </Badge>
                        ))
                      )}
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </Table>
      )}
    </>
  );
};

export default LectureProgress;
