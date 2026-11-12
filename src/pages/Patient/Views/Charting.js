import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Alert, Button, Progress } from "reactstrap";
import { connect, useDispatch, useSelector } from "react-redux";
import {
  addClinicalNote,
  addGeneralClinicalNote,
  admitDischargePatient,
  fetchGeneralCharts,
  updateClinicalNote,
} from "../../../store/actions";
import ChartDate from "../Modals/ChartDate";
import ChartForm from "../ChartForm";

import RenderWhen from "../../../Components/Common/RenderWhen";
import {
  ADMIT_PATIENT,
  IPD,
  GENERAL,
  OPD,
  CLINIC_TEST,
  NOTES,
  ADMISSION_SUMMARY,
  BIO_DATA,
  CURRENT_MEDICINES,
} from "../../../Components/constants/patient";
import OPDView from "./OPD";
import CheckPermission from "../../../Components/HOC/CheckPermission";
import General from "./General";
import IPDComponent from "./IPD";
import ClinicalTest from "./ClinicalTest";
import Notes from "../../Nurse/Views/Notes";
import AdmissionSummary from "./AdmissionSummary";
import { usePermissions } from "../../../Components/Hooks/useRoles";
import BioData from "./BioData";
import CurrentMedicines from "./CurrentMedicines";

const Charting = ({
  patient,
  addmissionsCharts,
  charts,
  loading,
  chartSaving,
  generalLoading,
  pageAccess,
  view,
}) => {
  const dispatch = useDispatch();
  const isClinincalTab = useSelector(
    (state) => state.ClinicalTest.isClinincalTab,
  );
  const clinicalTestLoading = useSelector(
    (state) => state.ClinicalTest.isLoading,
  );
  const [tab, setTab] = useState(isClinincalTab ? CLINIC_TEST : IPD);
  const [dateModal, setDateModal] = useState(false);
  const [chartType, setChartType] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const prevLoading = useRef(false);

  useEffect(() => {
    if (prevLoading.current === true && chartSaving === false) {
      window.dispatchEvent(new Event("chartUpdated"));
    }
    prevLoading.current = chartSaving;
  }, [chartSaving]);
  const toggleModal = () => setDateModal(!dateModal);

  const token = JSON.parse(localStorage.getItem("micrologin"))?.token;

  const { hasPermission } = usePermissions(token);

  const hasRead = hasPermission("PATIENTS", "ADDMISSIONSUMMARY", "READ");
  const hasWrite = hasPermission("PATIENTS", "ADDMISSIONSUMMARY", "WRITE");
  const hasDelete = hasPermission("PATIENTS", "ADDMISSIONSUMMARY", "DELETE");
  const canAccessAdmissionSummary = hasRead || hasWrite || hasDelete;

  const handleAdmitPatient = () => {
    dispatch(admitDischargePatient({ data: null, isOpen: ADMIT_PATIENT }));
  };

  const [, setAddmissionId] = useState();

  const [open, setOpen] = useState(addmissionsCharts?.length > 0 ? "0" : null);
  const toggleAccordian = (id) => {
    if (open === id) {
      setOpen();
    } else {
      setOpen(id);
    }
  };

  // useEffect(() => {
  //   if (
  //     addmissionsCharts.length &&
  //     !addmissionsCharts.find((ch) => ch._id === addmissionId)
  //   ) {
  //     setOpen("0");
  //     setAddmissionId(addmissionsCharts[0]?._id);
  //   }

  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [view, patient, addmissionsCharts]);

  // useEffect(() => {
  //   setOpen(null);
  //   setAddmissionId(null);
  // }, [patient?._id]);

  // useEffect(() => {
  //   if (
  //     addmissionsCharts.length > 0 &&
  //     !addmissionsCharts.find((ch) => ch._id === addmissionId)
  //   ) {
  //     setOpen("0");
  //     setAddmissionId(addmissionsCharts[0]?._id);
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [addmissionsCharts]);

  useEffect(() => {
    if (!patient?._id) return;
    if (tab === GENERAL)
      dispatch(fetchGeneralCharts({ patient: patient._id, type: GENERAL }));
    if (tab === OPD)
      dispatch(fetchGeneralCharts({ patient: patient._id, type: OPD }));
    if (tab === CLINIC_TEST)
      dispatch(fetchGeneralCharts({ patient: patient._id, type: CLINIC_TEST }));
  }, [dispatch, tab, patient?._id]);

  // useEffect(() => {
  //   if (addmissionId && patient?.addmissions?.includes(addmissionId)) {
  //     const typeForAdmission = filterChartType[addmissionId] || "All";
  //     let cancelled = false;
  //     const fetchFresh = async () => {
  //       try {
  //         setIsFetchingCharts(true);
  //         dispatch({ type: "getCharts/pending" });
  //         const response = await getCharts({
  //           addmissionId,
  //           chartType: typeForAdmission,
  //           _t: Date.now(),
  //         });
  //         if (!cancelled) {
  //           dispatch({
  //             type: "getCharts/fulfilled",
  //             payload: { payload: response.payload, addmission: addmissionId },
  //           });
  //         }
  //       } catch (error) {
  //         if (!cancelled) {
  //           dispatch({ type: "getCharts/rejected" });
  //         }
  //       } finally {
  //         if (!cancelled) setIsFetchingCharts(false);
  //       }
  //     };
  //     fetchFresh();
  //     return () => {
  //       cancelled = true;
  //     };
  //   }
  // }, [dispatch, patient, addmissionId, filterChartType]);

  useEffect(() => {}, [tab, addmissionsCharts]);

  const onSubmitClinicalForm = (
    values,
    files,
    editChartData,
    editClinicalNote,
  ) => {
    const {
      author,
      patient,
      center,
      centerAddress,
      appointment,
      addmission,
      chart,
      type,
      date,
      complaints,
      observations,
      diagnosis,
      notes,
    } = values;
    const formData = new FormData();
    formData.append("author", author);
    formData.append("patient", patient);
    formData.append("center", center);
    formData.append("centerAddress", centerAddress);
    formData.append("addmission", addmission);
    if (appointment) formData.append("appointment", appointment);
    formData.append("chart", chart);
    formData.append("type", type);
    formData.append("date", date);
    formData.append("complaints", complaints);
    formData.append("observations", observations);
    formData.append("diagnosis", diagnosis);
    formData.append("notes", notes);
    files.forEach((file) => {
      if (file?.file) {
        // FilePond wrapper object
        formData.append("file", file.file);
      } else {
        // Plain File (like from AudioRecorder)
        formData.append("file", file);
      }
    });
    // files.forEach((file) => formData.append("file", file.file));

    const config = {
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total,
        );
        setUploadProgress(percentCompleted);
      },
    };

    if (editClinicalNote) {
      formData.append("id", editChartData._id);
      formData.append("chartId", editClinicalNote._id);
      dispatch(updateClinicalNote({ data: formData, config })).finally(() =>
        setUploadProgress(0),
      );
    } else if (chartType === "GENERAL") {
      dispatch(addGeneralClinicalNote(values));
    } else {
      dispatch(addClinicalNote({ data: formData, config })).finally(() =>
        setUploadProgress(0),
      );
    }
  };

  const ipdComponent = useMemo(() => {
    return (
      tab === IPD && (
        <IPDComponent
          patient={patient}
          toggleModal={toggleModal}
          setChartType={setChartType}
        />
      )
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, patient]);

  // addmissionsCharts (state.Chart.data) is a shared, upsert-merged slice that
  // now accumulates admissions across every patient visited this session —
  // nothing ever clears it on patient switch. Consumers that pick addmissionsCharts[0]
  // directly (General/AdmissionSummary/BioData below) would silently pick up a
  // stale admission belonging to a previously-viewed patient once more than one
  // patient has been viewed. Scoping + sorting here (newest first, matching the
  // backend's own addmissionDate: -1 order) keeps those consumers correct
  // without needing to change each of them individually.
  const addmissionsKey = patient?.addmissions?.join(",") ?? "";
  const currentPatientAddmissionsCharts = useMemo(() => {
    if (!patient?.addmissions?.length) return [];
    const idSet = new Set(patient.addmissions);
    return addmissionsCharts
      .filter((a) => idSet.has(a._id))
      .sort((a, b) => new Date(b.addmissionDate) - new Date(a.addmissionDate));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addmissionsCharts, addmissionsKey]);

  const clinicalTestComponent = useMemo(() => {
    return (
      tab === CLINIC_TEST && (
        <ClinicalTest
          addmissionsCharts={addmissionsCharts}
          open={open}
          patient={patient}
          loading={clinicalTestLoading}
          toggleModal={toggleModal}
          setChartType={setChartType}
          toggleAccordian={toggleAccordian}
          setAddmissionId={setAddmissionId}
        />
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addmissionsCharts, tab, clinicalTestLoading, open, patient]);

  const generalComponent = useMemo(() => {
    return (
      <General
        generalLoading={generalLoading}
        toggleModal={toggleModal}
        charts={charts}
        currentAddmissionId={currentPatientAddmissionsCharts?.[0]?._id}
        isPatientDischarged={
          !!currentPatientAddmissionsCharts?.[0]?.dischargeDate
        }
      />
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [charts, generalLoading, currentPatientAddmissionsCharts]);

  return (
    <div className="mt-3">
      <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
        <ul className="nav nav-tabs border-0 gap-">
          {pageAccess
            ?.find((pg) => pg.name === "Patient")
            ?.subAccess?.find((s) => s.name === "OPD") && (
            <li className="nav-item">
              <button
                onClick={() => setTab(OPD)}
                className={`nav-link rounded-0 ${
                  tab === OPD
                    ? "border-0 border-2 border-top border-primary"
                    : "active"
                }`}
                aria-current="page"
              >
                OPD
              </button>
            </li>
          )}

          <li className="nav-item rounded-0">
            <button
              onClick={() => setTab(IPD)}
              className={`nav-link rounded-0 ${
                tab === IPD
                  ? "border-0 border-2 border-top border-primary"
                  : "active"
              }`}
            >
              IPD
            </button>
          </li>
          <li className="nav-item rounded-0">
            <button
              onClick={() => setTab(CLINIC_TEST)}
              className={`nav-link rounded-0 ${
                tab === CLINIC_TEST
                  ? "border-0 border-2 border-top border-primary"
                  : "active"
              }`}
            >
              Clinical Test
            </button>
          </li>
          <li className="nav-item rounded-0">
            <button
              onClick={() => setTab(GENERAL)}
              className={`nav-link rounded-0 ${
                tab === GENERAL
                  ? "border-0 border-2 border-top border-primary"
                  : "active"
              }`}
            >
              History
            </button>
          </li>
          <li className="nav-item rounded-0">
            <button
              onClick={() => setTab(CURRENT_MEDICINES)}
              className={`nav-link rounded-0 ${
                tab === CURRENT_MEDICINES
                  ? "border-0 border-2 border-top border-primary"
                  : "active"
              }`}
            >
              Current Medicines
            </button>
          </li>
          <li className="nav-item rounded-0">
            <button
              onClick={() => setTab(NOTES)}
              className={`nav-link rounded-0 ${
                tab === NOTES
                  ? "border-0 border-2 border-top border-primary"
                  : "active"
              }`}
            >
              Notes
            </button>
          </li>

          {canAccessAdmissionSummary && (
            <li className="nav-item rounded-0">
              <button
                onClick={() => setTab(ADMISSION_SUMMARY)}
                className={`nav-link rounded-0 ${
                  tab === ADMISSION_SUMMARY
                    ? "border-0 border-2 border-top border-primary"
                    : "active"
                }`}
              >
                Summary
              </button>
            </li>
          )}
          <li className="nav-item rounded-0">
            <button
              onClick={() => setTab(BIO_DATA)}
              className={`nav-link rounded-0 ${
                tab === BIO_DATA
                  ? "border-0 border-2 border-top border-primary"
                  : "active"
              }`}
            >
              Bio-data
            </button>
          </li>
        </ul>
      </div>
      {uploadProgress > 0 && (
        <div className="mb-3 px-3">
          <div className="d-flex justify-content-between mb-1">
            <span className="text-muted fw-medium">Uploading Files...</span>
            <span className="text-primary fw-bold">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} color="primary" striped animated />
        </div>
      )}
      <div className="mb-2">
        <CheckPermission permission={"create"} subAccess={"Charting"}>
          <RenderWhen isTrue={tab === OPD && !patient.isAdmit}>
            <Button
              onClick={() => {
                toggleModal();
                setChartType("GENERAL");
              }}
              size="sm"
            >
              Create new Chart
            </Button>
          </RenderWhen>

          <RenderWhen isTrue={patient?.isAdmit && tab === OPD}>
            <Alert
              className="mt-3 justify-content-center py-1 d-flex align-items-center"
              color="warning"
            >
              <i className="ri-alert-line label-icon fs-5 me-3"></i>
              Please discharge patient to add notes in OPD!
            </Alert>
          </RenderWhen>

          <RenderWhen isTrue={!patient?.isAdmit && tab === IPD}>
            <Button className="ms-2" onClick={handleAdmitPatient} size="sm">
              Admit Patient
            </Button>
            <Alert
              className="mt-3 justify-content-center py-1 d-flex align-items-center"
              color="warning"
            >
              <i className="ri-alert-line label-icon fs-5 me-3"></i>
              Please admit patient in order to create charts!
            </Alert>
          </RenderWhen>
        </CheckPermission>
      </div>
      {tab === NOTES ? (
        <Notes />
      ) : tab === GENERAL ? (
        generalComponent
      ) : tab === OPD ? (
        <OPDView charts={charts} toggleModal={toggleModal} />
      ) : tab === CLINIC_TEST ? (
        clinicalTestComponent
      ) : tab === ADMISSION_SUMMARY ? (
        <AdmissionSummary
          patient={patient._id}
          patientProfile={patient}
          addmission={
            currentPatientAddmissionsCharts?.[0]?._id ||
            patient?.addmission?._id
          }
        />
      ) : tab === BIO_DATA ? (
        <BioData
          patient={patient}
          addmission={currentPatientAddmissionsCharts}
        />
      ) : tab === CURRENT_MEDICINES ? (
        <CurrentMedicines patient={patient} />
      ) : (
        ""
      )}
      {ipdComponent}

      <ChartDate type={chartType} isOpen={dateModal} toggle={toggleModal} />
      <ChartForm type={chartType} onSubmitClinicalForm={onSubmitClinicalForm} />
    </div>
  );
};

Charting.propTypes = {
  patient: PropTypes.object,
  addmissionsCharts: PropTypes.array,
  loading: PropTypes.bool,
};

const mapStateToProps = (state) => ({
  patient: state.Patient.patient,
  addmissionsCharts: state.Chart.data,
  loading: state.Chart.chartLoading,
  chartSaving: state.Chart.loading,
  generalLoading: state.Chart.generalChartLoading,
  charts: state.Chart.charts,
});

export default connect(mapStateToProps)(Charting);
