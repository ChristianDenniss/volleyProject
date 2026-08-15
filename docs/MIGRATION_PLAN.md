# Migration Plan — BE + FE → single Cloudflare Worker

Status: **draft, not started**
Author: drafted 2026-08-15
Branch: work happens on a new branch off `fix_overlooks`; **commits only, never push** (user pushes manually).

---

## 1. Where we are today

**`BE/`** — Express 4 on Node (ESM, `ts-node` loader), ~15k LOC across 120 files.

| Concern | Current |
|---|---|
| HTTP | Express 4, hand-rolled `register*Routes(app)` per module |
| ORM | TypeORM 0.3, 10 entities, 17 migrations |
| DB | Postgres (Fly.io / `DATABASE_URL`) |
| Auth | `jsonwebtoken` HS256 + `bcryptjs`; roles `user` / `admin` / `superadmin` |
| Second auth | `apiKeyAuth.ts` guarded by `API_SECRET_KEY` |
| Cache | `ioredis` → `REDIS_URL`, wrapped in `cacheMiddleware` / `invalidateCacheMiddleware` |
| Validation | Zod 3, via `validate()` middleware |
| Tests | Jest 29 + `@swc/jest` + supertest |
| Deploy | Fly.io app `volley-project-backend`, region `yyz`, Dockerfile, 1GB shared VM |
| Dead weight | `@nestjs/common` + `@nestjs/core` installed but unused; `redis` **and** `ioredis` both installed |

Modules: `articles`, `awards`, `games`, `matches`, `players`, `records`, `roblox`, `seasons`, `stats`, `strategy`, `teams`, `trivia`, `user`.

**`FE/`** — Vite 6 + React 19 SPA, ~18k LOC across 76 files.

| Concern | Current |
|---|---|
| Routing | `react-router-dom` v6, all routes declared in `src/App.tsx` |
| Data | `axios` from components/hooks, client-side only |
| Styling | SCSS (`sass`) |
| Auth state | `src/context/authContext` holding a JWT |
| Admin | `/portal/*` behind `PrivateRoute` |
| SEO | **Netlify function `meta-tags.js`** — sniffs `User-Agent` for ~9 crawler bots and serves a separate OG-tag document for `/articles/*`, `/players/*`, `/teams/*`, `/games/*`, `/seasons/*`, `/awards/*` |
| Deploy | Netlify, SPA fallback redirect, long-cache headers on `/assets/*` |

---

## 2. Where we are going

| Concern | Target |
|---|---|
| Framework | **vinext** — Next.js App Router semantics on Vite, compiles for Workers |
| Runtime | **One Cloudflare Worker** serving SSR HTML, API routes, and static assets |
| ORM | **Drizzle** (`drizzle-orm` + `drizzle-kit`) |
| DB | **Cloudflare D1** (SQLite) |
| Auth | **better-auth** — email/password + Roblox OAuth, `admin` plugin for roles |
| Cache | Workers **Cache API** + **KV**, version-key invalidation (no Redis) |
| Tests | **vitest** + `@cloudflare/vitest-pool-workers` (real `workerd`, real D1 per test) |
| Validation | Zod (bump to v4) — keep the existing schemas, they port nearly as-is |

### Version reality check

- `vinext@1.0.0-beta.6` — real, by `southpolesteve`, keywords `nextjs / vite / cloudflare / workers`. **It is beta.** The whole app rides on it, so §11 has a fallback.
- `better-auth@1.6.29` — stable, has Drizzle adapter and D1 support.
- `drizzle-orm` — stable, first-class D1 driver.

### The two structural wins

1. **SSR deletes the crawler hack.** Server-rendered pages emit real OG tags for everyone, so `netlify/functions/meta-tags.js` and its six `User-Agent` redirect rules are dropped entirely — not ported.
2. **One origin deletes CORS and the API hop.** RSC pages query D1 directly in the same isolate. No `cors` middleware, no `axios` round-trip for first paint, and one shared `types/` instead of two drifting copies.

---

## 3. Repo layout

```
volleyProject/
  BE/                     # stays, reference only, deleted in the final commit
  FE/                     # stays, reference only, deleted in the final commit
  docs/MIGRATION_PLAN.md  # this file
  app/                    # ← the new application
    src/
      app/                # vinext App Router — pages + route handlers
        (site)/           # public pages
        portal/           # admin, auth-gated
        api/              # REST parity endpoints (see §8)
      server/
        db/
          schema.ts       # Drizzle tables
          index.ts        # D1 client factory
        services/         # ported BE service layer — pure, framework-free
        auth.ts           # better-auth instance
        cache.ts          # Cache API + KV helpers
      components/         # ported from FE/src/components
      styles/             # ported SCSS
    migrations/           # drizzle-kit output
    scripts/
      pg-export.ts        # Postgres → JSON dump
      d1-import.ts        # JSON → D1 seed
    tests/
    wrangler.jsonc
    drizzle.config.ts
    vitest.config.ts
```

**Rule that protects us from the beta dependency:** everything in `src/server/services/` is a plain function taking `(db, args)`. No framework imports — no `next/*`, no request objects. RSC pages and `api/` handlers both call the same functions. If vinext has to be swapped out, the service layer, schema, auth, and tests all survive unchanged.

---

## 4. Schema conversion: Postgres → SQLite

### 4.1 Type mapping

| TypeORM / Postgres | D1 / Drizzle | Note |
|---|---|---|
| `@PrimaryGeneratedColumn()` (serial) | `integer('id').primaryKey({autoIncrement:true})` | preserve existing integer values on import |
| `@CreateDateColumn / @UpdateDateColumn` (`timestamp`) | `integer({mode:'timestamp_ms'})` | SQLite has no date type; store unix ms |
| `@Column('date')` (`Records.date`) | `text` ISO `YYYY-MM-DD` | date-only, keeps sorting and equality |
| `@Column({type:'enum'})` | `text({enum:[...]})` + SQL `CHECK` | Drizzle's `enum` is types-only; the CHECK is what actually enforces it |
| `@Column('decimal',{precision:10,scale:2})` (`Records.value`) | `real` | ⚠ float. Values are counts and percentages — 2dp is safe, but every comparison must round |
| `@Column({type:'simple-array'})` (`Matches.tags`) | `text({mode:'json'})` | TypeORM stores comma-joined text; the import script splits and re-encodes as JSON |
| `boolean` nullable (`Article.approved`) | `integer({mode:'boolean'})` nullable | tri-state null/0/1 preserved |

### 4.2 Enum columns needing CHECK constraints

- `Awards.type` — 12 values (`MVP`, `Best Spiker`, … `LuvLate Award`)
- `Records.record` — **41 values**, mostly the `best total spiking % with N+ attempts` family
- `Records.type` — `game` | `season`
- `Matches.status` — `scheduled` | `completed`
- `Matches.phase` — `qualifiers` | `playoffs`
- `Matches.region` — `na` | `eu` | `as` | `sa`

`Records.record` is a strong candidate for a lookup table instead of a 41-arm CHECK, but that changes query shape. **Decision: keep it as a CHECK for parity**, revisit later.

### 4.3 ⚠ Join tables must be read from the live DB, not from the entities

The entity files disagree with themselves about many-to-many ownership:

- `Teams.players` declares `@JoinTable({name:'teams_players'})` **and** `Players.teams` also declares `@JoinTable()`. TypeORM allows exactly one owning side. Two `@JoinTable`s means the real database very likely has **two** unrelated join tables (`teams_players` plus a default-named `players_teams_teams`), and application code may be writing to one while reading the other.
- Same pattern to verify on `Teams.games` (`teams_games`), `Awards.players` (`awards_players_players`), `Article.likedBy` (`article_likes`).

**Action, before any schema is written:** dump the real schema (`\d+` / `information_schema`) from prod and build Drizzle tables from *that*. Then diff against the entities and record any orphan/duplicate join table here. Do not trust the decorators.

### 4.4 Migration history

The 17 TypeORM migrations are **not** ported. The Drizzle schema is generated as a single baseline migration matching production's current shape, and data is imported on top. TypeORM's `migrations` table is not carried over.

---

## 5. Data migration (all tables)

Two scripts, run locally, idempotent, re-runnable:

1. **`scripts/pg-export.ts`** — connects with `DATABASE_URL`, dumps every table to newline-delimited JSON in dependency order (`seasons → teams → players → games → matches → stats → awards → records → users → articles →` join tables). Records row counts and per-table checksums.
2. **`scripts/d1-import.ts`** — transforms (timestamps → ms, `simple-array` → JSON, decimals → real, user ids → text per §6.3), emits batched SQL, loads via `wrangler d1 execute --file`. Batched in chunks to stay under D1 statement limits, wrapped per-table so a failure is resumable.

**Verification gate** — migration is not "done" until, for every table: row count matches, `min(id)`/`max(id)` match, a sampled row-level diff of 100 random rows per table passes, and the aggregate stat totals used on the leaderboard (`sum(spikeKills)`, `sum(assists)`, …) match Postgres exactly.

**Sizing risk:** D1 is capped at 10 GB per database. Need current DB size — see §12.

---

## 6. Auth

### 6.1 Shape

better-auth owns `user`, `session`, `account`, `verification`. Plugins:

- **`admin`** — carries the existing `user` / `admin` / `superadmin` roles. `superadmin` maps to a custom role, not a second concept.
- **`username`** — the existing `User.username` column is used for display and login; keep it unique and required.
- **`genericOAuth`** — Roblox provider (§6.4).

`API_SECRET_KEY` machine auth (`apiKeyAuth.ts`) becomes better-auth's `apiKey` plugin, or stays a hand-rolled header check — depends on who actually calls it (§12).

### 6.2 Lazy bcrypt migration

The old hashes are `bcryptjs`, better-auth defaults to scrypt. Plan, per the agreed lazy approach:

1. Import writes each legacy user an `account` row with `providerId: 'credential'` and `password` set to the **untouched bcrypt hash**. The old hash is preserved in a field, exactly as intended, without inventing a parallel column.
2. Custom `emailAndPassword.password.verify({hash, password})`: if `hash` starts with `$2a$` / `$2b$` / `$2y$`, verify with `bcryptjs.compare`; otherwise fall through to the scrypt default.
3. On a successful *legacy* verify, an after-hook on sign-in rehashes the plaintext with the default hasher and overwrites `account.password`. Second login onward is pure scrypt.
4. No forced resets, no lockouts. The bcrypt branch can be deleted once the legacy-prefix count hits zero (add a one-line admin query to check).

`bcryptjs` is pure JS and runs on Workers. It is slow by design; at the expected login volume this is fine, but the cost is per-login until users migrate — which is precisely why the rehash matters.

> An explicit `user.legacyPasswordHash` column is the alternative. It is more obvious to read but adds a column that must later be dropped, and splits the password across two tables during the transition. Recommending the `account.password` approach above; say the word if you'd rather have the explicit column.

### 6.3 ⚠ User ID type change

better-auth uses **text** ids; the current schema uses **integer** ids, and `Article.author` / `article_likes.userId` are integer FKs pointing at them.

Plan: `user.id` is `text`, seeded with the *string form of the existing integer* (`42` → `"42"`). Article FKs convert to `text` in the same pass. Joins stay intact, old ids stay recognizable in logs and URLs, and new users get better-auth's normal generated ids. `advanced.database.generateId` is left at default.

### 6.4 Roblox OAuth

Roblox speaks OIDC. Via `genericOAuth`:

- authorize `https://apis.roblox.com/oauth/v1/authorize`
- token `https://apis.roblox.com/oauth/v1/token`
- userinfo `https://apis.roblox.com/oauth/v1/userinfo`
- scopes `openid profile`, PKCE required

Needs a registered OAuth app on Roblox (client id + secret → §11). Note the existing `roblox` module is **only an avatar proxy** (`GET /api/roblox/avatar/:username`, two upstream calls) — there is no OAuth code to port, this is net-new. The `oauthv2` and `rbx-oauth2` branches should be checked for prior art before writing it.

Account linking: a Roblox sign-in matching an existing user's Roblox username should link, not duplicate. Since the avatar proxy already resolves username → Roblox user id, the mapping is available; **confirm the linking rule before building** (auto-link on username match is convenient but is a real account-takeover surface if Roblox usernames were ever self-reported in this app's data).

---

## 7. Caching without Redis

Workers cannot use `ioredis` (TCP + Node internals). Replacement:

- **Cache API (`caches.default`)** for full GET responses, keyed by request URL. Per-colo, free, no binding needed.
- **KV** for anything that must be shared across colos.
- **Version-key invalidation** replaces `invalidateCacheMiddleware(prefix)`: keep `cache:v:players` in KV, embed it in every cache key, and bump the integer on write. One KV write invalidates a whole prefix instantly — which is what the current code wants and what KV cannot do natively (no prefix delete).

Currently cached: `players` (all read routes, TTL 600) and `stats` (all read routes, TTL 600), invalidated on `PUT`/`PATCH`/`DELETE`. Parity is straightforward.

With RSC, much of this collapses anyway — server components can hit D1 directly and lean on route-segment caching instead of a response cache.

---

## 8. Route parity

Every current endpoint is kept at its existing path under `app/src/app/api/**` so nothing external breaks, **and** each gets a service-layer function that RSC pages call directly (no self-fetch).

| Module | Endpoints | Notes |
|---|---|---|
| `articles` | 10 | includes `POST/DELETE /:id/like`, `GET /:id/like-status` |
| `awards` | 10 | `/skinny`, `/type/:type`, `/season/:seasonNumber`, `/player/:playerId` |
| `games` | 11 | `/skinny`, `/batch`, `/createByNames`, `/:id/score` |
| `matches` | 8 | includes `POST /import-challonge` (external Challonge API) |
| `players` | 13 | `/medium`, `/batch`, `/by-team-name`, `/merge`, `/teams/:playerName` — **all cached** |
| `records` | 10 | includes `POST /calculate` (heavy aggregate — see below) |
| `roblox` | 1 | avatar proxy |
| `seasons` | 8 | `/skinny`, `/medium` |
| `stats` | 11 | `/by-name`, `/batch-csv`, `/add-to-game` — **all read routes cached** |
| `teams` | 12 | `/skinny`, `/medium`, `/name/:name`, `/:teamId/players` |
| `trivia` | 4 | random player/team/season + `POST /guess` |
| `user` | 6 | **replaced by better-auth**, except `GET /api/users`, `/profile`, `/:id`, and `PATCH /api/admin/users/:id/role` |

~104 endpoints total.

**Two that need runtime attention:**

- `POST /api/records/calculate` — recomputes every record across all seasons. On Fly this was an unbounded request; a Worker has CPU limits. Move to a **Workflow** or a queue-backed job, or chunk it per-season with a cursor.
- `POST /api/stats/batch-csv` — CSV upload. Check payload size against Worker request limits; stream-parse rather than buffering.

The `/skinny` and `/medium` endpoint families exist purely to trim payload for the SPA. Under RSC most of their callers disappear. **Keep them anyway** for this migration — deleting them is a separate cleanup with its own diff.

---

## 9. Frontend port

76 files, ~18k LOC. Order:

1. **Shell** — `App.tsx`'s route table becomes the App Router file tree. `Header`, `NavBar`, `Footer`, `main-content` layout → `app/layout.tsx`.
2. **Public pages first, server-rendered** — `Home`, `Teams`, `Players`, `Games`, `Seasons`, `Articles`, `Awards`, `Records`, `Stats`, `Schedules`, and the `Single/*` detail pages. These are the SEO-critical ones and the reason the crawler hack existed. Data comes from service functions, not axios.
3. **Interactive leaves stay client components** — `CalendarModal`, `SeasonSelectModal`, `FilterBar`, `Searchbar`, `Pagination`, `PlayerStatsVisualization` (chart.js), `TriviaPage`, `react-select` usages, `simplebar-react`.
4. **Auth surfaces** — `Login`, `SignUp`, `UserProfile`, `authContext` → better-auth's React client + server session. `PrivateRoute` becomes a layout-level session check in `portal/layout.tsx`.
5. **Portal last** — 9 admin pages, all client-side CRUD, lowest SEO value, highest churn.
6. **`SEO.tsx` + `@dr.pogodin/react-helmet` are deleted**, replaced by App Router `metadata` / `generateMetadata`. So is `scripts/generate-meta-tags.js` and the Netlify function.

Static assets in `FE/public` and `FE/src/images` (team logos, recently added) move to the Worker's assets binding. If they're large, R2 is the better home — needs a size check.

---

## 10. Testing

`vitest` + `@cloudflare/vitest-pool-workers`, which runs tests inside `workerd` with a real, per-test-isolated D1.

- **Port** the existing Jest suites under `BE/src/modules/**/__tests__/` (user controller + service confirmed; full inventory on first pass). `@swc/jest` and `supertest` are dropped — vitest handles TS natively, and route handlers are tested by calling the Worker's `fetch` directly.
- **Service layer** gets unit tests against a seeded in-memory D1.
- **Auth** gets its own suite, and it is non-negotiable: legacy bcrypt login succeeds, rehash actually fires and persists, second login uses scrypt, Roblox link/create paths, role enforcement on every admin route.
- **Data migration** gets a test that runs export→import against a fixture and asserts the §5 verification gate.
- **`BE/src/__mocks__`** is reviewed and mostly discarded — mocking a DB is unnecessary when a real one is available per test.

---

## 11. Deployment

Single Worker, `wrangler.jsonc`:

- `d1_databases` → the volley database
- `kv_namespaces` → cache versions
- `assets` → built static output
- custom domain route

**Secrets needed (all via `wrangler secret put`, none in the repo):**

| Secret | For |
|---|---|
| `BETTER_AUTH_SECRET` | session signing — generate fresh, do not reuse `JWT_SECRET` |
| `BETTER_AUTH_URL` | public origin |
| `ROBLOX_CLIENT_ID` / `ROBLOX_CLIENT_SECRET` | Roblox OAuth app — **must be registered**, doesn't exist yet |
| `CHALLONGE_API_KEY` | existing, carry over |
| `API_SECRET_KEY` | existing, only if machine auth survives (§12) |

Also needed from you: **Cloudflare account id + API token** (or an interactive `wrangler login`), the **prod `DATABASE_URL`** or a `pg_dump`, and the **target domain**.

**Cutover:** Fly and Netlify keep running until the Worker passes parity on a preview domain. DNS flips last. Rollback is a DNS revert, which stays valid as long as no writes have landed in D1 — so the flip should be paired with a short write freeze and a final incremental data sync.

**vinext fallback:** if the beta blocks a release, the escape hatch is React Router v7 framework mode or OpenNext on Workers. Because the service layer, Drizzle schema, better-auth config, and tests carry no framework imports (§3), that swap costs the `app/` directory and nothing else.

---

## 12. Open questions

1. **DB size and row counts?** D1 caps at 10 GB. Also drives how long the import takes.
2. **Who calls `API_SECRET_KEY`?** If there are external scripts or integrations, machine auth must survive with the same header contract. If it's unused, it gets deleted.
3. **Are `/api/*` paths consumed by anything outside `FE/`?** Determines whether parity is a hard requirement or a courtesy.
4. **Where do `imageUrl` / `logoUrl` / `videoUrl` point?** External host, or files that should move to R2?
5. **Roblox account-linking rule** — auto-link on username match, or require explicit linking from a logged-in session? (§6.4 — security-relevant.)
6. **`strategy` module** — no entity and no routes file surfaced. Dead code, or something to carry?
7. **Is `POST /api/records/calculate` triggered by hand or on a schedule?** Decides Workflow vs. Cron Trigger vs. queue.
8. **Any in-flight JWTs that must keep working through cutover?** If yes, a temporary dual-verify path is needed; if no (recommended), everyone re-authenticates once.

---

## 13. Sequencing

Each phase is one or more commits on the migration branch. Nothing is pushed.

| # | Phase | Gate |
|---|---|---|
| 0 | Branch, `app/` scaffold, wrangler + vitest + drizzle config, hello-world Worker deploys to preview | preview URL responds |
| 1 | Dump real prod schema; write Drizzle schema; resolve the §4.3 join-table question | schema diffed against prod, discrepancies documented |
| 2 | Export/import scripts; full data load into a preview D1 | §5 verification gate passes |
| 3 | Service layer ported module by module, with tests | per-module test suites green |
| 4 | API routes wired to services, at parity paths | endpoint-by-endpoint response diff vs. Fly |
| 5 | better-auth: schema, lazy bcrypt, roles, Roblox | §10 auth suite green |
| 6 | Public pages SSR, then interactive leaves | OG tags verified without any User-Agent sniffing |
| 7 | Portal | admin CRUD parity |
| 8 | Cache layer, `records/calculate` job, CSV upload limits | load check |
| 9 | Cutover: freeze, final sync, DNS | rollback rehearsed first |
| 10 | Delete `BE/` and `FE/` | one commit, after parity is signed off |

Phases 1–2 are the ones that can genuinely surprise us: real prod schema shape and real data volume. Everything after is mechanical.
