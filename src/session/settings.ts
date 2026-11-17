// 설정: 볼륨 셋 · 전체화면 · 턴 재생 속도 · 화면 흔들림 (0084 3번). 저장 키 `settings` 하나에 JSON으로 남겨요.
// 볼륨 칸은 소리 층과 함께 써요(실제 음량 = master × music 또는 sfx). 모르는 칸은 읽은 그대로 다시 써서 다른 버전이 넣은 값을 지우지 않아요.
// 화면은 SettingsSession 하나를 보고, 바뀌면 바로 저장해요 (적용 버튼 없음).

/** platform 저장 가운데 설정이 쓰는 것만 */
export interface SettingsStore {
  read(key: string): Promise<string | null>;
  write(key: string, text: string): Promise<void>;
}

export const SETTINGS_KEY = "settings";
export const SETTINGS_VERSION = 1;

export type VolumeId = "master" | "music" | "sfx";
/** 턴 재생 속도 두 단계 (0084 7번) */
export type Speed = "normal" | "fast";

/** 볼륨 묶음 셋 (0084 1번). 0 ~ 1. 실제 음량 = master × (music 또는 sfx) */
export type Volume = Record<VolumeId, number>;

export interface Settings {
  version: number;
  volume: Volume;
  fullscreen: boolean;
  speed: Speed;
  /** 화면 흔들림 · 번쩍임. false면 꺼요 */
  shake: boolean;
}

/** 볼륨 기본값은 임시예요 (소리 스레드와 맞춘 값, 토큰 아님) */
export function defaultSettings(): Settings {
  return { version: SETTINGS_VERSION, volume: { master: 1, music: 0.6, sfx: 0.8 }, fullscreen: false, speed: "normal", shake: true };
}

const clamp01 = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : d);
const bool = (v: unknown, d: boolean) => (typeof v === "boolean" ? v : d);

/** 저장 글을 설정으로. 깨졌거나 빠진 칸은 기본값, 모르는 칸은 그대로 둬요 */
export function parseSettings(text: string | null): Settings {
  const d = defaultSettings();
  if (!text) return d;
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return d;
  }
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return d;
  const o = raw as Record<string, unknown>;
  const vol = (typeof o.volume === "object" && o.volume !== null ? o.volume : {}) as Record<string, unknown>;
  return {
    ...o,
    version: SETTINGS_VERSION,
    volume: { ...vol, master: clamp01(vol.master, d.volume.master), music: clamp01(vol.music, d.volume.music), sfx: clamp01(vol.sfx, d.volume.sfx) },
    fullscreen: bool(o.fullscreen, d.fullscreen),
    speed: o.speed === "fast" ? "fast" : "normal",
    shake: bool(o.shake, d.shake),
  };
}

export async function loadSettings(store: SettingsStore): Promise<Settings> {
  return parseSettings(await store.read(SETTINGS_KEY));
}

export function saveSettings(store: SettingsStore, s: Settings): Promise<void> {
  return store.write(SETTINGS_KEY, JSON.stringify(s));
}

export type SettingsPatch = Partial<Omit<Settings, "version" | "volume">> & { volume?: Partial<Record<VolumeId, number>> };

/** 지금 설정을 들고, 바뀌면 알리고 저장해요 */
export class SettingsSession {
  private listeners = new Set<(s: Settings, prev: Settings) => void>();
  private writes: Promise<void> = Promise.resolve();

  constructor(private _state: Settings = defaultSettings(), private store?: SettingsStore) {}

  static async load(store: SettingsStore): Promise<SettingsSession> {
    return new SettingsSession(await loadSettings(store), store);
  }

  get state(): Settings {
    return this._state;
  }

  /** 바뀐 칸만 넘겨요. 같은 값이면 아무 일도 없어요 */
  set(patch: SettingsPatch) {
    const prev = this._state;
    const next = parseSettings(JSON.stringify({ ...prev, ...patch, volume: { ...prev.volume, ...patch.volume } }));
    if (JSON.stringify(next) === JSON.stringify(prev)) return;
    this._state = next;
    for (const f of this.listeners) f(next, prev);
    const store = this.store;
    if (store) this.writes = this.writes.then(() => saveSettings(store, this._state)).catch((e) => console.error("설정 저장 실패", e));
  }

  onChange(f: (s: Settings, prev: Settings) => void): () => void {
    this.listeners.add(f);
    return () => this.listeners.delete(f);
  }

  /** 기다리는 저장이 모두 끝나면 풀려요 (시험·종료 전) */
  flush(): Promise<void> {
    return this.writes;
  }
}
