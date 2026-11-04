import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { Button, UncontrolledTooltip } from "reactstrap";
import PerfectScrollbar from "react-perfect-scrollbar";
import "react-perfect-scrollbar/dist/css/styles.css";
import Tabs from "./Tabs";
import { connect, useDispatch } from "react-redux";
import {
  fetchMorePatients,
  setTotalAmount,
  togglePatientForm,
} from "../../../store/actions";
import RenderWhen from "../../../Components/Common/RenderWhen";
import { useInView } from "react-hook-inview";
import CheckPermission from "../../../Components/HOC/CheckPermission";
import { setTestPageOpen } from "../../../store/features/clinicalTest/clinicalTestSlice";
import { format } from "date-fns";
import { ADMIT_PATIENTS } from "../../../Components/constants/patient";
import { BILL_PAID, BILLING_CYCLE_MISSED, INVOICE_CREATED, NEXT_BILLING_PENDING, NO_BILLING } from "../../../Components/constants/bill";

const Sidebar = ({
  patients,
  patient,
  customActiveTab,
  toggleCustom,
  myPatientsOnly,
  centerAccess,
  gender,
  setGender,
  staff,
  setStaff,
  loading,
}) => {
  const dispatch = useDispatch();
  const staffId = customActiveTab === ADMIT_PATIENTS ? staff?.value : undefined;
  const [loadMoreRef, isVisible] = useInView({
    defaultInView: false,
  });

  // Remembers which filter and which page we last asked for. There is no page
  // state for this list — `skip` is derived from patients.length — so this ref is
  // what keeps the two failure modes below from happening.
  const lastRequestRef = useRef({ key: null, skip: -1 });

  useEffect(() => {
    const key = `${customActiveTab}|${gender ?? ""}|${staffId ?? ""}`;
    const skip = patients.length ?? 0;

    // The filter just changed. Child effects run before the parent's, so at this
    // point Patient/index.js has not dispatched the replacing fetch yet and
    // patients.length still describes the PREVIOUS filter — firing here would
    // append a page from the wrong result set. Record the new filter and wait for
    // the replaced list to arrive.
    if (lastRequestRef.current.key !== key) {
      lastRequestRef.current = { key, skip: -1 };
      return;
    }

    if (!isVisible || loading) return;

    // Don't re-request a page we already asked for. At the end of the list the
    // server returns nothing, patients.length stops growing, and without this
    // the effect would loop on the same skip forever.
    if (lastRequestRef.current.skip === skip) return;

    lastRequestRef.current = { key, skip };
    dispatch(
      fetchMorePatients({
        type: customActiveTab,
        centerAccess,
        gender,
        staffId,
        skip,
      })
    );
  }, [
    dispatch,
    centerAccess,
    customActiveTab,
    gender,
    staffId,
    isVisible,
    loading,
    patients.length,
  ]);

  const generateBillingStatusColor = (billingStatus) => {
    if (billingStatus === BILLING_CYCLE_MISSED) return 'danger';
    else if (billingStatus === NEXT_BILLING_PENDING) return 'warning';
    else if (billingStatus === INVOICE_CREATED) return 'info';
    else if (billingStatus === BILL_PAID) return 'success';
    else if (billingStatus === NO_BILLING) return '';
  }

  useEffect(() => {
    toggleDataSidebar();
  }, []);

  const toggleDataSidebar = () => {
    var windowSize = document.documentElement.clientWidth;
    const dataList = document.querySelector(".chat-message-list");

    if (windowSize < 992) {
      if (dataList.classList.contains("show-chat-message-list")) {
        dataList.classList.remove("show-chat-message-list");
      } else dataList.classList.add("show-chat-message-list");
    }
  };

  return (
    <div>
      <div className="chat-leftsidebar">
        <div className="px-4 pt-4 mb-1">
          <div className="d-flex align-items-start">
            <div className="flex-grow-1">
              <h5 className="mb-4">Patients</h5>
            </div>
            <div className="flex-shrink-0">
              <CheckPermission permission={"create"}>
                <UncontrolledTooltip placement="bottom" target="addcontact">
                  Add Patient
                </UncontrolledTooltip>

                <Button
                  onClick={() =>
                    dispatch(togglePatientForm({ data: null, isOpen: true }))
                  }
                  color=""
                  id="addcontact"
                  className="btn btn-soft-success btn-sm"
                >
                  <i className="ri-add-line align-bottom"></i>
                </Button>
              </CheckPermission>
              <button
                onClick={toggleDataSidebar}
                type="button"
                className="btn btn-sm px-3 fs-16 data-sidebar-button topnav-hamburger"
                id="topnav-hamburger-icon"
              >
                <span className="hamburger-icon">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </button>
            </div>
          </div>
          <div className="search-box">
            <Tabs
              customActiveTab={customActiveTab}
              toggleCustom={toggleCustom}
              myPatientsOnly={myPatientsOnly}
              gender={gender}
              setGender={setGender}
              staff={staff}
              setStaff={setStaff}
              centerAccess={centerAccess}
            />
          </div>
        </div>

        <PerfectScrollbar className="chat-room-list">
          <div className="chat-message-list">
            <ul
              className="list-unstyled chat-list chat-user-list users-list"
              id="userList"
            >
              {(patients || []).map((pt, idx) => (
                <li
                  key={pt._id}
                  className={patient?._id === pt._id ? "active" : ""}
                >
                  <Link
                    onClick={() => {
                      dispatch(
                        setTotalAmount({
                          totalPayable: 0,
                          totalAdvance: 0,
                        })
                      );
                      dispatch(setTestPageOpen(false));
                      toggleDataSidebar();
                    }}
                    to={`/patient/${pt?._id}`}
                  >
                    <div className="d-flex align-items-center">
                      <div
                        className={
                          patient?._id === pt._id
                            ? "flex-shrink-0 chat-user-img online align-self-center me-2 ms-0"
                            : "flex-shrink-0 chat-user-img align-self-center me-2 ms-0"
                        }
                      >
                        <div className="avatar-xxs">
                          {pt?.profilePicture ? (
                            <img
                              src={pt?.profilePicture.url}
                              className="rounded-circle img-fluid avatar-xxs userprofile"
                              alt=""
                            />
                          ) : (
                            <div
                              className={
                                "avatar-title rounded-circle bg-success userprofile"
                              }
                            >
                              {pt.name?.slice(0, 1)}
                            </div>
                          )}
                        </div>
                        <span className="user-status"></span>
                      </div>
                      <div className="flex-grow-1 overflow-hidden">
                        <p className="text-truncate text-capitalize font-semi-bold fs-13 mb-0">
                          {pt.name || ""}
                        </p>
                        <RenderWhen isTrue={pt.isAdmit && pt.addmission?.addmissionDate}>
                          <p className="text-muted mb-0" style={{ fontSize: "10px" }}>
                            {pt.addmission?.addmissionDate
                              ? format(new Date(pt.addmission.addmissionDate), "dd MMM yyyy")
                              : ""}
                          </p>
                        </RenderWhen>
                      </div>
                      <div className="flex-shrink-0 d-flex align-items-center">
                        <RenderWhen isTrue={!pt.isAdmit && !pt.isDischarge}>
                          <span
                            id="opd-patient"
                            className="badge badge-soft-dark text-primary me-3 fs-7"
                          >
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
                          <UncontrolledTooltip target="opd-patient">
                            OPD Patient
                          </UncontrolledTooltip>
                        </RenderWhen>
                        <RenderWhen isTrue={pt.isDischarge}>
                          <span
                            id="discharge-patient"
                            className="badge badge-soft-dark text-primary me-3"
                          >
                            <i className="ri-user-follow-fill fs-6"></i>
                          </span>
                          <UncontrolledTooltip target="discharge-patient">
                            Discharge Patient
                          </UncontrolledTooltip>
                        </RenderWhen>
                        <RenderWhen isTrue={pt.isAdmit}>
                          <span
                            id="admit-patient"
                            className="badge badge-soft-dark text-primary me-1"
                          >
                            <i className="ri-user-location-fill fs-6"></i>
                          </span>
                          <UncontrolledTooltip target="admit-patient">
                            Admit Patient
                          </UncontrolledTooltip>
                        </RenderWhen>
                        <span
                          id="patient-center"
                          className="badge badge-soft-dark rounded p-1"
                        >
                          {pt.center?.title || ""}
                        </span>
                        <UncontrolledTooltip target="patient-center">
                          Patient Center
                        </UncontrolledTooltip>
                        <RenderWhen isTrue={pt.isAdmit}>
                          <span id={`billing-cycle-${pt?._id}`} className="badge badge-soft-dark mx-1">
                            <span
                              className={`bg-${generateBillingStatusColor(pt?.billingStatus)} d-inline-block rounded-circle`}
                              style={{ width: "10px", height: "10px", verticalAlign: "middle" }}
                            ></span>
                          </span>
                          <UncontrolledTooltip target={`billing-cycle-${pt?._id}`}>
                            {pt?.billingStatus}
                          </UncontrolledTooltip>
                        </RenderWhen>

                      </div>
                    </div>
                  </Link>
                </li>
              ))}
              <RenderWhen isTrue={patients.length >= 20}>
                <li ref={loadMoreRef} className="p-2 bg-dar"></li>
              </RenderWhen>
            </ul>
          </div>
        </PerfectScrollbar>
      </div>
    </div>
  );
};

Sidebar.propTypes = {
  patients: PropTypes.array,
  patient: PropTypes.object,
  centerAccess: PropTypes.array.isRequired,
  myPatientsOnly: PropTypes.bool,
  gender: PropTypes.string,
  setGender: PropTypes.func,
  staff: PropTypes.object,
  setStaff: PropTypes.func,
  loading: PropTypes.bool,
};

const mapStateToProps = (state) => ({
  patients: state.Patient.data,
  patient: state.Patient.patient,
  centerAccess: state.User?.centerAccess,
  user: state.User.user,
  // Shared flag: true while either the replacing fetch or a load-more page is in
  // flight. Used to hold off the load-more effect until the list has settled.
  loading: state.Patient.loading,
});

export default connect(mapStateToProps)(Sidebar);
