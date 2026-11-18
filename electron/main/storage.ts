// 저장 파일 읽기·쓰기. Electron에 의존하지 않아서 Node 테스트로 바로 확인해요.
import { copyFile, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { assertStorageKey } from "../../src/platform/bridge";

export interface FileStorage {
  read(key: string): Promise<string | null>;
  write(key: string, text: string): Promise<void>;
  remove(key: string): Promise<void>;
  /** 덮어쓰기 직전에 남긴 `<key>.bak.json`. 없으면 null */
  readBackup(key: string): Promise<string | null>;
  /** 못 읽는 `<key>.json`을 `<key>.broken.json`으로 치워요 (하나만 남겨요) */
  setAside(key: string): Promise<void>;
}

/** 윈도에서는 다른 프로그램(백신 · 색인 · 동기화)이 파일을 읽는 동안 이름 바꾸기가 거절돼요. 잠깐 쉬었다 다시 해요 */
const BUSY = new Set(["EPERM", "EBUSY", "EACCES"]);
export const RENAME_RETRY = { tries: 10, stepMs: 20 };

export async function renameSteady(from: string, to: string, doRename: (a: string, b: string) => Promise<void> = rename): Promise<void> {
  for (let n = 1; ; n++) {
    try {
      return await doRename(from, to);
    } catch (e) {
      if (n >= RENAME_RETRY.tries || !BUSY.has((e as NodeJS.ErrnoException).code ?? "")) throw e;
      await new Promise((r) => setTimeout(r, RENAME_RETRY.stepMs * n));
    }
  }
}

const isMissing = (e: unknown) => (e as NodeJS.ErrnoException).code === "ENOENT";

/**
 * `dir/<key>.json`에 저장해요.
 * 쓰기는 임시 파일에 쓴 뒤 이름을 바꿔서, 쓰다가 꺼져도 이전 파일이 깨지지 않아요.
 * 덮어쓰기 직전 파일은 `<key>.bak.json`으로 하나 남겨요.
 */
export function createFileStorage(dir: string): FileStorage {
  const file = (key: string) => {
    assertStorageKey(key);
    return join(dir, `${key}.json`);
  };
  const readOrNull = async (path: string) => {
    try {
      return await readFile(path, "utf8");
    } catch (e) {
      if (isMissing(e)) return null;
      throw e;
    }
  };
  const side = (key: string, kind: "bak" | "broken") => (file(key), join(dir, `${key}.${kind}.json`));
  return {
    read: (key) => readOrNull(file(key)),
    readBackup: (key) => readOrNull(side(key, "bak")),
    async setAside(key) {
      try {
        await rename(file(key), side(key, "broken"));
      } catch (e) {
        if (!isMissing(e)) throw e;
      }
    },
    async write(key, text) {
      const target = file(key);
      const tmp = `${target}.tmp`;
      await mkdir(dir, { recursive: true });
      await writeFile(tmp, text, "utf8");
      try {
        await copyFile(target, side(key, "bak"));
      } catch (e) {
        if (!isMissing(e)) throw e;
      }
      await renameSteady(tmp, target);
    },
    async remove(key) {
      await rm(file(key), { force: true });
    },
  };
}
