# AGENTS.md — Mangaga

## 🧬 项目 DNA

**mangaga** 是一个纯客户端漫画拼贴工具，将多张图片以自定义网格拼成一张大图并导出 PNG。

| 层 | 技术 |
|---|---|
| 框架 | Astro 6（SSG, 单页） |
| UI | Svelte 5（`$:` 响应式, Canvas 2D 渲染） |
| 样式 | Tailwind CSS 4 + DaisyUI 5 |
| 类型 | TypeScript 5（严格模式） |
| PWA | @vite-pwa/astro + Workbox |

### 关键模块速查

- **`ComicStitcher.svelte`** — 全部核心交互逻辑（拖放/选中/导出/重排）。修改 UI 逻辑的第一入口。
- **`src/lib/mangaLayout.ts`** — 网格布局引擎（不均宽列/不均高行）。修改几何计算的核心。
- **`src/lib/mangaDraw.ts`** — Canvas 绘制工具。修改渲染表现的核心。
- **`src/lib/mangagaI18n.ts`** — 国际化字典。新增语言或文案的唯一位置。

---

## 📏 行为准则

### 编码规范
- **纯逻辑放入 `src/lib/`**：禁止在组件中引入 DOM/BOM 依赖的纯计算函数。所有 grid/geometry/i18n 逻辑必须在 lib 目录下纯函数实现。
- **类型优先**：任何新数据模型必须在 `mangagaTypes.ts` 中定义 TypeScript 类型，并导出共享。
- **响应式原则**：Svelte 组件中使用 `$:` 声明派生状态，不使用 `onMount` 手动订阅（指针事件等浏览器 API 除外）。
- **注释**：中文注释解释"为什么"而非"是什么"。英文命名。
- **百分比体系**：所有样式参数（padding/gap/border）必须是基于 `globalMaxEdge` 的百分比值，范围 0–30%，不可引入绝对像素值。
- **触摸兼容**：任何新增交互必须同时支持 mouse 和 touch，通过 `pointerType === "touch"` 分支处理。

### 提交说明
- 使用 conventional commit 格式：`feat:` / `fix:` / `refactor:` / `chore:`
- 避免混合不相关的变更

### 命令速查
```bash
npm run dev                # 开发
PWA_DEV=true npm run dev   # 含 PWA 测试
npm run build              # 构建
npm run preview            # 预览构建结果
```

---

## 🔄 关键自我同步规则（Critical Self-Sync Rule）

> **任何对项目架构、核心逻辑、依赖库或开发流程做出实质性修改或优化后，必须同步评估并更新本 AGENTS.md 中的相关条款，以确保该文档始终反映项目的最新真实状态。**

具体触发条件包括但不限于：

- ✅ 新增或移除核心依赖（如引入状态管理库、测试框架）
- ✅ 修改网格布局算法或渲染管线
- ✅ 添加新模块或重构已有模块的文件结构
- ✅ 引入 CI/CD 流程变更（如 Docker 部署、静态分析）
- ✅ 改变编码规范（如引入 ESLint/Prettier、修改类型策略）

执行方式：在修改 PR 或 commit 中，**必须包含 AGENTS.md 的对应更新**，或另开一条独立 commit 同步更新。
