---
name: Goja Commenting Rollout
overview: Add structured, high-value comments across all Goja source files while honoring strict 78-column width and established battlefield-tested rules. Roll out in prioritized batches with verification gates (cloc, static checks, full tests) after each batch.
todos:
  - id: baseline-audit
    content: Create source-file inventory with SLOC trigger at >99, comment coverage, long-line hotspots, and prioritized edit order.
    status: completed
  - id: batch-core
    content: Apply comment standards to core runtime/rendering files and keep 78-column compliance.
    status: completed
  - id: batch-geometry-effects
    content: Apply comment standards to geometry/effects/edge modules; refactor only when valid reasons exist (>99 SLOC, complexity, or mixed responsibility).
    status: completed
  - id: batch-ui-doc
    content: Apply standards to UI modules plus index.html/CSS/sw.js with section/rationale comments.
    status: completed
  - id: enforce-verify
    content: Run guardrail checks (cloc + static analysis) and full tests (unit/function/integration/e2e) after each batch and at final close.
    status: completed
isProject: false
---

# Goja Source Commenting Plan

## Scope and Constraints

- Scope: all Goja source files in
`[/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js)`,
`[/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/index.html](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/index.html)`,
`[/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/css](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/css)`,
and
`[/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/sw.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/sw.js)`.
- Style decisions locked for this effort: strict `<= 78` columns everywhere; comment intent/constraints, not obvious mechanics.
- Preserve behavior: no functional changes unless a readability refactor is required by line-width/complexity guardrails.

## Battlefield-Tested Coding Rules (Established)

- Line width: strict `<= 78` columns in JS, HTML, CSS, and comments.
- Program/module header comments for substantial files:
  - include `Purpose` and `Description`
  - description states responsibilities, major inputs/outputs, and side effects
- Function/class/method comments:
  - use JSDoc on exported/public and non-trivial logic
  - include `@param`, `@returns`, `@throws` where applicable
  - explain intent/constraints, not obvious mechanics
- Function size and responsibility:
  - soft limit: 40 lines per function
  - hard warning threshold: 60 lines per function
  - split mixed responsibilities into smaller helpers
- Complexity guardrails:
  - enforce cyclomatic/cognitive complexity thresholds via static analysis
  - refactor any function flagged as too complex, even below line limits
- Testing requirement:
  - any refactor tied to size/complexity must keep full tests passing

## Baseline Audit (Before Editing)

- Build a per-file inventory with:
  - `cloc <file>` status with SLOC review trigger at `>99`.
  - for files over 99 SLOC, record valid reasons to refactor or retain.
  - Current comment coverage (module header present, JSDoc on exported APIs, section comments in HTML/CSS).
  - Long-line hotspots (`^.{79,}$`) to prevent introducing violations.
- Record high-priority files first (largest source files currently):
  - `[css/style.css](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/css/style.css)`
  - `[index.html](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/index.html)`
  - `[js/app-init.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/app-init.js)`
  - `[js/preview-renderer.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/preview-renderer.js)`
  - `[js/grid-effects-settings.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/grid-effects-settings.js)`
  - `[js/shape-contour.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/shape-contour.js)`

## Commenting Standards to Apply

- Module/program header for substantial files:
  - Purpose (1 line), Description (2-5 bullets), key side effects/dependencies.
- Function/class/method comments:
  - Required on exported/public and non-trivial logic; include `@param`, `@returns`, `@throws` and side effects where relevant.
- HTML/CSS comments:
  - Section comments and rationale comments for non-obvious structure/fallbacks.
- Keep all comments concise and wrapped to 78 columns.

## Batch Execution Strategy

- Batch A: Core runtime orchestration and rendering files (`app-init`, `app-bootstrap`, `preview-renderer`, `preview-updater`, `layout-engine`, `export-handler`).
- Batch B: Geometry/effects/shape modules (`shape-contour`, `frame-shape-geometry`, `shape-clip-utils`, `edge-*`, `image-effects`, `watermark`, `capture-date-overlay`).
- Batch C: UI/interaction modules (`settings-panel`, `settings-tabs-nav`, `drag-handler`, `resize-handler`, `rotation-handler`, `cell-*`, `bg-color-control`).
- Batch D: Entry/document/presentation files (`index.html`, `css/style.css`, `css/variables.css`, `sw.js`) and low-SLOC utility/data modules.
- For each batch, if a function crosses soft/hard thresholds (40/60) or complexity flags, split into helper functions while preserving module cohesion.

## Guardrail Enforcement Workflow Per Batch

- Step 1: `cloc <file>` for touched files to check SLOC and identify outliers.
- Step 1a: if SLOC is `>99`, refactor only when there are valid reasons
(clarity gain, mixed responsibility, high complexity, or churn risk).
- Step 2: run lint/static analysis for line width and complexity; treat violations as required fixes.
- Step 3: refactor oversized/high-complexity functions into smaller
cooperating units when needed.
- Step 3a: prioritize refactor when any function exceeds 60 lines or is
flagged by complexity analysis, even if file SLOC is <=99.
- Step 4: run full test suite before closing the batch:
  - unit/function: `npm test` (and targeted unit checks as needed)
  - integration/e2e: `npm run test:e2e`
- Do not claim completion until all required tests pass.

## Completion Criteria

- Every in-scope source file has appropriate program/file-level and function-level comments per standard.
- No touched line exceeds 78 columns.
- Complexity/size guardrail violations in touched areas are resolved or
explicitly justified.
- Any touched file over 99 SLOC has a documented decision:
valid refactor reason applied, or reasoned retention accepted.
- Full tests pass (unit/function/integration/e2e) after final batch.

## Decision Principle

- Prefer clarity and maintainability over strict numeric adherence.
- Treat numeric thresholds as guardrails, not goals by themselves.

