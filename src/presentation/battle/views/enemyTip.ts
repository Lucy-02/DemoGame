// 적 호버 설명 (정본 .etip)의 내용: 이름·등급, 설명 문단. 모양은 툴팁 공용 스킨 GLASS.
import type { TipContent } from "../../tooltip/content";
import type { EnemyTipVM } from "../viewmodel";

export function enemyTipContent(tip: EnemyTipVM): TipContent {
  return [
    { kind: "title", text: tip.name, tag: tip.rank },
    ...tip.lines.map((l) => ({ kind: "text", role: "body", text: l } as const)),
  ];
}
