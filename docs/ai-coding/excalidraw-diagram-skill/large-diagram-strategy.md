---
title: 大型图表策略：在 AI 输出限制内生成复杂图表
description: 分段生成、命名空间隔离、跨段绑定的工程策略
---

# 大型图表策略

## 核心矛盾

复杂技术图表需要大量 JSON 元素，但 Claude Code 单次输出上限约 **32K token**。

算一笔账：

| 元素类型 | JSON 大小（约） |
|----------|----------------|
| 一个 rectangle（含 bound text） | ~600 字符 |
| 一个 arrow（含 binding） | ~400 字符 |
| 一个 free-floating text | ~300 字符 |

一张综合技术图表通常有 150-200+ 元素。100 个元素就是 40K+ 字符，轻松超过 32K token 限制。一次性生成必然被截断，产生无效 JSON。

## 分段生成策略

SKILL.md 的解法是**增量构建**——每次只生成一个 section：

### Phase 1：逐段构建

```
第 1 次编辑：创建基础文件 + Section 1 元素
第 2 次编辑：追加 Section 2 元素
第 3 次编辑：追加 Section 3 元素
...
```

每次编辑只处理一个 section，有时间思考布局、间距和与已有内容的连接。这不是妥协，是刻意设计——SKILL.md 明确说：

> Even if it didn't [hit the limit], generating everything at once leads to worse quality. Section-by-section is better in every way.

### Phase 2：全局审查

所有 section 完成后，通读完整 JSON：

- 跨 section 的箭头绑定是否双向正确？
- 整体间距是否平衡（没有一侧拥挤另一侧空旷）？
- 所有 ID 和 binding 引用的元素是否都存在？

### Phase 3：渲染验证

运行 render-view-fix 循环，检查跨 section 的视觉问题（间距、对齐、构图平衡）。

```
分段构建 → 全局审查 → 渲染验证
   ↓           ↓          ↓
 局部正确    全局一致    视觉正确
```

## 命名空间隔离

每个 section 使用独立的 seed 编号范围，避免 ID 碰撞：

```
Section 1: seed 100xxx
Section 2: seed 200xxx
Section 3: seed 300xxx
```

同时使用**描述性字符串 ID**：

```json
// 好的 ID — 从 JSON 就能理解元素用途
{ "id": "trigger_rect" }
{ "id": "arrow_fan_left" }
{ "id": "api_response_text" }

// 差的 ID — 无意义
{ "id": "abc123" }
{ "id": "el_456" }
```

描述性 ID 让跨 section 引用可读、可调试。当你看到 `"endBinding": {"elementId": "trigger_rect"}` 时，不需要回溯就能理解这个箭头连到哪里。

## 跨段双向绑定

Excalidraw 的绑定是双向的：

- **箭头端**声明 `startBinding` / `endBinding`（指向源/目标元素）
- **容器端**声明 `boundElements` 数组（指向绑定的文本/箭头子元素）

当 Section 2 的箭头需要连接 Section 1 的元素时，AI 必须：

1. 在 Section 2 的箭头 JSON 中设置 `endBinding.elementId` 指向 Section 1 的元素
2. **同时**修改 Section 1 元素的 `boundElements` 数组，添加对 Section 2 箭头的引用

这是一个需要"回溯修改已有内容"的操作——AI 必须记住前面的元素 ID，并在后面的编辑中正确更新。

## Section 划分原则

围绕自然的视觉分组划分：

| Section | 典型内容 |
|---------|---------|
| 1 | 入口 / 触发点 |
| 2 | 第一个决策或路由 |
| 3 | 主要内容（hero section，通常是最大的单个 section） |
| 4-N | 剩余阶段、输出等 |

每个 section 应该**独立可理解**——有自己的元素、内部箭头、对相邻 section 的跨段引用。

## 明确禁止的做法

SKILL.md 列出了三条"不要"：

| 禁止 | 原因 |
|------|------|
| 一次性生成整个图表 | 必然被截断，产生无效 JSON |
| 用 coding agent 生成 JSON | Agent 缺少 Skill 规则的完整上下文，协调开销抵消收益 |
| 写 Python 生成脚本 | 模板化 + 坐标计算增加了间接层，调试更难 |

第三条值得展开。写一个 Python 脚本自动生成矩形和箭头，看起来很工程化，但实际上：

- 坐标计算逻辑本身需要调试
- 模板化意味着牺牲灵活性（每个元素应该有独特的布局考量）
- 出问题时需要同时调试 Python 逻辑和 JSON 结构
- 手工 JSON + 描述性 ID 更直接、更可维护

## 与增量构建的类比

这个策略本质上是软件工程中**增量构建**思想在 AI 生成领域的应用：

| 软件工程 | 图表生成 |
|----------|---------|
| 原子提交 | 每个 section 一次编辑 |
| CI 检查 | 全局审查（ID 引用、绑定一致性） |
| E2E 测试 | 渲染验证（render-view-fix 循环） |
| 代码审查 | 视觉审计（对照设计意图） |

每个 section 就是一个原子单位，独立生成但必须与整体协调。全局审查是"集成测试"，渲染验证是"E2E 测试"。这种将大任务分解为可控单元的思想，与 GSD 的原子化任务设计异曲同工。
