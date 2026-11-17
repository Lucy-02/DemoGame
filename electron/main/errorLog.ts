// 오류 기록 파일. Electron에 의존하지 않아서 Node 테스트로 바로 확인해요.
import { appendFile, mkdir, rename, stat } from "node:fs/promises";
import { dirname } from "node:path";

/** 기록 한 건과 파일 크기의 한도. 넘으면 한 건은 자르고, 파일은 `.old` 하나로 넘겨요 */
export const ERROR_LOG_LIMITS = { entry: 20_000, file: 1_000_000 };

export interface ErrorLog {
  append(text: string): Promise<void>;
}

/** `file`에 한 건씩 덧붙여요. 앞에 시각을 붙여요. 기록하다 난 오류는 삼켜요(기록 때문에 게임이 멈추면 안 돼요). */
export function createErrorLog(file: string, now: () => Date = () => new Date()): ErrorLog {
  let queue: Promise<void> = Promise.resolve();
  const write = async (text: string) => {
    await mkdir(dirname(file), { recursive: true });
    const size = await stat(file).then((s) => s.size, () => 0);
    if (size > ERROR_LOG_LIMITS.file) await rename(file, `${file}.old`);
    await appendFile(file, `[${now().toISOString()}] ${text.slice(0, ERROR_LOG_LIMITS.entry)}\n`, "utf8");
  };
  return {
    append(text) {
      queue = queue.then(() => write(String(text))).catch(() => {});
      return queue;
    },
  };
}
