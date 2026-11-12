import { useEffect, useMemo, useState } from "react";
import { Button, CardBody, Input, Spinner } from "reactstrap";
import Select from "react-select";
import { useDispatch, useSelector } from "react-redux";
import { endOfMonth, startOfMonth } from "date-fns";
import { Calendar, Download, Eye } from "lucide-react";
import Flatpickr from "react-flatpickr";
import monthSelectPlugin from "flatpickr/dist/plugins/monthSelect";
import "flatpickr/dist/themes/material_blue.css";
import "flatpickr/dist/plugins/monthSelect/style.css";
import { toast } from "react-toastify";
import DataTableComponent from "../../../../Components/Common/DataTable";
import { usePermissions } from "../../../../Components/Hooks/useRoles";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { useCenterOptions } from "../../../../Components/Hooks/useCenterOptions";
import { fetchEmployeePayslips } from "../../../../store/features/HR/hrSlice";
import {
  buildPayslipPreviewFile,
  displayMoney,
  displayValue,
  downloadPayslipsBulk,
  monthLabel,
  readStickyFilters,
  useDebouncedValue,
  writeStickyFilters,
} from "../payslipUtils";
import { getEmployeePayslipById, getEmployeePayslips, getEmployeePayslipsByIds } from "../../../../helpers/backend_helper";
import PreviewFile from "../../../../Components/Common/PreviewFile";
import RefreshButton from "../../../../Components/Common/RefreshButton";
import {capitalizeWords} from "../../../../utils/toCapitalize";
import {normalizeUnderscores} from "../../../../utils/normalizeUnderscore";
import { format } from "date-fns";
import { useMediaQuery } from "../../../../Components/Hooks/useMediaQuery";

const FILTER_KEY = "hr_employee_payslip_filters";

const initialFilters = readStickyFilters(FILTER_KEY, {
  center: "ALL",
  search: "",
  month: new Date().toISOString(),
});

const EmployeePaySlipsTab = () => {
  const dispatch = useDispatch();
  const handleAuthError = useAuthError();
  const [, setCardWidth] = useState(
    window.innerWidth > 990 ? "80%" : "100%",
  );

  const [selectedCenter, setSelectedCenter] = useState("ALL");
  const [centerRestored, setCenterRestored] = useState(false);

  const [search, setSearch] = useState(initialFilters.search);
  const [selectedMonth, setSelectedMonth] = useState(
    initialFilters.month ? new Date(initialFilters.month) : new Date(),
  );
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [downloadingId, setDownloadingId] = useState("");
  const [previewFile, setPreviewFile] = useState(null);
  // Keyed by payslip _id so selections survive page changes (react-data-table-component
  // only renders/controls the current page's rows; this map is the source of truth
  // across all pages until filters change or a download runs).
  const [selectedRowsMap, setSelectedRowsMap] = useState({});
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const [selectAllMatching, setSelectAllMatching] = useState(false);
  const [fetchingAllMatching, setFetchingAllMatching] = useState(false);

  const selectedRows = useMemo(() => Object.values(selectedRowsMap), [selectedRowsMap]);

  const debouncedSearch = useDebouncedValue(search);

  const microUser = localStorage.getItem("micrologin");
  const token = microUser ? JSON.parse(microUser).token : null;
  const { hasPermission, loading: permissionLoader } = usePermissions(token);

  // ✅ KEY FIX: read centerAccess directly from state.User (same as Salary.jsx)
  // NOT from state.User.user.centerAccess — that nested value can be stale
  // when a parent center selector calls changeUserAccess and updates the slice
  const { centerAccess = [] } = useSelector((state) => state.User);

  const {
    data = [],
    pagination,
  } = useSelector((state) => state.HR.employeePayslips.data);
  const loading = useSelector((state) => state.HR.employeePayslips.loading);

  const hasUserPermission = hasPermission("HR", "EMPLOYEE_PAYSLIPS", "READ");

  const centerOptions = useCenterOptions();

  const selectedCenterOption =
    centerOptions.find((opt) => opt.value === selectedCenter) ||
    centerOptions[0];

  const centers = useMemo(
    () =>
      selectedCenter === "ALL"
        ? centerAccess
        : centerAccess.includes(selectedCenter)
          ? [selectedCenter]
          : [],
    [centerAccess, selectedCenter],
  );

  useEffect(() => {
    if (!centerRestored && centerAccess.length > 0) {
      const saved = initialFilters.center;
      if (saved && saved !== "ALL" && centerAccess.includes(saved)) {
        setSelectedCenter(saved);
      }
      setCenterRestored(true);
    }
  }, [centerAccess, centerRestored]);

  // Guard: if the selected center disappears from access, reset to ALL
  useEffect(() => {
    if (selectedCenter !== "ALL" && !centerAccess.includes(selectedCenter)) {
      setSelectedCenter("ALL");
      setPage(1);
    }
  }, [centerAccess, selectedCenter]);

  // Persist filters to sticky storage
  useEffect(() => {
    writeStickyFilters(FILTER_KEY, {
      center: selectedCenter,
      search,
      month: selectedMonth?.toISOString?.() || "",
    });
  }, [selectedCenter, search, selectedMonth]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedCenter, selectedMonth, limit, debouncedSearch]);

  // Filters change the underlying result set, so the selection no longer makes sense —
  // clear it. Page changes are intentionally excluded: selections should persist as the
  // user browses pages within the same filters.
  useEffect(() => {
    setSelectedRowsMap({});
    setSelectAllMatching(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCenter, selectedMonth, limit, debouncedSearch]);

  const fetchPayslips = async () => {
    if (!hasUserPermission) return;

    if (!centerAccess?.length) {
      dispatch({
        type: "HR/fetchEmployeePayslips/fulfilled",
        payload: {
          data: [],
          pagination: { page: 1, limit, totalDocs: 0, totalPages: 0 },
        },
      });
      return;
    }

    if (!centers?.length) return;

    try {
      await dispatch(
        fetchEmployeePayslips({
          page,
          limit,
          centers,
          startDate: format(startOfMonth(selectedMonth), "yyyy-MM-dd"),
          endDate: format(endOfMonth(selectedMonth), "yyyy-MM-dd"),
          ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
        }),
      ).unwrap();
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(error?.message || "Failed to fetch payslips");
      }
    }
  };
  useEffect(() => {
    if (!hasUserPermission) return;
    fetchPayslips();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    limit,
    selectedCenter,
    selectedMonth,
    debouncedSearch,
    centerAccess,
    hasUserPermission,
  ]); // eslint-disable-line

  useEffect(() => {
    const handleResize = () =>
      setCardWidth(window.innerWidth > 990 ? "80%" : "100%");
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = useMediaQuery("(max-width: 1000px)");

  const handlePreview = async (row) => {
    try {
      setDownloadingId(row._id);
      const res = await getEmployeePayslipById(row._id);
      if (!res?.success || !res?.data) {
        throw new Error("Payslip not found");
      }
      const file = await buildPayslipPreviewFile(res.data);
      setPreviewFile(file);
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(error?.message || "Failed to generate payslip PDF");
      }
    } finally {
      setDownloadingId("");
    }
  };

  const closePreview = () => {
    if (previewFile?.url) window.URL.revokeObjectURL(previewFile.url);
    setPreviewFile(null);
  };

  const handleBulkDownload = async () => {
    if (!selectedRows.length) return;
    setBulkDownloading(true);
    try {
      const { failures } = await downloadPayslipsBulk(selectedRows, getEmployeePayslipsByIds, { handleAuthError });
      if (failures) {
        toast.error(`${failures} of ${selectedRows.length} payslips failed to download`);
      }
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(error?.message || "Failed to download payslips");
      }
    } finally {
      setBulkDownloading(false);
      setSelectedRowsMap({});
      setSelectAllMatching(false);
    }
  };

  // Selecting all rows on the visible page only selects that page (react-data-table-component's
  // default). This fetches every payslip id matching the current center/search/month filters —
  // across all pages — so "select all" can actually mean all, not just this page.
  const handleSelectAllMatching = async () => {
    const total = pagination?.totalDocs || 0;
    if (!total || !centers?.length) return;

    setFetchingAllMatching(true);
    try {
      const res = await getEmployeePayslips({
        centers,
        page: 1,
        limit: total,
        startDate: format(startOfMonth(selectedMonth), "yyyy-MM-dd"),
        endDate: format(endOfMonth(selectedMonth), "yyyy-MM-dd"),
        ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
      });
      if (!res?.success) throw new Error("Failed to fetch all matching payslips");
      const map = {};
      (res.data || []).forEach((row) => {
        map[row._id] = { _id: row._id };
      });
      setSelectedRowsMap(map);
      setSelectAllMatching(true);
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(error?.message || "Failed to select all matching payslips");
      }
    } finally {
      setFetchingAllMatching(false);
    }
  };

  const toggleRow = (row) => {
    const isSelected = !!selectedRowsMap[row._id];

    const next = { ...selectedRowsMap };
    if (isSelected) {
      delete next[row._id];
      // No longer every matching row, even if "select all matching" fetched the rest —
      // drop the flag so the download label/clear-on-untick logic reflects a partial set.
      if (selectAllMatching) setSelectAllMatching(false);
    } else {
      next[row._id] = row;
    }
    setSelectedRowsMap(next);

    if (!isSelected) {
      const allPageSelected = data.every((r) => next[r._id]);
      if (allPageSelected && (pagination?.totalDocs || 0) > data.length) {
        handleSelectAllMatching();
      }
    }
  };

  const headerChecked = data.length > 0 && data.every((row) => !!selectedRowsMap[row._id]);

  const toggleHeader = () => {
    if (headerChecked) {
      if (selectAllMatching) {
        setSelectedRowsMap({});
        setSelectAllMatching(false);
      } else {
        setSelectedRowsMap((prev) => {
          const next = { ...prev };
          data.forEach((row) => delete next[row._id]);
          return next;
        });
      }
      return;
    }

    const next = { ...selectedRowsMap };
    data.forEach((row) => {
      next[row._id] = row;
    });
    setSelectedRowsMap(next);

    if ((pagination?.totalDocs || 0) > data.length) {
      handleSelectAllMatching();
    }
  };

  const columns = useMemo(
    () => [
      {
        name: (
          <Input
            type="checkbox"
            checked={headerChecked}
            onChange={toggleHeader}
            disabled={fetchingAllMatching}
          />
        ),
        cell: (row) => (
          <Input
            type="checkbox"
            checked={!!selectedRowsMap[row._id]}
            onChange={() => toggleRow(row)}
            disabled={fetchingAllMatching}
          />
        ),
        width: "50px",
      },
      {
        name: "S No.",
        cell: (_, index) => (page - 1) * limit + index + 1,
        width: "70px",
      },
      {
        name: "Preview",
        center: true,
        minWidth: "100px",
        cell: (row) => (
          <Button
            color="primary"
            size="sm"
            className="d-inline-flex align-items-center justify-content-center text-white"
            onClick={() => handlePreview(row)}
            disabled={downloadingId === row._id}
            title="Preview payslip"
          >
            {downloadingId === row._id ? (
              <Spinner size="sm" />
            ) : (
              <Eye size={16} />
            )}
          </Button>
        ),
      },
      {
        name: "Month",
        cell: (row) => displayValue(monthLabel(row)),
        sortable: true,
        minWidth: "130px",
      },
      {
        name: "Emp Code",
        cell: (row) => displayValue(row.employeeCode),
        minWidth: "110px",
      },
      {
        name: "Employee Name",
        cell: (row) => displayValue(row.employeeName),
        sortable: true,
        minWidth: "180px",
      },
      {
        name: "Center",
        cell: (row) => displayValue(row.center?.title),
        minWidth: "130px",
      },
      {
        name: "Designation",
        cell: (row) => capitalizeWords(normalizeUnderscores(row.designation)),
        minWidth: "150px",
      },
      {
        name: "Department",
        cell: (row) => capitalizeWords(row.department),
        minWidth: "150px",
      },
      {
        name: "Position",
        cell: (row) => capitalizeWords(row.position),
        minWidth: "150px",
      },
      {
        name: "Total Days",
        cell: (row) => displayValue(row.totalDays),
        right: true,
        minWidth: "100px",
      },
      {
        name: "Payable Days",
        cell: (row) => displayValue(row.payableDays),
        right: true,
        minWidth: "110px",
      },
      {
        name:"Gross Salary",
        cell: (row) => displayMoney(row.grossSalary),
        right: true,
        minWidth: "130px",
      },
      {
        name: "Total Deductions",
        cell: (row) => displayMoney(row.totalDeductions),
        right: true,
        minWidth: "140px",
      },
      {
        name: "Net Pay",
        cell: (row) => displayMoney(row.inHandSalary),
        right: true,
        minWidth: "110px",
      },
    ],
    [data, downloadingId, limit, page, selectedRowsMap, selectAllMatching, fetchingAllMatching, pagination], // eslint-disable-line
  );

  if (!permissionLoader && !hasUserPermission) return null;

  return (
    <CardBody
      className="p-3 bg-white"
      style={isMobile ? { width: "100%" } : { width: "80%" }}
    >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold text-primary mb-0">EMPLOYEES PAY SLIPS</h4>
        <div className="d-flex align-items-center gap-2">
          {fetchingAllMatching && (
            <span className="d-inline-flex align-items-center gap-1 text-muted">
              <Spinner size="sm" /> Selecting all matching payslips…
            </span>
          )}
          {selectedRows.length > 0 && (
            <Button
              color="primary"
              size="sm"
              className="d-inline-flex align-items-center gap-1"
              onClick={handleBulkDownload}
              disabled={bulkDownloading || fetchingAllMatching}
            >
              {bulkDownloading ? <Spinner size="sm" /> : <Download size={16} />}
              Download Selected ({selectedRows.length}
              {selectAllMatching ? " — all filtered" : ""})
            </Button>
          )}
          <RefreshButton loading={loading} onRefresh={fetchPayslips} />
        </div>
      </div>

      <div className="d-flex flex-column flex-lg-row gap-2 align-items-stretch align-items-lg-center mb-3">
        <div style={{ minWidth: 210 }}>
          <Select
            value={selectedCenterOption}
            onChange={(opt) => setSelectedCenter(opt?.value || "ALL")}
            options={centerOptions}
            classNamePrefix="react-select"
          />
        </div>

        <div style={{ minWidth: 280 }}>
          <Input
            type="text"
            placeholder="Search name, emp code, center, designation…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ minWidth: 170 }}>
          <div className="position-relative month-picker">
            <Calendar size={14} className="position-absolute calendar-icon" />
            <Flatpickr
              value={selectedMonth}
              options={{
                plugins: [
                  monthSelectPlugin({
                    shorthand: false,
                    dateFormat: "Y-m",
                    altFormat: "F Y",
                  }),
                ],
                altInput: true,
                disableMobile: true,
              }}
              onChange={([date]) => date && setSelectedMonth(date)}
              className="form-control form-control-sm"
            />
          </div>
        </div>
      </div>

      <DataTableComponent
        columns={columns}
        data={data}
        page={page}
        setPage={setPage}
        limit={limit}
        setLimit={setLimit}
        loading={loading || permissionLoader}
        pagination={pagination}
        keyField="_id"
        noDataComponent="No payslips found"
      />

      <PreviewFile
        title="Payslip Preview"
        file={previewFile}
        isOpen={!!previewFile}
        toggle={closePreview}
        allowDownload
      />
    </CardBody>
  );
};

export default EmployeePaySlipsTab;
