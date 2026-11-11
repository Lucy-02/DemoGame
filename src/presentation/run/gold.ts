// 위 띠 골드: 동전 + 지금 값. 바뀔 때는 a→b 또는 +n을 곁들여요.
import type * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import { P, text } from "../spirits/views/parts";
import { render, type Node } from "../style/flex";
import { COPY } from "./copy";
import { GOLD } from "./layout";

const T = tokens.provisional.text.result;

export const GOLD_ICONS = [["i-coin", GOLD.coin]] as const;

export interface GoldLook {
  /** 이번에 받은 만큼 (+18, +?) */
  plus?: string;
  /** 쓰기 전 값: "146→ 96"처럼 앞에 작게 */
  was?: number;
}

export function drawGold(scene: Phaser.Scene, total: number, look: GoldLook = {}) {
  const node: Node = {
    t: "row", h: GOLD.h, gap: GOLD.gap, align: "center",
    children: [
      { t: "icon", id: "i-coin", w: GOLD.coin, h: GOLD.coin, tint: P.gold },
      ...(look.was !== undefined ? [text(`${look.was}${COPY.arrow}`, T.was, P.ink3Spirit)] : []),
      text(String(total), T.gold, P.ink, { lh: 1 }),
      ...(look.plus ? [text(look.plus, T.goldPlus, P.gold)] : []),
    ],
  };
  render(scene, node, GOLD.x, GOLD.y);
}
