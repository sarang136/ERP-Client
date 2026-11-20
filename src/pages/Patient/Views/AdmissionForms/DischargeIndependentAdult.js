import { useEffect, useState } from "react";
import PrintHeader from "./printheader";

const DischargeIndependentAdult = ({ register, patient, admissions }) => {
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
      <div style={{ marginBottom: "20px" }}>
        <PrintHeader patient={patient} pageWidth={window.innerWidth} />
      </div>
      <div style={heading}>Request For Discharge By Independent Patient</div>
      <div style={subHeading}>
        Jagruti Rehabilitation Centre (MHCA 2017 Section 88)
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          To, <br />
          The Psychiatrist, <br />
          Unit
          <input
            type="text"
            value={patient?.doctorData?.unit}
            {...register("page10_unit")}
            style={inputLine}
          />{" "}
          Department of Psychiatry, <br />
          Jagruti Rehabilitation Centre.
        </div>
        <div>
          Date:
          <input
            type="date"
            defaultValue={today}
            {...register("page10_date", {
              setValueAs: (val) => {
                if (!val) return "";
                const [year, month, day] = val.split("-");
                return `${day}/${month}/${year}`;
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
      <p>Sir/Madam : Request for Discharge.</p>
      <p>
        I, Mr./Mrs.
        <input
          type="text"
          value={patient?.name}
          {...register("page10_name")}
          style={{
            fontWeight: "bold",
            textTransform: "uppercase",
            ...fullLine,
          }}
        />{" "}
        IPD No.
        <input
          type="text"
          value={admissions?.Ipdnum}
          {...register("page10_ipd")}
          style={{
            fontWeight: "bold",
            textTransform: "uppercase",
            ...inputLine,
          }}
        />{" "}
        aged
        <input
          type="text"
          value={patient?.age}
          {...register("page10_age")}
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
        son/daughter of
        <input
          type="text"
          {...register("page10_parentName")}
          style={inputLine}
        />{" "}
        residing at
        <input
          type="text"
          value={patient?.address}
          {...register("page10_address")}
          style={{
            fontWeight: "bold",
            textTransform: "uppercase",
            ...fullLine,
          }}
        />{" "}
        was admitted in your mental health establishment as an independent
        admission patient on
        <input
          type="text"
          value={
            admissions?.addmissionDate
              ? new Date(admissions.addmissionDate).toLocaleDateString("en-GB")
              : ""
          }
          {...register("page10_admissionDate")}
          style={{
            fontWeight: "bold",
            textTransform: "uppercase",
            ...inputLine,
          }}
        />{" "}
        I now feel better and wish to be discharged. If any other reasons for
        discharge, please mention below :
      </p>
      <ol style={{ marginLeft: "20px", marginBottom: "10px" }}>
        <li>
          <input type="text" {...register("page10_reason1")} style={fullLine} />
        </li>
        <li>
          <input type="text" {...register("page10_reason2")} style={fullLine} />
        </li>
        <li>
          <input type="text" {...register("page10_reason3")} style={fullLine} />
        </li>
      </ol>
      <p>Kindly arrange to discharge me immediately.</p>
      <p>
        Address
        <input
          type="text"
          value={patient?.address}
          {...register("page10_fullAddress")}
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
          value={patient?.phoneNumber}
          {...register("page10_mobile")}
          style={{
            fontWeight: "bold",
            textTransform: "uppercase",
            ...inputLine,
          }}
        />{" "}
        Alternate Mob./Landline No.
        <input
          type="text"
          {...register("page10_altMobile")}
          style={inputLine}
        />{" "}
        Email
        <input
          type="text"
          value={patient?.email}
          {...register("page10_email")}
          style={{
            fontWeight: "bold",
            ...inputLine,
          }}
        />
      </p>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "20px",
        }}
      >
        <div></div>
        <div>
          Signature of Guardian:
          <input
            type="text"
            {...register("page10_guardianSignature")}
            style={fullLine}
          />
          <br />
          Name
          <input
            type="text"
            defaultValue={guardianName}
            {...register("page10_guardianName")}
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
              ...fullLine,
            }}
          />
          <br />
          Date & Time
          <input
            type="date"
            defaultValue={today}
            {...register("page10_dateTime", {
              setValueAs: (val) => {
                if (!val) return "";
                const [year, month, day] = val.split("-");
                return `${day}/${month}/${year}`;
              },
            })}
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
              ...fullLine,
            }}
          />
        </div>
      </div>
      <p style={{ marginTop: "20px", fontSize: "11px" }}>
        <b>N.B.:</b> Please strike off those which are not required.
      </p>
    </div>
  );
};
export default DischargeIndependentAdult;
