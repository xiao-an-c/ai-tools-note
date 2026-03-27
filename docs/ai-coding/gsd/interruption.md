---
title: 会话中断与恢复
description: 网络中断或卡顿时如何保存和恢复工作进度
---

# 会话中断与恢复

## 为什么会话会中断

日常开发中，会话中断是常见的情况：

- 网络不稳定导致连接断开
- Claude Code 卡住无响应
- 长时间运行后上下文耗尽
- 电脑休眠或重启
- 上下文窗口达到上限

GSD 的设计充分考虑了这些问题。所有状态都存储在文件系统中，不会因为会话中断而丢失。

---

## 中断前的准备

### 重要原则

> **先保存，再中断**。不要依赖"应该没事"。

### 正在执行任务时

如果你正在 `/gsd:execute-phase` 中：

```bash
# Ctrl+C 或直接告诉 Claude：
"停一下，等会继续"

# GSD 会：
# 1. 保存当前进度到 STATE.md
# 2. 记录已完成的任务
# 3. 记录未完成的任务
```

### 即将离开时

```bash
# 使用暂停工作命令
/gsd:pause-work
```

这会创建：
- `HANDOFF.json` - 结构化的交接文档
- `continue-here.md` - 继续工作的具体指引

---

## 中断后如何恢复

### 情况一：只是断了一会儿

```bash
# 直接询问进度
/gsd:progress
```

系统会显示：
- 当前在哪个阶段
- 完成了哪些任务
- 下一步该做什么

```bash
# 继续当前的工作
/gsd:next
```

### 情况二：开了新会话

```bash
# 恢复完整上下文
/gsd:resume-work
```

这会读取上次保存的所有状态，包括：
- 当前阶段和任务
- 已做的决策
- 未解决的问题

### 情况三：上下文窗口满了

```bash
# 清理当前上下文
/clear

# 然后恢复状态
/gsd:resume-work
```

GSD 的状态都在文件中，不会因为 `/clear` 丢失。

---

## 调试卡住的情况

### Claude Code 完全无响应

1. **等待**：有时候只是网络慢
2. **Ctrl+C**：终止当前操作
3. **新会话恢复**：
   ```bash
   /gsd:resume-work
   /gsd:progress
   ```

### 某个任务一直失败

```bash
# 系统化调试
/gsd:debug "具体问题描述"
```

GSD 会：
1. 收集症状信息
2. 提出假设
3. 验证假设
4. 生成修复方案

### 执行过程中断了

如果 `/gsd:execute-phase` 执行到一半中断：

1. **不要慌张**
2. **检查状态**：
   ```bash
   /gsd:progress
   ```
3. **查看已完成的工作**：
   ```bash
   git log --oneline
   ```
4. **继续执行**或**重新执行**失败的阶段

---

## 状态文件的作用

GSD 的所有状态都存储在 `.planning/` 目录中：

```
.planning/
├── STATE.md           # 当前进度（关键！）
├── ROADMAP.md         # 阶段规划
├── config.json        # 配置
└── phases/
    └── 01-xxx/
        ├── 01-01-PLAN.md       # 计划（可能已完成部分）
        ├── 01-01-SUMMARY.md    # 已完成任务的结果
        └── ...
```

### 关键文件说明

| 文件 | 作用 | 中断后会丢失吗 |
|------|------|---------------|
| `STATE.md` | 当前进度 | **不会**，文件存储 |
| `ROADMAP.md` | 阶段规划 | **不会**，文件存储 |
| `phases/XX/PLAN.md` | 任务计划 | **不会**，文件存储 |
| `phases/XX/SUMMARY.md` | 已完成任务 | **不会**，完成后写入 |
| git commits | 代码变更 | **不会**，已提交 |

---

## 常见场景处理

### 场景一：执行了一半

```bash
# 查看当前状态
/gsd:progress

# 查看 git 记录
git log --oneline

# 如果部分任务完成，可以继续
/gsd:execute-phase 1

# 或者重新执行失败的阶段
/gsd:execute-phase 1 --resume
```

### 场景二：计划阶段中断

```bash
# 查看已生成的计划
ls .planning/phases/01-xxx/

# 如果计划已生成，可以继续执行
/gsd:execute-phase 1

# 如果计划不完整，重新规划
/gsd:plan-phase 1
```

### 场景三：讨论阶段中断

```bash
# 查看已记录的上下文
cat .planning/phases/01-xxx/01-CONTEXT.md

# 继续讨论
/gsd:discuss-phase 1
```

### 场景四：完全不知道在哪

```bash
# 综合诊断
/gsd:progress

# 查看详细状态
/gsd:health

# 如果状态损坏，尝试修复
/gsd:health --repair
```

---

## 预防措施

### 1. 定期检查进度

```bash
/gsd:progress
```

每隔一段时间运行一下，确保状态是最新的。

### 2. 重要操作前暂停

```bash
/gsd:pause-work
```

在离开或可能中断前执行。

### 3. 频繁提交代码

```bash
# GSD 会自动做原子提交
# 但你也可以手动提交
git add .
git commit -m "备份：正在做 xxx"
```

### 4. 监控上下文使用

当看到上下文警告时：

```
[CONTEXT WARNING] 剩余 25%
```

考虑：
- `/clear` 清理当前上下文
- `/gsd:pause-work` 保存状态
- 开始新会话

---

## 命令速查

| 场景 | 命令 |
|------|------|
| 查看当前进度 | `/gsd:progress` |
| 恢复完整上下文 | `/gsd:resume-work` |
| 保存并准备中断 | `/gsd:pause-work` |
| 诊断状态健康 | `/gsd:health` |
| 修复状态问题 | `/gsd:health --repair` |
| 继续下一步 | `/gsd:next` |
| 系统化调试 | `/gsd:debug "问题描述"` |

---

## 总结

```
中断前 → /gsd:pause-work（保存状态）
    │
    → 网络恢复或新会话
    │
恢复 → /gsd:resume-work（恢复上下文）
    │
查看 → /gsd:progress（确认当前状态）
    │
继续 → /gsd:next 或继续当前阶段
```

**记住**：GSD 的状态都在文件中，不会因为会话中断而丢失。
