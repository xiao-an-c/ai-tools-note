---
title: 提示词即软件：SKILL.md 如何成为一个完整应用
description: 553 行 Markdown 如何替代 package.json、TypeScript 和构建流程
---

# 提示词即软件

在这个项目里，SKILL.md 不是文档，是源代码。

## 传统软件 vs 提示词软件

| 维度 | 传统软件 | 这个项目 |
|------|---------|---------|
| 入口 | `index.ts` / `main.py` | `SKILL.md`（553 行） |
| 模块 | 文件 + import | Markdown 章节顺序 |
| 依赖管理 | `package.json` / `requirements.txt` | `pyproject.toml`（仅渲染脚本用） |
| 配置 | JSON / YAML / .env | `references/color-palette.md` |
| 标准库 | node_modules / venv | `references/*.md` |
| 构建流程 | webpack / tsc / pip | 不需要 |
| 运行时 | Node / Python / JVM | LLM（Claude） |
| 测试 | jest / pytest | 27 项 Quality Checklist |

没有运行时编译，没有版本冲突，没有热更新。LLM 读取 SKILL.md，按指令行动——这就是整个"程序"的执行过程。

## Skill 系统加载机制

Claude Code 的 Skill 本质上是**结构化的 system prompt 片段**。加载流程：

```
SKILL.md frontmatter (name + description)
  → 用户请求匹配 description 中的触发条件
  → Claude Code 将 SKILL.md 全文注入为上下文
  → AI 按 SKILL.md 中的指令执行任务
```

SKILL.md 的 YAML frontmatter 声明了身份：

```yaml
---
name: excalidraw-diagram
description: Create Excalidraw diagram JSON files that make visual arguments.
---
```

当用户说"帮我画一个架构图"时，Claude Code 匹配到这个 description，将 SKILL.md 的 553 行指令全部加载到上下文中。AI 随后的每一步操作——深度评估、概念映射、JSON 生成、渲染验证——都受这些指令约束。

## SKILL.md 的内部架构

SKILL.md 不是随意堆砌的说明文档，它有清晰的控制流：

```
Core Philosophy          ← 全局原则（图表应该论证）
    ↓
Depth Assessment         ← 第一个分支点（Simple vs Comprehensive）
    ↓
Research Mandate         ← 条件执行（仅 Comprehensive 路径）
    ↓
Evidence Artifacts       ← 条件执行（仅 Comprehensive 路径）
    ↓
Multi-Zoom Architecture  ← 条件执行（仅 Comprehensive 路径）
    ↓
Container Discipline     ← 通用规则
    ↓
Design Process           ← 6 步工作流（顺序执行）
    ↓
Visual Pattern Library   ← 查找表（概念 → 视觉模式）
    ↓
Shape Meaning            ← 查找表（概念类型 → 形状）
    ↓
Color as Meaning         ← 引用外部文件（color-palette.md）
    ↓
Quality Checklist        ← 27 项验收标准
    ↓
Render & Validate        ← 强制执行的渲染循环
```

每个章节就是一个"函数"。顺序很重要——先判断深度，再做研究，再设计，最后生成。`MANDATORY` 标记是强制执行点，相当于代码中的 `assert`。

## 控制流分析

SKILL.md 中用自然语言实现了典型的编程控制结构：

**分支**（Depth Assessment）：

> "Before anything else, determine if this needs to be Simple/Conceptual or Comprehensive/Technical."

这是一个显式的 if/else。Simple 路径跳过研究、证据工件、多缩放等步骤；Comprehensive 路径全部执行。

**强制执行**（Render & Validate）：

> "After generating the JSON, you MUST run the render-view-fix loop until the diagram looks right. This is not optional."

`MANDATORY` 和 `not optional` 相当于代码中的硬约束，不接受跳过。

**验收测试**（Quality Checklist）：

27 项检查分为 5 组：

| 组 | 项数 | 等价于 |
|----|------|--------|
| Depth & Evidence | 5 | 功能测试 |
| Conceptual | 4 | 设计评审 |
| Container Discipline | 3 | 代码规范检查 |
| Structural | 3 | 集成测试 |
| Technical | 5 | 单元测试 |
| Visual Validation | 7 | E2E 测试（需渲染后执行） |

最后 7 项**必须渲染后才能检查**——这就是渲染管线存在的根本原因。

## references/ 作为标准库

```
references/
  color-palette.md        ← 配置文件 / CSS
  element-templates.md    ← 组件库 / copy-paste boilerplate
  json-schema.md          ← API 文档 / 类型定义
  render_excalidraw.py    ← 唯一的"运行时代码"
  render_template.html    ← 运行时依赖
```

- `color-palette.md` 是唯一面向用户的配置文件，改它就能换品牌风格
- `element-templates.md` 提供 6 种元素类型的 JSON 模板，AI 生成时直接 copy-paste 再修改坐标和颜色
- `json-schema.md` 定义 Excalidraw JSON 的数据结构，相当于类型定义文档

SKILL.md 中明确指示 AI 在生成前先读取这些文件：

> "Read it before generating any diagram and use it as the single source of truth for all color choices."
> "See references/element-templates.md for copy-paste JSON templates."

## 为什么这种方式有效

**LLM 的推理能力让自然语言指令成为可执行逻辑。** Claude 不只是"理解"这些指令，它能在每一步做出判断——该用 Fan-Out 还是 Timeline？这个概念需要 Evidence Artifact 吗？文字溢出了容器吗？这些都需要理解语义后的推理。

**约束越多，输出越稳定。** 553 行约束 vs 10 行约束，效果天差地别。详细的模式库、明确的禁止事项、具体的数值（如 `<30% of text elements should be inside containers`）让 AI 的输出从"随机猜测"变成"有章可循"。

**维护成本极低。** 改设计规则就是改文本。不需要重构代码、不需要跑测试、不需要发版。

## 局限性

- **没有类型安全**：AI 可能生成不合法的 JSON（靠渲染脚本的 validate 函数兜底）
- **没有自动化测试**：27 项质量清单依赖 AI 自觉检查
- **依赖 LLM 指令遵循能力**：不同模型、不同 prompt 长度下，行为可能不一致
- **Prompt drift 风险**：长上下文中，AI 可能"遗忘"前面章节的规则
