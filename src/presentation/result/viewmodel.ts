// 전투 결과 화면이 그리는 값 (0044 + 0050 + 0051). 화면은 "카드 목록 + 주인"만 받아요. 보상을 어떻게 뽑는지는 규칙(src/core)의 일이에요.
import type { CardVM } from "../card/viewmodel";
import type { LaneVM, StatId } from "../run/viewmodel";

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
}
