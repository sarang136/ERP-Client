import { useEffect, useState } from "react";
import { Badge, Button, Spinner } from "reactstrap";
import { toast } from "react-toastify";
import PropTypes from "prop-types";
import CustomModal from "../../../../Components/Common/Modal";
import {
  getAllSopAlerts,
  markSopAlertRead,
  resolveSopAlert,
} from "../../../../helpers/backend_helper";
import {
  SEVERITY_COLOR,
  SEVERITY_HEX,
} from "../../../Alerts/components/alertConstants";
import { timeAgo, alertSourceLabel } from "../../../Alerts/components/alertUtils";
import AlertDetailOffcanvas from "../../../Alerts/components/AlertDetailOffcanvas";
import ResolveAlertModal from "../../../Alerts/components/ResolveAlertModal";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { usePermissions } from "../../../../Components/Hooks/useRoles";

const PAGE_SIZE = 10;

const PatientAlertsModal = ({ isOpen, toggle, patientId, patientName }) => {
  const handleAuthError = useAuthError();
  const microUser = localStorage.getItem("micrologin");
  const token = microUser ? JSON.parse(microUser).token : null;
  const { hasPermission } = usePermissions(token);
  const canResolve = hasPermission("ALERT", null, "WRITE");

  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const selectedAlert = alerts.find((a) => a._id === selectedId) || null;

  // Resolve flow — mirrors Alerts/index.js's openResolve/submitResolve.
  const [resolveTarget, setResolveTarget] = useState(null);
  const [resolving, setResolving] = useState(false);

  const openDetail = (alert) => {
    setSelectedId(alert._id);
    setDetailOpen(true);
    if (!alert.isRead) {
      setAlerts((prev) =>
        prev.map((a) => (a._id === alert._id ? { ...a, isRead: true } : a)),
      );
      markSopAlertRead(alert._id).catch(() => {});
    }
  };

  const closeResolve = () => {
    if (resolving) return;
    setResolveTarget(null);
  };

  // The list here only ever shows unresolved alerts, so a successful resolve
  // removes the row entirely rather than patching its resolution in place.
  const submitResolve = async (text) => {
    if (!resolveTarget) return;
    setResolving(true);
    try {
      await resolveSopAlert(resolveTarget._id, text);
      toast.success("Alert resolved");
      setAlerts((prev) => prev.filter((a) => a._id !== resolveTarget._id));
      setTotal((t) => Math.max(0, t - 1));
      setResolveTarget(null);
      setDetailOpen(false);
    } catch (err) {
      toast.error(err?.message || "Failed to resolve alert");
    } finally {
      setResolving(false);
    }
  };

  useEffect(() => {
    if (isOpen) setPage(1);
  }, [isOpen, patientId]);

  useEffect(() => {
    if (!isOpen || !patientId) return;

    const fetchAlerts = async () => {
      setLoading(true);
      try {
        const res = await getAllSopAlerts({
          patients: patientId,
          resolvedState: "unresolved",
          page,
          pageSize: PAGE_SIZE,
        });
        setAlerts(res?.data || []);
        setTotalPages(res?.totalPages || 1);
        setTotal(res?.total || 0);
      } catch (error) {
        setAlerts([]);
        setTotalPages(1);
        setTotal(0);
        handleAuthError(error);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, patientId, page]);

  return (
    <CustomModal
      title={`Unresolved Alerts — ${patientName || "Patient"}`}
      size="xl"
      isOpen={isOpen}
      toggle={toggle}

    >
      {loading ? (
        <div className="d-flex justify-content-center py-4">
          <Spinner color="primary" size="sm" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-muted text-center py-4">No unresolved alerts.</div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {alerts.map((alert) => (
            <div
              key={alert._id}
              role="button"
              tabIndex={0}
              onClick={() => openDetail(alert)}
              className="d-flex gap-2 pb-3 border-bottom"
              style={{
                borderLeft: `4px solid ${SEVERITY_HEX[alert.severity] || "#6c757d"}`,
                paddingLeft: 10,
                paddingTop: 8,
                paddingRight: 8,
                paddingBottom: 8,
                cursor: "pointer",
                background: alert.isRead ? "#fff" : "rgba(13, 110, 253, 0.06)",
              }}
            >
              <div className="flex-grow-1">
                <div className="d-flex align-items-center gap-2 mb-1">
                  {!alert.isRead && (
                    <span
                      className="rounded-circle flex-shrink-0"
                      style={{ width: 8, height: 8, background: "#0d6efd" }}
                    />
                  )}
                  <Badge color={SEVERITY_COLOR[alert.severity] || "secondary"}>
                    {alert.severity}
                  </Badge>
                  <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                    {alertSourceLabel(alert)} · {timeAgo(alert.createdAt)}
                  </span>
                  {!alert.isRead && (
                    <Badge color="primary" pill className="ms-auto">
                      New
                    </Badge>
                  )}
                </div>
                <div style={{ fontSize: "0.85rem", fontWeight: alert.isRead ? 400 : 600 }}>
                  {alert.message}
                </div>
                {alert.actionGuidance && (
                  <div className="text-muted mt-1" style={{ fontSize: "0.78rem" }}>
                    <strong>Action:</strong> {alert.actionGuidance}
                  </div>
                )}
              </div>
              {canResolve && (
                <Button
                  size="sm"
                  color="success"
                  className="flex-shrink-0 align-self-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    setResolveTarget(alert);
                  }}
                >
                  <i className="bx bx-check-circle me-1" />
                  Resolve
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="d-flex align-items-center justify-content-center gap-3 mt-3">
          <Button
            color="secondary"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Previous
          </Button>
          <span className="text-muted" style={{ fontSize: "0.8rem" }}>
            Page {page} of {totalPages} ({total} total)
          </span>
          <Button
            color="secondary"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </Button>
        </div>
      )}

      <div className="mt-3 pt-3 border-top text-end">
        <a
          href={`/alert?patientId=${patientId}&patientName=${encodeURIComponent(patientName || "")}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open in Alerts inbox (resolve / add notes) →
        </a>
      </div>

      <AlertDetailOffcanvas
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        alert={selectedAlert}
        canResolve={canResolve}
        onResolve={() => setResolveTarget(selectedAlert)}
      />

      <ResolveAlertModal
        isOpen={!!resolveTarget}
        alert={resolveTarget}
        submitting={resolving}
        onClose={closeResolve}
        onSubmit={submitResolve}
      />
    </CustomModal>
  );
};

PatientAlertsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  toggle: PropTypes.func.isRequired,
  patientId: PropTypes.string,
  patientName: PropTypes.string,
};

export default PatientAlertsModal;
