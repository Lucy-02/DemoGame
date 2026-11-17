// 고정 장면 (?screen=deck&scene=…): 씨앗을 정한 판에 카드를 더해 보통 덱과 꽉 찬 덱을 만들어요.
import { CARDS } from "../../core/data";
import { Run } from "../../core/run";

/** 정령 순서대로 더 받은 카드 수 */
export const DECKS: Record<string, number[]> = {
  start: [0, 0, 0],
  normal: [0, 1, 0],
  full: [5, 8, 3],
};

export const DEFAULT_DECK = "normal";

export function deckRun(name?: string): Run {
  const extra = DECKS[name ?? DEFAULT_DECK] ?? DECKS[DEFAULT_DECK];
  const run = new Run({ seed: 11, frontId: "", adult: false, unlockAll: true });
  run.spirits.forEach((s, i) => {
    const own = CARDS.filter((c) => c.spirit === s.id && c.obtain !== "generated");
    for (let k = 0; k < (extra[i] ?? 0) && own.length; k++) run.addCard(own[k % own.length].id, s.id);
  });
  return run;
}
