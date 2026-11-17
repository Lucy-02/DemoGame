// 진화 컷신(0037) 값. 미리보기(tools/evolution-preview)에서 Lucy가 본 값 그대로 옮긴 임시 값이에요 (Lucy가 고르면 토큰으로 옮겨요).
// 미리보기는 1280×720이었고 세로 자리는 화면 높이에 대한 비율이라, 게임 화면(1280×800)에서도 같은 식으로 놓아요.
import { FRAME } from "../run/layout";

const W = FRAME.w, H = FRAME.h;
const CX = W / 2, CY = H * 0.56;

/** 박자: 1 유체 희미해짐 → 2 가운데 그림자 → 3 속성 · 역할 → 4 성체 실루엣 → 5 공개. 박자 시간(ms)과 박자 안 움직임 시간 비율 */
export const BEAT = { last: 5, ms: [0, 700, 800, 1300, 1000, 1500], move: 0.7, wipe: 0.8, start: 300, roleIn: { ms: 700, delay: 150 } };

export const EVO = {
  w: W, h: H, cx: CX, cy: CY,
  bg: "#141214", sil: "#0b0a0c", ink: "#f4eef2", ink2: "#cfc6cc", chipBg: "#1d1a1ecc",
  /** 속성 빛 색. 미리보기에 있던 두 속성만 정해져 있고, 나머지는 속성 기호 색(palette.el)을 써요 */
  glow: { fire: "#ff7a4d", water: "#8ec2ff" } as Record<string, string | undefined>,
  bgGlow: { w: W * 1.3, h: H * 1.5, alpha: [0.12, 0.08, 0.06, 0.06, 0.08, 0.2] },
  shade: { y: CY - 60, w: 760, h: 860, alpha: [0, 0.3, 0.75, 0.75, 0.7, 0] },
  zone: { y: CY - 60, w: 560, h: 700, alpha: [0, 0, 0.5, 0.55, 0.6, 0.25] },
  vignette: { radius: 0.75, strength: [0.25, 0.35, 0.45, 0.45, 0.45, 0.3] },
  motes: { lifespan: 9000, frequency: 600, speedY: [-40, -12], speedX: [-8, 8], scale: [0.08, 0.22], alpha: 0.5 },
  baby: { h: 330, y: CY + 150, alpha: [1, 0.5, 0.35, 0.3, 0, 0], shrink: 0.98, breathe: { scale: 1.015, ms: 1400 } },
  adult: { h: 640, y: CY + 300, closeH: 1180, closeY: H + 520, silShrink: 0.96, glow: { strength: 3, quality: 10, distance: 12, to: 5 }, wipe: 0.18 },
  /** 속성 · 역할 기호 (가운데 좌우 72), 아래 한글 이름 */
  crest: { dx: -72, y: CY - 90, size: 123, alpha: 0.95 },
  role: { dx: 72, y: CY - 90, size: 115, alpha: 0.95 },
  label: { y: CY - 2, size: "26px" },
  /** 배경 무대: 발판 높이 비율, 성체 키가 배경 높이에서 차지하는 비율, 살짝 누르는 색, 가장자리 정리(깎기 · 번짐 px, 누끼 전 회색 바탕) */
  stage: { footY: 0.88, adultFrac: 0.75, tint: 0xd4d0d8, choke: 1, feather: 1, matteGray: 222 },
  /** 이름 띠: 왼쪽 아래. 칩 줄 · 이름 */
  band: { x: 56, bottom: 70, chipY: -64, chipGap: 8, chipPad: { x: 10, y: 5 }, chip: "17px", nameY: -4, name: "40px" },
  /** 이름 띠 뒤 사선 흐림: 세기 · 반복, 흐림이 끝나는 점과 꽉 찬 흐림을 유지하는 비율 */
  bandBlur: { strength: 1.5, steps: 6, reach: [W * 0.5, H * 0.25, 0.35] as [number, number, number] },
};
