import { defineConfig } from 'vitepress'

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
      { text: 'GSD 笔记', link: '/ai-coding/gsd/' },
      { text: '基础设施', items: [
        { text: 'Docker 笔记', link: '/notes/docker/' },
        { text: '本地服务网关', link: '/notes/local-gateway/01-搭建指南' },
      ]},
      { text: 'Anthropic 博客', link: '/ai-coding/anthropic-blog/' },
      { text: '人生感悟', link: '/life/' },
      { text: '金融思维', link: '/finance/rogers-diffusion/' },
    ],

    sidebar: {
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

      // 金融思维
      '/finance/': [
        {
          text: '理论',
          collapsed: false,
          items: [
            { text: '创新扩散理论', link: '/finance/rogers-diffusion/' },
          ],
        },
      ],

      // 人生感悟
      '/life/': [
        {
          text: '随笔',
          collapsed: false,
          items: [
            { text: '概览', link: '/life/' },
            { text: '内求', link: '/life/内求' },
            { text: '警惕两种隐蔽的陷阱', link: '/life/警惕两种隐蔽的陷阱' },
            { text: '命与运', link: '/life/命与运' },
            { text: '理解但选择性赞同', link: '/life/理解但选择性赞同' },
            { text: '相信', link: '/life/相信' },
            { text: '赢', link: '/life/赢' },
            { text: '消极见壁，积极见路', link: '/life/消极见壁，积极见路' },
            { text: '事务都是多面的', link: '/life/事务都是多面的' },
            { text: '三观与原则', link: '/life/sanguan-yuanze' },
          ],
        },
        ...(isPrivate ? [{
          text: '原则',
          collapsed: true,
          items: [
            { text: '我的原则', link: '/private/principles/我的原则' },
          ],
        }] : []),
      ],
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
