# Rebuild Plan — Agent Handoff

You are picking up a rebuild in progress. Read this document fully before touching anything. It is written to be self-contained: every fact below was verified against the source, and every claim cites where it came from. Where something is unknown, it says so — **do not fill gaps with assumptions.**

---

## 0. Hard rules

These are non-negotiable and were stated directly by the repo owner.

1. **Never `git push`.** Never `gh pr create`. Never any remote-writing git command. Commit freely on the working branch and stop; the owner pushes manually after review.
2. **Never write code comments.** Not in `.ts`, `.tsx`, `.css`, `.yaml`, `.jsonc`, not docblocks, not section banners. Explanations belong in this document or in your reply, never in the file. This rule governs what you write; leave comments in pre-existing `BE/` and `FE/` files alone.
3. **Do not re-litigate settled decisions.** §5 lists them. If you think one is wrong, say so once and proceed as decided.
4. **Do not invent answers to §6.** Ask.

Working branch: `migrate/cloudflare-vinext`, cut from `fix_overlooks`.

---

## 1. What this project is

A volleyball league site — seasons, teams, players, games, per-game stats, awards, records, tournament matches, and articles — with a public site and an admin portal.

It is currently two separately deployed applications. It is being rebuilt as **one Cloudflare Worker**.

**This is a rebuild, not a migration.** No cutover, no REST parity, no data carried across, no rollback path. `BE/` and `FE/` remain in the tree as reference and are deleted in the final phase.

> **Consequence, understood and accepted by the owner:** the league's existing data does not come across. D1 starts empty. The Postgres instance survives as a backup and the new schema will exist, so an import can be written later if that changes. Until then, portal CRUD and the stats CSV upload are the only ways data enters the system — which makes them day-one critical, not admin conveniences.

---

## 2. State: what is done, what is not

### Done and committed

| Commit | What |
|---|---|
| `ae3bb57` | vinext app scaffolded at `app/`, Cloudflare Workers target, pnpm |
| `6c4d5cf` | shadcn/ui initialized on Radix primitives |

`app/` currently contains only the scaffold plus shadcn:

```
app/
  app/layout.tsx  app/page.tsx  app/globals.css  app/api/hello/route.ts
  components/ui/button.tsx
  lib/utils.ts
  components.json  next.config.ts  package.json  pnpm-workspace.yaml
  postcss.config.mjs  tsconfig.json  vite.config.ts  wrangler.jsonc
```

`pnpm run build` passes across all five vinext environments. That is the entire extent of the new application — no schema, no auth, no routes, no services.

### Not started

Everything else. Phases 1 through 11 in §9.

---

## 3. Target architecture

| Concern | Choice |
|---|---|
| Framework | **vinext** — Next.js App Router on Vite, Cloudflare Workers target, maintained by Cloudflare (`github.com/cloudflare/vinext`) |
| Runtime | **One Worker** serving SSR HTML, tRPC, and static assets |
| ORM | **Drizzle** (`drizzle-orm` + `drizzle-kit`) |
| Database | **Cloudflare D1**, starting empty |
| Auth | **better-auth**, **Roblox OAuth only** — no passwords, no email |
| Writes | **tRPC v11**, mutations only |
| Reads | Service functions called directly in RSC — never over the wire |
| Background | **Cloudflare Queues** for record recalculation |
| Cache | **None.** No Redis, no KV, no cache service |
| Styling | **Tailwind v4** + **shadcn/ui on Radix** |
| Tests | **vitest** + `@cloudflare/vitest-pool-workers` |
| Package manager | **pnpm** |

### vinext gaps that matter

Supported and relied on: App Router, RSC, Server Actions, route handlers, middleware, ISR, `next/link`, `next/image`, `next/navigation`, `next/headers`, `next/cache`, the Metadata API, Workers bindings.

Known gaps, none of which this project hits: `"use cache"` / Cache Components / PPR incomplete; build-time image and font optimization partial; native modules (`sharp`, `satori`, `@napi-rs/canvas`) can fail in dev; `runtime` and `preferredRegion` route config ignored.

Upstream's own words: *"not yet a drop-in replacement for every application or production workload."*

**Mitigation — treat this as a standing architectural rule.** Everything under `server/services/` is a plain function taking `(db, args)`. No `next/*` imports, no request objects, no `cookies()`. RSC pages and tRPC procedures both call these. If vinext hits a wall, the service layer, schema, routers, auth, and tests survive a swap to React Router v7 or OpenNext; only `app/app/` is lost.

### Layout to build toward

```
app/
  app/                 App Router (vinext auto-detects this path)
    (site)/            public pages
    portal/            admin, session-gated
    api/auth/[...all]/route.ts
    api/trpc/[trpc]/route.ts
    not-found.tsx
  server/
    db/{schema.ts,index.ts}
    services/
    trpc/{init.ts,routers/}
    auth.ts
    queue.ts
  components/          ui/ is shadcn-owned
  tooling/             inventory extractors, §8
  tests/
  drizzle/
```

Aliases to add in `tsconfig.json` `paths`, mirrored in `vite.config.ts` and `vitest.config.ts`: `@db` → `server/db`, `@server` → `server`, `@components` → `components`. The scaffold's `@/*` → `./*` stays (shadcn depends on it).

**Enforce with ESLint `no-restricted-imports` scoped to `"use client"` files: a client component may never import `@db` or `@server`.** Without this, a stray import leaks the D1 binding into a browser bundle and it will not be obvious.

---

## 4. The old system — verified facts

Measured, not estimated.

**`BE/`** — Express 4, ESM, `ts-node`. 120 TypeScript files, 14,812 lines. TypeORM 0.3 with 10 entities and 17 migrations against Postgres on Fly.io (`volley-project-backend`, region `yyz`). Auth is `jsonwebtoken` HS256 + `bcryptjs` with roles `user` / `admin` / `superadmin`. A second auth path exists via `apiKeyAuth.ts` + `API_SECRET_KEY`. Caching is `ioredis`, TTL 600, on `players` and `stats` reads only. Validation is Zod 3 behind a `validate()` middleware. Tests are Jest 29 + `@swc/jest` + supertest.

Modules: `articles`, `awards`, `games`, `matches`, `players`, `records`, `roblox`, `seasons`, `stats`, `teams`, `trivia`, `user`.

**`FE/`** — Vite 6 + React 19 SPA. 76 files, 17,976 lines. `react-router-dom` v6, all 38 routes declared in `src/App.tsx`. Data flows through generic hooks — `useFetch<T>(endpoint)` builds `${VITE_BACKEND_URL}/api/${endpoint}` and `hooks/authFetch.ts` injects the JWT. Deployed on Netlify.

**Styling** — 47 plain `.css` files totalling 13,261 lines, applied across 1,251 `className` sites. Despite `sass` being a dependency there is **not one `.scss` file**; it is unused.

### Dead weight confirmed

- `@nestjs/common` and `@nestjs/core` are installed and never imported.
- Both `redis` and `ioredis` are installed.
- `BE/src/modules/strategy/` is an **empty directory**. The only other matches for "strategy" are TypeORM naming-strategy references inside migrations.

### Defects found in the old code

Recorded so the rebuild does not reproduce them.

1. **Double `@JoinTable`.** `Teams.players` declares `@JoinTable({name:'teams_players'})` *and* `Players.teams` declares `@JoinTable()`. TypeORM permits exactly one owning side, so the live database very likely holds two unrelated join tables with code writing one and reading the other. Same pattern to distrust on `Teams.games`, `Awards.players`, `Article.likedBy`. **Irrelevant to the rebuild** — nothing is imported — but do not copy the entity relations verbatim.

2. **`calculateAllRecords()` cannot run on a Worker.** In `BE/src/modules/records/records.service.ts:227`, it loads *every* `Stats` row with `player`, `game`, and `game.season` joined into memory, then runs six loop groups over the record-type lists, each performing a `DELETE` followed by **one `save()` per row** for the top 10. A full table scan in JavaScript plus several hundred sequential round trips inside one HTTP request. Slow on Fly; over CPU and round-trip limits on Workers. See §9 phase 9.

3. **`Records.record` is a 41-value enum**, roughly 30 of which are a generated `best total spiking % with N+ attempts` series.

4. **No 404 route.** `App.tsx` declares no catch-all. Netlify's SPA fallback serves `index.html`, so unknown URLs return **HTTP 200** with an empty `main-content`.

5. **`/profile` and `/articles/create` have no client-side guard.** Only `/portal` is wrapped in `PrivateRoute` (`FE/src/App.tsx:90`, `roles={["admin","superadmin"]}`). The server does reject unauthenticated article creation, so today an anonymous visitor opens the create page and only discovers the problem on submit.

6. **`/teams/:teamName` keys on name** while `/games/:id`, `/seasons/:id`, `/players/:id`, `/articles/:id`, and `/awards/:id` key on id.

### The 38 routes

Source of truth is `FE/src/App.tsx`. Do not retype this list from here — §8 generates it.

Public (24): `/`, `/about`, `/players`, `/players/:id`, `/teams`, `/teams/:teamName`, `/games`, `/games/:id`, `/seasons`, `/seasons/:id`, `/articles`, `/articles/:id`, `/articles/create`, `/awards`, `/awards/:id`, `/contact`, `/privacy-policy`, `/credits`, `/stats`, `/schedules`, `/applications`, `/faq`, `/records`, `/trivia`

Auth (3): `/profile`, `/login`, `/signup`

Portal (11), gated `["admin","superadmin"]`: `/portal` (index → Dashboard), plus `/portal/{users,players,teams,seasons,games,stats,awards,articles,matches}`

`/articles/create` is declared *after* `/articles/:id`. react-router v6 ranks by specificity and App Router prefers static over dynamic, so behavior is identical. **This is not a bug — do not "fix" it.**

### The ~104 endpoints

Roughly 60 reads and 40 writes across the 12 modules. Full inventory is generated in §8 phase 2 — do not hand-transcribe it.

Two need special handling:

- `POST /api/records/calculate` → queue (§9 phase 9).
- `POST /api/stats/batch-csv` → the frontend already has `utils/csvParser.ts` and `utils/csvUploadUtils.ts`, so parse client-side and send rows through a tRPC mutation rather than uploading a file.

---

## 5. Decisions already made — do not re-litigate

| Decision | Detail |
|---|---|
| **Existing data** | Nothing comes across. Fresh empty D1. |
| **Auth** | Roblox OAuth only. No passwords, no email/password, no reset flow, no mail provider. |
| **Writes** | tRPC mutations. Reads stay server-side in RSC. |
| **Cache** | Removed entirely. No Redis, no KV, no cache binding. |
| **`Records.record`** | Split into `(metric, min_attempts)` instead of a 41-value enum. |
| **Styling** | Tailwind. All 47 `.css` files dropped. `sass` removed. |
| **Component library** | shadcn/ui on **Radix** (`--base radix`), not Base UI. |
| **404** | Added — see §7. |
| **`/profile`, `/articles/create`** | Guarded, `auth: "session"` — see §7. |
| **`API_SECRET_KEY` machine auth** | Deleted. No replacement. |
| **Images** | Stay on their existing external host. No R2. |
| **`records/calculate`** | Manual trigger from the portal → queue. No cron. |
| **`strategy` module** | Dropped, it is an empty directory. |
| **Package manager** | pnpm. |
| **REST API** | Not ported. The only two route handlers in the new app are better-auth's and tRPC's. |

### What deleting the REST layer costs

No HTTP surface remains for an external integration. The owner accepted this: `API_SECRET_KEY` is being deleted, whether anything external ever called `/api/*` is unknown and moot since the old origin disappears. If a public API is wanted later it returns as a deliberate versioned surface, not as a side effect of internal implementation.

Also deleted for the same reason: the `/skinny` and `/medium` endpoint families (`teams/skinny`, `teams/medium`, `seasons/skinny`, `seasons/medium`, `players/medium`, `games/skinny`, `awards/skinny`) existed only to trim SPA payloads and have no purpose under RSC; and the `PUT` duplicate of every `PATCH` route, since both already pointed at the same controller method.

---

## 6. Open questions — ask, do not assume

1. **Domain** for the Worker.
2. **`/teams/:teamName`** — preserve name-keying, or normalize to id like its siblings?
3. **Cloudflare account id + API token** (or an interactive `wrangler login`).
4. **Roblox OAuth app** — must be registered by the owner; does not exist yet. Needed: client id, client secret, and both callback URLs registered.
5. **`CHALLONGE_API_KEY`** — carry over only if the Challonge match import survives the rebuild.

---

## 7. Auth design

No email/password. better-auth with one social provider:

```typescript
export const auth = betterAuth({
    socialProviders: {
        roblox: {
            clientId: env.ROBLOX_CLIENT_ID,
            clientSecret: env.ROBLOX_CLIENT_SECRET,
        },
    },
    plugins: [admin()],
})
```

Client: `authClient.signIn.social({ provider: "roblox" })`. Callback is `{origin}/api/auth/callback/roblox` — register production and `http://localhost:3000/...` both.

### Roblox returns no email address

better-auth fills `user.email` with `preferred_username`. Three consequences that will cause bugs if forgotten:

- The `email` column holds a **username**. Nothing may validate it as an email or attempt to send mail to it.
- **Key everything on `user.id`.** Never join or look up by email or username. A user who renames on Roblox keeps the same provider account id, so identity survives a rename only if nothing depended on the name.
- Account linking is moot with a single provider, which removes the takeover surface that email-based auto-linking would otherwise create.

### Admin bootstrap — a real step

A fresh database has no admin, and with Roblox-only sign-in there is no seeded credential to create one. The portal is unreachable until this is done:

```
wrangler d1 execute <db> --remote --command "UPDATE user SET role='superadmin' WHERE id='<id>'"
```

Sequence: deploy → sign in once via Roblox → read the generated id → run the above. **Rehearse on preview before production.**

### Route auth values

| Route | Old | New |
|---|---|---|
| `/profile` | unguarded | `auth: "session"` |
| `/articles/create` | unguarded | `auth: "session"` |
| `/portal/*` | `["admin","superadmin"]` | unchanged |

`session`, not `admin`, for the two fixes: the old server used `authenticateCombined` on `POST /api/articles`, which accepts any authenticated user, and articles carry a nullable `approved` column implying moderation rather than authorship restriction.

Enforce via redirect from a shared layout segment, not a per-page check — same reasoning as putting authorization in tRPC middleware.

### The 404

`app/not-found.tsx`. Two behaviors, the second more important:

1. Unmatched URLs render it with a real **HTTP 404**, replacing today's 200-with-empty-shell.
2. **Resolvable routes with missing records call `notFound()`.** `/players/999999`, `/teams/does-not-exist`, and every other dynamic segment must 404 rather than render a page shaped around `undefined`. With data fetched server-side, a missing row is knowable before render — something the client-fetching SPA could never do cleanly.

### Deleted with the old stack

`jsonwebtoken`, `bcryptjs`, `authentication.ts`, `combinedAuth.ts`, `apiKeyAuth.ts`, `API_SECRET_KEY`, `JWT_SECRET`, `authFetch.ts`, `useLogin.ts`, `useSignUp.ts`, `SignUp.tsx`, and the `/signup` route.

---

## 8. Route completeness — the anti-omission machinery

38 routes and ~104 endpoints is past the size where hand-porting is trustworthy. Two failure modes to design against: **omission** (a route silently never gets built) and **invention** (behavior assumed rather than read). This makes both build failures.

### 8.1 Inventories are extracted, never hand-written

Three scripts under `app/tooling/`, each parsing the old source with the TypeScript compiler API and emitting JSON. **Nothing on this list may come from anyone's reading of the code, including this document's §4.**

| Script | Reads | Emits |
|---|---|---|
| `extract-routes.ts` | `FE/src/App.tsx` JSX `<Route>` elements | `route-inventory.json` — `{path, component, componentFile, sourceLine, parentPath, roles}` |
| `extract-endpoints.ts` | `BE/src/modules/**/*.routes.ts` | `endpoint-inventory.json` — `{method, path, controllerMethod, middleware[], sourceFile, sourceLine}` |
| `extract-data-deps.ts` | each component named in the route inventory | `route-data-deps.json` — data hooks called, resolved against the endpoint inventory |

`middleware[]` capturing `authenticateCombined`, `validate(schema)`, and `cacheMiddleware` is what makes **auth requirements extracted rather than assumed**.

`extract-data-deps.ts` is the core of the whole approach. Whether `/faq`, `/credits`, `/about`, or `/applications` is static or data-driven gets answered by walking call expressions — not guessed from the route name.

### 8.2 The manifest

`app/route-manifest.ts`, one entry per inventory route, every field traceable:

```typescript
{
  path: "/teams/:teamName",
  origin: "ported",
  source: "FE/src/App.tsx:61",
  target: "app/(site)/teams/[teamName]/page.tsx",
  rendering: "ssr",
  auth: "public",
  services: ["teams.getByName", "players.listByTeam"],
  metadata: "generateMetadata",
  status: "todo"
}
```

`origin` is `"ported"` (has a line in `App.tsx`) or `"new"` (`not-found.tsx`, the reshaped `/login`). A `"new"` entry requires a one-line `rationale`. Without `origin`, T2 would flag every intentional addition as an orphan and the temptation would be to loosen T2 — which is exactly the check worth keeping strict.

`status` starts `todo` for all 38.

### 8.3 Four conformance tests

All in vitest, all failing until satisfied:

- **T1 — completeness.** Every entry in `route-inventory.json` has a manifest entry; failure lists the missing paths. A route cannot be forgotten because the list is generated, not remembered.
- **T2 — no orphans.** Every `page.tsx` under `app/app/` maps back to a manifest entry, and every `origin: "new"` entry carries a rationale.
- **T3 — reachability.** For each `done` entry, SSR-fetch a concrete URL with dynamic segments filled from fixture ids, asserting HTTP 200, non-empty `<main>`, a `<title>`, and OG tags. Auth-gated paths must redirect when unauthenticated and return 200 under a seeded session. Every dynamic route also gets a **negative case** asserting 404 for a known-absent id.
- **T4 — no TODO at the gate.** A phase completes only at zero `todo` and zero `TODO` fields. This is what turns "I think that's all of them" into a red build.

Mutations get the same treatment: `trpc-manifest.ts` generated from `endpoint-inventory.json`, with a bidirectional test asserting every write endpoint maps to a real procedure on `appRouter` and every procedure maps back to an endpoint or is explicitly marked new.

### 8.4 What this cannot check

**Visual correctness.** Everything else has a mechanical gate — schema has migrations, routes have T1–T4, mutations have the authorization sweep, services have unit tests. Visual intent has none. T3 proves a page returns 200 with content and metadata; it can never prove the page looks right.

13,261 lines of CSS encode spacing, breakpoints, and hover states that no extractor can read out. Restyling in Tailwind is genuine re-design work, not translation. Mitigations, all of which must happen **before `FE/` is deleted**:

- **Screenshot baselines per route**, captured from the live site while it still runs, at desktop and mobile widths, committed as reference images. Compared by eye at review. Not a pixel diff — layouts will legitimately differ — but it makes drift visible instead of remembered.
- **Design tokens first.** Extract palette, spacing scale, font stack, and breakpoints from the existing CSS into the Tailwind theme before restyling any component, so the rebuild has one source of truth rather than 47 files of ad-hoc values.
- **`FE/src/styles/` stays until phase 11**, so any component's original rules are one file away during the port.

---

## 9. Phases

Each phase is one or more commits. Nothing is pushed.

| # | Phase | Gate |
|---|---|---|
| 0 | ✅ Scaffold, pnpm, Workers target, shadcn on Radix | `pnpm run build` passes |
| 1 | Aliases, ESLint client-import rule, vitest + pool-workers, drizzle config, Tailwind theme tokens extracted from the old CSS | an empty suite runs inside `workerd` |
| 2 | `tooling/` extractors; generate all three inventories; author both manifests; capture screenshot baselines | T1 and T2 pass with everything `todo`; one baseline per route |
| 3 | Drizzle schema, baseline migration, fixtures | seed applies to a local D1; fixture test green |
| 4 | Service layer, domain by domain | per-domain suites green |
| 5 | better-auth + Roblox + admin bootstrap | auth suite green; bootstrap rehearsed on preview |
| 6 | tRPC routers | authorization sweep passes over every mutation |
| 7 | Public pages + Metadata API + `not-found.tsx` | T3 green for public routes including 404 negatives |
| 8 | Portal + session guards | T3 green for `/portal/*`, `/profile`, `/articles/create`; T4 passes |
| 9 | Queue consumer for record recalculation | full recalc completes inside limits |
| 10 | Deploy, bootstrap admin, DNS | — |
| 11 | Delete `BE/` and `FE/` | one commit, after sign-off |

### Phase 3 notes — schema

Type mapping from the old Postgres shapes:

| Old | New |
|---|---|
| `@PrimaryGeneratedColumn()` serial | `integer().primaryKey({autoIncrement:true})` |
| `@CreateDateColumn` / `@UpdateDateColumn` | `integer({mode:'timestamp_ms'})` |
| `@Column('date')` | `text` ISO `YYYY-MM-DD` |
| `@Column({type:'enum'})` | `text({enum:[...]})` + SQL `CHECK` |
| `decimal(10,2)` | `real` |
| `simple-array` | `text({mode:'json'})` |
| nullable `boolean` | `integer({mode:'boolean'})` nullable |

Relations: `teams↔players`, `teams↔games`, `awards↔players`, `articles↔users` (likes), plus `teams→seasons`, `games→seasons`, `matches→seasons`, `awards→seasons`, `records→seasons`, `records→players`, `stats→players`, `stats→games`, `articles→users` (author). One owning side per many-to-many, explicit names, composite primary keys, `ON DELETE CASCADE`.

Enums needing CHECK constraints: `Awards.type` (12 values), `Records.type` (`game`|`season`), `Matches.status` (`scheduled`|`completed`), `Matches.phase` (`qualifiers`|`playoffs`), `Matches.region` (`na`|`eu`|`as`|`sa`). `Records.record` does **not** get one — it becomes `(metric, min_attempts)`.

**Fixtures are load-bearing** because the database starts empty: dev needs something to render and T3 needs real ids for dynamic segments. `tests/fixtures/seed.ts` builds a minimal complete graph — 2 seasons, 4 teams, 8 players, 4 games, stats rows, 2 matches, 2 awards, records, 2 users (one `user`, one `admin`), 2 articles.

### Phase 6 notes — tRPC

- `@trpc/server` v11 fetch adapter at `api/trpc/[trpc]`.
- Context: `{ db, session }` — D1 binding plus the better-auth session from request headers.
- Procedures: `publicProcedure`, `protectedProcedure`, `adminProcedure`. **Authorization lives in middleware**, never in individual handlers.
- One router per domain, composed into `appRouter`.
- The existing `BE/src/modules/**/*.schema.ts` Zod schemas drop into `.input()`. The `validate()` middleware disappears; the schemas survive nearly untouched. Bump to Zod v4.
- Client: `@trpc/client` + `@trpc/react-query`, replacing the untyped `useCreate` / `usePatch` / `useDelete` hooks.
- A successful mutation calls `revalidatePath` / `revalidateTag` before returning.

tRPC over Server Actions specifically because authorization becomes structural — `adminProcedure` enforces once and a mutation cannot silently ship unguarded.

### Phase 9 notes — the queue

Replacing `calculateAllRecords()` (§4 defect 2):

- An `adminProcedure` mutation validates and enqueues a Cloudflare Queue message, returning a job id immediately.
- The consumer works **in SQL, not JavaScript**: one `ROW_NUMBER() OVER (PARTITION BY … ORDER BY … DESC)` query per record family, writes via `db.batch()`. With the `(metric, min_attempts)` split, the percentage families collapse into a single parameterized query.
- Job status in a `job_runs` table so the portal can show progress. The queue's native retry handles failure.

---

## 10. Testing

`vitest` + `@cloudflare/vitest-pool-workers`, running inside `workerd` against a real, per-test-isolated D1.

- **Service layer** is the main surface, tested against the seed.
- **tRPC authorization sweep** — walk `appRouter`, assert every mutation rejects an unauthenticated caller and every admin mutation rejects a plain user. Because authorization is middleware, this also catches a procedure declared on the wrong base, which is the one way a mutation ends up unguarded.
- **Route conformance** — T1–T4 from §8.3.
- **Auth** — Roblox callback creates a user, rename keeps identity stable, role enforcement on every admin path, admin bootstrap works.
- **Ported** — the Jest suites under `BE/src/modules/**/__tests__/` for their assertions only. `@swc/jest`, `supertest`, and `BE/src/__mocks__` are dropped; mocking a database is pointless when a real one is available per test.

---

## 11. Pitfalls already hit

Do not rediscover these.

1. **`create-vinext-app` invokes `pnpm` regardless of `--use-npm`.** It writes `packageManager: "npm@x"` into `package.json`, then shells out to `pnpm add`, which refuses with `This project is configured to use npm`. All files are written correctly; only the install step fails.
2. **A wrong `packageManager` field blocks pnpm entirely** — every `pnpm` command in the directory errors until it is corrected.
3. **pnpm blocks build scripts by default.** `esbuild` and `workerd` both ship native binaries fetched by install scripts, and **workerd is the Workers runtime** used by `wrangler dev` and `vitest-pool-workers` — neither is optional. Handled in `pnpm-workspace.yaml` via `allowBuilds`.
4. **shadcn v4 defaults to Base UI, not Radix.** A plain `init` installs `@base-ui/react`. Radix requires `--base radix` (the flag takes `base | radix | aria`). Correct result: `radix-ui` in dependencies and `"style": "radix-nova"` in `components.json`.
5. **The shadcn CLI installs itself into `dependencies`.** It is tooling; it belongs in `devDependencies`.
6. **`vinext check`** exists and should be run before assuming a Next.js feature works.

---

## 12. Commands

```
cd app
pnpm install
pnpm run dev
pnpm run build
pnpm run start
pnpm run deploy

pnpm dlx shadcn@latest add <component>
npx wrangler d1 execute <db> --remote --command "<sql>"
```

Bindings for `wrangler.jsonc`: `d1_databases`, `queues` (producer + consumer), `assets`, custom domain route. **No KV, no cache binding.**

Secrets via `wrangler secret put`, never in the repo: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `ROBLOX_CLIENT_ID`, `ROBLOX_CLIENT_SECRET`, `CHALLONGE_API_KEY`.

Gone: `JWT_SECRET`, `API_SECRET_KEY`, `REDIS_URL`, `DATABASE_URL`, the `DB_*` family.

Go-live: deploy → bootstrap the first admin (§7) → enter data → DNS. Fly and Netlify are decommissioned after, not run alongside.
