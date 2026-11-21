import React, { useState, useEffect, useRef } from 'react'
import { bulkGenerateOverviewRecording, generateOverviewRecording, getBulkOverviewStatus, getCallRecordings, uploadXlsx } from '../../../helpers/backend_helper';
import { toast } from 'react-toastify';
import { CardBody, Label, Spinner } from 'reactstrap';
import { useMediaQuery } from '../../../Components/Hooks/useMediaQuery';
import DataTableComponent from '../../../Components/Common/DataTable';
import { callRecordingsColumns } from '../Columns/callRecordingsColumn';
import { useNavigate } from "react-router-dom";
import GenerateOverviewModal from '../Components/GenerateOverviewModal';
import Select from "react-select";
import BulkOverviewModal from '../Components/BulkOverviewModal';
import UploadXlsxModal from '../Components/UploadXlsxModal';
import { usePermissions } from '../../../Components/Hooks/useRoles';
import { FaFilter } from 'react-icons/fa';
import { defaultDateRange, todayInputValue, validateDateRange } from '../Helpers/dateRange';

const CallRecordings = () => {
  const isMobile = useMediaQuery("(max-width: 1000px)");

  const navigate = useNavigate();

  // Opens on the last two days through today rather than the whole archive.
  // Clearing either
  // field with its ✕ widens the range again. Resolved once, so the two fields
  // cannot straddle midnight.
  const [initialRange] = useState(defaultDateRange);
  const [fromDate, setFromDate] = useState(initialRange.fromDate);
  const [toDate, setToDate] = useState(initialRange.toDate);
  const [loading, setLoading] = useState(false);
  const [recordings, setRecordings] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalDocs: 0
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [agentOrUcid, setAgentOrUcid] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [debouncedLocation, setDebouncedLocation] = useState("");
  const [overviewFilter, setOverviewFilter] = useState("");
  const [talkTimeFilter, setTalkTimeFilter] = useState("");
  const [, setSelectedRows] = useState([]);
  const [showBulkOverviewModal, setShowBulkOverviewModal] = useState(false);
  const [queueStatus, setQueueStatus] = useState({
    running: false,
    busy: false,
    total: 0,
    completed: 0,
    done: 0,
    failed: 0,
    progress: 0,
    queuedSingles: 0
  });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const token = JSON.parse(localStorage.getItem("user"))?.token;
  const { hasPermission } = usePermissions(token);

  const hasWritePermission = hasPermission("RECORDINGS", "CALL_RECORDINGS", "WRITE");
  const hasDeletePermission = hasPermission("RECORDINGS", "CALL_RECORDINGS", "DELETE");
  const canAction = hasWritePermission || hasDeletePermission;

  // const fileInputRef = useRef(null);

  const loadRecordings = async (page = pagination?.page, limit = pagination?.limit) => {
    // Don't query on a range the user is midway through correcting — the
    // message under the filters explains what is wrong.
    if (validateDateRange(fromDate, toDate)) return;

    setLoading(true);

    try {
      const response = await getCallRecordings({
        fromDate,
        toDate,
        page,
        limit,
        search: debouncedSearch,
        location: debouncedLocation,
        overview: overviewFilter,
        talkTime: talkTimeFilter
      });


      setRecordings(response?.data || []);

      setPagination({
        ...response?.pagination,
        totalDocs: response?.pagination?.totalRecords
      });

    } catch (error) {
      toast.error("Failed to load recordings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecordings(page, limit);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, debouncedSearch, debouncedLocation, overviewFilter, talkTimeFilter]);

  const HandleGenerateOverview = async () => {
    setGenerateLoading(true);
    try {
      const id = selectedRecording?._id
      const recordingUrl = selectedRecording?.Files?.recording_url
      const response = await generateOverviewRecording(id, recordingUrl);
      if (response?.queueStatus) setQueueStatus(response.queueStatus);
      toast.success(response?.message || "Recording queued for transcription.");
      setShowGenerateModal(false);
      pollNowRef.current();
      // Reload so the row swaps its Generate button for "Queued" straight away
      // rather than only when the whole queue drains.
      loadRecordings(page, limit);
    } catch (error) {
      toast.error(error?.message || "Failed to queue overview");
    } finally {
      setGenerateLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(agentOrUcid);
    }, 400);

    return () => clearTimeout(timer);
  }, [agentOrUcid]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLocation(locationSearch);
    }, 400);

    return () => clearTimeout(timer);
  }, [locationSearch]);


  const overviewOptions = [
    { value: "", label: "Sort By Overview" },
    { value: "generated", label: "Generated" },
    { value: "not_generated", label: "Not Generated" },
  ];

  const talkTimeOptions = [
    { value: "", label: "Talk Time" },
    { value: "0_2", label: "0 - 2 min" },
    { value: "2_5", label: "2 - 5 min" },
    { value: "5_10", label: "5 - 10 min" },
    { value: "10_15", label: "10 - 15 min" },
    { value: "over_15", label: "Over 15 min" }
  ];

  const refreshRef = useRef(() => { });
  const inFlightRef = useRef(null);
  const pollNowRef = useRef(() => { });

  const today = todayInputValue();
  const dateError = validateDateRange(fromDate, toDate);

  useEffect(() => {
    refreshRef.current = () => loadRecordings(page, limit);
  });

  const fetchQueueStatus = async () => {
    try {
      const response = await getBulkOverviewStatus();
      if (response?.queueStatus) setQueueStatus(response.queueStatus);
      return response?.queueStatus || null;
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    let cancelled = false;
    let timer;

    const tick = async () => {
      const status = await fetchQueueStatus();
      if (cancelled) return;
      if (!status) {
        timer = setTimeout(tick, 5000);
        return;
      }

      // Queue just drained — pull in the overviews it generated.
      const wasInFlight = inFlightRef.current;
      if (wasInFlight && !status.busy) {
        toast.success(
          wasInFlight.running
            ? `Bulk overview generation finished — ${status.done || 0} succeeded, ${status.failed || 0} failed.`
            : "Overview generation finished."
        );
        refreshRef.current();
      }
      inFlightRef.current = status.busy ? status : null;

      timer = setTimeout(tick, status.busy ? 3000 : 20000);
    };

    pollNowRef.current = () => {
      clearTimeout(timer);
      tick();
    };

    tick();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      pollNowRef.current = () => { };
    };
  }, []);

  // `selection` is either an array of recording IDs, or
  // { all: true, filters: { fromDate, toDate, talkTime } } to queue every
  // pending recording matching those filters (no dates = all dates).
  const handleGenerateBulkOverview = async (selection) => {
    try {
      const payload = Array.isArray(selection) ? { ids: selection } : selection;
      const response = await bulkGenerateOverviewRecording(payload);

      if (response?.queueStatus) setQueueStatus(response.queueStatus);

      if (!response?.queued) {
        toast.info(response?.message || "No eligible recordings to queue.");
        return false;
      }
      inFlightRef.current = response.queueStatus || { running: true };
      toast.success(response?.message);
      pollNowRef.current();
      // Reload so the queued rows show their state instead of a Generate button.
      loadRecordings(page, limit);
      return true;
    } catch (error) {
      if (error?.queueStatus) setQueueStatus(error.queueStatus);
      toast.error(error?.message || "Failed during bulk generation");
      return false;
    }
  };



  // 
  const handleUploadFile = async (file) => {

    const formData = new FormData();
    formData.append("file", file);

    try {

      setUploading(true);

      await uploadXlsx(formData);

      toast.success("File uploaded successfully");

      loadRecordings(page, limit);

      setShowUploadModal(false);

    } catch (error) {
      toast.error(error?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <CardBody
        className="p-3 bg-white"
        style={isMobile ? { width: "100%" } : { width: "78%" }}
      >
        <div className="text-center text-md-left mb-4">
          <h1 className="display-6 fw-bold text-primary">CALL RECORDINGS</h1>
        </div>

        {/* Filters */}
        <div className={`d-flex gap-3 mb-3 ${isMobile ? "flex-wrap" : ""}`}>
          <div style={{ width: isMobile ? "35%" : "auto" }}>
            <label>From Date</label>
            <div style={{ position: "relative" }}>
              <input
                type="date"
                className={`form-control pe-5 ${dateError ? "is-invalid" : ""}`}
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                max={toDate && toDate < today ? toDate : today}
              />

              {fromDate && (
                <button
                  type="button"
                  onClick={() => setFromDate("")}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    border: "none",
                    background: "transparent",
                    fontSize: "16px",
                    cursor: "pointer",
                    lineHeight: 1
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div style={{ width: isMobile ? "35%" : "auto" }}>
            <label>To Date</label>
            <div style={{ position: "relative" }}>
              <input
                type="date"
                className={`form-control pe-5 ${dateError ? "is-invalid" : ""}`}
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                min={fromDate || undefined}
                max={today}
              />

              {toDate && (
                <button
                  type="button"
                  onClick={() => setToDate("")}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    border: "none",
                    background: "transparent",
                    fontSize: "16px",
                    cursor: "pointer",
                    lineHeight: 1
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>


          <div className="d-flex align-items-end" style={{ width: isMobile ? "20%" : "auto" }}>
            <button
              className="btn btn-primary px-4"
              style={{ height: "38px" }}
              onClick={() => loadRecordings(page, limit)}
              disabled={loading || Boolean(dateError)}
            >
              {loading ? (
                <Spinner size="sm" />
              ) : isMobile ? (
                <FaFilter />
              ) : (
                "Filter"
              )}
            </button>
          </div>


        </div>

        {dateError && (
          <div className="text-danger small mb-3">
            <i className="ri-error-warning-line me-1"></i>
            {dateError}
          </div>
        )}

        <div
          className={`d-flex mb-3 ${isMobile
            ? "flex-column gap-2"
            : "justify-content-between align-items-center"
            }`}
        >

          {/* LEFT SIDE FILTERS */}
          <div
            className={`d-flex gap-3 ${isMobile ? "flex-wrap" : ""
              }`}
          >

            <div>
              <input
                type="text"
                className="form-control"
                placeholder="Enter Agent name or UCID"
                value={agentOrUcid}
                onChange={(e) => setAgentOrUcid(e.target.value)}
              />
            </div>

            <div>
              <input
                type="text"
                className="form-control"
                placeholder="Enter Location"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
              />
            </div>

            <div style={{ width: "150px" }}>
              <Select
                options={talkTimeOptions}
                value={talkTimeOptions.find(opt => opt.value === talkTimeFilter)}
                onChange={(selected) => setTalkTimeFilter(selected?.value || "")}
                placeholder="Talk Time"
                isSearchable={false}
              />
            </div>

          </div>

          {/* RIGHT SIDE BUTTONS */}
          {canAction && <div className={`d-flex gap-2 ${isMobile ? "flex-column w-100" : ""
            }`}>

            <button
              className="btn btn-success"
              // disabled={selectedRows.length === 0}
              onClick={() => setShowBulkOverviewModal(true)}
            >
              {queueStatus.running ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  {`Generating ${queueStatus.completed}/${queueStatus.total}`}
                </>
              ) : (
                "Generate Overview"
              )}
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => setShowUploadModal(true)}
            >
              Upload XLSX
            </button>

          </div>}

        </div>

        <div className="d-flex justify-content-end align-items-center gap-3 mb-3">
          <Label className="mb-0 text-dark">
            Total Recordings: {pagination.totalDocs}
          </Label>

          {queueStatus.busy && (
            <Label className="mb-0 text-primary small d-flex align-items-center">
              <Spinner size="sm" className="me-2" />
              {queueStatus.running
                ? `Transcribing ${queueStatus.completed}/${queueStatus.total}`
                : `${queueStatus.queuedSingles} queued for transcription`}
            </Label>
          )}
          <div style={{ width: "120px" }}>
            <Select
              options={overviewOptions}
              value={overviewOptions.find(opt => opt.value === overviewFilter)}
              onChange={(selected) => setOverviewFilter(selected?.value || "")}
              placeholder="Filter By Overview"
              isSearchable={false}
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: "38px",
                  height: "38px",
                  fontSize: "14px"
                }),
                indicatorsContainer: (base) => ({
                  ...base,
                  height: "38px"
                }),
                valueContainer: (base) => ({
                  ...base,
                  height: "38px",
                  padding: "0 8px"
                })
              }}
            />
          </div>

        </div>

        <DataTableComponent
          columns={callRecordingsColumns(
            page,
            limit,
            navigate,
            recordings,
            setSelectedRecording,
            setShowGenerateModal,
            canAction
          )}
          loading={loading}
          data={recordings}
          pagination={pagination}
          page={page}
          setPage={setPage}
          limit={limit}
          setLimit={setLimit}
          selectableRows={true}
          onSelectedRowsChange={({ selectedRows }) => setSelectedRows(selectedRows)}
        />

        <GenerateOverviewModal
          isOpen={showGenerateModal}
          toggle={() => setShowGenerateModal(false)}
          selectedRecording={selectedRecording}
          onGenerate={HandleGenerateOverview}
          loading={generateLoading}
        />

      </CardBody>
      <BulkOverviewModal
        isOpen={showBulkOverviewModal}
        toggle={() => setShowBulkOverviewModal(false)}
        onGenerate={handleGenerateBulkOverview}
        selectedRows={recordings}
        totalAvailable={pagination.totalDocs}
        currentFilters={{ fromDate, toDate }}
        queueStatus={queueStatus}
      />
      <UploadXlsxModal
        isOpen={showUploadModal}
        toggle={() => setShowUploadModal(false)}
        onUpload={handleUploadFile}
        loading={uploading}
      />
    </>
  )
}

export default CallRecordings