import { C, affinity } from "../data";
import { baseStat, conditionHolds, critStat, equipMods, round } from "../stats";
import type { Element, EnemyTargetRule, StatKey } from "../types";
import type { Engine } from "./engine";
import { allPassives, passivesOf } from "./passives";
import { spendStatus, statusN, statusStrength, type BCard, type BEnemy, type BSpirit } from "./state";
import { vulnMult } from "./statuses";

/** 판정 단계. order가 작은 것부터 차례로 적용돼요. 단계를 끼우거나 바꿀 때는 이 목록만 고쳐요. 목록은 모듈을 읽을 때 한 번 정렬해요. */
export interface Stage<T> {
  id: string;
  order: number;
  apply: (ctx: T) => void;
}

export function runStages<T>(stages: readonly Stage<T>[], ctx: T): T {
  for (const s of stages) s.apply(ctx);
  return ctx;
}

export const byOrder = <T extends { order: number }>(list: T[]) => list.sort((a, b) => a.order - b.order);

// ───────────────────────── 능력치 ─────────────────────────

export interface StatCalc {
  s: BSpirit;
  k: StatKey;
  value: number;
}

/** 전투 중 능력치: 런의 기본값 → 장비 조건부(고정값 더한 뒤 비율) → 정령에 붙은 것들(용맹) */
export const STAT_STAGES: Stage<StatCalc>[] = [
  { id: "base", order: 10, apply: (c) => (c.value = baseStat(c.s.run, c.k)) },
  {
    id: "equipConditional", order: 40,
    apply(c) {
      const live = equipMods(c.s.run, c.k).filter(([, m]) => m.when && conditionHolds(m.when, c.s));
      if (!live.length) return;
      for (const [, m] of live) if (m.op === "add") c.value += m.value;
      c.value *= 1 + live.filter(([, m]) => m.op === "pct").reduce((a, [, m]) => a + m.value, 0);
    },
  },
  {
    id: "passives", order: 50,
    apply(c) {
      for (const [p, v] of passivesOf(c.s)) if (p.stat) c.value = p.stat(c.s, c.k, c.value, v);
    },
  },
];

// ───────────────────────── 아군 타격 피해 ─────────────────────────

export interface HitCalc {
  b: Engine;
  attacker: BSpirit;
  target: BEnemy;
  element: Element;
  base: number;
  /** 파워의 영향을 받지 않는 타격 */
  noPower: boolean;
  amount: number;
  crit: boolean;
  weakHit: boolean;
  resist: boolean;
  opening: boolean;
}

/** 기본값 → 강화 → 타격 보너스 → 지속 효과 보너스 → 파워 → 상성 → 치명 → 취약 → 약화 → 해방 → 허점타(창 또는 휘청) → 반올림 */
export const ALLY_HIT_STAGES: Stage<HitCalc>[] = [
  { id: "empower", order: 10, apply: (c) => (c.amount = c.base + statusN(c.attacker, "empower")) },
  {
    id: "hitBonus", order: 15,
    apply(c) {
      if (statusN(c.attacker, "omen") > 0 && statusN(c.target, "star") > 0) {
        c.amount += statusStrength(c.attacker, "omen");
        spendStatus(c.attacker, "omen");
      }
      if (statusN(c.attacker, "hitBonus") === 0) return;
      c.amount += statusStrength(c.attacker, "hitBonus");
      spendStatus(c.attacker, "hitBonus");
    },
  },
  {
    id: "passiveBonus", order: 16,
    apply(c) {
      for (const [p, v, s] of allPassives(c.b)) c.amount += p.hitBonusAny?.(c.b, s, v, c.attacker, c.target) ?? 0;
    },
  },
  {
    id: "power", order: 20,
    apply(c) {
      const power = c.noPower ? C.stat_base : c.b.stat(c.attacker, "power");
      c.amount *= power / C.stat_base;
    },
  },
  {
    id: "affinity", order: 30,
    apply(c) {
      const aff = affinity(c.element, c.target.def.element);
      c.amount *= aff;
      c.weakHit = aff > 1;
      c.resist = aff < 1;
    },
  },
  {
    id: "crit", order: 40,
    apply(c) {
      let chance = critStat(c.attacker.run, "crit_chance") + c.attacker.critPity;
      for (const [p, v] of passivesOf(c.attacker)) chance += p.critChance?.(c.attacker, v, c.target) ?? 0;
      c.crit = c.b.rng.next() < chance;
      c.attacker.critPity = c.crit ? 0 : c.attacker.critPity + C.crit_pity;
      c.amount *= c.crit ? critStat(c.attacker.run, "crit_mult") : 1;
    },
  },
  { id: "vuln", order: 50, apply: (c) => (c.amount *= vulnMult(c.target)) },
  { id: "weak", order: 60, apply: (c) => (c.amount *= statusN(c.attacker, "weak") > 0 ? C.weak_mult : 1) },
  { id: "release", order: 70, apply: (c) => (c.amount *= c.b.passiveMult(c.attacker, "damageMult")) },
  {
    id: "opening", order: 80,
    apply(c) {
      c.opening = c.b.replaying && c.b.inOpening(c.target, c.b.now);
      if (!c.opening && statusN(c.target, "gap") > 0) c.opening = true;
      if (!c.opening && statusN(c.target, "stagger") > 0) {
        c.opening = true;
        spendStatus(c.target, "stagger");
      }
      if (!c.opening) return;
      let mult = C.opening_mult;
      for (const [p, v] of passivesOf(c.attacker)) mult += p.openingBonus?.(c.attacker, v) ?? 0;
      c.amount *= mult;
    },
  },
  { id: "gap", order: 85, apply: (c) => { if (statusN(c.target, "gap") > 0) c.amount *= C.gap.dmg_mult; } },
  { id: "round", order: 90, apply: (c) => (c.amount = round(c.amount)) },
];

// ───────────────────────── 적 공격 피해 ─────────────────────────

export interface EnemyHitCalc {
  b: Engine;
  attacker: BEnemy;
  /** 없으면 미리보기 (대상 상태를 빼고 계산) */
  target: BSpirit | null;
  base: number;
  amount: number;
}

/** 기본값 → 피해 보너스 → 약화 → 대상 취약 → 대상 숨음(절반) → 지속 효과가 줄이는 값 → 반올림 */
export const ENEMY_HIT_STAGES: Stage<EnemyHitCalc>[] = [
  { id: "bonus", order: 10, apply: (c) => (c.amount = c.base + statusN(c.attacker, "bonusDmg")) },
  { id: "weak", order: 20, apply: (c) => (c.amount *= statusN(c.attacker, "weak") > 0 ? C.weak_mult : 1) },
  { id: "vuln", order: 30, apply: (c) => (c.amount *= c.target ? vulnMult(c.target) : 1) },
  { id: "hidden", order: 40, apply: (c) => (c.amount *= c.target && statusN(c.target, "hidden") > 0 ? C.hidden_mult : 1) },
  {
    id: "guard", order: 50,
    apply(c) {
      let cut = 0;
      for (const [p, v, s] of allPassives(c.b)) cut += p.enemyHitCutAny?.(c.b, s, v, c.attacker, c.target) ?? 0;
      c.amount = Math.max(0, c.amount - cut);
    },
  },
  { id: "round", order: 90, apply: (c) => (c.amount = round(c.amount)) },
];

// ───────────────────────── 적 공격 대상 ─────────────────────────

export interface TargetPick {
  b: Engine;
  rule: EnemyTargetRule;
  alive: BSpirit[];
  picked: BSpirit[] | null;
}

/** 전체 공격 → 숨음 → 도발 → 해방 도발 → 규칙(앞열 · 최저 · 무작위). 먼저 고른 단계가 이겨요. */
export const ENEMY_TARGET_STAGES: Stage<TargetPick>[] = [
  { id: "all", order: 10, apply: (c) => { if (c.rule === "all") c.picked = c.alive; } },
  {
    id: "hidden", order: 15,
    apply(c) {
      if (c.picked) return;
      const t = c.alive.find((s) => statusN(s, "hidden") > 0);
      if (t) c.picked = [t];
    },
  },
  {
    id: "taunt", order: 20,
    apply(c) {
      if (c.picked) return;
      const t = c.alive.find((s) => statusN(s, "taunt") > 0);
      if (t) c.picked = [t];
    },
  },
  {
    id: "releaseTaunt", order: 30,
    apply(c) {
      if (c.picked) return;
      const t = c.alive.find((s) => passivesOf(s).some(([p, v]) => p.taunts?.(s, v)));
      if (t) c.picked = [t];
    },
  },
  {
    id: "rule", order: 40,
    apply(c) {
      if (c.picked) return;
      if (c.rule === "front") c.picked = [c.alive.find((s) => s.id === c.b.frontId) ?? c.alive[0]];
      else if (c.rule === "lowest") c.picked = [c.alive.slice().sort((a, b) => a.hp - b.hp)[0]];
      else c.picked = [c.b.rng.pick(c.alive)];
    },
  },
];

// ───────────────────────── 카드 시간 ─────────────────────────

export interface TimeCalc {
  b: Engine;
  owner: BSpirit;
  card: BCard;
  base: number;
  ms: number;
}

/** 기본 시간 → 밀물(절반) → 품기(-hold_time_cut_ms) → 디딤 → 0 아래 금지 → 스피드 (시간 = 기본 시간 × 기준 스피드 ÷ 스피드, 0036) */
export const CARD_TIME_STAGES: Stage<TimeCalc>[] = [
  { id: "base", order: 10, apply: (c) => (c.ms = c.base) },
  { id: "highTide", order: 20, apply: (c) => { if (c.card.heldFast) c.ms = Math.round(c.ms / 2); } },
  { id: "held", order: 30, apply: (c) => { if (c.card.held) c.ms -= C.hold_time_cut_ms; } },
  { id: "footing", order: 40, apply: (c) => (c.ms -= statusN(c.owner, "footing")) },
  { id: "passives", order: 45, apply: (c) => { for (const [p, v] of passivesOf(c.owner)) c.ms -= p.timeCut?.(c.b, c.owner, v, c.card) ?? 0; } },
  { id: "floor", order: 50, apply: (c) => (c.ms = Math.max(0, c.ms)) },
  {
    id: "speed", order: 90,
    apply(c) {
      const speed = Math.max(1, c.b.stat(c.owner, "speed"));
      c.ms = Math.round((c.ms * C.stat_base) / speed);
    },
  },
];

// ───────────────────────── 피해 받기 ─────────────────────────

export interface Incoming {
  b: Engine;
  target: BSpirit | BEnemy;
  /** 적의 공격이면 그 적 */
  attacker: BEnemy | null;
  dmg: number;
  pierce: boolean;
  /** 벽이 대신 받은 양 */
  wall: number;
  /** 벽을 가진 정령 (벽이 받았을 때) */
  wallKeeper: BSpirit | null;
  blocked: number;
  /** 방어도를 뺀 뒤 HP에서 깎인 양 */
  real: number;
}

/** 벽(다른 아군의 벽이 먼저) → 자기 방어도 → HP */
export const INCOMING_STAGES: Stage<Incoming>[] = [
  {
    id: "wall", order: 10,
    apply(c) {
      if (c.pierce || !c.attacker || "uid" in c.target) return;
      const target = c.target;
      const keeper = c.b.aliveSpirits().find((s) => s !== target && statusN(s, "wall") > 0 && s.block > 0);
      if (!keeper) return;
      c.wall = Math.min(keeper.block, c.dmg);
      keeper.block -= c.wall;
      c.dmg -= c.wall;
      c.wallKeeper = keeper;
      if (keeper.block === 0 && c.dmg > 0) c.b.addStatus(keeper, "wallBroken", 1);
    },
  },
  {
    id: "block", order: 20,
    apply(c) {
      if (c.pierce) return;
      c.blocked = Math.min(c.target.block, c.dmg);
      c.target.block -= c.blocked;
    },
  },
  {
    id: "hp", order: 30,
    apply(c) {
      c.real = c.dmg - c.blocked;
      c.target.hp = Math.max(0, c.target.hp - c.real);
    },
  },
];

for (const list of [STAT_STAGES, ALLY_HIT_STAGES, ENEMY_HIT_STAGES, ENEMY_TARGET_STAGES, CARD_TIME_STAGES, INCOMING_STAGES]) byOrder(list as Stage<unknown>[]);
