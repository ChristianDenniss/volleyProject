# vinext app

This project was created with create-vinext-app.

## Scripts

- `pnpm run dev` applies pending local D1 migrations, then starts the vinext dev server.
- `pnpm run build` builds the Cloudflare Worker output.
- `pnpm run start` starts the built Worker locally with Wrangler.
- `pnpm run deploy` deploys the Cloudflare Worker.

## Local database

Dev uses a **persistent** local D1 database under `.wrangler/state/`. Schema changes land as SQL files in `drizzle/`; `pnpm dev` runs `db:migrate:local` first so new migrations apply automatically. Already-applied migrations are skipped.

First-time or reset setup (migrations + fixture seed):

```bash
pnpm t3:prepare
```

Migrations only (no seed wipe):

```bash
pnpm db:migrate:local
```
