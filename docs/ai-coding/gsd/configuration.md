---
title: GSD 配置文件详解
description: 深入理解 .planning/config.json 的作用和各项配置
---

# GSD 配置文件详解

## 什么是 `.planning/config.json`

`.planning/config.json` 是 GSD 的**项目级配置文件**，控制 GSD 在当前项目中的行为。

### 创建时机

- 运行 `/gsd:new-project` 时自动创建
- 通过 `/gsd:settings` 命令修改

### 文件位置

```
your-project/
├── .planning/
│   ├── config.json      ← 配置文件
│   ├── PROJECT.md
│   ├── ROADMAP.md
│   ├── STATE.md
│   └── phases/
│       └── ...
└── ...
```

## 完整配置示例

```json
{
  "mode": "interactive",
  "granularity": "standard",
  "model_profile": "balanced",
  "model_overrides": {},
  "planning": {
    "commit_docs": true,
    "search_gitignored": false
  },
  "workflow": {
    "research": true,
    "plan_check": true,
    "verifier": true,
    "auto_advance": false,
    "nyquist_validation": true,
    "ui_phase": true,
    "ui_safety_gate": true,
    "node_repair": true,
    "node_repair_budget": 2,
    "research_before_questions": false,
    "discuss_mode": "discuss",
    "skip_discuss": false,
    "text_mode": false
  },
  "hooks": {
    "context_warnings": true,
    "workflow_guard": false
  },
  "parallelization": {
    "enabled": true,
    "plan_level": true,
    "task_level": false,
    "skip_checkpoints": true,
    "max_concurrent_agents": 3,
    "min_plans_for_parallel": 2
  },
  "git": {
    "branching_strategy": "none",
    "phase_branch_template": "gsd/phase-{phase}-{slug}",
    "milestone_branch_template": "gsd/{milestone}-{slug}",
    "quick_branch_template": null
  },
  "gates": {
    "confirm_project": true,
    "confirm_phases": true,
    "confirm_roadmap": true,
    "confirm_breakdown": true,
    "confirm_plan": true,
    "execute_next_plan": true,
    "issues_review": true,
    "confirm_transition": true
  },
  "safety": {
    "always_confirm_destructive": true,
    "always_confirm_external_services": true
  },
  "agent_skills": {}
}
```

---

## 核心设置

### mode（运行模式）

| 值 | 说明 |
|---|---|
| `interactive` | 每一步都需要你确认（默认） |
| `yolo` | 自动批准所有决策 |

```json
{ "mode": "yolo" }  // 适合信任 GSD 自动化的场景
```

### granularity（阶段粒度）

控制 GSD 把项目拆分成多少个阶段：

| 值 | 阶段数量 | 适用场景 |
|---|---------|---------|
| `coarse` | 3-5 个 | 快速原型、小项目 |
| `standard` | 5-8 个 | 正常开发（默认） |
| `fine` | 8-12 个 | 大型项目、生产发布 |

### model_profile（模型配置）

控制各个代理使用哪种 Claude 模型：

| Profile | 规划 | 执行 | 验证 | 适用场景 |
|---------|-----|-----|-----|---------|
| `quality` | Opus | Opus | Sonnet | 关键架构决策、配额充足 |
| `balanced` | Opus | Sonnet | Sonnet | 正常开发（默认） |
| `budget` | Sonnet | Sonnet | Haiku | 高频工作、预算有限 |
| `inherit` | 继承 | 继承 | 继承 | 非 Anthropic 提供商 |

```bash
# 切换模型配置
/gsd:set-profile budget
```

---

## 工作流设置（workflow）

控制 GSD 工作流中各个步骤的开关：

### workflow.research

```json
{ "workflow": { "research": true } }
```

- `true`（默认）：每个阶段规划前先调研领域知识
- `false`：跳过研究步骤

### workflow.plan_check

```json
{ "workflow": { "plan_check": true } }
```

- `true`（默认）：执行前验证计划是否真能达成阶段目标
- `false`：直接执行，不验证

### workflow.verifier

```json
{ "workflow": { "verifier": true } }
```

- `true`（默认）：执行后确认"必须交付项"是否已经落地
- `false`：跳过验证

### workflow.auto_advance

```json
{ "workflow": { "auto_advance": false } }
```

- `true`：自动串联 discuss → plan → execute，中途不停
- `false`（默认）：每个阶段需要手动推进

### workflow.discuss_mode

```json
{ "workflow": { "discuss_mode": "discuss" } }
```

- `discuss`（默认）：逐个提问收集决策
- `assumptions`：先分析代码库生成假设，只让你纠正错误的

### workflow.skip_discuss

```json
{ "workflow": { "skip_discuss": false } }
```

- `true`：完全跳过讨论阶段，从 ROADMAP 直接生成最小 CONTEXT.md
- `false`（默认）：正常进行讨论阶段

---

## 并行化设置（parallelization）

控制执行阶段如何并行运行：

### parallelization.enabled

```json
{ "parallelization": { "enabled": true } }
```

- `true`（默认）：独立计划并行执行
- `false`：顺序执行

### parallelization.max_concurrent_agents

```json
{ "parallelization": { "max_concurrent_agents": 3 } }
```

同时运行的代理数量上限（默认 3）。

### 工作原理

```
┌─────────────────────────────────────────────────────────┐
│  WAVE 1 (parallel)     WAVE 2 (parallel)     WAVE 3     │
│  ┌─────────┐┌─────────┐ ┌─────────┐┌─────────┐┌───────┐ │
│  │ Plan 01 ││ Plan 02 │→│ Plan 03 ││ Plan 04 │→│Plan 05│ │
│  └─────────┘└─────────┘ └─────────┘└─────────┘└───────┘ │
│       同时执行              等待 WAVE 1 完成后执行        │
└─────────────────────────────────────────────────────────┘
```

---

## Git 分支策略（git）

### git.branching_strategy

| 值 | 说明 | 适用场景 |
|---|------|---------|
| `none`（默认） | 不创建分支，直接提交到当前分支 | 单人开发、简单项目 |
| `phase` | 每个阶段创建一个分支 | 需要阶段级代码审查 |
| `milestone` | 整个里程碑使用一个分支 | 发布分支、每个版本一个 PR |

### 分支模板

```json
{
  "git": {
    "phase_branch_template": "gsd/phase-{phase}-{slug}",
    "milestone_branch_template": "gsd/{milestone}-{slug}"
  }
}
```

**模板变量：**
- `{phase}` - 阶段编号（如 `03`）
- `{slug}` - 阶段名称（如 `user-authentication`）
- `{milestone}` - 里程碑名称（如 `v1.0`）

---

## 确认门控（gates）

控制工作流中哪些步骤需要确认：

```json
{
  "gates": {
    "confirm_project": true,      // 确认项目详情
    "confirm_phases": true,       // 确认阶段拆分
    "confirm_roadmap": true,      // 确认路线图
    "confirm_breakdown": true,    // 确认任务分解
    "confirm_plan": true,         // 确认每个计划
    "execute_next_plan": true,    // 执行下一个计划前确认
    "issues_review": true,        // 审查问题后再创建修复计划
    "confirm_transition": true    // 阶段转换前确认
  }
}
```

设置为 `false` 可以跳过对应确认步骤。

---

## 安全设置（safety）

```json
{
  "safety": {
    "always_confirm_destructive": true,        // 确认破坏性操作
    "always_confirm_external_services": true   // 确认外部服务交互
  }
}
```

---

## 代理技能注入（agent_skills）

为特定代理注入项目特定的指令：

```json
{
  "agent_skills": {
    "gsd-executor": ["skills/testing-standards"],
    "gsd-planner": ["skills/architecture-rules"]
  }
}
```

每个路径必须是一个包含 `SKILL.md` 文件的目录。

**支持的代理类型：**
- `gsd-executor` - 执行实现计划
- `gsd-planner` - 创建阶段计划
- `gsd-verifier` - 执行后验证
- `gsd-debugger` - 调试代理
- `gsd-researcher` - 阶段研究

---

## 推荐预设

### 原型开发

```json
{
  "mode": "yolo",
  "granularity": "coarse",
  "model_profile": "budget",
  "workflow": {
    "research": false,
    "plan_check": false,
    "verifier": false
  }
}
```

### 正常开发（默认）

```json
{
  "mode": "interactive",
  "granularity": "standard",
  "model_profile": "balanced",
  "workflow": {
    "research": true,
    "plan_check": true,
    "verifier": true
  }
}
```

### 生产发布

```json
{
  "mode": "interactive",
  "granularity": "fine",
  "model_profile": "quality",
  "workflow": {
    "research": true,
    "plan_check": true,
    "verifier": true
  }
}
```

---

## 修改配置

### 通过命令

```bash
/gsd:settings    # 打开设置界面
```

### 直接编辑

直接编辑 `.planning/config.json` 文件，GSD 会在下次运行时读取新配置。

### 全局默认

在 `~/.gsd/defaults.json` 中设置全局默认值，新项目会自动继承：

```json
{
  "model_profile": "balanced",
  "granularity": "standard"
}
```

---

## 私有规划设置

如果不想把 `.planning/` 目录提交到 git：

1. 设置 `planning.commit_docs: false`
2. 在 `.gitignore` 中添加 `.planning/`
3. 如果之前已跟踪：`git rm -r --cached .planning/`
