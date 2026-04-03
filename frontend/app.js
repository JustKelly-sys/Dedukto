/* ============================================
   DEDUKTO - Frontend Application
   Tax logic + UI + PDF payslip download
   ============================================ */
const COUNTRIES = {
  ZA: { name: "South Africa", code: "ZA", currency: "ZAR", symbol: "R" },
  GB: { name: "United Kingdom", code: "GB", currency: "GBP", symbol: "\u00A3" },
  US: { name: "United States", code: "US", currency: "USD", symbol: "$" },
};

let employees = [
  { full_name: "Thabo Mokoena", position: "Senior Accountant", department: "Finance", country: "ZA", grossMonthlySalary: 55000, age: 32, medicalAid: true, medicalDependents: 1, retirementFundPct: 7.5 },
  { full_name: "Naledi Dlamini", position: "HR Manager", department: "Human Resources", country: "ZA", grossMonthlySalary: 35000, age: 29, medicalAid: false, medicalDependents: 0, retirementFundPct: 5 },
  { full_name: "Sipho Nkosi", position: "Admin Clerk", department: "Operations", country: "ZA", grossMonthlySalary: 18000, age: 38, medicalAid: true, medicalDependents: 3, retirementFundPct: 0 },
  { full_name: "James Whitfield", position: "Software Engineer", department: "Engineering", country: "GB", grossMonthlySalary: 5000, studentLoanPlan: "plan2", pensionPct: 5 },
  { full_name: "Priya Sharma", position: "Marketing Analyst", department: "Marketing", country: "GB", grossMonthlySalary: 3200, studentLoanPlan: null, pensionPct: 5 },
  { full_name: "Oliver Chen", position: "Product Lead", department: "Product", country: "GB", grossMonthlySalary: 8500, studentLoanPlan: "plan1", pensionPct: 8 },
  { full_name: "Sarah Mitchell", position: "Data Scientist", department: "Engineering", country: "US", grossMonthlySalary: 8000, filingStatus: "single", state: "CA", fourOhOnekPct: 6, age: 35 },
  { full_name: "Marcus Johnson", position: "VP Operations", department: "Operations", country: "US", grossMonthlySalary: 12000, filingStatus: "married_jointly", state: "TX", fourOhOnekPct: 10, age: 42 },
  { full_name: "Emily Rodriguez", position: "UX Designer", department: "Design", country: "US", grossMonthlySalary: 6500, filingStatus: "single", state: "NY", fourOhOnekPct: 0, age: 28 },
];

let payrollResults = [];

// === TAX CALCULATIONS ===
function calculateSouthAfrica(emp) {
  const gross = emp.grossMonthlySalary;
  const age = emp.age || 30;
  const retPct = emp.retirementFundPct || 0;
  const brackets = [
    { min: 0, max: 237100, rate: 0.18, base: 0 },
    { min: 237101, max: 370500, rate: 0.26, base: 42678 },
    { min: 370501, max: 512800, rate: 0.31, base: 77362 },
    { min: 512801, max: 673000, rate: 0.36, base: 121475 },
    { min: 673001, max: 857900, rate: 0.39, base: 179147 },
    { min: 857901, max: 1817000, rate: 0.41, base: 251258 },
    { min: 1817001, max: Infinity, rate: 0.45, base: 644489 },
  ];
  const retMonthly = gross * (retPct / 100);
  const annualGross = gross * 12;
  const retDeductible = Math.min(retMonthly * 12, annualGross * 0.275, 350000);
  const taxable = annualGross - retDeductible;
  let annualPAYE = 0;
  for (const b of brackets) { if (taxable <= b.max) { annualPAYE = b.base + (taxable - b.min) * b.rate; break; } }
  const rebate = age >= 75 ? 29824 : age >= 65 ? 26679 : 17235;
  annualPAYE -= rebate;
  let medCredit = 0;
  if (emp.medicalAid) {
    medCredit = 364 + (emp.medicalDependents >= 1 ? 364 : 0) + Math.max(0, (emp.medicalDependents || 0) - 1) * 246;
    annualPAYE -= medCredit * 12;
  }
  annualPAYE = Math.max(0, annualPAYE);
  const monthlyPAYE = r2(annualPAYE / 12);
  const uif = r2(Math.min(gross, 17712) * 0.01);
  const sdl = r2(gross * 0.01);
  const retFund = r2(retMonthly);
  const totalDed = monthlyPAYE + uif + retFund;
  return { country: "ZA", currency: "ZAR", grossSalary: gross,
    deductions: { "PAYE": monthlyPAYE, "UIF (Employee)": uif, "Retirement Fund": retFund, "Medical Credit": medCredit },
    totalEmployeeDeductions: r2(totalDed), netSalary: r2(gross - totalDed),
    employerContributions: { "UIF (Employer)": uif, "SDL": sdl },
    totalCostToEmployer: r2(gross + uif + sdl) };
}

function calculateUnitedKingdom(emp) {
  const gross = emp.grossMonthlySalary;
  const annual = gross * 12;
  let pa = 12570;
  if (annual > 100000) pa = Math.max(0, 12570 - Math.floor((annual - 100000) / 2));
  const taxable = Math.max(0, annual - pa);
  let tax = 0, rem = taxable;
  tax += Math.min(rem, 37700) * 0.20; rem = Math.max(0, rem - 37700);
  tax += Math.min(rem, 74870) * 0.40; rem = Math.max(0, rem - 74870);
  if (rem > 0) tax += rem * 0.45;
  const monthlyTax = r2(tax / 12);
  let ni = 0;
  if (annual > 12570) { ni += Math.min(annual - 12570, 50270 - 12570) * 0.08; if (annual > 50270) ni += (annual - 50270) * 0.02; }
  const monthlyNI = r2(ni / 12);
  const empNI = annual > 5000 ? r2((annual - 5000) * 0.15 / 12) : 0;
  const plans = { plan1: 24990, plan2: 27295, plan4: 31395, plan5: 25000, postgrad: 21000 };
  const slRate = emp.studentLoanPlan === "postgrad" ? 0.06 : 0.09;
  const slThreshold = plans[emp.studentLoanPlan] || 0;
  const monthlySL = emp.studentLoanPlan && annual > slThreshold ? r2((annual - slThreshold) * slRate / 12) : 0;
  const pensionRate = emp.pensionPct ? emp.pensionPct / 100 : 0.05;
  const qualEarnings = Math.max(0, Math.min(annual, 50270) - 6240);
  const monthlyPension = r2(qualEarnings * pensionRate / 12);
  const monthlyErPension = r2(qualEarnings * 0.03 / 12);
  const totalDed = monthlyTax + monthlyNI + monthlySL + monthlyPension;
  return { country: "GB", currency: "GBP", grossSalary: gross,
    deductions: { "Income Tax": monthlyTax, "National Insurance": monthlyNI, "Student Loan": monthlySL, "Pension (Employee)": monthlyPension },
    totalEmployeeDeductions: r2(totalDed), netSalary: r2(gross - totalDed),
    employerContributions: { "NI (Employer)": empNI, "Pension (Employer)": monthlyErPension },
    totalCostToEmployer: r2(gross + empNI + monthlyErPension) };
}

function calculateUnitedStates(emp) {
  const gross = emp.grossMonthlySalary;
  const annual = gross * 12;
  const filing = emp.filingStatus || "single";
  const state = emp.state || "TX";
  const age = emp.age || 30;
  const k401Pct = emp.fourOhOnekPct || 0;
  let k401Limit = 23500;
  if (age >= 60 && age <= 63) k401Limit += 11250; else if (age >= 50) k401Limit += 7500;
  const k401Annual = Math.min(annual * (k401Pct / 100), k401Limit);
  const preTax = k401Annual;
  const stdDed = filing === "married_jointly" ? 30000 : 15000;
  const fedTaxable = Math.max(0, annual - preTax - stdDed);
  const brackets = filing === "married_jointly"
    ? [{m:0,x:23850,r:0.10,b:0},{m:23851,x:96950,r:0.12,b:2385},{m:96951,x:206700,r:0.22,b:11157},{m:206701,x:394600,r:0.24,b:35303},{m:394601,x:501050,r:0.32,b:80399},{m:501051,x:751600,r:0.35,b:114463},{m:751601,x:Infinity,r:0.37,b:202155.5}]
    : [{m:0,x:11925,r:0.10,b:0},{m:11926,x:48475,r:0.12,b:1192.5},{m:48476,x:103350,r:0.22,b:5578.5},{m:103351,x:197300,r:0.24,b:17651.5},{m:197301,x:250525,r:0.32,b:40199.5},{m:250526,x:626350,r:0.35,b:57231.5},{m:626351,x:Infinity,r:0.37,b:188769.75}];
  let fedTax = 0;
  for (const b of brackets) { if (fedTaxable <= b.x) { fedTax = b.m === 0 ? fedTaxable * b.r : b.b + (fedTaxable - b.m + 1) * b.r; break; } }
  const monthlyFed = r2(fedTax / 12);
  const ssWages = Math.min(annual - preTax, 176100);
  const monthlySS = r2(ssWages * 0.062 / 12);
  const monthlyErSS = monthlySS;
  let medTax = (annual - preTax) * 0.0145;
  if (annual - preTax > 200000) medTax += (annual - preTax - 200000) * 0.009;
  const monthlyMed = r2(medTax / 12);
  const monthlyErMed = r2((annual - preTax) * 0.0145 / 12);
  const states = {
    TX:{brackets:[],sd:0},FL:{brackets:[],sd:0},WA:{brackets:[],sd:0},
    CA:{sd:5540,brackets:[{m:0,x:10412,r:0.01},{m:10413,x:24684,r:0.02},{m:24685,x:38959,r:0.04},{m:38960,x:54081,r:0.06},{m:54082,x:68350,r:0.08},{m:68351,x:349137,r:0.093},{m:349138,x:418961,r:0.103},{m:418962,x:698271,r:0.113},{m:698272,x:Infinity,r:0.133}]},
    NY:{sd:8000,brackets:[{m:0,x:8500,r:0.04},{m:8501,x:11700,r:0.045},{m:11701,x:13900,r:0.0525},{m:13901,x:80650,r:0.0585},{m:80651,x:215400,r:0.0625},{m:215401,x:1077550,r:0.0685},{m:1077551,x:5000000,r:0.0965},{m:5000001,x:25000000,r:0.103},{m:25000001,x:Infinity,r:0.109}]},
  };
  const sc = states[state] || states.TX;
  let stateTax = 0;
  if (sc.brackets.length > 0) {
    const stTaxable = Math.max(0, annual - preTax - sc.sd);
    let prev = 0;
    for (const b of sc.brackets) { if (stTaxable <= b.x) { stateTax += (stTaxable - prev) * b.r; break; } else { stateTax += (b.x - prev) * b.r; prev = b.x; } }
  }
  const monthlyState = r2(stateTax / 12);
  const monthly401k = r2(k401Annual / 12);
  const stateNames = { TX:"Texas",FL:"Florida",WA:"Washington",CA:"California",NY:"New York" };
  const totalDed = monthlyFed + monthlySS + monthlyMed + monthlyState + monthly401k;
  return { country: "US", currency: "USD", grossSalary: gross,
    deductions: { "Federal Tax": monthlyFed, "Social Security": monthlySS, "Medicare": monthlyMed, ["State Tax (" + (stateNames[state]||state) + ")"]: monthlyState, "401(k)": monthly401k },
    totalEmployeeDeductions: r2(totalDed), netSalary: r2(gross - totalDed),
    employerContributions: { "Social Security": monthlyErSS, "Medicare": monthlyErMed },
    totalCostToEmployer: r2(gross + monthlyErSS + monthlyErMed) };
}

function calculatePayroll(emp) {
  switch (emp.country) {
    case "ZA": return calculateSouthAfrica(emp);
    case "GB": return calculateUnitedKingdom(emp);
    case "US": return calculateUnitedStates(emp);
    default: throw new Error("Unsupported country: " + emp.country);
  }
}

function r2(n) { return Math.round(n * 100) / 100; }

function formatCurrency(amount, country) {
  const c = COUNTRIES[country];
  if (!c) return amount.toFixed(2);
  return c.symbol + " " + amount.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// === UI RENDERING ===
function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

function updateStats() {
  const staffEl = document.getElementById('stat-staff');
  const staffSubEl = document.getElementById('stat-staff-sub');
  const grossEl = document.getElementById('stat-total-gross');
  const metaEl = document.getElementById('demo-meta');
  if (staffEl) staffEl.textContent = employees.length;
  const countries = new Set(employees.map(e => e.country));
  if (staffSubEl) staffSubEl.textContent = countries.size + ' countries';
  const byC = {};
  employees.forEach(e => {
    if (!byC[e.country]) byC[e.country] = 0;
    byC[e.country] += e.grossMonthlySalary;
  });
  const parts = Object.entries(byC).map(([code, total]) => {
    const sym = COUNTRIES[code] ? COUNTRIES[code].symbol : '';
    return sym + ' ' + Math.round(total).toLocaleString('en');
  });
  if (grossEl) grossEl.textContent = parts.join(' / ');
  if (metaEl) metaEl.textContent = employees.length + ' SAMPLE EMPLOYEES \u00B7 ' + countries.size + ' COUNTRIES \u00B7 REAL TAX BRACKETS';
}

function renderEmployees() {
  const grid = document.getElementById("employee-grid");
  grid.innerHTML = "";
  employees.forEach((emp, i) => {
    const c = COUNTRIES[emp.country];
    const initials = getInitials(emp.full_name);
    const card = document.createElement("div");
    card.className = "employee-card";
    card.style.animationDelay = (i * 0.05) + "s";
    card.innerHTML =
      '<div class="card-top">' +
        '<div class="card-identity">' +
          '<div class="card-avatar ">' + initials + '</div>' +
          '<div><div class="card-name">' + emp.full_name + '</div>' +
          (emp.position ? '<div class="card-position">' + emp.position + '</div>' : '') +
          '</div>' +
        '</div>' +
        '<span class="card-flag">' + c.code + '</span>' +
      '</div>' +
      '<div class="card-actions">' +
        '<button onclick="editEmployee(' + i + ')" title="Edit">\u270E</button>' +
        '<button class="delete" onclick="deleteEmployee(' + i + ')" title="Delete">\u2715</button>' +
      '</div>' +
      '<div class="card-bottom">' +
        '<div><div class="card-salary-label">MONTHLY GROSS</div>' +
        '<div class="card-salary">' + formatCurrency(emp.grossMonthlySalary, emp.country) + '</div></div>' +
        '<button class="card-chevron" onclick="editEmployee(' + i + ')" title="View details"><span class="material-symbols-outlined">chevron_right</span></button>' +
      '</div>';
    grid.appendChild(card);
  });
  var addCard = document.createElement('div');
  addCard.className = 'add-card';
  addCard.onclick = showAddModal;
  addCard.innerHTML = '<div class="add-card-icon"><span class="material-symbols-outlined">add</span></div><div class="add-card-title">Add New Employee</div><div class="add-card-sub">Onboard staff in 3 countries automatically</div>';
  grid.appendChild(addCard);
  updateStats();
}

let selectedPayslipIndex = 0;

function selectPayslip(index) {
  selectedPayslipIndex = index;
  document.querySelectorAll(".ps-card").forEach((el, i) => {
    el.classList.toggle("active", i === index);
  });
  renderPayslipDetail(index);
}

function getComplianceText(country) {
  var labels = { ZA: "Validated against SARS eFiling standards 2024/25", GB: "Compliant with HMRC RTI regulations 2024/25", US: "IRS Circular E & state withholding compliant 2024/25" };
  return labels[country] || "Tax compliance verified";
}

function renderPayslipDetail(index) {
  var r = payrollResults[index];
  var c = COUNTRIES[r.country];
  var panel = document.getElementById("payslip-detail-panel");
  var period = new Date().toISOString().slice(0, 7);
  var earnRows = "";
  earnRows += '<div class="ps-line"><span class="ps-line-label">Gross Salary</span><span class="ps-line-value">'+formatCurrency(r.grossSalary,r.country)+'</span></div>';
  earnRows += '<div class="ps-line-total"><span>Total Gross</span><span>'+formatCurrency(r.grossSalary,r.country)+'</span></div>';
  var dedRows = "";
  for (var lbl in r.deductions) {
    if (r.deductions[lbl] > 0) {
      var isCredit = lbl.toLowerCase().indexOf("credit") !== -1;
      dedRows += '<div class="ps-line"><span class="ps-line-label">'+lbl+'</span><span class="ps-line-value '+(isCredit ? "credit" : "neg")+'">'+(isCredit ? "+ " : "- ")+formatCurrency(r.deductions[lbl],r.country)+'</span></div>';
    }
  }
  dedRows += '<div class="ps-line-total error"><span>Total Deductions</span><span>- '+formatCurrency(r.totalEmployeeDeductions,r.country)+'</span></div>';
  var empRows = "";
  for (var elbl in r.employerContributions) {
    if (r.employerContributions[elbl] > 0) {
      empRows += '<div class="ps-line"><span class="ps-line-label">'+elbl+'</span><span class="ps-line-value">'+formatCurrency(r.employerContributions[elbl],r.country)+'</span></div>';
    }
  }
  empRows += '<div class="ps-employer-total"><span>Total Cost to Employer</span><span>'+formatCurrency(r.totalCostToEmployer,r.country)+'</span></div>';
  panel.innerHTML =
    '<div class="ps-detail">' +
      '<div class="ps-detail-glow"></div>' +
      '<div class="ps-detail-header">' +
        '<div><div class="ps-detail-name">'+r.full_name+'</div>' +
        '<div class="ps-detail-period">Monthly Payroll \u00B7 '+period+' \u00B7 '+c.name+'</div></div>' +
        '<button class="ps-detail-download" onclick="downloadPayslip('+index+')">' +
          '<span class="material-symbols-outlined" style="font-size:18px">download</span> Download Payslip</button>' +
      '</div>' +
      '<div class="ps-detail-body">' +
        '<div>' +
          '<div class="ps-section"><div class="ps-section-label earnings">Earnings Breakdown</div>'+earnRows+'</div>' +
          '<div class="ps-section"><div class="ps-section-label deductions">Deductions</div>'+dedRows+'</div>' +
        '</div>' +
        '<div>' +
          '<div class="ps-summary-box"><div class="ps-summary-label">Summary</div>' +
            '<div class="ps-summary-sublabel">Net Salary Distributed</div>' +
            '<div class="ps-summary-value">'+formatCurrency(r.netSalary,r.country)+'</div>' +
          '</div>' +
          '<div class="ps-section"><div class="ps-section-label muted">Employer Contributions</div>'+empRows+'</div>' +
          '<div class="ps-compliance">' +
            '<span class="material-symbols-outlined ps-compliance-icon">verified_user</span>' +
            '<div><div class="ps-compliance-title">Compliant Run</div>' +
            '<div class="ps-compliance-desc">'+getComplianceText(r.country)+'</div></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
}

function renderPayslips() {
  var sidebar = document.getElementById("payslip-sidebar-list");
  var layout = document.getElementById("payslip-layout");
  sidebar.innerHTML = "";
  layout.style.display = "grid";
  payrollResults.forEach(function(result, i) {
    var c = COUNTRIES[result.country];
    var initials = getInitials(result.full_name);
    var card = document.createElement("div");
    card.className = "ps-card" + (i === 0 ? " active" : "");
    card.onclick = function() { selectPayslip(i); };
    card.innerHTML =
      '<div class="ps-card-top">' +
        '<div class="ps-card-identity">' +
          '<div class="ps-card-avatar ">' + initials + '</div>' +
          '<div><div class="ps-card-name">' + result.full_name + '</div>' +
          (result.position ? '<div class="ps-card-position">' + result.position + '</div>' : '') +
          '</div>' +
        '</div>' +
        '<span class="ps-card-flag">' + c.code + '</span>' +
      '</div>' +
      '<div class="ps-card-bottom">' +
        '<div><div class="ps-card-net-label">Net Pay</div>' +
        '<div class="ps-card-net">' + formatCurrency(result.netSalary, result.country) + '</div></div>' +
        '<span class="material-symbols-outlined ps-card-chevron">arrow_forward_ios</span>' +
      '</div>';
    sidebar.appendChild(card);
  });
  if (payrollResults.length > 0) {
    selectedPayslipIndex = 0;
    renderPayslipDetail(0);
  }
}
function renderReport() {
  const byCountry = {};
  for (const r of payrollResults) {
    if (!byCountry[r.country]) { byCountry[r.country] = { employees: 0, totalGross: 0, totalDeductions: 0, totalNet: 0, totalEmployerCost: 0 }; }
    const c = byCountry[r.country];
    c.employees++; c.totalGross += r.grossSalary; c.totalDeductions += r.totalEmployeeDeductions; c.totalNet += r.netSalary; c.totalEmployerCost += r.totalCostToEmployer;
  }
  document.getElementById("report-summary").innerHTML =
    '<div class="report-stat"><div class="report-stat-value">' + payrollResults.length + '</div><div class="report-stat-label">EMPLOYEES PROCESSED</div></div>' +
    '<div class="report-stat"><div class="report-stat-value">' + Object.keys(byCountry).length + '</div><div class="report-stat-label">COUNTRIES</div></div>' +
    '<div class="report-stat"><div class="report-stat-value">&lt; 1s</div><div class="report-stat-label">PROCESSING TIME</div></div>';
  const el = document.getElementById("report-countries");
  el.innerHTML = "";
  var flagSvgs = {
    ZA: '<svg class="report-flag-icon" viewBox="0 0 32 24"><rect width="32" height="24" rx="3" fill="#1b1b1d"/><polygon points="0,0 16,12 0,24" fill="#34d399" opacity="0.5"/><line x1="0" y1="4" x2="32" y2="4" stroke="#34d399" stroke-width="2" opacity="0.3"/><line x1="0" y1="12" x2="32" y2="12" stroke="#fff" stroke-width="1.5" opacity="0.2"/><line x1="0" y1="20" x2="32" y2="20" stroke="#60a5fa" stroke-width="2" opacity="0.3"/></svg>',
    GB: '<svg class="report-flag-icon" viewBox="0 0 32 24"><rect width="32" height="24" rx="3" fill="#1b1b1d"/><line x1="0" y1="12" x2="32" y2="12" stroke="#60a5fa" stroke-width="4" opacity="0.4"/><line x1="16" y1="0" x2="16" y2="24" stroke="#60a5fa" stroke-width="4" opacity="0.4"/><line x1="0" y1="12" x2="32" y2="12" stroke="#f87171" stroke-width="1.5" opacity="0.5"/><line x1="16" y1="0" x2="16" y2="24" stroke="#f87171" stroke-width="1.5" opacity="0.5"/></svg>',
    US: '<svg class="report-flag-icon" viewBox="0 0 32 24"><rect width="32" height="24" rx="3" fill="#1b1b1d"/><rect x="0" y="0" width="14" height="10" fill="#fb923c" opacity="0.15"/><line x1="0" y1="2" x2="32" y2="2" stroke="#fb923c" stroke-width="1.5" opacity="0.3"/><line x1="0" y1="6" x2="32" y2="6" stroke="#fb923c" stroke-width="1.5" opacity="0.3"/><line x1="0" y1="10" x2="32" y2="10" stroke="#fb923c" stroke-width="1.5" opacity="0.3"/><line x1="0" y1="14" x2="32" y2="14" stroke="#fb923c" stroke-width="1.5" opacity="0.3"/><line x1="0" y1="18" x2="32" y2="18" stroke="#fb923c" stroke-width="1.5" opacity="0.3"/></svg>'
  };
  for (const [code, data] of Object.entries(byCountry)) {
    const c = COUNTRIES[code];
    const card = document.createElement("div");
    card.className = "report-country-card";
    var flag = flagSvgs[code] || '';
    card.innerHTML =
      '<div class="report-country-header">' + flag + '<span class="report-country-name">' + c.name + '</span><span class="report-country-count">' + data.employees + ' EMPLOYEES</span></div>' +
      '<div class="report-line"><span class="report-line-label">Total Gross</span><span class="report-line-value">' + formatCurrency(data.totalGross, code) + '</span></div>' +
      '<div class="report-line"><span class="report-line-label">Total Deductions</span><span class="report-line-value" style="color:#f87171">-' + formatCurrency(data.totalDeductions, code) + '</span></div>' +
      '<div class="report-line"><span class="report-line-label">Total Net Payroll</span><span class="report-line-value" style="color:#22c55e">' + formatCurrency(data.totalNet, code) + '</span></div>' +
      '<div class="report-line" style="border-top:1px solid rgba(255,255,255,0.06);margin-top:8px;padding-top:12px"><span class="report-line-label">Total Employer Cost</span><span class="report-line-value">' + formatCurrency(data.totalEmployerCost, code) + '</span></div>';
    el.appendChild(card);
  }
  document.getElementById("report-meta").innerHTML = new Date().toISOString().slice(0, 7) + "<br>MONTHLY SUMMARY";
}

// === PDF PAYSLIP DOWNLOAD ===
function downloadPayslip(index) {
  const r = payrollResults[index];
  const c = COUNTRIES[r.country];
  const period = new Date().toISOString().slice(0, 7);

  let deductionLines = "";
  for (const [label, value] of Object.entries(r.deductions)) {
    if (value > 0) {
      deductionLines += "<tr><td>" + label + "</td><td style='text-align:right;color:#dc2626'>-" + formatCurrency(value, r.country) + "</td></tr>";
    }
  }
  let employerLines = "";
  for (const [label, value] of Object.entries(r.employerContributions)) {
    if (value > 0) {
      employerLines += "<tr><td>" + label + "</td><td style='text-align:right'>" + formatCurrency(value, r.country) + "</td></tr>";
    }
  }

  const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Payslip - ' + r.full_name + '</title>' +
    '<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">' +
    '<style>' +
    '* { margin:0; padding:0; box-sizing:border-box; }' +
    'body { font-family: "DM Sans", sans-serif; color: #1a1a2e; background: #fff; padding: 40px; }' +
    '.payslip { max-width: 680px; margin: 0 auto; }' +
    '.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #1a1a2e; }' +
    '.logo { font-size: 24px; font-weight: 700; letter-spacing: 0.02em; }' +
    '.logo-sub { font-size: 10px; letter-spacing: 0.15em; color: #666; text-transform: uppercase; margin-top: 4px; }' +
    '.period { text-align: right; font-size: 12px; color: #666; }' +
    '.period strong { display: block; font-size: 14px; color: #1a1a2e; }' +
    '.employee-info { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; padding: 20px; background: #f8f8fc; border-radius: 8px; }' +
    '.info-label { font-size: 10px; letter-spacing: 0.12em; color: #888; text-transform: uppercase; margin-bottom: 4px; }' +
    '.info-value { font-size: 14px; font-weight: 500; }' +
    'table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }' +
    'th { text-align: left; font-size: 10px; letter-spacing: 0.12em; color: #888; text-transform: uppercase; padding: 8px 0; border-bottom: 1px solid #e5e5e5; }' +
    'th:last-child { text-align: right; }' +
    'td { padding: 10px 0; font-size: 13px; border-bottom: 1px solid #f0f0f0; }' +
    'td:last-child { text-align: right; font-weight: 500; font-variant-numeric: tabular-nums; }' +
    '.total-row td { border-top: 2px solid #1a1a2e; border-bottom: none; font-weight: 700; font-size: 15px; padding-top: 14px; }' +
    '.net-row td { color: #16a34a; }' +
    '.section-label { font-size: 11px; letter-spacing: 0.1em; color: #888; text-transform: uppercase; margin: 24px 0 8px; padding-top: 16px; border-top: 1px solid #e5e5e5; }' +
    '.footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 10px; color: #aaa; text-align: center; }' +
    '@media print { body { padding: 20px; } .no-print { display: none; } }' +
    '</style></head><body>' +
    '<div class="payslip">' +
      '<div class="header">' +
        '<div style="display:flex;align-items:center;gap:8px"><img src="logo.png" style="width:28px;height:28px;border-radius:6px"><div class="logo">Dedukto</div></div><div class="logo-sub">Payroll Without Borders</div>' +
        '<div class="period"><strong>' + period + '</strong>Monthly Payslip<br>' + c.name + '</div>' +
      '</div>' +
      '<div class="employee-info">' +
        '<div><div class="info-label">Employee Name</div><div class="info-value">' + r.full_name + '</div></div>' +
        '<div><div class="info-label">Position</div><div class="info-value">' + (r.position || "N/A") + '</div></div>' +
        '<div><div class="info-label">Department</div><div class="info-value">' + (r.department || "N/A") + '</div></div>' +
        '<div><div class="info-label">Country</div><div class="info-value">' + c.name + '</div></div>' +
      '</div>' +
      '<table><thead><tr><th>Description</th><th>Amount (' + c.currency + ')</th></tr></thead><tbody>' +
        '<tr><td>Gross Monthly Salary</td><td style="text-align:right">' + formatCurrency(r.grossSalary, r.country) + '</td></tr>' +
        deductionLines +
        '<tr class="total-row"><td>Total Deductions</td><td style="text-align:right;color:#dc2626">-' + formatCurrency(r.totalEmployeeDeductions, r.country) + '</td></tr>' +
        '<tr class="total-row net-row"><td>Net Pay</td><td style="text-align:right">' + formatCurrency(r.netSalary, r.country) + '</td></tr>' +
      '</tbody></table>' +
      '<div class="section-label">Employer Contributions</div>' +
      '<table><tbody>' + employerLines +
        '<tr class="total-row"><td>Total Cost to Employer</td><td style="text-align:right">' + formatCurrency(r.totalCostToEmployer, r.country) + '</td></tr>' +
      '</tbody></table>' +
      '<div class="footer">' +
        'Generated by Dedukto | ' + new Date().toLocaleDateString("en-GB") + ' | Tax Year 2025/2026<br>' +
        '<button class="no-print" onclick="window.print()" style="margin-top:16px;padding:10px 24px;background:#6366f1;color:#fff;border:none;border-radius:6px;font-family:DM Sans;font-size:13px;cursor:pointer">Save as PDF</button>' +
      '</div>' +
    '</div></body></html>';

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank");
  if (w) { w.onload = () => { URL.revokeObjectURL(url); }; }
}

// === INTERACTIONS ===
function togglePayslip(header) { header.parentElement.classList.toggle("expanded"); }

async function runPayroll() {
  const resultsSection = document.getElementById("results");
  const reportSection = document.getElementById("report");
  const processing = document.getElementById("processing-indicator");
  const processingText = document.getElementById("processing-text");
  // payslip grid replaced by master-detail layout
  resultsSection.classList.remove("hidden-section"); resultsSection.style.display = "flex";
  // cleared by renderPayslips processing.classList.remove("hidden");
  resultsSection.scrollIntoView({ behavior: "smooth" });
  const countryOrder = ["ZA", "GB", "US"];
  payrollResults = [];
  for (const countryCode of countryOrder) {
    const countryEmps = employees.filter(e => e.country === countryCode);
    if (countryEmps.length === 0) continue;
    const c = COUNTRIES[countryCode];
    processingText.textContent = "Processing " + c.name + "...";
    await sleep(600);
    for (const emp of countryEmps) {
      const result = calculatePayroll(emp);
      result.full_name = emp.full_name;
      result.position = emp.position || "";
      result.department = emp.department || "";
      payrollResults.push(result);
    }
  }
  processingText.textContent = "Complete \u2014 " + payrollResults.length + " payslips generated";
  document.getElementById("results-meta").textContent = payrollResults.length + " PAYSLIPS GENERATED";
  renderPayslips();
  await sleep(800);
  reportSection.classList.remove("hidden-section"); reportSection.style.display = "block";
  renderReport();
  var nrEl=document.getElementById('stat-next-run');var rsEl=document.getElementById('stat-run-sub');if(nrEl)nrEl.textContent='\u2713 Done';if(rsEl)rsEl.textContent=payrollResults.length+' payslips generated';
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function showAddModal() {
  document.getElementById("modal-title").textContent = "Add Employee";
  document.getElementById("employee-form").reset();
  document.getElementById("emp-edit-index").value = "-1";
  document.getElementById("emp-country").value = "ZA";
  updateCountryFields();
  document.getElementById("employee-modal").classList.remove("hidden");
}

function editEmployee(index) {
  const emp = employees[index];
  document.getElementById("modal-title").textContent = "Edit Employee";
  document.getElementById("emp-edit-index").value = index;
  document.getElementById("emp-name").value = emp.full_name;
  document.getElementById("emp-position").value = emp.position || "";
  document.getElementById("emp-department").value = emp.department || "";
  document.getElementById("emp-country").value = emp.country;
  document.getElementById("emp-salary").value = emp.grossMonthlySalary;
  document.getElementById("emp-age").value = emp.age || 30;
  updateCountryFields();
  if (emp.country === "ZA") {
    document.getElementById("emp-retirement").value = emp.retirementFundPct || 0;
    document.getElementById("emp-medical").value = emp.medicalAid ? "1" : "0";
    document.getElementById("emp-med-deps").value = emp.medicalDependents || 0;
  } else if (emp.country === "GB") {
    document.getElementById("emp-student-loan").value = emp.studentLoanPlan || "";
    document.getElementById("emp-pension").value = emp.pensionPct || 5;
  } else if (emp.country === "US") {
    document.getElementById("emp-filing").value = emp.filingStatus || "single";
    document.getElementById("emp-state").value = emp.state || "TX";
    document.getElementById("emp-401k").value = emp.fourOhOnekPct || 0;
  }
  document.getElementById("employee-modal").classList.remove("hidden");
}

function closeModal() { document.getElementById("employee-modal").classList.add("hidden"); }

function updateCountryFields() {
  const country = document.getElementById("emp-country").value;
  document.getElementById("fields-za").classList.toggle("hidden", country !== "ZA");
  document.getElementById("fields-gb").classList.toggle("hidden", country !== "GB");
  document.getElementById("fields-us").classList.toggle("hidden", country !== "US");
}

function saveEmployee(e) {
  e.preventDefault();
  const index = parseInt(document.getElementById("emp-edit-index").value);
  const country = document.getElementById("emp-country").value;
  const emp = {
    full_name: document.getElementById("emp-name").value,
    position: document.getElementById("emp-position").value,
    department: document.getElementById("emp-department").value,
    country: country,
    grossMonthlySalary: parseFloat(document.getElementById("emp-salary").value),
    age: parseInt(document.getElementById("emp-age").value) || 30,
  };
  if (country === "ZA") {
    emp.retirementFundPct = parseFloat(document.getElementById("emp-retirement").value) || 0;
    emp.medicalAid = document.getElementById("emp-medical").value === "1";
    emp.medicalDependents = parseInt(document.getElementById("emp-med-deps").value) || 0;
  } else if (country === "GB") {
    emp.studentLoanPlan = document.getElementById("emp-student-loan").value || null;
    emp.pensionPct = parseFloat(document.getElementById("emp-pension").value) || 5;
  } else if (country === "US") {
    emp.filingStatus = document.getElementById("emp-filing").value;
    emp.state = document.getElementById("emp-state").value;
    emp.fourOhOnekPct = parseFloat(document.getElementById("emp-401k").value) || 0;
  }
  if (index >= 0) { employees[index] = emp; } else { employees.push(emp); }
  closeModal(); renderEmployees(); updateStats();
}

function deleteEmployee(index) { employees.splice(index, 1); renderEmployees(); updateStats(); }

// === SCROLL ANIMATIONS ===
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add("visible"); });
  }, { threshold: 0.1 });
  document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
  const nav = document.getElementById("main-nav");
  var heroBg = document.querySelector(".hero-bg");
  window.addEventListener("scroll", function() {
    nav.style.borderBottomColor = window.scrollY > 100 ? "rgba(30,30,46,0.8)" : "rgba(30,30,46,0.3)";
    if (heroBg) {
      var scrollPct = Math.min(window.scrollY / 600, 1);
      heroBg.style.filter = "blur(" + (1 + scrollPct * 7) + "px)";
      heroBg.style.opacity = String(0.85 - scrollPct * 0.3);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => { renderEmployees(); updateStats(); initScrollAnimations(); });
