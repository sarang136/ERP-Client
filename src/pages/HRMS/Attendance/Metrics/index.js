import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button, CardBody, Input, Spinner } from "reactstrap";
import { useMediaQuery } from "../../../../Components/Hooks/useMediaQuery";
import Header from "../../../Report/Components/Header";
import Select from "react-select";
import { usePermissions } from "../../../../Components/Hooks/useRoles";
import { endOfDay, format, startOfDay } from "date-fns";
import DataTableComponent from "../../../../Components/Common/DataTable";
import { fetchAttendanceMetrics } from "../../../../store/features/HRMS/hrmsSlice";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { toast } from "react-toastify";
import { attendanceMetricsColumns } from "../../components/Table/Columns/attendanceMetrics";
import { exportAttendanceMetrics } from "../../../../helpers/backend_helper";
import RefreshButton from "../../../../Components/Common/RefreshButton";
import { useCenterOptions } from "../../../../Components/Hooks/useCenterOptions";

const sortByOptions = [
  { value: "avgDuration", label: "Sort By Average Duration" },
  { value: "totalDaysPresent", label: "Sort By Days Present" },
  { value: "totalDaysAbsent", label: "Sort By Days Absent" },
];

const statusOptions = [
  { value: "", label: "All Status" },
  { value: "ACTIVE", label: "Active" },
  { value: "RESIGNED", label: "Resigned" },
  { value: "FNF_CLOSED", label: "FNF Closed" },
  // { value: "NEW_JOINING", label: "New Joining" },
];

const AttendanceMetrics = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isExcelGenerating, setIsExcelGenerating] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState("ALL");
  const [sortBy, setSortBy] = useState("avgDuration");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [reportDate, setReportDate] = useState({
    start: startOfDay(new Date()),
    end: endOfDay(new Date()),
  });
  const [selectedStatus, setSelectedStatus] = useState("ACTIVE");

  const isMobile = useMediaQuery("(max-width: 1000px)");

  const handleAuthError = useAuthError();
  const microUser = localStorage.getItem("micrologin");
  const token = microUser ? JSON.parse(microUser).token : null;

  const { hasPermission, loading: permissionLoader } = usePermissions(token);
  const { centerAccess } = useSelector((state) => state.User);
  const { data, pagination, loading } = useSelector((state) => state.HRMS);

  const hasUserPermission = hasPermission("HR", "ATTENDANCE_METRICS", "READ");

  useEffect(() => {
    if (selectedCenter !== "ALL" && !centerAccess?.includes(selectedCenter)) {
      setSelectedCenter("ALL");
      setPage(1);
    }
  }, [selectedCenter, centerAccess]);

  const centerOptions = useCenterOptions();

  const selectedCenterOption =
    centerOptions.find((opt) => opt.value === selectedCenter) ||
    centerOptions[0];

  const centers = selectedCenter === "ALL" ? centerAccess : [selectedCenter];

  const pendingRequestRef = useRef(null);

  const fetchEmployeeAttendanceMetrics = async () => {
    pendingRequestRef.current?.abort();

    const request = dispatch(
      fetchAttendanceMetrics({
        page,
        limit,
        search,
        centers,
        startDate: reportDate.start,
        endDate: reportDate.end,
        sortBy,
        ...(debouncedSearch.trim() !== "" && { search: debouncedSearch }),
        status: selectedStatus || undefined,
      }),
    );
    pendingRequestRef.current = request;

    try {
      await request.unwrap();
    } catch (error) {
      if (error.name === "AbortError") return;
      if (!handleAuthError(error)) {
        toast.error(error.message || "Failed to fetch attendance");
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
    fetchEmployeeAttendanceMetrics();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    limit,
    selectedCenter,
    reportDate.start,
    reportDate.end,
    hasUserPermission,
    debouncedSearch,
    centerAccess,
    sortBy,
    selectedStatus,
  ]);

  useEffect(() => {
    setPage(1);
  }, [
    selectedCenter,
    reportDate.start,
    reportDate.end,
    limit,
    debouncedSearch,
    sortBy,
    selectedStatus,
  ]);

  const handleExportXLSX = async () => {
    setIsExcelGenerating(true);
    try {
      const res = await exportAttendanceMetrics({
        page,
        limit,
        search,
        centers,
        startDate: reportDate.start,
        endDate: reportDate.end,
        sortBy,
        ...(debouncedSearch.trim() !== "" && { search: debouncedSearch }),
        status: selectedStatus || undefined,
      });

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-metrics-report-${format(reportDate.start, "yyyy-MM-dd")}_to_${format(reportDate.end, "yyyy-MM-dd")}.xlsx`;
      document.body.appendChild(a);
      a.click();

      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error("Something went wrong while generating xlsx file");
      }
    } finally {
      setIsExcelGenerating(false);
    }
  };

  if (!permissionLoader && !hasUserPermission) {
    navigate("/unauthorized");
  }

  const handleNavigate = (employeeId, centerId) => {
    const params = new URLSearchParams({
      id: employeeId,
      centerId: centerId,
      startDate: new Date(reportDate.start).toISOString(),
      endDate: new Date(reportDate.end).toISOString(),
    });
    const url = `${process.env.PUBLIC_URL || ""}/hr/attendance/employee?${params.toString()}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const columns = attendanceMetricsColumns({
    onNavigate: handleNavigate,
    searchText: debouncedSearch,
  });

  return (
    <CardBody
      className="p-3 bg-white"
      style={isMobile ? { width: "100%" } : { width: "78%" }}
    >
      <div className="text-center text-md-left mb-4">
        <h1 className="display-6 fw-bold text-primary">ATTENDANCE METRICS</h1>
      </div>

      <div className="mb-3 d-none d-md-block">
        {/* Desktop */}
        <div className="d-flex gap-3 align-items-center mb-2">
          <div style={{ width: "200px" }}>
            <Select
              value={selectedCenterOption}
              onChange={(opt) => setSelectedCenter(opt.value)}
              options={centerOptions}
              classNamePrefix="react-select"
            />
          </div>

          <div style={{ width: "220px" }}>
            <Select
              value={sortByOptions.find((opt) => opt.value === sortBy)}
              onChange={(opt) => setSortBy(opt.value)}
              options={sortByOptions}
              classNamePrefix="react-select"
              isSearchable={false}
            />
          </div>

          <div style={{ width: "180px" }}>
            <Select
              value={statusOptions.find((opt) => opt.value === selectedStatus)}
              onChange={(opt) => {
                setSelectedStatus(opt.value);
                setPage(1);
              }}
              options={statusOptions}
              classNamePrefix="react-select"
              isSearchable={false}
            />
          </div>

          <div style={{ minWidth: "220px" }}>
            <Input
              type="text"
              placeholder="Search by name, eCode"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ minWidth: "150px" }}>
            <Header reportDate={reportDate} setReportDate={setReportDate} />
          </div>
        </div>
        <div className="d-flex justify-content-end gap-2">
          <RefreshButton
            loading={loading}
            onRefresh={fetchEmployeeAttendanceMetrics}
          />
          <Button
            color="primary"
            className="d-flex align-items-center gap-1 text-white"
            onClick={handleExportXLSX}
            disabled={isExcelGenerating || centers.length === 0}
          >
            {isExcelGenerating ? (
              <Spinner size="sm" />
            ) : (
              <i className="ri-file-excel-2-line" />
            )}
            Export Excel
          </Button>
        </div>
      </div>

      {/* Mobile */}
      <div className="mb-3 d-flex d-md-none flex-column gap-3">
        <Select
          value={selectedCenterOption}
          onChange={(opt) => setSelectedCenter(opt.value)}
          options={centerOptions}
          classNamePrefix="react-select"
        />

        <Select
          value={sortByOptions.find((opt) => opt.value === sortBy)}
          onChange={(opt) => setSortBy(opt.value)}
          options={sortByOptions}
          classNamePrefix="react-select"
          isSearchable={false}
        />
        <Select
          value={statusOptions.find((opt) => opt.value === selectedStatus)}
          onChange={(opt) => {
            setSelectedStatus(opt.value);
            setPage(1);
          }}
          options={statusOptions}
          classNamePrefix="react-select"
          isSearchable={false}
        />

        <Input
          type="text"
          placeholder="Search by name, biometric ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Header reportDate={reportDate} setReportDate={setReportDate} />

        <div className="d-flex justify-content-end">
          <Button
            color="primary"
            className="d-flex align-items-center gap-1 text-white"
            onClick={handleExportXLSX}
            disabled={isExcelGenerating || centers.length === 0}
          >
            {isExcelGenerating ? (
              <Spinner size="sm" />
            ) : (
              <i className="ri-file-excel-2-line" />
            )}
            Export Excel
          </Button>
        </div>
      </div>
      <DataTableComponent
        columns={columns}
        data={data}
        page={page}
        setPage={setPage}
        limit={limit}
        setLimit={setLimit}
        loading={loading}
        pagination={pagination}
      />
    </CardBody>
  );
};

export default AttendanceMetrics;
