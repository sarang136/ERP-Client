import React, { useEffect, useState } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Label,
  Table,
  FormGroup,
  Spinner,
} from "reactstrap";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useRef } from "react";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import {
  fetchPatientById,
  fetchChartsAddmissions,
} from "../../../store/actions";
import { addCapacityAssessment } from "../../../store/features/chart/chartSlice";

const CapacityAssessmentModal = ({ isOpen, toggle, patient, addmissionId }) => {
  const [formData, setFormData] = useState({
    patientName: patient?.name || "",
    uhidIpdNo: "",
    ageSex: "",
    wardUnit: "",
    assessmentDateTime: "",
    assessedBy: "",
    languageUsed: "",
    interpreterUsed: "",
    newAdmission: false,
    highRiskTreatment: false,
    refusalOfTreatment: false,
    amaRequest: false,
    useOfRestraint: false,
    ectConsent: false,
    primaryDiagnosis: "",
    mentalStatusSummary: "",
    factorsAffectingCapacity: "",
    understandInformation: "",
    appreciateSituation: "",
    reasonWeighOptions: "",
    communicateChoice: "",
    overallCapacityDetermination: "",
    nominatedRepresentativeInformed: "",
    representativeName: "",
    relationship: "",
    supportedAdmissionInitiated: "",
    supportedAdmissionSection: "",
    nextReviewDate: "",
    suicideRisk: false,
    violenceRisk: false,
    withdrawalRisk: false,
    abscondingRisk: false,
    vulnerableAdult: false,
    managementPlan: "",
    signatures: [],
    consultantName: "",
    consultantDateTime: "",
    consultantSignature: "",
    secondConsultantName: "",
    secondConsultantDateTime: "",
    secondConsultantSignature: "",
  });
  const [defaultNames, setDefaultNames] = useState({
    doctor: "",
    psychologist: "",
    doctorSignature: "",
    psychologistSignature: "",
  });
  const capacityFormRef = useRef(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [previewModal, setPreviewModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useDispatch();

  const loggedIn = JSON.parse(localStorage.getItem("authUser"));

  const loggedInUserName = loggedIn?.data.name;
  const loggedInUserDesignation = loggedIn?.data?.role;

  // Produces "Dr. Surname" from any name format, with or without an existing Dr prefix.
  const getDoctorAbbreviated = (name) => {
    if (!name) return "";
    const withoutPrefix = name.replace(/^dr\.?\s*/i, "").trim();
    const parts = withoutPrefix.split(/\s+/).filter(Boolean);
    if (!parts.length) return name;
    return `Dr. ${parts[parts.length - 1]}`;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setFormData((prev) => {
      const updated = { ...prev, [name]: newValue };

      if (name === "consultantName") {
        updated.consultantSignature =
          newValue === defaultNames.doctor
            ? defaultNames.doctorSignature || ""
            : "";
      }

      if (name === "secondConsultantName") {
        updated.secondConsultantSignature =
          newValue === defaultNames.psychologist
            ? defaultNames.psychologistSignature || ""
            : "";
      }

      if (name === "supportedAdmissionInitiated" && newValue === "No") {
        updated.supportedAdmissionSection = "";
        updated.nextReviewDate = "";
      }

      if (name === "supportedAdmissionSection") {
        const days = newValue === "89" ? 28 : newValue === "90" ? 88 : null;
        if (days !== null) {
          const reviewDate = new Date();
          reviewDate.setDate(reviewDate.getDate() + days);
          updated.nextReviewDate = reviewDate.toISOString().split("T")[0];
        }
      }

      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!formData.languageUsed.trim()) {
      toast.error("Language Used is required");
      return;
    }
    setIsSubmitting(true);

    try {
      const pdf = new jsPDF("p", "pt", "a4");

      await captureSection(capacityFormRef, pdf, true);

      const pdfBlob = pdf.output("blob");

      const formDataToSend = new FormData();

      formDataToSend.append(
        "capacityAssessmentFormRaw",
        pdfBlob,
        `capacity-assessment-${formData.patientName}.pdf`,
      );

      Object.keys(formData).forEach((key) => {
        let value = formData[key];

        if (value === undefined || value === null) {
          value = "";
        }

        if (typeof value === "boolean") {
          value = value ? "true" : "false";
        }

        if (Array.isArray(value)) {
          value = JSON.stringify(value);
        }

        formDataToSend.append(key, value);
      });

      await dispatch(
        addCapacityAssessment({
          addmissionId: patient?.addmission?._id,
          formData: formDataToSend,
        }),
      ).unwrap();

      await dispatch(fetchPatientById(patient?._id));
      if (patient?.addmissions?.length) {
        dispatch(fetchChartsAddmissions(patient.addmissions));
      }

      // Saved — now show the PDF, reusing the very blob just uploaded so the
      // printed copy and the stored copy cannot differ. The standalone Print
      // PDF button is gone, so this is the only way to a paper copy and it
      // can't happen without a record. Set before toggle() closes the form:
      // that unmounts the sections, and a capture taken afterwards would
      // rasterise nothing.
      try {
        const url = URL.createObjectURL(pdfBlob);
        if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        setPdfUrl(url);
        setPreviewModal(true);
      } catch (previewError) {
        // The assessment IS saved — never turn that into a failure.
        toast.warn("Assessment saved, but the PDF preview could not be opened");
      }

      toggle();
    } catch (error) {
      toast.error(error.message || "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };
  const paperStyle = {
    fontFamily: "'Arial', sans-serif",
    color: "#000",
  };

  const tableHeaderStyle = {
    backgroundColor: "#f2f2f2",
    border: "1px solid #000",
    fontWeight: "bold",
  };

  // The two signature-row datetime-local inputs hold a raw ISO-ish value
  // (e.g. "2026-10-31T13:47"), not the browser's localized display \u2014
  // captureSection reads .value directly, so format it for print here.
  const SIGNATURE_DATETIME_FIELDS = ["consultantDateTime", "secondConsultantDateTime"];
  const formatDisplayDate = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    const pad = (n) => (n < 10 ? "0" + n : n);
    const datePart = `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
    return `${datePart} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const captureSection = async (ref, pdf, isFirstPage = false) => {
    if (!ref?.current) return pdf;

    // 1. Prepare Clone (Same as before)
    const clone = ref.current.cloneNode(true);
    const inputs = clone.querySelectorAll("input, textarea, select");
    inputs.forEach((input) => {
      const span = document.createElement("span");
      let value;
      if (input.type === "checkbox" || input.type === "radio") {
        value = input.checked ? "YES" : "";
      } else if (SIGNATURE_DATETIME_FIELDS.includes(input.name)) {
        value = formatDisplayDate(input.value);
      } else {
        value = input.value || "";
      }
      span.innerText = value || "\u00A0";
      span.style.borderBottom = "1px solid #000";
      span.style.display =
        input.tagName === "TEXTAREA" ? "block" : "inline-block";
      span.style.minWidth = "100px";
      span.style.margin = "0 4px";
      input.parentNode.replaceChild(span, input);
    });

    clone.style.position = "fixed";
    clone.style.top = "0";
    clone.style.left = "0";
    clone.style.width = "900px";
    clone.style.background = "#fff";
    clone.style.padding = "40px";
    document.body.appendChild(clone);

    // Signature images are loaded cross-origin (S3) without the crossOrigin
    // attribute, since setting it on the live <img> breaks loading entirely.
    // Fetch each one as a blob (same approach @react-pdf/renderer's
    // cross-fetch uses for the prescription print) and swap in a data URI so
    // html2canvas can read its pixels without tainting the canvas.
    const signatureImgs = clone.querySelectorAll('img[alt="Signature"]');
    await Promise.all(
      Array.from(signatureImgs).map(async (img) => {
        try {
          const response = await fetch(img.src, { cache: "reload" });
          if (!response.ok) {
            // console.warn(
            //   "[CapacityAssessment] signature fetch failed",
            //   img.src,
            //   response.status,
            // );
            return;
          }
          const blob = await response.blob();
          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          await new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
            img.src = dataUrl;
          });
        } catch (err) {
          // console.warn("[CapacityAssessment] signature fetch error", img.src, err);
          // leave the original src; html2canvas will just skip this image
        }
      }),
    );

    // 2. Capture everything in ONE go (Fast)
    const canvas = await html2canvas(clone, { scale: 2, useCORS: true });
    document.body.removeChild(clone);

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pdfWidth - margin * 2;
    const pxToMm = contentWidth / canvas.width;

    // Calculate height available for content per page
    const pageHeightMm = pdfHeight - margin * 2;
    const pageHeightPx = pageHeightMm / pxToMm;

    let leftHeightPx = canvas.height;
    let sY = 0; // Source Y

    while (leftHeightPx > 0) {
      if (!isFirstPage || sY > 0) pdf.addPage();

      // Determine the slice height
      let sliceHeightPx = Math.min(pageHeightPx, leftHeightPx);

      // --- SMART CUT LOGIC ---
      // If we aren't at the very end, we check if we are cutting through text.
      // We sample the pixels at the 'cut line'. If it's not white, we move up.
      if (leftHeightPx > pageHeightPx) {
        const ctx = canvas.getContext("2d");
        let checkY = sY + sliceHeightPx;

        // Scan upwards (up to 50px) to find a white gap between lines
        for (let scan = 0; scan < 50; scan++) {
          const rowData = ctx.getImageData(
            0,
            checkY - scan,
            canvas.width,
            1,
          ).data;
          const isWhite = Array.from(rowData).every(
            (val) => val === 255 || val === 0,
          ); // 0 is alpha
          if (isWhite) {
            sliceHeightPx -= scan;
            break;
          }
        }
      }

      // Add the image slice
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = sliceHeightPx;
      tempCanvas
        .getContext("2d")
        .drawImage(
          canvas,
          0,
          sY,
          canvas.width,
          sliceHeightPx,
          0,
          0,
          canvas.width,
          sliceHeightPx,
        );

      pdf.addImage(
        tempCanvas.toDataURL("image/jpeg", 0.95),
        "JPEG",
        margin,
        margin,
        contentWidth,
        sliceHeightPx * pxToMm,
      );

      sY += sliceHeightPx;
      leftHeightPx -= sliceHeightPx;
    }

    return pdf;
  };

  const formatDateTimeLocal = (date) => {
    if (!date) return "";

    const d = new Date(date);
    const pad = (n) => (n < 10 ? "0" + n : n);

    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const formatDeepObject = (obj, parentKey = "") => {
    if (!obj) return "";

    return Object.entries(obj)
      .flatMap(([key, value]) => {
        const newKey = parentKey ? `${parentKey}.${key}` : key;

        if (value === "" || value === null || value === undefined) return [];

        if (Array.isArray(value)) {
          if (value.length === 0) return [];
          return `${newKey}: ${value.join(", ")}`;
        }

        if (typeof value === "object") {
          return formatDeepObject(value, newKey);
        }

        return `${newKey}: ${value}`;
      })
      .join(", ");
  };




  useEffect(() => {
    if (patient?.name) {
      const age = patient?.age || "";
      const sex = patient?.gender || "";
      const admission = patient?.addmission?.addmissionDate || ""
      const doctor = patient?.doctorData?.name || "";
      const consultant = patient?.psychologistData?.name || "";
      const getSignatureUrl = (signature) =>
        (typeof signature === "string" ? signature : signature?.url) || "";
      const doctorSignature = getSignatureUrl(patient?.doctorData?.signature);
      const psychologistSignature = getSignatureUrl(
        patient?.psychologistData?.signature
      );
      const me = patient?.detailAdmission?.mentalExaminationV2;
      setDefaultNames({
        doctor,
        psychologist: consultant,
        doctorSignature,
        psychologistSignature,
      });
      setFormData((prev) => ({
        ...prev,
        patientName: patient.name,
        assessedBy: `${loggedInUserName} - ${loggedInUserDesignation}` || "",
        uhidIpdNo:
          patient?.id?.prefix && patient?.id?.value
            ? `${patient.id.prefix}${patient.id.value}`
            : "",
        ageSex: age && sex ? `${age} / ${sex}` : "",
        wardUnit: getDoctorAbbreviated(doctor),
        assessmentDateTime: formatDateTimeLocal(admission),
        nominatedRepresentativeInformed: patient?.guardianName ? "Yes" : "",
        representativeName: patient?.guardianName || "",
        relationship: patient?.guardianRelation || "",
        consultantName: doctor || "",
        consultantDateTime: formatDateTimeLocal(new Date()),
        consultantSignature: doctorSignature,
        secondConsultantName: consultant || "",
        secondConsultantDateTime: formatDateTimeLocal(new Date()),
        secondConsultantSignature: psychologistSignature,
        primaryDiagnosis: patient?.detailAdmission?.doctorSignature?.diagnosis
          ?.map((d) => d?.code)
          ?.join(", "),
        mentalStatusSummary: `
Appearance & Behavior: ${formatDeepObject(me?.appearanceAndBehavior)}
Speech: ${formatDeepObject(me?.speech)}
Mood: ${formatDeepObject(me?.mood)}
Affect: ${formatDeepObject(me?.affectV2)}
Thought: ${formatDeepObject(me?.thought)}
Cognition: ${formatDeepObject(me?.cognition)}
Insight: ${formatDeepObject(me?.insight)}
Judgment: ${me?.judgment || ""}
Perception: ${me?.perception || ""}
Remarks: ${me?.remarks || ""}
`,
        managementPlan: patient?.detailAdmission?.doctorSignature?.managmentPlan

      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient, loggedInUserName]);

  return (
    <>
      <Modal isOpen={isOpen} toggle={toggle} size="xl" scrollable>
        <ModalBody className="px-5 pb-5">
          <div ref={capacityFormRef} style={paperStyle}>
            <div
              className="border-bottom-0 pb-0 d-flex flex-column align-items-center text-center position-relative w-100 mt-2"
              style={{ fontFamily: "'Arial', sans-serif", color: "#333" }}
            >
              <h3
                className="fw-bold mb-1"
                style={{ fontSize: "24px", letterSpacing: "1px" }}
              >
                JAGRUTII REHAB CENTRE PVT LTD
              </h3>

              <h5 className="fw-bold mb-3" style={{ fontSize: "18px" }}>
                Full Capacity Assessment Form (MHCA 2017 Compliant)
              </h5>

              <div
                className="d-flex justify-content-center align-items-center gap-4 py-2 flex-wrap"
                style={{ fontSize: "14px" }}
              >
                <div>
                  SOP Ref: <span className="fw-bold">CG-01</span>
                </div>
                <div>
                  Department: <span className="fw-bold">Psychiatry</span>
                </div>
                <div>
                  Applies to:{" "}
                  <span className="fw-bold">
                    All admissions & major treatment decisions
                  </span>
                </div>
              </div>
            </div>
            <h6 className="fw-bold font-italic mb-2">
              1. Patient Identification
            </h6>
            <Table bordered size="sm" className="border-dark">
              <tbody>
                <tr>
                  <td style={{ width: "30%" }} className="fw-bold">
                    Patient Name
                  </td>
                  <td>
                    <Input
                      type="text"
                      plainText
                      name="patientName"
                      value={formData?.patientName}
                      onChange={handleChange}
                      className="p-0 ps-2 text-capitalize"
                      disabled
                    />
                  </td>
                </tr>
                <tr>
                  <td className="fw-bold">UID</td>
                  <td>
                    <Input
                      type="text"
                      plainText
                      name="uhidIpdNo"
                      value={formData?.uhidIpdNo}
                      onChange={handleChange}
                      className="p-0 ps-2"
                      disabled
                    />
                  </td>
                </tr>
                <tr>
                  <td className="fw-bold">Age / Sex</td>
                  <td>
                    <Input
                      type="text"
                      plainText
                      name="ageSex"
                      value={formData?.ageSex}
                      onChange={handleChange}
                      className="p-0 ps-2"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="fw-bold">Unit</td>
                  <td>
                    <Input
                      type="text"
                      plainText
                      name="wardUnit"
                      value={formData?.wardUnit}
                      onChange={handleChange}
                      className="p-0 ps-2"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="fw-bold">Date & Time of Assessment</td>
                  <td>
                    <Input
                      type="datetime-local"
                      name="assessmentDateTime"
                      onChange={handleChange}
                      value={formData?.assessmentDateTime}
                      className="border-0 p-0"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="fw-bold">Assessed By (Name & Designation)</td>
                  <td>
                    <Input
                      type="text"
                      plainText
                      name="assessedBy"
                      value={formData?.assessedBy}
                      onChange={handleChange}
                      className="p-0 ps-2 text-capitalize"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="fw-bold">
                    Language Used <span style={{ color: "red" }}>*</span>
                  </td>
                  <td>
                    <Input
                      type="text"
                      plainText
                      name="languageUsed"
                      value={formData?.languageUsed}
                      onChange={handleChange}
                      className="p-0 ps-2"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="fw-bold">Interpreter Used (if any)</td>
                  <td>
                    <Input
                      type="text"
                      plainText
                      name="interpreterUsed"
                      onChange={handleChange}
                      className="p-0 ps-2"
                    />
                  </td>
                </tr>
              </tbody>
            </Table>

            {/* 2. Trigger */}
            <h6 className="fw-bold font-italic mt-4 mb-2">
              2. Trigger for Capacity Assessment
            </h6>
            <div className="d-flex flex-wrap gap-3 border p-2 border-dark rounded mb-4">
              {[
                { id: "newAdmission", label: "New admission" },
                {
                  id: "highRiskTreatment",
                  label: "High-risk treatment decision",
                },
                { id: "refusalOfTreatment", label: "Refusal of treatment" },
                { id: "amaRequest", label: "AMA request" },
                { id: "useOfRestraint", label: "Use of restraint" },
                { id: "ectConsent", label: "ECT consent" },
                { id: "routineExamination", label: "Routine Examination" },
              ].map((item) => (
                <FormGroup check key={item.id} className="mb-0">
                  <Input
                    type="checkbox"
                    name={item.id}
                    onChange={handleChange}
                    style={{ border: "1px solid #000" }}
                  />
                  <Label check className="ms-1 small fw-bold">
                    {item.label}
                  </Label>
                </FormGroup>
              ))}
            </div>

            {/* 3. Clinical Context */}
            <h6 className="fw-bold font-italic mb-2">3. Clinical Context</h6>
            <Table bordered size="sm" className="border-dark">
              <tbody>
                <tr>
                  <td style={{ width: "30%" }} className="fw-bold">
                    Primary Diagnosis
                  </td>
                  <td>
                    <Input
                      type="textarea"
                      rows="2"
                      name="primaryDiagnosis"
                      value={formData?.primaryDiagnosis}
                      onChange={handleChange}
                      className="border-0"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="fw-bold">Brief Mental Status Summary</td>
                  <td>
                    <Input
                      type="textarea"
                      rows="2"
                      name="mentalStatusSummary"
                      value={formData?.mentalStatusSummary}
                      onChange={handleChange}
                      className="border-0"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="fw-bold">
                    Factors Affecting Capacity (psychosis, intoxication,
                    delirium etc.)
                  </td>
                  <td>
                    <Input
                      type="textarea"
                      rows="2"
                      name="factorsAffectingCapacity"
                      onChange={handleChange}
                      className="border-0"
                    />
                  </td>
                </tr>
              </tbody>
            </Table>

            {/* 4. Capacity Evaluation Sections */}
            {[
              {
                id: "understandInformation",
                label: "4A. Ability to Understand Information",
              },
              {
                id: "appreciateSituation",
                label: "4B. Ability to Appreciate Situation & Consequences",
              },
              {
                id: "reasonWeighOptions",
                label: "4C. Ability to Reason / Weigh Options",
              },
              {
                id: "communicateChoice",
                label: "4D. Ability to Communicate Choice",
              },
            ].map((section) => (
              <div key={section.id} className="mt-4">
                <h6 className="fw-bold font-italic mb-1">{section.label}</h6>
                <p className="small mb-1 text-muted">Notes:</p>
                <Input
                  type="textarea"
                  rows="3"
                  name={section.id}
                  onChange={handleChange}
                  style={{
                    border: "none",
                    borderBottom: "1px solid #ccc",
                    borderRadius: 0,
                    paddingLeft: 0,
                  }}
                  placeholder="Type assessment notes here..."
                />
              </div>
            ))}

            {/* 5. Overall Capacity Determination */}
            <h6 className="fw-bold font-italic mt-5 mb-2">
              5. Overall Capacity Determination
            </h6>
            <div className="d-flex gap-4 p-2 border border-dark rounded">
              <FormGroup check>
                <Input
                  type="radio"
                  name="overallCapacityDetermination"
                  value="HAS"
                  onChange={handleChange}
                />
                <Label check className="fw-bold small ms-1">
                  Patient HAS capacity for this decision
                </Label>
              </FormGroup>
              <FormGroup check>
                <Input
                  type="radio"
                  name="overallCapacityDetermination"
                  value="LACKS"
                  onChange={handleChange}
                />
                <Label check className="fw-bold small ms-1">
                  Patient LACKS capacity for this decision
                </Label>
              </FormGroup>
              <FormGroup check>
                <Input
                  type="radio"
                  name="overallCapacityDetermination"
                  value="FLUCTUATING"
                  onChange={handleChange}
                />
                <Label check className="fw-bold small ms-1">
                  Fluctuating capacity — reassessment required
                </Label>
              </FormGroup>
            </div>

            {/* 6. If Capacity Lacking */}
            <h6 className="fw-bold font-italic mt-4 mb-2">
              6. If Capacity Lacking
            </h6>
            <Table bordered size="sm" className="border-dark">
              <tbody>
                <tr>
                  <td style={{ width: "30%" }} className="fw-bold">
                    Nominated Representative (NR) informed (Yes/No)
                  </td>
                  <td>
                    <Input
                      type="textarea"
                      rows="2"
                      name="nominatedRepresentativeInformed"
                      value={formData?.nominatedRepresentativeInformed}
                      onChange={handleChange}
                      className="border-0"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="fw-bold">Name of NR</td>
                  <td>
                    <Input
                      type="textarea"
                      rows="2"
                      name="representativeName"
                      value={formData?.representativeName}
                      onChange={handleChange}
                      className="border-0"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="fw-bold">Relationship</td>
                  <td>
                    <Input
                      type="textarea"
                      rows="2"
                      name="relationship"
                      value={formData?.relationship}
                      onChange={handleChange}
                      className="border-0"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="fw-bold">
                    Supported admission initiated
                  </td>
                  <td>
                    <div className="d-flex gap-3 ps-2 py-1">
                      {["Yes", "No"].map((opt) => (
                        <FormGroup check key={opt} className="mb-0">
                          <Input
                            type="radio"
                            name="supportedAdmissionInitiated"
                            value={opt}
                            checked={formData.supportedAdmissionInitiated === opt}
                            onChange={handleChange}
                          />
                          <Label check className="ms-1">{opt}</Label>
                        </FormGroup>
                      ))}
                    </div>
                    {formData.supportedAdmissionInitiated === "Yes" && (
                      <div className="d-flex gap-3 ps-2 py-1">
                        {[{ value: "89", label: "Section 89" }, { value: "90", label: "Section 90" }].map(({ value: sec, label }) => (
                          <FormGroup check key={sec} className="mb-0">
                            <Input
                              type="radio"
                              name="supportedAdmissionSection"
                              value={sec}
                              checked={formData.supportedAdmissionSection === sec}
                              onChange={handleChange}
                            />
                            <Label check className="ms-1">{label}</Label>
                          </FormGroup>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="fw-bold">Next review date</td>
                  <td>
                    <Input
                      type="date"
                      name="nextReviewDate"
                      value={formData?.nextReviewDate}
                      onChange={handleChange}
                      className="border-0"
                      style={{ height: "52px" }}
                    />
                  </td>
                </tr>
              </tbody>
            </Table>

            {/* 7. Risk Flags */}
            <h6 className="fw-bold font-italic mt-4 mb-2">7. Risk Flags</h6>
            <div className="d-flex flex-wrap gap-4 p-2 border border-dark rounded">
              {[
                { id: "suicideRisk", label: "Suicide risk" },
                { id: "violenceRisk", label: "Violence risk" },
                { id: "withdrawalRisk", label: "Severe withdrawal risk" },
                { id: "abscondingRisk", label: "Absconding risk" },
                { id: "vulnerableAdult", label: "Vulnerable adult" },
              ].map((risk) => (
                <FormGroup check key={risk.id}>
                  <Input
                    type="checkbox"
                    name={risk.id}
                    onChange={handleChange}
                  />
                  <Label check className="fw-bold small ms-1">
                    {risk.label}
                  </Label>
                </FormGroup>
              ))}
            </div>

            {/* 8. Management Plan */}
            <h6 className="fw-bold font-italic mt-4 mb-2">
              8. Management Plan
            </h6>
            <Input
              type="textarea"
              rows="4"
              name="managementPlan"
              value={formData?.managementPlan}
              onChange={handleChange}
              style={{ border: "1px solid #000", borderRadius: 0 }}
            />

            {/* 9. Signatures Table */}
            <h6 className="fw-bold font-italic mt-4 mb-2">9. Signatures</h6>
            <Table bordered size="sm" className="border-dark text-center">
              <thead>
                <tr style={tableHeaderStyle}>
                  <th className="small" style={{ width: "30%" }}>
                    Role
                  </th>
                  <th className="small">Name</th>
                  <th className="small">Signature (Initial)</th>
                  <th className="small">Date/Time</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { role: "Consultant Psychiatrist", key: "psychiatrist" },
                  {
                    role: "Consultant Mental Health Professional",
                    key: "secondPsychiatrist",
                  },
                  { role: "Witness (Consultant Mental Health Professional)", key: "witness" },
                ].map((row, index) => (
                  <tr key={index} style={{ height: "90px" }}>
                    <td className="text-start fw-bold  py-2 ps-2">
                      {row.role}
                    </td>
                    <td>
                      {/* <Input
                        type="text"
                        plainText
                        className="px-2"
                        placeholder="Name"
                        // value={formData?.consultantName || ""}
                      // You might need to adjust your state logic to handle signature objects
                      // For now, these will act as visual placeholders
                      /> */}
                      {index === 0 ? (
                        <Input
                          type="text"
                          className="px-2"
                          name="consultantName"
                          value={formData?.consultantName || ""}
                          onChange={handleChange}
                        />
                      ) : index === 1 ? (
                        <Input
                          type="text"
                          className="px-2"
                          name="secondConsultantName"
                          value={formData?.secondConsultantName || ""}
                          onChange={handleChange}
                        />
                      ) : (
                        <Input
                          type="text"
                          plainText
                          className="px-2"
                          placeholder="Name"
                        />
                      )}
                    </td>
                    <td>
                      {index === 0 ? (
                        formData?.consultantSignature &&
                        formData.consultantSignature ===
                          defaultNames.doctorSignature ? (
                          <img
                            src={formData.consultantSignature}
                            alt="Signature"
                            style={{ maxHeight: "80px", maxWidth: "100%" }}
                          />
                        ) : (
                          <Input
                            type="text"
                            className="px-2"
                            name="consultantSignature"
                            value={formData?.consultantSignature || ""}
                            onChange={handleChange}
                            placeholder="Initial"
                          />
                        )
                      ) : index === 1 ? (
                        formData?.secondConsultantSignature &&
                        formData.secondConsultantSignature ===
                          defaultNames.psychologistSignature ? (
                          <img
                            src={formData.secondConsultantSignature}
                            alt="Signature"
                            style={{ maxHeight: "80px", maxWidth: "100%" }}
                          />
                        ) : (
                          <Input
                            type="text"
                            className="px-2"
                            name="secondConsultantSignature"
                            value={formData?.secondConsultantSignature || ""}
                            onChange={handleChange}
                            placeholder="Initial"
                          />
                        )
                      ) : (
                        <Input
                          type="text"
                          plainText
                          className="px-2"
                          placeholder="Initial"
                        />
                      )}
                    </td>
                    <td>
                      {/* <Input type="date" plainText className="px-2" /> */}
                      {index === 0 ? (
                        <Input
                          type="datetime-local"
                          className="px-2"
                          // value={formatDateTimeLocal(new Date())}
                          name="consultantDateTime"
                          value={formData?.consultantDateTime || ""}
                          onChange={handleChange}
                        />
                      ) : index === 1 ? (
                        <Input
                          type="datetime-local"
                          className="px-2"
                          name="secondConsultantDateTime"
                          value={formData?.secondConsultantDateTime || ""}
                          onChange={handleChange}
                        />
                      ) : (
                        <Input
                          type="date"
                          plainText
                          className="px-2"
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </ModalBody>

        <ModalFooter className="border-top-0">
          <Button color="light" className="border" onClick={toggle}>
            Discard
          </Button>
          {/* Saving is the only way to get the printed assessment — the
              standalone Print PDF button was removed so a signed paper copy
              can't exist without a record of it in the system. The preview
              opens from handleSubmit on success. */}
          <Button color="dark" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Spinner size="sm" /> : "Save Assessment and Print"}
          </Button>
        </ModalFooter>
      </Modal>
      <Modal
        isOpen={previewModal}
        toggle={() => setPreviewModal(false)}
        size="xl"
        style={{ maxWidth: "90%" }}
      >
        <ModalHeader toggle={() => setPreviewModal(false)}>
          PDF Preview
        </ModalHeader>
        <ModalBody style={{ height: "80vh" }}>
          {pdfUrl && (
            <iframe
              src={pdfUrl}
              title="PDF Preview"
              width="100%"
              height="100%"
              style={{ border: "none" }}
            />
          )}
        </ModalBody>
        <div className="d-flex justify-content-end p-3">
          <Button
            color="secondary"
            onClick={() => setPreviewModal(false)}
            className="me-2"
          >
            Close
          </Button>
          <Button
            color="primary"
            onClick={() => {
              const link = document.createElement("a");
              link.href = pdfUrl;
              link.download = `capacity-assessment-${formData.patientName}.pdf`;
              link.click();
            }}
          >
            Download
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default CapacityAssessmentModal;
