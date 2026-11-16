// 런 화면 공용 뼈대(0046: 왼쪽 열 + 오른쪽 정령 세 줄)의 배치 수치. 보상 라운드 E1 시안(0051)과 폴리싱 P1(0050)에서 잰 값이에요.
// 전투 결과·상점이 함께 써요. 시안 값은 임시예요(TODO_TOKEN). 색·글자 크기는 토큰(tokens.provisional.palette, tokens.provisional.text.result)에서 가져와요.
export const FRAME = { w: 1280, h: 800 };

/** 0050 격자: 바깥 여백 48, 왼쪽 열 48~612, 정령 줄 664~1232, 버튼 줄 660~708 */
export const GRID = { gutter: 48, colW: 564, lanesX: 664, lanesW: 568, buttonY: 660, buttonH: 48 };

/** .bg radial-gradient(70% 80% at 28% 45%, stageHi 0, floor 58%, stageLo 100%) */
export const BG = { rx: 0.7, ry: 0.8, cx: 0.28, cy: 0.45, mid: 0.58 };

/** .g3 left 48 top 30 height 36, 가운데 맞춤 gap 10 · 동전 24 · +n */
export const GOLD = { x: GRID.gutter, y: 30, h: 36, gap: 10, coin: 24 };

/** 카드 말풍선 아래 끝 ~ 카드 위 · .acd.dim (다른 카드를 보는 동안) */
export const CARD_FOCUS = { tipGap: 20, dim: 0.62 };

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

/** .info left 172(+1) width 204 (장비 칸 자리를 낸 폭, 0064 Q2-A), 세로 가운데(top 18 ~ 줄 아래) gap 10 */
export const INFO = {
  x: 173, top: 18, w: 204, gap: 10,
  /** .nm gap 10, 줄 높이 1.35 · .lv.up padding 0 9 0 6 높이 22 radius 11 gap 4 기호 13 */
  name: { gap: 10, lh: 1.35 }, levelUp: { h: 22, radius: 11, pad: [0, 9, 0, 6] as [number, number, number, number], gap: 4, icon: 13, alpha: 0.34 },
  /** .hp3 gap 7 · .hpv baseline gap 4 · .bar 190×10 (0064 Q2-A 폭) */
  hp: { gap: 7, numGap: 4, bar: { w: 190, h: 10 }, minFill: 0.022 },
  /** .stats3 gap 16 · .st3 padding 1 8 1 6 margin-left -6 gap 6 기호 15 (.on 17) · 밝히지 않은 능력치 .4 */
  stats: { gap: 16, pad: [1, 8, 1, 6] as [number, number, number, number], ml: -6, iconGap: 6, icon: 15, iconOn: 17, dim: 0.4 },
  /** .chip3.new 높이 24 radius 11 padding 0 9 gap 5 기호 14 · 바탕 acc .28 */
  chip: { h: 24, radius: 11, padX: 9, gap: 5, icon: 14, alpha: 0.28, rowGap: 8 },
};

/** .cslot left 456(+1) (0064 Q2-A) top 18 96×134 radius 8 점선 · .pick.hot 바깥 3px accHi + 빛 22 (.35) · 작은 카드 left 2 top 2.5 */
export const SOCKET = {
  x: 457, y: 19, w: 96, h: 134, radius: 8, ring: 1, dash: 4, lineAlpha: 0.15,
  card: { x: 2, y: 2.5 }, hot: { ring: 3, glow: 22, glowAlpha: 0.35 },
  /** .sock.ok 이 줄이 받을 수 있음: 점선 accHi + 바탕 accHi .07 */
  okFill: 0.07,
  /** .dk3 덱 장수 a→b: 칸 아래 가운데 (줄 y + 161, 높이 30), 기호 18 gap 6 */
  deck: { y: 161, h: 30, icon: 18, gap: 6 },
};

/** 장비 칸 (0064 Q2-A): .slots left 384(+1) 세로 가운데 gap 10 · .slot 60×60 radius 10 (바탕 veil .05, 테 veil .2)
 *  그림 inset 4 8 4 2 · 빈 칸은 점선 veil .24 · .cand 점선 accHi · .ghost 점선 accHi + pvFill, 그림 .8 · .hov 바깥 3px accHi .16 */
export const EQUIP_SLOT = {
  x: 385, size: 60, gap: 10, radius: 10, ring: 1, dash: 4,
  art: { x: 2, y: 4, w: 50, h: 52 }, emptyLine: 0.24, ghostArt: 0.8,
  hot: { outer: 3, alpha: 0.16 },
  /** .pips 오른쪽 4, 세로 가운데, 아래에서 위로 gap 3 · .p 5×5 테 1 veil .4 · .on ink2 */
  pip: { d: 5, gap: 3, right: 4, ring: 1, offLine: 0.4 },
  /** .rar left -5 top -5 · 마름모 9×9 (45°) radius 1.5, 바깥 테 2 · 둘째는 12 옆 (전설) */
  mark: { x: -5, y: -5, d: 9, outline: 2, step: 12 },
  /** .old 내려놓을 장비: right -13 bottom -13 지름 32, 테 1 danger, 그림 inset 3 (.7), 빗금 1.5 */
  old: { d: 32, out: 13, inset: 3, alpha: 0.7, line: 1.5 },
};

/** 평소 자리의 작은 칸 (0064 Q2-A f5 · 0066). s32 = 정령 관리 이름 카드 (.s32 .slot), s24 = 전투 유닛 풀이 (.bslot)
 *  표식: left -3 top -3, 마름모 6 / 5, 바깥 테 1.5, 둘째는 8 / 7 옆 · 공명 점(.pips.big): 칸 아래 10, 지름 8 gap 5 */
export const EQUIP_MINI = {
  s32: { size: 32, radius: 6, ring: 1, dash: 4, inset: 2, emptyLine: 0.24, hot: { outer: 3, alpha: 0.16 }, mark: { x: -3, y: -3, d: 6, outline: 1.5, step: 8 } },
  s24: { size: 24, radius: 5, ring: 1, dash: 4, inset: 1, emptyLine: 0.24, hot: { outer: 2, alpha: 0.2 }, mark: { x: -3, y: -3, d: 5, outline: 1.5, step: 7 } },
  pip: { mt: 10, d: 8, gap: 5, ring: 1, offLine: 0.4 },
};

/** .row.dim 받을 수 없는 줄의 내용 .38 (0064 Q2-A) */
export const LANE_PREVIEW = { dim: 0.38 };

/** 장비 말풍선 (0064 Q2-A .tip.t2): padding 12 14 14 radius 12, 테 veil .2, 그림자 0 10 28 (.4)
 *  폭 268 · 기술 카드가 붙으면 300 · 오른쪽 끝 = 정령 줄 왼쪽 - 12 · 꼬리 10×10 45° */
export const EQUIP_TIP = {
  w: { plain: 268, card: 300 }, pad: [12, 14, 14, 14] as [number, number, number, number], radius: 12, ring: 1,
  shadow: { y: 10, blur: 28 }, gapToLane: 12, edge: 30, tail: 10, belowStrip: 12,
  /** .tt gap 8 · 그림 28 · 꼬리표 padding 1 7 radius 8 gap 5 (마름모 6) · 공명 점 7 gap 4 */
  head: { gap: 8, thumb: 28, tag: { padX: 7, padY: 1, radius: 8, gap: 5, mark: { d: 6, outline: 0, step: 9 } }, pip: { d: 7, gap: 4, ring: 1, offLine: 0.4 } },
  /** .chg margin-top 10 gap 14 · .ab2 gap 7 기호 15 */
  stat: { mt: 10, gap: 14, iconGap: 7, icon: 15 },
  /** 기술 카드 + 오른쪽 효과문: margin-top 10 gap 12 */
  card: { mt: 10, gap: 12 },
  /** .tip p margin-top 7 line-height 1.6 */
  line: { mt: 7, lh: 1.6 },
  /** 내려놓는 장비: 위 선까지 12, 선 아래 12 · 그림 24 (.75) · 흐린 기호 .5 */
  drop: { mt: 12, pt: 12, thumb: 24, thumbAlpha: 0.75, dim: 0.5 },
};

/** .btn2.quiet.b3 떠나기: 166×48 radius 12 gap 10 기호 18 */
export const LEAVE = { x: GRID.gutter, y: GRID.buttonY, w: 166, h: GRID.buttonH, radius: 12, gap: 10, icon: 18 };

/** 덱에서 고르기 (P1 f4, 상점 빼기 · 휴식 강화 · 이벤트, 0046): 정령 줄마다 그 정령의 덱 한 줄. 줄 위에서 40 내려온 곳, 카드 92 간격 26. 장수가 많으면 간격을 좁혀 폭 564에 맞춰요
 *  .rmmark 고른 카드 오른쪽 위 − 표식: 원 26 (바깥 테 3), 카드 밖으로 12 · 22
 *  확인 줄: 카드 줄 아래 22, 높이 44 · 취소 132 + 12 + 빼기 168, 오른쪽 끝 맞춤 */
export const DECK_PICK = {
  x: GRID.gutter, w: 564, dy: 40, step: 118, lift: 10,
  mark: { d: 26, ring: 3, dx: 12, dy: 22, bar: { w: 10, h: 2 } },
  /** 강화 미리보기 (정리안 f7): 고른 카드 오른쪽에 화살표 칸을 두고 강화한 카드를 끼워요. 뒤 카드는 그만큼 밀려요 */
  upgrade: { arrow: 22 },
  confirm: { dy: 151, h: 44, radius: 12, gap: 12, cancelW: 132, okW: 168, icon: 18, inner: 10, coin: 14, coinGap: 5 },
};

/** 선택지 판 (정리안 .opts · .opt, 휴식 · 이벤트 같은 부품): 왼쪽 열 폭, 첫 판 top 316, 판 사이 14
 *  padding 16 20 radius 12, 이름 · 효과문 gap 6 (효과문 줄 높이 1.5) · .opt.hov 테 accHi + 바깥 4px accHi .14 · 고를 수 없으면 .4 */
export const CHOICE = {
  x: GRID.gutter, w: GRID.colW, top: 316, gap: 14, pad: [16, 20, 16, 20] as [number, number, number, number],
  radius: 12, inner: 6, textLh: 1.5, hot: { outer: 4, alpha: 0.14 }, offAlpha: 0.4, belowStory: 24,
};

/** 이벤트 이름 줄 · 상황 글 (정리안 .evt · .evx): 상황 글 top 206 폭 564 줄 높이 1.6, 이름 줄은 그 위 gap 14 (A1 .event) */
export const STORY = { x: GRID.gutter, w: GRID.colW, top: 206, gap: 14, lh: 1.6, titleLh: 1.35 };

/** 판 결과 왼쪽 열 (정리안 .runleft · .rec · .keep · .onlybox): top 84, 줄 사이 22
 *  "이번 판에서만" 점선 상자: 테 1.5 dashed veil .22, padding 22 20 18, 줄 사이 12, radius 12 · 줄 높이 28 · 기호 18 gap 10
 *  배운 카드 썸네일 .tcard 46×65 (카드 .5배) gap 6, 넘치면 겹쳐요 · 버튼 두 개 166×48 gap 16, 버튼 줄(660) */
export const RUN_END = {
  x: GRID.gutter, top: 84, w: GRID.colW, gap: 22, recordLh: 1.35, keepGap: 8, keepIcon: 16,
  only: { ring: 1.5, dash: 6, lineAlpha: 0.22, pad: [22, 20, 18, 20] as [number, number, number, number], gap: 12, radius: 12, rowH: 28, icon: 18, iconGap: 10 },
  thumb: { w: 46, gap: 6 },
  button: { w: 166, h: GRID.buttonH, gap: 16, radius: 12, y: GRID.buttonY },
};
