 最近更新<template>
  <div class="chart-wrapper">
    <v-chart class="chart" :option="option" autoresize />
  </div>
</template>

<script setup>
import { ref, provide } from "vue";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { LineChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
} from "echarts/components";
import VChart, { THEME_KEY } from "vue-echarts";

// 注册 ECharts 必须的组件
use([CanvasRenderer, LineChart, TitleComponent, TooltipComponent, GridComponent]);

const option = ref({
  // 提示框美化
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    textStyle: { color: '#333' },
    borderWidth: 0,
    boxShadow: '0 0 10px rgba(0,0,0,0.1)'
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    top: '15%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false, // 🌟 让折线从最左侧开始，不留白
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    axisLine: { lineStyle: { color: '#ddd' } }, // 坐标轴线颜色变淡
    axisLabel: { color: '#999' }
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { type: 'dashed', color: '#eee' } }, // 网格线改用虚线
    axisLabel: { color: '#999' }
  },
  series: [
    {
      name: '浏览量',
      data: [150, 230, 224, 218, 135, 147, 260],
      type: 'line',
      smooth: true,      // 🌟 核心：变成平滑曲线
      symbol: 'circle',  // 拐点圆圈
      symbolSize: 8,
      lineStyle: {
        width: 4,
        color: '#42b983', // Vue 绿色
        shadowColor: 'rgba(66, 185, 131, 0.3)', // 线条阴影
        shadowBlur: 10,
        shadowOffsetY: 8
      },
      itemStyle: {
        color: '#42b983',
        borderWidth: 2,
        borderColor: '#fff'
      },
      // 🌟 核心：渐变面积填充
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(66, 185, 131, 0.3)' }, // 顶部半透明绿
            { offset: 1, color: 'rgba(66, 185, 131, 0)' }    // 底部全透明
          ]
        }
      }
    }
  ]
});
</script>

<style scoped>
.chart-wrapper {
  width: 100%;
  height: 350px; /* 适当调低高度，更适合看板布局 */
}
.chart {
  width: 100%;
  height: 100%;
}
</style>