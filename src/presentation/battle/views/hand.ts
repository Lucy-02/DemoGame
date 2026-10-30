// 손패 띠: 유리 띠, 마력 동전, 정령별 카드 묶음, 턴 종료·더미. 정본 .band, .mana, .hand, .grp, .endw
import type * as Phaser from "phaser";
import { tokens } from "../../../design/tokens";
import { box, circle } from "../../style/draw";
import { place, render, size, type Node } from "../../style/flex";
import { loadIcon } from "../../style/icons";
import { drawHandCard, preloadHandCard } from "../../card/HandCard";
import { HAND_CARD } from "../../card/layout";
import { COPY } from "../copy";
import { BAND, END, FRAME, HAND, MANA } from "../layout";
import type { BattleVM } from "../viewmodel";
import { faceKey } from "../../faces";

const P = tokens.palette;
const T = tokens.text.battle;
const PILE_ICONS = ["i-draw", "i-disc", "i-exh"] as const;

const text = (t: string, sz: string, color: string, extra: Partial<Node> = {}): Node =>
  ({ t: "text", text: t, size: sz, color, ...extra }) as Node;

export function preloadHand(scene: Phaser.Scene, vm: BattleVM) {
  for (const grp of vm.hand) grp.cards.forEach((c) => preloadHandCard(scene, c));
  for (const id of PILE_ICONS) loadIcon(scene, id, END.piles.icon);
}

export function drawBand(scene: Phaser.Scene) {
  const g = scene.add.graphics();
  box(g, 0, BAND.top, FRAME.w, FRAME.h - BAND.top, 0, { fill: P.glass });
  box(g, 0, BAND.top, FRAME.w, BAND.line, 0, { fill: P.glassLine });
}

export function drawMana(scene: Phaser.Scene, mana: BattleVM["mana"]) {
  const g = scene.add.graphics();
  const cx = MANA.x + MANA.d / 2, cy = MANA.y + MANA.d / 2;
  circle(g, cx, cy, MANA.d, { fill: P.mana, ring: { width: MANA.ring, color: P.manaLine } });
  const num: Node = {
    t: "row", align: "baseline", w: MANA.d, justify: "center",
    children: [
      text(String(mana.n), T.mana, P.manaInk, { lh: 1 }),
      text(`${COPY.maxPrefix}${mana.max}`, T.manaMax, P.ink3),
    ],
  };
  render(scene, num, MANA.x, MANA.y + MANA.padTop);
  const label = text(COPY.mana, T.manaLabel, P.ink3, { w: MANA.d });
  render(scene, label, MANA.x, MANA.y + MANA.d - MANA.labelBottom - size(label).h);
}

export function drawHand(scene: Phaser.Scene, hand: BattleVM["hand"]) {
  const { group: G, face: F } = HAND;
  let x = HAND.x;
  for (const grp of hand) {
    const n = grp.cards.length;
    const w = G.pad * 2 + n * HAND_CARD.w + (n - 1) * G.gap;
    const h = G.pad * 2 + HAND_CARD.h;
    const g = scene.add.graphics();
    box(g, x, HAND.y, w, h, G.radius, { fill: P.groupFill, ring: { width: G.ring, color: P.groupLine } });
    grp.cards.forEach((c, i) => drawHandCard(scene, c, x + G.pad + i * (HAND_CARD.w + G.gap), HAND.y + G.pad));
    // 얼굴은 카드 위에 (z-index 3)
    const fg = scene.add.graphics();
    place(scene, fg, { t: "image", key: faceKey(grp.owner), w: F.d, h: F.d, round: true, outline: { width: F.ring, color: P.groupFaceRing } },
      x + w / 2 - F.d / 2, HAND.y + F.top);
    x += w + HAND.gap;
  }
}

export function drawEnd(scene: Phaser.Scene, vm: BattleVM) {
  const B = END.button;
  const pile = (id: string, n: number): Node => ({
    t: "row", align: "center", gap: END.piles.gap,
    children: [{ t: "icon", id, w: END.piles.icon, h: END.piles.icon, tint: P.ink3 }, text(String(n), T.pile, P.ink2)],
  });
  const col: Node = {
    t: "col", w: END.w, gap: END.gap, align: "stretch",
    children: [
      {
        t: "row", h: B.h, radius: B.radius, align: "center", justify: "center",
        style: { fill: P.endCalm, ring: { width: B.ring, color: P.endCalmLine } },
        children: [text(COPY.endTurn, T.endTurn, P.ink2)],
      },
      {
        t: "row", align: "baseline", justify: "center",
        children: [text(COPY.playable, T.endSub, P.ink3), text(String(vm.playable), T.endSubNum, P.ink)],
      },
      {
        t: "row", justify: "between", pad: END.piles.pad,
        children: [pile(PILE_ICONS[0], vm.piles.draw), pile(PILE_ICONS[1], vm.piles.discard), pile(PILE_ICONS[2], vm.piles.exhaust)],
      },
    ],
  };
  render(scene, col, END.x, END.y);
}
