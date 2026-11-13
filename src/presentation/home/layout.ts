// 타이틀 겸 메인 화면 배치 (0054: 왼쪽 세로 메뉴, 맨 위가 강조 줄). 묶음 C 라운드 4 L1 변형 시안에서 잰 임시 값이에요.
// 배경은 미정이라 결과 창 계열 바닥(run/backdrop)만 깔아요.
import { BADGE } from "../spirits/layout";

/** .c1-logo left 48 top 150, padding 6 18, radius 10, 점선 테 1 (이름이 정해지기 전 자리) */
export const LOGO = { x: 48, y: 150, padX: 18, padY: 6, radius: 10, ring: 1, dash: 4 };

/** .c1-menu left 48 top 273 width 400 gap 10 · .o-btn height 50 radius 12 padding 0 18 gap 10 · .c1-bi 16 */
export const MENU = {
  x: 48, y: 273, w: 400, gap: 10,
  row: { h: 50, radius: 12, padX: 18, gap: 10, icon: 16 },
  /** .todoi 기호가 없는 자리: 점선 둥근 네모 (줄 기호와 같은 크기) */
  todo: { radius: 4, ring: 1, dash: 3 },
  /** .q-badge.cnt 20 */
  count: { d: BADGE.d },
};

/** 강조 줄: 메뉴 맨 위, 메뉴와 같은 폭 (0054, Lucy 2026-11-13 B안). 크기는 실제 화면에서 견준 임시 값이에요.
 *  이어하기: 얼굴 지름 34 간격 5, 낱말과 간격 18, 층과 간격 14 */
export const PRIMARY = {
  h: 76, below: 18, radius: 14, padX: 22, gap: 14, icon: 24, ring: 1,
  face: { d: 34, gap: 5, ml: 18 }, floorMl: 14,
};

/** .c1-tip: 줄 오른쪽 22, 줄 위쪽보다 7 위 */
export const TIP = { dx: 22, dy: -7 };
