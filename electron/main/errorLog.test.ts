import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ERROR_LOG_LIMITS, createErrorLog } from "./errorLog";

describe("오류 기록 파일", () => {
  it("시각을 붙여 한 건씩 덧붙이고, 긴 기록은 잘라요", async () => {
    const file = join(await mkdtemp(join(tmpdir(), "demogame-")), "logs", "error.log");
    const log = createErrorLog(file, () => new Date("2026-11-17T00:00:00Z"));
    void log.append("v0.1.0 첫 오류");
    await log.append("x".repeat(ERROR_LOG_LIMITS.entry + 10));
    const lines = (await readFile(file, "utf8")).trimEnd().split("\n");
    expect(lines[0]).toBe("[2026-11-17T00:00:00.000Z] v0.1.0 첫 오류");
    expect(lines[1]).toHaveLength("[2026-11-17T00:00:00.000Z] ".length + ERROR_LOG_LIMITS.entry);
  });

  it("파일이 한도를 넘으면 .old로 넘기고 새로 써요", async () => {
    const file = join(await mkdtemp(join(tmpdir(), "demogame-")), "error.log");
    await writeFile(file, "y".repeat(ERROR_LOG_LIMITS.file + 1));
    await createErrorLog(file).append("다음 오류");
    expect(await readFile(`${file}.old`, "utf8")).toHaveLength(ERROR_LOG_LIMITS.file + 1);
    expect(await readFile(file, "utf8")).toMatch(/다음 오류\n$/);
  });
});
