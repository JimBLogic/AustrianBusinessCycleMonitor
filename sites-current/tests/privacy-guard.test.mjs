import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCAN_ROOTS = ["app", "lib", "worker"];
const SOURCE_EXTENSIONS = new Set([".css", ".html", ".js", ".jsx", ".ts", ".tsx"]);

async function sourceFiles(relativeDirectory) {
  const directory = path.join(ROOT, relativeDirectory);
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) files.push(...(await sourceFiles(relativePath)));
    else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) files.push(relativePath);
  }
  return files;
}

test("source contains no app cookies, tracking, fingerprinting, embeds or forms", async () => {
  const forbidden = [
    ["Google Analytics", /googletagmanager|google-analytics|\bgtag\s*\(/i],
    ["Meta Pixel", /connect\.facebook\.net|\bfbq\s*\(/i],
    ["Hotjar", /hotjar|\bhj\s*\(/i],
    ["Microsoft Clarity", /clarity\.ms|\bclarity\s*\(/i],
    ["advertising SDK", /doubleclick\.net|googlesyndication|adsbygoogle/i],
    ["fingerprinting", /fingerprintjs|deviceprint|\.toDataURL\s*\(|getImageData\s*\(|enumerateDevices\s*\(/i],
    ["cookie access", /document\.cookie|\bSet-Cookie\b/i],
    ["IndexedDB", /\bindexedDB\s*[.(]/i],
    ["service worker", /serviceWorker\s*\.\s*register\s*\(/i],
    ["embedded document", /<\s*(?:iframe|embed|object)\b/i],
    ["visitor form", /<\s*form\b/i],
  ];
  for (const relativePath of (await Promise.all(SCAN_ROOTS.map(sourceFiles))).flat()) {
    const source = await readFile(path.join(ROOT, relativePath), "utf8");
    for (const [label, pattern] of forbidden) {
      assert.doesNotMatch(source, pattern, `${label} found in ${relativePath}`);
    }
  }
});

test("browser persistence is centralized and limited to four documented preferences", async () => {
  const files = (await Promise.all(SCAN_ROOTS.map(sourceFiles))).flat();
  const storageUsers = [];
  for (const relativePath of files) {
    const source = await readFile(path.join(ROOT, relativePath), "utf8");
    if (/window\.localStorage|\.(?:getItem|setItem|removeItem)\(/.test(source)) storageUsers.push(relativePath);
    assert.doesNotMatch(source, /window\.sessionStorage|sessionStorage\s*\.\s*(?:getItem|setItem|removeItem)\s*\(/);
  }
  assert.deepEqual(storageUsers, ["lib/local-preferences.ts"]);

  const helper = await readFile(path.join(ROOT, "lib/local-preferences.ts"), "utf8");
  for (const key of [
    "abcm:language",
    "abcm:watchlist",
    "abcm:educational-notice:v1",
    "abcm:manual-refresh-state:v1",
  ]) assert.match(helper, new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.equal((helper.match(/\.setItem\(/g) ?? []).length, 4);

  const monitor = await readFile(path.join(ROOT, "app/monitor.tsx"), "utf8");
  assert.match(monitor, /saveLanguagePreference\(next\)/);
  assert.match(monitor, /saveWatchlistPreference\(next\)/);
  assert.match(monitor, /saveEducationalNoticeAcceptance\(\)/);
  assert.match(monitor, /saveManualRefreshPreference\(previousSnapshot, nextAllowedAt\)/);
  assert.doesNotMatch(monitor, /abcm:(?:language|watchlist|last-valid-snapshot|visit-baseline)/);
});

test("local preferences are omitted from same-origin API requests", async () => {
  const monitor = await readFile(path.join(ROOT, "app/monitor.tsx"), "utf8");
  for (const endpoint of ["/api/data", "/api/bitcoin"]) {
    const start = monitor.indexOf(`fetch("${endpoint}"`);
    assert.ok(start >= 0, `missing ${endpoint} request`);
    const request = monitor.slice(start, start + 260);
    assert.match(request, /credentials: "omit"/);
    assert.match(request, /referrerPolicy: "no-referrer"/);
  }
});

test("server requests pass through the explicit HTTPS host allowlist", async () => {
  const upstream = await readFile(path.join(ROOT, "app/data/upstream.ts"), "utf8");
  const policy = await readFile(path.join(ROOT, "lib/network-policy.ts"), "utf8");
  assert.match(upstream, /fetch\(essentialServerUrl\(input\)/);
  assert.match(policy, /url\.protocol !== "https:"/);
  assert.match(policy, /essentialServerHosts\.has\(url\.hostname\)/);
  assert.equal((upstream.match(/\bfetch\(/g) ?? []).length, 1);
});

test("personal workspace, authentication and file APIs are not shipped", async () => {
  for (const relativePath of [
    "app/workspace/page.tsx",
    "app/api/workspace/route.ts",
    "app/api/files/route.ts",
    "app/api/files/[id]/route.ts",
    "app/api/export/route.ts",
    "app/chatgpt-auth.ts",
  ]) await assert.rejects(access(path.join(ROOT, relativePath)));

  const hosting = JSON.parse(await readFile(path.join(ROOT, ".openai/hosting.json"), "utf8"));
  assert.equal(hosting.d1, "DB");
  assert.equal(hosting.r2, null);
});

test("production client contains no cookie, tracking or hidden browser databases", async () => {
  const assetDirectory = path.join(ROOT, "dist/client/assets");
  const assetNames = await readdir(assetDirectory);
  for (const name of assetNames.filter((entry) => entry.endsWith(".js"))) {
    const source = await readFile(path.join(assetDirectory, name), "utf8");
    assert.doesNotMatch(source, /document\.cookie|\bindexedDB\s*[.(]|serviceWorker\s*\.\s*register\s*\(/i);
    assert.doesNotMatch(source, /googletagmanager|google-analytics|connect\.facebook\.net|hotjar|clarity\.ms|doubleclick\.net|fingerprintjs/i);
  }
});
