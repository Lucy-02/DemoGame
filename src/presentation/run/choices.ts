// 선택지 판 (정리안 .opt, 휴식 · 이벤트가 같이 써요): 왼쪽 열 폭의 가로 판, 이름(선택지 이름) + 효과문 한두 줄.
// 올리면 테가 밝아지고, 고를 수 없는 판은 통째로 흐려져요.
import type * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import { P, text } from "../spirits/views/parts";
import { withAlpha } from "../style/color";
import { box } from "../style/draw";
import { render, size, type Node } from "../style/flex";
import { CHOICE } from "./layout";

const T = tokens.provisional.text.runScreen;

export interface ChoiceVM {
  label: string;
  /** 효과문 (TEXT_RULES 1절) */
  text: string;
  enabled: boolean;
}

export interface ChoicePointer {
  click: (i: number) => void;
  over: (i: number) => void;
  out: (i: number) => void;
}

/** 판 묶음. top부터 아래로 쌓고, 마지막 판 아래 끝 y를 돌려줘요 */
export function drawChoices(scene: Phaser.Scene, items: ChoiceVM[], top: number, hot: number | undefined, on: ChoicePointer): number {
  const K = CHOICE;
  let y = top;
  items.forEach((c, i) => {
    const fade = (color: string) => (c.enabled ? color : withAlpha(color, K.offAlpha));
    const node: Node = {
      t: "col", w: K.w, pad: K.pad, gap: K.inner,
      children: [
        text(c.label, T.optLabel, fade(P.ink)),
        text(c.text, T.optText, fade(P.ink2), { lh: K.textLh, wrap: K.w - K.pad[1] - K.pad[3], keepAll: true }),
      ],
    };
    const h = size(node).h;
    const g = scene.add.graphics();
    const lit = hot === i && c.enabled;
    if (lit) box(g, K.x - K.hot.outer, y - K.hot.outer, K.w + K.hot.outer * 2, h + K.hot.outer * 2, K.radius + K.hot.outer, { fill: withAlpha(P.accHi, K.hot.alpha) });
    box(g, K.x, y, K.w, h, K.radius, { fill: P.glass, ring: { width: 1, color: lit ? P.accHi : fade(P.glassLine) } });
    render(scene, node, K.x, y);
    if (c.enabled) {
      scene.add.zone(K.x, y, K.w, h).setOrigin(0, 0).setInteractive({ useHandCursor: true })
        .on("pointerover", () => on.over(i))
        .on("pointerout", () => on.out(i))
        .on("pointerup", () => on.click(i));
    }
    y += h + K.gap;
  });
  return y - K.gap;
}
