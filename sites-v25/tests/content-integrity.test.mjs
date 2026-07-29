import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const files = await Promise.all([
  "app/monitor.tsx",
  "app/learn/learn-home.tsx",
  "app/learn/course.tsx",
  "app/learn/library.ts",
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
