// 적 호버 설명 (정본 .etip)의 내용: 설명 문단. 이름·등급은 바로 위 펼친 정보판에 있어서 싣지 않아요 (정보판 C안). 모양은 툴팁 공용 스킨 GLASS.
import type { TipContent } from "../../tooltip/content";
import type { EnemyTipVM } from "../viewmodel";

export function enemyTipContent(tip: EnemyTipVM): TipContent {
  return tip.lines.map((l) => ({ kind: "text", role: "body", text: l } as const));
}
