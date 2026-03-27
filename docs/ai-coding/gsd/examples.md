---
title: GSD 实战示例
---

# 实战示例

## 示例 1：从零开始创建一个新项目

### 场景

你想创建一个任务管理应用。

### 步骤

```bash
# 1. 启动 Claude Code（推荐跳过权限确认）
claude --dangerously-skip-permissions

# 2. 初始化 GSD 项目
/gsd:new-project
```

系统会问你一系列问题：
- 项目目标是什么？
- 目标用户是谁？
- 技术栈偏好？
- 哪些是 v1 必须有的？哪些可以放 v2？

回答完问题后，GSD 会：
- 并行研究相关技术
- 生成 `PROJECT.md`、`REQUIREMENTS.md`、`ROADMAP.md`

```bash
# 3. 查看生成的路线图
/gsd:progress

# 4. 开始第一个阶段
/gsd:discuss-phase 1    # 讨论实现细节
/gsd:plan-phase 1       # 生成计划
/gsd:execute-phase 1    # 执行
/gsd:verify-work 1      # 验证

# 5. 或者让 GSD 自动推进
/gsd:next
```

## 示例 2：快速添加一个小功能

### 场景

你想给现有项目添加一个暗色模式切换功能。

### 步骤

```bash
# 使用快速模式
/gsd:quick
```

系统会问你想做什么，你输入：
> Add dark mode toggle to settings page

GSD 会：
1. 生成一个简单的计划
2. 执行实现
3. 提交代码

```bash
# 如果想先讨论细节
/gsd:quick --discuss

# 如果想先调研最佳实践
/gsd:quick --research

# 如果想要完整验证
/gsd:quick --full
```

## 示例 3：处理现有代码库

### 场景

你有一个现有的代码库，想用 GSD 来管理后续开发。

### 步骤

```bash
# 1. 先分析现有代码库
/gsd:map-codebase
```

这会并行拉起多个代理分析：
- 技术栈
- 架构模式
- 代码约定
- 风险点

```bash
# 2. 然后初始化 GSD
/gsd:new-project
```

因为有了 `map-codebase` 的分析，`new-project` 会：
- 理解你的现有代码库
- 提问聚焦在你想新增的部分
- 规划时自动加载现有模式

## 示例 4：调试问题

### 场景

登录接口返回 500 错误，不知道原因。

### 步骤

```bash
/gsd:debug "登录接口返回 500 错误"
```

GSD 会：
1. 收集症状信息
2. 创建调试跟踪文档
3. 提出假设与验证方案
4. 解决问题

调试过程会持久化保存，中断后可以恢复。

## 示例 5：多阶段项目开发

### 场景

一个电商网站，需要分阶段开发：用户系统 → 商品管理 → 购物车 → 支付。

### 步骤

```bash
# 初始化项目
/gsd:new-project

# 第一阶段：用户系统
/gsd:discuss-phase 1
/gsd:plan-phase 1
/gsd:execute-phase 1
/gsd:verify-work 1

# 第二阶段：商品管理
/gsd:discuss-phase 2
/gsd:plan-phase 2
/gsd:execute-phase 2
/gsd:verify-work 2

# ... 继续

# 所有阶段完成后
/gsd:ship                    # 创建 PR
/gsd:complete-milestone      # 完成里程碑

# 开始下一个版本
/gsd:new-milestone
```

## 示例 6：插入紧急任务

### 场景

正在开发阶段 2，突然需要先修复一个紧急 bug。

### 步骤

```bash
# 在阶段 2 和 3 之间插入
/gsd:insert-phase 2.5

# 讨论并执行紧急任务
/gsd:discuss-phase 2.5
/gsd:plan-phase 2.5
/gsd:execute-phase 2.5

# 完成后继续原来的阶段 3
/gsd:discuss-phase 3
```

## 示例 7：中途暂停和恢复

### 场景

执行到一半需要离开，下次继续。

### 步骤

```bash
# 暂停前
/gsd:pause-work

# 这会创建 HANDOFF.json，记录当前状态
```

下次启动时：

```bash
/gsd:resume-work

# 或者直接
/gsd:progress    # 查看当前状态
/gsd:next        # 继续下一步
```
