import React, { useEffect, useRef, useState } from "react";
import "react-perfect-scrollbar/dist/css/styles.css";
import { Link, useLocation } from "react-router-dom";
import PerfectScrollbar from "react-perfect-scrollbar";
import { Collapse } from "reactstrap";
import { usePermissions } from "../../../Components/Hooks/useRoles";

const Sidebar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);
  const [isMISOpen, setIsMISOpen] = useState(true);
  const [openMISCategories, setOpenMISCategories] = useState({});
  const toggleMISCategory = (id) =>
    setOpenMISCategories((prev) => ({ ...prev, [id]: !prev[id] }));
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.innerWidth < 992
  );

  const toggleMISCollapse = () => setIsMISOpen(!isMISOpen);
  const toggleCollapse = () => setIsOpen(!isOpen);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 992);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const sidebarRef = useRef(null);
  const spacerRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [offset, setOffset] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isMobile) return undefined;

    const measure = () => {
      if (!spacerRef.current) return;
      const rect = spacerRef.current.getBoundingClientRect();
      setOffset({ top: rect.top, left: rect.left });
    };

    measure();
    window.addEventListener("resize", measure);

    const observer = new MutationObserver(measure);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-sidebar-size", "class"],
    });

    return () => {
      window.removeEventListener("resize", measure);
      observer.disconnect();
    };
  }, [isMobile]);

  const showLabels = isMobile ? true : isHovered;

  const microUser = localStorage.getItem("micrologin");
  const token = microUser ? JSON.parse(microUser).token : null;

  const { hasPermission } = usePermissions(token);
   const hasHubspotReportingPermission = hasPermission(
    "HUBSPOT_REPORTING",
    null,
    "READ"
  );
  const hasHubspotCenterLeadsPermission = hasPermission("HUBSPOT_REPORTING", "HUBSPOT_CENTER_LEADS_COUNT", "READ");
  const hasHubspotOwnerLeadsPermission = hasPermission("HUBSPOT_REPORTING", "HUBSPOT_OWNER_LEADS_COUNT", "READ");
  const hasHubspotCityQualityPermission = hasPermission("HUBSPOT_REPORTING", "HUBSPOT_CITY_QUALITY_BREAKDOWN", "READ");
  const hasHubspotOwnerQualityPermission = hasPermission("HUBSPOT_REPORTING", "HUBSPOT_OWNER_QUALITY_BREAKDOWN", "READ");
  const hasHubspotCityVisitPermission = hasPermission("HUBSPOT_REPORTING", "HUBSPOT_CITY_VISIT_DATE", "READ");
  const hasHubspotOwnerVisitPermission = hasPermission("HUBSPOT_REPORTING", "HUBSPOT_OWNER_VISIT_DATE", "READ");
  const hasHubspotCityVisitedPermission = hasPermission("HUBSPOT_REPORTING", "HUBSPOT_CITY_VISITED_DATE", "READ");
  const hasHubspotOwnerVisitedPermission = hasPermission("HUBSPOT_REPORTING", "HUBSPOT_OWNER_VISITED_DATE", "READ");
  const hasHubspotCityLeadStatusPermission = hasPermission("HUBSPOT_REPORTING", "HUBSPOT_CITY_LEAD_STATUS", "READ");
  const hasHubspotOwnerLeadStatusPermission = hasPermission("HUBSPOT_REPORTING", "HUBSPOT_OWNER_LEAD_STATUS", "READ");
  const hasMISPermission = hasPermission("MIS_REPORTS", "MIS_REPORTS_PERMISSION", "READ");

  const HubspotReporting = [
    hasHubspotCenterLeadsPermission ? { id: "center-leads-mom", label: "Center Leads (MoM)", link: "/mi-reporting/center-leads-mom", icon: "bx bx-bar-chart-alt-2" } : null,
    hasHubspotCenterLeadsPermission ? { id: "center-leads-mtd", label: "Center Leads (MTD)", link: "/mi-reporting/center-leads-mtd", icon: "bx bx-line-chart" } : null,
    hasHubspotOwnerLeadsPermission ? { id: "owner-leads-mom", label: "Owner Leads (MoM)", link: "/mi-reporting/owner-leads-mom", icon: "bx bx-bar-chart-square" } : null,
    hasHubspotOwnerLeadsPermission ? { id: "owner-leads-mtd", label: "Owner Leads (MTD)", link: "/mi-reporting/owner-leads-mtd", icon: "bx bx-trending-up" } : null,
    hasHubspotCityQualityPermission ? { id: "city-quality", label: "City Quality Breakdown", link: "/mi-reporting/city-quality", icon: "bx bx-map" } : null,
    hasHubspotOwnerQualityPermission ? { id: "owner-quality", label: "Owner Quality Breakdown", link: "/mi-reporting/owner-quality", icon: "bx bx-user-check" } : null,
    hasHubspotCityVisitPermission ? { id: "city-visit-date", label: "City Visit Date", link: "/mi-reporting/city-visit-date", icon: "bx bx-calendar" } : null,
    hasHubspotOwnerVisitPermission ? { id: "owner-visit-date", label: "Owner Visit Date", link: "/mi-reporting/owner-visit-date", icon: "bx bx-calendar-check" } : null,
    hasHubspotCityVisitedPermission ? { id: "city-visited-date", label: "City Visited Date", link: "/mi-reporting/city-visited-date", icon: "bx bx-calendar-event" } : null,
    hasHubspotOwnerVisitedPermission ? { id: "owner-visited-date", label: "Owner Visited Date", link: "/mi-reporting/owner-visited-date", icon: "bx bx-calendar-star" } : null,
    hasHubspotCityLeadStatusPermission ? { id: "city-lead-status", label: "City Lead Status", link: "/mi-reporting/city-lead-status", icon: "bx bx-bar-chart" } : null,
    hasHubspotOwnerLeadStatusPermission ? { id: "owner-lead-status", label: "Owner Lead Status", link: "/mi-reporting/owner-lead-status", icon: "bx bx-bar-chart-square" } : null,
    hasHubspotReportingPermission ? { id: "center-wise-mom", label: "Center Wise (MoM)", link: "/mi-reporting/center-wise-mom", icon: "bx bx-building" } : null,
  ];

  const MIS_REPORT_CATEGORIES = [
    {
      id: "dashboards",
      title: "Dashboards",
      submodule: "DASHBOARDS",
      items: [
        { id: "daily-dashboard", label: "Daily Dashboard", link: "/mi-reporting/daily-dashboard", icon: "bx bx-tachometer", submodule: "DAILY_DASHBOARD" },
        { id: "metrics-report", label: "Metrics Report", link: "/mi-reporting/metrics-report", icon: "bx bx-line-chart", submodule: "METRICS_REPORT" },
      ],
    },
    {
      id: "finance-revenue",
      title: "💰 Finance & Revenue",
      submodule: "FINANCE_REVENUE",
      items: [
        { id: "daily-invoices", label: "Daily Invoices", link: "/mi-reporting/daily-invoices", icon: "bx bx-receipt", submodule: "DAILY_INVOICES" },
        { id: "due-amount", label: "Due Amount", link: "/mi-reporting/due-amount", icon: "bx bx-wallet-alt", submodule: "DUE_AMOUNT" },
        { id: "opd-charges", label: "OPD Charges", link: "/mi-reporting/opd-charges", icon: "bx bx-money", submodule: "OPD_CHARGES" },
        { id: "cash-per-center", label: "Cash Per Center", link: "/mi-reporting/cash-per-center", icon: "bx bx-wallet", submodule: "CASH_PER_CENTER" },
        { id: "refund-amount", label: "Refund Amount", link: "/mi-reporting/refund-amount", icon: "bx bx-revision", submodule: "REFUND_AMOUNT" },
        { id: "write-off-amount", label: "Write Off Amount", link: "/mi-reporting/write-off-amount", icon: "bx bx-money", submodule: "WRITE_OFF_AMOUNT" },
        { id: "central-expenses", label: "Central Expenses", link: "/mi-reporting/central-expenses", icon: "bx bx-receipt", submodule: "CENTRAL_EXPENSES" },
        { id: "cash-reco-compliance", label: "Cash Reco Compliance", link: "/mi-reporting/cash-reco-compliance", icon: "bx bx-wallet-alt", submodule: "CASH_RECO_COMPLIANCE" },
      ],
    },
    {
      id: "occupancy-patient-management",
      title: "🏥 Occupancy & Patient Management",
      submodule: "OCCUPANCY_PATIENT_MANAGEMENT",
      items: [
        { id: "occupancy", label: "Occupancy", link: "/mi-reporting/occupancy", icon: "bx bx-bed", submodule: "OCCUPANCY" },
        { id: "readmission", label: "Readmission", link: "/mi-reporting/readmission", icon: "bx bx-repost", submodule: "READMISSION" },
      ],
    },
    {
      id: "clinical-operations",
      title: "📋 Clinical Operations",
      submodule: "CLINICAL_OPERATIONS",
      items: [
        { id: "vital-signs", label: "Vital Signs", link: "/mi-reporting/vital-signs", icon: "bx bx-heart-circle", submodule: "VITAL_SIGNS" },
        { id: "round-notes", label: "Round Notes", link: "/mi-reporting/round-notes", icon: "bx bx-notepad", submodule: "ROUND_NOTES" },
        { id: "clinical-notes", label: "Clinical Notes", link: "/mi-reporting/clinical-notes", icon: "bx bx-clipboard", submodule: "CLINICAL_NOTES" },
      ],
    },
    {
      id: "doctor-counselling",
      title: "👨‍⚕️ Doctor & Counselling",
      submodule: "DOCTOR_COUNSELLING",
      items: [
        { id: "doctor-psychologist-stay-range", label: "Doctor/Psychologist Stay Range", link: "/mi-reporting/doctor-psychologist-stay-range", icon: "bx bx-time-five", submodule: "DOCTOR_PSYCHOLOGIST_STAY_RANGE" },
        { id: "counselling-sessions-patients", label: "Counselling Patients", link: "/mi-reporting/counselling-sessions-patients", icon: "bx bx-conversation", submodule: "COUNSELLING_SESSIONS_PATIENTS" },
        { id: "counselling-sessions", label: "Counselling Sessions", link: "/mi-reporting/counselling-sessions", icon: "bx bx-conversation", submodule: "COUNSELLING_SESSIONS" },
        { id: "counselling-recording", label: "Counselling Recording", link: "/mi-reporting/counselling-recording", icon: "bx bx-microphone", submodule: "COUNSELLING_RECORDING" },
        { id: "patient-assigned-status", label: "Patient Assigned Status", link: "/mi-reporting/patient-assigned-status", icon: "bx bx-user-x", submodule: "PATIENT_ASSIGNED_STATUS" },
        { id: "suspended-assigned", label: "Suspended Assigned", link: "/mi-reporting/suspended-assigned", icon: "bx bx-user-x", submodule: "SUSPENDED_ASSIGNED" },
      ],
    },
    {
      id: "nursing-operations",
      title: "👩‍⚕️ Nursing Operations",
      submodule: "NURSING_OPERATIONS",
      items: [
        { id: "nurses-dod", label: "Nurses DOD", link: "/mi-reporting/nurses-dod", icon: "bx bx-capsule", submodule: "NURSES_DOD" },
        { id: "nurses-dashboard-dod", label: "Nurses Dashboard DOD", link: "/mi-reporting/nurses-dashboard-dod", icon: "bx bx-capsule", submodule: "NURSES_DASHBOARD_DOD" },
      ],
    },
    {
      id: "documentation-compliance",
      title: "📄 Documentation & Compliance",
      submodule: "DOCUMENTATION_COMPLIANCE",
      items: [
        { id: "patient-docs", label: "IPD Patient Docs", link: "/mi-reporting/patient-docs", icon: "bx bx-bed", submodule: "PATIENT_DOCS" },
        { id: "opd-patient-docs", label: "OPD Patient Docs", link: "/mi-reporting/opd-patient-docs", icon: "bx bx-walk", submodule: "OPD_PATIENT_DOCS" },
        { id: "docs-compliance", label: "Docs Compliance", link: "/mi-reporting/docs-compliance", icon: "bx bx-task", submodule: "DOCS_COMPLIANCE" },
        { id: "forms-data", label: "Forms Data", link: "/mi-reporting/forms-data", icon: "bx bx-clipboard", submodule: "FORMS_DATA" },
      ],
    },
    {
      id: "quality-incidents",
      title: "⚠️ Quality & Incidents",
      submodule: "QUALITY_INCIDENTS",
      items: [
        { id: "incident", label: "Incident", link: "/mi-reporting/incident", icon: "bx bx-error-circle", submodule: "INCIDENT" },
        { id: "sop-alerts", label: "SOP Alerts", link: "/mi-reporting/sop-alerts", icon: "bx bx-bell", submodule: "SOP_ALERTS" },
      ],
    },
    {
      id: "hr-attendance",
      title: "👥 HR & Attendance",
      submodule: "HR_ATTENDANCE",
      items: [
        { id: "attendance", label: "Attendance", link: "/mi-reporting/attendance", icon: "bx bx-calendar-check", submodule: "ATTENDANCE" },
        { id: "attrition-data", label: "Attrition Data", link: "/mi-reporting/attrition-data", icon: "bx bx-user-minus", submodule: "ATTRITION_DATA" },
      ],
    },
    {
      id: "marketing",
      title: "📈 Marketing",
      submodule: "MARKETING",
      items: [
        { id: "referral-data", label: "Referral Data", link: "/mi-reporting/referral-data", icon: "bx bx-share-alt", submodule: "REFERRAL_DATA" },
      ],
    },
  ];

  const visibleMISCategories = MIS_REPORT_CATEGORIES
    .filter((category) => hasPermission("MIS_REPORTS", category.submodule, "READ"))
    .map((category) => ({
      ...category,
      items: category.items.filter((item) => hasPermission("MIS_REPORTS", item.submodule, "READ")),
    }))
    .filter((category) => category.items.length > 0);

  const sidebarStyle = isMobile
    ? {
        position: "fixed",
        top: 0,
        left: isMobileOpen ? 0 : "-280px",
        height: "100vh",
        width: "260px",
        minWidth: "260px",
        zIndex: 1045,
        transition: "left 0.3s ease",
        overflow: "hidden",
        background: "#fff",
        boxShadow: isMobileOpen ? "4px 0 16px rgba(0,0,0,0.18)" : "none",
        display: "flex",
        flexDirection: "column",
      }
    : {
        position: "fixed",
        top: offset.top,
        left: offset.left,
        bottom: 0,
        // .chat-leftsidebar (src/assets/scss/pages/_chat.scss) sets an explicit
        // height at >=992px, which wins over `bottom` once top/height/bottom are
        // all non-auto — override it so top+bottom actually determine the height.
        // height: "auto",
        width: isHovered ? "260px" : "70px",
        minWidth: isHovered ? "260px" : "70px",
        zIndex: 100,
        transition: "width 0.25s ease, min-width 0.25s ease",
        overflow: "hidden",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
      };

  const spacerStyle = {
    width: isHovered ? "260px" : "70px",
    minWidth: isHovered ? "260px" : "70px",
    flexShrink: 0,
    minHeight: "100vh",
    transition: "width 0.25s ease, min-width 0.25s ease",
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 1040,
          }}
        />
      )}

      {/* Mobile hamburger FAB */}
      {isMobile && !isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(true)}
          style={{
            position: "fixed",
            bottom: 24,
            left: 16,
            zIndex: 1050,
            borderRadius: "50%",
            width: 48,
            height: 48,
            border: "none",
            background: "green",
            color: "white",
            fontSize: 22,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 3px 10px rgba(0,0,0,0.25)",
          }}
        >
          <i className="bx bx-menu"></i>
        </button>
      )}

      {/* Flex-flow spacer: reserves the sidebar's width/height in the layout while the
          visible sidebar itself is position:fixed, and is what we measure to anchor it */}
      {!isMobile && <div ref={spacerRef} aria-hidden="true" style={spacerStyle} />}

      <div
        ref={sidebarRef}
        className="chat-leftsidebar"
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
        style={sidebarStyle}
      >
        <PerfectScrollbar className="chat-room-list" style={{ flex: 1, minHeight: 0, maxHeight: "none", paddingBottom: 100, overscrollBehavior: "contain" }}>
          <div>
          {hasHubspotReportingPermission && (
            <>
              <div className="ps-4 pe-3 pt-4">
                <div className="d-flex align-items-start">
                  <div className="d-flex justify-content-between w-100 mb-2">
                    <div
                      onClick={toggleCollapse}
                      className="d-flex align-items-center justify-content-between w-100 cursor-pointer"
                      style={{ cursor: "pointer" }}
                    >
                      {showLabels && <h5 className="pb-0 mb-0">Hubspot Reporting</h5>}
                      <i className={`mdi mdi-chevron-${isOpen ? "up" : "down"} fs-4`}></i>
                    </div>
                    {isMobile && (
                      <button
                        onClick={() => setIsMobileOpen(false)}
                        type="button"
                        className="btn btn-sm px-2"
                      >
                        <i className="bx bx-x fs-5"></i>
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <Collapse isOpen={isOpen}>
                <ul className="list-unstyled chat-list chat-user-list users-list" id="userList">
                  {(HubspotReporting || []).filter((m) => m).map((page, idx) => (
                    <li key={idx} className={location.pathname === page.link ? "active" : ""}>
                      <Link to={page.link} onClick={() => isMobile && setIsMobileOpen(false)}>
                        <div className={`d-flex align-items-center ${showLabels ? "" : "justify-content-center"}`}>
                          <div
                            className="flex-shrink-0 chat-user-img online align-self-center ms-0"
                            style={{ marginRight: showLabels ? "0.5rem" : "0" }}
                          >
                            <div className="avatar-xxs">
                              <i className={`${page.icon} fs-4`}></i>
                            </div>
                            <span className="user-status"></span>
                          </div>
                          {showLabels && (
                            <div className="flex-grow-1 overflow-hidden">
                              <p className="text-truncate font-semi-bold fs-15 mb-0">{page.label || ""}</p>
                            </div>
                          )}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Collapse>
            </>
          )}
          </div>

          {hasMISPermission && (
            <>
              <div className="ps-4 pe-3 pt-2">
                <div className="d-flex align-items-start">
                  <div className="d-flex justify-content-between w-100 mb-2">
                    <div
                      onClick={toggleMISCollapse}
                      className="d-flex align-items-center justify-content-between w-100 cursor-pointer"
                      style={{ cursor: "pointer" }}
                    >
                      {showLabels && <h5 className="pb-0 mb-0">MIS Reports</h5>}
                      <i className={`mdi mdi-chevron-${isMISOpen ? "up" : "down"} fs-4`}></i>
                    </div>
                  </div>
                </div>
              </div>
              <Collapse isOpen={isMISOpen}>
                {visibleMISCategories.map((category) => (
                  <div key={category.id}>
                    {showLabels && (
                      <div
                        onClick={() => toggleMISCategory(category.id)}
                        className="d-flex align-items-center justify-content-between px-3 pt-2 pb-1"
                        style={{ cursor: "pointer" }}
                      >
                        <p
                          className="text-uppercase text-muted fw-semibold mb-0"
                          style={{ fontSize: "0.7rem", letterSpacing: "0.03em" }}
                        >
                          {category.title}
                        </p>
                        <i
                          className={`mdi mdi-chevron-${openMISCategories[category.id] ? "up" : "down"} text-muted`}
                        ></i>
                      </div>
                    )}
                    <Collapse isOpen={!showLabels || !!openMISCategories[category.id]}>
                    <ul className="list-unstyled chat-list chat-user-list users-list">
                      {category.items.map((page) => (
                        <li key={page.id} className={location.pathname === page.link ? "active" : ""}>
                          <Link to={page.link} onClick={() => isMobile && setIsMobileOpen(false)}>
                            <div className={`d-flex align-items-center ${showLabels ? "" : "justify-content-center"}`}>
                              <div
                                className="flex-shrink-0 chat-user-img online align-self-center ms-0"
                                style={{ marginRight: showLabels ? "0.5rem" : "0" }}
                              >
                                <div className="avatar-xxs">
                                  <i className={`${page.icon} fs-4`}></i>
                                </div>
                              </div>
                              {showLabels && (
                                <div className="flex-grow-1 overflow-hidden">
                                  <p className="text-truncate font-semi-bold fs-15 mb-0">{page.label}</p>
                                </div>
                              )}
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    </Collapse>
                  </div>
                ))}
              </Collapse>
            </>
          )}
        </PerfectScrollbar>
      </div>
    </>
  );
};

export default Sidebar;