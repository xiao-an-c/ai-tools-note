---
title: GSD 安装配置
---

# 安装配置

## 快速安装

```bash
npx get-shit-done-cc@latest
```

安装器会提示你选择：
1. **运行时**：Claude Code、OpenCode、Gemini、Codex、Copilot、Cursor、Antigravity
2. **安装位置**：全局（所有项目）或本地（仅当前项目）

## 非交互式安装

```bash
# Claude Code 全局安装
npx get-shit-done-cc --claude --global   # 安装到 ~/.claude/

# Claude Code 项目本地安装（推荐）
npx get-shit-done-cc --claude --local    # 安装到 ./.claude/
```

## 验证安装

```bash
# 在 Claude Code 中输入
/gsd:help
```

如果看到帮助信息，说明安装成功。

## 推荐：跳过权限确认模式

GSD 的设计目标是无摩擦自动化。运行 Claude Code 时建议使用：

```bash
claude --dangerously-skip-permissions
```

::: tip 为什么推荐这个模式
连 `date` 和 `git commit` 都要来回确认 50 次，整个体验就废了。这才是 GSD 的预期用法。
:::

### 替代方案：细粒度权限

如果你不想使用 `--dangerously-skip-permissions`，可以在 `.claude/settings.json` 中配置：

```json
{
  "permissions": {
    "allow": [
      "Bash(date:*)",
      "Bash(echo:*)",
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(git status:*)",
      "Bash(git log:*)",
      "Bash(git diff:*)"
    ]
  }
}
```

## 保持更新

GSD 迭代很快，建议定期更新：

```bash
npx get-shit-done-cc@latest
```

## 卸载

```bash
# 全局安装
npx get-shit-done-cc --claude --global --uninstall

# 本地安装
npx get-shit-done-cc --claude --local --uninstall
```

## 配置文件

GSD 将项目设置保存在 `.planning/config.json`。可以通过 `/gsd:settings` 修改。

### 核心设置

| 设置 | 选项 | 默认值 | 作用 |
|------|------|--------|------|
| `mode` | `yolo`, `interactive` | `interactive` | 自动批准还是每步确认 |
| `granularity` | `coarse`, `standard`, `fine` | `standard` | phase 粒度 |

### 模型 Profile

控制各代理使用的 Claude 模型：

| Profile | Planning | Execution | Verification |
|---------|----------|-----------|--------------|
| `quality` | Opus | Opus | Sonnet |
| `balanced`（默认） | Opus | Sonnet | Sonnet |
| `budget` | Sonnet | Sonnet | Haiku |
| `inherit` | 继承 | 继承 | 继承 |

切换方式：

```bash
/gsd:set-profile budget
```

### 工作流代理设置

| 设置 | 默认值 | 作用 |
|------|--------|------|
| `workflow.research` | `true` | 每个 phase 规划前先调研 |
| `workflow.plan_check` | `true` | 执行前验证计划 |
| `workflow.verifier` | `true` | 执行后确认交付 |
| `workflow.auto_advance` | `false` | 自动串联各阶段 |
