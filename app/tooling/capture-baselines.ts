import fs from "node:fs";
import path from "node:path";
import { chromium, type Browser } from "playwright";
import { routeManifest } from "../route-manifest";

const SITE = process.env.BASELINE_SITE_URL ?? "https://volleyball4-2.com";
const outDir = path.join(import.meta.dirname, "..", "baselines");

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

function listingFor(routePath: string): string {
  return routePath.slice(0, routePath.lastIndexOf("/")) || "/";
}

async function discoverConcretePath(browser: Browser, routePath: string): Promise<string | null> {
  const listing = listingFor(routePath);
  const prefix = `${listing === "/" ? "" : listing}/`;
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  try {
    await page.goto(`${SITE}${listing}`, { waitUntil: "networkidle", timeout: 45_000 });
    await page.waitForTimeout(2500);
    const href = await page.evaluate((linkPrefix) => {
      const anchors = Array.from(document.querySelectorAll("a[href]")) as HTMLAnchorElement[];
      for (const anchor of anchors) {
        const value = anchor.getAttribute("href") ?? "";
        if (!value.startsWith(linkPrefix)) continue;
        const rest = value.slice(linkPrefix.length);
        if (rest.length > 0 && !rest.includes("/")) return value;
      }
      return null;
    }, prefix);
    return href;
  } catch {
    return null;
  } finally {
    await context.close();
  }
}

async function main(): Promise<void> {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const captured: string[] = [];
  const skipped: string[] = [];
  const resolved: Record<string, string> = {};

  for (const entry of routeManifest) {
    if (entry.status === "removed" || entry.auth !== "public") {
      skipped.push(`${entry.path} — ${entry.status === "removed" ? "removed" : entry.auth}`);
      continue;
    }

    let routePath: string | null = entry.path;
    if (entry.path.includes(":")) {
      routePath = await discoverConcretePath(browser, entry.path);
      if (routePath === null) {
        skipped.push(`${entry.path} — no sample link found on ${listingFor(entry.path)}`);
        continue;
      }
      resolved[entry.path] = routePath;
    }

    const slug = entry.path === "/" ? "home" : entry.path.replace(/^\//, "").replace(/[/:]/g, "-");

    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
        ignoreHTTPSErrors: true,
      });
      const page = await context.newPage();
      const file = path.join(outDir, `${slug}.${viewport.name}.jpg`);

      try {
        await page.goto(`${SITE}${routePath}`, { waitUntil: "networkidle", timeout: 45_000 });
        await page.waitForTimeout(2500);
        await page.screenshot({ path: file, fullPage: true, type: "jpeg", quality: 55 });
        captured.push(path.basename(file));
      } catch (error) {
        skipped.push(`${entry.path} ${viewport.name} — ${(error as Error).message.split("\n")[0]}`);
      } finally {
        await context.close();
      }
    }
  }

  await browser.close();
  fs.writeFileSync(
    path.join(outDir, "MANIFEST.json"),
    `${JSON.stringify({ site: SITE, viewports: VIEWPORTS, resolved, captured, skipped }, null, 2)}\n`,
  );
  process.stdout.write(`captured ${captured.length}, skipped ${skipped.length}\n`);
  for (const line of skipped) process.stdout.write(`  skipped ${line}\n`);
}

await main();
