# 🧭 Thriftly — Every Rupee Has a Plan

> **Broke But Functional — Survive the Month**  
> **Your ₹10,000. Your 30 Days. Your Decisions.**  
> An interactive, consumer-grade personal finance experience and **What-If Decision Simulator** designed for Gen Z to manage a limited **₹10,000 monthly budget over 30 days** with visible, interconnected consequences across every rupee.

---

## 🎯 Problem Statement & Product Vision

Traditional expense trackers act like a **rear-view mirror**—they only log where your money went after it is already spent. For a student, intern, or young professional living on a strict **₹10,000 / 30-day budget**, a single impulsive sneaker purchase, stacked OTT subscriptions, or an unexpected ₹2,200 phone screen repair can silently derail rent, electricity bills, or emergency savings days before the month ends.

**Thriftly** transforms personal finance into a **forward-looking financial flightpath**:

1. **Interconnected Financial Ecosystem**: Directly links **Income / Monthly Budget**, **Remaining Liquid Balance**, **Daily Spending**, **Fixed Commitments**, **Savings Goals**, **Subscriptions (OTT/Apps)**, **Unexpected Expenses**, **Financial Risk Level**, and **Overall Financial Health Score (0–100)**.
2. **Pre-Decision What-If Simulator**: Users can simulate any purchase, recurring subscription, or unexpected emergency *before* spending a single rupee and immediately inspect how that decision shifts:
   - **Remaining Liquid Balance** (`availableCash`)
   - **Safe Daily Allowance** (`₹/day` over remaining days)
   - **Savings Goals Protection & Target Delay**
   - **Monthly Forecast & Day-30 Ending Runway**
   - **Financial Risk Classification** (`Low` · `Medium` · `High` · `Critical`)
   - **Overall Financial Health Score** (`0–100` across 4 weighted pillars)

---

## ✨ Core Features & Interconnected Modules

### 1. 📊 Overview Flightpath & Live 30-Day Money Flow (`DashboardView`)
- **Safe Daily Allowance Gauge**: Real-time radial gauge comparing today's spending against your conservative daily cap (`Available Cash ÷ Remaining Days`), complete with 1-click quick-spend pills (`☕ Chai ₹40`, `🚇 Metro ₹60`, `🍱 Thali ₹120`).
- **Financial Health Score Gauge (0–100)**: Evaluates 4 weighted pillars—**Budget Adherence (30%)**, **Savings Progress (25%)**, **Commitment Coverage (25%)**, and **Spending Stability (20%)**.
- **Interactive 30-Day Money Flow & Income Controls**:
  - Visualizes the live multi-segment allocation bar (`Spent` + `Reserved Bills & Subscriptions` + `Protected Savings Goals` + `Liquid Runway`).
  - Includes 1-click **Income / Stipend Boost** controls (`+₹500 Gig`, `+₹1,000 Stipend`, `Reset ₹10k`) and 1-click **Emergency Shock Triggers** (`📱 Screen ₹2.2k`, `💊 Medical ₹1.5k`, `🚆 Tatkal ₹800`).
- **Spending Analytics**: Interactive Recharts **Spending by Category** doughnut chart and **30-Day Spending Velocity** bar chart with safe daily cap reference lines.

### 2. 🧪 What-If Decision Simulator (`SimulatorView`)
- **Interactive Decision Sandbox**: Test any hypothetical spend (`₹50` to `₹6,000`) as a **One-Time Purchase**, **Recurring Monthly Subscription**, or **Unexpected Emergency** on any day of the month.
- **5 One-Click Real-World Gen Z Scenarios**:
  - *Cracked Phone Screen Repair* (`₹2,200`)
  - *Emergency Clinic & Meds* (`₹1,500`)
  - *Urgent Tatkal Train Ticket* (`₹800`)
  - *Electricity Bill Spike* (`₹950`)
  - *Best Friend's Birthday Outing* (`₹1,200`)
- **6-Dimension Before vs. After Consequence Matrix (`ComparisonView`)**: Side-by-side comparison of **Remaining Balance**, **Safe Daily Allowance**, **Savings Goals Impact**, **Day-30 Forecast Runway**, **Financial Risk Level**, and **Financial Health Score**.
- **30-Day Cash Flow Trajectory Chart (`ForecastChart`)**: Dual-line projection comparing your current plan against the simulated decision relative to the ₹10,000 budget ceiling.

### 3. 🧾 Transaction Ledger (`TransactionsView`)
- Full CRUD ledger with debounced instant search, category filter chips, multi-key sorting, summary analytics ribbon (`Filtered Outlay`, `Total Records`, `Average Spend`, `Largest Outlay`), and RFC 4180 **CSV Export**.

### 4. 🎯 Savings Goals Vault (`GoalsView`)
- Create and manage priority-ranked savings goals (*Emergency Medical Buffer*, *Fest Concert Pass*, *Weekend Goa Trip*).
- **Contribute Funds** (locks liquid cash into protected savings) or **Withdraw Funds** (releases savings back into liquid cash to cover emergencies), immediately recalculating your Safe Daily Allowance and Health Score.

### 5. 📅 Fixed Commitments & Subscription Tracker (`CommitmentsView`)
- Dedicated filter tabs for **All Commitments**, **📱 Subscriptions & OTT**, and **⚡ Fixed Bills & Rent**.
- Tracks **Monthly Subscription Burn** separately from utility/hostel bills.
- **Zero Double-Counting Settlement**: Clicking **Mark Paid** atomically converts a reserved commitment into an actual ledger transaction while releasing the reservation lock.

### 6. 💡 Smart Financial Coach & Risk Insights (`InsightsView`)
- Context-aware financial intelligence engine that detects category over-concentration, subscription bloat, daily burn spikes, and upcoming bill bottlenecks, offering 1-click navigation to resolve risks.

---

## 🧮 Single-Source Mathematical Accounting Engine

All metrics across every view are derived from a single pure, deterministic engine (`src/engine/accounting.ts` & `src/engine/forecast.ts`):

$$\text{Total Reserved} = \text{Unpaid Commitments} + \text{Goal Savings}$$

$$\text{Available Cash} = \text{Monthly Budget} - \text{Total Spent} - \text{Total Reserved}$$

$$\text{Remaining Days} = \max(1, \text{Total Days} - \text{Current Day} + 1)$$

$$\text{Safe Daily Allowance} = \max\left(0, \left\lfloor \frac{\text{Available Cash}}{\text{Remaining Days}} \right\rfloor\right)$$

$$\text{Projected Month-End Balance} = \text{Available Cash} - (\text{Safe Daily Allowance} \times \text{Remaining Days})$$

---

## 🏗️ Project Architecture & Directory Structure

```text
prompt-run/
├── public/                        # Static assets & icons
├── src/
│   ├── components/
│   │   ├── common/                # Memoized gauges, MetricCard, CommandPalette (⌘K), ErrorBoundary
│   │   ├── layout/                # AppLayout, TopNavbar, Sidebar, MobileNav
│   │   └── ui/                    # Reusable accessible primitives (Button, Card, Input, Badge, Modal)
│   ├── context/                   # Pure client-side FinanceContext & ThemeContext (Dark/Light mode)
│   ├── data/                      # Realistic Gen Z ₹10,000 demo dataset & preset shock scenarios
│   ├── engine/                    # Pure mathematical accounting, forecasting, health & insights engines
│   ├── features/
│   │   ├── commitments/           # Fixed bills & OTT subscription management
│   │   ├── dashboard/             # Overview flightpath, charts, live money-flow bar & quick sim
│   │   ├── goals/                 # Protected savings goals & contribute/withdraw flows
│   │   ├── insights/              # Rule-based financial coach & risk breakdown
│   │   ├── simulator/             # What-If Decision Simulator, 6-card comparison & 30-day forecast
│   │   └── transactions/          # Searchable, filterable expense ledger with CSV export
│   ├── hooks/                     # Custom React hooks (useDebounce, useMediaQuery, useFinance, useTheme)
│   ├── lib/                       # Encrypted localStorage vault (cryptoVault), Zod schemas, DOMPurify
│   ├── test/                      # Vitest unit & integration test suites
│   └── types/                     # Strict TypeScript domain interfaces
├── index.html                     # Entry HTML with SEO & theme metadata
├── package.json                   # Project dependencies & scripts
├── tsconfig.json                  # Strict TypeScript configuration
└── vite.config.ts                 # Vite 7 bundler & Vitest configuration with vendor chunk splitting
```

---

## 🚀 Getting Started (Installation & Local Development)

### Prerequisites
- **Node.js** `>= 18.0.0`
- **npm** `>= 9.0.0`

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/siribeesu/expense-manager.git
cd expense-manager

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open `http://localhost:5173` in your browser. The app automatically loads with a rich, realistic Gen Z ₹10,000 budget state on Day 12 of 30 and persists all changes to an encrypted local browser vault (`thriftly_vault_v1`).

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the local Vite development server with HMR |
| `npm run build` | Runs TypeScript type-checking and builds optimized production chunks to `dist/` |
| `npm run typecheck` | Validates strict TypeScript types across the entire project |
| `npm run test` | Runs the automated Vitest unit test suite for the accounting and simulation engines |
| `npm run lint` | Runs ESLint static code analysis |
| `npm run preview` | Locally previews the production build |

---

## ♿ Accessibility, Responsiveness & Performance

- **WCAG AA Accessibility**: Keyboard skip-link (`Skip to main content`), semantic landmarks (`header`, `nav`, `main`, `footer`), `aria-live="polite"` status regions, focus-trapped modals (`role="dialog"`), visible `:focus-visible` outlines, and `@media (prefers-reduced-motion: reduce)` support.
- **Pro Keyboard Navigation**: Command Palette (`⌘K` / `Ctrl+K`), Quick Expense (`N`), Advance Day (`D`), Toggle Dark/Light Theme (`T`), Shortcuts Guide (`?`), and Quick Tab Jumping (`1`–`6`).
- **Performance Engineered**: Route-based `React.lazy` + `Suspense` code splitting, vendor chunk separation (`vendor-react`, `vendor-charts`, `vendor-icons`, `vendor-utils`), `React.memo` & `useMemo` on all gauges and charts, and `useDebounce` on ledger search.

---

## 📄 License

Distributed under the **MIT License**. Built for the Gen Z Personal Finance Frontend Hackathon.
