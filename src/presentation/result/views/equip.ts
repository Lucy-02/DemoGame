// 정예 장비 줄 (왼쪽 열, 카드 아래. 0051 자리 · 0064 Q2-A 모양). 말풍선은 run/equipTip.ts.
import type * as Phaser from "phaser";
import { tokens } from "../../../design/tokens";
import { drawEquipArt, drawRarityMark } from "../../run/equip";
import { EQUIP_STAT_ICON, EQUIP_TIP_ICONS, equipChip as chip } from "../../run/equipTip";
import { P, text } from "../../spirits/views/parts";
import { withAlpha } from "../../style/color";
import { box } from "../../style/draw";
import { render, size, type Node } from "../../style/flex";
import { STRIP } from "../layout";
import type { EquipOfferVM } from "../viewmodel";

const T = tokens.provisional.text.result;
export const EQUIP_ICONS = [...Object.values(EQUIP_STAT_ICON).map((id) => [id, STRIP.gain.icon] as const), ...EQUIP_TIP_ICONS];

export { drawEquipTip, type EquipTipAt } from "../../run/equipTip";

type Handlers = { click?: () => void; over?: () => void; out?: () => void };

/** 장비 줄. on = 지금 장비를 고를 차례 (카드를 받거나 넘긴 뒤) */
export function drawEquipStrip(scene: Phaser.Scene, offer: EquipOfferVM, on: boolean, handlers: Handlers) {
  const S = STRIP;
  const g = scene.add.graphics();
  if (on) {
    const o = S.hot.outer;
    box(g, S.x - o, S.y - o, S.w + o * 2, S.h + o * 2, S.radius + o, { ring: { width: o, color: withAlpha(P.accHi, S.hot.alpha) } });
  }
  box(g, S.x, S.y, S.w, S.h, S.radius, { fill: on ? P.glass : withAlpha(P.glass, S.off), ring: { width: 1, color: on ? P.accHi : P.glassLine } });
  const tx = S.x + S.padL, ty = S.y + (S.h - S.tile.size) / 2;
  box(g, tx, ty, S.tile.size, S.tile.size, S.tile.radius, { fill: P.veil["05"], ring: { width: 1, color: P.veil["20"] } });
  const art = S.tile.size - S.tile.inset * 2;
  drawEquipArt(scene, offer.item.id, tx + S.tile.inset, ty + S.tile.inset, art, art);
  drawRarityMark(scene.add.graphics(), offer.item.rarity, tx - 5, ty - 5);
  const label: Node = {
    t: "col", gap: S.textGap,
    children: offer.item.name
      ? [text(offer.item.name, T.equipName, P.ink), text(offer.item.rarityName, T.equipMeta, P.ink3)]
      : [text(offer.item.rarityName, T.equipName, P.ink)],
  };
  render(scene, label, tx + S.tile.size + S.gap, S.y + (S.h - size(label).h) / 2);
  const gain: Node = {
    t: "row", gap: S.gain.between, align: "center",
    children: offer.gain.map((c) => chip(c, T.stat, S.gain.icon, S.gain.gap)),
  };
  const gs = size(gain);
  render(scene, gain, S.x + S.w - S.padR - gs.w, S.y + (S.h - gs.h) / 2);
  const zone = scene.add.zone(S.x, S.y, S.w, S.h).setOrigin(0, 0).setInteractive();
  if (handlers.over) zone.on("pointerover", handlers.over);
  if (handlers.out) zone.on("pointerout", handlers.out);
}

