import { useMemo, useState } from "react";
import { Row, Col } from "reactstrap";
import { useDispatch } from "react-redux";
import PsychBar from "./Views/Components/PsychBar";
import PatientCard from "./Views/Components/PatientCard";
import { mockPatients } from "./mockPatients";
import { setPatient } from "../../store/features/patient/patientSlice";
import { IPD, COUNSELLING_NOTE } from "../../Components/constants/patient";
import ChartDate from "../Patient/Modals/ChartDate";
import ChartForm from "../Patient/ChartForm";

const Main = () => {
  const dispatch = useDispatch();
  const [search, setSearch] = useState("");
  const [flag, setFlag] = useState("");
  const [scope, setScope] = useState("MY");
  const [dateModalOpen, setDateModalOpen] = useState(false);
  // ChartDate assumes a patient is already loaded into Patient state (true on
  // the real patient page, which only ever mounts it after fetching one) and
  // reads patient.center unconditionally. It must stay unmounted here until
  // the first "Start Counselling Note" click has loaded one, or it crashes
  // on the dashboard's initial render while Patient state is still empty.
  const [chartReady, setChartReady] = useState(false);

  document.title = "Psychologist | Your App Name";

  const patients = useMemo(() => {
    const q = search.trim().toLowerCase();
    return mockPatients.filter((p) => {
      if (scope === "MY" && !p.mine) return false;
      if (flag && p.nextSessionDue !== flag) return false;
      if (q && !p.name.toLowerCase().includes(q) && !p.uid.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, flag, scope]);

  // Same entry point as "Create new Chart" on the patient page: load the
  // patient into Patient state so ChartDate/ChartForm (both read from redux)
  // behave exactly as they do there, then open the date picker.
  const handleStartNote = (patient) => {
    dispatch(
      setPatient({
        _id: patient._id,
        name: patient.name,
        isAdmit: true,
        center: { _id: patient.centerId || "mock-center", title: "Main Centre" },
      })
    );
    setChartReady(true);
    setDateModalOpen(true);
  };

  return (
    <div>
      <PsychBar
        search={search}
        setSearch={setSearch}
        flag={flag}
        setFlag={setFlag}
        scope={scope}
        setScope={setScope}
      />

      {patients.length > 0 ? (
        <Row className="g-3 mt-1">
          {patients.map((patient) => (
            <Col xl={3} lg={4} md={6} sm={6} xs={12} key={patient._id}>
              <PatientCard patient={patient} onStartNote={handleStartNote} />
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

      {chartReady && (
        <>
          <ChartDate
            type={IPD}
            fixedChart={COUNSELLING_NOTE}
            isOpen={dateModalOpen}
            toggle={() => setDateModalOpen(false)}
          />
          <ChartForm type={IPD} onSubmitClinicalForm={() => {}} />
        </>
      )}
    </div>
  );
};

export default Main;
