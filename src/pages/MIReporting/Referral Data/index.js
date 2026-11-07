import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { Card, CardBody, Table, Spinner, Alert, Button, Row, Col, Input } from "reactstrap";
import Select from "react-select";
import { fetchReferralData } from "../../../store/features/miReporting/miReportingSlice";
import { exportReferralDataCSV } from "../../../helpers/backend_helper";

const labels = [
    "UID",
    "Patient",
    "Age",
    "Gender",
    "Ad. Date",
    "Dis. Date",
    "Center",
    "Admitted",
    "Pt. Type",
    "Referred By",
    "Referred By Speciality",
    "Referred By Hospital/Clinic",
    "Referred By Mobile Number",
    "Referred By Email",
];

const labelsMapping = {
    "UID": "UID",
    "Patient": "Patient",
    "Age": "Age",
    "Gender": "Gender",
    "Ad. Date": "Addmission Date",
    "Dis. Date": "Discharge Date",
    "Center": "Center",
    "Admitted": "Currently Admitted",
    "Pt. Type": "Patient Type",
    "Referred By": "Referred By",
    "Referred By Speciality": "Referred By Speciality",
    "Referred By Hospital/Clinic": "Referred By Hospital/Clinic",
    "Referred By Mobile Number": "Referred By Mobile Number",
    "Referred By Email": "Referred By Email",
};

const DATE_LABELS = new Set(["Admission Date", "Discharge Date"]);

const ADMITTED_OPTIONS = [
    { value: "ALL", label: "All Patients" },
    { value: "Yes", label: "Currently Admitted" },
    { value: "No", label: "Not Admitted" },
];

const formatDate = (val) => {
    if (!val) return "";
    const d = new Date(val);
    if (isNaN(d)) return val;
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-");
};

const headerStyle = {
    border: "1px solid #cfd8e3",
    background: "#004d00",
    color: "white",
    whiteSpace: "nowrap",
    position: "sticky",
    top: 0,
    zIndex: 2,
};

const cellStyle = (idx) => ({
    border: "1px solid #d6dde8",
    background: idx % 2 === 0 ? "#f8fafc" : "#fff",
    whiteSpace: "nowrap",
});

const ReferralData = () => {
    const dispatch = useDispatch();
    const { referralData, loading, error } = useSelector((state) => state.MIReporting);
    const centers = useSelector((state) => state.Center?.data || [], shallowEqual);
    const centerAccess = useSelector((state) => state.User?.centerAccess || [], shallowEqual);

    const [selectedCenter, setSelectedCenter] = useState("ALL");
    const [selectedAdmitted, setSelectedAdmitted] = useState("ALL");
    const [page, setPage] = useState(1);
    const [pageInput, setPageInput] = useState("1");
    const [limit] = useState(40);
    const [csvLoading, setCsvLoading] = useState(false);

    useEffect(() => {
        dispatch(
            fetchReferralData({
                centerAccess,
                center: selectedCenter !== "ALL" ? selectedCenter : undefined,
                currentlyAdmitted: selectedAdmitted !== "ALL" ? selectedAdmitted : undefined,
                page,
                limit,
            })
        );
    }, [dispatch, centerAccess, selectedCenter, selectedAdmitted, page, limit]);

    useEffect(() => {
        setPage(1);
    }, [selectedCenter, selectedAdmitted]);

    useEffect(() => {
        setPageInput(String(page));
    }, [page]);

    const data = useMemo(() => referralData?.data || [], [referralData]);
    const pagination = referralData?.pagination || { page: 1, limit, total: 0, totalPages: 0 };

    const centerOptions = useMemo(() => [
        { value: "ALL", label: "All Centers" },
        ...(centers || [])
            .map((c) => c.title)
            .filter(Boolean)
            .sort()
            .map((title) => ({ value: title, label: title })),
    ], [centers]);

    const getCellValue = (item, label) => {
        const raw = item[labelsMapping[label]];
        if (DATE_LABELS.has(label)) return formatDate(raw);
        return raw || "";
    };

    const handleExportCSV = async () => {
        try {
            setCsvLoading(true);
            const response = await exportReferralDataCSV({
                centerAccess,
                center: selectedCenter !== "ALL" ? selectedCenter : undefined,
                currentlyAdmitted: selectedAdmitted !== "ALL" ? selectedAdmitted : undefined,
            });
            const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.setAttribute("download", `referral-data-${new Date().toISOString().split("T")[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (err) {
            // no-op; export failure shouldn't disrupt the page
        } finally {
            setCsvLoading(false);
        }
    };

    const goToPage = () => {
        const totalPages = pagination.totalPages || 1;
        let target = parseInt(pageInput, 10);
        if (isNaN(target)) target = page;
        target = Math.min(Math.max(target, 1), totalPages);
        setPage(target);
        setPageInput(String(target));
    };

    document.title = "Referral Data";

    return (
        <div className="w-100 mt-4 mt-sm-0" style={{ flex: 1, width: "100%", maxWidth: "100%", minWidth: 0 }}>
            <div className="row">
                <div className="col-12">
                    <div className="p-3 pb-0">
                        <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center">
                                <i className="bx bx-share-alt fs-1 me-3"></i>
                                <h6 className="text-truncate mb-0 fs-18">Referral Data</h6>
                            </div>
                            <Button
                                color="info"
                                onClick={handleExportCSV}
                                disabled={csvLoading}
                                className="w-auto"
                            >
                                {csvLoading ? "Preparing CSV..." : "Export CSV"}
                            </Button>
                        </div>
                    </div>

                    <div className="p-3 p-lg-4">
                        <Row className="g-2 align-items-center mb-3">
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
                                    value={ADMITTED_OPTIONS.find((o) => o.value === selectedAdmitted) || ADMITTED_OPTIONS[0]}
                                    onChange={(opt) => setSelectedAdmitted(opt.value)}
                                    options={ADMITTED_OPTIONS}
                                    placeholder="Currently Admitted..."
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
                                        <div
                                            className="shadow-sm bg-white"
                                            style={{ borderRadius: 12, border: "1px solid #cfd8e3", overflow: "auto", maxHeight: "calc(100vh - 330px)" }}
                                        >
                                            <Table
                                                className="mb-0 w-100"
                                                style={{ borderCollapse: "separate", borderSpacing: 0, fontSize: "0.68rem" }}
                                            >
                                                <thead>
                                                    <tr>
                                                        {labels.map((label) => (
                                                            <th key={label} className="text-center fw-bold px-1 py-1" style={headerStyle}>
                                                                {label}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={labels.length} className="text-center py-4 text-muted">
                                                                No data found
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        data.map((item, idx) => (
                                                            <tr key={item.UID ?? idx}>
                                                                {labels.map((label) => (
                                                                    <td key={label} className="text-center px-1 py-1" style={cellStyle(idx)}>
                                                                        {getCellValue(item, label)}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </Table>
                                        </div>

                                        <div className="d-flex align-items-center justify-content-between mt-3">
                                            <div className="text-muted" style={{ fontSize: "0.8rem" }}>
                                                {pagination.total > 0
                                                    ? `Page ${pagination.page} of ${pagination.totalPages} (${pagination.total} total)`
                                                    : ""}
                                            </div>
                                            <div className="d-flex gap-2">
                                                <Button
                                                    color="secondary"
                                                    outline
                                                    size="sm"
                                                    disabled={page <= 1}
                                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                                >
                                                    Previous
                                                </Button>
                                                <div className="d-flex align-items-center gap-1">
                                                    <span className="text-muted" style={{ fontSize: "0.8rem" }}>
                                                        Go to
                                                    </span>
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        max={pagination.totalPages || 1}
                                                        value={pageInput}
                                                        onChange={(e) => setPageInput(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") goToPage();
                                                        }}
                                                        bsSize="sm"
                                                        style={{ width: 70 }}
                                                    />
                                                    <Button color="secondary" outline size="sm" onClick={goToPage}>
                                                        Go
                                                    </Button>
                                                </div>
                                                <Button
                                                    color="secondary"
                                                    outline
                                                    size="sm"
                                                    disabled={page >= (pagination.totalPages || 1)}
                                                    onClick={() => setPage((p) => Math.min(pagination.totalPages || p, p + 1))}
                                                >
                                                    Next
                                                </Button>
                                            </div>
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

export default ReferralData;
