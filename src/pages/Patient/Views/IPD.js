import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Accordion,
  AccordionBody,
  AccordionItem,
  Input,
  Label,
  Row,
  UncontrolledTooltip,
} from "reactstrap";
import AddmissionCard from "./Components/AddmissionCard";
import CheckPermission from "../../../Components/HOC/CheckPermission";
import RenderWhen from "../../../Components/Common/RenderWhen";
import { Button } from "reactstrap";
import { connect, useDispatch, useSelector } from "react-redux";
import Placeholder from "./Components/Placeholder";
import Charts from "../Charts";
import {
  admitDischargePatient,
  togglePrint,
  fetchChartsAddmissions,
  fetchCharts,
} from "../../../store/actions";
import {
  EDIT_ADMISSION,
  IPD,
  records,
  PRESCRIPTION,
  COUNSELLING_NOTE,
  DETAIL_ADMISSION,
  VITAL_SIGN,
} from "../../../Components/constants/patient";
import { toast } from "react-toastify";
import { assignEmergencyPatientType } from "../../../store/features/patient/patientSlice";
import {
  setAdmissionRamsayApplicable,
  setAdmissionMorseApplicable,
  setAdmissionPsychologicalTestStatus,
  setAdmissionPatientAdmissionType,
} from "../../../store/features/chart/chartSlice";
import SetAdmissionTypeModal from "./Components/SetAdmissionTypeModal";
import ClearAdmissionTypeModal from "./Components/ClearAdmissionTypeModal";
import PatientAdmissionTypeControl from "./Components/PatientAdmissionTypeControl";
import BaselinePackageControl from "./Components/BaselinePackageControl";
import BaselinePackageStatusModal from "./Components/BaselinePackageStatusModal";
import PsychologicalTestsControl from "./Components/PsychologicalTestsControl";
import PsychologicalTestsStatusModal from "./Components/PsychologicalTestsStatusModal";
import { usePermissions } from "../../../Components/Hooks/useRoles";
import { capitalizeWords } from "../../../utils/toCapitalize";

// Who may record an admission type directly.
//
// Matched against the RolesManagement access-role NAME, not `user.role` — there
// is no "IT" in the user role enum (authRoles.js), so `user.role` could never
// carry it. These are the three IT roles that exist in RolesManagement; listed
// explicitly, and compared exactly, so a new role can't slip in by accident.
// Add here when a new IT role is created.
//
// (Note "New_limited" also contains the letters "it" — a substring match would
// have wrongly included it. Exact names avoid that class of mistake entirely.)
const ADMISSION_TYPE_ALLOWED_ROLES = ["IT", "IT-ADMIN", "IT-MIS"];
const ADMISSION_TYPE_ALLOWED_EMAILS = ["vikas@jagrutirehab.org", "owais@gmail.com", "pratikymane@gmail.com"];

// Who may correct a type that is already recorded: replace it (Set Admission
// Type stays visible) or clear the history back to empty. Must match
// ADMISSION_TYPE_OVERRIDE_EMAILS in the server's
// src/constants/admissionTypeOverride.js, which enforces it.
const ADMISSION_TYPE_OVERRIDE_EMAILS = ["pratikymane@gmail.com"];

const IPDComponent = ({ patient, toggleModal, setChartType, user }) => {
  const dispatch = useDispatch();
  const chartData = useSelector((state) => state.Chart.data);
  const chartLoading = useSelector((state) => state.Chart.chartLoading);
  const chartsStale = useSelector((state) => state.Chart.chartsStale);
  const [open, setOpen] = useState(null);
  const [filterChartType, setFilterChartType] = useState({});
  const [admissionsSettled, setAdmissionsSettled] = useState(false);
  // Admission id whose "Set Admission Type" dialog is open, or null. Keyed by id
  // rather than a boolean because the page renders one card per admission.
  const [admissionTypeFor, setAdmissionTypeFor] = useState(null);
  // Admission id whose "Clear Admission Type" confirm is open, or null.
  const [clearAdmissionTypeFor, setClearAdmissionTypeFor] = useState(null);
  // { admissionId, nextStatus } for the open baseline-package confirm dialog, or
  // null. Keyed by admission id for the same reason as admissionTypeFor, and
  // carries the target status because one modal serves all three transitions.
  const [baselineTarget, setBaselineTarget] = useState(null);
  // { admissionId, nextStatus } for the open psychological-tests dialog, or
  // null — the same shape as baselineTarget, for the same reasons.
  const [psychTestTarget, setPsychTestTarget] = useState(null);
  const latestPatientIdRef = useRef();

  // `user.accessroles` is a bare ObjectId on the user document, so the role NAME
  // has to be resolved through this hook (it caches module-level, so no repeat
  // request). Same shape as pages/Nurse/Main.js and the HRMS role checks.
  const microUser = localStorage.getItem("micrologin");
  const permissionToken = microUser ? JSON.parse(microUser).token : null;
  const { roles: accessRole, loading: permissionLoader } =
    usePermissions(permissionToken);

  // Fails closed: while the roles fetch is in flight the button stays hidden
  // rather than flashing up for someone who may not be allowed to use it.
  const canSetAdmissionType =
    (!permissionLoader &&
      ADMISSION_TYPE_ALLOWED_ROLES.includes(accessRole?.name)) ||
    ADMISSION_TYPE_ALLOWED_EMAILS.includes(user?.email);

  const canOverrideAdmissionType = ADMISSION_TYPE_OVERRIDE_EMAILS.includes(
    String(user?.email || "").trim().toLowerCase(),
  );

  // `state.Chart.data` is a shared slice — other screens (ChartDate modal,
  // AI socket refreshes, Wrapper validation) also read/write it for
  // admissions unrelated to this patient. Deriving the displayed list from
  // patient.addmissions (rather than trusting whatever fetch resolved last)
  // keeps this view correct even if those other flows race with ours.
  const addmissionsKey = patient?.addmissions?.join(",") ?? "";
  const admissions = useMemo(() => {
    if (!patient?.addmissions?.length) return [];
    const idSet = new Set(patient.addmissions);
    // Sorted newest-first to match the backend's own order (patientChartAddmission.js
    // sorts by addmissionDate: -1) — patient.addmissions itself is oldest-first insertion
    // order, so mapping display order off it directly showed the latest admission last.
    return chartData
      .filter((a) => idSet.has(a._id))
      .sort((a, b) => new Date(b.addmissionDate) - new Date(a.addmissionDate));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartData, addmissionsKey]);

  // Not admissions.length < patient.addmissions.length — that comparison
  // never resolves if patient.addmissions contains a stale/orphaned id with
  // no matching Addmission document (a real data issue, seen on at least one
  // patient), leaving the placeholder stuck forever. Loading instead tracks
  // whether the fetch for the current patient has settled at all, regardless
  // of whether every requested id actually came back.
  const loading = !!patient?.addmissions?.length && !admissionsSettled;

  const toggleAccordian = (id) => {
    if (open === id) {
      setOpen(null);
    } else {
      setOpen(id);
    }
  };

  const handlePatientTypeChange = async (patientId, patientType) => {
    try {
      await dispatch(
        assignEmergencyPatientType({ patientId, patientType }),
      ).unwrap();
      toast.success("Category assigned successfully");
    } catch (error) {
      toast.warn(error.message);
    }
  };

  // Takes the admission id, not the patient id: a patient can have several
  // admissions rendered here, and this flag belongs to one of them.
  // The thunk rejects with a string and has already shown the server's message,
  // so there's nothing to add on failure.
  const handlePatientAdmissionTypeChange = async (admissionId, value) => {
    try {
      const res = await dispatch(
        setAdmissionPatientAdmissionType({
          admissionId,
          patientAdmissionType: value,
        }),
      ).unwrap();
      toast.success(res?.message || "Patient type updated");
    } catch {
      // shown via setAlert
    }
  };

  // Same as Ramsay, for the Morse Fall Risk protocol. The thunk rejects with a
  // string after showing the server's message, so there's nothing to add here.
  const handleMorseApplicableChange = async (admissionId, isApplicable) => {
    try {
      await dispatch(
        setAdmissionMorseApplicable({
          admissionId,
          isMorseApplicable: isApplicable,
        }),
      ).unwrap();
      toast.success(
        `Morse marked as ${isApplicable ? "applicable" : "not applicable"}`,
      );
    } catch {
      // shown via setAlert
    }
  };

  const handleRamsayApplicableChange = async (admissionId, isApplicable) => {
    try {
      await dispatch(
        setAdmissionRamsayApplicable({
          admissionId,
          isRamsayApplicable: isApplicable,
        }),
      ).unwrap();
      toast.success(
        `Ramsay marked as ${isApplicable ? "applicable" : "not applicable"}`,
      );
    } catch (error) {
      toast.warn(error.message);
    }
  };

  // Resolves true/false and never rejects, so the dialog can stay open on
  // failure. Don't read error.message here: the thunk rejects with a
  // STRING (so .unwrap() throws a string) and has already shown the server's
  // message via setAlert.
  const handlePsychTestStatusChange = async (admissionId, body) => {
    try {
      const res = await dispatch(
        setAdmissionPsychologicalTestStatus({ admissionId, ...body }),
      ).unwrap();
      toast.success(res?.message || "Psychological tests updated");
      return true;
    } catch {
      return false;
    }
  };

  // Fetch admissions via Redux (state.Chart.data) instead of a direct API call.
  useEffect(() => {
    latestPatientIdRef.current = patient?._id;
    setOpen(null);
    setAdmissionsSettled(false);
    if (!patient?.addmissions?.length) {
      setAdmissionsSettled(true);
      return;
    }
    const requestedPatientId = patient._id;
    dispatch(fetchChartsAddmissions(patient.addmissions))
      .unwrap()
      .then((res) => {
        // Ignore if the patient has since changed — avoids re-opening the
        // wrong patient's first accordion off a late-resolving stale request.
        if (latestPatientIdRef.current === requestedPatientId) setOpen("0");
      })
      .catch((error) => {
      })
      .finally(() => {
        // Settled regardless of outcome — some ids in patient.addmissions can
        // be stale/orphaned references with no matching document (seen in
        // production data), so an exact-count match can never be guaranteed.
        if (latestPatientIdRef.current === requestedPatientId)
          setAdmissionsSettled(true);
      });
    // patient?.addmissions?.length is included because `patient` first loads
    // without admissions populated (before fetchPatientById resolves); relying
    // on patient?._id alone misses the follow-up render where admissions appear.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, patient?._id, patient?.addmissions?.length]);

  // No "chartUpdated" event bridge needed here (unlike the old local-state
  // version): every save/edit thunk in chartSlice.js already writes the new
  // chart straight into state.data[...].charts in its own fulfilled reducer,
  // so this Redux-connected view re-renders on its own the moment a save
  // completes. Re-dispatching fetchChartsAddmissions off that same window
  // event caused an infinite loop, because fetchChartsAddmissions toggles
  // state.Chart.loading — the exact flag Charting.js watches to decide a
  // save just finished and fire the event again.

  // Fetch charts when accordion opens
  useEffect(() => {
    if (open === null) return;
    const admission = admissions[parseInt(open)];
    if (!admission) return;

    if (admission.charts && !chartsStale) return;
    const chartType = filterChartType[admission._id] || "All";
    dispatch(
      fetchCharts({ addmissionId: admission._id, chartType, _t: Date.now() }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, open, admissions, chartsStale]);

  // Refetch charts when filter changes
  useEffect(() => {
    if (open === null) return;
    const admission = admissions[parseInt(open)];
    if (!admission) return;
    const chartType = filterChartType[admission._id] || "All";
    dispatch(
      fetchCharts({ addmissionId: admission._id, chartType, _t: Date.now() }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterChartType]);

  if (loading) return <Placeholder />;

  return (
    <React.Fragment>
      <div className="">
        <Row className="timeline-right row-gap-5">
          {(admissions || []).map((addmission, idx) => (
            <AddmissionCard
              key={idx}
              id={idx}
              data={addmission}
              toggleModal={toggleModal}
            >
              <div className="d-flex align-items-center flex-wrap gap-2 mt-2 mt-md-0">
                <div className="d-flex align-items-center gap-1">
                  <RenderWhen isTrue={!addmission.dischargeDate}>
                    <Label className="mb-0 text-nowrap">
                      Patient Category:
                    </Label>
                    <Input
                      className="form-control"
                      bsSize="sm"
                      type="select"
                      value={addmission.patientType || ""}
                      onChange={(e) =>
                        handlePatientTypeChange(
                          addmission.patient,
                          e.target.value,
                        )
                      }
                    >
                      <option value={"suicidal"}>Suicidal</option>
                      <option value={"runaway"}>Runaway</option>
                      <option value={"serious"}>Medically Serious</option>
                      <option value={"aggresive"}>Aggresive</option>
                      <option value={"normal"}>Normal</option>
                    </Input>
                  </RenderWhen>
                  <RenderWhen
                    isTrue={addmission.dischargeDate && addmission.patientType}
                  >
                    <div className="d-flex align-items-center">
                      <Label className="mb-0 text-nowrap me-2">
                        Patient Category:
                      </Label>
                      <p className="mb-0">
                        {capitalizeWords(addmission.patientType)}
                      </p>
                    </div>
                  </RenderWhen>
                </div>

                <div className="d-flex align-items-center gap-1 ms-2">
                  <Label className="mb-0 text-nowrap">Chart Type:</Label>
                  <Input
                    className="form-control"
                    bsSize="sm"
                    type="select"
                    value={filterChartType[addmission._id] || "All"}
                    onChange={(e) =>
                      setFilterChartType((prev) => ({
                        ...prev,
                        [addmission._id]: e.target.value,
                      }))
                    }
                  >
                    <option value="All">All</option>
                    {records
                      .filter((r) => {
                        // if (user?.role === "NURSE") {
                        //   return ![
                        //     PRESCRIPTION,
                        //     COUNSELLING_NOTE,
                        //     DETAIL_ADMISSION,
                        //   ].includes(r.category);
                        // }
                        // if (
                        //   ["MSW", "PSW"].includes(user?.role)
                        // ) {
                        //   return ![PRESCRIPTION, VITAL_SIGN].includes(
                        //     r.category,
                        //   );
                        // }
                        return true;
                      })
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((r) => (
                        <option key={r.category} value={r.category}>
                          {r.name}
                        </option>
                      ))}
                  </Input>
                </div>
                <CheckPermission permission={"create"} subAccess={"Charting"}>
                  <RenderWhen isTrue={!addmission.dischargeDate}>
                    <Button
                      onClick={() => {
                        toggleModal();
                        setChartType(IPD);
                      }}
                      size="sm"
                    >
                      Create new Chart
                    </Button>
                  </RenderWhen>
                </CheckPermission>
                <h6 className={`display-6 fs-6 mb-0`}>Total Charts:</h6>
                <Button
                  onClick={() => {
                    dispatch(
                      togglePrint({
                        data: {
                          printAdmissionCharts: addmission._id,
                          bulk: true,
                        },
                        modal: true,
                        patient,
                      }),
                    );
                  }}
                  size="sm"
                  color="success"
                  outline
                  className="text-white"
                >
                  <i className="ri-printer-line align-bottom text-dark"></i>
                </Button>

                {/* Whether the Ramsay Sedation Scale applies to this admission.
                    Gates the Ramsay SOP protocol, so it is editable only while
                    the patient is admitted and read-only afterwards — matching
                    how Patient Category behaves.

                    w-100 makes this its own flex line so it sits beneath the
                    Patient Category dropdown rather than crowding the row.
                    The w-100 rows must stay LAST in this row: anything added
                    after one of them lands on the wrapped line, not the main
                    row. Add another w-100 sibling below rather than nesting
                    into this div, which has no flex-wrap and would overflow on
                    a narrow screen. */}
                <div className="d-flex align-items-center flex-wrap gap-1 row-gap-2 w-100">
                  <RenderWhen isTrue={!addmission.dischargeDate}>
                    <div className="form-check form-switch d-flex align-items-center mb-0">
                      <Input
                        type="checkbox"
                        role="switch"
                        id={`ramsay-applicable-${addmission._id}`}
                        checked={!!addmission.isRamsayApplicable}
                        onChange={(e) =>
                          handleRamsayApplicableChange(
                            addmission._id,
                            e.target.checked,
                          )
                        }
                      />
                      <Label
                        className="form-check-label text-nowrap ms-2 mb-0"
                        htmlFor={`ramsay-applicable-${addmission._id}`}
                      >
                        Is Ramsay Applicable
                      </Label>
                    </div>

                    {/* Gates the Morse Fall Risk protocol, exactly like
                        Ramsay. Off by default; independent of Patient Type. */}
                    <div className="form-check form-switch d-flex align-items-center mb-0 ms-3">
                      <Input
                        type="checkbox"
                        role="switch"
                        id={`morse-applicable-${addmission._id}`}
                        checked={!!addmission.isMorseApplicable}
                        onChange={(e) =>
                          handleMorseApplicableChange(
                            addmission._id,
                            e.target.checked,
                          )
                        }
                      />
                      <Label
                        className="form-check-label text-nowrap ms-2 mb-0"
                        htmlFor={`morse-applicable-${addmission._id}`}
                      >
                        Is Morse Applicable
                      </Label>
                    </div>
                  </RenderWhen>

                  <RenderWhen isTrue={addmission.dischargeDate}>
                    <div className="d-flex align-items-center">
                      <Label className="mb-0 text-nowrap me-2">
                        Is Ramsay Applicable:
                      </Label>
                      <p className="mb-0">
                        {addmission.isRamsayApplicable ? "Yes" : "No"}
                      </p>
                    </div>
                    <div className="d-flex align-items-center ms-3">
                      <Label className="mb-0 text-nowrap me-2">
                        Is Morse Applicable:
                      </Label>
                      <p className="mb-0">
                        {addmission.isMorseApplicable ? "Yes" : "No"}
                      </p>
                    </div>
                  </RenderWhen>

                  {/* Clinical Patient Type (Psychiatric / Addiction /
                      Geriatric). Not the emergency "Patient Category" above.
                      A Detail Admission save with a type overwrites it. */}
                  <PatientAdmissionTypeControl
                    addmission={addmission}
                    onChange={handlePatientAdmissionTypeChange}
                  />

                  {/* Backfill affordance: only for a live admission that has NO
                      timeline at all, i.e. neither an Admission Type chart nor a
                      structured Admission Form was ever submitted. Once either
                      exists the type is already recorded, so this disappears and
                      corrections go through the chart. */}
                  <RenderWhen
                    isTrue={
                      canSetAdmissionType &&
                      !addmission.dischargeDate &&
                      (!addmission.admissionTypeHistory?.length ||
                        canOverrideAdmissionType)
                    }
                  >
                    <Button
                      size="sm"
                      color="primary"
                      outline
                      className="ms-2"
                      onClick={() => setAdmissionTypeFor(addmission._id)}
                    >
                      Set Admission Type
                    </Button>
                  </RenderWhen>

                  {/* Override accounts only: empty the type history back to
                      "none recorded". Only offered when there is something to
                      clear, on a live stay. */}
                  <RenderWhen
                    isTrue={
                      canOverrideAdmissionType &&
                      !addmission.dischargeDate &&
                      addmission.admissionTypeHistory?.length > 0
                    }
                  >
                    <Button
                      size="sm"
                      color="danger"
                      outline
                      className="ms-2"
                      onClick={() => setClearAdmissionTypeFor(addmission._id)}
                    >
                      Clear Admission Type
                    </Button>
                  </RenderWhen>
                </div>

                {/* Baseline investigation package — its own w-100 line for the
                    same reason as the Ramsay row above. Marking it complete or
                    not-applicable is what stops the governance escalation
                    ladder. */}
                <div className="d-flex align-items-center gap-1 w-100">
                  <BaselinePackageControl
                    addmission={addmission}
                    onRequestChange={(admissionId, nextStatus) =>
                      setBaselineTarget({ admissionId, nextStatus })
                    }
                  />
                </div>

                {/* Psychological tests applicability — its own w-100 line below
                    Baseline. Not Applicable stops the clinical-test "not
                    recorded" reminders for this admission; score alerts still
                    fire. The reason is collected in a dialog, as for
                    Baseline. */}
                {/* <div className="d-flex align-items-center gap-1 w-100">
                  <PsychologicalTestsControl
                    addmission={addmission}
                    onRequestChange={(admissionId, nextStatus) =>
                      setPsychTestTarget({ admissionId, nextStatus })
                    }
                  />
                </div> */}
              </div>

              <SetAdmissionTypeModal
                isOpen={admissionTypeFor === addmission._id}
                toggle={() => setAdmissionTypeFor(null)}
                addmission={addmission}
              />

              {canOverrideAdmissionType && (
                <ClearAdmissionTypeModal
                  isOpen={clearAdmissionTypeFor === addmission._id}
                  toggle={() => setClearAdmissionTypeFor(null)}
                  addmission={addmission}
                />
              )}

              <BaselinePackageStatusModal
                isOpen={baselineTarget?.admissionId === addmission._id}
                toggle={() => setBaselineTarget(null)}
                addmission={addmission}
                nextStatus={baselineTarget?.nextStatus}
              />

              <PsychologicalTestsStatusModal
                isOpen={psychTestTarget?.admissionId === addmission._id}
                toggle={() => setPsychTestTarget(null)}
                addmission={addmission}
                nextStatus={psychTestTarget?.nextStatus}
                onSubmit={handlePsychTestStatusChange}
              />

              <div className="d-flex align-items-center gap-4">
                {(user?.email === "rijutarafder000@gmail.com" ||
                  user?.email === "owais@gmail.com" ||
                  user?.email === "bishal@gmail.com" ||
                  user?.email === "hemanthshinde@gmail.com") && (
                    <div className="d-flex align-items-center">
                      <UncontrolledTooltip
                        placement="bottom"
                        target="edit-admission"
                      >
                        Edit Admission
                      </UncontrolledTooltip>
                      <Button
                        onClick={() => {
                          dispatch(
                            admitDischargePatient({
                              data: addmission,
                              isOpen: EDIT_ADMISSION,
                            }),
                          );
                        }}
                        id="edit-admission"
                        size="sm"
                        outline
                      >
                        <i className="ri-quill-pen-line text-muted fs-6"></i>
                      </Button>
                    </div>
                  )}

                <div className="d-flex align-items-center">
                  <UncontrolledTooltip
                    placement="bottom"
                    target="expand-charts"
                  >
                    Show Charts
                  </UncontrolledTooltip>
                  <Button
                    onClick={() => toggleAccordian(idx.toString())}
                    id="expand-charts"
                    size="sm"
                    outline
                  >
                    <i
                      className={`${open === idx.toString()
                        ? " ri-arrow-up-s-line"
                        : "ri-arrow-down-s-line"
                        } fs-6`}
                    ></i>
                  </Button>
                </div>
              </div>
              <Accordion
                className="timeline-date w-100"
                open={open}
                toggle={toggleAccordian}
              >
                <AccordionItem className="patient-accordion-item">
                  <AccordionBody
                    className="patient-accordion border-0"
                    accordionId={idx.toString()}
                  >
                    {open === idx.toString() && chartLoading ? (
                      <Placeholder />
                    ) : (
                      <Charts
                        toggleDateModal={toggleModal}
                        setChartType={setChartType}
                        charts={addmission.charts ?? []}
                        addmission={addmission}
                        doctor={addmission?.doctor}
                        currentAddmissionId={patient?.addmission?._id}
                        isPatientDischarged={!!addmission.dischargeDate}
                      />
                    )}
                  </AccordionBody>
                </AccordionItem>
              </Accordion>
            </AddmissionCard>
          ))}
        </Row>
      </div>
    </React.Fragment>
  );
};

const mapStateToProps = (state) => ({
  user: state.User.user,
});

export default connect(mapStateToProps)(IPDComponent);
