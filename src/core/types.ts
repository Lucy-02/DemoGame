export const ELEMENTS = ["fire", "water", "forest", "wind", "light", "earth", "none"] as const;
export type Element = (typeof ELEMENTS)[number];
/** 능력치. 스피드는 카드 시간을 나누는 값이에요 (시간 = 카드 기본 시간 ÷ 스피드, 0036). */
export type StatKey = "hp" | "power" | "guard" | "focus" | "speed";
export const STAT_KEYS: readonly StatKey[] = ["hp", "power", "guard", "focus", "speed"];
export const RARITIES = ["basic", "common", "advanced", "rare"] as const;
export type Rarity = (typeof RARITIES)[number];
export const CARD_TARGETS = ["enemy", "allEnemies", "self", "ally", "allAllies"] as const;
export type CardTarget = (typeof CARD_TARGETS)[number];

export interface SpiritDef {
  id: string;
  name: string;
  nameEn?: string;
  etym: string;
  element: Element;
  role: string;
  body: string;
  motif: string;
  stats: Record<StatKey, number>;
  adultMain: StatKey[];
  /** 해방: 각성체가 전투마다 한 번 켜는 일시 변신 */
  release: { name: string; nameEn: string; desc: string };
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
  // 공통
  | { op: "damage"; value: number; hits?: number; againIf?: "burned"; /** 대상의 별 하나마다 더해요 */ perStar?: number; /** 타격 수 = 대상의 별 수 */ hitsPerStar?: true }
  | { op: "block"; value: number; /** 아군 대상: 모든 적의 별 하나마다 더해요 */ perStar?: number; /** 대상이 품었던 카드의 주인이면 이 값 */ heldOwner?: number }
  | { op: "heal"; value: number }
  | { op: "burn"; value: number }
  | { op: "ignite" }
  | { op: "chill"; value: number }
  | { op: "freeze"; bossChill: number }
  | { op: "thorns"; value: number }
  | { op: "grow"; value: number }
  | { op: "draw"; value: number; /** 받아칠 기회가 있으면 이만큼 */ ifReady?: number }
  | { op: "vulnerable"; turns: number }
  | { op: "weak"; turns: number }
  | { op: "empower"; value: number }
  | { op: "taunt" }
  | { op: "moveFront" }
  | { op: "manaNextTurn"; value: number }
  | { op: "aura"; aura: AuraId; value: number }
  | { op: "damageFromBlock"; /** 쓴 방어도를 없애요 */ spend?: true }
  | { op: "burnMultiply"; value: number }
  | { op: "damagePerPlayed"; element: Element; value: number }
  | { op: "repeatNext"; maxCost: number }
  | { op: "combo"; n: number; then: CardOp[] }
  /** 다음 타격 hits번에 value를 더해요 */
  | { op: "hitBonus"; value: number; hits: number }
  // 별 정령
  /** 대상 아군의 다음 타격 hits번이 맞힌 적에게 별을 새겨요 */
  | { op: "starlight"; hits: number }
  /** 대상 적에게 별을 새겨요. ifStarred: 별이 있는 적에게만 */
  | { op: "star"; value: number; ifStarred?: true }
  | { op: "clearStars" }
  | { op: "starThresholdCut"; value: number }
  /** 지금 낙하를 골라요 (문턱 무관) */
  | { op: "fallNow" }
  /** 다음 턴 시작에 같은 적에게 피해 */
  | { op: "delayedHit"; value: number }
  // 유리 도롱뇽
  | { op: "wall"; value: number }
  | { op: "wallHeat"; value: number }
  | { op: "afterglow"; value: number }
  /** 이번 턴 벽이 막은 피해의 pct만큼 그 적에게 */
  | { op: "ricochet"; pct: number }
  // 진주조개
  | { op: "hold"; value: number }
  | { op: "highTide" }
  /** 이 카드를 품을 때마다 수치가 value 늘어나요 */
  | { op: "growOnHold"; value: number }
  // 산양
  /** 차징 중인 적이면 브레이크 + 휘청 onBreak, 아니고 허점 창이면 휘청 value */
  | { op: "ram"; value: number; onBreak: number }
  | { op: "staggerIfOpening"; value: number }
  | { op: "staggerIfStaggered"; value: number }
  | { op: "timeCutNext"; value: number }
  | { op: "breakCharging" }
  | { op: "cancelNext" }
  // 카멜레온
  /** 숨어요. readyTo: 받아칠 기회를 고른 아군이 받아요 */
  | { op: "hide"; readyTo?: "target" }
  /** 이 카드는 받아칠 기회를 쓰지 않아요 */
  | { op: "keepReady" }
  | { op: "passReady" };

export const AURA_IDS = [
  "blaze_wing", "deep_water", "root_down", "eye_of_storm",
  "milky_way", "astraea", "starfall",
  "bellows", "glass_citadel", "hall_of_mirrors",
  "najeon", "black_pearl", "dragon_palace",
  "obsidian_horn", "rockfall",
  "disguise_veil", "thousand_eyes", "rainbow",
] as const;
export type AuraId = (typeof AURA_IDS)[number];

/** 카드를 얻는 곳 (0040). reward: 전투 보상(기본). shop: 상점 · 이벤트만. start: 시작 덱만. generated: 전투 중 생기는 카드 */
export const OBTAINS = ["reward", "shop", "start", "generated"] as const;
export type Obtain = (typeof OBTAINS)[number];

/** 카드 데이터 파일(src/data/cards/*.json)의 한 줄. 이름 같은 문구는 언어별 표(src/data/locales)에 있어요. */
export interface CardData {
  id: string;
  element: Element;
  role: string;
  rarity: Rarity;
  cost: number;
  /** 기본 시간(ms). 실제 시간 = 기본 시간 × 기준 스피드 ÷ 정령 스피드 (0036) */
  ms: number;
  target: CardTarget;
  effects: CardOp[];
  exhaust?: boolean;
  start?: number;
  /** 시작 덱에서 이 카드를 배운 정령. 없으면 같은 속성의 첫 정령. */
  startOwner?: string;
  /** 파티의 모든 정령이 시작 덱에 이만큼씩 배워요 (할퀴기 · 막기) */
  startEach?: number;
  /** 이 정령만 배우는 전용 카드 (0041). 없으면 속성으로 정해요. */
  spirit?: string;
  /** 얻는 곳. 없으면 reward */
  obtain?: Obtain;
  unlock: string;
  /** 갈래 표시 (0027). 이 카드를 받으면 주인 정령의 이 갈래 쪽으로 세요. 갈래 id는 growth.json evolutions의 branch */
  branch?: string;
}

/** 게임이 쓰는 카드 = 데이터 + 지금 언어의 문구 */
export interface CardDef extends CardData {
  name: string;
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
  /** 턴 안에서 이 행동이 일어나는 시각(ms). 없으면 등급 기본값 C.enemy_at (0036) */
  at?: number;
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
  desc?: string;
  pattern: EnemyMove[];
  phase2?: { hpBelow: number; turnStartBlock: number; pattern: EnemyMove[] };
}

export interface EncounterDef {
  id: string;
  tier: "normal" | "elite" | "boss";
  floors: [number, number];
  enemies: string[];
}

/** 출전 인원에 맞춘 적 세기 (0053). HP · 방어 · 회복에 hp, 피해에 dmg를 곱해요 */
export interface EnemyScale {
  hp: number;
  dmg: number;
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

/** 성장 단계 (결정 0021) */
export type Stage = "baby" | "adult" | "awakened";
export const STAGES: readonly Stage[] = ["baby", "adult", "awakened"];

/** 런 동안 유지되는 정령 상태. */
export interface RunSpirit {
  id: string;
  hp: number;
  maxHpBonus: number;
  stage: Stage;
  level: number;
  personality: string;
  /** 성체에서 고른 갈래 (0027). 유체이거나 아직 갈래가 없으면 비어요 */
  branch?: string;
  /** 이번 런에 지닌 장비 (0048 · 0049 · 0056). 길이 ≤ 단계별 칸 수 */
  equipment: RunEquip[];
}

// ───────────────────────── 장비 (0048 · 0049 · 0055 · 0056) ─────────────────────────

/** 장비가 보정하는 수치. 치명 확률 · 치명 피해는 파생 수치예요 */
export const EQUIP_STATS = [...STAT_KEYS, "crit_chance", "crit_mult"] as const;
export type EquipStat = (typeof EQUIP_STATS)[number];
export const STAT_MOD_OPS = ["add", "pct"] as const;
export type StatModOp = (typeof STAT_MOD_OPS)[number];

/** 전투 중에만 보는 조건. 있으면 전투 조건부 층에서 적용돼요 */
export type StatCondition = { k: "hpBelow"; ratio: number } | { k: "released" };
export const STAT_CONDITION_KINDS = ["hpBelow", "released"] as const;

export interface StatMod {
  stat: EquipStat;
  /** add: 고정값. pct: 비율(0.1 = +10%) */
  op: StatModOp;
  value: number;
  when?: StatCondition;
}

/** 정령의 동사를 바꾸는 효과: `EQUIP_PASSIVES`의 항목 하나 */
export interface EquipEffect {
  passive: string;
  value: number;
}

/** 공명 단계 하나 */
export interface EquipTier {
  stats?: StatMod[];
  effects?: EquipEffect[];
}

/** 희귀도 (0056). generic: 누구나, 능력치 위주(정예). exclusive: 정령 전용 무기, 대표 카드를 바꿈(정예). boss: 규칙을 건드리고 대가가 붙음(보스) */
export const EQUIP_RARITIES = ["generic", "exclusive", "boss"] as const;
export type EquipRarity = (typeof EQUIP_RARITIES)[number];

/** 전용 무기가 대표 카드 한 장을 무기의 기술로 바꿔요 (0055). 기술은 정령의 갈래를 따라요 (0056) */
export interface SignatureSwap {
  /** 바뀌는 대표 카드 id */
  card: string;
  /** 갈래 → 공명 단계별 기술 카드 id. 길이는 tiers와 같아요 */
  techniques: Record<string, string[]>;
}

export interface EquipDef {
  id: string;
  /** 전용 정령 id. null이면 누구나 */
  owner: string | null;
  rarity: EquipRarity;
  /** 공명 n이면 tiers[n-1]. 길이 = 공명 상한 */
  tiers: EquipTier[];
  /** 보스 장비의 대가. 공명과 무관하게 늘 적용 */
  downside?: EquipTier;
  /** 전용 무기만: 대표 카드 변형 */
  signature?: SignatureSwap;
  opensBranch?: { spirit: string; branch: string };
}

export interface RunEquip {
  id: string;
  resonance: number;
  from: "kept" | "run";
  /** 이번 런에 같은 장비를 또 얻어 오른 공명. 런이 끝나면 사라져요 (0056) */
  runBonus?: number;
}

/** 자람 조건: 전투 이벤트로 세는 행동 누적 (0021 2절) */
export interface DeedDef {
  kind: "dealt" | "blocked" | "freeze";
  n: number;
}

/** 진화 한 줄. 같은 정령·같은 from이 둘 이상이면 분기 (0015) */
export interface EvolutionDef {
  spirit: string;
  from: Stage;
  to: Stage;
  level: number;
  deed?: DeedDef;
  /** 분기 진화의 갈래 id (0027). 같은 정령·같은 전 단계 줄이 둘 이상이면 갈래 고르기예요 */
  branch?: string;
  /** 갈래가 열리는 조건. 없으면 늘 열려 있어요. cards = 한 탐험에서 이 갈래 표시 카드를 받은 수 */
  opens?: { cards: number };
}

export interface EpisodeDef {
  affinity: number;
  stage?: Stage;
}

export interface GrowthDef {
  levels: number[];
  level_hp: number;
  exp: Record<"normal" | "elite" | "boss", number>;
  material: Record<"normal" | "elite" | "boss", number>;
  stage_main_bonus: number;
  stage_hp_main_bonus: number;
  /** 단계별(유체 · 성체 · 각성체) 장비 칸 수. 지니는 수와 런 끝에 남기는 수가 같아요 (0056) */
  equip_slots: number[];
  /** 단계별 공명 상한 */
  equip_resonance_cap: number[];
  evolutions: EvolutionDef[];
  feed: { cost: number; affinity: number };
  episodes: EpisodeDef[];
}
