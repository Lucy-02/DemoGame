// 2막 규칙: 방전 칸, 땅속 숨기, 주변 적 가속, 첫 타격 되돌리기, 막 넘기기
import { describe, expect, it } from "vitest";
import { Battle, statusN, type BCard } from "./battle";
import { C, ENCOUNTERS, affinity, enemyDef } from "./data";
import { Rng } from "./rng";
import { FLOORS, Run } from "./run";
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

  it("막마다 그 막의 기운마다 보스와 정예가 있고, 약한 풀과 센 풀이 있어요", () => {
    C.acts.forEach((act, i) => {
      const mine = ENCOUNTERS.filter((e) => (e.act ?? 1) === i + 1);
      for (const tier of ["elite", "boss"]) {
        const got = new Set(mine.filter((e) => e.tier === tier).map((e) => e.element));
        for (const el of act.elements) expect(got.has(el as Element)).toBe(true);
      }
      for (const pool of ["weak", "strong"]) expect(mine.some((e) => e.tier === "normal" && e.pool === pool)).toBe(true);
      for (const e of mine) for (const id of e.enemies) expect(enemyDef(id).id).toBe(id);
    });
  });

  it("끝 막까지 차례로 넘어가고, 짧은 막은 그 층 수만큼만 지도를 만들어요", () => {
    const r = new Run({ ...opts, acts: C.acts.length });
    for (let act = 2; act <= C.acts.length; act++) {
      r.nextAct();
      expect(r.act).toBe(act);
      const floors = (C.acts[act - 1] as { floors?: number }).floors ?? FLOORS;
      const nodes = [...r.map.values()];
      expect(r.map.get("boss")!.floor).toBe(floors + 1);
      expect(nodes.filter((n) => n.floor === floors).every((n) => n.type === "rest")).toBe(true);
      expect(nodes.some((n) => n.type === "elite")).toBe(true);
      expect(r.pickEncounter("boss").act).toBe(act);
    }
    expect(r.hasNextAct()).toBe(false);
  });
});

describe("세지는 공격", () => {
  it("쓸 때마다 세지고, 틈이 열리면 처음으로 돌아가요", () => {
    const b = battle(["cold_snap"]);
    const e = b.enemy(1);
    const fox = b.spirit(b.frontId);
    const hits: number[] = [];
    for (let i = 0; i < 12 && !(e.charging && b.currentMove(e).big); i++) {
      for (const s of b.spirits) s.hp = s.maxHp;
      const before = fox.hp;
      const ramped = b.currentMove(e).actions.some((a) => a.type === "attackRamp");
      b.endTurn();
      if (ramped) hits.push(before - fox.hp);
    }
    expect(hits.length).toBeGreaterThan(1);
    expect(hits[1]).toBeGreaterThan(hits[0]);
    expect(e.ramp).toBeGreaterThan(0);
    expect(b.breakCharge(e)).toBe(true);
    expect(e.ramp).toBe(0);
  });
});

describe("상성 고리 (0028)", () => {
  it("물 > 불 > 숲 > 땅 > 전기 > 얼음 > 물, 빛과 그림자는 서로, 바람은 어디에도", () => {
    const ring: Element[] = ["water", "fire", "forest", "earth", "electric", "ice"];
    ring.forEach((el, i) => {
      const next = ring[(i + 1) % ring.length];
      expect(affinity(el, next)).toBe(C.affinity_weak);
      expect(affinity(next, el)).toBe(C.affinity_resist);
    });
    expect(affinity("light", "shadow")).toBe(C.affinity_weak);
    expect(affinity("shadow", "light")).toBe(C.affinity_weak);
    for (const el of ring) expect(affinity("wind", el)).toBe(1);
    expect(affinity("forest", "water")).toBe(1);
  });
});
