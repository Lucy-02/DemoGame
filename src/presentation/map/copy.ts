// 지도 문구. 늘 보이는 글은 이름·숫자·버튼 동사만 (0050): 칸 종류는 기호, 이름은 호버에만.
import type { NodeType } from "../../core/run";

export const COPY = {
  kind: { battle: "전투", elite: "정예", event: "이벤트", shop: "상점", rest: "휴식", boss: "보스" } satisfies Record<NodeType, string>,
  close: "닫기",
  /** 보스 큰 차징이 시작하는 턴 (호버 칩, 명사형) */
  turn: (n: number) => `${n}턴`,
  sep: " · ",
  /** 능력치 이름과 출처 이름 (호버 풀이에만) */
  stat: { hp: "최대 HP", power: "파워", guard: "가드", focus: "포커스" },
  source: { base: "기본", stage: "단계", level: "레벨", personality: "성격", run: "이번 판", equipment: "장비" },
  more: (n: number) => `+${n}`,
};

/** 칸 종류 기호 (임시: 지금 있는 기호 가운데 뜻이 가까운 것, TODO_TOKEN) */
export const KIND_ICON: Record<NodeType | "start", string> = {
  start: "g-flag", battle: "i-sword", elite: "i-claw", event: "i-dice", shop: "i-coin", rest: "fx-heal", boss: "i-burst",
};
