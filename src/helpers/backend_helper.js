import axios from "axios";
import { APIClient, AuthAPIClient } from "./api_helper";
import * as url from "./url_helper";
import qs from "qs";
import { postKeepalive } from "./keepaliveRequest";

const api = new APIClient();
const userService = new AuthAPIClient();
export const getLoggedInUser = () => {
  const user = localStorage.getItem("user");
  if (user) return JSON.parse(user);
  return null;
};
export const isUserAuthenticated = () => {
  return getLoggedInUser() !== null;
};

export const postUser = (data) =>
  api.create(url.POST_USER_REGISTER, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const postUserProfilePicture = (data) =>
  api.create(url.POST_USER_PROFILE_PICTURE, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const postUserDetailInformation = (data) =>
  api.create(url.POST_USER_DETAIL_INFORMATION, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const postUserSessionPricing = (data) =>
  api.create(url.POST_USER_SESSION_PRICING, data);
export const putUserSessionPricing = (id, data) =>
  api.put(`${url.PUT_USER_SESSION_PRICING}/${id}`, data);

export const getUsers = (data) => api.get(url.GET_USERS, data);

export const getDoctorUsers = (data) => api.get(url.GET_DOCTOR_USERS, data);

export const editUser = (data) =>
  api.put(url.EDIT_USER, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const markUserActiveInactive = (data) =>
  api.update(url.UPDATE_USER_ACTIVE_INACTIVE, data);

export const getCiwaTest = (data) =>
  api.get(`${url.GET_CIWA_TEST}`, {
    params: {
      patientId: data,
    },
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
export const postCiwatest = (data) =>
  api.create(url.POST_CIWA_TEST, data, {
    headers: {
      "Content-Type": "multipart/form-data",
      "X-No-Cookie-Token": "true",
    },
  });

export const postSsrstest = (data) =>
  api.create(url.POST_SSRS_TEST, data, {
    headers: {
      "Content-Type": "multipart/form-data",
      "X-No-Cookie-Token": "true",
    },
  });

export const postMPQtest = (data) =>
  api.create(url.POST_MPQ_TEST, data, {
    headers: {
      "Content-Type": "multipart/form-data",
      "X-No-Cookie-Token": "true",
    },
  });

export const postMMSEtest = (data) =>
  api.create(url.POST_MMSE_TEST, data, {
    headers: {
      "Content-Type": "multipart/form-data",
      "X-No-Cookie-Token": "true",
    },
  });

export const postYmrsTest = (data) =>
  api.create(url.POST_YMRS_TEST, data, {
    headers: {
      "Content-Type": "multipart/form-data",
      "X-No-Cookie-Token": "true",
    },
  });

export const postYBOCSTest = (data) =>
  api.create(url.POST_YBOCS_TEST, data, {
    headers: {
      "Content-Type": "multipart/form-data",
      "X-No-Cookie-Token": "true",
    },
  });

export const postACDSTest = (data) =>
  api.create(url.POST_ACDS_TEST, data, {
    headers: {
      "Content-Type": "multipart/form-data",
      "X-No-Cookie-Token": "true",
    },
  });

export const postHAMATest = (data) =>
  api.create(url.POST_HAMA_TEST, data, {
    headers: {
      "Content-Type": "multipart/form-data",
      "X-No-Cookie-Token": "true",
    },
  });

export const postHAMDTest = (data) =>
  api.create(url.POST_HAMD_TEST, data, {
    headers: {
      "Content-Type": "multipart/form-data",
      "X-No-Cookie-Token": "true",
    },
  });

export const postPANSSTest = (data) =>
  api.create(url.POST_PANSS_TEST, data, {
    headers: {
      "Content-Type": "multipart/form-data",
      "X-No-Cookie-Token": "true",
    },
  });

export const postMorseFallTest = (data) =>
  api.create(url.POST_MORSE_FALL_TEST, data, {
    headers: {
      "Content-Type": "multipart/form-data",
      "X-No-Cookie-Token": "true",
    },
  });

export const postRamsayTest = (data) =>
  api.create(url.POST_RAMSAY_TEST, data, {
    headers: {
      "Content-Type": "multipart/form-data",
      "X-No-Cookie-Token": "true",
    },
  });

export const postGCSTest = (data) =>
  api.create(url.POST_GCS_TEST, data, {
    headers: {
      "Content-Type": "multipart/form-data",
      "X-No-Cookie-Token": "true",
    },
  });

export const getClinicalTest = (data) =>
  api.get(`${url.FETCH_CLINICAL_TEST}`, {
    params: { patientId: data?.patientId },
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });

export const postLogin = (data) => api.create(url.POST_USER_LOGIN, data);
export const postJwtLogin = (data) => api.create(url.POST_USER_LOGIN, data);
export const postLogout = () => api.get(url.POST_USER_LOGOUT);
export const getUserLogs = (data) => api.get(url.GET_USER_LOGS, data);
export const getDashboardAnalytics = (data) =>
  api.get(`${url.GET_DASHBOARD_ANALYTICS}/${data}`);
export const postCenter = (data) =>
  api.create(url.POST_CENTER, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const getCenters = ({ centerIds, search } = {}) =>
  api.get(url.GET_CENTERS, {
    params: {
      centerIds,
      search,
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });

export const getAllCenters = () => api.get(url.GET_ALL_CENTERS);
export const getCenterBedsAnalytics = (centerAccess) =>
  api.get(url.GET_CENTER_BEDS_ANALYTICS, { centerAccess });
export const getDoctorsScheduleNew = (userId) =>
  api.get(`${url.GET_DOCTOR_SCHEDULE_NEW}?userId=${userId}`);
export const createDoctorsScheduleNew = (data) =>
  api.create(`${url.GET_DOCTOR_SCHEDULE_NEW}`, data);

export const editCenter = (data) =>
  api.put(url.EDIT_CENTER, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const deleteCenterLogo = (data) =>
  api.update(url.DELETE_CENTER_LOGO, data);
export const deleteCenter = (data) =>
  api.delete(`${url.DELETE_CENTER}/${data}`);
export const deleteCenterPermanently = (data) =>
  api.delete(`${url.DELETE_CENTER_PERMANENTLY}/${data}`);

// Lead Methodes
export const getLeads = () => api.get(url.GET_LEADS);
export const postLead = (data) => api.create(url.POST_LEAD, data);
export const editLead = (data) => api.put(url.EDIT_LEAD, data);
export const postMergeLead = (data) => api.update(url.POST_MERGE_LEAD, data);
export const postUnMergeLead = (data) =>
  api.update(url.POST_UNMERGE_LEAD, data);
export const postSearchLead = (query) => api.get(url.GET_SEARCH_LEADS, query);
export const deleteLead = (param) => api.delete(`${url.DELETE_LEAD}/${param}`);
export const deleteLeadPermanently = (param) =>
  api.delete(`${url.DELETE_LEAD_PERMANENTLY}/${param}`);
export const postRestoreLead = (data) =>
  api.update(url.POST_RESTORE_LEAD, data);

// Referral Methods
export const getReferrals = ({ page = 1, limit = 10 } = {}) =>
  api.get(url.GET_REFERRALS, { params: { page, limit } });
export const postReferral = (data) => api.create(url.POST_REFERRAL, data);
export const editReferral = (data) => api.put(url.EDIT_REFERRAL, data);
export const deleteReferral = (param) =>
  api.delete(`${url.DELETE_REFERRAL}/${param}`);
export const postRestoreReferral = (data) =>
  api.update(url.POST_RESTORE_REFERRAL, data);
export const getDeletedReferrals = (data) =>
  api.get(url.GET_DELETED_REFERRALS, {
    params: {
      centerIds: data,
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
export const getPendingReferrals = ({ page = 1, limit = 10 } = {}) =>
  api.get(url.GET_PENDING_REFERRALS, { params: { page, limit } });
export const approveReferral = (data) => api.update(url.APPROVE_REFERRAL, data);
export const rejectReferral = (data) => api.update(url.REJECT_REFERRAL, data);

// Medicine Method
// export const getMedicines = () => api.get(url.GET_MEDICINES);
export const getMedicines = ({ page = 1, limit = 10, search = "" } = {}) => {
  return api.get(url.GET_MEDICINES, {
    params: { page, limit, search },
  });
};
export const postMedicine = (data) => api.create(url.POST_MEDICINE, data);
export const postCSVMedicine = (data) =>
  api.create(url.POST_CSV_MEDICINE, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const postRestoreCenter = (data) => api.update(url.RESTORE_CENTER, data);
export const editMedicine = (data) => api.put(url.EDIT_MEDICINE, data);
export const deleteMedicine = (data) =>
  api.delete(`${url.DELETE_MEDICINE}/${data}`);
export const deleteMedicinePermanently = (param) =>
  api.delete(`${url.DELETE_MEDICINE_PERMANENTLY}/${param}`);
export const postRestoreMedicine = (data) =>
  api.update(url.POST_RESTORE_MEDICINE, data);
export const validateDuplicateMedicine = ({ name, strength, baseUnit, id }) => {
  return api.get(url.VALIDATE_DUPLICATE_MEDICINE, {
    params: { name, strength, baseUnit, id },
  });
};

// Billing Setting Method
//invoice
export const getAllBillItems = ({
  centerIds,
  page = 1,
  limit = 10,
  search = "",
}) =>
  api.get(url.GET_ALL_BILL_ITEMS, {
    params: {
      centerIds,
      page,
      limit,
      search,
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });

export const getBillItems = ({
  centerIds,
  page = 1,
  limit = 2000,
  search = "",
}) =>
  api.get(url.GET_BILL_ITEMS, {
    params: {
      centerIds,
      page,
      limit,
      search,
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
export const postBillItem = (data) => api.create(url.POST_BILL_ITEM, data);
// export const postRestoreBillItem = (data) => api.update(url., data);
export const editBillItem = (data) => api.put(url.EDIT_BILL_ITEM, data);

// get procedures by id
export const getProceduresByid = (proId) =>
  api.get(`${url.GET_PROCEDURES_BY_ID}/${proId}`);

export const getProceduresByCenterid = (params = {}) => {
  return axios.get(url.GET_PROCEDURES_BY_CENTER_ID, {
    params,
  });
};

export const deleteCenterInProcedure = ({ payload }) => {
  return api.delete(`${url.DETELE_CENTER_IN_PROCEDURE}`, {
    data: payload,
  });
};

export const addCentersToProcedure = (payload) =>
  api.create(url.ADD_CENTERS_IN_PROCEDURE, payload);

export const getCategoriesOfProcedures = () =>
  api.get(url.GET_CATEGORIES_OF_PROCEDURE);

export const editCenterCosts = (payload) =>
  api.update(url.EDIT_CENTER_COSTS, payload);

export const deleteBillItem = (data) =>
  api.delete(`${url.DELETE_BILL_ITEM}/${data}`);
//advance payment
export const getPaymentAccounts = (data, page, limit, search = "") =>
  api.get(url.GET_PAYMENT_ACCOUNTS, {
    params: {
      centerIds: data,
      page,
      limit,
      search,
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
export const postPaymentAccount = (data) =>
  api.create(url.POST_PAYMENT_ACCOUNT, data);
// export const postRestoreBillItem = (data) => api.update(url., data);
export const deletePaymentAccount = (data) =>
  api.delete(`${url.DELETE_PAYMENT_ACCOUNT}/${data}`);

// Patient Method
export const getPatients = (data) =>
  api.get(url.GET_PATIENTS, {
    params: {
      centerIds: data?.centerAccess,
      type: data?.type,
      skip: data?.skip,
      // `|| undefined` so the "All" gender pill (null) omits the param entirely.
      // qs.stringify serialises null as `gender=`, which would send an empty
      // value on every unfiltered request.
      gender: data?.gender || undefined,
      staffId: data?.staffId || undefined,
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
export const getAllPatients = (data) => api.get(url.GET_ALL_PATIENTS);
export const getPatientById = (data) =>
  api.get(`${url.GET_PATIENT_BY_ID}/${data}`);
export const getMorePatients = (data) =>
  api.get(url.GET_MORE_PATIENTS, {
    params: {
      centerIds: data?.centerAccess,
      type: data?.type,
      skip: data?.skip,
      gender: data?.gender || undefined,
      staffId: data?.staffId || undefined,
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
export const getPatientStaff = (data) =>
  api.get(url.GET_PATIENT_STAFF, {
    params: {
      centerIds: data?.centerAccess,
      skip: data?.skip,
      search: data?.search || undefined,
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
export const getReferralPatients = (data) =>
  api.get(url.GET_REFERRAL_PATIENTS, {
    params: {
      search: data?.search || undefined,
      skip: data?.skip,
      id: data?.id || undefined,
    },
  });
export const getReferralEmployees = (data) =>
  api.get(url.GET_REFERRAL_EMPLOYEES, {
    params: {
      type: data?.type,
      skip: data?.skip,
      search: data?.search || undefined,
      id: data?.id || undefined,
    },
  });
export const getPatientReferral = (data) =>
  api.get(url.GET_PATIENTS_REFERRAL, data);
export const getPatientCountedDocuments = (data) =>
  api.get(url.GET_PATIENT_COUNTED_DOCUMENTS, { id: data });
export const getPatientId = () => api.get(url.CREATE_PATIENT_ID);
export const getSearchPatients = (query) =>
  api.get(url.SEARCH_PATIENTS, {
    params: {
      centerIds: query?.centerAccess,
      name: query.name,
      centerId: query?.centerId,
      admittedOnly: query?.admittedOnly,
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
export const getSearchPatientPhoneNumber = (query) =>
  api.get(url.SEARCH_PATIENTS_PHONE_NUMBER, {
    params: {
      centerIds: query?.centerAccess,
      phoneNumber: query.phoneNumber,
      uid: query.uid,
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
export const postPatient = (data) =>
  api.create(url.POST_PATIENT, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const postRestorePatient = (data) =>
  api.update(url.POST_RESTORE_PATIENT, data);

export const postLeadPatient = (data) =>
  api.create(url.POST_LEAD_PATIENT, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const updateAdmissionAssignment = (data) =>
  api.put(url.UPDATE_ADMISSION_ASSIGNMENT, data);

export const updatePatientAdmission = (data) =>
  api.update(url.EDIT_ADMISSION, data);
export const setRamsayApplicable = (data) =>
  api.update(url.SET_RAMSAY_APPLICABLE, data);
export const setMorseApplicable = (data) =>
  api.update(url.SET_MORSE_APPLICABLE, data);
export const setBaselineInvestigationStatus = (data) =>
  api.update(url.SET_BASELINE_INVESTIGATION_STATUS, data);
export const setPsychologicalTestStatus = (data) =>
  api.update(url.SET_PSYCHOLOGICAL_TEST_STATUS, data);
// Override accounts only (server-enforced): empties admissionTypeHistory.
// The admission card's clinical Patient Type (Psychiatric / Addiction / Geriatric).
export const setPatientAdmissionType = (data) =>
  api.update(url.SET_PATIENT_ADMISSION_TYPE, data);
export const clearAdmissionTypeDirect = (data) =>
  api.update(url.CLEAR_ADMISSION_TYPE_DIRECT, data);
export const setAdmissionTypeDirect = (data) =>
  api.update(url.SET_ADMISSION_TYPE_DIRECT, data);
export const updateAdmissionWardBed = (data) =>
  api.update(url.UPDATE_ADMISSION_WARD_BED, data);
export const submitAdmissionForm = ({ admissionId, formData }) =>
  api.update(`${url.SUBMIT_ADMISSION_FORM}/${admissionId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const postAdmitPatient = (data) => api.update(url.ADMIT_PATIENT, data);
export const postPatientCenterSwitch = (data) =>
  api.update(url.SWITCH_PATIENT_CENTER, data);

export const postDischargePatient = (data) =>
  api.update(url.DISCHARGE_PATIENT, data);
export const postUndischargePatient = (data) =>
  api.update(url.UNDISCHARGE_PATIENT, data);
export const editPatient = (data) =>
  api.put(url.EDIT_PATIENT, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const deletePatientAadhaarCard = (data) =>
  api.update(url.DELETE_PATIENT_AADHAAR_CARD, data);
export const deletePatientPassportCard = (data) =>
  api.update(url.DELETE_PATIENT_AADHAAR_CARD, {
    ...data,
    field: "passportCard",
  });
export const removePatient = (data) =>
  api.delete(`${url.DELETE_PATIENT}/${data}`);
export const deletePatientPermanently = (data) =>
  api.delete(`${url.DELETE_PATIENT_PERMANENTLY}/${data}`);
export const assignNurseToPatient = (data) => {
  return api.update(`${url.ASSIGN_NURSE_TO_PATIENT}`, data);
};
export const unAssignNurseToPatient = (patientId) => {
  return api.update(`${url.UNASSIGN_NURSE_TO_PATIENT}?patientId=${patientId}`);
};

//Timeline
export const getPatientTimeline = (data) =>
  api.get(url.GET_PATIENT_TIMELINE, data);
export const getUserTimeline = (data) => api.get(url.GET_USER_TIMELINE, data);

// Chart Method
export const getChartsAddmissions = (data) =>
  api.get(url.GET_CHARTS_ADDMISSIONS, {
    params: {
      addmissions: [...data],
      _t: Date.now(),
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
export const getCharts = (data) => {
  const addmission = typeof data === "string" ? data : data.addmissionId;
  const chartType = typeof data === "string" ? "All" : data.chartType;
  const _t = typeof data === "string" ? Date.now() : (data._t ?? Date.now());
  return api.get(url.GET_CHARTS, { addmission, chartType, _t });
};
export const getLatestCharts = ({
  patient,
  limit,
  chartType,
  type,
  carryForwardScope,
}) =>
  api.get(
    `${url.GET_LATEST_CHARTS}?patient=${patient}&limit=${limit}` +
      `${chartType ? `&chartType=${chartType}` : ""}` +
      `${type ? `&type=${type}` : ""}` +
      `${carryForwardScope ? `&carryForwardScope=${carryForwardScope}` : ""}`,
  );
export const getGeneralCharts = (data) => api.get(url.GET_GENERAL_CHARTS, data);
export const postPrescription = (data) =>
  api.create(url.POST_PRESCRIPTION, data);
export const editPrescription = (data) => api.put(url.EDIT_PRESCRIPTION, data);
export const postGeneralPrescription = (data) =>
  api.create(url.POST_GENERAL_PRESCRIPTION, data);
export const editGeneralPrescription = (data) =>
  api.put(url.EDIT_GENERAL_PRESCRIPTION, data);
export const getCurrentMedicines = (patientId, type) =>
  api.get(
    `${url.GET_CURRENT_MEDICINES}/${patientId}`,
    type ? { type } : undefined,
  );
export const updateMedicineEntry = (prescriptionId, medicineId, data) =>
  api.update(
    `${url.UPDATE_MEDICINE_ENTRY}/${prescriptionId}/medicine/${medicineId}`,
    data,
  );

export const getCarryForward = (patientId) =>
  api.get(`${url.CARRY_FORWARD}/${patientId}`);
export const toggleCarryForward = (patientId, chartId) =>
  api.create(`${url.CARRY_FORWARD}/toggle`, { patientId, chartId });
export const clearCarryForward = (patientId) =>
  api.delete(`${url.CARRY_FORWARD}/${patientId}`);
export const postVitalSign = (data) => api.create(url.POST_VITAL_SIGN, data);
export const editVitalSign = (data) => api.put(url.EDIT_VITAL_SIGN, data);
export const postGeneralVitalSign = (data) =>
  api.create(url.POST_GENERAL_VITAL_SIGN, data);
export const editGeneralVitalSign = (data) =>
  api.put(url.EDIT_GENERAL_VITAL_SIGN, data);
export const postElderlyFunctionalChecklist = (data) =>
  api.create(url.POST_ELDERLY_FUNCTIONAL_CHECKLIST, data);
export const editElderlyFunctionalChecklist = (data) =>
  api.put(url.EDIT_ELDERLY_FUNCTIONAL_CHECKLIST, data);
export const postAdmissionType = (data) =>
  api.create(url.POST_ADMISSION_TYPE, data);
export const editAdmissionType = (data) =>
  api.put(url.EDIT_ADMISSION_TYPE, data);
export const postEctSession = (data) => api.create(url.POST_ECT_SESSION, data);
export const editEctSession = (data) => api.put(url.EDIT_ECT_SESSION, data);
export const postGeneralEctSession = (data) =>
  api.create(url.POST_GENERAL_ECT_SESSION, data);
export const editGeneralEctSession = (data) =>
  api.put(url.EDIT_GENERAL_ECT_SESSION, data);
export const postClinicalNote = (data, config = {}) =>
  api.create(url.POST_CLINICAL_NOTE, data, {
    ...config,
    headers: { ...config.headers, "Content-Type": "multipart/form-data" },
  });
export const editClinicalNote = (data, config = {}) =>
  api.put(url.EDIT_CLINICAL_NOTE, data, {
    ...config,
    headers: { ...config.headers, "Content-Type": "multipart/form-data" },
  });
export const postCounsellingNote = (data) =>
  api.create(url.POST_COUNSELLING_NOTE, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const postGeneralCounsellingNote = (data) =>
  api.create(url.POST_GENERAL_COUNSELLING_NOTE, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const editCounsellingNote = (data) =>
  api.put(url.EDIT_COUNSELLING_NOTE, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const deleteCounsellingNoteFile = (data) =>
  api.update(url.DELETE_COUNSELLING_NOTE_FILE, data);
export const getCounsellingNote = (data) =>
  api.get(url.GET_COUNSELLING_NOTE, data);
export const postGeneralClinicalNote = (data) =>
  api.create(url.POST_GENERAL_CLINICAL_NOTE, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const editGeneralClinicalNote = (data) =>
  api.put(url.EDIT_GENERAL_CLINICAL_NOTE, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const deleteClinicalNoteFile = (data) =>
  api.update(url.DELETE_CLINICAL_NOTE_FILE, data);
export const postLabReport = (data) =>
  api.create(url.POST_LAB_REPORT, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const editLabReport = (data) =>
  api.put(url.EDIT_LAB_REPORT, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const deleteLabReportFile = (data) =>
  api.update(url.DELETE_LAB_REPORT_FILE, data);
export const postGeneralLabReport = (data) =>
  api.create(url.POST_GENERAL_LAB_REPORT, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const editGeneralLabReport = (data) =>
  api.put(url.EDIT_GENERAL_LAB_REPORT, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
// Input - Output chart
export const postInputOutput = (data) =>
  api.create(url.POST_INPUT_OUTPUT, data);
export const editInputOutput = (data) => api.put(url.EDIT_INPUT_OUTPUT, data);
export const postGeneralInputOutput = (data) =>
  api.create(url.POST_GENERAL_INPUT_OUTPUT, data);
// Nurse SOS Procedure chart
export const postNurseSosProcedure = (data) =>
  api.create(url.POST_NURSE_SOS_PROCEDURE, data);
export const editNurseSosProcedure = (data) =>
  api.put(url.EDIT_NURSE_SOS_PROCEDURE, data);
export const postGeneralNurseSosProcedure = (data) =>
  api.create(url.POST_GENERAL_NURSE_SOS_PROCEDURE, data);
// Patient Injury Marks chart
export const postInjuryMarks = (data) =>
  api.create(url.POST_INJURY_MARKS, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const editInjuryMarks = (data) =>
  api.put(url.EDIT_INJURY_MARKS, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const postGeneralInjuryMarks = (data) =>
  api.create(url.POST_GENERAL_INJURY_MARKS, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const deleteInjuryMarksFile = (data) =>
  api.update(url.DELETE_INJURY_MARKS_FILE, data);

export const generateLabReport = (data) =>
  api.create(url.GENERATE_LAB_SUMMARY, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const postRealtiveVisit = (data) =>
  api.create(url.POST_RELATIVE_VISIT, data);
export const editRealtiveVisit = (data) =>
  api.put(url.EDIT_RELATIVE_VISIT, data);
export const postGeneralRealtiveVisit = (data) =>
  api.create(url.POST_GENERAL_RELATIVE_VISIT, data);
export const editGeneralRealtiveVisit = (data) =>
  api.put(url.EDIT_GENERAL_RELATIVE_VISIT, data);
export const postOutpass = (data) => api.create(url.POST_OUTPASS, data);
export const editOutpass = (data) => api.put(url.EDIT_OUTPASS, data);
export const postDischargeSummary = (data) =>
  api.create(url.POST_DISCHARGE_SUMMARY, data);
export const editDischargeSummary = (data) =>
  api.put(url.EDIT_DISCHARGE_SUMMARY, data);
export const postExpirySummary = (data) =>
  api.create(url.POST_EXPIRY_SUMMARY, data);
export const editExpirySummary = (data) =>
  api.put(url.EDIT_EXPIRY_SUMMARY, data);
export const postDetailAdmission = (data) =>
  api.create(url.POST_DETAIL_ADMISSION, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const editDetailAdmission = (data) =>
  api.put(url.EDIT_DETAIL_ADMISSION, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const validateChart = (chartId) =>
  api.update(`/chart/${chartId}/validate`);
export const carryForwardDetailAdmission = (data) =>
  api.create(url.POST_CARRY_FORWARD_DETAIL_ADMISSION, data);
export const uploadDetailAdmissionAudio = (data, config = {}) =>
  api.create(url.POST_DETAIL_ADMISSION_AUDIO_UPLOAD, data, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 600000,
    ...config,
  });
export const generateDetailAdmissionAudio = (data, config = {}) =>
  api.create(url.POST_DETAIL_ADMISSION_AUDIO_GENERATE, data, config);
export const abortDetailAdmissionAudio = (data, config = {}) =>
  api.create(url.POST_DETAIL_ADMISSION_AUDIO_ABORT, data, config);
export const postGeneralDetailAdmission = (data) =>
  api.create(url.POST_GENERAL_DETAIL_ADMISSION, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const editGeneralDetailAdmission = (data) =>
  api.put(url.EDIT_GENERAL_DETAIL_ADMISSION, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const deleteDetailAdmissionFile = (data) =>
  api.update(url.DELETE_DETAIL_ADMISSION_FILE, data);
export const getFinalDiagnosis = (addmission) =>
  api.get(url.GET_FINAL_DIAGNOSIS, { addmission });

export const postMentalExamination = (data) => {
  return api.create(url.POST_MENTAL_EXAMINATION, data);
};
export const postGeneralMentalExamintion = (data) => {
  return api.create(url.POST_GENERAL_MENTAL_EXAMINATION, data);
};

export const editMentalExamination = (data) => {
  return api.put(url.EDIT_MENTAL_EXAMINATION, data);
};

export const getLastMentalExamination = (params = {}) => {
  return api.get(url.LAST_MENTAL_EXAMINATION, params);
};

// Latest ECT session for a patient, used to prefill a new one.
export const getLastEctSession = (params = {}) => {
  return api.get(url.LAST_ECT_SESSION, params);
};

export const deleteChart = (data) => api.delete(`${url.DELETE_CHART}/${data}`);
export const deleteChartPermanently = (param) =>
  api.delete(`${url.DELETE_CHART_PERMANENTLY}/${param}`);
export const postRestoreChart = (data) =>
  api.update(url.POST_RESTORE_CHART, data);
//OPD
export const getOPDPrescription = (data) =>
  api.get(url.GET_OPD_PRESCRIPTION, data);

// Bill Method
export const getBillsAddmissions = (data) =>
  api.get(url.GET_BILLS_ADDMISSIONS, {
    params: {
      addmissions: [...data],
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
export const getBills = (data) => api.get(url.GET_BILLS, { addmission: data });
export const getPatientLedger = (data) =>
  api.get(
    url.GET_PATIENT_LEDGER,
    typeof data === "object" && data !== null ? data : { patient: data },
  );
export const getDraftBills = (data) => api.get(url.GET_DRAFT_BILLS, data);
const multipartConfig = (data) =>
  data instanceof FormData
    ? { headers: { "Content-Type": "multipart/form-data" } }
    : undefined;

export const postInvoice = (data) =>
  api.create(url.POST_INVOICE, data, multipartConfig(data));
export const postDeposit = (data) =>
  api.create(url.POST_DEPOSIT, data, multipartConfig(data));
export const editDeposit = (data) =>
  api.put(url.EDIT_DEPOSIT, data, multipartConfig(data));
export const convertDepositToAdvance = (data) =>
  api.put(url.CONVERT_DEPOSIT_TO_ADVANCE, data);
export const postDraftInvoice = (data) =>
  api.create(url.POST_DRAFT_INVOICE, data);
export const postDraftToInvoice = (data) =>
  api.create(url.POST_DRAFT_TO_INVOICE, data);
export const editDraftInvoice = (data) => api.put(url.EDIT_DRAFT_INVOICE, data);
export const editInvoice = (data) =>
  api.put(url.EDIT_INVOICE, data, multipartConfig(data));
export const postAdvancePayment = (data) =>
  api.create(url.POST_ADVANCE_PAYMENT, data, multipartConfig(data));
export const editAdvancePayment = (data) =>
  api.put(url.EDIT_ADVANCE_PAYMENT, data, multipartConfig(data));
export const deleteDraftBill = (data) =>
  api.delete(`${url.DELETE_DRAFT_BILL}/${data}`);
export const deleteBill = (data) => api.delete(`${url.DELETE_BILL}/${data}`);
export const deleteBillPermanently = (param) =>
  api.delete(`${url.DELETE_BILL_PERMANENTLY}/${param}`);
export const postRestoreBill = (data) =>
  api.update(url.POST_RESTORE_BILL, data);

// Pine Labs POS terminal
export const getPosTerminal = (centerId) =>
  api.get(`${url.GET_POS_TERMINAL}/${centerId}`);
export const postPosInitiate = (data) =>
  api.create(url.POST_POS_INITIATE, data);
export const getPosStatus = (id) => api.get(`${url.GET_POS_STATUS}/${id}`);
export const postPosCancel = (id) =>
  api.create(`${url.POST_POS_CANCEL}/${id}`, {});
export const getPosPending = (params) => api.get(url.GET_POS_PENDING, params);
export const getPosTransactions = (params) =>
  api.get(url.GET_POS_TRANSACTIONS, params);
export const postPosRefund = (id, data) =>
  api.create(`${url.POST_POS_REFUND}/${id}`, data);

// Write Off
export const getWriteOff = (data) => {
  return axios.get(url.GET_WRITE_OFF, {
    params: {
      patient: data.patient,
      addmission: data.addmission,
      center: data.center,
    },
  });
};
export const postWriteOff = (payload) =>
  api.create(url.POST_WRITE_OFF, payload);

//recyclebin
export const getDeletedCenters = (data) =>
  api.get(url.GET_DELETED_CENTERS, {
    params: {
      centerIds: data,
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
export const getDeletedPatients = (data) =>
  api.get(url.GET_DELETED_PATIENTS, {
    params: {
      centerIds: data,
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
export const getDeletedCharts = (data) =>
  api.get(url.GET_DELETED_CHARTS, {
    params: {
      centerIds: data,
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });

export const addAdditionDetails = (data) => {
  return axios.post(url.ADDITIONAL_DETAILS, data);
};

export const getAdditionalDetails = (params) => {
  return axios.get(url.GET_ADDITIONAL_DETAILS, { params });
};

export const getDeletedBills = (data) =>
  api.get(url.GET_DELETED_BILLS, {
    params: {
      centerIds: data,
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
export const getDeletedLeads = (data) =>
  api.get(url.GET_DELETED_LEADS, {
    params: {
      centerIds: data,
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });

export const getDeletedMedicines = (data) =>
  api.get(url.GET_DELETED_MEDICINES, {
    params: {
      centerIds: data,
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });

//Booking
export const getAppointments = (data) =>
  api.get(url.GET_APPOINTMENTS, {
    params: {
      centerIds: data?.centerAccess,
      start: data?.start,
      end: data?.end,
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });

export const getPatientAppointments = (data) =>
  api.get(url.GET_PATIENT_APPOINTMENTS, data);
export const getPatientAppointmentData = (data) =>
  api.get(url.GET_PATIENT_APPOINTMENT_DATA, data);
export const getPatientPreviousDoctor = (data) =>
  api.get(url.GET_PATIENT_PREVIOUS_DOCTOR, data);
export const postAppointment = (data) => api.create(url.POST_APPOINTMENT, data);
export const editAppointment = (data) => api.put(url.EDIT_APPOINTMENT, data);
export const postCancelAppointment = (data) =>
  api.update(url.CANCEL_APPOINTMENT, data);
export const deleteAppointment = (data) =>
  api.delete(`${url.DELETE_APPOINTMENT}/${data}`);
export const deleteAppointmentPermanently = (param) =>
  api.delete(`${url.DELETE_APPOINTMENT_PERMANENTLY}/${param}`);
export const postRestoreAppointment = (data) =>
  api.update(url.RESTORE_APPOINTMENT, data);
//Setting
//Doctor schedule
export const getAllDoctorSchedule = (data) =>
  api.get(url.GET_ALL_DOCTOR_SCHEDULE, data);
export const getDoctorSchedule = (data) =>
  api.get(url.GET_DOCTOR_AVAILABLE_SLOTS, data);
export const postDoctorSchedule = (data) =>
  api.create(url.POST_DOCTOR_SCHEDULE, data);
export const postDoctorScheduleNew = (data) =>
  api.create(url.GET_DOCTOR_SCHEDULE_NEW, data);
export const editDoctorSchedule = (data) =>
  api.put(url.EDIT_DOCTOR_SCHEDULE, data);

//Calender
export const postCalenderDuration = (data) =>
  api.create(url.POST_CALENDER_DURATION, data);
export const getCalenderDuration = (data) =>
  api.get(url.GET_CALENDER_DURATION, data);
export const editCalenderDuration = (data) =>
  api.put(url.EDIT_CALENDER_DURATION, data);

//Therapy
export const getTherapies = (data) => api.get(url.GET_THERAPIES, data);
export const postTherapy = (data) => api.create(url.POST_THERAPY, data);
export const editTherapy = (data) => api.put(url.EDIT_THERAPY, data);
export const deleteTherapy = (data) =>
  api.delete(`${url.DELETE_THERAPY}/${data}`);

//Job roles (User.role options, Setting → User Roles)
export const getJobRoles = (params) => api.get(url.JOB_ROLES, params);
export const postJobRole = (data) => api.create(url.JOB_ROLES, data);
export const editJobRole = (id, data) => api.put(`${url.JOB_ROLES}/${id}`, data);
export const deleteJobRole = (id) => api.delete(`${url.JOB_ROLES}/${id}`);

//Condition
export const getConditions = (data) => api.get(url.GET_CONDITIONS, data);
export const postCondition = (data) => api.create(url.POST_CONDITION, data);
export const editCondition = (data) => api.put(url.EDIT_CONDITION, data);
export const deleteCondition = (data) =>
  api.delete(`${url.DELETE_CONDITION}/${data}`);

//Symptom
export const getSymptoms = (data) => api.get(url.GET_SYMPTOMS, data);
export const postSymptom = (data) => api.create(url.POST_SYMPTOM, data);
export const editSymptom = (data) => api.put(url.EDIT_SYMPTOM, data);
export const deleteSymptom = (data) =>
  api.delete(`${url.DELETE_SYMPTOM}/${data}`);

//Report
export const getReport = (data) =>
  api.get(url.GET_REPORT, {
    params: data,
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
export const getReportUpdated = (data) =>
  api.get(url.GET_REPORT_UPDATED, {
    params: data,
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
export const getTransactionsAnalytics = (data) =>
  api.get(url.GET_TRANSACTIONS_ANALYTICS, {
    params: data,
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
export const exportTransactionsAnalyticsCSV = (data) =>
  api.get(url.GET_TRANSACTIONS_ANALYTICS_CSV, {
    params: data,
    responseType: "blob",
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
export const getDBLogs = (data) =>
  api.get(url.GET_DB_LOGS, {
    params: data,
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
export const getFinanceAnalytics = (data) =>
  api.get(url.GET_FINANCE_ANALYTICS, {
    params: data,
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
export const exportFinanceAnalyticsCSV = (data) =>
  api.get(url.GET_FINANCE_ANALYTICS_CSV, {
    params: data,
    responseType: "blob",
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
export const getPatientAnalytics = (data) =>
  api.get(url.GET_PATIENT_ANALYTICS, {
    params: data,
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
export const getLeadAnalytics = (data) =>
  api.get(url.GET_LEAD_ANALYTICS, {
    params: data,
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
export const getOPDAnalytics = (data) =>
  api.get(url.GET_OPD_ANALYTICS, {
    params: data,
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
export const getBookingAnalytics = (data) =>
  api.get(url.GET_BOOKING_ANALYTICS, {
    params: data,
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
export const getAdmissionForms = (data) =>
  api.get(url.GET_ADMISSION_FORMS, {
    params: data,
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
export const exportAdmissionFormsCSV = (data) =>
  api.get(url.GET_ADMISSION_FORMS_CSV, {
    params: data,
    responseType: "blob",
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });

export const getAdvancePaymentDepositAnalytics = (data) =>
  api.get(url.GET_ADVANCE_PAYMENT_DEPOSIT_ANALYTICS, {
    params: data,
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });

export const exportAdvancePaymentDepositCSV = (data) =>
  api.get(url.GET_ADVANCE_PAYMENT_DEPOSIT_CSV, {
    params: data,
    responseType: "blob",
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });

export const getDoctorAnalytics = (params = {}) => {
  return api.create(url.GET_DOCTOR_ANALYTICS, params, {
    headers: { "Content-Type": "application/json" },
  });
};
export const getDoctorAnalyticsWP = (params = {}) => {
  return api.create(url.GET_DOCTOR_ANALYTICS_WP, params, {
    headers: { "Content-Type": "application/json" },
  });
};

//Notification
export const getBillNotification = (data) =>
  api.get(url.GET_BILL_NOTIFICATION, {
    params: {
      centerIds: data,
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });

//Intern
export const addInternForm = (data) =>
  api.create(url.POST_INTERN_FORM, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const fetchAllInterns = (params = {}) => {
  return api.get(url.GET_INTERN_DATA, {
    params,
    paramsSerializer: (params) =>
      qs.stringify(params, { arrayFormat: "repeat", skipNulls: true }),
  });
};

export const getInternId = () => api.get(url.GET_INTERN_ID);

export const getInternById = (id) => api.get(url.GET_INTERN_BY_ID(id));

export const addInternReceipt = (data) =>
  api.create(url.ADD_INTERN_RECEIPT, data, {
    headers: { "Content-Type": "application/json" },
  });

export const getInternReceipt = (internId) => {
  return api.get(url.GET_INTERN_RECEIPT(internId));
};

export const updateInternForm = (id, data) => {
  return api.put(url.UPDATE_INTERN_FORM(id), data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const removeIntern = (id) => api.delete(`${url.DELETE_INTERN}/${id}`);
export const permenentremoveIntern = (id) =>
  api.delete(`${url.DELETE_INTERN}permenent-delete/${id}`);
export const removeInternBill = (id) =>
  api.delete(`${url.DELETE_INTERN_BILL}/${id}`);

export const updateInternReceipt = (data) => {
  return api.put(url.UPDATE_INTERN_RECEIPT, data);
};

export const add_offer_helper = (data) =>
  api.create(url.ADD_OFFER, data, {
    headers: { "Content-Type": "application/json" },
  });

export const getOfferList = ({ page = 1, limit = 10, search = "" } = {}) => {
  return api.get(url.GET_OFFER_LIST, { page, limit, search });
};

export const updateOffer = (data) => {
  return api.put(url.UPDATE_OFFER, data, {
    headers: { "Content-Type": "application/json" },
  });
};

export const add_tax_helper = (data) =>
  api.create(url.ADD_TAX, data, {
    headers: { "Content-Type": "application/json" },
  });

export const getTaxList = ({ page = 1, limit = 10, search = "" } = {}) => {
  return api.get(url.GET_TAX_LIST, { page, limit, search });
};

export const updateTax = (data) => {
  return api.put(url.UPDATE_TAX, data, {
    headers: { "Content-Type": "application/json" },
  });
};

export const getHubspotContacts = ({
  page = 1,
  limit = 10,
  search = "",
  visitDate,
  status,
  centers,
} = {}) => {
  return api.get(url.GET_HUBSPOT_CONTACTS, {
    params: { page, limit, search, visitDate, status, centers },
  });
};

export const getNurseAssignedPatients = (params = {}) => {
  return api.create(url.GET_NURSE_ASSIGNED_PATIENTS, params, {
    headers: { "Content-Type": "application/json" },
  });
};

export const getPatientOverview = (patientId) => {
  return api.get(`${url.GET_PATIENT_OVERVIEW_BY_NURSE}?patientId=${patientId}`);
};
export const getPatientDetails = (patientId) => {
  return api.get(`${url.GET_PATIENT_DETAILS_BY_NURSE}?patientId=${patientId}`);
};

export const getPatientPrescription = (patientId) => {
  return api.get(
    `${url.GET_PATIENT_PRESCRIPTION_BY_NURSE}?patientId=${patientId}`,
  );
};

export const getClinicalTestSummary = (patientId) => {
  return api.get(
    `${url.GET_CLININCAL_TEST_SUMMARY_BY_NURSE}?patientId=${patientId}`,
  );
};

export const getNursesListByPatientCenter = ({ patientId, search } = {}) => {
  return api.get(
    `${url.GET_NURSES_BY_PATIENT_CENTER}?patientId=${patientId}&search=${search}`,
  );
};

export const getAlertsByPatient = (patientId) => {
  return api.get(`${url.GET_ALERTS_BY_PATIENT}?patientId=${patientId}`);
};

export const markAlertAsRead = ({ alertType, patientId }) => {
  return api.update(
    `${url.MARK_ALERT_AS_READ}?alertType=${alertType}&patientId=${patientId}`,
  );
};

export const getNotesByPatient = (patientId) => {
  return api.get(`${url.NOTES}?patientId=${patientId}`);
};

export const createNote = (data) => {
  return api.create(url.NOTES, data, {
    headers: { "Content-Type": "application/json" },
  });
};

export const getRoundNotesList = (params = {}) => {
  return api.get(url.ROUND_NOTES, {
    params,
    paramsSerializer: (parameters) =>
      qs.stringify(parameters, {
        arrayFormat: "repeat",
        skipNulls: true,
      }),
  });
};

export const postRoundNote = (data) => {
  return api.create(url.ROUND_NOTES, data, {
    headers: { "Content-Type": "application/json" },
  });
};

export const putRoundNote = (id, data) => {
  return api.put(`${url.ROUND_NOTES}/${id}`, data, {
    headers: { "Content-Type": "application/json" },
  });
};

export const deleteRoundNote = (id) => {
  return api.delete(`${url.ROUND_NOTES}/${id}`);
};

export const getRoundNoteStaff = ({
  search = "",
  centerAccess = "[]",
} = {}) => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  params.append("centerAccess", centerAccess);
  return api.get(`${url.ROUND_NOTES_STAFF}?${params.toString()}`);
};

export const getPendingActiveMedicines = (patientId) => {
  return api.get(`${url.GET_PENDING_ACTIVE_MEDICINES}?patientId=${patientId}`);
};

export const getCompletedActiveMedicines = ({ patientId, status }) => {
  return api.get(
    `${url.GET_ACTIVITIES_BY_STATUS}?patientId=${patientId}&status=${status}`,
  );
};

export const getActivitiesByStatus = ({
  patientId,
  prescriptionId,
  status,
  page = 1,
  limit = 10,
}) => {
  return api.get(
    `${url.GET_ACTIVITIES_BY_STATUS}?patientId=${patientId}&prescriptionId=${prescriptionId}&status=${status}&page=${page}&limit=${limit}`,
  );
};

export const getDailyMedicationRecord = ({ patientId, date }) =>
  api.get(
    `${url.GET_DAILY_MEDICATION_RECORD}?patientId=${patientId}` +
      `${date ? `&date=${date}` : ""}`,
  );

export const getPrescriptionHistory = (patientId) => {
  return api.get(`${url.GET_PRESCRIPTION_HISTORY}?patientId=${patientId}`);
};

export const markTomorrowMedicines = (data) => {
  return api.create(url.MARK_MEDICINE_AS_GIVEN, data, {
    headers: { "Content-Type": "application/json" },
  });
};

export const getNextDayMedicineBoxFillingMedicines = (patientId) => {
  return api.get(
    `${url.GET_NEXT_DAY_MEDICINEBOXFILLING_MEDICINES}?patientId=${patientId}`,
  );
};

export const getNurseGivenMedicines = (params = {}) => {
  return api.get(url.GET_NURSE_GIVEN_MEDICINES, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (parameters) =>
      qs.stringify(parameters, {
        arrayFormat: "repeat",
        skipNulls: true,
      }),
  });
};

export const getTodayMedicinesToGive = (params = {}) => {
  return api.get(url.GET_TODAY_MEDICINES_TO_GIVE, {
    params,
    paramsSerializer: (parameters) =>
      qs.stringify(parameters, {
        arrayFormat: "repeat",
        skipNulls: true,
      }),
  });
};

export const markTodayMedicineGiven = (data) => {
  return api.create(url.MARK_TODAY_MEDICINE_GIVEN, data, {
    headers: { "Content-Type": "application/json" },
  });
};

export const markTodayMedicinesGivenBulk = (data) => {
  return api.create(url.MARK_TODAY_MEDICINES_GIVEN_BULK, data, {
    headers: { "Content-Type": "application/json" },
  });
};

export const getTodayGivenMedicineHistory = (params = {}) => {
  return api.get(url.GET_TODAY_GIVEN_MEDICINE_HISTORY, {
    params,
    paramsSerializer: (parameters) =>
      qs.stringify(parameters, {
        arrayFormat: "repeat",
        skipNulls: true,
      }),
  });
};

export const getNurseGivenMedicineDetails = (params = {}) => {
  return api.get(url.GET_NURSE_GIVEN_MEDICINE_DETAILS, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

// emergency
export const assignPatientType = ({ patientId, patientType }) => {
  return api.update(
    `${url.ASSIGN_TYPE_TO_PATIENT}?patientId=${patientId}&patientType=${patientType}`,
  );
};

export const getAllEmergencyPatients = (params = {}) => {
  return api.create(url.GET_EMERGENCY_PATIENTS, params, {
    headers: { "Content-Type": "application/json" },
  });
};

export const getSopOverview = (admissionId, currentDate) => {
  return api.get(`${url.GET_SOP_OVERVIEW}/${admissionId}`, {
    params: { currentDate },
  });
};

export const getICDCodes = () => {
  return api.get(url.GET_ICD_CODES);
};

// Belongings
export const searchBelongings = (search) => {
  return api.get(url.SEARCH_BELONGINGS, {
    params: {
      q: encodeURIComponent(search),
    },
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const compressPatientBelongingFile = (formData) => {
  return api.create(url.COMPRESS_PATIENT_BELONGING, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      "X-No-Cookie-Token": "true",
    },
    responseType: "blob",
  });
};

export const createPatientBelonging = (data) => {
  return api.create(url.PATIENT_BELONGING, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const updatePatientBelonging = (id, data) => {
  return api.update(`${url.PATIENT_BELONGING}/${id}`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const uploadSignedBelonging = (id, formData) => {
  return api.update(`${url.PATIENT_BELONGING}/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getPatientBelongings = (patientId) => {
  return api.get(url.PATIENT_BELONGING, {
    params: { patient: patientId },
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getPatientBelongingById = (id) => {
  return api.get(`${url.PATIENT_BELONGING}/${id}`, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const deletePatientBelonging = (id) => {
  return api.delete(`${url.PATIENT_BELONGING}/${id}`, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

// cash management
export const postBankDeposit = (data) => {
  return api.create(url.ADD_BANK_DEPOSIT, data, {
    headers: {
      "X-No-Cookie-Token": "true",
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getLatestBankDesposits = (params = {}) => {
  return api.create(url.GET_LATEST_BANK_DEPOSITS, params, {
    headers: {
      "X-No-Cookie-Token": "true",
      "Content-Type": "application/json",
    },
  });
};

export const getLatestSpendings = (params = {}) => {
  return api.create(url.GET_LATEST_SPENDING, params, {
    headers: {
      "X-No-Cookie-Token": "true",
      "Content-Type": "application/json",
    },
  });
};

export const postSpending = (data) => {
  return api.create(url.ADD_SPENDING, data, {
    headers: {
      "X-No-Cookie-Token": "true",
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getBaseBalanceByCenter = (centerId) => {
  return api.get(`${url.GET_BASE_BALANCE_BY_CENTER}/${centerId}`, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const postBaseBalance = (data) => {
  return api.create(url.ADD_BASE_BALANCE, data, {
    headers: {
      "X-No-Cookie-Token": "true",
      "Content-Type": "multipart/form-data",
    },
  });
};

export const postInflow = (data) => {
  return api.create(url.ADD_INFLOW, data, {
    headers: {
      "X-No-Cookie-Token": "true",
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getLatestInflows = (params = {}) => {
  return api.get(url.GET_LASTEST_INFLOWS, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
};

export const postCashReco = (data) => {
  return api.create(url.ADD_CASH_RECO, data, {
    headers: {
      "X-No-Cookie-Token": "true",
      "Content-Type": "application/json",
    },
  });
};

export const getCashRecoList = (params = {}) => {
  return api.get(url.GET_CASH_RECOS, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
};

export const putCashReco = (id, data) => {
  return api.put(`${url.ADD_CASH_RECO}/${id}`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
      "Content-Type": "application/json",
    },
  });
};

export const removeCashReco = (id) => {
  return api.delete(`${url.ADD_CASH_RECO}/${id}`, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getCashRecoDayStatus = (params = {}) => {
  return api.create(url.CASH_RECO_DAY_STATUS, params, {
    headers: {
      "X-No-Cookie-Token": "true",
      "Content-Type": "application/json",
    },
  });
};

export const getCashRecoComparison = (id) => {
  return api.create(
    `${url.ADD_CASH_RECO}/${id}/comparison`,
    {},
    {
      headers: {
        "X-No-Cookie-Token": "true",
        "Content-Type": "application/json",
      },
    },
  );
};

export const confirmCashRecoEntry = (id, data) => {
  return api.create(`${url.ADD_CASH_RECO}/${id}/confirm`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
      "Content-Type": "application/json",
    },
  });
};

export const getDetailedCashReport = (params = {}) => {
  return api.create(url.GET_DETAILED_CASH_REPORT, params, {
    headers: {
      "X-No-Cookie-Token": "true",
      // "Content-Type": "application/json",
    },
    responseType: params.exportExcel ? "blob" : "json",
  });
};

export const getSummaryCashReport = (params = {}) => {
  return api.create(url.GET_SUMMARY_CASH_REPORT, params, {
    headers: {
      "X-No-Cookie-Token": "true",
      "Content-Type": "application/json",
    },
  });
};

export const getDateRangeReport = (params = {}) => {
  return api.create(url.GET_DATE_RANGE_REPORT, params, {
    headers: {
      "X-No-Cookie-Token": "true",
      "Content-Type": "application/json",
    },
  });
};

// central payment
export const getCentralPayments = (params = {}) => {
  return api.get(url.CENTRAL_PAYMENT, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
      "Content-Type": "application/json",
    },
    paramsSerializer: (params) =>
      qs.stringify(params, { arrayFormat: "repeat" }),
  });
};

export const getSummaryCentralReport = (params = {}) => {
  return api.get(url.GET_SUMMARY_CENTRAL_PAYMENT_REPORT, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
      "Content-Type": "application/json",
    },
    paramsSerializer: (params) =>
      qs.stringify(params, { arrayFormat: "repeat" }),
  });
};

export const getDetailedCentralReport = (params = {}) => {
  return api.get(url.GET_DETAILED_CENTRAL_PAYMENT_REPORT, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
      "Content-Type": "application/json",
    },
    paramsSerializer: (params) =>
      qs.stringify(params, { arrayFormat: "repeat" }),
  });
};

export const exportDetailedCentralReportXLSX = (params = {}) => {
  return api.get(url.EXPORT_DETAILED_CENTRAL_PAYMENT_REPORT, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    responseType: "blob",
  });
};

export const postCentralPayment = (data) => {
  return api.create(url.CENTRAL_PAYMENT, data, {
    headers: {
      "X-No-Cookie-Token": "true",
      "Content-Type": "multipart/form-data",
    },
  });
};

export const editCentralPayment = (id, data) => {
  return api.update(`${url.CENTRAL_PAYMENT}/${id}`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
      "Content-Type": "multipart/form-data",
    },
  });
};

export const centralPaymentAction = (data) => {
  return api.update(url.CENTRAL_PAYMENT_ACTION, data, {
    headers: {
      "X-No-Cookie-Token": "true",
      "Content-Type": "application/json",
    },
  });
};

export const getCentralPaymentById = (paymentId) => {
  return api.get(`${url.CENTRAL_PAYMENT}/${paymentId}`, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getAllENets = (params = {}) => {
  return api.get(`${url.GET_ALL_ENETS}`, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) =>
      qs.stringify(params, { arrayFormat: "repeat" }),
  });
};

export const updateCentralPaymentProcessStatus = (params = {}) => {
  return api.update(url.PROCESS_PAYMENTS, params, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) =>
      qs.stringify(params, { arrayFormat: "repeat" }),
  });
};

export const regenerateENets = (params = {}) => {
  return api.update(url.REGENERATE_ENETS, params, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) =>
      qs.stringify(params, { arrayFormat: "repeat" }),
  });
};

export const uploadTransactionProof = (id, data) => {
  return api.update(`${url.UPLOAD_TRANSACTION_PROOF}/${id}`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
      "Content-Type": "multipart/form-data",
    },
  });
};

//  User Microservices
export const PostLoginService = (data) =>
  userService.post(url.MICRO_SIGN_IN, data);
export const GetCsrf = () => userService.get(url.CSRF);
// Roles
export const getAllRoles = ({ page = 1, limit = 10, search = "", token }) => {
  return userService.get(url.ROLES, {
    params: { page, limit, search },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const postLogoutService = (token) => {
  return userService.post(
    url.MICRO_LOGOUT,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const getAllRoleslist = ({ token, search = "" }) => {
  return userService.get(`${url.ROLES}/role-list`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      search,
    },
  });
};

export const editRole = ({ id, name, permissions, token }) => {
  return userService.put(
    `${url.ROLES}/${id}`,
    {
      name,
      permissions,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-No-Cookie-Token": "true",
      },
    },
  );
};

export const addRole = ({ name, permissions, token }) => {
  return userService.post(
    url.ROLES,
    {
      name,
      permissions,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-No-Cookie-Token": "true",
      },
    },
  );
};

export const deleteRole = ({ id, token }) => {
  return userService.delete(`${url.ROLES}/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
// Users
export const getAllUsers = ({
  page = 1,
  limit = 10,
  search = "",
  role = "",
  token,
  centerAccess,
  sortBy,
}) => {
  return userService.get(url.USER, {
    params: { page, limit, search, role, centerAccess, sortBy },
    headers: {
      Authorization: `Bearer ${token}`,
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
};

export const firstchange = ({ oldPassword, newPassword, token }) => {
  return userService.post(
    url.MICRO_FORGOTT,
    {
      oldPassword,
      newPassword,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-No-Cookie-Token": "true",
      },
    },
  );
};

export const addUser = (data, token) => {
  return userService.post(url.MICRO_SIGN_UP, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-No-Cookie-Token": "true",
      "Content-Type": "multipart/form-data",
    },
  });
};

export const editUserDetails = (data, id, token) => {
  return userService.put(`${url.USER}/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-No-Cookie-Token": "true",
      "Content-Type": "multipart/form-data",
    },
  });
};

export const deleteUser = (id, token) => {
  return userService.put(
    `${url.MOVE_TO_BIN}/${id}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const suspendUser = (id, token) => {
  return userService.patch(
    `${url.ACTIVATE_DEACTIVATE_USER}/${id}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const toggleUserAppLogin = (id, appLogin, token) => {
  return userService.patch(
    `${url.TOGGLE_APP_LOGIN}/${id}`,
    { appLogin },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const editUserPassword = (id, newPassword, token) => {
  return userService.post(
    `${url.CHANGE_USER_PASSWORD}/${id}`,
    { newPassword },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const getEmployeePayslips = (params = {}) => {
  return api.get(url.GET_EMPLOYEE_PAYSLIPS, {
    params, // ✅ nested under params
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (queryParams) => {
      return qs.stringify(queryParams, { arrayFormat: "repeat" });
    },
  });
};

export const getMyPayslips = (params = {}) => {
  return api.get(url.GET_MY_PAYSLIPS, {
    params, // ✅ same fix here too
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (queryParams) => {
      return qs.stringify(queryParams, { arrayFormat: "repeat" });
    },
  });
};

export const getEmployeePayslipById = (id) => {
  return api.get(`${url.GET_EMPLOYEE_PAYSLIPS}/${id}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const getMyPayslipById = (id) => {
  return api.get(`${url.GET_MY_PAYSLIPS}/${id}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const getMySalaryData = (params) => {
  return api.get(url.GET_MY_SALARY_DATA, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getUserActivityById = ({ id, page = 1, limit = 12, token }) => {
  return userService.get(
    `${url.USER_ACTIVITY}/?userid=${id}&page=${page}&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const editSelf = (data, token) => {
  return userService.put(url.EDIT_SELF, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getRoles = (token) => {
  return userService.get(url.GET_USER_ROLES, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getUserByEmail = (token, email) => {
  return userService.get(`${url.GET_USER_BY_EMAIL}?email=${email}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
// INCIDENT
export const getIncidents = (data) => api.get(url.GET_INCIDENTS, data);
export const getIncidentById = (id) =>
  api.get(`${url.GET_INCIDENT_BY_ID}/${id}`);
export const postIncident = (data) =>
  api.create(url.POST_INCIDENT, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const updateIncident = (id, data) =>
  api.update(`${url.UPDATE_INCIDENT}/${id}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const deleteIncident = (id) =>
  api.delete(`${url.DELETE_INCIDENT}/${id}`);
export const investigateIncident = (id, data) =>
  api.create(`${url.INVESTIGATE_INCIDENT}/${id}/investigate`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const approveIncident = (id, data) =>
  api.create(`${url.APPROVE_INCIDENT}/${id}/approve`, data);
export const closeIncident = (id, data) =>
  api.create(`${url.CLOSE_INCIDENT}/${id}/close`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateIncidentStatus = (id, data) =>
  api.update(`${url.UPDATE_INCIDENT_STATUS}/${id}/status`, data, {
    headers: { "Content-Type": "application/json" },
  });

export const downloadFailedMedicines = ({ batchId, centers } = {}) => {
  return api.get(`${url.DOWNLOAD_FAILED_MEDICINES}`, {
    params: {
      batchId,
      centers,
    },
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
    responseType: "blob",
  });
};

export const getFailedMedicinesBatches = (params = {}) => {
  return api.get(url.GET_FAILED_MEDICINES_BATCHES, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
};

export const deleteFailedMedicinesByBatch = (params = {}) => {
  return api.delete(url.DELETE_FAILED_MEDICINES, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
};

export const getMedineApprovalsByStatus = (params = {}) => {
  return api.get(url.MEDICINE_APPROVALS, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
};

export const updateMedicineApprovalStatus = (data) => {
  if (data.id) {
    return api.update(`${url.MEDICINE_APPROVALS}/${data.id}`, data, {
      headers: {
        "X-No-Cookie-Token": "true",
      },
    });
  }
};

export const getPendingPatientApprovals = (params = {}) => {
  return api.get(url.GET_PENDING_PATIENT_APPROVALS, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
};

export const getDetailedPrescription = (prescriptionId) => {
  return api.get(`${url.GET_DETAILED_PRESCRIPTION}/${prescriptionId}`, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getApprovalMedicines = (approvalId, params = {}) => {
  return api.get(
    `${url.GET_APPROVAL_MEDICINES}/${approvalId}/pilot-medicines`,
    {
      params,
      headers: {
        "X-No-Cookie-Token": "true",
      },
    },
  );
};

export const approvePilotApproval = (approvalId, data) => {
  return api.update(`${url.APPROVE_PILOT_APPROVAL}/${approvalId}/pilot`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const returnMedicine = (approvalId, data) => {
  return api.update(`${url.RETURN_MEDICINE}/${approvalId}/return`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getPharmacyReturns = (params = {}) => {
  return api.get(url.GET_PHARMACY_RETURNS, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const downloadAuditTemplate = (params) => {
  return api.get(`${url.DOWNLOAD_AUDIT_TEMPLATE}`, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
    responseType: "blob",
  });
};

export const getAuditsByStatus = (params) => {
  return api.get(url.AUDITS, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
};

export const uploadAuditChunk = (data) => {
  return api.create(url.UPLOAD_AUDIT_REPORT, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const updateAuditStatus = (params = {}) => {
  return api.update(url.UPDATE_AUDIT_STATUS, params, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
};

export const getAuditDetails = (params) => {
  return api.get(url.GET_AUDIT_REPORT, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
};

export const deleteAuditById = (id) => {
  return api.delete(`${url.AUDITS}/${id}`, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const downloadAuditFailedMedicines = (id) => {
  return api.get(`${url.DOWNLOAD_AUDIT_FAILED_MEDICINES}/${id}`, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
    responseType: "blob",
  });
};

export const getPharmacyConsolidated = (params) =>
  api.get(url.PHARMACY_CONSOLIDATED, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (parameters) =>
      qs.stringify(parameters, { arrayFormat: "repeat", skipNulls: true }),
  });

// PHARMACY REQUISITION - MEDICINE REQUISITION
export const getMedicineRequisitions = (params = {}) => {
  return api.get(url.PHARMACY_MEDICINE_REQUISITION, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
    paramsSerializer: (parameters) =>
      qs.stringify(parameters, { arrayFormat: "repeat", skipNulls: true }),
  });
};

export const checkDuplicateMedicineRequisition = (params = {}) => {
  return api.get(`${url.PHARMACY_MEDICINE_REQUISITION}/check-duplicate`, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const createMedicineRequisition = (data) => {
  return api.create(url.PHARMACY_MEDICINE_REQUISITION, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const getMedicineRequisitionById = (id) => {
  return api.get(`${url.PHARMACY_MEDICINE_REQUISITION}/${id}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const editMedicineRequisition = (id, data) => {
  return api.update(`${url.PHARMACY_MEDICINE_REQUISITION}/${id}`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const approveMedicineRequisition = (id, data) => {
  return api.update(
    `${url.PHARMACY_MEDICINE_REQUISITION}/${id}/approve`,
    data,
    {
      headers: { "X-No-Cookie-Token": "true" },
    },
  );
};

export const rejectMedicineRequisition = (id, data) => {
  return api.update(`${url.PHARMACY_MEDICINE_REQUISITION}/${id}/reject`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const deleteMedicineRequisition = (id) => {
  return api.delete(`${url.PHARMACY_MEDICINE_REQUISITION}/${id}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

// COMPLIANCE TYPES
export const getComplianceTypes = (params = {}, { signal } = {}) => {
  return api.get(url.COMPLIANCE_TYPES, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
    signal,
  });
};

export const getComplianceTypeById = (id) => {
  return api.get(`${url.COMPLIANCE_TYPES}/${id}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const createComplianceType = (data) => {
  return api.create(url.COMPLIANCE_TYPES, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const editComplianceType = (id, data) => {
  return api.update(`${url.COMPLIANCE_TYPES}/${id}`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const updateComplianceTypeStatus = (id, active) => {
  return api.update(
    `${url.COMPLIANCE_TYPES}/${id}/status`,
    { active },
    { headers: { "X-No-Cookie-Token": "true" } },
  );
};

export const deleteComplianceType = (id) => {
  return api.delete(`${url.COMPLIANCE_TYPES}/${id}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

// COMPLIANCE CATEGORIES
export const getComplianceCategories = (params = {}, { signal } = {}) => {
  return api.get(url.COMPLIANCE_CATEGORIES, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
    signal,
  });
};

export const createComplianceCategory = (data) => {
  return api.create(url.COMPLIANCE_CATEGORIES, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const editComplianceCategory = (id, data) => {
  return api.update(`${url.COMPLIANCE_CATEGORIES}/${id}`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const updateComplianceCategoryStatus = (id, active) => {
  return api.update(
    `${url.COMPLIANCE_CATEGORIES}/${id}/status`,
    { active },
    { headers: { "X-No-Cookie-Token": "true" } },
  );
};

export const deleteComplianceCategory = (id) => {
  return api.delete(`${url.COMPLIANCE_CATEGORIES}/${id}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
// COMPLIANCE SUBMISSIONS
export const createComplianceSubmission = (data) => {
  return api.create(url.COMPLIANCE_SUBMISSIONS, data, {
    headers: {
      "X-No-Cookie-Token": "true",
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getComplianceSubmissions = (params = {}, { signal } = {}) => {
  return api.get(url.COMPLIANCE_SUBMISSIONS, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
    signal,
  });
};

export const getComplianceSubmissionById = (id) => {
  return api.get(`${url.COMPLIANCE_SUBMISSIONS}/${id}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const approveComplianceSubmission = (id, data = {}) => {
  return api.update(`${url.COMPLIANCE_SUBMISSIONS}/${id}/approve`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const rejectComplianceSubmission = (id, data) => {
  return api.update(`${url.COMPLIANCE_SUBMISSIONS}/${id}/reject`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

// COMPLIANCE DRAFTS
export const getMyComplianceDrafts = (params = {}, { signal } = {}) => {
  return api.get(`${url.COMPLIANCE_SUBMISSIONS}/drafts/mine`, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
    signal,
  });
};

export const getAllComplianceDrafts = (params = {}, { signal } = {}) => {
  return api.get(`${url.COMPLIANCE_SUBMISSIONS}/drafts`, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
    signal,
  });
};

export const getComplianceDraftById = (id) => {
  return api.get(`${url.COMPLIANCE_SUBMISSIONS}/drafts/${id}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const updateComplianceDraft = (id, data) => {
  return api.update(`${url.COMPLIANCE_SUBMISSIONS}/drafts/${id}`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
      "Content-Type": "multipart/form-data",
    },
  });
};

export const discardComplianceDraft = (id) => {
  return api.delete(`${url.COMPLIANCE_SUBMISSIONS}/drafts/${id}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

// COMPLIANCE RECORDS
export const getComplianceRecords = (params = {}, { signal } = {}) => {
  return api.get(url.COMPLIANCE_RECORDS, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
    signal,
  });
};

export const getComplianceRecordById = (id) => {
  return api.get(`${url.COMPLIANCE_RECORDS}/${id}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const markComplianceInRenewal = (id) => {
  return api.update(`${url.COMPLIANCE_RECORDS}/${id}/mark-in-renewal`, {}, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const getComplianceSummary = (params = {}) => {
  return api.get(`${url.COMPLIANCE_RECORDS}/summary`, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const getComplianceMatrix = (params = {}) => {
  return api.get(`${url.COMPLIANCE_RECORDS}/matrix`, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const exportComplianceOverview = (params = {}) => {
  return api.get(`${url.COMPLIANCE_RECORDS}/export`, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
    responseType: "blob",
  });
};

// PHARMACY EXPIRED STOCK
export const getExpiredStock = (params = {}) => {
  return api.get(url.PHARMACY_EXPIRED_STOCK, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
    paramsSerializer: (parameters) =>
      qs.stringify(parameters, { arrayFormat: "repeat", skipNulls: true }),
  });
};

export const getExpiredStockHistory = (params = {}) => {
  return api.get(`${url.PHARMACY_EXPIRED_STOCK}/history`, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
    paramsSerializer: (parameters) =>
      qs.stringify(parameters, { arrayFormat: "repeat", skipNulls: true }),
  });
};

// PHARMACY ACTIVITY LOG
export const getPharmacyActivity = (params = {}) => {
  return api.get(url.PHARMACY_ACTIVITY, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
    paramsSerializer: (parameters) =>
      qs.stringify(parameters, { arrayFormat: "repeat", skipNulls: true }),
  });
};

export const getExpiredStockDetails = (id, params = {}) => {
  return api.get(`${url.PHARMACY_EXPIRED_STOCK}/${id}/details`, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const discardExpiredStock = (data) => {
  return api.create(`${url.PHARMACY_EXPIRED_STOCK}/discard`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const discardAllExpiredStock = (data) => {
  return api.create(`${url.PHARMACY_EXPIRED_STOCK}/discard-all`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

// PHARMACY INVENTORY HEALTH REPORT
export const getInventoryHealthReport = (params = {}) => {
  return api.get(url.PHARMACY_INVENTORY_HEALTH_REPORT, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
    paramsSerializer: (parameters) =>
      qs.stringify(parameters, { arrayFormat: "repeat", skipNulls: true }),
    responseType: params.exportExcel ? "blob" : "json",
  });
};

// PHARMACY REQUISITION - INTERNAL TRANSFER
export const getInternalTransferRequisitions = (params = {}) => {
  return api.get(url.PHARMACY_INTERNAL_TRANSFER, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (parameters) =>
      qs.stringify(parameters, { arrayFormat: "repeat", skipNulls: true }),
  });
};

export const createInternalTransferRequisition = (data) => {
  return api.create(url.PHARMACY_INTERNAL_TRANSFER, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const searchPharmacyMedicines = (params = {}) => {
  return api.get(url.PHARMACY_MEDICINE_SEARCH, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getAvailableMedicineIds = (ids, centerId) => {
  return api.get(url.PHARMACY_AVAILABLE_MEDICINES, {
    params: { ids: ids.join(","), centerId },
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const getAlternativeMedicines = (medicineId, centerId) => {
  return api.get(url.PHARMACY_ALTERNATIVE_MEDICINES, {
    params: { medicineId, centerId },
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const getPharmacyStockByIds = (ids, centerId) => {
  return api.get(url.PHARMACY_STOCK_BY_IDS, {
    params: { ids: ids.join(","), centerId },
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const getStockByMedicineIds = (medicineIds, centerId) => {
  return api.get(url.PHARMACY_STOCK_BY_MEDICINES, {
    params: { ids: medicineIds.join(","), centerId },
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const getBatchesByMedicines = (medicineIds, centerId) => {
  return api.get(url.PHARMACY_BATCHES_BY_MEDICINES, {
    params: { medicineIds: medicineIds.join(","), centerId },
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const reviewInternalTransferRequisition = (id, data) => {
  return api.update(`${url.PHARMACY_INTERNAL_TRANSFER}/${id}/review`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const requestingReviewInternalTransferRequisition = (id, data) => {
  return api.update(
    `${url.PHARMACY_INTERNAL_TRANSFER}/${id}/requesting-review`,
    data,
    {
      headers: {
        "X-No-Cookie-Token": "true",
      },
    },
  );
};

export const getInternalTransferRequisitionById = (id) => {
  return api.get(`${url.PHARMACY_INTERNAL_TRANSFER}/${id}`, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const packageInternalTransferRequisition = (id, data) => {
  return api.update(`${url.PHARMACY_INTERNAL_TRANSFER}/${id}/package`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const dispatchInternalTransferRequisition = (id, data) => {
  return api.update(`${url.PHARMACY_INTERNAL_TRANSFER}/${id}/dispatch`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const grnInternalTransferRequisition = (id, data) => {
  return api.update(`${url.PHARMACY_INTERNAL_TRANSFER}/${id}/grn`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const updateInternalTransferRequisition = (id, data) => {
  return api.update(`${url.PHARMACY_INTERNAL_TRANSFER}/${id}`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const generateGRNNumber = () => {
  return api.get(`${url.PHARMACY_INTERNAL_TRANSFER}/generate-grn`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

// MI REPORTING
export const getMIHubSpotContacts = (params = {}) => {
  return api.get(url.GET_MI_HUBSPOT_CONTACTS, {
    params,
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
};

export const getCenterLeadsMoM = (params = {}) => {
  return api.get(url.GET_CENTER_LEADS_MOM, {
    params,
  });
};

export const getCenterWiseMOM = (params = {}) => {
  return api.get(url.GET_CENTER_WISE_MOM, {
    params,
  });
};

export const getCampaignWiseMOM = (params = {}) => {
  return api.get(url.GET_CAMPAIGN_WISE_MOM, {
    params,
  });
};

export const getCenterWiseStatusMOM = (params = {}) => {
  return api.get(url.GET_CENTER_WISE_STATUS_MOM, { params });
};

export const getCenterLeadsMTD = (params = {}) => {
  return api.get(url.GET_CENTER_LEADS_MTD, {
    params,
  });
};

export const getOwnerLeadsMoM = (params = {}) => {
  return api.get(url.GET_OWNER_LEADS_MOM, {
    params,
  });
};

export const getOwnerLeadsMTD = (params = {}) => {
  return api.get(url.GET_OWNER_LEADS_MTD, {
    params,
  });
};

export const getCityQualityBreakdown = (params = {}) => {
  return api.get(url.GET_CITY_QUALITY_BREAKDOWN, {
    params,
  });
};

export const getOwnerQualityBreakdown = (params = {}) => {
  return api.get(url.GET_OWNER_QUALITY_BREAKDOWN, {
    params,
  });
};

export const getCityVisitDate = (params = {}) => {
  return api.get(url.GET_CITY_VISIT_DATE, {
    params,
  });
};

export const getOwnerVisitDate = (params = {}) => {
  return api.get(url.GET_OWNER_VISIT_DATE, {
    params,
  });
};

export const getCityVisitedDate = (params = {}) => {
  return api.get(url.GET_CITY_VISITED_DATE, {
    params,
  });
};

export const getOwnerVisitedDate = (params = {}) => {
  return api.get(url.GET_OWNER_VISITED_DATE, {
    params,
  });
};

export const getCityLeadStatus = (params) => {
  return api.get(url.GET_CITY_LEAD_STATUS, { params });
};

export const getOwnerLeadStatus = (params) => {
  return api.get(url.GET_OWNER_LEAD_STATUS, { params });
};

export const getRefundAmountMOM = (data) => {
  return api.get(url.GET_REFUND_AMOUNT_MOM, {
    params: {
      centerIds: data?.centerAccess,
    },
  });
};

export const getRoundNotesDOD = (data) => {
  return api.get(url.GET_ROUND_NOTES_DOD, {
    params: {
      centerIds: data?.centerAccess,
    },
  });
};

export const getClinicalNotesDOD = (data) => {
  return api.get(url.GET_CLINICAL_NOTES_DOD, {
    params: {
      centerIds: data?.centerAccess,
    },
  });
};

export const getCounsellingSessionsPatientsDOD = (data) => {
  return api.get(url.GET_COUNSELLING_SESSIONS_PATIENTS_DOD, {
    params: {
      centerIds: data?.centerAccess,
    },
  });
};

export const getVitalSignsDOD = (data) => {
  return api.get(url.GET_VITAL_SIGNS_DOD, {
    params: {
      centerIds: data?.centerAccess,
    },
  });
};

export const getNursesDOD = (data) => {
  return api.get(url.GET_NURSES_DOD, {
    params: {
      centerIds: data?.centerAccess,
    },
  });
};

export const getPatientDocs = (data) => {
  return api.get(url.GET_PATIENT_DOCS, {
    params: {
      centerIds: data?.centerAccess,
      month: data?.selectedMonth,
      status: data?.selectedStatus,
      docsType: data?.selectedDocsType,
    },
  });
};

export const getOpdPatientDocs = (data) => {
  return api.get(url.GET_OPD_PATIENT_DOCS, {
    params: {
      centerIds: data?.centerAccess,
      month: data?.selectedMonth,
      status: data?.selectedStatus,
    },
  });
};

export const getDailyInvoices = (data) => {
  return api.get(url.GET_DAILY_INVOICES, {
    params: {
      centerIds: data?.centerAccess,
      status: data?.selectedStatus,
    },
  });
};

export const getCounsellingSessions = (data) => {
  return api.get(url.GET_COUNSLLING_SESSIONS, {
    params: {
      centerIds: data?.centerAccess,
    },
  });
};

export const getCounsellingRecordings = (data) => {
  return api.get(url.GET_COUNSELLING_RECORDING, {
    params: {
      centerIds: data?.centerAccess,
    },
  });
};

export const getDailyDashboard = (data) => {
  return api.get(url.GET_DAILY_DASHBOARD, {
    params: {
      centerIds: data?.centerAccess,
      date: data?.date,
    },
  });
};

export const getDocsCompliance = (data) => {
  return api.get(url.GET_DOCS_COMPLIANCE, {
    params: {
      centerIds: data?.centerAccess,
    },
  });
};

export const getDueAmount = (data) => {
  return api.get(url.GET_DUE_AMOUNT, {
    params: {
      centerIds: data?.centerAccess,
      patientType: data?.patientType,
      month: data?.month,
    },
  });
};

export const getMissingInvoices = (data) => {
  return api.get(url.GET_MISSING_INVOICES, {
    params: {
      centerIds: data?.centerAccess,
      month: data?.month,
    },
  });
};

export const getCashPerCenter = (data) => {
  return api.get(url.GET_CASH_PER_CENTER, {
    params: {
      centerIds: data?.centerAccess,
    },
  });
};

export const getWriteOffAmount = (data) => {
  return api.get(url.GET_WRITE_OFF_AMOUNT, {
    params: {
      centerIds: data?.centerAccess,
    },
  });
};

export const getTrainingFormsWeekly = (data) => {
  return api.get(url.GET_TRAINING_FORMS_WEEKLY, {
    params: {
      centerIds: data?.centerAccess,
    },
  });
};

export const getTrainingFormsMonthly = (data) => {
  return api.get(url.GET_TRAINING_FORMS_MONTHLY, {
    params: {
      centerIds: data?.centerAccess,
    },
  });
};

export const getAuditDaily = (data) => {
  return api.get(url.GET_AUDIT_DAILY, {
    params: {
      centerIds: data?.centerAccess,
    },
  });
};

export const getMetricsReport = (data) => {
  return api.get(url.GET_METRICS_REPORT, {
    params: {
      centerIds: data?.centerAccess,
    },
  });
};

export const getOpdChargesMonthly = (data) => {
  return api.get(url.GET_OPD_CHARGES_MONTHLY, {
    params: {
      centerIds: data?.centerAccess,
    },
  });
};

export const getDoctorOpdChargesMonthly = (data) => {
  return api.get(url.GET_DOCTOR_OPD_CHARGES_MONTHLY, {
    params: {
      centerIds: data?.centerAccess,
    },
  });
};

export const getDoctorOpdChargesDetail = (data) => {
  return api.get(url.GET_DOCTOR_OPD_CHARGES_DETAIL, {
    params: {
      centerIds: data?.centerAccess,
    },
  });
};

export const getCentralExpensesMonthly = (data) => {
  return api.get(url.GET_CENTRAL_EXPENSES_MONTHLY, {
    params: {
      centerIds: data?.centerAccess,
    },
  });
};

export const getDoctorPsychologistStayRange = (data) => {
  return api.get(url.GET_DOCTOR_PSYCHOLOGIST_STAY_RANGE, {
    params: {
      centerIds: data?.centerAccess,
    },
  });
};

export const getNursesDailyActivity = (data) => {
  return api.get(url.GET_NURSES_DAILY_ACTIVITY, {
    params: {
      centerIds: data?.centerAccess,
    },
  });
};

export const getOccupancyMonthly = (data) => {
  return api.get(url.GET_OCCUPANCY_MONTHLY, {
    params: {
      centerIds: data?.centerAccess,
    },
  });
};

export const getAdmissionDischargeDaily = (data) => {
  return api.get(url.GET_ADMISSION_DISCHARGE_DAILY, {
    params: {
      centerIds: data?.centerAccess,
      from: data?.startDate,
      to: data?.endDate,
    },
  });
};

export const getMIAttendance = (data) => {
  return api.get(url.GET_MI_ATTENDANCE, {
    params: {
      centerIds: data?.centerAccess,
    },
  });
};

export const getIncidentStatusMonthly = (data) => {
  return api.get(url.GET_INCIDENT_STATUS_MONTHLY, {
    params: {
      centerIds: data?.centerAccess,
    },
  });
};

export const getReadmissionMonthly = (data) => {
  return api.get(url.GET_READMISSION_MONTHLY, {
    params: {
      centerIds: data?.centerAccess,
    },
  });
};

export const getAttritionMonthly = (data) => {
  return api.get(url.GET_ATTRITION_MONTHLY, {
    params: {
      centerIds: data?.centerAccess,
    },
  });
};

export const getAssignedData = (data) => {
  return api.get(url.GET_ASSIGNED_DATA, {
    params: {
      centerIds: data?.centerAccess,
    },
  });
};

export const getPatientsWithSuspendedStaff = (data) => {
  return api.get(url.GET_PATIENTS_WITH_SUSPENDED_STAFF, {
    params: {
      centerIds: data?.centerAccess,
    },
  });
};

export const getSopAlertsMonthly = (data) => {
  return api.get(url.GET_SOP_ALERTS_MONTHLY, {
    params: {
      period_type: data?.period_type,
    },
  });
};

export const getCashRecoCompliance = (data) => {
  return api.get(url.GET_CASH_RECO_COMPLIANCE, {
    params: {
      centerIds: data?.centerAccess,
    },
  });
};

export const getCenterDashboardLive = (data) => {
  return api.get(url.GET_CENTER_DASHBOARD_LIVE, {
    params: {
      centerIds: data?.centerAccess,
    },
  });
};

// HR
export const getEmployeeId = (params = {}) => {
  return api.get(url.GET_EMPLOYEE_ID, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const updateEmployeeByKey = (data) => {
  return api.update(url.EMPLOYEE_BY_KEY, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getEmployeeDetailsById = (id) => {
  return api.get(`${url.EMPLOYEE_DETAILS}/${id}`, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const postEmployee = (data) => {
  return api.create(url.EMPLOYEE, data, {
    headers: {
      "Content-Type": "multipart/form-data",
      "X-No-Cookie-Token": "true",
    },
  });
};

export const editEmployee = (id, data) => {
  return api.update(`${url.EMPLOYEE}/${id}`, data, {
    headers: {
      "Content-Type": "multipart/form-data",
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getEmployees = (params = {}) => {
  return api.get(url.EMPLOYEE, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
};

export const getBiometricEmployeesData = (params = {}) => {
  return axios.get(url.EMPLOYEE_BIOMETRIC, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getBiometricExitEmployeesData = (params = {}) => {
  return axios.get(url.EXIT_EMPLOYEE_BIOMETRIC_REQUESTS, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};
export const updateBiometricStatus = (doc_id, data) =>
  axios.patch(url.UPDATE_EMPLOYEE_BIOMETRIC, null, {
    params: {
      doc_id,
      status: data.status,
      ...(data.reason && { reason: data.reason }),
    },
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });

export const updateExitBiometricStatus = (doc_id, data) =>
  axios.patch(url.UPDATE_EMPLOYEE_EXIT_BIOMETRIC, null, {
    params: {
      doc_id,
      status: data.status,
      ...(data.reason && { reason: data.reason }),
    },
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });

export const exportEmployeesXLSX = (params = {}) => {
  return api.get(url.EMPLOYEE, {
    params: { ...params, isExcel: true },
    headers: {
      "X-No-Cookie-Token": "true",
    },
    responseType: "blob",
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
};

export const deleteEmployee = (id) => {
  return api.delete(`${url.EMPLOYEE}/${id}`, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const updateNewJoiningStatus = (id, data) => {
  return api.update(`${url.NEW_JOINING_ACTION}/${id}`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getExitEmployees = (params = {}) => {
  return api.get(url.EXIT_EMPLOYEE, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
};

export const postExitEmployee = (data) => {
  return api.create(url.EXIT_EMPLOYEE, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const editExitEmployee = (id, data) => {
  return api.update(`${url.EXIT_EMPLOYEE}/${id}`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const deleteExitEmployee = (id) => {
  return api.delete(`${url.EXIT_EMPLOYEE}/${id}`, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const exitEmployeeExitAction = (id, data) => {
  return api.update(`${url.EXIT_EMPLOYEE_EXIT_ACTION}/${id}`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const exitEmployeeFNFAction = (id, data) => {
  return api.update(`${url.EXIT_EMPLOYEE_FNF_ACTION}/${id}`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const searchExitEmployee = (params = {}) => {
  return api.get(url.SEARCH_EXIT_EMPLOYEE, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
};

export const getITApprovals = (params = {}) => {
  return api.get(url.IT, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
};

export const updateNewJoiningITStatus = (id, data) => {
  return api.update(`${url.IT_NEW_JOINING_ACTION}/${id}`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const updateExitITStatus = (id, data) => {
  return api.update(`${url.IT_EXIT_ACTION}/${id}`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const updatetransferITStatus = (id, data) => {
  return api.update(`${url.IT_TRANSFER_ACTION}/${id}`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getEmployeeEmails = (id) => {
  return api.get(`${url.EMPLOYEE_EMAILS}/${id}`, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getAdvanceSalaries = (params = {}) => {
  return api.get(url.SALARY_ADVANCE, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
};

export const deleteAdvanceSalary = (id) => {
  return api.delete(`${url.SALARY_ADVANCE}/${id}`, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const postAdvanceSalary = (data) => {
  return api.create(url.SALARY_ADVANCE, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const editAdvanceSalary = (id, data) => {
  return api.update(`${url.SALARY_ADVANCE}/${id}`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const advanceSalaryAction = (id, data) => {
  return api.update(`${url.SALARY_ADVANCE_ACTION}/${id}`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getEmployeeTransfers = (params = {}) => {
  return api.get(url.TRANSFER_EMPLOYEE, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
};

export const postEmployeeTransfer = (data) => {
  return api.create(url.TRANSFER_EMPLOYEE, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const editEmployeeTransfer = (id, data) => {
  return api.update(`${url.TRANSFER_EMPLOYEE}/${id}`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const deleteEmployeeTransfer = (id) => {
  return api.delete(`${url.TRANSFER_EMPLOYEE}/${id}`, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const employeeTransferCurrentLocationAction = (id, data) => {
  return api.update(
    `${url.TRANSFER_EMPLOYEE_CURRENT_LOCATION_ACTION}/${id}`,
    data,
    {
      headers: {
        "X-No-Cookie-Token": "true",
      },
    },
  );
};

export const employeeTransferTransferLocationAction = (id, data) => {
  return api.update(
    `${url.TRANSFER_EMPLOYEE_TRANSFER_LOCATION_ACTION}/${id}`,
    data,
    {
      headers: {
        "X-No-Cookie-Token": "true",
      },
    },
  );
};

export const postDesignation = (data) => {
  return api.create(url.DESIGNATION, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getDesignations = (params = {}) => {
  return api.get(url.DESIGNATION, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
};

export const getCompanies = (params = {}) => {
  return api.get(url.COMPANY, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const createCompany = (data) => {
  return api.create(url.COMPANY, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const updateCompany = (id, data) => {
  return api.put(`${url.COMPANY}/${id}`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const deleteCompany = (id) => {
  return api.delete(`${url.COMPANY}/${id}`, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const postHiring = (data) => {
  return api.create(url.HIRING, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const editHiring = (id, data) => {
  return api.update(`${url.HIRING}/${id}`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const deleteHiring = (id) => {
  return api.delete(`${url.HIRING}/${id}`, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const hiringAction = (id, data) => {
  return api.update(`${url.HIRING_ACTION}/${id}`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getHirings = (params = {}) => {
  return api.get(url.HIRING, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
    ...(params.exportExcel && { responseType: "text" }),
  });
};

export const getEmployeesBySearch = (params = {}) => {
  return axios.get(url.GET_ALL_EMPLOYEE, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) =>
      qs.stringify(params, { arrayFormat: "repeat" }),
  });
};
export const getCentreManagersByCenter = (params = {}) =>
  api.get(url.GET_CENTRE_MANAGERS, { params });

export const getManagementHiringRequests = (params = {}) => {
  return axios.get(url.GET_MANAGEMENT_HIRING_REQUESTS, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) =>
      qs.stringify(params, { arrayFormat: "repeat" }),
    ...(params.exportExcel && { responseType: "blob" }),
  });
};

export const editManagementRequests = (id, data) => {
  return api.update(`${url.UPDATE_HIRING_REQUEST}/${id}`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const postTPM = (data) => {
  return api.create(url.TPM, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const editTPM = (id, data) => {
  return api.update(`${url.TPM}/${id}`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const TPMAction = (id, data) => {
  return api.update(`${url.TPM_ACTION}/${id}`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getTPMs = (params = {}) => {
  return api.get(url.TPM, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
};

export const deleteTPM = (id) => {
  return api.delete(`${url.TPM}/${id}`, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getFinance = (params = {}) => {
  return api.get(url.FINANCE, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
};

export const editFinance = (id, data) => {
  return api.update(`${url.FINANCE}/${id}`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const changeSalary = (data) => {
  return api.create(url.CHANGE_SALARY, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

// HRMS
export const getAttendance = (params = {}) => {
  return api.get(url.ATTENDANCE, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
};

export const getAttendanceImportHistory = (params = {}) => {
  return api.get(url.ATTENDANCE_IMPORTS, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
};

export const getAttendanceImportById = (id) => {
  return api.get(`${url.ATTENDANCE_IMPORTS}/${id}`, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const uploadAttendance = (data) => {
  return api.create(url.UPLOAD_ATTENDANCE, data, {
    headers: {
      "X-No-Cookie-Token": "true",
      "Content-Type": "multipart/form-data",
    },
  });
};

export const deleteAttendanceImport = (params = {}) => {
  return api.delete(url.ATTENDANCE, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
};

export const downloadAttendanceTemplate = () => {
  return api.get(url.ATTENDANCE_TEMPLATE, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
    responseType: "blob",
  });
};

export const getAttendanceMetrics = (params = {}, signal) => {
  return api.get(url.ATTENDANCE_METRICS, {
    params,
    signal,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
};

export const getReportingMetrics = (params = {}) => {
  return api.get(url.REPORTING_METRICS, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
};

export const exportAttendanceMetrics = (params = {}) => {
  return api.get(url.EXPORT_ATTENDANCE_METRICS, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    responseType: "blob",
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
};
export const exportReportingMetrics = (params = {}) => {
  return api.get(url.EXPORT_REPORTING_METRICS, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    responseType: "blob",
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
};

// REGULARIZATION
export const requestForRegularization = (data) => {
  return api.create(url.REQUEST_REGULARIZATION, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getMyRegularizations = (params) => {
  return axios.get(url.GET_MY_REGULARIZATION, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};
export const getRegularizationsRequests = (params) => {
  return axios.get(url.GET_REGULARIZATION_REQUESTS, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

// export const getRegularizationsRequests = () => {
//   return api.get(url.GET_REGULARIZATION_REQUESTS, {
//     headers: {
//       "X-No-Cookie-Token": "true",
//     },
//   });
// };

export const updateRegularizationStatus = (id, status) => {
  return api.update(
    `${url.UPDATE_REGULARIZATION}/${status}/${id}`,
    {},
    {
      headers: {
        "X-No-Cookie-Token": "true",
      },
    },
  );
};

export const getAllEmployeeRegularizations = (params = {}) => {
  return axios.get(url.GET_ALL_EMPLOYEE_REGULARIZATIONS, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getRegularizationsByEmployee = ({ employeeId, ...params }) => {
  return axios.get(`${url.GET_REGULARIZATIONS_BY_EMPLOYEE}/${employeeId}`, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

// FOR HR — cross-employee "All Regularizations" page (act by anyone)
export const getAllRegularizations = (params = {}) => {
  return axios.get(url.GET_ALL_REGULARIZATIONS, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const changeRegularizationStatusByHR = (data) => {
  return axios.patch(url.APPROVE_REGULARIZATION_BYHR, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

// Atomic create + approve in a single request (no orphaned pending on failure).
export const createAndApproveRegularization = (data) => {
  return axios.post(url.CREATE_APPROVE_REGULARIZATION_BYHR, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

// HRMS/LEAVES
export const postLeaveRequest = (data) => {
  return api.create(url.APPLY_LEAVE, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getMyManager = () => {
  return api.get(url.GET_MY_MANAGER, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getManagerByEmployeeId = (id) => {
  return api.get(`${url.GET_MY_MANAGER_BY_EMPLOYEE_ID}/${id}`, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getLeavesRequest = (managerId, params = {}) => {
  return axios.get(`${url.GET_LEAVES_REQUESTS}/${managerId}`, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const actionOnLeaves = (id, data) => {
  return api.update(`${url.ACTION_ON_LEAVE}/${id}`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getMyLeavesHistory = (params = {}) => {
  return axios.get(url.GET_MY_LEAVES, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};
export const getBalance = () => {
  return api.get(url.GET_BALANCE_LEAVES, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const retrieveActionOnLeave = (action, docId, data) => {
  return api.update(`${url.RETRIEVE_ACTION}/${action}/${docId}`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const cancellationRequest = (data) => {
  return axios.post(url.CANCELLATION_REQUEST, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const directCancellation = (data) => {
  return axios.patch(url.DIRECT_CANCELLATIONS, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getCancellationsRequests = (params = {}) => {
  return axios.get(url.GET_CANCELLATION_REQUEST, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getCancellationsHistory = (params = {}) => {
  return axios.get(url.GET_CANCELLATIONS_HISTORY, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const actionOnCancellationRequest = ({ cancellationId, status }) => {
  return axios.patch(
    `${url.ACTION_ON_CANCELLATION_REQUEST}/${cancellationId}/${status}`,
    {},
    {
      headers: {
        "X-No-Cookie-Token": "true",
      },
    },
  );
};

export const getAllLeaves = (params = {}, signal) => {
  return axios.get(url.GET_LEAVES, {
    params,
    signal,
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const changeLeaveStatusByHR = (data) => {
  return axios.patch(url.APPROVE_LEAVE, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getPendingApprovalsByManagerId = (data) => {
  return axios.get(url.GET_PENDING_APPROVALS_BY_MANAGER_ID, {
    params: data,
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const transferManagerPendingApprovals = (data) => {
  return axios.patch(url.TRANSFER_MANAGER_PENDING_APPROVALS, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

//
export const getEmployeesByWithoutFilter = (params = {}) => {
  return axios.get(url.GET_EMPLOYEES_WITHOUT_FILTER, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) =>
      qs.stringify(params, { arrayFormat: "repeat" }),
  });
};

export const getTemporaryManager = () => {
  return axios.get(url.GET_TEMPORARY_MANAGER, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const gettodayMyAttendanceStatus = (params = {}) => {
  return api.get(url.TODAY_MY_ATTENDANCE_STATUS, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

// export const adminGetAllLeavesInfo = () => {
//   return api.get(`${url.ADMIN_GET_ALL_LEAVES}`, {
//     headers: {
//       "X-No-Cookie-Token": "true",
//     },
//   });
// };

export const adminGetAllLeavesInfo = (params = {}) => {
  return axios.get(url.ADMIN_GET_ALL_LEAVES, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getFestiveLeavesList = (params = {}) => {
  return axios.get(url.GET_FESTIVE_LEAVES_LISTS, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const addFestiveLeavesList = (data) =>
  api.create(url.POST_FESTIVE_LEAVES_LIST, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });

export const addLeavesToExistingList = (listId, data) =>
  api.create(`${url.ADD_LEAVES_TO_EXISTING_LIST}/${listId}`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
export const deleteFestiveLeave = ({ listId, leaveId }) =>
  api.update(
    url.DELETE_LEAVE,
    { listId, leaveId },
    {
      headers: {
        "X-No-Cookie-Token": "true",
      },
    },
  );

export const updateFestiveLeave = ({
  listId,
  leaveId,
  date,
  particulars,
  day,
}) =>
  api.update(
    `${url.UPDATE_LEAVE}`,
    {
      listId,
      leaveId,
      date,
      particulars,
    },
    {
      headers: {
        "X-No-Cookie-Token": "true",
      },
    },
  );

// COMP OFF

export const getCompOffRequests = (params = {}) => {
  return axios.get(url.GET_COMP_REQUESTS, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getAllCompOff = (params = {}) => {
  return axios.get(url.GET_ALL_COMP_OFFS, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getMyCompOff = (params = {}) => {
  return axios.get(url.GET_MY_COMP_OFFS, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const postCompOffRequest = (data) => {
  return api.create(url.POST_COMP_OFF_REQUEST, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

// For manager
export const actionOnCompOffRequests = (data) => {
  return axios.patch(url.ACTION_ON_COMP_REQUESTS, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getAttendanceSummary = (params = {}) => {
  return api.get(url.ATTENDANCE_SUMMARY, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const refetchBiometricAttendanace = () => {
  return api.create(
    url.REFETCH_BIOMETRIC_ATTENDANCE,
    {},
    {
      headers: {
        "X-No-Cookie-Token": "true",
      },
    },
  );
};

export const getAttendanceLogs = (params = {}) => {
  return api.get(url.ATTENDANCE_LOGS, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const postEmployeeCheckIn = (data) => {
  return api.create(url.EMPLOYEE_CHECK_IN, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const updateEmployeeCheckOut = (data) => {
  return api.update(url.EMPLOYEE_CHECK_OUT, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

// HRMS- Employee Reporting
export const postEmployeeReporting = (data) => {
  return api.create(url.EMPLOYEE_REPORTING, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

// Policies
export const addPolicies = (data) => {
  return api.create(`${url.ADD_POLICIES}`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getPolicies = () => {
  return api.get(`${url.GET_POLICIES}`, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getLatestPolicy = () => {
  return api.get(`${url.GET_LATEST_POLICY}`, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

// department

export const getDepartments = (params = {}) => {
  const endpoint = params.version
    ? `${url.GET_DEPARTMENTS}?version=${params.version}`
    : url.GET_DEPARTMENTS;

  return api.get(endpoint, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};
export const createDepartment = (data) => {
  return api.create(`${url.CREATE_DEPARTMENTS}`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const editEmployeeReporting = (id, data) => {
  return api.update(`${url.EMPLOYEE_REPORTING}/${id}`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getEmployeeReportings = (params = {}) => {
  return api.get(url.EMPLOYEE_REPORTING, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getEmployeeReportingById = (id) => {
  return api.get(`${url.EMPLOYEE_REPORTING}/${id}`, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getRotationalShifts = (id) => {
  return api.get(`${url.EMPLOYEE_REPORTING}/${id}/rotational-shifts`, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getEmployeeWeekOffBalance = (employeeId) => {
  return api.get(`/hrms/employee/${employeeId}/week-off-balance`, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getEmployeeLeaves = (employeeId, params = {}) => {
  return api.get(`/hrms/leaves/employee/${employeeId}`, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getAllEmployeeLeaveBalance = (params = {}, signal) => {
  return api.get(url.GET_ALL_EMPLOYEE_LEAVE_BALANCE, {
    params,
    signal,
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getReporteesLeaveBalance = (params = {}, signal) => {
  return api.get(url.GET_REPORTEES_LEAVE_BALANCE, {
    params,
    signal,
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const setRotationalShifts = (id, data) => {
  return api.put(`${url.EMPLOYEE_REPORTING}/${id}/rotational-shifts`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const setBulkRotationalShifts = (data) => {
  return api.put(`${url.EMPLOYEE_REPORTING}/rotational-shifts/bulk`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const downloadRotationalShiftTemplate = (params = {}) => {
  return api.get(`${url.EMPLOYEE_REPORTING}/rotational-shifts/template`, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    responseType: "blob",
  });
};

export const uploadRotationalShiftSheet = (data) => {
  return api.create(
    `${url.EMPLOYEE_REPORTING}/rotational-shifts/upload`,
    data,
    {
      headers: {
        "X-No-Cookie-Token": "true",
        "Content-Type": "multipart/form-data",
      },
      responseType: "blob",
    },
  );
};

// Incentives
export const postIncentives = (data) => {
  return api.create(url.INCENTIVES, data, {
    headers: {
      "X-No-Cookie-Token": "true",
      "Content-Type": "multipart/form-data",
    },
  });
};

export const editIncentives = (id, data) => {
  return api.update(`${url.INCENTIVES}/${id}`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const deleteIncentives = (id) => {
  return api.delete(`${url.INCENTIVES}/${id}`, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const incentivesAction = (id, data) => {
  return api.update(`${url.INCENTIVES_ACTION}/${id}`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getIncentives = (params = {}) => {
  return api.get(url.INCENTIVES, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
};

export const postPayrollAdjustments = (data) => {
  return api.create(url.PAYROLL_ADJUSTMENTS, data, {
    headers: {
      "X-No-Cookie-Token": "true",
      "Content-Type": "multipart/form-data",
    },
  });
};

export const editPayrollAdjustments = (id, data) => {
  return api.update(`${url.PAYROLL_ADJUSTMENTS}/${id}`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const deletePayrollAdjustments = (id) => {
  return api.delete(`${url.PAYROLL_ADJUSTMENTS}/${id}`, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const payrollAdjustmentsAction = (id, data) => {
  return api.update(`${url.PAYROLL_ADJUSTMENTS_ACTION}/${id}`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getPayrollAdjustments = (params = {}) => {
  return api.get(url.PAYROLL_ADJUSTMENTS, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
};

export const postESICRecords = (data) => {
  return api.create(url.ESIC_RECORDS, data, {
    headers: {
      "X-No-Cookie-Token": "true",
      "Content-Type": "multipart/form-data",
    },
  });
};

export const editESICRecord = (id, data) => {
  return api.update(`${url.ESIC_RECORDS}/${id}`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
      "Content-Type": "multipart/form-data",
    },
  });
};

export const deleteESICRecord = (id) => {
  return api.delete(`${url.ESIC_RECORDS}/${id}`, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const esicAction = (id, data) => {
  return api.update(`${url.ESIC_ACTION}/${id}`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getESICRecords = (params = {}) => {
  return api.get(url.ESIC_RECORDS, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
};

export const searchESICEmployees = (params = {}) => {
  return api.get(url.ESIC_SEARCH_EMPLOYEES, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
};

export const getMyESICRecords = () => {
  return api.get(url.ESIC_MY_RECORDS, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const generatePayroll = (data) => {
  return api.create(url.GENERATE_PAYROLL, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
};

export const getPayrolls = (params = {}) => {
  return api.get(url.GET_PAYROLLS, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
};

export const exportPayrollsXLSX = (params = {}) => {
  return api.get(url.EXPORT_PAYROLLS_XLSX, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
      "Content-Type": "application/json",
    },
    responseType: "blob",
  });
};

export const getPayrollGenerationStatus = (id) => {
  return api.get(`${url.PAYROLL_GENERATION_STATUS}/${id}`, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};
export const updatePayrollRemarks = (id, data) => {
  return api.update(`${url.UPDATE_PAYROLL_REMARKS}/${id}`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const payrollBulkAction = (data) => {
  return api.update(url.PAYROLL_BULK_ACTION, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const payrollAction = (id, data) => {
  return api.update(`${url.PAYROLL_ACTION}/${id}`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const downloadMonthlyPayrollTemplate = (params = {}) => {
  return api.get(url.MONTHLY_PAYROLL_TEMPLATE, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    responseType: "blob",
  });
};

export const getMonthlyAttendance = (params = {}) => {
  return api.get(url.MONTHLY_ATTENDANCE, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const uploadMonthlyAttendance = (data) => {
  return api.create(url.UPLOAD_MONTHLY_ATTENDANCE, data, {
    headers: {
      "X-No-Cookie-Token": "true",
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getApprovalInbox = (params = {}) => {
  return api.get(url.GET_APPROVAL_INBOX, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
};

// upload file
export const uploadFile = (data) => {
  return api.create(url.UPLOAD_FILE, data, {
    headers: {
      "Content-Type": "multipart/form-data",
      "X-No-Cookie-Token": "true",
    },
  });
};

// utilities
export const uploadUtilityBill = (data) => {
  return api.create(url.UPLOAD_UTILITY_BILL, data, {
    headers: {
      "Content-Type": "multipart/form-data",
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getUtilityBills = (params = {}) => {
  return axios.get(url.GET_UTILITY_BILLS, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (queryParams) => {
      return qs.stringify(queryParams, { arrayFormat: "repeat" });
    },
  });
};

export const updateUtilityBill = (id, data) => {
  return api.update(url.UPDATE_UTILITY_BILL(id), data, {
    headers: {
      "Content-Type": "multipart/form-data",
      "X-No-Cookie-Token": "true",
    },
  });
};

export const deleteUtilityBill = (id) => {
  return api.delete(url.DELETE_UTILITY_BILL(id), {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

// Submit assessment form

export const submitAssessment = (id, payload) => {
  return axios.patch(`${url.SUBMIT_ASSESSMENT_FROM}/${id}`, payload, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

// ECT consent form — payload is FormData carrying the rendered PDF.
export const submitECTConsent = (id, payload) => {
  return axios.patch(`${url.SUBMIT_ECT_CONSENT_FORM}/${id}`, payload, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const uploadECTConsentSignedCopy = (payload) => {
  return axios.patch(url.UPLOAD_ECT_CONSENT_FORM, payload, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const uploadMHRBEmail = (payload) => {
  return axios.patch(url.UPLOAD_MHRB_EMAIL_FORM, payload, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const dnrFormFilled = (id, payload) => {
  return axios.patch(`${url.DNR_FORM_FILLED}/${id}`, payload, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};

export const uploadDNRForm = (payload) => {
  return axios.patch(url.UPLOAD_DNR_FORM, payload, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });
};
// TALLY
export const sendToTally = (data) => api.create(url.POST_TALLY_SEND, data);
export const getActiveTallySession = () =>
  api.get(url.GET_TALLY_ACTIVE_SESSION);
export const cancelTallySync = (sessionId) =>
  api.create(url.POST_TALLY_CANCEL(sessionId), {});
export const getTallyLogs = (params) => api.get(url.GET_TALLY_LOGS, { params });
export const getTallyPendingUpdates = (params) =>
  api.get(url.GET_TALLY_PENDING_UPDATES, { params });
export const exportTallyLogsCsv = (params) => {
  const queryString = Object.entries(params)
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  return axios.get(`${url.GET_TALLY_LOGS_EXPORT_CSV}?${queryString}`, {
    responseType: "blob",
  });
};

// Issues

export const getIssues = (params = {}) => {
  return axios.get(url.GET_ISSUES, {
    params,
  });
};

export const getMyIssues = (params = {}) => {
  return axios.get(url.GET_MY_ISSUES, {
    params,
  });
};

export const changeStatus = (data) => {
  return axios.patch(url.CHANGE_STATUS, data);
};
export const approveIssue = (data) => {
  return axios.patch(url.APPROVE_ISSUE, data);
};
export const addIssueNote = (data) => {
  return axios.patch(url.ADD_ISSUE_NOTE, data);
};
export const postIssue = (formData) => {
  return axios.post(url.POST_ISSUE, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
export const getTicketsDashboardData = ({ month, issueType }) => {
  return axios.get(url.GET_TICKET_DASHBOARD_DATA, {
    params: {
      month,
      issueType,
    },
  });
};

export const getRaisedIssues = (params = {}) => {
  return axios.get(url.GET_RAISED_TICKETS, {
    params,
  });
};

export const getHRIssuesRequests = (params = {}) => {
  return axios.get(url.GET_HR_ISSUES_REQUESTS, {
    params,
  });
};
export const updateHRIssueRequest = (data) => {
  return axios.patch(url.UPDATE_HR_ISSUE_REQUEST, data);
};

export const updateFinanceIssueRequest = (data) => {
  return axios.patch(url.UPDATE_FINANCE_ISSUE_REQUEST, data);
};

export const getFinanceIssues = (params = {}) => {
  return axios.get(url.GET_FINANCE_ISSUES, {
    params,
  });
};

export const getPayslipsIssuesRequests = (params = {}) => {
  return axios.get(url.GET_PAYSLIPS_ISSUES_REQUESTS, {
    params,
  });
};

// EMployee Forms

export const postEmployeeForm = (data) => {
  return axios.post(url.POST_EMPLOYEE_FORM, data, {
    headers: {
      "Content-Type": undefined,
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getEmployeeForms = (params) => {
  return axios.get(url.EMPLOYEE_FORMS, {
    params,
    headers: {
      "Content-Type": undefined,
      "X-No-Cookie-Token": "true",
    },
  });
};

export const getMyEmploymentForms = (params = {}) => {
  return axios.get(url.GET_MY_FORMS, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const deleteEmployeeForm = (docId, fileId) => {
  return axios.delete(url.DELETE_EMPLOYEE_FORM, {
    data: { docId, fileId },
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const editEmployeeForm = (data) => {
  return axios.patch(url.EDIT_EMPLOYEE_FORM, data, {
    headers: {
      "Content-Type": undefined,
      "X-No-Cookie-Token": "true",
    },
  });
};

// Recordings
// Call recordings
export const getCallRecordings = (params = {}) => {
  return axios.get(url.GET_RECORDINGS, {
    params,
  });
};
export const getRecordingById = (id) => {
  return axios.get(`${url.GET_RECORDING_BY_ID}/${id}`);
};

export const generateOverviewRecording = (id, recordingUrl) => {
  return axios.post(url.GENERATE_OVERVIEW_RECORDING, { id, recordingUrl });
};

export const bulkGenerateOverviewRecording = (ids) => {
  return axios.post(url.BULK_GENERATE_OVERVIEW_RECORDING, ids);
};

// Live progress of the background bulk-overview queue (survives server restarts).
export const getBulkOverviewStatus = () => {
  return axios.get(url.BULK_OVERVIEW_STATUS);
};
export const uploadXlsx = (data) => {
  return api.create(url.UPLOAD_XLSX_FILE, data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getCallRecordingOverview = (params = {}) => {
  return axios.get(url.GET_CALL_RECORDING_OVERVIEW, { params });
};

// Feedback recordings
export const getFeedbackRecordings = (params = {}) => {
  return axios.get(url.GET_FEEDBACK_RECORDINGS, {
    params,
  });
};
export const getFeedbackRecordingById = (id) => {
  return axios.get(`${url.GET_FEEDBACK_RECORDING_BY_ID}/${id}`);
};

export const generateFeedbackOverviewRecording = (id, recordingUrl) => {
  return axios.post(url.GENERATE_FEEDBACK_OVERVIEW_RECORDING, {
    id,
    recordingUrl,
  });
};
export const bulkGenerateFeedbackOverviewRecording = (ids) => {
  return axios.post(url.BULK_GENERATE_FEEDBACK_OVERVIEW_RECORDING, ids);
};

export const uploadFeedbackXlsx = (data) => {
  return api.create(url.UPLOAD_FEEDBACK_XLSX_FILE, data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getFeedbackRecordingOverview = (params = {}) => {
  return axios.get(url.GET_FEEDBACK_RECORDING_OVERVIEW, { params });
};

// get AI Discharge Summary

export const getAIDischargeSummary = (params = {}) => {
  return axios.get(url.GET_AI_SUMMARY, { params });
};

export const validateAISummary = (summary) => {
  return axios.patch(url.VALIDATE_SUMMARY, summary);
};

// get AI Expiry Summary

export const getAIExpirySummary = (params = {}) => {
  return axios.get(url.GET_AI_EXPIRY_SUMMARY, {
    params,
  });
};

export const validateAIExpirySummary = (summary) => {
  return axios.patch(url.VALIDATE_AI_EXPIRY_SUMMARY, summary);
};

// Always multipart so the optional reference document (PDF/DOCX) rides along
// in the same request. The JSON rule(s) ship as a stringified `payload` field;
// the server tolerates both shapes.
export const sopConfigure = (data, documentFile = null) => {
  const fd = new FormData();
  fd.append("payload", JSON.stringify(data));
  if (documentFile) fd.append("document", documentFile);
  return axios.post(url.CONFIGURATION_SOP, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const sopGetRoles = (data) => {
  return axios.get(url.GET_ROLES, data);
};

export const sopGetFieldsByModel = (model) =>
  axios.get(`${url.GET_FIELDS}/${model}`);

export const sopGetLabTests = () => axios.get(url.GET_SOP_LAB_TESTS);

export const getUnreadSopAlerts = () => axios.get(url.GET_UNREAD_SOP_ALERTS);

export const getAllSopAlerts = (params) =>
  axios.get(url.GET_ALL_SOP_ALERTS, { params });

// Returns the full axios response (NOT the unwrapped body) because the interceptor
// preserves blob responses verbatim. Caller reads response.data (Blob) + headers.
export const exportSopAlerts = (params) =>
  axios.get(url.EXPORT_SOP_ALERTS, { params, responseType: "blob" });

export const markSopAlertRead = (id) =>
  axios.post(`${url.MARK_SOP_ALERT_READ}/${id}/read`);

export const markAllSopAlertsRead = () =>
  axios.post(url.MARK_ALL_SOP_ALERTS_READ);

// Marks an alert as resolved. `text` is MANDATORY — the server rejects an empty
// note with a 400. It is stored as a notes[] entry tagged kind "RESOLUTION", so
// the response carries both the resolution and the new note.
export const resolveSopAlert = (id, text) =>
  axios.post(`${url.RESOLVE_SOP_ALERT}/${id}/resolve`, { text });

// Appends a free-text note to an alert. Returns the new note with addedByName.
export const addAlertNote = (id, text) =>
  axios.post(`${url.RESOLVE_SOP_ALERT}/${id}/notes`, { text });

export const listSopRules = (params) => axios.get(url.SOP_RULES, { params });
export const getSopRuleById = (id) => axios.get(`${url.SOP_RULES}/${id}`);
export const updateSopRule = (id, payload) =>
  axios.patch(`${url.SOP_RULES}/${id}`, payload);
export const toggleSopRuleActive = (id, isActive) =>
  axios.patch(`${url.SOP_RULES}/${id}/active`, { isActive });
export const deleteSopRule = (id) => axios.delete(`${url.SOP_RULES}/${id}`);

// Baseline investigation package config. Bare axios like every other sop*
// helper — APIClient.get hand-rolls the query string AND passes `params` as the
// axios config object, which mangles it.
export const getBaselinePackageMeta = () =>
  axios.get(`${url.SOP_BASELINE_PACKAGE}/meta`);
export const listBaselinePackages = (params) =>
  axios.get(`${url.SOP_BASELINE_PACKAGE}/configs`, { params });
export const getBaselinePackageById = (id) =>
  axios.get(`${url.SOP_BASELINE_PACKAGE}/configs/${id}`);
export const createBaselinePackage = (payload) =>
  axios.post(`${url.SOP_BASELINE_PACKAGE}/configs`, payload);
export const updateBaselinePackage = (id, payload) =>
  axios.patch(`${url.SOP_BASELINE_PACKAGE}/configs/${id}`, payload);
export const toggleBaselinePackageActive = (id, isActive, effectiveFrom) =>
  axios.patch(`${url.SOP_BASELINE_PACKAGE}/configs/${id}/active`, {
    isActive,
    effectiveFrom,
  });
export const deleteBaselinePackage = (id) =>
  axios.delete(`${url.SOP_BASELINE_PACKAGE}/configs/${id}`);
export const previewBaselinePackage = (id, effectiveFrom) =>
  axios.post(`${url.SOP_BASELINE_PACKAGE}/configs/${id}/preview`, {
    effectiveFrom,
  });

export const uploadSopRuleDocument = (id, file) => {
  const fd = new FormData();
  fd.append("document", file);
  return axios.post(`${url.SOP_RULES}/${id}/document`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
export const deleteSopRuleDocument = (id) =>
  axios.delete(`${url.SOP_RULES}/${id}/document`);

export const getSopSuggestedMedicines = (patientId, today) =>
  axios.get(`${url.SOP_SUGGESTED_MEDICINES}/${patientId}`, {
    params: today ? { today } : undefined,
  });

// OCR BILL IMPORT
export const getMatchingMedicines = (data) =>
  api.create(url.OCR_GET_MATCHING_MEDICINES, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });

export const uploadOCRBill = (formData) =>
  api.create(url.OCR_UPLOAD_BILL, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      "X-No-Cookie-Token": "true",
    },
  });

export const checkPharmacyBatch = (data) =>
  api.create(url.OCR_CHECK_PHARMACY_BATCH, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });

export const checkExistingMedicineInPharmacy = (data) =>
  api.create(url.OCR_CHECK_EXISTING_MEDICINE, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });

export const confirmOCRMedicines = (data) =>
  api.create(url.OCR_CONFIRM_MEDICINES, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });

export const getOCRBillDetails = (billImportId) =>
  api.get(`${url.OCR_GET_BILL_DETAILS}/${billImportId}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });

export const getBillUploadRecords = (params = {}) =>
  api.get(url.OCR_GET_BILL_UPLOADS, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
    paramsSerializer: (parameters) =>
      qs.stringify(parameters, { arrayFormat: "repeat", skipNulls: true }),
  });

export const updateBillErrors = (data) =>
  api.create(url.OCR_UPDATE_BILL_ERRORS, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });

// PHARMACY EXCEL REPORTS
export const exportConsolidatedReport = (billImportId) => {
  return axios.get(`${url.PHARMACY_REPORT_CONSOLIDATED}/${billImportId}`, {
    responseType: "blob",
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const exportInventoryUpdateReport = (billImportId) => {
  return axios.get(`${url.PHARMACY_REPORT_INVENTORY_UPDATE}/${billImportId}`, {
    responseType: "blob",
    headers: { "X-No-Cookie-Token": "true" },
  });
};

// SAREYAAN INVENTORY IMPORT
export const getSareyaanInventoryImports = (params = {}) =>
  api.get(url.SAREYAAN_INVENTORY_IMPORT_LIST, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
    paramsSerializer: (parameters) =>
      qs.stringify(parameters, { arrayFormat: "repeat", skipNulls: true }),
  });

export const downloadSareyaanImportErrors = (importId) =>
  axios.get(
    `${url.SAREYAAN_INVENTORY_IMPORT_ERRORS_DOWNLOAD}/${importId}/errors/download`,
    {
      responseType: "blob",
      headers: { "X-No-Cookie-Token": "true" },
    },
  );

export const initSareyaanImport = (body) =>
  api.create(`${url.SAREYAAN_INVENTORY_IMPORT_LIST}/init`, body, {
    headers: { "X-No-Cookie-Token": "true" },
  });

export const processSareyaanImportChunk = (importId, body) =>
  api.create(`${url.SAREYAAN_INVENTORY_IMPORT_LIST}/${importId}/chunk`, body, {
    headers: { "X-No-Cookie-Token": "true" },
  });

// Create trainings
export const createTrainings = (formData) => {
  return axios.post(url.CREATE_TRAININGS, formData, {
    headers: {
      "Content-Type": undefined,
    },
  });
};

export const getByRoles = (params) => {
  return axios.get(url.GET_BY_ROLES, { params: params });
};

export const acknowledgeTraining = (trainingId) =>
  axios.patch(`${url.ACKNOWLEDGE_TRAINING}/${trainingId}`);

export const getLearnState = (trainingId) =>
  api.get(`${url.LEARN_TRAINING}/${trainingId}`);
export const markChapterFileOpened = (trainingId, fileId, data) =>
  axios.post(`${url.LEARN_TRAINING}/${trainingId}/files/${fileId}/open`, data);
export const saveVideoPosition = (trainingId, mediaId, data) =>
  postKeepalive(
    `${url.LEARN_TRAINING}/${trainingId}/videos/${mediaId}/position`,
    data,
  );
export const completeLearnVideo = (trainingId, mediaId, data) =>
  axios.post(
    `${url.LEARN_TRAINING}/${trainingId}/videos/${mediaId}/complete`,
    data,
  );
export const completeChapter = (trainingId, chapterId) =>
  axios.post(
    `${url.LEARN_TRAINING}/${trainingId}/chapters/${chapterId}/complete`,
    {},
  );
export const continueLesson = (trainingId, lessonId) =>
  axios.post(
    `${url.LEARN_TRAINING}/${trainingId}/lessons/${lessonId}/continue`,
    {},
  );
export const startQuizAttempt = (trainingId, data) =>
  axios.post(`${url.TRAINING_BASE}/${trainingId}/quiz/start`, data);
export const submitQuizAttempt = (trainingId, data) =>
  axios.post(`${url.TRAINING_BASE}/${trainingId}/quiz/submit`, data);

export const uploadTrainingFile = (file, kind, fields, config = {}) => {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, value);
  });
  formData.append("file", file);

  return axios.post(url.TRAINING_UPLOADS, formData, {
    params: { kind, size: file.size, name: file.name },
    headers: { "Content-Type": undefined },
    timeout: 0,
    ...config,
  });
};
export const renderDeclarationPages = (file) => {
  const formData = new FormData();
  formData.append("declaration", file);
  return axios.post(`${url.TRAINING_BASE}/declaration/render`, formData, {
    headers: { "Content-Type": undefined },
    timeout: 0,
  });
};
export const getAdminSignedCopy = (trainingId, employeeId, params) =>
  axios.get(
    `${url.TRAINING_ADMIN}/${trainingId}/declaration/signed/${employeeId}`,
    {
      params,
      responseType: "blob",
    },
  );
export const getDeclarationPreview = (trainingId) =>
  api.get(`${url.TRAINING_BASE}/${trainingId}/declaration/preview`);
export const markDeclarationRead = (trainingId) =>
  axios.post(`${url.TRAINING_BASE}/${trainingId}/declaration/read`, {});
export const getOwnSignedCopy = (trainingId, params) =>
  axios.get(`${url.TRAINING_BASE}/${trainingId}/declaration/signed`, {
    params,
    responseType: "blob",
  });
export const uploadTrainerVideo = (file, fields, config = {}) => {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, value);
  });
  formData.append("file", file);

  return axios.post(url.TRAINER_VIDEOS, formData, {
    params: { kind: "video", size: file.size, name: file.name },
    headers: { "Content-Type": undefined },
    timeout: 0,
    ...config,
  });
};
export const removeTrainerVideo = (recordId, videoId) =>
  axios.delete(`${url.TRAINER_VIDEOS}/${recordId}/${videoId}`);
export const getTrainingUploadStatus = (uploadId) =>
  api.get(`${url.TRAINING_UPLOADS}/${uploadId}`);
export const getMyTrainingUploads = (params) =>
  api.get(url.TRAINING_UPLOADS, { params });

export const markOverviewRead = (trainingId) =>
  axios.post(`${url.TRAINING_BASE}/${trainingId}/overview-read`, {});
export const getMyTrainingProgress = (trainingId) =>
  api.get(`${url.TRAINING_BASE}/${trainingId}/my-progress`);

export const getTrainingNotificationSummary = (params) =>
  api.get(`${url.TRAINING_NOTIFICATIONS}/summary`, { params });
export const getAssignedTrainingNotifications = () =>
  api.get(`${url.TRAINING_NOTIFICATIONS}/assigned`);
export const getCompletionTrainingList = (params) =>
  api.get(`${url.TRAINING_NOTIFICATIONS}/completion/trainings`, { params });
export const getCompletionTrainingDetail = (trainingId, params) =>
  api.get(`${url.TRAINING_NOTIFICATIONS}/completion/trainings/${trainingId}`, { params });

export const getTrainingAdminContent = (trainingId) =>
  api.get(`${url.TRAINING_ADMIN}/${trainingId}/content`);
export const getTrainingProgressReport = (trainingId, params) =>
  api.get(`${url.TRAINING_ADMIN}/${trainingId}/progress`, { params });
export const exportProgressCsv = (trainingId, params) =>
  axios.get(`${url.TRAINING_ADMIN}/${trainingId}/progress`, {
    params: { ...params, format: "csv" },
    responseType: "blob",
  });
export const getAllTrainings = (params) =>
  api.get(url.GET_ALL_TRAININGS, { params });

export const editTraining = (trainingId, formData) =>
  axios.patch(`${url.EDIT_TRAINING}/${trainingId}`, formData, {
    headers: { "Content-Type": undefined },
  });
export const getTrainingById = (id) =>
  api.get(`${url.GET_TRAINING_BY_ID}/${id}`);

export const getTrainingHistoryDetail = (params) =>
  api.get(url.GET_TRAINING_HISTORY, { params });

export const createTrainerRecord = (data) => {
  return api.create(url.CREATE_TRAINER_RECORD, data, {
    headers: { "Content-Type": undefined },
  });
};
export const getUsersByRoles = (params) => {
  return axios.get(url.GET_USER_BY_ROLE, { params });
};
export const getEmployeesByPosition = (params) => {
  return axios.get(url.GET_EMPLOYEES_BY_POSITION, { params });
};
export const getTrainerRecords = (params) =>
  axios.get(url.GET_TRAINERS, { params });
export const getTrainerRecordById = (id) =>
  axios.get(`${url.GET_TRAINER_BY_ID}/${id}`);
export const editTrainerRecord = (id, data) =>
  axios.patch(`${url.EDIT_TRAINER}/${id}`, data, {
    headers: { "Content-Type": undefined },
  });
export const deleteTrainerRecord = (id) =>
  axios.patch(`${url.DELETE_RECORD}/${id}`, {});
export const getRolesDisctinct = () => api.get(url.GET_DISCTINCT_ROLES);

export const getPositions = () =>
  axios.get(url.GET_POSITIONS, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });

// PROFILE
export const getEmployeeProfile = () => api.get(url.GET_EMPLOYEE_PROFILE);

// HR CONFIGS
export const addDepartments = (data) => api.create(url.ADD_DEPARTMENTS, data);

export const addPositions = (payload) =>
  api.create(url.ADD_POSITIONS, payload, {
    headers: { "X-No-Cookie-Token": "true" },
  });

export const getLeavesAndRegs = (emp) => {
  return api.get(url.GET_LEAVES_AND_REGULARIZATIONS, {
    params: emp ? { employeeId: emp } : {},
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const generateAddmissionSummary = (data) => {
  return axios.post(url.GENERATE_ADDMISSION_SUMMARY, data);
};

export const getAddmissionSummary = (addmission) => {
  return api.get(`${url.GET_ADDMISSION_SUMMARY}/${addmission}`);
};

export const getPatientBioData = (id) => {
  return api.get(`${url.GET_PATIENT_BIODATA}/${id}`);
};

export const postPsychoDiagnosticForm = (data) =>
  api.create(url.POST_PSYCHO_DIAGNOSTIC_FORM, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const editPsychoDiagnosticForm = (data) =>
  api.put(url.EDIT_PSYCHO_DIAGNOSTIC_FORM, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const postGeneralPsychoDiagnosticForm = (data) =>
  api.create(url.POST_GENERAL_PSYCHO_DIAGNOSTIC_FORM, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const editGeneralPsychoDiagnosticForm = (data) =>
  api.put(url.EDIT_GENERAL_PSYCHO_DIAGNOSTIC_FORM, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const generatePsychoDiagnosticForm = (data) =>
  api.create(url.GENERATE_PSYCHO_DIAGNOSTIC_SUMMARY, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const deletePsychoDiagnosticFormFile = (data) =>
  api.update(url.DELETE_PSYCHO_DIAGNOSTIC_FORM_FILE, data);

// Marketing - Visit Log
export const createVisitLog = (formData) =>
  axios.post(url.POST_VISIT_LOG, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      "X-No-Cookie-Token": "true",
    },
  });

export const getVisitLogs = (params = {}) =>
  axios.get(url.GET_VISIT_LOGS, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });

export const getVisitLogById = (id) =>
  axios.get(`${url.GET_VISIT_LOGS}/${id}`, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });

export const updateVisitLog = (id, data) =>
  axios.put(`${url.GET_VISIT_LOGS}/${id}`, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });

export const deleteVisitLog = (id) =>
  axios.delete(`${url.GET_VISIT_LOGS}/${id}`, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });

export const searchDoctors = (q) =>
  axios.get(`${url.GET_VISIT_LOGS}/doctors/search`, {
    params: { q },
    headers: { "X-No-Cookie-Token": "true" },
  });

export const getAgentVisitReport = (params = {}) =>
  axios.get(`${url.GET_VISIT_LOGS}/reports/agent-summary`, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });

export const getDoctorDirectory = (params = {}) =>
  axios.get(`${url.GET_VISIT_LOGS}/doctors-directory`, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });

export const exportAgentReport = (params = {}) =>
  axios.get(`${url.GET_VISIT_LOGS}/reports/agent-summary/export`, {
    params,
    responseType: "blob",
    headers: { "X-No-Cookie-Token": "true" },
  });
export const exportDoctorVisitHistory = (params = {}) =>
  axios.get(`${url.GET_VISIT_LOGS}/doctors-directory/history/export`, {
    params,
    responseType: "blob",
    headers: { "X-No-Cookie-Token": "true" },
  });

export const getDoctorVisitHistory = (params = {}) =>
  axios.get(`${url.GET_VISIT_LOGS}/doctors-directory/history`, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });

export const exportDoctorDirectory = (params = {}) =>
  axios.get(`${url.GET_VISIT_LOGS}/doctors-directory/export`, {
    params,
    responseType: "blob",
    headers: { "X-No-Cookie-Token": "true" },
  });

export const getFlaggedVisits = (params = {}) =>
  axios.get(`${url.GET_VISIT_LOGS}/flagged`, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });

// master data
export const getVendors = (params = {}) => {
  return axios.get(url.GET_VENDORS, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const getVendorById = (id) => {
  return axios.get(`${url.VENDOR_BASE}/${id}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const postEmployeeDocsConfiguration = (data) => {
  return axios.post(url.CONFIGURATION_DOCS, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const createVendor = (data) => {
  return axios.post(url.VENDOR_BASE, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const getEmployeeDocsConfiguration = (positionId) => {
  return axios.get(`${url.CONFIGURATION_DOCS}/${positionId}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const updateVendor = (id, data) => {
  return axios.put(`${url.VENDOR_BASE}/${id}`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const getDocuments = () => {
  return axios.get(url.DOC_INPUT_GET, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const updateVendorStatus = (id, status) => {
  return axios.patch(
    `${url.VENDOR_BASE}/${id}/status`,
    { status },
    {
      headers: { "X-No-Cookie-Token": "true" },
    },
  );
};

export const addDocuments = (data) => {
  return axios.post(url.DOC_INPUT_POST, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const uploadVendorDocument = (id, formData) => {
  return axios.post(`${url.VENDOR_BASE}/${id}/documents`, formData, {
    headers: {
      "X-No-Cookie-Token": "true",
      "Content-Type": "multipart/form-data",
    },
  });
};

export const editDocument = (id, data) => {
  return axios.patch(`${url.DOC_INPUT_EDIT}/${id}`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const deleteDocument = (id) => {
  return axios.patch(`${url.DOC_INPUT_DELETE}/${id}`, null, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const getEmployeeDocumentFields = () => {
  return axios.get(url.EMPLOYEE_DOC_FIELDS, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const uploadEmployeeDocument = (formData) => {
  return axios.post(url.EMPLOYEE_DOC_UPLOAD, formData, {
    headers: {
      "X-No-Cookie-Token": "true",
      "Content-Type": "multipart/form-data",
    },
  });
};

export const deleteVendorDocument = (id, docId) => {
  return axios.delete(`${url.VENDOR_BASE}/${id}/documents/${docId}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const getItemTypes = (params = {}) => {
  return axios.get(url.GET_ITEM_TYPES, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const getItemTypeById = (id) => {
  return axios.get(`${url.ITEM_TYPE_BASE}/${id}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const updateItemType = (id, data) => {
  return axios.put(`${url.ITEM_TYPE_BASE}/${id}`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const updateItemTypeStatus = (id, status) => {
  return axios.patch(
    `${url.ITEM_TYPE_BASE}/${id}/status`,
    { status },
    { headers: { "X-No-Cookie-Token": "true" } },
  );
};

export const createItemType = (data) => {
  return axios.post(url.ITEM_TYPE_BASE, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const getItemMasters = (params = {}) => {
  return axios.get(url.GET_ITEM_MASTERS, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const getItemMasterById = (id) => {
  return axios.get(`${url.ITEM_MASTER_BASE}/${id}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const createItemMaster = (data) => {
  return axios.post(url.ITEM_MASTER_BASE, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const updateItemMaster = (id, data) => {
  return axios.put(`${url.ITEM_MASTER_BASE}/${id}`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const updateItemMasterStatus = (id, status) => {
  return axios.patch(
    `${url.ITEM_MASTER_BASE}/${id}/status`,
    { status },
    { headers: { "X-No-Cookie-Token": "true" } },
  );
};

export const deleteEmployeeDocumentFile = (documentId, fileId) => {
  return axios.patch(
    `${url.EMPLOYEE_DOC_DELETE}/${documentId}/${fileId}`,
    null,
    { headers: { "X-No-Cookie-Token": "true" } },
  );
};

export const getEmployeeDocumentsByEmployeeId = (employeeId) => {
  return axios.get(`${url.EMPLOYEE_DOC_BY_ID}/by-employee/${employeeId}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const deleteEmployeeDocumentFileByEmployeeId = (
  employeeId,
  documentId,
  fileId,
) => {
  return axios.patch(
    `${url.EMPLOYEE_DOC_DELETE_BY_EMP_ID}/by-employee/${employeeId}/${documentId}/${fileId}`,
    null,
    { headers: { "X-No-Cookie-Token": "true" } },
  );
};

export const getEmployeeDocumentFieldsByEmployeeId = (employeeId) => {
  return axios.get(`${url.EMPLOYEE_DOC_BY_EMPID}/${employeeId}/fields`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const getAllEmployeeDocuments = (params) => {
  return axios.get(`${url.EMPLOYEE_DOCS}`, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const reviewEmployeeDocumentFile = (employeeDocId, fileId, payload) => {
  return axios.patch(
    `${url.REVIEW_DOC}/${employeeDocId}/${fileId}/review`,
    payload,
    { headers: { "X-No-Cookie-Token": "true" } },
  );
};

export const postCGISTest = (data) =>
  api.create(url.CGIS_TEST, data, {
    headers: {
      "Content-Type": "multipart/form-data",
      "X-No-Cookie-Token": "true",
    },
  });

export const postCOWSTest = (data) =>
  api.create(url.COWS_TEST, data, {
    headers: {
      "Content-Type": "multipart/form-data",
      "X-No-Cookie-Token": "true",
    },
  });

export const postCIWABTest = (data) =>
  api.create(url.CIWA_B_TEST, data, {
    headers: {
      "Content-Type": "multipart/form-data",
      "X-No-Cookie-Token": "true",
    },
  });

export const postAUDITTest = (data) =>
  api.create(url.AUDIT_TEST, data, {
    headers: {
      "Content-Type": "multipart/form-data",
      "X-No-Cookie-Token": "true",
    },
  });

// ── Center floors master ────────────────────────────────────────────────────
export const getFloors = () => {
  return axios.get(url.FLOOR_INPUT_GET, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const addFloors = (data) => {
  return axios.post(url.FLOOR_INPUT_POST, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const editFloor = (id, data) => {
  return axios.patch(`${url.FLOOR_INPUT_EDIT}/${id}`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const deleteFloor = (id) => {
  return axios.patch(`${url.FLOOR_INPUT_DELETE}/${id}`, null, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

// ── Center areas master (rooms / kitchen / bathroom …) ──────────────────────
export const getAreas = () => {
  return axios.get(url.AREA_INPUT_GET, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const addAreas = (data) => {
  return axios.post(url.AREA_INPUT_POST, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const editArea = (id, data) => {
  return axios.patch(`${url.AREA_INPUT_EDIT}/${id}`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const deleteArea = (id) => {
  return axios.patch(`${url.AREA_INPUT_DELETE}/${id}`, null, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

// ── Per-center floor configuration ──────────────────────────────────────────
export const postCenterFloorsConfiguration = (data) => {
  return axios.post(url.CONFIGURATION_FLOORS, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const getCenterFloorsConfiguration = (centerId) => {
  return axios.get(`${url.CONFIGURATION_FLOORS}/${centerId}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const getCenterFloorsConfigurationSummary = () => {
  return axios.get(url.CONFIGURATION_FLOORS_SUMMARY, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

// ── Center floor photos ─────────────────────────────────────────────────────
export const getCenterFloorFields = (centerId, params) => {
  return axios.get(`${url.CENTER_FLOOR_PHOTOS}/${centerId}/fields`, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const uploadCenterFloorPhoto = (formData) => {
  return axios.post(url.CENTER_FLOOR_PHOTO_UPLOAD, formData, {
    headers: {
      "X-No-Cookie-Token": "true",
      "Content-Type": "multipart/form-data",
    },
  });
};

export const uploadItemImage = (id, formData) => {
  return axios.post(`${url.ITEM_MASTER_BASE}/${id}/images`, formData, {
    headers: {
      "X-No-Cookie-Token": "true",
      "Content-Type": "multipart/form-data",
    },
  });
};
export const deleteItemImage = (id, imageId) => {
  return axios.delete(`${url.ITEM_MASTER_BASE}/${id}/images/${imageId}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const getUoms = (params = {}) => {
  return axios.get(url.GET_UOMS, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const deleteCenterFloorPhotoFile = (recordId, fileId) => {
  return axios.patch(
    `${url.CENTER_FLOOR_PHOTOS}/${recordId}/files/${fileId}/delete`,
    null,
    { headers: { "X-No-Cookie-Token": "true" } },
  );
};

export const getAllCenterFloorPhotos = (params) => {
  return axios.get(url.CENTER_FLOOR_PHOTOS_ALL, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
};

// Reviews the whole location record — cleanliness and safety describe the
// location, not an individual photo.
export const reviewCenterFloorPhotoRecord = (recordId, data) => {
  return axios.patch(`${url.CENTER_FLOOR_PHOTOS}/${recordId}/review`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

// Audit days recorded for one center, newest first — drives the timeline.
export const getCenterAuditTimeline = (params) => {
  return axios.get(url.CENTER_FLOOR_AUDITS, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const addBiometricAdditionRequest = (data) =>
  axios.post(url.ADD_BIOMETRIC_ADDITION_REQUEST, data, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });

export const getBiometricAdditionRequestsData = (params = {}) =>
  axios.get(url.GET_BIOMETRIC_ADDITION_REQUESTS, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });

export const getUsersByRole = () =>
  axios.get(url.GET_USERS_BY_ROLE, {
    headers: {
      "X-No-Cookie-Token": "true",
    },
  });

export const actionOnBiometricAdditionRequest = (params = {}) =>
  axios.patch(url.ACTION_ON_BIOMETRIC_ADDITION_REQUEST, null, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });

export const getMyAssignedBiometricsData = (params = {}) =>
  axios.get(url.GET_MY_ASSIGNED_BIOMETRICS, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });

export const updateAssigneeStatusData = (params = {}) =>
  axios.patch(url.UPDATE_ASSIGNEE_STATUS, null, {
    params,
    headers: {
      "X-No-Cookie-Token": "true",
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });

export const addNewJoiningBiometricData = (data) =>
  axios.post(url.NEW_JOINING_BIOMETRIC_DATA, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });

export const getNewJoiningBiometricData = (params = {}) =>
  axios.get(url.NEW_JOINING_BIOMETRIC_DATA, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });

export const actionOnNewJoiningBiometricData = (params = {}) =>
  axios.patch(url.ACTION_ON_NEW_JOINING_BIOMETRIC_DATA, null, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });

// center fallbacks
export const getCentersWithFallbackManager = () => {
  return axios.get(url.GET_CENTERS_FALLBACK_MANAGERS, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const setFallbackCentreManager = (data) => {
  return axios.patch(url.SET_FALLBACK_CENTRE_MANAGER, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const createUom = (data) => {
  return axios.post(url.UOM_BASE, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const updateUom = (id, data) => {
  return axios.put(`${url.UOM_BASE}/${id}`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const updateUomStatus = (id, status) => {
  return axios.patch(
    `${url.UOM_BASE}/${id}/status`,
    { status },
    { headers: { "X-No-Cookie-Token": "true" } },
  );
};

export const deleteUom = (id) => {
  return axios.delete(`${url.UOM_BASE}/${id}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const deleteItemMaster = (id) => {
  return axios.delete(`${url.ITEM_MASTER_BASE}/${id}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const previewItemImport = (formData) => {
  return axios.post(`${url.ITEM_MASTER_BASE}/import/preview`, formData, {
    headers: {
      "X-No-Cookie-Token": "true",
      "Content-Type": "multipart/form-data",
    },
  });
};

export const confirmItemImport = (rows) => {
  return axios.post(
    `${url.ITEM_MASTER_BASE}/import/confirm`,
    { rows },
    { headers: { "X-No-Cookie-Token": "true" } },
  );
};
export const deleteVendor = (id) => {
  return axios.delete(`${url.VENDOR_BASE}/${id}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const createDraft = (formData) =>
  axios.post(`${url.GET_VISIT_LOGS}/draft`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      "X-No-Cookie-Token": "true",
    },
  });

export const updateDraft = (id, formData) =>
  axios.put(`${url.GET_VISIT_LOGS}/draft/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      "X-No-Cookie-Token": "true",
    },
  });

export const submitDraft = (id, formData) =>
  axios.post(`${url.GET_VISIT_LOGS}/draft/${id}/submit`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      "X-No-Cookie-Token": "true",
    },
  });

export const discardDraft = (id) =>
  axios.delete(`${url.GET_VISIT_LOGS}/draft/${id}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const listMyDrafts = () =>
  axios.get(`${url.GET_VISIT_LOGS}/drafts`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const getPaymentTerms = (params = {}) => {
  return axios.get(url.PAYMENT_TERM_BASE, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const createPaymentTerm = (data) => {
  return axios.post(url.PAYMENT_TERM_BASE, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const updatePaymentTerm = (id, data) => {
  return axios.put(`${url.PAYMENT_TERM_BASE}/${id}`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const updatePaymentTermStatus = (id, status) => {
  return axios.patch(
    `${url.PAYMENT_TERM_BASE}/${id}/status`,
    { status },
    { headers: { "X-No-Cookie-Token": "true" } },
  );
};
export const deletePaymentTerm = (id) => {
  return axios.delete(`${url.PAYMENT_TERM_BASE}/${id}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const getAssetCategories = (params = {}) => {
  return axios.get(url.ASSET_CATEGORY_BASE, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const createAssetCategory = (data) => {
  return axios.post(url.ASSET_CATEGORY_BASE, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const updateAssetCategory = (id, data) => {
  return axios.put(`${url.ASSET_CATEGORY_BASE}/${id}`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const updateAssetCategoryStatus = (id, status) => {
  return axios.patch(
    `${url.ASSET_CATEGORY_BASE}/${id}/status`,
    { status },
    { headers: { "X-No-Cookie-Token": "true" } },
  );
};
export const deleteAssetCategory = (id) => {
  return axios.delete(`${url.ASSET_CATEGORY_BASE}/${id}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const getPRDepartments = (params = {}) => {
  return axios.get(url.PR_DEPARTMENT_BASE, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const createPRDepartment = (data) => {
  return axios.post(url.PR_DEPARTMENT_BASE, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const updatePRDepartment = (id, data) => {
  return axios.put(`${url.PR_DEPARTMENT_BASE}/${id}`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const deletePRDepartment = (id) => {
  return axios.delete(`${url.PR_DEPARTMENT_BASE}/${id}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const getPRSubDepartments = (params = {}) => {
  return axios.get(url.PR_SUB_DEPARTMENT_BASE, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const createPRSubDepartment = (data) => {
  return axios.post(url.PR_SUB_DEPARTMENT_BASE, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const updatePRSubDepartment = (id, data) => {
  return axios.put(`${url.PR_SUB_DEPARTMENT_BASE}/${id}`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const deletePRSubDepartment = (id) => {
  return axios.delete(`${url.PR_SUB_DEPARTMENT_BASE}/${id}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const updateVendorApprovalStatus = (id, approvalStatus) => {
  return axios.patch(
    `${url.VENDOR_BASE}/${id}/approval-status`,
    { approvalStatus },
    { headers: { "X-No-Cookie-Token": "true" } },
  );
};
export const getBudgets = (params = {}) => {
  return axios.get(url.BUDGET_BASE, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const createBudget = (data) => {
  return axios.post(url.BUDGET_BASE, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const updateBudget = (id, data) => {
  return axios.put(`${url.BUDGET_BASE}/${id}`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const submitBudget = (id) => {
  return axios.patch(
    `${url.BUDGET_BASE}/${id}/submit`,
    {},
    { headers: { "X-No-Cookie-Token": "true" } },
  );
};
export const approveBudget = (id, approvedAmount) => {
  return axios.patch(
    `${url.BUDGET_BASE}/${id}/approve`,
    { approvedAmount },
    { headers: { "X-No-Cookie-Token": "true" } },
  );
};
export const rejectBudget = (id, rejectionReason) => {
  return axios.patch(
    `${url.BUDGET_BASE}/${id}/reject`,
    { rejectionReason },
    { headers: { "X-No-Cookie-Token": "true" } },
  );
};
export const deleteBudget = (id) => {
  return axios.delete(`${url.BUDGET_BASE}/${id}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const getUserLookup = (params = {}) => {
  return axios.get(url.USER_LOOKUP_BASE, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const deleteItemType = (id) => {
  return axios.delete(`${url.ITEM_TYPE_BASE}/${id}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const getPRs = (params = {}) => {
  return axios.get(url.PR_BASE, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const createPR = (data) => {
  return axios.post(url.PR_BASE, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const updatePR = (id, data) => {
  return axios.put(`${url.PR_BASE}/${id}`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const submitPR = (id) => {
  return axios.patch(
    `${url.PR_BASE}/${id}/submit`,
    {},
    { headers: { "X-No-Cookie-Token": "true" } },
  );
};
export const approvePR = (id) => {
  return axios.patch(
    `${url.PR_BASE}/${id}/approve`,
    {},
    { headers: { "X-No-Cookie-Token": "true" } },
  );
};
export const rejectPR = (id, rejectionReason) => {
  return axios.patch(
    `${url.PR_BASE}/${id}/reject`,
    { rejectionReason },
    { headers: { "X-No-Cookie-Token": "true" } },
  );
};
export const deletePR = (id) => {
  return axios.delete(`${url.PR_BASE}/${id}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

export const getRFQs = (params = {}) => {
  return axios.get(url.RFQ_BASE, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const createRFQ = (data) => {
  return axios.post(url.RFQ_BASE, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const getRFQById = (id) => {
  return axios.get(`${url.RFQ_BASE}/${id}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const recordVendorQuote = (rfqId, vendorQuoteId, data) => {
  return axios.patch(
    `${url.RFQ_BASE}/${rfqId}/vendor-quote/${vendorQuoteId}`,
    data,
    { headers: { "X-No-Cookie-Token": "true" } },
  );
};
export const closeRFQ = (id, data = {}) => {
  return axios.patch(`${url.RFQ_BASE}/${id}/close`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const deleteRFQ = (id) => {
  return axios.delete(`${url.RFQ_BASE}/${id}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const getPOs = (params = {}) => {
  return axios.get(url.PO_BASE, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const createPO = (data) => {
  return axios.post(url.PO_BASE, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const getPOById = (id) => {
  return axios.get(`${url.PO_BASE}/${id}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const updatePO = (id, data) => {
  return axios.put(`${url.PO_BASE}/${id}`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const approvePO = (id) => {
  return axios.patch(
    `${url.PO_BASE}/${id}/approve`,
    {},
    { headers: { "X-No-Cookie-Token": "true" } },
  );
};
export const deletePO = (id) => {
  return axios.delete(`${url.PO_BASE}/${id}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const getClosedRFQs = (params = {}) => {
  return axios.get(url.RFQ_BASE, {
    params: { ...params, status: "closed" },
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const getContracts = (params = {}) => {
  return axios.get(url.CONTRACT_BASE, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const createContract = (data) => {
  return axios.post(url.CONTRACT_BASE, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const getContractById = (id) => {
  return axios.get(`${url.CONTRACT_BASE}/${id}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const updateContract = (id, data) => {
  return axios.put(`${url.CONTRACT_BASE}/${id}`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const updateContractStatus = (id, status) => {
  return axios.patch(
    `${url.CONTRACT_BASE}/${id}/status`,
    { status },
    { headers: { "X-No-Cookie-Token": "true" } },
  );
};
export const deleteContract = (id) => {
  return axios.delete(`${url.CONTRACT_BASE}/${id}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const getPOsForDelivery = (params = {}) => {
  return axios.get(url.DI_BASE_POS, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const createDI = (formData) => {
  return axios.post(url.DI_BASE, formData, {
    headers: {
      "X-No-Cookie-Token": "true",
      "Content-Type": "multipart/form-data",
    },
  });
};
export const getDIs = (params = {}) => {
  return axios.get(url.DI_BASE, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const getDIById = (id) => {
  return axios.get(`${url.DI_BASE}/${id}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const markDIReceived = (id) => {
  return axios.patch(
    `${url.DI_BASE}/${id}/received`,
    {},
    { headers: { "X-No-Cookie-Token": "true" } },
  );
};
export const deleteDI = (id) => {
  return axios.delete(`${url.DI_BASE}/${id}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
// GRN
export const getDIsForGRN = () => {
  return axios.get(url.GRN_BASE_DI, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const createGRN = (data) => {
  return axios.post(url.GRN_BASE, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const getGRNs = (params = {}) => {
  return axios.get(url.GRN_BASE, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const getGRNById = (id) => {
  return axios.get(`${url.GRN_BASE}/${id}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

// Vendor Invoice
export const getGRNsForInvoice = () => {
  return axios.get(url.VI_BASE_GRN, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const createVendorInvoice = (data) => {
  return axios.post(url.VI_BASE, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const getVendorInvoices = (params = {}) => {
  return axios.get(url.VI_BASE, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const getVendorInvoiceById = (id) => {
  return axios.get(`${url.VI_BASE}/${id}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const bookVendorInvoice = (id) => {
  return axios.patch(
    `${url.VI_BASE}/${id}/book`,
    {},
    { headers: { "X-No-Cookie-Token": "true" } },
  );
};
export const holdVendorInvoice = (id, mismatchNotes) => {
  return axios.patch(
    `${url.VI_BASE}/${id}/hold`,
    { mismatchNotes },
    { headers: { "X-No-Cookie-Token": "true" } },
  );
};
export const markVendorInvoicePaid = (id) => {
  return axios.patch(
    `${url.VI_BASE}/${id}/paid`,
    {},
    { headers: { "X-No-Cookie-Token": "true" } },
  );
};
// Storage Location
export const getStorageLocations = (params = {}) => {
  return axios.get(url.STORAGE_LOCATION_BASE, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const createStorageLocation = (data) => {
  return axios.post(url.STORAGE_LOCATION_BASE, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const updateStorageLocation = (id, data) => {
  return axios.put(`${url.STORAGE_LOCATION_BASE}/${id}`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const deleteStorageLocation = (id) => {
  return axios.delete(`${url.STORAGE_LOCATION_BASE}/${id}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};

// Putaway
export const getGRNsForPutaway = () => {
  return axios.get(url.PUTAWAY_BASE_GRN, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const createPutaway = (data) => {
  return axios.post(url.PUTAWAY_BASE, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const getPutaways = (params = {}) => {
  return axios.get(url.PUTAWAY_BASE, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const getPutawayById = (id) => {
  return axios.get(`${url.PUTAWAY_BASE}/${id}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
};
// export const createMaterialIssue = (data) => {
//   return axios.post(url.MATERIAL_ISSUE_BASE, data, {
//     headers: { "X-No-Cookie-Token": "true" },
//   });
// };
// export const createMaterialReturn = (data) => {
//   return axios.post(url.MATERIAL_RETURN_BASE, data, {
//     headers: { "X-No-Cookie-Token": "true" },
//   });
// };
export const getStockBalances = (params = {}) => {
  return axios.get(url.STOCK_BALANCE_BASE, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const getStockLedger = (params = {}) => {
  return axios.get(url.STOCK_LEDGER_BASE, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const getPOsForGRN = (params = {}) => {
  return axios.get(url.GRN_BASE_PO, {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
};
export const getInventoryTransfers = () =>
  axios.get("/master/inventory-transfer", {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const createInventoryTransfer = (data) =>
  axios.post("/master/inventory-transfer", data, {
    headers: { "X-No-Cookie-Token": "true" },
  });

export const getMoveOrders = () =>
  axios.get("/master/move-order", { headers: { "X-No-Cookie-Token": "true" } });
export const createMoveOrder = (data) =>
  axios.post("/master/move-order", data, {
    headers: { "X-No-Cookie-Token": "true" },
  });

export const getCycleCounts = () =>
  axios.get("/master/cycle-count", {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const createCycleCount = (data) =>
  axios.post("/master/cycle-count", data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const reconcileCycleCount = (id) =>
  axios.patch(
    `/master/cycle-count/${id}/reconcile`,
    {},
    { headers: { "X-No-Cookie-Token": "true" } },
  );

export const getStockAdjustments = () =>
  axios.get("/master/stock-adjustment", {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const createStockAdjustment = (data) =>
  axios.post("/master/stock-adjustment", data, {
    headers: { "X-No-Cookie-Token": "true" },
  });

export const getReorderRules = () =>
  axios.get("/master/reorder-rule", {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const createReorderRule = (data) =>
  axios.post("/master/reorder-rule", data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const deleteReorderRule = (id) =>
  axios.delete(`/master/reorder-rule/${id}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const getReorderAlerts = () =>
  axios.get("/master/reorder-rule/alerts", {
    headers: { "X-No-Cookie-Token": "true" },
  });

export const getLocationStock = (params = {}) =>
  axios.get("/master/location-stock", {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });

export const createMaterialIssue = (data) =>
  axios.post("/master/material-issue", data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const getMaterialIssues = () =>
  axios.get("/master/material-issue", {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const getIssuesForReturn = () =>
  axios.get("/master/material-return/pending-issue", {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const createMaterialReturn = (data) =>
  axios.post("/master/material-return", data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const getMaterialReturns = () =>
  axios.get("/master/material-return", {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const createCapitalizationRequest = (data) =>
  axios.post("/master/capitalization-request", data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const getCapitalizationRequests = (params = {}) =>
  axios.get("/master/capitalization-request", {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
export const approveCapitalizationRequest = (id) =>
  axios.patch(
    `/master/capitalization-request/${id}/approve`,
    {},
    { headers: { "X-No-Cookie-Token": "true" } },
  );
export const rejectCapitalizationRequest = (id, data) =>
  axios.patch(`/master/capitalization-request/${id}/reject`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });

export const getApprovedRequestsForCWIP = () =>
  axios.get("/master/cwip/pending-request", {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const createCWIP = (data) =>
  axios.post("/master/cwip", data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const getCWIPs = (params = {}) =>
  axios.get("/master/cwip", {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
export const markCWIPReady = (id, data) =>
  axios.patch(`/master/cwip/${id}/ready`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });

export const getReadyCWIPs = () =>
  axios.get("/master/asset-capitalization/pending-cwip", {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const createAssetCapitalization = (data) =>
  axios.post("/master/asset-capitalization", data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const getAssetCapitalizations = () =>
  axios.get("/master/asset-capitalization", {
    headers: { "X-No-Cookie-Token": "true" },
  });

export const getFixedAssets = (params = {}) =>
  axios.get("/master/fixed-asset", {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
export const updateFixedAsset = (id, data) =>
  axios.put(`/master/fixed-asset/${id}`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });

export const createFixedAsset = (data) =>
  axios.post("/master/fixed-asset", data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const getFixedAsset = (id) =>
  axios.get(`/master/fixed-asset/${id}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const assignFixedAsset = (id, data) =>
  axios.post(`/master/fixed-asset/${id}/assign`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const returnFixedAsset = (id, data) =>
  axios.post(`/master/fixed-asset/${id}/return`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const getAssetsByEmployee = (employeeId) =>
  axios.get(`/master/fixed-asset/by-employee/${employeeId}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const searchEmployeesForAsset = (q) =>
  axios.get("/master/fixed-asset/employee-search", {
    params: { q },
    headers: { "X-No-Cookie-Token": "true" },
  });

export const createMaintenanceRequest = (data) =>
  axios.post("/master/maintenance-request", data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const getMaintenanceRequests = (params = {}) =>
  axios.get("/master/maintenance-request", {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
export const approveMaintenanceRequest = (id) =>
  axios.patch(
    `/master/maintenance-request/${id}/approve`,
    {},
    { headers: { "X-No-Cookie-Token": "true" } },
  );
export const rejectMaintenanceRequest = (id, data) =>
  axios.patch(`/master/maintenance-request/${id}/reject`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });

export const getWorkOrders = (params = {}) =>
  axios.get("/master/work-order", {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
export const updateWorkOrder = (id, data) =>
  axios.put(`/master/work-order/${id}`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const getAssetTransferRequests = (params = {}) =>
  axios.get("/master/asset-transfer", {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
export const createAssetTransferRequest = (data) =>
  axios.post("/master/asset-transfer", data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const getAssetWriteOffRequests = (params = {}) =>
  axios.get("/master/asset-writeoff-request", {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
export const createAssetWriteOffRequest = (data) =>
  axios.post("/master/asset-writeoff-request", data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const approveAssetWriteOffRequest = (id) =>
  axios.patch(
    `/master/asset-writeoff-request/${id}/approve`,
    {},
    { headers: { "X-No-Cookie-Token": "true" } },
  );
export const rejectAssetWriteOffRequest = (id, data) =>
  axios.patch(`/master/asset-writeoff-request/${id}/reject`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const getTaskTemplates = (params = {}) =>
  axios.get("/master/task-template", {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
export const createTaskTemplate = (data) =>
  axios.post("/master/task-template", data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const updateTaskTemplate = (id, data) =>
  axios.put(`/master/task-template/${id}`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const deleteTaskTemplate = (id) =>
  axios.delete(`/master/task-template/${id}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const getTaskTemplateCategories = () =>
  axios.get("/master/task-template-category", {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const createTaskTemplateCategory = (data) =>
  axios.post("/master/task-template-category", data, {
    headers: { "X-No-Cookie-Token": "true" },
  });

export const getPMSchedules = (params = {}) =>
  axios.get("/master/pm-schedule", {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
export const createPMSchedule = (data) =>
  axios.post("/master/pm-schedule", data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const updatePMSchedule = (id, data) =>
  axios.put(`/master/pm-schedule/${id}`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const generateDueWorkOrders = () =>
  axios.post(
    "/master/pm-schedule/generate-due",
    {},
    { headers: { "X-No-Cookie-Token": "true" } },
  );

export const getMaintenanceJobs = (params = {}) =>
  axios.get("/master/maintenance-job", {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
export const createMaintenanceJob = (data) =>
  axios.post("/master/maintenance-job", data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const updateMaintenanceJob = (id, data) =>
  axios.put(`/master/maintenance-job/${id}`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const getVerificationJobs = (params = {}) =>
  axios.get("/master/verification-job", {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
export const createVerificationJob = (data) =>
  axios.post("/master/verification-job", data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const updateVerificationJob = (id, data) =>
  axios.put(`/master/verification-job/${id}`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });

export const getPhysicalVerifications = (params = {}) =>
  axios.get("/master/physical-verification", {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
export const createPhysicalVerification = (data) =>
  axios.post("/master/physical-verification", data, {
    headers: { "X-No-Cookie-Token": "true" },
  });

export const getAssetTags = (params = {}) =>
  axios.get("/master/asset-tag", {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
export const createAssetTags = (data) =>
  axios.post("/master/asset-tag", data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const reviewPhysicalVerification = (id, data) =>
  axios.patch(`/master/physical-verification/${id}/review`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const uploadPhysicalVerificationImage = (id, imageType, formData) =>
  axios.post(
    `/master/physical-verification/${id}/upload-image?imageType=${imageType}`,
    formData,
    {
      headers: {
        "X-No-Cookie-Token": "true",
        "Content-Type": "multipart/form-data",
      },
    },
  );
// ---- Asset scans (Scan Intake / Add Scan) and the extra asset tag actions ----
export const getAssetScans = (params = {}) =>
  axios.get("/master/asset-scan", {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });
export const getAssetScan = (id) =>
  axios.get(`/master/asset-scan/${id}`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const createAssetScan = (data) =>
  axios.post("/master/asset-scan", data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const updateAssetScan = (id, data) =>
  axios.put(`/master/asset-scan/${id}`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
// action: verify | reject | halt (data: { reason }). "verify" is shown to the user as Approve
export const actOnAssetScan = (id, action, data = {}) =>
  axios.patch(`/master/asset-scan/${id}/${action}`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const bulkActOnAssetScans = (data) =>
  axios.post("/master/asset-scan/bulk-action", data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const downloadAssetScanTemplate = () =>
  axios.get("/master/asset-scan/template", {
    responseType: "blob",
    headers: { "X-No-Cookie-Token": "true" },
  });
export const uploadAssetScans = (formData) =>
  axios.post("/master/asset-scan/upload", formData, {
    headers: {
      "X-No-Cookie-Token": "true",
      "Content-Type": "multipart/form-data",
    },
  });

// Photos on a verification. imageType: asset | tag. The file is sent in the form field "file".
export const uploadAssetScanImage = (id, imageType, formData) =>
  axios.post(`/master/asset-scan/${id}/image?imageType=${imageType}`, formData, {
    headers: {
      "X-No-Cookie-Token": "true",
      "Content-Type": "multipart/form-data",
    },
  });
export const deleteAssetScanImage = (id, path) =>
  axios.delete(`/master/asset-scan/${id}/image`, {
    data: { path },
    headers: { "X-No-Cookie-Token": "true" },
  });

export const createSingleAssetTag = (data) =>
  axios.post("/master/asset-tag/single", data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const markAssetTagStatus = (id, data) =>
  axios.patch(`/master/asset-tag/${id}/status`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const fitAssetTag = (id, data) =>
  axios.post(`/master/asset-tag/${id}/fit`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });

export const getProcurementDashboard = () =>
  axios.get("/master/po-dashboard", {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const setPODelayReason = (id, data) =>
  axios.patch(`/master/po/${id}/delay-reason`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });

export const cancelPO = (id, data) =>
  axios.patch(`/master/po/${id}/cancel`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const shortClosePO = (id, data) =>
  axios.patch(`/master/po/${id}/short-close`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const getAuditLogs = (params) =>
  axios.get("/master/audit-logs", {
    params,
    headers: { "X-No-Cookie-Token": "true" },
  });

export const getBudgetUsage = (id) =>
  axios.get(`/master/budget/${id}/usage`, {
    headers: { "X-No-Cookie-Token": "true" },
  });
export const adjustBudgetAmount = (id, data) =>
  axios.patch(`/master/budget/${id}/adjust`, data, {
    headers: { "X-No-Cookie-Token": "true" },
  });
