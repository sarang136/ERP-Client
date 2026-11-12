import { Card, CardBody, CardTitle, CardText, Badge, Button } from "reactstrap";
import moment from "moment";
import { CalendarDays, MessageSquareText, FileText, ExternalLink, TriangleAlert } from "lucide-react";
import { capitalizeWords } from "../../../../utils/toCapitalize";
import { COUNSELLING_NOTE, MENTAL_EXAMINATION } from "../../../../Components/constants/patient";
import { SEVERITY_COLOR } from "../../../Alerts/components/alertConstants";

const SEVERITY_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

const statusColors = {
  suicidal: { color: "danger", border: "#ffcdd2" },
  runaway: { color: "warning", border: "#ffe0b2" },
  serious: { color: "primary", border: "#fff9c4" },
  aggresive: { color: "secondary", border: "#bbdefb" },
  normal: { color: "success", border: "#c8e6c9" },
};

const toTitleCase = (text) => {
  if (!text) return;
  return text.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

const PatientCard = ({ patient, onStartChart, onViewAlerts, canWrite }) => {
  const { color, border } = statusColors[patient.patientType] || {
    color: "secondary",
    border: "#d9d9d9",
  };

  const daysAdmitted = patient.addmissionDate
    ? moment().diff(moment(patient.addmissionDate), "days")
    : null;

  return (
    <Card
      className="position-relative shadow-sm border-1 w-100 h-100"
      style={{ borderTop: `4px solid ${border}`, minHeight: "200px" }}
    >
      <div className="position-absolute top-0 end-0 d-flex">
        <Badge
          color={color}
          className="rounded-0 rounded-bottom-start fw-bold"
          style={{ padding: "4px 10px", fontSize: "0.8rem" }}
        >
          {toTitleCase(
            patient.patientType === "serious"
              ? "Medically Serious"
              : patient.patientType,
          )}
        </Badge>
      </div>

      <CardBody className="d-flex flex-column h-100 mt-2">
        <CardTitle tag="h5" className="mb-1 fw-semibold">
          {toTitleCase(patient.name)}
          {(patient.uid || patient.age) && (
            <span className="text-muted fw-normal">
              {" "}
              ({[patient.uid, patient.age ? `${patient.age}y` : null]
                .filter(Boolean)
                .join(", ")})
            </span>
          )}
        </CardTitle>

        <CardText className="text-muted mb-2" style={{ fontSize: "0.78rem", lineHeight: 1.4 }}>
          <span className="d-block text-truncate">
            <strong>Doctor:</strong> {capitalizeWords(patient.doctorName) || "N/A"}
          </span>
          <span className="d-block text-truncate">
            <strong className="text-success">Psychologist:</strong> {capitalizeWords(patient.psychologistName) || "N/A"}
          </span>
          <span className="d-block text-truncate">
            <strong>Nurse:</strong> {capitalizeWords(patient.nurseName) || "N/A"}
          </span>
          <span className="d-block text-truncate">
            <strong>RMO:</strong> {capitalizeWords(patient.rmoName) || "N/A"}
          </span>
          <span className="d-block text-truncate">
            <strong>MSW:</strong> {capitalizeWords(patient.mswName) || "N/A"}
          </span>
          <span className="d-block">
            <strong>Final Diagnosis:</strong> {patient.finalDiagnosis || "N/A"}
          </span>
        </CardText>

        {SEVERITY_ORDER.some((sev) => patient.alertCounts?.[sev]) && (
          <div className="d-flex flex-wrap align-items-center gap-1 mb-2">
            <span style={{ fontSize: "0.75rem" }}>
              <strong>Unresolved Alerts:</strong>
            </span>
            {SEVERITY_ORDER.filter((sev) => patient.alertCounts?.[sev]).map((sev) => (
              <Badge
                key={sev}
                color={SEVERITY_COLOR[sev]}
                pill
                role="button"
                style={{ fontSize: "0.7rem", cursor: "pointer" }}
                onClick={() => onViewAlerts(patient)}
              >
                {patient.alertCounts[sev]} {toTitleCase(sev)}
              </Badge>
            ))}
          </div>
        )}

        <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
          <CalendarDays size={15} className="text-muted flex-shrink-0" />
          <span className="fw-semibold text-nowrap" style={{ fontSize: "0.85rem" }}>
            {daysAdmitted !== null ? `${daysAdmitted} day${daysAdmitted === 1 ? "" : "s"} admitted` : "N/A"}
          </span>
          <span className="text-muted text-nowrap" style={{ fontSize: "0.75rem" }}>
            since {patient.addmissionDate ? moment(patient.addmissionDate).format("DD MMM YY") : "N/A"}
          </span>
        </div>

        <div
          className="mb-2 pt-2 text-muted d-flex flex-column gap-1"
          style={{ borderTop: "1px dashed #e0e0e0", fontSize: "0.78rem" }}
        >
          <div className="d-flex align-items-center justify-content-between">
            <span>Last Counselling Note:</span>
            {patient.lastCounsellingNoteDate ? (
              <strong className="text-body">
                {moment(patient.lastCounsellingNoteDate).format("DD MMM YY")}
              </strong>
            ) : (
              <strong className="text-warning">None yet</strong>
            )}
          </div>
          <div className="d-flex align-items-center justify-content-between">
            <span>Last Clinical Note:</span>
            {patient.lastClinicalNoteDate ? (
              <strong className="text-body">
                {moment(patient.lastClinicalNoteDate).format("DD MMM YY")}
              </strong>
            ) : (
              <strong className="text-warning">None yet</strong>
            )}
          </div>
        </div>

        <div className="d-flex gap-2 mt-auto">
          {canWrite && (
            <>
              <Button
                color="primary"
                size="sm"
                className="d-flex align-items-center justify-content-center gap-1 fw-semibold flex-grow-1 text-nowrap text-truncate"
                style={{ minWidth: 0 }}
                onClick={() => onStartChart(patient, COUNSELLING_NOTE)}
              >
                <MessageSquareText size={14} />
                Counselling Note
              </Button>
              <Button
                color="success"
                size="sm"
                className="d-flex align-items-center justify-content-center gap-1 fw-semibold flex-grow-1 text-nowrap text-truncate"
                style={{ minWidth: 0 }}
                onClick={() => onStartChart(patient, MENTAL_EXAMINATION)}
              >
                <FileText size={14} />
                Clinical Note
              </Button>
            </>
          )}
          <Button
            outline
            color="danger"
            size="sm"
            className="d-flex align-items-center justify-content-center flex-shrink-0"
            title="View unresolved alerts"
            onClick={() => onViewAlerts(patient)}
          >
            <TriangleAlert size={14} />
          </Button>
          <Button
            outline
            color="secondary"
            size="sm"
            className="d-flex align-items-center justify-content-center flex-shrink-0"
            title="Open patient in a new tab"
            onClick={() => window.open(`/patient/${patient._id}`, "_blank", "noopener,noreferrer")}
          >
            <ExternalLink size={14} />
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};

export default PatientCard;
