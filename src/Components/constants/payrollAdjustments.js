export const adjustmentEarningOptions = [
    { value: "ARREAR", label: "Arrear" },
    { value: "REIMBURSEMENT", label: "Reimbursement" },
    { value: "VARIABLE_PAY", label: "Variable Pay" },
    { value: "OTHER_EARNINGS", label: "Other Earnings" },
    { value: "EL_ENCASHMENT", label: "EL Encashment" },
];

export const adjustmentDeductionOptions = [
    { value: "PT_ARREAR", label: "PT Arrear" },
    { value: "PF_ARREAR", label: "PF Arrear" },
    { value: "VOLUNTARY_PF", label: "Voluntary PF" },
    { value: "OTHER_DEDUCTION", label: "Other Deduction" },
    { value: "BONUS_ADJUSTMENT", label: "Bonus Adjustment" },
];

export const adjustmentTypeGroups = [
    { label: "Earnings", options: adjustmentEarningOptions },
    { label: "Deductions", options: adjustmentDeductionOptions },
];

export const adjustmentTypeOptions = [
    ...adjustmentEarningOptions,
    ...adjustmentDeductionOptions,
];

export const adjustmentTypeLabels = Object.fromEntries(
    adjustmentTypeOptions.map((option) => [option.value, option.label])
);
