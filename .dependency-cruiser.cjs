// 레이어 의존 방향 규칙. 위반하면 `npm run lint:deps`(CI 포함)가 실패해요.
// 그림: docs/architecture/0001-client-architecture.md
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "core-is-pure",
      comment: "core·data는 순수 TS예요. 화면·플랫폼·Electron·Phaser를 모르고, 바깥 층도 import하지 않아요.",
      severity: "error",
      from: { path: "^src/(core|data)/" },
      to: { path: "^src/(app|presentation|session|platform|menu|design)/|^electron/|node_modules/(phaser|@esotericsoftware|electron)/" },
    },
    {
      name: "session-has-no-view",
      comment: "session은 화면을 몰라요. Phaser·DOM 메뉴·app을 import하지 않아요.",
      severity: "error",
      from: { path: "^src/session/" },
      to: { path: "^src/(app|presentation|menu)/|^electron/|node_modules/(phaser|@esotericsoftware|electron)/" },
    },
    {
      name: "renderer-has-no-electron",
      comment: "렌더러는 Electron을 직접 쓰지 않아요. platform 인터페이스만 써요.",
      severity: "error",
      from: { path: "^src/" },
      to: { path: "^electron/|node_modules/electron/" },
    },
    {
      name: "platform-is-leaf",
      comment: "platform은 게임을 몰라요.",
      severity: "error",
      from: { path: "^src/platform/" },
      to: { path: "^src/(app|presentation|session|menu|core|data)/" },
    },
    {
      name: "views-do-not-reach-up",
      comment: "presentation은 app(조립)을 import하지 않아요.",
      severity: "error",
      from: { path: "^src/presentation/" },
      to: { path: "^src/app/" },
    },
    {
      name: "electron-main-shares-only-bridge",
      comment: "main·preload는 렌더러 코드 중 IPC 약속(src/platform/bridge.ts)만 가져와요.",
      severity: "error",
      from: { path: "^electron/" },
      to: { path: "^src/", pathNot: "^src/platform/bridge\\.ts$" },
    },
    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    parser: "swc",
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: { exportsFields: ["exports"], conditionNames: ["import", "require", "node", "default"] },
  },
};
