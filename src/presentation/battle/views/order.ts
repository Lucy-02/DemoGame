// 해결 순서표: 위쪽 가운데 한 줄. 판은 정본 .rs, 토큰은 0074 "토큰 그리기 규칙"
import type * as Phaser from "phaser";
import { tokens } from "../../../design/tokens";
import { box, circle } from "../../style/draw";
import { place } from "../../style/flex";
import { gather } from "../../style/gather";
import { icon, loadIcon } from "../../style/icons";
import { opacityOf, type Opacity } from "../../style/opacity";
import { placeholderArt } from "../../style/placeholder";
import { ringTexture } from "../../style/ring";
import { faceKey } from "../../faces";
import { LINE_HEIGHT, fontBox, measure, px, textStyle } from "../../style/text";
import { COPY } from "../copy";
import { drawEnemyFace, preloadEnemyArt } from "../enemyArt";
import { ORDER as O } from "../layout";
import type { AllyTokenVM, BandVM, BattleVM, OrderSlotVM } from "../viewmodel";

const P = tokens.provisional.palette;
const T = tokens.provisional.text.battle;

const NUM = T.orderNum;
const MORE = T.orderMore;
/** 머리 글자: 장소(위) · 턴 + 단계(아래) */
const HEAD = { place: T.orderPlace, state: T.orderState };

/** 끊긴 적 · 끊을 예정인 적의 배지 기호 (0074 10번) */
const BREAK_ICON = "kw-break";

// ── 토큰 한 규칙 (0074): 얼굴 원 < 테 < 배지. 아군 · 적이 같은 함수로 그려요 ──

/** 테가 얼굴 원 밖으로 나가는 길이 */
const RING_OUT = O.ring.gap + O.ring.w;

/** 배지: 지름과, 얼굴 가운데에서 배지 가운데까지의 거리 (둘레 45° 자리) */
const badgeOf = (d: number) => {
  const size = Math.round(d * O.badge.ratio);
  const off = (d / 2) * Math.cos((O.badge.deg * Math.PI) / 180);
  return { size, off, icon: Math.round(size * O.badge.icon) };
};
const ENEMY_BADGE = badgeOf(O.face);
const ALLY_BADGE = badgeOf(O.allyFace);

interface RingStyle {
  color: string;
  dash?: boolean;
}

interface BadgeStyle {
  /** 기호 id. glyph가 있으면 기호 대신 그 글자 */
  icon: string;
  glyph?: string;
  tint: string;
  fill: string;
  /** 배지 자체의 테: 차징 = 보라 실선, 끊김 예정 = 보라 점선 */
  border?: RingStyle;
}

/** 테: 얼굴 지름 d를 감싸는 정원. 종류와 상관없이 굵기 · 간격이 같아요 */
function drawRing(scene: Phaser.Scene, cx: number, cy: number, d: number, r: RingStyle) {
  const size = Math.ceil(d + RING_OUT * 2) + 2;
  const key = ringTexture(scene, `order:ring:${d}:${r.color}:${r.dash ? "dash" : "solid"}`, {
    d: size, r: d / 2 + O.ring.gap + O.ring.w / 2, stroke: O.ring.w,
    track: { color: r.color, dash: r.dash ? O.ring.dash : undefined }, arcs: [],
  });
  return scene.add.image(cx, cy, key);
}

/** 배지: 판 색 바깥 테로 얼굴과 떨어져 보이는 작은 원 + 기호. corner = 얼굴 가운데에서 본 방향 (오른쪽 아래 = [1, 1]) */
function drawBadge(scene: Phaser.Scene, cx: number, cy: number, b: ReturnType<typeof badgeOf>, s: BadgeStyle, corner: [number, number] = [1, 1]) {
  const x = cx + corner[0] * b.off, y = cy + corner[1] * b.off;
  const g = scene.add.graphics();
  circle(g, x, y, b.size + O.badge.outline * 2, { fill: P.ringOuter });
  circle(g, x, y, b.size, { fill: s.fill, ring: s.border && !s.border.dash ? { width: O.badge.border, color: s.border.color } : undefined });
  if (s.border?.dash) {
    const key = ringTexture(scene, `order:badge:${b.size}:${s.border.color}`, {
      d: b.size, r: b.size / 2 - O.badge.border / 2, stroke: O.badge.border,
      track: { color: s.border.color, dash: O.badge.dash }, arcs: [],
    });
    scene.add.image(x, y, key);
  }
  if (s.glyph) scene.add.text(x, y, s.glyph, textStyle(`${Math.round(b.size * O.badge.glyph)}px`, s.tint)).setOrigin(0.5, 0.5);
  else icon(scene, x - b.icon / 2, y - b.icon / 2, s.icon, b.icon, b.icon, s.tint);
}

/** 적 칸의 배지: 끊김 > 차징 > 보통 (0074 10 · 11번) */
function enemyBadge(s: OrderSlotVM): BadgeStyle {
  if (s.cut === "done") return { icon: BREAK_ICON, tint: P.onAccHi, fill: P.accHi };
  if (s.cut === "plan") return { icon: BREAK_ICON, tint: P.accHi, fill: P.face, border: { color: P.accHi, dash: true } };
  if (s.charge) return { icon: s.action, tint: P.accHi, fill: P.face, border: { color: P.accHi } };
  return { icon: s.action, tint: P.ink2, fill: P.face };
}

/** 아군 토큰의 테 (0074 1번): 허점 = 노랑, 든 카드 자리 = 흰 점선, 해방 = 보라 */
function allyRing(t: AllyTokenVM): RingStyle | undefined {
  if (t.mark === "gap") return { color: P.warn };
  if (t.mark === "held") return { color: P.ink, dash: true };
  if (t.mark === "release") return { color: P.accHi };
  return undefined;
}

// ── 판 배치 ──

/** 적 칸 (.tok.en): 번호 · 얼굴 */
const slotW = O.enemy.padX * 2 + O.enemy.numW + O.enemy.gap + O.face;
/** 묶음에 보이는 토큰 수: 상한을 넘으면 N−1개 + "+n" 칩 (0074 4번) */
const shownOf = (n: number) => (n > O.bundle.max ? O.bundle.max - 1 : n);
const moreText = (n: number) => `+${n - shownOf(n)}`;
const moreW = (n: number) => (n > O.bundle.max ? O.bundle.gap + measure(moreText(n), MORE) + O.more.padX * 2 : 0);
const bundleWidth = (n: number) => O.bundle.pad * 2 + shownOf(n) * O.allyFace + (shownOf(n) - 1) * O.bundle.gap + moreW(n);

// ── 방전 띠 (0096): 묶음 안의 어두운 홈. 머리 = 위험색 충격 기호 + 피해 수 (조준 피해 알약과 같은 문법, 0072 1번) ──

const B = O.band;
const BAND_ICON = "fx-damage";
const bandHeadW = (b: BandVM) => (b.head ? B.icon + B.inGap + measure(String(b.dmg), NUM) : 0);

interface CellPlan {
  w: number;
  /** 토큰마다 얼굴 왼쪽 x (칸 왼쪽 끝 기준) */
  xs: number[];
  bands: { x: number; w: number; band: BandVM }[];
}

/** 띠가 있는 칸의 자리: 토큰은 접지 않고 모두 보여요. 빈 띠는 토큰 한 자리 폭이에요 (시간 길이가 아니에요, 0038) */
function planCell(n: number, bands: BandVM[]): CellPlan {
  const sorted = [...bands].sort((a, z) => a.at - z.at);
  const xs: number[] = [];
  const out: CellPlan["bands"] = [];
  let x = O.bundle.pad, first = true;
  const step = () => {
    if (!first) x += O.bundle.gap;
    first = false;
  };
  const open = (b: BandVM) => {
    step();
    const x0 = x;
    x += B.padX;
    if (b.head) x += bandHeadW(b) + (b.n ? B.gap : 0);
    return x0;
  };
  let i = 0;
  for (const b of sorted) {
    for (; i < b.at && i < n; i++) {
      step();
      xs.push(x);
      x += O.allyFace;
    }
    const x0 = open(b);
    if (!b.n && !b.head) x += O.allyFace;
    for (let j = 0; j < b.n && i < n; j++, i++) {
      if (j) x += O.bundle.gap;
      xs.push(x);
      x += O.allyFace;
    }
    x += B.padX;
    out.push({ x: x0, w: x - x0, band: b });
  }
  for (; i < n; i++) {
    step();
    xs.push(x);
    x += O.allyFace;
  }
  return { w: x + O.bundle.pad, xs, bands: out };
}

export function preloadOrder(scene: Phaser.Scene, vm: BattleVM["order"]) {
  for (const s of vm.slots) loadIcon(scene, s.action, ENEMY_BADGE.icon);
  preloadEnemyArt(scene, vm.slots.map((s) => s.art));
  loadIcon(scene, BREAK_ICON, ENEMY_BADGE.icon);
  for (const t of (vm.bundles ?? []).flat()) loadIcon(scene, t.icon, ALLY_BADGE.icon);
  loadIcon(scene, BAND_ICON, B.icon);
}

/** 든 카드 자리 토큰의 기호도 미리 불러 둬요 */
export function preloadOrderIcon(scene: Phaser.Scene, id: string) {
  loadIcon(scene, id, ALLY_BADGE.icon);
}

/** 한 줄 글자의 줄 상자 높이 안에서 글자 상자 위치 (CSS: 줄 높이 = 크기 × 1.25, 글자는 가운데) */
function textTopInLine(size: string) {
  const b = fontBox(px(size));
  return (px(size) * LINE_HEIGHT - (b.ascent + b.descent)) / 2;
}

/** 그린 토큰의 얼굴 원 자리 (호버 판정 · 테). bundle = 몇 번째 묶음, i = 그 안의 순서 / slot = 적 칸 번호(0부터).
 *  badge = 이 토큰의 배지를 다시 그려요: 나중에 얹는 테(호버)도 배지 뒤에 있어야 해서, 테를 그린 다음 불러요 */
export type OrderHit = { x: number; y: number; w: number; h: number; badge: () => void } & (
  | { kind: "ally"; bundle: number; i: number }
  | { kind: "enemy"; slot: number }
  /** 방전 띠 (0096): 테 없이 풀이만 */
  | { kind: "band"; band: BandVM }
);

/** 그린 토큰 하나 (모션용, 0077): 이름 · 얼굴 가운데 · 상태와 그 덩어리 */
export interface OrderMark {
  key?: string;
  kind: "ally" | "enemy";
  x: number;
  y: number;
  d: number;
  past: boolean;
  held?: boolean;
  cut?: boolean;
  node: Phaser.GameObjects.Container;
  alpha: () => Opacity;
  /** 이 장면에서의 불투명도 */
  fade: number;
}

/** 재생 위치 선 */
export interface OrderCursor {
  x: number;
  bar: Phaser.GameObjects.Graphics;
}

/**
 * 순서표 (0038): [머리] │ [묶음] ─ ①적 ─ [묶음] ─ ②적 ─ … ─ [꼬리 묶음]. 오른쪽 끝이 이번 턴의 끝이에요 (0074 12번).
 * 묶음 칸은 모두 같은 폭(가장 긴 묶음)이고, 묶음은 칸 안에서 다음 적 쪽에 붙어요. 빈 칸은 연결선만.
 */
export function drawOrder(scene: Phaser.Scene, vm: BattleVM["order"]): { g: Phaser.GameObjects.Graphics; hits: OrderHit[]; marks: OrderMark[]; cursor?: OrderCursor } {
  const hits: OrderHit[] = [];
  /** 띠는 토큰 뒤에 깔려 있어서 토큰이 먼저 잡혀요 */
  const bandHits: OrderHit[] = [];
  const marks: OrderMark[] = [];
  let cursorMark: OrderCursor | undefined;
  const phaseText = vm.playing ? COPY.playing : COPY.myTurn;
  const turnText = vm.head ? `${COPY.turn} ${vm.head.turn}` : "";
  const placeH = px(HEAD.place) * LINE_HEIGHT, stateH = px(HEAD.state) * LINE_HEIGHT;
  // .tn: 턴 N · 점 · 단계가 gap 6으로 나란히
  const turnW = turnText ? measure(turnText, HEAD.state) + O.head.gap : 0;
  const stateW = turnW + O.head.dot + O.head.gap + measure(phaseText, HEAD.state);
  const headW = Math.max(stateW, vm.head?.place ? measure(vm.head.place, HEAD.place) : 0);
  const bundles = vm.bundles ?? [];
  // 칸마다 두 장 자리를 미리 잡아서, 카드를 놓아도 적 토큰이 움직이지 않아요. 넘칠 때만 모든 칸이 함께 늘어요 (0077 0번)
  const bandsIn = (k: number) => (vm.bands ?? []).filter((b) => b.cell === k);
  const plans = bundles.map((b, k) => (bandsIn(k).length ? planCell(b.length, bandsIn(k)) : undefined));
  const cellW = Math.max(vm.bundles ? bundleWidth(O.bundle.reserve) : 0, ...bundles.map((b, k) => plans[k]?.w ?? (b.length ? bundleWidth(b.length) : 0)));
  const dividerW = O.head.padR + O.head.line + O.head.mr;
  // 재생 위치: 아직 다 지나가지 않은 첫 칸(묶음 또는 적) 앞
  const pastCell = (k: number) => (bundles[k] ?? []).every((t) => t.past);
  const pastSlot = (s: OrderSlotVM) => s.state === "past" || s.cut === "done";
  let cursorAt: { kind: "cell" | "slot"; k: number } | undefined;
  if (vm.playing) {
    for (let k = 0; k <= vm.slots.length && !cursorAt; k++) {
      if (!pastCell(k)) cursorAt = { kind: "cell", k };
      else if (k < vm.slots.length && !pastSlot(vm.slots[k])) cursorAt = { kind: "slot", k };
    }
  }
  const cursorW = cursorAt ? O.cursor.w + O.cursor.mx * 2 : 0;
  const innerW = headW + dividerW + vm.slots.length * (slotW + O.line.w * 2) + (vm.slots.length + 1) * cellW + cursorW;
  const w = innerW + O.padX * 2;
  const x0 = O.cx - w / 2;
  const cy = O.top + O.h / 2;

  const g = scene.add.graphics();
  box(g, x0, O.top, w, O.h, O.radius, { fill: P.glass, ring: { width: 1, color: P.glassLine } });

  const lineTop = (size: string) => cy - (px(size) * LINE_HEIGHT) / 2 + textTopInLine(size);
  let x = x0 + O.padX;

  // 머리: 장소(위) · 턴 + 단계(아래). 장소가 없으면 단계 한 줄을 가운데
  const headTop = cy - (vm.head?.place ? placeH + stateH : stateH) / 2;
  const stateTop = (vm.head?.place ? headTop + placeH : headTop) + textTopInLine(HEAD.state);
  const stateCy = (vm.head?.place ? headTop + placeH : headTop) + stateH / 2;
  if (vm.head?.place) scene.add.text(x, headTop + textTopInLine(HEAD.place), vm.head.place, textStyle(HEAD.place, P.ink3));
  let hx = x;
  if (turnText) {
    scene.add.text(hx, stateTop, turnText, textStyle(HEAD.state, P.ink));
    hx += turnW;
  }
  circle(g, hx + O.head.dot / 2, stateCy, O.head.dot, vm.playing ? { ring: { width: O.head.playRing, color: P.ink } } : { fill: P.ink });
  scene.add.text(hx + O.head.dot + O.head.gap, stateTop, phaseText, textStyle(HEAD.state, P.ink));
  x += headW;

  const line = (len: number) => {
    if (len > 0) box(g, x, cy - O.line.h / 2, len, O.line.h, 0, { fill: P.glassLine });
    x += len;
  };

  const cursor = (kind: "cell" | "slot", k: number) => {
    if (cursorAt?.kind !== kind || cursorAt.k !== k) return;
    const bar = box(scene.add.graphics(), 0, -O.cursor.h / 2, O.cursor.w, O.cursor.h, O.cursor.radius, { fill: P.ink }).setPosition(x + O.cursor.mx, cy);
    cursorMark = { x: x + O.cursor.mx, bar };
    x += cursorW;
  };

  /** 토큰 하나를 한 덩어리로 그려요. fade가 있으면 덩어리째 흐려요 (CSS opacity) */
  const token = (draw: () => void, fade: number | undefined, mark: Omit<OrderMark, "node" | "alpha" | "fade">) => {
    const node = gather(scene, 0, 0, draw);
    // 불투명도 필터는 흐린 토큰과 움직이는 토큰에만 붙여요
    let op: Opacity | undefined;
    const alpha = () => (op ??= opacityOf(node));
    if (fade !== undefined) alpha().value = fade;
    if (mark.key) marks.push({ ...mark, node, alpha, fade: fade ?? 1 });
  };

  /** 묶음 칸 (.slot): 칸 폭만큼 연결선이 지나가고, 묶음은 다음 적 쪽(오른쪽)에 붙어 선을 덮어요 */
  const cell = (k: number) => {
    const list = bundles[k] ?? [];
    const plan = plans[k];
    const bw = plan ? plan.w : list.length ? bundleWidth(list.length) : 0;
    line(cellW - bw);
    if (!bw) return;
    cursor("cell", k);
    const d = O.allyFace;
    const h = d + O.bundle.pad * 2;
    if (list.length) box(g, x, cy - h / 2, bw, h, h / 2, { fill: P.glass, ring: { width: O.bundle.ring, color: P.manaLine } });
    for (const r of plan?.bands ?? []) {
      const bh = d + B.padY * 2;
      // 띠는 옅은 테로 묶음과 나뉘고, 든 카드가 들어오면 테가 위험색으로 켜져요 (0096)
      const lit = list.slice(r.band.at, r.band.at + r.band.n).some((t) => t.mark === "held");
      box(g, x + r.x, cy - bh / 2, r.w, bh, bh / 2, { fill: P.floor, ring: { width: O.bundle.ring, color: lit ? P.danger : P.glassLine } });
      bandHits.push({ kind: "band", band: r.band, x: x + r.x, y: cy - bh / 2, w: r.w, h: bh, badge: () => {} });
      if (r.band.head) {
        const hx = x + r.x + B.padX;
        icon(scene, hx, cy - B.icon / 2, BAND_ICON, B.icon, B.icon, P.danger);
        scene.add.text(hx + B.icon + B.inGap, lineTop(NUM), String(r.band.dmg), textStyle(NUM, P.danger));
      }
    }
    let sx = x + O.bundle.pad;
    const shown = plan ? list : list.slice(0, shownOf(list.length));
    shown.forEach((t, i) => {
      if (plan) sx = x + plan.xs[i];
      const fx = sx + d / 2;
      const badge = () => drawBadge(scene, fx, cy, ALLY_BADGE, { icon: t.icon, tint: P.ink2, fill: P.face });
      hits.push({ kind: "ally", bundle: k, i, x: sx, y: cy - d / 2, w: d, h: d, badge });
      token(() => {
        const fg = scene.add.graphics();
        circle(fg, fx, cy, d, { fill: P.face });
        place(scene, fg, { t: "image", key: faceKey(t.face), w: d, h: d, round: true }, fx - d / 2, cy - d / 2);
        const ring = allyRing(t);
        if (ring) drawRing(scene, fx, cy, d, ring);
        badge();
        // 해방: 왼쪽 위 ✦ 배지 (0074 토큰 그리기 규칙)
        if (t.mark === "release") drawBadge(scene, fx, cy, ALLY_BADGE, { icon: "", glyph: COPY.order.release, tint: P.accHi, fill: P.face }, [-1, -1]);
      }, t.mark === "held" ? O.fade.held : t.past ? O.fade.past : undefined, { key: t.key, kind: "ally", x: fx, y: cy, d, past: !!t.past, held: t.mark === "held" });
      sx += d + O.bundle.gap;
    });
    if (!plan && list.length > O.bundle.max) {
      const text = moreText(list.length);
      const mw = measure(text, MORE) + O.more.padX * 2;
      const mh = px(MORE) * LINE_HEIGHT + O.more.padY * 2;
      box(g, sx, cy - mh / 2, mw, mh, mh / 2, { fill: P.veil["06"], ring: { width: O.more.ring, color: P.glassLine } });
      scene.add.text(sx + O.more.padX, lineTop(MORE), text, textStyle(MORE, P.ink2));
    }
    x += bw;
  };

  box(g, x + O.head.padR, cy - O.head.h / 2, O.head.line, O.head.h, 0, { fill: P.glassLine });
  x += dividerW;
  for (const [k, s] of vm.slots.entries()) {
    cell(k);
    cursor("slot", k);
    line(O.line.w);
    const nx = x + O.enemy.padX;
    const fx = nx + O.enemy.numW + O.enemy.gap + O.face / 2;
    const badge = () => drawBadge(scene, fx, cy, ENEMY_BADGE, enemyBadge(s));
    hits.push({ kind: "enemy", slot: k, x: fx - O.face / 2, y: cy - O.face / 2, w: O.face, h: O.face, badge });
    token(() => {
      const numText = String(s.n);
      scene.add.text(nx + (O.enemy.numW - measure(numText, NUM)) / 2, lineTop(NUM), numText, textStyle(NUM, P.ink3));
      // 끊긴 적은 얼굴만 흐리고 배지는 그대로 (0074 10번)
      const face = gather(scene, 0, 0, () => {
        circle(scene.add.graphics(), fx, cy, O.face, { fill: P.face });
        if (!drawEnemyFace(scene, s.art, fx, cy, O.face)) placeholderArt(scene, fx - O.art / 2, cy - O.art / 2, O.art, O.art, P.ink3);
      });
      if (s.cut === "done") opacityOf(face).value = O.fade.cutFace;
      if (s.state === "now") drawRing(scene, fx, cy, O.face, { color: P.ink });
      badge();
    }, s.state === "past" ? O.fade.past : undefined, { key: s.key, kind: "enemy", x: fx, y: cy, d: O.face, past: s.state === "past", cut: s.cut === "done" });
    x += slotW;
    line(O.line.w);
  }
  cell(vm.slots.length);
  return { g, hits: [...hits, ...bandHits], marks, cursor: cursorMark };
}

/** 가리킨 토큰: 얼굴 원에 흰 테 (0038 호버). 같은 적의 다른 토큰(soft)은 옅은 테 (0074 5번). 테 위에 배지를 다시 얹어요 */
export function drawOrderRing(scene: Phaser.Scene, hit: OrderHit, soft = false) {
  const cx = hit.x + hit.w / 2;
  if (hit.kind === "band") return { cx, bottom: O.top + O.h };
  drawRing(scene, cx, hit.y + hit.h / 2, hit.w, { color: soft ? P.veil["50"] : P.ink });
  hit.badge();
  return { cx, bottom: O.top + O.h };
}
