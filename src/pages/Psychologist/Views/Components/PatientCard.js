import { Card, CardBody, CardTitle, CardText, Badge, Button } from "reactstrap";
import moment from "moment";
import { CalendarDays, MessageSquareText, ExternalLink } from "lucide-react";
import { capitalizeWords } from "../../../../utils/toCapitalize";

const statusColors = {
  urgent: { color: "danger", border: "#ff4d4f" },
  attention: { color: "warning", border: "#faad14" },
  stable: { color: "success", border: "#52c41a" },
};

const toTitleCase = (text) => {
  if (!text) return;
  return text.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

const PatientCard = ({ patient, onStartNote }) => {
  const { color, border } = statusColors[patient.flag] || {
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
          {toTitleCase(patient.flag)}
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

        <div className="d-flex align-items-center gap-2 mb-2">
          <CalendarDays size={15} className="text-muted" />
          <span className="fw-semibold" style={{ fontSize: "0.85rem" }}>
            {daysAdmitted !== null ? `${daysAdmitted} day${daysAdmitted === 1 ? "" : "s"} admitted` : "N/A"}
          </span>
          <span className="text-muted" style={{ fontSize: "0.75rem" }}>
            since {patient.addmissionDate ? moment(patient.addmissionDate).format("DD MMM YY") : "N/A"}
          </span>
        </div>

        <div
          className="mb-2 pt-2 text-muted"
          style={{ borderTop: "1px dashed #e0e0e0", fontSize: "0.78rem" }}
        >
          <div>
            Last Counselling Note:{" "}
            <strong className="text-body">
              {patient.lastSessionDate
                ? moment(patient.lastSessionDate).format("DD MMM YY")
                : "None yet"}
            </strong>
          </div>
        </div>

        <div className="d-flex gap-2 mt-auto">
          <Button
            color="primary"
            size="sm"
            className="d-flex align-items-center justify-content-center gap-1 fw-semibold flex-grow-1"
            onClick={() => onStartNote(patient)}
          >
            <MessageSquareText size={14} />
            Start Counselling Note
          </Button>
          <Button
            outline
            color="secondary"
            size="sm"
            className="d-flex align-items-center justify-content-center"
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
