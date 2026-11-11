// 격자 오른쪽 빼기·치료 칸과 떠나기 버튼 (0050: 의미색은 테·기호에만, 면 채움 없음).
import type * as Phaser from "phaser";
import { tokens } from "../../../design/tokens";
import { P, text } from "../../spirits/views/parts";
import { withAlpha } from "../../style/color";
import { box, circle } from "../../style/draw";
import { render, size, type Node } from "../../style/flex";
import { shadowTexture } from "../../style/shadow";
import { LANE } from "../../run/layout";
import { COPY } from "../copy";
import { LEAVE, SERVICE, STOCK } from "../layout";
import type { ServiceVM } from "../viewmodel";

const T = tokens.provisional.text.result;

export const SERVICE_ICONS = [
  ["fx-discard", SERVICE.icon], ["fx-heal", SERVICE.icon], ["i-coin", SERVICE.price.coin], ["i-coin", STOCK.price.coin], ["g-back", LEAVE.icon],
] as const;

type Kind = "remove" | "heal";
const LOOK: Record<Kind, { icon: string; color: string; label: string; row: number }> = {
  remove: { icon: "fx-discard", color: P.danger, label: COPY.remove, row: 0 },
  heal: { icon: "fx-heal", color: P.ok, label: COPY.heal, row: 1 },
};

export interface Pointer {
  click?: () => void;
  over?: () => void;
  out?: () => void;
}

/** 칸 하나. 쓸 수 없으면 통째로 흐려져요 */
export function drawService(scene: Phaser.Scene, kind: Kind, vm: ServiceVM, hover: boolean, on: Pointer = {}) {
  const S = SERVICE, L = LOOK[kind];
  const x = S.x, y = STOCK.rows[L.row];
  const fade = (c: string) => (vm.enabled ? c : withAlpha(c, S.offAlpha));
  const sh = shadowTexture(scene, S.w, S.h, S.radius, { y: LANE.shadow.y, blur: LANE.shadow.blur, color: withAlpha(P.tipShadow, LANE.shadow.alpha) });
  scene.add.image(x - sh.margin, y - sh.margin, sh.key).setOrigin(0, 0);
  const g = scene.add.graphics();
  box(g, x, y, S.w, S.h, S.radius, { fill: P.glass, ring: { width: 1, color: withAlpha(L.color, hover ? 1 : vm.enabled ? S.lineAlpha : S.lineAlpha * S.offAlpha) } });
  const inset = (S.circle - S.icon) / 2;
  const node: Node = {
    t: "col", w: S.w, gap: S.gap, align: "center",
    children: [
      {
        t: "col", w: S.circle, h: S.circle, pad: [inset, inset, inset, inset],
        children: [{ t: "icon", id: L.icon, w: S.icon, h: S.icon, tint: fade(L.color) }],
      },
      text(L.label, T.service, fade(P.ink), { lh: 1 }),
      {
        t: "row", gap: S.price.gap, align: "center",
        children: [{ t: "icon", id: "i-coin", w: S.price.coin, h: S.price.coin, tint: fade(P.gold) }, text(String(vm.price), T.servicePrice, fade(P.ink))],
      },
    ],
  };
  const top = y + (S.h - size(node).h) / 2;
  circle(g, x + S.w / 2, top + S.circle / 2, S.circle, { ring: { width: S.ring, color: fade(L.color) } });
  render(scene, node, x, top);
  if (!vm.enabled) return;
  const zone = scene.add.zone(x, y, S.w, S.h).setOrigin(0, 0).setInteractive({ useHandCursor: true });
  if (on.over) zone.on("pointerover", on.over);
  if (on.out) zone.on("pointerout", on.out);
  if (on.click) zone.on("pointerup", on.click);
}

/** 카드 값: 카드 아래 가운데. 모자라면 붉게 */
export function drawPrice(scene: Phaser.Scene, price: number, affordable: boolean, x: number, y: number, alpha = 1) {
  const K = STOCK.price;
  const c = (color: string) => (alpha < 1 ? withAlpha(color, alpha) : color);
  const node: Node = {
    t: "row", h: K.h, gap: K.gap, align: "center",
    children: [
      { t: "icon", id: "i-coin", w: K.coin, h: K.coin, tint: c(affordable ? P.gold : P.danger) },
      text(String(price), T.price, c(affordable ? P.ink : P.danger)),
    ],
  };
  render(scene, node, x + (STOCK.w - size(node).w) / 2, y + K.dy);
}

export function drawLeave(scene: Phaser.Scene, onClick: () => void) {
  const B = LEAVE;
  const node: Node = {
    t: "row", w: B.w, h: B.h, radius: B.radius, gap: B.gap, justify: "center", align: "center",
    style: { ring: { width: 1, color: P.glassLine } }, onClick,
    children: [{ t: "icon", id: "g-back", w: B.icon, h: B.icon, tint: P.ink3Spirit }, text(COPY.leave, T.button, P.ink2)],
  };
  render(scene, node, B.x, B.y);
}
