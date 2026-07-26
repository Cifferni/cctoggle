<script setup>
import { ref, shallowRef, onMounted, onBeforeUnmount, watch } from "vue";

// 按需引入 echarts，仅打包用到的模块，减小体积
import * as echarts from "echarts/core";
import { BarChart, LineChart, PieChart } from "echarts/charts";
import {
  GridComponent, TooltipComponent, LegendComponent, TitleComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  BarChart, LineChart, PieChart,
  GridComponent, TooltipComponent, LegendComponent, TitleComponent,
  CanvasRenderer,
]);

const props = defineProps({
  option: { type: Object, required: true },
  height: { type: String, default: "260px" },
});

const el = ref(null);
const chart = shallowRef(null);
let ro = null;

function render() {
  if (!chart.value) return;
  chart.value.setOption(props.option, true);
}

onMounted(() => {
  chart.value = echarts.init(el.value);
  render();
  ro = new ResizeObserver(() => chart.value && chart.value.resize());
  ro.observe(el.value);
});

onBeforeUnmount(() => {
  if (ro) ro.disconnect();
  if (chart.value) { chart.value.dispose(); chart.value = null; }
});

watch(() => props.option, render, { deep: true });
</script>

<template>
  <div ref="el" class="echart" :style="{ height }"></div>
</template>

<style scoped>
.echart { width: 100%; }
</style>
