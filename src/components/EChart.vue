<script setup>
import { computed, toRef } from "vue";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Tooltip, Legend, Filler,
} from "chart.js";
import { Bar, Line, Pie } from "vue-chartjs";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Tooltip, Legend, Filler,
);

const props = defineProps({
  type: { type: String, required: true },       // "bar" | "line" | "pie"
  data: { type: Object, required: true },        // Chart.js data
  options: { type: Object, default: () => ({}) }, // Chart.js options
  height: { type: String, default: "260px" },
});

const componentMap = { bar: Bar, line: Line, pie: Pie };
const chartComp = computed(() => componentMap[props.type] || Bar);
</script>

<template>
  <div class="chart-wrap" :style="{ height }">
    <component :is="chartComp" :data="data" :options="options" />
  </div>
</template>

<style scoped>
.chart-wrap { position: relative; width: 100%; }
.chart-wrap :deep(canvas) { width: 100% !important; height: 100% !important; }
</style>
