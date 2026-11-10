import type { Rng } from "../rng";
import type { AuraId, Element, EnemyTargetRule, StatKey } from "../types";
import type { BCard, BEnemy, BSpirit, BattleEvent, StatusId } from "./state";

/** 효과 핸들러 · 상태 표 · 지속 효과가 쓰는 규칙 원시 동작. `Battle`이 구현해요. */
export interface Engine {
  readonly rng: Rng;
  spirits: BSpirit[];
  enemies: BEnemy[];
  hand: BCard[];
  draw: BCard[];
  discard: BCard[];
  turn: number;
  mana: number;
  frontId: string;
  /** 재생 중 지금 시각(ms) */
  now: number;
  /** 턴 종료 뒤 시간축을 재생하는 중 */
  replaying: boolean;
  playedThisTurn: BCard[];
  playedByElement: Partial<Record<Element, number>>;
  nextTurnMana: number;
  /** 이번 턴 다음 카드를 한 번 더 발동시키는 효과 (바람길) */
  repeatNext: { maxCost: number } | null;
  /** 주인 없이 전투 전체에 걸린 지속 효과 */
  battleAuras: Map<AuraId, number>;

  aliveSpirits(): BSpirit[];
  aliveEnemies(): BEnemy[];
  spirit(id: string): BSpirit;
  enemy(uid: number): BEnemy;
  stat(s: BSpirit, k: StatKey): number;
  chillThreshold(e: BEnemy): number;
  /** 끝나는 시각 t가 적 e의 남은 행동 직전 창 안인지 (허점타) */
  inOpening(e: BEnemy, t: number): boolean;
  /** 이 정령에게 걸린 지속 효과의 배율 훅을 모두 곱한 값 */
  passiveMult(s: BSpirit, hook: "healMult" | "supportMult" | "damageMult" | "burnMult" | "chillMult"): number;
  /** 화상 부여량: 지속 효과의 더하기와 배율을 적용한 값 */
  burnAmount(owner: BSpirit, v: number): number;

  /** 아군 카드의 직접 피해 1타. 피해 파이프라인을 거쳐요. */
  hit(owner: BSpirit, e: BEnemy, base: number, element: Element, noPower: boolean): void;
  /** 적 공격의 대상. 대상 파이프라인을 거쳐요. */
  pickTargets(rule: EnemyTargetRule): BSpirit[];
  /** 적 공격 1타. 피해 파이프라인 → 피해 받기 → 맞은 뒤 반응 */
  enemyHit(e: BEnemy, s: BSpirit, base: number, pierce: boolean): void;
  /** 적 공격 1타의 미리보기 수치 (대상 상태 제외) */
  enemyDmgPreview(e: BEnemy, base: number): number;
  /** 적이 다음 턴 손패에 거는 효과를 쌓아요 */
  queueCostUp(v: number): void;
  queueSeal(n: number): void;
  hurtEnemy(e: BEnemy, dmg: number, pierce: boolean, extra?: { crit?: boolean; weakHit?: boolean; resist?: boolean; opening?: boolean }): void;
  hurtSpirit(s: BSpirit, dmg: number, pierce: boolean, src?: string): void;
  gainBlock(s: BSpirit, v: number): void;
  healSpirit(s: BSpirit, v: number): void;
  /** 상태를 쌓고 상태 이벤트를 내요. */
  addStatus(h: BSpirit | BEnemy, id: StatusId, n: number, opts?: { fresh?: boolean; strength?: number }): void;
  /** 빙결 = 늦추기 (0039) */
  freezeEnemy(e: BEnemy): void;
  drawCards(n: number): void;
  /** 전투 중 생기는 카드의 uid */
  newCardUid(): number;
  addAura(owner: BSpirit, id: AuraId, value: number): void;

  log(text: string): void;
  emit(e: BattleEvent): void;
}
