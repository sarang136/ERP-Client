import { useDispatch, useSelector } from "react-redux";
import { useAuthError } from "../../../../../Components/Hooks/useAuthError";
import { useCenterOptions } from "../../../../../Components/Hooks/useCenterOptions";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { formatEmployeeName } from "../../../../../utils/formatEmployeeName";
import { usePermissions } from "../../../../../Components/Hooks/useRoles";
import { toast } from "react-toastify";
import { fetchPayrollAdjustments } from "../../../../../store/features/HR/hrSlice";
import { deletePayrollAdjustments, payrollAdjustmentsAction } from "../../../../../helpers/backend_helper";
import { capitalizeWords } from "../../../../../utils/toCapitalize";
import { format } from "date-fns";
import CheckPermission from "../../../../../Components/HOC/CheckPermission";
import { Button, Input } from "reactstrap";
import { CheckCheck, Pencil, Trash2, X } from "lucide-react";
import DeleteConfirmModal from "../../../components/DeleteConfirmModal";
import ApproveModal from "../../../components/ApproveModal";
import PropTypes from "prop-types";
import Select from "react-select";
import EditPayrollAdjustmentModal from "../../../components/forms/EditPayrollAdjustmentModal";
import { adjustmentTypeLabels } from "../../../../../Components/constants/payrollAdjustments";
import { ExpandableText } from "../../../../../Components/Common/ExpandableText";
import DataTableComponent from "../../../../../Components/Common/DataTable";
import PreviewFile from "../../../../../Components/Common/PreviewFile";
import RefreshButton from "../../../../../Components/Common/RefreshButton";

const PendingApprovals = ({ activeTab }) => {
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
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [limit, setLimit] = useState(10);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [actionType, setActionType] = useState(null);
    const [note, setNote] = useState("");
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

    const fetchPendingAdjustmentApprovals = async () => {
        try {
            const centers =
                selectedCenter === "ALL"
                    ? user?.centerAccess
                    : !user?.centerAccess.length ? [] : [selectedCenter];

            await dispatch(fetchPayrollAdjustments({
                page,
                limit,
                centers,
                view: "PENDING",
                ...search.trim() !== "" && { search: debouncedSearch },
                ...(queryAdjustmentId !== "" && { adjustmentId: queryAdjustmentId })
            })).unwrap();
        } catch (error) {
            if (!handleAuthError(error)) {
                toast.error(error.message || "Failed to fetch payroll adjustments");
            }
        }
    };

    useEffect(() => {
        if (activeTab === "PENDING" && hasUserPermission) {
            fetchPendingAdjustmentApprovals();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, limit, selectedCenter, debouncedSearch, user?.centerAccess, activeTab]);

    const handleDelete = async () => {
        setModalLoading(true);
        try {
            await deletePayrollAdjustments(selectedRecord._id);
            toast.success("Request deleted successfully");
            setPage(1);
            fetchPendingAdjustmentApprovals();
        } catch (error) {
            if (!handleAuthError(error)) {
                toast.error(error.message || "Failed to delete the request")
            }
        } finally {
            setDeleteModalOpen(false);
            setModalLoading(false);
        }
    }

    const handleAction = async () => {
        setModalLoading(true);
        try {
            const response = await payrollAdjustmentsAction(selectedRecord._id, {
                action: actionType,
                note,
            });
            toast.success(response.message);
            setPage(1);
            fetchPendingAdjustmentApprovals();
        } catch (error) {
            if (!handleAuthError(error)) {
                toast.error(error.message || "Action failed");
            }
        } finally {
            setApproveModalOpen(false);
            setModalLoading(false);
        }
    }

    const columns = [
        {
            name: <div>ECode</div>,
            selector: row => row?.employee?.eCode || "-",
        },
        {
            name: <div>Name</div>,
            selector: row =>
                formatEmployeeName(row?.employee?.name, row?.employee?.salutation)?.toUpperCase() || "-",
            wrap: true,
            minWidth: "160px"
        },
        {
            name: <div>Center</div>,
            selector: row => capitalizeWords(row?.center?.title) || "-",
            wrap: true,
            minWidth: "120px"
        },
        {
            name: <div>Type</div>,
            selector: row => adjustmentTypeLabels[row?.type] || "-",
            wrap: true,
            minWidth: "150px"
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

        ...(hasPermission("HR", "PAYROLL_ADJUSTMENTS_APPROVAL", "WRITE")
            ? [
                {
                    name: <div>Actions</div>,
                    cell: row => (
                        <div className="d-flex gap-2">
                            <CheckPermission
                                accessRolePermission={roles?.permissions}
                                subAccess="PAYROLL_ADJUSTMENTS_APPROVAL"
                                permission="edit"
                            >
                                <Button
                                    color="success"
                                    className="text-white"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedRecord(row);
                                        setActionType("APPROVE")
                                        setApproveModalOpen(true);
                                    }}
                                >
                                    <CheckCheck size={18} />
                                </Button>

                                <Button
                                    color="danger"
                                    className="text-white"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedRecord(row);
                                        setActionType("REJECT");
                                        setApproveModalOpen(true);
                                    }}
                                >
                                    <X size={16} />
                                </Button>
                                <Button
                                    color="primary"
                                    outline
                                    size="sm"
                                    onClick={() => {
                                        setSelectedRecord(row);
                                        setModalOpen(true);
                                    }}
                                >
                                    <Pencil size={16} />
                                </Button>
                            </CheckPermission>
                            <CheckPermission
                                accessRolePermission={roles?.permissions}
                                subAccess="PAYROLL_ADJUSTMENTS_APPROVAL"
                                permission="delete"
                            >
                                <Button
                                    color="danger"
                                    size="sm"
                                    className="text-white"
                                    onClick={() => {
                                        setSelectedRecord(row);
                                        setDeleteModalOpen(true);
                                    }}
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </CheckPermission>
                        </div>
                    ),
                    ignoreRowClick: true,
                    allowOverflow: true,
                    button: true,
                    minWidth: "180px"
                }
            ]
            : [])
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

                    <RefreshButton loading={loading} onRefresh={fetchPendingAdjustmentApprovals} />
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
                        <RefreshButton loading={loading} onRefresh={fetchPendingAdjustmentApprovals} />
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

            <EditPayrollAdjustmentModal
                isOpen={modalOpen}
                toggle={() => {
                    setModalOpen(!modalOpen);
                    setSelectedRecord(null);
                }}
                initialData={selectedRecord}
                onUpdate={() => {
                    setSelectedRecord(null);
                    setPage(1);
                    fetchPendingAdjustmentApprovals();
                }}
            />

            <DeleteConfirmModal
                isOpen={deleteModalOpen}
                toggle={() => {
                    setDeleteModalOpen(!deleteModalOpen);
                    setSelectedRecord(null);
                }}
                onConfirm={handleDelete}
                loading={modalLoading}
            />

            <ApproveModal
                isOpen={approveModalOpen}
                toggle={() => {
                    setApproveModalOpen(false);
                    setNote("");
                    setActionType(null);
                    setSelectedRecord(null);
                }}
                onSubmit={handleAction}
                mode="PAYROLL_ADJUSTMENTS"
                loading={modalLoading}
                actionType={actionType}
                setActionType={setActionType}
                note={note}
                setNote={setNote}
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

PendingApprovals.propTypes = {
    activeTab: PropTypes.string
};

export default PendingApprovals;