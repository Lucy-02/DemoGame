// 런 화면 공용 뼈대가 그리는 값: 오른쪽 정령 줄 (0044 · 0046).
import type { CardVM } from "../card/viewmodel";
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

/** 말풍선과 장비 줄에 찍는 수치: HP와 능력치 셋 */
export type EquipStatId = StatId | "hp";

/** 장비가 주는 수치 하나: 기호 + 증감 (+1, -20%) */
export interface EquipChipVM {
  stat: EquipStatId;
  label: string;
  neg: boolean;
}

/** 장비 하나의 설명: 머리(그림 · 이름 · 희귀도 · 공명 점) + 주는 수치 + 효과문 */
export interface EquipSheetVM {
  item: EquipVM;
  chips: EquipChipVM[];
  lines: string[];
  /** 전용 무기의 기술 카드와 그 효과문 (효과문의 "…로 바뀝니다"가 가리키는 카드) */
  card?: { vm: CardVM; text: string };
  /** 효과문 아래 안내 한 줄 (해요체) */
  note?: string;
}

/**
 * 장비 말풍선 (0064). 말풍선은 장비가 무엇인지만 말해요. 정령에게 일어나는 일(능력치 a +n, 최대 HP, 비친 칸)은 정령 줄이 말해요.
 * drop = 내려놓아 사라지는 장비. 같은 틀을 흐리게 한 번 더 써요.
 */
export interface EquipTipVM {
  sheet: EquipSheetVM;
  drop?: EquipSheetVM;
}
