import { C } from "../data";
import { activeTiers, round, scale } from "../stats";
import { polite } from "../korean";
import type { AuraId, CardDef, StatKey } from "../types";
import type { Engine } from "./engine";
import { statusN, type BCard, type BEnemy, type BSpirit } from "./state";

/** 비용 계산 중간값 */
export interface CostCalc {
  card: BCard;
  owner: BSpirit;
  cost: number;
}

/**
 * 정령에 붙어 이벤트에 반응하는 것: 지속 효과(aura) · 성격 · 해방.
 * 한 정령 안에서는 지속 효과 → 해방 → 성격 순서예요.
 * 이름이 `Any`로 끝나는 훅은 누구의 일이든 모든 정령의 것이 불려요. 그 밖의 훅은 그 정령 자신의 일에만 불려요.
 */
export interface Passive {
  /** 턴 시작, 이 정령의 턴 값이 지워진 직후 */
  turnStart?: (b: Engine, s: BSpirit, v: number) => void;
  /** 첫 턴, 손패를 받은 직후 */
  firstHand?: (b: Engine, s: BSpirit, v: number) => void;
  /** 매 턴, 손패를 받은 직후 */
  afterHand?: (b: Engine, s: BSpirit, v: number) => void;
  /** 턴 끝, 이 정령의 상태 처리 직후 (품기 전) */
  turnEnd?: (b: Engine, s: BSpirit, v: number) => void;
  /** 턴 끝, 품기가 끝나고 손을 버리기 전 */
  beforeDiscard?: (b: Engine, s: BSpirit, v: number) => void;
  /** 카드를 놓은 직후 */
  afterPlay?: (b: Engine, s: BSpirit, v: number, card: BCard, def: CardDef) => void;
  /** 누구의 카드든 재생된 직후 */
  resolvedAny?: (b: Engine, s: BSpirit, v: number, owner: BSpirit, card: BCard, def: CardDef) => void;
  /** 능력치 보정 */
  stat?: (s: BSpirit, k: StatKey, value: number, v: number) => number;
  /** 이 정령 카드의 비용 보정 */
  cost?: (b: Engine, calc: CostCalc, v: number) => void;
  /** 누구의 카드든 비용 보정 */
  costAny?: (b: Engine, calc: CostCalc, v: number) => void;
  /** 화상 부여량에 더하는 값 */
  burnBonus?: (s: BSpirit, v: number) => number;
  healMult?: (s: BSpirit, v: number) => number;
  /** 아군에게 거는 회복·방어도 배율 */
  supportMult?: (s: BSpirit, v: number) => number;
  damageMult?: (s: BSpirit, v: number) => number;
  burnMult?: (s: BSpirit, v: number) => number;
  chillMult?: (s: BSpirit, v: number) => number;
  /** 누구의 타격이든 기본값에 더하는 값 */
  hitBonusAny?: (b: Engine, s: BSpirit, v: number, attacker: BSpirit, target: BEnemy) => number;
  /** 턴 시작에 방어도를 전부 지키는지 */
  keepsBlock?: (s: BSpirit, v: number) => boolean;
  /** 턴 시작에 남기는 방어도 (지키지 않을 때) */
  carryBlock?: (s: BSpirit, block: number, v: number) => number;
  /** 적의 단일 공격을 받는지 (도발 다음 순서) */
  taunts?: (s: BSpirit, v: number) => boolean;
  /** 이 정령이 벽을 얻은 직후 */
  wallGained?: (b: Engine, s: BSpirit, v: number, amount: number) => void;
  /** 이 정령의 벽이 다른 아군을 대신 막은 직후 */
  wallBlocked?: (b: Engine, s: BSpirit, v: number, attacker: BEnemy, blocked: number) => void;
  /** 이 정령의 벽이 다른 아군을 막다가 깨진 직후 */
  wallBroke?: (b: Engine, s: BSpirit, v: number) => void;
  /** 누구에게든 적의 공격 1타가 들어갈 때 줄이는 값. target이 없으면 미리보기예요 */
  enemyHitCutAny?: (b: Engine, s: BSpirit, v: number, attacker: BEnemy, target: BSpirit | null) => number;
  /** 누구든 적에게 별을 새긴 직후 */
  starMarkedAny?: (b: Engine, s: BSpirit, v: number, marker: BSpirit, target: BEnemy) => void;
  /** 낙하를 고를 때 받는 장 수에 더하는 값 */
  fallPicksAny?: (v: number) => number;
  /** 받아칠 기회가 쌓이는지 (아니면 하나만) */
  readyStacks?: (v: number) => boolean;
  /** 누구든 받아칠 기회를 얻은 직후 */
  readyGainedAny?: (b: Engine, s: BSpirit, v: number, gainer: BSpirit) => void;
  /** 이 정령 카드의 시간에서 빼는 값 (ms) */
  timeCut?: (b: Engine, s: BSpirit, v: number, card: BCard) => number;
  /** 이 정령 타격의 치명 확률에 더하는 값 */
  critChance?: (s: BSpirit, v: number, target: BEnemy) => number;
  /** 이 정령 허점타의 배율에 더하는 값 */
  openingBonus?: (s: BSpirit, v: number) => number;
  /** 적의 상태가 줄어들 때 덜 줄이는 양. 0보다 크면 횟수를 쓴 것으로 표시해요 */
  linger?: (b: Engine, s: BSpirit, v: number) => number;
  /** 누구든 쓰러뜨린 적 */
  enemyDiedAny?: (b: Engine, s: BSpirit, v: number, e: BEnemy) => void;
}

export interface AuraDef extends Passive {
  /** owner: 카드 주인에게 걸려요. target: 카드가 고른 아군에게 걸려요 */
  scope: "owner" | "target";
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
    scope: "owner",
    text: (v) => `매 턴 ${v}번째로 사용하는 카드의 비용이 0이 ${polite("되")}.`,
    costAny(b, calc, v) {
      if (b.playedThisTurn.length === v - 1) calc.cost = 0;
    },
  },

  // 별 정령
  milky_way: {
    scope: "owner",
    text: (v) => `별을 새긴 아군은 방어도를 ${v} ${polite("얻")}.`,
    starMarkedAny: (b, _s, v, marker) => b.gainBlock(marker, v),
  },
  astraea: {
    scope: "owner",
    text: (v) => `별이 새겨진 적이 아군을 공격하면 피해가 ${v} ${polite("줄어들")}.`,
    enemyHitCutAny: (_b, _s, v, attacker) => (statusN(attacker, "star") > 0 ? v : 0),
  },
  starfall: {
    scope: "owner",
    text: (v) => `낙하를 고를 때 ${v} 더 ${polite("받")}.`,
    fallPicksAny: (v) => v,
  },

  // 유리 도롱뇽
  bellows: {
    scope: "owner",
    text: (v) => `이 정령이 벽을 얻을 때마다 반격을 ${v} ${polite("얻")}.`,
    wallGained: (b, s, v) => b.addStatus(s, "thorns", v),
  },
  glass_citadel: {
    scope: "owner",
    text: () => `이 정령의 벽이 내 턴 시작 시 절반 ${polite("남")}.`,
    carryBlock: (_s, block) => Math.floor(block / 2),
  },
  hall_of_mirrors: {
    scope: "owner",
    text: (v, sc) => `이 정령의 벽이 깨지면 모든 적에게 피해를 ${sc(v, "guard")} ${polite("입히")}.`,
    wallBroke(b, s, v) {
      const dmg = round(scale(v, b.stat(s, "guard")));
      b.log(`${s.def.name}: 거울의 방 ${dmg}`);
      for (const e of b.aliveEnemies()) b.hurtEnemy(e, dmg, false);
    },
  },

  // 진주조개
  najeon: {
    scope: "owner",
    text: (v) => `품은 카드를 쓸 때마다 그 주인이 방어도를 ${v} ${polite("얻")}.`,
    resolvedAny(b, _s, v, owner, card) {
      if (card.held) b.gainBlock(owner, v);
    },
  },
  black_pearl: {
    scope: "owner",
    text: (v) => `턴 끝에 카드를 ${v}장 더 ${polite("품")}.`,
    turnEnd: (b, _s, v) => void (b.hold.thisTurn += v),
  },
  dragon_palace: {
    scope: "owner",
    text: (v) => `품은 카드의 주인은 그 카드를 쓰기 전까지 받는 피해가 ${v} ${polite("줄어들")}.`,
    enemyHitCutAny: (b, _s, v, _attacker, target) => (target && b.holdsHeldCard(target) ? v : 0),
  },

  // 산양
  obsidian_horn: {
    scope: "owner",
    text: (v) => `아군이 휘청인 적을 치면 피해가 ${v} ${polite("늘어나")}.`,
    hitBonusAny: (_b, _s, v, _attacker, target) => (statusN(target, "stagger") > 0 ? v : 0),
  },
  rockfall: {
    scope: "owner",
    text: (v) => `휘청인 적이 쓰러지면 다른 적이 모두 휘청을 ${v} ${polite("받")}.`,
    enemyDiedAny(b, _s, v, e) {
      if (statusN(e, "stagger") === 0) return;
      for (const o of b.aliveEnemies()) b.addStatus(o, "stagger", v);
    },
  },

  // 카멜레온
  disguise_veil: {
    scope: "owner",
    text: (v) => `받아칠 기회를 가진 다른 아군은 받는 피해가 ${v} ${polite("줄어들")}.`,
    enemyHitCutAny: (_b, s, v, _attacker, target) => (target && target !== s && statusN(target, "ready") > 0 ? v : 0),
  },
  thousand_eyes: {
    scope: "owner",
    text: () => `받아칠 기회가 ${polite("쌓이")}.`,
    readyStacks: () => true,
  },
  rainbow: {
    scope: "target",
    text: () => `다른 아군이 받아칠 기회를 얻으면 이 아군도 같은 기회를 ${polite("얻")}.`,
    readyGainedAny(b, s, _v, gainer) {
      if (gainer !== s && !s.downed) b.gainReady(s, gainer.status.ready?.strength ?? 0);
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
      b.log(`${s.def.name}(장난): ${b.cardDefOf(c).name} 비용 -1`);
    },
  },
  stubborn: {
    afterPlay(b, s, _v, c, def) {
      if (c.isCopy || s.stubbornUsed || s.playedThisTurn !== 2 || b.hand.length >= C.hand_max) return;
      s.stubbornUsed = true;
      b.hand.push({
        uid: b.newCardUid(), cardId: c.cardId, owner: c.owner,
        tempCostDelta: 0, locked: false, isCopy: true, grow: 0, held: false, heldFast: false,
      });
      b.log(`${s.def.name}(고집): ${def.name} 복사본 얻음`);
    },
  },
};

/** 이 정령에게 지금 붙어 있는 것들과 값. 순서: 지속 효과 → 해방 → 성격 */
/** 장비가 정령의 동사를 바꾸는 효과. 장비 데이터의 `effects[].passive`가 여기 키예요 */
const lingerWith = (mark: "lingerUsed" | "lingerTurnUsed") => (b: Engine, s: BSpirit, v: number) => {
  if (statusN(s, mark) > 0) return 0;
  b.addStatus(s, mark, 1);
  return v;
};
const firstCardTime = (_b: Engine, s: BSpirit, v: number) => (s.playedThisTurn === 0 ? v : 0);

export const EQUIP_PASSIVES: Record<string, Passive> = {
  /** 전투 시작에 방어도 */
  start_block: { firstHand: (b, s, v) => b.gainBlock(s, v) },
  /** 전투 시작에 방어도 + 쓰러졌다 돌아올 때 HP를 더 받아요 (`returnHp`) */
  start_block_return: { firstHand: (b, s, v) => b.gainBlock(s, v) },
  /** 턴 첫 타격의 기본값에 더해요 */
  first_hit: { hitBonusAny: (_b, s, v, attacker) => (attacker === s && statusN(s, "struck") === 0 ? v : 0) },
  /** 이번 턴 가장 긴 카드의 타격마다 기본값에 더해요 */
  longest_card_hit: { hitBonusAny: (b, s, v, attacker) => (attacker === s && b.resolvingLongest(s) ? v : 0) },
  /** 적의 화상 · 약화 · 취약이 줄어들 때 덜 줄어요. 전투마다 한 번 */
  linger_once: { linger: lingerWith("lingerUsed") },
  /** 턴마다 한 번 */
  linger_turn: { linger: lingerWith("lingerTurnUsed") },
  /** 턴 첫 카드의 시간을 줄여요 (ms) */
  first_card_time: { timeCut: firstCardTime },
  /** 턴 첫 카드의 시간 + 허점타 배율 */
  first_card_time_opening: { timeCut: firstCardTime, openingBonus: () => C.equip_opening_bonus },
  /** HP가 가득인 적에게 치명 확률 */
  crit_vs_full: { critChance: (_s, v, e) => (e.hp >= e.maxHp ? v : 0) },
  /** HP가 절반보다 많은 적에게 치명 확률 */
  crit_vs_healthy: { critChance: (_s, v, e) => (e.hp > e.maxHp / 2 ? v : 0) },
  /** 턴 첫 카드의 비용 */
  first_card_cost: { cost: (_b, calc, v) => { if (calc.owner.playedThisTurn === 0) calc.cost -= v; } },
  /** 모든 카드의 시간을 줄여요 (ms) */
  time_cut: { timeCut: (_b, _s, v) => v },
  /** 턴 시작에 방어도를 비율만큼 남겨요 */
  carry_block: { carryBlock: (_s, block, v) => Math.floor(block * v) },
};

/** 정령에 붙은 것들: 지속 효과 → 해방 → 성격 → 장비 */
export function passivesOf(s: BSpirit): [Passive, number][] {
  const out: [Passive, number][] = [];
  for (const [id, v] of s.auras) out.push([AURAS[id], v]);
  if (s.release > 0) out.push([RELEASE, 0]);
  const p = s.personality && PERSONALITY_PASSIVES[s.personality.id];
  if (p) out.push([p, s.personality!.value ?? 1]);
  for (const e of s.run.equipment) for (const t of activeTiers(e)) for (const ef of t.effects ?? []) out.push([EQUIP_PASSIVES[ef.passive], ef.value]);
  return out;
}

/** `Any` 훅: 쓰러진 정령 것까지 모든 정령의 것을 정령 순서로 */
export function allPassives(b: Engine): [Passive, number, BSpirit][] {
  const out: [Passive, number, BSpirit][] = [];
  for (const s of b.spirits) for (const [p, v] of passivesOf(s)) out.push([p, v, s]);
  return out;
}

/** 카드 비용. 기본값 + 임시 보정 → 주인에게 붙은 것들 → 모든 정령의 지속 효과 → 0 아래로 내려가지 않아요. */
export function cardCostOf(b: Engine, c: BCard): number {
  const owner = b.spirit(c.owner);
  const calc: CostCalc = { card: c, owner, cost: b.cardDefOf(c).cost + c.tempCostDelta };
  for (const [p, v] of passivesOf(owner)) p.cost?.(b, calc, v);
  for (const [p, v] of allPassives(b)) p.costAny?.(b, calc, v);
  return Math.max(0, calc.cost);
}
