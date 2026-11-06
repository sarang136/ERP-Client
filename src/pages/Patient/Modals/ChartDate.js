import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  Form,
  Dropdown,
  DropdownToggle,
  DropdownItem,
  DropdownMenu,
  Button,
} from "reactstrap";
import { set } from "date-fns";

//flatpicker
import Flatpicker from "react-flatpickr";
import "flatpickr/dist/themes/material_green.css";

import CustomModal from "../../../Components/Common/Modal";

//data
import {
  DISCHARGE_SUMMARY,
  EXPIRY_SUMMARY,
  OUTPASS,
  ADMISSION_TYPE,
  PRESCRIPTION,
  records,
  testRecord,
  COUNSELLING_NOTE,
  DETAIL_ADMISSION,
  VITAL_SIGN,
  ROUND_NOTE,
  MEDICINE_GIVEN,
  ELDERLY_FUNCTIONAL_CHECKLIST,
} from "../../../Components/constants/patient";

//redux
import { connect, useDispatch, useSelector } from "react-redux";
import {
  createEditChart,
  fetchCharts,
  fetchChartsAddmissions,
  setChartDate,
} from "../../../store/actions";
import {
  setTestName,
  setTestPageOpen,
} from "../../../store/features/clinicalTest/clinicalTestSlice";

const ChartDate = ({
  isOpen,
  toggle,
  type,
  chartDate,
  editChartData,
  patient,
  user,
  // When set, skips the "Add Records" chart-type picker and goes straight
  // into this chart type once the date is confirmed — for entry points that
  // only ever create one specific kind of chart (e.g. the psychologist
  // dashboard's "Start Counselling Note").
  fixedChart,
}) => {
  const dispatch = useDispatch();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggle2 = () => setDropdownOpen((prevState) => !prevState);
  const [selectedTest, setSelectedTest] = useState("Add test");
  const charts = useSelector(
    (state) =>
      state.Chart.data?.find((el) => el._id === patient?.addmission?._id)
        ?.charts,
  );

  useEffect(() => {
    if (isOpen) {
      const d = new Date();
      dispatch(setChartDate(d.toISOString()));
    }
  }, [dispatch, isOpen]);

  useEffect(() => {
    if (patient?.addmission?._id) {
      dispatch(fetchChartsAddmissions([patient.addmission._id]));
      dispatch(fetchCharts(patient.addmission._id));
    }
  }, [patient?.addmission?._id, dispatch]);

  const latestOutpass = charts
    ?.filter((c) => c?.chart === "OUTPASS")
    ?.reduce((latest, current) => {
      if (!latest) return current;
      return new Date(current?.createdAt) > new Date(latest?.createdAt)
        ? current
        : latest;
    }, null);

  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

  const toISTDateString = (dateInput) => {
    if (!dateInput) return null;
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return null;
    const shifted = new Date(date.getTime() + IST_OFFSET_MS);
    return shifted.toISOString().slice(0, 10);
  };

  const fromDate = latestOutpass?.outpass?.fromDate;
  const toDate = latestOutpass?.outpass?.toDate;

  const todayIST = toISTDateString(new Date());
  const fromIST = toISTDateString(fromDate);
  const toIST = toISTDateString(toDate);

  const isOnOutpass =
    fromIST && toIST ? todayIST >= fromIST && todayIST <= toIST : false;

  return (
    <React.Fragment>
      <CustomModal
        data-testid="chart-date-modal"
        title={"When did the Patient visit happen?"}
        isOpen={isOpen}
        toggle={() => {
          toggle();
          dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
        }}
      >
        <div>
          <Form>
            <p className="text-muted mt-0 mb-1">Chart date and time</p>
            <div className="d-flex justify-content-center align-items-center">
              <span>
                <Flatpicker
                  name="dateOfAdmission"
                  disabled={
                    type === "CLINICTEST" ||
                    ((patient.center?._id === "694e565ed6e6dd32a39c9815" ||
                      patient.center?.title === "Gurgaon") &&
                      type !== "GENERAL")
                      ? true
                      : false
                  }
                  value={chartDate || ""}
                  onChange={([e]) => {
                    const concat = set(new Date(chartDate), {
                      year: e.getFullYear(),
                      month: e.getMonth(),
                      date: e.getDate(),
                    });
                    dispatch(setChartDate(concat.toISOString()));
                  }}
                  options={{
                    dateFormat: "d M, Y",
                    // enable: [
                    //   function (date) {
                    //     return date.getDate() === new Date().getDate();
                    //   },
                    // ],
                  }}
                  // className={`form-control shadow-none bg-white`}
                  className={`form-control shadow-none ${patient.center?._id === "694e565ed6e6dd32a39c9815" || (patient.center?.title === "Gurgaon" && type !== "GENERAL") ? "disabled text-muted" : "bg-white"}`}
                  id="dateOfAdmission"
                />
              </span>
              <span className="ms-3 me-3">at</span>
              <span>
                <Flatpicker
                  name="dateOfAdmission"
                  value={chartDate || ""}
                  disabled={
                    type === "CLINICTEST" ||
                    ((patient.center?._id === "694e565ed6e6dd32a39c9815" ||
                      patient.center?.title === "Gurgaon") &&
                      type !== "GENERAL")
                      ? true
                      : false
                  }
                  onChange={([e]) => {
                    const concat = set(new Date(chartDate), {
                      hours: e.getHours(),
                      minutes: e.getMinutes(),
                      seconds: e.getSeconds(),
                      milliseconds: e.getMilliseconds(),
                    });
                    dispatch(setChartDate(concat.toISOString()));
                  }}
                  options={{
                    enableTime: true,
                    noCalendar: true,
                    dateFormat: "G:i:S K",
                    time_24hr: false,
                    // defaultDate: moment().format('LT'),
                  }}
                  // className={`form-control shadow-none bg-white`}
                  className={`form-control shadow-none
                    ${patient.center?._id === "694e565ed6e6dd32a39c9815" || (patient.center?.title === "Gurgaon" && type !== "GENERAL") ? "disabled text-muted" : "bg-white"}`}
                  id="dateOfAdmission"
                />
              </span>
            </div>
            <div className="d-flex align-items-center mt-3">
              <p className="text-muted d-block mb-0">Name:</p>
              <p className="text-primary ms-3 mb-0 font-semi-bold fs-6">
                {/* {user?.name} */}
                Doctor Name
              </p>
            </div>
          </Form>
        </div>
        <div>
          {fixedChart ? (
            <div className="d-flex justify-content-between align-items-center mt-3 border-top pt-3">
              <span className="text-danger">
                {isOnOutpass && !editChartData.data
                  ? "Patient is on Outpass. Chart creation is disabled."
                  : null}
              </span>
              <Button
                color="primary"
                disabled={isOnOutpass && !editChartData.data}
                onClick={() => {
                  dispatch(
                    createEditChart({
                      ...editChartData,
                      chart: fixedChart,
                      patient,
                      isOpen: true,
                      type,
                    }),
                  );
                  toggle();
                }}
              >
                Continue
              </Button>
            </div>
          ) : type !== "CLINICTEST" ? (
            <Dropdown
              className="text-end border-top pt-2 mt-2"
              size="sm"
              isOpen={dropdownOpen}
              toggle={toggle2}
              direction={"down"}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "100%",
                  border: "2px",
                }}
              >
                <span className="text-danger">
                  {isOnOutpass && !editChartData.data
                    ? "Patient is on Outpass. Chart creation is disabled."
                    : null}
                </span>
                <DropdownToggle caret={true} outline color="primary">
                  Add Records
                </DropdownToggle>
              </div>
              <DropdownMenu
                style={{ maxHeight: "350px" }}
                className="overflow-auto"
                flip={false}
                color="warning"
              >
                {(records || [])
                  .filter((item) => {
                    // Round-note and medicine-given charts are auto-generated —
                    // never offered as a manually creatable chart type.
                    if (item.category === ROUND_NOTE) return false;
                    if (item.category === MEDICINE_GIVEN) return false;
                    const isGeriatric =
                      String(patient?.addmission?.patientAdmissionType || "")
                        .trim()
                        .toLowerCase() === "geriatric";
                    if (
                      item.category === ELDERLY_FUNCTIONAL_CHECKLIST &&
                      !isGeriatric
                    ) {
                      return false;
                    }

                    if (user?.role === "NURSE") {
                      return ![
                        PRESCRIPTION,
                        COUNSELLING_NOTE,
                        DETAIL_ADMISSION,
                      ].includes(item.category);
                    }
                    if (["PSYCHOLOGIST", "MSW", "PSW"].includes(user?.role)) {
                      return ![PRESCRIPTION, VITAL_SIGN].includes(
                        item.category,
                      );
                    }
                    if (["COUNSELLOR"].includes(user?.role)) {
                      return ![PRESCRIPTION].includes(item.category);
                    }
                    return true;
                  })
                  .map((item, idx) => {
                    return (
                      <DropdownItem
                        disabled={
                          editChartData.data &&
                          editChartData.data.chart !== item.category
                            ? true
                            : type === "GENERAL" &&
                                (item.category === DISCHARGE_SUMMARY ||
                                  item.category === EXPIRY_SUMMARY ||
                                  item.category === OUTPASS ||
                                  // Admission type only means something for an
                                  // admitted patient.
                                  item.category === ADMISSION_TYPE ||
                                  item.category === ELDERLY_FUNCTIONAL_CHECKLIST)
                              ? true
                              : !editChartData.data && isOnOutpass
                                ? true
                                : false
                        }
                        key={idx + item.category}
                        onClick={() => {
                          dispatch(
                            createEditChart({
                              ...editChartData,
                              chart: item.category,
                              patient,
                              isOpen: true,
                              type,
                              ...(item.category === PRESCRIPTION && {
                                populatePreviousAppointment: true,
                              }),
                            }),
                          );
                          toggle();
                        }}
                      >
                        {/* Records */}
                        {item.name}
                      </DropdownItem>
                    );
                  })}
              </DropdownMenu>
            </Dropdown>
          ) : (
            <div className="d-flex justify-content-between align-items-center mt-3 border-top pt-3">
              <Dropdown
                size="sm"
                isOpen={dropdownOpen}
                toggle={toggle2}
                direction="down"
              >
                <DropdownToggle caret outline color="primary">
                  {selectedTest}
                </DropdownToggle>
                <DropdownMenu flip={false}>
                  {testRecord.map((item, idx) => (
                    <DropdownItem
                      key={idx}
                      onClick={() => {
                        setSelectedTest(item.name);
                        dispatch(setTestName(item.name));
                      }}
                    >
                      {item.name}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>

              <Button
                onClick={() => {
                  dispatch(setTestPageOpen(true));
                  toggle();
                }}
                color="primary"
                disabled={selectedTest === "Add test"}
              >
                Start
              </Button>
            </div>
          )}
        </div>
      </CustomModal>
    </React.Fragment>
  );
};

ChartDate.propTypes = {
  isOpen: PropTypes.bool,
  toggle: PropTypes.func,
  chartDate: PropTypes.string,
  editChartData: PropTypes.object,
  patient: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
  chartDate: state.Chart.chartDate,
  editChartData: state.Chart.chartForm,
  patient: state.Patient.patient,
  user: state.User.user,
});

export default connect(mapStateToProps)(ChartDate);
