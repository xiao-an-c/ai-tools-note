import { excalidrawToSvg, exportAll, closeBrowser } from './excalidraw-to-svg.mjs'
import { existsSync, statSync, readFileSync, mkdirSync, copyFileSync } from 'fs'
import { resolve, join, relative, dirname } from 'path'
import { findExcalidrawFiles } from './excalidraw-to-svg.mjs'

export default function excalidrawPlugin(options = {}) {
  const docsRoot = resolve(options.docsRoot || 'docs')
  let isBuild = false
  let buildExported = false
  let svgCopied = false
  let outDir = ''

  return {
    name: 'vite-plugin-excalidraw',

    configResolved(config) {
      isBuild = config.command === 'build'
      outDir = config.build?.outDir || ''
    },

    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0]
        if (!url || !url.endsWith('.svg')) return next()

        const svgRelPath = url.replace(/^\//, '')
        const svgFullPath = join(docsRoot, svgRelPath)

        if (!existsSync(svgFullPath)) return next()

        const excalidrawPath = svgFullPath.replace(/\.svg$/, '.excalidraw')
        if (!existsSync(excalidrawPath)) return next()

        const needsRegen = !existsSync(svgFullPath) ||
          statSync(excalidrawPath).mtimeMs > statSync(svgFullPath).mtimeMs

        if (!needsRegen) return next()

        try {
          await excalidrawToSvg(excalidrawPath, svgFullPath)
        } catch (err) {
          console.error(`[excalidraw] Failed to generate SVG for ${excalidrawPath}:`, err.message)
        }

        next()
      })

      // 监听 .excalidraw 文件变更，自动重新生成 SVG 并通知浏览器刷新
      server.watcher.on('change', async (file) => {
        if (!file.endsWith('.excalidraw')) return

        const svgPath = file.replace(/\.excalidraw$/, '.svg')
        try {
          await excalidrawToSvg(file, svgPath)
          console.log(`[excalidraw] Auto-regenerated: ${svgPath}`)
          server.ws.send({ type: 'full-reload' })
        } catch (err) {
          console.error(`[excalidraw] Auto-regenerate failed for ${svgPath}:`, err.message)
        }
      })
    },

    async buildStart() {
      if (!isBuild || buildExported) return
      buildExported = true
      console.log('[excalidraw] Exporting all .excalidraw files to SVG...')
      const results = await exportAll(docsRoot)
      const exported = results.filter(r => r.status === 'exported')
      const errors = results.filter(r => r.status === 'error')
      const skipped = results.filter(r => r.status === 'skipped')
      if (exported.length) console.log(`[excalidraw] Exported ${exported.length} file(s)`)
      if (skipped.length) console.log(`[excalidraw] Skipped ${skipped.length} up-to-date file(s)`)
      if (errors.length) {
        console.error(`[excalidraw] ${errors.length} error(s):`)
        for (const e of errors) console.error(`  ${e.file}: ${e.error}`)
      }
    },

    // 构建完成后，将 SVG 文件复制到 dist 目录
    // VitePress 只处理 Markdown 中引用的静态资源，
    // 通过 Vue 组件 fetch() 加载的 SVG 需要手动复制
    writeBundle() {
      if (!isBuild || !outDir || svgCopied) return
      svgCopied = true

      // 扫描所有 .excalidraw 文件，复制对应的 .svg 到 dist
      const svgFiles = findExcalidrawFiles(docsRoot)
        .map(f => f.replace(/\.excalidraw$/, '.svg'))
        .filter(f => existsSync(f))

      for (const svgPath of svgFiles) {
        const relPath = relative(docsRoot, svgPath)
        const destPath = join(outDir, relPath)
        const destDir = dirname(destPath)

        if (!existsSync(destDir)) {
          mkdirSync(destDir, { recursive: true })
        }

        copyFileSync(svgPath, destPath)
      }

      if (svgFiles.length) {
        console.log(`[excalidraw] Copied ${svgFiles.length} SVG file(s) to dist`)
      }
    },

    buildEnd() {
      closeBrowser()
    },

    closeBundle() {
      closeBrowser()
    }
  }
}
