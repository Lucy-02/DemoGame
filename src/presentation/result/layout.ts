// 전투 결과 화면 배치 수치. 보상 라운드 E1 시안(0051, 프레임 f1)과 폴리싱 P1(0050)에서 잰 값이에요.
// 시안 값은 임시예요(TODO_TOKEN). 색·글자 크기는 토큰(tokens.provisional.palette, tokens.provisional.text.result)에서 가져와요.
import { HAND_CARD } from "../card/layout";

export const FRAME = { w: 1280, h: 800 };

/** 0050 격자: 바깥 여백 48, 왼쪽 열 48~612, 정령 줄 664~1232, 버튼 줄 660~708 */
export const GRID = { gutter: 48, lanesX: 664, lanesW: 568, buttonY: 660, buttonH: 48 };

/** .bg radial-gradient(70% 80% at 28% 45%, stageHi 0, floor 58%, stageLo 100%) */
export const BG = { rx: 0.7, ry: 0.8, cx: 0.28, cy: 0.45, mid: 0.58 };

/** .g3 left 48 top 30 height 36, 가운데 맞춤 gap 10 · 동전 24 · +n */
export const GOLD = { x: GRID.gutter, y: 30, h: 36, gap: 10, coin: 24 };

const REWARD_W = 166;
/** 보상 카드: 손패 카드를 폭 166으로 키워 가로로 (0051 E1). 왼→오 = 정령 줄 위→아래 */
export const REWARD = {
  x: GRID.gutter, y: 262, w: REWARD_W, h: (HAND_CARD.h * REWARD_W) / HAND_CARD.w, gap: 33, scale: REWARD_W / HAND_CARD.w,
  /** .acd.dim (다른 카드를 보는 동안) · .acd.sunk (고르고 난 뒤 남은 카드) */
  dim: 0.62, sunk: 0.12,
  /** 말풍선 아래 끝 ~ 카드 위 */
  tipGap: 20,
};

/** .btn2.b3 넘기기: 166×48 radius 12 padding 0 16 gap 10 · TODO 기호 칸 18 (점선, radius 5) · 동전 16 gap 4 ml 2 */
export const SKIP = {
  x: GRID.gutter, y: GRID.buttonY, w: REWARD_W, h: GRID.buttonH, radius: 12, gap: 10,
  todo: { size: 18, radius: 5, ring: 1, dash: 3 }, gold: { coin: 16, gap: 4, ml: 2 },
};

/** .lane 568×196 radius 14, 줄 사이 18, 첫 줄 y 84 · 그림자 0 10 28 (.24) · 위→아래 빛 veil .043 → .01 62% */
export const LANE = {
  x: GRID.lanesX, y: 84, w: GRID.lanesW, h: 196, gap: 18, radius: 14, ring: 1,
  shadow: { y: 10, blur: 28, alpha: 0.24 },
  sheen: { from: 0.043, to: 0.01, at: 0.62 },
  /** .lane.hot: 테 accHi + 바깥 4px accHi .14 */
  hot: { outer: 4, alpha: 0.14 },
  /** .lane.down: 테 danger .38 + 왼→오 danger .2 → 0 62% */
  down: { ring: 0.38, wash: 0.2, at: 0.62 },
};

/** .rbox left 28 top 38 120×120 (테 안쪽 기준 → 줄 바깥 기준 +1) · svg r 55 stroke 6 · .face inset 12 */
export const RING = {
  x: 29, y: 39, d: 120, r: 55, stroke: 6, faceInset: 12,
  /** .old 지난 경험 (ink2 .5) */
  oldAlpha: 0.5,
  /** 쓰러졌다 돌아온 정령: 끊긴 붉은 점선 (0044). stroke 4 dash 7 8 */
  down: { stroke: 4, dash: [7, 8] as [number, number], grayscale: 0.85, brightness: 0.78 },
  /** .badge 30 (기호 16), 바깥 테 3 · 첫째 right -12 top 10, 둘째 right -22 top 44 */
  badge: { d: 30, icon: 16, outer: 3, at: [[102, 10], [112, 44]] as [number, number][] },
};

/** .info left 172(+1) width 250, 세로 가운데(top 18 ~ 줄 아래) gap 10 */
export const INFO = {
  x: 173, top: 18, w: 250, gap: 10,
  /** .nm gap 10, 줄 높이 1.35 · .lv.up padding 0 9 0 6 높이 22 radius 11 gap 4 기호 13 */
  name: { gap: 10, lh: 1.35 }, levelUp: { h: 22, radius: 11, pad: [0, 9, 0, 6] as [number, number, number, number], gap: 4, icon: 13, alpha: 0.34 },
  /** .hp3 gap 7 · .hpv baseline gap 4 · .hpbar3 236×10 */
  hp: { gap: 7, numGap: 4, bar: { w: 236, h: 10 }, minFill: 0.022 },
  /** .stats3 gap 16 · .st3 padding 1 8 1 6 margin-left -6 gap 6 기호 15 (.on 17) · 밝히지 않은 능력치 .4 */
  stats: { gap: 16, pad: [1, 8, 1, 6] as [number, number, number, number], ml: -6, iconGap: 6, icon: 15, iconOn: 17, dim: 0.4 },
  /** .chip3.new 높이 24 radius 11 padding 0 9 gap 5 기호 14 · 바탕 acc .28 */
  chip: { h: 24, radius: 11, padX: 9, gap: 5, icon: 14, alpha: 0.28, rowGap: 8 },
};

/** .sock right 28 top 18 96×134 radius 8 점선 · .pick.hot 바깥 3px accHi + 빛 22 (.35) · 작은 카드 left 2 top 2.5 */
export const SOCKET = {
  x: 443, y: 19, w: 96, h: 134, radius: 8, ring: 1, dash: 4, lineAlpha: 0.15,
  card: { x: 2, y: 2.5 }, hot: { ring: 3, glow: 22, glowAlpha: 0.35 },
};
