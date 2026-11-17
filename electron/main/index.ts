// Electron main 프로세스: 창, 앱 프로토콜, 저장 IPC만 맡아요. 게임 규칙은 모르고 렌더러에 있어요.
import { app, BrowserWindow, ipcMain, net, protocol, shell } from "electron";
import { join, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { IPC } from "../../src/platform/bridge";
import { createErrorLog } from "./errorLog";
import { createFileStorage } from "./storage";

const SCHEME = "app";
const rendererDir = resolve(import.meta.dirname, "../renderer");
const devServerUrl = process.env.ELECTRON_RENDERER_URL;

/**
 * 저장 폴더 이름. 앱 이름(productName)이 바뀌어도 저장이 따라 옮겨 가지 않게 고정해요.
 * 데모와 본편이 같은 곳을 쓰고(0101), 스팀 클라우드 경로도 이 이름으로 잡아요. 한 번 밖에 내면 바꾸지 않아요.
 */
const USER_DATA_DIR = "demogame";
// e2e 테스트가 실제 사용자 폴더를 건드리지 않게 저장 위치를 바꿀 수 있어요.
app.setPath("userData", process.env.DEMOGAME_USER_DATA ?? join(app.getPath("appData"), USER_DATA_DIR));

// 두 번 실행 막기: 같은 저장 파일을 두 창이 번갈아 덮어쓰지 않게 해요. 이미 떠 있으면 그 창을 앞으로 가져와요.
// e2e는 저장 폴더가 저마다 달라서 서로 막지 않아요 (잠금은 userData에 걸려요).
const single = app.requestSingleInstanceLock();
if (!single) app.quit();
app.on("second-instance", () => {
  const win = BrowserWindow.getAllWindows()[0];
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.focus();
});

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
  // 화면 프로세스가 죽으면 까닭을 남겨요
  app.on("render-process-gone", (_e, _contents, details) => void log.append(`v${app.getVersion()} render-process-gone ${details.reason} ${details.exitCode}`));
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
  ipcMain.handle(IPC.readBackup, (_e, key: string) => storage.readBackup(key));
  ipcMain.handle(IPC.setAside, (_e, key: string) => storage.setAside(key));
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
  // 창 모드에서는 화면 비율대로만 늘어나서 남는 곳이 없어요
  win.setAspectRatio(BASE.w / BASE.h);
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
  if (!single) return;
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
