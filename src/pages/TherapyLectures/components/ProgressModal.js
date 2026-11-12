import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Badge, Button, Modal, ModalBody, ModalFooter, ModalHeader, Spinner, Table } from "reactstrap";
import { getLecturePatientProgress } from "../../../helpers/backend_helper";
import { useAuthError } from "../../../Components/Hooks/useAuthError";
import { LEAVE_TEXT, errorMessage, formatDate, formatDay } from "../helpers";

// A patient's attendance across the 45 activities, and the series they've been in.
const ProgressModal = ({ isOpen, toggle, patient }) => {
  const handleAuthError = useAuthError();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !patient?._id) return undefined;
    let live = true;
    setData(null);
    setLoading(true);
    getLecturePatientProgress(patient._id)
      .then((res) => live && setData(res?.data || null))
      .catch((err) => live && !handleAuthError(err) && toast.error(errorMessage(err)))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, patient?._id]);

  let lastWeek = null;
  return (
    <Modal isOpen={isOpen} toggle={toggle} size="lg" scrollable centered>
      <ModalHeader toggle={toggle}>
        <span className="text-capitalize">{patient?.name}</span> <small className="text-muted">{patient?.uid}</small>
      </ModalHeader>
      <ModalBody>
        {loading && <Spinner color="primary" />}
        {data && (
          <>
            <div className="d-flex flex-wrap gap-4 mb-3">
              <div>
                <div className="small text-muted">Now in</div>
                <div className="fw-semibold">
                  {data.currentSeries ? (
                    <>
                      {data.currentSeries.label}
                      {data.currentSeries.day ? <span className="text-muted fw-normal"> · Day {data.currentSeries.day}</span> : null}
                    </>
                  ) : (
                    "Not in a series"
                  )}
                </div>
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
              <div>
                <div className="small text-muted">Series</div>
                <div className="small">
                  {data.history.map((h) => (
                    <div key={h._id}>
                      {h.series}: {formatDate(h.joinedKey)} – {h.leftKey ? formatDate(h.leftKey) : "now"}
                      {h.leftReason && <span className="text-muted"> ({LEAVE_TEXT[h.leftReason] || h.leftReason})</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Table size="sm" className="align-middle mb-0">
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
          </>
        )}
      </ModalBody>
      <ModalFooter>
        <Button color="light" className="border" onClick={toggle}>Close</Button>
      </ModalFooter>
    </Modal>
  );
};

export default ProgressModal;
