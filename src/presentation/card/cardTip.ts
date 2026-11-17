// 손패 호버 말풍선 (정본 H1 .bub)의 내용: 설명·계산·사유·용어 풀이·주인 줄. 모양은 툴팁 공용 스킨 PAPER.
// 효과문에서 밑줄 친 용어는 용어 사전의 풀이가 바로 아래에 이어 떠요 (0105).
import { termBody, termOfName } from "../glossary/terms";
import type { TipBlock, TipContent } from "../tooltip/content";
import type { CardDetailVM } from "./viewmodel";

export function cardTipContent(d: CardDetailVM): TipContent {
  const blocks: TipBlock[] = [{ kind: "text", role: "body", text: d.text }];
  if (d.calc) blocks.push({ kind: "text", role: "calc", text: d.calc });
  if (d.why) blocks.push({ kind: "text", role: "why", text: [{ text: d.why }] });
  for (const name of new Set(d.text.filter((p) => p.term).map((p) => p.text))) {
    const term = termOfName(name);
    if (term) blocks.push({ kind: "text", role: "term", text: [{ text: term.name, strong: true }, { text: ` ${termBody(term)}` }] });
  }
  blocks.push({ kind: "text", role: "meta", text: [{ text: d.owner }] });
  return blocks;
}
