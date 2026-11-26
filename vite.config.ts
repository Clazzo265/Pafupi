import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { offlineShell } from './tooling/pwa';
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [
    react(),
    tailwindcss(),
    ...(process.env.VITE_GITHUB_PAGES === 'true'
      ? [
          {
            name: 'pages-read-only',
            transformIndexHtml(html: string) {
              return html
                .replace(/\s*<link rel="manifest"[^>]*>/, '')
                .replace(
                  '<title>PAFUPI — A little help, close to home.</title>',
                  '<title>PAFUPI — Read-only concept demo</title>',
                );
            },
          },
        ]
      : [offlineShell()]),
  ],
  preview: {
    host: '0.0.0.0',
    allowedHosts: ['.e2b.app', 'localhost'],
    proxy: { '/api': process.env.API_TARGET || 'http://127.0.0.1:3001' },
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: ['.e2b.app', 'localhost'],
    proxy: { '/api': process.env.API_TARGET || 'http://127.0.0.1:3001' },
  },
});
