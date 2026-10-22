---
name: Goja Dependabot devDependency security (2026-08)
overview: Clear GitHub Dependabot high alerts on transitive postcss/undici by bumping npm overrides and lockfile; skip versioned deploy (no product release).
todos:
  - id: bump-overrides
    content: "Bump package.json overrides: postcss ^8.5.26, undici ^7.29.0; refresh package-lock.json"
    status: completed
  - id: verify-audit-tests
    content: "Prove-done: npm audit (0), npm test, npm run test:e2e"
    status: completed
  - id: changelog-unreleased
    content: "Document Security + Tests under CHANGELOG [Unreleased] (no version cut)"
    status: completed
  - id: commit-push
    content: "User-gated: commit + push package.json, package-lock.json, CHANGELOG.md so CI/Dependabot clear"
    status: completed
  - id: no-pages-release
    content: "Locked: skip npm run deploy / version bump; no product release for this upgrade"
    status: completed
isProject: false
---

# Goja Dependabot devDependency security (Jul 28–Aug 4 digest)

## Objective

Clear GitHub security alerts for **transitive npm high** advisories
(`postcss`, `undici`) without treating them as a user-facing product
release.

## Scope

### In scope

- `package.json` `overrides` + `package-lock.json` refresh
- Local/CI prove-done: `npm audit`, unit, E2E
- `CHANGELOG.md` under `[Unreleased]`
- Commit/push when the user asks (clears Dependabot / unblocks CI audit)

### Out of scope / non-goals

- Changing shipped PWA sources under `js/`, `css/`, `index.html`, `sw.js`
- Version bump via `upgrade-version` or `npm run deploy`
- Marketing/release commit subject (`goja: release X.Y.Z`)
- Reworking historical app-security plans
  (`goja_security_risk_fixes_e9eeb9b0.plan.md`,
  `goja_security_audit_fixes_eaaa6402.plan.md`)

## Locked decisions

1. **Goja is a static PWA**, not a Go binary. Alerts are npm
   **devDependency** transitive packages (Vite/Vitest/jsdom tooling).
2. **No product release required** for end-user security. Runtime
   pages do not load `postcss` or `undici`. Policy SSOT:
   [SECURITY.md](../../SECURITY.md) (“What Ships to Users”).
3. **Required operator action**: commit + push the three files so
   `main` CI `npm audit --audit-level=moderate` stays green and
   Dependabot can auto-dismiss (suggested update #23 and siblings).
4. **Do not** run `npm run deploy -- patch|minor|major|build` for
   this change alone. That script bumps marketing/build version —
   noise without a user-visible fix.
5. **CI Pages after push is OK**: `.github/workflows/deploy.yml`
   may republish the same app version after Test on `main`
   (copies HTML/CSS/JS + CHANGELOG). That is not a versioned
   release and is not required for the advisory fix itself.
6. Optional later: fold the `[Unreleased]` Security note into the
   next real product release CHANGELOG when that release ships.
7. Working directory for all commands: goja project root
   (`…/project/goja`).

## Evidence (repo)

| Finding | Evidence |
| --- | --- |
| Alert packages | `npm audit`: postcss ≤8.5.22; undici 7.0.0–7.28.0 |
| Patched pins | overrides `postcss ^8.5.26`, `undici ^7.29.0`; lock resolves 8.5.26 / 7.29.0 |
| Not in runtime bundle | No `postcss`/`undici` imports under `js/`, `index.html`, `sw.js` |
| Ship policy | `SECURITY.md` — Node/Playwright/Vitest not served |
| Versioned deploy | `scripts/deploy.js` bumps version then pushes |
| CI Pages | `deploy.yml` after Test on `main`; no SemVer bump |

## Architecture / files touched

No new modules. Supply-chain pins only:

- `package.json` — `overrides.postcss`, `overrides.undici`
- `package-lock.json` — resolved trees
- `CHANGELOG.md` — `[Unreleased]` Security + Tests
- This plan — closeout SSOT

## Phases (TDD note)

Pure dependency/governance change: **TDD for product code N/A**.
Verification is audit + existing suites (characterization of “still
green”), not new unit tests for override strings.

### Phase A — Pin (done)

1. Raise overrides above advisory ceilings.
2. `npm install` to refresh lockfile.
3. Confirm `npm ls` shows `postcss@8.5.26`, `undici@7.29.0`.

### Phase B — Prove (done)

```powershell
npm run audit:check
npm test
npm run test:e2e
```

Success signals: audit `found 0 vulnerabilities`; Vitest all pass;
Playwright all pass.

### Phase C — Docs (done)

`CHANGELOG.md` `[Unreleased]` Security entry naming GHSA ids and
override versions; Tests subsection with counts.

### Phase D — Land (done)

Committed + pushed:

- `package.json`, `package-lock.json`, `CHANGELOG.md`, this plan
- Subject: `chore(goja): pin postcss and undici overrides for Dependabot highs`
- Not a release subject; no `npm run deploy` SemVer bump

CI Test on `main` clears audit; Deploy may refresh Pages at the same
marketing version (acceptable).


## Publish decision (answer)

**Shall we build and publish because of this security upgrade?**

**No versioned product release.** Reasons:

1. Patched packages never reach end-user browsers.
2. App sources and vendored `js/vendor/exifr.mjs` are unchanged by
   the override bump.
3. `npm run deploy` would bump version without a user-visible fix.

**Do** commit + push the lockfile/overrides so alerts and CI clear.
CI may refresh Pages as a side effect; that is not a marketing
release.

## Risks

| Risk | Mitigation |
| --- | --- |
| Parent packages reintroduce old transitive | Keep overrides until upstream bumps; weekly Dependabot + security-sweep |
| Operator runs `npm run deploy` by habit | Locked decision #4; README deploy is for product releases |
| Uncommitted fix leaves CI red / alerts open | Phase D commit/push |

## Registry

- No `WORK.md` / PORTFOLIO row for goja in this workspace — N/A (L14).
- No master plan for goja — standalone child plan.
- Related completed (different scope): app audit plans above; do not
  reopen.

## Done when

- [x] Overrides + lockfile on patched versions; `npm audit` → 0
- [x] `npm test` and `npm run test:e2e` pass after refresh
- [x] CHANGELOG `[Unreleased]` documents Security (not a dated release)
- [x] Plan locks **no versioned deploy** for this upgrade
- [x] User commits/pushes the three files (+ plan closeout)

## Prove-done commands (PowerShell, cwd = goja root)

```powershell
npm run audit:check
npm test
npm run test:e2e
```
