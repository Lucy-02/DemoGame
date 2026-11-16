// 고정 장면 (?screen=map&scene=…): 씨앗을 정한 판을 몇 칸 걸어 둔 지도예요.
import { CARDS } from "../../core/data";
import { Run } from "../../core/run";

interface MapSetup {
  /** 걸어 둔 칸 수 (갈 수 있는 첫 칸으로) */
  steps: number;
  /** 파티 순서대로 지금 HP */
  hp?: number[];
}

export const MAPS: Record<string, MapSetup> = {
  start: { steps: 0 },
  mid: { steps: 3, hp: [24, 34, 18] },
  boss: { steps: 7, hp: [9, 20, 1] },
};

export const DEFAULT_MAP = "mid";

export function mapRun(name?: string): Run {
  const setup = MAPS[name ?? DEFAULT_MAP] ?? MAPS[DEFAULT_MAP];
  const run = new Run({ seed: 11, frontId: "", adult: false, unlockAll: true });
  for (let i = 0; i < setup.steps; i++) {
    const next = run.reachable();
    if (!next.length) break;
    run.enter(next[next.length > 1 ? i % 2 : 0]);
  }
  run.spirits.forEach((s, i) => { s.hp = Math.min(s.hp, setup.hp?.[i] ?? s.hp); });
  // 걸어온 만큼 카드를 받아 둬요 (펼친 줄의 이번 판에 받은 카드)
  run.spirits.forEach((sp, i) => {
    const own = CARDS.filter((c) => c.spirit === sp.id && c.obtain !== "generated");
    for (let k = 0; k < Math.min(setup.steps - i, own.length) && k < 4; k++) if (k >= 0) run.addCard(own[k].id, sp.id);
  });
  return run;
}
