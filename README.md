# FinCore v1.1 — Enterprise Digital Banking Platform

Full-stack banking application with 10 Phase 4.1 enhancements.

**Stack:** React 19 + Vite · Node.js/Express · PostgreSQL · Prisma ORM

---

## Quick Start

### Prerequisites
Node.js 18+  ·  PostgreSQL 14+

### 1 — Backend
```bash
cd server
cp .env.example .env          # fill DATABASE_URL + JWT secrets
npm install
npx prisma migrate dev --name phase41
node prisma/seed.js
npm run dev                   # → http://localhost:5000
```

### 2 — Frontend (new terminal)
```bash
cd client
npm install
npm run dev                   # → http://localhost:5173
```

---

## Demo Credentials

| Role  | Email               | Password   | UPI ID               |
|-------|---------------------|------------|----------------------|
| User  | deep@fincore.io     | Demo@1234  | deep.patel@fincore   |
| User  | priya@fincore.io    | Demo@1234  | priya.yadav@fincore  |
| Admin | admin@fincore.io    | Demo@1234  | admin@fincore        |

---

## Phase 4.1 Enhancements

| # | Enhancement | What was built |
|---|-------------|----------------|
| 1 | Smart Beneficiary Linking | `receiverAccountId` on Beneficiary — one-tap transfer to saved people |
| 2 | Beneficiary Search | Live search by name or account number with clear button |
| 3 | Favourite Beneficiaries | Star toggle — favourites sorted first in list and transfer dropdown |
| 4 | Recent Beneficiaries | Quick-select chips on Transfer page — no searching needed |
| 5 | Transfer Confirmation Modal | Review screen before money moves — amount, sender, receiver, note |
| 6 | PDF Transaction Receipt | jsPDF branded A5 receipt downloaded instantly after every transfer |
| 7 | Email Notifications | Nodemailer HTML emails on transfer, beneficiary add, profile update, scheduled, standing, UPI activate |
| 8 | Scheduled Transfers | One-time future-dated transfer with node-cron auto-execution + cancel |
| 9 | Standing Instructions | Recurring DAILY/WEEKLY/MONTHLY transfers with pause/resume/cancel |
| 10 | UPI Simulation | `name@fincore` virtual payment address — activate, copy, lookup, transfer by UPI |

---

## New API Endpoints (Phase 4.1)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | /api/beneficiaries?search= | Beneficiary search (E2) |
| PATCH  | /api/beneficiaries/:id/favourite | Toggle favourite (E3) |
| POST   | /api/scheduled | Create scheduled transfer (E8) |
| GET    | /api/scheduled | List scheduled transfers (E8) |
| PATCH  | /api/scheduled/:id/cancel | Cancel pending transfer (E8) |
| POST   | /api/standing | Create standing instruction (E9) |
| GET    | /api/standing | List standing instructions (E9) |
| PATCH  | /api/standing/:id/pause | Pause instruction (E9) |
| PATCH  | /api/standing/:id/resume | Resume instruction (E9) |
| PATCH  | /api/standing/:id/cancel | Cancel instruction (E9) |
| POST   | /api/upi/activate | Generate UPI ID (E10) |
| GET    | /api/upi/me | Get my UPI ID (E10) |
| GET    | /api/upi/resolve/:upiId | Look up any UPI ID (E10) |

---

## New Pages (Phase 4.1)

| Route | Page | Enhancement |
|-------|------|-------------|
| /scheduled | Scheduled Transfers | E8 |
| /standing  | Standing Instructions | E9 |
| /upi       | UPI Management | E10 |

---

## Email Setup (Optional)

Add to `server/.env`:
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM="FinCore Bank <no-reply@fincore.io>"
```

If `EMAIL_USER` is not set, emails are logged to console — app works without SMTP.

---

## Cron Jobs (Auto-run)

| Job | Schedule | Purpose |
|-----|----------|---------|
| Scheduled transfers | Every minute | Execute pending transfers whose `executeAt` has passed |
| Standing instructions | Every hour | Execute due recurring transfers and advance `nextRunAt` |

Both start automatically when the server boots.
