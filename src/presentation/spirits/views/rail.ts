// 접힌 패널: 세로 탭 레일(.q-rail)과 옆의 요약 카드(.q-facts). 장부 §3-2 A·C
import type * as Phaser from "phaser";
import { box } from "../../style/draw";
import { hitArea, render, size, type Node } from "../../style/flex";
import { px } from "../../style/text";
import { BADGE, BIG_BUTTON, FACTS, FRAME, RAIL, STRIP } from "../layout";
import type { FactVM, SpiritDetailVM, TabId } from "../viewmodel";
import { COPY } from "../copy";
import { P, T, badge, bar, button, glass, text } from "./parts";

export const RAIL_ICONS = [
  ["g-up", RAIL.badgeIcon], ["g-cardnew", RAIL.badgeIcon], ["g-book", RAIL.badgeIcon], ["g-fin", FACTS.finIcon],
  ["g-up", BADGE.icon], ["g-cardnew", BADGE.icon], ["g-book", BADGE.icon],
] as const;

/** writing-mode: vertical-rl 처럼 글자를 위에서 아래로 세워요. letter-spacing .12em */
const LETTER_SPACING = 0.12;
function verticalText(label: string, sz: string, color: string): Node {
  const gap = px(sz) * LETTER_SPACING;
  return {
    t: "col", align: "center", gap,
    children: [...label].map((ch): Node => (ch === " " ? { t: "block", w: 0, h: px(sz) / 2 } : text(ch, sz, color, { lh: 1 }))),
  };
}

export function drawRail(scene: Phaser.Scene, d: SpiritDetailVM, open: (tab: TabId) => void) {
  const x = FRAME.w - RAIL.right - RAIL.w;
  const g = scene.add.graphics();
  box(g, x, RAIL.y, RAIL.w, RAIL.h, RAIL.radius, glass());
  const cellH = (RAIL.h - RAIL.padY * 2) / d.tabs.length;
  d.tabs.forEach((t, i) => {
    const top = RAIL.y + RAIL.padY + i * cellH;
    if (i > 0) box(g, x, top, RAIL.w, 1, 0, { fill: P.glassLine });
    const node: Node = {
      t: "col", align: "center", gap: RAIL.gap,
      children: [verticalText(t.label, T.railTab, P.ink2), ...(t.count ? [text(t.count, T.railCount, P.ink3Spirit)] : [])],
    };
    const s = size(node);
    render(scene, node, x + (RAIL.w - s.w) / 2, top + (cellH - s.h) / 2);
    if (t.badge) render(scene, badge(t.badge, RAIL.badge, RAIL.badgeIcon), x + (RAIL.w - RAIL.badge) / 2, top + RAIL.badgeTop);
    hitArea(scene, x, top, RAIL.w, cellH, () => open(t.id));
  });
}

function factNode(f: FactVM, open: (tab: TabId) => void): Node {
  const label = (right?: Node): Node => ({ t: "row", justify: "between", children: [text(f.label, T.factLabel, P.ink2), ...(right ? [right] : [])] });
  const big = (v: string, unit: string): Node => ({
    t: "row", gap: FACTS.valueGap, align: "baseline", children: [text(v, T.factValue, P.ink, { lh: 1 }), text(unit, T.factUnit, P.ink2)],
  });
  switch (f.kind) {
    case "next":
      return {
        t: "col", gap: FACTS.innerGap,
        children: f.final
          ? [label(), { t: "row", gap: FACTS.finGap, align: "center", children: [{ t: "icon", id: "g-fin", w: FACTS.finIcon, h: FACTS.finIcon, tint: P.ink }, text(f.final, T.factValueFin, P.ink)] }]
          : [label(), big(String(f.percent ?? 0), COPY.percent), bar(FACTS.bar, (f.percent ?? 0) / 100, P.veil["16"], f.ready ? P.ok : P.ink2)],
      };
    case "cells": {
      const C = FACTS.cells;
      return {
        t: "col", gap: FACTS.innerGap,
        children: [
          label(f.fresh ? text(COPY.freshCount(f.fresh), T.factLabel, P.ink) : undefined),
          big(String(f.have), COPY.ofCards(f.total)),
          {
            t: "row", gap: C.gap,
            children: Array.from({ length: f.total }, (_, i): Node => {
              // 열고 본 칸 = 상아, 새로 열린 칸 = 강조 테, 잠긴 칸 = 옅은 막 (.q-cells i.l / .u / 기본)
              const state = i < f.have - f.fresh ? "seen" : i < f.have ? "fresh" : "locked";
              return {
                t: "block", w: C.w, h: C.h,
                draw: (g, x, y, w, h) => box(g, x, y, w, h, C.radius,
                  state === "seen" ? { fill: P.ink } : state === "fresh" ? { ring: { width: C.ring, color: P.accHi } } : { fill: P.veil["10"], ring: { width: 1, color: P.glassLine } }),
              };
            }),
          },
        ],
      };
    }
    case "bond":
      return { t: "col", gap: FACTS.innerGap, children: [label(), big(String(f.have), COPY.of(f.total))] };
    case "todo":
      return {
        t: "col", gap: FACTS.innerGap + FACTS.valueGap / 2,
        children: [
          label(),
          button(f.action, { size: T.factButton, h: BIG_BUTTON.h, radius: BIG_BUTTON.radius, go: true, onClick: () => open(f.tab) }),
        ],
      };
  }
}

export function drawFacts(scene: Phaser.Scene, d: SpiritDetailVM, open: (tab: TabId) => void) {
  const x = FRAME.w - FACTS.right - FACTS.w;
  let y = FACTS.y;
  for (const f of d.facts) {
    const node: Node = { t: "col", w: FACTS.w, pad: FACTS.pad, radius: FACTS.radius, style: glass(), children: [factNode(f, open)] };
    render(scene, node, x, y);
    if (f.kind === "todo") {
      // 버튼 오른쪽 위 배지 (.q-badge.onbtn)
      const right = x + FACTS.w - FACTS.pad[1], top = y + size(node).h - FACTS.pad[2] - BIG_BUTTON.h;
      const o = STRIP.badge.outer;
      render(scene, badge(f.badge, BADGE.d, BADGE.icon, true), right - BADGE.onButton - BADGE.d - o, top + BADGE.onButton - o);
    }
    y += size(node).h + FACTS.gap;
  }
}
