// 손패 띠: 유리 띠, 마력 동전, 정령별 카드 묶음, 턴 종료·더미. 정본 .band, .mana, .hand, .grp, .endw
import * as Phaser from "phaser";
import { tokens } from "../../../design/tokens";
import { box, circle } from "../../style/draw";
import { cubicBezier, ms } from "../../style/ease";
import { place, render, size, type Node } from "../../style/flex";
import { gather } from "../../style/gather";
import { loadIcon } from "../../style/icons";
import { drawCardBubble } from "../../card/CardBubble";
import { createHandCard, preloadHandCard, type HandCardView } from "../../card/HandCard";
import { BUBBLE, HAND_CARD } from "../../card/layout";
import type { CardVM } from "../../card/viewmodel";
import { COPY } from "../copy";
import { BAND, END, FRAME, HAND, HOVER, MANA } from "../layout";
import type { BattleVM } from "../viewmodel";
import { faceKey } from "../../faces";

const P = tokens.provisional.palette;
const T = tokens.provisional.text.battle;
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

export interface HandView {
  /** 카드 위에 포인터가 있으면 그 카드 key, 없으면 null. instant면 움직임 없이 바로 */
  setHover(key: string | null, instant?: boolean): void;
}

const ease = cubicBezier(tokens.provisional.motion.hover.easing);
const duration = ms(tokens.provisional.motion.hover.duration);

/** onHover: 호버한 카드가 바뀔 때 (필드 쪽 호버 표시를 끄고 켜려고) */
export function createHand(scene: Phaser.Scene, hand: BattleVM["hand"], onHover?: (key: string | null) => void): HandView {
  const { group: G, face: F } = HAND;
  const groups: { root: Phaser.GameObjects.Container; face: Phaser.GameObjects.GameObject[]; cards: { vm: CardVM; view: HandCardView; x: number; y: number }[] }[] = [];
  let x = HAND.x;
  for (const grp of hand) {
    const n = grp.cards.length;
    const w = G.pad * 2 + n * HAND_CARD.w + (n - 1) * G.gap;
    const h = G.pad * 2 + HAND_CARD.h;
    const cards: (typeof groups)[number]["cards"] = [];
    let face: Phaser.GameObjects.GameObject[] = [];
    const gx = x;
    const root = gather(scene, 0, 0, () => {
      box(scene.add.graphics(), gx, HAND.y, w, h, G.radius, { fill: P.groupFill, ring: { width: G.ring, color: P.groupLine } });
      grp.cards.forEach((c, i) => {
        const view = createHandCard(scene, c, gx + G.pad + i * (HAND_CARD.w + G.gap), HAND.y + G.pad);
        cards.push({ vm: c, view, x: view.root.x, y: view.root.y });
      });
      // 얼굴은 카드 위에 (z-index 3)
      const before = new Set(scene.children.list);
      place(scene, scene.add.graphics(), { t: "image", key: faceKey(grp.owner), w: F.d, h: F.d, round: true, outline: { width: F.ring, color: P.groupFaceRing } },
        gx + w / 2 - F.d / 2, HAND.y + F.top);
      face = scene.children.list.filter((o) => !before.has(o));
    });
    groups.push({ root, face, cards });
    x += w + HAND.gap;
  }

  let bubble: Phaser.GameObjects.Container | null = null;
  let current: string | null = null;
  const to = (target: object, props: Record<string, number>, instant: boolean) => {
    scene.tweens.killTweensOf(target);
    if (instant) Object.assign(target, props);
    else scene.tweens.add({ targets: target, ...props, duration, ease });
  };

  const setHover = (key: string | null, instant = false) => {
    if (key === current) return;
    current = key;
    onHover?.(key);
    const gi = groups.findIndex((g) => g.cards.some((c) => c.vm.key === key));
    groups.forEach((g, i) => {
      to(g.root, { x: gi < 0 || i === gi ? 0 : i < gi ? -HOVER.shiftGroup : HOVER.shiftGroup }, instant);
      const ci = g.cards.findIndex((c) => c.vm.key === key);
      g.cards.forEach((c, j) => {
        const on = j === ci;
        c.view.setLifted(on);
        to(c.view.root, {
          x: c.x + (i !== gi || on ? 0 : j < ci ? -HOVER.shiftIn : HOVER.shiftIn),
          y: c.y - (on ? HOVER.lift : 0),
          scale: on ? HOVER.scale : 1,
        }, instant);
        to(c.view, { opacity: gi < 0 || on ? 1 : HOVER.dim }, instant);
      });
      // 든 카드는 얼굴·옆 카드 위로, 내려놓으면 얼굴이 다시 위로
      if (ci >= 0) g.root.bringToTop(g.cards[ci].view.root);
      else g.face.forEach((o) => g.root.bringToTop(o));
    });

    const old = bubble;
    bubble = null;
    if (old) { scene.tweens.killTweensOf(old); old.destroy(); }
    if (gi < 0) return;
    scene.children.bringToTop(groups[gi].root);
    const card = groups[gi].cards.find((c) => c.vm.key === key)!;
    // 말풍선은 든 카드의 쉬는 자리 가운데를 가리켜요 (옆 카드 밀림 전 기준, 정본 offsetLeft와 같음)
    const cx = card.x;
    const left = Math.max(HOVER.edge, Math.min(FRAME.w - HOVER.edge - BUBBLE.w, cx - BUBBLE.w / 2));
    bubble = drawCardBubble(scene, card.vm.detail, left, HOVER.bubbleBottom, cx - left);
    if (!instant) {
      const y = bubble.y;
      bubble.setAlpha(0).setY(y + BUBBLE.enterY);
      scene.tweens.add({ targets: bubble, alpha: 1, y, duration, ease });
    }
  };

  // 포인터: 카드에 들어가면 그 카드, 손패 밖으로 나가면 쉬는 상태. 카드 사이 틈에서 깜빡이지 않게 한 틱 늦춰요.
  let leave: Phaser.Time.TimerEvent | null = null;
  for (const g of groups) {
    for (const c of g.cards) {
      c.view.root.setInteractive(new Phaser.Geom.Rectangle(-HAND_CARD.w / 2, -HAND_CARD.h, HAND_CARD.w, HAND_CARD.h), Phaser.Geom.Rectangle.Contains);
      c.view.root.on("pointerover", () => { leave?.remove(); leave = null; setHover(c.vm.key); });
      c.view.root.on("pointerout", () => { leave?.remove(); leave = scene.time.delayedCall(1, () => setHover(null)); });
    }
  }
  return { setHover };
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
