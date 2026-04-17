// astro.config.mjs
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';
import AstroPWA from '@vite-pwa/astro';

/** PWA + Workbox in dev adds many watchers; enable only when testing SW: `PWA_DEV=true npm run dev` */
const pwaInDev = process.env.PWA_DEV === 'true';
const repository = process.env.GITHUB_REPOSITORY ?? '';
const [repositoryOwner = '', repositoryName = ''] = repository.split('/');
const isUserOrOrgPagesRepo =
  repositoryOwner &&
  repositoryName &&
  `${repositoryOwner}.github.io`.toLowerCase() === repositoryName.toLowerCase();
const githubPagesBase =
  process.env.GITHUB_ACTIONS === 'true' && repositoryName && !isUserOrOrgPagesRepo
    ? `/${repositoryName}`
    : '/';
const githubPagesSite = repositoryOwner ? `https://${repositoryOwner}.github.io` : undefined;
const envSiteUrl = process.env.SITE_URL?.trim();
const envBasePath = process.env.BASE_PATH?.trim();

export default defineConfig({
  site: envSiteUrl || githubPagesSite,
  base: envBasePath || githubPagesBase,
  integrations: [
    svelte(),
    AstroPWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Mangaga 漫画拼贴',
        short_name: 'Mangaga',
        description: '多图网格拼贴为一张大图，漫画拼接与导出',
        theme_color: '#e11d48',
        background_color: '#fafaf9',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        navigateFallback: '/',
        globPatterns: ['**/*.{css,js,html,svg,png,ico,txt}'],
      },
      devOptions: {
        enabled: pwaInDev,
        navigateFallbackAllowlist: [/^\/$/],
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    server: {
      watch: {
        usePolling: process.env.VITE_USE_POLLING === 'true',
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/dist/**',
          '**/dev-dist/**',
          '**/.astro/**',
          '**/coverage/**',
          '**/.turbo/**',
        ],
      },
    },
  },
});
