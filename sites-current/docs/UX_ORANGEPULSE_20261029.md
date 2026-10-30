# ABCM — Mobile-first and OrangePulse candidate

Date: 29 October 2026. Base Sites source: c7d9374d88ad3ae3e5d2369bd832ffc5996d1de0 (saved version 92). Save-only work; no production deployment, external GitHub changes, production POST, database migration or BrangeCycle access.

## Implemented

- Shared OrangePulse client effect in `app/OrangePulse.tsx`, mounted once in the root layout. A single transparent, pointer-inert fixed perimeter layer uses #F7931A tokens. A click/change starts a 400 ms opacity envelope with a 140 ms rise and 260 ms fade. The functional action is never intercepted or delayed. New activations replace the previous animation; scrolling/resizing cancels stale coordinates. Disabled/inert controls are ignored. Reduced motion gets a 180 ms static signal without an animation. Timers, listeners, animation and layer are removed on unmount.
- `app/interaction.css` preserves the existing light identity and dark data panels; adds independent focus-visible feedback, minimum 44 px sizes for the language/menu/horizon/scrubber controls, safe-area padding, dynamic viewport limits, one-column metrics and market cards at <=380 px, and wrapping chart labels/controls. At 768 px, the old full nav had only about 1 px between branding and links: the compact menu now extends through 1000 px, and its JS resize threshold matches.
- Root viewport supports device width and viewport-fit=cover without disabling zoom.
- Chart geometry is memoized by observations/horizon and the chart component is memoized. Cursor inspection no longer rebuilds geometry on every cursor change. Clock updates occur every minute except during the visible manual cooldown (every second); hidden tabs stop that display clock and resume immediately on return. Provider polling, refresh admission, data contracts, formulas, weights and persistence are unchanged.
- No dependencies added or upgraded. No telemetry, third-party service or global theme switch added.

## Validation and limits

ESLint, TypeScript and the final production build passed. The final application/Worker/D1 suite completed with 216/216 tests passing, zero failures and zero skipped, including eight new behavioral cases. New tests execute the actual OrangePulse effect with DOM/animation doubles and the actual clock effect with fake timers: activation, disabled/inert controls, repeated pulses, scroll cancellation, reduced motion, cleanup, cooldown expiry and hidden-tab recovery. They are not device tests.

The managed Chromium preview rendered layouts at inner widths 320, 390, 768, 1024 and 1364 px, plus 844 px in landscape (355 px inner height). No horizontal document overflow was observed at those widths. Requested 1440/2560/3840 windows were capped by the browser at 1364; those larger sizes are NOT TESTED. At 320 px, language and menu controls measured 44 px high and horizon buttons 44 px high. At 768 px, the compact menu is visible and the expanded nav is hidden.

**Update: initial hydration cause repaired.** `worker/index.ts` previously forced HTTPS upgrades on the managed HTTP preview hostname. The existing loopback exception did not include `terminal.local`. A Vite `import.meta.env.DEV`-guarded exception now handles only that exact HTTP development host. Public HTTPS and all production builds retain forced upgrades, including production requests claiming `terminal.local`. Frame, script, connect, object and other security directives are unchanged. A new behavioral regression exercises development/public/lookalike hosts; the actual built Worker is also tested for HTTP/HTTPS terminal.local.

After this repair, the browser changed ES/EN successfully and mounted exactly one OrangePulse layer. Its transparent center, pointer-events:none, perimeter shadow and target-sized dimensions were observed. Graph tab selection responded to ArrowRight (CPI to oil); focus transfer was not confirmed before the environment changed. Remaining QA was interrupted when the shared preview URL began serving BrangeCycle instead of ABCM. Testing stopped immediately; no BrangeCycle action, source change or deployment was performed.

Status remains DEGRADED for complete integrated QA: mobile menu, fully confirmed keyboard focus, chart inspection and live reduced-motion verification still need an ABCM-dedicated preview. A synthetic 52-point M2 fixture was inserted only in the ignored local preview D1 for chart testing; it is not official data, is not packaged and never reached production. Public API download for a real local fixture returned 403. No production POST or D1 write was performed.

The browser has no supported reduced-motion or device-emulation controls exposed here; reduced motion was verified in behavioral tests, not as an OS/device setting. Light surfaces/dark panels were retained; there is no pre-existing site-wide dark-mode selector to certify. No physical iOS/Android, Safari/Firefox, console, screen-reader, complete WCAG audit, measured INP/CLS/LCP or sustained 60 FPS claim is made. Structural reductions in work are not a measured Core Web Vitals improvement.

Build cleanliness: the build wrapper now preserves previous generated output under ignored `.sites-runtime` before producing a fresh `dist`. A deliberately seeded obsolete asset and the former temporary QA page were absent after the successful build/test run. Runtime backups and local D1 are excluded from lint and packaging; application source remains linted. The archive is inspected before saving.

## Publication gate

Keep this candidate saved without deployment. Before publication, verify hydration and the affected interactions in a functioning browser environment, test the compact menu at 320/390/768 px, chart pointer/keyboard/range behavior, reduced motion and any newly supported larger viewports. Preserve saved version 92 and its archive as the production rollback reference. Synchronizing GitHub requires separate explicit authorization under the current request.
