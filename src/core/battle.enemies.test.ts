// 적 규칙 (0062): 틈, 한 턴에 여러 번 행동, 거친 특성, 오늘 센 기운과 편성 풀
import { describe, expect, it } from "vitest";
import { Battle, statusN, type BattleEvent } from "./battle";
import { C, ENCOUNTERS, ENEMIES, applyTraits, enemyDef, partyScale } from "./data";
import { newGarden } from "./garden";
import { Rng } from "./rng";
import { Run } from "./run";
import type { Element, EnemyTrait } from "./types";

const PARTY = ["fire_fox", "glass_salamander", "mist_cat"];

function battle(enemies: string[], traits: EnemyTrait[] = []): Battle {
  const run = new Run({ seed: 1, frontId: PARTY[0], adult: false, unlockAll: true, party: PARTY });
  const b = new Battle(run.spirits, [], enemies, run.frontId, new Rng(1), undefined, traits);
  b.hand = [];
  b.drain();
  return b;
}

/** 보스가 큰 차징을 시작할 때까지 턴을 넘겨요 */
function untilBigCharge(b: Battle, uid = 1) {
  const e = b.enemy(uid);
  for (let i = 0; i < 12 && !(e.charging && b.currentMove(e).big); i++) {
    for (const s of b.spirits) s.hp = s.maxHp;
    b.endTurn();
    b.drain();
  }
  expect(e.charging).toBe(true);
  return e;
}

const gaps = (ev: BattleEvent[]) => ev.filter((x): x is Extract<BattleEvent, { k: "gap" }> => x.k === "gap");

describe("틈 (보스의 큰 차징)", () => {
  it("큰 차징을 끊으면 틈이 열리고, 틈 동안 모든 타격이 허점타가 되고 피해가 더 늘어요", () => {
    const b = battle(["wildfire"]);
    const e = untilBigCharge(b);
    expect(b.breakCharge(e)).toBe(true);
    expect(gaps(b.drain())).toMatchObject([{ uid: 1, reason: "break", turns: C.gap.turns_break }]);
    expect(b.inGap(e)).toBe(true);
    const before = e.hp;
    b.hit(b.spirit("fire_fox"), e, 10, "none", true);
    expect(before - e.hp).toBe(Math.round(10 * C.opening_mult * C.gap.dmg_mult));
  });

  it("차징 중에 큰 피해를 몰아 주면 틈이 열려요. 한 차징에 한 번만", () => {
    const b = battle(["wildfire"]);
    const e = untilBigCharge(b);
    b.hurtEnemy(e, Math.ceil(e.maxHp * C.gap.burst_pct), true);
    b.hurtEnemy(e, Math.ceil(e.maxHp * C.gap.burst_pct), true);
    expect(gaps(b.drain())).toMatchObject([{ reason: "burst" }]);
  });

  it("차징을 빙결로 다음 턴으로 밀면 틈이 열려요", () => {
    const b = battle(["wildfire"]);
    const e = untilBigCharge(b);
    b.endTurn(); // 차징이 터지는 턴으로
    b.drain();
    if (!e.charging) return; // 터지는 턴 배치가 바뀌면 이 시험은 다시 맞춰요
    for (let i = 0; i < 6 && !b.inGap(e); i++) b.freezeEnemy(e);
    expect(gaps(b.drain()).some((g) => g.reason === "delay")).toBe(true);
  });

  it("틈이 열리면 들불의 세지는 화상이 처음으로 돌아가요", () => {
    const b = battle(["wildfire"]);
    const e = untilBigCharge(b);
    expect(e.ramp).toBeGreaterThan(0);
    b.hurtEnemy(e, Math.ceil(e.maxHp * C.gap.burst_pct), true);
    expect(e.ramp).toBe(0);
  });

  it("끊기면 화상을 걷어 가는 차징 (들불)", () => {
    const b = battle(["wildfire"]);
    const e = untilBigCharge(b);
    for (const s of b.aliveSpirits()) b.addStatus(s, "burn", 3);
    b.breakCharge(e);
    expect(b.aliveSpirits().every((s) => statusN(s, "burn") === 0)).toBe(true);
  });
});

describe("한 턴에 여러 번 행동", () => {
  it("회오리는 한 턴에 두 번 움직여요", () => {
    const b = battle(["whirl"]);
    expect(b.moveQueue(b.enemy(1)).map((m) => m.at)).toEqual(enemyDef("whirl").acts![0]);
    b.endTurn();
    expect(b.drain().filter((x) => x.k === "enemyAct")).toHaveLength(2);
  });

  it("빙결로 밀린 행동 뒤에도 나머지 행동이 이어져요", () => {
    const b = battle(["gale"]);
    const e = b.enemy(1);
    for (let i = 0; i < 4; i++) b.freezeEnemy(e); // 첫 행동을 다음 턴으로
    expect(e.carryAt).not.toBeNull();
    b.endTurn();
    b.drain();
    expect(b.moveQueue(e).length).toBe(enemyDef("gale").acts![1].length);
  });

  it("여러 번 움직이는 적의 차징은 그 턴의 마지막 시각에 터져서 빙결로 밀 수 있어요", () => {
    const b = battle(["gale"]);
    const e = untilBigCharge(b);
    b.endTurn();
    b.drain();
    const q = b.moveQueue(e);
    expect(q).toHaveLength(1);
    expect(q[0].at + C.freeze_delay_ms).toBeGreaterThanOrEqual(C.axis_ms);
    b.freezeEnemy(e);
    expect(b.inGap(e)).toBe(true);
  });

  it("재빠른 적은 행동이 빨라져요", () => {
    const plain = battle(["frostfang"]).moveQueue(battle(["frostfang"]).enemy(1))[0].at;
    const swift = battle(["frostfang"], ["swift"]);
    expect(swift.moveQueue(swift.enemy(1))[0].at).toBe(Math.max(200, plain - C.traits.swift_ms));
  });
});

describe("거친 특성 (정예)", () => {
  it("단단한: 턴마다 방어도를 얻어요", () => {
    const b = battle(["frostfang"], ["sturdy"]);
    expect(b.enemy(1).block).toBe(C.traits.sturdy_block);
  });

  it("타오르는: 때린 정령에게 화상을 줘요", () => {
    const b = battle(["frostfang"], ["burning"]);
    b.hit(b.spirit("fire_fox"), b.enemy(1), 5, "none", true);
    expect(statusN(b.spirit("fire_fox"), "burn")).toBe(C.traits.burning_burn);
  });

  it("묵직한: 모든 공격이 세지고, 차징 공격은 더 세져요", () => {
    const def = enemyDef("moss_slime");
    const heavy = applyTraits(def, ["heavy"]);
    const dmg = (d: typeof def, charge: boolean) => d.pattern.filter((m) => !!m.charge === charge).flatMap((m) => m.actions).flatMap((a) => (a.type === "attack" ? [a.dmg] : []));
    expect(dmg(heavy, true)).toEqual(dmg(def, true).map((v) => Math.round(v * C.traits.heavy_charge_mult)));
    expect(dmg(heavy, false)).toEqual(dmg(def, false).map((v) => v + C.traits.heavy_dmg));
  });

  it("졸개에게는 붙지 않아요", () => {
    const b = battle(["frostfang"], ["sturdy"]);
    expect(b.enemies.filter((e) => e.def.tier === "minion").every((e) => e.traits.length === 0)).toBe(true);
  });
});

describe("오늘 센 기운과 편성 풀", () => {
  const enc = (id: string) => ENCOUNTERS.find((x) => x.id === id)!;

  it("보스는 오늘 센 기운의 보스예요", () => {
    for (const el of C.acts[0].elements as Element[]) {
      const r = new Run({ seed: 3, frontId: "fire_fox", adult: false, unlockAll: false, strongElement: el });
      expect(r.strongElement).toBe(el);
      expect(r.bossEncounter().element).toBe(el);
    }
  });

  it("처음 전투들은 약한 풀, 그 뒤는 센 풀에서 나오고 최근 편성은 다시 나오지 않아요", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const r = new Run({ seed, frontId: "fire_fox", adult: false, unlockAll: false });
      const seen: string[] = [];
      for (let i = 0; i < 8; i++) {
        const id = r.pickEncounter("battle").id;
        expect(enc(id).pool).toBe(i < C.run_pool.weak_battles ? "weak" : "strong");
        expect(seen.slice(-C.run_pool.no_repeat)).not.toContain(id);
        seen.push(id);
      }
    }
  });

  it("이 판의 첫 정예는 센 기운의 정예예요", () => {
    for (const el of C.acts[0].elements as Element[]) {
      for (let seed = 1; seed <= 10; seed++) {
        const r = new Run({ seed, frontId: "fire_fox", adult: false, unlockAll: false, strongElement: el });
        expect(r.pickEncounter("elite").element).toBe(el);
        expect(Run.load(r.save()).strongEliteMet).toBe(true);
      }
    }
  });

  it("첫 판은 센 기운이 정해져 있어요", () => {
    for (let seed = 1; seed <= 10; seed++) {
      const first = new Run({ seed, frontId: "fire_fox", adult: false, unlockAll: false, garden: newGarden(seed, ["fire_fox"]) });
      expect(first.strongElement).toBe(C.run_pool.first_run_strong);
    }
    const later = new Set<string>();
    for (let seed = 1; seed <= 30; seed++) {
      later.add(new Run({ seed, frontId: "fire_fox", adult: false, unlockAll: false, garden: { ...newGarden(seed, ["fire_fox"]), runs: 1 } }).strongElement);
    }
    expect(later.size).toBeGreaterThan(1);
  });

  it("정예 칸마다 거친 특성이 하나 붙어요", () => {
    const r = new Run({ seed: 5, frontId: "fire_fox", adult: false, unlockAll: false });
    const elites = [...r.map.values()].filter((n) => n.type === "elite");
    expect(elites.length).toBeGreaterThan(0);
    for (const n of elites) expect(n.trait).toBeDefined();
  });
});

describe("판에 표시를 남기는 이벤트", () => {
  const fresh = (seed = 5, strong: Element = "forest") => new Run({ seed, frontId: "fire_fox", adult: false, unlockAll: false, strongElement: strong });

  it("남은 정예의 거친 특성이 모두 다른 것으로 바뀌어요", () => {
    const r = fresh();
    const before = new Map([...r.map.values()].filter((n) => n.type === "elite").map((n) => [n.id, n.trait]));
    expect(r.applyMark({ type: "rerollEliteTraits" })).toBe(true);
    for (const [id, t] of before) expect(r.map.get(id)!.trait).not.toBe(t);
  });

  it("미리 보면 보스의 큰 차징이 시작되는 턴을 알려 줘요", () => {
    const want: Record<string, number> = { forest: 5, fire: 5, wind: 3 };
    for (const el of C.acts[0].elements as Element[]) {
      const r = fresh(5, el);
      expect(r.bossPeek()).toBeNull();
      r.applyMark({ type: "peekBossCharge" });
      expect(Run.load(r.save()).bossPeek()?.turn).toBe(want[el]);
    }
  });

  it("보스전의 첫 틈만 길어져요", () => {
    const r = fresh();
    r.applyMark({ type: "extendBossGap", turns: 1 });
    expect(r.battleGapBonus()).toBe(0);
    r.current = [...r.map.values()].find((n) => n.type === "boss")!;
    expect(Run.load(r.save()).bossGapBonus).toBe(1);
    expect(r.battleGapBonus()).toBe(1);
    expect(r.applyMark({ type: "gold", value: 1 })).toBe(false);
  });
});

describe("혼자 떠난 판의 적 세기 (0098)", () => {
  it("보스 칸은 보스 값을, 그 밖은 기본 값을 써요", () => {
    const k = C.party_scale["1"];
    expect(partyScale(1)).toMatchObject({ hp: k.hp, dmg: k.dmg });
    expect(partyScale(1, true)).toEqual(k.boss);
    expect(partyScale(2, true)).toEqual(partyScale(2));
    expect(partyScale(3, true)).toBeUndefined();
  });

  it("단단한 특성의 방어도는 적 세기를 따라가요", () => {
    const run = new Run({ seed: 1, frontId: PARTY[0], adult: false, unlockAll: true, party: [PARTY[0]] });
    const b = new Battle(run.spirits, [], ["frostfang"], run.frontId, new Rng(1), partyScale(1), ["sturdy"]);
    expect(b.enemy(1).block).toBe(Math.round(C.traits.sturdy_block * C.party_scale["1"].hp));
  });
});

describe("적 효과문 (TEXT_RULES 1절)", () => {
  it("모든 적의 모든 행동이 합니다체 완결문이고 기호 줄임이 없어요", () => {
    for (const def of ENEMIES) {
      const b = battle([def.id]);
      const e = b.enemies[0];
      for (let i = 0; i < def.pattern.length; i++) {
        e.patternIdx = i;
        const text = b.intent(e).text;
        expect(text, `${def.id} ${i}`).toMatch(/니다\.$/);
        expect(text, `${def.id} ${i}`).not.toMatch(/[×()]|끊기/);
      }
    }
  });
});
