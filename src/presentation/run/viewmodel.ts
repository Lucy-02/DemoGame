// 런 화면 공용 뼈대가 그리는 값: 오른쪽 정령 줄 (0044 · 0046).
import type { IconId } from "../faces";
import type { Crop } from "../spirits/artFit";

/** 정령 줄에 보이는 능력치 (0044: 카드가 쓰는 능력치가 밝아져요) */
export type StatId = "power" | "guard" | "focus";
export const STAT_IDS: readonly StatId[] = ["power", "guard", "focus"];

/** 장비 희귀도 (0056 · 0061): 일반 · 유니크 · 전설 */
export type EquipRarityId = "generic" | "exclusive" | "boss";

/** 칸에 놓이는 장비 하나 (0064) */
export interface EquipVM {
  id: string;
  /** 이름이 아직 없으면(TODO_NAME) 비워요. 화면은 이름 자리를 그리지 않아요 */
  name?: string;
  rarity: EquipRarityId;
  rarityName: string;
  /** 지금 공명과, 이 정령이 올릴 수 있는 상한 (공명 점 수) */
  resonance: number;
  cap: number;
}

export interface LaneVM {
  id: string;
  name: string;
  level: number;
  /** 이번 전투로 레벨이 올랐어요 */
  levelUp?: boolean;
  hp: number;
  maxHp: number;
  /** 쓰러졌다가 HP 1로 돌아온 정령 (0044: 회색 얼굴, 끊긴 붉은 점선 링) */
  down?: boolean;
  /** 경험 링: before까지는 지난 경험, before~after가 이번에 더해진 만큼 (0~1) */
  exp: { before: number; after: number };
  /** 얼굴 그림. 없으면 자리표시 */
  face?: { key: string; crop: Crop };
  stats: Record<StatId, number>;
  /** 문턱을 넘었을 때만 붙는 표식 (g-up 레벨 업, g-cardnew 카드 해금, g-seed 키울 수 있음) */
  badges: IconId[];
  /** 새로 열린 카드 이름 */
  unlocked: string[];
  /** 장비 칸. 길이 = 지닐 수 있는 수, 빈 칸은 null (0064) */
  slots: (EquipVM | null)[];
  /** 이 정령의 덱 장수 (상점: 카드를 살 때 a→b로 보여요) */
  deck?: number;
}
