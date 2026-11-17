// 카드 연출의 조각: 카드 한 장을 "효과 종류의 줄"로 풀어요. 그림 · 시간 · 색은 여기 없어요 (방향은 Lucy가 고른 뒤 레시피에).
// 128장에 전용 연출을 만들지 않고 조각 × 속성 × 무게의 조합으로 내려고, 카드의 op를 조각으로 묶어요. 정의: docs/design/systems/card-fx.md
import type { CardData, CardOp, Element } from "../../../core/types";

/** 연출 조각. 이름은 문서용이고 게임 안 문구가 아니에요 */
export const PIECES = [
  // 치기
  "strike", "multi", "sweep", "scatter",
  // 적에게 붙임
  "burn", "chill", "delay", "freeze", "debuff", "star", "stagger", "spread",
  // 터뜨림 (쌓은 것 · 걸린 것의 결실)
  "ignite", "starburst", "break", "cancel",
  // 지킴
  "block", "wall", "heal", "stance",
  // 아군에게 건넴 · 걸어 둠
  "give", "arm",
  // 손패 · 시간
  "draw", "mana", "tempo", "hold",
  // 전투 내내
  "aura",
] as const;
export type Piece = (typeof PIECES)[number];

/** 무게: 카드의 기본 시간에서 와요 (느린 카드가 무거워요) */
export type Weight = "light" | "normal" | "heavy";
/** 크기: 보통, 또는 결실(쌓은 것을 터뜨리거나 흐름을 끊는 순간) */
export type Tier = "plain" | "payoff";

export interface CardFx {
  pieces: Piece[];
  element: Element;
  weight: Weight;
  tier: Tier;
  /** 쓰고 나면 그 전투에서 사라져요 */
  exhaust: boolean;
}

type Op = CardOp["op"];
type PieceOf = Piece | ((op: CardOp, card: CardData) => Piece);

const hit: PieceOf = (op, card) => {
  if (card.target === "allEnemies") return "sweep";
  return op.op === "damage" && (op.hits ?? 1) > 1 ? "multi" : "strike";
};

/** op → 조각. 새 op를 더하면 여기에도 더해요 (pieces.test.ts가 빠진 op를 잡아요) */
export const PIECE_OF: Record<Op, PieceOf> = {
  damage: hit, damageFromBlock: "strike", damagePerPlayed: hit, ram: "stagger", randomHits: "scatter", combo: "multi",
  burn: "burn", burnMore: "burn", burnHold: "burn", burnMultiply: "burn",
  burnSpread: "spread", burnCarry: "spread", burnShare: "spread",
  ignite: "ignite",
  chill: "chill", delayNext: "delay", delayAgain: "delay", chillToDelay: "delay", freeze: "freeze",
  weak: "debuff", vulnerable: "debuff",
  star: "star", clearStars: "starburst", starsToHitBonus: "starburst", fallNow: "starburst",
  staggerIfOpening: "stagger", staggerIfStaggered: "stagger",
  breakCharging: "break", cancelNext: "cancel",
  block: "block", blockLowest: "block", blockPerStaggered: "block", blockHeldOwners: "block",
  wall: "wall",
  heal: "heal",
  taunt: "stance", hide: "stance", moveFront: "stance",
  empower: "give", hitBonus: "give", starlight: "give", starAim: "give", passReady: "give", keepReady: "give",
  thorns: "arm", wallHeat: "arm", afterglow: "arm", wallEcho: "arm", wallBurst: "arm", tempered: "arm", ricochet: "arm", frostGuardAll: "arm", delayedHit: "arm",
  draw: "draw", drawPerChilled: "draw",
  manaNextTurn: "mana",
  timeCutNext: "tempo", repeatNext: "tempo", highTide: "tempo", starThresholdCut: "tempo",
  hold: "hold", growOnHold: "hold", grow: "tempo",
  aura: "aura",
};

const PAYOFF: ReadonlySet<Piece> = new Set(["ignite", "starburst", "break", "cancel", "freeze", "aura"]);
/** 기본 시간 경계 (ms): 이보다 짧으면 가벼움, 이보다 길면 무거움. 데이터의 시간 분포에서 잡은 값이에요 */
export const WEIGHT_MS = { light: 600, heavy: 1400 };

export function cardFx(card: CardData): CardFx {
  const pieces: Piece[] = [];
  for (const op of card.effects) {
    const of = PIECE_OF[op.op];
    const piece = typeof of === "function" ? of(op, card) : of;
    if (pieces.at(-1) !== piece) pieces.push(piece);
  }
  return {
    pieces,
    element: card.element,
    weight: card.ms <= WEIGHT_MS.light ? "light" : card.ms >= WEIGHT_MS.heavy ? "heavy" : "normal",
    tier: pieces.some((p) => PAYOFF.has(p)) ? "payoff" : "plain",
    exhaust: !!card.exhaust,
  };
}
