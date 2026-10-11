# 🚀 Thriftly — Every rupee has a plan.

> **Your ₹10,000. Your 30 days. Your decisions.**
> An interactive personal finance management cockpit and financial decision simulator for Gen Z users in India.

---

## 📁 Clean Monorepo Architecture

The project is cleanly decoupled into dedicated **frontend** and **backend** packages managed via **npm workspaces**:

```
prompt-run/
├── backend/                       # 🟢 Express + TypeScript REST API
│   ├── src/
│   │   ├── index.ts               # Express server entry point (Port 3001)
│   │   ├── db.ts                  # Persistent JSON Database engine
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
│   │   ├── components/            # UI building blocks (Gauges, Cards, Modals)
│   │   ├── context/               # Finance context provider & hooks
│   │   ├── engine/                # Financial accounting, health scoring & forecast engines
│   │   ├── features/              # Views (Cockpit, Transactions, Goals, Commitments, Simulator)
│   │   ├── lib/                   # REST API client & currency formatters
│   │   └── test/                  # Accounting, scoring, and simulator unit tests
│   ├── public/                    # Static assets
│   ├── index.html
│   ├── vite.config.ts             # Dev server with /api proxy to port 3001
│   ├── package.json
│   └── tsconfig.json
│
├── package.json                   # 📦 Root workspace orchestrator
├── tsconfig.json                  # Root TypeScript project references
└── README.md                      # Project documentation
```

---

## ⚡ Quick Start

### 1. Install Dependencies
Run from the repository root:
```bash
npm install
```

### 2. Start Full-Stack Development
Run both the **Express REST API** (Port 3001) and **Vite Frontend** (Port 5173) concurrently:
```bash
npm run dev
```

### 3. Run Independently
To run frontend or backend in separate terminals:
```bash
# Start Backend API only (http://localhost:3001)
npm run dev:backend

# Start Frontend only (http://localhost:5173)
npm run dev:frontend
```

---

## 🧪 Testing & Verification

Run tests, typechecks, or linters across workspaces:

```bash
# Run all unit and integration test suites (13 tests)
npm run test

# Run frontend tests only
npm run test:frontend

# Run backend tests only
npm run test:backend

# Run oxlint across frontend
npm run lint

# Run TypeScript typechecks across both packages
npm run typecheck

# Build frontend production bundle
npm run build
```

---

## 📡 REST API Overview

Base URL: `http://localhost:3001/api`

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/health` | `GET` | Health check and server status |
| `/state` | `GET` | Retrieve complete financial state |
| `/state/reset` | `POST` | Reset ledger to Day 1 baseline |
| `/state/budget` | `PUT` | Update 30-day budget cap |
| `/state/day/advance` | `POST` | Advance simulation to next day |
| `/transactions` | `GET`, `POST` | List or record an expense |
| `/transactions/:id` | `PUT`, `DELETE` | Update or delete a transaction |
| `/goals` | `GET`, `POST` | List or create savings goals |
| `/goals/:id/deposit` | `POST` | Contribute cash to a goal |
| `/goals/:id/withdraw` | `POST` | Withdraw cash from a goal |
| `/commitments` | `GET`, `POST` | List or register fixed bills |
| `/commitments/:id/pay` | `POST` | Settle bill (converts to expense atomically) |
| `/commitments/:id/unpay`| `POST` | Revert paid status |

---

## ☁️ Vercel Deployment Guide

Thriftly is fully configured for seamless one-click deployment on **Vercel**:

### Option A: Monorepo / Root Deployment (Recommended)
1. Push the code to GitHub and import the repository on [Vercel](https://vercel.com).
2. Leave the **Root Directory** as `./` (default).
3. Vercel automatically detects `vercel.json`:
   - Builds the Vite React client from `frontend/` to `frontend/dist`.
   - Provisions the serverless REST API functions under `api/index.ts`.
   - Handles client-side SPA routing (`/(.*) -> /index.html`) and API routing (`/api/(.*) -> /api`).
4. Click **Deploy**!

### Option B: Frontend Single-Workspace Deployment
If deploying only the `frontend` folder (by setting Root Directory to `frontend`):
- `frontend/vercel.json` ensures full client-side SPA routing without 404s.
- The built-in client engine and local persistence seamlessly power the full cockpit and simulation offline!