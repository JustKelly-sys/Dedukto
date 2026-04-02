/**
 * Dedukto - South Africa Payroll Tax Calculations
 * Tax Year: 2025/2026 (1 March 2025 - 28 February 2026)
 * Source: SARS Tax Tables
 *
 * Deductions: PAYE, UIF, SDL, Medical Aid Credits, Retirement Fund
 */

const PAYE_BRACKETS = [
  { min: 0,        max: 237100,   rate: 0.18, base: 0 },
  { min: 237101,   max: 370500,   rate: 0.26, base: 42678 },
  { min: 370501,   max: 512800,   rate: 0.31, base: 77362 },
  { min: 512801,   max: 673000,   rate: 0.36, base: 121475 },
  { min: 673001,   max: 857900,   rate: 0.39, base: 179147 },
  { min: 857901,   max: 1817000,  rate: 0.41, base: 251258 },
  { min: 1817001,  max: Infinity, rate: 0.45, base: 644489 },
];

const REBATES = { primary: 17235, secondary: 9444, tertiary: 3145 };
const TAX_THRESHOLDS = { under65: 95750, age65to74: 148217, age75plus: 165689 };
const UIF_RATE = 0.01;
const UIF_MONTHLY_CAP = 17712;
const SDL_RATE = 0.01;
const MEDICAL_CREDITS = { mainMember: 364, firstDependent: 364, additionalDependents: 246 };
const RETIREMENT_DEDUCTION_LIMIT_PCT = 0.275;
const RETIREMENT_ANNUAL_CAP = 350000;

function calculateAnnualPAYE(annualTaxableIncome) {
  if (annualTaxableIncome <= 0) return 0;
  for (const bracket of PAYE_BRACKETS) {
    if (annualTaxableIncome <= bracket.max) {
      return bracket.base + (annualTaxableIncome - bracket.min) * bracket.rate;
    }
  }
  const last = PAYE_BRACKETS[PAYE_BRACKETS.length - 1];
  return last.base + (annualTaxableIncome - last.min) * last.rate;
}

function getRebate(age) {
  if (age >= 75) return REBATES.primary + REBATES.secondary + REBATES.tertiary;
  if (age >= 65) return REBATES.primary + REBATES.secondary;
  return REBATES.primary;
}

function calculateMedicalCredits(dependents = 0) {
  if (dependents === 0) return MEDICAL_CREDITS.mainMember;
  if (dependents === 1) return MEDICAL_CREDITS.mainMember + MEDICAL_CREDITS.firstDependent;
  return MEDICAL_CREDITS.mainMember + MEDICAL_CREDITS.firstDependent + (dependents - 1) * MEDICAL_CREDITS.additionalDependents;
}

function calculateRetirementDeduction(grossMonthly, retirementPct) {
  const monthlyContribution = grossMonthly * (retirementPct / 100);
  const annualContribution = monthlyContribution * 12;
  const annualGross = grossMonthly * 12;
  const maxDeductible = Math.min(annualContribution, annualGross * RETIREMENT_DEDUCTION_LIMIT_PCT, RETIREMENT_ANNUAL_CAP);
  return { monthlyContribution, annualDeductible: maxDeductible, monthlyDeductible: maxDeductible / 12 };
}

function calculateSouthAfrica(employee) {
  const {
    grossMonthlySalary, age = 30, medicalAid = false, medicalDependents = 0,
    retirementFundPct = 0, payPeriod = new Date().toISOString().slice(0, 7),
  } = employee;

  const retirement = calculateRetirementDeduction(grossMonthlySalary, retirementFundPct);
  const annualGross = grossMonthlySalary * 12;
  const annualTaxableIncome = annualGross - retirement.annualDeductible;
  const annualPAYEBeforeRebate = calculateAnnualPAYE(annualTaxableIncome);
  const rebate = getRebate(age);
  let annualPAYE = annualPAYEBeforeRebate - rebate;

  let monthlyMedicalCredit = 0;
  if (medicalAid) {
    monthlyMedicalCredit = calculateMedicalCredits(medicalDependents);
    annualPAYE -= monthlyMedicalCredit * 12;
  }
  annualPAYE = Math.max(0, annualPAYE);
  const monthlyPAYE = Math.round(annualPAYE / 12 * 100) / 100;

  const uifBase = Math.min(grossMonthlySalary, UIF_MONTHLY_CAP);
  const monthlyUIF = Math.round(uifBase * UIF_RATE * 100) / 100;
  const employerUIF = monthlyUIF;
  const monthlySDL = Math.round(grossMonthlySalary * SDL_RATE * 100) / 100;

  const retirementMonthly = Math.round(retirement.monthlyContribution * 100) / 100;
  const totalEmployeeDeductions = monthlyPAYE + monthlyUIF + retirementMonthly;
  const netSalary = Math.round((grossMonthlySalary - totalEmployeeDeductions) * 100) / 100;
  const totalCostToEmployer = Math.round((grossMonthlySalary + employerUIF + monthlySDL) * 100) / 100;

  return {
    country: "ZA", currency: "ZAR", payPeriod, grossSalary: grossMonthlySalary,
    deductions: {
      paye: monthlyPAYE, uif_employee: monthlyUIF,
      retirement_fund: retirementMonthly,
      medical_aid_credit: medicalAid ? monthlyMedicalCredit : 0,
    },
    totalEmployeeDeductions: Math.round(totalEmployeeDeductions * 100) / 100,
    netSalary,
    employerContributions: { uif_employer: employerUIF, sdl: monthlySDL },
    totalCostToEmployer,
    taxDetails: {
      annualGross, annualTaxableIncome: Math.round(annualTaxableIncome * 100) / 100,
      annualPAYEBeforeRebate: Math.round(annualPAYEBeforeRebate * 100) / 100,
      rebateApplied: rebate, annualPAYEAfterRebate: Math.round(annualPAYE * 100) / 100,
      effectiveTaxRate: annualGross > 0 ? Math.round((annualPAYE / annualGross) * 10000) / 100 : 0,
    },
  };
}

if (typeof module !== "undefined") {
  module.exports = {
    calculateSouthAfrica, calculateAnnualPAYE, getRebate, calculateMedicalCredits,
    calculateRetirementDeduction, PAYE_BRACKETS, REBATES, TAX_THRESHOLDS,
    UIF_RATE, UIF_MONTHLY_CAP, SDL_RATE, MEDICAL_CREDITS,
  };
}