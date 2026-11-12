import { combineReducers } from "redux";

// Front
// import Layout from "./layouts/reducer";

// // Authentication
// import Login from "./auth/login/reducer";
// import Account from "./auth/register/reducer";
// import ForgetPassword from "./auth/forgetpwd/reducer";
// import Profile from "./auth/profile/reducer";
import User from "./features/auth/user/userSlice";

// dashboard
import Dashboard from "./features/dashboard/dashboardSlice";

// alert
import Alert from "./features/alert/alertSlice";

// notification
import Notification from "./features/notification/notificationSlice";
import TrainingNotification from "./features/trainingNotification/trainingNotificationSlice";

// layout
import Layout from "./features/layouts/layoutsSlice";

// log
import Log from "./features/log/logSlice";

// db logs
import DBLogs from "./features/report/dbLogSlice";

// center
import Center from "./features/center/centerSlice";

// recyclebin
import Recyclebin from "./features/recyclebin/recyclebinSlice";

// lead
import Lead from "./features/lead/leadSlice";

// referral
import Referral from "./features/referral/referralSlice";

// booking
import Booking from "./features/booking/bookingSlice";

// patient
import Patient from "./features/patient/patientSlice";

// timeline
import Timeline from "./features/timeline/timelineSlice";

// chart
import Chart from "./features/chart/chartSlice";

// bill
import Bill from "./features/bill/billSlice";

// print
import Print from "./features/print/printSlice";

// medicine
import Medicine from "./features/medicine/medicineSlice";

// setting
import Setting from "./features/setting/settingSlice";

// Report
import Report from "./features/report/reportSlice";

// Intern
import Intern from "./features/intern/internSlice";

import InternTimeline from "./features/Intern timeline/internTimelineSlice";

// clinical test
import ClinicalTest from "./features/clinicalTest/clinicalTestSlice";

//  for Nurse
import Nurse from "./features/nurse/nurseSlice";

// for emergency
import Emergency from "./features/emergency/emergencySlice";

// for psychologist dashboard
import Psychologist from "./features/psychologist/psychologistSlice";

// for cash management
import Cash from "./features/cashManagement/cashSlice";

// for central payment
import CentralPayment from "./features/centralPayment/centralPaymentSlice";

//for offers
import Offers from "./features/offer/offerSlice";

//for tax
import Taxes from "./features/tax/taxSlice";
import HubspotContacts from "./features/report/hubspotContactsSlice";
import Incident from "./features/incident/incidentSlice";

import Pharmacy from "./features/pharmacy/pharmacySlice";
import RoundNotes from "./features/roundNotes/roundNotesSlice";
import MIReporting from "./features/miReporting/miReportingSlice";

// HR
import HR from "./features/HR/hrSlice";

// HRMS
import HRMS from "./features/HRMS/hrmsSlice";

// Center Dashboard
import CenterDashboard from "./features/centerDashboard/centerDashboardSlice";

// Reference data (shared lists: centers, vendors, units, departments, payment terms)

import Reference from "./features/reference/referenceSlice";
// Compliance
import Compliance from "./features/compliance/complianceSlice";

const rootReducer = combineReducers({
  // ** public **
  User,
  Dashboard,
  Alert,
  Log,
  Center,
  Notification,
  TrainingNotification,
  Recyclebin,
  Setting,
  Lead,
  Referral,
  Booking,
  Medicine,
  // layout
  Layout,
  // patient
  Patient,
  Timeline,
  Chart,
  Bill,
  Print,
  Report,
  Intern,
  InternTimeline,
  ClinicalTest,
  DBLogs,
  Offers,
  Nurse,
  Emergency,
  Psychologist,
  Cash,
  Taxes,
  HubspotContacts,
  CentralPayment,
  Incident,
  Pharmacy,
  RoundNotes,
  HR,
  MIReporting,
  HRMS,
  CenterDashboard,
  Reference,
  Compliance,
});

export default rootReducer;
