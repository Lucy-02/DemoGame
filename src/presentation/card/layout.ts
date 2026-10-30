// 손패 카드(.cd.h 92×129) 배치. 정본 design/canon/battle-r5/frame-old.css "카드" 절과 r5.css.
// 좌표는 카드 바깥 상자 왼쪽 위 기준 (테 1 + 안쪽 여백 4).
import type { FaceId } from "../faces";

export const HAND_CARD = {
  w: 92, h: 129, radius: 8, border: 1,
  /** .win 84×90 그림 창 (content 82 폭에 84 SVG가 왼쪽 맞춤) */
  win: { x: 5, y: 5, w: 84, h: 90, contentW: 82 },
  /** .h .ai 34, margin-bottom 10 → 창 안 가운데에서 5 위 */
  art: { size: 34, mb: 10 },
  /** .h .bnd margin 4 -4 -4, radius 0 0 7 7, padding-top 2 */
  band: { x: 1, y: 99, w: 90, h: 29, radius: 7, padTop: 2 },
  /** .h .cost left 2 top 2 22×22, 바깥 테 2 (.short 2.5) */
  cost: { x: 3, y: 3, d: 22, ring: 2, shortRing: 2.5 },
  /** .h .eg right 7 top 15 11×11, opacity .85 */
  element: { right: 7, y: 16, size: 11, alpha: 0.85 },
  /** .h .notch left 1 top 63 32×32, img inset 3 */
  notch: { x: 2, y: 64, d: 32, inset: 3 },
  /** .h .plate right 3 top 66 (.two 58), radius 6, padding 3 5 2 4, gap 1 */
  plate: { right: 3, y: 67, yTwo: 59, radius: 6, pad: [3, 5, 2, 4] as [number, number, number, number], gap: 1 },
  /** .h .gl 11 (.two 10), margin-right 1 · .up margin-left 1 margin-top 1 */
  glyph: { size: 11, sizeTwo: 10, mr: 1 }, up: { ml: 1, mt: 1 },
  /** .mk right 3 top 44 height 16 padding 0 4 radius 8 gap 2, .ic 10 */
  mark: { right: 3, y: 45, h: 16, padX: 4, radius: 8, icon: 10 },
  /** .h .why top 36 padding 1 6 radius 5 line-height 1.3, 가운데 */
  why: { y: 37, pad: [1, 6, 1, 6] as [number, number, number, number], radius: 5, lh: 1.3 },
  /** .cd.act box-shadow 0 10px 24px */
  liftShadow: { y: 10, blur: 24 },
  /** .nm letter-spacing -.02em */
  nameLetterSpacing: -0.02,
};

/** 정령별 그림 창 윗선 (정본 SVG path 그대로, viewBox 0 0 84 90) */
export const WINDOW_PATH: Record<FaceId, string> = {
  star: "M0 11 L14.9 11 L21.0 0 L27.1 11 L36.0 11 L42.0 0 L48.0 11 L57.0 11 L63.0 0 L69.0 11 L84 85 Q84 90 79 90 L5 90 Q0 90 0 85 Z",
  fire: "M0 11 Q2.5 11 7.6 4.4 Q11.8 6.1 16.8 11 Q19.3 11 24.4 0.6 Q28.6 6.1 33.6 11 Q36.1 11 41.2 4.4 Q45.4 6.1 50.4 11 Q52.9 11 58.0 0.6 Q62.2 6.1 67.2 11 Q69.7 11 74.8 4.4 Q79.0 6.1 84.0 11 L84 85 Q84 90 79 90 L5 90 Q0 90 0 85 Z",
  jelly: "M0 11 Q10.5 -2.8 21.0 11 Q31.5 -2.8 42.0 11 Q52.5 -2.8 63.0 11 Q73.5 -2.8 84.0 11 L84 85 Q84 90 79 90 L5 90 Q0 90 0 85 Z",
};

/** 손패 호버 말풍선 (.bub): width 240, padding 9 11 8, radius 10, gap 5, 테 1, 그림자 0 10 24
 *  ::after 14×14 45° 회전, bottom -7, 아래 두 변에 1px 선 · .txt line-height 1.5 · .kw 밑줄 offset 3
 *  .calc padding-top 5 (border-top은 정본에서도 안 그려짐) · 바뀔 때 translateY(6)에서 올라옴 */
export const BUBBLE = {
  w: 240, pad: [9, 11, 8, 11] as [number, number, number, number], radius: 10, gap: 5, ring: 1,
  shadow: { y: 10, blur: 24 },
  arrow: { size: 14, line: 1 },
  textLh: 1.5, termOffset: 3,
  calcRule: { padTop: 5 },
  enterY: 6,
};
