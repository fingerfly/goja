---
name: goja playwright workflow hardening
overview: Improve Goja’s Playwright CI workflow for reliability, faster feedback, and clearer failure diagnosis while preserving current local development behavior and TDD-first verification.
todos:
  - id: baseline-audit
    content: Audit current test workflow and Playwright config assumptions before changes.
    status: completed
  - id: tdd-config-guards
    content: Add or extend failing config unit tests first for any new CI behavior contracts.
    status: completed
  - id: workflow-hardening
    content: Apply workflow reliability improvements (concurrency, caching, artifact policy).
    status: completed
  - id: trigger-policy
    content: Finalize and encode unit/e2e trigger strategy (full and optional smoke/nightly).
    status: completed
  - id: full-regression
    content: Run unit, e2e, and full suite regression; resolve any failures before completion.
    status: completed
  - id: changelog-entry
    content: Update active CHANGELOG version block with today-dated workflow/testing improvements.
    status: completed
isProject: false
---

# Goja Playwright Workflow Improvement Plan

## Goal

Improve Playwright-based CI quality gates so they are more reliable and maintainable (fewer flaky failures, clearer diagnostics, and faster turnaround) while preserving existing local development behavior.

## Scope (Confirmed)

- Keep both `unit` and `e2e` jobs in CI.
- Preserve Chromium as CI browser target.
- Keep current CI hardening baseline (`retries` and `workers` behavior) and build incrementally.
- Use TDD-first for workflow/config logic changes where testable.

## Source of Truth

- Authoritative project path: `/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja`

## Target Files

- [.github/workflows/test.yml](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/.github/workflows/test.yml)
- [playwright.config.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/playwright.config.js)
- [tests/unit/playwright-config.test.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/unit/playwright-config.test.js)
- [tests/e2e/goja.spec.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/e2e/goja.spec.js)
- [CHANGELOG.md](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/CHANGELOG.md)

## Rules

All rules below are mandatory during implementation.

### 1.1 Strategy: Build-Fast-and-Fail-Fast

- Follow TDD: failing test/verification first where behavior is testable.
- Make atomic changes and run relevant tests immediately after each change.
- If a regression appears, fix it before proceeding.
- Use evidence from CI/test outputs, not assumptions.

### 1.2 CI and Playwright Rules

- Keep CI deterministic: pinned Node version and lockfile install path.
- Preserve CI-only resilience (`retries` and controlled worker count).
- Keep `forbidOnly` enabled on CI.
- Keep failure artifacts for Playwright (`playwright-report`, `test-results`).

### 1.3 Test Reliability Rules

- Prefer condition-based assertions over fixed sleeps in E2E.
- Avoid fragile viewport/style assumptions unless they represent stable product requirements.
- Maintain local-vs-CI behavior parity checks via unit tests for config.

### 1.4 Repository Hygiene Rules

- Do not add unnecessary files.
- Keep tests in dedicated `tests` folders.
- Update changelog with today’s date for release-relevant workflow/testing changes.

## Execution Plan (Phased, Atomic)

### Phase 1: Baseline and Failure-Surface Audit

- Re-read current workflow and Playwright config to capture baseline assumptions:
  - CI triggers and job layout in `test.yml`
  - Browser install strategy and timeout behavior
  - Reporter/trace/screenshot behavior in `playwright.config.js`
- Confirm existing config tests cover CI/local divergence and identify any missing assertions.

### Phase 2: TDD Guardrails for Config Behavior

- Extend config unit tests in `tests/unit/playwright-config.test.js` for any new workflow/config contracts introduced in later phases (for example reporter mode or CI flags if changed).
- Run targeted unit tests first and ensure expected red/green flow.

### Phase 3: Workflow Hardening Enhancements

- Improve `test.yml` for operational stability and speed:
  - Add/confirm concurrency policy to cancel outdated in-progress runs for the same branch/PR.
  - Add optional Playwright cache strategy (`~/.cache/ms-playwright`) keyed by lockfile and Playwright version.
  - Keep artifact upload on failure and verify retention policy is appropriate.
- Ensure changes do not reduce required test coverage gates.

### Phase 4: E2E Runtime Optimization Policy

- Define and apply a trigger policy that fits release cadence:
  - Keep unit on all push/PR events.
  - Keep full E2E on PR/main (or split smoke/full if chosen).
  - Optionally add manual/nightly route for extended browser coverage.
- If smoke/full split is adopted, codify tags and CI commands clearly.

### Phase 5: Regression Verification and Cleanup

- Run complete verification matrix after final workflow/config updates:
  - `npm run test:unit`
  - `npm run test:e2e`
  - `npm test`
- Re-run any targeted failing suites until stable.
- Remove temporary debug adjustments/logging if introduced.

### Phase 6: Changelog Update

- Document workflow and Playwright reliability improvements in the active version block of `CHANGELOG.md` using today’s date.
- Include what changed, why, and what test coverage verifies it.

## Test Cadence

- After each workflow/config atomic change:
  - run targeted unit checks for config behavior.
- After each phase that can affect E2E runtime:
  - run `npm run test:e2e`.
- Final gate before completion:
  - `npm run test:unit`
  - `npm run test:e2e`
  - `npm test`

## Risks and Mitigations

- **CI flake risk**: retain retries + failure artifacts; avoid brittle fixed-time assertions.
- **Runtime inflation risk**: apply cache/concurrency and optionally smoke/full split.
- **Coverage regression risk**: keep clear required gates for unit and E2E.
- **Config drift risk**: enforce CI/local behavior with unit tests.

## Acceptance Criteria

- CI runs consistently execute required unit and E2E checks without frequent non-actionable failures.
- Playwright browser setup in CI is reliable and diagnosable when failures occur.
- Workflow runtime is improved or unchanged with better reliability.
- Local development behavior remains unchanged.
- Full verification matrix passes (`test:unit`, `test:e2e`, `test`).
- Changelog accurately records the workflow and testing improvements.