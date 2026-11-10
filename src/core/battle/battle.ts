import { C, cardDef, enemyDef, spiritDef } from "../data";
import { Rng } from "../rng";
import { activePersonality, maxHpOf } from "../stats";
import type {
  AuraId, CardDef, CardOp, DeckCard, Element, EnemyAction, EnemyMove, EnemyTargetRule, RunSpirit, StatKey,
} from "../types";
import { ENEMY_ACTIONS, intentKind } from "./enemy-actions";
import { exhaustsAfterUse, handlerOf, resolveOp, type EffectContext } from "./effects";
import type { Engine } from "./engine";
import { AURAS, cardCostOf, passivesOf, type Passive } from "./passives";
import {
  ALLY_HIT_STAGES, CARD_TIME_STAGES, ENEMY_HIT_STAGES, ENEMY_TARGET_STAGES, INCOMING_STAGES, STAT_STAGES, runStages,
} from "./pipelines";
import {
  STATUS_IDS, refOf, stackOf, statusN,
  type BCard, type BEnemy, type BSpirit, type BattleEvent, type BattleResult, type EnemySlot, type Intent, type Planned, type Ref,
  type StatusId,
} from "./state";
import { STATUSES, clearStatuses, tickStatuses } from "./statuses";

/** 턴 흐름의 한 단계. order가 작은 것부터 차례로 돌아요. */
interface Step {
  id: string;
  order: number;
  run: () => void;
}

export class Battle implements Engine {
  spirits: BSpirit[] = [];
  enemies: BEnemy[] = [];
  draw: BCard[] = [];
  hand: BCard[] = [];
  discard: BCard[] = [];
  exhaust: BCard[] = [];
  sealed: BCard[] = [];
  mana = 0;
  turn = 0;
  frontId: string;
  result: BattleResult = "ongoing";
  events: BattleEvent[] = [];
  playedThisTurn: BCard[] = [];
  playedByElement: Partial<Record<Element, number>> = {};
  nextTurnMana = 0;
  repeatNext: { maxCost: number } | null = null;
  battleAuras = new Map<AuraId, number>();
  replaying = false;
  /** 이번 턴 계획한 아군 카드 (놓은 순서) */
  planned: Planned[] = [];
  /** 이번 턴 적 행동 칸 */
  slots: EnemySlot[] = [];
  now = 0;
  /** 적이 걸어 둔 다음 턴 손패 효과 */
  private pendingCostUp = 0;
  private pendingSeal = 0;
  private nextUid = 10000;

  constructor(
    runSpirits: RunSpirit[],
    deck: DeckCard[],
    enemyIds: string[],
    frontId: string,
    readonly rng: Rng,
  ) {
    for (const rs of runSpirits) {
      this.spirits.push({
        id: rs.id, def: spiritDef(rs.id), run: rs, personality: activePersonality(rs),
        hp: rs.hp, maxHp: maxHpOf(rs), block: 0, status: {}, release: 0, releaseUsed: false, critPity: 0,
        downed: rs.hp <= 0, auras: new Map(), playedThisTurn: 0, stubbornUsed: false,
      });
    }
    enemyIds.forEach((id, i) => {
      const def = enemyDef(id);
      this.enemies.push({
        uid: i + 1, def, hp: def.hp, maxHp: def.hp, block: 0, status: {}, patternIdx: 0, phase: 1,
        charging: false, chargeTurn: 0, delayNext: 0, carryAt: null, dead: false,
      });
    });
    this.frontId = this.aliveSpirits().some((s) => s.id === frontId) ? frontId : this.aliveSpirits()[0].id;
    this.draw = rng.shuffle(
      deck.map((d) => ({ ...d, tempCostDelta: 0, locked: false, isCopy: false, grow: 0 })),
    );
    for (const s of this.spirits) if (s.downed) this.sealCardsOf(s.id);
    this.log(`전투 시작: ${this.enemies.map((e) => e.def.name).join(", ")}`);
    this.startPlayerTurn();
  }

  // ───────────────────────── 조회 ─────────────────────────

  drain(): BattleEvent[] {
    const e = this.events;
    this.events = [];
    return e;
  }
  aliveSpirits() {
    return this.spirits.filter((s) => !s.downed);
  }
  aliveEnemies() {
    return this.enemies.filter((e) => !e.dead);
  }
  spirit(id: string) {
    return this.spirits.find((s) => s.id === id)!;
  }
  enemy(uid: number) {
    return this.enemies.find((e) => e.uid === uid)!;
  }

  stat(s: BSpirit, k: StatKey): number {
    return runStages(STAT_STAGES, { s, k, value: 0 }).value;
  }

  cardCost(c: BCard): number {
    return cardCostOf(this, c);
  }

  canPlay(c: BCard): { ok: boolean; why?: string } {
    if (this.result !== "ongoing") return { ok: false, why: "전투 종료" };
    if (this.spirit(c.owner).downed) return { ok: false, why: "기절한 정령의 카드" };
    if (c.locked) return { ok: false, why: "봉인됨" };
    if (this.cardCost(c) > this.mana) return { ok: false, why: "마력 부족" };
    return { ok: true };
  }

  currentMove(e: BEnemy): EnemyMove {
    const pat = e.phase === 2 && e.def.phase2 ? e.def.phase2.pattern : e.def.pattern;
    return pat[e.patternIdx % pat.length];
  }

  chillThreshold(e: BEnemy): number {
    const t = C.chill_threshold as Record<string, number>;
    return t[e.def.tier] ?? t.normal;
  }

  intent(e: BEnemy): Intent {
    const move = this.currentMove(e);
    const slot = this.slots.find((x) => x.uid === e.uid && !x.done);
    const at = slot ? slot.at : null;
    const desc = move.actions.map((a) => ENEMY_ACTIONS[a.type].text(this, e, a as never)).join(", ");
    if (!slot && move.charge && e.charging) return { name: move.name, at, text: `차징 중 → 다음 턴 ${desc}`, kind: "charge" };
    if (!slot) return { name: move.name, at, text: "이번 턴 행동 없음", kind: "skip" };
    if (move.charge && e.charging) return { name: move.name, at, text: `${desc} (끊기 가능)`, kind: "chargeReady" };
    return { name: move.name, at, text: desc, kind: intentKind(move.actions) };
  }

  /** 적 공격 1타의 미리보기 수치 (대상 상태 제외) */
  enemyDmgPreview(e: BEnemy, base: number): number {
    return runStages(ENEMY_HIT_STAGES, { attacker: e, target: null, base, amount: 0 }).amount;
  }

  passiveMult(s: BSpirit, hook: "healMult" | "supportMult" | "damageMult" | "burnMult" | "chillMult"): number {
    let m = 1;
    for (const [p, v] of passivesOf(s)) m *= p[hook]?.(s, v) ?? 1;
    return m;
  }

  burnAmount(owner: BSpirit, v: number): number {
    for (const [p, pv] of passivesOf(owner)) v += p.burnBonus?.(owner, pv) ?? 0;
    return v * this.passiveMult(owner, "burnMult");
  }

  private hookEach<K extends "turnStart" | "firstHand" | "afterHand" | "turnEnd">(s: BSpirit, hook: K) {
    for (const [p, v] of passivesOf(s)) (p[hook] as Passive[K])?.(this, s, v);
  }

  // ───────────────────────── 시간축 (0036) ─────────────────────────

  /** 이 카드가 이 주인 줄에서 걸리는 시간(ms) */
  cardTime(c: BCard): number {
    const owner = this.spirit(c.owner);
    return runStages(CARD_TIME_STAGES, { b: this, owner, base: cardDef(c.cardId).ms, ms: 0 }).ms;
  }

  /** 이 정령 줄에서 다음 카드가 시작하는 시각 */
  laneEnd(id: string): number {
    return this.planned.filter((p) => p.owner === id).reduce((m, p) => Math.max(m, p.end), 0);
  }

  /** 지금 놓으면 끝나는 시각 (미리보기) */
  previewEnd(c: BCard): number {
    return this.laneEnd(c.owner) + this.cardTime(c);
  }

  inOpening(e: BEnemy, t: number): boolean {
    return this.slots.some((x) => x.uid === e.uid && !x.done && x.at >= t && x.at - t <= C.opening_window_ms);
  }

  private moveAt(e: BEnemy): number {
    const move = this.currentMove(e);
    const def = (C.enemy_at as Record<string, number>)[e.def.tier] ?? C.enemy_at.normal;
    return move.at ?? def;
  }

  /** 턴 시작: 적 행동을 시간축에 박아요. 차징을 시작하는 적은 이번 턴엔 행동하지 않아요. */
  private placeEnemySlots() {
    this.slots = [];
    for (const e of this.aliveEnemies()) {
      if (e.carryAt !== null) {
        this.slots.push({ uid: e.uid, at: e.carryAt, done: false });
        e.carryAt = null;
        continue;
      }
      const move = this.currentMove(e);
      if (move.charge && !e.charging) {
        e.charging = true;
        e.chargeTurn = this.turn;
        this.emit({ k: "charge", uid: e.uid, move: move.name });
        this.log(`${e.def.name}: ${move.name} 차징 시작`);
        continue;
      }
      const at = this.moveAt(e) + e.delayNext;
      e.delayNext = 0;
      if (at >= C.axis_ms) e.carryAt = at - C.axis_ms;
      else this.slots.push({ uid: e.uid, at, done: false });
    }
  }

  freezeEnemy(e: BEnemy) {
    const d = C.freeze_delay_ms;
    this.emit({ k: "freeze", uid: e.uid });
    const slot = this.slots.find((x) => x.uid === e.uid && !x.done);
    if (slot) {
      const at = slot.at + d;
      if (at >= C.axis_ms) {
        slot.done = true;
        e.carryAt = at - C.axis_ms;
        this.emit({ k: "delay", uid: e.uid, ms: d, nextTurn: true });
        this.log(`${e.def.name} 빙결: 행동이 다음 턴으로 밀림`);
      } else {
        slot.at = at;
        this.emit({ k: "delay", uid: e.uid, ms: d, nextTurn: false });
        this.log(`${e.def.name} 빙결: 행동 ${d}ms 늦어짐`);
      }
    } else {
      e.delayNext += d;
      this.emit({ k: "delay", uid: e.uid, ms: d, nextTurn: true });
      this.log(`${e.def.name} 빙결: 다음 턴 행동 ${d}ms 늦어짐`);
    }
  }

  // ───────────────────────── 턴 흐름 ─────────────────────────

  /** 턴 시작 처리 목록 */
  private readonly turnStartSteps: Step[] = [
    {
      id: "header", order: 10,
      run: () => {
        this.turn++;
        this.replaying = false;
        this.playedThisTurn = [];
        this.repeatNext = null;
        this.log(`── ${this.turn}턴 ──`);
      },
    },
    {
      id: "resetAllies", order: 20,
      run: () => {
        for (const s of this.aliveSpirits()) {
          const keep = statusN(s, "keepBlock") > 0 || passivesOf(s).some(([p, v]) => p.keepsBlock?.(s, v));
          if (!keep) s.block = 0;
          clearStatuses(s, "clearsAtTurnStart");
          s.playedThisTurn = 0;
          s.stubbornUsed = false;
          this.hookEach(s, "turnStart");
        }
      },
    },
    {
      id: "resetEnemies", order: 30,
      run: () => {
        for (const e of this.aliveEnemies()) {
          e.block = 0;
          const p2 = e.phase === 2 ? e.def.phase2 : undefined;
          if (p2?.turnStartBlock) {
            e.block = p2.turnStartBlock;
            this.emit({ k: "block", ref: refOf(e), amount: p2.turnStartBlock });
          }
        }
      },
    },
    {
      id: "timeline", order: 40,
      run: () => {
        this.planned = [];
        this.now = 0;
        this.placeEnemySlots();
      },
    },
    {
      id: "mana", order: 50,
      run: () => {
        this.mana = C.mana_per_turn + this.nextTurnMana;
        this.nextTurnMana = 0;
      },
    },
    { id: "draw", order: 60, run: () => this.drawCards(C.hand_draw) },
    {
      id: "firstHand", order: 70,
      run: () => {
        if (this.turn !== 1) return;
        for (const s of this.aliveSpirits()) this.hookEach(s, "firstHand");
      },
    },
    { id: "afterHand", order: 80, run: () => { for (const s of this.aliveSpirits()) this.hookEach(s, "afterHand"); } },
    {
      id: "enemyCostUp", order: 90,
      run: () => {
        if (this.pendingCostUp > 0 && this.hand.length) {
          const c = this.rng.pick(this.hand);
          c.tempCostDelta += this.pendingCostUp;
          this.log(`장난: ${cardDef(c.cardId).name} 비용 +${this.pendingCostUp}`);
        }
        this.pendingCostUp = 0;
      },
    },
    {
      id: "enemySeal", order: 100,
      run: () => {
        if (this.pendingSeal > 0) {
          const owners = this.aliveSpirits().filter((s) => this.hand.some((c) => c.owner === s.id));
          if (owners.length) {
            const s = this.rng.pick(owners);
            const cards = this.rng.shuffle(this.hand.filter((c) => c.owner === s.id)).slice(0, this.pendingSeal);
            cards.forEach((c) => (c.locked = true));
            this.log(`뿌리 휘감기: ${s.def.name} 카드 ${cards.length}장 봉인 (이번 턴)`);
          }
        }
        this.pendingSeal = 0;
      },
    },
  ];

  /** 턴 끝 처리 목록 (재생이 끝난 뒤) */
  private readonly turnEndSteps: Step[] = [
    {
      id: "allyStatuses", order: 10,
      run: () => {
        for (const s of this.aliveSpirits()) {
          this.runStatusTurnEnd(s);
          this.hookEach(s, "turnEnd");
        }
      },
    },
    { id: "enemyStatuses", order: 20, run: () => { for (const e of this.enemies) if (!e.dead) this.runStatusTurnEnd(e); } },
  ];

  /** 라운드 끝 처리 목록 (손을 버린 뒤) */
  private readonly roundEndSteps: Step[] = [
    {
      id: "allies", order: 10,
      run: () => {
        for (const s of this.spirits) {
          tickStatuses(s);
          if (s.release > 0) {
            s.release--;
            if (s.release === 0) {
              this.emit({ k: "releaseEnd", id: s.id });
              this.log(`${s.def.name} 해방 끝`);
            }
          }
        }
      },
    },
    { id: "enemies", order: 20, run: () => { for (const e of this.enemies) tickStatuses(e); } },
  ];

  private runSteps(steps: readonly Step[]) {
    for (const st of steps.slice().sort((a, b) => a.order - b.order)) st.run();
  }

  private runStatusTurnEnd(h: BSpirit | BEnemy) {
    for (const id of STATUS_IDS) {
      const st = h.status[id];
      if (st && st.n > 0) STATUSES[id].turnEnd?.(this, h, st);
    }
  }

  private startPlayerTurn() {
    this.runSteps(this.turnStartSteps);
  }

  /** 턴 종료: 계획한 카드와 적 행동을 시각 순서로 재생해요. 같은 시각이면 아군 먼저 (0036). */
  endTurn() {
    if (this.result !== "ongoing" || this.replaying) return;
    this.replaying = true;
    const allies = this.planned.slice().sort((x, y) => x.end - y.end);
    let ai = 0;
    for (let guard = 0; guard < 500 && this.result === "ongoing"; guard++) {
      const nextAlly = allies[ai];
      const nextEnemy = this.slots.filter((x) => !x.done).sort((x, y) => x.at - y.at)[0];
      if (!nextAlly && !nextEnemy) break;
      if (nextAlly && (!nextEnemy || nextAlly.end <= nextEnemy.at)) {
        ai++;
        this.now = nextAlly.end;
        this.resolvePlanned(nextAlly);
      } else {
        nextEnemy.done = true;
        this.now = nextEnemy.at;
        const e = this.enemy(nextEnemy.uid);
        if (!e.dead) this.enemyAct(e);
      }
      if (this.checkEnd()) return;
    }
    // 재생이 끝나지 못한 카드(전투 종료)는 버린 더미로
    for (const p of allies.slice(ai)) this.discard.push(p.card);
    this.planned = [];
    this.runSteps(this.turnEndSteps);
    if (this.checkEnd()) return;
    for (const c of this.hand) {
      c.tempCostDelta = 0;
      c.locked = false;
      (c.isCopy ? this.exhaust : this.discard).push(c);
    }
    this.hand = [];
    this.runSteps(this.roundEndSteps);
    if (this.checkEnd()) return;
    this.startPlayerTurn();
  }

  // ───────────────────────── 적 행동 ─────────────────────────

  /** 박힌 시각에 적 행동 하나 */
  private enemyAct(e: BEnemy) {
    const move = this.currentMove(e);
    e.charging = false;
    this.emit({ k: "enemyAct", uid: e.uid, move: move.name });
    this.log(`${e.def.name}: ${move.name}`);
    for (const a of move.actions) {
      ENEMY_ACTIONS[a.type].run(this, e, a as never);
      if (this.aliveSpirits().length === 0 || e.dead) break;
    }
    e.patternIdx++;
  }

  /** 적 공격의 대상 */
  pickTargets(rule: EnemyTargetRule): BSpirit[] {
    const alive = this.aliveSpirits();
    if (!alive.length) return [];
    return runStages(ENEMY_TARGET_STAGES, { b: this, rule, alive, picked: null }).picked ?? [];
  }

  /** 적 공격 1타: 피해 파이프라인 → 피해 받기 → 맞은 뒤 반응(반격) */
  enemyHit(e: BEnemy, s: BSpirit, base: number, pierce: boolean) {
    const dmg = runStages(ENEMY_HIT_STAGES, { attacker: e, target: s, base, amount: 0 }).amount;
    this.hurtSpirit(s, dmg, pierce);
    for (const id of STATUS_IDS) {
      const st = s.status[id];
      if (st && st.n > 0) STATUSES[id].afterAttacked?.(this, s, e, st);
    }
  }

  /** 적이 다음 턴 손패에 거는 효과를 쌓아요 */
  queueCostUp(v: number) {
    this.pendingCostUp += v;
  }
  queueSeal(n: number) {
    this.pendingSeal += n;
  }

  // ───────────────────────── 카드 사용 ─────────────────────────

  /** 대상이 필요한 카드인지: enemy → 적 선택, ally → 아군 선택 */
  needsTarget(c: BCard): "enemy" | "ally" | null {
    const t = cardDef(c.cardId).target;
    if (t === "enemy") return this.aliveEnemies().length > 1 ? "enemy" : null;
    if (t === "ally") return "ally";
    return null;
  }

  /** 카드를 그 주인 줄 끝에 계획해요. 효과는 턴 종료 때 끝나는 시각에 들어가요.
   *  놓는 즉시 처리하는 효과(핸들러의 immediate)는 여기서 처리해요 (0036). */
  play(uid: number, target?: Ref): boolean {
    const c = this.hand.find((x) => x.uid === uid);
    if (!c) return false;
    const chk = this.canPlay(c);
    if (!chk.ok) return false;
    const def = cardDef(c.cardId);
    const owner = this.spirit(c.owner);
    const cost = this.cardCost(c);
    const time = this.cardTime(c);
    const start = this.laneEnd(owner.id);
    this.mana -= cost;
    this.hand.splice(this.hand.indexOf(c), 1);
    const comboCount = this.playedThisTurn.length;
    this.playedThisTurn.push(c);
    owner.playedThisTurn++;
    const repeat = !!this.repeatNext && def.id !== "ride_the_wind" && cost <= this.repeatNext.maxCost;
    if (repeat) this.repeatNext = null;
    this.planned.push({ card: c, owner: owner.id, target, start, end: start + time, comboCount, repeat });

    const ctx = this.effectContext(def, c, owner, { enemies: [], allies: [] }, comboCount);
    for (const op of def.effects) if (handlerOf(op).immediate) resolveOp(ctx, op);

    for (const [p, v] of passivesOf(owner)) p.afterPlay?.(this, owner, v, c, def);
    this.playedByElement[def.element] = (this.playedByElement[def.element] ?? 0) + 1;
    c.tempCostDelta = 0;
    return true;
  }

  /** 재생: 계획한 카드 하나가 끝나는 시각에 들어가요. 주인이 쓰러졌으면 봉인돼요. */
  private resolvePlanned(p: Planned) {
    const c = p.card;
    const def = cardDef(c.cardId);
    const owner = this.spirit(p.owner);
    if (owner.downed) {
      this.sealed.push(c);
      return;
    }
    this.emit({ k: "spiritAct", id: owner.id, card: def.name });
    this.log(`${owner.def.name}: ${def.name}`);
    this.resolve(def, c, owner, this.cardTargets(def, p.target, owner), p.comboCount);
    if (p.repeat && this.result === "ongoing") {
      this.log(`제피로스: ${def.name} 한 번 더`);
      this.resolve(def, c, owner, this.cardTargets(def, p.target, owner), p.comboCount);
    }
    (exhaustsAfterUse(def, c) ? this.exhaust : this.discard).push(c);
  }

  /** 카드 대상 규칙. 고른 대상이 없거나 쓰러졌으면 첫 적 · 카드 주인으로 바꿔요. */
  private cardTargets(def: CardDef, target: Ref | undefined, owner: BSpirit): { enemies: BEnemy[]; allies: BSpirit[] } {
    if (def.target === "enemy") {
      let e = target?.side === "e" ? this.enemy(target.uid) : undefined;
      if (!e || e.dead) e = this.aliveEnemies()[0];
      return { enemies: e ? [e] : [], allies: [] };
    }
    if (def.target === "allEnemies") return { enemies: this.aliveEnemies(), allies: [] };
    if (def.target === "self") return { enemies: [], allies: [owner] };
    if (def.target === "ally") {
      let s = target?.side === "s" ? this.spirit(target.id) : undefined;
      if (!s || s.downed) s = owner;
      return { enemies: [], allies: [s] };
    }
    return { enemies: [], allies: this.aliveSpirits() };
  }

  private effectContext(
    def: CardDef, card: BCard, owner: BSpirit, tg: { enemies: BEnemy[]; allies: BSpirit[] }, comboCount: number,
  ): EffectContext {
    let mainUsed = false;
    const ctx: EffectContext = {
      b: this, card, def, owner, enemies: tg.enemies, allies: tg.allies, comboCount,
      main: (v) => {
        if (mainUsed) return v;
        mainUsed = true;
        return v + card.grow;
      },
      run: (ops: CardOp[]) => {
        for (const op of ops) {
          if (this.result !== "ongoing") return;
          if (handlerOf(op).immediate) continue;
          resolveOp(ctx, op);
        }
      },
    };
    return ctx;
  }

  private resolve(def: CardDef, c: BCard, owner: BSpirit, tg: { enemies: BEnemy[]; allies: BSpirit[] }, comboCount: number) {
    this.effectContext(def, c, owner, tg, comboCount).run(def.effects);
  }

  // ───────────────────────── 규칙 원시 동작 ─────────────────────────

  hit(owner: BSpirit, e: BEnemy, base: number, element: Element, noPower: boolean) {
    const r = runStages(ALLY_HIT_STAGES, {
      b: this, attacker: owner, target: e, element, base, noPower,
      amount: 0, crit: false, weakHit: false, resist: false, opening: false,
    });
    this.hurtEnemy(e, r.amount, false, { crit: r.crit, weakHit: r.weakHit, resist: r.resist, ...(r.opening ? { opening: true } : {}) });
  }

  addStatus(h: BSpirit | BEnemy, id: StatusId, n: number, opts: { fresh?: boolean; strength?: number } = {}) {
    const st = stackOf(h, id);
    st.n += n;
    if (opts.fresh !== undefined) st.fresh = opts.fresh;
    if (opts.strength !== undefined) st.strength = Math.max(st.strength, opts.strength);
    this.emit({ k: "status", ref: refOf(h), text: STATUSES[id].gainText(n, st.n) });
    STATUSES[id].onGain?.(this, h, st);
  }

  addAura(owner: BSpirit, id: AuraId, value: number) {
    const map = AURAS[id].scope === "battle" ? this.battleAuras : owner.auras;
    map.set(id, (map.get(id) ?? 0) + value);
  }

  hurtEnemy(e: BEnemy, dmg: number, pierce: boolean, extra: { crit?: boolean; weakHit?: boolean; resist?: boolean; opening?: boolean } = {}) {
    const r = runStages(INCOMING_STAGES, { target: e, dmg, pierce, blocked: 0, real: 0 });
    this.emit({ k: "damage", ref: refOf(e), amount: r.real, blocked: r.blocked, ...extra });
    if (e.hp <= 0) {
      e.dead = true;
      this.emit({ k: "enemyDead", uid: e.uid });
      this.log(`${e.def.name} 쓰러짐`);
      return;
    }
    const p2 = e.def.phase2;
    if (p2 && e.phase === 1 && e.hp < e.maxHp * p2.hpBelow) {
      e.phase = 2;
      e.patternIdx = 0;
      e.charging = false;
      this.emit({ k: "phase2", uid: e.uid });
      this.log(`${e.def.name} 분노: 2페이즈`);
    }
  }

  hurtSpirit(s: BSpirit, dmg: number, pierce: boolean, src?: string) {
    const r = runStages(INCOMING_STAGES, { target: s, dmg, pierce, blocked: 0, real: 0 });
    this.emit({ k: "damage", ref: refOf(s), amount: r.real, blocked: r.blocked });
    if (src) this.log(`${s.def.name} ${src} 피해 ${r.real}`);
    if (s.hp <= 0) this.downSpirit(s);
  }

  private downSpirit(s: BSpirit) {
    s.downed = true;
    s.block = 0;
    clearStatuses(s, "clearsWhenDowned");
    s.release = 0;
    this.emit({ k: "downed", id: s.id });
    this.log(`${s.def.name} 기절 · 카드 봉인`);
    this.sealCardsOf(s.id);
    if (this.frontId === s.id) {
      const next = this.aliveSpirits()[0];
      if (next) {
        this.frontId = next.id;
        this.log(`${next.def.name}: 앞열로 밀려남`);
      }
    }
  }

  private sealCardsOf(id: string) {
    for (const pile of [this.hand, this.draw, this.discard]) {
      for (let i = pile.length - 1; i >= 0; i--) {
        if (pile[i].owner === id) this.sealed.push(...pile.splice(i, 1));
      }
    }
  }

  gainBlock(s: BSpirit, v: number) {
    if (s.downed) return;
    s.block += v;
    this.emit({ k: "block", ref: refOf(s), amount: v });
  }

  healSpirit(s: BSpirit, v: number) {
    if (s.downed) return;
    const amt = Math.min(v, s.maxHp - s.hp);
    s.hp += amt;
    this.emit({ k: "heal", ref: refOf(s), amount: amt });
  }

  /** 해방할 수 있는지: 각성체만, 전투마다 한 번, 내 턴에. 놓는 즉시 켜져요. 칸 비용은 정령마다 다르게 정할 예정(0036 4절, `TODO_TOKEN`). */
  canRelease(id: string): boolean {
    const s = this.spirit(id);
    return this.result === "ongoing" && !this.replaying && !s.downed && !s.releaseUsed && s.run.stage === "awakened";
  }

  release(id: string): boolean {
    if (!this.canRelease(id)) return false;
    const s = this.spirit(id);
    s.releaseUsed = true;
    s.release = C.release_duration;
    this.emit({ k: "release", id: s.id });
    this.log(`✦ ${s.def.name} 해방: ${s.def.release.name}`);
    return true;
  }

  drawCards(n: number) {
    for (let i = 0; i < n; i++) {
      if (this.hand.length >= C.hand_max) return;
      if (!this.draw.length) {
        if (!this.discard.length) return;
        this.draw = this.rng.shuffle(this.discard);
        this.discard = [];
      }
      this.hand.push(this.draw.pop()!);
    }
  }

  newCardUid(): number {
    return this.nextUid++;
  }

  private checkEnd(): boolean {
    if (this.result !== "ongoing") return true;
    if (this.aliveEnemies().length === 0) {
      this.result = "victory";
      this.log("승리");
      return true;
    }
    if (this.aliveSpirits().length === 0) {
      this.result = "defeat";
      this.log("패배: 세 정령 모두 쓰러짐");
      return true;
    }
    return false;
  }

  log(text: string) {
    this.events.push({ k: "log", text });
  }

  emit(e: BattleEvent) {
    this.events.push(e);
  }
}
