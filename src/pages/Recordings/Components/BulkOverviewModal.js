import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Spinner,
  Table,
  Input,
  Alert,
} from "reactstrap";
import { getCallRecordings } from "../../../helpers/backend_helper";
import Select from "react-select";
import {
  defaultDateRange,
  todayInputValue,
  validateDateRange,
} from "../Helpers/dateRange";

const BulkOverviewModal = ({
  isOpen,
  toggle,
  onGenerate,
  currentFilters,
  queueStatus,
}) => {
  // --- State Management ---
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [talkTimeFilter, setTalkTimeFilter] = useState("");
  const [recordings, setRecordings] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [page, setPage] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);
  // The filters the current list was fetched with. "Generate All" uses these,
  // not whatever is typed in the inputs but not yet applied with Filter, so it
  // always queues exactly the total on screen.
  const [appliedFilters, setAppliedFilters] = useState(null);
  const LIMIT = 200;

  const isQueueRunning = Boolean(queueStatus?.running);
  const progress = queueStatus?.progress || 0;
  const busy = isSubmitting || isQueueRunning;

  // Read on every render rather than once, so a tab left open past midnight
  // still caps the pickers at the real today.
  const today = todayInputValue();
  const dateError = useMemo(
    () => validateDateRange(fromDate, toDate),
    [fromDate, toDate],
  );

  const talkTimeOptions = [
    { value: "", label: "All Durations" },
    { value: "0_2", label: "0 - 2 min" },
    { value: "2_5", label: "2 - 5 min" },
    { value: "5_10", label: "5 - 10 min" },
    { value: "10_15", label: "10 - 15 min" },
    { value: "over_15", label: "Over 15 min" },
  ];

  const resetForm = useCallback(() => {
    const fallback = defaultDateRange();
    setFromDate(currentFilters.fromDate || fallback.fromDate);
    setToDate(currentFilters.toDate || fallback.toDate);
    setTalkTimeFilter("");
    setRecordings([]);
    setSelectedIds([]);
    setPage(1);
    setTotalDocs(0);
    setAppliedFilters(null);
    setLoading(false);
    setIsSubmitting(false);
  }, [currentFilters]);


  // `override` lets a caller fetch with values it has only just set — reading
  // them from state here would use the previous render's, which is why opening
  // the modal never loaded anything.
  const fetchRecordings = async (pageNum = 1, isAppend = false, override = {}) => {
    const from = override.fromDate !== undefined ? override.fromDate : fromDate;
    const to = override.toDate !== undefined ? override.toDate : toDate;
    const talkTime =
      override.talkTime !== undefined ? override.talkTime : talkTimeFilter;

    // No dates and no talk time is a valid request: every pending recording,
    // still paged LIMIT at a time.
    if (validateDateRange(from, to)) return;

    if (isAppend) setLoadingMore(true);
    else setLoading(true);

    try {
      const response = await getCallRecordings({
        fromDate: from,
        toDate: to,
        ...(talkTime && { talkTime }),
        overview: "not_generated",
        // Recordings already waiting on the transcription service are not
        // offered again — selecting them would inflate the run without
        // transcribing anything extra.
        excludeQueued: true,
        page: pageNum,
        limit: LIMIT,
      });

      const rawData = response?.data || [];
      const total = response?.pagination?.totalRecords || 0;

      if (isAppend) {
        setRecordings((prev) => [...prev, ...rawData]);
        setSelectedIds((prev) => [...prev, ...rawData.map((r) => r._id)]);
      } else {
        setRecordings(rawData);
        setSelectedIds(rawData.map((r) => r._id));
        setPage(1);
        setAppliedFilters({ fromDate: from, toDate: to, talkTime });
      }

      setTotalDocs(total);
    } catch (error) {
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };
  useEffect(() => {
    if (isOpen) {
      // Falls back to the default range when the page has no date filter of its
      // own, so the modal opens on a usable selection instead of an empty table.
      const fallback = defaultDateRange();
      const start = currentFilters.fromDate || fallback.fromDate;
      const end = currentFilters.toDate || fallback.toDate;
      setFromDate(start);
      setToDate(end);
      setTalkTimeFilter("");
      fetchRecordings(1, false, { fromDate: start, toDate: end, talkTime: "" });
    } else {
      resetForm();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchRecordings(nextPage, true);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === recordings.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(recordings.map((r) => r._id));
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const queued = await onGenerate(selectedIds);

      // Re-filter so what was just queued drops off the list — it is no longer
      // selectable, and leaving it there invites picking it again.
      if (queued) {
        await fetchRecordings(1, false);
      }
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateAll = async () => {
    if (!appliedFilters || totalDocs === 0) return;

    const { fromDate: from, toDate: to } = appliedFilters;
    const range =
      from || to
        ? `from ${from || "the beginning"} to ${to || "today"}`
        : "across all dates";

    const ok = window.confirm(
      `Generate overviews for all ${totalDocs.toLocaleString()} pending recordings ${range}?\n\n` +
        "They are processed one at a time in the background, so a large run can take many hours.",
    );
    if (!ok) return;

    setIsSubmitting(true);
    try {
      const queued = await onGenerate({ all: true, filters: appliedFilters });
      if (queued) {
        await fetchRecordings(1, false, appliedFilters);
      }
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  const canFilter = !dateError;
  const noFilterApplied =
    appliedFilters &&
    !appliedFilters.fromDate &&
    !appliedFilters.toDate &&
    !appliedFilters.talkTime;

  return (
    <Modal
      isOpen={isOpen}
      toggle={isSubmitting ? undefined : toggle}
      centered
      size="lg"
      backdrop={isSubmitting ? "static" : true}
      keyboard={!isSubmitting}
    >
      <ModalHeader toggle={isSubmitting ? undefined : toggle}>
        Refine Bulk Overview Selection
      </ModalHeader>
      <ModalBody>
        {/* Inputs Row */}
        <div className="row g-2 mb-3 align-items-end">
          <div className="col-md-3">
            <label className="small fw-bold">From</label>
            <div className="position-relative">
              <Input
                type="date"
                size="sm"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                max={toDate && toDate < today ? toDate : today}
                invalid={Boolean(dateError)}
                disabled={isSubmitting}
                className="pe-4"
              />
              {fromDate && (
                <button
                  type="button"
                  onClick={() => setFromDate("")}
                  className="position-absolute border-0 bg-transparent"
                  style={{
                    right: "25px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#999",
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="col-md-3">
            <label className="small fw-bold">To</label>
            <div className="position-relative">
              <Input
                type="date"
                size="sm"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                min={fromDate || undefined}
                max={today}
                invalid={Boolean(dateError)}
                disabled={isSubmitting}
                className="pe-4"
              />
              {toDate && (
                <button
                  type="button"
                  onClick={() => setToDate("")}
                  className="position-absolute border-0 bg-transparent"
                  style={{
                    right: "25px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#999",
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="col-md-4">
            <label className="small fw-bold">Talk Time</label>
            <Select
              options={talkTimeOptions}
              value={
                talkTimeOptions.find((opt) => opt.value === talkTimeFilter) ||
                null
              }
              onChange={(opt) => setTalkTimeFilter(opt ? opt.value : "")}
              placeholder="Select Talk Time"
              isDisabled={isSubmitting}
              isClearable
              // Adding styles to match your UI height
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: "31px",
                  height: "31px",
                }),
                indicatorsContainer: (base) => ({
                  ...base,
                  height: "31px",
                }),
                valueContainer: (base) => ({
                  ...base,
                  height: "31px",
                  padding: "0 8px",
                }),
              }}
            />
          </div>

          <div className="col-md-2">
            <Button
              color="primary"
              size="sm"
              className="w-100"
              onClick={() => fetchRecordings(1, false)}
              disabled={loading || !canFilter || isSubmitting}
            >
              {loading ? <Spinner size="sm" /> : "Filter"}
            </Button>
          </div>
        </div>

        {dateError && (
          <Alert
            color="danger"
            className="p-2 py-1 mb-2 border-0"
            style={{ fontSize: "13px" }}
          >
            <i className="ri-error-warning-line me-1"></i>
            {dateError}
          </Alert>
        )}

        {isQueueRunning && (
          <Alert
            color="info"
            className="p-2 py-1 mb-2 border-0 d-flex align-items-center"
            style={{ fontSize: "13px" }}
          >
            <Spinner size="sm" className="me-2" />
            <span>
              A bulk overview run is already in progress —{" "}
              <strong>
                {queueStatus.completed}/{queueStatus.total}
              </strong>{" "}
              done. It resumes automatically if the server restarts. Generating
              is disabled until it finishes.
            </span>
          </Alert>
        )}

        {/* --- NEW WARNING MESSAGE --- */}
        <Alert
          color="warning"
          className="p-2 py-1 mb-2 border-0"
          style={{ fontSize: "13px" }}
        >
          <i className="ri-error-warning-line me-1"></i>
          <strong>Note:</strong> Recordings already queued for transcription are
          hidden. Only recordings with{" "}
          <strong>no generated overview</strong> or{" "}
          <strong>API/server errors</strong> are listed here.
        </Alert>

        <hr className="mt-1" />

        <div
          style={{ maxHeight: "350px", overflowY: "auto" }}
          className="border rounded"
        >
          <Table
            hover
            responsive
            size="sm"
            className="align-middle mb-0 text-nowrap"
          >
            <thead
              className="table-light text-uppercase"
              style={{ position: "sticky", top: 0, zIndex: 1 }}
            >
              <tr>
                <th style={{ width: "40px" }}>
                  <Input
                    type="checkbox"
                    checked={
                      recordings.length > 0 &&
                      selectedIds.length === recordings.length
                    }
                    onChange={toggleSelectAll}
                    disabled={
                      loading || recordings.length === 0 || isSubmitting
                    }
                  />
                </th>
                <th>Date</th>
                <th>Agent</th>
                <th>UCID</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {!loading && recordings.length > 0
                ? recordings.map((row) => (
                    <tr key={row._id}>
                      <td>
                        <Input
                          type="checkbox"
                          checked={selectedIds.includes(row._id)}
                          onChange={() => handleSelectRow(row._id)}
                          disabled={isSubmitting}
                        />
                      </td>
                      <td>{new Date(row.Call_Date).toLocaleDateString()}</td>
                      <td>{row.Agent || "N/A"}</td>
                      <td className="small text-muted">{row.UCID}</td>
                      <td>{row.Talk_Time || "0"} min</td>
                    </tr>
                  ))
                : !loading && (
                    <tr>
                      <td colSpan="5" className="text-center p-4 text-muted">
                        {!appliedFilters
                          ? "Click Filter to view pending recordings."
                          : "No pending recordings found for this selection."}
                      </td>
                    </tr>
                  )}
            </tbody>
          </Table>

          {loading && (
            <div className="text-center p-5">
              <Spinner color="primary" />
            </div>
          )}

          {!loading &&
            recordings.length > 0 &&
            recordings.length < totalDocs && (
              <div className="text-center p-3 border-top">
                <Button
                  color="link"
                  size="sm"
                  onClick={handleLoadMore}
                  disabled={loadingMore || isSubmitting}
                >
                  {loadingMore ? <Spinner size="sm" className="me-2" /> : null}
                  Load More
                </Button>
              </div>
            )}
        </div>

        <div className="mt-3 p-2 bg-light border rounded d-flex justify-content-between align-items-center flex-wrap gap-2">
          <span className="fw-bold text-primary">
            Pending Selection: {selectedIds.length}
          </span>
          <span className="fw-bold">
            Total Records: {totalDocs.toLocaleString()}
            {appliedFilters && (
              <span className="text-muted small fw-normal ms-1">
                {noFilterApplied
                  ? "(all dates)"
                  : `(showing ${recordings.length.toLocaleString()})`}
              </span>
            )}
          </span>
        </div>
      </ModalBody>

      <ModalFooter className="d-flex align-items-center justify-content-between">
        <div className="flex-grow-1 me-3" style={{ minHeight: "45px" }}>
          {busy && (
            <div className="w-100">
              <div className="d-flex justify-content-between mb-1">
                <span className="small fw-bold text-primary">
                  {isQueueRunning
                    ? `AI Processing... ${queueStatus.completed} of ${queueStatus.total} recordings`
                    : "Queueing..."}
                </span>
                <span className="small fw-bold text-primary">{progress}%</span>
              </div>
              <div className="progress" style={{ height: "10px" }}>
                <div
                  className="progress-bar progress-bar-striped progress-bar-animated bg-success"
                  role="progressbar"
                  style={{
                    width: `${progress}%`,
                    transition: "width 0.4s ease",
                  }}
                ></div>
              </div>
              {isQueueRunning && (
                <div className="small text-muted mt-1">
                  {queueStatus.done} generated · {queueStatus.failed} failed —
                  runs in the background, safe to close this window.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="d-flex gap-2">
          <Button color="secondary" onClick={toggle} disabled={isSubmitting}>
            {isQueueRunning ? "Close" : "Cancel"}
          </Button>
          <Button
            color="primary"
            outline
            onClick={handleGenerateAll}
            disabled={loading || busy || !appliedFilters || totalDocs === 0}
            title="Queue every pending recording matching the applied filters, not just the ones loaded below"
          >
            {`Generate All (${totalDocs.toLocaleString()})`}
          </Button>
          <Button
            color="success"
            onClick={handleSubmit}
            disabled={loading || busy || selectedIds.length === 0}
            style={{ minWidth: "140px" }}
          >
            {busy ? (
              <>
                <Spinner size="sm" className="me-2" />
                Processing
              </>
            ) : (
              `Generate (${selectedIds.length})`
            )}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default BulkOverviewModal;
