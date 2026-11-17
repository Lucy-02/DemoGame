// 막 넘기기: 마지막 막이 아닌 보스를 이긴 뒤의 흐름
import { describe, expect, it } from "vitest";
import { FLOORS, RUN_SAVE_VERSION, Run } from "../core/run";
import { C } from "../core/data";
import { deepStartOpen, newGarden } from "../core/garden";
import { RunSession } from "./run";

describe("막 넘기기", () => {
  it("마지막 막이 아니면 보스를 이긴 뒤 보상을 받고 다음 막 지도로 가요", () => {
    const r = new Run({ seed: 3, frontId: "fire_fox", adult: false, unlockAll: false, party: ["fire_fox", "glass_salamander", "magma_ibex"], acts: 2 });
    r.current = [...r.map.values()].find((n) => n.floor === FLOORS)!;
    const s = RunSession.restore({ version: RUN_SAVE_VERSION, run: r.save(), phase: { kind: "map" } });
    s.enter("boss");
    s.finishBattle({ won: true, spirits: s.run.spirits.map((x) => ({ id: x.id, hp: x.hp, downed: false })) });
    expect(s.phase.kind).toBe("reward");
    expect(s.run.act).toBe(2);
    expect(s.run.bossDefeated).toBe(false);
    s.finishReward();
    expect(s.phase.kind).toBe("map");
    expect(s.run.reachable().every((n) => n.floor === 1)).toBe(true);
  });
});

describe("3막에서 출발 (0108)", () => {
  const party = ["fire_fox", "glass_salamander", "magma_ibex"];

  it("출발 묶음을 차례로 고른 다음 3막 지도로 가요", () => {
    const s = RunSession.start({ seed: 3, frontId: "fire_fox", adult: true, unlockAll: false, party, acts: 5, startAct: C.deep_start.act });
    const b = C.deep_start.bundle;
    expect(s.run.act).toBe(C.deep_start.act);
    expect(C.acts[s.run.act - 1].elements).toContain(s.run.strongElement);
    let n = 0;
    while (s.phase.kind === "reward") {
      n++;
      s.finishReward();
    }
    expect(n).toBe(b.battle + b.elite);
    expect(s.phase.kind).toBe("map");
    expect(s.run.reachable().every((x) => x.floor === 1)).toBe(true);
    expect(s.run.gold).toBeGreaterThanOrEqual(C.start_gold + b.gold);
  });

  it("고르다 만 출발 묶음은 저장에서 이어져요", () => {
    const s = RunSession.start({ seed: 3, frontId: "fire_fox", adult: true, unlockAll: false, party, acts: 5, startAct: C.deep_start.act });
    s.finishReward();
    const left = { ...s.run.bundleLeft };
    const again = RunSession.restore(JSON.parse(JSON.stringify(s.save())));
    expect(again.phase.kind).toBe("reward");
    expect(again.run.bundleLeft).toEqual(left);
  });

  it("출전 정령이 모두 성체 이상일 때만 열려요", () => {
    const g = newGarden(1, party);
    expect(deepStartOpen(g, party)).toBe(false);
    const grown = { ...g, spirits: g.spirits.map((x) => ({ ...x, stage: "adult" as const })) };
    expect(deepStartOpen(grown, party)).toBe(true);
    expect(deepStartOpen({ ...grown, spirits: [{ ...grown.spirits[0], stage: "baby" as const }, ...grown.spirits.slice(1)] }, party)).toBe(false);
  });
});
