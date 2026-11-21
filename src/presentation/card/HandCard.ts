// 작은 얼굴 (손패 · 덱 보기, 90×126). 0161 카드 라운드 K2 L1: 그림이 카드 전체, 아래 어두운 띠에 수치 + 이름.
// 못 내는 카드는 몸(그림·이름·수치)에만 회색 필터를 걸고, 비용 동전과 표지는 그 위에 또렷하게 그려요 (0043).
import type * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import { render, size, type Node } from "../style/flex";
import { gather } from "../style/gather";
import { adjustColor, opacityOf } from "../style/opacity";
import { placeholderArt } from "../style/placeholder";
import { shadowTexture } from "../style/shadow";
import { px } from "../style/text";
import { preloadCardArt } from "./art";
import { cardFaceTexture } from "./artTexture";
import { bigCardIcons } from "./BigCard";
import { BIG_CARD, HAND_CARD as C } from "./layout";
import { drawCost, heldOutlineTexture, loadIcons, sharpen, text, valuesRow } from "./parts";
import type { CardVM } from "./viewmodel";

export { noFace } from "./parts";

const P = tokens.provisional.palette;
const T = tokens.provisional.text.battle;
const UNPLAYABLE = tokens.provisional.effect.unplayable;
const UP_ICON = "g-up";
const LOCK_ICON = "g-lock";

export interface HandCardOptions {
  /** 카드를 이 배율로 키워 놓아요. 그림 · 글자 · 기호는 그 크기로 다시 그려서 흐려지지 않아요. preload에도 같은 값을 주세요 */
  scale?: number;
  /** 강화한 카드에 화살 기호를 붙여요 (덱 보기 · 휴식. 손패 · 보상 · 상점은 안 붙여요, 0161) */
  showUpgraded?: boolean;
}

/** 작은 얼굴과, 가리키면 뜨는 큰 얼굴의 기호를 불러 둬요 */
export function preloadHandCard(scene: Phaser.Scene, c: CardVM, opts: Pick<HandCardOptions, "scale"> = {}) {
  const icons: [string, number][] = [...c.values.map((v): [string, number] => [v.icon, C.value.icon]), [UP_ICON, C.value.up]];
  if (c.mark) icons.push([c.mark, C.mark.icon]);
  if (c.need) icons.push([LOCK_ICON, C.mark.icon], [c.need, C.mark.icon]);
  loadIcons(scene, icons, [opts.scale ?? 1]);
  loadIcons(scene, bigCardIcons(c), [BIG_CARD.peek.scale]);
  if (c.illustration) preloadCardArt(scene, c.illustration);
}

export interface HandCardView {
  /** 원점 = 카드 아래 가운데 */
  root: Phaser.GameObjects.Container;
  /** 들린 상태: 그림자 */
  setLifted(on: boolean): void;
  /** 집은 상태: 바깥 테 */
  setHeld(on: boolean): void;
  /** 카드 전체 불투명도 (CSS opacity처럼 다 그린 뒤 한 번에). 1이면 필터를 꺼서 글자가 선명해요 */
  opacity: number;
}

/** (x, y) = 쉬는 자리의 카드 바깥 왼쪽 위 */
export function createHandCard(scene: Phaser.Scene, c: CardVM, x: number, y: number, opts: HandCardOptions = {}): HandCardView {
  const scale = opts.scale ?? 1;
  let shadow!: Phaser.GameObjects.Image;
  const root = gather(scene, x + C.w / 2, y + C.h, () => {
    const sh = shadowTexture(scene, C.w, C.h, C.radius, { ...C.liftShadow, color: P.cardLiftShadow });
    shadow = scene.add.image(-C.w / 2 - sh.margin, -C.h - sh.margin, sh.key).setOrigin(0, 0).setVisible(false);
    const body = gather(scene, 0, 0, () => drawBody(scene, c, -C.w / 2, -C.h, scale, !!opts.showUpgraded));
    if (c.off) adjustColor(body, UNPLAYABLE);
    drawCost(scene, c, -C.w / 2, -C.h, C.cost);
    drawMarks(scene, c, -C.w / 2, -C.h);
  });
  const m = C.held.offset + C.held.width;
  const held = scene.add.image(-C.w / 2 - m, -C.h - m, heldOutlineTexture(scene, C.w, C.h, C.radius)).setOrigin(0, 0).setVisible(false);
  root.add(held);
  if (scale !== 1) {
    sharpen(scene, root, scale);
    root.setScale(scale);
  }
  const fade = opacityOf(root);
  return {
    root,
    setLifted: (on) => shadow.setVisible(on),
    setHeld: (on) => held.setVisible(on),
    get opacity() { return fade.value; },
    set opacity(v: number) { fade.value = v; },
  };
}

/** 카드 몸: 그림 + 띠, 수치 줄, 이름. (x, y) = 카드 바깥 왼쪽 위 */
function drawBody(scene: Phaser.Scene, c: CardVM, x: number, y: number, scale: number, showUpgraded: boolean) {
  const up = showUpgraded && !!c.upgraded;
  const bandH = c.values.length ? C.band.h : C.band.hName;
  const key = cardFaceTexture(scene, { ...C, band: { h: bandH, fade: C.band.fade } }, c.illustration, scale);
  scene.add.image(x, y, key).setOrigin(0, 0).setDisplaySize(C.w, C.h);
  if (!c.illustration) {
    const a = C.art.placeholder;
    placeholderArt(scene, x + (C.w - a) / 2, y + (C.h - bandH - a) / 2, a, a, P.ink3);
  }
  const upIcon: Node = { t: "icon", id: UP_ICON, w: C.value.up, h: C.value.up, tint: P.accHi };
  const name = text(c.name, T.cardName, P.ink, { ls: px(T.cardName) * C.nameLetterSpacing, lh: C.band.nameLh });
  const col: Node = {
    t: "col", w: C.w, align: "center", gap: C.band.gap,
    children: [
      ...(c.values.length ? [{ t: "row", align: "center", gap: C.value.gap, children: [valuesRow(c.values, T.cardValue, C.value), ...(up ? [upIcon] : [])] } as Node] : []),
      // 수치가 없는 카드는 강화 화살이 이름 옆에 붙어요
      up && !c.values.length ? { t: "row", align: "center", gap: C.value.gap, children: [name, upIcon] } : name,
    ],
  };
  render(scene, col, x, y + C.h - C.band.padBottom - size(col).h);
}

/** 표지: 조건 미달 자물쇠(필요한 조건 기호와 함께, 붉은 테) · 무작위 같은 표식. 오른쪽 위에서 아래로. 못 내는 카드에서도 흐리지 않아요 */
function drawMarks(scene: Phaser.Scene, c: CardVM, x: number, y: number) {
  const M = C.mark;
  const pill = (icons: [string, string][], lock: boolean): Node => ({
    t: "row", h: M.h, pad: [0, lock ? M.lockPadX : M.padX, 0, lock ? M.lockPadX : M.padX], radius: M.h / 2, gap: M.gap, align: "center", justify: "center",
    style: { fill: P.markBg, ...(lock ? { ring: { width: M.ring, color: P.danger } } : {}) },
    children: icons.map(([id, tint]): Node => ({ t: "icon", id, w: M.icon, h: M.icon, tint })),
  });
  const pills: Node[] = [];
  if (c.need) pills.push(pill([[LOCK_ICON, P.markInk], [c.need, P.danger]], true));
  if (c.mark) pills.push(pill([[c.mark, P.markInk]], false));
  if (!pills.length) return;
  const col: Node = { t: "col", align: "end", gap: M.between, children: pills };
  render(scene, col, Math.round(x + C.w - M.right - size(col).w), y + M.y);
}
