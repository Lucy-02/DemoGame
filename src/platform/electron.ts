import { assertStorageKey, type PlatformBridge } from "./bridge";
import type { Platform } from "./types";

/** preload가 노출한 브리지를 감싸요. 키 검사는 main에서도 한 번 더 해요. */
export function createElectronPlatform(bridge: PlatformBridge): Platform {
  return {
    kind: "electron",
    read: (key) => (assertStorageKey(key), bridge.read(key)),
    write: (key, text) => (assertStorageKey(key), bridge.write(key, text)),
    remove: (key) => (assertStorageKey(key), bridge.remove(key)),
    setFullscreen: (on) => bridge.setFullscreen(on),
    isFullscreen: () => bridge.isFullscreen(),
    quit: () => bridge.quit(),
  };
}
