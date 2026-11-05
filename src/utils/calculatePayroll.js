import { detectState } from "./detectState";



// ---- LWF (Labour Welfare Fund) — state-wise statutory rules ----
//
// LWF is NOT a uniform monthly deduction. Most states charge a fixed rupee
// amount only in one or two specific months; Haryana charges a percentage of
// monthly wages (capped) every month. So the ANNUAL figure is the sum of the
// amounts actually charged in the applicable months — never a monthly amount × 12.

// Fixed-amount states: a flat rupee amount charged in each applicable month.
// `months` are 1-based calendar months (6 = June, 12 = December).
const FIXED_LWF = {
    // old rule till 08.07.2026
    // Maharashtra: { employee: 12, employer: 36, months: [6, 12] },
    Maharashtra: { employee: 25, employer: 75, months: [6, 12] },
    Karnataka: { employee: 20, employer: 40, months: [12] },
    Gujarat: { employee: 6, employer: 12, months: [6, 12] },
    "Tamil Nadu": { employee: 10, employer: 20, months: [6, 12] },
};

// Haryana: a percentage of monthly wages (Basic + HRA + Conveyance + SPL +
// Statutory Bonus, i.e. gross), capped, charged every month.
const HARYANA_LWF = {
    employeeRate: 0.002,
    employeeCap: 35,
    employerRate: 0.004,
    employerCap: 70,
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
};

const MONTH_LABELS = {
    1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun",
    7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec",
};

export const resolveLWFState = (currentLocation, payrollStateOverride) => {
    if (payrollStateOverride) return payrollStateOverride;
    if (!currentLocation || typeof currentLocation !== "object") return "";
    if (currentLocation.title === "Head-Office") return "Maharashtra";
    return detectState(currentLocation.address) || "";
};


export const lwfMonths = (state = "") => {
    const s = (state || "").trim();
    if (s === "Haryana") return HARYANA_LWF.months;
    return FIXED_LWF[s]?.months || [];
};


export const lwfPerMonth = (state = "", monthlyBase = 0) => {
    const s = (state || "").trim();
    if (s === "Haryana") {
        const base = Number(monthlyBase) || 0;
        return {
            employee: Math.min(Math.round(base * HARYANA_LWF.employeeRate), HARYANA_LWF.employeeCap),
            employer: Math.min(Math.round(base * HARYANA_LWF.employerRate), HARYANA_LWF.employerCap),
        };
    }
    const fixed = FIXED_LWF[s];
    if (fixed) return { employee: fixed.employee, employer: fixed.employer };
    return { employee: 0, employer: 0 };
};


export const lwfForMonth = (state = "", monthlyBase = 0, month) => {
    if (!lwfMonths(state).includes(Number(month))) return { employee: 0, employer: 0 };
    return lwfPerMonth(state, monthlyBase);
};


export const lwfAnnual = (state = "", monthlyBase = 0) => {
    const per = lwfPerMonth(state, monthlyBase);
    const count = lwfMonths(state).length;
    return { employee: per.employee * count, employer: per.employer * count };
};

export const applyAnnualLWF = (annual, lwfMonthly, lwfYearly) => {
    if (!annual) return;
    const adjEmployee = lwfYearly.employee - lwfMonthly.employee * 12;
    const adjEmployer = lwfYearly.employer - lwfMonthly.employer * 12;
    annual.LWFEmployee = lwfYearly.employee;
    annual.LWFEmployer = lwfYearly.employer;
    annual.deductions = Math.round((annual.deductions || 0) + adjEmployee);
    annual.inHandSalary = Math.round((annual.inHandSalary || 0) - adjEmployee);
    annual.totalCostToCompany = Math.round((annual.totalCostToCompany || 0) + adjEmployer);
};


export const lwfSalaryBase = (state = "", monthlyBase = 0) =>
    (state || "").trim() === "Haryana" ? Number(monthlyBase) || 0 : 0;


export const lwfScheduleText = (state = "") => {
    const months = lwfMonths(state);
    if (months.length === 0) return "";
    if (months.length === 12) return "every month";
    return months.map((m) => MONTH_LABELS[m]).join(" & ");
};

function calculatePT(grossSalary, state, gender) {
    switch (state.trim()) {
        case "Gujarat":
            return grossSalary > 12000 ? 200 : 0;

        case "Haryana":
            return 0;

        case "Karnataka":
            return grossSalary >= 25000 ? 200 : 0;

        case "Maharashtra":
            if (gender === "FEMALE" && grossSalary <= 24999) return 0;
            if (grossSalary <= 7500) return 0;
            if (grossSalary <= 10000) return 175;
            return 200;

        case "Tamil Nadu":
            if (grossSalary <= 21000) return 0;
            if (grossSalary <= 30000) return 180;
            if (grossSalary <= 45000) return 425;
            if (grossSalary <= 60000) return 930;
            if (grossSalary <= 75000) return 1025;
            return 1250;

        case "Telangana":
            if (grossSalary <= 15000) return 0;
            if (grossSalary <= 20000) return 150;
            return 200;

        case "Uttar Pradesh":
            return 0;

        default:
            return 0;
    }
}

export const calculatePayroll = (values) => {
    const PF_WAGE_CAP = 25000;

    const gross = Number(values.grossSalary || 0);
    const basic = Number(values.basicAmount || 0);
    const hra = Number(values.HRAAmount || 0);
    const spl = Number(values.SPLAllowance || 0);
    const ESICSalary = basic + spl;
    const minimumWages = Number(values.minimumWages || 0);
    const currentLocation = values.currentLocation || {};

    // short wages
    const diffPaise = Math.round((minimumWages - basic) * 100);
    const shortWages = diffPaise > 0 ? -(diffPaise / 100) : 0;

    const basicPercentage = gross > 0 ? Math.round((basic / gross) * 100) : 0;
    const HRAPercentage = basic > 0 ? Math.round((hra / basic) * 100) : 0;

    // ----- PF -----
    let PFEmployee = 0;
    let PFEmployer = 0;
    let PFSalary = 0;

    // rule till 17.08.2026 (included conveyance allowance in the PF wage base)
    // if (values.pfApplicable) {
    //     PFSalary = Math.min(basic + spl + conveyance, PF_WAGE_CAP);
    //     PFEmployee = Math.round(PFSalary * 0.12);
    //     PFEmployer = Math.round(PFSalary * 0.13);
    // }

    // new rule from 18.08.2026 — conveyance allowance excluded from PF wage base
    if (values.pfApplicable) {
        PFSalary = Math.min(basic + spl, PF_WAGE_CAP);
        PFEmployee = Math.round(PFSalary * 0.12);
        PFEmployer = Math.round(PFSalary * 0.13);
    }

    // new rule from 25.05.2026
    // if (values.pfApplicable) {
    //     PFEmployee = 1800;
    //     PFEmployer = 1950;
    //     PFSalary = 0;
    // }

    // ----- PT -----
    let PT = 0;
    // old rule
    // const gender = values.gender?.toUpperCase();
    // const month = values.joinningDate
    //     ? new Date(values.joinningDate).getMonth() + 1
    //     : null;
    // if (PTeligibleStates.includes(detectState(currentLocation.address)) || currentLocation.title === "Head-Office") {
    //     if (gender === "MALE") {
    //         if (gross <= 7500) {
    //             PT = 0;
    //         } else if (gross <= 10000) {
    //             PT = 175;
    //         } else {
    //             PT = month === 2 ? 300 : 200;
    //         }
    //     } else if (gender === "FEMALE") {
    //         if (gross > 24999) {
    //             PT = month === 2 ? 300 : 200;
    //         } else {
    //             PT = 0;
    //         }
    //     }
    // }

    // rule till 17.08.2026 (Tamil Nadu slab-based, halved into a monthly figure)
    // `payrollState` (Employee.payrollState) overrides location-derived detection
    // when HR has explicitly set it — mirrors resolveLWFState's precedence.
    const ptState = values.payrollState
        ? values.payrollState
        : currentLocation.title === "Head-Office"
            ? "Maharashtra"
            : (detectState(currentLocation.address) || "");

    const gender = values.gender?.toUpperCase();
    // const rawPT = calculatePT(gross, ptState, gender);
    const isTamilNaduPT = ptState.trim() === "Tamil Nadu";
    // PT = isTamilNaduPT ? Math.round(rawPT / 6) : rawPT;
    // const PTAnnual = isTamilNaduPT ? rawPT * 2 : PT * 12;

    // new rule from 18.08.2026 — Tamil Nadu: flat ₹208/month PT (₹2,496/year)
    // instead of the gross-salary slab; other states unchanged.
    PT = isTamilNaduPT ? 208 : calculatePT(gross, ptState, gender);
    const PTAnnual = PT * 12;

    // ----- TDS -----
    let TDSAmount = 0;
    const TDSPercent = Number(values.TDSRate || 0);

    if (TDSPercent > 0) {
        TDSAmount = Math.round((gross * TDSPercent) / 100);
    }

    // ESIC applies only when basic + special allowance ≤ ₹21,000
    const ESICEmployee = ESICSalary <= 21000 ? Math.round((ESICSalary * 0.75) / 100) : 0;
    const ESICEmployer = ESICSalary <= 21000 ? Math.round((ESICSalary * 3.25) / 100) : 0;

    // ----- Other deductions -----
    // LWF is derived from the work-location's state + monthly wage base (gross),
    // never taken as input. The monthly figure is the amount charged in an
    // applicable month (flat for lumpy states, monthly % for Haryana) — so the
    // preview reflects a charge-month; the true annual (sum of charge-months) is
    // shown on the yearly LWF fields, not this monthly × 12.
    const lwfState = resolveLWFState(currentLocation);
    const lwfMonth = lwfPerMonth(lwfState, gross);
    const LWFEmployee = lwfMonth.employee;
    const LWFEmployer = lwfMonth.employer;
    const insurance = Number(values.insurance || 0);
    // variable & reimbursement are pure YEARLY CTC-only add-ons handled at the
    // yearly level (added straight to yearly CTC), so they are NOT part of the
    // monthly gross, deductions, in-hand, or monthly totalCostToCompany.

    const deductions =
        PFEmployee +
        TDSAmount +
        PT +
        ESICEmployee +
        LWFEmployee +
        insurance;

    const inHandSalary = Math.max(gross - deductions, 0);

    // const gratuity = Math.round(((basic + spl + conveyance) * 4.81) / 100);
    // old rule
    // const gratuity = Math.round(basic * 15 / 26 / 12);
    // new rule from 10.07.2026 (basic + spl)
    const gratuity = Math.round((basic + spl) * 15 / 26 / 12);
    const totalCostToCompany = gross + PFEmployer + ESICEmployer + LWFEmployer + gratuity;

    return {
        PFEmployee,
        PFEmployer,
        PFAmount: PFEmployee + PFEmployer,
        PFSalary,
        PT,
        PTAnnual,
        TDSAmount,
        ESICSalary,
        ESICEmployee,
        ESICEmployer,
        deductions,
        inHandSalary,
        shortWages,
        basicPercentage,
        HRAPercentage,
        gratuity,
        totalCostToCompany,
    };
};
