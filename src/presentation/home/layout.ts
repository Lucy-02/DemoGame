// 타이틀 겸 메인 화면 배치 (0054: 메뉴는 왼쪽 세로 줄, 강조 버튼만 오른쪽 아래). 묶음 C 라운드 4 L1 변형 시안에서 잰 임시 값이에요.
// 배경은 미정이라 결과 창 계열 바닥(run/backdrop)만 깔아요.
import { BADGE } from "../spirits/layout";
import { FRAME } from "../run/layout";

/** .c1-logo left 48 top 150, padding 6 18, radius 10, 점선 테 1 (이름이 정해지기 전 자리) */
export const LOGO = { x: 48, y: 150, padX: 18, padY: 6, radius: 10, ring: 1, dash: 4 };

/** .c1-menu left 48 top 273 width 400 gap 10 · .o-btn height 50 radius 12 padding 0 18 gap 10 · .c1-bi 16 */
export const MENU = {
  x: 48, y: 273, w: 400, gap: 10,
  row: { h: 50, radius: 12, padX: 18, gap: 10, icon: 16 },
  /** .todoi 기호가 없는 자리: 점선 둥근 네모 (줄 기호와 같은 크기) */
  todo: { radius: 4, ring: 1, dash: 3 },
  /** .q-badge.cnt 20 · .c1-new height 18 padding 0 7 radius 9 테 1 */
  count: { d: BADGE.d },
  fresh: { h: 18, padX: 7, radius: 9, ring: 1 },
};

/** 강조 버튼: 오른쪽 24 아래 56, 높이 52 radius 12 padding 0 22 gap 10 기호 16 (정령 관리의 `탐험 떠나기`와 같은 자리)
 *  이어하기: 얼굴 지름 26 간격 4, 낱말과 간격 14, 층과 간격 10 */
export const PRIMARY = {
  right: 24, bottom: 56, h: 52, radius: 12, padX: 22, gap: 10, icon: 16,
  face: { d: 26, gap: 4, ml: 14 }, floorMl: 10,
};
export const primaryY = FRAME.h - PRIMARY.bottom - PRIMARY.h;
export const primaryRight = FRAME.w - PRIMARY.right;

/** .c1-tip: 줄 오른쪽 22, 줄 위쪽보다 7 위 */
export const TIP = { dx: 22, dy: -7 };
