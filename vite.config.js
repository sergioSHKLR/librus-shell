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
      /* Pin default manifest/apple icon when VITE_FLAVOR is set (local multi-port). */
      {
        name: 'flavor-html-defaults',
        transformIndexHtml(html) {
          const f = feat('VITE_FLAVOR', 'librus') || 'librus';
          const id = ['librus', 'doutrina', 'centro'].includes(f) ? f : 'librus';
          return html
            .replaceAll('/manifest-librus.webmanifest', `/manifest-${id}.webmanifest`)
            .replaceAll('/pwa/librus-apple-touch-icon.png', `/pwa/${id}-apple-touch-icon.png`);
        }
      },
      VitePWA({
        registerType: 'autoUpdate',
        /* Flavor manifests live in public/; avoid a second generic inject. */
        manifest: false,
        includeAssets: [
          'favicon.svg',
          'favicon-dark.svg',
          'manifest-librus.webmanifest',
          'manifest-doutrina.webmanifest',
          'manifest-centro.webmanifest',
          'pwa/*.png',
          'robots.txt',
          'llms.txt'
        ],
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
