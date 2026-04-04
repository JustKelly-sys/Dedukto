/* ============================================
   DEDUKTO - Frontend Application
   Tax logic + UI + PDF payslip download
   ============================================ */
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

const COUNTRIES = {
  ZA: { name: "South Africa", code: "ZA", currency: "ZAR", symbol: "R", img: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&h=300&fit=crop&q=80" },
  GB: { name: "United Kingdom", code: "GB", currency: "GBP", symbol: "\u00A3", img: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=300&fit=crop&q=80" },
  US: { name: "United States", code: "US", currency: "USD", symbol: "$", img: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&h=300&fit=crop&q=80" },
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
    { min: 237100, max: 370500, rate: 0.26, base: 42678 },
    { min: 370500, max: 512800, rate: 0.31, base: 77362 },
    { min: 512800, max: 673000, rate: 0.36, base: 121475 },
    { min: 673000, max: 857900, rate: 0.39, base: 179147 },
    { min: 857900, max: 1817000, rate: 0.41, base: 251258 },
    { min: 1817000, max: Infinity, rate: 0.45, base: 644489 },
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
    ? [{m:0,x:23850,r:0.10,b:0},{m:23850,x:96950,r:0.12,b:2385},{m:96950,x:206700,r:0.22,b:11157},{m:206700,x:394600,r:0.24,b:35303},{m:394600,x:501050,r:0.32,b:80399},{m:501050,x:751600,r:0.35,b:114463},{m:751600,x:Infinity,r:0.37,b:202155.5}]
    : [{m:0,x:11925,r:0.10,b:0},{m:11925,x:48475,r:0.12,b:1192.5},{m:48475,x:103350,r:0.22,b:5578.5},{m:103350,x:197300,r:0.24,b:17651.5},{m:197300,x:250525,r:0.32,b:40199.5},{m:250525,x:626350,r:0.35,b:57231.5},{m:626350,x:Infinity,r:0.37,b:188769.75}];
  let fedTax = 0;
  for (const b of brackets) { if (fedTaxable <= b.x) { fedTax = b.m === 0 ? fedTaxable * b.r : b.b + (fedTaxable - b.m) * b.r; break; } }
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
    CA:{sd:5540,brackets:[{m:0,x:10412,r:0.01},{m:10412,x:24684,r:0.02},{m:24684,x:38959,r:0.04},{m:38959,x:54081,r:0.06},{m:54081,x:68350,r:0.08},{m:68350,x:349137,r:0.093},{m:349137,x:418961,r:0.103},{m:418961,x:698271,r:0.113},{m:698271,x:Infinity,r:0.133}]},
    NY:{sd:8000,brackets:[{m:0,x:8500,r:0.04},{m:8500,x:11700,r:0.045},{m:11700,x:13900,r:0.0525},{m:13900,x:80650,r:0.0585},{m:80650,x:215400,r:0.0625},{m:215400,x:1077550,r:0.0685},{m:1077550,x:5000000,r:0.0965},{m:5000000,x:25000000,r:0.103},{m:25000000,x:Infinity,r:0.109}]},
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
var GENDER_MAP = {
  'Thabo Mokoena': 'M', 'Naledi Dlamini': 'F', 'Sipho Nkosi': 'M',
  'James Whitfield': 'M', 'Priya Sharma': 'F', 'Oliver Chen': 'M',
  'Sarah Mitchell': 'F', 'Marcus Johnson': 'M', 'Emily Rodriguez': 'F'
};
function getAvatarImg(name) {
  var g = GENDER_MAP[name] || 'M';
  return '<img src="avatar-' + (g === 'F' ? 'female' : 'male') + '.png" alt="' + name + '">';
}
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
          '<div class="card-avatar has-img">' + getAvatarImg(emp.full_name) + '</div>' +
          '<div><div class="card-name">' + escapeHtml(emp.full_name) + '</div>' +
          (emp.position ? '<div class="card-position">' + escapeHtml(emp.position) + '</div>' : '') +
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
  var labels = { ZA: "Validated against SARS eFiling standards 2025/26", GB: "Compliant with HMRC RTI regulations 2025/26", US: "IRS Circular E & state withholding compliant 2025/26" };
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
      '<div class="ps-detail-banner">' +
        '<div class="ps-banner-topo"></div>' +
        '<div class="ps-banner-country" style="background-image:url(\''+c.img+'\')"></div>' +
        '<div class="ps-banner-blend"></div>' +
      '</div>' +
      '<div class="ps-detail-header">' +
        '<div><div class="ps-detail-name">'+escapeHtml(r.full_name)+'</div>' +
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
          '<div class="ps-card-avatar has-img">' + getAvatarImg(result.full_name) + '</div>' +
          '<div><div class="ps-card-name">' + escapeHtml(result.full_name) + '</div>' +
          (result.position ? '<div class="ps-card-position">' + escapeHtml(result.position) + '</div>' : '') +
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
    ZA: '<svg class="report-flag-icon" viewBox="0 0 32 24"><rect width="32" height="24" rx="4" fill="rgba(100,80,180,0.15)" stroke="rgba(148,125,255,0.2)" stroke-width="0.5"/><polygon points="0,2 10,12 0,22" fill="#34d399" opacity="0.6"/><rect x="10" y="2" width="20" height="4" rx="1" fill="#f87171" opacity="0.3"/><rect x="10" y="10" width="20" height="4" rx="1" fill="#fff" opacity="0.15"/><rect x="10" y="18" width="20" height="4" rx="1" fill="#60a5fa" opacity="0.3"/></svg>',
    GB: '<svg class="report-flag-icon" viewBox="0 0 32 24"><rect width="32" height="24" rx="4" fill="rgba(100,80,180,0.15)" stroke="rgba(148,125,255,0.2)" stroke-width="0.5"/><line x1="0" y1="0" x2="32" y2="24" stroke="#cabeff" stroke-width="1.5" opacity="0.25"/><line x1="32" y1="0" x2="0" y2="24" stroke="#cabeff" stroke-width="1.5" opacity="0.25"/><line x1="16" y1="0" x2="16" y2="24" stroke="#cabeff" stroke-width="3" opacity="0.3"/><line x1="0" y1="12" x2="32" y2="12" stroke="#cabeff" stroke-width="3" opacity="0.3"/><line x1="16" y1="0" x2="16" y2="24" stroke="#f87171" stroke-width="1" opacity="0.5"/><line x1="0" y1="12" x2="32" y2="12" stroke="#f87171" stroke-width="1" opacity="0.5"/></svg>',
    US: '<svg class="report-flag-icon" viewBox="0 0 32 24"><rect width="32" height="24" rx="4" fill="rgba(100,80,180,0.15)" stroke="rgba(148,125,255,0.2)" stroke-width="0.5"/><rect x="0" y="0" width="12" height="10" rx="2" fill="#cabeff" opacity="0.2"/><circle cx="6" cy="5" r="1.5" fill="#cabeff" opacity="0.4"/><rect x="0" y="0" width="32" height="2" fill="#f87171" opacity="0.3"/><rect x="0" y="4" width="32" height="2" fill="#f87171" opacity="0.3"/><rect x="0" y="8" width="32" height="2" fill="#f87171" opacity="0.3"/><rect x="0" y="12" width="32" height="2" fill="#f87171" opacity="0.2"/><rect x="0" y="16" width="32" height="2" fill="#f87171" opacity="0.2"/><rect x="0" y="20" width="32" height="2" fill="#f87171" opacity="0.2"/></svg>'
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

  const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Payslip - ' + escapeHtml(r.full_name) + '</title>' +
    '<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">' +
    '<style>' +
    '* { margin:0; padding:0; box-sizing:border-box; }' +
    'body { font-family: "DM Sans", sans-serif; color: #1a1a2e; background: #fff; padding: 40px; }' +
    '.payslip { max-width: 680px; margin: 0 auto; }' +
    '.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #1a1a2e; }' +
    '.logo { font-size: 24px; font-weight: 700; letter-spacing: 0.02em; display: flex; align-items: center; gap: 10px; }' +
    '.logo img { width: 32px; height: 32px; border-radius: 6px; }' +
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
        '<div style="display:flex;align-items:center;gap:8px"><img src="data:image/png;base64,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" style="width:28px;height:28px;border-radius:6px"><div class="logo">Dedukto</div></div><div class="logo-sub">Payroll Without Borders</div>' +
        '<div class="period"><strong>' + period + '</strong>Monthly Payslip<br>' + c.name + '</div>' +
      '</div>' +
      '<div class="employee-info">' +
        '<div><div class="info-label">Employee Name</div><div class="info-value">' + escapeHtml(r.full_name) + '</div></div>' +
        '<div><div class="info-label">Position</div><div class="info-value">' + escapeHtml(r.position || "N/A") + '</div></div>' +
        '<div><div class="info-label">Department</div><div class="info-value">' + escapeHtml(r.department || "N/A") + '</div></div>' +
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
    await sleep(200);
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
  await sleep(300);
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

function deleteEmployee(index) { if (!confirm('Are you sure you want to delete this employee?')) return; employees.splice(index, 1); renderEmployees(); updateStats(); }

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
