import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/ai-tools-note/',
  lang: 'zh-CN',
  title: '学习笔记',
  description: '记录学习过程',

  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: 'GSD 笔记', link: '/ai-coding/gsd/' },
    ],

    sidebar: {
      // GSD 笔记 - 只在 /ai-coding/gsd/ 路径下显示
      '/ai-coding/gsd/': [
        {
          text: '入门',
          collapsed: false,
          items: [
            { text: '工具概览', link: '/ai-coding/gsd/' },
            { text: '安装配置', link: '/ai-coding/gsd/installation' },
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
            { text: '技巧 & 踩坑', link: '/ai-coding/gsd/tips' },
          ],
        },
        {
          text: '原理',
          collapsed: false,
          items: [
            { text: '上下文工程原理', link: '/ai-coding/gsd/context-engineering' },
          ],
        },
      ],

      // 未来其他工具可以在这里添加，例如：
      // '/ai-coding/cursor/': [...],
      // '/ai-coding/mcp/': [...],
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
