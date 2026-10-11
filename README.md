# 🚀 Thriftly — Every rupee has a plan.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19.x-61dafb.svg?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF.svg?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC.svg?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-5.x-black.svg?style=flat-square&logo=express)](https://expressjs.com/)
[![Vitest](https://img.shields.io/badge/Tests-39_Passed-success.svg?style=flat-square&logo=vitest)](https://vitest.dev/)
[![Deploy with Vercel](https://img.shields.io/badge/Vercel-Deployment_Ready-black.svg?style=flat-square&logo=vercel)](https://vercel.com/)

> **Your ₹10,000. Your 30 days. Your decisions.**  
> An interactive personal finance management cockpit and financial decision simulator designed specifically for Gen Z students and young professionals in India.

---

## 📖 Table of Contents

- [Overview & Value Proposition](#-overview--value-proposition)
- [Key Features](#-key-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Security & Privacy Engineering](#-security--privacy-engineering)
- [Accessibility & Power-User Controls](#-accessibility--power-user-controls)
- [Pre-Loaded Sample Scenario](#-pre-loaded-sample-scenario)
- [Quick Start Guide](#-quick-start-guide)
- [Testing & Quality Verification](#-testing--quality-verification)
- [REST API Reference](#-rest-api-reference)
- [Production Deployment Guide](#-production-deployment-guide)
- [License](#-license)

---

## 💡 Overview & Value Proposition

Traditional personal finance apps fail Gen Z because they are **backward-looking ledger books**—they catalog past expenses after the damage is already done. 

**Thriftly flips this paradigm into a forward-looking flight cockpit:**
- **Runway over Regret:** Instead of asking *"Where did my money go?"*, Thriftly continuously calculates your **Safe Daily Allowance**—the exact rupee amount you can spend today without running out of cash before Day 30.
- **Simulate Before You Swipe:** Test unplanned purchases (concert tickets, phone repairs, weekend trips) inside the **What-If Simulator** *before* spending. Thriftly projects the exact downstream impact on your daily runway, savings targets, and month-end cash flow.
- **Envelope Math Reconciled:** Automatically reserves cash for upcoming bills and active savings goals, protecting you from accidental overdrafts.

---

## ⚡ Key Features

| Feature | Description |
| :--- | :--- |
| **🧭 Real-Time Cockpit** | Live visual HUD featuring your **Safe Daily Allowance**, **Available Liquid Cash**, **Runway Velocity**, and month-long burn-rate trajectory chart. |
| **🔮 What-If Simulator** | Interactive sandbox to test impulse expenses. Visualizes impact on your daily budget and warns if goals or bills are jeopardized. |
| **🎯 Goal Reserves** | Lock funds into dedicated savings goals (Emergency Cushion, Tech Upgrades, Trips). Funds are immediately unreserved from daily cash pools. |
| **📅 Fixed Commitments** | Schedule non-negotiable monthly obligations (PG WiFi, Spotify, Gym, Cloud storage). One-click atomic settlement records transactions without double-counting. |
| **🛡️ Health Resiliency Score** | Objective 0–100 financial health rating powered by 5 weighted pillars: Cash Runway (30%), Bill Coverage (25%), Savings Progress (20%), Velocity (15%), and Emergency Buffer (10%). |
| **📊 CSV Data Export** | One-click export of complete monthly ledgers formatted for spreadsheets. |
| **🌓 Adaptive Dark & Light Modes** | Beautiful high-contrast Gen Z fintech aesthetic with instant keyboard toggle (`T`). |

---

## 📁 Architecture & Tech Stack

Thriftly is built as a clean **npm workspaces monorepo**, cleanly separating frontend client logic from the backend REST services:

```
prompt-run/
├── backend/                       # 🟢 Express + TypeScript REST API
│   ├── src/
│   │   ├── index.ts               # Server entry point & middleware pipeline (Port 3001)
│   │   ├── db.ts                  # Persistent JSON Database engine with atomic writes
│   │   ├── middleware/
│   │   │   ├── auth.ts            # Bearer token & header authentication guard
│   │   │   └── security.ts        # CSP, rate limiting, and security headers
│   │   └── routes/
│   │       └── api.ts             # RESTful API endpoints (/api/*)
│   ├── data/
│   │   └── thriftly_db.json       # Persistent ledger storage
│   ├── test/
│   │   └── backend.test.ts        # Database & API test suite
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                      # 🟣 React 19 + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/            # Reusable UI primitives (Modals, Gauges, Cards, Badges)
│   │   ├── context/               # FinanceContext, ThemeContext & Hook providers
│   │   ├── engine/                # Pure accounting, health scoring & forecast math
│   │   ├── features/              # Feature views (Dashboard, Simulator, Ledger, Goals, Bills, Insights)
│   │   ├── services/              # financeSyncService (decoupled network sync layer)
│   │   ├── lib/                   # cryptoVault, API client, formatters, sanitizers
│   │   └── test/                  # 34 Vitest unit, component, and security tests
│   ├── public/                    # Static brand assets
│   ├── index.html                 # HTML shell with meta tags & preconnects
│   ├── vite.config.ts             # Vite configuration with chunk splitting & proxy
│   ├── package.json
│   └── tsconfig.json
│
├── api/                           # ☁️ Vercel Serverless Function entry point
│   └── index.ts                   # Unified API handler for Vercel deployments
├── vercel.json                    # Vercel multi-service routing configuration
├── package.json                   # 📦 Root workspace orchestrator
└── README.md                      # Project documentation
```

### Technology Highlights
- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS 4, Lucide Icons, Recharts.
- **Backend:** Express 5, TypeScript, Node.js, Tsx watch engine.
- **Testing:** Vitest, Testing Library, `@testing-library/jest-dom`.
- **Quality & Security:** Oxlint, Zod schema validation, DOMPurify HTML sanitization.

---

## 🔒 Security & Privacy Engineering

Thriftly adheres to modern security and data integrity principles:

1. **Authenticated Cryptographic Vault (`cryptoVault.ts`):**
   - Personal finance data is sensitive. Browser `localStorage` does **not** store plaintext numbers or transaction descriptions.
   - Financial state is encrypted using authenticated high-entropy envelopes with random 96-bit IVs, 128-bit salts, and HMAC authentication tags:
     ```
     THRIFTLY_VAULT_V2:{"v":2,"iv":"...","salt":"...","ciphertext":"...","tag":"..."}
     ```
   - Tampered payloads are rejected safely, falling back to clean baselines without throwing uncaught exceptions.
2. **Backend Authentication & Authorization:**
   - All data and mutation endpoints require authorization via `Authorization: Bearer <token>` or `x-thriftly-auth`.
   - Unauthenticated requests from external scrapers are blocked with `401 Unauthorized`.
3. **Rate Limiting & Security Headers:**
   - In-memory sliding-window rate limiter prevents abuse (120 req/min per IP).
   - Strict `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Referrer-Policy`.
4. **Input Sanitization & Validation:**
   - User inputs (transaction descriptions, goal notes, bill names) pass through DOMPurify tag stripping and strict Zod runtime schemas before state commits.
5. **Race-Condition & Double-Submit Protection:**
   - Form buttons disable immediately while network mutations are in flight (`disabled={isSubmitting}`), preventing duplicate debits or double goal transfers.

---

## ♿ Accessibility & Power-User Controls

Thriftly is built to be accessible to all users:

- **WCAG-Compliant Focus Trapping:** Active modals trap <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> within the dialog. Focus is automatically returned to the triggering element upon dismissal.
- **Unique Dynamic ARIA IDs:** Modals use React `useId()` to prevent `aria-labelledby` identifier collisions.
- **Persistent Screen Reader Announcements:** Off-screen `aria-live="polite"` and `aria-live="assertive"` regions ensure toast alerts and errors are announced immediately.
- **Skip Link:** Accessible *"Skip to main content"* link for keyboard-only navigation.

### ⌨️ Global Keyboard Shortcuts

| Shortcut | Action | Description |
| :---: | :--- | :--- |
| <kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd> | **Command Palette** | Quick navigator across all views, exports, and actions |
| <kbd>N</kbd> | **Quick Expense** | Opens Record Expense modal from anywhere |
| <kbd>D</kbd> | **Advance Day** | Moves timeline forward by 1 day to simulate passage of time |
| <kbd>T</kbd> | **Toggle Theme** | Switches between Dark Mode and Light Mode |
| <kbd>?</kbd> | **Shortcuts Modal** | Displays full keyboard shortcut cheat sheet |
| <kbd>1</kbd> – <kbd>6</kbd> | **Tab Navigation** | Jump directly: (1) Cockpit, (2) Simulator, (3) Ledger, (4) Goals, (5) Bills, (6) Insights |
| <kbd>Esc</kbd> | **Close Dialog** | Dismisses any active modal or command palette |

---

## 📊 Pre-Loaded Sample Scenario

Thriftly includes a pre-seeded **Day 12 of 30** scenario tailored to a college student / young adult in India:

- **Initial Budget:** ₹10,000 / 30 Days
- **Current Day:** Day 12 (18 days remaining)
- **Transactions Recorded (8):**
  - Day 1: Instamart Groceries & Breakfast (`₹850`)
  - Day 3: Metro SmartCard Recharge (`₹400`)
  - Day 5: Semester Reference Book & Notes (`₹620`)
  - Day 7: Weekend Biryani with Roommates (`₹450`)
  - Day 9: Jio 5G Unlimited Plan (`₹299`)
  - Day 10: Cold Brew Study Session (`₹240`)
  - Day 11: Pharmacy First Aid & ORS (`₹180`)
  - Day 12: Quick Kathi Roll Lunch (`₹160`)
- **Active Savings Goals (2):**
  - Emergency Cushion / Tech Fund: ₹1,200 saved of ₹3,000 target (40%)
  - Diwali Homecoming & Gifts: ₹300 saved of ₹1,500 target (20%)
- **Upcoming Bills (4):**
  - PG High-Speed WiFi: ₹450 (Due Day 15)
  - Spotify Premium Duo: ₹149 (Due Day 18)
  - Gym Pass Share: ₹600 (Due Day 22)
  - Google One Storage: ₹199 (Due Day 25)
- **Resulting Metrics:**
  - Total Spent: **₹3,199**
  - Reserved in Goals: **₹1,500**
  - Reserved for Bills: **₹1,398**
  - Available Liquid Cash: **₹3,903**
  - Safe Daily Allowance: **₹225 / day**
  - Financial Health Score: **76 / 100**

> 💡 **Tip:** You can reload this sample scenario at any time by clicking the **`✨ Sample Data`** button in the top navigation bar or via <kbd>⌘K</kbd> ➔ *Reset to Sample Data*.

---

## ⚡ Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) v18.0.0 or higher
- [npm](https://www.npmjs.com/) v9.0.0 or higher

### 1. Clone & Install
```bash
git clone https://github.com/siribeesu/expense-manager.git
cd expense-manager
npm install
```

### 2. Run Full-Stack Development
Starts both the **Express REST API** (Port `3001`) and the **Vite React Frontend** (Port `5173`) concurrently:
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

### 3. Run Workspaces Independently
If you prefer running frontend or backend in dedicated terminal windows:
```bash
# Terminal 1: Backend API only (http://localhost:3001)
npm run dev:backend

# Terminal 2: Frontend Vite app only (http://localhost:5173)
npm run dev:frontend
```

---

## 🧪 Testing & Quality Verification

Thriftly is backed by **39 automated tests** covering accounting logic, health scoring, forecasting, security, and accessibility:

```bash
# Run all 39 tests across frontend & backend
npm run test

# Run frontend tests only (34 tests)
npm run test:frontend

# Run backend tests only (5 tests)
npm run test:backend

# Run Oxlint across the codebase (0 warnings, 0 errors)
npm run lint

# Run strict TypeScript type checks across all packages
npm run typecheck

# Build optimized production bundle
npm run build
```

---

## 📡 REST API Reference

Base URL: `http://localhost:3001/api` (Local) or `/api` (Vercel)

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/health` | No | Server health check and version status |
| `POST` | `/auth/login` | No | Authenticate with security PIN (Default: `1234`) |
| `GET` | `/auth/verify` | Yes | Verify active session token |
| `GET` | `/state` | Yes | Retrieve complete financial ledger state |
| `POST` | `/state/reset` | Yes | Reset ledger to sample state |
| `PUT` | `/state/budget` | Yes | Update 30-day budget cap (`totalBudget`) |
| `POST` | `/state/advance-day` | Yes | Advance simulation timeline by 1 day |
| `PUT` | `/state/day` | Yes | Set timeline to a specific day |
| `GET` | `/transactions` | Yes | List all recorded transactions |
| `POST` | `/transactions` | Yes | Record a new expense transaction |
| `PUT` | `/transactions/:id` | Yes | Update an existing transaction |
| `DELETE`| `/transactions/:id` | Yes | Delete a transaction |
| `GET` | `/goals` | Yes | List all savings goals |
| `POST` | `/goals` | Yes | Create a new savings goal |
| `PUT` | `/goals/:id` | Yes | Update savings goal target or notes |
| `DELETE`| `/goals/:id` | Yes | Remove goal and unreserve saved funds |
| `POST` | `/goals/:id/deposit` | Yes | Deposit cash into savings goal |
| `POST` | `/goals/:id/withdraw`| Yes | Withdraw funds from goal back to cash |
| `GET` | `/commitments` | Yes | List all upcoming commitments and bills |
| `POST` | `/commitments` | Yes | Register a new recurring commitment |
| `PUT` | `/commitments/:id` | Yes | Update commitment details |
| `DELETE`| `/commitments/:id` | Yes | Delete a commitment |
| `POST` | `/commitments/:id/pay` | Yes | Settle bill (atomically creates linked expense) |
| `POST` | `/commitments/:id/unpay`| Yes | Revert settled bill back to upcoming status |

---

## ☁️ Production Deployment Guide

Thriftly is fully configured for one-click deployment on **[Vercel](https://vercel.com/)**:

### One-Click Monorepo Deployment
1. Push this repository to GitHub/GitLab.
2. In the Vercel dashboard, click **Add New Project** and select this repository.
3. Leave the **Root Directory** as `./` (default).
4. Vercel automatically detects [`vercel.json`](file:///c:/Users/Hii/Documents/prompt-run/vercel.json):
   - Builds the Vite React SPA to `frontend/dist`.
   - Provisions serverless REST API functions via [`api/index.ts`](file:///c:/Users/Hii/Documents/prompt-run/api/index.ts).
   - Routes `/api/*` to the serverless function and all other paths to the React SPA.
5. Click **Deploy**!

### Optional Environment Variables
| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `THRIFTLY_AUTH_TOKEN` | `thriftly-pilot-token-2026` | Master authentication Bearer token for API protection |
| `THRIFTLY_PIN` | `1234` | Security PIN for UI quick unlock |
| `PORT` | `3001` | Express backend port (local development) |

---
