import { defineConfig } from "@playwright/test";

// 화면으로 한 판을 끝까지 도는 점검 (`pnpm test:run`). 개발 서버를 띄우고 브라우저로 돌아요.
const PORT = 5233;

export default defineConfig({
  testDir: "tests/run",
  timeout: 30 * 60_000,
  reporter: "list",
  // 한 번에 하나씩: 소프트웨어 렌더러로 여러 화면을 같이 그리면 코어가 적은 CI에서 프레임이 크게 느려져요
  workers: 1,
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1400, height: 950 },
    // GPU 없는 곳에서도 WebGL이 돌게 소프트웨어 렌더러를 써요
    // 깔린 크로미움을 쓰려면 PW_CHROMIUM에 실행 파일 경로를 줘요
    launchOptions: { args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--enable-precise-memory-info"], executablePath: process.env.PW_CHROMIUM || undefined },
  },
  webServer: { command: `pnpm dev:web --port ${PORT} --strictPort`, url: `http://localhost:${PORT}`, reuseExistingServer: true, timeout: 60_000 },
});
