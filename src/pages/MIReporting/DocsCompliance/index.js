import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { Card, CardBody, Table, Spinner, Alert, Button, Row, Col, UncontrolledTooltip } from "reactstrap";
import { CSVLink } from "react-csv";
import { fetchDocsCompliance } from "../../../store/features/miReporting/miReportingSlice";
import Select from "react-select";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

const COLORS = [
    "#0D47A1", "#1B5E20", "#B71C1C", "#4A148C", "#E65100",
    "#006064", "#3E2723", "#263238", "#880E4F", "#1A237E",
    "#33691E", "#5D4037", "#37474F", "#6A1B9A", "#BF360C",
    "#827717", "#004D40",
];

const METRICS = [
    { label: "Admission Form",       key: "admission_form",       description: "Percentage of admitted patients with a completed admission form." },
    { label: "Consent Form",         key: "consent_form",         description: "Percentage of patients with consent form completed." },
    { label: "Bio Data",             key: "bio_data",              description: "Percentage of patient profiles with complete demographic information." },
    { label: "Profile Photo",        key: "profile_photo",        description: "Percentage of patient records with a profile photo uploaded." },
    { label: "Prescription",         key: "prescription",         description: "Percentage of new patients with a prescription available in the system" },
    { label: "History",              key: "history",               description: "Percentage of patient records with complete medical and psychiatric history documented." },
    { label: "Belongings Form",      key: "belongings_form",      description: "Percentage of patients with belongings documentation completed at admission." },
    { label: "Lab Report",           key: "lab_report",           description: "Percentage of required lab reports uploaded and linked to the patient record." },
    { label: "Capacity Assessment Form",        key: "capacity_assessment_form" ,description: "Percentage of patients with capacity assesment form completed."},
    { label: "Discharge Summary",    key: "discharge_summary",    description: "Percentage of discharged patients with Discharge Summary completed." },
    { label: "Discharge Form",       key: "dischargeform",        description: "Percentage of discharged patients with Discharge Form completed." },
    { label: "Undertaking Discharge Form", key: "undertakingdischargeform", description: "Percentage of discharged patients with Undertaking Discharge Form completed." },
    { label: "Nurses DOD",           key: "nurses_dod",           description: "Percentage of patients with the Daily medicines updated by nursing staff for next day" },
    { label: "Daily Invoice",        key: "daily_invoice",        description: "Percentage of daily invoices generated and updated for admitted patients." },
    { label: "Vital Signs",          key: "vital_signs",          description: "Percentage of daily vital signs recorded on a daily basis" },
    { label: "Clinical Notes",       key: "clinical_notes",       description: "Percentage of patients with clinical notes updated everyday" },
    // { label: "Counselling Sessions", key: "counselling_sessions", description: "Percentage of scheduled counselling sessions completed and documented. 2 in a day per Psycologist" },
    // { label: "Counselling Recording",key: "counselling_recording",description: "Percentage of scheduled counselling Recording completed and documented. (2 in a week per patient) 2 in a day per Psycologist" },
    { label: "Counselling Sessions Patients",  key: "counselling_sessions_patients", description: "Percentage of scheduled counselling sessions completed and documented. (2 in a week per patient)" },
    { label: "Round Notes",          key: "round_notes",          description: "Percentage of doctor/clinical round notes completed as per schedule. (12 rounds in a day 24 hours)" },
    { label: "Due Amount",           key: "due_amount",           description: "Percentage of outstanding dues collected or updated as per billing timelines." },
    { label: "Prescription Status",  key: "prescription_status", description: "Percentage of active prescriptions in the required timeline." },
    { label: "Frisking",             key: "frisking",             description: "Percentage of frisking done.(2 in a month)" },
    // { label: "Form-1 Nursing Staff Training", key: "form_1",      description: "Percentage of nurse staff training forms filled.(2 in a month)" },
    // { label: "Form-2 Patient Care Training",  key: "form_2",      description: "Percentage of patient care training forms filled.(2 in a month)" },
    // { label: "Form-3 Psychologist Training Pointers", key: "form_3", description: "Percentage of psychologist training forms filled.(2 in a month)" },
    // { label: "Form-4 MSW/New Joinee Training", key: "form_4",     description: "Percentage of new joinee training forms filled.(4 in a month)" },
    // { label: "Multidisciplinary Meeting(Monthly)",              key: "multidisciplinary_meeting",       description: "Percentage of multidisciplinary meeting done.(4 in a month)"    },

];

const DocsCompliance = () => {
    const dispatch = useDispatch();
    const docsCompliance = useSelector((state) => state.MIReporting.docsCompliance);
    const loading = useSelector((state) => state.MIReporting.loading);
    const error = useSelector((state) => state.MIReporting.error);
    const centerAccess = useSelector((state) => state.User?.centerAccess || [], shallowEqual);

    const [selectedCenter, setSelectedCenter] = useState("Total");
    const [compliance, setCompliance] = useState(true);
    const [selectedMetric, setSelectedMetric] = useState(METRICS[0].key);
    const [chartMetric, setChartMetric] = useState("ALL");
    const [csvData, setCsvData] = useState([]);
    const [csvLoading, setCsvLoading] = useState(false);
    const csvRef = useRef();
    const data = useMemo(() => docsCompliance?.data || [], [docsCompliance]);

    useEffect(() => {
        dispatch(fetchDocsCompliance({ centerAccess }));
    }, [dispatch, centerAccess]);

    const months = useMemo(() => {
        const result = [];
        const now = new Date();
        for (let i = 0; i < 9; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, "0");
            result.push(`${y}-${m}`);
        }
        return result;
    }, []);

    const formatMonth = (m) => {
        const [year, month] = m.split("-");
        const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        return `${names[parseInt(month) - 1]} ${year}`;
    };

    const centerOptions = useMemo(() => {
        const names = new Set();
        data.forEach((item) => {
            (item.rows || []).forEach((row) => {
                if (row.center_name) names.add(row.center_name);
            });
        });
        return [
            { value: "Total", label: "All Centers" },
            ...[...names]
                .filter((n) => n !== "Total")
                .sort((a, b) => a.localeCompare(b))
                .map((n) => ({ value: n, label: n })),
        ];
    }, [data]);

    const getMonthData = (month) => {
        const rows = data.find((d) => d.month === month)?.rows || [];

        if (selectedCenter === "Total") {
            const aggregated = {};
            rows.forEach((row) => {
                METRICS.forEach(({ key }) => {
                    const entry = row[key] || {};
                    if (!aggregated[key]) aggregated[key] = { result_count: 0, should_be_count: 0 };
                    aggregated[key].result_count += entry.result_count ?? 0;
                    aggregated[key].should_be_count += entry.should_be_count ?? 0;
                });
            });
            return aggregated;
        }

        return rows.find((r) => r.center_name === selectedCenter) || {};
    };

    const getCellValue = (metricKey, month) => {
        const monthData = getMonthData(month);

        const entry = monthData[metricKey] || {};
        const actual = entry.result_count ?? null;
        const shouldBe = entry.should_be_count ?? null;
        if (actual == null) return "";
        if (compliance) {
            if (shouldBe == null || shouldBe === 0) return "";
            return `${Math.round((actual / shouldBe) * 100)}%`;
        }
        return actual;
    };

    const getCellNumericValue = (metricKey, month) => {
        const monthData = getMonthData(month);

        const entry = monthData[metricKey] || {};
        const actual = entry.result_count ?? null;
        const shouldBe = entry.should_be_count ?? null;
        if (actual == null) return 0;
        if (compliance) {
            if (!shouldBe) return 0;
            return Math.round((actual / shouldBe) * 100);
        }
        return actual;
    };

    const prepareCsvData = () => {
        setCsvLoading(true);
        const headers = ["Metric", ...months.map(formatMonth)];
        const rows = METRICS.map(({ label, key }) => [
            label,
            ...months.map((month) => getCellValue(key, formatMonth(month))),
        ]);
        setCsvData([headers, ...rows]);
        setTimeout(() => {
            csvRef.current.link.click();
            setCsvLoading(false);
        }, 100);
    };

    const chartData = useMemo(() => {
        return months
            .slice()
            .reverse()
            .map((month) => {
                const row = { month: formatMonth(month) };
                METRICS.forEach(({ label, key }) => {
                    row[label] = getCellNumericValue(key,formatMonth(month));
                });
                return row;
            });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [months, data, selectedCenter, compliance]);

    const metricOptions = METRICS.map((m) => ({ value: m.key, label: m.label }));
    const chartMetricOptions = [{ value: "ALL", label: "All Metrics" }, ...metricOptions];

const getCenterCellValue = (row, metricKey) => {
        const entry = row[metricKey] || {};
        const actual = entry.result_count ?? null;
        const shouldBe = entry.should_be_count ?? null;
        if (actual == null) return "";
        if (compliance) {
            if (shouldBe == null || shouldBe === 0) return "";
            return `${Math.round((actual / shouldBe) * 100)}%`;
        }
        return actual;
    };

    const centerNames = useMemo(() => {
        const names = new Set();
        data.forEach((item) => {
            (item.rows || []).forEach((row) => {
                if (row.center_name) names.add(row.center_name);
            });
        });
        return [...names].sort((a, b) => a.localeCompare(b));
    }, [data]);

    const getCenterMonthValue = (centerName, month) => {
        const rows = data.find((d) => d.month === month)?.rows || [];
        const row = rows.find((r) => r.center_name === centerName);
        if (!row) return "";
        return getCenterCellValue(row, selectedMetric);
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

    document.title = "Docs Compliance";

    return (
        <div className="mt-4 mt-sm-0" style={{ flex: 1, width: "100%", maxWidth: "100%", minWidth: 0 }}>
            <div className="p-3 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                    <i className="bx bx-bar-chart-alt-2 fs-1 me-3"></i>
                    <h6 className="text-truncate mb-0 fs-18">Docs Compliance</h6>
                </div>
                <div>
                    <Button
                        color="info"
                        onClick={prepareCsvData}
                        disabled={csvLoading || loading || !data.length}
                        className="w-auto"
                    >
                        {csvLoading ? "Preparing CSV..." : "Export CSV"}
                    </Button>
                    <CSVLink
                        data={csvData || []}
                        filename={`docs-compliance-${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-")}.csv`}
                        className="d-none"
                        ref={csvRef}
                    />
                </div>
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
                        <Select
                            value={compliance ? { value: true, label: "Percentage" } : { value: false, label: "Number" }}
                            onChange={(opt) => setCompliance(opt.value)}
                            options={[
                                { value: true, label: "Percentage" },
                                { value: false, label: "Number" },
                            ]}
                            styles={{ container: (b) => ({ ...b, minWidth: 130 }) }}
                        />
                    </Col>
                </Row>

                <Row className="g-3 mx-n3">
                    <Col lg={6}>
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
                                    <div style={{ overflowX: "auto" }}>
                                        <Table
                                            className="mb-0"
                                            style={{ borderCollapse: "collapse", fontSize: "0.62rem", width: "100%", tableLayout: "fixed" }}
                                        >
                                            <thead>
                                                <tr>
                                                    <th className="text-center fw-bold px-1 py-1" style={{ ...headerStyle, width: "18%" }}>
                                                        Data
                                                    </th>
                                                    {months.map((month) => (
                                                        <th key={month} className="text-center fw-bold px-1 py-1" style={headerStyle}>
                                                            {formatMonth(month)}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {METRICS.map(({ label, key, description }, idx) => (
                                                    <tr key={key}>
                                                        <td
                                                            className="px-1 py-1 fw-semibold"
                                                            style={{ ...cellStyle(idx), whiteSpace: "normal", wordBreak: "break-word" }}
                                                        >
                                                            <span className="d-inline-flex align-items-center gap-1">
                                                                {label}
                                                                {description && (
                                                                    <>
                                                                        <i
                                                                            id={`docs-metric-info-${key}`}
                                                                            className="bx bx-info-circle text-muted"
                                                                            style={{ cursor: "pointer", fontSize: "0.85rem" }}
                                                                        ></i>
                                                                        <UncontrolledTooltip
                                                                            target={`docs-metric-info-${key}`}
                                                                            placement="right"
                                                                            trigger="legacy"
                                                                        >
                                                                            {description}
                                                                        </UncontrolledTooltip>
                                                                    </>
                                                                )}
                                                            </span>
                                                        </td>
                                                        {months.map((month) => (
                                                            <td key={month} className="text-center px-1 py-1" style={cellStyle(idx)}>
                                                                {getCellValue(key, formatMonth(month))}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </Col>

                    <Col lg={6}>
                        <Card className="shadow-sm h-100" style={{ border: "1px solid #cfd8e3", borderRadius: 10 }}>
                            <CardBody>
                                <Select
                                    value={chartMetricOptions.find((o) => o.value === chartMetric) || chartMetricOptions[0]}
                                    onChange={(opt) => setChartMetric(opt.value)}
                                    options={chartMetricOptions}
                                    placeholder="Data..."
                                    styles={{ container: (b) => ({ ...b, minWidth: 200, marginBottom: 12 }) }}
                                />
                                <h6 className="mb-3">
                                    {chartMetric !== "ALL" && `${chartMetricOptions.find((o) => o.value === chartMetric)?.label} - `}
                                    {compliance ? "Compliance % Trend" : "Count Trend"}
                                </h6>
                                {!loading && !error && (
                                    <div style={{ width: "100%", height: 420 }}>
                                        <ResponsiveContainer>
                                            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                                <YAxis tick={{ fontSize: 11 }} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: "#000", opacity: 1, color: "#fff" }}
                                                    itemStyle={{ color: "#fff" }}
                                                    labelStyle={{ color: "#fff" }}
                                                    formatter={(value) => (compliance ? `${value}%` : value)}
                                                />
                                                <Legend wrapperStyle={{ fontSize: 11 }} />
                                                {METRICS.filter(({ key }) => chartMetric === "ALL" || key === chartMetric).map(({ label }, idx) => (
                                                    <Line
                                                        key={label}
                                                        type="monotone"
                                                        dataKey={label}
                                                        stroke={COLORS[idx % COLORS.length]}
                                                        strokeWidth={2}
                                                        dot={{ r: 2 }}
                                                    />
                                                ))}
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                {/* Center breakdown table */}
                <Row className="g-2 align-items-center mb-3 mt-4">
                    <Col xs="auto">
                        <Select
                            value={metricOptions.find((o) => o.value === selectedMetric) || metricOptions[0]}
                            onChange={(opt) => setSelectedMetric(opt.value)}
                            options={metricOptions}
                            placeholder="Select data..."
                            styles={{ container: (b) => ({ ...b, minWidth: 200 }) }}
                        />
                    </Col>
                </Row>

                <Row className="g-3 mx-n3">
                    <Col lg={6}>
                        <Card className="shadow-sm" style={{ border: "1px solid #cfd8e3", borderRadius: 10 }}>
                            <CardBody className="p-0">
                                {!loading && !error && (
                                    <div style={{ overflowX: "auto" }}>
                                        <Table
                                            className="mb-0"
                                            style={{ borderCollapse: "collapse", fontSize: "0.62rem", width: "100%", tableLayout: "fixed" }}
                                        >
                                            <thead>
                                                <tr>
                                                    <th className="text-center fw-bold px-1 py-1" style={{ ...headerStyle, width: "18%" }}>
                                                        Center Name
                                                    </th>
                                                    {months.map((month) => (
                                                        <th key={month} className="text-center fw-bold px-1 py-1" style={headerStyle}>
                                                            {formatMonth(month)}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {centerNames.map((name, idx) => (
                                                    <tr key={name}>
                                                        <td className="px-1 py-1 fw-semibold" style={{ ...cellStyle(idx), whiteSpace: "normal", wordBreak: "break-word" }}>
                                                            {name}
                                                        </td>
                                                        {months.map((month) => (
                                                            <td key={month} className="text-center px-1 py-1" style={cellStyle(idx)}>
                                                                {getCenterMonthValue(name, formatMonth(month))}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                {/* Metric definitions */}
                <Row className="g-3 mx-n3 mt-4">
                    <Col lg={12}>
                        <Card className="shadow-sm" style={{ border: "1px solid #cfd8e3", borderRadius: 10 }}>
                            <CardBody className="p-0">
                                <h6 className="px-3 pt-3 mb-2">Metric Definitions</h6>
                                <div style={{ overflowX: "auto" }}>
                                    <Table className="mb-0" style={{ borderCollapse: "collapse", fontSize: "0.72rem", width: "100%" }}>
                                        <thead>
                                            <tr>
                                                <th className="text-start fw-bold px-2 py-1" style={{ ...headerStyle, width: "22%" }}>
                                                    Metric
                                                </th>
                                                <th className="text-start fw-bold px-2 py-1" style={headerStyle}>
                                                    Description
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {METRICS.map(({ label, key, description }, idx) => (
                                                <tr key={key}>
                                                    <td className="px-2 py-1 fw-semibold" style={cellStyle(idx)}>{label}</td>
                                                    <td className="px-2 py-1" style={{ ...cellStyle(idx), whiteSpace: "normal", wordBreak: "break-word" }}>
                                                        {description}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default DocsCompliance;