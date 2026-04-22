export interface ExportOptions {
  format?: 'svg' | 'png'
  background?: 'transparent' | 'white' | 'black'
  scale?: number
}

export function useSvgExport() {
  async function exportAsPng(
    svgElement: SVGSVGElement | null,
    filename: string,
    background: 'transparent' | 'white' | 'black' = 'transparent',
    scale = 4,
  ) {
    if (!svgElement) return

    const clone = svgElement.cloneNode(true) as SVGSVGElement
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')

    const viewBox = svgElement.viewBox.baseVal
    const bbox = svgElement.getBoundingClientRect()
    const width = viewBox.width || bbox.width || 800
    const height = viewBox.height || bbox.height || 600

    clone.setAttribute('width', width.toString())
    clone.setAttribute('height', height.toString())

    const svgString = new XMLSerializer().serializeToString(clone)
    const base64Svg = btoa(unescape(encodeURIComponent(svgString)))
    const dataUrl = `data:image/svg+xml;base64,${base64Svg}`

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width * scale
      canvas.height = height * scale
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.scale(scale, scale)

      if (background !== 'transparent') {
        ctx.fillStyle = background === 'white' ? '#ffffff' : '#000000'
        ctx.fillRect(0, 0, width, height)
      }

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob((pngBlob) => {
        if (!pngBlob) return
        const a = document.createElement('a')
        a.href = URL.createObjectURL(pngBlob)
        a.download = filename
        a.click()
        URL.revokeObjectURL(a.href)
      }, 'image/png')
    }
    img.src = dataUrl
  }

  function exportAsSvg(
    svgElement: SVGSVGElement | null,
    filename = 'diagram.svg',
    background: 'transparent' | 'white' | 'black' = 'transparent',
  ) {
    if (!svgElement) return

    const clone = svgElement.cloneNode(true) as SVGSVGElement
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')

    if (background !== 'transparent') {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      const viewBox = clone.viewBox.baseVal
      rect.setAttribute('x', '0')
      rect.setAttribute('y', '0')
      rect.setAttribute('width', viewBox.width.toString())
      rect.setAttribute('height', viewBox.height.toString())
      rect.setAttribute('fill', background === 'white' ? '#ffffff' : '#000000')
      clone.insertBefore(rect, clone.firstChild)
    }

    const svgString = `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  async function exportDiagram(
    svgElement: SVGSVGElement | null,
    filename: string,
    options: ExportOptions = {},
  ) {
    if (!svgElement) return

    const { format = 'svg', background = 'transparent', scale = 2 } = options
    const ext = format === 'png' ? 'png' : 'svg'
    const fullFilename = filename.replace(/\.\w+$/, '') + `.${ext}`

    if (format === 'png') {
      await exportAsPng(svgElement, fullFilename, background, scale)
    } else {
      exportAsSvg(svgElement, fullFilename, background)
    }
  }

  return { exportDiagram, exportAsSvg, exportAsPng }
}
