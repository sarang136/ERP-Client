import React, { useState } from "react";
import PropTypes from "prop-types";
import CustomModal from "../../../Components/Common/Modal";
import CSVReader from "react-csv-reader";
import DataTable from "react-data-table-component";
import { Input, Label } from "reactstrap";
import { connect } from "react-redux";

// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";

const MedicineCSV = ({ modal, toggle, centers, ...rest }) => {
  const [viewMedicines, setViewMedicines] = useState([]);

  const papaparseOptions = {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.toLowerCase().replace(/\W/g, "_"),
  };

  const handleForce = (data, fileInfo) => setViewMedicines(data);

  const validation = useFormik({
    // enableReinitialize : use this flag when initial values needs to be changed
    enableReinitialize: true,

    initialValues: {
      centers: centers.map((c) => c._id) || [],
    },
    validationSchema: Yup.object({
      pageAccess: Yup.array().test(
        "notEmpty",
        "Centers is required",
        (value) => {
          if (!value || value.length === 0) {
            return false;
          }
          return true;
        }
      ),
    }),
    onSubmit: (values) => {},
  });

  const columns = [
    {
      name: "Name",
      selector: (row) => row.drug_name,
    },
    {
      name: "Type",
      selector: (row) => row.type,
    },
    {
      name: "Strength",
      selector: (row) => row.strength,
    },
    {
      name: "Unit",
      selector: (row) => row.unit,
    },
    // {
    //   name: "Instructions",
    //   selector: (row) => row.instruction,
    // },
    {
      name: "Composition",
      selector: (row) => row.composition,
    },
    // {
    //   name: "Quantity",
    //   selector: (row) => row.quantity,
    // },
    {
      name: "Batch Number",
      selector: (row) => row.batch_number,
    },
    // {
    //   name: "Expiry Date",
    //   selector: (row) => row.expiry_date,
    // },
    // {
    //   name: "Unit Price",
    //   selector: (row) => row.unit_price,
    // },
  ];

  return (
    <React.Fragment>
      <CustomModal
        size={"xl"}
        isOpen={modal}
        toggle={toggle}
        centered
        title={"Add Medicine"}
      >
        <div>
          <CSVReader
            cssClass="csv-reader-input"
            label="Select Medicine CSV"
            onFileLoaded={handleForce}
            //   onError={this.handleDarkSideForce}
            parserOptions={papaparseOptions}
            inputId="ObiWan"
            inputName="ObiWan"
            inputStyle={{ color: "red" }}
          />
        </div>
        <div className="">
          <h6 className="display-6 fs-4 d-block">Centers</h6>
          <div className="d-flex flex-wrap">
            {(centers || []).map((center) => (
              <div
                key={center._id}
                className="d-flex me-5 mb-2 align-items-center"
              >
                <Input
                  className="me-2 mt-0"
                  type={"checkbox"}
                  name={"centers"}
                  value={center._id}
                  onChange={validation.handleChange}
                  checked={validation.values.centers.includes(center._id)}
                />
                <Label className="form-label fs-9 mb-0">{center.title}</Label>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <h6 className="display-6 fs-5">Preview Medicine</h6>
          <DataTable
            fixedHeader
            columns={columns}
            data={viewMedicines || []}
            highlightOnHover
          />
        </div>
      </CustomModal>
    </React.Fragment>
  );
};

MedicineCSV.propTypes = {
  modal: PropTypes.bool,
  toggle: PropTypes.func,
};

const mapStateToProps = (state) => ({
  centers: state.Center.data,
});

export default connect(mapStateToProps)(MedicineCSV);
