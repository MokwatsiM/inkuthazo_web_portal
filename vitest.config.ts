import { defineConfig } from 'vitest/config';

// Unit/component tests. Firestore rules tests live in tests/rules and run
// against the emulator via `npm run test:rules` (vitest.rules.config.ts).
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
