import React, { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  CardBody,
  Label,
  Input,
  Button,
  FormGroup,
  ButtonGroup,
  Spinner,
} from "reactstrap";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { UploadCloud, CheckCircle2 } from "lucide-react";
import { toast } from "react-toastify";
import Select from "react-select";
import PreviewFile from "../../../Components/Common/PreviewFile";
import { getComplianceSubmissionById } from "../../../helpers/backend_helper";
import {
  fetchComplianceTypes,
  addComplianceSubmission,
  saveDraft,
} from "../../../store/features/compliance/complianceSlice";
import { useAuthError } from "../../../Components/Hooks/useAuthError";

const LEAD_OPTIONS = [30, 60, 90, 120];

const ROLE_OPTIONS = [
  { value: "PRIMARY_CERTIFICATE", label: "Primary certificate" },
  { value: "FEE_CHALLAN", label: "Fee challan" },
  { value: "INSPECTION_REPORT", label: "Inspection report" },
  { value: "APPLICATION", label: "Application" },
  { value: "OTHER", label: "Other" },
];
const MAX_FILES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/png"];
const PRIMARY = "PRIMARY_CERTIFICATE";

const formatSize = (bytes) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.round((bytes || 0) / 1024)} KB`;

// Saved documents no longer carry a stored mime type — go by the file's
// extension (preserved in its S3 URL) instead.
const isPdfDoc = (doc) => /\.pdf($|\?)/i.test(doc?.url || doc?.originalName || doc?.name || "");

// "2026-10-01T00:00:00.000Z" -> "2026-10-01" for <input type="date">
const toDateInput = (v) => (v ? String(v).slice(0, 10) : "");

const StepTitle = ({ n, children }) => (
  <h6 className="mb-3 d-flex align-items-center gap-2">
    <span
      className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
      style={{
        width: 22,
        height: 22,
        background: "#1B4D47",
        color: "#fff",
        fontSize: 12,
      }}
    >
      {n}
    </span>
    {children}
  </h6>
);

const FileRow = ({ badge, name, size, href, onPreview, role, onRole, onRemove, tag }) => (
  <div className="d-flex flex-wrap align-items-center gap-2 border rounded p-2">
    <span
      className="d-inline-flex align-items-center justify-content-center rounded border flex-shrink-0"
      style={{
        width: 36,
        height: 40,
        fontSize: 10,
        fontWeight: 700,
        background: "#F1F3F0",
      }}
    >
      {badge}
    </span>
    <div className="d-flex flex-column flex-grow-1" style={{ minWidth: 0 }}>
      {href ? (
        <button
          type="button"
          className="btn btn-link p-0 text-start text-truncate"
          style={{ fontSize: 13 }}
          onClick={onPreview}
        >
          {name}
        </button>
      ) : (
        <span className="text-truncate" style={{ fontSize: 13 }}>
          {name}
        </span>
      )}
      <span className="text-muted" style={{ fontSize: 12 }}>
        {size ? `${formatSize(size)} · ` : ""}{tag}
      </span>
    </div>
    <Input
      type="select"
      bsSize="sm"
      style={{ width: 180 }}
      value={role}
      onChange={(e) => onRole(e.target.value)}
      aria-label="Document role"
    >
      {ROLE_OPTIONS.map((r) => (
        <option key={r.value} value={r.value}>
          {r.label}
        </option>
      ))}
    </Input>
    <Button color="link" size="sm" className="text-danger" onClick={onRemove}>
      Remove
    </Button>
  </div>
);

const UploadDocument = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const handleAuthError = useAuthError();
  const [params] = useSearchParams();

  // ?draft=<id> -> "Continue draft" mode
  const draftId = params.get("draft");
  const isDraftMode = !!draftId;

  // Coming from "Upload renewed document" on an existing item: CenterDetail.js
  // passes the current term's details so the user isn't retyping what's
  // already on file. Dates and the document itself are deliberately left out
  // — those are what's actually changing on a renewal.
  const prefill = location.state?.prefill || {};

  const { types, typesLoading, submissionSaving, draftSaving } = useSelector(
    (state) => state.Compliance,
  );
  const saving = submissionSaving || draftSaving;
  const user = useSelector((state) => state.User);
  const centerList = useSelector((state) => state.Center.data);

  const [draftLoading, setDraftLoading] = useState(false);

  // ---- form state ----
  const [centreId, setCentreId] = useState(params.get("centre") || "");
  const [typeId, setTypeId] = useState(params.get("type") || "");
  const [issuingAuthority, setIssuingAuthority] = useState(prefill.issuingAuthority || "");
  const [licenceNo, setLicenceNo] = useState(prefill.licenceNumber || "");
  const [noExpiry, setNoExpiry] = useState(false);
  const [issuedOn, setIssuedOn] = useState("");
  const [validTill, setValidTill] = useState("");
  const [leadDays, setLeadDays] = useState(60);
  const [existingDocs, setExistingDocs] = useState([]); // files already saved on the draft
  const [files, setFiles] = useState([]); // new files picked now
  const [owner, setOwner] = useState(prefill.owner || "");
  const [escalateTo, setEscalateTo] = useState(prefill.escalateTo || "");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(null); // "DRAFT" | "SEND" | null
  const [previewFile, setPreviewFile] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [checklistCompleted, setChecklistCompleted] = useState(() => new Set());

  const toggleChecklistItem = (text) =>
    setChecklistCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(text)) next.delete(text);
      else next.add(text);
      return next;
    });

  const openPreview = (doc) => {
    setPreviewFile({ url: doc.url, type: doc.type, originalName: doc.originalName || doc.name });
    setPreviewOpen(true);
  };

  useEffect(() => {
    const centerParam = (user?.centerAccess || []).map((c) => c?._id || c).join(",");
    dispatch(fetchComplianceTypes({ center: centerParam }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, user?.centerAccess]);


  useEffect(() => {
    if (isDraftMode) return;
    setCentreId(params.get("centre") || "");
    setTypeId(params.get("type") || "");
    const p = location.state?.prefill || {};
    setIssuingAuthority(p.issuingAuthority || "");
    setLicenceNo(p.licenceNumber || "");
    setOwner(p.owner || "Centre Head");
    setEscalateTo(p.escalateTo || "Centre Head + Admin & Legal");
    setChecklistCompleted(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  // ---- load the draft and fill the form ----
  useEffect(() => {
    if (!draftId) return;
    const loadDraft = async () => {
      setDraftLoading(true);
      try {
        const res = await getComplianceSubmissionById(draftId);
        const d = res?.data;
        if (!d || d.status !== "DRAFT") {
          toast.error("This draft is no longer available");
          navigate("/compliance/my-drafts");
          return;
        }
        setCentreId(d.center?._id || d.center || "");
        setTypeId(d.complianceType?._id || d.complianceType || "");
        setIssuingAuthority(d.issuingAuthority || "");
        setLicenceNo(d.licenceNumber || "");
        setNoExpiry(!!d.noExpiry);
        setIssuedOn(toDateInput(d.issueDate));
        setValidTill(toDateInput(d.expiryDate));
        setLeadDays(
          LEAD_OPTIONS.includes(d.renewalLeadDays) ? d.renewalLeadDays : 60,
        );
        setExistingDocs(d.documents || []);
        setOwner(d.responsibleOwner || "");
        setEscalateTo(d.escalateTo || "");
        setNotes(d.notes || "");
        setChecklistCompleted(new Set(d.checklistCompleted || []));
      } catch (error) {
        if (!handleAuthError(error)) {
          toast.error(error?.response?.data?.message || error?.message || "Failed to load draft");
        }
        navigate("/compliance/my-drafts");
      } finally {
        setDraftLoading(false);
      }
    };
    loadDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId, navigate]);

  const centre = centerList?.find((c) => c._id === centreId);
  const type = types.find((t) => t._id === typeId);
  const centreName = (c) => c?.displayName || c?.title || c?.name || "";

  const centreOptions = (centerList || [])
    .filter((c) => user?.centerAccess?.includes(c._id))
    .map((c) => ({
      value: c._id,
      label: centreName(c),
    }));

  // Only active types that apply to the chosen centre (empty list = all centres)
  const typeOptions = types
    .filter((t) => t.active !== false || t._id === typeId)
    .filter(
      (t) =>
        !centreId ||
        !t.applicableCenters?.length ||
        t.applicableCenters.some(
          (c) => String(c?._id || c) === String(centreId),
        ),
    )
    .map((t) => ({ value: t._id, label: t.name }));

  const handleTypeChange = (option) => {
    setTypeId(option?.value || "");
    setChecklistCompleted(new Set());
  };

  // Prefill from the type's own settings whenever it resolves — not just on
  // a manual dropdown pick, since typeId can also arrive straight from the
  // URL (Register/CenterDetail's "Start renewal") before `types` has even
  // loaded. A no-expiry type always locks noExpiry on (the checkbox itself
  // is disabled below when type.hasExpiry === false), it's not a per-item
  // choice.
  useEffect(() => {
    if (isDraftMode || !type) return;
    if (type.issuingAuthorityHint && !issuingAuthority) {
      setIssuingAuthority(type.issuingAuthorityHint);
    }
    if (type.defaultLeadDays) {
      setLeadDays(type.defaultLeadDays);
    }
    if (type.hasExpiry === false) {
      setNoExpiry(true);
      setValidTill("");
    } else {
      setNoExpiry(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDraftMode, type?._id, type?.hasExpiry]);

  // ---- files ----
  const totalFiles = existingDocs.length + files.length;
  const hasPrimary =
    existingDocs.some((d) => d.role === PRIMARY) ||
    files.some((f) => f.role === PRIMARY);

  const handleFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = ""; // allow picking the same file again after removing it

    const valid = [];
    picked.forEach((f) => {
      if (!ALLOWED_MIME.includes(f.type))
        return toast.error(`${f.name}: only PDF, JPG or PNG`);
      if (f.size > MAX_FILE_SIZE) return toast.error(`${f.name}: max 10 MB`);
      valid.push(f);
    });

    if (totalFiles + valid.length > MAX_FILES) {
      toast.error(`You can upload up to ${MAX_FILES} files`);
      return;
    }

    setFiles((prev) => [
      ...prev,
      ...valid.map((f, i) => ({
        file: f,
        name: f.name,
        size: f.size,
        // first file becomes the primary certificate if none is set yet
        role: !hasPrimary && i === 0 ? PRIMARY : "OTHER",
      })),
    ]);
  };

  // Only one primary certificate across saved + new files
  const demoteOtherPrimaries = () => {
    setExistingDocs((prev) =>
      prev.map((d) => (d.role === PRIMARY ? { ...d, role: "OTHER" } : d)),
    );
    setFiles((prev) =>
      prev.map((f) => (f.role === PRIMARY ? { ...f, role: "OTHER" } : f)),
    );
  };

  const changeNewRole = (idx, role) => {
    if (role === PRIMARY) demoteOtherPrimaries();
    setFiles((prev) => prev.map((f, i) => (i === idx ? { ...f, role } : f)));
  };

  const changeExistingRole = (id, role) => {
    if (role === PRIMARY) demoteOtherPrimaries();
    setExistingDocs((prev) =>
      prev.map((d) => (d._id === id ? { ...d, role } : d)),
    );
  };

  const removeNewFile = (idx) =>
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  const removeExistingDoc = (id) =>
    setExistingDocs((prev) => prev.filter((d) => d._id !== id));

  // ---- submit: action = "DRAFT" (Save draft) or "SEND" (Save & send) ----
  const save = async (action) => {
    if (!centreId) return toast.error("Please select a centre");
    if (!typeId) return toast.error("Please select a compliance type");
    if (action === "SEND" && !hasPrimary) {
      return toast.error(
        "Upload the signed certificate as the primary document",
      );
    }
    if (action === "SEND") {
      const missing = (type?.checklistSteps || [])
        .filter((s) => s.mandatory && !checklistCompleted.has(s.text))
        .map((s) => s.text);
      if (missing.length) {
        return toast.error(
          `Mark these mandatory checklist items before sending for verification: ${missing.join(", ")}`,
        );
      }
    }

    // multipart/form-data so the files travel with the form (multer on the server)
    const formData = new FormData();
    formData.append("center", centreId);
    formData.append("complianceType", typeId);
    formData.append("issuingAuthority", issuingAuthority);
    formData.append("licenceNumber", licenceNo);
    formData.append("noExpiry", String(noExpiry));
    if (issuedOn) formData.append("issueDate", issuedOn);
    if (!noExpiry && validTill) formData.append("expiryDate", validTill);
    formData.append("renewalLeadDays", String(leadDays));
    formData.append("responsibleOwner", owner);
    formData.append("escalateTo", escalateTo);
    formData.append("notes", notes);
    formData.append("action", action);
    formData.append("checklistCompleted", JSON.stringify(Array.from(checklistCompleted)));

    files.forEach((f) => formData.append("documents", f.file));
    formData.append("documentRoles", JSON.stringify(files.map((f) => f.role)));

    if (isDraftMode) {
      // saved files to keep (anything not listed is removed from the draft)
      formData.append(
        "existingDocuments",
        JSON.stringify(existingDocs.map((d) => ({ _id: d._id, role: d.role }))),
      );
    }

    try {
      if (isDraftMode) {
        await dispatch(saveDraft({ id: draftId, formData })).unwrap();
      } else {
        await dispatch(addComplianceSubmission(formData)).unwrap();
      }
      toast.success(
        action === "SEND" ? "Sent for verification." : "Draft saved.",
      );
      setSubmitted(action);
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(error?.message || "Failed to save");
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    save("SEND");
  };


  if (draftLoading) {
    return (
      <div className="p-5 text-center">
        <Spinner size="sm" className="me-2" /> Loading draft...
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="p-3 p-lg-4">
        <Card className="shadow-sm">
          <CardBody className="text-center py-5">
            <CheckCircle2 size={40} className="text-success mb-3" />
            <h5>
              {submitted === "SEND" ? "Sent for verification" : "Draft saved"}
            </h5>
            <p className="text-muted">
              {type?.name} · {centreName(centre)}
              {submitted === "SEND"
                ? " — this now sits in the Approvals queue for Admin & Legal."
                : " — you can finish it and send it for verification later."}
            </p>
            <div className="d-flex justify-content-center flex-wrap gap-2">
              {submitted === "SEND" ? (
                <Button
                  color="success"
                  className="text-white"
                  onClick={() => navigate("/compliance/approvals")}
                >
                  View approvals queue
                </Button>
              ) : (
                <Button
                  color="success"
                  className="text-white"
                  onClick={() => navigate("/compliance/my-drafts")}
                >
                  Go to my drafts
                </Button>
              )}
              <Button
                color="light"
                className="border"
                onClick={() => navigate("/compliance")}
              >
                Back to overview
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-3 p-lg-4">
      <div className="mb-3">
        <h5 className="mb-1 fw-semibold">
          {isDraftMode ? "Continue draft" : "Add / renew document"}
        </h5>
        <p className="text-muted mb-0 fs-13">
          {isDraftMode
            ? "Finish this draft and send it for verification, or save your changes for later."
            : "Upload a new or renewed compliance document and send it for verification."}
        </p>
      </div>

      <Row className="g-3">
        <Col lg={8}>
          <form onSubmit={handleSubmit}>
            <Card className="shadow-sm mb-3">
              <CardBody>
                <StepTitle n={1}>What and where</StepTitle>
                <Row className="g-3">
                  <Col sm={6}>
                    <FormGroup className="mb-0">
                      <Label>Centre <span className="text-danger">*</span></Label>
                      <Select
                        classNamePrefix="react-select"
                        options={centreOptions}
                        isDisabled={isDraftMode}
                        placeholder="Select centre"
                        value={
                          centreOptions.find((o) => o.value === centreId) ||
                          null
                        }
                        onChange={(option) => {
                          setCentreId(option?.value || "");
                          setTypeId(""); // type list depends on centre
                        }}
                      />
                    </FormGroup>
                  </Col>
                  <Col sm={6}>
                    <FormGroup className="mb-0">
                      <Label>Compliance type <span className="text-danger">*</span></Label>
                      <Select
                        classNamePrefix="react-select"
                        options={typeOptions}
                        isLoading={typesLoading}
                        isDisabled={isDraftMode}
                        placeholder="Select compliance type"
                        value={
                          typeOptions.find((o) => o.value === typeId) || null
                        }
                        onChange={handleTypeChange}
                      />
                    </FormGroup>
                  </Col>
                  {isDraftMode && (
                    <Col xs={12}>
                      <span className="text-muted" style={{ fontSize: 12 }}>
                        Centre and compliance type can't be changed on a draft.
                        Discard it and start a new one if they're wrong.
                      </span>
                    </Col>
                  )}
                  <Col sm={6}>
                    <FormGroup className="mb-0">
                      <Label>Issuing authority <span className="text-danger">*</span></Label>
                      <Input
                        value={issuingAuthority}
                        onChange={(e) => setIssuingAuthority(e.target.value)}
                      />
                    </FormGroup>
                  </Col>
                  <Col sm={6}>
                    <FormGroup className="mb-0">
                      <Label>Licence / registration no. <span className="text-danger">*</span></Label>
                      <Input
                        value={licenceNo}
                        onChange={(e) => setLicenceNo(e.target.value)}
                        placeholder="e.g. FIRE/PUN/1097"
                      />
                    </FormGroup>
                  </Col>
                </Row>
              </CardBody>
            </Card>

            <Card className="shadow-sm mb-3">
              <CardBody>
                <StepTitle n={2}>Validity</StepTitle>
                <FormGroup check className="mb-3">
                  <Input
                    id="noExpiry"
                    type="checkbox"
                    checked={noExpiry}
                    disabled={type?.hasExpiry === false}
                    onChange={(e) => setNoExpiry(e.target.checked)}
                  />
                  <Label check htmlFor="noExpiry">
                    This document has no expiry (lifetime registration)
                  </Label>
                </FormGroup>
                <Row className="g-3">
                  <Col sm={6}>
                    <FormGroup className="mb-0">
                      <Label>Issued on {!noExpiry && <span className="text-danger">*</span>}</Label>
                      <Input
                        type="date"
                        value={issuedOn}
                        onChange={(e) => setIssuedOn(e.target.value)}
                      />
                    </FormGroup>
                  </Col>
                  <Col sm={6}>
                    <FormGroup className="mb-0">
                      <Label>Valid till {!noExpiry && <span className="text-danger">*</span>}</Label>
                      <Input
                        type="date"
                        value={validTill}
                        min={issuedOn || undefined}
                        onChange={(e) => setValidTill(e.target.value)}
                        disabled={noExpiry}
                      />
                    </FormGroup>
                  </Col>
                  <Col xs={12}>
                    <Label>Start renewal before expiry</Label>
                    <div>
                      <ButtonGroup>
                        {LEAD_OPTIONS.map((d) => (
                          <Button
                            key={d}
                            type="button"
                            color={leadDays === d ? "success" : "light"}
                            className={leadDays === d ? "text-white" : "border"}
                            onClick={() => setLeadDays(d)}
                            disabled={noExpiry}
                          >
                            {d} days
                          </Button>
                        ))}
                        <Button
                          type="button"
                          color={!LEAD_OPTIONS.includes(leadDays) ? "success" : "light"}
                          className={!LEAD_OPTIONS.includes(leadDays) ? "text-white" : "border"}
                          onClick={() => setLeadDays(0)}
                          disabled={noExpiry}
                        >
                          Custom
                        </Button>
                      </ButtonGroup>
                    </div>
                    {!LEAD_OPTIONS.includes(leadDays) && (
                      <div className="mt-2" style={{ maxWidth: 160 }}>
                        <Input
                          type="number"
                          min={1}
                          placeholder="Days"
                          value={leadDays || ""}
                          disabled={noExpiry}
                          onChange={(e) => setLeadDays(Math.max(0, Number(e.target.value) || 0))}
                        />
                      </div>
                    )}
                  </Col>
                </Row>
              </CardBody>
            </Card>

            <Card className="shadow-sm mb-3">
              <CardBody>
                <StepTitle n={3}>Documents</StepTitle>
                <p className="text-muted" style={{ fontSize: 13 }}>
                  PDF, JPG or PNG · up to 10 MB each. The signed certificate is
                  the primary document; add challans or inspection reports as
                  supporting files.
                </p>
                <label
                  htmlFor="complianceFiles"
                  className="compliance-dropzone d-flex flex-column align-items-center justify-content-center border border-dashed rounded py-4 mb-3"
                  style={{
                    cursor: "pointer",
                    background: "#FAFAF8",
                    transition: "all .15s ease",
                  }}
                >
                  <style>{`
                    .compliance-dropzone:hover {
                      background: #EFF7F3 !important;
                      border-color: #1B4D47 !important;
                    }
                  `}</style>
                  <UploadCloud size={28} className="text-muted mb-2" />
                  <span className="text-muted">Tap to choose files</span>
                  <input
                    id="complianceFiles"
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="d-none"
                    onChange={handleFiles}
                  />
                </label>
                <div className="d-flex flex-column gap-2">
                  {existingDocs.map((d) => (
                    <FileRow
                      key={d._id}
                      badge={isPdfDoc(d) ? "PDF" : "IMG"}
                      name={d.originalName || d.name}
                      size={d.size}
                      href={d.url}
                      onPreview={() => openPreview(d)}
                      tag="saved"
                      role={d.role}
                      onRole={(role) => changeExistingRole(d._id, role)}
                      onRemove={() => removeExistingDoc(d._id)}
                    />
                  ))}
                  {files.map((f, idx) => (
                    <FileRow
                      key={`${f.name}-${idx}`}
                      badge={f.file?.type === "application/pdf" ? "PDF" : "IMG"}
                      name={f.name}
                      size={f.size}
                      tag="new"
                      role={f.role}
                      onRole={(role) => changeNewRole(idx, role)}
                      onRemove={() => removeNewFile(idx)}
                    />
                  ))}
                </div>
              </CardBody>
            </Card>

            {!!type?.checklistSteps?.length && (
              <Card className="shadow-sm mb-3">
                <CardBody>
                  <StepTitle n={4}>Renewal checklist</StepTitle>
                  <p className="text-muted" style={{ fontSize: 13 }}>
                    Items marked with a <span className="text-danger fw-semibold">*</span> must be
                    checked off before this can be sent for verification; drafts can be saved
                    regardless.
                  </p>
                  <div className="d-flex flex-column gap-2">
                    {type.checklistSteps.map((step) => (
                      <FormGroup check key={step.text} className="mb-0 d-flex align-items-center gap-2">
                        <Input
                          id={`checklist-${step.text}`}
                          type="checkbox"
                          checked={checklistCompleted.has(step.text)}
                          onChange={() => toggleChecklistItem(step.text)}
                        />
                        <Label check htmlFor={`checklist-${step.text}`} className="mb-0">
                          {step.text}
                          {step.mandatory && <span className="text-danger fw-semibold"> *</span>}
                        </Label>
                      </FormGroup>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            <Card className="shadow-sm mb-3">
              <CardBody>
                <StepTitle n={type?.checklistSteps?.length ? 5 : 4}>Ownership &amp; notes</StepTitle>
                <Row className="g-3">
                  <Col sm={6}>
                    <FormGroup className="mb-0">
                      <Label>Responsible owner <span className="text-danger">*</span></Label>
                      <Input
                        value={owner}
                        onChange={(e) => setOwner(e.target.value)}
                      />
                    </FormGroup>
                  </Col>
                  <Col sm={6}>
                    <FormGroup className="mb-0">
                      <Label>Escalate to</Label>
                      <Input
                        value={escalateTo}
                        onChange={(e) => setEscalateTo(e.target.value)}
                      />
                    </FormGroup>
                  </Col>
                  <Col xs={12}>
                    <FormGroup className="mb-0">
                      <Label>Notes / conditions on the licence</Label>
                      <Input
                        type="textarea"
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g. Conditions imposed, inspection observations"
                      />
                    </FormGroup>
                  </Col>
                </Row>
              </CardBody>
            </Card>

            <div className="d-flex flex-column flex-sm-row gap-2">
              <Button
                type="submit"
                color="success"
                className="text-white order-sm-3"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save & send for verification"}
              </Button>
              <Button
                type="button"
                color="light"
                className="border order-sm-2"
                disabled={saving}
                onClick={() => save("DRAFT")}
              >
                {isDraftMode ? "Update draft" : "Save draft"}
              </Button>
              <Button
                type="button"
                color="light"
                className="border order-sm-1"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Col>

        <Col lg={4}>
          <Card className="shadow-sm mb-3">
            <CardBody>
              <h6 className="mb-3">After saving</h6>
              <div className="d-flex justify-content-between py-1 border-bottom">
                <span className="text-muted">Item</span>
                <span className="fw-medium text-end">
                  {type
                    ? `${type.shortName || type.name} · ${centreName(centre)}`
                    : "—"}
                </span>
              </div>
              {!noExpiry && issuedOn && validTill && (
                <div className="d-flex justify-content-between py-1 border-bottom">
                  <span className="text-muted">New validity</span>
                  <span className="fw-medium">
                    {issuedOn} → {validTill}
                  </span>
                </div>
              )}
              <div className="d-flex justify-content-between py-1 border-bottom">
                <span className="text-muted">Status becomes</span>
                <span className="fw-medium">Valid · pending verification</span>
              </div>
              <div className="d-flex justify-content-between py-1">
                <span className="text-muted">Previous version</span>
                <span className="fw-medium">Archived · stays downloadable</span>
              </div>
            </CardBody>
          </Card>

          <Card className="shadow-sm mb-3">
            <CardBody>
              <h6 className="mb-2">Reminders</h6>
              {noExpiry ? (
                <p className="text-muted mb-0" style={{ fontSize: 13 }}>
                  No reminders — lifetime registration.
                </p>
              ) : (
                <p className="text-muted mb-0" style={{ fontSize: 13 }}>
                  Sent by the Compliance SOP rules, on the days set in each
                  rule — for example 30 days before Valid till. Paused while a
                  renewal is underway.
                </p>
              )}
            </CardBody>
          </Card>

          <Card className="shadow-sm">
            <CardBody>
              <h6 className="mb-2">Verification</h6>
              <p className="text-muted mb-0" style={{ fontSize: 13 }}>
                Admin &amp; Legal checks the uploaded certificate against the
                entered licence number and dates before the status turns final.
                Every upload, edit and verification is written to the audit log.
              </p>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <PreviewFile
        title={previewFile?.originalName || "Compliance document"}
        file={previewFile}
        isOpen={previewOpen}
        toggle={() => setPreviewOpen(false)}
        allowDownload
      />
    </div>
  );
};

export default UploadDocument;
