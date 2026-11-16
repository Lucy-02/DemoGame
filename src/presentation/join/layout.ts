// 깃들기 화면 배치 (0078 J1). 깃들기 · 출전 준비 J1 시안(https://claude.ai/artifact/FsL7WxvqmjcMg4cNtVamHw)에서 잰 임시 값이에요 (TODO_TOKEN).
// 색은 palette, 글자 크기는 text.join, 박자 시간은 motion.join 토큰에서 가져와요.

/** .cand 470×630 radius 22, left 95 · 715, top 70 · 고른 후보 테 1.5 자두빛 · 고르지 않은 후보 .42
 *  .spot 520×560 위 -70, radial(42% 40% at 50% 62%) ink .10 (고르면 .18). 발밑 그림자 타원은 없어요 (0014) */
export const CAND = {
  y: 70, w: 470, h: 630, xs: [95, 715] as const, radius: 22, ring: 1.5, dim: 0.42,
  spot: { dy: -70, w: 520, h: 560, rx: 0.42, ry: 0.4, cy: 0.62, alpha: 0.1, alphaOn: 0.18 },
  /** 그림 아래 끝 (후보 위에서). 크기는 정령 관리 화면과 1:1 (spirits/artFit ART.whole) */
  art: { bottom: 350 },
  /** 그림이 없는 정령: 실루엣 기호 190×228, 아래 끝 후보 위에서 350 */
  sil: { w: 190, h: 228 },
  /** .info top 384 가운데 gap 26 · .who gap 14 padding-top 6 min-width 150 · 기호 24 gap 14 */
  info: { top: 384, gap: 26, whoGap: 14, whoTop: 6, whoW: 150, icon: 24, iconGap: 14 },
  /** 대표 카드 폭 150 */
  card: { w: 150 },
};

/** .chip 높이 30 radius 15 padding 0 12 gap 6 · 바탕 veil .08 테 1 glass-line · 호버 테 ink2 바탕 veil .14 · 앞 기호 16
 *  성격 칩과 새 카드 칩이 같은 조각이에요 (0078 고칠 점 4) */
export const CHIP = { h: 30, radius: 15, padX: 12, gap: 6, ring: 1, icon: 16 };

/** .cta 아래 38 가운데, 높이 52 최소 폭 200 padding 0 30 radius 12 · 밝은 유리 판 veil .16 테 veil .5 · 꺼짐 veil .04 테 glass-line
 *  .focus 바깥 4 떨어진 테 2 ink2 */
export const CTA = { bottom: 38, h: 52, minW: 200, padX: 30, radius: 12, ring: 1, focus: { width: 2, offset: 4 } };

/** 연달아 둘째 깃들기에만 (0078 고칠 점 3): .pips 위 28 가운데 gap 12 · 지름 38 · 지금 칸 테 2 자두빛 + 바깥 4 자두빛 .18 · 잇는 선 28×1 */
export const PIPS = { top: 28, d: 38, gap: 12, line: 28, ring: 2, glow: 4, glowAlpha: 0.18, faceAlpha: 0.85 };

/** 깃듦 박자 (.beat): 그림은 가운데 x 640, 아래 끝 400으로 옮겨 서요. 뛰어오름 12
 *  .halo 가운데 (640, 250) 지름 620, 0.6배에서 커짐 · radial accHi .22 → .08 45% → 0 70%
 *  .who3 위 420 gap 14, 기호 28, 10 아래에서 떠오름 · .party 위 600 지름 46 gap 14, 새 얼굴은 30 위에서 내려앉고 테 2 자두빛 · 빈 자리 점선 veil .25 */
export const BEAT = {
  x: 640, bottom: 400, hop: 12,
  halo: { y: 250, d: 620, from: 0.6, a0: 0.22, a1: 0.08, at1: 0.45, at2: 0.7 },
  hero: { top: 420, gap: 14, icon: 28, rise: 10 },
  party: { top: 600, d: 46, gap: 14, drop: 30, ring: 2, empty: 0.25, dash: 4 },
};

/** 성격 말풍선: 칩 아래 8 */
export const TIP = { gap: 8 };
