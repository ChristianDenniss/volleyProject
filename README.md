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
bun install
```

Prepare the local database, including migrations and fixture data:

```bash
bun run t3:prepare
```

Start the development server:

```bash
bun dev
```

Dev uses a persistent local D1 database under `.wrangler/state/`. Schema changes
are stored as SQL files in `drizzle/`; `bun dev` applies pending local
migrations automatically. Previously applied migrations are skipped.

## Scripts

- `bun dev` applies pending local D1 migrations, then starts the vinext development server.
- `bun test` runs the test suite.
- `bun run lint` checks the project for linting issues.
- `bun run typecheck` runs TypeScript type checking.
- `bun run build` builds the Cloudflare Worker output.
- `bun run start` starts the built Worker locally with Wrangler.
- `bun run deploy` deploys the Cloudflare Worker.
- `bun run db:migrate:local` applies local D1 migrations without resetting fixture data.

## Documentation

- [Rebuild plan](docs/REBUILD_PLAN.md)
- [Bootstrap admin](tooling/bootstrap-admin.md)
