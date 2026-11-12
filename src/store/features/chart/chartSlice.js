import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  setRamsayApplicable as setRamsayApplicableApi,
  setMorseApplicable as setMorseApplicableApi,
  setBaselineInvestigationStatus as setBaselineInvestigationStatusApi,
  setPsychologicalTestStatus as setPsychologicalTestStatusApi,
  setAdmissionTypeDirect as setAdmissionTypeDirectApi,
  clearAdmissionTypeDirect as clearAdmissionTypeDirectApi,
  setPatientAdmissionType as setPatientAdmissionTypeApi,
  deleteChart,
  deleteClinicalNoteFile,
  deleteCounsellingNoteFile,
  deleteDetailAdmissionFile,
  deleteLabReportFile,
  editClinicalNote,
  editCounsellingNote,
  editDetailAdmission,
  editDischargeSummary,
  editExpirySummary,
  editLabReport,
  editMentalExamination,
  editOutpass,
  editPrescription,
  editRealtiveVisit,
  editVitalSign,
  getCharts,
  getChartsAddmissions,
  getCounsellingNote,
  getGeneralCharts,
  getLastMentalExamination,
  getLastEctSession,
  getLatestCharts,
  getOPDPrescription,
  postClinicalNote,
  postCounsellingNote,
  postDetailAdmission,
  postDischargeSummary,
  postExpirySummary,
  postGeneralCounsellingNote,
  postGeneralDetailAdmission,
  postGeneralLabReport,
  postGeneralMentalExamintion,
  postGeneralPrescription,
  postGeneralRealtiveVisit,
  postGeneralVitalSign,
  postLabReport,
  postMentalExamination,
  postOutpass,
  postPrescription,
  postRealtiveVisit,
  postVitalSign,
  postElderlyFunctionalChecklist,
  editElderlyFunctionalChecklist,
  submitAssessment,
  submitECTConsent,
  postPsychoDiagnosticForm,
  postGeneralPsychoDiagnosticForm,
  editPsychoDiagnosticForm,
  deletePsychoDiagnosticFormFile,
  postInputOutput,
  postGeneralInputOutput,
  editInputOutput,
  postNurseSosProcedure,
  postGeneralNurseSosProcedure,
  editNurseSosProcedure,
  postInjuryMarks,
  postGeneralInjuryMarks,
  editInjuryMarks,
  deleteInjuryMarksFile,
  getFinalDiagnosis,
  getAdditionalDetails,
  postEctSession,
  postAdmissionType,
  editAdmissionType,
  postGeneralEctSession,
  editEctSession,
} from "../../../helpers/backend_helper";
import { setAlert } from "../alert/alertSlice";
import { IPD, OPD } from "../../../Components/constants/patient";
import { togglePrint } from "../print/printSlice";
import {
  removeEventChart,
  setEventChart,
  setEventPsychoDiagnostic,
} from "../booking/bookingSlice";
import {
  fetchPatientById,
  setMedicines,
  viewPatient,
} from "../../actions";

const initialState = {
  data: [],
  opdData: [],
  charts: [],
  chartForm: {
    data: null,
    chart: null,
    isOpen: false,
  },
  chartsStale: false,
  patientLatestOPDPrescription: null,
  patientLatestMentalExamination: null,
  patientLatestEctSession: null,
  finalDiagnosis: null,
  finalDiagnosisLoading: false,
  additionalDiagnosis: [],
  additionalDiagnosisLoading: false,
  chartDate: null,
  chartLoading: false,
  generalChartLoading: false,
  loading: false,
};

export const fetchChartsAddmissions = createAsyncThunk(
  "getChartsAddmissions",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await getChartsAddmissions(data);
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const fetchCharts = createAsyncThunk(
  "getCharts",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await getCharts(data);
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const fetchLatestCharts = createAsyncThunk(
  "getLatestCharts",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await getLatestCharts(data);
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const fetchGeneralCharts = createAsyncThunk(
  "getGeneralCharts",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await getGeneralCharts(data);
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const fetchOPDPrescription = createAsyncThunk(
  "getOPDPrescription",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await getOPDPrescription(data);
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const fetchCounsellingNote = createAsyncThunk(
  "getCounsellingNote",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await getCounsellingNote(data);
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

// Latest final diagnosis of the current admission (shown in the patient topbar).
// Kept silent on failure — it is a non-critical accessory, not a primary action.
export const fetchFinalDiagnosis = createAsyncThunk(
  "getFinalDiagnosis",
  async (addmissionId, { rejectWithValue }) => {
    try {
      const response = await getFinalDiagnosis(addmissionId);
      return response;
    } catch (error) {
      return rejectWithValue("something went wrong");
    }
  },
);

export const fetchAdditionalDiagnosis = createAsyncThunk(
  "getAdditionalDiagnosis",
  async ({ patient, admission, chart_id }, { rejectWithValue }) => {
    try {
      const response = await getAdditionalDetails({
        patient,
        admission,
        chart_id,
      });
      return response;
    } catch (error) {
      return rejectWithValue("something went wrong");
    }
  },
);

export const addPrescription = createAsyncThunk(
  "postPrescription",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await postPrescription(data);
      dispatch(
        setAlert({
          type: "success",
          message: "Prescription Saved Successfully",
        }),
      );
      const payload = response?.payload;
      const patient = response?.patient;
      const appointment = response?.appointment;
      const doctor = response?.doctor;
      if ((data?.type === OPD || data?.type === IPD) && appointment) {
        dispatch(setEventChart({ chart: payload, appointment, patient }));
        dispatch(viewPatient(patient));
        dispatch(togglePrint({ modal: true, data: payload, patient, doctor }));
      }
      // if (response.medicines?.length)
      //   localStorage.setItem("medicines", JSON.stringify(response.medicines));
      dispatch(setMedicines(response.medicines));
      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const addGeneralPrescription = createAsyncThunk(
  "postGeneralPrescription",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await postGeneralPrescription(data);
      dispatch(
        setAlert({
          type: "success",
          message: "General Prescription Saved Successfully",
        }),
      );

      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const updatePrescription = createAsyncThunk(
  "editPrescription",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await editPrescription(data);
      dispatch(
        setAlert({
          type: "success",
          message: "Prescription Updated Successfully",
        }),
      );

      const payload = response?.payload;
      const appointment = payload.appointment;
      if ((payload.type === OPD || payload.type === IPD) && appointment) {
        dispatch(
          setEventChart({
            chart: payload,
            appointment,
            patient: response.patient,
          }),
        );
        // dispatch(viewPatient(patient));
        if (data.shouldPrintAfterSave)
          dispatch(
            togglePrint({
              modal: true,
              data: payload,
              doctor: data.doctor,
              patient: response.patient,
            }),
          );
      }

      // if (response.medicines?.length)
      //   localStorage.setItem("medicines", JSON.stringify(response.medicines));
      dispatch(setMedicines(response.medicines));

      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const addVitalSign = createAsyncThunk(
  "postVitalSign",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await postVitalSign(data);
      dispatch(
        setAlert({
          type: "success",
          message: "Vital Sign Saved Successfully",
        }),
      );

      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const addGeneralVitalSign = createAsyncThunk(
  "postGeneralVitalSign",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await postGeneralVitalSign(data);
      dispatch(
        setAlert({
          type: "success",
          message: "General Vital Sign Saved Successfully",
        }),
      );

      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const updateVitalSign = createAsyncThunk(
  "editVitalSign",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await editVitalSign(data);
      dispatch(
        setAlert({
          type: "success",
          message: "Vital Sign Updated Successfully",
        }),
      );

      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const addElderlyFunctionalChecklist = createAsyncThunk(
  "postElderlyFunctionalChecklist",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await postElderlyFunctionalChecklist(data);
      dispatch(
        setAlert({
          type: "success",
          message: "Elderly Functional and Daily Living Checklist Saved Successfully",
        }),
      );

      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const updateElderlyFunctionalChecklist = createAsyncThunk(
  "editElderlyFunctionalChecklist",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await editElderlyFunctionalChecklist(data);
      dispatch(
        setAlert({
          type: "success",
          message: "Elderly Functional and Daily Living Checklist Updated Successfully",
        }),
      );

      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

// Ramsay applicability, toggled from the IPD admission card.
//
// Lives in THIS slice, not patientSlice, because IPD.js renders admissions from
// `state.Chart.data` — patching anywhere else leaves the checkbox showing the
// old value until the next fetch. (That is exactly the flaw the Patient Category
// dropdown next to it has: assignEmergencyPatientType writes to
// state.Patient.patient.addmission, which IPD.js never reads.)
export const setAdmissionRamsayApplicable = createAsyncThunk(
  "setRamsayApplicable",
  async (data, { dispatch, rejectWithValue }) => {
    try {
      return await setRamsayApplicableApi(data);
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue(error.message || "Failed to update Ramsay applicability");
    }
  },
);

// Same as the Ramsay toggle, for the Morse Fall Risk protocol — and in this
// slice for the same reason.
export const setAdmissionMorseApplicable = createAsyncThunk(
  "setMorseApplicable",
  async (data, { dispatch, rejectWithValue }) => {
    try {
      return await setMorseApplicableApi(data);
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue(error.message || "Failed to update Morse applicability");
    }
  },
);

// Baseline investigation package status. In THIS slice for the same reason as
// the Ramsay toggle above: IPD.js renders from `state.Chart.data`, so the
// control only holds its new value if the timeline is patched there.
export const setAdmissionBaselineInvestigationStatus = createAsyncThunk(
  "setBaselineInvestigationStatus",
  async (data, { dispatch, rejectWithValue }) => {
    try {
      return await setBaselineInvestigationStatusApi(data);
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue(
        error.message || "Failed to update baseline investigation status",
      );
    }
  },
);

// Psychological tests applicability. In THIS slice for the same reason as the
// baseline thunk above: IPD.js renders from `state.Chart.data`, so the control
// only holds its new value if the timeline is patched there.
//
// Rejects with a STRING (rejectWithValue), so a caller's `.unwrap()` throws that
// string — `error.message` on it is always undefined. The server's message is
// already surfaced via setAlert below, so callers should just catch.
export const setAdmissionPsychologicalTestStatus = createAsyncThunk(
  "setPsychologicalTestStatus",
  async (data, { dispatch, rejectWithValue }) => {
    try {
      return await setPsychologicalTestStatusApi(data);
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue(
        error.message || "Failed to update psychological tests",
      );
    }
  },
);

// Records an admission type directly on an admission that has none — the stays
// the backfill script can't reach, because it derives history from the very
// chart/form records these lack. Create-only; the server refuses if a history
// already exists.
//
// In THIS slice for the same reason as the Ramsay toggle: IPD.js renders from
// `state.Chart.data`, so the "Set Admission Type" button only disappears if the
// timeline is patched there.
export const setAdmissionTypeDirect = createAsyncThunk(
  "setAdmissionTypeDirect",
  async (data, { dispatch, rejectWithValue }) => {
    try {
      return await setAdmissionTypeDirectApi(data);
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue(
        error.message || "Failed to record the admission type",
      );
    }
  },
);

// The admission card's clinical Patient Type. Any logged-in user, live stays
// only (server-enforced). Rejects with a STRING after showing the server's
// message via setAlert — callers must not read `error.message` after .unwrap().
export const setAdmissionPatientAdmissionType = createAsyncThunk(
  "setAdmissionPatientAdmissionType",
  async (data, { dispatch, rejectWithValue }) => {
    try {
      return await setPatientAdmissionTypeApi(data);
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue(error.message || "Failed to set the patient type");
    }
  },
);

// Empties an admission's admission-type timeline — override accounts only (the
// server refuses everyone else). Same response envelope as the setter, so the
// same reducers patch IPD and the patient header. Rejects with a STRING (like
// the setter): callers must not read `error.message` after .unwrap().
export const clearAdmissionTypeDirect = createAsyncThunk(
  "clearAdmissionTypeDirect",
  async (data, { dispatch, rejectWithValue }) => {
    try {
      return await clearAdmissionTypeDirectApi(data);
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue(
        error.message || "Failed to clear the admission type",
      );
    }
  },
);

// Admission Type — IPD only, so there is no addGeneral counterpart.
// Keeps the admission's type timeline current in the form's copy of the patient.
//
// `chartForm.patient` is a snapshot taken when the form opened, and the Admission
// Type form reads `addmission.admissionTypeHistory` from it to show the current
// type. Without this, saving/editing/deleting an Admission Type chart would leave
// that snapshot stale and the panel would keep showing the previous value until a
// full page reload. The server returns the fresh array on those three responses.
// The admission's type timeline lives in TWO places in this slice, and every
// writer has to refresh both or one of them silently goes stale:
//
//   state.data[i]                  — the IPD admission cards. Drives whether the
//                                    "Set Admission Type" button still shows.
//   state.chartForm.patient        — the snapshot the Admission Type chart form
//                                    took when it opened; its "current type"
//                                    panel reads from it.
//
// (The third copy, state.Patient.patient.addmission, belongs to patientSlice and
// is patched there — it feeds the topbar and the header summary card.)
//
// Two response envelopes are in play: the chart endpoints put the array at the
// top level, the direct setter and the form return it under `data`. Normalise
// rather than making each case unpack its own.
const readAdmissionTypeUpdate = (payload) => ({
  admissionId: payload?.addmission ?? payload?.data?._id ?? null,
  history: Array.isArray(payload?.admissionTypeHistory)
    ? payload.admissionTypeHistory
    : Array.isArray(payload?.data?.admissionTypeHistory)
      ? payload.data.admissionTypeHistory
      : null,
});

// Applies an admission's clinical Patient Type — `{ _id, patientAdmissionType,
// patientAdmissionTypeMeta }`, from the card endpoint or synced by a Detail
// Admission save — to the IPD card list and the open chart form's snapshot.
const syncPatientAdmissionType = (state, sync) => {
  if (!sync?._id || !sync.patientAdmissionType) return;
  const apply = (adm) => {
    adm.patientAdmissionType = sync.patientAdmissionType;
    if (sync.patientAdmissionTypeMeta)
      adm.patientAdmissionTypeMeta = sync.patientAdmissionTypeMeta;
  };
  const idx = (state.data || []).findIndex(
    (el) => String(el._id) === String(sync._id),
  );
  if (idx !== -1) apply(state.data[idx]);
  const formAdm = state.chartForm?.patient?.addmission;
  if (formAdm && String(formAdm._id) === String(sync._id)) apply(formAdm);
};

const syncAdmissionTypeHistory = (state, payload) => {
  const { admissionId, history } = readAdmissionTypeUpdate(payload);
  if (!history) return;

  // The IPD card list.
  if (admissionId) {
    const idx = state.data.findIndex(
      (el) => String(el._id) === String(admissionId),
    );
    if (idx !== -1) state.data[idx].admissionTypeHistory = history;
  }

  // The open chart form's snapshot — only when it is about that admission.
  const formPatient = state.chartForm?.patient;
  if (!formPatient?.addmission) return;
  if (
    admissionId &&
    String(formPatient.addmission._id) !== String(admissionId)
  ) {
    return;
  }
  formPatient.addmission.admissionTypeHistory = history;
};

export const addAdmissionType = createAsyncThunk(
  "postAdmissionType",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await postAdmissionType(data);
      dispatch(
        setAlert({
          type: "success",
          message: "Admission Type Saved Successfully",
        }),
      );

      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const updateAdmissionType = createAsyncThunk(
  "editAdmissionType",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await editAdmissionType(data);
      dispatch(
        setAlert({
          type: "success",
          message: "Admission Type Updated Successfully",
        }),
      );

      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const addEctSession = createAsyncThunk(
  "postEctSession",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await postEctSession(data);
      dispatch(
        setAlert({
          type: "success",
          message: "ECT Session Saved Successfully",
        }),
      );

      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const addGeneralEctSession = createAsyncThunk(
  "postGeneralEctSession",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await postGeneralEctSession(data);
      dispatch(
        setAlert({
          type: "success",
          message: "General ECT Session Saved Successfully",
        }),
      );

      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const updateEctSession = createAsyncThunk(
  "editEctSession",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await editEctSession(data);
      dispatch(
        setAlert({
          type: "success",
          message: "ECT Session Updated Successfully",
        }),
      );

      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const addClinicalNote = createAsyncThunk(
  "postClinicalNote",
  async (args, { rejectWithValue, dispatch }) => {
    try {
      const data = args?.data || args;
      const config = args?.config || {};
      const response = await postClinicalNote(data, config);
      dispatch(
        setAlert({
          type: "success",
          message: "Clinical Note Saved Successfully",
        }),
      );

      //FOR OPD PRESCRIPTION
      const payload = response?.payload;
      const patient = response?.patient;
      const appointment = response?.appointment;
      const doctor = response?.doctor;
      if (
        (payload?.type === OPD || payload?.type === IPD) &&
        payload?.appointment
      ) {
        dispatch(setEventChart({ chart: payload, appointment, patient }));
        // dispatch(viewPatient(patient));
        dispatch(togglePrint({ modal: true, data: payload, patient, doctor }));
      }

      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const addGeneralClinicalNote = createAsyncThunk(
  "postGeneralClinicalNote",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await postClinicalNote(data);
      dispatch(
        setAlert({
          type: "success",
          message: "General Clinical Note Saved Successfully",
        }),
      );

      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const removeClinicalNoteFile = createAsyncThunk(
  "deleteClinicalNoteFile",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await deleteClinicalNoteFile(data);
      dispatch(
        setAlert({
          type: "success",
          message: "File Deleted Successfully",
        }),
      );
      const payload = response?.payload;
      // const patient = response?.patient;
      const appointment = response?.appointment;
      if (payload.type === OPD) {
        dispatch(
          setEventChart({
            chart: payload,
            appointment,
            patient: response.patient,
          }),
        );
        // dispatch(viewPatient(patient));
        // if (data.shouldPrintAfterSave)
        //   dispatch(
        //     togglePrint({
        //       modal: true,
        //       data: payload,
        //       doctor: data.doctor,
        //       patient: response.patient,
        //     })
        //   );
      }

      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const updateClinicalNote = createAsyncThunk(
  "editClinicalNote",
  async (args, { rejectWithValue, dispatch }) => {
    try {
      const data = args?.data || args;
      const config = args?.config || {};
      const response = await editClinicalNote(data, config);
      dispatch(
        setAlert({
          type: "success",
          message: "Clinical Note Updated Successfully",
        }),
      );

      const payload = response?.payload;
      // const patient = response?.patient;
      const appointment = response?.appointment;
      if (
        (payload.type === OPD || payload.type === IPD) &&
        payload.appointment
      ) {
        dispatch(
          setEventChart({
            chart: payload,
            appointment,
            patient: response.patient,
          }),
        );
        // dispatch(viewPatient(patient));
        if (response.shouldPrintAfterSave)
          dispatch(
            togglePrint({
              modal: true,
              data: payload,
              doctor: response.doctor,
              patient: response.patient,
            }),
          );
      }

      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const addCounsellingNote = createAsyncThunk(
  "postCounsellingNote",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await postCounsellingNote(data);
      dispatch(
        setAlert({
          type: "success",
          message: "Counselling Note Saved Successfully",
        }),
      );
      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const addGeneralCounsellingNote = createAsyncThunk(
  "postGeneralCounsellingNote",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await postGeneralCounsellingNote(data);
      dispatch(
        setAlert({
          type: "success",
          message: "Counselling Note Saved Successfully",
        }),
      );
      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const updateCounsellingNote = createAsyncThunk(
  "editCounsellingNote",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await editCounsellingNote(data);
      dispatch(
        setAlert({
          type: "success",
          message: "Counselling Note Updated Successfully",
        }),
      );
      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const removeCounsellingNoteFile = createAsyncThunk(
  "deleteCounsellingNoteFile",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await deleteCounsellingNoteFile(data);
      dispatch(
        setAlert({
          type: "success",
          message: "File Deleted Successfully",
        }),
      );
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const addLabReport = createAsyncThunk(
  "postLabReport",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await postLabReport(data);
      dispatch(
        setAlert({
          type: "success",
          message: "Lab Report Saved Successfully",
        }),
      );

      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const addGeneralLabReport = createAsyncThunk(
  "postGeneralLabReport",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await postGeneralLabReport(data);
      dispatch(
        setAlert({
          type: "success",
          message: "General Lab Report Saved Successfully",
        }),
      );

      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const removeLabReportFile = createAsyncThunk(
  "deleteLabReportFile",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await deleteLabReportFile(data);
      dispatch(
        setAlert({
          type: "success",
          message: "File Deleted Successfully",
        }),
      );
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const updateLabReport = createAsyncThunk(
  "editLabReport",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await editLabReport(data);
      dispatch(
        setAlert({
          type: "success",
          message: "Lab Report Updated Successfully",
        }),
      );

      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const addPsychoDiagnosticForm = createAsyncThunk(
  "postPsychoDiagnosticForm",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await postPsychoDiagnosticForm(data);
      dispatch(
        setAlert({
          type: "success",
          message: "Psycho Diagnostic Form Saved Successfully",
        }),
      );
      // Booking flow: update the appointment's psycho slot on the calendar and
      // open the print modal (mirrors the prescription flow).
      if (response?.appointment) {
        dispatch(
          setEventPsychoDiagnostic({
            psychoDiagnosticForm: response.payload,
            appointment: response.appointment,
          }),
        );
        if (response.patient) dispatch(viewPatient(response.patient));
        dispatch(
          togglePrint({
            modal: true,
            data: response.payload,
            patient: response.patient,
            center: response.center,
            doctor: response.doctor,
          }),
        );
      }
      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const addGeneralPsychoDiagnosticForm = createAsyncThunk(
  "postGeneralPsychoDiagnosticForm",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await postGeneralPsychoDiagnosticForm(data);
      dispatch(
        setAlert({
          type: "success",
          message: "Psycho Diagnostic Form Saved Successfully",
        }),
      );
      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const updatePsychoDiagnosticForm = createAsyncThunk(
  "editPsychoDiagnosticForm",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await editPsychoDiagnosticForm(data);
      dispatch(
        setAlert({
          type: "success",
          message: "Psycho Diagnostic Form Updated Successfully",
        }),
      );
      // Booking flow: refresh the appointment's psycho slot on the calendar.
      if (response?.appointment) {
        dispatch(
          setEventPsychoDiagnostic({
            psychoDiagnosticForm: response.payload,
            appointment: response.appointment,
          }),
        );
        if (response.patient) dispatch(viewPatient(response.patient));
      }
      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const removePsychoDiagnosticFormFile = createAsyncThunk(
  "deletePsychoDiagnosticFormFile",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await deletePsychoDiagnosticFormFile(data);
      dispatch(
        setAlert({ type: "success", message: "File Deleted Successfully" }),
      );
      // Booking/OPD flow: refresh the appointment's psycho slot on the calendar
      // and OPD card so the removed file disappears there too (these read from
      // the Booking store, not the open chart form).
      if (response?.appointment) {
        dispatch(
          setEventPsychoDiagnostic({
            psychoDiagnosticForm: response.payload,
            appointment: response.appointment,
          }),
        );
      }
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const addRelativeVisit = createAsyncThunk(
  "postRelativeVisit",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await postRealtiveVisit(data);
      dispatch(
        setAlert({
          type: "success",
          message: "Relative Visit Chart Saved Successfully",
        }),
      );

      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const addGeneralRelativeVisit = createAsyncThunk(
  "postGeneralRelativeVisit",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await postGeneralRealtiveVisit(data);
      dispatch(
        setAlert({
          type: "success",
          message: "Relative Visit Chart Saved Successfully",
        }),
      );

      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const updateRelativeVisit = createAsyncThunk(
  "editRelativeVisit",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await editRealtiveVisit(data);
      dispatch(
        setAlert({
          type: "success",
          message: "Relative Visit Chart Updated Successfully",
        }),
      );

      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const addOutpass = createAsyncThunk(
  "postOutpass",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await postOutpass(data);
      dispatch(
        setAlert({
          type: "success",
          message: "Outpass Chart Saved Successfully",
        }),
      );

      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      // refresh patient so the "On Outpass" badge reflects the new date range
      if (data?.patient) dispatch(fetchPatientById(data.patient));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const updateOutpass = createAsyncThunk(
  "editOutpass",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await editOutpass(data);
      dispatch(
        setAlert({
          type: "success",
          message: "Outpass Chart Updated Successfully",
        }),
      );

      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      // refresh patient so the "On Outpass" badge reflects the updated date range
      if (data?.patient) dispatch(fetchPatientById(data.patient));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const addDischargeSummary = createAsyncThunk(
  "postDischargeSummary",
  async (data, { rejectWithValue, dispatch }) => {

    try {
      const response = await postDischargeSummary(data);

      dispatch(
        setAlert({
          type: "success",
          message: "Discharge Summary Saved Successfully",
        }),
      );

      // if (response.medicines?.length)
      //   localStorage.setItem("medicines", JSON.stringify(response.medicines));
      dispatch(setMedicines(response.medicines));
      // dispatch(fetchCharts(response?.addmission));
      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const updateDischargeSummary = createAsyncThunk(
  "editDischargeSummary",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await editDischargeSummary(data);
      dispatch(
        setAlert({
          type: "success",
          message: "Discharge Summary Updated Successfully",
        }),
      );

      // if (response.medicines?.length)
      //   localStorage.setItem("medicines", JSON.stringify(response.medicines));
      dispatch(setMedicines(response.medicines));

      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const addExpirySummary = createAsyncThunk(
  "postExpirySummary",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await postExpirySummary(data);
      dispatch(
        setAlert({
          type: "success",
          message: "Expiry Summary Saved Successfully",
        }),
      );
      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const updateExpirySummary = createAsyncThunk(
  "editExpirySummary",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await editExpirySummary(data);
      dispatch(
        setAlert({
          type: "success",
          message: "Expiry Summary Updated Successfully",
        }),
      );
      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const addDetailAdmission = createAsyncThunk(
  "postDetailAdmission",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await postDetailAdmission(data);
      dispatch(
        setAlert({
          type: "success",
          message: "Detail Admission Saved Successfully",
        }),
      );

      // A new Detail Admission chart carries its own final diagnosis, so the
      // topbar needs a fresh read right away instead of waiting for the next
      // admission-change/page-refresh to happen to trigger one.
      if (response?.addmission) {
        dispatch(fetchFinalDiagnosis(response.addmission));
      }

      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const addGeneralDetailAdmission = createAsyncThunk(
  "postGeneralDetailAdmission",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await postGeneralDetailAdmission(data);
      dispatch(
        setAlert({
          type: "success",
          message: "Detail Admission Saved Successfully",
        }),
      );
      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));

      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const removeDetailAdissionFile = createAsyncThunk(
  "deleteDetailAdmissionFile",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await deleteDetailAdmissionFile(data);
      dispatch(
        setAlert({
          type: "success",
          message: "File Deleted Successfully",
        }),
      );

      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const updateDetailAdmission = createAsyncThunk(
  "editDetailAdmission",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await editDetailAdmission(data);
      dispatch(
        setAlert({
          type: "success",
          message: "Detail Admission Updated Successfully",
        }),
      );
      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));

      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const addMentalExamination = createAsyncThunk(
  "postMentalExamination",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await postMentalExamination(data);
      dispatch(
        setAlert({
          type: "success",
          message: "Clinical Notes V2 Saved Successfully",
        }),
      );

      const payload = response?.payload;
      const patient = response?.patient;
      const appointment = response?.appointment;
      const doctor = response?.doctor;
      if (
        (payload?.type === OPD || payload?.type === IPD) &&
        payload?.appointment
      ) {
        dispatch(setEventChart({ chart: payload, appointment, patient }));
        // dispatch(viewPatient(patient));
        dispatch(togglePrint({ modal: true, data: payload, patient, doctor }));
      }

      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const addGeneralMentalExamination = createAsyncThunk(
  "postGeneralMentalExamination",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await postGeneralMentalExamintion(data);
      dispatch(
        setAlert({
          type: "success",
          message: "General Clinical Notes V2 Saved Successfully",
        }),
      );

      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const updateMentalExamination = createAsyncThunk(
  "editMentalExamination",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await editMentalExamination(data);
      dispatch(
        setAlert({
          type: "success",
          message: "Clinical Notes V2 Updated Successfully",
        }),
      );

      const payload = response?.payload;
      // const patient = response?.patient;
      const appointment = response?.appointment;
      if (
        (payload.type === OPD || payload.type === IPD) &&
        payload.appointment
      ) {
        dispatch(
          setEventChart({
            chart: payload,
            appointment,
            patient: response.patient,
          }),
        );
        // dispatch(viewPatient(patient));
        if (response.shouldPrintAfterSave)
          dispatch(
            togglePrint({
              modal: true,
              data: payload,
              doctor: response.doctor,
              patient: response.patient,
            }),
          );
      }

      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const fetchLastMentalExamination = createAsyncThunk(
  "getLastMentalExamination",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await getLastMentalExamination(data);
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const fetchLastEctSession = createAsyncThunk(
  "getLastEctSession",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await getLastEctSession(data);
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const removeChart = createAsyncThunk(
  "deleteChart",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await deleteChart(data);
      dispatch(
        setAlert({
          type: "success",
          message: "Chart Deleted Successfully",
        }),
      );

      if (response.payload?.type === OPD) {
        dispatch(removeEventChart(response.payload));
      }

      // if an outpass was deleted, refresh patient so the "On Outpass" badge clears
      if (response.chart?.outpass && response.payload?.patient) {
        dispatch(fetchPatientById(response.payload.patient));
      }

      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const addCapacityAssessment = createAsyncThunk(
  "postCapacityAssessment",
  async ({ addmissionId, formData }, { dispatch, rejectWithValue }) => {
    try {
      const response = await submitAssessment(addmissionId, formData);

      dispatch(
        setAlert({
          type: "success",
          message: "Capacity Assessment Saved Successfully",
        }),
      );

      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue(error.message);
    }
  },
);

export const addECTConsent = createAsyncThunk(
  "postECTConsent",
  async ({ addmissionId, formData }, { dispatch, rejectWithValue }) => {
    try {
      const response = await submitECTConsent(addmissionId, formData);

      dispatch(
        setAlert({
          type: "success",
          message: "ECT Consent Form Saved Successfully",
        }),
      );

      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue(error.message);
    }
  },
);

export const addInputOutput = createAsyncThunk(
  "postInputOutput",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await postInputOutput(data);
      dispatch(
        setAlert({
          type: "success",
          message: "Input Output Saved Successfully",
        }),
      );

      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const addGeneralInputOutput = createAsyncThunk(
  "postGeneralInputOutput",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await postGeneralInputOutput(data);
      dispatch(
        setAlert({
          type: "success",
          message: "General Input Output Saved Successfully",
        }),
      );

      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const updateInputOutput = createAsyncThunk(
  "editInputOutput",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await editInputOutput(data);
      dispatch(
        setAlert({
          type: "success",
          message: "Input Output Updated Successfully",
        }),
      );

      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const addNurseSosProcedure = createAsyncThunk(
  "postNurseSosProcedure",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await postNurseSosProcedure(data);
      dispatch(
        setAlert({
          type: "success",
          message: "Nurse SOS Procedure Saved Successfully",
        }),
      );

      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const addGeneralNurseSosProcedure = createAsyncThunk(
  "postGeneralNurseSosProcedure",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await postGeneralNurseSosProcedure(data);
      dispatch(
        setAlert({
          type: "success",
          message: "General Nurse SOS Procedure Saved Successfully",
        }),
      );

      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const updateNurseSosProcedure = createAsyncThunk(
  "editNurseSosProcedure",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await editNurseSosProcedure(data);
      dispatch(
        setAlert({
          type: "success",
          message: "Nurse SOS Procedure Updated Successfully",
        }),
      );

      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const addInjuryMarks = createAsyncThunk(
  "postInjuryMarks",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await postInjuryMarks(data);
      dispatch(
        setAlert({
          type: "success",
          message: "Injury Marks Saved Successfully",
        }),
      );

      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const addGeneralInjuryMarks = createAsyncThunk(
  "postGeneralInjuryMarks",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await postGeneralInjuryMarks(data);
      dispatch(
        setAlert({
          type: "success",
          message: "General Injury Marks Saved Successfully",
        }),
      );

      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const updateInjuryMarks = createAsyncThunk(
  "editInjuryMarks",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await editInjuryMarks(data);
      dispatch(
        setAlert({
          type: "success",
          message: "Injury Marks Updated Successfully",
        }),
      );

      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const removeInjuryMarksFile = createAsyncThunk(
  "deleteInjuryMarksFile",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await deleteInjuryMarksFile(data);
      dispatch(
        setAlert({
          type: "success",
          message: "File Deleted Successfully",
        }),
      );
      return response;
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.message }));
      return rejectWithValue("something went wrong");
    }
  },
);

export const chartSlice = createSlice({
  name: "Chart",
  initialState,
  reducers: {
    clearCharts: (state) => {
      state.data = [];
      state.chartLoading = false;
      state.additionalDiagnosis = []; // ← add this
    },
    updateChartAdmission: (state, { payload }) => {
      const index = state.data?.findIndex((d) => d._id === payload._id);

      if (index >= 0) {
        state.data[index]["addmissionDate"] = payload.addmissionDate;
        state.data[index]["dischargeDate"] = payload.dischargeDate;
      }
    },
    createEditChart: (state, { payload }) => {

      state.chartForm = payload;
    },
    setChartDate: (state, { payload }) => {
      state.chartDate = payload;
    },
    // Superseded by the server-side carry-forward endpoints (see
    // controllers/chart/prescription/carryForward.controller.js).
    // toggleCarryForwardChart: (state, { payload }) => {
    //   const idx = state.carryForwardCharts.findIndex(
    //     (c) => String(c._id) === String(payload._id),
    //   );
    //   if (idx >= 0) state.carryForwardCharts.splice(idx, 1);
    //   else state.carryForwardCharts.push(payload);
    // },
    // clearCarryForwardCharts: (state) => {
    //   state.carryForwardCharts = [];
    // },
    markChartsStale: (state) => {
      state.chartsStale = true;
    },
    setChartAdmission: (state, { payload }) => {
      const index = state.data?.findIndex((d) => d._id === payload._id);
      state.data[index] = payload;
    },
    // resetChartForm: (state, { payload }) => {
    //   payload.validation.resetForm();
    // },
    resetOpdPatientCharts: (state) => {
      state.data = [];
    },
    setPtLatestOPDPrescription: (state, { payload }) => {
      state.patientLatestOPDPrescription = payload;
    },
    // Cleared when the ECT form closes or submits, so the snapshot can't leak
    // into the next patient's form.
    setPtLatestEctSession: (state, { payload }) => {
      state.patientLatestEctSession = payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChartsAddmissions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchChartsAddmissions.fulfilled, (state, { payload }) => {
        state.loading = false;
        // Upsert by _id instead of replacing state.data wholesale — this slice
        // is shared across screens (IPD view, ChartDate modal, AI socket
        // refreshes) that each fetch different subsets of admissions. A full
        // replace here would let a single-admission fetch (e.g. from the
        // create-chart modal) wipe out other admissions currently on screen.
        const incoming = payload.payload || [];
        incoming.forEach((item) => {
          const index = state.data.findIndex((d) => d._id === item._id);
          if (index >= 0) {
            state.data[index] = { ...state.data[index], ...item };
          } else {
            state.data.push(item);
          }
        });
      })
      .addCase(fetchChartsAddmissions.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(fetchOPDPrescription.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOPDPrescription.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.patientLatestOPDPrescription = payload.payload;
      })
      .addCase(fetchOPDPrescription.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(fetchCounsellingNote.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCounsellingNote.fulfilled, (state, { payload }) => {

        state.loading = false;
        state.patientLatestCounsellingNote = payload.payload;
      })
      .addCase(fetchCounsellingNote.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(fetchFinalDiagnosis.pending, (state) => {
        state.finalDiagnosisLoading = true;
      })
      .addCase(fetchFinalDiagnosis.fulfilled, (state, { payload }) => {
        state.finalDiagnosisLoading = false;
        state.finalDiagnosis = payload.payload;
      })
      .addCase(fetchFinalDiagnosis.rejected, (state) => {
        state.finalDiagnosisLoading = false;
        state.finalDiagnosis = null;
      });

    builder
      .addCase(fetchAdditionalDiagnosis.pending, (state) => {
        state.additionalDiagnosisLoading = true;
      })
      .addCase(fetchAdditionalDiagnosis.fulfilled, (state, { payload }) => {
        state.additionalDiagnosisLoading = false;
        const incoming = payload.data || [];
        incoming.forEach((item) => {
          const idx = state.additionalDiagnosis.findIndex(
            (d) => String(d.chart_id) === String(item.chart_id),
          );
          if (idx >= 0) {
            state.additionalDiagnosis[idx] = item; // ← update existing
          } else {
            state.additionalDiagnosis.push(item); // ← add new
          }
        });
      })
      .addCase(fetchAdditionalDiagnosis.rejected, (state) => {
        state.additionalDiagnosisLoading = false;
        // ← don't clear, keep existing data
      });
    builder
      .addCase(fetchCharts.pending, (state) => {
        state.chartLoading = true;
      })
      .addCase(fetchCharts.fulfilled, (state, { payload }) => {
        state.chartLoading = false;
        state.chartsStale = false;
        const findIndex = state.data.findIndex(
          (el) => el._id === payload.addmission,
        );
        if (findIndex === -1) return;
        state.data[findIndex] = {
          ...state.data[findIndex],
          charts: payload.payload,
        };
      })
      .addCase(fetchCharts.rejected, (state) => {
        state.chartLoading = false;
      });

    builder
      .addCase(fetchLatestCharts.pending, (state) => {
        state.generalChartLoading = true;
      })
      .addCase(fetchLatestCharts.fulfilled, (state, { payload }) => {
        state.generalChartLoading = false;
        state.charts = payload.payload;
      })
      .addCase(fetchLatestCharts.rejected, (state) => {
        state.generalChartLoading = false;
      });

    builder
      .addCase(fetchGeneralCharts.pending, (state) => {
        state.generalChartLoading = true;
      })
      .addCase(fetchGeneralCharts.fulfilled, (state, { payload }) => {
        state.generalChartLoading = false;
        state.charts = payload.payload;
      })
      .addCase(fetchGeneralCharts.rejected, (state) => {
        state.generalChartLoading = false;
      });

    builder
      .addCase(addPrescription.pending, (state) => {
        state.loading = true;
      })
      .addCase(addPrescription.fulfilled, (state, { payload }) => {
        state.loading = false;
        if (
          (payload?.payload?.type === OPD || payload?.payload?.type === IPD) &&
          payload.payload?.appointment
        ) {
          //OPD CHARTS
          state.opdData = [payload.payload, ...state.opdData];
        } else {
          //IPD CHARTS
          if (payload.isAddmissionAvailable) {
            const findIndex = state.data.findIndex(
              (el) => el._id === payload.addmission,
            );
            state.data[findIndex].totalCharts += 1;
            state.data[findIndex].charts = [
              payload.payload,
              ...(state.data[findIndex].charts || []),
            ];
          } else {
            state.data = [...payload.payload, ...state.data];
          }
        }
      })
      .addCase(addPrescription.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(addGeneralPrescription.pending, (state) => {
        state.loading = true;
      })
      .addCase(addGeneralPrescription.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.charts = [payload.payload, ...(state.charts || [])];
      })
      .addCase(addGeneralPrescription.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(addGeneralCounsellingNote.pending, (state) => {
        state.loading = true;
      })
      .addCase(addGeneralCounsellingNote.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.charts = [payload.payload, ...(state.charts || [])];
      })
      .addCase(addGeneralCounsellingNote.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(updatePrescription.pending, (state) => {
        state.loading = true;
      })
      .addCase(updatePrescription.fulfilled, (state, { payload }) => {
        state.loading = false;

        if (payload.type === "GENERAL") {
          const findIndex = state.charts.findIndex(
            (el) => el._id === payload.payload._id,
          );
          state.charts[findIndex] = payload.payload;
        } else if (payload.type !== "OPD" && state.data?.length > 0) {
          // && !payload.appointment

          //IPD CHARTS
          const findIndex = state.data.findIndex(
            (el) => el._id === payload.payload.addmission,
          );
          const findChartIndex = state.data[findIndex].charts.findIndex(
            (chart) => chart._id === payload.payload._id,
          );
          state.data[findIndex].charts[findChartIndex] = payload.payload;
        }
      })
      .addCase(updatePrescription.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(addVitalSign.pending, (state) => {
        state.loading = true;
      })
      .addCase(addVitalSign.fulfilled, (state, { payload }) => {
        state.loading = false;
        if (payload.isAddmissionAvailable) {
          const findIndex = state.data.findIndex(
            (el) => el._id === payload.addmission,
          );
          state.data[findIndex].totalCharts += 1;
          state.data[findIndex].charts = [
            payload.payload,
            ...(state.data[findIndex].charts || []),
          ];
        } else {
          state.data = [...payload.payload, ...state.data];
        }
      })
      .addCase(addVitalSign.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(addGeneralVitalSign.pending, (state) => {
        state.loading = true;
      })
      .addCase(addGeneralVitalSign.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.charts = [payload.payload, ...(state.charts || [])];
      })
      .addCase(addGeneralVitalSign.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(updateVitalSign.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateVitalSign.fulfilled, (state, { payload }) => {
        state.loading = false;
        if (payload.type === "GENERAL") {
          const findIndex = state.charts.findIndex(
            (el) => el._id === payload.payload._id,
          );
          state.charts[findIndex] = payload.payload;
        } else {
          const findIndex = state.data.findIndex(
            (el) => el._id === payload.payload.addmission,
          );
          const findChartIndex = state.data[findIndex].charts.findIndex(
            (chart) => chart._id === payload.payload._id,
          );
          state.data[findIndex].charts[findChartIndex] = payload.payload;
        }
      })
      .addCase(updateVitalSign.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(addElderlyFunctionalChecklist.pending, (state) => {
        state.loading = true;
      })
      .addCase(addElderlyFunctionalChecklist.fulfilled, (state, { payload }) => {
        state.loading = false;
        if (payload.isAddmissionAvailable) {
          const findIndex = state.data.findIndex(
            (el) => el._id === payload.addmission,
          );
          state.data[findIndex].totalCharts += 1;
          state.data[findIndex].charts = [
            payload.payload,
            ...(state.data[findIndex].charts || []),
          ];
        } else {
          state.data = [...payload.payload, ...state.data];
        }
      })
      .addCase(addElderlyFunctionalChecklist.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(updateElderlyFunctionalChecklist.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateElderlyFunctionalChecklist.fulfilled, (state, { payload }) => {
        state.loading = false;
        if (payload.type === "GENERAL") {
          const findIndex = state.charts.findIndex(
            (el) => el._id === payload.payload._id,
          );
          state.charts[findIndex] = payload.payload;
        } else {
          const findIndex = state.data.findIndex(
            (el) => el._id === payload.payload.addmission,
          );
          const findChartIndex = state.data[findIndex].charts.findIndex(
            (chart) => chart._id === payload.payload._id,
          );
          state.data[findIndex].charts[findChartIndex] = payload.payload;
        }
      })
      .addCase(updateElderlyFunctionalChecklist.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(addAdmissionType.pending, (state) => {
        state.loading = true;
      })
      .addCase(setAdmissionTypeDirect.fulfilled, (state, { payload }) => {
        syncAdmissionTypeHistory(state, payload);
      })
      .addCase(clearAdmissionTypeDirect.fulfilled, (state, { payload }) => {
        syncAdmissionTypeHistory(state, payload);
      })
      .addCase(
        setAdmissionPatientAdmissionType.fulfilled,
        (state, { payload }) => {
          syncPatientAdmissionType(state, payload?.data);
        },
      )
      .addCase(setAdmissionRamsayApplicable.fulfilled, (state, { payload }) => {
        // IPD.js reads this array, so patch it here or the checkbox reverts on
        // the next render.
        const id = payload?.data?._id;
        if (!id) return;
        const idx = state.data.findIndex((el) => String(el._id) === String(id));
        if (idx === -1) return;
        state.data[idx].isRamsayApplicable = payload.data.isRamsayApplicable;
      })
      .addCase(setAdmissionMorseApplicable.fulfilled, (state, { payload }) => {
        // IPD.js reads this array — same as Ramsay above.
        const id = payload?.data?._id;
        if (!id) return;
        const idx = state.data.findIndex((el) => String(el._id) === String(id));
        if (idx === -1) return;
        state.data[idx].isMorseApplicable = payload.data.isMorseApplicable;
      })
      .addCase(
        setAdmissionBaselineInvestigationStatus.fulfilled,
        (state, { payload }) => {
          // Same reason as the Ramsay case above — IPD.js reads this array, so
          // patch it here or the control reverts on the next render.
          //
          // `baselineInvestigationStatus` is a mongoose VIRTUAL derived from
          // `baselineInvestigationHistory`. Both are patched, and the key must
          // match the virtual's name exactly: patch one name while the UI reads
          // another and the control silently snaps back with no error anywhere.
          const id = payload?.data?._id;
          if (!id) return;
          const idx = state.data.findIndex(
            (el) => String(el._id) === String(id),
          );
          if (idx === -1) return;
          state.data[idx].baselineInvestigationStatus =
            payload.data.baselineInvestigationStatus;
          state.data[idx].baselineInvestigationHistory =
            payload.data.baselineInvestigationHistory || [];
        },
      )
      .addCase(
        setAdmissionPsychologicalTestStatus.fulfilled,
        (state, { payload }) => {
          // Same reason as the baseline case above. `psychologicalTestStatus` is
          // a mongoose VIRTUAL derived from `psychologicalTestHistory`; both are
          // patched and the keys must match exactly, or the control silently
          // snaps back on the next render.
          const id = payload?.data?._id;
          if (!id) return;
          const idx = state.data.findIndex(
            (el) => String(el._id) === String(id),
          );
          if (idx === -1) return;
          state.data[idx].psychologicalTestStatus =
            payload.data.psychologicalTestStatus;
          state.data[idx].psychologicalTestHistory =
            payload.data.psychologicalTestHistory || [];
        },
      )
      .addCase(addAdmissionType.fulfilled, (state, { payload }) => {
        state.loading = false;
        syncAdmissionTypeHistory(state, payload);
        // IPD only, so the admission always exists — guard the lookup anyway
        // rather than writing to state.data[-1].
        const findIndex = state.data.findIndex(
          (el) => el._id === payload?.addmission,
        );
        if (findIndex === -1) return;

        state.data[findIndex].totalCharts += 1;
        state.data[findIndex].charts = [
          payload.payload,
          ...(state.data[findIndex].charts || []),
        ];
      })
      .addCase(addAdmissionType.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(updateAdmissionType.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateAdmissionType.fulfilled, (state, { payload }) => {
        state.loading = false;
        syncAdmissionTypeHistory(state, payload);
        const findIndex = state.data.findIndex(
          (el) => el._id === payload?.payload?.addmission,
        );
        if (findIndex === -1) return;

        const findChartIndex = state.data[findIndex].charts.findIndex(
          (chart) => chart._id === payload.payload._id,
        );
        if (findChartIndex === -1) return;

        state.data[findIndex].charts[findChartIndex] = payload.payload;
      })
      .addCase(updateAdmissionType.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(addEctSession.pending, (state) => {
        state.loading = true;
      })
      .addCase(addEctSession.fulfilled, (state, { payload }) => {
        state.loading = false;
        if (payload.isAddmissionAvailable) {
          const findIndex = state.data.findIndex(
            (el) => el._id === payload.addmission,
          );
          state.data[findIndex].totalCharts += 1;
          state.data[findIndex].charts = [
            payload.payload,
            ...(state.data[findIndex].charts || []),
          ];
        } else {
          state.data = [...payload.payload, ...state.data];
        }
      })
      .addCase(addEctSession.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(addGeneralEctSession.pending, (state) => {
        state.loading = true;
      })
      .addCase(addGeneralEctSession.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.charts = [payload.payload, ...(state.charts || [])];
      })
      .addCase(addGeneralEctSession.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(updateEctSession.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateEctSession.fulfilled, (state, { payload }) => {
        state.loading = false;
        if (payload.type === "GENERAL") {
          const findIndex = state.charts.findIndex(
            (el) => el._id === payload.payload._id,
          );
          state.charts[findIndex] = payload.payload;
        } else {
          const findIndex = state.data.findIndex(
            (el) => el._id === payload.payload.addmission,
          );
          const findChartIndex = state.data[findIndex].charts.findIndex(
            (chart) => chart._id === payload.payload._id,
          );
          state.data[findIndex].charts[findChartIndex] = payload.payload;
        }
      })
      .addCase(updateEctSession.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(addClinicalNote.pending, (state) => {
        state.loading = true;
      })
      .addCase(addClinicalNote.fulfilled, (state, { payload }) => {
        state.loading = false;
        if (
          (payload?.payload?.type === OPD || payload?.payload?.type === IPD) &&
          payload?.payload?.appointment
        ) {
          //OPD CHARTS
          state.opdData = [payload.payload, ...state.opdData];
        } else {
          //IPD CHARTS

          if (payload.isAddmissionAvailable) {
            const findIndex = state.data.findIndex(
              (el) => el._id === payload.addmission,
            );
            // findIndex is -1 whenever this admission's charts were never
            // loaded into state.data (e.g. the Psychologist dashboard, which
            // never fetches addmissionsCharts) — nothing to merge into there.
            if (findIndex !== -1) {
              state.data[findIndex].totalCharts += 1;
              state.data[findIndex].charts = [
                payload.payload,
                ...(state.data[findIndex].charts || []),
              ];
            }
          } else {
            state.data = [...payload.payload, ...state.data];
          }
        }
      })
      .addCase(addClinicalNote.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(addGeneralClinicalNote.pending, (state) => {
        state.loading = true;
      })
      .addCase(addGeneralClinicalNote.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.charts = [payload.payload, ...(state.charts || [])];
      })
      .addCase(addGeneralClinicalNote.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(removeClinicalNoteFile.pending, (state) => {
        state.loading = true;
      })
      .addCase(removeClinicalNoteFile.fulfilled, (state, { payload }) => {
        state.loading = false;
        if (payload.type === "GENERAL") {
          const findIndex = state.charts.findIndex(
            (el) => el._id === payload.payload._id,
          );
          state.charts[findIndex] = payload.payload;
          state.chartForm.data = payload.payload;
        } else if (payload?.payload?.type === OPD) {
          //OPD CHARTS
          state.chartForm.data = payload.payload;
        } else {
          //IPD CHARTS
          const findIndex = state.data.findIndex(
            (el) => el._id === payload.payload.addmission,
          );
          const findChartIndex = state.data[findIndex].charts.findIndex(
            (chart) => chart._id === payload.payload._id,
          );
          state.data[findIndex].charts[findChartIndex] = payload.payload;
          state.chartForm.data = payload.payload;
        }
      })
      .addCase(removeClinicalNoteFile.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(updateClinicalNote.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateClinicalNote.fulfilled, (state, { payload }) => {
        state.loading = false;

        if (payload.type === "GENERAL") {
          const findIndex = state.charts.findIndex(
            (el) => el._id === payload.payload._id,
          );
          state.charts[findIndex] = payload.payload;
        } else if (payload.type !== "OPD" && !payload.appointment) {
          const findIndex = state.data.findIndex(
            (el) => el._id === payload.payload.addmission,
          );
          if (findIndex !== -1) {
            const findChartIndex = state.data[findIndex].charts.findIndex(
              (chart) => chart._id === payload.payload._id,
            );
            if (findChartIndex !== -1) {
              state.data[findIndex].charts[findChartIndex] = payload.payload;
            }
          }
        }
      })
      .addCase(updateClinicalNote.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(addCounsellingNote.pending, (state) => {
        state.loading = true;
      })
      .addCase(addCounsellingNote.fulfilled, (state, { payload }) => {
        state.loading = false;
        if (payload.isAddmissionAvailable) {
          const findIndex = state.data.findIndex(
            (el) => el._id === payload.addmission,
          );
          // findIndex is -1 whenever this admission's charts were never
          // loaded into state.data (e.g. the Psychologist dashboard, which
          // never fetches addmissionsCharts) — nothing to merge into there.
          if (findIndex !== -1) {
            state.data[findIndex].totalCharts += 1;
            state.data[findIndex].charts = [
              payload.payload,
              ...(state.data[findIndex].charts || []),
            ];
          }
        } else {
          state.data = [...payload.payload, ...state.data];
        }
      })
      .addCase(addCounsellingNote.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(updateCounsellingNote.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateCounsellingNote.fulfilled, (state, { payload }) => {
        state.loading = false;
        const findIndex = state.data.findIndex(
          (el) => el._id === payload.payload.addmission,
        );
        if (findIndex !== -1) {
          const findChartIndex = state.data[findIndex].charts.findIndex(
            (chart) => chart._id === payload.payload._id,
          );
          if (findChartIndex !== -1) {
            state.data[findIndex].charts[findChartIndex] = payload.payload;
          }
        }
      })
      .addCase(updateCounsellingNote.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(removeCounsellingNoteFile.pending, (state) => {
        state.loading = true;
      })
      .addCase(removeCounsellingNoteFile.fulfilled, (state, { payload }) => {
        state.loading = false;
        const findIndex = state.data.findIndex(
          (el) => el._id === payload.payload.addmission,
        );
        const findChartIndex = state.data[findIndex].charts.findIndex(
          (chart) => chart._id === payload.payload._id,
        );
        state.data[findIndex].charts[findChartIndex] = payload.payload;
        state.chartForm.data = payload.payload;
      })
      .addCase(removeCounsellingNoteFile.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(addLabReport.pending, (state) => {
        state.loading = true;
      })
      .addCase(addLabReport.fulfilled, (state, { payload }) => {
        state.loading = false;
        if (payload.isAddmissionAvailable) {
          const findIndex = state.data.findIndex(
            (el) => el._id === payload.addmission,
          );
          state.data[findIndex].totalCharts += 1;
          state.data[findIndex].charts = [
            payload.payload,
            ...(state.data[findIndex].charts || []),
          ];
        } else {
          state.data = [...payload.payload, ...state.data];
        }
      })
      .addCase(addLabReport.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(addGeneralLabReport.pending, (state) => {
        state.loading = true;
      })
      .addCase(addGeneralLabReport.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.charts = [payload.payload, ...(state.charts || [])];
      })
      .addCase(addGeneralLabReport.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(removeLabReportFile.pending, (state) => {
        state.loading = true;
      })
      .addCase(removeLabReportFile.fulfilled, (state, { payload }) => {
        state.loading = false;
        if (payload.type === "GENERAL") {
          const findIndex = state.charts.findIndex(
            (el) => el._id === payload.payload._id,
          );
          state.charts[findIndex] = payload.payload;
          state.chartForm.data = payload.payload;
        } else {
          const findIndex = state.data.findIndex(
            (el) => el._id === payload.payload.addmission,
          );
          const findChartIndex = state.data[findIndex].charts.findIndex(
            (chart) => chart._id === payload.payload._id,
          );
          state.data[findIndex].charts[findChartIndex] = payload.payload;
          state.chartForm.data = payload.payload;
        }
      })
      .addCase(removeLabReportFile.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(updateLabReport.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateLabReport.fulfilled, (state, { payload }) => {
        state.loading = false;
        if (payload.type === "GENERAL") {
          const findIndex = state.charts.findIndex(
            (el) => el._id === payload.payload._id,
          );
          state.charts[findIndex] = payload.payload;
        } else {
          const findIndex = state.data.findIndex(
            (el) => el._id === payload.payload.addmission,
          );
          const findChartIndex = state.data[findIndex].charts.findIndex(
            (chart) => chart._id === payload.payload._id,
          );
          state.data[findIndex].charts[findChartIndex] = payload.payload;
        }
      })
      .addCase(updateLabReport.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(addRelativeVisit.pending, (state) => {
        state.loading = true;
      })
      .addCase(addRelativeVisit.fulfilled, (state, { payload }) => {
        state.loading = false;
        if (payload.isAddmissionAvailable) {
          const findIndex = state.data.findIndex(
            (el) => el._id === payload.addmission,
          );
          state.data[findIndex].totalCharts += 1;
          state.data[findIndex].charts = [
            payload.payload,
            ...(state.data[findIndex].charts || []),
          ];
        } else {
          state.data = [...payload.payload, ...state.data];
        }
      })
      .addCase(addRelativeVisit.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(addGeneralRelativeVisit.pending, (state) => {
        state.loading = true;
      })
      .addCase(addGeneralRelativeVisit.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.charts = [payload.payload, ...(state.charts || [])];
      })
      .addCase(addGeneralRelativeVisit.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(updateRelativeVisit.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateRelativeVisit.fulfilled, (state, { payload }) => {
        state.loading = false;
        if (payload.type === "GENERAL") {
          const findIndex = state.charts.findIndex(
            (el) => el._id === payload.payload._id,
          );
          state.charts[findIndex] = payload.payload;
        } else {
          const findIndex = state.data.findIndex(
            (el) => el._id === payload.payload.addmission,
          );
          const findChartIndex = state.data[findIndex].charts.findIndex(
            (chart) => chart._id === payload.payload._id,
          );
          state.data[findIndex].charts[findChartIndex] = payload.payload;
        }
      })
      .addCase(updateRelativeVisit.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(addOutpass.pending, (state) => {
        state.loading = true;
      })
      .addCase(addOutpass.fulfilled, (state, { payload }) => {
        state.loading = false;
        if (payload.isAddmissionAvailable) {
          const findIndex = state.data.findIndex(
            (el) => el._id === payload.addmission,
          );
          state.data[findIndex].totalCharts += 1;
          state.data[findIndex].charts = [
            payload.payload,
            ...(state.data[findIndex].charts || []),
          ];
        }
      })
      .addCase(addOutpass.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(updateOutpass.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateOutpass.fulfilled, (state, { payload }) => {
        state.loading = false;
        const findIndex = state.data.findIndex(
          (el) => el._id === payload.payload.addmission,
        );
        const findChartIndex = state.data[findIndex].charts.findIndex(
          (chart) => chart._id === payload.payload._id,
        );
        state.data[findIndex].charts[findChartIndex] = payload.payload;
      })
      .addCase(updateOutpass.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(addDischargeSummary.pending, (state) => {
        state.loading = true;
      })
      .addCase(addDischargeSummary.fulfilled, (state, { payload }) => {
        state.loading = false;
        if (payload.isAddmissionAvailable) {
          const findIndex = state.data.findIndex(
            (el) => el._id === payload.addmission,
          );
          state.data[findIndex].totalCharts += 1;
          state.data[findIndex].charts = [
            payload.payload,
            ...(state.data[findIndex].charts || []),
          ];
        } else {
          state.data = [...payload.payload, ...state.data];
        }
      })
      .addCase(addDischargeSummary.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(updateDischargeSummary.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateDischargeSummary.fulfilled, (state, { payload }) => {
        state.loading = false;
        const updatedChart = payload.payload;
        const chartType = payload.type || updatedChart?.type;
        if (chartType === "GENERAL") {
          const findIndex = state.charts?.findIndex(
            (el) => el._id === updatedChart._id,
          );
          if (findIndex >= 0) {
            state.charts[findIndex] = updatedChart;
          }
        } else if (chartType === "OPD") {
          const findIndex = state.opdData?.findIndex(
            (el) => el._id === updatedChart._id,
          );
          if (findIndex >= 0) {
            state.opdData[findIndex] = updatedChart;
          }
        } else if (state.data?.length > 0) {
          const findIndex = state.data.findIndex(
            (el) => el._id === updatedChart.addmission,
          );
          if (findIndex >= 0 && state.data[findIndex]?.charts) {
            const findChartIndex = state.data[findIndex].charts.findIndex(
              (chart) => chart._id === updatedChart._id,
            );
            if (findChartIndex >= 0) {
              state.data[findIndex].charts[findChartIndex] = updatedChart;
            }
          }
        }
      })
      .addCase(updateDischargeSummary.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(addExpirySummary.pending, (state) => {
        state.loading = true;
      })
      .addCase(addExpirySummary.fulfilled, (state, { payload }) => {
        state.loading = false;
        if (payload.isAddmissionAvailable) {
          const findIndex = state.data.findIndex(
            (el) => el._id === payload.addmission,
          );
          state.data[findIndex].totalCharts += 1;
          state.data[findIndex].charts = [
            payload.payload,
            ...(state.data[findIndex].charts || []),
          ];
        } else {
          state.data = [...payload.payload, ...state.data];
        }
      })
      .addCase(addExpirySummary.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(updateExpirySummary.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateExpirySummary.fulfilled, (state, { payload }) => {
        state.loading = false;
        const updatedChart = payload.payload;
        const chartType = payload.type || updatedChart?.type;
        if (chartType === "GENERAL") {
          const findIndex = state.charts?.findIndex(
            (el) => el._id === updatedChart._id,
          );
          if (findIndex >= 0) {
            state.charts[findIndex] = updatedChart;
          }
        } else if (chartType === "OPD") {
          const findIndex = state.opdData?.findIndex(
            (el) => el._id === updatedChart._id,
          );
          if (findIndex >= 0) {
            state.opdData[findIndex] = updatedChart;
          }
        } else if (state.data?.length > 0) {
          const findIndex = state.data.findIndex(
            (el) => el._id === updatedChart.addmission,
          );
          if (findIndex >= 0 && state.data[findIndex]?.charts) {
            const findChartIndex = state.data[findIndex].charts.findIndex(
              (chart) => chart._id === updatedChart._id,
            );
            if (findChartIndex >= 0) {
              state.data[findIndex].charts[findChartIndex] = updatedChart;
            }
          }
        }
      })
      .addCase(updateExpirySummary.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(addDetailAdmission.pending, (state) => {
        state.loading = true;
      })
      .addCase(addDetailAdmission.fulfilled, (state, { payload }) => {
        state.loading = false;
        if (payload.isAddmissionAvailable) {
          const findIndex = state.data.findIndex(
            (el) => el._id === payload.addmission,
          );
          state.data[findIndex].totalCharts += 1;
          state.data[findIndex].charts = [
            payload.payload,
            ...(state.data[findIndex].charts || []),
          ];
        } else {
          state.data = [...payload.payload, ...state.data];
        }
        // Chart → card: the server copied the chart's type onto the admission.
        syncPatientAdmissionType(state, payload?.patientAdmissionTypeSync);
      })
      .addCase(addDetailAdmission.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(addGeneralDetailAdmission.pending, (state) => {
        state.loading = true;
      })
      .addCase(addGeneralDetailAdmission.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.charts = [payload.payload, ...(state.charts || [])];
      })
      .addCase(addGeneralDetailAdmission.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(removeDetailAdissionFile.pending, (state) => {
        state.loading = true;
      })
      .addCase(removeDetailAdissionFile.fulfilled, (state, { payload }) => {
        state.loading = false;
        if (payload.type === "GENERAL") {
          const findIndex = state.charts.findIndex(
            (el) => el._id === payload.payload._id,
          );
          state.charts[findIndex] = payload.payload;
          state.chartForm.data = payload.payload;
        } else {
          const findIndex = state.data.findIndex(
            (el) => el._id === payload.payload.addmission,
          );
          const findChartIndex = state.data[findIndex].charts.findIndex(
            (chart) => chart._id === payload.payload._id,
          );
          state.data[findIndex].charts[findChartIndex] = payload.payload;
          state.chartForm.data = payload.payload;
        }
      })
      .addCase(removeDetailAdissionFile.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(updateDetailAdmission.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateDetailAdmission.fulfilled, (state, { payload }) => {
        state.loading = false;
        const updatedChart = payload.payload;
        const chartType = payload.type || updatedChart?.type;
        if (chartType === "GENERAL") {
          const findIndex = state.charts?.findIndex(
            (el) => el._id === updatedChart._id,
          );
          if (findIndex >= 0) {
            state.charts[findIndex] = updatedChart;
          }
        } else if (chartType === "OPD") {
          const findIndex = state.opdData?.findIndex(
            (el) => el._id === updatedChart._id,
          );
          if (findIndex >= 0) {
            state.opdData[findIndex] = updatedChart;
          }
        } else if (state.data?.length > 0) {
          const findIndex = state.data.findIndex(
            (el) => el._id === updatedChart.addmission,
          );
          if (findIndex >= 0 && state.data[findIndex]?.charts) {
            const findChartIndex = state.data[findIndex].charts.findIndex(
              (chart) => chart._id === updatedChart._id,
            );
            if (findChartIndex >= 0) {
              state.data[findIndex].charts[findChartIndex] = updatedChart;
            }
          }
        }
        // Chart → card: the server copied the chart's type onto the admission.
        syncPatientAdmissionType(state, payload?.patientAdmissionTypeSync);
      })
      .addCase(updateDetailAdmission.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(addMentalExamination.pending, (state) => {
        state.loading = true;
      })
      .addCase(addMentalExamination.fulfilled, (state, { payload }) => {
        state.loading = false;

        if (
          (payload?.payload?.type === OPD || payload?.payload?.type === IPD) &&
          payload?.payload?.appointment
        ) {
          //OPD CHARTS
          state.opdData = [payload.payload, ...state.opdData];
        } else {
          //IPD CHARTS
          if (payload.isAddmissionAvailable) {
            const findIndex = state.data.findIndex(
              (el) => el._id === payload.addmission,
            );
            if (findIndex !== -1) {
              state.data[findIndex].totalCharts += 1;
              state.data[findIndex].charts = [
                payload.payload,
                ...(state.data[findIndex].charts || []),
              ];
            }
          } else {
            state.data = [...payload.payload, ...state.data];
          }
        }
      })
      .addCase(addMentalExamination.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(addGeneralMentalExamination.pending, (state) => {
        state.loading = true;
      })
      .addCase(addGeneralMentalExamination.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.charts = [payload.payload, ...(state.charts || [])];
      })
      .addCase(addGeneralMentalExamination.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(updateMentalExamination.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateMentalExamination.fulfilled, (state, { payload }) => {
        state.loading = false;

        if (payload.type === "GENERAL") {
          const findIndex = state.charts.findIndex(
            (el) => el._id === payload.payload._id,
          );
          if (findIndex !== -1) {
            state.charts[findIndex] = payload.payload;
          }
        } else if (payload.type !== "OPD" && !payload.appointment) {
          const findIndex = state.data.findIndex(
            (el) => el._id === payload.payload.addmission,
          );
          if (findIndex !== -1) {
            const findChartIndex = state.data[findIndex].charts.findIndex(
              (chart) => chart._id === payload.payload._id,
            );
            if (findChartIndex !== -1) {
              state.data[findIndex].charts[findChartIndex] = payload.payload;
            }
          }
        }
      })
      .addCase(updateMentalExamination.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(fetchLastMentalExamination.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchLastMentalExamination.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.patientLatestMentalExamination = payload.payload;
      })
      .addCase(fetchLastMentalExamination.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(fetchLastEctSession.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchLastEctSession.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.patientLatestEctSession = payload.payload;
      })
      .addCase(fetchLastEctSession.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(removeChart.pending, (state) => {
        state.loading = true;
      })
      .addCase(removeChart.fulfilled, (state, { payload }) => {
        // Only carries admissionTypeHistory for Admission Type charts; the
        // helper no-ops for every other chart kind.
        syncAdmissionTypeHistory(state, payload);
        state.loading = false;
        if (
          payload.payload.type === "GENERAL" ||
          payload.payload.chart === "DETAIL_ADMISSION"
        ) {
          state.charts = state.charts.filter(
            (item) => item._id !== payload.chart._id,
          );
        }
        if (payload.payload.type === IPD) {
          const findIndex = state.data.findIndex(
            (el) => el._id === payload.payload.addmission,
          );
          // Deleting the last chart empties this admission's charts — it
          // must stay in state.data (not be removed), since every "add
          // chart" reducer indexes into state.data[findIndex] and assumes
          // the admission entry is still there.
          if (findIndex !== -1) {
            state.data[findIndex].charts = state.data[findIndex].charts.filter(
              (item) => item._id !== payload.payload._id,
            );
            state.data[findIndex].totalCharts = Math.max(
              0,
              (state.data[findIndex].totalCharts || 0) - 1,
            );
          }
        }

        // ← Add this
        if (payload?.payload?.chart === "DETAIL_ADMISSION") {
          state.additionalDiagnosis = state.additionalDiagnosis.filter(
            (d) => String(d.chart_id) !== String(payload?.payload?._id),
          );
        }
      })
      .addCase(removeChart.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(addCapacityAssessment.pending, (state) => {
        state.loading = true;
      })
      .addCase(addCapacityAssessment.fulfilled, (state, { payload }) => {
        state.loading = false;

        if (payload.isAddmissionAvailable) {
          const findIndex = state.data.findIndex(
            (el) => el._id === payload.addmission,
          );

          state.data[findIndex].totalCharts += 1;
          state.data[findIndex].charts = [
            payload.payload,
            ...(state.data[findIndex].charts || []),
          ];
        } else {
          state.data = [...payload.payload, ...state.data];
        }
      })
      .addCase(addCapacityAssessment.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(addECTConsent.pending, (state) => {
        state.loading = true;
      })
      .addCase(addECTConsent.fulfilled, (state, { payload }) => {
        state.loading = false;

        // This is a form on the admission, not a chart, so append the new file
        // record to its own array — that's what the download list reads.
        const findIndex = state.data.findIndex(
          (el) => el._id === payload?.addmission,
        );
        if (findIndex === -1 || !payload?.payload) return;

        const admission = state.data[findIndex];
        admission.ectConsentFormRaw = [
          ...(admission.ectConsentFormRaw || []),
          payload.payload,
        ];
        admission.ectConsentForm = true;
      })
      .addCase(addECTConsent.rejected, (state) => {
        state.loading = false;
      });
    builder
      .addCase(addPsychoDiagnosticForm.pending, (state) => {
        state.loading = true;
      })
      .addCase(addPsychoDiagnosticForm.fulfilled, (state, { payload }) => {
        state.loading = false;
        // Booking (appointment) charts are reflected on the calendar via
        // setEventPsychoDiagnostic; don't touch the patient-timeline state.
        if (payload?.payload?.appointment) return;
        if (payload.isAddmissionAvailable) {
          const findIndex = state.data.findIndex(
            (el) => el._id === payload.addmission,
          );
          state.data[findIndex].totalCharts += 1;
          state.data[findIndex].charts = [
            payload.payload,
            ...(state.data[findIndex].charts || []),
          ];
        } else {
          state.data = [...payload.payload, ...state.data];
        }
      })
      .addCase(addPsychoDiagnosticForm.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(addGeneralPsychoDiagnosticForm.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        addGeneralPsychoDiagnosticForm.fulfilled,
        (state, { payload }) => {
          state.loading = false;
          state.charts = [payload.payload, ...(state.charts || [])];
        },
      )
      .addCase(addGeneralPsychoDiagnosticForm.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(updatePsychoDiagnosticForm.pending, (state) => {
        state.loading = true;
      })
      .addCase(updatePsychoDiagnosticForm.fulfilled, (state, { payload }) => {
        state.loading = false;
        // Booking (appointment) charts are refreshed via setEventPsychoDiagnostic.
        if (payload?.payload?.appointment) return;
        if (payload.type === "GENERAL") {
          const findIndex = state.charts.findIndex(
            (el) => el._id === payload.payload._id,
          );
          state.charts[findIndex] = payload.payload;
        } else {
          const findIndex = state.data.findIndex(
            (el) => el._id === payload.payload.addmission,
          );
          const findChartIndex = state.data[findIndex].charts.findIndex(
            (chart) => chart._id === payload.payload._id,
          );
          state.data[findIndex].charts[findChartIndex] = payload.payload;
        }
      })
      .addCase(updatePsychoDiagnosticForm.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(removePsychoDiagnosticFormFile.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        removePsychoDiagnosticFormFile.fulfilled,
        (state, { payload }) => {
          state.loading = false;
          // Keep the open edit form in sync with the file removal in every
          // context (patient timeline, OPD tab, booking calendar).
          if (state.chartForm) state.chartForm.data = payload.payload;

          if (payload.type === "GENERAL") {
            const findIndex = (state.charts || []).findIndex(
              (el) => el._id === payload.payload._id,
            );
            if (findIndex > -1) state.charts[findIndex] = payload.payload;
          } else {
            // Only patch the admission timeline when that admission is loaded.
            // In the OPD tab / booking calendar `state.data` doesn't hold this
            // admission (findIndex === -1), so guard against reading `.charts`
            // of undefined — the form is already refreshed via chartForm above.
            const findIndex = (state.data || []).findIndex(
              (el) => el._id === payload.payload.addmission,
            );
            if (findIndex > -1 && state.data[findIndex]?.charts) {
              const findChartIndex = state.data[findIndex].charts.findIndex(
                (chart) => chart._id === payload.payload._id,
              );
              if (findChartIndex > -1)
                state.data[findIndex].charts[findChartIndex] = payload.payload;
            }
          }
        },
      )
      .addCase(removePsychoDiagnosticFormFile.rejected, (state) => {
        state.loading = false;
      });

    // Input - Output chart
    builder
      .addCase(addInputOutput.pending, (state) => {
        state.loading = true;
      })
      .addCase(addInputOutput.fulfilled, (state, { payload }) => {
        state.loading = false;
        if (payload.isAddmissionAvailable) {
          const findIndex = state.data.findIndex(
            (el) => el._id === payload.addmission,
          );
          state.data[findIndex].totalCharts += 1;
          state.data[findIndex].charts = [
            payload.payload,
            ...(state.data[findIndex].charts || []),
          ];
        } else {
          state.data = [...payload.payload, ...state.data];
        }
      })
      .addCase(addInputOutput.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(addGeneralInputOutput.pending, (state) => {
        state.loading = true;
      })
      .addCase(addGeneralInputOutput.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.charts = [payload.payload, ...(state.charts || [])];
      })
      .addCase(addGeneralInputOutput.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(updateInputOutput.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateInputOutput.fulfilled, (state, { payload }) => {
        state.loading = false;
        if (payload.type === "GENERAL") {
          const findIndex = state.charts.findIndex(
            (el) => el._id === payload.payload._id,
          );
          state.charts[findIndex] = payload.payload;
        } else {
          const findIndex = state.data.findIndex(
            (el) => el._id === payload.payload.addmission,
          );
          const findChartIndex = state.data[findIndex].charts.findIndex(
            (chart) => chart._id === payload.payload._id,
          );
          state.data[findIndex].charts[findChartIndex] = payload.payload;
        }
      })
      .addCase(updateInputOutput.rejected, (state) => {
        state.loading = false;
      });

    // Nurse SOS Procedure chart
    builder
      .addCase(addNurseSosProcedure.pending, (state) => {
        state.loading = true;
      })
      .addCase(addNurseSosProcedure.fulfilled, (state, { payload }) => {
        state.loading = false;
        if (payload.isAddmissionAvailable) {
          const findIndex = state.data.findIndex(
            (el) => el._id === payload.addmission,
          );
          state.data[findIndex].totalCharts += 1;
          state.data[findIndex].charts = [
            payload.payload,
            ...(state.data[findIndex].charts || []),
          ];
        } else {
          state.data = [...payload.payload, ...state.data];
        }
      })
      .addCase(addNurseSosProcedure.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(addGeneralNurseSosProcedure.pending, (state) => {
        state.loading = true;
      })
      .addCase(addGeneralNurseSosProcedure.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.charts = [payload.payload, ...(state.charts || [])];
      })
      .addCase(addGeneralNurseSosProcedure.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(updateNurseSosProcedure.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateNurseSosProcedure.fulfilled, (state, { payload }) => {
        state.loading = false;
        if (payload.type === "GENERAL") {
          const findIndex = state.charts.findIndex(
            (el) => el._id === payload.payload._id,
          );
          state.charts[findIndex] = payload.payload;
        } else {
          const findIndex = state.data.findIndex(
            (el) => el._id === payload.payload.addmission,
          );
          const findChartIndex = state.data[findIndex].charts.findIndex(
            (chart) => chart._id === payload.payload._id,
          );
          state.data[findIndex].charts[findChartIndex] = payload.payload;
        }
      })
      .addCase(updateNurseSosProcedure.rejected, (state) => {
        state.loading = false;
      });

    // Patient Injury Marks chart
    builder
      .addCase(addInjuryMarks.pending, (state) => {
        state.loading = true;
      })
      .addCase(addInjuryMarks.fulfilled, (state, { payload }) => {
        state.loading = false;
        if (payload.isAddmissionAvailable) {
          const findIndex = state.data.findIndex(
            (el) => el._id === payload.addmission,
          );
          state.data[findIndex].totalCharts += 1;
          state.data[findIndex].charts = [
            payload.payload,
            ...(state.data[findIndex].charts || []),
          ];
        } else {
          state.data = [...payload.payload, ...state.data];
        }
      })
      .addCase(addInjuryMarks.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(addGeneralInjuryMarks.pending, (state) => {
        state.loading = true;
      })
      .addCase(addGeneralInjuryMarks.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.charts = [payload.payload, ...(state.charts || [])];
      })
      .addCase(addGeneralInjuryMarks.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(updateInjuryMarks.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateInjuryMarks.fulfilled, (state, { payload }) => {
        state.loading = false;
        if (payload.type === "GENERAL") {
          const findIndex = state.charts.findIndex(
            (el) => el._id === payload.payload._id,
          );
          state.charts[findIndex] = payload.payload;
        } else {
          const findIndex = state.data.findIndex(
            (el) => el._id === payload.payload.addmission,
          );
          const findChartIndex = state.data[findIndex].charts.findIndex(
            (chart) => chart._id === payload.payload._id,
          );
          state.data[findIndex].charts[findChartIndex] = payload.payload;
        }
      })
      .addCase(updateInjuryMarks.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(removeInjuryMarksFile.pending, (state) => {
        state.loading = true;
      })
      .addCase(removeInjuryMarksFile.fulfilled, (state, { payload }) => {
        state.loading = false;
        if (payload.type === "GENERAL") {
          const findIndex = state.charts.findIndex(
            (el) => el._id === payload.payload._id,
          );
          state.charts[findIndex] = payload.payload;
          state.chartForm.data = payload.payload;
        } else {
          const findIndex = state.data.findIndex(
            (el) => el._id === payload.payload.addmission,
          );
          const findChartIndex = state.data[findIndex].charts.findIndex(
            (chart) => chart._id === payload.payload._id,
          );
          state.data[findIndex].charts[findChartIndex] = payload.payload;
          state.chartForm.data = payload.payload;
        }
      })
      .addCase(removeInjuryMarksFile.rejected, (state) => {
        state.loading = false;
      });

    // The Admission Form submit also rewrites the timeline, but its thunk
    // lives in patientSlice — and patientSlice already imports from this file,
    // so importing it back would create a cycle. Match on the action type
    // instead; it is the `createAsyncThunk` prefix of `submitAdmissionForm`
    // in store/features/patient/patientSlice.js.
    builder.addMatcher(
      (action) => action.type === "submitAdmissionForm/fulfilled",
      (state, { payload }) => {
        syncAdmissionTypeHistory(state, payload);
      },
    );
  },
});

export const {
  createEditChart,
  updateChartAdmission,
  setChartDate,
  setChartAdmission,
  resetOpdPatientCharts,
  setPtLatestOPDPrescription,
  clearCharts,
  setPtLatestEctSession,
  markChartsStale,
} = chartSlice.actions;

export default chartSlice.reducer;
