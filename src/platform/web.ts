import { assertStorageKey } from "./bridge";
import type { Platform } from "./types";

type KeyValueStore = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const PREFIX = "demogame:";

/** 브라우저(`npm run dev:web`)와 테스트용 구현. 저장소는 주입받아서 테스트에서 메모리로 바꿔 끼워요. */
export function createWebPlatform(store: KeyValueStore, doc?: Document): Platform {
  return {
    kind: "web",
    async read(key) {
      assertStorageKey(key);
      return store.getItem(PREFIX + key);
    },
    async write(key, text) {
      assertStorageKey(key);
      store.setItem(PREFIX + key, text);
    },
    async remove(key) {
      assertStorageKey(key);
      store.removeItem(PREFIX + key);
    },
    async setFullscreen(on) {
      if (!doc) return;
      if (on && !doc.fullscreenElement) await doc.documentElement.requestFullscreen();
      if (!on && doc.fullscreenElement) await doc.exitFullscreen();
    },
    async isFullscreen() {
      return Boolean(doc?.fullscreenElement);
    },
    async quit() {},
  };
}
