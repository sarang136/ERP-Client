import { useEffect } from "react";
import PrintHeader from "./printheader";

const MediactionConcent = ({ register, patient }) => {
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

  const heading = {
    fontWeight: "bold",
    fontSize: "17px",
    textAlign: "center",
    marginBottom: "2px",
  };

  const subHeading = {
    fontWeight: "bold",
    fontSize: "14px",
    textAlign: "center",
    marginBottom: "15px",
  };

  const medicineList = {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "15px",
  };

  const listColumn = {
    listStyle: "none",
    padding: 0,
    margin: 0,
  };

  const li = {
    marginBottom: "4px",
  };

  const inputLine = {
    border: "none",
    borderBottom: "1px solid #000",
    flex: "1",
    minWidth: "100px",
    maxWidth: "250px",
    margin: "0 5px",
    fontSize: "12px",
  };

  const bold = { fontWeight: "bold" };

  useEffect(() => {
    if (patient) {
      document.querySelector('[name="medicationConsent_name"]').value =
        patient?.guardianName || "";
      document.querySelector('[name="medicationConsent_relation"]').value =
        patient?.guardianRelation || "";
      document.querySelector('[name="medicationConsent_patientFull"]').value =
        patient?.name || "";
      document.querySelector('[name="medicationConsent_patientName2"]').value =
        patient?.name || "";
      document.querySelector('[name="medicationConsent_relation2"]').value =
        patient?.guardianRelation || "";
      document.querySelector('[name="medicationConsent_nokName"]').value =
        patient?.guardianName || "";
    }

    // auto-fill today’s date
    const today = new Date().toISOString().split("T")[0];
    document.querySelector('[name="page4_date"]').value = today;
  }, [patient]);

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
        <PrintHeader patient={patient} pageWidth={window.innerWidth} />
      </div>
      {/* Date */}
      <div style={{ textAlign: "right", marginBottom: "5px" }}>
        Date:
        <input
          type="date"
          defaultValue={new Date().toISOString().split("T")[0]}
          readOnly
          {...register("page4_date", {
            setValueAs: (val) => {
              if (!val) return "";
              const [year, month, day] = val.split("-");
              return `${day}/${month}/${year}`; // convert to DD/MM/YYYY
            },
          })}
          style={{
            border: "none",
            borderBottom: "1px solid #000",
            marginLeft: "5px",
          }}
        />
      </div>

      {/* Headings */}
      <div style={heading}>MEDICATION CONSENT</div>
      <div style={subHeading}>(Family)</div>

      {/* Medicines */}
      <div style={medicineList}>
        <ul style={listColumn}>
          <li style={li}>LITHIUM,</li>
          <li style={li}>ANTIPSYCHOTIC MEDICINES,</li>
          <li style={li}>CLOZAPINE,</li>
          <li style={li}>BENZODIAZEPINES,</li>
          <li style={li}>MOOD STABILIZERS,</li>
        </ul>
        <ul style={listColumn}>
          <li style={li}>ANTICHOLINERGIC MEDICATION,</li>
          <li style={li}>MEDICATION FOR DEMENTIA,</li>
          <li style={li}>ANALGESICS AND ANTIPYRETICS,</li>
          <li style={li}>ANTIEPILEPTIC MEDICATION,</li>
        </ul>
        <ul style={listColumn}>
          <li style={li}>ANTI DEPRESSANTS,</li>
          <li style={li}>EMERGENCY MEDICATIONS,</li>
          <li style={li}>IV FLUIDS,</li>
          <li style={li}>INJECTABLES IM/IV,</li>
          <li style={li}>ANTIBIOTICS</li>
        </ul>
      </div>

      {/* Consent Statement */}
      <div style={{ textAlign: "justify", marginBottom: "15px" }}>
        I,
        <input
          type="text"
          defaultValue={patient?.guardianName}
          readOnly
          {...register("medicationConsent_name")}
          style={{
            fontWeight: "bold",
            textTransform: "uppercase",
            ...inputLine,
          }}
        />
        Father/Mother/Son/Daughter/Husband/Wife/NR/NOK
        <input
          type="text"
          defaultValue={patient?.guardianRelation}
          readOnly
          {...register("medicationConsent_relation")}
          style={{
            fontWeight: "bold",
            textTransform: "uppercase",
            ...inputLine,
          }}
        />
        of Mr/Mrs/Miss/Smt
        <input
          type="text"
          defaultValue={patient?.name}
          readOnly
          {...register("medicationConsent_patientFull")}
          style={{
            fontWeight: "bold",
            textTransform: "uppercase",
            ...inputLine,
          }}
        />
        give my full and informed consent for starting any/all of the above
        medication on him/her/other.
      </div>

      <div style={{ textAlign: "justify", marginBottom: "20px" }}>
        I have been explained about the risk and consequences occurring out of
        consumption of Tab. / Cap. / Inj. & I hold no one responsible for the
        adverse consequences due to the use of abovementioned medication.
      </div>

      {/* Signatures */}
      <div style={{ marginTop: "15px" }}>
        <div>
          <span style={bold}>Name of Patient</span>:
          <input
            type="text"
            defaultValue={patient?.name}
            readOnly
            {...register("medicationConsent_patientName2")}
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
              ...inputLine,
            }}
          />
        </div>
        <div>
          <span style={bold}>Relation with the Patient</span>:
          <input
            type="text"
            defaultValue={patient?.guardianRelation}
            readOnly
            {...register("medicationConsent_relation2")}
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
              ...inputLine,
            }}
          />
        </div>
        <div>
          <span style={bold}>Name of NOK</span>:
          <input
            type="text"
            defaultValue={patient?.guardianName}
            readOnly
            {...register("medicationConsent_nokName")}
            style={inputLine}
          />
        </div>
        <div>
          <span style={bold}>Signature of NOK</span>:
          <input
            type="text"
            {...register("medicationConsent_nokSignature")}
            style={inputLine}
          />
        </div>
      </div>
    </div>
  );
};

export default MediactionConcent;
