# PaisaPilot 🚀

> **Your Money. Your Choices. Your Next Move.**

PaisaPilot is a personal finance decision simulator designed for Gen Z managing a ₹10,000 monthly budget over 30 days. It connects income, balance, daily spending pace, upcoming bills, subscriptions, savings goals, financial risk, and health scoring into an interconnected, real-time feedback loop.

Featuring the signature **What-If Money Simulator (Money Lab)**, PaisaPilot enables users to preview any purchase or financial choice *before* committing funds, visualizing the exact ripple effect across their balance, safe daily allowance, and month-end trajectory.

---

## 🌟 Live Demo & Repository
- **GitHub Repository**: [https://github.com/paidisettilokesh/paisapilot](https://github.com/paidisettilokesh/paisapilot)
- **Deployment**: Configured for automated GitHub Pages continuous deployment via `.github/workflows/deploy.yml`.

---

## 🧪 Signature Feature: What-If Money Simulator (Money Lab)

The **Money Lab** (`/lab`) lets users test financial moves in an isolated sandbox before touching their live budget:

- **Amount Controls**: Numeric input + accessible interactive slider (`₹100` to `₹10,000`).
- **Gen-Z Preset Scenarios**:
  - 🍕 **₹500 Food Delivery Cravings** (Comfort food order on Swiggy/Zomato)
  - 👟 **₹1,500 Trending Sneakers Drop** (Flash sale on Myntra)
  - 🎧 **₹2,500 Gadget / Tech Accessory** (Mechanical keyboard or ANC headphones)
  - 🩺 **₹2,000 Emergency Medical Expense** (Unforeseen dental / doctor visit)
  - 💼 **₹3,000 Freelance Design Payout** (Side-hustle income credit)
- **Trade-Off Alternatives**:
  - **-30% Trim Cost**: Instantly tests scaling back discretionary wants.
  - **Split 50%**: Models splitting the expense with a friend.
  - **Pin as Plan B**: Saves the active simulation for side-by-side comparison.
- **Side-by-Side Scenario Comparison**:
  - Compare Current Baseline vs Plan A vs Plan B simultaneously.
  - Interactive tab switcher with dual confirmation options.
- **Comparative Cash-Flow Trajectory Chart**:
  - Overlay Area chart plotting Current baseline (dashed line), Plan A (emerald gradient), and Plan B (violet line) across all 30 days.
- **Complete 8-Point Before vs After Matrix**:
  1. In-Account Cash (Actual Balance)
  2. Available Spendable Liquidity
  3. Safe Daily Allowance (`₹/day`)
  4. Projected Month-End Cushion
  5. Budget Utilization Pace
  6. Unpaid Commitment Safety
  7. Risk Exposure (0–100 score + `low`/`moderate`/`high`/`critical` rating)
  8. Financial Health Index (0–100 wellness score across 4 pillars)
  9. Savings Goal Feasibility Statuses (`on_track`, `at_risk`, `achieved`)

---

## 🧮 Pure Financial Calculation Engine

All metrics are derived deterministically using pure integer-rupee arithmetic (no floating-point rounding bugs):

```
Actual Balance      = Starting Budget (₹10,000) + Total Income − Total Expenses
Outstanding Bills   = Σ Unpaid Commitments (excluding paid & already-recorded transactions)
Reserved Savings    = Σ Monthly Targets Needed per active Goal
Available to Spend  = max(0, Actual Balance − Outstanding Bills − Upcoming Subscriptions − Reserved Savings)
Safe Daily Allowance= max(0, Available to Spend ÷ Remaining Days in Cycle)
Projected Month-End = Actual Balance − Outstanding Bills − Upcoming Subscriptions
```

- **Risk Score (0–100)**: Formulated from Available Spend Ratio (35 pts), Commitment Coverage (25 pts), Month-End Deficit (25 pts), and Emergency Buffer (15 pts).
- **Health Score (0–100)**: Formulated across 4 pillars (25 pts each): Spendable Liquidity, Goal Progress, Expense Discipline, and Trajectory Stability.
- **Pure Functional Simulator**: `simulateScenario(state, scenario)` creates an immutable clone with `{ includeSimulated: true }`, ensuring previews never mutate real state.
- **Idempotency & Duplicate Prevention**: Single-dispatch confirmation guarantee with duplicate click locks.

---

## 🎨 Visual System & Aesthetics

- **Midnight Navy Background**: `#0B1020`
- **Elevated Navy Surface**: `#14213A`
- **Border Navy**: `#1E3A5F`
- **Emerald Accent**: `#10B981`
- **Electric Lime Accent**: `#C5F467`
- **Secondary Violet**: `#7C3AED`
- **3D Depth**: Interactive CSS perspective tilt balance card (`BalanceCard3D.tsx`) with layered lighting effects, subtle glows, and Framer Motion micro-animations (no heavy Three.js dependencies).

---

## 🏗️ Project Architecture

```
PaisaPilot/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages CI/CD workflow
├── src/
│   ├── types/
│   │   └── index.ts            # Strict TypeScript models & simulation interfaces
│   ├── engine/
│   │   ├── compute.ts          # Pure deterministic financial engine
│   │   ├── compute.test.ts     # Engine calculations test suite (23 tests)
│   │   └── simulator.test.ts   # What-If simulator verification suite (12 tests)
│   ├── context/
│   │   ├── FinancialContext.tsx# React 19 Context provider with useReducer
│   │   └── reducer.ts          # Immutable state transitions with localStorage sync
│   ├── hooks/
│   │   └── useSimulator.ts     # What-If simulation preview & confirmation hook
│   ├── components/
│   │   ├── common/             # Card, Badge, Button design primitives
│   │   ├── dashboard/          # 3D Balance Card, CashFlowChart, ObligationsList
│   │   └── layout/             # Sidebar, Header, MobileNav, PageHeader
│   ├── pages/
│   │   ├── OverviewPage.tsx    # Main 30-day dashboard
│   │   ├── MoneyLabPage.tsx    # What-If Money Simulator (Money Lab)
│   │   ├── TransactionsPage.tsx# Ledger & expense recording
│   │   ├── GoalsPage.tsx       # Savings goals manager & feasibility
│   │   └── HealthPage.tsx      # Risk breakdown & financial health pillars
│   ├── data/
│   │   └── demoData.ts         # Gen Z demo seed dataset
│   ├── utils/
│   │   ├── helpers.ts          # Currency, dates, and ID helpers
│   │   └── storage.ts          # Safe localStorage persistence with schema recovery
│   ├── App.tsx                 # App layout & routing
│   ├── main.tsx                # React DOM root
│   └── index.css               # Design tokens, Tailwind directives, glass classes
├── vite.config.ts              # Vite configuration with relative base './'
├── package.json
└── tsconfig.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or 20+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/paidisettilokesh/paisapilot.git
cd paisapilot

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 🧪 Testing

All 35 unit and integration tests are automated using Vitest:

```bash
# Run test suite once
npm test

# Run tests in watch mode
npm run test:watch
```

### Verified Test Coverage (35 Passing Tests)
- `src/engine/simulator.test.ts` (12 tests):
  - Previews never mutate original financial state.
  - Cancellation leaves live state unaltered.
  - Confirm creates exactly one transaction and updates all dependent metrics.
  - Double confirmation and duplicate clicks blocked.
  - Exact presets verified: ₹500 food, ₹1,500 sneakers, ₹2,500 gadget, ₹2,000 emergency.
  - Complete 8-point impact matrix with deltas and directions.
  - Multi-scenario side-by-side comparison (Plan A vs Plan B).
  - Trade-off adjustments (-30% trim, 50% split).
  - Extreme budget overflow / deficit clamping.
- `src/engine/compute.test.ts` (23 tests):
  - Incomes, expenses, and refunds onto ₹10,000 budget.
  - Commitment isolation without double-counting paid bills.
  - Subscription charges and calendar logic.
  - Savings goal isolation and feasibility.
  - Safe daily allowance calculation across cycle days.
  - Deterministic 0–100 risk & health scoring.
  - 30-day cash flow timeline projection.

---

## 📦 Production Build & Deployment

```bash
# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

### Deploy to GitHub Pages
The project includes a ready-to-run GitHub Actions workflow in `.github/workflows/deploy.yml`. Once pushed to GitHub:
1. Go to your repository on GitHub: `https://github.com/paidisettilokesh/paisapilot`
2. Navigate to **Settings** → **Pages**
3. Under **Build and deployment** → **Source**, select **GitHub Actions**
4. Every push to `main` will automatically build and deploy the app!

---

## 🛡️ License
MIT License. Built for Gen Z financial empowerment.
