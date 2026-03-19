---
name: deploy-cross-platform-remote-plan
overview: Harden Goja deploy for cross-platform use by replacing hardcoded SSH remote with configurable remote selection, adding preflight checks, and validating behavior through TDD-first tests with fast-build-quick-fail gates.
todos:
  - id: tdd-remote-contract
    content: Add failing deploy unit tests for remote resolution and preflight failure contract.
    status: completed
  - id: implement-remote-resolver
    content: Implement GOJA_DEPLOY_REMOTE override, protocol-agnostic safety checks, and fail-fast preflight in deploy.js.
    status: completed
  - id: docs-cross-platform-deploy
    content: Document cross-platform deploy usage and auth options in README.
    status: completed
  - id: full-validation-gates
    content: Run full tests, diagnostics, and cloc gates; fix any failures before completion.
    status: completed
isProject: false
---

# Cross-Platform Deploy Hardening Plan

## Goal

Make deploy reliable across macOS and Windows by removing single-protocol remote assumptions in deploy flow while preserving current release behavior.

## Targeted Scope

- Keep existing release sequence (version bump -> sync -> deploy repo commit/push).
- Replace hardcoded remote dependency with configurable remote source.
- Add OS-aware default remote selection:
  - Windows default: HTTPS remote.
  - macOS default: SSH remote.
- Add fail-fast diagnostics before expensive steps.
- Prevent partial local mutations when remote/auth preflight fails.
- Keep script behavior backward compatible for your existing macOS workflow.

Primary files:

- [C:/Projects/00_Mundo/02product/01_coding/project/goja/scripts/deploy.js](C:/Projects/00_Mundo/02product/01_coding/project/goja/scripts/deploy.js)
- [C:/Projects/00_Mundo/02product/01_coding/project/goja/tests/unit/deploy.test.js](C:/Projects/00_Mundo/02product/01_coding/project/goja/tests/unit/deploy.test.js)
- [C:/Projects/00_Mundo/02product/01_coding/project/goja/README.md](C:/Projects/00_Mundo/02product/01_coding/project/goja/README.md)

## Battlefield-Tested Coding Rules Applied

- TDD first: write failing tests for each behavior change before implementation.
- Evidence-based debugging: validate with command outputs and test assertions, not assumptions.
- Keep codebase clean: no unnecessary files; extend existing script/tests.
- Maintainability gate: run `cloc` and keep new/modified logical units small and focused (target <100 SLOC per new helper).
- Full validation before claiming done: run full unit + regression/integration/e2e suites used by this project.
- Mobile/cross-platform mindset: for tooling scripts, explicitly verify platform-dependent assumptions (paths, env vars, auth protocol).

## Development Strategy (Fast-Build-Quick-Fail)

1. **Slice 1: contract tests first (quick fail)**
  - Add failing unit tests for remote resolution order and compatibility.
  - Add failing tests for clear preflight failure messages when remote/auth is invalid.
  - Add failing tests that assert deploy exits before version bump when preflight fails.
2. **Slice 2: smallest implementation**
  - Implement remote resolver in `deploy.js`:
    - `GOJA_DEPLOY_REMOTE` env override (highest priority).
    - OS-aware default when override is unset (Windows -> HTTPS, macOS -> SSH).
    - explicit fallback default for unknown OS (SSH to preserve existing behavior).
  - Keep all path handling via `path.join` and temp env vars (already cross-platform-safe).
3. **Slice 3: preflight hardening**
  - Move preflight earlier to run before version bump side effects.
  - Add explicit early validation (`git ls-remote <remote> HEAD`) before clone/pull.
  - Fail with actionable message indicating SSH vs HTTPS auth mismatch.
4. **Slice 4: docs + validation gates**
  - Update `README.md` deploy section with cross-platform examples (SSH and HTTPS).
  - Include shell-specific env examples (PowerShell, CMD, bash/zsh) for `GOJA_DEPLOY_REMOTE`.
  - Validate copy-paste command syntax on each shell with non-destructive checks first (no accidental deploy during syntax validation).
  - Run complete test matrix and `cloc`; stop on first failure and fix before continuing.

## Implementation Details

- In `deploy.js`:
  - Replace fixed `REMOTE` usage with resolved remote helper.
  - Add OS detection helper (`process.platform`) to select default remote by OS.
  - Keep safety check strict and protocol-agnostic by normalizing known URL shapes and matching exact owner/repo (`fingerfly/goja`).
  - Add preflight helper to test remote reachability and produce explicit error guidance.
  - Ensure preflight runs before `upgrade-version` so failed auth/network does not modify project files.
- In `deploy.test.js`:
  - Add tests for env override and fallback behavior.
  - Add tests for OS-based default remote selection (`win32`, `darwin`, unknown fallback).
  - Add tests that verify clone command uses resolved remote.
  - Add tests for preflight failure messaging and abort behavior.
  - Add regression test ensuring no call to upgrade-version when preflight fails.
- In `README.md`:
  - Document OS-aware defaults clearly:
    - Windows default remote: `https://github.com/fingerfly/goja.git`
    - macOS default remote: `git@github.com:fingerfly/goja.git`
  - Document optional env var usage:
    - SSH: `GOJA_DEPLOY_REMOTE=git@github.com:fingerfly/goja.git`
    - HTTPS: `GOJA_DEPLOY_REMOTE=https://github.com/fingerfly/goja.git`
  - Add Windows examples:
    - PowerShell: `$env:GOJA_DEPLOY_REMOTE='https://github.com/fingerfly/goja.git'; npm run deploy -- patch`
    - CMD (single command): `cmd /C "set GOJA_DEPLOY_REMOTE=https://github.com/fingerfly/goja.git && npm run deploy -- patch"`
    - CMD (session variable): `set GOJA_DEPLOY_REMOTE=https://github.com/fingerfly/goja.git` then `npm run deploy -- patch`
  - Add Unix shell examples:
    - bash/zsh (single command): `GOJA_DEPLOY_REMOTE=https://github.com/fingerfly/goja.git npm run deploy -- patch`
    - bash/zsh (session variable): `export GOJA_DEPLOY_REMOTE=https://github.com/fingerfly/goja.git && npm run deploy -- patch`
  - Add SSH fallback examples:
    - PowerShell: `$env:GOJA_DEPLOY_REMOTE='git@github.com:fingerfly/goja.git'; npm run deploy -- patch`
    - bash/zsh: `GOJA_DEPLOY_REMOTE=git@github.com:fingerfly/goja.git npm run deploy -- patch`

## Risk Controls

- Preserve default behavior when `GOJA_DEPLOY_REMOTE` is unset.
- Preserve override priority: `GOJA_DEPLOY_REMOTE` must always win over OS defaults.
- Do not change version-bump semantics or release commit message format.
- Keep deploy safety check strict for repo identity to avoid accidental push to wrong remote.
- Ensure preflight failure path exits cleanly without leaving version/changelog files modified.

## Verification Gates

- `npm run test:unit`
- `npm test`
- `npm run test:e2e`
- Manual command syntax smoke check using non-destructive commands (PowerShell + CMD + bash/zsh snippets are copy-paste-valid before actual deploy command is executed)
- Diagnostics check on touched files (no new lints)
- `cloc` on touched script/test files to confirm maintainability target

## Expected Outcome

- Same deploy flow as today, but remote/auth is explicit and cross-platform-safe.
- Windows deploy works out-of-box with HTTPS default and still supports SSH override.
- macOS deploy keeps SSH-by-default behavior and still supports HTTPS override.

## Execution Update (2026-03-05)

- Implemented in `scripts/deploy.js`:
  - OS-aware default remote selection (`win32` => HTTPS, `darwin`/others => SSH).
  - `GOJA_DEPLOY_REMOTE` override priority preserved.
  - Preflight remains before version bump side effects.
- Implemented in `tests/unit/deploy.test.js`:
  - Added/updated tests for OS-based default remote resolution and override behavior.
  - Added remote normalization edge-case coverage.
- Implemented in `README.md`:
  - Documented OS-aware defaults and shell-specific override examples.

Validation completed:

- `npm run test:unit` passed.
- `npm test` passed.
- `npm run test:e2e` passed.
- Diagnostics check on touched files: no new lint errors.
- `cloc --by-file scripts/deploy.js tests/unit/deploy.test.js` completed.

