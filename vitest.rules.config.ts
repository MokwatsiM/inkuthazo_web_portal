import { defineConfig } from 'vitest/config';

// Firestore security rules tests. Requires the Firestore emulator, which
// `npm run test:rules` starts via `firebase emulators:exec`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/rules/**/*.test.ts'],
    testTimeout: 20000,
    hookTimeout: 30000,
    // Rules tests share one emulator instance; run files sequentially
    fileParallelism: false,
  },
});
