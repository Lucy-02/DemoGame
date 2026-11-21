// 전투 화면 배치 수치. 모두 정본 CSS(design/canon/battle-r5/frame-old.css, r5.css)에서 옮겼고, 주석에 선택자를 적어요.
// 색·글자 크기는 여기 두지 않고 토큰(tokens.provisional.palette, tokens.provisional.text)에서 가져와요.

import { tokens } from "../../design/tokens";

/** 순서표 토큰 그리기 값 (Lucy가 0074 시안에서 고른 값) */
const OT = tokens.provisional.order;

export const FRAME = { w: 1280, h: 800 }; // .frame

/** .bg radial-gradient(60% 70% at 50% 34%, wall-hi, wall 50%, wall-lo) */
export const BG = { rx: 0.6, ry: 0.7, cx: 0.5, cy: 0.34, mid: 0.5 };
/** .floor top:330px, linear-gradient(rgba(35,33,32,0), .55 30%, .9) */
export const FLOOR = { top: 330, stops: [[0, 0], [0.3, 0.55], [1, 0.9]] as const };


/** .sys right:16px top:10px gap:6px; .ib 34px; .ic 16px */
export const SYS = { right: 16, top: 10, gap: 6, button: 34, icon: 16 };
/** 오른쪽 위 버튼 셋(덱 · 기록 · 설정)이 차지하는 폭 */
const SYS_W = 3 * SYS.button + 2 * SYS.gap;

/** 순서표: 0074 시안(https://claude.ai/artifact/2Dn6Yso4LzqHk57eLj6xyg) 값 그대로 (Lucy 2026-11-16 "시안대로"). 화면 가운데 위 한 줄 판 (0038).
 *  얼굴 크기 · 판 높이 · 모서리는 0160에서 줄였어요 (Lucy 2026-11-21 "얼굴 34"): 시안 값은 얼굴 40 · 높이 64 · 모서리 22 */
const ORDER_FACE = 34;
export const ORDER = {
  cx: FRAME.w / 2, top: 10, h: 58, padX: 16, radius: 18,
  /** 판은 가운데에서 자라다 오른쪽 위 버튼 앞에서 멈춰요 (0160). 버튼과의 틈 = 버튼의 화면 여백 */
  maxW: FRAME.w - 2 * (SYS.right + SYS_W + SYS.right),
  /** .rt .head padding-right 14, margin-right 4, border-right 1 (height 38) · .tn gap 6 · .dot 6 */
  head: { padR: 14, mr: 4, h: 38, line: 1, gap: 6, dot: 6, playRing: 1.5 },
  /** 재생 위치 선 (.ph): width 2 height 44 margin 0 3 radius 1. 재생 중 점 (.dot.play): 테 1.5 */
  cursor: { w: 2, h: 44, mx: 3, radius: 1 },
  /** .rt .ln width 18 height 1 */
  line: { w: 18, h: 1, min: 4 },
  /** .tok.en gap 4, padding 0 4 · .num width 10 */
  enemy: { gap: 4, padX: 4, numW: 10 },
  /** 적 얼굴 34 (0160) · 자리 그림 .fc svg 62% */
  face: ORDER_FACE, art: ORDER_FACE * 0.62,
  /** 아군 토큰 얼굴 = 적 얼굴 × allyScale (0074) */
  allyFace: ORDER_FACE * OT.allyScale,
  /** 테 (0074 토큰 그리기 규칙): 모든 테가 같은 굵기 · 같은 간격, 얼굴 원만 감싸는 정원. dash = 점선 테의 선 · 틈 (시안 border dashed) */
  ring: { w: OT.ring.width, gap: OT.ring.gap, dash: [OT.ring.width * 2, OT.ring.width * 2] as [number, number] },
  /** 배지 (0074): 지름 = 얼굴 지름 × ratio, 가운데가 얼굴 원 둘레 deg 자리.
   *  시안 .disc>.bg: 판 색 바깥 테 box-shadow 0 0 0 1.5, 상태 테 border 1.5 (점선은 선 3 · 틈 2), 기호 68%, 글자(✦) 62% */
  badge: { ratio: OT.badge.ratio, deg: OT.badge.deg, outline: 1.5, border: 1.5, dash: [3, 2] as [number, number], icon: 0.68 },
  /** 아군 묶음 (.rt .bun): gap 10, padding 6, 테 1 */
  bundle: { gap: 10, pad: 6, ring: 1, max: OT.bundleMax, reserve: 2 },
  /** 방전 띠 (0096 시안 .band): 묶음 안의 어두운 홈. 머리 = 충격 기호 + 피해 수 (gap 2), 내용과 gap 6, 빈 띠는 토큰 한 자리 폭 */
  band: { padX: 6, padY: 3, icon: 12, inGap: 2, gap: 6 },
  /** "+n" 칩 (.more): padding 2 7, 테 1 */
  more: { padX: 7, padY: 2, ring: 1 },
  /** 흐림: 지나간 토큰 (0074 8번) · 든 카드 자리 (시안 held .62) · 끊긴 적 얼굴 (시안 faceOp .4) */
  fade: { past: OT.pastOpacity, held: 0.62, cutFace: 0.4 },
};

// ── 필드 줄: 유닛 85%, 간격 72% (Lucy 2026-11-13, 정본 R5 값을 줄인 임시 값).
// 유닛 정보는 "캡슐 막대 V1(두 줄)" 시안 (R3-1 rev 6, Lucy 2026-11-14). 시안에서 새로 지은 임시 값이고, 주석에 시안 선택자를 적어요.

/** 아군 가운데 x 198·322·446 (간격 72%, 가운데 322), 발 y 338. 그림 자리는 정본 .ally .body 110×132의 85% */
export const ALLY = {
  xs: [198, 322, 446], feet: 338,
  body: { w: 94, h: 112 },
  /** 정령 그림 맞춤 (0109, 임시 값): 높이는 칸 그대로, 이펙트가 넓은 성체 · 각성체 그림은 폭이 칸의 over배까지 넘쳐도 돼요.
   *  가로는 얼굴(몸통) 가운데를 칸 가운데에 두되 칸 폭의 shift배까지만 옮겨요.
   *  baby = 유체는 칸의 이만큼 (0158, Lucy 2026-11-20: 약 78px, "작음" 등급 적과 같은 키).
   *  stages = 전투에 정령 그림을 세우는 성장 단계 (0146). 성체 · 각성체는 전투용 그림(SD 등)이 따로 올 때까지 자리표시예요. 되돌리려면 여기에 "adult", "awakened"를 넣어요 */
  art: { over: 1.35, shift: 0.15, baby: 0.7, stages: ["baby"] as readonly string[] },
};

/** 적 가운데 x 805·941·1077 (간격 72%, 가운데 941), 의도 알약 top 212, 발 y 344.
 *  그림 상자는 정본 .enemy .body 132×106 · .ensvg 120×96의 85%. mt = 의도 알약 아래 끝에서 그림 상자 위 끝까지 */
export const ENEMY = {
  /** top = 의도 알약의 기본 줄 (작은 적), feet = 발 선 */
  top: 212, feet: 344,
  /** body.w = 피해 숫자가 뜨는 자리의 폭 상한 · body.mt = 알약 아래 여백 · art = 그림이 없는 적의 자리표시 크기 */
  body: { w: 112, mt: 14 }, art: { w: 102, h: 82 },
  /** 땅속 (0096 시안 .sunk): 몸 윗부분만 이만큼 남아요 (시안 임시 값) */
  buried: 0.4,
  /** 도감 크기대로 세우기 (0158): 적은 균일한 칸 대신 몸 폭만큼 자리를 차지해요.
   *  field = 적들이 서는 가로 범위 (가운데 정렬, 넘치면 왼쪽으로 밀려요) · gap = 자리 사이 · slotPad = 체력 막대 양옆 여유 */
  field: { left: 610, center: 941, right: 1262, gap: 14, slotPad: 8 },
  /** 크기 등급 (enemyFit.json의 size): 그림을 h × w 상자 안에 비율대로 맞춘 값이 enemyFit의 h · w예요. bar = 체력 막대 폭 (네 단계) */
  sizes: {
    XS: { h: 58, w: 96, bar: 88 }, S: { h: 78, w: 100, bar: 88 }, M: { h: 104, w: 132, bar: 104 },
    L: { h: 136, w: 176, bar: 136 }, XL: { h: 172, w: 236, bar: 136 }, B: { h: 212, w: 290, bar: 184 },
  },
  /** 의도 알약은 머리 위 이만큼 (작은 적은 ENEMY.top 줄에 그대로) */
  intentGap: 12,
  /** 그림자: 몸 폭의 ratio배 (떠 있는 적은 float배 · 옅게), 폭은 min 이상, 두께는 기본의 thick 범위 */
  shadow: { ratio: 0.82, float: 0.5, floatAlpha: 0.6, min: 44, thick: [0.8, 2] as [number, number] },
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
  /** 특성 칩 (0072 7번, 0096 시안 .chip.sq): 상태 칩과 같은 높이 · 기호, 둥근 네모 */
  trait: { pad: [0, 2, 0, 2] as [number, number, number, number], radius: 5 },
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


/** 첫 판 안내의 짚는 테 (0088): 굵기는 가리킨 의도 알약의 테(.intent.on), 대상과의 틈은 손패 카드 사이 틈 */
export const GUIDE = { ring: INTENT.onRing, gap: HAND.group.gap };

/** 집음·조준 미리보기 (.fld-pv, page.html·r5.css) */
export const PREVIEW = {
  /** 대상 강조: 정본 .ring.aim의 바깥 빛(box-shadow 0 0 14)을 그림 뒤에 깔아요. 발밑 고리(타원)는 0013 후속으로 뺐어요 */
  lit: { glow: 14 },
  /** .hits left -14 top -6 gap 4 · .hit height 24 padding 0 8 0 6 radius 13 gap 2, translateX(d×14) · .hti 13 */
  hits: { left: -14, top: -6, gap: 4, h: 24, pad: [0, 8, 0, 6] as [number, number, number, number], radius: 13, inGap: 2, step: 14, icon: 13 },
  /** .intent.cut inset 1.5, .amt text-decoration-thickness 2 */
  intentCut: { ring: 1.5, strike: 2 },
};

/** 손패에서 카드를 가리킬 때 (0161): 가리킨 카드는 큰 얼굴로 펼쳐지고(card/layout BIG_CARD.peek), 집은 카드는 작은 얼굴 그대로 30 떠올라요.
 *  dim = 대상이 아닌 것을 흐리는 값, edge = 화면 가장자리 여백 */
export const HOVER = { lift: 30, dim: 0.62, edge: 8 };

/** 대상 고르기 (결정 0013, 정본 아님 · Lucy 확인 전 임시 값).
 *  dim: 대상이 아닌 캐릭터를 어둡게 (밝기 배수) = 손패 호버 흐림 .62를 그대로 써요.
 *  drag: 끄는 카드. threshold = 누른 채 이만큼 움직이면 끌기(그 전에 떼면 클릭으로 집기), scale = 필드 위에서 크기,
 *  overTarget = 대상 위에서 불투명도(흐림과 같은 값), depth = 맨 위 */
export const TARGETING = { dim: HOVER.dim };
export const DRAG = { threshold: 6, scale: 0.6, overTarget: HOVER.dim, depth: 1000 };

/** 가운데 고르기 창 (0075, 낙하 · 품기 공용). 화면 한가운데에 제목 · 카드 · 버튼을 한 덩어리로 놓아요.
 *  Lucy 2026-11-16 "카드 크기 증가, 여백 증가, 더 어둡게, 가운데 정렬": 카드 = 큰 얼굴 (0161, card/layout BIG_CARD),
 *  카드 사이 28(전투 위 창 열 사이), 제목 · 카드 · 버튼 사이 48(런 화면 격자 여백), 버튼 = 턴 종료 버튼. 모두 임시 값이에요 */
export const PICK = {
  gap: 28, pad: 48,
  cx: FRAME.w / 2, cy: FRAME.h / 2, button: { w: END.w, ...END.button }, depth: DRAG.depth - 1,
};
