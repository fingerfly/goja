---
name: goja plan relocation
overview: Relocate all root-level goja plan files into goja-local `.cursor/plans`, then repair references and validate consistency/executability in the same turn.
todos:
  - id: goja-inventory-finalize
    content: Finalize and lock goja source-to-destination mapping.
    status: completed
  - id: goja-prepare-destination
    content: Create `02product/01_coding/project/goja/.cursor/plans` if missing.
    status: completed
  - id: goja-migrate-files
    content: Move all `goja*.plan.md` files to goja-local plans directory.
    status: completed
  - id: goja-fix-references
    content: Repair stale root-path links in moved goja plans.
    status: completed
  - id: goja-retire-root-copies
    content: Remove migrated goja root copies.
    status: completed
  - id: goja-validate-migration
    content: Validate applied edits, consistency, and path executability in same turn.
    status: completed
isProject: false
---

# GOJA Plan Relocation Plan

## Goal

Relocate GOJA plans into the GOJA project-local `.cursor/plans` directory
to keep plan artifacts portable, project-scoped, and consistent with the
workspace plan-storage policy.

## Canonical Paths

- Source root:
[C:/Projects/00_Mundo/.cursor/plans](C:/Projects/00_Mundo/.cursor/plans)
- Destination:
[C:/Projects/00_Mundo/02product/01_coding/project/goja/.cursor/plans](C:/Projects/00_Mundo/02product/01_coding/project/goja/.cursor/plans)
- Plan policy reference:
[C:/Projects/00_Mundo/.cursor/rules/plan-storage-policy.mdc](C:/Projects/00_Mundo/.cursor/rules/plan-storage-policy.mdc)

## Scope

- In scope:
  - All files matching `goja*.plan.md` in root `.cursor/plans`.
  - Cross-links inside migrated GOJA plans that still point to root
  `goja*.plan.md`.
- Out of scope:
  - Non-GOJA plans in root `.cursor/plans`.
  - User-global plan archives unrelated to GOJA project execution.

## One-Batch Migration Mapping

- Mapping rule: `root/.cursor/plans/<file>` ->
`goja/.cursor/plans/<file>`.
- Current expected in-scope count: `30` GOJA plans.
- Include both hyphen and underscore variants (`goja-*` and `goja_*`)
when building the final move list.

## Execution Steps

1. **Inventory lock**
  - Build the final explicit file list from root using `goja*.plan.md`.
  - Freeze this list for the batch; do not mix non-GOJA files.
2. **Destination prepare**
  - Create destination directory if missing:
   `02product/01_coding/project/goja/.cursor/plans`.
3. **File migration**
  - Move each mapped GOJA plan file to destination.
  - Preserve filename unchanged to avoid reference churn.
4. **Reference repair**
  - Rewrite stale root links in migrated GOJA plans:
    - from `goja*.plan.md`
    - to sibling links, e.g. `goja_xxx.plan.md`.
  - Keep non-GOJA historical references unchanged unless they break.
5. **Root retirement**
  - Remove migrated GOJA copies from root `.cursor/plans`.
6. **Closeout update**
  - Update this relocation plan frontmatter todo statuses.
  - Add a completion snapshot with applied changes and validation
  evidence.

## Validation Matrix (same turn, mandatory)

- **Applied edits**
  - Destination contains all files in locked mapping list.
  - Root has zero remaining `goja*.plan.md` files.
- **Internal consistency**
  - No stale references match `goja*.plan.md` in
  migrated GOJA plans.
  - Intra-GOJA links resolve as local sibling references.
- **Executability**
  - Every moved GOJA plan is readable from destination path.
  - Link/path scan shows no broken references for in-scope GOJA links.

## Rollback Safety

- If validation fails:
  - Restore moved GOJA plans to root using locked mapping list.
  - Re-run reference repair and validation until all gates pass.
- Do not alter non-GOJA root plans during rollback.

## Acceptance Criteria

- All `goja*.plan.md` files are under GOJA-local destination.
- Root `.cursor/plans` contains no GOJA-prefixed plan files.
- Migrated GOJA plans contain no stale root GOJA links.
- This plan has todos and completion snapshot synchronized with the
executed state.

## Follow-Up

- After GOJA relocation exits green, next recommended batch is
`langbuilderjs*.plan.md` using the same migration pattern.

## Completion Snapshot

- Status: `completed`
- CompletionDate: `2026-03-18`
- Applied:
  - Moved 30 `goja*.plan.md` files from root `.cursor/plans` to
    `02product/01_coding/project/goja/.cursor/plans`.
  - Rewrote stale root GOJA links to local sibling references.
  - Preserved historical missing GOJA references as plain text where needed.
  - Retired all root GOJA plan copies.
- Validation:
  - Root `.cursor/plans` now contains `0` `goja*.plan.md` files.
  - Destination contains `30` `goja*.plan.md` files.
  - No stale root GOJA path references remain in migrated GOJA plans.
  - Local in-scope GOJA plan links resolve with `broken_count=0`.

