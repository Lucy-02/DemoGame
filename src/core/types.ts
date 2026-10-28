export type Element = "fire" | "water" | "forest" | "wind" | "none";
export type StatKey = "hp" | "power" | "guard" | "focus" | "sync";
export type Rarity = "basic" | "common" | "advanced" | "rare";
export type CardTarget = "enemy" | "allEnemies" | "self" | "ally" | "allAllies";

export interface SpiritDef {
  id: string;
  name: string;
  etym: string;
  element: Element;
  role: string;
  body: string;
  motif: string;
  stats: Record<StatKey, number>;
  adultMain: StatKey[];
  awaken: { name: string; nameEn: string; desc: string };
}

export interface PersonalityDef {
  id: string;
  name: string;
  kind: "stat" | "gimmick";
  desc: string;
  stat?: StatKey;
  mult?: number;
  hpBelow?: number;
  value?: number;
}

export type CardOp =
  | { op: "damage"; value: number; hits?: number; againIf?: "burned" }
  | { op: "block"; value: number }
  | { op: "heal"; value: number }
  | { op: "burn"; value: number }
  | { op: "ignite" }
  | { op: "chill"; value: number }
  | { op: "freeze"; bossChill: number }
  | { op: "thorns"; value: number }
  | { op: "grow"; value: number }
  | { op: "draw"; value: number }
  | { op: "vulnerable"; turns: number }
  | { op: "weak"; turns: number }
  | { op: "empower"; value: number }
  | { op: "taunt" }
  | { op: "moveFront" }
  | { op: "manaNextTurn"; value: number }
  | { op: "sync"; value: number }
  | { op: "aura"; aura: AuraId; value: number }
  | { op: "damageFromBlock" }
  | { op: "burnMultiply"; value: number }
  | { op: "damagePerPlayed"; element: Element; value: number }
  | { op: "repeatNext"; maxCost: number }
  | { op: "combo"; n: number; then: CardOp[] };

export type AuraId = "blaze_wing" | "deep_water" | "root_down" | "eye_of_storm";

export interface CardDef {
  id: string;
  name: string;
  element: Element;
  role: string;
  rarity: Rarity;
  cost: number;
  target: CardTarget;
  effects: CardOp[];
  exhaust?: boolean;
  start?: number;
  unlock: string;
}

export type EnemyTargetRule = "front" | "random" | "lowest" | "all";

export type EnemyAction =
  | { type: "attack"; dmg: number; hits?: number; target: EnemyTargetRule; pierce?: boolean }
  | { type: "block"; value: number }
  | { type: "weak"; turns: number; target: EnemyTargetRule }
  | { type: "vulnerable"; turns: number; target: EnemyTargetRule }
  | { type: "burn"; value: number; target: EnemyTargetRule }
  | { type: "buffMinions"; value: number }
  | { type: "costUp"; value: number }
  | { type: "sealCards"; count: number }
  | { type: "sapHeal"; value: number };

export interface EnemyMove {
  name: string;
  charge?: boolean;
  actions: EnemyAction[];
}

export type EnemyTier = "normal" | "elite" | "boss" | "minion";

export interface EnemyDef {
  id: string;
  name: string;
  tier: EnemyTier;
  element: Element;
  hp: number;
  shield: number;
  desc?: string;
  pattern: EnemyMove[];
  phase2?: { hpBelow: number; shield: number; turnStartBlock: number; pattern: EnemyMove[] };
}

export interface EncounterDef {
  id: string;
  tier: "normal" | "elite" | "boss";
  floors: [number, number];
  enemies: string[];
}

export type EventOutcome =
  | { type: "healPct"; value: number }
  | { type: "gold"; value: number }
  | { type: "damageAll"; value: number }
  | { type: "damageFront"; value: number }
  | { type: "cardReward"; rarity?: Rarity }
  | { type: "removeCard" }
  | { type: "maxHpAll"; value: number };

export interface EventDef {
  id: string;
  title: string;
  text: string;
  options: { label: string; desc: string; outcome: EventOutcome[] }[];
}

/** 런 동안 유지되는 카드 한 장. owner는 이 카드를 배운 정령. */
export interface DeckCard {
  uid: number;
  cardId: string;
  owner: string;
}

/** 런 동안 유지되는 정령 상태. */
export interface RunSpirit {
  id: string;
  hp: number;
  maxHpBonus: number;
  adult: boolean;
  personality: string;
}
