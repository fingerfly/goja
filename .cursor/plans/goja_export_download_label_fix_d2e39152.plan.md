---
name: Export download label fix
overview: Change the Chinese export download label from "保存到手机" to "保存到本机" so it is correct on PC and Macintosh, not only on mobile.
todos: []
isProject: false
---

# Export Download Label: 保存到手机 → 保存到本机

## Problem

On PC and Macintosh, the save option incorrectly shows "保存到手机" (save to phone), which only makes sense on mobile. The label should work for all devices.

## Solution

Use "保存到本机" (save to this device / local machine), which is correct for both desktop (PC/Mac) and mobile:

- **zh-Hans (简体中文):** `"保存到手机"` → `"保存到本机"`
- **zh-Hant (繁體中文):** `"保存到手機"` → `"保存到本機"`

## Implementation

### 1. Update locale files

**File:** [js/locales/zh-Hans.js](02product/01_coding/project/goja/js/locales/zh-Hans.js)

```javascript
exportDownload: '保存到本机',
```

**File:** [js/locales/zh-Hant.js](02product/01_coding/project/goja/js/locales/zh-Hant.js)

```javascript
exportDownload: '保存到本機',
```

### 2. Update plan reference

**File:** [goja_oppo_export_ux_fix_d21c649f.plan.md](goja_oppo_export_ux_fix_d21c649f.plan.md)

In section 3.3, change the recommendation from `"保存到手机"` to `"保存到本机"`:

```
- zh-Hans: "保存到本机" (save to this device — works for PC, Mac, phone)
- zh-Hant: "保存到本機" (same, traditional form)
```

### 3. CHANGELOG

**File:** [CHANGELOG.md](02product/01_coding/project/goja/CHANGELOG.md)

Add under Unreleased:

```markdown
### Changed
- zh-Hans/zh-Hant: exportDownload label 保存到手机 → 保存到本机 (correct on PC/Mac, not just mobile)
```

## Verification

- Run unit tests (no test changes required; i18n tests use keys, not values)
- Manual check: Export on desktop with 简体中文 → button shows "保存到本机"

