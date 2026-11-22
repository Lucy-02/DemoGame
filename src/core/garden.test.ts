import { describe, expect, it } from "vitest";
import { C, PERSONALITIES, enemyDef, partyScale, scaleEnemy } from "./data";
import {
  choosePersonality, clearedLines, endRun, toRunSpirit, gardenSpirit, grantBattle, grantMidJoin, joinCandidates, defaultFront, setFront, join, joinOffer, newGarden, rerollsOf,
  startGarden, type Garden, type RunOutcome,
} from "./garden";
import { Run } from "./run";
import { maxHpOf } from "./stats";

/** 이 정원의 정령이 모두 나간 판 하나 */
const outcome = (g: Garden, victory: boolean, ids = g.spirits.map((s) => s.id)): RunOutcome => ({
  party: g.spirits.filter((s) => ids.includes(s.id)).map((s) => ({ id: s.id, personality: s.personality })), victory,
});

describe("정원에 남는 것 (0157)", () => {
  it("정원의 정령은 줄과 성격만 남기고, 판으로는 늘 유체 Lv 1로 떠나요", () => {
    const g = newGarden(1);
    expect(Object.keys(g.spirits[0]).sort()).toEqual(["id", "personality"]);
    const rs = toRunSpirit(g.spirits[0]);
    expect(rs).toMatchObject({ id: g.spirits[0].id, stage: "baby", level: 1, exp: 0, personality: g.spirits[0].personality, equipment: [] });
    expect(rs.hp).toBe(maxHpOf(rs));
  });

  it("완주하면 출전한 정령마다 그 판의 성격이 열리고, 지면 열리지 않아요", () => {
    const g = newGarden(1);
    const lost = endRun(g, outcome(g, false));
    expect(lost.spirits.every((s) => s.cleared === undefined)).toBe(true);
    expect(clearedLines(lost)).toBe(0);
    const won = endRun(g, outcome(g, true, ["fire_fox", "mist_cat"]));
    expect(gardenSpirit(won, "fire_fox").cleared).toEqual([gardenSpirit(g, "fire_fox").personality]);
    expect(gardenSpirit(won, "glass_salamander").cleared).toBeUndefined();
    expect(clearedLines(won)).toBe(2);
    // 같은 성격으로 또 완주해도 한 번만 적혀요
    const again = endRun(won, { party: [{ id: "fire_fox", personality: gardenSpirit(g, "fire_fox").personality }], victory: true });
    expect(gardenSpirit(again, "fire_fox").cleared).toHaveLength(1);
  });

  it("성격은 판마다 새로 정해지고(출전한 정령만), 같은 정원이면 같은 성격이에요", () => {
    const ids = PERSONALITIES.map((p) => p.id);
    let g = newGarden(3);
    const seen = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const before = g;
      g = endRun(g, outcome(g, false, ["fire_fox"]));
      expect(endRun(before, outcome(before, false, ["fire_fox"]))).toEqual(g);
      expect(ids).toContain(gardenSpirit(g, "fire_fox").personality);
      expect(gardenSpirit(g, "mist_cat").personality).toBe(gardenSpirit(before, "mist_cat").personality);
      seen.add(gardenSpirit(g, "fire_fox").personality);
    }
    expect(seen.size).toBeGreaterThan(3);
  });

  it("완주로 연 성격만 다음 판의 성격으로 고를 수 있어요", () => {
    const g = newGarden(1);
    const first = gardenSpirit(g, "fire_fox").personality;
    const won = endRun(g, outcome(g, true));
    const other = PERSONALITIES.map((p) => p.id).find((p) => p !== first && p !== gardenSpirit(won, "fire_fox").personality)!;
    expect(choosePersonality(won, "fire_fox", other)).toBe(won);
    const picked = choosePersonality({ ...won, spirits: won.spirits.map((s) => (s.id === "fire_fox" ? { ...s, personality: other } : s)) }, "fire_fox", first);
    expect(gardenSpirit(picked, "fire_fox").personality).toBe(first);
    expect(new Run({ seed: 1, frontId: "fire_fox", garden: picked, adult: false, unlockAll: false }).spirit("fire_fox").personality).toBe(first);
  });

  it("보상 다시 뽑기는 완주한 줄마다 하나, 상한까지예요", () => {
    const g = newGarden(1, C.start_pool as string[]);
    expect(rerollsOf(g)).toBe(0);
    const clear = (n: number): Garden => ({ ...g, spirits: g.spirits.map((s, i) => (i < n ? { ...s, cleared: [s.personality] } : s)) });
    expect([1, 2, 3, 4].map((n) => rerollsOf(clear(n)))).toEqual([1, 2, 3, Math.min(4, C.reward.reroll_max)]);
  });
});

describe("처음 세 마리 (0053)", () => {
  const POOL = C.start_pool as string[];

  it("새로 하기는 시작 풀의 정령 하나로 시작하고, 같은 시드면 같은 정령이에요", () => {
    const g = startGarden(7);
    expect(g.spirits).toHaveLength(1);
    expect(POOL).toContain(g.spirits[0].id);
    expect(startGarden(7)).toEqual(g);
    expect(new Set(Array.from({ length: 40 }, (_, i) => startGarden(i).spirits[0].id)).size).toBe(POOL.length);
  });

  it("첫 판을 끝내면(져도) 둘 중 하나를 골라 깃들여요. 둘째 판부터는 더 주지 않아요", () => {
    let g = startGarden(7);
    expect(joinOffer(g)).toEqual([]);
    g = endRun(g);
    const offer = joinOffer(g);
    expect(offer).toHaveLength(2);
    expect(offer).not.toContain(g.spirits[0].id);
    expect(joinOffer(g)).toEqual(offer);
    expect(join(g, g.spirits[0].id)).toBe(g);
    g = join(g, offer[0]);
    expect(g.spirits.map((s) => s.id)).toEqual([startGarden(7).spirits[0].id, offer[0]]);
    expect(joinOffer(g)).toEqual([]);
    expect(joinOffer(endRun(g))).toEqual([]);
  });

  it("첫 판 가운데 깃들면(0156) 판 끝에 더 주지 않고, 첫 판이 아니면 가운데 깃들기가 없어요", () => {
    let g = grantMidJoin(startGarden(7));
    expect(joinOffer(g)).toHaveLength(2);
    expect(grantMidJoin(g)).toBe(g);
    g = join(g, joinOffer(g)[0]);
    expect(g.spirits).toHaveLength(2);
    g = endRun(g);
    expect(g.runs).toBe(1);
    expect(joinOffer(g)).toEqual([]);
    const later = endRun(join(endRun(startGarden(7)), joinOffer(endRun(startGarden(7)))[0]));
    expect(grantMidJoin(later)).toBe(later);
  });

  it("첫 보스를 가라앉히면 셋째가 깃들고, 다시 가라앉혀도 더 주지 않아요", () => {
    let g = endRun(startGarden(7));
    g = join(g, joinOffer(g)[0]);
    g = grantBattle(g, "boss");
    expect(joinOffer(g)).toHaveLength(2);
    g = join(g, joinOffer(g)[1]);
    expect(g.spirits).toHaveLength(3);
    expect(joinOffer(grantBattle(g, "boss"))).toEqual([]);
  });

  it("깃들기 후보마다 성격이 따로 있고, 고르면 그 성격으로 깃들어요 (0076 12)", () => {
    for (let seed = 0; seed < 30; seed++) {
      const g = endRun(startGarden(seed));
      const cands = joinCandidates(g);
      expect(cands.map((c) => c.id)).toEqual(joinOffer(g));
      expect(new Set(cands.map((c) => c.personality)).size).toBe(cands.length);
      expect(joinCandidates(g)).toEqual(cands);
      for (const c of cands) expect(gardenSpirit(join(g, c.id), c.id).personality).toBe(c.personality);
    }
  });

  it("한 판에 깃들기가 둘이면 연달아 골라요: 첫째를 고른 뒤 남은 정령에서 다시 둘 (0076 10)", () => {
    const g0 = startGarden(7);
    const g = endRun(grantBattle(g0, "boss"));
    expect(g.joins).toBe(2);
    const first = joinOffer(g);
    const g1 = join(g, first[0]);
    const second = joinOffer(g1);
    expect(second).toHaveLength(2);
    expect(second).not.toContain(first[0]);
    const g2 = join(g1, second[0]);
    expect(g2.spirits).toHaveLength(3);
    expect(joinOffer(g2)).toEqual([]);
  });

  it("기본 앞열은 지난 판의 앞열이고, 없거나 가진 정령이 아니면 첫 정령이에요 (0076 14)", () => {
    const g = newGarden(1);
    expect(defaultFront(g)).toBe(g.spirits[0].id);
    const g2 = setFront(g, g.spirits[2].id);
    expect(defaultFront(g2)).toBe(g.spirits[2].id);
    expect(setFront(g2, "nobody")).toBe(g2);
  });

  it("정원의 정령만큼 떠나고, 인원이 적으면 적이 약해져요", () => {
    const solo = new Run({ seed: 1, frontId: startGarden(7).spirits[0].id, garden: startGarden(7), adult: false, unlockAll: false });
    expect(solo.spirits).toHaveLength(1);
    // 지도 위(길 전투)에서는 길 전투 피해 배율이 곱해져요 (0132)
    const path = (C.path_scale as { dmg: number }).dmg;
    expect(solo.enemyScale()).toEqual({ hp: partyScale(1)!.hp, dmg: partyScale(1)!.dmg * path });
    expect(new Run({ seed: 1, frontId: "fire_fox", garden: newGarden(1), adult: false, unlockAll: false }).enemyScale()).toEqual({ hp: 1, dmg: path });
    // 막별 세기 (0155): 3막에 들어서면 그 막의 배율이 곱해져요
    const act3 = (C.acts[2] as { scale?: { hp: number; dmg: number } }).scale!;
    const deep = new Run({ seed: 1, frontId: "fire_fox", garden: newGarden(1), adult: false, unlockAll: false });
    deep.nextAct();
    deep.nextAct();
    expect(deep.enemyScale()).toEqual({ hp: act3.hp, dmg: path * act3.dmg });
    const boss = enemyDef("grimbark");
    const weak = scaleEnemy(boss, { hp: 0.5, dmg: 0.5 });
    expect(weak.hp).toBe(boss.hp / 2);
    const hit = boss.pattern[0].actions[0];
    expect(weak.pattern[0].actions[0]).toMatchObject({ type: "attack", dmg: hit.type === "attack" ? hit.dmg / 2 : 0 });
    expect(weak.phase2?.turnStartBlock).toBe(boss.phase2!.turnStartBlock / 2);
    expect(enemyDef("grimbark")).toBe(boss);
  });
});

describe("한 번 짚는 안내 (0095)", () => {
  it("짚은 안내는 정원에 남고 두 번 적히지 않아요", async () => {
    const { hasGuide, markGuide, newGarden } = await import("./garden");
    const g = newGarden(1);
    expect(hasGuide(g, "break")).toBe(false);
    const seen = markGuide(g, "break");
    expect(hasGuide(seen, "break")).toBe(true);
    expect(markGuide(seen, "break")).toBe(seen);
  });
});
