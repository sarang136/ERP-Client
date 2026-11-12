import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { CardBody, Spinner } from "reactstrap";
import Select from "react-select";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import DataTableComponent from "../../../Components/Common/DataTable";
import { useCenterOptions } from "../../../Components/Hooks/useCenterOptions";
import { useAuthError } from "../../../Components/Hooks/useAuthError";
import { usePermissions } from "../../../Components/Hooks/useRoles";
import {
  getUtilityBills,
  deleteUtilityBill,
} from "../../../helpers/backend_helper";
import ViewFileModal from "./ViewFileModal";
import EditBillModal from "./EditBillModal";
import DeleteBillModal from "./DeleteBillModal";

const fileSortOptions = [
  { value: null, label: "Sort by Files" },
  { value: "asc", label: "Fewest Files First" },
  { value: "desc", label: "Most Files First" },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_RANGE_END = 2076;
const yearOptions = [
  { value: "ALL", label: "All Years" },
  ...Array.from({ length: YEAR_RANGE_END - 2026 + 1 }, (_, idx) => {
    const year = 2026 + idx;
    return { value: year, label: String(year) };
  }),
];

const monthOptions = [
  { value: "ALL", label: "All Months" },
  ...Array.from({ length: 12 }, (_, idx) => ({
    value: idx + 1,
    label: new Date(2026, idx, 1).toLocaleString("en-US", { month: "long" }),
  })),
];

const useDebouncedValue = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

const Reports = () => {
  const navigate = useNavigate();
  const handleAuthError = useAuthError();
  const centerOptions = useCenterOptions();
  const user = useSelector((state) => state.User);
  const centerAccess = user?.centerAccess;

  const microUser = localStorage.getItem("micrologin");
  const token = microUser ? JSON.parse(microUser).token : null;
  const { loading: permissionLoader, hasPermission } = usePermissions(token);
  const hasReadPermission = hasPermission("UTILITIES", "REPORTS", "READ");
  const hasWritePermission = hasPermission("UTILITIES", "REPORTS", "WRITE");
  const hasDeletePermission = hasPermission("UTILITIES", "REPORTS", "DELETE");

  const [selectedCenter, setSelectedCenter] = useState("ALL");
  const [selectedMonth, setSelectedMonth] = useState("ALL");
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [bills, setBills] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);

  const [fileSort, setFileSort] = useState(null);

  const [viewFile, setViewFile] = useState(null);
  const [editBill, setEditBill] = useState(null);
  const [savingBillId, setSavingBillId] = useState(null);
  const [deleteBillRecord, setDeleteBillRecord] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const debouncedCenter = useDebouncedValue(selectedCenter);
  const debouncedMonth = useDebouncedValue(selectedMonth);
  const debouncedYear = useDebouncedValue(selectedYear);

  const centersParam =
    !centerAccess || centerAccess.length === 0
      ? undefined
      : debouncedCenter === "ALL"
        ? centerAccess.join(",")
        : String(debouncedCenter);

  if (!permissionLoader && !hasReadPermission) {
    navigate("/unauthorized");
  }

  const fetchBills = useCallback(async () => {
    if (!hasReadPermission) return;

    setLoading(true);
    try {
      const params = { page, limit };
      if (centersParam) params.centers = centersParam;
      if (debouncedMonth !== "ALL") params.month = Number(debouncedMonth);
      if (debouncedYear !== "ALL") params.year = Number(debouncedYear);
      if (fileSort) { params.sortBy = "filesCount"; params.sortOrder = fileSort; }

      const response = await getUtilityBills(params);

      setBills(response?.data || []);
      setPagination(response?.pagination || {});
    } catch (error) {
      setBills([]);
      if (!handleAuthError(error)) {
        toast.error(error?.message || "Failed to load reports");
      }
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    centersParam,
    debouncedMonth,
    debouncedYear,
    page,
    limit,
    hasReadPermission,
    fileSort,
  ]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const handleDeleteConfirm = async () => {
    if (!deleteBillRecord) return;

    setDeleting(true);
    try {
      await deleteUtilityBill(deleteBillRecord._id);
      toast.success("Bill deleted successfully");
      setDeleteBillRecord(null);
      fetchBills();
    } catch (error) {
      toast.error(error?.message || "Failed to delete bill");
    } finally {
      setDeleting(false);
    }
  };

  const hasActiveFilters =
    selectedCenter !== "ALL" ||
    selectedMonth !== "ALL" ||
    selectedYear !== "ALL";
  const noDataMessage = hasActiveFilters
    ? "No bills match the selected filters"
    : "No records found";

  const columns = [
    {
      name: "Author",
      minWidth: "150px",
      selector: (row) => row?.author?.name || "N/A",
    },
    {
      name: "Center",
      minWidth: "150px",
      selector: (row) => row?.center?.title || "—",
    },
    {
      name: "Month",
      minWidth: "120px",
      selector: (row) =>
        row?.month
          ? new Date(2026, row.month - 1, 1).toLocaleString("en-US", {
              month: "long",
            })
          : "—",
    },
    {
      name: "Year",
      minWidth: "80px",
      selector: (row) => row?.year || "—",
    },
    {
      name: "Amount",
      minWidth: "120px",
      selector: (row) =>
        row?.amount != null
          ? Number(row.amount).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          : "—",
    },
    {
      name: "Meter Number",
      minWidth: "150px",
      selector: (row) => row?.meterNumber || "—",
    },
    {
      name: "Unit Used Per Month",
      minWidth: "170px",
      selector: (row) =>
        row?.unitUsed != null
          ? Number(row.unitUsed).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          : "—",
    },
    {
      name: "Comment",
      minWidth: "220px",
      wrap: true,
      cell: (row) => {
        const comment = row?.comment || "";
        if (!comment) return "—";
        return (
          <span
            style={{
              whiteSpace: "normal",
              wordBreak: "break-word",
              paddingBlock: "6px",
            }}
          >
            {comment}
          </span>
        );
      },
    },
    {
      name: "Date Uploaded",
      minWidth: "140px",
      selector: (row) =>
        row?.createdAt
          ? new Date(row.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "—",
    },
    {
      name: "Files",
      cell: (row) => {
        const files = row?.files || [];
        if (!hasReadPermission || files.length === 0) {
          return "—";
        }
        return (
          <div className="d-flex flex-column align-items-start py-1">
            {files.map((file, idx) => (
              <button
                key={file.path || idx}
                type="button"
                className="btn btn-link btn-sm p-0 text-start text-truncate"
                style={{ fontSize: 13, maxWidth: 160 }}
                onClick={() => setViewFile(file)}
                title={file.originalName || file.name}
              >
                {`File ${idx + 1}`}
              </button>
            ))}
          </div>
        );
      },
      ignoreRowClick: true,
      minWidth: "140px",
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="d-flex gap-2">
          {hasWritePermission && (
            <button
              className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
              onClick={() => setEditBill(row)}
              disabled={savingBillId === row._id}
            >
              <Pencil size={16} />
            </button>
          )}
          {hasDeletePermission && (
            <button
              className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
              onClick={() => setDeleteBillRecord(row)}
              disabled={deleting && deleteBillRecord?._id === row._id}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      minWidth: "140px",
    },
  ];

  if (permissionLoader) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "50vh", flex: 1 }}
      >
        <Spinner color="primary" />
      </div>
    );
  }

  return (
    <div
      className="w-100 mt-4 mt-sm-0"
      style={{ flex: 1, width: "100%", maxWidth: "100%", minWidth: 0 }}
    >
      <div className="p-3 p-lg-4">
        <h4 className="fw-bold mb-4">Electricity Bill Reports</h4>

        <div className="d-flex align-items-end gap-2 flex-wrap mb-4">
          <div style={{ minWidth: 200 }}>
            <Select
              options={centerOptions}
              value={
                centerOptions.find((opt) => opt.value === selectedCenter) ||
                centerOptions[0]
              }
              onChange={(opt) => {
                setSelectedCenter(opt?.value || "ALL");
                setPage(1);
              }}
              placeholder="Center..."
            />
          </div>
          <div style={{ minWidth: 180 }}>
            <Select
              options={monthOptions}
              value={
                monthOptions.find((opt) => opt.value === selectedMonth) ||
                monthOptions[0]
              }
              onChange={(opt) => {
                setSelectedMonth(opt?.value || "ALL");
                setPage(1);
              }}
              placeholder="Month..."
            />
          </div>
          <div style={{ minWidth: 150 }}>
            <Select
              options={yearOptions}
              value={
                yearOptions.find((opt) => opt.value === selectedYear) ||
                yearOptions[0]
              }
              onChange={(opt) => {
                setSelectedYear(opt?.value || "ALL");
                setPage(1);
              }}
              placeholder="Year..."
            />
          </div>
          <div style={{ minWidth: 190 }}>
            <Select
              options={fileSortOptions}
              value={fileSortOptions.find((opt) => opt.value === fileSort) || fileSortOptions[0]}
              onChange={(opt) => {
                setFileSort(opt?.value ?? null);
                setPage(1);
              }}
            />
          </div>
        </div>

        <CardBody className="p-0 bg-white" style={{ overflow: "visible" }}>
          <div style={{ overflowX: "auto", width: "100%" }}>
            <DataTableComponent
              columns={columns}
              data={bills}
              pagination={pagination}
              limit={limit}
              setLimit={setLimit}
              page={page}
              setPage={setPage}
              loading={loading}
              noDataComponent={noDataMessage}
            />
          </div>
        </CardBody>
      </div>

      <ViewFileModal
        isOpen={!!viewFile}
        toggle={() => setViewFile(null)}
        file={viewFile}
      />

      <EditBillModal
        isOpen={!!editBill}
        onClose={() => setEditBill(null)}
        bill={editBill}
        onRefresh={fetchBills}
        onSubmittingChange={(isSubmitting) =>
          setSavingBillId(isSubmitting ? editBill?._id : null)
        }
      />

      <DeleteBillModal
        isOpen={!!deleteBillRecord}
        onClose={() => setDeleteBillRecord(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
      />
    </div>
  );
};

export default Reports;
