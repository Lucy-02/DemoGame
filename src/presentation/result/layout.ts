// 전투 결과 화면만의 배치 수치 (창, 보상 카드, 넘기기). 공용 뼈대는 run/layout.ts. E1 시안(0051)과 라운드 X1에서 잰 임시 값이에요.
import { BIG_CARD } from "../card/layout";
import { CARD_FOCUS, FRAME, GOLD, GRID, LANE } from "../run/layout";

const REWARD_W = BIG_CARD.w;
/** 보상 카드: 큰 얼굴을 가로로 (0161). 왼→오 = 정령 줄 위→아래. 창 안에서는 카드 사이 12 (라운드 X1) */
export const REWARD = {
  w: REWARD_W, h: BIG_CARD.h, gap: 12,
  /** .acd.sunk (고르고 난 뒤 남은 카드) */
  dim: CARD_FOCUS.dim, sunk: 0.12,
};

/** .btn2.b3 넘기기: 카드 폭×48 radius 12 padding 0 16 gap 10 · TODO 기호 칸 18 (점선, radius 5) · 동전 16 gap 4 ml 2 */
export const SKIP = {
  w: REWARD_W, h: GRID.buttonH, radius: 12, gap: 10,
  todo: { size: 18 }, gold: { coin: 16, gap: 4, ml: 2 },
};

/** 정예 장비 줄 (0051 자리 · 0064 Q2-A 모양): 카드 아래 31, 높이 96 radius 14, padding 0 26 0 12 gap 18. 폭은 왼쪽 열 폭
 *  .tile 64×64 radius 10 (그림 inset 4) · .stx gap 4 · .strip.on 테 accHi + 바깥 4px accHi .14 · 기호 15 gap 6 */
export const STRIP = {
  above: 31, h: 96, radius: 14, padL: 12, padR: 26, gap: 18,
  tile: { size: 64, radius: 10, inset: 4 }, textGap: 4, hot: { outer: 4, alpha: 0.14 },
  gain: { icon: 15, gap: 6, between: 16 }, off: 0.5,
};

/** 전투 위 창 (라운드 X1, Lucy 2026-11-15 "창을 좀 더 키워도"): 정령 줄은 줄이지 않고 그대로, 창이 내용을 감싸요.
 *  안쪽 여백 24, 왼쪽 열(카드 셋 폭)과 정령 줄 사이 28, radius 18, 테 1, 그림자 0 18 48. 창 밖은 어두워진 전투 무대. 값은 임시예요 */
export const WINDOW = { pad: 24, colGap: 28, radius: 18, ring: 1, shadow: { y: 18, blur: 48 }, minGap: 20 };

export interface ResultPlace {
  /** 창 (장면 좌표) */
  win: { x: number; y: number; w: number; h: number };
  /** 왼쪽 열 */
  col: { x: number; w: number };
  goldY: number;
  cardsY: number;
  /** 정예 장비 줄 */
  stripY: number;
  skipY: number;
  /** 창을 화면 가운데에 놓는 카메라 이동량 */
  scroll: { x: number; y: number };
}

/** 정령 줄 자리는 런 화면 격자 그대로 두고, 왼쪽 열을 그 옆에 붙인 뒤 창째로 화면 가운데에 놓아요.
 *  창 높이는 정령 줄 수를 따르되, 왼쪽 열(골드 · 카드 · 장비 줄 · 넘기기)이 들어갈 만큼은 돼요 */
export function placeResult(lanes: number, elite: boolean): ResultPlace {
  const W = WINDOW;
  const lanesH = lanes * LANE.h + (lanes - 1) * LANE.gap;
  const blockH = REWARD.h + (elite ? STRIP.above + STRIP.h : 0);
  const h = Math.max(lanesH, GOLD.h + SKIP.h + blockH + W.minGap * 2);
  const colW = REWARD.w * 3 + REWARD.gap * 2;
  const x = LANE.x - W.colGap - colW;
  const top = LANE.y;
  const skipY = top + h - SKIP.h;
  const cardsY = Math.round(top + GOLD.h + (skipY - top - GOLD.h - blockH) / 2);
  const win = { x: x - W.pad, y: top - W.pad, w: colW + W.colGap + LANE.w + W.pad * 2, h: h + W.pad * 2 };
  return {
    win, col: { x, w: colW }, goldY: top, cardsY, stripY: cardsY + REWARD.h + STRIP.above, skipY,
    scroll: { x: Math.round(win.x + win.w / 2 - FRAME.w / 2), y: Math.round(win.y + win.h / 2 - FRAME.h / 2) },
  };
}

export { EQUIP_TIP } from "../run/layout";
