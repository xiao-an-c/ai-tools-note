# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 关于推送远端Git仓库

需要使用者同意才能推送

## 常用命令

```bash
npm run docs:dev          # 启动开发服务器 (localhost:5173)
npm run docs:build        # 构建静态站点 → docs/.vitepress/dist/
npm run docs:build:private # 构建私有版本（含 private/ 内容）→ 部署到 note.d.me
npm run docs:preview      # 预览构建结果
```

## 项目结构

这是一个 VitePress 1.x 文档站点，用于记录 AI 工具学习笔记。

- `docs/` - VitePress 文档根目录
- `docs/.vitepress/config.ts` - 主配置文件（导航、侧边栏）
- `docs/ai-coding/` - AI 编程助手（Claude Code、Cursor）
- `docs/mcp/` - MCP 工具
- `docs/ai-frameworks/` - AI 开发框架（LangChain、LangGraph）
- `docs/ai-apis/` - AI API（Anthropic、OpenAI、Ollama）
- `docs/notes/` - 零散笔记
- `projects/` - 存放 clone 的学习项目源码（已 git 忽略）

## 添加新工具笔记

1. 在对应分类目录下创建新文件夹（如 `docs/ai-coding/new-tool/`）
2. 创建至少 `index.md`（工具概览）
3. 在 `docs/.vitepress/config.ts` 的 sidebar 对应分组中添加条目，新工具默认 `collapsed: true`

## 笔记模板

每个工具目录的 `index.md` 建议包含：

- 工具简介和核心概念
- 官方资源链接
- 指向其他笔记页面的链接
