import { useEffect, useState } from "react";
import { CardBody } from "reactstrap";
import { toast } from "react-toastify";
import { useMediaQuery } from "../../Components/Hooks/useMediaQuery";
import { useAlertsInbox, buildServerParams } from "./components/useAlertsInbox";
import AlertsHeader from "./components/AlertsHeader";
import AlertsFilters from "./components/AlertsFilters";
import AlertsList from "./components/AlertsList";
import AlertDetailOffcanvas from "./components/AlertDetailOffcanvas";
import ResolveAlertModal from "./components/ResolveAlertModal";
import AddNoteModal from "./components/AddNoteModal";
import { usePermissions } from "../../Components/Hooks/useRoles";
import { useNavigate, useSearchParams } from "react-router-dom";
import { exportSopAlerts } from "../../helpers/backend_helper";

// Export params are the inbox's own params minus pagination. Built by REUSING
// buildServerParams rather than re-listing every filter: the two used to be
// separate near-identical translators, so any filter added to one was silently
// dropped by the other and the CSV quietly disagreed with the screen.
const buildExportParams = (f) => {
  const { page, pageSize, ...rest } = buildServerParams(f, 1, 1);
  return rest;
};

// Pull filename out of the Content-Disposition header the server set. Falls
// back to a date-stamped default if the header is missing or unparsable.
const filenameFromResponse = (response) => {
  const cd = response?.headers?.["content-disposition"] || "";
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(cd);
  if (match?.[1]) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }
  return `sop-alerts-${new Date().toISOString().slice(0, 10)}.csv`;
};

const Alerts = () => {
  const isMobile = useMediaQuery("(max-width: 1000px)");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // A dashboard card can deep-link here for one patient's unresolved alerts
  // (see Psychologist/Views/Components/PatientCard.js, opened in a new tab)
  // — pre-seed the patient filter and switch off the default "today only"
  // window so older alerts for that patient aren't hidden. Query params
  // (not router state) so this survives a fresh-tab window.open, not just
  // an in-app navigate.
  const patientId = searchParams.get("patientId");
  const patientName = searchParams.get("patientName");
  const inboxOverrides = patientId
    ? {
        patients: [{ value: patientId, label: patientName || "Patient" }],
        resolvedState: "unresolved",
        dateFrom: null,
        dateTo: null,
      }
    : undefined;
  const inbox = useAlertsInbox(inboxOverrides);

  const microUser = localStorage.getItem("micrologin");
  const token = microUser ? JSON.parse(microUser).token : null;

  const { loading: permissionLoader, hasPermission } = usePermissions(token);

  const hasReadPermission = hasPermission(
    "ALERT",
    null,
    "READ",
  );
  const hasWritePermission = hasPermission(
    "ALERT",
    null,
    "WRITE",
  );

  useEffect(() => {
    if (permissionLoader) return;
    if (!hasReadPermission) {
      navigate("/unauthorized");
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasReadPermission, permissionLoader]);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const selected = selectedId ? inbox.getAlertById(selectedId) : null;

  // Resolve-modal state. `resolveTarget` holds the alert being resolved;
  // `resolving` guards against double-submits while the request is in flight.
  const [resolveTarget, setResolveTarget] = useState(null);
  const [resolving, setResolving] = useState(false);

  const openResolve = (alert) => setResolveTarget(alert);
  const closeResolve = () => {
    if (resolving) return;
    setResolveTarget(null);
  };

  // `text` is the mandatory resolution note, supplied by the modal.
  const submitResolve = async (text) => {
    if (!resolveTarget) return;
    setResolving(true);
    try {
      await inbox.resolveAlert(resolveTarget._id, text);
      toast.success("Alert resolved");
      setResolveTarget(null);
    } catch (err) {
      // The axios interceptor rejects with the UNWRAPPED body, so the message
      // is on err.message. `err.response.data.message` is a dead path — it was
      // making every resolve failure show the generic fallback instead of the
      // server's actual reason.
      toast.error(err?.message || "Failed to resolve alert");
    } finally {
      setResolving(false);
    }
  };

  // Add-note modal state
  const [noteTarget, setNoteTarget] = useState(null);
  const [addingNote, setAddingNote] = useState(false);

  const openAddNote = (alert) => setNoteTarget(alert);
  const closeAddNote = () => {
    if (addingNote) return;
    setNoteTarget(null);
  };

  const submitNote = async (text) => {
    if (!noteTarget) return;
    setAddingNote(true);
    try {
      await inbox.addNote(noteTarget._id, text);
      toast.success("Note added");
      setNoteTarget(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add note");
    } finally {
      setAddingNote(false);
    }
  };

  // CSV export — re-hits the API with the same filter set (no pagination) and
  // hands the resulting blob to an invisible <a download> click. The server
  // dictates the filename via Content-Disposition.
  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const response = await exportSopAlerts(
        buildExportParams(inbox.serverFilters),
      );
      const blob = response?.data;
      if (!(blob instanceof Blob) || blob.size === 0) {
        toast.error("Export returned no data");
        return;
      }
      const filename = filenameFromResponse(response);
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Defer revoke so the browser has actually started the download.
      setTimeout(() => window.URL.revokeObjectURL(objectUrl), 0);
      const totalRows = response?.headers?.["x-total-rows"];
      toast.success(
        totalRows
          ? `Exported ${Number(totalRows).toLocaleString()} alert${
              totalRows === "1" ? "" : "s"
            }`
          : "Export downloaded",
      );
    } catch (err) {
      // Blob errors come back as Blob — read it to surface the server message.
      let msg = err?.message || "Export failed";
      if (err?.data instanceof Blob && err.data.type?.includes("json")) {
        try {
          const parsed = JSON.parse(await err.data.text());
          if (parsed?.message) msg = parsed.message;
        } catch {
          /* fall through to default msg */
        }
      } else if (typeof err?.message === "string" && err.message) {
        msg = err.message;
      }
      toast.error(msg);
    } finally {
      setExporting(false);
    }
  };

  // react-data-table-component passes (row, event). Stopping propagation
  // prevents the click from bubbling past the row while the Offcanvas
  // backdrop is mounting. markRead is deferred so it doesn't mutate the
  // alerts array in the same commit that opens the offcanvas — otherwise
  // DataTable re-renders mid-click and the first click is lost.
  const openDetail = (alert, e) => {
    if (e && typeof e.stopPropagation === "function") e.stopPropagation();
    setSelectedId(alert._id);
    setDetailOpen(true);
    if (!alert.isRead) {
      setTimeout(() => inbox.markRead(alert._id), 0);
    }
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setSelectedId(null);
  };

  return (
    <div className="page-content">
      <CardBody
        className="p-3 bg-white"
        style={isMobile ? { width: "100%" } : { width: "100%" }}
      >
        <AlertsHeader
          hasWritePermission={hasWritePermission}
          unreadCount={inbox.totalUnread}
          totalCount={inbox.total}
          loading={inbox.loading}
          bulkLoading={inbox.bulkLoading}
          exporting={exporting}
          onMarkAllRead={inbox.markAllRead}
          onRefresh={inbox.load}
          onExport={handleExport}
        />

        <AlertsFilters
          total={inbox.total}
          serverFilters={inbox.serverFilters}
          onServerFilterChange={inbox.setServerFilter}
          onClearServerFilters={inbox.clearServerFilters}
          onToggleSeverity={inbox.toggleSeverity}
          onClearSeverity={inbox.clearSeverityFilter}
        />

        <AlertsList
          alerts={inbox.alerts}
          total={inbox.total}
          page={inbox.page}
          pageSize={inbox.pageSize}
          loading={inbox.loading}
          canResolve={hasWritePermission}
          onSelect={openDetail}
          onResolve={openResolve}
          onAddNote={openAddNote}
          onPageChange={inbox.setPage}
          onPageSizeChange={inbox.setPageSize}
        />

        <AlertDetailOffcanvas
          isOpen={detailOpen}
          onClose={closeDetail}
          alert={selected}
          canResolve={hasWritePermission}
          onResolve={() => openResolve(selected)}
        />

        <ResolveAlertModal
          isOpen={!!resolveTarget}
          alert={resolveTarget}
          submitting={resolving}
          onClose={closeResolve}
          onSubmit={submitResolve}
        />

        <AddNoteModal
          isOpen={!!noteTarget}
          alert={noteTarget}
          submitting={addingNote}
          onClose={closeAddNote}
          onSubmit={submitNote}
        />
      </CardBody>
    </div>
  );
};

export default Alerts;
