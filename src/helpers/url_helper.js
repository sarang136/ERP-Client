//4010/api/v1/
//REGISTER
export const POST_USER_REGISTER = "/auth/user";
export const POST_USER_PROFILE_PICTURE = "/auth/user/profile-picture";
export const POST_USER_DETAIL_INFORMATION = "/auth/user/detail-information";
export const GET_USERS = "/auth/user";
export const GET_DOCTOR_USERS = "/auth/user/center-doctor";
export const GET_DELETED_USERS = "/auth/user/deleted";
export const SUSPEND_USER = "/auth/user/suspend";
export const DELETE_USER = "/auth/user";
export const EDIT_USER = "/auth/user";
export const EDIT_USER_PASSWORD = "/auth/user";
export const POST_USER_SESSION_PRICING = "/auth/user/session-pricing";
export const PUT_USER_SESSION_PRICING = "/auth/user/session-pricing";
export const UPDATE_USER_ACTIVE_INACTIVE = "/auth/user/mark-active-inactive";
//LOGIN
export const POST_USER_LOGIN = "/auth/login";
export const SEARCH_USER = "/auth/search";

//LOGOUT
export const POST_USER_LOGOUT = "/auth/logout";

//DASHBOARD
export const GET_DASHBOARD_ANALYTICS = "/dashboard";

//LOG
export const GET_USER_LOGS = "/log/user";

//CENTER
export const POST_CENTER = "/center";
export const GET_CENTERS = "/center";
export const GET_DELETED_CENTERS = "/center/deleted";
export const GET_ALL_CENTERS = "/center/all";
export const GET_CENTER_BEDS_ANALYTICS = "/center/beds";
export const EDIT_CENTER = "/center";
export const DELETE_CENTER_LOGO = "/center";
export const RESTORE_CENTER = "/center/restore";
export const DELETE_CENTER = "/center";
export const DELETE_CENTER_PERMANENTLY = "/center/delete-permanently";
export const GET_CENTERS_FALLBACK_MANAGERS = "/center/fallback-managers";
export const SET_FALLBACK_CENTRE_MANAGER = "/center/fallback-manager";

//BOOKING
export const GET_APPOINTMENTS = "/booking";
export const GET_PATIENT_APPOINTMENTS = "/booking/patient/appointment";
export const GET_PATIENT_APPOINTMENT_DATA = "/booking/patient/appointment/data";
export const GET_PATIENT_PREVIOUS_DOCTOR =
  "/booking/patient/appointment/doctor";
export const POST_APPOINTMENT = "/booking";
export const EDIT_APPOINTMENT = "/booking";
export const DELETE_APPOINTMENT = "/booking";
export const RESTORE_APPOINTMENT = "/booking/restore";
export const DELETE_APPOINTMENT_PERMANENTLY = "/booking/delete-permanently";
export const CANCEL_APPOINTMENT = "/booking";

//LEAD
export const POST_LEAD = "/lead";
export const GET_DELETED_LEADS = "/lead/deleted";
export const POST_RESTORE_LEAD = "/lead/restore";
export const EDIT_LEAD = "/lead";
export const GET_LEADS = "/lead";
export const GET_SEARCH_LEADS = "/lead/search";
export const POST_MERGE_LEAD = "/lead/merge";
export const POST_UNMERGE_LEAD = "/lead/unmerge";
export const DELETE_LEAD = "/lead";
export const DELETE_LEAD_PERMANENTLY = "/lead/delete-permanently";

//REFERRAL
export const POST_REFERRAL = "/referral";
export const GET_REFERRALS = "/referral";
export const GET_DELETED_REFERRALS = "/referral/deleted";
export const EDIT_REFERRAL = "/referral";
export const DELETE_REFERRAL = "/referral";
export const POST_RESTORE_REFERRAL = "/referral/restore";
export const GET_PENDING_REFERRALS = "/referral/pending";
export const APPROVE_REFERRAL = "/referral/approve";
export const REJECT_REFERRAL = "/referral/reject";

//PATIENT
export const GET_PATIENTS = "/patient";
export const GET_PATIENT_BY_ID = "/patient/patient-id";
export const GET_ALL_PATIENTS = "/patient/all";
export const GET_MORE_PATIENTS = "/patient/more";
export const GET_PATIENT_STAFF = "/patient/staff";
export const GET_REFERRAL_EMPLOYEES = "/patient/referral-employees";
export const GET_REFERRAL_PATIENTS = "/patient/referral-patients";
export const GET_PATIENTS_REFERRAL = "/patient/patient-referral";
export const GET_PATIENT_COUNTED_DOCUMENTS = "/patient/count-documents";
export const GET_DELETED_PATIENTS = "/patient/deleted";
export const POST_PATIENT = "/patient";
export const CREATE_PATIENT_ID = "/patient/create-id";
export const POST_LEAD_PATIENT = "/patient/lead";
export const SEARCH_PATIENTS = "/patient/search";
export const SEARCH_PATIENTS_PHONE_NUMBER = "/patient/search/phone-number";
export const ADMIT_PATIENT = "/patient/admit";
export const EDIT_ADMISSION = "/patient/admit/update";
export const SET_RAMSAY_APPLICABLE = "/patient/admission/ramsay-applicable";
export const SET_MORSE_APPLICABLE = "/patient/admission/morse-applicable";
export const SET_BASELINE_INVESTIGATION_STATUS =
  "/patient/admission/baseline-investigation";
export const SET_PSYCHOLOGICAL_TEST_STATUS =
  "/patient/admission/psychological-tests";
export const SET_ADMISSION_TYPE_DIRECT = "/patient/admission/admission-type";
export const UPDATE_ADMISSION_WARD_BED = "/patient/admission/ward-bed";
export const CLEAR_ADMISSION_TYPE_DIRECT = "/patient/admission/admission-type/clear";
export const SET_PATIENT_ADMISSION_TYPE = "/patient/admission/patient-admission-type";
export const SUBMIT_ADMISSION_FORM = "/patient/admission-submit";
export const DISCHARGE_PATIENT = "/patient/discharge";
export const UNDISCHARGE_PATIENT = "/patient/un-discharge";
export const SWITCH_PATIENT_CENTER = "/patient/center";
export const EDIT_PATIENT = "/patient";
export const DELETE_PATIENT_AADHAAR_CARD = "/patient";
export const POST_RESTORE_PATIENT = "/patient/restore";
export const DELETE_PATIENT = "/patient";
export const DELETE_PATIENT_PERMANENTLY = "/patient/delete-permanently";
export const UPDATE_ADMISSION_ASSIGNMENT =
  "/patient/update-admission-assignment";
export const ASSIGN_NURSE_TO_PATIENT = "/patient/assign-nurse";
export const UNASSIGN_NURSE_TO_PATIENT = "/patient/unassign-nurse";

export const GET_ICD_CODES = "/patient/get/icd";

// BELONGINGS
export const SEARCH_BELONGINGS = "/patient/belongings/search";
export const PATIENT_BELONGING = "/patient/belongings";
export const COMPRESS_PATIENT_BELONGING = "/patient/belongings/compress";

//TIMELINE
export const GET_PATIENT_TIMELINE = "/timeline/patient";
export const GET_USER_TIMELINE = "/timeline/user";
export const GET_INTERN_TIMELINE = "timeline/intern";

//CHART
export const GET_CHARTS_ADDMISSIONS = "/chart/addmission";
export const GET_CHARTS = "/chart";
export const GET_LATEST_CHARTS = "/chart/latest";
export const GET_GENERAL_CHARTS = "/chart/general";
export const GET_DELETED_CHARTS = "/chart/deleted";
export const GET_FINAL_DIAGNOSIS = "/chart/final-diagnosis";
export const POST_PRESCRIPTION = "/chart/prescription";
export const EDIT_PRESCRIPTION = "/chart/prescription";
export const POST_GENERAL_PRESCRIPTION = "/chart/prescription/general";
export const EDIT_GENERAL_PRESCRIPTION = "/chart/prescription/general";
export const GET_CURRENT_MEDICINES = "/chart/prescription/current-medicines";
export const UPDATE_MEDICINE_ENTRY = "/chart/prescription";
export const CARRY_FORWARD = "/chart/prescription/carry-forward";
export const POST_VITAL_SIGN = "/chart/vital-sign";
export const EDIT_VITAL_SIGN = "/chart/vital-sign";
export const POST_GENERAL_VITAL_SIGN = "/chart/vital-sign/general";
export const EDIT_GENERAL_VITAL_SIGN = "/chart/vital-sign/general";
export const POST_ELDERLY_FUNCTIONAL_CHECKLIST =
  "/chart/elderly-functional-checklist";
export const EDIT_ELDERLY_FUNCTIONAL_CHECKLIST =
  "/chart/elderly-functional-checklist";
export const POST_ECT_SESSION = "/chart/ect-session";
export const EDIT_ECT_SESSION = "/chart/ect-session";
export const POST_GENERAL_ECT_SESSION = "/chart/ect-session/general";
export const EDIT_GENERAL_ECT_SESSION = "/chart/ect-session/general";
export const POST_ADMISSION_TYPE = "/chart/admission-type";
export const EDIT_ADMISSION_TYPE = "/chart/admission-type";
export const POST_LAB_REPORT = "/chart/lab-report";
export const EDIT_LAB_REPORT = "/chart/lab-report";
export const POST_GENERAL_LAB_REPORT = "/chart/lab-report/general";
export const EDIT_GENERAL_LAB_REPORT = "/chart/lab-report/general";
export const DELETE_LAB_REPORT_FILE = "/chart/lab-report";
export const GENERATE_LAB_SUMMARY = "/chart/generate/summary/lab-report";
export const GET_AI_EXPIRY_SUMMARY = "/chart/expiry-summary/generate";
export const VALIDATE_AI_EXPIRY_SUMMARY = "/chart/expiry-summary/validate";
export const ADDITIONAL_DETAILS = "/chart/additional/history";
export const GET_ADDITIONAL_DETAILS = "/chart/additional/history/get";

export const POST_CLINICAL_NOTE = "/chart/clinical-note";
export const EDIT_CLINICAL_NOTE = "/chart/clinical-note";
export const POST_COUNSELLING_NOTE = "/chart/counselling-note";
export const POST_GENERAL_COUNSELLING_NOTE = "/chart/counselling-note/general";
export const EDIT_COUNSELLING_NOTE = "/chart/counselling-note";
export const GET_COUNSELLING_NOTE = "/chart/counselling-note";
export const DELETE_COUNSELLING_NOTE_FILE = "/chart/counselling-note";
export const POST_GENERAL_CLINICAL_NOTE = "/chart/clinical-note/general";
export const EDIT_GENERAL_CLINICAL_NOTE = "/chart/clinical-note/general";
export const DELETE_CLINICAL_NOTE_FILE = "/chart/clinical-note";
export const POST_RELATIVE_VISIT = "/chart/relative-visit";
export const EDIT_RELATIVE_VISIT = "/chart/relative-visit";
export const POST_GENERAL_RELATIVE_VISIT = "/chart/relative-visit/general";
export const EDIT_GENERAL_RELATIVE_VISIT = "/chart/relative-visit/general";
export const POST_OUTPASS = "/chart/outpass";
export const EDIT_OUTPASS = "/chart/outpass";
export const POST_DISCHARGE_SUMMARY = "/chart/discharge-summary";
export const EDIT_DISCHARGE_SUMMARY = "/chart/discharge-summary";
export const POST_EXPIRY_SUMMARY = "/chart/expiry-summary";
export const EDIT_EXPIRY_SUMMARY = "/chart/expiry-summary";
export const POST_DETAIL_ADMISSION = "/chart/detail-admission";
export const EDIT_DETAIL_ADMISSION = "/chart/detail-admission";
export const POST_GENERAL_DETAIL_ADMISSION = "/chart/detail-admission/general";
export const EDIT_GENERAL_DETAIL_ADMISSION = "/chart/detail-admission/general";
export const DELETE_DETAIL_ADMISSION_FILE = "/chart/detail-admission";
export const POST_CARRY_FORWARD_DETAIL_ADMISSION =
  "/chart/detail-admission/carry-forward";
export const POST_DETAIL_ADMISSION_AUDIO_UPLOAD =
  "/chart/detail-admission/audio/upload";
export const POST_DETAIL_ADMISSION_AUDIO_GENERATE =
  "/chart/detail-admission/audio/generate";
export const POST_DETAIL_ADMISSION_AUDIO_ABORT =
  "/chart/detail-admission/audio/abort";
export const POST_MENTAL_EXAMINATION = "/chart/mental-examination";
export const POST_GENERAL_MENTAL_EXAMINATION =
  "/chart/mental-examination/general";
export const EDIT_MENTAL_EXAMINATION = "/chart/mental-examination";
export const LAST_MENTAL_EXAMINATION = "/chart/mental-examination";
export const LAST_ECT_SESSION = "/chart/ect-session";
export const POST_INPUT_OUTPUT = "/chart/input-output";
export const EDIT_INPUT_OUTPUT = "/chart/input-output";
export const POST_GENERAL_INPUT_OUTPUT = "/chart/input-output/general";
export const POST_NURSE_SOS_PROCEDURE = "/chart/nurse-sos-procedure";
export const EDIT_NURSE_SOS_PROCEDURE = "/chart/nurse-sos-procedure";
export const POST_GENERAL_NURSE_SOS_PROCEDURE =
  "/chart/nurse-sos-procedure/general";
export const POST_INJURY_MARKS = "/chart/injury-marks";
export const EDIT_INJURY_MARKS = "/chart/injury-marks";
export const POST_GENERAL_INJURY_MARKS = "/chart/injury-marks/general";
export const DELETE_INJURY_MARKS_FILE = "/chart/injury-marks";
export const DELETE_CHART = "/chart";
export const POST_RESTORE_CHART = "/chart/restore";
export const DELETE_CHART_PERMANENTLY = "/chart/delete-permanently";
//OPD
export const GET_OPD_PRESCRIPTION = "/chart/opd/prescription";

//BILL
export const GET_BILLS_ADDMISSIONS = "/bill/addmission";
export const GET_BILLS = "/bill";
export const GET_PATIENT_LEDGER = "/bill/ledger";
export const GET_DRAFT_BILLS = "/bill/draft";
export const DELETE_DRAFT_BILL = "/bill/draft";
export const GET_DELETED_BILLS = "/bill/deleted";
export const POST_INVOICE = "/bill/invoice";
export const POST_DEPOSIT = "/bill/deposit";
export const EDIT_DEPOSIT = "/bill/deposit";
export const CONVERT_DEPOSIT_TO_ADVANCE = "/bill/deposit/convert-to-advance";
export const POST_DRAFT_INVOICE = "/bill/draft/invoice";
export const EDIT_DRAFT_INVOICE = "/bill/draft/invoice";
export const POST_DRAFT_TO_INVOICE = "/bill/draft/draft-to-invoiceBill";
export const POST_ADVANCE_PAYMENT = "/bill/advance-payment";
export const EDIT_INVOICE = "/bill/invoice";
export const EDIT_ADVANCE_PAYMENT = "/bill/advance-payment";
export const DELETE_BILL = "/bill";
export const POST_RESTORE_BILL = "/bill/restore";
export const DELETE_BILL_PERMANENTLY = "/bill/delete-permanently";

// Pine Labs POS terminal (card / UPI collected on the machine)
export const GET_POS_TERMINAL = "/pos/pine-labs/terminal";
export const POST_POS_INITIATE = "/pos/pine-labs/initiate";
export const GET_POS_STATUS = "/pos/pine-labs/status";
export const POST_POS_CANCEL = "/pos/pine-labs/cancel";
export const GET_POS_PENDING = "/pos/pine-labs/pending";
export const GET_POS_TRANSACTIONS = "/pos/pine-labs/transactions";
export const POST_POS_REFUND = "/pos/pine-labs/refund";

// Write Off
export const GET_WRITE_OFF = "/bill/get/write/off";
export const POST_WRITE_OFF = "/bill/post/write/off";

//MEDICINE
export const GET_MEDICINES = "/medicine";
export const GET_DELETED_MEDICINES = "/medicine/deleted";
export const POST_MEDICINE = "/medicine";
export const POST_CSV_MEDICINE = "/medicine/csv";
export const EDIT_MEDICINE = "/medicine";
export const DELETE_MEDICINE = "/medicine";
export const POST_RESTORE_MEDICINE = "/medicine/restore";
export const DELETE_MEDICINE_PERMANENTLY = "/medicine/delete-permanently";
export const VALIDATE_DUPLICATE_MEDICINE = "/medicine/validate";

//BILL SETTING
//invoice
export const POST_BILL_ITEM = "/bill-setting";
export const GET_DELETED_BILL_ITEMS = "/bill-setting/deleted";
export const GET_BILL_ITEMS = "/bill-setting";
export const GET_ALL_BILL_ITEMS = "/bill-setting/all";
export const EDIT_BILL_ITEM = "/bill-setting";
export const GET_PROCEDURES_BY_ID = "/bill-setting/procedures";
export const GET_PROCEDURES_BY_CENTER_ID = "/bill-setting/get/procedures";
export const DETELE_CENTER_IN_PROCEDURE =
  "/bill-setting/procedures/delete/center";
export const ADD_CENTERS_IN_PROCEDURE = "/bill-setting/procedures/add/center";
export const GET_CATEGORIES_OF_PROCEDURE =
  "/bill-setting/procedures/get/catgeories";
export const EDIT_CENTER_COSTS = "/bill-setting/procedures/edit/center-cost";
export const DELETE_BILL_ITEM = "/bill-setting";
//advance payment
export const POST_PAYMENT_ACCOUNT = "/bill-setting/payment-account";
export const GET_PAYMENT_ACCOUNTS = "/bill-setting/payment-account";
export const DELETE_PAYMENT_ACCOUNT = "/bill-setting/payment-account";

//DOCTOR WORKING SCHEDULE
export const GET_ALL_DOCTOR_SCHEDULE = "/setting/doctor-schedule/all";
export const GET_DOCTOR_AVAILABLE_SLOTS = "/setting/available-slots";
export const GET_DOCTOR_SCHEDULE = "/setting/doctor-schedule";
export const POST_DOCTOR_SCHEDULE = "/setting/doctor-schedule";
export const EDIT_DOCTOR_SCHEDULE = "/setting/doctor-schedule";
export const GET_DOCTOR_SCHEDULE_NEW = "/setting/doctor-schedule/new";

//CALENDER
export const GET_CALENDER_DURATION = "/setting/calender";
export const POST_CALENDER_DURATION = "/setting/calender";
export const EDIT_CALENDER_DURATION = "/setting/calender";

//THERAPY
export const GET_THERAPIES = "/therapy";
export const POST_THERAPY = "/therapy";
export const EDIT_THERAPY = "/therapy";
export const DELETE_THERAPY = "/therapy";

//JOB ROLES (User.role options — not access roles)
export const JOB_ROLES = "/user-roles";

//SYMPTOM
export const GET_SYMPTOMS = "/symptom";
export const POST_SYMPTOM = "/symptom";
export const EDIT_SYMPTOM = "/symptom";
export const DELETE_SYMPTOM = "/symptom";

//CONDITION
export const GET_CONDITIONS = "/condition";
export const POST_CONDITION = "/condition";
export const EDIT_CONDITION = "/condition";
export const DELETE_CONDITION = "/condition";

//REPORT
export const GET_REPORT = "/report";
export const GET_REPORT_UPDATED = "/report/updated";
export const GET_DB_LOGS = "/report/db-logs";
export const GET_FINANCE_ANALYTICS = "/report/finance";
export const GET_FINANCE_ANALYTICS_CSV = "/report/finance-csv";
export const GET_PATIENT_ANALYTICS = "/report/patient";
export const GET_DOCTOR_ANALYTICS = "/report/doctor";
export const GET_DOCTOR_ANALYTICS_WP = "/report/doctor-csv";
export const GET_PATIENT_ANALYTICS_WP = "/report/patient-csv";
export const GET_LEAD_ANALYTICS = "/report/lead";
export const GET_OPD_ANALYTICS = "/report/opd";
export const GET_BOOKING_ANALYTICS = "/report/booking";
export const GET_TRANSACTIONS_ANALYTICS = "/report/transactions";
export const GET_TRANSACTIONS_ANALYTICS_CSV = "/report/transactions-csv";
export const GET_ADMISSION_FORMS = "/report/admission-forms";
export const GET_ADMISSION_FORMS_CSV = "/report/admission-forms-csv";
export const GET_ADVANCE_PAYMENT_DEPOSIT_ANALYTICS =
  "/report/advance-payment-deposit";
export const GET_ADVANCE_PAYMENT_DEPOSIT_CSV =
  "/report/advance-payment-deposit-csv";

//NOTIFICATION
export const GET_BILL_NOTIFICATION = "notification/bill";

//INTERN
export const POST_INTERN_FORM = "intern/";
export const GET_INTERN_DATA = "intern/";
export const GET_INTERN_ID = "intern/create-internid";
export const GET_INTERN_BY_ID = (id) => `intern/${id}`;
export const ADD_INTERN_RECEIPT = "intern/receipt";
export const GET_INTERN_RECEIPT = (internId) =>
  `intern/receipt?intern=${internId}`;
export const UPDATE_INTERN_FORM = (id) => `intern/${id}`;
export const DELETE_INTERN = "intern/";
export const DELETE_INTERN_BILL = "intern/receipt";
export const UPDATE_INTERN_RECEIPT = "intern/receipt";

//CLINICAL TEST
export const GET_CIWA_TEST = "/clinical-test/ciwa-test";
export const POST_CIWA_TEST = "/clinical-test/ciwa-test";
export const POST_SSRS_TEST = "/clinical-test/ssrs-test";
export const POST_MPQ_TEST = "/clinical-test/mpq-test";
export const POST_MMSE_TEST = "/clinical-test/mmse-test";
export const POST_YMRS_TEST = "/clinical-test/ymrs-test";
export const POST_YBOCS_TEST = "/clinical-test/ybocs-test";
export const POST_ACDS_TEST = "/clinical-test/acds-test";
export const POST_HAMA_TEST = "/clinical-test/hama-test";
export const POST_HAMD_TEST = "/clinical-test/hamd-test";
export const POST_PANSS_TEST = "/clinical-test/panss-test";
export const FETCH_CLINICAL_TEST = "/clinical-test";
export const POST_MORSE_FALL_TEST = "/clinical-test/morse-fall-test";
export const POST_RAMSAY_TEST = "/clinical-test/ramsay-test";
export const POST_GCS_TEST = "/clinical-test/gcs-test";

// OFFER
export const ADD_OFFER = "/offer/addoffer";
export const GET_OFFER_LIST = "/offer/get-offer-list";
export const UPDATE_OFFER = "/offer/update";

//TAX
export const ADD_TAX = "/tax/addtax";
export const GET_TAX_LIST = "/tax/get-tax-list";
export const UPDATE_TAX = "/tax/update";

//HUBSPOT
export const GET_HUBSPOT_CONTACTS = "/hubspot/getContacts";

//Roles
export const ROLES = "/role";

// nurse
export const GET_NURSE_ASSIGNED_PATIENTS = "/nurse/patients";
export const GET_CLININCAL_TEST_SUMMARY_BY_NURSE =
  "/nurse/clinical-test-summary";
export const GET_PATIENT_OVERVIEW_BY_NURSE = "/nurse/patient-overview";
export const GET_PATIENT_DETAILS_BY_NURSE = "/nurse/patient";
export const GET_PATIENT_PRESCRIPTION_BY_NURSE = "/nurse/prescription";
export const GET_NURSES_BY_PATIENT_CENTER = "/nurse/list";
export const GET_PENDING_ACTIVE_MEDICINES = "/nurse/due-medicine";
export const GET_COMPLETED_ACTIVE_MEDICINES = "/nurse/completed-medicine";
export const MARK_MEDICINE_AS_GIVEN = "/nurse/medicine/mark";
export const GET_NEXT_DAY_MEDICINEBOXFILLING_MEDICINES =
  "/nurse/next-day-medicines";
export const GET_ACTIVITIES_BY_STATUS = "/nurse/activities";
export const GET_NURSE_GIVEN_MEDICINES = "/nurse/medicine-records";
export const GET_NURSE_GIVEN_MEDICINE_DETAILS =
  "/nurse/medicine-record-details";
export const GET_PRESCRIPTION_HISTORY = "/nurse/prescription-history";
export const GET_DAILY_MEDICATION_RECORD = "/nurse/daily-medication-record";
export const GET_TODAY_MEDICINES_TO_GIVE = "/nurse/today-medicines";
export const MARK_TODAY_MEDICINE_GIVEN = "/nurse/today-medicines/mark";
export const MARK_TODAY_MEDICINES_GIVEN_BULK = "/nurse/today-medicines/mark-bulk";
export const GET_TODAY_GIVEN_MEDICINE_HISTORY = "/nurse/today-medicines/history";

// alerts
export const GET_ALERTS_BY_PATIENT = "/alerts/nurse";
export const MARK_ALERT_AS_READ = "/alerts/read";

// notes
export const NOTES = "/notes";

// round notes
export const ROUND_NOTES = "/round-notes";
export const ROUND_NOTES_STAFF = "/round-notes/staff";

// emergency
export const ASSIGN_TYPE_TO_PATIENT = "/emergency/assign";
export const GET_EMERGENCY_PATIENTS = "/emergency";
export const GET_PSYCHOLOGIST_PATIENTS = "/psychologist-dashboard";

// SOP Overview
export const GET_SOP_OVERVIEW = "/patient/sop-overview";

// cash managemenet
export const ADD_BANK_DEPOSIT = "/cash/bank-deposit";
export const ADD_SPENDING = "/cash/spending";
export const ADD_BASE_BALANCE = "/cash/base-balance";
export const ADD_INFLOW = "/cash/inflow";
export const ADD_CASH_RECO = "/cash/reco";
export const GET_CASH_RECOS = "/cash/reco/list";
export const CASH_RECO_DAY_STATUS = "/cash/reco/day-status";
export const GET_LATEST_BANK_DEPOSITS = "/cash/bank-deposit/list";
export const GET_LATEST_SPENDING = "/cash/spending/list";
export const GET_LASTEST_INFLOWS = "/cash/inflow/list";
export const GET_BASE_BALANCE_BY_CENTER = "/cash/base-balance";
export const GET_DETAILED_CASH_REPORT = "/cash/report/detailed";
export const GET_SUMMARY_CASH_REPORT = "/cash/report/summary";
export const GET_DATE_RANGE_REPORT = "/cash/report/ledger";
// central payment
export const CENTRAL_PAYMENT = "/central-payment";
export const CENTRAL_PAYMENT_ACTION = "/central-payment/action";
export const GET_DETAILED_CENTRAL_PAYMENT_REPORT =
  "/central-payment/report/detailed";
export const GET_SUMMARY_CENTRAL_PAYMENT_REPORT =
  "/central-payment/report/summary";
export const EXPORT_DETAILED_CENTRAL_PAYMENT_REPORT =
  "/central-payment/report/detailed/export";
export const GET_ALL_ENETS = "/central-payment/eNets";
export const CENTRAL_PAYMENT_VENDOR_PAN = "/central-payment/vendor-pan";
export const REGENERATE_ENETS = "/central-payment/eNets/regenerate";
export const PROCESS_PAYMENTS = "/central-payment/process";
export const UPLOAD_TRANSACTION_PROOF = "/central-payment/transaction-proof";

//New Microservice APIS
export const CSRF = "/csrf-token";
export const MICRO_SIGN_IN = "/userauths/signin";
export const MICRO_SIGN_UP = "/userauths/signup";
export const MICRO_FORGOTT = "/userauths/forgott-password";
export const MICRO_LOGOUT = "/userauths/logout";
export const CHANGE_PASSWORD = "/userauths/forgott-password";
export const USER = "/user";
export const GET_USER_BY_EMAIL = "/user/email";
export const MOVE_TO_BIN = "/user/move-recyclebin";
export const ACTIVATE_DEACTIVATE_USER = "/user/deactive";
export const TOGGLE_APP_LOGIN = "/user/app-login";
export const CHANGE_USER_PASSWORD = "/user/change-password";
export const EDIT_SELF = "/user/edit-self";
export const USER_ACTIVITY = "/activity";
export const GET_USER_ROLES = "/user/roles";

// INCIDENT
export const GET_INCIDENTS = "/incident";
export const GET_INCIDENT_BY_ID = "/incident";
export const POST_INCIDENT = "/incident";
export const UPDATE_INCIDENT = "/incident";
export const DELETE_INCIDENT = "/incident";
export const INVESTIGATE_INCIDENT = "/incident";
export const APPROVE_INCIDENT = "/incident";
export const CLOSE_INCIDENT = "/incident";
export const UPDATE_INCIDENT_STATUS = "/incident";

// PHARMACY FAILED MEDICINES DOWNLOAD
export const DOWNLOAD_FAILED_MEDICINES = "/pharmacy/failed/download";
// PHARMACY GET FAILED MEDICINES BATCHES LIST
export const GET_FAILED_MEDICINES_BATCHES = "/pharmacy/failed/list";
// PHARMACY DELETE FAILED MEDICINES
export const DELETE_FAILED_MEDICINES = "/pharmacy/failed/delete";

// PHARMACY MEDICINE APPROVAl
export const MEDICINE_APPROVALS = "/pharmacy/approvals";
export const GET_PENDING_PATIENT_APPROVALS =
  "/pharmacy/approvals/pending-patients";
export const GET_DETAILED_PRESCRIPTION =
  "/pharmacy/approvals/detailed-prescription";

// PHARMACY MEDICINE APPROVAL — pilot (Noida) patient-scoped flow
export const GET_APPROVAL_MEDICINES = "/pharmacy/approvals";
export const APPROVE_PILOT_APPROVAL = "/pharmacy/approvals";
export const RETURN_MEDICINE = "/pharmacy/approvals";
export const GET_PHARMACY_RETURNS = "/pharmacy/returns";

// PHARMACY AUDIT
export const DOWNLOAD_AUDIT_TEMPLATE = "/pharmacy/audit/template";
export const AUDITS = "/pharmacy/audit";
export const UPLOAD_AUDIT_REPORT = "/pharmacy/audit/upload-chunk";
export const GET_AUDIT_REPORT = "/pharmacy/audit/report";
export const UPDATE_AUDIT_STATUS = "/pharmacy/audit/status";
export const DOWNLOAD_AUDIT_FAILED_MEDICINES = "/pharmacy/audit/failed";
export const DOWNLOAD_AUDIT_REPORT = "/pharmacy/audit/report/download";

// PHARMACY REQUISITION - INTERNAL TRANSFER
export const PHARMACY_INTERNAL_TRANSFER =
  "/pharmacy/requisition/internal-transfer";
export const PHARMACY_MEDICINE_SEARCH = "/pharmacy/search";
export const PHARMACY_STOCK_BY_IDS = "/pharmacy/stock-by-ids";
export const PHARMACY_AVAILABLE_MEDICINES = "/pharmacy/available-medicines";
export const PHARMACY_ALTERNATIVE_MEDICINES = "/pharmacy/alternative-medicines";
export const PHARMACY_STOCK_BY_MEDICINES = "/pharmacy/stock-by-medicines";
export const PHARMACY_BATCHES_BY_MEDICINES = "/pharmacy/batches-by-medicines";

// PHARMACY REQUISITION - MEDICINE REQUISITION
export const PHARMACY_MEDICINE_REQUISITION =
  "/pharmacy/requisition/medicine-requisition";

// PHARMACY EXPIRED STOCK
export const PHARMACY_EXPIRED_STOCK = "/pharmacy/expired-stock";

// COMPLIANCE TYPES
export const COMPLIANCE_TYPES = "/compliance/types";

// COMPLIANCE CATEGORIES
export const COMPLIANCE_CATEGORIES = "/compliance/categories";
// COMPLIANCE SUBMISSIONS
export const COMPLIANCE_SUBMISSIONS = "/compliance/submissions";

export const COMPLIANCE_RECORDS = "/compliance/records";

// PHARMACY ACTIVITY LOG
export const PHARMACY_ACTIVITY = "/pharmacy/activity";

// PHARMACY INVENTORY HEALTH REPORT (transit loss / variance / expiry)
export const PHARMACY_INVENTORY_HEALTH_REPORT = "/pharmacy/reports/inventory-health";

// INVENTORY STOCK SUMMARY
export const PHARMACY_CONSOLIDATED = "/pharmacy/consolidated";

// PHARMACY OCR BILL IMPORT
export const OCR_UPLOAD_BILL = "/pharmacy/ocr/upload-bill";
export const OCR_CHECK_PHARMACY_BATCH = "/pharmacy/ocr/check-pharmacy-batch";
export const OCR_CHECK_EXISTING_MEDICINE =
  "/pharmacy/ocr/check-pharmacy-medicine";
export const OCR_CONFIRM_MEDICINES = "/pharmacy/ocr/confirm-medicines";
export const OCR_GET_BILL_DETAILS = "/pharmacy/ocr/bill-import";
export const OCR_GET_MATCHING_MEDICINES =
  "/pharmacy/ocr/get-matching-medicines";
export const OCR_GET_BILL_UPLOADS = "/pharmacy/ocr/bill-uploads";
export const OCR_UPDATE_BILL_ERRORS = "/pharmacy/ocr/update-bill-errors";

// PHARMACY EXCEL REPORTS
export const PHARMACY_REPORT_CONSOLIDATED = "/pharmacy/reports/consolidated";
export const PHARMACY_REPORT_INVENTORY_UPDATE =
  "/pharmacy/reports/inventory-update";

// SAREYAAN INVENTORY IMPORT
export const SAREYAAN_INVENTORY_IMPORT_LIST = "/pharmacy/sareyaan-import";
export const SAREYAAN_INVENTORY_IMPORT_ERRORS_DOWNLOAD =
  "/pharmacy/sareyaan-import";

// MI REPORTING
export const GET_MI_HUBSPOT_CONTACTS = "/mi-reporting/hubspot-contacts";
export const GET_CENTER_LEADS_MOM = "/mi-reporting/center-leads-mom";
export const GET_CENTER_LEADS_MTD = "/mi-reporting/center-leads-mtd";
export const GET_OWNER_LEADS_MOM = "/mi-reporting/owner-leads-mom";
export const GET_OWNER_LEADS_MTD = "/mi-reporting/owner-leads-mtd";
export const GET_CITY_QUALITY_BREAKDOWN = "/mi-reporting/city-quality";
export const GET_OWNER_QUALITY_BREAKDOWN = "/mi-reporting/owner-quality";
export const GET_CITY_VISIT_DATE = "/mi-reporting/city-visit-date";
export const GET_OWNER_VISIT_DATE = "/mi-reporting/owner-visit-date";
export const GET_CITY_VISITED_DATE = "/mi-reporting/city-visited-date";
export const GET_OWNER_VISITED_DATE = "/mi-reporting/owner-visited-date";
export const GET_CITY_LEAD_STATUS = "/mi-reporting/city-lead-status";
export const GET_OWNER_LEAD_STATUS = "/mi-reporting/owner-lead-status";
export const GET_CENTER_WISE_MOM = "/mi-reporting/center-wise-mom";
export const GET_CAMPAIGN_WISE_MOM = "/mi-reporting/campaign-wise-mom";
export const GET_CENTER_WISE_STATUS_MOM =
  "/mi-reporting/center-lead-status-mom";

//MIS Reports
export const GET_REFUND_AMOUNT_MOM = "/mi-reporting/refund-amount-mom";
export const GET_ROUND_NOTES_DOD = "/mi-reporting/round-notes-dod";
export const GET_CLINICAL_NOTES_DOD = "/mi-reporting/clinical-notes-dod";
export const GET_COUNSELLING_SESSIONS_PATIENTS_DOD =
  "/mi-reporting/counselling-sessions-patients-dod";
export const GET_VITAL_SIGNS_DOD = "/mi-reporting/vital-signs-dod";
export const GET_NURSES_DOD = "/mi-reporting/nurses-dod";
export const GET_PATIENT_DOCS = "/mi-reporting/get-patient-docs";
export const GET_OPD_PATIENT_DOCS = "/mi-reporting/get-opd-patient-docs";
export const GET_DAILY_INVOICES = "/mi-reporting/get-daily-invoices";
export const GET_COUNSLLING_SESSIONS = "/mi-reporting/get-counselling-sessions";
export const GET_COUNSELLING_RECORDING =
  "/mi-reporting/get-counselling-recording";
export const GET_DAILY_DASHBOARD = "/mi-reporting/daily-dashboard";
export const GET_DOCS_COMPLIANCE = "/mi-reporting/docs-compliance";
export const GET_DUE_AMOUNT = "/mi-reporting/get-due-amount";
export const GET_MISSING_INVOICES = "/mi-reporting/missing-invoices";
export const GET_MI_ATTENDANCE = "/mi-reporting/get-attendance";
export const GET_CASH_PER_CENTER = "/mi-reporting/cash-per-center";
export const GET_WRITE_OFF_AMOUNT = "/mi-reporting/write-off-amount";
export const GET_TRAINING_FORMS_WEEKLY = "/mi-reporting/training-forms-weekly";
export const GET_TRAINING_FORMS_MONTHLY =
  "/mi-reporting/training-forms-monthly";
export const GET_AUDIT_DAILY = "/mi-reporting/audit-daily";
export const GET_METRICS_REPORT = "/mi-reporting/metrics-report";
export const GET_OPD_CHARGES_MONTHLY = "/mi-reporting/opd-charges-monthly";
export const GET_DOCTOR_OPD_CHARGES_MONTHLY =
  "/mi-reporting/doctor-opd-charges-monthly";
export const GET_DOCTOR_OPD_CHARGES_DETAIL =
  "/mi-reporting/doctor-opd-charges-detail";
export const GET_CENTRAL_EXPENSES_MONTHLY =
  "/mi-reporting/central-expenses-monthly";
export const GET_DOCTOR_PSYCHOLOGIST_STAY_RANGE =
  "/mi-reporting/doctor-psychologist-stay-range";
export const GET_NURSES_DAILY_ACTIVITY = "/mi-reporting/nurses-daily-activity";
export const GET_OCCUPANCY_MONTHLY = "/mi-reporting/occupancy-monthly";
export const GET_ADMISSION_DISCHARGE_DAILY =
  "/mi-reporting/admission-discharge-daily";
export const GET_INCIDENT_STATUS_MONTHLY =
  "/mi-reporting/incident-status-monthly";
export const GET_READMISSION_MONTHLY = "/mi-reporting/readmission-monthly";
export const GET_ATTRITION_MONTHLY = "/mi-reporting/attrition-monthly";
export const GET_ASSIGNED_DATA = "/mi-reporting/assigned-data";
export const GET_PATIENTS_WITH_SUSPENDED_STAFF = "/mi-reporting/patients-with-suspended-staff";
export const GET_SOP_ALERTS_MONTHLY = "/mi-reporting/sop-alerts-monthly";
export const GET_CASH_RECO_COMPLIANCE = "/mi-reporting/cash-reco-compliance";
export const GET_REFERRAL_DATA = "/mi-reporting/referral-data";
export const EXPORT_REFERRAL_DATA_CSV = "/mi-reporting/referral-data/export";

// CENTER DASHBOARD
export const GET_CENTER_DASHBOARD_LIVE = "/center-dashboard/live";

// HR
export const GET_EMPLOYEE_ID = "/hr/employee-id";
export const EMPLOYEE = "/hr/employee";
export const EMPLOYEE_BIOMETRIC = "/hr/employee/bio-metric";
export const UPDATE_EMPLOYEE_BIOMETRIC = "/hr/employee/update/bio-metric";
export const UPDATE_EMPLOYEE_EXIT_BIOMETRIC = "/hr/exit/biometric/action";
export const EMPLOYEE_DETAILS = "/hr/employee/details";
export const EMPLOYEE_EMAILS = "/hr/employee/emails";
export const EMPLOYEE_BY_KEY = "/hr/employee/by-key";

export const NEW_JOINING_ACTION = "/hr/employee/new-joining";

export const IT = "/hr/it";
export const IT_NEW_JOINING_ACTION = "/hr/it/joining";
export const IT_EXIT_ACTION = "/hr/it/exit";
export const IT_TRANSFER_ACTION = "/hr/it/transfer";

export const EXIT_EMPLOYEE = "/hr/exit";

export const EXIT_EMPLOYEE_EXIT_ACTION = "/hr/exit/exit-action";
export const EXIT_EMPLOYEE_BIOMETRIC_REQUESTS =
  "/hr/exit/exit-request/biometric";
export const EXIT_EMPLOYEE_FNF_ACTION = "/hr/exit/fnf-action";

export const SEARCH_EXIT_EMPLOYEE = "/hr/exit/search";

export const SALARY_ADVANCE = "/hr/advance-salary";
export const SALARY_ADVANCE_ACTION = "/hr/advance-salary/action";

export const TRANSFER_EMPLOYEE = "/hr/transfer-employee";
export const TRANSFER_EMPLOYEE_CURRENT_LOCATION_ACTION =
  "/hr/transfer-employee/current/action";
export const TRANSFER_EMPLOYEE_TRANSFER_LOCATION_ACTION =
  "/hr/transfer-employee/transfer/action";

export const DESIGNATION = "/hr/designation";

export const COMPANY = "/hr/company";

export const HIRING = "/hr/hiring";
export const HIRING_ACTION = "/hr/hiring/action";
export const GET_ALL_EMPLOYEE = "/hr/hiring/get/employees";
export const GET_MANAGEMENT_HIRING_REQUESTS =
  "/hr/hiring/management/hiring/requests";
export const UPDATE_HIRING_REQUEST = "/hr/hiring/management/update/request";

export const TPM = "/hr/tpm";
export const TPM_ACTION = "/hr/tpm/action";

export const INCENTIVES = "/hr/incentives";
export const INCENTIVES_ACTION = "/hr/incentives/action";

export const PAYROLL_ADJUSTMENTS = "/hr/payroll-adjustments";
export const PAYROLL_ADJUSTMENTS_ACTION = "/hr/payroll-adjustments/action";

export const ESIC_RECORDS = "/hr/esic";
export const ESIC_ACTION = "/hr/esic/action";
export const ESIC_SEARCH_EMPLOYEES = "/hr/esic/employees/search";
export const ESIC_MY_RECORDS = "/hr/esic/my";

export const GENERATE_PAYROLL = "/hr/payroll/generate";
export const GET_PAYROLLS = "/hr/payroll";
export const EXPORT_PAYROLLS_XLSX = "/hr/payroll/xlsx";
export const PAYROLL_GENERATION_STATUS = "/hr/payroll/generation-status";
export const UPDATE_PAYROLL_REMARKS = "/hr/payroll/remarks";
export const MONTHLY_PAYROLL_TEMPLATE = "/hr/payroll/monthly/template";
export const PAYROLL_ACTION = "/hr/payroll/action";
export const PAYROLL_BULK_ACTION = "/hr/payroll/bulk-action";
export const GET_DEPARTMENTS = "/hr/get/departments";
export const CREATE_DEPARTMENTS = "/hr/create/departments";
export const GET_APPROVAL_INBOX = "/hr/approval-inbox";

export const FINANCE = "/hr/salary";
export const CHANGE_SALARY = "/hr/salary/change";

export const GET_EMPLOYEE_PAYSLIPS = "/hr/payroll/employee-payslips";
export const GET_MY_PAYSLIPS = "/hr/payroll/my-payslips";
export const GET_MY_SALARY_DATA = "/hr/payroll/my-salary-data";

// HRMS
export const GET_BALANCE_LEAVES = "/hrms/get/my/balance/leaves";
export const ATTENDANCE = "/hrms/attendance";
export const ATTENDANCE_IMPORTS = "/hrms/attendance/imports";
export const ATTENDANCE_TEMPLATE = "/hrms/attendance/template";
export const UPLOAD_ATTENDANCE = "/hrms/attendance/upload";

export const ATTENDANCE_METRICS = "/hrms/attendance/metrics";
export const REPORTING_METRICS = "/hrms/reporting/metrics";
export const EXPORT_ATTENDANCE_METRICS = "/hrms/attendance/metrics/export";
export const EXPORT_REPORTING_METRICS = "/hrms/reporting/metrics/export";
export const TODAY_MY_ATTENDANCE_STATUS = "/hrms/attendance/status/today";
export const ATTENDANCE_SUMMARY = "/hrms/attendance/summary";
export const ATTENDANCE_LOGS = "/hrms/attendance/detailed";
export const EMPLOYEE_CHECK_IN = "/hrms/attendance/check-in";
export const EMPLOYEE_CHECK_OUT = "/hrms/attendance/check-out";
export const REFETCH_BIOMETRIC_ATTENDANCE = "/hr/attendance/trigger-import";

export const MONTHLY_ATTENDANCE = "/hr/attendance/monthly";
export const UPLOAD_MONTHLY_ATTENDANCE = "/hr/attendance/monthly/upload";

export const EMPLOYEE_REPORTING = "/hrms/employee-reporting";

export const APPLY_LEAVE = "/hrms/leaves/request";
export const GET_MY_MANAGER = "/hrms/get/my/reporting/manager";
export const GET_MY_MANAGER_BY_EMPLOYEE_ID = "/hrms/get/reporting/manager";
export const GET_LEAVES_REQUESTS = "/hrms/get/leaves/requests";
export const ACTION_ON_LEAVE = "/hrms/leaves";
export const GET_MY_LEAVES = "/hrms/get/my/leaves";
export const RETRIEVE_ACTION = "/hrms/leaves";
export const ADD_POLICIES = "/hrms/employee/policy";
export const GET_POLICIES = "/hrms/employee/get/policies";
export const GET_LATEST_POLICY = "/hrms/latest/policy";
export const ADMIN_GET_ALL_LEAVES = "/hrms/admin/get/leaves/info";
export const GET_FESTIVE_LEAVES_LISTS = "/hrms/get/all/lists";
export const POST_FESTIVE_LEAVES_LIST = "/hrms/post/festive-leaves/list";
export const ADD_LEAVES_TO_EXISTING_LIST = "/hrms/post/list/in";
export const UPDATE_LEAVE = "/hrms/update/leave-in/list";
export const DELETE_LEAVE = "/hrms/delete/leave-in/list";
export const CANCELLATION_REQUEST = "/hrms/leave/cancellation/request";
export const GET_CANCELLATIONS_HISTORY = "/hrms/leave/get/cancellations/hr";
export const DIRECT_CANCELLATIONS = "/hrms/leave/direct/approve/cancellation";
export const GET_CANCELLATION_REQUEST = "/hrms/leave/get/cancellations";
export const ACTION_ON_CANCELLATION_REQUEST = "/hrms/leave/cancellation";
export const GET_ALL_EMPLOYEE_LEAVE_BALANCE =
  "/hrms/leaves/balance/all-employees";
export const GET_REPORTEES_LEAVE_BALANCE = "/hrms/leaves/balance/reportees";

export const REQUEST_REGULARIZATION = "/hrms/request/regularization";
export const GET_MY_REGULARIZATION = "/hrms/get/my/regularizations";
export const GET_REGULARIZATION_REQUESTS = "/hrms/get/regularizations/requests";
export const UPDATE_REGULARIZATION = "/hrms/regularize";
export const GET_ALL_EMPLOYEE_REGULARIZATIONS =
  "/hrms/regularizations/employees/summary";
export const GET_REGULARIZATIONS_BY_EMPLOYEE = "/hrms/regularizations/employee";
export const GET_COMP_REQUESTS = "/hrms/leave/get/comp-off/requests";
export const ACTION_ON_COMP_REQUESTS = "/hrms/leave/mark/comp-off/request";
export const POST_COMP_OFF_REQUEST = "/hrms/leave/request/comp-off";

export const GET_PENDING_APPROVALS_BY_MANAGER_ID = "/hrms/get/pendings";
export const TRANSFER_MANAGER_PENDING_APPROVALS = "/hrms/transfer/pendings";
export const GET_EMPLOYEES_WITHOUT_FILTER =
  "/hrms/get/employees/without/filter";
export const GET_TEMPORARY_MANAGER = "/hrms/get/temporary/manager";

// FOR HR
export const GET_LEAVES = "/hrms/leave/get/leaves";
export const APPROVE_LEAVE = "/hrms/leave/change/status/byhr";
export const GET_ALL_REGULARIZATIONS = "/hrms/regularizations/get/all";
export const APPROVE_REGULARIZATION_BYHR =
  "/hrms/regularize/change/status/byhr";
export const CREATE_APPROVE_REGULARIZATION_BYHR =
  "/hrms/regularize/create/approve/byhr";
export const GET_ALL_COMP_OFFS = "/hrms/leave/get/all/comp-offs";
export const GET_MY_COMP_OFFS = "/hrms/leaves/get/my/comp-offs";

// CAPACITY ASSESSMENT FORM
export const SUBMIT_ASSESSMENT_FROM =
  "/patient/capacity-assessment-submit-file";

// ECT CONSENT FORM
export const SUBMIT_ECT_CONSENT_FORM = "/patient/ect-consent-submit-file";
export const UPLOAD_ECT_CONSENT_FORM = "/patient/ect-consent-upload-file";

// MHRB EMAIL FORM
export const UPLOAD_MHRB_EMAIL_FORM = "/patient/mhrb-email-upload-file";

// DNR FORM
export const DNR_FORM_FILLED = "/patient/dnr-form-filled";
export const UPLOAD_DNR_FORM = "/patient/dnr-upload-file";

// upload file
export const UPLOAD_FILE = "/upload";

// UTILITIES
export const UPLOAD_UTILITY_BILL = "/utilities/upload-bill";
export const GET_UTILITY_BILLS = "/utilities/bills";
export const UPDATE_UTILITY_BILL = (id) => `/utilities/bills/${id}`;
export const DELETE_UTILITY_BILL = (id) => `/utilities/bills/${id}`;

// TALLY
export const POST_TALLY_SEND = "/tally/send";
export const GET_TALLY_ACTIVE_SESSION = "/tally/send/active";
export const POST_TALLY_CANCEL = (sessionId) => `/tally/cancel/${sessionId}`;
export const GET_TALLY_LOGS = "/tally/logs";
export const GET_TALLY_PENDING_UPDATES = "/tally/logs/pending-updates";
export const GET_TALLY_LOGS_EXPORT_CSV = "/tally/logs/export-csv";

// Issues
export const GET_ISSUES = "/issues/get";
export const GET_MY_ISSUES = "/issues/my/tickets";
export const CHANGE_STATUS = "/issues/change/status";
export const APPROVE_ISSUE = "/issues/approval";
export const POST_ISSUE = "/issues/post";
export const GET_TICKET_DASHBOARD_DATA = "/issues/get/dashboard-data";
export const GET_RAISED_TICKETS = "/issues/get/my/raised/tickets";
export const GET_HR_ISSUES_REQUESTS = "/issues/hr/issues/request";
export const UPDATE_HR_ISSUE_REQUEST = "/issues/hr/issue/update";
export const UPDATE_FINANCE_ISSUE_REQUEST = "/issues/finance/update/status";
export const GET_FINANCE_ISSUES = "/issues/finance/issues/tax/compliance";
export const GET_PAYSLIPS_ISSUES_REQUESTS =
  "/issues/get/finance/payslip/requests";
export const ADD_ISSUE_NOTE = "/issues/note/add";
export const GET_CENTRE_MANAGERS = "/issues/get/centre-managers";
export const POST_EMPLOYEE_FORM = "/hr/create/employee/form";
export const EMPLOYEE_FORMS = "/hr/get/employee/forms";
export const DELETE_EMPLOYEE_FORM = "/hr/delete/employee/form";
export const EDIT_EMPLOYEE_FORM = "/hr/edit/employee/form";
export const GET_MY_FORMS = "/hr/myforms";

// recordings
export const GET_RECORDINGS = "/ozonetel/get";
export const GET_RECORDING_BY_ID = "/ozonetel/get";
export const GENERATE_OVERVIEW_RECORDING = "/ozonetel/generate-overview-by-id";
export const BULK_GENERATE_OVERVIEW_RECORDING =
  "/ozonetel/generate-bulk-overview";
export const BULK_OVERVIEW_STATUS = "/ozonetel/bulk-overview/status";
export const UPLOAD_XLSX_FILE = "/ozonetel/upload/file";
export const GET_CALL_RECORDING_OVERVIEW = "/ozonetel/get/call/overviews";

// Feedback Recordings
export const GET_FEEDBACK_RECORDINGS = "/feedback/recordings";
export const GET_FEEDBACK_RECORDING_BY_ID = "/feedback/recordings";
export const GENERATE_FEEDBACK_OVERVIEW_RECORDING =
  "/feedback/generate-overview";
export const BULK_GENERATE_FEEDBACK_OVERVIEW_RECORDING =
  "/feedback/generate-bulk-overview";
export const UPLOAD_FEEDBACK_XLSX_FILE = "/feedback/upload/file";
export const GET_FEEDBACK_RECORDING_OVERVIEW =
  "/feedback/get/feedback/overviews";

// generate AI Summary
export const GET_AI_SUMMARY = "/chart/generateSummary";
export const VALIDATE_SUMMARY = "/chart/validate/response";

// SOP CONFIGS
export const CONFIGURATION_SOP = "/sop/create";
export const GET_ROLES = "/sop/getroles";
export const GET_FIELDS = "/sop/fields";
export const GET_SOP_LAB_TESTS = "/sop/lab-tests";
export const GET_ALL_SOP_ALERTS = "/sop/alerts";
export const EXPORT_SOP_ALERTS = "/sop/alerts/export";
export const GET_UNREAD_SOP_ALERTS = "/sop/alerts/unread";
export const MARK_SOP_ALERT_READ = "/sop/alerts";
export const MARK_ALL_SOP_ALERTS_READ = "/sop/alerts/mark-all-read";
export const RESOLVE_SOP_ALERT = "/sop/alerts";

export const SOP_RULES = "/sop/rules";
export const SOP_SUGGESTED_MEDICINES = "/sop/suggested-medicines";
export const SOP_BASELINE_PACKAGE = "/sop/baseline-package";

// trainings

export const CREATE_TRAININGS = "/trainings/create";
export const GET_BY_ROLES = "/trainings/get/by/roles";
export const ACKNOWLEDGE_TRAINING = "/trainings/acknowledge";
export const LEARN_TRAINING = "/trainings/learn";
export const TRAINING_BASE = "/trainings";
export const TRAINING_UPLOADS = "/trainings/uploads";
export const TRAINER_VIDEOS = "/trainings/trainer-videos";
export const TRAINING_ADMIN = "/trainings/admin";
export const TRAINING_NOTIFICATIONS = "/trainings/notifications";
export const GET_ALL_TRAININGS = "/trainings/get";
export const EDIT_TRAINING = "/trainings/edit/training";
export const GET_TRAINING_BY_ID = "/trainings";
export const GET_TRAINING_HISTORY = "/trainings/history";
export const CREATE_TRAINER_RECORD = "/trainings/create/trainers";
export const GET_USER_BY_ROLE = "/trainings/get/users/by/role";
export const GET_EMPLOYEES_BY_POSITION = "/trainings/get/employees/by/position";
export const GET_TRAINERS = "/trainings/get/trainers";
export const GET_TRAINER_BY_ID = "/trainings/get/trainer";
export const EDIT_TRAINER = "/trainings/edit";
export const DELETE_RECORD = "/trainings/delete";
export const GET_DISCTINCT_ROLES = "/trainings/get/distinct/roles";

// Positions
export const GET_POSITIONS = "/hr/get/positions";

// PROFILE
export const GET_EMPLOYEE_PROFILE = "/profile/get";

// HR configurations
export const ADD_DEPARTMENTS = "/hr/create/departments";
export const ADD_POSITIONS = "/hr/create/positions";

export const GET_LEAVES_AND_REGULARIZATIONS =
  "/hrms/get-my-leaves/regularizations";

export const GENERATE_ADDMISSION_SUMMARY =
  "/patient/generate/addmission/summary";

export const GET_ADDMISSION_SUMMARY = "/patient/get/addmission/summary";
export const GET_PATIENT_BIODATA = "/patient/get/patient/bio/data/:id";

export const POST_PSYCHO_DIAGNOSTIC_FORM = "/chart/psycho-diagnostic-form";
export const EDIT_PSYCHO_DIAGNOSTIC_FORM = "/chart/psycho-diagnostic-form";
export const POST_GENERAL_PSYCHO_DIAGNOSTIC_FORM =
  "/chart/psycho-diagnostic-form/general";
export const EDIT_GENERAL_PSYCHO_DIAGNOSTIC_FORM =
  "/chart/psycho-diagnostic-form/general";
export const DELETE_PSYCHO_DIAGNOSTIC_FORM_FILE =
  "/chart/psycho-diagnostic-form";
export const GENERATE_PSYCHO_DIAGNOSTIC_SUMMARY =
  "/chart/generate/summary/psycho-diagnostic-form";

export const POST_VISIT_LOG = "/marketing/visit-log";
export const GET_VISIT_LOGS = "/marketing/visit-log";

export const GET_VENDORS = "/master/vendor";
export const VENDOR_BASE = "/master/vendor";
export const CENTRAL_PAYMENT_VENDOR_REQUEST = "/master/vendor/central-payment-request";
export const GET_ITEM_TYPES = "/master/item-type";
export const ITEM_TYPE_BASE = "/master/item-type";

export const ITEM_MASTER_BASE = "/master/item";
export const GET_ITEM_MASTERS = ITEM_MASTER_BASE;
export const GET_UOMS = "/master/uom";
export const UOM_BASE = "/master/uom";
export const ASSET_CATEGORY_BASE = "/master/asset-category";

export const PAYMENT_TERM_BASE = "/master/payment-term";
export const CHART_OF_ACCOUNTS_BASE = "/master/chart-of-accounts";
export const LEDGER_TYPE_BASE = "/master/ledger-type";
export const LEDGER_SUB_TYPE_BASE = "/master/ledger-sub-type";
export const LEDGER_BASE = "/master/ledger";
export const GL_VOUCHER_BASE = "/master/gl-voucher";
export const GL_ENTRY_BASE = "/master/gl-entry";
export const TRIAL_BALANCE_BASE = "/master/trial-balance";

export const PR_DEPARTMENT_BASE = "/master/pr-department";
export const PR_SUB_DEPARTMENT_BASE = "/master/pr-sub-department";
export const BUDGET_BASE = "/master/budget";
export const USER_LOOKUP_BASE = "/master/user-lookup";
export const PR_BASE = "/master/pr";
export const RFQ_BASE = "/master/rfq";
export const PO_BASE = "/master/po";
export const CONTRACT_BASE = "/master/contract";
export const DI_BASE = "/master/delivery-intimation";
export const DI_BASE_POS = "/master/delivery-intimation/pos";
export const GRN_BASE = "/master/grn";
export const GRN_BASE_DI = "/master/grn/pending-di";
export const GRN_BASE_PO = "/master/grn/pending-po";
export const VI_BASE = "/master/vendor-invoice";
export const VI_BASE_GRN = "/master/vendor-invoice/pending-grn";
export const STORAGE_LOCATION_BASE = "/master/storage-location";
export const PUTAWAY_BASE = "/master/putaway";
export const PUTAWAY_BASE_GRN = "/master/putaway/pending-grn";
export const MATERIAL_ISSUE_BASE = "/master/stock/material-issue";
export const MATERIAL_RETURN_BASE = "/master/stock/material-return";
export const STOCK_BALANCE_BASE = "/master/stock/balances";
export const STOCK_LEDGER_BASE = "/master/stock/ledger";

export const CONFIGURATION_DOCS = "/hr/doc/configuration";

export const DOC_INPUT_POST = "/hr/doc/post";
export const DOC_INPUT_EDIT = "/hr/doc/edit";
export const DOC_INPUT_DELETE = "/hr/doc/delete";
export const DOC_INPUT_GET = "/hr/doc/get";

export const EMPLOYEE_DOC_FIELDS = "/hr/doc/employee-documents/fields";
export const EMPLOYEE_DOC_UPLOAD = "/hr/doc/employee-documents/upload";
export const EMPLOYEE_DOC_DELETE = "/hr/doc/employee-documents";
export const EMPLOYEE_DOC_BY_ID = "/hr/doc/employee-documents";

export const EMPLOYEE_DOC_DELETE_BY_EMP_ID = "/hr/doc/employee-documents";

export const EMPLOYEE_DOC_BY_EMPID = "/hr/doc/employee-documents/by-employee";
export const EMPLOYEE_DOCS = "/hr/doc/employee-documents/all";
export const REVIEW_DOC = "/hr/doc/employee-documents";

export const CGIS_TEST = "/clinical-test/cgis-test";
export const COWS_TEST = "/clinical-test/cows-test";
export const AUDIT_TEST = "/clinical-test/audit-test";
export const CIWA_B_TEST = "/clinical-test/ciwa-b-test";

// center floors + floor photos
export const FLOOR_INPUT_POST = "/center-floor/post";
export const FLOOR_INPUT_GET = "/center-floor/get";
export const FLOOR_INPUT_EDIT = "/center-floor/edit";
export const FLOOR_INPUT_DELETE = "/center-floor/delete";

export const AREA_INPUT_POST = "/center-floor/areas/post";
export const AREA_INPUT_GET = "/center-floor/areas/get";
export const AREA_INPUT_EDIT = "/center-floor/areas/edit";
export const AREA_INPUT_DELETE = "/center-floor/areas/delete";

export const CONFIGURATION_FLOORS = "/center-floor/configuration";
export const CONFIGURATION_FLOORS_SUMMARY =
  "/center-floor/configuration/summary";

export const CENTER_FLOOR_PHOTOS = "/center-floor/photos";
export const CENTER_FLOOR_PHOTO_UPLOAD = "/center-floor/photos/upload";
export const CENTER_FLOOR_PHOTOS_ALL = "/center-floor/photos/all";
export const CENTER_FLOOR_AUDITS = "/center-floor/audits";

export const ADD_BIOMETRIC_ADDITION_REQUEST = "/hr/biometric/addition";
export const GET_BIOMETRIC_ADDITION_REQUESTS = "/hr/biometric/requests/get";
export const GET_USERS_BY_ROLE = "/hr/biometric/get/usersbyrole";
export const ACTION_ON_BIOMETRIC_ADDITION_REQUEST = "/hr/biometric/action";
export const GET_MY_ASSIGNED_BIOMETRICS = "/hr/biometric/get/my/assigns";
export const UPDATE_ASSIGNEE_STATUS = "/hr/biometric/update/assignee/status";
export const NEW_JOINING_BIOMETRIC_DATA = "/hr/new-joining-biometric";
export const ACTION_ON_NEW_JOINING_BIOMETRIC_DATA =
  "/hr/new-joining-biometric/action";
