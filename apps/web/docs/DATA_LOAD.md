# Go-live: loading league data

D1 starts empty. The public site only fills when staff write through the portal,
sheet import, or Challonge import. Run this after
[auth bootstrap](GO_LIVE_AUTH.md) succeeds and `/portal` is reachable.

## Preferred path: Google Sheets → season

1. Open `/portal/seasons`.
2. Use **Import from Sheets** (season sheet import).
3. Paste the master workbook URL and the NA / EU / AS regional tab URLs.
4. Preview, exclude bad rows if needed, then commit.
5. Confirm season, teams, players, and games appear on the public site
   (`/seasons`, `/teams`, `/schedules`).

Teams-only / players-only imports live on `/portal/teams` for follow-up seasons
or roster fixes.

## Brackets: Challonge

1. Put `CHALLONGE_API_KEY` on the Worker (see bootstrap secrets checklist).
2. Open `/portal/games` and use Challonge import for the target season/region.
3. Confirm imported matches show on `/schedules` and the season page.

## Manual CRUD

When a sheet is wrong or incomplete, create or edit rows under:

- `/portal/seasons`
- `/portal/teams`
- `/portal/players`
- `/portal/games`
- `/portal/stats`
- `/portal/records`
- `/portal/awards`
- `/portal/articles`
- `/portal/applications`

## Empty-site check

Before DNS cutover:

1. Home shows real matches / standings, not fixture-looking placeholders.
2. `/schedules`, `/stats`, `/teams`, and `/players` return non-empty lists for
   the active season.
3. Portal dashboard counts are non-zero for seasons and teams.

Local rehearsal: `bun run mock-dev` loads the fixture seed. That is for
development only — production must use real sheet/Challonge/portal data.
