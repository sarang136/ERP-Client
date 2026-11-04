import { useEffect, useState } from 'react'
import { Button, CardBody, Input, Spinner, Row, Col, Progress } from 'reactstrap';
import { useMediaQuery } from '../../../Components/Hooks/useMediaQuery';
import { useAuthError } from '../../../Components/Hooks/useAuthError';
import Select from "react-select";
import { useDispatch, useSelector } from 'react-redux';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { Calendar, CheckCheck, RotateCcw, XCircle } from 'lucide-react';
import Flatpickr from "react-flatpickr";
import monthSelectPlugin from "flatpickr/dist/plugins/monthSelect";
import "flatpickr/dist/themes/material_blue.css";
import "flatpickr/dist/plugins/monthSelect/style.css";
import { toast } from 'react-toastify'; 
import { actionPayroll, editPayrollRemarks, fetchPayrolls, removePayrollRecords } from '../../../store/features/HR/hrSlice';
import DataTableComponent from '../../../Components/Common/DataTable';
import { usePermissions } from '../../../Components/Hooks/useRoles';
import { useCenterOptions } from '../../../Components/Hooks/useCenterOptions';
import { salaryColumns } from '../../HRMS/components/Table/Columns/salary';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { exportPayrollsXLSX, generatePayroll, getCompanies, getPayrollGenerationStatus, getPayrolls, payrollBulkAction } from '../../../helpers/backend_helper';
import { approvalStatusOptions, legends } from '../../../Components/constants/HR';
import ApproveModal from '../components/ApproveModal';
import RefreshButton from '../../../Components/Common/RefreshButton';

const PayrollLegend = () => {
    return (
        <Row className="g-3 align-items-center">
            {legends.map((item) => (
                <Col key={item.label} xs="auto" className="d-flex align-items-center gap-1">
                    <span
                        style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            backgroundColor: item.color,
                            display: "inline-block",
                        }}
                    />
                    <span className="small fw-medium">{item.label}</span>
                </Col>
            ))}
        </Row>
    );
};


const PayrollJobStatus = ({ job }) => {
    if (!job?.status) return null;

    const isRunning = job.status === "active" || job.status === "waiting";

    if (!isRunning) return null;

    const progress = Math.min(Math.max(job.progress ?? 0, 0), 100);

    return (
        <div className="mb-2">
            <Progress
                value={progress}
                striped
                animated
                color="primary"
                style={{ height: "6px", borderRadius: "4px" }}
            />
            <div className="d-flex justify-content-between mt-1">
                <span className="small text-muted">Generating payroll…</span>
                <span className="small fw-semibold text-muted">
                    {progress}%
                </span>
            </div>
        </div>
    );
};

const Salary = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const handleAuthError = useAuthError();
    const dispatch = useDispatch();
    const [selectedCenter, setSelectedCenter] = useState("ALL");
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [limit, setLimit] = useState(10);
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [approvalStatus, setApprovalStatus] = useState("PENDING");
    const [companyOptions, setCompanyOptions] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState("ALL");
    const [copyId, setCopyId] = useState(null);
    const [regenerateLoading, setRegenerateLoading] = useState(false);
    const [regenerationMeta, setRegenerationMeta] = useState({
        status: null,
        progress: 0,
        error: null,
    });
    const [modalLoading, setModalLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [remarks, setRemarks] = useState("");
    const [selectedPayrollId, setSelectedPayrollId] = useState("");
    const [actionType, setActionType] = useState("APPROVE");
    const [isBulk, setIsBulk] = useState(false);
    const [bulkPayrollIds, setBulkPayrollIds] = useState([]);
    const [note, setNote] = useState("");
    const [paymentType, setPaymentType] = useState("");
    const [eCode, setECode] = useState("");
    const [isExcelGenerating, setIsExcelGenerating] = useState(false);
    const [hasManuallyProcessedForMonth, setHasManuallyProcessedForMonth] = useState(false);

    const [searchParams, setSearchParams] = useSearchParams();
    const jobId = searchParams.get("jobId");

    const isMobile = useMediaQuery("(max-width: 1000px)");

    const microUser = localStorage.getItem("micrologin");
    const token = microUser ? JSON.parse(microUser).token : null;

    const { hasPermission, loading: permissionLoader } =
        usePermissions(token);

    const { centerAccess } = useSelector((state) => state.User);
    const { data, pagination, loading } = useSelector((state) => state.HR);
    const centerOptions = useCenterOptions();

    const hasUserPermission = hasPermission(
        "HR",
        "SALARY",
        "READ"
    );

    const hasEditPermission = hasPermission("HR", "SALARY", "WRITE") || hasPermission("HR", "SALARY", "DELETE");

    const selectedCenterOption =
        centerOptions.find((opt) => opt.value === selectedCenter) ||
        centerOptions[0];

    useEffect(() => {
        if (
            selectedCenter !== "ALL" &&
            !centerAccess?.includes(selectedCenter)
        ) {
            setSelectedCenter("ALL");
            setPage(1);
        }
    }, [selectedCenter, centerAccess]);

    useEffect(() => {
        const fetchCompanyOptions = async () => {
            try {
                const res = await getCompanies({ includeInactive: true });
                setCompanyOptions([
                    { label: "All Companies", value: "ALL" },
                    ...(res?.data || [])
                        .map((c) => ({ label: c.name, value: c._id }))
                        .sort((a, b) => (a.label || "").localeCompare(b.label || "")),
                ]);
            } catch (error) {
                if (!handleAuthError(error)) {
                    toast.error(error.message || "Failed to fetch companies");
                }
            }
        };

        fetchCompanyOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const selectedApprovalStatusOption = approvalStatusOptions.find(opt => opt.value === approvalStatus);
    const selectedCompanyOption =
        companyOptions.find((opt) => opt.value === selectedCompany) ||
        companyOptions[0];

    const centers =
        selectedCenter === "ALL"
            ? centerAccess
            : !centerAccess.length
                ? []
                : [selectedCenter];

    const fetchEmployeePayrolls = async () => {
        try {
            await dispatch(fetchPayrolls({
                page,
                limit,
                search,
                centers,
                startDate: startOfMonth(selectedMonth),
                endDate: endOfMonth(selectedMonth),
                ...(approvalStatus !== "ALL" && { approvalStatus }),
                ...debouncedSearch.trim() !== "" && { search: debouncedSearch },
                ...(selectedCompany !== "ALL" && { company: selectedCompany }),
            })).unwrap();
        } catch (error) {
            if (!handleAuthError(error)) {
                toast.error(
                    error.message || "Failed to fetch payrolls"
                );
            }
        }
    };

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);

        return () => clearTimeout(handler);
    }, [search]);

    useEffect(() => {
        if (!hasUserPermission) return;
        fetchEmployeePayrolls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        page,
        limit,
        selectedCenter,
        selectedMonth,
        approvalStatus,
        debouncedSearch,
        centerAccess,
        selectedCompany,
    ]);

    useEffect(() => {
        setPage(1);
    }, [
        selectedCenter,
        selectedMonth,
        approvalStatus,
        limit,
        debouncedSearch,
        selectedCompany,
    ]);

    useEffect(() => {
        if (!hasUserPermission || centers.length === 0) {
            setHasManuallyProcessedForMonth(false);
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const response = await getPayrolls({
                    page: 1,
                    limit: 1,
                    centers,
                    startDate: startOfMonth(selectedMonth),
                    endDate: endOfMonth(selectedMonth),
                    approvalStatus: "MANNUALLY_PROCESSED",
                });
                if (!cancelled) {
                    setHasManuallyProcessedForMonth((response?.pagination?.totalDocs || 0) > 0);
                }
            } catch (error) {
                if (!cancelled) setHasManuallyProcessedForMonth(false);
            }
        })();
        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedMonth, centerAccess, selectedCenter, hasUserPermission]);

    const handleRegeneratePayroll = async () => {
        setRegenerateLoading(true);
        try {
            const response = await generatePayroll({
                regenerate: true,
                centers,
                startDate: startOfMonth(selectedMonth),
                endDate: endOfMonth(selectedMonth),
                ...(selectedCompany !== "ALL" && { company: selectedCompany }),
                ...(debouncedSearch.trim() !== "" && { search: debouncedSearch }),
            });

            const jobId = response?.jobId;

            const params = new URLSearchParams(location.search);
            params.set("jobId", jobId);

            navigate(`${location.pathname}?${params.toString()}`, {
                replace: true,
            });
            toast.success("Regeneration triggerd successfully, please wait for sometime to populate the data");
        } catch (error) {
            if (!handleAuthError(error)) {
                toast.error("Failed to regenrate payrolls")
            }
        } finally {
            setRegenerateLoading(false);
        }
    }

    const handleUpdate = async (formData) => {
        setModalLoading(true);
        try {
            if (isBulk) {
                const res = await payrollBulkAction({
                    action: actionType === "APPROVE" ? "APPROVED" : "REJECTED",
                    centers: centers,
                    month: format(selectedMonth, "yyyy-MM-dd"),
                    note: formData.note
                });
                toast.success(res?.data?.message || `${actionType === "APPROVE" ? "Approved" : "Rejected"} successfully`);
                if (bulkPayrollIds.length) {
                    dispatch(removePayrollRecords(bulkPayrollIds));
                    setBulkPayrollIds([]);
                }
            } else if (actionType === "UPDATE_REMARKS") {
                const res = await dispatch(
                    editPayrollRemarks({ id: selectedPayrollId, remarks: formData.remarks })
                ).unwrap();
                toast.success(res?.message || "Remarks updated successfully");
            } else {
                const res = await dispatch(actionPayroll({
                    id: selectedPayrollId,
                    action: actionType === "APPROVE" ? "APPROVED" : "REJECTED",
                    note: formData.note
                })).unwrap();
                toast.success(res?.message || `${actionType === "APPROVE" ? "Approved" : "Rejected"} successfully`);
            }
        } catch (error) {
            if (!handleAuthError(error)) {
                toast.error(error?.message || "Operation failed");
            }
        } finally {
            setModalOpen(false);
            setModalLoading(false);
            setIsBulk(false);
        }
    }

    const handleExportXLSX = async () => {
        setIsExcelGenerating(true);
        try {
            const response = await exportPayrollsXLSX({
                search,
                centers,
                startDate: startOfMonth(selectedMonth),
                endDate: endOfMonth(selectedMonth),
                ...(approvalStatus !== "ALL" && { approvalStatus }),
                ...debouncedSearch.trim() !== "" && { search: debouncedSearch },
                ...(selectedCompany !== "ALL" && { company: selectedCompany }),
            });

            const blob = new Blob([response.data], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = url;
            link.download = `Salary-Master-Sheet-${format(selectedMonth, "MMMM-yyyy")}.xlsx`;
            document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(url);
        } catch (error) {
            if (!handleAuthError(error)) {
                toast.error(error.message || "Something went wrong while generating xlsx file");
            }
        } finally {
            setIsExcelGenerating(false);
        }
    }

    const handleCopy = async (text, id) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopyId(id);

            setTimeout(() => setCopyId(null), 1500);
        } catch (err) {
        }
    };

    const handleAction = async (ids, action, bulk = false) => {
        setIsBulk(bulk);
        setActionType(action);
        setNote("");
        if (!bulk && ids.length === 1) {
            setSelectedPayrollId(ids[0]);
            setBulkPayrollIds([]);
            const item = data.find(i => i._id === ids[0]);
            setRemarks(item?.remarks || "");
        } else {
            setSelectedPayrollId("");
            setBulkPayrollIds(ids);
            setRemarks("");
        }
        setModalOpen(true);
    };

    useEffect(() => {
        if (!jobId) return;

        const interval = setInterval(async () => {
            setRegenerateLoading(true);
            try {
                const response = await getPayrollGenerationStatus(jobId);
                const { status, progress, failedReason } = response;

                setRegenerationMeta({
                    status,
                    progress: progress ?? 0,
                    error: failedReason ?? null,
                });

                if (status === "completed" || status === "failed") {
                    clearInterval(interval);
                    const params = new URLSearchParams(searchParams);
                    params.delete("jobId");
                    setSearchParams(params, { replace: true });
                    if (status === "completed") {
                        toast.success("Payroll data regenerated successfully");
                        fetchEmployeePayrolls();
                    } else {
                        toast.error("payroll data regeneration failed");
                    }
                    setRegenerateLoading(false);
                }

            } catch (error) {
                if (!handleAuthError(error)) {
                    toast.error(error.message || "Something went wrong");
                }
                setRegenerateLoading(false)
            }
        }, 3000);

        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [jobId]);


    const columns = salaryColumns({
        searchText: debouncedSearch,
        onCopy: handleCopy,
        copyId,
        onOpen: (payroll) => {
            setSelectedPayrollId(payroll._id);
            setRemarks(payroll.remarks);
            setNote("");
            setIsBulk(false);
            setActionType("UPDATE_REMARKS");
            setModalOpen(true);
        },
        onApprove: (row) => handleAction([row._id], "APPROVE"),
        onReject: (row) => handleAction([row._id], "REJECT"),
        approvalStatusFilter: approvalStatus,
        hasEditPermission,
        hasManuallyProcessedForMonth
    });


    if (!permissionLoader && !hasUserPermission) {
        navigate("/unauthorized");
    }

    return (
        <>
            <CardBody
                className="p-3 bg-white"
                style={isMobile ? { width: "100%" } : { width: "78%" }}
            >
                <div className="text-center text-md-left mb-4">
                    <h1 className="display-6 fw-bold text-primary">SALARY</h1>
                </div>

                <div className="mb-3">
                    <div className="mb-3 d-none d-md-block">
                        {/* Desktop */}
                        <div className="d-flex gap-3 align-items-center mb-2">
                            <div style={{ width: "240px" }}>
                                <Select
                                    value={selectedCenterOption}
                                    onChange={(opt) => setSelectedCenter(opt.value)}
                                    options={centerOptions}
                                    classNamePrefix="react-select"
                                />
                            </div>

                            <div style={{ width: "210px" }}>
                                <Select
                                    value={selectedApprovalStatusOption}
                                    onChange={(opt) => setApprovalStatus(opt.value)}
                                    options={approvalStatusOptions}
                                    classNamePrefix="react-select"
                                />
                            </div>

                            <div style={{ width: "220px" }}>
                                <Select
                                    value={selectedCompanyOption}
                                    onChange={(opt) => setSelectedCompany(opt.value)}
                                    options={companyOptions}
                                    placeholder="Filter by Company"
                                    classNamePrefix="react-select"
                                />
                            </div>

                            <div style={{ minWidth: "260px" }}>
                                <Input
                                    type="text"
                                    placeholder="Search by name, ECode..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            <div style={{ minWidth: "180px" }}>
                                <div className="position-relative month-picker">
                                    <Calendar
                                        size={14}
                                        className="position-absolute calendar-icon"
                                    />

                                    <Flatpickr
                                        value={selectedMonth}
                                        // disabled={loading}
                                        options={{
                                            plugins: [
                                                monthSelectPlugin({
                                                    shorthand: false,
                                                    dateFormat: "Y-m",
                                                    altFormat: "F Y",
                                                }),
                                            ],
                                            altInput: true,
                                            disableMobile: true
                                        }}
                                        onChange={([date]) => setSelectedMonth(date)}
                                        className="form-control form-control-sm"
                                    />
                                </div>
                            </div>
                            <div style={{ minWidth: "220px" }}>
                                <PayrollJobStatus key={jobId || "idle"} job={regenerationMeta} />
                            </div>
                        </div>
                        <div className="d-flex justify-content-end gap-2">
                            <PayrollLegend />
                            <RefreshButton
                                loading={loading}
                                onRefresh={fetchEmployeePayrolls}
                            />
                            {hasEditPermission && !hasManuallyProcessedForMonth && (
                                <>
                                    <Button
                                        color="success"
                                        className="d-flex align-items-center gap-1 text-white"
                                        onClick={() => handleAction(data.map(i => i._id), "APPROVE", true)}
                                        disabled={loading || data.length === 0}
                                    >
                                        <CheckCheck size={16} />
                                        Approve All
                                    </Button>
                                    <Button
                                        color="danger"
                                        className="d-flex align-items-center gap-1 text-white"
                                        onClick={() => handleAction(data.map(i => i._id), "REJECT", true)}
                                        disabled={loading || data.length === 0}
                                    >
                                        <XCircle size={16} />
                                        Reject All
                                    </Button>
                                </>
                            )}
                            {
                                hasPermission("HR", "SALARY", "DELETE") && (
                                    <Button
                                        color="primary"
                                        className="d-flex align-items-center gap-1 text-white"
                                        onClick={handleRegeneratePayroll}
                                        disabled={regenerateLoading}
                                    >
                                        {regenerateLoading ? <Spinner size="sm" /> : <RotateCcw size={16} />}
                                        Regenerate
                                    </Button>
                                )
                            }
                            <Button
                                color="primary"
                                className="d-flex align-items-center gap-1 text-white"
                                onClick={handleExportXLSX}
                                disabled={regenerateLoading || isExcelGenerating}
                            >
                                {isExcelGenerating ? <Spinner size="sm" /> : <i className="ri-file-excel-2-line" />}
                                Export Excel
                            </Button>
                        </div>
                    </div>

                    {/* Mobile */}
                    <div className="mb-3 d-flex d-md-none flex-column gap-3">
                        <PayrollJobStatus key={jobId || "idle"} job={regenerationMeta} />
                        <Select
                            value={selectedCenterOption}
                            onChange={(opt) => setSelectedCenter(opt.value)}
                            options={centerOptions}
                            classNamePrefix="react-select"
                        />

                        <Select
                            value={selectedApprovalStatusOption}
                            onChange={(opt) => setApprovalStatus(opt.value)}
                            options={approvalStatusOptions}
                            classNamePrefix="react-select"
                        />

                        <Select
                            value={selectedCompanyOption}
                            onChange={(opt) => setSelectedCompany(opt.value)}
                            options={companyOptions}
                            placeholder="Filter by Company"
                            classNamePrefix="react-select"
                        />

                        <Input
                            type="text"
                            placeholder="Search by name, biometric ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <div className="position-relative month-picker">
                            <Calendar
                                size={14}
                                className="position-absolute calendar-icon"
                            />

                            <Flatpickr
                                value={selectedMonth}
                                // disabled={loading}
                                options={{
                                    plugins: [
                                        monthSelectPlugin({
                                            shorthand: false,
                                            dateFormat: "Y-m",
                                            altFormat: "F Y",
                                        }),
                                    ],
                                    altInput: true,
                                    disableMobile: true
                                }}
                                onChange={([date]) => setSelectedMonth(date)}
                                className="form-control form-control-sm"
                            />
                        </div>
                        <div className="d-flex justify-content-end gap-2">
                            <RefreshButton
                                loading={loading}
                                onRefresh={fetchEmployeePayrolls}
                            />

                            {hasEditPermission && !hasManuallyProcessedForMonth && (
                                <>
                                    <Button
                                        color="success"
                                        className="d-flex align-items-center gap-1 text-white"
                                        onClick={() => handleAction(data.map(i => i._id), "APPROVE", true)}
                                        disabled={loading || data.length === 0}
                                    >
                                        <CheckCheck size={16} />
                                        Approve All
                                    </Button>
                                    <Button
                                        color="danger"
                                        className="d-flex align-items-center gap-1 text-white"
                                        onClick={() => handleAction(data.map(i => i._id), "REJECT", true)}
                                        disabled={loading || data.length === 0}
                                    >
                                        <XCircle size={16} />
                                        Reject All
                                    </Button>
                                </>
                            )}
                            {hasPermission("HR", "SALARY", "DELETE") && (
                                <Button
                                    color="primary"
                                    className="d-flex align-items-center gap-1 text-white"
                                    onClick={handleRegeneratePayroll}
                                    disabled={regenerateLoading}
                                >
                                    {regenerateLoading ? <Spinner size="sm" /> : <RotateCcw size={16} />}
                                    Regenerate
                                </Button>
                            )}
                            <Button
                                color="primary"
                                className="d-flex align-items-center gap-1 text-white"
                                onClick={handleExportXLSX}
                                disabled={regenerateLoading || isExcelGenerating}
                            >
                                {isExcelGenerating ? <Spinner size="sm" /> : <i className="ri-file-excel-2-line" />}
                                Export Excel
                            </Button>
                        </div>
                        <PayrollLegend />
                    </div>
                    <DataTableComponent columns={columns}
                        data={data}
                        page={page}
                        setPage={setPage}
                        limit={limit}
                        setLimit={setLimit}
                        loading={loading || permissionLoader}
                        pagination={pagination} />
                </div>
                <ApproveModal
                    isOpen={modalOpen}
                    toggle={() => {
                        setModalOpen(!modalOpen);
                        if (modalOpen) {
                            setIsBulk(false);
                            setNote("");
                            setRemarks("");
                        }
                    }}
                    onSubmit={handleUpdate}
                    loading={modalLoading}
                    remarks={remarks}
                    setRemarks={setRemarks}
                    note={note}
                    setNote={setNote}
                    actionType={actionType}
                    setActionType={setActionType}
                    paymentType={paymentType}
                    setPaymentType={setPaymentType}
                    eCode={eCode}
                    setECode={setECode}
                    mode="SALARY"
                />
            </CardBody>
        </>
    )
}

export default Salary;
