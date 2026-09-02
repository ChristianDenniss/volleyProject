# Bootstrap the first admin

A fresh database has no admin, and Roblox is the only sign-in path, so there is
no seeded credential. Until an admin exists, `/portal` redirects everyone away.

## Automatic (preferred)

Set `ROOT_ROBLOX_IDS` to a comma-separated list of Roblox account ids. Every
time one of those accounts signs in, its user row is promoted to `superadmin`.
That covers the very first sign-in on an empty database, and it re-promotes if
the role is later changed by hand.

Local (`.dev.vars`):

```
ROOT_ROBLOX_IDS=1234567,7654321
```

Deployed:

```
npx wrangler secret put ROOT_ROBLOX_IDS
```

The id is the numeric Roblox user id (`roblox.com/users/<id>/profile`), not the
username. Leave the variable unset to disable promotion entirely.

## Manual fallback

1. Deploy the worker and open it in a browser.
2. Sign in once with Roblox.
3. Read the generated id:

   ```
   npx wrangler d1 execute volley-project --remote \
     --command "select id, name, email, role from user order by created_at desc limit 5"
   ```

4. Promote that id:

   ```
   npx wrangler d1 execute volley-project --remote \
     --command "update user set role='superadmin' where id='<id>'"
   ```

5. Reload `/portal`.

Rehearse the whole sequence against a preview deployment before running it in
production. `--local` targets the miniflare database used by `wrangler dev`.
