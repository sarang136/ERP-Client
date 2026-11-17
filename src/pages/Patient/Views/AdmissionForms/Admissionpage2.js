import { useEffect } from "react";
import PrintHeader from "./printheader";

const HIGHER_ADMISSION_FEE_CENTERS = [
  "Pune",
  "Malad-West",
  "Malad-East",
  "Nashik",
];

const Admissionpage2 = ({ register, patient, details }) => {
  const admissionFee = HIGHER_ADMISSION_FEE_CENTERS.includes(
    patient?.center?.title,
  )
    ? 1200
    : 1000;

  const loggedInUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("authUser"))?.data || {};
    } catch {
      return {};
    }
  })();
  const loggedInUserName = loggedInUser.name || "";
  const loggedInUserPhone = loggedInUser.phoneNumber || "";

  const pageContainer = {
    margin: "0 auto",
    padding: "15mm",
    boxSizing: "border-box",
    backgroundColor: "#fff",
    pageBreakAfter: "always",
    fontFamily: "Arial, sans-serif",
    fontSize: "12px",
    width: "100%",
    maxWidth: "800px",
  };

  const consentPara = {
    marginBottom: "6px",
    textAlign: "justify",
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

  const signatureBox = {
    border: "1px solid #000",
    padding: "8px",
    width: "48%",
    minHeight: "50px",
    boxSizing: "border-box",
  };

  const signatureRow = {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "15px",
  };

  useEffect(() => {
    if (details) {
      document.querySelector(
        '[name="Basic_Admission_Form_semiPrivate"]',
      ).value = details?.toPay || "";
      document.querySelector('[name="Basic_Admission_Form_private"]').value =
        details?.semiprivate || "";
      document.querySelector('[name="Basic_Admission_Form_roomtype"]').value =
        details?.roomtype || "";
      document.querySelector(
        '[name="Basic_Admission_Form_advanceDeposit"]',
      ).value = details?.advDeposit || "";
    }

    if (patient) {
      document.querySelector('[name="Basic_Admission_Form_patientRep"]').value =
        patient?.name || "";
      document.querySelector('[name="Basic_Admission_Form_relation"]').value =
        patient?.guardianRelation || "";
      document.querySelector(
        '[name="Basic_Admission_Form_witnessName"]',
      ).value = patient?.guardianName || "";
      document.querySelector(
        '[name="Basic_Admission_Form_relationWitness"]',
      ).value = patient?.guardianRelation || "";
    }

    document.querySelector('[name="Basic_Admission_Form_dateWitness"]').value =
      new Date().toISOString().split("T")[0] || "";

    document.querySelector('[name="Basic_Admission_Form_dateStaff"]').value =
      new Date().toISOString().split("T")[0] || "";

    document.querySelector('[name="Basic_Admission_Form_staffName"]').value =
      loggedInUserName;

    document.querySelector('[name="Basic_Admission_Form_dateRep"]').value =
      new Date().toISOString().split("T")[0] || "";
  }, [details, patient]);

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
      {/* Points 10-19 */}
      <div style={consentPara}>
        10) I am informed and I am willing to pay Rs
        <input
          type="text"
          defaultValue={details?.toPay}
          readOnly
          {...register("Basic_Admission_Form_semiPrivate")}
          style={{
            fontWeight: "bold",
            textTransform: "uppercase",
            ...inputLine,
          }}
        />{" "}
        Monthly and
        <input
          type="text"
          defaultValue={details?.semiprivate}
          readOnly
          {...register("Basic_Admission_Form_private")}
          style={{
            fontWeight: "bold",
            textTransform: "uppercase",
            ...inputLine,
          }}
        />{" "}
        Daily for
        <input
          type="text"
          defaultValue={details?.roomtype}
          readOnly
          {...register("Basic_Admission_Form_roomtype")}
          style={{
            fontWeight: "bold",
            textTransform: "uppercase",
            ...inputLine,
            minWidth: "300px",
          }}
        />
        Room as residential charges, a refundable advance deposit of
        <input
          type="text"
          defaultValue={details?.advDeposit}
          readOnly
          {...register("Basic_Admission_Form_advanceDeposit")}
          style={{
            fontWeight: "bold",
            textTransform: "uppercase",
            ...inputLine,
          }}
        />{" "}
        and a non refundable admission fees of Rs. {admissionFee}/- at the time
        of admission. Also,{" "}
        <span style={{ fontWeight: "bold" }}>
          minimum 5 days of initial fees
        </span>{" "}
        is compulsory. If discharge is taken within 25 days of admission,{" "}
        <span style={{ fontWeight: "bold" }}>then Daily Charges</span> will be
        applicable.
      </div>

      <div style={consentPara}>
        11) The monthly fee will cover the cost of accommodation, food & other
        necessary psycho Social Interventions such as Individual Counseling,
        Group Therapy, Personal Hygiene Supervision, Gym Fee, Yoga Therapy,
        Music Therapy, Play Therapy, Art Therapy, Mediation And Spiritual
        Techniques, Vocational Training etc. However Following Expenses Would Be
        Charged Extra
        <br />
        <br />
        A) Psychiatric Consultation &nbsp; B) Psychiatric Medicine &nbsp; C)
        General Consultation If Any <br />
        D) General Medicines &nbsp; E) Family Member Counseling & Education{" "}
        <br />
        F) Pathological Tests, X-Ray, F2 Psychodiagnostic tests Etc. <br />
        G) All Personal Expenditure Such As Soaps, Toothbrush, Oil Or Any
        Personal Article Bought <br />
        H) Washing Of Clothes And Ironing, If Any <br />
        I) Any Eatable Or A Special Diet Given Other Then Common Food Provide{" "}
        <br />
        J) Picnic, Movie, Lunch Out Etc. &nbsp; K) Special Attendant
      </div>

      {[
        "If in case of any physical ailment, sickness, contagious disease or any other medical emergency, Jagruti Rehabilitation Centre holds all rights to conduct required tests ,transfer patient to any other Hospital, give him any immediate treatment including surgery in that case. Payment for all the medical Bills & hospital etc. shall be paid by me and Jagruti Rehabilitation Centre shall not be held Responsible for the same.",
        "The monthly fees and other extra expenditure should be paid 10 days before billing cycle. In case of delay in payment then Jagruti Rehabilitation Centre will discharge the patient & complete the discharge procedure & I will not blame Jagruti Rehabilitation Centre for the same.",
        "The fact that the Resident is temporally in the care of Jagruti Rehabilitation Centre, it offers no protection in law. Criminal acts including attempted or actual suicide while as a resident are subject to legal action & Jagruti Rehabilitation Centre accepts no responsibility in this connection.",
        "I do understand that wandering tendencies, absconding, suicidal tendencies, violent Behavior, Suspiciousness etc. are few of the symptoms of mental illness and I will not hold Jagruti Rehabilitation Centre responsible for the same.",
        "I understand that although the patient is under treatment in Jagruti Rehabilitation Centre, there could be some unfortunate incidents such as accidents of any kind, fracture due to fall, any accident while playing games & any type of illness & even to the extent of death can happen to the patient. In case of any such incidents I would not blame Jagruti Rehabilitation Centre for the same.",
        "We will meet the patient only if approved by the Chief Medical Officer.",
        "Residents are required to follow all the or general Rules and Regulation of the Center & in particular to refrain from violence whether to self others & property, use of drugs other than those duly prescribed & engaging in sexual activities in the center.",
        "The admission & discharge rights are reserved with the management.",
      ].map((point, i) => (
        <div key={i} style={consentPara}>
          {i + 12}) {point}
        </div>
      ))}

      {/* Signature Section */}
      <div style={signatureRow}>
        <div style={signatureBox}>
          <div>
            Name of Patient / Representative:
            <input
              type="text"
              defaultValue={patient?.name}
              readOnly
              {...register("Basic_Admission_Form_patientRep")}
              style={{
                border: "none",
                width: "100%",
                marginTop: "5px",
                fontWeight: "bold",
                textTransform: "uppercase",
              }}
            />
          </div>
          <div>
            Relation:
            <input
              type="text"
              defaultValue={patient?.guardianRelation}
              readOnly
              {...register("Basic_Admission_Form_relation")}
              style={{
                border: "none",
                width: "100%",
                marginTop: "5px",
                fontWeight: "bold",
                textTransform: "uppercase",
              }}
            />
          </div>
          <div>
            Date:
            <input
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              readOnly
              {...register("Basic_Admission_Form_dateRep", {
                setValueAs: (val) => {
                  if (!val) return "";
                  const [year, month, day] = val.split("-");
                  return `${day}/${month}/${year}`; // convert to DD/MM/YYYY
                },
              })}
              style={{ border: "none", marginTop: "5px" }}
            />{" "}
            Signature:
          </div>
        </div>
      </div>

      <div style={signatureRow}>
        <div style={signatureBox}>
          Staff Name:
          <input
            type="text"
            defaultValue={loggedInUserName}
            readOnly
            {...register("Basic_Admission_Form_staffName")}
            style={{
              border: "none",
              width: "100%",
              marginTop: "5px",
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
          />
          {loggedInUserPhone && (
            <div style={{ fontSize: "11px", marginTop: "2px" }}>
              Contact: {loggedInUserPhone}
            </div>
          )}
          <div>
            Date:
            <input
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              readOnly
              {...register("Basic_Admission_Form_dateStaff", {
                setValueAs: (val) => {
                  if (!val) return "";
                  const [year, month, day] = val.split("-");
                  return `${day}/${month}/${year}`; // convert to DD/MM/YYYY
                },
              })}
              style={{ border: "none", marginTop: "5px" }}
            />{" "}
            Signature:
          </div>
        </div>
        <div style={signatureBox}>
          Witness’s Name:
          <input
            type="text"
            defaultValue={patient?.guardianName}
            readOnly
            {...register("Basic_Admission_Form_witnessName")}
            style={{
              border: "none",
              width: "100%",
              marginTop: "5px",
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
          />
          <div>
            Relation:
            <input
              type="text"
              defaultValue={patient?.guardianRelation}
              readOnly
              {...register("Basic_Admission_Form_relationWitness")}
              style={{
                border: "none",
                width: "100%",
                marginTop: "5px",
                fontWeight: "bold",
                textTransform: "uppercase",
              }}
            />
          </div>
          <div>
            Date:
            <input
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              readOnly
              {...register("Basic_Admission_Form_dateWitness", {
                setValueAs: (val) => {
                  if (!val) return "";
                  const [year, month, day] = val.split("-");
                  return `${day}/${month}/${year}`; // convert to DD/MM/YYYY
                },
              })}
              style={{ border: "none", marginTop: "5px" }}
            />{" "}
            Signature:
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admissionpage2;
