import { C, affinity, cardDef, enemyDef, spiritDef, ELEMENT_NAME } from "./data";
import { Rng } from "./rng";
import { activePersonality, baseStat, maxHpOf, round, scale } from "./stats";
import type {
  AuraId, CardDef, CardOp, DeckCard, Element, EnemyAction, EnemyDef, EnemyMove,
  EnemyTargetRule, PersonalityDef, RunSpirit, SpiritDef, StatKey,
} from "./types";

export interface Status {
  burn: number;
  chill: number;
  regen: number;
  vuln: number;
  vulnPct: number;
  weak: number;
  /** 적 턴에 걸린 상태는 그 라운드 끝에 줄어들지 않아요. */
  vulnFresh: boolean;
  weakFresh: boolean;
}
const newStatus = (): Status => ({
  burn: 0, chill: 0, regen: 0, vuln: 0, vulnPct: 0, weak: 0, vulnFresh: false, weakFresh: false,
});

export interface BSpirit {
  id: string;
  def: SpiritDef;
  run: RunSpirit;
  personality: PersonalityDef | null;
  hp: number;
  maxHp: number;
  block: number;
  thorns: number;
  taunt: boolean;
  /** 이번 전투 동안 방어도가 턴 시작에 사라지지 않아요 (희귀 수호 카드). */
  keepBlock: boolean;
  empower: number;
  status: Status;
  /** 해방이 남은 턴. 0이면 꺼져 있어요. */
  release: number;
  /** 해방은 각성체만, 전투마다 한 번 */
  releaseUsed: boolean;
  critPity: number;
  downed: boolean;
  auras: Map<AuraId, number>;
  playedThisTurn: number;
  stubbornUsed: boolean;
}

export interface BEnemy {
  uid: number;
  def: EnemyDef;
  hp: number;
  maxHp: number;
  block: number;
  status: Status;
  patternIdx: number;
  phase: 1 | 2;
  charging: boolean;
  /** 차징을 시작한 턴. 그 턴에는 행동하지 않고 다음 턴 박힌 시각에 터져요. */
  chargeTurn: number;
  /** 빙결로 다음 턴 행동에 더해질 늦춤(ms) */
  delayNext: number;
  /** 축 끝을 넘겨 밀린 행동: 다음 턴 이 시각에 일어나요 (0036 뼈대 2) */
  carryAt: number | null;
  bonusDmg: number;
  dead: boolean;
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

export interface BCard extends DeckCard {
  tempCostDelta: number;
  locked: boolean;
  isCopy: boolean;
  grow: number;
}

export type Ref = { side: "s"; id: string } | { side: "e"; uid: number };

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

export class Battle {
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
  private nextTurnMana = 0;
  private pendingCostUp = 0;
  private pendingSeal = 0;
  private repeatNext: { maxCost: number } | null = null;
  private eyeOfStorm = 0;
  private nextUid = 10000;
  /** 턴 종료 뒤 시간축을 재생하는 중 */
  private inEnemyTurn = false;
  /** 이번 턴 계획한 아군 카드 (놓은 순서) */
  planned: Planned[] = [];
  /** 이번 턴 적 행동 칸 */
  slots: EnemySlot[] = [];
  /** 재생 중 지금 시각(ms) */
  now = 0;

  constructor(
    runSpirits: RunSpirit[],
    deck: DeckCard[],
    enemyIds: string[],
    frontId: string,
    private rng: Rng,
  ) {
    for (const rs of runSpirits) {
      this.spirits.push({
        id: rs.id, def: spiritDef(rs.id), run: rs, personality: activePersonality(rs),
        hp: rs.hp, maxHp: maxHpOf(rs), block: 0, thorns: 0, taunt: false, keepBlock: false, empower: 0,
        status: newStatus(), release: 0, releaseUsed: false, critPity: 0, downed: rs.hp <= 0,
        auras: new Map(), playedThisTurn: 0, stubbornUsed: false,
      });
    }
    enemyIds.forEach((id, i) => {
      const def = enemyDef(id);
      this.enemies.push({
        uid: i + 1, def, hp: def.hp, maxHp: def.hp, block: 0,
        status: newStatus(), patternIdx: 0, phase: 1,
        charging: false, chargeTurn: 0, delayNext: 0, carryAt: null, bonusDmg: 0, dead: false,
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
    let v = baseStat(s.run, k);
    const p = s.personality;
    if (p?.id === "brave" && k === p.stat && s.hp <= s.maxHp * (p.hpBelow ?? 0.5)) v *= p.mult ?? 1;
    return v;
  }

  cardCost(c: BCard): number {
    const def = cardDef(c.cardId);
    let cost = def.cost + c.tempCostDelta;
    const owner = this.spirit(c.owner);
    const down = (C.release_cost_down as Record<string, number>)[owner.id];
    if (owner.release > 0 && down) cost -= down;
    if (this.eyeOfStorm > 0 && this.playedThisTurn.length === this.eyeOfStorm - 1) cost = 0;
    return Math.max(0, cost);
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
    const desc = move.actions.map((a) => this.actionText(e, a)).join(", ");
    if (!slot && move.charge && e.charging) return { name: move.name, at, text: `차징 중 → 다음 턴 ${desc}`, kind: "charge" };
    if (!slot) return { name: move.name, at, text: "이번 턴 행동 없음", kind: "skip" };
    if (move.charge && e.charging) return { name: move.name, at, text: `${desc} (끊기 가능)`, kind: "chargeReady" };
    const a0 = move.actions.find((a) => a.type === "attack");
    if (a0) return { name: move.name, at, text: desc, kind: "attack" };
    if (move.actions.some((a) => a.type === "block" || a.type === "sapHeal")) return { name: move.name, at, text: desc, kind: "defend" };
    if (move.actions.some((a) => a.type === "buffMinions")) return { name: move.name, at, text: desc, kind: "buff" };
    return { name: move.name, at, text: desc, kind: "debuff" };
  }

  // ───────────────────────── 시간축 (0036) ─────────────────────────

  /** 이 카드가 이 주인 줄에서 걸리는 시간(ms) = 기본 시간 × 기준 스피드 ÷ 스피드 */
  cardTime(c: BCard): number {
    const owner = this.spirit(c.owner);
    const speed = Math.max(1, this.stat(owner, "speed"));
    return Math.round((cardDef(c.cardId).ms * C.stat_base) / speed);
  }

  /** 이 정령 줄에서 다음 카드가 시작하는 시각 */
  laneEnd(id: string): number {
    return this.planned.filter((p) => p.owner === id).reduce((m, p) => Math.max(m, p.end), 0);
  }

  /** 지금 놓으면 끝나는 시각 (미리보기) */
  previewEnd(c: BCard): number {
    return this.laneEnd(c.owner) + this.cardTime(c);
  }

  /** 끝나는 시각 t가 적 e의 남은 행동 직전 창 안인지 (허점타) */
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
        this.events.push({ k: "charge", uid: e.uid, move: move.name });
        this.log(`${e.def.name}: ${move.name} 차징 시작`);
        continue;
      }
      const at = this.moveAt(e) + e.delayNext;
      e.delayNext = 0;
      if (at >= C.axis_ms) e.carryAt = at - C.axis_ms;
      else this.slots.push({ uid: e.uid, at, done: false });
    }
  }

  private targetName(t: EnemyTargetRule) {
    return { front: "앞열", random: "무작위", lowest: "HP 최저", all: "전체" }[t];
  }

  private actionText(e: BEnemy, a: EnemyAction): string {
    switch (a.type) {
      case "attack": {
        const d = this.enemyDmgPreview(e, a.dmg);
        const hits = a.hits && a.hits > 1 ? `${d}×${a.hits}` : `${d}`;
        return `${this.targetName(a.target)} 피해 ${hits}${a.pierce ? " (방어 무시)" : ""}`;
      }
      case "block": return `방어도 ${a.value}`;
      case "weak": return `${this.targetName(a.target)} 약화 ${a.turns}턴`;
      case "vulnerable": return `${this.targetName(a.target)} 취약 ${a.turns}턴`;
      case "burn": return `${this.targetName(a.target)} 화상 ${a.value}`;
      case "buffMinions": return `새끼 피해 +${a.value}`;
      case "costUp": return `손패 1장 비용 +${a.value}`;
      case "sealCards": return `카드 ${a.count}장 봉인`;
      case "sapHeal": return e.status.burn > 0 ? `회복 ${a.value} → 화상 ${e.status.burn * 2} 역류` : `회복 ${a.value}`;
    }
  }

  private enemyDmgPreview(e: BEnemy, base: number) {
    return round((base + e.bonusDmg) * (e.status.weak > 0 ? C.weak_mult : 1));
  }

  // ───────────────────────── 턴 흐름 ─────────────────────────

  private startPlayerTurn() {
    this.turn++;
    this.inEnemyTurn = false;
    this.playedThisTurn = [];
    // 바람길은 "이번 턴에" 다음 카드만 (0022)
    this.repeatNext = null;
    this.log(`── ${this.turn}턴 ──`);
    for (const s of this.aliveSpirits()) {
      const keep = s.keepBlock || (s.release > 0 && (C.release_keep_block as string[]).includes(s.id));
      if (!keep) s.block = 0;
      s.thorns = 0;
      s.taunt = false;
      s.empower = 0;
      s.playedThisTurn = 0;
      s.stubbornUsed = false;
      const dw = s.auras.get("deep_water");
      if (dw) this.gainBlock(s, scale(dw, this.stat(s, "guard")));
    }
    for (const e of this.aliveEnemies()) {
      e.block = 0;
      const p2 = e.phase === 2 ? e.def.phase2 : undefined;
      if (p2?.turnStartBlock) {
        e.block = p2.turnStartBlock;
        this.events.push({ k: "block", ref: { side: "e", uid: e.uid }, amount: p2.turnStartBlock });
      }
    }
    this.planned = [];
    this.now = 0;
    this.placeEnemySlots();
    this.mana = C.mana_per_turn + this.nextTurnMana;
    this.nextTurnMana = 0;
    this.drawCards(C.hand_draw);
    if (this.turn === 1) {
      for (const s of this.aliveSpirits()) {
        if (s.personality?.id !== "cheerful") continue;
        this.drawCards(s.personality.value ?? 1);
        this.log(`${s.def.name}(명랑): 카드 ${s.personality.value ?? 1}장 더 뽑음`);
      }
    }

    for (const s of this.aliveSpirits()) {
      if (s.personality?.id !== "playful") continue;
      const mine = this.hand.filter((c) => c.owner === s.id && this.cardCost(c) > 0);
      if (mine.length) {
        const c = this.rng.pick(mine);
        c.tempCostDelta -= 1;
        this.log(`${s.def.name}(장난): ${cardDef(c.cardId).name} 비용 -1`);
      }
    }
    if (this.pendingCostUp > 0 && this.hand.length) {
      const c = this.rng.pick(this.hand);
      c.tempCostDelta += this.pendingCostUp;
      this.log(`장난: ${cardDef(c.cardId).name} 비용 +${this.pendingCostUp}`);
    }
    this.pendingCostUp = 0;
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
  }

  /** 턴 종료: 계획한 카드와 적 행동을 시각 순서로 재생해요. 같은 시각이면 아군 먼저 (0036). */
  endTurn() {
    if (this.result !== "ongoing" || this.inEnemyTurn) return;
    this.inEnemyTurn = true;
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
    this.turnEndEffects();
    if (this.checkEnd()) return;
    for (const c of this.hand) {
      c.tempCostDelta = 0;
      c.locked = false;
      (c.isCopy ? this.exhaust : this.discard).push(c);
    }
    this.hand = [];
    this.roundEnd();
    if (this.checkEnd()) return;
    this.startPlayerTurn();
  }

  /** 턴 끝: 화상(타고 나서 절반, 0040), 재생, 라딕스 */
  private turnEndEffects() {
    for (const s of this.aliveSpirits()) {
      if (s.status.burn > 0) {
        this.hurtSpirit(s, s.status.burn, true, "화상");
        s.status.burn = Math.floor(s.status.burn / 2);
      }
      if (s.status.regen > 0 && !s.downed) {
        this.healSpirit(s, s.status.regen);
        s.status.regen--;
      }
      const rd = s.auras.get("root_down");
      if (rd && !s.downed) {
        const tgt = this.aliveSpirits().sort((a, b) => a.hp - b.hp)[0];
        if (tgt) this.healSpirit(tgt, round(scale(rd, this.stat(s, "focus")) * this.healMult(s)));
      }
    }
    for (const e of this.enemies) {
      if (e.dead || e.status.burn <= 0) continue;
      this.hurtEnemy(e, round(e.status.burn * this.vulnMult(e.status)), true);
      e.status.burn = Math.floor(e.status.burn / 2);
    }
  }

  private roundEnd() {
    const tick = (st: Status) => {
      if (st.vuln > 0 && !st.vulnFresh) st.vuln--;
      if (st.weak > 0 && !st.weakFresh) st.weak--;
      if (st.vuln === 0) st.vulnPct = 0;
      st.vulnFresh = st.weakFresh = false;
    };
    for (const s of this.spirits) {
      tick(s.status);
      if (s.release > 0) {
        s.release--;
        if (s.release === 0) {
          this.events.push({ k: "releaseEnd", id: s.id });
          this.log(`${s.def.name} 해방 끝`);
        }
      }
    }
    for (const e of this.enemies) tick(e.status);
  }

  /** 박힌 시각에 적 행동 하나 */
  private enemyAct(e: BEnemy) {
    const move = this.currentMove(e);
    e.charging = false;
    this.events.push({ k: "enemyAct", uid: e.uid, move: move.name });
    this.log(`${e.def.name}: ${move.name}`);
    for (const a of move.actions) {
      this.doEnemyAction(e, a);
      if (this.aliveSpirits().length === 0 || e.dead) break;
    }
    e.patternIdx++;
  }

  private pickTargets(rule: EnemyTargetRule): BSpirit[] {
    const alive = this.aliveSpirits();
    if (!alive.length) return [];
    if (rule === "all") return alive;
    const taunt = alive.find((s) => s.taunt);
    if (taunt) return [taunt];
    const glacies = alive.find((s) => s.release > 0 && (C.release_taunt as string[]).includes(s.id));
    if (glacies) return [glacies];
    if (rule === "front") return [alive.find((s) => s.id === this.frontId) ?? alive[0]];
    if (rule === "lowest") return [alive.slice().sort((a, b) => a.hp - b.hp)[0]];
    return [this.rng.pick(alive)];
  }

  private doEnemyAction(e: BEnemy, a: EnemyAction) {
    const fresh = this.inEnemyTurn;
    switch (a.type) {
      case "attack": {
        const hits = a.hits ?? 1;
        const fixed = a.target === "random" ? null : this.pickTargets(a.target);
        for (let h = 0; h < hits; h++) {
          const targets = fixed ?? this.pickTargets("random");
          for (const s of targets) {
            if (s.downed) continue;
            const dmg = round((a.dmg + e.bonusDmg) * (e.status.weak > 0 ? C.weak_mult : 1) * this.vulnMult(s.status));
            this.hurtSpirit(s, dmg, !!a.pierce);
            if (s.thorns > 0 && !e.dead) {
              this.log(`${s.def.name}: 반격`);
              this.hurtEnemy(e, round(s.thorns * this.vulnMult(e.status)), false);
            }
          }
          if (e.dead) break;
        }
        break;
      }
      case "block":
        e.block += a.value;
        this.events.push({ k: "block", ref: { side: "e", uid: e.uid }, amount: a.value });
        break;
      case "weak":
        for (const s of this.pickTargets(a.target)) {
          s.status.weak += a.turns;
          s.status.weakFresh = fresh;
          this.events.push({ k: "status", ref: { side: "s", id: s.id }, text: `약화 ${a.turns}` });
        }
        break;
      case "vulnerable":
        for (const s of this.pickTargets(a.target)) {
          s.status.vuln += a.turns;
          s.status.vulnPct = Math.max(s.status.vulnPct, C.vuln_base);
          s.status.vulnFresh = fresh;
          this.events.push({ k: "status", ref: { side: "s", id: s.id }, text: `취약 ${a.turns}` });
        }
        break;
      case "burn":
        for (const s of this.pickTargets(a.target)) {
          s.status.burn += a.value;
          this.events.push({ k: "status", ref: { side: "s", id: s.id }, text: `화상 ${a.value}` });
        }
        break;
      case "buffMinions":
        for (const m of this.aliveEnemies()) {
          if (m.def.tier === "minion") {
            m.bonusDmg += a.value;
            this.events.push({ k: "status", ref: { side: "e", uid: m.uid }, text: `피해 +${a.value}` });
          }
        }
        break;
      case "costUp":
        this.pendingCostUp += a.value;
        break;
      case "sealCards":
        this.pendingSeal += a.count;
        break;
      case "sapHeal":
        if (e.status.burn > 0) {
          this.log(`수액에 불 붙음: 화상 피해 2배`);
          this.hurtEnemy(e, round(e.status.burn * 2 * this.vulnMult(e.status)), true);
        } else {
          const amt = Math.min(a.value, e.maxHp - e.hp);
          e.hp += amt;
          this.events.push({ k: "heal", ref: { side: "e", uid: e.uid }, amount: amt });
        }
        break;
    }
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
   *  새 정보를 여는 효과(뽑기)와 다음 카드에 거는 효과(바람길)는 놓는 즉시 처리해요 (0036). */
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

    // 놓는 즉시 처리하는 효과
    for (const op of def.effects) {
      if (op.op === "draw") this.drawCards(op.value);
      if (op.op === "repeatNext") this.repeatNext = { maxCost: op.maxCost };
    }

    // 고집: 같은 턴 두 번째 카드면 복사본
    if (
      owner.personality?.id === "stubborn" && !c.isCopy && !owner.stubbornUsed &&
      owner.playedThisTurn === 2 && this.hand.length < C.hand_max
    ) {
      owner.stubbornUsed = true;
      this.hand.push({ uid: this.nextUid++, cardId: c.cardId, owner: c.owner, tempCostDelta: 0, locked: false, isCopy: true, grow: 0 });
      this.log(`${owner.def.name}(고집): ${def.name} 복사본 얻음`);
    }
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
    this.events.push({ k: "spiritAct", id: owner.id, card: def.name });
    this.log(`${owner.def.name}: ${def.name}`);
    const resolveTargets = () => {
      let enemies: BEnemy[] = [];
      let allies: BSpirit[] = [];
      if (def.target === "enemy") {
        let e = p.target?.side === "e" ? this.enemy(p.target.uid) : undefined;
        if (!e || e.dead) e = this.aliveEnemies()[0];
        if (e) enemies = [e];
      } else if (def.target === "allEnemies") enemies = this.aliveEnemies();
      else if (def.target === "self") allies = [owner];
      else if (def.target === "ally") {
        let s = p.target?.side === "s" ? this.spirit(p.target.id) : undefined;
        if (!s || s.downed) s = owner;
        allies = [s];
      } else allies = this.aliveSpirits();
      return { enemies, allies };
    };
    this.resolve(def, c, owner, resolveTargets(), p.comboCount);
    if (p.repeat && this.result === "ongoing") {
      this.log(`제피로스: ${def.name} 한 번 더`);
      this.resolve(def, c, owner, resolveTargets(), p.comboCount);
    }
    const isAura = def.effects.some((o) => o.op === "aura");
    if (def.exhaust || c.isCopy || isAura) this.exhaust.push(c);
    else this.discard.push(c);
  }

  private resolve(
    def: CardDef, c: BCard, owner: BSpirit,
    tg: { enemies: BEnemy[]; allies: BSpirit[] }, comboCount: number,
  ) {
    let mainUsed = false;
    const withGrow = (v: number) => {
      if (mainUsed) return v;
      mainUsed = true;
      return v + c.grow;
    };
    const run = (ops: CardOp[]) => {
      for (const op of ops) {
        if (this.result !== "ongoing") return;
        this.resolveOp(op, def, c, owner, tg, withGrow, comboCount, run);
      }
    };
    run(def.effects);
  }

  private resolveOp(
    op: CardOp, def: CardDef, c: BCard, owner: BSpirit,
    tg: { enemies: BEnemy[]; allies: BSpirit[] },
    withGrow: (v: number) => number, comboCount: number, run: (ops: CardOp[]) => void,
  ) {
    const focus = this.stat(owner, "focus");
    const guard = this.stat(owner, "guard");
    switch (op.op) {
      case "damage": {
        const base = withGrow(op.value);
        for (const e of tg.enemies) {
          const times = op.againIf === "burned" && e.status.burn > 0 ? 2 : 1;
          for (let t = 0; t < times; t++)
            for (let h = 0; h < (op.hits ?? 1); h++) if (!e.dead) this.cardHit(owner, e, base, def.element, false);
        }
        break;
      }
      case "damageFromBlock":
        for (const e of tg.enemies) if (!e.dead) this.cardHit(owner, e, owner.block, def.element, true);
        break;
      case "damagePerPlayed": {
        const n = this.playedByElement[op.element] ?? 0;
        const base = withGrow(op.value * n);
        this.log(`이번 전투 ${ELEMENT_NAME[op.element]} 카드 ${n}장`);
        if (base > 0) for (const e of tg.enemies) if (!e.dead) this.cardHit(owner, e, base, def.element, false);
        break;
      }
      case "block": {
        const v = round(scale(withGrow(op.value), guard) * this.kindMult(owner));
        for (const s of tg.allies) this.gainBlock(s, v);
        break;
      }
      case "heal": {
        const v = round(scale(withGrow(op.value), focus) * this.healMult(owner) * this.kindMult(owner));
        for (const s of tg.allies) this.healSpirit(s, v);
        break;
      }
      case "burn": {
        let v = scale(withGrow(op.value), focus);
        v = this.burnAmount(owner, v);
        for (const e of tg.enemies) if (!e.dead) {
          e.status.burn += v;
          this.events.push({ k: "status", ref: { side: "e", uid: e.uid }, text: `화상 ${v}` });
        }
        break;
      }
      case "ignite":
        for (const e of tg.enemies) if (!e.dead && e.status.burn > 0) {
          const amt = round(e.status.burn * this.vulnMult(e.status));
          e.status.burn = 0;
          this.log(`점화: 피해 ${amt}`);
          this.hurtEnemy(e, amt, true);
        }
        break;
      case "burnMultiply":
        for (const e of tg.enemies) if (!e.dead) {
          e.status.burn *= op.value;
          this.events.push({ k: "status", ref: { side: "e", uid: e.uid }, text: `화상 ×${op.value}` });
        }
        break;
      case "chill": {
        let v = scale(withGrow(op.value), focus);
        if (owner.release > 0) v *= (C.release_chill_mult as Record<string, number>)[owner.id] ?? 1;
        for (const e of tg.enemies) if (!e.dead) this.addChill(e, v);
        break;
      }
      case "freeze":
        for (const e of tg.enemies) if (!e.dead) {
          if (e.def.tier === "boss") this.addChill(e, op.bossChill);
          else this.freezeEnemy(e);
        }
        break;
      case "thorns": {
        // 아군을 고르는 카드(담금질 유리)는 고른 아군 모두가 받아요. 그 밖에는 카드 주인
        const v = scale(withGrow(op.value), guard);
        for (const s of tg.allies.length ? tg.allies : [owner]) {
          s.thorns += v;
          this.events.push({ k: "status", ref: { side: "s", id: s.id }, text: `반격 ${s.thorns}` });
        }
        break;
      }
      case "grow":
        c.grow += op.value;
        this.log(`${def.name} 성장 +${op.value} (이번 전투 누적 +${c.grow})`);
        break;
      case "draw":
        // 놓는 즉시 처리했어요 (play)
        break;
      case "vulnerable": {
        const pct = Math.min(C.vuln_cap, C.vuln_base + Math.max(0, focus - C.stat_base) * C.vuln_focus_step);
        for (const e of tg.enemies) if (!e.dead) {
          e.status.vuln += op.turns;
          e.status.vulnPct = Math.max(e.status.vulnPct, pct);
          this.events.push({ k: "status", ref: { side: "e", uid: e.uid }, text: `취약 ${op.turns}` });
        }
        break;
      }
      case "weak":
        for (const e of tg.enemies) if (!e.dead) {
          e.status.weak += op.turns;
          this.events.push({ k: "status", ref: { side: "e", uid: e.uid }, text: `약화 ${op.turns}` });
        }
        break;
      case "empower": {
        const v = scale(withGrow(op.value), focus);
        for (const s of tg.allies) {
          s.empower += v;
          this.events.push({ k: "status", ref: { side: "s", id: s.id }, text: `강화 +${v}` });
        }
        break;
      }
      case "keepBlock":
        owner.keepBlock = true;
        this.events.push({ k: "status", ref: { side: "s", id: owner.id }, text: "방어도 유지" });
        this.log(`${owner.def.name}의 방어도가 이번 전투 동안 사라지지 않아요.`);
        break;
      case "taunt":
        owner.taunt = true;
        this.events.push({ k: "status", ref: { side: "s", id: owner.id }, text: "도발" });
        break;
      case "moveFront":
        this.frontId = owner.id;
        this.log(`${owner.def.name}: 앞열로 나섬`);
        break;
      case "manaNextTurn":
        this.nextTurnMana += op.value;
        break;
      case "aura":
        if (op.aura === "eye_of_storm") this.eyeOfStorm = op.value;
        else owner.auras.set(op.aura, (owner.auras.get(op.aura) ?? 0) + op.value);
        this.events.push({ k: "status", ref: { side: "s", id: owner.id }, text: `지속: ${def.name}` });
        break;
      case "repeatNext":
        // 놓는 즉시 처리했어요 (play)
        break;
      case "combo":
        if (comboCount >= op.n) {
          this.log(`연속 ${op.n} 발동`);
          run(op.then);
        }
        break;
    }
  }

  private healMult(owner: BSpirit) {
    return owner.release > 0 ? ((C.release_heal_mult as Record<string, number>)[owner.id] ?? 1) : 1;
  }

  /** 다정: 아군에게 거는 회복·방어도가 늘어요. */
  private kindMult(owner: BSpirit) {
    const p = owner.personality;
    return p?.id === "kind" ? (p.mult ?? 1) : 1;
  }

  private burnAmount(owner: BSpirit, v: number) {
    v += owner.auras.get("blaze_wing") ?? 0;
    if (owner.release > 0) v *= (C.release_burn_mult as Record<string, number>)[owner.id] ?? 1;
    return v;
  }

  private vulnMult(st: Status) {
    return st.vuln > 0 ? 1 + st.vulnPct : 1;
  }

  /** 카드의 직접 피해 1타. 기본값 × 파워/10 × 상성 × 치명 × 취약 × 약화, 마지막에 반올림. */
  private cardHit(owner: BSpirit, e: BEnemy, base: number, element: Element, noPower: boolean) {
    const power = noPower ? C.stat_base : this.stat(owner, "power");
    const aff = affinity(element, e.def.element);
    const chance = C.crit_base + owner.critPity;
    const crit = this.rng.next() < chance;
    owner.critPity = crit ? 0 : owner.critPity + C.crit_pity;
    const release = owner.release > 0 ? ((C.release_damage_mult as Record<string, number>)[owner.id] ?? 1) : 1;
    // 허점타: 적 행동 직전 창 안에 끝나는 공격 (0036 뼈대 8). 치명과 따로 곱해요.
    const opening = this.inEnemyTurn && this.inOpening(e, this.now);
    const dmg = round(
      (base + owner.empower) * (power / C.stat_base) * aff * (crit ? C.crit_mult : 1) *
      this.vulnMult(e.status) * (owner.status.weak > 0 ? C.weak_mult : 1) * release *
      (opening ? C.opening_mult : 1),
    );
    this.hurtEnemy(e, dmg, false, { crit, weakHit: aff > 1, resist: aff < 1, ...(opening ? { opening } : {}) });
  }

  private addChill(e: BEnemy, v: number) {
    e.status.chill += v;
    this.events.push({ k: "status", ref: { side: "e", uid: e.uid }, text: `냉기 ${v}` });
    if (e.status.chill >= this.chillThreshold(e)) {
      e.status.chill = 0;
      this.freezeEnemy(e);
    }
  }

  /** 빙결 = 늦추기 (0039). 이번 턴 남은 행동을 늦추고, 축 끝을 넘으면 다음 턴으로 밀려요. 이미 행동했으면 다음 턴 행동이 늦어져요. */
  private freezeEnemy(e: BEnemy) {
    const d = C.freeze_delay_ms;
    this.events.push({ k: "freeze", uid: e.uid });
    const slot = this.slots.find((x) => x.uid === e.uid && !x.done);
    if (slot) {
      const at = slot.at + d;
      if (at >= C.axis_ms) {
        slot.done = true;
        e.carryAt = at - C.axis_ms;
        this.events.push({ k: "delay", uid: e.uid, ms: d, nextTurn: true });
        this.log(`${e.def.name} 빙결: 행동이 다음 턴으로 밀림`);
      } else {
        slot.at = at;
        this.events.push({ k: "delay", uid: e.uid, ms: d, nextTurn: false });
        this.log(`${e.def.name} 빙결: 행동 ${d}ms 늦어짐`);
      }
    } else {
      e.delayNext += d;
      this.events.push({ k: "delay", uid: e.uid, ms: d, nextTurn: true });
      this.log(`${e.def.name} 빙결: 다음 턴 행동 ${d}ms 늦어짐`);
    }
  }

  private hurtEnemy(e: BEnemy, dmg: number, pierce: boolean, extra: { crit?: boolean; weakHit?: boolean; resist?: boolean } = {}) {
    let blocked = 0;
    if (!pierce) {
      blocked = Math.min(e.block, dmg);
      e.block -= blocked;
    }
    const real = dmg - blocked;
    e.hp = Math.max(0, e.hp - real);
    this.events.push({ k: "damage", ref: { side: "e", uid: e.uid }, amount: real, blocked, ...extra });
    if (e.hp <= 0) {
      e.dead = true;
      this.events.push({ k: "enemyDead", uid: e.uid });
      this.log(`${e.def.name} 쓰러짐`);
      return;
    }
    const p2 = e.def.phase2;
    if (p2 && e.phase === 1 && e.hp < e.maxHp * p2.hpBelow) {
      e.phase = 2;
      e.patternIdx = 0;
      e.charging = false;
      this.events.push({ k: "phase2", uid: e.uid });
      this.log(`${e.def.name} 분노: 2페이즈`);
    }
  }

  private hurtSpirit(s: BSpirit, dmg: number, pierce: boolean, src?: string) {
    let blocked = 0;
    if (!pierce) {
      blocked = Math.min(s.block, dmg);
      s.block -= blocked;
    }
    const real = dmg - blocked;
    s.hp = Math.max(0, s.hp - real);
    this.events.push({ k: "damage", ref: { side: "s", id: s.id }, amount: real, blocked });
    if (src) this.log(`${s.def.name} ${src} 피해 ${real}`);
    if (s.hp <= 0) this.downSpirit(s);
  }

  private downSpirit(s: BSpirit) {
    s.downed = true;
    s.block = 0;
    s.status = newStatus();
    s.release = 0;
    this.events.push({ k: "downed", id: s.id });
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

  private gainBlock(s: BSpirit, v: number) {
    if (s.downed) return;
    s.block += v;
    this.events.push({ k: "block", ref: { side: "s", id: s.id }, amount: v });
  }

  private healSpirit(s: BSpirit, v: number) {
    if (s.downed) return;
    const amt = Math.min(v, s.maxHp - s.hp);
    s.hp += amt;
    this.events.push({ k: "heal", ref: { side: "s", id: s.id }, amount: amt });
  }

  /** 해방할 수 있는지: 각성체만, 전투마다 한 번, 내 턴에. 놓는 즉시 켜져요. 칸 비용은 정령마다 다르게 정할 예정(0036 4절, `TODO_TOKEN`). */
  canRelease(id: string): boolean {
    const s = this.spirit(id);
    return this.result === "ongoing" && !this.inEnemyTurn && !s.downed && !s.releaseUsed && s.run.stage === "awakened";
  }

  release(id: string): boolean {
    if (!this.canRelease(id)) return false;
    const s = this.spirit(id);
    s.releaseUsed = true;
    s.release = C.release_duration;
    this.events.push({ k: "release", id: s.id });
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

  private log(text: string) {
    this.events.push({ k: "log", text });
  }
}
