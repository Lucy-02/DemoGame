// 칩 하나: 성격 칩(깃들기)과 새 카드 칩(출전 준비)이 같은 조각, 같은 자리예요 (0078 고칠 점 4).
import { tokens } from "../../../design/tokens";
import type { BoxNode } from "../../style/flex";
import { P, text } from "../../spirits/views/parts";
import { CHIP } from "../layout";

const T = tokens.provisional.text.join;

/** icon = 앞 기호 (새 카드 g-cardnew, 자두빛). hot = 포인터가 올라옴 */
export function chip(label: string, opts: { icon?: string; hot?: boolean } = {}): BoxNode {
  return {
    t: "row", h: CHIP.h, radius: CHIP.radius, pad: [0, CHIP.padX, 0, CHIP.padX], gap: CHIP.gap, align: "center",
    style: { fill: opts.hot ? P.veil["14"] : P.veil["08"], ring: { width: CHIP.ring, color: opts.hot ? P.ink2 : P.glassLine } },
    children: [
      ...(opts.icon ? [{ t: "icon" as const, id: opts.icon, w: CHIP.icon, h: CHIP.icon, tint: P.accHi }] : []),
      text(label, T.chip, P.ink),
    ],
  };
}
