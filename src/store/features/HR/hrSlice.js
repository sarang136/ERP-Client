import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  getAdvanceSalaries,
  getEmployeePayslips,
  getMyPayslips,
  getAllEmployeeLeaveBalance,
  getReporteesLeaveBalance,
  getAllEmployeeRegularizations,
  getApprovalInbox,
  getDesignations,
  getEmployees,
  getEmployeeTransfers,
  getExitEmployees,
  getFinance,
  getHirings,
  getIncentives,
  getITApprovals,
  getMonthlyAttendance,
  getPayrolls,
  getPayrollAdjustments,
  getRegularizationsByEmployee,
  getTPMs,
  payrollAction,
  postDesignation,
  searchExitEmployee,
  updatePayrollRemarks,
} from "../../../helpers/backend_helper";

const initialState = {
  data: [],
  employees: [],
  designations: [],
  pagination: {},
  selectedEmployee: null,
  loading: false,
  designationLoading: false,
  myPayslips: { data: [], pagination: null, loading: false },
  employeePayslips: { data: [], pagination: null, loading: false },
  reporteesLeaveBalance: { data: [], pagination: {}, loading: false, requestId: null },
  leaveBalanceRequestId: null,
};

export const getMasterEmployees = createAsyncThunk(
  "hr/getEmployees",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getEmployees(data);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const fetchExitEmployees = createAsyncThunk(
  "hr/exitEmployees",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getExitEmployees(data);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const getExitEmployeesBySearch = createAsyncThunk(
  "hr/searchExitEmployee",
  async (data, { rejectWithValue }) => {
    try {
      const response = await searchExitEmployee(data);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const fetchITApprovals = createAsyncThunk(
  "hr/getITApprovals",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getITApprovals(data);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const fetchAdvanceSalaries = createAsyncThunk(
  "hr/getAdvanceSalaries",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getAdvanceSalaries(data);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const fetchEmployeeTransfers = createAsyncThunk(
  "hr/getEmployeeTransfers",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getEmployeeTransfers(data);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const fetchDesignations = createAsyncThunk(
  "hr/getDesignations",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getDesignations(data);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const addDesignation = createAsyncThunk(
  "hr/postDesignation",
  async (data, { rejectWithValue }) => {
    try {
      const response = await postDesignation(data);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const fetchHirings = createAsyncThunk(
  "hr/getHirings",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getHirings(data);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const fetchTPMs = createAsyncThunk(
  "hr/getTPMs",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getTPMs(data);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const fetchIncentives = createAsyncThunk(
  "hr/getIncentives",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getIncentives(data);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const fetchPayrollAdjustments = createAsyncThunk(
  "hr/getPayrollAdjustments",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getPayrollAdjustments(data);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const fetchPayrolls = createAsyncThunk(
  "hr/getPayrolls",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getPayrolls(data);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const editPayrollRemarks = createAsyncThunk(
  "hr/updatePayrollRemarks",
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const response = await updatePayrollRemarks(id, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const actionPayroll = createAsyncThunk(
  "hr/payrollAction",
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const response = await payrollAction(id, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const fetchMonthlyAttendance = createAsyncThunk(
  "hr/getMonthlyAttendance",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getMonthlyAttendance(data);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const fetchApprovalInbox = createAsyncThunk(
  "hr/getApprovalInbox",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getApprovalInbox(data);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const fetchFinance = createAsyncThunk(
  "hr/getFinance",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getFinance(data);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const fetchAllEmployeeLeaveBalance = createAsyncThunk(
  "hr/getAllEmployeeLeaveBalance",
  async (data, { rejectWithValue, signal }) => {
    try {
      const response = await getAllEmployeeLeaveBalance(data, signal);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const fetchReporteesLeaveBalance = createAsyncThunk(
  "hr/getReporteesLeaveBalance",
  async (data, { rejectWithValue, signal }) => {
    try {
      const response = await getReporteesLeaveBalance(data, signal);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const fetchEmployeePayslips = createAsyncThunk(
  "HR/fetchEmployeePayslips",
  async (params, { rejectWithValue }) => {
    try {
      const res = await getEmployeePayslips(params);
      return res;
    } catch (err) {
      return rejectWithValue(err?.response?.data || err);
    }
  },
);

export const fetchAllEmployeeRegularizations = createAsyncThunk(
  "hr/getAllEmployeeRegularizations",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getAllEmployeeRegularizations(data);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const fetchRegularizationsByEmployee = createAsyncThunk(
  "hr/getRegularizationsByEmployee",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getRegularizationsByEmployee(data);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const fetchMyPayslips = createAsyncThunk(
  "HR/fetchMyPayslips",
  async (params, { rejectWithValue }) => {
    try {
      const res = await getMyPayslips(params);
      return res;
    } catch (err) {
      return rejectWithValue(err?.response?.data || err);
    }
  },
);

export const hrSlice = createSlice({
  name: "HR",
  initialState,
  reducers: {
    removePayrollRecords: (state, { payload }) => {
      const ids = new Set(Array.isArray(payload) ? payload : [payload]);
      const removedCount = state.data.filter((item) => ids.has(item._id)).length;
      state.data = state.data.filter((item) => !ids.has(item._id));
      if (state.pagination) {
        state.pagination.totalDocs = Math.max(
          (state.pagination.totalDocs || 0) - removedCount,
          0
        );
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getMasterEmployees.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMasterEmployees.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.data = payload.data;
        state.pagination = payload.pagination;
      })
      .addCase(getMasterEmployees.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(fetchExitEmployees.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchExitEmployees.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.data = payload.data;
        state.pagination = payload.pagination;
      })
      .addCase(fetchExitEmployees.rejected, (state) => {
        state.loading = false;
      });

    builder.addCase(
      getExitEmployeesBySearch.fulfilled,
      (state, { payload }) => {
        state.employees = payload.data;
      },
    );

    builder
      .addCase(fetchITApprovals.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchITApprovals.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.data = payload.data;
        state.pagination = payload.pagination;
      })
      .addCase(fetchITApprovals.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(fetchAdvanceSalaries.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAdvanceSalaries.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.data = payload.data;
        state.pagination = payload.pagination;
      })
      .addCase(fetchAdvanceSalaries.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(fetchEmployeeTransfers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchEmployeeTransfers.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.data = payload.data;
        state.pagination = payload.pagination;
      })
      .addCase(fetchEmployeeTransfers.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(fetchDesignations.pending, (state) => {
        state.designationLoading = true;
      })
      // .addCase(fetchDesignations.fulfilled, (state, { payload }) => {
      //   state.designationLoading = false;
      //   state.designations = payload.data;
      // })
      .addCase(fetchDesignations.fulfilled, (state, { payload }) => {
        state.designationLoading = false;
        state.designations = (payload.data || []).map((d) => ({
          ...d,
          label: d.label || d.name,
          value: d.value || d._id,
          version: d.version,
        }));
      })
      .addCase(fetchDesignations.rejected, (state) => {
        state.designationLoading = false;
      });

    // builder.addCase(addDesignation.fulfilled, (state, { payload }) => {
    //   state.designations.push(payload.data);
    // });
    builder.addCase(addDesignation.fulfilled, (state, { payload }) => {
      state.designations.push({
        ...payload.data,
        label: payload.data.label || payload.data.name,
        value: payload.data.value || payload.data._id,
        version: payload.data.version || 2,
      });
    });

    builder
      .addCase(fetchHirings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchHirings.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.data = payload.data;
        state.pagination = payload.pagination;
      })
      .addCase(fetchHirings.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(fetchTPMs.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTPMs.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.data = payload.data;
        state.pagination = payload.pagination;
      })
      .addCase(fetchTPMs.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(fetchIncentives.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchIncentives.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.data = payload.data;
        state.pagination = payload.pagination;
      })
      .addCase(fetchIncentives.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(fetchPayrollAdjustments.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPayrollAdjustments.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.data = payload.data;
        state.pagination = payload.pagination;
      })
      .addCase(fetchPayrollAdjustments.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(fetchPayrolls.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPayrolls.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.data = payload.data;
        state.pagination = payload.pagination;
      })
      .addCase(fetchPayrolls.rejected, (state) => {
        state.loading = false;
      });

    builder.addCase(editPayrollRemarks.fulfilled, (state, { payload }) => {
      const payrollIndex = state.data.findIndex(
        (payroll) => payroll._id === payload._id,
      );
      if (payrollIndex !== -1) {
        state.data[payrollIndex] = {
          ...state.data[payrollIndex],
          ...payload,
        };
      }
    });

    builder.addCase(actionPayroll.fulfilled, (state, { payload }) => {
      const index = state.data.findIndex((item) => item._id === payload._id);
      if (index !== -1) {
        state.data.splice(index, 1);
        if (state.pagination) {
          state.pagination.totalDocs = Math.max(
            (state.pagination.totalDocs || 0) - 1,
            0
          );
        }
      }
    });

    builder
      .addCase(fetchMyPayslips.pending, (state) => {
        state.myPayslips.loading = true;
      })
      .addCase(fetchMyPayslips.fulfilled, (state, { payload }) => {
        state.myPayslips.loading = false;
        state.myPayslips.data = payload.data;
        state.myPayslips.pagination = payload.pagination;
      })
      .addCase(fetchMyPayslips.rejected, (state) => {
        state.myPayslips.loading = false;
      })
      .addCase(fetchEmployeePayslips.pending, (state) => {
        state.employeePayslips.loading = true;
      })
      .addCase(fetchEmployeePayslips.fulfilled, (state, { payload }) => {
        state.employeePayslips.loading = false;
        state.employeePayslips.data = payload;
        state.employeePayslips.pagination = payload.pagination;
      })
      .addCase(fetchEmployeePayslips.rejected, (state) => {
        state.employeePayslips.loading = false;
      })
      .addCase(fetchReporteesLeaveBalance.pending, (state, { meta }) => {
        state.reporteesLeaveBalance.loading = true;
        state.reporteesLeaveBalance.requestId = meta.requestId;
      })
      .addCase(fetchReporteesLeaveBalance.fulfilled, (state, { payload, meta }) => {
        if (meta.requestId !== state.reporteesLeaveBalance.requestId) return;
        state.reporteesLeaveBalance.loading = false;
        state.reporteesLeaveBalance.data = payload.data;
        state.reporteesLeaveBalance.pagination = payload.pagination;
      })
      .addCase(fetchReporteesLeaveBalance.rejected, (state, { meta }) => {
        if (meta.requestId !== state.reporteesLeaveBalance.requestId) return;
        state.reporteesLeaveBalance.loading = false;
      });

    builder
      .addCase(fetchMonthlyAttendance.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMonthlyAttendance.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.data = payload.data;
        state.pagination = payload.pagination;
      })
      .addCase(fetchMonthlyAttendance.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(fetchApprovalInbox.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchApprovalInbox.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.data = payload.data;
        state.pagination = payload.pagination;
      })
      .addCase(fetchApprovalInbox.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(fetchFinance.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchFinance.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.data = payload.data;
        state.pagination = payload.pagination;
      })
      .addCase(fetchFinance.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(fetchAllEmployeeLeaveBalance.pending, (state, { meta }) => {
        state.loading = true;
        state.leaveBalanceRequestId = meta.requestId;
      })
      .addCase(fetchAllEmployeeLeaveBalance.fulfilled, (state, { payload, meta }) => {
        if (meta.requestId !== state.leaveBalanceRequestId) return;
        state.loading = false;
        state.data = payload.data;
        state.pagination = payload.pagination;
      })
      .addCase(fetchAllEmployeeLeaveBalance.rejected, (state, { meta }) => {
        if (meta.requestId !== state.leaveBalanceRequestId) return;
        state.loading = false;
      });

    builder
      .addCase(fetchAllEmployeeRegularizations.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        fetchAllEmployeeRegularizations.fulfilled,
        (state, { payload }) => {
          state.loading = false;
          state.data = payload.data;
          state.pagination = payload.pagination;
        },
      )
      .addCase(fetchAllEmployeeRegularizations.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(fetchRegularizationsByEmployee.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        fetchRegularizationsByEmployee.fulfilled,
        (state, { payload }) => {
          state.loading = false;
          state.data = payload.data || [];
          state.pagination = payload.pagination || {};
          state.selectedEmployee = payload.employee || null;
        },
      )
      .addCase(fetchRegularizationsByEmployee.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const { removePayrollRecords } = hrSlice.actions;

export default hrSlice.reducer;
