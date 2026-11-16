    import React, { useEffect, useMemo, useRef, useState } from "react";
    import { Link } from "react-router-dom";
    import { useDispatch, useSelector, shallowEqual } from "react-redux";
    import { Card, CardBody, Table, Spinner, Alert, Button, Row, Col } from "reactstrap";
    import { CSVLink } from "react-csv";
    import {  fetchPatientDocs } from "../../../store/features/miReporting/miReportingSlice";
    import Select from "react-select";


const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const formatMonthYear = (date) => `${MONTH_ABBR[date.getMonth()]} ${date.getFullYear()}`;

const STATUS_OPTIONS = [
    { value: "ALL", label: "All Statuses" },
    { value: "Complete", label: "Complete" },
    { value: "Incomplete", label: "Incomplete" },
];

const DOCS_TYPE_OPTIONS = [
    { value: "admitted", label: "Admitted" },
    { value: "discharged", label: "Discharged" },
];

const INCOMPLETE_SINCE_OPTIONS = [
    { value: "ALL", label: "All (Incomplete Since)" },
    { value: "GT7", label: "> 7 Days" },
    { value: "GT15", label: "> 15 Days" },
    { value: "GT30", label: "> 30 Days" },
];

const matchesIncompleteSince = (rawDays, bucket) => {
    if (bucket === "ALL") return true;
    const days = rawDays === "" || rawDays == null ? NaN : Number(rawDays);
    if (!Number.isFinite(days)) return false;
    if (bucket === "GT7") return days > 7;
    if (bucket === "GT15") return days > 15;
    if (bucket === "GT30") return days > 30;
    return true;
};

const PatientDocs = () => {
    const dispatch = useDispatch();
    const patientDocs = useSelector((state) => state.MIReporting.patientDocs);
    const loading = useSelector((state) => state.MIReporting.loading);
    const error = useSelector((state) => state.MIReporting.error);
    const centerAccess = useSelector((state) => state.User?.centerAccess || [], shallowEqual);
    const [selectedMonth, setSelectedMonth]=useState(
        formatMonthYear(new Date())
    )
    const [selectedCenter, setSelectedCenter] = useState("ALL");
    const [selectedStatus, setSelectedStatus] = useState("ALL");
    const [selectedDocsType, setSelectedDocsType] = useState("admitted");
    const [selectedIncompleteSince, setSelectedIncompleteSince] = useState("ALL");
    const [csvData, setCsvData] = useState([]);
    const [csvLoading, setCsvLoading] = useState(false);
    const csvRef = useRef();

    useEffect(() => {

        dispatch(fetchPatientDocs({ centerAccess,selectedMonth ,selectedStatus,selectedDocsType }));
    }, [dispatch, centerAccess,selectedCenter,selectedMonth,selectedStatus,selectedDocsType]);
    // Extract unique months and sort them descending

   
    const data = useMemo(() => patientDocs?.data || [], [patientDocs]);


    const filteredData = useMemo(()=>{
        return data.filter((item) =>{
            if (selectedCenter !== "ALL" && item?.center_name !== selectedCenter) return false;
            if (selectedStatus !== "ALL" && item?.info_complete !== selectedStatus) return false;
            if (!matchesIncompleteSince(item?.incomplete_since_days, selectedIncompleteSince)) return false;
              return true;
});

 },[data, selectedCenter, selectedStatus, selectedIncompleteSince] );

    
    const prepareCsvData = () => {
        setCsvLoading(true);

        const rows = filteredData.map((patient) =>
            labels.map((label) => {
                const val = patient[labelsMapping[label]] ?? "";
                if ((label === "Admission Date" || label === "Discharge Date") && val)
                    return new Date(val).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-");
                return val;
            })
        );

        setCsvData(rows);

        setTimeout(() => {
            csvRef.current.link.click();
            setCsvLoading(false);
        }, 100);
    };

    const centerOptions = useMemo(() => [
        { value: "ALL", label: "All Centers" },
        ...[...new Set(data.map((item) => item.center_name))].map((center) => ({
            value: center,
            label: center,
        })),
    ], [data]);

    const monthOptions = useMemo(() => {
        const options = [{ value: "last-6-months", label: "Last 6 Months" }];
        const now = new Date();
        const end = new Date(now.getFullYear(), now.getMonth(), 1);
        const start = new Date(now.getFullYear() - 5, now.getMonth() + 1, 1);
        for (let d = new Date(end); d >= start; d.setMonth(d.getMonth() - 1)) {
            const label = formatMonthYear(d);
            options.push({ value: label, label });
        }
        return options;
    }, []);





    const ADMITTED_DOC_LABELS = new Set([
        "Admission Form", "Consent Form", "Bio Data", "Profile Photo",
        "Prescription", "History", "Belongings Form", "Lab Report",
        "Capacity Assessment Form",
    ]);

    const DISCHARGED_DOC_LABELS = new Set([
        "Discharge Form", "Undertaking Discharge Form", "Discharge Summary","Expiry Summary"
    ]);

    const admittedLabels=[
            "Patient UID",
            "Patient Name",
            "Center Name",
            "Admission Date",
            "Discharge Date",
            "Days Stayed",
            "Admission Form",
            "Consent Form",
            "Bio Data",
            "Profile Photo",
            "Prescription",
            "History",
            "Belongings Form",
            "Lab Report",
            "Capacity Assessment Form",
            "Doctor Name",
            "Psychologist Name",
            "Center Manager",
            "Status",
            "Incomplete Since (Days)"
            ]

    const admittedLabelsMapping={

            "Patient UID":"patient_uid",
            "Patient Name":"patient_name",
            "Center Name":"center_name",
            "Admission Date":"admission_date",
            "Discharge Date":"discharge_date",
            "Days Stayed":"days_stayed",
            "Admission Form":"admission_form",
            "Consent Form":"consent_form",
            "Bio Data":"bio_data",
            "Profile Photo":"profile_photo",
            "Prescription":"prescription",
            "History":"history",
            "Belongings Form":"belongings_form",
            "Lab Report":"lab_report",
            "Capacity Assessment Form":"capacity_assessment_form",
            "Doctor Name":"doctor_name",
            "Psychologist Name":"psychologist_name",
            "Center Manager":"cm",
            "Status":"info_complete",
            "Incomplete Since (Days)":"incomplete_since_days"

    }

    const dischargedLabels=[
            "Patient UID",
            "Patient Name",
            "Center Name",
            "Admission Date",
            "Discharge Date",
            "Days Stayed",
            "Discharge Form",
            "Undertaking Discharge Form",
            "Discharge Summary",
            "Expiry Summary",
            "Doctor Name",
            "Psychologist Name",
            "Center Manager",
            "Status",
            "Incomplete Since (Days)"
            ]

    const dischargedLabelsMapping={

            "Patient UID":"patient_uid",
            "Patient Name":"patient_name",
            "Center Name":"center_name",
            "Admission Date":"admission_date",
            "Discharge Date":"discharge_date",
            "Days Stayed":"days_stayed",
            "Discharge Form":"dischargeform",
            "Undertaking Discharge Form":"undertakingdischargeform",
            "Discharge Summary":"discharge_summary",
            "Expiry Summary":"expiry_summary",
            "Doctor Name":"doctor_name",
            "Psychologist Name":"psychologist_name",
            "Center Manager":"cm",
            "Status":"info_complete",
            "Incomplete Since (Days)":"incomplete_since_days"

    }

    const isDischarged = selectedDocsType === "discharged";
    const labels = isDischarged ? dischargedLabels : admittedLabels;
    const labelsMapping = isDischarged ? dischargedLabelsMapping : admittedLabelsMapping;
    const DOC_LABELS = isDischarged ? DISCHARGED_DOC_LABELS : ADMITTED_DOC_LABELS;

    const compliance = useMemo(() => {
        const total = filteredData.length;
        const result = {};
        DOC_LABELS.forEach((label) => {
            const field = labelsMapping[label];
            const yesCount = filteredData.filter((p) => p[field] === "Yes").length;
            result[label] = total > 0 ? `${Math.round((yesCount / total) * 100)}%` : "-";
        });
        return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filteredData]);





    document.title = "IPD Patient Docs";

    return (
        <div
        className="w-100 mt-4 mt-sm-0"
        style={{
            flex: 1,
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
        }}
        >       
         <div className="row">
            <div className="col-12">
            <div className="p-3">
                <div className="row align-items-center">
                <div className="col-sm-6 col-8" >
                    <div className="d-flex align-items-center">
                    <div className="flex-grow-1 overflow-hidden">
                        <div className="d-flex align-items-center">
                        <div className="flex-shrink-0 chat-user-img online user-own-img align-self-center me-3 ms-0">
                            <i className="bx bx-bar-chart-alt-2 fs-1"></i>
                        </div>
                        <div className="flex-grow-1 overflow-hidden">
                            <h6 className="text-truncate mb-0 fs-18">
                            IPD Patient Docs
                            </h6>
                        </div>
                        </div>
                    </div>
                    </div>
                </div>
                
                <div className="col-sm-6 col-4">
                    <div className="d-flex justify-content-end">
                    <Button
                        color="info"
                        onClick={prepareCsvData}
                        disabled={
                        csvLoading ||
                        loading ||
                        !patientDocs ||
                        patientDocs.length === 0
                        }
                        className="w-auto"
                    >
                        {csvLoading ? "Preparing CSV..." : "Export CSV"}
                    </Button>
                    <CSVLink
                        data={csvData || []}
                        filename={`patient-docs-${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-")}.csv`}
                        headers={labels}
                        className="d-none"
                        ref={csvRef}
                    />
                    </div>
                </div>
                </div>
            </div>

            <div className="p-3 p-lg-4">
                <Row className="g-2 align-items-center mb-4">
                    <Col md={2}>
                        <Select
                            value={centerOptions.find((o) => o.value === selectedCenter) || centerOptions[0]}
                            onChange={(opt) => setSelectedCenter(opt.value)}
                            options={centerOptions}
                            placeholder="Center..."
                        />
                    </Col>
                    <Col md={2}>
                        <Select
                            value={monthOptions.find((o) => o.value === selectedMonth) || null}
                            onChange={(opt) => setSelectedMonth(opt.value)}
                            options={monthOptions}
                            placeholder="Month..."
                        />
                    </Col>
                    <Col md={2}>
                        <Select
                            value={STATUS_OPTIONS.find((o) => o.value === selectedStatus) || STATUS_OPTIONS[0]}
                            onChange={(opt) => setSelectedStatus(opt.value)}
                            options={STATUS_OPTIONS}
                            placeholder="Status..."
                        />
                    </Col>
                    <Col md={2}>
                        <Select
                            value={DOCS_TYPE_OPTIONS.find((o) => o.value === selectedDocsType) || DOCS_TYPE_OPTIONS[0]}
                            onChange={(opt) => setSelectedDocsType(opt.value)}
                            options={DOCS_TYPE_OPTIONS}
                            placeholder="Docs Type..."
                        />
                    </Col>
                    <Col md={2}>
                        <Select
                            value={INCOMPLETE_SINCE_OPTIONS.find((o) => o.value === selectedIncompleteSince) || INCOMPLETE_SINCE_OPTIONS[0]}
                            onChange={(opt) => setSelectedIncompleteSince(opt.value)}
                            options={INCOMPLETE_SINCE_OPTIONS}
                            placeholder="Incomplete Since..."
                        />
                    </Col>
                </Row>
                <Card>
                <CardBody>
                    {loading && (
                    <div className="text-center py-5">
                        <Spinner color="primary" />
                        <p className="mt-2 text-muted">Loading data...</p>
                    </div>
                    )}

                    {error && !loading && <Alert color="danger">{error}</Alert>}

                    {!loading && !error && (
                        <>
                    <div className="shadow-sm bg-white" style={{ borderRadius: 12, border: "1px solid #cfd8e3", overflow: "auto", maxHeight: "70vh" }}>
                        <Table
                            className="mb-0 w-100"
                            style={{
                                borderCollapse: "separate",
                                borderSpacing: 0,
                                fontSize: "0.68rem",
                                tableLayout: "fixed",
                            }}
                        >
                            <thead>
                                <tr>
                                    {labels.map((label) => (
                                        <th
                                            key={label}
                                            className="text-center fw-bold px-1 py-2"
                                            style={{
                                                border: "1px solid #cfd8e3",
                                                background: "green",
                                                color: "white",
                                                whiteSpace: "normal",
                                                wordBreak: "break-word",
                                                position: "sticky",
                                                top: 0,
                                                zIndex: 2,
                                            }}
                                        >
                                            {label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                <tr>
                                    {labels.map((label) => (
                                        <td
                                            key={label}
                                            className="text-center px-1 py-2 fw-bold"
                                            style={{
                                                border: "1px solid #cfd8e3",
                                                background: "#004d00",
                                                color: "white",
                                                whiteSpace: "normal",
                                                wordBreak: "break-word",
                                            }}
                                        >
                                            {label === "Patient Name"
                                                ? "Compliance"
                                                : DOC_LABELS.has(label)
                                                ? compliance[label]
                                                : ""}
                                        </td>
                                    ))}
                                </tr>
                                {filteredData.map((patient, idx) => (
                                    <tr key={patient?.patient_uid ?? idx}>
                                        {labels.map((label) => (
                                            <td
                                                key={label}
                                                className="text-center px-1 py-2"
                                                style={{
                                                    border: "1px solid #d6dde8",
                                                    background: idx % 2 === 0 ? "#f8fafc" : "#fff",
                                                    whiteSpace: "normal",
                                                    wordBreak: "break-word",
                                                    color: ["Yes", "Complete"].includes(patient[labelsMapping[label]])
                                                        ? "green"
                                                        : ["No", "Incomplete"].includes(patient[labelsMapping[label]])
                                                        ? "red"
                                                        : "inherit",
                                                    fontWeight: ["Yes", "No", "Complete", "Incomplete"].includes(patient[labelsMapping[label]])
                                                        ? "bold"
                                                        : "normal",
                                                }}
                                            >
                                                {(label === "Admission Date" || label === "Discharge Date") && patient[labelsMapping[label]]
                                                    ? new Date(patient[labelsMapping[label]]).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-")
                                                    : (label === "Patient Name" || label === "Patient UID")
                                                        ? (
                                                            <Link to={`/patient/${patient.patient_mongo_id}`} className="text-dark" target="_blank" rel="noopener noreferrer">
                                                                {patient[labelsMapping[label]]}
                                                            </Link>
                                                        )
                                                        : patient[labelsMapping[label]]}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                            </Table>
                        </div>
                    </>
                    )}
                </CardBody>
                </Card>
            </div>
            </div>
        </div>
        </div>
    );
    };

    export default PatientDocs;