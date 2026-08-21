import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const files = await Promise.all([
  "app/monitor.tsx",
  "app/learn/learn-home.tsx",
  "app/learn/course.tsx",
  "app/learn/library.ts",
  "app/api/data/route.ts",
  "app/api/data-manifest/route.ts",
  "app/api/workspace/route.ts",
  "app/api/files/route.ts",
  "app/api/files/[id]/route.ts",
  "app/chatgpt-auth.ts",
  "app/data/bitcoin-spot.ts",
  "app/data/upstream.ts",
  "app/version.ts",
  "scripts/selfhost-smoke.sh",
  "next.config.ts",
  "README.md",
  "INSPIRATION.md",
].map(async (path) => [path, await readFile(new URL(`../${path}`, import.meta.url), "utf8")]));

const source = files.map(([, content]) => content).join("\n");

test("retains complete Spanish and English navigation paths", () => {
  for (const label of [
    "Volver al monitor", "Back to monitor",
    "Empezar la ruta", "Start the path",
    "Actualizar datos", "Refresh data",
    "Fuentes y verificación", "Sources & verification",
    "Reiniciar evaluación", "Restart assessment",
  ]) {
    assert.match(source, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("identifies the next immutable Sites release and its canonical repository mirror", () => {
  assert.match(source, /SITE_RELEASE = 42/);
  assert.match(source, /DATA_SCHEMA_VERSION = "1\.4\.0"/);
  assert.match(source, /CONTEXT_MODEL_VERSION = "abcm-six-force-1"/);
  assert.match(source, /sites-current/);
  assert.equal(source.includes("Manual refresh uses no-store"), false);
});

test("publishes ten auditable signals with durable daily editions", () => {
  for (const expected of [
    "monetaryStance",
    "termStructure",
    "consumerPrices",
    "fiscalImpulse",
    "editionTtlSeconds",
    "nextManualAt",
    "nextDailyAt",
    "durable-daily-edition",
  ]) assert.ok(source.includes(expected), `missing daily ten-signal contract: ${expected}`);
});

test("documents resilient Bitcoin sourcing and truthful initial UI states", () => {
  for (const expected of [
    "Kraken",
    "World Monitor",
    "per-provider circuit breaker",
    "PENDIENTE DE LA PRIMERA CARGA",
    "Cambiar idioma a inglés",
    "SITE_RELEASE}",
  ]) assert.ok(source.includes(expected), `missing audited behavior: ${expected}`);
  assert.equal(source.includes("new Date(0)"), false);
});

test("keeps authenticated mutations same-site and applies browser hardening headers", () => {
  for (const expected of [
    "isTrustedMutation(request)",
    "Cross-site request rejected",
    "Content-Security-Policy",
    "frame-ancestors 'none'",
    "Cross-Origin-Resource-Policy",
  ]) assert.ok(source.includes(expected), `missing DevSecOps control: ${expected}`);
});

test("documents the maintained release and a reproducible local full-stack rebuild", () => {
  for (const expected of [
    "Always start from `sites-current/`",
    "Start frontend and backend together",
    "npm run validate:artifact",
    "D1 database bound as `DB`",
    "`BUCKET` binding",
    "app/version.ts` and `/api/health`",
  ]) assert.ok(source.includes(expected), `missing reconstruction guidance: ${expected}`);
  assert.equal(source.includes("Sites v25 reference interface"), false);
});

test("ships the exact Sites application as a persistent local container mirror", async () => {
  for (const path of [
    "Dockerfile.local", "compose.local.yml", ".dev.vars.example", ".dockerignore",
    "Dockerfile.selfhost", "compose.selfhost.yml", ".env.selfhost.example",
    "Caddyfile.selfhost", "wrangler.selfhost.jsonc", "scripts/run-selfhost.sh",
    "scripts/selfhost-smoke.sh",
  ]) {
    await access(new URL(`../${path}`, import.meta.url));
  }
  for (const expected of [
    "Local container mirror",
    "compose.local.yml",
    "Named Docker volumes",
    "GitHub Pages alone cannot host",
    "Exact self-hosted mirror on a VPS",
    "same compiled Worker artifact",
    "compose.selfhost.yml",
    "health.siteRelease",
  ]) assert.ok(source.includes(expected), `missing container guidance: ${expected}`);
});

test("documents path-scoped CI without weakening either deployment gate", () => {
  for (const expected of [
    "Path-scoped CI",
    "sites-current/",
    "historical Flask/React",
    "cancel-in-progress",
  ]) assert.ok(source.includes(expected), `missing CI efficiency guidance: ${expected}`);
});

test("does not reintroduce retired or access-blocked public links", () => {
  for (const retired of [
    "hashcash.org",
    "weidai.com",
    "/library/a-cypherpunks-manifesto/",
    "/library/book/prices-and-production",
    "spoudai.org",
    "www.revistas.unam.mx",
    "www.coingecko.com/en/coins/bitcoin",
    "/api/data?refresh=1",
  ]) {
    assert.equal(source.includes(retired), false, `retired destination returned: ${retired}`);
  }
});

test("does not reintroduce removed starter or generated artifacts", async () => {
  for (const path of [
    "db/index.ts",
    "examples/d1/app/api/notes/route.ts",
    "examples/d1/db/schema.ts",
    "public/file.svg",
    "public/globe.svg",
    "public/window.svg",
    "tsconfig.tsbuildinfo",
  ]) {
    await assert.rejects(
      access(new URL(`../${path}`, import.meta.url)),
      `retired artifact returned: ${path}`,
    );
  }
});
