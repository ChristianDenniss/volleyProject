# Bootstrap the first admin

A fresh database has no admin, and Roblox is the only sign-in path, so there is
no seeded credential. Until this runs, `/portal` redirects everyone away.

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
