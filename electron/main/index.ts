// Electron main 프로세스: 창, 앱 프로토콜, 저장 IPC만 맡아요. 게임 규칙은 모르고 렌더러에 있어요.
import { app, BrowserWindow, ipcMain, net, protocol, shell } from "electron";
import { join, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { IPC } from "../../src/platform/bridge";
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

function registerIpc() {
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
}

function createWindow() {
  const win = new BrowserWindow({
    // 게임 기준 해상도(1280×800)와 같은 크기
    width: 1280,
    height: 800,
    useContentSize: true,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(import.meta.dirname, "../preload/index.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
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
