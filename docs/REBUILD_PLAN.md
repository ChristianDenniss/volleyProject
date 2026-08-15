# Rebuild Plan — BE + FE → single Cloudflare Worker

Status: **scaffold committed, phase 1 next**
Branch: `migrate/cloudflare-vinext`. **Commits only, never push.**

**Framing:** this is a **full rebuild, not a migration.** No cutover, no REST parity, no data carried across, no rollback path to the old stack. `BE/` and `FE/` stay in the tree as reference until the end, then get deleted.

**Consequence, stated once:** the existing league data — seasons, teams, players, games, stats, awards, records, articles — does not come across. The Postgres instance survives as a backup and the new schema will exist, so an import can be written later if that changes. Until then, portal CRUD and the stats CSV upload are the only ways data enters the system, which makes them day-one critical rather than admin conveniences.

---

## 1. What exists today (reference only)

**`BE/`** — Express 4 on Node (ESM, `ts-node`), ~15k LOC / 120 files.

| Concern | Current |
|---|---|
| HTTP | Express 4, hand-rolled `register*Routes(app)` per module |
| ORM | TypeORM 0.3, 10 entities, 17 migrations |
| DB | Postgres on Fly.io |
| Auth | `jsonwebtoken` HS256 + `bcryptjs`; roles `user` / `admin` / `superadmin` |
| Machine auth | `apiKeyAuth.ts` + `API_SECRET_KEY` |
| Cache | `ioredis`, TTL 600 on `players` and `stats` reads |
| Validation | Zod 3 via a `validate()` middleware |
| Tests | Jest 29 + `@swc/jest` + supertest |
| Deploy | Fly.io `volley-project-backend`, region `yyz` |
| Dead weight | `@nestjs/*` installed but unused; both `redis` and `ioredis` installed; `src/modules/strategy/` is an empty directory |

**`FE/`** — Vite 6 + React 19 SPA, ~18k LOC / 76 files. `react-router-dom` v6 with all 38 routes declared in `src/App.tsx`. Data via generic hooks (`useFetch<T>(endpoint)` → `${VITE_BACKEND_URL}/api/${endpoint}`). SCSS. JWT in `context/authContext`, injected by `hooks/authFetch.ts`. Netlify, with a `meta-tags.js` function that sniffs `User-Agent` for ~9 crawler bots to serve OG tags.

---

## 2. Target

| Concern | Target |
|---|---|
| Framework | **vinext** — Next.js App Router on Vite, Cloudflare Workers target |
| Runtime | **One Worker** serving SSR HTML, tRPC, and static assets |
| ORM | **Drizzle** (`drizzle-orm` + `drizzle-kit`) |
| DB | **Cloudflare D1**, starting empty |
| Auth | **better-auth**, **Roblox OAuth only** — no passwords |
| Writes | **tRPC v11**, mutations only |
| Background | **Cloudflare Queues** for record recalculation |
| Cache | None. No Redis, no KV, no cache service |
| Tests | **vitest** + `@cloudflare/vitest-pool-workers` |
| Package manager | **pnpm** |

### vinext status

Maintained by Cloudflare (`github.com/cloudflare/vinext`). Reimplements the Next.js API surface on Vite rather than wrapping `next build`.

Supported and relevant to us: App Router, RSC, Server Actions, route handlers, middleware, ISR, `next/link` / `next/image` / `next/navigation` / `next/headers` / `next/cache`, the Metadata API, Workers deployment with bindings.

Known gaps, none of which we hit: `"use cache"` / Cache Components / PPR incomplete; build-time image and font optimization partial; native modules (`sharp`, `satori`, `@napi-rs/canvas`) can fail in dev; `runtime` and `preferredRegion` route config ignored.

Upstream's own caveat: *"not yet a drop-in replacement for every application or production workload."* Mitigated by §3's framework-free service layer.

### Scaffold, done

```
pnpm dlx create-vinext-app@latest app \
  --platform cloudflare --data-cache none --cdn-cache workers-cache \
  --image-optimization none --disable-git --yes
```

`--data-cache none` matches the no-cache decision; `--image-optimization none` matches images living on an external host. `pnpm run build` passes across all five environments.

Two scaffolder notes: it invokes `pnpm` regardless of `--use-npm`, and it ships **Tailwind** (`@tailwindcss/postcss`, `app/globals.css`). The existing frontend is SCSS. Recommend stripping Tailwind so components port 1:1 — open item in §12.

---

## 3. Layout and aliases

vinext auto-detects the `app/` directory, and the scaffold put routes at `app/app/`. Keeping that rather than forcing `src/`:

```
volleyProject/
  BE/  FE/               # reference, deleted at the end
  docs/REBUILD_PLAN.md
  app/
    app/                 # App Router
      (site)/
      portal/
      api/auth/[...all]/route.ts
      api/trpc/[trpc]/route.ts
    server/
      db/{schema.ts,index.ts}
      services/
      trpc/{init.ts,routers/}
      auth.ts
      queue.ts
    components/
    styles/
    tooling/             # inventory extractors, §7
    tests/
    drizzle/
    wrangler.jsonc  vite.config.ts  vitest.config.ts  drizzle.config.ts
```

Aliases, declared in `tsconfig.json` `paths` and mirrored in `vite.config.ts` and `vitest.config.ts`:

| Alias | Resolves to |
|---|---|
| `@db` | `server/db` |
| `@server` | `server` |
| `@components` | `components` |
| `@styles` | `styles` |

The scaffold's default `@/*` → `./*` stays for anything not covered.

**Rule:** client components may never import `@db` or `@server`. Enforced by an ESLint `no-restricted-imports` rule scoped to `"use client"` files, so a stray import fails lint rather than leaking the D1 binding into a browser bundle.

**Portability rule:** everything in `@server/services` is a plain function taking `(db, args)` — no `next/*`, no request objects, no `cookies()`. RSC pages and tRPC procedures both call these. If vinext hits a wall, the service layer, schema, routers, auth, and tests survive a swap; only `app/app/` is lost.

---

## 4. Schema

Designed clean for SQLite. No prod schema to match, so the TypeORM entities are a *reference for intent*, not a spec — and their known defects are not reproduced.

### 4.1 Types

| Old | New |
|---|---|
| `@PrimaryGeneratedColumn()` serial | `integer().primaryKey({autoIncrement:true})` |
| `@CreateDateColumn` / `@UpdateDateColumn` | `integer({mode:'timestamp_ms'})` |
| `@Column('date')` | `text` ISO `YYYY-MM-DD` |
| `@Column({type:'enum'})` | `text({enum:[...]})` + SQL `CHECK` |
| `decimal(10,2)` | `real` |
| `simple-array` | `text({mode:'json'})` |
| nullable `boolean` | `integer({mode:'boolean'})` nullable |

### 4.2 Records reshaped

`Records.record` was a 41-value enum, ~30 of which were a generated `best total spiking % with N+ attempts` series. **Split into `(metric, min_attempts)`** — two columns, no 41-arm CHECK, and §9's recalculation collapses from 41 hardcoded branches to one parameterized query family.

### 4.3 Join tables done right

The old entities declared `@JoinTable` on **both** sides of `Teams ↔ Players`, which TypeORM does not allow and which likely produced two unrelated join tables in the old database. Since nothing is imported, this defect simply does not exist in the new schema: one owning side per relation, explicit names, composite primary keys, and `ON DELETE CASCADE`.

Relations to define: `teams↔players`, `teams↔games`, `awards↔players`, `articles↔users` (likes), plus `teams→seasons`, `games→seasons`, `matches→seasons`, `awards→seasons`, `records→seasons`, `records→players`, `stats→players`, `stats→games`, `articles→users` (author).

### 4.4 Migrations

`drizzle-kit generate` from `schema.ts`. One baseline, applied to an empty D1. The 17 TypeORM migrations are not ported.

### 4.5 Fixtures

Because the database starts empty, seeded fixtures are load-bearing — dev needs something to render and §7's route tests need real ids to hit dynamic segments. `tests/fixtures/seed.ts` creates a minimal but complete graph: 2 seasons, 4 teams, 8 players, 4 games, stats rows, 2 matches, 2 awards, records, 2 users (one `user`, one `admin`), 2 articles.

---

## 5. Auth — Roblox only

No email/password. No password hashing, no reset flow, no verification email, no mail provider. better-auth configured with a single social provider:

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

Client: `authClient.signIn.social({ provider: "roblox" })`. Callback `{origin}/api/auth/callback/roblox` — register both production and `http://localhost:3000/...` on the Roblox OAuth app.

**Roblox returns no email address.** better-auth fills `user.email` with `preferred_username`. Consequences:

- The `email` column holds a username. Nothing may validate it as an email or attempt to send mail to it.
- **Key everything on `user.id`, never on email or username.** A user who renames on Roblox keeps the same provider account id, so identity survives — but only if nothing joined on the username.
- Account linking is moot with a single provider, which removes the takeover surface entirely.

**Roles:** better-auth `admin` plugin carries `user` / `admin` / `superadmin`.

**Admin bootstrap — a real step, not an assumption.** A fresh database has no admin, and with Roblox-only sign-in there is no seeded credential to create one. Sequence: deploy → sign in once via Roblox → read the generated id → promote by hand:

```
wrangler d1 execute <db> --remote --command \
  "UPDATE user SET role='superadmin' WHERE id='<id>'"
```

Documented in the runbook and rehearsed on preview before production. Everything else in the portal depends on this working.

Deleted with the old stack: `jsonwebtoken`, `bcryptjs`, `authentication.ts`, `combinedAuth.ts`, `apiKeyAuth.ts`, `API_SECRET_KEY`, `JWT_SECRET`, `authFetch.ts`, `useLogin.ts`, `useSignUp.ts`, and `SignUp.tsx`.

---

## 6. tRPC

Mutations only. Reads never leave the server — a page calls its service function directly during SSR, so there is no client data fetching and no query cache to keep in sync.

- **Adapter:** `@trpc/server` v11 fetch adapter at `api/trpc/[trpc]`.
- **Context:** `{ db, session }` — the D1 binding plus the better-auth session from request headers.
- **Procedures:** `publicProcedure`, `protectedProcedure`, `adminProcedure`. Authorization lives in middleware.
- **Routers:** one per domain, composed into `appRouter`.
- **Inputs:** the existing `BE/src/modules/**/*.schema.ts` Zod schemas drop into `.input()`. The `validate()` middleware disappears; the schemas survive.
- **Client:** `@trpc/client` + `@trpc/react-query` in portal components, replacing the untyped `useCreate` / `usePatch` / `useDelete` hooks.
- **Revalidation:** a successful mutation calls `revalidatePath` / `revalidateTag` before returning.

tRPC over Server Actions specifically because authorization becomes structural: `adminProcedure` enforces once, and a mutation cannot silently ship unguarded.

The new app has exactly **two** hand-written route handlers: better-auth's catch-all and tRPC's.

### What this deletes

~60 GET endpoints become in-process service calls. ~40 write endpoints become tRPC mutations. The `/skinny` and `/medium` families (`teams/skinny`, `teams/medium`, `seasons/skinny`, `seasons/medium`, `players/medium`, `games/skinny`, `awards/skinny`) existed only to trim SPA payloads and have no reason to exist under RSC. The `PUT` duplicate of every `PATCH` route goes too — both already pointed at the same controller method.

**Cost:** no HTTP surface remains for an external integration. If one is wanted later it returns as a deliberate versioned API, not as a side effect of the internal implementation.

---

## 7. Route completeness — no omissions, no assumptions

38 routes and ~104 endpoints is past the size where hand-porting is trustworthy. Two failure modes to design against: **omission** (a route silently never gets built) and **invention** (behavior assumed rather than read from the source). The mechanism below makes both build failures.

### 7.1 Inventories are extracted, never hand-written

Three scripts under `app/tooling/`, each parsing the old source with the TypeScript compiler API and emitting JSON. Nothing on this list comes from anyone's reading of the code:

| Script | Reads | Emits |
|---|---|---|
| `extract-routes.ts` | `FE/src/App.tsx` JSX `<Route>` elements | `route-inventory.json` — `{path, component, componentFile, sourceLine, parentPath, roles}` |
| `extract-endpoints.ts` | `BE/src/modules/**/*.routes.ts` | `endpoint-inventory.json` — `{method, path, controllerMethod, middleware[], sourceFile, sourceLine}` |
| `extract-data-deps.ts` | each component named in the route inventory | `route-data-deps.json` — which data hooks it calls, resolved against the endpoint inventory |

`middleware[]` captures `authenticateCombined`, `validate(schema)`, `cacheMiddleware` — so **auth requirements are extracted from the old source, not assumed**.

`extract-data-deps.ts` is the anti-assumption core. Whether `/faq`, `/credits`, `/about`, or `/applications` are static or data-driven gets answered by walking their call expressions, not by guessing from the name.

### 7.2 The manifest

`app/route-manifest.ts`, one entry per inventory route, every field traceable:

```
{
  path: "/teams/:teamName",
  source: "FE/src/App.tsx:61",
  target: "app/(site)/teams/[teamName]/page.tsx",
  rendering: "ssr",
  auth: "public",
  services: ["teams.getByName", "players.listByTeam"],
  metadata: "generateMetadata",
  status: "todo"
}
```

`status` starts `todo` for all 38. `TODO` is a legal value only mid-phase.

### 7.3 Four conformance tests

All in vitest, all failing until satisfied:

- **T1 — completeness.** Every entry in `route-inventory.json` has a manifest entry. Failure lists the missing paths. A route cannot be forgotten, because the list is generated from `App.tsx` rather than remembered.
- **T2 — no orphans.** Every `page.tsx` under `app/app/` maps back to a manifest entry. Catches invented routes.
- **T3 — reachability.** For each `done` entry, SSR-fetch a concrete URL (dynamic segments filled from §4.5 fixture ids) and assert: HTTP 200, non-empty `<main>`, a `<title>`, and OG tags present. Auth-gated paths must redirect when unauthenticated and return 200 under a seeded admin session.
- **T4 — no TODO at the gate.** A phase completes only when zero entries are `todo` and no manifest field is `TODO`. This is what turns "I think that's all of them" into a failing build.

The same pattern covers writes: `trpc-manifest.ts` generated from `endpoint-inventory.json`, with a bidirectional test asserting every write endpoint maps to a real procedure on `appRouter` and every procedure maps back to an endpoint or is explicitly marked new.

### 7.4 The 38 routes

Public (24): `/`, `/about`, `/players`, `/players/:id`, `/teams`, `/teams/:teamName`, `/games`, `/games/:id`, `/seasons`, `/seasons/:id`, `/articles`, `/articles/:id`, `/articles/create`, `/awards`, `/awards/:id`, `/contact`, `/privacy-policy`, `/credits`, `/stats`, `/schedules`, `/applications`, `/faq`, `/records`, `/trivia`

Auth (3): `/profile`, `/login`, `/signup`

Portal (11), gated `roles={["admin","superadmin"]}` at `App.tsx:90`: `/portal` (index → Dashboard), `/portal/users`, `/portal/players`, `/portal/teams`, `/portal/seasons`, `/portal/games`, `/portal/stats`, `/portal/awards`, `/portal/articles`, `/portal/matches`

### 7.5 Findings recorded as decisions, not silently carried

Facts read from the source, each needing an explicit call rather than a default:

- **There is no 404 route.** `App.tsx` declares no catch-all; Netlify's SPA fallback serves `index.html`, so an unknown URL today renders the shell with an empty `main-content`. The new app needs `not-found.tsx`. This is new behavior, flagged as such.
- **`/teams/:teamName` keys on name** while `/games/:id`, `/seasons/:id`, `/players/:id`, `/articles/:id` and `/awards/:id` key on id. Preserved unless you say otherwise — recorded so it stays a decision.
- **`/articles/create` and `/profile` have no client-side guard.** Only `/portal` is wrapped in `PrivateRoute`. The server rejects unauthenticated article creation (`authenticateCombined` on `POST /api/articles`), so today an anonymous visitor can open the create page and only fail on submit. Worth fixing in the rebuild; calling it out rather than quietly changing it.
- **`/articles/create` is declared after `/articles/:id`.** react-router v6 ranks by specificity, and App Router prefers static over dynamic, so behavior is identical. Noted so nobody "fixes" a non-bug.
- **`/signup` disappears** under Roblox-only auth; `/login` becomes a single sign-in button. Both are manifest entries with a deliberate non-1:1 target.

---

## 8. Frontend port

1. **Shell** — `App.tsx`'s route table becomes the file tree; `Header`, `NavBar`, `Footer`, `main-content` become `app/layout.tsx`.
2. **Public pages, server-rendered**, data from `@server/services`.
3. **Interactive leaves stay client components** — `CalendarModal`, `SeasonSelectModal`, `FilterBar`, `Searchbar`, `Pagination`, `PlayerStatsVisualization` (chart.js), `TriviaPage`, `react-select`, `simplebar-react`.
4. **Auth surfaces** — `Login` becomes a Roblox button; `UserProfile` reads the server session; `PrivateRoute` becomes a session check in `portal/layout.tsx`.
5. **Portal last** — 9 admin pages on tRPC mutations.
6. **Deleted** — `SEO.tsx`, `@dr.pogodin/react-helmet`, `scripts/generate-meta-tags.js`, `netlify/`, the whole generic-hook layer, `axios`, `node-fetch`, `clear-cache.js`.

SEO comes from the Metadata API. The crawler-sniffing function is not ported.

---

## 9. Record recalculation

`RecordsService.calculateAllRecords()` today loads **every** `Stats` row with `player`, `game`, `game.season` joined into memory, then runs six loop groups over the record-type lists, each doing a `DELETE` followed by **one `save()` per row** for the top 10. A full table scan in JavaScript plus several hundred sequential round trips inside one HTTP request. Slow on Fly; over CPU and round-trip limits on a Worker.

Replacement:

- An `adminProcedure` mutation validates and enqueues a **Cloudflare Queue** message, returning a job id immediately.
- The consumer works in SQL: one `ROW_NUMBER() OVER (PARTITION BY … ORDER BY … DESC)` query per record family, writes via `db.batch()`. With §4.2's `(metric, min_attempts)` split, the percentage families collapse to a single parameterized query.
- Job status in a `job_runs` table so the portal can show progress; the queue's native retry handles failure.

Triggered by hand from the portal. No cron.

---

## 10. No cache

**No Redis. No KV. No cache service. No cache binding.**

The TTL-600 layer on `players` and `stats` existed to hide a Fly→Postgres round-trip that no longer exists once server components query the D1 binding in-process. Where freshness control is genuinely wanted, `next/cache` revalidation covers it, invalidated by the tRPC mutation that wrote the data. If a third-party call ever needs a TTL — the Roblox avatar lookup is the only candidate — `caches.default` handles it inline. Not building it up front.

---

## 11. Testing

`vitest` + `@cloudflare/vitest-pool-workers`, running inside `workerd` against a real, per-test-isolated D1.

- **Service layer** is the main surface, against the §4.5 seed.
- **tRPC authorization sweep** — walk `appRouter`, assert every mutation rejects an unauthenticated caller and every admin mutation rejects a plain user. Because authorization is middleware, this also catches a procedure declared on the wrong base, which is the one way a mutation ends up unguarded.
- **Route conformance** — the four tests in §7.3.
- **Auth** — Roblox callback creates a user, rename keeps identity stable, role enforcement on every admin path, admin bootstrap works.
- **Ported** — the Jest suites under `BE/src/modules/**/__tests__/` for their assertions. `@swc/jest`, `supertest`, and `BE/src/__mocks__` are dropped; mocking a database is pointless when a real one is available per test.

---

## 12. Decisions

| Question | Answer |
|---|---|
| Existing data | **Nothing comes across.** Fresh empty D1. |
| Auth | **Roblox OAuth only.** No passwords, no email, no reset flow. |
| `Records.record` | **Split into `(metric, min_attempts)`.** |
| Cache | **Removed entirely.** No Redis, no KV. |
| Writes | **tRPC mutations.** Reads stay server-side. |
| `API_SECRET_KEY` machine auth | **Deleted.** |
| Images | External host. No R2. |
| `records/calculate` | Manual trigger → queue. |
| In-flight JWTs | None to honor. |
| `strategy` module | Empty directory. Dropped. |
| Package manager | **pnpm.** |

Open:

- **Tailwind** — the scaffold ships it; the frontend is SCSS. Strip it, or keep both?
- **`not-found.tsx`** — confirm adding a real 404 (§7.5).
- **`/profile` and `/articles/create` guards** — add the client-side gate that is missing today?
- **Domain** for the Worker.

Needed from you: Cloudflare account id + API token (or `wrangler login`), a registered **Roblox OAuth app** (client id + secret), and `CHALLONGE_API_KEY` if the Challonge import survives.

---

## 13. Deployment

Single Worker. `wrangler.jsonc` bindings: `d1_databases`, `queues` (producer + consumer), `assets`, custom domain route. No KV, no cache binding.

Secrets via `wrangler secret put`, none in the repo: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `ROBLOX_CLIENT_ID`, `ROBLOX_CLIENT_SECRET`, `CHALLONGE_API_KEY`.

Gone: `JWT_SECRET`, `API_SECRET_KEY`, `REDIS_URL`, `DATABASE_URL`, the `DB_*` family.

Go-live: deploy → bootstrap the first admin (§5) → enter data → DNS. Fly and Netlify are decommissioned after, not run alongside.

---

## 14. Sequencing

| # | Phase | Gate |
|---|---|---|
| 0 | ✅ Scaffold `app/`, pnpm, Workers target | `pnpm run build` passes |
| 1 | Aliases, ESLint import rule, vitest + pool-workers, drizzle config, Tailwind decision | empty test suite runs in `workerd` |
| 2 | `tooling/` extractors; generate all three inventories; author both manifests | T1 and T2 pass with everything `todo` |
| 3 | Drizzle schema + baseline migration + fixtures | seed applies to a local D1; fixture test green |
| 4 | Service layer, domain by domain | per-domain suites green |
| 5 | better-auth + Roblox + admin bootstrap | auth suite green; bootstrap rehearsed on preview |
| 6 | tRPC routers | authorization sweep passes over every mutation |
| 7 | Public pages + Metadata API | T3 green for public routes |
| 8 | Portal | T3 green for `/portal/*`; T4 passes — zero `todo` |
| 9 | Queue consumer for record recalculation | full recalc completes inside limits |
| 10 | Deploy, bootstrap admin, DNS | — |
| 11 | Delete `BE/` and `FE/` | one commit, after sign-off |
