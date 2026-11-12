import { useFormik } from "formik";
import { useState, useMemo } from "react";
import { Button, Input, FormGroup, Label, Spinner } from "reactstrap";
import { toast } from "react-toastify";
import * as Yup from "yup";
import PropTypes from "prop-types";
import Flatpickr from "react-flatpickr";
import monthSelectPlugin from "flatpickr/dist/plugins/monthSelect";
import "flatpickr/dist/themes/material_blue.css";
import "flatpickr/dist/plugins/monthSelect/style.css";
import Select from "react-select";
import { endOfMonth } from "date-fns";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { editPayrollAdjustments } from "../../../../helpers/backend_helper";
import { adjustmentTypeGroups, adjustmentTypeOptions } from "../../../../Components/constants/payrollAdjustments";
import PayrollAdjustmentAttachmentPicker from "../PayrollAdjustmentAttachmentPicker";

const validationSchema = Yup.object().shape({
    type: Yup.string()
        .oneOf(adjustmentTypeOptions.map((option) => option.value), "Select a valid type")
        .required("Type is required"),
    amount: Yup.number()
        .typeError("Amount must be a number")
        .required("Amount is required")
        .min(1, "Amount must be greater than 0"),
    details: Yup.string()
        .trim()
        .required("Details are required"),
    date: Yup.date()
        .typeError("Invalid date")
        .when("type", {
            is: "BONUS_ADJUSTMENT",
            then: (schema) => schema.notRequired(),
            otherwise: (schema) => schema.required("Date is required"),
        }),
    startMonth: Yup.date()
        .typeError("Invalid start month")
        .when("type", {
            is: "BONUS_ADJUSTMENT",
            then: (schema) => schema.required("Start month is required"),
            otherwise: (schema) => schema.notRequired(),
        }),
    endMonth: Yup.date()
        .typeError("Invalid end month")
        .when("type", {
            is: "BONUS_ADJUSTMENT",
            then: (schema) =>
                schema
                    .required("End month is required")
                    .min(Yup.ref("startMonth"), "End month cannot be before start month"),
            otherwise: (schema) => schema.notRequired(),
        }),
});

const PayrollAdjustmentsForm = ({ initialData, onSuccess, onCancel }) => {
    const handleAuthError = useAuthError();

    const [newFiles, setNewFiles] = useState([]);
    const [removedPaths, setRemovedPaths] = useState([]);

    const existingFiles = (initialData?.files || []).filter((file) => !removedPaths.includes(file.path));
    const filesChanged = newFiles.length > 0 || removedPaths.length > 0;

    const form = useFormik({
        enableReinitialize: true,
        initialValues: {
            type: initialData?.type || "",
            name: initialData?.employee?.name || "",
            eCode: initialData?.employee?.eCode || "",
            currentLocation: initialData?.center?.title || "",
            amount: initialData?.amount || "",
            details: initialData?.details || "",
            date: initialData?.date ? endOfMonth(new Date(initialData.date)) : "",
            startMonth: initialData?.startMonth ? endOfMonth(new Date(initialData.startMonth)) : "",
            endMonth: initialData?.endMonth ? endOfMonth(new Date(initialData.endMonth)) : "",
        },
        validationSchema,
        onSubmit: async (values) => {
            try {
                const formData = new FormData();
                formData.append("type", values.type);
                formData.append("amount", values.amount);
                formData.append("details", values.details);
                if (values.type === "BONUS_ADJUSTMENT") {
                    formData.append("startMonth", endOfMonth(new Date(values.startMonth)).toISOString());
                    formData.append("endMonth", endOfMonth(new Date(values.endMonth)).toISOString());
                } else {
                    formData.append("date", endOfMonth(new Date(values.date)).toISOString());
                }
                formData.append("removeFilePaths", JSON.stringify(removedPaths));
                newFiles.forEach((file) => formData.append("files", file));

                await editPayrollAdjustments(initialData._id, formData);
                toast.success("Payroll adjustment request updated successfully");
                onSuccess?.();
            } catch (error) {
                if (!handleAuthError(error)) {
                    toast.error(error?.message || "Failed to save payroll adjustment request");
                }
            }
        },
    });

    const monthPickerOptions = useMemo(
        () => ({
            plugins: [
                monthSelectPlugin({
                    shorthand: false,
                    dateFormat: "Y-m",
                    altFormat: "F Y",
                }),
            ],
            altInput: true,
            disableMobile: true,
        }),
        []
    );

    return (
        <>
            <FormGroup className="mb-3">
                <Label for="name">Name</Label>
                <Input id="name" name="name" value={form.values.name} disabled />
            </FormGroup>

            <FormGroup className="mb-3">
                <Label for="eCode">E-Code</Label>
                <Input id="eCode" name="eCode" value={form.values.eCode} disabled />
            </FormGroup>

            <FormGroup className="mb-3">
                <Label for="currentLocation">Current Location</Label>
                <Input id="currentLocation" name="currentLocation" value={form.values.currentLocation} disabled />
            </FormGroup>

            <FormGroup className="mb-3">
                <Label for="type">Type <span className="text-danger">*</span></Label>
                <Select
                    inputId="type"
                    options={adjustmentTypeGroups}
                    value={adjustmentTypeOptions.find((option) => option.value === form.values.type) || null}
                    onChange={(option) => {
                        form.setFieldValue("type", option?.value || "");
                        form.setFieldTouched("type", true, false);
                    }}
                    placeholder="Select type"
                    classNamePrefix="react-select"
                />
                {form.touched.type && form.errors.type && (
                    <div className="text-danger small">{form.errors.type}</div>
                )}
            </FormGroup>

            {form.values.type === "BONUS_ADJUSTMENT" ? (
                <div className="d-flex gap-3">
                    <FormGroup className="mb-3 flex-grow-1">
                        <Label for="startMonth">
                            Start Month <span className="text-danger">*</span>
                        </Label>
                        <Flatpickr
                            id="startMonth"
                            name="startMonth"
                            value={form.values.startMonth}
                            options={monthPickerOptions}
                            onChange={([date]) => {
                                form.setFieldValue("startMonth", date ? endOfMonth(date) : "");
                                form.setFieldTouched("startMonth", true, false);
                            }}
                            className={`form-control${form.touched.startMonth && form.errors.startMonth ? " is-invalid" : ""}`}
                            placeholder="Select month"
                        />
                        {form.touched.startMonth && form.errors.startMonth && (
                            <div className="text-danger small">{form.errors.startMonth}</div>
                        )}
                    </FormGroup>
                    <FormGroup className="mb-3 flex-grow-1">
                        <Label for="endMonth">
                            End Month <span className="text-danger">*</span>
                        </Label>
                        <Flatpickr
                            id="endMonth"
                            name="endMonth"
                            value={form.values.endMonth}
                            options={monthPickerOptions}
                            onChange={([date]) => {
                                form.setFieldValue("endMonth", date ? endOfMonth(date) : "");
                                form.setFieldTouched("endMonth", true, false);
                            }}
                            className={`form-control${form.touched.endMonth && form.errors.endMonth ? " is-invalid" : ""}`}
                            placeholder="Select month"
                        />
                        {form.touched.endMonth && form.errors.endMonth && (
                            <div className="text-danger small">{form.errors.endMonth}</div>
                        )}
                    </FormGroup>
                </div>
            ) : (
                <FormGroup className="mb-3">
                    <Label for="date">
                        Adjustment for the month of <span className="text-danger">*</span>
                    </Label>
                    <Flatpickr
                        id="date"
                        name="date"
                        value={form.values.date}
                        options={monthPickerOptions}
                        onChange={([date]) => {
                            form.setFieldValue("date", date ? endOfMonth(date) : "");
                            form.setFieldTouched("date", true, false);
                        }}
                        className={`form-control${form.touched.date && form.errors.date ? " is-invalid" : ""}`}
                        placeholder="Select month"
                    />
                    {form.touched.date && form.errors.date && (
                        <div className="text-danger small">{form.errors.date}</div>
                    )}
                </FormGroup>
            )}

            <FormGroup className="mb-3">
                <Label for="amount">Amount <span className="text-danger">*</span></Label>
                <Input
                    id="amount"
                    type="number"
                    name="amount"
                    value={form.values.amount}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                    invalid={form.touched.amount && !!form.errors.amount}
                />
                {form.touched.amount && form.errors.amount && (
                    <div className="text-danger small">{form.errors.amount}</div>
                )}
            </FormGroup>

            <FormGroup className="mb-3">
                <Label for="details">Details <span className="text-danger">*</span></Label>
                <Input
                    id="details"
                    name="details"
                    type="textarea"
                    rows={5}
                    value={form.values.details}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                    invalid={form.touched.details && !!form.errors.details}
                />
                {form.touched.details && form.errors.details && (
                    <div className="text-danger small">{form.errors.details}</div>
                )}
            </FormGroup>

            <div className="mb-3">
                <PayrollAdjustmentAttachmentPicker
                    existingFiles={existingFiles}
                    newFiles={newFiles}
                    onAddFiles={(added) => setNewFiles((prev) => [...prev, ...added])}
                    onRemoveExisting={(file) => setRemovedPaths((prev) => [...prev, file.path])}
                    onRemoveNew={(index) => setNewFiles((prev) => prev.filter((_, i) => i !== index))}
                    disabled={form.isSubmitting}
                />
            </div>

            <div className="d-flex gap-2 justify-content-end">
                <Button color="secondary" onClick={onCancel} disabled={form.isSubmitting}>
                    Cancel
                </Button>
                <Button
                    color="primary"
                    className="text-white"
                    onClick={form.handleSubmit}
                    disabled={form.isSubmitting || !form.isValid || !(form.dirty || filesChanged)}
                >
                    {form.isSubmitting && <Spinner size="sm" className="me-2" />}
                    Update Request
                </Button>
            </div>
        </>
    );
};

PayrollAdjustmentsForm.propTypes = {
    initialData: PropTypes.object,
    onSuccess: PropTypes.func,
    onCancel: PropTypes.func,
};

export default PayrollAdjustmentsForm;
