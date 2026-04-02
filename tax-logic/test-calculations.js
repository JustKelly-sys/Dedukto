/**
 * Dedukto - Tax Calculation Tests
 * Run: node tax-logic/test-calculations.js
 */

const { calculateSouthAfrica } = require("./south-africa");
const { calculateUnitedKingdom } = require("./united-kingdom");
const { calculateUnitedStates } = require("./united-states");

let passed = 0;
let failed = 0;

function assert(name, actual, expected, tolerance) {
  tolerance = tolerance || 1;
  if (Math.abs(actual - expected) <= tolerance) {
    console.log("  PASS: " + name + " = " + actual + " (expected ~" + expected + ")");
    passed++;
  } else {
    console.log("  FAIL: " + name + " = " + actual + " (expected ~" + expected + ")");
    failed++;
  }
}

function header(title) { console.log("\n=== " + title + " ==="); }

// ---- SOUTH AFRICA ----
header("South Africa - R55,000/month, age 30, 7.5% retirement, medical aid");
const za1 = calculateSouthAfrica({
  grossMonthlySalary: 55000, age: 30, medicalAid: true,
  medicalDependents: 1, retirementFundPct: 7.5
});
assert("Country", za1.country === "ZA" ? 1 : 0, 1, 0);
assert("Gross", za1.grossSalary, 55000, 0);
assert("Net < Gross", za1.netSalary < za1.grossSalary ? 1 : 0, 1, 0);
assert("PAYE > 0", za1.deductions.paye > 0 ? 1 : 0, 1, 0);
assert("UIF (capped at R17,712)", za1.deductions.uif_employee, 177.12, 1);
assert("Retirement", za1.deductions.retirement_fund, 4125, 1);
assert("Net reasonable", za1.netSalary > 35000 && za1.netSalary < 48000 ? 1 : 0, 1, 0);
console.log("  Payslip:", JSON.stringify(za1.deductions));
console.log("  Net: R" + za1.netSalary);

header("South Africa - R25,000/month, no benefits");
const za2 = calculateSouthAfrica({ grossMonthlySalary: 25000 });
assert("PAYE > 0", za2.deductions.paye > 0 ? 1 : 0, 1, 0);
assert("UIF (capped at R17,712)", za2.deductions.uif_employee, 177.12, 1);
assert("Net reasonable", za2.netSalary > 18000 && za2.netSalary < 24000 ? 1 : 0, 1, 0);
console.log("  Net: R" + za2.netSalary);

header("South Africa - Below tax threshold");
const za3 = calculateSouthAfrica({ grossMonthlySalary: 7000 });
assert("PAYE = 0 (below threshold)", za3.deductions.paye, 0, 1);
console.log("  Net: R" + za3.netSalary);

// ---- UNITED KINGDOM ----
header("United Kingdom - GBP 4,500/month, student loan plan 2");
const uk1 = calculateUnitedKingdom({
  grossMonthlySalary: 4500, studentLoanPlan: "plan2"
});
assert("Country", uk1.country === "GB" ? 1 : 0, 1, 0);
assert("Gross", uk1.grossSalary, 4500, 0);
assert("Income Tax > 0", uk1.deductions.income_tax > 0 ? 1 : 0, 1, 0);
assert("NI > 0", uk1.deductions.national_insurance > 0 ? 1 : 0, 1, 0);
assert("Student Loan > 0", uk1.deductions.student_loan > 0 ? 1 : 0, 1, 0);
assert("Net reasonable", uk1.netSalary > 2800 && uk1.netSalary < 3800 ? 1 : 0, 1, 0);
console.log("  Payslip:", JSON.stringify(uk1.deductions));
console.log("  Net: GBP " + uk1.netSalary);

header("United Kingdom - GBP 3,000/month, no student loan");
const uk2 = calculateUnitedKingdom({ grossMonthlySalary: 3000 });
assert("Student Loan = 0", uk2.deductions.student_loan, 0, 0);
assert("Net reasonable", uk2.netSalary > 2000 && uk2.netSalary < 2800 ? 1 : 0, 1, 0);
console.log("  Net: GBP " + uk2.netSalary);

header("United Kingdom - Below personal allowance");
const uk3 = calculateUnitedKingdom({ grossMonthlySalary: 900 });
assert("Income Tax = 0", uk3.deductions.income_tax, 0, 1);
console.log("  Net: GBP " + uk3.netSalary);

// ---- UNITED STATES ----
header("United States - $8,000/month, single, California, 6% 401k");
const us1 = calculateUnitedStates({
  grossMonthlySalary: 8000, filingStatus: "single",
  state: "CA", fourOhOnekPct: 6
});
assert("Country", us1.country === "US" ? 1 : 0, 1, 0);
assert("Gross", us1.grossSalary, 8000, 0);
assert("Federal Tax > 0", us1.deductions.federal_income_tax > 0 ? 1 : 0, 1, 0);
assert("SS > 0", us1.deductions.social_security > 0 ? 1 : 0, 1, 0);
assert("Medicare > 0", us1.deductions.medicare > 0 ? 1 : 0, 1, 0);
assert("State Tax > 0 (CA)", us1.deductions.state_income_tax > 0 ? 1 : 0, 1, 0);
assert("401k > 0", us1.deductions["401k"] > 0 ? 1 : 0, 1, 0);
assert("Net reasonable", us1.netSalary > 4500 && us1.netSalary < 6500 ? 1 : 0, 1, 0);
console.log("  Payslip:", JSON.stringify(us1.deductions));
console.log("  Net: $" + us1.netSalary);

header("United States - $12,000/month, married, Texas (no state tax)");
const us2 = calculateUnitedStates({
  grossMonthlySalary: 12000, filingStatus: "married_jointly", state: "TX"
});
assert("State Tax = 0 (TX)", us2.deductions.state_income_tax, 0, 0);
assert("Net reasonable", us2.netSalary > 8000 && us2.netSalary < 11000 ? 1 : 0, 1, 0);
console.log("  Net: $" + us2.netSalary);

header("United States - $5,000/month, New York");
const us3 = calculateUnitedStates({
  grossMonthlySalary: 5000, state: "NY"
});
assert("State Tax > 0 (NY)", us3.deductions.state_income_tax > 0 ? 1 : 0, 1, 0);
console.log("  Net: $" + us3.netSalary);

// ---- SUMMARY ----
console.log("\n========================================");
console.log("Results: " + passed + " passed, " + failed + " failed, " + (passed + failed) + " total");
console.log("========================================");
process.exit(failed > 0 ? 1 : 0);