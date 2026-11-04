import { useEffect } from "react";
import PropTypes from "prop-types";
import CustomModal from "../../../Components/Common/Modal";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_green.css";
import { useDispatch, connect } from "react-redux";
import { Button, Input, Label } from "reactstrap";
import { setChartDate } from "../../../store/actions";
import { getLatestAdmission } from "../../../utils/admissions";

const AdmissionFormModal = ({
  isOpen,
  toggle,
  patient,
  chartDate,
  admissions,
  admissiontype,
  setAdmissiontype,
  adultationype,
  setAdultationtype,
  supporttype,
  setSupporttype,
  emergencyType,
  setEmergencyType,
  emergencyRestraint,
  setEmergencyRestraint,
  details,
  setDetails,
  setOpenform,
  onProceed,
}) => {
  const dispatch = useDispatch();

  // `admissions` is the raw, session-wide state.Chart.data — reading [0] off it
  // printed whichever patient's admission happened to be first, which after a
  // patient switch could be the previous patient's. See utils/admissions.js.
  const currentAdmission = getLatestAdmission(admissions, patient);

  const handleCancel = () => {
    setEmergencyType("");
    setEmergencyRestraint("");
    // So the next time this picker opens via the regular "MHRB Admission"
    // entry point, it doesn't start with Emergency preselected.
    setAdmissiontype("");
    toggle();
  };

  useEffect(() => {
    if (!chartDate) {
      dispatch(setChartDate(new Date().toISOString()));
    }
  }, [dispatch, chartDate]);

  const handleDateChange = (selectedDates) => {
    if (selectedDates?.length) {
      const selectedDate = selectedDates[0];
      const existing = new Date(chartDate || new Date());
      existing.setFullYear(selectedDate.getFullYear());
      existing.setMonth(selectedDate.getMonth());
      existing.setDate(selectedDate.getDate());
      dispatch(setChartDate(existing.toISOString()));
    }
  };

  const handleTimeChange = (selectedDates) => {
    if (selectedDates?.length) {
      const selectedTime = selectedDates[0];
      const existing = new Date(chartDate || new Date());
      existing.setHours(selectedTime.getHours());
      existing.setMinutes(selectedTime.getMinutes());
      existing.setSeconds(selectedTime.getSeconds());
      dispatch(setChartDate(existing.toISOString()));
    }
  };

  return (
    <CustomModal isOpen={isOpen} title="Admission" toggle={handleCancel}>
      <div>
        {/* Date + Time */}
        <p className="text-muted mt-0 mb-1">Chart date and time</p>
        <div className="d-flex justify-content-center align-items-center">
          <Flatpickr
            name="dateOfAdmission"
            value={chartDate ? new Date(chartDate) : ""}
            onChange={handleDateChange}
            disabled
            options={{ dateFormat: "d M, Y" }}
            className="form-control shadow-none bg-light"
            id="dateOfAdmission"
          />
          <span className="ms-3 me-3">at</span>
          <Flatpickr
            name="timeOfAdmission"
            disabled
            value={chartDate ? new Date(chartDate) : ""}
            onChange={handleTimeChange}
            options={{
              enableTime: true,
              noCalendar: true,
              dateFormat: "h:i K",
              time_24hr: false,
            }}
            className="form-control shadow-none bg-light"
            id="timeOfAdmission"
          />
        </div>
        <>
          <div
            className="mt-3"
            style={{ display: "flex", gap: "10px", flexDirection: "column" }}
          >
            <p className="text-muted mb-0">
              Patient:{" "}
              <span className="text-primary font-semi-bold fs-6 ms-1">
                {(patient?.name || "Patient Name").toUpperCase()}
              </span>
            </p>

            <p className="text-muted mb-0">
              Doctor:{" "}
              <span className="text-primary font-semi-bold fs-6 ms-1">
                {(currentAdmission?.doctor?.name || "Doctor Name").toUpperCase()}
              </span>
            </p>

            <p className="text-muted mb-0">
              Psychologist:{" "}
              <span className="text-primary font-semi-bold fs-6 ms-1">
                {(
                  currentAdmission?.psychologist?.name || "Psychologist Name"
                ).toUpperCase()}
              </span>
            </p>
          </div>

          {/* Admission Type */}
          {/* <div className="mt-3">
            <Label className="text-muted mb-1">IPD Number</Label>
            <Input
              type="text"
              value={details?.IPDnum}
              onChange={(e) =>
                setDetails((prev) => ({ ...prev, IPDnum: e.target.value }))
              }
              placeholder="Enter IPD Number"
            />
          </div> */}
          {/* Hidden when the type is already fixed by the entry point (the
              Emergency Admission Form standalone dropdown item presets this
              before the modal opens — there's no "Emergency" option left in
              this select for a user to pick manually, so this condition is
              only ever true via that dedicated entry point). */}
          {admissiontype !== "EMERGENCY_ADMISSION" && (
            <div className="mt-3">
              <Label className="text-muted mb-1">Admission Type</Label>
              <Input
                type="select"
                value={admissiontype}
                onChange={(e) => setAdmissiontype(e.target.value)}
              >
                <option value="">Select Admission Type</option>
                <option value="INDEPENDENT_ADMISSION">
                  Independent Admission
                </option>
                <option value="MINOR_ADMISSION">Minor Admission</option>
                <option value="SUPPORTIVE_ADMISSION">
                  Supportive Admission
                </option>
              </Input>
            </div>
          )}

          {/* Conditional fields */}
          {admissiontype === "INDEPENDENT_ADMISSION" && (
            <div className="mt-3">
              <Label className="text-muted mb-1">Adultation Type</Label>
              <Input
                type="select"
                value={adultationype}
                onChange={(e) => setAdultationtype(e.target.value)}
              >
                <option value="">Select Adultation</option>
                <option value="ADULT">Adult (18+)</option>
              </Input>
            </div>
          )}

          {admissiontype === "SUPPORTIVE_ADMISSION" && (
            <div className="mt-3">
              <Label className="text-muted mb-1">Support Type</Label>
              <Input
                type="select"
                value={supporttype}
                onChange={(e) => setSupporttype(e.target.value)}
              >
                <option value="">Select Support Type</option>
                <option value="UPTO30DAYS">Upto 30 days</option>
                <option value="BEYOND30DAYS">
                  Beyond 30 days Upto 90 days
                </option>
              </Input>
            </div>
          )}

          {admissiontype === "EMERGENCY_ADMISSION" && (
            <>
              <div className="mt-3">
                <Label className="text-muted mb-1">Emergency Type</Label>
                <Input
                  type="select"
                  value={emergencyType}
                  onChange={(e) => setEmergencyType(e.target.value)}
                >
                  <option value="">Select Emergency Type</option>
                  <option value="Risk to self">Risk to self</option>
                  <option value="Risk to others">Risk to others</option>
                  <option value="Agitation">Agitation</option>
                  <option value="Psychosis">Psychosis</option>
                  <option value="Substance">Substance</option>
                  <option value="Inability to care">Inability to care</option>
                </Input>
              </div>
              <div className="mt-3">
                <Label className="text-muted mb-1">Restraint</Label>
                <Input
                  type="select"
                  value={emergencyRestraint}
                  onChange={(e) => setEmergencyRestraint(e.target.value)}
                >
                  <option value="">Select Restraint</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </Input>
              </div>
            </>
          )}

          {/* Next Button */}
          <div className="text-center mt-4">
            <Button
              type="button"
              color="success"
              disabled={
                !admissiontype ||
                (admissiontype === "INDEPENDENT_ADMISSION" && !adultationype) ||
                (admissiontype === "SUPPORTIVE_ADMISSION" && !supporttype) ||
                (admissiontype === "EMERGENCY_ADMISSION" &&
                  (!emergencyType || !emergencyRestraint))
              }
              onClick={() => {
                if (onProceed) onProceed();
                else {
                  toggle();
                  setOpenform(true);
                }
              }}
            >
              Submit
            </Button>
          </div>
        </>
      </div>
    </CustomModal>
  );
};

AdmissionFormModal.propTypes = {
  isOpen: PropTypes.bool,
  toggle: PropTypes.func,
  patient: PropTypes.object,
  chartDate: PropTypes.string,
};

const mapStateToProps = (state) => ({
  chartDate: state.Chart.chartDate,
  patient: state.Patient.patient,
  doctors: state.User?.doctor,
  psychologists: state.User?.counsellors,
  admissions: state.Chart.data,
});

export default connect(mapStateToProps)(AdmissionFormModal);
