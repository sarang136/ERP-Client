import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { Card, CardBody, Table, Spinner, Alert, Row, Col } from "reactstrap";
import { fetchDailyDashboard } from "../../../store/features/miReporting/miReportingSlice";
import Select from "react-select";
import Flatpickr from "react-flatpickr";
import moment from "moment";
import "flatpickr/dist/flatpickr.css";

const METRICS = [
    { label: "Nurses Data",                                     key: "nurses_data",        compliance: true, highlightLowCompliance: true },
    { label: "Clinical Notes",                                  key: "clinical_notes",     compliance: true, highlightLowCompliance: true },
    { label: "Vital Signs",                                     key: "vital_signs",        compliance: true, highlightLowCompliance: true },
    { label: "Counseling Sessions",                             key: "counselling_sessions", compliance: true, highlightLowCompliance: true },
    { label: "Round Notes",                                     key: "round_notes",        compliance: true, highlightLowCompliance: true },
    { label: "Attendance Count",                                key: "attendance_count",   compliance: true, highlightLowCompliance: true },
    { label: "Invoice Creation",                                key: "invoice_creation",   compliance: true, highlightLowCompliance: true },
    { label: "Till Date Revenue MTD / Advance Payment",         key: "revenue_mtd",        revenueRow: true, compliance: true },
    { label: "Docs Till Date(Ipd) MTD",                        key: "docs_ipd",           compliance: true, highlightLowCompliance: true },
    { label: "Docs (Opd). MTD",                                key: "docs_opd",           compliance: true, highlightLowCompliance: true },
    { label: "Occupancy Till Date",                             key: "occupancy_mtd",      compliance: false },
    { label: "Admission MTD",                                   key: "admission_mtd",      compliance: false },
    { label: "Discharged MTD",                                  key: "discharged_mtd",     compliance: false },
    { label: "Audit Data Sod",                                  key: "audit_sod",          compliance: false },
    { label: "Audit Data Eod",                                  key: "audit_eod",          compliance: false },
    { label: "Morning Yoga",                                    key: "morning_yoga",       compliance: false },
    { label: "Evening Activity",                                key: "evening_activity",   compliance: false },
    { label: "Form-1 Nursing Staff Training (Monthly)",         key: "form_1",             compliance: true },
    { label: "Form-2 Patient Care Training (Monthly)",          key: "form_2",             compliance: true },
    { label: "Form-3 Psychologist Training Pointers (Monthly)", key: "form_3",             compliance: true },
    { label: "Form-4 MSW/New Joinee Training (Monthly)",        key: "form_4",             compliance: true },
    { label: "Frisiking (Monthly)",                             key: "frisking",           compliance: true },
    { label: "Multidisciplinary Meeting(Monthly)",              key: "multidisciplinary_meeting",           compliance: true },
    { label: "Cash Per Center Remaining",                       key: "cash_remaining",     compliance: false },
    { label: "Due Amount",                                      key: "due_amount",         compliance: false },
];

const DailyDashboard = () => {
    const dispatch = useDispatch();
    const data = useSelector((state) => state.MIReporting.dailyDashboard);
    const loading = useSelector((state) => state.MIReporting.loading);
    const error = useSelector((state) => state.MIReporting.error);
    const centerAccess = useSelector((state) => state.User?.centerAccess || [], shallowEqual);

    const [selectedCenter, setSelectedCenter] = useState("");
    const [selectedDate, setSelectedDate] = useState(moment().subtract(1, "day").format("YYYY-MM-DD"));

    useEffect(() => {
        dispatch(fetchDailyDashboard({ centerAccess, date: selectedDate }));
    }, [dispatch, centerAccess, selectedDate]);

    const rows = useMemo(() => data?.data || [], [data]);

    const centerOptions = useMemo(() =>
        rows
            .filter((r) => r.center_name !== "Total")
            .map((r) => ({ value: r.center_name, label: r.center_name })),
    [rows]);

    useEffect(() => {
        if (centerOptions.length === 0) return;
        if (!centerOptions.some((o) => o.value === selectedCenter)) {
            setSelectedCenter(centerOptions[0].value);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [centerOptions]);

    const selectedRow = useMemo(
        () => rows.find((r) => r.center_name === selectedCenter) || {},
        [rows, selectedCenter]
    );

    const computeCompliance = (actual, shouldBe) => {
        if (shouldBe == null || shouldBe === 0 || actual == null) return "";
        return `${Math.round((actual / shouldBe) * 100)}%`;
    };

    // Revenue: show shouldBe - actual (shortfall as plain number)
    const computeRevenueCompliance = (actual, shouldBe) => {
        if (shouldBe == null || actual == null) return "";
        return (shouldBe - actual).toFixed(2);
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

    document.title = "Daily Dashboard";

    return (
        <div className="mt-4 mt-sm-0" style={{ maxWidth: 700 }}>
            <div className="p-3 d-flex align-items-center">
                <i className="bx bx-bar-chart-alt-2 fs-1 me-3"></i>
                <h6 className="text-truncate mb-0 fs-18">Daily Dashboard</h6>
            </div>

            <div className="px-3 pb-3">
                <Row className="g-2 align-items-center mb-3">
                    <Col xs="auto">
                        <Select
                            value={centerOptions.find((o) => o.value === selectedCenter) || centerOptions[0]}
                            onChange={(opt) => setSelectedCenter(opt.value)}
                            options={centerOptions}
                            placeholder="Center..."
                            styles={{ container: (b) => ({ ...b, minWidth: 160 }) }}
                        />
                    </Col>
                    <Col xs="auto">
                        <Flatpickr
                            className="form-control"
                            value={selectedDate}
                            options={{
                                    dateFormat: "Y-m-d",
                                    maxDate: moment().subtract(1, "day").toDate(),
                                    minDate: moment().subtract(60, "days").toDate(),
                                }}
                            onChange={([date]) => setSelectedDate(moment(date).format("YYYY-MM-DD"))}
                            placeholder="Select date..."
                            style={{ width: 130 }}
                        />
                    </Col>
                </Row>

                <Card className="shadow-sm" style={{ border: "1px solid #cfd8e3", borderRadius: 10 }}>
                    <CardBody className="p-0">
                        {loading && (
                            <div className="text-center py-4">
                                <Spinner color="primary" />
                                <p className="mt-2 text-muted mb-0">Loading data...</p>
                            </div>
                        )}

                        {error && !loading && <Alert color="danger" className="m-3">{error}</Alert>}

                        {!loading && !error && (
                            <Table
                                className="mb-0"
                                style={{ borderCollapse: "collapse", fontSize: "0.78rem", width: "100%" }}
                            >
                                <thead>
                                    <tr>
                                        {["Data", "Should Be", "Actual Result", "Compliance %"].map((header) => (
                                            <th key={header} className="text-center fw-bold px-2 py-1" style={headerStyle}>
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {METRICS.map(({ label, key, revenueRow, compliance: showCompliance, highlightLowCompliance }, idx) => {
                                        const metric = selectedRow[key] || {};
                                        const shouldBe = metric.should_be_count ?? null;
                                        const actual = metric.result_count ?? null;
                                        const compliance = showCompliance
                                            ? (revenueRow
                                                ? computeRevenueCompliance(actual, shouldBe)
                                                : computeCompliance(actual, shouldBe))
                                            : "";
                                        const isLowCompliance =
                                            highlightLowCompliance &&
                                            typeof compliance === "string" &&
                                            compliance.endsWith("%") &&
                                            parseInt(compliance, 10) < 100;
                                        return (
                                            <tr key={key}>
                                                <td className="px-2 py-1 fw-semibold" style={cellStyle(idx)}>
                                                    {label}
                                                </td>
                                                <td className="text-center px-2 py-1" style={cellStyle(idx)}>
                                                    {shouldBe != null ? shouldBe : ""}
                                                </td>
                                                <td className="text-center px-2 py-1" style={cellStyle(idx)}>
                                                    {actual != null ? actual : ""}
                                                </td>
                                                <td
                                                    className="text-center px-2 py-1 fw-semibold"
                                                    style={{
                                                        ...cellStyle(idx),
                                                        background: isLowCompliance ? "#ffcdd2" : cellStyle(idx).background,
                                                    }}
                                                >
                                                    {compliance}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        )}
                    </CardBody>
                </Card>
            </div>
        </div>
    );
};

export default DailyDashboard;
