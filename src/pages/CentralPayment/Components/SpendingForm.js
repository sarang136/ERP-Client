import { format } from 'date-fns';
import { useFormik } from 'formik';
import { useState, useCallback, useRef, useEffect } from 'react'
import { connect, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import * as Yup from "yup";
import {
    Form,
    FormGroup,
    Label,
    Input,
    Button,
    ButtonGroup,
    Spinner,
    Badge,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from "reactstrap";
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthError } from '../../../Components/Hooks/useAuthError';
import { addPayment, updateCentralPayment } from '../../../store/features/centralPayment/centralPaymentSlice';
import FileUpload from '../../../Components/Common/FileUpload';
import { FileText, Share } from 'lucide-react';
import { categoryOptions, tallyBankAccounts } from '../../../Components/constants/centralPayment';
import Select from "react-select";
import { getExitEmployeesBySearch } from '../../../store/features/HR/hrSlice';
import AsyncSelect from "react-select/async";
import { formatCurrency } from '../../../utils/formatCurrency';
import { getSearchPatients, getEmployeesBySearch, getVendors, getCentralPaymentVendorPan, createCentralPaymentVendorRequest, uploadVendorDocument } from '../../../helpers/backend_helper';

const transactionMethodOptions = [
    { value: "UPI", label: "UPI" },
    { value: "NEFT_RTGS_IMPS", label: "NEFT/RTGS/IMPS" },
];

const bankAccountOptions = tallyBankAccounts.map((account) => ({
    value: account.value,
    label: account.label,
}));

const ATTACHMENT_TYPE_LABELS = {
    "INVOICE/BILL": "Invoice/Bill",
    "QUOTATION": "Quotation",
    "PROFORMA_INVOICE": "Performa Invoice",
    "VOUCHER": "Voucher",
};

const ATTACHMENT_SECTION_LABELS = {
    "INVOICE/BILL": "Invoice Upload",
    "QUOTATION": "Quotation Upload",
    "PROFORMA_INVOICE": "Proforma Invoice Upload",
    "VOUCHER": "Voucher Upload",
};

const fieldTransition = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -16 },
    transition: { duration: 0.25, ease: "easeInOut" },
};

const SpendingForm = ({ centerAccess, centers, paymentData, onUpdate }) => {
    const dispatch = useDispatch();
    const handleAuthError = useAuthError();

    const patientSearchTimerRef = useRef(null);
    const employeeSearchTimerRef = useRef(null);
    const paymentMadeBySearchTimerRef = useRef(null);

    const centerOptions = centers
        .map((c) => ({
            _id: c._id,
            title: c.title,
        }));

    // PAN card already on file for the chosen vendor (Vendor Management or an earlier payment), so it is not asked for again
    const [savedPan, setSavedPan] = useState(null);
    const panCardOnFileRef = useRef(false);
    const [existingFiles, setExistingFiles] = useState(paymentData?.attachments || []);
    const [removedAttachments, setRemovedAttachments] = useState([]);
    const [existingScreenshot] = useState(paymentData?.transactionProof || null);
    const [removeExistingScreenshot, setRemoveExistingScreenshot] = useState(false);
    const [paymentMadeByOption, setPaymentMadeByOption] = useState(
        paymentData?.paymentMadeBy
            ? {
                value: paymentData.paymentMadeBy,
                label: paymentData.paymentMadeBy,
                employeeName: paymentData.paymentMadeBy,
            }
            : null
    );

    const PAN_REGEX_MODAL = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    const IFSC_REGEX_MODAL = /^[A-Z]{4}0[A-Z0-9]{6}$/;

    const emptyVendorModal = {
        tradeName: "",
        ifsc: "",
        accountHolderName: "",
        accountNo: "",
        pan: "",
        panCardFile: null,
    };

    const [vendorModalOpen, setVendorModalOpen] = useState(false);
    const [vendorModalFields, setVendorModalFields] = useState(emptyVendorModal);
    const [vendorModalTouched, setVendorModalTouched] = useState({});
    const [vendorModalErrors, setVendorModalErrors] = useState({});
    const [vendorModalSubmitting, setVendorModalSubmitting] = useState(false);
    const panCardInputRef = useRef(null);

    const validateVendorModal = (fields) => {
        const errs = {};
        if (!fields.tradeName.trim()) errs.tradeName = "Vendor Name is required";
        if (!fields.ifsc.trim()) errs.ifsc = "Bank IFSC Code is required";
        else if (!IFSC_REGEX_MODAL.test(fields.ifsc.trim())) errs.ifsc = "Enter a valid IFSC, e.g. SBIN0001234";
        if (!fields.accountHolderName.trim()) errs.accountHolderName = "Account Holder Name is required";
        if (!fields.accountNo.trim()) errs.accountNo = "Account No. is required";
        if (!fields.pan.trim()) errs.pan = "PAN Card No. is required";
        else if (!PAN_REGEX_MODAL.test(fields.pan.trim())) errs.pan = "Enter a valid PAN, e.g. ABCDE1234F";
        return errs;
    };

    const handleVendorModalChange = (field, value) => {
        setVendorModalFields((prev) => ({ ...prev, [field]: value }));
        setVendorModalErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const handleVendorModalSubmit = async () => {
        const allTouched = { tradeName: true, ifsc: true, accountHolderName: true, accountNo: true, pan: true };
        setVendorModalTouched(allTouched);
        const errs = validateVendorModal(vendorModalFields);
        if (Object.keys(errs).length > 0) {
            setVendorModalErrors(errs);
            return;
        }
        setVendorModalSubmitting(true);
        try {
            const res = await createCentralPaymentVendorRequest({
                vendorCategory: "central_payment",
                tradeName: vendorModalFields.tradeName.trim(),
                pan: vendorModalFields.pan.trim().toUpperCase(),
                bankDetails: {
                    ifsc: vendorModalFields.ifsc.trim().toUpperCase(),
                    accountHolderName: vendorModalFields.accountHolderName.trim(),
                    accountNo: vendorModalFields.accountNo.trim(),
                },
            });
            const newVendorId = res?.data?._id;
            if (newVendorId && vendorModalFields.panCardFile) {
                const formData = new FormData();
                formData.append("file", vendorModalFields.panCardFile);
                formData.append("docType", "pan_card");
                try {
                    await uploadVendorDocument(newVendorId, formData);
                } catch {
                    toast.warn("Vendor request created but PAN card upload failed. Please upload it via Vendor Management.");
                }
            }
            setVendorModalOpen(false);
            setVendorModalFields(emptyVendorModal);
            setVendorModalTouched({});
            setVendorModalErrors({});
            toast.success("Vendor Request raised successfully, please reach out to the ops team for approval.");
        } catch (error) {
            if (!handleAuthError(error)) {
                const msg = error?.response?.data?.message || error?.message || "Failed to submit vendor request";
                setVendorModalErrors((prev) => ({ ...prev, _form: msg }));
            }
        } finally {
            setVendorModalSubmitting(false);
        }
    };

    const validationSchema = Yup.object({
        center: Yup.string().required("Center is required"),
        items: Yup.string().required("Items are required"),
        category: Yup.string()
            .oneOf(categoryOptions.map((option) => option.value), "Invalid item category")
            .required("Item category is required"),
        otherCategory: Yup.string().when("category", {
            is: "OTHERS",
            then: (schema) =>
                schema.required("Please specify the other category details"),
            otherwise: (schema) => schema.notRequired(),
        }),
        employeeId: Yup.mixed().when("category", {
            is: "SALARY_ADVANCE",
            then: schema => schema.required("Please select an employee"),
            otherwise: schema => schema.notRequired(),
        }),
        patientId: Yup.mixed().when("category", {
            is: "PATIENT_REFUND",
            then: schema => schema.required("Please select a patient"),
            otherwise: schema => schema.notRequired(),
        }),
        monthlyDeductionAmount: Yup.string().when("category", {
            is: "SALARY_ADVANCE",
            then: schema => schema
                .required("Monthly deduction amount is required")
                .matches(/^\d+(\.\d{1,2})?$/, "Amount can have at most 2 decimal places")
                .test("greater-than-zero", "Amount must be greater than 0", val => val && Number(val) > 0)
                .test(
                    "not-greater-than-total",
                    null,
                    function (val) {
                        const { totalAmountWithGST } = this.parent;
                        const total = Math.round(Number(totalAmountWithGST) || 0);
                        const isValid = !val || Number(val) <= total;

                        if (!isValid) {
                            return this.createError({
                                message: `Employee's Monthly deduction amount cannot be greater than the total amount with GST (Max: ${formatCurrency(total)})`
                            });
                        }
                        return true;
                    }
                ),
            otherwise: schema => schema.notRequired(),
        }),
        date: Yup.string().required("Transaction date is required"),
        description: Yup.string()
            .max(20, "Description cannot be more than 20 characters")
            .when("initialPaymentStatus", {
                is: "COMPLETED",
                then: (schema) => schema.notRequired(),
                otherwise: (schema) => schema.required("Description is required"),
            }),
        vendor: Yup.string().required("Vendor is required"),
        invoiceNo: Yup.string().required("Invoice number is required"),
        invoiceDate: Yup.string().required("Invoice date is required"),
        grossAmount: Yup.string()
            .required("Gross amount is required")
            .matches(/^\d+(\.\d{1,2})?$/, "Gross amount can have at most 2 decimal places")
            .test(
                "greater-than-zero",
                "Gross amount must be greater than 0",
                (val) => val && Number(val) > 0
            ),
        GSTAmount: Yup.string()
            .required("GST amount is required")
            .matches(/^\d+(\.\d{1,2})?$/, "GST amount can have at most 2 decimal places"),
        panNumber: Yup.string().when("TDSRate", {
            is: (v) => Number(v) > 0,
            then: (schema) => schema
                .trim()
                .required("PAN card number is required when TDS is applied")
                .matches(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Enter a valid PAN, e.g. ABCDE1234F"),
            otherwise: (schema) => schema.notRequired(),
        }),
        panCard: Yup.array().when("TDSRate", {
            is: (v) => Number(v) > 0,
            then: (schema) => schema
                .test("fileSize", "File must be under 100MB", (files) => {
                    if (!files || files.length === 0) return true;
                    return files.every((f) => f.size <= 100 * 1024 * 1024);
                })
                .test("panCardRequired", "PAN card upload is required when TDS is applied", (files) => {
                    // a PAN card already on file for this vendor counts, so it is not asked for again
                    return (files && files.length > 0) || panCardOnFileRef.current;
                }),
            otherwise: (schema) => schema.notRequired(),
        }),
        IFSCCode: Yup.string().when("initialPaymentStatus", {
            is: "COMPLETED",
            then: (schema) => schema.notRequired(),
            otherwise: (schema) => schema
                .trim()
                .required("IFSC Code is required")
                .matches(/^\S{11}$/, "IFSC Code must be exactly 11 characters"),
        }),
        accountHolderName: Yup.string().when("initialPaymentStatus", {
            is: "COMPLETED",
            then: (schema) => schema.notRequired(),
            otherwise: (schema) => schema.trim().required("Account holder name is required"),
        }),
        accountNo: Yup.string().when("initialPaymentStatus", {
            is: "COMPLETED",
            then: (schema) => schema.notRequired(),
            otherwise: (schema) => schema
                .trim()
                .required("Account number is required")
                .max(25, "Account number cannot be more than 25 characters"),
        }),
        TDSRate: Yup.number()
            .typeError("TDS Rate must be a number")
            .nullable()
            .min(0, "TDS Rate cannot be negative")
            .max(35, "TDS Rate cannot be greater than 35%"),
        initialPaymentStatus: Yup.string()
            .oneOf(["PENDING", "COMPLETED"], "Invalid payment status")
            .required("Please select Paid or To Be Paid"),
        attachmentType: Yup.string().when("initialPaymentStatus", {
            is: "COMPLETED",
            then: (schema) => schema.notRequired(),
            otherwise: (schema) => schema
                .oneOf(["INVOICE/BILL", "QUOTATION", "PROFORMA_INVOICE", "VOUCHER"], "Invalid attachment type")
                .required("Attachment type is required"),
        }),
        attachments: Yup.array().when([], {
            is: () => !paymentData?._id,
            then: (schema) =>
                schema
                    .test("fileSize", "Each file must be under 100MB", (files) => {
                        if (!files || files.length === 0) return true;
                        return files.every((f) => f.size <= 100 * 1024 * 1024);
                    })
                    .test("fileCount", "Upload at least one file", (files) => {
                        return files && files.length > 0;
                    }),
            otherwise: (schema) =>
                schema.test("fileSize", "Each file must be under 100MB", (files) => {
                    if (!files || files.length === 0) return true;
                    return files.every((f) => f.size <= 100 * 1024 * 1024);
                }),
        }),
        transactionId: Yup.string().when("initialPaymentStatus", {
            is: "COMPLETED",
            then: (schema) => schema.required("Transaction ID is required"),
            otherwise: (schema) => schema.notRequired(),
        }),
        transactionMethod: Yup.string().when("initialPaymentStatus", {
            is: "COMPLETED",
            then: (schema) => schema
                .oneOf(["UPI", "NEFT_RTGS_IMPS"], "Invalid transaction method")
                .required("Transaction method is required"),
            otherwise: (schema) => schema.notRequired(),
        }),
        paidFromBankAccount: Yup.string().when("initialPaymentStatus", {
            is: "COMPLETED",
            then: (schema) => schema.required("Bank account is required"),
            otherwise: (schema) => schema.notRequired(),
        }),
        paymentMadeBy: Yup.string().when("initialPaymentStatus", {
            is: "COMPLETED",
            then: (schema) => schema.required("Payment made by is required"),
            otherwise: (schema) => schema.notRequired(),
        }),
        paymentScreenshot: Yup.array().when("initialPaymentStatus", {
            is: "COMPLETED",
            then: (schema) => schema
                .test("fileSize", "File must be under 100MB", (files) => {
                    if (!files || files.length === 0) return true;
                    return files.every((f) => f.size <= 100 * 1024 * 1024);
                })
                .test("fileCount", "Upload the payment screenshot", (files) => {
                    if (paymentData?._id) return true;
                    return files && files.length > 0;
                }),
            otherwise: (schema) => schema.notRequired(),
        }),
    });


    const form = useFormik({
        initialValues: {
            center: paymentData?.center?._id || "",
            items: paymentData?.items || "",
            category: paymentData?.category || "",
            otherCategory: paymentData?.otherCategory || "",
            employeeId: paymentData?.employee
                ? {
                    value: paymentData.employee._id,
                    label: `${paymentData.employee.name} (${paymentData.employee.eCode})`,
                }
                : null,
            patientId: paymentData?.patient
                ? {
                    value: paymentData.patient._id,
                    label: `${paymentData.patient.name} (${paymentData.patient.id?.prefix || ""}${paymentData.patient.id?.value || ""})`,
                }
                : null,
            monthlyDeductionAmount: paymentData?.monthlyDeductionAmount ?? 0,
            date: paymentData?.date ? format(new Date(paymentData.date), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
            description: paymentData?.description || "",
            vendor: paymentData?.vendor || "",
            invoiceNo: paymentData?.invoiceNo || "",
            invoiceDate: paymentData?.invoiceDate ? format(new Date(paymentData.invoiceDate), "yyyy-MM-dd") : "",
            grossAmount: paymentData?.totalAmountWithoutGST ? String(paymentData.totalAmountWithoutGST) : "",
            GSTAmount: paymentData?.GSTAmount ? String(paymentData.GSTAmount) : "0",
            totalAmountWithGST: paymentData?.totalAmountWithGST ? String(Math.round(paymentData.totalAmountWithGST)) : "0",
            IFSCCode: paymentData?.bankDetails?.IFSCCode || "",
            accountHolderName: paymentData?.bankDetails?.accountHolderName || "",
            accountNo: paymentData?.bankDetails?.accountNo || "",
            panNumber: paymentData?.panNumber || "",
            panCard: [],
            initialPaymentStatus: paymentData?.initialPaymentStatus || "",
            TDSRate: paymentData?.TDSRate || "",
            attachmentType: paymentData?.attachmentType || "",
            attachments: [],
            transactionId: paymentData?.transactionId || "",
            transactionMethod: paymentData?.transactionMethod || "",
            paidFromBankAccount: paymentData?.paidFromBankAccount || "",
            paymentMadeBy: paymentData?.paymentMadeBy || "",
            paymentScreenshot: [],
        },
        validationSchema,
        onSubmit: async (values, { resetForm }) => {
            const remainingExistingAttachments = existingFiles.length;
            const newUploads = values.attachments.length;

            const finalCount = remainingExistingAttachments + newUploads;

            if (paymentData?._id && finalCount === 0) {
                toast.error("Invoice upload is required");
                return;
            }

            if (
                paymentData?._id &&
                values.initialPaymentStatus === "COMPLETED" &&
                removeExistingScreenshot &&
                values.paymentScreenshot.length === 0
            ) {
                toast.error("Payment screenshot is required");
                return;
            }

            const formData = new FormData();

            Object.entries(values).forEach(([key, val]) => {
                if (key === "attachments" || key === "paymentScreenshot" || key === "panCard") return;

                if (key === "date" || key === "invoiceDate") {
                    const now = new Date();
                    const spendingDate = new Date(val);
                    spendingDate.setHours(
                        now.getHours(),
                        now.getMinutes(),
                        now.getSeconds()
                    );
                    formData.append(key, spendingDate.toISOString());
                    return;
                }

                if (key === "TDSRate") {
                    formData.append("TDSRate", val === "" ? 0 : val);
                    return;
                }

                if (key === "grossAmount") {
                    formData.append("totalAmountWithoutGST", Number(val));
                    return;
                }

                if (key === "totalAmountWithGST") {
                    return;
                }

                if (key === "GSTAmount") {
                    formData.append(key, Number(val));
                    return;
                }

                if (key === "employeeId") {
                    if (val?.value) formData.append("employeeId", val.value);
                    return;
                }

                if (key === "patientId") {
                    if (values.category === "PATIENT_REFUND" && val?.value) {
                        formData.append("patientId", val.value);
                    }
                    return;
                }

                if (key === "monthlyDeductionAmount") {
                    if (values.category === "SALARY_ADVANCE" && val) {
                        formData.append("monthlyDeductionAmount", Number(val));
                    }
                    return;
                }

                if (val !== undefined && val !== null && val !== "") {
                    formData.append(key, val);
                }
            });

            values.attachments.forEach(f => formData.append("attachments", f));
            values.paymentScreenshot.forEach(f => formData.append("paymentScreenshot", f));
            if (Number(values.TDSRate) > 0 && !panCardOnFileRef.current) {
                values.panCard.forEach(f => formData.append("panCard", f));
            }
            if (paymentData?._id && removedAttachments.length > 0) {
                formData.append("removedAttachments", JSON.stringify(removedAttachments));
            }

            if (paymentData?._id && values.initialPaymentStatus === "COMPLETED") {
                formData.set("attachmentType", "INVOICE/BILL");
            }

            if (paymentData?._id && removeExistingScreenshot) {
                formData.append("removeTransactionProof", "true");
            }

            try {
                if (paymentData?._id) {
                    const response = await dispatch(updateCentralPayment({ id: paymentData?._id, formData: formData, centers: centerAccess })).unwrap();
                    if (response && onUpdate) onUpdate();
                    toast.success("Spending request updated successfully");
                } else {
                    await dispatch(addPayment({ formData, centers: centerAccess })).unwrap();
                    toast.success("Spending request submitted successfully");
                }
                resetForm();
            } catch (error) {
                if (!handleAuthError(error)) {
                    toast.error(error.message || "Failed to submit spending request");
                }
            }
        },
    });

    const handleSubmit = (e) => {
        form.handleSubmit(e);
    };

    const handlePaymentModeChange = (mode) => {
        if (form.values.initialPaymentStatus === mode) return;
        form.setFieldValue("initialPaymentStatus", mode, true);
    };

    // Only Active vendors created as "Central Payment Vendor" in Vendor Management can be chosen. They are
    // searched on the server as the user types, because there are more of them than fit in one list.

    // Commas break the Tally payment line, so they are removed from anything copied from the vendor
    const clean = (t) => String(t || "").replace(/,/g, " ").replace(/\s+/g, " ").trim();
    const toVendorOption = (v) => ({ value: v._id, label: clean(v.tradeName), vendor: v });
    const escapeRegex = (t) => String(t || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const searchVendors = (text, limit = 50) =>
        getVendors({ vendorCategory: "central_payment", status: "active", search: escapeRegex(text), limit })
            .then((res) => (res?.data || []).map(toVendorOption))
            .catch(() => []);

    const findMasterVendor = async (name) => {
        const wanted = clean(name).toLowerCase();
        if (!wanted) return null;
        const found = await searchVendors(name, 20);
        return found.find((o) => o.label.toLowerCase() === wanted) || null;
    };

    const loadSavedPan = (name) =>
        getCentralPaymentVendorPan(name)
            .then((res) => res?.data || null)
            .catch(() => null);

    // Name of the master vendor currently chosen; while it matches the Vendor field, its bank details are locked
    const [masterVendorName, setMasterVendorName] = useState("");
    const [masterVendorPan, setMasterVendorPan] = useState("");
    // For these categories the vendor is not picked from Vendor Management: a Patient Refund is typed in,
    // a Salary Advance takes the employee's name and bank details
    const TYPED_VENDOR_CATEGORIES = ["PATIENT_REFUND", "SALARY_ADVANCE"];
    const isTypedVendor = TYPED_VENDOR_CATEGORIES.includes(form.values.category);
    const [employeeBankLocked, setEmployeeBankLocked] = useState(false);
    const vendorLocked =
        !isTypedVendor &&
        !!masterVendorName &&
        masterVendorName.toLowerCase() === String(form.values.vendor || "").trim().toLowerCase();

    // Editing an existing payment: lock the bank details if its vendor is in the master
    useEffect(() => {
        let cancelled = false;
        if (form.values.vendor) {
            findMasterVendor(form.values.vendor).then((o) => {
                if (cancelled || !o) return;
                setMasterVendorName(o.label);
                setMasterVendorPan(clean(o.vendor.pan).toUpperCase());
            });
            loadSavedPan(form.values.vendor).then((saved) => { if (!cancelled) setSavedPan(saved); });
        }
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleVendorSelect = (opt) => {
        if (!opt?.vendor) {
            setMasterVendorName("");
            setMasterVendorPan("");
            form.setFieldValue("vendor", "");
            // PAN details belong to the vendor, so they go with it
            form.setFieldValue("panNumber", "");
            form.setFieldValue("panCard", []);
            setSavedPan(null);
            return;
        }
        const bank = opt.vendor.bankDetails || {};
        const vendorPan = clean(opt.vendor.pan).toUpperCase();
        setMasterVendorName(clean(opt.vendor.tradeName));
        setMasterVendorPan(vendorPan);
        // Always replaced, so the previous vendor's PAN number and PAN card file never stay behind
        form.setFieldValue("panNumber", vendorPan);
        form.setFieldValue("panCard", []);
        setSavedPan(null);
        loadSavedPan(clean(opt.vendor.tradeName)).then((saved) => {
            setSavedPan(saved);
            // a vendor without a PAN in Vendor Management gets the PAN from the earlier payment, if there is one
            if (!vendorPan && saved?.panNumber) form.setFieldValue("panNumber", saved.panNumber);
        });
        form.setFieldValue("vendor", clean(opt.vendor.tradeName));
        form.setFieldValue("IFSCCode", clean(bank.ifsc).toUpperCase());
        form.setFieldValue("accountHolderName", clean(bank.accountHolderName));
        form.setFieldValue("accountNo", clean(bank.accountNo));
    };

    // TDS needs the vendor's PAN card number and a copy of the PAN card.
    // A PAN that comes from the Vendor master is not editable here.
    const vendorUnchanged =
        String(form.values.vendor || "").trim().toUpperCase() === String(paymentData?.vendor || "").trim().toUpperCase();
    const typedPan = String(form.values.panNumber || "").toUpperCase();
    const panCardOnFile =
        (paymentData?.panCard?.url && vendorUnchanged && paymentData.panCard) ||
        (savedPan?.panCard?.url && (!savedPan.panNumber || savedPan.panNumber.toUpperCase() === typedPan) && savedPan.panCard) ||
        null;
    panCardOnFileRef.current = !!panCardOnFile;
    // The PAN number and PAN card that come with the vendor cannot be changed here (change them in Vendor Management)
    const panLocked = !!panCardOnFile || (vendorLocked && !!masterVendorPan);
    const bankLocked = vendorLocked || (form.values.category === "SALARY_ADVANCE" && employeeBankLocked);
    const renderPanFields = (suffix) => Number(form.values.TDSRate) > 0 && (
        <>
            <FormGroup>
                <Label for={`panNumber${suffix}`} className="fw-medium">
                    PAN Card No <span className="text-danger">*</span>
                </Label>
                <Input
                    type="text"
                    id={`panNumber${suffix}`}
                    name="panNumber"
                    value={form.values.panNumber}
                    readOnly={panLocked}
                    maxLength={10}
                    onChange={(e) => form.setFieldValue("panNumber", e.target.value.toUpperCase().replace(/\s/g, ""))}
                    onBlur={form.handleBlur}
                    className={`form-control ${panLocked ? "bg-light" : ""} ${form.touched.panNumber && form.errors.panNumber ? "is-invalid" : ""}`}
                />
                {form.touched.panNumber && form.errors.panNumber && (
                    <div className="invalid-feedback d-block">
                        <i className="fas fa-exclamation-circle me-1"></i>
                        {form.errors.panNumber}
                    </div>
                )}
            </FormGroup>
            <FormGroup>
                <Label className="fw-medium">
                    PAN Card Upload {!panCardOnFile && <span className="text-danger">*</span>}
                </Label>
                {panCardOnFile ? (
                    <div className="form-control bg-light d-flex align-items-center" style={{ height: "auto", minHeight: 38 }}>
                        <i className="fas fa-lock text-muted me-2"></i>
                        <a href={panCardOnFile.url} target="_blank" rel="noopener noreferrer">
                            {panCardOnFile.originalName || "View PAN card"}
                        </a>
                    </div>
                ) : (
                    <FileUpload
                        inputId={`panCardUploadInput${suffix}`}
                        files={form.values.panCard || []}
                        setFiles={(files) => form.setFieldValue("panCard", files)}
                        multiple={false}
                    />
                )}
                {form.touched.panCard && form.errors.panCard && (
                    <div className="invalid-feedback d-block">
                        <i className="fas fa-exclamation-circle me-1"></i>
                        {form.errors.panCard}
                    </div>
                )}
            </FormGroup>
        </>
    );

    const handleEmployeeSelect = (option) => {
        form.setFieldValue("employeeId", option);
        const bank = option?.bankDetails || {};
        const ifsc = clean(bank.IFSCCode).toUpperCase();
        const holder = clean(bank.accountName);
        const accountNo = clean(bank.accountNo);
        const complete = !!(option && ifsc && holder && accountNo);
        setEmployeeBankLocked(complete);
        form.setFieldValue("IFSCCode", ifsc);
        form.setFieldValue("accountHolderName", holder);
        form.setFieldValue("accountNo", accountNo);
        if (option && !complete) {
            toast.warn("Bank details are not complete for this employee. Please fill them in.");
        }
    };

    const normalizeTextInput = (e) => {
        const { name, value } = e.target;

        if (value.includes(",")) {
            form.setFieldTouched(name, true, false);
            form.setFieldError(name, "Comma (,) is not allowed");
            return;
        }

        if (name === "description" || name === "vendor") {
            const valid = /^[a-zA-Z0-9 ]*$/.test(value);
            if (!valid) {
                form.setFieldTouched(name, true, false);
                form.setFieldError(name, "No special characters allowed");
                return;
            }
        }


        let newValue = value;
        if (["IFSCCode", "accountNo"].includes(name)) {
            newValue = value.replace(/\s+/g, "");
        }

        form.setFieldValue(name, newValue.toUpperCase(), true);
    };

    const normalizeAmountInput = (e) => {
        const { name, value } = e.target;

        if (!/^\d*(\.\d{0,2})?$/.test(value)) return;

        form.setFieldValue(name, value);
    };

    const handleGrossOrGstChange = (e) => {
        const { name, value } = e.target;
        if (!/^\d*(\.\d{0,2})?$/.test(value)) return;
        form.setFieldValue(name, value);
        const gross = name === "grossAmount" ? value : form.values.grossAmount;
        const gst = name === "GSTAmount" ? value : form.values.GSTAmount;
        const total = Math.round(Number(gross || 0) + Number(gst || 0));
        form.setFieldValue("totalAmountWithGST", String(total));
    };

    const loadEmployees = async (inputValue) => {
        if (!inputValue) return [];

        try {
            const res = await dispatch(
                getExitEmployeesBySearch({
                    query: inputValue,
                    centers: form.values.center,
                    view: "SALARY_ADVANCE",
                    withBank: true,
                })
            ).unwrap();
            return (res?.data || []).map(emp => ({
                value: emp._id,
                label: `${emp.name} (${emp.eCode})`,
                employeeName: emp.name,
                bankDetails: emp.bankDetails,
            }));
        } catch (error) {
            if (!handleAuthError(error)) {
                toast.error(error?.message || "Failed to search employees");
            }
            return [];
        }
    };

    const loadPatients = async (inputValue) => {
        if (!inputValue) return [];
        try {
            const res = await getSearchPatients({
                name: inputValue,
                centerAccess: form.values.center ? [form.values.center] : [],
            });
            return (res?.payload || []).map(p => ({
                value: p._id,
                label: `${p.name} (${p.id?.prefix || ""}${p.id?.value || ""})`,
            }));
        } catch (error) {
            if (!handleAuthError(error)) {
                toast.error(error?.message || "Failed to search patients");
            }
            return [];
        }
    };

    const debouncedLoadPatients = useCallback(
        (inputValue, callback) => {
            if (patientSearchTimerRef.current) clearTimeout(patientSearchTimerRef.current);
            patientSearchTimerRef.current = setTimeout(() => {
                loadPatients(inputValue).then(callback);
            }, 300);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [form.values.center]
    );

    const debouncedLoadEmployees = useCallback(
        (inputValue, callback) => {
            if (employeeSearchTimerRef.current) clearTimeout(employeeSearchTimerRef.current);
            employeeSearchTimerRef.current = setTimeout(() => {
                loadEmployees(inputValue).then(callback);
            }, 300);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [form.values.center]
    );

    const loadPaymentMadeByEmployees = async (inputValue) => {
        if (!inputValue) return [];

        try {
            const response = await getEmployeesBySearch({
                type: "all",
                name: inputValue,
            });
            return (response?.data || []).map(emp => ({
                value: emp._id,
                label: `${emp.name} (${emp.eCode})`,
                employeeName: emp.name,
            }));
        } catch (error) {
            if (!handleAuthError(error)) {
                toast.error(error?.message || "Failed to search employees");
            }
            return [];
        }
    };

    const debouncedLoadPaymentMadeByEmployees = useCallback(
        (inputValue, callback) => {
            if (paymentMadeBySearchTimerRef.current) clearTimeout(paymentMadeBySearchTimerRef.current);
            paymentMadeBySearchTimerRef.current = setTimeout(() => {
                loadPaymentMadeByEmployees(inputValue).then(callback);
            }, 300);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    const renderCenterItemCategoryFields = () => (
        <>
            <FormGroup>
                <Label for="center" className="fw-medium">
                    Center <span className="text-danger">*</span>
                </Label>
                <Select
                    inputId="center"
                    name="center"
                    options={centerOptions.map((c) => ({ value: c._id, label: c.title }))}
                    value={
                        form.values.center
                            ? centerOptions
                                .map((c) => ({ value: c._id, label: c.title }))
                                .find(opt => opt.value === form.values.center)
                            : null
                    }
                    onChange={(option) => {
                        form.setFieldValue("center", option?.value || "", true);
                        form.setFieldValue("employeeId", null);
                        form.setFieldTouched("employeeId", false, false);
                    }}
                    onBlur={() => form.setFieldTouched("center", true)}
                    placeholder="Select a Center"
                    classNamePrefix="react-select"
                    className={
                        form.touched.center && form.errors.center
                            ? "react-select is-invalid"
                            : "react-select"
                    }
                />
                {form.touched.center && form.errors.center && (
                    <div className="invalid-feedback d-block">
                        <i className="fas fa-exclamation-circle me-1"></i>
                        {form.errors.center}
                    </div>
                )}
            </FormGroup>
            <FormGroup>
                <Label for="items" className="fw-medium">
                    Items <span className="text-danger">*</span>
                </Label>
                <Input
                    type="text"
                    id="items"
                    name="items"
                    value={form.values.items}
                    onChange={(e) => normalizeTextInput(e)}
                    onBlur={form.handleBlur}
                    className={`form-control ${form.touched.items && form.errors.items
                        ? "is-invalid"
                        : ""
                        }`}
                />
                {form.touched.items && form.errors.items && (
                    <div className="invalid-feedback d-block">
                        <i className="fas fa-exclamation-circle me-1"></i>
                        {form.errors.items}
                    </div>
                )}
            </FormGroup>
            <FormGroup>
                <Label for="category" className="fw-medium">
                    Item Category <span className="text-danger">*</span>
                </Label>
                <Select
                    inputId="category"
                    name="category"
                    options={categoryOptions}
                    value={
                        form.values.category
                            ? categoryOptions.find(opt => opt.value === form.values.category)
                            : ""
                    }
                    onChange={(option) => {
                        const value = option?.value || "";
                        const switchingVendorSource =
                            form.values.category !== value &&
                            (TYPED_VENDOR_CATEGORIES.includes(form.values.category) || TYPED_VENDOR_CATEGORIES.includes(value));
                        form.setFieldValue("category", value, true);

                        // The vendor details come from a different place for Patient Refund and Salary Advance than
                        // for the other categories, so switching between them starts the vendor details afresh
                        if (switchingVendorSource) {
                            setEmployeeBankLocked(false);
                            setMasterVendorName("");
                            setMasterVendorPan("");
                            setSavedPan(null);
                            form.setFieldValue("vendor", "");
                            form.setFieldValue("IFSCCode", "");
                            form.setFieldValue("accountHolderName", "");
                            form.setFieldValue("accountNo", "");
                            form.setFieldValue("panNumber", "");
                            form.setFieldValue("panCard", []);
                        }

                        if (value !== "OTHERS") {
                            form.setFieldValue("otherCategory", "");
                            form.setFieldTouched("otherCategory", false, false);
                        }

                        if (value !== "SALARY_ADVANCE") {
                            form.setFieldValue("employeeId", null);
                            form.setFieldTouched("employeeId", false, false);
                            form.setFieldValue("monthlyDeductionAmount", "");
                            form.setFieldTouched("monthlyDeductionAmount", false, false);
                        }

                        if (value !== "PATIENT_REFUND") {
                            form.setFieldValue("patientId", null);
                            form.setFieldTouched("patientId", false, false);
                        }
                        form.validateForm();
                    }}
                    onBlur={() => form.setFieldTouched("category", true)}
                    placeholder="Select item category"
                    classNamePrefix="react-select"
                    className={
                        form.touched.category && form.errors.category
                            ? "react-select is-invalid"
                            : "react-select"
                    }
                />
                {form.touched.category && form.errors.category && (
                    <div className="invalid-feedback d-block">
                        {form.errors.category}
                    </div>
                )}
            </FormGroup>
            {form.values.category === "SALARY_ADVANCE" && (
                <FormGroup className="mb-3">
                    <Label className="fw-medium">
                        Select Employee <span className="text-danger">*</span>
                    </Label>

                    <AsyncSelect
                        key={form.values.center}
                        cacheOptions={false}
                        defaultOptions={false}
                        loadOptions={debouncedLoadEmployees}
                        placeholder="Search by name or ECode"
                        value={form.values.employeeId}
                        onChange={handleEmployeeSelect}
                        onBlur={() => form.setFieldTouched("employeeId", true)}
                        classNamePrefix="react-select"
                        className={
                            form.touched.employeeId && form.errors.employeeId
                                ? "react-select is-invalid"
                                : "react-select"
                        }
                        noOptionsMessage={({ inputValue }) =>
                            inputValue
                                ? "No employee found"
                                : "Start typing to search employee"
                        }
                    />

                    {form.touched.employeeId && form.errors.employeeId && (
                        <div className="invalid-feedback d-block">
                            {form.errors.employeeId}
                        </div>
                    )}
                </FormGroup>
            )}

            {form.values.category === "PATIENT_REFUND" && (
                <FormGroup className="mb-3">
                    <Label className="fw-medium">
                        Select Patient <span className="text-danger">*</span>
                    </Label>
                    <AsyncSelect
                        key={form.values.center}
                        cacheOptions={false}
                        defaultOptions={false}
                        loadOptions={debouncedLoadPatients}
                        placeholder="Search by name or patient UID"
                        value={form.values.patientId}
                        onChange={(option) => {
                            form.setFieldValue("patientId", option);
                        }}
                        onBlur={() => form.setFieldTouched("patientId", true)}
                        classNamePrefix="react-select"
                        className={
                            form.touched.patientId && form.errors.patientId
                                ? "react-select is-invalid"
                                : "react-select"
                        }
                        noOptionsMessage={({ inputValue }) =>
                            inputValue
                                ? "No patient found"
                                : "Search by name or patient UID"
                        }
                    />
                    {form.touched.patientId && form.errors.patientId && (
                        <div className="invalid-feedback d-block">
                            {form.errors.patientId}
                        </div>
                    )}
                </FormGroup>
            )}

            {form.values.category === "OTHERS" && (
                <FormGroup className="mt-2">
                    <Label for="otherCategory" className="fw-medium">
                        Specify Other Category Details<span className="text-danger">*</span>
                    </Label>
                    <Input
                        type="text"
                        id="otherCategory"
                        name="otherCategory"
                        value={form.values.otherCategory}
                        onChange={(e) => normalizeTextInput(e)}
                        onBlur={form.handleBlur}
                        className={`form-control ${form.touched.otherCategory && form.errors.otherCategory
                            ? "is-invalid"
                            : ""
                            }`}
                        placeholder="Enter Other category details"
                    />
                    {form.touched.otherCategory && form.errors.otherCategory && (
                        <div className="invalid-feedback d-block">
                            {form.errors.otherCategory}
                        </div>
                    )}
                </FormGroup>
            )}
            {form.values.category === "SALARY_ADVANCE" && (
                <FormGroup className="mb-3">
                    <Label for="monthlyDeductionAmount" className="fw-medium">
                        Employee's Monthly Deduction Amount <span className="text-danger">*</span>
                    </Label>
                    <Input
                        type="text"
                        id="monthlyDeductionAmount"
                        name="monthlyDeductionAmount"
                        value={form.values.monthlyDeductionAmount}
                        onChange={(e) => normalizeAmountInput(e)}
                        onBlur={form.handleBlur}
                        placeholder="0.00"
                        className={`form-control ${form.touched.monthlyDeductionAmount && form.errors.monthlyDeductionAmount
                            ? "is-invalid"
                            : ""
                            }`}
                    />
                    {form.touched.monthlyDeductionAmount && form.errors.monthlyDeductionAmount && (
                        <div className="invalid-feedback d-block">
                            <i className="fas fa-exclamation-circle me-1"></i>
                            {form.errors.monthlyDeductionAmount}
                        </div>
                    )}
                </FormGroup>
            )}
        </>
    );

    const renderToBePaidFields = () => (
        <>
            {renderCenterItemCategoryFields()}
            <FormGroup className="mb-4">
                <Label for="date" className="fw-medium text-muted">
                    Date <span className="text-danger">*</span>
                </Label>
                <Input
                    type="date"
                    id="date"
                    name="date"
                    value={form.values.date}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                    className={`form-control ${form.touched.date && form.errors.date
                        ? "is-invalid"
                        : ""
                        }`}
                />
                {form.touched.date && form.errors.date && (
                    <div className="invalid-feedback d-block">
                        <i className="fas fa-exclamation-circle me-1"></i>
                        {form.errors.date}
                    </div>
                )}
            </FormGroup>
            <FormGroup>
                <Label for="description" className="fw-medium">
                    Bank Statement Description <span className="text-danger">*</span>
                    <span className="ms-1 text-muted fs-12">
                        (Max 20 characters, no special characters)
                    </span>
                </Label>
                <Input
                    type="textarea"
                    id="description"
                    name="description"
                    rows="3"
                    value={form.values.description}
                    onChange={(e) => normalizeTextInput(e)}
                    onBlur={form.handleBlur}
                    className={`form-control ${form.touched.description && form.errors.description
                        ? "is-invalid"
                        : ""
                        }`}
                />
                {form.touched.description && form.errors.description && (
                    <div className="invalid-feedback d-block">
                        <i className="fas fa-exclamation-circle me-1"></i>
                        {form.errors.description}
                    </div>
                )}
            </FormGroup>
            <FormGroup>
                <Label for="vendor" className="fw-medium">
                    Vendor <span className="text-danger">*</span>
                </Label>
                {isTypedVendor ? (
                    <Input
                        type="text"
                        id="vendor"
                        name="vendor"
                        value={form.values.vendor}
                        onChange={(e) => normalizeTextInput(e)}
                        onBlur={form.handleBlur}
                        className={`form-control ${form.touched.vendor && form.errors.vendor
                            ? "is-invalid"
                            : ""
                            }`}
                    />
                ) : (
                    <>
                        <AsyncSelect
                            inputId="vendor"
                            isClearable
                            cacheOptions
                            defaultOptions
                            loadOptions={(text) => searchVendors(text)}
                            placeholder="Select vendor"
                            noOptionsMessage={() => "No active vendor found."}
                            value={form.values.vendor ? { value: form.values.vendor, label: form.values.vendor } : null}
                            onChange={handleVendorSelect}
                            onBlur={() => form.setFieldTouched("vendor", true)}
                            classNamePrefix="react-select"
                            styles={form.touched.vendor && form.errors.vendor ? { control: (b) => ({ ...b, borderColor: "#dc3545" }) } : undefined}
                        />
                        <button
                            type="button"
                            className="btn btn-link btn-sm p-0 mt-1"
                            style={{ fontSize: "0.8rem", textDecoration: "none" }}
                            onClick={() => setVendorModalOpen(true)}
                        >
                            + Add new vendor <i className="bx bx-right-arrow-alt"></i>
                        </button>
                    </>
                )}
                {form.touched.vendor && form.errors.vendor && (
                    <div className="invalid-feedback d-block">
                        <i className="fas fa-exclamation-circle me-1"></i>
                        {form.errors.vendor}
                    </div>
                )}
            </FormGroup>
            <FormGroup>
                <Label for="invoiceNo" className="fw-medium">
                    Invoice No <span className="text-danger">*</span>
                </Label>
                <Input
                    type="text"
                    id="invoiceNo"
                    name="invoiceNo"
                    value={form.values.invoiceNo}
                    onChange={(e) => normalizeTextInput(e)}
                    onBlur={form.handleBlur}
                    className={`form-control ${form.touched.invoiceNo && form.errors.invoiceNo
                        ? "is-invalid"
                        : ""
                        }`}
                />
                {form.touched.invoiceNo && form.errors.invoiceNo && (
                    <div className="invalid-feedback d-block">
                        <i className="fas fa-exclamation-circle me-1"></i>
                        {form.errors.invoiceNo}
                    </div>
                )}
            </FormGroup>

            <FormGroup>
                <Label for="invoiceDate" className="fw-medium">
                    Invoice Date <span className="text-danger">*</span>
                </Label>
                <Input
                    type="date"
                    id="invoiceDate"
                    name="invoiceDate"
                    value={form.values.invoiceDate}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                    className={`form-control ${form.touched.invoiceDate && form.errors.invoiceDate
                        ? "is-invalid"
                        : ""
                        }`}
                />
                {form.touched.invoiceDate && form.errors.invoiceDate && (
                    <div className="invalid-feedback d-block">
                        <i className="fas fa-exclamation-circle me-1"></i>
                        {form.errors.invoiceDate}
                    </div>
                )}
            </FormGroup>

            <FormGroup>
                <Label for="grossAmount" className="fw-medium">
                    Gross Amount (Excl. GST) <span className="text-danger">*</span>
                </Label>
                <Input
                    type="text"
                    id="grossAmount"
                    name="grossAmount"
                    value={form.values.grossAmount}
                    onChange={handleGrossOrGstChange}
                    onBlur={form.handleBlur}
                    placeholder="0.00"
                    className={`form-control ${form.touched.grossAmount && form.errors.grossAmount
                        ? "is-invalid"
                        : ""
                        }`}
                />
                {form.touched.grossAmount && form.errors.grossAmount && (
                    <div className="invalid-feedback d-block">
                        <i className="fas fa-exclamation-circle me-1"></i>
                        {form.errors.grossAmount}
                    </div>
                )}
            </FormGroup>
            <FormGroup>
                <Label for="GSTAmount" className="fw-medium">
                    GST Amount (Mention amount from the bill, dont mention the %) <span className="text-danger">*</span>
                </Label>
                <Input
                    type="text"
                    id="GSTAmount"
                    name="GSTAmount"
                    value={form.values.GSTAmount}
                    onChange={handleGrossOrGstChange}
                    onBlur={form.handleBlur}
                    placeholder="0.00"
                    className={`form-control ${form.touched.GSTAmount && form.errors.GSTAmount
                        ? "is-invalid"
                        : ""
                        }`}
                />
                {form.touched.GSTAmount && form.errors.GSTAmount && (
                    <div className="invalid-feedback d-block">
                        <i className="fas fa-exclamation-circle me-1"></i>
                        {form.errors.GSTAmount}
                    </div>
                )}
            </FormGroup>
            <FormGroup>
                <Label for="totalAmountWithGST" className="fw-medium">
                    Total Amount including GST
                </Label>
                <Input
                    type="text"
                    id="totalAmountWithGST"
                    name="totalAmountWithGST"
                    value={form.values.totalAmountWithGST}
                    readOnly
                    disabled
                    className="form-control"
                />
            </FormGroup>
            <FormGroup>
                <Label for="IFSCCode" className="fw-medium">
                    Bank IFSC Code <span className="text-danger">*</span>
                </Label>
                <Input
                    type="text"
                    id="IFSCCode"
                    name="IFSCCode"
                    value={form.values.IFSCCode}
                    readOnly={bankLocked}
                    onChange={(e) => normalizeTextInput(e)}
                    onBlur={form.handleBlur}
                    className={`form-control ${bankLocked ? "bg-light" : ""} ${form.touched.IFSCCode && form.errors.IFSCCode
                        ? "is-invalid"
                        : ""
                        }`}
                />
                {form.touched.IFSCCode && form.errors.IFSCCode && (
                    <div className="invalid-feedback d-block">
                        <i className="fas fa-exclamation-circle me-1"></i>
                        {form.errors.IFSCCode}
                    </div>
                )}
            </FormGroup>
            <FormGroup>
                <Label for="accountHolderName" className="fw-medium">
                    Account Holder Name <span className="text-danger">*</span>
                </Label>
                <Input
                    type="text"
                    id="accountHolderName"
                    name="accountHolderName"
                    value={form.values.accountHolderName}
                    readOnly={bankLocked}
                    onChange={(e) => normalizeTextInput(e)}
                    onBlur={form.handleBlur}
                    className={`form-control ${bankLocked ? "bg-light" : ""} ${form.touched.accountHolderName && form.errors.accountHolderName
                        ? "is-invalid"
                        : ""
                        }`}
                />
                {form.touched.accountHolderName && form.errors.accountHolderName && (
                    <div className="invalid-feedback d-block">
                        <i className="fas fa-exclamation-circle me-1"></i>
                        {form.errors.accountHolderName}
                    </div>
                )}
            </FormGroup>
            <FormGroup>
                <Label for="accountNo" className="fw-medium">
                    Account No <span className="text-danger">*</span>
                </Label>
                <Input
                    type="text"
                    id="accountNo"
                    name="accountNo"
                    value={form.values.accountNo}
                    readOnly={bankLocked}
                    onChange={(e) => normalizeTextInput(e)}
                    onBlur={form.handleBlur}
                    className={`form-control ${bankLocked ? "bg-light" : ""} ${form.touched.accountNo && form.errors.accountNo
                        ? "is-invalid"
                        : ""
                        }`}
                />
                {form.touched.accountNo && form.errors.accountNo && (
                    <div className="invalid-feedback d-block">
                        <i className="fas fa-exclamation-circle me-1"></i>
                        {form.errors.accountNo}
                    </div>
                )}
            </FormGroup>
            <FormGroup>
                <Label for="TDSRate" className="fw-medium">
                    Rate of TDS (%) (Just write the no. Eg. in case of 10% TDS, mention 10 and not 0.1)
                </Label>
                <Input
                    type="text"
                    id="TDSRate"
                    name="TDSRate"
                    value={form.values.TDSRate}
                    onChange={(e) => normalizeTextInput(e)}
                    onBlur={form.handleBlur}
                    className={`form-control ${form.touched.TDSRate && form.errors.TDSRate
                        ? "is-invalid"
                        : ""
                        }`}
                />
                {form.touched.TDSRate && form.errors.TDSRate && (
                    <div className="invalid-feedback d-block">
                        <i className="fas fa-exclamation-circle me-1"></i>
                        {form.errors.TDSRate}
                    </div>
                )}
            </FormGroup>
            {renderPanFields("A")}
            <FormGroup>
                <Label className="fw-medium">
                    You need to upload at least one of the following <span className="text-danger">*</span>
                </Label>

                <div className="d-flex flex-wrap gap-3 mt-2">
                    <FormGroup check>
                        <Input
                            type="radio"
                            id="invoice-bill"
                            name="attachmentType"
                            value="INVOICE/BILL"
                            checked={form.values.attachmentType === "INVOICE/BILL"}
                            onChange={form.handleChange}
                            onBlur={form.handleBlur}
                        />
                        <Label for="invoice-bill" check>
                            Invoice/Bill
                        </Label>
                    </FormGroup>

                    <FormGroup check>
                        <Input
                            type="radio"
                            id="quotation"
                            name="attachmentType"
                            value="QUOTATION"
                            checked={form.values.attachmentType === "QUOTATION"}
                            onChange={form.handleChange}
                            onBlur={form.handleBlur}
                        />
                        <Label for="quotation" check>
                            Quotation
                        </Label>
                    </FormGroup>

                    <FormGroup check>
                        <Input
                            type="radio"
                            id="performa-invoice"
                            name="attachmentType"
                            value="PROFORMA_INVOICE"
                            checked={form.values.attachmentType === "PROFORMA_INVOICE"}
                            onChange={form.handleChange}
                            onBlur={form.handleBlur}
                        />
                        <Label for="performa-invoice" check>
                            Performa Invoice
                        </Label>
                    </FormGroup>

                    <FormGroup check>
                        <Input
                            type="radio"
                            id="voucher"
                            name="attachmentType"
                            value="VOUCHER"
                            checked={form.values.attachmentType === "VOUCHER"}
                            onChange={form.handleChange}
                            onBlur={form.handleBlur}
                        />
                        <Label for="voucher" check>
                            Voucher
                        </Label>
                    </FormGroup>
                </div>

                {form.touched.attachmentType && form.errors.attachmentType && (
                    <div className="invalid-feedback d-block">
                        <i className="fas fa-exclamation-circle me-1"></i>
                        {form.errors.attachmentType}
                    </div>
                )}
            </FormGroup>

            {paymentData?._id && existingFiles.length > 0 && (
                <FormGroup className="mb-3">
                    <Label className="fw-medium">
                        {ATTACHMENT_SECTION_LABELS[paymentData?.attachmentType] || "Existing Attachments"}
                    </Label>

                    <ul className="list-unstyled m-0 p-0">
                        {existingFiles.map((file, index) => (
                            <li key={index} className="d-flex justify-content-between align-items-center py-2 border-bottom">

                                <div className="d-flex align-items-center gap-2">
                                    <FileText size={18} className="text-primary" />
                                    <div>
                                        <strong className="me-2">{file.originalName || `Attachment ${index + 1}`}</strong>
                                        <Badge color="light" className="text-dark me-2">
                                            {ATTACHMENT_TYPE_LABELS[paymentData?.attachmentType] || paymentData?.attachmentType}
                                        </Badge>
                                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-primary text-decoration-underline">
                                            View File
                                        </a>
                                    </div>
                                </div>

                                <Button
                                    size="sm"
                                    color="danger"
                                    onClick={() => {
                                        setRemovedAttachments(prev => [...prev, file._id]);
                                        setExistingFiles(prev => prev.filter(f => f._id !== file._id));
                                    }}
                                >
                                    Remove
                                </Button>
                            </li>
                        ))}

                    </ul>
                </FormGroup>
            )}

            <FormGroup>
                <Label className="fw-medium">
                    Upload Attachment <span className="text-danger">*</span>
                </Label>
                <FileUpload
                    files={form.values.attachments || []}
                    setFiles={(files) => form.setFieldValue("attachments", files)}
                />
                {form.touched.attachments && form.errors.attachments && (
                    <div className="invalid-feedback d-block">
                        <i className="fas fa-exclamation-circle me-1"></i>
                        {form.errors.attachments}
                    </div>
                )}
            </FormGroup>
        </>
    );

    const renderPaidFields = () => (
        <>
            {renderCenterItemCategoryFields()}
            <FormGroup className="mb-4">
                <Label for="date" className="fw-medium text-muted">
                    Date of Entry <span className="text-danger">*</span>
                </Label>
                <Input
                    type="date"
                    id="date"
                    name="date"
                    value={form.values.date}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                    className={`form-control ${form.touched.date && form.errors.date
                        ? "is-invalid"
                        : ""
                        }`}
                />
                {form.touched.date && form.errors.date && (
                    <div className="invalid-feedback d-block">
                        <i className="fas fa-exclamation-circle me-1"></i>
                        {form.errors.date}
                    </div>
                )}
            </FormGroup>
            <FormGroup>
                <Label for="vendor" className="fw-medium">
                    Vendor <span className="text-danger">*</span>
                </Label>
                {isTypedVendor ? (
                    <Input
                        type="text"
                        id="vendor"
                        name="vendor"
                        value={form.values.vendor}
                        onChange={(e) => normalizeTextInput(e)}
                        onBlur={form.handleBlur}
                        className={`form-control ${form.touched.vendor && form.errors.vendor
                            ? "is-invalid"
                            : ""
                            }`}
                    />
                ) : (
                    <>
                        <AsyncSelect
                            inputId="vendor"
                            isClearable
                            cacheOptions
                            defaultOptions
                            loadOptions={(text) => searchVendors(text)}
                            placeholder="Select vendor"
                            noOptionsMessage={() => "No active vendor found."}
                            value={form.values.vendor ? { value: form.values.vendor, label: form.values.vendor } : null}
                            onChange={handleVendorSelect}
                            onBlur={() => form.setFieldTouched("vendor", true)}
                            classNamePrefix="react-select"
                            styles={form.touched.vendor && form.errors.vendor ? { control: (b) => ({ ...b, borderColor: "#dc3545" }) } : undefined}
                        />
                        <button
                            type="button"
                            className="btn btn-link btn-sm p-0 mt-1"
                            style={{ fontSize: "0.8rem", textDecoration: "none" }}
                            onClick={() => setVendorModalOpen(true)}
                        >
                            + Add new vendor <i className="bx bx-right-arrow-alt"></i>
                        </button>
                    </>
                )}
                {form.touched.vendor && form.errors.vendor && (
                    <div className="invalid-feedback d-block">
                        <i className="fas fa-exclamation-circle me-1"></i>
                        {form.errors.vendor}
                    </div>
                )}
            </FormGroup>
            <FormGroup>
                <Label for="invoiceNo" className="fw-medium">
                    Invoice No <span className="text-danger">*</span>
                </Label>
                <Input
                    type="text"
                    id="invoiceNo"
                    name="invoiceNo"
                    value={form.values.invoiceNo}
                    onChange={(e) => normalizeTextInput(e)}
                    onBlur={form.handleBlur}
                    className={`form-control ${form.touched.invoiceNo && form.errors.invoiceNo
                        ? "is-invalid"
                        : ""
                        }`}
                />
                {form.touched.invoiceNo && form.errors.invoiceNo && (
                    <div className="invalid-feedback d-block">
                        <i className="fas fa-exclamation-circle me-1"></i>
                        {form.errors.invoiceNo}
                    </div>
                )}
            </FormGroup>
            <FormGroup>
                <Label for="invoiceDate" className="fw-medium">
                    Invoice Date <span className="text-danger">*</span>
                </Label>
                <Input
                    type="date"
                    id="invoiceDate"
                    name="invoiceDate"
                    value={form.values.invoiceDate}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                    className={`form-control ${form.touched.invoiceDate && form.errors.invoiceDate
                        ? "is-invalid"
                        : ""
                        }`}
                />
                {form.touched.invoiceDate && form.errors.invoiceDate && (
                    <div className="invalid-feedback d-block">
                        <i className="fas fa-exclamation-circle me-1"></i>
                        {form.errors.invoiceDate}
                    </div>
                )}
            </FormGroup>
            <FormGroup>
                <Label for="grossAmount" className="fw-medium">
                    Gross Amount (Excl. GST) <span className="text-danger">*</span>
                </Label>
                <Input
                    type="text"
                    id="grossAmount"
                    name="grossAmount"
                    value={form.values.grossAmount}
                    onChange={handleGrossOrGstChange}
                    onBlur={form.handleBlur}
                    placeholder="0.00"
                    className={`form-control ${form.touched.grossAmount && form.errors.grossAmount
                        ? "is-invalid"
                        : ""
                        }`}
                />
                {form.touched.grossAmount && form.errors.grossAmount && (
                    <div className="invalid-feedback d-block">
                        <i className="fas fa-exclamation-circle me-1"></i>
                        {form.errors.grossAmount}
                    </div>
                )}
            </FormGroup>
            <FormGroup>
                <Label for="GSTAmount" className="fw-medium">
                    GST Amount <span className="text-danger">*</span>
                </Label>
                <Input
                    type="text"
                    id="GSTAmount"
                    name="GSTAmount"
                    value={form.values.GSTAmount}
                    onChange={handleGrossOrGstChange}
                    onBlur={form.handleBlur}
                    placeholder="0.00"
                    className={`form-control ${form.touched.GSTAmount && form.errors.GSTAmount
                        ? "is-invalid"
                        : ""
                        }`}
                />
                {form.touched.GSTAmount && form.errors.GSTAmount && (
                    <div className="invalid-feedback d-block">
                        <i className="fas fa-exclamation-circle me-1"></i>
                        {form.errors.GSTAmount}
                    </div>
                )}
            </FormGroup>
            <FormGroup>
                <Label for="totalAmountWithGST" className="fw-medium">
                    Total Amount Including GST
                </Label>
                <Input
                    type="text"
                    id="totalAmountWithGST"
                    name="totalAmountWithGST"
                    value={form.values.totalAmountWithGST}
                    readOnly
                    disabled
                    className="form-control"
                />
            </FormGroup>
            <FormGroup>
                <Label for="TDSRate" className="fw-medium">
                    TDS Deduction (%)
                </Label>
                <Input
                    type="text"
                    id="TDSRate"
                    name="TDSRate"
                    value={form.values.TDSRate}
                    onChange={(e) => normalizeTextInput(e)}
                    onBlur={form.handleBlur}
                    className={`form-control ${form.touched.TDSRate && form.errors.TDSRate
                        ? "is-invalid"
                        : ""
                        }`}
                />
                {form.touched.TDSRate && form.errors.TDSRate && (
                    <div className="invalid-feedback d-block">
                        <i className="fas fa-exclamation-circle me-1"></i>
                        {form.errors.TDSRate}
                    </div>
                )}
            </FormGroup>
            {renderPanFields("B")}
            <FormGroup>
                <Label for="transactionId" className="fw-medium">
                    Transaction ID <span className="text-danger">*</span>
                </Label>
                <Input
                    type="text"
                    id="transactionId"
                    name="transactionId"
                    value={form.values.transactionId}
                    onChange={(e) => normalizeTextInput(e)}
                    onBlur={form.handleBlur}
                    className={`form-control ${form.touched.transactionId && form.errors.transactionId
                        ? "is-invalid"
                        : ""
                        }`}
                />
                {form.touched.transactionId && form.errors.transactionId && (
                    <div className="invalid-feedback d-block">
                        <i className="fas fa-exclamation-circle me-1"></i>
                        {form.errors.transactionId}
                    </div>
                )}
            </FormGroup>
            <FormGroup>
                <Label for="transactionMethod" className="fw-medium">
                    Transaction Method <span className="text-danger">*</span>
                </Label>
                <Select
                    inputId="transactionMethod"
                    name="transactionMethod"
                    options={transactionMethodOptions}
                    value={
                        transactionMethodOptions.find(opt => opt.value === form.values.transactionMethod) || null
                    }
                    onChange={(option) => form.setFieldValue("transactionMethod", option?.value || "")}
                    onBlur={() => form.setFieldTouched("transactionMethod", true)}
                    placeholder="Select transaction method"
                    classNamePrefix="react-select"
                    className={
                        form.touched.transactionMethod && form.errors.transactionMethod
                            ? "react-select is-invalid"
                            : "react-select"
                    }
                />
                {form.touched.transactionMethod && form.errors.transactionMethod && (
                    <div className="invalid-feedback d-block">
                        {form.errors.transactionMethod}
                    </div>
                )}
            </FormGroup>
            <FormGroup>
                <Label for="paidFromBankAccount" className="fw-medium">
                    Bank Account (from which amount deducted) <span className="text-danger">*</span>
                </Label>
                <Select
                    inputId="paidFromBankAccount"
                    name="paidFromBankAccount"
                    options={bankAccountOptions}
                    value={
                        bankAccountOptions.find(opt => opt.value === form.values.paidFromBankAccount) || null
                    }
                    onChange={(option) => form.setFieldValue("paidFromBankAccount", option?.value || "")}
                    onBlur={() => form.setFieldTouched("paidFromBankAccount", true)}
                    placeholder="Select bank account"
                    classNamePrefix="react-select"
                    className={
                        form.touched.paidFromBankAccount && form.errors.paidFromBankAccount
                            ? "react-select is-invalid"
                            : "react-select"
                    }
                />
                {form.touched.paidFromBankAccount && form.errors.paidFromBankAccount && (
                    <div className="invalid-feedback d-block">
                        {form.errors.paidFromBankAccount}
                    </div>
                )}
            </FormGroup>

            {paymentData?._id && form.values.initialPaymentStatus === "COMPLETED" && existingFiles.length > 0 && (
                <FormGroup className="mb-3">
                    <Label className="fw-medium">
                        {ATTACHMENT_SECTION_LABELS[paymentData?.attachmentType] || "Existing Attachments"}
                    </Label>

                    <ul className="list-unstyled m-0 p-0">
                        {existingFiles.map((file, index) => (
                            <li key={index} className="d-flex justify-content-between align-items-center py-2 border-bottom">

                                <div className="d-flex align-items-center gap-2">
                                    <FileText size={18} className="text-primary" />
                                    <div>
                                        <strong className="me-2">{file.originalName || `Attachment ${index + 1}`}</strong>
                                        <Badge color="light" className="text-dark me-2">
                                            {ATTACHMENT_TYPE_LABELS[paymentData?.attachmentType] || paymentData?.attachmentType}
                                        </Badge>
                                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-primary text-decoration-underline">
                                            View File
                                        </a>
                                    </div>
                                </div>

                                <Button
                                    size="sm"
                                    color="danger"
                                    onClick={() => {
                                        setRemovedAttachments(prev => [...prev, file._id]);
                                        setExistingFiles(prev => prev.filter(f => f._id !== file._id));
                                    }}
                                >
                                    Remove
                                </Button>
                            </li>
                        ))}
                    </ul>
                </FormGroup>
            )}

            {paymentData?._id && form.values.initialPaymentStatus === "COMPLETED" && existingScreenshot && !removeExistingScreenshot && (
                <FormGroup className="mb-3">
                    <Label className="fw-medium">Existing Payment Screenshot</Label>

                    <ul className="list-unstyled m-0 p-0">
                        <li className="d-flex justify-content-between align-items-center py-2 border-bottom">
                            <div className="d-flex align-items-center gap-2">
                                <FileText size={18} className="text-primary" />
                                <div>
                                    <strong className="me-2">Payment Screenshot</strong>
                                    <Badge color="light" className="text-dark me-2">
                                        Payment Screenshot
                                    </Badge>
                                    <a href={existingScreenshot} target="_blank" rel="noopener noreferrer" className="text-primary text-decoration-underline">
                                        View File
                                    </a>
                                </div>
                            </div>

                            <Button
                                size="sm"
                                color="danger"
                                onClick={() => setRemoveExistingScreenshot(true)}
                            >
                                Remove
                            </Button>
                        </li>
                    </ul>
                </FormGroup>
            )}

            <FormGroup>
                <Label className="fw-medium">
                    Invoice Upload <span className="text-danger">*</span>
                </Label>
                <FileUpload
                    inputId="invoiceUploadInput"
                    files={form.values.attachments || []}
                    setFiles={(files) => form.setFieldValue("attachments", files)}
                />
                {form.touched.attachments && form.errors.attachments && (
                    <div className="invalid-feedback d-block">
                        <i className="fas fa-exclamation-circle me-1"></i>
                        {form.errors.attachments}
                    </div>
                )}
            </FormGroup>

            <FormGroup>
                <Label className="fw-medium">
                    Payment Screenshot Upload <span className="text-danger">*</span>
                </Label>
                <FileUpload
                    inputId="paymentScreenshotUploadInput"
                    files={form.values.paymentScreenshot || []}
                    setFiles={(files) => form.setFieldValue("paymentScreenshot", files)}
                    multiple={false}
                />
                {form.touched.paymentScreenshot && form.errors.paymentScreenshot && (
                    <div className="invalid-feedback d-block">
                        <i className="fas fa-exclamation-circle me-1"></i>
                        {form.errors.paymentScreenshot}
                    </div>
                )}
            </FormGroup>

            <FormGroup>
                <Label for="paymentMadeBy" className="fw-medium">
                    Payment Made By <span className="text-danger">*</span>
                </Label>
                <AsyncSelect
                    inputId="paymentMadeBy"
                    name="paymentMadeBy"
                    cacheOptions={false}
                    defaultOptions={false}
                    loadOptions={debouncedLoadPaymentMadeByEmployees}
                    value={paymentMadeByOption}
                    onChange={(option) => {
                        setPaymentMadeByOption(option);
                        form.setFieldValue("paymentMadeBy", option?.employeeName || "");
                    }}
                    onBlur={() => form.setFieldTouched("paymentMadeBy", true)}
                    placeholder="Search employee by name"
                    classNamePrefix="react-select"
                    className={
                        form.touched.paymentMadeBy && form.errors.paymentMadeBy
                            ? "react-select is-invalid"
                            : "react-select"
                    }
                    noOptionsMessage={({ inputValue }) =>
                        inputValue
                            ? "No employee found"
                            : "Start typing to search employee"
                    }
                />
                {form.touched.paymentMadeBy && form.errors.paymentMadeBy && (
                    <div className="invalid-feedback d-block">
                        <i className="fas fa-exclamation-circle me-1"></i>
                        {form.errors.paymentMadeBy}
                    </div>
                )}
            </FormGroup>
        </>
    );

    return (
        <Form onSubmit={handleSubmit}>
            <FormGroup className="mb-4">
                <Label className="fw-medium d-block mb-2">
                    Payment Status <span className="text-danger">*</span>
                </Label>
                <ButtonGroup>
                    <Button
                        type="button"
                        color={form.values.initialPaymentStatus === "COMPLETED" ? "success" : "secondary"}
                        outline={form.values.initialPaymentStatus !== "COMPLETED"}
                        onClick={() => handlePaymentModeChange("COMPLETED")}
                    >
                        Paid
                    </Button>
                    <Button
                        type="button"
                        color={form.values.initialPaymentStatus === "PENDING" ? "warning" : "secondary"}
                        outline={form.values.initialPaymentStatus !== "PENDING"}
                        onClick={() => handlePaymentModeChange("PENDING")}
                    >
                        To Be Paid
                    </Button>
                </ButtonGroup>
                {form.touched.initialPaymentStatus && form.errors.initialPaymentStatus && (
                    <div className="invalid-feedback d-block">
                        <i className="fas fa-exclamation-circle me-1"></i>
                        {form.errors.initialPaymentStatus}
                    </div>
                )}
            </FormGroup>

            <AnimatePresence mode="wait">
                {form.values.initialPaymentStatus === "PENDING" && (
                    <motion.div
                        key="to-be-paid"
                        initial={fieldTransition.initial}
                        animate={fieldTransition.animate}
                        exit={fieldTransition.exit}
                        transition={fieldTransition.transition}
                    >
                        {renderToBePaidFields()}
                    </motion.div>
                )}
                {form.values.initialPaymentStatus === "COMPLETED" && (
                    <motion.div
                        key="paid"
                        initial={fieldTransition.initial}
                        animate={fieldTransition.animate}
                        exit={fieldTransition.exit}
                        transition={fieldTransition.transition}
                    >
                        {renderPaidFields()}
                    </motion.div>
                )}
            </AnimatePresence>

            {form.values.initialPaymentStatus && (
                <Button
                    color="primary"
                    type="submit"
                    className="w-100 text-white"
                    disabled={form.isSubmitting || !form.isValid || (!paymentData?._id && !form.dirty)}
                >
                    {form.isSubmitting ? (
                        <Spinner size="sm" className="me-2" />
                    ) : (
                        <>
                            <Share size={16} className="me-2" />
                            Submit for Approval
                        </>
                    )}
                </Button>
            )}

            <Modal isOpen={vendorModalOpen} toggle={() => { if (!vendorModalSubmitting) { setVendorModalOpen(false); setVendorModalFields(emptyVendorModal); setVendorModalTouched({}); setVendorModalErrors({}); } }} size="md">
                <ModalHeader toggle={() => { if (!vendorModalSubmitting) { setVendorModalOpen(false); setVendorModalFields(emptyVendorModal); setVendorModalTouched({}); setVendorModalErrors({}); } }}>
                    Request New Vendor
                </ModalHeader>
                <ModalBody>
                    {vendorModalErrors._form && (
                        <div className="alert alert-danger py-2 mb-3" role="alert">
                            {vendorModalErrors._form}
                        </div>
                    )}
                    <FormGroup>
                        <Label className="fw-medium">Vendor Name <span className="text-danger">*</span></Label>
                        <Input
                            value={vendorModalFields.tradeName}
                            onChange={(e) => handleVendorModalChange("tradeName", e.target.value)}
                            onBlur={() => setVendorModalTouched((p) => ({ ...p, tradeName: true }))}
                            invalid={vendorModalTouched.tradeName && !!vendorModalErrors.tradeName}
                        />
                        {vendorModalTouched.tradeName && vendorModalErrors.tradeName && (
                            <div className="invalid-feedback d-block">{vendorModalErrors.tradeName}</div>
                        )}
                    </FormGroup>
                    <FormGroup>
                        <Label className="fw-medium">Bank IFSC Code <span className="text-danger">*</span></Label>
                        <Input
                            value={vendorModalFields.ifsc}
                            onChange={(e) => handleVendorModalChange("ifsc", e.target.value.toUpperCase().replace(/\s/g, ""))}
                            onBlur={() => setVendorModalTouched((p) => ({ ...p, ifsc: true }))}
                            invalid={vendorModalTouched.ifsc && !!vendorModalErrors.ifsc}
                            placeholder="e.g. SBIN0001234"
                        />
                        {vendorModalTouched.ifsc && vendorModalErrors.ifsc && (
                            <div className="invalid-feedback d-block">{vendorModalErrors.ifsc}</div>
                        )}
                    </FormGroup>
                    <FormGroup>
                        <Label className="fw-medium">Account Holder Name <span className="text-danger">*</span></Label>
                        <Input
                            value={vendorModalFields.accountHolderName}
                            onChange={(e) => handleVendorModalChange("accountHolderName", e.target.value)}
                            onBlur={() => setVendorModalTouched((p) => ({ ...p, accountHolderName: true }))}
                            invalid={vendorModalTouched.accountHolderName && !!vendorModalErrors.accountHolderName}
                        />
                        {vendorModalTouched.accountHolderName && vendorModalErrors.accountHolderName && (
                            <div className="invalid-feedback d-block">{vendorModalErrors.accountHolderName}</div>
                        )}
                    </FormGroup>
                    <FormGroup>
                        <Label className="fw-medium">Account No. <span className="text-danger">*</span></Label>
                        <Input
                            value={vendorModalFields.accountNo}
                            onChange={(e) => handleVendorModalChange("accountNo", e.target.value.replace(/\s/g, ""))}
                            onBlur={() => setVendorModalTouched((p) => ({ ...p, accountNo: true }))}
                            invalid={vendorModalTouched.accountNo && !!vendorModalErrors.accountNo}
                        />
                        {vendorModalTouched.accountNo && vendorModalErrors.accountNo && (
                            <div className="invalid-feedback d-block">{vendorModalErrors.accountNo}</div>
                        )}
                    </FormGroup>
                    <FormGroup>
                        <Label className="fw-medium">PAN Card No. <span className="text-danger">*</span></Label>
                        <Input
                            value={vendorModalFields.pan}
                            onChange={(e) => handleVendorModalChange("pan", e.target.value.toUpperCase().replace(/\s/g, ""))}
                            onBlur={() => setVendorModalTouched((p) => ({ ...p, pan: true }))}
                            invalid={vendorModalTouched.pan && !!vendorModalErrors.pan}
                            placeholder="e.g. ABCDE1234F"
                            maxLength={10}
                        />
                        {vendorModalTouched.pan && vendorModalErrors.pan && (
                            <div className="invalid-feedback d-block">{vendorModalErrors.pan}</div>
                        )}
                    </FormGroup>
                    <FormGroup>
                        <Label className="fw-medium">PAN Card Upload <span className="text-muted fs-12">(optional)</span></Label>
                        <div
                            className="border rounded p-3 text-center"
                            style={{ cursor: "pointer", background: vendorModalFields.panCardFile ? "#f0fdf4" : "#f8fafc", borderColor: vendorModalTouched.panCardFile && vendorModalErrors.panCardFile ? "#dc3545" : vendorModalFields.panCardFile ? "#16a34a" : "#cbd5e1" }}
                            onClick={() => panCardInputRef.current && panCardInputRef.current.click()}
                        >
                            <input
                                ref={panCardInputRef}
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                style={{ display: "none" }}
                                onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    handleVendorModalChange("panCardFile", file);
                                    setVendorModalTouched((p) => ({ ...p, panCardFile: true }));
                                    e.target.value = "";
                                }}
                            />
                            {vendorModalFields.panCardFile ? (
                                <div className="d-flex align-items-center justify-content-center gap-2">
                                    <i className="bx bx-check-circle text-success" style={{ fontSize: 18 }}></i>
                                    <span className="small text-success fw-medium">{vendorModalFields.panCardFile.name}</span>
                                    <button type="button" className="btn btn-sm btn-link text-danger p-0 ms-1" onClick={(e) => { e.stopPropagation(); handleVendorModalChange("panCardFile", null); }}>Remove</button>
                                </div>
                            ) : (
                                <div>
                                    <i className="bx bx-cloud-upload d-block mb-1" style={{ fontSize: 20 }}></i>
                                    <span className="small text-muted">Click to upload — PDF, JPG, PNG, max 10 MB</span>
                                </div>
                            )}
                        </div>
                    </FormGroup>
                </ModalBody>
                <ModalFooter>
                    <Button color="light" onClick={() => { if (!vendorModalSubmitting) { setVendorModalOpen(false); setVendorModalFields(emptyVendorModal); setVendorModalTouched({}); setVendorModalErrors({}); } }} disabled={vendorModalSubmitting}>
                        Cancel
                    </Button>
                    <Button color="primary" onClick={handleVendorModalSubmit} disabled={vendorModalSubmitting}>
                        {vendorModalSubmitting ? <><Spinner size="sm" className="me-1" /> Submitting…</> : "Submit Request"}
                    </Button>
                </ModalFooter>
            </Modal>
        </Form>
    )
}

const mapStateToProps = (state) => ({
    centers: state.Center.data,
    centerAccess: state.User?.centerAccess,
});

export default connect(mapStateToProps)(SpendingForm);
