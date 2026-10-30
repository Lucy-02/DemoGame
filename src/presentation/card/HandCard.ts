// 손패 크기 카드 (.cd.h 92×129). 정본 frame-old.css "카드" + r5.css "카드: ▲ 성장, 사용 불가, 꼬리표"
import type * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import { rgba } from "../style/color";
import { box, circle } from "../style/draw";
import { place, render, size, type Node } from "../style/flex";
import { gather } from "../style/gather";
import { icon, loadIcon } from "../style/icons";
import { opacityOf } from "../style/opacity";
import { placeholderArt } from "../style/placeholder";
import { shadowTexture } from "../style/shadow";
import { px } from "../style/text";
import { faceKey } from "../faces";
import { HAND_CARD as C } from "./layout";
import { bandTexture, liftedBodyTexture, windowTexture } from "./materials";
import type { CardVM } from "./viewmodel";

const P = tokens.provisional.palette;
const T = tokens.provisional.text.battle;
const UP_MARK = "▲";

export function preloadHandCard(scene: Phaser.Scene, c: CardVM) {
  loadIcon(scene, c.element, C.element.size);
  const two = c.values.length > 1;
  for (const v of c.values) loadIcon(scene, v.icon, two ? C.glyph.sizeTwo : C.glyph.size);
  if (c.mark) loadIcon(scene, c.mark, C.mark.icon);
}

const text = (t: string, sz: string, color: string, extra: Partial<Node> = {}): Node =>
  ({ t: "text", text: t, size: sz, color, ...extra }) as Node;

function plate(c: CardVM): Node {
  const two = c.values.length > 1;
  const ink = c.off ? P.cardOffInk : P.paperInk;
  const g = two ? C.glyph.sizeTwo : C.glyph.size;
  return {
    t: "col", pad: C.plate.pad, gap: C.plate.gap, radius: C.plate.radius, align: "end",
    style: { fill: c.off ? P.cardOff : P.paper },
    children: c.values.map((v): Node => ({
      t: "row", align: "center",
      children: [
        { t: "icon", id: v.icon, w: g, h: g, tint: P.pMute, mr: C.glyph.mr },
        text(String(v.n), two ? T.cardValueTwo : T.cardValue, ink, { lh: 1 }),
        ...(v.mult ? [text(`×${v.mult}`, T.cardMult, ink, { self: "end" })] : []),
        ...(v.up ? [text(UP_MARK, T.cardUp, c.off ? P.upOff : P.up, { lh: 1, self: "start", ml: C.up.ml, mt: C.up.mt })] : []),
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
export function createHandCard(scene: Phaser.Scene, c: CardVM, x: number, y: number): HandCardView {
  const lifted: (Phaser.GameObjects.Image)[] = [];
  const root = gather(scene, x + C.w / 2, y + C.h, () => {
    const sh = shadowTexture(scene, C.w, C.h, C.radius, { ...C.liftShadow, color: P.cardLiftShadow });
    lifted.push(scene.add.image(-C.w / 2 - sh.margin, -C.h - sh.margin, sh.key).setOrigin(0, 0));
    drawHandCard(scene, c, -C.w / 2, -C.h, (img) => lifted.push(img));
  });
  const m = C.held.offset + C.held.width;
  const held = scene.add.image(-C.w / 2 - m, -C.h - m, heldOutlineTexture(scene)).setOrigin(0, 0).setVisible(false);
  root.add(held);
  const setLifted = (on: boolean) => lifted.forEach((o) => o.setVisible(on));
  const setHeld = (on: boolean) => held.setVisible(on);
  setLifted(false);
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

/** (x, y) = 카드 바깥 왼쪽 위. onLifted: 들린 상태에만 보일 몸 그림을 넘겨받아요. */
function drawHandCard(
  scene: Phaser.Scene, c: CardVM, x: number, y: number, onLifted: (img: Phaser.GameObjects.Image) => void,
) {
  const g = scene.add.graphics();
  const off = !!c.off;
  box(g, x, y, C.w, C.h, C.radius, {
    fill: off ? P.cardOff : P.paper,
    ring: { width: C.border, color: off ? P.cardOffLine : P.cardLine },
  });
  onLifted(scene.add.image(x, y, liftedBodyTexture(scene, c.material, off)).setOrigin(0, 0));
  scene.add.image(x + C.win.x, y + C.win.y, windowTexture(scene, c.owner, off)).setOrigin(0, 0);
  const art = placeholderArt(
    scene, x + C.win.x + (C.win.contentW - C.art.size) / 2, y + C.win.y + (C.win.h - C.art.size - C.art.mb) / 2,
    C.art.size, C.art.size, P.art,
  );
  if (off) art.setAlpha(0.45);
  scene.add.image(x + C.band.x, y + C.band.y, bandTexture(scene, c.material, off)).setOrigin(0, 0);
  // 비용·홈·꼬리표는 그림 창 위에 (z-index 1~2)
  const top = scene.add.graphics();

  // 이름 (띠 가운데, 위 여백 2)
  const nameNode = text(c.name, T.cardName, off ? P.cardOffInk : P.paperInk, { ls: px(T.cardName) * C.nameLetterSpacing });
  const ns = size(nameNode);
  render(scene, nameNode, x + C.band.x + (C.band.w - ns.w) / 2, y + C.band.y + C.band.padTop + (C.band.h - C.band.padTop - ns.h) / 2);

  // 비용 동전 (바깥 테)
  const cx = x + C.cost.x + C.cost.d / 2, cy = y + C.cost.y + C.cost.d / 2;
  const ringW = c.costShort ? C.cost.shortRing : C.cost.ring;
  circle(top, cx, cy, C.cost.d + ringW * 2, { fill: c.costShort ? P.danger : off ? P.off : P.paper });
  circle(top, cx, cy, C.cost.d, { fill: P.mana });
  const costN = text(String(c.cost), T.cardCost, P.manaInk, { lh: 1 });
  const cs = size(costN);
  render(scene, costN, cx - cs.w / 2, cy - cs.h / 2);

  // 속성 기호
  const eg = icon(scene, x + C.border + (C.w - 2 * C.border) - C.element.right - C.element.size, y + C.element.y, c.element, C.element.size, C.element.size, P.pMute);
  eg.setAlpha(C.element.alpha * rgba(P.pMute).alpha);

  // 초상 홈
  circle(top, x + C.notch.x + C.notch.d / 2, y + C.notch.y + C.notch.d / 2, C.notch.d, { fill: off ? P.cardOff : P.paper });
  const fd = C.notch.d - C.notch.inset * 2;
  place(scene, top, { t: "image", key: faceKey(c.owner), w: fd, h: fd, round: true }, x + C.notch.x + C.notch.inset, y + C.notch.y + C.notch.inset);

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
  if (c.why) {
    const wn: Node = {
      t: "row", pad: C.why.pad, radius: C.why.radius, align: "center", style: { fill: P.whyBg },
      children: [text(c.why, T.cardWhy, P.whyInk, { lh: C.why.lh })],
    };
    const ws = size(wn);
    render(scene, wn, x + C.w / 2 - ws.w / 2, y + C.why.y);
  }
  return g;
}
