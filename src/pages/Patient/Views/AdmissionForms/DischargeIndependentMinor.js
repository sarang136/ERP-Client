import { useEffect, useState } from "react";
import PrintHeader from "./printheader";

const DischargeIndependentMinor = ({ register, patient, admissions }) => {
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
  const [staffName, setStaffName] = useState("");
  const [staffPhone, setStaffPhone] = useState("");

  useEffect(() => {
    const localISODate = new Date().toISOString().split("T")[0];
    setToday(localISODate);
    setGuardianName(patient?.guardianName);
  }, [patient]);

  useEffect(() => {
    try {
      const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
      setStaffName(authUser?.data?.name || "");
      setStaffPhone(authUser?.data?.phoneNumber || "");
    } catch {
      // ignore parse errors
    }
  }, []);

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
      <div style={heading}>Request For Discharge of Minor Patient</div>
      <div style={subHeading}>
        Jagruti Rehabilitation Centre (MHCA 2017 Section 87)
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          To, <br />
          The Psychiatrist, <br />
          The Department of Psychiatry, <br />
          Jagruti Rehabilitation Centre.
        </div>
        <div>
          Date:
          <input
            type="date"
            defaultValue={today}
            {...register("page11_date", {
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
        I, Mr./Mrs./Ms.
        <input
          type="text"
          value={patient?.guardianName}
          {...register("page11_name")}
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
          {...register("page11_address")}
          style={{
            fontWeight: "bold",
            textTransform: "uppercase",
            ...fullLine,
          }}
        />{" "}
        who is the Parent/Care taker being legal guardian of Master/Ms.
        <input
          type="text"
          value={patient?.name}
          {...register("page11_patientName")}
          style={{
            fontWeight: "bold",
            textTransform: "uppercase",
            ...inputLine,
          }}
        />{" "}
        UID No.
        <input
          type="text"
          value={patient?.id?.value}
          {...register("page11_ipd")}
          style={{
            fontWeight: "bold",
            textTransform: "uppercase",
            ...inputLine,
          }}
        />{" "}
        age
        <input
          type="text"
          value={patient?.age}
          {...register("page11_age")}
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
        request for his/her discharge from your establishment under the
        treatment of mental illness.
      </p>
      <p>Kindly arrange to discharge him/her immediately.</p>
      <p>
        Address
        <input
          type="text"
          value={patient?.address}
          {...register("page11_fullAddress")}
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
          {...register("page11_mobile")}
          style={{
            fontWeight: "bold",
            textTransform: "uppercase",
            ...inputLine,
          }}
        />{" "}
        Alternate Mob./Landline No.
        <input
          type="text"
          {...register("page11_altMobile")}
          style={inputLine}
        />{" "}
        Email
        <input
          type="text"
          value={patient?.email}
          {...register("page11_email")}
          style={{
            fontWeight: "bold",
            textTransform: "uppercase",
            ...inputLine,
          }}
        />
      </p>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "20px",
          gap: "20px",
        }}
      >
        {/* LEFT — Staff */}
        <div style={{ flex: 1 }}>
          Name of Staff:
          <input
            type="text"
            value={staffName}
            {...register("page11_staffName")}
            style={{ fontWeight: "bold", textTransform: "uppercase", ...fullLine }}
          />
          <br />
          Contact of Staff:
          <input
            type="text"
            value={staffPhone}
            {...register("page11_staffContact")}
            style={{ fontWeight: "bold", ...fullLine }}
          />
          <br />
          Signature of Staff:
          <input
            type="text"
            {...register("page11_staffSignature")}
            style={fullLine}
          />
          <br />
          Date:
          <input
            type="date"
            defaultValue={today}
            {...register("page11_staffDate", {
              setValueAs: (val) => {
                if (!val) return "";
                const [year, month, day] = val.split("-");
                return `${day}/${month}/${year}`;
              },
            })}
            style={{ fontWeight: "bold", textTransform: "uppercase", ...fullLine }}
          />
        </div>
        {/* RIGHT — NR */}
        <div style={{ flex: 1 }}>
          Name of NR:
          <input
            type="text"
            value={patient?.guardianName}
            {...register("page11_nrName")}
            style={{ fontWeight: "bold", textTransform: "uppercase", ...fullLine }}
          />
          <br />
          Signature of NR:
          <input
            type="text"
            {...register("page11_nrSignature")}
            style={fullLine}
          />
          <br />
          Relation with NR:
          <input
            type="text"
            value={patient?.guardianRelation}
            {...register("page11_nrRelation")}
            style={{ fontWeight: "bold", ...fullLine }}
          />
          <br />
          Contact of NR:
          <input
            type="text"
            value={patient?.guardianPhoneNumber}
            {...register("page11_nrContact")}
            style={{ fontWeight: "bold", ...fullLine }}
          />
          <br />
          Date:
          <input
            type="date"
            defaultValue={today}
            {...register("page11_nrDate", {
              setValueAs: (val) => {
                if (!val) return "";
                const [year, month, day] = val.split("-");
                return `${day}/${month}/${year}`;
              },
            })}
            style={{ fontWeight: "bold", textTransform: "uppercase", ...fullLine }}
          />
        </div>
      </div>
      <p style={{ marginTop: "20px", fontSize: "11px" }}>
        <b>N.B.:</b> Please strike off those which are not required.
      </p>
    </div>
  );
};
export default DischargeIndependentMinor;
