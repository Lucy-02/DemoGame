// 판 결과 화면이 그리는 값 (0046 런 결과 · 0076 17번).
import type { CardVM } from "../card/viewmodel";
import type { LaneVM } from "../run/viewmodel";

export interface RunEndLaneVM {
  lane: LaneVM;
  /** 다음 판의 최대 HP (레벨 효과). 같으면 없음 */
  maxHpTo?: number;
}

export interface RunEndVM {
  victory: boolean;
  /** 기록 한 줄: 1막 · 8층 · 승리 */
  record: string;
  /** 첫 판 전멸 안내 (없으면 안 그려요) */
  keep?: string;
  /** 이번 판에서만 남는 것: 골드 a→0, 배운 카드 */
  gold: number;
  /** 배운 카드와 배운 정령 */
  cards: { card: CardVM; owner: string }[];
  lanes: RunEndLaneVM[];
}
