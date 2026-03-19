---
name: Add China app presets
overview: "Extend section 4.3 of the Goja Improvement Proposals to add aspect ratio presets for mainland China apps: 抖音, 小红书, 快手, 视频号."
todos: []
isProject: false
---

# Add China App Aspect Presets

## 1. Purpose

Update section **4.3 Aspect Ratio Presets** in [goja_improvement_proposals_9895157a.plan.md](goja_improvement_proposals_9895157a.plan.md) to include presets for popular mainland China apps.

## 2. China App Specifications


| App                     | Format               | Dimensions             | Ratio       |
| ----------------------- | -------------------- | ---------------------- | ----------- |
| **抖音 Douyin**           | Vertical video       | 1080×1920              | 9:16        |
| **小红书 Xiaohongshu**     | Portrait image/video | 1080×1440              | 3:4         |
| **快手 Kuaishou**         | Vertical video       | 1080×1920              | 9:16        |
| **视频号 WeChat Channels** | Vertical             | 1080×1920 or 1080×1236 | 9:16 / ~7:9 |


- Douyin and Kuaishou: primary vertical 1080×1920 (9:16).
- Xiaohongshu: 1080×1440 (3:4) — common portrait format.
- WeChat Channels: 1080×1920 or 1080×1236.

## 3. Change Specification

**Current (section 4.3):**

```
- Preset buttons in Settings → Grid: 1:1 (1080×1080), 4:3, 16:9, Instagram (1080×1350), Stories (1080×1920).
- Buttons set frameWidth/frameHeight and trigger updatePreview().
```

**Replace with:**

```
- Preset buttons in Settings → Grid:
  - General: 1:1 (1080×1080), 4:3 (1080×1440), 16:9 (1080×608)
  - International: Instagram (1080×1350), Stories (1080×1920)
  - 中国大陆 China: 抖音 (1080×1920), 小红书 (1080×1440), 快手 (1080×1920), 视频号 (1080×1920)
- Buttons set frameWidth/frameHeight and trigger updatePreview().
- i18n: presetDouyin, presetXiaohongshu, presetKuaishou, presetWechatChannels for all locales.
```

**Rationale:** Douyin, Kuaishou, and WeChat Channels share 1080×1920 with Stories. Separate presets give Chinese users explicit, familiar names.

## 4. Implementation Steps


| Step | Action                                                                | File                                                            |
| ---- | --------------------------------------------------------------------- | --------------------------------------------------------------- |
| 1    | Add 4 preset buttons in #aspectPresets with data-w, data-h, data-i18n | [index.html](02product/01_coding/project/goja/index.html)       |
| 2    | Add i18n keys for all 11 locales                                      | [js/locales/*.js](02product/01_coding/project/goja/js/locales/) |
| 3    | Update GATE 6 preset list in parent plan                              | goja_improvement_proposals                                      |


## 5. Optional Layout

If the preset bar is crowded: group into two rows (Row 1: 1:1, 4:3, 16:9, Instagram, Stories; Row 2: 抖音, 小红书, 快手, 视频号) or use flex-wrap.