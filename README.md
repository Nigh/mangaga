# Mangaga

[English](#english) · [中文](#中文)

---

## 中文

**Mangaga** 是一款在浏览器里使用的漫画 / 插图拼版小工具：把多张图片放进可调整的网格，预览与导出使用同一套几何关系，图片按 **contain** 完整显示、不裁切。支持安装为 **PWA**，离线也可使用（取决于浏览器与缓存策略）。

**源码：** [github.com/Nigh/mangaga](https://github.com/Nigh/mangaga)

### 使用方式

1. 打开站点后点击 **添加图片**，可多选。
2. 在画布上 **拖动** 图片格子；选中后出现 **删除** 与 **箭头**（调整单格跨行/跨列）。
3. 在下方调节 **列数**、**外边距**、**格间距**、**内边距**、**描边** 等；百分比会换算为像素（与最长边相关）。
4. 选择 **导出缩放** 后点击 **导出 PNG** 下载成品。

### 本地开发（面向贡献者）

需要 Node.js 18+。

```bash
npm install
npm run dev
```

```bash
npm run build   # 构建到 ./dist
npm run preview # 本地预览构建结果
```

技术栈：Astro、Svelte、Tailwind、DaisyUI、Vite PWA。

---

## English

**Mangaga** is a small in-browser tool for laying out comic or illustration panels: place multiple images on an adjustable grid; preview and export share the same geometry, with images shown in **contain** mode (full image, no cropping). It can be installed as a **PWA**.

**Repository:** [github.com/Nigh/mangaga](https://github.com/Nigh/mangaga)

### How to use

1. Open the site and click **Add images** (multi-select supported).
2. **Drag** panels on the canvas; when selected, use **delete** and **arrow** controls to resize spans.
3. Adjust **columns**, **margins**, **gaps**, **padding**, **borders**, etc.
4. Pick an **export scale**, then **Export PNG** to download.

### Local development

Requires Node.js 18+.

```bash
npm install
npm run dev
```

```bash
npm run build
npm run preview
```

Stack: Astro, Svelte, Tailwind, DaisyUI, Vite PWA.
