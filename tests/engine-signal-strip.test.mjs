import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [monitor, styles] = await Promise.all([
  readFile(new URL("../app/monitor.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/engine.css", import.meta.url), "utf8"),
]);

test("never presents fallback zeros as verified signal readings", () => {
  assert.match(monitor, /const signalHasData = .*data\.provenance\.mode !== "fallback"/);
  assert.match(monitor, /const ready = signalHasData\(item\)/);
  assert.match(monitor, /Una ausencia no se convierte en cero/);
  assert.match(monitor, /Missing data is never converted into zero/);
});

test("keeps an individually verified signal auditable when the composite is withheld", () => {
  const showSignal = monitor.slice(monitor.indexOf("function showSignal"), monitor.indexOf("function acceptDisclaimer"));
  assert.match(showSignal, /const available = item\.ready/);
  assert.doesNotMatch(showSignal, /modelAvailable && item\.ready/);
  assert.match(showSignal, /PESO BASE/);
});

test("exposes the signal strip and each dialog trigger to assistive technology", () => {
  for (const expected of [
    'aria-labelledby="engine-title"',
    'id="engine-title"',
    'role="group"',
    'aria-haspopup="dialog"',
    'aria-controls="detail-dialog"',
    'aria-expanded={detail?.title === item.label}',
    "Abrir explicación",
    "Open explanation",
  ]) assert.ok(monitor.includes(expected), `missing engine accessibility detail: ${expected}`);
});

test("moves focus into the dialog, traps Tab and restores the signal trigger", () => {
  for (const expected of [
    "detailCloseRef.current?.focus()",
    "dialog.querySelectorAll<HTMLElement>",
    'event.key !== "Tab"',
    "opener?.isConnected",
    "opener.focus()",
    "ref={detailCloseRef}",
  ]) assert.ok(monitor.includes(expected), `missing dialog keyboard behaviour: ${expected}`);
});

test("balances cards with independent borders at every breakpoint", () => {
  assert.match(styles, /\.score-strip\{display:grid;grid-template-columns:repeat\(5,minmax\(0,1fr\)\);gap:8px\}/);
  assert.match(styles, /\.score-strip button\{[^}]*border:1px solid #3a453f/);
  assert.match(styles, /max-width:1000px\)\{\.score-strip\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(styles, /max-width:700px\)\{\.score-strip\{grid-template-columns:repeat\(2,1fr\)/);
  assert.match(styles, /max-width:460px\)\{\.score-strip,.ratio-strip,.correlation-grid,.scenario-grid,.freshness-list,.score-equation\{grid-template-columns:1fr/);
  assert.doesNotMatch(styles, /\.score-strip button:nth-child/);
});

test("keeps English signal inputs and readings fully localized", () => {
  for (const expected of ["Fed funds Δ · real rate", "capacity Δ", "1Y unemployment Δ", "broad dollar 90d", "Debt / GDP"]) {
    assert.ok(monitor.includes(expected), `missing English signal copy: ${expected}`);
  }
});
