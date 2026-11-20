import { useEffect, useState } from "react";
import PrintHeader from "./printheader";

const DischargeVoluntaryAdult = ({
  register,
  patient,
  admissions,
  finalDiagnosis,
}) => {
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

  const sectionHeader = {
    backgroundColor: "#1a2e5a",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "13px",
    padding: "6px 10px",
    marginTop: "14px",
    marginBottom: "6px",
  };

  const inputLine = {
    border: "none",
    borderBottom: "1px solid #000",
    flex: "1",
    minWidth: "100px",
    maxWidth: "250px",
    margin: "0 5px",
    fontSize: "13px",
    background: "transparent",
  };

  const fieldRow = {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "6px",
    marginBottom: "6px",
    fontSize: "13px",
  };

  const checkboxRow = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "5px",
    fontSize: "13px",
  };

  const [today, setToday] = useState("");

  useEffect(() => {
    const localISODate = new Date().toISOString().split("T")[0];
    setToday(localISODate);
  }, []);

  return (
    <div style={pageContainer}>
      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          input { border: none; border-bottom: 1px solid #000; font-size: 12px; background: transparent; }
        }
        @media (max-width: 768px) {
          input:not([type='radio']):not([type='checkbox']) { width: 100% !important; margin: 5px 0 !important; display: block; }
        }
      `}</style>

      {/* PrintHeader */}
      <div style={{ marginBottom: "16px" }}>
        <PrintHeader patient={patient} pageWidth={window.innerWidth} />
      </div>

      {/* Form Title Banner */}
      <div style={{ ...sectionHeader, fontSize: "14px" }}>
        SECTION 86 — VOLUNTARY (INDEPENDENT) ADMISSION, ADULT — DISCHARGE FORM
      </div>

      <div style={{ textAlign: "center", marginBottom: "4px" }}>
        <span
          style={{ fontWeight: "bold", fontSize: "15px", color: "#1a2e5a" }}
        >
          Form Dis-Sec86-F | EMR | Version 1.0 | Effective: 1st June 2026
        </span>
      </div>


      <div
        style={{
          textAlign: "center",
          fontSize: "12px",
          marginBottom: "10px",
          color: "#555",
        }}
      >
        CONFIDENTIAL — FOR INTERNAL USE ONLY
      </div>

      {/* SECTION A */}
      <div style={sectionHeader}>
        SECTION A — PATIENT &amp; ADMISSION DETAILS
      </div>

      <div style={fieldRow}>
        <span>Patient Name:</span>
        <input
          type="text"
          value={patient?.name || ""}
          {...register("sec86_patientName")}
          style={{
            ...inputLine,
            maxWidth: "220px",
            textTransform: "uppercase",
            fontWeight: "bold",
          }}
        />
        <span style={{ marginLeft: "16px" }}>UID:</span>
        <input
          type="text"
          defaultValue={admissions?.Ipdnum || ""}
          {...register("sec86_mrdNumber")}
          style={{ ...inputLine, maxWidth: "140px" }}
        />
      </div>

      <div style={fieldRow}>
        <span>Date of Birth:</span>
        <input
          type="text"
          value={
            patient?.dateOfBirth
              ? new Date(patient.dateOfBirth).toLocaleDateString("en-GB")
              : ""
          }
          {...register("sec86_dob")}
          style={{ ...inputLine, maxWidth: "120px" }}
        />
        <span style={{ marginLeft: "8px" }}>Age:</span>
        <input
          type="text"
          value={patient?.age || ""}
          {...register("sec86_age")}
          style={{ ...inputLine, maxWidth: "60px" }}
        />
        <span style={{ marginLeft: "8px" }}>Gender:</span>
        <input
          type="text"
          value={patient?.gender || ""}
          {...register("sec86_gender")}
          style={{ ...inputLine, maxWidth: "100px" }}
        />
      </div>

      <div style={fieldRow}>
        <span>Admission Date:</span>
        <input
          type="text"
          value={
            admissions?.addmissionDate
              ? new Date(admissions.addmissionDate).toLocaleDateString("en-GB")
              : ""
          }
          {...register("sec86_admissionDate")}
          style={{ ...inputLine, maxWidth: "120px" }}
        />
        <span style={{ marginLeft: "16px" }}>Discharge Date:</span>
        <input
          type="date"
          defaultValue={today}
          {...register("sec86_dischargeDate", {
            setValueAs: (val) => {
              if (!val) return "";
              const [year, month, day] = val.split("-");
              return `${day}/${month}/${year}`;
            },
          })}
          style={{ ...inputLine, maxWidth: "140px" }}
        />
        <span style={{ marginLeft: "16px" }}>Time:</span>
        <input
          type="text"
          {...register("sec86_dischargeTime")}
          style={{ ...inputLine, maxWidth: "100px" }}
        />
      </div>

      <div style={fieldRow}>
        <span>Centre:</span>
        <input
          type="text"
          defaultValue={
            patient?.center?.title || "Jagruti Rehabilitation Centre"
          }
          {...register("sec86_centre")}
          style={{ ...inputLine, maxWidth: "220px" }}
        />
        <span style={{ marginLeft: "16px" }}>Treating Psychiatrist:</span>
        <input
          type="text"
          value={admissions?.doctor?.name || ""}
          {...register("sec86_psychiatrist")}
          style={{
            ...inputLine,
            maxWidth: "200px",
            textTransform: "uppercase",
            fontWeight: "bold",
          }}
        />
      </div>

      {/* SECTION B */}
      <div style={sectionHeader}>SECTION B — DIAGNOSIS</div>
      <div style={fieldRow}>
        <span>Diagnosis (ICD-10):</span>
        <input
          type="text"
          defaultValue={finalDiagnosis || ""}
          {...register("sec86_diagnosis")}
          style={{ ...inputLine, maxWidth: "420px" }}
        />
      </div>

      {/* SECTION C */}
      <div style={sectionHeader}>SECTION C — DISCHARGE TRIGGER</div>
      <div style={{ padding: "0 4px" }}>
        <div style={checkboxRow}>
          <input
            type="checkbox"
            {...register("sec86_trigger1")}
            style={{ width: "14px", height: "14px" }}
          />
          <span>Clinical readiness — treatment goals achieved</span>
        </div>
        <div style={checkboxRow}>
          <input
            type="checkbox"
            {...register("sec86_trigger2")}
            style={{ width: "14px", height: "14px" }}
          />
          <span>Patient-requested discharge</span>
        </div>
        <div style={checkboxRow}>
          <input
            type="checkbox"
            {...register("sec86_triggerOther")}
            style={{ width: "14px", height: "14px" }}
          />
          <span>Other:</span>
          <input
            type="text"
            {...register("sec86_triggerOtherText")}
            style={{ ...inputLine, maxWidth: "300px" }}
          />
        </div>
      </div>

      {/* SECTION D */}
      <div style={sectionHeader}>SECTION D — CONDITION AT DISCHARGE</div>
      <div style={{ padding: "0 4px" }}>
        <div style={{ ...fieldRow, marginBottom: "8px" }}>
          <span>Condition:</span>
          {["Improved", "Stable", "Partial improvement", "Unchanged"].map(
            (opt) => (
              <label
                key={opt}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  marginLeft: "10px",
                }}
              >
                <input
                  type="checkbox"
                  {...register(`sec86_condition_${opt.replace(/\s+/g, "")}`)}
                  style={{ width: "13px", height: "13px" }}
                />
                {opt}
              </label>
            ),
          )}
        </div>
        <div style={fieldRow}>
          <span>Risk at Discharge:</span>
          {["Low", "Moderate", "High"].map((opt) => (
            <label
              key={opt}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                marginLeft: "10px",
              }}
            >
              <input
                type="checkbox"
                {...register(`sec86_risk_${opt}`)}
                style={{ width: "13px", height: "13px" }}
              />
              {opt}
            </label>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 4px", marginTop: "14px" }}>
        <div style={fieldRow}>
          <span>Patient Name:</span>
          <input
            type="text"
            value={patient?.name || ""}
            readOnly
            {...register("sec86_signPatientName")}
            style={{
              ...inputLine,
              maxWidth: "220px",
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
          />
        </div>
        <div style={fieldRow}>
          <span>Patient Contact:</span>
          <input
            type="text"
            value={patient?.phoneNumber || ""}
            readOnly
            {...register("sec86_signPatientContact")}
            style={{ ...inputLine, maxWidth: "180px", fontWeight: "bold" }}
          />
        </div>
        <div style={fieldRow}>
          <span>Patient Signature:</span>
          <input
            type="text"
            {...register("sec86_patientSignature")}
            style={{ ...inputLine, maxWidth: "200px" }}
          />
        </div>
        <div style={fieldRow}>
          <span>Date:</span>
          <input
            type="date"
            defaultValue={today}
            {...register("sec86_patientSignDate", {
              setValueAs: (val) => {
                if (!val) return "";
                const [year, month, day] = val.split("-");
                return `${day}/${month}/${year}`;
              },
            })}
            style={{ ...inputLine, maxWidth: "130px" }}
          />
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          textAlign: "center",
          fontSize: "11px",
          color: "#555",
          marginTop: "20px",
          borderTop: "1px solid #ccc",
          paddingTop: "6px",
        }}
      >
        Jagrutii Rehab Centre Pvt. Ltd. | Dis-Sec86-F | Version 1.0 | MHCA 2017
        Sec. 86 | CONFIDENTIAL
      </div>
    </div>
  );
};

export default DischargeVoluntaryAdult;
