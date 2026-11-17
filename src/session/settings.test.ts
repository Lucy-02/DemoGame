import { describe, expect, it } from "vitest";
import { SETTINGS_KEY, SettingsSession, defaultSettings, loadSettings, parseSettings, saveSettings } from "./settings";

function memory(init: Record<string, string> = {}) {
  const m = new Map(Object.entries(init));
  return {
    m,
    read: async (k: string) => m.get(k) ?? null,
    write: async (k: string, v: string) => void m.set(k, v),
  };
}

describe("설정", () => {
  it("저장이 없으면 기본값이에요", async () => {
    expect(await loadSettings(memory())).toEqual(defaultSettings());
  });

  it("깨진 글과 범위를 벗어난 값은 기본값으로 메워요", () => {
    expect(parseSettings("{")).toEqual(defaultSettings());
    expect(parseSettings("[1]")).toEqual(defaultSettings());
    const s = parseSettings(JSON.stringify({ volume: { master: 7, music: "x", sfx: -1 }, speed: "warp", shake: "no", fullscreen: true }));
    expect(s.volume).toEqual({ master: 1, music: defaultSettings().volume.music, sfx: 0 });
    expect(s.speed).toBe("normal");
    expect(s.shake).toBe(true);
    expect(s.fullscreen).toBe(true);
  });

  it("모르는 칸은 그대로 다시 써요", async () => {
    const store = memory({ [SETTINGS_KEY]: JSON.stringify({ version: 1, volume: { master: 0.5, voice: 0.3 }, later: { a: 1 } }) });
    const session = await SettingsSession.load(store);
    session.set({ speed: "fast" });
    await session.flush();
    const saved = JSON.parse(store.m.get(SETTINGS_KEY)!);
    expect(saved.later).toEqual({ a: 1 });
    expect(saved.volume.voice).toBe(0.3);
    expect(saved.volume.master).toBe(0.5);
    expect(saved.speed).toBe("fast");
  });

  it("바뀐 칸만 알리고 저장해요", async () => {
    const store = memory();
    const session = await SettingsSession.load(store);
    const seen: number[] = [];
    session.onChange((s) => seen.push(s.volume.music));
    session.set({ volume: { music: 0.25 } });
    session.set({ volume: { music: 0.25 } });
    await session.flush();
    expect(seen).toEqual([0.25]);
    expect((await loadSettings(store)).volume).toEqual({ ...defaultSettings().volume, music: 0.25 });
  });
});

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
