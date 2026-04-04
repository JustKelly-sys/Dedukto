/**
 * Dedukto - United Kingdom Payroll Tax Calculations
 * Tax Year: 2025/2026 (6 April 2025 - 5 April 2026)
 * Source: HMRC Tax Tables
 *
 * Deductions: Income Tax, National Insurance, Student Loan, Pension
 */

const PERSONAL_ALLOWANCE = 12570;
const PERSONAL_ALLOWANCE_TAPER_THRESHOLD = 100000;

const NI_EMPLOYEE = {
  primaryThresholdAnnual: 12570,
  upperEarningsLimitAnnual: 50270,
  rateBetween: 0.08,
  rateAbove: 0.02,
};

const NI_EMPLOYER = {
  secondaryThresholdAnnual: 5000,
  rate: 0.15,
};

const STUDENT_LOAN_PLANS = {
  plan1: { threshold: 24990, rate: 0.09 },
  plan2: { threshold: 27295, rate: 0.09 },
  plan4: { threshold: 31395, rate: 0.09 },
  plan5: { threshold: 25000, rate: 0.09 },
  postgrad: { threshold: 21000, rate: 0.06 },
};

const PENSION_DEFAULTS = {
  employeeRate: 0.05,
  employerRate: 0.03,
  qualifyingEarningsLower: 6240,
  qualifyingEarningsUpper: 50270,
};

function getPersonalAllowance(annualGross) {
  if (annualGross <= PERSONAL_ALLOWANCE_TAPER_THRESHOLD) return PERSONAL_ALLOWANCE;
  const excess = annualGross - PERSONAL_ALLOWANCE_TAPER_THRESHOLD;
  const reduction = Math.floor(excess / 2);
  return Math.max(0, PERSONAL_ALLOWANCE - reduction);
}

function calculateIncomeTax(annualGross) {
  const personalAllowance = getPersonalAllowance(annualGross);
  const taxableIncome = Math.max(0, annualGross - personalAllowance);
  let tax = 0;
  let remaining = taxableIncome;

  const basicBandWidth = 37700;
  tax += Math.min(remaining, basicBandWidth) * 0.20;
  remaining = Math.max(0, remaining - basicBandWidth);

  const higherBandWidth = 74870;
  tax += Math.min(remaining, higherBandWidth) * 0.40;
  remaining = Math.max(0, remaining - higherBandWidth);

  if (remaining > 0) tax += remaining * 0.45;

  return { annualTax: Math.round(tax * 100) / 100, personalAllowance, taxableIncome };
}

function calculateEmployeeNI(annualGross) {
  let ni = 0;
  if (annualGross > NI_EMPLOYEE.primaryThresholdAnnual) {
    const bandEarnings = Math.min(
      annualGross - NI_EMPLOYEE.primaryThresholdAnnual,
      NI_EMPLOYEE.upperEarningsLimitAnnual - NI_EMPLOYEE.primaryThresholdAnnual
    );
    ni += bandEarnings * NI_EMPLOYEE.rateBetween;
    if (annualGross > NI_EMPLOYEE.upperEarningsLimitAnnual) {
      ni += (annualGross - NI_EMPLOYEE.upperEarningsLimitAnnual) * NI_EMPLOYEE.rateAbove;
    }
  }
  return Math.round(ni * 100) / 100;
}

function calculateEmployerNI(annualGross) {
  if (annualGross <= NI_EMPLOYER.secondaryThresholdAnnual) return 0;
  return Math.round((annualGross - NI_EMPLOYER.secondaryThresholdAnnual) * NI_EMPLOYER.rate * 100) / 100;
}

function calculateStudentLoan(annualGross, plan = null) {
  if (!plan || !STUDENT_LOAN_PLANS[plan]) return 0;
  const { threshold, rate } = STUDENT_LOAN_PLANS[plan];
  if (annualGross <= threshold) return 0;
  return Math.round((annualGross - threshold) * rate * 100) / 100;
}

function calculatePension(annualGross, employeePct = null, employerPct = null) {
  const empRate = employeePct !== null ? employeePct / 100 : PENSION_DEFAULTS.employeeRate;
  const errRate = employerPct !== null ? employerPct / 100 : PENSION_DEFAULTS.employerRate;
  const qualifyingEarnings = Math.max(0,
    Math.min(annualGross, PENSION_DEFAULTS.qualifyingEarningsUpper) - PENSION_DEFAULTS.qualifyingEarningsLower
  );
  return {
    employeeAnnual: Math.round(qualifyingEarnings * empRate * 100) / 100,
    employerAnnual: Math.round(qualifyingEarnings * errRate * 100) / 100,
    qualifyingEarnings,
  };
}

function calculateUnitedKingdom(employee) {
  if (!employee.grossMonthlySalary || employee.grossMonthlySalary <= 0) {
    throw new Error('Gross monthly salary must be positive');
  }
  const {
    grossMonthlySalary, studentLoanPlan = null, pensionPct = null,
    employerPensionPct = null, payPeriod = new Date().toISOString().slice(0, 7),
  } = employee;

  const annualGross = grossMonthlySalary * 12;
  const incomeTaxResult = calculateIncomeTax(annualGross);
  const monthlyIncomeTax = Math.round(incomeTaxResult.annualTax / 12 * 100) / 100;

  const annualEmployeeNI = calculateEmployeeNI(annualGross);
  const monthlyEmployeeNI = Math.round(annualEmployeeNI / 12 * 100) / 100;

  const annualEmployerNI = calculateEmployerNI(annualGross);
  const monthlyEmployerNI = Math.round(annualEmployerNI / 12 * 100) / 100;

  const annualStudentLoan = calculateStudentLoan(annualGross, studentLoanPlan);
  const monthlyStudentLoan = Math.round(annualStudentLoan / 12 * 100) / 100;

  const pension = calculatePension(annualGross, pensionPct, employerPensionPct);
  const monthlyEmployeePension = Math.round(pension.employeeAnnual / 12 * 100) / 100;
  const monthlyEmployerPension = Math.round(pension.employerAnnual / 12 * 100) / 100;

  const totalEmployeeDeductions = monthlyIncomeTax + monthlyEmployeeNI + monthlyStudentLoan + monthlyEmployeePension;
  const netSalary = Math.round((grossMonthlySalary - totalEmployeeDeductions) * 100) / 100;
  const totalCostToEmployer = Math.round((grossMonthlySalary + monthlyEmployerNI + monthlyEmployerPension) * 100) / 100;

  return {
    country: "GB", currency: "GBP", payPeriod, grossSalary: grossMonthlySalary,
    deductions: {
      income_tax: monthlyIncomeTax, national_insurance: monthlyEmployeeNI,
      student_loan: monthlyStudentLoan, pension_employee: monthlyEmployeePension,
    },
    totalEmployeeDeductions: Math.round(totalEmployeeDeductions * 100) / 100,
    netSalary,
    employerContributions: { national_insurance: monthlyEmployerNI, pension_employer: monthlyEmployerPension },
    totalCostToEmployer,
    taxDetails: {
      annualGross, personalAllowance: incomeTaxResult.personalAllowance,
      taxableIncome: incomeTaxResult.taxableIncome, annualIncomeTax: incomeTaxResult.annualTax,
      annualEmployeeNI, studentLoanPlan: studentLoanPlan || "none",
      effectiveTaxRate: annualGross > 0 ? Math.round(((incomeTaxResult.annualTax + annualEmployeeNI) / annualGross) * 10000) / 100 : 0,
    },
  };
}

if (typeof module !== "undefined") {
  module.exports = {
    calculateUnitedKingdom, calculateIncomeTax, calculateEmployeeNI, calculateEmployerNI,
    calculateStudentLoan, calculatePension, getPersonalAllowance,
    NI_EMPLOYEE, NI_EMPLOYER, STUDENT_LOAN_PLANS, PENSION_DEFAULTS,
  };
}