import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { Card, CardBody, Table, Spinner, Alert, Button, Row, Col } from "reactstrap";
import { CSVLink } from "react-csv";
import { fetchDueAmount } from "../../../store/features/miReporting/miReportingSlice";
import Select from "react-select";

const PATIENT_TYPE_OPTIONS = [
  { value: "admitted", label: "Admitted" },
  { value: "discharged", label: "Discharged" },
];

const ADVANCE_FILTER_OPTIONS = [
  { value: "ALL", label: "All Advance Payments" },
  { value: "GT0", label: "Advance Payment > 0" },
  { value: "EQ0", label: "Advance Payment = 0" },
];

const DAYS_SINCE_ADVANCE_OPTIONS = [
  { value: "ALL", label: "All Days Since Last Advance" },
  { value: "60", label: "60+ Days" },
  { value: "45", label: "45+ Days" },
  { value: "30", label: "30+ Days" },
];

const DUE_AMOUNT_RANGE_OPTIONS = [
  { value: "ALL", label: "All Due Amounts" },
  { value: "ABOVE_1L", label: "Above 1 Lac" },
  { value: "ABOVE_50K", label: "Above 50K" },
  { value: "0_50K", label: "0 - 50K" },
];

const FIRST_INVOICE_RECOVERED_OPTIONS = [
  { value: "ALL", label: "First Invoice Recovered: All" },
  { value: "Yes", label: "First Invoice Recovered: Yes" },
  { value: "No", label: "First Invoice Recovered: No" },
];

const labels = [
  "Patient UID",
  "Name",
  "Admission Date",
  "Discharge Date",
  "Center",
  "Total Invoiced",
  "Total Advance",
  "Due Amount",
  "Last Advance Date",
  "Due Since",
  "Last Advance Amount",
];

const labelsMapping = {
  "Patient UID": "patient_uid",
  "Name": "name",
  "Admission Date": "admission_date",
  "Discharge Date": "discharge_date",
  "Center": "center_name",
  "Total Invoiced": "total_invoiced",
  "Total Advance": "total_advance", 
  "Due Amount": "due_amount",
  "Last Advance Date": "last_advance_payment_date",
  "Due Since": "days_since_due",
  "Last Advance Amount": "last_advance_amount",
};

const formatDate = (val) => {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d)) return val;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-");
};

const formatCurrency = (val) => {
  if (val === null || val === undefined || val === "") return "";
  return Number(val).toLocaleString("en-IN");
};

const DATE_FIELDS = new Set(["Admission Date", "Discharge Date", "Last Advance Date"]);
const CURRENCY_FIELDS = new Set(["Total Invoiced", "Total Advance", "Due Amount", "Last Advance Amount"]);
const DAYS_FIELDS = new Set(["Due Since"]);

const DueAmount = () => {
  const dispatch = useDispatch();
  const dueAmount = useSelector((state) => state.MIReporting.dueAmount);
  const loading = useSelector((state) => state.MIReporting.loading);
  const error = useSelector((state) => state.MIReporting.error);
  const centerAccess = useSelector((state) => state.User?.centerAccess || [], shallowEqual);

  const [selectedCenter, setSelectedCenter] = useState("ALL");
  const [selectedPatientType, setSelectedPatientType] = useState("admitted");
  const [selectedAdvanceFilter, setSelectedAdvanceFilter] = useState("ALL");
  const [selectedDaysSinceAdvance, setSelectedDaysSinceAdvance] = useState("ALL");
  const [selectedDueAmountRange, setSelectedDueAmountRange] = useState("ALL");
  const [selectedFirstInvoiceRecovered, setSelectedFirstInvoiceRecovered] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 100;
  const currentMonthLabel = new Date().toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  const [selectedMonth, setSelectedMonth] = useState({ value: currentMonthLabel, label: currentMonthLabel });
  const [csvData, setCsvData] = useState([]);
  const [csvLoading, setCsvLoading] = useState(false);
  const csvRef = useRef();

  useEffect(() => {
    dispatch(fetchDueAmount({
      centerAccess,
      patientType: selectedPatientType,
      month: selectedMonth.value !== "ALL" ? selectedMonth.value : undefined,
    }));
  }, [dispatch, centerAccess, selectedPatientType, selectedMonth]);

  const data = useMemo(() => dueAmount?.data || [], [dueAmount]);

  const monthOptions = useMemo(() => {
    const opts = [];
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), 1);
    const start = new Date(2020, 0, 1);
    for (let d = new Date(end); d >= start; d.setMonth(d.getMonth() - 1)) {
      const label = d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
      opts.push({ value: label, label });
    }
    return [{ value: "ALL", label: "All Months" }, ...opts];
  }, []);

 
    const centerOptions = useMemo(() => [
        { value: "ALL", label: "All Centers" },
        ...[...new Set(data.map((item) => item.center_name))].map((center) => ({
            value: center,
            label: center,
        })),
    ], [data]);

  const filteredData = useMemo(() => {
    setCurrentPage(1);
    return data
      .filter((item) => {
        if (selectedCenter !== "ALL" && item.center_name !== selectedCenter) return false;
        const totalAdvance = Number(item.total_advance ?? 0);
        if (selectedAdvanceFilter === "GT0" && !(totalAdvance > 0)) return false;
        if (selectedAdvanceFilter === "EQ0" && totalAdvance !== 0) return false;
        if (selectedDaysSinceAdvance !== "ALL" && !(Number(item.days_since_last_advance ?? 0) >= Number(selectedDaysSinceAdvance))) return false;
        const due = Number(item.due_amount ?? 0);
        if (selectedDueAmountRange === "ABOVE_1L" && !(due < -100000)) return false;
        if (selectedDueAmountRange === "ABOVE_50K" && !(due < -50000)) return false;
        if (selectedDueAmountRange === "0_50K" && !(due <= 0 && due >= -50000)) return false;
        if (selectedFirstInvoiceRecovered !== "ALL" && item.first_invoice_recovered !== selectedFirstInvoiceRecovered) return false;
        return true;
      })
      .sort((a, b) => Number(a.due_amount ?? 0) - Number(b.due_amount ?? 0));
  }, [data, selectedCenter, selectedAdvanceFilter, selectedDaysSinceAdvance, selectedDueAmountRange, selectedFirstInvoiceRecovered]);

  const negativeDueSum = useMemo(
    () => filteredData.reduce((sum, item) => {
      const due = Number(item.due_amount ?? 0);
      return due < 0 ? sum + due : sum;
    }, 0),
    [filteredData]
  );

  const totalInvoicedSum = useMemo(
    () => filteredData.reduce((sum, item) => sum + Number(item.total_invoiced ?? 0), 0),
    [filteredData]
  );

  const totalAdvanceSum = useMemo(
    () => filteredData.reduce((sum, item) => sum + Number(item.total_advance ?? 0), 0),
    [filteredData]
  );

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const pagedData = useMemo(
    () => filteredData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredData, currentPage]
  );

  const getCellValue = (item, label) => {
    const raw = item[labelsMapping[label]];
    if (DATE_FIELDS.has(label)) return formatDate(raw);
    if (CURRENCY_FIELDS.has(label)) return formatCurrency(raw);
    if (DAYS_FIELDS.has(label)) {
      if (raw === null || raw === undefined || raw === "") return "";
      if (typeof raw === "number" || !isNaN(Number(raw))) return `${raw} days`;
      return raw;
    }
    return raw ?? "";
  };

  const prepareCsvData = () => {
    setCsvLoading(true);
    const rows = filteredData.map((item) =>
      labels.map((label) => getCellValue(item, label))
    );
    setCsvData(rows);
    setTimeout(() => {
      csvRef.current.link.click();
      setCsvLoading(false);
    }, 100);
  };

  document.title = "Due Amount";

  return (
    <div
      className="w-100 mt-4 mt-sm-0"
      style={{ flex: 1, width: "100%", maxWidth: "100%", minWidth: 0 }}
    >
      <div className="row">
        <div className="col-12">
          <div className="px-3 py-1">
            <div className="row align-items-center">
              <div className="col-sm-6 col-8">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0 chat-user-img online user-own-img align-self-center me-3 ms-0">
                    <i className="bx bx-wallet-alt fs-1"></i>
                  </div>
                  <h6 className="text-truncate mb-0 fs-18">Due Amount</h6>
                </div>
              </div>
              <div className="col-sm-6 col-4">
                <div className="d-flex justify-content-end">
                  <Button
                    color="info"
                    onClick={prepareCsvData}
                    disabled={csvLoading || loading || !filteredData.length}
                    className="w-auto"
                  >
                    {csvLoading ? "Preparing CSV..." : "Export CSV"}
                  </Button>
                  <CSVLink
                    data={csvData || []}
                    filename={`due-amount-${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-")}.csv`}
                    headers={labels}
                    className="d-none"
                    ref={csvRef}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 p-lg-4">
            <Row className="g-2 align-items-center mb-2">
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
                  value={PATIENT_TYPE_OPTIONS.find((o) => o.value === selectedPatientType) || PATIENT_TYPE_OPTIONS[0]}
                  onChange={(opt) => setSelectedPatientType(opt.value)}
                  options={PATIENT_TYPE_OPTIONS}
                  placeholder="Patient Type..."
                />
              </Col>
              <Col md={2}>
                <Select
                  value={selectedMonth}
                  onChange={(opt) => setSelectedMonth(opt)}
                  options={monthOptions}
                  placeholder="Month..."
                />
              </Col>
              <Col md={2}>
                <Select
                  value={ADVANCE_FILTER_OPTIONS.find((o) => o.value === selectedAdvanceFilter) || ADVANCE_FILTER_OPTIONS[0]}
                  onChange={(opt) => setSelectedAdvanceFilter(opt.value)}
                  options={ADVANCE_FILTER_OPTIONS}
                  placeholder="Advance Payment..."
                />
              </Col>
              <Col md={2}>
                <Select
                  value={DAYS_SINCE_ADVANCE_OPTIONS.find((o) => o.value === selectedDaysSinceAdvance) || DAYS_SINCE_ADVANCE_OPTIONS[0]}
                  onChange={(opt) => setSelectedDaysSinceAdvance(opt.value)}
                  options={DAYS_SINCE_ADVANCE_OPTIONS}
                  placeholder="Days Since Last Advance..."
                />
              </Col>
              <Col md={2}>
                <Select
                  value={DUE_AMOUNT_RANGE_OPTIONS.find((o) => o.value === selectedDueAmountRange) || DUE_AMOUNT_RANGE_OPTIONS[0]}
                  onChange={(opt) => setSelectedDueAmountRange(opt.value)}
                  options={DUE_AMOUNT_RANGE_OPTIONS}
                  placeholder="Due Amount..."
                />
              </Col>
              <Col md={2}>
                <Select
                  value={FIRST_INVOICE_RECOVERED_OPTIONS.find((o) => o.value === selectedFirstInvoiceRecovered) || FIRST_INVOICE_RECOVERED_OPTIONS[0]}
                  onChange={(opt) => setSelectedFirstInvoiceRecovered(opt.value)}
                  options={FIRST_INVOICE_RECOVERED_OPTIONS}
                  placeholder="First Invoice Recovered..."
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
                  <div
                    className="shadow-sm bg-white"
                    style={{ borderRadius: 12, border: "1px solid #cfd8e3", overflow: "auto", maxHeight: "calc(100vh - 290px)" }}
                  >
                    <Table
                      className="mb-0 w-100"
                      style={{ borderCollapse: "separate", borderSpacing: 0, fontSize: "0.72rem" }}
                    >
                      <thead>
                        <tr>
                          {labels.map((label) => (
                            <th
                              key={label}
                              className="text-center fw-bold px-1 py-1"
                              style={{
                                border: "1px solid #cfd8e3",
                                background: "green",
                                color: "white",
                                whiteSpace: "nowrap",
                                position: "sticky",
                                top: 0,
                                zIndex: 2,
                              }}
                            >
                              {label}
                              {label === "Due Amount" && negativeDueSum < 0 && (
                                <div style={{ fontWeight: "normal", fontSize: "0.72rem", color: "#ffcdd2", marginTop: 2 }}>
                                  Total: {formatCurrency(negativeDueSum)}
                                </div>
                              )}
                              {label === "Total Invoiced" && (
                                <div style={{ fontWeight: "normal", fontSize: "0.72rem", color: "#c8e6c9", marginTop: 2 }}>
                                  Total: {formatCurrency(totalInvoicedSum)}
                                </div>
                              )}
                              {label === "Total Advance" && (
                                <div style={{ fontWeight: "normal", fontSize: "0.72rem", color: "#c8e6c9", marginTop: 2 }}>
                                  Total: {formatCurrency(totalAdvanceSum)}
                                </div>
                              )}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pagedData.length === 0 ? (
                          <tr>
                            <td colSpan={labels.length} className="text-center py-4 text-muted">
                              No data found
                            </td>
                          </tr>
                        ) : (
                          pagedData.map((item, idx) => {
                            const due = Number(item.due_amount);
                            return (
                              <tr key={item.patient_uid ?? idx}>
                                {labels.map((label) => {
                                  const isDue = label === "Due Amount";
                                  return (
                                    <td
                                      key={label}
                                      className="text-center px-1 py-1"
                                      style={{
                                        border: "1px solid #d6dde8",
                                        background: idx % 2 === 0 ? "#f8fafc" : "#fff",
                                        whiteSpace: "nowrap",
                                        color: isDue ? (due < 0 ? "#dc3545" : due > 0 ? "#198754" : "inherit") : "inherit",
                                        fontWeight: isDue ? 600 : "normal",
                                      }}
                                    >
                                      {(label === "Patient UID" || label === "Name")
                                        ? (
                                          <Link to={`/patient/${item.patient_mongo_id}`} className="text-dark" target="_blank" rel="noopener noreferrer">
                                            {getCellValue(item, label)}
                                          </Link>
                                        )
                                        : getCellValue(item, label)}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </Table>
                  </div>
                )}
              </CardBody>
            </Card>

            {totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center mt-3">
                <span className="text-muted" style={{ fontSize: "0.82rem" }}>
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredData.length)} of {filteredData.length}
                </span>
                <div className="d-flex gap-1">
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >«</button>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setCurrentPage((p) => p - 1)}
                    disabled={currentPage === 1}
                  >‹</button>
                  <span className="btn btn-sm btn-secondary disabled" style={{ minWidth: 80 }}>
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={currentPage === totalPages}
                  >›</button>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >»</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DueAmount;
