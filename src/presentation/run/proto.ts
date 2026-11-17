// ⚠ 시안용 (공용 UI 기획 스레드, PR 아님). ?layout=1|2|3 으로 이벤트 · 휴식을 지도 위에 띄워요.
// 1 = 가운데 창 + 창 안 얇은 정령 줄 · 2 = 길 자리의 판 + 지도의 정령 줄 그대로 · 3 = 가운데 창 + 선택지 안 정령 얼굴
import type * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import { SLIM } from "../map/layout";
import { WINDOW } from "../result/layout";
import { drawWindow } from "../result/views/window";
import { P, text } from "../spirits/views/parts";
import { box } from "../style/draw";
import { render, size, type Node } from "../style/flex";
import { shadowTexture } from "../style/shadow";
import { choicesHeight, drawChoices, type ChoicePointer, type ChoiceVM } from "./choices";
import { COPY } from "./copy";
import { CHOICE, FRAME, GOLD, GRID, STORY } from "./layout";
import { drawSlimLane, type SlimLook, type SlimState } from "./slimLane";
import type { LaneVM } from "./viewmodel";

const T = tokens.provisional.text.runScreen;
const TR = tokens.provisional.text.result;

export type Proto = "1" | "2" | "3";

export function protoLayout(): Proto | undefined {
  const v = new URLSearchParams(location.search).get("layout");
  return v === "1" || v === "2" || v === "3" ? v : undefined;
}

const COL = { "1": 480, "2": GRID.colW - WINDOW.pad * 2, "3": 560 } as const;
const LANES = { w: 400, gap: 12 };

export interface ProtoPanel {
  layout: Proto;
  lanes: LaneVM[];
  title?: string;
  story?: string;
  items: ChoiceVM[];
  hot?: number;
  on: ChoicePointer;
  none?: string;
  /** 골드가 걸린 화면에서만 */
  gold?: { total: number; was?: number };
  lane: (l: LaneVM) => SlimState;
}

export function drawProtoPanel(scene: Phaser.Scene, p: ProtoPanel) {
  const W = WINDOW;
  const colW = COL[p.layout];
  const head: Node | undefined = p.title ? {
    t: "col", w: colW, gap: STORY.gap,
    children: [
      text(p.title, T.eventName, P.ink, { lh: STORY.titleLh }),
      ...(p.story ? [text(p.story, T.story, P.ink, { lh: STORY.lh, wrap: colW, keepAll: true })] : []),
    ],
  } : undefined;
  const headH = head ? size(head).h + CHOICE.gap : 0;
  const leftH = headH + choicesHeight(p.items, colW, p.none);
  const lanesH = p.lanes.length * SLIM.h + (p.lanes.length - 1) * LANES.gap;
  const innerH = p.layout === "1" ? Math.max(leftH, lanesH) : leftH;
  const innerW = p.layout === "1" ? colW + W.colGap + LANES.w : colW;
  const win = {
    w: innerW + W.pad * 2, h: innerH + W.pad * 2,
    x: p.layout === "2" ? GRID.gutter : Math.round((FRAME.w - innerW) / 2) - W.pad,
    y: Math.round((FRAME.h - innerH) / 2) - W.pad,
  };
  if (p.layout === "2") {
    const sh = shadowTexture(scene, win.w, win.h, W.radius, { y: W.shadow.y, blur: W.shadow.blur, color: P.tipShadow });
    scene.add.image(win.x - sh.margin, win.y - sh.margin, sh.key).setOrigin(0, 0);
    box(scene.add.graphics(), win.x, win.y, win.w, win.h, W.radius, { fill: P.floor, ring: { width: W.ring, color: P.glassLine } });
  } else drawWindow(scene, win);

  const x = win.x + W.pad;
  const top = win.y + W.pad + (innerH - leftH) / 2;
  if (head) render(scene, head, x, top);
  if (p.gold && p.layout !== "2") {
    const gold: Node = {
      t: "row", h: 27, gap: 8, align: "center",
      children: [
        { t: "icon", id: "i-coin", w: 18, h: 18, tint: P.gold },
        ...(p.gold.was !== undefined ? [text(`${p.gold.was}${COPY.arrow}`, TR.was, P.ink3Spirit)] : []),
        text(String(p.gold.total), T.eventName, P.ink, { lh: 1 }),
      ],
    };
    render(scene, gold, x + colW - size(gold).w, top);
  }
  drawChoices(scene, p.items, top + headH, p.hot, p.on, p.none, { x, w: colW });

  if (p.layout === "1") {
    const look: SlimLook = {
      ...SLIM, x: x + colW + W.colGap, w: LANES.w,
      hp: { ...SLIM.hp, x: 212, w: 88, numRight: 16 },
    };
    let y = win.y + W.pad + (innerH - lanesH) / 2;
    for (const l of p.lanes) {
      drawSlimLane(scene, l, y, look, undefined, p.lane(l));
      y += SLIM.h + LANES.gap;
    }
  }
}
