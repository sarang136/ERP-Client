import { useEffect, useState } from "react";
import PrintHeader from "./printheader";

const IndependentAdmAdult = ({ register, patient, details, chartData }) => {
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
    maxWidth: "800px", // keeps it neat on large screens
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
    fontSize: "15px",
    marginBottom: "15px",
  };

  const inputLine = {
    border: "none",
    borderBottom: "1px solid #000",
    flex: "1",
    minWidth: "100px",
    maxWidth: "250px",
    margin: "0 5px",
    fontSize: "14px",
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

  const getDoctorAbbreviated = (name) => {
    if (!name) return "";
    const withoutPrefix = name.replace(/^dr\.?\s*/i, "").trim();
    const parts = withoutPrefix.split(/\s+/).filter(Boolean);
    if (!parts.length) return name;
    return `Dr. ${parts[parts.length - 1]}`;
  };

  useEffect(() => {
    if (patient?.dateOfBirth) {
      const calculatedAge = calculateAge(patient.dateOfBirth);
      setAge(calculatedAge.toString());
    }
  }, [patient]);

  const [today, setToday] = useState("");
  const [guardianName, setGuardianName] = useState("");

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

      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <PrintHeader patient={patient} pageWidth={window.innerWidth} />
      </div>

      <div style={heading}>Request For Independent Admission Adult</div>
      <div style={subHeading}>
        Jagruti Rehabilitation Centre (MHCA 2017 Section 86)
      </div>

      {/* Example section */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: "10px",
        }}
      >
        <div style={{ flex: "1 1 60%" }}>
          To, <br />
          The Psychiatrist, <br />
          Unit
          <input
            type="text"
            value={getDoctorAbbreviated(patient?.doctorData?.name)}
            {...register("Indipendent_Admission_adult_unit")}
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
              ...inputLine,
            }}
          />
          Department of Psychiatry <br />
          Jagruti Rehabilitation Centre.
        </div>
        <div>
          Date:
          <input
            type="date"
            defaultValue={today}
            {...register("Indipendent_Admission_adult_date", {
              setValueAs: (val) => {
                if (!val) return "";
                const [year, month, day] = val.split("-");
                return `${day}/${month}/${year}`;
              },
            })}
            style={inputLine}
          />
        </div>
      </div>

      {/* Salutation */}
      <p>Sir/Madam,</p>

      {/* First Paragraph */}
      <p>
        I Mr./ Mrs./ Ms.
        <input
          type="text"
          value={patient?.name}
          {...register("Indipendent_Admission_adult_name")}
          style={{
            fontWeight: "bold",
            textTransform: "uppercase",
            ...fullLine,
            width: `${Math.max(10, (patient?.name?.length || 0) + 3)}ch`,
          }}
        />{" "}
        UID No.
        <input
          type="text"
          // value={details?.IPDnum}
          value={patient?.id?.value}
          {...register("Indipendent_Admission_adult_ipd")}
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
          {...register("Indipendent_Admission_adult_age")}
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
        residing at
        <input
          type="text"
          value={patient?.address}
          {...register("Indipendent_Admission_adult_address")}
          style={{
            fontWeight: "bold",
            textTransform: "uppercase",
            ...fullLine,
            width: `${Math.max(12, (patient?.address?.length || 0) + 3)}ch`,
          }}
        />{" "}
        have mental illness.
      </p>



      {/* Request Admission */}
      <p>
        I wish to be admitted in your establishment for treatment and request
        you to please admit me as an independent patient.
      </p>

      <p>
        Mr./Mrs/Ms.
        <input
          type="text"
          defaultValue={guardianName}
          {...register("Indipendent_Admission_adult_guardianName")}
          style={{
            fontWeight: "bold",
            textTransform: "uppercase",
            ...inputLine,
          }}
        />{" "}
        who is my
        <input
          type="text"
          value={patient?.guardianRelation}
          {...register("Indipendent_Admission_adult_guardianRelation")}
          style={{
            fontWeight: "bold",
            textTransform: "uppercase",
            ...inputLine,
          }}
        />{" "}
        (specify relationship) will be supporting me financially during my
        admission period to help in the treatment process.
      </p>

      {/* Identity Proof */}
      <p>A self-attested copy of my identity Proof is enclosed.</p>

      {/* Address */}
      <p>
        Address
        <input
          type="text"
          value={patient?.address}
          {...register("Indipendent_Admission_adult_fullAddress")}
          style={{
            fontWeight: "bold",
            textTransform: "uppercase",
            ...fullLine,
          }}
        />
      </p>
      <p>
        Mobile no
        <input
          type="text"
          value={patient?.guardianPhoneNumber}
          {...register("Indipendent_Admission_adult_mobile")}
          style={{
            fontWeight: "bold",
            textTransform: "uppercase",
            ...inputLine,
          }}
        />{" "}
        Alternative Mobile/Land Line no
        <input
          type="text"
          {...register("Indipendent_Admission_adult_altMobile")}
          style={inputLine}
        />{" "}
        <div>
          Email
          <input
            type="text"
            {...register("Indipendent_Admission_adult_email")}
            style={inputLine}
          />
        </div>
      </p>

      {/* Signature Section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "20px",
        }}
      >
        <div style={{ display: "flex" }}>
          Signature of Patient:
          <div
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
          >
            <input
              type="text"
              {...register("Indipendent_Admission_adult_patientSignature")}
              style={{
                fontWeight: "bold",
                textTransform: "uppercase",
                ...fullLine,
              }}
            />
          </div>
        </div>
        <div>
          Name:
          <input
            type="text"
            value={patient?.name}
            {...register("Indipendent_Admission_adult_guardianName2")}
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
              ...fullLine,
            }}
          />
          <br />
          Date & Time:
          <input
            type="date"
            defaultValue={today}
            {...register("Indipendent_Admission_adult_dateTime")}
            style={fullLine}
          />
        </div>
      </div>

      {/* Note */}
      <p style={{ marginTop: "20px", fontSize: "11px" }}>
        <b>N.B.:</b> Please strike off those which are not required.
      </p>
    </div>
  );
};

export default IndependentAdmAdult;
