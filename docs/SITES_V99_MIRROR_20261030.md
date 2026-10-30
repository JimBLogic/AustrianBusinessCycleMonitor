# ABCM Sites v99 mirror — 30 October 2026

Sites v99 is published at https://austrian-business-cycle-monitor.jimblogic.chatgpt.site .
This mirror includes the accumulated maintained-source changes since v92.

| Evidence | Value |
| --- | --- |
| Sites source commit | `478fc2e87f4ce240131fa145d5fda76703eed238` |
| Source root = GitHub sites-current subtree | `8370097bb12366515e3fc4f7423f3300057984bc` |
| Saved version | `appgprj_6a630a89bf208191bc7915a9410ae47a~appgver_8179f727f5548191b2c8cad06d1626ce` |
| Deployment | `appgdep_6ae437852da48191bd05cceefbcaa327` — succeeded |
| Archive content hash | `sha256:e3cc8ff139a3893cafb47543f237a723c5a953d91935a8144d815e37263f555e` |
| Application tests | 246 passed |
| Checks | TypeScript, production build, artifact validation, lint passed |
| Automation | 41 tests passed; isolation scanned 109 files, no runtime coupling detected |
| Full lock audit | 0 high, 0 critical, 4 moderate |
| Rollback | Sites v98, source `ae28aaab634b83403ac687c3519acef95310f934` |

Git tree equality proves tracked paths, bytes and modes for all 223 source files.
It does not prove equality of production data, runtime secrets or a separate
GitHub-built deployment artifact. The native Sites version links the pushed
source and the archive built locally from that source.

Daily automatic retries have a three-attempt per-mounted-window budget, minimum
five-minute post-completion spacing, server deadline handling and abort cleanup.
The agent reproduced and fixed a lost deadline on same-window effect restart.
The server gate remains authoritative across tabs/reloads.

Local self-host smoke is **blocked**, not passed: disposable local D1 migration
succeeded, then Wrangler failed with uv_interface_addresses in this executor.
Managed preview and the deployed Site serve successfully. CI should repeat the
maintained app, Docker/self-host and browser checks in its own runtime.
Remaining moderate dependencies: @vercel/og, satori, vinext, fast-uri.

No production D1 manual writes/schema changes, runtime secret/audience changes,
BrangeCycle edits or workflow changes are included. master was unprotected when
read; required-check enforcement has not been configured by this work.

## Merge and rollback
Review this exact mirror commit and maintained-source CI; do not interpret legacy
root-stack failures as approval of that stack. Merge requires separate explicit
authorization under the user's original release restriction. A mirror merge
does not itself publish Sites. Do not redeploy unless a new change is intended.
After any future deployment verify release, API health, values/dates/provenance,
model coverage, assets, ES/EN and cooldown without forced duplicate generation.
If functional regression occurs, deploy saved v98:
`appgprj_6a630a89bf208191bc7915a9410ae47a~appgver_b94ecb2d485c81918a20226b3d34815c`,
then repeat smoke checks. No data rollback is implied.
