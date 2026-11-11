import React, { useEffect } from "react";
import { Button, Form } from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";
import { connect } from "react-redux";
import { useDispatch } from "react-redux";
import {
  MENTAL_EXAMINATION,
  mentalExaminationV2Fields,
} from "../../../Components/constants/patient";
import RenderFields from "../../../Components/Common/RenderFields";
import { createEditChart } from "../../../store/actions";
import {
  addGeneralMentalExamination,
  addMentalExamination,
  fetchLastMentalExamination,
  updateMentalExamination,
} from "../../../store/features/chart/chartSlice";
import PropTypes from "prop-types";

const MentalExamination = ({
  author,
  patient,
  appointment,
  chartDate,
  editChartData,
  type,
  shouldPrintAfterSave,
  patientLatestMentalExamination,
  populate,
  onNoteSaved,
}) => {

  const dispatch = useDispatch();
  const editMentalExamination = editChartData?.mentalExamination;
  const ptLatestMentalExamination =
    patientLatestMentalExamination?.mentalExamination;

  useEffect(() => {
    if (!editMentalExamination && patient?._id) {
      dispatch(
        fetchLastMentalExamination({
          id: patient._id,
          type: type === "IPD" ? "IPD" : "GENERAL",
        })
      );
    }
  }, [editMentalExamination, patient?._id, type, dispatch]);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      author: author._id,
      patient: patient._id,
      center: patient.center._id || patient.center,
      addmission: patient?.addmission?._id || patient?.addmission || "",
      appointment: appointment?._id,

      chiefComplaints: editMentalExamination
        ? editMentalExamination?.chiefComplaints
        : ptLatestMentalExamination
        ? ptLatestMentalExamination?.chiefComplaints
        : "",

      grooming: editMentalExamination
        ? editMentalExamination?.appearanceAndBehavior?.grooming
        : ptLatestMentalExamination
        ? ptLatestMentalExamination?.appearanceAndBehavior?.grooming
        : "",
      generalAppearance: editMentalExamination
        ? editMentalExamination?.appearanceAndBehavior?.generalAppearance
        : ptLatestMentalExamination
        ? ptLatestMentalExamination?.appearanceAndBehavior?.generalAppearance
        : "",
      surroundingTouch: editMentalExamination
        ? editMentalExamination?.appearanceAndBehavior?.surroundingTouch
        : ptLatestMentalExamination
        ? ptLatestMentalExamination?.appearanceAndBehavior?.surroundingTouch
        : "",
      eyeContact: editMentalExamination
        ? editMentalExamination?.appearanceAndBehavior?.eyeContact
        : ptLatestMentalExamination
        ? ptLatestMentalExamination?.appearanceAndBehavior?.eyeContact
        : "",
      psychomotorActivity: editMentalExamination
        ? editMentalExamination?.appearanceAndBehavior?.psychomotorActivity
        : ptLatestMentalExamination
        ? ptLatestMentalExamination?.appearanceAndBehavior?.psychomotorActivity
        : "",

      rate: editMentalExamination
        ? editMentalExamination?.speech?.rate
        : ptLatestMentalExamination
        ? ptLatestMentalExamination?.speech?.rate
        : "",
      tone: editMentalExamination
        ? editMentalExamination?.speech?.tone
        : ptLatestMentalExamination
        ? ptLatestMentalExamination?.speech?.tone
        : "",
      volume: editMentalExamination
        ? editMentalExamination?.speech?.volume
        : ptLatestMentalExamination
        ? ptLatestMentalExamination?.speech?.volume
        : "",
      reactionTime: editMentalExamination
        ? editMentalExamination?.speech?.reactionTime
        : ptLatestMentalExamination
        ? ptLatestMentalExamination?.speech?.reactionTime
        : "",
      productivity: editMentalExamination
        ? editMentalExamination?.speech?.productivity
        : ptLatestMentalExamination
        ? ptLatestMentalExamination?.speech?.productivity
        : "",
      speed: editMentalExamination
        ? editMentalExamination?.speech?.speed
        : ptLatestMentalExamination
        ? ptLatestMentalExamination?.speech?.speed
        : "",
      relevance: editMentalExamination
        ? editMentalExamination?.speech?.relevance
        : ptLatestMentalExamination
        ? ptLatestMentalExamination?.speech?.relevance
        : "",
      coherence: editMentalExamination
        ? editMentalExamination?.speech?.coherence
        : ptLatestMentalExamination
        ? ptLatestMentalExamination?.speech?.coherence
        : "",
      goalDirection: editMentalExamination
        ? editMentalExamination?.speech?.goalDirection
        : ptLatestMentalExamination
        ? ptLatestMentalExamination?.speech?.goalDirection
        : "",

      // affect: editMentalExamination ? editMentalExamination?.mood?.affect : ptLatestMentalExamination ? ptLatestMentalExamination?.mood?.affect : "",
      affectNotes: editMentalExamination
        ? editMentalExamination?.mood?.affectNotes
        : ptLatestMentalExamination
        ? ptLatestMentalExamination?.mood?.affectNotes
        : "",
      subjective: editMentalExamination
        ? editMentalExamination?.mood?.subjective
        : ptLatestMentalExamination
        ? ptLatestMentalExamination?.mood?.subjective
        : "",
      // objective: editMentalExamination ? editMentalExamination?.mood?.objective : ptLatestMentalExamination ? ptLatestMentalExamination?.mood?.objective : "",
      // lability: editMentalExamination ? editMentalExamination?.mood?.lability : ptLatestMentalExamination ? ptLatestMentalExamination?.mood?.lability : "",
      // appropriateness1: editMentalExamination ? editMentalExamination?.mood?.appropriateness : ptLatestMentalExamination ? ptLatestMentalExamination?.mood?.appropriateness : "",

      // quality: editMentalExamination ? editMentalExamination?.affectV2?.quality : ptLatestMentalExamination ? ptLatestMentalExamination?.affectV2?.quality : "",
      quality:
        editMentalExamination?.affectV2?.quality ??
        editMentalExamination?.mood?.affect ??
        ptLatestMentalExamination?.affectV2?.quality ??
        ptLatestMentalExamination?.mood?.affect ??
        "",
      intensity: editMentalExamination
        ? editMentalExamination?.affectV2?.intensity
        : ptLatestMentalExamination
        ? ptLatestMentalExamination?.affectV2?.intensity
        : "",
      mobility: editMentalExamination
        ? editMentalExamination?.affectV2?.mobility
        : ptLatestMentalExamination
        ? ptLatestMentalExamination?.affectV2?.mobility
        : "",
      range: editMentalExamination
        ? editMentalExamination?.affectV2?.range
        : ptLatestMentalExamination
        ? ptLatestMentalExamination?.affectV2?.range
        : "",
      reactivity: editMentalExamination
        ? editMentalExamination?.affectV2?.reactivity
        : ptLatestMentalExamination
        ? ptLatestMentalExamination?.affectV2?.reactivity
        : "",
      communicability: editMentalExamination
        ? editMentalExamination?.affectV2?.communicability
        : ptLatestMentalExamination
        ? ptLatestMentalExamination?.affectV2?.communicability
        : "",
      diurnalVariation: editMentalExamination
        ? editMentalExamination?.affectV2?.diurnalVariation
        : ptLatestMentalExamination
        ? ptLatestMentalExamination?.affectV2?.diurnalVariation
        : "",
      appropriateness2: editMentalExamination
        ? editMentalExamination?.affectV2?.appropriateness
        : ptLatestMentalExamination
        ? ptLatestMentalExamination?.affectV2?.appropriateness
        : "",

      delusions: editMentalExamination
        ? editMentalExamination?.thought?.delusions
        : ptLatestMentalExamination
        ? ptLatestMentalExamination?.thought?.delusions
        : "",
      delusionNotes: editMentalExamination
        ? editMentalExamination?.thought?.delusionNotes
        : ptLatestMentalExamination
        ? ptLatestMentalExamination?.thought?.delusionNotes
        : "",
      content: editMentalExamination
        ? editMentalExamination?.thought?.content
        : ptLatestMentalExamination
        ? ptLatestMentalExamination?.thought?.content
        : "",
      process: editMentalExamination
        ? editMentalExamination?.thought?.process
        : ptLatestMentalExamination
        ? ptLatestMentalExamination?.thought?.process
        : "",

      perception: editMentalExamination
        ? editMentalExamination?.perception
        : ptLatestMentalExamination
        ? ptLatestMentalExamination?.perception
        : "",
      perceptionNotes: editMentalExamination
        ? editMentalExamination?.perceptionNotes
        : ptLatestMentalExamination
        ? ptLatestMentalExamination?.perceptionNotes
        : "",

      orientation: editMentalExamination
        ? editMentalExamination?.cognition?.orientation
        : ptLatestMentalExamination
        ? ptLatestMentalExamination?.cognition?.orientation
        : "",
      attention: editMentalExamination
        ? editMentalExamination?.cognition?.attention
        : ptLatestMentalExamination
        ? ptLatestMentalExamination?.cognition?.attention
        : "",
      concentration: editMentalExamination
        ? editMentalExamination?.cognition?.concentration
        : ptLatestMentalExamination
        ? ptLatestMentalExamination?.cognition?.concentration
        : "",
      memory: editMentalExamination
        ? editMentalExamination?.cognition?.memory
        : ptLatestMentalExamination
        ? ptLatestMentalExamination?.cognition?.memory
        : "",

      grade: editMentalExamination
        ? editMentalExamination?.insight?.grade
        : ptLatestMentalExamination
        ? ptLatestMentalExamination?.insight?.grade
        : "",

      judgment: editMentalExamination
        ? editMentalExamination?.judgment
        : ptLatestMentalExamination
        ? ptLatestMentalExamination?.judgment
        : "",

      remarks: editMentalExamination
        ? editMentalExamination?.remarks
        : ptLatestMentalExamination
        ? ptLatestMentalExamination?.remarks
        : "",

      observation: editMentalExamination
        ? editMentalExamination?.observation
        : ptLatestMentalExamination
        ? ptLatestMentalExamination?.observation
        : "",

      date: chartDate,
      shouldPrintAfterSave,
      chart: MENTAL_EXAMINATION,
      type,
    },
    validationSchema: Yup.object({
      patient: Yup.string().required("Patient is required"),
      center: Yup.string().required("Center is required"),
      chart: Yup.string().required("Chart is required"),
    }),
    onSubmit: (values) => {
      let action;
      if (editMentalExamination) {
        action = updateMentalExamination({
          id: editChartData._id,
          chartId: editMentalExamination._id,
          ...values,
        });
      } else if (type === "GENERAL") {
        action = addGeneralMentalExamination(values);
      } else {
        action = addMentalExamination(values);
      }
      dispatch(action)
        .unwrap()
        .then(() => onNoteSaved?.())
        .catch(() => {});
    },
  });

  // useEffect(() => {
  //     if (!editMentalExamination) {
  //         validation.resetForm();
  //     }
  // }, [dispatch, editMentalExamination]);

  const closeForm = () => {
    dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
    validation.resetForm();
  };

  return (
    <Form onSubmit={validation.handleSubmit}>
      <RenderFields
        fields={mentalExaminationV2Fields}
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

MentalExamination.propTypes = {
  patient: PropTypes.object,
  author: PropTypes.object,
  chartDate: PropTypes.any,
  editChartData: PropTypes.object,
  type: PropTypes.string.isRequired,
  patientLatestMentalExamination: PropTypes.object,
};

const mapStateToProps = (state) => ({
  // patient: state.Patient.patient,
  patient: state.Chart.chartForm?.patient,
  appointment: state.Chart.chartForm.appointment,
  author: state.User.user,
  chartDate: state.Chart.chartDate,
  editChartData: state.Chart.chartForm?.data,
  shouldPrintAfterSave: state.Chart.chartForm.shouldPrintAfterSave,
  type: state.Chart.chartForm.type,
  patientLatestMentalExamination: state.Chart.patientLatestMentalExamination,
});

export default connect(mapStateToProps)(MentalExamination);
