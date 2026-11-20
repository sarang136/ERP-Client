import { useEffect, useState } from "react";
import PrintHeader from "./printheader";

const AdmWithHighSupport = ({ register, patient, details, chartData }) => {
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
    textAlign: "center",
    fontSize: "17px",
    marginBottom: "2px",
  };
  const subHeading = {
    fontWeight: "bold",
    textAlign: "center",
    fontSize: "14px",
    marginBottom: "15px",
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
  const fullLine = {
    border: "none",
    borderBottom: "1px solid #000",
    width: "100%",
    marginTop: "3px",
    fontSize: "12px",
  };

  const [age, setAge] = useState("");

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

  const getDoctorAbbreviated = (name) => {
    if (!name) return "";
    const withoutPrefix = name.replace(/^dr\.?\s*/i, "").trim();
    const parts = withoutPrefix.split(/\s+/).filter(Boolean);
    if (!parts.length) return name;
    return `Dr. ${parts[parts.length - 1]}`;
  };

  const [today, setToday] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [advanceDirective, setAdvanceDirective] = useState("not_written");

  useEffect(() => {
    const localISODate = new Date().toISOString().split("T")[0];
    setToday(localISODate);
    setGuardianName(patient?.guardianName);
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
      <div style={heading}>Request For Admissions With High Support Needs</div>
      <div style={subHeading}>
        Jagruti Rehabilitation Centre (MHCA 2017 Section 89)
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: "10px",
        }}
      >
        <div>
          To, <br />
          The Psychiatrist, <br />
          Unit
          <input
            type="text"
            value={getDoctorAbbreviated(patient?.doctorData?.name)}
            {...register("Indipendent_Admission_Support_unit")}
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
              ...inputLine,
            }}
          />{" "}
          Department of Psychiatry <br />
          Jagruti Rehabilitation Centre.
        </div>
        <div>
          Date:
          <input
            type="date"
            defaultValue={today}
            {...register("Indipendent_Admission_Support_date", {
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
      </div>
      <p>Sir/Madam,</p>
      <p>
        I Mr./Mrs./Ms.
        <input
          type="text"
          defaultValue={guardianName}
          {...register("Indipendent_Admission_Support_name")}
          style={{
            fontWeight: "bold",
            textTransform: "uppercase",
            ...fullLine,
          }}
        />{" "}
        residing at
        <input
          type="text"
          value={patient?.address}
          {...register("Indipendent_Admission_Support_address")}
          style={{
            fontWeight: "bold",
            textTransform: "uppercase",
            ...fullLine,
          }}
        />{" "}
        Nominated representative Mr./Mrs./Ms.
        <input
          type="text"
          value={patient?.name}
          {...register("Indipendent_Admission_Support_nominatedRep")}
          style={inputLine}
        />{" "}
        of UID No.
        <input
          type="text"
          // value={details?.IPDnum}
          value={patient?.id?.value}
          {...register("Indipendent_Admission_Support_ipd")}
          style={{
            fontWeight: "bold",
            textTransform: "uppercase",
            ...inputLine,
          }}
        />{" "}
        age
        <input
          type="text"
          value={chartData?.detailAdmission?.detailAdmission?.age || age}
          {...register("Indipendent_Admission_Support_age")}
          style={{
            border: "none",
            borderBottom: "1px solid #000",
            width: "60px",
            marginLeft: "5px",
            marginRight: "5px",
            fontWeight: "bold",
            textTransform: "uppercase",
          }}
        />{" "}
        request for his/her admission in your establishment for treatment of
        mental illness.
      </p>
      <p>
        Mr./Mrs./Ms.
        <input
          type="text"
          value={patient?.name}
          readOnly
          {...register("Indipendent_Admission_Support_patientName")}
          style={{
            fontWeight: "bold",
            textTransform: "uppercase",
            ...inputLine,
          }}
        />{" "}
        <span data-pdf-hide="true" style={{ marginRight: "6px" }}>
          {["has_written", "not_written"].map((opt) => (
            <label key={opt} style={{ marginRight: "10px", cursor: "pointer" }}>
              <input
                type="radio"
                name="advanceDirective"
                value={opt}
                checked={advanceDirective === opt}
                onChange={() => setAdvanceDirective(opt)}
                style={{ marginRight: "4px" }}
              />
              {opt === "has_written" ? "Has Written" : "Not Written"}
            </label>
          ))}
        </span>
        <span
          style={{
            fontWeight: "bold",
            borderBottom: "1px solid #000",
            minWidth: "80px",
            display: "inline-block",
          }}
        >
          {advanceDirective === "has_written"
            ? "Has Written"
            : advanceDirective === "not_written"
            ? "Not Written"
            : ""}
        </span>{" "}
        Advance Directive.
      </p>
      <p>
        A self-attested copy of my identity Proof is enclosed.
        <br />
        Kindly admit him/her in your mental health establishment as patient with
        high support needs.
      </p>
      <p>
        Address
        <input
          type="text"
          value={patient?.address}
          {...register("Indipendent_Admission_Support_fullAddress")}
          style={{
            fontWeight: "bold",
            textTransform: "uppercase",
            ...fullLine,
          }}
        />
      </p>
      <p>
        Mob.
        <input
          type="text"
          value={patient?.guardianPhoneNumber}
          {...register("Indipendent_Admission_Support_mobile")}
          style={{
            fontWeight: "bold",
            textTransform: "uppercase",
            ...inputLine,
          }}
        />{" "}
        Alternate Mob./Landline No.
        <input
          type="text"
          {...register("Indipendent_Admission_Support_altMobile")}
          style={inputLine}
        />{" "}
        Email
        <input
          type="text"
          {...register("Indipendent_Admission_Support_email")}
          style={{ ...inputLine, textTransform: "none" }}
        />
      </p>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "20px",
        }}
      >
        <div>
          <div style={{ display: "flex" }}>
            Signature of NR:
            <div
              style={{
                fontWeight: "bold",
                textTransform: "uppercase",
              }}
            >
              <input
                type="text"
                {...register("Indipendent_Admission_adult_guardianName3")}
                style={{
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  ...fullLine,
                }}
              />
            </div>
          </div>
          <br />
          NR Name:
          <input
            type="text"
            value={patient?.guardianName}
            {...register("Indipendent_Admission_Support_newGuardianName")}
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
              ...fullLine,
            }}
          />
          <br />
          NR Mobile:
          <input
            type="text"
            value={patient?.guardianPhoneNumber}
            {...register("Indipendent_Admission_Support_newGuardianMobile")}
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
              ...fullLine,
            }}
          />
          <br />
          Date
          <input type="date" defaultValue={today} style={fullLine} />
        </div>
      </div>
      <p style={{ marginTop: "20px", fontSize: "11px" }}>
        <b>N.B.:</b> Please strike off those which are not required.
      </p>
    </div>
  );
};
export default AdmWithHighSupport;
