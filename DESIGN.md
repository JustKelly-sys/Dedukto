# Dedukto — Design System & UI Architecture

> **Stitch Project:** Global Payroll Engine  
> **Design System:** Tectonic Ledger  
> **Creative North Star:** "The Digital Architect"  
> **Last Updated:** 2026-04-03  
> **Stitch Project ID:** `13734644426462014317`

---

## Table of Contents

1. [Overview & Philosophy](#1-overview--philosophy)
2. [Screen Inventory](#2-screen-inventory)
3. [Design Tokens](#3-design-tokens)
4. [Typography System](#4-typography-system)
5. [Color Architecture](#5-color-architecture)
6. [Elevation & Depth](#6-elevation--depth)
7. [Component Specifications](#7-component-specifications)
8. [Layout & Spacing](#8-layout--spacing)
9. [Implementation Gap Analysis](#9-implementation-gap-analysis)
10. [Design Principles](#10-design-principles)

---

## 1. Overview & Philosophy

Dedukto's interface is engineered as a **premium financial terminal** — not a generic SaaS dashboard. The design system ("Tectonic Ledger") treats the UI as a sophisticated, multi-dimensional workspace where precision meets transparency.

### Core Tenets

- **Deep Ink Environment:** The interface lives on obsidian-dark surfaces that feel infinite and deep. No pure black (`#000000`) is ever used.
- **Tonal Layering > Borders:** Card boundaries are defined through background color shifts, not structural lines. This creates soft, integrated edges.
- **Editorial Influence:** High-contrast typography scales, intentional asymmetry in grid placement, and generous whitespace create calm authority.
- **Financial Terminal Aesthetic:** Wide tracking for labels, tabular numerics for financial figures, and status badges that feel data-native.

---

## 2. Screen Inventory

The Stitch project contains **19 screens** across 4 refined design compositions plus reference screenshots and mobile variants.

### Primary Screens (Refined — Design Source of Truth)

| Screen | Dimensions | Device | Purpose |
|--------|-----------|--------|---------|
| **Dedukto Landing Page — Refined** | 2560 × 7248 | Desktop | Hero, features, infrastructure, CTA |
| **Employee Demo Dashboard — Refined** | 2560 × 3332 | Desktop | Payroll workspace with employee cards, stats, compliance registry |
| **Payslips Management — Refined** | 2560 × 2456 | Desktop | Employee list, detailed payslip breakdown, download CTA |
| **Tax Jurisdictions Overview — Refined** | 2560 × 4912 | Desktop | Country cards with jurisdiction details, code examples |

### First-Draft Screens (Superseded)

| Screen | Notes |
|--------|-------|
| Dedukto Landing Page (v1) | 2560 × 6686 — initial layout |
| Employee Demo Dashboard (v1) | 2560 × 3056 — initial dashboard concept |
| Tax Jurisdictions Overview (v1) | 2560 × 3906 — initial jurisdictions |
| Payslips Management (v1) | 2720 × 2470 — initial payslip concept |
| Payslips Management (1365×768) | Compact variant screenshot |
| Payslips Management (1051×1008) | Compact variant screenshot |

### Mobile Screens

| Screen | Dimensions |
|--------|-----------|
| Untitled Prototype | 390 × 884 |
| Dedukto Landing Page — Mobile | 390 × 884 |
| Dedukto Payroll Platform — Mobile | 390 × 884 |

### Reference Screenshots (from current frontend)

| File | Resolution | Content |
|------|-----------|---------|
| Screenshot 2026-04-03 024631.png | 1920 × 1080 | Current frontend hero |
| Screenshot 2026-04-03 024707.png | 1920 × 1080 | Current frontend demo |
| Screenshot 2026-04-03 032255.png | 1920 × 1080 | Current frontend payslips |
| Screenshot 2026-04-03 032305.png | 1920 × 1080 | Current frontend report |
| Screenshot 2026-04-03 032315.png | 1920 × 1080 | Current frontend jurisdictions |
| Screenshot 2026-04-03 040022.png | 1920 × 1080 | Current frontend full page |

---

## 3. Design Tokens

### Core Tokens (from Tectonic Ledger)

```css
/* === BRAND === */
--primary:                  #cabeff    /* Lavender — high-intent actions, brand moments */
--primary-container:        #947dff    /* Data badges, gradient endpoints */
--custom-color:             #7C5CFF    /* Override accent — electric indigo */

/* === SURFACE HIERARCHY === */
--surface:                  #131315    /* Base canvas — infinite, deep */
--surface-dim:              #131315    /* Matching base */
--surface-container-lowest: #0e0e10    /* Recessed areas (input carved) */
--surface-container-low:    #1b1b1d    /* Secondary sections */
--surface-container:        #1f1f21    /* Default container */
--surface-container-high:   #2a2a2c    /* Interactive/card layer */
--surface-container-highest:#353437    /* Closest to user — elevated elements */
--surface-bright:           #39393b    /* Hover highlights */
--surface-variant:          #353437    /* Variant backgrounds */

/* === TEXT === */
--on-surface:               #e4e2e4    /* Primary text */
--on-surface-variant:       #c9c4d8    /* Secondary text */
--on-background:            #e4e2e4    /* Body text on base */
--on-primary:               #31009a    /* Text on primary surfaces */

/* === SEMANTIC === */
--error:                    #ffb4ab    /* Error state */
--error-container:          #93000a    /* Error bg */
--outline:                  #938ea1    /* Subtle structural lines */
--outline-variant:          #484555    /* Ghost borders */

/* === SECONDARY & TERTIARY === */
--secondary:                #c0c6d9    /* Subdued text, captions */
--secondary-container:      #404756    /* Secondary badges */
--tertiary:                 #c7c6c6    /* Neutral accents */
--tertiary-container:       #909191    /* Neutral chips */

/* === INVERSE (Light overlays) === */
--inverse-surface:          #e4e2e4
--inverse-on-surface:       #303032
--inverse-primary:          #603ce2
```

### Spacing Scale

The design system uses a **base-8 spacing scale** (spacingScale: 3):

```
4px  | 8px  | 12px | 16px | 24px | 32px | 48px | 64px | 80px | 120px
```

### Roundness

Corner radius follows the `ROUND_FOUR` preset:

```css
--radius-sm:  4px
--radius-md:  8px
--radius-lg:  12px
--radius-xl:  16px
```

---

## 4. Typography System

The strategy pairs **technical precision** with **humanist readability**.

### Font Stack

| Role | Font | Weight Range | Usage |
|------|------|-------------|-------|
| **Display & Headlines** | Space Grotesk | 300–700 | Hero titles, section headers, large numbers |
| **Body & Titles** | Inter | 400–600 | Prose, data tables, descriptions |
| **Labels** | Inter | 500 | All-caps labels, badges, metadata |

### Type Scale

```
display-lg:    3.5rem   (56px)   — Hero titles, Space Grotesk, weight 300, tracking -0.02em
display-md:    2.5rem   (40px)   — Section titles
headline-lg:   2rem     (32px)   — Page headings
headline-md:   1.5rem   (24px)   — Card titles
title-lg:      1.25rem  (20px)   — Subsection headers
title-md:      1rem     (16px)   — Employee names, bold data
body-lg:       1rem     (16px)   — Body text
body-md:       0.875rem (14px)   — Default body
body-sm:       0.8125rem(13px)   — Secondary text
label-lg:      0.875rem (14px)   — Button text, navigation
label-md:      0.75rem  (12px)   — Metadata, uppercase
label-sm:      0.6875rem(11px)   — Micro labels, tracking 0.1em
```

### Typography Rules

1. **Headlines** use tight leading and slight negative letter-spacing (`-0.02em`) for a "locked" feel.
2. **Labels** use all-caps with increased letter-spacing (`0.05em–0.1em`) for a "data-tag" aesthetic.
3. **Financial figures** must use `font-variant-numeric: tabular-nums` for column alignment.
4. The dramatic scale between `display-lg` and `body-md` creates rhythmic editorial flow.

---

## 5. Color Architecture

### The "No-Line" Rule

**Borders are prohibited for sectioning.** Boundaries are defined through background color shifts:

```
Good: surface-container-high (#2a2a2c) card ON surface (#131315) bg
Bad:  border: 1px solid #333
```

### The "Ghost Border" Fallback

When a border is absolutely required (input focus, accessibility):
- Color: `outline-variant` (#484555) at **15% opacity**
- Never use 100% opaque, high-contrast borders

### Glassmorphism

For floating panels (modals, dropdowns):
- Semi-transparent surface colors
- `backdrop-filter: blur(16px–32px)`
- Allows background luminosity to bleed through

### CTA Gradients

Primary buttons use a subtle gradient:
```css
background: linear-gradient(135deg, var(--primary), var(--primary-container));
/* #cabeff → #947dff */
```

---

## 6. Elevation & Depth

### Tonal Layering Principle

Think of the UI as stacked sheets of fine, dark paper:

```
Layer 0 (Deepest):     surface-container-lowest  (#0e0e10)  — Input backgrounds
Layer 1 (Base):        surface                   (#131315)  — Page canvas
Layer 2 (Section):     surface-container-low     (#1b1b1d)  — Section backgrounds
Layer 3 (Container):   surface-container         (#1f1f21)  — Default containers
Layer 4 (Card):        surface-container-high    (#2a2a2c)  — Interactive cards
Layer 5 (Elevated):    surface-container-highest (#353437)  — Tooltips, badges
Layer 6 (Floating):    surface-bright            (#39393b)  — Hover states
```

### Ambient Shadows (Use Sparingly)

Only for floating states (dropdowns, modals):
```css
box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4);
/* Large blur, no spread, tinted background color */
```

---

## 7. Component Specifications

### Buttons

| Variant | Background | Text | Border | Radius |
|---------|-----------|------|--------|--------|
| **Primary** | Gradient (primary → primary-container) | `on-primary` white | None | `radius-md` (8px) |
| **Secondary** | Transparent | `on-surface-variant` | Ghost border (`outline-variant` 20%) | `radius-md` |
| **Tertiary** | Transparent | `primary` color | None | — |

### Employee Cards (from Stitch screens)

- **Background:** `surface-container-high` (#2a2a2c)
- **Avatar:** Circular with initials fallback (TM, ND, SN)
- **Country badge:** Pill with `surface-container-highest` bg, small label text
- **Salary display:** `title-md` weight 400, tabular-nums
- **Hover:** Lift with subtle background shift to `surface-bright`
- **Chevron:** Right-pointing, muted, reveals on interaction

### Data Badges ("Signature Component")

Small pill-shaped chips for payroll attributes:
```css
background: var(--surface-container-highest);  /* #353437 */
color: var(--primary);                         /* #cabeff */
padding: 3px 8px;
border-radius: 4px;
font-size: 11px;
letter-spacing: 0.05em;
font-variant-numeric: tabular-nums;
```

### Input Fields

Inputs feel "carved" into the interface:
- **Background:** `surface-container-lowest` (#0e0e10)
- **Label:** `label-sm` floating above field, all-caps
- **Focus:** Subtle glow ring using `primary` at 10% opacity
- **No visible borders** in resting state

### Payslip Detail Panel

Per the refined Payslips Management screen:
- **Left sidebar:** Employee list with net pay, stacked vertically
- **Center panel:** Earnings breakdown table (no divider lines — whitespace only)
- **Right sidebar:** Summary card with large net salary, employer contributions
- **Download CTA:** Gradient primary button top-right
- **Compliance badge:** Bottom-right with checkmark icon and validation text

---

## 8. Layout & Spacing

### Grid System

- **Max content width:** 1280px (centered)
- **Primary layout:** Asymmetric split — 1fr sidebar + 2fr content (left-align headlines, right-align data)
- **Card grids:** `repeat(auto-fill, minmax(280px, 1fr))` with 20px gaps

### Section Spacing

```
Between major sections:    80px–120px
Within section padding:    64px
Card internal padding:     24px–28px
Label to content gap:      8px
Between stacked cards:     16px–20px
```

### Navigation

- **Height:** 64px fixed
- **Style:** Glassmorphic — `backdrop-filter: blur(16px)`, semi-transparent surface
- **Logo:** Brand mark + wordmark left-aligned
- **Links:** Uppercase, label-sm sizing, 0.15em tracking
- **CTA:** Primary button (gradient) — "Get Started"

---

## 9. Implementation Gap Analysis

### Current Frontend vs. Stitch Designs

| Aspect | Current (`frontend/`) | Stitch Design | Delta |
|--------|----------------------|---------------|-------|
| **Font** | DM Sans | Space Grotesk + Inter | Need dual-font implementation |
| **Background** | #09090b | #131315 | Slightly lighter canvas needed |
| **Card borders** | rgba borders (post-audit) | No borders — tonal layering | Remove remaining borders |
| **Employee cards** | Name + position + salary | Avatar + name + role + country badge + salary + chevron | Avatar system missing |
| **Stats row** | None | Active Staff / Next Run / Total Monthly Gross | Not yet implemented |
| **Compliance Registry** | None | Jurisdiction table with entity status + risk score | Not yet implemented |
| **Payslip layout** | Expandable accordion | Left sidebar list + center detail + right summary | Different layout paradigm |
| **Navigation** | Demo / Jurisdictions / GitHub | Dashboard / Employees / Payslips / Tax Regimes / Settings | Production nav vs demo nav |
| **CTA** | "Try Demo" | "Get Started" + "Contact Sales" | Landing page has dual CTAs |
| **Code preview** | None | JSON code block with syntax highlighting | Feature section missing |
| **Country images** | None | Skyline photography per jurisdiction | Visual richness missing |

### Parity Priorities

1. **P0 — Typography:** Switch to Space Grotesk (headlines) + Inter (body)
2. **P0 — Background:** Adjust from #09090b → #131315
3. **P1 — Remove borders:** Migrate to pure tonal layering
4. **P1 — Avatar system:** Add initials-based avatars to employee cards
5. **P2 — Stats dashboard row:** Active Staff / Next Run / Total Gross
6. **P2 — Payslip detail panel:** Master-detail layout vs accordion
7. **P3 — Compliance Registry:** Jurisdiction status table
8. **P3 — Landing page features:** Code preview, infrastructure section

---

## 10. Design Principles

### Do

- ✅ Use generous whitespace (64px–80px+ between major sections)
- ✅ Use asymmetrical layouts (left-align headlines, right-align data)
- ✅ Ensure WCAG AA contrast ratios against deep background tokens
- ✅ Use `font-variant-numeric: tabular-nums` for all monetary values
- ✅ Use tonal layering to create depth

### Don't

- ❌ Use pure black (`#000000`) — kills depth and prevents subtle layering
- ❌ Use standard 1px borders for sectioning — breaks the "Digital Architect" illusion
- ❌ Use sharp 90-degree corners — stick to `radius-md` (8px) and `radius-lg` (12px)
- ❌ Use heavy saturated colors — the palette is obsidian + lavender, not neon
- ❌ Overuse the primary accent — reserve it for CTAs and high-intent moments

---

## Screen Reference

Design screens are stored in `docs/screens/`:

- `landing_page.png` — Full landing page (refined)
- `employee_dashboard.png` — Dashboard workspace (refined)
- `payslips_management.png` — Payslip detail view (refined)
- `tax_jurisdictions.png` — Jurisdiction overview (refined)

---

*Generated from Stitch project "Global Payroll Engine" (ID: 13734644426462014317) with design system "Tectonic Ledger" (asset: 5c3c3c19c6a74087af9fbb89de6cd2e2).*