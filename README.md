# Roblox Volleyball League

Official website and management platform for the Roblox Volleyball League.
It provides tools and pages for league teams, matches, players, and statistics.

## Stack

- **Hosting & backend:** Cloudflare Worker with [vinext](https://github.com/vinxi/vinext) App Router
- **Database:** Cloudflare D1 (SQLite)
- **API:** tRPC
- **Authentication:** better-auth with Roblox OAuth
- **Frontend:** React and Tailwind CSS

## Local development

Install dependencies:

```bash
pnpm install
```

Prepare the local database, including migrations and fixture data:

```bash
pnpm t3:prepare
```

Start the development server:

```bash
pnpm dev
```

Dev uses a persistent local D1 database under `.wrangler/state/`. Schema changes
are stored as SQL files in `drizzle/`; `pnpm dev` applies pending local
migrations automatically. Previously applied migrations are skipped.

## Scripts

- `pnpm dev` applies pending local D1 migrations, then starts the vinext development server.
- `pnpm test` runs the test suite.
- `pnpm lint` checks the project for linting issues.
- `pnpm typecheck` runs TypeScript type checking.
- `pnpm run build` builds the Cloudflare Worker output.
- `pnpm run start` starts the built Worker locally with Wrangler.
- `pnpm run deploy` deploys the Cloudflare Worker.
- `pnpm db:migrate:local` applies local D1 migrations without resetting fixture data.

## Documentation

- [Rebuild plan](docs/REBUILD_PLAN.md)
- [Bootstrap admin](tooling/bootstrap-admin.md)
