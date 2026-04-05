import { defineConfig } from 'vitepress'
import mathjax3 from 'markdown-it-mathjax3'

const isPrivate = process.env.PRIVATE === 'true'

export default defineConfig({
  base: isPrivate ? '/' : '/ai-tools-note/',
  lang: 'zh-CN',
  title: '学习笔记',
  description: '记录学习过程',
  srcExclude: isPrivate ? [] : ['**/private/**'],
  rewrites: isPrivate
    ? { 'private/index.md': 'index.md', 'index.md': 'original-home.md' }
    : {},

  markdown: {
    config: (md) => {
      md.use(mathjax3)
      // 自定义 mermaid 代码块渲染 - 使用 Vue 组件
      const defaultRender = md.renderer.rules.fence!
      md.renderer.rules.fence = (tokens, idx, options, env, self) => {
        const token = tokens[idx]
        if (token.info.trim() === 'mermaid') {
          const code = token.content.trim()
          const escapedCode = md.utils.escapeHtml(code)
          return `<Mermaid code="${escapedCode}" />`
        }
        return defaultRender(tokens, idx, options, env, self)
      }
    }
  },

  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: 'AI 笔记', items: [
        { text: 'GSD 笔记', link: '/ai-coding/gsd/' },
        { text: 'Anthropic 博客', link: '/ai-coding/anthropic-blog/' },
        { text: 'Claude Code 源码', link: '/ai-coding/claude-code-source/' },
        { text: 'Excalidraw 图表', link: '/ai-coding/excalidraw-diagram-skill/' },
      ]},
      { text: '基础设施', items: [
        { text: 'Docker 笔记', link: '/notes/docker/' },
        { text: '本地服务网关', link: '/notes/local-gateway/01-搭建指南' },
      ]},
      ...(isPrivate ? [
        { text: '人生感悟', link: '/private/life/' },
        { text: '金融思维', link: '/private/finance/rogers-diffusion/' },
      ] : []),
    ],

    sidebar: {
      // Claude Code 源码分析
      '/ai-coding/claude-code-source/': [
        { text: '概览', link: '/ai-coding/claude-code-source/' },
        {
          text: '前置知识',
          collapsed: false,
          items: [
            { text: '核心概念', link: '/ai-coding/claude-code-source/prerequisites' },
            { text: 'React 与终端渲染基础', link: '/ai-coding/claude-code-source/frontend-basics' },
            { text: '协议与基础设施', link: '/ai-coding/claude-code-source/protocols-infra' },
          ],
        },
        {
          text: '概览',
          collapsed: false,
          items: [
            { text: '项目架构总览', link: '/ai-coding/claude-code-source/architecture-overview' },
          ],
        },
        {
          text: '核心循环',
          collapsed: false,
          items: [
            { text: '核心查询循环', link: '/ai-coding/claude-code-source/core-query-loop' },
            { text: '工具系统', link: '/ai-coding/claude-code-source/tool-system' },
          ],
        },
        {
          text: '界面渲染',
          collapsed: false,
          items: [
            { text: '终端渲染系统', link: '/ai-coding/claude-code-source/terminal-rendering' },
          ],
        },
        {
          text: '扩展能力',
          collapsed: false,
          items: [
            { text: 'MCP 集成', link: '/ai-coding/claude-code-source/mcp-integration' },
            { text: '多智能体系统', link: '/ai-coding/claude-code-source/multi-agent-system' },
          ],
        },
        {
          text: '基础设施',
          collapsed: false,
          items: [
            { text: '状态管理与基础设施', link: '/ai-coding/claude-code-source/state-management' },
            { text: '构建系统与代码消除', link: '/ai-coding/claude-code-source/build-system' },
          ],
        },
      ],

      // Excalidraw 图表技能原理
      '/ai-coding/excalidraw-diagram-skill/': [
        {
          text: '概览',
          collapsed: false,
          items: [
            { text: '技能概览', link: '/ai-coding/excalidraw-diagram-skill/' },
          ],
        },
        {
          text: '原理',
          collapsed: true,
          items: [
            { text: '提示词即软件', link: '/ai-coding/excalidraw-diagram-skill/prompt-as-software' },
            { text: '可视化论证方法论', link: '/ai-coding/excalidraw-diagram-skill/visual-argument-methodology' },
            { text: '渲染管线', link: '/ai-coding/excalidraw-diagram-skill/render-pipeline' },
            { text: '大型图表策略', link: '/ai-coding/excalidraw-diagram-skill/large-diagram-strategy' },
          ],
        },
        {
          text: '附录',
          collapsed: true,
          items: [
            { text: 'SKILL.md 原文', link: '/ai-coding/excalidraw-diagram-skill/skill-original' },
            { text: 'SKILL.md 译文', link: '/ai-coding/excalidraw-diagram-skill/skill-translation' },
          ],
        },
      ],

      // Anthropic 工程博客笔记
      '/ai-coding/anthropic-blog/': [
        { text: '概览', link: '/ai-coding/anthropic-blog/' },
        {
          text: 'Harness 设计',
          collapsed: false,
          items: [
            { text: '译文', link: '/ai-coding/anthropic-blog/harness-design/translation' },
            { text: '讲解', link: '/ai-coding/anthropic-blog/harness-design/explain' },
          ],
        },
      ],

      // GSD 笔记 - 只在 /ai-coding/gsd/ 路径下显示
      '/ai-coding/gsd/': [
        {
          text: '入门',
          collapsed: false,
          items: [
            { text: '工具概览', link: '/ai-coding/gsd/' },
            { text: '安装配置', link: '/ai-coding/gsd/installation' },
            { text: '中文设置', link: '/ai-coding/gsd/chinese' },
          ],
        },
        {
          text: '使用',
          collapsed: false,
          items: [
            { text: '核心工作流', link: '/ai-coding/gsd/workflow' },
            { text: '常用命令', link: '/ai-coding/gsd/commands' },
          ],
        },
        {
          text: '深入',
          collapsed: false,
          items: [
            { text: '配置文件详解', link: '/ai-coding/gsd/configuration' },
            { text: '.planning/ 目录', link: '/ai-coding/gsd/planning-directory' },
            { text: '代理系统', link: '/ai-coding/gsd/agents' },
          ],
        },
        {
          text: '案例',
          collapsed: false,
          items: [
            { text: '实战示例', link: '/ai-coding/gsd/examples' },
            { text: '需求变更', link: '/ai-coding/gsd/milestone' },
            { text: '中断恢复', link: '/ai-coding/gsd/interruption' },
            { text: '技巧 & 踩坑', link: '/ai-coding/gsd/tips' },
          ],
        },
        {
          text: '原理',
          collapsed: false,
          items: [
            { text: '上下文工程原理', link: '/ai-coding/gsd/context-engineering' },
            { text: '进度追踪原理', link: '/ai-coding/gsd/progress-tracking' },
          ],
        },
      ],

      // 本地服务网关
      '/notes/local-gateway/': [
        {
          text: '基础知识',
          collapsed: false,
          items: [
            { text: 'DNS 基础', link: '/notes/local-gateway/00-DNS基础' },
            { text: '反向代理', link: '/notes/local-gateway/02-反向代理' },
            { text: 'macOS 网络基础', link: '/notes/local-gateway/03-macOS网络基础' },
          ],
        },
        {
          text: '实战',
          collapsed: false,
          items: [
            { text: '搭建指南', link: '/notes/local-gateway/01-搭建指南' },
            { text: '服务路由表', link: '/notes/local-gateway/04-服务路由表' },
          ],
        },
      ],

      // Docker 笔记
      '/notes/docker/': [
        {
          text: '入门',
          collapsed: false,
          items: [
            { text: 'Docker 概览', link: '/notes/docker/' },
            { text: '安装与配置', link: '/notes/docker/installation' },
            { text: '核心概念', link: '/notes/docker/basic-concepts' },
          ],
        },
        {
          text: '使用',
          collapsed: false,
          items: [
            { text: '镜像管理', link: '/notes/docker/images' },
            { text: '容器操作', link: '/notes/docker/containers' },
          ],
        },
        {
          text: '深入',
          collapsed: false,
          items: [
            { text: 'Dockerfile 详解', link: '/notes/docker/dockerfile' },
            { text: '数据持久化', link: '/notes/docker/volumes' },
            { text: 'Docker 网络', link: '/notes/docker/networking' },
          ],
        },
        {
          text: '实战',
          collapsed: false,
          items: [
            { text: 'Docker Compose', link: '/notes/docker/compose' },
            { text: '多阶段构建', link: '/notes/docker/multi-stage' },
            { text: 'Docker 与 CI/CD', link: '/notes/docker/cicd' },
          ],
        },
        {
          text: '进阶',
          collapsed: false,
          items: [
            { text: '最佳实践', link: '/notes/docker/best-practices' },
            { text: '常见问题与排查', link: '/notes/docker/troubleshooting' },
          ],
        },
      ],

      // 人生感悟（私有）
      ...(isPrivate ? {
        '/private/life/': [{
          text: '随笔',
          collapsed: false,
          items: [
            { text: '概览', link: '/private/life/' },
            { text: '内求', link: '/private/life/内求' },
            { text: '警惕两种隐蔽的陷阱', link: '/private/life/警惕两种隐蔽的陷阱' },
            { text: '命与运', link: '/private/life/命与运' },
            { text: '理解但选择性赞同', link: '/private/life/理解但选择性赞同' },
            { text: '相信', link: '/private/life/相信' },
            { text: '赢', link: '/private/life/赢' },
            { text: '消极见壁，积极见路', link: '/private/life/消极见壁，积极见路' },
            { text: '事务都是多面的', link: '/private/life/事务都是多面的' },
            { text: '三观与原则', link: '/private/life/sanguan-yuanze' },
          ],
        }, {
          text: '原则',
          collapsed: true,
          items: [
            { text: '我的原则', link: '/private/principles/我的原则' },
          ],
        }],
      } : {}),

      // 金融思维（私有）
      ...(isPrivate ? {
        '/private/finance/': [{
          text: '理论',
          collapsed: false,
          items: [
            { text: '创新扩散理论', link: '/private/finance/rogers-diffusion/' },
            { text: '凯利公式', link: '/private/finance/kelly-criterion/' },
          ],
        }, {
          text: '交易系统',
          collapsed: false,
          items: [
            { text: '职业超级短线交易系统', link: '/private/finance/short-term-trading-system' },
            { text: '我的交易系统', link: '/private/finance/my-trading-system' },
          ],
        }],
      } : {}),
    },

    search: {
      provider: 'local',
    },

    outline: {
      level: [2, 3],
      label: '本页目录',
    },

    lastUpdated: {
      text: '最后更新',
    },

    docFooter: {
      prev: '上一页',
      next: '下一页',
    },
  },
})
