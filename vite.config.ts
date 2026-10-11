import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read version from package.json
const packageJson = JSON.parse(
  readFileSync(resolve(__dirname, 'package.json'), 'utf-8')
);

// Brand colours sampled from public/logo_hd.png
const BRAND_NAVY = '#224A6C';
const BRAND_CREAM = '#F8F5EE';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // PWA — see docs/specs/pwa (R1, R2, R4; design D1, D2, D3, D8).
    // injectManifest: we ship our own service worker (src/sw.ts) so the same
    // worker can later handle Firebase Cloud Messaging (Phase 3).
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      // Never reload on its own: UpdatePrompt asks the member to refresh.
      registerType: 'prompt',
      // Registration happens in React via virtual:pwa-register/react.
      injectRegister: false,
      manifest: {
        name: 'Inkuthazo Social Club',
        short_name: 'Inkuthazo',
        description:
          'Inkuthazo Social Club member portal — contributions, statements, credit and more.',
        id: '/',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: BRAND_NAVY,
        background_color: BRAND_CREAM,
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      injectManifest: {
        // Precache the app shell and small static assets. Splash screens (only
        // fetched by iOS at install), the hi-res source logo and photos are
        // left out to keep the install small.
        // Manifest icons are added by the plugin, so they're not globbed here.
        globPatterns: ['**/*.{js,css,html,ico,woff2}', 'logo.png', 'favicon-*.png'],
        // Heavy admin/report-only chunks stay out of the install download
        // (members are often on prepaid data); src/sw.ts caches them on first use.
        globIgnores: [
          '**/logo_hd.png',
          '**/splash-*.png',
          'assets/xlsx-*.js',
          'assets/nivo-*.js',
          'assets/jspdf*.js',
          'assets/html2canvas*.js',
          'assets/index.es-*.js',
          'assets/purify*.js',
          'assets/Attendance-*.js',
          'assets/AdvancedAnalytics-*.js',
          'assets/Calendar-*.js',
        ],
      },
      // Keep the SW off in `npm run dev` (it would interfere with HMR and the
      // emulators). Test with `npm run build && npm run preview`.
      devOptions: { enabled: false },
    }),
  ],

  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(packageJson.version),
  },

  // Several deps (firebase/*, lucide-react) reference .js.map files they do
  // not actually ship, which makes the dev server log a flood of harmless
  // "Could not read source map" warnings. Silence just those.
  build: {
    // Firebase and the heavy lazy-loaded libs (xlsx, nivo, jspdf) are single
    // vendors that can't be split further; raise the warning threshold so the
    // build log flags genuinely oversized app chunks, not these.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Split large, rarely-changing vendors out of the main entry chunk.
        // Firebase (imported in 100+ files) and React dominate the eager
        // bundle; isolating them lets the browser cache vendor code across
        // deploys (only app code re-downloads on an update) and download the
        // pieces in parallel. Route-level heavy libs (xlsx, jspdf, nivo,
        // html2canvas) are already code-split via lazy() and stay that way.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('/firebase/') || id.includes('/@firebase/')) {
            return 'firebase';
          }
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/react-router') ||
            id.includes('/scheduler/')
          ) {
            return 'react-vendor';
          }
          return undefined;
        },
      },
      onLog(level, log, handler) {
        if (
          log.message?.includes('Could not read source map') ||
          log.message?.includes('.js.map')
        ) {
          return;
        }
        handler(level, log);
      },
    },
  },
});
