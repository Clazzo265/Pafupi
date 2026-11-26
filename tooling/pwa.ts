import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';
/** Build-only app-shell cache. Private requests are deliberately never intercepted/cached. */
export function offlineShell(): Plugin {
  let root = process.cwd();
  return {
    name: 'pafupi-offline-shell',
    apply: 'build',
    configResolved(config) {
      root = config.root;
    },
    generateBundle(_options, bundle) {
      const assets = Object.keys(bundle).filter((name) => name.startsWith('assets/'));
      const hash = createHash('sha256');
      for (const output of Object.values(bundle))
        hash.update(output.type === 'chunk' ? output.code : output.source);
      for (const file of [
        'favicon.svg',
        'manifest.webmanifest',
        'icons/icon-192.png',
        'icons/icon-512.png',
      ])
        hash.update(readFileSync(resolve(root, 'public', file)));
      const revision = hash.digest('hex').slice(0, 16);
      const files = [
        '/',
        '/index.html',
        '/favicon.svg',
        '/manifest.webmanifest',
        '/icons/icon-192.png',
        '/icons/icon-512.png',
        ...assets.map((a) => `/${a}`),
      ];
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: `
const CACHE = 'pafupi-shell-${revision}';
const FILES = ${JSON.stringify(files)};
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES))));
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const name of await caches.keys()) if (name.startsWith('pafupi-shell-') && name !== CACHE) await caches.delete(name);
  await self.clients.claim();
})()));
self.addEventListener('message', event => { if (event.data?.type === 'ACTIVATE_UPDATE') self.skipWaiting(); });
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/') || url.pathname === '/api') return;
  if (request.mode === 'navigate' && (url.pathname === '/' || url.pathname === '/index.html')) {
    event.respondWith(fetch(request).catch(() => caches.open(CACHE).then(cache => cache.match('/index.html'))));
  } else if (FILES.includes(url.pathname)) {
    event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(url.pathname)) || fetch(request)));
  }
});
`,
      });
    },
  };
}
