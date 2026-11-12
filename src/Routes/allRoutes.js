import React from "react";
import { Navigate } from "react-router-dom";
import DashboardEcommerce from "../pages/DashboardEcommerce";
import Patient from "../pages/Patient";
import MyMeetingUI from "../pages/Meeting/MeetingPage.jsx";
import Intern from "../pages/Intern/index.js";
const GrievancePage = React.lazy(() => import("../pages/Grievance"));
const PrivacyPolicyPage = React.lazy(() => import("../pages/PrivacyPolicy"));
const Login = React.lazy(() => import("../pages/Authentication/Login"));
const ForgetPasswordPage = React.lazy(
  () => import("../pages/Authentication/ForgetPassword"),
);
const Logout = React.lazy(() => import("../pages/Authentication/Logout"));
const Register = React.lazy(() => import("../pages/User"));
const Setting = React.lazy(() => import("../pages/Setting"));
const Notification = React.lazy(() => import("../pages/Notification"));
const Recyclebin = React.lazy(() => import("../pages/Recyclebin"));
const UserProfile = React.lazy(
  () => import("../pages/Authentication/user-profile"),
);
const Center = React.lazy(() => import("../pages/Center"));
const Nurse = React.lazy(() => import("../pages/Nurse"));
const EmergencyDashboad = React.lazy(
  () => import("../pages/DashboardEmergency"),
);
const CashManagement = React.lazy(() => import("../pages/CashManagement"));
const CentralPayment = React.lazy(() => import("../pages/CentralPayment"));
const Booking = React.lazy(() => import("../pages/Booking"));
const Medicine = React.lazy(() => import("../pages/Medicine"));
const Lead = React.lazy(() => import("../pages/Lead"));
const WebCamStats = React.lazy(() => import("../pages/WebCamStats"));
const Report = React.lazy(() => import("../pages/Report"));
const Pharmacy = React.lazy(() => import("../pages/Inventory"));
const Guidelines = React.lazy(() => import("../pages/Guidelines"));
const IncidentReporting = React.lazy(
  () => import("../pages/IncidentReporting"),
);
const RoundNotes = React.lazy(() => import("../pages/RoundNotes"));
const HR = React.lazy(() => import("../pages/HR"));
const Audit = React.lazy(() => import("../pages/Audit"));
const MiReporting = React.lazy(() => import("../pages/MIReporting/index.js"));
const HRMS = React.lazy(() => import("../pages/HRMS"));
const Referral = React.lazy(() => import("../pages/Referral"));
const Tally = React.lazy(() => import("../pages/Tally"));
const PosPayments = React.lazy(() => import("../pages/PosPayments"));
const Issues = React.lazy(() => import("../pages/Issues"));
const Recordings = React.lazy(() => import("../pages/Recordings"));
const SOP = React.lazy(() => import("../pages/SopConfigs"));
const Trainings = React.lazy(() => import("../pages/Trainings"));
const TrainingNotifications = React.lazy(() => import("../pages/Trainings/Pages/TrainingNotifications"));
const Utilities = React.lazy(() => import("../pages/Utilities"));
const AlertPage = React.lazy(() => import("../pages/Alerts"));
const Marketing = React.lazy(() => import("../pages/Marketing"));
const DoctorVisits = React.lazy(() => import("../pages/DoctorVisits/DoctorVisits"));
const MasterData = React.lazy(() => import("../pages/MasterData"));
const CenterDashboard = React.lazy(() => import("../pages/CenterDashboard"));
const MISMaster = React.lazy(() => import("../pages/MISMaster"));
const Compliance = React.lazy(() => import("../pages/Compliance"));
const TherapyLectures = React.lazy(() => import("../pages/TherapyLectures"));
const allElements = [
  { element: Register, label: "User" },
  { element: Center, label: "Center" },
  { element: Intern, label: "Intern" },
  { element: Patient, label: "Patient" },
  { element: Intern, label: "Intern" },
  { element: Booking, label: "Booking" },
  { element: Setting, label: "Setting" },
  { element: Recyclebin, label: "Recycle bin" },
  { element: Lead, label: "Lead" },
  { element: Report, label: "Report" },
  { element: Nurse, label: "Nurse" },
  { element: EmergencyDashboad, label: "Emergency" },
  { element: CentralPayment, label: "Central Payment" },
  { element: CashManagement, label: "Cash" },
  { element: Pharmacy, label: "Pharmacy" },
  { element: Guidelines, label: "Guidelines" },
  { element: IncidentReporting, label: "Incident Reporting" },
  { element: MiReporting, label: "Hubspot Reporting" },
  { element: HR, label: "HR" },
  { element: HRMS, label: "HRMS" },
  { element: WebCamStats, label: "Web Cam Stats" },
  { element: Referral, label: "Referral" },
  { element: Tally, label: "Tally" },
  { element: PosPayments, label: "POS Payments" },
  { element: Issues, label: "Issues" },
  { element: Recordings, label: "Recordings" },
  { element: SOP, label: "SOP-configs" },
  { element: Trainings, label: "Trainings" },
  { element: Utilities, label: "Utilities" },
  { element: AlertPage, label: "Alert" },
  { element: Marketing, label: "Marketing" },
  { element: MasterData, label: "Vendor Management" },
  { element: CenterDashboard, label: "Center Dashboard" },
  { element: MISMaster, label: "MIS Master" },
  { element: Compliance, label: "Compliance" },
  { element: TherapyLectures, label: "Therapy Lectures" },
];

const authProtectedRoutes = [
  { path: "/dashboard", component: DashboardEcommerce },
  { path: "/index", component: DashboardEcommerce },
  { path: "/profile", component: UserProfile },
  { path: "/user/*", component: Register },
  { path: "/patient/*", component: Patient },
  { path: "/alert", component: AlertPage },
  { path: "/setting/*", component: Setting },
  { path: "/recyclebin/*", component: Recyclebin },
  { path: "/medicine", component: Medicine },
  { path: "/notification", component: Notification },
  { path: "/intern/*", component: Intern },
  { path: "/centers", component: Center },
  { path: "/nurse/*", component: Nurse },
  { path: "/emergency/*", component: EmergencyDashboad },
  { path: "/cash", component: CashManagement },
  { path: "/pharmacy/*", component: Pharmacy },
  { path: "/centralpayment/*", component: CentralPayment },
  { path: "/guidelines/*", component: Guidelines },
  { path: "/incident-reporting/*", component: IncidentReporting },
  { path: "/round-notes", component: RoundNotes },
  { path: "/hr/*", component: HR },
  { path: "/audit", component: Audit },
  { path: "/issues/*", component: Issues },
  { path: "/recordings/*", component: Recordings },
  { path: "/mi-reporting", component: MiReporting },
  { path: "/mi-reporting/*", component: MiReporting },
  { path: "/hrms/*", component: HRMS },
  { path: "/webcamstats/*", component: WebCamStats },
  { path: "/contacts", component: Referral },
  { path: "/referral", component: () => <Navigate to="/contacts" replace /> },
  { path: "/tally", component: Tally },
  { path: "/pos-payments", component: PosPayments },
  { path: "/sop-configs/*", component: SOP },
  { path: "/trainings/notifications", component: TrainingNotifications },
  { path: "/trainings/*", component: Trainings },
  { path: "/utilities/*", component: Utilities },
  { path: "/marketing/*", component: Marketing },
  { path: "/vendor-management/*", component: MasterData },
  { path: "/doctor-visits", component: DoctorVisits },
  { path: "/center-dashboard", component: CenterDashboard },
  { path: "/mis-master", component: MISMaster },
  { path: "/compliance/*", component: Compliance },
  { path: "/therapy-lectures/*", component: TherapyLectures },
  {
    path: "/",
    exact: true,
    component: () => <Navigate to="/dashboard" />,
  },
];

const publicRoutes = [
  { path: "/logout", component: Logout },
  { path: "/login", component: Login },
  { path: "/forgot-password", component: ForgetPasswordPage },
  { path: "/meeting", component: MyMeetingUI },
  // Public by statute: SPDI Rule 5(9) requires the Grievance Officer's details
  // to be published, and Rule 4 requires the privacy policy to be accessible.
  // Both are for people who have no account, so neither can sit behind a login.
  { path: "/grievance", component: GrievancePage },
  { path: "/privacy-policy", component: PrivacyPolicyPage },
];

export { authProtectedRoutes, publicRoutes, allElements };
