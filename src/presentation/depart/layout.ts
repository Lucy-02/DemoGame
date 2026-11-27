// 출전 준비 배치 (0078 J1). 깃들기 · 출전 준비 J1 시안(https://claude.ai/artifact/FsL7WxvqmjcMg4cNtVamHw) f5 · f6에서 잰 임시 값이에요 (TODO_TOKEN).

/** .win 메인 화면 위 가운데 유리 틀 (glass-d, 테 glass-line) padding 26 40 radius 20 · 그림자 0 30 80
 *  .top 높이 40 아래 18 · .bottom 위 22 gap 14 (오른쪽 맞춤) */
export const WIN = { pad: [26, 40, 26, 40] as [number, number, number, number], radius: 20, ring: 1, shadow: { y: 30, blur: 80 }, top: 40, topGap: 18, bottomGap: 22, btnGap: 14 };

/** .seat 300×430 gap 24 radius 16 테 1 · 앞열 테 2 자두빛 · 호버 테 veil .5
 *  .glow 위 300 radial(60% 60% at 50% 70%) ink .06 */
export const SEAT = {
  w: 300, h: 430, gap: 24, radius: 16, ring: 1, frontRing: 2,
  glow: { h: 300, rx: 0.6, ry: 0.6, cy: 0.7, alpha: 0.06 },
  /** 그림 아래 끝 280, 깃들기 무대의 0.72배 (정령 관리 화면 기준) · 실루엣 137×164 */
  art: { bottom: 280, k: 0.72, sil: { w: 137, h: 164 } },
  /** .flag 지름 40 left 16 top 16, 바탕 pvFill 테 1.5 자두빛, 기호 20 · 미리보기는 점선 .55 */
  flag: { x: 16, y: 16, d: 40, ring: 1.5, icon: 20, ghost: 0.55, dash: 4 },
  /** 작은 장비 칸 (0064 · EQUIP_MINI.s32): 오른쪽 16 위 16 */
  equip: { right: 16, top: 16, gap: 8 },
  /** .meta left 22 top 286 gap 7 · 이름 · Lv gap 8 · 기호 22 gap 12 · 칩 자리 30 */
  meta: { x: 22, y: 286, gap: 7, nameGap: 8, icon: 22, iconGap: 12 },
  /** 열린 성격 펼침 (라운드 H1 · 정리안 f8 가): 칩 아래 줄, 칩 사이 6 줄 사이 7. 말풍선은 그 아래 8. 값은 임시예요 */
  pick: { gap: 6, rowGap: 7, tipGap: 8 },
};

/** .strong 높이 40 padding 0 10 0 8 radius 12 gap 10 · 바탕 veil .06 테 glass-line · TODO_ICON 자리 28 X 상자 · 속성 기호 26 */
export const STRONG = { h: 40, pad: [0, 10, 0, 8] as [number, number, number, number], radius: 12, gap: 10, todo: 28, icon: 26, tipGap: 8 };

/** .btn 높이 50 padding 0 22 radius 12 gap 10 기호 18 · .go 최소 폭 150, 판은 정본 plateStyle(0054), 포커스 테 2 ink2 바깥 4
 *  .kbd padding 2 6 radius 5 테 glass-line */
export const BTN = { h: 50, padX: 22, radius: 12, gap: 10, icon: 18, goW: 150, focus: { width: 2, offset: 4 }, kbd: { pad: [2, 6, 2, 6] as [number, number, number, number], radius: 5 } };
