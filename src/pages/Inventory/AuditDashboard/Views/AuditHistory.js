import { useEffect, useState } from "react";
import { Button, Input, Spinner } from "reactstrap";
import DataTable from "react-data-table-component";
import Header from "../../../Report/Components/Header";
import Select from "react-select";
import { endOfDay, format, startOfDay } from "date-fns";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { downloadAuditFailedMedicines, downloadAuditReport, getAuditDetails } from "../../../../helpers/backend_helper";
// import { appendAuditList, getAudits } from "../../../../store/features/pharmacy/pharmacySlice";
import { getAudits } from "../../../../store/features/pharmacy/pharmacySlice";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import PerfectScrollbar from "react-perfect-scrollbar";
import "react-perfect-scrollbar/dist/css/styles.css";
import { Menu, Trash, FileSpreadsheet } from "lucide-react";
import { useMediaQuery } from "../../../../Components/Hooks/useMediaQuery";
import AuditDeleteModal from "../../Components/AuditDeleteModal";
import CheckPermission from "../../../../Components/HOC/CheckPermission";
import { capitalizeWords } from "../../../../utils/toCapitalize";


const customStyles = {
    rows: { style: { minHeight: "38px" } },
    headCells: {
        style: {
            backgroundColor: "#f8f9fa",
            fontWeight: "600",
            fontSize: "12px",
            paddingTop: "6px",
            paddingBottom: "6px",
        },
    },
    cells: {
        style: {
            fontSize: "12px",
            paddingTop: "4px",
            paddingBottom: "4px",
        },
    },
};

const AuditHistory = ({ activeTab, hasUserPermission, roles }) => {
    const dispatch = useDispatch();
    const user = useSelector((state) => state.User);
    const centerList = useSelector((state) => state.Center.data);
    const { auditHistory, loading: auditListLoading } = useSelector(
        (state) => state.Pharmacy
    );
    const handleAuthError = useAuthError();

    const [tableLoading, setTableLoading] = useState(false);
    const [selectedAudit, setSelectedAudit] = useState(null);
    const [selectedAuditDetails, setSelectedAuditDetails] = useState(null);
    const [totalDocs, setTotalDocs] = useState(0);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [failedDownloading, setFailedDownloading] = useState(false);
    const [reportDownloading, setReportDownloading] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedCenter, setSelectedCenter] = useState("ALL");
    const [showSidebar, setShowSidebar] = useState(true);
    const isMobile = useMediaQuery("(max-width: 1000px)");

    const [reportDate, setReportDate] = useState({
        start: startOfDay(new Date()),
        end: endOfDay(new Date()),
    });

    useEffect(() => {
        setSelectedAudit(null);
        setSelectedAuditDetails(null);
    }, [selectedCenter, reportDate]);

    const centerOptions = [
        ...(user?.centerAccess?.length > 1
            ? [{ value: "ALL", label: "All Centers" }]
            : []),
        ...(centerList
            ?.filter((c) => user?.centerAccess?.includes(c._id))
            ?.map((c) => ({
                value: c._id,
                label: c.title,
            })) || []),
    ];

    const selectedCenterOption =
        centerOptions.find((o) => o.value === selectedCenter) ||
        centerOptions[0];


    const centers =
        selectedCenter === "ALL"
            ? user?.centerAccess
            : !user?.centerAccess.length ? [] : [selectedCenter];

    useEffect(() => {
        if (
            selectedCenter !== "ALL" &&
            !user?.centerAccess?.includes(selectedCenter)
        ) {
            setSelectedCenter("ALL");
            setPage(1);
        }
    }, [selectedCenter, user?.centerAccess]);

    const loadAudits = async (pageToLoad = 1) => {
        try {

            await dispatch(
                getAudits({
                    centers,
                    page: pageToLoad,
                    limit,
                    status: "COMPLETED",
                    startDate: reportDate.start.toISOString(),
                    endDate: reportDate.end.toISOString(),
                })
            ).unwrap();
        } catch (err) {
            if (!handleAuthError(err)) {
                toast.error("Failed to load audits");
            }
        }
    };

    useEffect(() => {
        if (activeTab === "HISTORY" && hasUserPermission) {
            loadAudits(1);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, hasUserPermission, selectedCenter, reportDate, limit, user?.centerAccess, dispatch]);

    const handlePageChange = async (newPage) => {
        await loadAudits(newPage);
    };

    const loadAuditDetails = async (audit, newPage = page, newLimit = limit, newSearch = search) => {
        try {
            setTableLoading(true);
            const res = await getAuditDetails({
                auditId: audit.auditId,
                page: newPage,
                limit: newLimit,
                search: newSearch,
            });

            setSelectedAuditDetails(res.data);
            setTotalDocs(res.pagination.totalDocs);
            setPage(res.pagination.page);
            setLimit(res.pagination.limit);
        } catch (err) {
            if (!handleAuthError(err)) {
                toast.error("Failed to load audit details");
            }
        } finally {
            setTableLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchTerm);
            if (selectedAudit) {
                loadAuditDetails(selectedAudit, 1, limit, searchTerm);
            }
        }, 500);

        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm]);

    const onAuditClick = (audit) => {
        setSelectedAudit(audit);
        loadAuditDetails(audit, 1, limit, search);
        if (isMobile) setShowSidebar(false);
    };

    const downloadAuditFailedMedicinesFile = async (auditId) => {
        if (!auditId) return;

        setFailedDownloading(true);

        try {
            const res = await downloadAuditFailedMedicines(auditId);

            const disposition = res.headers["content-disposition"];
            let filename = `Failed_Medicines_${auditId}.xlsx`;

            if (disposition) {
                const match = disposition.match(/filename="?([^"]+)"?/);
                if (match?.[1]) filename = match[1];
            }

            const blob = new Blob([res.data], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            toast.error("Failed to download failed medicines file");
        } finally {
            setFailedDownloading(false);
        }
    };

    const downloadAuditReportFile = async (auditId) => {
        if (!auditId) return;

        setReportDownloading(true);

        try {
            const res = await downloadAuditReport({ auditId, search });

            const disposition = res.headers["content-disposition"];
            let filename = `AuditReport_${auditId}.xlsx`;

            if (disposition) {
                const match = disposition.match(/filename="?([^"]+)"?/);
                if (match?.[1]) filename = match[1];
            }

            const blob = new Blob([res.data], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            toast.error("Failed to export audit report");
        } finally {
            setReportDownloading(false);
        }
    };

    const safe = (v) => (v == null || v === "" ? "-" : v);

    const columns = [
        { name: <div>Pharmacy ID</div>, selector: (r) => safe(r.pharmacyId), width: "120px", center: true, wrap: true },
        { name: <div>Medicine ID</div>, selector: (r) => safe(r.medicineId), width: "120px", center: true, wrap: true },
        { name: <div>Code</div>, selector: (r) => safe(r.code), width: "200px", center: true, wrap: true },
        { name: <div>Name</div>, selector: (r) => safe(r.medicineName), width: "200px", center: true, wrap: true },
        { name: <div>Strength</div>, selector: (r) => safe(r.strength), width: "100px", center: true, wrap: true },
        { name: <div>Base Unit</div>, selector: (r) => safe(r.baseUnit), width: "100px", center: true, wrap: true },
        { name: <div>Batch</div>, selector: (r) => safe(r.batch), width: "130px", center: true, wrap: true },
        { name: <div>Expiry</div>, selector: (r) => safe(r.expiry), width: "120px", center: true, wrap: true },
        { name: <div>MRP</div>, selector: (r) => safe(r.mrp), width: "80px", center: true, wrap: true },
        { name: <div>Old Stock</div>, selector: (r) => safe(r.oldStock), width: "70px", center: true, wrap: true },
        { name: <div>New Stock</div>, selector: (r) => safe(r.newStock), width: "70px", center: true, wrap: true },
        {
            name: <div>Variance</div>,
            cell: (row) => {
                const oldVal = row.oldStock ?? 0;
                const newVal = row.newStock ?? 0;
                const v = Math.abs(oldVal - newVal);

                return (
                    <span
                        className={`fw-semibold ${oldVal > newVal
                            ? "text-danger"
                            : oldVal < newVal
                                ? "text-success"
                                : "text-dark"
                            }`}
                    >
                        {v}
                    </span>
                );
            },
            width: "80px",
            center: true,
            wrap: true,
        },
    ];

    const auditListData = auditHistory?.data || [];

    return (
        <div
            className="d-flex flex-column"
            style={{
                height: "100vh",
                overflow: "hidden",
            }}
        >
            <div
                className={`mb-3 d-flex ${isMobile ? "flex-column gap-2" : "flex-row gap-3"
                    }`}
                style={{ width: "100%" }}
            >
                <div style={{ width: isMobile ? "100%" : "200px" }}>
                    <Select
                        value={selectedCenterOption}
                        onChange={(opt) => setSelectedCenter(opt.value)}
                        options={centerOptions}
                        placeholder="All Centers"
                        className="react-select-container"
                        classNamePrefix="react-select"
                    />
                </div>

                <div
                    className={
                        isMobile
                            ? "d-flex justify-content-between align-items-center gap-2"
                            : "d-flex align-items-center"
                    }
                    style={{ width: "100%" }}
                >
                    <Header
                        reportDate={reportDate}
                        setReportDate={(val) => setReportDate(val)}
                    />

                    {isMobile && (
                        <Button
                            size="sm"
                            color="light"
                            className="border rounded mt-4 d-flex align-items-center justify-content-center p-2"
                            onClick={() => setShowSidebar(!showSidebar)}
                            style={{ width: "40px", height: "36px" }}
                        >
                            <Menu size={16} className="text-dark" />
                        </Button>
                    )}
                </div>
            </div>

            <div
                className={`flex-grow-1 overflow-hidden ${isMobile ? "d-block" : "d-flex"
                    }`}
            >
                {showSidebar && (
                    <div
                        className="border-end d-flex flex-column bg-white shadow-sm"
                        style={{
                            width: isMobile ? "100%" : "240px",
                            minWidth: isMobile ? "100%" : "240px",
                            maxWidth: isMobile ? "100%" : "240px",
                            height: isMobile ? "40vh" : "100%",
                            overflow: "hidden",
                            borderRadius: "8px",
                            marginBottom: isMobile ? "10px" : 0,
                        }}
                    >
                        <PerfectScrollbar
                            style={{ height: "100%" }}
                            options={{ suppressScrollX: true }}
                        >
                            {auditListLoading && auditListData.length === 0 ? (
                                <div className="text-center py-4">
                                    <Spinner size="sm" />
                                </div>
                            ) : auditListData.length === 0 ? (
                                <div className="text-center text-muted py-4">
                                    No completed audits
                                </div>
                            ) : (
                                auditListData.map((audit) => {
                                    const active =
                                        selectedAudit?.auditId === audit.auditId;

                                    return (
                                        <div
                                            key={audit.auditId}
                                            onClick={() => onAuditClick(audit)}
                                            className={`p-2 px-3 mb-1 rounded-2 ${active ? "bg-primary text-white" : "bg-light"
                                                }`}
                                            style={{
                                                cursor: "pointer",
                                                fontSize: "13px",
                                                transition: "0.15s",
                                            }}
                                        >
                                            <div className="fw-semibold text-truncate">
                                                {audit.center} ({audit.auditId})
                                            </div>
                                            <small
                                                className={
                                                    active ? "text-light" : "text-muted"
                                                }
                                            >
                                                {new Date(audit.auditDate).toLocaleDateString()}
                                            </small>
                                        </div>
                                    );
                                })
                            )}

                            {(auditHistory?.pagination?.hasPrevPage || auditHistory?.pagination?.hasNextPage) && (
                                <div className="d-flex justify-content-between align-items-center p-2 border-top">
                                    <Button
                                        size="sm"
                                        disabled={!auditHistory?.pagination?.hasPrevPage || auditListLoading}
                                        onClick={() => handlePageChange(auditHistory.pagination.page - 1)}
                                    >
                                        Prev
                                    </Button>

                                    <span style={{ fontSize: "12px" }}>
                                        Page {auditHistory?.pagination?.page} of {auditHistory?.pagination?.totalPages}
                                    </span>

                                    <Button
                                        size="sm"
                                        disabled={!auditHistory?.pagination?.hasNextPage || auditListLoading}
                                        onClick={() => handlePageChange(auditHistory.pagination.page + 1)}
                                    >
                                        Next
                                    </Button>
                                </div>
                            )}

                            {auditListLoading && auditListData.length > 0 && (
                                <div className="text-center py-2">
                                    <Spinner size="sm" className="text-primary" />
                                </div>
                            )}
                        </PerfectScrollbar>

                    </div>
                )}

                <div
                    className={`d-flex flex-column px-3 ${isMobile ? "" : "flex-grow-1"
                        }`}
                    style={{
                        overflow: "hidden",
                        width: isMobile ? "100%" : "auto",
                    }}
                >
                    {!selectedAudit ? (
                        <div className="text-center py-5 text-muted border rounded bg-light mt-3">
                            <p className="fw-semibold mb-0">Select an audit to view details</p>
                        </div>
                    ) : (
                        <>
                            <div
                                className={`mb-3 mt-2 d-flex ${isMobile ? "flex-column" : "justify-content-between align-items-center"
                                    }`}
                            >
                                <div style={{ minHeight: "55px" }}>
                                    {tableLoading ? (
                                        <></>
                                    ) : (
                                        <h6
                                            className="fw-bold mb-2"
                                            style={{
                                                fontSize: isMobile ? "14px" : "16px",
                                                lineHeight: "1.3",
                                            }}
                                        >
                                            {selectedAuditDetails?.center?.title} —{" "}
                                            {format(
                                                new Date(selectedAuditDetails?.auditDate),
                                                "dd MMM yyyy, hh:mm a"
                                            )}{" "}
                                            ({selectedAuditDetails?.auditId})
                                            <br />
                                            <span
                                                style={{
                                                    fontWeight: "normal",
                                                    fontSize: isMobile ? "12px" : "14px",
                                                }}
                                            >
                                                By {capitalizeWords(selectedAuditDetails?.createdBy?.name)}
                                            </span>
                                        </h6>
                                    )}
                                </div>

                                <div
                                    className={`d-flex gap-2 ${isMobile ? "mt-1 flex-wrap" : ""}`}
                                    style={{
                                        width: isMobile ? "100%" : "auto",
                                        justifyContent: isMobile ? "flex-start" : "flex-end",
                                    }}
                                >
                                    {tableLoading ? (
                                        <></>
                                    ) : (
                                        <>
                                            {selectedAuditDetails?.failedMedicinesCount > 0 && (
                                                <Button
                                                    size="sm"
                                                    color="primary"
                                                    className="text-white"
                                                    style={{
                                                        width: isMobile ? "100%" : "auto",
                                                    }}
                                                    onClick={() =>
                                                        downloadAuditFailedMedicinesFile(
                                                            selectedAuditDetails.auditId
                                                        )
                                                    }
                                                >
                                                    {failedDownloading ? (
                                                        <Spinner size="sm" />
                                                    ) : (
                                                        `Download Failed Medicines (${selectedAuditDetails?.failedMedicinesCount})`
                                                    )}
                                                </Button>
                                            )}

                                            <Button
                                                size="sm"
                                                color="success"
                                                className="text-white d-flex align-items-center justify-content-center gap-1"
                                                style={{
                                                    width: isMobile ? "100%" : "auto",
                                                }}
                                                onClick={() =>
                                                    downloadAuditReportFile(
                                                        selectedAuditDetails?.auditId
                                                    )
                                                }
                                            >
                                                {reportDownloading ? (
                                                    <Spinner size="sm" />
                                                ) : (
                                                    <>
                                                        <FileSpreadsheet size={16} />
                                                        Export Excel
                                                    </>
                                                )}
                                            </Button>

                                            <Button
                                                size="sm"
                                                color="secondary"
                                                style={{
                                                    width: isMobile ? "100%" : "auto",
                                                }}
                                                onClick={() => setSelectedAudit(null)}
                                            >
                                                Close
                                            </Button>

                                            <CheckPermission
                                                accessRolePermission={roles?.permissions}
                                                subAccess={"AUDIT"}
                                                permission={"DELETE"}
                                            >
                                                <Button
                                                    size="sm"
                                                    color="danger"
                                                    style={{
                                                        width: isMobile ? "100%" : "auto",
                                                    }}
                                                    onClick={() => setDeleteModalOpen(true)}
                                                >
                                                    <Trash className="text-white" size={"16"} />
                                                </Button>
                                            </CheckPermission>
                                        </>
                                    )}
                                </div>
                            </div>

                            <Input
                                type="text"
                                placeholder="Search medicine..."
                                className="mb-3"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />

                            <div
                                className="shadow-sm border rounded flex-grow-1 d-flex"
                                style={{ overflow: "hidden" }}
                            >
                                <div style={{ flexGrow: 1, overflow: "auto" }}>
                                    <DataTable
                                        columns={columns}
                                        data={selectedAuditDetails?.items || []}
                                        customStyles={customStyles}
                                        highlightOnHover
                                        pagination
                                        paginationServer
                                        paginationTotalRows={totalDocs}
                                        paginationPerPage={limit}
                                        paginationDefaultPage={page}
                                        progressPending={tableLoading}
                                        progressComponent={
                                            <div className="py-4 text-center">
                                                <Spinner className="text-primary" />
                                            </div>
                                        }
                                        onChangePage={(p) =>
                                            loadAuditDetails(selectedAudit, p, limit, search)
                                        }
                                        onChangeRowsPerPage={(newLimit) =>
                                            loadAuditDetails(selectedAudit, 1, newLimit, search)
                                        }
                                    />
                                </div>
                            </div>
                        </>
                    )}


                    <AuditDeleteModal
                        selectedAudit={selectedAudit}
                        setSelectedAudit={setSelectedAudit}
                        toggle={() =>
                            setDeleteModalOpen(!deleteModalOpen)
                        }
                        isOpen={deleteModalOpen}
                    />
                </div>
            </div>
        </div>
    );
};

export default AuditHistory;