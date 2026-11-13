// 상점 화면만의 배치 수치. 공용 뼈대는 run/layout.ts. 폴리싱 P1(0050) 프레임 f3에서 잰 임시 값이에요.
import { HAND_CARD } from "../card/layout";
import { GRID } from "../run/layout";

const CARD_W = 120;
/** 카드 격자 3×2 (0050): 폭 120 간격 20, 행 y 144 · 402. 값은 카드 아래 10, 높이 20 가운데 (동전 14 gap 5) */
export const STOCK = {
  x: GRID.gutter, rows: [144, 402], cols: 3, w: CARD_W, h: (HAND_CARD.h * CARD_W) / HAND_CARD.w, gap: 20, scale: CARD_W / HAND_CARD.w,
  price: { dy: 178, h: 20, coin: 14, gap: 5 },
  /** .acd.poor 골드가 모자란 카드 */
  poor: { grayscale: 0.6 },
};

/** .svt 빼기·치료 칸: 격자 오른쪽 x 468, 144×198 (카드 + 값 줄 높이), 행마다 하나 · 사방 1px 의미색 테 (.55)
 *  원 72 (안쪽 테 1.5) 기호 36 · 이름 · 값(동전 18 gap 5), 세로 gap 14 가운데 */
export const SERVICE = {
  x: 468, w: 144, h: 198, radius: 14, gap: 14, lineAlpha: 0.55, offAlpha: 0.4,
  circle: 72, ring: 1.5, icon: 36, price: { coin: 18, gap: 5 },
};

/** .btn2.quiet.b3 떠나기: 166×48 radius 12 gap 10 기호 18 */
export const LEAVE = { x: GRID.gutter, y: GRID.buttonY, w: 166, h: GRID.buttonH, radius: 12, gap: 10, icon: 18 };

/** 빼기 (P1 f4): 정령 줄마다 그 정령의 덱 한 줄. 줄 위에서 40 내려온 곳, 카드 92 간격 26. 장수가 많으면 간격을 좁혀 폭 564에 맞춰요
 *  .rmmark 고른 카드 오른쪽 위 − 표식: 원 26 (바깥 테 3), 카드 밖으로 12 · 22
 *  확인 줄: 카드 줄 아래 22, 높이 44 · 취소 132 + 12 + 빼기 168, 오른쪽 끝 맞춤 */
export const DECK = {
  x: GRID.gutter, w: 564, dy: 40, step: 118, lift: 10,
  mark: { d: 26, ring: 3, dx: 12, dy: 22, bar: { w: 10, h: 2 } },
  confirm: { dy: 151, h: 44, radius: 12, gap: 12, cancelW: 132, okW: 168, icon: 18, inner: 10, coin: 14, coinGap: 5 },
};
