const { calculateSouthAfrica } = require("./south-africa");
const { calculateUnitedKingdom } = require("./united-kingdom");
const { calculateUnitedStates } = require("./united-states");

const CALCULATORS = { ZA: calculateSouthAfrica, GB: calculateUnitedKingdom, US: calculateUnitedStates };

function calculatePayroll(employee) {
  const calc = CALCULATORS[employee.country];
  if (!calc) throw new Error("Unsupported country: " + employee.country + ". Supported: ZA, GB, US");
  return calc(employee);
}

function calculateBatch(employees) {
  return employees.map(emp => {
    try { return { success: true, result: calculatePayroll(emp), employee_id: emp.employee_id }; }
    catch (e) { return { success: false, error: e.message, employee_id: emp.employee_id }; }
  });
}

module.exports = { calculatePayroll, calculateBatch, calculateSouthAfrica, calculateUnitedKingdom, calculateUnitedStates };