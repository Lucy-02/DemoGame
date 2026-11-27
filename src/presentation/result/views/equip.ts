// 정예 장비 줄과 공명 줄 (왼쪽 열, 카드 아래. 0051 자리 · 0064 Q2-A 모양 · 0170). 말풍선은 run/equipTip.ts.
import type * as Phaser from "phaser";
import { tokens } from "../../../design/tokens";
import { drawEquipArt, drawPips, drawRarityMark, pipsSize } from "../../run/equip";
import { EQUIP_SLOT } from "../../run/layout";
import { EQUIP_STAT_ICON, EQUIP_TIP_ICONS, equipChip as chip } from "../../run/equipTip";
import { P, text } from "../../spirits/views/parts";
import { withAlpha } from "../../style/color";
import { box } from "../../style/draw";
import { render, size, type Node } from "../../style/flex";
import { COPY } from "../copy";
import { STRIP } from "../layout";
import type { EquipOfferVM } from "../viewmodel";

const T = tokens.provisional.text.result;
export const EQUIP_ICONS = [...Object.values(EQUIP_STAT_ICON).map((id) => [id, STRIP.gain.icon] as const), ...EQUIP_TIP_ICONS];

export { drawEquipTip, type EquipTipAt } from "../../run/equipTip";

type Handlers = { click?: () => void; over?: () => void; out?: () => void };

/** off = 아직 카드 차례 · idle = 고를 수 있음 · picked = 집힌 줄 (정령에게 줄 것) */
export type StripState = "off" | "idle" | "picked";

/** 줄 한 판: 테 · 바탕 · 그림 칸 · 이름. 그림 칸의 왼쪽 위를 돌려줘요. at = 줄의 왼쪽 위와 폭 (왼쪽 열 폭) */
function strip(scene: Phaser.Scene, state: StripState, at: { x: number; y: number; w: number }, label: Node, handlers: Handlers) {
  const S = { ...STRIP, ...at };
  const g = scene.add.graphics();
  const picked = state === "picked";
  if (picked) {
    const o = S.hot.outer;
    box(g, S.x - o, S.y - o, S.w + o * 2, S.h + o * 2, S.radius + o, { ring: { width: o, color: withAlpha(P.accHi, S.hot.alpha) } });
  }
  box(g, S.x, S.y, S.w, S.h, S.radius, { fill: state === "off" ? withAlpha(P.glass, S.off) : P.glass, ring: { width: 1, color: picked ? P.accHi : P.glassLine } });
  const tx = S.x + S.padL, ty = S.y + (S.h - S.tile.size) / 2;
  box(g, tx, ty, S.tile.size, S.tile.size, S.tile.radius, { fill: P.veil["05"], ring: { width: 1, color: P.veil["20"] } });
  render(scene, label, tx + S.tile.size + S.gap, S.y + (S.h - size(label).h) / 2);
  const zone = scene.add.zone(S.x, S.y, S.w, S.h).setOrigin(0, 0).setInteractive({ useHandCursor: !!handlers.click });
  if (handlers.over) zone.on("pointerover", handlers.over);
  if (handlers.out) zone.on("pointerout", handlers.out);
  if (handlers.click) zone.on("pointerup", handlers.click);
  return { x: tx, y: ty };
}

/** 새 장비 줄 */
export function drawEquipStrip(scene: Phaser.Scene, offer: EquipOfferVM, state: StripState, at: { x: number; y: number; w: number }, handlers: Handlers) {
  const S = STRIP;
  const tile = strip(scene, state, at, {
    t: "col", gap: S.textGap,
    children: offer.item.name
      ? [text(offer.item.name, T.equipName, P.ink), text(offer.item.rarityName, T.equipMeta, P.ink3)]
      : [text(offer.item.rarityName, T.equipName, P.ink)],
  }, handlers);
  const art = S.tile.size - S.tile.inset * 2;
  drawEquipArt(scene, offer.item.id, tile.x + S.tile.inset, tile.y + S.tile.inset, art, art);
  drawRarityMark(scene.add.graphics(), offer.item.rarity, tile.x - 5, tile.y - 5);
  const gain: Node = {
    t: "row", gap: S.gain.between, align: "center",
    children: offer.gain.map((c) => chip(c, T.stat, S.gain.icon, S.gain.gap)),
  };
  const gs = size(gain);
  render(scene, gain, at.x + at.w - S.padR - gs.w, at.y + (S.h - gs.h) / 2);
}

/** 공명 줄 (0170 · 라운드 H3): 새 장비와 같은 무게의 물건. 그림 칸에는 한 칸 오르는 공명 점 */
export function drawRaiseStrip(scene: Phaser.Scene, state: StripState, at: { x: number; y: number; w: number }, handlers: Handlers) {
  const S = STRIP, D = S.dots;
  const tile = strip(scene, state, at, text(COPY.raise, T.equipName, P.ink), handlers);
  const pips = { resonance: 2, cap: 3, fresh: true };
  drawPips(scene.add.graphics(), pips, tile.x + (S.tile.size - D.d) / 2, tile.y + (S.tile.size - pipsSize(pips.cap, D)) / 2, { ...D, offLine: EQUIP_SLOT.pip.offLine }, true);
}
