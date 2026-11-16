// 빼기 (P1 f4): 고른 카드의 − 표식과, 그 줄 아래 취소 · 빼기 확인 줄. 빼기만 위험색 채움이에요(되돌릴 수 없는 한 번).
import type * as Phaser from "phaser";
import { tokens } from "../../../design/tokens";
import { HAND_CARD } from "../../card/layout";
import { P, text } from "../../spirits/views/parts";
import { box, circle } from "../../style/draw";
import { render, type Node } from "../../style/flex";
import { COPY } from "../copy";
import { DECK } from "../layout";

const T = tokens.provisional.text.result;
const C = DECK.confirm;

export const REMOVE_ICONS = [["g-close", C.icon], ["fx-discard", C.icon], ["i-coin", C.coin]] as const;

/** 카드(왼쪽 위 x, y) 오른쪽 위 모서리에 걸친 − 표식 */
export function drawRemoveMark(scene: Phaser.Scene, x: number, y: number) {
  const M = DECK.mark;
  const cx = x + HAND_CARD.w - M.d / 2 + M.dx, cy = y - M.d / 2 + M.dy - M.d / 2;
  const g = scene.add.graphics();
  circle(g, cx, cy, M.d + M.ring * 2, { fill: P.stageLo });
  circle(g, cx, cy, M.d, { fill: P.danger });
  box(g, cx - M.bar.w / 2, cy - M.bar.h / 2, M.bar.w, M.bar.h, M.bar.h / 2, { fill: P.onDanger });
}

/** rowY = 덱 줄의 카드 윗선. 확인 줄은 왼쪽 열 오른쪽 끝에 맞춰요 */
export function drawRemoveConfirm(scene: Phaser.Scene, rowY: number, price: number, on: { cancel: () => void; ok: () => void }) {
  const node: Node = {
    t: "row", gap: C.gap, align: "center",
    children: [
      {
        t: "row", w: C.cancelW, h: C.h, radius: C.radius, gap: C.inner, justify: "center", align: "center",
        style: { fill: P.veil["04"], ring: { width: 1, color: P.glassLine } }, onClick: on.cancel,
        children: [{ t: "icon", id: "g-close", w: C.icon, h: C.icon, tint: P.ink }, text(COPY.cancel, T.was, P.ink)],
      },
      {
        t: "row", w: C.okW, h: C.h, radius: C.radius, gap: C.inner, justify: "center", align: "center",
        style: { fill: P.danger }, onClick: on.ok,
        children: [
          { t: "icon", id: "fx-discard", w: C.icon, h: C.icon, tint: P.onDanger },
          text(COPY.remove, T.was, P.onDanger),
          {
            t: "row", gap: C.coinGap, align: "center",
            children: [{ t: "icon", id: "i-coin", w: C.coin, h: C.coin, tint: P.onDanger }, text(String(price), T.price, P.onDanger)],
          },
        ],
      },
    ],
  };
  render(scene, node, DECK.x + DECK.w - C.cancelW - C.gap - C.okW, rowY + C.dy);
}
