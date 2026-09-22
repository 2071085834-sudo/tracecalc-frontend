# 算迹 TraceCalc · 前端

TraceCalc 前端是 Vue 3 + TypeScript 单页工作台，负责输入、请求、结果与步骤呈现、历史笔记、换算工具、主题及响应式布局。所有最终数值均来自后端 API。

## 已实现功能

- 表达式输入、快捷符号、Enter 计算、Esc 清空、加载和结构化错误位置。
- 后端真实步骤、近似结果标记，错误请求不会把旧结果显示成新结果。
- 历史分页、关键词搜索、类型/收藏筛选、备注、收藏、重用和指定删除。
- 长度/质量/温度单位换算，2/8/10/16 进制转换。
- 浅色/深色主题；390、768、1440 像素响应式布局；键盘可见焦点。
- 匿名工作区初始化、带凭证请求、10 秒超时、同请求编号安全重试。

## 环境与安装

- Node.js 24（当前验证版本 v24.19.0）
- pnpm 11（仓库记录 `packageManager` 和 `pnpm-lock.yaml`）

```powershell
pnpm install --frozen-lockfile
Copy-Item .env.example .env
pnpm dev
```

开发地址为 `http://127.0.0.1:5173`。Vite 会把 `/api` 代理到 `http://127.0.0.1:8000`，请先启动后端。也可设置 `VITE_API_BASE` 指向独立 API 地址；跨域时后端必须允许准确来源并允许凭证。

## 测试与构建

```powershell
pnpm test
pnpm typecheck
pnpm build
pnpm preview
```

本地验收结果：4 项组件/API 客户端测试通过，TypeScript 严格检查通过，Vite 生产构建通过。浏览器实测覆盖计算、错误、历史、备注收藏搜索、换算、后端停止/重启，以及 390/768/1440 像素无横向溢出。

## 目录

```text
src/
├─ api.ts                    # 统一请求、超时和错误
├─ types.ts                  # API 领域类型
├─ components/
│  ├─ CalculatorPanel.vue   # 表达式、步骤、错误定位
│  ├─ ConverterPanel.vue    # 单位与进制换算
│  ├─ HistoryPanel.vue      # 数据库历史与计算笔记
│  └─ StepList.vue          # 步骤展示
├─ App.vue                  # 工作区初始化、主题和布局
└─ styles.css               # 设计令牌与响应式样式
```

## 部署

```powershell
docker build -t tracecalc-frontend .
docker run --rm -p 8080:80 -e API_UPSTREAM=http://host.docker.internal:8000 tracecalc-frontend
```

镜像内 Nginx 提供静态文件，并把同域 `/api/` 反向代理到 `API_UPSTREAM`。生产环境应由 HTTPS 入口提供服务，后端 Cookie 启用 Secure。公开部署仍需真实服务器或托管账户，仓库不虚构部署地址。

## 使用限制

- 历史属于当前浏览器匿名工作区；清除 Cookie 或使用无痕窗口会进入新的工作区。
- 基础进制转换只处理整数，不解释补码，不处理小数。
- Decimal 为固定 34 位有效数字；无限小数和非完全平方根可能显示近似标记。

