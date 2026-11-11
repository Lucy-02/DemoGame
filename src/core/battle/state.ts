import type { AuraId, DeckCard, EnemyDef, EnemyTrait, PersonalityDef, RunSpirit, SpiritDef } from "../types";

/** 상태 이름. 표(`statuses.ts`의 STATUSES)가 쌓는 법과 줄어드는 때를 정해요. 턴 끝 처리는 이 순서예요. */
export const STATUS_IDS = [
  // 공통
  "burn", "chill", "regen", "vuln", "weak", "thorns", "taunt", "empower", "bonusDmg", "hitBonus",
  // 전용 무기의 기술 (0055)
  "burnHold", "spreadStack", "burnCarry", "wallKeep", "wallEcho", "wallBurst", "frostGuard", "struck", "lingerUsed", "lingerTurnUsed",
  // 별 정령
  "star", "starlight", "comet",
  // 유리 도롱뇽
  "wall", "wallHeat", "wallBroken", "wallTaken", "afterglow",
  // 산양
  "stagger", "cancelNext", "footing",
  // 보스의 틈 (0062)
  "gap",
  // 카멜레온
  "hidden", "ready",
] as const;
export type StatusId = (typeof STATUS_IDS)[number];

/** 상태 하나의 쌓인 양 */
export interface StatusStack {
  n: number;
  /** 적 턴에 걸린 상태: 이번 라운드 끝에는 줄지 않아요 */
  fresh: boolean;
  /** 세기 (취약: 추가 피해 비율, 타격 보너스: 타격마다 더하는 값) */
  strength: number;
  /** 이 턴의 라운드 끝에 사라져요 */
  until?: number;
  /** 연결된 정령 id (숨음: 받아칠 기회를 받을 아군) */
  ref?: string;
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
/** 상태를 n만큼 쓰고, 0이 되면 지워요. */
export function spendStatus(h: StatusHolder, id: StatusId, n = 1) {
  const st = h.status[id];
  if (!st) return;
  st.n -= n;
  if (st.n <= 0) delete h.status[id];
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
  /** 거친 특성 (정예, 0062) */
  traits: EnemyTrait[];
  /** 이번 큰 차징 동안 받은 피해 */
  chargeDmg: number;
  /** 이번 큰 차징에서 틈이 이미 열렸는지 */
  gapOpened: boolean;
  /** 세지는 화상을 쓴 횟수 */
  ramp: number;
}

export const isEnemy = (h: BSpirit | BEnemy): h is BEnemy => "uid" in h;

export interface BCard extends DeckCard {
  tempCostDelta: number;
  locked: boolean;
  isCopy: boolean;
  /** 이번 전투 동안 쌓인 주 수치 보너스 */
  grow: number;
  /** 품었다가 돌아온 카드: 효과 × hold_mult, 시간 - hold_time_cut_ms */
  held: boolean;
  /** 밀물 뒤에 돌아온 카드: 기본 시간 절반 */
  heldFast: boolean;
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

/** 별 정령: 새긴 별을 세고 낙하를 내줘요 */
export interface StarState {
  /** 문턱을 향해 세는 별 */
  count: number;
  /** 문턱 줄임 (샛별) */
  thresholdCut: number;
  /** 다음 턴 시작에 열 낙하 고르기 수 */
  pendingFalls: number;
  /** 지금 열린 낙하 고르기 */
  choice: FallChoice | null;
}
export interface FallChoice {
  /** 고를 수 있는 낙하 카드 id */
  options: string[];
  /** 받을 장 수 */
  picks: number;
  /** 낙하 카드의 주인 */
  owner: string;
}

/** 진주조개: 턴 끝에 품고 다음 턴 시작에 돌려줘요 */
export interface HoldState {
  /** 이번 턴 끝에 품을 장 수 */
  thisTurn: number;
  /** 플레이어가 먼저 골라 둔 카드 uid (고른 순서) */
  picks: number[];
  /** 품고 있는 카드 */
  held: BCard[];
  /** 밀물: 다음에 돌아오는 카드는 기본 시간 절반 */
  highTide: boolean;
  /** 다음 턴 더 뽑는 수 (용궁) */
  nextTurnDraw: number;
}

export type Ref = { side: "s"; id: string } | { side: "e"; uid: number };
export const refOf = (h: BSpirit | BEnemy): Ref => (isEnemy(h) ? { side: "e", uid: h.uid } : { side: "s", id: h.id });

/** 연출용 이벤트. 확정된 결과만 담아요 (0001). */
export type BattleEvent =
  | { k: "log"; text: string }
  | { k: "damage"; ref: Ref; amount: number; blocked: number; crit?: boolean; weakHit?: boolean; resist?: boolean; opening?: boolean; wall?: number }
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
  | { k: "phase2"; uid: number }
  | { k: "fallOffer"; owner: string; picks: number }
  | { k: "fall"; owner: string; card: string }
  | { k: "hold"; owner: string; card: string }
  | { k: "ready"; id: string }
  | { k: "gap"; uid: number; turns: number; reason: "break" | "delay" | "burst" };

export interface Intent {
  name: string;
  /** 이번 턴 이 행동이 일어나는 시각(ms). 이번 턴에 행동하지 않으면 null */
  at: number | null;
  /** "피해 6", "4×2" 같은 짧은 표기 */
  text: string;
  kind: "attack" | "defend" | "debuff" | "buff" | "charge" | "chargeReady" | "skip";
}

export type BattleResult = "ongoing" | "victory" | "defeat";
