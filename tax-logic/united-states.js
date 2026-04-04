/**
 * Dedukto - United States Payroll Tax Calculations
 * Tax Year: 2025
 * Source: IRS Revenue Procedure 2024-40
 *
 * Deductions: Federal Income Tax, Social Security, Medicare, State Tax, 401(k)
 */

const FEDERAL_BRACKETS = {
  single: [
    { min: 0,       max: 11925,   rate: 0.10, base: 0 },
    { min: 11925,   max: 48475,   rate: 0.12, base: 1192.50 },
    { min: 48475,   max: 103350,  rate: 0.22, base: 5578.50 },
    { min: 103350,  max: 197300,  rate: 0.24, base: 17651.50 },
    { min: 197300,  max: 250525,  rate: 0.32, base: 40199.50 },
    { min: 250525,  max: 626350,  rate: 0.35, base: 57231.50 },
    { min: 626350,  max: Infinity, rate: 0.37, base: 188769.75 },
  ],
  married_jointly: [
    { min: 0,       max: 23850,   rate: 0.10, base: 0 },
    { min: 23850,   max: 96950,   rate: 0.12, base: 2385.00 },
    { min: 96950,   max: 206700,  rate: 0.22, base: 11157.00 },
    { min: 206700,  max: 394600,  rate: 0.24, base: 35303.00 },
    { min: 394600,  max: 501050,  rate: 0.32, base: 80399.00 },
    { min: 501050,  max: 751600,  rate: 0.35, base: 114463.00 },
    { min: 751600,  max: Infinity, rate: 0.37, base: 202155.50 },
  ],
};

const STANDARD_DEDUCTIONS = { single: 15000, married_jointly: 30000 };

const SOCIAL_SECURITY = { rate: 0.062, wageCap: 176100, employerRate: 0.062 };
const MEDICARE = { rate: 0.0145, additionalRate: 0.009, additionalThreshold: 200000, employerRate: 0.0145 };

const STATE_TAX = {
  TX: { name: "Texas", brackets: [], standardDeduction: 0 },
  FL: { name: "Florida", brackets: [], standardDeduction: 0 },
  WA: { name: "Washington", brackets: [], standardDeduction: 0 },
  CA: {
    name: "California", standardDeduction: 5540,
    brackets: [
      { min: 0, max: 10412, rate: 0.01 }, { min: 10412, max: 24684, rate: 0.02 },
      { min: 24684, max: 38959, rate: 0.04 }, { min: 38959, max: 54081, rate: 0.06 },
      { min: 54081, max: 68350, rate: 0.08 }, { min: 68350, max: 349137, rate: 0.093 },
      { min: 349137, max: 418961, rate: 0.103 }, { min: 418961, max: 698271, rate: 0.113 },
      { min: 698271, max: Infinity, rate: 0.133 },
    ],
  },
  NY: {
    name: "New York", standardDeduction: 8000,
    brackets: [
      { min: 0, max: 8500, rate: 0.04 }, { min: 8500, max: 11700, rate: 0.045 },
      { min: 11700, max: 13900, rate: 0.0525 }, { min: 13900, max: 80650, rate: 0.0585 },
      { min: 80650, max: 215400, rate: 0.0625 }, { min: 215400, max: 1077550, rate: 0.0685 },
      { min: 1077550, max: 5000000, rate: 0.0965 }, { min: 5000000, max: 25000000, rate: 0.103 },
      { min: 25000000, max: Infinity, rate: 0.109 },
    ],
  },
};

const FOUR01K = { annualLimit: 23500, catchUpAge: 50, catchUpLimit: 7500, superCatchUpAge: 60, superCatchUpLimit: 11250 };

function calculateFederalTax(annualGross, filingStatus, preTaxDeductions) {
  filingStatus = filingStatus || "single";
  preTaxDeductions = preTaxDeductions || 0;
  const brackets = FEDERAL_BRACKETS[filingStatus] || FEDERAL_BRACKETS.single;
  const standardDeduction = STANDARD_DEDUCTIONS[filingStatus] || STANDARD_DEDUCTIONS.single;
  const taxableIncome = Math.max(0, annualGross - preTaxDeductions - standardDeduction);

  let tax = 0;
  for (const bracket of brackets) {
    if (taxableIncome <= bracket.max) {
      tax = bracket.min === 0
        ? taxableIncome * bracket.rate
        : bracket.base + (taxableIncome - bracket.min) * bracket.rate;
      break;
    }
  }
  return { annualTax: Math.round(tax * 100) / 100, taxableIncome, standardDeduction };
}

function calculateSocialSecurity(annualGross) {
  const taxableWages = Math.min(annualGross, SOCIAL_SECURITY.wageCap);
  return {
    employee: Math.round(taxableWages * SOCIAL_SECURITY.rate * 100) / 100,
    employer: Math.round(taxableWages * SOCIAL_SECURITY.employerRate * 100) / 100,
  };
}

function calculateMedicare(annualGross) {
  let employeeTax = annualGross * MEDICARE.rate;
  if (annualGross > MEDICARE.additionalThreshold) {
    employeeTax += (annualGross - MEDICARE.additionalThreshold) * MEDICARE.additionalRate;
  }
  return {
    employee: Math.round(employeeTax * 100) / 100,
    employer: Math.round(annualGross * MEDICARE.employerRate * 100) / 100,
  };
}

function calculateStateTax(annualGross, state, preTaxDeductions) {
  state = state || "TX";
  preTaxDeductions = preTaxDeductions || 0;
  const stateConfig = STATE_TAX[state];
  if (!stateConfig || stateConfig.brackets.length === 0) {
    return { annualTax: 0, stateName: stateConfig ? stateConfig.name : state };
  }
  const taxableIncome = Math.max(0, annualGross - preTaxDeductions - stateConfig.standardDeduction);
  let tax = 0, previousMax = 0;
  for (const bracket of stateConfig.brackets) {
    if (taxableIncome <= bracket.max) {
      tax += (taxableIncome - previousMax) * bracket.rate;
      break;
    } else {
      tax += (bracket.max - previousMax) * bracket.rate;
      previousMax = bracket.max;
    }
  }
  return { annualTax: Math.round(tax * 100) / 100, stateName: stateConfig.name, taxableIncome };
}

function calculate401k(annualGross, contributionPct, age) {
  contributionPct = contributionPct || 0;
  age = age || 30;
  const baseContribution = annualGross * (contributionPct / 100);
  let annualLimit = FOUR01K.annualLimit;
  if (age >= FOUR01K.superCatchUpAge && age <= 63) annualLimit += FOUR01K.superCatchUpLimit;
  else if (age >= FOUR01K.catchUpAge) annualLimit += FOUR01K.catchUpLimit;
  return { annualContribution: Math.round(Math.min(baseContribution, annualLimit) * 100) / 100, annualLimit };
}

function calculateUnitedStates(employee) {
  if (!employee.grossMonthlySalary || employee.grossMonthlySalary <= 0) {
    throw new Error('Gross monthly salary must be positive');
  }
  const {
    grossMonthlySalary, filingStatus = "single", state = "TX",
    fourOhOnekPct = 0, age = 30, payPeriod = new Date().toISOString().slice(0, 7),
  } = employee;

  const annualGross = grossMonthlySalary * 12;
  const fourOhOnek = calculate401k(annualGross, fourOhOnekPct, age);
  const preTaxDeductions = fourOhOnek.annualContribution;

  const federal = calculateFederalTax(annualGross, filingStatus, preTaxDeductions);
  const monthlyFederal = Math.round(federal.annualTax / 12 * 100) / 100;

  const socialSecurity = calculateSocialSecurity(annualGross - preTaxDeductions);
  const monthlySS = Math.round(socialSecurity.employee / 12 * 100) / 100;

  const medicare = calculateMedicare(annualGross - preTaxDeductions);
  const monthlyMedicare = Math.round(medicare.employee / 12 * 100) / 100;

  const stateTax = calculateStateTax(annualGross, state, preTaxDeductions);
  const monthlyState = Math.round(stateTax.annualTax / 12 * 100) / 100;

  const monthly401k = Math.round(fourOhOnek.annualContribution / 12 * 100) / 100;

  const totalEmployeeDeductions = monthlyFederal + monthlySS + monthlyMedicare + monthlyState + monthly401k;
  const netSalary = Math.round((grossMonthlySalary - totalEmployeeDeductions) * 100) / 100;

  const monthlyEmployerSS = Math.round(socialSecurity.employer / 12 * 100) / 100;
  const monthlyEmployerMedicare = Math.round(medicare.employer / 12 * 100) / 100;
  const totalCostToEmployer = Math.round((grossMonthlySalary + monthlyEmployerSS + monthlyEmployerMedicare) * 100) / 100;

  return {
    country: "US", currency: "USD", payPeriod, grossSalary: grossMonthlySalary,
    deductions: {
      federal_income_tax: monthlyFederal, social_security: monthlySS,
      medicare: monthlyMedicare, state_income_tax: monthlyState, "401k": monthly401k,
    },
    totalEmployeeDeductions: Math.round(totalEmployeeDeductions * 100) / 100,
    netSalary,
    employerContributions: { social_security: monthlyEmployerSS, medicare: monthlyEmployerMedicare },
    totalCostToEmployer,
    taxDetails: {
      annualGross, filingStatus, state: stateTax.stateName,
      standardDeduction: federal.standardDeduction, federalTaxableIncome: federal.taxableIncome,
      annualFederalTax: federal.annualTax, annualSocialSecurity: socialSecurity.employee,
      annualMedicare: medicare.employee, annualStateTax: stateTax.annualTax,
      annual401k: fourOhOnek.annualContribution,
      effectiveTaxRate: annualGross > 0
        ? Math.round(((federal.annualTax + socialSecurity.employee + medicare.employee + stateTax.annualTax) / annualGross) * 10000) / 100 : 0,
    },
  };
}

if (typeof module !== "undefined") {
  module.exports = {
    calculateUnitedStates, calculateFederalTax, calculateSocialSecurity, calculateMedicare,
    calculateStateTax, calculate401k, FEDERAL_BRACKETS, STANDARD_DEDUCTIONS,
    SOCIAL_SECURITY, MEDICARE, STATE_TAX, FOUR01K,
  };
}