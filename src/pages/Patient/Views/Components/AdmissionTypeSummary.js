import React from "react";
import { connect } from "react-redux";
import {
  getCurrentAdmissionType,
  admissionTypeSummaryLabel,
  getAdmissionTypeDetailParts,
} from "../../../../utils/admissionType";
import { SummaryCard } from "./SpecialRequirementsSummary";

/**
 * The patient's current Admission Type, shown in the header column.
 *
 * Reads the admission's own timeline (`addmission.admissionTypeHistory`), which
 * the server maintains from BOTH the Admission Form and the Admission Type
 * chart. It used to read the loaded charts instead, which meant a type recorded
 * through the form — creating no chart — left this card hidden entirely.
 *
 * Reading the admission rather than the charts also drops the old dependency on
 * fetchCharts: the card no longer waits for the Charting view to mount, and no
 * longer disappears when charts were never loaded for this admission.
 */
const AdmissionTypeSummary = ({ addmission, isAdmit }) => {
  if (!isAdmit || !addmission?._id) return null;

  const current = getCurrentAdmissionType(addmission);
  const data = current?.data;
  // Empty for an independent admission: it reads "Minor (below 18)" alone.
  const typeLabel = admissionTypeSummaryLabel(data);
  const detail = data ? getAdmissionTypeDetailParts(data) : [];

  // The admission card's Patient Type (patientAdmissionType) — flagged here
  // only when Geriatric, so it's visible at a glance in the header column.
  const isGeriatric = addmission.patientAdmissionType === "geriatric";

  // Nothing to show: no admission type recorded and not geriatric.
  if (!data && !isGeriatric) return null;

  // Geriatric is shown IN PLACE of the admission type, by decision — the same
  // as the patient header's "Admission Type: Geriatric".
  if (isGeriatric) {
    return (
      <SummaryCard title="ADMISSION TYPE" compact>
        <div style={{ fontSize: "0.7rem" }}>Geriatric</div>
      </SummaryCard>
    );
  }

  return (
    <SummaryCard title="ADMISSION TYPE" compact>
      {typeLabel && <div style={{ fontSize: "0.7rem" }}>{typeLabel}</div>}
      {/* The details are the grey second line under a type name, or the main
          line when there is no name (independent: "Minor (below 18)"). */}
      {detail.length > 0 && (
        <div
          className={typeLabel ? "text-muted" : undefined}
          style={{ fontSize: "0.7rem" }}
        >
          {detail.join(" · ")}
        </div>
      )}
    </SummaryCard>
  );
};

const mapStateToProps = (state) => ({
  addmission: state.Patient?.patient?.addmission,
  isAdmit: state.Patient?.patient?.isAdmit,
});

export default connect(mapStateToProps)(AdmissionTypeSummary);
