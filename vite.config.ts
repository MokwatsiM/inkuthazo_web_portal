import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Read version from package.json
// const packageJson = JSON.parse(
//   readFileSync(resolve(__dirname, 'package.json'), 'utf-8')
// );

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // define: {
  //   'import.meta.env.VITE_APP_VERSION': JSON.stringify(packageJson.version),
  // },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
