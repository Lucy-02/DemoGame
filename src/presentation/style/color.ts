// 토큰의 CSS 색 문자열을 Phaser가 쓰는 숫자 색 + 투명도로 바꿔요.

export interface Rgba {
  color: number;
  alpha: number;
}

const HEX = /^#([0-9a-f]{6})$/i;
const RGBA = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i;

export function rgba(css: string): Rgba {
  const hex = HEX.exec(css);
  if (hex) return { color: parseInt(hex[1], 16), alpha: 1 };
  const m = RGBA.exec(css);
  if (m) {
    const [r, g, b] = [m[1], m[2], m[3]].map(Number);
    return { color: (r << 16) | (g << 8) | b, alpha: m[4] === undefined ? 1 : Number(m[4]) };
  }
  throw new Error(`색으로 읽을 수 없어요: ${css}`);
}

/** Phaser Text의 color 속성용 CSS 문자열 (그대로 통과). 타입만 좁혀요. */
export const cssColor = (css: string) => css;
