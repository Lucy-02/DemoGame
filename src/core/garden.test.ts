import { describe, expect, it } from "vitest";
import { C, CARDS, GROWTH, SPIRITS, enemyDef, partyScale, scaleEnemy } from "./data";
import {
  addDeed, canEvolve, endRun, episodesOpen, evolve, feed, gardenSpirit, grantBattle, isFinalStage, join, joinOffer, keepEquipment, levelOf, newGarden,
  seeEpisode, startGarden, toRunSpirit, todos, unlockKeys, type Garden,
} from "./garden";
import { Run } from "./run";
import { baseStat, maxHpOf } from "./stats";

const PARTY = ["fire_fox", "glass_salamander", "mist_cat"];
const fox = (g: Garden) => gardenSpirit(g, "fire_fox");
/** 경험을 n까지 채워요 */
const withExp = (g: Garden, exp: number): Garden => ({ ...g, spirits: g.spirits.map((s) => ({ ...s, exp })) });

describe("정원 (0021)", () => {
  it("레벨은 누적 경험 문턱으로 정해요", () => {
    expect(GROWTH.levels.map(levelOf)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(levelOf(GROWTH.levels[1] - 1)).toBe(1);
  });

  it("이긴 전투는 출전한 셋 모두에게 경험과 재료를 줘요", () => {
    const g = grantBattle(newGarden(1), PARTY, "elite");
    expect(g.spirits.map((s) => s.exp)).toEqual([GROWTH.exp.elite, GROWTH.exp.elite, GROWTH.exp.elite]);
    expect(g.material).toBe(GROWTH.material.elite);
    expect(grantBattle(g, PARTY, "boss").act1Boss).toBe(true);
  });

  it("성체는 레벨만, 각성체는 레벨과 자람 조건이 모두 돼야 키울 수 있어요", () => {
    let g = newGarden(1);
    expect(canEvolve(fox(g))?.ok).toBe(false);
    g = withExp(g, GROWTH.levels[3]);
    expect(canEvolve(fox(g))).toMatchObject({ ok: true, evo: { to: "adult" } });
    g = evolve(g, "fire_fox");
    expect(fox(g).stage).toBe("adult");

    g = withExp(g, GROWTH.levels[5]);
    expect(canEvolve(fox(g))).toMatchObject({ level: true, deed: false, ok: false });
    expect(evolve(g, "fire_fox")).toBe(g);
    g = addDeed(g, "fire_fox", "freeze", 99);
    expect(fox(g).deed).toBe(0);
    g = addDeed(g, "fire_fox", "dealt", 150);
    g = evolve(g, "fire_fox");
    expect(fox(g)).toMatchObject({ stage: "awakened", deed: 0 });
    expect(isFinalStage(fox(g))).toBe(true);
  });

  it("해금 키: 레벨·단계·첫 성체·보스", () => {
    let g = withExp(newGarden(1), GROWTH.levels[2]);
    const keys = unlockKeys(g);
    expect(keys.has("fire_fox_lv3")).toBe(true);
    expect(keys.has("any_lv3")).toBe(true);
    expect(keys.has("any_adult")).toBe(false);
    g = evolve(withExp(g, GROWTH.levels[3]), "mist_cat");
    expect([...unlockKeys(g)].filter((k) => k.endsWith("adult"))).toEqual(["mist_cat_adult", "any_adult"]);
    // 데이터의 해금 키는 모두 정원이 만들 수 있는 키예요
    let full = withExp(newGarden(1, SPIRITS.map((s) => s.id)), GROWTH.levels[3]);
    for (const s of SPIRITS) full = evolve(full, s.id);
    const all = unlockKeys(grantBattle(full, PARTY, "boss"));
    expect(CARDS.filter((c) => !all.has(c.unlock)).map((c) => c.id)).toEqual([]);
  });

  it("할 일: 키우기 · 안 본 해금 · 열린 에피소드", () => {
    let g = withExp(newGarden(1), GROWTH.levels[3]);
    expect(todos(fox(g)).map((t) => t.kind)).toEqual(["evolve", "unlock", "unlock"]);
    g = { ...g, spirits: g.spirits.map((s) => ({ ...s, seen: ["fire_fox_lv2", "fire_fox_lv3"], affinity: GROWTH.episodes[0].affinity })) };
    expect(todos(fox(g))).toEqual([{ kind: "evolve", to: "adult" }, { kind: "episode" }]);
    g = seeEpisode(g, "fire_fox");
    expect(todos(fox(g))).toEqual([{ kind: "evolve", to: "adult" }]);
    // 유리 도롱뇽 성체 카드(유리 성채)도 안 본 해금이면 할 일이에요
    const sal = { ...gardenSpirit(g, "glass_salamander"), stage: "adult" as const, seen: ["glass_salamander_lv2", "glass_salamander_lv3"] };
    expect(todos(sal).filter((t) => t.kind === "unlock")).toEqual([{ kind: "unlock", key: "glass_salamander_adult" }]);
  });

  it("먹이기는 재료를 쓰고 호감도를 올려요. 에피소드는 단계도 필요해요", () => {
    let g = { ...newGarden(1), material: 10 };
    g = feed(g, "mist_cat");
    const cat = gardenSpirit(g, "mist_cat");
    expect(g.material).toBe(10 - GROWTH.feed.cost);
    expect(cat.affinity).toBe(GROWTH.feed.affinity);
    expect(feed({ ...g, material: 0 }, "mist_cat").material).toBe(0);
    const high = { ...cat, affinity: 999 };
    expect(episodesOpen(high)).toBe(1); // 2화는 성체부터
    expect(episodesOpen({ ...high, stage: "adult" })).toBe(2);
  });

  it("판으로: 단계·레벨·성격을 정원에서 읽어요", () => {
    let g = evolve(withExp(newGarden(1), GROWTH.levels[5]), "glass_salamander");
    g = { ...g, spirits: g.spirits.map((s) => ({ ...s, episodes: 2 })) };
    const run = new Run({ seed: 1, frontId: "glass_salamander", garden: g, adult: false, unlockAll: false });
    const sal = run.spirit("glass_salamander");
    expect(sal).toMatchObject({ stage: "adult", level: 6, personality: gardenSpirit(g, "glass_salamander").personality });
    // 수호: HP 32 + 레벨 HP 10 + 단계 HP 6, 가드 13 + 2 (성격 보정 전)
    expect(sal.hp).toBe(maxHpOf(sal));
    expect(baseStat({ ...sal, personality: "brave" }, "guard")).toBe(15);
    expect(run.isUnlocked(CARDS.find((c) => c.unlock === "glass_salamander_lv3")!)).toBe(true);
    expect(run.isUnlocked(CARDS.find((c) => c.unlock === "fire_fox_adult")!)).toBe(false);
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

  it("첫 보스를 가라앉히면 셋째가 깃들고, 다시 가라앉혀도 더 주지 않아요", () => {
    let g = endRun(startGarden(7));
    g = join(g, joinOffer(g)[0]);
    const party = g.spirits.map((s) => s.id);
    g = grantBattle(g, party, "boss");
    expect(joinOffer(g)).toHaveLength(2);
    g = join(g, joinOffer(g)[1]);
    expect(g.spirits).toHaveLength(3);
    expect(joinOffer(grantBattle(g, party, "boss"))).toEqual([]);
  });

  it("출전하지 않은 정령은 경험을 받지 않아요", () => {
    const g = grantBattle(newGarden(1), ["fire_fox"], "normal");
    expect(g.spirits.map((s) => s.exp)).toEqual([GROWTH.exp.normal, 0, 0]);
  });

  it("정원의 정령만큼 떠나고, 인원이 적으면 적이 약해져요", () => {
    const solo = new Run({ seed: 1, frontId: startGarden(7).spirits[0].id, garden: startGarden(7), adult: false, unlockAll: false });
    expect(solo.spirits).toHaveLength(1);
    expect(solo.enemyScale()).toEqual(partyScale(1));
    expect(new Run({ seed: 1, frontId: "fire_fox", garden: newGarden(1), adult: false, unlockAll: false }).enemyScale()).toBeUndefined();
    const boss = enemyDef("grimbark");
    const weak = scaleEnemy(boss, { hp: 0.5, dmg: 0.5 });
    expect(weak.hp).toBe(boss.hp / 2);
    const hit = boss.pattern[0].actions[0];
    expect(weak.pattern[0].actions[0]).toMatchObject({ type: "attack", dmg: hit.type === "attack" ? hit.dmg / 2 : 0 });
    expect(weak.phase2?.turnStartBlock).toBe(boss.phase2!.turnStartBlock / 2);
    expect(enemyDef("grimbark")).toBe(boss);
  });
});

describe("장비 남기기 (0056)", () => {
  const withStage = (stage: "baby" | "adult" | "awakened") => {
    const g = newGarden(1);
    return { ...g, spirits: g.spirits.map((s) => (s.id === "fire_fox" ? { ...s, stage } : s)) };
  };
  const foxRun = (g: ReturnType<typeof newGarden>) => toRunSpirit(gardenSpirit(g, "fire_fox"));

  it("고른 장비만 남고, 처음 남긴 장비는 공명 1이에요", () => {
    const g = withStage("awakened");
    const fox = foxRun(g);
    fox.equipment = [{ id: "fox_spear", resonance: 1, from: "run" }, { id: "bone_sword", resonance: 1, from: "run", runBonus: 1 }];
    const kept = keepEquipment(g, [fox], { fire_fox: ["bone_sword"] });
    expect(gardenSpirit(kept, "fire_fox").equipment).toEqual([{ id: "bone_sword", resonance: 1 }]);
    expect(gardenSpirit(g, "fire_fox").equipment).toBeUndefined();
  });

  it("남겼던 장비를 다시 남기면 공명이 오르고, 단계 상한에서 멈춰요", () => {
    let g = withStage("adult");
    for (const expected of [1, 2, 2]) {
      const fox = foxRun(g);
      if (!fox.equipment.length) fox.equipment = [{ id: "fox_spear", resonance: 1, from: "run" }];
      g = keepEquipment(g, [fox], { fire_fox: ["fox_spear"] });
      expect(gardenSpirit(g, "fire_fox").equipment).toEqual([{ id: "fox_spear", resonance: expected }]);
    }
  });

  it("남기지 않으면 사라지고, 판에 나가지 않은 정령의 장비는 그대로예요", () => {
    let g = withStage("adult");
    g = { ...g, spirits: g.spirits.map((s) => (s.id === "mist_cat" ? { ...s, equipment: [{ id: "cat_fan", resonance: 1 }] } : s)) };
    const fox = foxRun(g);
    fox.equipment = [{ id: "fox_spear", resonance: 1, from: "run" }];
    const after = keepEquipment(g, [fox], {});
    expect(gardenSpirit(after, "fire_fox").equipment).toEqual([]);
    expect(gardenSpirit(after, "mist_cat").equipment).toEqual([{ id: "cat_fan", resonance: 1 }]);
  });

  it("지니지 않은 장비는 남길 수 없어요", () => {
    const g = withStage("adult");
    expect(() => keepEquipment(g, [foxRun(g)], { fire_fox: ["fox_spear"] })).toThrow();
  });
});
