// 전투 보상 구조 (결정 0049): 정령마다 1장 · 넘기기 골드 · 정예 장비 · 보스 장비 3택 · 카드 빼기 누진
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { C, EQUIPMENT, cardDef } from "./data";
import { Run } from "./run";
import type { EquipDef } from "./types";

/** 장비 규칙 시험은 실제 장비 데이터를 비우고 시험용 장비만 써요 */
const REAL_EQUIPMENT = [...EQUIPMENT];
const onlyTestEquipment = () => {
  beforeEach(() => void EQUIPMENT.splice(0, EQUIPMENT.length));
  afterEach(() => void EQUIPMENT.splice(0, EQUIPMENT.length, ...REAL_EQUIPMENT));
};

const run = (seed = 1, unlockAll = false) => new Run({ seed, frontId: "fire_fox", adult: false, unlockAll });

const ELITE_ANY: EquipDef = { id: "test_elite_any", owner: null, rarity: "generic", tiers: [{ stats: [{ stat: "power", op: "add", value: 1 }] }] };
const ELITE_CAT: EquipDef = { id: "test_elite_cat", owner: "mist_cat", rarity: "exclusive", tiers: [{ stats: [{ stat: "focus", op: "add", value: 1 }] }] };
const ELITE_STAR: EquipDef = { id: "test_elite_star", owner: "star_spirit", rarity: "exclusive", tiers: [{}] };
const BOSS: EquipDef[] = ["a", "b", "c", "d"].map((k) => ({ id: `test_boss_${k}`, owner: null, rarity: "boss", tiers: [{}] }));

describe("전투 보상: 정령마다 1장 (0049 1절)", () => {
  it("파티 순서대로 정령마다 자기 카드 1장, 겹치지 않음", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const r = run(seed);
      const reward = r.rollBattleReward("battle");
      expect(reward.cards.map((c) => c.owner)).toEqual(r.spirits.map((s) => s.id));
      expect(new Set(reward.cards.map((c) => c.cardId)).size).toBe(reward.cards.length);
      for (const c of reward.cards) {
        const def = cardDef(c.cardId);
        expect(def.obtain ?? "reward").toBe("reward");
        expect(r.isUnlocked(def)).toBe(true);
        expect(r.learnersOf(c.cardId).map((s) => s.id)).toContain(c.owner);
      }
    }
  });

  it("전용 카드가 있는 정령은 전용 카드만, 없는 정령은 같은 속성의 주인 없는 카드", () => {
    const r = run(3, true);
    for (const c of r.rollBattleReward("elite").cards) {
      const def = cardDef(c.cardId);
      if (c.owner === "glass_salamander") expect(def.spirit).toBe("glass_salamander");
      else expect(def.spirit).toBeUndefined();
    }
  });

  it("쓰러진 정령의 카드도 나와요 (필러 3)", () => {
    const r = run(5);
    r.spirits[1].hp = 0;
    expect(r.rollBattleReward("battle").cards.map((c) => c.owner)).toContain(r.spirits[1].id);
  });

  it("골드는 만들 때 들어가고, 보스 골드는 없어요 (0049 3절)", () => {
    const r = run(7);
    const before = r.gold;
    const reward = r.rollBattleReward("battle");
    const [lo, hi] = C.reward.gold_normal;
    expect(reward.gold).toBeGreaterThanOrEqual(lo);
    expect(reward.gold).toBeLessThanOrEqual(hi);
    expect(r.gold).toBe(before + reward.gold);
    expect("gold_boss" in C.reward).toBe(false);
  });
});

describe("고르기 적용", () => {
  it("카드 받기: 정해진 주인이 배우고, 한 번만", () => {
    const r = run(9);
    const reward = r.rollBattleReward("battle");
    const pick = reward.cards[2];
    const n = r.deck.length;
    r.takeRewardCard(reward, pick.cardId);
    expect(r.deck.length).toBe(n + 1);
    expect(r.deck.at(-1)).toMatchObject({ cardId: pick.cardId, owner: pick.owner });
    expect(() => r.takeRewardCard(reward, reward.cards[0].cardId)).toThrow();
    expect(() => r.skipRewardCards(reward)).toThrow();
  });

  it("넘기기: 골드만 받고 덱은 그대로", () => {
    const r = run(11);
    const reward = r.rollBattleReward("battle");
    const gold = r.gold;
    const n = r.deck.length;
    r.skipRewardCards(reward);
    expect(r.gold).toBe(gold + C.reward.skip_gold);
    expect(reward.skipGold).toBe(C.reward.skip_gold);
    expect(r.deck.length).toBe(n);
  });
});

describe("정예 장비 (0048 1절 · 0051)", () => {
  onlyTestEquipment();

  it("장비 데이터가 없으면 정예도 장비 없이", () => {
    const reward = run(1).rollBattleReward("elite");
    expect(reward.equipment).toBeUndefined();
    expect(reward.equipDone).toBe(true);
  });

  it("일반 전투에는 장비가 없어요", () => {
    EQUIPMENT.push(ELITE_ANY);
    expect(run(1).rollBattleReward("battle").equipment).toBeUndefined();
  });

  it("정예는 파티가 받을 수 있는 장비 하나, 고른 정령이 이번 런 동안 지녀요", () => {
    EQUIPMENT.push(ELITE_STAR, ELITE_ANY);
    const r = run(2);
    const reward = r.rollBattleReward("elite");
    expect(reward.equipment).toEqual({ equipId: "test_elite_any" });
    expect(reward.equipDone).toBe(false);
    r.giveRewardEquipment(reward, "glass_salamander");
    expect(r.spirit("glass_salamander").equipment).toEqual([{ id: "test_elite_any", resonance: 1, from: "run" }]);
    expect(reward.equipDone).toBe(true);
    expect(() => r.giveRewardEquipment(reward, "fire_fox")).toThrow();
  });

  it("전용 장비는 그 정령만 받아요", () => {
    EQUIPMENT.push(ELITE_CAT);
    const r = run(4);
    expect(r.equipTakers("test_elite_cat").map((s) => s.id)).toEqual(["mist_cat"]);
    expect(() => r.giveEquipment("test_elite_cat", "fire_fox")).toThrow();
    r.giveEquipment("test_elite_cat", "mist_cat");
    expect(r.spirit("mist_cat").equipment).toHaveLength(1);
  });

  it("보스 장비는 3개까지 서로 다르게", () => {
    EQUIPMENT.push(...BOSS, ELITE_ANY);
    const picks = run(6).rollBossEquipment();
    expect(picks).toHaveLength(3);
    expect(new Set(picks).size).toBe(3);
    for (const id of picks) expect(id.startsWith("test_boss_")).toBe(true);
  });
});

describe("장비 칸 · 바꿔 끼기 · 대표 카드 변형 (0055 · 0056)", () => {
  const SPEAR: EquipDef = {
    id: "test_spear", owner: "fire_fox", rarity: "exclusive", tiers: [{}, {}],
    signature: { card: "ember_scatter", techniques: { burst: ["backfire", "ignite"], spread: ["fire_storm", "fire_storm"] } },
  };
  const OTHER: EquipDef = { id: "test_other", owner: null, rarity: "generic", tiers: [{}] };
  onlyTestEquipment();

  it("칸이 꽉 차면 하나를 내려놓아야 받아요. 각성체는 둘까지 지녀요", () => {
    EQUIPMENT.push(ELITE_ANY, OTHER);
    const r = run(3);
    r.giveEquipment("test_elite_any", "fire_fox");
    expect(r.needsReplace("test_other", "fire_fox")).toBe(true);
    expect(() => r.giveEquipment("test_other", "fire_fox")).toThrow();
    r.giveEquipment("test_other", "fire_fox", "test_elite_any");
    expect(r.spirit("fire_fox").equipment.map((e) => e.id)).toEqual(["test_other"]);
    r.spirit("fire_fox").stage = "awakened";
    expect(r.needsReplace("test_elite_any", "fire_fox")).toBe(false);
    r.giveEquipment("test_elite_any", "fire_fox");
    expect(r.spirit("fire_fox").equipment).toHaveLength(2);
  });

  it("같은 장비를 또 얻으면 이번 런 동안 공명이 올라요", () => {
    EQUIPMENT.push(SPEAR);
    const r = run(3);
    r.giveEquipment("test_spear", "fire_fox");
    expect(r.needsReplace("test_spear", "fire_fox")).toBe(false);
    r.giveEquipment("test_spear", "fire_fox");
    expect(r.spirit("fire_fox").equipment).toEqual([{ id: "test_spear", resonance: 1, from: "run", runBonus: 1 }]);
  });

  it("전용 무기는 대표 카드 한 장을 갈래의 기술로 바꿔요. 덱 장수는 그대로예요", () => {
    EQUIPMENT.push(SPEAR);
    const r = run(3);
    const fox = r.spirit("fire_fox");
    const count = (id: string) => r.battleDeck().filter((c) => c.owner === "fire_fox" && c.cardId === id).length;
    r.giveEquipment("test_spear", "fire_fox");
    // 갈래가 없으면(유체) 바뀌지 않아요
    expect(r.battleDeck()).toEqual(r.deck);
    fox.branch = "burst";
    expect([count("ember_scatter"), count("backfire")]).toEqual([1, 1]);
    expect(r.battleDeck()).toHaveLength(r.deck.length);
    expect(r.battleDeck().map((c) => c.uid)).toEqual(r.deck.map((c) => c.uid));
    // 공명이 오르면 기술 카드가 자라요
    r.giveEquipment("test_spear", "fire_fox");
    expect([count("ember_scatter"), count("backfire"), count("ignite")]).toEqual([1, 0, 1]);
    // 갈래가 다르면 기술이 달라요
    fox.branch = "spread";
    expect(count("fire_storm")).toBe(1);
    // 런의 덱은 바뀌지 않아요
    expect(r.deck.filter((c) => c.cardId === "ember_scatter")).toHaveLength(2);
  });

  it("정예 풀에는 범용과 전용 무기, 보스 풀에는 보스 장비만", () => {
    EQUIPMENT.push(ELITE_ANY, SPEAR, ...BOSS);
    const r = run(3);
    expect(r.equipPool("elite").map((e) => e.id).sort()).toEqual(["test_elite_any", "test_spear"]);
    expect(r.equipPool("boss").map((e) => e.id)).toEqual(BOSS.map((e) => e.id));
  });
});

describe("상점 카드 빼기 누진 (0049 4절)", () => {
  it("쓸 때마다 값이 올라요", () => {
    const r = run(8);
    r.gold = 1000;
    const p0 = r.removePrice();
    expect(p0).toBe(C.shop.remove_price);
    r.buyRemoval(r.deck[0].uid);
    expect(r.gold).toBe(1000 - p0);
    expect(r.removePrice()).toBe(p0 + C.shop.remove_price_step);
  });

  it("골드가 모자라면 못 빼요", () => {
    const r = run(8);
    r.gold = 0;
    const n = r.deck.length;
    expect(() => r.buyRemoval(r.deck[0].uid)).toThrow();
    expect(r.deck.length).toBe(n);
  });
});
