import React, { useState, useEffect, useRef } from "react";
import { Button, Input, Label, Row, Col } from "reactstrap";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
  getVerificationJobs,
  createAssetScan,
  uploadAssetScanImage,
  // downloadAssetScanTemplate,
  // uploadAssetScans,
} from "../../../../helpers/backend_helper";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { usePermissions } from "../../../../Components/Hooks/useRoles.js";
import CategoryLevelSelect, { EMPTY_CATEGORY } from "../shared/CategoryLevelSelect";
// import ExcelUploadPanel from "../shared/ExcelUploadPanel";
import PhotoPicker from "../shared/PhotoPicker";
import { errText, useBusy } from "../shared/assetUi";
import "../../UnitOfMeasurement/uom.scss";

const EMPTY_FORM = {
  quantity: "1",
  tagNumber: "",
  oldTagNumber: "",
  tagStatus: "",
  roomNo: "",
  floorNo: "",
  remarks: "",
};

// Add Verification: ONE form and ONE Save button.
// Everything (the details and the photos) is filled in first. Save then makes the verification and
// sends its photos in the same go, and the form is ready for the next one (job and category stay).
const AddScan = () => {
  const handleAuthError = useAuthError();
  const navigate = useNavigate();
  const token = JSON.parse(localStorage.getItem("micrologin"))?.token;
  const { hasPermission } = usePermissions(token);
  const canAdd = hasPermission("MASTERDATA", "VERIFICATION_JOB", "WRITE");

  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState(false);
  const [jobId, setJobId] = useState("");
  const [category, setCategory] = useState(EMPTY_CATEGORY);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, runSave] = useBusy();

  const [lastSaved, setLastSaved] = useState(null); // { scanCode, photos } the one just saved
  const [partial, setPartial] = useState(null); // { id, scanCode, failures }: saved, but some photos did not go
  const scanIdRef = useRef(null);
  const pickerRef = useRef(null);
  const [pickerKey, setPickerKey] = useState(0); // a fresh photo box for every new verification
  const [photoState, setPhotoState] = useState({ ready: 0, failed: 0, uploading: 0, done: 0 });
  const [savedCounts, setSavedCounts] = useState({ tag: 0, asset: 0 });

  const loadJobs = () => {
    setJobsLoading(true);
    setJobsError(false);
    getVerificationJobs({ status: "active" })
      .then((res) => {
        const list = res?.data || [];
        setJobs(list);
        if (list.length === 1) setJobId(list[0]._id); // only one active job: no need to pick it
      })
      .catch((error) => {
        if (!handleAuthError(error)) setJobsError(true);
      })
      .finally(() => setJobsLoading(false));
  };
  useEffect(loadJobs, []); // eslint-disable-line react-hooks/exhaustive-deps

  // While saving (and sending photos), leaving the page would leave a verification without its photos
  useEffect(() => {
    if (!saving) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [saving]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // The same words the server uses, shown at once under the box
  const quantityProblem = () => {
    if (form.quantity === "") return "";
    const q = Number(form.quantity);
    if (!Number.isFinite(q)) return "Quantity must be a number";
    if (!Number.isInteger(q)) return "Quantity must be a whole number";
    if (q < 1) return "Quantity must be at least 1";
    if (q > 500) return "Quantity cannot be more than 500 in one verification";
    return "";
  };
  const qtyProblem = quantityProblem();
  const qtyNumber = Number(form.quantity);
  // the old tag number only matters when the status says there was an old tag
  const setTagStatus = (e) => {
    const tagStatus = e.target.value;
    setForm((f) => ({ ...f, tagStatus, oldTagNumber: tagStatus === "old_plus_new" ? f.oldTagNumber : "" }));
  };

  // what is still missing before Save can be pressed
  const missing = [];
  if (!jobId) missing.push("the job");
  if (!category.categoryL1) missing.push("the category");
  if (qtyProblem) missing.push("a correct quantity");
  if (!form.tagNumber.trim()) missing.push("the tag number");
  if (photoState.ready < 1) missing.push("at least one photo");

  // Done with this one: clear it for the next (the job and the category stay)
  const finish = (scanCode, photos) => {
    setForm(EMPTY_FORM);
    setPartial(null);
    setPickerKey((k) => k + 1);
    setSavedCounts({ tag: 0, asset: 0 });
    setPhotoState({ ready: 0, failed: 0, uploading: 0, done: 0 });
    setLastSaved({ scanCode, photos });
    scanIdRef.current = null;
    if (typeof window !== "undefined" && window.scrollTo) window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = () =>
    runSave(async () => {
      if (missing.length > 0) return toast.error(`Please choose ${missing.join(" and ")} first`);
      const photosToSend = photoState.ready;
      if (!partial && photosToSend < 1) return toast.error("Please add at least one photo first");
      let scan = null;
      try {
        const res = await createAssetScan({
          jobId,
          categoryL1: category.categoryL1,
          categoryL2: category.categoryL2 || undefined,
          categoryL3: category.categoryL3 || undefined,
          categoryL4: category.categoryL4 || undefined,
          quantity: form.quantity === "" ? undefined : Number(form.quantity),
          tagNumber: form.tagNumber.trim() || undefined,
          oldTagNumber: form.oldTagNumber.trim() || undefined,
          tagStatus: form.tagStatus || undefined,
          roomNo: form.roomNo.trim() || undefined,
          floorNo: form.floorNo.trim() || undefined,
          remarks: form.remarks.trim() || undefined,
        });
        scan = { id: res?.data?._id, scanCode: res?.data?.scanCode || "" };
      } catch (error) {
        // nothing was saved: the form stays as it is, with the photos, so it can be saved again
        if (!handleAuthError(error)) toast.error(errText(error, "The verification could not be saved."));
        return;
      }

      // the verification exists now; its photos go right after
      scanIdRef.current = scan.id;
      let failures = 0;
      if (photosToSend > 0 && pickerRef.current && pickerRef.current.hasWaiting()) {
        failures = (await pickerRef.current.uploadAll()) || 0;
      }
      if (failures > 0) {
        setPartial({ id: scan.id, scanCode: scan.scanCode, failures });
        toast.error(`${scan.scanCode} is saved, but ${failures} photo(s) did not go. Use Retry`);
        return;
      }
      toast.success(`${scan.scanCode} saved${photosToSend > 0 ? ` with ${photosToSend} photo${photosToSend === 1 ? "" : "s"}` : ""}`);
      finish(scan.scanCode, photosToSend);
    });

  const selectedJob = jobs.find((j) => j._id === jobId);

  return (
    <div className="uom-page add-verification-page" style={{ maxWidth: "100%", overflowX: "hidden" }}>
      {/* one column and no sideways scrolling on a phone */}
      <style>{`
        .add-verification-page select.form-select, .add-verification-page input.form-control, .add-verification-page .form-control { min-height: 40px; font-size: 16px; }
        .add-verification-page .uom-table-card { max-width: 100%; }
        @media (max-width: 575px) {
          .add-verification-page.uom-page { padding-left: 0; padding-right: 0; }
          .add-verification-page .uom-table-card { padding: 16px !important; }
        }
      `}</style>

      <div className="uom-list-header">
        <div style={{ minWidth: 0 }}>
          <h4>Add Verification</h4>
          <p>Fill in the details and add photos, then save once</p>
        </div>
        <Button color="light" onClick={() => navigate("/vendor-management/asset-scan")}>
          Go to Verifications
        </Button>
      </div>

      {!canAdd && (
        <div className="uom-table-card p-4 mb-4">
          <div className="uom-empty-state">
            <p className="uom-empty-title">You can view this page but not add verifications</p>
            <p className="uom-empty-sub">Ask an administrator for write access to Verifications.</p>
          </div>
        </div>
      )}

      {canAdd && (
        <>
          <div className="uom-table-card p-4 mb-4">
            {/* the one just saved */}
            {lastSaved && !partial && (
              <div className="p-3 mb-3 d-flex flex-wrap align-items-center justify-content-between gap-2" style={{ background: "#ecfdf3", border: "1px solid #abefc6", borderRadius: 10 }}>
                <span className="fw-semibold" style={{ color: "#067647" }}>
                  Saved: {lastSaved.scanCode}
                  {lastSaved.photos > 0 ? ` with ${lastSaved.photos} photo${lastSaved.photos === 1 ? "" : "s"}` : ""}. The form is ready for the next one.
                </span>
                <button type="button" className="btn btn-link btn-sm p-0" onClick={() => setLastSaved(null)}>
                  Hide
                </button>
              </div>
            )}

            {/* saved, but some photos did not go: the form is not used again until this is settled */}
            {partial && (
              <div className="p-3 mb-3" style={{ background: "#fef3f2", border: "1px solid #fecdca", borderRadius: 10 }}>
                <div className="fw-semibold text-danger">
                  {partial.scanCode} is saved, but {photoState.failed || partial.failures} photo(s) did not go.
                </div>
                <div className="small mt-1">Press Retry on a photo, or skip the failed photos. The verification itself is already saved.</div>
              </div>
            )}

            <div style={{ display: partial ? "none" : "block" }}>
              <h6 className="fw-semibold mb-3">Add one verification</h6>

              <Row>
                <Col md={6} className="mb-3">
                  <Label className="small">
                    Job <span className="text-danger">*</span>
                  </Label>
                  <Input type="select" value={jobId} onChange={(e) => setJobId(e.target.value)} disabled={jobsLoading || saving}>
                    <option value="">{jobsLoading ? "Loading jobs..." : "Select an active job"}</option>
                    {jobs.map((j) => (
                      <option key={j._id} value={j._id}>
                        {j.jobCode} - {j.jobName}
                      </option>
                    ))}
                  </Input>
                  {jobsError && (
                    <div className="text-danger small mt-1">
                      Could not load the jobs.{" "}
                      <button type="button" className="btn btn-link btn-sm p-0" onClick={loadJobs}>
                        Try again
                      </button>
                    </div>
                  )}
                  {!jobsLoading && !jobsError && jobs.length === 0 && (
                    <div className="text-muted small mt-1">
                      There is no active job. Create a job and activate it in Verification Jobs first.
                    </div>
                  )}
                  {selectedJob && (
                    <div className="text-muted small mt-1">Found at: {selectedJob.centerId?.title || "the job's site"}</div>
                  )}
                </Col>
              </Row>

              <CategoryLevelSelect
                value={category}
                onChange={setCategory}
                required
                md={6}
                levelLabels={["Category", "Sub-category", "Sub-category 2", "Sub-category 3"]}
                disabled={saving}
              />

              <Row>
                <Col md={3} xs={12} className="mb-3">
                  <Label className="small">How many</Label>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    inputMode="numeric"
                    value={form.quantity}
                    onChange={set("quantity")}
                    invalid={!!qtyProblem}
                    disabled={saving}
                  />
                  {qtyProblem && <div className="text-danger small mt-1">{qtyProblem}</div>}
                </Col>
                <Col md={5} xs={12} className="mb-3">
                  <Label className="small">
                    Tag number <span className="text-danger">*</span>
                  </Label>
                  <Input value={form.tagNumber} onChange={set("tagNumber")} placeholder="e.g. BT0012345" disabled={saving} />
                  {form.tagNumber.trim() && !qtyProblem && qtyNumber > 1 ? (
                    <div className="small mt-1" style={{ color: "#b54708" }}>
                      A tag belongs to one item. Only the first of the {qtyNumber} items will get this tag.
                    </div>
                  ) : (
                    <div className="text-muted small mt-1">The number printed on the tag.</div>
                  )}
                </Col>
                <Col md={4} xs={12} className="mb-3">
                  <Label className="small">Tag status</Label>
                  <Input type="select" value={form.tagStatus} onChange={setTagStatus} disabled={saving}>
                    <option value="">Not given</option>
                    <option value="new">New tag</option>
                    <option value="old_plus_new">Old tag and a new tag</option>
                    <option value="existing">Existing tag</option>
                  </Input>
                </Col>
              </Row>
              <Row>
                {form.tagStatus === "old_plus_new" && (
                  <Col md={4} xs={12} className="mb-3">
                    <Label className="small">Old tag number</Label>
                    <Input value={form.oldTagNumber} onChange={set("oldTagNumber")} disabled={saving} />
                  </Col>
                )}
                <Col md={form.tagStatus === "old_plus_new" ? 4 : 6} xs={12} className="mb-3">
                  <Label className="small">Room</Label>
                  <Input value={form.roomNo} onChange={set("roomNo")} disabled={saving} />
                </Col>
                <Col md={form.tagStatus === "old_plus_new" ? 4 : 6} xs={12} className="mb-3">
                  <Label className="small">Floor</Label>
                  <Input value={form.floorNo} onChange={set("floorNo")} disabled={saving} />
                </Col>
              </Row>
              <Row>
                <Col md={12} className="mb-3">
                  <Label className="small">Remarks</Label>
                  <Input type="textarea" rows={2} value={form.remarks} onChange={set("remarks")} disabled={saving} />
                </Col>
              </Row>
            </div>

            {/* the photos are chosen here, before saving, and go together with Save */}
            <h6 className="fw-semibold mb-1">{partial ? "Photos that did not go" : (<>Photos <span className="text-danger">*</span></>)}</h6>
            {!partial && (
              <p className="text-muted small mb-2">
                Add at least one photo: the tag and the item. They are shrunk on your device and sent when you press Save.
              </p>
            )}
            <PhotoPicker
              key={pickerKey}
              ref={pickerRef}
              onUpload={(file, kind) => {
                const fd = new FormData();
                fd.append("file", file);
                return uploadAssetScanImage(scanIdRef.current, kind, fd);
              }}
              existingTag={savedCounts.tag}
              existingAsset={savedCounts.asset}
              onUploaded={(kind) => setSavedCounts((c) => ({ ...c, [kind]: c[kind] + 1 }))}
              onSummary={setPhotoState}
              manualUpload={!!partial}
              disabled={saving}
              hideDone
            />

            {/* the one button */}
            <div className="d-flex flex-wrap align-items-center gap-3 mt-4">
              {!partial ? (
                <>
                  <Button color="primary" onClick={save} disabled={saving || missing.length > 0}>
                    {saving ? "Saving..." : "Save"}
                  </Button>
                  {saving ? (
                    <span className="text-muted small">Saving{photoState.ready > 0 ? " and sending the photos" : ""}. Please stay on this page until it finishes.</span>
                  ) : missing.length > 0 ? (
                    <span className="text-muted small">To save, choose {missing.join(" and ")}.</span>
                  ) : (
                    <span className="text-muted small">When approved, one register asset is created for each item.</span>
                  )}
                </>
              ) : (
                <Button
                  color="light"
                  className="border"
                  disabled={photoState.uploading > 0}
                  onClick={() => {
                    toast.info(`${partial.scanCode} was saved without the failed photos`);
                    finish(partial.scanCode, savedCounts.tag + savedCounts.asset);
                  }}
                >
                  Skip the failed photos and continue
                </Button>
              )}
            </div>
          </div>

          {/* <ExcelUploadPanel
            title="Add many verifications from an Excel file"
            hint="Download the template, fill one row per verification, then upload it. If any row has a problem nothing is saved and the problems are listed. Up to 1000 rows, .xlsx only, 5 MB at most."
            templateFile="verification-template.xlsx"
            downloadTemplate={downloadAssetScanTemplate}
            upload={uploadAssetScans}
          /> */}
        </>
      )}
    </div>
  );
};

export default AddScan;
