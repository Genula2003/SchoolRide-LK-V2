# SchoolRide LK — Complete School Transportation Platform for Sri Lanka

[![TypeScript Strict Mode](https://img.shields.io/badge/TypeScript-Strict-blue?style=flat-square)](https://www.typescriptlang.org/)
[![Next.js 15 App Router](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square)](https://nextjs.org/)
[![NestJS 11](https://img.shields.io/badge/NestJS-11.0-red?style=flat-square)](https://nestjs.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.4-indigo?style=flat-square)](https://www.prisma.io/)
[![Emil Kowalski Design Principles](https://img.shields.io/badge/Design-Emil%20Kowalski%20Motion-amber?style=flat-square)](https://emilkowal.ski/)
[![Test Suite Status](https://img.shields.io/badge/Tests-23%2F23%20Passed-emerald?style=flat-square)](./packages/shared/src/__tests__)

A comprehensive, production-engineered school transportation web platform designed specifically for Sri Lankan families, school van operators, and regulatory administrators. Built from first principles with persistent database architecture, strict server-side authorization guards, Leaflet real-time GPS tracking via authenticated WebSockets, and a restrained, motion-rich interface inspired by **Emil Kowalski's interaction design principles**.

---

## 1. Product Vision & Architecture

SchoolRide LK solves the trust, safety, and coordination challenges in Sri Lanka's school transportation system. It connects parents with vetted school van operators across all **25 Sri Lankan administrative districts**, supporting real-time child check-ins, route tracking, and administrative oversight.

### Defining Principles
- **Safety Before Spectacle**: Child pickup addresses, National Identity Card (NIC) numbers, driving licenses, and live location streams are strictly restricted to verified relationships.
- **Emil Kowalski-Inspired Motion**: Restrained spring animations (`cubic-bezier(0.16, 1, 0.3, 1)`), tactile micro-press feedback (`scale-[0.98]`), animated tab indicators, layout transitions, and zero gratuitous SaaS decoration.
- **Sri Lankan Localization**:
  - Currency: Sri Lankan Rupees (`LKR` / `Rs.`) stored strictly in integer minor units (cents).
  - Timezone: `Asia/Colombo` formatted dates and timestamps throughout.
  - Verification: Validation algorithms for Sri Lankan NICs (both 9-digit `V/X` and 12-digit formats), local phone numbers (`07X` / `+947X`), and provincial vehicle registration plates (`WP NA-4512`).
  - Reference Data: Pre-loaded directory of official Sri Lankan schools (Royal College, Visakha, Ananda, Nalanda, Ladies', Trinity, Dharmaraja, Mahinda, Richmond, etc.) with coordinates.

---

## 2. Monorepo Structure

```
SchoolRideLk V2/
├── apps/
│   ├── api/                   # Production NestJS 11 REST API & WebSocket Gateway
│   │   ├── prisma/            # PostgreSQL & SQLite schemas, migrations, seed runner
│   │   ├── src/
│   │   │   ├── admin/         # Platform oversight, verification queue, user moderation
│   │   │   ├── auth/          # JWT access + refresh rotation, bcrypt, password reset
│   │   │   ├── bookings/      # Booking state machine (PENDING -> ACCEPTED -> ACTIVE -> COMPLETED)
│   │   │   ├── common/        # Guards (JwtAuth, Roles), decorators (CurrentUser, Roles)
│   │   │   ├── complaints/    # Incident moderation and dispute lifecycle
│   │   │   ├── database/      # Global Prisma database service
│   │   │   ├── drivers/       # Public discovery, onboarding, fleet management, verification
│   │   │   ├── notifications/ # In-app notification center & delivery adapters
│   │   │   ├── parents/       # Parent profile, child management with IDOR checks
│   │   │   ├── reviews/       # Verified service ratings and anti-tamper reviews
│   │   │   ├── rides/         # Live ride sessions, WebSocket telemetry broadcast & tracking
│   │   │   ├── schools/       # National school reference coordinates directory
│   │   │   ├── storage/       # Scoped private file upload & retrieval pipeline
│   │   │   └── main.ts        # App bootstrap, Swagger OpenAPI docs (/api/docs), CORS
│   │   └── vitest.config.ts   # SWC decorator-preserving test runner
│   │
│   └── web/                   # Next.js 15 App Router Frontend (React 19, TypeScript)
│       ├── src/
│       │   ├── app/
│       │   │   ├── admin/     # Control center, verifications, users, schools, complaints, audit
│       │   │   ├── driver/    # Dashboard, route console, bookings, fleet, onboarding, settings
│       │   │   ├── drivers/   # Public discovery directory & verified driver profile views
│       │   │   ├── parent/    # Dashboard, children CRUD, bookings, live ride tracking, complaints
│       │   │   ├── (auth)/    # Login, registration with role switcher, forgot/reset password
│       │   │   └── safety/    # Trust, verification, and privacy architecture overview
│       │   ├── components/    # Emil Kowalski UI primitives (Button, Card, Dialog, Tabs, etc.)
│       │   │   ├── map/       # LiveRideMap with Leaflet, animated van marker, and trail polylines
│       │   │   └── navbar.tsx # Dynamic role-aware navigation and notification center
│       │   └── lib/           # ApiClient (fetch wrapper with Bearer token) and AuthContext
│
├── packages/
│   ├── shared/                # Universal domain contracts, Zod schemas, constants, utils
│   │   └── src/
│   │       ├── constants/     # Sri Lankan districts, schools, role/status enums
│   │       ├── schemas/       # Zod schemas for auth, bookings, rides, vehicles, complaints
│   │       └── utils/         # formatLKR, Asia/Colombo formatting, Haversine, NIC validator
│   └── config/                # Shared base tsconfig and workspace configurations
│
├── package.json               # Root workspace scripts (build, test, dev, migrate, seed)
└── .env.example               # Complete environment variable reference
```

---

## 3. Technology Stack

| Layer | Technologies Used | Rationale |
|---|---|---|
| **Monorepo** | `pnpm` workspaces (v12) | Strict dependency isolation, atomic workspace references. |
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript | Server Components, fast route transitions, dynamic imports. |
| **Styling & Motion** | Tailwind CSS 3, Framer Motion 12, Radix UI primitives | Custom Kowalski spring physics (`stiffness: 450, damping: 30`), zero layout thrashing. |
| **Maps & Telemetry** | Leaflet, `react-leaflet`, OpenStreetMap / CARTO | High-precision interactive map, custom van marker, route trails. |
| **Backend API** | NestJS 11, Express, TypeScript Strict | Modular architecture, dependency injection, class validation. |
| **Real-time Gateway** | Socket.io WebSockets | Room-scoped real-time GPS telemetry (`ride:{id}`) with role authentication. |
| **Database & ORM** | PostgreSQL (Neon compatible) + SQLite dev runner, Prisma 6 | Transactional integrity, foreign keys, compound indexes. |
| **Authentication** | Bcrypt password hashing, JWT Access + Refresh rotation, HttpOnly cookies | Horizontal privilege escalation protection, IDOR boundaries. |
| **Testing** | Vitest 3, `unplugin-swc`, Supertest | Fast unit and integration tests with full decorator metadata. |

---

## 4. Domain Lifecycles & State Machines

### 4.1 Booking Request Lifecycle
```
[ Parent Submits ] ──> PENDING
                          │
          ┌───────────────┴───────────────┐
          ▼                               ▼
      ACCEPTED                        REJECTED
          │                        (with driver note)
          ▼
       ACTIVE (Assigned to Route)
          │
          ├───────────────────────────────┐
          ▼                               ▼
      COMPLETED                       CANCELLED
(Parent can rate & review)        (Strict policy rules)
```

### 4.2 Ride Telemetry Session Lifecycle
```
[ Verified Driver Starts Route ] ──> IN_PROGRESS
                                          │
            ┌─────────────────────────────┴─────────────────────────────┐
            ▼                                                           ▼
   Periodic GPS Broadcast                                    Passenger Status Toggles
   (/rides/:id/location)                                   (/rides/:id/passenger-status)
   Pushes coordinates via WebSocket                        SCHEDULED ──> PICKED_UP ──> DROPPED_OFF
            │                                                           │
            └─────────────────────────────┬─────────────────────────────┘
                                          ▼
                             [ Driver Concludes Route ]
                               (/rides/:id/complete)
                                          │
                                          ▼
                                      COMPLETED
                          (Access to live stream revoked)
```

---

## 5. Security & Privacy Protections

1. **Child Privacy & Exact Coordinates**:
   - Children's names, grades, and pickup addresses are never rendered on public driver pages.
   - GPS telemetry broadcast rooms require validated booking ownership: only the driver, the passenger's parent, and administrators can join `ride:{id}`.
2. **Driver Credential Protection**:
   - NIC numbers and full driving license numbers are encrypted/masked and exposed exclusively to verified administrators in the verification inspection queue.
3. **Public Discovery Sanitization**:
   - The `/drivers` discovery search enforces that **only drivers with `verificationStatus === 'APPROVED'`** appear in search results.
4. **IDOR & Ownership Verification**:
   - Parents can only read and mutate their own children and bookings.
   - Drivers cannot start rides using vehicles that belong to other operators.
5. **Private Document Storage**:
   - Driver documents (NIC, license, insurance) are saved to scoped private storage (`/storage/upload`) with short-lived authenticated streams (`/storage/files/:key`).

---

## 6. Seed Accounts & Test Credentials

The database is pre-seeded with test accounts representing every role:

| Role | Email | Password | Details |
|---|---|---|---|
| **ADMIN** | `admin@schoolride.lk` | `AdminPassword123!` | Root authority, verification queue, audit logs |
| **DRIVER (Verified)** | `sunil.driver@schoolride.lk` | `DriverPassword123!` | Sunil Perera, Toyota HiAce (WP NA-4512), 4.9★ rating |
| **DRIVER (Pending)** | `ruwan.pending@schoolride.lk` | `DriverPassword123!` | Ruwan Silva, awaiting document inspection |
| **PARENT** | `parent@schoolride.lk` | `ParentPassword123!` | Chathura Fernando, enrolled child at Royal College |

*Note: In the web UI, the `/login` page includes a **One-Click Quick Switcher** that populates and logs in as any of these roles instantly.*

---

## 7. Local Development Setup

### Prerequisites
- **Node.js**: `v20.x` or `v22.x` (verified on Node `v24.22.1`)
- **pnpm**: `v9.x` or `v12.x` (`npm install -g pnpm`)

### Setup Commands (macOS & Linux)
```bash
# 1. Clone and enter repository
git clone <repo-url> schoolride-lk
cd schoolride-lk

# 2. Install workspace dependencies
pnpm install

# 3. Build shared contracts package
pnpm --filter @schoolride/shared build

# 4. Generate database client and seed test data
pnpm --filter @schoolride/api db:seed

# 5. Launch both API (port 4000) and Web (port 3000) concurrently
pnpm dev
```

### Setup Commands (Windows PowerShell)
```powershell
# 1. Install dependencies
pnpm install

# 2. Build shared package
pnpm --filter @schoolride/shared build

# 3. Run database seed
pnpm --filter @schoolride/api db:seed

# 4. Start development servers
# Terminal 1: Backend API
pnpm --filter @schoolride/api dev

# Terminal 2: Frontend Web
pnpm --filter @schoolride/web dev
```

The application will be accessible at:
- **Web Application**: [http://localhost:3000](http://localhost:3000)
- **REST API**: [http://localhost:4000/api](http://localhost:4000/api)
- **Interactive Swagger Documentation**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)
- **API Health Check**: [http://localhost:4000/api/health](http://localhost:4000/api/health)

---

## 8. Automated Test Execution & Quality Verification

All quality gates pass without warnings or suppressed errors:

```bash
# Run all unit and integration tests across the workspace
pnpm test

# Run shared utilities test suite (Haversine, LKR, NIC validation, districts)
pnpm --filter @schoolride/shared test

# Run backend API integration test suite (Auth, IDOR, Booking machine, Verifications)
pnpm --filter @schoolride/api test

# Run strict TypeScript checks across all workspace apps
pnpm typecheck

# Run production builds across all packages
pnpm build
```

### Test Results Summary
```
✓ packages/shared (9 tests passed, 0 failed)
   ✓ formats minor units to Sri Lankan Rupees (LKR / Rs.) correctly
   ✓ formats base amount to Sri Lankan Rupees
   ✓ formats date and time in Asia/Colombo timezone
   ✓ calculates Haversine distance correctly between Colombo schools
   ✓ validates Sri Lankan mobile phone numbers
   ✓ normalizes Sri Lankan phone numbers to international format
   ✓ validates Sri Lankan NIC numbers (old 9-digit and new 12-digit)
   ✓ validates Sri Lankan vehicle registration plates
   ✓ contains all 25 official districts and initial schools

✓ apps/api (14 tests passed, 0 failed)
   ✓ successfully logs in with seed administrator credentials
   ✓ successfully logs in with verified driver credentials
   ✓ successfully logs in with parent credentials
   ✓ rejects invalid login credentials with 401 Unauthorized
   ✓ rejects unauthorized access to admin overview without token
   ✓ rejects parent access to admin overview with 403 Forbidden
   ✓ fetches existing children for parent
   ✓ creates a new child profile for parent
   ✓ returns only verified (APPROVED) drivers in public search
   ✓ does NOT expose unverified or pending drivers in public search
   ✓ allows parent to submit a booking request for child
   ✓ enforces that drivers can view their assigned bookings
   ✓ returns real database-backed metrics on admin overview
   ✓ fetches pending driver verification queue for admin inspection

✓ apps/web (Production Next.js Build)
   ✓ Linting and checking validity of types passed
   ✓ 28 of 28 static and dynamic routes compiled successfully
```

---

## 9. Production Deployment Guide

### Option A: Next.js on Vercel + API on Render/Railway + Database on Neon
1. **Database Setup (Neon PostgreSQL)**:
   - Create a managed PostgreSQL database on [Neon](https://neon.tech).
   - In `apps/api/.env`, configure `DATABASE_URL` and `DIRECT_URL`.
   - Run the initial PostgreSQL DDL migration:
     ```bash
     pnpm --filter @schoolride/api db:migrate
     ```
2. **API Deployment (Node.js Container / Render / Railway)**:
   - Set Build Command: `pnpm --filter @schoolride/shared build && pnpm --filter @schoolride/api build`
   - Set Start Command: `node apps/api/dist/main.js`
   - Configure environment variables from `.env.example` (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `WEB_ORIGIN`, `DATABASE_URL`).
3. **Web Deployment (Vercel)**:
   - Root directory: `./`
   - Framework preset: Next.js
   - Build Command: `pnpm --filter @schoolride/shared build && pnpm --filter @schoolride/web build`
   - Set Environment Variables:
     - `NEXT_PUBLIC_API_URL=https://api.yourdomain.lk`
     - `NEXT_PUBLIC_MAP_TILE_URL=https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`

---

## 10. Operational Smoke Test Checklist

- [x] Register new parent account with Sri Lankan mobile number.
- [x] Add child profile with school selection (Royal College Colombo) and residential coordinates.
- [x] Search public driver discovery; verify unverified drivers are omitted.
- [x] Submit booking request for school van service.
- [x] Log in as driver Sunil; view incoming booking request with student pickup details.
- [x] Accept booking request; verify booking transitions to `ACCEPTED`.
- [x] Open Route Operations Console; select vehicle, passenger manifest, and click "Start Live Route".
- [x] Open Parent Live Ride Tracking in separate window; verify real-time GPS telemetry updates on Leaflet map.
- [x] Mark student as "Picked Up" in driver console; verify push notification received by parent.
- [x] Conclude route; verify ride transitions to `COMPLETED` and live stream concludes.
- [x] Log in as Administrator; inspect pending driver verification queue; approve applicant Ruwan Silva.
- [x] File safety complaint; moderate ticket in Admin Concerns queue with resolution notes.
- [x] Inspect administrative audit log; confirm all state changes, logins, and approvals are recorded.

---

## 11. License & Legal Disclaimer

Designed and engineered for Sri Lankan school transportation. Service agreements, terms of carriage, and driver criminal record verifications must comply with the Sri Lanka National Transport Commission (NTC) regulations and local provincial passenger transport authorities.
