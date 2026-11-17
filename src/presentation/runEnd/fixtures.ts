// 고정 장면 (?screen=runEnd&scene=…). 실제 정원 · 판 규칙으로 끝난 판을 만들어요. 화면 확인용이에요.
import { C } from "../../core/data";
import { grantBattle, newGarden, type Garden } from "../../core/garden";
import { Run } from "../../core/run";
import type { RunRecord } from "../../session/game";

interface RunEndSetup {
  victory: boolean;
  /** 이 판에서 이긴 전투 (정원 경험) */
  wins: ("normal" | "elite" | "boss")[];
  /** 정원이 이미 지나온 판 수 (0이면 첫 판) */
  runs: number;
  /** 판에서 배운 카드 수 */
  learned: number;
}

export const RUN_ENDS: Record<string, RunEndSetup> = {
  /** 보스를 이기고 셋 다 레벨이 오름 */
  victory: { victory: true, wins: ["normal", "normal", "elite", "normal", "normal", "boss"], runs: 3, learned: 4 },
  /** 첫 판 전멸: 남은 것 안내 */
  first: { victory: false, wins: ["normal", "normal", "normal", "normal"], runs: 0, learned: 1 },
  /** 둘째 판 이후 패배, 거의 아무것도 못 함 */
  defeat: { victory: false, wins: ["normal"], runs: 2, learned: 0 },
};

export const DEFAULT_RUN_END = "victory";

export function runEndRecord(name?: string): RunRecord {
  const setup = RUN_ENDS[name ?? DEFAULT_RUN_END] ?? RUN_ENDS[DEFAULT_RUN_END];
  const party = C.default_party as string[];
  const before: Garden = { ...newGarden(7, party), runs: setup.runs };
  const run = new Run({ seed: 7, frontId: party[0], garden: before, adult: false, unlockAll: false });
  let after = before;
  for (const tier of setup.wins) after = grantBattle(after, party, tier);
  // 지나온 칸: 이긴 전투 수 + (졌으면) 진 전투 하나, 층은 그만큼
  const fights = setup.wins.length + (setup.victory ? 0 : 1);
  const nodes = [...run.map.values()].filter((n) => n.type === "battle").slice(0, fights);
  run.visited = nodes.map((n) => n.id);
  run.fights = fights;
  run.current = setup.victory ? run.map.get("boss") ?? null : nodes.at(-1) ?? null;
  const pool = run.rewardPool("common");
  for (let i = 0; i < setup.learned; i++) {
    const card = pool[i % pool.length];
    run.addCard(card.id, run.learnersOf(card.id)[0]?.id ?? party[0]);
  }
  run.gold = setup.victory ? 212 : 87;
  return { run, victory: setup.victory, before, after: { ...after, runs: setup.runs + 1 } };
}
