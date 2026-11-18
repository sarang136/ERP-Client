import React, { useEffect } from "react";
import PropTypes from "prop-types";
import {
  Form,
  Row,
  Col,
  Card,
  CardBody,
  Input,
  Button,
  FormFeedback,
} from "reactstrap";

import * as Yup from "yup";
import { useFormik } from "formik";

import { OUTPASS } from "../../../Components/constants/patient";
import { connect, useDispatch } from "react-redux";
import { addOutpass, createEditChart, updateOutpass } from "../../../store/actions";
import { toTimeZoneDateKey } from "../../../utils/date";
import moment from "moment";

const pad = (n) => String(n).padStart(2, "0");

const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const formatTime = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const currentTime = () => formatTime(new Date());

const combineDateTime = (date, time) => {
  if (!date) return "";
  const [y, mo, da] = date.split("-").map(Number);
  const [h, mi] = (time || "00:00").split(":").map(Number);
  return new Date(y, mo - 1, da, h || 0, mi || 0, 0, 0).toISOString();
};

const Outpass = ({
  author,
  patient,
  chartDate,
  editChartData,
  shouldPrintAfterSave = false,
  type,
}) => {
  const dispatch = useDispatch();

  const admissionDateKey = toTimeZoneDateKey(patient?.addmission?.addmissionDate);
  const admissionDateLabel = admissionDateKey
    ? moment(admissionDateKey, "YYYY-MM-DD").format("DD MMM, YYYY")
    : "";

  const editChart = editChartData?.outpass;
  const validation = useFormik({
    enableReinitialize: true,

    initialValues: {
      author: author._id,
      patient: patient._id,
      center: patient.center._id,
      addmission: patient.addmission?._id,
      chart: OUTPASS,
      fromDate: editChart ? formatDate(editChart.fromDate) : "",
      fromTime: editChart ? formatTime(editChart.fromDate) : currentTime(),
      toDate: editChart ? formatDate(editChart.toDate) : "",
      toTime: editChart ? formatTime(editChart.toDate) : currentTime(),
      note: editChart ? editChart.note : "",
      type,
      date: chartDate,
      shouldPrintAfterSave,
    },
    validationSchema: Yup.object({
      fromDate: Yup.string()
        .required("From date is required")
        .test(
          "from-not-before-admission",
          `From date can't be before admission date${
            admissionDateLabel ? ` (${admissionDateLabel})` : ""
          }`,
          (value) => {
            if (!value || !admissionDateKey) return true;
            return value >= admissionDateKey;
          }
        ),
      toDate: Yup.string()
        .required("To date is required")
        .test(
          "to-not-before-from",
          "To date & time can't be before from date & time",
          function (value) {
            const { fromDate, fromTime, toTime } = this.parent;
            if (!value || !fromDate) return true;
            return (
              combineDateTime(value, toTime) >=
              combineDateTime(fromDate, fromTime)
            );
          }
        ),
    }),
    onSubmit: (values) => {
      closeForm();
      const { fromTime, toTime, ...rest } = values;
      const payload = {
        ...rest,
        fromDate: combineDateTime(values.fromDate, fromTime),
        toDate: combineDateTime(values.toDate, toTime),
      };
      if (editChart) {
        dispatch(
          updateOutpass({
            ...payload,
            id: editChartData._id,
            chartId: editChart._id,
          })
        );
      } else {
        dispatch(addOutpass(payload));
      }
    },
  });

  useEffect(() => {
    if (!editChartData) {
      validation.resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, editChartData]);

  const closeForm = () => {
    dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
    validation.resetForm();
  };

  return (
    <React.Fragment>
      <div>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            validation.handleSubmit();
            return false;
          }}
          className="needs-validation"
          action="#"
        >
          <Row className="mt-3">
            <Col xs={12} md={6}>
              <Card className="ribbon-box border shadow-none mb-3">
                <CardBody className="position-relative p-0">
                  <div className="ribbon ribbon-primary w-75 ribbon-shape">
                    From Date
                  </div>
                  <Row className="g-2 pt-5 px-2 pb-2 m-0">
                    <Col xs={7} className="p-1">
                      <Input
                        type="date"
                        name="fromDate"
                        min={admissionDateKey || undefined}
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.fromDate || ""}
                        invalid={
                          validation.touched.fromDate &&
                          !!validation.errors.fromDate
                        }
                        className="form-control presc-border rounded"
                      />
                    </Col>
                    <Col xs={5} className="p-1">
                      <Input
                        type="time"
                        name="fromTime"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.fromTime || ""}
                        className="form-control presc-border rounded"
                      />
                    </Col>
                  </Row>
                  {(validation.touched.fromDate ||
                    validation.values.fromDate) &&
                    validation.errors.fromDate && (
                      <FormFeedback className="d-block">
                        {validation.errors.fromDate}
                      </FormFeedback>
                    )}
                </CardBody>
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card className="ribbon-box border shadow-none mb-3">
                <CardBody className="position-relative p-0">
                  <div className="ribbon ribbon-primary w-75 ribbon-shape">
                    To Date
                  </div>
                  <Row className="g-2 pt-5 px-2 pb-2 m-0">
                    <Col xs={7} className="p-1">
                      <Input
                        type="date"
                        name="toDate"
                        min={
                          validation.values.fromDate ||
                          admissionDateKey ||
                          undefined
                        }
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.toDate || ""}
                        invalid={
                          validation.touched.toDate && !!validation.errors.toDate
                        }
                        className="form-control presc-border rounded"
                      />
                    </Col>
                    <Col xs={5} className="p-1">
                      <Input
                        type="time"
                        name="toTime"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.toTime || ""}
                        className="form-control presc-border rounded"
                      />
                    </Col>
                  </Row>
                  {(validation.touched.toDate || validation.values.toDate) &&
                    validation.errors.toDate && (
                      <FormFeedback className="d-block">
                        {validation.errors.toDate}
                      </FormFeedback>
                    )}
                </CardBody>
              </Card>
            </Col>
            <Col xs={12}>
              <Card className="ribbon-box border shadow-none mb-3">
                <CardBody className="position-relative p-0">
                  <div className="ribbon ribbon-primary w-75 ribbon-shape">
                    Note
                  </div>
                  <Input
                    type="textarea"
                    name="note"
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    value={validation.values.note || ""}
                    className="form-control presc-border pt-5 rounded"
                    aria-label="With textarea"
                    rows="3"
                  />
                </CardBody>
              </Card>
            </Col>
            <Col xs={12} className="mt-3">
              <div className="d-flex gap-3 justify-content-end">
                <Button
                  onClick={closeForm}
                  size="sm"
                  color="danger"
                  type="button"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={Object.keys(validation.errors).length > 0}
                >
                  Save
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </div>
    </React.Fragment>
  );
};

Outpass.propTypes = {
  patient: PropTypes.object,
  author: PropTypes.object,
  chartDate: PropTypes.any,
  editChartData: PropTypes.object,
  type: PropTypes.string.isRequired,
};

const mapStateToProps = (state) => ({
  patient: state.Chart.chartForm?.patient,
  author: state.User.user,
  chartDate: state.Chart.chartDate,
  editChartData: state.Chart.chartForm?.data,
  shouldPrintAfterSave: state.Chart.chartForm.shouldPrintAfterSave,
});

export default connect(mapStateToProps)(Outpass);
