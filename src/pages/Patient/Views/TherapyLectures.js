import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { Spinner } from "reactstrap";
import LectureProgress, { usePatientLectureProgress } from "../../TherapyLectures/components/LectureProgress";

// Patient page → "Therapy Lectures" tab: the patient's lecture series (now and
// before), their attendance in each, and the 45 activities with their
// attendance. Read-only; patients are added and moved on the Therapy Lectures
// page. Shown to users with READ on the THERAPY_LECTURES role module (Views/index.js).
const TherapyLectures = ({ patient }) => {
  const { data, loading, error } = usePatientLectureProgress(patient?._id);
  const centreId = patient?.center?._id || patient?.center;

  return (
    <div className="mt-3" data-testid="patient-therapy-lectures">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h5 className="mb-0">Therapy Lectures</h5>
          <small className="text-muted">45-Day De-addiction Lecture Programme</small>
        </div>
        <Link to={`/therapy-lectures${centreId ? `?centre=${centreId}` : ""}`} className="small">
          Open Therapy Lectures <i className="bx bx-right-arrow-alt" />
        </Link>
      </div>
      {loading && <Spinner color="primary" size="sm" />}
      {error && <div className="alert alert-danger py-2">{error}</div>}
      {data && data.history.length === 0 && (
        <div className="text-center text-muted border rounded py-5">
          This patient hasn't been in a lecture series yet. Patients are added to a series on the Therapy Lectures page.
        </div>
      )}
      {data && data.history.length > 0 && <LectureProgress data={data} linkSeries />}
    </div>
  );
};

const mapStateToProps = (state) => ({ patient: state.Patient.patient });

export default connect(mapStateToProps)(TherapyLectures);
