---
title: .planning/ 目录结构
description: 了解 GSD 生成的各种文件及其作用
---

# .planning/ 目录结构

GSD 的所有状态和规划文档都存放在 `.planning/` 目录中。这是 GSD 的"大脑"，存储着项目的一切记忆。

## 目录总览

```
.planning/
├── PROJECT.md              # 项目愿景
├── REQUIREMENTS.md         # 需求文档
├── ROADMAP.md              # 路线图
├── STATE.md                # 当前状态
├── config.json             # 配置文件
├── MILESTONES.md           # 里程碑归档
├── research/               # 领域研究
├── codebase/               # 代码库分析
├── phases/                 # 阶段规划
├── quick/                  # 快速任务
├── todos/                  # 待办事项
├── debug/                  # 调试会话
└── seeds/                  # 未来想法
```

---

## 核心文件

### PROJECT.md

**项目愿景文档**，定义项目的核心信息：
- 项目目标和价值主张
- 技术栈选择
- 约束条件
- 关键决策

**何时创建**：`/gsd:new-project`

**谁会读取**：所有代理都会加载此文件

```markdown
# Project: My App

## Vision
构建一个...

## Tech Stack
- Frontend: React
- Backend: Node.js

## Constraints
- 必须支持移动端
```

### REQUIREMENTS.md

**需求文档**，定义功能范围：
- v1 必须有的功能
- v2 可以有的功能
- 明确不在范围内的功能

**何时创建**：`/gsd:new-project`

```markdown
# Requirements

## v1 (MVP)
- [ ] 用户登录
- [ ] 数据展示

## v2
- [ ] 数据导出
- [ ] 高级搜索

## Out of Scope
- 移动端原生 App
```

### ROADMAP.md

**路线图**，定义开发阶段：
- 阶段编号和名称
- 阶段状态（pending/in_progress/completed）
- 阶段描述

**何时创建**：`/gsd:new-project`

```markdown
# Roadmap

## Phase 01: User Authentication [completed]
用户认证系统

## Phase 02: Data Management [in_progress]
数据管理功能

## Phase 03: Reporting [pending]
报表生成
```

### STATE.md

**状态文档**，记录项目当前状态：
- 当前位置（哪个阶段、哪个计划）
- 已做出的决策
- 当前的阻塞
- 进度指标

**何时更新**：每个工作流步骤完成后

```markdown
# State

## Current Position
- Phase: 02
- Plan: 02-03

## Decisions
- 使用 JWT 进行认证
- 使用 PostgreSQL 存储

## Blockers
- 等待 API 密钥审批

## Metrics
- Phases completed: 1
- Plans executed: 3
```

### config.json

**配置文件**，控制 GSD 的行为。详见[配置文件详解](./configuration)。

---

## 研究目录

### research/

**领域研究**，从 `/gsd:new-project` 生成：

```
research/
├── SUMMARY.md      # 研究摘要
├── STACK.md        # 技术栈研究
├── FEATURES.md     # 功能研究
├── ARCHITECTURE.md # 架构研究
└── PITFALLS.md     # 潜在坑点
```

### codebase/

**代码库分析**，从 `/gsd:map-codebase` 生成（用于现有项目）：

```
codebase/
├── STACK.md         # 技术栈
├── ARCHITECTURE.md  # 架构模式
├── CONVENTIONS.md   # 代码约定
├── CONCERNS.md      # 风险点
├── STRUCTURE.md     # 目录结构
├── TESTING.md       # 测试情况
└── INTEGRATIONS.md  # 集成点
```

---

## 阶段目录

### phases/

**每个阶段的详细规划**：

```
phases/
└── 02-data-management/
    ├── 02-CONTEXT.md       # 用户偏好（来自 discuss-phase）
    ├── 02-RESEARCH.md      # 阶段研究（来自 plan-phase）
    ├── 02-01-PLAN.md       # 执行计划 1
    ├── 02-02-PLAN.md       # 执行计划 2
    ├── 02-01-SUMMARY.md    # 计划 1 执行结果
    ├── 02-02-SUMMARY.md    # 计划 2 执行结果
    ├── 02-VERIFICATION.md  # 执行后验证
    ├── 02-UI-SPEC.md       # UI 设计合约（前端阶段）
    ├── 02-UI-REVIEW.md     # UI 视觉审计
    └── 02-UAT.md           # 用户验收测试
```

### 文件作用

| 文件 | 创建命令 | 作用 |
|------|----------|------|
| `XX-CONTEXT.md` | `/gsd:discuss-phase` | 记录用户对实现的偏好 |
| `XX-RESEARCH.md` | `/gsd:plan-phase` | 该阶段的技术研究 |
| `XX-YY-PLAN.md` | `/gsd:plan-phase` | 原子化的执行计划 |
| `XX-YY-SUMMARY.md` | `/gsd:execute-phase` | 计划执行的结果 |
| `XX-VERIFICATION.md` | `/gsd:execute-phase` | 执行后的自动验证 |
| `XX-UAT.md` | `/gsd:verify-work` | 用户验收测试结果 |

---

## 其他目录

### quick/

**快速任务**，从 `/gsd:quick` 生成：

```
quick/
└── 250327-abc-add-dark-mode/
    ├── PLAN.md
    └── SUMMARY.md
```

### todos/

**待办事项**，从 `/gsd:add-todo` 生成：

```
todos/
├── pending/
│   └── add-export-feature.md
└── done/
    └── fix-login-bug.md
```

### debug/

**调试会话**，从 `/gsd:debug` 生成：

```
debug/
├── login-500-error.md    # 活跃会话
├── resolved/             # 已解决的会话
└── knowledge-base.md     # 调试知识库
```

### seeds/

**未来想法**，从 `/gsd:plant-seed` 生成：

存放留待未来里程碑实现的想法。

---

## 文件流转关系

```
PROJECT.md ──────────────────────────────► 所有代理
REQUIREMENTS.md ─────────────────────────► Planner, Verifier
ROADMAP.md ──────────────────────────────► Orchestrators
STATE.md ────────────────────────────────► 所有代理
CONTEXT.md ──────────────────────────────► Researcher, Planner, Executor
RESEARCH.md ─────────────────────────────► Planner, Plan Checker
PLAN.md ─────────────────────────────────► Executor, Plan Checker
SUMMARY.md ──────────────────────────────► Verifier, State tracking
```

---

## 私有化设置

如果不想把 `.planning/` 提交到 git：

1. 在 `.gitignore` 中添加：
   ```
   .planning/
   ```

2. 设置配置：
   ```json
   {
     "planning": {
       "commit_docs": false,
       "search_gitignored": true
     }
   }
   ```

3. 如果之前已跟踪：
   ```bash
   git rm -r --cached .planning/
   ```
