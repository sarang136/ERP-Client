import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Input, FormGroup, Label, Spinner, Row, Col } from "reactstrap";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import PropTypes from "prop-types";
import Flatpickr from "react-flatpickr";
import monthSelectPlugin from "flatpickr/dist/plugins/monthSelect";
import "flatpickr/dist/themes/material_blue.css";
import "flatpickr/dist/plugins/monthSelect/style.css";
import Select from "react-select";
import { endOfMonth } from "date-fns";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { getExitEmployeesBySearch } from "../../../../store/features/HR/hrSlice";
import { postPayrollAdjustments } from "../../../../helpers/backend_helper";
import { adjustmentTypeGroups, adjustmentTypeOptions } from "../../../../Components/constants/payrollAdjustments";
import PayrollAdjustmentAttachmentPicker from "../PayrollAdjustmentAttachmentPicker";

const makeEmptyRow = (id) => ({
    id,
    employeeId: "",
    name: "",
    eCode: "",
    currentLocation: "",
    type: "",
    date: "",
    startMonth: "",
    endMonth: "",
    amount: "",
    details: "",
    files: [],
});

const getRowErrors = (row) => {
    const errors = {};
    if (!row.employeeId) errors.employeeId = "Employee is required";
    if (!row.type) errors.type = "Type is required";
    if (row.type === "BONUS_ADJUSTMENT") {
        if (!row.startMonth) errors.startMonth = "Start month is required";
        if (!row.endMonth) errors.endMonth = "End month is required";
        if (row.startMonth && row.endMonth && new Date(row.endMonth) < new Date(row.startMonth)) {
            errors.endMonth = "End month cannot be before start month";
        }
    } else if (!row.date) {
        errors.date = "Month is required";
    }
    if (!row.amount || Number(row.amount) < 1) errors.amount = "Amount must be greater than 0";
    if (!row.details.trim()) errors.details = "Details are required";
    return errors;
};

const EmployeeSearch = ({ row, centerAccess, disabled, onSelect, error }) => {
    const dispatch = useDispatch();
    const handleAuthError = useAuthError();
    const [searchText, setSearchText] = useState("");
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [showList, setShowList] = useState(false);
    const requestRef = useRef(0);

    useEffect(() => {
        if (!searchText.trim()) {
            setShowList(false);
            return undefined;
        }

        setShowList(true);
        const timer = setTimeout(async () => {
            const requestId = ++requestRef.current;
            setSearching(true);
            try {
                const response = await dispatch(
                    getExitEmployeesBySearch({
                        query: searchText,
                        centers: centerAccess,
                        view: "PAYROLL_ADJUSTMENTS",
                    })
                ).unwrap();
                if (requestId === requestRef.current) setResults(response?.data || []);
            } catch (err) {
                if (!handleAuthError(err)) {
                    toast.error(err?.message || "something went wrong");
                }
            } finally {
                if (requestId === requestRef.current) setSearching(false);
            }
        }, 400);

        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchText]);

    return (
        <FormGroup className="mb-3 position-relative">
            <Label>Employee <span className="text-danger">*</span></Label>
            {row.employeeId && (
                <div className="mb-2 small">
                    <strong>{row.name}</strong> ({row.eCode}) · {row.currentLocation}
                </div>
            )}
            <Input
                type="text"
                placeholder={row.employeeId ? "Search to change employee" : "Search by name or ECode"}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                disabled={disabled}
            />
            {error && <div className="text-danger small">{error}</div>}
            {showList && (
                <div
                    className="border rounded bg-white shadow-sm mt-1"
                    style={{ maxHeight: "200px", overflowY: "auto", position: "absolute", width: "100%", zIndex: 99 }}
                >
                    {searching && <div className="p-2 text-muted">Loading...</div>}
                    {!searching && results.length === 0 && <div className="p-2 text-muted">No employees found</div>}
                    {results.map((emp) => (
                        <div
                            key={emp._id}
                            className="p-2"
                            style={{ cursor: "pointer", borderBottom: "1px solid #eee" }}
                            onClick={() => {
                                onSelect(emp);
                                setSearchText("");
                                setShowList(false);
                            }}
                        >
                            <strong>{emp.name}</strong>
                            <br />
                            <span className="text-muted">ECode: {emp.eCode}</span>
                        </div>
                    ))}
                </div>
            )}
        </FormGroup>
    );
};

EmployeeSearch.propTypes = {
    row: PropTypes.object.isRequired,
    centerAccess: PropTypes.any,
    disabled: PropTypes.bool,
    onSelect: PropTypes.func.isRequired,
    error: PropTypes.string,
};

const PayrollAdjustmentsMultiForm = ({ hasCreatePermission }) => {
    const handleAuthError = useAuthError();
    const { centerAccess } = useSelector((state) => state.User);

    const [rows, setRows] = useState([makeEmptyRow(0)]);
    const [submitting, setSubmitting] = useState(false);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [apiErrors, setApiErrors] = useState({});

    const monthPickerOptions = useMemo(
        () => ({
            plugins: [monthSelectPlugin({ shorthand: false, dateFormat: "Y-m", altFormat: "F Y" })],
            altInput: true,
            disableMobile: true,
        }),
        []
    );

    const clearApiError = (id) =>
        setApiErrors((prev) => {
            if (!prev[id]) return prev;
            const next = { ...prev };
            delete next[id];
            return next;
        });

    const updateRow = (id, changes) => {
        setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...changes } : row)));
        clearApiError(id);
    };

    const addRow = () =>
        setRows((prev) => [...prev, makeEmptyRow(Math.max(...prev.map((row) => row.id), -1) + 1)]);

    const removeRow = (id) => {
        setRows((prev) => prev.filter((row) => row.id !== id));
        clearApiError(id);
    };

    const allValid = rows.every((row) => Object.keys(getRowErrors(row)).length === 0);

    const handleSubmit = async () => {
        setSubmitAttempted(true);
        if (!allValid) return;

        setApiErrors({});
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append(
                "records",
                JSON.stringify(
                    rows.map((row) => ({
                        employeeId: row.employeeId,
                        type: row.type,
                        amount: Number(row.amount),
                        details: row.details.trim(),
                        ...(row.type === "BONUS_ADJUSTMENT"
                            ? {
                                startMonth: endOfMonth(new Date(row.startMonth)).toISOString(),
                                endMonth: endOfMonth(new Date(row.endMonth)).toISOString(),
                            }
                            : { date: endOfMonth(new Date(row.date)).toISOString() }),
                    }))
                )
            );
            rows.forEach((row, index) => {
                row.files.forEach((file) => formData.append(`files_${index}`, file));
            });

            await postPayrollAdjustments(formData);
            toast.success(
                rows.length === 1
                    ? "Payroll adjustment request added successfully"
                    : `${rows.length} payroll adjustment requests added successfully`
            );
            setRows([makeEmptyRow(0)]);
            setSubmitAttempted(false);
        } catch (error) {
            if (!handleAuthError(error)) {
                const message = error?.message || "Failed to save payroll adjustment requests";
                const match = /^Record (\d+):\s*(.*)$/.exec(message);
                const targetRow = match ? rows[Number(match[1]) - 1] : null;
                if (targetRow) setApiErrors({ [targetRow.id]: match[2] });
                toast.error(message);
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            {rows.map((row, index) => {
                const errors = submitAttempted ? getRowErrors(row) : {};
                const apiError = apiErrors[row.id];
                const hasError = !!apiError || Object.keys(errors).length > 0;

                return (
                    <div key={row.id} className={`mb-3 p-3 border rounded ${hasError ? "border-danger" : ""}`}>
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <h6 className="mb-0">Adjustment {index + 1}</h6>
                            {rows.length >= 2 && (
                                <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => removeRow(row.id)}
                                    disabled={submitting}
                                >
                                    Remove
                                </button>
                            )}
                        </div>

                        {apiError && <div className="text-danger mb-3 small">{apiError}</div>}

                        <EmployeeSearch
                            row={row}
                            centerAccess={centerAccess}
                            disabled={submitting}
                            error={errors.employeeId}
                            onSelect={(emp) =>
                                updateRow(row.id, {
                                    employeeId: emp._id,
                                    name: emp.name,
                                    eCode: emp.eCode,
                                    currentLocation: emp.currentLocation,
                                })
                            }
                        />

                        <Row>
                            <Col md={6}>
                                <FormGroup className="mb-3">
                                    <Label>Type <span className="text-danger">*</span></Label>
                                    <Select
                                        options={adjustmentTypeGroups}
                                        value={adjustmentTypeOptions.find((option) => option.value === row.type) || null}
                                        onChange={(option) => updateRow(row.id, { type: option?.value || "" })}
                                        placeholder="Select type"
                                        classNamePrefix="react-select"
                                        isDisabled={submitting}
                                    />
                                    {errors.type && <div className="text-danger small">{errors.type}</div>}
                                </FormGroup>
                            </Col>
                            {row.type === "BONUS_ADJUSTMENT" ? (
                                <>
                                    <Col md={3}>
                                        <FormGroup className="mb-3">
                                            <Label>Start Month <span className="text-danger">*</span></Label>
                                            <Flatpickr
                                                value={row.startMonth}
                                                options={monthPickerOptions}
                                                onChange={([date]) => updateRow(row.id, { startMonth: date ? endOfMonth(date) : "" })}
                                                className={`form-control${errors.startMonth ? " is-invalid" : ""}`}
                                                placeholder="Select month"
                                                disabled={submitting}
                                            />
                                            {errors.startMonth && <div className="text-danger small">{errors.startMonth}</div>}
                                        </FormGroup>
                                    </Col>
                                    <Col md={3}>
                                        <FormGroup className="mb-3">
                                            <Label>End Month <span className="text-danger">*</span></Label>
                                            <Flatpickr
                                                value={row.endMonth}
                                                options={monthPickerOptions}
                                                onChange={([date]) => updateRow(row.id, { endMonth: date ? endOfMonth(date) : "" })}
                                                className={`form-control${errors.endMonth ? " is-invalid" : ""}`}
                                                placeholder="Select month"
                                                disabled={submitting}
                                            />
                                            {errors.endMonth && <div className="text-danger small">{errors.endMonth}</div>}
                                        </FormGroup>
                                    </Col>
                                </>
                            ) : (
                                <Col md={6}>
                                    <FormGroup className="mb-3">
                                        <Label>Adjustment for the month of <span className="text-danger">*</span></Label>
                                        <Flatpickr
                                            value={row.date}
                                            options={monthPickerOptions}
                                            onChange={([date]) => updateRow(row.id, { date: date ? endOfMonth(date) : "" })}
                                            className={`form-control${errors.date ? " is-invalid" : ""}`}
                                            placeholder="Select month"
                                            disabled={submitting}
                                        />
                                        {errors.date && <div className="text-danger small">{errors.date}</div>}
                                    </FormGroup>
                                </Col>
                            )}
                        </Row>

                        <FormGroup className="mb-3">
                            <Label>Amount <span className="text-danger">*</span></Label>
                            <Input
                                type="number"
                                value={row.amount}
                                onChange={(e) => updateRow(row.id, { amount: e.target.value })}
                                invalid={!!errors.amount}
                                disabled={submitting}
                            />
                            {errors.amount && <div className="text-danger small">{errors.amount}</div>}
                        </FormGroup>

                        <FormGroup className="mb-3">
                            <Label>Details <span className="text-danger">*</span></Label>
                            <Input
                                type="textarea"
                                rows={3}
                                value={row.details}
                                onChange={(e) => updateRow(row.id, { details: e.target.value })}
                                invalid={!!errors.details}
                                disabled={submitting}
                            />
                            {errors.details && <div className="text-danger small">{errors.details}</div>}
                        </FormGroup>

                        <PayrollAdjustmentAttachmentPicker
                            newFiles={row.files}
                            onAddFiles={(added) => updateRow(row.id, { files: [...row.files, ...added] })}
                            onRemoveNew={(i) => updateRow(row.id, { files: row.files.filter((_, idx) => idx !== i) })}
                            disabled={submitting}
                        />
                    </div>
                );
            })}

            <div className="d-flex gap-2 justify-content-between">
                <Button color="light" className="border" onClick={addRow} disabled={submitting}>
                    + Add Another Adjustment
                </Button>
                {hasCreatePermission && (
                    <Button
                        color="primary"
                        className="text-white"
                        onClick={handleSubmit}
                        disabled={submitting || (submitAttempted && !allValid)}
                    >
                        {submitting && <Spinner size="sm" className="me-2" />}
                        {rows.length > 1 ? `Submit ${rows.length} Requests` : "Add Request"}
                    </Button>
                )}
            </div>
        </>
    );
};

PayrollAdjustmentsMultiForm.propTypes = {
    hasCreatePermission: PropTypes.bool,
};

export default PayrollAdjustmentsMultiForm;
