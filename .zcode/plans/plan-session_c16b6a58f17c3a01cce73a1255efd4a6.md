# goja — npm audit gate fix 2026-10 (vite / vitest / follow-redirects)

One paragraph: The weekly posture review of npm packages found 9 advisories (3 high, 5 moderate, 1 low) across 3 dev-toolchain packages — vite 8.0.16, @vitest/mocker 4.1.11, follow-redirects 1.16.0 — published 2026-10-20/21, which will fail the CI gate `npm audit --audit-level=moderate`. Fix is targeted in-range bumps (vite → 8.3.5, vitest → 4.1.12, follow-redirects → 1.16.1) plus raising the `follow-redirects` override floor off the vulnerable boundary; no product code, no release.

## Overview

| Key | Value |
|---|---|
| Project root | goja (single root package.json, no monorepo) |
| Modules touched | `package.json` (overrides only), `package-lock.json`, `.cursor/plans/` (canonical plan) |
| Deliverables | Audit gate green; 3 lockfile bumps; override floor fix; dead `rollup` override removed if confirmed unused |
| Storage/deploy | Dev toolchain only — nothing ships to users (vendored `exifr 7.1.3` is clean & latest, unchanged) |
| Version | No product version bump, no CHANGELOG (dev-dep security fix precedent) |
| Plan file | `.cursor/plans/goja_npm_audit_fix_587h.plan.md` (WORK ID prefix `goja_npm_audit_fix`) |

## Success criteria

1. `npm audit --audit-level=moderate` exits 0, "found 0 vulnerabilities".
2. `npm ls vite vitest follow-redirects` shows vite 8.3.5, vitest + all `@vitest/*` 4.1.12, follow-redirects 1.16.1.
3. Unit tests pass (baseline 541/541 on 2026-10-14) and e2e pass (baseline 82/82); requirement is zero failures, not exact counts.
4. `git status` diff limited to `package.json`, `package-lock.json`, and the canonical plan file; `js/vendor/` (vendored exifr) byte-unchanged.
5. Canonical plan file exists in `.cursor/plans/` BEFORE any code change; status synced there after delivery.
6. Changes committed to `main` and pushed; GitHub Test workflow (audit + unit + e2e) green.

**Non-goals:** major bumps (vitest 5, undici 8, jsdom 30, playwright 1.64 — Dependabot's job); non-advisory clean patches (qs 6.16.1, tough-cookie 6.0.2); CHANGELOG/product release; app-code security review.

## Locked decisions

| # | Topic | Decision | Rationale/source |
|---|---|---|---|
| 1 | vite target | 8.3.5 latest stable (in-range of `^8.0.16`; vitest peer allows `^8`) | User choice; inclusive advisory ranges have re-flagged older patched lines before (2026-10-14 lockfile history) |
| 2 | vitest target | 4.1.12 lockfile-only, range stays `^4.1.8` | Both @vitest/mocker advisories fixed exactly in 4.1.12; Oct 14 precedent |
| 3 | follow-redirects | Override floor `^1.16.0` → `^1.16.1` + lockfile 1.16.1 | Advisory range `>= 1.16.0 < 1.16.1` makes `^1.16.0` boundary-pinned-vulnerable — same trap as Oct 14 (memory: npm audit gate) |
| 4 | Bump mechanics | Targeted `npm update vite vitest` + `npm install` reconcile. **No `npm audit fix`** | `npm audit fix` crashed under npm 10.9.2 (memory: needs `--legacy-peer-deps`); targeted update is deterministic |
| 5 | rollup override | Remove `rollup: ^4.59.0` only if `npm ls rollup` is empty AFTER bumps (vite 8 uses rolldown) | Dead override = hygiene, reduces future boundary-pinning confusion; keep if anything re-adds it |
| 6 | Evidence source | Live `npm audit` output is authoritative; advisory-DB research (GHSA ids below) is directional | Registry state moves daily; plan expectations may drift slightly in counts |
| 7 | e2e contingency | If Playwright browsers must download, set `PLAYWRIGHT_DOWNLOAD_HOST=https://cdn.npmmirror.com/binaries/playwright` | Memory: Playwright CDN slow on this machine |

## Work breakdown

- [ ] 0. Write canonical plan to `.cursor/plans/goja_npm_audit_fix_587h.plan.md` (this content, repo-relative paths).
- [ ] 1. RED evidence: run `npm audit --audit-level=moderate`; record findings + exit 1 in plan file. Expected: vite ×5 (1 high GHSA-587h-7wmj-h5pm + 3 moderate + 1 low), @vitest/mocker ×2 (GHSA-qxg6-89mg-rqv8, GHSA-xp26-3454-mjgp), follow-redirects ×2 high (GHSA-q3jh-wrc6-jgq8, GHSA-8r9p-f939-6h3c).
- [ ] 2. Edit `package.json`: override `follow-redirects` → `^1.16.1`.
- [ ] 3. `npm update vite vitest`, then `npm install` (reconcile override → follow-redirects 1.16.1). Verify with `npm ls vite vitest follow-redirects` against Success criterion 2.
- [ ] 4. `npm ls rollup`: empty → delete `rollup` override line, `npm install` again; non-empty → keep, note in plan.
- [ ] 5. GREEN: `npm run security:verify` (audit gate + unit + e2e). Playwright contingency per decision 7.
- [ ] 6. Scope check: `git status` / `git diff --numstat` — only `package.json`, `package-lock.json`, plan file; `git status js/vendor/` clean. Mismatch → stop and investigate.
- [ ] 7. Commit to `main` (style per Oct 14 precedent: `goja: clear npm audit gate — vite 8.3.5, vitest 4.1.12, follow-redirects 1.16.1`) and push.
- [ ] 8. Watch GitHub Test workflow to green; tick plan checkboxes with evidence; final plan review pass.

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

`git checkout -- package.json package-lock.json && npm ci` — restores Oct 14 lockfile state (which passed the gate before these advisories published). No data migration involved; no server state. GitHub-side rollback = revert the commit; Pages deploys only from tested commits.

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