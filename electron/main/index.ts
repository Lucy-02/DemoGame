// Electron main 프로세스: 창, 앱 프로토콜, 저장 IPC만 맡아요. 게임 규칙은 모르고 렌더러에 있어요.
import { app, BrowserWindow, ipcMain, net, protocol, shell } from "electron";
import { join, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { IPC } from "../../src/platform/bridge";
import { fitResize } from "./aspect";
import { createErrorLog } from "./errorLog";
import { createFileStorage } from "./storage";

const SCHEME = "app";
const rendererDir = resolve(import.meta.dirname, "../renderer");
const devServerUrl = process.env.ELECTRON_RENDERER_URL;

// e2e 테스트가 실제 사용자 폴더를 건드리지 않게 저장 위치를 바꿀 수 있어요.
if (process.env.DEMOGAME_USER_DATA) app.setPath("userData", process.env.DEMOGAME_USER_DATA);

// file:// 대신 app:// 로 빌드 결과를 서빙해요. fetch·XHR(Phaser 로더)이 웹과 똑같이 동작해요.
protocol.registerSchemesAsPrivileged([
  { scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

/** 게임 기준 해상도와 바닥색 (렌더러의 FRAME · tokens.provisional.palette.floor와 같은 값) */
const BASE = { w: 1280, h: 800 };
const FLOOR = "#232120";

function serveRenderer() {
  protocol.handle(SCHEME, (req) => {
    const { pathname } = new URL(req.url);
    const target = resolve(rendererDir, `.${decodeURIComponent(pathname)}`);
    if (target !== rendererDir && !target.startsWith(rendererDir + sep)) {
      return new Response("forbidden", { status: 403 });
    }
    return net.fetch(pathToFileURL(target === rendererDir ? join(rendererDir, "index.html") : target).toString());
  });
}

/** 오류 기록: userData/logs/error.log. 렌더러의 잡히지 않은 오류와 main의 오류를 같이 적어요 */
function openErrorLog() {
  const log = createErrorLog(join(app.getPath("userData"), "logs", "error.log"));
  // 기록만 하고 기본 동작(종료)은 그대로 둬요
  process.on("uncaughtExceptionMonitor", (e) => void log.append(`v${app.getVersion()} main ${e.stack ?? e.message}`));
  return log;
}

function registerIpc() {
  const errors = openErrorLog();
  const storage = createFileStorage(join(app.getPath("userData"), "saves"));
  ipcMain.handle(IPC.read, (_e, key: string) => storage.read(key));
  ipcMain.handle(IPC.write, (_e, key: string, text: string) => {
    if (typeof text !== "string") throw new Error("write expects a string");
    return storage.write(key, text);
  });
  ipcMain.handle(IPC.remove, (_e, key: string) => storage.remove(key));
  ipcMain.handle(IPC.setFullscreen, (e, on: boolean) => {
    BrowserWindow.fromWebContents(e.sender)?.setFullScreen(Boolean(on));
  });
  ipcMain.handle(IPC.isFullscreen, (e) => BrowserWindow.fromWebContents(e.sender)?.isFullScreen() ?? false);
  ipcMain.handle(IPC.quit, () => app.quit());
  ipcMain.handle(IPC.logError, (_e, text: string) => errors.append(String(text)));
}

function createWindow() {
  const win = new BrowserWindow({
    // 게임 기준 해상도(1280×800)와 같은 크기로 열어요. 크기를 바꾸면 화면이 비율을 지키며 따라 늘어요 (0084 4번)
    width: BASE.w,
    height: BASE.h,
    minWidth: BASE.w / 2,
    minHeight: BASE.h / 2,
    useContentSize: true,
    // 남는 곳(비율이 다른 전체화면)은 게임 바닥색 (index.html과 같은 값)
    backgroundColor: FLOOR,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(import.meta.dirname, "../preload/index.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  // 창 모드에서는 화면 비율대로만 늘어나서 남는 곳이 없어요.
  // 윈도의 setAspectRatio는 창틀까지 포함한 바깥 크기에 비율을 걸어서(안쪽이 넓어져요), 끌 때마다 안쪽 기준으로 다시 계산해요
  if (process.platform === "win32") {
    win.on("will-resize", (e, next, details) => {
      const [outerW, outerH] = win.getSize();
      const [innerW, innerH] = win.getContentSize();
      const frame = { width: outerW - innerW, height: outerH - innerH };
      e.preventDefault();
      win.setBounds(fitResize(win.getBounds(), next, details.edge, frame, BASE.w / BASE.h, { width: BASE.w / 2, height: BASE.h / 2 }));
    });
  } else win.setAspectRatio(BASE.w / BASE.h);
  win.once("ready-to-show", () => win.show());

  // 게임 창 밖으로 나가는 탐색은 막고, 외부 링크는 기본 브라우저로 열어요.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) void shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => {
    if (!url.startsWith(devServerUrl ?? `${SCHEME}://`)) e.preventDefault();
  });

  void win.loadURL(devServerUrl ?? `${SCHEME}://game/index.html`);
}

app.whenReady().then(() => {
  serveRenderer();
  registerIpc();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
