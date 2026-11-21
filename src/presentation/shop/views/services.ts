// 상점 창의 바탕 · 팔린 칸 · 값 · 버튼 줄 (0163: 의미색은 기호와 가리킬 때의 얇은 테에만, 면 채움 없음).
import type * as Phaser from "phaser";
import { tokens } from "../../../design/tokens";
import { P, text } from "../../spirits/views/parts";
import { withAlpha } from "../../style/color";
import { box } from "../../style/draw";
import { render, size, type Node } from "../../style/flex";
import { shadowTexture } from "../../style/shadow";
import { PANEL } from "../../run/layout";
import { COPY } from "../copy";
import { BUTTONS, STOCK, WINDOW } from "../layout";
import type { ServiceVM } from "../viewmodel";

const T = tokens.provisional.text.result;

export const SERVICE_ICONS = [
  ["fx-discard", BUTTONS.icon], ["fx-heal", BUTTONS.icon], ["i-coin", BUTTONS.coin], ["i-coin", STOCK.price.coin], ["g-back", BUTTONS.leave.icon],
] as const;

type Kind = "remove" | "heal";
const LOOK: Record<Kind, { icon: string; color: string; label: string }> = {
  remove: { icon: "fx-discard", color: P.danger, label: COPY.remove },
  heal: { icon: "fx-heal", color: P.ok, label: COPY.heal },
};

export interface Pointer {
  click?: () => void;
  over?: () => void;
  out?: () => void;
}

/** 가운데 창 바탕 (전투 결과 창과 같은 바탕 · 테 · 그림자) */
export function drawWindow(scene: Phaser.Scene) {
  const W = WINDOW, K = PANEL;
  const sh = shadowTexture(scene, W.w, W.h, K.radius, { y: K.shadow.y, blur: K.shadow.blur, color: P.tipShadow });
  scene.add.image(W.x - sh.margin, W.y - sh.margin, sh.key).setOrigin(0, 0);
  box(scene.add.graphics(), W.x, W.y, W.w, W.h, K.radius, { fill: P.floor, ring: { width: K.ring, color: P.glassLine } });
}

/** 팔린 칸: 옅은 테만 남아 자리를 지켜요 */
export function drawSoldSlot(scene: Phaser.Scene, x: number) {
  const S = STOCK;
  box(scene.add.graphics(), x, S.y, S.w, S.h, S.sold.radius, { ring: { width: 1, color: withAlpha(P.ink, S.sold.lineAlpha) } });
}

/** 빼기 · 치료 버튼. 골드가 모자라면 회색에 값만 붉고, 이미 썼으면 값 없이 흐려요 */
export function drawService(scene: Phaser.Scene, kind: Kind, vm: ServiceVM, hover: boolean, on: Pointer = {}) {
  const B = BUTTONS, L = LOOK[kind], at = B[kind];
  const off = !vm.enabled;
  const fade = (c: string) => (vm.used ? withAlpha(c, B.offAlpha) : c);
  const ink = off ? fade(P.ink3Spirit) : P.ink;
  const node: Node = {
    t: "row", w: at.w, h: B.h, radius: B.radius, gap: B.gap, justify: "center", align: "center",
    style: vm.used
      ? { ring: { width: 1, color: P.veil["08"] } }
      : {
        fill: hover ? P.veil["14"] : off ? P.veil["05"] : P.veil["08"],
        ring: hover ? { width: B.hoverRing, color: L.color } : { width: 1, color: P.glassLine },
      },
    children: [
      { t: "icon", id: L.icon, w: B.icon, h: B.icon, tint: off ? ink : L.color },
      text(L.label, T.service, ink, { lh: 1 }),
      ...(vm.used ? [] : [{
        t: "row", gap: B.coinGap, align: "center", ml: B.priceGap,
        children: [
          { t: "icon", id: "i-coin", w: B.coin, h: B.coin, tint: vm.short ? P.danger : off ? ink : P.gold },
          text(String(vm.price), T.servicePrice, vm.short ? P.danger : ink),
        ],
      } satisfies Node]),
    ],
  };
  render(scene, node, at.x, B.y);
  if (off) return;
  const zone = scene.add.zone(at.x, B.y, at.w, B.h).setOrigin(0, 0).setInteractive({ useHandCursor: true });
  if (on.over) zone.on("pointerover", on.over);
  if (on.out) zone.on("pointerout", on.out);
  if (on.click) zone.on("pointerup", on.click);
}

/** 떠나기: 첫 칸 폭의 조용한 버튼 */
export function drawLeave(scene: Phaser.Scene, onClick?: () => void) {
  const B = BUTTONS, at = B.leave;
  const node: Node = {
    t: "row", w: at.w, h: B.h, radius: B.radius, gap: at.gap, justify: "center", align: "center",
    style: { ring: { width: 1, color: P.glassLine } }, onClick,
    children: [{ t: "icon", id: "g-back", w: at.icon, h: at.icon, tint: P.ink3Spirit }, text(COPY.leave, T.button, P.ink2)],
  };
  render(scene, node, at.x, B.y);
}

/** 카드 값: 카드 아래 가운데. 모자라면 붉게 */
export function drawPrice(scene: Phaser.Scene, price: number, affordable: boolean, x: number, alpha = 1) {
  const K = STOCK.price;
  const c = (color: string) => (alpha < 1 ? withAlpha(color, alpha) : color);
  const node: Node = {
    t: "row", h: K.h, gap: K.gap, align: "center",
    children: [
      { t: "icon", id: "i-coin", w: K.coin, h: K.coin, tint: c(affordable ? P.gold : P.danger) },
      text(String(price), T.price, c(affordable ? P.ink : P.danger)),
    ],
  };
  render(scene, node, x + (STOCK.w - size(node).w) / 2, STOCK.y + K.dy);
}
