import React from "react";
import PropTypes from "prop-types";
import moment from "moment";
import {capitalizeWords} from "../../../utils/toCapitalize";


const formatDate = (value) =>
  value ? moment(value).format("DD MMM, YYYY hh:mm A") : "";

const Outpass = ({ data }) => {
  return (
    <React.Fragment>
      <div>
        {data?.fromDate && (
          <div className="d-flex">
            <h6 className="fs-xs-10 fs-md-14">From Date:-</h6>
            <p className="fs-xs-9 fs-md-12 mb-0 ms-2">
              {formatDate(data.fromDate)}
            </p>
          </div>
        )}
        {data?.toDate && (
          <div className="d-flex">
            <h6 className="fs-xs-10 fs-md-14">To Date:-</h6>
            <p className="fs-xs-9 fs-md-12 mb-0 ms-2">
              {formatDate(data.toDate)}
            </p>
          </div>
        )}
        {data?.note && (
          <div className="d-flex">
            <h6 className="fs-xs-10 fs-md-14">Note:-</h6>
            <p className="fs-xs-9 fs-md-12 mb-0 ms-2">{capitalizeWords(data.note)}</p>
          </div>
        )}
      </div>
    </React.Fragment>
  );
};

Outpass.propTypes = {
  data: PropTypes.object,
};

export default Outpass;
