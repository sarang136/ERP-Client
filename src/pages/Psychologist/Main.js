import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Button, Col, Row, Spinner } from "reactstrap";
import { connect, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import PsychBar from "./Views/Components/PsychBar";
import PatientCard from "./Views/Components/PatientCard";
import { getAllPatients, patchPatientNoteDate } from "../../store/features/psychologist/psychologistSlice";
import { setPatient } from "../../store/features/patient/patientSlice";
import { IPD, COUNSELLING_NOTE } from "../../Components/constants/patient";
import ChartDate from "../Patient/Modals/ChartDate";
import ChartForm from "../Patient/ChartForm";
import PatientAlertsModal from "./Views/Components/PatientAlertsModal";
import { useAuthError } from "../../Components/Hooks/useAuthError";
import { usePermissions } from "../../Components/Hooks/useRoles";

const Main = ({ loading, data, centerAccess }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleAuthError = useAuthError();

  const microUser = localStorage.getItem("micrologin");
  const token = microUser ? JSON.parse(microUser).token : null;
  const { hasPermission, loading: permissionLoader } = usePermissions(token);
  const hasUserPermission = hasPermission("PSYCHOLOGIST_DASHBOARD", null, "READ");
  const hasWritePermission = hasPermission("PSYCHOLOGIST_DASHBOARD", null, "WRITE");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [flag, setFlag] = useState("");
  const [scope, setScope] = useState("MY");
  const [refreshToken, setRefreshToken] = useState(0);
  const forceRefreshRef = useRef(false);
  
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [activeChartType, setActiveChartType] = useState(COUNSELLING_NOTE);
  const [activePatientId, setActivePatientId] = useState(null);
  const [chartReady, setChartReady] = useState(false);
  const [alertsModalPatient, setAlertsModalPatient] = useState(null);
  const limit = 12;

  document.title = "Psychologist Dashboard";

  const handleNoteSaved = () => {
    if (!activePatientId) return;
    dispatch(
      patchPatientNoteDate({
        patientId: activePatientId,
        field:
          activeChartType === COUNSELLING_NOTE
            ? "lastCounsellingNoteDate"
            : "lastClinicalNoteDate",
        date: new Date().toISOString(),
      }),
    );
  };

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, flag, scope]);

  useEffect(() => {
    if (!permissionLoader && !hasUserPermission) {
      navigate("/unauthorized");
    }
  }, [permissionLoader, hasUserPermission, navigate]);

  useEffect(() => {
    if (!hasUserPermission) return;
    if (!centerAccess || centerAccess.length === 0) return;
    const forceRefresh = forceRefreshRef.current;
    forceRefreshRef.current = false;

    const fetchPatients = async () => {
      try {
        await dispatch(
          getAllPatients({
            page,
            limit,
            search: debouncedSearch,
            patientType: flag,
            scope,
            centerAccess,
            forceRefresh,
          }),
        ).unwrap();
      } catch (error) {
        if (!handleAuthError(error)) {
          toast.error(error?.message || "Couldn't load patients.");
        }
      }
    };
    fetchPatients();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, page, limit, debouncedSearch, flag, scope, centerAccess, refreshToken, hasUserPermission]);

  const handleRefresh = () => {
    forceRefreshRef.current = true;
    setRefreshToken((t) => t + 1);
  };

  const handlePrev = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNext = () => {
    if (page < data.pagination?.totalPages) setPage(page + 1);
  };

  const handleStartChart = (patient, chartType) => {
    dispatch(
      setPatient({
        _id: patient._id,
        name: patient.name,
        isAdmit: true,
        center: patient.center,
        addmission: { _id: patient.admissionId },
      }),
    );
    setActiveChartType(chartType);
    setActivePatientId(patient._id);
    setChartReady(true);
    setDateModalOpen(true);
  };

  return (
    <div style={{ background: "#fff", minHeight: "100vh", padding: "1.5rem" }}>
      <PsychBar
        search={search}
        setSearch={setSearch}
        flag={flag}
        setFlag={setFlag}
        scope={scope}
        setScope={setScope}
        onRefresh={handleRefresh}
      />

      {centerAccess?.length === 0 ? (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "50vh", fontSize: "1.2rem", color: "#555" }}
        >
          No centers selected.
        </div>
      ) : loading ? (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "50vh" }}
        >
          <Spinner color="primary" />
        </div>
      ) : data.data && data.data.length > 0 ? (
        <Row className="g-3 mt-1">
          {data.data.map((patient) => (
            <Col xl={4} lg={4} md={6} sm={12} xs={12} key={patient._id}>
              <PatientCard
                patient={patient}
                onStartChart={handleStartChart}
                onViewAlerts={setAlertsModalPatient}
                canWrite={hasWritePermission}
              />
            </Col>
          ))}
        </Row>
      ) : (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "50vh", fontSize: "1.2rem", color: "#555" }}
        >
          No patients found.
        </div>
      )}

      {!loading && data.pagination?.totalPages > 1 && (
        <Row className="mt-4 justify-content-center align-items-center">
          <Col xs="auto" className="d-flex justify-content-center">
            <Button color="secondary" disabled={page === 1} onClick={handlePrev}>
              ← Previous
            </Button>
          </Col>
          <Col xs="auto" className="text-center text-muted mx-3">
            Showing {(page - 1) * limit + 1}–
            {Math.min(page * limit, data.pagination?.totalDocs || 0)} of{" "}
            {data.pagination?.totalDocs || 0}
          </Col>
          <Col xs="auto" className="d-flex justify-content-center">
            <Button
              color="secondary"
              disabled={page === data.pagination?.totalPages}
              onClick={handleNext}
            >
              Next →
            </Button>
          </Col>
        </Row>
      )}

      {chartReady && (
        <>
          <ChartDate
            type={IPD}
            fixedChart={activeChartType}
            isOpen={dateModalOpen}
            toggle={() => setDateModalOpen(false)}
          />
          <ChartForm
            type={IPD}
            onNoteSaved={handleNoteSaved}
          />
        </>
      )}

      <PatientAlertsModal
        isOpen={!!alertsModalPatient}
        toggle={() => setAlertsModalPatient(null)}
        patientId={alertsModalPatient?._id}
        patientName={alertsModalPatient?.name}
      />
    </div>
  );
};

Main.propTypes = {
  loading: PropTypes.bool,
  data: PropTypes.object,
  centerAccess: PropTypes.array,
};

const mapStateToProps = (state) => ({
  loading: state.Psychologist.loading,
  data: state.Psychologist.data,
  centerAccess: state.User?.centerAccess,
});

export default connect(mapStateToProps)(Main);
