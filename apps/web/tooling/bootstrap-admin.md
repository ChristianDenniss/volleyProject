# Bootstrap the first admin

A fresh database has no admin, and Roblox is the only sign-in path, so there is
no seeded credential. Until an admin exists, `/portal` redirects everyone away.

Run this from `apps/web` unless noted. Prefer preview before production.

## Secrets checklist

Set these before the first production (or preview) sign-in. Local values live in
`.dev.vars` (copy from `.dev.vars.example`). Deployed values use Wrangler secrets.

| Name | Required | Notes |
|---|---|---|
| `BETTER_AUTH_SECRET` | yes | Long random string; rotating it invalidates sessions |
| `BETTER_AUTH_URL` | yes | Public site origin, e.g. `https://volleyball4-2.com` (no trailing slash) |
| `ROBLOX_CLIENT_ID` | yes | Roblox OAuth app client id |
| `ROBLOX_CLIENT_SECRET` | yes | Roblox OAuth app client secret |
| `ROOT_ROBLOX_IDS` | recommended | Comma-separated numeric Roblox user ids auto-promoted to `superadmin` |
| `CHALLONGE_API_KEY` | if importing brackets | Used by Challonge game import |

Local:

```
cp .dev.vars.example .dev.vars
```

Deployed (repeat per name):

```
bunx wrangler secret put BETTER_AUTH_SECRET
bunx wrangler secret put BETTER_AUTH_URL
bunx wrangler secret put ROBLOX_CLIENT_ID
bunx wrangler secret put ROBLOX_CLIENT_SECRET
bunx wrangler secret put ROOT_ROBLOX_IDS
bunx wrangler secret put CHALLONGE_API_KEY
```

Roblox OAuth redirect URI must match `{BETTER_AUTH_URL}/api/auth/callback/roblox`.

## Automatic promotion (preferred)

Set `ROOT_ROBLOX_IDS` to a comma-separated list of Roblox account ids. Every
time one of those accounts signs in, its user row is promoted to `superadmin`.
That covers the very first sign-in on an empty database, and it re-promotes if
the role is later changed by hand.

Local (`.dev.vars`):

```
ROOT_ROBLOX_IDS=1234567,7654321
```

The id is the numeric Roblox user id (`roblox.com/users/<id>/profile`), not the
username. Leave the variable unset to disable promotion entirely.

## Manual fallback

1. Deploy the worker and open it in a browser.
2. Sign in once with Roblox.
3. Read the generated id:

   ```
   bunx wrangler d1 execute volley-project --remote \
     --command "select id, name, email, role from user order by created_at desc limit 5"
   ```

4. Promote that id:

   ```
   bunx wrangler d1 execute volley-project --remote \
     --command "update user set role='superadmin' where id='<id>'"
   ```

5. Reload `/portal`.

## Preview rehearsal

1. Put the secrets on the preview Worker (or use the deploy preview workflow secrets).
2. Confirm `BETTER_AUTH_URL` is the preview origin for that rehearsal.
3. Sign in with a `ROOT_ROBLOX_IDS` account and open `/portal`.
4. Confirm the role is `superadmin` in D1 if the portal still redirects.

`--local` targets the miniflare database used by `wrangler dev` / `bun run mock-dev`.
