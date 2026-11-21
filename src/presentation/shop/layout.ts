// 상점 화면만의 배치 수치. 공용 뼈대는 run/layout.ts.
// 진열 카드는 큰 얼굴 (0161 L1 시안): 3×2, 카드 사이 5는 시안 값. 첫 행 y 80 · 행 사이(값 줄 포함) 44는 떠나기 버튼과 겹치지 않게 잡은 임시 값이에요.
import { BIG_CARD } from "../card/layout";
import { GRID, SLIM_LANE } from "../run/layout";

const CARD_W = BIG_CARD.w;
const CARD_H = BIG_CARD.h;
/** TODO_TOKEN: 첫 행 y · 행 사이 */
const ROW0 = 80, ROW_GAP = 44;
/** 카드 격자 3×2 (0050). 값은 카드 아래 8, 높이 20 가운데 (동전 14 gap 5) */
export const STOCK = {
  x: GRID.gutter, rows: [ROW0, ROW0 + CARD_H + ROW_GAP], cols: 3, w: CARD_W, h: CARD_H, gap: 5,
  price: { dy: CARD_H + 8, h: 20, coin: 14, gap: 5 },
};

/** .svt 빼기·치료 칸: 격자 오른쪽(카드 간격 하나 띄움), 폭 144 · 높이는 카드 + 값 줄, 행마다 하나 · 사방 1px 의미색 테 (.55)
 *  원 72 (안쪽 테 1.5) 기호 36 · 이름 · 값(동전 18 gap 5), 세로 gap 14 가운데 */
export const SERVICE = {
  x: STOCK.x + STOCK.cols * CARD_W + STOCK.cols * STOCK.gap, w: 144, h: CARD_H + 30, radius: 14, gap: 14, lineAlpha: 0.55, offAlpha: 0.4,
  circle: 72, ring: 1.5, icon: 36, price: { coin: 18, gap: 5 },
};

/** 얇은 정령 줄 (지도와 같은 부품): 진열이 넓어진 만큼 줄을 좁혀 오른쪽 끝에 맞춰요. 진열 가운데 높이.
 *  TODO_TOKEN: x 758 · HP 막대 x 262 폭 100 · 능력치 x 222는 시험 값 (r8-big-shop) */
const LANE_X = 758;
export const SHOP_LANE = {
  ...SLIM_LANE,
  x: LANE_X, w: SLIM_LANE.x + SLIM_LANE.w - LANE_X,
  hp: { ...SLIM_LANE.hp, x: 262, w: 100, numX: 262 + 100 + (SLIM_LANE.hp.numX - SLIM_LANE.hp.x - SLIM_LANE.hp.w) },
  statX: 222,
  /** 진열 가운데 높이 (첫 행 위 ~ 둘째 행 값 줄 아래) */
  mid: (STOCK.rows[0] + STOCK.rows[1] + STOCK.price.dy + STOCK.price.h) / 2,
};
