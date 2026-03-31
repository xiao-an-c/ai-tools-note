---
title: 构建系统与代码消除
---

Claude Code 的构建系统基于 Bun 的打包器（Bundler），利用编译期常量注入和死代码消除（Dead Code Elimination, DCE）来生成精简的单文件可执行产物。本文分析其构建机制、feature flag 系统和原生模块集成。

## 构建系统概览

Claude Code 使用 Bun 的打包器将整个 TypeScript/JavaScript 项目编译为单一可执行文件。Bun 的 `bun:bundle` 模块提供了 `feature()` 函数，这是实现编译期 DCE 的核心机制。

构建过程中的两个关键特性：

1. **`feature()` 函数** — 编译期布尔常量，打包器据此消除不可达代码分支
2. **`MACRO.*` 常量** — 构建时内联的版本号等常量，运行时无需读取外部文件

`MACRO.VERSION` 在 `src/main.tsx` 中广泛使用，例如：

```typescript
version: MACRO.VERSION,  // 版本信息展示
`).version(`${MACRO.VERSION} (Claude Code)`, '-v, --version', ...)  // CLI --version
```

`MACRO.VERSION_CHANGELOG` 则用于 `src/utils/releaseNotes.ts` 中的更新日志展示，在构建时将 changelog 内容直接内联到产物中。

此外，`MACRO.ISSUES_EXPLAINER` 用于系统提示中引导用户反馈路径：

```typescript
// src/constants/prompts.ts
`To give feedback, users should ${MACRO.ISSUES_EXPLAINER}`
```

## feature() 函数

`feature()` 从 `bun:bundle` 导入，接受一个字符串参数，返回编译期布尔常量：

```typescript
import { feature } from 'bun:bundle'

// 如果 feature('VOICE_MODE') 为 false，整个条件块在构建时被移除
const voiceCommand = feature('VOICE_MODE')
  ? require('./commands/voice/index.js').default
  : null
```

### 三种导入模式

**1. 条件导入（Conditional Import）**

最常用的模式，工具和命令通过 feature flag 控制是否加载：

```typescript
// src/tools.ts
const SleepTool =
  feature('PROACTIVE') || feature('KAIROS')
    ? require('./tools/SleepTool/SleepTool.js').SleepTool
    : null
```

当 feature 为 false 时，`require()` 调用和对应模块的代码都不会出现在最终产物中。

**2. 条件执行（Conditional Execution）**

在运行逻辑中根据 feature flag 决定代码路径：

```typescript
// src/tools.ts
if (
  feature('COORDINATOR_MODE') &&
  coordinatorModeModule?.isCoordinatorMode()
) {
  simpleTools.push(AgentTool, TaskStopTool, getSendMessageTool())
}
```

**3. 条件导出（Conditional Export）**

工具列表根据 feature flag 动态组装：

```typescript
// src/tools.ts — getAllBaseTools() 中的展开运算符
...(MonitorTool ? [MonitorTool] : []),
...(WebBrowserTool ? [WebBrowserTool] : []),
...(WorkflowTool ? [WorkflowTool] : []),
```

## Feature Flag 分类

通过对 `src/` 目录下所有 `feature()` 调用的分析，可以将 flag 分为以下几类：

### 内部工具（Ant-only）

通过 `process.env.USER_TYPE === 'ant'` 控制，仅供 Anthropic 内部开发使用。这不是 `feature()` 机制，而是环境变量检查，但同样实现了 DCE 效果：

```typescript
// src/tools.ts
const REPLTool =
  process.env.USER_TYPE === 'ant'
    ? require('./tools/REPLTool/REPLTool.js').REPLTool
    : null
const SuggestBackgroundPRTool =
  process.env.USER_TYPE === 'ant'
    ? require('./tools/SuggestBackgroundPRTool/SuggestBackgroundPRTool.js')
        .SuggestBackgroundPRTool
    : null
```

对应的还有 `ConfigTool`、`TungstenTool` 等只在 ant 构建中包含的工具。Ant 构建还会嵌入 `bfs`/`ugrep` 等搜索工具，从而省略独立的 GlobTool/GrepTool。

### 实验性功能

处于活跃开发中的功能，默认关闭：

| Flag | 说明 |
|------|------|
| `PROACTIVE` | 主动式 agent 能力（SleepTool） |
| `KAIROS` | 代号为 Kairos 的功能集（SendUserFileTool、PushNotificationTool 等） |
| `ABLATION_BASELINE` | 消融实验基线 |
| `COORDINATOR_MODE` | 多 agent 协调器模式 |
| `WORKFLOW_SCRIPTS` | 工作流脚本系统（WorkflowTool） |
| `EXPERIMENTAL_SKILL_SEARCH` | 实验性 skill 搜索 |
| `CONTEXT_COLLAPSE` | 上下文折叠机制 |

### 产品功能

已发布但根据构建配置条件启用的功能：

| Flag | 说明 |
|------|------|
| `AGENT_TRIGGERS` | 定时触发（CronCreateTool、CronDeleteTool、CronListTool） |
| `AGENT_TRIGGERS_REMOTE` | 远程触发（RemoteTriggerTool） |
| `VOICE_MODE` | 语音模式（voice 命令、audio-capture 原生模块） |
| `MONITOR_TOOL` | 监控工具 |
| `REACTIVE_COMPACT` | 响应式上下文压缩 |
| `WEB_BROWSER_TOOL` | 浏览器工具 |
| `TERMINAL_PANEL` | 终端面板 |
| `HISTORY_SNIP` | 历史记录裁剪（SnipTool） |
| `UDS_INBOX` | Unix Domain Socket 消息（ListPeersTool） |
| `TEMPLATES` | 模板/分类器系统 |
| `OVERFLOW_TEST_TOOL` | 测试用溢出工具 |

### 平台相关

| Flag | 说明 |
|------|------|
| `DESKTOP` | 桌面客户端构建 |
| `MOBILE` | 移动端构建 |
| `BRIDGE_MODE` | 远程桥接模式 |
| `DAEMON` | 守护进程模式 |
| `SSH_REMOTE` | SSH 远程连接 |
| `NATIVE_CLIPBOARD_IMAGE` | 原生剪贴板图片支持 |
| `IS_LIBC_GLIBC` / `IS_LIBC_MUSL` | C 库类型检测 |

### 性能与遥测

| Flag | 说明 |
|------|------|
| `CACHED_MICROCOMPACT` | 缓存微压缩 |
| `PROMPT_CACHE_BREAK_DETECTION` | 提示缓存中断检测 |
| `PERFETTO_TRACING` | Perfetto 性能追踪 |
| `ENHANCED_TELEMETRY_BETA` | 增强遥测 |
| `SLOW_OPERATION_LOGGING` | 慢操作日志 |
| `TOKEN_BUDGET` | Token 预算控制 |

## DCE 实践案例

### tools.ts — 工具条件加载

`src/tools.ts` 是 DCE 最密集的文件。所有通过 feature flag 控制的工具在文件顶部以条件 `require()` 模式导入：

```typescript
// 单工具条件导入
const MonitorTool = feature('MONITOR_TOOL')
  ? require('./tools/MonitorTool/MonitorTool.js').MonitorTool
  : null

// 多工具条件导入（数组形式）
const cronTools = feature('AGENT_TRIGGERS')
  ? [
      require('./tools/ScheduleCronTool/CronCreateTool.js').CronCreateTool,
      require('./tools/ScheduleCronTool/CronDeleteTool.js').CronDeleteTool,
      require('./tools/ScheduleCronTool/CronListTool.js').CronListTool,
    ]
  : []

// 带初始化副作用的条件导入
const WorkflowTool = feature('WORKFLOW_SCRIPTS')
  ? (() => {
      require('./tools/WorkflowTool/bundled/index.js').initBundledWorkflows()
      return require('./tools/WorkflowTool/WorkflowTool.js').WorkflowTool
    })()
  : null
```

`WorkflowTool` 的导入模式尤其值得注意 — 它在加载模块前先调用 `initBundledWorkflows()` 执行初始化逻辑，整个 IIFE 在 feature 为 false 时被完全消除。

在 `getAllBaseTools()` 中，这些条件导入的工具通过展开运算符组装到工具列表：

```typescript
export function getAllBaseTools(): Tools {
  return [
    AgentTool,
    BashTool,
    // ... 核心工具 ...
    ...(MonitorTool ? [MonitorTool] : []),
    ...(WorkflowTool ? [WorkflowTool] : []),
    ...cronTools,
    // ...
  ]
}
```

当 `feature('MONITOR_TOOL')` 为 false 时，`MonitorTool` 的值为 `null`，展开空数组不增加任何元素。更关键的是，打包器会消除整个 `require()` 调用和对应的模块代码。

### commands.ts — 命令条件注册

`src/commands.ts` 采用相同的模式管理命令注册：

```typescript
// ant-only 命令
const agentsPlatform =
  process.env.USER_TYPE === 'ant'
    ? require('./commands/agents-platform/index.js').default
    : null

// 实验性命令
const proactive =
  feature('PROACTIVE') || feature('KAIROS')
    ? require('./commands/proactive.js').default
    : null

// 组合条件
const remoteControlServerCommand =
  feature('DAEMON') && feature('BRIDGE_MODE')
    ? require('./commands/remoteControlServer/index.js').default
    : null
```

部分命令需要多个 flag 同时启用（如 `DAEMON && BRIDGE_MODE`），这种组合条件进一步细化了 DCE 的粒度。

### query.ts — 查询循环功能切换

`src/query.ts` 在查询循环的核心逻辑中通过 feature flag 切换不同的功能实现：

```typescript
// 响应式压缩
const reactiveCompact = feature('REACTIVE_COMPACT')
  ? (require('./services/compact/reactiveCompact.js') as typeof import('./services/compact/reactiveCompact.js'))
  : null

// 上下文折叠
const contextCollapse = feature('CONTEXT_COLLAPSE')
  ? (require('./services/contextCollapse/index.js') as typeof import('./services/contextCollapse/index.js'))
  : null

// 技能预取
const skillPrefetch = feature('EXPERIMENTAL_SKILL_SEARCH')
  ? (require('./services/skillSearch/prefetch.js') as typeof import('./services/skillSearch/prefetch.js'))
  : null

// 模板分类器
const jobClassifier = feature('TEMPLATES')
  ? (require('./jobs/classifier.js') as typeof import('./jobs/classifier.js'))
  : null
```

这些模块在 query 循环的条件分支中使用，feature 为 false 时不仅省略了模块代码，还省略了相关的执行路径。详见[核心查询循环](./core-query-loop)。

## 原生模块

Claude Code 通过原生模块（Native Addon）处理性能敏感的操作。原生模块分为两层：`vendor/` 下的 C/Rust 源码编译的 `.node` 文件，和 `src/native-ts/` 下的 TypeScript 包装层。

### vendor/ — 原生模块源码

| 目录 | 功能 | 说明 |
|------|------|------|
| `vendor/audio-capture-src/` | 音频采集 | 支持 macOS/Linux/Windows 的麦克风录音和音频播放，为语音模式提供底层能力 |
| `vendor/image-processor-src/` | 图像处理 | 截图和图片预处理 |
| `vendor/modifiers-napi-src/` | 键盘修饰键检测 | N-API 模块，检测 Shift/Ctrl/Alt 等修饰键状态 |
| `vendor/url-handler-src/` | URL 协议处理 | 处理 `claude://` 等 URL scheme |

以 `audio-capture-src` 为例，其 TypeScript 接口定义了录音和播放的完整 API，并处理跨平台兼容性：

```typescript
// vendor/audio-capture-src/index.ts
type AudioCaptureNapi = {
  startRecording(onData: (data: Buffer) => void, onEnd: () => void): boolean
  stopRecording(): void
  isRecording(): boolean
  startPlayback(sampleRate: number, channels: number): boolean
  writePlaybackData(data: Buffer): void
  stopPlayback(): void
  isPlaying(): boolean
  microphoneAuthorizationStatus?(): number  // macOS TCC 权限状态
}
```

模块加载采用三级回退策略：先尝试 bun compile 内嵌路径（`AUDIO_CAPTURE_NODE_PATH` 环境变量），再尝试 npm 安装路径，最后尝试开发目录布局。

### native-ts/ — TypeScript 包装层

| 目录 | 功能 | 说明 |
|------|------|------|
| `native-ts/color-diff/` | 彩色 diff 渲染 | 纯 TypeScript 移植版，使用 highlight.js 替代 Rust syntect |
| `native-ts/file-index/` | 文件索引 | 高性能文件内容索引 |
| `native-ts/yoga-layout/` | Flexbox 布局 | 使用 Facebook Yoga 引擎计算文本布局 |

`color-diff` 是一个典型的"双实现"案例 — 原始版本用 Rust（syntect + bat）实现，TypeScript 移植版使用 highlight.js。源码注释明确说明了语义差异：

> Syntax highlighting uses highlight.js. Scope colors were measured from syntect's output so most tokens match, but hljs's grammar has gaps: plain identifiers and operators like `=` `:` aren't scoped.

这种双实现策略使得在无法加载原生模块的环境中仍能提供完整功能，只是语法高亮的精确度略有差异。详情参见[终端渲染系统](./terminal-rendering)。

## 构建产物 vs 原始源码

本项目分析的是反编译的构建产物，与原始源码存在一些系统性差异：

### 保留的部分

- **架构设计** — 模块组织、依赖关系、分层结构完整保留
- **算法逻辑** — 业务逻辑、数据处理流程、API 调用模式均可分析
- **类型系统** — TypeScript 类型定义、接口声明基本完整

### 差异部分

- **变量名** — 部分变量经过 minification，但大部分保留原始命名
- **DCE 痕迹** — 条件 `require()` 模式是 DCE 的直接证据，即使反编译后仍可见
- **内联常量** — `MACRO.VERSION` 等在反编译产物中已替换为具体字符串值

### DCE 痕迹识别

反编译代码中的条件 `require()` 模式是识别 feature flag 的重要线索。例如：

```typescript
const SomeTool = feature('FLAG')
  ? require('./tools/SomeTool/SomeTool.js').SomeTool
  : null
```

这种模式表明：
1. `SomeTool` 是一个可选项功能
2. 在公开构建中该 feature 可能为 false
3. 对应的模块代码在公开构建中被完全移除

`process.env.USER_TYPE === 'ant'` 模式则标识了 Anthropic 内部专用功能。

## 配置迁移系统

`src/migrations/` 目录包含配置格式变更的迁移函数，确保用户在版本升级时配置平滑过渡：

| 文件 | 迁移内容 |
|------|---------|
| `migrateFennecToOpus.ts` | Fennec 模型名迁移到 Opus |
| `migrateLegacyOpusToCurrent.ts` | 旧版 Opus 迁移到当前版本 |
| `migrateOpusToOpus1m.ts` | Opus 到 Opus 1M 上下文版本 |
| `migrateSonnet1mToSonnet45.ts` | Sonnet 1M 迁移到 Sonnet 4.5 |
| `migrateSonnet45ToSonnet46.ts` | Sonnet 4.5 迁移到 Sonnet 4.6（别名） |
| `migrateReplBridgeEnabledToRemoteControlAtStartup.ts` | REPL Bridge 配置重命名 |
| `migrateAutoUpdatesToSettings.ts` | 自动更新配置迁移到 settings |
| `migrateBypassPermissionsAcceptedToSettings.ts` | 权限配置迁移 |
| `migrateEnableAllProjectMcpServersToSettings.ts` | MCP 服务器配置迁移 |
| `resetAutoModeOptInForDefaultOffer.ts` | 重置自动模式选择 |
| `resetProToOpusDefault.ts` | 重置 Pro 用户默认模型为 Opus |

以 `migrateSonnet45ToSonnet46.ts` 为例，迁移逻辑非常精确：

```typescript
export function migrateSonnet45ToSonnet46(): void {
  if (getAPIProvider() !== 'firstParty') return
  if (!isProSubscriber() && !isMaxSubscriber() && !isTeamPremiumSubscriber()) return

  const model = getSettingsForSource('userSettings')?.model
  if (
    model !== 'claude-sonnet-4-5-20250929' &&
    model !== 'claude-sonnet-4-5-20250929[1m]' &&
    model !== 'sonnet-4-5-20250929' &&
    model !== 'sonnet-4-5-20250929[1m]'
  ) return

  const has1m = model.endsWith('[1m]')
  updateSettingsForSource('userSettings', {
    model: has1m ? 'sonnet[1m]' : 'sonnet',
  })
}
```

迁移函数遵循防御性编程原则：限定适用用户群体、精确匹配旧配置值、使用别名而非硬编码新模型名（`sonnet` 别名会自动解析到最新版本）。

## 关键文件参考

| 文件路径 | 说明 |
|---------|------|
| `src/tools.ts` | 工具注册中心，DCE 最密集的文件 |
| `src/commands.ts` | 命令注册中心，条件导入模式同 tools.ts |
| `src/query.ts` | 查询循环，feature flag 控制压缩和搜索策略 |
| `src/main.tsx` | 入口文件，MACRO.VERSION 使用处 |
| `src/constants/system.ts` | 系统常量，包含版本指纹逻辑 |
| `src/constants/prompts.ts` | 提示模板，MACRO.ISSUES_EXPLAINER |
| `src/utils/releaseNotes.ts` | 更新日志，MACRO.VERSION_CHANGELOG |
| `vendor/audio-capture-src/index.ts` | 音频采集原生模块接口 |
| `vendor/modifiers-napi-src/` | 键盘修饰键 N-API 模块 |
| `src/native-ts/color-diff/index.ts` | 彩色 diff 渲染（TypeScript 移植版） |
| `src/native-ts/yoga-layout/` | Flexbox 布局计算 |
| `src/migrations/` | 配置迁移函数集合 |

参见[项目架构总览](./architecture-overview)了解整体模块组织，以及[工具系统](./tool-system)了解工具的注册和调用机制。
