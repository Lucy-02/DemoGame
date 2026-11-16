// core 전투 상태 → 전투 화면 VM. 고정 장면(fixtures/) 대신 실제 전투를 그릴 때 써요.
// 화면은 이 VM만 알고 Battle은 몰라요. 카드 key는 `c<uid>`예요 (cardRef로 되돌려요).
import { C, cardDef } from "../../core/data";
import type { BCard, BEnemy, BSpirit, Battle, Ref, StatusId } from "../../core/battle";
import type { EnemyAction, EnemyTargetRule } from "../../core/types";
import { ELEMENT_ICON, faceKey } from "../faces";
import { cardVM, equipVM } from "../run/fromCore";
import { STAT_IDS, type StatId } from "../run/viewmodel";
import { COPY } from "./copy";
import type { AllyTokenVM, AllyVM, BattleVM, EnemyVM, IntentTarget, IntentVM, OrderSlotVM, OrderTipVM, PlayVM, StatusVM, UnitRef } from "./viewmodel";

/** 상태 → 정본 기호. 기호가 아직 없는 상태(벽·늦춤·별 등)는 그리지 않아요 (기호는 Lucy 확인 대기) */
const STATUS_ICON: Partial<Record<StatusId, string>> = {
  burn: "kw-burn", chill: "kw-chill", vuln: "kw-vuln", weak: "kw-weak", thorns: "kw-thorns", taunt: "kw-taunt", empower: "kw-strength",
};

/** 적 행동 → 의도 기호. 공격 의도 = fx-damage (0072) */
const ACTION_ICON: Partial<Record<EnemyAction["type"], string>> = {
  attack: "fx-damage", block: "fx-block", weak: "kw-weak", vulnerable: "kw-vuln", burn: "kw-burn", burnRamp: "kw-burn", buffMinions: "kw-strength",
};
const CHARGE_ICON = "kw-charge";
export const BREAK_ICON = "kw-break";

export const cardKey = (c: BCard) => `c${c.uid}`;
export const cardUid = (key: string) => Number(key.slice(1));

/** place: 순서표 머리의 장소 글 (판이 알려 줘요) */
export function battleVM(b: Battle, place?: string): BattleVM {
  const alive = b.spirits;
  const order = orderOf(b);
  const allies = alive.map((s) => allyVM(b, s));
  const enemies = b.enemies.filter((e) => !e.dead).map((e) => enemyVM(b, e, order));
  const hand = alive
    .map((s) => ({ owner: s.id, cards: b.hand.filter((c) => c.owner === s.id).map((c) => handCard(b, c)) }))
    .filter((g) => g.cards.length > 0);
  const plays: Record<string, PlayVM> = {};
  for (const c of b.hand) if (b.canPlay(c).ok) plays[cardKey(c)] = { target: targetRule(b, c), slot: slotOf(b, c) };
  return {
    order: { slots: order.map((o) => o.slot), bundles: bundlesOf(b).map((l) => l.map((t) => t.token)), head: { place, turn: b.turn } },
    allies, enemies,
    mana: { n: b.mana, max: C.mana_per_turn },
    hand,
    playable: Object.keys(plays).length,
    piles: { draw: b.draw.length, discard: b.discard.length, exhaust: b.exhaust.length },
    plays,
  };
}

/** 화면이 고른 대상(편 + 인덱스)을 전투의 대상으로 */
export function refOf(b: Battle, u: UnitRef | undefined): Ref | undefined {
  if (!u) return undefined;
  if (u.side === "ally") {
    const s = b.spirits[u.i];
    return s && { side: "s", id: s.id };
  }
  const e = b.enemies.filter((x) => !x.dead)[u.i];
  return e && { side: "e", uid: e.uid };
}

// ── 순서표: 이번 턴 남은 적 행동을 시각 순서대로 ──

interface OrderEntry {
  uid: number;
  slot: OrderSlotVM;
}

function orderOf(b: Battle): OrderEntry[] {
  const slots = openSlots(b);
  return slots.map((x, i) => {
    const e = b.enemy(x.uid);
    const move = b.moveQueue(e).find((m) => m.at === x.at)?.move ?? b.currentMove(e);
    const main = move.actions[0];
    const enemy = b.enemies.filter((q) => !q.dead).findIndex((q) => q.uid === x.uid);
    const charge = e.charging || undefined;
    const tip: OrderTipVM = {
      title: e.def.name, kind: charge && COPY.order.charge,
      result: main?.type === "attack" ? { who: whoOf(b, main), value: amountOf(b, e, main) } : undefined,
      text: [{ text: b.intent(e).text }],
      chips: [{ text: COPY.order.n(i + 1) }, ...(charge ? [{ text: COPY.order.breakable, tone: "acc" as const }] : [])],
    };
    return { uid: x.uid, slot: { n: i + 1, art: "", action: (main && ACTION_ICON[main.type]) ?? CHARGE_ICON, charge, enemy: enemy < 0 ? undefined : enemy, tip } };
  });
}

/** 한 아군을 노리는 행동이면 그 아군 이름 (전체 · 무작위는 비워요) */
function whoOf(b: Battle, a: EnemyAction): string | undefined {
  if (!("target" in a) || a.target === "all" || a.target === "random") return undefined;
  const id = aims(b, a.target)[0];
  return id === undefined ? undefined : b.spirit(id).def.name;
}

/** 이번 턴 남은 적 행동. 같은 시각이면 왼쪽 적이 먼저 (0038 정렬) */
const openSlots = (b: Battle) => b.slots.filter((x) => !x.done).sort((x, y) => x.at - y.at || x.uid - y.uid);

export interface PlannedToken {
  token: AllyTokenVM;
  /** 놓은 카드 (호버 풀이) */
  cardId: string;
  owner: string;
}

interface Lane {
  end: number;
  owner: string;
  card: BCard;
  target?: Ref;
}

/**
 * 카드들을 끝나는 시각으로 적 칸 사이에 묶어요 (0038 정렬).
 * 같은 시각이면 아군이 적보다 먼저, 아군끼리는 스피드가 높은 정령 → 앞열에 가까운 정령 순서예요.
 */
function bundle(b: Battle, lanes: Lane[]): Lane[][] {
  const ats = openSlots(b).map((x) => x.at);
  const out: Lane[][] = ats.map(() => []);
  out.push([]);
  const rank = (id: string) => (id === b.frontId ? -1 : b.spirits.findIndex((s) => s.id === id));
  const speed = (id: string) => b.stat(b.spirit(id), "speed");
  const sorted = [...lanes].sort((x, y) => x.end - y.end || speed(y.owner) - speed(x.owner) || rank(x.owner) - rank(y.owner));
  for (const p of sorted) {
    const k = ats.findIndex((at) => p.end <= at);
    out[k < 0 ? ats.length : k].push(p);
  }
  return out;
}

/** 허점: 적 행동 직전 창 안에 끝나는 공격 (0059). 노린 적, 대상이 없으면 살아 있는 적 가운데 하나라도 */
function hitsOpening(b: Battle, p: Lane): boolean {
  if (!cardDef(p.card.cardId).effects.some((op) => op.op === "damage")) return false;
  const targets = p.target?.side === "e" ? [b.enemy(p.target.uid)] : p.target ? [] : b.aliveEnemies();
  return targets.some((e) => b.inOpening(e, p.end));
}

/** k번째 묶음의 토큰. 묶음 뒤에 적 칸이 있으면 그 번호의 "앞" 칩 */
function tokenOf(b: Battle, p: Lane, k: number, slots: number): PlannedToken {
  const icon = cardVM(p.card.cardId, p.owner).values[0]?.icon ?? CHARGE_ICON;
  const vm = handCard(b, p.card);
  const gap = hitsOpening(b, p);
  const tip: OrderTipVM = {
    title: vm.name, kind: COPY.order.card, text: vm.detail.text,
    chips: [...(k < slots ? [{ text: COPY.order.before(k + 1) }] : []), ...(gap ? [{ text: COPY.order.gap, tone: "warn" as const }] : [])],
  };
  return { token: { face: p.owner, icon, mark: gap ? "gap" : undefined, tip }, cardId: p.card.cardId, owner: p.owner };
}

const lanesOf = (b: Battle): Lane[] => b.planned.map((p) => ({ end: p.end, owner: p.owner, card: p.card, target: p.target }));

export function bundlesOf(b: Battle): PlannedToken[][] {
  const out = bundle(b, lanesOf(b));
  return out.map((l, k) => l.map((p) => tokenOf(b, p, k, out.length - 1)));
}

/** 지금 놓으면 들어갈 자리 (든 동안 순서표에 흰 점선 토큰, 0074) */
function slotOf(b: Battle, c: BCard): PlayVM["slot"] {
  const me: Lane = { end: b.previewEnd(c), owner: c.owner, card: c };
  const out = bundle(b, [...lanesOf(b), me]);
  const k = out.findIndex((l) => l.includes(me));
  return { bundle: k, i: out[k].indexOf(me), token: { ...tokenOf(b, me, k, out.length - 1).token, mark: "held" } };
}

// ── 아군 ──

function allyVM(b: Battle, s: BSpirit): AllyVM {
  return {
    face: s.id, name: s.def.name, element: ELEMENT_ICON[s.def.element] ?? ELEMENT_ICON.none, art: "",
    hp: s.hp, maxHp: s.maxHp, block: s.block || undefined,
    incoming: incomingTo(b, s) || undefined,
    statuses: statusesOf(s),
    front: b.frontId === s.id,
    equip: s.run.equipment.length ? s.run.equipment.map((e) => equipVM(e, s.run.stage)) : undefined,
  };
}

/** 이번 적 차례에 이 아군이 받을 공격 피해 합계: 이번 턴 적 행동 전부 (0038 정보판 연동) */
function incomingTo(b: Battle, s: BSpirit): number {
  if (s.downed) return 0;
  let sum = 0;
  for (const e of b.aliveEnemies()) {
    for (const { move } of b.moveQueue(e)) {
      for (const a of move.actions) {
        if (a.type !== "attack") continue;
        if (!aims(b, a.target).includes(s.id)) continue;
        sum += b.enemyDmgPreview(e, a.dmg) * (a.hits ?? 1);
      }
    }
  }
  return sum;
}

function aims(b: Battle, rule: EnemyTargetRule): string[] {
  const alive = b.aliveSpirits();
  if (rule === "all") return alive.map((s) => s.id);
  if (rule === "front") return [b.frontId];
  if (rule === "lowest") {
    const low = alive.reduce<BSpirit | undefined>((m, s) => (!m || s.hp < m.hp ? s : m), undefined);
    return low ? [low.id] : [];
  }
  // 무작위: 아군이 하나뿐이면 그 아군이 맞아요. 여럿이면 누가 맞을지 몰라 세지 않아요
  return alive.length === 1 ? [alive[0].id] : [];
}

function statusesOf(h: BSpirit | BEnemy): StatusVM[] {
  const out: StatusVM[] = [];
  for (const [id, st] of Object.entries(h.status) as [StatusId, { n: number }][]) {
    const icon = STATUS_ICON[id];
    if (icon && st.n > 0) out.push({ icon, n: st.n });
  }
  return out;
}

// ── 적 ──

/** 이 속성을 이기는 속성 (약점). 없으면 undefined (바람 · 무속성, 0028) */
function weakTo(element: string): string | undefined {
  const beats = C.affinity_beats as Record<string, string>;
  const atk = Object.keys(beats).find((k) => beats[k] === element);
  return atk ? ELEMENT_ICON[atk] : undefined;
}

function enemyVM(b: Battle, e: BEnemy, order: OrderEntry[]): EnemyVM {
  return {
    art: "", hp: e.hp, maxHp: e.maxHp, block: e.block || undefined,
    element: ELEMENT_ICON[e.def.element] ?? ELEMENT_ICON.none, weakTo: weakTo(e.def.element),
    statuses: statusesOf(e),
    intent: intentOf(b, e, order),
    tip: { name: e.def.name, rank: COPY.rank[e.def.tier], lines: [[{ text: b.intent(e).text }]] },
  };
}

function intentOf(b: Battle, e: BEnemy, order: OrderEntry[]): IntentVM | undefined {
  const it = b.intent(e);
  if (it.kind === "skip") return undefined;
  const n = order.findIndex((o) => o.uid === e.uid);
  const move = b.moveQueue(e)[0]?.move ?? b.currentMove(e);
  const main = move.actions.find((a) => a.type === "attack") ?? move.actions[0];
  const at = n < 0 ? undefined : n + 1;
  const target = main ? targetOf(b, main) : "none";
  const amount = main ? amountOf(b, e, main) : "";
  if (it.kind === "charge" || it.kind === "chargeReady") return { kind: "charge", order: at, icon: CHARGE_ICON, amount, target };
  const icon = (main && ACTION_ICON[main.type]) ?? CHARGE_ICON;
  if (it.kind === "debuff") return { kind: "debuff", order: at, icon, amount, target };
  return { kind: it.kind, order: at, icon, amount, target };
}

function targetOf(b: Battle, a: EnemyAction): IntentTarget {
  if (!("target" in a)) return "none";
  if (a.target === "all") return "all";
  if (a.target === "random") return "random";
  return aims(b, a.target)[0] ?? "none";
}

function amountOf(b: Battle, e: BEnemy, a: EnemyAction): string {
  switch (a.type) {
    case "attack": {
      const d = b.enemyDmgPreview(e, a.dmg);
      return a.hits && a.hits > 1 ? `${d}×${a.hits}` : `${d}`;
    }
    case "weak":
    case "vulnerable": return `${a.turns}`;
    default: return "value" in a ? `${a.value}` : "";
  }
}

// ── 손패 ──

function handCard(b: Battle, c: BCard) {
  const s = b.spirit(c.owner);
  const st = Object.fromEntries(STAT_IDS.map((k) => [k, b.stat(s, k)])) as Record<StatId, number>;
  const vm = cardVM(c.cardId, c.owner, st);
  const cost = b.cardCost(c);
  const chk = b.canPlay(c);
  return {
    ...vm, key: cardKey(c), cost, face: faceKey(c.owner),
    costShort: cost > b.mana || undefined,
    off: !chk.ok || undefined,
    detail: { ...vm.detail, why: chk.why },
  };
}

function targetRule(b: Battle, c: BCard): PlayVM["target"] {
  const need = b.needsTarget(c);
  if (need === "enemy") return { kind: "pick", side: "enemy" };
  if (need === "ally") return { kind: "pick", side: "ally" };
  switch (cardDef(c.cardId).target) {
    case "allEnemies": return { kind: "all", side: "enemy" };
    // 적이 하나면 고르지 않고 그 적에게
    case "enemy": return { kind: "all", side: "enemy" };
    default: return { kind: "all", side: "ally" };
  }
}
