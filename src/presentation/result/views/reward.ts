// 왼쪽 열: 넘기기 · 다시 뽑기 버튼. 골드는 run/gold.ts, 보상 카드는 장면이 카드 컴포넌트로 직접 놓아요.
import type * as Phaser from "phaser";
import { render, size, type Node } from "../../style/flex";
import { P, text } from "../../spirits/views/parts";
import { tokens } from "../../../design/tokens";
import { GLASS } from "../../tooltip/skins";
import { drawTooltip } from "../../tooltip/Tooltip";
import { COPY } from "../copy";
import { REROLL, SKIP } from "../layout";
import { withAlpha } from "../../style/color";
import { strokePlaceholder } from "../../style/placeholder";

const T = tokens.provisional.text.result;

export const REWARD_ICONS = [["i-coin", SKIP.gold.coin]] as const;

type On = { click: () => void; over: () => void; out: () => void };

/** 왼쪽 열 버튼 한 판 (.btn2.b3): 기호 자리 + 동사 + 꼬리. 기호는 아직 없어서 X 상자로 비워 둬요 (TODO_ICON) */
function button(scene: Phaser.Scene, label: (ink: string) => Node[], hover: boolean, at: { x: number; y: number }, on: On, alpha = 1) {
  const S = SKIP;
  const dim = (css: string) => (alpha < 1 ? withAlpha(css, alpha) : css);
  const todo: Node = {
    t: "block", w: S.todo.size, h: S.todo.size,
    draw: (g, x, y, w, h) => strokePlaceholder(g, x, y, w, h, dim(P.gold)),
  };
  const node: Node = {
    t: "row", w: S.w, h: S.h, radius: S.radius, gap: S.gap, justify: "center", align: "center",
    style: { fill: hover ? P.veil["09"] : P.veil["04"], ring: { width: 1, color: dim(hover ? P.veil["50"] : P.veil["20"]) } },
    children: [todo, ...label(dim(P.ink))],
  };
  render(scene, node, at.x, at.y);
  const s = size(node);
  scene.add.zone(at.x, at.y, s.w, s.h).setOrigin(0, 0).setInteractive({ useHandCursor: true })
    .on("pointerover", on.over).on("pointerout", on.out).on("pointerup", on.click);
}

/** 넘기기: 받을 골드가 있으면 버튼 안에 늘 붙어 있어요 (0051) */
export function drawSkip(scene: Phaser.Scene, gold: number | undefined, hover: boolean, at: { x: number; y: number }, on: On) {
  const S = SKIP;
  button(scene, (ink) => [text(COPY.skip, T.button, ink), ...(gold === undefined ? [] : [{
    t: "row", gap: S.gold.gap, ml: S.gold.ml, align: "center",
    children: [
      { t: "icon", id: "i-coin", w: S.gold.coin, h: S.gold.coin, tint: P.gold },
      text(`+${gold}`, T.buttonGold, P.gold),
    ],
  } as Node])], hover, at, on);
}

/** 다시 뽑기 (0171 · 라운드 H1): 넘기기 옆 같은 판, 남은 수가 붙어요. 다 쓰면 흐려진 채 남아요. 가리키면 버튼 위에 풀이가 떠요 */
export function drawReroll(scene: Phaser.Scene, left: number, hover: boolean, at: { x: number; y: number }, on: On) {
  button(scene, (ink) => [text(COPY.reroll, T.button, ink), text(String(left), T.button, ink, { ml: REROLL.countMl })], hover && left > 0, at, on, left > 0 ? 1 : REROLL.off);
  if (!hover) return undefined;
  return () => drawTooltip(scene, {
    skin: GLASS,
    content: [{ kind: "title", text: COPY.reroll }, { kind: "text", role: "body", text: [{ text: COPY.rerollTip }] }],
    at: { left: at.x, bottom: at.y - REROLL.tipGap },
  });
}
