import { describe, expect, it } from "vitest";
import { createWebPlatform } from "./web";

function memoryStore() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
}

describe("웹 플랫폼", () => {
  it("쓰고 읽고 지운다", async () => {
    const p = createWebPlatform(memoryStore());
    expect(await p.read("run")).toBeNull();
    await p.write("run", '{"v":1}');
    expect(await p.read("run")).toBe('{"v":1}');
    await p.remove("run");
    expect(await p.read("run")).toBeNull();
  });

  it("경로처럼 생긴 키를 거부한다", async () => {
    const p = createWebPlatform(memoryStore());
    await expect(p.write("../evil", "x")).rejects.toThrow(/invalid storage key/);
    await expect(p.read("Run")).rejects.toThrow(/invalid storage key/);
  });
});
