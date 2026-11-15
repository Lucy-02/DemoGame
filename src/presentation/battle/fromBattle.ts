// core 전투 상태 → 전투 화면 VM. 고정 장면(fixtures/) 대신 실제 전투를 그릴 때 써요.
// 화면은 이 VM만 알고 Battle은 몰라요. 카드 key는 `c<uid>`예요 (cardRef로 되돌려요).
import { C, cardDef } from "../../core/data";
import type { BCard, BEnemy, BSpirit, Battle, Ref, StatusId } from "../../core/battle";
import type { EnemyAction, EnemyTargetRule } from "../../core/types";
import { ELEMENT_ICON, faceKey } from "../faces";
import { cardVM, equipVM } from "../run/fromCore";
import { STAT_IDS, type StatId } from "../run/viewmodel";
import { COPY } from "./copy";
import type { AllyVM, BattleVM, EnemyVM, IntentTarget, IntentVM, OrderSlotVM, PlayVM, StatusVM, UnitRef } from "./viewmodel";

/** 상태 → 정본 기호. 기호가 아직 없는 상태(벽·늦춤·별 등)는 그리지 않아요 (기호는 Lucy 확인 대기) */
const STATUS_ICON: Partial<Record<StatusId, string>> = {
  burn: "kw-burn", chill: "kw-chill", vuln: "kw-vuln", weak: "kw-weak", thorns: "kw-thorns", taunt: "kw-taunt", empower: "kw-strength",
};

/** 적 행동 → 의도 기호 (정본 임시 기호. 공격 의도 기호는 0024에서 Lucy 선택 대기) */
const ACTION_ICON: Partial<Record<EnemyAction["type"], string>> = {
  attack: "i-claw", block: "fx-block", weak: "kw-weak", vulnerable: "kw-vuln", burn: "kw-burn", burnRamp: "kw-burn", buffMinions: "kw-strength",
};
const CHARGE_ICON = "kw-charge";

export const cardKey = (c: BCard) => `c${c.uid}`;
export const cardUid = (key: string) => Number(key.slice(1));

export function battleVM(b: Battle): BattleVM {
  const alive = b.spirits;
  const order = orderOf(b);
  const allies = alive.map((s) => allyVM(b, s));
  const enemies = b.enemies.filter((e) => !e.dead).map((e) => enemyVM(b, e, order));
  const hand = alive
    .map((s) => ({ owner: s.id, cards: b.hand.filter((c) => c.owner === s.id).map((c) => handCard(b, c)) }))
    .filter((g) => g.cards.length > 0);
  const plays: Record<string, PlayVM> = {};
  for (const c of b.hand) if (b.canPlay(c).ok) plays[cardKey(c)] = { target: targetRule(b, c) };
  return {
    order: { slots: order.map((o) => o.slot), nextTurn: b.turn + 1 },
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
  const slots = b.slots.filter((x) => !x.done).sort((x, y) => x.at - y.at);
  return slots.map((x, i) => {
    const e = b.enemy(x.uid);
    const move = b.moveQueue(e).find((m) => m.at === x.at)?.move ?? b.currentMove(e);
    const main = move.actions[0];
    return { uid: x.uid, slot: { n: i + 1, art: "", action: (main && ACTION_ICON[main.type]) ?? CHARGE_ICON } };
  });
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

/** 이번 적 차례에 이 아군이 받을 공격 피해 합계 (앞열 · 최저 · 전체만. 무작위는 누가 맞을지 몰라 세지 않아요) */
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
  return [];
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
