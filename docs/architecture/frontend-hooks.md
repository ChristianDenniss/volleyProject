# Hook Inventory

> Full reference for `CLAUDE.md` Rule 3 (API calls belong in hooks only). **Every HTTP request in the frontend originates here** — a component that calls `fetch`, `authFetch` or `axios` directly is a rule violation, and `eslint-rules/api-calls-in-hooks.js` will flag it.
>
> This includes Context providers: `authContext` and `regionContext` go through `useSessionApi`, not raw `fetch`.

---

## Transport primitives

The layer everything else is built on. You almost never call these directly from a feature hook — reach for the generic CRUD hooks below first.

| File | What it provides |
|---|---|
| `authFetch.ts` | `fetch` with the bearer token injected automatically. The default transport for authenticated requests. |
| `useFetch.ts` | `useFetch<T>(endpoint)` plus the by-id fetchers (`useFetchTeamByName`, `useFetchGameById`, `useFetchSeasonById`, `useFetchArticleById`, `useFetchPlayerById`, `useObjectFetch`) and the trivia fetchers. |
| `usePaginatedFetch.ts` | `usePaginatedFetch<T>(resource, params)` → `{ data, total, totalPages, loading, error, refetch }`. Backs every list page. Exports `PaginationParams` and `DEFAULT_PAGINATION`. |
| `useCreate.ts` / `usePatch.ts` / `useDelete.ts` | Generic single-resource mutations, wrapped by the `all*` files below. |

## Generic CRUD

| File | Exports |
|---|---|
| `allFetch.ts` | Every read hook, typed per resource: `usePlayers`, `useSeasons`, `useGames`, `useStats`, `useLeaderboard`, `useArticles`, `useRecords`, `useApplications`, the `skinny`/`medium` projections (`useSkinnyTeams`, `useMediumPlayers`, `useSkinnySeasons`, `useSkinnyGames`, `useSkinnyAwards`, …), the single-resource hooks (`useSingleTeam`, `useSingleGames`, `useSingleSeason`, `useSinglePlayer`, `useSingleArticles`, `useSingleAward`), `useAwardsByPlayerID`, `useGameStages`, and the trivia hooks. |
| `allCreate.ts` | `useCreatePlayers`, `useCreateTeams`, `useCreateSeasons`, `useCreateGames`, `useCreateStats`, `useCreateAwards`, `useCreateArticles`, `useCSVUpload`, `useAddStatsToExistingGame`, `useCalculateRecords`. |
| `allPatch.ts` | `useSeasonMutations`, `usePlayerMutations`, `useTeamMutations` (also `patchTeamFlags` for the staff-edit toggle, which lives behind its own endpoint), `useArticleMutations`, `useGameMutations`, `useStatsMutations`, `useAwardsMutations`, `useApplicationMutations`. |
| `allDelete.ts` | `useDeletePlayers`, `useDeleteTeams`, `useDeleteSeasons`, `useDeleteGames`, `useDeleteStats`, `useDeleteAwards`. |
| `useCreatePlayers.ts` | `useBatchPlayersByTeamName` — the portal's batch player creation. |

## Session and identity

| File | Exports | Notes |
|---|---|---|
| `useSessionApi.ts` | `fetchSessionUser()`, `endSession()`, `fetchRegions()` | Plain functions rather than hooks, because the callers are Provider bodies. They live here anyway so a Context can't quietly become a second place fetches happen. Cookie-authenticated, so they bypass `authFetch`. |
| `useLogin.ts` / `useSignUp.ts` | `useLogin`, `useSignup` | The two auth form submissions. |
| `useUserProfile.ts` | `useUserProfile(enabled)` | The signed-in user's own account record, plus `unlinkRoblox`. A 401 surfaces as `unauthorized` rather than an error — logging out and redirecting is a routing decision, not a data hook's job. |
| `useUsers.ts` | `useUsers(params)` | The portal's paginated user list plus `changeRole`. |

## Feature hooks

| File | Exports | Notes |
|---|---|---|
| `useTeamRegistrations.ts` | `useTeamRegistrations`, `useTeamRegistration`, `useRegistrationSummary`, `useSubmitTeamRegistration`, `useRegistrationModeration`, `startRobloxOAuth` | `useRegistrationModeration` owns the accept/deny/revoke flow **and** the conflict path: a 409 with a conflict list is a normal outcome (a duplicate team name, or a player already rostered), so it lands in state for the caller to render a resolution dialog rather than surfacing as a failure. |
| `useTeamStaffEdit.ts` | `useTeamStaffEdit(teamId)` | Decides whether the viewer may edit a team — three conditions, all required: they hold a staff role, the season allows staff edits, the team isn't locked. Refetches the team rather than trusting props, because the two flags are toggled from the admin portal. |
| `usePortalDashboard.ts` | `usePortalDashboard()` | Eight collection counts in parallel behind one `loading` flag. A collection that fails resolves to empty rather than rejecting the batch, so one broken endpoint doesn't blank the dashboard. |
| `useChallongeImport.ts` | `useChallongeImport()` | Posts a Challonge bracket URL to the games importer. Returns `unmatchedTeams` as a *result*, not an exception — the import is all-or-nothing, and the unmatched list is what the form needs to show. |
| `useVectorGraphData.ts` | `useFetchPlayersWithStats`, `useFetchSeasons` | The 3D vector graph's data sources. |
| `useLikeArticle.ts` / `useLikeStatus.ts` | `useLikeArticle`, `useLikeStatus` | Article like toggle and its current state. |
| `useFormRegionSeason.ts` | `useFormRegionSeason(seasonValueKey)` | Owns the region → season fetch chain every portal create form needs, plus `initFromActiveRegion()` and `regionPayload`. Drives `inputs/RegionSeasonFields`. |

## Utilities

| File | Exports | Notes |
|---|---|---|
| `useDebouncedValue.ts` | `useDebouncedValue(value, delay?)` | Debounce a search box before it reaches a fetch hook. Every list page's search goes through this. |

---

## Adding a hook

1. **Does a generic CRUD hook already cover it?** Use that.
2. **Is it a new endpoint on an existing resource?** Add it to the matching `all*.ts` file next to its siblings.
3. **Does it have its own request shape or multi-step flow?** Give it its own file, named for the feature.

Then add it to this table, in the same PR (Rule 10).
