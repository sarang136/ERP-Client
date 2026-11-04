import React, { useEffect } from "react";
import PropTypes from "prop-types";
import {
  Col,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Input,
  Label,
  Offcanvas as PatientOffCanvas,
  OffcanvasBody,
  Row,
  UncontrolledDropdown,
  Button,
  UncontrolledPopover,
  PopoverBody,
  CardBody,
  Card,
} from "reactstrap";
import { Link } from "react-router-dom";

import smallImage9 from "../../../assets/images/small/img-9.jpg";

//redux
import { connect, useDispatch } from "react-redux";
import RenderWhen from "../../../Components/Common/RenderWhen";
import { countPatientDocuments } from "../../../store/actions";

const Offcanvas = ({
  patient,
  setPatient,
  patientDocumentsLoading,
  patientDocumentsCount,
}) => {
  const dispatch = useDispatch();
  const toggleOffCanvas = () => {
    setPatient({ data: null, isOpen: false });
  };

  const data = patient?.data;

  useEffect(() => {
    if (patient?.data) dispatch(countPatientDocuments(patient.data._id));
  }, [dispatch, patient]);

  return (
    <React.Fragment>
      <PatientOffCanvas
        isOpen={patient?.isOpen}
        direction="end"
        toggle={toggleOffCanvas}
        className="offcanvas-end border-0"
        tabIndex="-1"
      >
        <OffcanvasBody className="profile-offcanvas p-0">
          <div className="team-cover">
            <img src={smallImage9} alt="" className="img-fluid" />
          </div>
          <div className="p-3">
            <div className="team-settings">
              <Row>
                <Col>
                  <div className="bookmark-icon flex-shrink-0 me-2">
                    <Input
                      type="checkbox"
                      id="favourite13"
                      className="bookmark-input bookmark-hide"
                    />
                    <Label htmlFor="favourite13" className="btn-star">
                      <svg width="20" height="20">
                        {/* <use xlink:href="#icon-star"/> */}
                      </svg>
                    </Label>
                  </div>
                </Col>
                <UncontrolledDropdown
                  direction="start"
                  className="col text-end"
                >
                  <DropdownToggle tag="a" id="dropdownMenuLink14" role="button">
                    <i className="ri-more-fill fs-17"></i>
                  </DropdownToggle>
                  <DropdownMenu>
                    <DropdownItem>
                      <i className="ri-eye-line me-2 align-middle" />
                      View
                    </DropdownItem>
                    <DropdownItem>
                      <i className="ri-star-line me-2 align-middle" />
                      Favorites
                    </DropdownItem>
                    <DropdownItem>
                      <i className="ri-delete-bin-5-line me-2 align-middle" />
                      Delete
                    </DropdownItem>
                  </DropdownMenu>
                </UncontrolledDropdown>
              </Row>
            </div>
          </div>
          <div className="p-3 text-center">
            <img
              src={data?.profilePicture?.url}
              alt=""
              className="avatar-lg img-thumbnail rounded-circle mx-auto"
            />
            <div className="mt-3">
              <h5 className="fs-15">
                <Link to="#" className="link-primary">
                  {data?.name}
                </Link>
              </h5>
              {/* <p className="text-muted">Team Leader & HR</p> */}
            </div>
            {/* <div className="hstack gap-2 justify-content-center mt-4">
              <div className="avatar-xs">
                <Link
                  to="#"
                  className="avatar-title bg-soft-secondary text-secondary rounded fs-16"
                >
                  <i className="ri-facebook-fill"></i>
                </Link>
              </div>
              <div className="avatar-xs">
                <Link
                  to="#"
                  className="avatar-title bg-soft-success text-success rounded fs-16"
                >
                  <i className="ri-slack-fill"></i>
                </Link>
              </div>
              <div className="avatar-xs">
                <Link
                  to="#"
                  className="avatar-title bg-soft-info text-info rounded fs-16"
                >
                  <i className="ri-linkedin-fill"></i>
                </Link>
              </div>
              <div className="avatar-xs">
                <Link
                  to="#"
                  className="avatar-title bg-soft-danger text-danger rounded fs-16"
                >
                  <i className="ri-dribbble-fill"></i>
                </Link>
              </div>
            </div> */}
          </div>
          <Row className="g-0 text-center">
            <RenderWhen isTrue={!patientDocumentsLoading}>
              <Col xs={4}>
                <div className="p-3 border border-dashed border-start-0">
                  <h5 className="mb-1">{patientDocumentsCount?.totalCharts}</h5>
                  <p className="text-muted fs-11 mb-0">Total Charts</p>
                </div>
              </Col>
              <Col xs={4}>
                <div className="p-3 border border-dashed border-start-0">
                  <h5 className="mb-1">{patientDocumentsCount?.totalBills}</h5>
                  <p className="text-muted fs-11 mb-0">Total Bills</p>
                </div>
              </Col>
              <Col xs={4}>
                <div className="p-3 border border-dashed border-start-0">
                  <h5 className="mb-1">
                    {patientDocumentsCount?.totalAddmissions}
                  </h5>
                  <p className="text-muted fs-11 mb-0">Total Admissions</p>
                </div>
              </Col>
            </RenderWhen>
            <RenderWhen isTrue={patientDocumentsLoading}>
              <Card className="border-0">
                <CardBody className="border-0">
                  <p className="card-text placeholder-glow">
                    <span className="placeholder col-12"></span>
                    <span className="placeholder col-12 mt-3"></span>
                  </p>
                </CardBody>
              </Card>
            </RenderWhen>
          </Row>
          <div className="p-3">
            <h5 className="fs-15 mb-3">Personal Details</h5>
            <div className="mb-3">
              <p className="text-muted text-uppercase fw-semibold fs-12 mb-2">
                Number
              </p>
              <h6>{data?.phoneNumber}</h6>
            </div>
            <div className="mb-3">
              <p className="text-muted text-uppercase fw-semibold fs-12 mb-2">
                Email
              </p>
              <h6>{data?.email}</h6>
            </div>
            <div>
              <p className="text-muted text-uppercase fw-semibold fs-12 mb-2">
                Location
              </p>
              <h6 className="mb-0">{data?.address}</h6>
            </div>
          </div>
          <div className="p-3 border-top">
            <h5 className="fs-15 mb-4">File Manager</h5>
            <RenderWhen isTrue={data?.aadhaarCard ? true : false}>
              <div className="d-flex mb-3 align-items-center">
                <div className="flex-shrink-0 avatar-xs">
                  <div className="avatar-title bg-soft-danger text-danger rounded fs-16">
                    <i className="ri-image-2-line"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="mb-1">
                    <Link to="#">Images</Link>
                  </h6>
                  <p className="text-muted mb-0">Aadhaar Card</p>
                </div>
                <div className="text-muted">
                  <Button id="patient-aadhaar-card" size="sm">
                    View
                  </Button>
                  <UncontrolledPopover
                    placement="left"
                    target="patient-aadhaar-card"
                  >
                    <PopoverBody>
                      <img
                        className="w-100"
                        src={data?.aadhaarCard?.url}
                        alt="Patient Aadhaar Card"
                      />
                    </PopoverBody>
                  </UncontrolledPopover>
                </div>
              </div>
            </RenderWhen>
            {/* <div className="d-flex mb-3">
              <div className="flex-shrink-0 avatar-xs">
                <div className="avatar-title bg-soft-secondary text-secondary rounded fs-16">
                  <i className="ri-file-zip-line"></i>
                </div>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="mb-1">
                  <Link to="#">Documents</Link>
                </h6>
                <p className="text-muted mb-0">46 Files</p>
              </div>
              <div className="text-muted">3.46 GB</div>
            </div>
            <div className="d-flex mb-3">
              <div className="flex-shrink-0 avatar-xs">
                <div className="avatar-title bg-soft-success text-success rounded fs-16">
                  <i className="ri-live-line"></i>
                </div>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="mb-1">
                  <Link to="#">Media</Link>
                </h6>
                <p className="text-muted mb-0">124 Files</p>
              </div>
              <div className="text-muted">4.3 GB</div>
            </div>
            <div className="d-flex">
              <div className="flex-shrink-0 avatar-xs">
                <div className="avatar-title bg-soft-primary text-primary rounded fs-16">
                  <i className="ri-error-warning-line"></i>
                </div>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="mb-1">
                  <Link to="#">Others</Link>
                </h6>
                <p className="text-muted mb-0">18 Files</p>
              </div>
              <div className="text-muted">846 MB</div>
            </div> */}
          </div>
        </OffcanvasBody>
        <div className="offcanvas-foorter border p-3 hstack gap-3 text-center position-relative">
          <button className="btn btn-light w-100">
            <i className="ri-question-answer-fill align-bottom ms-1"></i> Send
            Message
          </button>
          <Link to="/pages-profile" className="btn btn-primary w-100">
            <i className="ri-user-3-fill align-bottom ms-1"></i> View Profile
          </Link>
        </div>
      </PatientOffCanvas>
    </React.Fragment>
  );
};

Offcanvas.propTypes = {
  patient: PropTypes.object,
  patientDocumentsLoading: PropTypes.bool.isRequired,
};

const mapStateToProps = (state) => ({
  patientDocumentsLoading: state.Recyclebin.patientLoading,
  patientDocumentsCount: state.Recyclebin.patientDocumentsCount,
});

export default connect(mapStateToProps)(Offcanvas);
