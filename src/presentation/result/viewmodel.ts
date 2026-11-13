// 전투 결과 화면이 그리는 값 (0044 + 0050 + 0051). 화면은 "카드 목록 + 주인"만 받아요. 보상을 어떻게 뽑는지는 규칙(src/core)의 일이에요.
import type { CardVM } from "../card/viewmodel";
import type { EquipVM, LaneVM, StatId } from "../run/viewmodel";

export interface RewardCardVM {
  card: CardVM;
  /** 배울 수 있는 정령 줄 (LaneVM.id). 전투 보상은 주인 하나로 정해져 있어요 (0040).
   *  여럿이면(이벤트 카드) 카드를 집은 뒤 줄을 눌러 정해요 */
  owners: string[];
  /** 이 카드가 쓰는 능력치. 집으면 주인 줄에서 밝아져요 */
  stat?: StatId;
}

export interface ResultVM {
  /** 골드는 자동으로 받아요. total은 받은 뒤 값 */
  gold: { total: number; gained: number };
  /** 왼→오 순서 = 정령 줄 위→아래 순서 (0051) */
  cards: RewardCardVM[];
  /** 넘기면 받는 골드. 없으면 버튼에 골드를 붙이지 않아요 (이벤트 카드) */
  skipGold?: number;
  lanes: LaneVM[];
  /** 정예 장비. 카드 다음에 골라요 (0051 · 0064) */
  equip?: EquipOfferVM;
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

/** 정령 하나가 장비를 받는 한 가지 방법 (칸 하나) */
export interface EquipOptionVM {
  /** 장비가 들어갈 칸 */
  slot: number;
  /** 내려놓을 장비 id (꽉 찼을 때) */
  replace?: string;
  /** 받은 뒤의 줄 */
  after: LaneVM;
  tip: EquipTipVM;
}

export interface EquipOfferVM {
  item: EquipVM;
  /** 장비 줄 오른쪽: 주는 수치 */
  gain: EquipChipVM[];
  /** 장비 줄에 올렸을 때의 말풍선 (받을 정령이 정해지기 전) */
  tip: EquipTipVM;
  /** 받을 수 있는 정령 id → 방법들. 꽉 찬 정령은 칸마다 하나씩 */
  takers: Record<string, EquipOptionVM[]>;
  /** 받을 정령이 모두 꽉 찼을 때만 넘길 수 있어요 (0056) */
  canSkip: boolean;
}
