---
title: Local Development Setup
type: guide
status: current
area: [backend, frontend, database]
created: 2026-08-31
verified: 2026-08-31
summary: Run the stack locally via Docker Compose or separate frontend/backend processes against Postgres.
related:
  - CONTRIBUTING.md
---

# Local Development Setup

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 20+ | Check with `node --version` |
| npm | any | Bundled with Node |
| Docker | 24+ | Used for PostgreSQL (and full-stack via Compose) |
| Docker Compose | 2.x | Bundled with Docker Desktop |
| Git | any | - |

Optional if you prefer a local PostgreSQL install instead of Docker: PostgreSQL.

---

## Quick start (Docker Compose)

From the repo root:

```bash
cp BE/.env.example BE/.env
cp FE/.env.example FE/.env
docker compose up --build
```

See `docker-compose.yml` for ports (`BE` 3000, `FE` via `DOCKER_FE_PORT`, DB via
`DOCKER_DB_PORT`).

---

## Manual setup (API + Vite against local Postgres)

```bash
git clone https://github.com/ChristianDenniss/volleyProject.git
cd volley-project

cp BE/.env.example BE/.env
cp FE/.env.example FE/.env

cd BE && npm install && cd ..
cd FE && npm install && cd ..

docker compose up -d db
cd BE && npm run dev          # API on :3000
cd FE && npm run dev          # Vite on :5173
```

`FE/.env` should keep `VITE_BACKEND_URL=http://localhost:3000` unless the API
is somewhere else.

Frontend without a backend: `cd FE && npm run dev-mock`.

---

## Commands CI runs

| Check | Command |
|---|---|
| Backend build | `cd BE && npm ci && npm run build && npm test` |
| Frontend build | `cd FE && npm ci && npm run build` |

Also useful locally: `cd FE && npm run lint`.
