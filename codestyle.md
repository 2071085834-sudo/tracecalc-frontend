# TraceCalc 前端代码规范

本规范以 [Vue 官方风格指南](https://vuejs.org/style-guide/)、[Vue TypeScript 指南](https://vuejs.org/guide/typescript/overview.html) 和 [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) 为依据。构建以 `vue-tsc` 严格类型检查为准。

## 组件与命名

- 使用 Vue 3 Composition API 和 `<script setup lang="ts">`。
- 组件文件使用 `PascalCase.vue`，变量与函数使用 `camelCase`，类型使用 `PascalCase`。
- 页面组件只编排状态；API、共享类型和可复用展示拆到独立模块。
- props 和 emits 必须显式声明类型，不修改 props；列表必须使用稳定数据库 ID 作为 `key`。

## 状态与请求

- 最终结果只能来自 API 响应，前端不得复刻计算逻辑。
- 所有写请求生成请求编号；超时重试复用原编号，防止重复历史。
- 加载时禁用重复提交；错误出现时清除旧结果；异步响应不得覆盖用户后来修改的输入。
- 主题可以保存在 `localStorage`；计算历史不得以浏览器缓存冒充后端数据库。

## 样式与可访问性

- 使用 CSS 变量统一主题；组件不引入外部字体或大型 UI 库。
- 交互元素使用语义化标签、可见焦点、关联标签和必要的 ARIA 状态。
- 长表达式和结果必须可换行；390、768、1440 像素宽度不得横向溢出。
- 颜色不是唯一状态表达方式，错误需要文字提示，加载状态需要可读文本。

## 提交前检查

```powershell
pnpm test
pnpm typecheck
pnpm build
```

业务缺陷修复后增加相应交互或 API 客户端回归测试。

