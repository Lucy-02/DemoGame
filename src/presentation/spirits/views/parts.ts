// 정령 관리 화면 공용 조각: 유리 판, 배지, 단계 칩, 막대. flex 노드로 만들어서 어느 자리에든 끼워요.
import { tokens } from "../../../design/tokens";
import { box } from "../../style/draw";
import type { BlockNode, BoxNode, Node } from "../../style/flex";
import { BADGE, STRIP } from "../layout";

export const P = tokens.provisional.palette;
export const T = tokens.provisional.text.spirits;

/** 유리 판 (--glass + inset 1px --glass-line). dark면 --glass-d */
export const glass = (dark = false) => ({ fill: dark ? P.glassD : P.glass, ring: { width: 1, color: P.glassLine } });

export const text = (t: string, size: string, color: string, extra: Partial<Node> = {}): Node =>
  ({ t: "text", text: t, size, color, ...extra }) as Node;

/** 둥근 배지 (.q-badge: 상아 바탕 + 먹 기호). outer면 바깥 3px 테 (.corner, .onbtn) */
export function badge(icon: string, d = BADGE.d, iconSize = BADGE.icon, outer = false, extra: Partial<BoxNode> = {}): BoxNode {
  const inset = (d - iconSize) / 2;
  const core: BoxNode = {
    t: "col", round: true, w: d, h: d, pad: [inset, inset, inset, inset], style: { fill: P.ink },
    children: [{ t: "icon", id: icon, w: iconSize, h: iconSize, tint: P.floor }],
  };
  if (!outer) return { ...core, ...extra };
  const o = STRIP.badge.outer;
  return { t: "col", round: true, w: d + o * 2, h: d + o * 2, pad: [o, o, o, o], style: { fill: P.ringOuter }, children: [core], ...extra };
}

/** 가로 막대 (.q-bar / .q-prog): 바탕 + 채움. value 0~1 */
export function bar(h: number, value: number, track: string, fillColor: string, extra: Partial<BlockNode> = {}): BlockNode {
  return {
    t: "block", w: 0, h, grow: true, ...extra,
    draw: (g, x, y, w) => {
      box(g, x, y, w, h, h / 2, { fill: track });
      if (value > 0) box(g, x, y, Math.max(h, w * Math.min(1, value)), h, h / 2, { fill: fillColor });
    },
  };
}

/** 버튼 (.btn.go 강조 / .btn 보통). 끌 수 없으면 흐리게 */
export function button(label: string, opts: {
  size: string; h: number; radius: number; padX?: number; go?: boolean; enabled?: boolean; w?: number; grow?: boolean;
  badgeIcon?: string; onClick?: () => void;
}): BoxNode {
  const enabled = opts.enabled ?? true;
  const fill = opts.go ? (enabled ? P.acc : P.veil["08"]) : undefined;
  const ink = opts.go ? (enabled ? P.onAcc : P.ink3Spirit) : P.ink;
  const padX = opts.padX ?? 0;
  return {
    t: "row", h: opts.h, w: opts.w, grow: opts.grow, radius: opts.radius, justify: "center", align: "center",
    pad: [0, padX, 0, padX],
    style: opts.go ? { fill } : { ring: { width: 1, color: P.glassLine } },
    onClick: enabled ? opts.onClick : undefined,
    children: [text(label, opts.size, ink)],
  };
}

/** 가는 가로선 (border-top 1px --glass-line). col 안에서 폭이 늘어나요 */
export const rule = (h = 1, color: string = P.glassLine): BlockNode => ({
  t: "block", w: 0, h, draw: (g, x, y, w) => box(g, x, y, w, h, 0, { fill: color }),
});
