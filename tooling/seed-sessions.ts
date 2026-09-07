import { execFileSync } from "node:child_process";
import { join } from "node:path";

const wranglerBin = join(process.cwd(), "node_modules/wrangler/bin/wrangler.js");

const HOUR = 60 * 60 * 1000;

const SESSIONS = [
  { id: "t3-admin", token: "t3-admin-token", userId: "fixture-admin" },
  { id: "t3-user", token: "t3-user-token", userId: "fixture-user" },
];

const now = Date.now();
const expiresAt = now + HOUR;

const statements = [
  "delete from session;",
  ...SESSIONS.map(
    (session) =>
      `insert into session (id, token, user_id, expires_at, created_at, updated_at) values ('${session.id}', '${session.token}', '${session.userId}', ${expiresAt}, ${now}, ${now});`,
  ),
].join(" ");

execFileSync(
  process.execPath,
  ["--no-warnings", wranglerBin, "d1", "execute", "volley-project", "--local", "--command", statements],
  { stdio: "inherit" },
);
