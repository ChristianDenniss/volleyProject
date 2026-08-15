# Migration Plan — BE + FE → single Cloudflare Worker

Status: **draft, not started**
Drafted 2026-08-15, revised after decisions round 2.
Branch: `migrate/cloudflare-vinext`. **Commits only, never push** — the user pushes manually.

**Framing decision (round 2):** this is a **full recreation, not a cutover.** The new app is built to be correct on its own terms. Nothing is preserved for compatibility's sake — no REST parity, no dual-auth path, no rollback-to-Fly plan. Data comes across in one batch; the old stack is switched off, not run alongside.

---

## 1. Where we are today

**`BE/`** — Express 4 on Node (ESM, `ts-node` loader), ~15k LOC across 120 files.

| Concern | Current |
|---|---|
| HTTP | Express 4, hand-rolled `register*Routes(app)` per module |
| ORM | TypeORM 0.3, 10 entities, 17 migrations |
| DB | Postgres (Fly.io / `DATABASE_URL`) |
| Auth | `jsonwebtoken` HS256 + `bcryptjs`; roles `user` / `admin` / `superadmin` |
| Second auth | `apiKeyAuth.ts` guarded by `API_SECRET_KEY` — **being deleted, see §6.5** |
| Cache | `ioredis` → `REDIS_URL`, via `cacheMiddleware` / `invalidateCacheMiddleware` |
| Validation | Zod 3, via `validate()` middleware |
| Tests | Jest 29 + `@swc/jest` + supertest |
| Deploy | Fly.io app `volley-project-backend`, region `yyz`, 1GB shared VM |
| Dead weight | `@nestjs/common` + `@nestjs/core` installed but unused; `redis` **and** `ioredis` both installed |

Modules: `articles`, `awards`, `games`, `matches`, `players`, `records`, `roblox`, `seasons`, `stats`, `teams`, `trivia`, `user` (plus `strategy/`, an empty directory — see §12).

**`FE/`** — Vite 6 + React 19 SPA, ~18k LOC across 76 files.

| Concern | Current |
|---|---|
| Routing | `react-router-dom` v6, all routes declared in `src/App.tsx` |
| Data | Generic hooks (`useFetch<T>(endpoint)` → `${VITE_BACKEND_URL}/api/${endpoint}`), client-side only |
| Styling | SCSS (`sass`) |
| Auth state | `src/context/authContext` holding a JWT, injected by `hooks/authFetch.ts` |
| Admin | `/portal/*` behind `PrivateRoute` |
| SEO | Netlify function `meta-tags.js` — sniffs `User-Agent` for ~9 crawler bots, serves a separate OG-tag document for `/articles/*`, `/players/*`, `/teams/*`, `/games/*`, `/seasons/*`, `/awards/*` |
| Deploy | Netlify, SPA fallback, long-cache headers on `/assets/*` |

---

## 2. Where we are going

| Concern | Target |
|---|---|
| Framework | **vinext** — Next.js App Router on Vite, Cloudflare Workers as primary target |
| Runtime | **One Cloudflare Worker** serving SSR HTML, Server Actions, and static assets |
| ORM | **Drizzle** (`drizzle-orm` + `drizzle-kit`) |
| DB | **Cloudflare D1** (SQLite) |
| Auth | **better-auth** — email/password + native Roblox provider, `admin` plugin for roles |
| Writes | **tRPC v11** — mutations only. Reads never leave the server (§8) |
| Background work | **Cloudflare Queues** for record recalculation (§9) |
| Cache | Next route-segment revalidation. **No Redis, no KV, no cache layer** (§10) |
| Tests | **vitest** + `@cloudflare/vitest-pool-workers` (real `workerd`, real D1 per test) |
| Validation | Zod (bump to v4) — existing schemas port nearly as-is |

### vinext status check

`vinext` is **maintained by Cloudflare** (`github.com/cloudflare/vinext`), not a hobby project. It reimplements the Next.js API surface on Vite rather than wrapping `next build`.

Confirmed supported: App Router, **React Server Components, Server Actions**, route handlers, middleware, ISR, `next/link` / `next/image` / `next/navigation` / `next/headers` / `next/cache`, the **Metadata API**, and Workers deployment with bindings.

Known gaps, none of which we hit: `"use cache"` / Cache Components / PPR are incomplete; build-time image and font optimization is partial; native modules (`sharp`, `satori`, `@napi-rs/canvas`) can fail in dev; `runtime` and `preferredRegion` route config are ignored.

Tooling to use: `vinext check` before writing anything, `pnpm create vinext-app@latest` to scaffold, and optionally the official Agent Skill (`npx skills add cloudflare/vinext`).

Upstream's own caveat, kept here honestly: *"not yet a drop-in replacement for every application or production workload."* Mitigated by §3's framework-free service layer.

### The three structural wins

1. **SSR deletes the crawler hack.** Server-rendered pages emit real OG tags via the Metadata API. `netlify/functions/meta-tags.js`, its six `User-Agent` redirect rules, `SEO.tsx`, `@dr.pogodin/react-helmet`, and `scripts/generate-meta-tags.js` are all deleted, not ported.
2. **One origin deletes CORS, the API hop, and most of the API.** See §8 — this is the big one.
3. **One type source.** `FE/src/types/interfaces.ts` and `BE/src/types` stop drifting; Drizzle infers both.

---

## 3. Repo layout and path aliases

```
volleyProject/
  BE/                     # reference only, deleted in the final commit
  FE/                     # reference only, deleted in the final commit
  docs/MIGRATION_PLAN.md
  app/                    # ← the new application
    src/
      app/                # vinext App Router
        (site)/           # public pages
        portal/           # admin, session-gated
        api/auth/[...all]/route.ts   # better-auth handler
        api/trpc/[trpc]/route.ts     # tRPC handler
      server/
        db/
          schema.ts       # Drizzle tables
          index.ts        # D1 client factory
        services/         # service layer — pure, framework-free
        trpc/
          init.ts         # context, public/protected/admin procedures
          routers/        # one router per domain
        auth.ts           # better-auth instance
        queue.ts          # records recalculation consumer
      components/         # ported from FE/src/components
      styles/             # ported SCSS
    migrations/           # drizzle-kit output
    scripts/
      pg-export.ts
      d1-import.ts
    tests/
    wrangler.jsonc
    drizzle.config.ts
    vitest.config.ts
```

### Path aliases

Declared once in `app/tsconfig.json` under `compilerOptions.paths`, mirrored in `vite.config.ts` `resolve.alias` (vinext auto-configures Vite, but explicit aliases keep `vitest` and `drizzle-kit` resolving the same way), and mirrored again in `vitest.config.ts`.

| Alias | Resolves to |
|---|---|
| `@db` | `src/server/db` — schema + client |
| `@server` | `src/server` — services, actions, auth, queue |
| `@components` | `src/components` |
| `@styles` | `src/styles` |
| `@types` | shared inferred types |

Rule: **client components may never import `@db` or `@server`.** Enforced with an ESLint `no-restricted-imports` rule scoped to files carrying `"use client"`, so a stray import fails lint instead of leaking the D1 binding into a browser bundle.

### The portability rule

Everything under `@server/services` is a plain function taking `(db, args)`. No framework imports — no `next/*`, no request objects, no `cookies()`. RSC pages and tRPC procedures both call these. If vinext hits a wall, the service layer, schema, tRPC routers, auth config, and tests survive a swap to React Router v7 or OpenNext unchanged; only `src/app/` is lost.

---

## 4. Schema conversion: Postgres → SQLite

### 4.1 Type mapping

| TypeORM / Postgres | D1 / Drizzle | Note |
|---|---|---|
| `@PrimaryGeneratedColumn()` (serial) | `integer('id').primaryKey({autoIncrement:true})` | preserve existing integer values on import |
| `@CreateDateColumn / @UpdateDateColumn` (`timestamp`) | `integer({mode:'timestamp_ms'})` | SQLite has no date type; unix ms |
| `@Column('date')` (`Records.date`) | `text` ISO `YYYY-MM-DD` | date-only; sorts and compares correctly as text |
| `@Column({type:'enum'})` | `text({enum:[...]})` + SQL `CHECK` | Drizzle's enum is types-only; the CHECK does the enforcing |
| `@Column('decimal',{precision:10,scale:2})` (`Records.value`) | `real` | ⚠ float. Counts and percentages at 2dp are safe, but every comparison rounds |
| `@Column({type:'simple-array'})` (`Matches.tags`) | `text({mode:'json'})` | TypeORM stores comma-joined text; import splits and re-encodes as JSON |
| `boolean` nullable (`Article.approved`) | `integer({mode:'boolean'})` nullable | tri-state null/0/1 preserved |

### 4.2 Enum columns needing CHECK constraints

- `Awards.type` — 12 values (`MVP`, `Best Spiker`, … `LuvLate Award`)
- `Records.record` — **41 values**, mostly the `best total spiking % with N+ attempts` family
- `Records.type` — `game` | `season`
- `Matches.status` — `scheduled` | `completed`
- `Matches.phase` — `qualifiers` | `playoffs`
- `Matches.region` — `na` | `eu` | `as` | `sa`

`Records.record`'s 41 values are 90% a generated `N+ attempts` series. Since this is a full recreation and nothing external depends on the strings, this is the moment to **split it into `(metric, min_attempts)`** — two columns instead of one 41-arm CHECK, and §9's recalculation becomes one parameterized query family instead of 41 hardcoded branches. Recommended. Falls back to a plain CHECK if you'd rather not touch the shape.

### 4.3 ⚠ Join tables must be read from the live DB, not from the entities

The entity files disagree with themselves about many-to-many ownership:

- `Teams.players` declares `@JoinTable({name:'teams_players'})` **and** `Players.teams` also declares `@JoinTable()`. TypeORM allows exactly one owning side. Two `@JoinTable`s means the real database very likely has **two** unrelated join tables (`teams_players` plus a default-named one), with code possibly writing one and reading the other.
- Same check needed on `Teams.games` (`teams_games`), `Awards.players` (`awards_players_players`), `Article.likedBy` (`article_likes`).

**Action, before any schema is written:** dump the real schema from prod (`information_schema` / `\d+`) and build Drizzle tables from *that*, then diff against the entities and record discrepancies here. Do not trust the decorators. If a duplicate join table exists with rows in both, decide the merge rule before importing.

### 4.4 Migration history

The 17 TypeORM migrations are **not** ported. Drizzle gets one clean baseline migration describing the schema as it should be, and data is imported onto it. TypeORM's `migrations` table does not come across.

---

## 5. Data migration — one batch, no cutover

Two scripts, run locally, idempotent, re-runnable:

1. **`scripts/pg-export.ts`** — connects with `DATABASE_URL`, dumps every table to newline-delimited JSON in dependency order (`seasons → teams → players → games → matches → stats → awards → records → users → articles →` join tables). Records row counts and per-table checksums.
2. **`scripts/d1-import.ts`** — transforms (timestamps → ms, `simple-array` → JSON, decimal → real, user ids → text per §6.3, passwords per §6.2), emits batched SQL, loads via `wrangler d1 execute --file`. Chunked to stay under D1 statement limits and resumable per table.

**Verification gate** — not "done" until, for every table: row counts match, `min(id)`/`max(id)` match, a 100-row random sample diffs clean, and the aggregate stat totals behind the leaderboard (`sum(spikeKills)`, `sum(assists)`, …) match Postgres exactly.

**Sizing:** confirmed well under D1's 10 GB cap. Not a risk.

Because there is no cutover, this runs once against a final Postgres snapshot taken after the old app stops accepting writes. No incremental re-sync machinery is needed.

---

## 6. Auth

### 6.1 Shape

better-auth owns `user`, `session`, `account`, `verification`. Plugins:

- **`admin`** — carries the existing `user` / `admin` / `superadmin` roles.
- **`username`** — the existing `User.username` stays the login/display handle; unique, required.
- Native **`roblox`** social provider (§6.4).

### 6.2 Passwords — batch, single scheme

Per the round-2 decision, the lazy per-login migration is **removed**. One batch, one scheme, no dual code path.

**The hard constraint:** bcrypt hashes cannot be converted to scrypt. Hashing is one-way — without plaintext there is no batch job that turns a `$2b$` hash into a scrypt hash. So "do it all in a batch, correctly" resolves to exactly one of:

**(a) Recommended — bcrypt becomes the app's single password scheme.**
Configure better-auth's `emailAndPassword.password.hash` **and** `.verify` to `bcryptjs`. Existing hashes import into `account.password` untouched and are immediately valid under the new scheme. New signups hash with bcrypt too. There is no legacy branch, no rehash hook, no prefix sniffing, and no user is ever in a "migrated / not yet migrated" state — which is what the batch approach is for. Cost: `bcryptjs` is pure JS on Workers, roughly 100ms CPU per login at cost factor 10. Comfortably inside Worker CPU limits at this login volume.

**(b) Alternative — no passwords come across.**
Users import with no credential account; everyone signs in via Roblox or a password-reset link on first visit. Cleanest possible schema, but every existing user hits friction on day one, and it needs working transactional email (which the current stack does not have — `verification` is unused and there is no mail provider configured).

**Proceeding with (a)** unless told otherwise. It satisfies "created fully, in one batch" with zero user friction and one hashing code path.

### 6.3 ⚠ User ID type change

better-auth uses **text** ids; the current schema uses **integers**, and `Article.author` plus `article_likes.userId` are integer FKs pointing at them.

Plan: `user.id` is `text`, seeded with the string form of the existing integer (`42` → `"42"`). Article FKs convert to `text` in the same batch. Joins stay intact, old ids stay readable in logs, and new users get better-auth's normal generated ids. `advanced.database.generateId` stays default.

### 6.4 Roblox — native provider

better-auth ships a **first-class `roblox` social provider**. No `genericOAuth` needed:

```typescript
import { betterAuth } from "better-auth"

export const auth = betterAuth({
    socialProviders: {
        roblox: {
            clientId: process.env.ROBLOX_CLIENT_ID as string,
            clientSecret: process.env.ROBLOX_CLIENT_SECRET as string,
        },
    },
})
```

Client side:

```typescript
const data = await authClient.signIn.social({ provider: "roblox" })
```

Callback URL: `{origin}/api/auth/callback/roblox` — register both the production origin and `http://localhost:3000/...` on the Roblox OAuth app.

**⚠ Roblox returns no email address.** better-auth fills the `user.email` field with `preferred_username` instead. Consequences to design around:

- The `email` column stops being reliably an email. Anything that assumes otherwise — validation, display, future mail sending — must tolerate a bare username.
- **Never auto-link accounts by email.** You already chose explicit linking (§12.5), which is exactly right: with usernames sitting in the email column, email-based auto-linking is an account-takeover primitive. Linking Roblox to an existing account requires an authenticated session initiating the link.
- If transactional email is ever added, Roblox-origin users need a real address collected first.

The existing `roblox` module is **only an avatar proxy** — `GET /api/roblox/avatar/:username`, two upstream calls (username → id, id → thumbnail). It contains no OAuth code. Check the `oauthv2` and `rbx-oauth2` branches for prior art before writing anything.

### 6.5 API key auth is deleted

`apiKeyAuth.ts` and `API_SECRET_KEY` do not come across. No better-auth `apiKey` plugin. Machine access, if it's ever needed again, gets designed fresh.

---

## 7. Frontend port

76 files, ~18k LOC. Order:

1. **Shell** — `App.tsx`'s route table becomes the App Router file tree. `Header`, `NavBar`, `Footer`, `main-content` → `app/layout.tsx`.
2. **Public pages, server-rendered** — `Home`, `Teams`, `Players`, `Games`, `Seasons`, `Articles`, `Awards`, `Records`, `Stats`, `Schedules`, plus the `Single/*` detail pages. Data comes from `@server/services`, not axios.
3. **Interactive leaves stay client components** — `CalendarModal`, `SeasonSelectModal`, `FilterBar`, `Searchbar`, `Pagination`, `PlayerStatsVisualization` (chart.js), `TriviaPage`, `react-select`, `simplebar-react`.
4. **Auth surfaces** — `Login`, `SignUp`, `UserProfile`, `authContext` → better-auth React client + server session. `PrivateRoute` becomes a session check in `portal/layout.tsx`.
5. **Portal last** — 9 admin pages, client-side CRUD on Server Actions.
6. **Deleted outright** — `SEO.tsx`, `@dr.pogodin/react-helmet`, `scripts/generate-meta-tags.js`, `netlify/`, `hooks/authFetch.ts`, `hooks/useFetch.ts` + `allFetch.ts` and the whole generic-hook layer, `axios`, `node-fetch`, `clear-cache.js`.

Static assets in `FE/public` and `FE/src/images` move to the Worker's assets binding. Images referenced by `imageUrl` / `logoUrl` / `videoUrl` live on an external host and are left alone — no R2 migration.

---

## 8. Do the ~104 REST endpoints need migrating? Mostly no.

**Short answer: the REST API is not ported. It is deleted and replaced by direct server calls.**

The evidence that makes this safe:

- The frontend reaches the API exclusively through generic hooks — `useFetch<T>("players")` building `${VITE_BACKEND_URL}/api/${endpoint}`. There is no hand-written client per endpoint, so there is no client to keep compatible.
- `API_SECRET_KEY` machine auth is being deleted (§6.5), so no scripted consumer is being supported.
- Whether anything external ever called `/api/*` is unknown and, given the no-cutover full recreation, moot — the old origin goes away regardless.

So the migration unit is **the 13 service modules, not 104 routes**:

| Old shape | New shape |
|---|---|
| `GET` read endpoints (~60) | service functions called directly inside RSC pages. No HTTP, no serialization round-trip, no client fetch state |
| `POST` / `PUT` / `PATCH` / `DELETE` (~40) | **tRPC mutations**, called from portal client components |
| `POST /api/users/login`, `/register`, `GET /profile` | better-auth |
| `PATCH /api/admin/users/:id/role` | `adminProcedure` mutation |
| `GET /api/roblox/avatar/:username` | server function called from RSC |
| `POST /api/stats/batch-csv` | tRPC mutation taking parsed rows; the file is parsed client-side |
| `POST /api/records/calculate` | `adminProcedure` mutation that enqueues a Queue message (§9) |
| everything else | gone |

**The new app has exactly two hand-written route handlers:** `api/auth/[...all]/route.ts` (better-auth) and `api/trpc/[trpc]/route.ts` (tRPC).

### The tRPC layer

Mutations only. Reads are not exposed over tRPC — a page that needs data calls its service function directly during SSR, so there is no client-side data fetching to speak of and no query layer to keep in sync.

- **Adapter:** `@trpc/server` v11 fetch adapter, mounted at `api/trpc/[trpc]`.
- **Context:** `{ db, session }` — the D1 binding plus the better-auth session resolved from request headers.
- **Procedures:** `publicProcedure`, `protectedProcedure` (session required), `adminProcedure` (role checked via the better-auth `admin` plugin). Authorization lives in **middleware**, not in each handler.
- **Routers:** one per domain — `articles`, `awards`, `games`, `matches`, `players`, `records`, `seasons`, `stats`, `teams`, `trivia`, `user` — composed into `appRouter`.
- **Inputs:** the existing `BE/src/modules/**/*.schema.ts` Zod schemas drop straight into `.input()`. The `validate()` middleware disappears; the schemas themselves survive nearly untouched.
- **Client:** `@trpc/client` + `@trpc/react-query` in portal components. End-to-end types with no codegen, replacing the untyped `useCreate` / `usePatch` / `useDelete` hooks.
- **Revalidation:** a successful mutation calls `revalidatePath` / `revalidateTag` server-side before returning, so the SSR pages reflect the write immediately.

Choosing tRPC over Server Actions is what makes authorization tractable here. With actions, every mutation is individually responsible for its own auth check and a missed one is silent; with tRPC, `adminProcedure` enforces it once and a mutation cannot opt out by accident.

### Endpoints that die on their own

The `/skinny` and `/medium` families exist purely to trim JSON payloads for the SPA — `teams/skinny`, `teams/medium`, `seasons/skinny`, `seasons/medium`, `players/medium`, `games/skinny`, `awards/skinny`. RSC serializes exactly what a page renders, so these have no reason to exist. **Deleted, along with their service methods and controller branches.**

Also going: the `PUT` duplicates of every `PATCH` route (both currently point at the same controller method), and any read endpoint with no caller once the pages are ported.

### One thing this costs

There is no HTTP surface left to point a REST client or an integration at. If that's ever wanted, it comes back deliberately as a versioned public API rather than as an accident of the internal implementation. Flagging it as a real trade-off, not a footnote.

---

## 9. `POST /api/records/calculate` — what it actually does

You asked what this is. Concretely, `RecordsService.calculateAllRecords()`:

1. Loads **every row of `Stats`** with `player`, `game`, and `game.season` relations joined — the entire stats table into memory.
2. Runs six loop groups over the record-type lists (13 single-game counting stats, then aggregated variants, then season variants, then the `best total spiking % with N+ attempts` families).
3. For each record type: a `DELETE` of all existing rows for that type, then a loop issuing **one `save()` per row** for the top 10.

So it's a full table scan in JavaScript plus several hundred sequential round trips, all inside one HTTP request. On Fly this was merely slow. On a Worker it would exceed CPU limits and D1 round-trip budgets — this is the one endpoint that cannot be ported as-is, which is why it stood out.

**Replacement, and we agree on the queue:**

- An **`adminProcedure` mutation** validates the request and enqueues a message on a **Cloudflare Queue**. Returns immediately with a job id.
- The **queue consumer** does the work in SQL, not JavaScript: one `ROW_NUMBER() OVER (PARTITION BY … ORDER BY … DESC)` query per record family computes the top 10 directly in D1. Writes go through `db.batch()` — one round trip per family instead of ten.
- If §4.2's `(metric, min_attempts)` split lands, the ~41 percentage record types collapse into a single parameterized query instead of 41 branches.
- Job status lands in a small `job_runs` table so the portal can show progress, and the queue's native retry handles failure.

Triggered by hand from the portal, as today. No cron.

---

## 10. Redis is gone

**No Redis. No KV. No cache service. No dedicated cache layer at all.**

Deleted: `BE/src/utils/cache.ts`, `BE/src/middleware/cache.ts`, `cacheMiddleware`, `invalidateCacheMiddleware`, the `REDIS_URL` secret, and both the `redis` and `ioredis` packages.

The existing cache wrapped `players` and `stats` reads at TTL 600 to hide a network round-trip from Fly to Postgres. That round-trip does not exist anymore — server components query the D1 binding from inside the same isolate. The cache was solving a problem the architecture removes.

Where freshness control is genuinely wanted, `next/cache` route-segment revalidation covers it, invalidated by the tRPC mutation that wrote the data (§8). That is a built-in, not a layer we maintain.

If a third-party call ever needs a TTL — the Roblox avatar lookup is the only candidate — `caches.default` handles it in three lines with no binding, no service, and no infrastructure. Not building it up front.

---

## 11. Testing

`vitest` + `@cloudflare/vitest-pool-workers` — tests run inside `workerd` against a real, per-test-isolated D1.

- **Port** the Jest suites under `BE/src/modules/**/__tests__/` (user controller + service confirmed; full inventory on the first pass). `@swc/jest` and `supertest` are dropped — vitest handles TS natively, and with no REST layer there is nothing for supertest to hit.
- **Service layer** is the main test surface, unit-tested against a seeded D1. This is where the old controller tests' assertions move.
- **tRPC procedures** get authorization tests first, behavior second: a test that walks `appRouter`'s procedure list and asserts every mutation rejects an unauthenticated caller, and every admin mutation rejects a plain user. Because authorization is middleware, this test also catches a procedure declared on the wrong base — which is the one way a mutation can end up unguarded.
- **Auth**: bcrypt login works against imported hashes, role enforcement on every admin path, Roblox link requires an authenticated session and cannot link by email.
- **Data migration**: export→import against a fixture, asserting the §5 verification gate.
- **`BE/src/__mocks__`** is discarded — mocking a database is pointless when a real one is available per test.

---

## 12. Decisions (round 2 answers, recorded)

| # | Question | Answer |
|---|---|---|
| 1 | DB size vs D1's 10 GB cap | Well under. Not a risk. |
| 2 | Does `API_SECRET_KEY` machine auth survive? | **No.** Deleted (§6.5). |
| 3 | Is `/api/*` consumed externally? | Unknown, and moot — full recreation, old origin goes away (§8). |
| 4 | Where do `imageUrl` / `logoUrl` / `videoUrl` point? | External host. No R2 migration. |
| 5 | Roblox account linking | **Explicit link required** from an authenticated session. Never auto-link by email (§6.4). |
| 6 | `strategy` module — dead? | **Dead.** `src/modules/strategy/` is an empty directory; the only matches elsewhere are TypeORM naming-strategy references inside migrations. Dropped. |
| 7 | Who triggers `records/calculate`? | By hand, from the portal. Becomes an admin action → queue (§9). |
| 8 | In-flight JWTs to honor? | **No.** No cutover, no dual-verify path. |

Remaining open items:

- §6.2 — proceeding with **bcrypt as the single password scheme** unless you'd rather force resets. Say so if (b).
- §4.2 — split `Records.record` into `(metric, min_attempts)`? Recommended, but it changes query shape.
- §4.3 — the join-table question, answerable only against the live schema.

---

## 13. Deployment

Single Worker. `wrangler.jsonc` bindings: `d1_databases`, `queues` (producer + consumer), `assets`, custom domain route. **No KV, no Redis, no cache binding of any kind.**

**Secrets, all via `wrangler secret put`, none in the repo:**

| Secret | For |
|---|---|
| `BETTER_AUTH_SECRET` | session signing — generate fresh, do **not** reuse `JWT_SECRET` |
| `BETTER_AUTH_URL` | public origin |
| `ROBLOX_CLIENT_ID` / `ROBLOX_CLIENT_SECRET` | Roblox OAuth app — **must be registered**, doesn't exist yet |
| `CHALLONGE_API_KEY` | existing, carried over |

Dropped: `JWT_SECRET`, `API_SECRET_KEY`, `REDIS_URL`, `DATABASE_URL` and the `DB_*` family (kept only in the local migration script's environment, never as a Worker secret).

Also needed from you: **Cloudflare account id + API token** (or interactive `wrangler login`), the **prod `DATABASE_URL`** or a `pg_dump` for the one-shot import, the **Roblox OAuth app** registration, and the **target domain**.

**Go-live:** old app stops accepting writes → final Postgres snapshot → batch import → verification gate (§5) → DNS. Fly and Netlify are decommissioned after, not run in parallel. There is deliberately no rollback path to the old stack, which is the trade-off that comes with recreating rather than cutting over — so the verification gate is the gate, and it is not optional.

---

## 14. Sequencing

Each phase is one or more commits on `migrate/cloudflare-vinext`. Nothing is pushed.

| # | Phase | Gate |
|---|---|---|
| 0 | Scaffold `app/` via `create-vinext-app`, run `vinext check`, wire wrangler + vitest + drizzle + path aliases, deploy a hello-world to preview | preview URL responds |
| 1 | Dump real prod schema; write Drizzle schema; resolve the §4.3 join-table question; decide §4.2 | schema diffed against prod, discrepancies documented here |
| 2 | Export/import scripts; full batch load into a preview D1 | §5 verification gate passes |
| 3 | Service layer ported module by module, with tests | per-module suites green |
| 4 | better-auth: schema, bcrypt hasher, roles, Roblox, explicit linking | §11 auth suite green |
| 5 | Public pages SSR + Metadata API | OG tags correct with no `User-Agent` sniffing anywhere |
| 6 | tRPC routers + portal | admin CRUD works; the authorization sweep covers every mutation |
| 7 | Queue consumer for record recalculation | full recalc completes inside limits, results match the old output |
| 8 | Cache passes, CSV upload limits, load check | — |
| 9 | Go-live: freeze, snapshot, import, verify, DNS | verification gate green |
| 10 | Delete `BE/` and `FE/` | one commit, after sign-off |

Phases 1–2 hold the only real unknowns: the true prod schema shape and the join-table question. Everything after is mechanical.
