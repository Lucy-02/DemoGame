// 손패 크기 카드 (.cd.h 92×129). 정본 frame-old.css "카드" + r5.css "카드: ▲ 성장, 꼬리표".
// 못 내는 카드는 몸(틀·그림·이름·수치·초상)에만 회색 필터를 걸고, 비용 동전과 자물쇠 꼬리표는 그 위에 또렷하게 그려요(0043).
import * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import { rgba } from "../style/color";
import { box, circle } from "../style/draw";
import { place, render, size, type Node } from "../style/flex";
import { gather } from "../style/gather";
import { icon, iconKey, loadIcon } from "../style/icons";
import { adjustColor, opacityOf } from "../style/opacity";
import { placeholderArt } from "../style/placeholder";
import { shadowTexture } from "../style/shadow";
import { px } from "../style/text";
import { faceKey } from "../faces";
import { preloadCardArt } from "./art";
import { HAND_CARD as C } from "./layout";
import { bandTexture, liftedBodyTexture, windowTexture } from "./materials";
import type { CardVM } from "./viewmodel";

const P = tokens.provisional.palette;
const T = tokens.provisional.text.battle;
const UNPLAYABLE = tokens.provisional.effect.unplayable;
const UP_MARK = "▲";

export interface HandCardOptions {
  /** 희귀도 보석을 그려요 (보상·상점). 손패에서는 꺼요 (0050) */
  showRarity?: boolean;
  /** 카드를 이 배율로 키워 놓아요 (보상 카드). 글자와 기호는 그 크기로 다시 그려서 흐려지지 않아요. preload에도 같은 값을 주세요 */
  scale?: number;
}

const RARITY_TINT = P.rarity;

export function preloadHandCard(scene: Phaser.Scene, c: CardVM, opts: HandCardOptions = {}) {
  const two = c.values.length > 1;
  const icons: [string, number][] = [[c.element, C.element.size], ...c.values.map((v): [string, number] => [v.icon, two ? C.glyph.sizeTwo : C.glyph.size])];
  if (opts.showRarity && c.rarity) icons.push([`rarity-${c.rarity}`, C.rarity.size], [`rarity-${c.rarity}-edge`, C.rarity.size]);
  if (c.mark) icons.push([c.mark, C.mark.icon]);
  if (c.need) icons.push(["g-lock", C.lock.icon], [c.need, C.lock.icon]);
  for (const [id, w] of icons) {
    loadIcon(scene, id, w);
    if (opts.scale && opts.scale !== 1) loadIcon(scene, id, sharpSize(w, opts.scale));
  }
  if (c.illustration) preloadCardArt(scene, c.illustration);
}

const sharpSize = (w: number, scale: number) => Math.round(w * scale);
const ICON_KEY = /^icon:(.+)@([\d.]+)x([\d.]+)$/;

/** 키운 카드에서 글자와 기호를 화면 크기에 맞는 해상도로 바꿔요 (구운 재질·그림은 그대로) */
function sharpen(scene: Phaser.Scene, root: Phaser.GameObjects.Container, scale: number) {
  for (const o of root.list) {
    if (o instanceof Phaser.GameObjects.Container) sharpen(scene, o, scale);
    else if (o instanceof Phaser.GameObjects.Text) o.setResolution(Math.ceil(scale));
    else if (o instanceof Phaser.GameObjects.Image) {
      const m = ICON_KEY.exec(o.texture.key);
      if (!m) continue;
      const w = Number(m[2]), h = Number(m[3]);
      const key = iconKey(m[1], sharpSize(w, scale), sharpSize(h, scale));
      if (scene.textures.exists(key)) o.setTexture(key).setDisplaySize(w, h);
    }
  }
}

const text = (t: string, sz: string, color: string, extra: Partial<Node> = {}): Node =>
  ({ t: "text", text: t, size: sz, color, ...extra }) as Node;

function plate(c: CardVM): Node {
  const two = c.values.length > 1;
  const ink = P.paperInk;
  const g = two ? C.glyph.sizeTwo : C.glyph.size;
  return {
    t: "col", pad: C.plate.pad, gap: C.plate.gap, radius: C.plate.radius, align: "end",
    style: { fill: P.paper },
    children: c.values.map((v): Node => ({
      t: "row", align: "center",
      children: [
        { t: "icon", id: v.icon, w: g, h: g, tint: P.pMute, mr: C.glyph.mr },
        text(String(v.n), two ? T.cardValueTwo : T.cardValue, ink, { lh: 1 }),
        ...(v.mult ? [text(`×${v.mult}`, T.cardMult, ink, { self: "end" })] : []),
        ...(v.up ? [text(UP_MARK, T.cardUp, P.up, { lh: 1, self: "start", ml: C.up.ml, mt: C.up.mt })] : []),
      ],
    })),
  };
}

export interface HandCardView {
  /** 원점 = 카드 아래 가운데 (정본 transform-origin 50% 100%) */
  root: Phaser.GameObjects.Container;
  /** 들린 상태(.cd.act): 몸 전체 재질과 그림자 */
  setLifted(on: boolean): void;
  /** 집은 상태(.cd.act.held): 바깥 테 */
  setHeld(on: boolean): void;
  /** 카드 전체 불투명도 (CSS opacity처럼 다 그린 뒤 한 번에). 1이면 필터를 꺼서 글자가 선명해요 */
  opacity: number;
}

/** (x, y) = 쉬는 자리의 카드 바깥 왼쪽 위 */
export function createHandCard(scene: Phaser.Scene, c: CardVM, x: number, y: number, opts: HandCardOptions = {}): HandCardView {
  const lifted: (Phaser.GameObjects.Image)[] = [];
  const root = gather(scene, x + C.w / 2, y + C.h, () => {
    const sh = shadowTexture(scene, C.w, C.h, C.radius, { ...C.liftShadow, color: P.cardLiftShadow });
    lifted.push(scene.add.image(-C.w / 2 - sh.margin, -C.h - sh.margin, sh.key).setOrigin(0, 0));
    const body = gather(scene, 0, 0, () => drawBody(scene, c, -C.w / 2, -C.h, (img) => lifted.push(img)));
    if (c.off) adjustColor(body, UNPLAYABLE);
    drawSignals(scene, c, -C.w / 2, -C.h);
    if (opts.showRarity && c.rarity) drawRarity(scene, c.rarity, -C.w / 2, -C.h);
  });
  const m = C.held.offset + C.held.width;
  const held = scene.add.image(-C.w / 2 - m, -C.h - m, heldOutlineTexture(scene)).setOrigin(0, 0).setVisible(false);
  root.add(held);
  const setLifted = (on: boolean) => lifted.forEach((o) => o.setVisible(on));
  const setHeld = (on: boolean) => held.setVisible(on);
  setLifted(false);
  if (opts.scale && opts.scale !== 1) {
    sharpen(scene, root, opts.scale);
    root.setScale(opts.scale);
  }
  const fade = opacityOf(root);
  return {
    root, setLifted, setHeld,
    get opacity() { return fade.value; },
    set opacity(v: number) { fade.value = v; },
  };
}

/** 집은 카드 바깥 테: 카드 상자에서 offset 띄우고 width 굵기, 모서리는 border-radius + offset 기준으로 둥글게.
 *  WebGL 선은 둥근 모서리가 거칠어서 canvas에 구워요. */
function heldOutlineTexture(scene: Phaser.Scene): string {
  const key = "card:held-outline";
  if (scene.textures.exists(key)) return key;
  const { width, offset } = C.held;
  const m = offset + width;
  const tex = scene.textures.createCanvas(key, C.w + m * 2, C.h + m * 2)!;
  const ctx = tex.getContext();
  ctx.strokeStyle = P.accHi;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.roundRect(width / 2, width / 2, C.w + m * 2 - width, C.h + m * 2 - width, C.radius + offset + width / 2);
  ctx.stroke();
  tex.refresh();
  return key;
}

/** 카드 몸: 틀, 그림 창, 이름 띠, 속성 기호, 초상 홈, 수치판, 표식. (x, y) = 카드 바깥 왼쪽 위.
 *  onLifted: 들린 상태에만 보일 몸 그림을 넘겨받아요. */
function drawBody(
  scene: Phaser.Scene, c: CardVM, x: number, y: number, onLifted: (img: Phaser.GameObjects.Image) => void,
) {
  const g = scene.add.graphics();
  box(g, x, y, C.w, C.h, C.radius, { fill: P.paper, ring: { width: C.border, color: P.cardLine } });
  onLifted(scene.add.image(x, y, liftedBodyTexture(scene, c.material)).setOrigin(0, 0));
  scene.add.image(x + C.win.x, y + C.win.y, windowTexture(scene, c.owner, c.illustration)).setOrigin(0, 0);
  if (!c.illustration) {
    placeholderArt(
      scene, x + C.win.x + (C.win.contentW - C.art.size) / 2, y + C.win.y + (C.win.h - C.art.size - C.art.mb) / 2,
      C.art.size, C.art.size, P.art,
    );
  }
  scene.add.image(x + C.band.x, y + C.band.y, bandTexture(scene, c.material)).setOrigin(0, 0);
  // 홈·꼬리표는 그림 창 위에 (z-index 1~2)
  const top = scene.add.graphics();

  // 이름 (띠 가운데, 위 여백 2)
  const nameNode = text(c.name, T.cardName, P.paperInk, { ls: px(T.cardName) * C.nameLetterSpacing });
  const ns = size(nameNode);
  render(scene, nameNode, x + C.band.x + (C.band.w - ns.w) / 2, y + C.band.y + C.band.padTop + (C.band.h - C.band.padTop - ns.h) / 2);

  // 속성 기호
  const eg = icon(scene, x + C.border + (C.w - 2 * C.border) - C.element.right - C.element.size, y + C.element.y, c.element, C.element.size, C.element.size, P.pMute);
  eg.setAlpha(C.element.alpha * rgba(P.pMute).alpha);

  // 초상 홈
  circle(top, x + C.notch.x + C.notch.d / 2, y + C.notch.y + C.notch.d / 2, C.notch.d, { fill: P.paper });
  const fd = C.notch.d - C.notch.inset * 2;
  const fx = x + C.notch.x + C.notch.inset, fy = y + C.notch.y + C.notch.inset;
  // face를 직접 주면 이미 원으로 구운 그림이에요 (해상도는 주는 쪽이 정해요)
  if (c.face) scene.add.image(fx, fy, c.face).setOrigin(0, 0).setDisplaySize(fd, fd);
  else place(scene, top, { t: "image", key: faceKey(c.owner), w: fd, h: fd, round: true }, fx, fy);

  // 수치판 (오른쪽 맞춤)
  const pn = plate(c);
  const ps = size(pn);
  const right = x + C.w - C.border - C.plate.right;
  render(scene, pn, right - ps.w, y + (c.values.length > 1 ? C.plate.yTwo : C.plate.y));

  if (c.mark) {
    const mw = C.mark.padX * 2 + C.mark.icon;
    const mx = x + C.w - C.border - C.mark.right - mw;
    box(top, mx, y + C.mark.y, mw, C.mark.h, C.mark.radius, { fill: P.markBg });
    icon(scene, mx + C.mark.padX, y + C.mark.y + (C.mark.h - C.mark.icon) / 2, c.mark, C.mark.icon, C.mark.icon, P.markInk);
  }
}

/** 희귀도 보석: 먹색 테(-edge) 위에 희귀도 색 몸 */
function drawRarity(scene: Phaser.Scene, rarity: NonNullable<CardVM["rarity"]>, x: number, y: number) {
  const { x: rx, y: ry, size: s } = C.rarity;
  icon(scene, x + rx, y + ry, `rarity-${rarity}-edge`, s, s, P.paperInk);
  icon(scene, x + rx, y + ry, `rarity-${rarity}`, s, s, RARITY_TINT[rarity]);
}

/** 낼 수 있는지를 알리는 것: 비용 동전(마력 부족이면 테)과 조건 미달 자물쇠 꼬리표. 못 내는 카드에서도 흐리지 않아요. */
function drawSignals(scene: Phaser.Scene, c: CardVM, x: number, y: number) {
  const g = scene.add.graphics();
  const cx = x + C.cost.x + C.cost.d / 2, cy = y + C.cost.y + C.cost.d / 2;
  const ringW = c.costShort ? C.cost.shortRing : C.cost.ring;
  circle(g, cx, cy, C.cost.d + ringW * 2, { fill: c.costShort ? P.danger : P.paper });
  circle(g, cx, cy, C.cost.d, { fill: P.mana });
  const costN = text(String(c.cost), T.cardCost, P.manaInk, { lh: 1 });
  const cs = size(costN);
  render(scene, costN, cx - cs.w / 2, cy - cs.h / 2);

  if (c.need) {
    // 조건 미달 (C안): 윗선 가운데 자물쇠 + 필요한 조건 기호. 바깥 테는 종이색 (.lock box-shadow 0 0 0 1.5 paper)
    const L = C.lock;
    const ln: Node = {
      t: "row", h: L.h, pad: [0, L.padX, 0, L.padX], radius: L.radius, gap: L.gap, align: "center", style: { fill: P.whyBg },
      children: [
        { t: "icon", id: "g-lock", w: L.icon, h: L.icon, tint: P.whyInk },
        { t: "icon", id: c.need, w: L.icon, h: L.icon, tint: P.danger },
      ],
    };
    const ls = size(ln);
    // 반 픽셀에 놓이면 가는 기호가 뭉개져요
    const lx = Math.round(x + C.w / 2 - ls.w / 2), ly = y + L.y;
    box(g, lx - L.ring, ly - L.ring, ls.w + L.ring * 2, ls.h + L.ring * 2, L.radius + L.ring, { fill: P.paper });
    render(scene, ln, lx, ly);
  }
}
