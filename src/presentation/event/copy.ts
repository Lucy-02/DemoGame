// 이벤트 화면 문구 (TEXT_RULES 3절 버튼: 행동 이름). 공용 문구는 run/copy.ts.
import type { DeckPickOutcome } from "../../core/types";

/** 덱에서 고른 카드를 확인하는 버튼 */
export const PICK_CONFIRM: Record<DeckPickOutcome, string> = {
  removeCard: "빼기",
  upgradeCard: "강화",
  duplicateCard: "복제",
};
