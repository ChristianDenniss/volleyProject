# Backend (BE)

Express + TypeORM API for the Volleyball Project.

## Setup

1. Copy env defaults: `cp .env.example .env` (or copy on Windows)
2. Install deps: `npm install`
3. Ensure Postgres is running (see root `docker-compose.yml` or local Postgres)
4. Run migrations if needed: `npx typeorm migration:run -d src/db/data-source.ts` (see project scripts)
5. Start: `npm run dev`

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Nodemon + ts-node development server |
| `npm start` | Run with ts-node |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm test` | Jest unit/integration tests |

## Key env vars

See `.env.example` for the full list. Notable:

- `JWT_SECRET` — required; use a strong value outside local placeholders
- `CORS_ORIGINS` — comma-separated browser origins
- `ADMIN_IP_ALLOWLIST` — optional admin IP gate
- `CHALLONGE_API_KEY` — required for Challonge import
- `REDIS_URL` / `REDIS_DISABLED` — optional caching

## Layout

- `src/modules/` — feature routes, controllers, services, entities
- `src/middleware/` — auth, CSRF, rate limits, validation
- `src/db/` — TypeORM data source and seed helpers
- `src/migrations/` — database migrations
