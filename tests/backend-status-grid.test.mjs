import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const monitor = readFileSync(new URL("../app/monitor.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../app/engine.css", import.meta.url), "utf8");
const backend = monitor.slice(
  monitor.indexOf('<div className="backend-grid">'),
  monitor.indexOf('<section className="dashboard-section"'),
);

test("excludes engines without coverage from extrema and divergence", () => {
  assert.ok(monitor.includes("available: modelAvailable && data.provenance.engineReady?.[key] !== false"));
  assert.ok(monitor.includes("const availableEngineAssessments = engineAssessments.filter((assessment) => assessment.available)"));
  assert.ok(monitor.includes("const strongest = [...availableEngineAssessments]"));
  assert.ok(monitor.includes("const weakest = [...availableEngineAssessments]"));
  assert.ok(backend.includes("Lectura basada en ${availableEngineAssessments.length}/${engineAssessments.length} motores con cobertura"));
});

test("withholds unavailable engine values without disabling their explanation", () => {
  assert.ok(backend.includes('className={`scenario ${assessment.available ? "active" : "withheld"}`}'));
  assert.ok(backend.includes('<b>{assessment.available ? assessment.score : "—"}</b>'));
  assert.ok(backend.includes('aria-haspopup="dialog"'));
  assert.ok(backend.includes('aria-controls="detail-dialog"'));
  assert.ok(backend.includes("showEngine(assessment.key, assessment.score, event.currentTarget)"));
  assert.ok(monitor.includes("if (trigger) detailReturnFocusRef.current = trigger"));
});

test("reports partial source coverage and explicit state counts", () => {
  assert.ok(backend.includes('className={`backend-live ${sourceHealthState}`}'));
  assert.ok(backend.includes('"COBERTURA PARCIAL"'));
  assert.ok(backend.includes('className="freshness-legend"'));
  for (const key of ["freshnessCounts.live", "freshnessCounts.lastKnownGood", "freshnessCounts.stale", "freshnessCounts.unavailable"]) {
    assert.ok(backend.includes(key), `missing source state count: ${key}`);
  }
});

test("source evidence links follow the actual provider and expose dates semantically", () => {
  assert.ok(backend.includes('<ul className="freshness-list">'));
  assert.ok(backend.includes("href={seriesSourceUrl(data, source.key)}"));
  assert.ok(!backend.includes('href={`https://fred.stlouisfed.org/series/${source.id}`}'));
  assert.ok(backend.includes('<time dateTime={source.observedAt ?? undefined}>'));
  assert.ok(backend.includes("sourceStatusLabel(source.status, lang)"));
  assert.ok(backend.includes("Abrir evidencia en una pestaña nueva"));
  assert.ok(monitor.includes('realGdpGrowth: "https://data.worldbank.org/indicator/NY.GDP.MKTP.KD.ZG?locations=US"'));
  assert.ok(monitor.includes('key === "yieldCurve") return "/api/data-manifest"'));
  assert.ok(monitor.includes('"https://www.cboe.com/us/indices/dashboard/spx/"'));
});

test("five engine cards remain balanced and keyboard focus stays visible", () => {
  assert.match(styles, /\.scenario-grid\.assessment-grid\{grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/);
  assert.match(styles, /\.assessment-grid \.scenario\{grid-column:span 2/);
  assert.match(styles, /\.assessment-grid \.scenario:nth-child\(n\+4\)\{grid-column:span 3\}/);
  assert.match(styles, /max-width:700px\).*\.assessment-grid \.scenario:last-child\{grid-column:1\/-1\}/);
  assert.match(styles, /\.freshness-list a:hover,\.freshness-list a:focus-visible/);
  assert.match(styles, /\.backend-links a:hover,\.backend-links a:focus-visible/);
});
