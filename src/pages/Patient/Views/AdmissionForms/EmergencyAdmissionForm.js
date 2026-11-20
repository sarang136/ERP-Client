import { useEffect, useState } from "react";
import PrintHeader from "./printheader";

const EmergencyAdmissionForm = ({
  register,
  setValue,
  patient,
  details,
  chartData,
  emergencyType,
  emergencyRestraint,
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

  const sectionHeading = {
    fontWeight: "bold",
    fontStyle: "italic",
    fontSize: "15px",
    marginTop: "18px",
    marginBottom: "8px",
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    marginBottom: "15px",
  };

  const tdLabel = {
    border: "1px solid #000",
    padding: "6px 10px",
    fontWeight: "bold",
    width: "30%",
    fontSize: "14px",
  };

  const tdInput = {
    border: "1px solid #000",
    padding: "6px 10px",
    width: "70%",
  };

  const [age, setAge] = useState("");

  const calculateAge = (dob) => {
    if (!dob) return "";
    const birthDate = new Date(dob);
    const today = new Date();
    let a = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      a--;
    }
    return a;
  };

  useEffect(() => {
    if (patient?.dateOfBirth) {
      const calculatedAge = calculateAge(patient.dateOfBirth);
      setAge(calculatedAge.toString());
    }
  }, [patient]);

  const [today, setToday] = useState("");
  const [staffName, setStaffName] = useState("");
  const [staffPhone, setStaffPhone] = useState("");

  useEffect(() => {
    const now = new Date();
    const localISODate = now.toISOString().split("T")[0];
    setToday(localISODate);
  }, []);

  useEffect(() => {
    try {
      const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
      setStaffName(authUser?.data?.name || "");
      setStaffPhone(authUser?.data?.phoneNumber || "");
    } catch {
      // ignore parse errors
    }
  }, []);

  useEffect(() => {
    if (setValue) {
      // if (emergencyType) {
      //   setValue("Emergency_Admission_description", emergencyType);
      // }
      const genderAge =
        age && patient?.gender
          ? `${age} / ${patient.gender}`
          : age
            ? `${age}`
            : patient?.gender
              ? `${patient.gender}`
              : "";

      setValue("Emergency_Admission_ageGender", genderAge);
      if (emergencyRestraint) {
        setValue("Emergency_Admission_restraint", emergencyRestraint);
      }
    }
  }, [setValue, emergencyType, emergencyRestraint, age, patient]);

  useEffect(() => {
    if (setValue) {
      setValue("Emergency_Admission_monitoring", "Yes");
    }
  }, [setValue]);

  return (
    <div style={pageContainer}>
      <style>
        {`
          @media (max-width: 768px) {
            input:not([type='radio']):not([type='checkbox']), textarea {
              width: 100% !important;
              margin: 5px 0 !important;
              display: block;
            }
          }
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            input, textarea {
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

      <div style={heading}>SECTION 94 &ndash; EMERGENCY ADMISSION FORM</div>
      <div style={subHeading}>(MHCA 2017)</div>

      {/* Patient Details */}
      <div style={sectionHeading}>Patient Details</div>
      <table style={tableStyle}>
        <tbody>
          <tr>
            <td style={tdLabel}>Name</td>
            <td style={tdInput}>
              <input
                type="text"
                data-no-underline
                defaultValue={patient?.name}
                {...register("Emergency_Admission_name")}
                style={{
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  ...fullLine,
                  borderBottom: "none",
                }}
              />
            </td>
          </tr>
          <tr>
            <td style={tdLabel}>Age/Gender</td>
            <td style={tdInput}>
              <input
                type="text"
                data-no-underline
                {...register("Emergency_Admission_ageGender")}
                style={{
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  ...fullLine,
                  borderBottom: "none",
                }}
              />
            </td>
          </tr>
          <tr>
            <td style={tdLabel}>Address</td>
            <td style={tdInput}>
              <input
                type="text"
                data-no-underline
                defaultValue={patient?.address}
                {...register("Emergency_Admission_address")}
                style={{
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  ...fullLine,
                  borderBottom: "none",
                }}
              />
            </td>
          </tr>
          <tr>
            <td style={tdLabel}>Contact</td>
            <td style={tdInput}>
              <input
                type="text"
                data-no-underline
                defaultValue={patient?.phoneNumber}
                {...register("Emergency_Admission_contact")}
                style={{
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  ...fullLine,
                  borderBottom: "none",
                }}
              />
            </td>
          </tr>
          <tr>
            <td style={tdLabel}>Brought by</td>
            <td style={tdInput}>
              <input
                type="text"
                data-no-underline
                defaultValue={patient?.guardianName}
                {...register("Emergency_Admission_broughtBy")}
                style={{
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  ...fullLine,
                  borderBottom: "none",
                }}
              />
            </td>
          </tr>
          <tr>
            <td style={tdLabel}>Date &amp; Time</td>
            <td style={tdInput}>
              <input
                type="datetime-local"
                data-no-underline
                defaultValue={
                  today
                    ? `${today}T${new Date().toTimeString().slice(0, 5)}`
                    : ""
                }
                {...register("Emergency_Admission_dateTime")}
                style={{
                  fontWeight: "bold",
                  ...fullLine,
                  borderBottom: "none",
                }}
              />
            </td>
          </tr>
        </tbody>
      </table>

      {/* Emergency Type */}
      <div style={sectionHeading}>Emergency Type</div>
      <p style={{ marginBottom: "5px" }}>
        {/* Risk to self / others / agitation / psychosis / substance / inability to
        care */}
        {emergencyType}
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "5px",
          marginBottom: "15px",
        }}
      >
        <span>Description:</span>
        <textarea
          {...register("Emergency_Admission_description")}
          rows={3}
          style={{
            ...fullLine,
            resize: "vertical",
            fontWeight: "bold",
            textTransform: "uppercase",
          }}
        />
      </div>

      {/* Justification */}
      <div style={sectionHeading}>Justification</div>
      <p style={{ marginBottom: "15px" }}>
        Immediate risk of harm to self/others or deterioration &ndash; admission
        under Section 94 required.
      </p>

      {/* Treatment */}
      <div style={sectionHeading}>Treatment</div>
      <div style={{ marginBottom: "8px" }}>
        <span>Medication: </span>
        <label style={{ marginLeft: "10px", marginRight: "15px" }}>
          <input
            type="radio"
            value="Yes"
            {...register("Emergency_Admission_medication")}
            style={{ marginRight: "4px" }}
          />
          Yes
        </label>
        <label>
          <input
            type="radio"
            value="No"
            {...register("Emergency_Admission_medication")}
            style={{ marginRight: "4px" }}
          />
          No
        </label>
      </div>
      <div style={{ marginBottom: "8px" }}>
        <span>Restraint: </span>
        <label style={{ marginLeft: "10px", marginRight: "15px" }}>
          <input
            type="radio"
            value="Yes"
            {...register("Emergency_Admission_restraint")}
            style={{ marginRight: "4px" }}
          />
          Yes
        </label>
        <label>
          <input
            type="radio"
            value="No"
            {...register("Emergency_Admission_restraint")}
            style={{ marginRight: "4px" }}
          />
          No
        </label>
      </div>
      <div style={{ marginBottom: "15px" }}>
        <span>Monitoring: </span>
        <label style={{ marginLeft: "10px", marginRight: "15px" }}>
          <input
            type="radio"
            value="Yes"
            {...register("Emergency_Admission_monitoring")}
            style={{ marginRight: "4px" }}
          />
          Yes
        </label>
        <label>
          <input
            type="radio"
            value="No"
            {...register("Emergency_Admission_monitoring")}
            style={{ marginRight: "4px" }}
          />
          No
        </label>
      </div>

      {/* Doctor Declaration */}
      <div style={sectionHeading}>Doctor Declaration</div>
      <div style={{ marginBottom: "8px" }}>
        <span>Dr Name / Reg No: </span>
        <input
          type="text"
          defaultValue={patient?.doctorData?.name || ""}
          {...register("Emergency_Admission_drNameRegNo")}
          style={{
            fontWeight: "bold",
            textTransform: "uppercase",
            ...inputLine,
            minWidth: "300px",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: "10px",
          marginTop: "20px",
        }}
      >
        <div>
          <span>Signature: </span>
          <input
            type="text"
            {...register("Emergency_Admission_signature")}
            style={inputLine}
          />
        </div>
        <div>
          Staff Name:
          <input
            type="text"
            value={staffName}
            readOnly
            {...register("Emergency_Admission_staffName")}
            style={{ fontWeight: "bold", textTransform: "uppercase", ...inputLine }}
          />
          <br />
          Staff Contact:
          <input
            type="text"
            value={staffPhone}
            readOnly
            {...register("Emergency_Admission_staffContact")}
            style={{ fontWeight: "bold", ...inputLine }}
          />
          <br />
          Staff Signature:
          <input
            type="text"
            {...register("Emergency_Admission_staffSignature")}
            style={inputLine}
          />
          <br />
          <span>Date/Time: </span>
          <input
            type="datetime-local"
            defaultValue={
              today ? `${today}T${new Date().toTimeString().slice(0, 5)}` : ""
            }
            {...register("Emergency_Admission_signatureDateTime")}
            style={{
              fontWeight: "bold",
              ...inputLine,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default EmergencyAdmissionForm;
