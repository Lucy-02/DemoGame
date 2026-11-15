// 전투 결과 화면만의 배치 수치 (보상 카드, 넘기기). 공용 뼈대는 run/layout.ts. E1 시안(0051, 프레임 f1)에서 잰 임시 값이에요.
import { HAND_CARD } from "../card/layout";
import { CARD_FOCUS, GRID } from "../run/layout";

const REWARD_W = 166;
/** 보상 카드: 손패 카드를 폭 166으로 키워 가로로 (0051 E1). 왼→오 = 정령 줄 위→아래 */
export const REWARD = {
  x: GRID.gutter, y: 262, w: REWARD_W, h: (HAND_CARD.h * REWARD_W) / HAND_CARD.w, gap: 33, scale: REWARD_W / HAND_CARD.w,
  /** .acd.sunk (고르고 난 뒤 남은 카드) */
  dim: CARD_FOCUS.dim, sunk: 0.12, tipGap: CARD_FOCUS.tipGap,
};

/** .btn2.b3 넘기기: 166×48 radius 12 padding 0 16 gap 10 · TODO 기호 칸 18 (점선, radius 5) · 동전 16 gap 4 ml 2 */
export const SKIP = {
  x: GRID.gutter, y: GRID.buttonY, w: REWARD_W, h: GRID.buttonH, radius: 12, gap: 10,
  todo: { size: 18, radius: 5, ring: 1, dash: 3 }, gold: { coin: 16, gap: 4, ml: 2 },
};

/** 정예 장비 줄 (0051 자리 · 0064 Q2-A 모양): .strip left 48 top 526 564×96 radius 14, padding 0 26 0 12 gap 18
 *  .tile 64×64 radius 10 (그림 inset 4) · .stx gap 4 · .strip.on 테 accHi + 바깥 4px accHi .14 · 기호 15 gap 6 */
export const STRIP = {
  x: GRID.gutter, y: 526, w: 564, h: 96, radius: 14, padL: 12, padR: 26, gap: 18,
  tile: { size: 64, radius: 10, inset: 4 }, textGap: 4, hot: { outer: 4, alpha: 0.14 },
  gain: { icon: 15, gap: 6, between: 16 }, off: 0.5,
};

export { EQUIP_TIP } from "../run/layout";
