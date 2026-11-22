// 막 넘기기: 마지막 막이 아닌 보스를 이긴 뒤의 흐름
import { describe, expect, it } from "vitest";
import { GROWTH } from "../core/data";
import { FLOORS, RUN_SAVE_VERSION, Run } from "../core/run";
import { RunSession } from "./run";

describe("막 넘기기", () => {
  it("마지막 막이 아니면 보스를 이긴 뒤 보상을 받고 다음 막 지도로 가요", () => {
    const r = new Run({ seed: 3, frontId: "fire_fox", adult: false, unlockAll: false, party: ["fire_fox", "glass_salamander", "magma_ibex"], acts: 2 });
    r.current = [...r.map.values()].find((n) => n.floor === FLOORS)!;
    const s = RunSession.restore({ version: RUN_SAVE_VERSION, run: r.save(), phase: { kind: "map" } });
    s.enter("boss");
    s.finishBattle({ won: true, spirits: s.run.spirits.map((x) => ({ id: x.id, hp: x.hp, downed: false })) });
    expect(s.phase.kind).toBe("reward");
    // 막 사이 보상에도 보스전으로 자란 몫이 실려요 (0157)
    expect(s.phase.kind === "reward" && s.phase.reward.growth?.fire_fox.expAfter).toBe(GROWTH.exp.boss);
    expect(s.run.act).toBe(2);
    expect(s.run.bossDefeated).toBe(false);
    s.finishReward();
    expect(s.phase.kind).toBe("map");
    expect(s.run.reachable().every((n) => n.floor === 1)).toBe(true);
  });
});
