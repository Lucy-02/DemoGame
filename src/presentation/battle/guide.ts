// 첫 판 안내 (0088): 첫 판의 첫 전투에서 개념 셋을 한 번씩 짚어요. 글 · 화자 없이 짚을 곳에 테 하나만 켜요.
// 여기는 "지금 무엇을 짚을지"만 정해요. 그리기는 views/guide.ts.

/** 짚는 차례: 카드 놓기 → 차징(의도 알약) → 턴 종료. 한 번에 하나만 켜요 */
export type GuideStep = "place" | "charge" | "end";

/** 이 전투에서 이미 짚은 것. 장면을 다시 그려도 남아요 (전투가 다시 시작하면 처음부터) */
export interface GuideSeen {
  /** 차징 알약을 가리켜 풀이를 봤어요 */
  charge?: true;
}

export interface GuideFacts {
  turn: number;
  /** 이번 턴에 카드를 하나라도 놓았는지 */
  placed: boolean;
  /** 차징 중인 적이 있는지 */
  charging: boolean;
  /** 더 낼 수 있는 카드가 없는지 */
  spent: boolean;
}

/** 지금 짚을 것. 없으면 null */
export function guideStep(f: GuideFacts, seen: GuideSeen): GuideStep | null {
  if (f.turn === 1 && !f.placed) return "place";
  // 낼 카드가 없으면 턴 종료가 먼저예요. 차징은 다음 턴에 다시 짚어요
  if (f.turn === 1 && f.spent) return "end";
  if (f.charging && !seen.charge) return "charge";
  if (f.turn === 1) return "end";
  return null;
}
