import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { runInNewContext } from "node:vm";

const require = createRequire(import.meta.url);
const braces = require("braces");
const vendor = new URL("../vendor/braces-bounded/", import.meta.url);
const pattern = (n, parens = false) => (parens ? "(" : "{").repeat(n)
  + "x" + (parens ? ")" : "}").repeat(n);
const depthError = /exceeds max depth/;
function ast(n) {
  let node = { type: "text", value: "x" };
  for (let i = 0; i < n; i++) node = { type: "paren", nodes: [node] };
  return { type: "root", nodes: [node] };
}

test("every installed glob consumer uses the pinned security backport", () => {
  const provenance = JSON.parse(readFileSync(new URL("provenance.json", vendor)));
  assert.equal(require("braces/package.json").name, "@abcm/braces-bounded");
  for (const [path, expected] of Object.entries(provenance.patched_sha256)) {
    assert.equal(createHash("sha256").update(readFileSync(new URL(path, vendor))).digest("hex"), expected, path);
  }
  const fromMicromatch = createRequire(require.resolve("micromatch"));
  assert.equal(fromMicromatch.resolve("braces"), require.resolve("braces"));
  const lock = JSON.parse(readFileSync(new URL("../package-lock.json", import.meta.url)));
  const installed = Object.entries(lock.packages).filter(([path]) => /node_modules\/braces$/.test(path));
  assert.equal(installed.length, 1);
  assert.equal(installed[0][1].resolved, "vendor/braces-bounded");
});

test("string and direct AST guards protect all recursive public entry points", () => {
  for (const method of ["parse", "compile", "expand", "stringify"]) {
    for (const parens of [false, true]) {
      assert.doesNotThrow(() => braces[method](pattern(100, parens)));
      for (const n of [101, 1000, 4999]) {
        assert.throws(() => braces[method](pattern(n, parens)), depthError, `${method} ${n}`);
      }
    }
    for (const options of [{ maxDepth: 1.5 }, { maxDepth: 1 }]) {
      assert.throws(() => braces[method]("{{x}}", options), depthError);
      assert.doesNotThrow(() => braces[method]("{x}", options));
    }
    for (const maxDepth of [100000, Infinity, NaN]) {
      assert.throws(() => braces[method](pattern(101), { maxDepth }), depthError);
    }
  }
  for (const method of ["compile", "expand", "stringify"]) {
    assert.doesNotThrow(() => braces[method](ast(100)));
    assert.throws(() => braces[method](ast(10000)), depthError);
    const cycle = { type: "root", nodes: [] };
    cycle.nodes.push(cycle);
    assert.throws(() => braces[method](cycle), depthError);
  }
});

test("published stack-exhaustion payload is rejected in a bounded child process", () => {
  const result = spawnSync(process.execPath, ["-e", `
    const braces = require('braces');
    for (const method of ['compile', 'expand', 'stringify']) {
      try { braces[method]('{'.repeat(4999) + 'x' + '}'.repeat(4999)); process.exit(2); }
      catch (error) {
        if (!/exceeds max depth/.test(error.message) || /call stack/i.test(error.message)) process.exit(3);
      }
    }
    console.log('bounded rejection');
  `], { cwd: new URL("../", import.meta.url), timeout: 5000, maxBuffer: 10240, encoding: "utf8" });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /bounded rejection/);
});

test("cyclic expansion parent chains stop before an unbounded loop", () => {
  for (const twoNodes of [false, true]) {
    const node = { type: "paren", nodes: [{ type: "text", value: "x" }] };
    node.parent = twoNodes ? { type: "paren", parent: node } : node;
    assert.throws(
      () => runInNewContext("braces.expand(node)", { braces, node }, { timeout: 250 }),
      /AST parent chain contains a cycle/,
    );
  }
});

test("normal globs, ranges and escaping retain published semantics", () => {
  assert.deepEqual(braces.expand("src/{app,lib}/file-{01..03}.ts"), [
    "src/app/file-01.ts", "src/app/file-02.ts", "src/app/file-03.ts",
    "src/lib/file-01.ts", "src/lib/file-02.ts", "src/lib/file-03.ts",
  ]);
  assert.equal(braces.compile("x/{a,{b,c}}/y"), "x/(a|(b|c))/y");
  assert.equal(braces.stringify("{1..8}", { escapeInvalid: true }), "{1..8}");
  assert.equal(braces.stringify("'{a,b}'"), "{a,b}");
  assert.doesNotThrow(() => braces.compile("\\{".repeat(200)));
  const micromatch = require("micromatch");
  assert.deepEqual(micromatch(["a.ts", "b.js", "c.json"], "*.{js,ts}"), ["a.ts", "b.js"]);
  const glob = require("fast-glob");
  assert.ok(glob.sync("app/{api,components}/**/*.{ts,tsx}").length > 0);
  assert.throws(() => micromatch.braces(pattern(4999)), depthError);
  assert.throws(() => glob.sync(pattern(4999)), depthError);
});
