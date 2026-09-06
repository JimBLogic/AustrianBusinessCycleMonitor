import assert from "node:assert/strict";
import test from "node:test";

test("renders the public monitor with production security headers", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
  assert.equal(html.includes('name="codex-preview"'), false);
  assert.equal(html.includes("1970"), false);
  assert.doesNotMatch(html, /(?:href|src)="\/workspace\//);
  assert.match(html, /PENDIENTE DE LA PRIMERA CARGA/);
  assert.match(html, /Cambiar idioma a inglés/);
  assert.match(html, /PRECIO NO DISPONIBLE/);
  assert.match(response.headers.get("content-security-policy") ?? "", /connect-src 'self'/);
  assert.match(response.headers.get("content-security-policy") ?? "", /form-action 'none'/);
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
});

test("serves every public learning route in both languages", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("routes", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const env = {
    ASSETS: {
      fetch: async () => new Response("Not found", { status: 404 }),
    },
  };
  const ctx = { waitUntil() {}, passThroughOnException() {} };
  for (const path of [
    "/",
    "/learn?lang=es",
    "/learn?lang=en",
    "/learn/austrian-economics?lang=es",
    "/learn/austrian-economics?lang=en",
    "/learn/bitcoin-sovereignty?lang=es",
    "/learn/bitcoin-sovereignty?lang=en",
    "/privacidad",
    "/sitemap.xml",
    "/robots.txt",
  ]) {
    const response = await worker.fetch(new Request(`http://localhost${path}`), env, ctx);
    assert.equal(response.status, 200, `${path} returned ${response.status}`);
    const pathname = path.split("?")[0];
    if (pathname.startsWith("/learn") || pathname === "/privacidad") {
      const html = await response.text();
      const expected = `https://austrian-business-cycle-monitor.jimblogic.chatgpt.site${pathname}`;
      assert.ok(html.includes(`rel="canonical" href="${expected}"`), `${path}: own canonical`);
      assert.ok(html.includes(`property="og:url" content="${expected}"`), `${path}: own social URL`);
      assert.ok(!html.includes('hreflang="es-ES" href="https://austrian-business-cycle-monitor.jimblogic.chatgpt.site/"'));
    }
  }
});


test("font styles refer to portable public assets that exist in the production bundle", async () => {
  const {readFile, access} = await import("node:fs/promises");
  for (const family of ["geist-8ac0455e797f", "geist-mono-00e989178794"]) {
    const css = await readFile(new URL(`../public/fonts/${family}/style.css`, import.meta.url), "utf8");
    assert.doesNotMatch(css, /\/workspace\/|https:\/\//);
    const urls = [...css.matchAll(/url\(([^)]+)\)/g)].map(m=>m[1]);
    assert.ok(urls.length > 0);
    for (const path of urls) {
      assert.ok(path.startsWith("/fonts/"));
      await access(new URL(`../dist/client${path}`, import.meta.url));
    }
  }
});
