# Mandatory ABCM master protection: ready for administrator activation

Status on 20 October 2026: **PREPARED, NOT ACTIVATED**. This file and its JSON
are not a substitute for a rule saved in GitHub repository settings.

The connected GitHub installation returns HTTP 403 for branch protection and
does not provide administrative rule writes. Plugin discovery found only the
already installed GitHub integration. No GitHub CLI credential is available in
this execution environment. Do not create a workflow that requests a personal
administrator token or attempt to use Actions' limited GITHUB_TOKEN as an
administration credential.

## Exact configuration

Use the adjacent `master-protection.ruleset.json` for
`JimBLogic/AustrianBusinessCycleMonitor` only:

- Active branch ruleset for `refs/heads/master`, with no bypass actors.
- Require a pull request; zero approving reviews so a solo maintainer can still
  merge a passing PR. Resolve review threads and update against current master.
- Require the exact existing check **isolation**, from **GitHub Actions**,
  integration ID **15368**. These identifiers were read from master's real check
  runs, not inferred from a workflow title.
- Block branch deletion and force-pushes.

The isolation workflow runs for every master PR and push, without path filters.
Historical lint/security jobs remain independently failing and their image
publication remains blocked. They are not silently removed or declared clean;
making unrelated failing legacy checks mandatory would lock every maintained
Site change. Maintained Site behavior changes retain their existing CI/browser
gates.

## Administrator activation

Open https://github.com/JimBLogic/AustrianBusinessCycleMonitor/settings/rules .
Import/create the branch ruleset, inspect every setting above and save it active.
Alternatively, an already authorized administrator may POST the JSON to
`/repos/JimBLogic/AustrianBusinessCycleMonitor/rulesets` using an existing
GitHub session/credential with repository Administration write access. Do not
place that credential in source, a prompt, workflow secrets or an attachment.

## Required readback and enforcement proof

1. Read the saved ruleset ID and verify active enforcement, exact master scope,
   no bypasses, the PR rule and required `isolation` check tied to app 15368.
2. Confirm `/repos/JimBLogic/AustrianBusinessCycleMonitor/rules/branches/master`
   includes those active rules. Do not treat the JSON file or a successful CI
   run alone as proof of protection.
3. On a disposable PR branch, make a harmless fixture that the isolation checker
   rejects. Verify GitHub blocks integration. Never attempt a destructive write
   or force-push to master as a test. Revert the fixture on that branch and
   confirm the normal passing route remains available.
4. Record the rule ID and enforcement evidence here before calling this closed.

Activation changes repository settings; it does not deploy ABCM or BrangeCycle.

References:
- https://docs.github.com/en/rest/repos/rules#create-a-repository-ruleset
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets
