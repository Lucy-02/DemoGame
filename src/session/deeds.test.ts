// 자람 조건 세기: 전투 이벤트 → 정령별 수 → 정원 (0021 · 0045)
import { describe, expect, it } from "vitest";
import { GROWTH } from "../core/data";
import { newGarden } from "../core/garden";
import { Run } from "../core/run";
import { BattleSession } from "./battle";
import { tallyDeeds } from "./deeds";
import { GardenSession } from "./garden";

describe("자람 조건 세기", () => {
  it("재생 중인 카드의 주인에게 준 피해와 빙결을, 맞은 정령과 벽을 세운 정령에게 막은 피해를 세요", () => {
    const t = tallyDeeds({}, [
      { k: "damage", ref: { side: "e", uid: 1 }, amount: 7, blocked: 2, by: "fire_fox" },
      // 카드 밖에서 생긴 피해(화상)는 누구의 것도 아니에요
      { k: "damage", ref: { side: "e", uid: 1 }, amount: 3, blocked: 0 },
      { k: "freeze", uid: 1, by: "mist_cat" },
      { k: "freeze", uid: 1 },
      { k: "damage", ref: { side: "s", id: "fire_fox" }, amount: 1, blocked: 4, wall: 5, keeper: "glass_salamander" },
      { k: "damage", ref: { side: "s", id: "glass_salamander" }, amount: 0, blocked: 6 },
    ]);
    expect(t).toEqual({ fire_fox: { dealt: 7, blocked: 4 }, mist_cat: { freeze: 1 }, glass_salamander: { blocked: 11 } });
  });

  it("전투 세션은 끝난 전투의 결과에 센 수를 실어요", () => {
    const run = new Run({ seed: 7, frontId: "fire_fox", adult: false, unlockAll: false, party: ["fire_fox", "mist_cat", "glass_salamander"] });
    const s = new BattleSession(run, run.pickEncounter("battle").enemies);
    for (let i = 0; i < 60 && !s.over; i++) {
      for (const c of [...s.battle.hand]) {
        if (!s.battle.canPlay(c).ok) continue;
        const e = s.battle.aliveEnemies()[0];
        const need = s.battle.needsTarget(c);
        s.dispatch({ kind: "play", uid: c.uid, target: need === "enemy" && e ? { side: "e", uid: e.uid } : need === "ally" ? { side: "s", id: c.owner } : undefined });
      }
      s.dispatch({ kind: "endTurn" });
    }
    const deeds = s.outcome().deeds!;
    const dealt = Object.values(deeds).reduce((a, r) => a + (r.dealt ?? 0), 0);
    expect(dealt).toBeGreaterThan(0);
    // 카드로 준 피해는 적 HP 언저리예요 (쓰러뜨린 타격의 넘친 피해도 세요)
    expect(dealt).toBeLessThan(s.battle.enemies.reduce((a, e) => a + e.maxHp, 0) * 2);
  });

  it("정원은 지금 진화 조건과 종류가 같은 것만 쌓아요", () => {
    const g = newGarden(1, ["fire_fox", "glass_salamander"]);
    const adult = { ...g, spirits: g.spirits.map((s) => ({ ...s, stage: "adult" as const, exp: GROWTH.levels[5] })) };
    const session = new GardenSession(adult);
    session.dispatch({ kind: "deeds", tally: { fire_fox: { dealt: 40, blocked: 9 }, glass_salamander: { dealt: 12, blocked: 30 }, mist_cat: { freeze: 2 } } });
    expect(session.state.spirits.map((s) => s.deed)).toEqual([40, 30]);
    // 유체는 자람 조건이 없어서 쌓이지 않아요
    const baby = new GardenSession(g);
    baby.dispatch({ kind: "deeds", tally: { fire_fox: { dealt: 40 } } });
    expect(baby.state.spirits[0].deed).toBe(0);
  });
});
