---
name: Watermark Tile Controls UX
overview: >-
  Replace range sliders for watermark tile spacing (平铺间距) and tile rotation
  (平铺旋转) with Goja-standard numeric inputs, lower spacing minimum to a
  practical value, add i18n hints, and validate with TDD plus full test gates.
todos:
  - id: rev64-tdd-watermark-tile-controls-red
    content: >-
      TDD red — unit tests for normalizeTileSpacing/Rotation, parseNumBounded
      in grid-effects-settings, drawTiled spacing at new min; e2e visibility
      and touch-target checks for tiled controls.
    status: pending
  - id: rev65-watermark-tile-controls-module
    content: >-
      Add js/watermark-tile-controls.js (normalizeTileSpacing/Rotation,
      applyTileSpacingInputMode decimal, applyTileRotationInputMode via
      edge-controls); update config.js constants; wire setFormDefaults plus
      input+change normalize listeners in app-init.js (edgeFrequency pattern).
    status: pending
  - id: rev66-html-css-locales
    content: >-
      Replace range inputs in index.html with type=number controls, hint
      elements (#watermarkTileSpacingHint, #watermarkTileRotationHint), and
      aria-describedby on inputs; add hint i18n keys to all six locales.
    status: pending
  - id: rev67-grid-effects-bounded-parse
    content: >-
      Use parseNumBounded in getWatermarkOptions for tileSpacing/tileRotation;
      keep export/preview pipeline unchanged except clamped values.
    status: pending
  - id: rev68-validation-gate-and-changelog
    content: >-
      Run full npm test + test:e2e, cloc on touched files, update CHANGELOG
      [Unreleased] with today date and validation counts; version bump via
      sync-version when releasing.
    status: pending
isProject: true
parentPlan: goja-irregular-edge-plan_709ef89a.plan.md
wave: 15
---

# 水印平铺控件 UX 改进计划

**主计划（Master）：** [goja-irregular-edge-plan_709ef89a.plan.md](goja-irregular-edge-plan_709ef89a.plan.md) — Wave 15

**版本背景：** [10.2.1]（2026-06-23）在 CHANGELOG 中新增了平铺间距/旋转 range slider；用户实测反馈 UX 不佳，且间距下限过高。

---

## 1. 问题陈述

### 1.1 当前实现

| 控件 | HTML ID | 类型 | 范围 | 步进 | 默认值 |
|------|---------|------|------|------|--------|
| 平铺间距 | `#watermarkTileSpacing` | `range` | 0.1–0.5 | 0.05 | 0.2 |
| 平铺旋转 | `#watermarkTileRotation` | `range` | -90–90 | 5 | -30 |

- 常量定义：`js/config.js` — `WATERMARK_TILE_SPACING_*`、`WATERMARK_TILE_ROTATION_*`
- 解析：`js/grid-effects-settings.js` — `getWatermarkOptions()` 使用 `parseNum`（**无边界钳制**）
- 渲染：`js/watermark.js` — `drawTiled()` 中
  `spacing = max(minSpacing, round(w * tileSpacingRatio))`
- 可见性：`js/app-init.js` — `syncSettingsVisibility()` 在
  `wmType !== 'none' && wmPos === 'tiled'` 时显示 `#watermarkTileOptionsGroup`
- 预览：`wmTileSpacing` / `wmTileRotation` 仅监听 `input` → `updatePreview`
  （**缺** `change` 与 normalize-on-blur，rev65 需对齐 `#edgeFrequency`）

### 1.2 为何 range slider 体验差

**平铺间距（ratio 抽象）：**

- 用户看到的是 0.1–0.5 的无单位比例，无法理解对最终像素间距的影响。
- 步进 0.05 在有效区间内过于粗糙（例如 1080px 画布上每档相差 54px）。
- 最小值 0.1（108px）对短文本过高：`drawTiled` 虽有 `minSpacing` 防重叠，但当
  `w * ratio > minSpacing` 时，0.10–0.15 区间可能产生相同视觉效果（死区）。
- 移动端 range 滑块难以精确输入；无法像 `#edgeFrequency` 那样直接键入目标值。

**平铺旋转（角度离散）：**

- 步进 5° 无法轻松得到 -30°（当前默认）以外的常见角如 -25°、-35°。
- -90° 到 90° 共 37 档，滑块拖拽难以对齐心理预期角度。
- 与 `#edgeFrequency` / `#superellipseExponent` 等已成熟的 number 控件不一致。

### 1.3 用户诉求

1. 将两个控件改为更合适的 widget（非 range slider）。
2. 平铺间距最小值应降至更合理的水平。

---

## 2. 推荐控件方案（对齐 Goja 惯例）

### 2.1 决策摘要

| 参数 | 推荐控件 | 理由 |
|------|----------|------|
| 平铺间距 | **`input type="number"`** + hint | 对齐 **`#superellipseExponent`**：`inputmode="decimal"`、`step="0.01"`；**全平台**保持 `type="number"`（**勿**用 `applyPlatformNumericInputMode`，其为整数键盘） |
| 平铺旋转 | **`input type="number"`** + hint | 对齐 **`#edgeFrequency`**：整数 1° 步进；iPhone 通过 **`applyPlatformNumericInputMode`**（`edge-controls.js`）切 `type="text"` + `inputmode="numeric"` |

**不采用：**

- **双控件（slider + number）**：`#edgeIntensity` 模式适合 0–1 连续微调；间距/旋转用户更需要精确值，slider 是 UX 痛点来源，不再保留 slider。
- **Select 预设（如 Small/Medium/Large）**：`#watermarkFontSize` 仅 3 档语义清晰；间距/旋转连续值更适合 number。
- **X/Y 双间距**：`drawTiled` 仅一维 `spacing` 方格循环，无 X/Y 独立 API；引入需改 `watermark.js` 算法，超出本需求范围。
- **预设角度按钮行**：可选增强，非 MVP；number + hint 已满足精确输入。

### 2.2 新 min / max / default / step

| 常量 | 现值 | **建议值** | 说明 |
|------|------|------------|------|
| `WATERMARK_TILE_SPACING_MIN` | 0.1 | **0.02** | 1080px 上约 22px；低于 `minSpacing` 时由渲染层钳制，不破坏防重叠 |
| `WATERMARK_TILE_SPACING_MAX` | 0.5 | 0.5 | 不变 |
| `WATERMARK_TILE_SPACING_DEFAULT` | 0.2 | 0.2 | 不变 |
| `WATERMARK_TILE_SPACING_STEP` | (无) | **0.01** | 新增常量，HTML `step` 与 normalize 使用 |
| `WATERMARK_TILE_ROTATION_MIN` | -90 | -90 | 不变 |
| `WATERMARK_TILE_ROTATION_MAX` | 90 | 90 | 不变 |
| `WATERMARK_TILE_ROTATION_DEFAULT` | -30 | -30 | 不变 |
| `WATERMARK_TILE_ROTATION_STEP` | (无) | **1** | 新增常量 |

### 2.3 1080px 画布间距数学示例

假设 `TILED_FONT_RATIO = 0.03`，`fontScale = 1` → `fontSize ≈ 32px`。

**公式：**

```
minSpacing = max(textWidth, fontSize * 1.2) + fontSize * 0.5
effectiveSpacing = max(minSpacing, round(canvasWidth * ratio))
```

| 水印文本 | 约 textWidth | minSpacing | ratio=0.02 (22px) | 0.05 (54px) | 0.10 (108px) | 0.20 (216px) | 0.50 (540px) |
|----------|--------------|------------|-------------------|-------------|--------------|--------------|--------------|
| `T` | ~20 | ~54 | **54** | **54** | 108 | 216 | 540 |
| `Demo` | ~100 | ~116 | **116** | **116** | 116 | 216 | 540 |
| 长文本 ~400px | ~400 | ~416 | **416** | **416** | **416** | 416 | 540 |

**解读：**

- 降至 **0.02** 后，对短文本可在 `minSpacing/w` ≈ **0.05–0.50** 区间用 0.01 步进精细调节（旧 slider 在 0.10–0.15 可能无可见差异）。
- 长文本时 ratio 低于 ~0.39 均受 `minSpacing` 限制 — 属预期行为（防重叠）；hint 文案需说明。
- **不在本计划修改** `drawTiled` 的 `minSpacing` 公式；若用户仍觉密度不足，可单独立项调整算法。

### 2.4 旋转示例（1080px，与画布尺寸无关）

| 角度 | 视觉效果 |
|------|----------|
| -45° | 经典对角水印 |
| -30° | 默认，轻微倾斜 |
| 0° | 水平网格 |
| 30° / 45° | 反向倾斜 |

### 2.5 平台输入模式（分控件，不可混用）

| 函数 | 用途 | 参考 |
|------|------|------|
| `normalizeTileSpacing(value)` | clamp 0.02–0.5 + 两位小数（同 `normalizeEdgeAmplitude`） | `edge-controls.js` |
| `normalizeTileRotation(value)` | 整数 clamp ±90（同 `normalizeEdgeFrequency`） | `edge-controls.js` |
| `applyTileSpacingInputMode(el)` | 始终 `type="number"`, `inputmode="decimal"`, `step` 来自 config | `#superellipseExponent` |
| `applyTileRotationInputMode(el, ua)` | 委托 `applyPlatformNumericInputMode(el, ua)` | `#edgeFrequency` |

`setFormDefaults` 中从 config 写入 min/max/step/value（同 superellipse L87–91 与 edgeFrequency L74–78）。

---

## 3. UI 线框（文字描述）

```
┌─ 水印 (Watermark) ─────────────────────────────────────┐
│  类型 [下拉]    位置 [下拉]                             │
│  不透明度 [slider]   字号 [Small|Medium|Large]        │  ← 不变
│  颜色 [color picker]                                  │
│  ┌─ 仅 position=tiled 时显示 ─────────────────────┐  │
│  │  平铺间距          │  平铺旋转                   │  │
│  │  [ 0.20    ▲▼ ]   │  [ -30     ▲▼ ]           │  │  ← number 输入
│  │  hint: 占画布宽度  │  hint: -90° 至 90°，1° 步进 │  │
│  │  比例 0.02–0.50    │                            │  │
│  └──────────────────────────────────────────────────┘  │
│  文本 [________________________]                      │
└───────────────────────────────────────────────────────┘
```

- 布局：保持 `#watermarkTileOptionsGroup` 的 `control-row control-row--pair`。
- 每列：`<input … aria-describedby="watermarkTileSpacingHint">` + `<p class="control-hint" id="watermarkTileSpacingHint">`（旋转同理 `#watermarkTileRotationHint`）。
- number 输入继承 `.control-group input[type="number"]` 的 `min-height: var(--touch-min)`（44px）。

---

## 4. 待修改文件

| 文件 | 变更 |
|------|------|
| `index.html` | 改为 `type="number"`；添加 `#watermarkTileSpacingHint` / `#watermarkTileRotationHint` 与 `aria-describedby`；HTML 可保留初始 min/max/step/value，**权威边界**由 `setFormDefaults` 从 config 写入 |
| `js/config.js` | 更新 `WATERMARK_TILE_SPACING_MIN`；新增 `*_STEP` 常量 |
| `js/watermark-tile-controls.js` | **新建** — 四个导出函数（§2.5）；rotation 侧 import `applyPlatformNumericInputMode` |
| `js/grid-effects-settings.js` | `getWatermarkOptions` 对 spacing/rotation 使用 `parseNumBounded` |
| `js/app-init.js` | `setFormDefaults` 初始化 bounds；`input`+`change` → normalize + `updatePreview`；init 时 apply 输入模式 |
| `js/app-bootstrap.js` | 无结构性变更（refs 已存在） |
| `js/watermark.js` | **不改算法**（除非测试发现边界回归） |
| `js/locales/*.js`（6 个） | 新增 `watermarkTileSpacingHint`、`watermarkTileRotationHint` |
| `css/style.css` | 预计无需新类；已有 number 样式与 touch-min |
| `tests/unit/watermark-tile-controls.test.js` | **新建** — normalize 边界 |
| `tests/unit/grid-effects-settings.test.js` | 钳制/默认值用例 |
| `tests/unit/watermark.test.js` | spacing/rotation 参数传入 drawTiled |
| `tests/e2e/goja.spec.js` | tiled 可见性、number 输入、touch target ≥44px |
| `CHANGELOG.md` | `[Unreleased]` 条目（版本号由 `sync-version` 发布时写入） |

**不改：** `export-handler.js`、`export-worker.js`、`unified-canvas-pipeline.js`（仅消费已钳制数值）。

---

## 5. TDD 测试计划

### 5.1 单元测试（先写失败测试）

**`tests/unit/watermark-tile-controls.test.js`**

- `normalizeTileSpacing('0.015')` → 0.02（钳制到 min）
- `normalizeTileSpacing('0.555')` → 0.5
- `normalizeTileSpacing('abc')` → default 0.2
- `normalizeTileSpacing('0.123')` → 0.12（两位小数）
- `normalizeTileRotation('-91')` → -90；`'91'` → 90；`'abc'` → -30

**`tests/unit/grid-effects-settings.test.js`**

- `getWatermarkOptions({ wmTileSpacing: '0.01', wmTileRotation: '100' })` 返回钳制值
- `buildFormFromRefs` 含 `wmTileSpacing` / `wmTileRotation`

**`tests/unit/watermark.test.js`**

- `drawWatermark` tiled + `tileSpacing: 0.02` 仍调用 `fillText` 多次
- `tileRotation: -25` 传入 `rotate` 弧度正确

### 5.2 E2E（Playwright）

新增或扩展 `tests/e2e/goja.spec.js`：

1. **`watermark tile options visible when position is tiled`**
   - 选 text + tiled → `#watermarkTileOptionsGroup` 可见
   - 选 bottom-right → hidden
2. **`watermark tile spacing accepts numeric input and updates preview`**
   - fill `#watermarkTileSpacing` 为 `0.15`，export 或 preview overlay 不报错
3. **`watermark tile controls meet 44px touch target`**
   - 与现有 checkbox touch test 同模式，量 `#watermarkTileSpacing` bounding box
4. **`watermark tile spacing and rotation init from config`**
   - 对齐现有 `gap slider and watermark opacity init from config` 测试
5. **`watermark tile hints linked via aria-describedby`**
   - `#watermarkTileSpacingHint` / `#watermarkTileRotationHint` 存在；input 含对应 `aria-describedby`

### 5.3 全量门禁

```bash
npx vitest run tests/unit/watermark-tile-controls.test.js tests/unit/grid-effects-settings.test.js tests/unit/watermark.test.js
npx playwright test tests/e2e/goja.spec.js --grep "watermark tile|tiled"
npm test
npm run test:e2e
cloc --by-file --include-lang=JavaScript js/watermark-tile-controls.js js/grid-effects-settings.js js/app-init.js tests/unit/watermark-tile-controls.test.js
```

---

## 6. 迁移与向后兼容

| 场景 | 策略 |
|------|------|
| HTML `defaultValue` / 首次加载 | 新 default 不变（0.2 / -30） |
| 用户 session 中已拖动的 slider 值 | 无 localStorage 持久化；刷新后恢复 HTML 默认 |
| 导出/预览传入旧 ratio `< 0.02` | `parseNumBounded` 钳制到 0.02 |
| 导出/预览传入 rotation 超范围 | 钳制到 ±90 |
| `resetControls` / Reset section | 依赖 `defaultValue`；HTML 更新后自动生效 |
| API / worker 消息 | 字段名不变（`watermarkTileSpacing` / `watermarkTileRotation`） |

---

## 7. 无障碍（a11y）

- 保留 `<label for="watermarkTileSpacing">` / `for="watermarkTileRotation"` + `data-i18n`
- `aria-describedby="watermarkTileSpacingHint"` / `"watermarkTileRotationHint"`（同 `#frameWidth` → `#frameDimensionHint`）
- number 输入 `min-height: var(--touch-min)` ≥ **44px**
- 无效输入：`input` 与 `change` 均 normalize 回合法值
- **间距**：全平台 `inputmode="decimal"`（**不**调用 `applyPlatformNumericInputMode`）
- **旋转**：iPhone 上 `applyTileRotationInputMode` → text + numeric 键盘

---

## 8. 风险与回滚

| 风险 | 缓解 |
|------|------|
| 降低 spacing min 仍受 `minSpacing` 限制，用户感知改善有限 | hint 解释；必要时后续 Wave 调整 `drawTiled` 公式 |
| `parseNumBounded` 改变极端输入行为 | 单元测试覆盖；CHANGELOG 说明 |
| `app-init.js` SLOC 超限 | normalize 抽到 `watermark-tile-controls.js` |
| 回归 preview/export  parity | 不改 `watermark.js` 核心算法；跑现有 watermark e2e |

**回滚：** 恢复 `index.html` range 输入 + 旧 `WATERMARK_TILE_SPACING_MIN=0.1`；删除新模块与测试。

---

## 9. 执行顺序（TDD-first）

1. `rev64-tdd-watermark-tile-controls-red`
2. `rev65-watermark-tile-controls-module`
3. `rev66-html-css-locales`
4. `rev67-grid-effects-bounded-parse`
5. `rev68-validation-gate-and-changelog`

---

## 10. 计划验证清单

**结构审查（2026-06-23，已修正 F1–F4）：**

- [x] 计划位于 canonical 目录 `goja/.cursor/plans/`
- [x] 主计划 Wave 15 双向链接（`parentPlan` + Active Execution Window）
- [x] 间距/旋转平台输入模式已拆分（§2.5，修正 F1）
- [x] `input`+`change` normalize  wiring 已写入 rev65（修正 F2）
- [x] hint ID 与 `aria-describedby` 已写入 rev66 / §3 / §5.2（修正 F3）
- [x] CHANGELOG 目标为 `[Unreleased]`（修正 F4）
- [x] config 常量与建议 min/max 一致
- [x] `drawTiled` 间距公式已文档化
- [x] 测试路径与 npm scripts 可执行

**实现后复检（rev68 前勾选）：**

- [ ] HTML hint 元素与 a11y 属性已落地
- [ ] 六语种 hint i18n 已添加
- [ ] 全量测试通过并写入 CHANGELOG 证据
