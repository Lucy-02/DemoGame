// 덱 보기 (0012 A 정령별 세 줄 + 0069 전투 위 창, Lucy 2026-11-16 "나 좋다, 가로세로 여백 조정"). 값은 임시예요.
// 창은 내용을 감싸고 사방 여백이 같아요: 안쪽 여백 = 줄 사이 = 전투 위 창 안쪽 여백(24), 카드 사이 = 창 안 카드 사이(12).
import { HAND_CARD } from "../card/layout";
import { FRAME } from "../run/layout";

export const DECK_VIEW = {
  pad: 24, rowGap: 24, cardGap: 12,
  /** 한 줄에 놓는 카드 수. 넘치면 그 줄만 접어 내려요. 창 폭은 가장 긴 줄(이 수까지)에 맞춰요 */
  per: 9, minCols: 4,
  /** 줄 머리: 얼굴 26, 이름 · 장수 · +n 사이 10, 머리와 카드 사이 12 · 덱 기호 18 */
  head: { h: 26, face: 26, gap: 10, below: 12, icon: 18, iconGap: 6 },
  /** 닫기: 첫 줄 머리 오른쪽 끝 · 기호 18 */
  close: { icon: 18, gap: 6 },
  /** 창 위아래로 남기는 화면 여백. 내용이 더 길면 창 안에서 세로로 스크롤해요 */
  screenGap: 20, wheel: 0.5,
  card: { w: HAND_CARD.w, h: HAND_CARD.h },
  frame: FRAME,
};
