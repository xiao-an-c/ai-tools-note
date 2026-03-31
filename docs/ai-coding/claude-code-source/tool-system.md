---
title: 工具系统
---

## Tool 接口定义

Claude Code 的工具系统以 `Tool` 类型（`Tool.ts`）为核心，每个工具都是一个实现了该接口的对象。`Tool` 是一个泛型类型，带有三个类型参数：

```typescript
export type Tool<
  Input extends AnyObject = AnyObject,  // Zod 输入 schema
  Output = unknown,                    // 输出类型
  P extends ToolProgressData = ToolProgressData,  // 进度数据类型
> = { ... }
```

### 核心字段

| 字段 | 说明 |
|------|------|
| `name` | 工具名称，也是 API 调用时的标识符 |
| `description(input, options)` | 根据输入动态生成描述文本，供权限提示和 UI 展示使用 |
| `prompt(options)` | 生成系统提示词中的工具说明，发送给 Anthropic API |
| `inputSchema` | Zod schema，定义工具输入参数的类型和校验规则 |
| `outputSchema` | 可选的 Zod schema，定义输出类型（TungstenTool 等工具未定义） |
| `call(args, context, canUseTool, parentMessage, onProgress)` | 执行工具调用，返回 `ToolResult<Output>` |
| `checkPermissions(input, context)` | 工具特定的权限检查，返回 `PermissionResult` |
| `validateInput(input, context)` | 可选的输入校验，返回 `ValidationResult` |

### 行为标志

工具通过几个布尔方法声明其行为特性，这些标志直接影响[核心查询循环](./core-query-loop)中的工具编排策略：

- **`isConcurrencySafe(input)`** — 是否可并发执行。只读操作返回 `true`，允许同一批次并行运行
- **`isReadOnly(input)`** — 是否为只读操作，用于 UI 展示和权限判断
- **`isDestructive(input)`** — 是否执行不可逆操作（删除、覆盖、发送），默认 `false`
- **`isEnabled()`** — 当前环境下是否启用，可响应 feature flag 或运行时条件
- **`isOpenWorld(input)`** — 是否访问开放世界（如网络请求），影响 token 预算计算

### Schema 转换

Zod schema 通过 `zodToJsonSchema()`（`utils/zodToJsonSchema.ts`）转换为 JSON Schema，然后传递给 Anthropic API。在 `utils/api.ts` 中，转换逻辑优先使用工具自带的 `inputJSONSchema`（MCP 工具直接提供 JSON Schema），否则从 `inputSchema`（Zod）转换：

```typescript
let input_schema = (
  'inputJSONSchema' in tool && tool.inputJSONSchema
    ? tool.inputJSONSchema
    : zodToJsonSchema(tool.inputSchema)
) as Anthropic.Tool.InputSchema
```

### buildTool 工厂函数

`buildTool()`（`Tool.ts`）是一个工厂函数，用于从部分定义构建完整的 `Tool` 对象。它为以下方法提供安全默认值：

| 方法 | 默认值 | 设计意图 |
|------|--------|---------|
| `isEnabled` | `() => true` | 默认启用 |
| `isConcurrencySafe` | `() => false` | 假设不安全（保守策略） |
| `isReadOnly` | `() => false` | 假设有写操作 |
| `isDestructive` | `() => false` | 假设非破坏性 |
| `checkPermissions` | 返回 `behavior: 'allow'` | 委托给通用权限系统 |
| `toAutoClassifierInput` | 返回 `''` | 跳过安全分类器（安全相关工具必须覆盖） |
| `userFacingName` | 返回 `name` | 使用工具名作为展示名 |

所有工具导出都通过 `buildTool()` 创建，确保默认值集中管理，调用方无需处理 `?.() ?? default`。

### ToolUseContext

`ToolUseContext` 是传递给每个工具执行上下文的大型对象（`Tool.ts` 第 158 行起），包含：

- **`options`** — 当前会话的配置（commands、tools 列表、模型名称、MCP 客户端、thinking 配置等）
- **`abortController`** — 用于取消工具执行
- **`getAppState() / setAppState()`** — 读写全局应用状态
- **`setToolJSX`** — 设置工具的 JSX 渲染组件
- **`addNotification`** — 添加通知消息
- **`messages`** — 当前会话消息列表
- **`requestPrompt`** — 交互式提示回调（仅 REPL 模式可用）
- **`fileReadingLimits / globLimits`** — 文件读取和 glob 搜索的限制
- **`queryTracking`** — 查询链追踪信息（用于子代理嵌套深度计算）

## 工具注册表

工具注册表（`tools.ts`）负责组装所有可用工具的最终列表。整个注册流程分为三层：

### 静态导入 — 始终可用的工具

```typescript
import { AgentTool } from './tools/AgentTool/AgentTool.js'
import { BashTool } from './tools/BashTool/BashTool.js'
import { FileReadTool } from './tools/FileReadTool/FileReadTool.js'
import { FileEditTool } from './tools/FileEditTool/FileEditTool.js'
// ... 其他核心工具
```

这些工具是 Claude Code 的基础能力，在所有构建中都可用。

### DCE 条件导入 — Feature Gate

通过 Bun 的 `feature()` 函数和 `process.env.USER_TYPE` 实现死代码消除（Dead Code Elimination），让不相关的工具在构建时被完全移除：

```typescript
// 仅 Anthropic 内部构建包含
const REPLTool = process.env.USER_TYPE === 'ant'
  ? require('./tools/REPLTool/REPLTool.js').REPLTool : null

// 需要 PROACTIVE 或 KAIROS feature flag
const SleepTool = feature('PROACTIVE') || feature('KAIROS')
  ? require('./tools/SleepTool/SleepTool.js').SleepTool : null

// 需要 AGENT_TRIGGERS feature flag
const cronTools = feature('AGENT_TRIGGERS')
  ? [CronCreateTool, CronDeleteTool, CronListTool] : []
```

这种模式确保外部构建不会包含内部工具的代码。

### 延迟 require — 打破循环依赖

部分工具通过 `require()` 延迟加载，仅在首次调用时才导入模块，用于打破循环依赖：

```typescript
// tools.ts -> TeamCreateTool -> ... -> tools.ts 的循环
const getTeamCreateTool = () =>
  require('./tools/TeamCreateTool/TeamCreateTool.js').TeamCreateTool
const getTeamDeleteTool = () =>
  require('./tools/TeamDeleteTool/TeamDeleteTool.js').TeamDeleteTool
const getSendMessageTool = () =>
  require('./tools/SendMessageTool/SendMessageTool.js').SendMessageTool
```

### getTools() 与 assembleToolPool()

`getTools(permissionContext)` 是核心组装函数，执行以下步骤：

1. **简单模式**：如果 `CLAUDE_CODE_SIMPLE` 环境变量启用，只返回 Bash、Read、Edit 三个基础工具
2. **获取全部基础工具**：调用 `getAllBaseTools()` 获取所有可能的工具
3. **过滤特殊工具**：移除 `ListMcpResourcesTool`、`ReadMcpResourceTool` 等特殊工具
4. **过滤拒绝规则**：通过 `filterToolsByDenyRules()` 移除被权限系统 blanket deny 的工具
5. **REPL 模式处理**：启用 REPL 时，隐藏被 `REPL_ONLY_TOOLS` 覆盖的原始工具
6. **启用状态过滤**：只保留 `isEnabled()` 返回 `true` 的工具

`assembleToolPool(permissionContext, mcpTools)` 是更上层的组装函数，将内置工具与 MCP 工具合并去重：

```typescript
export function assembleToolPool(permissionContext, mcpTools): Tools {
  const builtInTools = getTools(permissionContext)
  const allowedMcpTools = filterToolsByDenyRules(mcpTools, permissionContext)
  // 内置工具排序在前（保持 prompt cache 稳定性），MCP 工具在后
  return uniqBy(
    [...builtInTools].sort(byName).concat(allowedMcpTools.sort(byName)),
    'name',
  )
}
```

## 工具分类

下表列出了 `getAllBaseTools()` 返回的所有工具，按功能分类：

### 文件操作

| 工具 | 模块路径 | 说明 |
|------|---------|------|
| FileReadTool | `tools/FileReadTool/` | 读取文件内容 |
| FileWriteTool | `tools/FileWriteTool/` | 写入/创建文件 |
| FileEditTool | `tools/FileEditTool/` | 精确字符串替换编辑 |
| GlobTool | `tools/GlobTool/` | 文件名模式匹配搜索 |
| GrepTool | `tools/GrepTool/` | 基于 ripgrep 的内容搜索 |
| NotebookEditTool | `tools/NotebookEditTool/` | Jupyter Notebook 编辑 |

### 命令执行

| 工具 | 模块路径 | 说明 |
|------|---------|------|
| BashTool | `tools/BashTool/` | Shell 命令执行（最复杂的工具） |
| PowerShellTool | `tools/PowerShellTool/` | PowerShell 命令执行（条件启用） |

### 网络访问

| 工具 | 模块路径 | 说明 |
|------|---------|------|
| WebFetchTool | `tools/WebFetchTool/` | 抓取网页内容 |
| WebSearchTool | `tools/WebSearchTool/` | 网络搜索 |

### 代理与团队

| 工具 | 模块路径 | 说明 |
|------|---------|------|
| AgentTool | `tools/AgentTool/` | 启动子代理 |
| TaskCreateTool | `tools/TaskCreateTool/` | 创建任务（TodoV2） |
| TaskGetTool | `tools/TaskGetTool/` | 获取任务详情 |
| TaskUpdateTool | `tools/TaskUpdateTool/` | 更新任务状态 |
| TaskListTool | `tools/TaskListTool/` | 列出所有任务 |
| TaskOutputTool | `tools/TaskOutputTool/` | 获取任务输出 |
| TaskStopTool | `tools/TaskStopTool/` | 停止正在执行的任务 |
| TeamCreateTool | `tools/TeamCreateTool/` | 创建团队（延迟加载） |
| TeamDeleteTool | `tools/TeamDeleteTool/` | 删除团队（延迟加载） |
| SendMessageTool | `tools/SendMessageTool/` | 发送消息给队友（延迟加载） |

### MCP 相关

| 工具 | 模块路径 | 说明 |
|------|---------|------|
| MCPTool | `tools/MCPTool/` | 通用 MCP 工具（运行时动态配置） |
| ListMcpResourcesTool | `tools/ListMcpResourcesTool/` | 列出 MCP 服务器资源 |
| ReadMcpResourceTool | `tools/ReadMcpResourceTool/` | 读取 MCP 服务器资源 |
| McpAuthTool | `tools/McpAuthTool/` | MCP 认证 |

### 规划与工作区

| 工具 | 模块路径 | 说明 |
|------|---------|------|
| EnterPlanModeTool | `tools/EnterPlanModeTool/` | 进入规划模式 |
| ExitPlanModeV2Tool | `tools/ExitPlanModeTool/` | 退出规划模式 |
| EnterWorktreeTool | `tools/EnterWorktreeTool/` | 进入 Git worktree |
| ExitWorktreeTool | `tools/ExitWorktreeTool/` | 退出 Git worktree |

### 系统与辅助

| 工具 | 模块路径 | 说明 |
|------|---------|------|
| AskUserQuestionTool | `tools/AskUserQuestionTool/` | 向用户提问 |
| SkillTool | `tools/SkillTool/` | 执行 Skill（斜杠命令作为工具调用） |
| ConfigTool | `tools/ConfigTool/` | 配置管理（仅 ant 构建） |
| TodoWriteTool | `tools/TodoWriteTool/` | 写入 Todo 列表 |
| ToolSearchTool | `tools/ToolSearchTool/` | 搜索延迟加载的工具 |
| BriefTool | `tools/BriefTool/` | 摘要工具 |
| LSPTool | `tools/LSPTool/` | LSP 语言服务集成 |
| TungstenTool | `tools/TungstenTool/` | 内部工具（仅 ant 构建） |

### Feature Gate 工具（DCE 条件编译）

| 工具 | Feature Flag | 说明 |
|------|-------------|------|
| REPLTool | `USER_TYPE=ant` | REPL 交互模式 |
| SleepTool | `PROACTIVE` / `KAIROS` | 延迟等待 |
| CronCreateTool / CronDeleteTool / CronListTool | `AGENT_TRIGGERS` | 定时任务 |
| RemoteTriggerTool | `AGENT_TRIGGERS_REMOTE` | 远程触发器 |
| MonitorTool | `MONITOR_TOOL` | 监控工具 |
| SendUserFileTool | `KAIROS` | 发送文件 |
| PushNotificationTool | `KAIROS` / `KAIROS_PUSH_NOTIFICATION` | 推送通知 |
| SubscribePRTool | `KAIROS_GITHUB_WEBHOOKS` | PR 订阅 |
| WebBrowserTool | `WEB_BROWSER_TOOL` | 网页浏览器 |
| WorkflowTool | `WORKFLOW_SCRIPTS` | 工作流执行 |
| SnipTool | `HISTORY_SNIP` | 历史裁剪 |
| OverflowTestTool | `OVERFLOW_TEST_TOOL` | 溢出测试 |
| CtxInspectTool | `CONTEXT_COLLAPSE` | 上下文检查 |
| TerminalCaptureTool | `TERMINAL_PANEL` | 终端捕获 |
| ListPeersTool | `UDS_INBOX` | 列出对等节点 |
| VerifyPlanExecutionTool | `CLAUDE_CODE_VERIFY_PLAN` | 验证计划执行 |

## 工具权限系统

工具执行前必须经过权限检查，由 `useCanUseTool` hook（`hooks/useCanUseTool.tsx`）实现。

### 权限检查流程

`CanUseToolFn` 的类型签名：

```typescript
export type CanUseToolFn<Input> = (
  tool: ToolType,
  input: Input,
  toolUseContext: ToolUseContext,
  assistantMessage: AssistantMessage,
  toolUseID: string,
  forceDecision?: PermissionDecision<Input>,
) => Promise<PermissionDecision<Input>>
```

核心流程分为三步：

1. **快速判定**：调用 `hasPermissionsToUseTool()` 检查配置的权限规则
   - 如果结果是 `allow`，直接放行
   - 如果结果是 `deny`，记录拒绝并返回
   - 如果结果是 `ask`，进入交互式流程

2. **自动化检查**（可选）：在显示权限对话框前，先进行自动化检查
   - **Coordinator 模式**：`handleCoordinatorPermission()` 处理协调器工作节点的权限
   - **Swarm Worker 模式**：`handleSwarmWorkerPermission()` 处理群体工作节点的权限
   - **Bash Classifier**：对 Bash 命令进行基于规则的分类器检查（speculative 模式预计算）

3. **交互式确认**：`handleInteractivePermission()` 向用户展示权限请求，等待用户决策

### 权限模式

`ToolPermissionContext.mode` 支持多种模式：

| 模式 | 说明 |
|------|------|
| `default` | 标准权限检查，首次使用工具需要用户确认 |
| `bypassPermissions` | 跳过所有权限检查（危险模式） |
| `plan` | 规划模式下的权限策略 |

权限上下文还包含三层规则配置：
- **`alwaysAllowRules`** — 始终允许的规则（如 `Read(*)`）
- **`alwaysDenyRules`** — 始终拒绝的规则
- **`alwaysAskRules`** — 始终询问的规则

### 沙箱检测

BashTool 通过 `SandboxManager`（`utils/sandbox/sandbox-adapter.ts`）检测沙箱违规。`checkReadOnlyConstraints()` 验证 Bash 命令是否违反只读约束。沙箱违规会被报告为权限错误。

## 斜杠命令系统

斜杠命令（slash commands）与工具是两个不同但相关的概念，定义在 `commands.ts` 和 `types/command.ts` 中。

### Command 类型

每个命令有三种可能的实现方式：

```typescript
export type Command = CommandBase &
  (PromptCommand | LocalCommand | LocalJSXCommand)
```

- **`PromptCommand`** — 纯提示型，将命令内容展开为系统提示词片段，由模型执行。Skill 命令通常属于这一类
- **`LocalCommand`** — 本地执行型，通过 `load()` 延迟加载模块，直接在 CLI 中执行
- **`LocalJSXCommand`** — JSX 渲染型，返回 React 组件作为 UI，支持复杂的交互界面

### 命令与工具的关系

命令是用户面向的快捷入口，许多命令直接映射到工具或触发特定的工具组合。主要区别：

| 维度 | 命令 (Command) | 工具 (Tool) |
|------|---------------|-------------|
| 调用方式 | 用户输入 `/command` | 模型通过 API 调用 |
| 执行位置 | CLI 本地 / 模型上下文 | 模型请求后执行 |
| 动态性 | 可由用户/MCP/Plugin 添加 | 需要代码实现 |
| 典型示例 | `/commit`, `/review`, `/help` | BashTool, FileReadTool |

### 主要命令列表

以下列出 `COMMANDS()` 函数中注册的主要命令（约 70+ 个）：

**开发工作流**：`/commit`, `/review`, `/ultrareview`, `/diff`, `/branch`, `/init`, `/bughunter`, `/autofix-pr`, `/security-review`

**会话管理**：`/clear`, `/compact`, `/resume`, `/session`, `/cost`, `/status`, `/help`, `/exit`

**配置与调试**：`/config`, `/doctor`, `/model`, `/mcp`, `/memory`, `/hooks`, `/permissions`, `/sandbox-toggle`, `/keybindings`, `/theme`, `/color`, `/vim`

**搜索与展示**：`/context`, `/files`, `/tasks`, `/skills`, `/agents`, `/plugins`

**认证**：`/login`, `/logout`, `/install-github-app`, `/install-slack-app`

**Feature Gate 命令**：`/voice`, `/plan`, `/proactive`, `/bridge`, `/peers`, `/fork`, `/buddy`, `/workflows`, `/torch`, `/web`

**内部命令**（`INTERNAL_ONLY_COMMANDS`，仅 ant 构建）：`/backfill-sessions`, `/break-cache`, `/ctx_viz`, `/issue`, `/mock-limits`, `/version`, `/summary`, `/ant-trace`, `/perf-issue`, `/env`

命令注册通过 `getCommands(cwd)` 异步组装，除了静态注册的内置命令外，还会动态加载：
- **动态 Skills**：文件操作中发现的自定义 skill
- **Plugin 命令**：通过插件系统注册的命令
- **Bundled Skills**：内置打包的 skill 命令
- **MCP Skills**：通过 MCP 服务器提供的 prompt 类型命令

## 工具并发执行

工具并发执行由 `services/tools/toolOrchestration.ts` 和 `services/tools/StreamingToolExecutor.ts` 实现。

### 分区策略 — partitionToolCalls

当模型在一次响应中返回多个 tool_use 时，`partitionToolCalls()` 将它们分成批次：

```typescript
function partitionToolCalls(
  toolUseMessages: ToolUseBlock[],
  toolUseContext: ToolUseContext,
): Batch[]
```

分区规则：
1. 遍历所有 tool_use block
2. 对每个 block，通过 `tool.isConcurrencySafe(input)` 判断是否可并发
3. 如果当前 block 可并发且上一个 batch 也可并发，合并到同一个 batch
4. 否则创建新 batch

结果是一个 `Batch[]` 数组，每个 batch 要么全是可并发的只读工具，要么只有一个不可并发的工具。

### 执行模式

- **并发执行**（`runToolsConcurrently`）：使用 `all()` 工具函数并行启动所有工具，每个工具独立执行并通过 AsyncGenerator yield 结果。并发上限由 `CLAUDE_CODE_MAX_TOOL_USE_CONCURRENCY` 环境变量控制（默认 10）
- **串行执行**（`runToolsSerially`）：逐个执行工具，每个工具完成后才执行下一个。串行模式下，前一个工具的 context 修改会传递给下一个工具

### StreamingToolExecutor

`StreamingToolExecutor` 用于流式场景（SSE/SDK 模式），工具在 API 响应流式到达时就开始执行：

```typescript
export class StreamingToolExecutor {
  addTool(block: ToolUseBlock, assistantMessage: AssistantMessage): void
  discard(): void  // 丢弃所有待执行和进行中的工具
  getRemainingResults(): AsyncGenerator<...>
}
```

关键设计：
- 工具到达后立即加入执行队列，不等待整个响应完成
- 可并发的工具同时启动执行
- 不可并发的工具需要等待前面的工具完成
- 结果按工具接收顺序返回（不是完成顺序）
- 通过 `siblingAbortController` 实现错误传播：一个 Bash 工具出错时，兄弟子进程立即终止
- `discard()` 方法用于流式回退场景，废弃失败尝试的所有结果

## 关键文件参考

| 文件路径 | 说明 |
|---------|------|
| `Tool.ts` | Tool 类型定义、buildTool 工厂、ToolUseContext、工具辅助函数 |
| `tools.ts` | 工具注册表，getAllBaseTools / getTools / assembleToolPool |
| `commands.ts` | 斜杠命令注册，getCommands / COMMANDS |
| `types/command.ts` | Command 类型定义（PromptCommand / LocalCommand / LocalJSXCommand） |
| `types/permissions.ts` | 权限类型定义（PermissionMode / PermissionResult / ToolPermissionRulesBySource） |
| `hooks/useCanUseTool.tsx` | 权限检查 hook，CanUseToolFn 实现 |
| `utils/permissions/permissions.ts` | 通用权限逻辑（hasPermissionsToUseTool / filterToolsByDenyRules） |
| `utils/api.ts` | API 层，负责 Zod → JSON Schema 转换和工具 schema 构建 |
| `utils/zodToJsonSchema.ts` | Zod schema 到 JSON Schema 的转换实现 |
| `services/tools/toolOrchestration.ts` | 工具批处理分区与并发/串行调度 |
| `services/tools/StreamingToolExecutor.ts` | 流式场景下的工具执行器 |
| `services/tools/toolExecution.ts` | 单个工具调用的执行逻辑（runToolUse） |
| `tools/BashTool/BashTool.tsx` | BashTool 实现，最复杂的工具（约 2000+ 行） |
| `tools/MCPTool/MCPTool.ts` | MCPTool 模板，运行时被动态配置覆盖 |
| `tools/AgentTool/` | 子代理工具实现 |
| `tools/SkillTool/` | Skill 执行工具，桥接命令和工具系统 |
