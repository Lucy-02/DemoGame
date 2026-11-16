// 지도 문구. 늘 보이는 글은 이름·숫자·버튼 동사만 (0050): 칸 종류는 기호, 이름은 호버에만.
import type { NodeType } from "../../core/run";

export const COPY = {
  kind: { battle: "전투", elite: "정예", event: "이벤트", shop: "상점", rest: "휴식", boss: "보스" } satisfies Record<NodeType, string>,
  close: "닫기",
};

/** 칸 종류 기호 (임시: 지금 있는 기호 가운데 뜻이 가까운 것, TODO_TOKEN) */
export const KIND_ICON: Record<NodeType | "start", string> = {
  start: "g-flag", battle: "i-sword", elite: "i-claw", event: "i-dice", shop: "i-coin", rest: "fx-heal", boss: "i-burst",
};
