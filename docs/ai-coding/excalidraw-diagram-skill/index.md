---
title: Excalidraw 图表技能概览
description: 一个用提示词驱动 AI 生成 Excalidraw 图表的 Claude Code Skill
---

# Excalidraw 图表技能概览

> 一个用提示词驱动 AI 生成 Excalidraw 图表的 Claude Code Skill

## 这是什么

[Excalidraw Diagram Skill](https://github.com/coleam00/excalidraw-diagram-skill) 是一个 Claude Code Skill，让 AI 编程助手能生成高质量 Excalidraw 图表。

这个项目最特别的地方：**553 行 SKILL.md 就是整个"应用"**，唯一可执行代码是 189 行 Python 渲染脚本。没有 package.json，没有 TypeScript，没有构建流程。

## 项目结构

```
excalidraw-diagram-skill/
  SKILL.md                    # 核心指令文档（553 行）= 整个"应用"
  references/
    color-palette.md          # 语义色彩方案（唯一需要改的品牌定制文件）
    element-templates.md      # 6 种 Excalidraw 元素的 JSON 模板
    json-schema.md            # Excalidraw JSON 格式参考
    render_excalidraw.py      # 渲染脚本（189 行 Python）
    render_template.html      # 浏览器端渲染模板（56 行 HTML）
    pyproject.toml            # Python 依赖声明（仅 playwright）
```

## 为什么值得关注

**提示词即软件**。这个项目展示了提示词工程作为软件开发的新范式——553 行自然语言指令定义了完整的"应用逻辑"，AI 就是运行时。

**AI 自我验证闭环**。内置的 Render-View-Fix 循环让 AI 能"看见"自己生成的图表，发现布局问题并修复，通常迭代 2-4 轮。

**零代码定制**。改一个 `color-palette.md` 文件就能换掉所有图表的品牌风格，不需要碰其他任何文件。

## 核心概念

| 概念 | 说明 |
|------|------|
| **Visual Argument** | 图表应该论证，不是展示——形状即含义 |
| **Evidence Artifacts** | 技术图表中嵌入真实代码片段、JSON 示例等具体证据 |
| **Multi-Zoom** | 同时提供全局概览、分组边界、细节三个缩放层级 |
| **Render-View-Fix** | 渲染 → 查看图片 → 修复 JSON → 重复的视觉验证循环 |
| **Section-by-Section** | 大型图表分段生成，绕过 AI 输出 token 限制 |

## 官方资源

- GitHub 仓库：[coleam00/excalidraw-diagram-skill](https://github.com/coleam00/excalidraw-diagram-skill)

## 学习路径

::: tip 推荐阅读顺序
1. [提示词即软件](./prompt-as-software) — 理解 SKILL.md 如何成为完整应用
2. [可视化论证方法论](./visual-argument-methodology) — 理解图表设计的核心哲学
3. [渲染管线](./render-pipeline) — 理解 AI 如何"看见"自己生成的图表
4. [大型图表策略](./large-diagram-strategy) — 理解在 AI 输出限制内生成复杂图表的工程策略
:::
