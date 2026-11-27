// 링크 자리: 버튼과 같은 크기의 점선 칸. 주소와 낱말이 아직 없는 링크를 자리만 비워 둬요 (0101 · 0140).
// 데모 끝 화면과 데모의 진 판 결과가 같이 써요.
import { tokens } from "../../design/tokens";
import { P, text } from "../spirits/views/parts";
import { withAlpha } from "../style/color";
import type { Node } from "../style/flex";
import { RUN_END } from "./layout";

const T = tokens.provisional.text.runScreen;

export function linkSlot(label: string): Node {
  const B = RUN_END.button, O = RUN_END.only;
  return {
    t: "row", w: B.w, h: B.h, radius: B.radius, justify: "center", align: "center",
    style: { ring: { width: O.ring, color: withAlpha(P.ink, O.lineAlpha), dash: O.dash } },
    children: [text(label, T.record, P.ink3Spirit)],
  };
}
