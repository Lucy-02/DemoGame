// 판 결과 화면이 그리는 값 (0046 런 결과 · 0076 17번).
import type { CardVM } from "../card/viewmodel";
import type { LaneVM } from "../run/viewmodel";

export interface RunEndVM {
  victory: boolean;
  /** 기록 한 줄: 1막 · 6층 · 승리 */
  record: string;
  /** 이번 판에서만 남는 것: 골드 a→0, 배운 카드 */
  gold: number;
  /** 배운 카드와 배운 정령 */
  cards: { card: CardVM; owner: string }[];
  /** 정령 줄: 그 판에서 자란 마지막 모습 (0157). 완주로 성격이 열렸으면 칩이 붙어요 (0171) */
  lanes: LaneVM[];
  /** 완주한 줄이 늘어 다시 뽑기가 늘었을 때만 (0157): 다음 판부터 받는 수 a→b */
  reroll?: { from: number; to: number };
}
