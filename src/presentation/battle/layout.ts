// 전투 화면 배치 수치. 모두 정본 CSS(design/canon/battle-r5/frame-old.css, r5.css)에서 옮겼고, 주석에 선택자를 적어요.
// 색·글자 크기는 여기 두지 않고 토큰(tokens.provisional.palette, tokens.provisional.text)에서 가져와요.

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

/** .ally style="left:…" (가운데 x), top:206 · .ally width 176 margin-left -88 */
export const ALLY = {
  xs: [150, 322, 494], top: 206,
  /** .ally .body 110×132, .silsvg */
  body: { w: 110, h: 132 },
};

/** .enemy style="left:…", top:168, width 196 · .enemy .body 132×106 margin-top 38, .ensvg 120×96 */
export const ENEMY = {
  xs: [752, 941, 1130], top: 168,
  body: { w: 132, h: 106, mt: 38 }, art: { w: 120, h: 96 },
};

/** .ground left 50% bottom -6 120×14, radial-gradient(closest-side, shade, transparent) */
export const GROUND = { w: 120, h: 14, bottom: -6 };
/** .enemy.hov .body .ring bottom -12 150×26 border 1.5 */
export const HOVER_RING = { w: 150, h: 26, bottom: -12, width: 1.5 };

/** .info (R5): margin-top 12, width 168 / 184, gap 5, padding 7 8 8, radius 10 */
export const INFO = {
  mt: 12, allyW: 168, enemyW: 184, gap: 5, pad: [7, 8, 8, 8] as [number, number, number, number], radius: 10,
  /** .rA height 20 gap 6 · .rB min-height 22 gap 6 · .r2 min-height 20 gap 5 · .r3 gap 6 */
  rowA: { h: 20, gap: 6 }, rowB: { minH: 22, gap: 6 }, row2: { minH: 20, gap: 5 }, row3: { gap: 6 },
  /** .bar height 5 radius 3 min-width 26 */
  bar: { h: 5, radius: 3 },
  /** .shd height 22 padding 0 6 0 4 radius 11 gap 2, .shi 13 */
  block: { h: 22, pad: [0, 6, 0, 4] as [number, number, number, number], radius: 11, gap: 2, icon: 13 },
  /** .inc height 22 padding 2 8 0 radius 11 gap 3 */
  incoming: { h: 22, pad: [2, 8, 0, 8] as [number, number, number, number], radius: 11, gap: 3 },
  /** .hpn gap 2 */
  hpGap: 2,
  /** .st height 20 padding 0 6 0 4 radius 10 gap 2, .sti 12 */
  status: { h: 20, pad: [0, 6, 0, 4] as [number, number, number, number], radius: 10, gap: 2, icon: 12 },
  /** .sync gap 2 */
  syncGap: 2,
  /** .front padding 1 7 radius 9 */
  front: { pad: [1, 7, 1, 7] as [number, number, number, number], radius: 9 },
  /** .el 20 원 */
  element: 20,
  /** .weak height 20 padding 0 6 radius 10 gap 2 */
  weak: { h: 20, pad: [0, 6, 0, 6] as [number, number, number, number], radius: 10, gap: 2 },
  /** .slots gap 3, .sl 12 radius 2 ring 1.5 */
  slots: { gap: 3, size: 12, radius: 2, ring: 1.5 },
};

/** .intent height 32 padding 0 10 0 5 radius 16 gap 5 (.debuff radius 6) */
export const INTENT = {
  h: 32, pad: [0, 10, 0, 5] as [number, number, number, number], radius: 16, debuffRadius: 6, gap: 5,
  ring: 1, chargeRing: 1.5, debuffRing: 1.5,
  /** .ord 20 원 (.debuff 는 radius 5) */
  order: 20, orderDebuffRadius: 5,
  /** .inti 16 */
  icon: 16,
  /** .tface 22, 바깥 테 1.5 */
  face: 22, faceRing: 1.5,
};

/** .band top 646 ~ 아래 끝, inset 0 1px 0 glass-line */
export const BAND = { top: 646, line: 1 };

/** .mana left 22 top 672 80×80, inset 1.5 테, padding-top 16 · .ml bottom 13 */
export const MANA = { x: 22, y: 672, d: 80, ring: 1.5, padTop: 16, labelBottom: 13 };

/** .hand left 120 top 657 gap 8 · .grp padding 5 gap 4 radius 11 테 1 · .gface 26 top -15 바깥 테 2 */
export const HAND = {
  x: 120, y: 657, gap: 8,
  group: { pad: 5, gap: 4, radius: 11, ring: 1 },
  face: { d: 26, top: -15, ring: 2 },
};

/** .endw left 1132 top 662 width 132 gap 6 · .end height 58 radius 12 테 1.5 · .piles padding 2 4 0 · .pile gap 3 · .pi 13 */
export const END = {
  x: 1132, y: 662, w: 132, gap: 6,
  button: { h: 58, radius: 12, ring: 1.5 },
  piles: { pad: [2, 4, 0, 4] as [number, number, number, number], gap: 3, icon: 13 },
};

/** .etip left 872 top 478 width 262 radius 12 padding 10 12 11 gap 5 line-height 1.45, 그림자 0 10 26
 *  .etip h4 gap 6 · h4 span padding 0 6 radius 8 테 1 */
export const ETIP = {
  x: 872, y: 478, w: 262, radius: 12, pad: [10, 12, 11, 12] as [number, number, number, number], gap: 5, lh: 1.45,
  ring: 1, shadow: { y: 10, blur: 26 },
  title: { gap: 6 }, rank: { padX: 6, radius: 8, ring: 1 },
};
