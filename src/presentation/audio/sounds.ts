// 소리 목록 (0084 1번)과 파일 은행. 어떤 사건에 어떤 파일이 나는지는 bank.json 한 곳에서 바꿔요.
// 파일은 public/assets/audio/sfx · music 아래에 있고, 출처는 assets/provenance.jsonl에 적어요.
import bank from "./bank.json";

export const SFX_IDS = [
  "ui.click", "ui.hover",
  "card.pick", "card.place", "card.play",
  "hit.light", "hit.medium", "hit.heavy",
  "block", "status", "charge", "break",
  "reward", "map.move", "victory", "defeat",
] as const;
export type SfxId = (typeof SFX_IDS)[number];

export const MUSIC_IDS = ["menu", "map", "battle", "boss"] as const;
export type MusicId = (typeof MUSIC_IDS)[number];

export type Bus = "master" | "music" | "sfx";

export interface SoundBank {
  /** 사건 → 파일들. 여럿이면 번갈아 나요. 비어 있으면 소리가 없어요 */
  sfx: Partial<Record<SfxId, string[]>>;
  music: Partial<Record<MusicId, string>>;
}

export const BANK: SoundBank = bank;
export const AUDIO_BASE = "assets/audio";

/** 여러 파일 가운데 하나. 바로 앞에 난 것은 피해요 */
export function nextVariant(count: number, last: number | undefined, random: () => number): number {
  if (count <= 1) return 0;
  const i = Math.floor(random() * (count - 1));
  return last === undefined ? Math.floor(random() * count) : i >= last ? i + 1 : i;
}
