// 카드 연출 표: 128장을 조각 × 속성 × 무게 × 크기로 풀어 design/card/fx/CARDS.md에 써요. `pnpm tsx tools/cardFxTable.ts`
import { writeFileSync } from "node:fs";
import { CARD_FILES } from "../src/data/cards";
import { cardDef } from "../src/core/data";
import { describeCard } from "../src/core/text";
import type { CardData } from "../src/core/types";
import { cardFx, type Piece } from "../src/presentation/battle/fx/pieces";

export const PIECE_KO: Record<Piece, string> = {
  strike: "치기", multi: "연타", sweep: "휩쓸기", scatter: "흩뿌리기",
  burn: "화상 붙임", chill: "냉기 붙임", delay: "늦춤", freeze: "빙결", debuff: "약화 붙임", star: "별 새김", stagger: "휘청", spread: "화상 옮김",
  ignite: "점화", starburst: "별 터뜨림", break: "브레이크", cancel: "행동 없앰",
  block: "방어도", wall: "벽", heal: "회복", stance: "자세",
  give: "건넴", arm: "걸어 둠",
  draw: "뽑기", mana: "마력", tempo: "박자", hold: "품기",
  aura: "지속",
};
const EL: Record<string, string> = { fire: "불", water: "물", wind: "바람", light: "빛", earth: "땅", forest: "숲", none: "무" };
const TARGET: Record<string, string> = { enemy: "적 하나", allEnemies: "모든 적", self: "자기", ally: "아군 하나", allAllies: "모든 아군" };
const WEIGHT = { light: "가벼움", normal: "보통", heavy: "무거움" };

const rows: string[] = [];
const count = new Map<string, number>();
for (const [file, list] of Object.entries(CARD_FILES)) {
  rows.push(`\n## ${file} (${list.length})\n`, "| 카드 | 주인 | 속성 | 대상 | 조각 | 무게 | 크기 | 효과문 |", "| --- | --- | --- | --- | --- | --- | --- | --- |");
  for (const c of list as CardData[]) {
    const fx = cardFx(c), d = cardDef(c.id);
    const key = fx.pieces.join("+");
    count.set(key, (count.get(key) ?? 0) + 1);
    rows.push(`| ${d.name} \`${c.id}\` | ${c.spirit ?? "공용"} | ${EL[c.element]} | ${TARGET[c.target]} | ${fx.pieces.map((p) => PIECE_KO[p]).join(" → ")}${fx.exhaust ? " · 소멸" : ""} | ${WEIGHT[fx.weight]} ${c.ms} | ${fx.tier === "payoff" ? "결실" : "보통"} | ${describeCard(d, null)} |`);
  }
}
const total = [...count.values()].reduce((a, b) => a + b, 0);
const combos = [...count.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `| ${k.split("+").map((p) => PIECE_KO[p as Piece]).join(" → ")} | ${n} |`);
writeFileSync("design/card/fx/CARDS.md", [
  "# 카드 연출 표 (생성 파일)",
  "",
  `\`tools/cardFxTable.ts\`가 \`src/presentation/battle/fx/pieces.ts\`의 묶음으로 만든 표예요. 손으로 고치지 않아요. 카드 ${total}장, 조각 줄 ${count.size}가지. 정의는 \`docs/design/systems/card-fx.md\`.`,
  "",
  "## 조각 줄마다 카드 수",
  "",
  "| 조각 줄 | 카드 |", "| --- | --- |", ...combos,
  ...rows, "",
].join("\n"));
console.log(`카드 ${total}장, 조각 줄 ${count.size}가지`);
