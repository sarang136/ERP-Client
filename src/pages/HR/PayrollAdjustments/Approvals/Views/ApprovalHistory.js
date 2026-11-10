import { useDispatch, useSelector } from "react-redux";
import { useAuthError } from "../../../../../Components/Hooks/useAuthError";
import { useCenterOptions } from "../../../../../Components/Hooks/useCenterOptions";
import { useEffect, useState } from "react";
import { usePermissions } from "../../../../../Components/Hooks/useRoles";
import { formatEmployeeName } from "../../../../../utils/formatEmployeeName";
import { fetchPayrollAdjustments } from "../../../../../store/features/HR/hrSlice";
import { toast } from "react-toastify";
import { capitalizeWords } from "../../../../../utils/toCapitalize";
import { format } from "date-fns";
import { Input } from "reactstrap";
import PropTypes from "prop-types";
import Select from "react-select";
import { ExpandableText } from "../../../../../Components/Common/ExpandableText";
import { adjustmentTypeLabels } from "../../../../../Components/constants/payrollAdjustments";
import { renderStatusBadge } from "../../../../../Components/Common/renderStatusBadge";
import DataTableComponent from "../../../../../Components/Common/DataTable";
import PreviewFile from "../../../../../Components/Common/PreviewFile";
import RefreshButton from "../../../../../Components/Common/RefreshButton";
import { useSearchParams } from "react-router-dom";

const ApprovalHistory = ({ activeTab }) => {
    const dispatch = useDispatch();
    const user = useSelector((state) => state.User);
    const { data, pagination, loading } = useSelector((state) => state.HR);
    const handleAuthError = useAuthError();
    const [searchParams, setSearchParams] = useSearchParams();
    const querySearch = searchParams.get("q") || "";
    const queryCenter = searchParams.get("center") || "ALL";
    const queryAdjustmentId = searchParams.get("id") || "";
    const [search, setSearch] = useState(querySearch);
    const [debouncedSearch, setDebouncedSearch] = useState(querySearch);
    const [selectedCenter, setSelectedCenter] = useState(queryCenter);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewFile, setPreviewFile] = useState(null);

    const microUser = localStorage.getItem("micrologin");
    const token = microUser ? JSON.parse(microUser).token : null;

    const { hasPermission, roles } = usePermissions(token);
    const hasUserPermission = hasPermission("HR", "PAYROLL_ADJUSTMENTS_APPROVAL", "READ");

    const centerOptions = useCenterOptions();

    const selectedCenterOption = centerOptions.find(
        opt => opt.value === selectedCenter
    ) || centerOptions[0];

    useEffect(() => {
        if (
            selectedCenter !== "ALL" &&
            !user?.centerAccess?.includes(selectedCenter)
        ) {
            setSelectedCenter("ALL");
            setPage(1);
        }
    }, [selectedCenter, user?.centerAccess]);

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
        setSelectedCenter(c);
        setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);


    const fetchAdjustmentsHistory = async () => {
        try {
            const centers =
                selectedCenter === "ALL"
                    ? user?.centerAccess
                    : !user?.centerAccess.length ? [] : [selectedCenter];

            await dispatch(fetchPayrollAdjustments({
                page,
                limit,
                centers,
                view: "HISTORY",
                ...search.trim() !== "" && { search: debouncedSearch },
                ...(queryAdjustmentId !== "" && { adjustmentId: queryAdjustmentId })
            })).unwrap();
        } catch (error) {
            if (!handleAuthError(error)) {
                toast.error(error.message || "Failed to fetch payroll adjustment records");
            }
        }
    };

    useEffect(() => {
        if (activeTab === "HISTORY" && hasUserPermission) {
            fetchAdjustmentsHistory();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, limit, selectedCenter, debouncedSearch, user?.centerAccess, activeTab, roles]);

    const columns = [
        {
            name: <div>ECode</div>,
            selector: row => row?.employee?.eCode || "-",
            sortable: true,
        },
        {
            name: <div>Name</div>,
            selector: row =>
                formatEmployeeName(row?.employee?.name, row?.employee?.salutation)?.toUpperCase() || "-",
            wrap: true,
            minWidth: "160px",
        },
        {
            name: <div>Current Location</div>,
            selector: row => capitalizeWords(row?.center?.title) || "-",
            wrap: true,
            minWidth: "120px",
        },
        {
            name: <div>Type</div>,
            selector: row => adjustmentTypeLabels[row?.type] || "-",
            wrap: true,
            minWidth: "150px",
        },
        {
            name: <div>Mobile Number</div>,
            selector: row => row?.employee?.mobile || "-",
            wrap: true,
            minWidth: "140px"
        },
        {
            name: <div>Month</div>,
            selector: row => {
                if (row?.startMonth && row?.endMonth) {
                    const start = new Date(row.startMonth);
                    const end = new Date(row.endMonth);
                    if (isNaN(start) || isNaN(end)) return "-";
                    return `${format(start, "MMM yyyy")} - ${format(end, "MMM yyyy")}`;
                }
                if (!row?.date) return "-";
                const date = new Date(row.date);
                if (isNaN(date)) return "-";
                return format(date, "MMMM yyyy")
            },
            wrap: true,
        },
        {
            name: <div>Amount</div>,
            selector: row => typeof row?.amount === "number"
                ? `₹${row.amount.toLocaleString()}`
                : "-",
            wrap: true,
            minWidth: "140px"
        },
        {
            name: <div>Details</div>,
            selector: row => <ExpandableText text={capitalizeWords(row?.details) || "-"} />,
            wrap: true,
            minWidth: "220px"
        },
        {
            name: <div>Attachment</div>,
            selector: row => (
                <div className="d-flex flex-column align-items-start py-1">
                    {row?.files?.length ? (
                        row.files.map((file, idx) => (
                            <span
                                key={file.path || idx}
                                className="text-primary text-decoration-underline cursor-pointer"
                                title={file.originalName || file.name}
                                onClick={() => {
                                    setPreviewOpen(true);
                                    setPreviewFile(file);
                                }}
                            >
                                {`File ${idx + 1}`}
                            </span>
                        ))
                    ) : (
                        "-"
                    )}
                </div>
            ),
            wrap: true,
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
            selector: row => <ExpandableText text={capitalizeWords(row?.note) || "-"} />,
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

    const closePreview = () => {
        setPreviewOpen(false);
        setPreviewFile(null);
    };

    return (
        <>
            <div className="mb-3">
                <div className="d-none d-md-flex justify-content-between align-items-center">

                    <div className="d-flex gap-3 align-items-center">

                        <div style={{ width: "200px" }}>
                            <Select
                                value={selectedCenterOption}
                                onChange={(option) => {
                                    setSelectedCenter(option?.value);
                                    setPage(1);
                                }}
                                options={centerOptions}
                                placeholder="All Centers"
                                classNamePrefix="react-select"
                            />
                        </div>

                        <div style={{ width: "220px" }}>
                            <Input
                                type="text"
                                className="form-control"
                                placeholder="Search by name or Ecode..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                    </div>

                    <RefreshButton loading={loading} onRefresh={fetchAdjustmentsHistory} />
                </div>

                <div className="d-flex d-md-none flex-column gap-3">
                    <div style={{ width: "100%" }}>
                        <Select
                            value={selectedCenterOption}
                            onChange={(option) => {
                                setSelectedCenter(option?.value);
                                setPage(1);
                            }}
                            options={centerOptions}
                            placeholder="All Centers"
                            classNamePrefix="react-select"
                        />
                    </div>
                    <div style={{ width: "100%" }}>
                        <Input
                            type="text"
                            className="form-control"
                            placeholder="Search by name or Ecode..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="d-flex justify-content-end">
                        <RefreshButton loading={loading} onRefresh={fetchAdjustmentsHistory} />
                    </div>
                </div>
            </div>

            <DataTableComponent columns={columns}
                data={data}
                page={page}
                setPage={setPage}
                limit={limit}
                setLimit={setLimit}
                loading={loading}
                pagination={pagination}
            />

            <PreviewFile
                title="Attachment Preview"
                file={previewFile}
                isOpen={previewOpen}
                toggle={closePreview}
            />
        </>
    )
}

ApprovalHistory.propTypes = {
    activeTab: PropTypes.string
}

export default ApprovalHistory;