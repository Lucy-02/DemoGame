import { describe, expect, it } from "vitest";
import { C, CARDS, GROWTH } from "./data";
import { newGarden } from "./garden";
import {
  addDeed, branchProgress, canEvolve, evolve, evolveChoices, freshSpirit, gainExp, isCardUnlocked, isFinalStage, levelOf, spiritAt, unlockKeys,
} from "./growth";
import { Run } from "./run";
import { baseStat, maxHpOf } from "./stats";

const PARTY = ["fire_fox", "glass_salamander", "mist_cat"];
const L = GROWTH.levels;
const fox = (exp = 0) => gainExp(freshSpirit("fire_fox", "brave"), exp);
const card = (unlock: string) => CARDS.find((c) => c.unlock === unlock)!;
/** 그 갈래를 여는 데 드는 만큼의 그 갈래 카드 */
const branchCards = (spirit: string, branch: string) => {
  const need = GROWTH.evolutions.find((e) => e.spirit === spirit && e.branch === branch)!.opens!.cards;
  return CARDS.filter((c) => c.spirit === spirit && c.branch === branch).slice(0, need).map((c) => c.id);
};

describe("판 안 성장 (0157)", () => {
  it("레벨은 그 판에서 쌓은 경험 문턱으로 정해요", () => {
    expect(L.map(levelOf)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(levelOf(L[1] - 1)).toBe(1);
  });

  it("떠날 때는 유체 Lv 1이고, 레벨이 오르면 최대 HP가 오른 만큼 지금 HP도 올라요", () => {
    const s = freshSpirit("fire_fox", "brave");
    expect(s).toMatchObject({ stage: "baby", level: 1, exp: 0, deed: 0, equipment: [] });
    expect(s.hp).toBe(maxHpOf(s));
    const hurt = { ...s, hp: s.hp - 5 };
    const up = gainExp(hurt, L[1]);
    expect(up.level).toBe(2);
    expect(maxHpOf(up)).toBe(maxHpOf(s) + GROWTH.level_hp);
    expect(up.hp).toBe(hurt.hp + GROWTH.level_hp);
    // 레벨이 그대로면 HP도 그대로
    expect(gainExp(hurt, 1).hp).toBe(hurt.hp);
  });

  it("성체는 레벨과 열린 갈래, 각성체는 레벨과 자람 조건이 모두 돼야 키울 수 있어요", () => {
    expect(canEvolve(fox())?.ok).toBe(false);
    const lv4 = fox(L[3]);
    expect(canEvolve(lv4)).toMatchObject({ level: true, open: false, ok: false });
    const got = branchCards("fire_fox", "burst");
    expect(canEvolve(lv4, got)).toMatchObject({ ok: true, evo: { to: "adult", branch: "burst" } });
    // 갈래 고르기는 갈래 없이 키울 수 없고, 잠긴 갈래로도 못 키워요
    expect(evolve(lv4, got)).toBe(lv4);
    expect(evolve(lv4, got, "spread")).toBe(lv4);
    const adult = evolve(lv4, got, "burst");
    expect(adult).toMatchObject({ stage: "adult", branch: "burst", deed: 0 });
    expect(baseStat(adult, "power")).toBe(baseStat(lv4, "power") + GROWTH.stage_main_bonus);

    const lv6 = gainExp(adult, L[5] - adult.exp);
    expect(canEvolve(lv6)).toMatchObject({ level: true, deed: false, ok: false });
    expect(evolve(lv6)).toBe(lv6);
    // 지금 진화 조건과 종류가 다른 것은 쌓이지 않아요
    expect(addDeed(lv6, "freeze", 99)).toBe(lv6);
    const awakened = evolve(addDeed(lv6, "dealt", 150));
    expect(awakened).toMatchObject({ stage: "awakened", deed: 0, branch: "burst" });
    expect(isFinalStage(awakened)).toBe(true);
  });

  it("갈래는 그 판에서 받은 그 갈래 카드 수로 열려요 (0058)", () => {
    const lv4 = fox(L[3]);
    const [burst, spread] = evolveChoices(lv4).map((c) => c.evo);
    const need = spread.opens!.cards;
    expect(branchProgress(spread, [])).toEqual({ have: 0, need });
    expect(branchProgress(burst, ["ignite"])).toEqual({ have: 0, need });
    const got = branchCards("fire_fox", "spread");
    expect(branchProgress(spread, got)).toEqual({ have: need, need });
    expect(evolveChoices(lv4, got).map((c) => c.ok)).toEqual([false, true]);
    expect(evolve(lv4, got, "spread").branch).toBe("spread");
  });

  it("해금 키: 그 판의 레벨 · 단계, 첫 보스만 정원에서", () => {
    const party = PARTY.map((id) => freshSpirit(id, "brave"));
    expect([...unlockKeys(party)]).toEqual(["start"]);
    const grown = [gainExp(party[0], L[2]), party[1], party[2]];
    expect(unlockKeys(grown).has("fire_fox_lv2")).toBe(true);
    expect(unlockKeys(grown).has("fire_fox_lv3")).toBe(true);
    expect(unlockKeys(grown).has("any_lv3")).toBe(true);
    expect(unlockKeys(grown).has("mist_cat_lv2")).toBe(false);
    expect(unlockKeys(party, true).has("act1_boss")).toBe(true);
    // 성체 카드는 고른 갈래의 카드만 열려요
    const adult = [spiritAt("fire_fox", "brave", "adult", "burst")];
    const [burst, spread] = ["burst", "spread"].map((b) => CARDS.find((c) => c.unlock === "fire_fox_adult" && c.branch === b)!);
    expect(isCardUnlocked(adult, burst)).toBe(true);
    expect(isCardUnlocked(adult, spread)).toBe(false);
  });
});

describe("판 (0157)", () => {
  const opts = { seed: 1, frontId: "fire_fox", adult: false, unlockAll: false };

  it("정원에서 떠나도 늘 유체 Lv 1이고, 성격만 정원에서 읽어요", () => {
    const g = newGarden(1);
    const run = new Run({ ...opts, garden: g });
    expect(run.spirits.map((s) => [s.stage, s.level, s.exp, s.equipment.length])).toEqual([["baby", 1, 0, 0], ["baby", 1, 0, 0], ["baby", 1, 0, 0]]);
    expect(run.spirits.map((s) => s.personality)).toEqual(g.spirits.map((s) => s.personality));
    expect(run.spirits.every((s) => s.hp === maxHpOf(s))).toBe(true);
  });

  it("이긴 전투는 출전한 정령 모두에게 경험과 자람 조건을 주고, 레벨이 오르면 그 판의 보상에 새 카드가 나와요", () => {
    const run = new Run({ ...opts, party: PARTY });
    expect(run.isUnlocked(card("fire_fox_lv2"))).toBe(false);
    const growth = run.grantBattle("elite");
    expect(run.spirits.map((s) => s.exp)).toEqual([GROWTH.exp.elite, GROWTH.exp.elite, GROWTH.exp.elite]);
    expect(growth.fire_fox).toEqual({ expBefore: 0, expAfter: GROWTH.exp.elite, unlocked: levelOf(GROWTH.exp.elite) >= 2 ? ["fire_fox_lv2"] : [] });
    while (run.spirit("fire_fox").level < 3) run.grantBattle("boss");
    expect(run.isUnlocked(card("fire_fox_lv2"))).toBe(true);
    expect(run.isUnlocked(card("fire_fox_lv3"))).toBe(true);
    expect(run.isUnlocked(card("fire_fox_adult"))).toBe(false);
    // 유체는 자람 조건이 없어서 쌓이지 않아요
    run.grantBattle("normal", { fire_fox: { dealt: 40 } });
    expect(run.spirit("fire_fox").deed).toBe(0);
  });

  it("판 안에서 키워요: 받은 갈래 카드로 갈래가 열리고, 고르면 성체 카드가 열려요", () => {
    const run = new Run({ ...opts, party: PARTY });
    while (run.spirit("fire_fox").level < 4) run.grantBattle("boss");
    expect(run.evolvable()).toEqual([]);
    expect(run.evolve("fire_fox", "burst")).toBe(false);
    for (const id of branchCards("fire_fox", "burst")) run.addCard(id, "fire_fox");
    expect(run.evolvable()).toEqual(["fire_fox"]);
    expect(run.evolveChoices("fire_fox").map((c) => c.ok)).toEqual([true, false]);
    const before = run.spirit("fire_fox");
    expect(run.evolve("fire_fox", "burst")).toBe(true);
    const fox = run.spirit("fire_fox");
    expect(fox).toMatchObject({ stage: "adult", branch: "burst" });
    expect(fox.hp - before.hp).toBe(maxHpOf(fox) - maxHpOf(before));
    expect(run.evolvable()).toEqual([]);
    expect(run.isUnlocked(CARDS.find((c) => c.unlock === "fire_fox_adult" && c.branch === "burst")!)).toBe(true);
    // 성체가 되면 자람 조건이 쌓이고, 레벨과 조건이 되면 각성체로
    while (run.spirit("fire_fox").level < 6) run.grantBattle("boss", { fire_fox: { dealt: 100 } });
    expect(run.evolvable()).toEqual(["fire_fox"]);
    expect(run.evolve("fire_fox")).toBe(true);
    expect(run.spirit("fire_fox").stage).toBe("awakened");
    // 저장했다 읽어도 자란 그대로예요
    expect(Run.load(JSON.parse(JSON.stringify(run.save()))).spirits).toEqual(run.spirits);
  });

  it("런은 시작 덱을 빼고 받은 카드를 정령별로 세요", () => {
    const run = new Run({ ...opts, party: PARTY });
    expect(run.received).toEqual([]);
    run.addCard("backfire", "fire_fox");
    run.removeCard(run.received[0].uid);
    expect(run.receivedBy("fire_fox")).toEqual(["backfire"]);
    expect(run.receivedBy("mist_cat")).toEqual([]);
  });

  it("보상 다시 뽑기 (0157): 완주한 줄마다 하나(상한까지), 쓰면 세 장을 통째로 새로 받아요", () => {
    const g = newGarden(1);
    const cleared = { ...g, spirits: g.spirits.map((s, i) => (i < 2 ? { ...s, cleared: [s.personality] } : s)) };
    expect(new Run({ ...opts, garden: g }).rerolls).toBe(0);
    const run = new Run({ ...opts, garden: cleared });
    expect(run.rerolls).toBe(2);
    const reward = run.rollBattleReward("battle");
    expect(run.canRerollReward(reward)).toBe(true);
    const gold = run.gold;
    run.rerollRewardCards(reward);
    expect(run.rerolls).toBe(1);
    expect(reward.cards).toHaveLength(3);
    expect(run.gold).toBe(gold);
    expect(Run.load(JSON.parse(JSON.stringify(run.save()))).rerolls).toBe(1);
    // 고른 뒤에는 못 써요. 다 쓰면 못 써요
    run.takeRewardCard(reward, reward.cards[0].cardId);
    expect(run.canRerollReward(reward)).toBe(false);
    expect(() => run.rerollRewardCards(reward)).toThrow();
    const next = run.rollBattleReward("battle");
    run.rerollRewardCards(next);
    expect(run.canRerollReward(next)).toBe(false);
    // 다 써도 받고 떠난 수는 그대로예요 (화면이 흐려진 버튼을 남겨요)
    expect(run.rerolls).toBe(0);
    expect(run.rerollsGranted).toBe(2);
    expect(new Run({ ...opts, garden: g }).rerollsGranted).toBe(0);
    expect(C.reward.reroll_max).toBe(3);
  });

  it("시험 판: 성체 · 각성체 문 레벨에서 시작할 수 있어요", () => {
    const adult = new Run({ ...opts, party: PARTY, adult: true });
    expect(adult.spirits.map((s) => [s.stage, s.level])).toEqual([["adult", 4], ["adult", 4], ["adult", 4]]);
    expect(adult.spirits[0].exp).toBe(L[3]);
    const awakened = new Run({ ...opts, party: PARTY, adult: false, awakened: true });
    expect(awakened.spirits.map((s) => [s.stage, s.level])).toEqual([["awakened", 6], ["awakened", 6], ["awakened", 6]]);
  });
});
