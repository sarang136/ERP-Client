import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import * as Yup from "yup";
import { useAuthError } from "../../../../Components/Hooks/useAuthError";
import { useCenterOptions } from "../../../../Components/Hooks/useCenterOptions";
import { useFormik } from "formik";
import { fetchDesignations } from "../../../../store/features/HR/hrSlice";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Button, Form, FormGroup, Input, Label, Spinner } from "reactstrap";
import Select from "react-select";
import { editTPM, getCompanies, getPositions, postTPM } from "../../../../helpers/backend_helper";
import { format } from "date-fns";
import { newEmploymentOptions } from "../../../../Components/constants/HR";

const objectIdRegex = /^[0-9a-fA-F]{24}$/

const validationSchema = Yup.object().shape({
    center: Yup.string()
        .required("Center is required")
        .matches(objectIdRegex, "Invalid center"),
    employeeName: Yup.string()
        .trim()
        .required("Employee name is required"),
    designation: Yup.string()
        .required("Designation is required")
        .matches(objectIdRegex, "Invalid designation"),
    position: Yup.string()
        .required("Position is required")
        .matches(objectIdRegex, "Invalid position"),
    department: Yup.string()
        .required("Department is required")
        .matches(objectIdRegex, "Invalid department"),
    company: Yup.string()
        .required("Company is required")
        .matches(objectIdRegex, "Invalid company"),
    vendor: Yup.string()
        .trim()
        .required("Vendor is required"),
    newEmploymentType: Yup.string().required("Employment type is required"),
    startDate: Yup.date()
        .required("Start date is required"),
    contractSignedWithVendor: Yup.object({
        approved: Yup.boolean().required(),
        approvedBy: Yup.string().nullable(),
    }),
    manpowerApprovedByManagement: Yup.object({
        approved: Yup.boolean().required(),
        approvedBy: Yup.string().nullable(),
    }),
});

const TPMForm = ({ initialData, onSuccess, view, onCancel, hasCreatePermission }) => {
    const dispatch = useDispatch();
    const handleAuthError = useAuthError();
    const { designations: designationOptions, designationLoading } = useSelector((state) => state.HR);
    const isEdit = !!initialData?._id;

    const centerOptions = useCenterOptions({ includeAll: false });

    const [positionOptions, setPositionOptions] = useState([]);
    const [departmentOptions, setDepartmentOptions] = useState([]);
    const [companyOptions, setCompanyOptions] = useState([]);

    useEffect(() => {
        const loadCompanies = async () => {
            try {
                const res = await getCompanies({ includeInactive: false });
                setCompanyOptions(
                    (res?.data || []).map((c) => ({ label: c.name, value: c._id })),
                );
            } catch (error) {
                if (!handleAuthError(error)) {
                    toast.error("Failed to fetch company");
                }
            }
        };

        loadCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const loadDesignations = async () => {
            try {
                dispatch(fetchDesignations({
                    status: ["PENDING", "APPROVED"],
                    version: 2
                })).unwrap();
            } catch (error) {
                if (!handleAuthError(error)) {
                    toast.error("Something went wrong while getting the designations");
                }
            }
        };

        loadDesignations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const loadPositions = async () => {
            try {
                const res = await getPositions();
                const rawData = res?.data || [];

                const mapped = rawData.flatMap((p) =>
                    (p.positions || [])
                        .filter((pos) => !pos.deleted && pos.version === 2)
                        .map((pos) => ({
                            label: pos.name,
                            value: pos._id.toString(),
                            department: p.department?.department,
                            departmentId: p.department?._id,
                        }))
                );

                mapped.sort((a, b) =>
                    a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
                );

                setPositionOptions(mapped);

                const deptsMapped = rawData
                    .filter((p) => p.department?._id)
                    .map((p) => ({
                        label: p.department?.department,
                        value: p.department?._id,
                    }));

                setDepartmentOptions((prev) => {
                    const existing = new Set(prev.map((o) => o.value));
                    const newOnes = deptsMapped.filter((d) => !existing.has(d.value));
                    return [...prev, ...newOnes];
                });
            } catch (error) {
                if (!handleAuthError(error)) {
                    toast.error("Failed to fetch positions");
                }
            }
        };

        loadPositions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const form = useFormik({
        enableReinitialize: true,
        validateOnMount: true,
        initialValues: {
            center: initialData?.center?._id || "",
            employeeName: initialData?.employeeName || "",
            designation: initialData?.designation?._id || "",
            position: initialData?.position?._id || "",
            department: initialData?.department?._id || "",
            company: initialData?.company?._id || "",
            vendor: initialData?.vendor || "",
            newEmploymentType: initialData?.newEmploymentType || "",
            startDate: initialData?.startDate
                ? format(new Date(initialData?.startDate), "yyyy-MM-dd")
                : "",
            contractSignedWithVendor: {
                approved: initialData?.contractSignedWithVendor?.approved ?? false,
                approvedBy: initialData?.contractSignedWithVendor?.approvedBy || "",
            },
            manpowerApprovedByManagement: {
                approved: initialData?.manpowerApprovedByManagement?.approved ?? false,
                approvedBy: initialData?.manpowerApprovedByManagement?.approvedBy || "",
            },
        },
        validationSchema,
        onSubmit: async (values, { setSubmitting }) => {
            try {
                if (isEdit) {
                    await editTPM(initialData?._id, values);
                    toast.success("Request updated successfully");
                } else {
                    await postTPM(values);
                    toast.success("Request submitted successfully");
                }

                if (view === "PAGE") {
                    form.resetForm();
                } else {
                    onSuccess?.();
                }
            } catch (error) {
                if (!handleAuthError(error)) {
                    toast.error(error?.message || "Failed to submit the request");
                }
            } finally {
                setSubmitting(false);
            }
        }
    })
    return (
        <Form onSubmit={form.handleSubmit}>

            {/* CENTER */}
            <FormGroup>
                <Label htmlFor="designation">Center <span className="text-danger">*</span></Label>
                <Select
                    inputId="center"
                    options={centerOptions}
                    value={form.values.center ? centerOptions.find(
                        opt => opt.value === form.values.center
                    ) : null}
                    onChange={(option) => {
                        form.setFieldValue(
                            "center",
                            option ? option.value : ""
                        );
                    }}
                    onBlur={() =>
                        form.setFieldTouched("center", true)
                    }
                    placeholder="Select Center"
                    classNamePrefix="react-select"
                    isClearable
                />

                {form.touched.center &&
                    form.errors.center && (
                        <div className="text-danger mt-1 small">
                            {form.errors.center}
                        </div>
                    )}
            </FormGroup>

            {/* EMPLOYEE NAME */}
            <FormGroup>
                <Label htmlFor="employee">Employee Name <span className="text-danger">*</span></Label>
                <Input
                    type="text"
                    id="employee"
                    name="employeeName"
                    value={form.values.employeeName}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                />
                {form.touched.employeeName &&
                    form.errors.employeeName && (
                        <div className="text-danger mt-1 small">
                            {form.errors.employeeName}
                        </div>
                    )}
            </FormGroup>

            {/* DESIGNATION */}
            <FormGroup>
                <Label htmlFor="designation">Designation <span className="text-danger">*</span></Label>
                <Select
                    inputId="designation"
                    placeholder="Select Employee Designation"
                    isClearable
                    options={designationOptions}
                    isDisabled={designationLoading}
                    isLoading={designationLoading}
                    value={
                        designationOptions.find(
                            opt => opt.value === form.values.designation
                        ) || null
                    }
                    onChange={(option) =>
                        form.setFieldValue("designation", option ? option.value : "")
                    }
                    onBlur={() => form.setFieldTouched("designation", true)}
                />

                {form.touched.designation && form.errors.designation && (
                    <div className="text-danger small mt-1">
                        {form.errors.designation}
                    </div>
                )}
            </FormGroup>

            {/* POSITION */}
            <FormGroup>
                <Label htmlFor="position">Position <span className="text-danger">*</span></Label>
                <Select
                    inputId="position"
                    placeholder="Select Position"
                    isClearable
                    options={positionOptions}
                    value={
                        positionOptions.find(
                            opt => opt.value === form.values.position
                        ) || null
                    }
                    onChange={(opt) => {
                        form.setFieldValue("position", opt ? opt.value : "");
                        if (opt?.departmentId) {
                            form.setFieldValue("department", opt.departmentId);
                            form.setFieldTouched("department", true, false);
                        } else {
                            form.setFieldValue("department", "");
                        }
                    }}
                    onBlur={() => form.setFieldTouched("position", true)}
                />

                {form.touched.position && form.errors.position && (
                    <div className="text-danger small mt-1">
                        {form.errors.position}
                    </div>
                )}
            </FormGroup>

            {/* DEPARTMENT */}
            <FormGroup>
                <Label htmlFor="department">Department <span className="text-danger">*</span></Label>
                <Select
                    inputId="department"
                    placeholder="Auto-filled from position"
                    isDisabled={true}
                    options={departmentOptions}
                    value={
                        departmentOptions.find(
                            opt => opt.value === form.values.department
                        ) || null
                    }
                    onChange={(option) =>
                        form.setFieldValue("department", option ? option.value : "")
                    }
                    onBlur={() => form.setFieldTouched("department", true)}
                />

                {form.touched.department && form.errors.department && (
                    <div className="text-danger small mt-1">
                        {form.errors.department}
                    </div>
                )}
            </FormGroup>

            {/* COMPANY */}
            <FormGroup>
                <Label htmlFor="company">Company <span className="text-danger">*</span></Label>
                <Select
                    inputId="company"
                    placeholder="Select Company"
                    isClearable
                    options={companyOptions}
                    value={
                        companyOptions.find(
                            opt => opt.value === form.values.company
                        ) || null
                    }
                    onChange={(option) =>
                        form.setFieldValue("company", option ? option.value : "")
                    }
                    onBlur={() => form.setFieldTouched("company", true)}
                />

                {form.touched.company && form.errors.company && (
                    <div className="text-danger small mt-1">
                        {form.errors.company}
                    </div>
                )}
            </FormGroup>

            {/* VENDOR */}
            <FormGroup>
                <Label htmlFor="vendor">Vendor<span className="text-danger">*</span></Label>
                <Input
                    type="text"
                    id="vendor"
                    name="vendor"
                    value={form.values.vendor}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                />
                {form.touched.vendor &&
                    form.errors.vendor && (
                        <div className="text-danger mt-1 small">
                            {form.errors.vendor}
                        </div>
                    )}
            </FormGroup>

            {/* EMPLOYMENT TYPE */}
            <FormGroup>
                <Label htmlFor="newEmploymentType">Employment Type <span className="text-danger">*</span></Label>
                <Select
                    inputId="newEmploymentType"
                    placeholder="Select Employment Type"
                    isClearable
                    options={newEmploymentOptions}
                    value={
                        newEmploymentOptions.find(
                            opt => opt.value === form.values.newEmploymentType
                        ) || null
                    }
                    onChange={(option) =>
                        form.setFieldValue("newEmploymentType", option ? option.value : "")
                    }
                    onBlur={() => form.setFieldTouched("newEmploymentType", true)}
                />

                {form.touched.newEmploymentType && form.errors.newEmploymentType && (
                    <div className="text-danger small mt-1">
                        {form.errors.newEmploymentType}
                    </div>
                )}
            </FormGroup>

            {/* START DATE */}
            <FormGroup>
                <Label htmlFor="startDate">
                    Start Date <span className="text-danger">*</span>
                </Label>
                <Input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={form.values.startDate}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                />
                {form.touched.startDate && form.errors.startDate && (
                    <div className="text-danger small mt-1">
                        {form.errors.startDate}
                    </div>
                )}
            </FormGroup>

            {/* CONTRACT SIGNED */}
            <FormGroup>
                <Label>
                    Contract Signed with Vendor <span className="text-danger">*</span>
                </Label>

                <div className="d-flex gap-4 mt-2">
                    <FormGroup check>
                        <Input
                            type="radio"
                            checked={form.values.contractSignedWithVendor.approved === true}
                            onChange={() => {
                                form.setFieldValue(
                                    "contractSignedWithVendor.approved",
                                    true
                                );
                                form.setFieldTouched(
                                    "contractSignedWithVendor.approved",
                                    true
                                );
                            }}
                        />
                        <Label check>Yes</Label>
                    </FormGroup>

                    <FormGroup check>
                        <Input
                            type="radio"
                            checked={form.values.contractSignedWithVendor.approved === false}
                            onChange={() => {
                                form.setFieldValue(
                                    "contractSignedWithVendor.approved",
                                    false
                                );
                                form.setFieldTouched(
                                    "contractSignedWithVendor.approved",
                                    true
                                );
                            }}
                        />
                        <Label check>No</Label>
                    </FormGroup>
                </div>

                {form.touched.contractSignedWithVendor?.approved &&
                    form.errors.contractSignedWithVendor?.approved && (
                        <div className="text-danger small mt-1">
                            {form.errors.contractSignedWithVendor.approved}
                        </div>
                    )}

                {/* APPROVED BY */}
                <FormGroup className="ms-4 mt-2">
                    <Label className="text-muted">
                        Approved By (optional)
                    </Label>
                    <Input
                        type="text"
                        value={form.values.contractSignedWithVendor.approvedBy}
                        onChange={(e) =>
                            form.setFieldValue(
                                "contractSignedWithVendor.approvedBy",
                                e.target.value
                            )
                        }
                    />
                </FormGroup>
            </FormGroup>

            {/* MANPOWER APPROVED */}
            <FormGroup>
                <Label>
                    Is the Manpower approved by Management{" "}
                    <span className="text-danger">*</span>
                </Label>

                <div className="d-flex gap-4 mt-2">
                    <FormGroup check>
                        <Input
                            type="radio"
                            id="manpowerApprovedYes"
                            checked={
                                form.values.manpowerApprovedByManagement.approved === true
                            }
                            onChange={() => {
                                form.setFieldValue(
                                    "manpowerApprovedByManagement.approved",
                                    true
                                );
                                form.setFieldTouched(
                                    "manpowerApprovedByManagement.approved",
                                    true
                                );
                            }}
                        />
                        <Label for="manpowerApprovedYes" check>
                            Yes
                        </Label>
                    </FormGroup>

                    <FormGroup check>
                        <Input
                            type="radio"
                            id="manpowerApprovedNo"
                            checked={
                                form.values.manpowerApprovedByManagement.approved === false
                            }
                            onChange={() => {
                                form.setFieldValue(
                                    "manpowerApprovedByManagement.approved",
                                    false
                                );
                                form.setFieldTouched(
                                    "manpowerApprovedByManagement.approved",
                                    true
                                );
                            }}
                        />
                        <Label for="manpowerApprovedNo" check>
                            No
                        </Label>
                    </FormGroup>
                </div>

                {form.touched.manpowerApprovedByManagement?.approved &&
                    form.errors.manpowerApprovedByManagement?.approved && (
                        <div className="text-danger small mt-1">
                            {form.errors.manpowerApprovedByManagement.approved}
                        </div>
                    )}

                {/* APPROVED BY */}
                <FormGroup className="ms-4 mt-2">
                    <Label className="text-muted">
                        Approved By (optional)
                    </Label>
                    <Input
                        type="text"
                        value={
                            form.values.manpowerApprovedByManagement.approvedBy
                        }
                        onChange={(e) =>
                            form.setFieldValue(
                                "manpowerApprovedByManagement.approvedBy",
                                e.target.value
                            )
                        }
                    />
                </FormGroup>
            </FormGroup>

            <div className="d-flex justify-content-end gap-2">
                {view === "MODAL" && <Button type="button" color="secondary" onClick={onCancel} disabled={form.isSubmitting}>
                    Cancel
                </Button>}

                {(view !== "PAGE" || hasCreatePermission) && (
                    <Button
                        type="submit"
                        className="text-white"
                        color="primary"
                        disabled={form.isSubmitting ||
                            !form.isValid ||
                            !form.dirty}
                    >
                        {form.isSubmitting && <Spinner size="sm" className="me-2" />}
                        {isEdit ? "Update Request" : "Add Request"}
                    </Button>
                )}
            </div>
        </Form>
    )
}

TPMForm.propTypes = {
    initialData: PropTypes.object,
    onSuccess: PropTypes.func,
    onCancel: PropTypes.func,
    view: PropTypes.oneOf(["MODAL", "PAGE"]),
    hasCreatePermission: PropTypes.bool
};

export default TPMForm;