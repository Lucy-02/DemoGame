import type { Rng } from "../rng";
import type { AuraId, CardDef, Element, EnemyTargetRule, StatKey } from "../types";
import type { BCard, BEnemy, BSpirit, BattleEvent, HoldState, Planned, StarState, StatusId } from "./state";

/** 피해 받기의 출처 */
export interface HurtOptions {
  /** 기록에 적는 출처 ("화상") */
  src?: string;
  /** 적의 공격이면 그 적. 벽이 대신 받는 조건이에요 */
  attacker?: BEnemy;
}

export type MultHook = "healMult" | "supportMult" | "damageMult" | "burnMult" | "chillMult";

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
  stars: StarState;
  hold: HoldState;

  aliveSpirits(): BSpirit[];
  aliveEnemies(): BEnemy[];
  spirit(id: string): BSpirit;
  enemy(uid: number): BEnemy;
  stat(s: BSpirit, k: StatKey): number;
  chillThreshold(e: BEnemy): number;
  /** 끝나는 시각 t가 적 e의 남은 행동 직전 창 안인지 (허점타). 적 행동과 같은 시각은 창 밖이에요 (0059) */
  inOpening(e: BEnemy, t: number): boolean;
  /** 이 정령에게 걸린 지속 효과의 배율 훅을 모두 곱한 값 */
  passiveMult(s: BSpirit, hook: MultHook): number;
  /** 화상 부여량: 지속 효과의 더하기와 배율을 적용한 값 */
  burnAmount(owner: BSpirit, v: number): number;
  /** 이 정령이 이번 턴 줄에 놓은 카드 중 가장 긴 카드를 지금 재생하는 중인지 */
  resolvingLongest(s: BSpirit): boolean;
  /** 적의 상태가 줄어들 때 장비가 덜 줄이는 양. 부르면 그 장비의 횟수를 써요 */
  linger(): number;
  /** 적의 화상이 탈 때 지속 효과가 덜 줄이는 양 (번지는 일도 여기서) */
  burnTick(e: BEnemy, burn: number): number;
  /** 손이나 줄에 품었다 돌아온 카드를 가진 정령인지 */
  holdsHeldCard(s: BSpirit): boolean;

  /** 아군 카드의 직접 피해 1타. 피해 파이프라인을 거쳐요. */
  hit(owner: BSpirit, e: BEnemy, base: number, element: Element, noPower: boolean): void;
  /** 적 공격의 대상. 대상 파이프라인을 거쳐요. */
  pickTargets(rule: EnemyTargetRule): BSpirit[];
  /** 적 공격 1타. 피해 파이프라인 → 피해 받기 → 맞은 뒤 반응 */
  enemyHit(e: BEnemy, s: BSpirit, base: number, pierce: boolean): void;
  /** 적 공격 1타의 미리보기 수치 (대상 상태 제외) */
  enemyDmgPreview(e: BEnemy, base: number): number;
  /** 적의 공격 행동이 끝난 뒤: 숨어서 받아낸 정령이 받아칠 기회를 얻어요 */
  settleHidden(): void;
  /** 적이 다음 턴 손패에 거는 효과를 쌓아요 */
  queueCostUp(v: number): void;
  queueSeal(n: number): void;
  hurtEnemy(e: BEnemy, dmg: number, pierce: boolean, extra?: { crit?: boolean; weakHit?: boolean; resist?: boolean; opening?: boolean }): void;
  hurtSpirit(s: BSpirit, dmg: number, pierce: boolean, opts?: HurtOptions): void;
  gainBlock(s: BSpirit, v: number): void;
  /** 벽 방어도: 방어도를 얻고 이 정령의 방어도가 벽이 돼요 */
  gainWall(s: BSpirit, v: number): void;
  healSpirit(s: BSpirit, v: number): void;
  /** 상태를 쌓고 상태 이벤트를 내요. */
  addStatus(h: BSpirit | BEnemy, id: StatusId, n: number, opts?: { fresh?: boolean; strength?: number; ref?: string }): void;
  /** 빙결 = 늦추기 (0039). extraMs만큼 더 늦춰요 */
  freezeEnemy(e: BEnemy, extraMs?: number): void;
  /** 적의 이번(또는 다음) 행동을 ms만큼 늦춰요 */
  delayEnemy(e: BEnemy, ms: number, why: string): void;
  /** 브레이크: 차징 중인 행동을 없애고 다음 패턴으로 */
  breakCharge(e: BEnemy): boolean;
  /** 이 적의 다음 행동을 없애요: 이번 턴 남은 행동, 없으면 다음 턴 행동 */
  cancelNextMove(e: BEnemy): void;
  /** 적에게 별을 새겨요. 쓰러진 적에는 새기지 않아요 */
  markStar(marker: BSpirit, e: BEnemy, n: number): void;
  /** 낙하 고르기를 열어요 */
  offerFall(): void;
  /** 받아칠 기회를 줘요 */
  gainReady(s: BSpirit, pulled?: number): void;
  /** 지금 재생 중인 카드 */
  readonly resolving: Planned | null;
  drawCards(n: number): void;
  /** 전투 중 생기는 카드의 uid */
  newCardUid(): number;
  addAura(holder: BSpirit, id: AuraId, value: number): void;
  cardDefOf(c: BCard): CardDef;

  log(text: string): void;
  emit(e: BattleEvent): void;
}
