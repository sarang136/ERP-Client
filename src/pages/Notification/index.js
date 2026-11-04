import React, { useEffect } from "react";
import Divider from "../../Components/Common/Divider";
import {
  Row,
  Col,
  Card,
  CardBody,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Spinner
} from "reactstrap";
import { Link } from "react-router-dom";
import avatar from "../../assets/images/users/user-dummy-img.jpg";

//redux
import { connect, useDispatch } from "react-redux";
import { fetchBillNotification, viewPatient } from "../../store/actions";
import { format } from "date-fns";

const Notification = ({ bill, userCenters, loading }) => {
  const dispatch = useDispatch();

  //   const createBill = (item) => {
  //     const patient = patients?.find(
  //       (patient) => patient._id === item.recentBill.patient._id
  //     );
  //     if (!patient) dispatch(pushSearchedPatient(item.recentBill.patient));
  //     dispatch(showPatient(item.recentBill.patient));
  //   };

  useEffect(() => {
    dispatch(fetchBillNotification(userCenters));
  }, [dispatch, userCenters]);

  if(loading){
    return(
    <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
      <Spinner color="primary" style={{ width: '3rem', height: '3rem' }}>
        Loading...
      </Spinner>
    </div>
    )
  }

  return (
    <React.Fragment>
      <div className="page-content">
        <div>
          <div>
            <h5 className="display-5">Bill Notification</h5>
          </div>
          <Divider />
          <div className="">
            <Row className="team-list list-view-filter">
              {(bill || []).map((item, key) => (
                <Col key={item._id?._id}>
                  <Card
                    className={
                      // Math.floor(item.daysSinceRecentBill) >= 30
                      // ? "team-box bg-danger bg-opacity-25"
                      "team-box"
                    }
                  >
                    <div className="team-cover">
                      <img src={avatar} alt="" className="img-fluid" />
                    </div>
                    <CardBody className="p-2">
                      <Row className="align-items-center team-row">
                        <Col className="team-settings">
                          <Row>
                            {/* <Col>
                              <div className="bookmark-icon flex-shrink-0 me-2">
                                {/* <Rating
                          stop={1}
                          emptySymbol='mdi mdi-star-outline text-muted '
                          fullSymbol='mdi mdi-star text-warning '
                        /> 
                                rating
                              </div>
                            </Col> */}
                            <UncontrolledDropdown
                              direction="start"
                              className="col text-end"
                            >
                              <DropdownToggle
                                tag="a"
                                id="dropdownMenuLink2"
                                className="text-decoration-none"
                                role="button"
                              >
                                <i className="ri-more-fill fs-17"></i>
                              </DropdownToggle>
                              <DropdownMenu>
                                <DropdownItem
                                //   onClick={() => {
                                //     props.setProfileData(item);
                                //     props.toggleOffCanvas();
                                //   }}
                                >
                                  <i className="ri-eye-line me-2 align-middle" />
                                  View
                                </DropdownItem>
                                <DropdownItem
                                //   onClick={() => {
                                //     props.setEditEmployee(item);
                                //     props.toggle();
                                //   }}
                                >
                                  <i className="ri-quill-pen-line me-2 align-middle" />
                                  Edit
                                </DropdownItem>
                                <DropdownItem>
                                  <i className="ri-delete-bin-5-line me-2 align-middle" />
                                  Delete
                                </DropdownItem>
                              </DropdownMenu>
                            </UncontrolledDropdown>
                          </Row>
                        </Col>
                        <Col lg={4} className="col">
                          <div className="team-profile-img">
                            <div
                              style={{ zIndex: "11" }}
                              className="avatar-lg img-thumbnail rounded-circle flex-shrink-0"
                            >
                              {/* {item.userImage != null ? ( */}
                              <img
                                src={
                                  item?.recentBill?.patient.profilePicture
                                    ?.url || avatar
                                }
                                alt=""
                                style={{ objectFit: "cover" }}
                                className="img-fluid d-block rounded-circle h-100 w-100"
                              />
                              {/* // ) : ( */}
                              {/* <div
                        className={
                          'avatar-title rounded-circle bg-soft-danger text-white'
                        }
                      >
                        OA
                      </div> */}
                              {/* // )} */}
                            </div>
                            <div className="team-content">
                              <Link
                                to="#"
                                className="text-decoration-none"
                                // onClick={props.toggleOffCanvas}
                              >
                                <h5 className="fs-16 mb-1">
                                  {item?.name || "Patient Name"}
                                </h5>
                                <span className="fs-12 mb-1">
                                  {item?.center?.title || ""}
                                </span>
                              </Link>
                              <p className="text-muted mb-0">
                                {/* {moment(
                                  item?.recentBill?.patient.dateOfAddmission
                                ).format("D MMM y") || ""} */}
                              </p>
                            </div>
                          </div>
                        </Col>
                        <Col lg={4} className="col">
                          <Row className="text-muted text-center">
                            <Col
                              xs={6}
                              className="border-end border-end-dashed"
                            >
                              <p className="text-muted mb-0">Admission Date</p>{" "}
                              <h5 className="mb-1">
                                {item?.addmission
                                  ? format(
                                      new Date(
                                        item?.addmission?.addmissionDate
                                      ),
                                      "dd MMM yyyy"
                                    )
                                  : ""}
                              </h5>
                            </Col>
                            <Col xs={6}>
                              <p className="text-muted mb-0">Bill Cycle Date</p>
                              <h5 className="mb-1">
                                {item?.lastBillingCycleDate
                                  ? format(
                                      new Date(
                                        item?.lastBillingCycleDate
                                      ),
                                      "dd MMM"
                                    )
                                  : ""}
                                {/* {`${Math.floor(
                                  item.daysSinceRecentBill / 30
                                )} month & ${Math.ceil(
                                  item.daysSinceRecentBill % 30
                                )} days` || ""} */}
                              </h5>
                            </Col>
                          </Row>
                        </Col>
                        <Col lg={2} className="col">
                          <div className="text-end">
                            <Link
                              //   onClick={() => createBill(item)}
                              onClick={() => dispatch(viewPatient(item))}
                              to={`/patient/${item?._id}`}
                              className="btn btn-light view-btn bg-info bg-opacity-75"
                            >
                              Create Bill
                            </Link>
                          </div>
                        </Col>
                      </Row>
                    </CardBody>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

const mapStateToProps = (state) => ({
  bill: state.Notification?.bill,
  userCenters: state.User?.centerAccess,
  loading: state.Notification?.loading,
});

export default connect(mapStateToProps)(Notification);
