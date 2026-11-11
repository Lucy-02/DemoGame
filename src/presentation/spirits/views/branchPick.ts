// 갈래 고르기 창 (0047 S15 · 라운드 G1, 바탕 P1 f7): 가운데 유리 틀, 왼쪽 "지금" 열, 갈래 판 둘, 끝 버튼 줄.
// 잠긴 갈래는 숨기지 않고 흐리게, 조건 줄(Lv · 갈래 표지 · 막대 · n/N)만 또렷하게. 값은 layout BRANCH (G1 임시 값).
import type * as Phaser from "phaser";
import { HAND_CARD } from "../../card/layout";
import { createHandCard, preloadHandCard } from "../../card/HandCard";
import { box, circle } from "../../style/draw";
import { render, size, type BoxNode, type Node } from "../../style/flex";
import { icon as drawIcon } from "../../style/icons";
import { placeholderArt } from "../../style/placeholder";
import { faceTexture } from "../../spiritArt";
import { cardDef } from "../../../core/data";
import { cardVM } from "../../run/fromCore";
import { COPY } from "../copy";
import { BRANCH, FRAME } from "../layout";
import type { BranchColVM, BranchPickVM } from "../viewmodel";
import { P, glass, text } from "./parts";
import { tokens } from "../../../design/tokens";

const T = tokens.provisional.text.branch;
const B = BRANCH;
/** 성장 자두빛 (P1 --c-grow = --acc-hi) */
const GROW = P.accHi;

export interface BranchPickActions {
  select(i: number): void;
  confirm(): void;
  later(): void;
}

export const BRANCH_ICONS = [
  ["i-sprout", B.tag.icon], ["g-lock", B.cond.lock], ["ui-done", B.cond.ok], ["ui-done", B.cond.chip.icon], ["g-lock", B.foot.btnIcon],
  ["el-fire", B.head.icon], ["el-water", B.head.icon], ["el-forest", B.head.icon], ["el-wind", B.head.icon], ["el-light", B.head.icon],
  ["el-earth", B.head.icon], ["el-none", B.head.icon],
  ["role-attack", B.head.icon], ["role-guard", B.head.icon], ["role-support", B.head.icon], ["role-disrupt", B.head.icon],
  ["role-attack", B.row.role], ["role-guard", B.row.role], ["role-support", B.row.role], ["role-disrupt", B.row.role],
  ["fx-heal", B.row.statIcon], ["fx-damage", B.row.statIcon], ["fx-block", B.row.statIcon], ["i-spark", B.row.statIcon],
] as const;

const CARD_SCALE = B.card.w / HAND_CARD.w;

export function preloadBranchCards(scene: Phaser.Scene, vm: BranchPickVM) {
  for (const b of vm.branches) for (const c of b.cards) if (c.key) preloadHandCard(scene, cardVM(c.key, vm.spiritId), { showRarity: true, scale: CARD_SCALE });
}

/** 갈래 표지: 기호 자리(TODO_ICON, 점선 네모) + 번호. lg = 판 머리 */
function mark(n: number, lg = false, alpha = 1): BoxNode {
  const m = lg ? B.mark.lg : B.mark;
  const slot = m.slot;
  return {
    t: "row", h: m.h, pad: [0, m.padR, 0, m.padL], gap: m.gap, align: "center", radius: m.h / 2,
    style: { fill: P.floor, ring: { width: 1, color: GROW } },
    children: [
      { t: "block", w: slot, h: slot, draw: (g, x, y) => dashedSquare(g, x, y, slot, m.slotRadius, m.slotLine, GROW, alpha) },
      text(String(n), lg ? T.branchNum : T.mark, GROW),
    ],
  };
}

/** 기호가 아직 없는 자리 (TODO_ICON): 점선 둥근 네모 */
function dashedSquare(g: Phaser.GameObjects.Graphics, x: number, y: number, d: number, r: number, w: number, color: string, alpha: number) {
  g.lineStyle(w, Phaser_color(color), alpha);
  const step = d / 4;
  for (let i = 0; i < 4; i++) {
    const a = r + i * step * ((d - 2 * r) / d), b = a + step * 0.5;
    g.lineBetween(x + a, y, x + Math.min(b, d - r), y);
    g.lineBetween(x + a, y + d, x + Math.min(b, d - r), y + d);
    g.lineBetween(x, y + a, x, y + Math.min(b, d - r));
    g.lineBetween(x + d, y + a, x + d, y + Math.min(b, d - r));
  }
}

const Phaser_color = (css: string) => parseInt(css.replace("#", "").slice(0, 6), 16);

/** 가로선 한 줄 높이의 칸 (.bw-r): 아래 1px 선 */
function rowBox(h: number, children: Node[], extra: Partial<BoxNode> = {}): BoxNode {
  return {
    t: "row", h, gap: B.row.gap, align: "center", children,
    style: { fill: "rgba(0,0,0,0)" }, ...extra,
  };
}

function condRow(b: BranchColVM): Node[] {
  if (b.open) {
    return [{
      t: "row", h: B.cond.chip.h, pad: [0, B.cond.chip.padX, 0, B.cond.chip.padX], gap: B.cond.chip.gap, align: "center", radius: B.cond.chip.h / 2,
      style: { fill: P.acc }, children: [{ t: "icon", id: "ui-done", w: B.cond.chip.icon, h: B.cond.chip.icon, tint: GROW }, text(COPY.opened, T.mark, GROW)],
    }];
  }
  const c = b.cond!;
  return [
    { t: "icon", id: "g-lock", w: B.cond.lock, h: B.cond.lock, tint: P.ink3 },
    {
      t: "row", gap: B.cond.okGap, align: "center",
      children: [text(COPY.lv(c.level.need), T.cond, P.ink2), ...(c.level.ok ? [{ t: "icon", id: "ui-done", w: B.cond.ok, h: B.cond.ok, tint: GROW } as Node] : [])],
    },
    { t: "block", w: B.cond.sep.w, h: B.cond.sep.h, ml: B.cond.sep.mx, mr: B.cond.sep.mx, draw: (g, x, y, w, h) => box(g, x, y, w, h, 0, { fill: P.glassLine }) },
    mark(b.n),
    {
      t: "block", w: B.cond.bar.minW, h: B.cond.bar.h, grow: true,
      draw: (g, x, y, w, h) => {
        box(g, x, y, w, h, h / 2, { fill: P.wallLo });
        const v = c.cards.need ? Math.min(1, c.cards.have / c.cards.need) : 0;
        if (v > 0) box(g, x, y, Math.max(h, w * v), h, h / 2, { fill: GROW });
      },
    },
    { t: "row", align: "baseline", children: [text(String(c.cards.have), T.count, P.ink), text(COPY.ofCardsShort(c.cards.need), T.countUnit, P.ink3)] },
  ];
}

export function drawBranchPick(scene: Phaser.Scene, vm: BranchPickVM, act: BranchPickActions) {
  // 바탕: 아래 화면을 누르고 (.bw-dim), 클릭이 아래로 새지 않게 막아요
  const dim = scene.add.graphics();
  box(dim, 0, 0, FRAME.w, FRAME.h, 0, { fill: P.scrim });
  scene.add.zone(0, 0, FRAME.w, FRAME.h).setOrigin(0, 0).setInteractive();

  // 부른 곳 (.bw-tag): 정원 = 새싹, 런 결과는 기호 없음(TODO_ICON 점선)
  const tg = scene.add.graphics();
  circle(tg, B.tag.x + B.tag.d / 2, B.tag.y + B.tag.d / 2, B.tag.d, { fill: P.veil["10"], ring: { width: 1, color: P.glassLine } });
  const ti = B.tag.x + (B.tag.d - B.tag.icon) / 2, tj = B.tag.y + (B.tag.d - B.tag.icon) / 2;
  if (vm.from === "garden") drawIcon(scene, ti, tj, "i-sprout", B.tag.icon, B.tag.icon, P.ink);
  else dashedSquare(tg, ti, tj, B.tag.icon, B.mark.slotRadius, B.mark.slotLine, P.ink2, 1);

  // 유리 틀
  const pn = B.panel;
  const g = scene.add.graphics();
  box(g, pn.x, pn.y, pn.w, pn.h, pn.radius, glass(true));

  // 머리: 얼굴 · 이름 · Lv · 속성 · 역할 · 성격
  const h = B.head;
  const faceNode: Node = { t: "block", w: h.face, h: h.face, draw: (gg, x, y) => drawFace(scene, gg, vm.face, x, y, h.face, h.faceRing) };
  render(scene, {
    t: "row", w: pn.w, pad: h.pad, gap: h.gap, align: "center",
    children: [
      faceNode, text(vm.name, T.name, P.ink), text(vm.level, T.level, P.ink3),
      { t: "icon", id: vm.element, w: h.icon, h: h.icon, tint: P.ink2 }, { t: "icon", id: vm.role, w: h.icon, h: h.icon, tint: P.ink2 },
      { t: "row", pad: h.per.pad, radius: h.per.radius, ml: h.per.ml, style: { fill: P.veil["08"] }, children: [text(vm.personality, T.level, P.ink)] },
    ],
  }, pn.x, pn.y);
  const headH = h.pad[0] + h.face + h.pad[2];

  // 몸: 지금 열 + 갈래 판
  const bd = B.body;
  const top = pn.y + headH;
  const bottom = pn.y + pn.h - B.foot.h - bd.padBottom;
  const colW = (pn.w - bd.padX * 2 - bd.nowW - bd.gap * 2) / 2;
  const nowX = pn.x + bd.padX;
  drawNowCol(scene, vm, nowX, top);
  vm.branches.forEach((b, i) => {
    const x = nowX + bd.nowW + bd.gap + i * (colW + bd.gap);
    drawBranchCol(scene, vm, b, i === vm.selected, x, top, colW, bottom - top, () => act.select(i));
  });

  // 끝 버튼 줄
  const f = B.foot;
  const fy = pn.y + pn.h - f.h;
  box(g, pn.x, fy, pn.w, 1, 0, { fill: P.glassLine });
  const sel = vm.selected !== undefined ? vm.branches[vm.selected] : undefined;
  const later: Node = {
    t: "row", h: f.btnH, pad: [0, f.btnPadX, 0, f.btnPadX], gap: f.btnGap, align: "center", radius: f.radius,
    style: { fill: P.veil["08"], ring: { width: 1, color: P.glassLine } }, onClick: act.later,
    children: [
      text(COPY.later, T.button, P.ink),
      { t: "row", h: f.kbd.h, pad: [0, f.kbd.padX, 0, f.kbd.padX], align: "center", radius: f.kbd.radius, style: { ring: { width: 1, color: P.glassLine } }, children: [text(COPY.esc, T.kbd, P.ink2)] },
    ],
  };
  const go: Node = {
    t: "row", h: f.btnH, w: f.goMinW, pad: [0, f.btnPadX, 0, f.btnPadX], gap: f.btnGap, justify: "center", align: "center", radius: f.radius,
    style: sel ? { fill: P.acc } : { fill: P.veil["05"], ring: { width: 1, color: P.glassLine } }, onClick: sel ? act.confirm : undefined,
    children: [
      ...(sel ? [] : [{ t: "icon", id: "g-lock", w: f.btnIcon, h: f.btnIcon, tint: P.ink3 } as Node]),
      text(sel ? COPY.growInto(sel.n) : COPY.growLocked, T.button, sel ? P.onAcc : P.ink3),
    ],
  };
  const lw = size(later).w, gw = size(go).w;
  render(scene, later, pn.x + pn.w - f.padX - gw - f.gap - lw, fy + (f.h - f.btnH) / 2);
  render(scene, go, pn.x + pn.w - f.padX - gw, fy + (f.h - f.btnH) / 2);
  scene.input.keyboard?.removeAllListeners("keydown-ESC");
  scene.input.keyboard?.once("keydown-ESC", act.later);
}

function drawFace(scene: Phaser.Scene, g: Phaser.GameObjects.Graphics, face: BranchPickVM["face"], x: number, y: number, d: number, ring: number) {
  circle(g, x + d / 2, y + d / 2, d + ring * 2, { fill: GROW });
  circle(g, x + d / 2, y + d / 2, d, { fill: P.wall });
  if (face && scene.textures.exists(face.key)) scene.add.image(x, y, faceTexture(scene, face, d)).setOrigin(0, 0);
}

/** 왼쪽 "지금" 열: 머리 줄 높이를 비우고, 조건 줄 자리, 능력치 (기호 + 값) */
function drawNowCol(scene: Phaser.Scene, vm: BranchPickVM, x: number, y: number) {
  const r = B.row, w = B.body.nowW - B.body.nowPadX * 2;
  const g = scene.add.graphics();
  let cy = y + r.head;
  box(g, x + B.body.nowPadX, cy - r.line, w, r.line, 0, { fill: P.glassLine });
  if (vm.condRow) {
    cy += r.cond;
    box(g, x + B.body.nowPadX, cy - r.line, w, r.line, 0, { fill: P.glassLine });
  }
  for (const s of vm.now) {
    render(scene, rowBox(r.stat, [{ t: "icon", id: s.icon, w: r.statIcon, h: r.statIcon, tint: s.color }, text(String(s.value), T.stat, P.ink, { ml: "auto" })], { w }), x + B.body.nowPadX, cy);
    cy += r.stat;
    box(g, x + B.body.nowPadX, cy - r.line, w, r.line, 0, { fill: P.glassLine });
  }
}

/** fn 안에서 새로 생긴 화면 객체들 */
function made(scene: Phaser.Scene, fn: () => void): Phaser.GameObjects.GameObject[] {
  const before = new Set(scene.children.list);
  fn();
  return scene.children.list.filter((o) => !before.has(o));
}

function drawBranchCol(scene: Phaser.Scene, vm: BranchPickVM, b: BranchColVM, sel: boolean, x: number, y: number, w: number, h: number, onClick: () => void) {
  const bd = B.body, r = B.row;
  const g = scene.add.graphics();
  const lock = !b.open;
  box(g, x, y, w, h, bd.radius, sel
    ? { fill: P.glassSel, ring: { width: bd.selRing, color: GROW } }
    : { fill: lock ? P.veil["04"] : P.veil["05"], ring: { width: 1, color: P.glassLine } });
  if (b.open) scene.add.zone(x, y, w, h).setOrigin(0, 0).setInteractive({ useHandCursor: true }).on("pointerup", onClick);
  const ix = x + bd.padX2, iw = w - bd.padX2 * 2;
  const faded: Phaser.GameObjects.GameObject[] = [];
  const line = (yy: number) => box(g, ix, yy - r.line, iw, r.line, 0, { fill: P.glassLine });

  // 머리: 얼굴 · 갈래 표지 · 이름 자리 · 역할
  const faceD = r.face;
  faded.push(...made(scene, () => {
    const fg = scene.add.graphics();
    drawSmallFace(scene, fg, vm.face, ix, y + (r.head - faceD) / 2, faceD);
    drawIcon(scene, ix + iw - r.role, y + (r.head - r.role) / 2, b.role, r.role, r.role, P.ink2);
  }));
  const headMark = made(scene, () => render(scene, rowBox(r.head, [{ t: "block", w: faceD, h: faceD }, mark(b.n, true), todoName(b.name)], { w: iw }), ix, y));
  let cy = y + r.head;
  line(cy);
  if (vm.condRow) {
    render(scene, rowBox(r.cond, condRow(b), { w: iw, gap: B.cond.gap }), ix, cy);
    cy += r.cond;
    line(cy);
  }
  // 능력치: 키운 뒤 값 + ▲양, 안 바뀐 칸은 흐리게
  for (const s of b.stats) {
    const same = s.gain === 0;
    faded.push(...made(scene, () => render(scene, rowBox(r.stat, [
      text(String(s.value), same ? T.statSame : T.stat, same ? P.ink3 : P.ink),
      ...(same ? [] : [text(`▲${s.gain}`, T.gain, GROW)]),
    ], { w: iw }), ix, cy)));
    cy += r.stat;
    line(cy);
  }
  // 갈래 카드: 정본 카드, 없으면 자리 카드 + TODO_NAME
  let cx = ix;
  const ctop = cy + r.cardsTop;
  const cards = b.cards.length ? b.cards : [{ name: COPY.branchName }];
  for (const c of cards) {
    if (c.key && cardDef(c.key)) {
      const view = createHandCard(scene, cardVM(c.key, vm.spiritId),
        cx + B.card.w / 2 - HAND_CARD.w / 2, ctop + B.card.h - HAND_CARD.h, { showRarity: true, scale: CARD_SCALE });
      faded.push(view.root);
    } else {
      faded.push(placeholderArt(scene, cx, ctop, B.card.w, B.card.h, P.glassLine));
      faded.push(...made(scene, () => render(scene, todoName(c.name), cx, ctop + B.card.h + B.card.nameGap)));
    }
    // 카드 갈래 표지 (오른쪽 위 바깥, 바깥 테 3)
    const m = mark(b.n);
    const ms = size(m);
    const mx = cx + B.card.w + B.cardMark.dx - ms.w, my = ctop - B.cardMark.dy;
    const mg = scene.add.graphics();
    box(mg, mx - B.cardMark.ring, my - B.cardMark.ring, ms.w + B.cardMark.ring * 2, ms.h + B.cardMark.ring * 2, ms.h / 2 + B.cardMark.ring, { fill: P.floor });
    render(scene, m, mx, my);
    cx += B.card.w + B.card.gap;
  }
  if (lock) {
    for (const o of faded) (o as unknown as { setAlpha(a: number): void }).setAlpha?.(B.lockAlpha);
    for (const o of headMark) (o as unknown as { setAlpha(a: number): void }).setAlpha?.(B.lockMarkAlpha);
  }
}

function drawSmallFace(scene: Phaser.Scene, g: Phaser.GameObjects.Graphics, face: BranchPickVM["face"], x: number, y: number, d: number) {
  circle(g, x + d / 2, y + d / 2, d, { fill: P.wall });
  if (face && scene.textures.exists(face.key)) scene.add.image(x, y, faceTexture(scene, face, d)).setOrigin(0, 0);
}

/** 이름 자리 (TODO_NAME): 점선 상자 대신 흐린 글자 */
const todoName = (name: string): Node => text(name, T.cardName, P.warn);
