import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const files = await Promise.all([
  "app/monitor.tsx",
  "app/learn/learn-home.tsx",
  "app/learn/course.tsx",
  "app/learn/library.ts",
  "app/api/data-manifest/route.ts",
  "app/data/bitcoin-spot.ts",
  "app/data/upstream.ts",
  "app/version.ts",
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
  assert.match(source, /SITE_RELEASE = 28/);
  assert.match(source, /DATA_SCHEMA_VERSION = "1\.2\.0"/);
  assert.match(source, /sites-current/);
  assert.equal(source.includes("Manual refresh uses no-store"), false);
});

test("documents resilient Bitcoin sourcing and truthful initial UI states", () => {
  for (const expected of [
    "Kraken",
    "World Monitor",
    "per-provider circuit breaker",
    "PENDIENTE DE LA PRIMERA CARGA",
    "Cambiar idioma a inglés",
    "SITES V28",
  ]) assert.ok(source.includes(expected), `missing audited behavior: ${expected}`);
  assert.equal(source.includes("new Date(0)"), false);
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
