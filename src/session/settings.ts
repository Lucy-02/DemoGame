// 설정 저장: platform의 `settings` 키 하나에 JSON으로 둬요. 화면은 값을 직접 고치지 않고 load/save만 써요.
// 볼륨 밖의 칸(창 · 속도 · 흔들림)은 설정 화면 쪽에서 같은 객체에 더해요. 모르는 칸은 읽은 그대로 다시 써요.

/** platform 저장 가운데 설정이 쓰는 것만 */
export interface SettingsStore {
  read(key: string): Promise<string | null>;
  write(key: string, text: string): Promise<void>;
}

export const SETTINGS_KEY = "settings";
export const SETTINGS_VERSION = 1;

/** 볼륨 묶음 셋 (0084 1번). 0 ~ 1. 실제 음량 = master × (music 또는 sfx) */
export interface Volume {
  master: number;
  music: number;
  sfx: number;
}

export interface Settings {
  version: number;
  volume: Volume;
  /** 다른 화면이 더한 칸 */
  [key: string]: unknown;
}

/** 기본 볼륨은 임시 값이에요 (0087) */
export function defaultSettings(): Settings {
  return { version: SETTINGS_VERSION, volume: { master: 1, music: 0.6, sfx: 0.8 } };
}

const unit = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : fallback);

/** 저장된 글을 설정으로. 깨졌거나 없으면 기본값, 빠진 칸은 기본값으로 채워요 */
export function parseSettings(text: string | null): Settings {
  const base = defaultSettings();
  if (!text) return base;
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return base;
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const r = raw as Record<string, unknown>;
  const v = (r.volume && typeof r.volume === "object" ? r.volume : {}) as Record<string, unknown>;
  return {
    ...r,
    version: SETTINGS_VERSION,
    volume: { master: unit(v.master, base.volume.master), music: unit(v.music, base.volume.music), sfx: unit(v.sfx, base.volume.sfx) },
  };
}

export async function loadSettings(store: SettingsStore): Promise<Settings> {
  return parseSettings(await store.read(SETTINGS_KEY));
}

export async function saveSettings(store: SettingsStore, s: Settings): Promise<void> {
  await store.write(SETTINGS_KEY, JSON.stringify(s));
}
