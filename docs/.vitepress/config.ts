import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/ai-tools-note/',
  lang: 'zh-CN',
  title: 'AI 工具学习笔记',
  description: '记录 AI 编程工具的学习过程',

  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: 'GSD 教程', link: '/ai-coding/gsd/' },
    ],

    sidebar: {
      '/ai-coding/': [
        {
          text: 'AI 编程助手',
          items: [
            { text: '概览', link: '/ai-coding/' },
            {
              text: 'GSD (Get Shit Done)',
              items: [
                { text: '工具概览', link: '/ai-coding/gsd/' },
                { text: '安装配置', link: '/ai-coding/gsd/installation' },
                { text: '核心工作流', link: '/ai-coding/gsd/workflow' },
                { text: '常用命令', link: '/ai-coding/gsd/commands' },
                { text: '实战示例', link: '/ai-coding/gsd/examples' },
                { text: '技巧 & 踩坑', link: '/ai-coding/gsd/tips' },
              ],
            },
          ],
        },
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
