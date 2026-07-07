# FinCore — Enterprise Digital Banking Platform

> A production-style banking application built with React + Vite, Node.js/Express, PostgreSQL, and Prisma.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT (access + refresh tokens) + bcrypt |
| Validation | Zod |
| Logging | Winston + Morgan |
| Security | Helmet, express-rate-limit, CORS |

---

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ running locally (or Docker: `docker run -e POSTGRES_PASSWORD=password -p 5432:5432 postgres`)
- Git

---

## Quick Start

### 1. Clone and install
```bash
git clone <your-repo-url>
cd fincore/server
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env — set your DATABASE_URL and JWT secrets
```

### 3. Create the database
```bash
createdb fincore_db
# or via psql: CREATE DATABASE fincore_db;
```

### 4. Run Prisma migrations
```bash
npm run db:migrate       # creates tables
npm run db:seed          # seeds demo data
```

### 5. Start the server
```bash
npm run dev              # http://localhost:5000
```

### Demo credentials
| Role | Email | Password |
|------|-------|----------|
| User | alex@fincore.io | Demo@1234 |
| Admin | admin@fincore.io | Admin@1234 |

---

## Project Structure

```
fincore/
├── server/
│   ├── prisma/
│   │   ├── schema.prisma       # Data model — single source of truth
│   │   ├── seed.js             # Demo data seeder
│   │   └── migrations/         # Auto-generated SQL migrations
│   ├── src/
│   │   ├── config/
│   │   │   ├── prisma.js       # Prisma client singleton
│   │   │   └── logger.js       # Winston logger
│   │   ├── constants/
│   │   │   └── index.js        # HTTP codes, messages, roles
│   │   ├── controllers/        # Request/response handling only
│   │   │   ├── auth.controller.js
│   │   │   ├── account.controller.js
│   │   │   ├── transaction.controller.js
│   │   │   ├── beneficiary.controller.js
│   │   │   └── user.controller.js
│   │   ├── middleware/
│   │   │   ├── authenticate.js # JWT verification
│   │   │   ├── authorize.js    # Role-based access control
│   │   │   ├── validate.js     # Zod schema validation
│   │   │   ├── auditLog.js     # Audit trail writer
│   │   │   └── errorHandler.js # Global error handling
│   │   ├── repositories/       # Data access layer (Prisma queries)
│   │   │   ├── user.repository.js
│   │   │   ├── account.repository.js
│   │   │   ├── transaction.repository.js
│   │   │   ├── session.repository.js
│   │   │   └── beneficiary.repository.js
│   │   ├── routes/             # Express routers
│   │   │   ├── auth.routes.js
│   │   │   ├── account.routes.js
│   │   │   ├── transaction.routes.js
│   │   │   ├── beneficiary.routes.js
│   │   │   └── user.routes.js
│   │   ├── services/           # Business logic layer
│   │   │   ├── auth.service.js
│   │   │   ├── account.service.js
│   │   │   ├── transaction.service.js
│   │   │   ├── beneficiary.service.js
│   │   │   └── user.service.js
│   │   ├── utils/
│   │   │   ├── response.js     # Standardised API responses
│   │   │   ├── token.js        # JWT helpers
│   │   │   └── accountNumber.js
│   │   ├── validations/        # Zod schemas
│   │   │   ├── auth.validation.js
│   │   │   └── transaction.validation.js
│   │   ├── app.js              # Express app (middleware + routes)
│   │   └── server.js           # Server entry + DB connect
│   ├── .env.example
│   └── package.json
├── FinCore.postman_collection.json
└── README.md
```

---

## API Reference

All responses follow: `{ success: boolean, message: string, data?: any, errors?: any[] }`

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | — | Register new user |
| POST | /api/auth/login | — | Login, returns tokens |
| POST | /api/auth/refresh | — | Rotate refresh token |
| POST | /api/auth/logout | Bearer | Invalidate session |

### Accounts
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/accounts | Bearer | List user's accounts |
| GET | /api/accounts/:id | Bearer | Single account |
| POST | /api/accounts | Bearer | Create account |

### Transactions
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/transactions/transfer | Bearer | Atomic fund transfer |
| GET | /api/transactions | Bearer | Paginated history |
| GET | /api/transactions/:id | Bearer | Single transaction |

### Beneficiaries
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/beneficiaries | Bearer | List beneficiaries |
| POST | /api/beneficiaries | Bearer | Add beneficiary |
| DELETE | /api/beneficiaries/:id | Bearer | Remove beneficiary |

### Profile
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/users/profile | Bearer | Get user profile |
| PUT | /api/users/profile | Bearer | Update profile |

---

## Key Design Decisions

### Atomic Transfers
Money transfers use **Prisma interactive transactions** (`prisma.$transaction(async (tx) => {...})`).
Both balance deductions and the transaction record either all succeed or all roll back. No partial states.

### Refresh Token Rotation
Every token refresh invalidates the old refresh token and issues a new one. Stolen tokens become useless after the legitimate user refreshes.

### Layered Architecture
```
Request → Route → Middleware → Controller → Service → Repository → Prisma → PostgreSQL
```
Each layer has a single responsibility, making it easy to test, swap, or extend.

---

## Development Roadmap

- [x] Phase 1: Database schema + Prisma setup
- [x] Phase 2: Layered backend (auth, accounts, transactions, beneficiaries, profile)
- [ ] Phase 3: React + Vite frontend
- [ ] Phase 4: Containerise with Docker
- [ ] Phase 5: Deploy on OpenShift
- [ ] Phase 6: CI/CD with Tekton
- [ ] Phase 7: Monitoring with Prometheus + Grafana
