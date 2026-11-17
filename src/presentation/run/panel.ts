// 이벤트 · 휴식의 왼쪽 판 (Lucy 2026-11-17, 공용 UI 기획 r5): 이름 줄 · 상황 글 · 선택지를 감싸는 판 하나.
// 판은 내용을 감싸고 화면 가운데 높이에 놓여요(오른쪽 얇은 정령 줄과 같은 기준, A). 바탕 · 테 · 그림자는 전투 결과 창과 같아요(막 없이).
import type * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import { P, text } from "../spirits/views/parts";
import { box } from "../style/draw";
import { render, size, type Node } from "../style/flex";
import { shadowTexture } from "../style/shadow";
import { choicesHeight, drawChoices, type ChoicePointer, type ChoiceVM } from "./choices";
import { CHOICE, FRAME, PANEL, STORY } from "./layout";

const T = tokens.provisional.text.runScreen;

export interface StoryPanel {
  /** 이벤트 이름 줄 · 상황 글 (휴식은 없음) */
  title?: string;
  story?: string;
  items: ChoiceVM[];
  hot?: number;
  on: ChoicePointer;
  /** 효과가 없는 선택지의 글 */
  none?: string;
}

export function drawStoryPanel(scene: Phaser.Scene, p: StoryPanel) {
  const K = PANEL;
  const w = K.w - K.pad * 2;
  const head: Node | undefined = p.title ? {
    t: "col", w, gap: STORY.gap,
    children: [
      text(p.title, T.eventName, P.ink, { lh: STORY.titleLh }),
      ...(p.story ? [text(p.story, T.story, P.ink, { lh: STORY.lh, wrap: w, keepAll: true })] : []),
    ],
  } : undefined;
  const headH = head ? size(head).h + CHOICE.gap : 0;
  const innerH = headH + choicesHeight(p.items, w, p.none);
  const win = { x: K.x, y: Math.round((FRAME.h - innerH) / 2) - K.pad, w: K.w, h: innerH + K.pad * 2 };
  const sh = shadowTexture(scene, win.w, win.h, K.radius, { y: K.shadow.y, blur: K.shadow.blur, color: P.tipShadow });
  scene.add.image(win.x - sh.margin, win.y - sh.margin, sh.key).setOrigin(0, 0);
  box(scene.add.graphics(), win.x, win.y, win.w, win.h, K.radius, { fill: P.floor, ring: { width: K.ring, color: P.glassLine } });
  const x = win.x + K.pad, top = win.y + K.pad;
  if (head) render(scene, head, x, top);
  drawChoices(scene, p.items, { x, w, top: top + headH }, p.hot, p.on, p.none);
}
