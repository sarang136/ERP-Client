import React, { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { Card, CardBody, Col, Input, Label, Row, Spinner } from "reactstrap";
import CalenderHourDuration from "./CalenderHourDuration";
import RenderWhen from "../../../../Components/Common/RenderWhen";
import { connect, useDispatch } from "react-redux";
import { fetchAllDoctorSchedule } from "../../../../store/actions";
import Select from "react-select";

const BookingBar = ({ loading, assignedCenters, navbarCenters, centers }) => {
  const dispatch = useDispatch();
  const [query, setQuery] = useState("");
  const [centerFilter, setCenterFilter] = useState("ALL");

  // Centers picked in the navbar filter, limited to what the user is really
  // assigned (navbar "Select All" can include extra centers).
  const effectiveCenters = useMemo(() => {
    const assigned = assignedCenters || [];
    if (!navbarCenters) return assigned;
    return navbarCenters.filter((id) => assigned.includes(id));
  }, [assignedCenters, navbarCenters]);

  const centerOptions = useMemo(() => {
    const options = (centers || [])
      .filter((c) => effectiveCenters.includes(c._id))
      .map((c) => ({ value: c._id, label: c.title || "Unknown Center" }));
    return options.length > 1
      ? [{ value: "ALL", label: "All Centers" }, ...options]
      : options;
  }, [centers, effectiveCenters]);

  // Reset the local filter if the navbar selection no longer includes it
  useEffect(() => {
    if (centerFilter !== "ALL" && !effectiveCenters.includes(centerFilter)) {
      setCenterFilter("ALL");
    }
  }, [effectiveCenters, centerFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const selected =
        centerFilter === "ALL" ? effectiveCenters : [centerFilter];
      dispatch(
        fetchAllDoctorSchedule({
          name: query,
          centerAccess: JSON.stringify(selected),
        })
      );
    }, 1000);
    return () => clearTimeout(timer);
  }, [dispatch, query, effectiveCenters, centerFilter]);

  return (
    <React.Fragment>
      <Card>
        <CardBody className="bg-white">
          <Row className="gap-2 align-items-end">
            <Col xs={12} md={4} lg={3}>
              <CalenderHourDuration />
            </Col>
            <Col xs={12} md={4} lg={3}>
              <Label className="form-label mb-1">Center</Label>
              <Select
                options={centerOptions}
                value={
                  centerOptions.find((o) => o.value === centerFilter) ||
                  centerOptions[0]
                }
                onChange={(opt) => setCenterFilter(opt?.value || "ALL")}
                placeholder="Select center"
                isSearchable
              />
            </Col>
            <Col xs={12} md={4} lg={4}>
              <div className="search-box">
                <Input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                  }}
                  style={{ paddingLeft: "20px !important" }}
                  className="ps-4"
                  placeholder="Search for name"
                  bsSize="sm"
                />
                <i
                  style={{ right: "10px", left: "unset" }}
                  className="ri-search-line search-icon"
                ></i>
                <RenderWhen isTrue={loading}>
                  <Spinner
                    className="position-absolute"
                    style={{ right: 30, top: 8 }}
                    color="success"
                    size={"sm"}
                  />
                </RenderWhen>
              </div>
            </Col>
            {/* <Col className="col-sm-auto ms-auto">
              <div className="list-grid-nav hstack gap-1">
                <Button
                  className="text-white"
                  color="success"
                  //   onClick={toggleForm}
                >
                  <i className="ri-add-fill me-1 align-bottom"></i> Add Item
                </Button>
              </div>
            </Col> */}
          </Row>
        </CardBody>
      </Card>
    </React.Fragment>
  );
};

const mapStateToProps = (state) => ({
  loading: state.Setting.loading,
  assignedCenters: state.User?.user?.centerAccess,
  navbarCenters: state.User?.centerAccess,
  centers: state.Center.data,
});

BookingBar.prototype = {
  loading: PropTypes.bool,
  assignedCenters: PropTypes.array,
  navbarCenters: PropTypes.array,
  centers: PropTypes.array,
};

export default connect(mapStateToProps)(BookingBar);
