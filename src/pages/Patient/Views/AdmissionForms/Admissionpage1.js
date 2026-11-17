import { useEffect, useState } from "react";
import PrintHeader from "./printheader";
import Select from "react-select";
import { getICDCodes } from "../../../../helpers/backend_helper";

const Admissionpage1 = ({ register, admissions, patient, details, chartData }) => {
  const pageContainer = {
    margin: "0 auto",
    padding: "15mm",
    boxSizing: "border-box",
    backgroundColor: "#fff",
    pageBreakAfter: "always",
    fontFamily: "Arial, sans-serif",
    fontSize: "14px",
    width: "100%",
    maxWidth: "800px",
  };

  const heading = {
    fontWeight: "bold",
    fontSize: "17px",
    textAlign: "center",
    marginBottom: "5px",
    textTransform: "uppercase",
  };

  const formRow = {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "5px",
  };

  const label = { fontWeight: "bold" };

  const inputLine = {
    border: "none",
    borderBottom: "1px solid #000",
    flex: "1",
    minWidth: "100px",
    maxWidth: "250px",
    margin: "0 5px",
    fontSize: "13px",
  };

  const fullWidthInput = {
    border: "none",
    borderBottom: "1px solid #000",
    width: "100%",
    marginLeft: "5px",
  };

  const consentHeading = {
    fontWeight: "bold",
    marginTop: "15px",
    marginBottom: "8px",
    textAlign: "center",
  };

  const consentPara = {
    marginBottom: "6px",
    textAlign: "justify",
  };

  const [age, setAge] = useState("");
  const [icdOptions, setIcdOptions] = useState([]);
  const [provisionalDxValue, setProvisionalDxValue] = useState([]);

  const calculateAge = (dob) => {
    if (!dob) return "";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  useEffect(() => {
    if (patient?.dateOfBirth) {
      const calculatedAge = calculateAge(patient.dateOfBirth);
      setAge(calculatedAge.toString());
    }
  }, [patient]);

  useEffect(() => {
    getICDCodes()
      .then((response) => {
        const formatted = response.map((item) => ({
          value: item._id,
          label: `${item.code} - ${item.text}`,
        }));
        setIcdOptions(formatted);
      })
      .catch(() => setIcdOptions([]));
  }, []);

  // Pre-select all provisional diagnoses from the latest Detail Admission chart
  useEffect(() => {
    if (!icdOptions.length) return;
    const pds = chartData?.detailAdmission?.doctorSignature?.provisionaldiagnosis;
    if (!pds?.length) return;
    const matched = pds
      .map((pd) => icdOptions.find((opt) => opt.value === pd.code_id))
      .filter(Boolean);
    if (matched.length) setProvisionalDxValue(matched);
  }, [icdOptions, chartData]);

  return (
    <div style={pageContainer}>
      <style>
        {`
          /* Responsive adjustments */
          @media (max-width: 768px) {
            input {
              width: 100% !important;
              margin: 5px 0 !important;
              display: block;
            }
            ol {
              padding-left: 20px !important;
            }
          }

          /* Print-specific styles */
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            input {
              border: none;
              border-bottom: 1px solid #000;
              font-size: 12px;
              text-transform: uppercase;
            }
          }
        `}
      </style>
      <div style={{ marginBottom: "20px" }}>
        {/* <PrintHeader patient={patient} pageWidth={window.innerWidth} /> */}
        <PrintHeader patient={patient} pageWidth={window.innerWidth} />

      </div>
      {/* Heading */}
      <div style={heading}>ADMISSION FORM</div>

      {/* Patient Info */}
      <div style={formRow}>
        <div>
          <span style={label}>Patient's Name :</span>
          <input
            type="text"
            value={patient?.name}
            readOnly
            {...register("Basic_Admission_Form_patientName")}
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
              ...inputLine,
            }}
          />
        </div>
        <div>
          <span style={label}>UID :</span>
          <input
            type="text"
            value={patient?.id?.value}
            readOnly
            {...register("Basic_Admission_Form_uid")}
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
              ...inputLine,
            }}
          />
        </div>
        <div>
          <span style={label}>Age :</span>
          <input
            type="text"
            value={chartData?.detailAdmission?.detailAdmission?.age || age}
            readOnly
            {...register("Basic_Admission_Form_age")}
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
              ...inputLine,
              width: "50px",
            }}
          />
        </div>
      </div>

      <div style={formRow}>
        <div>
          <span style={label}>Sex :</span>
          <input
            type="text"
            value={patient?.gender}
            readOnly
            {...register("Basic_Admission_Form_sex")}
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
              ...inputLine,
              width: "60px",
            }}
          />
        </div>
        <div>
          <span style={label}>Room Selection :</span>
          <input
            type="text"
            value={`${details?.ward}/ ${details?.bed}`}
            readOnly
            {...register("Basic_Admission_Form_wardBed")}
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
              ...inputLine,
            }}
          />
        </div>
      </div>

      <div style={{ marginBottom: "5px" }}>
        <span style={label}>Address :</span>
        <input
          type="text"
          value={patient?.address}
          readOnly
          {...register("Basic_Admission_Form_address")}
          style={{
            fontWeight: "bold",
            textTransform: "uppercase",
            ...fullWidthInput,
          }}
        />
      </div>

      <div style={formRow}>
        <div>
          <span style={label}>Referred by Dr. :</span>
          <input
            type="text"
            {...register("Basic_Admission_Form_referredBy")}
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
              ...inputLine,
            }}
          />
        </div>
        <div>
          <span style={label}>Admitted Under Dr. :</span>
          <input
            type="text"
            value={admissions[0]?.doctor?.name}
            readOnly
            {...register("Basic_Admission_Form_admittedUnder")}
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
              ...inputLine,
            }}
          />
        </div>
      </div>

      <div style={formRow}>
        <div>
          <span style={label}>Date of Admission :</span>
          <input
            type="date"
            value={
              admissions?.[0]?.addmissionDate
                ? new Date(admissions[0].addmissionDate)
                  .toISOString()
                  .split("T")[0]
                : ""
            }
            readOnly
            {...register("Basic_Admission_Form_dateAdmission")}
            style={inputLine}
          />
        </div>
        <div>
          <span style={label}>Time :</span>
          <input
            type="text"
            value={new Date(admissions[0]?.addmissionDate).toLocaleString(
              "en-GB",
              {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              }
            )}
            readOnly
            {...register("Basic_Admission_Form_timeAdmission")}
            style={{ ...inputLine, width: "80px" }}
          />{" "}
          AM / PM
        </div>
      </div>

      <div style={{ marginBottom: "5px" }}>
        <span style={label}>Program :</span>
        <select
          {...register("Basic_Admission_Form_program")}
          style={{
            border: "1px solid #ccc",
            borderRadius: "4px",
            marginLeft: "5px",
            fontSize: "13px",
            padding: "2px 4px",
          }}
        >
          <option value="">Select Program</option>
          <option value="Per day">Per day</option>
          <option value="30 days">30 days</option>
          <option value="45 days">45 days</option>
          <option value="90 days">90 days</option>
          <option value="Others">Others</option>
        </select>
      </div>

      <div style={{ marginBottom: "8px", display: "flex", alignItems: "center", flexWrap: "wrap" }}>
        <span style={label}>Provisional Diagnosis :</span>
        <div
          data-pdf-hide="true"
          style={{
            flex: 1,
            minWidth: "200px",
            marginLeft: "5px",
          }}
        >
          <Select
            isMulti
            value={provisionalDxValue}
            onChange={(opt) => setProvisionalDxValue(opt || [])}
            options={icdOptions}
            placeholder="Select Provisional Diagnosis"
            isClearable
          />
        </div>
        <input
          type="hidden"
          value={provisionalDxValue.map((o) => o.label).join(", ")}
          {...register("Basic_Admission_Form_provisionalDiagnosis")}
        />
      </div>

      {/* Consent Section */}
      <div style={consentHeading}>
        Consent for Hospitalization and Undertaking by The Patient / NR
      </div>

      <div style={consentPara}>
        1) I have been well informed by hospital staff about my / patient's
        provisional diagnosis and severity of the illness, current status of
        health and illness, the proposed modality of the treatment, risk
        factors, possibility of the complications, the{" "}
        <span style={{ fontWeight: "bold" }}>prognosis, rules and regulations</span> of the hospital, the
        rough estimation of expenses and approximate duration of hospital stay.
      </div>
      <div style={consentPara}>
        2) I have been fully explained about{" "}
        <span style={{ fontWeight: "bold" }}>
          investigations, medications, their effects and possible ill- effects,
          or untoward reactions
        </span>{" "}
        &amp; possible complications arising due to the illness | medication |
        procedure | surgery
      </div>
      <div style={consentPara}>
        3) I hereby provide my free and voluntary consent for the{" "}
        <span style={{ fontWeight: "bold" }}>necessary investigations</span> (including HIV tests for which
        I have been counseled) and treatment. The doctors have explained me the
        advantages as well as limitations of such investigations.
      </div>
      <div style={consentPara}>
        4) I am sufficiently explained that medicines, infusion bottles and
        infusion sets, surgical implants and stents etc. are not manufactured by
        the hospital and as such hospital or any of its staff cannot be held
        liable for any deficiency in these items. It is also explained to me
        that medications from only authorized and licensed companies are used in
        this hospital.
      </div>
      <div style={consentPara}>
        5) I am aware that I have the opportunity to ask any question / doubt /
        query / clarification about the medical, financial or any other aspect
        of my treatment.
      </div>
      <div style={consentPara}>
        6) If the patient or any of his / her attendant{" "}
        <span style={{ fontWeight: "bold" }}>
          damage any of the hospital property and equipments, we shall be
          responsible
        </span>{" "}
        for it and we will pay for the damage / breakage separately.
      </div>
      <div style={consentPara}>
        7) We are aware of the{" "}
        <span style={{ fontWeight: "bold" }}>
          available facilities and also of non-availability of certain
          facilities
        </span>{" "}
        in this Hospital.
      </div>
      <div style={consentPara}>
        8) We hereby authorize the medical and paramedical staff of this
        hospital to admit and provide assessment, evaluation, investigations and
        medical treatment including administration of drugs during the course of
        the patient's hospitalization.
      </div>
      <div style={consentPara}>
        9) In consideration of this line of treatment, agreed by us, we release
        our doctor, his associates and assistants, the hospital, its personnel
        and any other person participating in patient's care from any
        responsibility whatsoever from any resulting illness, ill effects of
        reactions that patient may get and undertake not to raise any claim or
        take any legal action for damage in any court against doctor in charge
        of this case or other staff member of the hospital. We are signing this
        letter of our free will, without any coercion and obligation. The above
        statements have been explained to us in our mother tongue.
      </div>
    </div>
  );
};

export default Admissionpage1;
