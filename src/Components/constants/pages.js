const pages = [
  {
    id: "recyclebin",
    label: "Recycle bin",
    name: "Recycle bin",
    link: "/recyclebin",
    icon: "ri-delete-bin-6-line",
  },
  {
    id: "centerDashboard",
    label: "Center Dashboard",
    name: "Center Dashboard",
    link: "/center-dashboard",
    icon: "bx bx-broadcast",
  },
  {
    id: "misMaster",
    label: "MIS Master",
    name: "MIS Master",
    link: "/mis-master",
    icon: "bx bx-line-chart",
  },
  {
    id: "nurse",
    label: "Nurse",
    name: "Nurse",
    link: "/nurse",
    icon: "bx bx-user",
  },
  {
    id: "psychologist",
    label: "Psychologist",
    displayLabel: "Psychologist Dashboard",
    name: "Psychologist",
    link: "/psychologist",
    icon: "bx bx-comment-detail",
  },
  {
    id: "emergency",
    label: "Emergency",
    name: "Emergency",
    link: "/emergency",
    icon: "bx bxs-error",
  },
  {
    id: "doctorvisits",
    label: "Doctor Visits",
    name: "Doctor Visits",
    link: "/doctor-visits",
    icon: "bx bx-user-voice",
    permissions: {
      create: true,
      edit: true,
      delete: true,
    },
  },

  {
    id: "centralpayment",
    label: "Central Payment",
    name: "Central Payment",
    link: "/centralpayment",
    icon: "bx bx-wallet-alt",
  },
  {
    id: "incidentreporting",
    label: "Incident Reporting",
    name: "Incident Reporting",
    link: "/incident-reporting",
    icon: "bx bx-error",
    permissions: {
      create: true,
      edit: true,
      delete: true,
    },
  },
  {
    id: "grievances",
    label: "Grievances",
    name: "Grievances",
    link: "/grievances",
    icon: "bx bx-shield-quarter",
    // No `permissions` block on purpose — User/Form.js only renders the
    // Create/Edit/Delete checkboxes when one is present. Page Access decides
    // whether this page is VISIBLE to a user; what they may DO on it is the
    // GRIEVANCE module in Roles Management, so there is one place to look
    // rather than two that can disagree.
  },
  {
    id: "cash",
    label: "Cash",
    name: "Cash",
    link: "/cash",
    icon: "bx bx-rupee",
    permissions: {
      create: true,
      edit: true,
      delete: true,
    },
    // children: [
    //   {
    //     name: "Reports",
    //     permissions: {
    //       create: true,
    //       edit: true,
    //       delete: true,
    //     },
    //   },
    //   {
    //     name: "Balance",
    //     permissions: {
    //       create: true,
    //       edit: true,
    //       delete: true,
    //     },
    //   },
    //   {
    //     name: "Deposits",
    //     permissions: {
    //       create: true,
    //       edit: true,
    //       delete: true,
    //     },
    //   },
    //   {
    //     name: "Spending",
    //     permissions: {
    //       create: true,
    //       edit: true,
    //       delete: true,
    //     },
    //   },
    // ],
  },
  {
    id: "users",
    label: "User",
    name: "User",
    link: "/user",
    icon: "bx bx-user",
    permissions: {
      create: true,
      edit: true,
      delete: true,
    },
  },
  {
    id: "intern",
    label: "Intern",
    name: "Intern",
    link: "/intern/*",
    icon: "bx bx-user",
    permissions: {
      create: true,
      edit: true,
      delete: true,
    },
    children: [
      {
        name: "Timeline",
        permissions: {
          create: true,
          edit: true,
          delete: true,
        },
      },
      {
        name: "Billing",
        permissions: {
          create: true,
          edit: true,
          delete: true,
        },
      },
      {
        name: "Forms",
        permissions: {
          create: true,
          edit: true,
          delete: true,
        },
      },
      {
        name: "Certificate",
        permissions: {
          create: true,
          edit: true,
          delete: true,
        },
      },
    ],
  },
  {
    id: "lead",
    label: "Lead",
    name: "Lead",
    link: "/lead",
    icon: "bx bx-user",
    permissions: {
      create: true,
      edit: true,
      delete: true,
    },
  },
  {
    id: "patient",
    label: "Patient",
    name: "Patient",
    link: "/patient/*",
    icon: "bx bx-user-plus",
    permissions: {
      create: true,
      edit: true,
      delete: true,
    },
    children: [
      {
        name: "Charting",
        permissions: {
          create: true,
          edit: true,
          delete: true,
        },
      },
      {
        name: "Billing",
        permissions: {
          create: true,
          edit: true,
          delete: true,
        },
      },
      {
        name: "Forms",
        permissions: {
          create: true,
          edit: true,
          delete: true,
        },
      },
      {
        name: "OPD",
        permissions: {
          create: true,
          edit: true,
          delete: true,
        },
      },
      {
        name: "Timeline",
      },
      {
        name: "Belongings",
        permissions: {
          create: true,
          edit: true,
          delete: true,
        },
      },
    ],
  },
  {
    id: "alert",
    label: "Alert",
    name: "Alert",
    link: "/alert",
    icon: "bx bx-bell",
  },
  {
    id: "referral",
    label: "Referral",
    displayLabel: "Contacts",
    name: "Referral",
    link: "/contacts",
    icon: "bx bx-share-alt",
    permissions: {
      create: true,
      edit: true,
      delete: true,
    },
  },
  {
    id: "roundnotes",
    label: "Round Notes",
    name: "Round Notes",
    link: "/round-notes",
    icon: "ri-sticky-note-line",
    permissions: {
      create: true,
      edit: true,
      delete: true,
    },
  },
  {
    id: "mireporting",
    label: "Mi Reporting",
    name: "Mi Reporting",
    link: "/mi-reporting",
    icon: "ri-sticky-note-line",
    permissions: {
      create: true,
      edit: true,
      delete: true,
    },
  },
  {
    id: "booking",
    label: "Booking",
    name: "Booking",
    link: "/booking",
    icon: "bx bx-calendar",
    permissions: {
      create: true,
      edit: true,
      delete: true,
    },
  },
  {
    id: "setting",
    label: "Setting",
    name: "Setting",
    link: "/setting",
    icon: "bx bxs-cog",
    permissions: {
      create: true,
      edit: true,
      delete: true,
    },
  },
  {
    id: "report",
    label: "Report",
    name: "Report",
    link: "/report",
    icon: "bx bxs-report",
  },
  {
    id: "pharmacy",
    label: "Pharmacy",
    name: "Pharmacy",
    link: "/pharmacy",
    icon: "bx bx-book",
  },
  {
    id: "compliance",
    label: "Compliance",
    name: "Compliance",
    link: "/compliance",
    icon: "bx bx-shield-alt-2",
  },
  {
    id: "masterdata",
    label: "Vendor Management",
    name: "Vendor Management",
    link: "/vendor-management",
    icon: "bx bx-purchase-tag-alt",
  },
  {
    id: "tranings",
    label: "Trainings",
    name: "Trainings",
    link: "/trainings",
    icon: "bx bx-book-reader",
  },
  {
    id: "utilities",
    label: "Utilities",
    name: "Utilities",
    link: "/utilities",
    icon: "bx bx-receipt",
  },
  {
    id: "guidelines",
    label: "Guidelines",
    name: "Guidelines",
    link: "/guidelines",
    icon: "bx bx-book-open",
  },
  {
    id: "hr",
    label: "HR",
    name: "HR",
    link: "/hr",
    icon: "bx bx-body",
  },
  {
    id: "audit",
    label: "Audit",
    name: "Audit",
    link: "/audit",
    icon: "bx bx-clipboard",
  },
  {
    id: "issues",
    label: "Issues",
    name: "Issues",
    link: "/issues",
    icon: "bx bx-error-circle",
  },
  {
    id: "marketing",
    label: "Marketing",
    name: "Marketing",
    link: "/marketing",
    icon: "bx bx-map-pin",
  },
  {
    id: "marketingAgent",
    label: "AI Marketing Agent",
    name: "AI Marketing Agent",
    link: "/marketing-agent",
    icon: "bx bx-bot",
  },
  {
    id: "recordings",
    label: "Recordings",
    name: "Recordings",
    link: "/recordings",
    icon: "bx bx-microphone",
  },
  // {
  //   id: "hrms",
  //   label: "HRMS",
  //   name: "HRMS",
  //   link: "/hrms",
  //   icon: "bx bx-group",
  // },
  {
    id: "webcamstats",
    label: "Web Cam Stats",
    name: "Web Cam Stats",
    link: "/webcamstats",
    icon: "bx bx-group",
  },
  {
    id: "tally",
    label: "Tally",
    name: "Tally",
    link: "/tally",
    icon: "bx bx-transfer",
  },
  {
    id: "pospayments",
    label: "POS Payments",
    name: "POS Payments",
    link: "/pos-payments",
    icon: "bx bx-credit-card",
  },
  {
    id: "sopconfigs",
    label: "SOP-configs",
    name: "SOP-configs",
    link: "/sop-configs",
    icon: "bx bx-transfer",
  },
];

export const WebcamStats = [
  {
    id: "webcamstats-dashboard",
    label: "Dashboard",
    link: "/webcamstats/dashboard",
    icon: "bx bx-home",
  },
  {
    id: "webcamstats-health",
    label: "CCTV Health",
    link: "/webcamstats/health",
    icon: "bx bx-server",
  },
  {
    id: "webcamstats-stats",
    label: "Stats",
    link: "/webcamstats/stats",
    icon: "bx bx-home",
  },
  {
    id: "webcamstats-apikeys",
    label: "API Keys",
    link: "/webcamstats/apikeys",
    icon: "bx bx-home",
  },
];

export const Pharmacy = [
  {
    id: "pharmacy-dashboard",
    label: "Dashboard",
    link: "/pharmacy/dashboard",
    icon: "bx bx-home",
  },
  {
    id: "inventoryHealthReport",
    label: "Health Report",
    link: "/pharmacy/reports/inventory-health",
    icon: "bx bx-pulse",
  },
  {
    id: "pharmacymanagement",
    label: "Inventory",
    link: "/pharmacy/management",
    icon: "bx bx-package",
  },
  {
    id: "givenmedicines",
    label: "Medicine Given",
    link: "/pharmacy/given-med",
    icon: "bx bx-capsule",
  },
  {
    id: "nurseGivenMedicines",
    label: "Nurse Given Medicine",
    link: "/pharmacy/nurse-given-med",
    icon: "bx bx-capsule",
  },
  {
    id: "medicineaApproval",
    label: "Medicine Approval",
    link: "/pharmacy/approval",
    icon: "bx bx-checkbox-checked",
  },
  {
    id: "medicineReturn",
    label: "Medicine Return",
    link: "/pharmacy/medicine-return",
    icon: "bx bx-undo",
  },
  {
    id: "audit",
    label: "Audit",
    link: "/pharmacy/audit",
    icon: "bx bx-fingerprint",
  },
  {
    id: "requisition",
    label: "Requisition",
    icon: "bx bx-notepad",
    isAccordion: true,
    children: [
      {
        id: "internal-transfer",
        label: "Internal Transfer",
        link: "/pharmacy/requisition/internal-transfer",
        icon: "bx bx-transfer",
      },
      {
        id: "sareyaan-orders",
        label: "Sareyaan Orders",
        link: "/pharmacy/requisition/sareyaan-orders",
        icon: "bx bx-store-alt",
      },
      {
        id: "medicine-requisition",
        label: "Medicine Requisition",
        link: "/pharmacy/requisition/medicine-requisition",
        icon: "bx bx-capsule",
      },
      {
        id: "raise-medicine-requisition",
        label: "Raise Med. Requisition",
        link: "/pharmacy/requisition/medicine-requisition/add",
        icon: "bx bx-plus-medical",
      },
    ],
  },
  {
    id: "stockSummary",
    label: "Stock Summary",
    link: "/pharmacy/stock-summary",
    icon: "bx bx-box",
  },
  {
    id: "expiredMedicines",
    label: "Expired Medicines",
    link: "/pharmacy/expired-medicines",
    icon: "bx bx-calendar-x",
  },
  {
    id: "billUploadDashboard",
    label: "Bill Upload History",
    link: "/pharmacy/bill-upload-dashboard",
    icon: "bx bx-history",
  },
  {
    id: "sareyaanInventory",
    label: "Sareyaan Inventory",
    link: "/pharmacy/sareyaan-inventory",
    icon: "bx bx-package",
  },
  {
    id: "pharmacyActivity",
    label: "Activity",
    link: "/pharmacy/activity",
    icon: "bx bx-pulse",
  },
];

export const MIReporting = [
  {
    id: "center-leads-mom",
    label: "Center Leads (MoM)",
    link: "/mi-reporting/center-leads-mom",
    icon: "bx bx-bar-chart-alt-2",
  },
  {
    id: "center-leads-mtd",
    label: "Center Leads (MTD)",
    link: "/mi-reporting/center-leads-mtd",
    icon: "bx bx-line-chart",
  },
  {
    id: "owner-leads-mom",
    label: "Owner Leads (MoM)",
    link: "/mi-reporting/owner-leads-mom",
    icon: "bx bx-bar-chart-square",
  },
  {
    id: "owner-leads-mtd",
    label: "Owner Leads (MTD)",
    link: "/mi-reporting/owner-leads-mtd",
    icon: "bx bx-trending-up",
  },
  {
    id: "city-quality",
    label: "City Quality Breakdown",
    link: "/mi-reporting/city-quality",
    icon: "bx bx-map",
  },
  {
    id: "owner-quality",
    label: "Owner Quality Breakdown",
    link: "/mi-reporting/owner-quality",
    icon: "bx bx-user-check",
  },
  {
    id: "city-visit-date",
    label: "City Visit Date",
    link: "/mi-reporting/city-visit-date",
    icon: "bx bx-calendar",
  },
  {
    id: "owner-visit-date",
    label: "Owner Visit Date",
    link: "/mi-reporting/owner-visit-date",
    icon: "bx bx-calendar-check",
  },
  {
    id: "city-visited-date",
    label: "City Visited Date",
    link: "/mi-reporting/city-visited-date",
    icon: "bx bx-calendar-event",
  },
  {
    id: "owner-visited-date",
    label: "Owner Visited Date",
    link: "/mi-reporting/owner-visited-date",
    icon: "bx bx-calendar-star",
  },
];

export const setting = [
  {
    id: "medicine",
    label: "Medicine",
    link: "/setting/medicine",
    icon: "bx bx-capsule",
  },
  {
    id: "billing",
    label: "Billing",
    link: "/setting/billing",
    icon: "bx bx-receipt",
  },
  {
    id: "calender",
    label: "Calender",
    link: "/setting/calender",
    icon: "bx bxs-calendar",
  },
  {
    id: "offer",
    label: "Offer Code",
    link: "/setting/offercode",
    icon: "bx bxs-offer",
  },
  {
    id: "taxmanagement",
    label: "Tax Management",
    link: "/setting/taxmanagement",
    icon: "bx bx-stats",
  },
  {
    id: "roles",
    label: "Roles & Permissions",
    link: "/setting/rolesmanagment",
    icon: "bx bx-fingerprint",
  },
  {
    id: "userroles",
    label: "User Roles",
    link: "/setting/user-roles",
    icon: "bx bx-id-card",
  },
  {
    id: "therapies",
    label: "Therapies",
    link: "/setting/therapies",
    icon: "bx bx-heart",
  },
  {
    id: "conditions",
    label: "Conditions",
    link: "/setting/conditions",
    icon: "bx bx-health",
  },
  {
    id: "symptoms",
    label: "Symptoms",
    link: "/setting/symptoms",
    icon: "bx bx-health",
  },
  {
    id: "hrconfigs",
    label: "HR-Configurations",
    link: "/setting/hr/configs",
    icon: "bx bx-health",
  },
  {
    id: "documentinputconfig",
    label: "Document Configuration",
    link: "/setting/document/input/configs",
    icon: "bx bx-health",
  },
  {
    id: "centerfloorconfig",
    label: "Center Floor Configuration",
    link: "/setting/center/floor/configs",
    icon: "bx bx-building-house",
  },
  {
    id: "centerfallbackmanager",
    label: "Centre Fallback Manager",
    link: "/setting/center/fallback/manager",
    icon: "bx bx-user-pin",
  },
  {
    id: "grievanceofficer",
    label: "Grievance Officer",
    link: "/setting/grievance-officer",
    icon: "bx bx-user-voice",
  },
];

export const recyclebin = [
  {
    id: "center",
    label: "Center",
    link: "/recyclebin/center",
    icon: "bx bx-buildings",
  },
  {
    id: "patient",
    label: "Patient",
    link: "/recyclebin/patient",
    icon: "bx bx-capsule",
  },
  {
    id: "chart",
    label: "Chart",
    link: "/recyclebin/chart",
    icon: "bx bx-capsule",
  },
  {
    id: "bill",
    label: "Bill",
    link: "/recyclebin/bill",
    icon: "bx bx-capsule",
  },
  {
    id: "lead",
    label: "Lead",
    link: "/recyclebin/lead",
    icon: "bx bx-capsule",
  },
  {
    id: "medicine",
    label: "Medicine",
    link: "/recyclebin/medicine",
    icon: "bx bx-capsule",
  },
  {
    id: "intern",
    label: "Intern",
    link: "/recyclebin/intern",
    icon: "bx bx-capsule",
  },
];

export const HR = [
  // {
  //   id: "hr-dashboard",
  //   label: "Dashboard",
  //   link: "/hr/dashboard",
  //   icon: "bx bx-home",
  // },
  {
    id: "my-pending-approvals",
    label: "My Pending Approvals",
    icon: "bx bx-grid-alt",
    link: "/hr/my-pending-approvals",
  },
  {
    id: "hr-dashboard",
    label: "HR",
    icon: "bx bx-home",
    isAccordion: true,
    children: [
      {
        id: "leave-balance-dashboard",
        label: "Leave Balance",
        link: "/hr/leave-balance/dashboard",
        icon: "bx bx-layer",
      },
      {
        id: "regularization-dashboard",
        label: "Regularizations",
        link: "/hr/regularization/dashboard",
        icon: "bx bx-reset",
      },
      {
        id: "all-leave-history",
        label: "All Leave History",
        link: "/hr/all/leave/history",
        icon: "bx bx-list-ul",
      },
      {
        id: "all-regularizations",
        label: "All Regularizations",
        link: "/hr/all/regularizations",
        icon: "bx bx-reset",
      },
      {
        id: "create-regularization",
        label: "Create Regularization",
        link: "/hr/create/regularization",
        icon: "bx bx-plus-circle",
      },
      {
        id: "comp-off-history",
        label: "Comp Off History",
        link: "/hr/all/compOffs",
        icon: "bx bx-history",
      },
      {
        id: "cancellations-history",
        label: "Cancellations History",
        link: "/hr/all/cancellations/req",
        icon: "bx bx-layer",
      },
      {
        id: "transfer-manager-approval",
        label: "Transfer Manager Approvals",
        icon: "bx bx-line-chart",
        link: "/hr/transfer/manager/approvals",
      },
      {
        id: "employee-documents",
        label: "Employee Documents",
        icon: "bx bx-file",
        link: "/hr/employee/docs",
      },
    ],
  },
  {
    id: "attendance",
    label: "Attendance",
    link: "/hr/attendance",
    icon: "bx bx-time-five",
    isAccordion: true,
    children: [
      // {
      //   id: "main-attendance-dashboard",
      //   label: "Dashboard",
      //   link: "/hr/main/dashboard",
      //   icon: "bx bx-grid-alt",
      // },
      {
        id: "attendance-log",
        label: "Attendance Log",
        link: "/hr/attendance/logs",
        icon: "bx bx-list-ul",
      },
      {
        id: "monthly-attendance",
        label: "Monthly Attendance",
        link: "/hr/attendance/monthly",
        icon: "bx bx-calendar",
      },
      {
        id: "attendance-metrics",
        label: "Attendance Metrics",
        link: "/hr/attendance/metrics",
        icon: "bx bx-stats",
      },
      {
        id: "reporting-metrics",
        label: "Attendance Metrics - Direct Reportings",
        link: "/hr/reporting/metrics",
        icon: "bx bx-stats",
      },
      {
        id: "my-attendance",
        label: "My Attendance",
        link: "/hr/attendance/self",
        icon: "bx bx-calendar-check",
      },
      {
        id: "my-regularizations",
        label: "My Regularizations",
        link: "/hr/attendance/my/regularizations",
        icon: "bx bx-time",
      },
      {
        id: "regularizations-requests",
        label: "Regularizations Requests",
        link: "/hr/attendance/regularizations/requests",
        icon: "bx bx-reset",
      },
    ],
  },
  {
    id: "master-employee",
    label: "Master Employee",
    link: "/hr/employee",
    icon: "bx bx-group",
  },
  {
    id: "new-joinings",
    label: "New Joinings",
    icon: "bx  bx-arrow-from-left",
    isAccordion: true,
    children: [
      {
        id: "add-new-joining",
        label: "Add Request",
        icon: "bx bx-plus",
        link: "/hr/new-joinings/add",
      },
      {
        id: "new-joining-approval",
        label: "Joining Approvals",
        icon: "bx bx-check-shield",
        link: "/hr/new-joinings/approval",
      },
      {
        id: "new-joining-biometric",
        label: "Biometric Approvals",
        icon: "bx bx-fingerprint",
        link: "/hr/new-joinings/biometric/approval",
      },
      {
        id: "new-joining-it",
        label: "IT Approvals",
        icon: "bx bx-chip",
        link: "/hr/new-joinings/it",
      },
    ],
  },
  {
    id: "exit-employees",
    label: "Exit Employees",
    icon: "bx bx-arrow-to-left",
    link: "/hr/exit-employees",
    isAccordion: true,
    children: [
      {
        id: "add-exit-request",
        label: "Add Request",
        icon: "bx bx-plus",
        link: "/hr/exit-employees/add",
      },
      {
        id: "exit-approval",
        label: "Exit Approvals",
        icon: "bx bx-check-shield",
        link: "/hr/exit-employees/approval",
      },
      {
        id: "exit-biometric",
        label: "Biometric Approvals",
        icon: "bx bx-fingerprint",
        link: "/hr/exit-employees/biometric/approval",
      },
      {
        id: "exit-fnf-approval",
        label: "FNF Approvals",
        icon: "bx bx-briefcase",
        link: "/hr/exit-employees/fnf",
      },
      {
        id: "exit-it-approval",
        label: "IT Approvals",
        icon: "bx bx-chip",
        link: "/hr/exit-employees/it",
      },
    ],
  },
  {
    id: "salary-advance",
    label: "Salary Advance",
    link: "/hr/salary-advance",
    icon: "bx bx-rupee",
    isAccordion: true,
    children: [
      {
        id: "add-salary-advance-request",
        label: "Add Request",
        icon: "bx bx-plus",
        link: "/hr/salary-advance/add",
      },
      {
        id: "salary-advance-approval",
        label: "Approvals",
        icon: "bx bx-check-shield",
        link: "/hr/salary-advance/approval",
      },
    ],
  },
  {
    id: "transfer-employees",
    label: "Transfer Employees",
    icon: "bx bx-slider-alt",
    link: "/hr/transfer-employees",
    isAccordion: true,
    children: [
      {
        id: "add-transfer-request",
        label: "Add Request",
        icon: "bx bx-plus",
        link: "/hr/transfer-employees/add",
      },
      {
        id: "transfer-approval",
        label: "All Approvals",
        icon: "bx bx-check-shield",
        link: "/hr/transfer-employees/approval",
      },
      {
        id: "transfer-current-location-approval",
        label: "Outgoing Approvals",
        icon: "bx bx-arrow-to-left",
        link: "/hr/transfer-employees/outgoing",
      },
      {
        id: "transfer-transferred-location-approval",
        label: "Incoming Approvals",
        icon: "bx bx-arrow-to-right",
        link: "/hr/transfer-employees/incoming",
      },
      {
        id: "transfer-it-approval",
        label: "IT Approvals",
        icon: "bx bx-chip",
        link: "/hr/transfer-employees/it",
      },
    ],
  },
  {
    id: "biometric-addition-request",
    label: "Biometric",
    icon: "bx bx-fingerprint",
    link: "/hr/biometric",
    isAccordion: true,
    children: [
      {
        id: "add-new-joining-biometric",
        label: "New Joining Biometric Creation",
        icon: "bx bx-user-check",
        link: "/hr/biometric/new-joining/add",
      },
      {
        id: "get-new-joining-biometric-requests",
        label: "New Joining Biometric Requests",
        icon: "bx bx-check-shield",
        link: "/hr/biometric/new-joining/requests",
      },
      {
        id: "add-biometric-request",
        label: "JRC Mapping with Biometric ID",
        icon: "bx bx-plus",
        link: "/hr/biometric/add",
      },
      {
        id: "get-biometric-addition-requests",
        label: "Get Biometric Addition Requests",
        icon: "bx bx-user-plus",
        link: "/hr/biometric/addition/requests",
      },
      // {
      //   id: "get-biometric-my-requests",
      //   label: "Get My Biometric Requests",
      //   icon: "bx bx-plus",
      //   link: "/hr/biometric/my/requests",
      // },
    ],
  },
  {
    id: "hiring",
    label: "Hiring",
    icon: "bx bx-badge",
    link: "/hr/hiring",
    isAccordion: true,
    children: [
      {
        id: "add-hiring-request",
        label: "Add Request",
        icon: "bx bx-plus",
        link: "/hr/hiring/add",
      },
      {
        id: "hiring-approval",
        label: "Hiring Status and Approvals",
        icon: "bx bx-check-shield",
        link: "/hr/hiring/approval",
      },
      {
        id: "my-hiring-status",
        label: "My Hiring Status",
        icon: "bx bx-list-ul",
        link: "/hr/hiring/management",
      },
    ],
  },
  {
    id: "third-party-manpower",
    label: "Third Party Manpower",
    icon: "bx bx-user-voice",
    link: "/hr/tpm",
    isAccordion: true,
    children: [
      {
        id: "add-tpm-request",
        label: "Add Request",
        icon: "bx bx-plus",
        link: "/hr/tpm/add",
      },
      {
        id: "tpm-approval",
        label: "Approvals",
        icon: "bx bx-check-shield",
        link: "/hr/tpm/approval",
      },
    ],
  },
  {
    id: "employee-reporting",
    label: "Employee Reporting & Roaster",
    link: "/hr/attendance",
    icon: "bx bx-git-branch",
    isAccordion: true,
    children: [
      {
        id: "assign-manager",
        label: "Assign Manager",
        link: "/hr/reporting/assign",
        icon: "bx bx-user-plus",
      },
      {
        id: "manage-employee-reporting",
        label: "Manage",
        link: "/hr/reporting/manage",
        icon: "bx bx-list-check",
      },
      {
        id: "assign-rotational-shift",
        label: "Assign Shift",
        link: "/hr/reporting/shift-roster/assign",
        icon: "bx bx-calendar-plus",
      },
      {
        id: "shift-roster",
        label: "Shift Roster",
        link: "/hr/reporting/shift-roster/list",
        icon: "bx bx-calendar",
      },
    ],
  },
  {
    id: "leaves",
    label: "Leaves",
    link: "/hr/leaves",
    icon: "bx bx-calendar",
    isAccordion: true,
    children: [
      {
        id: "apply-leave",
        label: "Apply Leave",
        link: "/hr/leaves/apply",
        icon: "bx bx-edit",
      },
      {
        id: "leave-history",
        label: "Leave History",
        link: "/hr/leaves/history",
        icon: "bx bx-history",
      },
      {
        id: "manage-leaves",
        label: "Manage Leaves",
        link: "/hr/leaves/manage",
        icon: "bx bx-slider",
      },
      {
        id: "my-leaves",
        label: "My Leaves",
        link: "/hr/leaves/my/leaves",
        icon: "bx bx-calendar",
      },
      {
        id: "my-comp-off",
        label: "Raised Comp-Off's",
        link: "/hr/leaves/my/compOffs",
        icon: "bx bx-send",
      },
      {
        id: "my-balance-leaves",
        label: "Balance Leaves",
        link: "/hr/leaves/my/balance/leaves",
        icon: "bx bx-layer",
      },
      {
        id: "reportees-leave-balance",
        label: "Reportees Leave Balance",
        link: "/hr/leaves/reportees/balance",
        icon: "bx bx-group",
      },
      {
        id: "festive-leaves",
        label: "Festive Leaves List",
        link: "/hr/leaves/festive/leaves",
        icon: "bx bx-party",
      },
      {
        id: "cancellations-requests",
        label: "Cancellations Requests",
        link: "/hr/leaves/get/cancellations",
        icon: "bx bx-x-circle",
      },
      {
        id: "comp-off-requests",
        label: "Comp-Off Addition Requests",
        link: "/hr/leaves/get/comp-offs",
        icon: "bx bx-calendar-check",
      },
    ],
  },
  {
    id: "policies",
    label: "Policies",
    link: "/hr/policies",
    icon: "bx bx-notepad",
    isAccordion: true,
    children: [
      {
        id: "policy",
        label: "Policies",
        link: "/hr/policies",
        icon: "bx bx-spreadsheet",
      },
    ],
  },
  {
    id: "incentives",
    label: "Incentives",
    icon: "bx bx-gift",
    link: "/hr/incentives",
    isAccordion: true,
    children: [
      {
        id: "add-incentives-request",
        label: "Add Request",
        icon: "bx bx-plus",
        link: "/hr/incentives/add",
      },
      {
        id: "incentives-approval",
        label: "Approvals",
        icon: "bx bx-check-shield",
        link: "/hr/incentives/approval",
      },
    ],
  },
  {
    id: "payroll-adjustments",
    label: "Payroll Adjustments",
    icon: "bx bx-slider-alt",
    link: "/hr/payroll-adjustments",
    isAccordion: true,
    children: [
      {
        id: "add-payroll-adjustments-request",
        label: "Add Request",
        icon: "bx bx-plus",
        link: "/hr/payroll-adjustments/add",
      },
      {
        id: "payroll-adjustments-approval",
        label: "Approvals",
        icon: "bx bx-check-shield",
        link: "/hr/payroll-adjustments/approval",
      },
    ],
  },

  {
    id: "payslips",
    label: "Pay Slip",
    icon: "bx bx-wallet", // changed
    link: "/hr/pay-slip",
    isAccordion: true,
    children: [
      {
        id: "employee-pay-slip",
        label: "Employees Pay Slip",
        icon: "bx bx-group", // changed
        link: "/hr/pay-slip/employees",
      },
      {
        id: "my-pay-slip",
        label: "My Pay Slip",
        icon: "bx bx-user-check", // changed
        link: "/hr/pay-slip/my",
      },
      {
        id: "my-salary-data",
        label: "My Salary Data",
        icon: "bx bx-user-check",
        link: "/hr/my/salary/data",
      },
      {
        id: "my-salary-forms",
        label: "My Salary and Forms",
        icon: "bx bx-folder-open",
        link: "/hr/my/forms",
      },
    ],
  },
  {
    id: "employeeform",
    label: "Employee Forms",
    icon: "bx bx-file",
    link: "/hr/employee",
    isAccordion: true,
    children: [
      {
        id: "uploademployeeform",
        label: "Upload Employee Form",
        icon: "bx bx-upload",
        link: "/hr/upload/employee/form",
      },
      {
        id: "employeeforms",
        label: "Employee Forms",
        icon: "bx bx-file",
        link: "/hr/employee/forms",
      },
    ],
  },
  {
    id: "esic",
    label: "ESIC",
    icon: "bx bx-shield-quarter",
    link: "/hr/esic",
    isAccordion: true,
    children: [
      {
        id: "esicupload",
        label: "ESIC Upload",
        icon: "bx bx-upload",
        link: "/hr/esic/upload",
      },
      {
        id: "esicapproval",
        label: "ESIC Approvals",
        icon: "bx bx-check-shield",
        link: "/hr/esic/approval",
      },
    ],
  },
  {
    id: "salary",
    label: "Salary",
    icon: "bx bx-bar-chart-alt-2",
    link: "/hr/salary",
  },
  {
    id: "finance",
    label: "Finance",
    icon: "bx bx-line-chart",
    link: "/hr/finance",
  },
];

export const HRMS = [
  // {
  //   id: "attendance",
  //   label: "Attendance",
  //   link: "/hrms/attendance",
  //   icon: "bx bx-time-five",
  //   isAccordion: true,
  //   children: [
  //     {
  //       id: "attendance-log",
  //       label: "Attendance Log",
  //       link: "/hrms/attendance/logs",
  //       icon: "bx bx-list-ul",
  //     },
  //     {
  //       id: "attendance-metrics",
  //       label: "Attendance Metrics",
  //       link: "/hrms/attendance/metrics",
  //       icon: "bx bx-stats",
  //     },
  //     {
  //       id: "my-attendance",
  //       label: "My Attendance",
  //       link: "/hrms/attendance/self",
  //       icon: "bx bx-calendar-check",
  //     },
  //   ]
  // },
  // {
  //   id: "employee-reporting",
  //   label: "Employee Reporting",
  //   link: "/hrms/attendance",
  //   icon: "bx bx-git-branch",
  //   isAccordion: true,
  //   children: [
  //     {
  //       id: "assign-manager",
  //       label: "Assign Manager",
  //       link: "/hrms/reporting/assign",
  //       icon: "bx bx-user-plus",
  //     },
  //     {
  //       id: "manage-employee-reporting",
  //       label: "Manage",
  //       link: "/hrms/reporting/manage",
  //       icon: "bx bx-list-check",
  //     },
  //   ],
  // },
  // {
  //   id: "leaves",
  //   label: "Leaves",
  //   link: "/hrms/leaves",
  //   icon: "bx bx-calendar",
  //   isAccordion: true,
  //   children: [
  //     {
  //       id: "apply-leave",
  //       label: "Apply Leave",
  //       link: "/hrms/leaves/apply",
  //       icon: "bx bx-edit",
  //     },
  //     {
  //       id: "leave-history",
  //       label: "Leave History",
  //       link: "/hrms/leaves/history",
  //       icon: "bx bx-history",
  //     },
  //     {
  //       id: "manage-leaves",
  //       label: "Manage Leaves",
  //       link: "/hrms/leaves/manage",
  //       icon: "bx bx-history",
  //     },
  //     {
  //       id: "my-leaves",
  //       label: "My Leaves",
  //       link: "/hrms/leaves/my/leaves",
  //       icon: "bx bx-history",
  //     },
  //   ],
  // },
  // {
  //   id: "policies",
  //   label: "Policies",
  //   link: "/hrms/policies",
  //   icon: "bx bx-calendar",
  //   isAccordion: true,
  //   children: [
  //     {
  //       id: "policy",
  //       label: "Policies",
  //       link: "/hrms/policies",
  //       icon: "bx bx-history",
  //     },
  //   ],
  // },
];

export const ISSUES = [
  // {
  //   id: "tickets-dashboard",
  //   label: "Tickets Dashboard",
  //   icon: "bx bx-bar-chart-alt-2",
  //   link: "/issues/dashboard",
  // },
  {
    id: "raise-ticket",
    label: "Raise Ticket",
    icon: "bx bx-message-square-add",
    link: "/issues/raise/ticket",
  },
  {
    id: "tech-issues",
    label: "Technical",
    link: "/issues/tech",
    icon: "bx bx-chip",
  },
  // {
  //   id: "purchase-issues",
  //   label: "Purchase",
  //   link: "/issues/purchase",
  //   icon: "bx bx-category",
  // },
  // {
  //   id: "review-submissions",
  //   label: "Review Submissions",
  //   link: "/issues/review-submissions",
  //   icon: "bx bx-check-shield",
  // },

  {
    id: "hr-issues",
    label: "HR Tickets",
    icon: "bx bx-task",
    link: "/issues/hr/issues",
  },

  {
    id: "maintenance-issues",
    label: "Maintenance Tickets",
    icon: "bx bx-wrench",
    link: "/issues/maintenance/issues",
  },
  {
    id: "complaint-issues",
    label: "Complaint Tickets",
    icon: "bx bx-flag",
    link: "/issues/complaint/issues",
  },
  {
    id: "operational-issues",
    label: "Operational Issues",
    icon: "bx bx-briefcase",
    link: "/issues/operational/issues",
  },

  {
    id: "my-issues",
    label: "My Assigned Tickets",
    icon: "bx bx-user-circle",
    link: "/issues/my/issues",
  },
  {
    id: "my-raised-tickets",
    label: "My Raised Tickets",
    icon: "bx bx-user-check",
    link: "/issues/my/raised/tickets",
  },
  {
    id: "finance-tickets",
    label: "Finance Tickets",
    icon: "bx bx-rupee",
    link: "/issues/my/finance/tickets",
  },
  {
    id: "finance-tickets-approval",
    label: "Finance Tickets Approval",
    icon: "bx bx-receipt",
    link: "/issues/finance/payslips/tickets",
  },
];

export const MARKETING = [
  {
    id: "visit-log-add",
    label: "Add Visit Log",
    icon: "bx bx-plus-circle",
    link: "/marketing/visit-log/add",
  },
  {
    id: "visit-log-list",
    label: "All Visit Logs",
    icon: "bx bx-list-ul",
    link: "/marketing/visit-log/list",
  },
  {
    id: "agent-report",
    label: "Agent Report",
    icon: "bx bx-bar-chart-alt-2",
    link: "/marketing/reports/agent",
  },
  {
    id: "doctor-directory-export",
    label: "Doctor Report",
    icon: "ri-file-excel-2-line",
    link: "/marketing/doctors/export",
  },
];

export const RECORDINGS = [
  {
    id: "call-recordings",
    label: "Call Recordings",
    link: "/recordings/call",
    icon: "bx bx-phone",
  },
  {
    id: "call-recordings-overview",
    label: "Call Recordings Overview",
    link: "/recordings/call/overview",
    icon: "bx bx-analyse",
  },
  {
    id: "feedback-recordings",
    label: "Feedback Recordings",
    link: "/recordings/feedback",
    icon: "bx bx-comment-detail",
  },
  {
    id: "feedback-recordings-overview",
    label: "Feedback Recordings Overview",
    link: "/recordings/feedback/overview",
    icon: "bx bx-analyse",
  },
];

export const SOP_CONFIGS = [
  {
    id: "sopconfigs-create",
    label: "Configure SOP",
    icon: "bx bx-slider-alt",
    isAccordion: true,
    children: [
      {
        id: "sopconfigs-create-new",
        label: "Create New",
        link: "/sop-configs/save",
        icon: "bx bx-plus-circle",
      },
      {
        id: "sopconfigs-manage",
        label: "Manage SOPs",
        link: "/sop-configs/manage",
        icon: "bx bx-list-ul",
      },
    ],
  },
  {
    // Flat, not a second accordion: the sidebar's flat branch highlights on
    // pathname.startsWith(link), so /baseline-package/save/:id keeps this item
    // lit. One nav entry, three routes, no extra chrome.
    id: "sopconfigs-baseline-package",
    label: "Baseline Package",
    link: "/sop-configs/baseline-package",
    icon: "bx bx-test-tube",
  },
  {
    id: "sopconfigs-guide",
    label: "How-to Guide",
    link: "/sop-configs/guide",
    icon: "bx bx-book-open",
  },
];
export const TRAININGS = [
  {
    id: "upload-trainings",
    label: "Upload Trainings",
    link: "/trainings/upload",
    icon: "bx bx-cloud-upload",
  },
  {
    id: "view-trainings",
    label: "View Trainings",
    link: "/trainings/view",
    icon: "bx bx-slideshow",
  },
  {
    id: "all-trainings",
    label: "All Trainings",
    link: "/trainings/all",
    icon: "bx bx-collection",
  },
  {
    id: "training-history",
    label: "Training History",
    link: "/trainings/history",
    icon: "bx bx-time-five",
  },
  {
    id: "create-training-record",
    label: "Create Trainer Record",
    link: "/trainings/create/record",
    icon: "bx bx-edit-alt",
  },
  {
    id: "training-records",
    label: "Trainer Records",
    link: "/trainings/get/record",
    icon: "bx bx-spreadsheet",
  },
];
export const UTILITIES = [
  {
    id: "upload-bill",
    label: "Upload Electricity Bill",
    link: "/utilities/upload-bill",
    icon: "bx bx-cloud-upload",
  },
  {
    id: "reports",
    label: "Reports",
    link: "/utilities/reports",
    icon: "bx bxs-report",
  },
];
export const Compliance = [
  {
    id: "compliance-overview",
    label: "Overview",
    link: "/compliance",
    icon: "bx bx-grid-alt",
  },
  {
    id: "compliance-centres",
    label: "Centres",
    link: "/compliance/centres/pune",
    icon: "bx bx-buildings",
  },
  {
    id: "compliance-register",
    label: "Register",
    link: "/compliance/register",
    icon: "bx bx-list-check",
  },
  {
    id: "compliance-types",
    label: "Compliance Types",
    link: "/compliance/types",
    icon: "bx bx-shield-quarter",
  },
  {
    id: "compliance-categories",
    label: "Categories",
    link: "/compliance/categories",
    icon: "bx bx-category",
  },
  {
    id: "compliance-approvals",
    label: "Approvals",
    link: "/compliance/approvals",
    icon: "bx bx-check-shield",
  },
  {
    id: "compliance-drafts",
    label: "Drafts",
    icon: "bx bx-folder-open",
    isAccordion: true,
    children: [
      {
        id: "compliance-my-drafts",
        label: "My Drafts",
        link: "/compliance/my-drafts",
        icon: "bx bx-edit",
      },
      {
        id: "compliance-all-drafts",
        label: "All Drafts",
        link: "/compliance/drafts",
        icon: "bx bx-folder-open",
      },
    ],
  },
];
export const MASTER_DATA = [
  {
    id: "masterdata-core",
    label: "Master Data",
    icon: "bx bx-data",
    isAccordion: true,
    children: [
      {
        id: "masterdata-vendor",
        label: "Vendors",
        link: "/vendor-management/vendor",
        icon: "bx bx-store",
        permissionModule: "VENDOR",
      },
      {
        id: "masterdata-item",
        label: "Items",
        link: "/vendor-management/item",
        icon: "bx bx-package",
        permissionModule: "ITEM_MASTER",
      },
      {
        id: "masterdata-uom",
        label: "Unit of Measurements",
        link: "/vendor-management/uom",
        icon: "bx bx-ruler",
        permissionModule: "UOM",
      },
      {
        id: "masterdata-payment-term",
        label: "Payment Terms",
        link: "/vendor-management/payment-term",
        icon: "bx bx-credit-card",
        permissionModule: "PAYMENT_TERM",
      },
      {
        id: "masterdata-department",
        label: "Departments",
        link: "/vendor-management/department",
        icon: "bx bx-building",
        permissionModule: "DEPARTMENT",
      },
      {
        id: "audit-log",
        label: "Audit Logs",
        icon: "bx bx-history",
        link: "/vendor-management/audit-log",
        permissionModule: "AUDIT_LOG",
      },
    ],
  },
  // {
  //   id: "masterdata-customer",
  //   label: "Customers",
  //   link: "/master-data/customer",
  //   icon: "bx bx-user",
  // },
  // {
  //   id: "masterdata-delivery-partner",
  //   label: "Delivery Partners",
  //   link: "/master-data/delivery-partner",
  //   icon: "bx bx-car",
  // },
  {
    id: "masterdata-asset-category",
    label: "Asset Categories",
    icon: "bx bx-category",
    isAccordion: true,
    children: [
      {
        id: "asset-category-l1",
        label: "Level 1 Category",
        link: "/vendor-management/asset-category/level/1",
        permissionModule: "ASSET_CATEGORY",
      },
      {
        id: "asset-category-l2",
        label: "Level 2 Category",
        link: "/vendor-management/asset-category/level/2",
        permissionModule: "ASSET_CATEGORY",
      },
      {
        id: "asset-category-l3",
        label: "Level 3 Category",
        link: "/vendor-management/asset-category/level/3",
        permissionModule: "ASSET_CATEGORY",
      },
      {
        id: "asset-category-l4",
        label: "Level 4 Category",
        link: "/vendor-management/asset-category/level/4",
        permissionModule: "ASSET_CATEGORY",
      },
    ],
  },
  {
    id: "procurement",
    label: "Procurement",
    icon: "bx bx-cart",
    isAccordion: true,
    children: [
      {
        id: "procurement-dashboard",
        label: "Dashboard",
        link: "/vendor-management/procurement-dashboard",
        permissionModule: "PO",
      },
      {
        id: "procurement-pr",
        label: "Purchase Requisitions",
        link: "/vendor-management/purchase-requisition",
        permissionModule: "PR",
      },
      {
        id: "procurement-rfq",
        label: "RFQ",
        link: "/vendor-management/rfq",
        permissionModule: "RFQ",
      },
      {
        id: "procurement-po",
        label: "Purchase Orders",
        link: "/vendor-management/po",
        permissionModule: "PO",
      },
      {
        id: "procurement-di",
        label: "Delivery Intimations",
        link: "/vendor-management/delivery-intimation",
        permissionModule: "DELIVERY_INTIMATION",
      },
    ],
  },
  {
    id: "inventory",
    label: "Inventory & Warehouse",
    icon: "bx bx-store",
    isAccordion: true,
    children: [
      {
        id: "inventory-grn",
        label: "Goods Receipt Notes",
        link: "/vendor-management/grn",
        permissionModule: "GRN",
      },
      {
        id: "inventory-storage-location",
        label: "Storage Locations",
        link: "/vendor-management/storage-location",
        permissionModule: "STORAGE_LOCATION",
      },
      {
        id: "inventory-putaway",
        label: "Putaway",
        link: "/vendor-management/putaway",
        permissionModule: "PUTAWAY",
      },
      {
        id: "inventory-location-stock",
        label: "Stock by Location",
        link: "/vendor-management/location-stock",
        permissionModule: "PUTAWAY",
      },
      {
        id: "inventory-stock",
        label: "Stock / Inventory",
        link: "/vendor-management/stock",
        permissionModule: "STOCK",
      },
      {
        id: "inventory-transfer",
        label: "Inventory Transfer",
        link: "/vendor-management/inventory-transfer",
        permissionModule: "INVENTORY_TRANSFER",
      },
      {
        id: "inventory-move-order",
        label: "Move Orders",
        link: "/vendor-management/move-order",
        permissionModule: "MOVE_ORDER",
      },
      {
        id: "inventory-stock-ops-divider",
        label: "— Stock Operations —",
        isDivider: true,
      },
      {
        id: "inventory-material-issue",
        label: "Material Issues",
        link: "/vendor-management/material-issue",
        permissionModule: "MATERIAL_ISSUE",
      },
      {
        id: "inventory-material-return",
        label: "Material Returns",
        link: "/vendor-management/material-return",
        permissionModule: "MATERIAL_RETURN",
      },
      {
        id: "inventory-cycle-count",
        label: "Cycle Counts",
        link: "/vendor-management/cycle-count",
        permissionModule: "CYCLE_COUNT",
      },
      {
        id: "inventory-stock-adjustment",
        label: "Stock Adjustments",
        link: "/vendor-management/stock-adjustment",
        permissionModule: "STOCK_ADJUSTMENT",
      },
      {
        id: "inventory-reorder-rule",
        label: "Reorder Rules",
        link: "/vendor-management/reorder-rule",
        permissionModule: "REORDER_RULE",
      },
    ],
  },
  {
    id: "asset-lifecycle",
    label: "Asset Lifecycle",
    icon: "bx bx-package",
    isAccordion: true,
    children: [
      {
        id: "asset-divider-acquire",
        label: "— Acquire —",
        isDivider: true,
      },
      {
        id: "asset-cap-request",
        label: "Capitalization Requests",
        link: "/vendor-management/capitalization-request",
        permissionModule: "CAPITALIZATION_REQUEST",
      },
      {
        id: "asset-cwip",
        label: "Capital Work in Progress",
        link: "/vendor-management/cwip",
        permissionModule: "CWIP",
      },
      {
        id: "asset-capitalization",
        label: "Asset Capitalization",
        link: "/vendor-management/asset-capitalization",
        permissionModule: "ASSET_CAPITALIZATION",
      },
      {
        id: "asset-divider-register",
        label: "— Register —",
        isDivider: true,
      },
      {
        id: "asset-fixed-register",
        label: "Fixed Assets Register",
        link: "/vendor-management/fixed-asset",
        permissionModule: "FIXED_ASSET",
      },
      {
        id: "asset-tag",
        label: "Asset Tags",
        link: "/vendor-management/asset-tag",
        permissionModule: "ASSET_TAG",
      },
      {
        id: "asset-divider-verification",
        label: "— Verification —",
        isDivider: true,
      },
      {
        id: "asset-verification-job",
        label: "Verification Jobs",
        link: "/vendor-management/verification-job",
        permissionModule: "VERIFICATION_JOB",
      },
      {
        id: "asset-scan-intake",
        label: "Verifications",
        link: "/vendor-management/asset-scan",
        permissionModule: "VERIFICATION_JOB",
      },
      {
        id: "asset-physical-verification",
        label: "Register Check",
        link: "/vendor-management/physical-verification",
        permissionModule: "PHYSICAL_VERIFICATION",
      },
      {
        id: "asset-divider-move",
        label: "— Move & Dispose —",
        isDivider: true,
      },
      {
        id: "asset-transfer",
        label: "Asset Transfer",
        link: "/vendor-management/asset-transfer",
        permissionModule: "ASSET_TRANSFER",
      },
      {
        id: "asset-writeoff",
        label: "Asset Write-off / Sale",
        link: "/vendor-management/asset-writeoff",
        permissionModule: "ASSET_WRITEOFF",
      },
      {
        id: "asset-maintenance-divider",
        label: "— Maintenance —",
        isDivider: true,
      },
      {
        id: "asset-maintenance-request",
        label: "Maintenance Requests",
        link: "/vendor-management/maintenance-request",
        permissionModule: "MAINTENANCE_REQUEST",
      },
      {
        id: "asset-work-order",
        label: "Work Orders",
        link: "/vendor-management/work-order",
        permissionModule: "WORK_ORDER",
      },
      {
        id: "asset-pm-schedule",
        label: "PM Schedules",
        link: "/vendor-management/pm-schedule",
        permissionModule: "PM_SCHEDULE",
      },
      {
        id: "asset-maintenance-job",
        label: "Maintenance Jobs",
        link: "/vendor-management/maintenance-job",
        permissionModule: "MAINTENANCE_JOB",
      },
      {
        id: "asset-task-template",
        label: "Task Templates",
        link: "/vendor-management/task-template",
        permissionModule: "TASK_TEMPLATE",
      },
    ],
  },
  {
    id: "contracts-projects",
    label: "Contracts & Projects",
    icon: "bx bx-briefcase",
    isAccordion: true,
    children: [
      {
        id: "contract-management",
        label: "Contract Management",
        link: "/vendor-management/contract",
        permissionModule: "CONTRACT",
      },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    icon: "bx bx-wallet",
    isAccordion: true,
    children: [
      {
        id: "finance-budget",
        label: "Budget Management",
        link: "/vendor-management/budget",
        permissionModule: "BUDGET",
      },
      {
        id: "finance-vendor-invoice",
        label: "Vendor Invoices",
        link: "/vendor-management/vendor-invoice",
        permissionModule: "VENDOR_INVOICE",
      },
    ],
  },
  {
    id: "accounting-core",
    label: "Accounting Core",
    icon: "bx bx-library",
    isAccordion: true,
    children: [
      {
        id: "accounting-chart-of-accounts",
        label: "Chart of Accounts",
        link: "/vendor-management/chart-of-accounts",
        permissionModule: "LEDGER",
      },
      {
        id: "accounting-ledger",
        label: "Ledgers",
        link: "/vendor-management/ledger",
        permissionModule: "LEDGER",
      },
      {
        id: "accounting-ledger-type",
        label: "Ledger Types",
        link: "/vendor-management/ledger-type",
        permissionModule: "LEDGER_TYPE",
      },
      {
        id: "accounting-ledger-sub-type",
        label: "Ledger Sub Types",
        link: "/vendor-management/ledger-sub-type",
        permissionModule: "LEDGER_TYPE",
      },
      {
        id: "accounting-gl-entry",
        label: "GL Entries",
        link: "/vendor-management/gl-entry",
        permissionModule: "GL_ENTRY",
      },
    ],
  },
];

export default pages;
