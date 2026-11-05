import Highlighter from "react-highlight-words";
import { format } from "date-fns";
import { Button } from "reactstrap";
import { Check, CheckCheck, Copy, Pencil, X } from "lucide-react";
import { capitalizeWords } from "../../../../../utils/toCapitalize";
import { formatEmployeeName } from "../../../../../utils/formatEmployeeName";
import { formatCurrency } from "../../../../../utils/formatCurrency";
import { ExpandableText } from "../../../../../Components/Common/ExpandableText";
import { renderStatusBadge } from "../../../../../Components/Common/renderStatusBadge";

const baseStyle = {
    color: "#000",
    fontWeight: 600,
}

const fixedCellStyle = {
    ...baseStyle,
    backgroundColor: "#ffc000",
};

const earnedCellStyle = {
    backgroundColor: "#f8cbad",
    color: "#000",
    fontWeight: 600,
};



const employeeDeductionStyle = {
    ...baseStyle,
    backgroundColor: "#8EA9DB",
};

const employerDeductionStyle = {
    ...baseStyle,
    backgroundColor: "#7B8FD1",
};


const isSimplifiedEmployee = (row) =>
    (row?.employee?.employmentType || "").trim().toUpperCase() !== "FULL_TIME" ||
    row?.salarySnapshot?.isSimplified === true;


export const salaryColumns = ({ searchText, copyId, onCopy, onOpen, onApprove, onReject, hasEditPermission, approvalStatusFilter, hasManuallyProcessedForMonth }) => [
    {
        name: <div>ECode</div>,
        selector: row => row?.employee?.eCode || "-",
        cell: row => (
            <Highlighter
                highlightClassName="react-highlight"
                searchWords={[searchText]}
                autoEscape
                textToHighlight={`${row?.employee?.eCode || ""}`}
            />
        ),
        wrap: true,
    },
    {
        name: <div>Name</div>,
        selector: row =>
            formatEmployeeName(row?.employee?.name, row?.employee?.salutation)?.toUpperCase() || "-",
        cell: row => (
            <Highlighter
                highlightClassName="react-highlight"
                searchWords={[searchText]}
                autoEscape
                textToHighlight={`${formatEmployeeName(row?.employee?.name, row?.employee?.salutation)?.toUpperCase() || ""}`}
            />
        ),
        wrap: true,
        minWidth: "160px",
    },
    {
        name: <div>Current Location</div>,
        selector: row => capitalizeWords(row?.center?.title || "-"),
        wrap: true,
        minWidth: "120px",
    },
    {
        name: <div>Cost Center</div>,
        selector: row => capitalizeWords(row?.costCenter?.title || "-"),
        wrap: true,
        minWidth: "120px",
    },
    {
        name: <div>Gender</div>,
        selector: row => capitalizeWords(row?.employee?.gender || "-"),
        wrap: true,
    },
    {
        name: <div>Designation</div>,
        selector: row => capitalizeWords(row?.employee?.designation?.name?.replace(/_/g, " ") || "-"),
        wrap: true,
        minWidth: "150px"
    },
    {
        name: <div>Account</div>,
        selector: row => capitalizeWords(row?.salarySnapshot?.account?.replace(/_/g, " ") || "-"),
        wrap: true,
    },
    {
        name: <div>Employee Groups</div>,
        selector: row => capitalizeWords(row?.salarySnapshot?.employeeGroups?.replace(/_/g, " ") || "-"),
        wrap: true,
    },
    {
        name: <div>Total Days</div>,
        selector: row => row?.attendance?.totalDays || 0,
        wrap: true,
        center: true
    },
    {
        name: <div>Payable Days</div>,
        selector: row => row?.attendance?.payableDays || 0,
        wrap: true,
        center: true
    },
    {
        name: <div>LOP Days</div>,
        selector: row => row?.attendance?.lopDays || 0,
        wrap: true,
        center: true
    },
    {
        name: <div>Approved Leaves</div>,
        selector: row => row?.attendance?.approvedLeaves || 0,
        wrap: true,
        center: true,
        minWidth: "110px"
    },
    {
        name: <div>Auto Deducted Leaves</div>,
        selector: row => row?.attendance?.autoDeductedLeaves || 0,
        wrap: true,
        center: true,
        minWidth: "110px"
    },
    {
        name: <div>Working Days Attended</div>,
        selector: row => row?.attendance?.workingDaysAttended || 0,
        wrap: true,
        center: true,
        minWidth: "110px"
    },
    // {
    //     name: <div>Short Wages</div>,
    //     selector: row => formatCurrency(row?.salarySnapshot?.shortWages),
    //     wrap: true,
    //     center: true
    // },
    // {
    //     name: <div>Minimum Wages</div>,
    //     selector: row => formatCurrency(row?.salarySnapshot?.minimumWages),
    //     wrap: true,
    //     center: true
    // },
    // {
    //     name: <div>HRA%</div>,
    //     selector: row => `${row?.salarySnapshot?.HRAPercentage}%` || `0%`,
    //     wrap: true,
    //     center: true
    // },
    // {
    //     name: <div>Basic%</div>,
    //     selector: row => `${row?.salarySnapshot?.basicPercentage}%` || `0%`,
    //     wrap: true,
    //     center: true
    // },
    {
        name: <div>Total cost of the company</div>,
        selector: (row) => formatCurrency(row?.salarySnapshot?.totalCostToCompany),
        wrap: true,
        center: true,
        style: fixedCellStyle,
    },
    {
        name: <div>Basic Salary</div>,
        selector: row => formatCurrency(row?.salarySnapshot?.basicAmount),
        wrap: true,
        center: true,
        style: fixedCellStyle,
    },
    {
        name: <div>HRA</div>,
        selector: row => formatCurrency(row?.salarySnapshot?.HRAAmount),
        wrap: true,
        center: true,
        style: fixedCellStyle,
    },
    {
        name: <div>SPL Allowance</div>,
        selector: row => formatCurrency(row?.salarySnapshot?.SPLAllowance),
        wrap: true,
        center: true,
        style: fixedCellStyle,
    },
    {
        name: <div>Conveyance Allowance</div>,
        selector: row => formatCurrency(row?.salarySnapshot?.conveyanceAllowance),
        wrap: true,
        center: true,
        style: fixedCellStyle,
    },
    {
        name: <div>Statutory Bonus</div>,
        selector: row => formatCurrency(row?.salarySnapshot?.statutoryBonus),
        wrap: true,
        center: true,
        style: fixedCellStyle,
    },
    {
        name: <div>Gross Salary</div>,
        selector: row => formatCurrency(
            isSimplifiedEmployee(row)
                ? row?.salarySnapshot?.totalCostToCompany
                : row?.salarySnapshot?.grossSalary
        ),
        wrap: true,
        center: true,
        style: fixedCellStyle,
    },

    {
        name: <div>Total Cost To Company</div>,
        selector: row => formatCurrency(row?.earned?.totalCostToCompany),
        wrap: true,
        center: true,
        style: earnedCellStyle,
    },
    {
        name: <div>Basic Salary</div>,
        selector: row => formatCurrency(row?.earned?.basicAmount),
        wrap: true,
        center: true,
        style: earnedCellStyle,
    },
    {
        name: <div>HRA</div>,
        selector: row => formatCurrency(row?.earned?.HRAAmount),
        wrap: true,
        center: true,
        style: earnedCellStyle,
    },
    {
        name: <div>SPL Allowance</div>,
        selector: row => formatCurrency(row?.earned?.SPLAllowance),
        wrap: true,
        center: true,
        style: earnedCellStyle,
    },
    {
        name: <div>Conveyance Allowance</div>,
        selector: row => formatCurrency(row?.earned?.conveyanceAllowance),
        wrap: true,
        center: true,
        style: earnedCellStyle,
    },
    {
        name: <div>Statutory Bonus</div>,
        selector: row => formatCurrency(row?.earned?.statutoryBonus),
        wrap: true,
        center: true,
        style: earnedCellStyle,
    },
    {
        name: <div>Consultant Fee</div>,
        selector: row => formatCurrency(row?.earned?.consultantFee),
        wrap: true,
        center: true,
        style: earnedCellStyle,
    },
    {
        name: <div>Base Compensation</div>,
        selector: row =>
            row?.earned?.baseCompensation != null
                ? formatCurrency(row.earned.baseCompensation)
                : "-",
        wrap: true,
        center: true,
        minWidth: "150px",
        style: earnedCellStyle,
    },
    {
        name: <div>Incentive</div>,
        selector: row => formatCurrency(row?.earned?.incentives),
        wrap: true,
        center: true,
        style: earnedCellStyle,
    },
    {
        name: <div>Arrear</div>,
        selector: row => formatCurrency(row?.earned?.adjustments?.ARREAR),
        wrap: true,
        center: true,
        style: earnedCellStyle,
    },
    {
        name: <div>Reimbursement</div>,
        selector: row => formatCurrency(row?.earned?.adjustments?.REIMBURSEMENT),
        wrap: true,
        center: true,
        minWidth: "140px",
        style: earnedCellStyle,
    },
    {
        name: <div>Variable Pay (Adj.)</div>,
        selector: row => formatCurrency(row?.earned?.adjustments?.VARIABLE_PAY),
        wrap: true,
        center: true,
        style: earnedCellStyle,
    },
    {
        name: <div>Other Earnings</div>,
        selector: row => formatCurrency(row?.earned?.adjustments?.OTHER_EARNINGS),
        wrap: true,
        center: true,
        style: earnedCellStyle,
    },
    {
        name: <div>EL Encashment</div>,
        selector: row => formatCurrency(row?.earned?.adjustments?.EL_ENCASHMENT),
        wrap: true,
        center: true,
        style: earnedCellStyle,
    },
    {
        name: <div>Gross Salary</div>,
        selector: row => formatCurrency(
            isSimplifiedEmployee(row)
                ? row?.earned?.totalCostToCompany
                : row?.earned?.grossSalary
        ),
        wrap: true,
        center: true,
        style: employerDeductionStyle,
    },
    // {
    //     name: <div>PF Salary</div>,
    //     selector: row => formatCurrency(row?.earned?.PFSalary),
    //     wrap: true,
    //     center: true,
    //     style: PFAndESICSalaryCellStyle,
    // },
    // {
    //     name: <div>ESIC Salary</div>,
    //     selector: row => formatCurrency(row?.earned?.ESICSalary),
    //     wrap: true,
    //     center: true,
    //     style: PFAndESICSalaryCellStyle,
    // },
    {
        name: <div>PF Employee</div>,
        selector: row => formatCurrency(row?.earned?.PFEmployee),
        wrap: true,
        center: true,
        style: employeeDeductionStyle,
    },
    {
        name: <div>Voluntary PF</div>,
        selector: row => formatCurrency((row?.earned?.voluntaryPF || 0) + (row?.earned?.adjustments?.VOLUNTARY_PF || 0)),
        wrap: true,
        center: true,
        style: employeeDeductionStyle,
    },
    {
        name: <div>ESIC Employee</div>,
        selector: row => formatCurrency(row?.earned?.ESICEmployee),
        wrap: true,
        center: true,
        style: employeeDeductionStyle,
    },
    {
        name: <div>LWF Employee</div>,
        selector: row => formatCurrency(row?.earned?.LWFEmployee),
        wrap: true,
        center: true,
        style: employeeDeductionStyle,
    },
    {
        name: <div>PT</div>,
        selector: row => formatCurrency(row?.earned?.PT),
        wrap: true,
        center: true,
        style: employeeDeductionStyle,
    },
    {
        name: <div>PT Arrear</div>,
        selector: row => formatCurrency((row?.earned?.PTArrears || 0) + (row?.earned?.adjustments?.PT_ARREAR || 0)),
        wrap: true,
        center: true,
        style: employeeDeductionStyle,
    },
    {
        name: <div>PF Arrear</div>,
        selector: row => formatCurrency(row?.earned?.pfArrear),
        wrap: true,
        center: true,
        style: employeeDeductionStyle,
    },
    {
        name: <div>TDS</div>,
        selector: row => formatCurrency(row?.earned?.TDSAmount),
        wrap: true,
        center: true,
        style: employeeDeductionStyle,
    },
    {
        name: <div>Salary Advance</div>,
        selector: row => formatCurrency(row?.earned?.advanceSalary),
        wrap: true,
        center: true,
        style: employeeDeductionStyle,
    },
    {
        name: <div>Insurance</div>,
        selector: row => formatCurrency(row?.earned?.insurance),
        wrap: true,
        center: true,
        style: employeeDeductionStyle,
    },
    {
        name: <div>Other Deductions</div>,
        selector: row => formatCurrency((row?.earned?.otherDeductions || 0) + (row?.earned?.adjustments?.OTHER_DEDUCTION || 0)),
        wrap: true,
        center: true,
        style: employeeDeductionStyle,
    },
    {
        name: <div>Deductions</div>,
        selector: row => formatCurrency(row?.earned?.deductions),
        wrap: true,
        center: true,
        style: employeeDeductionStyle,
    },
    {
        name: <div>PF Employer</div>,
        selector: (row) => formatCurrency(row?.earned?.PFEmployer),
        wrap: true,
        center: true,
        style: employerDeductionStyle
    },
    {
        name: <div>Gratuity</div>,
        selector: (row) => formatCurrency(row?.earned?.gratuity),
        wrap: true,
        center: true,
        style: employerDeductionStyle
    },
    {
        name: <div>ESIC Employer</div>,
        selector: (row) => formatCurrency(row?.earned?.ESICEmployer),
        wrap: true,
        center: true,
        style: employerDeductionStyle
    },
    {
        name: <div>LWF Employer</div>,
        selector: (row) => formatCurrency(row?.earned?.LWFEmployer),
        wrap: true,
        center: true,
        style: employerDeductionStyle
    },
    {
        name: <div>Total Net Pay</div>,
        selector: row => formatCurrency(row?.earned?.inHandSalary),
        wrap: true,
        center: true,
    },
    {
        name: <div>Remarks</div>,
        selector: row => capitalizeWords(row?.remarks || "-"),
        wrap: true,
        center: true,
    },
    {
        name: <div>Amount On Hold</div>,
        selector: row => formatCurrency(row?.amountOnHold),
        wrap: true,
        center: true,
    },
    {
        name: <div>Amount To Be Paid In Cash</div>,
        selector: row => formatCurrency(row?.cashAmount),
        wrap: true,
        center: true,
    },
    {
        name: <div>Transaction Amount</div>,
        selector: row => formatCurrency(row?.transactionAmount),
        wrap: true,
        center: true,
    },
    {
        name: <div>Transaction Type</div>,
        selector: row => row?.transactionType || "-",
        wrap: true,
        center: true,
    },
    {
        name: <div>Benificiary Code</div>,
        selector: row => row?.benificiaryCode || "-",
        wrap: true,
        center: true,
    },
    {
        name: <div>Benificiary Account Number</div>,
        selector: row => row?.bankDetails?.accountNo || "-",
        wrap: true,
    },
    {
        name: <div>Benificiary Name</div>,
        selector: row => row?.bankDetails?.accountName?.toUpperCase() || "-",
        wrap: true,
    },
    {
        name: <div>Debit Statement Narration</div>,
        selector: row => row?.salarySnapshot?.debitStatementNarration?.toUpperCase() || "-",
        wrap: true,
    },
    {
        name: <div>Transaction Date</div>,
        selector: row => {
            if (!row?.transactionDate) return "-";
            const date = new Date(row.transactionDate);
            if (isNaN(date)) return "-";
            return format(new Date(row.transactionDate), "dd-MM-yyyy")
        },
        wrap: true,
    },
    {
        name: <div>IFSC Code</div>,
        selector: row => row?.bankDetails?.IFSCCode?.toUpperCase() || "-",
        wrap: true,
    },
    {
        name: <div>E-Net Link</div>,
        selector: (row) => (
            <div className="d-flex align-items-center gap-1">
                <span className="flex-grow-1">
                    {row.eNet ? <ExpandableText text={row.eNet} limit={12} /> : "-"}
                </span>
                {row.eNet && (
                    <Button
                        color="link"
                        size="sm"
                        onClick={() => onCopy(row.eNet, row._id)}
                        className="p-0 text-muted"
                        title="Copy to clipboard"
                    >
                        {copyId === row._id ? (
                            <Check size={14} className="text-success" />
                        ) : (
                            <Copy size={14} />
                        )}
                    </Button>
                )}
            </div>
        ),
        wrap: true,
        minWidth: "200px",
        maxWidth: "400px",
    },
    {
        name: <div>Status</div>,
        selector: row => renderStatusBadge(row?.approvalStatus || "-"),
        wrap: true,
    },
    ...((approvalStatusFilter === "ALL" || approvalStatusFilter === "PENDING") && hasEditPermission ? [
        {
            name: <div>Action</div>,
            cell: row => (
                <div className="d-flex gap-1 align-items-center">
                    {row.approvalStatus !== "PENDING" || hasManuallyProcessedForMonth ? (
                        <i className="text-muted" style={{ fontSize: "12px" }}>Action not permitted</i>
                    ) : (
                        <>
                            <button
                                className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                                onClick={() => {
                                    onOpen(row);
                                }}
                                title="Edit Remarks"
                            >
                                <Pencil size={16} />
                            </button>
                            <Button
                                color="success"
                                className="text-white"
                                size="sm"
                                onClick={() => {
                                    onApprove(row);
                                }}
                                title="Approve"
                            >
                                <CheckCheck size={16} />
                            </Button>
                            <Button
                                color="danger"
                                className="text-white"
                                size="sm"
                                onClick={() => {
                                    onReject(row);
                                }}
                                title="Reject"
                            >
                                <X size={16} />
                            </Button>
                        </>
                    )}
                </div>
            ),
            ignoreRowClick: true,
            allowOverflow: true,
            button: true,
            minWidth: "180px"
        },
    ] : []),
    ...((approvalStatusFilter === "ALL" || approvalStatusFilter === "APPROVED" || approvalStatusFilter === "REJECTED" || approvalStatusFilter === "MANNUALLY_PROCESSED") ? [
        {
            name: <div>Approved By</div>,
            selector: (row) => (
                <div>
                    <div>{capitalizeWords(row?.approvedBy?.name || "-")}</div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                        {row?.approvedBy?.email || "-"}
                    </div>
                </div>
            ),
            wrap: true,
            minWidth: "200px",
        },
        {
            name: <div>Approved At</div>,
            selector: (row) => {
                const approvedAt = row?.approvedAt;
                if (!approvedAt || isNaN(new Date(approvedAt))) {
                    return "-";
                }
                return format(new Date(approvedAt), "dd MMM yyyy, hh:mm a");
            },
            sortable: true,
            wrap: true,
            minWidth: "180px",
        },
        {
            name: <div>Note</div>,
            selector: row => <ExpandableText text={row?.approvalNote || "-"} />,
            wrap: true,
            minWidth: "200px"
        }
    ] : [])
];