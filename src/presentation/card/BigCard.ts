// 큰 얼굴 (가리킬 때 · 보상 · 상점, 172×248). 0159 카드 라운드 K2 L1: 그림이 카드 전체, 아래 유리 판에 이름 줄 · 효과문 · 기호 줄.
// 못 내는(못 사는) 카드는 그림만 회색으로, 유리 판의 글은 그대로 읽혀요.
import type * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import { box, circle } from "../style/draw";
import { place, render, size, type Node } from "../style/flex";
import { gather } from "../style/gather";
import { icon } from "../style/icons";
import { adjustColor, opacityOf } from "../style/opacity";
import { placeholderArt } from "../style/placeholder";
import { shadowTexture } from "../style/shadow";
import { px } from "../style/text";
import { faceKey } from "../faces";
import { paragraph } from "../tooltip/Tooltip";
import type { RoleStyle } from "../tooltip/skins";
import { preloadCardArt } from "./art";
import { cardFaceTexture } from "./artTexture";
import { BIG_CARD as B, BIG_PLATE_H, HAND_CARD } from "./layout";
import { drawCost, heldOutlineTexture, isBlankFace, loadIcons, sharpen, text, valuesRow } from "./parts";
import type { CardVM } from "./viewmodel";

const P = tokens.provisional.palette;
const T = tokens.provisional.text.battle;
const UNPLAYABLE = tokens.provisional.effect.unplayable;
const UP_ICON = "g-up";
const LOCK_ICON = "g-lock";
const MANA_ICON = "fx-mana";
const TEXT: RoleStyle = { size: T.cardBigText, strongSize: T.cardBigStrong, color: P.ink, strongColor: P.ink, lh: B.plate.lineH / px(T.cardBigText) };

export interface BigCardOptions {
  /** 이 배율로 키워 놓아요 (그 크기로 다시 그려요). preload에도 같은 값을 주세요 */
  scale?: number;
  /** 이름 줄 끝에 최종 수치 (전투에서만) */
  values?: boolean;
  /** 못 내는 사유 표지 (전투에서만): 윗선 가운데 */
  why?: boolean;
  /** 떠 있는 카드: 그림자 */
  shadow?: boolean;
}

/** 큰 얼굴이 쓰는 기호 */
export function bigCardIcons(c: CardVM): [string, number][] {
  const F = B.foot.size;
  const icons: [string, number][] = [...c.values.map((v): [string, number] => [v.icon, B.value.icon]), [c.element, F], [UP_ICON, F], [MANA_ICON, B.why.icon]];
  if (c.rarity) icons.push([`rarity-${c.rarity}`, F], [`rarity-${c.rarity}-edge`, F]);
  if (c.role) icons.push([c.role, B.foot.role]);
  if (c.need) icons.push([LOCK_ICON, B.why.icon], [c.need, B.why.icon]);
  return icons;
}

export function preloadBigCard(scene: Phaser.Scene, c: CardVM, opts: Pick<BigCardOptions, "scale"> = {}) {
  loadIcons(scene, bigCardIcons(c), [opts.scale ?? 1]);
  if (c.illustration) preloadCardArt(scene, c.illustration);
}

export interface BigCardView {
  /** 원점 = 카드 아래 가운데 */
  root: Phaser.GameObjects.Container;
  /** 고른 카드: 바깥 테 */
  setHeld(on: boolean): void;
  opacity: number;
}

/** (x, y) = 카드 바깥 왼쪽 위 (키우기 전 크기 기준으로 아래 가운데가 원점) */
export function createBigCard(scene: Phaser.Scene, c: CardVM, x: number, y: number, opts: BigCardOptions = {}): BigCardView {
  const scale = opts.scale ?? 1;
  const ox = -B.w / 2, oy = -B.h;
  const root = gather(scene, x + B.w / 2, y + B.h, () => {
    if (opts.shadow) {
      const sh = shadowTexture(scene, B.w, B.h, B.radius, { ...B.shadow, color: P.cardLiftShadow });
      scene.add.image(ox - sh.margin, oy - sh.margin, sh.key).setOrigin(0, 0);
    }
    const art = gather(scene, 0, 0, () => {
      scene.add.image(ox, oy, cardFaceTexture(scene, B, c.illustration, scale)).setOrigin(0, 0).setDisplaySize(B.w, B.h);
      if (!c.illustration) {
        const a = B.art.placeholder;
        placeholderArt(scene, ox + (B.w - a) / 2, oy + (B.h - BIG_PLATE_H - a) / 2, a, a, P.ink3);
      }
    });
    if (c.off) adjustColor(art, UNPLAYABLE);
    drawPlate(scene, c, ox, oy, !!opts.values);
    drawCost(scene, c, ox, oy, B.cost);
    if (opts.why) drawWhy(scene, c, ox, oy);
  });
  const m = HAND_CARD.held.offset + HAND_CARD.held.width;
  const held = scene.add.image(ox - m, oy - m, heldOutlineTexture(scene, B.w, B.h, B.radius)).setOrigin(0, 0).setVisible(false);
  root.add(held);
  if (scale !== 1) {
    sharpen(scene, root, scale);
    root.setScale(scale);
  }
  const fade = opacityOf(root);
  return {
    root,
    setHeld: (on) => held.setVisible(on),
    get opacity() { return fade.value; },
    set opacity(v: number) { fade.value = v; },
  };
}

/** 유리 판: 이름 줄(+ 수치) · 효과문 · 기호 줄. 효과문이 네 줄을 넘으면 판이 위로 자라요 */
function drawPlate(scene: Phaser.Scene, c: CardVM, x: number, y: number, values: boolean) {
  const L = B.plate;
  const [pt, pr, pb, pl] = L.pad;
  const w = B.w - L.inset * 2, inner = w - pl - pr;
  const body = paragraph(c.detail.text, TEXT, inner, B.termOffset, true);
  const textH = Math.max(L.lines * L.lineH, body.h);
  const h = BIG_PLATE_H - L.lines * L.lineH + textH;
  const left = x + L.inset, top = y + B.h - L.inset - h;
  box(scene.add.graphics(), left, top, w, h, L.radius, { fill: P.glassD, ring: { width: L.ring, color: P.veil["20"] } });

  const head: Node = {
    t: "row", w: inner, h: L.headH, align: "center", justify: "between",
    children: [
      text(c.name, T.cardBigName, P.ink, { bold: true, ls: px(T.cardBigName) * HAND_CARD.nameLetterSpacing }),
      ...(values && c.values.length ? [valuesRow(c.values, T.cardBigValue, B.value)] : []),
    ],
  };
  render(scene, head, left + pl, top + pt);
  body.draw(scene, left + pl, top + pt + L.headH + L.headGap);
  drawFoot(scene, c, left + pl, top + h - pb - L.footH);
}

/** 기호 줄: 주인 얼굴 · 속성 · 희귀도 보석 · 강화 화살 */
function drawFoot(scene: Phaser.Scene, c: CardVM, x: number, y: number) {
  const F = B.foot;
  let cx = x;
  const next = () => { const at = cx; cx += F.size + F.gap; return at; };
  const g = scene.add.graphics();
  // face를 직접 주면 이미 원으로 구운 그림이에요. 얼굴 그림이 없으면 빈 원 + 주인의 역할 기호, 주인이 없으면 얼굴 칸을 비워요 (0153)
  if (c.face && isBlankFace(scene, c.face)) {
    if (c.role) {
      const fx = next();
      circle(g, fx + F.size / 2, y + F.size / 2, F.size, { fill: P.face });
      icon(scene, fx + (F.size - F.role) / 2, y + (F.size - F.role) / 2, c.role, F.role, F.role, P.ink2);
    }
  } else if (c.face) scene.add.image(next(), y, c.face).setOrigin(0, 0).setDisplaySize(F.size, F.size);
  else place(scene, g, { t: "image", key: faceKey(c.owner), w: F.size, h: F.size, round: true }, next(), y);
  icon(scene, next(), y, c.element, F.size, F.size, P.ink2);
  if (c.rarity) {
    const rx = next();
    icon(scene, rx, y, `rarity-${c.rarity}-edge`, F.size, F.size, P.floor);
    icon(scene, rx, y, `rarity-${c.rarity}`, F.size, F.size, P.rarity[c.rarity]);
  }
  if (c.upgraded) icon(scene, next(), y, UP_ICON, F.size, F.size, P.accHi);
}

/** 못 내는 사유: 윗선 가운데에 걸친 알약. 기호(마력 · 자물쇠 + 필요한 조건) + 사유 글 */
function drawWhy(scene: Phaser.Scene, c: CardVM, x: number, y: number) {
  if (!c.detail.why) return;
  const W = B.why;
  const icons: Node[] = c.need
    ? [{ t: "icon", id: LOCK_ICON, w: W.icon, h: W.icon, tint: P.whyInk }, { t: "icon", id: c.need, w: W.icon, h: W.icon, tint: P.danger }]
    : c.costShort ? [{ t: "icon", id: MANA_ICON, w: W.icon, h: W.icon, tint: P.danger }] : [];
  const pill: Node = {
    t: "row", h: W.h, pad: [0, W.padX, 0, W.padX], radius: W.radius, gap: W.gap, align: "center",
    style: { fill: P.whyBg, ring: { width: W.ring, color: P.veil["20"] } },
    children: [...icons, text(c.detail.why, T.cardWhy, P.whyInk, { bold: true })],
  };
  const s = size(pill);
  render(scene, pill, Math.round(x + B.w / 2 - s.w / 2), y - W.h / 2);
}
