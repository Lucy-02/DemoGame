// 카드 곁쪽지의 내용 (0161): 주인 줄 · 계산 줄 · 강화하면 바뀌는 효과문 · 용어 풀이. 모양은 툴팁 공용 스킨 NOTE.
// 효과문에서 밑줄 친 용어는 용어 사전의 풀이가 이어 떠요 (0105). 효과문과 못 내는 사유는 큰 얼굴이 직접 보여요.
import { termBody, termOfName } from "../glossary/terms";
import type { TipBlock, TipContent } from "../tooltip/content";
import type { CardDetailVM } from "./viewmodel";

export function cardNoteContent(d: CardDetailVM): TipContent {
  const blocks: TipBlock[] = [{ kind: "text", role: "meta", text: [{ text: d.owner }] }];
  if (d.calc) blocks.push({ kind: "text", role: "calc", text: d.calc });
  if (d.upgrade) blocks.push({ kind: "text", role: "body", text: [{ text: `${d.upgrade.label} `, strong: true }, ...d.upgrade.text] });
  for (const name of new Set(d.text.filter((p) => p.term).map((p) => p.text))) {
    const term = termOfName(name);
    if (term) blocks.push({ kind: "text", role: "term", text: [{ text: term.name, strong: true }, { text: ` ${termBody(term)}` }] });
  }
  return blocks;
}
