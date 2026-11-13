// 전투 화면 배치 수치. 모두 정본 CSS(design/canon/battle-r5/frame-old.css, r5.css)에서 옮겼고, 주석에 선택자를 적어요.
// 색·글자 크기는 여기 두지 않고 토큰(tokens.provisional.palette, tokens.provisional.text)에서 가져와요.

export const FRAME = { w: 1280, h: 800 }; // .frame

/** .bg radial-gradient(60% 70% at 50% 34%, wall-hi, wall 50%, wall-lo) */
export const BG = { rx: 0.6, ry: 0.7, cx: 0.5, cy: 0.34, mid: 0.5 };
/** .floor top:330px, linear-gradient(rgba(35,33,32,0), .55 30%, .9) */
export const FLOOR = { top: 330, stops: [[0, 0], [0.3, 0.55], [1, 0.9]] as const };


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

// ── 필드 줄: 전투 정보판 C안 (Lucy 2026-11-13 "C + 약점 표지 상시", 시안 https://claude.ai/artifact/RyrFUdM6pkHfWXPZc2NEPH).
// 유닛 85%, 간격 72%. 시안에서 새로 지은 임시 값이에요 (정본 R5 값을 줄인 것). 주석에 시안 선택자를 적어요.

/** 아군 가운데 x 198·322·446 (간격 72%, 가운데 322), 발 y 338. 그림 자리는 정본 .ally .body 110×132의 85% */
export const ALLY = {
  xs: [198, 322, 446], feet: 338,
  body: { w: 94, h: 112 },
};

/** 적 가운데 x 805·941·1077 (간격 72%, 가운데 941), 의도 알약 top 212, 발 y 344.
 *  그림 상자는 정본 .enemy .body 132×106 · .ensvg 120×96의 85%. mt = 의도 알약 아래 끝에서 그림 상자 위 끝까지 */
export const ENEMY = {
  xs: [805, 941, 1077], top: 212, feet: 344,
  body: { w: 112, h: 90, mt: 14 }, art: { w: 102, h: 82 },
};

/** .ground 104×14, 발 y에 가운데. radial-gradient(closest-side, shade, transparent) */
export const GROUND = { w: 104, h: 14 };

/** 정보판 (.col .plate). 두 줄이고 늘어나지 않아요. 자세한 것은 가리키면 판 아래 설명판에 (0067 추기) */
export const INFO = {
  /** .col top = 발 + 10 */
  mt: 10,
  /** 판 폭 --pw 112 / 116 */
  allyW: 112, enemyW: 116,
  /** .plate padding 5 6 4, radius 8, gap 3 */
  pad: [5, 6, 4, 6] as [number, number, number, number], radius: 8, gap: 3,
  /** .r1 height 16 gap 5 · .r2 height 20 gap 4 */
  row1: { h: 16, gap: 5 }, row2: { h: 20, gap: 4 },
  /** .bar height 4 radius 2 min-width 26 · .ghost/.pv repeating-linear-gradient(135deg, c 0 2px, c2 2px 4px) */
  bar: { h: 4, radius: 2, minW: 26, stripeDeg: 135, stripe: 2 },
  /** .blk height 16 padding 0 4 0 2 radius 8 gap 1, .ic 11 */
  block: { h: 16, pad: [0, 4, 0, 2] as [number, number, number, number], radius: 8, gap: 1, icon: 11 },
  /** .st1 gap 1, .ic 12, em margin-left 2 */
  status: { gap: 1, icon: 12, moreMl: 2 },
  /** .inc gap 2, .ic 13 */
  incoming: { gap: 2, icon: 13 },
  /** .hpn .to margin 0 1 */
  arrowMargin: 1,
  /** .plate.lethal inset 1.5 danger · 조준 대상 .unit.aim .plate inset 1.5 acc-hi */
  lethalRing: 1.5, litRing: 1.5,
  /** 약점 표지 .weak 18, ::before inset 2 rotate(45deg) 테 1.5 radius 2, .ic 11 */
  weak: { size: 18, inset: 2, ring: 1.5, radius: 2, icon: 11 },
  /** 설명판 머리의 기호 줄 (.mrow gap 5 min-height 18) */
  tipRow: { gap: 5, minH: 18 },
  /** 설명판 머리 속성 원 (.elc 18, .ic 12) */
  element: { d: 18, icon: 12 },
  /** 설명판 상태 칩 (.chipS height 20 padding 0 6 0 4 radius 10 gap 2, .ic 12) */
  chip: { h: 20, pad: [0, 6, 0, 4] as [number, number, number, number], radius: 10, gap: 2, icon: 12 },
  /** .flag .ic 12 (앞열 깃발) */
  flag: { icon: 12 },
  /** .tag padding 1 6 radius 9, inset 1 */
  tag: { pad: [1, 6, 1, 6] as [number, number, number, number], radius: 9, ring: 1 },
  /** 장비 칸 줄 (0066): 아군 설명판 머리 끝, 칸 사이 5 */
  equipGap: 5,
  /** .col gap 6: 정보판과 설명판 사이 */
  tipGap: 6,
};

/** .intent top 212 height 28 padding 0 8 0 4 radius 14 gap 4 (.debuff radius 6) */
export const INTENT = {
  h: 28, pad: [0, 8, 0, 4] as [number, number, number, number], radius: 14, debuffRadius: 6, gap: 4,
  ring: 1, chargeRing: 1.5, debuffRing: 1.5,
  /** .o 18 원 (.debuff 는 radius 5) */
  order: 18, orderDebuffRadius: 5,
  /** .intent .ic 15 */
  icon: 15,
  /** .face 18, 바깥 테 1.5 */
  face: 18, faceRing: 1.5,
  /** 모든 아군 .all: 점 7 셋, 바깥 테 1.5, 겹침 1 (span+span margin-left -1) */
  all: { dot: 7, ring: 1.5, overlap: 1 },
};

/** .band top 646 ~ 아래 끝, inset 0 1px 0 glass-line */
export const BAND = { top: 646, line: 1 };

/** .mana left 22 top 672 80×80, inset 1.5 테, padding-top 16 · .ml bottom 13 */
export const MANA = { x: 22, y: 672, d: 80, ring: 1.5 };

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


/** 집음·조준 미리보기 (.fld-pv, page.html·r5.css) */
export const PREVIEW = {
  /** 대상 강조: 정본 .ring.aim의 바깥 빛(box-shadow 0 0 14)을 정보판·그림에 써요 (테는 INFO.litRing). 발밑 고리(타원)는 0013 후속으로 뺐어요 */
  lit: { glow: 14 },
  /** .hits left -14 top -6 gap 4 · .hit height 24 padding 0 8 0 6 radius 13 gap 2, translateX(d×14) · .hti 13 */
  hits: { left: -14, top: -6, gap: 4, h: 24, pad: [0, 8, 0, 6] as [number, number, number, number], radius: 13, inGap: 2, step: 14, icon: 13 },
  /** .intent.cut inset 1.5, .amt text-decoration-thickness 2 */
  intentCut: { ring: 1.5, strike: 2 },
  /** .rs-slot.cut::after left 2 right 2 top 50% height 2 rotate(-14deg) */
  orderCut: { inset: 2, h: 2, deg: -14 },
};

/** 손패 호버 H1 (r5 스크립트 "시안 값"): 든 카드 translateY(-30) scale(1.2), 같은 묶음 옆 카드 ±12,
 *  옆 묶음 ±10, 나머지 카드 opacity .62. 말풍선 아래 끝 y 598, 화면 가장자리 여백 8 */
export const HOVER = {
  lift: 30, scale: 1.2, shiftIn: 12, shiftGroup: 10, dim: 0.62,
  bubbleBottom: 598, edge: 8,
};

/** 대상 고르기 (결정 0013, 정본 아님 · Lucy 확인 전 임시 값).
 *  dim: 대상이 아닌 캐릭터를 어둡게 (밝기 배수) = 손패 호버 흐림 .62를 그대로 써요.
 *  drag: 끄는 카드. threshold = 누른 채 이만큼 움직이면 끌기(그 전에 떼면 클릭으로 집기), scale = 필드 위에서 크기,
 *  overTarget = 대상 위에서 불투명도(흐림과 같은 값), depth = 맨 위 */
export const TARGETING = { dim: HOVER.dim };
export const DRAG = { threshold: 6, scale: 0.6, overTarget: HOVER.dim, depth: 1000 };

/** 든 카드 크기·밀림. 말풍선은 들린 카드 위에서 정본과 같은 거리에 따라 올라가요. */
export interface LiftStyle {
  lift: number;
  scale: number;
  shiftIn: number;
  shiftGroup: number;
}

/** 들기 크기. 정본 H1(1.2배, ±12, ±10)은 옆 카드와 6.8px 떨어져서, Lucy가 들린 카드가 옆 카드를 살짝 덮는 b를 골랐어요
 *  (2026-10-30, 정본 아님 · 비교 후보 a 1.3/±8, c 1.5/±12는 뺐어요).
 *  덮는 폭 = 카드 폭 92 × (scale - 1) / 2 - (카드 사이 4 + shiftIn): b 4.4px. 떠오름 30은 정본 그대로.
 *  ?lift=h1 은 정본 값이에요 (pnpm visual 이 정본 프레임과 비교할 때 써요). */
export const LIFT_STYLES: Record<string, LiftStyle> = {
  h1: { lift: HOVER.lift, scale: HOVER.scale, shiftIn: HOVER.shiftIn, shiftGroup: HOVER.shiftGroup },
  b: { lift: 30, scale: 1.4, shiftIn: 10, shiftGroup: 10 },
};
export const LIFT: LiftStyle = LIFT_STYLES.b;
