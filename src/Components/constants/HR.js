// export const designationOptions = [
//     { value: "YOGA_TEACHER", label: "Yoga Teacher" },
//     { value: "WEB_DEVELOPER", label: "Web Developer" },
//     { value: "VIDEOGRAPHER", label: "Videographer" },
//     { value: "THERAPIST", label: "Therapist" },
//     { value: "TELECALLER_TL", label: "Telecaller TL" },
//     { value: "TELECALLER", label: "Telecaller" },
//     { value: "SEO_INTERN", label: "SEO Intern" },
//     { value: "SEO_CONSULTANT", label: "SEO Consultant" },
//     { value: "SECURITY", label: "Security" },
//     { value: "RMO", label: "RMO" },
//     { value: "RECEPTIONIST", label: "Receptionist" },
//     { value: "RECEPTION", label: "Reception" },
//     { value: "RAHA_TEACHER", label: "Raha Teacher" },
//     { value: "QA_TESTER", label: "QA Tester" },
//     { value: "PSYCHOLOGIST", label: "Psychologist" },
//     { value: "PSYCHO_THERAPIST", label: "Psycho Therapist" },
//     { value: "PSYCHIATRIST", label: "Psychiatrist" },
//     { value: "PPC_MANAGER", label: "PPC Manager" },
//     { value: "PHYSIOTHERAPIST", label: "Physiotherapist" },
//     { value: "PHARMACIST", label: "Pharmacist" },
//     { value: "NURSING", label: "Nursing" },
//     { value: "MUSIC_THERAPIST", label: "Music Therapist" },
//     { value: "MSW", label: "MSW" },
//     { value: "MARKETING_HEAD", label: "Marketing Head" },
//     { value: "MARKETING", label: "Marketing" },
//     { value: "MANAGER", label: "Manager" },
//     { value: "KITCHEN_HELPER", label: "Kitchen Helper" },
//     { value: "HR", label: "HR" },
//     { value: "HOUSEKEEPING", label: "Housekeeping" },
//     { value: "HELPER", label: "Helper" },
//     { value: "GRAPHIC_DESIGNER", label: "Graphic Designer" },
//     { value: "FULL_STACK_DEVELOPER", label: "Full Stack Developer" },
//     { value: "DRIVER", label: "Driver" },
//     { value: "DOCTOR", label: "Doctor" },
//     { value: "DEVELOPER", label: "Developer" },
//     { value: "COOK", label: "Cook" },
//     { value: "COO", label: "COO" },
//     { value: "CARETAKER", label: "Caretaker" },
//     { value: "ANESTHESIOLOGIST", label: "Anesthesiologist" },
//     { value: "ACCOUNTS", label: "Accounts" },
//     { value: "ACCOUNTANT", label: "Accountant" },
//     { value: "AA_MEETING", label: "AA Meeting" },
// ];

export const payrollOptions = [
    { value: "OFF_ROLL", label: "Off Roll" },
    { value: "ON_ROLL", label: "On Roll" },
];

export const statusOptions = [
    { value: "ACTIVE", label: "Active" },
    { value: "FNF_CLOSED", label: "FNF Closed" },
    { value: "RESIGNED", label: "Resigned" },
];

export const employeeGenderOptions = [
    { value: "FEMALE", label: "Female" },
    { value: "MALE", label: "Male" },
    { value: "OTHER", label: "Other" },
];

export const salutationOptions = [
    { value: "MR", label: "Mr" },
    { value: "MS", label: "Ms" },
    { value: "MRS", label: "Mrs" },
    { value: "DR", label: "Dr" },
];

export const HiringPreferredGenderOptions = [
    { value: "MALE", label: "Male", },
    { value: "FEMALE", label: "Female", },
    { value: "OTHER", label: "Other", },
    { value: "NO_PREFERENCE", label: "No Preference", },
];

export const TPMOptions = [
    "CARETAKER",
    "COOK",
    "DRIVER",
    "HELPER",
    "HOUSEKEEPING",
    "KITCHEN_HELPER",
    "SECURITY"
];

export const employmentOptions = [
    { label: "Apprentice", value: "APPRENTICE" },
    { label: "Consultant", value: "CONSULTANT" },
    { label: "Consultant Session", value: "CONSULTANT_SESSION" },
    { label: "Contract", value: "CONTRACTUAL" },
    { label: "FTE", value: "FULL_TIME" },
    { label: "Intern", value: "INTERN" },
];

export const SIMPLIFIED_FINANCE_TYPES = [
    "CONTRACTUAL",
    "CONSULTANT",
    "INTERN",
    "APPRENTICE",
    "CONSULTANT_SESSION",
    "VENDOR",
];

export const isSimplifiedFinanceType = (type) =>
    SIMPLIFIED_FINANCE_TYPES.includes((type || "").trim().toUpperCase());

// Consultants additionally carry a TDS rate (%): TDS is deducted from the CTC
// and their In Hand Salary is shown/stored as CTC − TDS.
export const isConsultantFinanceType = (type) =>
    (type || "").trim().toUpperCase() === "CONSULTANT";

// PF applies to newEmploymentType FULL_TIME employees (category FORM11 opts
// out). Also covers employees whose employmentType is FULL_TIME but who were
// downgraded to newEmploymentType PART_TIME while still working 6 days/week
// (minimumPresentDays: 6, minimumPresentUnit: "WEEK") — they remain
// PF-eligible despite the PART_TIME label.
export const isPfApplicable = (employee) => {
    if (!employee) return false;

    const category = (employee.category || "").trim().toUpperCase();
    if (category === "FORM11") return false;

    const newEmploymentType = (employee.newEmploymentType || "").trim().toUpperCase();
    if (newEmploymentType === "FULL_TIME") return true;

    const employmentType = (employee.employmentType || "").trim().toUpperCase();
    const minimumPresentUnit = (employee.minimumPresentUnit || "").trim().toUpperCase();
    if (
        employmentType === "FULL_TIME" &&
        newEmploymentType === "PART_TIME" &&
        minimumPresentUnit === "WEEK" &&
        Number(employee.minimumPresentDays) === 6
    ) {
        return true;
    }

    return false;
};

export const paymentTypeOptions = [
    { label: "Monthly", value: "MONTHLY" },
    { label: "Per Session", value: "PER_SESSION" },
];

export const employmentStatus = [
    { label: "Permanent", value: "PERMANENT" },
    { label: "Probation", value: "PROBATION" },
    { label: "Training", value: "TRAINING" },
];

export const newEmploymentOptions = [
    { label: "Full Time", value: "FULL_TIME" },
    { label: "Part Time", value: "PART_TIME" },
];

export const presentUnitOptions = [
    { label: "Per Month", value: "MONTH" },
    { label: "Per Session", value: "SESSION" },
    { label: "Per Week", value: "WEEK" },
    { label: "Sessions", value: "SESSIONS" },
];

export const filterEmploymentOptions = [
    { label: "Apprentice", value: "APPRENTICE" },
    { label: "Consultant", value: "CONSULTANT" },
    { label: "Consultant Session", value: "CONSULTANT_SESSION" },
    { label: "Contractual", value: "CONTRACTUAL" },
    { label: "FTE", value: "FULL_TIME" },
    { label: "Intern", value: "INTERN" },
    { label: "Vendor", value: "VENDOR" },
];

export const categoryOptions = [
    { label: "Consultant", value: "CONSULTANT" },
    { label: "Form 11", value: "FORM11" },
    { label: "Intern", value: "INTERN" },
    { label: "Non Aadhaar", value: "NON_AADHAAR" },
    { label: "PF", value: "PF" },
];

// "Non Aadhaar" employees have no PAN/Aadhaar on record, so neither the numbers
// nor their uploads are demanded for that category (mirrors the server-side
// add/edit employee validators).
export const isNonAadhaarCategory = (category) =>
    (category || "").trim().toUpperCase() === "NON_AADHAAR";

// ---------------------------------------------------------------------------
// Relaxed employee form
//
// Mirror of RELAXED_EMPLOYEE_FORM_USERS in the server's
// src/validators/HR/employee/add.validator.js — these user._id values may save
// the employee form without the usual mandatory fields (back-dated / partial
// data entry). Keep both lists in sync.
//
// name, currentLocation, joinningDate and status stay mandatory even for them —
// attendance, payroll and the leave-deduction cron cannot run without those.
// ---------------------------------------------------------------------------
export const RELAXED_EMPLOYEE_FORM_USERS = new Set([
    "67a4983f102397b0c939f937",
    "68f8f38cbfb5c1f785102465",
    "696e176dea1a23b429717267",
    "6874c5a2788d8c2bb3c8e724",
]);

export const isRelaxedEmployeeFormUser = (userId) =>
    !!userId && RELAXED_EMPLOYEE_FORM_USERS.has(String(userId));

export const RELAXED_EMPLOYEE_REQUIRED_FIELDS = [
    "name",
    "currentLocation",
    "joinningDate",
    "status",
];

export const employeeGroupOptions = [
    { label: "PF Excluded", value: "PF_EXCLUDED" },
    { label: "PF Included", value: "PF_INCLUDED" }
];

export const accountOptions = [
    { label: "AHMEDABAD PVT LTD AC", value: "AHMEDABAD_PVT_LTD_AC" },
    { label: "AROHA PVT LTD AC", value: "AROHA_PVT_LTD_AC" },
    { label: "BANGALORE PVT LTD AC", value: "BANGALORE_PVT_LTD_AC" },
    { label: "CHENNAI PVT LTD AC", value: "CHENNAI_PVT_LTD_AC" },
    { label: "GURGAON PVT LTD AC", value: "GURGAON_PVT_LTD_AC" },
    { label: "KOPARKHAIRANE PVT LTD AC", value: "KOPARKHAIRANE_PVT_LTD_AC" },
    { label: "MALAD EAST PVT LTD AC", value: "MALAD_EAST_PVT_LTD_AC" },
    { label: "MALAD WEST PVT LTD AC", value: "MALAD_WEST_PVT_LTD_AC" },
    { label: "NOIDA PVT LTD AC", value: "NOIDA_PVT_LTD_AC" },
    { label: "PUNE PVT LTD AC", value: "PUNE_PVT_LTD_AC" },
    { label: "SAREYAAN PHARMA AC", value: "SAREYAAN_PHARMA_AC" },
    { label: "TALOJA PVT LTD AC", value: "TALOJA_PVT_LTD_AC" },
    { label: "TALOJA PVT LTD ADMIN", value: "TALOJA_PVT_LTD_ADMIN" },
    { label: "THANE PVT LTD AC", value: "THANE_PVT_LTD_AC" },
    { label: "TMH PVT LTD AC", value: "TMH_PVT_LTD_AC" },
];

export const legends = [
    { label: "Fixed Salary", color: "#ffc000" },
    { label: "Earned Salary", color: "#f8cbad" },
    // { label: "PF / ESIC Salary", color: "#A9D08E" },
    { label: "Employee Deduction", color: "#8EA9DB" },
    { label: "Employer Deduction", color: "#7B8FD1" },
];

export const approvalStatusOptions = [
    { value: "ALL", label: "All Approvals" },
    { value: "PENDING", label: "Pending Approvals" },
    { value: "APPROVED", label: "Approved Approvals" },
    { value: "REJECTED", label: "Rejected Approvals" },
    { value: "MANNUALLY_PROCESSED", label: "Manually Processed" },
];

export const FILE_PREVIEW_CUTOFF = "2026-02-06";

export const myDashboardTypeOptions = [
    { value: "", label: "All Types" },
    { value: "LEAVE", label: "Leave" },
    { value: "REGULARIZATION", label: "Regularization" },
    { value: "ADVANCE_SALARY", label: "Advance Salary" },
    { value: "INCENTIVE", label: "Incentive" },
    { value: "PAYROLL_ADJUSTMENT", label: "Payroll Adjustment" },
    { value: "NEW_JOINING", label: "New Joining" },
    { value: "EXIT_EMPLOYEE", label: "Exit Employee" },
    { value: "TRANSFER_OUTGOING", label: "Transfer Outgoing" },
    { value: "TRANSFER_INCOMING", label: "Transfer Incoming" },
    { value: "HIRING_REQUEST", label: "Hiring Request" },
    { value: "TPM", label: "TPM" },
];

export const biometricDepartmentOptions = [
    "ACCOUNTS",
    "ADMIN",
    "CARETAKER",
    "COUNSELLING",
    "DRIVER",
    "FACILITY MANAGER",
    "HOUSEKEEPING",
    "HR",
    "KITCHEN",
    "MARKETING",
    "MEDICAL",
    "NURSING",
    "PHARMACIST",
    "PSYCHIATRIST",
    "PSYCHOLOGIST",
    "RECEPTIONIST",
    "SOCIAL WORKER",
    "WATCHMAN",
    "YOGA",
].map((department) => ({ label: department, value: department }));

export const activeFinanceOptions = [
    { value: "ALL", label: "All" },
    { value: "ACTIVE", label: "Active" },
    { value: "INACTIVE", label: "InActive" },
];

export const ULTRA_SIMPLIFIED_FINANCE_COMPANY_IDS = [
    "6ae6250ec8919de4108f01ce", // Sareyaan
];