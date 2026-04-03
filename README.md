<p align="center">
  <img src="frontend/logo.png" alt="Dedukto" width="80" height="80" style="border-radius: 16px;">
</p>

<h1 align="center">Dedukto</h1>

<p align="center">
  <strong>Open-source multi-country payroll engine with real tax calculations.</strong><br>
  Gross-to-net across South Africa, United Kingdom, and United States — built on n8n.
</p>

<p align="center">
  <a href="https://justkelly-sys.github.io/Dedukto/frontend/">Live Demo</a> · 
  <a href="#supported-jurisdictions">Jurisdictions</a> · 
  <a href="#quick-start">Quick Start</a> · 
  <a href="#architecture">Architecture</a>
</p>

---

## Overview

Dedukto is a precision-engineered payroll calculation engine that handles statutory deductions across three major tax jurisdictions. It ships with a fully interactive frontend demo featuring live payroll processing, downloadable PDF payslips, and a multi-country compliance report.

**Built for transparency.** Every tax bracket, rebate, and threshold is implemented in auditable JavaScript with source comments referencing official SARS, HMRC, and IRS documentation.

### Key Features

- **Real Tax Calculations** — Current 2025/2026 brackets from official government sources
- **3 Jurisdictions** — South Africa (PAYE, UIF, SDL), United Kingdom (Income Tax, NI, Pension), United States (Federal, State, FICA, 401(k))
- **Interactive Frontend** — Purple liquid-glass UI with live payroll processing, master-detail payslips, and PDF export
- **Compliance Report** — Aggregated multi-country summary with per-jurisdiction breakdowns
- **Self-Hostable** — Run entirely on your own infrastructure via n8n
- **31 Unit Tests** — Full test coverage across all tax calculations

---

## Live Demo

**[→ Try the live demo](https://justkelly-sys.github.io/Dedukto/frontend/)**

The demo includes 9 pre-loaded sample employees across ZA, GB, and US. Click **Run Payroll** to process all employees and generate payslips with real tax calculations.

### Demo Features

| Feature | Description |
|---------|-------------|
| **Payroll Workspace** | Employee grid with country badges, salary display, add/edit/delete |
| **Live Processing** | One-click payroll run with animated progress |
| **Master-Detail Payslips** | Sidebar navigation with full earnings/deductions breakdown |
| **PDF Export** | Download individual payslips as formatted PDFs with company branding |
| **Compliance Report** | Summary stats + per-country aggregation (gross, deductions, net, employer cost) |
| **Jurisdiction Browser** | Deep-dive into each country's tax logic with bracket tables |

---

## Supported Jurisdictions

### South Africa (2025/2026 Tax Year)

| Component | Rate |
|-----------|------|
| **PAYE** | Progressive 18% to 45% (7 brackets) |
| **UIF** | 1% employee + 1% employer (capped R17,712/mo) |
| **SDL** | 1% employer levy |
| **Medical Aid Credits** | R364/mo main member + dependents |
| **Retirement Fund** | Deductible up to 27.5% (R350k annual cap) |

### United Kingdom (2025/2026 Tax Year)

| Component | Rate |
|-----------|------|
| **Income Tax** | 20% basic / 40% higher / 45% additional |
| **National Insurance** | 8% employee, 2% above; 15% employer |
| **Student Loan** | Plans 1, 2, 4, 5 + Postgraduate |
| **Workplace Pension** | 5% employee + 3% employer (auto-enrolment) |

### United States (2025 Tax Year)

| Component | Rate |
|-----------|------|
| **Federal Income Tax** | 10% to 37% (7 brackets), Single + MFJ |
| **Social Security** | 6.2% employee + employer (capped $176,100) |
| **Medicare** | 1.45% + 0.9% Additional above $200k |
| **State Tax** | TX (0%), CA (up to 13.3%), NY (up to 10.9%) |
| **401(k)** | Pre-tax, $23,500 limit + SECURE 2.0 catch-up |

---

## Quick Start

### Run the Frontend Demo (No Backend Required)

```bash
git clone https://github.com/JustKelly-sys/Dedukto.git
cd Dedukto
npx serve frontend -l 3000
```

Open `http://localhost:3000` — all tax calculations run client-side.

### Run with n8n (Full Workflow)

```bash
# 1. Start n8n
npx n8n

# 2. Import workflow via n8n UI
#    Workflows > Import from File > workflows/global-payroll-processor.json

# 3. Trigger via webhook
curl -X POST http://localhost:5678/webhook/payroll-run \
  -H "Content-Type: application/json" \
  -d @sample-data/employees.json
```

### Run Tests

```bash
npm test
# 31 tests across all 3 jurisdictions
```

---

## Architecture

```
Dedukto/
├── frontend/                    # Interactive UI (vanilla HTML/CSS/JS)
│   ├── index.html               # Single-page app shell
│   ├── style.css                # Tectonic Ledger design system
│   ├── app.js                   # Tax engine + UI + PDF generation
│   ├── logo.png                 # Brand mark
│   ├── hero-bg.png              # Topology background
│   ├── avatar-male.png          # Professional avatar (male)
│   └── avatar-female.png        # Professional avatar (female)
├── tax-logic/
│   ├── index.js                 # Unified entry (route by country)
│   ├── south-africa.js          # SARS PAYE + UIF + SDL + credits
│   ├── united-kingdom.js        # HMRC Income Tax + NI + pension
│   ├── united-states.js         # IRS Federal + State + FICA + 401(k)
│   └── test-calculations.js     # 31 unit tests
├── workflows/
│   └── global-payroll-processor.json   # n8n workflow
├── sample-data/
│   └── employees.json           # 9 employees (3 per country)
└── README.md
```

### Data Flow

```
Employee Data → Validate → Route by Country → Calculate Tax → Payslip
                                 │
                  ┌──────────────┼──────────────┐
                  │              │              │
               ZA: PAYE       GB: Income     US: Federal
                  UIF           Tax              State
                  SDL           NI               FICA
                  Medical       Pension          401(k)
                  Retirement    Student Loan
```

---


## n8n Workflow

Dedukto's backend is a visual n8n automation workflow. Here's what it looks like:

<p align="center">
  <img src="docs/n8n-workflow.png" alt="Dedukto n8n Workflow" width="800">
</p>

> **Recruiters:** You don't need to install anything to view this. The workflow JSON is in [`workflows/global-payroll-processor.json`](workflows/global-payroll-processor.json) and can be imported into any [n8n instance](https://n8n.io) or viewed directly on GitHub.

### Workflow Flow (Mermaid)

```mermaid
graph LR
    A["Webhook<br/>Payroll Intake"] --> B["Code<br/>Validate Fields"]
    B --> C{"If<br/>Is Valid?"}
    C -->|Invalid| D["Response<br/>Return Error"]
    C -->|Valid| E["Switch<br/>Route by Country"]
    E -->|ZA| F["Code<br/>Calculate ZA Tax<br/><i>PAYE + UIF + SDL</i>"]
    E -->|GB| G["Code<br/>Calculate GB Tax<br/><i>Income Tax + NI</i>"]
    E -->|US| H["Code<br/>Calculate US Tax<br/><i>Federal + State + FICA</i>"]
    F --> I["Merge<br/>Merge Payslips"]
    G --> I
    H --> I
    I --> J["Response<br/>Return Payslips"]

    style A fill:#2d6a4f,stroke:#40916c,color:#fff
    style D fill:#9d0208,stroke:#d00000,color:#fff
    style E fill:#7b2cbf,stroke:#9d4edd,color:#fff
    style F fill:#fb8500,stroke:#ffb703,color:#fff
    style G fill:#fb8500,stroke:#ffb703,color:#fff
    style H fill:#fb8500,stroke:#ffb703,color:#fff
    style J fill:#2d6a4f,stroke:#40916c,color:#fff
```

### How to View the Workflow

| Method | Effort | Link |
|--------|--------|------|
| **View diagram above** | Zero | Scroll up |
| **View JSON on GitHub** | Zero | [`global-payroll-processor.json`](workflows/global-payroll-processor.json) |
| **Import into n8n Cloud** | 2 min | Sign up at [n8n.io](https://n8n.io), import the JSON |
| **Run locally** | 5 min | `npx n8n` then import via UI |

---

## Payslip Output

Every calculation returns a structured payslip:

```json
{
  "country": "ZA",
  "currency": "ZAR",
  "grossSalary": 55000,
  "deductions": {
    "paye": 10889.64,
    "uif_employee": 177.12,
    "retirement_fund": 4125,
    "medical_aid_credit": -728
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
    "effectiveTaxRate": "19.81%"
  }
}
```

---

## Why Dedukto?

| | Enterprise Payroll | Dedukto |
|---|---|---|
| **Cost** | $12-99/employee/month | Free and open-source |
| **Self-hostable** | No (cloud SaaS) | Yes (npx n8n) |
| **Tax logic** | Black box | Transparent, commented JS |
| **Multi-country** | Behind subscription | Open and auditable |
| **Customizable** | Limited | Fork any calculation |
| **Vendor lock-in** | Platform-dependent | Export JSON anytime |

---

## Design System

The frontend implements the **Tectonic Ledger** design system:

- **Palette** — Obsidian dark (#0e0e10) with lavender accents (#947dff, #cabeff)
- **Typography** — DM Sans (body) + Space Grotesk (headlines) via Google Fonts
- **Surface Treatment** — Purple liquid-glass (rgba purple tint + backdrop-filter blur)
- **Components** — Glassmorphic cards, SVG flag icons, professional silhouette avatars
- **Background** — Topology contour map with scroll-triggered blur effect

---

## Updating Tax Rates

When a new tax year begins, update the constants at the top of each file:

| File | What to Update |
|------|---------------|
| `tax-logic/south-africa.js` | PAYE brackets, rebates, UIF cap, medical credits |
| `tax-logic/united-kingdom.js` | Income tax bands, NI thresholds, student loan thresholds |
| `tax-logic/united-states.js` | Federal brackets, standard deduction, SS wage cap, state brackets |

Run `npm test` after to verify calculations.

---

## License

MIT

## Author

**Tshepiso Jafta** — [LinkedIn](https://www.linkedin.com/in/tshepisojafta/)