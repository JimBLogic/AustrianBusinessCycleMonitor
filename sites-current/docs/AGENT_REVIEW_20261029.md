# ABCM focused agent review — 29 October 2026

Base: Sites 97, c6adde23804574cf699b8c74b56063beb2d75abc. Three agents reviewed bounded, separate areas; the owning release engineer reproduced/inspected their changes and ran the integrated build/tests. This is not a general audit or a claim of GitHub parity. No BrangeCycle source, process, data or deployment changed.

## Confirmed and repaired

1. Daily timer captured an `expired` value before noon. A tab open before the boundary issued GET when the timer fired instead of generating a gated POST. Expiration is now evaluated at callback time. Tests execute the actual effect before/after the boundary and its cleanup.
2. HTTP200 manual-cooldown with unchanged edition announced synchronization and created a comparison baseline. It now explicitly says the edition was retained, preserves the previous baseline, and records only the thirty-minute attempt deadline from attempt start. Preferences v1 remain compatible; an explicit null baseline is supported and malformed records are rejected.
3. A stored score could survive an input's age limit until the full edition reached 36 hours. Reads now conservatively withdraw the complete scored model if an actually used dependency expires, returning null scores, false readiness, zero model coverage/weight and `modelWithheldReason:input-expired`. Observations remain inspectable. No weights or historical scores are recalculated. Previously excluded inputs, gold context, stored BTC and valid-age backups do not independently withdraw the model. The originally used daily-vs-quarterly debt source is reconstructed at generation time.
4. Six-force Treasury context checked only the 10Y yield date, allowing an expired curve as its secondary value. Both observations now require valid age.
5. FRED decoder accepted duplicate CSV column IDs and duplicate ZIP member names before overwritten entries could be detected. Both ambiguities now fail closed.
6. fflate does not check ZIP CRC itself. The decoder now validates standard directory/local-header structure, lengths and CRC32 of selected CSV files. Existing limits stay at 8 MiB input/expanded CSV and 16 members. ZIP64, encrypted and multidisk archives fail closed. No new dependency or public upload route is introduced.

## Integrated evidence

238/238 tests PASS; zero failed or skipped. TypeScript, production build, artifact validation, lint and git diff --check PASS. New Worker/D1 tests cover expiry, original debt choice, unscored/backup exclusions, provisional-model exclusions and stale secondary curve. Decoder tests cover duplicate names/headers, altered CRC/length and unsupported ZIP formats. The retained real official FRED ZIP sample still decodes all five affected series.

## Production baseline checked during this review

The regular UI refresh under V97 generated edition 2026-10-29T12:18:27.599Z: macro 19/19 available and fresh. VIX was FRESH from Cboe, disclosed as DEGRADED backup rather than last-known-good. Only gold monthly context and VIX backup remained degraded immediately after refresh. Stored daily BTC health ages independently of the live pulse. This verifies V97 recovery, not sustained availability or a full HEALTHY aggregate.

## Limits

Conservative model withdrawal can temporarily hide otherwise valid components until a new edition; this is intentional rather than publishing an outdated composite. Complete mobile/physical reduced-motion QA remains unperformed. The daily automatic refresh still has no independent retry loop after a failed one-shot request; a subsequent normal page load or allowed user refresh can recover it. No claim of uptime, full WCAG, measured Web Vitals, security scan by an unavailable plugin, or full GitHub/Sites source parity is made.

Rollback reference: retain Sites checkpoint 97. Runtime credentials, schema, formulas, thresholds, provider promotion policy and refresh gates are unchanged.
