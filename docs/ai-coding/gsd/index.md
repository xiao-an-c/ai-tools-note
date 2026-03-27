---
title: GSD (Get Shit Done) 概览
description: 让 Claude Code 变得可靠的上下文工程系统
---

# GSD (Get Shit Done)

**一个轻量但强大的元提示、上下文工程与规格驱动开发系统，适用于 Claude Code。**

## 解决什么问题

### Context Rot（上下文腐烂）

Claude Code 非常强大，但随着上下文窗口被填满，输出质量会逐步劣化。这就是 **context rot** 问题。

GSD 通过以下方式解决这个问题：
- **上下文工程**：精确控制 Claude 接收的信息
- **多代理编排**：用新的子代理上下文执行任务
- **原子化任务**：每个计划足够小，在全新上下文中执行

### Vibecoding 的质量不稳定

你描述需求，AI 生成代码，结果往往是质量不稳定、规模一上来就散架的垃圾。

GSD 让你只要描述想法，系统会自动提取它需要知道的一切，然后让 Claude Code 去干活。

## 核心概念

### 1. 规格驱动开发

不是直接写代码，而是：
1. **定义** → 写清楚你要什么
2. **规划** → 拆分成可执行的任务
3. **执行** → 按计划实现
4. **验证** → 确认结果符合预期

### 2. 上下文工程

GSD 会管理 Claude 完成工作所需的一切上下文：

| 文件 | 作用 |
|------|------|
| `PROJECT.md` | 项目愿景，始终加载 |
| `REQUIREMENTS.md` | v1/v2 范围定义 |
| `ROADMAP.md` | 阶段规划 |
| `STATE.md` | 决策、阻塞、当前位置 |
| `PLAN.md` | 原子化任务计划 |
| `SUMMARY.md` | 执行摘要 |

### 3. 多代理编排

每个阶段都由一个轻量 orchestrator 拉起专用代理：
- **研究代理**：调研技术栈、功能、架构
- **规划代理**：生成原子化任务计划
- **执行代理**：在全新上下文中实现代码
- **验证代理**：确认交付符合目标

### 4. Wave 并行执行

计划按依赖关系分组为不同的 "wave"：
- 同一 wave 内的计划并行执行
- 不同 wave 之间顺序推进
- 每个执行代理都有全新的 20 万 token 上下文

## 适合谁用

适合那些想把自己的需求说明白，然后让系统正确构建出来的人。

**不适合**：假装自己在运营一个 50 人工程组织的人。

## 官方资源

- [GitHub 仓库](https://github.com/gsd-build/get-shit-done)
- [npm 包](https://www.npmjs.com/package/get-shit-done-cc)
- [Discord 社区](https://discord.gg/gsd)

## 学习路径

1. [安装配置](./installation) - 安装 GSD 到你的项目
2. [核心工作流](./workflow) - 理解 discuss → plan → execute → verify 循环
3. [常用命令](./commands) - 掌握日常使用的命令
4. [实战示例](./examples) - 通过示例学习
5. [技巧 & 踩坑](./tips) - 最佳实践
