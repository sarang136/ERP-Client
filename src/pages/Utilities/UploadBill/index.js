import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import {
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  Spinner,
  Row,
  Col,
} from "reactstrap";
import { toast } from "react-toastify";
import { useCenterOptions } from "../../../Components/Hooks/useCenterOptions";
import { useAuthError } from "../../../Components/Hooks/useAuthError";
import { usePermissions } from "../../../Components/Hooks/useRoles";
import { uploadUtilityBill } from "../../../helpers/backend_helper";
import AttachmentPicker from "../Components/AttachmentPicker";

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_RANGE_END = 2076;
const yearOptions = Array.from(
  { length: YEAR_RANGE_END - 2026 + 1 },
  (_, idx) => {
    const year = 2026 + idx;
    return { value: year, label: String(year) };
  },
);
const monthOptions = Array.from({ length: 12 }, (_, idx) => ({
  value: idx + 1,
  label: new Date(2026, idx, 1).toLocaleString("en-US", { month: "long" }),
}));

const makeEmptyRow = (id) => ({
  id,
  center: null,
  month: null,
  year: CURRENT_YEAR,
  comment: "",
  amount: "",
  meterNumber: "",
  unitUsed: "",
  files: [],
});

const isDateAllowed = (row) => {
  if (!row.year || !row.month) return false;
  const year = row.year;
  const month = row.month;
  if (year < 2026) return false;
  if (year === 2026 && month < 1) return false;
  return true;
};

const getDuplicateRowIds = (rows) => {
  const seen = new Set();
  const dupes = new Set();
  rows.forEach((row) => {
    if (!row.center || !row.month || !row.year) return;
    const key = `${row.center.value}-${row.month}-${row.year}`;
    if (seen.has(key)) {
      dupes.add(row.id);
    } else {
      seen.add(key);
    }
  });
  return dupes;
};

const UploadBill = () => {
  const navigate = useNavigate();
  const handleAuthError = useAuthError();
  const centerOptions = useCenterOptions({ includeAll: false });

  const microUser = localStorage.getItem("micrologin");
  const token = microUser ? JSON.parse(microUser).token : null;
  const { loading: permissionLoader, hasPermission } = usePermissions(token);
  const hasReadPermission = hasPermission("UTILITIES", "UPLOAD_BILL", "READ");
  const hasWritePermission = hasPermission("UTILITIES", "UPLOAD_BILL", "WRITE");
  const hasDeletePermission = hasPermission(
    "UTILITIES",
    "UPLOAD_BILL",
    "DELETE",
  );
  const canUpload = hasWritePermission || hasDeletePermission;

  const [rows, setRows] = useState([makeEmptyRow(0)]);
  const [uploading, setUploading] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [rowErrors, setRowErrors] = useState({});
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (!permissionLoader && !hasReadPermission) {
      navigate("/unauthorized");
    }
  }, [permissionLoader, hasReadPermission, navigate]);

  if (permissionLoader) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "50vh", flex: 1 }}
      >
        <Spinner color="primary" />
      </div>
    );
  }

  const duplicateRowIds = getDuplicateRowIds(rows);

  const updateRow = (id, field, value) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
    setRowErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const addRow = () => {
    const newId = Math.max(...rows.map((r) => r.id), -1) + 1;
    setRows((prev) => [...prev, makeEmptyRow(newId)]);
  };

  const removeRow = (id) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
    setRowErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const addFilesToRow = (id, newFiles) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, files: [...row.files, ...newFiles] } : row,
      ),
    );
    setRowErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const removeFileFromRow = (id, index) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? { ...row, files: row.files.filter((_, i) => i !== index) }
          : row,
      ),
    );
  };

  const isRowValid = (row) =>
    !!row.center &&
    !!row.month &&
    !!row.year &&
    row.files.length > 0 &&
    isDateAllowed(row) &&
    Number(row.amount) > 0 &&
    row.meterNumber.trim() !== "" &&
    row.unitUsed !== "" && Number(row.unitUsed) >= 0;

  const canSubmit =
    canUpload &&
    rows.length > 0 &&
    rows.every(isRowValid) &&
    duplicateRowIds.size === 0;

  const previewRows = rows.filter(
    (row) => row.center && row.month && row.year && row.files.length > 0,
  );

  const resetForm = () => {
    setRows([makeEmptyRow(0)]);
    setSubmitAttempted(false);
    setRowErrors({});
    setFormKey((key) => key + 1);
  };

  const handleSubmit = async () => {
    setSubmitAttempted(true);
    if (!canSubmit) return;

    setRowErrors({});
    setUploading(true);
    try {
      const formData = new FormData();
      rows.forEach((row, index) => {
        formData.append(`bills[${index}][center]`, row.center.value);
        formData.append(`bills[${index}][month]`, row.month);
        formData.append(`bills[${index}][year]`, row.year);
        formData.append(`bills[${index}][comment]`, row.comment || "");
        formData.append(`bills[${index}][amount]`, row.amount);
        formData.append(`bills[${index}][meterNumber]`, row.meterNumber);
        formData.append(`bills[${index}][unitUsed]`, row.unitUsed);
        row.files.forEach((file) => {
          formData.append(`billFile_${index}`, file);
        });
      });

      await uploadUtilityBill(formData);

      toast.success("Bills uploaded successfully");
      resetForm();
    } catch (error) {
      if (!handleAuthError(error)) {
        const message =
          error?.message || "Something went wrong while uploading";
        const match = /^Entry (\d+):\s*(.*)$/.exec(message);
        if (match) {
          const targetRow = rows[Number(match[1]) - 1];
          if (targetRow) {
            setRowErrors({ [targetRow.id]: match[2] });
          }
        }
        toast.error(message);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="w-100 mt-4 mt-sm-0"
      style={{ flex: 1, width: "100%", maxWidth: "100%", minWidth: 0 }}
    >
      <div className="container-fluid p-3 p-lg-4">
        <div className="row">
          <div className="col-lg-8 col-xl-10 mx-auto border rounded p-4">
            <h4 className="fw-bold mb-4">Upload Electricity Bill</h4>
            <Form key={formKey}>
              {rows.map((row, index) => {
                const isDuplicate = duplicateRowIds.has(row.id);
                const centerMissing = submitAttempted && !row.center;
                const monthMissing = submitAttempted && !row.month;
                const yearMissing = submitAttempted && !row.year;
                const fileMissing =
                  submitAttempted && row.files.length === 0;
                const amountInvalid =
                  submitAttempted && Number(row.amount) <= 0;
                const meterNumberMissing =
                  submitAttempted && !row.meterNumber.trim();
                const unitUsedInvalid =
                  submitAttempted &&
                  (row.unitUsed === "" || Number(row.unitUsed) < 0);
                const apiError = rowErrors[row.id];
                const hasRowError =
                  !!apiError ||
                  isDuplicate ||
                  (submitAttempted && !isRowValid(row));

                return (
                  <div
                    key={row.id}
                    className={`mb-3 p-3 border rounded ${hasRowError ? "border-danger" : ""}`}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h6 className="mb-0">Bill {index + 1}</h6>
                      {rows.length >= 2 && (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => removeRow(row.id)}
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {apiError && (
                      <div
                        className="text-danger mb-3"
                        style={{ fontSize: 13 }}
                      >
                        {apiError}
                      </div>
                    )}

                    <Row>
                      <Col md={4} className="mb-3">
                        <FormGroup className="mb-0">
                          <Label className="fw-semibold">
                            Center <span className="text-danger">*</span>
                          </Label>
                          <Select
                            value={row.center}
                            onChange={(opt) => updateRow(row.id, "center", opt)}
                            options={centerOptions}
                            classNamePrefix="react-select"
                            placeholder="Select center..."
                            isDisabled={uploading}
                          />
                          {centerMissing && (
                            <div
                              className="text-danger mt-1"
                              style={{ fontSize: 13 }}
                            >
                              Center is required
                            </div>
                          )}
                        </FormGroup>
                      </Col>

                      <Col md={4} className="mb-3">
                        <FormGroup className="mb-0">
                          <Label className="fw-semibold">
                            Month <span className="text-danger">*</span>
                          </Label>
                          <Select
                            value={
                              monthOptions.find(
                                (opt) => opt.value === row.month,
                              ) || null
                            }
                            onChange={(opt) =>
                              updateRow(row.id, "month", opt?.value || null)
                            }
                            options={monthOptions}
                            classNamePrefix="react-select"
                            placeholder="Select month..."
                            isDisabled={uploading}
                          />
                          {monthMissing && (
                            <div
                              className="text-danger mt-1"
                              style={{ fontSize: 13 }}
                            >
                              Month is required
                            </div>
                          )}
                        </FormGroup>
                      </Col>

                      <Col md={4} className="mb-3">
                        <FormGroup className="mb-0">
                          <Label className="fw-semibold">
                            Year <span className="text-danger">*</span>
                          </Label>
                          <Select
                            value={
                              yearOptions.find(
                                (opt) => opt.value === row.year,
                              ) || null
                            }
                            onChange={(opt) =>
                              updateRow(row.id, "year", opt?.value || null)
                            }
                            options={yearOptions}
                            classNamePrefix="react-select"
                            placeholder="Select year..."
                            isDisabled={uploading}
                          />
                          {yearMissing && (
                            <div
                              className="text-danger mt-1"
                              style={{ fontSize: 13 }}
                            >
                              Year is required
                            </div>
                          )}
                          {row.month && row.year && !isDateAllowed(row) && (
                            <div
                              className="text-danger mt-1"
                              style={{ fontSize: 13 }}
                            >
                              Only Jan 2026 onwards
                            </div>
                          )}
                          {isDuplicate && (
                            <div
                              className="text-danger mt-1"
                              style={{ fontSize: 13 }}
                            >
                              Duplicate center, month and year
                            </div>
                          )}
                        </FormGroup>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={4} className="mb-3">
                        <FormGroup className="mb-0">
                          <Label className="fw-semibold">
                            Amount <span className="text-danger">*</span>
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={row.amount}
                            onChange={(e) =>
                              updateRow(row.id, "amount", e.target.value)
                            }
                            disabled={uploading}
                            placeholder="e.g. 1234.50"
                          />
                          {amountInvalid && (
                            <div
                              className="text-danger mt-1"
                              style={{ fontSize: 13 }}
                            >
                              Amount must be greater than 0
                            </div>
                          )}
                        </FormGroup>
                      </Col>

                      <Col md={4} className="mb-3">
                        <FormGroup className="mb-0">
                          <Label className="fw-semibold">
                            Meter Number{" "}
                            <span className="text-danger">*</span>
                          </Label>
                          <Input
                            type="text"
                            value={row.meterNumber}
                            onChange={(e) =>
                              updateRow(row.id, "meterNumber", e.target.value)
                            }
                            disabled={uploading}
                            placeholder="e.g. MN-00123"
                            maxLength={50}
                          />
                          {meterNumberMissing && (
                            <div
                              className="text-danger mt-1"
                              style={{ fontSize: 13 }}
                            >
                              Meter number is required
                            </div>
                          )}
                        </FormGroup>
                      </Col>

                      <Col md={4} className="mb-3">
                        <FormGroup className="mb-0">
                          <Label className="fw-semibold">
                            Unit Used Per Month{" "}
                            <span className="text-danger">*</span>
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={row.unitUsed}
                            onChange={(e) =>
                              updateRow(row.id, "unitUsed", e.target.value)
                            }
                            disabled={uploading}
                            placeholder="e.g. 45.5"
                          />
                          {unitUsedInvalid && (
                            <div
                              className="text-danger mt-1"
                              style={{ fontSize: 13 }}
                            >
                              Unit used must be 0 or greater
                            </div>
                          )}
                        </FormGroup>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6} className="mb-3 mb-md-0">
                        <FormGroup className="mb-0">
                          <Label className="fw-semibold">Comment</Label>
                          <Input
                            type="textarea"
                            value={row.comment}
                            onChange={(e) =>
                              updateRow(row.id, "comment", e.target.value)
                            }
                            disabled={uploading}
                            rows={3}
                          />
                        </FormGroup>
                      </Col>

                      <Col md={6}>
                        <AttachmentPicker
                          existingFiles={[]}
                          newFiles={row.files}
                          onAddFiles={(files) => addFilesToRow(row.id, files)}
                          onRemoveNew={(idx) => removeFileFromRow(row.id, idx)}
                          disabled={uploading}
                        />
                        {fileMissing && (
                          <div
                            className="text-danger mt-1"
                            style={{ fontSize: 13 }}
                          >
                            Bill file is required
                          </div>
                        )}
                      </Col>
                    </Row>
                  </div>
                );
              })}

              {canUpload && (
                <div className="d-flex justify-content-start mb-4">
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={addRow}
                    disabled={uploading}
                  >
                    + Add Row
                  </button>
                </div>
              )}

              {previewRows.length > 0 && (
                <div className="mb-4">
                  <h6 className="fw-semibold mb-2">Preview</h6>
                  <Row>
                    {previewRows.map((row) => (
                      <Col md={6} key={row.id} className="mb-2">
                        <div className="p-2 px-3 bg-light rounded border h-100">
                          <div className="fw-semibold">{row.center?.label}</div>
                          <div className="text-muted" style={{ fontSize: 13 }}>
                            {monthOptions.find((opt) => opt.value === row.month)
                              ?.label}{" "}
                            {row.year}
                          </div>
                          <div
                            className="text-truncate"
                            style={{ fontSize: 13 }}
                          >
                            {row.files.map((f) => f.name).join(", ")}
                          </div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>
              )}

              {canUpload && (
                <div className="d-flex justify-content-end">
                  <Button
                    color="primary"
                    className="text-white"
                    onClick={handleSubmit}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Spinner size="sm" className="me-1" />
                        Uploading...
                      </>
                    ) : (
                      "Upload"
                    )}
                  </Button>
                </div>
              )}
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadBill;
