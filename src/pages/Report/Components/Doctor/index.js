import referredByName from "../../../../utils/referredByName";
import { useEffect, useRef, useState } from "react";
import DataTable from "react-data-table-component";
import { Input, Spinner, Row, Col, Button } from "reactstrap";
import {
  getDoctorAnalytics,
  getDoctorAnalyticsWP,
} from "../../../../helpers/backend_helper";
import Divider from "../../../../Components/Common/Divider";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { differenceInYears, endOfDay, format, startOfDay } from "date-fns";
import Header from "../Header";
import Highlighter from "react-highlight-words";
import { CSVLink } from "react-csv";
import CenterDropdown from "./components/CenterDropDown";
import { capitalizeWords } from "../../../../utils/toCapitalize";

const generalHeaders = [
  { label: "#", key: "id" },
  { label: "Name", key: "name" },
  { label: "Role", key: "role" },
  { label: "Patient", key: "patientName" },
  { label: "UID", key: "uid" },
  { label: "Gender", key: "gender" },
  { label: "Referred By", key: "referredBy" },
  // { label: "Phone No", key: "phoneNumber" },
  { label: "Age", key: "age" },
  { label: "Guardian", key: "guardianName" },
  // { label: "Guardian Number", key: "guardianPhoneNumber" },
  { label: "Admission Date", key: "addmissionDate" },
];

const Doctor = ({ centers, centerAccess }) => {
  const [reportDate, setReportDate] = useState({
    start: startOfDay(new Date()),
    end: endOfDay(new Date()),
  });
  const [data, setData] = useState({
    data: [],
    pagination: { totalPages: 1, totalDocs: 0 },
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [loading, setLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState("");
  const [patientFilter, setPatientFilter] = useState("");
  const [val, setVal] = useState("");
  const [csvData, setCsvData] = useState([]);
  const [csvLoading, setCsvLoading] = useState(false);
  const csvRef = useRef();

  const centerOptions = centers
    ?.filter((c) => centerAccess.includes(c._id))
    .map((c) => ({
      _id: c._id,
      title: c.title,
    }));

  const [, setSelectedCenters] = useState(centerOptions);
  const [selectedCentersIds, setSelectedCentersIds] = useState(
    centerOptions.map((c) => c._id),
  );

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => setPage(1), [debouncedSearch, limit]);

  const fetchFullData = async () => {
    try {
      setCsvLoading(true);
      const res = await getDoctorAnalyticsWP({
        startDate: reportDate.start.toISOString(),
        endDate: reportDate.end.toISOString(),
        search: debouncedSearch,
        centerAccess: selectedCentersIds,
        role: roleFilter,
        patient: patientFilter,
        ...(patientFilter === "ADMITTED_PATIENTS" && { val }),
      });

      const fullData = res.data || [];
      if (fullData.some((row) => row.dischargeDate !== null)) {
        generalHeaders.push({ label: "Discharge Date", key: "dischargeDate" });
      }

      const formatted = fullData.map((data, idx) => ({
        ...data,
        id: idx + 1,
        name: capitalizeWords(data.name),
        role: capitalizeWords(data.role),
        patientName: capitalizeWords(data.patientName),
        guardianName: capitalizeWords(data.guardianName),
        referredBy: capitalizeWords(
          referredByName(data.referredBy) || data.referredBy,
        ),
        age: data.dateOfBirth
          ? `${differenceInYears(new Date(), new Date(data.dateOfBirth))} years`
          : "",
        addmissionDate: data.addmissionDate
          ? format(new Date(data.addmissionDate), "d MMM yyyy hh:mm a")
          : "",
        dischargeDate: data.dischargeDate
          ? format(new Date(data.dischargeDate), "d MMM yyyy hh:mm a")
          : "",
      }));
      setCsvData(formatted);
      setTimeout(() => {
        csvRef.current.link.click();
      }, 100);
    } catch (error) {
    } finally {
      setCsvLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getDoctorAnalytics({
        startDate: reportDate.start.toISOString(),
        endDate: reportDate.end.toISOString(),
        page,
        limit,
        search: debouncedSearch,
        centerAccess: selectedCentersIds,
        role: roleFilter,
        patient: patientFilter,
        ...(patientFilter === "ADMITTED_PATIENTS" && { val }),
      });
      setData(res || { data: [], pagination: { totalPages: 1, totalDocs: 0 } });
    } catch (err) {
      setData({ data: [], pagination: { totalPages: 1, totalDocs: 0 } });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    debouncedSearch,
    selectedCentersIds,
    limit,
    roleFilter,
    reportDate,
    patientFilter,
    val,
  ]);

  const columns = [
    { name: "#", selector: (row, idx) => idx + 1, width: "60px" },
    {
      name: "Name",
      cell: (row) => (
        <span className="mb-0">
          <Highlighter
            searchWords={[search]}
            autoEscape
            textToHighlight={capitalizeWords(row.name) || "-"}
          />
        </span>
      ),
      wrap: true,
    },
    { name: "Role", selector: (row) => capitalizeWords(row.role) || "-" },
    {
      name: "Patient",
      selector: (row) => capitalizeWords(row.patientName) || "-",
      wrap: true,
    },
    {
      name: "UID",
      cell: (row) => (
        <span className="mb-0">
          <Highlighter
            searchWords={[search]}
            autoEscape
            textToHighlight={row.uid || "-"}
          />
        </span>
      ),
    },
    { name: "Gender", selector: (row) => row.gender || "-" },
    {
      name: "Referred By",
      selector: (row) =>
        capitalizeWords(referredByName(row.referredBy) || row.referredBy) || "-",
      wrap: true,
      minWidth: "200px",
    },
    // { name: "Phone No", selector: (row) => row.phoneNumber || "-", wrap: true },
    {
      name: "Age",
      selector: (row) =>
        row.dateOfBirth
          ? `${differenceInYears(new Date(), new Date(row.dateOfBirth))} years`
          : "-",
    },
    {
      name: "Guardian",
      selector: (row) => capitalizeWords(row.guardianName) || "-",
      wrap: true,
    },
    // {
    //   name: "Guardian Number",
    //   selector: (row) => row.guardianPhoneNumber || "-",
    //   wrap: true,
    // },
    {
      name: "Admission Date",
      selector: (row) =>
        row.addmissionDate
          ? format(new Date(row.addmissionDate), "d MMM yyyy hh:mm a")
          : "-",
      wrap: true,
    },
    {
      name: "Discharge Date",
      selector: (row) =>
        row.dischargeDate
          ? format(new Date(row.dischargeDate), "d MMM yyyy hh:mm a")
          : "-",
      wrap: true,
    },
  ];

  return (
    <>
      <div className="pt-4">
        <div className="bg-white p-2 m-n3">
          <div className="">
            <h3 className="display-6 fs-6 mt-3 mb-1">Doctor Analytics IPD</h3>
            <h6 className="display-6 fs-6 my-3">
              Total:-{" "}
              {loading ? (
                <span
                  style={{
                    display: "inline-block",
                    width: "20px",
                    height: "18px",
                    borderRadius: "4px",
                    background:
                      "linear-gradient(90deg, #e0e0e0 25%, #f5f5f5 50%, #e0e0e0 75%)",
                    backgroundSize: "200% 100%",
                    animation: "skeletonShimmer 1.2s infinite",
                    verticalAlign: "middle",
                  }}
                ></span>
              ) : (
                data?.pagination?.totalDocs || 0
              )}
              <style>
                {`
                 @keyframes skeletonShimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
               `}
              </style>
            </h6>
          </div>
          <Header reportDate={reportDate} setReportDate={setReportDate} />
          <div className="d-flex flex-wrap justify-content-between align-items-center mt-3">
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <Input
                type="select"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                style={{ width: "100px" }}
              >
                {[10, 20, 30, 40, 50].map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </Input>

              <Input
                type="select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{ width: "200px" }}
              >
                <option value="">All</option>
                <option value="doctor">Doctor</option>
                <option value="psychologist">Psychologist</option>
              </Input>

              <Input
                type="select"
                value={patientFilter}
                onChange={(e) => setPatientFilter(e.target.value)}
                style={{ width: "200px" }}
              >
                <option value="">All Patients</option>
                <option value="ADMITTED_PATIENTS">Admitted Patients</option>
              </Input>

              <Input
                type="text"
                placeholder="Search patient UID, doctor, or psychologist"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: "80%" }}
              />
              <CenterDropdown
                options={centerOptions}
                value={selectedCentersIds}
                onChange={(ids) => {
                  setSelectedCentersIds(ids);
                  setSelectedCenters(
                    centerOptions.filter((c) => ids.includes(c._id)),
                  );
                }}
              />
            </div>

            <div>
              {patientFilter === "ADMITTED_PATIENTS" &&
                (val === "ALL_ADMITTED" ? (
                  <Button
                    color="info"
                    onClick={() => setVal("")}
                    style={{ marginRight: "10px" }}
                  >
                    Back to dates
                  </Button>
                ) : (
                  <Button
                    color="info"
                    onClick={() => setVal("ALL_ADMITTED")}
                    style={{ marginRight: "10px" }}
                  >
                    Show All Admitted Patients
                  </Button>
                ))}
              <Button
                color="info"
                onClick={fetchFullData}
                disabled={csvLoading}
              >
                {csvLoading ? "Preparing CSV..." : "Export CSV"}
              </Button>
              <CSVLink
                data={csvData || []}
                filename="reports.csv"
                headers={generalHeaders}
                className="d-none"
                ref={csvRef}
              />
            </div>
          </div>

          <Divider />
          {loading ? (
            <div className="text-center py-4">
              <Spinner color="primary" />
            </div>
          ) : (
            <DataTable
              fixedHeader
              columns={columns}
              data={data?.data || []}
              highlightOnHover
              noHeader
            />
          )}

          {!loading && data?.pagination?.totalPages > 1 && (
            <Row className="mt-4 justify-content-center align-items-center">
              <Col xs="auto">
                <Button
                  color="secondary"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← Previous
                </Button>
              </Col>
              <Col xs="auto" className="text-center text-muted mx-3">
                Showing {(page - 1) * limit + 1}–
                {Math.min(page * limit, data?.pagination?.totalDocs || 0)} of{" "}
                {data?.pagination?.totalDocs || 0}
              </Col>
              <Col xs="auto">
                <Button
                  color="secondary"
                  disabled={page === data?.pagination?.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next →
                </Button>
              </Col>
            </Row>
          )}
        </div>
      </div>
    </>
  );
};

Doctor.prototype = {
  centers: PropTypes.array,
};

const mapStateToProps = (state) => ({
  centers: state.Center.data,
  centerAccess: state.User?.centerAccess,
});
export default connect(mapStateToProps)(Doctor);
