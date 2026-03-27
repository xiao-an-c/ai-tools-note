---
title: GSD 代理系统详解
description: 了解 GSD 中各个代理的角色和职责
---

# GSD 代理系统详解

GSD 使用**多代理编排**模式。一个轻量的编排器（Orchestrator）负责拉起专用代理，汇总结果，再路由到下一步。

## 代理分类

| 类别 | 代理 | 并行方式 |
|------|------|----------|
| **研究型** | project-researcher, phase-researcher, ui-researcher, advisor-researcher | 4 个并行 |
| **综合型** | research-synthesizer | 顺序（研究完成后） |
| **规划型** | planner, roadmapper | 顺序 |
| **检查型** | plan-checker, integration-checker, ui-checker, nyquist-auditor | 顺序（最多 3 轮迭代） |
| **执行型** | executor | Wave 内并行，Wave 间顺序 |
| **验证型** | verifier | 顺序（执行完成后） |
| **映射型** | codebase-mapper | 4 个并行 |
| **调试型** | debugger | 顺序（交互式） |

---

## 研究型代理

### gsd-project-researcher

**项目研究员**，在 `/gsd:new-project` 时使用。

**职责**：研究项目的领域知识
- **STACK.md** - 技术栈研究
- **FEATURES.md** - 功能研究
- **ARCHITECTURE.md** - 架构研究
- **PITFALLS.md** - 潜在坑点

**并行模式**：4 个研究员同时工作，各自负责一个方向。

### gsd-phase-researcher

**阶段研究员**，在 `/gsd:plan-phase` 时使用。

**职责**：研究特定阶段的实现方式
- 调研技术方案
- 分析最佳实践
- 识别潜在风险

### gsd-ui-researcher

**UI 研究员**，在 `/gsd:ui-phase` 时使用。

**职责**：生成 UI 设计合约（UI-SPEC.md）
- 分析 UI 需求
- 设计组件结构
- 定义交互模式

### gsd-advisor-researcher

**顾问研究员**，在 `/gsd:discuss-phase` 时使用。

**职责**：研究灰区决策的权衡
- 分析不同方案的优劣
- 提供建议

---

## 综合型代理

### gsd-research-synthesizer

**研究综合员**，在研究型代理完成后使用。

**职责**：汇总研究结果
- 整合多个研究员的输出
- 去重和结构化
- 生成 SUMMARY.md

---

## 规划型代理

### gsd-planner

**规划员**，在 `/gsd:plan-phase` 时使用。

**职责**：创建原子化执行计划
- 读取 CONTEXT.md 和 RESEARCH.md
- 生成 2-3 个 PLAN.md 文件
- 每个计划足够小，可在新上下文中执行

**输出**：`{phase}-{N}-PLAN.md`

### gsd-roadmapper

**路线图员**，在 `/gsd:new-project` 时使用。

**职责**：创建项目路线图
- 分析需求
- 拆分为阶段
- 生成 ROADMAP.md

---

## 检查型代理

### gsd-plan-checker

**计划检查员**，在 `/gsd:plan-phase` 时使用。

**职责**：验证计划质量
- 检查计划是否完整
- 验证计划是否能达成阶段目标
- 最多 3 轮迭代

### gsd-integration-checker

**集成检查员**，验证跨阶段集成。

**职责**：
- 检查阶段之间的连接
- 验证端到端流程

### gsd-ui-checker

**UI 检查员**，在 `/gsd:ui-phase` 时使用。

**职责**：验证 UI 设计合约质量

### gsd-nyquist-auditor

**Nyquist 审计员**，验证测试覆盖。

**职责**：
- 检查测试覆盖
- 生成缺失的测试

---

## 执行型代理

### gsd-executor

**执行员**，在 `/gsd:execute-phase` 时使用。

**职责**：执行具体的实现计划
- 读取 PLAN.md
- 编写代码
- 提交原子化 commit
- 生成 SUMMARY.md

**特点**：
- 每个执行员获得**全新的 200K token 上下文**
- 不受主会话历史污染
- 专注于单一计划

**Wave 执行模式**：
```
Wave 1 (并行): Plan 01, Plan 02
    ↓
Wave 2 (并行): Plan 03, Plan 04  (依赖 Wave 1)
    ↓
Wave 3: Plan 05  (依赖 Wave 2)
```

---

## 验证型代理

### gsd-verifier

**验证员**，在 `/gsd:execute-phase` 完成后使用。

**职责**：验证执行结果是否符合阶段目标
- 检查代码是否真实存在
- 验证功能是否实现
- 生成 VERIFICATION.md

---

## 映射型代理

### gsd-codebase-mapper

**代码库映射员**，在 `/gsd:map-codebase` 时使用。

**职责**：分析现有代码库
- **tech** - 技术栈
- **arch** - 架构模式
- **quality** - 代码质量
- **concerns** - 风险点

**并行模式**：4 个映射员同时工作。

---

## 调试型代理

### gsd-debugger

**调试员**，在 `/gsd:debug` 时使用。

**职责**：系统化调试问题
- 收集症状
- 提出假设
- 验证假设
- 生成修复方案

**特点**：
- 交互式工作
- 状态持久化
- 可中断后恢复

---

## Orchestrator → Agent 模式

```
Orchestrator (workflow .md)
    │
    ├── 1. 加载上下文
    │   gsd-tools.cjs init <workflow> <phase>
    │
    ├── 2. 解析模型
    │   gsd-tools.cjs resolve-model <agent-name>
    │
    ├── 3. 派发代理
    │   Task/SubAgent call
    │   ├── Agent prompt (agents/*.md)
    │   ├── Context payload
    │   ├── Model assignment
    │   └── Tool permissions
    │
    ├── 4. 收集结果
    │
    └── 5. 更新状态
        gsd-tools.cjs state update
```

---

## 代理与模型 Profile

不同代理使用不同的模型级别：

| 代理 | quality | balanced | budget |
|------|---------|----------|--------|
| gsd-planner | Opus | Opus | Sonnet |
| gsd-executor | Opus | Sonnet | Sonnet |
| gsd-verifier | Sonnet | Sonnet | Haiku |
| gsd-researcher | Opus | Sonnet | Haiku |
| gsd-debugger | Opus | Sonnet | Sonnet |

**设计哲学**：
- **规划**用更强的模型（需要推理）
- **执行**用平衡的模型（计划已包含推理）
- **验证**用快速的模型（检查性工作）

---

## 代理技能注入

可以为特定代理注入项目特定的指令：

```json
{
  "agent_skills": {
    "gsd-executor": ["skills/testing-standards"],
    "gsd-planner": ["skills/architecture-rules"]
  }
}
```

每个路径必须是一个包含 `SKILL.md` 文件的目录。
