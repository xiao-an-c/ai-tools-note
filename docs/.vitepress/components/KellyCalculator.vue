<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useData } from 'vitepress'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const { isDark } = useData()

const winRate = ref(55)
const winReturn = ref(10)
const lossRate = ref(5)
const rounds = ref(50)

const chartRef = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const kelly = computed(() => {
  const p = winRate.value / 100
  const q = 1 - p
  const W = winReturn.value / 100
  const L = lossRate.value / 100
  if (L === 0) return null
  return p / L - q / W
})

const advice = computed(() => {
  const f = kelly.value
  if (f === null) return { text: '亏损率不能为 0', color: 'var(--vp-c-danger-1)' }
  if (f <= 0) return { text: '不建议投资（期望收益为负）', color: 'var(--vp-c-danger-1)' }
  if (f > 1) return { text: `建议仓位: 满仓（凯利值 ${Math.round(f * 100)}% 超过 100%，可考虑加杠杆）`, color: 'var(--vp-c-brand-1)' }
  return { text: `建议仓位: ${Math.round(f * 100)}%（半凯利: ${Math.round(f * 50)}%）`, color: 'var(--vp-c-brand-1)' }
})

function simulate(f: number, n: number): number[] {
  const p = winRate.value / 100
  const W = winReturn.value / 100
  const L = lossRate.value / 100
  const result = [100]
  let capital = 100
  const g = p * Math.log(1 + f * W) + (1 - p) * Math.log(1 - f * L)
  for (let i = 0; i < n; i++) {
    capital = capital * Math.exp(g)
    result.push(Math.round(capital * 100) / 100)
  }
  return result
}

function simulateFixed(n: number): number[] {
  const p = winRate.value / 100
  const W = winReturn.value / 100
  const L = lossRate.value / 100
  const bet = 20
  const result = [100]
  let capital = 100
  for (let i = 0; i < n; i++) {
    capital = capital + p * bet * W - (1 - p) * bet * L
    result.push(Math.round(capital * 100) / 100)
  }
  return result
}

const xLabels = computed(() => {
  const n = rounds.value
  const labels: string[] = []
  for (let i = 0; i <= n; i++) labels.push(String(i))
  return labels
})

const series = computed(() => {
  const n = rounds.value
  const f = kelly.value
  if (f === null || f <= 0) return []

  const k = Math.min(f, 1)
  const hk = k / 2
  const dk = Math.min(f * 2, 1)

  return [
    { name: `凯利 ${Math.round(k * 100)}%`, data: simulate(k, n) },
    { name: `半凯利 ${Math.round(hk * 100)}%`, data: simulate(hk, n) },
    { name: `2 倍凯利 ${Math.round(dk * 100)}%`, data: simulate(dk, n) },
    { name: '固定金额', data: simulateFixed(n) },
  ]
})

function buildOption() {
  const textColor = isDark.value ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'
  const lineColor = isDark.value ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'

  return {
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: isDark.value ? '#1e1e1e' : '#fff',
      borderColor: isDark.value ? '#333' : '#ddd',
      textStyle: { color: textColor },
    },
    legend: {
      data: series.value.map(s => s.name),
      textStyle: { color: textColor },
      top: 0,
    },
    grid: {
      top: 35,
      right: 20,
      bottom: 30,
      left: 55,
    },
    xAxis: {
      type: 'category' as const,
      data: xLabels.value,
      name: '轮次',
      nameTextStyle: { color: textColor },
      axisLabel: { color: textColor },
      axisLine: { lineStyle: { color: lineColor } },
    },
    yAxis: {
      type: 'value' as const,
      name: '资金',
      nameTextStyle: { color: textColor },
      axisLabel: { color: textColor },
      splitLine: { lineStyle: { color: lineColor } },
    },
    series: series.value.map(s => ({
      name: s.name,
      type: 'line' as const,
      data: s.data,
      smooth: true,
      showSymbol: false,
      lineStyle: { width: 2 },
    })),
  }
}

function renderChart() {
  if (!chartRef.value) return
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }
  chartInstance.setOption(buildOption(), true)
}

watch([winRate, winReturn, lossRate, rounds], () => {
  renderChart()
})

watch(isDark, () => {
  renderChart()
})

onMounted(() => {
  renderChart()
  window.addEventListener('resize', () => chartInstance?.resize())
})
</script>

<template>
  <div class="kelly-calc">
    <div class="kelly-inputs">
      <div class="kelly-field">
        <label>胜率</label>
        <div class="kelly-control">
          <input type="range" v-model.number="winRate" min="1" max="99" step="1" />
          <span class="kelly-value">{{ winRate }}%</span>
        </div>
      </div>
      <div class="kelly-field">
        <label>赢时收益率</label>
        <div class="kelly-control">
          <input type="range" v-model.number="winReturn" min="1" max="100" step="1" />
          <span class="kelly-value">{{ winReturn }}%</span>
        </div>
      </div>
      <div class="kelly-field">
        <label>亏时亏损率</label>
        <div class="kelly-control">
          <input type="range" v-model.number="lossRate" min="1" max="100" step="1" />
          <span class="kelly-value">{{ lossRate }}%</span>
        </div>
      </div>
      <div class="kelly-field">
        <label>模拟轮数</label>
        <div class="kelly-control">
          <input type="range" v-model.number="rounds" min="10" max="200" step="5" />
          <span class="kelly-value">{{ rounds }}</span>
        </div>
      </div>
    </div>

    <div class="kelly-result" :style="{ color: advice.color }">
      {{ advice.text }}
    </div>

    <div ref="chartRef" class="kelly-chart" />
  </div>
</template>

<style scoped>
.kelly-calc {
  margin: 1.5rem 0;
  padding: 1.5rem;
  border-radius: 8px;
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
}

.kelly-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem 2rem;
  margin-bottom: 1rem;
}

.kelly-field label {
  display: block;
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
  margin-bottom: 0.3rem;
}

.kelly-control {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.kelly-control input[type="range"] {
  flex: 1;
  height: 4px;
  cursor: pointer;
  accent-color: var(--vp-c-brand-1);
}

.kelly-value {
  min-width: 3.5em;
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.kelly-result {
  padding: 0.6rem 1rem;
  margin-bottom: 1rem;
  border-radius: 6px;
  background-color: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  font-weight: 500;
}

.kelly-chart {
  width: 100%;
  height: 350px;
}

html.dark .kelly-calc {
  background-color: var(--vp-c-bg-alt);
}

@media (max-width: 640px) {
  .kelly-inputs {
    grid-template-columns: 1fr;
  }
}
</style>
