import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Ensure defaults are visible to import.meta.env in client
  const feat = (key, fallback) => {
    const v = env[key] ?? process.env[key];
    if (v === undefined || v === '') return fallback;
    return v;
  };

  return {
    base: '/',
    publicDir: 'public',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: true
    },
    server: {
      host: true,
      port: 5174,
      strictPort: false
    },
    preview: {
      host: true,
      port: 4174
    },
    appType: 'spa',
    define: {
      'import.meta.env.VITE_FEAT_HYPO': JSON.stringify(feat('VITE_FEAT_HYPO', '1')),
      'import.meta.env.VITE_FEAT_TYPO': JSON.stringify(feat('VITE_FEAT_TYPO', '1')),
      'import.meta.env.VITE_FEAT_PROVIDERS': JSON.stringify(feat('VITE_FEAT_PROVIDERS', '1')),
      'import.meta.env.VITE_FEAT_PDF': JSON.stringify(feat('VITE_FEAT_PDF', '0')),
      'import.meta.env.VITE_FEAT_JAAS': JSON.stringify(feat('VITE_FEAT_JAAS', '0')),
      'import.meta.env.VITE_FEAT_PROFILES': JSON.stringify(feat('VITE_FEAT_PROFILES', '0')),
      /* Optional single-flavor deploy; leave empty to resolve via hostname / ?flavor= */
      'import.meta.env.VITE_FLAVOR': JSON.stringify(feat('VITE_FLAVOR', ''))
    },
    plugins: [
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.svg',
          'favicon-dark.svg',
          'pwa/apple-touch-icon.png',
          'pwa/icon-192.png',
          'pwa/icon-512.png',
          'pwa/icon-192-maskable.png',
          'pwa/icon-512-maskable.png',
          'robots.txt',
          'llms.txt'
        ],
        manifest: {
          id: '/',
          name: 'L∙I∙B∙R∙U∙S',
          short_name: 'LIBRUS',
          description: 'Loosely Integrated Book Reading Universal System — POC',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'any',
          background_color: '#ffffff',
          theme_color: '#000000',
          lang: 'pt-BR',
          icons: [
            {
              src: 'pwa/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'pwa/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'pwa/icon-192-maskable.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: 'pwa/icon-512-maskable.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,ico,png,woff2,webmanifest}'],
          globIgnores: ['**/books/**'],
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
          navigateFallback: 'index.html',
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/hypothes\.is\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'hypothesis',
                expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 }
              }
            },
            {
              urlPattern: /^https:\/\/unpkg\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'cdn-unpkg',
                expiration: { maxEntries: 16, maxAgeSeconds: 60 * 60 * 24 * 30 }
              }
            }
          ]
        },
        devOptions: {
          enabled: true,
          type: 'module'
        }
      })
    ]
  };
});
