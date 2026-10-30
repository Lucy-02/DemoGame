// 정령 관리 화면 배치 수치. 모두 정본 design/canon/spirit-r4v5/page.html "정령 관리 R4" CSS에서 옮겼고, 주석에 선택자를 적어요.
// 색·글자 크기는 토큰(tokens.provisional.palette, tokens.provisional.text.spirits)에서 가져와요.

export const FRAME = { w: 1280, h: 800 };

/** .c-bg radial-gradient(58% 72% at 50% 40%, wall-hi, wall 55%, wall-lo) */
export const BG = { rx: 0.58, ry: 0.72, cx: 0.5, cy: 0.4, mid: 0.55 };
/** .c-scrim: to top scrim→0 34% · to right .28→0 28% · to bottom .3→0 14% (rgba(22,20,19,…)) */
export const SCRIM = { bottomTo: 0.34, left: { a: 0.28, to: 0.28 }, top: { a: 0.3, to: 0.14 } };

/** 일러스트 자리 (유체 자리표시 .q-phb 350,210 420 원 · .q-phs 440,330 240×288). 패널을 접으면 오른쪽으로 80 (.q.closed …translateX(80px)) */
export const ART = { glow: { x: 350, y: 210, d: 420 }, body: { x: 440, y: 330, w: 240, h: 288 }, closedShift: 80 };

/** .tb height 52 padding 0 20 gap 10, 아래 1px 선 · .tb-back gap 4 · .res gap 6, .ri 16 */
export const TOP = { h: 52, padX: 20, gap: 10, line: 1, backGap: 4, backIcon: 14, resGap: 6, resIcon: 16 };

/** .q-id left 20 top 72 width 300 padding 16 20 16 radius 16 gap 8 */
export const ID = {
  x: 20, y: 72, w: 300, pad: [16, 20, 16, 20] as [number, number, number, number], radius: 16, gap: 8,
  /** .q-sc.lg line-height 22 padding 0 10 radius 11, svg 11, gap 4 */
  stage: { h: 22, padX: 10, radius: 11, icon: 11, gap: 4 },
  /** .q-name line-height 1.08 */
  nameLh: 1.08,
  /** .q-tags gap 4 12, svg 14 gap 4 */
  tags: { gap: 12, icon: 14, iconGap: 4 },
  /** .q-perl gap 8 · .per padding 2 10 radius 6 */
  per: { gap: 8, pad: [2, 10, 2, 10] as [number, number, number, number], radius: 6 },
  /** .q-stats margin-top 6 padding-top 12 border-top 1 gap 8 · .q-st gap 2 · b line-height 1.1 */
  stats: { mt: 6, pt: 12, line: 1, gap: 2, valueLh: 1.1 },
};

/** .q-panel right 20 top 72 460×548 radius 16 */
export const PANEL = {
  right: 20, y: 72, w: 460, h: 548, radius: 16,
  /** .q-tabs height 48 padding 0 12 · .q-tab padding 0 12, 밑줄 2 · .q-tc margin-left 6 · .q-badge.inl 17 ml 4 svg 10 */
  tabs: { h: 48, padX: 12, tabPadX: 12, underline: 2, countMl: 6, badge: 17, badgeIcon: 10, badgeMl: 4 },
  /** .q-x padding 0 4 0 10 gap 5 svg 12 */
  close: { pad: [0, 4, 0, 10] as [number, number, number, number], gap: 5, icon: 12 },
  /** .q-body padding 18 24 20 gap 18 · .q-sec gap 10 · h4 gap 8 */
  body: { pad: [18, 24, 20, 24] as [number, number, number, number], gap: 18, secGap: 10, headGap: 8 },
  /** .q-body.ov .q-sb grid 56 1fr 30, gap 14 12 · .q-bar height 6 radius 3 · .q-lg gap 6, i 10×4 */
  statGrid: { labelW: 56, valueW: 30, rowGap: 14, colGap: 12, bar: 6, legend: { gap: 6, w: 10, h: 4, ml: 6 } },
  /** .q-act height 48 radius 12 */
  action: { h: 48, radius: 12 },
  /** 작은 버튼 .q-learn height 30 padding 0 16, .btn radius 8 */
  small: { h: 30, padX: 16, radius: 8 },
  /** 막대 폭 = 값 / 40 (정본 aria "기본 28" → 70%) */
  statMax: 40,
  /** .cs-gw gap 6 · .cs-gr 16 / 96 / 1fr, gap 0 12, padding 8 10 8 0, radius 12 · .cs-gn 16, margin-top 3, 지금 4px 테 · ::before left 7 w 2 */
  growth: {
    gap: 6, dot: 16, dotMt: 3, nowRing: 4, colW: 96, colGap: 12, pad: [8, 10, 8, 0] as [number, number, number, number], radius: 12,
    spine: { x: 7, w: 2 },
    /** .cs-gl gap 5 · h4 line-height 1.2 · .cs-gu margin-top 4 gap 2 */
    headGap: 5, headLh: 1.2, listGap: 2,
    /** 경험 막대 .q-prog.big height 4 */
    exp: 4,
  },
  /** .q-awk padding-top 14 border-top 1 · .q-awkb gap 12 */
  foot: { pt: 14, line: 1, gap: 12 },
  /** .q-eps li height 52 gap 12 border-top 1 · .q-epn 26 */
  episode: { h: 52, gap: 12, num: 26 },
};

/** .q-rail right 20 top 72 56×548 radius 16 padding 6 0 · .q-rt gap 10 · .q-badge.rt top 12 18, svg 11 */
export const RAIL = { right: 20, y: 72, w: 56, h: 548, radius: 16, padY: 6, gap: 10, badge: 18, badgeIcon: 11, badgeTop: 12 };

/** 할 일 버튼 .q-fbtn height 40 radius 10 (요약 카드·성장 길 키우기) */
export const BIG_BUTTON = { h: 40, radius: 10, padX: 16 };

/** .q-facts right 96 top 120 width 264 gap 12 · .q-f padding 11 14 13 radius 12 gap 7 */
export const FACTS = {
  right: 96, y: 120, w: 264, gap: 12, pad: [11, 14, 13, 14] as [number, number, number, number], radius: 12, innerGap: 7,
  /** .q-fv gap 6 · .fin gap 8 svg 15 */
  valueGap: 6, finGap: 8, finIcon: 15,
  /** .q-cells gap 4, i 13×18 radius 2, 테 1.5 */
  cells: { w: 13, h: 18, radius: 2, gap: 4, ring: 1.5 },
  /** 유대 막대 = 다음 단계 막대와 같은 .q-prog.big 4 */
  bar: 4,
};

/** .q-strip bottom 0 height 164 gap 24 padding 0 24 위 1px 선 */
export const STRIP = {
  h: 164, gap: 24, padX: 24, line: 1,
  /** .q-sh width 200 gap 10 · h3 gap 8 · .q-tools gap 6 */
  head: { w: 200, gap: 10, titleGap: 8, toolsGap: 6 },
  /** .q-sort height 28 padding 0 10 radius 8 gap 4 svg 12 · .q-filt gap 4, span 30×26 radius 7 svg 14 */
  sort: { h: 28, padX: 10, radius: 8, gap: 4, icon: 12 },
  filter: { w: 30, h: 26, radius: 7, gap: 4, icon: 14 },
  /** .q-party padding-top 8 border-top 1 gap 8 · b margin-left 4 · .q-pbtn height 28 padding 0 10 radius 8 */
  party: { pt: 8, line: 1, gap: 8, numMl: 4, button: { h: 28, padX: 10, radius: 8 } },
  /** .q-tiles gap 12 · .q-tile 96 padding 8 6 10 radius 12, 고른 타일 테 1.5, 위 꼭지 6 (top -9) */
  tiles: { gap: 12 },
  tile: {
    w: 96, pad: [8, 6, 10, 6] as [number, number, number, number], radius: 12, selRing: 1.5, caret: 6, caretTop: -9,
    /** 타일 사이 세로선: left -6.5, top·bottom 20 */
    divider: { x: -6.5, inset: 20 },
  },
  /** .q-ring 76, 원 r 34 stroke 3.5 · 최종은 1.5 · .q-face inset 8 */
  ring: { d: 76, r: 34, stroke: 3.5, finalStroke: 1.5, faceInset: 8 },
  /** .q-sc line-height 16 padding 0 7 radius 8, svg 9, 테 1, bottom -8 가운데 */
  chip: { h: 16, padX: 7, radius: 8, icon: 9, gap: 4, bottom: -8, ring: 1 },
  /** .q-flag left -3 top -3 20, svg 11 · .q-badge.corner right -3 top -3 20, svg 12, 바깥 3 */
  flag: { d: 20, at: -3, icon: 11 },
  badge: { d: 20, at: -3, icon: 12, outer: 3 },
  /** .q-tn margin-top 15 gap 4 · .eli 11 */
  name: { mt: 15, gap: 4, icon: 11 },
};

/** 배지 공통 (.q-badge 20, svg 12) · 버튼 위 배지 .onbtn right -6 top -6 */
export const BADGE = { d: 20, icon: 12, onButton: -6 };
