// 고정 장면 (?screen=map&scene=…): 씨앗을 정한 판을 몇 칸 걸어 둔 지도예요.
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
  return run;
}
