import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { CardBody, Input } from "reactstrap";
import Select from "react-select";
import { toast } from "react-toastify";
import { useAuthError } from "../../../Components/Hooks/useAuthError";
import { fetchAllEmployeeLeaveBalance } from "../../../store/features/HR/hrSlice";
import { usePermissions } from "../../../Components/Hooks/useRoles";
import { useMediaQuery } from "../../../Components/Hooks/useMediaQuery";
import { useCenterOptions } from "../../../Components/Hooks/useCenterOptions";
import { leaveBalanceColumns } from "../components/columns/LeaveBalanceColumns";
import DataTableComponent from "../../../Components/Common/DataTable";
import RefreshButton from "../../../Components/Common/RefreshButton";


const EmployeeLeaveBalanceDashboard = () => {
    const [selectedCenter, setSelectedCenter] = useState("ALL");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [year, setYear] = useState(new Date().getFullYear());

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const user = useSelector((state) => state.User);
    const { data, pagination, loading } = useSelector((state) => state.HR);
    const handleAuthError = useAuthError();

    const isMobile = useMediaQuery("(max-width: 1000px)");

    const microUser = localStorage.getItem("micrologin");
    const token = microUser ? JSON.parse(microUser).token : null;

    const {
        hasPermission,
        loading: permissionLoader,
    } = usePermissions(token);
    const hasUserPermission = hasPermission("HR", "LEAVE_BALANCE_DASHBOARD", "READ");
    const columns = leaveBalanceColumns({ searchText: debouncedSearch });

    const centerOptions = useCenterOptions();

    const yearOptions = Array.from({ length: 6 }, (_, i) => {
        const y = 2025 + i;
        return { value: y, label: y.toString() };
    });

    const selectedCenterOption =
        centerOptions.find((opt) => opt.value === selectedCenter) ||
        centerOptions[0];

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
        }, 500);

        return () => clearTimeout(handler);
    }, [search]);

    const pendingRequestRef = useRef(null);

    const loadEmployeeLeaveBalance = async () => {
        pendingRequestRef.current?.abort();

        const centers =
            selectedCenter === "ALL"
                ? user?.centerAccess
                : !user?.centerAccess.length
                    ? []
                    : [selectedCenter];

        const request = dispatch(
            fetchAllEmployeeLeaveBalance({
                page,
                limit,
                centers,
                year,
                ...(search.trim() !== "" && { search: debouncedSearch }),
            }),
        );
        pendingRequestRef.current = request;

        try {
            await request.unwrap();
        } catch (error) {
            if (error.name === "AbortError") return;
            if (!handleAuthError(error)) {
                toast.error(error.message || "Failed to fetch employee leave balance dashboard");
            }
        }
    };

    useEffect(() => {
        if (hasUserPermission) {
            loadEmployeeLeaveBalance();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, limit, selectedCenter, debouncedSearch, year, user?.centerAccess]);


    if (!permissionLoader && !hasUserPermission) {
        navigate("/unathorized");
    }

    return (
        <CardBody
            className="p-3 bg-white"
            style={isMobile ? { width: "100%" } : { width: "78%" }}
        >
            <div className="text-center text-md-left mb-3">
                <h4 className="fw-bold text-primary">LEAVE BALANCE DASHBOARD</h4>
            </div>

            <div className="mb-3">
                {/*  DESKTOP VIEW */}
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

                        <div style={{ width: "120px" }}>
                            <Select
                                value={yearOptions.find(opt => opt.value === year)}
                                onChange={(option) => {
                                    setYear(option?.value);
                                    setPage(1);
                                }}
                                options={yearOptions}
                                placeholder="Year"
                                classNamePrefix="react-select"
                            />
                        </div>
                    </div>

                    <RefreshButton loading={loading} onRefresh={loadEmployeeLeaveBalance} />
                </div>

                {/*  MOBILE VIEW */}
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

                    <div style={{ width: "100%" }}>
                        <Select
                            value={yearOptions.find(opt => opt.value === year)}
                            onChange={(option) => {
                                setYear(option?.value);
                                setPage(1);
                            }}
                            options={yearOptions}
                            placeholder="Year"
                            classNamePrefix="react-select"
                        />
                    </div>
                    <div className="d-flex justify-content-end">
                        <RefreshButton loading={loading} onRefresh={loadEmployeeLeaveBalance} />
                    </div>
                </div>
            </div>

            <div className="mt-4">
                <DataTableComponent columns={columns}
                    data={data}
                    page={page}
                    setPage={setPage}
                    limit={limit}
                    setLimit={setLimit}
                    loading={loading}
                    pagination={pagination}
                />
            </div>
        </CardBody>
    )
}

export default EmployeeLeaveBalanceDashboard;