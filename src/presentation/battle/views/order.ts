// 해결 순서표: 위쪽 가운데 한 줄. 정본 .rs
import type * as Phaser from "phaser";
import { tokens } from "../../../design/tokens";
import { box, circle } from "../../style/draw";
import { icon, loadIcon } from "../../style/icons";
import { placeholderArt } from "../../style/placeholder";
import { faceKey } from "../../faces";
import { LINE_HEIGHT, fontBox, measure, px, textStyle } from "../../style/text";
import { COPY } from "../copy";
import { ORDER as O, ORDER_SCALE, PREVIEW } from "../layout";
import type { BattleVM } from "../viewmodel";

const P = tokens.provisional.palette;
const T = tokens.provisional.text.battle;

/** 순서표 글자: 정본 크기의 1.4배 (0038) */
const scaled = (size: string) => `${px(size) * ORDER_SCALE}px`;
const LABEL_SIZE = scaled(T.orderLabel);
const NUM_SIZE = scaled(T.orderNum);



/** 배지: 얼굴 지름 d의 0.42배 원을 얼굴 둘레 45° 자리에 (0074). over = 얼굴 원 밖으로 나온 길이 */
const badgeOf = (d: number) => {
  const size = d * O.badge.ratio;
  const off = (d / 2) * Math.cos((O.badge.deg * Math.PI) / 180);
  return { size, off, over: Math.max(0, off + size / 2 - d / 2) };
};
const ENEMY_BADGE = badgeOf(O.face);
const ALLY_BADGE = badgeOf(O.allyFace);
const slotW = O.slot.padX * 2 + O.numW + O.slot.gap + O.face + ENEMY_BADGE.over;
/** 아군 토큰 하나: 얼굴(적의 0.8배) + 카드 기호 배지 (번호 없음) */
const tokenW = O.allyFace + ALLY_BADGE.over + O.slot.gap;
/** 묶음에 보이는 칸 수: 상한을 넘으면 N−1개 + "+n" 칩 한 칸 (0074) */
const shownOf = (n: number) => (n > O.bundleMax ? O.bundleMax - 1 : n);
const moreW = (n: number) => (n > O.bundleMax ? measure(`+${n - shownOf(n)}`, NUM_SIZE) + O.slot.gap : 0);
const bundleWidth = (n: number) => O.slot.padX * 2 + shownOf(n) * tokenW - O.slot.gap + moreW(n);
const lineW = O.line.w + O.line.mx * 2;


const badgeIcon = (b: { size: number }) => Math.round(b.size - O.badge.pad * 2);

export function preloadOrder(scene: Phaser.Scene, vm: BattleVM["order"]) {
  for (const s of vm.slots) loadIcon(scene, s.action, badgeIcon(ENEMY_BADGE));
  for (const t of (vm.bundles ?? []).flat()) loadIcon(scene, t.icon, badgeIcon(ALLY_BADGE));
}

/** 끊김 사선 (.rs-slot.cut::after): 칸 좌우 inset, 위 50%에서 아래로 높이만큼, 가운데 기준 회전.
 *  WebGL 사선은 계단이 져서 canvas에 구워요. */
function cutMark(scene: Phaser.Scene, x: number, top: number) {
  const C = PREVIEW.orderCut;
  const w = slotW - C.inset * 2;
  const key = "order:cut";
  if (!scene.textures.exists(key)) {
    const tex = scene.textures.createCanvas(key, w, w)!;
    const ctx = tex.getContext();
    ctx.translate(w / 2, w / 2);
    ctx.rotate((C.deg * Math.PI) / 180);
    ctx.fillStyle = P.accHi;
    ctx.fillRect(-w / 2, -C.h / 2, w, C.h);
    tex.refresh();
  }
  scene.add.image(x + slotW / 2, top + O.slot.h / 2 + C.h / 2, key);
}

/** 한 줄 글자의 줄 상자 높이 안에서 글자 상자 위치 (CSS: 줄 높이 = 크기 × 1.25, 글자는 가운데) */
function textTopInLine(size: string) {
  const b = fontBox(px(size));
  return (px(size) * LINE_HEIGHT - (b.ascent + b.descent)) / 2;
}

const LABEL = LABEL_SIZE;
const NUM = NUM_SIZE;

/** 그린 토큰의 자리 (호버 판정). bundle = 몇 번째 묶음, i = 그 안의 순서 / slot = 적 칸 번호(0부터) */
export type OrderHit = { x: number; y: number; w: number; h: number } & ({ kind: "ally"; bundle: number; i: number } | { kind: "enemy"; slot: number });

/**
 * 순서표 (0038): [머리] │ [묶음] ─ ①적 ─ [묶음] ─ ②적 ─ … ─ [꼬리 묶음] │ 턴 N+1.
 * 묶음 칸은 모두 같은 폭(가장 긴 묶음)이고, 묶음은 칸 안에서 다음 적 쪽에 붙어요. 빈 칸은 연결선만.
 */
export function drawOrder(scene: Phaser.Scene, vm: BattleVM["order"]): { g: Phaser.GameObjects.Graphics; hits: OrderHit[] } {
  const hits: OrderHit[] = [];
  const phaseText = COPY.myTurn;
  const turnText = vm.head ? `${COPY.turn} ${vm.head.turn}${COPY.sep}` : "";
  const nextText = `${COPY.turn} ${vm.nextTurn}`;
  const lineH = px(LABEL) * LINE_HEIGHT;
  const stateW = measure(turnText, LABEL) + O.meDot + O.meGap + measure(phaseText, LABEL);
  const headW = Math.max(stateW, vm.head?.place ? measure(vm.head.place, LABEL) : 0);
  const nextW = measure(nextText, LABEL);
  const bundles = vm.bundles ?? [];
  const cellW = Math.max(0, ...bundles.map((b) => (b.length ? bundleWidth(b.length) : 0)));
  const gaps = vm.slots.length + 1;
  const dividerW = O.divider.w + O.line.mx * 2;
  const innerW = headW + dividerW + vm.slots.length * slotW + gaps * (lineW + cellW) + dividerW + nextW;
  const w = innerW + O.padX * 2;
  const x0 = O.cx - w / 2;
  const cy = O.top + O.h / 2;

  const g = scene.add.graphics();
  box(g, x0, O.top, w, O.h, O.radius, { fill: P.glassThin, ring: { width: 1, color: P.glassLine } });

  const labelTop = (lineCy: number) => lineCy - lineH / 2 + textTopInLine(LABEL);
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

  const divider = () => {
    box(g, x + O.line.mx, cy - O.slot.h / 2, O.divider.w, O.slot.h, 0, { fill: P.glassLine });
    x += dividerW;
  };
  const line = (len: number) => {
    if (len > 0) box(g, x, cy - O.line.h / 2, len, O.line.h, 0, { fill: P.glassLine });
    x += len;
  };

  /** 배지: 얼굴(가운데 fx, cy) 둘레 45° 자리의 작은 원 + 기호. 얼굴 위에 쌓여요 (0074: 얼굴 < 테 < 배지) */
  const badge = (fx: number, b: typeof ENEMY_BADGE, id: string, tint: string) => {
    const bg = scene.add.graphics();
    circle(bg, fx + b.off, cy + b.off, b.size, { fill: P.face });
    const inner = badgeIcon(b);
    icon(scene, fx + b.off - inner / 2, cy + b.off - inner / 2, id, inner, inner, tint);
  };

  /** 묶음 칸: 연결선 + (있으면) 다음 적 쪽에 붙은 둥근 테 묶음. 아군 토큰 크기는 적 칸 값을 임시로 써요 (TODO_TOKEN) */
  const cell = (k: number) => {
    const list = bundles[k] ?? [];
    const bw = list.length ? bundleWidth(list.length) : 0;
    line(lineW + cellW - bw - (bw ? O.line.mx : 0));
    if (!bw) return;
    const top = cy - O.slot.h / 2;
    box(g, x, top, bw, O.slot.h, O.slot.radius, { ring: { width: 1, color: P.glassLine } });
    let sx = x + O.slot.padX;
    const d = O.allyFace;
    list.slice(0, shownOf(list.length)).forEach((t, i) => {
      hits.push({ kind: "ally", bundle: k, i, x: sx, y: cy - d / 2, w: d, h: d });
      circle(g, sx + d / 2, cy, d, { fill: P.face });
      scene.add.image(sx, cy - d / 2, faceKey(t.face)).setOrigin(0, 0).setDisplaySize(d, d);
      badge(sx + d / 2, ALLY_BADGE, t.icon, P.ink2);
      sx += tokenW;
    });
    if (list.length > O.bundleMax) {
      const more = `+${list.length - shownOf(list.length)}`;
      scene.add.text(sx, cy - (px(NUM) * LINE_HEIGHT) / 2 + textTopInLine(NUM), more, textStyle(NUM, P.ink3));
    }
    x += bw;
    line(O.line.mx);
  };

  divider();
  for (const [k, s] of vm.slots.entries()) {
    cell(k);
    const top = cy - O.slot.h / 2;
    hits.push({ kind: "enemy", slot: k, x: x + O.slot.padX + O.numW + O.slot.gap, y: cy - O.face / 2, w: O.face, h: O.face });
    if (s.state === "now") box(g, x, top, slotW, O.slot.h, O.slot.radius, { ring: { width: O.slot.nowRing, color: P.warn } });
    let sx = x + O.slot.padX;
    const numH = px(NUM) * LINE_HEIGHT;
    const numText = String(s.n);
    scene.add.text(
      sx + (O.numW - measure(numText, NUM)) / 2,
      cy - numH / 2 + textTopInLine(NUM),
      numText, textStyle(NUM, P.ink3),
    );
    sx += O.numW + O.slot.gap;
    circle(g, sx + O.face / 2, cy, O.face, { fill: P.face });
    placeholderArt(scene, sx + (O.face - O.art.w) / 2, cy - O.art.h / 2, O.art.w, O.art.h, P.ink3);
    badge(sx + O.face / 2, ENEMY_BADGE, s.action, s.state === "now" ? P.warn : P.ink2);
    if (s.cut) cutMark(scene, x, top);
    x += slotW;
  }
  cell(vm.slots.length);
  divider();
  scene.add.text(x, labelTop(cy), nextText, textStyle(LABEL, P.ink3));
  return { g, hits };
}

/** 가리킨 토큰: 얼굴 원에 흰 테 (0038 호버). 테는 얼굴 원만 감싸요 (0074) */
export function drawOrderRing(scene: Phaser.Scene, hit: OrderHit) {
  const g = scene.add.graphics();
  const cx = hit.x + hit.w / 2;
  circle(g, cx, hit.y + hit.h / 2, hit.w, { ring: { width: O.slot.nowRing, color: P.ink } });
  return { g, cx, bottom: O.top + O.h };
}
