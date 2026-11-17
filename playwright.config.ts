import { defineConfig } from "@playwright/test";

// Electron 앱 스모크 테스트. `npm run test:e2e`가 먼저 out/을 빌드해요.
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  reporter: "list",
  // 한 번에 하나씩: 성능 기록(perf.spec.ts)이 다른 창과 겹치지 않게 해요
  workers: 1,
});
