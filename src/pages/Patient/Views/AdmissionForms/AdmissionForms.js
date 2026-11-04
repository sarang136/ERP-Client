/* eslint-disable react-hooks/exhaustive-deps */
import { useForm } from "react-hook-form";
// import Page1 from "./page1";
// import Page2 from "./page2";
import Admissionpage1 from "./Admissionpage1";
import Admissionpage2 from "./Admissionpage2";
import IndependentAdmAdult from "./IndependentAdmAdult";
import IndependentAdmMinor from "./IndependentAdmMinor";
import AdmWithHighSupport from "./AdmWithHighSupport";
import EmergencyAdmissionForm from "./EmergencyAdmissionForm";
import SeriousnessConsent from "./SeriousnessConsent";
import MediactionConcent from "./MediactionConcent";
import DischargeIndependentAdult from "./DischargeIndependentAdult";
import DischargeVoluntaryAdult from "./DischargeVoluntaryAdult";
import DischargeIndependentMinor from "./DischargeIndependentMinor";
import DischargeWithHighSupport from "./DischargeWithHighSupport";
import DischargeWithHighSupport2 from "./DischargeWithHighSupport2";
import DischargeAMA from "./DischargeAMA";
import DischargeEmergencyTransfer from "./DischargeEmergencyTransfer";
import DischargeAbsconding from "./DischargeAbsconding";
import DischargeInterFacility from "./DischargeInterFacility";
import DischargeDeath from "./DischargeDeath";
// import IndipendentOpinion1 from "./IndipendentOpinion1";
// import IndipendentOpinion2 from "./IndipendentOpinion2";
// import IndipendentOpinion3 from "./IndipendentOpinion3";
import {
  Accordion,
  AccordionBody,
  AccordionItem,
  Button,
  Modal,
  ModalBody,
  ModalHeader,
  Row,
  Spinner,
  UncontrolledTooltip,
} from "reactstrap";
import { useState, useRef, useEffect, useMemo } from "react";
import AdmissionformModal from "../../Modals/Admissionform.modal";
import { connect, useDispatch, useSelector } from "react-redux";
import {
  submitAdmissionForm,
  fetchSopOverview,
} from "../../../../store/features/patient/patientSlice";
import PropTypes from "prop-types";
import jsPDF from "jspdf";
import { captureSection } from "./captureSection";
import axios from "axios";
import { toast } from "react-toastify";
import {
  createEditChart,
  fetchCharts,
  fetchChartsAddmissions,
  fetchPatientById,
} from "../../../../store/actions";
import AddmissionCard from "../Components/AddmissionCard";
import IPD from "../IPD";
import AdmissionChartModal from "../../Modals/AdmissionChart.modal";
import AdmWithHighSupport2 from "./AdmWithHighSupport2";
import DishchargeformModal from "../../Modals/Dishchargeform.modal";
import ConsentformModal from "../../Modals/Consentform.modal";
import UndertakingDischargeForm from "./UndertakingDischargeForm";
import AudioVideoConsentForm from "./AudioVideoConsentForm";
import {
  uploadECTConsentSignedCopy,
  uploadDNRForm,
} from "../../../../helpers/backend_helper";
import MHRBEmailUploadModal from "../../Modals/MHRBEmailUploadModal";
import {
  admissionBelongsToPatient,
  scopeAdmissionsToPatient,
} from "../../../../utils/admissions";
// import { Document, Page, pdfjs } from "react-pdf";
// import pdfWorker from "pdfjs-dist/build/pdf.worker.min.js";
// pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

const AddmissionForms = ({ patient, admissions: allAddmissions }) => {
  const dispatch = useDispatch();
  const formType = useSelector((state) => state.Chart?.chartForm?.chart);
  const finalDiagnosis = useSelector((state) => state.Chart.finalDiagnosis);

  // `state.Chart.data` can hold admissions belonging to any patient visited this
  // session, so scope every read to the patient actually on screen rather than
  // trusting whatever fetch resolved last. See src/utils/admissions.js.
  const addmissionsKey = patient?.addmissions?.join(",") ?? "";
  const scopedAddmissions = useMemo(
    () => scopeAdmissionsToPatient(allAddmissions, patient),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allAddmissions, addmissionsKey],
  );

  // Both names are used throughout this file and both mean "this patient's
  // admissions" — aliasing them here keeps the scoping in one place.
  const admissions = scopedAddmissions;
  const addmissionsCharts = scopedAddmissions;

  const [openform, setOpenform] = useState(false);
  const [dateModal, setDateModal] = useState(false);
  const [dateModal2, setDateModal2] = useState(false);
  const [dateModal3, setDateModal3] = useState(false);
  const [dateModal4, setDateModal4] = useState(false);
  const [chartType, setChartType] = useState("");
  const toggleModal = () => {
    if (dateModal) {
      setAdmissiontype("");
      setEmergencyType("");
      setEmergencyRestraint("");
      setAdultationtype("");
    }
    setDateModal(!dateModal);
  };
  const toggleModal2 = () => setDateModal2(!dateModal2);
  const toggleModal3 = () => {
    if (dateModal3) {
      setAdmissiontype("");
      setAdultationtype("");
      setSupporttype("");
      setEmergencyDischargeType("");
    }
    setDateModal3(!dateModal3);
  };
  const toggleModal4 = () => setDateModal4(!dateModal4);
  const [openform3, setOpenform3] = useState(false);
  const [openform4, setOpenform4] = useState(false);
  const [mhrbModalOpen, setMhrbModalOpen] = useState(false);
  const [mhrbTargetAdmissionId, setMhrbTargetAdmissionId] = useState(null);
  const [addmissionId, setAddmissionId] = useState();
  const [admissiontype, setAdmissiontype] = useState("");
  const [adultationype, setAdultationtype] = useState("");
  const [supporttype, setSupporttype] = useState("");
  const [emergencyType, setEmergencyType] = useState("");
  const [emergencyRestraint, setEmergencyRestraint] = useState("");
  const [chartData, setChartData] = useState([]);
  const [details, setDetails] = useState({
    roomtype: "",
    IPDnum: "",
    bed: "",
    ward: "",
    toPay: "",
    semiprivate: "",
    advDeposit: "",
  });
  const [emergencyDischargeType, setEmergencyDischargeType] = useState("");

  const fileInputRef = useRef(null);
  const emergencyAdmissionFileInputRef = useRef(null);
  const consentFileInputRef = useRef(null);
  const dischargeFileInputRef = useRef(null);
  const emergencyDischargeFileInputRef = useRef(null);
  const undertakingDischargeFileInputRef = useRef(null);
  const capacityAssessmentFileInputRef = useRef(null);
  const ectConsentFileInputRef = useRef(null);
  const dnrFileInputRef = useRef(null);
  // const page1Ref = useRef(null);
  // const page2Ref = useRef(null);
  const seriousnessRef = useRef(null);
  const medicationRef = useRef(null);
  const audioVideoRef = useRef(null);
  const admission1Ref = useRef(null);
  const admission2Ref = useRef(null);
  const adultRef = useRef(null);
  const minorRef = useRef(null);
  const supportRef = useRef(null);
  const emergencyRef = useRef(null);
  // const indipendentref1 = useRef(null);
  // const indipendentref2 = useRef(null);
  // const indipendentref3 = useRef(null);
  const dischargeRefAdult = useRef(null);
  const dischargeRefVoluntary = useRef(null);
  const dischargeRefMinor = useRef(null);
  const dischargeRefUndertaking = useRef(null);
  const dischargeRefSupport = useRef(null);
  const dischargeRefEmergency = useRef(null);

  const [open, setOpen] = useState(addmissionsCharts?.length > 0 ? "0" : null);
  const toggleAccordian = (id) => {
    if (open === id) {
      setOpen();
    } else {
      setOpen(id);
    }
  };

  // This tab never fetched its own admissions — it relied on the Charting tab's
  // IPD.js having populated state.Chart.data first (IPD is imported above but
  // never rendered here). Since Main.js clears that slice on every patient
  // switch, landing on Forms without visiting Charting left the list empty.
  // Fetching here makes the tab self-sufficient, the way Main.js already does
  // for Billing.
  useEffect(() => {
    if (!patient?.addmissions?.length) return;
    dispatch(fetchChartsAddmissions(patient.addmissions));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, patient?._id, addmissionsKey]);

  // Keep the selected admission pointed at one of THIS patient's admissions.
  // The old version was guarded on `addmissionsCharts.length`, so whenever the
  // list was empty — patient just switched, or an OPD patient with no
  // admissions — addmissionId silently kept its previous value. Every submit
  // handler below interpolates it into a PATCH/POST URL, so clearing it is the
  // important half of this effect, not the reselection.
  useEffect(() => {
    if (!addmissionsCharts.length) {
      setOpen(null);
      setAddmissionId(undefined);
      return;
    }
    if (!addmissionsCharts.find((ch) => ch._id === addmissionId)) {
      setOpen("0");
      setAddmissionId(addmissionsCharts[0]?._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?._id, addmissionsCharts]);

  useEffect(() => {
    // chartData is the latest detailAdmission chart and pre-fills the printable
    // forms further down. It is local state, so without the early clear here it
    // survived a patient switch and pre-filled the new patient's forms with the
    // previous patient's details.
    if (!admissionBelongsToPatient(addmissionId, patient)) {
      setChartData(null);
      return;
    }

    // Guards against a slow response for a previous admission landing after the
    // selection has already moved on.
    let cancelled = false;

    dispatch(fetchCharts(addmissionId))
      .unwrap()
      .then((charts) => {
        if (cancelled) return;
        // filter charts that contain detailAdmission
        const detailAdmissionCharts =
          charts.payload?.filter((c) => c.detailAdmission) || [];

        if (detailAdmissionCharts.length > 0) {
          // sort by createdAt or date to get the latest
          const latest = detailAdmissionCharts.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
          )[0];
          setChartData(latest);
        } else {
          setChartData(null); // or []
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setChartData(null);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, patient?._id, addmissionId]);

  // Pre-fill the consent form's Ward/Room and Bed from the admission's own
  // root-level fields (set on the main Admission Form) whenever the selected
  // admission changes. These are only defaults — details.ward/bed stay plain
  // local state the user can freely overwrite before submitting the consent
  // form, and editing them here never writes back to the admission record.
  useEffect(() => {
    if (!admissionBelongsToPatient(addmissionId, patient)) return;
    const currentAddmission = addmissionsCharts.find(
      (a) => a._id === addmissionId,
    );
    if (!currentAddmission) return;
    setDetails((prev) => ({
      ...prev,
      ward: currentAddmission.ward || "",
      bed: currentAddmission.bed || "",
    }));
  }, [addmissionId, addmissionsCharts]);

  const { register, handleSubmit, setValue, reset } = useForm();

  // Belt and braces for the write paths. The scoping above should already make a
  // foreign addmissionId unreachable, but every handler below PATCHes a patient
  // record, and targeting the wrong admission would put one patient's signed
  // form on another patient's file. Cheap to check, so they all check.
  const resolveTargetAddmission = () => {
    if (admissionBelongsToPatient(addmissionId, patient)) return addmissionId;
    toast.error(
      "Could not tell which admission this form belongs to. Please reopen the patient and try again.",
    );
    return null;
  };

  const [isGenerating2, setIsGenerating2] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfUrl2, setPdfUrl2] = useState(null);
  const [pdfUrl3, setPdfUrl3] = useState(null);
  const [previewModal, setPreviewModal] = useState(false);
  const [previewModal2, setPreviewModal2] = useState(false);
  const [previewModal3, setPreviewModal3] = useState(false);

  const togglePreview = () => setPreviewModal(!previewModal);
  const togglePreview2 = () => setPreviewModal2(!previewModal2);
  const togglePreview3 = () => setPreviewModal3(!previewModal3);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const handleDownloadConsent = () => {
    if (!pdfUrl2) return;
    const link = document.createElement("a");
    link.href = pdfUrl2;
    link.download = `${patient?.id?.value}-${patient?.name}-consent-form.pdf`;
    link.click();
  };

  const handleDownloadDischarge = () => {
    if (!pdfUrl3) return;
    const link = document.createElement("a");
    link.href = pdfUrl3;
    link.download = `${patient?.id?.value}-${patient?.name}-Discharge-form.pdf`;
    link.click();
  };

  const handleDownloadAdmission = () => {
    if (!pdfUrl) return;
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = `${patient?.id?.value}-${patient?.name}-admission-form.pdf`;
    link.click();
  };

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  useEffect(() => {
    setOpenform(false);
    setAdmissiontype("");
    setAdultationtype("");
    setSupporttype("");
    setEmergencyType("");
    setEmergencyRestraint("");
    setEmergencyDischargeType("");
    setDetails({
      IPDnum: "",
      bed: "",
      ward: "",
      toPay: "",
      semiprivate: "",
      advDeposit: "",
    });
    dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
  }, [dispatch, patient._id]);

  const onSubmitAdmission = async (data) => {
    const targetId = resolveTargetAddmission();
    if (!targetId) return;
    setIsGenerating2(true);
    try {
      const pdf = new jsPDF("p", "pt", "a4");
      if (adultRef.current) await captureSection(adultRef, pdf, true);
      if (minorRef.current) await captureSection(minorRef, pdf, true);
      if (supportRef.current) await captureSection(supportRef, pdf, true);
      if (emergencyRef.current) await captureSection(emergencyRef, pdf, true);
      const pdfBlob = pdf.output("blob");
      const formData = new FormData();
      if (admissiontype === "EMERGENCY_ADMISSION") {
        formData.append(
          "emergencyAdmissionFormRaw",
          pdfBlob,
          `${patient?.id?.value}-${patient?.name}-emergency-admission-form.pdf`,
        );
      } else {
        formData.append(
          "addmissionfromRaw",
          pdfBlob,
          `${patient?.id?.value}-${patient?.name}-admission-form.pdf`,
        );
      }

      // Add structured form data (filled in the Create New Form modal);
      // conditional fields are gated on their admission type so a stale value
      // from a previously selected type never gets stored.
      const effectiveAdmissionType =
        admissiontype === "MINOR_ADMISSION"
          ? "INDEPENDENT_ADMISSION"
          : admissiontype;
      const effectiveAdultationType =
        admissiontype === "MINOR_ADMISSION" ? "MINOR" : adultationype;
      if (effectiveAdmissionType)
        formData.append("admissionType", effectiveAdmissionType);
      if (
        effectiveAdmissionType === "INDEPENDENT_ADMISSION" &&
        effectiveAdultationType
      )
        formData.append("adultationType", effectiveAdultationType);
      if (effectiveAdmissionType === "SUPPORTIVE_ADMISSION" && supporttype)
        formData.append("supportType", supporttype);
      if (effectiveAdmissionType === "EMERGENCY_ADMISSION" && emergencyType)
        formData.append("emergencyType", emergencyType);
      if (effectiveAdmissionType === "EMERGENCY_ADMISSION" && emergencyRestraint)
        formData.append("emergencyRestraint", emergencyRestraint);

      // Through the slice, not a bare axios call: the response carries the
      // admission's refreshed type timeline and the reducer patches it into
      // state, so the topbar and summary card update without a refetch.
      await dispatch(
        submitAdmissionForm({ admissionId: targetId, formData }),
      ).unwrap();

      // Saved — now show the PDF, reusing the very blob just uploaded so the
      // printed copy and the stored copy cannot differ. This is also why it
      // happens HERE rather than by calling a print handler afterwards: the
      // reset block below unmounts the form and nulls adultRef / minorRef /
      // supportRef / emergencyRef, so a capture at that point would produce an
      // empty PDF.
      try {
        const url = URL.createObjectURL(pdfBlob);
        if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        setPdfUrl(url);
        setPreviewModal(true);
      } catch (previewError) {
        // The form IS saved — never report that as a failure. It can be
        // downloaded from the forms list instead.
        toast.warn("Form submitted, but the PDF preview could not be opened");
      }

      toast.success("Admission form submitted successfully!");
      dispatch(fetchPatientById(patient?._id));
      if (patient?.addmissions?.length) {
        dispatch(fetchChartsAddmissions(patient.addmissions));
      }
      dispatch(
        fetchSopOverview({
          admissionId: targetId,
          currentDate: new Date().toISOString(),
        })
      );
      reset();
      setOpenform(false);
      setAdmissiontype("");
      setAdultationtype("");
      setSupporttype("");
      setEmergencyType("");
      setEmergencyRestraint("");
      setDetails({
        IPDnum: "",
        bed: "",
        ward: "",
        toPay: "",
        semiprivate: "",
        advDeposit: "",
      });
    } catch (error) {
      toast.error("Failed to submit admission form");
    } finally {
      setIsGenerating2(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleEmergencyAdmissionUploadClick = () => {
    emergencyAdmissionFileInputRef.current.click();
  };

  const handleConsentUploadClick = () => {
    consentFileInputRef.current.click();
  };

  const handleDischargeUploadClick = () => {
    dischargeFileInputRef.current.click();
  };

  const handleEmergencyDischargeUploadClick = () => {
    emergencyDischargeFileInputRef.current.click();
  };

  const handleUndertakingDischargeUploadClick = () => {
    undertakingDischargeFileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    const targetId = resolveTargetAddmission();
    if (!targetId) return;
    setIsGenerating2(true);
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.warning("Please upload a PDF file.");
      setIsGenerating2(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("addmissionformURL", file);
      formData.append("id", targetId);
      await axios.patch("/patient/admission-submit-file", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Signed PDF uploaded successfully!");
      dispatch(fetchPatientById(patient?._id));
      if (patient?.addmissions?.length) {
        dispatch(fetchChartsAddmissions(patient.addmissions));
      }
      dispatch(
        fetchSopOverview({
          admissionId: targetId,
          currentDate: new Date().toISOString(),
        })
      );
      setIsGenerating2(false);
    } catch (err) {
      toast.error("Upload failed");
      setIsGenerating2(false);
    }
  };

  const handleFileChangeEmergencyAdmission = async (e) => {
    const file = e.target.files[0];
    const targetId = resolveTargetAddmission();
    if (!targetId) return;
    setIsGenerating2(true);
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.warning("Please upload a PDF file.");
      setIsGenerating2(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("emergencyAdmissionFormURL", file);
      formData.append("id", targetId);
      await axios.patch("/patient/emergency-admission-submit-file", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Signed PDF uploaded successfully!");
      dispatch(fetchPatientById(patient?._id));
      if (patient?.addmissions?.length) {
        dispatch(fetchChartsAddmissions(patient.addmissions));
      }
      dispatch(
        fetchSopOverview({
          admissionId: targetId,
          currentDate: new Date().toISOString(),
        })
      );
      setIsGenerating2(false);
    } catch (err) {
      toast.error("Upload failed");
      setIsGenerating2(false);
    }
  };

  const handleFileChangeConsent = async (e) => {
    const file = e.target.files[0];
    const targetId = resolveTargetAddmission();
    if (!targetId) return;
    setIsGenerating2(true);
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.warning("Please upload a PDF file.");
      setIsGenerating2(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("consentformURL", file);
      formData.append("id", targetId);
      await axios.patch("/patient/consent-submit", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Signed PDF uploaded successfully!");
      dispatch(fetchPatientById(patient?._id));
      if (patient?.addmissions?.length) {
        dispatch(fetchChartsAddmissions(patient.addmissions));
      }
      dispatch(
        fetchSopOverview({
          admissionId: targetId,
          currentDate: new Date().toISOString(),
        })
      );
      setIsGenerating2(false);
    } catch (err) {
      toast.error("Upload failed");
      setIsGenerating2(false);
    }
  };

  const onSubmitConsent = async (data) => {
    const targetId = resolveTargetAddmission();
    if (!targetId) return;
    setIsGenerating2(true);
    try {
      const pdf = new jsPDF("p", "pt", "a4");
      await captureSection(admission1Ref, pdf, true);
      await captureSection(admission2Ref, pdf);

      await captureSection(seriousnessRef, pdf);
      await captureSection(medicationRef, pdf);
      await captureSection(audioVideoRef, pdf);

      const pdfBlob = pdf.output("blob");
      const formData = new FormData();
      formData.append(
        "consentfromRaw",
        pdfBlob,
        `${patient?.id?.value}-${patient?.name}-consent-form.pdf`,
      );

      // Add structured form data
      if (details.roomtype) formData.append("roomType", details.roomtype);
      if (details.ward) formData.append("ward", details.ward);
      if (details.bed) formData.append("bed", details.bed);
      if (details.toPay) formData.append("roomPriceMonthly", details.toPay);
      if (details.semiprivate)
        formData.append("roomPriceDaily", details.semiprivate);
      if (details.advDeposit)
        formData.append("refundableDeposit", details.advDeposit);

      await axios.patch(`/patient/consent-submit-file/${targetId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Saved — now show the PDF, reusing the very blob just uploaded so the
      // printed copy and the stored copy cannot differ. This has to happen
      // before the resets below: closing the modal unmounts the sections, so a
      // capture taken afterwards would rasterise nothing.
      try {
        const url = URL.createObjectURL(pdfBlob);
        if (pdfUrl2) URL.revokeObjectURL(pdfUrl2);
        setPdfUrl2(url);
        setPreviewModal2(true);
      } catch (previewError) {
        // The form IS saved — never turn that into a failure.
        toast.warn("Form submitted, but the PDF preview could not be opened");
      }

      toast.success("Consent form submitted successfully!");
      dispatch(fetchPatientById(patient?._id));
      if (patient?.addmissions?.length) {
        dispatch(fetchChartsAddmissions(patient.addmissions));
      }
      setOpenform4(false);
      setAdmissiontype("");
      setAdultationtype("");
      setSupporttype("");
      setDetails({
        IPDnum: "",
        bed: "",
        ward: "",
        toPay: "",
        semiprivate: "",
        advDeposit: "",
      });
    } catch (error) {
      toast.error("Failed to submit Consent form");
    } finally {
      setIsGenerating2(false);
    }
  };

  const handleFileChangeDishcharge = async (e) => {
    const file = e.target.files[0];
    const targetId = resolveTargetAddmission();
    if (!targetId) return;
    setIsGenerating2(true);
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.warning("Please upload a PDF file.");
      setIsGenerating2(false);
      return;
    }
    try {
      const formData = new FormData();
      formData.append("dischargeFormURL", file);
      formData.append("id", targetId);
      await axios.patch("/patient/discharge-submit", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Signed PDF uploaded successfully!");
      dispatch(fetchPatientById(patient?._id));
      if (patient?.addmissions?.length) {
        dispatch(fetchChartsAddmissions(patient.addmissions));
      }
      dispatch(
        fetchSopOverview({
          admissionId: targetId,
          currentDate: new Date().toISOString(),
        })
      );
      setIsGenerating2(false);
    } catch (err) {
      toast.error("Upload failed");
      setIsGenerating2(false);
    }
  };

  const handleFileChangeEmergencyDischarge = async (e) => {
    const file = e.target.files[0];
    const targetId = resolveTargetAddmission();
    if (!targetId) return;
    setIsGenerating2(true);
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.warning("Please upload a PDF file.");
      setIsGenerating2(false);
      return;
    }
    try {
      const formData = new FormData();
      formData.append("emergencyDischargeFormURL", file);
      formData.append("id", targetId);
      await axios.patch("/patient/discharge-submit", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Signed PDF uploaded successfully!");
      dispatch(fetchPatientById(patient?._id));
      if (patient?.addmissions?.length) {
        dispatch(fetchChartsAddmissions(patient.addmissions));
      }
      dispatch(
        fetchSopOverview({
          admissionId: targetId,
          currentDate: new Date().toISOString(),
        })
      );
      setIsGenerating2(false);
    } catch (err) {
      toast.error("Upload failed");
      setIsGenerating2(false);
    }
  };

  const handleFileChangeundertakingDishcharge = async (e) => {
    const file = e.target.files[0];
    const targetId = resolveTargetAddmission();
    if (!targetId) return;
    setIsGenerating2(true);
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.warning("Please upload a PDF file.");
      setIsGenerating2(false);
      return;
    }
    try {
      const formData = new FormData();
      formData.append("undertakingdischargeFormURL", file);
      formData.append("id", targetId);
      await axios.patch("/patient/undertaking-submit", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Signed PDF uploaded successfully!");
      dispatch(fetchPatientById(patient?._id));
      if (patient?.addmissions?.length) {
        dispatch(fetchChartsAddmissions(patient.addmissions));
      }
      setIsGenerating2(false);
    } catch (err) {
      toast.error("Upload failed");
      setIsGenerating2(false);
    }
  };

  const onSubmitDischarge = async (data) => {
    const targetId = resolveTargetAddmission();
    if (!targetId) return;
    setIsGenerating2(true);

    try {
      const pdf = new jsPDF("p", "pt", "a4");

      if (dischargeRefAdult.current)
        await captureSection(dischargeRefAdult, pdf, true);
      if (dischargeRefVoluntary.current)
        await captureSection(dischargeRefVoluntary, pdf, true);
      if (dischargeRefMinor.current)
        await captureSection(dischargeRefMinor, pdf, true);
      if (dischargeRefUndertaking.current)
        await captureSection(dischargeRefUndertaking, pdf, true);

      if (dischargeRefSupport.current)
        await captureSection(dischargeRefSupport, pdf, true);
      if (dischargeRefEmergency.current)
        await captureSection(dischargeRefEmergency, pdf, true);

      const pdfBlob = pdf.output("blob");
      const formData = new FormData();

      // ---------------------------
      // APPLY CONDITIONS HERE
      // ---------------------------
      if (admissiontype === "DISCHARGE_UNDERTAKING") {
        formData.append(
          "undertakingdischargeFormRaw",
          pdfBlob,
          `${patient?.id?.value}-${patient?.name}-undertaking-discharge-form.pdf`,
        );
      } else if (admissiontype === "EMERGENCY_DISCHARGE") {
        formData.append(
          "emergencyDischargeFormRaw",
          pdfBlob,
          `${patient?.id?.value}-${patient?.name}-emergency-discharge-form.pdf`,
        );
      } else {
        formData.append(
          "dischargeFormRaw",
          pdfBlob,
          `${patient?.id?.value}-${patient?.name}-discharge-form.pdf`,
        );
      }

      // Add structured form data (filled in the Create New Form modal)
      const effectiveDischargeType =
        admissiontype === "MINOR_DISCHARGE"
          ? "INDEPENDENT_ADMISSION"
          : admissiontype;
      const effectiveAdultationType =
        admissiontype === "MINOR_DISCHARGE" ? "MINOR" : adultationype;
      if (effectiveDischargeType)
        formData.append("dischargeType", effectiveDischargeType);
      if (
        effectiveDischargeType === "INDEPENDENT_ADMISSION" &&
        effectiveAdultationType
      )
        formData.append("adultationType", effectiveAdultationType);
      if (effectiveDischargeType === "SUPPORTIVE_ADMISSION" && supporttype)
        formData.append("supportType", supporttype);
      if (effectiveDischargeType === "EMERGENCY_DISCHARGE" && emergencyDischargeType)
        formData.append("emergencyDischargeType", emergencyDischargeType);
      // ---------------------------
      // SELECT API BASED ON CONDITION
      // ---------------------------
      const apiUrl =
        admissiontype === "DISCHARGE_UNDERTAKING"
          ? `/patient/undertaking-discharge-submit-file/${targetId}`
          : `/patient/discharge-submit-file/${targetId}`;

      await axios.patch(apiUrl, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Same as the admission and consent forms: the preview comes from the
      // blob that was just uploaded, and must open before the resets close the
      // modal and unmount the sections it was captured from.
      try {
        const url = URL.createObjectURL(pdfBlob);
        if (pdfUrl3) URL.revokeObjectURL(pdfUrl3);
        setPdfUrl3(url);
        setPreviewModal3(true);
      } catch (previewError) {
        toast.warn("Form submitted, but the PDF preview could not be opened");
      }

      toast.success("Discharge form submitted successfully!");
      dispatch(fetchPatientById(patient?._id));
      if (patient?.addmissions?.length) {
        dispatch(fetchChartsAddmissions(patient.addmissions));
      }
      dispatch(
        fetchSopOverview({
          admissionId: targetId,
          currentDate: new Date().toISOString(),
        })
      );
      setOpenform3(false);
      setAdmissiontype("");
      setAdultationtype("");
      setSupporttype("");
      setEmergencyDischargeType("");
    } catch (error) {
      toast.error("Failed to submit Discharge form");
    } finally {
      setIsGenerating2(false);
    }
  };

  useEffect(() => {
    dispatch(fetchPatientById(patient?._id));
  }, [dispatch, isGenerating2]);

  useEffect(() => {
    if (formType === "ADMISSION FORM") {
      setAdmissiontype("");
      setEmergencyType("");
      setEmergencyRestraint("");
      setAdultationtype("");
      if (!dateModal) toggleModal();
      setDateModal4(false);
      setDateModal3(false);
      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return;
    }

    if (formType === "CONSENT FORM") {
      if (!dateModal4) toggleModal4();
      setDateModal(false);
      setDateModal3(false);
      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return;
    }

    if (formType === "DISCHARGE FORM") {
      setAdmissiontype("");
      setAdultationtype("");
      setSupporttype("");
      setEmergencyDischargeType("");
      if (!dateModal3) toggleModal3();
      setDateModal4(false);
      setDateModal(false);
      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return;
    }

    // Standalone "Undertaking Discharge Form" dropdown entry — jumps straight
    // to the existing openform3/UndertakingDischargeForm flow, skipping the
    // DishchargeformModal admissiontype picker (which no longer offers this
    // as a sub-option). Same submit handler, same API call, same payload —
    // only the entry point changed.
    if (formType === "UNDERTAKING DISCHARGE FORM") {
      setAdmissiontype("DISCHARGE_UNDERTAKING");
      setOpenform3(true);
      setDateModal(false);
      setDateModal4(false);
      setDateModal3(false);
      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return;
    }

    // Standalone "Emergency Admission Form" dropdown entry — opens the same
    // Admissionform.modal.js picker as before, with admissiontype preset to
    // "EMERGENCY_ADMISSION" so it goes straight to the Emergency Type /
    // Restraint selects (see Admissionform.modal.js). Same Submit button,
    // same openform/EmergencyAdmissionForm flow, same payload — only the
    // entry point changed.
    if (formType === "EMERGENCY ADMISSION FORM") {
      setAdmissiontype("EMERGENCY_ADMISSION");
      setDateModal(true);
      setDateModal4(false);
      setDateModal3(false);
      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return;
    }

    if (formType === "EMERGENCY DISCHARGE FORM") {
      setAdmissiontype("EMERGENCY_DISCHARGE");
      setDateModal3(true);
      setDateModal(false);
      setDateModal4(false);
      dispatch(createEditChart({ data: null, chart: null, isOpen: false }));
      return;
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formType, dispatch]);

  // useEffect(() => {
  //   if (openform4) {
  //     setDetails((prev) => ({ ...prev }));
  //   }
  // }, [openform4]);

  useEffect(() => {
    if (previewModal && pdfUrl && /Mobi|Android/i.test(navigator.userAgent)) {
      // On mobile → auto open system PDF viewer
      window.open(pdfUrl, "_blank");
    }

    if (previewModal2 && pdfUrl2 && /Mobi|Android/i.test(navigator.userAgent)) {
      // On mobile → auto open system PDF viewer
      window.open(pdfUrl2, "_blank");
    }
  }, [previewModal, pdfUrl, previewModal2, pdfUrl2]);

  const handleCapacityAssessmentUploadClick = () => {
    capacityAssessmentFileInputRef.current.click();
  };

  const handleFileChangeCapacityAssessment = async (e) => {
    const file = e.target.files[0];
    const targetId = resolveTargetAddmission();
    if (!targetId) return;
    setIsGenerating2(true);

    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.warning("Please upload a PDF file.");
      setIsGenerating2(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("capacityAssessmentFormURL", file);
      formData.append("id", targetId);

      await axios.patch("/patient/capacity-assessment-upload-file", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Capacity Assessment PDF uploaded successfully!");
      dispatch(fetchPatientById(patient?._id));
      if (patient?.addmissions?.length) {
        dispatch(fetchChartsAddmissions(patient.addmissions));
      }
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setIsGenerating2(false);
    }
  };

  const handleECTConsentUploadClick = () => {
    ectConsentFileInputRef.current.click();
  };

  const handleFileChangeECTConsent = async (e) => {
    const file = e.target.files[0];
    const targetId = resolveTargetAddmission();
    if (!targetId) {
      e.target.value = "";
      return;
    }
    setIsGenerating2(true);

    if (!file) {
      setIsGenerating2(false);
      return;
    }

    if (file.type !== "application/pdf") {
      toast.warning("Please upload a PDF file.");
      setIsGenerating2(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("ectConsentFormURL", file);
      formData.append("id", targetId);

      await uploadECTConsentSignedCopy(formData);

      toast.success("ECT Consent PDF uploaded successfully!");
      dispatch(fetchPatientById(patient?._id));
      if (patient?.addmissions?.length) {
        dispatch(fetchChartsAddmissions(patient.addmissions));
      }
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setIsGenerating2(false);
      // Allow re-selecting the same file after a failure.
      e.target.value = "";
    }
  };

  const handleDNRUploadClick = () => {
    dnrFileInputRef.current.click();
  };

  const handleFileChangeDNR = async (e) => {
    const file = e.target.files[0];
    const targetId = resolveTargetAddmission();
    if (!targetId) {
      e.target.value = "";
      return;
    }
    setIsGenerating2(true);

    if (!file) {
      setIsGenerating2(false);
      return;
    }

    if (file.type !== "application/pdf") {
      toast.warning("Please upload a PDF file.");
      setIsGenerating2(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("dnrFormURL", file);
      formData.append("id", targetId);

      await uploadDNRForm(formData);

      toast.success("Do Not Resuscitate Form PDF uploaded successfully!");
      dispatch(fetchPatientById(patient?._id));
      if (patient?.addmissions?.length) {
        dispatch(fetchChartsAddmissions(patient.addmissions));
      }
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setIsGenerating2(false);
      // Allow re-selecting the same file after a failure.
      e.target.value = "";
    }
  };

  const getDischargeFormLabel = (file) => {
    const type = file?.dischargeType;
    const adult = file?.adultationType;
    const support = file?.supportType;
    const emergency = file?.emergencyDischargeType;

    if (type === "INDEPENDENT_ADMISSION" && adult === "ADULT")
      return "Independent (Adult)";
    if (type === "INDEPENDENT_ADMISSION" && adult === "MINOR")
      return "Independent (Minor)";
    if (type === "SUPPORTIVE_ADMISSION" && support === "UPTO30DAYS")
      return "Supportive (≤30 Days)";
    if (type === "SUPPORTIVE_ADMISSION" && support === "BEYOND30DAYS")
      return "Supportive (>30 Days)";
    if (type === "DISCHARGE_UNDERTAKING") return "Discharge Undertaking";
    if (type === "EMERGENCY_DISCHARGE" && emergency === "AMA")
      return "Emergency - AMA";
    if (type === "EMERGENCY_DISCHARGE" && emergency === "EMERGENCY_TRANSFER")
      return "Emergency - Hospital Transfer";
    if (type === "EMERGENCY_DISCHARGE" && emergency === "ABSCONDING")
      return "Emergency - Absconding";
    if (type === "EMERGENCY_DISCHARGE" && emergency === "INTER_FACILITY")
      return "Emergency - Inter-Facility";
    if (type === "EMERGENCY_DISCHARGE" && emergency === "DEATH")
      return "Emergency - Death Declaration";
    return "MHRB Discharge Form";
  };

  return (
    <>
      <div style={{ marginTop: "4rem" }}>
        <Row className="timeline-right row-gap-5">
          {(addmissionsCharts || []).map((test, idx) => (
            <AddmissionCard
              key={idx}
              id={idx}
              data={test}
              toggleModal={toggleModal}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  width: "100%",
                  alignItems: "center",
                }}
              >
                {/* Empty spacer for left side */}
                <div style={{ flex: 1 }}></div>

                {/* Centered button */}
                {/* {(!test?.addmissionform || !test?.consentform) && ( */}
                <div style={{ flex: 1, textAlign: "center" }}>
                  <Button
                    onClick={() => {
                      toggleModal2();
                      setChartType(IPD);
                    }}
                    size="sm"
                  >
                    Create New Form
                  </Button>
                </div>
                {/* )} */}

                {/* Right side (expand/collapse) */}
                <div
                  className="d-flex align-items-center"
                  style={{ flex: 1, justifyContent: "flex-end" }}
                >
                  <UncontrolledTooltip
                    placement="bottom"
                    target={`expand-test-${idx}`}
                  >
                    Expand/Collapse
                  </UncontrolledTooltip>
                  <Button
                    id={`expand-test-${idx}`}
                    onClick={() => {
                      toggleAccordian(idx.toString());
                      setAddmissionId(test?._id);
                    }}
                    size="sm"
                    outline
                  >
                    <i
                      className={`${open === idx.toString()
                          ? "ri-arrow-up-s-line"
                          : "ri-arrow-down-s-line"
                        } fs-6`}
                    ></i>
                  </Button>
                </div>
              </div>

              {/* ACCORDION */}
              <Accordion
                className="timeline-date w-100"
                open={open}
                toggle={toggleAccordian}
              >
                <AccordionItem className="patient-accordion-item">
                  <AccordionBody
                    className="patient-accordion border-0"
                    accordionId={idx.toString()}
                  >
                    <div>
                      <div
                        style={{ width: "100%" }}
                        className="d-flex align-items-center justify-content-between"
                      >
                        <div
                          style={{
                            width: "100%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "1rem",
                          }}
                        >
                          <div
                            style={{
                              display: "grid",
                              // Responsive: fits as many ~220px columns as the
                              // width allows (up to 5 on desktop) and collapses
                              // to fewer — down to 1 on mobile — instead of
                              // cramming 5 fixed columns into every screen.
                              gridTemplateColumns:
                                "repeat(auto-fit, minmax(220px, 1fr))",
                              gap: "clamp(16px, 2vw, 30px)",
                              width: "100%",
                            }}
                          >
                            <div
                            // style={{
                            //   display: "flex",
                            //   flexDirection: "column",
                            //   justifyContent: "center",
                            //   alignItems: "center",
                            //   gap: "30px",
                            // }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  gap: "30px",
                                  width: "100%",
                                }}
                              >
                                <Button
                                  onClick={handleUploadClick}
                                  size="sm"
                                  color="primary"
                                  className="mr-10"
                                  disabled={isGenerating2}
                                  style={{ width: "100%", minHeight: "44px" }}
                                >
                                  {isGenerating2 ? (
                                    <Spinner size="sm" />
                                  ) : (
                                    "Upload Signed Copy Of MHRB Admission"
                                  )}
                                </Button>
                                {test?.addmissionfromRaw?.length > 0 && (
                                  <div
                                    style={{
                                      width: "100%",
                                      textAlign: "center",
                                    }}
                                  >
                                    {test.addmissionfromRaw.map(
                                      (file, index) => (
                                        <div key={index} className="mt-2">
                                          <a
                                            href={file?.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-outline-primary btn-sm"
                                          >
                                            Download Draft MHRB Admission{" "}
                                            {index + 1}{" "}
                                            {file?.uploadedAt
                                              ? `(${new Date(
                                                file.uploadedAt,
                                              ).toLocaleDateString()})`
                                              : ""}
                                          </a>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                )}
                                <input
                                  type="file"
                                  accept="application/pdf"
                                  ref={fileInputRef}
                                  style={{ display: "none" }}
                                  onChange={handleFileChange}
                                />
                                {test?.addmissionformURL?.length > 0 && (
                                  <div
                                    style={{
                                      width: "100%",
                                      textAlign: "center",
                                    }}
                                  >
                                    {test.addmissionformURL.map(
                                      (file, index) => (
                                        <div key={index} className="mt-2">
                                          <a
                                            href={file?.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-outline-primary btn-sm"
                                          >
                                            Download Signed MHRB Admission{" "}
                                            {index + 1}{" "}
                                            {file?.uploadedAt
                                              ? `(${new Date(
                                                file.uploadedAt,
                                              ).toLocaleDateString()})`
                                              : ""}
                                          </a>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  gap: "30px",
                                  width: "100%",
                                }}
                              >
                                <Button
                                  onClick={handleEmergencyAdmissionUploadClick}
                                  size="sm"
                                  color="primary"
                                  className="mr-10"
                                  disabled={isGenerating2}
                                  style={{ width: "100%", minHeight: "44px" }}
                                >
                                  {isGenerating2 ? (
                                    <Spinner size="sm" />
                                  ) : (
                                    "Upload Signed Copy Of Emergency Admission Form"
                                  )}
                                </Button>
                                {test?.emergencyAdmissionFormRaw?.length > 0 && (
                                  <div
                                    style={{
                                      width: "100%",
                                      textAlign: "center",
                                    }}
                                  >
                                    {test.emergencyAdmissionFormRaw.map(
                                      (file, index) => (
                                        <div key={index} className="mt-2">
                                          <a
                                            href={file?.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-outline-primary btn-sm"
                                          >
                                            Download Draft Emergency Admission{" "}
                                            {index + 1}{" "}
                                            {file?.uploadedAt
                                              ? `(${new Date(
                                                file.uploadedAt,
                                              ).toLocaleDateString()})`
                                              : ""}
                                          </a>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                )}
                                <input
                                  type="file"
                                  accept="application/pdf"
                                  ref={emergencyAdmissionFileInputRef}
                                  style={{ display: "none" }}
                                  onChange={handleFileChangeEmergencyAdmission}
                                />
                                {test?.emergencyAdmissionFormURL?.length > 0 && (
                                  <div
                                    style={{
                                      width: "100%",
                                      textAlign: "center",
                                    }}
                                  >
                                    {test.emergencyAdmissionFormURL.map(
                                      (file, index) => (
                                        <div key={index} className="mt-2">
                                          <a
                                            href={file?.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-outline-primary btn-sm"
                                          >
                                            Download Signed Emergency Admission{" "}
                                            {index + 1}{" "}
                                            {file?.uploadedAt
                                              ? `(${new Date(
                                                file.uploadedAt,
                                              ).toLocaleDateString()})`
                                              : ""}
                                          </a>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  gap: "30px",
                                  width: "100%",
                                }}
                              >
                                <Button
                                  onClick={handleConsentUploadClick}
                                  size="sm"
                                  color="primary"
                                  className="mr-10"
                                  disabled={isGenerating2}
                                  style={{ width: "100%", minHeight: "44px" }}
                                >
                                  {isGenerating2 ? (
                                    <Spinner size="sm" />
                                  ) : (
                                    "Upload Signed Copy Of Admission and Consent Form"
                                  )}
                                </Button>
                                <input
                                  type="file"
                                  accept="application/pdf"
                                  ref={consentFileInputRef}
                                  style={{ display: "none" }}
                                  onChange={handleFileChangeConsent}
                                />
                                {test?.consentfromRaw?.length > 0 && (
                                  <div
                                    style={{
                                      width: "100%",
                                      textAlign: "center",
                                    }}
                                  >
                                    {test?.consentfromRaw.map((file, index) => (
                                      <div key={index} className="mt-2">
                                        <a
                                          href={file?.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="btn btn-outline-primary btn-sm"
                                        >
                                          Download Draft Admission and Consent
                                          Form{" "}
                                          {index + 1}{" "}
                                          {file?.uploadedAt
                                            ? `(${new Date(
                                              file.uploadedAt,
                                            ).toLocaleDateString()})`
                                            : ""}
                                        </a>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {test?.consentformURL?.length > 0 && (
                                  <div
                                    style={{
                                      width: "100%",
                                      textAlign: "center",
                                    }}
                                  >
                                    {test?.consentformURL.map((file, index) => (
                                      <div key={index} className="mt-2">
                                        <a
                                          href={file?.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="btn btn-outline-primary btn-sm"
                                        >
                                          Download Signed Admission and
                                          Consent Form{" "}
                                          {index + 1}{" "}
                                          {file?.uploadedAt
                                            ? `(${new Date(
                                              file.uploadedAt,
                                            ).toLocaleDateString()})`
                                            : ""}
                                        </a>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  gap: "30px",
                                  width: "100%",
                                }}
                              >
                                <Button
                                  onClick={
                                    handleUndertakingDischargeUploadClick
                                  }
                                  size="sm"
                                  color="primary"
                                  className="mr-10"
                                  disabled={isGenerating2}
                                  style={{ width: "100%", minHeight: "44px" }}
                                >
                                  {isGenerating2 ? (
                                    <Spinner size="sm" />
                                  ) : (
                                    "Upload Signed Copy Of Undertaking MHRB Discharge Form"
                                  )}
                                </Button>
                                <input
                                  type="file"
                                  accept="application/pdf"
                                  ref={undertakingDischargeFileInputRef}
                                  className="sr-only"
                                  // style={{ display: "none" }}
                                  onChange={(e) => {
                                    handleFileChangeundertakingDishcharge(e);
                                  }}
                                />
                                {test?.undertakingdischargeFormRaw?.length >
                                  0 && (
                                    <div
                                      style={{
                                        width: "100%",
                                        textAlign: "center",
                                      }}
                                    >
                                      {test?.undertakingdischargeFormRaw.map(
                                        (file, index) => (
                                          <div key={index} className="mt-2">
                                            <a
                                              href={file?.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="btn btn-outline-primary btn-sm"
                                            >
                                              Download Draft Undertaking MHRB
                                              Discharge Form {index + 1}{" "}
                                              {file?.uploadedAt
                                                ? `(${new Date(
                                                  file.uploadedAt,
                                                ).toLocaleDateString()})`
                                                : ""}
                                            </a>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  )}
                                {test?.undertakingdischargeFormURL?.length >
                                  0 && (
                                    <div
                                      style={{
                                        width: "100%",
                                        textAlign: "center",
                                      }}
                                    >
                                      {test?.undertakingdischargeFormURL.map(
                                        (file, index) => (
                                          <div key={index} className="mt-2">
                                            <a
                                              href={file?.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="btn btn-outline-primary btn-sm"
                                            >
                                              Download Signed Undertaking MHRB
                                              Discharge Form {index + 1}{" "}
                                              {file?.uploadedAt
                                                ? `(${new Date(
                                                  file.uploadedAt,
                                                ).toLocaleDateString()})`
                                                : ""}
                                            </a>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  )}
                              </div>
                            </div>

                            <div>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  gap: "30px",
                                  width: "100%",
                                }}
                              >
                                <Button
                                  onClick={handleDischargeUploadClick}
                                  size="sm"
                                  color="primary"
                                  className="mr-10"
                                  disabled={isGenerating2}
                                  label="patient-discharge-form"
                                  style={{ width: "100%", minHeight: "44px" }}
                                >
                                  {isGenerating2 ? (
                                    <Spinner size="sm" />
                                  ) : (
                                    "Upload Signed Copy Of MHRB Discharge Form"
                                  )}
                                </Button>
                                <input
                                  id="patient-discharge-form"
                                  type="file"
                                  accept="application/pdf"
                                  ref={dischargeFileInputRef}
                                  className="sr-only"
                                  // style={{ display: "none" }}
                                  onChange={(e) => {
                                    handleFileChangeDishcharge(e);
                                  }}
                                />
                                {test?.dischargeFormRaw?.length > 0 && (
                                  <div
                                    style={{
                                      width: "100%",
                                      textAlign: "center",
                                    }}
                                  >
                                    {test?.dischargeFormRaw
                                      ?.map((file, index) => (
                                        <div key={index} className="mt-2">
                                          <a
                                            href={file?.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-outline-primary btn-sm"
                                          >
                                            Download Draft MHRB Discharge
                                            Form —{" "}
                                            {getDischargeFormLabel(file)}{" "}
                                            {index + 1}{" "}
                                            {file?.uploadedAt
                                              ? `(${new Date(
                                                file.uploadedAt,
                                              ).toLocaleDateString()})`
                                              : ""}
                                          </a>
                                        </div>
                                      ),
                                      )}
                                  </div>
                                )}
                                {test?.dischargeFormURL?.length > 0 && (
                                  <div
                                    style={{
                                      width: "100%",
                                      textAlign: "center",
                                    }}
                                  >
                                    {test?.dischargeFormURL
                                      ?.map((file, index) => (
                                        <div key={index} className="mt-2">
                                          <a
                                            href={file?.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-outline-primary btn-sm"
                                          >
                                            Download Signed MHRB Discharge
                                            Form{" "}
                                            {index + 1}{" "}
                                            {file?.uploadedAt
                                              ? `(${new Date(
                                                file.uploadedAt,
                                              ).toLocaleDateString()})`
                                              : ""}
                                          </a>
                                        </div>
                                      ),
                                      )}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  gap: "30px",
                                  width: "100%",
                                }}
                              >
                                <Button
                                  onClick={handleEmergencyDischargeUploadClick}
                                  size="sm"
                                  color="primary"
                                  className="mr-10"
                                  disabled={isGenerating2}
                                  label="patient-emergency-discharge-form"
                                  style={{ width: "100%", minHeight: "44px" }}
                                >
                                  {isGenerating2 ? (
                                    <Spinner size="sm" />
                                  ) : (
                                    "Upload Signed Copy Of Emergency Discharge Form"
                                  )}
                                </Button>
                                <input
                                  id="patient-emergency-discharge-form"
                                  type="file"
                                  accept="application/pdf"
                                  ref={emergencyDischargeFileInputRef}
                                  className="sr-only"
                                  onChange={handleFileChangeEmergencyDischarge}
                                />
                                {test?.emergencyDischargeFormRaw?.length > 0 && (
                                  <div
                                    style={{
                                      width: "100%",
                                      textAlign: "center",
                                    }}
                                  >
                                    {test?.emergencyDischargeFormRaw.map(
                                      (file, index) => (
                                        <div key={index} className="mt-2">
                                          <a
                                            href={file?.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-outline-primary btn-sm"
                                          >
                                            Download Draft Emergency Discharge Form —{" "}
                                            {getDischargeFormLabel(file)}{" "}
                                            {index + 1}{" "}
                                            {file?.uploadedAt
                                              ? `(${new Date(
                                                file.uploadedAt,
                                              ).toLocaleDateString()})`
                                              : ""}
                                          </a>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                )}
                                {test?.emergencyDischargeFormURL?.length > 0 && (
                                  <div
                                    style={{
                                      width: "100%",
                                      textAlign: "center",
                                    }}
                                  >
                                    {test?.emergencyDischargeFormURL.map(
                                      (file, index) => (
                                        <div key={index} className="mt-2">
                                          <a
                                            href={file?.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-outline-primary btn-sm"
                                          >
                                            Download Signed Emergency Discharge Form{" "}
                                            {index + 1}{" "}
                                            {file?.uploadedAt
                                              ? `(${new Date(
                                                file.uploadedAt,
                                              ).toLocaleDateString()})`
                                              : ""}
                                          </a>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* MHRB email form */}
                            <div>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  gap: "30px",
                                  width: "100%",
                                }}
                              >
                                <Button
                                  onClick={() => {
                                    const targetId = resolveTargetAddmission();
                                    if (targetId) {
                                      setMhrbTargetAdmissionId(targetId);
                                      setMhrbModalOpen(true);
                                    }
                                  }}
                                  size="sm"
                                  color="primary"
                                  className="mr-10"
                                  disabled={isGenerating2}
                                  style={{ width: "100%", minHeight: "60px" }}
                                >
                                  {isGenerating2 ? (
                                    <Spinner size="sm" />
                                  ) : (
                                    "MHRB Email Upload"
                                  )}
                                </Button>

                                {test?.mhrbEmailFormURL?.length > 0 && (
                                  <div
                                    style={{
                                      width: "100%",
                                      textAlign: "center",
                                    }}
                                  >
                                    {test.mhrbEmailFormURL.map(
                                      (file, index) => (
                                        <div key={index} className="mt-2">
                                          <a
                                            href={file?.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-outline-success btn-sm"
                                          >
                                            Download MHRB Email File{" "}
                                            {index + 1}{" "}
                                            {file?.uploadedAt
                                              ? `(${new Date(file.uploadedAt).toLocaleDateString()})`
                                              : ""}
                                          </a>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* ── Group 2: standalone forms (no section header) ── */}
                            <div>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  gap: "30px",
                                  width: "100%",
                                }}
                              >
                                <Button
                                  onClick={handleCapacityAssessmentUploadClick}
                                  size="sm"
                                  color="primary"
                                  className="mr-10"
                                  disabled={isGenerating2}
                                  style={{ width: "100%", minHeight: "44px" }}
                                >
                                  {isGenerating2 ? (
                                    <Spinner size="sm" />
                                  ) : (
                                    "Upload Signed Copy Of Capacity Assessment"
                                  )}
                                </Button>

                                <input
                                  type="file"
                                  accept="application/pdf"
                                  ref={capacityAssessmentFileInputRef}
                                  style={{ display: "none" }}
                                  onChange={handleFileChangeCapacityAssessment}
                                />

                                {test?.capacityAssessmentFormRaw?.length >
                                  0 && (
                                    <div
                                      style={{
                                        width: "100%",
                                        textAlign: "center",
                                      }}
                                    >
                                      {test.capacityAssessmentFormRaw.map(
                                        (form, index) => (
                                          <div key={index} className="mt-2">
                                            <a
                                              href={form?.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="btn btn-outline-primary btn-sm"
                                            >
                                              Download Draft Capacity Form{" "}
                                              {index + 1}{" "}
                                              {form?.lastUpdatedAt
                                                ? `(${new Date(form.lastUpdatedAt).toLocaleDateString()})`
                                                : ""}
                                            </a>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  )}
                                {test?.capacityAssessmentFormURL?.length >
                                  0 && (
                                    <div
                                      style={{
                                        width: "100%",
                                        textAlign: "center",
                                      }}
                                    >
                                      {test.capacityAssessmentFormURL.map(
                                        (file, index) => (
                                          <div key={index} className="mt-2">
                                            <a
                                              href={file?.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="btn btn-outline-success btn-sm"
                                            >
                                              Download Signed Capacity Form{" "}
                                              {index + 1}{" "}
                                              {file?.uploadedAt
                                                ? `(${new Date(file.uploadedAt).toLocaleDateString()})`
                                                : ""}
                                            </a>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  )}
                              </div>
                            </div>

                            {/* ECT consent form — filled from the Add Records
                                dropdown, downloaded and signed here. */}
                            <div>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  gap: "30px",
                                  width: "100%",
                                }}
                              >
                                <Button
                                  onClick={handleECTConsentUploadClick}
                                  size="sm"
                                  color="primary"
                                  className="mr-10"
                                  disabled={isGenerating2}
                                  style={{ width: "100%", minHeight: "60px" }}
                                >
                                  {isGenerating2 ? (
                                    <Spinner size="sm" />
                                  ) : (
                                    "Upload Signed Copy Of ECT Consent"
                                  )}
                                </Button>

                                <input
                                  type="file"
                                  accept="application/pdf"
                                  ref={ectConsentFileInputRef}
                                  style={{ display: "none" }}
                                  onChange={handleFileChangeECTConsent}
                                />

                                {test?.ectConsentFormRaw?.length > 0 && (
                                  <div
                                    style={{
                                      width: "100%",
                                      textAlign: "center",
                                    }}
                                  >
                                    {test.ectConsentFormRaw.map(
                                      (form, index) => (
                                        <div key={index} className="mt-2">
                                          <a
                                            href={form?.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-outline-primary btn-sm"
                                          >
                                            Download Draft ECT Consent{" "}
                                            {index + 1}{" "}
                                            {form?.uploadedAt
                                              ? `(${new Date(form.uploadedAt).toLocaleDateString()})`
                                              : ""}
                                          </a>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                )}
                                {test?.ectConsentFormURL?.length > 0 && (
                                  <div
                                    style={{
                                      width: "100%",
                                      textAlign: "center",
                                    }}
                                  >
                                    {test.ectConsentFormURL.map(
                                      (file, index) => (
                                        <div key={index} className="mt-2">
                                          <a
                                            href={file?.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-outline-success btn-sm"
                                          >
                                            Download Signed ECT Consent{" "}
                                            {index + 1}{" "}
                                            {file?.uploadedAt
                                              ? `(${new Date(file.uploadedAt).toLocaleDateString()})`
                                              : ""}
                                          </a>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* DNR (Do Not Resuscitate) form */}
                            <div>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  gap: "30px",
                                  width: "100%",
                                }}
                              >
                                <Button
                                  onClick={handleDNRUploadClick}
                                  size="sm"
                                  color="primary"
                                  className="mr-10"
                                  disabled={isGenerating2}
                                  style={{ width: "100%", minHeight: "60px" }}
                                >
                                  {isGenerating2 ? (
                                    <Spinner size="sm" />
                                  ) : (
                                    "Upload Signed Copy Of Do Not Resuscitate Form"
                                  )}
                                </Button>

                                <input
                                  type="file"
                                  accept="application/pdf"
                                  ref={dnrFileInputRef}
                                  style={{ display: "none" }}
                                  onChange={handleFileChangeDNR}
                                />

                                {test?.dnrFormRaw?.length > 0 && (
                                  <div
                                    style={{
                                      width: "100%",
                                      textAlign: "center",
                                    }}
                                  >
                                    {test.dnrFormRaw.map((form, index) => (
                                      <div key={index} className="mt-2">
                                        <a
                                          href={form?.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="btn btn-outline-primary btn-sm"
                                        >
                                          Download Draft Do Not Resuscitate
                                          Form {index + 1}{" "}
                                          {form?.uploadedAt
                                            ? `(${new Date(form.uploadedAt).toLocaleDateString()})`
                                            : ""}
                                        </a>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {test?.dnrFormURL?.length > 0 && (
                                  <div
                                    style={{
                                      width: "100%",
                                      textAlign: "center",
                                    }}
                                  >
                                    {test.dnrFormURL.map((file, index) => (
                                      <div key={index} className="mt-2">
                                        <a
                                          href={file?.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="btn btn-outline-success btn-sm"
                                        >
                                          Download Signed Do Not Resuscitate
                                          Form {index + 1}{" "}
                                          {file?.uploadedAt
                                            ? `(${new Date(file.uploadedAt).toLocaleDateString()})`
                                            : ""}
                                        </a>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionBody>
                </AccordionItem>
              </Accordion>
            </AddmissionCard>
          ))}
        </Row>
      </div>

      <Modal
        isOpen={openform}
        toggle={() => {
          reset();
          setOpenform(false);
          setAdmissiontype("");
          setAdultationtype("");
          setSupporttype("");
          setEmergencyType("");
          setEmergencyRestraint("");
        }}
        size="xl"
        backdrop="static"
        keyboard={false}
      >
        <ModalHeader
          toggle={() => {
            reset();
            setOpenform(false);
            setAdmissiontype("");
            setAdultationtype("");
            setSupporttype("");
            setEmergencyType("");
            setEmergencyRestraint("");
          }}
        >
          MHRB Admission
        </ModalHeader>
        <ModalBody style={{ height: "80vh", overflow: "auto" }}>
          {openform === true ? (
            <form onSubmit={handleSubmit(onSubmitAdmission)}>
              {/* common start */}
              {/* <div ref={page1Ref}>
            <Page1
              register={register}
              admissions={admissions}
              patient={patient}
            />
          </div>
          <div ref={page2Ref}>
            <Page2 register={register} patient={patient} />
          </div>
          {/* common end */}
              {/* for adult */}
              {admissiontype === "INDEPENDENT_ADMISSION" &&
                adultationype === "ADULT" && (
                  <div ref={adultRef}>
                    <IndependentAdmAdult
                      register={register}
                      chartData={chartData}
                      patient={patient}
                      details={details}
                    />
                  </div>
                )}
              {/* for minor */}
              {admissiontype === "MINOR_ADMISSION" && (
                <div ref={minorRef}>
                  <IndependentAdmMinor
                    register={register}
                    chartData={chartData}
                    patient={patient}
                    details={details}
                  />
                </div>
              )}
              {/* support form */}
              {admissiontype === "SUPPORTIVE_ADMISSION" &&
                supporttype === "UPTO30DAYS" && (
                  <div ref={supportRef}>
                    <AdmWithHighSupport
                      register={register}
                      chartData={chartData}
                      patient={patient}
                      details={details}
                    />
                  </div>
                )}
              {admissiontype === "SUPPORTIVE_ADMISSION" &&
                supporttype === "BEYOND30DAYS" && (
                  <div ref={supportRef}>
                    <AdmWithHighSupport2
                      register={register}
                      chartData={chartData}
                      patient={patient}
                      details={details}
                    />
                  </div>
                )}
              {/* emergency admission form */}
              {admissiontype === "EMERGENCY_ADMISSION" && (
                <div ref={emergencyRef}>
                  <EmergencyAdmissionForm
                    register={register}
                    setValue={setValue}
                    chartData={chartData}
                    patient={patient}
                    details={details}
                    emergencyType={emergencyType}
                    emergencyRestraint={emergencyRestraint}
                  />
                </div>
              )}
              {/* hidden opinions */}
              {/* <div
                style={{
                  position: "absolute",
                  top: "-9999px",
                  left: "0",
                  visibility: "visible",
                  pointerEvents: "none",
                }}
              >
                <div ref={indipendentref1}>
                  <IndipendentOpinion1
                    register={register}
                    patient={patient}
                    details={details}
                  />
                </div>
                <div ref={indipendentref2}>
                  <IndipendentOpinion2
                    register={register}
                    patient={patient}
                    details={details}
                  />
                </div>
                <div ref={indipendentref3}>
                  <IndipendentOpinion3
                    register={register}
                    patient={patient}
                    details={details}
                  />
                </div>
              </div> */}
              <div style={{ textAlign: "center", margin: "20px" }}>
                {/* Submitting is the only way to get the printed form — the
                    standalone Print PDF button was removed so a signed paper
                    copy can't exist without a record of it in the system. The
                    preview opens from onSubmitAdmission on success. */}
                <Button
                  color="secondary"
                  type="submit"
                  className="me-2"
                  disabled={isGenerating2}
                >
                  {isGenerating2 ? (
                    <Spinner size="sm" />
                  ) : (
                    "Submit and Print PDF"
                  )}
                </Button>
                <Button
                  style={{ marginLeft: "8px" }}
                  color="secondary"
                  className="me-2"
                  disabled={isGenerating2}
                  onClick={() => {
                    reset();
                    setOpenform(false);
                    setAdmissiontype("");
                    setAdultationtype("");
                    setSupporttype("");
                    setEmergencyType("");
                    setEmergencyRestraint("");
                  }}
                >
                  Close
                </Button>
              </div>
            </form>
          ) : (
            ""
          )}
        </ModalBody>
      </Modal>
      <Modal
        isOpen={openform4}
        toggle={() => {
          setOpenform4(false);
        }}
        size="xl"
        backdrop="static"
        keyboard={false}
      >
        <ModalHeader
          toggle={() => {
            setOpenform4(false);
          }}
        >
          Admission and Consent Form
        </ModalHeader>
        <ModalBody style={{ height: "80vh", overflow: "auto" }}>
          {openform4 === true ? (
            <form onSubmit={handleSubmit(onSubmitConsent)}>
              <div ref={admission1Ref}>
                <Admissionpage1
                  register={register}
                  chartData={chartData}
                  admissions={admissions}
                  patient={patient}
                  details={details}
                />
              </div>
              <div ref={admission2Ref}>
                <Admissionpage2
                  register={register}
                  patient={patient}
                  details={details}
                />
              </div>
              <div ref={seriousnessRef}>
                <SeriousnessConsent register={register} patient={patient} />
              </div>
              <div ref={medicationRef}>
                <MediactionConcent register={register} patient={patient} />
              </div>
              {/* The two ECT consent pages now live in their own form —
                  see Modals/ECTConsentFormModal.js */}
              <div ref={audioVideoRef}>
                <AudioVideoConsentForm register={register} patient={patient} />
              </div>

              <div style={{ textAlign: "center", margin: "20px" }}>
                {/* Submitting is the only way to get the printed form — the
                    standalone Print PDF button was removed so a signed paper
                    copy can't exist without a record of it in the system. The
                    preview opens from onSubmitConsent on success. */}
                <Button
                  color="secondary"
                  type="submit"
                  className="me-2"
                  disabled={isGenerating2}
                >
                  {isGenerating2 ? (
                    <Spinner size="sm" />
                  ) : (
                    "Submit and Print PDF"
                  )}
                </Button>
                <Button
                  style={{ marginLeft: "8px" }}
                  color="secondary"
                  className="me-2"
                  disabled={isGenerating2}
                  onClick={() => {
                    setOpenform4(false);
                  }}
                >
                  Close
                </Button>
              </div>
            </form>
          ) : (
            ""
          )}
        </ModalBody>
      </Modal>
        <Modal
        isOpen={openform3}
        toggle={() => {
          setOpenform3(false);
          setAdmissiontype("");
          setAdultationtype("");
          setSupporttype("");
          setEmergencyDischargeType("");
        }}
        size="xl"
        backdrop="static"
        keyboard={false}
      >
        <ModalHeader
          toggle={() => {
            setOpenform3(false);
            setAdmissiontype("");
            setAdultationtype("");
            setSupporttype("");
            setEmergencyDischargeType("");
          }}
        >
          {admissiontype === "EMERGENCY_DISCHARGE"
            ? "Emergency Discharge Form"
            : admissiontype === "DISCHARGE_UNDERTAKING"
            ? "Undertaking Discharge Form"
            : "MHRB Discharge Form"}
        </ModalHeader>
        <ModalBody style={{ height: "80vh", overflow: "auto" }}>
          {openform3 === true ? (
            <form onSubmit={handleSubmit(onSubmitDischarge)}>
              {admissiontype === "INDEPENDENT_ADMISSION" &&
                adultationype === "ADULT" && (
                  <div ref={dischargeRefAdult}>
                    <DischargeIndependentAdult
                      register={register}
                      admissions={admissions[0]}
                      patient={patient}
                    />
                  </div>
                )}{" "}
              {/* Voluntary Adult — Section 86 */}
              {admissiontype === "INDEPENDENT_ADMISSION" &&
                adultationype === "VOLUNTARY_ADULT" && (
                  <div ref={dischargeRefVoluntary}>
                    <DischargeVoluntaryAdult
                      register={register}
                      admissions={admissions[0]}
                      patient={patient}
                      finalDiagnosis={finalDiagnosis?.code || ""}
                    />
                  </div>
                )}
              {/* for minor */}{" "}
              {admissiontype === "MINOR_DISCHARGE" && (
                <div ref={dischargeRefMinor}>
                  <DischargeIndependentMinor
                    register={register}
                    admissions={admissions[0]}
                    patient={patient}
                  />
                </div>
              )}
              {/* Undertaking Discharge */}{" "}
              {admissiontype === "DISCHARGE_UNDERTAKING" && (
                <div ref={dischargeRefUndertaking}>
                  <UndertakingDischargeForm
                    register={register}
                    admissions={admissions[0]}
                    patient={patient}
                  />
                </div>
              )}
              {admissiontype === "SUPPORTIVE_ADMISSION" &&
                supporttype === "UPTO30DAYS" && (
                  <div ref={dischargeRefSupport}>
                    <DischargeWithHighSupport
                      register={register}
                      admissions={admissions[0]}
                      patient={patient}
                      finalDiagnosis={finalDiagnosis?.code || ""}
                    />
                  </div>
                )}
              {/* Supportive Discharge — Section 90 >30 days */}
              {admissiontype === "SUPPORTIVE_ADMISSION" &&
                supporttype === "BEYOND30DAYS" && (
                  <div ref={dischargeRefSupport}>
                    <DischargeWithHighSupport2
                      register={register}
                      admissions={admissions[0]}
                      patient={patient}
                      finalDiagnosis={finalDiagnosis?.code || ""}
                    />
                  </div>
                )}
              {/* Emergency Discharge — AMA */}
              {admissiontype === "EMERGENCY_DISCHARGE" &&
                emergencyDischargeType === "AMA" && (
                  <div ref={dischargeRefEmergency}>
                    <DischargeAMA
                      register={register}
                      admissions={admissions[0]}
                      patient={patient}
                      finalDiagnosis={finalDiagnosis?.code || ""}
                    />
                  </div>
                )}
              {/* Emergency Discharge — Emergency Hospital Transfer */}
              {admissiontype === "EMERGENCY_DISCHARGE" &&
                emergencyDischargeType === "EMERGENCY_TRANSFER" && (
                  <div ref={dischargeRefEmergency}>
                    <DischargeEmergencyTransfer
                      register={register}
                      admissions={admissions[0]}
                      patient={patient}
                      chartData={chartData}
                      setValue={setValue}
                    />
                  </div>
                )}
              {/* Emergency Discharge — Absconding */}
              {admissiontype === "EMERGENCY_DISCHARGE" &&
                emergencyDischargeType === "ABSCONDING" && (
                  <div ref={dischargeRefEmergency}>
                    <DischargeAbsconding
                      register={register}
                      admissions={admissions[0]}
                      patient={patient}
                    />
                  </div>
                )}
              {/* Emergency Discharge — Inter-Facility Transfer */}
              {admissiontype === "EMERGENCY_DISCHARGE" &&
                emergencyDischargeType === "INTER_FACILITY" && (
                  <div ref={dischargeRefEmergency}>
                    <DischargeInterFacility
                      register={register}
                      admissions={admissions[0]}
                      patient={patient}
                      chartData={chartData}
                      setValue={setValue}
                      finalDiagnosis={finalDiagnosis?.code || ""}
                    />
                  </div>
                )}
              {/* Emergency Discharge — Death / Expiry Declaration */}
              {admissiontype === "EMERGENCY_DISCHARGE" &&
                emergencyDischargeType === "DEATH" && (
                  <div ref={dischargeRefEmergency}>
                    <DischargeDeath
                      register={register}
                      admissions={admissions[0]}
                      patient={patient}
                      finalDiagnosis={finalDiagnosis?.code || ""}
                    />
                  </div>
                )}
              <div style={{ textAlign: "center", margin: "20px" }}>
                {/* One action only — see the consent form above. The modal
                    header's own toggle is how this form is closed. */}
                <Button
                  color="secondary"
                  type="submit"
                  className="me-2"
                  disabled={isGenerating2}
                >
                  {isGenerating2 ? (
                    <Spinner size="sm" />
                  ) : (
                    "Submit and Print PDF"
                  )}
                </Button>
              </div>
            </form>
          ) : (
            ""
          )}
        </ModalBody>
      </Modal>

      {/* ===== PDF Preview Modal ===== */}
      <Modal
        isOpen={previewModal}
        toggle={togglePreview}
        size="xl"
        style={{ maxWidth: "90%" }}
      >
        <ModalHeader toggle={togglePreview}>PDF Preview</ModalHeader>
        <ModalBody style={{ height: "80vh" }}>
          {pdfUrl ? (
            /Mobi|Android/i.test(navigator.userAgent) ? (
              // On mobile → show fallback message instead of iframe
              <div className="d-flex justify-content-center align-items-center h-100">
                <p className="text-muted">PDF opened in a new tab</p>
              </div>
            ) : (
              // On desktop → show inside iframe
              <iframe
                src={pdfUrl}
                title="PDF Preview"
                width="100%"
                height="100%"
                style={{ border: "none" }}
              />
            )
          ) : (
            <div className="d-flex justify-content-center align-items-center h-100">
              <Spinner />
            </div>
          )}
        </ModalBody>
        <div className="d-flex justify-content-end p-3">
          <Button color="secondary" onClick={togglePreview} className="me-2">
            Close
          </Button>
          <Button color="primary" onClick={handleDownloadAdmission}>
            Download
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={previewModal2}
        toggle={togglePreview2}
        size="xl"
        style={{ maxWidth: "90%" }}
      >
        <ModalHeader toggle={togglePreview2}>PDF Preview</ModalHeader>
        <ModalBody style={{ height: "80vh" }}>
          {pdfUrl2 ? (
            /Mobi|Android/i.test(navigator.userAgent) ? (
              // On mobile → show fallback message instead of iframe
              <div className="d-flex justify-content-center align-items-center h-100">
                <p className="text-muted">PDF opened in a new tab</p>
              </div>
            ) : (
              // On desktop → show inside iframe
              <iframe
                src={pdfUrl2}
                title="PDF Preview"
                width="100%"
                height="100%"
                style={{ border: "none" }}
              />
            )
          ) : (
            <div className="d-flex justify-content-center align-items-center h-100">
              <Spinner />
            </div>
          )}
        </ModalBody>
        <div className="d-flex justify-content-end p-3">
          <Button color="secondary" onClick={togglePreview2} className="me-2">
            Close
          </Button>
          <Button color="primary" onClick={handleDownloadConsent}>
            Download
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={previewModal3}
        toggle={togglePreview3}
        size="xl"
        style={{ maxWidth: "90%" }}
      >
        <ModalHeader toggle={togglePreview3}>PDF Preview</ModalHeader>
        <ModalBody style={{ height: "80vh" }}>
          {pdfUrl3 ? (
            /Mobi|Android/i.test(navigator.userAgent) ? (
              // On mobile → show fallback message instead of iframe
              <div className="d-flex justify-content-center align-items-center h-100">
                <p className="text-muted">PDF opened in a new tab</p>
              </div>
            ) : (
              // On desktop → show inside iframe
              <iframe
                src={pdfUrl3}
                title="PDF Preview"
                width="100%"
                height="100%"
                style={{ border: "none" }}
              />
            )
          ) : (
            <div className="d-flex justify-content-center align-items-center h-100">
              <Spinner />
            </div>
          )}
        </ModalBody>
        <div className="d-flex justify-content-end p-3">
          <Button color="secondary" onClick={togglePreview3} className="me-2">
            Close
          </Button>
          <Button color="primary" onClick={handleDownloadDischarge}>
            Download
          </Button>
        </div>
      </Modal>
      <AdmissionChartModal
        type={chartType}
        isOpen={dateModal2}
        toggle={toggleModal2}
        patient={patient}
      />
      <AdmissionformModal
        isOpen={dateModal}
        toggle={toggleModal}
        onProceed={() => {
          setDateModal(false);
          setOpenform(true);
        }}
        admissiontype={admissiontype}
        setAdmissiontype={setAdmissiontype}
        adultationype={adultationype}
        setAdultationtype={setAdultationtype}
        supporttype={supporttype}
        setSupporttype={setSupporttype}
        emergencyType={emergencyType}
        setEmergencyType={setEmergencyType}
        emergencyRestraint={emergencyRestraint}
        setEmergencyRestraint={setEmergencyRestraint}
        details={details}
        setDetails={setDetails}
        setOpenform={setOpenform}
        openform={openform}
      />

      <DishchargeformModal
        isOpen={dateModal3}
        toggle={toggleModal3}
        onProceed={() => {
          setDateModal3(false);
          setOpenform3(true);
        }}
        admissiontype={admissiontype}
        setAdmissiontype={setAdmissiontype}
        adultationype={adultationype}
        setAdultationtype={setAdultationtype}
        supporttype={supporttype}
        emergencyDischargeType={emergencyDischargeType}
        setEmergencyDischargeType={setEmergencyDischargeType}
        setSupporttype={setSupporttype}
        setOpenform3={setOpenform3}
        openform3={openform3}
      />

      <ConsentformModal
        isOpen={dateModal4}
        toggle={toggleModal4}
        admissiontype={admissiontype}
        details={details}
        setDetails={setDetails}
        setOpenform={setOpenform4}
        openform={openform4}
      />

      <MHRBEmailUploadModal
        isOpen={mhrbModalOpen}
        toggle={() => setMhrbModalOpen(false)}
        addmissionId={mhrbTargetAdmissionId}
        patient={patient}
        dispatch={dispatch}
      />
    </>
  );
};

AddmissionForms.propTypes = {
  patient: PropTypes.object,
  // Raw state.Chart.data — every admission fetched this session, for any
  // patient. Scoped to the current patient inside the component; do not read
  // this prop directly.
  admissions: PropTypes.array,
};

const mapStateToProps = (state) => ({
  chartDate: state.Chart.chartDate,
  patient: state.Patient.patient,
  doctors: state.User?.doctor,
  psychologists: state.User?.counsellors,
  admissions: state.Chart.data,
  charts: state.Chart.charts,
});

export default connect(mapStateToProps)(AddmissionForms);
