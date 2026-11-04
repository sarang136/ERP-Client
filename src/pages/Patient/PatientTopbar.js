import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Col,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Input,
  Row,
  UncontrolledTooltip,
  Modal,
  ModalBody,
  ModalHeader,
  Form,
  Label,
  Button,
  // Spinner,
} from "reactstrap";
import { Link } from "react-router-dom";
import Select from "react-select";
import { toast } from "react-toastify";
import moment from "moment";

//redux
import { connect, useDispatch } from "react-redux";
import {
  admitDischargePatient,
  switchCenter,
  togglePatientForm,
  viewProfile,
  fetchDoctors,
  editAdmissionAssignment,
  fetchFinalDiagnosis,
  fetchAdditionalDiagnosis,
} from "../../store/actions";

//assets
import userDummayImage from "../../assets/images/users/user-dummy-img.jpg";
import { DISCHARGE_PATIENT } from "../../Components/constants/patient";
import PreviewFile from "../../Components/Common/PreviewFile";
import CheckPermission from "../../Components/HOC/CheckPermission";
import AddNoteModal from "../Nurse/Views/Components/AddNoteModal";
import AssignNurseModal from "./Views/Components/AssignNurseModal";
import {
  getCurrentAdmissionType,
  admissionTypeLabel,
  getAdmissionTypeDetailParts,
} from "../../utils/admissionType";
// import { getAdditionalDetails } from "../../helpers/backend_helper";
// import RenderWhen from "../../Components/Common/RenderWhen";

// "NA" on Nurse / RMO / MSW / Visiting Consultant: nobody assigned. Saving it unassigns the current
// person; the server stores the field as null.
const STAFF_NA_OPTION = { value: "NA", label: "NA" };

const PatientTopbar = ({
  patient,
  user,
  admissions,
  doctors,
  psychologists,
  nurses,
  rmos,
  msws,
  visitingConsultants,
  deletePatient,
  loading,
  nurseLoading,
  setDeletePatient,
  assignedNurse,
  finalDiagnosis,
  finalDiagnosisLoading,
}) => {
  const dispatch = useDispatch();

  const [search_Menu, setsearch_Menu] = useState(false);
  const [settings_Menu, setsettings_Menu] = useState(false);
  const [isInfoDetails, setIsInfoDetails] = useState(false);
  const [viewPicture, setViewPicture] = useState();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedPsychologist, setSelectedPsychologist] = useState(null);
  const [selectedNurse, setSelectedNurse] = useState(null);
  const [selectedRmo, setSelectedRmo] = useState(null);
  const [selectedMsw, setSelectedMsw] = useState(null);
  const [selectedVisitingConsultant, setSelectedVisitingConsultant] =
    useState(null);
  const [notesModal, setNotesModal] = useState(false);
  const [nurseModal, setNurseModal] = useState(false);
  // const [additionalDiagnosis, setAdditionalDiagnosis] = useState(null);
  // const [additionalDiagnosisLoading, setAdditionalDiagnosisLoading] =
  //   useState(false);
  // const [finalDiagnosisText, setFinalDiagnosisText] = useState("");

  const admission = admissions.find(
    (admission) => admission._id === patient.addmission._id,
  );

  useEffect(() => {
    if (admission?.center?._id) {
      dispatch(fetchDoctors({ center: admission.center?._id }));
    }
  }, [dispatch, admission?.center?._id]);

  // Current (active) admission id — always present on the patient object,
  // independent of whether the charts tab has been opened.
  const currentAdmissionId = patient?.addmission?._id;

  useEffect(() => {
    if (currentAdmissionId && patient?._id) {
      dispatch(fetchFinalDiagnosis(currentAdmissionId));
      dispatch(
        fetchAdditionalDiagnosis({
          patient: patient?._id,
          admission: currentAdmissionId,
        }),
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, currentAdmissionId]);

  // getFinalDiagnosis already walks the chart timeline (most recent first)
  // and resolves to whichever chart's additional-details entry or raw
  // diagnosis should currently be shown — nothing left to derive here.
  const finalDiagnosisText = finalDiagnosis?.code || "N/A";

  const isFinalDiagnosisReady = !finalDiagnosisLoading;

  // Admission type + its branch detail, e.g. "Supportive Admission · Upto 30
  // days". Read straight off `patient.addmission` — unlike the final diagnosis
  // there is nothing to fetch, so this needs no loading state. Same source the
  // ADMISSION TYPE card below the topbar reads.
  // A Geriatric patient (Patient Type on the admission card) shows as
  // "Admission Type: Geriatric" in place of the admission type — by decision,
  // and the same in the ADMISSION TYPE card.
  const currentAdmissionType = getCurrentAdmissionType(patient?.addmission);
  const isGeriatric = patient?.addmission?.patientAdmissionType === "geriatric";
  const admissionTypeText = isGeriatric
    ? "Geriatric"
    : currentAdmissionType
    ? [
        admissionTypeLabel(
          "admissionType",
          currentAdmissionType.data?.admissionType,
        ),
        ...getAdmissionTypeDetailParts(currentAdmissionType.data),
      ]
        .filter(Boolean)
        .join(" · ") || "N/A"
    : "N/A";

  const handleEditClick = () => {
    if (admission?.doctor) {
      setSelectedDoctor({
        value: admission.doctor._id || "",
        label: admission.doctor.name || "",
      });
    }
    if (admission?.psychologist) {
      setSelectedPsychologist({
        value: admission.psychologist._id || "",
        label: admission.psychologist.name || "",
      });
    }
    // Unlike doctor/psychologist, nurse, RMO, MSW and visiting consultant can be empty — that shows as
    // NA, and is always reset so a previous patient's selection never carries
    // over into this modal.
    setSelectedNurse(
      admission?.nurse
        ? { value: admission.nurse._id || "", label: admission.nurse.name || "" }
        : STAFF_NA_OPTION,
    );
    setSelectedRmo(
      admission?.rmo
        ? { value: admission.rmo._id || "", label: admission.rmo.name || "" }
        : STAFF_NA_OPTION,
    );
    setSelectedMsw(
      admission?.msw
        ? { value: admission.msw._id || "", label: admission.msw.name || "" }
        : STAFF_NA_OPTION,
    );
    setSelectedVisitingConsultant(
      admission?.visitingConsultant
        ? {
            value: admission.visitingConsultant._id || "",
            label: admission.visitingConsultant.name || "",
          }
        : STAFF_NA_OPTION,
    );
    setIsEditModalOpen(true);
  };

  const hasAnySelection =
    selectedDoctor ||
    selectedPsychologist ||
    selectedNurse ||
    selectedRmo ||
    selectedMsw ||
    selectedVisitingConsultant;

  const handleSave = async () => {
    if (!hasAnySelection) {
      toast.error("Please select at least one assignment");
      return;
    }

    dispatch(
      editAdmissionAssignment({
        patientId: patient?._id,
        admissionId: admission?._id,
        doctorId: selectedDoctor?.value,
        psychologistId: selectedPsychologist?.value,
        nurseId: selectedNurse?.value,
        rmoId: selectedRmo?.value,
        mswId: selectedMsw?.value,
        visitingConsultantId: selectedVisitingConsultant?.value,
      }),
    );
  };

  //Toggle Chat Box Menus
  const toggleSearch = () => {
    setsearch_Menu(!search_Menu);
  };

  //Info details offcanvas
  const toggleInfo = () => {
    setIsInfoDetails(!isInfoDetails);
  };

  const toggleSettings = () => {
    setsettings_Menu(!settings_Menu);
  };


  return (
    <React.Fragment>
      <div className="position-relative w-100">
        <div className="p-0 p-md-3 user-chat-topbar">
          <Row className="align-items-center">
            <Col sm={4} xs={12}>
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0 d-block d-lg-none me-3">
                  <Link to="#" className="user-chat-remove fs-18 p-1">
                    <i className="ri-arrow-left-s-line align-bottom"></i>
                  </Link>
                </div>
                <div className="flex-grow-1 overflow-hidden">
                  <div className="d-flex align-items-center">
                    <div className="flex-shrink-0 chat-user-img online user-own-img align-self-center me-3 ms-0">
                      <PreviewFile
                        title="Patient Profile Picture"
                        file={viewPicture}
                        isOpen={Boolean(viewPicture)}
                        toggle={() => setViewPicture(null)}
                      />
                      <img
                        onClick={() =>
                          setViewPicture(patient.profilePicture || null)
                        }
                        src={
                          patient?.profilePicture?.url
                            ? patient.profilePicture.url
                            : userDummayImage
                        }
                        className="rounded-circle avatar-xs"
                        alt="Patient"
                      />
                      <span className="user-status"></span>
                    </div>
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                      <h5 className="mb-0 fs-16 text-wrap">
                        <a
                          className="text-reset text-capitalize username d-block"
                          data-bs-toggle="offcanvas"
                          href="#profile"
                          aria-controls="userProfileCanvasExample"
                          onClick={() =>
                            dispatch(
                              viewProfile({ data: patient, isOpen: true }),
                            )
                          }
                        >
                          <span className="d-block d-md-inline">
                            {patient?.name}
                          </span>
                          <span className="d-block d-md-inline ms-md-2 text-muted fs-14">
                            ({`${patient?.id?.prefix}${patient?.id?.value}`})
                          </span>
                        </a>
                      </h5>
                      {currentAdmissionId && (
                        <p
                          className="text-muted fs-13 mb-0 mt-1"
                          title={
                            isFinalDiagnosisReady
                              ? finalDiagnosisText
                              : undefined
                          }
                        >
                          <span className="fw-semibold">Final Diagnosis:</span>{" "}
                          {isFinalDiagnosisReady ? (
                            finalDiagnosisText || "N/A"
                          ) : (
                            <span className="placeholder-glow">
                              <span
                                className="placeholder rounded"
                                style={{ width: "140px", maxWidth: "60%" }}
                              ></span>
                            </span>
                          )}
                        </p>
                      )}
                      {currentAdmissionId && (
                        <p
                          className="text-muted fs-13 mb-0 mt-1"
                          title={admissionTypeText}
                        >
                          <span className="fw-semibold">Admission Type:</span>{" "}
                          {admissionTypeText}
                        </p>
                      )}
                      <p className="text-truncate text-muted fs-14 mb-0 userStatus">
                        {/* <small>Online</small> */}
                      </p>
                      {patient?.isOnOutpass && patient?.outpass && (
                        <span
                          className="badge bg-warning text-dark mt-1 d-inline-block text-wrap"
                          style={{ whiteSpace: "normal", maxWidth: "100%" }}
                        >
                          <i className="ri-walk-line me-1"></i>
                          On Outpass:{" "}
                          {moment(patient.outpass.fromDate).format(
                            "DD MMM, YYYY",
                          )}{" "}
                          -{" "}
                          {moment(patient.outpass.toDate).format(
                            "DD MMM, YYYY",
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Col>
            <Col sm={8} xs={12}>
              <ul className="list-inline user-chat-nav text-end mb-0">
                {/* <li
                  id="assign-nurse"
                  className="list-inline-item m-0 d-none d-md-inline me-2"
                >
                  {assignedNurse?.name && (
                    <>
                      <svg
                        version="1.1"
                        id="_x32_"
                        xmlns="http://www.w3.org/2000/svg"
                        xmlnsXlink="http://www.w3.org/1999/xlink"
                        width="30px"
                        height="20px"
                        viewBox="-15.36 -15.36 542.72 542.72"
                        xmlSpace="preserve"
                        fill="#000000"
                        stroke="#000000"
                        stroke-width="24.064"
                      >
                        <g id="SVGRepo_bgCarrier" stroke-width="0" />

                        <g
                          id="SVGRepo_tracerCarrier"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />

                        <g id="SVGRepo_iconCarrier">
                          <g>
                            <path
                              fill="#FFF"
                              class="st0"
                              d="M475.619,295.498l-41.406-87.766c0.109-2.625,0.203-5.266,0.203-7.906 c0-110.359-89.469-199.828-199.828-199.828S34.744,89.467,34.744,199.826c0,62.063,28.297,117.5,72.672,154.156v70.641 c0,6.891,4.125,13.125,10.453,15.797l165.516,70.219c5.281,2.25,11.359,1.688,16.172-1.484c4.797-3.188,7.688-8.563,7.688-14.313 v-59.844c0-9.484,7.688-17.172,17.172-17.172h84.75c9.484,0,17.156-7.703,17.156-17.172v-51.609c0-6.563,3.766-12.563,9.672-15.438 l31.594-15.344C476.041,314.154,479.619,303.998,475.619,295.498z M234.588,335.717c-75.047,0-135.891-60.828-135.891-135.891 c0-75.047,60.844-135.875,135.891-135.875s135.875,60.828,135.875,135.875C370.463,274.889,309.635,335.717,234.588,335.717z"
                            />{" "}
                            <path
                              class="st0"
                              d="M330.432,216.623c3.672-0.281,6.484-3.328,6.484-7.016v-16.766c0-3.688-2.813-6.734-6.484-7.031l-22.234-1.734 c-1.391-0.094-2.625-0.984-3.156-2.297l-7.328-17.656c-0.531-1.297-0.297-2.797,0.609-3.875l14.5-16.953 c2.391-2.781,2.234-6.938-0.375-9.531l-11.859-11.875c-2.609-2.594-6.766-2.75-9.547-0.375l-16.953,14.5 c-1.063,0.906-2.578,1.156-3.859,0.625l-17.656-7.328c-1.313-0.531-2.203-1.766-2.313-3.172l-1.719-22.219 c-0.297-3.688-3.359-6.5-7.031-6.5h-16.781c-3.672,0-6.734,2.813-7.016,6.5l-1.719,22.219c-0.109,1.406-1.016,2.641-2.328,3.172 l-17.641,7.328c-1.313,0.531-2.797,0.281-3.875-0.625l-16.953-14.5c-2.797-2.375-6.953-2.219-9.547,0.375l-11.859,11.875 c-2.594,2.594-2.766,6.75-0.375,9.531l14.5,16.953c0.906,1.078,1.156,2.578,0.609,3.875l-7.313,17.656 c-0.531,1.313-1.781,2.203-3.188,2.297l-22.234,1.734c-3.656,0.297-6.469,3.344-6.469,7.031v16.766 c0,3.688,2.813,6.734,6.469,7.016l22.234,1.734c1.406,0.109,2.656,1,3.188,2.313l7.313,17.656c0.547,1.281,0.297,2.797-0.609,3.859 l-14.5,16.969c-2.391,2.781-2.219,6.938,0.375,9.531l11.859,11.859c2.594,2.609,6.75,2.766,9.547,0.391l16.953-14.516 c1.078-0.891,2.563-1.141,3.875-0.594l17.641,7.313c1.313,0.531,2.219,1.766,2.328,3.156l1.719,22.25 c0.281,3.656,3.344,6.484,7.016,6.484h16.781c3.672,0,6.734-2.828,7.031-6.484l1.719-22.25c0.109-1.391,1-2.625,2.313-3.156 l17.656-7.313c1.281-0.547,2.797-0.297,3.859,0.594l16.953,14.516c2.781,2.375,6.938,2.219,9.547-0.391l11.859-11.859 c2.609-2.594,2.766-6.75,0.375-9.531l-14.5-16.969c-0.906-1.063-1.141-2.578-0.609-3.859l7.328-17.656 c0.531-1.313,1.766-2.203,3.156-2.313L330.432,216.623z M233.119,236.311c-9.375,0-18.188-3.656-24.813-10.281 s-10.266-15.438-10.266-24.797c0-9.375,3.641-18.188,10.266-24.813c6.625-6.641,15.438-10.281,24.813-10.281 s18.188,3.641,24.813,10.281c6.625,6.625,10.266,15.438,10.266,24.813c0,9.359-3.641,18.172-10.266,24.797 S242.494,236.311,233.119,236.311z"
                            />{" "}
                          </g>{" "}
                        </g>
                      </svg>
                      <span>{assignedNurse?.name}</span>
                    </>
                  )}
                  <UncontrolledTooltip target={"assign-nurse"}>
                    Assigned Nurse
                  </UncontrolledTooltip>
                </li> */}
                {/* <CheckPermission allowedRoles={["ADMIN","MANAGER"]} userRole={user?.role}>
                 <li
                  id="assign/unassign-nurse"
                  className="list-inline-item m-0 d-none d-md-inline me-2"
                >
                  {assignedNurse?.name ? (
                    <Button
                      size="sm"
                      color="danger"
                      className="text-white"
                      onClick={handleUnAssignNurse}
                    >
                      <RenderWhen isTrue={nurseLoading}>
                        <Spinner size="sm" className="me-2" />
                      </RenderWhen>
                      <span>Unassign Nurse</span>
                    </Button>
                  ) : (
                    <Button
                      color="primary"
                      size="sm"
                      className="text-white"
                      onClick={() => setNurseModal(true)}
                    >
                      Assign Nurse
                    </Button>
                  )}
                </li>
             </CheckPermission> */}
                {/* <li
                  id="add-note"
                  className="list-inline-item m-0 d-none d-md-inline me-2"
                >
                  <Button
                    color="primary"
                    size="sm"
                    onClick={() => setNotesModal(true)}
                  >
                    Add Note
                  </Button>
                </li> */}
                <li
                  id="patient-doctor"
                  className="list-inline-item m-0 d-none d-md-inline"
                  onClick={handleEditClick}
                  style={{ cursor: "pointer" }}
                >
                  <svg
                    version="1.1"
                    id="_x32_"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                    width="20px"
                    height="20px"
                    viewBox="0 0 512 512"
                    xmlSpace="preserve"
                  >
                    <style type="text/css"></style>
                    <g>
                      <path
                        class="st0"
                        d="M110.547,411.844c-5.234,5.813-9.141,12.5-11.328,19.266c-1.531,4.766-2.266,9.469-2.266,13.875
		c0,2.688,0.266,5.25,0.844,7.672c0.438,1.797,1.031,3.516,1.828,5.094c0.594,1.203,1.313,2.344,2.156,3.375
		c1.266,1.531,2.828,2.859,4.688,3.781c1.844,0.938,3.969,1.438,6.125,1.422v-9.766c-0.453,0-0.797-0.063-1.125-0.156
		c-0.578-0.156-1.047-0.422-1.578-0.891c-0.375-0.359-0.781-0.828-1.156-1.469c-0.563-0.922-1.094-2.203-1.453-3.734
		c-0.359-1.547-0.563-3.344-0.563-5.328c0-3.297,0.578-7.047,1.797-10.891c1.141-3.531,2.953-7.188,5.328-10.656
		c3.547-5.219,8.391-9.984,13.984-13.391c2.781-1.703,5.781-3.078,8.891-4.016c3.125-0.938,6.391-1.438,9.766-1.438
		c4.5,0,8.813,0.906,12.844,2.531c6.031,2.406,11.484,6.453,15.844,11.281c4.344,4.813,7.578,10.406,9.266,15.688
		c1.234,3.844,1.813,7.594,1.813,10.891c0,2.016-0.219,3.844-0.594,5.391c-0.266,1.156-0.641,2.188-1.047,3
		c-0.313,0.625-0.641,1.125-0.984,1.547c-0.5,0.609-1,1-1.484,1.25c-0.5,0.234-1.016,0.375-1.766,0.391v9.766
		c1.281,0.016,2.547-0.172,3.75-0.5c2.109-0.578,4-1.672,5.547-3.094c1.156-1.063,2.125-2.281,2.922-3.609
		c1.219-2,2.063-4.219,2.609-6.594s0.813-4.906,0.813-7.547c0-4.406-0.734-9.125-2.266-13.875
		c-1.453-4.516-3.672-8.984-6.547-13.188c-4.313-6.297-10.063-12.016-16.969-16.234c-3.453-2.094-7.188-3.813-11.172-5
		c-3.984-1.219-8.203-1.875-12.578-1.875c-5.828,0-11.391,1.188-16.469,3.234C122.375,401.109,115.781,406.047,110.547,411.844z"
                      />
                      <path
                        class="st0"
                        d="M165.594,452.109c-1.594,1.266-2.531,3.172-2.531,5.219v7.891c0,2.031,0.938,3.953,2.531,5.219
		c1.594,1.25,3.688,1.719,5.656,1.25l5.266-1.25v-18.344l-5.266-1.25C169.281,450.375,167.188,450.844,165.594,452.109z"
                      />
                      <path
                        class="st0"
                        d="M121.719,450.844l-5.281,1.25v18.344l5.281,1.25c1.969,0.469,4.063,0,5.656-1.25
		c1.594-1.266,2.531-3.188,2.531-5.219v-7.891c0-2.047-0.938-3.953-2.531-5.219S123.688,450.375,121.719,450.844z"
                      />
                      <path
                        class="st0"
                        d="M453.453,429.594c-2.016-7.531-4.859-14.281-8.359-20.281c-6.141-10.547-14.266-18.75-23.234-25.25
		c-6.734-4.875-13.922-8.859-21.234-12.281c-10.953-5.125-22.156-9.063-32.5-12.891c-10.344-3.813-19.797-7.547-27.156-11.891
		c-2.688-1.594-5.109-3.25-7.203-4.984c-3.125-2.609-5.563-5.391-7.328-8.5s-2.953-6.609-3.406-10.984
		c-0.328-3.125-0.469-6.063-0.469-8.875c0-8.281,1.219-15.453,2.781-22.781c4.625-5.219,8.859-11.438,12.859-18.875
		c4.016-7.484,7.828-16.219,11.625-26.563c2.438-1.109,4.891-2.438,7.281-4.063c5.469-3.656,10.656-8.781,14.984-15.609
		c4.313-6.828,7.781-15.313,10.156-25.781c0.656-2.906,0.969-5.797,0.969-8.641c0.016-5.938-1.391-11.594-3.75-16.656
		c-1.641-3.516-3.719-6.734-6.141-9.656c1.234-4.563,2.734-10.703,4.078-17.891c1.844-9.984,3.375-21.984,3.375-34.594
		c0-8.141-0.641-16.547-2.297-24.844c-1.234-6.219-3.063-12.391-5.625-18.297c-3.859-8.891-9.469-17.25-17.266-24.156
		c-7.219-6.391-16.266-11.484-27.188-14.75c-3.859-4.625-7.734-8.563-11.703-11.906c-3.438-2.875-6.953-5.297-10.547-7.281
		c-5.406-3-11-4.984-16.734-6.188s-11.578-1.641-17.641-1.641c-8.359,0-17.156,0.828-26.875,1.781
		c-3.672,0.375-6.75,0.828-9.422,1.297c-3.984,0.719-6.969,1.453-9.359,1.938c-1.203,0.234-2.25,0.422-3.281,0.547
		c-1.031,0.109-2.031,0.188-3.172,0.188c-1.531,0-3.297-0.125-5.609-0.453c-7.078-1.031-13.547-2.625-18.625-4.188
		c-2.531-0.766-4.719-1.531-6.438-2.188c-0.859-0.328-1.609-0.625-2.203-0.875c-0.609-0.25-1.063-0.484-1.328-0.609l0.016,0.016
		c-0.781-0.406-1.531-0.625-2.203-0.75C182.609,0.031,182.016,0,181.5,0c-1.078,0-1.844,0.156-2.453,0.313s-1.078,0.344-1.5,0.516
		c-0.813,0.328-1.438,0.672-2.063,1.047c-1.141,0.688-2.234,1.453-3.391,2.344c-2.016,1.563-4.234,3.5-6.594,5.781
		c-3.531,3.406-7.313,7.531-10.75,12.031c-1.719,2.234-3.328,4.578-4.781,7s-2.734,4.906-3.75,7.516
		c-4.969,12.922-8.25,24.828-10.281,35.813c-2.047,10.984-2.828,21.047-2.828,30.281c0,15.109,2.109,27.922,4.141,38.75
		c0,0.516,0.016,1,0.047,1.516c0.063,1.016,0.172,2.063,0.281,3.156c0.172,1.625,0.359,3.297,0.5,4.703
		c0.078,0.703,0.141,1.328,0.188,1.813c0.016,0.234,0.031,0.453,0.031,0.609l0.016,0.156v0.047v0.016v0.922l1.984,8.828
		c-2.859,3.125-5.328,6.625-7.25,10.469c-2.688,5.344-4.281,11.375-4.281,17.75c0,2.813,0.328,5.719,0.984,8.609
		c1.563,6.984,3.641,13.078,6.125,18.391c3.719,7.984,8.438,14.188,13.656,18.844c4.047,3.625,8.375,6.266,12.656,8.219
		c3.781,10.344,7.594,19.063,11.609,26.547c4,7.453,8.219,13.656,12.844,18.875c1.563,7.328,2.781,14.516,2.797,22.797
		c0,2.813-0.156,5.75-0.484,8.875c-0.313,3-0.969,5.594-1.922,7.938c-1.422,3.5-3.5,6.484-6.328,9.313
		c-2.828,2.781-6.438,5.391-10.703,7.813c-4.328,2.453-9.344,4.75-14.797,6.938c-9.563,3.875-20.469,7.531-31.516,11.953
		c-8.281,3.297-16.672,7.063-24.672,11.766c-6,3.531-11.766,7.625-17.078,12.484c-7.953,7.281-14.813,16.359-19.547,27.578
		c-4.75,11.234-7.391,24.531-7.375,40.25c0,2.219,0.469,4.328,1.234,6.281c0.703,1.828,1.688,3.5,2.844,5.094
		c2.188,2.969,5,5.625,8.453,8.188c6.063,4.469,14.109,8.656,24.531,12.594c15.625,5.891,36.563,11.188,63.641,15.031
		c27.063,3.844,60.266,6.25,100.266,6.25c34.703,0,64.266-1.797,89.156-4.781c18.656-2.25,34.703-5.156,48.313-8.484
		c10.219-2.484,19.078-5.219,26.672-8.094c5.688-2.156,10.688-4.406,15.031-6.719c3.25-1.734,6.125-3.516,8.672-5.344
		c3.813-2.766,6.875-5.609,9.203-8.844c1.172-1.609,2.125-3.328,2.828-5.203c0.703-1.844,1.125-3.875,1.125-5.969
		C456.984,447.813,455.75,438.203,453.453,429.594z M327.266,358.094l-50.156,78.328l-5.594-38.453l14.234-15.063l-9.219-15.375
		l38.906-20.453c1.078,1.391,2.219,2.703,3.422,3.953C321.438,353.672,324.266,356,327.266,358.094z M183.078,87.156
		c45.219,10.031,133.641-9.141,133.641-9.141s0.953,21.922,16.031,42.047c5.938,7.906,10.828,20.266,14.5,32.016
		c-0.984-1.828-3.297-2.516-6.75-2.953c-7.75-1.047-19.266-1.719-32.234-1.094c-38.531,1.891-35.672,5.391-50.797,5.391
		s-12.266-3.5-50.797-5.391c-12.969-0.625-24.484,0.047-32.25,1.094c-4.031,0.531-6.563,1.344-7.141,4.031
		c-0.203,1-0.516,2.125-1.906,2.672C169.641,139.891,181.516,119.531,183.078,87.156z M339.922,176.469
		c0,0.219-0.156,22.313-15.188,29.859c-5.109,2.578-11.516,4-18.031,4.016c-6.875,0-13.156-1.563-18.172-4.516
		c-5.547-3.25-9.281-8.078-11.109-14.313c-0.438-1.453-0.828-2.906-1.234-4.313c-1.188-4.297-4.391-16.234,2.406-21.484
		c4.375-3.422,17.953-5.578,30.969-5.578c11.828,0,23.891,1.609,27.422,5.297C339.313,167.875,340.219,172.219,339.922,176.469z
		 M238.75,187.203c-0.406,1.406-0.813,2.859-1.234,4.313c-1.828,6.234-5.563,11.063-11.094,14.313
		c-5.031,2.953-11.313,4.516-18.188,4.516c-6.516-0.016-12.906-1.438-18.031-4.016c-15.031-7.547-15.172-29.641-15.188-29.859
		c-0.297-4.25,0.609-8.594,2.922-11.031c3.547-3.688,15.609-5.297,27.438-5.297c13,0,26.594,2.156,30.984,5.578
		C243.141,170.969,239.938,182.906,238.75,187.203z M188.547,264.063c-3.922-7.313-7.828-16.406-11.844-27.75l-1.328-3.703
		l-3.688-1.359c-2.563-0.938-5.063-2.156-7.453-3.766c-3.609-2.422-7.031-5.734-10.172-10.672s-5.953-11.563-7.984-20.516
		c-0.391-1.703-0.547-3.328-0.547-4.922c0-3.594,0.859-7,2.5-10.25c1.344-2.703,3.219-5.25,5.5-7.563
		c3.844,5.813,7.031,10.422,8.188,11.578c2.203,2.203,3.297,0.078,3.469-4.047c1.359,9.172,5.719,24.313,19.797,31.797
		c20.266,10.766,50.516,6.734,60.781-17.234c4.641-10.813,4.703-21.375,11.703-21.375c6.984,0,7.063,10.563,11.703,21.375
		c10.281,23.969,40.531,28,60.797,17.234c20.25-10.766,20.391-37.422,20.391-39.297c0-0.969,0.922-1.703,2.234-1.844
		c1.719,7.234,2.609,12.141,2.609,12.141s1.938-3.703,4.844-8.641c1.734,2.031,3.172,4.219,4.234,6.5
		c1.422,3.063,2.188,6.266,2.188,9.594c0,1.609-0.172,3.25-0.563,4.938c-1.344,5.969-3.047,10.906-4.953,15
		c-2.875,6.125-6.188,10.344-9.656,13.438c-3.453,3.094-7.141,5.109-10.969,6.531l-3.703,1.344l-1.313,3.719
		c-4.016,11.344-7.938,20.453-11.859,27.75c-3.938,7.313-7.844,12.813-11.906,17.094l-1.609,1.703l-0.5,2.266
		c-1.813,8.359-3.625,17.594-3.625,28.531c0,3.375,0.172,6.891,0.547,10.594c0.453,4.344,1.453,8.422,2.938,12.172
		c0.063,0.172,0.156,0.359,0.219,0.516l-50.891,26.766l-56.406-26.172c1.734-4.063,2.906-8.5,3.406-13.281
		c0.391-3.703,0.547-7.219,0.547-10.594c0.016-10.938-1.797-20.188-3.625-28.547l-0.5-2.266l-1.609-1.688
		C196.391,276.844,192.469,271.375,188.547,264.063z M188.094,355.594c2.938-2.359,5.641-5,8.031-7.969l43.016,19.969l-9.188,15.313
		l14.219,15.063l-5.25,36.203l-54.875-75.609C185.438,357.609,186.797,356.625,188.094,355.594z M440.219,458.5
		c-0.016,0.094-0.125,0.406-0.422,0.906c-0.563,0.969-1.875,2.531-4.094,4.313c-1.922,1.547-4.516,3.281-7.781,5.063
		c-5.734,3.141-13.5,6.406-23.344,9.5c-14.781,4.656-34.297,8.906-58.922,12c-24.625,3.063-54.359,4.969-89.672,4.969
		c-34.094,0-63-1.781-87.125-4.672c-18.094-2.172-33.5-4.984-46.344-8.109c-9.656-2.359-17.875-4.906-24.703-7.5
		c-5.141-1.938-9.5-3.906-13.078-5.828c-2.688-1.438-4.953-2.859-6.797-4.172c-2.75-1.969-4.5-3.766-5.375-5
		c-0.438-0.594-0.656-1.063-0.734-1.281c-0.047-0.094-0.063-0.156-0.063-0.188c0-9.375,1.063-17.406,2.906-24.375
		c1.609-6.094,3.828-11.391,6.531-16.078c4.719-8.203,10.922-14.641,18.297-20.063c5.5-4.078,11.672-7.563,18.203-10.672
		c7.328-3.484,15.109-6.484,22.922-9.375v16.875h5.859h5.859v-21.203c7.469-2.797,14.75-5.672,21.531-9.109l86.703,119.453
		l75.75-118.266c0.234,0.359,0.469,0.719,0.688,1.063c3.156,5.078,5.359,10.609,6.828,16.875c1.453,6.25,2.125,13.25,2.125,21.047
		c0,18.063,0,33.797,0,44.391H318.75v11.734h67v-11.734h-27.219c0-10.594,0-26.328,0-44.391c0-11.359-1.297-21.703-4.516-31.141
		c-0.281-0.813-0.578-1.625-0.891-2.422c9.156,3.609,18.734,6.859,28.016,10.547c7.953,3.141,15.672,6.578,22.688,10.656
		c5.281,3.063,10.172,6.5,14.516,10.406c6.516,5.922,11.859,12.906,15.703,21.859C437.875,433.516,440.219,444.516,440.219,458.5
		L440.219,458.5z"
                      />
                    </g>
                  </svg>
                  {admission?.doctor?.name && (
                    <span>{admission?.doctor?.name}</span>
                  )}
                  <UncontrolledTooltip target={"patient-doctor"}>
                    Click to edit Doctor
                  </UncontrolledTooltip>
                </li>

                <li
                  id="patient-psychologist"
                  className="list-inline-item m-0 ms-4 d-none d-md-inline"
                  onClick={handleEditClick}
                  style={{ cursor: "pointer" }}
                >
                  <svg
                    version="1.1"
                    id="_x32_"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                    width="30px"
                    height="20px"
                    viewBox="-15.36 -15.36 542.72 542.72"
                    xmlSpace="preserve"
                    fill="#000000"
                    stroke="#000000"
                    stroke-width="24.064"
                  >
                    <g id="SVGRepo_bgCarrier" stroke-width="0" />

                    <g
                      id="SVGRepo_tracerCarrier"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />

                    <g id="SVGRepo_iconCarrier">
                      <g>
                        <path
                          fill="#FFF"
                          class="st0"
                          d="M475.619,295.498l-41.406-87.766c0.109-2.625,0.203-5.266,0.203-7.906 c0-110.359-89.469-199.828-199.828-199.828S34.744,89.467,34.744,199.826c0,62.063,28.297,117.5,72.672,154.156v70.641 c0,6.891,4.125,13.125,10.453,15.797l165.516,70.219c5.281,2.25,11.359,1.688,16.172-1.484c4.797-3.188,7.688-8.563,7.688-14.313 v-59.844c0-9.484,7.688-17.172,17.172-17.172h84.75c9.484,0,17.156-7.703,17.156-17.172v-51.609c0-6.563,3.766-12.563,9.672-15.438 l31.594-15.344C476.041,314.154,479.619,303.998,475.619,295.498z M234.588,335.717c-75.047,0-135.891-60.828-135.891-135.891 c0-75.047,60.844-135.875,135.891-135.875s135.875,60.828,135.875,135.875C370.463,274.889,309.635,335.717,234.588,335.717z"
                        />{" "}
                        <path
                          class="st0"
                          d="M330.432,216.623c3.672-0.281,6.484-3.328,6.484-7.016v-16.766c0-3.688-2.813-6.734-6.484-7.031l-22.234-1.734 c-1.391-0.094-2.625-0.984-3.156-2.297l-7.328-17.656c-0.531-1.297-0.297-2.797,0.609-3.875l14.5-16.953 c2.391-2.781,2.234-6.938-0.375-9.531l-11.859-11.875c-2.609-2.594-6.766-2.75-9.547-0.375l-16.953,14.5 c-1.063,0.906-2.578,1.156-3.859,0.625l-17.656-7.328c-1.313-0.531-2.203-1.766-2.313-3.172l-1.719-22.219 c-0.297-3.688-3.359-6.5-7.031-6.5h-16.781c-3.672,0-6.734,2.813-7.016,6.5l-1.719,22.219c-0.109,1.406-1.016,2.641-2.328,3.172 l-17.641,7.328c-1.313,0.531-2.797,0.281-3.875-0.625l-16.953-14.5c-2.797-2.375-6.953-2.219-9.547,0.375l-11.859,11.875 c-2.594,2.594-2.766,6.75-0.375,9.531l14.5,16.953c0.906,1.078,1.156,2.578,0.609,3.875l-7.313,17.656 c-0.531,1.313-1.781,2.203-3.188,2.297l-22.234,1.734c-3.656,0.297-6.469,3.344-6.469,7.031v16.766 c0,3.688,2.813,6.734,6.469,7.016l22.234,1.734c1.406,0.109,2.656,1,3.188,2.313l7.313,17.656c0.547,1.281,0.297,2.797-0.609,3.859 l-14.5,16.969c-2.391,2.781-2.219,6.938,0.375,9.531l11.859,11.859c2.594,2.609,6.75,2.766,9.547,0.391l16.953-14.516 c1.078-0.891,2.563-1.141,3.875-0.594l17.641,7.313c1.313,0.531,2.219,1.766,2.328,3.156l1.719,22.25 c0.281,3.656,3.344,6.484,7.016,6.484h16.781c3.672,0,6.734-2.828,7.031-6.484l1.719-22.25c0.109-1.391,1-2.625,2.313-3.156 l17.656-7.313c1.281-0.547,2.797-0.297,3.859,0.594l16.953,14.516c2.781,2.375,6.938,2.219,9.547-0.391l11.859-11.859 c2.609-2.594,2.766-6.75,0.375-9.531l-14.5-16.969c-0.906-1.063-1.141-2.578-0.609-3.859l7.328-17.656 c0.531-1.313,1.766-2.203,3.156-2.313L330.432,216.623z M233.119,236.311c-9.375,0-18.188-3.656-24.813-10.281 s-10.266-15.438-10.266-24.797c0-9.375,3.641-18.188,10.266-24.813c6.625-6.641,15.438-10.281,24.813-10.281 s18.188,3.641,24.813,10.281c6.625,6.625,10.266,15.438,10.266,24.813c0,9.359-3.641,18.172-10.266,24.797 S242.494,236.311,233.119,236.311z"
                        />{" "}
                      </g>{" "}
                    </g>
                  </svg>
                  {admission?.psychologist?.name && (
                    <span>{admission?.psychologist?.name}</span>
                  )}
                  <UncontrolledTooltip target={"patient-psychologist"}>
                    Click to edit Psychologist
                  </UncontrolledTooltip>
                </li>

                <li
                  id="patient-msw"
                  className="list-inline-item m-0 ms-4 d-none d-md-inline"
                  onClick={handleEditClick}
                  style={{ cursor: "pointer" }}
                >
                  <i className="ri-service-line align-middle me-1 fs-18"></i>
                  <span className={admission?.msw?.name ? "" : "text-muted"}>
                    {admission?.msw?.name || "Add MSW"}
                  </span>
                  <UncontrolledTooltip target={"patient-msw"}>
                    Click to edit MSW
                  </UncontrolledTooltip>
                </li>

                <li
                  id="patient-rmo"
                  className="list-inline-item m-0 ms-4 d-none d-md-inline"
                  onClick={handleEditClick}
                  style={{ cursor: "pointer" }}
                >
                  <i className="ri-user-heart-line align-middle me-1 fs-18"></i>
                  <span className={admission?.rmo?.name ? "" : "text-muted"}>
                    {admission?.rmo?.name || "Add RMO"}
                  </span>
                  <UncontrolledTooltip target={"patient-rmo"}>
                    Click to edit RMO
                  </UncontrolledTooltip>
                </li>

                <li
                  id="patient-nurse"
                  className="list-inline-item m-0 ms-4 d-none d-md-inline"
                  onClick={handleEditClick}
                  style={{ cursor: "pointer" }}
                >
                  <i className="ri-nurse-line align-middle me-1 fs-18"></i>
                  <span className={admission?.nurse?.name ? "" : "text-muted"}>
                    {admission?.nurse?.name || "Add nurse"}
                  </span>
                  <UncontrolledTooltip target={"patient-nurse"}>
                    Click to edit Nurse
                  </UncontrolledTooltip>
                </li>

                <li
                  id="patient-visiting-consultant"
                  className="list-inline-item m-0 ms-4 d-none d-md-inline"
                  onClick={handleEditClick}
                  style={{ cursor: "pointer" }}
                >
                  <i className="ri-user-star-line align-middle me-1 fs-18"></i>
                  <span
                    className={
                      admission?.visitingConsultant?.name ? "" : "text-muted"
                    }
                  >
                    {admission?.visitingConsultant?.name ||
                      "Add Visiting Consultant"}
                  </span>
                  <UncontrolledTooltip target={"patient-visiting-consultant"}>
                    Click to edit Visiting Consultant
                  </UncontrolledTooltip>
                </li>

                <li className="list-inline-item m-0">
                  <Dropdown isOpen={search_Menu} toggle={toggleSearch}>
                    <DropdownToggle
                      className="btn btn-ghost-secondary btn-icon"
                      tag="button"
                    >
                      <i className="ri-search-eye-line"></i>
                      {/* <FeatherIcon icon="search" className="icon-sm" /> */}
                    </DropdownToggle>
                    <DropdownMenu className="p-0 dropdown-menu-end dropdown-menu-lg">
                      <div className="p-2">
                        <div className="search-box">
                          <Input
                            //   onKeyUp={searchUsers}
                            type="text"
                            className="form-control bg-light border-light"
                            placeholder="Search here..."
                            id="searchMessage"
                          />
                          <i className="ri-search-2-line search-icon"></i>
                        </div>
                      </div>
                    </DropdownMenu>
                  </Dropdown>
                </li>
                <li id="patient-center-shift" className="list-inline-item m-0">
                  <button
                    onClick={() =>
                      dispatch(switchCenter({ data: patient, isOpen: true }))
                    }
                    disabled={patient.isAdmit}
                    size="sm"
                    outline
                    className="btn btn-ghost-secondary border-0"
                  >
                    <i className="ri-arrow-left-right-line"></i>
                  </button>
                  <UncontrolledTooltip target={"patient-center-shift"}>
                    {patient.isDischarge ? (
                      "Switch Center"
                    ) : (
                      <span className="text-warning">
                        Please discharge the patient first!
                      </span>
                    )}
                  </UncontrolledTooltip>
                </li>

                <li className="list-inline-item d-none d-lg-inline-block m-0">
                  <button
                    type="button"
                    className="btn btn-ghost-secondary btn-icon"
                    onClick={toggleInfo}
                  >
                    <i className="ri-information-line"></i>
                    {/* <FeatherIcon icon="info" className="icon-sm" /> */}
                  </button>
                </li>

                <li className="list-inline-item m-0">
                  <Dropdown isOpen={settings_Menu} toggle={toggleSettings}>
                    <DropdownToggle
                      className="btn btn-ghost-secondary btn-icon"
                      tag="button"
                    >
                      <i className="bx bx-dots-vertical-rounded fs-4"></i>
                      {/* <FeatherIcon icon="more-vertical" className="icon-sm" /> */}
                    </DropdownToggle>
                    <DropdownMenu>
                      {/* <DropdownItem
                        href="#"
                        className="d-block user-profile-show"
                        
                      >
                        <i className="ri-user-2-fill align-bottom text-muted me-2"></i>{" "}
                        View Profile
                      </DropdownItem> */}
                      <DropdownItem
                        disabled={
                          !patient.isAdmit || user?.role === "COUNSELLOR"
                        }
                        onClick={() =>
                          dispatch(
                            admitDischargePatient({
                              data: null,
                              isOpen: DISCHARGE_PATIENT,
                            }),
                          )
                        }
                        // href="#"
                      >
                        <i className="ri-inbox-archive-line align-bottom text-muted me-2"></i>{" "}
                        Discharge Patient
                      </DropdownItem>
                      <CheckPermission permission={"edit"}>
                        <DropdownItem
                          onClick={() =>
                            dispatch(
                              togglePatientForm({
                                data: patient,
                                isOpen: true,
                              }),
                            )
                          }
                          href="#"
                        >
                          <i className="ri-quill-pen-line align-bottom text-muted me-2"></i>{" "}
                          Edit
                        </DropdownItem>
                      </CheckPermission>
                      <CheckPermission permission={"delete"}>
                        <DropdownItem
                          onClick={() =>
                            setDeletePatient({
                              data: patient?._id,
                              isOpen: true,
                            })
                          }
                          href="#"
                        >
                          {" "}
                          <i className="ri-delete-bin-5-line align-bottom text-muted me-2"></i>{" "}
                          Delete
                        </DropdownItem>
                      </CheckPermission>
                    </DropdownMenu>
                  </Dropdown>
                </li>
              </ul>
            </Col>
          </Row>
        </div>
      </div>

      {/* Edit Assignments Modal */}
      <Modal isOpen={isEditModalOpen} toggle={() => setIsEditModalOpen(false)}>
        <ModalHeader toggle={() => setIsEditModalOpen(false)}>
          Edit Assignments
        </ModalHeader>
        <ModalBody>
          <Form>
            <Row>
              <Col md={12} className="mb-3">
                <Label>Doctor</Label>
                <Select
                  value={selectedDoctor}
                  onChange={setSelectedDoctor}
                  options={doctors?.map((doc) => ({
                    value: doc._id,
                    label: doc.name,
                  }))}
                  placeholder="Select doctor"
                  isLoading={!doctors?.length}
                />
              </Col>
              <Col md={12} className="mb-3">
                <Label>Psychologist</Label>
                <Select
                  value={selectedPsychologist}
                  onChange={setSelectedPsychologist}
                  options={psychologists?.map((psych) => ({
                    value: psych._id,
                    label: psych.name,
                  }))}
                  placeholder="Select psychologist"
                  isLoading={!psychologists?.length}
                />
              </Col>
              <Col md={12} className="mb-3">
                <Label>MSW</Label>
                <Select
                  value={selectedMsw}
                  onChange={setSelectedMsw}
                  options={[
                    ...(msws || []).map((msw) => ({
                      value: msw._id,
                      label: msw.name,
                    })),
                    STAFF_NA_OPTION,
                  ]}
                  placeholder="Select MSW"
                  isLoading={!msws}
                />
              </Col>
              <Col md={12} className="mb-3">
                <Label>RMO</Label>
                <Select
                  value={selectedRmo}
                  onChange={setSelectedRmo}
                  options={[
                    ...(rmos || []).map((rmo) => ({
                      value: rmo._id,
                      label: rmo.name,
                    })),
                    STAFF_NA_OPTION,
                  ]}
                  placeholder="Select RMO"
                  isLoading={!rmos}
                />
              </Col>
              <Col md={12} className="mb-3">
                <Label>Nurse</Label>
                <Select
                  value={selectedNurse}
                  onChange={setSelectedNurse}
                  options={[
                    ...(nurses || []).map((nurse) => ({
                      value: nurse._id,
                      label: nurse.name,
                    })),
                    STAFF_NA_OPTION,
                  ]}
                  placeholder="Select nurse"
                  isLoading={!nurses}
                />
              </Col>
              <Col md={12} className="mb-3">
                <Label>Visiting Consultant</Label>
                <Select
                  value={selectedVisitingConsultant}
                  onChange={setSelectedVisitingConsultant}
                  options={[
                    ...(visitingConsultants || []).map((vc) => ({
                      value: vc._id,
                      label: vc.name,
                    })),
                    STAFF_NA_OPTION,
                  ]}
                  placeholder="Select visiting consultant"
                  isLoading={!visitingConsultants}
                />
              </Col>
            </Row>
            <div className="text-end mt-3">
              <Button
                color="secondary"
                className="me-2"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                color="primary"
                onClick={handleSave}
                disabled={loading || !hasAnySelection}
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </Form>
        </ModalBody>
      </Modal>
      <AddNoteModal
        isOpen={notesModal}
        toggle={() => setNotesModal(false)}
        patientId={patient?._id}
      />
      <AssignNurseModal
        isOpen={nurseModal}
        toggle={() => setNurseModal(false)}
        patientId={patient?._id}
      />
    </React.Fragment>
  );
};

PatientTopbar.propTypes = {
  patient: PropTypes.object,
};

const mapStateToProps = (state) => ({
  patient: state.Patient.patient,
  user: state.User?.user,
  doctors: state.User?.doctor,
  psychologists: state.User?.counsellors,
  nurses: state.User?.nurses,
  rmos: state.User?.rmos,
  msws: state.User?.msws,
  visitingConsultants: state.User?.visitingConsultants,
  admissions: state.Chart.data,
  loading: state.Patient.admissionLoading,
  nurseLoading: state.Patient.nurseLoading,
  assignedNurse: state.Patient.patient.assignedNurse,
  finalDiagnosis: state.Chart.finalDiagnosis,
  finalDiagnosisLoading: state.Chart.finalDiagnosisLoading,
});

export default connect(mapStateToProps)(PatientTopbar);
