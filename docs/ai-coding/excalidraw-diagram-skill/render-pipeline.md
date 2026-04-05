---
title: 渲染管线：AI 如何"看见"自己生成的图表
description: Python + Playwright + Excalidraw JS 的 189 行渲染链路解析
---

# 渲染管线

AI 无法从 JSON 直观判断图表是否正确。`x: 500, y: 300` 看不出对不对，文字是否溢出容器、元素是否重叠、箭头是否穿过其他形状——这些问题只有"看"才能发现。

渲染管线解决的就是这个问题：让 AI 能"看见"自己生成的图表。

## 技术栈

整个渲染链路只有 5 层，依赖极少：

| 层 | 技术 | 职责 |
|----|------|------|
| 编排 | Python (`render_excalidraw.py`, 189 行) | 读取 JSON、验证、启动浏览器、截图 |
| 浏览器自动化 | Playwright (>=1.40.0) | 控制无头浏览器 |
| 渲染引擎 | Headless Chromium | 执行 JavaScript |
| 图表渲染 | @excalidraw/excalidraw (esm.sh CDN) | JSON → SVG |
| 输出 | Playwright screenshot | SVG → PNG |

```
.excalidraw (JSON)
    ↓ render_excalidraw.py
    ↓ validate + compute bounding box
    ↓ launch Playwright + Chromium
    ↓ load render_template.html
    ↓ import @excalidraw/excalidraw from CDN
    ↓ call renderDiagram(jsonData)
    ↓ exportToSvg() → DOM
    ↓ screenshot #root svg
    ↓
  .png
```

## render_excalidraw.py 逐层解析

### 验证层

```python
def validate_excalidraw(data: dict) -> list[str]:
    if data.get("type") != "excalidraw":
        errors.append(...)
    if "elements" not in data or not isinstance(data["elements"], list):
        errors.append(...)
```

三项检查：`type` 必须是 `excalidraw`、`elements` 必须存在且为数组、数组不能为空。验证失败直接退出，不启动浏览器。

### 计算层

```python
def compute_bounding_box(elements):
    for el in elements:
        if el.get("isDeleted"):
            continue
        # 普通元素：用 x, y, width, height
        # arrow/line：遍历 points 数组，计算实际端点
```

遍历所有未删除的元素，计算画布边界。特殊处理 `arrow` 和 `line` 类型——它们的 `points` 数组定义了相对于 `(x, y)` 的实际端点坐标，需要加上偏移量才能得到真实位置。

最终结果加上 80px padding：

```python
diagram_w = max_x - min_x + padding * 2
diagram_h = max_y - min_y + padding * 2
```

### 视口计算

```python
vp_width = min(int(diagram_w), max_width)   # 上限 1920px
vp_height = max(int(diagram_h), 600)         # 下限 600px
```

宽度有上限（防止超大图表撑爆视口），高度无上限（允许长图表完整渲染）。

### 渲染层

```python
browser = p.chromium.launch(headless=True)
page = browser.new_page(viewport={...}, device_scale_factor=scale)
page.goto(template_url)
page.wait_for_function("window.__moduleReady === true", timeout=30000)
result = page.evaluate(f"window.renderDiagram({json_str})")
page.wait_for_function("window.__renderComplete === true", timeout=15000)
svg_el = page.query_selector("#root svg")
svg_el.screenshot(path=str(output_path))
```

流程：启动浏览器 → 加载模板 HTML → 等待 ES module 就绪（30s 超时） → 注入 JSON 并调用渲染函数 → 等待渲染完成（15s 超时） → 截图 SVG 元素 → 输出 PNG。

`device_scale_factor` 默认为 2，保证 2x 清晰度。

## render_template.html 解析

56 行 HTML，核心逻辑只有 20 行 JavaScript：

```javascript
import { exportToSvg } from "https://esm.sh/@excalidraw/excalidraw?bundle";

window.renderDiagram = async function(jsonData) {
    const svg = await exportToSvg({
        elements: data.elements,
        appState: { ...data.appState, exportBackground: true },
        files: data.files,
    });
    document.getElementById("root").appendChild(svg);
    window.__renderComplete = true;
};
window.__moduleReady = true;
```

两个信号量协调 Python 和 JavaScript 的时序：

| 信号量 | 含义 | Python 端等待 |
|--------|------|--------------|
| `window.__moduleReady` | ES module 从 CDN 加载完成 | `wait_for_function("__moduleReady === true")` |
| `window.__renderComplete` | SVG 渲染完成并插入 DOM | `wait_for_function("__renderComplete === true")` |

关键细节：强制白色背景、禁用暗色模式：

```javascript
appState.viewBackgroundColor = appState.viewBackgroundColor || "#ffffff";
appState.exportWithDarkMode = false;
```

::: tip CDN 加载
Excalidraw 库从 [esm.sh](https://esm.sh) CDN 加载，不需要安装 npm 包、不需要 node_modules。`?bundle` 参数让 esm.sh 将所有依赖打包为一个 ES module。这是整个项目"零 npm 依赖"设计的关键一环。
:::

## Render-View-Fix 循环

渲染管线的真正价值不在生成 PNG，而在它支撑的验证循环：

```
生成 JSON → 渲染 PNG → 查看图片 → 审计 → 修复 JSON → 重新渲染 → ...
                ↑                                        │
                └────────────────────────────────────────┘
                         （通常 2-4 轮）
```

### 六步循环

**1. 渲染 & 查看** — 运行渲染脚本，用 Read 工具查看 PNG。

**2. 对照设计意图审计** — 不急着找 bug，先问：
- 视觉结构是否匹配计划中的概念结构？
- 每个 section 是否用了预期的视觉模式？
- 视觉层级是否正确（hero 元素突出，辅助元素缩小）？

**3. 检查视觉缺陷**：
- 文字被容器裁切或溢出
- 元素相互重叠
- 箭头穿过其他元素
- 标签悬浮，没有明确锚定
- 间距不均匀
- 构图不平衡（一侧拥挤，一侧空旷）

**4. 修复 JSON** — 调整坐标、加宽容器、添加箭头中间点、重定位标签。

**5. 重新渲染 & 查看**。

**6. 重复** — 直到图表通过所有检查。

### 停止条件

SKILL.md 给出的标准很直观：

> You'd be comfortable showing it to someone without caveats.

翻译：你愿意不带任何" disclaimer "地展示给别人看。

## 依赖管理

```toml
# pyproject.toml
[project]
requires-python = ">=3.11"
dependencies = ["playwright>=1.40.0"]
```

仅一个依赖。使用 [uv](https://github.com/astral-sh/uv) 作为包管理器：

```bash
uv sync                              # 安装依赖
uv run playwright install chromium    # 安装 Chromium
uv run python render_excalidraw.py    # 渲染
```

没有 npm，没有 node_modules，没有 package-lock.json 的依赖地狱。
