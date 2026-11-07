import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getMIHubSpotContacts,
  getCenterLeadsMoM as fetchCenterMoM,
  getCenterLeadsMTD as fetchCenterMTD,
  getOwnerLeadsMoM as fetchOwnerMoM,
  getOwnerLeadsMTD as fetchOwnerMTD,
  getCityQualityBreakdown as fetchCityQuality,
  getOwnerQualityBreakdown as fetchOwnerQuality,
  getCityVisitDate as fetchCityVisit,
  getOwnerVisitDate as fetchOwnerVisit,
  getCityVisitedDate as fetchCityVisited,
  getOwnerVisitedDate as fetchOwnerVisited,
  getCityLeadStatus,
  getOwnerLeadStatus,
  getRefundAmountMOM,
  getRoundNotesDOD,
  getClinicalNotesDOD,
  getCounsellingSessionsPatientsDOD,
  getVitalSignsDOD,
  getNursesDOD,
  getPatientDocs,
  getOpdPatientDocs,
  getDailyInvoices,
  getCounsellingSessions,
  getCounsellingRecordings,
  getDailyDashboard,
  getDocsCompliance,
  getDueAmount,
  getMissingInvoices,
  getMIAttendance,
  getCenterWiseMOM,
  getCampaignWiseMOM,
  getCenterWiseStatusMOM,
  getCashPerCenter,
  getWriteOffAmount,
  getTrainingFormsWeekly,
  getTrainingFormsMonthly,
  getAuditDaily,
  getMetricsReport,
  getOccupancyMonthly,
  getAdmissionDischargeDaily,
  getOpdChargesMonthly,
  getDoctorOpdChargesMonthly,
  getDoctorOpdChargesDetail,
  getCentralExpensesMonthly,
  getDoctorPsychologistStayRange,
  getNursesDailyActivity,
  getIncidentStatusMonthly,
  getReadmissionMonthly,
  getAttritionMonthly,
  getAssignedData,
  getPatientsWithSuspendedStaff,
  getSopAlertsMonthly,
  getCashRecoCompliance,
  getReferralData,

} from "../../../helpers/backend_helper";

const initialState = {
  data: [],
  contacts: [],
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },
  centerLeadsMoM: [],
  centerLeadsMTD: [],
  ownerLeadsMoM: [],
  ownerLeadsMTD: [],
  cityQuality: [],
  ownerQuality: [],
  cityVisitDate: [],
  ownerVisitDate: [],
  cityVisitedDate: [],
  ownerVisitedDate: [],
  cityLeadStatus: [],
  ownerLeadStatus: [],
  refundAmountMOM:[],
  fetchRoundNotesDOD:[],
  fetchVitalSignsDOD:[],
  patientDocs:[],
  opdPatientDocs:[],
  dailyInvoices:[],
  counsellingSessions:[],
  counsellingRecordings:[],
  dailyDashboard:[],
  docsCompliance: [],
  dueAmount: [],
  missingInvoices: [],
  miAttendance: [],
  nursesDOD: [],
  centerWiseMOM: [],
  campaignWiseMOM: [],
  centerWiseStatusMOM: [],
  cashPerCenter: [],
  writeOffAmount: [],
  trainingFormsWeekly: [],
  trainingFormsMonthly: [],
  auditDaily: [],
  metricsReport: [],
  occupancyMonthly: [],
  admissionDischargeDaily: [],
  counsellingSessionsPatientsDOD: [],
  opdChargesMonthly: [],
  doctorOpdChargesMonthly: [],
  doctorOpdChargesDetail: [],
  centralExpensesMonthly: [],
  doctorPsychologistStayRange: [],
  nursesDailyActivity: [],
  incidentStatusMonthly: [],
  readmissionMonthly: [],
  attritionMonthly: [],
  assignedData: [],
  patientsWithSuspendedStaff: [],
  sopAlertsMonthly: [],
  cashRecoCompliance: [],
  referralData: {},

  loading: false,
  error: null,
};

// Async thunk for fetching HubSpot contacts
export const fetchMIHubSpotContacts = createAsyncThunk(
  "miReporting/fetchHubSpotContacts",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getMIHubSpotContacts(params);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch contacts"
      );
    }
  }
);

// Center Wise MoM
export const fetchCenterWiseMOM = createAsyncThunk(
  "miReporting/fetchCenterWiseMOM",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getCenterWiseMOM(params);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch center wise MoM"
      );
    }
  }
);

// Center Status Matrix
export const fetchCenterWiseStatusMOM = createAsyncThunk(
  "miReporting/fetchCenterWiseStatusMOM",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getCenterWiseStatusMOM(params);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch center status matrix"
      );
    }
  }
);

// Campaign Wise MoM
export const fetchCampaignWiseMOM = createAsyncThunk(
  "miReporting/fetchCampaignWiseMOM",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getCampaignWiseMOM(params);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch campaign wise MoM"
      );
    }
  }
);

// Center Leads MoM
export const fetchCenterLeadsMoM = createAsyncThunk(
  "miReporting/fetchCenterLeadsMoM",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await fetchCenterMoM(params);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch center leads (MoM)"
      );
    }
  }
);

// Center Leads MTD
export const fetchCenterLeadsMTD = createAsyncThunk(
  "miReporting/fetchCenterLeadsMTD",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await fetchCenterMTD(params);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch center leads (MTD)"
      );
    }
  }
);

// Owner Leads MoM
export const fetchOwnerLeadsMoM = createAsyncThunk(
  "miReporting/fetchOwnerLeadsMoM",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await fetchOwnerMoM(params);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch owner leads (MoM)"
      );
    }
  }
);

// Owner Leads MTD
export const fetchOwnerLeadsMTD = createAsyncThunk(
  "miReporting/fetchOwnerLeadsMTD",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await fetchOwnerMTD(params);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch owner leads (MTD)"
      );
    }
  }
);

// City Quality Breakdown
export const fetchCityQualityBreakdown = createAsyncThunk(
  "miReporting/fetchCityQuality",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await fetchCityQuality(params);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch city quality breakdown"
      );
    }
  }
);

// Owner Quality Breakdown
export const fetchOwnerQualityBreakdown = createAsyncThunk(
  "miReporting/fetchOwnerQuality",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await fetchOwnerQuality(params);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch owner quality breakdown"
      );
    }
  }
);

// City Visit Date
export const fetchCityVisitDate = createAsyncThunk(
  "miReporting/fetchCityVisitDate",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await fetchCityVisit(params);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch city visit date analytics"
      );
    }
  }
);

// Owner Visit Date
export const fetchOwnerVisitDate = createAsyncThunk(
  "miReporting/fetchOwnerVisitDate",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await fetchOwnerVisit(params);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch owner visit date analytics"
      );
    }
  }
);

// City Visited Date
export const fetchCityVisitedDate = createAsyncThunk(
  "miReporting/fetchCityVisitedDate",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await fetchCityVisited(params);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch city visited date analytics"
      );
    }
  }
);

// Owner Visited Date
export const fetchOwnerVisitedDate = createAsyncThunk(
  "miReporting/fetchOwnerVisitedDate",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await fetchOwnerVisited(params);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch owner visited date analytics"
      );
    }
  }
);

// City Lead Status
export const fetchCityLeadStatus = createAsyncThunk(
  "miReporting/fetchCityLeadStatus",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getCityLeadStatus(params);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch city lead status analytics"
      );
    }
  }
);

// Owner Lead Status
export const fetchOwnerLeadStatus = createAsyncThunk(
  "miReporting/fetchOwnerLeadStatus",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getOwnerLeadStatus(params);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch owner lead status analytics"
      );
    }
  }
);




export const fetchRefundAmountMOM = createAsyncThunk(
  "miReporting/fetchRefundAmountMOM",
  async (data , { rejectWithValue }) => {
    try {
      const response = await getRefundAmountMOM(data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch Refund amount mom"
      );
    }
  }
);


export const fetchCashPerCenter = createAsyncThunk(
  "miReporting/fetchCashPerCenter",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getCashPerCenter(data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch cash per center"
      );
    }
  }
);


export const fetchWriteOffAmount = createAsyncThunk(
  "miReporting/fetchWriteOffAmount",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getWriteOffAmount(data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch write off amount"
      );
    }
  }
);


export const fetchTrainingFormsWeekly = createAsyncThunk(
  "miReporting/fetchTrainingFormsWeekly",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getTrainingFormsWeekly(data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch training forms weekly"
      );
    }
  }
);


export const fetchOpdChargesMonthly = createAsyncThunk(
  "miReporting/fetchOpdChargesMonthly",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getOpdChargesMonthly(data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch opd charges monthly"
      );
    }
  }
);


export const fetchNursesDailyActivity = createAsyncThunk(
  "miReporting/fetchNursesDailyActivity",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getNursesDailyActivity(data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch nurses daily activity"
      );
    }
  }
);


export const fetchDoctorPsychologistStayRange = createAsyncThunk(
  "miReporting/fetchDoctorPsychologistStayRange",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getDoctorPsychologistStayRange(data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch doctor psychologist stay range"
      );
    }
  }
);


export const fetchCentralExpensesMonthly = createAsyncThunk(
  "miReporting/fetchCentralExpensesMonthly",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getCentralExpensesMonthly(data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch central expenses monthly"
      );
    }
  }
);


export const fetchDoctorOpdChargesMonthly = createAsyncThunk(
  "miReporting/fetchDoctorOpdChargesMonthly",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getDoctorOpdChargesMonthly(data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch doctor opd charges monthly"
      );
    }
  }
);

export const fetchDoctorOpdChargesDetail = createAsyncThunk(
  "miReporting/fetchDoctorOpdChargesDetail",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getDoctorOpdChargesDetail(data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch doctor opd charges detail"
      );
    }
  }
);


export const fetchMetricsReport = createAsyncThunk(
  "miReporting/fetchMetricsReport",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getMetricsReport(data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch metrics report"
      );
    }
  }
);


export const fetchAdmissionDischargeDaily = createAsyncThunk(
  "miReporting/fetchAdmissionDischargeDaily",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getAdmissionDischargeDaily(data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch admission discharge daily"
      );
    }
  }
);


export const fetchOccupancyMonthly = createAsyncThunk(
  "miReporting/fetchOccupancyMonthly",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getOccupancyMonthly(data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch occupancy monthly"
      );
    }
  }
);


export const fetchTrainingFormsMonthly = createAsyncThunk(
  "miReporting/fetchTrainingFormsMonthly",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getTrainingFormsMonthly(data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch training forms monthly"
      );
    }
  }
);


export const fetchAuditDaily = createAsyncThunk(
  "miReporting/fetchAuditDaily",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getAuditDaily(data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch audit daily"
      );
    }
  }
);


export const fetchRoundNotesDOD = createAsyncThunk(
  "miReporting/fetchRoundNotesDOD",
  async (data , { rejectWithValue }) => {
    try {
      const response = await getRoundNotesDOD(data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch Round notes dod"
      );
    }
  }
);


export const fetchClinicalNotesDOD = createAsyncThunk(
  "miReporting/fetchClinicalNotesDOD",
  async (data , { rejectWithValue }) => {
    try {
      const response = await getClinicalNotesDOD(data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch Clinical notes dod"
      );
    }
  }
);


export const fetchCounsellingSessionsPatientsDOD = createAsyncThunk(
  "miReporting/fetchCounsellingSessionsPatientsDOD",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getCounsellingSessionsPatientsDOD(data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch counselling sessions patients dod"
      );
    }
  }
);



export const fetchVitalSignsDOD = createAsyncThunk(
  "miReporting/fetchVitalSignsDOD",
  async (data , { rejectWithValue }) => {
    try {
      const response = await getVitalSignsDOD(data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch Vital Signs DOD"
      );
    }
  }
);

export const fetchPatientDocs = createAsyncThunk(
  "miReporting/fetchPatientDocs",
  async (data , { rejectWithValue }) => {
    try {
      const response = await getPatientDocs(data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch Patient Docs"
      );
    }
  }
);

export const fetchOpdPatientDocs = createAsyncThunk(
  "miReporting/fetchOpdPatientDocs",
  async (data , { rejectWithValue }) => {
    try {
      const response = await getOpdPatientDocs(data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch OPD Patient Docs"
      );
    }
  }
);


export const fetchDailyInvoices = createAsyncThunk(
  "miReporting/fetchDailyInvoices",
  async (data , { rejectWithValue }) => {
    try {
      const response = await getDailyInvoices(data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch Daily Invoices"
      );
    }
  }
);

export const fetchCounsellingSessions = createAsyncThunk(
  "miReporting/fetchCounsellingSessions",
  async (data , { rejectWithValue }) => {
    try {
      const response = await getCounsellingSessions(data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch Counselling Sessions"
      );
    }
  }
);

export const fetchCounsellingRecordings = createAsyncThunk(
  "miReporting/fetchCounsellingRecordings",
  async (data , { rejectWithValue }) => {
    try {
      const response = await getCounsellingRecordings(data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch Counselling Recordings"
      );
    }
  }
);


export const fetchDocsCompliance = createAsyncThunk(
  "miReporting/fetchDocsCompliance",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getDocsCompliance(data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch Docs Compliance"
      );
    }
  }
);

export const fetchDueAmount = createAsyncThunk(
  "miReporting/fetchDueAmount",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getDueAmount(data);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch Due Amount");
    }
  }
);

export const fetchMissingInvoices = createAsyncThunk(
  "miReporting/fetchMissingInvoices",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getMissingInvoices(data);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch Missing Invoices");
    }
  }
);

export const fetchMIAttendance = createAsyncThunk(
  "miReporting/fetchMIAttendance",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getMIAttendance(data);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch Attendance");
    }
  }
);

export const fetchNursesDOD = createAsyncThunk(
  "miReporting/fetchNursesDOD",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getNursesDOD(data);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch Nurses DOD");
    }
  }
);

export const fetchDailyDashboard = createAsyncThunk(
  "miReporting/fetchDailyDashboard",
  async (data , { rejectWithValue }) => {
    try {
      const response = await getDailyDashboard(data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch Daily Dashboard"
      );
    }
  }
);

export const fetchIncidentStatusMonthly = createAsyncThunk(
  "miReporting/fetchIncidentStatusMonthly",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getIncidentStatusMonthly(data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch Incident Status Monthly"
      );
    }
  }
);

export const fetchReadmissionMonthly = createAsyncThunk(
  "miReporting/fetchReadmissionMonthly",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getReadmissionMonthly(data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch Readmission Monthly"
      );
    }
  }
);





export const fetchAttritionMonthly = createAsyncThunk(
  "miReporting/fetchAttritionMonthly",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getAttritionMonthly(data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch Attrition Monthly"
      );
    }
  }
);

export const fetchAssignedData = createAsyncThunk(
  "miReporting/fetchAssignedData",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getAssignedData(data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch Assigned Data"
      );
    }
  }
);

export const fetchPatientsWithSuspendedStaff = createAsyncThunk(
  "miReporting/fetchPatientsWithSuspendedStaff",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getPatientsWithSuspendedStaff(data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch Patients With Suspended Staff"
      );
    }
  }
);

export const fetchSopAlertsMonthly = createAsyncThunk(
  "miReporting/fetchSopAlertsMonthly",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getSopAlertsMonthly(data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch SOP Alerts Monthly"
      );
    }
  }
);

export const fetchCashRecoCompliance = createAsyncThunk(
  "miReporting/fetchCashRecoCompliance",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getCashRecoCompliance(data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch Cash Reco Compliance"
      );
    }
  }
);

export const fetchReferralData = createAsyncThunk(
  "miReporting/fetchReferralData",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getReferralData(data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch Referral Data"
      );
    }
  }
);



const miReportingSlice = createSlice({
  name: "miReporting",
  initialState,
  reducers: {
    clearContacts: (state) => {
      state.contacts = [];
      state.pagination = initialState.pagination;
      state.error = null;
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // HubSpot Contacts
      .addCase(fetchMIHubSpotContacts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMIHubSpotContacts.fulfilled, (state, action) => {
        state.loading = false;
        state.contacts = action.payload.payload || [];
        state.pagination = action.payload.pagination || initialState.pagination;
      })
      .addCase(fetchMIHubSpotContacts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.contacts = [];
      })
      // Center Leads MoM
      .addCase(fetchCenterLeadsMoM.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCenterLeadsMoM.fulfilled, (state, action) => {
        state.loading = false;
        state.centerLeadsMoM = action.payload.payload || [];
      })
      .addCase(fetchCenterLeadsMoM.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Center Leads MTD
      .addCase(fetchCenterLeadsMTD.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCenterLeadsMTD.fulfilled, (state, action) => {
        state.loading = false;
        state.centerLeadsMTD = action.payload.payload || [];
      })
      .addCase(fetchCenterLeadsMTD.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Owner Leads MoM
      .addCase(fetchOwnerLeadsMoM.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOwnerLeadsMoM.fulfilled, (state, action) => {
        state.loading = false;
        state.ownerLeadsMoM = action.payload.payload || [];
      })
      .addCase(fetchOwnerLeadsMoM.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Owner Leads MTD
      .addCase(fetchOwnerLeadsMTD.pending, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchOwnerLeadsMTD.fulfilled, (state, action) => {
        state.loading = false;
        state.ownerLeadsMTD = action.payload.payload || [];
      })
      .addCase(fetchOwnerLeadsMTD.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // City Quality
      .addCase(fetchCityQualityBreakdown.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCityQualityBreakdown.fulfilled, (state, action) => {
        state.loading = false;
        state.cityQuality = action.payload.payload || [];
      })
      .addCase(fetchCityQualityBreakdown.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Owner Quality
      .addCase(fetchOwnerQualityBreakdown.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOwnerQualityBreakdown.fulfilled, (state, action) => {
        state.loading = false;
        state.ownerQuality = action.payload.payload || [];
      })
      .addCase(fetchOwnerQualityBreakdown.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // City Visit Date
      .addCase(fetchCityVisitDate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCityVisitDate.fulfilled, (state, action) => {
        state.loading = false;
        state.cityVisitDate = action.payload.payload || [];
      })
      .addCase(fetchCityVisitDate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Owner Visit Date
      .addCase(fetchOwnerVisitDate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOwnerVisitDate.fulfilled, (state, action) => {
        state.loading = false;
        state.ownerVisitDate = action.payload.payload || [];
      })
      .addCase(fetchOwnerVisitDate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // City Visited Date
      .addCase(fetchCityVisitedDate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCityVisitedDate.fulfilled, (state, action) => {
        state.loading = false;
        state.cityVisitedDate = action.payload.payload || [];
      })
      .addCase(fetchCityVisitedDate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Owner Visited Date
      .addCase(fetchOwnerVisitedDate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOwnerVisitedDate.fulfilled, (state, action) => {
        state.loading = false;
        state.ownerVisitedDate = action.payload.payload || [];
      })
      .addCase(fetchOwnerVisitedDate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // City Lead Status
      .addCase(fetchCityLeadStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCityLeadStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.cityLeadStatus = action.payload.payload || [];
      })
      .addCase(fetchCityLeadStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Owner Lead Status
      .addCase(fetchOwnerLeadStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOwnerLeadStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.ownerLeadStatus = action.payload.payload || [];
      })
      .addCase(fetchOwnerLeadStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })


      //Refund Amount MOM
      .addCase(fetchRefundAmountMOM.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRefundAmountMOM.fulfilled, (state, action) => {
        state.loading = false;
        state.refundAmountMOM = action.payload.payload || [];
      })
      .addCase(fetchRefundAmountMOM.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchRoundNotesDOD.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoundNotesDOD.fulfilled, (state, action) => {
        state.loading = false;
        state.roundNotesDOD = action.payload.payload || [];
      })
      .addCase(fetchRoundNotesDOD.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchClinicalNotesDOD.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClinicalNotesDOD.fulfilled, (state, action) => {
        state.loading = false;
        state.clinicalNotesDOD = action.payload.payload || [];
      })
      .addCase(fetchClinicalNotesDOD.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchCounsellingSessionsPatientsDOD.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCounsellingSessionsPatientsDOD.fulfilled, (state, action) => {
        state.loading = false;
        state.counsellingSessionsPatientsDOD = action.payload.payload || [];
      })
      .addCase(fetchCounsellingSessionsPatientsDOD.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchVitalSignsDOD.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVitalSignsDOD.fulfilled, (state, action) => {
        state.loading = false;
        state.vitalSignsDOD = action.payload.payload || [];
      })
      .addCase(fetchVitalSignsDOD.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      //Patient Docs
      .addCase(fetchPatientDocs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPatientDocs.fulfilled, (state, action) => {
        state.loading = false;
        state.patientDocs = action.payload.payload || [];
      })
      .addCase(fetchPatientDocs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      //OPD Patient Docs
      .addCase(fetchOpdPatientDocs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOpdPatientDocs.fulfilled, (state, action) => {
        state.loading = false;
        state.opdPatientDocs = action.payload.payload || [];
      })
      .addCase(fetchOpdPatientDocs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      
      //Daily Invoices
      .addCase(fetchDailyInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDailyInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.dailyInvoices = action.payload.payload || [];
      })
      .addCase(fetchDailyInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      //Counselling sessions
      .addCase(fetchCounsellingSessions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCounsellingSessions.fulfilled, (state, action) => {
        state.loading = false;
        state.counsellingSessions = action.payload.payload || [];
      })
      .addCase(fetchCounsellingSessions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })


      //Counselling Recordings
      .addCase(fetchCounsellingRecordings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCounsellingRecordings.fulfilled, (state, action) => {
        state.loading = false;
        state.counsellingRecordings = action.payload.payload || [];
      })
      .addCase(fetchCounsellingRecordings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })


      //Docs Compliance
      .addCase(fetchDocsCompliance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocsCompliance.fulfilled, (state, action) => {
        state.loading = false;
        state.docsCompliance = action.payload.payload;
      })
      .addCase(fetchDocsCompliance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      //Due Amount
      .addCase(fetchDueAmount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDueAmount.fulfilled, (state, action) => {
        state.loading = false;
        state.dueAmount = action.payload.payload || [];
      })
      .addCase(fetchDueAmount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      //Missing Invoices
      .addCase(fetchMissingInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMissingInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.missingInvoices = action.payload.payload || [];
      })
      .addCase(fetchMissingInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      //MI Attendance
      .addCase(fetchMIAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMIAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.miAttendance = action.payload.payload || [];
      })
      .addCase(fetchMIAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      //Daily Dashboard
      .addCase(fetchDailyDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDailyDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.dailyDashboard = action.payload.payload || [];
      })
      .addCase(fetchDailyDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      //Nurses DOD
      .addCase(fetchNursesDOD.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNursesDOD.fulfilled, (state, action) => {
        state.loading = false;
        state.nursesDOD = action.payload.payload || [];
      })
      .addCase(fetchNursesDOD.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Center Wise MoM
      .addCase(fetchCenterWiseMOM.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCenterWiseMOM.fulfilled, (state, action) => {
        state.loading = false;
        state.centerWiseMOM = action.payload.payload || [];
      })
      .addCase(fetchCenterWiseMOM.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Campaign Wise MoM
      .addCase(fetchCampaignWiseMOM.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCampaignWiseMOM.fulfilled, (state, action) => {
        state.loading = false;
        state.campaignWiseMOM = action.payload.payload || [];
      })
      .addCase(fetchCampaignWiseMOM.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Center Status Matrix
      .addCase(fetchCenterWiseStatusMOM.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCenterWiseStatusMOM.fulfilled, (state, action) => {
        state.loading = false;
        state.centerWiseStatusMOM = action.payload.payload || [];
      })
      .addCase(fetchCenterWiseStatusMOM.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Cash Per Center
      .addCase(fetchCashPerCenter.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCashPerCenter.fulfilled, (state, action) => {
        state.loading = false;
        state.cashPerCenter = action.payload.payload || [];
      })
      .addCase(fetchCashPerCenter.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Write Off Amount
      .addCase(fetchWriteOffAmount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWriteOffAmount.fulfilled, (state, action) => {
        state.loading = false;
        state.writeOffAmount = action.payload.payload || [];
      })
      .addCase(fetchWriteOffAmount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Training Forms Weekly
      .addCase(fetchTrainingFormsWeekly.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTrainingFormsWeekly.fulfilled, (state, action) => {
        state.loading = false;
        state.trainingFormsWeekly = action.payload.payload || [];
      })
      .addCase(fetchTrainingFormsWeekly.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Training Forms Monthly
      .addCase(fetchTrainingFormsMonthly.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTrainingFormsMonthly.fulfilled, (state, action) => {
        state.loading = false;
        state.trainingFormsMonthly = action.payload.payload || [];
      })
      .addCase(fetchTrainingFormsMonthly.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Audit Daily
      .addCase(fetchAuditDaily.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAuditDaily.fulfilled, (state, action) => {
        state.loading = false;
        state.auditDaily = action.payload.payload || [];
      })
      .addCase(fetchAuditDaily.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Metrics Report
      .addCase(fetchMetricsReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMetricsReport.fulfilled, (state, action) => {
        state.loading = false;
        state.metricsReport = action.payload.payload || [];
      })
      .addCase(fetchMetricsReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Occupancy Monthly
      .addCase(fetchOccupancyMonthly.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOccupancyMonthly.fulfilled, (state, action) => {
        state.loading = false;
        state.occupancyMonthly = action.payload.payload || [];
      })
      .addCase(fetchOccupancyMonthly.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Admission Discharge Daily
      .addCase(fetchAdmissionDischargeDaily.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdmissionDischargeDaily.fulfilled, (state, action) => {
        state.loading = false;
        state.admissionDischargeDaily = action.payload.payload || [];
      })
      .addCase(fetchAdmissionDischargeDaily.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // OPD Charges Monthly
      .addCase(fetchOpdChargesMonthly.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOpdChargesMonthly.fulfilled, (state, action) => {
        state.loading = false;
        state.opdChargesMonthly = action.payload.payload || [];
      })
      .addCase(fetchOpdChargesMonthly.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Doctor OPD Charges Monthly
      .addCase(fetchDoctorOpdChargesMonthly.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDoctorOpdChargesMonthly.fulfilled, (state, action) => {
        state.loading = false;
        state.doctorOpdChargesMonthly = action.payload.payload || [];
      })
      .addCase(fetchDoctorOpdChargesMonthly.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Doctor OPD Charges Detail
      .addCase(fetchDoctorOpdChargesDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDoctorOpdChargesDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.doctorOpdChargesDetail = action.payload.payload || [];
      })
      .addCase(fetchDoctorOpdChargesDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Central Expenses Monthly
      .addCase(fetchCentralExpensesMonthly.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCentralExpensesMonthly.fulfilled, (state, action) => {
        state.loading = false;
        state.centralExpensesMonthly = action.payload.payload || [];
      })
      .addCase(fetchCentralExpensesMonthly.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Doctor Psychologist Stay Range
      .addCase(fetchDoctorPsychologistStayRange.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDoctorPsychologistStayRange.fulfilled, (state, action) => {
        state.loading = false;
        state.doctorPsychologistStayRange = action.payload.payload || [];
      })
      .addCase(fetchDoctorPsychologistStayRange.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Nurses Daily Activity
      .addCase(fetchNursesDailyActivity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNursesDailyActivity.fulfilled, (state, action) => {
        state.loading = false;
        state.nursesDailyActivity = action.payload.payload || [];
      })
      .addCase(fetchNursesDailyActivity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Incident Status Monthly
      .addCase(fetchIncidentStatusMonthly.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIncidentStatusMonthly.fulfilled, (state, action) => {
        state.loading = false;
        state.incidentStatusMonthly = action.payload.payload || [];
      })
      .addCase(fetchIncidentStatusMonthly.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Readmission Monthly
      .addCase(fetchReadmissionMonthly.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReadmissionMonthly.fulfilled, (state, action) => {
        state.loading = false;
        state.readmissionMonthly = action.payload.payload || [];
      })
      .addCase(fetchReadmissionMonthly.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

       // Attrition Monthly
      .addCase(fetchAttritionMonthly.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttritionMonthly.fulfilled, (state, action) => {
        state.loading = false;
        state.attritionMonthly = action.payload.payload || [];
      })
      .addCase(fetchAttritionMonthly.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Assigned Data
      .addCase(fetchAssignedData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssignedData.fulfilled, (state, action) => {
        state.loading = false;
        state.assignedData = action.payload.payload || [];
      })
      .addCase(fetchAssignedData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Patients With Suspended Staff
      .addCase(fetchPatientsWithSuspendedStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPatientsWithSuspendedStaff.fulfilled, (state, action) => {
        state.loading = false;
        state.patientsWithSuspendedStaff = action.payload.payload || [];
      })
      .addCase(fetchPatientsWithSuspendedStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // SOP Alerts Monthly
      .addCase(fetchSopAlertsMonthly.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSopAlertsMonthly.fulfilled, (state, action) => {
        state.loading = false;
        state.sopAlertsMonthly = action.payload.payload || [];
      })
      .addCase(fetchSopAlertsMonthly.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Cash Reco Compliance
      .addCase(fetchCashRecoCompliance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCashRecoCompliance.fulfilled, (state, action) => {
        state.loading = false;
        state.cashRecoCompliance = action.payload.payload || [];
      })
      .addCase(fetchCashRecoCompliance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Referral Data
      .addCase(fetchReferralData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReferralData.fulfilled, (state, action) => {
        state.loading = false;
        state.referralData = action.payload.payload || {};
      })
      .addCase(fetchReferralData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

  },
});

export const { clearContacts, setPagination, clearError } =
  miReportingSlice.actions;

export default miReportingSlice.reducer;