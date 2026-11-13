// 아군·적: 필드 그림, 발밑 그림자, 정보판, 적 머리 위 의도. 정보판은 전투 정보판 C안 (Lucy 2026-11-13 "C + 약점 표지 상시"):
// 접힌 판은 두 줄(HP 막대·방어도·대표 상태 / HP 숫자·받을 피해 또는 약점 표지), 가리키면 펼쳐서 속성·상태 전부·앞열·장비를 보여요.
// 대상 고르기 미리보기(.fld-pv, 결정 0013)도 여기서 그려요: 대상의 결과와 빛, 아군 받을 피해 a→b. 발밑 고리(타원)는 없어요.
import type * as Phaser from "phaser";
import { tokens } from "../../../design/tokens";
import { transparentOf } from "../../style/color";
import { box } from "../../style/draw";
import { cubicBezier, ms } from "../../style/ease";
import { render, size, type Node } from "../../style/flex";
import { gather } from "../../style/gather";
import { linear } from "../../style/gradient";
import { icon, loadIcon } from "../../style/icons";
import { placeholderArt } from "../../style/placeholder";
import { shadowTexture } from "../../style/shadow";
import { faceKey, preloadFaces } from "../../faces";
import { miniSlotNode, preloadEquipArt, type Rect } from "../../run/equip";
import { EQUIP_MINI } from "../../run/layout";
import { COPY } from "../copy";
import { ALLY, ENEMY, GROUND, INFO as I, INTENT, PREVIEW as PV } from "../layout";
import type { AllyVM, BattleVM, Change, EnemyOutcomeVM, EnemyVM, IntentVM, StatusVM } from "../viewmodel";

const P = tokens.provisional.palette;
const T = tokens.provisional.text.battle;
const LETHAL = tokens.provisional.motion.lethal;

/** 접힌 판에 하나만 보이는 대표 상태를 고르는 순서 (C안 가정: 피해 주는 상태 → 행동 막는 상태 → 나머지, 같으면 수 큰 것) */
const STATUS_ORDER = ["kw-burn", "kw-thorns", "kw-chill", "kw-vuln", "kw-weak"];

/** 속성 기호 틴트. 팔레트에 없는 속성(땅·얼음 등)은 보조 글자색 */
const ELEMENT_TINT: Record<string, string> = {
  "el-fire": P.el.fire, "el-water": P.el.water, "el-forest": P.el.wood, "el-wind": P.el.wind, "el-light": P.el.light, "el-none": P.el.none,
};

export function preloadUnits(scene: Phaser.Scene, vm: BattleVM) {
  preloadFaces(scene);
  const statuses = (list: StatusVM[]) => list.forEach((s) => loadIcon(scene, s.icon, I.status.icon));
  for (const a of vm.allies) {
    statuses(a.statuses);
    if (a.element) loadIcon(scene, a.element, I.element.icon);
  }
  preloadEquipArt(scene, vm.allies.flatMap((a) => (a.equip ?? []).map((e) => e.item.id)));
  loadIcon(scene, "fx-block", I.block.icon);
  loadIcon(scene, "fx-damage", I.incoming.icon);
  loadIcon(scene, "g-flag", I.flag.icon);
  for (const e of vm.enemies) {
    loadIcon(scene, e.element, I.element.icon);
    if (e.weakTo) loadIcon(scene, e.weakTo, I.weak.icon);
    loadIcon(scene, e.intent.icon, INTENT.icon);
    statuses(e.statuses);
  }
  if (Object.keys(vm.plays).length > 0) {
    loadIcon(scene, "i-crack", I.block.icon);
    loadIcon(scene, "fx-damage", PV.hits.icon);
  }
}

/** CSS repeating-linear-gradient 무늬를 w×h 텍스처로 */
function stripeTexture(scene: Phaser.Scene, name: string, w: number, h: number, deg: number, stops: [string, number][]): string {
  const key = `stripe:${name}@${Math.ceil(w)}x${h}`;
  if (!scene.textures.exists(key)) {
    const tex = scene.textures.createCanvas(key, Math.max(1, Math.ceil(w)), h)!;
    linear(tex.getContext(), Math.max(1, Math.ceil(w)), h, deg, stops.map(([c, px]) => [c, { px }]), true);
    tex.refresh();
  }
  return key;
}

/** 약점 표지 (.weak): 45° 돌린 둥근 마름모 테. 얇은 테라 canvas에 구워요 */
function weakRingTexture(scene: Phaser.Scene): { key: string; d: number } {
  const W = I.weak;
  const side = W.size - W.inset * 2;
  const d = Math.ceil(side * Math.SQRT2 + W.ring * 2);
  const key = `battle:weak-ring@${d}`;
  if (!scene.textures.exists(key)) {
    const tex = scene.textures.createCanvas(key, d, d)!;
    const ctx = tex.getContext();
    ctx.translate(d / 2, d / 2);
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    ctx.roundRect(-side / 2, -side / 2, side, side, W.radius);
    ctx.fillStyle = P.glassD;
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(-side / 2 + W.ring / 2, -side / 2 + W.ring / 2, side - W.ring, side - W.ring, Math.max(0, W.radius - W.ring / 2));
    ctx.lineWidth = W.ring;
    ctx.strokeStyle = P.accHi;
    ctx.stroke();
    tex.refresh();
  }
  return { key, d };
}

/** 모든 아군 (.all): 겹친 점 셋, 점마다 바깥 테. 작은 원이라 canvas에 구워요 */
function allDotsTexture(scene: Phaser.Scene): { key: string; w: number; h: number; margin: number } {
  const A = INTENT.all;
  const step = A.dot - A.overlap;
  const w = step * 2 + A.dot + A.ring * 2, h = A.dot + A.ring * 2;
  const key = "battle:intent-all";
  if (!scene.textures.exists(key)) {
    const tex = scene.textures.createCanvas(key, Math.ceil(w), Math.ceil(h))!;
    const ctx = tex.getContext();
    for (let k = 0; k < 3; k++) {
      const cx = A.ring + A.dot / 2 + k * step, cy = h / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, A.dot / 2 + A.ring, 0, Math.PI * 2);
      ctx.fillStyle = P.glassD;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, A.dot / 2, 0, Math.PI * 2);
      ctx.fillStyle = P.ink2;
      ctx.fill();
    }
    tex.refresh();
  }
  return { key, w, h, margin: A.ring };
}

// ── 조각 ──────────────────────────────────────────────

const text = (t: string, sz: string, color: string, extra: Partial<Node> = {}): Node =>
  ({ t: "text", text: t, size: sz, color, ...extra }) as Node;

/** a → b (앞 숫자는 취소선) */
const change = (c: Change, fromSize: string, toSize: string, toColor: string, arrowColor: string = P.accHi): Node[] => [
  text(String(c.from), fromSize, P.ink3, { strike: {} }),
  text(COPY.to, T.pvArrow, arrowColor, { ml: I.arrowMargin, mr: I.arrowMargin }),
  text(String(c.to), toSize, toColor),
];

/** HP 막대에 덧그리는 빗금: 받을 피해(ghost, 위험색) 또는 조준 결과(pv, 강조색). from → to 사이를 칠해요 */
interface BarCut {
  from: number;
  to: number;
  kind: "ghost" | "pv";
}

/** HP 막대 (.bar): 지금 HP를 채우고, cut이 있으면 그 구간을 빗금으로 */
function hpBar(scene: Phaser.Scene, hp: number, max: number, cut?: BarCut): Node {
  return {
    t: "block", w: I.bar.minW, h: I.bar.h, grow: true,
    draw: (g, x, y, w, h) => {
      box(g, x, y, w, h, I.bar.radius, { fill: P.barTrack });
      if (hp > 0) box(g, x, y, (w * Math.min(hp, max)) / max, h, I.bar.radius, { fill: P.hp });
      if (cut && cut.from > cut.to) {
        const gx = (w * cut.to) / max, gw = (w * (cut.from - cut.to)) / max;
        const s = I.bar.stripe;
        const [a, b] = cut.kind === "ghost" ? [P.danger, P.ghostStripe] : [P.accHi, P.pvFill];
        const key = stripeTexture(scene, cut.kind, gw, h, I.bar.stripeDeg, [[a, 0], [a, s], [b, s], [b, s * 2]]);
        scene.add.image(x + gx, y, key).setOrigin(0, 0).setDisplaySize(gw, h);
      }
    },
  };
}

/** 방어도 칩 (.blk). pv면 금 간 방패 + a→b */
function blockChip(n: number, pv?: Change): Node {
  return {
    t: "row", h: I.block.h, pad: I.block.pad, radius: I.block.radius, gap: I.block.gap, align: "center",
    style: { fill: P.chip },
    children: pv
      ? [{ t: "icon", id: "i-crack", w: I.block.icon, h: I.block.icon, tint: P.accHi }, ...change(pv, T.pvFrom, T.block, P.ink, P.ink3)]
      : [{ t: "icon", id: "fx-block", w: I.block.icon, h: I.block.icon, tint: P.ink2 }, text(String(n), T.block, P.ink)],
  };
}

/** 대표 상태 하나 + 남은 수 (.st1) */
function topStatus(list: StatusVM[]): Node[] {
  if (!list.length) return [];
  const rank = (s: StatusVM) => (STATUS_ORDER.includes(s.icon) ? STATUS_ORDER.indexOf(s.icon) : STATUS_ORDER.length);
  const s = [...list].sort((a, b) => rank(a) - rank(b) || b.n - a.n)[0];
  return [{
    t: "row", gap: I.status.gap, align: "center",
    children: [
      { t: "icon", id: s.icon, w: I.status.icon, h: I.status.icon, tint: P.ink2 },
      text(String(s.n), T.chip, P.ink2),
      ...(list.length > 1 ? [text(`+${list.length - 1}`, T.statusMore, P.ink3, { ml: I.status.moreMl })] : []),
    ],
  }];
}

/** 펼친 판 상태 칩 (.chipS) */
function statusChip(s: StatusVM): Node {
  return {
    t: "row", h: I.chip.h, pad: I.chip.pad, radius: I.chip.radius, gap: I.chip.gap, align: "center",
    style: { fill: P.chipSoft },
    children: [{ t: "icon", id: s.icon, w: I.chip.icon, h: I.chip.icon, tint: P.ink2 }, text(String(s.n), T.plateChip, P.ink)],
  };
}

function hpNumber(hp: number, max: number): Node {
  return {
    t: "row", align: "baseline",
    children: [text(String(hp), T.hp, P.ink, { lh: 1 }), text(`${COPY.maxPrefix}${max}`, T.hpMax, P.ink3, { lh: 1 })],
  };
}

/** 약점 표지 (.weak): 마름모 테 + 속성 기호. 상태 칩(둥근 알약)과 모양을 달리해요 */
function weakMark(scene: Phaser.Scene, el: string): Node {
  const W = I.weak;
  return {
    t: "block", w: W.size, h: W.size,
    draw: (_g, x, y, w, h) => {
      const ring = weakRingTexture(scene);
      scene.add.image(x + w / 2, y + h / 2, ring.key);
      icon(scene, x + (w - W.icon) / 2, y + (h - W.icon) / 2, el, W.icon, W.icon, P.ink);
    },
  };
}

/** 아군 받을 피해 (.inc): 충격 기호 + 숫자. 치명이면 기호가 맥박쳐요 */
function incomingNode(scene: Phaser.Scene, n: number, pv: Change | undefined, lethal: boolean): Node {
  const s = I.incoming.icon;
  const impact: Node = {
    t: "block", w: s, h: s,
    draw: (_g, x, y) => {
      const img = icon(scene, x + s / 2, y + s / 2, "fx-damage", s, s, P.danger).setOrigin(0.5);
      if (!lethal) return;
      const d = ms(LETHAL.duration), ease = cubicBezier(LETHAL.easing);
      scene.tweens.chain({
        targets: img, loop: -1,
        tweens: [
          { scale: LETHAL.scale, duration: d * LETHAL.peak, ease },
          { scale: 1, duration: d * (1 - LETHAL.peak), ease },
        ],
      });
    },
  };
  return {
    t: "row", gap: I.incoming.gap, align: "center",
    children: [impact, ...(pv ? [{ t: "row", align: "baseline", children: change(pv, T.pvIncomingFrom, T.incoming, P.accHi) } as Node] : [text(String(n), T.incoming, P.danger)])],
  };
}

/** 속성 원 (.elc) */
const elementChip = (el: string): Node => ({
  t: "row", w: I.element.d, h: I.element.d, round: true, justify: "center", align: "center",
  style: { fill: P.chipSoft },
  children: [{ t: "icon", id: el, w: I.element.icon, h: I.element.icon, tint: ELEMENT_TINT[el] ?? P.ink2 }],
});

/** 줄 바꿈이 있는 기호 줄 (.mrow flex-wrap): 폭을 넘으면 다음 줄로 */
function wrapRows(items: Node[], width: number, tail: Node[] = []): Node[] {
  const rows: Node[][] = [[]];
  let used = 0;
  for (const n of [...items, ...tail]) {
    const w = size(n).w;
    const line = rows[rows.length - 1];
    if (line.length && used + I.more.rowGap + w > width) {
      rows.push([n]);
      used = w;
    } else {
      used += (line.length ? I.more.rowGap : 0) + w;
      line.push(n);
    }
  }
  return rows.filter((r) => r.length).map((children) => ({ t: "row", gap: I.more.rowGap, minH: I.more.rowMinH, align: "center", children }));
}

/** 펼친 부분 (.more): 위 선 1, 위 여백 4, 줄 사이 5 */
function moreSection(rows: Node[]): Node {
  return {
    t: "col", mt: I.more.mt, align: "stretch",
    children: [
      { t: "block", w: 0, h: I.more.line, draw: (g, x, y, w, h) => box(g, x, y, w, h, 0, { fill: P.glassLine }) },
      { t: "col", pad: [I.more.padTop, 0, 0, 0], gap: I.more.gap, align: "stretch", children: rows },
    ],
  };
}

/** 이름 줄 (.mrow: 속성 · 약점 · 이름 … 오른쪽 끝 깃발·등급) */
function nameRow(lead: Node[], name: string | undefined, tail: Node[]): Node {
  const right = tail.map((n, k) => (k === 0 ? { ...n, ml: "auto" as const } : n));
  return {
    t: "row", gap: I.more.rowGap, minH: I.more.rowMinH, align: "center",
    children: [...lead, ...(name ? [text(name, T.plateName, P.ink)] : []), ...right],
  };
}

interface PlateState {
  lit?: boolean;
  lethal?: boolean;
  open?: boolean;
}

function plate(width: number, rows: Node[], st: PlateState): Node {
  const ring = st.lit ? { width: I.litRing, color: P.accHi }
    : st.lethal ? { width: I.lethalRing, color: P.danger }
    : { width: 1, color: P.plateLine };
  return {
    t: "col", w: width, gap: I.gap, pad: I.pad, radius: I.radius, align: "stretch",
    style: { fill: st.open ? P.glassD : P.plate, ring },
    children: rows,
  };
}

function allyPlate(scene: Phaser.Scene, a: AllyVM, pv: Change | undefined, st: PlateState, onEquip?: (k: number, r: Rect) => void): Node {
  const incoming = pv ? pv.to : (a.incoming ?? 0);
  const loss = Math.max(0, incoming - (a.block ?? 0));
  const after = Math.max(0, a.hp - loss);
  const lethal = loss > 0 && after === 0;
  const row1: Node = {
    t: "row", h: I.row1.h, gap: I.row1.gap, align: "center",
    children: [
      ...(a.block ? [blockChip(a.block)] : []),
      hpBar(scene, a.hp, a.maxHp, loss > 0 ? { from: a.hp, to: after, kind: "ghost" } : undefined),
      ...topStatus(a.statuses),
    ],
  };
  const showInc = a.incoming !== undefined && (a.incoming > 0 || !!pv);
  const row2: Node = {
    t: "row", h: I.row2.h, gap: I.row2.gap, align: "center", justify: "between",
    children: [hpNumber(a.hp, a.maxHp), ...(showInc ? [incomingNode(scene, a.incoming ?? 0, pv, lethal)] : [])],
  };
  const rows: Node[] = [row1, row2];
  if (st.open) {
    const inner = I.allyOpenW - I.pad[1] - I.pad[3];
    const equip: Node[] = a.equip?.length ? [{
      t: "row", gap: I.equipGap, align: "center", ml: "auto",
      children: a.equip.map((e, k): Node => {
        const slot = miniSlotNode(scene, e.item, EQUIP_MINI.s24);
        if (slot.t !== "block" || !onEquip) return slot;
        const draw = slot.draw;
        return { ...slot, draw: (g, x, y, w, h) => { draw?.(g, x, y, w, h); onEquip(k, { x, y, w, h }); } };
      }),
    }] : [];
    const flag: Node[] = a.front ? [{ t: "icon", id: "g-flag", w: I.flag.icon, h: I.flag.icon, tint: P.ink2 }] : [];
    // 받을 피해 출처(행동 순서별)는 뷰모델에 아직 없어서 그리지 않아요
    rows.push(moreSection([
      nameRow(a.element ? [elementChip(a.element)] : [], a.name, flag),
      ...wrapRows(a.statuses.map(statusChip), inner, equip),
    ]));
  }
  return plate(st.open ? I.allyOpenW : I.allyW, rows, { ...st, lethal });
}

function enemyPlate(scene: Phaser.Scene, e: EnemyVM, pv: EnemyOutcomeVM | undefined, st: PlateState): Node {
  const block = pv?.block ? [blockChip(pv.block.to, pv.block)] : e.block ? [blockChip(e.block)] : [];
  const row1: Node = {
    t: "row", h: I.row1.h, gap: I.row1.gap, align: "center",
    children: [...block, hpBar(scene, e.hp, e.maxHp, pv ? { from: pv.hp.from, to: pv.hp.to, kind: "pv" } : undefined), ...topStatus(e.statuses)],
  };
  const hp: Node = pv
    ? { t: "row", align: "baseline", children: change(pv.hp, T.pvFrom, T.pvHp, P.accHi, P.ink3) }
    : hpNumber(e.hp, e.maxHp);
  const row2: Node = {
    t: "row", h: I.row2.h, gap: I.row2.gap, align: "center", justify: "between",
    // 약점 표지는 약점이 있으면 늘 (Lucy 2026-11-13). 없는 적은 표지 없음
    children: [hp, ...(e.weakTo ? [weakMark(scene, e.weakTo)] : [])],
  };
  const rows: Node[] = [row1, row2];
  if (st.open) {
    const inner = I.enemyOpenW - I.pad[1] - I.pad[3];
    const rank: Node[] = e.tip?.rank ? [{
      t: "row", pad: I.tag.pad, radius: I.tag.radius, align: "center",
      style: { ring: { width: I.tag.ring, color: P.veil["20"] } },
      children: [text(e.tip.rank, T.plateTag, P.ink2)],
    }] : [];
    rows.push(moreSection([
      nameRow([elementChip(e.element), ...(e.weakTo ? [weakMark(scene, e.weakTo)] : [])], e.tip?.name, rank),
      ...wrapRows(e.statuses.map(statusChip), inner),
    ]));
  }
  return plate(st.open ? I.enemyOpenW : I.enemyW, rows, st);
}

function intentNode(scene: Phaser.Scene, it: IntentVM, cut = false): Node {
  const charge = it.kind === "charge", debuff = it.kind === "debuff";
  const ring = cut
    ? { width: PV.intentCut.ring, color: P.accHi }
    : debuff
      ? { width: INTENT.debuffRing, color: P.debuffLine }
      : { width: charge ? INTENT.chargeRing : INTENT.ring, color: charge ? P.warn : P.glassLine };
  const order: Node = {
    t: "row", w: INTENT.order, h: INTENT.order, round: !debuff, radius: INTENT.orderDebuffRadius,
    justify: "center", align: "center", style: { fill: P.chip },
    children: [text(String(it.order), T.intentOrder, P.ink2)],
  };
  let target: Node;
  if (it.target === "all") {
    const dots = allDotsTexture(scene);
    const w = dots.w - dots.margin * 2, h = dots.h - dots.margin * 2;
    target = { t: "block", w, h, draw: (_g, x, y) => { scene.add.image(x - dots.margin, y - dots.margin, dots.key).setOrigin(0, 0); } };
  } else {
    target = { t: "image", key: faceKey(it.target), w: INTENT.face, h: INTENT.face, round: true, outline: { width: INTENT.faceRing, color: P.glassD } };
  }
  const iconTint = charge ? P.warn : debuff ? P.ink2 : P.ink;
  // 끊김: 수치만 흐린 글자 + 취소선 (.intent.cut .amt)
  const strike = cut ? { strike: { color: P.accHi, width: PV.intentCut.strike } } : {};
  // 연타 ×N은 작고 흐리게 (.intent .x)
  const [amount, ...mult] = it.amount.split("×");
  const amountNode = debuff
    ? text(amount, T.intentAmountDebuff, cut ? P.ink2 : P.ink, strike)
    : text(amount, T.intentAmount, cut ? P.ink2 : charge ? P.warn : P.ink, strike);
  return {
    t: "row", h: INTENT.h, pad: INTENT.pad, radius: debuff ? INTENT.debuffRadius : INTENT.radius, gap: INTENT.gap, align: "center",
    style: { fill: P.glassD, ring },
    children: [
      order, { t: "icon", id: it.icon, w: INTENT.icon, h: INTENT.icon, tint: iconTint }, amountNode,
      ...(mult.length ? [text(`×${mult.join("×")}`, T.intentMult, P.ink3)] : []),
      target,
    ],
  };
}

/** 대상 머리 위 타격 알약 (.hits): 왼쪽 위에서 아래로, 한 알마다 오른쪽으로 비켜요 */
function drawHits(scene: Phaser.Scene, hits: number[], bodyX: number, bodyY: number) {
  const H = PV.hits;
  let y = bodyY + H.top;
  hits.forEach((n, d) => {
    const pill: Node = {
      t: "row", h: H.h, pad: H.pad, radius: H.radius, gap: H.inGap, align: "center", style: { fill: P.danger },
      children: [{ t: "icon", id: "fx-damage", w: H.icon, h: H.icon, tint: P.onDanger }, text(String(n), T.hit, P.onDanger)],
    };
    render(scene, pill, bodyX + H.left + d * H.step, y);
    y += H.h + H.gap;
  });
}

// ── 그리기 ──────────────────────────────────────────────

const GROUND_KEY = "battle:ground";

/** 발밑 그림자: 발 y에 가운데 */
function ground(scene: Phaser.Scene, cx: number, feet: number) {
  if (!scene.textures.exists(GROUND_KEY)) {
    const tex = scene.textures.createCanvas(GROUND_KEY, GROUND.w, GROUND.h)!;
    const ctx = tex.getContext();
    // closest-side 타원 그라데이션: 원을 세로로 눌러서 그려요
    const rx = GROUND.w / 2, ry = GROUND.h / 2;
    ctx.translate(rx, ry);
    ctx.scale(1, ry / rx);
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    grad.addColorStop(0, P.groundShade);
    grad.addColorStop(1, transparentOf(P.groundShade));
    ctx.fillStyle = grad;
    ctx.fillRect(-rx, -rx, GROUND.w, GROUND.w);
    tex.refresh();
  }
  scene.add.image(cx - GROUND.w / 2, feet - GROUND.h / 2, GROUND_KEY).setOrigin(0, 0);
}

/** 대상 강조: 정본 .ring.aim의 바깥 빛(box-shadow 0 0 14 aimGlow)을 그림 상자와 정보판 뒤에 깔아요.
 *  그림이 실루엣·모델로 바뀌면 그림 모양을 따라 빛나게 바꿔요 (지금은 자리 채움 상자). */
function glow(scene: Phaser.Scene, x: number, y: number, w: number, h: number, radius: number, hollow = false) {
  const s = shadowTexture(scene, w, h, radius, { y: 0, blur: PV.lit.glow, color: P.aimGlow }, hollow);
  scene.add.image(x - s.margin, y - s.margin, s.key).setOrigin(0, 0);
}

/** 그림 상자부터 정보판까지 (끌어 대기·클릭·가리킴 판정 영역) */
export interface UnitBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface UnitPreview<R> {
  /** 결과 미리보기 */
  outcome?: R;
  /** 대상이면 그림·정보판에 빛 */
  lit?: boolean;
}

export interface UnitView {
  bounds: UnitBounds;
  /** 접힌 정보판 (펼친 판을 덮을 때 숨겨요) */
  plate: Phaser.GameObjects.Container;
}

const allyPlateAt = (i: number, w: number) => ({ x: ALLY.xs[i] - w / 2, y: ALLY.feet + I.mt });
const enemyPlateAt = (i: number, w: number) => ({ x: ENEMY.xs[i] - w / 2, y: ENEMY.feet + I.mt });

/** pv.outcome: 이 아군의 받을 피해 a→b */
export function drawAlly(scene: Phaser.Scene, a: AllyVM, i: number, pv: UnitPreview<Change> = {}): UnitView {
  const cx = ALLY.xs[i];
  const bodyX = cx - ALLY.body.w / 2, bodyTop = ALLY.feet - ALLY.body.h;
  const lit = !!pv.lit;
  const info = allyPlate(scene, a, pv.outcome, { lit });
  const at = allyPlateAt(i, I.allyW);
  const plateH = size(info).h;
  if (lit) {
    glow(scene, bodyX, bodyTop, ALLY.body.w, ALLY.body.h, 0, true);
    glow(scene, at.x, at.y, I.allyW, plateH, I.radius);
  }
  placeholderArt(scene, bodyX, bodyTop, ALLY.body.w, ALLY.body.h, P.ink3);
  ground(scene, cx, ALLY.feet);
  const plateC = gather(scene, 0, 0, () => render(scene, info, at.x, at.y));
  return { bounds: { x: at.x, y: bodyTop, w: I.allyW, h: at.y + plateH - bodyTop }, plate: plateC };
}

export function drawEnemy(scene: Phaser.Scene, e: EnemyVM, i: number, pv: UnitPreview<EnemyOutcomeVM> = {}): UnitView {
  const cx = ENEMY.xs[i];
  const intentN = intentNode(scene, e.intent, !!pv.outcome?.cut);
  const intent = size(intentN);
  render(scene, intentN, cx - intent.w / 2, ENEMY.top);
  const bodyTop = ENEMY.top + intent.h + ENEMY.body.mt;
  const artX = cx - ENEMY.art.w / 2, artY = ENEMY.feet - ENEMY.art.h;
  const lit = !!pv.lit;
  const info = enemyPlate(scene, e, pv.outcome, { lit });
  const at = enemyPlateAt(i, I.enemyW);
  const plateH = size(info).h;
  if (lit) {
    glow(scene, artX, artY, ENEMY.art.w, ENEMY.art.h, 0, true);
    glow(scene, at.x, at.y, I.enemyW, plateH, I.radius);
  }
  placeholderArt(scene, artX, artY, ENEMY.art.w, ENEMY.art.h, P.ink3);
  ground(scene, cx, ENEMY.feet);
  if (pv.outcome) drawHits(scene, pv.outcome.hits, cx - ENEMY.body.w / 2, bodyTop);
  const plateC = gather(scene, 0, 0, () => render(scene, info, at.x, at.y));
  return { bounds: { x: at.x, y: ENEMY.top, w: I.enemyW, h: at.y + plateH - ENEMY.top }, plate: plateC };
}

/** 가리킨 아군의 펼친 정보판. onEquip: 장비 칸이 놓인 자리 (칸 번호, 자리). 판 자리를 돌려줘요 */
export function drawOpenAlly(scene: Phaser.Scene, a: AllyVM, i: number, onEquip?: (k: number, r: Rect) => void): Rect {
  const info = allyPlate(scene, a, undefined, { open: true }, onEquip);
  const at = allyPlateAt(i, I.allyOpenW);
  render(scene, info, at.x, at.y);
  return { ...at, w: I.allyOpenW, h: size(info).h };
}

/** 가리킨 적의 펼친 정보판. 판 자리를 돌려줘요 */
export function drawOpenEnemy(scene: Phaser.Scene, e: EnemyVM, i: number): Rect {
  const info = enemyPlate(scene, e, undefined, { open: true });
  const at = enemyPlateAt(i, I.enemyOpenW);
  render(scene, info, at.x, at.y);
  return { ...at, w: I.enemyOpenW, h: size(info).h };
}
