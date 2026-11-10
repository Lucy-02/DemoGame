// 능력치 층 (장비 핸드오프 4절): 기본 → 단계 → 레벨 → 장비 고정값 → 영구 배율 → (HP 반올림 + 런) → 전투 조건부
import { afterEach, describe, expect, it } from "vitest";
import { Battle } from "./battle";
import { EQUIP_PASSIVES } from "./battle/passives";
import { C, EQUIPMENT } from "./data";
import { Rng } from "./rng";
import { Run } from "./run";
import { activeTiers, critStat, equipKeepSlots, maxHpOf, resolveStat, resonanceCap } from "./stats";
import type { EquipDef, RunSpirit } from "./types";
import { equipProblems } from "./validate";

const FIXTURE: EquipDef = {
  id: "test_charm", owner: "fire_fox", grade: "boss",
  tiers: [
    { stats: [{ stat: "power", op: "add", value: 2 }] },
    { stats: [{ stat: "power", op: "add", value: 2 }, { stat: "hp", op: "pct", value: 0.1 }], effects: [{ passive: "test_passive", value: 1 }] },
    { stats: [{ stat: "crit_chance", op: "add", value: 0.1 }, { stat: "power", op: "pct", value: 0.2, when: { k: "hpBelow", ratio: 0.5 } }] },
  ],
  downside: { stats: [{ stat: "guard", op: "add", value: -1 }] },
};

const fox = (resonance: number, over: Partial<RunSpirit> = {}): RunSpirit => ({
  id: "fire_fox", hp: 0, maxHpBonus: 0, stage: "adult", level: 3, personality: "brave",
  equipment: [{ id: "test_charm", resonance, from: "run" }], ...over,
});

describe("능력치 층", () => {
  afterEach(() => {
    EQUIPMENT.splice(EQUIPMENT.indexOf(FIXTURE), 1);
    delete EQUIP_PASSIVES.test_passive;
  });
  EQUIPMENT.push(FIXTURE);

  it("장비가 없으면 지금 값과 같고, 출처는 기본 · 단계 · 레벨뿐이에요", () => {
    const rs = fox(1, { equipment: [] });
    expect(resolveStat(rs, "power").parts.map((p) => p.source)).toEqual(["base", "stage"]);
    expect(resolveStat(rs, "hp").parts.map((p) => p.source)).toEqual(["base", "level"]);
    expect(maxHpOf(rs)).toBe(24 + 4);
    expect(critStat(rs, "crit_chance")).toBe(C.crit_base);
  });

  it("공명 단계가 층을 고르고, 대가는 늘 붙어요", () => {
    EQUIPMENT.push(FIXTURE);
    expect(activeTiers({ id: "test_charm", resonance: 1, from: "run" })).toEqual([FIXTURE.tiers[0], FIXTURE.downside]);
    expect(activeTiers({ id: "test_charm", resonance: 9, from: "run" })).toEqual([FIXTURE.tiers[2], FIXTURE.downside]);
    const power = resolveStat(fox(1), "power");
    expect(power.parts).toEqual([{ source: "base", delta: 13 }, { source: "stage", delta: 2 }, { source: "equipment:test_charm", delta: 2 }]);
    expect(resolveStat(fox(1), "guard").value).toBe(7 - 1);
  });

  it("영구 배율은 같은 층에서 더하고, HP는 반올림한 뒤 런 보정을 더해요", () => {
    EQUIPMENT.push(FIXTURE);
    const rs = fox(2, { personality: "sturdy", maxHpBonus: 3 });
    const hp = resolveStat(rs, "hp");
    const raw = 24 + 4;
    expect(hp.value).toBe(Math.round(raw * (1.15 + 0.1)) + 3);
    expect(hp.parts.at(-1)).toEqual({ source: "run", delta: 3 });
    expect(hp.parts.some((p) => p.source === "equipment:test_charm")).toBe(true);
  });

  it("조건부 보정과 치명 보정은 전투에서만 붙어요", () => {
    EQUIPMENT.push(FIXTURE);
    const run = new Run({ seed: 1, frontId: "fire_fox", adult: true, unlockAll: false });
    run.spirit("fire_fox").equipment = [{ id: "test_charm", resonance: 3, from: "run" }];
    const b = new Battle(run.spirits, [], ["moss_slime"], "fire_fox", new Rng(1));
    const s = b.spirit("fire_fox");
    const calm = b.stat(s, "power");
    expect(resolveStat(s.run, "power").value).toBe(calm);
    s.hp = Math.floor(s.maxHp / 2);
    expect(b.stat(s, "power")).toBe(calm * 1.2);
    expect(critStat(s.run, "crit_chance")).toBeCloseTo(C.crit_base + 0.1);
  });

  it("장비 효과는 정령에 붙은 것으로 들어가요", () => {
    EQUIPMENT.push(FIXTURE);
    EQUIP_PASSIVES.test_passive = { stat: (_s, k, v, value) => (k === "focus" ? v + value : v) };
    const run = new Run({ seed: 1, frontId: "fire_fox", adult: true, unlockAll: false });
    run.spirit("fire_fox").equipment = [{ id: "test_charm", resonance: 2, from: "run" }];
    const b = new Battle(run.spirits, [], ["moss_slime"], "fire_fox", new Rng(1));
    const s = b.spirit("fire_fox");
    expect(b.stat(s, "focus")).toBe(resolveStat(s.run, "focus").value + 1);
  });

  it("단계별 칸 수 · 공명 상한, 데이터 검사", () => {
    expect([equipKeepSlots("baby"), equipKeepSlots("awakened")]).toEqual([0, 2]);
    expect([resonanceCap("baby"), resonanceCap("awakened")]).toEqual([1, 3]);
    const spiritIds = new Set(["fire_fox"]);
    EQUIP_PASSIVES.test_passive = {};
    expect(equipProblems(FIXTURE, spiritIds)).toEqual([]);
    expect(equipProblems({ ...FIXTURE, grade: "elite" }, spiritIds)).toEqual(["test_charm: 대가는 보스 장비에만 있어요"]);
    expect(equipProblems({ ...FIXTURE, tiers: [{ stats: [{ stat: "luck", op: "add", value: 1 }] }] }, spiritIds)).toEqual(["test_charm.tiers[0].stats[0]: 모르는 수치 luck"]);
  });
});
