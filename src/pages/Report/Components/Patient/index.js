import referredByName from "../../../../utils/referredByName";
import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { differenceInYears, endOfDay, format, startOfDay } from "date-fns";
import { connect } from "react-redux";
import Header from "../Header";
import Divider from "../../../../Components/Common/Divider";
import DataTable from "react-data-table-component";
import { CSVLink } from "react-csv";
import { Button, Input } from "reactstrap";
import {
  GET_PATIENT_ANALYTICS,
  GET_PATIENT_ANALYTICS_WP,
} from "../../../../helpers/url_helper";
import axios from "axios";

const Patient = ({ centerAccess }) => {
  const [reportDate, setReportDate] = useState({
    start: startOfDay(new Date()),
    end: endOfDay(new Date()),
  });
  const [filter, setFilter] = useState("");
  const [val, setVal] = useState("");
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [totaldata, setTotaldata] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [billCycle, setBillCycle] = useState(0);

  const [csvData, setCsvData] = useState([]);
  const [csvLoading, setCsvLoading] = useState(false);
  const csvRef = useRef();

  const fetchFullData = async () => {
    try {
      setCsvLoading(true);
      const res = await axios.get(GET_PATIENT_ANALYTICS_WP, {
        params: {
          startDate: reportDate.start.toISOString(),
          endDate: reportDate.end.toISOString(),
          filter,
          val,
          centerAccess,
          ...(filter === "ADMITTED_PATIENTS" && billCycle > 0
            ? { billCycle }
            : {}),
        },
      });

      if (res.success) {
        const fullData = res.payload || [];
        const formatted = fullData.map((d, i) => ({
          ...d,
          id: i + 1,
          uid: `${d?.id?.prefix || d?.patient?.id?.prefix || ""}${d?.id?.value || d?.patient?.id?.value || ""
            }`,

          // Referred By
          referredBy:
            referredByName(d?.patient?.referredBy) ||
            d?.patient?.referredBy ||
            referredByName(d?.referredBy) ||
            d?.referredBy,

          // Age
          age: d?.dateOfBirth
            ? differenceInYears(new Date(), new Date(d.dateOfBirth))
            : d?.patient?.dateOfBirth
              ? differenceInYears(new Date(), new Date(d.patient.dateOfBirth))
              : "",

          // Doctor name (from doctors[] or nested addmission)
          doctor: d?.doctors?.length
            ? d.doctors.map((doc) => doc?.name || "").pop()
            : d?.addmission?.doctors?.length
              ? d.addmission.doctors.map((doc) => doc?.name || "").pop()
              : d?.doctor?.name || d?.addmission?.doctor?.name || "",

          // Psychologist name (from psychologists[] or nested addmission)
          psychologist: d?.psychologists?.length
            ? d.psychologists.map((psy) => psy?.name || "").pop()
            : d?.addmission?.psychologists?.length
              ? d.addmission.psychologists.map((psy) => psy?.name || "").pop()
              : d?.psychologist?.name || d?.addmission?.psychologist?.name || "",

          // Guardian info (always inside patient)
          guardianName:
            d?.guardianName ||
            d?.patient?.guardianName ||
            "",
          // guardianPhoneNumber: d?.patient?.guardianPhoneNumber || "",

          // Dates
          addmissionDate: d?.addmission?.addmissionDate
            ? format(
              new Date(d.addmission.addmissionDate),
              "d MMM yyyy hh:mm a"
            )
            : d?.addmissionDate
              ? format(new Date(d.addmissionDate), "d MMM yyyy hh:mm a")
              : "",

          dischargeDate: d?.addmission?.dischargeDate
            ? format(new Date(d.addmission.dischargeDate), "d MMM yyyy hh:mm a")
            : d?.dischargeDate
              ? format(new Date(d.dischargeDate), "d MMM yyyy hh:mm a")
              : "",

          billCycleDate: d?.addmission?.addmissionDate
            ? format(new Date(d.addmission.addmissionDate), "d")
            : "",
        }));

        setCsvData(formatted);

        // trigger download
        setTimeout(() => {
          csvRef.current.link.click();
        }, 100);
      }
    } catch (err) {
    } finally {
      setCsvLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const res = await axios.get(GET_PATIENT_ANALYTICS, {
        params: {
          page,
          limit,
          startDate: reportDate.start.toISOString(),
          endDate: reportDate.end.toISOString(),
          filter,
          val,
          centerAccess,
          ...(filter === "ADMITTED_PATIENTS" && billCycle > 0
            ? { billCycle }
            : {}),
        },
      });

      if (res.success) {
        setData(res.payload || []);
        setTotalPages(res.pagination?.totalPages || 1);
        setTotaldata(res?.pagination?.total);
      }
    } catch (err) {
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, reportDate, filter, limit, centerAccess, val, billCycle]);

  const generalColumns = [
    {
      name: <div>#</div>,
      selector: (row, idx) => idx + 1,
    },
    {
      name: <div>Center</div>,
      selector: (row) => row.center?.title,
    },
    {
      name: <div>Patient</div>,
      selector: (row) => row.patient?.name,
      wrap: true,
      minWidth: "120px",
    },
    {
      name: <div>UID</div>,
      selector: (row) => `${row.patient?.id?.prefix}${row.patient?.id?.value}`,
    },
    {
      name: <div>Doctor</div>,
      selector: (row) => {
        const doctorsFromArray =
          row?.doctors?.length > 0
            ? row.doctors
              .map((d) =>
                d?.name ? d.name : d?.doctor?.name ? d.doctor.name : ""
              )
              .filter(Boolean)
              .join(", ")
            : null;

        const doctorsFromAdmission =
          row?.addmission?.doctors?.length > 0
            ? row.addmission.doctors
              .map((d) => d?.name || "")
              .filter(Boolean)
              .join(", ")
            : null;

        const fallbackDoctor =
          row?.addmission?.doctor?.name ||
          row?.doctor?.name ||
          row?.patient?.doctor?.name ||
          "-";

        return doctorsFromArray || doctorsFromAdmission || fallbackDoctor;
      },
      wrap: true,
      minWidth: "120px",
    },
    {
      name: <div>Psychologist</div>,
      selector: (row) => {
        const psychologistsFromArray =
          row?.psychologists?.length > 0
            ? row.psychologists
              .map((p) =>
                p?.name
                  ? p.name
                  : p?.psychologist?.name
                    ? p.psychologist.name
                    : ""
              )
              .filter(Boolean)
              .join(", ")
            : null;

        const psychologistsFromAdmission =
          row?.addmission?.psychologists?.length > 0
            ? row.addmission.psychologists
              .map((p) => p?.name || "")
              .filter(Boolean)
              .join(", ")
            : null;

        const fallbackPsychologist =
          row?.addmission?.psychologist?.name ||
          row?.psychologist?.name ||
          row?.patient?.psychologist?.name ||
          "-";

        return (
          psychologistsFromArray ||
          psychologistsFromAdmission ||
          fallbackPsychologist
        );
      },
      wrap: true,
      minWidth: "120px",
    },
    {
      name: <div>Gender</div>,
      selector: (row) => row.patient?.gender,
    },
    {
      name: <div>Referred By</div>,
      selector: (row) =>
        referredByName(row.patient?.referredBy) || row.patient?.referredBy,
      wrap: true,
      minWidth: "200px",
    },
    // {
    //   name: <div>Phone No</div>,
    //   selector: (row) => row.patient?.phoneNumber,
    //   wrap: true,
    //   minWidth: "125px",
    // },
    {
      name: <div>Age</div>,
      selector: (row) =>
        differenceInYears(new Date(), new Date(row.patient?.dateOfBirth)) +
        " years",
    },
    {
      name: <div>Guardian</div>,
      selector: (row) => row.patient?.guardianName,
      wrap: true,
    },
    // {
    //   name: <div>Guardian Number</div>,
    //   selector: (row) => row.patient?.guardianPhoneNumber,
    //   wrap: true,
    // },
    {
      name: <div>Admission Date</div>,
      selector: (row) =>
        row.addmissionDate
          ? format(new Date(row.addmissionDate), "d MMM yyyy hh:mm a")
          : "",
      wrap: true,
    },
    {
      name: <div>Discharge Date</div>,
      selector: (row) =>
        row.dischargeDate
          ? format(new Date(row.dischargeDate), "d MMM yyyy hh:mm a")
          : "",
      wrap: true,
    },
  ];

  const billCycleDate = {
    name: <div>Bill Cycle Date</div>,
    selector: (row) =>
      row.addmission?.addmissionDate
        ? format(new Date(row.addmission.addmissionDate), "d")
        : "",
    wrap: true,
  };

  const addmissionDate = {
    name: <div>Admission Date</div>,
    selector: (row) =>
      row.addmission?.addmissionDate
        ? format(new Date(row.addmission.addmissionDate), "d MMM yyyy hh:mm a")
        : "",
    wrap: true,
  };

  const dischargeDate = {
    name: <div>Discharge Date</div>,
    selector: (row) =>
      row.addmission?.dischargeDate
        ? format(new Date(row.addmission.dischargeDate), "d MMM yyyy hh:mm a")
        : "",
    wrap: true,
  };

  const patientRow = [
    {
      name: <div>#</div>,
      selector: (row, idx) => idx + 1,
    },
    {
      name: <div>Center</div>,
      selector: (row) => row.center?.title,
    },
    {
      name: <div>Patient</div>,
      selector: (row) => row?.name,
      wrap: true,
    },
    {
      name: <div>UID</div>,
      selector: (row) => `${row?.uid?.prefix}${row?.uid?.value}`,
    },
    {
      name: <div>Gender</div>,
      selector: (row) => row?.gender,
    },
    {
      name: <div>Referred By</div>,
      selector: (row) => referredByName(row?.referredBy) || row?.referredBy,
      wrap: true,
      minWidth: "200px",
    },
    {
      name: <div>Doctor</div>,
      selector: (row) =>
        row?.addmission?.doctors?.length > 0
          ? row.addmission.doctors
            .map((d) => d?.name || "")
            .filter(Boolean)
            .pop() || "—"
          : row?.addmission?.doctor?.name || row?.doctor?.name || "—",
      wrap: true,
    },
    {
      name: <div>Psychologist</div>,
      selector: (row) =>
        row?.addmission?.psychologists?.length > 0
          ? row.addmission.psychologists
            .map((p) => p?.name || "")
            .filter(Boolean)
            .pop() || "—"
          : row?.addmission?.psychologist?.name ||
          row?.psychologist?.name ||
          "—",
      wrap: true,
    },

    // {
    //   name: <div>Phone No</div>,
    //   selector: (row) => row?.phoneNumber,
    // },
    //
    {
      name: <div>Age</div>,
      selector: (row) =>
        row?.dateOfBirth
          ? differenceInYears(new Date(), new Date(row?.dateOfBirth)) + " years"
          : "",
    },
    {
      name: <div>Guardian</div>,
      selector: (row) => row?.guardianName,
      wrap: true,
    },
    // {
    //   name: <div>Guardian Number</div>,
    //   selector: (row) => row?.guardianPhoneNumber,
    //   wrap: true,
    // },
    {
      name: <div>IPD File NUmber</div>,
      selector: (row) => row.ipdFileNumber,
    },
  ];

  const admittedColumns = [...patientRow, addmissionDate, billCycleDate];
  const dischargeColumns = [...patientRow, addmissionDate, dischargeDate];

  const patientColumns = patientRow;

  const generalHeaders = [
    { label: "#", key: "id" },
    { label: "Center", key: "center.title" },
    { label: "Patient", key: "patient.name" },
    { label: "UID", key: "uid" },
    { label: "Gender", key: "patient.gender" },
    { label: "Referred By", key: "referredBy" },
    // { label: "Phone No", key: "patient.phoneNumber" },
    { label: "Doctor", key: "doctor" },
    { label: "Psychologist", key: "psychologist" },
    { label: "Age", key: "age" },
    { label: "Guardian", key: "guardianName" },
    // { label: "Guardian Number", key: "guardianPhoneNumber" },
    { label: "Admission Date", key: "addmissionDate" },
    { label: "Discharge Date", key: "dischargeDate" },
  ];

  const admittedHeaders = [
    { label: "#", key: "id" },
    { label: "Center", key: "center.title" },
    { label: "Patient", key: "name" },
    { label: "UID", key: "uid" },
    { label: "Gender", key: "gender" },
    { label: "Referred By", key: "referredBy" },
    // { label: "Phone No", key: "phoneNumber" },
    { label: "Doctor", key: "doctor" },
    { label: "Psychologist", key: "psychologist" },
    { label: "Age", key: "age" },
    { label: "Guardian", key: "guardianName" },
    // { label: "Guardian Number", key: "guardianPhoneNumber" },
    { label: "IPD File No", key: "ipdFileNumber" },
    { label: "Admission Date", key: "addmissionDate" },
    { label: "Bill Cycle Date", key: "billCycleDate" },
  ];

  const discahrgeHeaders = [
    { label: "#", key: "id" },
    { label: "Center", key: "center.title" },
    { label: "Patient", key: "name" },
    { label: "UID", key: "uid" },
    { label: "Gender", key: "gender" },
    { label: "Referred By", key: "referredBy" },
    // { label: "Phone No", key: "phoneNumber" },
    { label: "Doctor", key: "doctor" },
    { label: "Psychologist", key: "psychologist" },
    { label: "Age", key: "age" },
    { label: "Guardian", key: "guardianName" },
    // { label: "Guardian Number", key: "guardianPhoneNumber" },
    { label: "IPD File No", key: "ipdFileNumber" },
    { label: "Admission Date", key: "addmissionDate" },
    { label: "Discharge Date", key: "dischargeDate" },
  ];

  const patientHeaders = [
    { label: "#", key: "id" },
    { label: "Center", key: "center.title" },
    { label: "Patient", key: "name" },
    { label: "UID", key: "uid" },
    { label: "Gender", key: "gender" },
    // { label: "Phone No", key: "phoneNumber" },
    { label: "Doctor", key: "doctor" },
    { label: "Psychologist", key: "psychologist" },
    { label: "Age", key: "age" },
    { label: "Referred By", key: "referredBy" },
    { label: "Guardian", key: "guardianName" },
    // { label: "Guardian Number", key: "guardianPhoneNumber" },
    { label: "IPD File No", key: "ipdFileNumber" },
  ];

  return (
    <React.Fragment>
      <div className="pt-4">
        <div className="bg-white p-2 m-n3">
          <div className="">
            <h6 className="display-6 fs-6 my-3">
              Total Patients:- {totaldata}
            </h6>
          </div>
          <Header reportDate={reportDate} setReportDate={setReportDate} />
          <div className="d-flex flex-column flex-md-row justify-content-between mt-3 gap-3">
            <div className="d-flex flex-column flex-sm-row gap-2">
              <Input
                type="select"
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                }}
                className="w-auto"
              >
                <option value={""}>General</option>
                <option value={"ADMITTED_PATIENTS"}>Admitted Patients</option>
                <option value={"DISCHARGED_PATIENTS"}>
                  Discharged Patients
                </option>
                <option value={"ALL_PATIENTS"}>All Patients</option>
              </Input>

              <Input
                type="select"
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                style={{ width: "100px" }}
                className="w-100 w-sm-auto"
              >
                {[10, 20, 30, 40, 50].map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </Input>

              {filter === "ADMITTED_PATIENTS" && (
                <Input
                  type="select"
                  value={billCycle}
                  onChange={(e) => {
                    setBillCycle(Number(e.target.value));
                    setPage(1);
                  }}
                  style={{ width: "200px" }}
                  className="w-auto"
                >
                  <option value={0}>All Bill Cycle Date</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((bc) => (
                    <option key={bc} value={bc}>
                      {bc}
                    </option>
                  ))}
                </Input>
              )}
            </div>
            <div className="d-flex flex-column flex-sm-row gap-2">
              {filter === "ADMITTED_PATIENTS" &&
                (val === "ALL_ADMITTED" ? (
                  <Button
                    color="info"
                    onClick={() => setVal("")}
                    className="w-auto"
                  >
                    Back to dates
                  </Button>
                ) : (
                  <Button
                    color="info"
                    onClick={() => setVal("ALL_ADMITTED")}
                    className="w-auto"
                  >
                    Show All Admitted Patients
                  </Button>
                ))}

              <Button
                color="info"
                onClick={fetchFullData}
                disabled={csvLoading}
                className="w-auto"
              >
                {csvLoading ? "Preparing CSV..." : "Export CSV"}
              </Button>

              <CSVLink
                data={csvData || []}
                filename="reports.csv"
                headers={
                  filter === "ADMITTED_PATIENTS"
                    ? admittedHeaders
                    : filter === "DISCHARGED_PATIENTS"
                      ? discahrgeHeaders
                      : filter === "ALL_PATIENTS"
                        ? patientHeaders
                        : generalHeaders
                }
                className="d-none"
                ref={csvRef}
              />
            </div>
          </div>
          <Divider />
          <DataTable
            fixedHeader
            columns={
              filter === "ADMITTED_PATIENTS"
                ? admittedColumns
                : filter === "ALL_PATIENTS"
                  ? patientColumns
                  : filter === "DISCHARGED_PATIENTS"
                    ? dischargeColumns
                    : generalColumns
            }
            data={data?.map((d) => ({ ...d, uid: d.id, id: d._id })) || []}
            highlightOnHover
          />
          <div className="d-flex justify-content-between align-items-center mt-3">
            <Button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
            >
              Prev
            </Button>
            <span>
              Page {page} of {totalPages}
            </span>
            <Button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

Patient.propTypes = {
  data: PropTypes.array,
};

const mapStateToProps = (state) => ({
  data: state.Report.patient,
  centerAccess: state.User?.centerAccess,
});

export default connect(mapStateToProps)(Patient);