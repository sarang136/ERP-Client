import React from "react";
import PropTypes from "prop-types";
import { format } from "date-fns";
import { Col, Row } from "reactstrap";
import Medicine from "../Tables/MedicineChart";
import Divider from "../../../Components/Common/Divider";
import SummaryMse from "./Components/SummaryMse";

const DischargeSummary = ({ data }) => {

  const topCond =
    data?.presentingSymptoms ||
      data?.mseAddmission ||
      data?.pastHistory ||
      data?.medicalHistory ||
      data?.familyHistory
      ? true
      : false;




  return (
    <React.Fragment>
      <Row>

        {data?.dateOfDischarge && (
          <Col xs={12}>
            <div className="mt-1 mb-1">
              <p className="fs-xs-9 fs-md-11 mb-0">
                <span className="display-6 font-semi-bold fs-xs-10 fs-md-14 me-3">
                  Date Of Discharge:-
                </span>
                {format(new Date(data.dateOfDischarge), "dd MMMM yyyy")}
              </p>
            </div>
          </Col>
        )}
        {data?.diagnosis && (
          <Col xs={12}>
            <div className="mt-1 mb-1">
              <p className="fs-xs-9 fs-md-11 mb-0">
                <span className="display-6 font-semi-bold fs-xs-10 fs-md-14 me-3">
                  Diagnosis:-
                </span>
                {data.diagnosis}
              </p>
            </div>
          </Col>
        )}
        {data?.presentingSymptoms && (
          <Col xs={12}>
            <div className="mt-1 mb-1">
              <p className="fs-xs-9 fs-md-11 mb-0">
                <span className="display-6 font-semi-bold fs-xs-10 fs-md-14 me-3">
                  Presenting Symptoms:-
                </span>
                {data.presentingSymptoms}
              </p>
            </div>
          </Col>
        )}
        {/* START MSE AT ADDMISSION */}
        <SummaryMse mse={data?.mseAddmission} title={"MSE at Admission"} />
        {/* START MSE AT ADDMISSION */}
        {data?.pastHistory && (
          <Col xs={12}>
            <div className="mt-1 mb-1">
              <p className="fs-xs-9 fs-md-11 mb-0">
                <span className="display-6 font-semi-bold fs-xs-10 fs-md-14 me-3">
                  Past History:-
                </span>
                {data.pastHistory}
              </p>
            </div>
          </Col>
        )}
        {data?.medicalHistory && (
          <Col xs={12}>
            <div className="mt-1 mb-1">
              <p className="fs-xs-9 fs-md-11 mb-0">
                <span className="display-6 font-semi-bold fs-xs-10 fs-md-14 me-3">
                  Medical History:-
                </span>
                {data.medicalHistory}
              </p>
            </div>
          </Col>
        )}
        {data?.familyHistory && (
          <Col xs={12}>
            <div className="mt-1 mb-1">
              <p className="fs-xs-9 fs-md-11 mb-0">
                <span className="display-6 font-semi-bold fs-xs-10 fs-md-14 me-3">
                  Relevent Family Hisotry:-
                </span>
                {data.familyHistory}
              </p>
            </div>
          </Col>
        )}
        {topCond && (
          <div className="d-block text-center mt-3 mb-3">
            <div
              className="w-100 bg-secondary m-auto"
              style={{ height: "1px" }}
            />
          </div>
        )}
        {data?.personalHistory && (
          <h6 className="fs-xs-12 fs-md-14 display-6">Personal History</h6>
        )}
        {data?.personalHistory?.smoking && (
          <Col xs={12}>
            <div className="mt-1 mb-1">
              <p className="fs-xs-9 fs-md-11 mb-0">
                <span className="display-6 font-semi-bold fs-xs-10 fs-md-14 me-3">
                  Smoking:-
                </span>
                {data.personalHistory.smoking}
              </p>
            </div>
          </Col>
        )}
        {data?.personalHistory?.chewingTobacco && (
          <Col xs={12}>
            <div className="mt-1 mb-1">
              <p className="fs-xs-9 fs-md-11 mb-0">
                <span className="display-6 font-semi-bold fs-xs-10 fs-md-14 me-3">
                  Chewing Tobacco:-
                </span>
                {data.personalHistory.chewingTobacco}
              </p>
            </div>
          </Col>
        )}
        {data?.personalHistory?.alcohol && (
          <Col xs={12}>
            <div className="mt-1 mb-1">
              <p className="fs-xs-9 fs-md-11 mb-0">
                <span className="display-6 font-semi-bold fs-xs-10 fs-md-14 me-3">
                  Alcohol:-
                </span>
                {data.personalHistory.alcohol}
              </p>
            </div>
          </Col>
        )}
        {data?.personalHistory && <Divider />}
        {data?.physicalExamination && (
          <h6 className="fs-xs-12 fs-md-14 display-6">Physical Examination</h6>
        )}
        {data?.physicalExamination?.temprature && (
          <Col xs={12} md={4} lg={3}>
            <div className="mt-1 mb-1">
              <p className="fs-xs-9 fs-md-11 mb-0">
                <span className="display-6 font-semi-bold fs-xs-10 fs-md-14 me-3">
                  Temprature:-
                </span>
                {data.physicalExamination.temprature}
              </p>
            </div>
          </Col>
        )}
        {data?.physicalExamination?.pulse && (
          <Col xs={12} md={4} lg={3}>
            <div className="mt-1 mb-1">
              <p className="fs-xs-9 fs-md-11 mb-0">
                <span className="display-6 font-semi-bold fs-xs-10 fs-md-14 me-3">
                  Pulse:-
                </span>
                {data.physicalExamination.pulse}
              </p>
            </div>
          </Col>
        )}
        {data?.physicalExamination?.bp && (
          <Col xs={12} md={4} lg={3}>
            <div className="mt-1 mb-1">
              <p className="fs-xs-9 fs-md-11 mb-0">
                <span className="display-6 font-semi-bold fs-xs-10 fs-md-14 me-3">
                  Bp:-
                </span>
                {data.physicalExamination.bp}
              </p>
            </div>
          </Col>
        )}
        {data?.physicalExamination?.cvs && (
          <Col xs={12} md={4} lg={3}>
            <div className="mt-1 mb-1">
              <p className="fs-xs-9 fs-md-11 mb-0">
                <span className="display-6 font-semi-bold fs-xs-10 fs-md-14 me-3">
                  CVS:-
                </span>
                {data.physicalExamination.cvs}
              </p>
            </div>
          </Col>
        )}
        {data?.physicalExamination?.rs && (
          <Col xs={12} md={4} lg={3}>
            <div className="mt-1 mb-1">
              <p className="fs-xs-9 fs-md-11 mb-0">
                <span className="display-6 font-semi-bold fs-xs-10 fs-md-14 me-3">
                  RS:-
                </span>
                {data.physicalExamination.rs}
              </p>
            </div>
          </Col>
        )}
        {data?.physicalExamination?.abdomen && (
          <Col xs={12} md={4} lg={3}>
            <div className="mt-1 mb-1">
              <p className="fs-xs-9 fs-md-11 mb-0">
                <span className="display-6 font-semi-bold fs-xs-10 fs-md-14 me-3">
                  Abdomen:-
                </span>
                {data.physicalExamination.abdomen}
              </p>
            </div>
          </Col>
        )}
        {data?.physicalExamination?.cns && (
          <Col xs={12} md={4} lg={3}>
            <div className="mt-1 mb-1">
              <p className="fs-xs-9 fs-md-11 mb-0">
                <span className="display-6 font-semi-bold fs-xs-10 fs-md-14 me-3">
                  CNS:-
                </span>
                {data.physicalExamination.cns}
              </p>
            </div>
          </Col>
        )}
        {data?.physicalExamination?.others && (
          <Col xs={12} md={4} lg={3}>
            <div className="mt-1 mb-1">
              <p className="fs-xs-9 fs-md-11 mb-0">
                <span className="display-6 font-semi-bold fs-xs-10 fs-md-14 me-3">
                  Others:-
                </span>
                {data.physicalExamination.others}
              </p>
            </div>
          </Col>
        )}
        {data?.investigation && (
          <Col xs={12}>
            <div className="mt-1 mb-1">
              <p className="fs-xs-9 fs-md-11 mb-0">
                <span className="display-6 font-semi-bold fs-xs-10 fs-md-14 me-3">
                  Investigation (all reports attached with Discharge Card):-
                </span>
                {data.investigation}
              </p>
            </div>
          </Col>
        )}
        {data?.discussion && (
          <Col xs={12}>
            <div className="mt-1 mb-1">
              <p className="fs-xs-9 fs-md-11 mb-0">
                <span className="display-6 font-semi-bold fs-xs-10 fs-md-14 me-3">
                  DISCUSSION / WARD MANAGMENT:-
                </span>
                {data.discussion}
              </p>
            </div>
          </Col>
        )}
        {data?.treatment?.length > 0 && data.treatment instanceof Array ? (
          <>
            <h6 className="display-6 fs-xs-12 fs-md-14 my-3">
              Given Treatments
            </h6>
            <div className="px-3 pb-3">
              <Medicine medicines={data.treatment} />
            </div>
          </>
        ) : data.treatment ? (
          <Col xs={12}>
            <div className="mt-1 mb-1">
              <p className="fs-xs-9 fs-md-11 mb-0">
                <span className="display-6 font-semi-bold fs-xs-10 fs-md-14 me-3">
                  Given Treatments:-
                </span>
                {data.treatment}
              </p>
            </div>
          </Col>
        ) : (
          ""
        )}
        {/*  */}
        {data?.refernces && (
          <Col xs={12}>
            <div className="mt-1 mb-1">
              <p className="fs-xs-9 fs-md-11 mb-0">
                <span className="display-6 font-semi-bold fs-xs-10 fs-md-14 me-3">
                  Refernces:-
                </span>
                {data.refernces}
              </p>
            </div>
          </Col>
        )}
        {data?.modifiedTreatment && (
          <Col xs={12}>
            <div className="mt-1 mb-1">
              <p className="fs-xs-9 fs-md-11 mb-0">
                <span className="display-6 font-semi-bold fs-xs-10 fs-md-14 me-3">
                  Modified ECT's / Ketamine / Other Treatment::-
                </span>
                {data.modifiedTreatment}
              </p>
            </div>
          </Col>
        )}
        {data?.deportAdministered && (
          <Col xs={12}>
            <div className="mt-1 mb-1">
              <p className="fs-xs-9 fs-md-11 mb-0">
                <span className="display-6 font-semi-bold fs-xs-10 fs-md-14 me-3">
                  LA / Deport Administered:-
                </span>
                {data.deportAdministered}
              </p>
            </div>
          </Col>
        )}
        {data?.patientStatus && (
          <Col xs={12}>
            <div className="mt-1 mb-1">
              <p className="fs-xs-9 fs-md-11 mb-0">
                <span className="display-6 font-semi-bold fs-xs-10 fs-md-14 me-3">
                  PATIENT CONDITION / STATUS AT THE TIME OF DISCHARGE:-
                </span>
                {data.patientStatus}
              </p>
            </div>
          </Col>
        )}

        {/* START MSE AT DISCHARGE */}
        <SummaryMse mse={data?.mseDischarge} title={"MSE at Discharge"} />
        {/* START MSE AT DISCHARGE */}
        {data?.physicalExamination && <Divider />}
        {data?.medicine?.length > 0 && (
          <h6 className="display-6 fs-xs-12 fs-md-14 my-3">
            Advise On Discharge
          </h6>
        )}
        {data?.medicine?.length > 0 && (
          <div className="px-3 pb-3">
            <Medicine medicines={data.medicine} />
          </div>
        )}
        {data?.followUp && (
          <Col xs={12}>
            <div className="mt-1 mb-1">
              <p className="fs-xs-9 fs-md-11 mb-0">
                <span className="display-6 font-semi-bold fs-xs-10 fs-md-14 me-3">
                  Follow Up:-
                </span>
                {data.followUp}
              </p>
            </div>
          </Col>
        )}
        {data?.note && (
          <Col xs={12}>
            <div className="mt-1 mb-1">
              <p className="fs-xs-9 fs-md-11 mb-0">
                <span className="display-6 font-semi-bold fs-xs-10 fs-md-14 me-3">
                  Note:-
                </span>
                {data.note}
              </p>
            </div>
          </Col>
        )}
        {data?.consultantName && (
          <Col xs={12}>
            <div className="mt-1 mb-1">
              <p className="fs-xs-9 fs-md-11 mb-0">
                <span className="display-6 font-semi-bold fs-xs-10 fs-md-14 me-3">
                  Consultant Counsellor's Name:-
                </span>
                {data.consultantName.toUpperCase()}
              </p>
            </div>
          </Col>
        )}
        {data?.signatureOfConsultants && (
          <Col xs={12}>
            <div className="mt-1 mb-1">
              <p className="fs-xs-9 fs-md-11 mb-0">
                <span className="display-6 font-semi-bold fs-xs-10 fs-md-14 me-3">
                  Name And The Signature Of MO/SMO/CMO/Consultant:-
                </span>
                {data.signatureOfConsultants}
              </p>
            </div>
          </Col>
        )}
        {data?.consultantPsychologist && (
          <Col xs={12}>
            <div className="mt-1 mb-1">
              <p className="fs-xs-9 fs-md-11 mb-0">
                <span className="display-6 font-semi-bold fs-xs-10 fs-md-14 me-3">
                  Consultant Psychologist:-
                </span>
                {data.consultantPsychologist.toUpperCase()}
              </p>
            </div>
          </Col>
        )}
        {data?.summaryPreparedBy && (
          <Col xs={12}>
            <div className="mt-1 mb-1">
              <p className="fs-xs-9 fs-md-11 mb-0">
                <span className="display-6 font-semi-bold fs-xs-10 fs-md-14 me-3">
                  Discharge Summary Prepared By:-
                </span>
                {data.summaryPreparedBy}
              </p>
            </div>
          </Col>
        )}
        {data?.typeOfDischarge && (
          <Col xs={12}>
            <div className="mt-1 mb-1">
              <p className="fs-xs-9 fs-md-11 mb-0">
                <span className="display-6 font-semi-bold fs-xs-10 fs-md-14 me-3">
                  Type of Discharge:-
                </span>
                {data.typeOfDischarge}
              </p>
            </div>
          </Col>
        )}
        {data?.dischargeRoutine && (
          <Col xs={12}>
            <div className="mt-1 mb-1">
              <p className="fs-xs-9 fs-md-11 mb-0">
                <span className="display-6 font-semi-bold fs-xs-10 fs-md-14 me-3">
                  Discharge Routine:-
                </span>
                {data.dischargeRoutine}
              </p>
            </div>
          </Col>
        )}
      </Row>
    </React.Fragment>
  );
};

DischargeSummary.propTypes = {
  data: PropTypes.object,
};

export default DischargeSummary;
