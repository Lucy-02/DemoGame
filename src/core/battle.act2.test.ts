// 2막 규칙: 방전 칸, 땅속 숨기, 주변 적 가속, 첫 타격 되돌리기, 막 넘기기
import { describe, expect, it } from "vitest";
import { Battle, statusN, type BCard } from "./battle";
import { C, ENCOUNTERS, enemyDef } from "./data";
import { Rng } from "./rng";
import { Run } from "./run";
import type { Element } from "./types";

const PARTY = ["fire_fox", "glass_salamander", "magma_ibex"];

function battle(enemies: string[]): Battle {
  const run = new Run({ seed: 1, frontId: PARTY[0], adult: false, unlockAll: true, party: PARTY });
  const b = new Battle(run.spirits, [], enemies, run.frontId, new Rng(1));
  b.hand = [];
  b.drain();
  return b;
}

function give(b: Battle, cardId: string, owner: string): BCard {
  const c: BCard = { uid: 900 + b.hand.length, cardId, owner, tempCostDelta: 0, locked: false, isCopy: false, grow: 0, held: false, heldFast: false };
  b.hand.push(c);
  return c;
}

describe("방전 칸", () => {
  it("칸 안에서 끝나는 카드의 주인이 피해를 받고, 칸 밖이면 받지 않아요", () => {
    for (const inside of [true, false]) {
      const b = battle(["spark_bug"]);
      expect(b.zones).toEqual([{ uid: 1, from: 900, to: 1500, dmg: enemyDef("spark_bug").pattern[0].zoneDmg }]);
      const fox = b.spirit("fire_fox");
      const c = give(b, "basic_claw", fox.id);
      const end = b.laneEnd(fox.id) + b.cardTime(c);
      b.zones = [{ uid: 1, from: inside ? end : end + 1, to: end + 100, dmg: 5 }];
      b.play(c.uid, { side: "e", uid: 1 });
      const before = fox.hp;
      // 적의 공격이 섞이지 않게 적 행동 칸을 비워요
      b.slots = [];
      b.endTurn();
      expect(before - fox.hp).toBe(inside ? 5 : 0);
    }
  });

  it("칸을 깐 적이 쓰러지면 꺼져요", () => {
    const b = battle(["spark_bug", "rock_pile"]);
    const fox = b.spirit("fire_fox");
    const c = give(b, "basic_claw", fox.id);
    const end = b.laneEnd(fox.id) + b.cardTime(c);
    b.zones = [{ uid: 1, from: end, to: end + 100, dmg: 5 }];
    b.enemy(1).dead = true;
    b.play(c.uid, { side: "e", uid: 2 });
    b.slots = [];
    b.endTurn();
    expect(fox.hp).toBe(fox.maxHp);
  });
});

describe("땅속 숨기", () => {
  it("땅속에서는 피해를 받지 않고, 다음 행동 때 올라와요", () => {
    const b = battle(["mole"]);
    const e = b.enemy(1);
    b.endTurn();
    expect(statusN(e, "burrow")).toBe(1);
    const at = b.slots.find((x) => x.uid === 1)!.at;
    expect(b.buriedAt(e, at - 1)).toBe(true);
    expect(b.buriedAt(e, at)).toBe(false);
    b.hurtEnemy(e, 10, false);
    expect(e.hp).toBe(e.maxHp);
    b.endTurn();
    expect(statusN(e, "burrow")).toBe(0);
    b.hurtEnemy(e, 10, false);
    expect(e.hp).toBe(e.maxHp - 10);
  });
});

describe("주변 적 가속", () => {
  it("살아 있는 동안 다른 적의 행동이 빨라지고, 쓰러지면 돌아와요", () => {
    const b = battle(["lightning_rod", "rock_pile"]);
    const at = () => b.slots.find((x) => x.uid === 2)!.at;
    expect(at()).toBe(C.enemy_at.normal - 500);
    // 재촉하는 적 자신은 빨라지지 않아요
    expect(b.slots.find((x) => x.uid === 1)!.at).toBe(C.enemy_at.normal);
    b.enemy(1).dead = true;
    for (const s of b.spirits) s.block = 99;
    b.endTurn();
    b.endTurn();
    expect(b.enemy(2).charging).toBe(true);
    b.endTurn();
    expect(at()).toBe(C.enemy_at.normal);
  });
});

describe("첫 타격 되돌리기", () => {
  it("턴마다 처음 받은 타격만 일부를 때린 정령에게 돌려줘요", () => {
    const b = battle(["mirror_shard"]);
    const e = b.enemy(1);
    const fox = b.spirit("fire_fox");
    b.hurtEnemy(e, 0, false);
    b.hit(fox, e, 10, "none", true);
    const back = fox.maxHp - fox.hp;
    expect(back).toBeGreaterThan(0);
    const dealt = e.maxHp - e.hp;
    expect(dealt).toBeGreaterThan(0);
    b.hit(fox, e, 10, "none", true);
    expect(fox.maxHp - fox.hp).toBe(back);
    expect(e.maxHp - e.hp).toBeGreaterThan(dealt * 2);
    b.slots = [];
    b.endTurn();
    expect(e.reflected).toBe(false);
  });
});

describe("막 넘기기", () => {
  const opts = { seed: 3, frontId: "fire_fox", adult: false, unlockAll: false, party: PARTY };

  it("막 수를 따로 주지 않으면 1막에서 끝나요", () => {
    const r = new Run(opts);
    expect(r.lastAct).toBe(C.acts_enabled);
    expect(r.hasNextAct()).toBe(C.acts_enabled > 1);
  });

  it("다음 막으로 가면 새 지도, 그 막의 센 기운과 편성이 되고 저장에도 남아요", () => {
    const r = new Run({ ...opts, acts: 2 });
    r.applyMark({ type: "peekBossCharge" });
    for (const s of r.spirits) s.hp = 1;
    r.enter(r.reachable()[0]);
    r.nextAct();
    expect(r.act).toBe(2);
    expect(r.current).toBeNull();
    expect(r.bossPeeked).toBe(false);
    expect(C.acts[1].elements).toContain(r.strongElement);
    expect(r.spirits.every((s) => s.hp > 1)).toBe(true);
    const loaded = Run.load(r.save());
    expect(loaded.act).toBe(2);
    for (const type of ["battle", "elite", "boss"] as const) expect(loaded.pickEncounter(type).act).toBe(2);
    expect(loaded.bossEncounter().element).toBe(loaded.strongElement);
    expect(loaded.hasNextAct()).toBe(false);
  });

  it("막마다 세 기운의 보스와 정예가 하나씩 있어요", () => {
    C.acts.forEach((act, i) => {
      for (const tier of ["elite", "boss"]) {
        const got = ENCOUNTERS.filter((e) => (e.act ?? 1) === i + 1 && e.tier === tier).map((e) => e.element).sort();
        expect(got).toEqual([...(act.elements as Element[])].sort());
      }
    });
  });
});
