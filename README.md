# Dedukto

**Open-source multi-country payroll calculation engine built on n8n.**

Dedukto calculates gross-to-net pay across **South Africa, United Kingdom, and United States** tax jurisdictions with real statutory deductions. Self-hostable, open-source, and designed for small firms that cannot afford enterprise payroll software.

---

## What It Does

Send employee data to the n8n webhook. Dedukto validates fields per country, routes to the correct jurisdiction, calculates all statutory deductions, and returns a complete payslip breakdown.

```
Employee Data --> Validate --> Route by Country --> Calculate Tax --> Payslip
                                   |
                    +--------------+--------------+
                    |              |              |
                 ZA: PAYE       GB: Income     US: Federal
                    UIF           Tax              State
                    SDL           NI               FICA
                    Medical       Pension          401(k)
                    Retirement    Student Loan
```

---

## Supported Jurisdictions

### South Africa (2025/2026 Tax Year)
- **PAYE** - Progressive income tax (18% to 45%, 7 brackets)
- **UIF** - 1% of remuneration (capped at R17,712/month)
- **SDL** - 1% employer levy
- **Medical Aid Tax Credits** - R364/month main member + dependents
- **Retirement Fund** - Tax-deductible up to 27.5% of remuneration (R350,000 annual cap)

### United Kingdom (2025/2026 Tax Year)
- **Income Tax** - 20% basic, 40% higher, 45% additional (personal allowance taper above GBP 100,000)
- **National Insurance** - 8% employee (GBP 12,570-50,270), 2% above; 15% employer
- **Student Loan** - Plans 1, 2, 4, 5, and Postgraduate
- **Workplace Pension** - 5% employee + 3% employer auto-enrolment defaults

### United States (2025 Tax Year)
- **Federal Income Tax** - 7 brackets (10% to 37%), Single and Married Filing Jointly
- **Social Security** - 6.2% employee + employer (capped at $176,100)
- **Medicare** - 1.45% + 0.9% Additional Medicare Tax above $200,000
- **State Tax** - Texas (0%), California (up to 13.3%), New York (up to 10.9%)
- **401(k)** - Pre-tax with $23,500 limit + SECURE 2.0 catch-up provisions

---

## Quick Start

### 1. Run n8n
```bash
npx n8n
```
Opens at `http://localhost:5678`

### 2. Import the Workflow
- Open n8n UI
- Go to **Workflows > Import from File**
- Select `workflows/global-payroll-processor.json`

### 3. Trigger with Sample Data
```bash
curl -X POST http://localhost:5678/webhook/payroll-run \
  -H "Content-Type: application/json" \
  -d @sample-data/employees.json
```

### 4. Run Tests (No n8n Required)
```bash
npm test
```

---

## Project Structure

```
Dedukto/
  tax-logic/
    index.js                 # Unified entry point (route by country)
    south-africa.js          # SARS PAYE + UIF + SDL + credits
    united-kingdom.js        # HMRC Income Tax + NI + pension
    united-states.js         # IRS Federal + State + FICA + 401(k)
    test-calculations.js     # 31 tests across all 3 jurisdictions
  workflows/
    global-payroll-processor.json   # Main n8n workflow
  sample-data/
    employees.json           # 9 sample employees (3 per country)
  docs/
    payslip-sample.md        # Example output
  package.json
  README.md
```

---

## Payslip Output Format

Every calculation returns a structured payslip:

```json
{
  "country": "ZA",
  "currency": "ZAR",
  "payPeriod": "2026-04",
  "grossSalary": 55000,
  "deductions": {
    "paye": 10889.64,
    "uif_employee": 177.12,
    "retirement_fund": 4125,
    "medical_aid_credit": 728
  },
  "totalEmployeeDeductions": 15191.76,
  "netSalary": 39808.24,
  "employerContributions": {
    "uif_employer": 177.12,
    "sdl": 550
  },
  "totalCostToEmployer": 55727.12,
  "taxDetails": {
    "annualGross": 660000,
    "effectiveTaxRate": 19.81
  }
}
```

---

## Why Dedukto?

| Feature | Enterprise Payroll (Deel, PaySpace, Sage) | Dedukto |
|---------|------------------------------------------|---------|
| **Cost** | $12-99/employee/month | Free (open-source) |
| **Self-hostable** | No (cloud SaaS) | Yes (`npx n8n`) |
| **Multi-country** | Yes (locked behind subscription) | Yes (open, auditable code) |
| **Tax logic** | Black box | Transparent JavaScript with source comments |
| **Customizable** | Limited | Fork and modify any calculation |
| **No vendor lock-in** | Tied to platform | Export workflow JSON anytime |

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| **n8n over custom API** | Visual workflow canvas makes the automation auditable and demonstrable |
| **JavaScript Code nodes** | Tax logic is testable outside n8n and portable to any JS runtime |
| **Separate calculation modules** | Each country's tax logic is isolated, testable, and independently updatable |
| **Real tax brackets** | Uses current 2025/2026 rates from SARS, HMRC, and IRS official sources |
| **Employer cost included** | Total cost to employer is calculated alongside employee net for full visibility |

---

## Tax Year Updates

When a new tax year begins, update the constants at the top of each file:

- `tax-logic/south-africa.js` - PAYE brackets, rebates, UIF cap, medical credits
- `tax-logic/united-kingdom.js` - Income tax bands, NI thresholds, student loan thresholds
- `tax-logic/united-states.js` - Federal brackets, standard deduction, SS wage cap, state brackets

Run `npm test` after updating to verify all calculations.

---

## License

MIT

## Author

**Tshepiso Jafta** - [LinkedIn](https://www.linkedin.com/in/tshepisojafta/)