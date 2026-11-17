// 선택지 판 (정리안 .opt, 휴식 · 이벤트가 같이 써요): 왼쪽 열 폭의 가로 판, 이름(선택지 이름) + 효과 칩 줄.
// 효과는 문장 대신 기호 + 짧은 명사구 칩이에요 (Lucy 2026-11-17). 한 줄에 안 들어가면 칩마다 한 줄.
// 올리면 테가 밝아지고, 고를 수 없는 판은 통째로 흐려져요.
import type * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import { P, text } from "../spirits/views/parts";
import { withAlpha } from "../style/color";
import { box } from "../style/draw";
import { render, size, type Node } from "../style/flex";
import { CHOICE } from "./layout";
import { FX_ICONS, type FxVM } from "./outcomes";

const T = tokens.provisional.text.runScreen;

export const CHOICE_ICONS = FX_ICONS.map((id) => [id, CHOICE.fx.icon] as const);

export interface ChoiceVM {
  label: string;
  /** 효과 칩. 비면 none 글(있을 때)만, 없으면 이름만 */
  fx: FxVM[];
  enabled: boolean;
}

export interface ChoicePointer {
  click: (i: number) => void;
  over: (i: number) => void;
  out: (i: number) => void;
}

function chips(fx: FxVM[], fade: (c: string) => string, width: number): Node {
  const X = CHOICE.fx;
  const one = (f: FxVM): Node => ({
    t: "row", gap: X.gap, align: "center",
    children: [{ t: "icon", id: f.icon, w: X.icon, h: X.icon, tint: fade(f.icon === "i-coin" ? P.gold : P.ink2) }, text(f.text, T.optText, fade(P.ink))],
  });
  const row: Node = { t: "row", gap: X.between, align: "center", children: fx.map(one) };
  return size(row).w <= width ? row : { t: "col", gap: X.gap, children: fx.map(one) };
}

/** 판 묶음. top부터 아래로 쌓고, 마지막 판 아래 끝 y를 돌려줘요 */
export function drawChoices(scene: Phaser.Scene, items: ChoiceVM[], top: number, hot: number | undefined, on: ChoicePointer, none?: string): number {
  const K = CHOICE;
  let y = top;
  items.forEach((c, i) => {
    const fade = (color: string) => (c.enabled ? color : withAlpha(color, K.offAlpha));
    const inner = K.w - K.pad[1] - K.pad[3];
    const node: Node = {
      t: "col", w: K.w, pad: K.pad, gap: K.inner,
      children: [
        text(c.label, T.optLabel, fade(P.ink)),
        ...(c.fx.length ? [chips(c.fx, fade, inner)] : none ? [text(none, T.optText, fade(P.ink3Spirit))] : []),
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
