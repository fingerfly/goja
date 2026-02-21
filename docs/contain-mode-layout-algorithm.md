# Layout Algorithm: Cover & Contain (Unified)

## 1. 最佳宫格布局的定义 (Definition of Best Grid Layout)

**Fill (cover)**：照片填满格子，比例不匹配时裁剪。
**Full display (contain)**：照片完整显示，比例不匹配时留白。

两者都希望：**格子宽高比尽量与照片宽高比一致**。
- Cover：不匹配 → 裁剪越多（内容丢失）
- Contain：不匹配 → 留白越多（空间浪费）

**最佳宫格布局**（两种模式通用）：在所有候选模板中，使**宽高比总 mismatch 最小**的模板及其照片分配方案。

形式化：

给定 N 张照片 (w_i × h_i)、画布 (W × H)、候选模板集 T：

- 对模板 t ∈ T，计算各格子的像素尺寸 cell_j = (cw_j, ch_j)
- 格子宽高比 r_j = cw_j / ch_j，照片宽高比 a_i = w_i / h_i
- 对每个 (格子, 照片) 配对，mismatch 用 **log 宽高比差** 衡量：
  - |log(r_j) - log(a_i)| 越小，mismatch 越小
  - 两者相等时 mismatch = 0（Cover 无裁剪，Contain 无留白）

**目标函数**（Cover 与 Contain 通用）：

```
minimize  L = Σ |log(cell_ratio_slot) - log(photo_ratio_assigned)|
```

即：最小化所有配对的总 log 宽高比差。

---

## 2. 为什么用 log 差？

- **对称性**：|log(r) - log(a)| = |log(r/a)| 对 16:9 vs 9:16 等对称
- **可加性**：多格总 mismatch 可近似为各格 log 差之和
- **计算简单**：只需宽高比，不需像素面积

---

## 3. 算法步骤

### Step 1: 模板筛选

按照片数量 N 获取候选模板，如 N=3 → [3T, 3L]，N=4 → [4G, 4T, 4L]。

### Step 2: 对每个模板打分

对模板 t：

1. 根据 outputWidth、outputHeight、gap 计算每个格子的 (width, height)
2. 格子按宽高比升序排列 → slotOrder
3. 照片按宽高比升序排列 → photoOrder
4. 最优分配：slotOrder[i] 的格子分配给 photoOrder[i] 的照片
5. 计算总 mismatch：Σ |log(cellRatio[slotOrder[i]]) - log(photoRatio[photoOrder[i]])|
6. 得分 score = -mismatch（越高越好）

### Step 3: 分配最优性

将「最窄的格子」配给「最竖的照片」、「最宽的格子」配给「最横的照片」，是使 Σ|log(cell) - log(photo)| 最小的最优分配（排序配对最优性）。

### Step 4: 选模板

选择 score 最高的模板，并用上述分配得到 photoOrder。

---

## 4. 各数量下的候选与预期

| 照片数 | 候选模板 | 含意 |
|-------|----------|------|
| 2 | 2H (1×2), 2V (2×1) | 横排 vs 竖排 |
| 3 | 3T (上横跨 + 下 2), 3L (左竖跨 + 右 2) | 三格结构 |
| 4 | 4G (2×2), 4T (上横 + 下 3), 4L (左竖 + 右 3) | 均分 vs 主图 |
| 5 | 5T, 5L | 同上 |
| 6 | 6H (2×3), 6V (3×2) | 横多 vs 竖多 |
| 7 | 7T | 唯一 |
| 8 | 8T | 唯一 |
| 9 | 9G (3×3) | 唯一 |

在 1080×1350（竖画布）下：
- 2H：每格 ~540×1350（竖长）→ 适合竖幅
- 2V：每格 ~1080×675（横宽）→ 适合横幅
- 3T：上一大横格 + 下两小格
- 3L：左一大竖格 + 右两小格
- 4G：四格均等，每格 ~538×673

算法会按实际照片宽高比选择总 mismatch 最小的模板。

---

## 5. Cover 与 Contain 的统一算法

| 模式 | mismatch 的表现 | 算法 |
|------|----------------|------|
| Cover | 裁剪（内容丢失） | 统一使用宽高比匹配 |
| Contain | 留白（空间浪费） | 同上 |

**Fill 与 Full display 现已使用同一套布局算法**：均以最小化 log 宽高比差为目标选模板、分配照片，不再依赖 slot 的 orientation 偏好。
