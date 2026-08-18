import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read version from package.json
const packageJson = JSON.parse(
  readFileSync(resolve(__dirname, 'package.json'), 'utf-8')
);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

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
