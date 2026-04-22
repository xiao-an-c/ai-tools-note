import puppeteer from 'puppeteer-core'
import { readFileSync, writeFileSync, existsSync, statSync, readdirSync } from 'fs'
import { resolve, dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

let browserInstance = null
let workerPage = null

async function getBrowser() {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await puppeteer.launch({
      headless: 'new',
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    })
  }
  return browserInstance
}

/**
 * 获取或创建带有 Excalidraw 库的持久页面
 * 复用同一个 page 避免重复加载本地 bundle (~8MB)
 */
async function getWorkerPage() {
  try {
    if (workerPage && typeof workerPage.isConnected === 'function' && workerPage.isConnected()) {
      return workerPage
    }
  } catch {}

  // 上一个 page 已失效，创建新的
  if (workerPage) {
    try { await workerPage.close() } catch {}
    workerPage = null
  }

  const browser = await getBrowser()
  workerPage = await browser.newPage()

  const vendorPath = resolve(__dirname, 'vendor/excalidraw-standalone.js')
  await workerPage.setContent(`<!DOCTYPE html>
<html><head><style>html, body { margin:0; padding:0; }</style></head><body></body></html>`)
  await workerPage.addScriptTag({ path: vendorPath })

  // 等待 IIFE 执行完成并暴露全局变量
  await workerPage.evaluate(() => {
    return new Promise((resolve, reject) => {
      const check = () => {
        if (typeof ExcalidrawBundle !== 'undefined') return resolve()
        setTimeout(check, 100)
      }
      check()
      setTimeout(() => reject(new Error('ExcalidrawBundle not loaded after 10s')), 10000)
    })
  })

  return workerPage
}

export async function closeBrowser() {
  if (workerPage) {
    await workerPage.close().catch(() => {})
    workerPage = null
  }
  if (browserInstance) {
    await browserInstance.close().catch(() => {})
    browserInstance = null
  }
}

function calcViewport(elements) {
  if (!elements || elements.length === 0) {
    return { width: 1200, height: 800 }
  }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

  for (const el of elements) {
    if (el.isDeleted) continue
    const x = el.x ?? 0
    const y = el.y ?? 0
    const w = el.width ?? 0
    const h = el.height ?? 0
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x + w)
    maxY = Math.max(maxY, y + h)
  }

  if (!isFinite(minX)) {
    return { width: 1200, height: 800 }
  }

  const padding = 120
  return {
    width: Math.max(800, maxX - minX + padding * 2),
    height: Math.max(600, maxY - minY + padding * 2),
  }
}

/**
 * 将 .excalidraw 文件转换为 SVG
 * @param {string} excalidrawPath - .excalidraw 文件绝对路径
 * @param {string} [outputPath] - SVG 输出路径，省略则不写文件
 * @returns {Promise<string>} SVG 字符串
 */
export async function excalidrawToSvg(excalidrawPath, outputPath) {
  const data = JSON.parse(readFileSync(excalidrawPath, 'utf-8'))
  const { elements = [], appState = {}, files = {} } = data
  const { width, height } = calcViewport(elements)

  const page = await getWorkerPage()

  const svgHtml = await page.evaluate(
    ({ elements, appState, files, width, height }) => {
      // ExcalidrawBundle 是 IIFE 全局变量，exportToSvg 是命名导出
      const { exportToSvg } = ExcalidrawBundle
      return exportToSvg({
        elements,
        appState: {
          ...appState,
          exportBackground: true,
          exportWithDarkMode: false,
        },
        files,
        width,
        height,
      }).then(svg => svg.outerHTML)
    },
    { elements, appState, files, width, height }
  )

  if (outputPath) {
    writeFileSync(outputPath, svgHtml, 'utf-8')
  }

  return svgHtml
}

/**
 * 批量导出目录下所有 .excalidraw 文件为 SVG
 * @param {string} rootDir - 扫描根目录
 * @returns {Promise<Array<{file: string, status: string, svgPath?: string, error?: string}>>}
 */
export async function exportAll(rootDir) {
  const excalidrawFiles = findExcalidrawFiles(rootDir)
  const results = []

  for (const filePath of excalidrawFiles) {
    const svgPath = filePath.replace(/\.excalidraw$/, '.svg')
    const needsExport = !existsSync(svgPath) ||
      statSync(filePath).mtimeMs > statSync(svgPath).mtimeMs

    if (!needsExport) {
      results.push({ file: filePath, status: 'skipped' })
      continue
    }

    try {
      await excalidrawToSvg(filePath, svgPath)
      results.push({ file: filePath, status: 'exported', svgPath })
    } catch (err) {
      results.push({ file: filePath, status: 'error', error: err.message })
    }
  }

  return results
}

function findExcalidrawFiles(dir) {
  const results = []
  const entries = readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...findExcalidrawFiles(fullPath))
    } else if (entry.name.endsWith('.excalidraw')) {
      results.push(fullPath)
    }
  }

  return results
}

export { findExcalidrawFiles }
