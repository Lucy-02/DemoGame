// 해결 순서표: 위쪽 가운데 한 줄. 판은 정본 .rs, 토큰은 0074 "토큰 그리기 규칙"
import type * as Phaser from "phaser";
import { tokens } from "../../../design/tokens";
import { box, circle } from "../../style/draw";
import { place } from "../../style/flex";
import { gather } from "../../style/gather";
import { icon, loadIcon } from "../../style/icons";
import { opacityOf } from "../../style/opacity";
import { placeholderArt } from "../../style/placeholder";
import { ringTexture } from "../../style/ring";
import { faceKey } from "../../faces";
import { LINE_HEIGHT, fontBox, measure, px, textStyle } from "../../style/text";
import { COPY } from "../copy";
import { ORDER as O, ORDER_SCALE } from "../layout";
import type { AllyTokenVM, BattleVM, OrderSlotVM } from "../viewmodel";

const P = tokens.provisional.palette;
const T = tokens.provisional.text.battle;

/** 순서표 글자: 정본 크기의 1.4배 (0038) */
const scaled = (size: string) => `${px(size) * ORDER_SCALE}px`;
const LABEL = scaled(T.orderLabel);
const NUM = scaled(T.orderNum);

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

/** 적 칸: 번호 · 얼굴. 얼굴 양옆은 테가 번호 · 연결선에 닿지 않게 테 폭만큼 더 띄워요 */
const NUM_GAP = O.slot.gap + RING_OUT;
const slotW = O.slot.padX + O.numW + NUM_GAP + O.face + RING_OUT + O.slot.padX;
/** 묶음에 보이는 토큰 수: 상한을 넘으면 N−1개 + "+n" 칩 (0074 4번) */
const shownOf = (n: number) => (n > O.bundle.max ? O.bundle.max - 1 : n);
const moreText = (n: number) => `+${n - shownOf(n)}`;
const moreW = (n: number) => (n > O.bundle.max ? O.bundle.gap + measure(moreText(n), NUM) + O.more.padX * 2 : 0);
const bundleWidth = (n: number) => O.bundle.pad * 2 + shownOf(n) * O.allyFace + (shownOf(n) - 1) * O.bundle.gap + moreW(n);
const lineW = O.line.w + O.line.mx * 2;

export function preloadOrder(scene: Phaser.Scene, vm: BattleVM["order"]) {
  for (const s of vm.slots) loadIcon(scene, s.action, ENEMY_BADGE.icon);
  loadIcon(scene, BREAK_ICON, ENEMY_BADGE.icon);
  for (const t of (vm.bundles ?? []).flat()) loadIcon(scene, t.icon, ALLY_BADGE.icon);
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
);

/**
 * 순서표 (0038): [머리] │ [묶음] ─ ①적 ─ [묶음] ─ ②적 ─ … ─ [꼬리 묶음]. 오른쪽 끝이 이번 턴의 끝이에요 (0074 12번).
 * 묶음 칸은 모두 같은 폭(가장 긴 묶음)이고, 묶음은 칸 안에서 다음 적 쪽에 붙어요. 빈 칸은 연결선만.
 */
export function drawOrder(scene: Phaser.Scene, vm: BattleVM["order"]): { g: Phaser.GameObjects.Graphics; hits: OrderHit[] } {
  const hits: OrderHit[] = [];
  const phaseText = COPY.myTurn;
  const turnText = vm.head ? `${COPY.turn} ${vm.head.turn}${COPY.sep}` : "";
  const lineH = px(LABEL) * LINE_HEIGHT;
  const stateW = measure(turnText, LABEL) + O.meDot + O.meGap + measure(phaseText, LABEL);
  const headW = Math.max(stateW, vm.head?.place ? measure(vm.head.place, LABEL) : 0);
  const bundles = vm.bundles ?? [];
  const cellW = Math.max(0, ...bundles.map((b) => (b.length ? bundleWidth(b.length) : 0)));
  const gaps = vm.slots.length + 1;
  const dividerW = O.divider.w + O.line.mx * 2;
  const innerW = headW + dividerW + vm.slots.length * slotW + gaps * (lineW + cellW);
  const w = innerW + O.padX * 2;
  const x0 = O.cx - w / 2;
  const cy = O.top + O.h / 2;

  const g = scene.add.graphics();
  box(g, x0, O.top, w, O.h, O.radius, { fill: P.glassThin, ring: { width: 1, color: P.glassLine } });

  const labelTop = (lineCy: number) => lineCy - lineH / 2 + textTopInLine(LABEL);
  const numTop = cy - (px(NUM) * LINE_HEIGHT) / 2 + textTopInLine(NUM);
  let x = x0 + O.padX;

  // 머리: 장소(위) · 턴 + 단계(아래). 장소가 없으면 단계 한 줄을 가운데
  const stateCy = vm.head?.place ? cy + lineH / 2 : cy;
  if (vm.head?.place) scene.add.text(x, labelTop(cy - lineH / 2), vm.head.place, textStyle(LABEL, P.ink3));
  let hx = x;
  if (turnText) {
    scene.add.text(hx, labelTop(stateCy), turnText, textStyle(LABEL, P.ink2));
    hx += measure(turnText, LABEL);
  }
  circle(g, hx + O.meDot / 2, stateCy, O.meDot, { fill: P.ink });
  scene.add.text(hx + O.meDot + O.meGap, labelTop(stateCy), phaseText, textStyle(LABEL, P.ink));
  x += headW;

  const line = (len: number) => {
    if (len > 0) box(g, x, cy - O.line.h / 2, len, O.line.h, 0, { fill: P.glassLine });
    x += len;
  };

  /** 토큰 하나를 한 덩어리로 그려요. fade가 있으면 덩어리째 흐려요 (CSS opacity) */
  const token = (draw: () => void, fade?: number) => {
    const c = gather(scene, 0, 0, draw);
    if (fade !== undefined) opacityOf(c).value = fade;
  };

  /** 묶음 칸: 연결선 + (있으면) 다음 적 쪽에 붙은 둥근 테 묶음 */
  const cell = (k: number) => {
    const list = bundles[k] ?? [];
    const bw = list.length ? bundleWidth(list.length) : 0;
    line(lineW + cellW - bw - (bw ? O.line.mx : 0));
    if (!bw) return;
    const d = O.allyFace;
    const h = d + O.bundle.pad * 2;
    box(g, x, cy - h / 2, bw, h, h / 2, { ring: { width: 1, color: P.glassLine } });
    let sx = x + O.bundle.pad;
    list.slice(0, shownOf(list.length)).forEach((t, i) => {
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
      }, t.mark === "held" ? O.fade.held : t.past ? O.fade.past : undefined);
      sx += d + O.bundle.gap;
    });
    if (list.length > O.bundle.max) {
      const text = moreText(list.length);
      const mw = measure(text, NUM) + O.more.padX * 2;
      const mh = px(NUM) * LINE_HEIGHT + O.more.padY * 2;
      box(g, sx, cy - mh / 2, mw, mh, mh / 2, { fill: P.veil["06"], ring: { width: O.more.ring, color: P.glassLine } });
      scene.add.text(sx + O.more.padX, numTop, text, textStyle(NUM, P.ink2));
    }
    x += bw;
    line(O.line.mx);
  };

  box(g, x + O.line.mx, cy - O.slot.h / 2, O.divider.w, O.slot.h, 0, { fill: P.glassLine });
  x += dividerW;
  for (const [k, s] of vm.slots.entries()) {
    cell(k);
    const nx = x + O.slot.padX;
    const fx = nx + O.numW + NUM_GAP + O.face / 2;
    const badge = () => drawBadge(scene, fx, cy, ENEMY_BADGE, enemyBadge(s));
    hits.push({ kind: "enemy", slot: k, x: fx - O.face / 2, y: cy - O.face / 2, w: O.face, h: O.face, badge });
    token(() => {
      const numText = String(s.n);
      scene.add.text(nx + (O.numW - measure(numText, NUM)) / 2, numTop, numText, textStyle(NUM, P.ink3));
      // 끊긴 적은 얼굴만 흐리고 배지는 그대로 (0074 10번)
      const face = gather(scene, 0, 0, () => {
        circle(scene.add.graphics(), fx, cy, O.face, { fill: P.face });
        placeholderArt(scene, fx - O.art.w / 2, cy - O.art.h / 2, O.art.w, O.art.h, P.ink3);
      });
      if (s.cut === "done") opacityOf(face).value = O.fade.cutFace;
      if (s.state === "now") drawRing(scene, fx, cy, O.face, { color: P.ink });
      badge();
    }, s.state === "past" ? O.fade.past : undefined);
    x += slotW;
  }
  cell(vm.slots.length);
  return { g, hits };
}

/** 가리킨 토큰: 얼굴 원에 흰 테 (0038 호버). 같은 적의 다른 토큰(soft)은 옅은 테 (0074 5번). 테 위에 배지를 다시 얹어요 */
export function drawOrderRing(scene: Phaser.Scene, hit: OrderHit, soft = false) {
  const cx = hit.x + hit.w / 2;
  drawRing(scene, cx, hit.y + hit.h / 2, hit.w, { color: soft ? P.veil["50"] : P.ink });
  hit.badge();
  return { cx, bottom: O.top + O.h };
}
