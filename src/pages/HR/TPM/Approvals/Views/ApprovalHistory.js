import { useDispatch, useSelector } from "react-redux";
import { useAuthError } from "../../../../../Components/Hooks/useAuthError";
import { useEffect, useState } from "react";
import { usePermissions } from "../../../../../Components/Hooks/useRoles";
import { useMediaQuery } from "../../../../../Components/Hooks/useMediaQuery";
import { useCenterOptions } from "../../../../../Components/Hooks/useCenterOptions";
import { fetchDesignations, fetchTPMs } from "../../../../../store/features/HR/hrSlice";
import { toast } from "react-toastify";
import { capitalizeWords } from "../../../../../utils/toCapitalize";
import { normalizeUnderscores } from "../../../../../utils/normalizeUnderscore";
import { format } from "date-fns";
import { Spinner, Input } from "reactstrap";
import DataTable from "react-data-table-component";
import PropTypes from "prop-types";
import Select from "react-select";
import { ExpandableText } from "../../../../../Components/Common/ExpandableText";
import { renderStatusBadge } from "../../../../../Components/Common/renderStatusBadge";
import RefreshButton from "../../../../../Components/Common/RefreshButton";
import { useSearchParams } from "react-router-dom";

const ApprovalHistory = ({ activeTab }) => {
    const dispatch = useDispatch();
    const user = useSelector((state) => state.User);
    const { data, pagination, loading, designations: designationOptions } = useSelector((state) => state.HR);
    const handleAuthError = useAuthError();
    const [searchParams, setSearchParams] = useSearchParams();
    const querySearch = searchParams.get("q") || "";
    const queryCenter = searchParams.get("center") || "ALL";
    const queryTpmId = searchParams.get("id") || "";
    const [search, setSearch] = useState(querySearch);
    const [debouncedSearch, setDebouncedSearch] = useState(querySearch);
    const [filters, setFilters] = useState({
        center: queryCenter,
        designation: null
    });
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const microUser = localStorage.getItem("micrologin");
    const token = microUser ? JSON.parse(microUser).token : null;

    const { hasPermission } = usePermissions(token);
    const hasUserPermission = hasPermission("HR", "THIRD_PARTY_MANPOWER_APPROVAL", "READ");

    const isMobile = useMediaQuery("(max-width: 1000px)");

    const centerOptions = useCenterOptions();

    const selectedCenterOption = centerOptions.find(
        opt => opt.value === filters.center
    ) || centerOptions[0];

    const selectedDesignationOption = designationOptions.find(
        (opt) => opt.value === filters.designation
    ) || null;

    useEffect(() => {
        if (
            filters.center !== "ALL" &&
            !user?.centerAccess?.includes(filters.center)
        ) {
            setFilters("ALL");
            setPage(1);
        }
    }, [filters.center, user?.centerAccess]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
            setSearchParams((prev) => {
                if (search.trim()) {
                    prev.set("q", search);
                } else {
                    prev.delete("q");
                    prev.delete("tab");
                    prev.delete("center");
                    prev.delete("id");
                }
                return prev;
            });
        }, 500);

        return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    useEffect(() => {
        const q = searchParams.get("q") || "";
        const c = searchParams.get("center") || "ALL";
        setSearch(q);
        setDebouncedSearch(q);
        setFilters(prev => ({ ...prev, center: c }));
        setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    useEffect(() => {
        const loadDesignations = async () => {
            try {
                dispatch(fetchDesignations({
                    status: ["PENDING", "APPROVED"]
                })).unwrap();
            } catch (error) {
                if (!handleAuthError(error)) {
                    toast.error("Something went wrong while getting the designations");
                }
            }
        };

        loadDesignations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchTPMHistory = async () => {
        try {
            const centers =
                filters.center === "ALL"
                    ? user?.centerAccess
                    : !user?.centerAccess.length ? [] : [filters.center];
            await dispatch(fetchTPMs({
                page,
                limit,
                centers,
                view: "HISTORY",
                ...filters.designation ? { designation: filters.designation } : {},
                ...search.trim() !== "" && { search: debouncedSearch },
                ...(queryTpmId !== "" && { tpmId: queryTpmId })
            })).unwrap();
        } catch (error) {
            if (!handleAuthError) {
                toast.error(error.message || "Failed to fetch TPM Requests")
            }
        }
    }

    useEffect(() => {
        if (activeTab === "HISTORY" && hasUserPermission) {
            fetchTPMHistory();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, limit, filters, user?.centerAccess, activeTab, debouncedSearch]);

    const columns = [
        {
            name: <div>ECode</div>,
            selector: (row) => row?.eCode || "",
            wrap: true,
        },
        {
            name: <div>Employee</div>,
            selector: (row) => capitalizeWords(row?.employeeName) || "",
            wrap: true,
            minWidth: "150px"
        },
        {
            name: "Designation",
            selector: (row) => capitalizeWords(row?.designation?.name
                ?.toLowerCase()
                .replace(/_/g, " ")),
            wrap: true,
            minWidth: "120px"
        },
        {
            name: "Position",
            selector: (row) => capitalizeWords(normalizeUnderscores(row?.position?.name) || "-"),
            wrap: true,
            minWidth: "120px"
        },
        {
            name: "Department",
            selector: (row) => capitalizeWords(normalizeUnderscores(row?.department?.name) || "-"),
            wrap: true,
            minWidth: "120px"
        },
        {
            name: <div>Center</div>,
            selector: row => capitalizeWords(row?.center?.title || "-"),
            wrap: true,
            minWidth: "120px"
        },
        {
            name: <div>Company</div>,
            selector: row => row?.company?.name || "-",
            wrap: true,
            minWidth: "120px"
        },
        {
            name: <div>Vendor</div>,
            selector: (row) => capitalizeWords(row?.vendor) || "",
            wrap: true,
            minWidth: "150px"
        },
        {
            name: <div>Employment Type</div>,
            selector: (row) => capitalizeWords(normalizeUnderscores(row?.newEmploymentType) || "-"),
            wrap: true,
            minWidth: "150px"
        },
        {
            name: <div>Start Date</div>,
            selector: row => {
                if (!row?.startDate) return "-";

                const date = new Date(row.startDate);
                if (isNaN(date)) return "-";

                return format(date, "dd-MM-yyyy");
            },
            wrap: true,
        },
        {
            name: <div>Contract Signed With Vendor</div>,
            cell: (row) => {
                const approval = row?.contractSignedWithVendor;
                return (
                    <div className="text-start">
                        <div className="">{approval?.approved ? "Yes" : "No"}</div>
                        {approval?.approvedBy && (
                            <div className="text-muted small">
                                <i>{capitalizeWords(approval.approvedBy)}</i>
                            </div>
                        )}
                    </div>
                );
            },
            wrap: true,
            minWidth: "160px"
        },
        {
            name: <div>Man power approveed by Management</div>,
            cell: (row) => {
                const approval = row?.manpowerApprovedByManagement;
                return (
                    <div className="text-start">
                        <div className="">{approval?.approved ? "Yes" : "No"}</div>
                        {approval?.approvedBy && (
                            <div className="text-muted small">
                                <i>{capitalizeWords(approval.approvedBy)}</i>
                            </div>
                        )}
                    </div>
                );
            },
            wrap: true,
            minWidth: "160px"
        },
        {
            name: <div>Filled By</div>,
            selector: row => (
                <div>
                    <div>{capitalizeWords(row?.filledBy?.name || "-")}</div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                        {row?.filledBy?.email || "-"}
                    </div>
                </div>
            ),
            wrap: true,
            minWidth: "200px",
        },
        {
            name: <div>Filled At</div>,
            selector: row => {
                if (!row?.filledAt) return "-";
                const date = new Date(row.filledAt);
                if (isNaN(date)) return "-";
                return format(date, "dd MMM yyyy, hh:mm a");
            },
            wrap: true,
            minWidth: "180px",
        },
        {
            name: <div>Acted By</div>,
            selector: row => (
                <div>
                    <div>{capitalizeWords(row?.actedBy?.name || "-")}</div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                        {row?.actedBy?.email || "-"}
                    </div>
                </div>
            ),
            wrap: true,
            minWidth: "200px",
        },
        {
            name: <div>Action Time</div>,
            selector: row => {
                const t = row?.actedAt;
                if (!t) return "-";
                const date = new Date(t);
                if (isNaN(date)) return "-";
                return format(date, "dd MMM yyyy, hh:mm a");
            },
            wrap: true,
            minWidth: "180px",
        },
        {
            name: <div>Note</div>,
            selector: row => <ExpandableText text={capitalizeWords(row?.note || "-")} />,
            wrap: true,
            minWidth: "180px",
        },
        {
            name: <div>Status</div>,
            selector: row => renderStatusBadge(row?.status) || "-",
            wrap: true,
            minWidth: "140px"
        }

    ];


    return (
        <>
            <div className="mb-3">
                {/*  DESKTOP VIEW */}
                <div className="d-flex flex-wrap gap-3 mb-3">
                    {/* Center */}
                    <div style={{ width: isMobile ? "100%" : "200px" }}>
                        <Select
                            options={centerOptions}
                            value={selectedCenterOption}
                            onChange={(opt) => {
                                setFilters(prev => ({
                                    ...prev,
                                    center: opt?.value || "ALL",
                                }));
                                setPage(1);
                            }}
                            placeholder="All Centers"
                        />
                    </div>

                    {/* Designation */}
                    <div style={{ width: isMobile ? "100%" : "250px" }}>
                        <Select
                            options={designationOptions}
                            value={selectedDesignationOption}
                            onChange={(opt) => {
                                setFilters(prev => ({
                                    ...prev,
                                    designation: opt ? opt.value : null,
                                }));
                                setPage(1);
                            }}
                            placeholder="Designation"
                            isClearable
                        />
                    </div>

                    {/* Search */}
                    <div style={{ width: isMobile ? "100%" : "250px" }}>
                        <Input
                            type="text"
                            className="form-control"
                            placeholder="Search by name, ecode..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="ms-auto">
                        <RefreshButton loading={loading} onRefresh={fetchTPMHistory} />
                    </div>
                </div>
            </div>
            <DataTable
                columns={columns}
                data={data}
                highlightOnHover
                pagination
                paginationServer
                paginationTotalRows={pagination?.totalDocs}
                paginationPerPage={limit}
                paginationDefaultPage={page}
                progressPending={loading}
                striped
                fixedHeader
                fixedHeaderScrollHeight="500px"
                dense={isMobile}
                responsive
                customStyles={{
                    table: {
                        style: {
                            minHeight: "450px",
                        },
                    },
                    headCells: {
                        style: {
                            backgroundColor: "#f8f9fa",
                            fontWeight: "600",
                            borderBottom: "2px solid #e9ecef",
                        },
                    },
                    rows: {
                        style: {
                            minHeight: "60px",
                            borderBottom: "1px solid #f1f1f1",
                        },
                    },
                }}
                progressComponent={
                    <div className="py-4 text-center">
                        <Spinner className="text-primary" />
                    </div>
                }
                onChangePage={(newPage) => setPage(newPage)}
                onChangeRowsPerPage={(newLimit) => setLimit(newLimit)}
            />
        </>
    )
}

ApprovalHistory.prototype = {
    activeTab: PropTypes.string
}

export default ApprovalHistory;
