import React from "react";
import PropTypes from "prop-types";
import {
  Button,
  ButtonGroup,
  Nav,
  NavItem,
  NavLink,
  UncontrolledTooltip,
} from "reactstrap";
import classnames from "classnames";
import StaffSelect from "./StaffSelect";
import {
  ADMIT_PATIENTS,
  ALL_PATIENTS,
  DISCHARGE_PATIENTS,
  MY_PATIENTS,
  OPD_PATIENTS,
  PATIENT_GENDER_FILTERS,
} from "../../../Components/constants/patient";

// Shared between the buttons and their tooltips, which are rendered separately.
const genderTargetId = (key) => `gender-filter-${key.toLowerCase()}`;

const Tabs = ({
  customActiveTab,
  toggleCustom,
  myPatientsOnly,
  gender,
  setGender,
  staff,
  setStaff,
  centerAccess,
}) => {
  return (
    <React.Fragment>
      <div>
        <Nav
          tabs
          className="nav nav-tabs nav-tabs-custom nav-success nav-justified flex-nowrap mb-2"
        >
          {/* A Visiting Consultant gets the My Patients tab only. */}
          {!myPatientsOnly && (
            <>
              <NavItem>
                <NavLink
                  style={{ cursor: "pointer" }}
                  className={classnames("px-2", {
                    active: customActiveTab === ALL_PATIENTS,
                  })}
                  onClick={() => {
                    toggleCustom(ALL_PATIENTS);
                  }}
                  id="all-patients"
                >
                  <i className="ri-team-fill fs-6"></i>
                </NavLink>
                <UncontrolledTooltip placement="bottom" target="all-patients">
                  All Patients
                </UncontrolledTooltip>
              </NavItem>
              <NavItem>
                <NavLink
                  style={{ cursor: "pointer" }}
                  className={classnames("px-2", {
                    active: customActiveTab === ADMIT_PATIENTS,
                  })}
                  onClick={() => {
                    toggleCustom(ADMIT_PATIENTS);
                  }}
                  id="admit-patients"
                >
                  <i className="ri-user-location-fill fs-6"></i>
                </NavLink>
                <UncontrolledTooltip placement="bottom" target="admit-patients">
                  Admit Patients
                </UncontrolledTooltip>
              </NavItem>
              <NavItem>
                <NavLink
                  style={{ cursor: "pointer" }}
                  className={classnames("px-2", {
                    active: customActiveTab === DISCHARGE_PATIENTS,
                  })}
                  onClick={() => {
                    toggleCustom(DISCHARGE_PATIENTS);
                  }}
                  id="discharge-patients"
                >
                  <i className="ri-user-follow-fill fs-6"></i>
                </NavLink>
                <UncontrolledTooltip placement="bottom" target="discharge-patients">
                  Discharged Patients
                </UncontrolledTooltip>
              </NavItem>
              <NavItem>
                <NavLink
                  style={{ cursor: "pointer" }}
                  className={classnames("px-2", {
                    active: customActiveTab === OPD_PATIENTS,
                  })}
                  onClick={() => {
                    toggleCustom(OPD_PATIENTS);
                  }}
                  id="opd-patients"
                >
                  {/* No id here — "opd-patients" is already on the NavLink above,
                      and a duplicate would make the tooltip target ambiguous. */}
                  <span className="fs-6">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="M8 3v2H6v4a4 4 0 0 0 8 0V5h-2V3h3a1 1 0 0 1 1 1v5a6.002 6.002 0 0 1-5 5.917V16.5a3.5 3.5 0 0 0 6.775 1.238a3 3 0 1 1 2.05.148A5.502 5.502 0 0 1 8.999 16.5v-1.583A6.002 6.002 0 0 1 4 9V4a1 1 0 0 1 1-1h3Zm11 11a1 1 0 1 0 0 2a1 1 0 0 0 0-2Z"
                      />
                    </svg>
                  </span>
                </NavLink>
                <UncontrolledTooltip placement="bottom" target="opd-patients">
                  OPD Patients
                </UncontrolledTooltip>
              </NavItem>
            </>
          )}
          <NavItem>
            <NavLink
              style={{ cursor: "pointer" }}
              className={classnames("px-2", {
                active: customActiveTab === MY_PATIENTS,
              })}
              onClick={() => {
                toggleCustom(MY_PATIENTS);
              }}
              id="my-patients"
            >
              <i className="ri-home-line fs-6"></i>
            </NavLink>
            <UncontrolledTooltip placement="bottom" target="my-patients">
              My Patients
            </UncontrolledTooltip>
          </NavItem>
        </Nav>

        {/* Gender sub-filter for whichever tab is active above. Icon-only, to sit
            quietly under the tab row; the label lives in the tooltip. Narrows the
            list server-side and carries across tab changes. Clicking the active
            icon clears it. */}
        <div className="d-flex justify-content-center align-items-center gap-1 mb-3">

          {customActiveTab === ADMIT_PATIENTS && (
            <div className="flex-grow-1" style={{ minWidth: 0 }}>
              <StaffSelect
                value={staff}
                onChange={setStaff}
                centerAccess={centerAccess}
              />
            </div>
          )}

          <ButtonGroup size="sm" className="rounded-2 border bg-light p-1">
            {PATIENT_GENDER_FILTERS.map(({ key, icon, iconActive }) => {
              const isActive = gender === key;
              return (
                <Button
                  key={key}
                  id={genderTargetId(key)}
                  color={isActive ? "success" : "light"}
                  className="px-2 rounded-2 border-0"
                  onClick={() => setGender(isActive ? null : key)}
                >
                  <i
                    className={`${isActive ? iconActive : icon} fs-6 align-middle ${isActive ? "" : "text-muted"
                      }`}
                  ></i>
                </Button>
              );
            })}
          </ButtonGroup>
        </div>

        {/* Kept outside the ButtonGroup: an open tooltip rendered inside it would
            become a flex child of .btn-group and distort the pill. */}
        {PATIENT_GENDER_FILTERS.map(({ key, label }) => (
          <UncontrolledTooltip
            key={key}
            placement="bottom"
            target={genderTargetId(key)}
          >
            {gender === key ? `${label} only - click to clear` : label}
          </UncontrolledTooltip>
        ))}
      </div>
    </React.Fragment>
  );
};

Tabs.propTypes = {
  customActiveTab: PropTypes.string,
  toggleCustom: PropTypes.func,
  myPatientsOnly: PropTypes.bool,
  gender: PropTypes.string,
  setGender: PropTypes.func,
  staff: PropTypes.object,
  setStaff: PropTypes.func,
  centerAccess: PropTypes.array,
};

export default Tabs;
