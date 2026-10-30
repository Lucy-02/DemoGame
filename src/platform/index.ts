import type { PlatformBridge } from "./bridge";
import { createElectronPlatform } from "./electron";
import type { Platform } from "./types";
import { createWebPlatform } from "./web";

export type { Platform } from "./types";

let current: Platform | null = null;

/** Electron 안이면 preload 브리지를, 아니면 localStorage를 써요. 앱에서 한 번만 만들어요. */
export function getPlatform(): Platform {
  if (current) return current;
  const bridge = (window as { platformBridge?: PlatformBridge }).platformBridge;
  current = bridge ? createElectronPlatform(bridge) : createWebPlatform(window.localStorage, document);
  return current;
}
