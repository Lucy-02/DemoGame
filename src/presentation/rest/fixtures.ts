// 고정 장면 (?screen=rest&scene=…). 씨앗을 정한 런 위에 실제 휴식 규칙을 써요. 화면 확인용이에요.
import { Run } from "../../core/run";
import { RestSession } from "../../session/rest";

interface RestSetup {
  seed: number;
  /** 파티 순서대로 지금 HP */
  hp: number[];
  /** 이 카드들(덱 앞에서부터 같은 id 한 장씩)은 이미 강화했어요 */
  upgraded?: string[];
}

export const RESTS: Record<string, RestSetup> = {
  /** 셋 다 다침 */
  normal: { seed: 11, hp: [14, 25, 9] },
  /** 모두 가득 · 일부 카드는 이미 강화 */
  full: { seed: 11, hp: [999, 999, 999], upgraded: ["basic_claw", "basic_block"] },
};

export const DEFAULT_REST = "normal";

export function restSession(name?: string): RestSession {
  const setup = RESTS[name ?? DEFAULT_REST] ?? RESTS[DEFAULT_REST];
  const run = new Run({ seed: setup.seed, frontId: "", adult: false, unlockAll: true });
  run.spirits.forEach((s, i) => { s.hp = Math.min(s.hp, setup.hp[i] ?? s.hp); });
  for (const id of setup.upgraded ?? []) {
    const card = run.deck.find((c) => c.cardId === id && !c.upgraded);
    if (card) run.upgradeCard(card.uid);
  }
  return new RestSession(run);
}
