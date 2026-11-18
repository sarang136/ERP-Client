import React, { useEffect, useMemo, useState } from "react";
import { Button, Form, Row, Col, Label, Spinner } from "reactstrap";
import PropTypes from "prop-types";
import _ from "lodash";

// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";

import {
  DISCHARGE_SUMMARY,
  dischargeSummaryFields,
} from "../../../Components/constants/patient";
import SummaryFields from "./Components/SummaryFields";
import Medicine from "../Dropdowns/Medicine";
import MedicineForm from "../Tables/MedicineForm";
import { format } from "date-fns";

//redux
import { connect, useDispatch } from "react-redux";
import {
  addDischargeSummary,
  createEditChart,
  updateDischargeSummary,
} from "../../../store/actions";
import { setEventChart } from "../../../store/features/booking/bookingSlice";
import { toast } from "react-toastify";
import {
  getAIDischargeSummary,
  validateAISummary,
  validateChart,
  getCurrentMedicines,
} from "../../../helpers/backend_helper";
import {
  getMedicineEndDate,
  validateSchedulesSequential,
} from "../../../helpers/currentMedicines";
import { FaCheck } from "react-icons/fa";
import ValidateConfirmationModal from "./Components/ValidateConfirmationModal";

const DischargeSummary = ({
  author,
  patient,
  chartDate,
  editChartData,
  drugs,
  type,
}) => {
  const dispatch = useDispatch();

  // const [treatment, setTreatment] = useState([]);
  const [dischargeAdvise, setDischargeAdvise] = useState([]);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [geminiResponse, setGeminiResponse] = useState([]);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditVerified, setIsEditVerified] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [validateType, setValidateType] = useState(null);


  const editSummary = editChartData?.dischargeSummary;



  useEffect(() => {
    if (editSummary) {
      setDischargeAdvise(_.cloneDeep(editSummary.medicine));
      // setTreatment(_.cloneDeep(editSummary.treatment));
    }
  }, [editSummary]);

  useEffect(() => {
    if (editSummary || !patient?._id) return;
    getCurrentMedicines(patient._id, type)
      .then((res) => {
        const rows = res?.payload || [];
        const meds = rows
          .map((row) => row.medicine)
          .filter(Boolean)
          .map((entry) => {
            const {
              _id,
              prescribedBy,
              prescribedByUser,
              discontinuedAt,
              discontinuedBy,
              status,
              supersededAt,
              ...medicineFields
            } = entry;
            return _.cloneDeep(medicineFields);
          });
        if (meds.length) setDischargeAdvise(meds);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editSummary, patient?._id, type]);

  const validation = useFormik({
    // enableReinitialize : use this flag when initial values needs to be changed
    enableReinitialize: true,

    initialValues: {
      author: author._id,
      patient: patient._id,
      center: patient.center._id,
      centerAddress: patient.center.title,
      addmission: patient.addmission._id,
      chart: DISCHARGE_SUMMARY,
      diagnosis: editSummary ? editSummary.diagnosis : "",
      presentingSymptoms: editSummary ? editSummary.presentingSymptoms : "",
      /* START MSE AT ADDMISSION */
      mseAddmission: {
        appearance: editSummary ? editSummary.mseAddmission?.appearance : "",
        ecc: editSummary ? editSummary.mseAddmission?.ecc : "",
        speech: editSummary ? editSummary.mseAddmission?.speech : "",
        mood: editSummary ? editSummary.mseAddmission?.mood : "",
        affect: editSummary ? editSummary.mseAddmission?.affect : "",
        thoughts: editSummary ? editSummary.mseAddmission?.thoughts : "",
        perception: editSummary ? editSummary.mseAddmission?.perception : "",
        memory: editSummary ? editSummary.mseAddmission?.memory : "",
        abstractThinking: editSummary
          ? editSummary.mseAddmission?.abstractThinking
          : "",
        socialJudgment: editSummary
          ? editSummary.mseAddmission?.socialJudgment
          : "",
        insight: editSummary ? editSummary.mseAddmission?.insight : "",
      },
      /* END MSE AT ADDMISSION */
      pastHistory: editSummary ? editSummary.pastHistory : "",
      medicalHistory: editSummary ? editSummary.medicalHistory : "",
      familyHistory: editSummary ? editSummary.familyHistory : "",
      personalHistory: {
        smoking: editSummary ? editSummary.personalHistory.smoking : "",
        chewingTobacco: editSummary
          ? editSummary.personalHistory.chewingTobacco
          : "",
        alcohol: editSummary ? editSummary.personalHistory.alcohol : "",
      },
      physicalExamination: {
        temprature: editSummary
          ? editSummary.physicalExamination.temprature
          : "",
        pulse: editSummary ? editSummary.physicalExamination.pulse : "",
        bp: editSummary ? editSummary.physicalExamination.bp : "",
        cvs: editSummary ? editSummary.physicalExamination.cvs : "",
        rs: editSummary ? editSummary.physicalExamination.rs : "",
        abdomen: editSummary ? editSummary.physicalExamination.abdomen : "",
        cns: editSummary ? editSummary.physicalExamination.cns : "",
        others: editSummary ? editSummary.physicalExamination.others : "",
      },
      investigation: editSummary ? editSummary.investigation : "",
      discussion: editSummary ? editSummary.discussion : "",
      refernces: editSummary ? editSummary.refernces : "",
      modifiedTreatment: editSummary ? editSummary.modifiedTreatment : "",
      deportAdministered: editSummary ? editSummary.deportAdministered : "",
      patientStatus: editSummary ? editSummary.patientStatus : "",
      treatment: editSummary ? editSummary.treatment : "",
      /* START MSE AT DISCHARGE */
      mseDischarge: {
        appearance: editSummary ? editSummary.mseDischarge?.appearance : "",
        ecc: editSummary ? editSummary.mseDischarge?.ecc : "",
        speech: editSummary ? editSummary.mseDischarge?.speech : "",
        mood: editSummary ? editSummary.mseDischarge?.mood : "",
        affect: editSummary ? editSummary.mseDischarge?.affect : "",
        thoughts: editSummary ? editSummary.mseDischarge?.thoughts : "",
        perception: editSummary ? editSummary.mseDischarge?.perception : "",
        memory: editSummary ? editSummary.mseDischarge?.memory : "",
        abstractThinking: editSummary
          ? editSummary.mseDischarge?.abstractThinking
          : "",
        socialJudgment: editSummary
          ? editSummary.mseDischarge?.socialJudgment
          : "",
        insight: editSummary ? editSummary.mseDischarge?.insight : "",
      },
      /* END MSE AT DISCHARGE */
      followUp: editSummary ? editSummary.followUp : "",
      note: editSummary ? editSummary.note : "",
      consultantName: editSummary ? editSummary.consultantName : "",
      consultantSignature: editSummary ? editSummary.consultantSignature : "",
      consultantPsychologist: editSummary
        ? editSummary.consultantPsychologist
        : "",
      summaryPreparedBy: editSummary ? editSummary.summaryPreparedBy : "",
      dischargeType: editSummary ? editSummary.dischargeType : "",
      dischargeRoutine: editSummary ? editSummary.dischargeRoutine : "",
      dischargeDate:
        editSummary?.dischargeDate && new Date(editSummary.dischargeDate)
          ? format(new Date(editSummary.dischargeDate), "yyyy-MM-dd")
          : "",
      type,
      date: chartDate,
    },
    validationSchema: Yup.object({}),
    onSubmit: (values) => {
      const hasAnyDose = (dosageAndFrequency) =>
        ["morning", "evening", "night"].some((slot) => {
          const val = dosageAndFrequency?.[slot];
          return val !== undefined && val !== null && val !== "" && Number(val) !== 0;
        });

      for (const med of dischargeAdvise || []) {
        if (med.locked) continue;

        if (med.schedules?.length > 1) {
          const missingDateIdx = med.schedules.findIndex(
            (period) => !period.startDate || !period.endDate,
          );
          if (missingDateIdx !== -1) {
            toast.error(
              `Enter both From and To date for period ${missingDateIdx + 1} (${med.medicine?.name || "a medicine"})`,
            );
            return;
          }

          const error = validateSchedulesSequential(med.schedules);
          if (error) {
            toast.error(`${error} (${med.medicine?.name || "a medicine"})`);
            return;
          }

          const emptyPeriodIdx = med.schedules.findIndex(
            (period) => !hasAnyDose(period.dosageAndFrequency),
          );
          if (emptyPeriodIdx !== -1) {
            toast.error(
              `Enter at least one of Morning/Afternoon/Evening dose for period ${emptyPeriodIdx + 1} (${med.medicine?.name || "a medicine"})`,
            );
            return;
          }
        } else {
          if (!med.startDate || !med.endDate) {
            toast.error(
              `Enter both From and To date (${med.medicine?.name || "a medicine"})`,
            );
            return;
          }

          if (!hasAnyDose(med.dosageAndFrequency)) {
            toast.error(
              `Enter at least one of Morning/Afternoon/Evening dose (${med.medicine?.name || "a medicine"})`,
            );
            return;
          }
        }
      }

      const extraFields =
        geminiResponse && Object.keys(geminiResponse).length > 0
          ? {
            geminiResponseGeneratedBy: author?._id,
            geminiResponseIsVerified: isVerified,
            // validatorId: author?._id
          }
          : {};

      if (editSummary) {
        dispatch(
          updateDischargeSummary({
            id: editChartData._id,
            chartId: editSummary._id,
            // treatment,
            medicine: dischargeAdvise,
            ...values,
            ...extraFields,
          })
        );
      } else {
        dispatch(
          addDischargeSummary({
            ...values,
            // treatment,
            medicine: dischargeAdvise,
            ...extraFields,
          })
        );

      }

      // closeForm();
      localStorage.removeItem("ai_discharge_summary");
    },

  });


  useEffect(() => {
    if (!editSummary) {
      validation.resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, editSummary]);

  const closeForm = () => {
    localStorage.removeItem("ai_discharge_summary");
    dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
    validation.resetForm();
  };

  // const addTreatment = (med, data) => {
  //   if (!med) return;

  //   const checkMedicine = data.find(
  //     (medicine) => medicine.medicine?._id === med._id
  //   );

  //   if (!checkMedicine) {
  //     const medicine = {
  //       medicine: {
  //         _id: med?._id || "",
  //         name: med?.name || med,
  //       },
  //       dosageAndFrequency: {
  //         morning: "1",
  //         evening: "0",
  //         night: "1",
  //       },
  //       instruction: "",
  //       intake: "After food",
  //       duration: "30",
  //       unit: "Day (s)",
  //     };

  //     setTreatment((prevMeds) => [medicine, ...prevMeds]);
  //   }
  // };

  const addDischargeAdvise = (med, data) => {
    if (!med) return;

    const checkMedicine = data.find(
      (medicine) => medicine.medicine?.name === med.name
    );

    if (!checkMedicine) {
      const startDate = chartDate ? new Date(chartDate) : new Date();
      const duration = "10";
      const unit = "Day (s)";
      const medicine = {
        medicine: {
          _id: med?._id || "",
          name: med?.name || med,
          type: med?.type || "TAB",
          strength: med?.strength || "",
          unit: med?.unit || "MG",
        },
        dosageAndFrequency: {
          morning: "1",
          evening: "0",
          night: "1",
        },
        instructions: "",
        intake: "After food",
        duration,
        unit,
        startDate,
        endDate: getMedicineEndDate(startDate, { duration, unit }),
      };

      setDischargeAdvise((prevMeds) => [medicine, ...prevMeds]);
    }
  };



  // const renderTreatment = useMemo(() => {
  //   return (
  //     <Medicine
  //       dataList={drugs}
  //       data={treatment}
  //       setMedicines={setTreatment}
  //       addItem={addTreatment}
  //       fieldName={"name"}
  //       medicines={treatment}
  //     />
  //   );
  // }, [drugs, treatment]);

  // const treatmentForm = useMemo(() => {
  //   return (
  //     treatment?.length > 0 && (
  //       <MedicineForm medicines={treatment} setMedicines={setTreatment} />
  //     )
  //   );
  // }, [treatment]);

  const adviseOnDischarge = useMemo(() => {
    return (
      <Medicine
        dataList={drugs}
        data={dischargeAdvise}
        setMedicines={setDischargeAdvise}
        addItem={addDischargeAdvise}
        fieldName={"name"}
        medicines={dischargeAdvise}
      />
    );
  }, [drugs, dischargeAdvise]);

  const adviseForm = useMemo(() => {
    return (
      dischargeAdvise?.length > 0 && (
        <MedicineForm
          medicines={dischargeAdvise}
          setMedicines={setDischargeAdvise}
          showDates
        />
      )
    );
  }, [dischargeAdvise]);



  const getGeminiSummary = async () => {
    setGenerateLoading(true);
    try {
      const response = await getAIDischargeSummary({
        patient: patient?._id,
        addmission: patient?.addmission?._id,
      });

      const data = response?.data;
      setGeminiResponse(data)
      localStorage.setItem("ai_discharge_summary", JSON.stringify(data));

      const clean = (val) => {
        if (!val) return "";

        if (typeof val === "string") {
          const normalized = val.trim().toLowerCase();

          const invalidValues = [
            "not documented in records",
            "not documented",
            "na",
            "n/a",
            "null",
            "undefined",
            "-"
          ];

          if (invalidValues.includes(normalized)) return "";

          return val.trim();
        }

        return val;
      };

      validation.setValues({
        ...validation.values,

        diagnosis: clean(data.diagnosis),
        presentingSymptoms: clean(data.presentingSymptoms),

        mseAddmission: {
          appearance: clean(data.mseAddmission?.appearance),
          ecc: clean(data.mseAddmission?.ecc),
          speech: clean(data.mseAddmission?.speech),
          mood: clean(data.mseAddmission?.mood),
          affect: clean(data.mseAddmission?.affect),
          thoughts: clean(data.mseAddmission?.thoughts),
          perception: clean(data.mseAddmission?.perception),
          memory: clean(data.mseAddmission?.memory),
          abstractThinking: clean(data.mseAddmission?.abstractThinking),
          socialJudgment: clean(data.mseAddmission?.socialJudgment),
          insight: clean(data.mseAddmission?.insight),
        },

        pastHistory: clean(data.pastHistory),
        medicalHistory: clean(data.medicalHistory),
        familyHistory: clean(data.familyHistory),

        personalHistory: {
          smoking: clean(data.personalHistory?.smoking),
          chewingTobacco: clean(data.personalHistory?.chewingTobacco),
          alcohol: clean(data.personalHistory?.alcohol),
        },

        physicalExamination: {
          temprature: clean(data.physicalExamination?.temprature),
          pulse: clean(data.physicalExamination?.pulse),
          bp: clean(data.physicalExamination?.bp),
          cvs: clean(data.physicalExamination?.cvs),
          rs: clean(data.physicalExamination?.rs),
          abdomen: clean(data.physicalExamination?.abdomen),
          cns: clean(data.physicalExamination?.cns),
          others: clean(data.physicalExamination?.others),
        },

        investigation: clean(data.investigation),
        discussion: clean(data.discussion),
        refernces: clean(data.refernces),
        modifiedTreatment: clean(data.modifiedTreatment),
        deportAdministered: clean(data.deportAdministered),
        patientStatus: clean(data.patientStatus),

        treatment: clean(data.treatment),

        mseDischarge: {
          appearance: clean(data.mseDischarge?.appearance),
          ecc: clean(data.mseDischarge?.ecc),
          speech: clean(data.mseDischarge?.speech),
          mood: clean(data.mseDischarge?.mood),
          affect: clean(data.mseDischarge?.affect),
          thoughts: clean(data.mseDischarge?.thoughts),
          perception: clean(data.mseDischarge?.perception),
          memory: clean(data.mseDischarge?.memory),
          abstractThinking: clean(data.mseDischarge?.abstractThinking),
          socialJudgment: clean(data.mseDischarge?.socialJudgment),
          insight: clean(data.mseDischarge?.insight),
        },

        followUp: clean(data.followUp),
        note: clean(data.note),
        consultantName: clean(data.consultantName),
        consultantPsychologist: clean(data.consultantPsychologist),
        summaryPreparedBy: clean(data.summaryPreparedBy),
        dischargeType: clean(data.dischargeType),
        dischargeRoutine: clean(data.dischargeRoutine),
        dischargeDate:
          data.dischargeDate &&
            data.dischargeDate !== "Not documented in records"
            ? data.dischargeDate
            : "",
      });

      toast.success(response?.message || "AI-Summary Generated");

    } catch (error) {
      toast.error("Failed to Generate the summary, please try again");
    } finally {
      setGenerateLoading(false)
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("ai_discharge_summary");

    if (saved && !editSummary) {
      const data = JSON.parse(saved);

      const clean = (val) =>
        val === "Not documented in records" ? "" : val;

      validation.setValues({
        ...validation.values,

        diagnosis: clean(data.diagnosis),
        presentingSymptoms: clean(data.presentingSymptoms),

        mseAddmission: {
          appearance: clean(data.mseAddmission?.appearance),
          ecc: clean(data.mseAddmission?.ecc),
          speech: clean(data.mseAddmission?.speech),
          mood: clean(data.mseAddmission?.mood),
          affect: clean(data.mseAddmission?.affect),
          thoughts: clean(data.mseAddmission?.thoughts),
          perception: clean(data.mseAddmission?.perception),
          memory: clean(data.mseAddmission?.memory),
          abstractThinking: clean(data.mseAddmission?.abstractThinking),
          socialJudgment: clean(data.mseAddmission?.socialJudgment),
          insight: clean(data.mseAddmission?.insight),
        },

        pastHistory: clean(data.pastHistory),
        medicalHistory: clean(data.medicalHistory),
        familyHistory: clean(data.familyHistory),

        personalHistory: {
          smoking: clean(data.personalHistory?.smoking),
          chewingTobacco: clean(data.personalHistory?.chewingTobacco),
          alcohol: clean(data.personalHistory?.alcohol),
        },

        physicalExamination: {
          temprature: clean(data.physicalExamination?.temprature),
          pulse: clean(data.physicalExamination?.pulse),
          bp: clean(data.physicalExamination?.bp),
          cvs: clean(data.physicalExamination?.cvs),
          rs: clean(data.physicalExamination?.rs),
          abdomen: clean(data.physicalExamination?.abdomen),
          cns: clean(data.physicalExamination?.cns),
          others: clean(data.physicalExamination?.others),
        },

        investigation: clean(data.investigation),
        discussion: clean(data.discussion),
        refernces: clean(data.refernces),
        modifiedTreatment: clean(data.modifiedTreatment),
        deportAdministered: clean(data.deportAdministered),
        patientStatus: clean(data.patientStatus),
        treatment: clean(data.treatment),

        mseDischarge: {
          appearance: clean(data.mseDischarge?.appearance),
          ecc: clean(data.mseDischarge?.ecc),
          speech: clean(data.mseDischarge?.speech),
          mood: clean(data.mseDischarge?.mood),
          affect: clean(data.mseDischarge?.affect),
          thoughts: clean(data.mseDischarge?.thoughts),
          perception: clean(data.mseDischarge?.perception),
          memory: clean(data.mseDischarge?.memory),
          abstractThinking: clean(data.mseDischarge?.abstractThinking),
          socialJudgment: clean(data.mseDischarge?.socialJudgment),
          insight: clean(data.mseDischarge?.insight),
        },

        followUp: clean(data.followUp),
        note: clean(data.note),
        consultantName: clean(data.consultantName),
        consultantPsychologist: clean(data.consultantPsychologist),
        summaryPreparedBy: clean(data.summaryPreparedBy),
        dischargeType: clean(data.dischargeType),
        dischargeRoutine: clean(data.dischargeRoutine),
        dischargeDate:
          data.dischargeDate &&
            data.dischargeDate !== "Not documented in records"
            ? data.dischargeDate
            : "",
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleValidateResponse = async () => {
    setLoading(true)
    try {
      let response;
      if (editChartData?.geminiResponseIsVerified === false) {
        response = await validateAISummary({ summary: editSummary?._id });
      } else {
        response = await validateChart(editChartData?._id);
      }
      setIsEditVerified(true);
      dispatch({
        type: "editDischargeSummary/fulfilled",
        payload: {
          payload: response.payload,
        },
      });
      if (response?.payload?.type === "OPD" && response.payload.appointment) {
        dispatch(
          setEventChart({
            chart: response.payload,
            appointment: response.payload.appointment,
            patient: response.payload.patient,
          })
        );
      }
      toast.success(response?.message || "Successfully Validated.")

    } catch (error) {
      toast.error(error.message || "Failed to Validate Response")
    }
    finally {
      setLoading(false);
    }
  }



  const toggleModal = () => setIsModalOpen((prev) => !prev);



  return (
    <React.Fragment>
      <div>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            validation.handleSubmit();
            // toggle();
            return false;
          }}
          className="needs-validation"
          action="#"
        >
          {!editSummary && <div className="d-flex align-items-center justify-content-between">
            <Button type="button" onClick={getGeminiSummary} disabled={generateLoading}>
              {generateLoading ? (
                <span className="d-flex align-items-center">
                  <Spinner size="sm" className="me-2" />
                  Generating...
                </span>
              ) : (
                "Generate AI-Summary"
              )}
            </Button>
          </div>}

          <Row className="mt-3">
            {(dischargeSummaryFields.slice(0, 10) || []).map((item, idx) => {
              return (
                <SummaryFields
                  validation={validation}
                  item={item}
                  key={item.name + idx}
                />
              );
            })}
            <Col xs={12} className="my-3">
              <div className="mb-3">
                <Label>Treatment Given</Label>
                <textarea
                  rows="4"
                  bsSize="sm"
                  name={"treatment"}
                  onChange={validation.handleChange}
                  onBlur={validation.handleBlur}
                  value={validation.values.treatment || ""}
                  className="form-control"
                />
              </div>
            </Col>
            {/* <Col xs={12} className="my-3">
              <Label>Treatment given</Label>
              {renderTreatment}
            </Col>
            <Col xs={12}>{treatmentForm}</Col> */}
            {(dischargeSummaryFields.slice(10, 15) || []).map((item, idx) => {
              return (
                <SummaryFields
                  validation={validation}
                  item={item}
                  key={item.name + idx}
                />
              );
            })}
            <Col xs={12} className="my-3">
              <Label>Advise on discharge</Label>
              {adviseOnDischarge}
            </Col>
            <Col xs={12}>{adviseForm}</Col>
            {(dischargeSummaryFields.slice(15, 24) || []).map((item, idx) => {
              return (
                <SummaryFields
                  validation={validation}
                  item={item}
                  key={item.name + idx}
                />
              );
            })}
          </Row>
          <div className="mt-3">
            <div className="d-flex gap-3 justify-content-end">
              {/* geminiResponse && Object.keys(geminiResponse).length > 0 &&  */}
              {
                !editChartData ? (
                  geminiResponse &&
                  Object.keys(geminiResponse).length > 0 && (
                    <Button
                      disabled={loading}
                      onClick={() => {
                        setValidateType("new");
                        toggleModal();
                      }}
                    >
                      {loading ? (
                        <span className="d-flex align-items-center">
                          <Spinner size="sm" className="me-2" />
                          Validating...
                        </span>
                      ) : isVerified ? (
                        <span className="d-flex align-items-center">
                          <FaCheck className="me-2 text-success" />
                          Validated
                        </span>
                      ) : (
                        "Validate"
                      )}
                    </Button>
                  )
                ) : (editChartData && !editChartData.doctorValidatorId && (editChartData.needsValidation || editChartData.geminiResponseIsVerified === false) && !isEditVerified && author?.role === "DOCTOR") ? (
                  <Button
                    type="button"
                    disabled={loading || validation.dirty || (editSummary && !_.isEqual(dischargeAdvise, editSummary.medicine))}
                    title={(validation.dirty || (editSummary && !_.isEqual(dischargeAdvise, editSummary.medicine))) ? "Please save your changes before validating" : ""}
                    onClick={() => {
                      setValidateType("edit");
                      toggleModal();
                    }}
                  >
                    {loading ? <span><Spinner size="sm" />Validating...</span> : "Validate"}
                  </Button>
                ) : null
              }
              <Button
                onClick={closeForm}
                size="sm"
                color="danger"
                type="button"
              >
                Cancel
              </Button>
              <Button size="sm" type="submit">
                Save
                {/* {chart ? "Update" : "Save"} */}
              </Button>
            </div>
          </div>
        </Form>
        <ValidateConfirmationModal
          isOpen={isModalOpen}
          toggle={toggleModal}
          loading={loading}
          isVerified={isVerified}
          onConfirm={async () => {
            if (validateType === "edit") {
              await handleValidateResponse();
            } else if (validateType === "new") {
              setLoading(true);

              setTimeout(() => {
                setIsVerified((prev) => !prev);
                setLoading(false);
              }, 1000);
            }

            toggleModal();
          }}
        />
      </div>
    </React.Fragment>
  );
};

DischargeSummary.propTypes = {
  drugs: PropTypes.array.isRequired,
  patient: PropTypes.object,
  author: PropTypes.object,
  chartDate: PropTypes.any,
  editChartData: PropTypes.object,
  type: PropTypes.string.isRequired,
};

const mapStateToProps = (state) => ({
  drugs: state.Medicine.data,
  patient: state.Patient.patient,
  author: state.User.user,
  chartDate: state.Chart.chartDate,
  editChartData: state.Chart.chartForm?.data,
});

export default connect(mapStateToProps)(DischargeSummary);
