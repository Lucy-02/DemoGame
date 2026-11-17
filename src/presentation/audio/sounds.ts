// 소리 목록 (0084 1번 · 0091)과 파일 은행. 어떤 사건에 어떤 파일이 나는지는 bank.json 한 곳에서 바꿔요.
// 파일은 public/assets/audio/sfx · music 아래에 있고, 출처는 assets/provenance.jsonl에 적어요.
import bank from "./bank.json";

/**
 * 소리가 붙는 사건. 앞에 있을수록 먼저 살려요: 한꺼번에 나는 소리가 은행의 동시 수를 넘으면 뒤쪽 것부터 빠져요 (0091 3번).
 * 화면 전환과 창 뜸은 일부러 소리가 없어요 (0091 1번).
 */
export const SFX_IDS = [
  "release", "victory", "defeat", "evolve", "join",
  "down.ally", "down.enemy", "break", "charge",
  "hit.heavy", "hit.medium", "hit.light", "block", "heal", "status",
  "reward", "equip", "upgrade", "buy", "rest",
  "card.play", "turn.end", "hand.new", "map.move",
  "card.deny", "card.pick", "card.place", "ui.click", "ui.hover",
] as const;
export type SfxId = (typeof SFX_IDS)[number];

export const MUSIC_IDS = ["menu", "map", "battle", "boss"] as const;
export type MusicId = (typeof MUSIC_IDS)[number];

export type Bus = "master" | "music" | "sfx";

export interface SfxEntry {
  /** 여럿이면 번갈아 나요 */
  files: string[];
  /** 사건별 음량 0 ~ 1. 없으면 1. 파일은 같은 기준 음량으로 맞춰 넣고, 사건의 크기 차이는 여기서 줘요 */
  gain?: number;
  /** 날 때마다 음높이를 이만큼(센트)까지 위아래로 흔들어요. 없으면 흔들지 않아요 */
  detune?: number;
}

export interface SoundBank {
  /** 사건 → 파일과 음량. 없으면 소리가 없어요 */
  sfx: Partial<Record<SfxId, SfxEntry>>;
  music: Partial<Record<MusicId, string>>;
  /** 효과음이 한꺼번에 나는 수의 위 끝 */
  voices: number;
}

export const BANK: SoundBank = bank;
export const AUDIO_BASE = "assets/audio";

const rank = (id: SfxId) => SFX_IDS.indexOf(id);

/** 여러 파일 가운데 하나. 바로 앞에 난 것은 피해요 */
export function nextVariant(count: number, last: number | undefined, random: () => number): number {
  if (count <= 1) return 0;
  const i = Math.floor(random() * (count - 1));
  return last === undefined ? Math.floor(random() * count) : i >= last ? i + 1 : i;
}

/**
 * 새 소리가 날 자리: 자리가 남으면 "play", 꽉 찼으면 나고 있는 것 가운데 가장 작은 사건(같으면 오래된 것)을 끄고 그 번호를 돌려줘요.
 * 새 소리가 그보다 작은 사건이면 "skip".
 */
export function admit(active: readonly SfxId[], next: SfxId, voices: number): "play" | "skip" | number {
  if (active.length < voices) return "play";
  let worst = -1;
  for (let i = 0; i < active.length; i++) if (worst < 0 || rank(active[i]) > rank(active[worst])) worst = i;
  return worst < 0 || rank(next) > rank(active[worst]) ? "skip" : worst;
}
