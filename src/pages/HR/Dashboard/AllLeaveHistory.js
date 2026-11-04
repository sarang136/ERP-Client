import React, { useEffect, useRef, useState } from 'react'
import { changeLeaveStatusByHR, directCancellation, getAllLeaves } from '../../../helpers/backend_helper';
import { toast } from 'react-toastify';
import { CardBody, Nav, NavItem, NavLink } from 'reactstrap';
import { useMediaQuery } from '../../../Components/Hooks/useMediaQuery';
import classnames from "classnames";
import DataTableComponent from '../../../Components/Common/DataTable';
import { allLeavesColumn } from '../components/columns/AllLeavesColumn';
import CancellationConfirmationModal from '../components/CancellationConfirmationModal';
import { useSelector } from 'react-redux';
import Select from "react-select";
import { usePermissions } from '../../../Components/Hooks/useRoles';
import { useCenterOptions } from '../../../Components/Hooks/useCenterOptions';

const AllLeaveHistory = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const isMobile = useMediaQuery("(max-width: 1000px)");
  const [doc, setDoc] = useState([]);
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [approveLoaderId, setApproveLoaderId] = useState(null);
  const [cancelLoaderId, setCancelLoaderId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCenter, setSelectedCenter] = useState("ALL");

  const user = useSelector((state) => state.User);

  const microUser = localStorage.getItem("micrologin");
  const token = microUser ? JSON.parse(microUser).token : null;
  const { hasPermission } = usePermissions(token);
  const hasWrite = hasPermission("HR", "ALL_LEAVE_HISTORY", "WRITE");
  const hasDelete = hasPermission("HR", "ALL_LEAVE_HISTORY", "DELETE");


  const pendingRequestRef = useRef(null);

  const loadAllLeaves = async () => {
    pendingRequestRef.current?.abort();
    const controller = new AbortController();
    pendingRequestRef.current = controller;

    setLoading(true);
    try {
      let centers = [];
      if (selectedCenter === "") {
        centers = [];
      } else if (selectedCenter === "ALL") {
        centers = user?.centerAccess || [];
      } else {
        centers = [selectedCenter];
      }
      const response = await getAllLeaves({
        status: activeTab,
        year: selectedYear,
        month: selectedMonth,
        page,
        limit,
        search: debouncedSearch,
        centers

      }, controller.signal)
      setDoc(response?.data)
      setPagination({
        ...response?.pagination,
        totalDocs: response?.pagination?.totalRecords,
      });
    } catch (error) {
      if (error.name === "AbortError" || error.code === "ERR_CANCELED") return;
      toast.error(error);
    } finally {
      if (pendingRequestRef.current === controller) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    loadAllLeaves();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedYear, selectedMonth, page, limit, debouncedSearch, selectedCenter, user?.centerAccess])

  const leaves = doc || [];

  const currentYear = new Date().getFullYear();
  const allYears = Array.from(
    { length: currentYear - 2015 + 6 },
    (_, i) => 2015 + i,
  );

  const handleAction = async (row, status) => {
    setApproveLoaderId(row?._id);
    try {
      const payload = {
        docId: row?.parentDocId,
        leaveId: row?._id,
        status,
      }
      const response = await changeLeaveStatusByHR(payload);
      toast.success(response?.message || `Leave status changed to ${status}`)
      loadAllLeaves();

    } catch (error) {
      toast.error(error?.message || `Something went wrong.`)
    } finally {
      setApproveLoaderId(null);
    }
  }

  const openCancelModal = (row) => {
    setSelectedLeave(row);
    setShowCancelModal(true);
  };

  const handleCancel = async (row, reason = "") => {

    setCancelLoaderId(row?._id);

    try {
      const payload = {
        docId: row?.parentDocId,
        leaveId: row?._id,
        employeeId: row?.employee?._id,
        reason,
      };

      const res = await directCancellation(payload);

      toast.success(res?.message || "Leave Cancelled");
      loadAllLeaves();

    } catch (err) {
      toast.error(err?.message || "Failed to cancel");
    } finally {
      setCancelLoaderId(null);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);



  const centerOptions = useCenterOptions();


  useEffect(() => {
    if (
      selectedCenter !== "ALL" &&
      !user?.centerAccess?.includes(selectedCenter)
    ) {
      setSelectedCenter("ALL");
    }
  }, [selectedCenter, user?.centerAccess]);

  return (
    <CardBody
      className="p-3 bg-white"
      style={isMobile ? { width: "100%" } : { width: "78%" }}
    >
      <div className="text-center text-md-left mb-4">
        <h1 className="display-6 fw-bold text-primary">ALL LEAVES HISTORY</h1>
      </div>

      <Nav tabs className="mb-3">
        {["pending", "approved", "rejected", "retrieved", "cancelled"].map((tab) => (
          <NavItem key={tab}>
            <NavLink
              className={classnames({ active: activeTab === tab })}
              onClick={() => setActiveTab(tab)}
              style={{ cursor: "pointer", fontWeight: 500 }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </NavLink>
          </NavItem>
        ))}
      </Nav>

      <div className="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-3">

        {/* Left Section */}
        <div className="d-flex flex-wrap align-items-end gap-2">

          {/* Search */}
          <div style={{ minWidth: "220px" }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by Name or ECode"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Center Select */}
          <div style={{ minWidth: "180px" }}>
            <Select
              options={centerOptions}
              value={centerOptions.find(c => c.value === selectedCenter) || null}
              onChange={(selected) => setSelectedCenter(selected ? selected.value : "")}
              placeholder="Select Center"
              isDisabled={!centerOptions.length}
            />
          </div>

          {/* Year */}
          <div>
            <select
              className="form-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="all">All Years</option>
              {allYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Month */}
          <div>
            <select
              className="form-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="all">All Months</option>
              {[
                "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
              ].map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Right Section */}
        <div className="text-nowrap">
          <span className="fw-semibold text-muted">
            Total Records: {pagination?.totalRecords}
          </span>
        </div>

      </div>

      <DataTableComponent
        columns={allLeavesColumn(
          activeTab,
          handleAction,
          approveLoaderId,
          handleCancel,
          openCancelModal,
          cancelLoaderId,
          hasWrite,
          hasDelete,
        )}
        data={leaves}
        loading={loading}
        pagination={pagination}
        page={page}
        setPage={setPage}
        limit={limit}
        setLimit={setLimit}
      />

      <CancellationConfirmationModal
        show={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        leave={selectedLeave}
        onConfirm={(reason) => {
          handleCancel(selectedLeave, reason);
          setShowCancelModal(false);
        }}
        loading={cancelLoaderId}
      />

    </CardBody>
  )
}

export default AllLeaveHistory