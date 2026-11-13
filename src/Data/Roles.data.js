export const permissionList = [
  {
    key: "CENTER",
    label: "Center",
    subModules: [],
  },
  {
    key: "NURSE",
    label: "Nurse",
    subModules: [
      {
        name: "MEDICINE_BOX_FILLING_FOR_TOMORROW",
        label: "Medicine Box Filling for Tomorrow (Fill Today)",
      },
      { name: "MEDICINE_GIVEN", label: "Medicine Given" },
    ],
  },
  {
    key: "EMERGENCY",
    label: "Emergency",
    subModules: [],
  },
  {
    key: "LEAD",
    label: "Lead",
    subModules: [
      // Data scope, not an action: READ or above lets the role see every lead;
      // NONE restricts them to leads they authored. Read server-side by
      // canViewAllLeads (ERP-Server src/helpers/leadAccess.js).
      // Submodules are keyed by `name` (not `key` like the parent module) —
      // AddEditModal reads sm.name when seeding and saving.
      { name: "VIEW_ALL", label: "View All Leads" },
    ],
  },
  {
    key: "BOOKING",
    label: "Booking",
    subModules: [
      {
        name: "PRESCRIPTION",
        label: "Prescription",
      },
      { name: "PAYMENT", label: "Payment" },
    ],
  },
  {
    key: "INTERN",
    label: "Intern",
    subModules: [
      { name: "INTERNTIMELINE", label: "Intern Timeline" },
      { name: "INTERNBILLING", label: "Intern Bill" },
      { name: "INTERNCERTIFICATE", label: "Intern Certificate" },
    ],
  },
  {
    key: "PATIENTS",
    label: "Paitents",
    subModules: [
      { name: "PATIENTSTIMELINE", label: "Paitents Timeline" },
      { name: "PATIENTSHISTORY", label: "Paitents History" },
      { name: "PATIENTSBILLING", label: "Paitents Bill" },
      { name: "PATIENTCHARTS", label: "Paitents Chart" },
      { name: "ADDMISSIONSUMMARY", label: "Addmission Summary" },
      { name: "INVOICEHISTORY", label: "Billing/Invoice Summary" },
    ],
  },
  {
    key: "ALERT",
    label: "Alert",
    subModules: [
      { name: "ALL_CENTRES", label: "All alerts across all centres" },
      { name: "ASSIGNED_CENTRES", label: "All alerts in assigned centres" },
      { name: "ROLE_WISE", label: "Role-wise alerts in assigned centres" },
    ],
  },
  {
    key: "REFERRAL",
    label: "Contacts",
    subModules: [
      { name: "APPROVE_REFERRAL", label: "Approve Contact" },
      { name: "REJECT_REFERRAL", label: "Reject Contact" },
    ],
  },
  {
    key: "USER",
    label: "User",
    subModules: [
      {
        name: "USERPASSWORDCHANGE",
        label: "User Password Change",
      },
      { name: "SUSPENDUSER", label: "Suspend User" },
    ],
  },
  {
    key: "CASH",
    label: "Cash",
    subModules: [
      { name: "CASHREPORTS", label: "Cash Reports" },
      { name: "CASHBALANCE", label: "Cash Base Balance" },
      { name: "CASHDEPOSITS", label: "Cash Deposits" },
      { name: "CASHSPENDING", label: "Cash Spending" },
      { name: "CASHINFLOW", label: "Cash Inflow" },
      { name: "LEDGERREPORT", label: "Ledger Report" },
      { name: "CASHRECO", label: "Cash Daily Reco" },
    ],
  },
  {
    key: "CENTRALPAYMENT",
    label: "Central Payment",
    subModules: [
      { name: "CENTRALPAYMENTSPENDING", label: "Expense" },
      { name: "CENTRALPAYMENTAPPROVAL", label: "Approval Dashboard" },
      {
        name: "CENTRALPAYMENTACCOUNTINGAPPROVAL",
        label: "Accounting Approval Dashboard",
      },
      {
        name: "CENTRALPAYMENTFINANCEAPPROVAL",
        label: "Finance Approval Dashboard",
      },
      {
        name: "CENTRALPAYMENTPROCESSING",
        label: "Payment Processing Dashboard",
      },
      { name: "CENTRALPAYMENTREPORTS", label: "Reports" },
    ],
  },
  {
    key: "SETTING",
    label: "Setting",
    subModules: [
      { name: "MEDICINESETTING", label: "Medicine" },
      { name: "INVOICESETTING", label: "Invoice" },
      {
        name: "ADVANCEPAYMENTSETTING",
        label: "Advanece Payment",
      },
      { name: "CALENDERSETTING", label: "Calender" },
      { name: "OFFERCODESETTING", label: "Offer Code" },
      { name: "TAXMANAGEMENTSETTING", label: "Tax Management" },
      { name: "ROLESSETTING", label: "Roles" },
      { name: "USERROLESSETTING", label: "User Roles" },
      { name: "THERAPIESSETTING", label: "Therapies" },
      { name: "CONDITIONSSETTING", label: "Conditions" },
      { name: "SYMPTOMSETTING", label: "Symptoms" },
      { name: "DOCUMENTCONFIG", label: "Document Configuration" },
      { name: "CENTERFLOORCONFIG", label: "Center Floor Configuration" },
      { name: "HRCONFIGURATIONSSETTING", label: "HR Configurations" },
      { name: "CENTERFALLBACKMANAGER", label: "Centre Fallback Manager" },
    ],
  },
  {
    key: "RECYCLEBIN",
    label: "Recycle Bin",
    subModules: [
      { name: "CENTERLIST", label: "Center List" },
      { name: "PATIENTSLIST", label: "Paitents List" },
      { name: "CHARTLIST", label: "Paitents Chart" },
      { name: "BILLLIST", label: "Paitents Bill" },
      { name: "LEADLIST", label: "Lead List" },
      { name: "MEDICINELIST", label: "Medicine List" },
      { name: "INTERNLIST", label: "Intern List" },
    ],
  },
  {
    key: "TALLY",
    label: "Tally",
    subModules: [
      { name: "SEND_TO_TALLY", label: "Send to Tally" },
      { name: "TALLY_LOGS", label: "Tally Logs" },
    ],
  },
  {
    key: "POS_PAYMENTS",
    label: "POS Payments",
    subModules: [
      { name: "POS_MONITOR", label: "View POS Payments" },
      // Refunds move money back to the customer — kept separate so it can be
      // granted to finance without giving it to every cashier.
      { name: "POS_REFUND", label: "Refund POS Payments" },
      // "Bill it" raises the bill for a charge the terminal already took.
      // Separate from viewing, since it writes to the patient's billing.
      { name: "POS_BILL", label: "Bill POS Payments" },
    ],
  },
  {
    key: "REPORT",
    label: "Report",
    subModules: [
      { name: "DASHBOARD", label: "Dashboard" },
      { name: "Report", label: "Report" },
      { name: "FINANCE", label: "Finance" },
      { name: "PATIENTANALYTICS", label: "Patient Analytics" },
      { name: "DOCTORANALYTICS", label: "Doctor Analytics" },
      { name: "DBLOGS", label: "DB Logs" },
      { name: "LEADANALYTICS", label: "Lead Analytics" },
      { name: "OPDANALYTICS", label: "OPD Analytics" },
    ],
  },
  {
    key: "PHARMACY",
    label: "Pharmacy",
    subModules: [
      { name: "DASHBOARD", label: "Dashboard" },
      {
        name: "INVENTORY_HEALTH_REPORT",
        label: "Inventory Health Report",
      },
      { name: "PHARMACYMANAGEMENT", label: "Inventory Management" },
      { name: "GIVENMEDICINES", label: "Given Medicine" },
      { name: "NURSEGIVENMEDICINES", label: "Nurse Given Medicine" },
      { name: "MEDICINEAPPROVAL", label: "Medicine Approval" },
      { name: "MEDICINE_RETURN", label: "Medicine Return" },
      { name: "AUDIT", label: "Audit" },
      {
        name: "REQUISITION_INTERNAL_TRANSFER",
        label: "Requisition: Internal Transfer",
      },
      {
        name: "REQUISITION_SAREYAAN_ORDERS",
        label: "Requisition: Sareyaan Orders",
      },
      {
        name: "REQUISITION_MEDICINE_REQUISITION",
        label: "Requisition: Medicine Requisition",
      },
      {
        name: "RAISE_MEDICINE_REQUISITION",
        label: "Requisition: Raise Medicine Requisition",
      },
      { name: "INVENTORY_STOCK_SUMMARY", label: "Inventory Stock Summary" },
      {
        name: "EXPIRED_MEDICINE_REMOVAL",
        label: "Expired Medicine Removal",
      },
      { name: "BILL_UPLOAD_DASHBOARD", label: "Bill Upload Dashboard" },
      { name: "SAREYAAN_INVENTORY", label: "Sareyaan Inventory" },
      { name: "PHARMACY_ACTIVITY", label: "Activity" },
    ],
  },
  {
    key: "COMPLIANCE",
    label: "Compliance",
    subModules: [
      { name: "OVERVIEW", label: "Overview" },
      { name: "CENTRES", label: "Centres" },
      { name: "REGISTER", label: "Register" },
      { name: "COMPLIANCE_TYPES", label: "Compliance Types" },
      { name: "CATEGORIES", label: "Categories" },
      { name: "APPROVALS", label: "Approvals" },
      { name: "MY_DRAFTS", label: "My Drafts" },
      { name: "ALL_DRAFTS", label: "All Drafts" },
    ],
  },
  {
    key: "THERAPY_LECTURES",
    label: "Therapy Lectures",
    subModules: [],
  },
  {
    key: "GUIDELINES",
    label: "Guidelines",
    subModules: [
      { name: "GUIDELINESMANAGEMENT", label: "Guidelines Management" },
    ],
  },
  {
    key: "AUDIT",
    label: "Audit",
    subModules: [
      { name: "FLOOR_PHOTOS", label: "Floor Photos" },
      { name: "VERIFICATION", label: "Verification" },
    ],
  },
  {
    key: "INCIDENT_REPORTING",
    label: "Incident Reporting",
    subModules: [
      { name: "RAISE_INCIDENT", label: "Raise Incident" },
      { name: "INVESTIGATE_INCIDENT", label: "Investigate Incident" },
      { name: "APPROVE_INCIDENT", label: "Approve Incident" },
      { name: "CLOSE_INCIDENT", label: "Close Incident" },
    ],
  },
  {
    key: "ROUND_NOTES",
    label: "Round Notes",
    subModules: [
      // { name: "VIEW_ROUND_NOTES", label: "View Round Notes" },
      // { name: "CREATE_ROUND_NOTES", label: "Create Round Notes" },
      // { name: "UPDATE_ROUND_NOTES", label: "Update Round Notes" },
      // { name: "DELETE_ROUND_NOTES", label: "Delete Round Notes" },
    ],
  },
  {
    key: "HUBSPOT_REPORTING",
    label: "Hubspot Reporting",
    subModules: [
      { name: "VIEW_HUBSPOT_REPORTING", label: "View Hubspot Reporting" },
      { name: "HUBSPOT_CENTER_LEADS_COUNT", label: "Center Leads Count" },
      { name: "HUBSPOT_OWNER_LEADS_COUNT", label: "Owner Leads Count" },
      {
        name: "HUBSPOT_CITY_QUALITY_BREAKDOWN",
        label: "City Quality Breakdown",
      },
      {
        name: "HUBSPOT_OWNER_QUALITY_BREAKDOWN",
        label: "Owner Quality Breakdown",
      },
      { name: "HUBSPOT_CITY_VISIT_DATE", label: "City Visit Date" },
      { name: "HUBSPOT_OWNER_VISIT_DATE", label: "Owner Visit Date" },
      { name: "HUBSPOT_CITY_VISITED_DATE", label: "City Visited Date" },
      { name: "HUBSPOT_OWNER_VISITED_DATE", label: "Owner Visited Date" },
      { name: "HUBSPOT_CITY_LEAD_STATUS", label: "City Lead Status" },
      { name: "HUBSPOT_OWNER_LEAD_STATUS", label: "Owner Lead Status" },
    ],
  },
  {
    key: "MIS_REPORTS",
    label: "MIS Reports",
    subModules: [
      { name: "MIS_REPORTS_PERMISSION", label: "View MIS Reports" },
      { name: "DASHBOARDS", label: "Dashboards Category" },
      { name: "FINANCE_REVENUE", label: "Finance & Revenue Category" },
      {
        name: "OCCUPANCY_PATIENT_MANAGEMENT",
        label: "Occupancy & Patient Management Category",
      },
      { name: "CLINICAL_OPERATIONS", label: "Clinical Operations Category" },
      { name: "DOCTOR_COUNSELLING", label: "Doctor & Counselling Category" },
      { name: "NURSING_OPERATIONS", label: "Nursing Operations Category" },
      {
        name: "DOCUMENTATION_COMPLIANCE",
        label: "Documentation & Compliance Category",
      },
      { name: "QUALITY_INCIDENTS", label: "Quality & Incidents Category" },
      { name: "HR_ATTENDANCE", label: "HR & Attendance Category" },

      // Dashboards
      { name: "DAILY_DASHBOARD", label: "Daily Dashboard" },
      { name: "METRICS_REPORT", label: "Metrics Report" },

      // Finance & Revenue
      { name: "DAILY_INVOICES", label: "Daily Invoices" },
      { name: "DUE_AMOUNT", label: "Due Amount" },
      { name: "OPD_CHARGES", label: "OPD Charges" },
      { name: "CASH_PER_CENTER", label: "Cash Per Center" },
      { name: "REFUND_AMOUNT", label: "Refund Amount" },
      { name: "WRITE_OFF_AMOUNT", label: "Write Off Amount" },
      { name: "CENTRAL_EXPENSES", label: "Central Expenses" },
      { name: "CASH_RECO_COMPLIANCE", label: "Cash Reco Compliance" },

      // Occupancy & Patient Management
      { name: "OCCUPANCY", label: "Occupancy" },
      { name: "READMISSION", label: "Readmission" },

      // Clinical Operations
      { name: "VITAL_SIGNS", label: "Vital Signs" },
      { name: "ROUND_NOTES", label: "Round Notes" },
      { name: "CLINICAL_NOTES", label: "Clinical Notes" },

      // Doctor & Counselling
      {
        name: "DOCTOR_PSYCHOLOGIST_STAY_RANGE",
        label: "Doctor/Psychologist Stay Range",
      },
      { name: "COUNSELLING_SESSIONS_PATIENTS", label: "Counselling Patients" },
      { name: "COUNSELLING_SESSIONS", label: "Counselling Sessions" },
      { name: "COUNSELLING_RECORDING", label: "Counselling Recording" },
      { name: "PATIENT_ASSIGNED_STATUS", label: "Patient Assigned Status" },
      { name: "SUSPENDED_ASSIGNED", label: "Suspended Assigned" },

      // Nursing Operations
      { name: "NURSES_DOD", label: "Nurses DOD" },
      { name: "NURSES_DASHBOARD_DOD", label: "Nurses Dashboard DOD" },

      // Documentation & Compliance
      { name: "PATIENT_DOCS", label: "IPD Patient Docs" },
      { name: "OPD_PATIENT_DOCS", label: "OPD Patient Docs" },
      { name: "DOCS_COMPLIANCE", label: "Docs Compliance" },
      { name: "FORMS_DATA", label: "Forms Data" },

      // Quality & Incidents
      { name: "INCIDENT", label: "Incident" },
      { name: "SOP_ALERTS", label: "SOP Alerts" },

      // HR & Attendance
      { name: "ATTENDANCE", label: "Attendance" },
      { name: "ATTRITION_DATA", label: "Attrition Data" },
    ],
  },
  {
    key: "MIS_MASTER",
    label: "MIS Master",
    subModules: [
      { name: "REPORTS", label: "Reports" },
      { name: "RUN_SCRIPTS", label: "Run Scripts" },
      { name: "RUN_HISTORY", label: "Run History" },
    ],
  },
  {
    key: "HR",
    label: "HR",
    subModules: [
      // master employee
      { name: "MASTER_EMPLOYEE", label: "Master Employee" },
      // Offer Letter column in Master Employee
      {
        name: "PREVIEW_OFFER_LETTER",
        label: "Preview Offer Letter (Master Employee)",
      },
      // new joining
      { name: "NEW_JOINING_ADD_REQUEST", label: "New Joinings Add Request" },
      { name: "NEW_JOINING_APPROVAL", label: "New Joinings Approval" },
      { name: "NEW_JOINING_BIOMETRIC", label: "Biometric Approvals" },
      { name: "NEW_JOINING_IT", label: "New Joinings IT" },
      // exit employee
      {
        name: "EXIT_EMPLOYEE_ADD_REQUEST",
        label: "Exit Employees Add Request",
      },
      { name: "EXIT_EMPLOYEE_APPROVAL", label: "Exit Employees Approval" },
      { name: "EXIT_BIOMETRIC_APPROVAL", label: "Exit Biometric Approval" },
      { name: "EXIT_EMPLOYEE_FNF", label: "Exit Employees FNF" },
      { name: "EXIT_EMPLOYEE_IT", label: "Exit Employees IT" },
      // salary advance
      {
        name: "SALARY_ADVANCE_ADD_REQUEST",
        label: "Salary Advance Add Request",
      },
      { name: "SALARY_ADVANCE_APPROVAL", label: "Salary Advance Approval" },
      // transfer employee
      {
        name: "TRANSFER_EMPLOYEE_ADD_REQUEST",
        label: "Employee Transfer Add Request",
      },
      {
        name: "TRANSFER_EMPLOYEE_APPROVAL",
        label: "Employee Transfer Approvals",
      },
      {
        name: "TRANSFER_EMPLOYEE_CURRENT_LOCATION_APPROVAL",
        label: "Outgoing Employee Transfer Approvals",
      },
      {
        name: "TRANSFER_EMPLOYEE_TRANSFER_LOCATION_APPROVAL",
        label: "Incoming Employee Transfer Approvals",
      },
      {
        name: "TRANSFER_EMPLOYEE_IT",
        label: "Employee Transfer IT",
      },
      // hiring
      {
        name: "HIRING_ADD_REQUEST",
        label: "Hiring Add Request",
      },
      {
        name: "HIRING_APPROVAL",
        label: "Hiring Approvals",
      },
      {
        name: "MY_HIRING_STATUS",
        label: "My Hiring Status",
      },
      {
        name: "NEW_JOINING_BIOMETRIC_MAPPING",
        label: "New Joining Biometric Creation",
      },
      {
        name: "NEW_JOINING_BIOMETRIC_REQUESTS",
        label: "New Joining Biometric Requests",
      },
      {
        name: "BIOMETRIC_ADDITION_REQUEST",
        label: "JRC Mapping with Biometric ID",
      },
      {
        name: "GET_BIOMETRIC_ADDITION_REQUESTS",
        label: "Get Biometric Addition Requests",
      },
      // {
      //   name: "GET_MY_BIOMETRIC_REQUESTS",
      //   label: "Get My Biometric Requests",
      // },
      // TPM-Third Party Manpower
      {
        name: "THIRD_PARTY_MANPOWER_ADD_REQUEST",
        label: "Third Party Manpower Add Request",
      },
      {
        name: "THIRD_PARTY_MANPOWER_APPROVAL",
        label: "Third Party Manpower Approvals",
      },
      // Attendance
      { name: "ATTENDANCE_LOG", label: "Attendance Log" },
      { name: "MONTHLY_ATTENDANCE", label: "Monthly Attendance" },
      // { name: "MAIN_DASHBOARD", label: "Attendance Dashboard" },
      { name: "ATTENDANCE_METRICS", label: "Attendance Metrics" },
      {
        name: "REPORTINGS_ATTENDANCE_METRICS",
        label: "Attendance Metrics - Direct Reportings",
      },
      { name: "MY_ATTENDANCE", label: "My Attendance" },
      {
        name: "MY_ATTENDANCE_REGULARIZATION",
        label: "My Attendance Regularization",
      },

      // Regularization
      { name: "MY_REGULARIZATIONS", label: "My Regularizations" },
      {
        name: "GET_REGULARIZATIONS_REQUESTS",
        label: "Regularizations Requests",
      },
      // Employee Reporting & shift roster
      { name: "ASSIGN_MANAGER", label: "Assign Manager" },
      {
        name: "MANAGE_EMPLOYEE_REPORTINGS",
        label: "Manage Employee Reportings",
      },
      { name: "SHIFT_ROSTER", label: "Shift roster" },
      { name: "ASSIGN_ROTATIONAL_SHIFT", label: "Assign Rotational Shift" },
      // Leave
      { name: "APPLY_LEAVE", label: "Apply Leave" },
      { name: "LEAVE_HISTORY", label: "Leave History" },
      { name: "MANAGE_LEAVES", label: "Manage Leaves" },
      { name: "MY_LEAVES", label: "My Leaves" },
      { name: "RAISED_COMP_OFFS", label: "Raised Comp-Off's" },
      { name: "BALANCE_LEAVES", label: "Balance Leaves" },
      { name: "FESTIVE_LEAVES", label: "Festive Leaves" },
      { name: "CANCELATIONS_REQUESTS", label: "Cancelations Requests" },
      { name: "COMP_OFF_REQUESTS", label: "Comp-Off Addition Requests" },

      // Policy
      { name: "POLICIES", label: "Policies" },
      // Incentives
      { name: "INCENTIVES_ADD_REQUEST", label: "Incentives Add Request" },
      { name: "INCENTIVES_APPROVAL", label: "Incentives Approval" },
      {
        name: "PAYROLL_ADJUSTMENTS_ADD_REQUEST",
        label: "Payroll Adjustments Add Request",
      },
      {
        name: "PAYROLL_ADJUSTMENTS_APPROVAL",
        label: "Payroll Adjustments Approval",
      },
      // Salary
      { name: "SALARY", label: "Salary" },
      // My Pending Approvals
      { name: "MY_PENDING_APPROVALS", label: "My Pending Approvals" },

      { name: "EMPLOYEE_PAYSLIPS", label: "Employee Pay Slips" },
      { name: "MY_PAYSLIPS", label: "My Pay Slips" },
      { name: "MY_SALARY_DATA", label: "My Salary Data" },
      { name: "MY_SALARY_AND_FORMS", label: "My Salary And Forms" },
      { name: "UPLOAD_EMPLOYEE_FORM", label: "Upload Employee Form" },
      { name: "EMPLOYEE_FORMS", label: "Employee Forms" },
      { name: "ESIC_UPLOAD", label: "ESIC Upload" },
      { name: "ESIC_APPROVAL", label: "ESIC Approval" },
      // HR DASHBOARD
      { name: "LEAVE_BALANCE_DASHBOARD", label: "Leave Balance Dashboard" },
      { name: "REPORTEES_LEAVE_BALANCE", label: "Reportees Leave Balance" },
      { name: "EMPLOYEE_DOCUMENTS", label: "Employee Documents" },
      { name: "REGULARIZATION_DASHBOARD", label: "Regularization Dashboard" },
      { name: "ALL_LEAVE_HISTORY", label: "All Leave History" },
      { name: "ALL_REGULARIZATIONS", label: "All Regularizations" },
      { name: "CREATE_REGULARIZATION", label: "Create Regularization" },
      { name: "COMP_OFF_HISTORY", label: "Comp Off History" },
      { name: "CANCELLATIONS_HISTORY", label: "Cancellations History" },
      // FINANCE
      { name: "FINANCE", label: "Finance" },
      {
        name: "TRANSFER_MANAGER_APPROVALS",
        label: "Transfer Manager Approvals",
      },
    ],
  },
  // {
  //   key: "HRMS",
  //   label: "HRMS",
  //   subModules: [
  //     { name: "ATTENDANCE_LOG", label: "Attendance Log" },
  //     { name: "ATTENDANCE_METRICS", label: "Attendance Metrics" },
  //     { name: "MY_ATTENDANCE", label: "My Attendance" },
  //     { name: "ASSIGN_MANAGER", label: "Assign Manager" },
  //     {
  //       name: "MANAGE_EMPLOYEE_REPORTINGS",
  //       label: "Manage Employee Reportings",
  //     },
  //     { name: "LEAVE_HISTORY", label: "Leave History" },
  //   ],
  // },
  {
    key: "WEBCAMSTATS",
    label: "Web Cam Stats",
    subModules: [
      { name: "DASHBOARD", label: "Dashboard" },
      { name: "STATS", label: "Stats" },
      { name: "APIKEYS", label: "Apikeys" },
    ],
  },
  {
    key: "ISSUES",
    label: "Issues",
    subModules: [
      // { name: "TICKET_DASHBOARD", label: "Ticket Dashboard" },
      { name: "RAISE_TICKET", label: "Raise Ticket" },
      { name: "TECHNICAL_ISSUES", label: "Technical Issues" },
      { name: "HR_ISSUES", label: "HR Issues" },
      // { name: "HR_ISSUES_REQUESTS", label: "HR Issues Requests" },
      { name: "FINANCE_ISSUES", label: "Finance Issues" },
      { name: "FINANCE_ISSUES_APPROVAL", label: "Finance Issues Approval" },
      // { name: 'PURCHASE_ISSUES', label: "Purchase Issues" },
      // { name: "REVIEW_SUBMISSIONS", label: "Review Submissions" },
      { name: "MY_ISSUES", label: "My Assigned Issues" },
      { name: "MY_RAISED_TICKETS", label: "My Raised Tickets" },
      { name: "MAINTENANCE_ISSUES", label: "Maintenance Issues" },
      { name: "COMPLAINT_ISSUES", label: "Complaint Issues" },
      { name: "OPERATIONAL_ISSUES", label: "Operational Issues" },
    ],
  },
  {
    key: "RECORDINGS",
    label: "Recordings",
    subModules: [
      { name: "CALL_RECORDINGS", label: "Call Recordings" },
      { name: "FEEDBACK_RECORDINGS", label: "Feedback Recordings" },
      {
        name: "CALL_RECORDINGS_AI_OVERIVIEW",
        label: "Call Recording Overview",
      },
      {
        name: "FEEDBACK_RECORDINGS_AI_OVERIVIEW",
        label: "Feedback Recording Overview",
      },
    ],
  },
  {
    key: "SOPCONFIGS",
    label: "Sop Configs",
    subModules: [
      { name: "MANAGE", label: "Manage" },
      // Reads as NONE on every existing role until an admin re-saves each one,
      // so the pages fall back to MANAGE until that happens.
      { name: "BASELINE_PACKAGE", label: "Baseline Package" },
      // { name: "ALERT_HISTORY", label: "Alert History" },
    ],
  },
  {
    key: "TRAININGS",
    label: "Trainings",
    subModules: [
      { name: "UPLOAD_TRAININGS", label: "Upload Trainings" },
      { name: "VIEW_TRAININGS", label: "View My Trainings" },
      { name: "ALL_TRAININGS", label: "All Trainings" },
      { name: "TRAINING_HISTORY", label: "Training History" },
      { name: "CREATE_TRAINING_RECORD", label: "Create Trainer Record" },
      { name: "TRAINING_RECORDS", label: "Trainer Records" },
      { name: "TRAINING_COMPLETION_NOTIFIER", label: "Training Completion Notifier" },
    ],
  },
  {
    key: "UTILITIES",
    label: "Utilities",
    subModules: [
      { name: "UPLOAD_BILL", label: "Upload Bill" },
      { name: "REPORTS", label: "Reports" },
    ],
  },
  {
    key: "MARKETING",
    label: "Marketing",
    subModules: [
      { name: "ADD_VISIT_LOG", label: "Add Visit Log" },
      { name: "VIEW_VISIT_LOGS", label: "View All Visit Logs" },
      { name: "VIEW_AGENT_REPORT", label: "Agent Visit Report" },
      { name: "VIEW_AGENT_PROFILE", label: "My Visit History" },
      { name: "VIEW_DOCTOR_VISITS", label: "Doctor Visits" },
      { name: "EXPORT_DOCTOR_DIRECTORY", label: "Doctor Report" },
      { name: "VIEW_MY_DRAFTS", label: "My Drafts" },
    ],
  },
  {
    key: "MASTERDATA",
    label: "Vendor Management",
    subModules: [
      { name: "VENDOR", label: "Vendor" },
      { name: "ITEM_MASTER", label: "Item Master" },
      { name: "ITEM_TYPE", label: "Item Types" },
      { name: "UOM", label: "Unit of Measurement" },
      { name: "PAYMENT_TERM", label: "Payment Terms" },
      { name: "ASSET_CATEGORY", label: "Asset Categories" },
      { name: "DEPARTMENT", label: "Departments" },
      { name: "AUDIT_LOG", label: "Audit Logs" },
      { name: "BUDGET", label: "Budget Management" },
      { name: "PR", label: "Purchase Requisition" },
      { name: "RFQ", label: "Request for Quotation" },
      { name: "PO", label: "Purchase Order" },
      { name: "CONTRACT", label: "Contract Management" },
      { name: "DELIVERY_INTIMATION", label: "Delivery Intimation" },
      { name: "GRN", label: "Goods Receipt Note" },
      { name: "VENDOR_INVOICE", label: "Vendor Invoice" },
      { name: "STORAGE_LOCATION", label: "Storage Location" },
      { name: "PUTAWAY", label: "Putaway" },
      { name: "STOCK", label: "Stock Management" },
      { name: "MATERIAL_ISSUE", label: "Material Issues" },
      { name: "MATERIAL_RETURN", label: "Material Returns" },
      { name: "INVENTORY_TRANSFER", label: "Inventory Transfer" },
      { name: "MOVE_ORDER", label: "Move Orders" },
      { name: "CYCLE_COUNT", label: "Cycle Counts" },
      { name: "STOCK_ADJUSTMENT", label: "Stock Adjustments" },
      { name: "REORDER_RULE", label: "Reorder Rules" },
      { name: "CAPITALIZATION_REQUEST", label: "Capitalization Requests" },
      { name: "CWIP", label: "Capital Work in Progress" },
      { name: "FIXED_ASSET", label: "Fixed Assets Register" },
      { name: "ASSET_CAPITALIZATION", label: "Asset Capitalization" },
      { name: "MAINTENANCE_REQUEST", label: "Maintenance Requests" },
      { name: "WORK_ORDER", label: "Work Orders" },
      { name: "ASSET_TRANSFER", label: "Asset Transfer" },
      { name: "ASSET_WRITEOFF", label: "Asset Write-off / Sale" },
      { name: "TASK_TEMPLATE", label: "Task Templates" },
      { name: "PM_SCHEDULE", label: "PM Schedules" },
      { name: "MAINTENANCE_JOB", label: "Maintenance Jobs" },
      { name: "VERIFICATION_JOB", label: "Verification Jobs" },
      { name: "PHYSICAL_VERIFICATION", label: "Physical Verifications" },
      { name: "ASSET_TAG", label: "Create Tags" },
      { name: "ASSET_SCAN", label: "Verifications" },
    ],
  },
  {
    key: "GRIEVANCE",
    label: "Grievances",
    // READ  — see the queue and open a grievance
    // WRITE — change status, assign, and record the action taken
    //
    // DELETE is deliberately not offered. A grievance record is the evidence
    // that the 30-day window under SPDI Rule 5(9) was met; a role that can
    // delete one can erase a missed deadline, so the option should not exist
    // rather than merely be discouraged.
    permissionOptions: ["READ", "WRITE", "NONE"],
    // No submodules: a grievance is one workflow with one statutory clock, and
    // splitting it would let a role close a grievance without being able to
    // read the complaint it closes.
    subModules: [],
  },
];

export const modulePermissionOptions = ["READ", "WRITE", "DELETE", "NONE"];

export const getFilteredSubmoduleOptions = (moduleType) => {
  switch (moduleType) {
    case "READ":
      return ["READ", "NONE"];
    case "WRITE":
      return ["READ", "WRITE", "NONE"];
    case "DELETE":
      return ["READ", "WRITE", "DELETE", "NONE"];
    default:
      return ["NONE"];
  }
};
