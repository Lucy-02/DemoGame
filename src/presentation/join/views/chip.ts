// 칩 하나: 성격 칩(깃들기 · 출전 준비)이 같은 조각이에요 (0078 고칠 점 4).
import { tokens } from "../../../design/tokens";
import type { BoxNode } from "../../style/flex";
import { P, text } from "../../spirits/views/parts";
import type { TipContent } from "../../tooltip/content";
import { CHIP } from "../layout";
import type { PersonalityVM } from "../viewmodel";

const T = tokens.provisional.text.join;

/** hot = 포인터가 올라옴. caret = 고를 것이 있는 칩의 화살표 (open이면 펼친 채: 자두빛 테, 화살표가 위로) */
export function chip(label: string, opts: { hot?: boolean; caret?: boolean; open?: boolean } = {}): BoxNode {
  const C = CHIP.caret;
  return {
    t: "row", h: CHIP.h, radius: CHIP.radius, pad: [0, opts.caret ? C.padR : CHIP.padX, 0, CHIP.padX], gap: C.gap, align: "center",
    style: { fill: opts.hot ? P.veil["14"] : P.veil["08"], ring: { width: CHIP.ring, color: opts.open ? P.accHi : opts.hot ? P.ink2 : P.glassLine } },
    children: [
      text(label, T.chip, P.ink),
      ...(opts.caret ? [{ t: "icon" as const, id: CARET_ICON, w: C.size, h: C.size, tint: P.ink2, flipY: opts.open }] : []),
    ],
  };
}
export const CARET_ICON = "g-down";

/** 성격 풀이 말풍선의 내용: 이름 · 효과문 · (성체부터) */
export const personalityTip = (p: PersonalityVM): TipContent => [
  { kind: "title", text: p.name },
  { kind: "text", role: "body", text: [{ text: p.desc }] },
  ...(p.note ? [{ kind: "text" as const, role: "body" as const, text: [{ text: p.note }] }] : []),
];
