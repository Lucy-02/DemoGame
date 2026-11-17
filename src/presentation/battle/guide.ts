// 첫 판 안내 (0088): 첫 판의 첫 전투에서 개념 셋을 한 번씩 짚어요. 글 · 화자 없이 짚을 곳에 테 하나만 켜요.
// 여기는 "지금 무엇을 짚을지"만 정해요. 그리기는 views/guide.ts.

/**
 * 짚는 차례. 한 번에 하나만 켜요.
 * 첫 판의 첫 전투: 카드 놓기 → 차징(의도 알약) → 턴 종료.
 * 브레이크(0095): 손에 브레이크 카드가 있고 차징 중인 적이 있는 첫 순간에 한 번. 어느 전투든 켜져요.
 */
export type GuideStep = "place" | "charge" | "end" | "break";

/** 이 전투에서 이미 짚은 것. 장면을 다시 그려도 남아요 (전투가 다시 시작하면 처음부터) */
export interface GuideSeen {
  /** 첫 판의 첫 전투: 카드 놓기 · 차징 · 턴 종료를 짚어요 */
  steps?: boolean;
  /** 브레이크를 아직 짚지 않았어요. 한 번 켜지면 그 전투 동안은 조건이 맞을 때마다 켜져요 */
  breakHint?: boolean;
  /** 브레이크 테가 처음 켜질 때 한 번 불러요 (정원에 적어 다음 전투부터는 안 나와요) */
  onBreak?: () => void;
  breakShown?: true;
  /** 차징 알약을 가리켜 풀이를 봤어요 */
  charge?: true;
  /** 이 전투에서 카드를 한 장이라도 놓아 봤어요 */
  placed?: true;
}

export interface GuideFacts {
  turn: number;
  /** 이번 턴에 카드를 하나라도 놓았는지 */
  placed: boolean;
  /** 차징 중인 적이 있는지 */
  charging: boolean;
  /** 더 낼 수 있는 카드가 없는지 */
  spent: boolean;
  /** 손에 낼 수 있는 브레이크 카드가 있는지 */
  canBreak: boolean;
}

/** 지금 짚을 것. 없으면 null */
export function guideStep(f: GuideFacts, seen: GuideSeen): GuideStep | null {
  const first = !!seen.steps && f.turn === 1;
  if (first && !f.placed) return "place";
  // 첫 턴을 카드 없이 넘겼으면, 한 장 놓아 볼 때까지 다음 턴에도 손패를 짚어요
  if (seen.steps && !seen.placed && !f.placed && !f.spent) return "place";
  // 낼 카드가 없으면 턴 종료가 먼저예요. 차징은 다음 턴에 다시 짚어요
  if (first && f.spent) return "end";
  if (seen.breakHint && f.charging && f.canBreak) return "break";
  if (!seen.steps) return null;
  if (f.charging && !seen.charge) return "charge";
  return first ? "end" : null;
}
