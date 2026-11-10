import type { AuraId, DeckCard, EnemyDef, PersonalityDef, RunSpirit, SpiritDef } from "../types";

/** 상태 이름. 표(`statuses.ts`의 STATUSES)가 쌓는 법과 줄어드는 때를 정해요. */
export const STATUS_IDS = [
  "burn", "chill", "regen", "vuln", "weak", "thorns", "taunt", "empower", "keepBlock", "bonusDmg",
] as const;
export type StatusId = (typeof STATUS_IDS)[number];

/** 상태 하나의 쌓인 양 */
export interface StatusStack {
  n: number;
  /** 적 턴에 걸린 상태: 이번 라운드 끝에는 줄지 않아요 */
  fresh: boolean;
  /** 세기 (취약: 추가 피해 비율) */
  strength: number;
}
export type StatusMap = Partial<Record<StatusId, StatusStack>>;

export interface StatusHolder {
  status: StatusMap;
}
export const statusN = (h: StatusHolder, id: StatusId): number => h.status[id]?.n ?? 0;
export const statusStrength = (h: StatusHolder, id: StatusId): number => h.status[id]?.strength ?? 0;
/** 상태 칸을 돌려줘요. 없으면 0으로 만들어요. */
export function stackOf(h: StatusHolder, id: StatusId): StatusStack {
  return (h.status[id] ??= { n: 0, fresh: false, strength: 0 });
}

export interface BSpirit extends StatusHolder {
  id: string;
  def: SpiritDef;
  run: RunSpirit;
  personality: PersonalityDef | null;
  hp: number;
  maxHp: number;
  block: number;
  /** 해방이 남은 턴. 0이면 꺼져 있어요. */
  release: number;
  /** 해방은 각성체만, 전투마다 한 번 */
  releaseUsed: boolean;
  critPity: number;
  downed: boolean;
  /** 이 정령에게 걸린 지속 효과와 값 */
  auras: Map<AuraId, number>;
  playedThisTurn: number;
  stubbornUsed: boolean;
}

export interface BEnemy extends StatusHolder {
  uid: number;
  def: EnemyDef;
  hp: number;
  maxHp: number;
  block: number;
  patternIdx: number;
  phase: 1 | 2;
  charging: boolean;
  /** 차징을 시작한 턴. 그 턴에는 행동하지 않고 다음 턴 박힌 시각에 터져요. */
  chargeTurn: number;
  /** 빙결로 다음 턴 행동에 더해질 늦춤(ms) */
  delayNext: number;
  /** 축 끝을 넘겨 밀린 행동: 다음 턴 이 시각에 일어나요 (0036 뼈대 2) */
  carryAt: number | null;
  dead: boolean;
}

export const isEnemy = (h: BSpirit | BEnemy): h is BEnemy => "uid" in h;

export interface BCard extends DeckCard {
  tempCostDelta: number;
  locked: boolean;
  isCopy: boolean;
  grow: number;
}

/** 계획된 아군 카드. 턴 종료 때 끝나는 시각 순서로 재생돼요 (0036). */
export interface Planned {
  card: BCard;
  owner: string;
  target?: Ref;
  start: number;
  end: number;
  comboCount: number;
  repeat: boolean;
}

/** 이번 턴 시간축에 박힌 적 행동 */
export interface EnemySlot {
  uid: number;
  at: number;
  done: boolean;
}

export type Ref = { side: "s"; id: string } | { side: "e"; uid: number };
export const refOf = (h: BSpirit | BEnemy): Ref => (isEnemy(h) ? { side: "e", uid: h.uid } : { side: "s", id: h.id });

/** 연출용 이벤트. 확정된 결과만 담아요 (0001). */
export type BattleEvent =
  | { k: "log"; text: string }
  | { k: "damage"; ref: Ref; amount: number; blocked: number; crit?: boolean; weakHit?: boolean; resist?: boolean; opening?: boolean }
  | { k: "heal"; ref: Ref; amount: number }
  | { k: "block"; ref: Ref; amount: number }
  | { k: "status"; ref: Ref; text: string }
  | { k: "freeze"; uid: number }
  | { k: "delay"; uid: number; ms: number; nextTurn: boolean }
  | { k: "cancel"; uid: number; reason: string }
  | { k: "charge"; uid: number; move: string }
  | { k: "enemyAct"; uid: number; move: string }
  | { k: "spiritAct"; id: string; card: string }
  | { k: "release"; id: string }
  | { k: "releaseEnd"; id: string }
  | { k: "downed"; id: string }
  | { k: "enemyDead"; uid: number }
  | { k: "phase2"; uid: number };

export interface Intent {
  name: string;
  /** 이번 턴 이 행동이 일어나는 시각(ms). 이번 턴에 행동하지 않으면 null */
  at: number | null;
  /** "피해 6", "4×2" 같은 짧은 표기 */
  text: string;
  kind: "attack" | "defend" | "debuff" | "buff" | "charge" | "chargeReady" | "skip";
}

export type BattleResult = "ongoing" | "victory" | "defeat";
