// 전투 결과 화면이 그리는 값 (0044 + 0050 + 0051). 화면은 "카드 목록 + 주인"만 받아요. 보상을 어떻게 뽑는지는 규칙(src/core)의 일이에요.
import type { CardVM } from "../card/viewmodel";
import type { EquipChipVM, EquipTipVM, EquipVM, LaneVM, StatId } from "../run/viewmodel";

export type { EquipChipVM, EquipSheetVM, EquipStatId, EquipTipVM } from "../run/viewmodel";

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
