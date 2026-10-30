import { resolve } from "node:path";
import { defineConfig } from "electron-vite";

// main·preload는 electron/, 렌더러는 저장소 루트의 index.html + src/ 를 그대로 써요.
// 브라우저만으로 돌릴 때는 vite.config.ts(`npm run dev:web`)를 써요.
export default defineConfig({
  main: {
    build: {
      lib: { entry: resolve("electron/main/index.ts") },
    },
  },
  preload: {
    build: {
      // 샌드박스 preload는 CommonJS여야 해요.
      lib: { entry: resolve("electron/preload/index.ts"), formats: ["cjs"] },
      rolldownOptions: { output: { entryFileNames: "[name].cjs" } },
    },
  },
  renderer: {
    root: ".",
    build: {
      chunkSizeWarningLimit: 4000,
      rolldownOptions: { input: resolve("index.html") },
    },
  },
});
