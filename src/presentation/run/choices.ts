// 선택지 판 (정리안 .opt, 휴식 · 이벤트가 같이 써요): 판 폭의 가로 판, 이름(선택지 이름) + 효과 칩 줄.
// 효과는 문장 대신 칩이에요 (Lucy 2026-11-17): HP · 최대 HP는 영향받는 정령 얼굴 + a→b, 나머지는 기호 + 짧은 명사구.
// 한 줄에 안 들어가면 칩마다 한 줄. 올리면 테가 밝아지고, 고를 수 없는 판은 통째로 흐려져요.
import type * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import { faceTexture } from "../spiritArt";
import type { Crop } from "../spirits/artFit";
import { P, text } from "../spirits/views/parts";
import { withAlpha } from "../style/color";
import { box, circle } from "../style/draw";
import { render, size, type Node } from "../style/flex";
import { COPY } from "./copy";
import { CHOICE } from "./layout";
import { FX_ICONS, type FxVM } from "./outcomes";

const T = tokens.provisional.text.runScreen;

export const CHOICE_ICONS = FX_ICONS.map((id) => [id, CHOICE.fx.icon] as const);

/** 정령 하나의 HP(또는 최대 HP) a→b */
export interface FaceFx {
  face?: { key: string; crop: Crop };
  from: number;
  to: number;
  /** 최대 HP: `/a→b` 자두빛 */
  max?: boolean;
}

export interface ChoiceVM {
  label: string;
  /** 칩으로 못 보이는 효과의 풀이 (효과문). 칩이 없을 때 none 글 대신 보여요 */
  note?: string;
  /** 영향받는 정령 얼굴 칩 (앞에 와요) */
  faces?: FaceFx[];
  /** 기호 칩. 칩이 하나도 없으면 none 글(있을 때)만, 없으면 이름만 */
  fx: FxVM[];
  enabled: boolean;
}

export interface ChoicePointer {
  click: (i: number) => void;
  over: (i: number) => void;
  out: (i: number) => void;
}

type Fade = (c: string) => string;

function faceChip(f: FaceFx, fade: Fade, on: boolean): Node {
  const F = CHOICE.face;
  const d = F.d - F.inset * 2;
  return {
    t: "row", gap: F.gap, align: "center",
    children: [
      {
        t: "block", w: F.d, h: F.d,
        draw: (g, x, y) => {
          circle(g, x + F.d / 2, y + F.d / 2, F.d, { fill: P.wall, ring: { width: 1, color: P.glassLine } });
          if (f.face && g.scene.textures.exists(f.face.key)) {
            g.scene.add.image(x + F.inset, y + F.inset, faceTexture(g.scene, f.face, d)).setOrigin(0, 0).setAlpha(on ? 1 : CHOICE.offAlpha);
          }
        },
      },
      {
        t: "row", gap: 0, align: "baseline",
        children: [
          text(`${f.max ? "/" : ""}${f.from}${COPY.arrow}`, T.optText, fade(P.ink3Spirit)),
          text(String(f.to), T.optLabel, fade(f.max ? P.accHi : f.to > f.from ? P.ok : P.danger)),
        ],
      },
    ],
  };
}

function iconChip(f: FxVM, fade: Fade): Node {
  const X = CHOICE.fx;
  return {
    t: "row", gap: X.gap, align: "center",
    children: [{ t: "icon", id: f.icon, w: X.icon, h: X.icon, tint: fade(f.icon === "i-coin" ? P.gold : P.ink2) }, text(f.text, T.optText, fade(P.ink))],
  };
}

function chips(c: ChoiceVM, fade: Fade, width: number): Node {
  const all = [...(c.faces ?? []).map((f) => faceChip(f, fade, c.enabled)), ...c.fx.map((f) => iconChip(f, fade))];
  const row: Node = { t: "row", gap: c.faces?.length ? CHOICE.face.between : CHOICE.fx.between, align: "center", children: all };
  return size(row).w <= width ? row : { t: "col", gap: CHOICE.fx.gap, children: all };
}

function plate(c: ChoiceVM, w: number, none?: string): Node {
  const K = CHOICE;
  const fade: Fade = (color) => (c.enabled ? color : withAlpha(color, K.offAlpha));
  const has = c.fx.length || c.faces?.length;
  return {
    t: "col", w, pad: K.pad, gap: K.inner,
    children: [
      text(c.label, T.optLabel, fade(P.ink)),
      ...(has ? [chips(c, fade, w - K.pad[1] - K.pad[3])]
        : c.note ? [text(c.note, T.optText, fade(P.ink2), { wrap: w - K.pad[1] - K.pad[3], keepAll: true })]
        : none ? [text(none, T.optText, fade(P.ink3Spirit))] : []),
    ],
  };
}

/** 판 묶음의 높이 (판이 내용을 감쌀 때) */
export function choicesHeight(items: ChoiceVM[], w: number, none?: string): number {
  return items.reduce((a, c) => a + size(plate(c, w, none)).h, 0) + (items.length - 1) * CHOICE.gap;
}

const CHOICE_DATA = "choice";

/**
 * 지금 포인터 아래의 선택지 번호 (없으면 undefined).
 * 다시 그리면 판정 영역이 새로 생겨서 벗어남 사건이 안 올 때가 있어요. 화면의 update가 이걸로 가리킴을 맞춰요 (P3-07).
 */
export function choiceUnderPointer(scene: Phaser.Scene): number | undefined {
  const hit = scene.input.hitTestPointer(scene.input.activePointer).find((o) => o.getData(CHOICE_DATA) !== undefined);
  return hit?.getData(CHOICE_DATA) as number | undefined;
}

/** 판 묶음. (x, top)부터 아래로 쌓고, 마지막 판 아래 끝 y를 돌려줘요 */
export function drawChoices(scene: Phaser.Scene, items: ChoiceVM[], at: { x: number; w: number; top: number }, hot: number | undefined, on: ChoicePointer, none?: string): number {
  const K = CHOICE;
  let y = at.top;
  items.forEach((c, i) => {
    const node = plate(c, at.w, none);
    const h = size(node).h;
    const g = scene.add.graphics();
    const lit = hot === i && c.enabled;
    if (lit) box(g, at.x - K.hot.outer, y - K.hot.outer, at.w + K.hot.outer * 2, h + K.hot.outer * 2, K.radius + K.hot.outer, { fill: withAlpha(P.accHi, K.hot.alpha) });
    box(g, at.x, y, at.w, h, K.radius, { fill: P.glass, ring: { width: 1, color: lit ? P.accHi : c.enabled ? P.glassLine : withAlpha(P.glassLine, K.offAlpha) } });
    render(scene, node, at.x, y);
    if (c.enabled) {
      scene.add.zone(at.x, y, at.w, h).setOrigin(0, 0).setData(CHOICE_DATA, i).setInteractive({ useHandCursor: true })
        .on("pointerover", () => on.over(i))
        .on("pointerout", () => on.out(i))
        .on("pointerup", () => on.click(i));
    }
    y += h + K.gap;
  });
  return y - K.gap;
}
