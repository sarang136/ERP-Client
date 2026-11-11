import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getAllPsychologistPatients } from "../../../helpers/backend_helper";

const initialState = {
  loading: false,
  data: {},
};

export const getAllPatients = createAsyncThunk(
  "psychologist/getAllPsychologistPatients",
  async (data, { rejectWithValue }) => {
    try {
      const response = await getAllPsychologistPatients(data);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const PsychologistSlice = createSlice({
  name: "psychologist",
  initialState,
  reducers: {
    // Patches one patient's card in place after a note save, instead of
    // re-fetching (and re-rendering) the whole list for a one-field change.
    patchPatientNoteDate: (state, { payload: { patientId, field, date } }) => {
      const patient = state.data?.data?.find((p) => p._id === patientId);
      if (patient) patient[field] = date;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllPatients.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllPatients.fulfilled, (state, { payload }) => {
        state.data = payload;
        state.loading = false;
      })
      .addCase(getAllPatients.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const { patchPatientNoteDate } = PsychologistSlice.actions;

export default PsychologistSlice.reducer;
