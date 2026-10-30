// 저장 파일 읽기·쓰기. Electron에 의존하지 않아서 Node 테스트로 바로 확인해요.
import { copyFile, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { assertStorageKey } from "../../src/platform/bridge";

export interface FileStorage {
  read(key: string): Promise<string | null>;
  write(key: string, text: string): Promise<void>;
  remove(key: string): Promise<void>;
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
  return {
    async read(key) {
      try {
        return await readFile(file(key), "utf8");
      } catch (e) {
        if (isMissing(e)) return null;
        throw e;
      }
    },
    async write(key, text) {
      const target = file(key);
      const tmp = `${target}.tmp`;
      await mkdir(dir, { recursive: true });
      await writeFile(tmp, text, "utf8");
      try {
        await copyFile(target, join(dir, `${key}.bak.json`));
      } catch (e) {
        if (!isMissing(e)) throw e;
      }
      await rename(tmp, target);
    },
    async remove(key) {
      await rm(file(key), { force: true });
    },
  };
}
