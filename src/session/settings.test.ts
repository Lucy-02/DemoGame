import { describe, expect, it } from "vitest";
import { defaultSettings, loadSettings, parseSettings, saveSettings, SETTINGS_KEY } from "./settings";

const memory = () => {
  const m = new Map<string, string>();
  return { m, read: async (k: string) => m.get(k) ?? null, write: async (k: string, t: string) => void m.set(k, t) };
};

describe("설정 저장", () => {
  it("저장이 없거나 깨졌으면 기본값", async () => {
    expect(await loadSettings(memory())).toEqual(defaultSettings());
    expect(parseSettings("{")).toEqual(defaultSettings());
    expect(parseSettings("[1]")).toEqual(defaultSettings());
  });

  it("쓴 값을 그대로 읽어요", async () => {
    const store = memory();
    const s = { ...defaultSettings(), volume: { master: 0.5, music: 0, sfx: 1 } };
    await saveSettings(store, s);
    expect(store.m.has(SETTINGS_KEY)).toBe(true);
    expect(await loadSettings(store)).toEqual(s);
  });

  it("볼륨은 0 ~ 1로 자르고, 빠진 칸은 기본값", () => {
    const s = parseSettings(JSON.stringify({ volume: { master: 3, music: -1, sfx: "크게" } }));
    expect(s.volume).toEqual({ master: 1, music: 0, sfx: defaultSettings().volume.sfx });
  });

  it("모르는 칸은 보존해요", () => {
    const s = parseSettings(JSON.stringify({ version: 1, volume: { master: 1, music: 1, sfx: 1 }, speed: "fast" }));
    expect(s.speed).toBe("fast");
  });
});
