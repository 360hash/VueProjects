export const articles = [
  {
    id: 1,
    title: "Vue 3 入门指南",
    summary: "快速掌握 Vue3 基础语法",
    content: `
# Vue 3 入门指南

## 为什么选择 Vue 3

Vue 3 使用 Composition API，让逻辑更清晰。

### 示例代码

\`\`\`js
import { ref } from 'vue'
const count = ref(0)
\`\`\`

- 响应式系统更快
- 更好的 TypeScript 支持
- 更小体积

> Vue 3 是现代前端开发的主流选择
`,
    tags: ["Vue", "前端"],
    createdAt: "2026-06-21"
  },

  {
    id: 2,
    title: "Vite 工程化实践",
    summary: "构建现代前端项目",
    content: `
# Vite 工程化实践

Vite 是下一代前端构建工具。

## 特点

- 极速启动
- 热更新极快
- 基于 ES Module

## 适合项目

适合 Vue / React 项目开发。
`,
    tags: ["Vite", "工程化"],
    createdAt: "2026-06-20"
  }
]