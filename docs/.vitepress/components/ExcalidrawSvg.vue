<script setup lang="ts">
import { useData } from 'vitepress'
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useSvgExport } from '../composables/useSvgExport'

const props = defineProps<{
  src: string
}>()

const { isDark } = useData()
const { exportDiagram: exportDiagramFn } = useSvgExport()
const svgContainerRef = ref<HTMLElement | null>(null)

// 导出设置
const exportFormat = ref<'svg' | 'png'>('svg')
const exportBg = ref<'transparent' | 'white' | 'black' | 'auto'>('transparent')
const fullscreenRef = ref<HTMLElement | null>(null)
const isFullscreen = ref(false)
const loading = ref(true)
const error = ref('')
const svgContent = ref('')

// 缩放与平移状态
const scale = ref(1)
const translateX = ref(0)
const translateY = ref(0)
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const isSmooth = ref(true)

const scalePercent = computed(() => Math.round(scale.value * 100))

const svgUrl = computed(() => {
  return props.src.replace(/\.excalidraw$/, '.svg')
})

async function loadSvg() {
  loading.value = true
  error.value = ''
  svgContent.value = ''

  try {
    const resp = await fetch(svgUrl.value)
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const text = await resp.text()

    if (!text.startsWith('<svg')) {
      throw new Error('Invalid SVG content')
    }

    svgContent.value = text
    nextTick(() => {
      if (svgContainerRef.value) {
        svgContainerRef.value.innerHTML = text
      }
    })
  } catch (e: any) {
    error.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
}

function resetView() {
  scale.value = 1
  translateX.value = 0
  translateY.value = 0
}

function zoomIn() {
  scale.value = Math.min(scale.value * 1.25, 5)
}

function zoomOut() {
  scale.value = Math.max(scale.value * 0.8, 0.1)
}

function handleWheel(e: WheelEvent) {
  e.preventDefault()
  if (e.deltaY < 0) {
    scale.value = Math.min(scale.value + 0.1, 5)
  } else {
    scale.value = Math.max(scale.value - 0.1, 0.1)
  }
}

function handleMouseUp() {
  if (!isDragging.value) return
  isDragging.value = false
  isSmooth.value = true
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', handleMouseUp)
}

function onDragMove(e: MouseEvent) {
  if (!isDragging.value) return
  translateX.value = e.clientX - dragStart.value.x
  translateY.value = e.clientY - dragStart.value.y
}

function handleMouseDown(e: MouseEvent) {
  if (e.button !== 0) return
  isDragging.value = true
  isSmooth.value = false
  dragStart.value = { x: e.clientX - translateX.value, y: e.clientY - translateY.value }
  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup', handleMouseUp)
}

function openFullscreen() {
  resetView()
  isFullscreen.value = true
  document.body.style.overflow = 'hidden'
  nextTick(() => {
    if (fullscreenRef.value && svgContent.value) {
      fullscreenRef.value.innerHTML = svgContent.value
    }
  })
}

function closeFullscreen() {
  isFullscreen.value = false
  document.body.style.overflow = ''
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isFullscreen.value) {
    closeFullscreen()
  }
}

async function exportDiagram() {
  const svg = svgContainerRef.value?.querySelector('svg')
  if (!svg) return

  const bg = exportBg.value === 'auto'
    ? (isDark.value ? 'black' : 'white')
    : exportBg.value

  const name = props.src.split('/').pop()?.replace(/\.excalidraw$/, '') || 'diagram'

  await exportDiagramFn(svg as SVGSVGElement, name, {
    format: exportFormat.value,
    background: bg
  })
}

onMounted(() => {
  loadSvg()
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})

watch(() => props.src, () => {
  loadSvg()
})
</script>

<template>
  <div class="excalidraw-container">
    <!-- 加载状态 -->
    <div v-if="loading" class="excalidraw-loading">
      <svg class="excalidraw-spinner" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      </svg>
      <span>正在加载图表...</span>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="excalidraw-error">
      <span>图表加载失败: {{ error }}</span>
    </div>

    <!-- SVG 容器 -->
    <div
      v-show="!loading && !error"
      ref="svgContainerRef"
      class="excalidraw-wrapper"
    />

    <!-- 全屏按钮 -->
    <button
      v-if="!loading && !error"
      class="excalidraw-fullscreen-btn"
      title="全屏查看"
      @click="openFullscreen"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
      </svg>
    </button>

    <!-- 全屏遮罩 -->
    <Teleport to="body">
      <Transition name="fullscreen">
        <div v-if="isFullscreen" class="excalidraw-fullscreen-overlay" @click.self="closeFullscreen">
          <div class="excalidraw-fullscreen-content">
            <button class="excalidraw-close-btn" @click="closeFullscreen">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <div
              ref="fullscreenRef"
              class="excalidraw-fullscreen-diagram"
              :class="{ 'is-dragging': isDragging, 'is-smooth': isSmooth }"
              :style="{ transform: `translate(${translateX}px, ${translateY}px) scale(${scale})` }"
              @mousedown="handleMouseDown"
              @wheel="handleWheel"
            />

            <!-- 底部工具栏 -->
            <div class="excalidraw-toolbar">
              <button class="excalidraw-toolbar-btn" title="缩小" @click="zoomOut">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
              <span class="excalidraw-toolbar-label">{{ scalePercent }}%</span>
              <button class="excalidraw-toolbar-btn" title="放大" @click="zoomIn">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
              <div class="excalidraw-toolbar-divider" />
              <button class="excalidraw-toolbar-btn" title="复位" @click="resetView">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                  <path d="M3 3v5h5"/>
                </svg>
              </button>
              <div class="excalidraw-toolbar-divider" />
              <select v-model="exportFormat" class="excalidraw-toolbar-select" title="导出格式">
                <option value="svg">SVG</option>
                <option value="png">PNG</option>
              </select>
              <select v-model="exportBg" class="excalidraw-toolbar-select" title="背景颜色">
                <option value="transparent">透明</option>
                <option value="white">白色</option>
                <option value="black">黑色</option>
                <option value="auto">跟随主题</option>
              </select>
              <button class="excalidraw-toolbar-btn" title="下载" @click="exportDiagram">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.excalidraw-container {
  position: relative;
  margin: 1.5rem 0;
}

.excalidraw-wrapper {
  padding: 1.5rem;
  border-radius: 8px;
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  overflow-x: auto;
  text-align: center;
}

.excalidraw-wrapper :deep(svg) {
  max-width: 100%;
  height: auto;
}

/* 加载状态 */
.excalidraw-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem;
  border-radius: 8px;
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
}

.excalidraw-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 错误状态 */
.excalidraw-error {
  padding: 1.5rem;
  border-radius: 8px;
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-danger-1);
  text-align: center;
}

/* 全屏按钮 */
.excalidraw-fullscreen-btn {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  background-color: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
}

.excalidraw-container:hover .excalidraw-fullscreen-btn {
  opacity: 1;
}

.excalidraw-fullscreen-btn:hover {
  background-color: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

/* 全屏遮罩 */
.excalidraw-fullscreen-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background-color: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
}

.excalidraw-fullscreen-content {
  position: relative;
  width: 100%;
  height: 95vh;
  max-width: 95vw;
  border-radius: 12px;
  background-color: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  overflow: hidden;
}

.excalidraw-close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  background-color: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 2;
}

.excalidraw-close-btn:hover {
  background-color: var(--vp-c-danger-soft);
  color: var(--vp-c-danger-1);
}

.excalidraw-fullscreen-diagram {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 2rem;
  padding-bottom: 4rem;
  box-sizing: border-box;
  cursor: grab;
  transform-origin: center center;
  user-select: none;
}

.excalidraw-fullscreen-diagram.is-smooth {
  transition: transform 0.2s ease;
}

.excalidraw-fullscreen-diagram.is-dragging {
  cursor: grabbing;
  transition: none;
}

.excalidraw-fullscreen-diagram :deep(svg) {
  max-width: 100%;
  max-height: calc(95vh - 6rem);
}

/* 底部工具栏 */
.excalidraw-toolbar {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.5rem;
  border-radius: 8px;
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 2;
}

.excalidraw-toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.15s ease;
}

.excalidraw-toolbar-btn:hover {
  background-color: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.excalidraw-toolbar-label {
  min-width: 3rem;
  text-align: center;
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  font-variant-numeric: tabular-nums;
}

.excalidraw-toolbar-divider {
  width: 1px;
  height: 1.25rem;
  margin: 0 0.25rem;
  background-color: var(--vp-c-divider);
}

.excalidraw-toolbar-select {
  height: 2rem;
  padding: 0 0.5rem;
  border: none;
  border-radius: 6px;
  background-color: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.excalidraw-toolbar-select:hover {
  background-color: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.excalidraw-toolbar-select:focus {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 1px;
}

/* 过渡动画 */
.fullscreen-enter-active,
.fullscreen-leave-active {
  transition: all 0.3s ease;
}

.fullscreen-enter-from,
.fullscreen-leave-to {
  opacity: 0;
}

.fullscreen-enter-from .excalidraw-fullscreen-content,
.fullscreen-leave-to .excalidraw-fullscreen-content {
  transform: scale(0.9);
}

/* 深色模式 */
html.dark .excalidraw-wrapper {
  background-color: var(--vp-c-bg-alt);
}

/* 响应式 */
@media (max-width: 768px) {
  .excalidraw-wrapper {
    padding: 1rem;
  }

  .excalidraw-fullscreen-overlay {
    padding: 1rem;
  }

  .excalidraw-fullscreen-diagram {
    padding: 1rem;
    padding-bottom: 4rem;
  }
}
</style>
