// 전투 화면 배치 수치. 모두 정본 CSS(design/canon/battle-r5/frame-old.css, r5.css)에서 옮겼고, 주석에 선택자를 적어요.
// 색·글자 크기는 여기 두지 않고 토큰(tokens.provisional.palette, tokens.provisional.text)에서 가져와요.

export const FRAME = { w: 1280, h: 800 }; // .frame

/** .bg radial-gradient(60% 70% at 50% 34%, wall-hi, wall 50%, wall-lo) */
export const BG = { rx: 0.6, ry: 0.7, cx: 0.5, cy: 0.34, mid: 0.5 };
/** .floor top:330px, linear-gradient(rgba(35,33,32,0), .55 30%, .9) */
export const FLOOR = { top: 330, stops: [[0, 0], [0.3, 0.55], [1, 0.9]] as const };


/** .sys right:16px top:10px gap:6px; .ib 34px; .ic 16px */
export const SYS = { right: 16, top: 10, gap: 6, button: 34, icon: 16 };

/** 순서표 배율: 정본 R5 크기의 1.4배 (0038) */
export const ORDER_SCALE = 1.4;
const os = (n: number) => n * ORDER_SCALE;

/** 정본 .rs(top:10 height:40 padding 0 12 radius 18)의 1.4배를 화면 가운데 위에 (0038: 가운데 위 한 줄 판) */
export const ORDER = {
  cx: FRAME.w / 2, top: 10, h: os(40), padX: os(12), radius: os(18),
  /** .rs-me gap 6, ::before 6px 점 */
  meGap: os(6), meDot: os(6),
  /** .rs-ln 12×1, margin 0 4. 선 두께는 그대로 1 */
  line: { w: os(12), h: 1, mx: os(4) },
  /** .rs-slot height 32 padding 0 4 radius 14 gap 3 */
  slot: { h: os(32), padX: os(4), radius: os(14), gap: os(3), nowRing: 1.5 },
  /** .rs-n width 9 */
  numW: os(9),
  /** .rs-face 28, .rsf 24×20 */
  face: os(28), art: { w: os(24), h: os(20) },
  /** 행동 · 카드 기호 배지 (0074): 지름 = 얼굴 지름의 0.42배, 얼굴 원 둘레 45° 자리(오른쪽 아래). 안쪽 여백은 정본 .rsa padding 1 */
  badge: { ratio: 0.42, deg: 45, pad: os(1) },
  /** 아군 토큰 얼굴 = 적 얼굴의 0.8배 (0074) */
  allyFace: os(28) * 0.8,
  /** 묶음 하나에 보이는 얼굴 상한 N (0074). 넘으면 N−1개 + "+n" */
  bundleMax: 4,
  /** 머리 오른쪽 세로 구분선: 연결선과 같은 두께, 칸 높이 (0038 규격) */
  divider: { w: 1 },
};

// ── 필드 줄: 유닛 85%, 간격 72% (Lucy 2026-11-13, 정본 R5 값을 줄인 임시 값).
// 유닛 정보는 "캡슐 막대 V1(두 줄)" 시안 (R3-1 rev 6, Lucy 2026-11-14). 시안에서 새로 지은 임시 값이고, 주석에 시안 선택자를 적어요.

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

/** 유닛 정보 묶음 (.info.nv): 판 없이 발 가운데에 대칭. 첫 줄 = HP 막대 + 가운데 HP 수, 둘째 줄 = 기호 칩 */
export const INFO = {
  /** .info.nv top = 발 + 16, 폭 104 = 그림자 폭 */
  mt: 16, w: GROUND.w,
  /** .row height 20 */
  row: { h: 20 },
  /** .bar top 4 height 12 border 2 radius 6 · 치명 .loss 빗금 135deg 4px + 2px · 미리보기 .gone 빗금 2px + 2px
   *  · .pulse .bar 테 색 ink + 바깥 1.5 · margin = 구운 텍스처 바깥 여백 */
  bar: { top: 4, h: 12, line: 2, radius: 6, stripeDeg: 135, lethalStripe: [4, 2], pvStripe: [2, 2], pulseOutline: 1.5, margin: 2 },
  /** .hp 외곽선 2 (--ol) */
  hp: { outline: 2 },
  /** .chips gap 3px 4px, margin 3px -8px 0, min-height 24 */
  chips: { mt: 3, gap: 4, rowGap: 3, minH: 24, over: 8 },
  /** .el 22 원, border 2, 기호 16, 속성색 45% + paper */
  element: { d: 22, line: 2, icon: 16, mix: 0.45 },
  /** .blk height 20 border 2 padding 0 4 0 0 radius 5, 기호 16 */
  block: { h: 20, pad: [2, 6, 2, 2] as [number, number, number, number], radius: 5, line: 2, icon: 16 },
  /** .inc.ia height 20 gap 1 · .imp 16 (치명 20, 16갈래) · b padding-left 2, 외곽선 1.5 (--ol1)
   *  · .b-out stroke 6 · .b-in stroke 1.4 (24 눈금 기준) · 치명 갈래는 22.5° 돌린 별 */
  incoming: {
    h: 20, gap: 1, icon: 16, lethalIcon: 20, numMl: 2, outline: 1.5, back: 6, spike: 1.4, spikeDeg: 22.5, margin: 4,
    /** 충격 모양 (시안 BURST, 24 눈금) */
    grid: 24,
    burst: "M12 3.6L13.84 7.57L17.94 6.06L16.43 10.16L20.4 12L16.43 13.84L17.94 17.94L13.84 16.43L12 20.4L10.16 16.43L6.06 17.94L7.57 13.84L3.6 12L7.57 10.16L6.06 6.06L10.16 7.57z",
  },
  /** .weak 24 원 border 2 · i 테 2 · 십자 틈 4 · 기호 16, 속성색 60% + ink · .on scale 1.25, 테 inset -5 */
  weak: { d: 24, line: 2, ring: 2, gap: 4, icon: 16, mix: 0.6, on: { scale: 1.25, ringOut: 5 } },
  /** .st height 20 radius 10 padding 0 6 0 3 gap 1, 기호 16 */
  status: { h: 20, pad: [0, 6, 0, 3] as [number, number, number, number], radius: 10, gap: 1, icon: 16 },
  /** .flag 22, left x + 47, top 발 - 21, 외곽선 1.5 (drop-shadow 네 방향) */
  flag: { x: 47, y: -21, icon: 22, outline: 1.5 },
};

/** 가리킴 풀이: 묶음 바로 아래 (.nv .mt top 100% + 9). 화면 가장자리 여백 12 (.tip right 12)
 *  mark = 기호 한 줄 풀이 (.mt height 28 padding 0 10 radius 7 gap 6, 꼬리 10, .sep 3)
 *  unit = 유닛 풀이 (.tip padding 9 12 radius 8 gap 5, 줄 18 gap 6, 꼬리 12, .tag padding 1 6 radius 9, .tst gap 3 기호 12, .eq gap 5) */
export const TIP = {
  mt: 9, edge: 12, ring: 1, sep: 3,
  mark: { h: 28, padX: 10, radius: 7, gap: 6, tail: 10 },
  unit: { pad: [9, 12, 9, 12] as [number, number, number, number], radius: 8, gap: 5, line: { h: 18, gap: 6 }, tail: 12,
    tag: { pad: [1, 6, 1, 6] as [number, number, number, number], radius: 9, ring: 1 }, stat: { gap: 3, icon: 12 }, equipGap: 5 },
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
  /** .intent.on inset 1.5 ink (가리킨 유닛과 이어진 의도) */
  onRing: 1.5,
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
  /** 대상 강조: 정본 .ring.aim의 바깥 빛(box-shadow 0 0 14)을 그림 뒤에 깔아요. 발밑 고리(타원)는 0013 후속으로 뺐어요 */
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
