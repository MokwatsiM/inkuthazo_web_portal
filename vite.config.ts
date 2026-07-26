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
    rollupOptions: {
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
