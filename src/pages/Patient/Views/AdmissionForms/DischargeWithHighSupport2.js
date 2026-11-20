import { useEffect, useState } from "react";
import PrintHeader from "./printheader";

const DischargeWithHighSupport2 = ({
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
          input { width: 100% !important; margin: 5px 0 !important; display: block; }
        }
      `}</style>

      {/* PrintHeader */}
      <div style={{ marginBottom: "16px" }}>
        <PrintHeader patient={patient} pageWidth={window.innerWidth} />
      </div>

      {/* Form Title Banner */}
      <div style={{ ...sectionHeader, fontSize: "14px" }}>
        SECTION 90 — SUPPORTED ADMISSION (&gt;30 DAYS) — DISCHARGE FORM
      </div>

      <div style={{ textAlign: "center", marginBottom: "4px" }}>
        <span
          style={{ fontWeight: "bold", fontSize: "15px", color: "#1a2e5a" }}
        >
          Form Dis-Sec90-F | EMR | Version 1.0 | Effective: 1st June 2026
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
          {...register("sec90_patientName")}
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
          defaultValue={patient?.mrdNumber || admissions?.Ipdnum || ""}
          {...register("sec90_mrdNumber")}
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
          {...register("sec90_dob")}
          style={{ ...inputLine, maxWidth: "120px" }}
        />
        <span style={{ marginLeft: "8px" }}>Age:</span>
        <input
          type="text"
          value={patient?.age || ""}
          {...register("sec90_age")}
          style={{ ...inputLine, maxWidth: "60px" }}
        />
        <span style={{ marginLeft: "8px" }}>Gender:</span>
        <input
          type="text"
          value={patient?.gender || ""}
          {...register("sec90_gender")}
          style={{ ...inputLine, maxWidth: "100px" }}
        />
      </div>

      <div style={fieldRow}>
        <span>Sec. 90 Order Date:</span>
        <input
          type="text"
          value={
            admissions?.addmissionDate
              ? new Date(admissions.addmissionDate).toLocaleDateString("en-GB")
              : ""
          }
          {...register("sec90_orderDate")}
          style={{ ...inputLine, maxWidth: "120px" }}
        />
        <span style={{ marginLeft: "12px" }}>Discharge Date:</span>
        <input
          type="date"
          defaultValue={
            patient?.addmission?.dischargeDate
              ? new Date(patient.addmission.dischargeDate)
                  .toISOString()
                  .split("T")[0]
              : ""
          }
          {...register("sec90_dischargeDate", {
            setValueAs: (val) => {
              if (!val) return "";
              const [year, month, day] = val.split("-");
              return `${day}/${month}/${year}`;
            },
          })}
          style={{ ...inputLine, maxWidth: "140px" }}
        />
        <span style={{ marginLeft: "12px" }}>Total Days:</span>
        <input
          type="text"
          {...register("sec90_totalDays")}
          style={{ ...inputLine, maxWidth: "80px" }}
        />
      </div>

      <div style={fieldRow}>
        <span>Centre:</span>
        <input
          type="text"
          defaultValue={patient?.center?.title}
          disabled
          {...register("sec90_centre")}
          style={{ ...inputLine, maxWidth: "220px" }}
        />
        <span style={{ marginLeft: "16px" }}>Treating Psychiatrist:</span>
        <input
          type="text"
          value={admissions?.doctor?.name || ""}
          {...register("sec90_psychiatrist")}
          style={{
            ...inputLine,
            maxWidth: "200px",
            textTransform: "uppercase",
            fontWeight: "bold",
          }}
        />
      </div>

      <div style={fieldRow}>
        <span>Nominated Representative (NR):</span>
        <input
          type="text"
          value={patient?.guardianName || ""}
          {...register("sec90_nr")}
          style={{
            ...inputLine,
            maxWidth: "200px",
            textTransform: "uppercase",
            fontWeight: "bold",
          }}
        />
        <span style={{ marginLeft: "16px" }}>Relationship:</span>
        <input
          type="text"
          value={patient?.guardianRelation || ""}
          {...register("sec90_relationship")}
          style={{ ...inputLine, maxWidth: "160px" }}
        />
      </div>

      {/* SECTION B */}
      <div style={sectionHeader}>SECTION B — DIAGNOSIS</div>
      <div style={fieldRow}>
        <span>Diagnosis (ICD-10):</span>
        <input
          type="text"
          defaultValue={finalDiagnosis || ""}
          {...register("sec89_diagnosis")}
          style={{ ...inputLine, maxWidth: "420px" }}
        />
      </div>

      {/* SECTION C */}
      <div style={sectionHeader}>SECTION C — DISCHARGE TRIGGER</div>
      <div style={{ padding: "0 4px" }}>
        {[
          {
            key: "sec90_trigger1",
            label: "Clinical discharge — readiness criteria met, MHRB notified",
          },
          {
            key: "sec90_trigger2",
            label: "MHRB discharge order (attach order)",
          },
          {
            key: "sec90_trigger3",
            label: "Maximum period reached (180 days) — mandatory discharge",
          },
          {
            key: "sec90_trigger4",
            label: "Patient regained capacity — transition to Sec. 86 process",
          },
        ].map(({ key, label }) => (
          <div key={key} style={checkboxRow}>
            <input
              type="checkbox"
              {...register(key)}
              style={{ width: "14px", height: "14px" }}
            />
            <span>{label}</span>
          </div>
        ))}
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
                  {...register(`sec90_condition_${opt.replace(/\s+/g, "")}`)}
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
                {...register(`sec90_risk_${opt}`)}
                style={{ width: "13px", height: "13px" }}
              />
              {opt}
            </label>
          ))}
          <span style={{ marginLeft: "24px" }}>Capacity:</span>
          {["Regained", "Absent", "Partial"].map((opt) => (
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
                {...register(`sec90_capacity_${opt}`)}
                style={{ width: "13px", height: "13px" }}
              />
              {opt}
            </label>
          ))}
        </div>
      </div>


      <div style={{ padding: "0 4px", marginTop: "14px" }}>
        <div style={fieldRow}>
          <span>NR Name:</span>
          <input
            type="text"
            value={patient?.guardianName || ""}
            readOnly
            {...register("sec90_nrName")}
            style={{
              ...inputLine,
              maxWidth: "220px",
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
          />
        </div>
        <div style={fieldRow}>
          <span>NR Contact:</span>
          <input
            type="text"
            value={patient?.guardianPhoneNumber || ""}
            readOnly
            {...register("sec90_nrContact")}
            style={{ ...inputLine, maxWidth: "180px", fontWeight: "bold" }}
          />
        </div>
        <div style={fieldRow}>
          <span>NR Signature:</span>
          <input
            type="text"
            {...register("sec90_nrSignature")}
            style={{ ...inputLine, maxWidth: "200px" }}
          />
        </div>
        <div style={fieldRow}>
          <span>Date:</span>
          <input
            type="date"
            defaultValue={today}
            {...register("sec90_nrSignDate", {
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
        Jagrutii Rehab Centre Pvt. Ltd. | Dis-Sec90-F | Version 1.0 | MHCA 2017
        Sec. 90 | CONFIDENTIAL
      </div>
    </div>
  );
};

export default DischargeWithHighSupport2;
