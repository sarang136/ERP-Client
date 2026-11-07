import React, { useEffect } from "react";
import { Container } from "reactstrap";
import { Route, Routes } from "react-router-dom";

//redux
import { usePermissions } from "../../Components/Hooks/useRoles";

// Components
import Sidebar from "./Sidebar";
import CenterLeadsMoM from "./CenterLeadsMoM";
import CenterLeadsMTD from "./CenterLeadsMTD";
import OwnerLeadsMoM from "./OwnerLeadsMoM";
import OwnerLeadsMTD from "./OwnerLeadsMTD";
import CityQuality from "./CityQuality";
import OwnerQuality from "./OwnerQuality";

import CityVisitDate from "./VisitDate/CityVisitDate";
import OwnerVisitDate from "./VisitDate/OwnerVisitDate";
import CityVisitedDate from "./VisitedDate/CityVisitedDate";
import OwnerVisitedDate from "./VisitedDate/OwnerVisitedDate";
import CityLeadStatus from "./LeadStatus/CityLeadStatus";
import OwnerLeadStatus from "./LeadStatus/OwnerLeadStatus";
import RefundAmountMOM from "./RefundAmountMOM";
import RoundNotesDOD from "./RoundNotesDOD";
import ClinicalNotesDOD from "./ClinicalNotesDOD";
import CounsellingSessionsPatients from "./CounsellingSessionsPatients";
import VitalSignsDOD from "./VitalSignsDOD";
import PatientDocs from "./PatientDocs";
import OpdPatientDocs from "./OpdPatientDocs";
import DailyInvoices from "./DailyInvoices";
import CounsellingSessions from "./CounsellingSessions";
import CounsellingRecording from "./CounsellingRecording";
import DailyDashboard from "./DailyDashboard";
import DocsCompliance from "./DocsCompliance";
import DueAmount from "./DueAmount";
import Attendance from "./Attendance";
import NursesDOD from "./NursesDOD";
import CenterWiseMOM from "./CenterWiseMOM";
import CashPerCenter from "./CashPerCenter";
import WriteOFFAmount from "./WriteOFFAmount";
import AuditForms from "./AuditForms";
import MetricsReport from "./MetricsReport";
import OPDCharges from "./OPDCharges";
import CentralExpenses from "./CentralExpenses";
import DoctorPsychologistStayRange from "./DoctorPsychologistStayRange";
import NursesDashboardDOD from "./NursesDashboardDOD";
import Occupancy from "./Occupancy";
import Incident from "./Incident";
import SOPAlerts from "./SOPAlerts";
import Readmission from "./Readmission";
import AttritionData from "./AttritionData";
import PatientAssignedStatus from "./PatientAssignedStatus";
import SuspendedAssigned from "./SuspendedAssigned";
import CashReco from "./CashReco";
import ReferralData from "./Referral Data";

const MiReporting = () => {

  const microUser = localStorage.getItem("micrologin");
  const token = microUser ? JSON.parse(microUser).token : null;

  const { loading: permissionLoader, hasPermission } = usePermissions(token);
  const hasHubspotReportingPermission = hasPermission(
    "HUBSPOT_REPORTING",
    null,
    "READ"
  );

  useEffect(() => {
    if (permissionLoader) return;
    // if (!hasHubspotReportingPermission) {
    //   navigate("/unauthorized");
    //   return;
    // }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ permissionLoader]);

  const hasHubspotCenterLeadsPermission = hasPermission(
    "HUBSPOT_REPORTING",
    "HUBSPOT_CENTER_LEADS_COUNT",
    "READ"
  );
  const hasHubspotOwnerLeadsPermission = hasPermission(
    "HUBSPOT_REPORTING",
    "HUBSPOT_OWNER_LEADS_COUNT",
    "READ"
  );
  const hasHubspotCityQualityPermission = hasPermission(
    "HUBSPOT_REPORTING",
    "HUBSPOT_CITY_QUALITY_BREAKDOWN",
    "READ"
  );
  const hasHubspotOwnerQualityPermission = hasPermission(
    "HUBSPOT_REPORTING",
    "HUBSPOT_OWNER_QUALITY_BREAKDOWN",
    "READ"
  );
  const hasHubspotCityVisitPermission = hasPermission(
    "HUBSPOT_REPORTING",
    "HUBSPOT_CITY_VISIT_DATE",
    "READ"
  );
  const hasHubspotOwnerVisitPermission = hasPermission(
    "HUBSPOT_REPORTING",
    "HUBSPOT_OWNER_VISIT_DATE",
    "READ"
  );
  const hasHubspotCityVisitedPermission = hasPermission(
    "HUBSPOT_REPORTING",
    "HUBSPOT_CITY_VISITED_DATE",
    "READ"
  );
  const hasHubspotOwnerVisitedPermission = hasPermission(
    "HUBSPOT_REPORTING",
    "HUBSPOT_OWNER_VISITED_DATE",
    "READ"
  );
  const hasHubspotCityLeadStatusPermission = hasPermission(
    "HUBSPOT_REPORTING",
    "HUBSPOT_CITY_LEAD_STATUS",
    "READ"
  );
  const hasHubspotOwnerLeadStatusPermission = hasPermission(
    "HUBSPOT_REPORTING",
    "HUBSPOT_OWNER_LEAD_STATUS",
    "READ"
  );

  const hasMISPermission = hasPermission(
    "MIS_REPORTS",
    "MIS_REPORTS_PERMISSION",
    "READ"
  );

  // MIS Reports — per-report permissions
  const hasDailyDashboardPermission = hasPermission("MIS_REPORTS", "DAILY_DASHBOARD", "READ");
  const hasMetricsReportPermission = hasPermission("MIS_REPORTS", "METRICS_REPORT", "READ");
  const hasDailyInvoicesPermission = hasPermission("MIS_REPORTS", "DAILY_INVOICES", "READ");
  const hasDueAmountPermission = hasPermission("MIS_REPORTS", "DUE_AMOUNT", "READ");
  const hasOpdChargesPermission = hasPermission("MIS_REPORTS", "OPD_CHARGES", "READ");
  const hasCashPerCenterPermission = hasPermission("MIS_REPORTS", "CASH_PER_CENTER", "READ");
  const hasRefundAmountPermission = hasPermission("MIS_REPORTS", "REFUND_AMOUNT", "READ");
  const hasWriteOffAmountPermission = hasPermission("MIS_REPORTS", "WRITE_OFF_AMOUNT", "READ");
  const hasCentralExpensesPermission = hasPermission("MIS_REPORTS", "CENTRAL_EXPENSES", "READ");
  const hasOccupancyPermission = hasPermission("MIS_REPORTS", "OCCUPANCY", "READ");
  const hasReadmissionPermission = hasPermission("MIS_REPORTS", "READMISSION", "READ");
  const hasReferralDataPermission = hasPermission("MIS_REPORTS", "REFERRAL_DATA", "READ");
  const hasVitalSignsPermission = hasPermission("MIS_REPORTS", "VITAL_SIGNS", "READ");
  const hasRoundNotesPermission = hasPermission("MIS_REPORTS", "ROUND_NOTES", "READ");
  const hasClinicalNotesPermission = hasPermission("MIS_REPORTS", "CLINICAL_NOTES", "READ");
  const hasDoctorPsychologistStayRangePermission = hasPermission("MIS_REPORTS", "DOCTOR_PSYCHOLOGIST_STAY_RANGE", "READ");
  const hasCounsellingSessionsPatientsPermission = hasPermission("MIS_REPORTS", "COUNSELLING_SESSIONS_PATIENTS", "READ");
  const hasCounsellingSessionsPermission = hasPermission("MIS_REPORTS", "COUNSELLING_SESSIONS", "READ");
  const hasCounsellingRecordingPermission = hasPermission("MIS_REPORTS", "COUNSELLING_RECORDING", "READ");
  const hasPatientAssignedStatusPermission = hasPermission("MIS_REPORTS", "PATIENT_ASSIGNED_STATUS", "READ");
  const hasSuspendedAssignedPermission = hasPermission("MIS_REPORTS", "SUSPENDED_ASSIGNED", "READ");
  const hasCashRecoCompliancePermission = hasPermission("MIS_REPORTS", "CASH_RECO_COMPLIANCE", "READ");
  const hasNursesDodPermission = hasPermission("MIS_REPORTS", "NURSES_DOD", "READ");
  const hasNursesDashboardDodPermission = hasPermission("MIS_REPORTS", "NURSES_DASHBOARD_DOD", "READ");
  const hasPatientDocsPermission = hasPermission("MIS_REPORTS", "PATIENT_DOCS", "READ");
  const hasOpdPatientDocsPermission = hasPermission("MIS_REPORTS", "OPD_PATIENT_DOCS", "READ");
  const hasDocsCompliancePermission = hasPermission("MIS_REPORTS", "DOCS_COMPLIANCE", "READ");
  const hasFormsDataPermission = hasPermission("MIS_REPORTS", "FORMS_DATA", "READ");
  const hasIncidentPermission = hasPermission("MIS_REPORTS", "INCIDENT", "READ");
  const hasSopAlertsPermission = hasPermission("MIS_REPORTS", "SOP_ALERTS", "READ");
  const hasAttendancePermission = hasPermission("MIS_REPORTS", "ATTENDANCE", "READ");
  const hasAttritionDataPermission = hasPermission("MIS_REPORTS", "ATTRITION_DATA", "READ");

  return (
    <React.Fragment>
      <div className="page-content" style={{ overflowX: "clip", overflowY: "visible" }}>
        <div className="">
          <Container fluid>
            <div className="chat-wrapper d-lg-flex gap-1 mx-n4 my-n4 mb-n5 p-1" style={{ alignItems: "flex-start", overflowY: "visible" }}>
              <Sidebar />
              <Routes>
                {hasHubspotCenterLeadsPermission && (
                  <Route
                    path="/center-leads-mom"
                    element={<CenterLeadsMoM />}
                  />
                )}
                {hasHubspotCenterLeadsPermission && (
                  <Route
                    path="/center-leads-mtd"
                    element={<CenterLeadsMTD />}
                  />
                )}
                {hasHubspotOwnerLeadsPermission && (
                  <Route path="/owner-leads-mom" element={<OwnerLeadsMoM />} />
                )}
                {hasHubspotOwnerLeadsPermission && (
                  <Route path="/owner-leads-mtd" element={<OwnerLeadsMTD />} />
                )}
                {hasHubspotCityQualityPermission && (
                  <Route path="/city-quality" element={<CityQuality />} />
                )}
                {hasHubspotOwnerQualityPermission && (
                  <Route path="/owner-quality" element={<OwnerQuality />} />
                )}
                {hasHubspotCityVisitPermission && (
                  <Route path="/city-visit-date" element={<CityVisitDate />} />
                )}
                {hasHubspotOwnerVisitPermission && (
                  <Route
                    path="/owner-visit-date"
                    element={<OwnerVisitDate />}
                  />
                )}
                {hasHubspotCityVisitedPermission && (
                  <Route
                    path="/city-visited-date"
                    element={<CityVisitedDate />}
                  />
                )}
                {hasHubspotOwnerVisitedPermission && (
                  <Route
                    path="/owner-visited-date"
                    element={<OwnerVisitedDate />}
                  />
                )}
                {hasHubspotCityLeadStatusPermission && (
                  <Route
                    path="/city-lead-status"
                    element={<CityLeadStatus />}
                  />
                )}
                {hasHubspotOwnerLeadStatusPermission && (
                  <Route
                    path="/owner-lead-status"
                    element={<OwnerLeadStatus />}
                  />
                )}
                {hasHubspotReportingPermission && (
                  <Route
                    path="/center-wise-mom"
                    element={<CenterWiseMOM />}
                  />
                )}

                {hasMISPermission && hasRefundAmountPermission && <Route
                    path="/refund-amount"
                    element={<RefundAmountMOM />}
                  />}

                   {hasMISPermission && hasRoundNotesPermission && <Route
                    path="/round-notes"
                    element={<RoundNotesDOD />}
                  />}

                  {hasMISPermission && hasClinicalNotesPermission && <Route
                    path="/clinical-notes"
                    element={<ClinicalNotesDOD />}
                  />}

                  {hasMISPermission && hasCounsellingSessionsPatientsPermission && <Route
                    path="/counselling-sessions-patients"
                    element={<CounsellingSessionsPatients />}
                  />}

                  {hasMISPermission && hasVitalSignsPermission && <Route
                    path="/vital-signs"
                    element={<VitalSignsDOD />}
                  />}


                  {hasMISPermission && hasPatientDocsPermission && <Route
                    path="/patient-docs"
                    element={<PatientDocs />}
                  />}

                  {hasMISPermission && hasOpdPatientDocsPermission && <Route
                    path="/opd-patient-docs"
                    element={<OpdPatientDocs />}
                  />}

                  {hasMISPermission && hasDailyInvoicesPermission && <Route
                    path="/daily-invoices"
                    element={<DailyInvoices />}
                  />}


                  {hasMISPermission && hasCounsellingSessionsPermission && <Route
                    path="/counselling-sessions"
                    element={<CounsellingSessions />}
                  />}

                   {hasMISPermission && hasCounsellingRecordingPermission && <Route
                    path="/counselling-recording"
                    element={<CounsellingRecording />}
                  />}


                  {hasMISPermission && hasDailyDashboardPermission && <Route
                    path="/daily-dashboard"
                    element={<DailyDashboard />}
                  />}

                  {hasMISPermission && hasDocsCompliancePermission && <Route
                    path="/docs-compliance"
                    element={<DocsCompliance />}
                  />}

                  {hasMISPermission && hasDueAmountPermission && <Route
                    path="/due-amount"
                    element={<DueAmount />}
                  />}

                  {hasMISPermission && hasAttendancePermission && <Route
                    path="/attendance"
                    element={<Attendance />}
                  />}

                  {hasMISPermission && hasNursesDodPermission && <Route
                    path="/nurses-dod"
                    element={<NursesDOD />}
                  />}

                  {hasMISPermission && hasCashPerCenterPermission && <Route
                    path="/cash-per-center"
                    element={<CashPerCenter />}
                  />}

                  {hasMISPermission && hasWriteOffAmountPermission && <Route
                    path="/write-off-amount"
                    element={<WriteOFFAmount />}
                  />}

                  {hasMISPermission && hasFormsDataPermission && <Route
                    path="/forms-data"
                    element={<AuditForms />}
                  />}

                  {hasMISPermission && hasMetricsReportPermission && <Route
                    path="/metrics-report"
                    element={<MetricsReport />}
                  />}

                  {hasMISPermission && hasOpdChargesPermission && <Route
                    path="/opd-charges"
                    element={<OPDCharges />}
                  />}

                  {hasMISPermission && hasCentralExpensesPermission && <Route
                    path="/central-expenses"
                    element={<CentralExpenses />}
                  />}

                  {hasMISPermission && hasDoctorPsychologistStayRangePermission && <Route
                    path="/doctor-psychologist-stay-range"
                    element={<DoctorPsychologistStayRange />}
                  />}

                  {hasMISPermission && hasNursesDashboardDodPermission && <Route
                    path="/nurses-dashboard-dod"
                    element={<NursesDashboardDOD />}
                  />}

                  {hasMISPermission && hasOccupancyPermission && <Route
                    path="/occupancy"
                    element={<Occupancy />}
                  />}

                  {hasMISPermission && hasIncidentPermission && <Route
                    path="/incident"
                    element={<Incident />}
                  />}

                  {hasMISPermission && hasSopAlertsPermission && <Route
                    path="/sop-alerts"
                    element={<SOPAlerts />}
                  />}

                  {hasMISPermission && hasReadmissionPermission && <Route
                    path="/readmission"
                    element={<Readmission />}
                  />}


                  {hasMISPermission && hasAttritionDataPermission && <Route
                    path="/attrition-data"
                    element={<AttritionData />}
                  />}

                  {hasMISPermission && hasPatientAssignedStatusPermission && <Route
                    path="/patient-assigned-status"
                    element={<PatientAssignedStatus />}
                  />}

                  {hasMISPermission && hasSuspendedAssignedPermission && <Route
                    path="/suspended-assigned"
                    element={<SuspendedAssigned />}
                  />}

                  {hasMISPermission && hasCashRecoCompliancePermission && <Route
                    path="/cash-reco-compliance"
                    element={<CashReco />}
                  />}

                  {hasMISPermission && hasReferralDataPermission && <Route
                    path="/referral-data"
                    element={<ReferralData />}
                  />}

              </Routes>
            </div>
          </Container>
        </div>
      </div>
    </React.Fragment>
  );
};


// export default connect(mapStateToProps)(Hu§§bspotReporting);
export default MiReporting;