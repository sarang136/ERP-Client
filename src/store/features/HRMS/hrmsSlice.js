import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import { getAttendance, getAttendanceMetrics, getEmployeeReportings, getAttendanceLogs, getAttendanceSummary, getReportingMetrics } from "../../../helpers/backend_helper";


const initialState = {
    data: [],
    lastImportTime: null,
    loading: false,
    pagination: {},
    metricsRequestId: null,
    attendanceLogsEmployee: {},
    attendanceSummary: {
        data: null,
        loading: false
    },
    reportingMetrics: {
        data: [],
        loading: false,
        pagination: {}
    }
};

export const fetchAttendance = createAsyncThunk("hrms/getAttendance", async (data, { rejectWithValue }) => {
    try {
        const response = await getAttendance(data);
        return response;
    } catch (error) {
        return rejectWithValue(error);
    }
});

export const fetchAttendanceMetrics = createAsyncThunk("hrms/getAttendanceMetrics", async (data, { rejectWithValue, signal }) => {
    try {
        const response = await getAttendanceMetrics(data, signal);
        return response;
    } catch (error) {
        return rejectWithValue(error);
    }
});

export const fetchReportingMetrics = createAsyncThunk("hrms/getReportingMetrics", async (data, { rejectWithValue }) => {
    try {
        const response = await getReportingMetrics(data);
        return response;
    } catch (error) {
        return rejectWithValue(error);
    }
});


export const fetchReportings = createAsyncThunk("hrms/getEmployeeReportings", async (data, { rejectWithValue }) => {
    try {
        const response = await getEmployeeReportings(data);
        return response;
    } catch (error) {
        return rejectWithValue(error);
    }
});

export const fetchAttendanceLogs = createAsyncThunk("hrms/getAttendanceLogs", async (data, { rejectWithValue }) => {
    try {
        const response = await getAttendanceLogs(data);
        return response;
    } catch (error) {
        return rejectWithValue(error);
    }
});

export const fetchAttendanceSummary = createAsyncThunk("hrms/getAttendanceSummary", async (data, { rejectWithValue }) => {
    try {
        const response = await getAttendanceSummary(data);
        return response;
    } catch (error) {
        return rejectWithValue(error);
    }
});


export const hrmsSlice = createSlice({
    name: "HRMS",
    initialState,
    extraReducers: (builder) => {
        builder
            .addCase(fetchAttendance.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchAttendance.fulfilled, (state, { payload }) => {
                state.loading = false;
                state.data = payload.data?.attendanceData;
                state.lastImportTime = payload.data?.lastImportTime || null;
                state.pagination = payload.pagination
            })
            .addCase(fetchAttendance.rejected, (state) => {
                state.loading = false
            });

        builder
            .addCase(fetchAttendanceMetrics.pending, (state, { meta }) => {
                state.loading = true;
                state.metricsRequestId = meta.requestId;
            })
            .addCase(fetchAttendanceMetrics.fulfilled, (state, { payload, meta }) => {
                if (meta.requestId !== state.metricsRequestId) return;
                state.loading = false;
                state.data = payload.data;
                state.pagination = payload.pagination
            })
            .addCase(fetchAttendanceMetrics.rejected, (state, { meta }) => {
                if (meta.requestId !== state.metricsRequestId) return;
                state.loading = false
            });

        builder
            .addCase(fetchReportings.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchReportings.fulfilled, (state, { payload }) => {
                state.loading = false;
                state.data = payload.data;
                state.pagination = payload.pagination
            })
            .addCase(fetchReportings.rejected, (state) => {
                state.loading = false
            });

        builder
            .addCase(fetchAttendanceLogs.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchAttendanceLogs.fulfilled, (state, { payload }) => {
                state.loading = false;
                state.data = payload.data;
                state.pagination = payload.pagination;
                state.attendanceLogsEmployee = payload.employee || {};
            })
            .addCase(fetchAttendanceLogs.rejected, (state) => {
                state.loading = false
            });

        builder
            .addCase(fetchAttendanceSummary.pending, (state) => {
                state.attendanceSummary.loading = true;
            })
            .addCase(fetchAttendanceSummary.fulfilled, (state, { payload }) => {
                state.attendanceSummary.loading = false;
                state.attendanceSummary.data = payload.data;
            })
            .addCase(fetchAttendanceSummary.rejected, (state) => {
                state.attendanceSummary.loading = false;
            });
        builder
            .addCase(fetchReportingMetrics.pending, (state) => {
                state.reportingMetrics.loading = true;
                state.reportingMetrics.data = [];
                state.reportingMetrics.pagination = {};
            })
            .addCase(fetchReportingMetrics.fulfilled, (state, { payload }) => {
                state.reportingMetrics.loading = false;
                state.reportingMetrics.data = payload.data;
                state.reportingMetrics.pagination = payload.pagination;
            })
            .addCase(fetchReportingMetrics.rejected, (state) => {
                state.reportingMetrics.loading = false;
            });
    }
});

export default hrmsSlice.reducer;