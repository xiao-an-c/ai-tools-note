import DefaultTheme from 'vitepress/theme'
import Mermaid from '../components/Mermaid.vue'
import ExcalidrawSvg from '../components/ExcalidrawSvg.vue'
import KellyCalculator from '../components/KellyCalculator.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('Mermaid', Mermaid)
    app.component('ExcalidrawSvg', ExcalidrawSvg)
    app.component('KellyCalculator', KellyCalculator)
  }
}
