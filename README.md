# Management App

Advanced task management and team collaboration platform — NestJS + PostgreSQL backend, Next.js frontend, with real-time chat, AI agent integration, and MCP server support planned for later phases.

## Tech stack

**Backend**

- NestJS + TypeScript
- PostgreSQL + Prisma ORM
- Redis (session/lockout state, BullMQ job queue)
- Passport (JWT, Google OAuth2, GitHub OAuth2)
- otplib (TOTP-based 2FA)
- Nodemailer via SendGrid SMTP relay

**Frontend**

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Zustand (state management)
- Axios

**Infrastructure**

- Docker Compose (Postgres, Redis, MinIO for local dev)

---

## Prerequisites

- Node.js 20+
- Docker Desktop
- A SendGrid account (for transactional email — verification, password reset)
- Google OAuth and GitHub OAuth apps registered 

---

## Getting started

### 1. Clone and install

```bash
git clone <repo-url>
cd Management_App

cd backend && npm install
cd ../frontend && npm install
```

### 2. Start local infrastructure

```bash
docker compose up -d
docker compose ps   # confirm postgres, redis, minio all show (healthy)
```

### 3. Environment variables

Copy `.env.example` to `.env` in `backend/` and fill them.

### 4. Database setup

```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

### 5. Run the apps

```bash
# Terminal 1 — backend (http://localhost:3001)
cd backend
npm run start:dev

# Terminal 2 — frontend (http://localhost:3000)
cd frontend
npm run dev
```

---

## Docker services

| Service | Purpose | Port |
| --- | --- | --- |
| `postgres` | Primary database | 5432 |
| `redis` | Session/lockout state, BullMQ queues | 6379 |
| `minio` | S3-compatible file storage (local dev substitute for AWS S3) | 9000 (API), 9001 (console) |

Data persists across restarts via named volumes. `docker compose down -v` wipes everything and starts fresh — only do this deliberately.

---

## Environment variables

See `backend/.env.example` for the full list with descriptions. Key groups:

- **Database / Redis** — `DATABASE_URL`, `REDIS_URL` (match the Docker Compose defaults for local dev)
- **Auth** — `JWT_SECRET`, `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY`
- **OAuth** — `GOOGLE_CLIENT_ID`/`SECRET`, `GITHUB_CLIENT_ID`/`SECRET`, plus matching callback URLs
- **Email (SendGrid SMTP)** — `SMTP_HOST`, `SMTP_PORT`, `EMAIL_USER` (`apikey` for SendGrid), `EMAIL_PASS` (SendGrid API key), `EMAIL_FROM` (must match a verified Sender Identity)
- **2FA** — `TWO_FACTOR_ENCRYPTION_KEY` (32-byte hex, encrypts TOTP secrets at rest)

---

## Project structure

```
Management_App/
├── backend/
│   ├── src/
│   │   ├── auth/           # register, login, refresh, logout, OAuth, password reset, lockout
│   │   ├── two-factor/     # TOTP setup/verification
│   │   ├── email/          # SendGrid SMTP wrapper
│   │   ├── user/           # user profile
│   │   ├── redis/          # Redis client wrapper
│   │   ├── prisma/         # Prisma service/module
│   │   ├── workspace/      # (in progress)
│   │   ├── project/        # (in progress)
│   │   ├── task/           # (in progress)
│   │   └── sprint/         # (in progress)
│   └── prisma/
│       └── schema.prisma
├── frontend/
│   ├── app/
│   │   ├── (auth)/         # login, register, password reset, email verification, OAuth callback
│   │   └── (dashboard)/    # authenticated app shell — sidebar + auth guard
│   ├── components/
│   │   └── ui/             # shared component library — Button, Input, Card, Badge, Avatar
│   ├── lib/                # api-client, colors, validators
│   └── store/               # Zustand auth store
├── docker-compose.yml
└── README.md
```

---

## Features implemented so far

**Authentication**

- Email/password register & login with bcrypt hashing
- JWT access tokens (15 min) + rotating refresh tokens (7 days, HTTP-only cookie)
- Google OAuth2 and GitHub OAuth2 login
- Email verification (JWT-based, no DB table needed)
- Forgot/reset password flow (emailed reset link, single-use DB-tracked token)
- Two-factor authentication (TOTP, QR code setup, encrypted secret at rest)
- Account lockout — refresh token misuse (used where an access token is expected) triggers a temporary account lock via Redis

**Frontend**

- Full auth page set: login, register, forgot/reset password, email verification, OAuth callback
- Dashboard shell with sidebar navigation, session persistence across page refreshes
- Shared component library for consistent styling

---

## API reference

A Postman collection covering all current endpoints is available — import it to test against a local instance. Ask in the team channel.