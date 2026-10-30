import { mkdtemp, readdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createFileStorage } from "./storage";

describe("파일 저장소", () => {
  it("덮어쓸 때 직전 판을 .bak으로 남기고 임시 파일은 남기지 않는다", async () => {
    const dir = await mkdtemp(join(tmpdir(), "demogame-"));
    const s = createFileStorage(join(dir, "saves"));
    expect(await s.read("run")).toBeNull();
    await s.write("run", "1");
    await s.write("run", "2");
    expect(await s.read("run")).toBe("2");
    expect(await readFile(join(dir, "saves", "run.bak.json"), "utf8")).toBe("1");
    expect((await readdir(join(dir, "saves"))).sort()).toEqual(["run.bak.json", "run.json"]);
    await s.remove("run");
    expect(await s.read("run")).toBeNull();
  });

  it("경로 조작 키를 거부한다", async () => {
    const s = createFileStorage(tmpdir());
    await expect(s.write("../../etc/x", "x")).rejects.toThrow(/invalid storage key/);
  });
});
