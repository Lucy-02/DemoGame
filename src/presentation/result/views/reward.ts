// 왼쪽 열: 골드(위 띠), 넘기기 버튼. 보상 카드는 장면이 카드 컴포넌트로 직접 놓아요.
import type * as Phaser from "phaser";
import { box } from "../../style/draw";
import { render, size, type Node } from "../../style/flex";
import { P, text } from "../../spirits/views/parts";
import { tokens } from "../../../design/tokens";
import { COPY } from "../copy";
import { GOLD, SKIP } from "../layout";

const T = tokens.provisional.text.result;

export const REWARD_ICONS = [["i-coin", GOLD.coin], ["i-coin", SKIP.gold.coin]] as const;

/** 골드: 동전 + 지금 값 + 이번에 받은 만큼. plus가 없으면 숫자만 */
export function drawGold(scene: Phaser.Scene, total: number, plus?: string) {
  const node: Node = {
    t: "row", h: GOLD.h, gap: GOLD.gap, align: "center",
    children: [
      { t: "icon", id: "i-coin", w: GOLD.coin, h: GOLD.coin, tint: P.gold },
      text(String(total), T.gold, P.ink, { lh: 1 }),
      ...(plus ? [text(plus, T.goldPlus, P.gold)] : []),
    ],
  };
  render(scene, node, GOLD.x, GOLD.y);
}

/** 넘기기: 받을 골드가 버튼 안에 늘 붙어 있어요 (0051). 넘기기 기호는 아직 없어서 점선 칸으로 비워 둬요 (TODO_ICON) */
export function drawSkip(scene: Phaser.Scene, gold: number | undefined, hover: boolean, on: { click: () => void; over: () => void; out: () => void }) {
  const S = SKIP;
  const todo: Node = {
    t: "block", w: S.todo.size, h: S.todo.size,
    draw: (g, x, y, w, h) => box(g, x, y, w, h, S.todo.radius, { ring: { width: S.todo.ring, color: P.gold, dash: S.todo.dash } }),
  };
  const node: Node = {
    t: "row", w: S.w, h: S.h, radius: S.radius, gap: S.gap, justify: "center", align: "center",
    style: { fill: hover ? P.veil["09"] : P.veil["04"], ring: { width: 1, color: hover ? P.veil["50"] : P.veil["20"] } },
    children: [
      todo,
      text(COPY.skip, T.button, P.ink),
      {
        t: "row", gap: S.gold.gap, ml: S.gold.ml, align: "center",
        children: [
          { t: "icon", id: "i-coin", w: S.gold.coin, h: S.gold.coin, tint: P.gold },
          text(`+${gold ?? COPY.unknown}`, T.buttonGold, P.gold),
        ],
      },
    ],
  };
  render(scene, node, S.x, S.y);
  const s = size(node);
  scene.add.zone(S.x, S.y, s.w, s.h).setOrigin(0, 0).setInteractive({ useHandCursor: true })
    .on("pointerover", on.over).on("pointerout", on.out).on("pointerup", on.click);
}
