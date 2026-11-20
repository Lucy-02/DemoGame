// 왼쪽 열: 넘기기 버튼. 골드는 run/gold.ts, 보상 카드는 장면이 카드 컴포넌트로 직접 놓아요.
import type * as Phaser from "phaser";
import { render, size, type Node } from "../../style/flex";
import { P, text } from "../../spirits/views/parts";
import { tokens } from "../../../design/tokens";
import { COPY } from "../copy";
import { SKIP } from "../layout";
import { strokePlaceholder } from "../../style/placeholder";

const T = tokens.provisional.text.result;

export const REWARD_ICONS = [["i-coin", SKIP.gold.coin]] as const;

/** 넘기기: 받을 골드가 있으면 버튼 안에 늘 붙어 있어요 (0051). 넘기기 기호는 아직 없어서 X 상자로 비워 둬요 (TODO_ICON) */
export function drawSkip(scene: Phaser.Scene, gold: number | undefined, hover: boolean, at: { x: number; y: number }, on: { click: () => void; over: () => void; out: () => void }) {
  const S = SKIP;
  const todo: Node = {
    t: "block", w: S.todo.size, h: S.todo.size,
    draw: (g, x, y, w, h) => strokePlaceholder(g, x, y, w, h, P.gold),
  };
  const node: Node = {
    t: "row", w: S.w, h: S.h, radius: S.radius, gap: S.gap, justify: "center", align: "center",
    style: { fill: hover ? P.veil["09"] : P.veil["04"], ring: { width: 1, color: hover ? P.veil["50"] : P.veil["20"] } },
    children: [
      todo,
      text(COPY.skip, T.button, P.ink),
      ...(gold === undefined ? [] : [{
        t: "row", gap: S.gold.gap, ml: S.gold.ml, align: "center",
        children: [
          { t: "icon", id: "i-coin", w: S.gold.coin, h: S.gold.coin, tint: P.gold },
          text(`+${gold}`, T.buttonGold, P.gold),
        ],
      } as Node]),
    ],
  };
  render(scene, node, at.x, at.y);
  const s = size(node);
  scene.add.zone(at.x, at.y, s.w, s.h).setOrigin(0, 0).setInteractive({ useHandCursor: true })
    .on("pointerover", on.over).on("pointerout", on.out).on("pointerup", on.click);
}
