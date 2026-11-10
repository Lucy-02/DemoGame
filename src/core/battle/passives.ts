import { C, cardDef } from "../data";
import { round, scale } from "../stats";
import { polite } from "../korean";
import type { AuraId, CardDef, StatKey } from "../types";
import type { Engine } from "./engine";
import type { BCard, BSpirit } from "./state";

/** 비용 계산 중간값 */
export interface CostCalc {
  card: BCard;
  owner: BSpirit;
  cost: number;
}

/**
 * 정령에 붙어 이벤트에 반응하는 것: 지속 효과(aura) · 성격 · 해방.
 * 훅은 쓰이는 자리의 순서대로 불려요. 한 정령 안에서는 지속 효과 → 해방 → 성격 순서예요.
 */
export interface Passive {
  /** 턴 시작, 이 정령의 턴 값이 지워진 직후 */
  turnStart?: (b: Engine, s: BSpirit, v: number) => void;
  /** 첫 턴, 손패를 받은 직후 */
  firstHand?: (b: Engine, s: BSpirit, v: number) => void;
  /** 매 턴, 손패를 받은 직후 */
  afterHand?: (b: Engine, s: BSpirit, v: number) => void;
  /** 턴 끝, 이 정령의 상태 처리 직후 */
  turnEnd?: (b: Engine, s: BSpirit, v: number) => void;
  /** 카드를 놓은 직후 */
  afterPlay?: (b: Engine, s: BSpirit, v: number, card: BCard, def: CardDef) => void;
  /** 능력치 보정 */
  stat?: (s: BSpirit, k: StatKey, value: number, v: number) => number;
  /** 카드 비용 보정 */
  cost?: (b: Engine, calc: CostCalc, v: number) => void;
  /** 화상 부여량에 더하는 값 */
  burnBonus?: (s: BSpirit, v: number) => number;
  healMult?: (s: BSpirit, v: number) => number;
  /** 아군에게 거는 회복·방어도 배율 */
  supportMult?: (s: BSpirit, v: number) => number;
  damageMult?: (s: BSpirit, v: number) => number;
  burnMult?: (s: BSpirit, v: number) => number;
  chillMult?: (s: BSpirit, v: number) => number;
  /** 턴 시작에 방어도를 지키는지 */
  keepsBlock?: (s: BSpirit, v: number) => boolean;
  /** 적의 단일 공격을 받는지 (도발 다음 순서) */
  taunts?: (s: BSpirit, v: number) => boolean;
}

export interface AuraDef extends Passive {
  /** owner: 카드 주인에게 걸려요. battle: 주인 없이 전투 전체에 걸려요 */
  scope: "owner" | "battle";
  /** 효과문 ("지속." 뒤의 완결문). sc는 시전 정령 능력치로 보정한 수치예요 */
  text: (v: number, sc: (v: number, k: "guard" | "focus") => number) => string;
}

export const AURAS: Record<AuraId, AuraDef> = {
  blaze_wing: {
    scope: "owner",
    text: (v) => `이 정령이 화상을 부여할 때마다 화상을 ${v} 더 ${polite("부여하")}.`,
    burnBonus: (_s, v) => v,
  },
  deep_water: {
    scope: "owner",
    text: (v, sc) => `내 턴 시작 시 방어도를 ${sc(v, "guard")} ${polite("얻")}.`,
    turnStart: (b, s, v) => b.gainBlock(s, scale(v, b.stat(s, "guard"))),
  },
  root_down: {
    scope: "owner",
    text: (v, sc) => `내 턴이 끝날 때 HP가 가장 낮은 아군의 HP를 ${sc(v, "focus")} ${polite("회복하")}.`,
    turnEnd(b, s, v) {
      if (s.downed) return;
      const tgt = b.aliveSpirits().sort((a, c) => a.hp - c.hp)[0];
      if (tgt) b.healSpirit(tgt, round(scale(v, b.stat(s, "focus")) * b.passiveMult(s, "healMult")));
    },
  },
  eye_of_storm: {
    scope: "battle",
    text: (v) => `매 턴 ${v}번째로 사용하는 카드의 비용이 0이 ${polite("되")}.`,
    cost(b, calc, v) {
      if (b.playedThisTurn.length === v - 1) calc.cost = 0;
    },
  },
};

/** 각성체의 해방. 정령별 값은 constants.json의 release_* 표에 있어요. */
export const RELEASE: Passive = {
  cost(_b, calc) {
    const down = (C.release_cost_down as Record<string, number>)[calc.owner.id];
    if (down) calc.cost -= down;
  },
  healMult: (s) => (C.release_heal_mult as Record<string, number>)[s.id] ?? 1,
  damageMult: (s) => (C.release_damage_mult as Record<string, number>)[s.id] ?? 1,
  burnMult: (s) => (C.release_burn_mult as Record<string, number>)[s.id] ?? 1,
  chillMult: (s) => (C.release_chill_mult as Record<string, number>)[s.id] ?? 1,
  keepsBlock: (s) => (C.release_keep_block as string[]).includes(s.id),
  taunts: (s) => (C.release_taunt as string[]).includes(s.id),
};

/** 기믹 성격. 수치 성격(kind: "stat")은 능력치 계산(`stats.ts`)에서 처리해요. v는 성격의 value예요. */
export const PERSONALITY_PASSIVES: Record<string, Passive> = {
  brave: {
    stat(s, k, value) {
      const p = s.personality!;
      return k === p.stat && s.hp <= s.maxHp * (p.hpBelow ?? 0.5) ? value * (p.mult ?? 1) : value;
    },
  },
  kind: { supportMult: (s) => s.personality?.mult ?? 1 },
  cheerful: {
    firstHand(b, s, v) {
      b.drawCards(v);
      b.log(`${s.def.name}(명랑): 카드 ${v}장 더 뽑음`);
    },
  },
  playful: {
    afterHand(b, s) {
      const mine = b.hand.filter((c) => c.owner === s.id && cardCostOf(b, c) > 0);
      if (!mine.length) return;
      const c = b.rng.pick(mine);
      c.tempCostDelta -= 1;
      b.log(`${s.def.name}(장난): ${cardDef(c.cardId).name} 비용 -1`);
    },
  },
  stubborn: {
    afterPlay(b, s, _v, c, def) {
      if (c.isCopy || s.stubbornUsed || s.playedThisTurn !== 2 || b.hand.length >= C.hand_max) return;
      s.stubbornUsed = true;
      b.hand.push({ uid: b.newCardUid(), cardId: c.cardId, owner: c.owner, tempCostDelta: 0, locked: false, isCopy: true, grow: 0 });
      b.log(`${s.def.name}(고집): ${def.name} 복사본 얻음`);
    },
  },
};

/** 이 정령에게 지금 붙어 있는 것들과 값. 순서: 지속 효과 → 해방 → 성격 */
export function passivesOf(s: BSpirit): [Passive, number][] {
  const out: [Passive, number][] = [];
  for (const [id, v] of s.auras) out.push([AURAS[id], v]);
  if (s.release > 0) out.push([RELEASE, 0]);
  const p = s.personality && PERSONALITY_PASSIVES[s.personality.id];
  if (p) out.push([p, s.personality!.value ?? 1]);
  return out;
}

/** 카드 비용. 기본값 + 임시 보정 → 주인에게 붙은 것들 → 전투 전체 지속 효과 → 0 아래로 내려가지 않아요. */
export function cardCostOf(b: Engine, c: BCard): number {
  const owner = b.spirit(c.owner);
  const calc: CostCalc = { card: c, owner, cost: cardDef(c.cardId).cost + c.tempCostDelta };
  for (const [p, v] of passivesOf(owner)) p.cost?.(b, calc, v);
  for (const [id, v] of b.battleAuras) AURAS[id].cost?.(b, calc, v);
  return Math.max(0, calc.cost);
}
