// 상점 화면만의 배치 수치 (0163, 상점 라운드 T의 T3 가운데 창 https://claude.ai/artifact/USLZwnziFzJC5JJSqodMYC). 값은 시안에서 옮긴 임시 값이에요.
// 가운데 유리 창 하나에 선이 한 벌이에요: 큰 얼굴 카드 여섯 칸의 끝선을 정령 칸(두 칸씩) · 빼기 · 치료(두 칸씩) · 떠나기(한 칸)가 같이 써요.
import { BIG_CARD } from "../card/layout";
import { FRAME, SLIM_LANE } from "../run/layout";

const CARD_W = BIG_CARD.w, CARD_H = BIG_CARD.h;
/** TODO_TOKEN: 칸 사이 20 · 창 안쪽 여백 26 · 값 줄(카드 아래 10, 높이 20) · 버튼 줄 높이 60 */
const COLS = 6, GAP = 20, PAD = 26;
const LANE_H = SLIM_LANE.h, PRICE_DY = 10, PRICE_H = 20, BUTTON_H = 60;
const INNER_W = COLS * CARD_W + (COLS - 1) * GAP;
const WIN_W = INNER_W + PAD * 2;
const WIN_H = PAD + LANE_H + GAP + CARD_H + PRICE_DY + PRICE_H + PAD + BUTTON_H + PAD;
const WIN_X = Math.round((FRAME.w - WIN_W) / 2), WIN_Y = Math.round((FRAME.h - WIN_H) / 2);
const INNER_X = WIN_X + PAD;
const LANE_Y = WIN_Y + PAD, CARD_Y = LANE_Y + LANE_H + GAP, BUTTON_Y = CARD_Y + CARD_H + PRICE_DY + PRICE_H + PAD;

/** n번째 칸의 왼쪽 끝 */
export const colX = (n: number) => INNER_X + n * (CARD_W + GAP);
/** 칸 n개 폭 */
export const span = (n: number) => n * CARD_W + (n - 1) * GAP;

/** 창 자리. 바탕 · 테 · 그림자 · 모서리는 전투 결과 창(PANEL)과 같아요 */
export const WINDOW = { x: WIN_X, y: WIN_Y, w: WIN_W, h: WIN_H };

/** 진열: 큰 얼굴 여섯 장 한 줄. 값은 카드 아래 가운데 (동전 14 gap 5). 팔린 칸은 옅은 테로 자리를 지켜요 */
export const STOCK = {
  y: CARD_Y, cols: COLS, w: CARD_W, h: CARD_H,
  price: { dy: CARD_H + PRICE_DY, h: PRICE_H, coin: 14, gap: 5 },
  sold: { radius: BIG_CARD.radius, lineAlpha: 0.1 },
};

/** 정령 칸: 지도와 같은 얇은 줄 부품을 두 칸 폭으로, 가로로 셋. 셋보다 적으면 가운데부터 채워요.
 *  TODO_TOKEN: 이름 x 62 · 능력치 x 162 · HP 막대 x 206 폭 76 · 수 x 304는 화면에서 잰 임시 값 */
export const SHOP_LANE = {
  ...SLIM_LANE,
  y: LANE_Y, w: span(2), slots: 3, radius: 12,
  ring: { ...SLIM_LANE.ring, x: 10 },
  name: { ...SLIM_LANE.name, x: 62 },
  hp: { ...SLIM_LANE.hp, x: 206, w: 76, numX: 304 },
  statX: 162,
  noLevel: true,
  plain: true,
};

/** 버튼 줄: 떠나기(첫 칸) · 빼기(2~3번째 칸) · 치료(4~5번째 칸). 의미색은 기호와 가리킬 때의 얇은 테에만 */
export const BUTTONS = {
  y: BUTTON_Y, h: BUTTON_H, radius: 12,
  leave: { x: colX(0), w: span(1), icon: 14, gap: 8 },
  remove: { x: colX(1), w: span(2) },
  heal: { x: colX(3), w: span(2) },
  icon: 22, gap: 10, priceGap: 8, coin: 14, coinGap: 5, hoverRing: 1.5, offAlpha: 0.4,
};
