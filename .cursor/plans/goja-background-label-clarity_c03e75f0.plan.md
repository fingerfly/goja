---
name: goja-background-label-clarity
overview: Unify the two confusing background labels with clearer wording semantics, synchronize all locales, and validate with tests plus changelog evidence.
todos:
  - id: rev49-tdd-background-label-tests
    content: Add failing unit/e2e assertions for clarified inner-grid and outside-frame background labels.
    status: completed
  - id: rev50-locales-and-fallback-labels
    content: Update all locale strings and index fallback labels to the new two-level background semantics.
    status: completed
  - id: rev51-validation-gates-and-cloc
    content: Run targeted tests, full test gates, and cloc for touched locale files.
    status: completed
  - id: rev52-changelog-update
    content: Record naming clarification and validation evidence in CHANGELOG with today's date.
    status: completed
isProject: false
---

# Goja Background Label Clarity Plan

## Goal

Apply your finalized naming semantics to eliminate ambiguity between inner grid background and outside frame background, and ship with test + changelog evidence.

## Execution Status

- Completed: `rev49..rev52`
- All plan todos are `completed`.
- Execution evidence is recorded in `02product/01_coding/project/goja/CHANGELOG.md` (`9.4.1`).

## Confirmed Wording Baseline

- `bgColor` semantic: inner grid background
- `outsideBackgroundColor` semantic: outside whole frame background
- `zh-Hans` final wording:
  - `background`: `宫格内背景色`
  - `outsideBackgroundColor`: `整体边框外背景色`

## Files to Update

- UI labels (fallback text only, keys unchanged):
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/index.html](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/index.html)
- Locales (all languages, semantic sync):
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/locales/en.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/locales/en.js)
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/locales/zh-Hans.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/locales/zh-Hans.js)
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/locales/zh-Hant.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/locales/zh-Hant.js)
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/locales/es.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/locales/es.js)
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/locales/ja.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/locales/ja.js)
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/locales/eo.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/locales/eo.js)
- Tests (TDD first):
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/unit/i18n.test.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/unit/i18n.test.js)
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/e2e/goja.spec.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/e2e/goja.spec.js)
- Release record:
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/CHANGELOG.md](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/CHANGELOG.md)

## Execution Steps (TDD-first)

1. Merge this plan into master plan as the active window (`rev49..rev52`) before code execution.
2. Add/adjust failing assertions in unit/e2e for the two labels (at least zh-Hans and one non-Chinese locale semantic check), and name new e2e tests to match targeted grep gates below.
3. Update locale strings for all six languages to distinguish inner-grid vs outside-frame semantics.
4. Update fallback label text in `index.html` to match new semantics.
5. Re-run updated tests and fix any i18n/UI expectation drift.
6. Run full validation gates and SLOC measurement on touched files.
7. Update `CHANGELOG.md` with today date and exact validation evidence.

## Validation Gates

- Targeted:
  - `npx vitest run tests/unit/i18n.test.js`
  - `npx playwright test tests/e2e/goja.spec.js --grep "background labels are localized in zh-Hans|background labels remain semantically distinct in en"`
- Full:
  - `npm test`
  - `npm run test:e2e`
- SLOC (standard tool):
  - `cloc --by-file --include-lang=JavaScript 02product/01_coding/project/goja/js/locales/en.js 02product/01_coding/project/goja/js/locales/zh-Hans.js 02product/01_coding/project/goja/js/locales/zh-Hant.js 02product/01_coding/project/goja/js/locales/es.js 02product/01_coding/project/goja/js/locales/ja.js 02product/01_coding/project/goja/js/locales/eo.js 02product/01_coding/project/goja/tests/unit/i18n.test.js 02product/01_coding/project/goja/tests/e2e/goja.spec.js`

## Acceptance Criteria

- Users can clearly distinguish the two controls by wording alone.
- `zh-Hans` exactly matches your confirmed terms.
- Other locales consistently map to inner-grid vs outside-frame meaning.
- Master plan includes active `rev49..rev52` window before implementation starts (source-of-truth rule preserved).
- Unit + e2e + full gates pass and changelog includes validated evidence.

## Completion Evidence

- `npx vitest run tests/unit/i18n.test.js` (pass)
- `npx playwright test tests/e2e/goja.spec.js --grep "background labels are localized in zh-Hans|background labels remain semantically distinct in en"` (pass)
- `npm test` (pass)
- `npm run test:e2e` (pass)
- `cloc --by-file --include-lang=JavaScript 02product/01_coding/project/goja/js/locales/en.js 02product/01_coding/project/goja/js/locales/zh-Hans.js 02product/01_coding/project/goja/js/locales/zh-Hant.js 02product/01_coding/project/goja/js/locales/es.js 02product/01_coding/project/goja/js/locales/ja.js 02product/01_coding/project/goja/js/locales/eo.js 02product/01_coding/project/goja/tests/unit/i18n.test.js 02product/01_coding/project/goja/tests/e2e/goja.spec.js` (pass)

