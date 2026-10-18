# Go-live: auth and admin rehearsal

Companion to [bootstrap-admin.md](../tooling/bootstrap-admin.md). Use this as
the ordered checklist before pointing DNS at the Worker.

## Before deploy

1. Create (or confirm) the Roblox OAuth application.
2. Set the callback to `{public origin}/api/auth/callback/roblox`.
3. Generate a fresh `BETTER_AUTH_SECRET`.
4. Decide which Roblox numeric ids belong in `ROOT_ROBLOX_IDS`.
5. Confirm Cloudflare account, D1 database `volley-project`, and Worker routes
   in `wrangler.jsonc` match the intended domain.

## On preview

1. Apply remote D1 migrations and deploy a preview.
2. Put every secret from the bootstrap checklist onto that Worker.
3. Set `BETTER_AUTH_URL` to the **preview** origin for this rehearsal.
4. Sign in with a listed Roblox account.
5. Open `/portal` — it must load, not redirect to login or home.
6. Optional: run the manual D1 role query from the bootstrap doc to confirm
   `superadmin`.

## On production

1. Change `BETTER_AUTH_URL` to `https://volleyball4-2.com` (and update the
   Roblox callback to match).
2. Re-put `ROOT_ROBLOX_IDS` if it was preview-only.
3. Deploy, sign in once as a root id, open `/portal`.
4. Only then flip DNS / custom domain cutover if it is not already attached.

Do not treat an empty database with no admin as a soft failure — the public
site may render, but staff cannot enter data until this sequence succeeds.
