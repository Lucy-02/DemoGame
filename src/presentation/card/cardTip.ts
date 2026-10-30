// 손패 호버 말풍선 (정본 H1 .bub)의 내용: 설명·계산·사유·주인 줄. 모양은 툴팁 공용 스킨 PAPER.
import type { TipBlock, TipContent } from "../tooltip/content";
import type { CardDetailVM } from "./viewmodel";

export function cardTipContent(d: CardDetailVM): TipContent {
  const blocks: TipBlock[] = [{ kind: "text", role: "body", text: d.text }];
  if (d.calc) blocks.push({ kind: "text", role: "calc", text: d.calc });
  if (d.why) blocks.push({ kind: "text", role: "why", text: [{ text: d.why }] });
  blocks.push({ kind: "text", role: "meta", text: [{ text: d.owner }] });
  return blocks;
}
