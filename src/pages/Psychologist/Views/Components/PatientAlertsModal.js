import { useEffect, useState } from "react";
import { Badge, Button, Spinner } from "reactstrap";
import PropTypes from "prop-types";
import CustomModal from "../../../../Components/Common/Modal";
import { getAllSopAlerts } from "../../../../helpers/backend_helper";
import {
  SEVERITY_COLOR,
  SEVERITY_HEX,
} from "../../../Alerts/components/alertConstants";
import { timeAgo, alertSourceLabel } from "../../../Alerts/components/alertUtils";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";

const PAGE_SIZE = 10;

const PatientAlertsModal = ({ isOpen, toggle, patientId, patientName }) => {
  const handleAuthError = useAuthError();
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

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
              className="d-flex gap-2"
              style={{ borderLeft: `4px solid ${SEVERITY_HEX[alert.severity] || "#6c757d"}`, paddingLeft: 10 }}
            >
              <div className="flex-grow-1">
                <div className="d-flex align-items-center gap-2 mb-1">
                  <Badge color={SEVERITY_COLOR[alert.severity] || "secondary"}>
                    {alert.severity}
                  </Badge>
                  <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                    {alertSourceLabel(alert)} · {timeAgo(alert.createdAt)}
                  </span>
                </div>
                <div style={{ fontSize: "0.85rem" }}>{alert.message}</div>
                {alert.actionGuidance && (
                  <div className="text-muted mt-1" style={{ fontSize: "0.78rem" }}>
                    <strong>Action:</strong> {alert.actionGuidance}
                  </div>
                )}
              </div>
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
