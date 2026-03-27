---
title: GSD 技巧 & 踩坑
---

# 技巧 & 踩坑

## 最佳实践

### 1. 始终使用跳过权限模式

```bash
claude --dangerously-skip-permissions
```

这是 GSD 的预期用法。频繁确认会破坏自动化体验。

### 2. 用好讨论阶段

`/gsd:discuss-phase` 是你塑造实现方式的机会：

- **不要跳过**：跳过它，拿到的是合理默认值；用好它，拿到的是 **你的** 方案
- **具体回答**：关于布局、交互、错误处理的问题，越具体越好
- **有主见**：告诉系统你的偏好，不要什么都"随便"

### 3. 定期更新

GSD 迭代很快：

```bash
npx get-shit-done-cc@latest
```

### 4. 保护敏感文件

在 `.claude/settings.json` 中配置 deny list：

```json
{
  "permissions": {
    "deny": [
      "Read(.env)",
      "Read(.env.*)",
      "Read(**/secrets/*)",
      "Read(**/*credential*)",
      "Read(**/*.pem)"
    ]
  }
}
```

### 5. 善用 /gsd:progress

不确定当前状态时：

```bash
/gsd:progress
```

会显示：
- 项目关键决策
- 未解决问题
- 下一步建议

### 6. 使用 /gsd:next 自动推进

```bash
/gsd:next
```

自动检测当前状态并执行下一步逻辑操作。

## 常见问题

### 安装后找不到命令

1. 重启 Claude Code
2. 检查文件是否存在：
   - 全局：`~/.claude/commands/gsd/`
   - 本地：`./.claude/commands/gsd/`
3. 运行 `/gsd:help` 验证

### 命令行为不符合预期

1. 运行 `/gsd:help` 确认安装成功
2. 重新安装：`npx get-shit-done-cc@latest`

### 上下文警告

如果看到上下文窗口使用量警告：

1. 当前会话上下文可能过载
2. 考虑用 `/gsd:pause-work` 暂停
3. 新会话用 `/gsd:resume-work` 恢复

## 性能优化

### 模型 Profile 选择

| 场景 | 推荐 Profile |
|------|-------------|
| 复杂架构决策 | `quality` |
| 日常开发 | `balanced`（默认） |
| 简单任务/预算有限 | `budget` |

```bash
/gsd:set-profile budget
```

### 跳过可选步骤

对于简单任务：

```bash
/gsd:plan-phase 1 --skip-research    # 跳过研究
/gsd:plan-phase 1 --skip-verify      # 跳过验证
```

### 快速模式

临时小任务用快速模式：

```bash
/gsd:quick            # 最简路径
/gsd:quick --full     # 需要完整验证时
```

## 工作流建议

### 新项目

```
/gsd:new-project → /gsd:next → /gsd:next → ...
```

让 GSD 自动串联各个阶段。

### 现有代码库

```
/gsd:map-codebase → /gsd:new-project → ...
```

先分析再规划。

### 临时任务

```
/gsd:quick --discuss --research
```

讨论 + 调研，保证质量。

## 调试技巧

### 系统化调试

```bash
/gsd:debug "问题描述"
```

不要自己手动调试，让 GSD 的 debug 代理来做。

### 查看状态

```bash
/gsd:stats      # 项目统计
/gsd:health     # 目录完整性
```

### 会话报告

```bash
/gsd:session-report
```

生成会话摘要，了解做了什么。

## 避免的做法

1. **不要跳过讨论阶段** - 除非你真的不在乎实现细节
2. **不要忽视验证** - `/gsd:verify-work` 是确认功能正常的关键
3. **不要在复杂项目上用快速模式** - 用完整工作流
4. **不要忘记更新** - GSD 迭代很快，定期 `npx get-shit-done-cc@latest`
