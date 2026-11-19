import React, { useState, useEffect } from "react";
import InternBg from "../../../../assets/images/intern-bg-template2.jpg";
import UndertakingDischargeFormFooter from "./UndertakingDischargeFormFooter";

const UndertakingDischargeForm = ({ patient, admissions }) => {
  const toTitleCase = (text) => {
    if (!text) return "";
    return text
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // State to handle all input values
  const [formData, setFormData] = useState({
    patientName: "",
    admissionDate: "",
    dischargeDate: "",
    ptSign: "",
    ptNameBottom: "",
    ptDate: "",
    relSign: "",
    relName: "",
    relMobile: "",
    relDate: "",
  });

  // Update state when patient prop changes
  useEffect(() => {
    if (patient?.name) {
      const formattedName = toTitleCase(patient.name);
      const guardianName = toTitleCase(patient?.guardianName);

      const admitDate = admissions?.addmissionDate
        ? new Date(admissions.addmissionDate).toLocaleDateString("en-GB")
        : "";

      const dischargedate = admissions?.dischargeDate
        ? new Date(admissions.dischargeDate).toLocaleDateString("en-GB")
        : "";

      const localISODate = new Date().toISOString().split("T")[0];

      setFormData((prev) => ({
        ...prev,
        patientName: formattedName,
        ptNameBottom: formattedName, // Auto-fill bottom name too
        admissionDate: admitDate,
        dischargeDate: dischargedate,
        ptDate: localISODate,
        relName: guardianName,
        relMobile: patient?.guardianPhoneNumber || "",
        relDate: localISODate,
      }));
    }
  }, [patient, admissions]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const styles = {
    page: {
      width: "210mm",
      height: "297mm",
      margin: "0 auto",
      position: "relative",
      fontFamily: '"Times New Roman", serif',
      padding: "140px 70px 60px 70px",
      boxSizing: "border-box",
      fontSize: "16px",
      lineHeight: 1.6,
    },
    bgImg: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      zIndex: 1,
      printColorAdjust: "exact",
      WebkitPrintColorAdjust: "exact",
    },
    content: {
      position: "relative",
      zIndex: 1,
    },
    header: {
      textAlign: "center",
      marginBottom: "50px",
      fontSize: "20px",
      fontWeight: "bold",
      textDecoration: "underline",
    },
    paragraph: {
      marginBottom: "15px",
    },
    listItem: {
      display: "flex",
      alignItems: "flex-start",
      marginBottom: "5px",
    },
    bullet: {
      marginRight: "10px",
      fontSize: "18px",
      lineHeight: "1.6",
    },
    signatureBlock: {
      marginTop: "40px",
      lineHeight: 1.8,
    },
    signatureRow: {
      marginBottom: "15px",
    },
    signatureLabel: {
      fontWeight: "bold",
      display: "flex",
      alignItems: "center",
      marginBottom: "5px",
    },
    // NEW: Specific style for the input boxes to look like lines
    inputField: {
      border: "none",
      borderBottom: "1px dotted black",
      backgroundColor: "transparent",
      fontFamily: '"Times New Roman", serif',
      fontSize: "16px",
      color: "#000",
      outline: "none",
      marginLeft: "10px",
      flexGrow: 1, // Allows input to take available space in flex container
      width: "200px", // Default width for inline inputs
    },
    inlineInput: {
      border: "none",
      borderBottom: "1px dotted black",
      backgroundColor: "transparent",
      fontFamily: '"Times New Roman", serif',
      fontSize: "16px",
      color: "#000",
      outline: "none",
      width: "150px",
      // textAlign: "center",
    },
  };

  return (
    <div style={styles.page}>
      <img src={InternBg} alt="form background" style={styles.bgImg} />

      <div style={styles.content}>
        <div style={styles.header}>UNDERTAKING FORM</div>

        {/* BODY PARAGRAPH WITH INPUTS */}
        <p style={{ ...styles.paragraph, marginTop: "40px" }}>
          I,{" "}
          <input
            type="text"
            name="patientName"
            value={formData.patientName}
            onChange={handleChange}
            style={{
              ...styles.inlineInput,
              width: "250px",
              fontWeight: "bold",
            }}
            placeholder="Patient Name"
          />
          , was admitted at Jagruti Rehabilitation Centre,{" "}
          {patient?.center?.title} from{" "}
          <input
            type="text" // using text type to allow "12th Nov" format flexibility
            name="admissionDate"
            value={formData.admissionDate}
            onChange={handleChange}
            style={{
              ...styles.inlineInput,
              width: "250px",
              fontWeight: "bold",
            }}
            placeholder="DD/MM/YYYY"
          />{" "}
          to{" "}
          <input
            type="text"
            name="dischargeDate"
            value={formData.dischargeDate}
            onChange={handleChange}
            style={{
              ...styles.inlineInput,
              width: "250px",
              fontWeight: "bold",
            }}
            placeholder="DD/MM/YYYY"
          />
          .
        </p>

        <p style={styles.paragraph}>I hereby declare the following:</p>

        <ul style={{ listStyle: "none", padding: 0 }}>
          {[
            `I am satisfied with my treatment at Jagruti Rehabilitation Centre, ${patient?.center?.title}.`,
            // "I am better now and feel psychologically and physically fit to go home.",
            "I am better now and feel psychologically and physically fit for discharge, able to continue my prescribed medications after discharge and to attend follow-up OPD visits as advised. ",
            "I have been explained about my illness, medications, counselling and further management.",
            `I have no complaints against any of the staff at the Jagruti Rehabilitation Centre, ${patient?.center?.title}.`,
            "I have not been man-handled, misbehaved with or mistreated in any way, by any staff at the centre.",
            "I have all my belongings safe with me at the time of discharge.",
            "I have no other issues or complaints with any regard to the centre or any of its staff.",
          ].map((text, index) => (
            <li key={index} style={styles.listItem}>
              <span style={styles.bullet}>&#8226;</span> {text}
            </li>
          ))}
        </ul>

        <p style={{ ...styles.paragraph, marginTop: "30px" }}>
          I am signing this form with my whole consent, and in the presence of
          my family member/s.
        </p>

        {/* SIGNATURE BLOCK WITH INPUTS */}
        <div style={styles.signatureBlock}>
          {/* Patient Section */}
          <div style={styles.signatureRow}>
            <label style={styles.signatureLabel}>
              Pt. sign:
              <input
                type="text"
                name="ptSign"
                value={formData.ptSign}
                onChange={handleChange}
                style={styles.inputField}
              />
            </label>
            <label style={styles.signatureLabel}>
              Patient's name:
              <input
                type="text"
                name="ptNameBottom"
                value={formData.ptNameBottom}
                onChange={handleChange}
                style={{
                  ...styles.inlineInput,
                  width: "250px",
                  fontWeight: "bold",
                }}
              />
            </label>
            <label style={styles.signatureLabel}>
              Date:
              <input
                type="text"
                name="ptDate"
                value={formData.ptDate}
                onChange={handleChange}
                style={{
                  ...styles.inlineInput,
                  width: "250px",
                  fontWeight: "bold",
                }}
              />
            </label>
          </div>

          {/* Relative Section */}
          <div style={{ ...styles.signatureRow, marginTop: "30px" }}>
            <label style={styles.signatureLabel}>
              Pt. NR sign:
              <input
                type="text"
                name="relSign"
                value={formData.relSign}
                onChange={handleChange}
                style={styles.inputField}
              />
            </label>
            <label style={styles.signatureLabel}>
              Pt. NR Name:
              <input
                type="text"
                name="relName"
                value={formData.relName}
                onChange={handleChange}
                style={{
                  ...styles.inlineInput,
                  width: "250px",
                  fontWeight: "bold",
                }}
              />
            </label>
            <label style={styles.signatureLabel}>
              Pt. NR Mobile:
              <input
                type="text"
                name="relMobile"
                value={formData.relMobile}
                onChange={handleChange}
                style={{
                  ...styles.inlineInput,
                  width: "250px",
                  fontWeight: "bold",
                }}
              />
            </label>
            <label style={styles.signatureLabel}>
              Date:
              <input
                type="text"
                name="relDate"
                value={formData.relDate}
                onChange={handleChange}
                style={{
                  ...styles.inlineInput,
                  width: "250px",
                  fontWeight: "bold",
                }}
              />
            </label>
          </div>
        </div>
        <UndertakingDischargeFormFooter center={patient.center} />
      </div>
    </div>
  );
};

export default UndertakingDischargeForm;
