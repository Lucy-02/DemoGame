import { defineConfig } from "@playwright/test";

// 화면으로 한 판을 끝까지 도는 점검 (`pnpm test:run`). 개발 서버를 띄우고 브라우저로 돌아요.
const PORT = 5233;

export default defineConfig({
  testDir: "tests/run",
  timeout: 15 * 60_000,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1400, height: 950 },
    // GPU 없는 곳에서도 WebGL이 돌게 소프트웨어 렌더러를 써요
    // 깔린 크로미움을 쓰려면 PW_CHROMIUM에 실행 파일 경로를 줘요
    launchOptions: { args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"], executablePath: process.env.PW_CHROMIUM || undefined },
  },
  webServer: { command: `pnpm dev:web --port ${PORT} --strictPort`, url: `http://localhost:${PORT}`, reuseExistingServer: true, timeout: 60_000 },
});
