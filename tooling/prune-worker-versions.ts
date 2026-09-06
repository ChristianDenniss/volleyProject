import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const wranglerConfig = JSON.parse(
  readFileSync(path.join(repoRoot, "wrangler.jsonc"), "utf8").replace(/^\s*\/\/.*$/gm, ""),
) as { account_id: string; name: string };

interface VersionItem {
  id: string;
  number: number;
}

interface ApiList<T> {
  success: boolean;
  result: { items: T[] };
  result_info: { page: number; per_page: number; total_pages: number; total_count: number };
  errors?: { message: string }[];
}

interface DeploymentsResponse {
  success: boolean;
  result: { deployments: { versions: { version_id: string }[] }[] };
  errors?: { message: string }[];
}

interface WorkersResponse {
  success: boolean;
  result: { id: string; name: string }[];
  errors?: { message: string }[];
}

function apiToken(): string {
  const fromEnv = process.env["CLOUDFLARE_API_TOKEN"]?.trim();
  if (fromEnv) return fromEnv;
  return execSync("pnpm exec wrangler auth token", {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  })
    .trim()
    .split("\n")
    .at(-1)!
    .trim();
}

async function cf<T>(token: string, pathname: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`https://api.cloudflare.com/client/v4${pathname}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  const body = (await response.json()) as T & { success?: boolean; errors?: { message: string }[] };
  if (!response.ok || body.success === false) {
    const message = body.errors?.map((error) => error.message).join("; ") ?? response.statusText;
    throw new Error(`${init?.method ?? "GET"} ${pathname}: ${message}`);
  }
  return body;
}

async function listVersions(token: string, accountId: string, scriptName: string): Promise<VersionItem[]> {
  const items: VersionItem[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const response = await cf<ApiList<VersionItem>>(
      token,
      `/accounts/${accountId}/workers/scripts/${scriptName}/versions?page=${page}&per_page=100`,
    );
    items.push(...response.result.items);
    totalPages = response.result_info.total_pages;
    page += 1;
  } while (page <= totalPages);
  return items;
}

async function activeVersionId(token: string, accountId: string, scriptName: string): Promise<string | null> {
  const response = await cf<DeploymentsResponse>(
    token,
    `/accounts/${accountId}/workers/scripts/${scriptName}/deployments`,
  );
  return response.result.deployments[0]?.versions[0]?.version_id ?? null;
}

async function workerId(token: string, accountId: string, scriptName: string): Promise<string> {
  const response = await cf<WorkersResponse>(token, `/accounts/${accountId}/workers/workers`);
  const worker = response.result.find((entry) => entry.name === scriptName);
  if (!worker) throw new Error(`Worker not found: ${scriptName}`);
  return worker.id;
}

async function deleteVersion(
  token: string,
  accountId: string,
  worker: string,
  versionId: string,
): Promise<void> {
  await cf(token, `/accounts/${accountId}/workers/workers/${worker}/versions/${versionId}`, {
    method: "DELETE",
  });
}

async function main(): Promise<void> {
  const keep = Number(process.env["KEEP_VERSIONS"] ?? process.argv.find((arg) => arg.startsWith("--keep="))?.slice(6) ?? 10);
  if (!Number.isFinite(keep) || keep < 1) {
    throw new Error(`Invalid keep count: ${keep}`);
  }

  const dryRun = process.argv.includes("--dry-run");
  const accountId = process.env["CLOUDFLARE_ACCOUNT_ID"] ?? wranglerConfig.account_id;
  const scriptName = process.env["WORKER_NAME"] ?? wranglerConfig.name;
  const token = apiToken();

  const [versions, activeId, worker] = await Promise.all([
    listVersions(token, accountId, scriptName),
    activeVersionId(token, accountId, scriptName),
    workerId(token, accountId, scriptName),
  ]);

  const keepIds = new Set(
    [...versions]
      .sort((left, right) => right.number - left.number)
      .slice(0, keep)
      .map((version) => version.id),
  );
  if (activeId) keepIds.add(activeId);

  const toDelete = versions
    .filter((version) => !keepIds.has(version.id))
    .sort((left, right) => left.number - right.number);

  console.log(
    `Worker ${scriptName}: ${versions.length} versions, keeping ${keepIds.size}, deleting ${toDelete.length}${dryRun ? " (dry run)" : ""}`,
  );

  if (dryRun) {
    for (const version of toDelete) {
      console.log(`  would delete #${version.number} ${version.id}`);
    }
    return;
  }

  let deleted = 0;
  for (const version of toDelete) {
    await deleteVersion(token, accountId, worker, version.id);
    deleted += 1;
  }

  const remaining = await listVersions(token, accountId, scriptName);
  console.log(`Deleted ${deleted} versions. ${remaining.length} remain.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
