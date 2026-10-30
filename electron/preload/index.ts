// 샌드박스 preload: 렌더러에 platformBridge 하나만 노출해요. ipcRenderer 자체는 넘기지 않아요.
import { contextBridge, ipcRenderer } from "electron";
import { IPC, type PlatformBridge } from "../../src/platform/bridge";

const bridge: PlatformBridge = {
  read: (key) => ipcRenderer.invoke(IPC.read, key),
  write: (key, text) => ipcRenderer.invoke(IPC.write, key, text),
  remove: (key) => ipcRenderer.invoke(IPC.remove, key),
  setFullscreen: (on) => ipcRenderer.invoke(IPC.setFullscreen, on),
  isFullscreen: () => ipcRenderer.invoke(IPC.isFullscreen),
  quit: () => ipcRenderer.invoke(IPC.quit),
};

contextBridge.exposeInMainWorld("platformBridge", bridge);
