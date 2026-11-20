import { useEffect } from "react";
import PrintHeader from "./printheader";

const AudioVideoConsentForm = ({ register, patient }) => {
  const pageContainer = {
    margin: "0 auto",
    padding: "15mm",
    boxSizing: "border-box",
    backgroundColor: "#fff",
    pageBreakAfter: "always",
    fontFamily: "Arial, sans-serif",
    fontSize: "14px",
    lineHeight: "1.5",
    width: "100%",
    maxWidth: "800px",
  };

  const bold = { fontWeight: "bold" };

  const inputInline = {
    border: "none",
    borderBottom: "1px solid #000",
    flex: "1",
    minWidth: "120px",
    maxWidth: "300px",
    margin: "0 5px",
    fontSize: "14px",
  };

  useEffect(() => {
    if (patient) {
      document.querySelector('[name="consentPatientName"]').value =
        patient?.name || "";

      document.querySelector('[name="nokName"]').value =
        patient?.guardianName || "";

      document.querySelector('[name="relation"]').value =
        patient?.guardianRelation || "";
    }

    const today = new Date().toLocaleDateString("en-GB");
    document.querySelector('[name="consentDate"]').value = today;
  }, [patient]);

  return (
    <div style={pageContainer}>
      <style>
        {`
          @media (max-width: 768px) {
            input:not([type='radio']):not([type='checkbox']) {
              width: 100% !important;
              min-width: 0 !important;
              margin: 5px 0 !important;
              display: block;
            }
          }

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

      <div style={{ marginBottom: "20px", marginTop: "80px" }}>
        <PrintHeader patient={patient} pageWidth={window.innerWidth} />
      </div>

      <div style={{ marginTop: "35px" }}>
        <p style={{ ...bold, fontSize: "16px", textAlign: "center" }}>
          AUDIO / VIDEO RECORDING AND MONITORING CONSENT
        </p>

        <p>
          I,
          <input
            type="text"
            defaultValue={patient?.guardianName}
            readOnly
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
              ...inputInline,
            }}
            {...register("nokName")}
          />
          Father / Mother / Son / Daughter / Husband / Wife / Brother / Sister /
          NR / NOK of
        </p>

        <p>
          Mr / Mrs / Miss / Smt
          <input
            type="text"
            defaultValue={patient?.name}
            readOnly
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
              ...inputInline,
            }}
            {...register("consentPatientName")}
          />
          (Name of Patient)
        </p>

        <p>
          give my full and informed consent for audio and video recording and
          monitoring during admission and treatment at Jagruti Rehab Center.
        </p>

        <p>
          I understand that monitoring is conducted for clinical assessment,
          documentation, monitoring progress, treatment improvement, patient
          safety, incident review, and security purposes. Recording may occur in
          patient rooms or wards, common areas, therapy or consultation rooms,
          corridors, nursing stations, and outdoor premises
        </p>

        <p>
          I understand that private areas such as bathrooms or personal hygiene
          spaces are not monitored, except where legally required during safety
          emergencies.
        </p>

        <p>
          <b>Confidentiality:</b> Recordings are stored securely and accessed
          only by authorized clinical or administrative personnel. They will not
          be used for publicity, external sharing, or social media without
          separate written permission, except where disclosure is required by
          law or regulatory authorities.
        </p>

        <br />

        <p>
          Name of Patient :
          <input
            type="text"
            defaultValue={patient?.name}
            readOnly
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
              ...inputInline,
            }}
            {...register("confirmPatientName")}
          />
        </p>

        <p>
          Relation with the Patient :
          <input
            type="text"
            defaultValue={patient?.guardianRelation}
            readOnly
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
              ...inputInline,
            }}
            {...register("relation")}
          />
        </p>

        <p>
          Name of NOK :
          <input
            type="text"
            defaultValue={patient?.guardianName}
            readOnly
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
              ...inputInline,
            }}
            {...register("confirmNokName")}
          />
        </p>

        <p>
          Signature of NOK :
          <input
            type="text"
            style={inputInline}
            {...register("nokSignature")}
          />
        </p>

        <p>
          Date :
          <input
            type="text"
            defaultValue={new Date().toLocaleDateString("en-GB")}
            readOnly
            style={inputInline}
            {...register("consentDate")}
          />
        </p>
      </div>
    </div>
  );
};

export default AudioVideoConsentForm;
