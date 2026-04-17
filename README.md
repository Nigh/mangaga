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

### GitHub Pages 部署与变量

仓库已内置 `/.github/workflows/deploy-pages.yml`，推送到 `main` 后会自动部署到 GitHub Pages。

在 GitHub 仓库 `Settings -> Secrets and variables -> Actions -> Variables` 中设置：

- `SITE_URL`: 站点完整地址（例如 `https://nigh.github.io` 或你的自定义域名）
- `BASE_PATH`: 站点子路径（根路径用 `/`；项目页一般是 `/mangaga`）

常见值：

- 用户/组织主页仓库（`<user>.github.io`）：`BASE_PATH=/`
- 项目仓库（`<user>/<repo>`）：`BASE_PATH=/<repo>`

> 未设置时会使用自动推断；建议显式设置，避免迁移域名或仓库名时路径异常。

### 服务器部署（Caddy 静态托管）

1. 在服务器上构建（可按部署路径设置变量）：

```bash
npm ci
SITE_URL=https://mangaga.example.com BASE_PATH=/ npm run build
```

2. 配置 Caddy（`/etc/caddy/Caddyfile`）：

```caddyfile
mangaga.example.com {
  encode zstd gzip
  root * /var/www/mangaga/dist
  try_files {path} /index.html
  file_server
}
```

3. 重载 Caddy：

```bash
sudo caddy reload --config /etc/caddy/Caddyfile
```

如果挂在子路径（例如 `https://example.com/mangaga/`）：

- 构建时设为 `BASE_PATH=/mangaga`
- Caddy 中使用 `handle_path /mangaga*` 指向同一份 `dist`

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

### GitHub Pages deployment and variables

The repo includes `/.github/workflows/deploy-pages.yml` to auto-deploy on every push to `main`.

In `Settings -> Secrets and variables -> Actions -> Variables`, set:

- `SITE_URL`: full site URL (for example `https://nigh.github.io` or your custom domain)
- `BASE_PATH`: path prefix (`/` for root, or `/mangaga` for project pages)

Typical values:

- User/Org pages repo (`<user>.github.io`): `BASE_PATH=/`
- Project repo (`<user>/<repo>`): `BASE_PATH=/<repo>`

If not set, the build falls back to auto-detection; explicit values are safer when repo/domain changes.

### Server deployment (static hosting with Caddy)

This is a static PWA app, so you do not need a long-running `npm run preview` process in production.

```bash
npm ci
SITE_URL=https://mangaga.example.com BASE_PATH=/ npm run build
```

`/etc/caddy/Caddyfile`:

```caddyfile
mangaga.example.com {
  encode zstd gzip
  root * /var/www/mangaga/dist
  try_files {path} /index.html
  file_server
}
```

```bash
sudo caddy reload --config /etc/caddy/Caddyfile
```

If serving from a subpath like `https://example.com/mangaga/`:

- Build with `BASE_PATH=/mangaga`
- Use `handle_path /mangaga*` in Caddy to map requests to the same `dist` directory

Stack: Astro, Svelte, Tailwind, DaisyUI, Vite PWA.
