// 범용 · 보스 장비의 효과 (결정 0056). 숫자는 시험 값이라 장비 없는 전투와 비교해요.
import { describe, expect, it } from "vitest";
import { Battle, statusN, type BCard, type BattleEvent } from "./battle";
import { C, equipDef } from "./data";
import { Rng } from "./rng";
import { Run } from "./run";
import { maxHpOf, returnHp } from "./stats";

const E1 = { side: "e", uid: 1 } as const;
const PARTY = ["fire_fox", "glass_salamander", "mist_cat"];

/** 불여우가 장비(공명 n)를 지닌 전투 */
function battleWith(equip: [id: string, resonance: number] | null, hand: string[], enemies = ["grimbark"]): Battle {
  const run = new Run({ seed: 1, frontId: "fire_fox", adult: false, unlockAll: true, party: PARTY });
  if (equip) run.spirit("fire_fox").equipment = [{ id: equip[0], resonance: equip[1], from: "run" }];
  const b = new Battle(run.spirits, [], enemies, run.frontId, new Rng(1));
  b.hand = hand.map((cardId, i): BCard =>
    ({ uid: 100 + i, cardId, owner: "fire_fox", tempCostDelta: 0, locked: false, isCopy: false, grow: 0, held: false, heldFast: false }));
  b.mana = 99;
  for (const s of b.spirits) s.critPity = -10;
  b.drain();
  return b;
}

const hits = (ev: BattleEvent[]) =>
  ev.filter((e): e is Extract<BattleEvent, { k: "damage" }> => e.k === "damage" && e.ref.side === "e").map((e) => e.amount);
function playAll(b: Battle): BattleEvent[] {
  for (const c of [...b.hand]) b.play(c.uid, E1);
  b.endTurn();
  return b.drain();
}

describe("범용 장비", () => {
  it("청동 투구: 최대 HP가 늘고, 공명 3은 쓰러졌다 돌아올 때 HP를 더 받아요", () => {
    const plain = battleWith(null, []).spirit("fire_fox");
    const worn = battleWith(["bronze_helmet", 3], []).spirit("fire_fox");
    expect(worn.maxHp).toBeGreaterThan(plain.maxHp);
    expect(returnHp(worn.run)).toBe(returnHp(plain.run) + (C.equip_return_hp as number));
    expect(returnHp(battleWith(["bronze_helmet", 2], []).spirit("fire_fox").run)).toBe(returnHp(plain.run));
  });

  it("뼈 검: 공명 1은 턴 첫 타격만, 공명 3은 가장 긴 카드의 타격만 세져요", () => {
    const hand = ["basic_claw", "backfire"];
    const plain = hits(playAll(battleWith(null, hand)));
    const first = hits(playAll(battleWith(["bone_sword", 1], hand)));
    const long = hits(playAll(battleWith(["bone_sword", 3], hand)));
    expect(plain).toHaveLength(2);
    expect(first[0] - plain[0]).toBeGreaterThan(first[1] - plain[1]);
    expect(long[1]).toBeGreaterThan(first[1]);
    expect(long[0]).toBeLessThan(first[0]);
  });

  it("원형 방패: HP가 절반 아래일 때 가드가 더 올라요. 공명 3은 HP가 가득이 아니면 올라요", () => {
    const guard = (res: number, hp: number) => {
      const b = battleWith(["round_shield", res], []);
      const fox = b.spirit("fire_fox");
      fox.hp = hp;
      return b.stat(fox, "guard");
    };
    const max = maxHpOf(battleWith(null, []).spirit("fire_fox").run);
    expect(guard(1, 1)).toBeGreaterThan(guard(1, max));
    expect(guard(1, max - 1)).toBe(guard(1, max));
    expect(guard(3, max - 1)).toBeGreaterThan(guard(3, max));
  });

  it("활: 적의 화상이 처음 줄어들 때 덜 줄어요. 공명 1은 전투마다 한 번", () => {
    const burnAfter = (equip: [string, number] | null, turns: number) => {
      const b = battleWith(equip, []);
      b.addStatus(b.enemy(1), "burn", 20);
      for (let i = 0; i < turns; i++) b.endTurn();
      return statusN(b.enemy(1), "burn");
    };
    expect(burnAfter(null, 1)).toBe(10);
    expect(burnAfter(["short_bow", 1], 1)).toBe(11);
    expect(burnAfter(["short_bow", 1], 2)).toBe(5);
    expect(burnAfter(["short_bow", 2], 2)).toBe(6);
    expect(burnAfter(["short_bow", 3], 1)).toBe(12);
  });

  it("투창: 턴 첫 카드의 시간이 줄어요", () => {
    const times = (equip: [string, number] | null) => {
      const b = battleWith(equip, ["basic_claw", "basic_claw"]);
      const first = b.cardTime(b.hand[0]);
      b.play(100, E1);
      return [first, b.cardTime(b.hand[0])];
    };
    const [first, second] = times(["javelin", 1]);
    expect(first).toBeLessThan(second);
    expect(second).toBeLessThan(times(null)[1]);
  });

  it("수정 단검: HP가 가득인 적에게 치명 확률이 올라요", () => {
    const p = equipDef("crystal_dagger").tiers[0];
    expect(p.effects?.[0].passive).toBe("crit_vs_full");
    const crits = (equip: [string, number] | null, hurtFirst: boolean) => {
      let n = 0;
      for (let seed = 1; seed <= 300; seed++) {
        const run = new Run({ seed, frontId: "fire_fox", adult: false, unlockAll: true, party: PARTY });
        if (equip) run.spirit("fire_fox").equipment = [{ id: equip[0], resonance: equip[1], from: "run" }];
        const b = new Battle(run.spirits, [], ["grimbark"], run.frontId, new Rng(seed));
        if (hurtFirst) b.enemy(1).hp -= 1;
        b.drain();
        b.hit(b.spirit("fire_fox"), b.enemy(1), 1, "fire", false);
        if (b.drain().some((e) => e.k === "damage" && e.crit)) n++;
      }
      return n;
    };
    expect(crits(["crystal_dagger", 1], false)).toBeGreaterThan(crits(["crystal_dagger", 1], true) + 10);
    expect(crits(["crystal_dagger", 3], true)).toBeGreaterThan(crits(["crystal_dagger", 1], true) + 10);
  });
});

describe("보스 장비", () => {
  it("이끼 망치: 턴 첫 카드 비용이 줄고 최대 HP가 줄어요", () => {
    const b = battleWith(["moss_hammer", 1], ["basic_claw", "basic_claw"]);
    expect(b.cardCost(b.hand[0])).toBe(0);
    b.play(100, E1);
    expect(b.cardCost(b.hand[0])).toBe(1);
    expect(b.spirit("fire_fox").maxHp).toBeLessThan(battleWith(null, []).spirit("fire_fox").maxHp);
  });

  it("흑요석 낫: 카드 시간이 줄고 가드가 줄어요", () => {
    const worn = battleWith(["obsidian_scythe", 1], ["basic_claw"]);
    const plain = battleWith(null, ["basic_claw"]);
    expect(worn.cardTime(worn.hand[0])).toBeLessThan(plain.cardTime(plain.hand[0]));
    expect(worn.stat(worn.spirit("fire_fox"), "guard")).toBeLessThan(plain.stat(plain.spirit("fire_fox"), "guard"));
  });

  it("돌도끼: 방어도 절반이 다음 턴에 남고 파워가 줄어요", () => {
    const b = battleWith(["stone_axe", 1], [], ["rubble_shell"]);
    const fox = b.spirit("fire_fox");
    b.gainBlock(fox, 10);
    b.endTurn();
    expect(fox.block).toBe(5);
    expect(b.stat(fox, "power")).toBeLessThan(battleWith(null, []).stat(battleWith(null, []).spirit("fire_fox"), "power"));
  });

  it("보스 장비는 공명이 올라도 그대로예요", () => {
    for (const id of ["moss_hammer", "obsidian_scythe", "stone_axe"]) expect(equipDef(id).tiers).toHaveLength(1);
  });
});
