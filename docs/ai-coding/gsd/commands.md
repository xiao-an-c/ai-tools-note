---
title: GSD 常用命令
---

# 常用命令

## 核心工作流命令

### /gsd:new-project

完整初始化一个新项目。

```bash
/gsd:new-project           # 交互式
/gsd:new-project --auto    # 自动模式
```

流程：提问 → 研究 → 需求 → 路线图

### /gsd:discuss-phase

在规划前收集实现决策。

```bash
/gsd:discuss-phase 1              # 讨论第 1 阶段
/gsd:discuss-phase 1 --auto       # 自动模式
/gsd:discuss-phase 1 --analyze    # 增加权衡分析
```

### /gsd:plan-phase

为某个阶段执行研究 + 规划 + 验证。

```bash
/gsd:plan-phase 1                 # 规划第 1 阶段
/gsd:plan-phase 1 --auto          # 自动模式
/gsd:plan-phase 1 --reviews       # 加载代码库审查结果
```

### /gsd:execute-phase

以并行 wave 执行全部计划。

```bash
/gsd:execute-phase 1              # 执行第 1 阶段
```

### /gsd:verify-work

人工用户验收测试。

```bash
/gsd:verify-work 1                # 验证第 1 阶段
```

### /gsd:ship

从已验证的工作创建 PR。

```bash
/gsd:ship                         # 创建 PR
/gsd:ship --draft                 # 创建草稿 PR
```

## 导航命令

### /gsd:progress

查看当前位置和下一步建议。

```bash
/gsd:progress
```

显示：
- 项目关键决策
- 未解决问题
- 已完成里程碑
- 下一步建议

### /gsd:next

自动检测状态并执行下一步。

```bash
/gsd:next
```

### /gsd:help

显示全部命令和使用指南。

```bash
/gsd:help
```

## 里程碑管理

### /gsd:new-milestone

开始下一个版本。

```bash
/gsd:new-milestone
/gsd:new-milestone v2.0.0         # 指定版本名
```

### /gsd:complete-milestone

归档里程碑并打 release tag。

```bash
/gsd:complete-milestone
```

### /gsd:audit-milestone

验证里程碑是否达到完成定义。

```bash
/gsd:audit-milestone
```

## 阶段管理

### /gsd:add-phase

在路线图末尾追加 phase。

```bash
/gsd:add-phase
```

### /gsd:insert-phase

在 phase 之间插入紧急工作。

```bash
/gsd:insert-phase 1.5             # 在 phase 1 和 2 之间插入
```

### /gsd:remove-phase

删除未来 phase，并重编号。

```bash
/gsd:remove-phase 3
```

## 工具命令

### /gsd:quick

执行临时任务，无需完整规划。

```bash
/gsd:quick                              # 会询问任务
/gsd:quick --discuss                    # 先讨论
/gsd:quick --research                   # 先调研
/gsd:quick --full                       # 完整验证
```

### /gsd:debug

系统化调试。

```bash
/gsd:debug "登录接口返回 500 错误"
```

### /gsd:add-todo

记录待办想法。

```bash
/gsd:add-todo "添加暗色模式支持"
```

### /gsd:check-todos

查看待办列表。

```bash
/gsd:check-todos
```

### /gsd:note

零摩擦想法捕捉。

```bash
/gsd:note append "这是一个想法"    # 追加笔记
/gsd:note list                    # 列出笔记
```

## 会话管理

### /gsd:pause-work

中途暂停时创建交接上下文。

```bash
/gsd:pause-work
```

### /gsd:resume-work

从上一次会话恢复。

```bash
/gsd:resume-work
```

### /gsd:session-report

生成会话摘要。

```bash
/gsd:session-report
```

## 配置命令

### /gsd:settings

配置模型 profile 和工作流代理。

```bash
/gsd:settings
```

### /gsd:set-profile

切换模型 profile。

```bash
/gsd:set-profile quality    # 高质量
/gsd:set-profile balanced   # 平衡（默认）
/gsd:set-profile budget     # 节省成本
```

## 其他

### /gsd:update

更新 GSD 到最新版本。

```bash
/gsd:update
```

### /gsd:stats

显示项目统计。

```bash
/gsd:stats
```

### /gsd:health

校验 `.planning/` 目录完整性。

```bash
/gsd:health
/gsd:health --repair         # 自动修复
```
