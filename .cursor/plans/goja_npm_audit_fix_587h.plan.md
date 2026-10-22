# goja — npm audit gate fix 2026-10 (vite / vitest / follow-redirects)

Status: done (2026-10-22) — commit `7d4ec3ca` pushed to `origin/main` (00_Mundo). Evidence below.

One paragraph: The 2026-10-22 posture review of npm packages found 9 advisories (3 high, 5 moderate, 1 low) across 3 dev-toolchain packages — vite 8.0.16, @vitest/mocker 4.1.11, follow-redirects 1.16.0 — published 2026-10-20/21, which fail the CI gate `npm audit --audit-level=moderate`. Fix is targeted in-range bumps (vite → 8.3.5, vitest → 4.1.12, follow-redirects → 1.16.1) plus raising the `follow-redirects` override floor off the vulnerable boundary; no product code, no release.

## Overview

| Key | Value |
|---|---|
| Project root | goja (single root package.json, no monorepo) |
| Modules touched | `package.json` (overrides only), `package-lock.json`, this plan |
| Deliverables | Audit gate green; 3 lockfile bumps; override floor fix; dead `rollup` override removed if confirmed unused |
| Storage/deploy | Dev toolchain only — nothing ships to users (vendored `exifr 7.1.3` is clean & latest, unchanged) |
| Version | No product version bump, no CHANGELOG (dev-dep security fix precedent) |
| WORK ID prefix | `goja_npm_audit_fix` |

## Success criteria

1. `npm audit --audit-level=moderate` exits 0, "found 0 vulnerabilities".
2. `npm ls vite vitest follow-redirects` shows vite 8.3.5, vitest + all `@vitest/*` 4.1.12, follow-redirects 1.16.1.
3. Unit tests pass (baseline 541/541 on 2026-10-14) and e2e pass (baseline 82/82); requirement is zero failures, not exact counts.
4. `git status` diff limited to `package.json`, `package-lock.json`, and this plan file; `js/vendor/` (vendored exifr) byte-unchanged.
5. This plan file existed in `.cursor/plans/` BEFORE any code change; status synced after delivery.
6. Changes committed to `main` and pushed; GitHub Test workflow (audit + unit + e2e) green.

**Non-goals:** major bumps (vitest 5, undici 8, jsdom 30, playwright 1.64 — Dependabot's job); non-advisory clean patches (qs 6.16.1, tough-cookie 6.0.2); CHANGELOG/product release; app-code security review.

## Locked decisions

| # | Topic | Decision | Rationale/source |
|---|---|---|---|
| 1 | vite target | 8.3.5 latest stable (in-range of `^8.0.16`; vitest peer allows `^8`) | User choice; inclusive advisory ranges have re-flagged older patched lines before (2026-10-14 lockfile history) |
| 2 | vitest target | 4.1.12 lockfile-only, range stays `^4.1.8` | Both @vitest/mocker advisories fixed exactly in 4.1.12; Oct 14 precedent |
| 3 | follow-redirects | Override floor `^1.16.0` → `^1.16.1` + lockfile 1.16.1 | Advisory range `>= 1.16.0 < 1.16.1` makes `^1.16.0` boundary-pinned-vulnerable — same trap as Oct 14 |
| 4 | Bump mechanics | Targeted `npm update vite vitest` + `npm install` reconcile. **No `npm audit fix`** | `npm audit fix` crashed under npm 10.9.2; targeted update is deterministic |
| 5 | rollup override | Remove `rollup: ^4.59.0` only if `npm ls rollup` is empty AFTER bumps (vite 8 uses rolldown) | Dead override = hygiene, reduces future boundary-pinning confusion; keep if anything re-adds it |
| 6 | Evidence source | Live `npm audit` output is authoritative; advisory-DB research (GHSA ids in appendix) is directional | Registry state moves daily; plan expectations may drift slightly in counts |
| 7 | e2e contingency | If Playwright browsers must download, set `PLAYWRIGHT_DOWNLOAD_HOST=https://cdn.npmmirror.com/binaries/playwright` | Playwright CDN slow on this machine |

## Work breakdown

- [x] 0. Write canonical plan (this file) — done first, before code.
- [x] 1. RED evidence: `npm audit --audit-level=moderate`; exit 1, 4 vulnerabilities (2 moderate, 2 high) — see Status & evidence.
- [x] 2. Edit `package.json`: override `follow-redirects` → `^1.16.1`.
- [x] 3. Bumps landed via explicit `npm install vite@8.3.5 vitest@4.1.12 --legacy-peer-deps` (npm update crashed — see deviation note); `npm ls` verified.
- [x] 4. `npm ls rollup` empty → `rollup` override removed, `npm install` reconciled, audit still clean.
- [x] 5. GREEN: audit 0 vulns (exit 0), unit 541/541, e2e 82/82 on re-run.
- [x] 6. Scope check passed: only package.json, package-lock.json, plan file; `js/vendor/` clean.
- [x] 7. Committed to `main` as `7d4ec3ca` and pushed to origin.
- [x] 8. CI clarified: standalone-repo workflow, triggered at next release deploy (no-release fix); local gate = verification of record. Plan synced.

## Acceptance gates

| Gate | Command | Expected |
|---|---|---|
| Audit gate | `npm run audit:check` | exit 0, "found 0 vulnerabilities" |
| Unit | `npm test` | all pass, 0 fail |
| E2E | `npm run test:e2e` | all pass, 0 fail |
| Full chain | `npm run security:verify` | exit 0 end-to-end |

## Verification matrix

| # | Scenario | Expected |
|---|---|---|
| 1 | Audit before fix (step 1) | exit 1; high on vite + follow-redirects |
| 2 | Audit after fix | exit 0, 0 vulnerabilities |
| 3 | `npm ls follow-redirects` | 1.16.1 via http-proxy chain, override satisfied |
| 4 | `npm ls vite` (root + vitest peer) | single deduped 8.3.5 |
| 5 | `npm ls vitest @vitest/mocker` | 4.1.12 everywhere |
| 6 | Unit + e2e regression | zero failures vs baseline |
| 7 | Diff scope + `js/vendor/exifr.mjs` | only package.json/package-lock.json/plan; vendor file unchanged |
| 8 | GitHub CI on push | Test workflow audit+unit+e2e jobs green |

## Rollback

`git checkout -- package.json package-lock.json && npm ci` — restores the 2026-10-14 lockfile state (which passed the gate before these advisories published). No data migration involved; no server state. GitHub-side rollback = revert the commit; Pages deploys only from tested commits.

## Appendix — findings traceability

| F-ID | Finding | GHSA / source | Fix landing |
|---|---|---|---|
| F1 | vite 8.0.16: launch-editor fs-check bypass RCE (high, Windows) | GHSA-587h-7wmj-h5pm | → 8.3.5 |
| F2 | vite: fs.allow bypass (non-Windows path match) | GHSA-rq7h-c2jc-7f22 | → 8.3.5 |
| F3 | vite: launch-editor CLI-flag injection | GHSA-r825-w8mm-5pxw | → 8.3.5 |
| F4 | vite: launch-editor `%` escaping (Windows) | GHSA-698v-4r3x-3vcv | → 8.3.5 |
| F5 | vite: cross-origin exec via custom middleware (low, below gate) | GHSA-9jrq-w75r-8gcw | → 8.3.5 (cleared incidentally) |
| F6 | @vitest/mocker: WS mock-registration code injection | GHSA-qxg6-89mg-rqv8 | → vitest 4.1.12 |
| F7 | @vitest/mocker: backslash traversal bypass of 4.1.11 fix | GHSA-xp26-3454-mjgp | → vitest 4.1.12 |
| F8 | follow-redirects: array-header credential leak (high) | GHSA-q3jh-wrc6-jgq8 | → 1.16.1 + override floor |
| F9 | follow-redirects: sensitiveHeaders regex leak (high) | GHSA-8r9p-f939-6h3c | → 1.16.1 + override floor |

Skipped lens: runtime/app-code security review — out of scope; npm dependency posture only (prior app-level plans `goja_security_audit_fixes_eaaa6402`, `goja_security_risk_fixes_e9eeb9b0` remain the record).

## Status & evidence

| Step | Result |
|---|---|
| 0. Canonical plan first | This file written before any code change (2026-10-22). |
| 1. RED | `npm audit --audit-level=moderate` exit 1: "4 vulnerabilities (2 moderate, 2 high)" — @vitest/mocker ×2 (GHSA-qxg6-89mg-rqv8, GHSA-xp26-3454-mjgp), follow-redirects ×2 high (GHSA-q3jh-wrc6-jgq8, GHSA-8r9p-f939-6h3c), vite ×5 (all five appendix GHSA ids, incl. low F5). Matches advisory-DB research exactly. |
| 2. Override floor | `follow-redirects` `^1.16.0` → `^1.16.1`. |
| 3. Bumps | **Decision 4 deviation:** `npm update vite vitest` and `npm install vite@… vitest@…` both crashed with npm 10.9.2 + overrides internal error ("Cannot read properties of null (reading 'edgesOut')"); `--legacy-peer-deps` cleared it. Explicit install wrote ranges `vite ^8.3.5`, `vitest ^4.1.12` into package.json (vitest range NOT lockfile-only as decision 2 assumed — deliberate floor documents the security minimum, per SECURITY.md "bumped deliberately"). `npm ls`: vite 8.3.5 single deduped copy, vitest + @vitest/mocker 4.1.12, follow-redirects 1.16.1 overridden. |
| 4. rollup override | `npm ls rollup` → "(empty)" → removed; lockfile reconciled; audit still exit 0. |
| 5. GREEN | audit: "found 0 vulnerabilities" exit 0. Unit: 52 files / **541/541** passed (exit 0). E2E: **82/82** passed (exit 0). First e2e run: 80/82 — the two export-reopen-after-blob-tab tests failed under full parallel load; passed in isolation (13.4s) and in the full re-run → load flake, not a dep regression (e2e path is http-server + playwright 1.60.0, untouched by this bump). |
| 6. Scope | `git status` = package.json, package-lock.json, plan file only; `js/vendor/` untouched. Lockfile diff inspected: only rolldown WASM-binding churn + expected version moves, no unexpected packages. |
| 7. Commit | `7d4ec3ca` on main (3 files, 286+/264−), pushed; HEAD == origin/main == `7d4ec3ca`. |
| 8. CI note | goja's GitHub Test workflow lives in the **standalone `fingerfly/goja` repo** (deploy.js clones/copies there; DEFAULT_REMOTE `git@github.com:fingerfly/goja.git`). Monorepo push does not trigger it, and this fix is deliberately no-release — so the local gate run (identical commands) is the verification of record. The standalone CI + weekly sweep will exercise the new tree at the next release deploy. |

### Follow-up same day: shipped to standalone as 10.2.13 (3)

| Step | Result |
|---|---|
| Release (2) | `npm run deploy -- build` → standalone `039e5a3` "Release v10.2.13 (2)"; monorepo `781be02a`. Standalone tree had been stale since before Sep 10 (sweeps red every Monday since Sep 14, all failing at the audit step on the stale lockfile). |
| CI failure (2) | Test run #169: audit ✓, unit ✓, e2e ✗ — `npx playwright install --with-deps chromium` exit 1 in ~1s. First-ever install attempt on the **ubuntu-26 runner rollout** (began 2026-10-19); earlier runs that reached this step were all on 24.04. |
| Fix | Pinned e2e (test.yml) and sweep (security-sweep.yml) jobs to `runs-on: ubuntu-24.04`; contract tests 6/6 green; monorepo `08a78e15`. |
| Release (3) | `npm run deploy -- build` → standalone `f424298` "Release v10.2.13 (3)". Test run #170 **success** (audit+unit+e2e), Deploy run #152 **success**, live manifest at fingerfly.github.io/goja reports "10.2.13 (3)". Monorepo `ccbcb676`. |
| Sweep outlook | Monday 2026-10-26 sweep runs against the clean tree on the pinned image — expected green, ending the red streak. |
