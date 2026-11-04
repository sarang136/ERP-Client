import React from "react";
import { Button, Form } from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";
import { connect } from "react-redux";
import { useDispatch } from "react-redux";
import {
  ELDERLY_FUNCTIONAL_CHECKLIST,
  elderlyFunctionalChecklistFields,
} from "../../../Components/constants/patient";
import RenderFields from "../../../Components/Common/RenderFields";
import { createEditChart } from "../../../store/actions";
import {
  addElderlyFunctionalChecklist,
  updateElderlyFunctionalChecklist,
} from "../../../store/features/chart/chartSlice";
import PropTypes from "prop-types";
import { elderlyChecklistYupShape } from "../../../utils/elderlyChecklistValidation";

const ElderlyFunctionalChecklist = ({
  author,
  patient,
  chartDate,
  editChartData,
  type,
  shouldPrintAfterSave,
}) => {
  const dispatch = useDispatch();
  const editElderlyFunctionalChecklist =
    editChartData?.elderlyFunctionalChecklist;

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      author: author._id,
      patient: patient._id,
      center: patient.center._id || patient.center,
      addmission: patient?.addmission?._id || patient?.addmission || "",

      // residentNameId: editElderlyFunctionalChecklist
      //   ? editElderlyFunctionalChecklist?.residentNameId
      //   : "",
      // checklistDateTime: editElderlyFunctionalChecklist
      //   ? editElderlyFunctionalChecklist?.checklistDateTime
      //   : new Date().toISOString().slice(0, 10),
      informationSource: editElderlyFunctionalChecklist
        ? editElderlyFunctionalChecklist?.informationSource
        : "",
      informationSourceOther: editElderlyFunctionalChecklist
        ? editElderlyFunctionalChecklist?.informationSourceOther
        : "",
      supervisionRequired: editElderlyFunctionalChecklist
        ? editElderlyFunctionalChecklist?.supervisionRequired
        : "",
      standingAbility: editElderlyFunctionalChecklist
        ? editElderlyFunctionalChecklist?.standingAbility
        : "",
      walkingMobility: editElderlyFunctionalChecklist
        ? editElderlyFunctionalChecklist?.walkingMobility
        : "",
      walkingAidUsed: editElderlyFunctionalChecklist
        ? editElderlyFunctionalChecklist?.walkingAidUsed
        : "",
      personalHygiene: editElderlyFunctionalChecklist
        ? editElderlyFunctionalChecklist?.personalHygiene
        : "",
      selfCareAbility: editElderlyFunctionalChecklist
        ? editElderlyFunctionalChecklist?.selfCareAbility
        : "",
      levelOfAssistanceRequired: editElderlyFunctionalChecklist
        ? editElderlyFunctionalChecklist?.levelOfAssistanceRequired
        : "",
      foodIntake: editElderlyFunctionalChecklist
        ? editElderlyFunctionalChecklist?.foodIntake
        : "",
      fluidIntake: editElderlyFunctionalChecklist
        ? editElderlyFunctionalChecklist?.fluidIntake
        : "",
      feedingAssistanceRequired: editElderlyFunctionalChecklist
        ? editElderlyFunctionalChecklist?.feedingAssistanceRequired
        : "",
      urinePatternAsReported: editElderlyFunctionalChecklist
        ? editElderlyFunctionalChecklist?.urinePatternAsReported
        : "",
      bowelPatternAsReported: editElderlyFunctionalChecklist
        ? editElderlyFunctionalChecklist?.bowelPatternAsReported
        : "",
      urineControl: editElderlyFunctionalChecklist
        ? editElderlyFunctionalChecklist?.urineControl
        : "",
      bowelControl: editElderlyFunctionalChecklist
        ? editElderlyFunctionalChecklist?.bowelControl
        : "",
      catheterStatus: editElderlyFunctionalChecklist
        ? editElderlyFunctionalChecklist?.catheterStatus
        : "",
      skinConcerns: Array.isArray(editElderlyFunctionalChecklist?.skinConcerns)
        ? editElderlyFunctionalChecklist.skinConcerns
        : [],
      skinConcernDetails: editElderlyFunctionalChecklist
        ? editElderlyFunctionalChecklist?.skinConcernDetails
        : "",
      sleepAsReported: editElderlyFunctionalChecklist
        ? editElderlyFunctionalChecklist?.sleepAsReported
        : "",
      activityParticipation: editElderlyFunctionalChecklist
        ? editElderlyFunctionalChecklist?.activityParticipation
        : "",
      expressingNeeds: editElderlyFunctionalChecklist
        ? editElderlyFunctionalChecklist?.expressingNeeds
        : "",
      fallSinceLastReview: editElderlyFunctionalChecklist
        ? editElderlyFunctionalChecklist?.fallSinceLastReview
        : "",
      fallDate: editElderlyFunctionalChecklist
        ? editElderlyFunctionalChecklist?.fallDate
        : "",
      careNeedsChangesNoted: editElderlyFunctionalChecklist
        ? editElderlyFunctionalChecklist?.careNeedsChangesNoted
        : "",
      concernSharedWith: editElderlyFunctionalChecklist
        ? editElderlyFunctionalChecklist?.concernSharedWith
        : "",
      sharedNameDateTime: editElderlyFunctionalChecklist
        ? editElderlyFunctionalChecklist?.sharedNameDateTime
        : "",

      date: chartDate,
      shouldPrintAfterSave,
      chart: ELDERLY_FUNCTIONAL_CHECKLIST,
      type,
    },
    validationSchema: Yup.object({
      patient: Yup.string().required("Patient is required"),
      center: Yup.string().required("Center is required"),
      addmission: Yup.string().required("Admission is required"),
      chart: Yup.string().required("Chart is required"),
      ...elderlyChecklistYupShape,
    }),
    onSubmit: (values) => {
      if (editElderlyFunctionalChecklist) {
        dispatch(
          updateElderlyFunctionalChecklist({
            id: editChartData._id,
            chartId: editElderlyFunctionalChecklist._id,
            ...values,
          })
        );
      } else {
        dispatch(addElderlyFunctionalChecklist(values));
      }
    },
  });

  const closeForm = () => {
    dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
    validation.resetForm();
  };

  return (
    <Form onSubmit={validation.handleSubmit}>
      {/* <Row>
        <Col xs={12}>
          <div className="mb-3">
            <Label htmlFor="residentNameId" className="form-label">
              Resident Name / ID <span className="text-danger">*</span>
            </Label>
            <Input
              name="residentNameId"
              id="residentNameId"
              className="form-control"
              type="text"
              onChange={validation.handleChange}
              onBlur={validation.handleBlur}
              value={validation.values.residentNameId || ""}
              invalid={
                validation.touched.residentNameId &&
                Boolean(validation.errors.residentNameId)
              }
            />
            {validation.touched.residentNameId &&
              validation.errors.residentNameId && (
                <FormFeedback type="invalid">
                  {validation.errors.residentNameId}
                </FormFeedback>
              )}
          </div>
        </Col>
      </Row>
      <Row>
        <Col xs={12} lg={6}>
          <div className="mb-3">
            <Label htmlFor="checklistCentre" className="form-label">
              Centre <span className="text-danger">*</span>
            </Label>
            <Input
              name="checklistCentre"
              id="checklistCentre"
              className="form-control"
              type="text"
              value={patient?.center?.title || ""}
              disabled
              invalid={
                validation.touched.center && Boolean(validation.errors.center)
              }
            />
            {validation.touched.center && validation.errors.center && (
              <FormFeedback type="invalid">
                {validation.errors.center}
              </FormFeedback>
            )}
          </div>
        </Col>
        <Col xs={12} lg={6}>
          <div className="mb-3">
            <Label htmlFor="checklistDateTime" className="form-label">
              Date / Time <span className="text-danger">*</span>
            </Label>
            <Input
              name="checklistDateTime"
              id="checklistDateTime"
              className="form-control"
              type="date"
              onChange={validation.handleChange}
              onBlur={validation.handleBlur}
              value={validation.values.checklistDateTime || ""}
              invalid={
                validation.touched.checklistDateTime &&
                Boolean(validation.errors.checklistDateTime)
              }
            />
            {validation.touched.checklistDateTime &&
              validation.errors.checklistDateTime && (
                <FormFeedback type="invalid">
                  {validation.errors.checklistDateTime}
                </FormFeedback>
              )}
          </div>
        </Col>
      </Row> */}
      <RenderFields
        fields={elderlyFunctionalChecklistFields.filter(
          (field) =>
            field.name !== "residentNameId" &&
            field.name !== "checklistDateTime",
        )}
        validation={validation}
      />

      <div className="mt-3">
        <div className="d-flex gap-3 justify-content-end">
          <Button onClick={closeForm} size="sm" color="danger" type="button">
            Cancel
          </Button>
          <Button type="submit" size="sm">
            Save
          </Button>
        </div>
      </div>
    </Form>
  );
};

ElderlyFunctionalChecklist.propTypes = {
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
  type: state.Chart.chartForm.type,
});

export default connect(mapStateToProps)(ElderlyFunctionalChecklist);
