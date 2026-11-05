import { describe, expect, it } from "vitest";
import { CARDS, GROWTH } from "./data";
import {
  addDeed, canEvolve, episodesOpen, evolve, feed, gardenSpirit, grantBattle, isFinalStage, levelOf, newGarden,
  seeEpisode, todos, unlockKeys, type Garden,
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
    const all = unlockKeys(grantBattle(evolve(evolve(evolve(withExp(g, GROWTH.levels[3]), "fire_fox"), "glass_salamander"), "mist_cat"), PARTY, "boss"));
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
