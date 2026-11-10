import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, CardBody, Input, Spinner } from "reactstrap";
import Select from "react-select";
import { useDispatch, useSelector } from "react-redux";
import { endOfYear, startOfYear } from "date-fns";
import { Download, Eye } from "lucide-react";
import { toast } from "react-toastify";
import DataTableComponent from "../../../../Components/Common/DataTable";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { fetchMyPayslips } from "../../../../store/features/HR/hrSlice";
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
import { getMyPayslipById, getMyPayslipsByIds } from "../../../../helpers/backend_helper";
import PreviewFile from "../../../../Components/Common/PreviewFile";
import RefreshButton from "../../../../Components/Common/RefreshButton";

const FILTER_KEY = "hr_my_payslip_filters";

const TYPE_OPTIONS = [
  { value: "PAYSLIP", label: "Payslip" },
  { value: "FORM",    label: "Form"    },
];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => {
  const y = currentYear - i;
  return { value: y, label: String(y) };
});

const initialFilters = readStickyFilters(FILTER_KEY, {
  type:   "PAYSLIP",
  search: "",
  year:   currentYear,
});

const MyPaySlipsTab = () => {
  const dispatch        = useDispatch();
  const handleAuthError = useAuthError();

  const [page,          setPage]          = useState(1);
  const [limit,         setLimit]         = useState(10);
  const [type,          setType]          = useState(initialFilters.type   || "PAYSLIP");
  const [search,        setSearch]        = useState(initialFilters.search || "");
  const [selectedYear,  setSelectedYear]  = useState(
    initialFilters.year ? Number(initialFilters.year) : currentYear
  );
  const [downloadingId, setDownloadingId] = useState("");
  const [previewFile,   setPreviewFile]   = useState(null);
  const [selectedRows,  setSelectedRows]  = useState([]);
  const [clearSelection, setClearSelection] = useState(false);
  const [bulkDownloading, setBulkDownloading] = useState(false);

  const debouncedSearch = useDebouncedValue(search);

  const { data = [], loading, pagination } =
    useSelector((state) => state.HR.myPayslips);

  useEffect(() => {
    writeStickyFilters(FILTER_KEY, {
      type,
      search,
      year: selectedYear ?? "",
    });
  }, [type, search, selectedYear]);

  useEffect(() => {
    setPage(1);
  }, [type, selectedYear, limit, debouncedSearch]);

  useEffect(() => {
    setSelectedRows([]);
    setClearSelection((prev) => !prev);
  }, [page, type, selectedYear, limit, debouncedSearch]);

  const fetchKey = [
    type,
    selectedYear ?? "",
    page,
    limit,
    debouncedSearch.trim(),
  ].join("|");

  const paramsRef = useRef({});
  paramsRef.current = {
    type, selectedYear,
    page, limit, search: debouncedSearch.trim(),
  };

  const runFetch = useCallback(async () => {
    const { type: t, selectedYear: y, page: p, limit: l, search: s } = paramsRef.current;

    let dateRange = {};
    if (y) {
      dateRange = {
        startDate: startOfYear(new Date(y, 0, 1)),
        endDate:   endOfYear(new Date(y, 0, 1)),
      };
    }

    try {
      await dispatch(fetchMyPayslips({
        page: p, limit: l, type: t,
        ...dateRange,
        ...(s && { search: s }),
      })).unwrap();
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(error?.message || "Failed to fetch payslips");
      }
    }
  }, [dispatch, handleAuthError]);

  useEffect(() => { runFetch(); }, [fetchKey]); // eslint-disable-line

  const handlePreview = async (row) => {
    try {
      setDownloadingId(row._id);
      const res = await getMyPayslipById(row._id);
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
      const { failures } = await downloadPayslipsBulk(selectedRows, getMyPayslipsByIds, { handleAuthError });
      if (failures) {
        toast.error(`${failures} of ${selectedRows.length} payslips failed to download`);
      }
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(error?.message || "Failed to download payslips");
      }
    } finally {
      setBulkDownloading(false);
      setClearSelection((prev) => !prev);
      setSelectedRows([]);
    }
  };

  const columns = useMemo(() => [
    {
      name: "No.",
      cell: (_, i) => (page - 1) * limit + i + 1,
      width: "60px",
      wrap:true,
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
          {downloadingId === row._id ? <Spinner size="sm" /> : <Eye size={16} />}
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
    // {
    //   name: "Designation",
    //   cell: (row) => capitalizeWords(row.designation),
    //   minWidth: "150px",
    // },
    // {
    //   name: "Department",
    //   cell: (row) => capitalizeWords(row.department),
    //   minWidth: "150px",
    // },
    // {
    //   name: "Position",
    //   cell: (row) => capitalizeWords(row.position),
    //   minWidth: "150px",
    // },
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
      name: "Gross Salary",
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
  ], [data, downloadingId, limit, page]); // eslint-disable-line

  return (
    <CardBody className="p-3 bg-white" style={{ width: "80%" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold text-primary mb-0">MY PAY SLIPS</h4>
        <div className="d-flex align-items-center gap-2">
          {selectedRows.length > 0 && (
            <Button
              color="primary"
              size="sm"
              className="d-inline-flex align-items-center gap-1"
              onClick={handleBulkDownload}
              disabled={bulkDownloading}
            >
              {bulkDownloading ? <Spinner size="sm" /> : <Download size={16} />}
              Download Selected ({selectedRows.length})
            </Button>
          )}
          <RefreshButton loading={loading} onRefresh={runFetch} />
        </div>
      </div>

      <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
        <div style={{ minWidth: 160 }}>
          <Select
            value={TYPE_OPTIONS.find((o) => o.value === type)}
            onChange={(opt) => opt && setType(opt.value)}
            options={TYPE_OPTIONS}
            classNamePrefix="react-select"
            placeholder="Type"
            isSearchable={false}
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

        <div style={{ minWidth: 140 }}>
          <Select
            isClearable
            value={YEAR_OPTIONS.find((o) => o.value === selectedYear) ?? null}
            onChange={(opt) => setSelectedYear(opt?.value ?? null)}
            options={YEAR_OPTIONS}
            classNamePrefix="react-select"
            placeholder="Year"
            isSearchable={false}
          />
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
        selectableRows
        selectableRowsHighlight
        clearSelectedRows={clearSelection}
        onSelectedRowsChange={({ selectedRows: rows }) => setSelectedRows(rows)}
        noDataComponent={
          type === "FORM"
            ? "Forms are not available yet"
            : "No payslips found"
        }
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

export default MyPaySlipsTab;