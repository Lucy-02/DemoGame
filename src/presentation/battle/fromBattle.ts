// core 전투 상태 → 전투 화면 VM. 고정 장면(fixtures/) 대신 실제 전투를 그릴 때 써요.
// 화면은 이 VM만 알고 Battle은 몰라요. 카드 key는 `c<uid>`예요 (cardRef로 되돌려요).
import { C, cardDef } from "../../core/data";
import { statusN, type BCard, type BEnemy, type BSpirit, type Battle, type EnemySlot, type Forecast, type Planned, type Ref, type StatusId } from "../../core/battle";
import type { EnemyAction, EnemyTargetRule } from "../../core/types";
import { ELEMENT_ICON, faceKey } from "../faces";
import { cardVM, equipVM, releaseVM, richText, type CardStats } from "../run/fromCore";
import type { RichText } from "../tooltip/content";
import { STAT_IDS, type StatId } from "../run/viewmodel";
import { COPY } from "./copy";
import type { AllyTokenVM, AllyVM, BandVM, BattleVM, EnemyVM, IntentTarget, IntentVM, OrderSlotVM, OrderTipVM, OutcomeVM, PickVM, PlayVM, StatusVM, UnitRef } from "./viewmodel";

/** 2막 규칙의 임시 기호 (0096: 새 기호를 그릴 때까지 있는 기호를 빌려 써요, TODO_ICON) */
const BURROW_ICON = "i-veil";
const REFLECT_ICON = "kw-counter";
const HASTE_ICON = "i-bolt";

/** 상태 → 정본 기호. 기호가 아직 없는 상태(벽·늦춤·별 등)는 그리지 않아요 (기호는 Lucy 확인 대기) */
const STATUS_ICON: Partial<Record<StatusId, string>> = {
  burrow: BURROW_ICON, burn: "kw-burn", chill: "kw-chill", vuln: "kw-vuln", weak: "kw-weak", thorns: "kw-thorns", taunt: "kw-taunt", empower: "kw-strength",
};

/** 적 행동 → 의도 기호. 공격 의도 = fx-damage (0072) */
const ACTION_ICON: Partial<Record<EnemyAction["type"], string>> = {
  attack: "fx-damage", attackRamp: "fx-damage", burrow: BURROW_ICON, block: "fx-block", weak: "kw-weak", vulnerable: "kw-vuln", burn: "kw-burn", burnRamp: "kw-burn", buffMinions: "kw-strength",
};
const CHARGE_ICON = "kw-charge";
export const BREAK_ICON = "kw-break";

const PERCENT = 100;

export const cardKey = (c: BCard) => `c${c.uid}`;
export const cardUid = (key: string) => Number(key.slice(1));
/** 해방 카드 key (`r:<정령 id>`) */
const RELEASE = "r:";
export const releaseKey = (spiritId: string) => RELEASE + spiritId;
export const releaseId = (key: string) => (key.startsWith(RELEASE) ? key.slice(RELEASE.length) : undefined);

/** place: 순서표 머리의 장소 글 (판이 알려 줘요) */
export function battleVM(b: Battle, place?: string): BattleVM {
  const alive = b.spirits;
  const order = orderOf(b);
  const incoming = b.forecast();
  const allies = alive.map((s) => allyVM(b, s, incoming));
  const enemies = b.enemies.filter((e) => !e.dead).map((e) => enemyVM(b, e, order));
  const pick = pickOf(b);
  // 해방 카드: 아직 안 쓴 각성체 묶음 끝에 늘 붙어 있어요. 뽑지 않고 손패 장수에 세지 않아요 (0075)
  const releases = alive.filter((s) => !s.downed && !s.releaseUsed && s.run.stage === "awakened");
  const releaseCard = (s: BSpirit) => ({ ...releaseVM(s.id, C.release_cost), key: releaseKey(s.id), face: faceKey(s.id), off: !b.canRelease(s.id) || undefined });
  const hand = alive
    .map((s) => ({
      owner: s.id,
      cards: [...b.hand.filter((c) => c.owner === s.id).map((c) => handCard(b, c)), ...(releases.includes(s) ? [releaseCard(s)] : [])],
    }))
    .filter((g) => g.cards.length > 0);
  const plays: Record<string, PlayVM> = {};
  if (!pick) {
    for (const c of b.hand) {
      if (!b.canPlay(c).ok) continue;
      const target = targetRule(b, c);
      plays[cardKey(c)] = { target, slot: slotOf(b, c), outcomes: outcomesOf(b, c, target, incoming) };
    }
  }
  const playable = Object.keys(plays).length;
  if (!pick) {
    for (const s of releases) if (b.canRelease(s.id)) plays[releaseKey(s.id)] = { target: { kind: "pick", side: "ally", only: alive.indexOf(s) }, slot: slotOf(b, { end: b.releaseEnd(s.id), owner: s.id, card: null }) };
  }
  return {
    order: { slots: order.map((o) => o.slot), bundles: bundlesOf(b).map((l) => l.map((t) => t.token)), bands: bandsOf(b, bundle(b, lanesOf(b))), head: { place, turn: b.turn } },
    allies, enemies,
    mana: { n: b.mana, max: C.mana_per_turn },
    hand,
    playable,
    piles: { draw: b.draw.length, discard: b.discard.length, exhaust: b.exhaust.length },
    plays, pick,
  };
}

/** 열린 고르기: 턴 끝 품기가 먼저, 없으면 낙하 */
function pickOf(b: Battle): PickVM | undefined {
  const hold = b.holdChoice;
  if (hold) {
    const cards = hold.cards.flatMap((uid) => b.hand.filter((c) => c.uid === uid));
    return {
      kind: "hold", n: hold.n, picked: hold.auto.map((uid) => `c${uid}`),
      cards: cards.map((c) => ({ ...handCard(b, c), off: undefined, costShort: undefined })),
    };
  }
  const fall = b.stars.choice;
  if (fall && b.result === "ongoing") {
    const st = castStats(b, b.spirit(fall.owner));
    return { kind: "fall", n: Math.min(fall.picks, fall.options.length), picked: [], cards: fall.options.map((id) => ({ ...cardVM(id, fall.owner, st), face: faceKey(fall.owner) })) };
  }
  return undefined;
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
      result: main?.type === "attack" ? { who: whoOf(b, main, x), value: amountOf(b, e, main) } : undefined,
      text: richText(b.intent(e).text),
      chips: [{ text: COPY.order.n(i + 1) }, ...(charge ? [{ text: COPY.order.breakable, tone: "acc" as const }] : [])],
    };
    return { uid: x.uid, slot: { key: `t${b.turn}:s${b.slots.indexOf(x)}`, n: i + 1, art: e.def.id, action: (main && ACTION_ICON[main.type]) ?? CHARGE_ICON, charge, enemy: enemy < 0 ? undefined : enemy, tip } };
  });
}

/** 한 아군을 노리는 행동이면 그 아군 이름 (전체, 여럿에게 갈리는 무작위는 비워요) */
function whoOf(b: Battle, a: EnemyAction, slot: EnemySlot): string | undefined {
  if (!("target" in a) || a.target === "all") return undefined;
  const id = aims(b, a.target, slot)[0];
  return id === undefined ? undefined : b.spirit(id).def.name;
}

/** 이번 턴 남은 적 행동. 같은 시각이면 왼쪽 적이 먼저 (0038 정렬) */
const openSlots = (b: Battle) => b.slots.filter((x) => !x.done).sort((x, y) => x.at - y.at || x.uid - y.uid);

export interface PlannedToken {
  token: AllyTokenVM;
  /** 놓은 카드 (호버 풀이) */
  cardId?: string;
  owner: string;
}

interface Lane {
  end: number;
  owner: string;
  /** 해방은 카드가 없어요 */
  card: BCard | null;
  /** 놓은 순서 (토큰 이름) */
  n?: number;
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
  if (!p.card || !cardDef(p.card.cardId).effects.some((op) => op.op === "damage")) return false;
  const targets = p.target?.side === "e" ? [b.enemy(p.target.uid)] : p.target ? [] : b.aliveEnemies();
  return targets.some((e) => b.inOpening(e, p.end));
}

/** 놓은 카드의 토큰 이름. 든 카드 자리는 놓으면 받을 이름을 미리 써서, 놓는 순간 같은 토큰으로 이어져요 */
const keyOf = (b: Battle, p: Lane) => `t${b.turn}:p${p.n ?? b.planned.length}`;

/** k번째 묶음의 토큰. 묶음 뒤에 적 칸이 있으면 그 번호의 "앞" 칩 */
function tokenOf(b: Battle, p: Lane, k: number, slots: number): PlannedToken {
  if (!p.card) {
    const vm = releaseVM(p.owner, C.release_cost);
    const tip: OrderTipVM = {
      title: b.spirit(p.owner).def.release.name, kind: vm.name, text: vm.detail.text,
      chips: k < slots ? [{ text: COPY.order.before(k + 1) }] : [],
    };
    return { token: { key: keyOf(b, p), face: p.owner, icon: "i-spark", mark: "release", undo: undoOf(b, p), tip }, owner: p.owner };
  }
  const icon = cardVM(p.card.cardId, p.owner).values[0]?.icon ?? CHARGE_ICON;
  const vm = handCard(b, p.card, p.n === undefined ? undefined : b.planned[p.n]);
  const gap = hitsOpening(b, p);
  const tip: OrderTipVM = {
    title: vm.name, kind: COPY.order.card, text: vm.detail.text,
    chips: [...(k < slots ? [{ text: COPY.order.before(k + 1) }] : []), ...(gap ? [{ text: COPY.order.gap, tone: "warn" as const }] : []), ...liveZones(b).filter((z) => p.end >= z.from && p.end < z.to).map((z) => ({ text: COPY.band.chip(z.dmg) }))],
  };
  return { token: { key: keyOf(b, p), face: p.owner, icon, mark: gap ? "gap" : undefined, undo: undoOf(b, p), tip }, cardId: p.card.cardId, owner: p.owner };
}

/** 마지막에 놓은 토큰이고 되돌릴 수 있으면 표시해요 (0074 7번) */
const undoOf = (b: Battle, p: Lane) => (p.n === b.planned.length - 1 && b.canUndo()) || undefined;

const lanesOf = (b: Battle): Lane[] => b.planned.map((p, n) => ({ end: p.end, owner: p.owner, card: p.card, target: p.target, n }));

export function bundlesOf(b: Battle): PlannedToken[][] {
  const out = bundle(b, lanesOf(b));
  return out.map((l, k) => l.map((p) => tokenOf(b, p, k, out.length - 1)));
}

/** 지금 놓으면 들어갈 자리 (든 동안 순서표에 흰 점선 토큰, 0074). 든 카드가 들어간 뒤의 띠 조각도 함께 줘요 */
function slotOf(b: Battle, c: BCard | Lane): PlayVM["slot"] {
  const me: Lane = "end" in c ? c : { end: b.previewEnd(c), owner: c.owner, card: c };
  const out = bundle(b, [...lanesOf(b), me]);
  const k = out.findIndex((l) => l.includes(me));
  return { bundle: k, i: out[k].indexOf(me), token: { ...tokenOf(b, me, k, out.length - 1).token, mark: "held" }, bands: bandsOf(b, out) };
}

/** 살아 있는 적이 깐 방전 칸 */
const liveZones = (b: Battle) => b.zones.filter((z) => !b.enemy(z.uid).dead);

/**
 * 방전 띠 (0096): 방전 칸마다, 그 구간이 걸치는 묶음 칸에 조각 하나씩.
 * 묶음 칸 k는 앞 적 행동 뒤부터 k번째 적 행동까지에 끝나는 카드 자리예요. 띠 안에서 끝나는 카드가 그 조각 위에 올라가요.
 */
function bandsOf(b: Battle, cells: Lane[][]): BandVM[] | undefined {
  const ats = openSlots(b).map((x) => x.at);
  const alive = b.enemies.filter((e) => !e.dead);
  const out: BandVM[] = [];
  for (const z of liveZones(b)) {
    let head = true;
    cells.forEach((list, k) => {
      const lo = k === 0 ? -Infinity : ats[k - 1], hi = k < ats.length ? ats[k] : Infinity;
      // 이 칸에 끝나는 시각: lo < end <= hi
      if (!(z.from <= hi && z.to > lo + 1)) return;
      const at = list.filter((p) => p.end < z.from).length;
      const n = list.filter((p) => p.end >= z.from && p.end < z.to).length;
      out.push({
        cell: k, at, n, dmg: z.dmg, head: head || undefined, enemy: alive.findIndex((e) => e.uid === z.uid),
        tip: { title: COPY.band.title, text: [{ text: COPY.band.sub(z.dmg) }] },
      });
      head = false;
    });
  }
  return out.length ? out : undefined;
}

// ── 아군 ──

/** incoming: 놓은 카드까지 미리 돌려 본 이번 턴 (받을 피해 합계와 깎일 HP가 실제 재생과 같아요. 무작위 대상과 치명은 몰라서 빼요) */
function allyVM(b: Battle, s: BSpirit, incoming: Forecast): AllyVM {
  return {
    face: s.id, name: s.def.name, element: ELEMENT_ICON[s.def.element] ?? ELEMENT_ICON.none, art: "", stage: s.run.stage,
    hp: s.hp, maxHp: s.maxHp, block: s.block || undefined,
    incoming: incoming.hit.get(s.id) || undefined,
    loss: incoming.lost.get(s.id) ?? 0,
    statuses: statusesOf(s),
    front: b.frontId === s.id,
    equip: s.run.equipment.length ? s.run.equipment.map((e) => equipVM(e, s.run.stage)) : undefined,
  };
}

/** 이 규칙이 지금 노리는 아군 (의도에 그리는 대상) */
function aims(b: Battle, rule: EnemyTargetRule, slot?: EnemySlot): string[] {
  const alive = b.aliveSpirits();
  if (rule === "all") return alive.map((s) => s.id);
  if (rule === "front") return [b.frontId];
  if (rule === "lowest") {
    const low = alive.reduce<BSpirit | undefined>((m, s) => (!m || s.hp < m.hp ? s : m), undefined);
    return low ? [low.id] : [];
  }
  // 무작위: 턴 시작에 뽑아 둔 대상이 한 아군이면 그 아군 (0128). 여럿에게 갈리면 얼굴 하나로 못 그려요
  if (alive.length === 1) return [alive[0].id];
  const picked = slot ? b.aimOf(slot) : [];
  return picked.length === 1 ? picked : [];
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
    art: e.def.id, hp: e.hp, maxHp: e.maxHp, block: e.block || undefined,
    element: ELEMENT_ICON[e.def.element] ?? ELEMENT_ICON.none, weakTo: weakTo(e.def.element),
    statuses: statusesOf(e),
    traits: traitsOf(e),
    buried: statusN(e, "burrow") > 0 || undefined,
    intent: intentOf(b, e, order),
    tip: { name: e.def.name, rank: COPY.rank[e.def.tier], lines: tipLines(b, e) },
  };
}

/** 유닛 풀이 (정본 H1): 행동 이름 · 효과문, 차징 중이면 이름 줄에 `브레이크 가능` (0067) */
function tipLines(b: Battle, e: BEnemy): RichText[] {
  const it = b.intent(e);
  const action = it.kind === "skip" ? richText(it.text) : [{ text: `${it.name} · ` }, ...richText(it.text)];
  return e.charging ? [action, BREAKABLE] : [action];
}
const BREAKABLE: RichText = richText(COPY.order.breakable);

/** 특성 칩 (0072 7번): 되돌리기는 이번 턴 첫 타격을 받으면 꺼져요 (0096) */
function traitsOf(e: BEnemy): EnemyVM["traits"] {
  const out: NonNullable<EnemyVM["traits"]> = [];
  if (e.def.reflectFirst) out.push({ icon: REFLECT_ICON, off: e.reflected || undefined, tip: { title: COPY.trait.reflect, sub: COPY.trait.reflectSub(Math.round(e.def.reflectFirst * PERCENT)) } });
  if (e.def.haste) out.push({ icon: HASTE_ICON, tip: { title: COPY.trait.haste, sub: COPY.trait.hasteSub } });
  return out.length ? out : undefined;
}

function intentOf(b: Battle, e: BEnemy, order: OrderEntry[]): IntentVM | undefined {
  const it = b.intent(e);
  if (it.kind === "skip") return undefined;
  const n = order.findIndex((o) => o.uid === e.uid);
  const move = b.moveQueue(e)[0]?.move ?? b.currentMove(e);
  const main = move.actions.find((a) => a.type === "attack") ?? move.actions[0];
  const at = n < 0 ? undefined : n + 1;
  const target = main ? targetOf(b, main, b.slots.find((x) => x.uid === e.uid && !x.done)) : "none";
  const amount = main ? amountOf(b, e, main) : "";
  if (it.kind === "charge" || it.kind === "chargeReady") return { kind: "charge", order: at, icon: CHARGE_ICON, amount, target };
  const icon = (main && ACTION_ICON[main.type]) ?? CHARGE_ICON;
  if (it.kind === "debuff") return { kind: "debuff", order: at, icon, amount, target };
  return { kind: it.kind, order: at, icon, amount, target };
}

function targetOf(b: Battle, a: EnemyAction, slot?: EnemySlot): IntentTarget {
  if (!("target" in a)) return "none";
  if (a.target === "all") return "all";
  return aims(b, a.target, slot)[0] ?? (a.target === "random" ? "random" : "none");
}

function amountOf(b: Battle, e: BEnemy, a: EnemyAction): string {
  switch (a.type) {
    case "attack":
    case "attackRamp": {
      const d = b.enemyDmgPreview(e, a.type === "attackRamp" ? a.dmg + e.ramp * a.step : a.dmg);
      return a.hits && a.hits > 1 ? `${d}×${a.hits}` : `${d}`;
    }
    case "weak":
    case "vulnerable": return `${a.turns}`;
    default: return "value" in a ? `${a.value}` : "";
  }
}

// ── 손패 ──

/** 이 정령의 카드 숫자를 계산할 값: 능력치와 배율. 실제 타격과 같은 값을 써요 */
function castStats(b: Battle, s: BSpirit): CardStats {
  const st = Object.fromEntries(STAT_IDS.map((k) => [k, b.stat(s, k)])) as Record<StatId, number>;
  return { ...st, mult: { damage: b.passiveMult(s, "damageMult"), burn: b.passiveMult(s, "burnMult"), chill: b.passiveMult(s, "chillMult"), heal: b.passiveMult(s, "healMult") } };
}

/** planned: 이미 놓은 카드면 그 자리. 숫자는 카드가 재생될 때의 값이에요 (놓아 둔 해방이 먼저 켜지면 해방 배율까지) */
function handCard(b: Battle, c: BCard, planned?: Planned) {
  const vm = cardVM(c.cardId, c.owner, castStats(b, b.casting(b.spirit(c.owner), planned)));
  const cost = b.cardCost(c);
  const chk = b.canPlay(c);
  return {
    ...vm, key: cardKey(c), cost, face: faceKey(c.owner),
    costShort: cost > b.mana || undefined,
    off: !chk.ok || undefined,
    detail: { ...vm.detail, why: chk.why },
  };
}

/**
 * 조준 결과 (0007 · 0013): 이 카드를 더 놓고 이번 턴을 미리 돌려 본 값. 고르는 카드는 고를 수 있는 대상마다, 그 밖에는 한 가지예요.
 * rest = 지금 놓은 카드까지의 결과 (받을 피해 a→b의 a)
 */
function outcomesOf(b: Battle, c: BCard, rule: PlayVM["target"], rest: Forecast): PlayVM["outcomes"] {
  const one = (target?: Ref) => outcomeVM(b, rest, b.forecast({ uid: c.uid, target }));
  if (rule.kind !== "pick") return { all: one() };
  const out: NonNullable<PlayVM["outcomes"]> = {};
  if (rule.side === "enemy") b.aliveEnemies().forEach((e, i) => { if (!rule.not?.includes(i)) out[i] = one({ side: "e", uid: e.uid }); });
  else b.spirits.forEach((s, i) => { if (!s.downed) out[i] = one({ side: "s", id: s.id }); });
  return out;
}

function outcomeVM(b: Battle, rest: Forecast, f: Forecast): OutcomeVM {
  const enemies: OutcomeVM["enemies"] = {};
  b.aliveEnemies().forEach((e, i) => {
    const o = f.card?.get(e.uid);
    if (o) enemies[i] = { hits: o.hits, hp: o.hp, block: o.block.from === o.block.to ? undefined : o.block, cut: o.cut || undefined };
  });
  const incoming = b.spirits.map((s) => {
    const from = rest.hit.get(s.id) ?? 0, to = f.hit.get(s.id) ?? 0;
    const loss = f.lost.get(s.id) ?? 0;
    return from === to && loss === (rest.lost.get(s.id) ?? 0) ? undefined : { from, to, loss };
  });
  return { enemies, incoming };
}

/** 무작위 적을 때리는 카드: 적이 여럿이면 누가 맞을지 몰라요 */
const hitsAtRandom = (b: Battle, c: BCard) => b.aliveEnemies().length > 1 && cardDef(c.cardId).effects.some((op) => op.op === "randomHits");

function targetRule(b: Battle, c: BCard): PlayVM["target"] {
  if (hitsAtRandom(b, c)) return { kind: "random", side: "enemy" };
  const need = b.needsTarget(c);
  if (need === "enemy") {
    // 이 카드가 끝날 때 아직 땅속인 적은 고를 수 없어요 (0096)
    const end = b.previewEnd(c);
    const not = b.enemies.filter((e) => !e.dead).flatMap((e, i) => (b.buriedAt(e, end) ? [i] : []));
    return { kind: "pick", side: "enemy", not: not.length ? not : undefined };
  }
  if (need === "ally") return { kind: "pick", side: "ally" };
  switch (cardDef(c.cardId).target) {
    case "allEnemies": return { kind: "all", side: "enemy" };
    // 적이 하나면 고르지 않고 그 적에게
    case "enemy": return { kind: "all", side: "enemy" };
    default: return { kind: "all", side: "ally" };
  }
}
