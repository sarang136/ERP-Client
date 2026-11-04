import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Dropdown, DropdownMenu, DropdownToggle, Form } from "reactstrap";
import PropTypes from "prop-types";

//import images
import logoSm from "../assets/images/logo-sm.png";
import logoDark from "../assets/images/logo-dark.png";
import logoLight from "../assets/images/logo-light.png";

//import Components
import SearchOption from "../Components/Common/SearchOption";
import WebAppsDropdown from "../Components/Common/WebAppsDropdown";
import FullScreenDropdown from "../Components/Common/FullScreenDropdown";
import NotificationDropdown from "../Components/Common/NotificationDropdown";
import ProfileDropdown from "../Components/Common/ProfileDropdown";
import { connect, useDispatch, useSelector } from "react-redux";
import { fetchCenters, searchPatient, viewPatient } from "../store/actions";
import Highlighter from "react-highlight-words";
import RenderWhen from "../Components/Common/RenderWhen";
import { useDebounce } from "../Components/Hooks/useDebounce";
import PatientPlaceholder from "../Components/Common/PatientPlaceholder";
import SimpleBar from "simplebar-react";
import { VISITING_CONSULTANT_ROLE } from "../Components/constants/patient";

const Header = ({
  onChangeLayoutMode,
  layoutModeType,
  headerClass,
  loading,
  patients,
  centers,
  centerAccess,
  user,
}) => {
  const dispatch = useDispatch();
  // A Visiting Consultant only works from My Patients, so the patient search
  // is off for them — desktop and mobile.
  const noPatientSearch = user?.role === VISITING_CONSULTANT_ROLE;
  const [value, setValue] = useState("");
  // Debounce the query so the search API fires once the user pauses typing
  // instead of on every keystroke.
  const debouncedValue = useDebounce(value.trim(), 300);
  const { loading: globalLoader, dataLoader } = useSelector(
    (state) => state.User
  );
  const onChangeData = (e) => {
    var dropdown = document.getElementById("mb-search-dropdown");
    var searchInput = document.getElementById("mb-search-options");
    var inputLength = searchInput.value.length;
    if (inputLength > 0) {
      dropdown.classList.add("show");
      // searchOptions.classList.remove("d-none");
    } else {
      dropdown.classList.remove("show");
      // searchOptions.classList.add("d-none");
    }

    setValue(e.target.value);
  };
  const [search, setSearch] = useState(false);
  const toogleSearch = () => {
    setSearch(!search);
  };

  const searchRef = useRef();

  useEffect(() => {
    // var searchOptions = document.getElementById("mb-search-close-options");
    var dropdown = document.getElementById("mb-search-dropdown");
    var searchInput = document.getElementById("mb-search-options");

    const onFocus = () => {
      var inputLength = searchInput.value.length;
      if (inputLength > 0) {
        dropdown.classList.add("show");
        // searchOptions.classList.remove("d-none");
      } else {
        dropdown.classList.remove("show");
        // searchOptions.classList.add("d-none");
      }
    };

    searchInput.addEventListener("focus", onFocus);
    searchInput.addEventListener("change", onFocus);

    searchInput.addEventListener("keyup", function () {
      var inputLength = searchInput.value.length;
      if (inputLength > 0) {
        dropdown.classList.add("show");
        // searchOptions.classList.remove("d-none");
      } else {
        dropdown.classList.remove("show");
        // searchOptions.classList.add("d-none");
      }
    });

    // searchOptions.addEventListener("click", function () {
    //   searchInput.value = "";
    //   dropdown.classList.remove("show");
    //   searchOptions.classList.add("d-none");
    // });

    document.body.addEventListener("click", function (e) {
      if (e.target.getAttribute("id") !== "mb-search-options") {
        dropdown.classList.remove("show");
        // searchOptions.classList.add("d-none");
      }
    });

    return () => {
      searchInput.removeEventListener("focus", onFocus);
      searchInput.removeEventListener("change", onFocus);
    };
  }, []);

  const toogleMenuBtn = () => {
    var windowSize = document.documentElement.clientWidth;
    if (windowSize > 767)
      document.querySelector(".hamburger-icon").classList.toggle("open");

    //For collapse vertical menu
    if (document.documentElement.getAttribute("data-layout") === "vertical") {
      if (windowSize < 1025 && windowSize > 767) {
        document.body.classList.remove("vertical-sidebar-enable");
        document.documentElement.getAttribute("data-sidebar-size") === "lg"
          ? document.documentElement.setAttribute(
              "data-sidebar-size",
              "sm-hover"
            )
          : document.documentElement.setAttribute("data-sidebar-size", "lg");
      } else if (windowSize > 1025) {
        document.body.classList.remove("vertical-sidebar-enable");
        document.documentElement.getAttribute("data-sidebar-size") === "lg"
          ? document.documentElement.setAttribute(
              "data-sidebar-size",
              "sm-hover"
            )
          : document.documentElement.setAttribute("data-sidebar-size", "lg");
      }
      if (windowSize <= 1300) {
        document.body.classList.add("vertical-sidebar-enable");
        document.documentElement.setAttribute("data-sidebar-size", "lg");
      }
    }
  };

  useEffect(() => {
    dispatch(fetchCenters({centerIds: user?.centerAccess}));
  }, [dispatch, user]);

  useEffect(() => {
    // Require at least 2 characters: a single-letter query matches almost
    // every patient and is never a useful search.
    if (!noPatientSearch && debouncedValue.length >= 2)
      dispatch(searchPatient({ name: debouncedValue, centerAccess }));
  }, [debouncedValue, dispatch, centerAccess, noPatientSearch]);

  return (
    <React.Fragment>
      <header id="page-topbar" className={headerClass}>
        <div className="layout-width">
          <div className="navbar-header">
            <div className="d-flex">
              <div className="navbar-brand-box horizontal-logo">
                <Link to="/" className="logo logo-dark">
                  <span className="logo-sm">
                    <img src={logoSm} alt="" height="22" />
                  </span>
                  <span className="logo-lg">
                    <img src={logoDark} alt="" height="17" />
                  </span>
                </Link>

                <Link to="/" className="logo logo-light">
                  <span className="logo-sm">
                    <img src={logoSm} alt="" height="22" />
                  </span>
                  <span className="logo-lg">
                    <img src={logoLight} alt="" height="17" />
                  </span>
                </Link>
              </div>

              <button
                onClick={toogleMenuBtn}
                type="button"
                className="btn btn-sm px-3 fs-16 header-item vertical-menu-btn topnav-hamburger"
                id="topnav-hamburger-icon"
              >
                <span className="hamburger-icon">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </button>

              {!noPatientSearch && <SearchOption />}
            </div>

            <div className="d-flex align-items-center">
              <Dropdown
                isOpen={search}
                toggle={toogleSearch}
                // Hidden, not removed, for a Visiting Consultant: the effect
                // above looks up #mb-search-options on mount.
                className={`${noPatientSearch ? "d-none" : "d-md-none"} topbar-head-dropdown header-item`}
              >
                <DropdownToggle
                  type="button"
                  tag="button"
                  className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle"
                >
                  <i className="bx bx-search text-white fs-22"></i>
                </DropdownToggle>
                <DropdownMenu className="dropdown-menu-lg dropdown-menu-end p-0">
                  <Form className="p-3 position-relative">
                    <div className="form-group m-0">
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search ..."
                          id="mb-search-options"
                          value={value}
                          onChange={onChangeData}
                          aria-label="Patient's username"
                        />
                        <button className="btn btn-primary" type="button">
                          <i className="mdi mdi-magnify"></i>
                        </button>
                      </div>

                      <div
                        ref={searchRef}
                        className="dropdown-menu dropdown-menu-lg mb-patient-dropdown"
                        id="mb-search-dropdown"
                      >
                        <SimpleBar style={{ height: "200px" }}>
                          <div className="dropdown-header mt-2">
                            <h6 className="text-overflow text-muted mb-1 text-uppercase">
                              Patients
                            </h6>
                          </div>

                          <RenderWhen isTrue={loading}>
                            <PatientPlaceholder />
                          </RenderWhen>

                          <RenderWhen isTrue={!loading}>
                            {(patients || []).map((pt) => (
                              <Link
                                key={pt._id}
                                to={`/patient/${pt._id}`}
                                onClick={() => {
                                  var windowSize =
                                    document.documentElement.clientWidth;
                                  const dataList =
                                    document.querySelector(
                                      ".chat-message-list"
                                    );
                                  var dropdown =
                                    document.getElementById(
                                      "mb-search-dropdown"
                                    );
                                  dropdown.classList.remove("show");

                                  if (windowSize < 992) {
                                    if (
                                      dataList.classList.contains(
                                        "show-chat-message-list"
                                      )
                                    ) {
                                      dataList.classList.remove(
                                        "show-chat-message-list"
                                      );
                                    }
                                  }
                                  dispatch(viewPatient(pt));
                                }}
                                className="dropdown-item notify-item"
                              >
                                <i className="ri-bubble-chart-line align-middle fs-18 text-muted me-2"></i>
                                <Highlighter
                                  // highlightClassName="bg-warning"
                                  searchWords={[value]}
                                  autoEscape={true}
                                  textToHighlight={pt?.name}
                                />
                                {/* <span>{pt.name}</span> */}
                              </Link>
                            ))}
                          </RenderWhen>
                        </SimpleBar>
                      </div>
                    </div>
                  </Form>
                </DropdownMenu>
              </Dropdown>
              <RenderWhen isTrue={globalLoader || dataLoader}>
                <div
                  className="spinner-border spinner-border-sm text-light"
                  role="status"
                  style={{ width: "1rem", height: "1rem" }}
                >
                  <span className="visually-hidden">Loading...</span>
                </div>
              </RenderWhen>
              {/* WebAppsDropdown */}
              <WebAppsDropdown />

              {/* FullScreenDropdown */}
              <FullScreenDropdown />

              {/* Dark/Light Mode set */}
              {/* <LightDark
                layoutMode={layoutModeType}
                onChangeLayoutMode={onChangeLayoutMode}
              /> */}

              {/* NotificationDropdown */}
              <NotificationDropdown />

              {/* ProfileDropdown */}
              <ProfileDropdown />
            </div>
          </div>
        </div>
      </header>
    </React.Fragment>
  );
};

Header.prototype = {
  loading: PropTypes.bool,
  patients: PropTypes.array,
  centerAccess: PropTypes.array,
  user: PropTypes.object,
};

const mapStateToProps = (state) => ({
  loading: state.Patient.searchLoading,
  patients: state.Patient.searchedPatients,
  centers: state.Center.data,
  centerAccess: state.User?.centerAccess,
  user: state.User.user,
});

export default connect(mapStateToProps)(Header);
