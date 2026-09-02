# Upstream Catch-Up Plan

Companion to `REBUILD_PLAN.md`. That document describes rebuilding the site as one Cloudflare Worker against the codebase as it stood at `0ba3adc`. This document describes what upstream `main` did *since* `0ba3adc`, and how to fold it into the rebuild.

Same hard rules apply: never push, never write code comments, do not re-litigate settled decisions, do not invent answers to open questions.

---

## 0. The divergence

| | |
|---|---|
| Merge base | `0ba3adc` — "adding team logos" |
| Upstream head at time of writing | `2e06d2b6` |
| Commits upstream since the base | 382 |
| Files touched upstream | 391 (`FE/src` 193, `BE/src` 145, rest infra/docs) |
| Commits on `migrate/cloudflare-vinext` since the base | 23 |
| Files in common between the two diffs | **0** |

The two histories touch disjoint file sets. This branch deleted `BE/` and `FE/`; upstream did 382 commits of work inside them. `git merge origin/main` produces no conflicts and no benefit — it would resurrect the two deleted applications. **The port is semantic, not textual.**

### Reference worktree

Upstream `main` is checked out read-only for cross-reference:

```
git worktree add <scratch>/main-ref origin/main --detach
```

Recreate it whenever needed. When this catch-up is finished, the next catch-up is `2e06d2b6..origin/main`.

### The inventory extractors still work

`tooling/extract-routes.ts` and `tooling/extract-endpoints.ts` resolve `repoRoot` as `tooling/../..` and read `FE/src/App.tsx` and `BE/src/modules`. Neither path exists on this branch, so they are currently unrunnable here. They *do* run against the worktree: place a copy of `tooling/` at `<worktree>/<anydir>/tooling/`, symlink `node_modules` beside it, and run them. `repoRoot` then resolves to the worktree root, which has `BE/` and `FE/`.

Every route and endpoint number below came from that run, not from reading commits.

---

## 1. Measured surface delta

Routes **38 → 47**. Endpoints **108 → 119**.

### Routes added

| Path | Upstream component |
|---|---|
| `/teams/register` | `TeamRegister.tsx` |
| `/teams/registrations` | `TeamRegistrations.tsx` |
| `/teams/registrations/:id` | `TeamRegistrationDetail.tsx` |
| `/portal/registrations` | `portal/RegistrationsHubPage.tsx` |
| `/portal/applications` | `portal/ApplicationsPage.tsx` |
| `/vector-graph` | `VectorGraphPage.tsx` |
| `/errors` | `misc/ErrorPagesPreview.tsx` |
| `/errors/:kind` | `misc/ServiceErrorPage.tsx` |
| `/error` | `misc/ServiceErrorPage.tsx` |
| `/*` | `misc/NotFoundPage.tsx` |

### Routes removed

`/portal/matches` — the matches module was deleted upstream.

### Endpoints added

```
GET    /api/applications
PATCH  /api/applications/:slug
GET    /api/regions
GET    /api/stats/leaderboard
GET    /api/games/stages
POST   /api/games/import-challonge
GET    /api/team-registrations
POST   /api/team-registrations
GET    /api/team-registrations/summary
GET    /api/team-registrations/:id
PATCH  /api/team-registrations/:id
DELETE /api/team-registrations/:id
POST   /api/team-registrations/:id/accept
POST   /api/team-registrations/:id/deny
POST   /api/team-registrations/:id/resolve
POST   /api/team-registrations/:id/revoke
PATCH  /api/teams/:id/staff
PATCH  /api/teams/:id/flags
POST   /api/users/logout
PATCH  /api/users/profile/password
GET    /api/auth/avatar/:username
```

### Endpoints removed

All nine `/api/matches/*` routes, and `GET /api/roblox/avatar/:username` (moved to `/api/auth/avatar/:username`).

---

## 2. Schema delta

`server/db/schema.ts` currently mirrors `0ba3adc`. Upstream added twelve migrations. Net shape:

### `matches` is gone — folded into `games`

`games` gains, from upstream `game.entity.ts`:

- `status` — enum `scheduled | completed`, default `scheduled`
- `phase` — enum `qualifiers | playoffs | pre_season`, default `qualifiers`
- `bracket` — enum `winners | losers`, nullable (null for qualifiers, pre-season, grand finals)
- `regionId` — not null, FK `regions`
- `set1Score`…`set5Score` — nullable text
- `challongeMatchId`, `challongeTournamentId` — nullable text
- `challongeRound` — nullable int
- `tags` — nullable JSON string array
- `winnerTeamId` — nullable int, FK `teams` `ON DELETE SET NULL`

and changes:

- `team1Score` / `team2Score` become nullable (were `NOT NULL DEFAULT 0`)
- `name` becomes explicitly nullable text
- `stage` default changes `"Winners Bracket; Round of 16"` → `"Round 1"`
- indexes on `(regionId, seasonId, date)`, `(seasonId, regionId, stage)`, `seasonId`, `stage`, `status`, `phase`, `bracket`, `winnerTeamId`

The current `matches` table has `matchNumber`, `round`, `team1Name`, `team2Name`, `team1LogoUrl`, `team2LogoUrl` and a `region` **string** column. **None of those carry over.** Upstream dropped free-text team names in favour of the real `teams_games` join plus `winnerTeamId`, dropped `matchNumber`/`round` in favour of `stage` + `bracket`, and replaced the `region` string with the `regionId` FK.

### New table — `regions`

`id`, `code` unique (`na | eu | as`), `name`, `sortOrder` default 0, timestamps.

`regionId` (not null) is added to **`games`, `teams`, `seasons`, `awards`, `records`**.

### New table — `applications`

`id`, `slug` unique, `name`, `type`, `description` text, `url` nullable, `status` (`open | closed`, default `closed`), `category` (`staff | media | game-officials | management`), `sortOrder` default 0, timestamps.

### New table — `team_registrations`

`id`, `submittedByUserId` FK, `regionId` FK, `seasonId` FK, `teamName`, `hexColor`, `brickColor`, `captainDiscord`, `captainRoblox`, `viceDiscord`, `viceRoblox`, `roster` JSON (`{ discord, roblox }[]`), `agreeCivilScheduling` bool, `confidentWillParticipate` bool, `priorLeagueExperience` nullable text, `logoJerseyAck` bool, `status` (`pending | conflict | accepted | denied`, default `pending`), `createdTeamId` nullable FK `teams`, `conflictPayload` nullable JSON, `captainLinkPending` bool, timestamps. Indexes on `(regionId, seasonId)` and `status`.

Note `roster` and `conflictPayload` are `jsonb` upstream — on D1 they become `text({ mode: "json" })`.

### New table — `role_audit_log`

`id`, `actorId`, `targetId`, `oldRole`, `newRole`, `ip` nullable, `createdAt`. Indexes on `targetId` and `actorId`.

### Column additions to existing tables

| Table | Added |
|---|---|
| `teams` | `hexColor`, `brickColor` (nullable text), `captainEditEnabled` (bool, default true), `captainUserId`, `viceCaptainUserId`, `courtCaptainUserId` (nullable FK users), `regionId` |
| `seasons` | `registrationsOpen` (bool, default false), `captainEditEnabled` (bool, default true), `maxTeams` (nullable int), `regionId` |
| `players` | `robloxUsername`, `robloxUserId`, `discordUsername` (nullable text), `userId` (nullable FK users) |
| `awards` | `regionId` |
| `records` | `regionId`; `type` default corrected `"'game'"` → `"game"` |
| `users` | `email` and `password` become nullable; `+ tokenVersion`, `robloxUserId`, `robloxUsername` |

`users.tokenVersion` exists upstream for JWT revocation. **Do not port it** — better-auth owns sessions here. `users.robloxUserId` / `robloxUsername` are already covered by the better-auth `account` table; check before duplicating.

Two upstream migrations are pure performance indexes (`AddPerformanceIndexes`, `AddRemainingPerformanceIndexes`). Read them for which columns the real query load hits, then apply the equivalents to the D1 schema — do not transcribe Postgres-specific index types.

---

## 3. Triage — what ports and what does not

Upstream's 382 commits break down as follows.

### Drop entirely

- ~90 commits of `fix/*`, `chore/strip-*-logs`, `refactor/*-next-err`, `refactor/type-request-user` — Express/TypeORM internals for code that does not exist on this branch. `chore/strip-*-logs` is upstream catching up to a rule this branch already follows.
- All auth middleware: `authCookie`, `authValidation`, `csrfProtection`, `adminIpAllowlist`, `apiKeyAuth`, `tokenVersion`, `passwordPolicy`. better-auth plus tRPC's structural authorization replaces the lot. Read `csrfProtection.test.ts` for the threat model, then delete.
- `docker-compose.yml`, `BE/Dockerfile`, `FE/Dockerfile` and the Docker-hardening commits.
- `FE/src/styles/*.css` per-page files — upstream deleted all 40 itself.

### Port the intent, not the code

- `middleware/rateLimit.ts` + `feat/trivia-rate-limit` — trivia needs a rate limit. Implement on Workers primitives.
- `middleware/registrationGate.ts` — gate reads `seasons.registrationsOpen` / `maxTeams`. Port as a service-layer check.
- `utils/pagination.ts` + `pagination.test.ts` + the two `fix/paginate-*` commits — pagination contract for list endpoints. The test file ports nearly as-is.
- `utils/sanitizeForLogging.ts`, `utils/allowedOrigins.ts`, `utils/urlSchema.ts`, `utils/regionQuery.ts` — small, portable.
- `FE/src/errors/*` (`apiErrorMessage`, `classifyServiceError`, `extractFetchError`, `statusMessages`) — error taxonomy, portable; the fetch-specific half is dead under tRPC.

### Port near-verbatim

Pure functions with tests, no framework dependency:

- `modules/games/gameBracket.ts` + `__tests__/gameBracket.test.ts`
- `modules/games/gameWinner.ts` + `__tests__/gameWinner.test.ts`
- `modules/games/stageRounds.ts` — `STAGE_ROUNDS` buckets `R1`…`R6`, and `buildStageRoundSql`
- `modules/games/challongeStageMapper.ts`
- `modules/stats/stat.leaderboard.ts` + `__tests__/stat.leaderboard.test.ts`
- `modules/regions/__tests__/region.service.test.ts`
- `modules/team-registrations/__tests__/team-registration.service.test.ts`
- `modules/user/__tests__/changeUserRole.test.ts`
- `FE/src/constants/*` — `awardTypes`, `gameStages`, `playerPositions`, `teamPlacements`, `site`
- `FE/src/analytics/statsVectorization.ts`, `playerArchetypes.ts`

### Port as new features

Everything in §1's added routes and endpoints. Covered by the phased plan in §4.

### Design system

Upstream ran the same conversion this branch did, independently: `feat/tailwind-foundation` + `feat/design-system-tailwind` added `styles/tokens.css` and `styles/tailwind.css` and deleted every per-page CSS file. Commit `7b71686` on this branch ported the *old* per-page look.

`tokens.css` is the reconciled palette (`--color-brand-primary: #2D3C50`, accent `#a1d2ff`, neutral ramp, spacing, type). Map it onto the Tailwind theme and shadcn CSS variables in `app/globals.css`. Note `revert/design-system` upstream — check what it reverted before trusting `c2a6f76` wholesale.

### CI and repo meta

`.github/workflows` upstream targets `BE/` and `FE/` paths with npm and Jest. Rewrite for pnpm + vitest + wrangler rather than porting. `.releaserc.json` (semantic-release), `LICENSE`, `SECURITY.md`, `CITATION.cff`, `CODE_OF_CONDUCT.md`, and the issue templates port as-is. `docs/guides/local-setup.md` and `docs/architecture/*` need rewriting against the single-Worker reality.

Two junk paths exist in upstream's tree — files literally named `et --hard 0f7ea6e` and `et --hard d75ec10`, from mistyped `git reset` commands. Do not port them.

---

## 4. Phases

Steps 1–4 are strictly sequential; the schema blocks everything. 5–8 are independent of each other once 4 lands. 9–12 are independent once 8 lands.

### Phase U1 — move the goalposts

Regenerate all three inventories against the upstream worktree and commit them over the current ones. `route-data-deps.json` needs the same treatment as the other two.

This is the highest-leverage step: the conformance tests measure the rebuild against `inventory/`, so refreshing it converts every gap in §1 into a failing test. Do this first and let the suite drive the rest.

Expect the suite to go red across the board. That is the point.

### Phase U2 — schema

Rewrite `server/db/schema.ts` per §2 in one pass: new tables `regions`, `applications`, `teamRegistrations`, `roleAuditLog`; `matches` folded into `games`; new columns on `teams`, `seasons`, `players`, `awards`, `records`, `users`; indexes.

Then `pnpm db:generate`, and update `tooling/emit-seed-sql.ts` and `tests/fixtures/seed.sql` — `regions` must seed first, since five tables now carry a not-null `regionId`.

D1 is empty and there is no data to migrate (`REBUILD_PLAN.md` §1), so this can be a single new migration or a rewritten baseline. Prefer rewriting `0000_baseline.sql` while the branch is still unreleased.

### Phase U3 — delete matches

Delete `server/services/matches.ts`, `server/trpc/routers/matches.ts`, `app/portal/matches/`. Move anything the matches service did onto the games service. Update `route-manifest.ts` and `trpc-manifest.ts`.

### Phase U4 — regions

`regions` service and router, `GET /api/regions` equivalent, and a region context on the client (upstream: `FE/src/context/regionContext.tsx`, `hooks/useFormRegionSeason.ts`, `components/ui/RegionSeasonFields.tsx`).

Thread `regionId` through every read and write on games, teams, seasons, awards, records. This touches every existing service, which is why it precedes the new features rather than following them.

### Phase U5 — games expansion

Port the four pure modules from §3 plus `challongeImport.service.ts` and their tests. Add `games.stages` and `games.importChallonge` procedures. Wire `bracket` inference and `winnerTeamId` resolution into game create and update.

### Phase U6 — team registrations and team staff

The largest new feature. Ten endpoints, four state transitions (`accept`, `deny`, `resolve`, `revoke`), conflict detection writing `conflictPayload`, and team creation on accept writing `createdTeamId`.

Also here: `PATCH /api/teams/:id/staff` and `PATCH /api/teams/:id/flags`, the `captainUserId` / `viceCaptainUserId` / `courtCaptainUserId` assignments, and `role_audit_log` writes on every role change.

Client: `/teams/register`, `/teams/registrations`, `/teams/registrations/:id`, `/portal/registrations`. Upstream components `TeamRegister`, `TeamRegistrations`, `TeamRegistrationDetail`, `RegStatusBadge`, `TeamStaffEdit`, `RegistrationsHubPage`.

Gate submissions on `seasons.registrationsOpen` and `seasons.maxTeams`.

### Phase U7 — applications

`applications` service, router, and `/portal/applications`. Two endpoints, no dependencies. Small.

### Phase U8 — stats leaderboard

Port `stat.leaderboard.ts` and its test, add the `stats.leaderboard` procedure, rebuild `/stats` on it. `STAGE_ROUNDS` from U5 is a hard dependency — the leaderboard filters by stage-round bucket, and upstream keeps that table duplicated on the client. Define it once here and import it on both sides.

### Phase U9 — design system

Replace the phase-7 CSS port with `tokens.css` mapped into the Tailwind theme and shadcn variables. Deliberately after U5–U8 so the restyle happens once, against the full route set.

### Phase U10 — error surfaces

`errors/` taxonomy, `ErrorBoundary`, and routes `/errors`, `/errors/:kind`, `/error`. `/*` maps to the existing `app/not-found.tsx` rather than a new route.

### Phase U11 — remaining client work

`/vector-graph` with `statsVectorization` / `playerArchetypes` / `useVectorGraphData`; the `RallyGame` and `PixelNet` components; `usePaginatedFetch` pagination parity; debounced portal searches (upstream did seven separate `perf/debounce-*` commits — one shared hook here); `a11y/*` fixes, which mostly land free via shadcn's Radix primitives, but verify rather than assume.

### Phase U12 — CI and repo meta

Per §3. Also record the new catch-up base (`2e06d2b6`) here.

---

## 5. Open questions

Do not answer these by guessing.

1. **Does upstream `main` keep moving?** If the old stack is still being developed, this plan needs a repeat pass and the base recorded in §0 matters. If upstream is frozen pending this rebuild, U12 can drop the CI port entirely.
2. **`revert/design-system` (`9bd8f35c`)** — what did it revert, and did `feat/tailwind-foundation` (`421401b3`) reinstate it? Determines whether `tokens.css` at `2e06d2b6` is the intended palette or a partial rollback.
3. **Region backfill.** `regionId` is not null on five tables. D1 starts empty so nothing needs backfilling, but the portal must make region a required field on every create form. Confirm the three codes (`na`, `eu`, `as`) are still current — the deleted `MatchRegion` enum also had `sa`.
4. **Does `/vector-graph` ship?** It carries three design-log markdown files upstream (`vector.md`, `vectorDecisionLog.md`, `vectorImplementationLog.md`), which reads like an in-progress experiment rather than a finished feature.
5. **MSW.** Upstream added a full `FE/src/mocks/*` layer for local dev without a backend. Under one Worker with D1 fixtures, that need may be met by `tests/fixtures/seed.sql` already. Confirm before porting ten files.
