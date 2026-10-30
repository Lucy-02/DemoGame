// 전투 화면 배치 수치. 모두 정본 CSS(design/canon/battle-r5/frame-old.css, r5.css)에서 옮겼고, 주석에 선택자를 적어요.
// 색·글자 크기는 여기 두지 않고 토큰(tokens.palette, tokens.text)에서 가져와요.

export const FRAME = { w: 1280, h: 800 }; // .frame

/** .bg radial-gradient(60% 70% at 50% 34%, wall-hi, wall 50%, wall-lo) */
export const BG = { rx: 0.6, ry: 0.7, cx: 0.5, cy: 0.34, mid: 0.5 };
/** .floor top:330px, linear-gradient(rgba(35,33,32,0), .55 30%, .9) */
export const FLOOR = { top: 330, stops: [[0, 0], [0.3, 0.55], [1, 0.9]] as const };

/** .top left:20px top:14px; .where i margin 0 4px. 부모 글자 크기는 body 기본 16px */
export const WHERE = { x: 20, y: 14, strut: "16px", dotMargin: 4 };

/** .sys right:16px top:10px gap:6px; .ib 34px; .ic 16px */
export const SYS = { right: 16, top: 10, gap: 6, button: 34, icon: 16 };

/** .rs top:10 left:941 translateX(-50%) height:40 padding 0 12 radius 18 */
export const ORDER = {
  cx: 941, top: 10, h: 40, padX: 12, radius: 18,
  /** .rs-me gap 6, ::before 6px 점 */
  meGap: 6, meDot: 6,
  /** .rs-ln 12×1, margin 0 4 */
  line: { w: 12, h: 1, mx: 4 },
  /** .rs-slot height 32 padding 0 4 radius 14 gap 3 */
  slot: { h: 32, padX: 4, radius: 14, gap: 3, nowRing: 1.5 },
  /** .rs-n width 9 */
  numW: 9,
  /** .rs-face 28, .rsf 24×20 */
  face: 28, art: { w: 24, h: 20 },
  /** .rsa 13px padding 1 margin-left -8 margin-top 12 */
  action: { size: 13, pad: 1, ml: -8, mt: 12 },
};
