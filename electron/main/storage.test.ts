import { mkdtemp, readdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createFileStorage, renameSteady } from "./storage";

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

  it("직전 판을 읽고, 못 읽는 파일은 .broken으로 치운다", async () => {
    const dir = await mkdtemp(join(tmpdir(), "demogame-"));
    const s = createFileStorage(join(dir, "saves"));
    expect(await s.readBackup("garden")).toBeNull();
    await s.setAside("garden");
    await s.write("garden", "1");
    await s.write("garden", "{");
    expect(await s.readBackup("garden")).toBe("1");
    await s.setAside("garden");
    expect(await s.read("garden")).toBeNull();
    expect(await readFile(join(dir, "saves", "garden.broken.json"), "utf8")).toBe("{");
    // 되돌린 것을 다시 써도 직전 판은 그대로예요
    await s.write("garden", "1");
    expect(await s.readBackup("garden")).toBe("1");
  });

  it("경로 조작 키를 거부한다", async () => {
    const s = createFileStorage(tmpdir());
    await expect(s.write("../../etc/x", "x")).rejects.toThrow(/invalid storage key/);
  });

  it("이름 바꾸기가 잠깐 막히면 다시 하고, 다른 오류는 바로 던진다", async () => {
    const busy = Object.assign(new Error("busy"), { code: "EPERM" });
    let calls = 0;
    await renameSteady("a", "b", async () => { if (++calls < 3) throw busy; });
    expect(calls).toBe(3);
    const gone = Object.assign(new Error("gone"), { code: "ENOENT" });
    calls = 0;
    await expect(renameSteady("a", "b", async () => { calls++; throw gone; })).rejects.toThrow("gone");
    expect(calls).toBe(1);
  });
});
